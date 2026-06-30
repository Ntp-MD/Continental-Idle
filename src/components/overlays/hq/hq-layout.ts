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
  levelKey?: string
  roomNum?: number
}

export const SVG_W = 1200
export const SVG_H = 600
export const THUMB_W = 200
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

interface RoomGridOptions {
  cols: number
  bands: 1 | 2
  gap?: number
  startNum: number
  maxRooms: number
  prefix?: string
  levelKey: string
}

const INNER_X = 6
const INNER_Y = 6
const INNER_W = 1188
const INNER_H = 588
const V_CORR_W = 100
const ELEV_TOP = 250
const ELEV_BOT = 350
const H_CORR_H = 50

function generateRoomGrid(opts: RoomGridOptions): RoomLayout[] {
  const { cols, bands, gap = 2, startNum, maxRooms, prefix = '', levelKey } = opts
  const midX = INNER_X + INNER_W / 2
  const leftW = (INNER_W - V_CORR_W) / 2
  const rightX = midX + V_CORR_W / 2
  const leftCols = Math.ceil(cols / 2)
  const rightCols = Math.floor(cols / 2)
  let num = startNum
  const rooms: RoomLayout[] = []

  const rw = Math.floor((leftW - (leftCols - 1) * gap) / leftCols)
  const topZoneY = INNER_Y
  const topZoneH = ELEV_TOP - INNER_Y
  const botZoneY = ELEV_BOT
  const botZoneH = INNER_Y + INNER_H - ELEV_BOT

  function addRoom(x: number, y: number, w: number, h: number): void {
    if (num >= startNum + maxRooms) return
    rooms.push({
      id: `${levelKey}${num}`,
      x, y, w, h,
      label: `${prefix}${num}`,
      sub: '',
      levelKey,
      roomNum: num,
    })
    num++
  }

  function drawZone(zoneY: number, zoneH: number): void {
    if (bands === 1) {
      const rh = zoneH
      for (let c = 0; c < leftCols; c++) {
        if (num >= startNum + maxRooms) break
        const rx = INNER_X + c * (rw + gap)
        addRoom(rx, zoneY, rw, rh)
      }
      for (let c = 0; c < rightCols; c++) {
        if (num >= startNum + maxRooms) break
        const rx = rightX + c * (rw + gap)
        addRoom(rx, zoneY, rw, rh)
      }
    } else {
      const rh = Math.floor((zoneH - H_CORR_H - 2 * gap) / 2)
      const topY = zoneY
      const corrY = zoneY + rh + gap
      const botY = corrY + H_CORR_H + gap
      const rhBot = zoneY + zoneH - botY

      for (let c = 0; c < leftCols; c++) {
        if (num >= startNum + maxRooms) break
        const rx = INNER_X + c * (rw + gap)
        addRoom(rx, topY, rw, rh)
      }
      for (let c = 0; c < rightCols; c++) {
        if (num >= startNum + maxRooms) break
        const rx = rightX + c * (rw + gap)
        addRoom(rx, topY, rw, rh)
      }
      for (let c = 0; c < leftCols; c++) {
        if (num >= startNum + maxRooms) break
        const rx = INNER_X + c * (rw + gap)
        addRoom(rx, botY, rw, rhBot)
      }
      for (let c = 0; c < rightCols; c++) {
        if (num >= startNum + maxRooms) break
        const rx = rightX + c * (rw + gap)
        addRoom(rx, botY, rw, rhBot)
      }
    }
  }

  drawZone(topZoneY, topZoneH)
  drawZone(botZoneY, botZoneH)
  return rooms
}

const F3_ROOMS = generateRoomGrid({ cols: 10, bands: 2, gap: 2, startNum: 301, maxRooms: 40, levelKey: 'guestRooms' })
const F4_ROOMS = generateRoomGrid({ cols: 10, bands: 2, gap: 2, startNum: 401, maxRooms: 40, levelKey: 'guestRooms' })
const F5_ROOMS = generateRoomGrid({ cols: 8, bands: 1, gap: 3, startNum: 501, maxRooms: 16, levelKey: 'guestRooms' })
const F6_ROOMS = generateRoomGrid({ cols: 8, bands: 1, gap: 3, startNum: 601, maxRooms: 16, levelKey: 'guestRooms' })
const F7_ROOMS = generateRoomGrid({ cols: 4, bands: 1, gap: 6, startNum: 701, maxRooms: 8, levelKey: 'vip' })
const F8_ROOMS = generateRoomGrid({ cols: 4, bands: 1, gap: 6, startNum: 801, maxRooms: 8, prefix: 'PH ', levelKey: 'vip' })

