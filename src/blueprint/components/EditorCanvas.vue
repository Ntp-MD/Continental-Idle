<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useEditorStore, dragState, endAssetDrag, endRoomTemplateDrag } from '../editor-store'
import { findAssetCached } from '../editor-assets'
import { useToast } from '@/composables/useToast'
import { aabbOverlap } from '../utils'
import type { Rect, CompositePart, ObjectData, RoomData } from '../types'

const store = useEditorStore()
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const canvas = computed(() => store.state.layout.canvas)
const floor = computed(() => store.currentFloor.value)

/* ---------- Zoom & Pan (Photoshop-style) ---------- */
const ZOOM_STORAGE_KEY = 'blueprint-zoom-state'
function loadZoomState(): { zoom: number; panX: number; panY: number } {
  try {
    const raw = sessionStorage.getItem(ZOOM_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { zoom: 1, panX: 0, panY: 0 }
}
function saveZoomState(zoom: number, panX: number, panY: number) {
  try {
    sessionStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify({ zoom, panX, panY }))
  } catch { /* ignore */ }
}
const _initial = loadZoomState()
const zoom = ref(_initial.zoom)
const panX = ref(_initial.panX)
const panY = ref(_initial.panY)
const MIN_ZOOM = 0.1
const MAX_ZOOM = 8
watch(zoom, v => saveZoomState(v, panX.value, panY.value))
watch(panX, v => saveZoomState(zoom.value, v, panY.value))
watch(panY, v => saveZoomState(zoom.value, panX.value, v))

const viewBox = computed(() => {
  const w = canvas.value.width / zoom.value
  const h = canvas.value.height / zoom.value
  const cx = canvas.value.width / 2 + panX.value
  const cy = canvas.value.height / 2 + panY.value
  return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`
})

const zoomPercent = computed(() => Math.round(zoom.value * 100))

function fitToScreen() {
  if (!containerRef.value) return
  const pad = 12 + RULER_SIZE
  const cw = containerRef.value.clientWidth - pad * 2
  const ch = containerRef.value.clientHeight - pad * 2
  const fitZoom = Math.min(cw / canvas.value.width, ch / canvas.value.height)
  zoom.value = fitZoom
  panX.value = 0
  panY.value = 0
}

function centerView() {
  panX.value = 0
  panY.value = 0
}

function zoomBy(factor: number, cx?: number, cy?: number) {
  const oldZoom = zoom.value
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor))
  if (cx !== undefined && cy !== undefined) {
    const ratio = oldZoom / newZoom
    panX.value = (panX.value + cx) * ratio - cx
    panY.value = (panY.value + cy) * ratio - cy
  }
  zoom.value = newZoom
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const svg = svgRef.value
  if (!svg) return
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return
  const svgPt = pt.matrixTransform(ctm.inverse())
  const cx = svgPt.x - canvas.value.width / 2
  const cy = svgPt.y - canvas.value.height / 2
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
  zoomBy(factor, cx, cy)
}

/* ---------- Pan: Space+drag, middle-mouse, or blank-area drag ---------- */
const spaceDown = ref(false)
const panning = ref<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

function startPan(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  panning.value = { startX: e.clientX, startY: e.clientY, panX: panX.value, panY: panY.value }
  window.addEventListener('mousemove', onPanMouseMove)
  window.addEventListener('mouseup', onPanMouseUp)
}

function onPanMouseDown(e: MouseEvent) {
  if (spaceDown.value || e.button === 1) {
    startPan(e)
  }
}

function onPanMouseMove(e: MouseEvent) {
  if (!panning.value) return
  const dx = (e.clientX - panning.value.startX) / zoom.value
  const dy = (e.clientY - panning.value.startY) / zoom.value
  panX.value = panning.value.panX - dx
  panY.value = panning.value.panY - dy
}

function onPanMouseUp() {
  window.removeEventListener('mousemove', onPanMouseMove)
  window.removeEventListener('mouseup', onPanMouseUp)
  panning.value = null
}

function localPoint(e: MouseEvent): { x: number; y: number } {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const svgPt = pt.matrixTransform(ctm.inverse())
  return { x: svgPt.x, y: svgPt.y }
}

/* ---------- Wall drawing (Wall mode) ---------- */
const wallDrag = ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number; valid: boolean } | null>(null)

/* ---------- Box select (Object/Move mode) ---------- */
const boxSelect = ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number } | null>(null)
const BOX_SELECT_THRESHOLD = 4

function onCanvasMouseDown(e: MouseEvent) {
  if (e.button === 1) return
  if (spaceDown.value) return
  const p = localPoint(e)
  const inside = p.x >= 0 && p.x <= canvas.value.width && p.y >= 0 && p.y <= canvas.value.height
  if (!inside) {
    startPan(e)
    return
  }
  if (store.state.mode === 'move') {
    startPan(e)
    return
  }
  if (store.state.mode === 'erase') {
    const room = floor.value?.rooms.find(r =>
      p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
    )
    if (room) {
      store.eraseWallTile(room.id, p.x, p.y)
    }
    return
  }
  if (store.state.mode !== 'wall') {
    store.select(null)
    store.selectAsset(null)
    boxSelect.value = { startX: p.x, startY: p.y, x: p.x, y: p.y, w: 0, h: 0 }
    window.addEventListener('mousemove', onBoxSelectMouseMove)
    window.addEventListener('mouseup', onBoxSelectMouseUp)
    return
  }
  wallDrag.value = { startX: p.x, startY: p.y, x: p.x, y: p.y, w: 0, h: 0, valid: false }
  window.addEventListener('mousemove', onWallMouseMove)
  window.addEventListener('mouseup', onWallMouseUp)
}

function onBoxSelectMouseMove(e: MouseEvent) {
  if (!boxSelect.value) return
  const p = localPoint(e)
  const x = Math.min(p.x, boxSelect.value.startX)
  const y = Math.min(p.y, boxSelect.value.startY)
  const w = Math.abs(p.x - boxSelect.value.startX)
  const h = Math.abs(p.y - boxSelect.value.startY)
  boxSelect.value.x = x
  boxSelect.value.y = y
  boxSelect.value.w = w
  boxSelect.value.h = h
}

function onBoxSelectMouseUp() {
  window.removeEventListener('mousemove', onBoxSelectMouseMove)
  window.removeEventListener('mouseup', onBoxSelectMouseUp)
  if (boxSelect.value && boxSelect.value.w > BOX_SELECT_THRESHOLD && boxSelect.value.h > BOX_SELECT_THRESHOLD) {
    const rect: Rect = { x: boxSelect.value.x, y: boxSelect.value.y, w: boxSelect.value.w, h: boxSelect.value.h }
    const objs = floor.value?.objects ?? []
    const hitIds = objs.filter(o => aabbOverlap(o, rect)).map(o => o.id)
    if (hitIds.length === 1) {
      store.select({ type: 'object', id: hitIds[0] })
    } else if (hitIds.length > 1) {
      store.state.multiSelection = { type: 'object', ids: hitIds }
      store.state.selection = null
    }
  }
  boxSelect.value = null
}

function onWallMouseMove(e: MouseEvent) {
  if (!wallDrag.value) return
  const p = localPoint(e)
  const x = Math.min(p.x, wallDrag.value.startX)
  const y = Math.min(p.y, wallDrag.value.startY)
  const w = Math.abs(p.x - wallDrag.value.startX)
  const h = Math.abs(p.y - wallDrag.value.startY)
  const rect: Rect = { x, y, w, h }
  wallDrag.value.x = x
  wallDrag.value.y = y
  wallDrag.value.w = w
  wallDrag.value.h = h
  wallDrag.value.valid = store.canPlaceRoom(rect)
}

async function onWallMouseUp() {
  window.removeEventListener('mousemove', onWallMouseMove)
  window.removeEventListener('mouseup', onWallMouseUp)
  if (wallDrag.value && wallDrag.value.valid && wallDrag.value.w > 0 && wallDrag.value.h > 0) {
    await store.addRoom({ x: wallDrag.value.x, y: wallDrag.value.y, w: wallDrag.value.w, h: wallDrag.value.h })
  }
  wallDrag.value = null
}

/* ---------- Palette drop (Object mode) ---------- */
const paletteGhost = computed(() => {
  if (!dragState.assetId) return null
  const asset = findAssetCached(store.assetMap(), dragState.assetId)
  if (!asset) return null
  const t = canvas.value.tileSize
  const w = store.snap(asset.pxW ?? asset.w * t)
  const h = store.snap(asset.pxH ?? asset.h * t)
  const linkedParts = asset.linkedParts?.map(p => ({ dx: p.dx, dy: p.dy, w: store.snap(p.w), h: store.snap(p.h) }))
  return { w, h, linkedParts }
})

const paletteGhostParts = computed(() => {
  const ghost = paletteGhost.value
  if (!ghost?.linkedParts || ghost.linkedParts.length === 0) return null
  const gx = store.snap(mousePos.value.x - ghost.w / 2)
  const gy = store.snap(mousePos.value.y - ghost.h / 2)
  const rects = ghost.linkedParts.map(p => ({
    x: store.snap(gx + p.dx),
    y: store.snap(gy + p.dy),
    w: p.w,
    h: p.h,
  }))
  const groupMaxX = Math.max(...rects.map(r => r.x + r.w))
  const groupMaxY = Math.max(...rects.map(r => r.y + r.h))
  const overflowX = Math.max(0, groupMaxX - canvas.value.width)
  const overflowY = Math.max(0, groupMaxY - canvas.value.height)
  if (overflowX > 0 || overflowY > 0) {
    for (const r of rects) {
      r.x -= overflowX
      r.y -= overflowY
    }
  }
  return rects
})

const paletteGhostRect = computed(() => {
  const ghost = paletteGhost.value
  if (!ghost) return null
  let x = store.snap(mousePos.value.x - ghost.w / 2)
  let y = store.snap(mousePos.value.y - ghost.h / 2)
  const overflowX = Math.max(0, x + ghost.w - canvas.value.width)
  const overflowY = Math.max(0, y + ghost.h - canvas.value.height)
  if (overflowX > 0) x -= overflowX
  if (overflowY > 0) y -= overflowY
  return { x, y, w: ghost.w, h: ghost.h }
})

const mousePos = ref({ x: -1000, y: -1000 })
const paletteValid = ref(false)
const showGrid = ref(true)
const showLabels = ref(true)
const mouseCoords = ref({ x: 0, y: 0 })

/* ---------- Rulers (Photoshop-style, inside SVG) ---------- */
const RULER_SIZE = 22
const rulerMouseX = ref(-1)
const rulerMouseY = ref(-1)

const rulerXTicks = computed(() => {
  const w = canvas.value.width
  const majorStep = 100
  const minorStep = 20
  const ticks: { pos: number; label: string; major: boolean }[] = []
  for (let v = 0; v <= w; v += minorStep) {
    const isMajor = v % majorStep === 0
    ticks.push({ pos: v, label: isMajor ? String(v) : '', major: isMajor })
  }
  return ticks
})

const rulerYTicks = computed(() => {
  const h = canvas.value.height
  const majorStep = 50
  const minorStep = 10
  const ticks: { pos: number; label: string; major: boolean }[] = []
  for (let v = 0; v <= h; v += minorStep) {
    const isMajor = v % majorStep === 0
    ticks.push({ pos: v, label: isMajor ? String(v) : '', major: isMajor })
  }
  return ticks
})

function onWindowMouseMoveForDrag(e: MouseEvent) {
  if (!dragState.assetId || !svgRef.value) return
  const p = localPoint(e)
  mousePos.value = p
  const ghost = paletteGhost.value
  if (!ghost) return
  const x = p.x - ghost.w / 2
  const y = p.y - ghost.h / 2
  paletteValid.value = store.canPlaceObject(dragState.assetId, x, y)
  mouseCoords.value = { x: Math.round(store.snap(x)), y: Math.round(store.snap(y)) }
}

async function onWindowMouseUpForDrag(e: MouseEvent) {
  if (!dragState.assetId) return
  if (store.state.mode === 'wall') {
    endAssetDrag()
    return
  }
  const assetId = dragState.assetId
  const svgEl = svgRef.value
  if (svgEl) {
    const rect = svgEl.getBoundingClientRect()
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
    const ghost = paletteGhost.value
    if (inside && ghost) {
      const p = localPoint(e)
      await store.addObject(assetId, p.x - ghost.w / 2, p.y - ghost.h / 2)
    }
  }
  endAssetDrag()
}

watch(() => dragState.assetId, (id) => {
  if (id) {
    window.addEventListener('mousemove', onWindowMouseMoveForDrag)
    window.addEventListener('mouseup', onWindowMouseUpForDrag)
  } else {
    window.removeEventListener('mousemove', onWindowMouseMoveForDrag)
    window.removeEventListener('mouseup', onWindowMouseUpForDrag)
  }
})

/* ---------- Room template drop ---------- */
const ROOM_DEFAULT_FILL = '#e8e4dc'

const roomTemplateGhost = computed(() => {
  if (!dragState.roomTemplateId) return null
  const tpl = store.state.layout.roomTemplates?.find(t => t.id === dragState.roomTemplateId)
  if (!tpl) return null
  return { w: tpl.w, h: tpl.h, fillColor: tpl.fillColor ?? ROOM_DEFAULT_FILL }
})

const roomTemplateGhostRect = computed(() => {
  const ghost = roomTemplateGhost.value
  if (!ghost) return null
  let x = store.snap(mousePos.value.x - ghost.w / 2)
  let y = store.snap(mousePos.value.y - ghost.h / 2)
  const overflowX = Math.max(0, x + ghost.w - canvas.value.width)
  const overflowY = Math.max(0, y + ghost.h - canvas.value.height)
  if (overflowX > 0) x -= overflowX
  if (overflowY > 0) y -= overflowY
  return { x, y, w: ghost.w, h: ghost.h, fillColor: ghost.fillColor }
})

const roomTemplateValid = ref(false)

function onRoomTemplateMouseMove(e: MouseEvent) {
  if (!dragState.roomTemplateId || !svgRef.value) return
  const p = localPoint(e)
  mousePos.value = p
  const ghost = roomTemplateGhostRect.value
  if (ghost) {
    roomTemplateValid.value = store.canPlaceRoom({ x: ghost.x, y: ghost.y, w: ghost.w, h: ghost.h })
  }
}

async function onRoomTemplateMouseUp(e: MouseEvent) {
  if (!dragState.roomTemplateId) return
  const templateId = dragState.roomTemplateId
  const svgEl = svgRef.value
  if (svgEl) {
    const rect = svgEl.getBoundingClientRect()
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
    const ghost = roomTemplateGhostRect.value
    if (inside && ghost && roomTemplateValid.value) {
      await store.addRoomFromTemplate(templateId, ghost.x, ghost.y)
    }
  }
  endRoomTemplateDrag()
}

watch(() => dragState.roomTemplateId, (id) => {
  if (id) {
    window.addEventListener('mousemove', onRoomTemplateMouseMove)
    window.addEventListener('mouseup', onRoomTemplateMouseUp)
  } else {
    window.removeEventListener('mousemove', onRoomTemplateMouseMove)
    window.removeEventListener('mouseup', onRoomTemplateMouseUp)
  }
})

const moving = ref<{ type: 'room' | 'object'; id: string; offsetX: number; offsetY: number } | null>(null)
let _moveHistoryPushed = false

function onRoomMouseDown(e: MouseEvent, id: string) {
  if (e.button === 1 || spaceDown.value) return
  e.stopPropagation()
  store.select({ type: 'room', id })
  const room = floor.value?.rooms.find(r => r.id === id)
  if (room?.locked) return
  const p = localPoint(e)
  _moveHistoryPushed = false
  moving.value = { type: 'room', id, offsetX: p.x - (room?.x ?? 0), offsetY: p.y - (room?.y ?? 0) }
  window.addEventListener('mousemove', onMoveMouseMove)
  window.addEventListener('mouseup', onMoveMouseUp)
}

function onObjectMouseDown(e: MouseEvent, id: string) {
  if (e.button === 1 || spaceDown.value) return
  e.stopPropagation()
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    store.toggleMultiSelect(id)
    return
  }
  store.select({ type: 'object', id })
  const obj = floor.value?.objects.find(o => o.id === id)
  if (obj?.locked) return
  const p = localPoint(e)
  _moveHistoryPushed = false
  moving.value = { type: 'object', id, offsetX: p.x - (obj?.x ?? 0), offsetY: p.y - (obj?.y ?? 0) }
  window.addEventListener('mousemove', onMoveMouseMove)
  window.addEventListener('mouseup', onMoveMouseUp)
}

function onMoveMouseMove(e: MouseEvent) {
  if (!moving.value) return
  if (!_moveHistoryPushed) {
    store.pushHistory()
    _moveHistoryPushed = true
  }
  const p = localPoint(e)
  const newX = p.x - moving.value.offsetX
  const newY = p.y - moving.value.offsetY
  store.moveSelectedTo(newX, newY)
}

async function onMoveMouseUp() {
  window.removeEventListener('mousemove', onMoveMouseMove)
  window.removeEventListener('mouseup', onMoveMouseUp)
  if (moving.value && _moveHistoryPushed) {
    await store.commitMove()
  }
  moving.value = null
}

/* ---------- Keyboard ---------- */
function onContainerMouseMove(e: MouseEvent) {
  if (dragState.assetId) return
  if (dragState.roomTemplateId) return
  const p = localPoint(e)
  mouseCoords.value = { x: Math.round(p.x), y: Math.round(p.y) }
  rulerMouseX.value = p.x
  rulerMouseY.value = p.y
}

function toggleGrid() {
  showGrid.value = !showGrid.value
}

function toggleLabels() {
  showLabels.value = !showLabels.value
}

let _arrowHistoryTimer: number | null = null
let _arrowHistoryPending = false

function pushArrowHistory() {
  if (!_arrowHistoryPending) {
    store.pushHistory()
    _arrowHistoryPending = true
  }
  if (_arrowHistoryTimer) window.clearTimeout(_arrowHistoryTimer)
  _arrowHistoryTimer = window.setTimeout(() => {
    _arrowHistoryPending = false
    _arrowHistoryTimer = null
  }, 600)
}

async function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if (e.code === 'Space') {
    e.preventDefault()
    spaceDown.value = true
    return
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (store.state.selection) {
      e.preventDefault()
      await store.deleteSelected()
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (store.state.selection?.type === 'object') {
      await store.rotateSelected()
    } else if (store.state.selection?.type === 'room') {
      useToast().info('Rotate only works on objects, not rooms')
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    store.redo()
  } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    fitToScreen()
  } else if (e.key === '+' || e.key === '=') {
    zoomBy(1.25)
  } else if (e.key === '-' || e.key === '_') {
    zoomBy(1 / 1.25)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (store.state.selection) {
      e.preventDefault()
      const t = canvas.value.tileSize
      const dx = e.key === 'ArrowLeft' ? -t : e.key === 'ArrowRight' ? t : 0
      const dy = e.key === 'ArrowUp' ? -t : e.key === 'ArrowDown' ? t : 0
      const sel = store.state.selection
      if (sel?.type === 'room') {
        const r = store.selectedRoom()
        if (r) { pushArrowHistory(); store.moveSelectedTo(r.x + dx, r.y + dy); await store.commitMove() }
      } else if (sel?.type === 'object') {
        const o = store.selectedObject()
        if (o) { pushArrowHistory(); store.moveSelectedTo(o.x + dx, o.y + dy); await store.commitMove() }
      }
    }
  } else if (e.key === 'Escape') {
    if (dragState.assetId) endAssetDrag()
    if (dragState.roomTemplateId) endRoomTemplateDrag()
    if (wallDrag.value) {
      window.removeEventListener('mousemove', onWallMouseMove)
      window.removeEventListener('mouseup', onWallMouseUp)
      wallDrag.value = null
    }
    store.state.multiSelection = null
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
    e.preventDefault()
    if (e.shiftKey) {
      const obj = store.selectedObject()
      if (obj) store.ungroupObject(obj.id)
    } else {
      if (store.state.multiSelection && store.state.multiSelection.ids.length >= 2) {
        store.mergeObjects([...store.state.multiSelection.ids])
      }
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
    e.preventDefault()
    if (e.shiftKey) {
      const obj = store.selectedObject()
      if (obj) store.unlinkObject(obj.id)
    } else {
      if (store.state.multiSelection && store.state.multiSelection.ids.length >= 2) {
        store.linkObjects([...store.state.multiSelection.ids])
      }
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault()
    store.copySelected()
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    e.preventDefault()
    store.pasteObjects()
  } else if (e.key === 'l' || e.key === 'L') {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const obj = store.selectedObject()
      if (obj) await store.toggleObjectLock(obj.id)
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spaceDown.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  if (!sessionStorage.getItem(ZOOM_STORAGE_KEY)) requestAnimationFrame(fitToScreen)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onWallMouseMove)
  window.removeEventListener('mouseup', onWallMouseUp)
  window.removeEventListener('mousemove', onBoxSelectMouseMove)
  window.removeEventListener('mouseup', onBoxSelectMouseUp)
  window.removeEventListener('mousemove', onWindowMouseMoveForDrag)
  window.removeEventListener('mouseup', onWindowMouseUpForDrag)
  window.removeEventListener('mousemove', onMoveMouseMove)
  window.removeEventListener('mouseup', onMoveMouseUp)
  window.removeEventListener('mousemove', onPanMouseMove)
  window.removeEventListener('mouseup', onPanMouseUp)
  window.removeEventListener('mousemove', onRoomTemplateMouseMove)
  window.removeEventListener('mouseup', onRoomTemplateMouseUp)
})

function escapeSvgText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function assetLabel(type: string): string {
  return escapeSvgText(findAssetCached(store.assetMap(), type)?.name ?? type)
}

function objFillColor(obj: ObjectData): string {
  if (obj.fillColor) return obj.fillColor
  const a = findAssetCached(store.assetMap(), obj.type)
  return a?.defaultBgColor ?? '#ffffff'
}

function roomFillColor(room: RoomData): string {
  return room.fillColor ?? ROOM_DEFAULT_FILL
}

function assetParts(type: string): CompositePart[] | undefined {
  return findAssetCached(store.assetMap(), type)?.parts
}

function compositeOutlinePath(obj: ObjectData): string | null {
  const parts = assetParts(obj.type)
  if (!parts || parts.length === 0) return null

  const rects = parts.map(p => {
    const cx = obj.x + p.dx + p.w / 2
    const cy = obj.y + p.dy + p.h / 2
    if (p.rotation === 90 || p.rotation === 270) {
      const nw = p.h, nh = p.w
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }
    }
    return { x: obj.x + p.dx, y: obj.y + p.dy, w: p.w, h: p.h }
  }).map(r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }))

  const xsSet = new Set<number>()
  const ysSet = new Set<number>()
  for (const r of rects) { xsSet.add(r.x); xsSet.add(r.x + r.w); ysSet.add(r.y); ysSet.add(r.y + r.h) }
  const sx = [...xsSet].sort((a, b) => a - b)
  const sy = [...ysSet].sort((a, b) => a - b)

  const filled: boolean[][] = []
  for (let i = 0; i < sy.length - 1; i++) {
    filled[i] = []
    for (let j = 0; j < sx.length - 1; j++) {
      const cx = sx[j], cy = sy[i], cw = sx[j + 1] - sx[j], ch = sy[i + 1] - sy[i]
      filled[i][j] = rects.some(r => cx >= r.x && cx + cw <= r.x + r.w && cy >= r.y && cy + ch <= r.y + r.h)
    }
  }

  const segs: string[] = []
  for (let i = 0; i < filled.length; i++) {
    for (let j = 0; j < filled[i].length; j++) {
      if (!filled[i][j]) continue
      const x1 = sx[j], x2 = sx[j + 1], y1 = sy[i], y2 = sy[i + 1]
      if (i === 0 || !filled[i - 1][j]) segs.push(`${x1} ${y1} ${x2} ${y1}`)
      if (i === filled.length - 1 || !filled[i + 1][j]) segs.push(`${x1} ${y2} ${x2} ${y2}`)
      if (j === 0 || !filled[i][j - 1]) segs.push(`${x1} ${y1} ${x1} ${y2}`)
      if (j === filled[i].length - 1 || !filled[i][j + 1]) segs.push(`${x2} ${y1} ${x2} ${y2}`)
    }
  }
  if (segs.length === 0) return null
  return segs.map(s => `M${s.split(' ')[0]} ${s.split(' ')[1]}L${s.split(' ')[2]} ${s.split(' ')[3]}`).join(' ')
}

function isObjectSelected(id: string): boolean {
  if (store.state.selection?.type === 'object' && store.state.selection.id === id) return true
  if (store.state.multiSelection?.ids.includes(id)) return true
  return false
}

function roundedRectPath(x: number, y: number, w: number, h: number, rx?: { tl: number; tr: number; br: number; bl: number }): string | null {
  if (!rx) return null
  const { tl, tr, br, bl } = rx
  if (tl === 0 && tr === 0 && br === 0 && bl === 0) return null
  const maxR = Math.min(w, h) / 2
  const r = (v: number) => Math.max(0, Math.min(v, maxR))
  const rtl = r(tl), rtr = r(tr), rbr = r(br), rbl = r(bl)
  return [
    `M ${x + rtl} ${y}`,
    `L ${x + w - rtr} ${y}`,
    rtr > 0 ? `A ${rtr} ${rtr} 0 0 1 ${x + w} ${y + rtr}` : '',
    `L ${x + w} ${y + h - rbr}`,
    rbr > 0 ? `A ${rbr} ${rbr} 0 0 1 ${x + w - rbr} ${y + h}` : '',
    `L ${x + rbl} ${y + h}`,
    rbl > 0 ? `A ${rbl} ${rbl} 0 0 1 ${x} ${y + h - rbl}` : '',
    `L ${x} ${y + rtl}`,
    rtl > 0 ? `A ${rtl} ${rtl} 0 0 1 ${x + rtl} ${y}` : '',
    'Z',
  ].filter(Boolean).join(' ')
}

</script>

<template>
  <div
    ref="containerRef"
    class="editor-canvas"
    :class="{ 'editor-canvas--panning': spaceDown, 'editor-canvas--dragging': !!panning, 'editor-canvas--wall-mode': store.state.mode === 'wall', 'editor-canvas--move-mode': store.state.mode === 'move', 'editor-canvas--erase-mode': store.state.mode === 'erase' }"
    @wheel="onWheel"
    @mousedown="onPanMouseDown"
    @mousemove="onContainerMouseMove"
    @mouseleave="rulerMouseX = -1; rulerMouseY = -1"
    @auxclick.prevent
  >
      <svg
        ref="svgRef"
        class="editor-canvas__svg"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label="Blueprint editor canvas — use arrow keys to move selected objects, Delete to remove, R to rotate, Ctrl+Z to undo"
        tabindex="0"
        @mousedown="onCanvasMouseDown"
      >
        <defs>
          <pattern id="grid" :width="canvas.tileSize" :height="canvas.tileSize" patternUnits="userSpaceOnUse">
            <path :d="`M ${canvas.tileSize} 0 L 0 0 0 ${canvas.tileSize}`" fill="none" stroke="#d4d4d0" stroke-width="0.5" />
          </pattern>
        </defs>

        <rect :width="canvas.width" :height="canvas.height" fill="#f7f7f5" />

        <!-- Rulers (outside canvas, Photoshop-style) -->
        <g class="editor-canvas__ruler-group" style="pointer-events: none">
          <!-- Top ruler background -->
          <rect :x="-RULER_SIZE" :y="-RULER_SIZE" :width="canvas.width + RULER_SIZE" :height="RULER_SIZE" fill="#161820" stroke="#252530" stroke-width="0.5" />
          <!-- Left ruler background -->
          <rect :x="-RULER_SIZE" :y="0" :width="RULER_SIZE" :height="canvas.height" fill="#161820" stroke="#252530" stroke-width="0.5" />
          <!-- Corner square -->
          <rect :x="-RULER_SIZE" :y="-RULER_SIZE" :width="RULER_SIZE" :height="RULER_SIZE" fill="#101216" stroke="#252530" stroke-width="0.5" />

          <!-- Top ruler ticks -->
          <g v-for="tick in rulerXTicks" :key="'rx' + tick.pos">
            <line
              v-if="tick.major"
              :x1="tick.pos" :y1="-RULER_SIZE" :x2="tick.pos" :y2="-2"
              stroke="#666" stroke-width="1"
            />
            <text
              v-if="tick.major"
              :x="tick.pos + 3" :y="-5"
              font-size="9" fill="#999" font-family="monospace"
            >{{ tick.label }}</text>
            <line
              v-else
              :x1="tick.pos" :y1="-RULER_SIZE" :x2="tick.pos" :y2="-RULER_SIZE + 5"
              stroke="#555" stroke-width="0.5"
            />
          </g>

          <!-- Left ruler ticks -->
          <g v-for="tick in rulerYTicks" :key="'ry' + tick.pos">
            <line
              v-if="tick.major"
              :x1="-RULER_SIZE" :y1="tick.pos" :x2="-2" :y2="tick.pos"
              stroke="#666" stroke-width="1"
            />
            <text
              v-if="tick.major"
              :x="-5" :y="tick.pos + 3" font-size="9" fill="#999" font-family="monospace"
              transform="rotate(-90)"
              :transform-origin="`-5 ${tick.pos}`"
            >{{ tick.label }}</text>
            <line
              v-else
              :x1="-RULER_SIZE" :y1="tick.pos" :x2="-RULER_SIZE + 5" :y2="tick.pos"
              stroke="#555" stroke-width="0.5"
            />
          </g>

          <!-- Canvas edge guide lines (extend into rulers) -->
          <line :x1="0" :y1="-RULER_SIZE" :x2="0" :y2="0" stroke="#3dd68c" stroke-width="1.5" />
          <line :x1="canvas.width" :y1="-RULER_SIZE" :x2="canvas.width" :y2="0" stroke="#3dd68c" stroke-width="1.5" />
          <line :x1="-RULER_SIZE" :y1="0" :x2="0" :y2="0" stroke="#3dd68c" stroke-width="1.5" />
          <line :x1="-RULER_SIZE" :y1="canvas.height" :x2="0" :y2="canvas.height" stroke="#3dd68c" stroke-width="1.5" />

          <!-- Mouse position indicators -->
          <line
            v-if="rulerMouseX >= 0"
            :x1="rulerMouseX" :y1="-RULER_SIZE" :x2="rulerMouseX" :y2="0"
            stroke="#f0c040" stroke-width="1"
          />
          <line
            v-if="rulerMouseY >= 0"
            :x1="-RULER_SIZE" :y1="rulerMouseY" :x2="0" :y2="rulerMouseY"
            stroke="#f0c040" stroke-width="1"
          />
        </g>

        <g v-if="floor && floor.rooms.length === 0 && floor.objects.length === 0">
          <text :x="canvas.width / 2" :y="canvas.height / 2 - 10" text-anchor="middle" font-size="16" fill="#999" font-family="Arial, sans-serif" style="pointer-events: none">
            Empty floor — start drawing walls or drag objects from the palette
          </text>
        </g>

        <g v-if="floor">
          <!-- Zone Marks -->
          <template v-if="floor.zones && floor.zones.length > 0">
            <g v-for="zone in floor.zones" :key="`zone-${zone.id}`">
              <rect
                :x="zone.x" :y="zone.y" :width="zone.w" :height="zone.h"
                :fill="zone.color + '22'" :stroke="zone.color" stroke-width="2" stroke-dasharray="8 4"
                style="pointer-events: none"
              />
              <text
                v-if="showLabels"
                :x="zone.x + 8" :y="zone.y + 16"
                font-size="12" font-weight="bold" :fill="zone.color" font-family="Arial, sans-serif"
                style="pointer-events: none; text-transform: uppercase"
              >{{ escapeSvgText(zone.label) }}</text>
            </g>
          </template>

          <g v-for="room in floor.rooms" :key="room.id" @mousedown="onRoomMouseDown($event, room.id)">
            <path
              v-if="roundedRectPath(room.x + (room.padding ?? 0), room.y + (room.padding ?? 0), room.w - (room.padding ?? 0) * 2, room.h - (room.padding ?? 0) * 2, room.rx)"
              :d="roundedRectPath(room.x + (room.padding ?? 0), room.y + (room.padding ?? 0), room.w - (room.padding ?? 0) * 2, room.h - (room.padding ?? 0) * 2, room.rx)!"
              :fill="roomFillColor(room)"
              :stroke="room.locked ? '#666' : '#333333'"
              :stroke-width="room.locked ? 2 : 1.5"
              :stroke-dasharray="room.locked ? '6 3' : undefined"
              :class="{ 'editor-canvas__selected': store.state.selection?.type === 'room' && store.state.selection.id === room.id, 'editor-canvas__dragging-item': moving?.id === room.id, 'editor-canvas__locked': room.locked }"
              :style="{ cursor: moving?.id === room.id ? 'grabbing' : 'move' }"
            />
            <rect
              v-else
              :x="room.x + (room.padding ?? 0)" :y="room.y + (room.padding ?? 0)"
              :width="room.w - (room.padding ?? 0) * 2" :height="room.h - (room.padding ?? 0) * 2"
              :fill="roomFillColor(room)"
              :stroke="room.locked ? '#666' : '#333333'"
              :stroke-width="room.locked ? 2 : 1.5"
              :stroke-dasharray="room.locked ? '6 3' : undefined"
              :rx="room.radius ?? 0"
              :class="{ 'editor-canvas__selected': store.state.selection?.type === 'room' && store.state.selection.id === room.id, 'editor-canvas__dragging-item': moving?.id === room.id, 'editor-canvas__locked': room.locked }"
              :style="{ cursor: moving?.id === room.id ? 'grabbing' : 'move' }"
            />
            <text v-if="showLabels" :x="room.x + room.w / 2" :y="room.y + room.h / 2" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#222" font-family="Arial, sans-serif" style="text-transform: uppercase; pointer-events: none">
              {{ escapeSvgText(room.label) }}
            </text>
          </g>

          <g v-for="obj in floor.objects" :key="obj.id" @mousedown="onObjectMouseDown($event, obj.id)">
            <template v-if="assetParts(obj.type)">
              <template v-for="(part, i) in assetParts(obj.type)" :key="i">
                <rect
                  :x="obj.x + part.dx" :y="obj.y + part.dy"
                  :width="part.w" :height="part.h"
                  :fill="objFillColor(obj)" stroke="none"
                  :transform="part.rotation ? `rotate(${part.rotation} ${obj.x + part.dx + part.w / 2} ${obj.y + part.dy + part.h / 2})` : undefined"
                  :class="{ 'editor-canvas__collapsed': obj.collapsed }"
                  :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
                />
              </template>
              <path
                v-if="compositeOutlinePath(obj)"
                :d="compositeOutlinePath(obj)!"
                fill="none" stroke="#555" stroke-width="1" stroke-linecap="square"
                :class="{ 'editor-canvas__selected': isObjectSelected(obj.id), 'editor-canvas__collapsed': obj.collapsed, 'editor-canvas__dragging-item': moving?.id === obj.id, 'editor-canvas__linked': obj.linkedIds && obj.linkedIds.length > 0, 'editor-canvas__locked': obj.locked }"
                :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move', pointerEvents: 'none' }"
              />
              <template v-else>
                <template v-for="(part, i) in assetParts(obj.type)" :key="'o' + i">
                  <rect
                    :x="obj.x + part.dx" :y="obj.y + part.dy"
                    :width="part.w" :height="part.h"
                    fill="none" stroke="#555" stroke-width="1"
                    :transform="part.rotation ? `rotate(${part.rotation} ${obj.x + part.dx + part.w / 2} ${obj.y + part.dy + part.h / 2})` : undefined"
                    :class="{ 'editor-canvas__selected': isObjectSelected(obj.id), 'editor-canvas__collapsed': obj.collapsed, 'editor-canvas__dragging-item': moving?.id === obj.id, 'editor-canvas__linked': obj.linkedIds && obj.linkedIds.length > 0, 'editor-canvas__locked': obj.locked }"
                    :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move', pointerEvents: 'none' }"
                  />
                </template>
              </template>
            </template>
            <path
              v-else-if="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)"
              :d="roundedRectPath(obj.x + (obj.padding ?? 0), obj.y + (obj.padding ?? 0), obj.w - (obj.padding ?? 0) * 2, obj.h - (obj.padding ?? 0) * 2, obj.rx)!"
              :fill="objFillColor(obj)" stroke="#555" stroke-width="1"
              :class="{ 'editor-canvas__selected': isObjectSelected(obj.id), 'editor-canvas__collapsed': obj.collapsed, 'editor-canvas__dragging-item': moving?.id === obj.id, 'editor-canvas__linked': obj.linkedIds && obj.linkedIds.length > 0, 'editor-canvas__locked': obj.locked }"
              :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
            />
            <rect
              v-else
              :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)" :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2"
              :fill="objFillColor(obj)" stroke="#555" stroke-width="1"
              :rx="obj.radius ?? 0"
              :class="{ 'editor-canvas__selected': isObjectSelected(obj.id), 'editor-canvas__collapsed': obj.collapsed, 'editor-canvas__dragging-item': moving?.id === obj.id, 'editor-canvas__linked': obj.linkedIds && obj.linkedIds.length > 0, 'editor-canvas__locked': obj.locked }"
              :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
            />
            <text v-if="showLabels" :x="obj.x + obj.w / 2" :y="obj.y + obj.h / 2 + (obj.labelPadding ?? 0)" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#222" font-family="Arial, sans-serif" style="pointer-events: none">
              {{ assetLabel(obj.type) }}
            </text>
          </g>
        </g>

        <rect v-if="showGrid" :width="canvas.width" :height="canvas.height" fill="url(#grid)" style="pointer-events: none" />

        <rect :width="canvas.width" :height="canvas.height" fill="none" stroke="#3a3c48" stroke-width="2" />

        <rect
          v-if="wallDrag"
          :x="wallDrag.x" :y="wallDrag.y" :width="wallDrag.w" :height="wallDrag.h"
          :fill="wallDrag.valid ? 'rgba(61,214,140,0.25)' : 'rgba(239,68,68,0.25)'"
          :stroke="wallDrag.valid ? '#3dd68c' : '#ef4444'"
          stroke-width="1.5"
          stroke-dasharray="4 3"
        />

        <rect
          v-if="boxSelect && boxSelect.w > BOX_SELECT_THRESHOLD"
          :x="boxSelect.x" :y="boxSelect.y" :width="boxSelect.w" :height="boxSelect.h"
          fill="rgba(240,192,64,0.15)"
          stroke="#f0c040"
          stroke-width="1.5"
          stroke-dasharray="4 3"
          style="pointer-events: none"
        />

        <g v-if="dragState.assetId && paletteGhost && paletteGhostParts">
          <rect
            v-for="(p, i) in paletteGhostParts"
            :key="'ghost-part-' + i"
            :x="p.x" :y="p.y" :width="p.w" :height="p.h"
            fill="rgba(59,130,246,0.25)"
            stroke="#3b82f6"
            stroke-width="1.5"
            stroke-dasharray="4 3"
          />
        </g>
        <g v-else-if="dragState.assetId && paletteGhost && paletteGhostRect">
          <rect
            :x="paletteGhostRect.x" :y="paletteGhostRect.y"
            :width="paletteGhostRect.w" :height="paletteGhostRect.h"
            :fill="paletteValid ? 'rgba(61,214,140,0.35)' : 'rgba(239,68,68,0.35)'"
            :stroke="paletteValid ? '#3dd68c' : '#ef4444'"
            stroke-width="1.5"
          />
        </g>

        <g v-if="dragState.roomTemplateId && roomTemplateGhostRect">
          <rect
            :x="roomTemplateGhostRect.x" :y="roomTemplateGhostRect.y"
            :width="roomTemplateGhostRect.w" :height="roomTemplateGhostRect.h"
            :fill="roomTemplateValid ? 'rgba(61,214,140,0.35)' : 'rgba(239,68,68,0.35)'"
            :stroke="roomTemplateValid ? '#3dd68c' : '#ef4444'"
            stroke-width="1.5"
            stroke-dasharray="4 3"
          />
        </g>
      </svg>

    <div class="editor-canvas__floor-title" v-if="floor">
      <span class="editor-canvas__floor-label">{{ floor.label }}</span>
      <span class="editor-canvas__floor-name">{{ floor.name }}</span>
    </div>

    <div class="editor-canvas__mode-badge" :class="`editor-canvas__mode-badge--${store.state.mode}`">
      {{ store.state.mode === 'wall' ? 'Wall' : store.state.mode === 'object' ? 'Object' : store.state.mode === 'move' ? 'Move' : 'Erase' }} Mode
    </div>

    <div class="editor-canvas__coords">
      {{ mouseCoords.x }}, {{ mouseCoords.y }}
    </div>

    <div class="editor-canvas__zoom-controls">
      <button class="editor-canvas__zoom-btn" @click="zoomBy(1 / 1.25)" title="Zoom Out (-)" aria-label="Zoom out">−</button>
      <span class="editor-canvas__zoom-display" aria-label="Zoom level">{{ zoomPercent }}%</span>
      <button class="editor-canvas__zoom-btn" @click="zoomBy(1.25)" title="Zoom In (+)" aria-label="Zoom in">+</button>
      <button class="editor-canvas__zoom-btn editor-canvas__zoom-btn--fit" @click="fitToScreen" title="Fit to Screen (Ctrl+0)" aria-label="Fit to screen">Fit</button>
      <button class="editor-canvas__zoom-btn editor-canvas__zoom-btn--fit" @click="centerView" title="Center View" aria-label="Center view">Center</button>
      <button class="editor-canvas__zoom-btn editor-canvas__zoom-btn--fit" @click="toggleGrid" title="Toggle Grid" aria-label="Toggle grid">Grid</button>
      <button class="editor-canvas__zoom-btn editor-canvas__zoom-btn--fit" @click="toggleLabels" title="Toggle Labels" aria-label="Toggle labels">Labels</button>
    </div>
  </div>
</template>

<style scoped>
.editor-canvas {
  flex: 1;
  overflow: hidden;
  background: #161820;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-width: 0;
  min-height: 0;
  position: relative;
  user-select: none;
}

.editor-canvas--panning {
  cursor: grab !important;
}

.editor-canvas--dragging {
  cursor: grabbing !important;
}

.editor-canvas--wall-mode .editor-canvas__svg {
  cursor: crosshair;
}

.editor-canvas--move-mode .editor-canvas__svg {
  cursor: grab;
}

.editor-canvas--erase-mode .editor-canvas__svg {
  cursor: crosshair;
}

.editor-canvas--move-mode.editor-canvas--dragging .editor-canvas__svg {
  cursor: grabbing;
}

.editor-canvas__svg {
  display: block;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  box-shadow: var(--shadow-panel, 0 12px 48px rgba(0, 0, 0, 0.6));
}

.editor-canvas__floor-title {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 6px;
  padding: 6px 12px;
  z-index: 10;
  pointer-events: none;
}

.editor-canvas__floor-label {
  font-weight: bold;
  font-size: 14px;
  color: var(--accent-gold, #f0c040);
}

.editor-canvas__floor-name {
  font-size: 12px;
  color: var(--text-secondary, #a0a0a8);
}

.editor-canvas__mode-badge {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  z-index: 10;
  pointer-events: none;
}

.editor-canvas__mode-badge--wall {
  color: var(--accent-gold, #f0c040);
  border-color: var(--accent-gold, #f0c040);
}

.editor-canvas__mode-badge--object {
  color: var(--accent-green, #3dd68c);
  border-color: var(--accent-green, #3dd68c);
}

.editor-canvas__mode-badge--move {
  color: var(--text-secondary, #a0a0a8);
}

.editor-canvas__coords {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
  font-family: monospace;
  z-index: 10;
  pointer-events: none;
}

.editor-canvas__zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 6px;
  overflow: hidden;
  z-index: 10;
}

.editor-canvas__zoom-btn {
  background: var(--bg-tertiary, #101216);
  border: none;
  color: var(--text-primary, #e8e8ec);
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-canvas__zoom-btn:hover {
  background: var(--bg-card-hover, #1c1e28);
  color: var(--accent-gold, #f0c040);
}

.editor-canvas__zoom-display {
  color: var(--text-secondary, #a0a0a8);
  padding: 0 10px;
  height: 32px;
  font-size: 11px;
  display: flex;
  align-items: center;
  min-width: 56px;
  justify-content: center;
  border-left: 1px solid var(--border-dim, #252530);
  border-right: 1px solid var(--border-dim, #252530);
}

.editor-canvas__zoom-btn--fit {
  width: auto;
  padding: 0 10px;
  font-size: 11px;
  font-weight: bold;
}

.editor-canvas__zoom-btn--fit:hover {
  color: var(--accent-gold, #f0c040);
}

.editor-canvas__locked {
  opacity: 0.7;
  stroke-dasharray: 4 2 !important;
}

.editor-canvas__linked {
  stroke: #06b6d4 !important;
  stroke-width: 1.5 !important;
}

.editor-canvas__selected {
  stroke: #f0c040 !important;
  stroke-width: 2.5 !important;
}

.editor-canvas__collapsed {
  stroke: #ef4444 !important;
  stroke-width: 2.5 !important;
  stroke-dasharray: 4 3;
  fill: rgba(239, 68, 68, 0.25) !important;
}

.editor-canvas__dragging-item {
  opacity: 0.7;
  filter: drop-shadow(0 0 6px rgba(240, 192, 64, 0.6));
}
</style>
