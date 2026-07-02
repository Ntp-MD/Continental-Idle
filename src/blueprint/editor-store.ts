import { reactive, computed } from 'vue'
import type {
  LayoutData, FloorData, RoomData, ObjectData, AssetDef,
  EditorMode, Selection, Rect, RoomCategory, Rotation,
} from './editor-types'
import { aabbOverlap } from './editor-types'
import { findAsset } from './editor-assets'
import { useToast } from '@/composables/useToast'

const LAYOUT_VERSION = 1
const STORAGE_KEY = 'blueprint-editor-layout'
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

function makeDefaultFloors(): FloorData[] {
  return DEFAULT_FLOOR_NAMES.map(f => ({
    id: `floor-${f.id}`,
    name: f.name,
    label: f.id === 'G' ? 'G' : f.id,
    rooms: [],
    objects: [],
  }))
}

function makeDefaultLayout(): LayoutData {
  return {
    version: LAYOUT_VERSION,
    canvas: { width: 2000, height: 800, tileSize: 25 },
    customAssets: [],
    floors: makeDefaultFloors(),
  }
}

let idCounter = 1
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`
}

function migrate(data: unknown): LayoutData {
  if (!data || typeof data !== 'object') return makeDefaultLayout()
  const d = data as Record<string, unknown>
  const canvas = d.canvas
  const validCanvas = canvas && typeof canvas === 'object'
    && typeof (canvas as Record<string, unknown>).tileSize === 'number'
    && (canvas as Record<string, unknown>).tileSize as number > 0
  const migrated: LayoutData = {
    version: LAYOUT_VERSION,
    canvas: validCanvas
      ? {
          width: typeof (canvas as Record<string, unknown>).width === 'number' ? (canvas as Record<string, unknown>).width as number : 2000,
          height: typeof (canvas as Record<string, unknown>).height === 'number' ? (canvas as Record<string, unknown>).height as number : 800,
          tileSize: (canvas as Record<string, unknown>).tileSize as number,
        }
      : { width: 2000, height: 800, tileSize: 25 },
    customAssets: Array.isArray(d.customAssets)
      ? d.customAssets.filter(
          (a: any) => typeof a?.id === 'string' && typeof a?.name === 'string'
            && typeof a?.w === 'number' && a.w > 0
            && typeof a?.h === 'number' && a.h > 0
        ).map((a: any) => {
          const asset: AssetDef = {
            id: a.id,
            name: a.name,
            category: typeof a.category === 'string' ? a.category : 'Custom',
            w: a.w,
            h: a.h,
            shape: ['rect', 'circle', 'round'].includes(a.shape) ? a.shape : 'rect',
            custom: true,
          }
          if (typeof a.pxW === 'number' && a.pxW > 0) asset.pxW = Math.floor(a.pxW)
          if (typeof a.pxH === 'number' && a.pxH > 0) asset.pxH = Math.floor(a.pxH)
          return asset
        })
      : [],
    floors: Array.isArray(d.floors) && d.floors.length > 0
      ? d.floors.map((f: any) => ({
          id: typeof f?.id === 'string' ? f.id : genId('floor'),
          name: typeof f?.name === 'string' ? f.name : 'Unnamed',
          label: typeof f?.label === 'string' ? f.label : 'F?',
          rooms: Array.isArray(f?.rooms) ? f.rooms.filter(
            (r: any) => typeof r?.x === 'number' && typeof r?.y === 'number'
              && typeof r?.w === 'number' && typeof r?.h === 'number'
          ).map((r: any) => {
            const room: RoomData = {
              id: typeof r?.id === 'string' ? r.id : genId('r'),
              x: r.x, y: r.y, w: r.w, h: r.h,
              cat: ['public', 'service', 'back', 'security', 'utility', 'open'].includes(r?.cat) ? r.cat : 'public',
              label: typeof r?.label === 'string' ? r.label : '',
            }
            if (typeof r?.radius === 'number' && r.radius >= 0) room.radius = r.radius
            return room
          }) : [],
          objects: Array.isArray(f?.objects) ? f.objects.filter(
            (o: any) => typeof o?.x === 'number' && typeof o?.y === 'number'
              && typeof o?.w === 'number' && typeof o?.h === 'number'
          ).map((o: any) => {
            const obj: ObjectData = {
              id: typeof o?.id === 'string' ? o.id : genId('o'),
              type: typeof o?.type === 'string' ? o.type : 'unknown',
              x: o.x, y: o.y, w: o.w, h: o.h,
              rotation: [0, 90].includes(o?.rotation) ? o.rotation : 0,
            }
            if (typeof o?.radius === 'number' && o.radius >= 0) obj.radius = o.radius
            if (typeof o?.labelPadding === 'number') obj.labelPadding = o.labelPadding
            if (typeof o?.padding === 'number' && o.padding >= 0) obj.padding = o.padding
            return obj
          }) : [],
        }))
      : makeDefaultFloors(),
  }
  return migrated
}

function loadInitial(): LayoutData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch (e) {
    console.error('Failed to load blueprint layout from localStorage', e)
  }
  return makeDefaultLayout()
}

interface EditorState {
  layout: LayoutData
  currentFloorId: string
  mode: EditorMode
  selection: Selection
  selectedAssetId: string | null
  wallCategory: RoomCategory
}

const state = reactive<EditorState>({
  layout: loadInitial(),
  currentFloorId: '',
  mode: 'object',
  selection: null,
  selectedAssetId: null,
  wallCategory: 'public',
})

state.currentFloorId = state.layout.floors[0]?.id ?? ''

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
}

const selectedAsset = computed(() =>
  state.selectedAssetId ? findAsset(state.layout.customAssets, state.selectedAssetId) ?? null : null
)

const undoStack: string[] = []
const redoStack: string[] = []
let saveTimer: number | null = null

function snapshot(): string {
  return JSON.stringify(state.layout)
}

function restore(json: string) {
  try {
    state.layout = migrate(JSON.parse(json))
  } catch (e) {
    console.error('Failed to restore history snapshot', e)
    return
  }
  if (!state.layout.floors.find(f => f.id === state.currentFloorId)) {
    state.currentFloorId = state.layout.floors[0]?.id ?? ''
  }
  state.selection = null
}

function pushHistory() {
  undoStack.push(snapshot())
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift()
  redoStack.length = 0
}

function undo() {
  if (undoStack.length === 0) return
  redoStack.push(snapshot())
  const prev = undoStack.pop()!
  restore(prev)
}

function redo() {
  if (redoStack.length === 0) return
  undoStack.push(snapshot())
  const next = redoStack.pop()!
  restore(next)
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
    console.error('Failed to save blueprint layout', e)
    useToast().error('Save failed — storage quota exceeded')
  }
}

const currentFloor = computed<FloorData | undefined>(() =>
  state.layout.floors.find(f => f.id === state.currentFloorId)
)

function snap(value: number): number {
  const t = state.layout.canvas.tileSize
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

function objectOverlapsAny(rect: Rect, excludeId?: string): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  return floor.objects.some(o => o.id !== excludeId && aabbOverlap(rect, o))
}

function recalcCollapsed(floor: FloorData) {
  for (const obj of floor.objects) {
    const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
    obj.collapsed = overlaps || false
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

function addRoom(rect: Rect, cat: RoomCategory, label = 'New Room'): RoomData | null {
  const floor = currentFloor.value
  if (!floor) return null
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  if (snapped.w <= 0 || snapped.h <= 0) return null
  if (roomOverlapsAny(snapped)) return null
  pushHistory()
  const room: RoomData = { id: genId('r'), ...snapped, cat, label }
  floor.rooms.push(room)
  state.selection = { type: 'room', id: room.id }
  scheduleSave()
  return room
}

function addObject(type: string, x: number, y: number): ObjectData | null {
  const floor = currentFloor.value
  const asset = findAsset(state.layout.customAssets, type)
  if (!floor || !asset) return null
  const t = state.layout.canvas.tileSize
  const w = asset.pxW ?? asset.w * t
  const h = asset.pxH ?? asset.h * t
  const rect = clamp({ x: snap(x), y: snap(y), w, h })
  if (objectOverlapsAny(rect)) return null
  pushHistory()
  const obj: ObjectData = { id: genId('o'), type, rotation: 0, ...rect }
  floor.objects.push(obj)
  state.selection = { type: 'object', id: obj.id }
  scheduleSave()
  return obj
}

function canPlaceObject(type: string, x: number, y: number): boolean {
  const asset = findAsset(state.layout.customAssets, type)
  if (!asset) return false
  const t = state.layout.canvas.tileSize
  const w = asset.pxW ?? asset.w * t
  const h = asset.pxH ?? asset.h * t
  const rect = clamp({ x: snap(x), y: snap(y), w, h })
  return !objectOverlapsAny(rect)
}

function canPlaceRoom(rect: Rect): boolean {
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  return snapped.w > 0 && snapped.h > 0 && !roomOverlapsAny(snapped)
}

function select(sel: Selection) {
  state.selection = sel
}

function deleteSelected() {
  const floor = currentFloor.value
  if (!floor || !state.selection) return
  pushHistory()
  if (state.selection.type === 'room') {
    floor.rooms = floor.rooms.filter(r => r.id !== state.selection!.id)
  } else {
    floor.objects = floor.objects.filter(o => o.id !== state.selection!.id)
  }
  state.selection = null
  recalcCollapsed(floor)
  scheduleSave()
}

function moveSelected(dx: number, dy: number, commit: boolean) {
  const floor = currentFloor.value
  if (!floor || !state.selection) return
  if (state.selection.type === 'room') {
    const r = selectedRoom()
    if (!r) return
    const rect = clamp({ x: snap(r.x + dx), y: snap(r.y + dy), w: r.w, h: r.h })
    if (roomOverlapsAny(rect, r.id)) return
    if (commit) pushHistory()
    r.x = rect.x
    r.y = rect.y
  } else {
    const o = selectedObject()
    if (!o) return
    const rect = clamp({ x: snap(o.x + dx), y: snap(o.y + dy), w: o.w, h: o.h })
    if (objectOverlapsAny(rect, o.id)) return
    if (commit) pushHistory()
    o.x = rect.x
    o.y = rect.y
  }
  recalcCollapsed(floor)
  scheduleSave()
}

function rotateSelected() {
  if (state.selection?.type !== 'object') return
  const o = selectedObject()
  if (!o) return
  const rect = clamp({ x: o.x, y: o.y, w: o.h, h: o.w })
  if (objectOverlapsAny(rect, o.id)) return
  pushHistory()
  const nw = o.h
  const nh = o.w
  o.w = nw
  o.h = nh
  o.rotation = o.rotation === 0 ? 90 : 0
  o.x = rect.x
  o.y = rect.y
  recalcCollapsed(currentFloor.value!)
  scheduleSave()
}

function updateRoomProps(patch: Partial<RoomData>): boolean {
  const r = selectedRoom()
  if (!r) return false
  const rect = clamp({
    x: patch.x ?? r.x, y: patch.y ?? r.y,
    w: patch.w ?? r.w, h: patch.h ?? r.h,
  })
  if ((patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)
    && roomOverlapsAny(rect, r.id)) {
    return false
  }
  pushHistory()
  Object.assign(r, patch, rect)
  scheduleSave()
  return true
}

function updateObjectProps(patch: Partial<ObjectData>): boolean {
  const o = selectedObject()
  if (!o) return false
  const rect = clamp({
    x: patch.x ?? o.x, y: patch.y ?? o.y,
    w: patch.w ?? o.w, h: patch.h ?? o.h,
  })
  if ((patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)
    && objectOverlapsAny(rect, o.id)) {
    return false
  }
  pushHistory()
  Object.assign(o, patch, rect)
  scheduleSave()
  return true
}

function setMode(mode: EditorMode) {
  state.mode = mode
  state.selection = null
}

function resizeCanvas(width: number, height: number, tileSize: number) {
  const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
  const w = Math.max(t, Math.round(width / t) * t)
  const h = Math.max(t, Math.round(height / t) * t)
  pushHistory()
  state.layout.canvas = { width: w, height: h, tileSize: t }
  for (const floor of state.layout.floors) {
    for (const r of floor.rooms) {
      const snapped = clamp({ x: Math.round(r.x / t) * t, y: Math.round(r.y / t) * t, w: Math.round(r.w / t) * t || t, h: Math.round(r.h / t) * t || t })
      Object.assign(r, snapped)
    }
    for (const o of floor.objects) {
      const asset = findAsset(state.layout.customAssets, o.type)
      const hasPxOverride = asset && (asset.pxW || asset.pxH)
      if (hasPxOverride) {
        const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
        Object.assign(o, snapped)
      } else {
        const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: Math.round(o.w / t) * t || t, h: Math.round(o.h / t) * t || t })
        Object.assign(o, snapped)
      }
    }
  }
  scheduleSave()
}

function addCustomAsset(name: string, w: number, h: number, shape: AssetDef['shape'], pxW?: number, pxH?: number) {
  const safeW = Math.max(1, Math.floor(w))
  const safeH = Math.max(1, Math.floor(h))
  const asset: AssetDef = { id: genId('custom'), name, category: 'Custom', w: safeW, h: safeH, shape, custom: true }
  if (pxW !== undefined && pxW > 0) asset.pxW = Math.floor(pxW)
  if (pxH !== undefined && pxH > 0) asset.pxH = Math.floor(pxH)
  pushHistory()
  state.layout.customAssets.push(asset)
  scheduleSave()
  return asset
}

function updateCustomAsset(id: string, patch: Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'shape' | 'category' | 'pxW' | 'pxH'>>) {
  const asset = state.layout.customAssets.find(a => a.id === id)
  if (!asset) return
  pushHistory()
  if (patch.name !== undefined) asset.name = patch.name
  if (patch.w !== undefined) asset.w = Math.max(1, Math.floor(patch.w))
  if (patch.h !== undefined) asset.h = Math.max(1, Math.floor(patch.h))
  if (patch.shape !== undefined) asset.shape = patch.shape
  if (patch.category !== undefined) asset.category = patch.category
  if (patch.pxW !== undefined) asset.pxW = patch.pxW > 0 ? Math.floor(patch.pxW) : undefined
  if (patch.pxH !== undefined) asset.pxH = patch.pxH > 0 ? Math.floor(patch.pxH) : undefined

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
      const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
      obj.collapsed = overlaps
      if (overlaps) collapsedIds.push(obj.id)
    }
  }

  if (collapsedIds.length > 0) {
    useToast().error(`${collapsedIds.length} object(s) collapsed due to overlap — shown in red`)
  }

  scheduleSave()
}

function deleteCustomAsset(id: string) {
  pushHistory()
  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== id)
  for (const floor of state.layout.floors) {
    floor.objects = floor.objects.filter(o => o.type !== id)
  }
  if (state.selectedAssetId === id) state.selectedAssetId = null
  scheduleSave()
}

function addFloor(): FloorData {
  pushHistory()
  const n = state.layout.floors.length
  const floor: FloorData = { id: genId('floor'), name: `New Floor`, label: `F${n}`, rooms: [], objects: [] }
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
  copy.objects.forEach(o => (o.id = genId('o')))
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
  state.selection = null
  scheduleSave()
}

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

const LOBBY_PRESET: { rooms: PresetRoom[]; objects: PresetObject[] } = {
  rooms: [
    { id: 'lobby-r-office', x: 0, y: 0, w: 200, h: 100, cat: 'back', label: 'RECEPTION OFFICE' },
    { id: 'lobby-r-reception', x: 0, y: 100, w: 200, h: 200, cat: 'service', label: 'RECEPTION' },
    { id: 'lobby-r-main', x: 200, y: 0, w: 1200, h: 450, cat: 'open', label: 'MAIN LOBBY' },
    { id: 'lobby-r-elevator', x: 1400, y: 0, w: 400, h: 450, cat: 'utility', label: 'ELEVATOR BANK' },
    { id: 'lobby-r-luggage', x: 1800, y: 0, w: 200, h: 100, cat: 'back', label: 'LUGGAGE STORAGE' },
    { id: 'lobby-r-concierge', x: 1800, y: 100, w: 200, h: 200, cat: 'service', label: 'CONCIERGE' },
    { id: 'lobby-r-lounge', x: 0, y: 300, w: 200, h: 400, cat: 'public', label: 'WAITING LOUNGE' },
    { id: 'lobby-r-restroom', x: 0, y: 700, w: 200, h: 100, cat: 'utility', label: 'RESTROOM' },
    { id: 'lobby-r-bar', x: 200, y: 450, w: 900, h: 350, cat: 'public', label: 'BAR & LOUNGE' },
    { id: 'lobby-r-terrace', x: 1100, y: 450, w: 900, h: 350, cat: 'open', label: 'LOBBY TERRACE' },
  ],
  objects: [
    // -- Doors --
    { id: 'lobby-o-door-entrance', type: 'door-lobby', x: 750, y: 0, w: 100, h: 25, rotation: 0 },
    { id: 'lobby-o-door-office-reception', type: 'door-standard', x: 100, y: 100, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-door-reception-lobby', type: 'door-standard', x: 200, y: 260, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-door-lobby-elevator', type: 'door-sliding', x: 1400, y: 200, w: 25, h: 50, rotation: 90 },
    { id: 'lobby-o-door-elevator-concierge', type: 'door-standard', x: 1800, y: 200, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-door-luggage-concierge', type: 'door-standard', x: 1900, y: 100, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-door-lounge-lobby', type: 'door-standard', x: 200, y: 350, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-door-restroom-lounge', type: 'door-standard', x: 75, y: 700, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-door-bar-lobby', type: 'door-sliding', x: 600, y: 450, w: 50, h: 25, rotation: 0 },
    { id: 'lobby-o-door-terrace-lobby', type: 'door-sliding', x: 1200, y: 450, w: 50, h: 25, rotation: 0 },
    { id: 'lobby-o-door-bar-terrace', type: 'door-sliding', x: 1100, y: 600, w: 25, h: 50, rotation: 90 },

    // -- Reception Office (back) --
    { id: 'lobby-o-desk-office', type: 'desk', x: 25, y: 25, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-chair-office', type: 'chair', x: 75, y: 25, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-filing-office', type: 'filing-cabinet', x: 150, y: 25, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-office', type: 'trash-bin', x: 150, y: 75, w: 25, h: 25, rotation: 0 },

    // -- Reception (service) --
    { id: 'lobby-o-reception-counter', type: 'reception-counter', x: 175, y: 100, w: 25, h: 150, rotation: 90 },
    { id: 'lobby-o-luggage-rack-rec', type: 'luggage-rack', x: 25, y: 120, w: 50, h: 25, rotation: 0 },
    { id: 'lobby-o-chair-rec', type: 'chair', x: 125, y: 150, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-rec', type: 'trash-bin', x: 25, y: 250, w: 25, h: 25, rotation: 0 },

    // -- Main Lobby (open) --
    { id: 'lobby-o-plant-1', type: 'plant', x: 225, y: 25, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-2', type: 'plant', x: 1350, y: 25, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-3', type: 'plant', x: 225, y: 400, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-4', type: 'plant', x: 1350, y: 400, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-5', type: 'plant', x: 700, y: 25, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-6', type: 'plant', x: 875, y: 25, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-sofa-a1', type: 'sofa', x: 300, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-a1', type: 'table-chairs', x: 350, y: 100, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-a2', type: 'sofa', x: 425, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-b1', type: 'sofa', x: 600, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b1', type: 'table-chairs', x: 650, y: 100, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-b2', type: 'sofa', x: 725, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-c1', type: 'sofa', x: 900, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-c1', type: 'table-chairs', x: 950, y: 100, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-c2', type: 'sofa', x: 1025, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-d1', type: 'sofa', x: 1200, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-d1', type: 'table-chairs', x: 1250, y: 100, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-d2', type: 'sofa', x: 1325, y: 100, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-e1', type: 'sofa', x: 300, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-e1', type: 'table-chairs', x: 350, y: 250, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-e2', type: 'sofa', x: 425, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-f1', type: 'sofa', x: 600, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-f1', type: 'table-chairs', x: 650, y: 250, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-f2', type: 'sofa', x: 725, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-g1', type: 'sofa', x: 900, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-g1', type: 'table-chairs', x: 950, y: 250, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-g2', type: 'sofa', x: 1025, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-h1', type: 'sofa', x: 1200, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-h1', type: 'table-chairs', x: 1250, y: 250, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-h2', type: 'sofa', x: 1325, y: 250, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-trash-lobby-1', type: 'trash-bin', x: 550, y: 350, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-lobby-2', type: 'trash-bin', x: 1050, y: 350, w: 25, h: 25, rotation: 0 },

    // -- Elevator Bank (utility) --
    { id: 'lobby-o-elev-1', type: 'elevator', x: 1400, y: 0, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-elev-2', type: 'elevator', x: 1750, y: 0, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-elev-3', type: 'elevator', x: 1400, y: 400, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-elev-4', type: 'elevator', x: 1750, y: 400, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-trash-elevator', type: 'trash-bin', x: 1575, y: 200, w: 25, h: 25, rotation: 0 },

    // -- Luggage Storage (back) --
    { id: 'lobby-o-storage-luggage', type: 'storage-shelf', x: 1825, y: 25, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-filing-luggage', type: 'filing-cabinet', x: 1950, y: 25, w: 25, h: 25, rotation: 0 },

    // -- Concierge (service) --
    { id: 'lobby-o-concierge-desk', type: 'concierge-desk', x: 1800, y: 150, w: 25, h: 100, rotation: 90 },
    { id: 'lobby-o-chair-conc', type: 'chair', x: 1850, y: 175, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-conc', type: 'trash-bin', x: 1950, y: 250, w: 25, h: 25, rotation: 0 },

    // -- Waiting Lounge (public) --
    { id: 'lobby-o-sofa-l1', type: 'sofa', x: 25, y: 325, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-l2', type: 'sofa', x: 150, y: 325, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-l1', type: 'table-chairs', x: 75, y: 350, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-chair-l1', type: 'chair', x: 25, y: 425, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-chair-l2', type: 'chair', x: 150, y: 425, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-sofa-l3', type: 'sofa', x: 25, y: 475, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-l4', type: 'sofa', x: 150, y: 475, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-table-l2', type: 'table-chairs', x: 75, y: 500, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-plant-l1', type: 'plant', x: 25, y: 575, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-l2', type: 'plant', x: 150, y: 575, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-sofa-l5', type: 'sofa', x: 25, y: 610, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-sofa-l6', type: 'sofa', x: 150, y: 610, w: 25, h: 50, rotation: 0 },
    { id: 'lobby-o-trash-lounge', type: 'trash-bin', x: 100, y: 660, w: 25, h: 25, rotation: 0 },

    // -- Restroom (utility) --
    { id: 'lobby-o-plant-rest', type: 'plant', x: 25, y: 725, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-rest', type: 'trash-bin', x: 150, y: 725, w: 25, h: 25, rotation: 0 },

    // -- Bar & Lounge (public) --
    { id: 'lobby-o-bar-counter', type: 'bar-counter', x: 300, y: 475, w: 300, h: 25, rotation: 0 },
    { id: 'lobby-o-bar-stool-1', type: 'bar-stool', x: 325, y: 500, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-bar-stool-2', type: 'bar-stool', x: 375, y: 500, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-bar-stool-3', type: 'bar-stool', x: 425, y: 500, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-bar-stool-4', type: 'bar-stool', x: 475, y: 500, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-bar-stool-5', type: 'bar-stool', x: 525, y: 500, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-bar-stool-6', type: 'bar-stool', x: 575, y: 500, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-bar-1', type: 'plant', x: 850, y: 475, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-table-b2', type: 'table-chairs', x: 300, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b3', type: 'table-chairs', x: 400, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b4', type: 'table-chairs', x: 500, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b5', type: 'table-chairs', x: 600, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b6', type: 'table-chairs', x: 700, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b7', type: 'table-chairs', x: 800, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b8', type: 'table-chairs', x: 900, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b9', type: 'table-chairs', x: 1000, y: 575, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-trash-bar-1', type: 'trash-bin', x: 650, y: 725, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-table-b10', type: 'table-chairs', x: 300, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b11', type: 'table-chairs', x: 400, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b12', type: 'table-chairs', x: 500, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b13', type: 'table-chairs', x: 600, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b14', type: 'table-chairs', x: 700, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b15', type: 'table-chairs', x: 800, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b16', type: 'table-chairs', x: 900, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-b17', type: 'table-chairs', x: 1000, y: 675, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-trash-bar-2', type: 'trash-bin', x: 950, y: 475, w: 25, h: 25, rotation: 0 },

    // -- Lobby Terrace (open) --
    { id: 'lobby-o-dining-t1', type: 'dining-table-round', x: 1150, y: 500, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-dining-t2', type: 'dining-table-round', x: 1350, y: 500, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-dining-t3', type: 'dining-table-round', x: 1550, y: 500, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-dining-t4', type: 'dining-table-round', x: 1750, y: 500, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-t1', type: 'table-chairs', x: 1150, y: 650, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-t2', type: 'table-chairs', x: 1250, y: 650, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-t3', type: 'table-chairs', x: 1450, y: 650, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-t4', type: 'table-chairs', x: 1550, y: 650, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-t5', type: 'table-chairs', x: 1750, y: 650, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-table-t6', type: 'table-chairs', x: 1850, y: 650, w: 50, h: 50, rotation: 0 },
    { id: 'lobby-o-plant-t1', type: 'plant', x: 1975, y: 475, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-plant-t2', type: 'plant', x: 1975, y: 725, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-terrace-1', type: 'trash-bin', x: 1300, y: 475, w: 25, h: 25, rotation: 0 },
    { id: 'lobby-o-trash-terrace-2', type: 'trash-bin', x: 1700, y: 475, w: 25, h: 25, rotation: 0 },
  ],
}

function applyLobbyPreset(): boolean {
  const floor = state.layout.floors.find(f => f.id === 'floor-F1')
  if (!floor) return false
  pushHistory()
  floor.rooms = LOBBY_PRESET.rooms.map(r => ({ ...r }))
  floor.objects = LOBBY_PRESET.objects.map(o => ({ ...o }))
  state.currentFloorId = floor.id
  state.selection = null
  scheduleSave()
  return true
}

function selectFloor(id: string) {
  state.currentFloorId = id
  state.selection = null
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state.layout, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'blueprint-layout.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON(json: string) {
  try {
    const data = migrate(JSON.parse(json))
    pushHistory()
    state.layout = data
    state.currentFloorId = data.floors[0]?.id ?? ''
    state.selection = null
    scheduleSave()
    useToast().success('Layout imported')
  } catch (e) {
    console.error('Failed to import layout', e)
    useToast().error('Invalid layout JSON')
  }
}

const SYNC_KEY = 'blueprint-synced-layout'
const SYNC_FLOOR_IDS = ['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

function editorFloorLabelToFloorId(label: string): string | null {
  if (label === 'G') return 'G'
  const match = label.match(/^F(\d+)$/)
  if (match) {
    const num = match[1]
    if (SYNC_FLOOR_IDS.includes(num)) return num
  }
  return null
}

function syncToGame(): boolean {
  try {
    const synced: Record<string, Array<{ id: string; x: number; y: number; w: number; h: number; label: string; sub: string }>> = {}
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
    console.error('Failed to sync layout to game', e)
    useToast().error('Sync failed — storage error')
    return false
  }
}

const DRAFT_KEY = 'blueprint-editor-drafts'

function loadDrafts(): { id: string; name: string; timestamp: number }[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveDraft(name: string): boolean {
  try {
    const drafts = loadDrafts()
    const id = genId('draft')
    const data = JSON.stringify(state.layout)
    localStorage.setItem(`blueprint-draft-${id}`, data)
    drafts.push({ id, name, timestamp: Date.now() })
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
    return true
  } catch (e) {
    console.error('Failed to save draft', e)
    useToast().error('Draft save failed — storage quota exceeded')
    return false
  }
}

function loadDraft(id: string): boolean {
  try {
    const raw = localStorage.getItem(`blueprint-draft-${id}`)
    if (!raw) return false
    const data = migrate(JSON.parse(raw))
    pushHistory()
    state.layout = data
    state.currentFloorId = data.floors[0]?.id ?? ''
    state.selection = null
    scheduleSave()
    return true
  } catch (e) {
    console.error('Failed to load draft', e)
    useToast().error('Draft load failed')
    return false
  }
}

function deleteDraft(id: string): void {
  try {
    const drafts = loadDrafts().filter(d => d.id !== id)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
    localStorage.removeItem(`blueprint-draft-${id}`)
  } catch (e) {
    console.error('Failed to delete draft', e)
  }
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
    moveSelected,
    rotateSelected,
    updateRoomProps,
    updateObjectProps,
    setMode,
    resizeCanvas,
    addCustomAsset,
    updateCustomAsset,
    deleteCustomAsset,
    addFloor,
    deleteFloor,
    duplicateFloor,
    renameFloor,
    reorderFloors,
    clearFloor,
    selectFloor,
    applyLobbyPreset,
    exportJSON,
    importJSON,
    syncToGame,
    saveDraft,
    loadDraft,
    deleteDraft,
    loadDrafts,
    flushSave,
    undo,
    redo,
    canUndo: computed(() => undoStack.length > 0),
    canRedo: computed(() => redoStack.length > 0),
  }
}