export const FLOOR_LAYOUT: Record<FloorId, RoomLayout[]> = {
  G: [
    { id: 'loadingBay', x: 6, y: 6, w: 544, h: 244, label: 'Loading Bay', sub: 'Supply Receiving · Sorting', visual: true },
    { id: 'blackMarket', x: 650, y: 6, w: 544, h: 244, label: 'Black Market', sub: 'Hidden Trading Floor' },
    { id: 'underground', x: 6, y: 350, w: 544, h: 244, label: 'Underground Services', sub: 'MEP · Data · Control' },
    { id: 'vault', x: 650, y: 350, w: 544, h: 244, label: 'Continental Vault', sub: 'Secure Storage' },
  ],
  '1': [
    { id: 'concierge', x: 6, y: 6, w: 544, h: 244, label: 'Concierge', sub: 'Guest Services · Luggage' },
    { id: 'lounge', x: 650, y: 6, w: 544, h: 244, label: 'Waiting Lounge', sub: 'Seating Area', visual: true },
    { id: 'reception', x: 6, y: 350, w: 544, h: 244, label: 'Reception Desk', sub: 'Grand Lobby' },
    { id: 'entrance', x: 650, y: 350, w: 544, h: 244, label: 'Main Entrance', sub: 'Lobby Doors', visual: true },
  ],
  '2': [
    { id: 'loadingBay2', x: 6, y: 6, w: 544, h: 244, label: 'Loading Bay', sub: 'Food Storage', visual: true },
    { id: 'bar', x: 650, y: 6, w: 544, h: 244, label: 'Bar / Lounge', sub: 'No Business Conducted' },
    { id: 'kitchen', x: 6, y: 350, w: 544, h: 244, label: 'Kitchen', sub: 'Fine Dining' },
    { id: 'barLounge', x: 650, y: 350, w: 544, h: 244, label: 'Bar / Lounge', sub: 'Seating Area', visual: true },
  ],
  '3': [
    { id: 'laundry', x: 6, y: 6, w: 272, h: 244, label: 'Laundry Service', sub: '' },
    { id: 'staffRoom', x: 278, y: 6, w: 272, h: 244, label: 'Staff Room', sub: 'Visual Only', visual: true },
    ...F3_ROOMS,
  ],
  '4': [...F4_ROOMS],
  '5': [...F5_ROOMS],
  '6': [...F6_ROOMS],
  '7': [...F7_ROOMS],
  '8': [...F8_ROOMS],
  '9': [
    { id: 'armory', x: 6, y: 6, w: 544, h: 244, label: 'Armory', sub: 'Weapon Storage' },
    { id: 'safeHouse', x: 650, y: 6, w: 544, h: 244, label: 'Safe House', sub: 'Secure Bunker' },
    { id: 'controlCenter', x: 6, y: 350, w: 544, h: 244, label: 'Control Center', sub: 'Security Ops', visual: true },
    { id: 'safeHouseBunker', x: 650, y: 350, w: 544, h: 244, label: 'Safe House', sub: 'Bunker', visual: true },
  ],
  '10': [
    { id: 'intelNetwork', x: 6, y: 6, w: 544, h: 244, label: 'Intelligence Network', sub: 'Comms Center' },
    { id: 'managerOffice', x: 650, y: 6, w: 544, h: 244, label: "Manager's Office", sub: 'Visual Only', visual: true },
    { id: 'datacenter', x: 6, y: 350, w: 544, h: 244, label: 'Datacenter', sub: 'Server Infrastructure', visual: true },
    { id: 'staffQuarters', x: 650, y: 350, w: 544, h: 244, label: 'Staff Quarters', sub: 'BOH', visual: true },
  ],
  '11': [
    { id: 'rooftop', x: 6, y: 6, w: 1188, h: 588, label: 'Rooftop Terrace', sub: 'Helipad', visual: true },
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
    { type: 'rect', x: 8, y: 8, w: 50, h: 35, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.8 },
    { type: 'rect', x: 12, y: 12, w: 42, h: 25, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 8, y: 8, w: 50, h: 6, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
    { type: 'rect', x: 62, y: 10, w: 14, h: 14, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 65, y: 13, w: 8, h: 8, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.metal, strokeWidth: 0.3 },
    { type: 'rect', x: 8, y: 50, w: 40, h: 20, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.5 },
    { type: 'rect', x: 12, y: 54, w: 32, h: 12, fill: FURNITURE_COLORS.accent, stroke: FURNITURE_COLORS.woodDark, strokeWidth: 0.3 },
  ],
  vip: [
    { type: 'rect', x: 8, y: 8, w: 60, h: 40, fill: FURNITURE_COLORS.wood, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.8 },
    { type: 'rect', x: 12, y: 12, w: 52, h: 30, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 8, y: 8, w: 60, h: 8, fill: FURNITURE_COLORS.fabricLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 20, y: 6, w: 36, h: 6, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3, opacity: 0.3 },
    { type: 'rect', x: 72, y: 10, w: 18, h: 18, fill: FURNITURE_COLORS.woodLight, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 76, y: 14, w: 10, h: 10, fill: FURNITURE_COLORS.glass, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'circle', x: 81, y: 19, r: 3, fill: FURNITURE_COLORS.gold, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
    { type: 'rect', x: 8, y: 55, w: 50, h: 22, fill: FURNITURE_COLORS.leather, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.5 },
    { type: 'rect', x: 12, y: 59, w: 42, h: 14, fill: FURNITURE_COLORS.fabric, stroke: FURNITURE_COLORS.goldDim, strokeWidth: 0.3 },
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

const OLD_ROOM_POS: Record<string, [number, number]> = {
  blackMarket: [40, 40],
  vault: [460, 40],
  underground: [40, 300],
  concierge: [40, 40],
  reception: [260, 40],
  lounge: [660, 40],
  elevator: [380, 280],
  entrance: [380, 400],
  kitchen: [40, 40],
  bar: [460, 40],
  laundry: [40, 40],
  staffRoom: [320, 40],
  armory: [40, 40],
  safeHouse: [460, 40],
  intelNetwork: [40, 40],
  managerOffice: [460, 40],
  rooftop: [40, 40],
}

for (const [roomId, [ox, oy]] of Object.entries(OLD_ROOM_POS)) {
  if (ROOM_FURNITURE[roomId]) {
    ROOM_FURNITURE[roomId] = ROOM_FURNITURE[roomId].map(f => {
      const nf: FurnitureElement = { ...f, x: f.x - ox, y: f.y - oy }
      if (f.x2 !== undefined) nf.x2 = f.x2 - ox
      if (f.y2 !== undefined) nf.y2 = f.y2 - oy
      return nf
    })
  }
}

export function getRoomFurniture(roomId: string): FurnitureElement[] {
  if (ROOM_FURNITURE[roomId]) return ROOM_FURNITURE[roomId]
  const room = Object.values(FLOOR_LAYOUT).flat().find(r => r.id === roomId)
  if (room?.levelKey && ROOM_FURNITURE[room.levelKey]) return ROOM_FURNITURE[room.levelKey]
  return []
}

export const ROOM_TO_FLOOR: Record<string, FloorId> = {
  concierge: '1',
  reception: '1',
  lounge: '1',
  entrance: '1',
  kitchen: '2',
  bar: '2',
  loadingBay2: '2',
  barLounge: '2',
  laundry: '3',
  staffRoom: '3',
  guestRooms: '3',
  vip: '7',
  armory: '9',
  safeHouse: '9',
  controlCenter: '9',
  safeHouseBunker: '9',
  intelNetwork: '10',
  managerOffice: '10',
  datacenter: '10',
  staffQuarters: '10',
  blackMarket: 'G',
  vault: 'G',
  underground: 'G',
  loadingBay: 'G',
  rooftop: '11',
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

export interface CorridorSegment {
  x: number
  y: number
  w: number
  h: number
  vertical?: boolean
  label?: string
}

export const CORRIDOR_LAYOUT: Record<FloorId, CorridorSegment[]> = {
  G: [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'MAIN CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '1': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'LOBBY' },
    { x: 6, y: 250, w: 1188, h: 100, label: 'GRAND LOBBY' },
  ],
  '2': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'MAIN CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '3': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'STANDARD CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
    { x: 6, y: 103, w: 544, h: 50 },
    { x: 650, y: 103, w: 544, h: 50 },
    { x: 6, y: 447, w: 544, h: 50 },
    { x: 650, y: 447, w: 544, h: 50 },
  ],
  '4': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'DELUXE CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
    { x: 6, y: 103, w: 544, h: 50 },
    { x: 650, y: 103, w: 544, h: 50 },
    { x: 6, y: 447, w: 544, h: 50 },
    { x: 650, y: 447, w: 544, h: 50 },
  ],
  '5': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'EXECUTIVE CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '6': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'PRESIDENTIAL CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '7': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'VIP CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '8': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'PENTHOUSE CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '9': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'BLAST CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '10': [
    { x: 550, y: 6, w: 100, h: 588, vertical: true, label: 'MAIN CORRIDOR' },
    { x: 6, y: 250, w: 544, h: 100 },
    { x: 650, y: 250, w: 544, h: 100 },
  ],
  '11': [],
}

export interface PathNode {
  x: number
  y: number
}

export const CORRIDOR_NODES: Record<FloorId, PathNode[]> = {
  G: [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '1': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '2': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '3': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '4': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '5': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '6': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '7': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '8': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '9': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '10': [{ x: 278, y: 300 }, { x: 600, y: 300 }, { x: 922, y: 300 }, { x: 600, y: 128 }, { x: 600, y: 472 }],
  '11': [],
}

function generateAnchorsForGrid(rooms: RoomLayout[]): Record<string, [number, number][]> {
  const result: Record<string, [number, number][]> = {}
  for (const room of rooms) {
    result[room.id] = [[Math.round(room.x + room.w / 2), Math.round(room.y + room.h / 2)]]
  }
  return result
}

export const ROOM_ANCHORS: Record<FloorId, Record<string, [number, number][]>> = {
  G: {
    loadingBay: [[140, 128], [280, 128], [180, 200], [380, 200]],
    blackMarket: [[790, 128], [930, 128], [830, 200], [1030, 200]],
    underground: [[140, 472], [280, 472], [180, 540], [380, 540]],
    vault: [[790, 472], [930, 472], [830, 540], [1030, 540]],
  },
  '1': {
    concierge: [[140, 128], [280, 128], [180, 200], [380, 200]],
    lounge: [[790, 128], [930, 128], [830, 200], [1030, 200]],
    reception: [[140, 472], [280, 472], [380, 540], [480, 540]],
    entrance: [[790, 472], [930, 472], [830, 540], [1030, 540]],
  },
  '2': {
    loadingBay2: [[140, 128], [280, 128], [380, 200]],
    bar: [[790, 128], [930, 128], [830, 200], [1030, 200]],
    kitchen: [[140, 472], [280, 472], [180, 540], [380, 540]],
    barLounge: [[790, 472], [930, 472], [830, 540], [1030, 540]],
  },
  '3': {
    laundry: [[80, 128], [160, 128], [120, 200]],
    staffRoom: [[360, 128], [440, 128], [400, 200]],
    ...generateAnchorsForGrid(F3_ROOMS),
  },
  '4': generateAnchorsForGrid(F4_ROOMS),
  '5': generateAnchorsForGrid(F5_ROOMS),
  '6': generateAnchorsForGrid(F6_ROOMS),
  '7': generateAnchorsForGrid(F7_ROOMS),
  '8': generateAnchorsForGrid(F8_ROOMS),
  '9': {
    armory: [[140, 128], [280, 128], [180, 200], [380, 200]],
    safeHouse: [[790, 128], [930, 128], [830, 200], [1030, 200]],
    controlCenter: [[140, 472], [280, 472], [380, 540]],
    safeHouseBunker: [[790, 472], [930, 472], [830, 540], [1030, 540]],
  },
  '10': {
    intelNetwork: [[140, 128], [280, 128], [180, 200], [380, 200]],
    managerOffice: [[790, 128], [930, 128], [830, 200], [1030, 200]],
    datacenter: [[140, 472], [280, 472], [380, 540]],
    staffQuarters: [[790, 472], [930, 472], [830, 540], [1030, 540]],
  },
  '11': {
    rooftop: [[300, 200], [600, 300], [900, 200], [400, 400], [800, 400]],
  },
}

export const ELEVATOR_X = 600
export const ELEVATOR_Y = 300
export const ELEVATOR_R = 42

export const ELEVATOR_NODES: Record<FloorId, [number, number]> = {
  G: [ELEVATOR_X, ELEVATOR_Y],
  '1': [ELEVATOR_X, ELEVATOR_Y],
  '2': [ELEVATOR_X, ELEVATOR_Y],
  '3': [ELEVATOR_X, ELEVATOR_Y],
  '4': [ELEVATOR_X, ELEVATOR_Y],
  '5': [ELEVATOR_X, ELEVATOR_Y],
  '6': [ELEVATOR_X, ELEVATOR_Y],
  '7': [ELEVATOR_X, ELEVATOR_Y],
  '8': [ELEVATOR_X, ELEVATOR_Y],
  '9': [ELEVATOR_X, ELEVATOR_Y],
  '10': [ELEVATOR_X, ELEVATOR_Y],
  '11': [ELEVATOR_X, ELEVATOR_Y],
}

export type DoorCategory = 'standard' | 'lobby' | 'sliding'

export interface DoorDef {
  x: number
  y: number
  side: 'top' | 'bottom' | 'left' | 'right'
  category: DoorCategory
}

const DW = 24
const DW_LOBBY = 50
const DW_SLIDING = 32

function doorTop(cx: number, ry: number, cat: DoorCategory = 'standard'): DoorDef {
  return { x: cx, y: ry, side: 'top', category: cat }
}
function doorBottom(cx: number, ry: number, cat: DoorCategory = 'standard'): DoorDef {
  return { x: cx, y: ry, side: 'bottom', category: cat }
}
function doorLeft(rx: number, cy: number, cat: DoorCategory = 'standard'): DoorDef {
  return { x: rx, y: cy, side: 'left', category: cat }
}
function doorRight(rx: number, cy: number, cat: DoorCategory = 'standard'): DoorDef {
  return { x: rx, y: cy, side: 'right', category: cat }
}

function generateDoorsForGrid(rooms: RoomLayout[], bands: 1 | 2, cat: DoorCategory = 'standard'): DoorDef[] {
  const doors: DoorDef[] = []
  const midX = INNER_X + INNER_W / 2
  const vCorrLeft = midX - V_CORR_W / 2
  const vCorrRight = midX + V_CORR_W / 2

  for (const room of rooms) {
    const cx = room.x + room.w / 2
    const cy = room.y + room.h / 2
    if (bands === 1) {
      if (room.x + room.w <= vCorrLeft + 2) {
        doors.push(doorRight(room.x + room.w, cy, cat))
      } else if (room.x >= vCorrRight - 2) {
        doors.push(doorLeft(room.x, cy, cat))
      }
    } else {
      if (room.y < ELEV_TOP - 2) {
        if (room.y + room.h < ELEV_TOP) {
          const corrY = room.y + room.h
          doors.push(doorBottom(cx, corrY, cat))
        }
      } else if (room.y >= ELEV_BOT - 2) {
        if (room.y > ELEV_BOT) {
          doors.push(doorTop(cx, room.y, cat))
        }
      }
    }
  }
  return doors
}
export const DOOR_LAYOUT: Record<FloorId, DoorDef[]> = {
  G: [
    doorBottom(278, 250, 'standard'), doorBottom(922, 250, 'standard'),
    doorTop(278, 350, 'standard'), doorTop(922, 350, 'standard'),
  ],
  '1': [
    doorBottom(278, 250, 'standard'), doorBottom(922, 250, 'standard'),
    doorTop(278, 350, 'lobby'), doorTop(922, 350, 'lobby'),
  ],
  '2': [
    doorBottom(278, 250, 'standard'), doorBottom(922, 250, 'standard'),
    doorTop(278, 350, 'standard'), doorTop(922, 350, 'standard'),
  ],
  '3': [
    doorBottom(142, 250, 'standard'), doorBottom(414, 250, 'standard'),
    ...generateDoorsForGrid(F3_ROOMS, 2, 'standard'),
  ],
  '4': [...generateDoorsForGrid(F4_ROOMS, 2, 'standard')],
  '5': [...generateDoorsForGrid(F5_ROOMS, 1, 'standard')],
  '6': [...generateDoorsForGrid(F6_ROOMS, 1, 'sliding')],
  '7': [...generateDoorsForGrid(F7_ROOMS, 1, 'sliding')],
  '8': [...generateDoorsForGrid(F8_ROOMS, 1, 'sliding')],
  '9': [
    doorBottom(278, 250, 'standard'), doorBottom(922, 250, 'standard'),
    doorTop(278, 350, 'standard'), doorTop(922, 350, 'standard'),
  ],
  '10': [
    doorBottom(278, 250, 'standard'), doorBottom(922, 250, 'standard'),
    doorTop(278, 350, 'standard'), doorTop(922, 350, 'standard'),
  ],
  '11': [],
}

export const DOOR_WIDTHS: Record<DoorCategory, number> = {
  standard: DW,
  lobby: DW_LOBBY,
  sliding: DW_SLIDING,
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
