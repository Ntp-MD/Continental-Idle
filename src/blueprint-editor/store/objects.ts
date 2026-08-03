import type { ObjectData, RoomData, Rect, AssetDef, LinkedPart, Rotation, EntityRef, TileState } from '../types'
import { findAssetCached } from '../assetUtils'
import { assetSizeFor } from '../geometry'
import { aabbOverlap, objectOverlapsAny, roomOverlapsAny, recalcCollapsed } from '../collision'
import {
	state, toast, snap, clamp, assetMap,
	currentFloor, isValidColor, withStateLock, initAssetFields,
} from './state'
import { genId } from './utils'
import { selectedRoom, selectedObject, selectedObjectIds, select as selectEntity, clearSelection, toggleMultiSelect as toggleMultiSelectEntity } from './selection'
import { getLinkedObjects } from './utils'
import { saveLayout, saveAssets } from './persistence'

export async function addObject(type: string, x: number, y: number): Promise<ObjectData | null> {
	return withStateLock(async () => {
		if (state.mode === 'wall') return null
		const floor = currentFloor.value
		const asset = findAssetCached(assetMap(), type)
		if (!floor || !asset) return null
		const t = state.layout.canvas.tileSize
		const aw = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
		const ah = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
		const w = snap(aw)
		const h = snap(ah)
		const rect = clamp({ x: snap(x), y: snap(y), w, h })

		if (asset.linkedParts) {
			const parts = asset.linkedParts
			const partRects = parts.map(p => ({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) }))
			const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
			const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
			const overflowX = Math.max(0, groupMaxX - state.layout.canvas.width)
			const overflowY = Math.max(0, groupMaxY - state.layout.canvas.height)
			if (overflowX > 0 || overflowY > 0) {
				for (const pr of partRects) {
					pr.x = Math.max(0, pr.x - overflowX)
					pr.y = Math.max(0, pr.y - overflowY)
				}
			}
			for (const pr of partRects) {
				if (floor.objects.some(o => aabbOverlap(pr, o))) {
					toast.warning('Cannot place - one or more parts overlap existing objects')
					return null
				}
			}
			const newIds: string[] = []
			for (let i = 0; i < parts.length; i++) {
				const p = parts[i]
				const pr = partRects[i]
				const partAsset = findAssetCached(assetMap(), p.type)
				const obj: ObjectData = {
					id: genId('obj'),
					subId: genId('sub'),
					type: p.type,
					rotation: p.rotation ?? 0,
					...pr,
				}
				if (asset.defaultPadding) obj.padding = asset.defaultPadding
				if (asset.defaultRx) obj.rx = { ...asset.defaultRx }
				if (asset.defaultBgColor) obj.fillColor = asset.defaultBgColor
				if (partAsset?.defaultPadding && obj.padding === undefined) obj.padding = partAsset.defaultPadding
				if (partAsset?.defaultRx && obj.rx === undefined) obj.rx = { ...partAsset.defaultRx }
				if (p.padding !== undefined) obj.padding = p.padding
				if (p.rx) obj.rx = { ...p.rx }
				if (p.fillColor) obj.fillColor = p.fillColor
				if (p.label) obj.label = p.label
				if (partAsset?.walkable !== undefined) obj.walkable = partAsset.walkable
				if (partAsset?.entranceRequired !== undefined) obj.entranceRequired = partAsset.entranceRequired
				if (partAsset?.walkableGrid) obj.walkableGrid = partAsset.walkableGrid.map(row => [...row])
				if (partAsset?.tileStates) obj.tileStates = partAsset.tileStates.map(row => [...row])
				if (partAsset?.tileEdges) obj.tileEdges = partAsset.tileEdges.map(row => row.map(e => e ? { ...e } : e))
				if (partAsset?.anchorPoints) obj.anchorPoints = partAsset.anchorPoints.map(p => [...p] as [number, number])
				floor.objects.push(obj)
				newIds.push(obj.id)
			}
			const linkGroupId = genId('link')
			for (const id of newIds) {
				const obj = floor.objects.find(o => o.id === id)!
				obj.linkGroupId = linkGroupId
			}
			state.selectionState = { primary: { type: 'object', id: newIds[0] }, items: newIds.map(id => ({ type: 'object' as const, id })) }
			await saveLayout()
			return floor.objects.find(o => o.id === newIds[0]) ?? null
		}

		if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
			toast.warning('Cannot place object - overlaps existing object')
			return null
		}
		const obj: ObjectData = { id: genId('obj'), subId: genId('sub'), type, rotation: 0, ...rect }
		if (asset.defaultPadding !== undefined) obj.padding = asset.defaultPadding
		if (asset.defaultRx) obj.rx = { ...asset.defaultRx }
		if (asset.defaultBgColor) obj.fillColor = asset.defaultBgColor
		if (asset.walkable !== undefined) obj.walkable = asset.walkable
		if (asset.entranceRequired !== undefined) obj.entranceRequired = asset.entranceRequired
		if (asset.walkableGrid) obj.walkableGrid = asset.walkableGrid.map(row => [...row])
		if (asset.tileStates) obj.tileStates = asset.tileStates.map(row => [...row])
		if (asset.tileEdges) obj.tileEdges = asset.tileEdges.map(row => row.map(e => e ? { ...e } : e))
		if (asset.anchorPoints) obj.anchorPoints = asset.anchorPoints.map(p => [...p] as [number, number])
		floor.objects.push(obj)
		state.selectionState = { primary: { type: 'object', id: obj.id }, items: [{ type: 'object', id: obj.id }] }
		await saveLayout()
		return obj
	})
}

