import type { RoomData, Rect, RoomTemplate, RoomTemplateObject, ObjectData } from '../types'
import { roomOverlapsAny, aabbOverlap, objectOverlapsAny, recalcCollapsed } from '../collision'
import { normalizeObject } from '../geometry'
import { state, toast, snap, clamp, currentFloor, assetMap, isValidColor, withStateLock } from './state'
import { genId } from './utils'
import { findRoomTemplate } from './selection'
import { saveLayout } from './persistence'

export async function addRoom(rect: Rect, label = 'New Room', template?: RoomTemplate, deferSave = false): Promise<RoomData | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return null
		const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
		if (snapped.w <= 0 || snapped.h <= 0) {
			toast.warning('Room too small - minimum 1 tile')
			return null
		}
		if (roomOverlapsAny(floor.rooms, snapped)) {
			toast.warning('Cannot place room - overlaps existing room')
			return null
		}
		const room: RoomData = {
			id: genId('room'), ...snapped,
			label: template?.label ?? label,
			anchorPoints: [{ x: snapped.w / 2, y: snapped.h / 2 }],
			tags: template?.tags ? [...template.tags] : undefined,
		}
		if (template?.radius && template.radius > 0) room.radius = template.radius
		if (template?.fillColor) room.fillColor = template.fillColor
		if (template?.rx) room.rx = template.rx
		if (template?.padding && template.padding > 0) room.padding = template.padding
		if (template?.category) room.category = template.category
		if (template?.roomType) {
			room.roomType = template.roomType
			room.walkable = template.roomType !== 'wall'
		} else {
			room.roomType = 'room'
			room.walkable = true
		}
		floor.rooms.push(room)
		state.selectionState = { primary: { type: 'room', id: room.id }, items: [{ type: 'room', id: room.id }] }
		if (!deferSave) await saveLayout()
		return room
	})
}

export function canPlaceRoom(rect: Rect): boolean {
	const floor = currentFloor.value
	if (!floor) return false
	const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
	return snapped.w > 0 && snapped.h > 0 && !roomOverlapsAny(floor.rooms, snapped)
}

export async function updateRoomProps(patch: Partial<RoomData>): Promise<boolean> {
	return withStateLock(async () => {
		const r = state.selectionState.primary?.type === 'room'
			? currentFloor.value?.rooms.find(rm => rm.id === state.selectionState.primary!.id)
			: undefined
		if (!r) return false
		if (r.locked && (patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)) {
			toast.warning('Cannot resize a locked hotel wall')
			return false
		}
		const rect = clamp({
			x: patch.x ?? r.x, y: patch.y ?? r.y,
			w: patch.w ?? r.w, h: patch.h ?? r.h,
		})
		const floor = currentFloor.value
		if ((patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)
			&& floor && roomOverlapsAny(floor.rooms, rect, r.id)) {
			return false
		}
		if (patch.fillColor !== undefined && !isValidColor(patch.fillColor)) {
			toast.warning('Invalid fill color')
			return false
		}
		const changed = (patch.x !== undefined && r.x !== rect.x) ||
			(patch.y !== undefined && r.y !== rect.y) ||
			(patch.w !== undefined && r.w !== rect.w) ||
			(patch.h !== undefined && r.h !== rect.h) ||
			(patch.label !== undefined && r.label !== (patch.label || '')) ||
			(patch.radius !== undefined && r.radius !== patch.radius) ||
			(patch.locked !== undefined && r.locked !== patch.locked) ||
			(patch.fillColor !== undefined && (r.fillColor ?? '') !== (patch.fillColor || '')) ||
			(patch.rx !== undefined && r.rx !== patch.rx) ||
			(patch.padding !== undefined && r.padding !== patch.padding) ||
			(patch.category !== undefined && r.category !== patch.category) ||
			(patch.roomType !== undefined && r.roomType !== patch.roomType) ||
			(patch.walkable !== undefined && r.walkable !== patch.walkable) ||
			(patch.tags !== undefined) ||
			(patch.entrances !== undefined) ||
			(patch.anchorPoints !== undefined) ||
			(patch.interact !== undefined)
		if (!changed) return true
		const dx = (patch.x !== undefined ? rect.x : r.x) - r.x
		const dy = (patch.y !== undefined ? rect.y : r.y) - r.y
		if (floor && (dx !== 0 || dy !== 0) && floor.objects.some(o => o.roomId === r.id && o.locked)) {
			toast.warning('Cannot move a room with locked objects')
			return false
		}
		if (patch.x !== undefined) r.x = rect.x
		if (patch.y !== undefined) r.y = rect.y
		if (patch.w !== undefined) r.w = rect.w
		if (patch.h !== undefined) r.h = rect.h
		if (floor && (dx !== 0 || dy !== 0)) {
			for (const o of floor.objects) {
				if (o.roomId === r.id && !o.locked) {
					o.x += dx
					o.y += dy
				}
			}
		}
		if (patch.label !== undefined) r.label = patch.label || ''
		if (patch.category !== undefined) r.category = patch.category || undefined
		if (patch.roomType !== undefined) {
			r.roomType = patch.roomType
			if (patch.walkable === undefined) {
				r.walkable = patch.roomType !== 'wall'
			}
		}
		if (patch.walkable !== undefined) r.walkable = patch.walkable
		if (patch.tags !== undefined) r.tags = patch.tags?.length ? [...patch.tags] : undefined
		if (patch.entrances !== undefined) r.entrances = patch.entrances
		if (patch.anchorPoints !== undefined) r.anchorPoints = patch.anchorPoints
		if (patch.interact !== undefined) r.interact = patch.interact ? { ...patch.interact } : undefined
		if (patch.radius !== undefined) r.radius = patch.radius
		if (patch.locked !== undefined) r.locked = patch.locked
		if (patch.fillColor !== undefined) r.fillColor = patch.fillColor || undefined
		if (patch.rx !== undefined) r.rx = patch.rx
		if (patch.padding !== undefined) r.padding = patch.padding
		await saveLayout()
		return true
	})
}

