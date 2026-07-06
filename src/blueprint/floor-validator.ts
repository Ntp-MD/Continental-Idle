import type { RoomData, ObjectData, Rect, Rotation } from './editor-types'
import { aabbOverlap, DEFAULT_TILE_SIZE } from './editor-types'
import { BUILTIN_ASSETS } from './editor-assets'

type FloorPresetData = { rooms: RoomData[]; objects: ObjectData[] }

export interface Violation {
  rule: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  floorLabel: string
  roomId?: string
  objectId?: string
}

export interface FloorValidationResult {
  floorLabel: string
  floorName: string
  violations: Violation[]
  passed: number
  failed: number
}

export interface ValidationReport {
  results: FloorValidationResult[]
  totalViolations: number
  totalPassed: number
  totalFailed: number
}

const TILE = DEFAULT_TILE_SIZE
const MIN_CORRIDOR_PX = 100
const MIN_ELEVATOR_CLEARANCE = 100
const MIN_ROOM_STD_PX = 100
const MIN_ROOM_DELUXE_PX_W = 150
const MIN_ROOM_DELUXE_PX_H = 125
const MIN_LOBBY_PX = 250
const MIN_KITCHEN_PX = 150
const MIN_RESTAURANT_PX_W = 250
const MIN_RESTAURANT_PX_H = 200
const MIN_ELEVATORS = 4

const FLOOR_ROOM_COUNTS: Record<string, number> = {
  F5: 20, F6: 20,
  F7: 24, F8: 24, F9: 24, F10: 24,
  F11: 16, F12: 16,
  F13: 12, F14: 12,
  F15: 8, F16: 8,
  F17: 4, F18: 4,
}

function isCorridor(r: RoomData): boolean {
  return r.cat === 'open' && (r.label || '').toUpperCase().includes('CORRIDOR')
}

function isBackOfHouse(r: RoomData): boolean {
  return r.cat === 'back' || r.cat === 'security' || r.cat === 'utility'
}

function isGuestRoom(r: RoomData): boolean {
  const lbl = (r.label || '').toUpperCase()
  return lbl.includes('RM ') || lbl.includes('SUITE') || lbl.includes('BEDROOM') ||
    lbl.includes('EXEC ') || lbl.match(/STD-|DLX-|VIP-|PENTHOUSE/) !== null
}

function isDeluxeTierGuestRoom(r: RoomData): boolean {
  const lbl = (r.label || '').toUpperCase()
  return lbl.includes('SUITE') || lbl.includes('EXEC ') || lbl.includes('BEDROOM') ||
    lbl.match(/DLX-|VIP-|PENTHOUSE/) !== null
}

function roomsShareEdge(a: Rect, b: Rect): boolean {
  const horiz = Math.abs(a.x + a.w - b.x) < 1 || Math.abs(b.x + b.w - a.x) < 1
  const vert = Math.abs(a.y + a.h - b.y) < 1 || Math.abs(b.y + b.h - a.y) < 1
  if (horiz) {
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
    return oy >= TILE
  }
  if (vert) {
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
    return ox >= TILE
  }
  return false
}

function objectsInRoom(room: RoomData, objects: ObjectData[]): ObjectData[] {
  return objects.filter(o =>
    o.x >= room.x && o.x + o.w <= room.x + room.w &&
    o.y >= room.y && o.y + o.h <= room.y + room.h
  )
}

function isDoor(o: ObjectData): boolean {
  return o.type.startsWith('door')
}

function isElevator(o: ObjectData): boolean {
  return o.type === 'elevator'
}

function doorConnectsRooms(door: ObjectData, rooms: RoomData[]): RoomData[] {
  const connected: RoomData[] = []
  for (const r of rooms) {
    const onLeft = Math.abs(door.x - r.x) < 2 || Math.abs(door.x - (r.x + r.w)) < 2
    const onTop = Math.abs(door.y - r.y) < 2 || Math.abs(door.y - (r.y + r.h)) < 2
    const insideX = door.x >= r.x - 2 && door.x + door.w <= r.x + r.w + 2
    const insideY = door.y >= r.y - 2 && door.y + door.h <= r.y + r.h + 2
    if ((onLeft || onTop) && insideX && insideY) {
      connected.push(r)
    }
  }
  return connected
}

function corridorsConnected(corridors: RoomData[]): boolean {
  if (corridors.length <= 1) return true
  const visited = new Set<string>()
  const queue = [corridors[0]]
  visited.add(corridors[0].id)
  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const c of corridors) {
      if (visited.has(c.id)) continue
      if (roomsShareEdge(cur, c) || aabbOverlap(cur, c)) {
        visited.add(c.id)
        queue.push(c)
      }
    }
  }
  return visited.size === corridors.length
}