export function canPlaceObject(type: string, x: number, y: number): boolean {
	if (state.mode === 'wall') return false
	const asset = findAssetCached(assetMap(), type)
	if (!asset) return false
	const t = state.layout.canvas.tileSize
	const aw = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
	const ah = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
	const w = snap(aw)
	const h = snap(ah)
	const rect = clamp({ x: snap(x), y: snap(y), w, h })
	if (asset.svg) {
		return !objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect)
	}
	if (asset.linkedParts) {
		const partRects = asset.linkedParts.map(p =>
			({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) })
		)
		const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
		const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
		const overflowX = Math.max(0, groupMaxX - state.layout.canvas.width)
		const overflowY = Math.max(0, groupMaxY - state.layout.canvas.height)
		if (overflowX > 0 || overflowY > 0) {
			for (const pr of partRects) {
				pr.x = Math.max(0, pr.x - overflowX)
				pr.y = Math.max(0, pr.y - overflowY)
			}
		}
		const currentObjects = currentFloor.value?.objects ?? []
		return partRects.every(pr => !objectOverlapsAny(currentObjects, assetMap(), pr))
	}
	return !objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect)
}

export function select(ref: EntityRef | null): void {
	selectEntity(ref)
}

export function toggleMultiSelect(id: string, isRoom = false): void {
	toggleMultiSelectEntity(id, isRoom)
}

