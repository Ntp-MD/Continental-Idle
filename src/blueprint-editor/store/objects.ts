import type { ObjectData, AssetDef, Rotation, FloorData, Rect } from '../domain/types'
import { resolveObjectDef } from '../domain/types'
import { findAssetCached } from '../assets/assetUtils'
import { resolveBuildingArea, normalizeObject } from '../domain/geometry'
import { objectOverlapsAny, rectHitsStructure, recalcCollapsed, unionRects } from '../domain/collision'
import type { BlueprintStore, MoveAttempt } from './state'
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
	const tileSize = () => state.layout.canvas.tileSize

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

	// One gate for every placement: another object's body, or painted wall and door cells.
	function placementBlocked(rect: Rect, type: string, excludeIds?: string | string[]): boolean {
		const floor = currentFloor.value
		if (objectOverlapsAny(floor?.objects ?? [], assetMap(), rect, excludeIds, findAssetCached(assetMap(), type))) return true
		return rectHitsStructure(floor, rect, tileSize())
	}

	// The rect an object of this type actually lands on. `normalizeObject` resolves the true
	// asset footprint (raw pixels, not tile-snapped) and rounds the origin, so the gate has to
	// see that rect - gating a pre-normalized one clears space the object never occupies and
	// misses the strip it does. Callers write the result back over the normalized object.
	function placementRect(type: string, x: number, y: number, assets?: Map<string, AssetDef>): Rect | null {
		const lookup = assets ?? assetMap()
		if (!findAssetCached(lookup, type)) return null
		const probe: ObjectData = { id: '', type, rotation: 0, x, y, w: 0, h: 0 }
		normalizeObject(probe, tileSize(), lookup)
		return clamp({ x: probe.x, y: probe.y, w: probe.w, h: probe.h })
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
			const asset: AssetDef = { origin: 'drawn', id: genAssetId('custom', safeName, c => state.assetRegistry.some(a => a.id === c)), name: safeName, w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)), defaultFillColor: '#ffffff' }
			initAssetFields(asset)
			// The draft asset is not in the registry yet, so it needs its own lookup.
			const assets = new Map([...assetMap(), [asset.id, asset]])
			const rect = placementRect(asset.id, x, y, assets)
			if (!rect || placementBlocked(rect, asset.id)) {
				toast.warning('Cannot place object - it overlaps another object or wall geometry')
				return null
			}
			const object: ObjectData = { id: genId('obj'), type: asset.id, rotation: 0, ...rect }
			normalizeObject(object, tileSize(), assets)
			Object.assign(object, rect)
			state.assetRegistry.push(asset)
			floor.objects.push(object)
			store.setSelection([{ type: 'object', id: object.id }])
			return { asset, object }
		})
	}

	async function addObject(type: string, x: number, y: number): Promise<ObjectData | null> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return null
			if (floor.objects.length >= MAX_OBJECTS_PER_FLOOR) { toast.warning(`Object limit reached for this floor (${MAX_OBJECTS_PER_FLOOR})`); return null }
			const rect = placementRect(type, x, y)
			if (!rect) return null
			// A loaded layout can still end up with no interior - migrate and the data-file
			// schema bound the street band by tile count only, never against the canvas - and a
			// clamped rect of zero size would pass the gate (it overlaps nothing and covers no
			// cells) while producing an invisible object.
			if (rect.w <= 0 || rect.h <= 0) {
				toast.warning('Cannot place object - the street band leaves no floor area at this canvas size')
				return null
			}
			if (placementBlocked(rect, type)) {
				toast.warning('Cannot place object - it overlaps another object or wall geometry')
				return null
			}
			const obj: ObjectData = { id: genId('obj'), type, rotation: 0, ...rect }
			normalizeObject(obj, tileSize(), assetMap())
			Object.assign(obj, rect)
			floor.objects.push(obj)
			store.setSelection([{ type: 'object', id: obj.id }])
			await saveBlueprintData()
			return obj
		})
	}

	function canPlaceObject(type: string, x: number, y: number): boolean {
		const rect = placementRect(type, x, y)
		if (!rect || rect.w <= 0 || rect.h <= 0) return false
		return !placementBlocked(rect, type)
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
				recalcCollapsed(floor, assetMap(), tileSize(), unionRects(removed) ?? undefined)
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
			recalcCollapsed(floor, assetMap(), tileSize(), deletedRect)
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
		// A drag stops dead instead of resting inside painted geometry. An object already
		// buried by paint - legacy layout, or a wall painted over it - is always allowed to
		// move, otherwise the only way out is deleting it.
		const floor = currentFloor.value
		const buried = (rect: Rect) => rectHitsStructure(floor, rect, tileSize())
		const moved = members.map(member => ({ x: member.x + dx, y: member.y + dy, w: member.w, h: member.h }))
		if (moved.some((rect, index) => !buried(members[index]!) && buried(rect))) return false
		for (const member of members) {
			member.x += dx
			member.y += dy
		}
		return dx !== 0 || dy !== 0
	}

	// Returns why the attempt ended the way it did. The pointer-drag caller runs on every
	// mousemove and must stay silent, while the keyboard nudge is one action per keypress and
	// owes the user a reason - `moveMembersTo` refuses before mutating, so nothing moves and
	// `commitMove` then re-checks an unchanged rect and never reports it.
	function moveSelectedTo(x: number, y: number): MoveAttempt {
		const floor = currentFloor.value
		if (!floor) return 'none'

		if (state.selectionState.items.length > 1) {
			const members = multiSelectionMembers(floor)
			const primary = state.selectionState.primary
			const anchor = primary ? floor.objects.find(object => object.id === primary.id) : null
			if (!anchor || members.length === 0) return 'none'
			if (members.some(member => member.locked)) return 'locked'
			return moveMembersTo(members, anchor, x, y) ? 'moved' : 'blocked'
		}

		const primary = state.selectionState.primary
		if (!primary) return 'none'
		const obj = selectedObject()
		if (!obj) return 'none'
		if (obj.locked) return 'locked'
		return moveMembersTo(objectMoveMembers(obj), obj, x, y) ? 'moved' : 'blocked'
	}

	/**
	 * The objects a grab on the current selection would move. One definition, because the gesture,
	 * the release and the commit must not disagree about who is part of a drag.
	 */
	function dragMembers(floor: { objects: ObjectData[] }): ObjectData[] {
		return state.selectionState.items.length > 1
			? multiSelectionMembers(floor)
			: selectedObject() ? objectMoveMembers(selectedObject()!) : []
	}

	// `moveMembersTo` mutates live objects on every animation frame and nothing is committed until the
	// release, so an aborted gesture can only be undone from a snapshot - the undo history has no entry
	// for it yet, and the file was never written mid-drag.
	let moveGesture: { id: string; x: number; y: number }[] | null = null

	function beginMoveGesture(): void {
		const floor = currentFloor.value
		moveGesture = floor ? dragMembers(floor).map(member => ({ id: member.id, x: member.x, y: member.y })) : null
	}

	/** Put the pre-gesture positions back. False when there is no gesture to undo. */
	function cancelMoveGesture(): boolean {
		const floor = currentFloor.value
		if (!floor || !moveGesture) return false
		const members = dragMembers(floor)
		for (const before of moveGesture) {
			const member = members.find(candidate => candidate.id === before.id)
			if (member) {
				member.x = before.x
				member.y = before.y
			}
		}
		moveGesture = null
		return true
	}

	/** The release owns the gesture now: whatever is on the floor is what the user asked for. */
	function endMoveGesture(): void {
		moveGesture = null
	}

	async function commitMove(): Promise<void> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return
			const members = dragMembers(floor)
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
			if (members.some(member => placementBlocked(member, member.type, ids))) {
				for (const old of oldPositions) {
					const member = members.find(candidate => candidate.id === old.id)
					if (member) { member.x = old.x; member.y = old.y }
				}
				toast.warning('Cannot move there - it overlaps another object or wall geometry')
			}
			const beforeMove = unionRects(oldPositions.map(old => {
				const moved = members.find(candidate => candidate.id === old.id)
				return { x: old.x, y: old.y, w: moved?.w ?? 0, h: moved?.h ?? 0 }
			}))
			const afterMove = unionRects(members)
			const movedBounds = beforeMove && afterMove ? unionRects([beforeMove, afterMove]) ?? undefined : (beforeMove ?? afterMove) ?? undefined
			recalcCollapsed(floor, assetMap(), tileSize(), movedBounds)
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
			if (placementBlocked(rect, o.type, o.id)) {
				toast.warning('Cannot rotate - would overlap another object or wall geometry')
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
			if (cf) recalcCollapsed(cf, assetMap(), tileSize(), unionRects([prevRect, { x: o.x, y: o.y, w: o.w, h: o.h }]) ?? undefined)
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
		placementBlocked, placementRect, deleteSelected, moveSelectedTo, commitMove, rotateSelected,
		beginMoveGesture, cancelMoveGesture, endMoveGesture,
		linkObjects, unlinkObject, toggleObjectLock,
	}
}
