import { reactive, computed, ref } from 'vue'
import type {
  LayoutData, FloorData, RoomData, ObjectData, AssetDef,
  EditorMode, Selection, Rect, RoomCategory, RoomCategoryDef, Rotation,
  CompositePart, MultiSelection, AssetShape, ZoneData, LinkedPart,
} from './editor-types'
import { aabbOverlap, DEFAULT_ROOM_CATEGORIES, DEFAULT_TILE_SIZE } from './editor-types'
import { findAsset, findAssetCached, buildAssetMap, BUILTIN_ASSETS } from './editor-assets'
import { useToast } from '@/composables/useToast'
import { autoFixFloor } from './floor-validator'
import type { AutoFixResult } from './floor-validator'
import { SAVED_LAYOUT } from './saved-layout'

const toast = useToast()

const editorLog = {
  error(context: string, error: unknown) {
    console.error(`[BlueprintEditor] ${context}:`, error)
  },
  warn(context: string, ...args: unknown[]) {
    console.warn(`[BlueprintEditor] ${context}:`, ...args)
  },
  info(context: string, ...args: unknown[]) {
    console.info(`[BlueprintEditor] ${context}:`, ...args)
  },
}

const LAYOUT_VERSION = 1
const PRESET_VERSION = 16
const STORAGE_KEY = 'blueprint-editor-layout'
const PRESET_VERSION_KEY = 'blueprint-preset-version'
const HISTORY_LIMIT = 50

const DEFAULT_FLOOR_NAMES: { id: string; name: string }[] = [
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

interface PresetRoom {
  id: string
  x: number
  y: number
  w: number
  h: number
  cat: RoomCategory
  label: string
  radius?: number
}

interface PresetObject {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  rotation: Rotation
  radius?: number
  labelPadding?: number
}

type FloorPreset = { rooms: PresetRoom[]; objects: PresetObject[] }
type GuestTier = 'staff' | 'standard' | 'deluxe' | 'executive' | 'vip' | 'penthouse'

const PRESET_CANVAS_W = 2000
const PRESET_CANVAS_H = 800
const TILE = DEFAULT_TILE_SIZE

function makeObj(id: string, type: string, x: number, y: number, rotation: Rotation = 0): PresetObject {
  const asset = BUILTIN_ASSETS.find(a => a.id === type)
  const aw = asset ? asset.w * TILE : TILE
  const ah = asset ? asset.h * TILE : TILE
  const swap = rotation === 90 || rotation === 270
  const w = swap ? ah : aw
  const h = swap ? aw : ah
  const isRound = asset && (asset.shape === 'circle' || asset.shape === 'round')
  const sx = Math.round(x / TILE) * TILE
  const sy = Math.round(y / TILE) * TILE
  const o: PresetObject = { id, type, x: sx, y: sy, w, h, rotation }
  if (isRound) {
    o.radius = Math.min(w, h) / 2 - 2
  }
  return o
}

function furnishGuestRoom(room: PresetRoom, prefix: string, tier: GuestTier, doorSide: 'top' | 'bottom'): PresetObject[] {
  const { x, y, w: rw, h: rh } = room
  const objs: PresetObject[] = []
  const pad = 25

  const farY = doorSide === 'bottom' ? y + pad : y + rh - 50 - pad
  const nearY = doorSide === 'bottom' ? y + rh - 55 - pad : y + pad + 25

  objs.push(makeObj(`${prefix}-bed`, 'bed', x + pad, farY))
  objs.push(makeObj(`${prefix}-night`, 'nightstand', x + pad + 30, farY))
  objs.push(makeObj(`${prefix}-desk`, 'desk', x + rw - 25 - pad, farY))

  if (tier === 'staff') {
    objs.push(makeObj(`${prefix}-wardrobe`, 'wardrobe', x + pad, nearY))
    objs.push(makeObj(`${prefix}-bath`, 'bathtub', x + rw - 25 - pad, nearY))
    return objs
  }

  const chairY = doorSide === 'bottom' ? farY + 50 + 5 : farY - 25 - 5
  objs.push(makeObj(`${prefix}-chair`, 'chair', x + rw - 25 - pad, chairY))
  objs.push(makeObj(`${prefix}-wardrobe`, 'wardrobe', x + pad, nearY))
  objs.push(makeObj(`${prefix}-tv`, 'tv-stand', Math.round(x + rw / 2 - 12), nearY))
  objs.push(makeObj(`${prefix}-bath`, 'bathtub', x + rw - 25 - pad, nearY))

  if (tier === 'deluxe' || tier === 'executive' || tier === 'vip' || tier === 'penthouse') {
    objs.push(makeObj(`${prefix}-minibar`, 'minibar', x + pad + 30, nearY + 12))
  }
  if (tier === 'vip' || tier === 'penthouse') {
    const midY = Math.round(y + rh / 2 - 25)
    objs.push(makeObj(`${prefix}-sofa`, 'sofa', Math.round(x + rw / 2 - 60), midY))
    objs.push(makeObj(`${prefix}-table`, 'table-chairs', Math.round(x + rw / 2 + 10), midY))
  }
  return objs
}

function gridPlace(room: PresetRoom, prefix: string, type: string, cols: number, rows: number, pad: number): PresetObject[] {
  if (cols < 1 || rows < 1) return []
  const { x, y, w: rw, h: rh } = room
  const asset = BUILTIN_ASSETS.find(a => a.id === type)
  const ow = asset ? asset.w * TILE : TILE
  const oh = asset ? asset.h * TILE : TILE
  const objs: PresetObject[] = []
  const stepX = Math.floor((rw - 2 * pad) / cols / TILE) * TILE
  const stepY = Math.floor((rh - 2 * pad) / rows / TILE) * TILE
  const startX = x + Math.round((rw - stepX * cols) / 2)
  const startY = y + Math.round((rh - stepY * rows) / 2)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = startX + c * stepX + Math.round((stepX - ow) / 2 / TILE) * TILE
      const oy = startY + r * stepY + Math.round((stepY - oh) / 2 / TILE) * TILE
      objs.push(makeObj(`${prefix}-${type}-${c}-${r}`, type, ox, oy))
    }
  }
  return objs
}