export async function deleteSelected(): Promise<void> {
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
			const removedGroupIds = new Set(floor.objects.filter(o => ids.includes(o.id)).map(o => o.linkGroupId).filter((id): id is string => !!id))
			floor.objects = floor.objects.filter(o => !ids.includes(o.id))
			for (const o of floor.objects) {
				if (o.linkGroupId && removedGroupIds.has(o.linkGroupId)) {
					const remaining = floor.objects.filter(candidate => candidate.linkGroupId === o.linkGroupId)
					if (remaining.length < 2) delete o.linkGroupId
				}
			}
			clearSelection()
			recalcCollapsed(floor, assetMap())
			await saveLayout()
			return
		}

		const primary = state.selectionState.primary
		if (!primary) return
		if (primary.type === 'room') {
			const r = floor.rooms.find(r => r.id === primary.id)
			if (r?.locked) {
				toast.warning('Cannot delete a locked hotel wall')
				return
			}
		} else {
			const o = floor.objects.find(o => o.id === primary.id)
			if (o?.locked) {
				toast.warning('Cannot delete a locked object - unlock first')
				return
			}
		}
		if (primary.type === 'room') {
			floor.rooms = floor.rooms.filter(r => r.id !== primary.id)
			for (const o of floor.objects) {
				if (o.roomId === primary.id) delete o.roomId
			}
		} else {
			const delId = primary.id
			const deletedObject = floor.objects.find(o => o.id === delId)
			const deletedGroupId = deletedObject?.linkGroupId
			floor.objects = floor.objects.filter(o => o.id !== delId)
			if (deletedGroupId) {
				const remainingGroup = floor.objects.filter(o => o.linkGroupId === deletedGroupId)
				if (remainingGroup.length <= 1) {
					for (const member of remainingGroup) delete member.linkGroupId
				}
			}
		}
		clearSelection()
		recalcCollapsed(floor, assetMap())
		await saveLayout()
	})
}

function roomMoveMembers(roomId: string, floor: { rooms: RoomData[]; objects: ObjectData[] }): Array<RoomData | ObjectData> {
	const room = floor.rooms.find(r => r.id === roomId)
	if (!room) return []
	return [room, ...floor.objects.filter(o => o.roomId === roomId)]
}

function objectMoveMembers(obj: ObjectData, floor: { rooms: RoomData[]; objects: ObjectData[] }): Array<RoomData | ObjectData> {
	const members: Array<RoomData | ObjectData> = [obj]
	const seen = new Set([obj.id])
	const linked = getLinkedObjects(obj)
	for (const linkedObj of linked) {
		if (!seen.has(linkedObj.id)) {
			seen.add(linkedObj.id)
			members.push(linkedObj)
		}
	}
	if (obj.roomId) {
		for (const member of roomMoveMembers(obj.roomId, floor)) {
			const id = member.id
			if (!seen.has(id)) {
				seen.add(id)
				members.push(member)
			}
		}
	}
	return members
}

function multiSelectionMembers(floor: { rooms: RoomData[]; objects: ObjectData[] }): Array<RoomData | ObjectData> {
	const sel = state.selectionState
	if (sel.items.length <= 1) return []
	const members: Array<RoomData | ObjectData> = []
	const seen = new Set<string>()
	const add = (member: RoomData | ObjectData) => {
		if (!seen.has(member.id)) {
			seen.add(member.id)
			members.push(member)
		}
	}
	for (const item of sel.items) {
		if (item.type === 'room') {
			for (const member of roomMoveMembers(item.id, floor)) add(member)
		} else {
			const obj = floor.objects.find(o => o.id === item.id)
			if (obj) add(obj)
		}
	}
	return members
}

function moveMembersTo(members: Array<RoomData | ObjectData>, anchor: RoomData | ObjectData, x: number, y: number): boolean {
	if (members.some(member => member.locked)) return false
	const minX = Math.min(...members.map(member => member.x))
	const minY = Math.min(...members.map(member => member.y))
	const maxX = Math.max(...members.map(member => member.x + member.w))
	const maxY = Math.max(...members.map(member => member.y + member.h))
	const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
	const { width, height } = state.layout.canvas
	const requestedDx = x - anchor.x
	const requestedDy = y - anchor.y
	const minDx = -bounds.minX
	const maxDx = width - (bounds.minX + bounds.w)
	const minDy = -bounds.minY
	const maxDy = height - (bounds.minY + bounds.h)
	const dx = Math.max(minDx, Math.min(requestedDx, maxDx))
	const dy = Math.max(minDy, Math.min(requestedDy, maxDy))
	for (const member of members) {
		member.x += dx
		member.y += dy
	}
	return dx !== 0 || dy !== 0
}

