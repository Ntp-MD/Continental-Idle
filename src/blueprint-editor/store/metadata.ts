import type { ObjectData } from '../domain/types'
import { objectOverlapsAny, recalcCollapsed, unionRects } from '../domain/collision'
import { state, toast, snap, clamp, assetMap, currentFloor } from './state'
import { genId } from './storeUtils'
import { selectedObjectIds } from './selection'
import { saveBlueprintData } from './persistence'

let clipboard: ObjectData[] | null = null

export function copySelected() {
	const floor = currentFloor.value
	if (!floor) return
	const objIds = selectedObjectIds()
	if (objIds.length > 0) {
		const objIdSet = new Set(objIds)
		clipboard = floor.objects
			.filter(o => objIdSet.has(o.id) && !o.isWall)
			.map(o => ({ ...o }))
		if (clipboard.length === 0) {
			toast.warning('Canvas wall objects cannot be copied')
			return
		}
		toast.info(`Copied ${clipboard.length} object(s)`)
	} else {
		const primary = state.selectionState.primary
		if (primary?.type === 'object') {
			const o = floor.objects.find(o => o.id === primary.id)
			if (o && !o.isWall) {
				clipboard = [{ ...o }]
				toast.info('Copied 1 object')
			}
		}
	}
}

export async function pasteObjects(): Promise<void> {
	const floor = currentFloor.value
	if (!floor || !clipboard || clipboard.length === 0) return
	const tileSize = state.layout.canvas.tileSize
	const offset = tileSize
	const newIds: string[] = []
	const idMap = new Map<string, string>()
	const pendingCopies: ObjectData[] = []
	for (const c of clipboard) {
		const newId = genId('obj')
		idMap.set(c.id, newId)
		const rawX = c.x + offset
		const rawY = c.y + offset
		const rect = clamp({ x: snap(rawX), y: snap(rawY), w: c.w, h: c.h })
		if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
			toast.warning(`Skipped pasting "${c.type}" - would overlap existing object`)
			continue
		}
		newIds.push(newId)
		const { locked: _locked, collapsed: _collapsed, linkGroupId: _linkGroupId, ...rest } = c
		const copy: ObjectData = {
			...rest,
			id: newId,
			x: rect.x,
			y: rect.y,
			w: rect.w,
			h: rect.h,
		}
		pendingCopies.push(copy)
	}
	if (pendingCopies.length === 0) {
		toast.warning('Paste failed - all objects would overlap')
		return
	}
	for (const copy of pendingCopies) {
		floor.objects.push(copy)
	}
	const pastedGroups = new Map<string, string>()
	const pastedSet = new Set(newIds)
	for (const c of clipboard) {
		if (!c.linkGroupId) continue
		const newId = idMap.get(c.id)
		if (!newId || !pastedSet.has(newId)) continue
		const sourceGroup = c.linkGroupId
		let groupId = pastedGroups.get(sourceGroup)
		if (!groupId) {
			groupId = genId('link')
			pastedGroups.set(sourceGroup, groupId)
		}
		const obj = floor.objects.find(o => o.id === newId)
		if (obj) obj.linkGroupId = groupId
	}
	if (newIds.length > 1) {
		state.selectionState = { primary: { type: 'object', id: newIds[0] }, items: newIds.map(id => ({ type: 'object' as const, id })) }
	} else {
		state.selectionState = { primary: { type: 'object', id: newIds[0] }, items: [{ type: 'object', id: newIds[0] }] }
	}
	recalcCollapsed(floor, assetMap(), unionRects(pendingCopies) ?? undefined)
	await saveBlueprintData()
	toast.success(`Pasted ${newIds.length} object(s)`)
}
