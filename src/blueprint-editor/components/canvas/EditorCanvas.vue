<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject, type Ref } from 'vue'
import { useAssetsStore, dragState, endAssetDrag, wallSelection } from '../../blueprintStore'
import { svgColorVarStyle } from '../../assets/assetUtils'
import { svgTransform as svgTransformGeo, roundedRectPath, buildingArea } from '../../domain/geometry'
import {
  CANVAS_WALL_OBJECT_TYPE,
  resolveStreetTiles,
  normalizeEditorSettings,
} from '../../domain/types'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import type { ObjectData, EntityRef, AssetDef } from '../../domain/types'
import { useCanvasViewport } from '../../composables/useCanvasViewport'
import { useCanvasSelection } from '../../composables/useCanvasSelection'
import { useCanvasDragDrop } from '../../composables/useCanvasDragDrop'
import { useCanvasWallStyle } from '../../composables/useCanvasWallStyle'
import ColorInput from '../inputs/ColorInput.vue'
import ModalShell from '../shell/ModalShell.vue'
import { useNpcSimulation } from '../../composables/useNpcSimulation'
import { useDoorAnimation } from '../../composables/useDoorAnimation'
import { useWallPaint, type WallSegment, type WallSelection } from '../../composables/useWallPaint'
import { useNpcOverlayDraw } from '../../composables/useNpcOverlayDraw'
import { useCanvasRuns, type WallRun, type ObjWallLine } from '../../composables/useCanvasRuns'
import { renderSvgInto as renderSvgContent } from '../../assets/svgSanitizer'

const vSvgContent = {
  mounted(el: Element, binding: { value: string }) {
    if (binding.value) renderSvgContent(el as SVGGElement, binding.value)
  },
  updated(el: Element, binding: { value: string; oldValue?: string }) {
    if (binding.value !== binding.oldValue && binding.value) {
      renderSvgContent(el as SVGGElement, binding.value)
    }
  },
}

const store = useAssetsStore()
const confirm = useConfirm().confirm
const toast = useToast()
const canvas = computed(() => store.state.layout.canvas)
const floor = computed(() => store.currentFloor.value)
const floors = computed(() => store.state.layout.floors)

const floorNavOpen = ref(false)
function toggleFloorNav() {
  floorNavOpen.value = !floorNavOpen.value
}
function closeFloorNav() {
  floorNavOpen.value = false
}
function selectFloorNav(id: string) {
  store.selectFloor(id)
  closeFloorNav()
}
function onFloorNavOutside(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (floorNavOpen.value && !el.closest('.floornav__trigger') && !el.closest('.floornav__menu')) closeFloorNav()
}
function onFloorNavKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && floorNavOpen.value) closeFloorNav()
}

const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
const { start: startNpcSimulation, stop: stopNpcSimulation } = npcSimulation

const npcCanvasRef = ref<HTMLCanvasElement | null>(null)

watch(
  () => store.state.mode,
  (mode, previousMode) => {
    if (mode === 'npc-preview') {
      startNpcSimulation()
      startNpcDraw()
      doorAnimation.start()
    }
    if (previousMode === 'npc-preview' && mode !== 'npc-preview') {
      stopNpcSimulation()
      stopNpcDraw()
      doorAnimation.stop()
      doorAnimation.reset()
    }
  },
)

const VIEW_TOGGLE_KEY = 'blueprint-view-toggles'
const savedToggles = (() => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VIEW_TOGGLE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
})()
const showWalkableOverlay = ref(savedToggles.showWalkableOverlay ?? false)
const showInteractSpots = ref(savedToggles.showInteractSpots ?? false)
const showWalls = ref(savedToggles.showWalls ?? false)
const showObjectHighlights = ref(savedToggles.showObjectHighlights ?? false)
const showBuildingBounds = ref(savedToggles.showBuildingBounds ?? true)
const showNpcGuides = ref(savedToggles.showNpcGuides ?? true)
const showGrid = ref(savedToggles.showGrid ?? true)
const showLabels = ref(savedToggles.showLabels ?? true)
const viewToggles: Record<string, Ref<boolean>> = {
  showGrid,
  showLabels,
  showWalkableOverlay,
  showInteractSpots,
  showWalls,
  showObjectHighlights,
  showBuildingBounds,
  showNpcGuides,
}

function saveViewToggles() {
  try {
    const payload: Record<string, boolean> = {}
    for (const [key, item] of Object.entries(viewToggles)) payload[key] = item.value
    localStorage.setItem(VIEW_TOGGLE_KEY, JSON.stringify(payload))
  } catch {
    toast.error('Failed to save view toggles')
  }
}

function toggleView(key: string) {
  const item = viewToggles[key]
  if (!item) return
  item.value = !item.value
  saveViewToggles()
}

const isInteracting = computed(() => !!panning.value || !!moving.value || zooming.value)
const renderWalkableOverlay = computed(() => showWalkableOverlay.value && !isInteracting.value)
const renderWalls = computed(() => (showWalls.value || store.state.wallPaint) && !isInteracting.value)
const renderInteractSpots = computed(() => showInteractSpots.value && !isInteracting.value)
const renderObjectHighlights = computed(() => showObjectHighlights.value && !isInteracting.value)
const renderBuildingBounds = computed(() => showBuildingBounds.value)

const selectedObjectIds = computed(() => {
  const ids = new Set<string>()
  for (const item of store.state.selectionState.items) {
    if (item.type === 'object') ids.add(item.id)
  }
  return ids
})

function wallDistance(point: { x: number; y: number }, wall: WallSegment): number {
  const dx = wall.x2 - wall.x1
  const dy = wall.y2 - wall.y1
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - wall.x1, point.y - wall.y1)
  const position = Math.max(0, Math.min(1, ((point.x - wall.x1) * dx + (point.y - wall.y1) * dy) / lengthSquared))
  return Math.hypot(point.x - (wall.x1 + position * dx), point.y - (wall.y1 + position * dy))
}

function wallAtPoint(point: { x: number; y: number }): WallSelection | null {
  const tolerance = Math.max(
    editorSettings.value.wallHitTolerancePx / zoom.value,
    canvas.value.tileSize * editorSettings.value.wallHitToleranceTileRatio,
  )
  let closest: WallSelection | null = null
  let closestDistance = tolerance
  for (const wall of wallRuns.value) {
    const distance = wallDistance(point, wall)
    if (distance <= closestDistance) {
      closest = {
        floorId: floor.value?.id ?? '',
        objectId: wall.objectId,
        segment: { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2, door: wall.door },
      }
      closestDistance = distance
    }
  }
  return closest
}

function wallsInRect(rect: { x: number; y: number; w: number; h: number }): WallSelection[] {
  const maxX = rect.x + rect.w
  const maxY = rect.y + rect.h
  const floorId = floor.value?.id ?? ''
  return wallRuns.value
    .filter((wall) => {
      const minWallX = Math.min(wall.x1, wall.x2)
      const maxWallX = Math.max(wall.x1, wall.x2)
      const minWallY = Math.min(wall.y1, wall.y2)
      const maxWallY = Math.max(wall.y1, wall.y2)
      return maxWallX >= rect.x && minWallX <= maxX && maxWallY >= rect.y && minWallY <= maxY
    })
    .map((wall) => ({
      floorId,
      objectId: wall.objectId,
      segment: { x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2, door: wall.door },
    }))
}

const modeLabel = computed(() => {
  if (store.state.wallPaint) return 'Draw Wall Mode'
  const labels: Record<string, string> = {
    object: 'Object',
    draw: 'Draw Object',
    move: 'Move',
    'npc-preview': 'NPC Preview',
  }
  return (labels[store.state.mode] ?? store.state.mode) + ' Mode'
})

const modeBadgeClass = computed(() => {
  if (store.state.mode === 'move') return 'flag--success'
  if (store.state.mode === 'draw') return ''
  return 'flag--active'
})