export function moveSelectedTo(x: number, y: number): void {
	const floor = currentFloor.value
	if (!floor) return

	if (state.selectionState.items.length > 1) {
		const members = multiSelectionMembers(floor)
		const primary = state.selectionState.primary
		const anchor = primary
			? (primary.type === 'room'
				? floor.rooms.find(room => room.id === primary.id)
				: floor.objects.find(object => object.id === primary.id))
			: null
		if (!anchor || members.length === 0 || members.some(member => member.locked)) return
		moveMembersTo(members, anchor, x, y)
		return
	}

	const primary = state.selectionState.primary
	if (!primary) return
	if (primary.type === 'room') {
		const room = selectedRoom()
		if (!room || room.locked) return
		moveMembersTo(roomMoveMembers(room.id, floor), room, x, y)
		return
	}

	const obj = selectedObject()
	if (!obj || obj.locked) return
	moveMembersTo(objectMoveMembers(obj, floor), obj, x, y)
	obj.collapsed = floor.objects.some(other => other.id !== obj.id && aabbOverlap(obj, other))
}

export async function commitMove(): Promise<void> {
	const floor = currentFloor.value
	if (!floor) return

	if (state.selectionState.items.length > 1) {
		const members = multiSelectionMembers(floor)
		const movable = members.filter(member => !member.locked)
		let moveRect: Rect | undefined
		if (movable.length > 0 && movable.length === members.length) {
			const minX = Math.min(...movable.map(member => member.x))
			const minY = Math.min(...movable.map(member => member.y))
			const maxX = Math.max(...movable.map(member => member.x + member.w))
			const maxY = Math.max(...movable.map(member => member.y + member.h))
			const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
			const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
			moveRect = clamped
			const dx = clamped.x - bounds.minX
			const dy = clamped.y - bounds.minY
			const oldPositions = movable.map(member => ({ id: member.id, x: member.x, y: member.y }))
			for (const member of movable) {
				member.x += dx
				member.y += dy
			}
			const objects = movable.filter((member): member is ObjectData => 'type' in member)
			const rooms = movable.filter((member): member is RoomData => 'label' in member && !('type' in member))
			const objectIds = objects.map(object => object.id)
			const hasObjectOverlap = objects.some(object => objectOverlapsAny(floor.objects, assetMap(), object, objectIds))
			const hasRoomOverlap = rooms.some(room => roomOverlapsAny(floor.rooms, room, room.id))
			if (hasObjectOverlap || hasRoomOverlap) {
				for (const old of oldPositions) {
					const member = movable.find(candidate => candidate.id === old.id)
					if (member) {
						member.x = old.x
						member.y = old.y
					}
				}
				moveRect = undefined
			}
		}
		recalcCollapsed(floor, assetMap(), moveRect)
		await saveLayout()
		return
	}

	const primary = state.selectionState.primary
	if (!primary) return

	const selectedMembers = primary.type === 'room'
		? roomMoveMembers(primary.id, floor)
		: selectedObject() ? objectMoveMembers(selectedObject()!, floor) : []
	const movable = selectedMembers.filter(member => !member.locked)
	let reverted = false
	if (movable.length > 0) {
		const minX = Math.min(...movable.map(member => member.x))
		const minY = Math.min(...movable.map(member => member.y))
		const maxX = Math.max(...movable.map(member => member.x + member.w))
		const maxY = Math.max(...movable.map(member => member.y + member.h))
		const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
		const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
		const dx = clamped.x - bounds.minX
		const dy = clamped.y - bounds.minY
		const oldPositions = movable.map(member => ({ id: member.id, x: member.x, y: member.y }))

		for (const member of movable) {
			member.x += dx
			member.y += dy
		}

		const room = movable.find((member): member is RoomData => 'label' in member && !('type' in member))
		const objectMembers = movable.filter((member): member is ObjectData => 'type' in member)
		const groupIds = objectMembers.map(member => member.id)
		const roomOverlap = room ? roomOverlapsAny(floor.rooms, room, room.id) : false
		const objectOverlap = objectMembers.some(member => objectOverlapsAny(floor.objects, assetMap(), member, groupIds))

		if (roomOverlap || objectOverlap) {
			for (const old of oldPositions) {
				const member = movable.find(candidate => candidate.id === old.id)
				if (member) {
					member.x = old.x
					member.y = old.y
				}
			}
			reverted = true
		}
	}

	const movedObj = selectedObject()
	recalcCollapsed(floor, assetMap(), reverted ? undefined : movedObj ? { x: movedObj.x, y: movedObj.y, w: movedObj.w, h: movedObj.h } : undefined)
	await saveLayout()
}

