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
    { id: 'blackMarket', x: 40, y: 40, w: 400, h: 240, label: 'Black Market', sub: 'Hidden Trading' },
    { id: 'vault', x: 460, y: 40, w: 400, h: 240, label: 'Continental Vault', sub: 'Secure Storage' },
    { id: 'underground', x: 40, y: 300, w: 820, h: 250, label: 'Underground Services', sub: 'Visual Only', visual: true },
  ],
  '1': [
    { id: 'concierge', x: 40, y: 40, w: 200, h: 220, label: 'Concierge', sub: 'Guest Services' },
    { id: 'reception', x: 260, y: 40, w: 380, h: 220, label: 'Grand Lobby', sub: 'Reception Desk' },
    { id: 'lounge', x: 660, y: 40, w: 200, h: 220, label: 'Waiting Lounge', sub: 'Seating Area' },
    { id: 'elevator', x: 380, y: 280, w: 140, h: 100, label: 'Elevator', sub: '' },
    { id: 'entrance', x: 380, y: 400, w: 140, h: 150, label: 'Main Entrance', sub: '' },
  ],
  '2': [
    { id: 'kitchen', x: 40, y: 40, w: 400, h: 510, label: 'Kitchen', sub: 'Fine Dining' },
    { id: 'bar', x: 460, y: 40, w: 400, h: 510, label: 'Bar / Lounge', sub: 'No Business Conducted' },
  ],
  '3': [
    { id: 'laundry', x: 40, y: 40, w: 260, h: 240, label: 'Laundry Service', sub: '' },
    { id: 'staffRoom', x: 320, y: 40, w: 260, h: 240, label: 'Staff Room', sub: 'Visual Only', visual: true },
    { id: 'guestRooms', x: 40, y: 300, w: 820, h: 250, label: 'Standard Rooms', sub: 'Level 1-12' },
  ],
  '4': [
    { id: 'guestRooms', x: 40, y: 40, w: 820, h: 510, label: 'Deluxe Rooms', sub: 'Level 13-25' },
  ],
  '5': [
    { id: 'guestRooms', x: 40, y: 40, w: 820, h: 510, label: 'Executive Rooms', sub: 'Level 26-38' },
  ],
  '6': [
    { id: 'guestRooms', x: 40, y: 40, w: 820, h: 510, label: 'Presidential Suites', sub: 'Level 39-50' },
  ],
  '7': [
    { id: 'vip', x: 40, y: 40, w: 820, h: 510, label: 'VIP Suites', sub: 'Exclusive Guests' },
  ],
  '8': [
    { id: 'vip', x: 40, y: 40, w: 820, h: 510, label: 'Penthouse', sub: 'Presidential Penthouse' },
  ],
  '9': [
    { id: 'armory', x: 40, y: 40, w: 400, h: 510, label: 'Armory', sub: 'Weapon Storage' },
    { id: 'safeHouse', x: 460, y: 40, w: 400, h: 510, label: 'Safe House', sub: 'Secure Bunker' },
  ],
  '10': [
    { id: 'intelNetwork', x: 40, y: 40, w: 400, h: 510, label: 'Intelligence Network', sub: 'Comms Center' },
    { id: 'managerOffice', x: 460, y: 40, w: 400, h: 510, label: "Manager's Office", sub: 'Visual Only', visual: true },
  ],
  '11': [
    { id: 'rooftop', x: 40, y: 40, w: 820, h: 510, label: 'Rooftop Terrace', sub: 'Helipad', visual: true },
  ],
}

export type FurnitureType = 'rect' | 'circle' | 'line' | 'path' | 'text' | 'ellipse'

export interface FurnitureElement {
  type: FurnitureType
  x: number
  y: number
  w?: number
  h?: number
  r?: number
  rx?: number
  ry?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  d?: string
  text?: string
  fontSize?: number
  textAnchor?: string
  opacity?: number
  transform?: string
  y2?: number
  x2?: number
}