function furnishFunctionalRoom(room: PresetRoom, prefix: string): PresetObject[] {
  const { x, y, w: rw, h: rh, cat } = room
  if (rw < 100 || rh < 100) return []
  const objs: PresetObject[] = []
  const pad = 20
  const lbl = (room.label || '').toUpperCase()

  if (lbl.includes('HELI')) {
    objs.push(makeObj(`${prefix}-helipad`, 'helipad', Math.round(x + rw / 2 - 50), Math.round(y + rh / 2 - 50)))
    return objs
  }
  if (lbl.includes('KITCHEN') || lbl.includes('COLD')) {
    objs.push(makeObj(`${prefix}-stove`, 'kitchen-stove', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-prep`, 'prep-station', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-shelf1`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf2`, 'storage-shelf', x + pad, y + rh - 50 - pad))
    objs.push(makeObj(`${prefix}-shelf3`, 'storage-shelf', x + rw - 25 - pad, y + rh - 50 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', Math.round(x + rw / 2 - 12), y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('DINING') || lbl.includes('RESTAURANT') || lbl.includes('CAFETERIA')) {
    const cols = Math.max(2, Math.floor((rw - 2 * pad) / 80))
    const rows = Math.max(1, Math.floor((rh - 2 * pad) / 80))
    objs.push(...gridPlace(room, prefix, 'dining-table-round', cols, rows, pad + 10))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('BAR')) {
    objs.push(makeObj(`${prefix}-bar`, 'bar-counter', x + pad, y + pad))
    const stoolCount = Math.min(6, Math.floor((rw - 2 * pad) / 35))
    for (let i = 0; i < stoolCount; i++) {
      objs.push(makeObj(`${prefix}-stool-${i}`, 'bar-stool', x + pad + 25 + i * 35, y + pad + 30))
    }
    objs.push(makeObj(`${prefix}-table1`, 'table-chairs', x + pad, y + rh - 60 - pad))
    objs.push(makeObj(`${prefix}-table2`, 'table-chairs', x + pad + 60, y + rh - 60 - pad))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('BANQUET')) {
    const cols = Math.max(2, Math.floor((rw - 2 * pad) / 80))
    const rows = Math.max(1, Math.floor((rh - 2 * pad) / 80))
    objs.push(...gridPlace(room, prefix, 'dining-table-round', cols, rows, pad + 20))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('MEETING') || lbl.includes('BRIEFING')) {
    objs.push(makeObj(`${prefix}-table`, 'table-chairs', Math.round(x + rw / 2 - 25), Math.round(y + rh / 2 - 25)))
    objs.push(makeObj(`${prefix}-chair1`, 'chair', x + pad, Math.round(y + rh / 2 - 12)))
    objs.push(makeObj(`${prefix}-chair2`, 'chair', x + rw - 25 - pad, Math.round(y + rh / 2 - 12)))
    objs.push(makeObj(`${prefix}-desk`, 'desk', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('BUSINESS')) {
    const deskCount = Math.max(2, Math.floor((rw - 2 * pad) / 40))
    for (let i = 0; i < deskCount; i++) {
      objs.push(makeObj(`${prefix}-desk-${i}`, 'desk', x + pad + i * 40, y + pad))
      objs.push(makeObj(`${prefix}-chair-${i}`, 'chair', x + pad + i * 40, y + pad + 55))
    }
    objs.push(makeObj(`${prefix}-filing`, 'filing-cabinet', x + rw - 25 - pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('GYM') || lbl.includes('FITNESS')) {
    objs.push(makeObj(`${prefix}-shelf1`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf2`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('POOL')) {
    objs.push(makeObj(`${prefix}-table1`, 'dining-table-round', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-table2`, 'dining-table-round', x + rw - 50 - pad, y + pad))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('LAUNDRY')) {
    objs.push(makeObj(`${prefix}-shelf1`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf2`, 'storage-shelf', x + pad + 35, y + pad))
    objs.push(makeObj(`${prefix}-shelf3`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('LOCKER')) {
    objs.push(makeObj(`${prefix}-shelf1`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf2`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('SPA')) {
    objs.push(makeObj(`${prefix}-desk`, 'desk', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-table`, 'table-chairs', Math.round(x + rw / 2 - 25), y + pad + 80))
    objs.push(makeObj(`${prefix}-plant1`, 'plant', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-plant2`, 'plant', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('LOADING') || lbl.includes('RECEIVING') || lbl.includes('STORAGE') || lbl.includes('LUGGAGE')) {
    objs.push(makeObj(`${prefix}-shelf1`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf2`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf3`, 'storage-shelf', x + pad, y + rh - 50 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('COOLING') || lbl.includes('HVAC')) {
    objs.push(makeObj(`${prefix}-cool1`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-cool2`, 'storage-shelf', x + pad + 35, y + pad))
    objs.push(makeObj(`${prefix}-cool3`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('MECH') || lbl.includes('ELECTRICAL')) {
    objs.push(makeObj(`${prefix}-rack1`, 'server-rack', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-rack2`, 'server-rack', x + pad + 35, y + pad))
    objs.push(makeObj(`${prefix}-rack3`, 'server-rack', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('PARKING')) {
    objs.push(makeObj(`${prefix}-trash1`, 'trash-bin', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash2`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('WINE')) {
    objs.push(makeObj(`${prefix}-shelf1`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf2`, 'storage-shelf', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-shelf3`, 'storage-shelf', x + pad, y + rh - 50 - pad))
    objs.push(makeObj(`${prefix}-shelf4`, 'storage-shelf', x + rw - 25 - pad, y + rh - 50 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', Math.round(x + rw / 2 - 12), y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('COAT')) {
    objs.push(makeObj(`${prefix}-shelf`, 'storage-shelf', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('RESTROOM')) {
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (cat === 'security' || lbl.includes('SECURITY') || lbl.includes('CCTV') || lbl.includes('CONTROL') ||
      lbl.includes('ARMORY') || lbl.includes('EVIDENCE') || lbl.includes('VAULT') || lbl.includes('HOLDING') ||
      lbl.includes('BADGE') || lbl.includes('NOC') || lbl.includes('INTEL')) {
    objs.push(makeObj(`${prefix}-control`, 'control-desk', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 50, y + pad + 30))
    if (lbl.includes('ARMORY')) {
      objs.push(makeObj(`${prefix}-weapon`, 'weapon-rack', x + pad + 110, y + pad))
    }
    objs.push(makeObj(`${prefix}-rack`, 'server-rack', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-filing1`, 'filing-cabinet', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-filing2`, 'filing-cabinet', x + rw - 25 - pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', Math.round(x + rw / 2 - 12), y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('SERVER') || lbl.includes('DATA') || lbl.includes('NETWORK')) {
    const bottomReserve = 80
    const cols = Math.max(2, Math.floor((rw - 2 * pad) / 40))
    const rows = Math.max(1, Math.floor((rh - 2 * pad - bottomReserve) / 60))
    objs.push(...gridPlace({ ...room, h: rh - bottomReserve }, prefix, 'server-rack', cols, rows, pad))
    objs.push(makeObj(`${prefix}-control`, 'control-desk', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 50, y + rh - 25 - pad - 30))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('OFFICE') || lbl.includes('PRIVATE')) {
    objs.push(makeObj(`${prefix}-desk`, 'desk', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-filing`, 'filing-cabinet', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('BEDROOM')) {
    objs.push(makeObj(`${prefix}-bed`, 'bed', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-night`, 'nightstand', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-wardrobe`, 'wardrobe', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('PANIC')) {
    objs.push(makeObj(`${prefix}-desk`, 'desk', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-filing`, 'filing-cabinet', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('LIVING')) {
    objs.push(makeObj(`${prefix}-sofa1`, 'sofa', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-table`, 'table-chairs', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-sofa2`, 'sofa', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + pad, y + rh - 25 - pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('ESCAPE')) {
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('CABANA')) {
    objs.push(makeObj(`${prefix}-sofa`, 'sofa', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-table`, 'table-chairs', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + rw - 25 - pad, y + pad))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('LOUNGE') || lbl.includes('TERRACE') || lbl.includes('DECK') || lbl.includes('GARDEN')) {
    objs.push(makeObj(`${prefix}-sofa1`, 'sofa', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-table1`, 'table-chairs', x + pad + 30, y + pad))
    objs.push(makeObj(`${prefix}-sofa2`, 'sofa', x + pad, y + rh - 50 - pad))
    objs.push(makeObj(`${prefix}-table2`, 'dining-table-round', x + rw - 50 - pad, y + pad))
    objs.push(makeObj(`${prefix}-plant1`, 'plant', x + rw - 25 - pad, y + rh - 25 - pad))
    const trashX = Math.round(x + rw / 2 - 12)
    const plant2DefaultX = x + pad + 40
    const plant2X = (plant2DefaultX + 25 > trashX) ? x + pad + 30 : plant2DefaultX
    const plant2Y = (plant2DefaultX + 25 > trashX) ? y + rh - 50 - pad : y + rh - 25 - pad
    objs.push(makeObj(`${prefix}-plant2`, 'plant', plant2X, plant2Y))
    objs.push(makeObj(`${prefix}-trash`, 'trash-bin', trashX, y + rh - 25 - pad))
    return objs
  }
  if (lbl.includes('HOST')) {
    objs.push(makeObj(`${prefix}-desk`, 'concierge-desk', x + pad, y + pad))
    objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 50, y + pad + 30))
    objs.push(makeObj(`${prefix}-plant`, 'plant', x + rw - 25 - pad, y + rh - 25 - pad))
    return objs
  }
  switch (cat) {
    case 'utility':
      objs.push(makeObj(`${prefix}-rack1`, 'server-rack', x + pad, y + pad))
      objs.push(makeObj(`${prefix}-rack2`, 'server-rack', x + pad + 35, y + pad))
      objs.push(makeObj(`${prefix}-shelf`, 'storage-shelf', x + rw - 25 - pad, y + rh - 50 - pad))
      break
    case 'back':
      objs.push(makeObj(`${prefix}-desk`, 'desk', x + pad, y + pad))
      objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 30, y + pad + 10))
      objs.push(makeObj(`${prefix}-filing`, 'filing-cabinet', x + rw - 25 - pad, y + pad))
      objs.push(makeObj(`${prefix}-shelf`, 'storage-shelf', x + rw - 25 - pad, y + rh - 50 - pad))
      break
    case 'service':
      objs.push(makeObj(`${prefix}-desk`, 'concierge-desk', x + pad, y + pad))
      objs.push(makeObj(`${prefix}-chair`, 'chair', x + pad + 50, y + pad + 30))
      objs.push(makeObj(`${prefix}-plant`, 'plant', x + rw - 25 - pad, y + rh - 25 - pad))
      break
    case 'public':
    case 'open':
    default:
      objs.push(makeObj(`${prefix}-sofa1`, 'sofa', x + pad + 10, y + pad + 10))
      objs.push(makeObj(`${prefix}-table1`, 'table-chairs', x + pad + 40, y + pad + 10))
      objs.push(makeObj(`${prefix}-plant1`, 'plant', x + rw - 25 - pad, y + pad + 10))
      objs.push(makeObj(`${prefix}-plant2`, 'plant', x + rw - 25 - pad, y + rh - 25 - pad))
      break
  }
  return objs
}

function doorBetween(id: string, a: PresetRoom, b: PresetRoom): PresetObject | null {
  if (Math.abs(a.x + a.w - b.x) < 1 || Math.abs(b.x + b.w - a.x) < 1) {
    const left = Math.abs(a.x + a.w - b.x) < 1 ? a : b
    const yOverlapStart = Math.max(a.y, b.y)
    const yOverlapEnd = Math.min(a.y + a.h, b.y + b.h)
    if (yOverlapEnd - yOverlapStart >= 25) {
      const midY = (yOverlapStart + yOverlapEnd) / 2
      return makeObj(id, 'door-standard', left.x + left.w - 12, midY - 12, 90)
    }
  }
  if (Math.abs(a.y + a.h - b.y) < 1 || Math.abs(b.y + b.h - a.y) < 1) {
    const top = Math.abs(a.y + a.h - b.y) < 1 ? a : b
    const xOverlapStart = Math.max(a.x, b.x)
    const xOverlapEnd = Math.min(a.x + a.w, b.x + b.w)
    if (xOverlapEnd - xOverlapStart >= 25) {
      const midX = (xOverlapStart + xOverlapEnd) / 2
      return makeObj(id, 'door-standard', midX - 12, top.y + top.h - 12, 0)
    }
  }
  return null
}

function autoDoors(prefix: string, rooms: PresetRoom[]): PresetObject[] {
  const doors: PresetObject[] = []
  const corridors = rooms.filter(r => r.cat === 'open' && r.label?.toUpperCase().includes('CORRIDOR'))
  const nonCorridors = rooms.filter(r => !(r.cat === 'open' && r.label?.toUpperCase().includes('CORRIDOR')))
  const roomIndex = new Map(rooms.map((r, i) => [r.id, i]))
  const dooredRooms = new Set<string>()

  for (const room of nonCorridors) {
    for (const cor of corridors) {
      const door = doorBetween(`${prefix}-door-c-${roomIndex.get(room.id)}`, room, cor)
      if (door) {
        doors.push(door)
        dooredRooms.add(room.id)
        break
      }
    }
  }

  for (let i = 0; i < nonCorridors.length; i++) {
    if (dooredRooms.has(nonCorridors[i].id)) continue
    for (let j = 0; j < nonCorridors.length; j++) {
      if (i === j) continue
      const door = doorBetween(`${prefix}-door-r${i}-${j}`, nonCorridors[i], nonCorridors[j])
      if (door) {
        doors.push(door)
        dooredRooms.add(nonCorridors[i].id)
        break
      }
    }
  }

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (dooredRooms.has(rooms[i].id) && dooredRooms.has(rooms[j].id)) continue
      const door = doorBetween(`${prefix}-door-x-${i}-${j}`, rooms[i], rooms[j])
      if (door) {
        doors.push(door)
        dooredRooms.add(rooms[i].id)
        dooredRooms.add(rooms[j].id)
      }
    }
  }

  return doors
}

function autoFurnish(rooms: PresetRoom[]): PresetObject[] {
  return rooms.flatMap(r => furnishFunctionalRoom(r, r.id))
}

const STATIC_CORRIDOR_H = 100
const STATIC_MID_CORRIDOR_H = 100

function buildStaticFloor(prefix: string, rooms: PresetRoom[]): FloorPreset {
  const bottomCorridorY = PRESET_CANVAS_H - STATIC_CORRIDOR_H
  const midCorridorY = Math.round((bottomCorridorY - STATIC_MID_CORRIDOR_H) / 2)
  const midCorridorEnd = midCorridorY + STATIC_MID_CORRIDOR_H
  const topH = midCorridorY

  const adjusted = rooms.map(r => {
    const isTopHalf = r.y + r.h / 2 < midCorridorY
    if (isTopHalf) {
      return { ...r, y: r.y, h: Math.min(r.h, topH) }
    } else {
      const relY = r.y - Math.round(bottomCorridorY / 2)
      const ny = midCorridorEnd + Math.max(0, relY)
      const maxH = bottomCorridorY - ny
      return { ...r, y: ny, h: Math.min(r.h, maxH) }
    }
  }).filter(r => r.h > 0)

  const midCorridor: PresetRoom = {
    id: `${prefix}-mid-corridor`, x: 0, y: midCorridorY,
    w: PRESET_CANVAS_W, h: STATIC_MID_CORRIDOR_H, cat: 'open', label: 'CORRIDOR',
  }
  const bottomCorridor: PresetRoom = {
    id: `${prefix}-corridor`, x: 0, y: bottomCorridorY,
    w: PRESET_CANVAS_W, h: STATIC_CORRIDOR_H, cat: 'open', label: 'CORRIDOR',
  }
  const allRooms = [...adjusted, midCorridor, bottomCorridor]
  const objects = [...autoFurnish(adjusted), ...autoDoors(prefix, allRooms)]
  addElevators(prefix, objects, allRooms)
  addCorridorTrashBins(prefix, objects, midCorridorY, STATIC_MID_CORRIDOR_H)
  return { rooms: allRooms, objects }
}

function addElevators(prefix: string, objects: PresetObject[], rooms: PresetRoom[]): void {
  const sz = 50
  const corridor = rooms.find(r => r.cat === 'open' && r.label?.toUpperCase().includes('CORRIDOR'))
  const cy = corridor ? corridor.y + Math.round(corridor.h / 2 - sz / 2) : Math.round(PRESET_CANVAS_H / 2 - sz / 2)
  const leftX = corridor ? corridor.x + 20 : 20
  const rightX = corridor ? corridor.x + corridor.w - sz - 20 : PRESET_CANVAS_W - sz - 20
  const gap = 100
  const positions = [
    { id: `${prefix}-elev1`, x: leftX, y: cy },
    { id: `${prefix}-elev2`, x: leftX + sz + gap, y: cy },
    { id: `${prefix}-elev3`, x: rightX - sz - gap, y: cy },
    { id: `${prefix}-elev4`, x: rightX, y: cy },
  ]
  let placed = 0
  for (const pos of positions) {
    const overlapsRoom = rooms.some(r =>
      r.cat !== 'open' &&
      pos.x < r.x + r.w && pos.x + sz > r.x &&
      pos.y < r.y + r.h && pos.y + sz > r.y
    )
    if (overlapsRoom) continue
    const overlapIdx = objects.findIndex(o =>
      pos.x < o.x + o.w && pos.x + sz > o.x &&
      pos.y < o.y + o.h && pos.y + sz > o.y
    )
    if (overlapIdx >= 0) {
      if (placed >= 2) continue
      objects.splice(overlapIdx, 1)
    }
    objects.push(makeObj(pos.id, 'elevator', pos.x, pos.y))
    placed++
  }
  if (placed < 2) {
    for (const pos of positions) {
      if (objects.some(o => o.type === 'elevator' && o.x === pos.x && o.y === pos.y)) continue
      const overlapIdx = objects.findIndex(o =>
        pos.x < o.x + o.w && pos.x + sz > o.x &&
        pos.y < o.y + o.h && pos.y + sz > o.y
      )
      if (overlapIdx >= 0) objects.splice(overlapIdx, 1)
      objects.push(makeObj(pos.id, 'elevator', pos.x, pos.y))
      placed++
      if (placed >= 2) break
    }
  }
}

function addCorridorTrashBins(prefix: string, objects: PresetObject[], corridorY: number, corridorH: number): void {
  const midY = Math.round(corridorY + corridorH / 2 - 12)
  objects.push(makeObj(`${prefix}-trash1`, 'trash-bin', 160, midY))
  objects.push(makeObj(`${prefix}-trash2`, 'trash-bin', PRESET_CANVAS_W - 185, midY))
}

function buildGuestStaticFloor(prefix: string, rooms: PresetRoom[], tier: GuestTier): FloorPreset {
  const corridorH = 100
  const vCorridorW = 100
  const n = rooms.length
  const newW = Math.round((PRESET_CANVAS_W - (n - 1) * vCorridorW) / n)

  const sortedRooms = [...rooms].sort((a, b) => a.x - b.x)
  const vCorridors: PresetRoom[] = []
  const shiftedRooms: PresetRoom[] = []

  for (let i = 0; i < sortedRooms.length; i++) {
    const r = sortedRooms[i]
    const rx = i * (newW + vCorridorW)
    const adjusted: PresetRoom = {
      ...r,
      x: rx,
      y: r.y + corridorH,
      h: r.h - corridorH,
      w: newW,
    }
    shiftedRooms.push(adjusted)
    if (i < n - 1) {
      vCorridors.push({
        id: `${prefix}-vcorridor-${i}`, x: rx + newW, y: corridorH,
        w: vCorridorW, h: PRESET_CANVAS_H - corridorH, cat: 'open', label: 'CORRIDOR',
      })
    }
  }

  const corridor: PresetRoom = {
    id: `${prefix}-corridor`, x: 0, y: 0,
    w: PRESET_CANVAS_W, h: corridorH, cat: 'open', label: 'CORRIDOR',
  }
  const allRooms = [...shiftedRooms, ...vCorridors, corridor]
  const objects: PresetObject[] = [
    ...shiftedRooms.flatMap(r => furnishGuestRoom(r, r.id, tier, 'top')),
  ]
  for (let i = 0; i < shiftedRooms.length; i++) {
    const r = shiftedRooms[i]
    objects.push(makeObj(`${prefix}-door-r${i}`, 'door-standard', Math.round(r.x + r.w / 2 - 12), corridorH - 12))
  }
  addElevators(prefix, objects, allRooms)
  addCorridorTrashBins(prefix, objects, 0, corridorH)
  return { rooms: allRooms, objects }
}

function guestRoomFloor(prefix: string, roomsPerSide: number, corridorH: number, labelPrefix: string, tier: GuestTier = 'standard'): FloorPreset {
  const count = roomsPerSide
  const roomW = Math.floor(PRESET_CANVAS_W / count)
  const corridorY = Math.floor((PRESET_CANVAS_H - corridorH) / 2)
  const topH = corridorY
  const botH = PRESET_CANVAS_H - corridorY - corridorH
  const rooms: PresetRoom[] = []
  const objects: PresetObject[] = []
  for (let i = 0; i < count; i++) {
    const x = i * roomW
    const w = (i === count - 1) ? PRESET_CANVAS_W - x : roomW
    const topRoom: PresetRoom = { id: `${prefix}-t${i}`, x, y: 0, w, h: topH, cat: 'public', label: `${labelPrefix}${String(i + 1).padStart(2, '0')}` }
    const botRoom: PresetRoom = { id: `${prefix}-b${i}`, x, y: corridorY + corridorH, w, h: botH, cat: 'public', label: `${labelPrefix}${String(i + 1 + count).padStart(2, '0')}` }
    rooms.push(topRoom, botRoom)
    objects.push(...furnishGuestRoom(topRoom, topRoom.id, tier, 'bottom'))
    objects.push(...furnishGuestRoom(botRoom, botRoom.id, tier, 'top'))
    objects.push(makeObj(`${prefix}-door-t${i}`, 'door-standard', Math.round(x + w / 2 - 12), corridorY - 12))
    objects.push(makeObj(`${prefix}-door-b${i}`, 'door-standard', Math.round(x + w / 2 - 12), corridorY + corridorH - 12))
  }
  rooms.push({ id: `${prefix}-corridor`, x: 0, y: corridorY, w: PRESET_CANVAS_W, h: corridorH, cat: 'open', label: 'CORRIDOR' })
  for (let cx = 200; cx < PRESET_CANVAS_W - 200; cx += 400) {
    objects.push(makeObj(`${prefix}-plant-c${cx}`, 'plant', cx, Math.round(corridorY + corridorH / 2 - 12)))
  }
  addElevators(prefix, objects, rooms)
  addCorridorTrashBins(prefix, objects, corridorY, corridorH)
  return { rooms, objects }
}

function staffFloor(prefix: string): FloorPreset {
  const bedroomCols = 10
  const cols = bedroomCols + 1
  const colW = Math.floor(PRESET_CANVAS_W / cols)
  const corridorH = 100
  const corridorY = Math.floor((PRESET_CANVAS_H - corridorH) / 2)
  const topH = corridorY
  const botH = PRESET_CANVAS_H - corridorY - corridorH
  const rooms: PresetRoom[] = []
  const objects: PresetObject[] = []
  for (let i = 0; i < cols; i++) {
    const x = i * colW
    const w = (i === cols - 1) ? PRESET_CANVAS_W - x : colW
    if (i < bedroomCols) {
      const topRoom: PresetRoom = { id: `${prefix}-t${i}`, x, y: 0, w, h: topH, cat: 'back', label: `STAFF RM ${i + 1}` }
      const botRoom: PresetRoom = { id: `${prefix}-b${i}`, x, y: corridorY + corridorH, w, h: botH, cat: 'back', label: `STAFF RM ${i + bedroomCols + 1}` }
      rooms.push(topRoom, botRoom)
      objects.push(...furnishGuestRoom(topRoom, topRoom.id, 'staff', 'bottom'))
      objects.push(...furnishGuestRoom(botRoom, botRoom.id, 'staff', 'top'))
      objects.push(makeObj(`${prefix}-door-t${i}`, 'door-standard', Math.round(x + colW / 2 - 12), corridorY - 12))
      objects.push(makeObj(`${prefix}-door-b${i}`, 'door-standard', Math.round(x + colW / 2 - 12), corridorY + corridorH - 12))
    } else {
      const lounge: PresetRoom = { id: `${prefix}-lounge`, x, y: 0, w, h: topH, cat: 'service', label: 'STAFF LOUNGE' }
      const restroom: PresetRoom = { id: `${prefix}-restroom`, x, y: corridorY + corridorH, w, h: botH, cat: 'utility', label: 'STAFF RESTROOM' }
      rooms.push(lounge, restroom)
      objects.push(...furnishFunctionalRoom(lounge, lounge.id))
      objects.push(makeObj(`${prefix}-trash-restroom`, 'trash-bin', x + 20, corridorY + corridorH + 20))
      objects.push(makeObj(`${prefix}-door-lounge`, 'door-standard', Math.round(x + colW / 2 - 12), corridorY - 12))
      objects.push(makeObj(`${prefix}-door-restroom`, 'door-standard', Math.round(x + colW / 2 - 12), corridorY + corridorH - 12))
    }
  }
  rooms.push({ id: `${prefix}-corridor`, x: 0, y: corridorY, w: PRESET_CANVAS_W, h: corridorH, cat: 'open', label: 'STAFF CORRIDOR' })
  addElevators(prefix, objects, rooms)
  addCorridorTrashBins(prefix, objects, corridorY, corridorH)
  return { rooms, objects }
}

function executiveFloor(prefix: string, roomsPerSide: number = 6): FloorPreset {
  const loungeW = 500
  const remaining = PRESET_CANVAS_W - loungeW
  const count = roomsPerSide
  const roomW = Math.floor(remaining / count)
  const corridorH = 120
  const corridorY = Math.floor((PRESET_CANVAS_H - corridorH) / 2)
  const topH = corridorY
  const botH = PRESET_CANVAS_H - corridorY - corridorH
  const loungeRoom: PresetRoom = { id: `${prefix}-lounge`, x: 0, y: 0, w: loungeW, h: PRESET_CANVAS_H, cat: 'public', label: 'EXECUTIVE LOUNGE' }
  const rooms: PresetRoom[] = [loungeRoom]
  const objects: PresetObject[] = [
    makeObj(`${prefix}-lounge-sofa1`, 'sofa', 30, 30),
    makeObj(`${prefix}-lounge-table1`, 'table-chairs', 80, 30),
    makeObj(`${prefix}-lounge-sofa2`, 'sofa', 30, PRESET_CANVAS_H - 100),
    makeObj(`${prefix}-lounge-bar`, 'bar-counter', 200, 30),
    makeObj(`${prefix}-lounge-stool1`, 'bar-stool', 220, 60),
    makeObj(`${prefix}-lounge-stool2`, 'bar-stool', 270, 60),
    makeObj(`${prefix}-lounge-plant`, 'plant', loungeW - 60, PRESET_CANVAS_H - 60),
    makeObj(`${prefix}-lounge-trash`, 'trash-bin', loungeW - 60, 30),
    makeObj(`${prefix}-lounge-door`, 'door-standard', loungeW - 12, Math.round(PRESET_CANVAS_H / 2 - 12), 90),
  ]
  for (let i = 0; i < count; i++) {
    const x = loungeW + i * roomW
    const w = (i === count - 1) ? (loungeW + remaining) - x : roomW
    const topRoom: PresetRoom = { id: `${prefix}-t${i}`, x, y: 0, w, h: topH, cat: 'public', label: `EXEC ${i + 1}` }
    const botRoom: PresetRoom = { id: `${prefix}-b${i}`, x, y: corridorY + corridorH, w, h: botH, cat: 'public', label: `EXEC ${i + 1 + count}` }
    rooms.push(topRoom, botRoom)
    objects.push(...furnishGuestRoom(topRoom, topRoom.id, 'executive', 'bottom'))
    objects.push(...furnishGuestRoom(botRoom, botRoom.id, 'executive', 'top'))
    objects.push(makeObj(`${prefix}-door-t${i}`, 'door-standard', Math.round(x + w / 2 - 12), corridorY - 12))
    objects.push(makeObj(`${prefix}-door-b${i}`, 'door-standard', Math.round(x + w / 2 - 12), corridorY + corridorH - 12))
  }
  rooms.push({ id: `${prefix}-corridor`, x: loungeW, y: corridorY, w: PRESET_CANVAS_W - loungeW, h: corridorH, cat: 'open', label: 'CORRIDOR' })
  addElevators(prefix, objects, rooms)
  addCorridorTrashBins(prefix, objects, corridorY, corridorH)
  return { rooms, objects }
}

function buildLobbyPreset(): FloorPreset {
  // Canvas: 2000×800, tile=25px (80×32 tiles)
  // All coordinates multiples of 25

  const rooms: PresetRoom[] = [
    // === SERVICE CORRIDOR (vertical, 4 tiles wide, full height) ===
    // Separates back-of-house from public — per spec rule
    { id: 'lobby-r-svc-corridor', x: 300, y: 0, w: 100, h: 800, cat: 'open', label: 'SERVICE CORRIDOR' },

    // === BACK OF HOUSE (left of service corridor, accessed only via service corridor) ===
    { id: 'lobby-r-recp-office', x: 0, y: 0, w: 300, h: 200, cat: 'back', label: 'RECEPTION OFFICE' },
    { id: 'lobby-r-luggage', x: 0, y: 200, w: 300, h: 200, cat: 'back', label: 'LUGGAGE STORAGE' },
    { id: 'lobby-r-staff-locker', x: 0, y: 400, w: 300, h: 200, cat: 'back', label: 'STAFF LOCKER' },
    { id: 'lobby-r-mechanical', x: 0, y: 600, w: 300, h: 200, cat: 'utility', label: 'MECHANICAL' },

    // === SERVICE (top row, near entrance) ===
    // Reception within sightline of main entrance (bottom-right)
    { id: 'lobby-r-reception', x: 400, y: 0, w: 400, h: 200, cat: 'service', label: 'RECEPTION' },
    { id: 'lobby-r-concierge', x: 800, y: 0, w: 400, h: 200, cat: 'service', label: 'CONCIERGE' },

    // === PUBLIC (top-right) ===
    { id: 'lobby-r-business', x: 1200, y: 0, w: 400, h: 200, cat: 'public', label: 'BUSINESS CENTER' },
    { id: 'lobby-r-restroom', x: 1600, y: 0, w: 400, h: 200, cat: 'utility', label: 'RESTROOM' },

    // === CIRCULATION (middle, connects service corridor to elevator lobby) ===
    { id: 'lobby-r-main-lobby', x: 400, y: 200, w: 400, h: 300, cat: 'open', label: 'MAIN LOBBY' },

    // === ELEVATOR LOBBY (center-block, 4 elevators flush against top wall) ===
    { id: 'lobby-r-elev-lobby', x: 800, y: 200, w: 400, h: 300, cat: 'open', label: 'ELEVATOR LOBBY' },

    // === PUBLIC (middle-right) ===
    { id: 'lobby-r-wait-lounge', x: 1200, y: 200, w: 400, h: 300, cat: 'public', label: 'WAITING LOUNGE' },

    // === VERTICAL CORRIDOR (right, connects top to bottom) ===
    { id: 'lobby-r-v-corridor', x: 1600, y: 200, w: 100, h: 600, cat: 'open', label: 'CORRIDOR' },

    // === OPEN (right-middle) ===
    { id: 'lobby-r-terrace', x: 1700, y: 200, w: 300, h: 300, cat: 'open', label: 'LOBBY TERRACE' },

    // === BACK OF HOUSE (bottom-left, adjacent to service corridor + restaurant) ===
    { id: 'lobby-r-kitchen', x: 400, y: 500, w: 400, h: 300, cat: 'back', label: 'KITCHEN' },

    // === PUBLIC (bottom) ===
    // Kitchen adjacent to Restaurant per adjacency rule
    { id: 'lobby-r-restaurant', x: 800, y: 500, w: 400, h: 300, cat: 'public', label: 'RESTAURANT' },
    { id: 'lobby-r-bar', x: 1200, y: 500, w: 400, h: 300, cat: 'public', label: 'BAR & LOUNGE' },

    // === PUBLIC (bottom-right, main entrance) ===
    { id: 'lobby-r-entrance', x: 1700, y: 500, w: 300, h: 300, cat: 'public', label: 'MAIN ENTRANCE' },
  ]

  const objects: PresetObject[] = []

  // === ELEVATORS (center-block, flush against top wall of elevator lobby) ===
  // Elevator lobby: x=800-1200, y=200-500
  // Each elevator: 2×2 tiles = 50×50px
  // 4-tile clearance = 100px on all sides except flush with structural wall (top)
  //
  // Layout:
  //   elev1 (900,200)  elev2 (1050,200)   ← flush against top wall
  //   elev3 (900,350)  elev4 (1050,350)   ← 100px gap below row 1
  //
  // Clearances:
  //   Top:    0 (flush with structural wall)
  //   Left:   900-800 = 100 ✓
  //   Right:  1200-1100 = 100 ✓
  //   Between: 1050-950 = 100 ✓
  //   Rows:   350-250 = 100 ✓
  //   Bottom: 500-400 = 100 ✓
  objects.push(makeObj('lobby-o-elev-1', 'elevator', 900, 200))
  objects.push(makeObj('lobby-o-elev-2', 'elevator', 1050, 200))
  objects.push(makeObj('lobby-o-elev-3', 'elevator', 900, 350))
  objects.push(makeObj('lobby-o-elev-4', 'elevator', 1050, 350))

  return { rooms, objects }
}

function buildBasementPreset(): FloorPreset {
  const corridorH = 100
  const corridorY = Math.round((PRESET_CANVAS_H - corridorH) / 2)
  const topH = corridorY
  const botH = PRESET_CANVAS_H - corridorY - corridorH

  const rooms: PresetRoom[] = [
    // Top row — back-of-house operations
    { id: 'g-loading', x: 0, y: 0, w: 500, h: topH, cat: 'back', label: 'LOADING DOCK' },
    { id: 'g-receiving', x: 500, y: 0, w: 500, h: topH, cat: 'back', label: 'RECEIVING & STORAGE' },
    { id: 'g-laundry', x: 1000, y: 0, w: 400, h: topH, cat: 'utility', label: 'LAUNDRY' },
    { id: 'g-lockers', x: 1400, y: 0, w: 300, h: topH, cat: 'utility', label: 'STAFF LOCKERS' },
    { id: 'g-armory', x: 1700, y: 0, w: 300, h: topH, cat: 'security', label: 'ARMORY' },
    // Bottom row — utilities + staff support
    { id: 'g-electrical', x: 0, y: corridorY + corridorH, w: 400, h: botH, cat: 'utility', label: 'ELECTRICAL / GENERATOR' },
    { id: 'g-mech', x: 400, y: corridorY + corridorH, w: 400, h: botH, cat: 'utility', label: 'MECHANICAL / MEP' },
    { id: 'g-cafeteria', x: 800, y: corridorY + corridorH, w: 500, h: botH, cat: 'back', label: 'STAFF CAFETERIA' },
    { id: 'g-coldstorage', x: 1300, y: corridorY + corridorH, w: 400, h: botH, cat: 'back', label: 'KITCHEN PREP & COLD STORAGE' },
    { id: 'g-parking', x: 1700, y: corridorY + corridorH, w: 300, h: botH, cat: 'utility', label: 'PARKING GARAGE' },
    // Single corridor spine
    { id: 'g-corridor', x: 0, y: corridorY, w: PRESET_CANVAS_W, h: corridorH, cat: 'open', label: 'CORRIDOR' },
  ]

  const objects: PresetObject[] = [
    ...autoFurnish(rooms.filter(r => r.cat !== 'open')),
    ...autoDoors('g', rooms),
  ]
  addElevators('g', objects, rooms)
  addCorridorTrashBins('g', objects, corridorY, corridorH)
  return { rooms, objects }
}

function buildStandardFloorV2(prefix: string, labelPrefix: string, roomsPerSide: number = 12): FloorPreset {
  const corridorH = 100
  const lobbyW = 250
  const roomW = 125
  const roomH = 175
  const totalContentH = roomH * 2 + corridorH
  const offsetY = Math.floor((PRESET_CANVAS_H - totalContentH) / 2)
  const corridorY = offsetY + roomH
  const corridorEnd = corridorY + corridorH
  const roomsX = lobbyW
  const roomsAreaW = PRESET_CANVAS_W - lobbyW * 2

  const rooms: PresetRoom[] = []
  const objects: PresetObject[] = []

  rooms.push({
    id: `${prefix}-lobby-l`, x: 0, y: 0, w: lobbyW, h: PRESET_CANVAS_H,
    cat: 'open', label: 'ELEVATOR LOBBY',
  })
  rooms.push({
    id: `${prefix}-lobby-r`, x: PRESET_CANVAS_W - lobbyW, y: 0, w: lobbyW, h: PRESET_CANVAS_H,
    cat: 'open', label: 'ELEVATOR LOBBY',
  })

  const elevSz = 50
  const leftElevX = Math.round((lobbyW - elevSz) / 2)
  const rightElevX = PRESET_CANVAS_W - lobbyW + Math.round((lobbyW - elevSz) / 2)
  const elevY1 = corridorY - elevSz - 50
  const elevY2 = corridorEnd + 50
  objects.push(makeObj(`${prefix}-elev1`, 'elevator', leftElevX, elevY1))
  objects.push(makeObj(`${prefix}-elev2`, 'elevator', leftElevX, elevY2))
  objects.push(makeObj(`${prefix}-elev3`, 'elevator', rightElevX, elevY1))
  objects.push(makeObj(`${prefix}-elev4`, 'elevator', rightElevX, elevY2))

  for (let i = 0; i < roomsPerSide; i++) {
    const x = roomsX + i * roomW
    const room: PresetRoom = {
      id: `${prefix}-t${i}`, x, y: offsetY, w: roomW, h: roomH,
      cat: 'public', label: `${labelPrefix}${String(i + 1).padStart(2, '0')}`,
    }
    rooms.push(room)
    objects.push(makeObj(`${prefix}-door-t${i}`, 'door-standard', x + 2 * TILE, corridorY - TILE, 180))
  }

  for (let i = 0; i < roomsPerSide; i++) {
    const x = roomsX + i * roomW
    const room: PresetRoom = {
      id: `${prefix}-b${i}`, x, y: corridorEnd, w: roomW, h: roomH,
      cat: 'public', label: `${labelPrefix}${String(i + 1 + roomsPerSide).padStart(2, '0')}`,
    }
    rooms.push(room)
    objects.push(makeObj(`${prefix}-door-b${i}`, 'door-standard', x + 2 * TILE, corridorEnd, 0))
  }

  rooms.push({
    id: `${prefix}-corridor`, x: roomsX, y: corridorY,
    w: roomsAreaW, h: corridorH, cat: 'open', label: 'CORRIDOR',
  })

  for (let cx = roomsX + 200; cx < roomsX + roomsAreaW - 200; cx += 400) {
    objects.push(makeObj(`${prefix}-plant-${cx}`, 'plant', cx, Math.round(corridorY + corridorH / 2 - 12)))
  }

  addCorridorTrashBins(prefix, objects, corridorY, corridorH)

  return { rooms, objects }
}

const FLOOR_PRESETS: Record<string, FloorPreset> = {
  G: buildBasementPreset(),
  F2: buildStaticFloor('f2', [
    { id: 'f2-host', x: 0, y: 0, w: 300, h: 300, cat: 'service', label: 'HOST STAND' },
    { id: 'f2-dining', x: 300, y: 0, w: 1100, h: 300, cat: 'public', label: 'MAIN DINING HALL' },
    { id: 'f2-bar', x: 1400, y: 0, w: 600, h: 300, cat: 'public', label: 'BAR LOUNGE' },
    { id: 'f2-restroom-coat', x: 0, y: 400, w: 300, h: 300, cat: 'utility', label: 'COAT CHECK & RESTROOM' },
    { id: 'f2-kitchen', x: 300, y: 400, w: 450, h: 300, cat: 'back', label: 'SHOW KITCHEN' },
    { id: 'f2-service-corridor', x: 750, y: 400, w: 100, h: 300, cat: 'open', label: 'SERVICE CORRIDOR' },
    { id: 'f2-private-dining', x: 850, y: 400, w: 250, h: 300, cat: 'public', label: 'PRIVATE DINING' },
    { id: 'f2-wine', x: 1100, y: 400, w: 300, h: 300, cat: 'back', label: 'WINE CELLAR' },
    { id: 'f2-restroom', x: 1400, y: 400, w: 300, h: 300, cat: 'utility', label: 'GUEST RESTROOMS' },
    { id: 'f2-service', x: 1700, y: 400, w: 300, h: 300, cat: 'back', label: 'STAFF SERVICE CORRIDOR' },
  ]),
  F3: buildStaticFloor('f3', [
    { id: 'f3-banquet', x: 0, y: 0, w: 1200, h: 300, cat: 'open', label: 'BANQUET HALL' },
    { id: 'f3-meetingA', x: 1200, y: 0, w: 300, h: 300, cat: 'service', label: 'MEETING ROOM A' },
    { id: 'f3-meetingB', x: 1500, y: 0, w: 300, h: 300, cat: 'service', label: 'MEETING ROOM B' },
    { id: 'f3-business', x: 1800, y: 0, w: 200, h: 300, cat: 'service', label: 'BUSINESS CENTER' },
    { id: 'f3-spa', x: 0, y: 400, w: 500, h: 300, cat: 'service', label: 'SPA RECEPTION & TREATMENT' },
    { id: 'f3-spalockers', x: 500, y: 400, w: 300, h: 300, cat: 'utility', label: 'SPA LOCKER ROOMS' },
    { id: 'f3-gym', x: 800, y: 400, w: 600, h: 300, cat: 'open', label: 'GYM / FITNESS CENTER' },
    { id: 'f3-pooldeck', x: 1400, y: 400, w: 300, h: 300, cat: 'open', label: 'POOL DECK ACCESS / SAUNA' },
    { id: 'f3-meetingC', x: 1700, y: 400, w: 300, h: 300, cat: 'service', label: 'MEETING ROOM C' },
  ]),
  F4: buildStaticFloor('f4', [
    { id: 'f4-secoffice', x: 0, y: 0, w: 500, h: 300, cat: 'security', label: 'SECURITY OFFICE' },
    { id: 'f4-cctv', x: 500, y: 0, w: 500, h: 300, cat: 'security', label: 'CCTV CONTROL ROOM' },
    { id: 'f4-briefing', x: 1000, y: 0, w: 400, h: 300, cat: 'security', label: 'BRIEFING ROOM' },
    { id: 'f4-armory', x: 1400, y: 0, w: 300, h: 300, cat: 'security', label: 'ARMORY' },
    { id: 'f4-records', x: 1700, y: 0, w: 300, h: 300, cat: 'security', label: 'EVIDENCE / RECORDS' },
    { id: 'f4-server', x: 0, y: 400, w: 500, h: 300, cat: 'utility', label: 'SERVER / IT ROOM' },
    { id: 'f4-holding', x: 500, y: 400, w: 400, h: 300, cat: 'security', label: 'HOLDING ROOM' },
    { id: 'f4-restroom', x: 900, y: 400, w: 300, h: 300, cat: 'utility', label: 'STAFF RESTROOM' },
    { id: 'f4-restarea', x: 1200, y: 400, w: 400, h: 300, cat: 'back', label: 'GUARD REST AREA' },
    { id: 'f4-badge', x: 1600, y: 400, w: 400, h: 300, cat: 'security', label: 'ACCESS CONTROL / BADGE OFFICE' },
  ]),
  F5: staffFloor('f5'),
  F6: staffFloor('f6'),
  F7: buildStandardFloorV2('f7', 'STD-7-', 12),
  F8: guestRoomFloor('f8', 12, 100, 'STD-8-', 'standard'),
  F9: guestRoomFloor('f9', 12, 100, 'STD-9-', 'standard'),
  F10: guestRoomFloor('f10', 12, 100, 'STD-10-', 'standard'),
  F11: guestRoomFloor('f11', 8, 120, 'DLX-11-', 'deluxe'),
  F12: guestRoomFloor('f12', 8, 120, 'DLX-12-', 'deluxe'),
  F13: executiveFloor('f13', 6),
  F14: executiveFloor('f14', 6),
  F15: guestRoomFloor('f15', 4, 150, 'VIP-15-', 'vip'),
  F16: guestRoomFloor('f16', 4, 150, 'VIP-16-', 'vip'),
  F17: buildGuestStaticFloor('f17', [
    { id: 'f17-penthouseA', x: 0, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE A' },
    { id: 'f17-penthouseB', x: 500, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE B' },
    { id: 'f17-penthouseC', x: 1000, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE C' },
    { id: 'f17-penthouseD', x: 1500, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE D' },
  ], 'penthouse'),
  F18: buildGuestStaticFloor('f18', [
    { id: 'f18-penthouseA', x: 0, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE A' },
    { id: 'f18-penthouseB', x: 500, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE B' },
    { id: 'f18-penthouseC', x: 1000, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE C' },
    { id: 'f18-penthouseD', x: 1500, y: 0, w: 500, h: 800, cat: 'public', label: 'PENTHOUSE SUITE D' },
  ], 'penthouse'),
  F19: buildStaticFloor('f19', [
    { id: 'f19-racks', x: 0, y: 0, w: 1200, h: 300, cat: 'utility', label: 'SERVER RACKS HALL' },
    { id: 'f19-cooling', x: 1200, y: 0, w: 800, h: 300, cat: 'utility', label: 'COOLING / HVAC' },
    { id: 'f19-noc', x: 0, y: 400, w: 700, h: 300, cat: 'security', label: 'NETWORK OPERATIONS CONTROL' },
    { id: 'f19-vault', x: 700, y: 400, w: 600, h: 300, cat: 'security', label: 'SECURE DATA VAULT' },
    { id: 'f19-intel', x: 1300, y: 400, w: 700, h: 300, cat: 'security', label: 'INTEL ANALYSIS ROOM' },
  ]),
  F20: buildStaticFloor('f20', [
    { id: 'f20-office', x: 0, y: 0, w: 700, h: 300, cat: 'back', label: 'PRIVATE OFFICE' },
    { id: 'f20-bedroom', x: 700, y: 0, w: 600, h: 300, cat: 'security', label: 'SAFE HOUSE BEDROOM' },
    { id: 'f20-panic', x: 1300, y: 0, w: 400, h: 300, cat: 'security', label: 'PANIC ROOM' },
    { id: 'f20-meeting', x: 1700, y: 0, w: 300, h: 300, cat: 'back', label: 'MEETING ROOM' },
    { id: 'f20-living', x: 0, y: 400, w: 1000, h: 300, cat: 'security', label: 'SAFE HOUSE LIVING AREA' },
    { id: 'f20-vault', x: 1000, y: 400, w: 500, h: 300, cat: 'security', label: 'ARMORED STORAGE / VAULT' },
    { id: 'f20-escape', x: 1500, y: 400, w: 500, h: 300, cat: 'open', label: 'ESCAPE CORRIDOR' },
  ]),
  F21: buildStaticFloor('f21', [
    { id: 'f21-pool', x: 0, y: 0, w: 800, h: 300, cat: 'open', label: 'ROOFTOP POOL' },
    { id: 'f21-poolbar', x: 800, y: 0, w: 300, h: 300, cat: 'public', label: 'POOL BAR' },
    { id: 'f21-lounge', x: 1100, y: 0, w: 500, h: 300, cat: 'open', label: 'LOUNGE DECK' },
    { id: 'f21-garden', x: 1600, y: 0, w: 400, h: 300, cat: 'open', label: 'SKY GARDEN' },
    { id: 'f21-helipad', x: 0, y: 400, w: 600, h: 300, cat: 'open', label: 'HELIPAD' },
    { id: 'f21-cabana', x: 600, y: 400, w: 400, h: 300, cat: 'public', label: 'VIP CABANA' },
    { id: 'f21-restaurant', x: 1000, y: 400, w: 600, h: 300, cat: 'public', label: 'ROOFTOP RESTAURANT' },
    { id: 'f21-mech', x: 1600, y: 400, w: 400, h: 300, cat: 'utility', label: 'MECHANICAL PENTHOUSE' },
  ]),
}

function getPresetForLabel(label: string): FloorPreset | undefined {
  if (label === 'F1') return buildLobbyPreset()
  return FLOOR_PRESETS[label]
}

function makeDefaultFloors(): FloorData[] {
  return DEFAULT_FLOOR_NAMES.map(f => {
    const label = f.id === 'G' ? 'G' : f.id
    const preset = getPresetForLabel(label)
    const floor: FloorData = {
      id: `floor-${f.id}`,
      name: f.name,
      label,
      rooms: preset ? preset.rooms.map(r => ({ ...r, locked: true })) : [],
      objects: preset ? preset.objects.map(o => ({ ...o })) : [],
    }
    recalcCollapsed(floor, [])
    return floor
  })
}

function makeDefaultLayout(): LayoutData {
  return {
    version: LAYOUT_VERSION,
    canvas: { width: 2000, height: 800, tileSize: 25 },
    customAssets: [],
    hiddenBuiltinIds: [],
    roomCategories: DEFAULT_ROOM_CATEGORIES.map(c => ({ ...c })),
    assetCategories: ['Door', 'Core', 'Furniture', 'Custom'],
    floors: makeDefaultFloors(),
  }
}

let idCounter = 1
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`
}

const ASSET_KEYWORD_MAP: { keywords: string[]; assetId: string }[] = [
  { keywords: ['elevator', 'lift'], assetId: 'elevator' },
  { keywords: ['column', 'pillar'], assetId: 'column' },
  { keywords: ['door-lobby', 'lobby-door', 'entrance-door'], assetId: 'door-lobby' },
  { keywords: ['door-sliding', 'sliding-door'], assetId: 'door-sliding' },
  { keywords: ['door', 'entrance'], assetId: 'door-standard' },
  { keywords: ['bed', 'mattress'], assetId: 'bed' },
  { keywords: ['nightstand', 'night-stand', 'bedside'], assetId: 'nightstand' },
  { keywords: ['concierge', 'reception-desk', 'front-desk'], assetId: 'concierge-desk' },
  { keywords: ['reception', 'counter', 'check-in'], assetId: 'reception-counter' },
  { keywords: ['desk', 'table-work', 'workstation'], assetId: 'desk' },
  { keywords: ['chair', 'seat', 'stool'], assetId: 'chair' },
  { keywords: ['sofa', 'couch', 'lounge-seat'], assetId: 'sofa' },
  { keywords: ['table-chair', 'dining-set', 'table-set'], assetId: 'table-chairs' },
  { keywords: ['dining-table', 'round-table'], assetId: 'dining-table-round' },
  { keywords: ['plant', 'tree', 'flower', 'pot'], assetId: 'plant' },
  { keywords: ['luggage', 'baggage', 'suitcase'], assetId: 'luggage-rack' },
  { keywords: ['bar-counter', 'drink-counter'], assetId: 'bar-counter' },
  { keywords: ['bar-stool', 'drink-stool'], assetId: 'bar-stool' },
  { keywords: ['stove', 'cooker', 'range'], assetId: 'kitchen-stove' },
  { keywords: ['prep', 'cooking-station'], assetId: 'prep-station' },
  { keywords: ['shelf', 'storage', 'rack-storage'], assetId: 'storage-shelf' },
  { keywords: ['wardrobe', 'closet', 'armoire'], assetId: 'wardrobe' },
  { keywords: ['minibar', 'mini-bar', 'fridge'], assetId: 'minibar' },
  { keywords: ['tv', 'television', 'screen'], assetId: 'tv-stand' },
  { keywords: ['bathtub', 'tub', 'bath'], assetId: 'bathtub' },
  { keywords: ['weapon', 'gun', 'armory-rack'], assetId: 'weapon-rack' },
  { keywords: ['control', 'security-desk', 'guard-desk'], assetId: 'control-desk' },
  { keywords: ['server', 'data-rack', 'network-rack'], assetId: 'server-rack' },
  { keywords: ['filing', 'cabinet', 'document'], assetId: 'filing-cabinet' },
  { keywords: ['trash', 'bin', 'garbage', 'waste'], assetId: 'trash-bin' },
  { keywords: ['helipad', 'helicopter', 'heli'], assetId: 'helipad' },
]

function resolveAssetType(type: string, customAssetIds?: Set<string>): string {
  if (customAssetIds && customAssetIds.has(type)) return type
  if (BUILTIN_ASSETS.some(a => a.id === type)) return type
  const lower = type.toLowerCase()
  for (const entry of ASSET_KEYWORD_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.assetId
    }
  }
  return type
}

function migrate(data: unknown): LayoutData {
  if (!data || typeof data !== 'object') return makeDefaultLayout()
  const d = data as Record<string, unknown>
  const canvas = d.canvas
  const validCanvas = canvas && typeof canvas === 'object'
    && typeof (canvas as Record<string, unknown>).tileSize === 'number'
    && isFinite((canvas as Record<string, unknown>).tileSize as number)
    && (canvas as Record<string, unknown>).tileSize as number > 0
  const hiddenBuiltinIds: string[] = Array.isArray(d.hiddenBuiltinIds)
    ? d.hiddenBuiltinIds.filter((id: unknown): id is string => typeof id === 'string')
    : []
  const migrated: LayoutData = {
    version: LAYOUT_VERSION,
    hiddenBuiltinIds,
    roomCategories: Array.isArray(d.roomCategories)
      ? d.roomCategories.filter((c: unknown): c is Record<string, unknown> => {
          const rec = c as Record<string, unknown>
          return typeof rec?.id === 'string' && typeof rec?.label === 'string' && typeof rec?.color === 'string'
        }).map((c) => {
          const def: RoomCategoryDef = {
            id: c.id as string,
            label: c.label as string,
            color: c.color as string,
          }
          if (c.builtin === true) def.builtin = true
          return def
        })
      : DEFAULT_ROOM_CATEGORIES.map(c => ({ ...c })),
    assetCategories: Array.isArray(d.assetCategories)
      ? d.assetCategories.filter((c: unknown): c is string => typeof c === 'string')
      : ['Door', 'Core', 'Furniture', 'Custom'],
    canvas: validCanvas
      ? {
          width: typeof (canvas as Record<string, unknown>).width === 'number' && isFinite((canvas as Record<string, unknown>).width as number) ? (canvas as Record<string, unknown>).width as number : 2000,
          height: typeof (canvas as Record<string, unknown>).height === 'number' && isFinite((canvas as Record<string, unknown>).height as number) ? (canvas as Record<string, unknown>).height as number : 800,
          tileSize: (canvas as Record<string, unknown>).tileSize as number,
        }
      : { width: 2000, height: 800, tileSize: 25 },
    customAssets: Array.isArray(d.customAssets)
      ? d.customAssets.filter(
          (a: unknown): a is Record<string, unknown> => {
            const rec = a as Record<string, unknown>
            return typeof rec?.id === 'string' && typeof rec?.name === 'string'
              && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
              && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
          }
        ).map((a) => {
          const asset: AssetDef = {
            id: a.id as string,
            name: a.name as string,
            category: typeof a.category === 'string' ? a.category : 'Custom',
            w: a.w as number,
            h: a.h as number,
            shape: ['rect', 'circle', 'round', 'arc'].includes(a.shape as string) ? a.shape as AssetDef['shape'] : 'rect',
            custom: true,
          }
          if (typeof a.pxW === 'number' && a.pxW > 0) asset.pxW = Math.floor(a.pxW)
          if (typeof a.pxH === 'number' && a.pxH > 0) asset.pxH = Math.floor(a.pxH)
          if (Array.isArray(a.parts)) {
            asset.parts = a.parts
              .filter((p: unknown): p is Record<string, unknown> => {
                const rec = p as Record<string, unknown>
                return typeof rec?.dx === 'number' && typeof rec?.dy === 'number'
                  && typeof rec?.w === 'number' && typeof rec?.h === 'number'
                  && ['rect', 'circle', 'round', 'arc'].includes(rec.shape as string)
              })
              .map((p) => {
                const part: CompositePart = {
                  dx: p.dx as number,
                  dy: p.dy as number,
                  w: p.w as number,
                  h: p.h as number,
                  shape: p.shape as AssetShape,
                }
                if (typeof p.rotation === 'number' && [0, 90, 180, 270].includes(p.rotation)) {
                  part.rotation = p.rotation as Rotation
                }
                if (typeof p.type === 'string') {
                  part.type = p.type
                }
                return part
              })
          }
          if (Array.isArray(a.linkedParts)) {
            asset.linkedParts = a.linkedParts
              .filter((p: unknown): p is Record<string, unknown> => {
                const rec = p as Record<string, unknown>
                return typeof rec?.type === 'string' && typeof rec?.dx === 'number' && typeof rec?.dy === 'number'
                  && typeof rec?.w === 'number' && typeof rec?.h === 'number'
              })
              .map((p) => {
                const part: LinkedPart = {
                  type: p.type as string,
                  dx: p.dx as number,
                  dy: p.dy as number,
                  w: p.w as number,
                  h: p.h as number,
                }
                if (typeof p.rotation === 'number' && [0, 90, 180, 270].includes(p.rotation)) {
                  part.rotation = p.rotation as Rotation
                }
                return part
              })
          }
          if (typeof a.defaultPadding === 'number' && a.defaultPadding > 0) asset.defaultPadding = a.defaultPadding
          if (a.defaultRx && typeof a.defaultRx === 'object') {
            const rx = a.defaultRx as Record<string, unknown>
            if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
              asset.defaultRx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
            }
          }
          return asset
        })
      : [],
    floors: Array.isArray(d.floors) && d.floors.length > 0
      ? d.floors.map((f: unknown) => {
          const fRec = (f ?? {}) as Record<string, unknown>
          return {
          id: typeof fRec.id === 'string' ? fRec.id : genId('floor'),
          name: typeof fRec.name === 'string' ? fRec.name : 'Unnamed',
          label: typeof fRec.label === 'string' ? fRec.label : 'F?',
          rooms: Array.isArray(fRec.rooms) ? fRec.rooms.filter(
            (r: unknown): r is Record<string, unknown> => {
              const rec = r as Record<string, unknown>
              return typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((r) => {
            const room: RoomData = {
              id: typeof r.id === 'string' ? r.id : genId('r'),
              x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number,
              cat: typeof r.cat === 'string' ? r.cat : 'public',
              label: typeof r.label === 'string' ? r.label : '',
            }
            if (typeof r.radius === 'number' && r.radius >= 0) room.radius = r.radius
            if (r.locked === true) room.locked = true
            return room
          }) : [],
          objects: Array.isArray(fRec.objects) ? fRec.objects.filter(
            (o: unknown): o is Record<string, unknown> => {
              const rec = o as Record<string, unknown>
              return typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((o) => {
            const obj: ObjectData = {
              id: typeof o.id === 'string' ? o.id : genId('o'),
              type: typeof o.type === 'string' ? o.type : 'unknown',
              x: o.x as number, y: o.y as number, w: o.w as number, h: o.h as number,
              rotation: [0, 90, 180, 270].includes(o.rotation as number) ? o.rotation as Rotation : 0,
            }
            if (typeof o.radius === 'number' && o.radius >= 0) obj.radius = o.radius
            if (o.rx && typeof o.rx === 'object') {
              const rx = o.rx as Record<string, unknown>
              if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
                obj.rx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
              }
            }
            if (typeof o.labelPadding === 'number' && o.labelPadding >= 0) obj.labelPadding = o.labelPadding
            if (typeof o.padding === 'number' && o.padding >= 0) obj.padding = o.padding
            if (Array.isArray(o.linkedIds)) {
              obj.linkedIds = o.linkedIds.filter((lid: unknown): lid is string => typeof lid === 'string')
              if (obj.linkedIds.length === 0) delete obj.linkedIds
            }
            if (typeof o.fillColor === 'string' && o.fillColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(o.fillColor)) obj.fillColor = o.fillColor
            if (o.locked === true) obj.locked = true
            if (typeof o.label === 'string' && o.label) obj.label = o.label
            return obj
          }) : [],
          zones: Array.isArray(fRec.zones) ? fRec.zones.filter(
            (z: unknown): z is Record<string, unknown> => {
              const rec = z as Record<string, unknown>
              return typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((z) => ({
            id: typeof z.id === 'string' ? z.id : genId('zone'),
            x: z.x as number, y: z.y as number, w: z.w as number, h: z.h as number,
            label: typeof z.label === 'string' ? z.label : 'Zone',
            color: typeof z.color === 'string' ? z.color : '#06b6d4',
          })) : [],
        }})
      : makeDefaultFloors(),
  }
  const customAssetIds = new Set(migrated.customAssets.map(a => a.id))
  const t = migrated.canvas.tileSize
  for (const asset of migrated.customAssets) {
    if (asset.linkedParts && asset.linkedParts.length > 0) {
      for (const p of asset.linkedParts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
    if (asset.parts && asset.parts.length > 0) {
      for (const p of asset.parts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
  }
  for (const floor of migrated.floors) {
    for (const o of floor.objects) {
      if (!findAsset(migrated.customAssets, o.type)) {
        o.type = resolveAssetType(o.type, customAssetIds)
      }
    }
    const validIds = new Set(floor.objects.map(o => o.id))
    const beforeCount = floor.objects.length
    floor.objects = floor.objects.filter(o => findAsset(migrated.customAssets, o.type))
    const removedCount = beforeCount - floor.objects.length
    if (removedCount > 0) {
      editorLog.warn('Migration', `removed ${removedCount} object(s) with unknown asset types from floor "${floor.label}"`)
    }
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => validIds.has(lid))
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
      normalizeObject(o, migrated.canvas.tileSize, migrated.customAssets)
    }
    recalcCollapsed(floor, migrated.customAssets)
  }
  return migrated
}

function loadInitial(): LayoutData {
  const savedPresetVer = localStorage.getItem(PRESET_VERSION_KEY)
  const currentPresetVer = String(PRESET_VERSION)
  const presetChanged = savedPresetVer !== currentPresetVer

  if (presetChanged) {
    localStorage.setItem(PRESET_VERSION_KEY, currentPresetVer)
  }

  if (presetChanged) {
    // Preset version changed: try to preserve user edits
    let savedData: LayoutData | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        savedData = migrate(JSON.parse(raw))
      }
    } catch (e) {
      editorLog.error('loadSavedLayoutDuringPresetUpgrade', e)
    }

    if (savedData) {
      // Preserve user customizations, refresh preset floors
      for (const floor of savedData.floors) {
        const preset = getPresetForLabel(floor.label)
        if (preset) {
          floor.rooms = preset.rooms.map(r => ({ ...r, locked: true }))
          floor.objects = preset.objects.map(o => ({ ...o }))
          recalcCollapsed(floor, savedData.customAssets)
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData))
      return savedData
    }

    // No saved data: rebuild from SAVED_LAYOUT + fresh presets
    const data = migrate(JSON.parse(JSON.stringify(SAVED_LAYOUT)))
    for (const floor of data.floors) {
      const preset = getPresetForLabel(floor.label)
      if (preset) {
        floor.rooms = preset.rooms.map(r => ({ ...r, locked: true }))
        floor.objects = preset.objects.map(o => ({ ...o }))
        recalcCollapsed(floor, data.customAssets)
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  }

  // Preset unchanged: load from localStorage (user's edits)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return migrate(JSON.parse(raw))
    }
  } catch (e) {
    editorLog.error('loadFromLocalStorage', e)
  }

  // No localStorage data: fall back to SAVED_LAYOUT
  const data = migrate(JSON.parse(JSON.stringify(SAVED_LAYOUT)))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

interface EditorState {
  layout: LayoutData
  currentFloorId: string
  mode: EditorMode
  selection: Selection
  multiSelection: MultiSelection | null
  selectedAssetId: string | null
  wallCategory: string
}

const state = reactive<EditorState>({
  layout: loadInitial(),
  currentFloorId: '',
  mode: 'object',
  selection: null,
  multiSelection: null,
  selectedAssetId: null,
  wallCategory: 'public',
})

state.currentFloorId = state.layout.floors[0]?.id ?? ''

let _assetMap: Map<string, AssetDef> | null = null
let _assetMapVersion = -1
let _assetMapMutations = 0
function invalidateAssetMap() {
  _assetMapMutations++
}
function assetMap(): Map<string, AssetDef> {
  if (!_assetMap || _assetMapVersion !== _assetMapMutations) {
    _assetMap = buildAssetMap(state.layout.customAssets)
    _assetMapVersion = _assetMapMutations
  }
  return _assetMap
}

export const dragState = reactive<{ assetId: string | null }>({ assetId: null })

export function startAssetDrag(assetId: string) {
  dragState.assetId = assetId
}

export function endAssetDrag() {
  dragState.assetId = null
}

function selectAsset(id: string | null) {
  state.selectedAssetId = id
  if (id) state.selection = null
  state.multiSelection = null
}

const selectedAsset = computed(() =>
  state.selectedAssetId ? findAsset(state.layout.customAssets, state.selectedAssetId) ?? null : null
)

const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
let saveTimer: number | null = null

function snapshot(): string {
  return JSON.stringify(state.layout)
}

function restore(json: string) {
  let parsed: LayoutData
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    editorLog.error('restoreHistorySnapshot', e)
    return
  }
  if (!parsed || !parsed.floors || !parsed.floors.length) {
    editorLog.error('restoreHistorySnapshot', 'Invalid snapshot — missing floors')
    return
  }
  state.layout = parsed
  invalidateAssetMap()
  if (!state.layout.floors.find(f => f.id === state.currentFloorId)) {
    state.currentFloorId = state.layout.floors[0]?.id ?? ''
  }
  state.selection = null
  state.multiSelection = null
  for (const floor of state.layout.floors) {
    recalcCollapsed(floor)
  }
}

function pushHistory() {
  undoStack.value.push(snapshot())
  if (undoStack.value.length > HISTORY_LIMIT) undoStack.value.shift()
  redoStack.value.length = 0
}

function undo() {
  if (undoStack.value.length === 0) return
  redoStack.value.push(snapshot())
  const prev = undoStack.value.pop()!
  restore(prev)
  scheduleSave()
}

function redo() {
  if (redoStack.value.length === 0) return
  undoStack.value.push(snapshot())
  const next = redoStack.value.pop()!
  restore(next)
  scheduleSave()
}

function scheduleSave() {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = null
    saveToLocalStorage()
  }, 500)
}

function flushSave() {
  if (saveTimer) {
    window.clearTimeout(saveTimer)
    saveTimer = null
    saveToLocalStorage()
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.layout))
  } catch (e) {
    editorLog.error('saveToLocalStorage', e)
    toast.error('Save failed — storage quota exceeded')
  }
}

const currentFloor = computed<FloorData | undefined>(() =>
  state.layout.floors.find(f => f.id === state.currentFloorId)
)

function snap(value: number, tileSize?: number): number {
  const t = tileSize ?? state.layout.canvas.tileSize
  if (t <= 0) return value
  return Math.round(value / t) * t
}

function selectedRoom(): RoomData | undefined {
  if (state.selection?.type !== 'room') return undefined
  return currentFloor.value?.rooms.find(r => r.id === state.selection!.id)
}

function selectedObject(): ObjectData | undefined {
  if (state.selection?.type !== 'object') return undefined
  return currentFloor.value?.objects.find(o => o.id === state.selection!.id)
}

function roomOverlapsAny(rect: Rect, excludeId?: string): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  return floor.rooms.some(r => r.id !== excludeId && aabbOverlap(rect, r))
}

function objectOverlapsAny(rect: Rect, excludeId?: string | string[]): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  const am = assetMap()
  const excluded = Array.isArray(excludeId) ? new Set(excludeId) : excludeId ? new Set([excludeId]) : null
  return floor.objects.some(o => {
    if (excluded && excluded.has(o.id)) return false
    const asset = findAssetCached(am, o.type)
    if (asset?.parts && asset.parts.length > 0) {
      return asset.parts.some(part => {
        const partRect = { x: o.x + part.dx, y: o.y + part.dy, w: part.w, h: part.h }
        return aabbOverlap(rect, partRect)
      })
    }
    return aabbOverlap(rect, o)
  })
}

function recalcCollapsed(floor: FloorData, customAssets?: AssetDef[]) {
  const am = customAssets ? buildAssetMap(customAssets) : assetMap()
  const objCount = floor.objects.length
  if (objCount <= 1) {
    if (objCount === 1) floor.objects[0].collapsed = false
    return
  }
  function getAsset(type: string): AssetDef | undefined {
    return findAssetCached(am, type)
  }
  for (const obj of floor.objects) {
    const asset = getAsset(obj.type)
    const hasParts = asset?.parts && asset.parts.length > 0
    obj.collapsed = floor.objects.some(o => {
      if (o.id === obj.id) return false
      if (!aabbOverlap(obj, o)) return false
      const oAsset = getAsset(o.type)
      if (hasParts) {
        const parts = asset!.parts!
        if (oAsset?.parts && oAsset.parts.length > 0) {
          return oAsset.parts.some(op => parts.some(mp => {
            const mr = { x: obj.x + mp.dx, y: obj.y + mp.dy, w: mp.w, h: mp.h }
            const or = { x: o.x + op.dx, y: o.y + op.dy, w: op.w, h: op.h }
            return aabbOverlap(mr, or)
          }))
        }
        return parts.some(mp => {
          const mr = { x: obj.x + mp.dx, y: obj.y + mp.dy, w: mp.w, h: mp.h }
          return aabbOverlap(mr, o)
        })
      }
      if (oAsset?.parts && oAsset.parts.length > 0) {
        return oAsset.parts.some(op => {
          const or = { x: o.x + op.dx, y: o.y + op.dy, w: op.w, h: op.h }
          return aabbOverlap(obj, or)
        })
      }
      return true
    })
  }
}

function clamp(rect: Rect): Rect {
  const { width, height } = state.layout.canvas
  let { x, y, w, h } = rect
  w = Math.min(w, width)
  h = Math.min(h, height)
  x = Math.max(0, Math.min(x, width - w))
  y = Math.max(0, Math.min(y, height - h))
  return { x, y, w, h }
}

function addRoom(rect: Rect, cat: string, label = 'New Room'): RoomData | null {
  const floor = currentFloor.value
  if (!floor) return null
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  if (snapped.w <= 0 || snapped.h <= 0) {
    toast.warning('Room too small — minimum 1 tile')
    return null
  }
  if (roomOverlapsAny(snapped)) {
    toast.warning('Cannot place room — overlaps existing room')
    return null
  }
  pushHistory()
  const room: RoomData = { id: genId('r'), ...snapped, cat, label }
  floor.rooms.push(room)
  state.selection = { type: 'room', id: room.id }
  scheduleSave()
  return room
}

function assetSizeFor(type: string, rotation: Rotation, tileSize?: number, customAssets?: AssetDef[]): { w: number; h: number } | null {
  const asset = customAssets
    ? findAsset(customAssets, type)
    : findAssetCached(assetMap(), type)
  if (!asset) return null
  const t = tileSize ?? state.layout.canvas.tileSize
  const aw = asset.pxW ?? asset.w * t
  const ah = asset.pxH ?? asset.h * t
  const swap = rotation === 90 || rotation === 270
  return swap ? { w: ah, h: aw } : { w: aw, h: ah }
}

function normalizeObject(o: ObjectData, tileSize?: number, customAssets?: AssetDef[]): void {
  // Don't resize objects that are part of a linked set — their sizes come from linkedParts
  if (o.linkedIds && o.linkedIds.length > 0) {
    const t = tileSize ?? state.layout.canvas.tileSize
    o.x = Math.round(o.x / t) * t
    o.y = Math.round(o.y / t) * t
    return
  }
  const sz = assetSizeFor(o.type, o.rotation, tileSize, customAssets)
  if (sz) {
    o.w = sz.w
    o.h = sz.h
  }
  const t = tileSize ?? state.layout.canvas.tileSize
  o.x = Math.round(o.x / t) * t
  o.y = Math.round(o.y / t) * t
  const asset = customAssets
    ? findAsset(customAssets, o.type)
    : findAssetCached(assetMap(), o.type)
  if (asset && (asset.shape === 'circle' || asset.shape === 'round')) {
    o.radius = Math.min(o.w, o.h) / 2 - 2
  }
}

function addObject(type: string, x: number, y: number): ObjectData | null {
  if (state.mode === 'wall') return null
  const floor = currentFloor.value
  const asset = findAssetCached(assetMap(), type)
  if (!floor || !asset) return null
  const t = state.layout.canvas.tileSize
  const w = snap(asset.pxW ?? asset.w * t)
  const h = snap(asset.pxH ?? asset.h * t)
  const rect = clamp({ x: snap(x), y: snap(y), w, h })

  if (asset.linkedParts && asset.linkedParts.length > 0) {
    const parts = asset.linkedParts
    const partRects = parts.map(p => ({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) }))
    const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
    const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
    const overflowX = Math.max(0, groupMaxX - state.layout.canvas.width)
    const overflowY = Math.max(0, groupMaxY - state.layout.canvas.height)
    if (overflowX > 0 || overflowY > 0) {
      for (const pr of partRects) {
        pr.x -= overflowX
        pr.y -= overflowY
      }
    }
    for (const pr of partRects) {
      if (objectOverlapsAny(pr)) {
        toast.warning('Cannot place — one or more parts overlap existing objects')
        return null
      }
    }
    pushHistory()
    const newIds: string[] = []
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      const pr = partRects[i]
      const partAsset = findAssetCached(assetMap(), p.type)
      const obj: ObjectData = {
        id: genId('o'),
        type: p.type,
        rotation: p.rotation ?? 0,
        ...pr,
      }
      if (asset.defaultPadding) obj.padding = asset.defaultPadding
      if (asset.defaultRx) obj.rx = { ...asset.defaultRx }
      if (partAsset?.defaultPadding && obj.padding === undefined) obj.padding = partAsset.defaultPadding
      if (partAsset?.defaultRx && obj.rx === undefined) obj.rx = { ...partAsset.defaultRx }
      floor.objects.push(obj)
      newIds.push(obj.id)
    }
    for (const id of newIds) {
      const obj = floor.objects.find(o => o.id === id)!
      obj.linkedIds = newIds.filter(otherId => otherId !== id)
    }
    state.selection = { type: 'object', id: newIds[0] }
    state.multiSelection = { type: 'object', ids: newIds }
    scheduleSave()
    return floor.objects.find(o => o.id === newIds[0]) ?? null
  }

  if (objectOverlapsAny(rect)) {
    toast.warning('Cannot place object — overlaps existing object')
    return null
  }
  pushHistory()
  const obj: ObjectData = { id: genId('o'), type, rotation: 0, ...rect }
  if (asset.defaultPadding !== undefined) obj.padding = asset.defaultPadding
  if (asset.defaultRx) obj.rx = { ...asset.defaultRx }
  floor.objects.push(obj)
  state.selection = { type: 'object', id: obj.id }
  scheduleSave()
  return obj
}

function canPlaceObject(type: string, x: number, y: number): boolean {
  if (state.mode === 'wall') return false
  const asset = findAssetCached(assetMap(), type)
  if (!asset) return false
  const t = state.layout.canvas.tileSize
  const w = snap(asset.pxW ?? asset.w * t)
  const h = snap(asset.pxH ?? asset.h * t)
  const rect = clamp({ x: snap(x), y: snap(y), w, h })
  if (asset.linkedParts && asset.linkedParts.length > 0) {
    const partRects = asset.linkedParts.map(p =>
      ({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) })
    )
    const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
    const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
    const overflowX = Math.max(0, groupMaxX - state.layout.canvas.width)
    const overflowY = Math.max(0, groupMaxY - state.layout.canvas.height)
    if (overflowX > 0 || overflowY > 0) {
      for (const pr of partRects) {
        pr.x -= overflowX
        pr.y -= overflowY
      }
    }
    return partRects.every(pr => !objectOverlapsAny(pr))
  }
  return !objectOverlapsAny(rect)
}

function canPlaceRoom(rect: Rect): boolean {
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  return snapped.w > 0 && snapped.h > 0 && !roomOverlapsAny(snapped)
}

function select(sel: Selection) {
  state.selection = sel
  state.multiSelection = null
  if (sel) state.selectedAssetId = null
}

function toggleMultiSelect(id: string) {
  if (!state.multiSelection) {
    if (state.selection?.type === 'object' && state.selection.id !== id) {
      state.multiSelection = { type: 'object', ids: [state.selection.id, id] }
    } else {
      state.multiSelection = { type: 'object', ids: [id] }
    }
    state.selection = null
  } else {
    const idx = state.multiSelection.ids.indexOf(id)
    if (idx >= 0) {
      state.multiSelection.ids.splice(idx, 1)
      if (state.multiSelection.ids.length === 0) {
        state.multiSelection = null
      } else if (state.multiSelection.ids.length === 1) {
        state.selection = { type: 'object', id: state.multiSelection.ids[0] }
        state.multiSelection = null
      }
    } else {
      state.multiSelection.ids.push(id)
    }
  }
}

function deleteSelected() {
  const floor = currentFloor.value
  if (!floor) return

  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    const allIds = state.multiSelection.ids
    const ids = allIds.filter(id => {
      const o = floor.objects.find(o => o.id === id)
      return !o?.locked
    })
    if (ids.length === 0) {
      toast.warning('All selected objects are locked')
      return
    }
    if (ids.length < allIds.length) {
      toast.info(`${allIds.length - ids.length} locked object(s) skipped`)
    }
    pushHistory()
    floor.objects = floor.objects.filter(o => !ids.includes(o.id))
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => !ids.includes(lid))
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
    }
    state.multiSelection = null
    recalcCollapsed(floor)
    scheduleSave()
    return
  }

  if (!state.selection) return
  if (state.selection.type === 'room') {
    const r = floor.rooms.find(r => r.id === state.selection!.id)
    if (r?.locked) {
      toast.warning('Cannot delete a locked hotel wall')
      return
    }
  } else {
    const o = floor.objects.find(o => o.id === state.selection!.id)
    if (o?.locked) {
      toast.warning('Cannot delete a locked object — unlock first')
      return
    }
  }
  pushHistory()
  if (state.selection.type === 'room') {
    floor.rooms = floor.rooms.filter(r => r.id !== state.selection!.id)
  } else {
    const delId = state.selection.id
    floor.objects = floor.objects.filter(o => o.id !== delId)
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => lid !== delId)
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
    }
  }
  state.selection = null
  recalcCollapsed(floor)
  scheduleSave()
}

function groupBoundsOf(objs: ObjectData[]): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of objs) {
    minX = Math.min(minX, o.x)
    minY = Math.min(minY, o.y)
    maxX = Math.max(maxX, o.x + o.w)
    maxY = Math.max(maxY, o.y + o.h)
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

function moveSelectedTo(x: number, y: number) {
  const floor = currentFloor.value
  if (!floor) return

  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    const ids = state.multiSelection.ids
    const objs = floor.objects.filter(o => ids.includes(o.id) && !o.locked)
    if (objs.length === 0) return
    const bounds = groupBoundsOf(objs)
    const { width, height } = state.layout.canvas
    const clampedX = Math.max(0, Math.min(x, width - bounds.w))
    const clampedY = Math.max(0, Math.min(y, height - bounds.h))
    const dx = clampedX - bounds.minX
    const dy = clampedY - bounds.minY
    for (const o of objs) {
      o.x += dx
      o.y += dy
    }
    return
  }

  if (!state.selection) return
  if (state.selection.type === 'room') {
    const r = selectedRoom()
    if (!r || r.locked) return
    const rect = clamp({ x, y, w: r.w, h: r.h })
    r.x = rect.x
    r.y = rect.y
  } else {
    const o = selectedObject()
    if (!o || o.locked) return
    const linked = getLinkedObjects(o).filter(l => !l.locked)
    if (linked.length > 0) {
      const group = [o, ...linked]
      const bounds = groupBoundsOf(group)
      const { width, height } = state.layout.canvas
      const clampedX = Math.max(0, Math.min(x, width - bounds.w))
      const clampedY = Math.max(0, Math.min(y, height - bounds.h))
      const dx = clampedX - bounds.minX
      const dy = clampedY - bounds.minY
      for (const m of group) {
        m.x += dx
        m.y += dy
      }
      o.collapsed = floor.objects.some(other => other.id !== o.id && aabbOverlap(o, other))
      return
    }
    const rect = clamp({ x, y, w: o.w, h: o.h })
    o.x = rect.x
    o.y = rect.y
    o.collapsed = floor.objects.some(other => other.id !== o.id && aabbOverlap(o, other))
  }
}

function commitMove() {
  const floor = currentFloor.value
  if (!floor) return

  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    const ids = state.multiSelection.ids
    const objs = floor.objects.filter(o => ids.includes(o.id) && !o.locked)
    if (objs.length > 0) {
      const bounds = groupBoundsOf(objs)
      const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
      const dx = clamped.x - bounds.minX
      const dy = clamped.y - bounds.minY
      for (const o of objs) {
        o.x += dx
        o.y += dy
      }
    }
    recalcCollapsed(floor)
    scheduleSave()
    return
  }

  if (!state.selection) return
  if (state.selection.type === 'room') {
    const r = selectedRoom()
    if (r) {
      const rect = clamp({ x: snap(r.x), y: snap(r.y), w: r.w, h: r.h })
      if (!roomOverlapsAny(rect, r.id)) {
        r.x = rect.x
        r.y = rect.y
      }
    }
  } else {
    const o = selectedObject()
    if (o && !o.locked) {
      const linked = getLinkedObjects(o)
      if (linked.length > 0) {
        const group = [o, ...linked]
        const groupIds = group.map(m => m.id)
        const oldPositions = group.map(m => ({ id: m.id, x: m.x, y: m.y }))
        const bounds = groupBoundsOf(group)
        const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
        const dx = clamped.x - bounds.minX
        const dy = clamped.y - bounds.minY
        for (const m of group) {
          m.x += dx
          m.y += dy
        }
        const hasOverlap = group.some(m => objectOverlapsAny(m, groupIds))
        if (hasOverlap) {
          for (const op of oldPositions) {
            const mo = floor.objects.find(fo => fo.id === op.id)
            if (mo) { mo.x = op.x; mo.y = op.y }
          }
        }
      } else {
        const rect = clamp({ x: snap(o.x), y: snap(o.y), w: o.w, h: o.h })
        if (!objectOverlapsAny(rect, o.id)) {
          o.x = rect.x
          o.y = rect.y
        }
      }
    }
  }
  recalcCollapsed(floor)
  scheduleSave()
}


function eraseWallTile(roomId: string, clickX: number, clickY: number) {
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
    // Room too small to trim further — delete it
    floor.rooms = floor.rooms.filter(r => r.id !== roomId)
  }
  recalcCollapsed(floor)
  scheduleSave()
}

function rotateSelected() {
  if (state.selection?.type !== 'object') return
  const o = selectedObject()
  if (!o) return
  if (o.locked) {
    toast.warning('Cannot rotate a locked object — unlock first')
    return
  }
  const asset = findAssetCached(assetMap(), o.type)
  if (asset?.parts && asset.parts.length > 0) {
    toast.warning('Cannot rotate a merged object — ungroup first')
    return
  }
  const rect = clamp({ x: o.x, y: o.y, w: o.h, h: o.w })
  if (objectOverlapsAny(rect, o.id)) {
    toast.warning('Cannot rotate — would overlap another object')
    return
  }
  pushHistory()
  const nw = o.h
  const nh = o.w
  o.w = nw
  o.h = nh
  o.rotation = ((o.rotation + 90) % 360) as Rotation
  o.x = rect.x
  o.y = rect.y
  const cf = currentFloor.value
  if (cf) recalcCollapsed(cf)
  scheduleSave()
}

function updateRoomProps(patch: Partial<RoomData>): boolean {
  const r = selectedRoom()
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
  pushHistory()
  if (patch.x !== undefined) r.x = rect.x
  if (patch.y !== undefined) r.y = rect.y
  if (patch.w !== undefined) r.w = rect.w
  if (patch.h !== undefined) r.h = rect.h
  if (patch.label !== undefined) r.label = patch.label || ''
  if (patch.cat !== undefined) r.cat = patch.cat
  if (patch.radius !== undefined) r.radius = patch.radius
  if (patch.locked !== undefined) r.locked = patch.locked
  scheduleSave()
  return true
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function isValidColor(c: string | undefined): boolean {
  return !c || (typeof c === 'string' && HEX_COLOR_RE.test(c))
}

function updateObjectProps(patch: Partial<ObjectData>): boolean {
  const o = selectedObject()
  if (!o) return false
  if (o.locked && patch.locked === undefined) {
    toast.warning('Object is locked — unlock to edit properties')
    return false
  }
  if (patch.fillColor !== undefined && !isValidColor(patch.fillColor)) {
    toast.warning('Invalid fill color')
    return false
  }
  const needsSize = patch.x !== undefined || patch.y !== undefined
  const sz = assetSizeFor(o.type, o.rotation)
  const w = sz?.w ?? o.w
  const h = sz?.h ?? o.h
  const rect = clamp({
    x: patch.x ?? o.x, y: patch.y ?? o.y,
    w, h,
  })
  if (needsSize && objectOverlapsAny(rect, o.id)) {
    return false
  }
  pushHistory()
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
  const cf = currentFloor.value
  if (cf) recalcCollapsed(cf)
  scheduleSave()
  return true
}

function setMode(mode: EditorMode) {
  state.mode = mode
  state.selection = null
  state.multiSelection = null
}

function resizeCanvas(width: number, height: number, tileSize: number) {
  const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
  const w = Math.max(t, Math.round(width / t) * t)
  const h = Math.max(t, Math.round(height / t) * t)
  pushHistory()
  state.layout.canvas = { width: w, height: h, tileSize: t }
  invalidateAssetMap()
  for (const asset of state.layout.customAssets) {
    if (asset.linkedParts && asset.linkedParts.length > 0) {
      for (const p of asset.linkedParts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
    if (asset.parts && asset.parts.length > 0) {
      for (const p of asset.parts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
  }
  for (const floor of state.layout.floors) {
    for (const r of floor.rooms) {
      const snapped = clamp({ x: Math.round(r.x / t) * t, y: Math.round(r.y / t) * t, w: Math.round(r.w / t) * t || t, h: Math.round(r.h / t) * t || t })
      Object.assign(r, snapped)
    }
    for (const o of floor.objects) {
      normalizeObject(o)
      const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
      o.x = snapped.x
      o.y = snapped.y
    }
  }
  scheduleSave()
}

function addCustomAsset(name: string, w: number, h: number, shape: AssetDef['shape'], category?: string, pxW?: number, pxH?: number, defaultRx?: { tl: number; tr: number; br: number; bl: number }) {
  const safeW = Math.max(1, Math.floor(w))
  const safeH = Math.max(1, Math.floor(h))
  const safeCat = (category && category.trim()) || 'Custom'
  const asset: AssetDef = { id: genId('custom'), name, category: safeCat, w: safeW, h: safeH, shape, custom: true }
  if (pxW !== undefined && pxW > 0) asset.pxW = Math.floor(pxW)
  if (pxH !== undefined && pxH > 0) asset.pxH = Math.floor(pxH)
  if (defaultRx && (defaultRx.tl > 0 || defaultRx.tr > 0 || defaultRx.br > 0 || defaultRx.bl > 0)) asset.defaultRx = defaultRx
  pushHistory()
  state.layout.customAssets.push(asset)
  invalidateAssetMap()
  scheduleSave()
  return asset
}

function updateCustomAsset(id: string, patch: Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'shape' | 'category' | 'pxW' | 'pxH' | 'defaultPadding' | 'defaultRx'>>) {
  let asset = state.layout.customAssets.find(a => a.id === id)
  if (!asset) {
    const builtin = BUILTIN_ASSETS.find(a => a.id === id)
    if (!builtin) return
    asset = { ...builtin, custom: true }
    state.layout.customAssets.push(asset)
  }
  pushHistory()
  if (patch.name !== undefined) asset.name = patch.name
  if (patch.w !== undefined) asset.w = Math.max(1, Math.floor(patch.w))
  if (patch.h !== undefined) asset.h = Math.max(1, Math.floor(patch.h))
  if (patch.shape !== undefined) asset.shape = patch.shape
  if (patch.category !== undefined) asset.category = patch.category
  if (patch.pxW !== undefined) asset.pxW = patch.pxW > 0 ? Math.floor(patch.pxW) : undefined
  if (patch.pxH !== undefined) asset.pxH = patch.pxH > 0 ? Math.floor(patch.pxH) : undefined
  if (patch.defaultPadding !== undefined) asset.defaultPadding = patch.defaultPadding > 0 ? patch.defaultPadding : undefined
  if (patch.defaultRx !== undefined) {
    const r = patch.defaultRx
    asset.defaultRx = (r.tl > 0 || r.tr > 0 || r.br > 0 || r.bl > 0) ? r : undefined
  }

  const t = state.layout.canvas.tileSize
  const newW = asset.pxW ?? asset.w * t
  const newH = asset.pxH ?? asset.h * t
  const collapsedIds: string[] = []

  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.type !== id) continue
      obj.w = newW
      obj.h = newH
      const clamped = clamp({ x: obj.x, y: obj.y, w: newW, h: newH })
      obj.x = clamped.x
      obj.y = clamped.y
      if (asset.defaultPadding && asset.defaultPadding > 0) {
        obj.padding = asset.defaultPadding
      } else if (obj.padding !== undefined && patch.defaultPadding !== undefined) {
        obj.padding = undefined
      }
      if (patch.defaultRx !== undefined) {
        obj.rx = asset.defaultRx ? { ...asset.defaultRx } : undefined
      }
      const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
      obj.collapsed = overlaps
      if (overlaps) collapsedIds.push(obj.id)
    }
  }

  if (collapsedIds.length > 0) {
    toast.error(`${collapsedIds.length} object(s) collapsed due to overlap — shown in red`)
  }

  invalidateAssetMap()
  scheduleSave()
}

function deleteCustomAsset(id: string) {
  let removedCount = 0
  for (const floor of state.layout.floors) {
    removedCount += floor.objects.filter(o => o.type === id).length
  }
  pushHistory()
  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== id)
  invalidateAssetMap()
  for (const floor of state.layout.floors) {
    floor.objects = floor.objects.filter(o => o.type !== id)
  }
  if (state.selectedAssetId === id) state.selectedAssetId = null
  if (removedCount > 0) {
    toast.info(`Removed ${removedCount} object(s) using this asset`)
  }
  scheduleSave()
}

function deleteAsset(id: string) {
  let removedCount = 0
  for (const floor of state.layout.floors) {
    removedCount += floor.objects.filter(o => o.type === id).length
  }
  pushHistory()
  const isBuiltin = BUILTIN_ASSETS.some(a => a.id === id)
  if (isBuiltin) {
    if (!state.layout.hiddenBuiltinIds.includes(id)) {
      state.layout.hiddenBuiltinIds.push(id)
    }
  } else {
    state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== id)
  }
  invalidateAssetMap()
  for (const floor of state.layout.floors) {
    floor.objects = floor.objects.filter(o => o.type !== id)
  }
  if (state.selectedAssetId === id) state.selectedAssetId = null
  if (removedCount > 0) {
    toast.info(`Removed ${removedCount} object(s) using this asset`)
  }
  scheduleSave()
}

/* ---------- Room Category CRUD ---------- */
function addRoomCategory(label: string, color: string): RoomCategoryDef | null {
  const trimmed = label.trim()
  if (!trimmed) {
    toast.warning('Category name cannot be empty')
    return null
  }
  const id = trimmed.toLowerCase().replace(/\s+/g, '-')
  if (state.layout.roomCategories.some(c => c.id === id)) {
    toast.warning('Category already exists')
    return null
  }
  pushHistory()
  const def: RoomCategoryDef = { id, label: trimmed, color }
  state.layout.roomCategories.push(def)
  scheduleSave()
  return def
}

function updateRoomCategory(id: string, patch: Partial<Pick<RoomCategoryDef, 'label' | 'color'>>) {
  const cat = state.layout.roomCategories.find(c => c.id === id)
  if (!cat) return
  pushHistory()
  if (patch.label !== undefined) cat.label = patch.label
  if (patch.color !== undefined) cat.color = patch.color
  scheduleSave()
}

function deleteRoomCategory(id: string) {
  const cat = state.layout.roomCategories.find(c => c.id === id)
  if (!cat) return
  if (cat.builtin) {
    toast.warning('Cannot delete a built-in category')
    return
  }
  const inUse = state.layout.floors.some(f => f.rooms.some(r => r.cat === id))
  if (inUse) {
    toast.warning('Cannot delete — rooms are using this category')
    return
  }
  pushHistory()
  state.layout.roomCategories = state.layout.roomCategories.filter(c => c.id !== id)
  scheduleSave()
}

/* ---------- Asset Category CRUD ---------- */
function addAssetCategory(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    toast.warning('Category name cannot be empty')
    return null
  }
  if (state.layout.assetCategories.includes(trimmed)) {
    toast.warning('Category already exists')
    return null
  }
  pushHistory()
  state.layout.assetCategories.push(trimmed)
  scheduleSave()
  return trimmed
}

function renameAssetCategory(oldName: string, newName: string) {
  const trimmed = newName.trim()
  if (!trimmed) return
  if (state.layout.assetCategories.includes(trimmed)) {
    toast.warning('Category already exists')
    return
  }
  pushHistory()
  const idx = state.layout.assetCategories.indexOf(oldName)
  if (idx >= 0) state.layout.assetCategories[idx] = trimmed
  for (const a of state.layout.customAssets) {
    if (a.category === oldName) a.category = trimmed
  }
  invalidateAssetMap()
  scheduleSave()
}

function deleteAssetCategory(name: string) {
  const inUse = state.layout.customAssets.some(a => a.category === name)
  if (inUse) {
    toast.warning('Cannot delete — assets are using this category')
    return
  }
  pushHistory()
  state.layout.assetCategories = state.layout.assetCategories.filter(c => c !== name)
  scheduleSave()
}

/* ---------- Merge / Ungroup ---------- */
function rotatedCorners(obj: ObjectData): [number, number][] {
  const cx = obj.x + obj.w / 2
  const cy = obj.y + obj.h / 2
  const rad = (obj.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = obj.w / 2
  const hh = obj.h / 2
  const corners: [number, number][] = [
    [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
  ]
  return corners.map(([dx, dy]) => [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos,
  ])
}

function buildCompositeParts(objs: ObjectData[]): { parts: CompositePart[]; minX: number; minY: number; totalW: number; totalH: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const obj of objs) {
    for (const [x, y] of rotatedCorners(obj)) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  minX = snap(Math.round(minX))
  minY = snap(Math.round(minY))
  maxX = snap(Math.round(maxX))
  maxY = snap(Math.round(maxY))

  const totalW = maxX - minX
  const totalH = maxY - minY
  const am = assetMap()

  const parts: CompositePart[] = objs.map(obj => {
    const a = findAssetCached(am, obj.type)
    const cx = obj.x + obj.w / 2
    const cy = obj.y + obj.h / 2
    return {
      dx: snap(Math.round(cx - minX - obj.w / 2)),
      dy: snap(Math.round(cy - minY - obj.h / 2)),
      w: snap(Math.round(obj.w)),
      h: snap(Math.round(obj.h)),
      shape: a?.shape ?? 'rect',
      rotation: obj.rotation,
      type: obj.type,
    }
  })

  return { parts, minX, minY, totalW, totalH }
}

function mergeObjects(ids: string[]): string | null {
  const floor = currentFloor.value
  if (!floor || ids.length < 2) return null

  const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
  if (objs.length < 2) return null
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot merge locked objects — unlock first')
    return null
  }

  const { parts, minX, minY, totalW, totalH } = buildCompositeParts(objs)
  const t = state.layout.canvas.tileSize

  const assetId = genId('merged')
  const assetDef: AssetDef = {
    id: assetId,
    name: `Merged ${objs.length}`,
    category: 'Merged',
    w: Math.round(totalW / t),
    h: Math.round(totalH / t),
    shape: 'rect',
    custom: true,
    parts,
  }

  pushHistory()
  state.layout.customAssets.push(assetDef)
  invalidateAssetMap()
  if (!state.layout.assetCategories.includes('Merged')) {
    state.layout.assetCategories.push('Merged')
  }

  floor.objects = floor.objects.filter(o => !ids.includes(o.id))

  const newObj: ObjectData = {
    id: genId('o'),
    type: assetId,
    x: minX,
    y: minY,
    w: totalW,
    h: totalH,
    rotation: 0,
  }

  const overlaps = floor.objects.some(o => aabbOverlap(newObj, o))
  newObj.collapsed = overlaps

  floor.objects.push(newObj)

  state.selection = { type: 'object', id: newObj.id }
  state.multiSelection = null

  scheduleSave()
  toast.success(`Merged ${objs.length} objects into 1`)
  return newObj.id
}

function createCompositeAssetFromSelection(name?: string, category?: string): string | null {
  const floor = currentFloor.value
  if (!floor) return null
  const ids = state.multiSelection?.ids
  if (!ids || ids.length < 2) {
    toast.warning('Select at least 2 objects first (Shift+click)')
    return null
  }

  const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
  if (objs.length < 2) return null
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot merge locked objects — unlock first')
    return null
  }

  const { parts, totalW, totalH } = buildCompositeParts(objs)
  const t = state.layout.canvas.tileSize

  const safeName = (name && name.trim()) || `Composite ${objs.length}`
  const safeCat = (category && category.trim()) || 'Composite'
  const assetId = genId('composite')
  const assetDef: AssetDef = {
    id: assetId,
    name: safeName,
    category: safeCat,
    w: Math.round(totalW / t),
    h: Math.round(totalH / t),
    shape: 'rect',
    custom: true,
    parts,
  }

  pushHistory()
  state.layout.customAssets.push(assetDef)
  invalidateAssetMap()
  if (!state.layout.assetCategories.includes(safeCat)) {
    state.layout.assetCategories.push(safeCat)
  }

  scheduleSave()
  toast.success(`Created "${safeName}" composite asset — find it in the ${safeCat} category`)
  return assetId
}

function createLinkedAssetFromSelection(name?: string, category?: string): string | null {
  const floor = currentFloor.value
  if (!floor) return null
  const ids = state.multiSelection?.ids
  if (!ids || ids.length < 2) {
    toast.warning('Select at least 2 objects first (Shift+click)')
    return null
  }

  const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
  if (objs.length < 2) return null
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot link locked objects — unlock first')
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

  const linkedParts: LinkedPart[] = objs.map(obj => ({
    type: obj.type,
    dx: snap(Math.round(obj.x - minX)),
    dy: snap(Math.round(obj.y - minY)),
    w: snap(Math.round(obj.w)),
    h: snap(Math.round(obj.h)),
    rotation: obj.rotation,
  }))

  const safeName = (name && name.trim()) || `Linked Set ${objs.length}`
  const safeCat = (category && category.trim()) || 'Linked Sets'
  const assetId = genId('linked')
  const assetDef: AssetDef = {
    id: assetId,
    name: safeName,
    category: safeCat,
    w: Math.round(totalW / t),
    h: Math.round(totalH / t),
    shape: 'rect',
    custom: true,
    linkedParts,
  }

  pushHistory()
  state.layout.customAssets.push(assetDef)
  invalidateAssetMap()
  if (!state.layout.assetCategories.includes(safeCat)) {
    state.layout.assetCategories.push(safeCat)
  }

  scheduleSave()
  toast.success(`Created "${safeName}" linked asset — find it in the ${safeCat} category`)
  return assetId
}

function ungroupObject(id: string): string[] | null {
  const floor = currentFloor.value
  if (!floor) return null

  const obj = floor.objects.find(o => o.id === id)
  if (!obj) return null
  if (obj.locked) {
    toast.warning('Cannot ungroup a locked object — unlock first')
    return null
  }

  const asset = findAssetCached(assetMap(), obj.type)
  if (!asset?.parts || asset.parts.length === 0) {
    toast.warning('This object is not a merged group')
    return null
  }

  pushHistory()

  const newIds: string[] = []
  for (const part of asset.parts) {
    const t = state.layout.canvas.tileSize
    const partW = Math.round(part.w / t)
    const partH = Math.round(part.h / t)
    let typeId: string
    if (part.type && (BUILTIN_ASSETS.some(a => a.id === part.type) || state.layout.customAssets.some(a => a.id === part.type))) {
      typeId = part.type
    } else {
      const partAsset = BUILTIN_ASSETS.find(a => a.shape === part.shape && a.w === partW && a.h === partH)
      const customMatch = state.layout.customAssets.find(a => a.shape === part.shape && a.w === partW && a.h === partH && (!a.parts || a.parts.length === 0))
      typeId = partAsset?.id ?? customMatch?.id ?? 'unknown'
    }
    const newObj: ObjectData = {
      id: genId('o'),
      type: typeId,
      x: obj.x + part.dx,
      y: obj.y + part.dy,
      w: part.w,
      h: part.h,
      rotation: part.rotation ?? 0,
    }
    const partAssetDef = findAssetCached(assetMap(), typeId)
    if (partAssetDef?.defaultPadding !== undefined) newObj.padding = partAssetDef.defaultPadding
    if (partAssetDef?.defaultRx) newObj.rx = { ...partAssetDef.defaultRx }
    const overlaps = floor.objects.some(o => aabbOverlap(newObj, o))
    newObj.collapsed = overlaps
    floor.objects.push(newObj)
    newIds.push(newObj.id)
  }

  floor.objects = floor.objects.filter(o => o.id !== id)

  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== asset.id)
  invalidateAssetMap()

  state.multiSelection = { type: 'object', ids: newIds }
  state.selection = null

  scheduleSave()
  toast.success(`Ungrouped into ${newIds.length} objects`)
  return newIds
}

/* ---------- Linked Objects ---------- */
function getLinkedObjects(obj: ObjectData): ObjectData[] {
  const floor = currentFloor.value
  if (!floor || !obj.linkedIds || obj.linkedIds.length === 0) return []
  return floor.objects.filter(o => obj.linkedIds!.includes(o.id))
}

function linkObjects(ids: string[]): boolean {
  const floor = currentFloor.value
  if (!floor || ids.length < 2) return false
  const objs = floor.objects.filter(o => ids.includes(o.id))
  if (objs.length < 2) return false
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot link locked objects — unlock first')
    return false
  }

  pushHistory()
  // Union all pre-existing linked groups of the selected objects into one fully-connected group
  const groupIds = new Set<string>()
  for (const obj of objs) {
    groupIds.add(obj.id)
    if (obj.linkedIds) {
      for (const lid of obj.linkedIds) groupIds.add(lid)
    }
  }
  const allGroupIds = Array.from(groupIds)
  for (const id of allGroupIds) {
    const obj = floor.objects.find(o => o.id === id)
    if (!obj) continue
    obj.linkedIds = allGroupIds.filter(oid => oid !== id)
  }
  scheduleSave()
  toast.success(`Linked ${allGroupIds.length} objects`)
  return true
}

function unlinkObject(id: string): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  const obj = floor.objects.find(o => o.id === id)
  if (!obj || !obj.linkedIds || obj.linkedIds.length === 0) return false
  if (obj.locked) {
    toast.warning('Cannot unlink a locked object — unlock first')
    return false
  }

  pushHistory()
  for (const linkedId of obj.linkedIds) {
    const linked = floor.objects.find(o => o.id === linkedId)
    if (linked?.linkedIds) {
      linked.linkedIds = linked.linkedIds.filter(lid => lid !== id)
      if (linked.linkedIds.length === 0) delete linked.linkedIds
    }
  }
  delete obj.linkedIds
  scheduleSave()
  toast.success('Unlinked object')
  return true
}


function addFloor(): FloorData {
  pushHistory()
  const n = state.layout.floors.length
  const floor: FloorData = { id: genId('floor'), name: `New Floor`, label: `F${n}`, rooms: [], objects: [], zones: [] }
  state.layout.floors.push(floor)
  scheduleSave()
  return floor
}

function deleteFloor(id: string) {
  if (state.layout.floors.length <= 1) return
  pushHistory()
  state.layout.floors = state.layout.floors.filter(f => f.id !== id)
  if (state.currentFloorId === id) {
    state.currentFloorId = state.layout.floors[0].id
  }
  state.selection = null
  state.multiSelection = null
  scheduleSave()
}

function duplicateFloor(id: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  const copy: FloorData = JSON.parse(JSON.stringify(floor))
  copy.id = genId('floor')
  copy.name = `${floor.name} Copy`
  copy.rooms.forEach(r => (r.id = genId('r')))
  if (copy.zones) {
    copy.zones.forEach(z => (z.id = genId('zone')))
  }
  const idMap = new Map<string, string>()
  for (const o of copy.objects) {
    const newId = genId('o')
    idMap.set(o.id, newId)
    o.id = newId
  }
  for (const o of copy.objects) {
    if (o.linkedIds) {
      o.linkedIds = o.linkedIds.map(lid => idMap.get(lid) ?? lid).filter(lid => idMap.has(lid))
      if (o.linkedIds.length === 0) delete o.linkedIds
    }
  }
  const idx = state.layout.floors.findIndex(f => f.id === id)
  state.layout.floors.splice(idx + 1, 0, copy)
  scheduleSave()
}

function renameFloor(id: string, name: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  floor.name = name
  scheduleSave()
}

function reorderFloors(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  if (fromIndex < 0 || toIndex < 0) return
  if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return
  pushHistory()
  const floors = state.layout.floors
  const [moved] = floors.splice(fromIndex, 1)
  floors.splice(toIndex, 0, moved)
  scheduleSave()
}

function clearFloor(id: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  floor.rooms = []
  floor.objects = []
  floor.zones = []
  state.selection = null
  state.multiSelection = null
  flushSave()
}

function clearAllFloors() {
  pushHistory()
  for (const floor of state.layout.floors) {
    floor.rooms = []
    floor.objects = []
    floor.zones = []
  }
  state.selection = null
  state.multiSelection = null
  flushSave()
}

function selectFloor(id: string) {
  state.currentFloorId = id
  state.selection = null
  state.multiSelection = null
}

async function exportToTS() {
  const data = state.layout
  const ts = `// Auto-generated by Blueprint Editor — ${new Date().toISOString()}
import type { LayoutData } from './editor-types'

export const SAVED_LAYOUT: LayoutData = ${JSON.stringify(data, null, 2)}
`
  try {
    const res = await fetch('/__save-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: ts,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    toast.success('saved-layout.ts written to src/blueprint/saved-layout.ts')
  } catch (e) {
    editorLog.error('exportToTS', e)
    toast.error('Failed to save — falling back to download')
    const blob = new Blob([ts], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'saved-layout.ts'
    a.click()
    URL.revokeObjectURL(url)
  }
}

const SYNC_KEY = 'blueprint-synced-layout'

function editorFloorLabelToFloorId(label: string): string | null {
  if (label === 'G') return 'G'
  const match = label.match(/^F(\d+)$/)
  if (match) {
    return match[1]
  }
  return null
}

function syncToGame(): boolean {
  try {
    const synced: Record<string, Array<{ id: string; x: number; y: number; w: number; h: number; label: string; sub: string; radius: number }>> = {}
    for (const floor of state.layout.floors) {
      const floorId = editorFloorLabelToFloorId(floor.label)
      if (!floorId) continue
      synced[floorId] = floor.rooms.map(r => ({
        id: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        label: r.label,
        sub: '',
        radius: r.radius ?? 0,
      }))
    }
    localStorage.setItem(SYNC_KEY, JSON.stringify({ version: 1, floors: synced, timestamp: Date.now() }))
    return true
  } catch (e) {
    editorLog.error('syncToGame', e)
    toast.error('Sync failed — storage error')
    return false
  }
}

function runAutoFix(floor: FloorData): AutoFixResult {
  const result = autoFixFloor(
    floor.label, floor.rooms, floor.objects,
    state.layout.canvas.width, state.layout.canvas.height,
  )
  if (result.fixed > 0) {
    recalcCollapsed(floor)
    if (result.remaining > 0) {
      toast.warning(`Auto-fixed ${result.fixed} issue(s), ${result.remaining} remaining on ${floor.name}`)
    } else {
      toast.success(`Auto-fixed ${result.fixed} issue(s) on ${floor.name} — all rules pass`)
    }
  } else if (result.remaining > 0) {
    toast.warning(`${floor.name}: ${result.remaining} unfixable violation(s) remain`)
  }
  return result
}

/* ---------- Zone Marks ---------- */
function addZone(x: number, y: number, w: number, h: number, label?: string, color?: string): ZoneData | null {
  const floor = currentFloor.value
  if (!floor) return null
  pushHistory()
  const rect = clamp({ x: snap(x), y: snap(y), w: snap(w), h: snap(h) })
  const zone: ZoneData = { id: genId('zone'), x: rect.x, y: rect.y, w: rect.w, h: rect.h, label: label || 'New Zone', color: color || '#06b6d4' }
  if (!floor.zones) floor.zones = []
  floor.zones.push(zone)
  scheduleSave()
  return zone
}

function updateZone(id: string, patch: Partial<ZoneData>) {
  const floor = currentFloor.value
  if (!floor?.zones) return
  const z = floor.zones.find(z => z.id === id)
  if (!z) return
  pushHistory()
  if (patch.x !== undefined) z.x = clamp({ x: snap(patch.x), y: z.y, w: z.w, h: z.h }).x
  if (patch.y !== undefined) z.y = clamp({ x: z.x, y: snap(patch.y), w: z.w, h: z.h }).y
  if (patch.w !== undefined) z.w = clamp({ x: z.x, y: z.y, w: snap(patch.w), h: z.h }).w
  if (patch.h !== undefined) z.h = clamp({ x: z.x, y: z.y, w: z.w, h: snap(patch.h) }).h
  if (patch.label !== undefined) z.label = patch.label
  if (patch.color !== undefined) z.color = patch.color
  scheduleSave()
}

function deleteZone(id: string) {
  const floor = currentFloor.value
  if (!floor?.zones) return
  pushHistory()
  floor.zones = floor.zones.filter(z => z.id !== id)
  if (floor.zones.length === 0) delete floor.zones
  scheduleSave()
}

/* ---------- Copy / Paste ---------- */
let clipboard: ObjectData[] | null = null

function copySelected() {
  const floor = currentFloor.value
  if (!floor) return
  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    clipboard = floor.objects
      .filter(o => state.multiSelection!.ids.includes(o.id))
      .map(o => ({ ...o }))
    toast.info(`Copied ${clipboard.length} object(s)`)
  } else if (state.selection?.type === 'object') {
    const o = floor.objects.find(o => o.id === state.selection!.id)
    if (o) {
      clipboard = [{ ...o }]
      toast.info('Copied 1 object')
    }
  }
}

function pasteObjects() {
  const floor = currentFloor.value
  if (!floor || !clipboard || clipboard.length === 0) return
  const tileSize = state.layout.canvas.tileSize
  const offset = tileSize
  const newIds: string[] = []
  const idMap = new Map<string, string>()
  const pendingCopies: ObjectData[] = []
  for (const c of clipboard) {
    const newId = genId('o')
    idMap.set(c.id, newId)
    const rawX = c.x + offset
    const rawY = c.y + offset
    const rect = clamp({ x: snap(rawX), y: snap(rawY), w: c.w, h: c.h })
    if (objectOverlapsAny(rect)) {
      toast.warning(`Skipped pasting "${c.type}" — would overlap existing object`)
      continue
    }
    newIds.push(newId)
    const { locked, collapsed, linkedIds, ...rest } = c
    const copy: ObjectData = {
      ...rest,
      id: newId,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
    }
    pendingCopies.push(copy)
  }
  if (pendingCopies.length === 0) {
    toast.warning('Paste failed — all objects would overlap')
    return
  }
  pushHistory()
  for (const copy of pendingCopies) {
    floor.objects.push(copy)
  }
  for (const c of clipboard) {
    if (!c.linkedIds || c.linkedIds.length === 0) continue
    const newId = idMap.get(c.id)
    if (!newId || !newIds.includes(newId)) continue
    const remapped = c.linkedIds
      .map(lid => idMap.get(lid))
      .filter((lid): lid is string => lid !== undefined && newIds.includes(lid))
    if (remapped.length > 0) {
      const obj = floor.objects.find(o => o.id === newId)
      if (obj) obj.linkedIds = remapped
    }
  }
  if (newIds.length > 1) {
    state.multiSelection = { type: 'object', ids: newIds }
    state.selection = null
  } else {
    state.selection = { type: 'object', id: newIds[0] }
    state.multiSelection = null
  }
  recalcCollapsed(floor)
  scheduleSave()
  toast.success(`Pasted ${newIds.length} object(s)`)
}

/* ---------- Toggle Object Lock ---------- */
function toggleObjectLock(id: string) {
  const floor = currentFloor.value
  if (!floor) return
  const o = floor.objects.find(o => o.id === id)
  if (!o) return
  pushHistory()
  o.locked = !o.locked
  scheduleSave()
  toast.info(o.locked ? 'Object locked' : 'Object unlocked')
}

export function useEditorStore() {
  return {
    state,
    currentFloor,
    snap,
    selectedRoom,
    selectedObject,
    addRoom,
    addObject,
    canPlaceObject,
    canPlaceRoom,
    select,
    selectAsset,
    selectedAsset,
    deleteSelected,
    pushHistory,
    commitMove,
    moveSelectedTo,
    eraseWallTile,
    rotateSelected,
    updateRoomProps,
    updateObjectProps,
    setMode,
    resizeCanvas,
    addCustomAsset,
    updateCustomAsset,
    deleteCustomAsset,
    deleteAsset,
    addRoomCategory,
    updateRoomCategory,
    deleteRoomCategory,
    addAssetCategory,
    renameAssetCategory,
    deleteAssetCategory,
    toggleMultiSelect,
    mergeObjects,
    createCompositeAssetFromSelection,
    createLinkedAssetFromSelection,
    ungroupObject,
    linkObjects,
    unlinkObject,
    getLinkedObjects,
    addFloor,
    deleteFloor,
    duplicateFloor,
    renameFloor,
    reorderFloors,
    clearFloor,
    clearAllFloors,
    selectFloor,
    exportToTS,
    syncToGame,
    flushSave,
    undo,
    redo,
    canUndo: computed(() => undoStack.value.length > 0),
    canRedo: computed(() => redoStack.value.length > 0),
    runAutoFix,
    addZone,
    updateZone,
    deleteZone,
    copySelected,
    pasteObjects,
    toggleObjectLock,
  }
}