export async function rotateSelected(): Promise<void> {
	return withStateLock(async () => {
		if (state.selectionState.primary?.type !== 'object') return
		const o = selectedObject()
		if (!o) return
		if (o.locked) {
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
		if (o.walkableGrid && o.walkableGrid.length > 0) {
			const rows = o.walkableGrid.length
			const cols = o.walkableGrid[0].length
			const rotated: boolean[][] = []
			for (let r = 0; r < cols; r++) {
				rotated[r] = []
				for (let c = 0; c < rows; c++) {
					rotated[r][c] = o.walkableGrid[rows - 1 - c][r]
				}
			}
			o.walkableGrid = rotated
		}
		if (o.tileStates && o.tileStates.length > 0) {
			const rows = o.tileStates.length
			const cols = o.tileStates[0].length
			const rotated: TileState[][] = []
			for (let r = 0; r < cols; r++) {
				rotated[r] = []
				for (let c = 0; c < rows; c++) {
					rotated[r][c] = o.tileStates[rows - 1 - c][r]
				}
			}
			o.tileStates = rotated
		}
		const cf = currentFloor.value
		if (cf) recalcCollapsed(cf, assetMap())
		await saveLayout()
	})
}

export async function updateObjectProps(patch: Partial<ObjectData>): Promise<boolean> {
	return withStateLock(async () => {
		const o = selectedObject()
		if (!o) return false
		if (o.locked && patch.locked === undefined) {
			toast.warning('Object is locked - unlock to edit properties')
			return false
		}
		if (patch.fillColor !== undefined && !isValidColor(patch.fillColor)) {
			toast.warning('Invalid fill color')
			return false
		}
		const needsSize = patch.x !== undefined || patch.y !== undefined
		const sz = assetSizeFor(o.type, o.rotation, state.layout.canvas.tileSize, assetMap())
		const w = sz?.w ?? o.w
		const h = sz?.h ?? o.h
		const rect = clamp({
			x: patch.x ?? o.x, y: patch.y ?? o.y,
			w, h,
		})
		if (needsSize && objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect, o.id)) {
			return false
		}
		const changed = (patch.x !== undefined && o.x !== rect.x) ||
			(patch.y !== undefined && o.y !== rect.y) ||
			(needsSize && (o.w !== w || o.h !== h)) ||
			(patch.radius !== undefined && o.radius !== patch.radius) ||
			(patch.rx !== undefined && o.rx !== patch.rx) ||
			(patch.labelPadding !== undefined && o.labelPadding !== patch.labelPadding) ||
			(patch.padding !== undefined && o.padding !== patch.padding) ||
			(patch.fillColor !== undefined && (o.fillColor ?? '') !== (patch.fillColor || '')) ||
			(patch.locked !== undefined && o.locked !== patch.locked) ||
			(patch.label !== undefined && (o.label ?? '') !== (patch.label || '')) ||
			(patch.walkable !== undefined && (o.walkable ?? false) !== patch.walkable) ||
			(patch.entranceRequired !== undefined && (o.entranceRequired ?? false) !== patch.entranceRequired) ||
			(patch.anchorPoints !== undefined)
		if (!changed) return true
		if (patch.x !== undefined) o.x = rect.x
		if (patch.y !== undefined) o.y = rect.y
		if (needsSize) {
			o.w = w
			o.h = h
		}
		if (patch.radius !== undefined) o.radius = patch.radius
		if (patch.rx !== undefined) o.rx = patch.rx
		if (patch.labelPadding !== undefined) o.labelPadding = patch.labelPadding
		if (patch.padding !== undefined) o.padding = patch.padding
		if (patch.fillColor !== undefined) o.fillColor = patch.fillColor || undefined
		if (patch.locked !== undefined) o.locked = patch.locked
		if (patch.label !== undefined) o.label = patch.label || undefined
		if (patch.walkable !== undefined) o.walkable = patch.walkable
		if (patch.entranceRequired !== undefined) o.entranceRequired = patch.entranceRequired
		if (patch.anchorPoints !== undefined) o.anchorPoints = patch.anchorPoints
		const cf = currentFloor.value
		if (cf) recalcCollapsed(cf, assetMap())
		await saveLayout()
		return true
	}).catch(e => {
		if (e instanceof Error && e.message === 'Operation in progress') {
			toast.warning('Operation in progress')
			return false
		}
		throw e
	})
}

