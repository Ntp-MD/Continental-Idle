import type { FloorId } from '@/types'

export interface RoomLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  sub: string
  visual?: boolean
}

export const SVG_W = 900
export const SVG_H = 600
export const THUMB_W = 180
export const THUMB_H = 100

export const FLOOR_IDS: FloorId[] = ['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

export const FLOOR_NAMES: Record<FloorId, string> = {
  G: 'Basement',
  '1': 'Lobby',
  '2': 'Restaurant & Bar',
  '3': 'Standard Rooms',
  '4': 'Deluxe Rooms',
  '5': 'Executive Rooms',
  '6': 'Presidential Suites',
  '7': 'VIP Suites',
  '8': 'Penthouse',
  '9': 'Security',
  '10': 'Intel & Management',
  '11': 'Rooftop',
}

export const FLOOR_LAYOUT: Record<FloorId, RoomLayout[]> = {
  G: [
    { id: 'blackMarket', x: 40, y: 80, w: 380, h: 200, label: 'Black Market', sub: 'Hidden Trading' },
    { id: 'vault', x: 440, y: 80, w: 420, h: 200, label: 'Continental Vault', sub: 'Secure Storage' },
    { id: 'underground', x: 40, y: 300, w: 820, h: 120, label: 'Underground Services', sub: 'Visual Only', visual: true },
  ],
  '1': [
    { id: 'reception', x: 250, y: 80, w: 400, h: 180, label: 'Grand Lobby', sub: 'Reception Desk' },
    { id: 'concierge', x: 40, y: 80, w: 190, h: 180, label: 'Concierge', sub: 'Guest Services' },
    { id: 'lounge', x: 670, y: 80, w: 190, h: 180, label: 'Waiting Lounge', sub: 'Seating Area' },
    { id: 'elevator', x: 380, y: 280, w: 140, h: 80, label: 'Elevator', sub: '' },
    { id: 'entrance', x: 380, y: 380, w: 140, h: 60, label: 'Main Entrance', sub: '' },
  ],
  '2': [
    { id: 'kitchen', x: 40, y: 80, w: 400, h: 300, label: 'Kitchen', sub: 'Fine Dining' },
    { id: 'bar', x: 460, y: 80, w: 400, h: 300, label: 'Bar / Lounge', sub: 'No Business Conducted' },
  ],
  '3': [
    { id: 'laundry', x: 40, y: 80, w: 250, h: 200, label: 'Laundry Service', sub: '' },
    { id: 'staffRoom', x: 310, y: 80, w: 250, h: 200, label: 'Staff Room', sub: 'Visual Only', visual: true },
    { id: 'guestRooms', x: 40, y: 300, w: 820, h: 180, label: 'Standard Rooms', sub: 'Level 1-12' },
  ],
  '4': [
    { id: 'guestRooms', x: 40, y: 80, w: 820, h: 400, label: 'Deluxe Rooms', sub: 'Level 13-25' },
  ],
  '5': [
    { id: 'guestRooms', x: 40, y: 80, w: 820, h: 400, label: 'Executive Rooms', sub: 'Level 26-38' },
  ],
  '6': [
    { id: 'guestRooms', x: 40, y: 80, w: 820, h: 400, label: 'Presidential Suites', sub: 'Level 39-50' },
  ],
  '7': [
    { id: 'vip', x: 40, y: 80, w: 820, h: 400, label: 'VIP Suites', sub: 'Exclusive Guests' },
  ],
  '8': [
    { id: 'vip', x: 40, y: 80, w: 820, h: 400, label: 'Penthouse', sub: 'Presidential Penthouse' },
  ],
  '9': [
    { id: 'armory', x: 40, y: 80, w: 400, h: 300, label: 'Armory', sub: 'Weapon Storage' },
    { id: 'safeHouse', x: 460, y: 80, w: 400, h: 300, label: 'Safe House', sub: 'Secure Bunker' },
  ],
  '10': [
    { id: 'intelNetwork', x: 40, y: 80, w: 400, h: 300, label: 'Intelligence Network', sub: 'Comms Center' },
    { id: 'managerOffice', x: 460, y: 80, w: 400, h: 300, label: "Manager's Office", sub: 'Visual Only', visual: true },
  ],
  '11': [
    { id: 'rooftop', x: 40, y: 80, w: 820, h: 400, label: 'Rooftop Terrace', sub: 'Helipad', visual: true },
  ],
}

export const ROOM_TO_FLOOR: Record<string, FloorId> = {
  reception: '1',
  kitchen: '2',
  bar: '2',
  laundry: '3',
  guestRooms: '3',
  vip: '7',
  armory: '9',
  safeHouse: '9',
  intelNetwork: '10',
  blackMarket: 'G',
  vault: 'G',
  underground: 'G',
}

export function getBuildingFloor(buildingId: string): FloorId {
  return ROOM_TO_FLOOR[buildingId] || '1'
}

export function getGuestRoomTier(buildingLevel: number): FloorId {
  if (buildingLevel >= 39) return '6'
  if (buildingLevel >= 26) return '5'
  if (buildingLevel >= 13) return '4'
  return '3'
}

export function isFloorUnlocked(floor: FloorId, buildings: Record<string, { level: number; unlocked: boolean }>): boolean {
  switch (floor) {
    case 'G': return buildings['blackMarket']?.unlocked || buildings['vault']?.unlocked || buildings['underground']?.unlocked
    case '1': return true
    case '2': return buildings['kitchen']?.unlocked || buildings['bar']?.unlocked
    case '3': return buildings['guestRooms']?.unlocked || buildings['laundry']?.unlocked
    case '4': return (buildings['guestRooms']?.level || 0) >= 13
    case '5': return (buildings['guestRooms']?.level || 0) >= 26
    case '6': return (buildings['guestRooms']?.level || 0) >= 39
    case '7': return buildings['vip']?.unlocked
    case '8': return buildings['vip']?.unlocked
    case '9': return buildings['armory']?.unlocked || buildings['safeHouse']?.unlocked
    case '10': return buildings['intelNetwork']?.unlocked
    case '11': return true
    default: return false
  }
}

export function getRoomsOnFloor(floor: FloorId): RoomLayout[] {
  return FLOOR_LAYOUT[floor] || []
}

export interface PathNode {
  x: number
  y: number
}

export const CORRIDOR_NODES: Record<FloorId, PathNode[]> = {
  G: [{ x: 200, y: 250 }, { x: 450, y: 250 }, { x: 700, y: 250 }, { x: 450, y: 360 }],
  '1': [{ x: 140, y: 200 }, { x: 450, y: 200 }, { x: 760, y: 200 }, { x: 450, y: 320 }, { x: 450, y: 420 }],
  '2': [{ x: 240, y: 250 }, { x: 660, y: 250 }],
  '3': [{ x: 165, y: 200 }, { x: 435, y: 200 }, { x: 450, y: 400 }],
  '4': [{ x: 200, y: 300 }, { x: 450, y: 300 }, { x: 700, y: 300 }],
  '5': [{ x: 200, y: 300 }, { x: 450, y: 300 }, { x: 700, y: 300 }],
  '6': [{ x: 200, y: 300 }, { x: 450, y: 300 }, { x: 700, y: 300 }],
  '7': [{ x: 200, y: 300 }, { x: 450, y: 300 }, { x: 700, y: 300 }],
  '8': [{ x: 200, y: 300 }, { x: 450, y: 300 }, { x: 700, y: 300 }],
  '9': [{ x: 240, y: 250 }, { x: 660, y: 250 }],
  '10': [{ x: 240, y: 250 }, { x: 660, y: 250 }],
  '11': [],
}

export const ROOM_ANCHORS: Record<FloorId, Record<string, [number, number][]>> = {
  G: {
    blackMarket: [[150, 180], [300, 180], [200, 250]],
    vault: [[550, 180], [700, 180], [650, 250]],
    underground: [[200, 360], [450, 360], [700, 360]],
  },
  '1': {
    reception: [[350, 170], [450, 170], [550, 170], [400, 220], [500, 220]],
    concierge: [[120, 170], [180, 170], [130, 220]],
    lounge: [[740, 170], [800, 170], [760, 220]],
    entrance: [[450, 420]],
  },
  '2': {
    kitchen: [[150, 200], [300, 200], [200, 280], [350, 280]],
    bar: [[550, 200], [700, 200], [600, 280], [750, 280]],
  },
  '3': {
    laundry: [[120, 170], [200, 170], [160, 230]],
    staffRoom: [[380, 170], [480, 170], [430, 230]],
    guestRooms: [[150, 380], [350, 380], [550, 380], [750, 380]],
  },
  '4': { guestRooms: [[150, 250], [350, 250], [550, 250], [750, 250]] },
  '5': { guestRooms: [[150, 250], [350, 250], [550, 250], [750, 250]] },
  '6': { guestRooms: [[150, 250], [350, 250], [550, 250], [750, 250]] },
  '7': { vip: [[150, 250], [350, 250], [550, 250], [750, 250]] },
  '8': { vip: [[150, 250], [350, 250], [550, 250], [750, 250]] },
  '9': {
    armory: [[150, 200], [300, 200], [200, 280]],
    safeHouse: [[550, 200], [700, 200], [650, 280]],
  },
  '10': {
    intelNetwork: [[150, 200], [300, 200], [200, 280]],
    managerOffice: [[550, 200], [700, 200], [650, 280]],
  },
  '11': {},
}

export const ELEVATOR_X = 450

export const ELEVATOR_NODES: Record<FloorId, [number, number]> = {
  G: [ELEVATOR_X, 360],
  '1': [ELEVATOR_X, 320],
  '2': [ELEVATOR_X, 250],
  '3': [ELEVATOR_X, 400],
  '4': [ELEVATOR_X, 300],
  '5': [ELEVATOR_X, 300],
  '6': [ELEVATOR_X, 300],
  '7': [ELEVATOR_X, 300],
  '8': [ELEVATOR_X, 300],
  '9': [ELEVATOR_X, 250],
  '10': [ELEVATOR_X, 250],
  '11': [ELEVATOR_X, 300],
}

export const GOLD = '#c9a84c'
export const GOLD_DIM = '#8a7340'
export const GOLD_DARK = '#5a5a5a'
export const BG_DARK = '#1a1a1a'
export const BG_DARKER = '#0d0d0d'
export const BG_CORRIDOR = '#111111'
export const LABEL_DARK = '#333333'

export const STAFF_COLORS: Record<string, string> = {
  concierge: '#00e5ff',
  bartender: '#00bfa5',
  chef: '#00c853',
  cleaner: '#2196f3',
  sommelier: '#18ffff',
  intelOfficer: '#00b0ff',
  adjudicator: '#69f0ae',
  vaultKeeper: '#00e676',
}

export const ASSASSIN_COLORS: Record<string, string> = {
  streetSamurai: '#ff1744',
  enforcer: '#d50000',
  shadowBlade: '#ff5252',
  royalGuard: '#ff8a80',
  highTableEnforcer: '#b71c1c',
}

export const GUEST_COLORS = ['#d4af37', '#e6c86e', '#f0d77b', '#c9a84c', '#b8973f']