export async function addRoomTemplate(room: RoomData, name: string, category?: string): Promise<RoomTemplate> {
	const tpl: RoomTemplate = {
		id: genId('roomtpl'),
		name: name.trim() || room.label || 'Room Template',
		category: (category && category.trim()) || room.category || 'Rooms',
		w: room.w,
		h: room.h,
		label: room.label,
	}
	if (room.radius && room.radius > 0) tpl.radius = room.radius
	if (room.fillColor) tpl.fillColor = room.fillColor
	if (room.rx) tpl.rx = room.rx
	if (room.padding && room.padding > 0) tpl.padding = room.padding
	if (room.tags?.length) tpl.tags = [...room.tags]

	const floor = currentFloor.value
	if (floor) {
		const inside = floor.objects.filter(o => aabbOverlap(o, room))
		if (inside.length > 0) {
			tpl.objects = inside.map(o => {
				const tObj: RoomTemplateObject = {
					type: o.type,
					dx: o.x - room.x,
					dy: o.y - room.y,
					w: o.w,
					h: o.h,
					rotation: o.rotation,
				}
				if (o.padding !== undefined) tObj.padding = o.padding
				if (o.rx) tObj.rx = o.rx
				if (o.fillColor) tObj.fillColor = o.fillColor
				if (o.radius !== undefined) tObj.radius = o.radius
				return tObj
			})
		}
	}

	if (!state.layout.roomTemplates) state.layout.roomTemplates = []
	state.layout.roomTemplates.push(tpl)
	await saveLayout()
	return tpl
}

export async function deleteRoomTemplate(id: string): Promise<void> {
	if (!state.layout.roomTemplates) return
	state.layout.roomTemplates = state.layout.roomTemplates.filter(t => t.id !== id)
	await saveLayout()
}

export async function addRoomFromTemplate(templateId: string, x: number, y: number): Promise<RoomData | null> {
	const tpl = findRoomTemplate(templateId)
	if (!tpl) return null
	const room = await addRoom({ x, y, w: tpl.w, h: tpl.h }, tpl.label, tpl, true)
	if (!room) return null

	if (tpl.objects && tpl.objects.length > 0) {
		const floor = currentFloor.value
		if (floor) {
			const templateGroupIds = new Map<string, string>()
			let skipped = 0
			for (const tObj of tpl.objects) {
				const obj: ObjectData = {
					id: genId('obj'),
					subId: genId('sub'),
					type: tObj.type,
					x: snap(room.x + tObj.dx),
					y: snap(room.y + tObj.dy),
					w: 0,
					h: 0,
					rotation: tObj.rotation,
					roomId: room.id,
					label: tObj.label,
					instanceLabel: tObj.instanceLabel,
					customProps: tObj.customProps,
				}
				normalizeObject(obj, state.layout.canvas.tileSize, assetMap())
				if (tObj.linkGroupId) {
					let groupId = templateGroupIds.get(tObj.linkGroupId)
					if (!groupId) {
						groupId = genId('link')
						templateGroupIds.set(tObj.linkGroupId, groupId)
					}
					obj.linkGroupId = groupId
				}
				if (tObj.radius !== undefined) obj.radius = tObj.radius
				if (objectOverlapsAny(floor.objects, assetMap(), { x: obj.x, y: obj.y, w: obj.w, h: obj.h }, [obj.id])) {
					skipped++
					continue
				}
				floor.objects.push(obj)
			}
			if (skipped > 0) toast.warning(`${skipped} object(s) skipped due to overlap`)
			recalcCollapsed(floor, assetMap())
		}
	}
	await saveLayout()

	return room
}

export async function eraseWallTile(roomId: string, clickX: number, clickY: number): Promise<void> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return
		const room = floor.rooms.find(r => r.id === roomId)
		if (!room) return
		if (room.locked) {
			toast.warning('Cannot erase a locked hotel wall')
			return
		}
		const t = state.layout.canvas.tileSize
		const distLeft = clickX - room.x
		const distRight = (room.x + room.w) - clickX
		const distTop = clickY - room.y
		const distBottom = (room.y + room.h) - clickY
		const minDist = Math.min(distLeft, distRight, distTop, distBottom)
		if (minDist < 0 || minDist > t * 2) return

		if (minDist === distLeft && room.w > t) {
			room.x += t
			room.w -= t
		} else if (minDist === distRight && room.w > t) {
			room.w -= t
		} else if (minDist === distTop && room.h > t) {
			room.y += t
			room.h -= t
		} else if (minDist === distBottom && room.h > t) {
			room.h -= t
		} else {
			floor.rooms = floor.rooms.filter(r => r.id !== roomId)
			for (const o of floor.objects) {
				if (o.roomId === roomId) delete o.roomId
			}
		}
		recalcCollapsed(floor, assetMap())
		await saveLayout()
	})
}
