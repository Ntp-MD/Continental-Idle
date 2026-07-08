import type { RoomData, Rect, RoomTemplate } from '../types'
import { state, toast, genId, snap, clamp, roomOverlapsAny, recalcCollapsed, currentFloor, findRoomTemplate, isValidColor, withStateLock } from './state'
import { pushHistory } from './history'
import { saveLayout } from './persistence'

export async function addRoom(rect: Rect, label = 'New Room', template?: RoomTemplate): Promise<RoomData | null> {
  return withStateLock(async () => {
    const floor = currentFloor.value
  if (!floor) return null
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  if (snapped.w <= 0 || snapped.h <= 0) {
    toast.warning('Room too small - minimum 1 tile')
    return null
  }
  if (roomOverlapsAny(snapped)) {
    toast.warning('Cannot place room - overlaps existing room')
    return null
  }
  pushHistory()
  const room: RoomData = {
    id: genId('r'), ...snapped,
    label: template?.label ?? label,
  }
  if (template?.radius && template.radius > 0) room.radius = template.radius
  if (template?.fillColor) room.fillColor = template.fillColor
  if (template?.rx) room.rx = template.rx
  if (template?.padding && template.padding > 0) room.padding = template.padding
  floor.rooms.push(room)
  state.selection = { type: 'room', id: room.id }
  await saveLayout()
  return room
  })
}

export function canPlaceRoom(rect: Rect): boolean {
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  return snapped.w > 0 && snapped.h > 0 && !roomOverlapsAny(snapped)
}

export async function updateRoomProps(patch: Partial<RoomData>): Promise<boolean> {
  const r = state.selection?.type === 'room'
    ? currentFloor.value?.rooms.find(rm => rm.id === state.selection!.id)
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
  if ((patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)
    && roomOverlapsAny(rect, r.id)) {
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
    (patch.padding !== undefined && r.padding !== patch.padding)
  if (!changed) return true
  pushHistory()
  if (patch.x !== undefined) r.x = rect.x
  if (patch.y !== undefined) r.y = rect.y
  if (patch.w !== undefined) r.w = rect.w
  if (patch.h !== undefined) r.h = rect.h
  if (patch.label !== undefined) r.label = patch.label || ''
  if (patch.radius !== undefined) r.radius = patch.radius
  if (patch.locked !== undefined) r.locked = patch.locked
  if (patch.fillColor !== undefined) r.fillColor = patch.fillColor || undefined
  if (patch.rx !== undefined) r.rx = patch.rx
  if (patch.padding !== undefined) r.padding = patch.padding
  await saveLayout()
  return true
}

export async function addRoomTemplate(room: RoomData, name: string, category?: string): Promise<RoomTemplate> {
  const tpl: RoomTemplate = {
    id: genId('roomtpl'),
    name: name.trim() || room.label || 'Room Template',
    category: (category && category.trim()) || 'Rooms',
    w: room.w,
    h: room.h,
    label: room.label,
  }
  if (room.radius && room.radius > 0) tpl.radius = room.radius
  if (room.fillColor) tpl.fillColor = room.fillColor
  if (room.rx) tpl.rx = room.rx
  if (room.padding && room.padding > 0) tpl.padding = room.padding
  pushHistory()
  if (!state.layout.roomTemplates) state.layout.roomTemplates = []
  state.layout.roomTemplates.push(tpl)
  await saveLayout()
  return tpl
}

export async function deleteRoomTemplate(id: string): Promise<void> {
  if (!state.layout.roomTemplates) return
  pushHistory()
  state.layout.roomTemplates = state.layout.roomTemplates.filter(t => t.id !== id)
  await saveLayout()
}

export async function addRoomFromTemplate(templateId: string, x: number, y: number): Promise<RoomData | null> {
  const tpl = findRoomTemplate(templateId)
  if (!tpl) return null
  return addRoom({ x, y, w: tpl.w, h: tpl.h }, tpl.label, tpl)
}

export async function eraseWallTile(roomId: string, clickX: number, clickY: number) {
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

  pushHistory()
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
  }
  recalcCollapsed(floor)
  await saveLayout()
}