const modeHint = computed(() => {
  if (store.state.wallPaint)
    return 'Draw Wall: click or drag boundaries - Object tool drag empty space selects walls - Delete removes selection - Escape exits'
  const hints: Record<string, string> = {
    object: 'Drag an asset from the palette onto the canvas - drag empty space to select objects and walls',
    draw: 'Drag a rectangle, then save it as an origin asset',
    move: 'Click and drag an object to reposition it - Delete removes the selection',
    'npc-preview': 'NPCs are simulating on this floor',
  }
  return hints[store.state.mode] ?? ''
})

const buildingAreaRect = computed(() =>
  buildingArea(canvas.value.width, canvas.value.height, canvas.value.tileSize, streetTotalTiles.value),
)
const editorSettings = computed(() => normalizeEditorSettings(store.state.layout.editorSettings))
const streetSidewalkTiles = computed(() =>
  Math.max(1, Math.floor(streetTotalTiles.value * editorSettings.value.sidewalkTileRatio)),
)
const streetSidewalkWidth = computed(() => streetSidewalkTiles.value * canvas.value.tileSize)
const streetTotalTiles = computed(() => resolveStreetTiles(store.state.layout))
const streetRoadWidth = computed(
  () => Math.max(1, streetTotalTiles.value - streetSidewalkTiles.value * 2) * canvas.value.tileSize,
)

const vp = useCanvasViewport(
  () => canvas.value.width,
  () => canvas.value.height,
  {
    minPx: () => editorSettings.value.rulerMinPx,
    maxPx: () => editorSettings.value.rulerMaxPx,
    basePx: () => editorSettings.value.rulerBasePx,
  },
)
const {
  viewBox,
  zoomPercent,
  zoom,
  spaceDown,
  panning,
  zooming,
  svgRef,
  RULER_SIZE,
  fitToScreen,
  centerView,
  zoomBy,
  onWheel,
  startPan,
  onPanMouseDown,
  onPanMouseMove,
  onPanMouseUp,
  localPoint,
} = vp

const { startNpcDraw, stopNpcDraw } = useNpcOverlayDraw({
  frameDots: npcSimulation.frameDots,
  floorId: () => store.state.currentFloorId,
  guides: showNpcGuides,
  svg: vp.svgRef,
  canvas: npcCanvasRef,
  viewBox,
  rulerSize: RULER_SIZE,
})

const { walkableRuns, wallRuns, objWallLines, wallRunsNoDoors, objWallLinesNoDoors, doorPanels, objDef, objAssetMap } = useCanvasRuns({
  floor,
  tileSize: () => canvas.value.tileSize,
  assetMap: () => store.assetMap(),
})

const EMPTY_DOOR_NPCS: never[] = []
const EMPTY_DOOR_EVENTS: never[] = []

const doorAnimation = useDoorAnimation({
  getDoors: () => doorPanels.value,
  getNpcs: () => {
    if (npcSimulation.frameDots.size === 0) return EMPTY_DOOR_NPCS
    const fid = store.state.currentFloorId
    return [...npcSimulation.frameDots.values()].filter((d) => d.floorId === fid)
  },
  getTileSize: () => canvas.value.tileSize,
  getDoorPassageEvents: () => {
    const events = npcSimulation.doorPassageEvents.value
    if (events.length === 0) return EMPTY_DOOR_EVENTS
    const fid = store.state.currentFloorId
    return events.filter((e) => e.floorId === fid)
  },
})

function doorProgress(key: string): number {
  return doorAnimation.doorStates.value.get(key)?.progress ?? 0
}

const wallPaint = useWallPaint({
  disabled: () => store.state.mode === 'npc-preview',
  selection: wallSelection,
  localPoint,
  tileSize: () => canvas.value.tileSize,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  floor,
  wallAtPoint,
  wallsInRect,
  commit: async (floorId, wall) => {
    try {
      const target = store.state.layout.floors.find((item) => item.id === floorId)
      if (!target) {
        toast.error('Failed to save wall - floor not found')
        return
      }
      target.objects.push(wall)
      const saved = await store.saveBlueprintData()
      if (saved) toast.success('Wall saved')
      else toast.error('Failed to save wall')
    } catch {
      toast.error('Failed to save wall')
    }
  },
  remove: async (floorId, objectIds) => {
    const target = store.state.layout.floors.find((item) => item.id === floorId)
    if (!target) return
    const removable = new Set(
      target.objects.filter((object) => objectIds.includes(object.id) && !object.locked).map((object) => object.id),
    )
    if (removable.size === 0) {
      toast.warning('Selected walls are locked')
      return
    }
    target.objects = target.objects.filter((object) => !removable.has(object.id))
    await store.saveBlueprintData()
  },
})
const { wallColor, wallThickness } = useCanvasWallStyle()
const wallPreview = wallPaint.preview
const selectedWall = wallPaint.selected
watch(
  () => store.state.wallPaint,
  (on) => {
    wallPaint.active.value = on
    if (!on) {
      wallPaint.cancel()
      wallPaint.clearSelection()
    } else {
      store.select(null)
      store.selectAsset(null)
      wallPaint.clearSelection()
      if (!showWalls.value) {
        showWalls.value = true
        saveViewToggles()
      }
    }
  },
  { immediate: true },
)
function onCanvasMouseDownWithWalls(e: MouseEvent) {
  if (wallPaint.onMouseDown(e)) return
  if (e.button === 0 && !spaceDown.value && store.state.mode === 'object') {
    const point = localPoint(e)
    if (point) {
      const canvasWall = wallAtPoint(point)
      if (canvasWall) {
        store.select({ type: 'object', id: canvasWall.objectId })
        return
      }
      const tolerance = Math.max(
        editorSettings.value.wallHitTolerancePx / zoom.value,
        canvas.value.tileSize * editorSettings.value.wallHitToleranceTileRatio,
      )
      let closestAsset: ObjWallLine | null = null
      let closestDistance = tolerance
      for (const line of objWallLines.value) {
        const distance = wallDistance(point, line)
        if (distance <= closestDistance) {
          closestAsset = line
          closestDistance = distance
        }
      }
      if (closestAsset) {
        store.select({ type: 'object', id: closestAsset.id })
        return
      }
    }
  }
  onCanvasMouseDown(e)
}
function onCanvasContextMenu(e: MouseEvent) {
  if (store.state.wallPaint) e.preventDefault()
}

const draftAssetId = ref<string | null>(null)
const draftObjectId = ref<string | null>(null)
const showSaveOrigin = ref(false)
const originName = ref('')
const originFillColor = ref<string | undefined>(undefined)
const draftObject = computed(() => floor.value?.objects.find((object) => object.id === draftObjectId.value) ?? null)

async function onDrawComplete(rect: { x: number; y: number; w: number; h: number }) {
  const t = canvas.value.tileSize
  const w = Math.max(1, Math.round(rect.w / t))
  const h = Math.max(1, Math.round(rect.h / t))
  const snappedX = Math.round(rect.x / t) * t
  const snappedY = Math.round(rect.y / t) * t
  try {
    const draft = await store.beginDrawnObject('Draft Object', w, h, snappedX, snappedY)
    if (!draft) return
    draftAssetId.value = draft.asset.id
    draftObjectId.value = draft.object.id
    originName.value = ''
    originFillColor.value = undefined
    showSaveOrigin.value = true
  } catch {
    toast.error('Failed to start drawing')
  }
}

const sel = useCanvasSelection({
  spaceDown,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  startPan,
  floor,
  store: store,
  getMode: () => store.state.mode,
  zoom,
  boxSelectThresholdPx: () => editorSettings.value.boxSelectThresholdPx,
  onDrawComplete,
  onBoxSelectStart: () => wallPaint.clearSelection(),
  onBoxSelectComplete: (rect) => wallPaint.selectInRect(rect),
})
const { boxSelect, onCanvasMouseDown, onBoxSelectMouseMove, onBoxSelectMouseUp } = sel