export async function createLinkedAssetFromSelection(name?: string): Promise<string | null> {
	const floor = currentFloor.value
	if (!floor) return null
	const ids = selectedObjectIds()
	if (ids.length < 2) {
		toast.warning('Select at least 2 objects first (Shift+click)')
		return null
	}

	const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
	if (objs.length < 2) return null
	if (objs.some(o => o.locked)) {
		toast.warning('Cannot link locked objects - unlock first')
		return null
	}

	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
	for (const obj of objs) {
		minX = Math.min(minX, obj.x)
		minY = Math.min(minY, obj.y)
		maxX = Math.max(maxX, obj.x + obj.w)
		maxY = Math.max(maxY, obj.y + obj.h)
	}
	minX = snap(Math.round(minX))
	minY = snap(Math.round(minY))
	maxX = snap(Math.round(maxX))
	maxY = snap(Math.round(maxY))

	const totalW = maxX - minX
	const totalH = maxY - minY
	const t = state.layout.canvas.tileSize

	const linkedParts: LinkedPart[] = objs.map(obj => {
		const part: LinkedPart = {
			type: obj.type,
			dx: snap(Math.round(obj.x - minX)),
			dy: snap(Math.round(obj.y - minY)),
			w: snap(Math.round(obj.w)),
			h: snap(Math.round(obj.h)),
			rotation: obj.rotation,
		}
		if (obj.padding !== undefined) part.padding = obj.padding
		if (obj.rx) part.rx = { ...obj.rx }
		if (obj.fillColor) part.fillColor = obj.fillColor
		if (obj.label) part.label = obj.label
		return part
	})

	const safeName = (name && name.trim()) || `Linked Set ${objs.length}`
	const assetId = genId('linked')
	const assetDef: AssetDef = {
		origin: 'linked',
		id: assetId,
		name: safeName,
		w: Math.round(totalW / t),
		h: Math.round(totalH / t),
		linkedParts,
	}

	state.assetRegistry.push(assetDef)

	toast.success(`Created "${safeName}" linked asset`)
	await saveAssets()
	return assetId
}

export async function linkObjects(ids: string[]): Promise<boolean> {
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
	toast.success(`Linked ${allGroupIds.length} objects`)
	await saveLayout()
	return true
}

export async function unlinkObject(id: string): Promise<boolean> {
	const floor = currentFloor.value
	if (!floor) return false
	const obj = floor.objects.find(o => o.id === id)
	if (!obj || !obj.linkGroupId) return false
	if (obj.locked) {
		toast.warning('Cannot unlink a locked object - unlock first')
		return false
	}

	const groupId = obj.linkGroupId
	for (const member of floor.objects) {
		if (member.linkGroupId === groupId) delete member.linkGroupId
	}
	toast.success('Unlinked object')
	await saveLayout()
	return true
}