export const FURNITURE_COLORS = {
  wood: '#3d2b1f',
  woodLight: '#5c4033',
  woodDark: '#2a1a10',
  metal: '#4a4a4a',
  metalDark: '#2a2a2a',
  metalLight: '#6a6a6a',
  fabric: '#1a1a2e',
  fabricLight: '#252540',
  leather: '#2a1a0a',
  glass: '#0a1a2a',
  glassLight: '#0a2a3a',
  plant: '#1a3a1a',
  plantLight: '#2a5a2a',
  gold: '#c9a84c',
  goldDim: '#8a7340',
  dark: '#0a0a0a',
  darker: '#050505',
  accent: '#1a1a1a',
  accentLight: '#222222',
  white: '#888888',
  red: '#3a1a1a',
  blue: '#1a2a3a',
  green: '#1a3a2a',
}

export const ROOM_FURNITURE: Record<string, FurnitureElement[]> = {
  blackMarket: [
    { type: 'rect', x: 60, y: 60, w: 80, h: 30, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 60, y: 90, w: 80, h: 20, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 160, y: 60, w: 60, h: 50, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 190, y: 60, x2: 190, y2: 110, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 240, y: 70, w: 120, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 250, y: 80, w: 40, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 300, y: 80, w: 50, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 140, w: 200, h: 25, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 100, y: 190, r: 12, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'circle', x: 140, y: 190, r: 10, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'rect', x: 180, y: 180, w: 80, h: 25, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 280, y: 150, w: 120, h: 60, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.metalDark, strokeWidth: 1 },
    { type: 'line', x: 280, y: 180, x2: 400, y2: 180, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 300, y: 160, w: 30, h: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 340, y: 160, w: 30, h: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 380, y: 160, w: 30, h: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
  ],
  vault: [
    { type: 'circle', x: 660, y: 160, r: 50, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 2 },
    { type: 'circle', x: 660, y: 160, r: 40, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'circle', x: 660, y: 160, r: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'line', x: 660, y: 130, x2: 660, y2: 190, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'line', x: 630, y: 160, x2: 690, y2: 160, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 480, y: 60, w: 60, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 480, y: 80, x2: 540, y2: 80, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 480, y: 100, x2: 540, y2: 100, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 480, y: 120, x2: 540, y2: 120, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 560, y: 60, w: 60, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 560, y: 80, x2: 620, y2: 80, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 560, y: 100, x2: 620, y2: 100, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 560, y: 120, x2: 620, y2: 120, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 480, y: 160, w: 140, h: 50, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 170, w: 30, h: 35, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 525, y: 170, w: 30, h: 35, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 560, y: 170, w: 30, h: 35, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 740, y: 60, w: 100, h: 150, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 740, y: 90, x2: 840, y2: 90, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 740, y: 120, x2: 840, y2: 120, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 740, y: 150, x2: 840, y2: 150, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 740, y: 180, x2: 840, y2: 180, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
  ],
  underground: [
    { type: 'rect', x: 80, y: 320, w: 60, h: 60, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'circle', x: 110, y: 350, r: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 1 },
    { type: 'rect', x: 170, y: 330, w: 50, h: 50, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'line', x: 170, y: 345, x2: 220, y2: 345, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'line', x: 170, y: 360, x2: 220, y2: 360, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'line', x: 170, y: 375, x2: 220, y2: 375, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 250, y: 320, w: 40, h: 40, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'circle', x: 270, y: 340, r: 12, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 320, y: 330, w: 100, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 330, y: 340, w: 80, h: 20, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 450, y: 320, w: 80, h: 50, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 450, y: 335, x2: 530, y2: 335, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 450, y: 350, x2: 530, y2: 350, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 450, y: 365, x2: 530, y2: 365, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 560, y: 320, w: 60, h: 60, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 590, y: 350, r: 18, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'rect', x: 650, y: 330, w: 180, h: 50, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.metalDark, strokeWidth: 1 },
    { type: 'line', x: 650, y: 350, x2: 830, y2: 350, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 670, y: 340, w: 40, h: 30, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 720, y: 340, w: 40, h: 30, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 770, y: 340, w: 40, h: 30, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 80, y: 420, w: 700, h: 20, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metalDark, strokeWidth: 0.5, opacity: 0.5 },
    { type: 'line', x: 80, y: 430, x2: 780, y2: 430, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3, opacity: 0.5 },
  ],
  concierge: [
    { type: 'rect', x: 60, y: 80, w: 120, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 60, y: 130, w: 120, h: 10, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 80, y: 90, w: 40, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 130, y: 90, w: 40, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'circle', x: 120, y: 150, r: 5, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 180, w: 100, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 80, y: 190, w: 80, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  reception: [
    { type: 'rect', x: 300, y: 80, w: 300, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1.5 },
    { type: 'rect', x: 300, y: 120, w: 300, h: 15, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 320, y: 90, w: 60, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 400, y: 90, w: 60, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 480, y: 90, w: 60, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 560, y: 90, w: 30, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'circle', x: 450, y: 110, r: 4, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 350, y: 160, w: 80, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 360, y: 170, w: 60, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 470, y: 160, w: 80, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 480, y: 170, w: 60, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 420, y: 150, w: 60, h: 15, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  lounge: [
    { type: 'rect', x: 680, y: 80, w: 160, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 690, y: 90, w: 140, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 720, y: 140, w: 80, h: 30, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 730, y: 148, w: 60, h: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 680, y: 190, w: 60, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 760, y: 190, w: 60, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 830, y: 200, r: 15, fill: FURNITURE_COLORS.plant, stroke: FURNITURE_COLORS.plantLight, strokeWidth: 1 },
    { type: 'rect', x: 825, y: 210, w: 10, h: 20, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  elevator: [
    { type: 'rect', x: 395, y: 290, w: 50, h: 70, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 420, y: 290, x2: 420, y2: 360, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 410, y: 300, w: 20, h: 15, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'circle', x: 445, y: 325, r: 3, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
  ],
  entrance: [
    { type: 'rect', x: 420, y: 410, w: 60, h: 130, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 1, opacity: 0.6 },
    { type: 'line', x: 450, y: 410, x2: 450, y2: 540, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 410, y: 520, w: 80, h: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 380, y: 420, w: 20, h: 100, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 500, y: 420, w: 20, h: 100, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
  ],
  kitchen: [
    { type: 'rect', x: 60, y: 60, w: 160, h: 50, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'rect', x: 70, y: 70, w: 40, h: 30, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'circle', x: 90, y: 85, r: 8, fill: FURNITURE_COLORS.red, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 120, y: 70, w: 40, h: 30, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'circle', x: 140, y: 85, r: 8, fill: FURNITURE_COLORS.blue, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 130, w: 340, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'line', x: 60, y: 145, x2: 400, y2: 145, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 180, w: 100, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 190, w: 80, h: 40, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 180, y: 180, w: 100, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 190, y: 190, w: 80, h: 40, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 260, w: 340, h: 25, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 80, y: 265, w: 60, h: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 160, y: 265, w: 60, h: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 240, y: 265, w: 60, h: 15, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 310, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 320, w: 100, h: 60, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 200, y: 310, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 210, y: 320, w: 100, h: 60, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 420, w: 340, h: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'circle', x: 100, y: 435, r: 8, fill: FURNITURE_COLORS.metal, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'circle', x: 140, y: 435, r: 8, fill: FURNITURE_COLORS.metal, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'circle', x: 180, y: 435, r: 8, fill: FURNITURE_COLORS.metal, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 480, w: 340, h: 50, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 490, w: 320, h: 30, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  bar: [
    { type: 'rect', x: 480, y: 60, w: 360, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1.5 },
    { type: 'rect', x: 480, y: 100, w: 360, h: 10, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 500, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 530, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 560, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 590, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 620, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 650, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 680, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 710, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 740, y: 70, w: 20, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'circle', x: 510, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 560, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 610, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 660, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 710, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 760, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 810, y: 130, r: 8, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 160, w: 100, h: 60, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 170, w: 80, h: 40, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 600, y: 160, w: 100, h: 60, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 610, y: 170, w: 80, h: 40, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 720, y: 160, w: 100, h: 60, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 730, y: 170, w: 80, h: 40, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 250, w: 360, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 480, y: 300, w: 160, h: 80, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 310, w: 140, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 680, y: 300, w: 160, h: 80, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 690, y: 310, w: 140, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 620, y: 320, w: 80, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 630, y: 330, w: 60, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 420, w: 360, h: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 500, y: 425, w: 50, h: 20, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 560, y: 425, w: 50, h: 20, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 620, y: 425, w: 50, h: 20, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 680, y: 425, w: 50, h: 20, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 740, y: 425, w: 50, h: 20, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 480, w: 360, h: 50, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 520, y: 505, r: 10, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5, opacity: 0.3 },
    { type: 'circle', x: 800, y: 505, r: 10, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5, opacity: 0.3 },
  ],
  laundry: [
    { type: 'rect', x: 60, y: 60, w: 80, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'circle', x: 100, y: 100, r: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 1 },
    { type: 'circle', x: 100, y: 100, r: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 160, y: 60, w: 80, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'circle', x: 200, y: 100, r: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 1 },
    { type: 'circle', x: 200, y: 100, r: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 160, w: 180, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 168, w: 160, h: 18, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 210, w: 180, h: 25, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 215, w: 50, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 130, y: 215, w: 50, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 190, y: 215, w: 40, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  staffRoom: [
    { type: 'rect', x: 340, y: 60, w: 120, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 350, y: 70, w: 100, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 60, w: 80, h: 100, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 70, w: 25, h: 80, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 520, y: 70, w: 25, h: 80, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 340, y: 120, w: 120, h: 30, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 350, y: 128, w: 100, h: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 340, y: 170, w: 60, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 370, y: 195, r: 15, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 420, y: 170, w: 60, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 450, y: 195, r: 15, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  guestRooms: [
    { type: 'rect', x: 60, y: 60, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 70, y: 70, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 60, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 190, y: 70, w: 30, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 195, y: 75, w: 20, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'circle', x: 205, y: 85, r: 3, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 60, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 260, y: 70, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 60, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 380, y: 70, w: 30, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 385, y: 75, w: 20, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'circle', x: 395, y: 85, r: 3, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 440, y: 60, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 450, y: 70, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 440, y: 60, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 570, y: 70, w: 30, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 575, y: 75, w: 20, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'circle', x: 585, y: 85, r: 3, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 630, y: 60, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 640, y: 70, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 630, y: 60, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 760, y: 70, w: 30, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 765, y: 75, w: 20, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'circle', x: 775, y: 85, r: 3, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 180, w: 200, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 188, w: 180, h: 18, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 300, y: 180, w: 200, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 310, y: 188, w: 180, h: 18, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 540, y: 180, w: 200, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 550, y: 188, w: 180, h: 18, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 250, w: 100, h: 60, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 260, w: 80, h: 40, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 200, y: 250, w: 100, h: 60, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 210, y: 260, w: 80, h: 40, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 340, w: 780, h: 25, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5, opacity: 0.5 },
    { type: 'rect', x: 60, y: 390, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 70, y: 400, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 390, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 390, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 260, y: 400, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 390, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 440, y: 390, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 450, y: 400, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 440, y: 390, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 630, y: 390, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 640, y: 400, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 630, y: 390, w: 120, h: 10, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 490, w: 780, h: 20, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5, opacity: 0.5 },
  ],
  vip: [
    { type: 'rect', x: 60, y: 60, w: 180, h: 100, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 75, y: 75, w: 150, h: 70, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 60, w: 180, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 90, y: 55, w: 120, h: 10, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
    { type: 'rect', x: 260, y: 70, w: 50, h: 50, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 268, y: 78, w: 34, h: 34, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'circle', x: 285, y: 95, r: 5, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 340, y: 60, w: 180, h: 100, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 355, y: 75, w: 150, h: 70, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 340, y: 60, w: 180, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 370, y: 55, w: 120, h: 10, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
    { type: 'rect', x: 540, y: 70, w: 50, h: 50, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 548, y: 78, w: 34, h: 34, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'circle', x: 565, y: 95, r: 5, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 620, y: 60, w: 180, h: 100, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 635, y: 75, w: 150, h: 70, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 620, y: 60, w: 180, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 650, y: 55, w: 120, h: 10, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
    { type: 'rect', x: 60, y: 200, w: 300, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 75, y: 210, w: 270, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 400, y: 200, w: 80, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 410, y: 210, w: 60, h: 30, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 520, y: 200, w: 300, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 535, y: 210, w: 270, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 290, w: 780, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 298, w: 760, h: 18, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 350, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 75, y: 365, w: 90, h: 50, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 350, w: 120, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 350, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 265, y: 365, w: 90, h: 50, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 350, w: 120, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 440, y: 350, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 455, y: 365, w: 90, h: 50, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 440, y: 350, w: 120, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 630, y: 350, w: 120, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'rect', x: 645, y: 365, w: 90, h: 50, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 630, y: 350, w: 120, h: 15, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 460, w: 780, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5, opacity: 0.5 },
    { type: 'circle', x: 100, y: 475, r: 8, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
    { type: 'circle', x: 800, y: 475, r: 8, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
  ],
  armory: [
    { type: 'rect', x: 60, y: 60, w: 160, h: 200, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'line', x: 60, y: 100, x2: 220, y2: 100, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 60, y: 140, x2: 220, y2: 140, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 60, y: 180, x2: 220, y2: 180, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'line', x: 60, y: 220, x2: 220, y2: 220, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 70, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 140, y: 70, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 110, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 140, y: 110, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 150, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 140, y: 150, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 190, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 140, y: 190, w: 60, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 280, w: 340, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 290, w: 320, h: 30, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 350, w: 160, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 360, w: 140, h: 60, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 240, y: 350, w: 160, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 250, y: 360, w: 140, h: 60, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 450, w: 340, h: 40, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 460, w: 320, h: 25, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 510, w: 340, h: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5, opacity: 0.5 },
  ],
  safeHouse: [
    { type: 'rect', x: 480, y: 60, w: 80, h: 30, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 68, w: 60, h: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 580, y: 60, w: 80, h: 30, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 590, y: 68, w: 60, h: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 680, y: 60, w: 80, h: 30, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 690, y: 68, w: 60, h: 18, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 110, w: 340, h: 40, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 118, w: 80, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 580, y: 118, w: 80, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 670, y: 118, w: 80, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 760, y: 118, w: 50, h: 25, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 170, w: 100, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 180, w: 80, h: 30, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 600, y: 170, w: 100, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 610, y: 180, w: 80, h: 30, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 720, y: 170, w: 100, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 730, y: 180, w: 80, h: 30, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 240, w: 340, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 250, w: 320, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 310, w: 160, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 320, w: 140, h: 60, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 660, y: 310, w: 160, h: 80, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 670, y: 320, w: 140, h: 60, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 410, w: 340, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 480, y: 460, w: 340, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 470, w: 320, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 530, w: 340, h: 20, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5, opacity: 0.5 },
  ],
  intelNetwork: [
    { type: 'rect', x: 60, y: 60, w: 340, h: 60, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 1 },
    { type: 'rect', x: 70, y: 68, w: 80, h: 45, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 160, y: 68, w: 80, h: 45, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 250, y: 68, w: 80, h: 45, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 340, y: 68, w: 50, h: 45, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 140, w: 340, h: 40, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 148, w: 320, h: 25, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'line', x: 70, y: 155, x2: 390, y2: 155, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'line', x: 70, y: 162, x2: 390, y2: 162, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 200, w: 160, h: 100, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 210, w: 140, h: 80, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'circle', x: 100, y: 240, r: 5, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.5 },
    { type: 'circle', x: 130, y: 240, r: 5, fill: FURNITURE_COLORS.red, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.5 },
    { type: 'circle', x: 160, y: 240, r: 5, fill: FURNITURE_COLORS.green, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.5 },
    { type: 'rect', x: 240, y: 200, w: 160, h: 100, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 250, y: 210, w: 140, h: 80, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.metalLight, strokeWidth: 0.3 },
    { type: 'circle', x: 280, y: 240, r: 5, fill: FURNITURE_COLORS.green, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.5 },
    { type: 'circle', x: 310, y: 240, r: 5, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.5 },
    { type: 'circle', x: 340, y: 240, r: 5, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.5 },
    { type: 'rect', x: 60, y: 320, w: 340, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 330, w: 320, h: 25, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 380, w: 160, h: 80, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 390, w: 140, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 240, y: 380, w: 160, h: 80, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 250, y: 390, w: 140, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 480, w: 340, h: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 488, w: 80, h: 18, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 160, y: 488, w: 80, h: 18, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 250, y: 488, w: 80, h: 18, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 530, w: 340, h: 20, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5, opacity: 0.5 },
  ],
  managerOffice: [
    { type: 'rect', x: 480, y: 60, w: 200, h: 50, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 1 },
    { type: 'rect', x: 490, y: 70, w: 180, h: 30, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 540, y: 75, w: 80, h: 20, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 120, w: 80, h: 60, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 130, w: 60, h: 40, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 700, y: 60, w: 140, h: 180, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'line', x: 700, y: 90, x2: 840, y2: 90, stroke: FURNITURE_COLORS.woodLight, strokeWidth: 0.3 },
    { type: 'line', x: 700, y: 120, x2: 840, y2: 120, stroke: FURNITURE_COLORS.woodLight, strokeWidth: 0.3 },
    { type: 'line', x: 700, y: 150, x2: 840, y2: 150, stroke: FURNITURE_COLORS.woodLight, strokeWidth: 0.3 },
    { type: 'line', x: 700, y: 180, x2: 840, y2: 180, stroke: FURNITURE_COLORS.woodLight, strokeWidth: 0.3 },
    { type: 'line', x: 700, y: 210, x2: 840, y2: 210, stroke: FURNITURE_COLORS.woodLight, strokeWidth: 0.3 },
    { type: 'rect', x: 710, y: 70, w: 120, h: 15, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 710, y: 100, w: 120, h: 15, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 710, y: 130, w: 120, h: 15, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 710, y: 160, w: 120, h: 15, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 200, w: 200, h: 40, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 208, w: 180, h: 25, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 540, y: 220, r: 8, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
    { type: 'rect', x: 480, y: 260, w: 120, h: 80, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 270, w: 100, h: 60, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 620, y: 260, w: 60, h: 80, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 628, y: 270, w: 44, h: 60, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 360, w: 340, h: 30, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'circle', x: 530, y: 375, r: 12, fill: FURNITURE_COLORS.plant, stroke: FURNITURE_COLORS.plantLight, strokeWidth: 0.5 },
    { type: 'rect', x: 525, y: 382, w: 10, h: 15, fill: FURNITURE_COLORS.woodDark, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 410, w: 340, h: 50, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 490, y: 420, w: 320, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 480, y: 480, w: 340, h: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5, opacity: 0.5 },
    { type: 'rect', x: 480, y: 530, w: 340, h: 20, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5, opacity: 0.5 },
  ],
  rooftop: [
    { type: 'circle', x: 450, y: 200, r: 60, fill: FURNITURE_COLORS.darker, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 1 },
    { type: 'circle', x: 450, y: 200, r: 45, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5 },
    { type: 'text', x: 450, y: 205, text: 'H', fontSize: 24, textAnchor: 'middle', fill: FURNITURE_COLORS.goldDim },
    { type: 'rect', x: 60, y: 60, w: 140, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 68, w: 120, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 220, y: 60, w: 140, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 230, y: 68, w: 120, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 120, w: 60, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 130, w: 40, h: 40, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 140, y: 120, w: 60, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 150, y: 130, w: 40, h: 40, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 220, y: 120, w: 60, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 230, y: 130, w: 40, h: 40, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 560, y: 60, w: 140, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 570, y: 68, w: 120, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 720, y: 60, w: 140, h: 40, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 730, y: 68, w: 120, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 560, y: 120, w: 60, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 570, y: 130, w: 40, h: 40, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 640, y: 120, w: 60, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 650, y: 130, w: 40, h: 40, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 720, y: 120, w: 60, h: 60, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 730, y: 130, w: 40, h: 40, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 60, y: 300, w: 300, h: 50, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 70, y: 308, w: 280, h: 35, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 540, y: 300, w: 300, h: 50, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 550, y: 308, w: 280, h: 35, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'circle', x: 120, y: 400, r: 20, fill: FURNITURE_COLORS.plant, stroke: FURNITURE_COLORS.plantLight, strokeWidth: 0.5 },
    { type: 'circle', x: 780, y: 400, r: 20, fill: FURNITURE_COLORS.plant, stroke: FURNITURE_COLORS.plantLight, strokeWidth: 0.5 },
    { type: 'circle', x: 120, y: 460, r: 15, fill: FURNITURE_COLORS.plant, stroke: FURNITURE_COLORS.plantLight, strokeWidth: 0.5 },
    { type: 'circle', x: 780, y: 460, r: 15, fill: FURNITURE_COLORS.plant, stroke: FURNITURE_COLORS.plantLight, strokeWidth: 0.5 },
    { type: 'rect', x: 60, y: 490, w: 780, h: 30, fill: FURNITURE_COLORS.metalDark, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.5, opacity: 0.5 },
  ],
}

export function getRoomFurniture(roomId: string): FurnitureElement[] {
  return ROOM_FURNITURE[roomId] || []
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
  G: [{ x: 200, y: 280 }, { x: 450, y: 280 }, { x: 700, y: 280 }, { x: 450, y: 400 }],
  '1': [{ x: 140, y: 160 }, { x: 450, y: 160 }, { x: 760, y: 160 }, { x: 450, y: 320 }, { x: 450, y: 460 }],
  '2': [{ x: 240, y: 280 }, { x: 660, y: 280 }],
  '3': [{ x: 170, y: 160 }, { x: 450, y: 160 }, { x: 450, y: 420 }],
  '4': [{ x: 200, y: 280 }, { x: 450, y: 280 }, { x: 700, y: 280 }],
  '5': [{ x: 200, y: 280 }, { x: 450, y: 280 }, { x: 700, y: 280 }],
  '6': [{ x: 200, y: 280 }, { x: 450, y: 280 }, { x: 700, y: 280 }],
  '7': [{ x: 200, y: 280 }, { x: 450, y: 280 }, { x: 700, y: 280 }],
  '8': [{ x: 200, y: 280 }, { x: 450, y: 280 }, { x: 700, y: 280 }],
  '9': [{ x: 240, y: 280 }, { x: 660, y: 280 }],
  '10': [{ x: 240, y: 280 }, { x: 660, y: 280 }],
  '11': [],
}

export const ROOM_ANCHORS: Record<FloorId, Record<string, [number, number][]>> = {
  G: {
    blackMarket: [[150, 150], [300, 150], [200, 220], [350, 220]],
    vault: [[550, 150], [700, 150], [600, 220], [750, 220]],
    underground: [[200, 380], [450, 380], [700, 380], [400, 480], [600, 480]],
  },
  '1': {
    concierge: [[120, 150], [180, 150], [130, 220], [170, 220]],
    reception: [[350, 150], [450, 150], [550, 150], [400, 220], [500, 220]],
    lounge: [[740, 150], [800, 150], [760, 220], [800, 220]],
    entrance: [[450, 460], [420, 500], [480, 500]],
  },
  '2': {
    kitchen: [[150, 150], [300, 150], [200, 280], [350, 280], [200, 420], [350, 420]],
    bar: [[550, 150], [700, 150], [600, 280], [750, 280], [600, 420], [750, 420]],
  },
  '3': {
    laundry: [[120, 150], [200, 150], [160, 220], [220, 220]],
    staffRoom: [[400, 150], [480, 150], [430, 220], [500, 220]],
    guestRooms: [[150, 380], [350, 380], [550, 380], [750, 380], [250, 480], [550, 480]],
  },
  '4': { guestRooms: [[150, 150], [350, 150], [550, 150], [750, 150], [200, 300], [450, 300], [700, 300], [250, 450], [550, 450]] },
  '5': { guestRooms: [[150, 150], [350, 150], [550, 150], [750, 150], [200, 300], [450, 300], [700, 300], [250, 450], [550, 450]] },
  '6': { guestRooms: [[150, 150], [350, 150], [550, 150], [750, 150], [200, 300], [450, 300], [700, 300], [250, 450], [550, 450]] },
  '7': { vip: [[150, 150], [350, 150], [550, 150], [750, 150], [200, 300], [450, 300], [700, 300], [250, 450], [550, 450]] },
  '8': { vip: [[150, 150], [350, 150], [550, 150], [750, 150], [200, 300], [450, 300], [700, 300], [250, 450], [550, 450]] },
  '9': {
    armory: [[150, 150], [300, 150], [200, 300], [350, 300], [200, 450], [350, 450]],
    safeHouse: [[550, 150], [700, 150], [600, 300], [750, 300], [600, 450], [750, 450]],
  },
  '10': {
    intelNetwork: [[150, 150], [300, 150], [200, 300], [350, 300], [200, 450], [350, 450]],
    managerOffice: [[550, 150], [700, 150], [600, 300], [750, 300], [600, 450], [750, 450]],
  },
  '11': {},
}

export const ELEVATOR_X = 450

export const ELEVATOR_NODES: Record<FloorId, [number, number]> = {
  G: [ELEVATOR_X, 400],
  '1': [ELEVATOR_X, 330],
  '2': [ELEVATOR_X, 280],
  '3': [ELEVATOR_X, 420],
  '4': [ELEVATOR_X, 280],
  '5': [ELEVATOR_X, 280],
  '6': [ELEVATOR_X, 280],
  '7': [ELEVATOR_X, 280],
  '8': [ELEVATOR_X, 280],
  '9': [ELEVATOR_X, 280],
  '10': [ELEVATOR_X, 280],
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