function roomHasCorridorAccess(room: RoomData, corridors: RoomData[], objects: ObjectData[]): boolean {
  for (const c of corridors) {
    if (roomsShareEdge(room, c)) return true
  }
  for (const o of objects) {
    if (!isDoor(o)) continue
    const connected = doorConnectsRooms(o, [room, ...corridors])
    if (connected.includes(room) && connected.some(r => isCorridor(r))) return true
  }
  return false
}

export function validateFloor(
  floorLabel: string,
  floorName: string,
  rooms: RoomData[],
  objects: ObjectData[],
  canvasW: number = 2000,
  canvasH: number = 800,
): FloorValidationResult {
  const violations: Violation[] = []
  let passed = 0
  const corridors = rooms.filter(r => isCorridor(r))
  const nonCorridors = rooms.filter(r => !isCorridor(r))
  const elevators = objects.filter(o => isElevator(o))
  const doors = objects.filter(o => isDoor(o))

  // Rule: No overlapping rooms
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (aabbOverlap(rooms[i], rooms[j])) {
        violations.push({
          rule: 'No overlapping rooms', severity: 'critical',
          message: `Rooms "${rooms[i].label}" and "${rooms[j].label}" overlap`,
          floorLabel, roomId: rooms[i].id,
        })
      }
    }
  }
  if (violations.length === 0 || !violations.some(v => v.rule === 'No overlapping rooms')) passed++

  // Rule: No overlapping objects (excluding doors which can be on borders)
  let objOverlapFound = false
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      if (isDoor(objects[i]) || isDoor(objects[j])) continue
      if (aabbOverlap(objects[i], objects[j])) {
        violations.push({
          rule: 'No overlapping objects', severity: 'critical',
          message: `Objects "${objects[i].type}" and "${objects[j].type}" overlap at (${objects[i].x},${objects[i].y})`,
          floorLabel, objectId: objects[i].id,
        })
        objOverlapFound = true
      }
    }
  }
  if (!objOverlapFound) passed++

  // Rule: All within canvas bounds
  let outOfBounds = false
  for (const r of rooms) {
    if (r.x < 0 || r.y < 0 || r.x + r.w > canvasW || r.y + r.h > canvasH) {
      violations.push({
        rule: 'Within canvas bounds', severity: 'critical',
        message: `Room "${r.label}" extends outside canvas (${r.x},${r.y},${r.w},${r.h})`,
        floorLabel, roomId: r.id,
      })
      outOfBounds = true
    }
  }
  for (const o of objects) {
    if (o.x < 0 || o.y < 0 || o.x + o.w > canvasW || o.y + o.h > canvasH) {
      violations.push({
        rule: 'Within canvas bounds', severity: 'critical',
        message: `Object "${o.type}" at (${o.x},${o.y}) outside canvas`,
        floorLabel, objectId: o.id,
      })
      outOfBounds = true
    }
  }
  if (!outOfBounds) passed++

  // Rule: Min 4 elevators per floor
  if (elevators.length < MIN_ELEVATORS) {
    violations.push({
      rule: 'Min 4 elevators', severity: 'high',
      message: `Floor has ${elevators.length} elevators (minimum ${MIN_ELEVATORS} required)`,
      floorLabel,
    })
  } else passed++

  // Rule: Elevator 4-tile clearance (100px except walls)
  for (const elev of elevators) {
    const dirs = [
      { name: 'left', x: elev.x - MIN_ELEVATOR_CLEARANCE, y: elev.y, w: MIN_ELEVATOR_CLEARANCE, h: elev.h },
      { name: 'right', x: elev.x + elev.w, y: elev.y, w: MIN_ELEVATOR_CLEARANCE, h: elev.h },
      { name: 'top', x: elev.x, y: elev.y - MIN_ELEVATOR_CLEARANCE, w: elev.w, h: MIN_ELEVATOR_CLEARANCE },
      { name: 'bottom', x: elev.x, y: elev.y + elev.h, w: elev.w, h: MIN_ELEVATOR_CLEARANCE },
    ]
    for (const dir of dirs) {
      if (dir.x < 0 || dir.y < 0 || dir.x + dir.w > canvasW || dir.y + dir.h > canvasH) continue
      for (const o of objects) {
        if (o === elev || isDoor(o)) continue
        if (aabbOverlap(dir, o)) {
          violations.push({
            rule: 'Elevator clearance', severity: 'high',
            message: `Elevator at (${elev.x},${elev.y}) blocked on ${dir.name} by "${o.type}"`,
            floorLabel, objectId: elev.id,
          })
          break
        }
      }
    }
  }
  passed++

  // Rule: Corridors >= 4 tiles (100px) wide
  let narrowCorridor = false
  for (const c of corridors) {
    if (c.w < MIN_CORRIDOR_PX || c.h < MIN_CORRIDOR_PX) {
      violations.push({
        rule: 'Corridor min width', severity: 'high',
        message: `Corridor "${c.label}" is ${c.w}x${c.h}px (minimum ${MIN_CORRIDOR_PX}px)`,
        floorLabel, roomId: c.id,
      })
      narrowCorridor = true
    }
  }
  if (!narrowCorridor) passed++

  // Rule: Every room has entrance/door
  for (const r of nonCorridors) {
    const hasDoor = doors.some(d => doorConnectsRooms(d, [r]).length > 0)
    const hasCorridorEdge = corridors.some(c => roomsShareEdge(r, c))
    if (!hasDoor && !hasCorridorEdge) {
      violations.push({
        rule: 'Every room has door', severity: 'high',
        message: `Room "${r.label}" has no door or corridor access`,
        floorLabel, roomId: r.id,
      })
    }
  }
  passed++

  // Rule: All rooms connected to walkable area
  for (const r of nonCorridors) {
    if (!roomHasCorridorAccess(r, corridors, objects)) {
      violations.push({
        rule: 'Room connected to walkable', severity: 'high',
        message: `Room "${r.label}" is not connected to any corridor/walkable area`,
        floorLabel, roomId: r.id,
      })
    }
  }
  passed++

  // Rule: No wall-to-wall rooms (gap >= 100px between non-corridor adjacent rooms)
  for (let i = 0; i < nonCorridors.length; i++) {
    for (let j = i + 1; j < nonCorridors.length; j++) {
      const a = nonCorridors[i]
      const b = nonCorridors[j]
      if (roomsShareEdge(a, b)) {
        violations.push({
          rule: 'No wall-to-wall rooms', severity: 'medium',
          message: `Rooms "${a.label}" and "${b.label}" are wall-to-wall with no corridor gap`,
          floorLabel, roomId: a.id,
        })
      }
    }
  }
  passed++

  // Rule: Corridors form connected network
  if (corridors.length > 0 && !corridorsConnected(corridors)) {
    violations.push({
      rule: 'Corridors connected network', severity: 'high',
      message: `Corridors are not all connected to each other`,
      floorLabel,
    })
  } else passed++

  // Rule: No dead-end corridors
  for (const c of corridors) {
    const connections = corridors.filter(other => other.id !== c.id && (roomsShareEdge(c, other) || aabbOverlap(c, other)))
    const roomConnections = nonCorridors.filter(r => roomsShareEdge(c, r))
    if (connections.length === 0 && roomConnections.length < 2) {
      violations.push({
        rule: 'No dead-end corridors', severity: 'medium',
        message: `Corridor "${c.label}" is a dead-end (no connection to other corridors)`,
        floorLabel, roomId: c.id,
      })
    }
  }
  passed++

  // Rule: Back-of-house (back, security, utility) separated from public
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j]
      const isBohPublic = (isBackOfHouse(a) && b.cat === 'public') || (a.cat === 'public' && isBackOfHouse(b))
      if (isBohPublic && roomsShareEdge(a, b)) {
        const hasCorridorBetween = corridors.some(c =>
          (roomsShareEdge(c, a) && roomsShareEdge(c, b))
        )
        if (!hasCorridorBetween) {
          const bohRoom = isBackOfHouse(a) ? a : b
          const pubRoom = a.cat === 'public' ? a : b
          violations.push({
            rule: 'Back-of-house separation', severity: 'high',
            message: `Back-of-house "${bohRoom.label}" (${bohRoom.cat}) directly adjacent to public "${pubRoom.label}" without service corridor`,
            floorLabel, roomId: bohRoom.id,
          })
        }
      }
    }
  }
  passed++

  // Rule: Kitchen adjacent to dining
  const kitchen = rooms.find(r => (r.label || '').toUpperCase().includes('KITCHEN'))
  const dining = rooms.find(r => {
    const l = (r.label || '').toUpperCase()
    return l.includes('DINING') || l.includes('RESTAURANT') || l.includes('CAFETERIA') || l.includes('BANQUET')
  })
  if (kitchen && dining) {
    const adjacent = roomsShareEdge(kitchen, dining) ||
      corridors.some(c => roomsShareEdge(c, kitchen) && roomsShareEdge(c, dining))
    if (!adjacent) {
      violations.push({
        rule: 'Kitchen adjacent to dining', severity: 'medium',
        message: `Kitchen "${kitchen.label}" is not adjacent to dining "${dining.label}"`,
        floorLabel, roomId: kitchen.id,
      })
    } else passed++
  } else passed++

  // Rule: Reception near main entrance (top edge)
  const reception = rooms.find(r => {
    const l = (r.label || '').toUpperCase()
    return l.includes('RECEPTION') || l.includes('HOST')
  })
  if (reception) {
    if (reception.y > 200) {
      violations.push({
        rule: 'Reception near entrance', severity: 'medium',
        message: `Reception "${reception.label}" is at y=${reception.y} (should be near top/entrance, y<=200)`,
        floorLabel, roomId: reception.id,
      })
    } else passed++
  } else passed++

  // Rule: Back-of-house not accessible from public via doors
  for (const d of doors) {
    const connected = doorConnectsRooms(d, rooms)
    const bohRoom = connected.find(r => isBackOfHouse(r))
    const pubRoom = connected.find(r => r.cat === 'public')
    if (bohRoom && pubRoom) {
      violations.push({
        rule: 'Back-of-house not public-accessible', severity: 'high',
        message: `Door at (${d.x},${d.y}) directly connects ${bohRoom.cat} "${bohRoom.label}" to public "${pubRoom.label}"`,
        floorLabel, objectId: d.id,
      })
    }
  }
  passed++

  // Rule: Min room sizes (tier-specific per spec)
  for (const r of nonCorridors) {
    const lbl = (r.label || '').toUpperCase()
    const isLobby = lbl.includes('LOBBY')
    const isKitchen = lbl.includes('KITCHEN') && !lbl.includes('PREP')
    const isRestaurant = lbl.includes('DINING') || lbl.includes('RESTAURANT') || lbl.includes('BANQUET') || lbl.includes('CAFETERIA')
    if (isLobby) {
      if (r.w < MIN_LOBBY_PX || r.h < MIN_LOBBY_PX) {
        violations.push({ rule: 'Min room size', severity: 'medium',
          message: `Lobby "${r.label}" is ${r.w}x${r.h}px (minimum ${MIN_LOBBY_PX}x${MIN_LOBBY_PX}px)`,
          floorLabel, roomId: r.id })
      }
    } else if (isKitchen) {
      if (r.w < MIN_KITCHEN_PX || r.h < MIN_KITCHEN_PX) {
        violations.push({ rule: 'Min room size', severity: 'medium',
          message: `Kitchen "${r.label}" is ${r.w}x${r.h}px (minimum ${MIN_KITCHEN_PX}x${MIN_KITCHEN_PX}px)`,
          floorLabel, roomId: r.id })
      }
    } else if (isRestaurant) {
      if (r.w < MIN_RESTAURANT_PX_W || r.h < MIN_RESTAURANT_PX_H) {
        violations.push({ rule: 'Min room size', severity: 'medium',
          message: `Restaurant/dining "${r.label}" is ${r.w}x${r.h}px (minimum ${MIN_RESTAURANT_PX_W}x${MIN_RESTAURANT_PX_H}px)`,
          floorLabel, roomId: r.id })
      }
    } else if (isGuestRoom(r)) {
      if (isDeluxeTierGuestRoom(r)) {
        if (r.w < MIN_ROOM_DELUXE_PX_W || r.h < MIN_ROOM_DELUXE_PX_H) {
          violations.push({ rule: 'Min room size', severity: 'medium',
            message: `Deluxe+ guest room "${r.label}" is ${r.w}x${r.h}px (minimum ${MIN_ROOM_DELUXE_PX_W}x${MIN_ROOM_DELUXE_PX_H}px)`,
            floorLabel, roomId: r.id })
        }
      } else {
        if (r.w < MIN_ROOM_STD_PX || r.h < MIN_ROOM_STD_PX) {
          violations.push({ rule: 'Min room size', severity: 'medium',
            message: `Guest room "${r.label}" is ${r.w}x${r.h}px (minimum ${MIN_ROOM_STD_PX}x${MIN_ROOM_STD_PX}px)`,
            floorLabel, roomId: r.id })
        }
      }
    }
  }
  passed++

  // Rule: Guest rooms have bed + bathtub + wardrobe
  for (const r of nonCorridors) {
    if (!isGuestRoom(r)) continue
    const furn = objectsInRoom(r, objects)
    const hasBed = furn.some(o => o.type === 'bed')
    const hasBath = furn.some(o => o.type === 'bathtub')
    const hasWardrobe = furn.some(o => o.type === 'wardrobe')
    const missing: string[] = []
    if (!hasBed) missing.push('bed')
    if (!hasBath) missing.push('bathtub')
    if (!hasWardrobe) missing.push('wardrobe')
    if (missing.length > 0) {
      violations.push({
        rule: 'Guest room bed+bath+wardrobe', severity: 'medium',
        message: `Guest room "${r.label}" missing ${missing.join(', ')}`,
        floorLabel, roomId: r.id,
      })
    }
  }
  passed++

  // Rule: Kitchen has prep + storage
  if (kitchen) {
    const furn = objectsInRoom(kitchen, objects)
    const hasPrep = furn.some(o => o.type === 'prep-station')
    const hasStorage = furn.some(o => o.type === 'storage-shelf')
    if (!hasPrep || !hasStorage) {
      violations.push({
        rule: 'Kitchen prep+storage', severity: 'medium',
        message: `Kitchen "${kitchen.label}" missing ${!hasPrep ? 'prep station' : ''}${!hasPrep && !hasStorage ? ' and ' : ''}${!hasStorage ? 'storage shelf' : ''}`,
        floorLabel, roomId: kitchen.id,
      })
    } else passed++
  } else passed++

  // Rule: Trash bins in common areas (not inside guest rooms)
  const corridorBins = objects.filter(o => o.type === 'trash-bin' && corridors.some(c =>
    o.x >= c.x && o.x + o.w <= c.x + c.w && o.y >= c.y && o.y + o.h <= c.y + c.h
  ))
  if (corridorBins.length < 2) {
    violations.push({
      rule: 'Trash bins in common areas', severity: 'low',
      message: `Only ${corridorBins.length} trash bins in corridor/common areas (minimum 2)`,
      floorLabel,
    })
  } else passed++

  // Rule: No trash bins inside guest rooms
  for (const o of objects) {
    if (o.type !== 'trash-bin') continue
    const inGuestRoom = nonCorridors.some(r => isGuestRoom(r) &&
      o.x >= r.x && o.x + o.w <= r.x + r.w && o.y >= r.y && o.y + o.h <= r.y + r.h)
    if (inGuestRoom) {
      violations.push({
        rule: 'Trash bins not in guest rooms', severity: 'low',
        message: `Trash bin at (${o.x},${o.y}) is inside a guest room (should be in common areas)`,
        floorLabel, objectId: o.id,
      })
    }
  }
  passed++

  // Rule: Elevator lobby 4x4 open space
  for (const elev of elevators) {
    const lobbyArea: Rect = {
      x: elev.x - MIN_ELEVATOR_CLEARANCE, y: elev.y - MIN_ELEVATOR_CLEARANCE,
      w: elev.w + 2 * MIN_ELEVATOR_CLEARANCE, h: elev.h + 2 * MIN_ELEVATOR_CLEARANCE,
    }
    const blockingObjects = objects.filter(o => {
      if (o === elev || isDoor(o)) return false
      return aabbOverlap(lobbyArea, o)
    })
    const blockingRooms = rooms.filter(r => {
      if (isCorridor(r)) return false
      return aabbOverlap(lobbyArea, r)
    })
    if (blockingObjects.length > 0 || blockingRooms.length > 0) {
      violations.push({
        rule: 'Elevator lobby open space', severity: 'medium',
        message: `Elevator at (${elev.x},${elev.y}) lobby area blocked by ${blockingObjects.length} objects, ${blockingRooms.length} rooms`,
        floorLabel, objectId: elev.id,
      })
    }
  }
  passed++

  // Rule: Corridors empty of furniture (only trash bins allowed)
  for (const o of objects) {
    if (isDoor(o) || isElevator(o)) continue
    const inCorridor = corridors.some(c =>
      o.x >= c.x && o.x + o.w <= c.x + c.w && o.y >= c.y && o.y + o.h <= c.y + c.h
    )
    if (inCorridor && o.type !== 'trash-bin') {
      violations.push({
        rule: 'Corridors empty of furniture', severity: 'medium',
        message: `Object "${o.type}" at (${o.x},${o.y}) is inside a corridor (corridors must be empty)`,
        floorLabel, objectId: o.id,
      })
    }
  }
  passed++

  // Rule: Room count matches Floor Inventory target
  const targetCount = FLOOR_ROOM_COUNTS[floorLabel]
  if (targetCount !== undefined) {
    const guestRooms = nonCorridors.filter(r => isGuestRoom(r)).length
    if (guestRooms !== targetCount) {
      violations.push({
        rule: 'Room count matches inventory', severity: 'medium',
        message: `Floor has ${guestRooms} guest rooms (target: ${targetCount})`,
        floorLabel,
      })
    } else passed++
  } else passed++

  const failed = violations.length
  return { floorLabel, floorName, violations, passed, failed }
}