const dd = useCanvasDragDrop({
  svgRef,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  floor,
  store: store,
  tileSize: () => canvas.value.tileSize,
})
const {
  paletteValid,
  paletteGhost,
  paletteGhostParts,
  paletteGhostRect,
  onWindowMouseMoveForDrag,
  onWindowMouseUpForDrag,
} = dd

const selectedRotation = computed<number | null>(() => {
  if (store.state.selectionState.primary?.type !== 'object') return null
  return store.selectedObject()?.rotation ?? null
})
const showStreet = computed(
  () => !!store.state.layout.streetFloorId && store.state.layout.streetFloorId === store.state.currentFloorId,
)

const mouseCoords = ref({ x: 0, y: 0 })
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

const moving = ref<{
  type: 'object'
  id: string
  offsetX: number
  offsetY: number
  startX: number
  startY: number
} | null>(null)

let _cycleClickPos: { x: number; y: number } | null = null
let _cycleCandidates: EntityRef[] = []
let _cycleIndex = 0
const cycleThreshold = computed(() => Math.max(2, editorSettings.value.cycleThresholdPx / zoom.value))
const overlayScale = computed(() => 1 / zoom.value)
const interactSpotRadius = computed(() => Math.max(1, editorSettings.value.interactSpotRadiusPx * overlayScale.value))
const lockIndicatorRadius = computed(() => Math.max(1, editorSettings.value.lockIndicatorRadiusPx * overlayScale.value))
const labelFontSize = computed(() => Math.max(2, editorSettings.value.labelFontSizePx * overlayScale.value))
const lockLabelFontSize = computed(() => Math.max(1, editorSettings.value.lockLabelFontSizePx * overlayScale.value))
const interactSpotFontSize = computed(() =>
  Math.max(1, editorSettings.value.interactSpotFontSizePx * overlayScale.value),
)
const zoneLabelFontSize = computed(() => Math.max(2, editorSettings.value.zoneLabelFontSizePx * overlayScale.value))
const emptyStateFontSize = computed(() => Math.max(4, editorSettings.value.emptyStateFontSizePx * overlayScale.value))
const rulerTickFontSize = computed(() => Math.max(4, editorSettings.value.rulerTickFontSizePx * overlayScale.value))
const streetDashArray = computed(
  () =>
    `${Math.max(2, canvas.value.tileSize * editorSettings.value.streetDashRatio)} ${Math.max(1, canvas.value.tileSize * editorSettings.value.streetGapRatio)}`,
)

function hasOuterWall(asset: AssetDef | undefined): boolean {
  if (!asset?.wallSegments?.length) return false
  return asset.wallSegments.some(
    (segment) =>
      segment.x1 === 0 ||
      segment.x2 === 0 ||
      segment.x1 === asset.w ||
      segment.x2 === asset.w ||
      segment.y1 === 0 ||
      segment.y2 === 0 ||
      segment.y1 === asset.h ||
      segment.y2 === asset.h,
  )
}

function findEntitiesAtPoint(p: { x: number; y: number }): EntityRef[] {
  const f = floor.value
  if (!f) return []
  const results: EntityRef[] = []
  for (const obj of f.objects) {
    if (p.x >= obj.x && p.x <= obj.x + obj.w && p.y >= obj.y && p.y <= obj.y + obj.h) {
      results.push({ type: 'object', id: obj.id })
    }
  }
  return results
}

function tryCycleSelect(p: { x: number; y: number }): EntityRef | null {
  if (
    _cycleClickPos &&
    Math.abs(p.x - _cycleClickPos.x) <= cycleThreshold.value &&
    Math.abs(p.y - _cycleClickPos.y) <= cycleThreshold.value &&
    _cycleCandidates.length > 1
  ) {
    _cycleIndex = (_cycleIndex + 1) % _cycleCandidates.length
    return _cycleCandidates[_cycleIndex]
  }
  const candidates = findEntitiesAtPoint(p)
  if (candidates.length <= 1) {
    _cycleClickPos = null
    _cycleCandidates = []
    _cycleIndex = 0
    return null
  }
  _cycleClickPos = { x: p.x, y: p.y }
  _cycleCandidates = candidates
  _cycleIndex = 0
  return candidates[0]
}

function onObjectMouseDown(e: MouseEvent, id: string) {
  if (store.state.wallPaint) return
  wallPaint.clearSelection()
  if (e.button === 1 || spaceDown.value) return
  e.stopPropagation()
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    store.toggleMultiSelect(id)
    return
  }
  const p = localPoint(e)
  if (!p) return
  const cycled = tryCycleSelect(p)
  if (cycled) {
    store.select(cycled)
    if (cycled.type !== 'object' || cycled.id !== id) return
  } else {
    store.select({ type: 'object', id })
  }
  const obj = floor.value?.objects.find((o) => o.id === id)
  if (obj?.locked) return
  moving.value = {
    type: 'object',
    id,
    offsetX: p.x - (obj?.x ?? 0),
    offsetY: p.y - (obj?.y ?? 0),
    startX: p.x,
    startY: p.y,
  }
  _dragHasMoved = false
  window.addEventListener('mousemove', onMoveMouseMove)
  window.addEventListener('mouseup', onMoveMouseUp)
}

let _dragHasMoved = false
let _moveRafId: number | null = null
let _movePending: { x: number; y: number } | null = null

function onMoveMouseMove(e: MouseEvent) {
  if (!moving.value) return
  const p = localPoint(e)
  if (!p) return
  const threshold = Math.max(0.5, editorSettings.value.dragThresholdPx / zoom.value)
  if (!_dragHasMoved) {
    if (Math.abs(p.x - moving.value.startX) < threshold && Math.abs(p.y - moving.value.startY) < threshold) return
    _dragHasMoved = true
  }
  _movePending = { x: p.x - moving.value.offsetX, y: p.y - moving.value.offsetY }
  if (_moveRafId === null) {
    _moveRafId = requestAnimationFrame(() => {
      _moveRafId = null
      if (_movePending && moving.value) {
        store.moveSelectedTo(_movePending.x, _movePending.y)
        _movePending = null
      }
    })
  }
}

async function onMoveMouseUp() {
  window.removeEventListener('mousemove', onMoveMouseMove)
  window.removeEventListener('mouseup', onMoveMouseUp)
  if (_moveRafId !== null) {
    cancelAnimationFrame(_moveRafId)
    _moveRafId = null
  }
  if (_movePending && moving.value) {
    store.moveSelectedTo(_movePending.x, _movePending.y)
    _movePending = null
  }
  if (moving.value) {
    if (_dragHasMoved) await store.commitMove()
  }
  _dragHasMoved = false
  moving.value = null
}

let _hoverRafId: number | null = null
let _hoverPending: { x: number; y: number } | null = null

function onContainerMouseMove(e: MouseEvent) {
  if (dragState.assetId) return
  const p = localPoint(e)
  if (!p) return
  _hoverPending = { x: p.x, y: p.y }
  if (_hoverRafId === null) {
    _hoverRafId = requestAnimationFrame(() => {
      _hoverRafId = null
      if (_hoverPending) {
        mouseCoords.value = { x: Math.round(_hoverPending.x), y: Math.round(_hoverPending.y) }
        rulerMouseX.value = _hoverPending.x
        rulerMouseY.value = _hoverPending.y
        _hoverPending = null
      }
    })
  }
}