export async function linkObjectToRoom(objectId: string, roomId: string): Promise<boolean> {
	const floor = currentFloor.value
	if (!floor) return false
	const obj = floor.objects.find(o => o.id === objectId)
	const room = floor.rooms.find(r => r.id === roomId)
	if (!obj || !room) {
		toast.warning('Object or room not found')
		return false
	}
	if (obj.locked) {
		toast.warning('Cannot link a locked object')
		return false
	}
	obj.roomId = room.id
	toast.success('Object linked to room')
	await saveLayout()
	return true
}

export async function linkObjectsToRoom(objectIds: string[], roomId: string): Promise<boolean> {
	const floor = currentFloor.value
	if (!floor) return false
	const room = floor.rooms.find(r => r.id === roomId)
	if (!room) {
		toast.warning('Room not found')
		return false
	}
	const objects = objectIds.map(id => floor.objects.find(o => o.id === id)).filter((o): o is ObjectData => !!o && !o.locked)
	if (objects.length === 0) {
		toast.warning('No unlocked objects to link')
		return false
	}
	for (const obj of objects) {
		obj.roomId = room.id
	}
	toast.success(`Linked ${objects.length} object(s) to room`)
	await saveLayout()
	return true
}

export async function unlinkObjectFromRoom(objectId: string): Promise<boolean> {
	const floor = currentFloor.value
	if (!floor) return false
	const obj = floor.objects.find(o => o.id === objectId)
	if (!obj || !obj.roomId) return false
	if (obj.locked) {
		toast.warning('Cannot unlink a locked object')
		return false
	}
	delete obj.roomId
	toast.success('Object unlinked from room')
	await saveLayout()
	return true
}

export async function toggleObjectLock(id: string): Promise<void> {
	const floor = currentFloor.value
	if (!floor) return
	const o = floor.objects.find(o => o.id === id)
	if (!o) return
	o.locked = !o.locked
	toast.info(o.locked ? 'Object locked' : 'Object unlocked')
	await saveLayout()
}

export async function linkAllObjectsInRoom(roomId: string): Promise<number> {
	const floor = currentFloor.value
	if (!floor) return 0
	const room = floor.rooms.find(r => r.id === roomId)
	if (!room) {
		toast.warning('Room not found')
		return 0
	}
	const objects = floor.objects.filter(o => !o.locked && aabbOverlap(o, room))
	if (objects.length === 0) {
		toast.warning('No unlocked objects found inside this room')
		return 0
	}
	for (const obj of objects) {
		obj.roomId = room.id
	}
	toast.success(`Linked ${objects.length} object(s) to room`)
	await saveLayout()
	return objects.length
}