const FLOOR_LABELS: { id: string; name: string }[] = [
  { id: 'G', name: 'Basement' },
  { id: 'F1', name: 'Lobby' },
  { id: 'F2', name: 'Restaurant & Bar' },
  { id: 'F3', name: 'Service Floor' },
  { id: 'F4', name: 'Security' },
  { id: 'F5', name: 'Staff Rooms' },
  { id: 'F6', name: 'Staff Rooms' },
  { id: 'F7', name: 'Standard Rooms' },
  { id: 'F8', name: 'Standard Rooms' },
  { id: 'F9', name: 'Standard Rooms' },
  { id: 'F10', name: 'Standard Rooms' },
  { id: 'F11', name: 'Deluxe Rooms' },
  { id: 'F12', name: 'Deluxe Rooms' },
  { id: 'F13', name: 'Executive Rooms' },
  { id: 'F14', name: 'Executive Rooms' },
  { id: 'F15', name: 'VIP Suites' },
  { id: 'F16', name: 'VIP Suites' },
  { id: 'F17', name: 'Penthouse Suites' },
  { id: 'F18', name: 'Penthouse Suites' },
  { id: 'F19', name: 'Datacenter & Intel' },
  { id: 'F20', name: 'Safe House & Office' },
  { id: 'F21', name: 'Rooftop Terrace' },
]

