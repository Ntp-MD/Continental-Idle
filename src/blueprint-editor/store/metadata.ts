import type { ObjectData, Rect } from '../domain/types'
import { objectOverlapsAny, recalcCollapsed, unionRects } from '../domain/collision'
import type { BlueprintStore } from './state'
import { genId } from './storeUtils'
import { MAX_OBJECTS_PER_FLOOR } from '../limits'

export function createMetadataCommands(store: BlueprintStore) {
	const state = store.state
	const toast = store.toast
	const snap = (value: number, tileSize?: number) => store.snap(value, tileSize)
	const clamp = (rect: Rect) => store.clamp(rect)
	const assetMap = () => store.assetMap()
	const currentFloor = store.currentFloor
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)
	const saveBlueprintData = () => store.save()
	const selectedObjectIds = () => store.selectedObjectIds()

	let clipboard: ObjectData[] | null = null

	function copySelected() {
		const floor = currentFloor.value
		if (!floor) return
		const objIds = selectedObjectIds()
		if (objIds.length > 0) {
			const objIdSet = new Set(objIds)
			clipboard = floor.objects
				.filter(o => objIdSet.has(o.id))
				.map(o => ({ ...o }))
			if (clipboard.length === 0) {
				toast.warning('Nothing to copy')
				return
			}
			toast.info(`Copied ${clipboard.length} object(s)`)
		} else {
			const primary = state.selectionState.primary
			if (primary?.type === 'object') {
				const o = floor.objects.find(o => o.id === primary.id)
				if (o) {
					clipboard = [{ ...o }]
					toast.info('Copied 1 object')
				}
			}
		}
	}

	async function pasteObjects(): Promise<void> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor || !clipboard || clipboard.length === 0) return
			const tileSize = state.layout.canvas.tileSize
			const bounds = unionRects(clipboard)
			const offsetX = bounds && bounds.w > 0 ? Math.ceil(bounds.w / tileSize) * tileSize : tileSize
			const offsetY = bounds && bounds.h > 0 ? Math.ceil(bounds.h / tileSize) * tileSize : tileSize
			const newIds: string[] = []
			const idMap = new Map<string, string>()
			const pendingCopies: ObjectData[] = []
			for (const c of clipboard) {
				const newId = genId('obj')
				idMap.set(c.id, newId)
				const rawX = c.x + offsetX
				const rawY = c.y + offsetY
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
			if (floor.objects.length + pendingCopies.length > MAX_OBJECTS_PER_FLOOR) {
				toast.warning(`Paste would exceed the object limit for this floor (${MAX_OBJECTS_PER_FLOOR})`)
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
			store.setSelection(newIds.map(id => ({ type: 'object' as const, id })))
			recalcCollapsed(floor, assetMap(), unionRects(pendingCopies) ?? undefined)
			await saveBlueprintData()
			toast.success(`Pasted ${newIds.length} object(s)`)
		})
	}

	return { copySelected, pasteObjects }
}
