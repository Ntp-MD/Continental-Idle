import type { ObjectData, Rect } from '../domain/types'
import { recalcCollapsed, unionRects } from '../domain/collision'
import { findAssetCached } from '../assets/assetUtils'
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
					return
				}
			}
			toast.warning('Nothing to copy')
		}
	}

	async function pasteObjects(): Promise<void> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return
			if (!clipboard || clipboard.length === 0) {
				toast.warning('Nothing to paste')
				return
			}
			const tileSize = state.layout.canvas.tileSize
			const bounds = unionRects(clipboard)
			const offsetX = bounds && bounds.w > 0 ? Math.ceil(bounds.w / tileSize) * tileSize : tileSize
			const offsetY = bounds && bounds.h > 0 ? Math.ceil(bounds.h / tileSize) * tileSize : tileSize
			const newIds: string[] = []
			const idMap = new Map<string, string>()
			const pendingCopies: ObjectData[] = []
			for (const c of clipboard) {
				if (floor.objects.length >= MAX_OBJECTS_PER_FLOOR) {
					toast.warning(`Object limit reached for this floor (${MAX_OBJECTS_PER_FLOOR})`)
					break
				}
				const newId = genId('obj')
				idMap.set(c.id, newId)
				const rawX = c.x + offsetX
				const rawY = c.y + offsetY
				const rect = clamp({ x: snap(rawX), y: snap(rawY), w: c.w, h: c.h })
				// The clipboard can outlive the origin it references - deleting the asset,
				// undoing its creation, or importing a different workspace all strand a copy.
				// The placement gate never checks the origin exists, so without this the object
				// is created with no asset, renders blank, and is then silently dropped by
				// migrate's unknown-type filter the next time the file loads.
				if (!findAssetCached(assetMap(), c.type)) {
					toast.warning(`Skipped pasting "${c.type}" - its origin asset no longer exists`)
					continue
				}
				if (store.placementBlocked(rect, c.type)) {
					toast.warning(`Skipped pasting "${c.type}" - would overlap another object or wall geometry`)
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
				// Land each copy before gating the next one: `clamp` pulls out-of-building
				// copies back onto the same boundary, so without this a multi-object paste
				// near an edge stacks them on top of each other.
				pendingCopies.push(copy)
				floor.objects.push(copy)
			}
			if (pendingCopies.length === 0) {
				toast.warning('Paste failed - every object would overlap another object or wall geometry')
				return
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
			recalcCollapsed(floor, assetMap(), tileSize, unionRects(pendingCopies) ?? undefined)
			await saveBlueprintData()
			toast.success(`Pasted ${newIds.length} object(s)`)
		})
	}

	return { copySelected, pasteObjects }
}