export function validateAllPresets(
  presetResolver?: (label: string) => FloorPresetData | undefined,
): ValidationReport {
  const results: FloorValidationResult[] = []
  for (const { id, name } of FLOOR_LABELS) {
    if (!presetResolver) continue
    const preset = presetResolver(id)
    if (!preset) continue
    const rooms = preset.rooms.map(r => ({ ...r } as RoomData))
    const objects = preset.objects.map(o => ({ ...o } as ObjectData))
    results.push(validateFloor(id, name, rooms, objects))
  }
  const totalViolations = results.reduce((s, r) => s + r.violations.length, 0)
  const totalPassed = results.reduce((s, r) => s + r.passed, 0)
  const totalFailed = results.reduce((s, r) => s + r.failed, 0)
  return { results, totalViolations, totalPassed, totalFailed }
}

export function validateCurrentFloor(
  floorLabel: string,
  floorName: string,
  rooms: RoomData[],
  objects: ObjectData[],
  canvasW: number,
  canvasH: number,
): FloorValidationResult {
  return validateFloor(floorLabel, floorName, rooms, objects, canvasW, canvasH)
}

function assetSize(type: string): { w: number; h: number } {
  const a = BUILTIN_ASSETS.find(a => a.id === type)
  return { w: a ? a.w * TILE : TILE, h: a ? a.h * TILE : TILE }
}