export async function flattenToSvgAsset(name?: string): Promise<string | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return null
		const ids = selectedObjectIds()
		if (ids.length < 2) {
			toast.warning('Select at least 2 objects to flatten')
			return null
		}
		const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
		if (objs.length < 2) return null
		if (objs.some(o => o.locked)) {
			toast.warning('Cannot flatten locked objects - unlock first')
			return null
		}

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
		for (const obj of objs) {
			minX = Math.min(minX, obj.x)
			minY = Math.min(minY, obj.y)
			maxX = Math.max(maxX, obj.x + obj.w)
			maxY = Math.max(maxY, obj.y + obj.h)
		}
		minX = snap(Math.round(minX))
		minY = snap(Math.round(minY))
		maxX = snap(Math.round(maxX))
		maxY = snap(Math.round(maxY))
		const totalW = maxX - minX
		const totalH = maxY - minY
		const t = state.layout.canvas.tileSize

		const amap = assetMap()
		const svgParts: string[] = []
		for (const obj of objs) {
			const asset = findAssetCached(amap, obj.type)
			const ox = obj.x - minX
			const oy = obj.y - minY
			const pad = obj.padding ?? 0
			const dw = obj.w - pad * 2
			const dh = obj.h - pad * 2

			if (asset?.svg && asset.svgViewBox) {
				const vb = asset.svgViewBox
				const scaleX = dw / vb.w
				const scaleY = dh / vb.h
				const rot = obj.rotation || 0
				let transform: string
				if (rot === 0) {
					transform = `translate(${ox + pad}, ${oy + pad}) scale(${scaleX}, ${scaleY})`
				} else if (rot === 90) {
					transform = `translate(${ox + pad + dh}, ${oy + pad}) rotate(90) scale(${scaleY}, ${scaleX})`
				} else if (rot === 180) {
					transform = `translate(${ox + pad + dw}, ${oy + pad + dh}) rotate(180) scale(${scaleX}, ${scaleY})`
				} else {
					transform = `translate(${ox + pad}, ${oy + pad + dh}) rotate(270) scale(${scaleY}, ${scaleX})`
				}
				svgParts.push(`<g transform="${transform}">${asset.svg}</g>`)
			} else {
				const fill = obj.fillColor || asset?.defaultBgColor || 'var(--white)'
				const rx = obj.rx
				if (rx) {
					const maxR = Math.min(dw, dh) / 2
					const r = (v: number) => Math.max(0, Math.min(v, maxR))
					const rtl = r(rx.tl), rtr = r(rx.tr), rbr = r(rx.br), rbl = r(rx.bl)
					svgParts.push(`<path d="M ${ox + pad + rtl} ${oy + pad} L ${ox + pad + dw - rtr} ${oy + pad} Q ${ox + pad + dw} ${oy + pad} ${ox + pad + dw} ${oy + pad + rtr} L ${ox + pad + dw} ${oy + pad + dh - rbr} Q ${ox + pad + dw} ${oy + pad + dh} ${ox + pad + dw - rbr} ${oy + pad + dh} L ${ox + pad + rtl} ${oy + pad + dh} Q ${ox + pad} ${oy + pad + dh} ${ox + pad} ${oy + pad + dh - rbl} L ${ox + pad} ${oy + pad + rtl} Q ${ox + pad} ${oy + pad} ${ox + pad + rtl} ${oy + pad} Z" fill="${fill}" stroke="var(--text-primary)" stroke-width="1"/>`)
				} else {
					svgParts.push(`<rect x="${ox + pad}" y="${oy + pad}" width="${dw}" height="${dh}" fill="${fill}" stroke="var(--border-dim)" stroke-width="1" rx="${obj.radius ?? 0}"/>`)
				}
			}
		}

		const safeName = (name && name.trim()) || `Flattened ${objs.length}`
		const assetId = genId('custom')
		const vbW = totalW
		const vbH = totalH
		const innerSvg = svgParts.join('\n  ')

		const asset: AssetDef = {
			origin: 'flattened',
			id: assetId,
			name: safeName,
			w: Math.round(totalW / t),
			h: Math.round(totalH / t),
			svg: innerSvg,
			svgViewBox: { w: vbW, h: vbH },
		}

		initAssetFields(asset)
		state.assetRegistry.push(asset)

		const newObj: ObjectData = {
			id: genId('obj'),
			subId: genId('sub'),
			type: assetId,
			rotation: 0,
			x: minX,
			y: minY,
			w: totalW,
			h: totalH,
		}
		if (asset.walkable !== undefined) newObj.walkable = asset.walkable

		const removeIds = new Set(objs.map(o => o.id))
		floor.objects = floor.objects.filter(o => !removeIds.has(o.id))
		floor.objects.push(newObj)

		recalcCollapsed(floor, assetMap())
		clearSelection()
		selectEntity({ type: 'object', id: newObj.id })
		await saveAssets()
		await saveLayout()

		toast.success(`Flattened ${objs.length} objects into "${safeName}" — independent asset, no unlink needed`)
		return assetId
	})
}