async function onKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const tag = target?.tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if (target?.closest('[aria-modal="true"]')) return
  if (e.code === 'Space') {
    if (tag === 'BUTTON') return
    e.preventDefault()
    spaceDown.value = true
    return
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
    const wallCount = wallPaint.selected.value.length
    const primary = store.state.selectionState.primary
    const objCount = primary ? store.state.selectionState.items.length || 1 : 0
    if (wallCount === 0 && objCount === 0) return
    e.preventDefault()
    const parts: string[] = []
    if (wallCount > 0) parts.push(`${wallCount} selected wall${wallCount === 1 ? '' : 's'}`)
    if (objCount > 0)
      parts.push(
        `${objCount} selected ${primary!.type === 'object' ? (objCount === 1 ? 'object' : 'objects') : primary!.type}`,
      )
    const confirmed = await confirm({
      title: 'Delete selection',
      message: `Delete ${parts.join(' and ')}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    })
    if (!confirmed) return
    if (wallCount > 0) await wallPaint.deleteSelected()
    if (objCount > 0) await store.deleteSelected()
  } else if (e.key === 'r' || e.key === 'R') {
    if (store.state.selectionState.primary?.type === 'object') {
      await store.rotateSelected()
    }
  } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    fitToScreen()
  } else if (e.key === '+' || e.key === '=') {
    zoomBy(1.25)
  } else if (e.key === '-' || e.key === '_') {
    zoomBy(1 / 1.25)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (store.state.selectionState.primary) {
      e.preventDefault()
      const t = canvas.value.tileSize
      const step = e.shiftKey ? 10 : 1
      const dx = e.key === 'ArrowLeft' ? -t * step : e.key === 'ArrowRight' ? t * step : 0
      const dy = e.key === 'ArrowUp' ? -t * step : e.key === 'ArrowDown' ? t * step : 0
      const sel = store.state.selectionState.primary
      if (sel?.type === 'object') {
        const o = store.selectedObject()
        if (o) {
          store.moveSelectedTo(o.x + dx, o.y + dy)
          await store.commitMove()
        }
      }
    }
  } else if (e.key === 'Escape') {
    if (store.state.wallPaint) {
      wallPaint.cancel()
      wallPaint.clearSelection()
      store.setWallPaint(false)
      return
    }
    if (dragState.assetId) endAssetDrag()
    store.state.selectionState = { primary: null, items: [] }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
    e.preventDefault()
    if (e.shiftKey) {
      const obj = store.selectedObject()
      if (obj) await store.unlinkObject(obj.id)
    } else {
      if (store.state.selectionState.items.length >= 2) {
        await store.linkObjects([
          ...store.state.selectionState.items.filter((i) => i.type === 'object').map((i) => i.id),
        ])
      }
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault()
    store.copySelected()
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    e.preventDefault()
    await store.pasteObjects()
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

function onWindowBlur() {
  spaceDown.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onWindowBlur)
  document.addEventListener('click', onFloorNavOutside)
  document.addEventListener('keydown', onFloorNavKeydown)
  requestAnimationFrame(fitToScreen)
})
onUnmounted(() => {
  stopNpcSimulation()
  stopNpcDraw()
  doorAnimation.stop()
  wallPaint.cancel()
  wallPaint.clearSelection()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', onWindowBlur)
  document.removeEventListener('click', onFloorNavOutside)
  document.removeEventListener('keydown', onFloorNavKeydown)
  window.removeEventListener('mousemove', onBoxSelectMouseMove)
  window.removeEventListener('mouseup', onBoxSelectMouseUp)
  window.removeEventListener('mousemove', onWindowMouseMoveForDrag)
  window.removeEventListener('mouseup', onWindowMouseUpForDrag)
  window.removeEventListener('mousemove', onMoveMouseMove)
  window.removeEventListener('mouseup', onMoveMouseUp)
  window.removeEventListener('mousemove', onPanMouseMove)
  window.removeEventListener('mouseup', onPanMouseUp)
  saveViewToggles()
})

function escapeSvgText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function assetLabel(type: string, asset: AssetDef | undefined): string {
  return escapeSvgText(asset?.defaultLabel ?? asset?.name ?? type)
}

function objFillColor(obj: ObjectData, asset: AssetDef | undefined): string {
  if (obj.fillColor) return obj.fillColor
  if (asset?.svg) return asset.defaultFillColor ?? 'transparent'
  return asset?.defaultFillColor ?? 'var(--text-primary)'
}

function objLabelColor(): string {
  return canvas.value.labelColor || 'var(--text-primary)'
}

function objIsWall(obj: ObjectData, asset: AssetDef | undefined): boolean {
  return obj.isWall === true || (asset?.isWall ?? false)
}

function assetSvg(asset: AssetDef | undefined): string | undefined {
  return asset?.svg
}

function svgTransform(obj: ObjectData, asset: AssetDef | undefined): string {
  return svgTransformGeo(obj, asset)
}

function svgColorVars(obj: ObjectData, asset: AssetDef | undefined): string {
  return svgColorVarStyle(obj.fillColor ?? asset?.defaultFillColor, obj.strokeColor ?? asset?.defaultStrokeColor)
}

function isObjectSelected(id: string): boolean {
  return selectedObjectIds.value.has(id)
}

const wallSelectionKeys = computed(() => new Set(selectedWall.value.map((selection) => selection.objectId)))

function isWallSelected(wall: WallRun): boolean {
  return wallSelectionKeys.value.has(wall.objectId)
}

async function saveDrawnOrigin() {
  const assetId = draftAssetId.value
  const name = originName.value.trim()
  if (!assetId || !name) return
  try {
    await store.updateAsset(assetId, { name, defaultFillColor: originFillColor.value })
    showSaveOrigin.value = false
    draftAssetId.value = null
    draftObjectId.value = null
    store.setMode('object')
  } catch {
    toast.error('Failed to save origin asset')
  }
}

async function cancelDrawnOrigin() {
  if (draftObjectId.value) {
    store.select({ type: 'object', id: draftObjectId.value })
    await store.deleteSelected()
  }
  if (draftAssetId.value) await store.deleteAsset(draftAssetId.value)
  showSaveOrigin.value = false
  draftAssetId.value = null
  draftObjectId.value = null
  store.setMode('object')
}
</script>

<template>
  <div
    :ref="vp.containerRef"
    class="editor__canvas"
    :class="{
      'editor__canvas--panning': spaceDown,
      'editor__canvas--dragging': !!panning,
      'editor__canvas--draw': store.state.mode === 'draw',
      'editor__canvas--move': store.state.mode === 'move',
      'editor__canvas--wallpaint': store.state.wallPaint,
    }"
    @wheel="onWheel"
    @mousedown="onPanMouseDown"
    @mousemove="onContainerMouseMove"
    @mouseleave="((rulerMouseX = -1), (rulerMouseY = -1))"
  >
    <svg
      ref="svgRef"
      class="editor__svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      role="application"
      aria-label="Blueprint editor canvas - use arrow keys to move selected objects, Delete to remove, R to rotate"
      tabindex="0"
      @mousedown="onCanvasMouseDownWithWalls"
      @contextmenu="onCanvasContextMenu"
    >
      <defs>
        <pattern id="grid" :width="canvas.tileSize" :height="canvas.tileSize" patternUnits="userSpaceOnUse">
          <path
            :d="`M ${canvas.tileSize} 0 L 0 0 0 ${canvas.tileSize}`"
            fill="none"
            stroke="var(--border-dim)"
            stroke-width="0.5"
          />
        </pattern>
      </defs>

      <rect :width="canvas.width" :height="canvas.height" :fill="canvas.bgColor || 'var(--bg-secondary)'" />

      <!-- Street border: sidewalk + road + lane markings (8 tiles on all sides) -->
      <g v-if="showStreet" class="editor__svg--noevents">
        <!-- Outer sidewalk (2 tiles, all sides) -->
        <rect :x="0" :y="0" :width="canvas.width" :height="streetSidewalkWidth" fill="var(--street-sidewalk)" />
        <rect
          :x="0"
          :y="canvas.height - streetSidewalkWidth"
          :width="canvas.width"
          :height="streetSidewalkWidth"
          fill="var(--street-sidewalk)"
        />
        <rect :x="0" :y="0" :width="streetSidewalkWidth" :height="canvas.height" fill="var(--street-sidewalk)" />
        <rect
          :x="canvas.width - streetSidewalkWidth"
          :y="0"
          :width="streetSidewalkWidth"
          :height="canvas.height"
          fill="var(--street-sidewalk)"
        />

        <!-- Road (4 tiles, all sides) -->
        <rect
          :x="streetSidewalkWidth"
          :y="streetSidewalkWidth"
          :width="canvas.width - streetSidewalkWidth * 2"
          :height="streetRoadWidth"
          fill="var(--street-road)"
        />
        <rect
          :x="streetSidewalkWidth"
          :y="canvas.height - streetSidewalkWidth - streetRoadWidth"
          :width="canvas.width - streetSidewalkWidth * 2"
          :height="streetRoadWidth"
          fill="var(--street-road)"
        />
        <rect
          :x="streetSidewalkWidth"
          :y="streetSidewalkWidth"
          :width="streetRoadWidth"
          :height="canvas.height - streetSidewalkWidth * 2"
          fill="var(--street-road)"
        />
        <rect
          :x="canvas.width - streetSidewalkWidth - streetRoadWidth"
          :y="streetSidewalkWidth"
          :width="streetRoadWidth"
          :height="canvas.height - streetSidewalkWidth * 2"
          fill="var(--street-road)"
        />

        <!-- Road lane markings (dashed center lines) -->
        <!-- Top road center line -->
        <line
          :x1="streetSidewalkWidth"
          :y1="streetSidewalkWidth + streetRoadWidth / 2"
          :x2="canvas.width - streetSidewalkWidth"
          :y2="streetSidewalkWidth + streetRoadWidth / 2"
          stroke="var(--street-marking)"
          stroke-width="1"
          :stroke-dasharray="streetDashArray"
          opacity="0.5"
        />
        <!-- Bottom road center line -->
        <line
          :x1="streetSidewalkWidth"
          :y1="canvas.height - streetSidewalkWidth - streetRoadWidth / 2"
          :x2="canvas.width - streetSidewalkWidth"
          :y2="canvas.height - streetSidewalkWidth - streetRoadWidth / 2"
          stroke="var(--street-marking)"
          stroke-width="1"
          :stroke-dasharray="streetDashArray"
          opacity="0.5"
        />
        <!-- Left road center line -->
        <line
          :x1="streetSidewalkWidth + streetRoadWidth / 2"
          :y1="streetSidewalkWidth"
          :x2="streetSidewalkWidth + streetRoadWidth / 2"
          :y2="canvas.height - streetSidewalkWidth"
          stroke="var(--street-marking)"
          stroke-width="1"
          :stroke-dasharray="streetDashArray"
          opacity="0.5"
        />
        <!-- Right road center line -->
        <line
          :x1="canvas.width - streetSidewalkWidth - streetRoadWidth / 2"
          :y1="streetSidewalkWidth"
          :x2="canvas.width - streetSidewalkWidth - streetRoadWidth / 2"
          :y2="canvas.height - streetSidewalkWidth"
          stroke="var(--street-marking)"
          stroke-width="1"
          :stroke-dasharray="streetDashArray"
          opacity="0.5"
        />

        <!-- Building area outline (subtle border separating street from building) -->
        <rect
          :x="buildingAreaRect.x"
          :y="buildingAreaRect.y"
          :width="buildingAreaRect.w"
          :height="buildingAreaRect.h"
          fill="none"
          stroke="var(--border-dim)"
          stroke-width="1"
          stroke-dasharray="4 4"
          opacity="0.6"
        />
      </g>

      <!-- Rulers (outside canvas, Photoshop-style) -->
      <g class="editor__ruler--passive editor__svg--noevents">
        <!-- Top ruler background -->
        <rect
          :x="-RULER_SIZE"
          :y="-RULER_SIZE"
          :width="canvas.width + RULER_SIZE"
          :height="RULER_SIZE"
          fill="var(--bg-secondary)"
          stroke="var(--border-dim)"
          stroke-width="0.5"
        />
        <!-- Left ruler background -->
        <rect
          :x="-RULER_SIZE"
          :y="0"
          :width="RULER_SIZE"
          :height="canvas.height"
          fill="var(--bg-secondary)"
          stroke="var(--border-dim)"
          stroke-width="0.5"
        />
        <!-- Corner square -->
        <rect
          :x="-RULER_SIZE"
          :y="-RULER_SIZE"
          :width="RULER_SIZE"
          :height="RULER_SIZE"
          fill="var(--bg-primary)"
          stroke="var(--border-dim)"
          stroke-width="0.5"
        />

        <!-- Top ruler ticks -->
        <g v-for="tick in rulerXTicks" :key="'rx' + tick.pos">
          <line
            v-if="tick.major"
            :x1="tick.pos"
            :y1="-RULER_SIZE"
            :x2="tick.pos"
            :y2="-2"
            stroke="var(--text-primary)"
            stroke-width="1"
          />
          <text
            v-if="tick.major"
            :x="tick.pos + 3"
            :y="-5"
            :font-size="rulerTickFontSize"
            font-weight="100"
            letter-spacing="1"
            fill="var(--text-secondary)"
          >
            {{ tick.label }}
          </text>
          <line
            v-else
            :x1="tick.pos"
            :y1="-RULER_SIZE"
            :x2="tick.pos"
            :y2="-RULER_SIZE + 5"
            stroke="var(--text-primary)"
            stroke-width="0.5"
          />
        </g>

        <!-- Left ruler ticks -->
        <g v-for="tick in rulerYTicks" :key="'ry' + tick.pos">
          <line
            v-if="tick.major"
            :x1="-RULER_SIZE"
            :y1="tick.pos"
            :x2="-2"
            :y2="tick.pos"
            stroke="var(--text-primary)"
            stroke-width="1"
          />
          <text
            v-if="tick.major"
            :x="-5"
            :y="tick.pos + 3"
            :font-size="rulerTickFontSize"
            font-weight="100"
            letter-spacing="1"
            fill="var(--text-secondary)"
            transform="rotate(-90)"
            :transform-origin="`-5 ${tick.pos}`"
          >
            {{ tick.label }}
          </text>
          <line
            v-else
            :x1="-RULER_SIZE"
            :y1="tick.pos"
            :x2="-RULER_SIZE + 5"
            :y2="tick.pos"
            stroke="var(--text-primary)"
            stroke-width="0.5"
          />
        </g>

        <!-- Canvas edge guide lines (extend into rulers) -->
        <line :x1="0" :y1="-RULER_SIZE" :x2="0" :y2="0" stroke="var(--accent-green)" stroke-width="1.5" />
        <line
          :x1="canvas.width"
          :y1="-RULER_SIZE"
          :x2="canvas.width"
          :y2="0"
          stroke="var(--accent-green)"
          stroke-width="1.5"
        />
        <line :x1="-RULER_SIZE" :y1="0" :x2="0" :y2="0" stroke="var(--accent-green)" stroke-width="1.5" />
        <line
          :x1="-RULER_SIZE"
          :y1="canvas.height"
          :x2="0"
          :y2="canvas.height"
          stroke="var(--accent-green)"
          stroke-width="1.5"
        />

        <!-- Mouse position indicators -->
        <line
          v-if="rulerMouseX >= 0"
          :x1="rulerMouseX"
          :y1="-RULER_SIZE"
          :x2="rulerMouseX"
          :y2="0"
          stroke="var(--accent-primary)"
          stroke-width="1"
        />
        <line
          v-if="rulerMouseY >= 0"
          :x1="-RULER_SIZE"
          :y1="rulerMouseY"
          :x2="0"
          :y2="rulerMouseY"
          stroke="var(--accent-primary)"
          stroke-width="1"
        />
      </g>

      <g v-if="floor && floor.objects.length === 0">
        <text
          :x="canvas.width / 2"
          :y="canvas.height / 2 - 10"
          text-anchor="middle"
          :font-size="emptyStateFontSize"
          class="editor__svg--noevents"
          fill="var(--text-primary)"
        >
          Empty floor - drag objects from the palette
        </text>
      </g>

      <g
        v-if="renderWalkableOverlay && floor?.walkable?.tileStates"
        v-memo="[walkableRuns, renderWalkableOverlay]"
        class="editor__svg--noevents"
      >
        <rect
          v-for="(run, i) in walkableRuns"
          :key="`floor-walk-run-${i}`"
          :x="run.x"
          :y="run.y"
          :width="run.w"
          :height="run.h"
          :class="`editor__tile editor__tile--${run.state}`"
        />
      </g>

      <g
        v-if="renderWalls"
        v-memo="[wallRunsNoDoors, objWallLinesNoDoors, renderWalls, wallColor, wallThickness, selectedWall]"
        class="editor__svg--noevents"
      >
        <line
          v-for="(run, i) in wallRunsNoDoors"
          :key="`floor-wall-run-${i}`"
          :x1="run.x1"
          :y1="run.y1"
          :x2="run.x2"
          :y2="run.y2"
          :class="{ 'editor__wall--selected': isWallSelected(run) }"
          :stroke="isWallSelected(run) ? 'var(--accent-primary)' : wallColor"
          :stroke-width="isWallSelected(run) ? wallThickness + 3 : wallThickness"
          :stroke-dasharray="isWallSelected(run) ? '10 5' : undefined"
        />
        <line
          v-for="(line, i) in objWallLinesNoDoors"
          :key="`obj-wall-${line.id}-${i}`"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="wallColor"
          :stroke-width="wallThickness"
        />
      </g>

      <g v-if="doorPanels.length && (renderWalls || store.state.mode === 'npc-preview')" class="editor__svg--noevents">
        <template v-for="door in doorPanels" :key="`door-${door.key}`">
          <rect
            v-if="door.horizontal"
            :x="door.cx - door.length / 2 - (door.length / 2) * doorProgress(door.key)"
            :y="door.cy - door.thickness / 2"
            :width="door.length / 2"
            :height="door.thickness"
            class="door__panel"
          />
          <rect
            v-if="door.horizontal"
            :x="door.cx + (door.length / 2) * doorProgress(door.key)"
            :y="door.cy - door.thickness / 2"
            :width="door.length / 2"
            :height="door.thickness"
            class="door__panel"
          />
          <rect
            v-if="!door.horizontal"
            :x="door.cx - door.thickness / 2"
            :y="door.cy - door.length / 2 - (door.length / 2) * doorProgress(door.key)"
            :width="door.thickness"
            :height="door.length / 2"
            class="door__panel"
          />
          <rect
            v-if="!door.horizontal"
            :x="door.cx - door.thickness / 2"
            :y="door.cy + (door.length / 2) * doorProgress(door.key)"
            :width="door.thickness"
            :height="door.length / 2"
            class="door__panel"
          />
        </template>
      </g>

      <line
        v-if="wallPreview && !isInteracting"
        :x1="wallPreview.x1"
        :y1="wallPreview.y1"
        :x2="wallPreview.x2"
        :y2="wallPreview.y2"
        :stroke="wallColor"
        :stroke-width="Math.max(2, wallThickness)"
        stroke-dasharray="6 4"
        opacity="0.9"
        class="editor__svg--noevents"
      />

      <g v-if="renderBuildingBounds" v-memo="[buildingAreaRect, renderBuildingBounds]" class="editor__svg--noevents">
        <rect
          :x="buildingAreaRect.x"
          :y="buildingAreaRect.y"
          :width="buildingAreaRect.w"
          :height="buildingAreaRect.h"
          fill="none"
          stroke="var(--accent-green)"
          stroke-width="6"
          opacity="0.9"
        />
      </g>

      <rect
        v-if="showGrid"
        :width="canvas.width"
        :height="canvas.height"
        fill="url(#grid)"
        class="editor__svg--noevents"
      />

      <g v-if="floor">
        <template v-for="obj in floor.objects" :key="obj.id">
          <g v-if="obj.type !== CANVAS_WALL_OBJECT_TYPE" @mousedown="onObjectMouseDown($event, obj.id)">
            <rect
              :x="obj.x"
              :y="obj.y"
              :width="obj.w"
              :height="obj.h"
              fill="transparent"
              class="editor__svg--passall"
            />
            <template v-if="assetSvg(objAssetMap.get(obj.id))">
              <g
                v-svg-content="assetSvg(objAssetMap.get(obj.id))"
                :transform="svgTransform(obj, objAssetMap.get(obj.id))"
                :data-obj-id="obj.id"
                :class="{
                  'editor__object--collapsed': obj.collapsed,
                  'editor__object--dragging': moving?.id === obj.id,
                  'editor__object--locked': obj.locked,
                  'editor__object--nowall': !hasOuterWall(objAssetMap.get(obj.id)),
                }"
                :style="`cursor:${moving?.id === obj.id ? 'grabbing' : 'move'};${svgColorVars(obj, objAssetMap.get(obj.id))}`"
              />
            </template>
            <path
              v-else-if="
                roundedRectPath(
                  obj.x + (obj.padding ?? 0),
                  obj.y + (obj.padding ?? 0),
                  obj.w - (obj.padding ?? 0) * 2,
                  obj.h - (obj.padding ?? 0) * 2,
                  obj.rx,
                )
              "
              :d="
                roundedRectPath(
                  obj.x + (obj.padding ?? 0),
                  obj.y + (obj.padding ?? 0),
                  obj.w - (obj.padding ?? 0) * 2,
                  obj.h - (obj.padding ?? 0) * 2,
                  obj.rx,
                )!
              "
              :fill="objFillColor(obj, objAssetMap.get(obj.id))"
              :stroke-width="objIsWall(obj, objAssetMap.get(obj.id)) ? 2 : 1"
              :stroke-dasharray="objIsWall(obj, objAssetMap.get(obj.id)) ? '6 3' : undefined"
              :class="{
                'editor__object--collapsed': obj.collapsed,
                'editor__object--dragging': moving?.id === obj.id,
                'editor__object--linked': !!obj.linkGroupId,
                'editor__object--locked': obj.locked,
              }"
              stroke="var(--text-primary)"
              :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
            />
            <rect
              v-else
              :x="obj.x + (obj.padding ?? 0)"
              :y="obj.y + (obj.padding ?? 0)"
              :width="obj.w - (obj.padding ?? 0) * 2"
              :height="obj.h - (obj.padding ?? 0) * 2"
              :fill="objFillColor(obj, objAssetMap.get(obj.id))"
              stroke-width="1"
              :rx="obj.radius ?? 0"
              :class="{
                'editor__object--collapsed': obj.collapsed,
                'editor__object--dragging': moving?.id === obj.id,
                'editor__object--linked': !!obj.linkGroupId,
                'editor__object--locked': obj.locked,
              }"
              stroke="var(--text-primary)"
              :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
            />
            <rect
              v-if="renderObjectHighlights"
              :x="obj.x + 1"
              :y="obj.y + 1"
              :width="Math.max(0, obj.w - 2)"
              :height="Math.max(0, obj.h - 2)"
              fill="none"
              :rx="obj.radius ?? 0"
              class="editor__overlay--highlight editor__svg--noevents"
            />
            <template
              v-if="renderWalkableOverlay && objDef(obj).walkableGrid"
              v-memo="[obj.id, obj.x, obj.y, obj.w, obj.h, renderWalkableOverlay, objDef(obj).walkableGrid]"
            >
              <template v-for="(row, gr) in objDef(obj).walkableGrid" :key="'wg_' + obj.id + '-' + gr">
                <rect
                  v-for="(cell, gc) in row"
                  :key="'wg_' + obj.id + '-' + gr + '-' + gc"
                  :x="obj.x + gc * (obj.w / row.length)"
                  :y="obj.y + gr * (obj.h / objDef(obj).walkableGrid!.length)"
                  :width="obj.w / row.length"
                  :height="obj.h / objDef(obj).walkableGrid!.length"
                  :class="`editor__tile editor__tile--obj-${cell ? 'walkable' : 'blocked'}`"
                />
              </template>
            </template>
            <rect
              v-if="isObjectSelected(obj.id)"
              :x="obj.x + (obj.padding ?? 0)"
              :y="obj.y + (obj.padding ?? 0)"
              :width="obj.w - (obj.padding ?? 0) * 2"
              :height="obj.h - (obj.padding ?? 0) * 2"
              fill="none"
              :rx="obj.radius ?? 0"
              class="editor__overlay--selected editor__svg--noevents"
            />
            <text
              v-if="showLabels"
              :x="obj.x + obj.w / 2"
              :y="Math.max(obj.y - (obj.labelPadding ?? 0) - 3, 7)"
              text-anchor="middle"
              :font-size="labelFontSize"
              class="editor__svg--noevents"
              :fill="objLabelColor()"
            >
              {{ assetLabel(obj.type, objAssetMap.get(obj.id)) }}
            </text>
            <g v-if="obj.linkGroupId" class="editor__svg--noevents">
              <circle
                :cx="obj.x + obj.w - 4"
                :cy="obj.y + 4"
                :r="lockIndicatorRadius"
                fill="var(--accent-blue)"
                stroke="var(--bg-primary)"
                stroke-width="0.5"
              />
              <text
                :x="obj.x + obj.w - 4"
                :y="obj.y + 5.5"
                text-anchor="middle"
                :font-size="lockLabelFontSize"
                fill="var(--bg-primary)"
              >
                L
              </text>
            </g>
            <template
              v-if="renderInteractSpots && objDef(obj).interactSpots && objDef(obj).interactSpots!.length > 0"
              v-memo="[obj.id, obj.x, obj.y, renderInteractSpots, objDef(obj).interactSpots]"
            >
              <g
                v-for="(interactSpot, interactSpotIdx) in objDef(obj).interactSpots"
                :key="`o-interactspot-${obj.id}-${interactSpotIdx}`"
                class="editor__svg--noevents"
              >
                <circle
                  :cx="obj.x + interactSpot.x"
                  :cy="obj.y + interactSpot.y"
                  :r="interactSpotRadius"
                  fill="var(--accent-green)"
                  stroke="var(--text-primary)"
                  stroke-width="0.8"
                />
                <text
                  :x="obj.x + interactSpot.x"
                  :y="obj.y + interactSpot.y - 6"
                  text-anchor="middle"
                  :font-size="interactSpotFontSize"
                  fill="color-mix(in srgb, var(--accent-green) 70%, var(--bg-primary))"
                >
                  IS{{ interactSpotIdx + 1 }}
                </text>
              </g>
            </template>
          </g>
        </template>

        <g
          v-if="renderWalkableOverlay"
          v-memo="[floor?.spawnZones, renderWalkableOverlay]"
          class="editor__svg--noevents"
        >
          <g v-for="zone in floor?.spawnZones ?? []" :key="`spawn-zone-${zone.id}`">
            <rect
              :x="zone.x"
              :y="zone.y"
              :width="zone.w"
              :height="zone.h"
              fill="color-mix(in srgb, var(--accent-green) 12%, transparent)"
              stroke="var(--accent-green)"
              stroke-width="1"
              stroke-dasharray="5 3"
            />
            <text :x="zone.x + 4" :y="zone.y + 10" :font-size="zoneLabelFontSize" fill="var(--accent-green)">
              {{ zone.label }}
            </text>
          </g>
        </g>
      </g>

      <rect :width="canvas.width" :height="canvas.height" fill="none" stroke="var(--border-dim)" stroke-width="2" />

      <rect
        v-if="boxSelect && boxSelect.w > 4"
        :x="boxSelect.x"
        :y="boxSelect.y"
        :width="boxSelect.w"
        :height="boxSelect.h"
        class="editor__svg--noevents"
        fill="color-mix(in srgb, var(--accent-primary) 15%, transparent)"
        stroke="var(--accent-primary)"
        stroke-width="1.5"
        stroke-dasharray="4 3"
      />

      <g v-if="dragState.assetId && paletteGhost && paletteGhostParts">
        <rect
          v-for="(p, i) in paletteGhostParts"
          :key="'ghost_part_' + i"
          :x="p.x"
          :y="p.y"
          :width="p.w"
          :height="p.h"
          fill="color-mix(in srgb, var(--accent-blue) 15%, transparent)"
          stroke="var(--accent-blue)"
          stroke-width="1.5"
          stroke-dasharray="4 3"
        />
      </g>
      <g v-else-if="dragState.assetId && paletteGhost && paletteGhostRect">
        <rect
          :x="paletteGhostRect.x"
          :y="paletteGhostRect.y"
          :width="paletteGhostRect.w"
          :height="paletteGhostRect.h"
          :fill="
            paletteValid
              ? 'color-mix(in srgb, var(--accent-green) 35%, transparent)'
              : 'color-mix(in srgb, var(--accent-red) 35%, transparent)'
          "
          :stroke="paletteValid ? 'var(--accent-green)' : 'var(--accent-red)'"
          stroke-width="1.5"
        />
      </g>
    </svg>
    <canvas ref="npcCanvasRef" class="editor__npccanvas"></canvas>

    <div v-if="floor" class="editor__title">
      <span class="editor__labels" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
      <span>{{ floor.name }}</span>
    </div>

    <div v-if="floor" class="editor__nav">
      <div class="floornav__wrap">
        <button
          class="floornav__trigger"
          :aria-expanded="floorNavOpen"
          aria-haspopup="listbox"
          title="Switch floor"
          aria-label="Switch floor"
          @click.stop="toggleFloorNav"
        >
          <span class="floornav__tag" :style="{ color: floor.labelColor || undefined }">{{ floor.label }}</span>
          <span class="truncate">{{ floor.name }}</span>
          <span class="floornav__caret" :class="{ 'floornav__caret--rotated': floorNavOpen }"
            ><svg viewBox="0 0 10 6" width="8" height="5" aria-hidden="true">
              <path d="M0 0l5 6 5-6z" fill="currentColor" /></svg
          ></span>
        </button>
        <div v-if="floorNavOpen" class="floornav__menu" role="listbox" aria-label="Floors">
          <button
            v-for="f in floors"
            :key="f.id"
            class="floornav__item"
            :class="{ 'flag--active': f.id === store.state.currentFloorId }"
            role="option"
            :aria-selected="f.id === store.state.currentFloorId"
            @click="selectFloorNav(f.id)"
          >
            <span class="floornav__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
            <span class="size--stretch truncate">{{ f.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="editor__badge--float" :class="modeBadgeClass">
      {{ modeLabel }}
    </div>
    <div v-if="modeHint" class="editor__hint">
      {{ modeHint }}
    </div>

    <div class="editor__coords">
      {{ mouseCoords.x }}, {{ mouseCoords.y
      }}<template v-if="selectedRotation !== null"> - {{ selectedRotation }}deg</template>
    </div>

    <div class="editor__controls">
      <button title="Zoom Out (-)" aria-label="Zoom out" @click="zoomBy(1 / 1.25)">-</button>
      <span class="editor__zoom" aria-label="Zoom level">{{ zoomPercent }}%</span>
      <button title="Zoom In (+)" aria-label="Zoom in" @click="zoomBy(1.25)">+</button>
      <button title="Fit to Screen (Ctrl+0)" aria-label="Fit to screen" @click="fitToScreen">
        Fit
      </button>
      <button title="Center View" aria-label="Center view" @click="centerView">Center</button>
      <button
        :class="{ 'flag--active': showGrid }"
        title="Toggle Grid"
        aria-label="Toggle grid"
        @click="toggleView('showGrid')"
      >
        Grid
      </button>
      <button
        :class="{ 'flag--active': showLabels }"
        title="Toggle Labels"
        aria-label="Toggle labels"
        @click="toggleView('showLabels')"
      >
        Labels
      </button>
      <button
        :class="{ 'flag--active': showWalkableOverlay }"
        title="Toggle Walkable + Door"
        aria-label="Toggle walkable view"
        @click="toggleView('showWalkableOverlay')"
      >
        Walk
      </button>
      <button
        :class="{ 'flag--active': showWalls }"
        title="Toggle Outer Walls"
        aria-label="Toggle walls"
        @click="toggleView('showWalls')"
      >
        Wall
      </button>
      <button
        :class="{ 'flag--active': showInteractSpots }"
        title="Toggle Interact Spots"
        aria-label="Toggle interact spots"
        @click="toggleView('showInteractSpots')"
      >
        Interact
      </button>
      <button
        :class="{ 'flag--active': showObjectHighlights }"
        title="Toggle object highlights"
        aria-label="Toggle object highlights"
        @click="toggleView('showObjectHighlights')"
      >
        Highlight
      </button>
      <button
        :class="{ 'flag--active': showBuildingBounds }"
        title="Toggle building area boundary (placement limit against the street)"
        aria-label="Toggle building bounds"
        @click="toggleView('showBuildingBounds')"
      >
        Bounds
      </button>
      <button
        :class="{ 'flag--active': showNpcGuides }"
        title="Toggle NPC path guides (only in NPC Preview)"
        aria-label="Toggle NPC path guides"
        @click="toggleView('showNpcGuides')"
      >
        Guides
      </button>
    </div>

    <ModalShell
      :open="showSaveOrigin && !!draftObject"
      modal-id="modal-save-origin"
      title="Save Placed Object as Origin"
      @close="cancelDrawnOrigin"
    >
      <div
        class="editor__preview"
        :style="{
          width: `${Math.min(draftObject?.w ?? 0, 220)}px`,
          height: `${Math.min(draftObject?.h ?? 0, 140)}px`,
          background: originFillColor || 'var(--bg-primary)',
        }"
      />
      <input
        :value="`${(draftObject?.w ?? 0) / canvas.tileSize} x ${(draftObject?.h ?? 0) / canvas.tileSize} tiles`"
        readonly
        aria-label="Object size"
      />
      <label class="form__row">
        <span>Name</span>
        <input v-model="originName" type="text" placeholder="Object name" data-autofocus />
      </label>
      <label class="form__row">
        <span>Fill Color</span>
        <ColorInput
          v-model="originFillColor"
          :allow-transparent="true"
          placeholder="#RRGGBB or transparent"
          aria-label="Origin fill color"
        />
      </label>
      <template #footer>
        <button type="button" @click="cancelDrawnOrigin">Cancel</button>
        <button class="flag--success" type="button" :disabled="!originName.trim()" @click="saveDrawnOrigin">
          Save as Origin
        </button>
      </template>
    </ModalShell>
  </div>
</template>

<style scoped>
.editor__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap-md);
  user-select: none;
}

.editor__canvas--panning,
.editor__canvas--panning .editor__svg,
.editor__canvas--move .editor__svg {
  cursor: grab;
}

.editor__canvas--dragging,
.editor__canvas--dragging .editor__svg {
  cursor: grabbing;
}

.editor__canvas--draw .editor__svg {
  cursor: crosshair;
}

.editor__canvas--wallpaint .editor__svg {
  cursor: crosshair;
}

.editor__wall--selected {
  stroke-linecap: round;
}

.door__panel {
  fill: var(--accent-blue);
  stroke: color-mix(in srgb, var(--accent-blue) 60%, var(--bg-primary));
  stroke-width: 1;
}

.editor__svg {
  background: var(--bg-primary);
}

.editor__npccanvas {
  position: absolute;
  pointer-events: none;
}

.editor__svg--noevents,
.editor__svg--noevents * {
  pointer-events: none;
}

.editor__svg--passall {
  pointer-events: all;
}

.editor__svg:focus-visible {
  outline: 2px solid var(--accent-primary);
}

.editor__overlay--selected {
  stroke: var(--accent-primary);
  stroke-width: 2px;
  fill: none;
  pointer-events: none;
}

.editor__overlay--highlight {
  stroke: var(--accent-primary);
  stroke-width: 1.5px;
  stroke-dasharray: 5 3;
  opacity: 0.9;
  fill: none;
  pointer-events: none;
}

:deep(.editor__object--nowall .svg-role__wall) {
  display: none;
}

.editor__object--linked {
  stroke: var(--accent-blue);
  stroke-width: 1.5px;
}

.editor__object--locked {
  opacity: 0.6;
}

.editor__object--collapsed {
  opacity: 0.4;
}

.editor__object--dragging {
  opacity: 0.7;
}

.editor__tile {
  stroke-width: 0.5;
}

.editor__tile--walkable {
  fill: color-mix(in srgb, var(--accent-green) 12%, transparent);
  stroke: color-mix(in srgb, var(--accent-green) 20%, transparent);
}

.editor__tile--door {
  fill: color-mix(in srgb, var(--accent-blue) 30%, transparent);
  stroke: color-mix(in srgb, var(--accent-green) 20%, transparent);
}

.editor__tile--blocked {
  fill: color-mix(in srgb, var(--accent-red) 12%, transparent);
  stroke: color-mix(in srgb, var(--accent-green) 20%, transparent);
}

.editor__ruler--passive {
  pointer-events: none;
}

.editor__badge--float {
  position: absolute;
  top: var(--gap-md);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  text-transform: capitalize;
  z-index: var(--z-layer-2);
}

.editor__hint {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-dim);
  white-space: nowrap;
  pointer-events: none;
  z-index: var(--z-layer-2);
}

.editor__title {
  position: absolute;
  bottom: var(--gap-md);
  left: var(--gap-md);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-2);
  height: fit-content;
}

.editor__labels {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
}

.editor__nav {
  position: absolute;
  top: var(--gap-md);
  right: var(--gap-md);
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-2);
}

.editor__coords {
  position: absolute;
  bottom: 44px;
  left: var(--gap-md);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-1);
  height: fit-content;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.editor__controls {
  position: absolute;
  bottom: var(--gap-md);
  right: var(--gap-md);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--gap-xs);
  padding: var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-2);
  max-width: calc(100% - var(--gap-md) * 2);
}

.editor__zoom {
  min-width: 30px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.floornav__wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.floornav__trigger {
  flex-shrink: 0;
}

.floornav__tag {
  opacity: 0.7;
  color: var(--accent-primary);
}

.floornav__caret {
  opacity: 0.7;
  transition: transform var(--duration-fast) var(--ease-out);
}

.floornav__caret--rotated {
  transform: rotate(180deg);
}

.floornav__menu {
  position: absolute;
  top: calc(100% + var(--gap-xs));
  right: 0;
  min-width: 144px;
  max-height: 40vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  z-index: var(--z-layer-2);
  padding: var(--gap-xs);
}

.floornav__item {
  width: 100%;
  text-align: left;
}

.floornav__label {
  opacity: 0.8;
  flex-shrink: 0;
}

.editor__preview {
  align-self: center;
  max-width: 100%;
  border: 1px solid var(--accent-primary);
  background-image:
    linear-gradient(45deg, var(--bg-tertiary) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bg-tertiary) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--bg-tertiary) 75%),
    linear-gradient(-45deg, transparent 75%, var(--bg-tertiary) 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
}
</style>

<style>
#modal-save-origin {
  width: min(94vw, 360px);
  max-height: calc(100vh - 32px);
}
</style>
