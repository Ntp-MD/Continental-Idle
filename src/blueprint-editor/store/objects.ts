import type { ObjectData, AssetDef, Rotation, FloorData, Rect } from '../domain/types'
import { assetPixelSize, resolveObjectDef } from '../domain/types'
import { findAssetCached } from '../assets/assetUtils'
import { resolveBuildingArea, normalizeObject } from '../domain/geometry'
import { aabbOverlap, objectOverlapsAny, recalcCollapsed, unionRects } from '../domain/collision'
import type { BlueprintStore } from './state'
import { genId, genAssetId } from './storeUtils'
import { MAX_ASSET_TILES, MAX_OBJECTS_PER_FLOOR } from '../limits'

export function createObjectCommands(store: BlueprintStore) {
	const state = store.state
	const toast = store.toast
	const currentFloor = store.currentFloor
	const snap = (value: number, tileSize?: number) => store.snap(value, tileSize)
	const clamp = (rect: Rect) => store.clamp(rect)
	const assetMap = () => store.assetMap()
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)
	const initAssetFields = (asset: AssetDef) => store.initAssetFields(asset)
	const saveBlueprintData = () => store.save()
	const selectedObject = () => store.selectedObject()
	const selectedObjectIds = () => store.selectedObjectIds()
	const clearSelection = () => store.clearSelection()

	function getLinkedObjects(obj: ObjectData): ObjectData[] {
		const floor = currentFloor.value
		if (!floor || !obj.linkGroupId) return []
		return floor.objects.filter(o => o.id !== obj.id && o.linkGroupId === obj.linkGroupId)
	}

	function dissolveGroupsIfSmall(floor: FloorData, groupIds: ReadonlySet<string>): void {
		if (groupIds.size === 0) return
		const counts = new Map<string, number>()
		for (const o of floor.objects) {
			if (o.linkGroupId && groupIds.has(o.linkGroupId)) counts.set(o.linkGroupId, (counts.get(o.linkGroupId) ?? 0) + 1)
		}
		for (const o of floor.objects) {
			if (o.linkGroupId && groupIds.has(o.linkGroupId) && (counts.get(o.linkGroupId) ?? 0) < 2) delete o.linkGroupId
		}
	}

	function removeLinkMember(floor: FloorData, id: string): string | null {
		const obj = floor.objects.find(o => o.id === id)
		if (!obj?.linkGroupId) return null
		const groupId = obj.linkGroupId
		delete obj.linkGroupId
		dissolveGroupsIfSmall(floor, new Set([groupId]))
		return groupId
	}

	async function beginDrawnObject(name: string, w: number, h: number, x: number, y: number): Promise<{ asset: AssetDef; object: ObjectData } | null> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return null
			if (floor.objects.length >= MAX_OBJECTS_PER_FLOOR) { toast.warning(`Object limit reached for this floor (${MAX_OBJECTS_PER_FLOOR})`); return null }
			const safeName = name.trim()
			if (!safeName || safeName.length > 512 || !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(x) || !Number.isFinite(y) || w <= 0 || h <= 0 || w > MAX_ASSET_TILES || h > MAX_ASSET_TILES) {
				toast.warning('Drawn asset input is invalid')
				return null
			}
			const t = state.layout.canvas.tileSize
			const asset: AssetDef = { origin: 'drawn', id: genAssetId('custom', safeName, c => state.assetRegistry.some(a => a.id === c)), name: safeName, w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)), defaultFillColor: '#ffffff' }
			initAssetFields(asset)
			const rect = clamp({ x: snap(x), y: snap(y), w: asset.w * t, h: asset.h * t })
			if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
				toast.warning('Cannot place object - overlaps existing object')
				return null
			}
			const object: ObjectData = { id: genId('obj'), type: asset.id, rotation: 0, ...rect }
			normalizeObject(object, t, new Map([...assetMap(), [asset.id, asset]]))
			state.assetRegistry.push(asset)
			floor.objects.push(object)
			store.setSelection([{ type: 'object', id: object.id }])
			return { asset, object }
		})
	}

	async function addObject(type: string, x: number, y: number): Promise<ObjectData | null> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			const asset = findAssetCached(assetMap(), type)
			if (!floor || !asset) return null
			if (floor.objects.length >= MAX_OBJECTS_PER_FLOOR) { toast.warning(`Object limit reached for this floor (${MAX_OBJECTS_PER_FLOOR})`); return null }
			const t = state.layout.canvas.tileSize
			const { w: aw, h: ah } = assetPixelSize(asset, t)
			const w = snap(aw)
			const h = snap(ah)
			const rect = clamp({ x: snap(x), y: snap(y), w, h })

			if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
				toast.warning('Cannot place object - overlaps existing object')
				return null
			}
			const obj: ObjectData = {
				id: genId('obj'), type, rotation: 0,
				x: rect.x, y: rect.y, w: rect.w, h: rect.h,
			}
			normalizeObject(obj, t, assetMap())
			floor.objects.push(obj)
			store.setSelection([{ type: 'object', id: obj.id }])
			await saveBlueprintData()
			return obj
		})
	}

	function canPlaceObject(type: string, x: number, y: number): boolean {
		const asset = findAssetCached(assetMap(), type)
		if (!asset) return false
		const t = state.layout.canvas.tileSize
		const { w: aw, h: ah } = assetPixelSize(asset, t)
		const w = snap(aw)
		const h = snap(ah)
		const rect = clamp({ x: snap(x), y: snap(y), w, h })
		return !objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect)
	}

	async function deleteSelected(): Promise<void> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return

			const objIds = selectedObjectIds()
			if (objIds.length > 0) {
				const ids = objIds.filter(id => {
					const o = floor.objects.find(o => o.id === id)
					return !o?.locked
				})
				if (ids.length === 0) {
					toast.warning('All selected objects are locked')
					return
				}
				if (ids.length < objIds.length) {
					toast.info(`${objIds.length - ids.length} locked object(s) skipped`)
				}
				const idSet = new Set(ids)
				const removed: ObjectData[] = []
				const survivors: ObjectData[] = []
				for (const o of floor.objects) {
					if (idSet.has(o.id)) removed.push(o)
					else survivors.push(o)
				}
				const removedGroupIds = new Set(removed.map(o => o.linkGroupId).filter((id): id is string => !!id))
				floor.objects = survivors
				dissolveGroupsIfSmall(floor, removedGroupIds)
				clearSelection()
				recalcCollapsed(floor, assetMap(), unionRects(removed) ?? undefined)
				const saved = await saveBlueprintData()
				if (saved) toast.success(`${ids.length} object${ids.length === 1 ? '' : 's'} deleted`)
				return
			}

			const primary = state.selectionState.primary
			if (!primary) return
			const o = floor.objects.find(o => o.id === primary.id)
			if (o?.locked) {
				toast.warning('Cannot delete a locked object - unlock first')
				return
			}
			const deletedGroupId = o?.linkGroupId
			const deletedRect: Rect | undefined = o ? { x: o.x, y: o.y, w: o.w, h: o.h } : undefined
			floor.objects = floor.objects.filter(o => o.id !== primary.id)
			if (deletedGroupId) dissolveGroupsIfSmall(floor, new Set([deletedGroupId]))
			clearSelection()
			recalcCollapsed(floor, assetMap(), deletedRect)
			const saved = await saveBlueprintData()
			if (saved) toast.success('Object deleted')
		})
	}

	function objectMoveMembers(obj: ObjectData): ObjectData[] {
		const members: ObjectData[] = [obj]
		const seen = new Set([obj.id])
		for (const linkedObj of getLinkedObjects(obj)) {
			if (!seen.has(linkedObj.id)) {
				seen.add(linkedObj.id)
				members.push(linkedObj)
			}
		}
		return members
	}

	function multiSelectionMembers(floor: { objects: ObjectData[] }): ObjectData[] {
		if (state.selectionState.items.length <= 1) return []
		const members: ObjectData[] = []
		const seen = new Set<string>()
		for (const item of state.selectionState.items) {
			const obj = floor.objects.find(o => o.id === item.id)
			if (!obj) continue
			for (const member of objectMoveMembers(obj)) {
				if (!seen.has(member.id)) {
					seen.add(member.id)
					members.push(member)
				}
			}
		}
		return members
	}

	function moveMembersTo(members: ObjectData[], anchor: ObjectData, x: number, y: number): boolean {
		if (members.some(member => member.locked)) return false
		const minX = Math.min(...members.map(member => member.x))
		const minY = Math.min(...members.map(member => member.y))
		const maxX = Math.max(...members.map(member => member.x + member.w))
		const maxY = Math.max(...members.map(member => member.y + member.h))
		const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
		const b = resolveBuildingArea(state.layout)
		const requestedDx = x - anchor.x
		const requestedDy = y - anchor.y
		const minDx = b.x - bounds.minX
		const maxDx = (b.x + b.w) - (bounds.minX + bounds.w)
		const minDy = b.y - bounds.minY
		const maxDy = (b.y + b.h) - (bounds.minY + bounds.h)
		const dx = Math.max(minDx, Math.min(requestedDx, maxDx))
		const dy = Math.max(minDy, Math.min(requestedDy, maxDy))
		for (const member of members) {
			member.x += dx
			member.y += dy
		}
		return dx !== 0 || dy !== 0
	}

	function moveSelectedTo(x: number, y: number): void {
		const floor = currentFloor.value
		if (!floor) return

		if (state.selectionState.items.length > 1) {
			const members = multiSelectionMembers(floor)
			const primary = state.selectionState.primary
			const anchor = primary ? floor.objects.find(object => object.id === primary.id) : null
			if (!anchor || members.length === 0 || members.some(member => member.locked)) return
			moveMembersTo(members, anchor, x, y)
			return
		}

		const primary = state.selectionState.primary
		if (!primary) return
		const obj = selectedObject()
		if (!obj || obj.locked) return
		moveMembersTo(objectMoveMembers(obj), obj, x, y)
		obj.collapsed = floor.objects.some(other => other.id !== obj.id && aabbOverlap(obj, other))
	}

	async function commitMove(): Promise<void> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return
			const members = state.selectionState.items.length > 1
				? multiSelectionMembers(floor)
				: selectedObject() ? objectMoveMembers(selectedObject()!) : []
			if (members.length === 0 || members.some(member => member.locked)) return
			const minX = Math.min(...members.map(member => member.x))
			const minY = Math.min(...members.map(member => member.y))
			const maxX = Math.max(...members.map(member => member.x + member.w))
			const maxY = Math.max(...members.map(member => member.y + member.h))
			const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
			const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
			const dx = clamped.x - bounds.minX
			const dy = clamped.y - bounds.minY
			const oldPositions = members.map(member => ({ id: member.id, x: member.x, y: member.y }))
			for (const member of members) {
				member.x += dx
				member.y += dy
			}
			const ids = members.map(member => member.id)
			if (members.some(member => objectOverlapsAny(floor.objects, assetMap(), member, ids))) {
				for (const old of oldPositions) {
					const member = members.find(candidate => candidate.id === old.id)
					if (member) { member.x = old.x; member.y = old.y }
				}
			}
			const beforeMove = unionRects(oldPositions.map(old => {
				const moved = members.find(candidate => candidate.id === old.id)
				return { x: old.x, y: old.y, w: moved?.w ?? 0, h: moved?.h ?? 0 }
			}))
			const afterMove = unionRects(members)
			const movedBounds = beforeMove && afterMove ? unionRects([beforeMove, afterMove]) ?? undefined : (beforeMove ?? afterMove) ?? undefined
			recalcCollapsed(floor, assetMap(), movedBounds)
			await saveBlueprintData()
		})
	}

	async function rotateSelected(): Promise<void> {
		return withStateLock(async () => {
			if (state.selectionState.primary?.type !== 'object') return
			const o = selectedObject()
			if (!o || o.locked) {
				toast.warning('Cannot rotate a locked object - unlock first')
				return
			}
			if (o.linkGroupId) {
				toast.warning('Cannot rotate a linked object - unlink first')
				return
			}
			const rect = clamp({ x: o.x, y: o.y, w: o.h, h: o.w })
			if (objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect, o.id)) {
				toast.warning('Cannot rotate - would overlap another object')
				return
			}
			const prevRect = { x: o.x, y: o.y, w: o.w, h: o.h }
			const nw = o.h
			const nh = o.w
			o.w = nw
			o.h = nh
			o.rotation = ((o.rotation + 90) % 360) as Rotation
			o.x = rect.x
			o.y = rect.y
			if (o.rx) {
				const { tl, tr, br, bl } = o.rx
				o.rx = { tl: bl, tr: tl, br: tr, bl: br }
			}

			const cf = currentFloor.value
			if (cf) recalcCollapsed(cf, assetMap(), unionRects([prevRect, { x: o.x, y: o.y, w: o.w, h: o.h }]) ?? undefined)
			const saved = await saveBlueprintData()
			if (saved) {
				const def = resolveObjectDef(o.rotation, findAssetCached(assetMap(), o.type), { w: o.w, h: o.h })
				const hasWalkData = !!def.walkableGrid && def.walkableGrid.some(row => row.some(cell => !cell))
				toast.info(
					hasWalkData
						? 'Rotated 90deg - walkable/blocked tiles rotated with it. Review in Walkable Grid panel if the layout matters.'
						: 'Rotated 90deg',
				)
			}
		})
	}

	async function linkObjects(ids: string[]): Promise<boolean> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor || ids.length < 2) return false
			const objs = floor.objects.filter(o => ids.includes(o.id))
			if (objs.length < 2) {
				toast.warning('Some selected objects not found on current floor')
				return false
			}
			if (objs.some(o => o.locked)) {
				toast.warning('Cannot link locked objects - unlock first')
				return false
			}

			const groupIds = new Set<string>(objs.map(obj => obj.id))
			for (const obj of objs) {
				for (const linked of getLinkedObjects(obj)) groupIds.add(linked.id)
			}
			const allGroupIds = Array.from(groupIds)
			const linkGroupId = genId('link')
			for (const id of allGroupIds) {
				const obj = floor.objects.find(o => o.id === id)
				if (obj) {
					obj.linkGroupId = linkGroupId
				}
			}
			const saved = await saveBlueprintData()
			if (!saved) return false
			toast.success(`Linked ${allGroupIds.length} objects`)
			return true
		})
	}

	async function unlinkObject(id: string): Promise<boolean> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return false
			const obj = floor.objects.find(o => o.id === id)
			if (!obj || !obj.linkGroupId) return false
			if (obj.locked) {
				toast.warning('Cannot unlink a locked object - unlock first')
				return false
			}

			const groupId = removeLinkMember(floor, id)
			if (!groupId) return false
			const saved = await saveBlueprintData()
			if (!saved) return false
			toast.success('Unlinked object')
			return true
		})
	}

	async function toggleObjectLock(id: string): Promise<void> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return
			const o = floor.objects.find(o => o.id === id)
			if (!o) return
			o.locked = !o.locked
			const saved = await saveBlueprintData()
			if (saved) toast.info(o.locked ? 'Object locked' : 'Object unlocked')
		})
	}

	return {
		getLinkedObjects, dissolveGroupsIfSmall, beginDrawnObject, addObject, canPlaceObject,
		deleteSelected, moveSelectedTo, commitMove, rotateSelected,
		linkObjects, unlinkObject, toggleObjectLock,
	}
}