function makeObjectData(id: string, type: string, x: number, y: number): ObjectData {
  const { w, h } = assetSize(type)
  const a = BUILTIN_ASSETS.find(a => a.id === type)
  const isRound = a && (a.shape === 'circle' || a.shape === 'round')
  const sx = Math.round(x / TILE) * TILE
  const sy = Math.round(y / TILE) * TILE
  const o: ObjectData = { id, type, x: sx, y: sy, w, h, rotation: 0 as Rotation }
  if (isRound) {
    o.radius = Math.min(w, h) / 2 - 2
  }
  return o
}

export interface AutoFixResult {
  fixed: number
  remaining: number
  fixes: string[]
}

export function autoFixFloor(
  floorLabel: string,
  rooms: RoomData[],
  objects: ObjectData[],
  canvasW: number = 2000,
  canvasH: number = 800,
): AutoFixResult {
  const fixes: string[] = []
  const corridors = rooms.filter(r => isCorridor(r))
  const nonCorridors = rooms.filter(r => !isCorridor(r))
  let fixCount = 0

  // Fix 1: Clamp rooms/objects within canvas bounds
  for (const r of rooms) {
    if (r.x < 0) { r.x = 0; fixCount++; fixes.push(`Clamped room "${r.label}" x to 0`) }
    if (r.y < 0) { r.y = 0; fixCount++; fixes.push(`Clamped room "${r.label}" y to 0`) }
    if (r.x + r.w > canvasW) { r.x = Math.max(0, canvasW - r.w); fixCount++; fixes.push(`Clamped room "${r.label}" to canvas right`) }
    if (r.y + r.h > canvasH) { r.y = Math.max(0, canvasH - r.h); fixCount++; fixes.push(`Clamped room "${r.label}" to canvas bottom`) }
  }
  for (const o of objects) {
    if (o.x < 0) { o.x = 0; fixCount++; fixes.push(`Clamped object "${o.type}" x to 0`) }
    if (o.y < 0) { o.y = 0; fixCount++; fixes.push(`Clamped object "${o.type}" y to 0`) }
    if (o.x + o.w > canvasW) { o.x = Math.max(0, canvasW - o.w); fixCount++; fixes.push(`Clamped object "${o.type}" to canvas right`) }
    if (o.y + o.h > canvasH) { o.y = Math.max(0, canvasH - o.h); fixCount++; fixes.push(`Clamped object "${o.type}" to canvas bottom`) }
  }

  // Fix 2: Add missing elevators (up to MIN_ELEVATORS)
  const elevators = objects.filter(o => o.type === 'elevator')
  if (elevators.length < MIN_ELEVATORS) {
    const corridor = corridors[0]
    if (corridor) {
      const sz = 50
      const cy = corridor.y + Math.round(corridor.h / 2 - sz / 2)
      const need = MIN_ELEVATORS - elevators.length
      let added = 0
      for (let x = corridor.x + 20; x < corridor.x + corridor.w - sz - 20 && added < need; x += sz + 100) {
        const exists = objects.some(o => o.type === 'elevator' && o.x >= x - 5 && o.x <= x + 5)
        const overlaps = objects.some(o => o.x < x + sz && x < o.x + o.w && o.y < cy + sz && cy < o.y + o.h)
        if (!exists && !overlaps) {
          objects.push(makeObjectData(`${floorLabel}-autofix-elev${elevators.length + added}`, 'elevator', x, cy))
          added++
          fixCount++
        }
      }
      if (added > 0) fixes.push(`Added ${added} missing elevator(s)`)
    }
  }

  // Fix 3: Add doors to rooms missing corridor access
  for (const r of nonCorridors) {
    const hasDoor = objects.some(o => o.type.startsWith('door') && doorConnectsRooms(o, [r]).length > 0)
    const hasCorridorEdge = corridors.some(c => roomsShareEdge(r, c))
    if (!hasDoor && !hasCorridorEdge) {
      // Find nearest corridor and try to place a door on the shared edge
      for (const c of corridors) {
        const door = tryPlaceDoorBetween(r, c)
        if (door) {
          objects.push(door)
          fixCount++
          fixes.push(`Added door to room "${r.label}"`)
          break
        }
      }
    }
  }

  // Fix 4: Remove furniture from corridors (except trash bins and elevators)
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i]
    if (o.type.startsWith('door') || o.type === 'elevator' || o.type === 'trash-bin') continue
    const inCorridor = corridors.some(c =>
      o.x >= c.x && o.x + o.w <= c.x + c.w && o.y >= c.y && o.y + o.h <= c.y + c.h
    )
    if (inCorridor) {
      objects.splice(i, 1)
      fixCount++
      fixes.push(`Removed "${o.type}" from corridor`)
    }
  }

  // Fix 5: Move trash bins out of guest rooms into nearest corridor
  for (const o of objects) {
    if (o.type !== 'trash-bin') continue
    const inGuestRoom = nonCorridors.some(r => isGuestRoom(r) &&
      o.x >= r.x && o.x + o.w <= r.x + r.w && o.y >= r.y && o.y + o.h <= r.y + r.h)
    if (inGuestRoom && corridors.length > 0) {
      const c = corridors[0]
      o.x = c.x + 50
      o.y = c.y + Math.round(c.h / 2 - 12)
      fixCount++
      fixes.push(`Moved trash bin from guest room to corridor`)
    }
  }

  // Fix 6: Add missing trash bins to corridors (min 2)
  const corridorBins = objects.filter(o => o.type === 'trash-bin' && corridors.some(c =>
    o.x >= c.x && o.x + o.w <= c.x + c.w && o.y >= c.y && o.y + o.h <= c.y + c.h
  ))
  if (corridorBins.length < 2 && corridors.length > 0) {
    const c = corridors[0]
    const need = 2 - corridorBins.length
    for (let i = 0; i < need; i++) {
      const x = c.x + 160 + i * 200
      const y = c.y + Math.round(c.h / 2 - 12)
      objects.push(makeObjectData(`${floorLabel}-autofix-trash${i}`, 'trash-bin', x, y))
      fixCount++
    }
    fixes.push(`Added ${need} trash bin(s) to corridor`)
  }

  // Fix 7: Add missing furniture to guest rooms (bed, bathtub, wardrobe)
  for (const r of nonCorridors) {
    if (!isGuestRoom(r)) continue
    const furn = objectsInRoom(r, objects)
    const hasBed = furn.some(o => o.type === 'bed')
    const hasBath = furn.some(o => o.type === 'bathtub')
    const hasWardrobe = furn.some(o => o.type === 'wardrobe')
    const pad = 25
    if (!hasBed) {
      objects.push(makeObjectData(`${r.id}-autofix-bed`, 'bed', r.x + pad, r.y + pad))
      fixCount++; fixes.push(`Added bed to "${r.label}"`)
    }
    if (!hasBath) {
      objects.push(makeObjectData(`${r.id}-autofix-bath`, 'bathtub', r.x + r.w - 50 - pad, r.y + r.h - 50 - pad))
      fixCount++; fixes.push(`Added bathtub to "${r.label}"`)
    }
    if (!hasWardrobe) {
      objects.push(makeObjectData(`${r.id}-autofix-ward`, 'wardrobe', r.x + pad, r.y + r.h - 50 - pad))
      fixCount++; fixes.push(`Added wardrobe to "${r.label}"`)
    }
  }

  // Fix 8: Add missing kitchen furniture (prep-station, storage-shelf)
  const kitchen = nonCorridors.find(r => (r.label || '').toUpperCase().includes('KITCHEN'))
  if (kitchen) {
    const furn = objectsInRoom(kitchen, objects)
    const pad = 25
    if (!furn.some(o => o.type === 'prep-station')) {
      objects.push(makeObjectData(`${kitchen.id}-autofix-prep`, 'prep-station', kitchen.x + pad, kitchen.y + pad))
      fixCount++; fixes.push(`Added prep-station to "${kitchen.label}"`)
    }
    if (!furn.some(o => o.type === 'storage-shelf')) {
      objects.push(makeObjectData(`${kitchen.id}-autofix-shelf`, 'storage-shelf', kitchen.x + kitchen.w - 50 - pad, kitchen.y + pad))
      fixCount++; fixes.push(`Added storage-shelf to "${kitchen.label}"`)
    }
  }

  // Fix 9: Resize undersized rooms to minimum
  for (const r of nonCorridors) {
    if (isGuestRoom(r)) {
      if (isDeluxeTierGuestRoom(r)) {
        if (r.w < MIN_ROOM_DELUXE_PX_W) { r.w = MIN_ROOM_DELUXE_PX_W; fixCount++; fixes.push(`Resized "${r.label}" to min width`) }
        if (r.h < MIN_ROOM_DELUXE_PX_H) { r.h = MIN_ROOM_DELUXE_PX_H; fixCount++; fixes.push(`Resized "${r.label}" to min height`) }
      } else {
        if (r.w < MIN_ROOM_STD_PX) { r.w = MIN_ROOM_STD_PX; fixCount++; fixes.push(`Resized "${r.label}" to min width`) }
        if (r.h < MIN_ROOM_STD_PX) { r.h = MIN_ROOM_STD_PX; fixCount++; fixes.push(`Resized "${r.label}" to min height`) }
      }
    }
  }

  // Fix 10: Snap all objects to tile boundaries
  for (const o of objects) {
    const sx = Math.round(o.x / TILE) * TILE
    const sy = Math.round(o.y / TILE) * TILE
    if (sx !== o.x || sy !== o.y) {
      o.x = sx
      o.y = sy
      fixCount++
    }
  }

  // Validate remaining issues
  const result = validateFloor(floorLabel, '', rooms, objects, canvasW, canvasH)
  return { fixed: fixCount, remaining: result.violations.length, fixes }
}

function tryPlaceDoorBetween(room: RoomData, corridor: RoomData): ObjectData | null {
  // Check if rooms share a horizontal edge (room above corridor or below)
  const topTouch = Math.abs(room.y + room.h - corridor.y) < 2
  const botTouch = Math.abs(corridor.y + corridor.h - room.y) < 2
  if (topTouch || botTouch) {
    const doorX = Math.round(room.x + room.w / 2 - 12)
    const doorY = topTouch ? corridor.y - 12 : corridor.y + corridor.h - 12
    return makeObjectData(`${room.id}-autofix-door`, 'door-standard', doorX, doorY)
  }
  // Check if rooms share a vertical edge
  const leftTouch = Math.abs(room.x + room.w - corridor.x) < 2
  const rightTouch = Math.abs(corridor.x + corridor.w - room.x) < 2
  if (leftTouch || rightTouch) {
    const doorY = Math.round(room.y + room.h / 2 - 12)
    const doorX = leftTouch ? corridor.x - 12 : corridor.x + corridor.w - 12
    return makeObjectData(`${room.id}-autofix-door`, 'door-standard', doorX, doorY)
  }
  return null
}
