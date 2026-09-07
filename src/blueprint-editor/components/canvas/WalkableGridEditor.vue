<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useDebouncedCallback } from '@/composables/useDebounceFn'
import { useConfirm } from '@/composables/useConfirm'
import { useAssetPreview } from '../../composables/useAssetPreview'
import { useCanvasDefaults } from '../../composables/useCanvasDefaults'
import { useDirtyBaseline } from '../../composables/useDirtyBaseline'
import { wallSegmentsToEdges, edgesToWallSegments, reattachDoorModes, tileEdgeKey, doorKeyForSide, mirrorTileEdge, segmentCoversTileEdge, type TileEdges, type BorderSide } from '../../domain/gridEditing'
import { withSegmentDoorMode } from '../../assets/assetUtils'
import type { AssetDef, TileState, EdgeInteractSpot, InteractSpot } from '../../domain/types'
import { normalizeInteractConfig, normalizeNpcQueueConfig, resolveInteractForTarget, resolveInteractSpotAnchor, snapSpotToEdge } from '../../domain/types'

export type GridTab = 'walk' | 'door' | 'interactspots' | 'assign'

const props = defineProps<{ asset?: AssetDef; active: boolean; activeTab?: GridTab }>()

const store = useAssetsStore()
const confirm = useConfirm().confirm

const gridTiles = ref<TileState[][]>([])
const gridEdges = ref<TileEdges[][]>([])
const walkBrush = ref<TileState>('walkable')
const doorTool = ref<'door' | 'border' | 'select'>('door')
const selectedEdges = ref<Set<string>>(new Set())
const selectedDoorMode = ref<'auto' | 'hold-open' | 'auto-close'>('auto')
const isDraggingGrid = ref(false)
const hoverEdge = ref<{ r: number; c: number; side: BorderSide } | null>(null)
const previousGridAssetId = ref<string | null>(null)
const isRestoring = ref(false)

const gridInteractSpots = ref<InteractSpot[]>([])
const gridEdgeSpots = ref<EdgeInteractSpot[]>([])
const interactCapacity = ref(0)
const interactDurationMin = ref(1)
const interactDurationMax = ref(3)
const queueMaxMembers = ref(3)
const queueAdmissionDepth = ref(4)
const walkthrough = ref(false)
let syncingWalkthrough = false

const gridCols = computed(() => gridTiles.value[0]?.length ?? 0)

const { canvasTileSize, editorSettings } = useCanvasDefaults()

const { dirty: gridDirty, saveBaseline: saveGridBaseline } = useDirtyBaseline(() => ({
  grid: gridTiles.value,
  edges: gridEdges.value,
  interactSpots: gridInteractSpots.value,
  edgeSpots: gridEdgeSpots.value,
  capacity: interactCapacity.value,
  durationMin: interactDurationMin.value,
  durationMax: interactDurationMax.value,
  maxMembers: queueMaxMembers.value,
  admissionDepth: queueAdmissionDepth.value,
}))

watch(gridDirty, (dirty) => {
  if (dirty && !isSavingGrid.value) scheduleAutoSave()
})

const scheduleAutoSave = useDebouncedCallback(() => {
  void saveGrid()
}, 300)

const tilePx = computed(() => {
  if (!props.asset) return 30
  const cols = props.asset.w
  const rows = props.asset.h
  const maxByWidth = Math.floor(editorSettings.value.walkableGridMaxWidthPx / Math.max(1, cols))
  const maxByHeight = Math.floor(editorSettings.value.walkableGridMaxHeightPx / Math.max(1, rows))
  return Math.max(
    editorSettings.value.walkableGridMinTilePx,
    Math.min(editorSettings.value.walkableGridMaxTilePx, Math.min(maxByWidth, maxByHeight)),
  )
})

const { viewBox: svgPreviewViewBox, vars: previewVars, setEl: setPreviewEl } = useAssetPreview({
  asset: () => props.asset ?? undefined,
  isActive: () => props.active,
})

watch(
  () => props.active,
  (visible) => {
    if (!visible) {
      if (gridDirty.value) scheduleAutoSave.flush()
      else scheduleAutoSave.cancel()
    }
  },
)

watch(walkthrough, async (v) => {
  if (syncingWalkthrough || !props.asset) return
  try {
    await store.updateAsset(props.asset.id, { walkable: v })
  } catch {
    walkthrough.value = !v
    useToast().error('Failed to toggle walkthrough mode')
  }
})

const assetSignature = computed(() => ({
  id: props.asset?.id,
  w: props.asset?.w,
  h: props.asset?.h,
  tileStates: props.asset?.tileStates,
  wallSegments: props.asset?.wallSegments,
  interactSpots: props.asset?.interactSpots,
  interact: props.asset?.interact,
}))

watch(
  assetSignature,
  async (newSig, oldSig) => {
    if (isRestoring.value) {
      isRestoring.value = false
      return
    }

    const sameId = newSig.id === oldSig?.id
    if (!sameId && gridDirty.value && previousGridAssetId.value) {
      scheduleAutoSave.cancel()
      const confirmed = await confirm({
        title: 'Discard changes?',
        message: 'You have unsaved walkable grid changes. Discard them?',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        danger: true,
      })
      if (!confirmed) {
        isRestoring.value = true
        store.selectAsset(previousGridAssetId.value)
        if (gridDirty.value) scheduleAutoSave()
        return
      }
    }

    if (props.asset) {
      initGridTiles(props.asset)
      gridInteractSpots.value = []
      gridEdgeSpots.value = []
      selectedEdges.value.clear()
      for (const spot of props.asset.interactSpots ?? []) {
        if (spot.kind === 'edge') gridEdgeSpots.value.push({ ...spot })
        else gridInteractSpots.value.push({ ...spot })
      }
      const resolved = resolveInteractForTarget(props.asset.interact, gridInteractSpots.value.length + gridEdgeSpots.value.length)
      interactCapacity.value = resolved.capacity
      interactDurationMin.value = resolved.durationMinSeconds
      interactDurationMax.value = resolved.durationMaxSeconds
      queueMaxMembers.value = props.asset.queue?.maxMembers ?? 3
      queueAdmissionDepth.value = props.asset.queue?.admissionDepth ?? 4
      syncingWalkthrough = true
      walkthrough.value = props.asset.walkable ?? false
      nextTick(() => {
        syncingWalkthrough = false
      })
      saveGridBaseline()
      previousGridAssetId.value = props.asset.id
    } else {
      gridTiles.value = []
      gridEdges.value = []
      gridInteractSpots.value = []
      gridEdgeSpots.value = []
      selectedEdges.value.clear()
      saveGridBaseline()
      previousGridAssetId.value = null
    }
  },
  { immediate: true },
)

function initGridTiles(a: AssetDef) {
  const rows = Math.max(1, a.h)
  const cols = Math.max(1, a.w)

  const states = a.tileStates
  if (states && states.length === rows && states[0]?.length === cols) {
    gridTiles.value = states.map((row) => [...row])
  } else {
    const grid = a.walkableGrid
    if (grid && grid.length === rows && grid[0]?.length === cols) {
      gridTiles.value = grid.map((row) => row.map((cell) => (cell ? 'walkable' : 'blocked')))
    } else {
      const defaultStates: TileState[][] = []
      for (let r = 0; r < rows; r++) {
        defaultStates[r] = []
        for (let c = 0; c < cols; c++) defaultStates[r][c] = 'walkable'
      }
      gridTiles.value = defaultStates
    }
  }

  gridEdges.value = wallSegmentsToEdges(a.wallSegments, rows, cols)
}

function removeInteractSpotsOnTile(r: number, c: number) {
  const t = canvasTileSize.value
  gridInteractSpots.value = gridInteractSpots.value.filter(
    (interactSpot) => Math.floor(interactSpot.x / t) !== c || Math.floor(interactSpot.y / t) !== r,
  )
}

function removeInteractSpotsOnBlockedTiles() {
  const t = canvasTileSize.value
  gridInteractSpots.value = gridInteractSpots.value.filter(
    (interactSpot) => gridTiles.value[Math.floor(interactSpot.y / t)]?.[Math.floor(interactSpot.x / t)] !== 'blocked',
  )
}

function paintTile(r: number, c: number, brush: TileState) {
  if (!gridTiles.value[r]) return
  gridTiles.value[r][c] = brush
  if (brush === 'blocked') removeInteractSpotsOnTile(r, c)
}

function computeInteractSpotPx(r: number, c: number): [number, number] {
  const t = canvasTileSize.value
  const x = (c + 0.5) * t
  const y = (r + 0.5) * t
  return [Math.round(x), Math.round(y)]
}

function interactSpotIndexAtPx(x: number, y: number): number {
  return gridInteractSpots.value.findIndex((interactSpot) => interactSpot.x === x && interactSpot.y === y)
}

const EMPTY_SPOTS: { x: number; y: number; title: string }[] = []

function spotTitle(spot: InteractSpot): string {
  const named = spot.post ? ` ${spot.post}` : ''
  if (spot.kind === 'edge') return `NPC edge spot${named} (${spot.edge} ${spot.offset} at ${spot.x}, ${spot.y})`
  return `NPC interactspot${named} (${spot.x}, ${spot.y})`
}

const spotsByTile = computed(() => {
  const t = canvasTileSize.value
  const scale = tilePx.value / t
  const rows = gridTiles.value.length
  const cols = gridCols.value
  const map = new Map<string, { x: number; y: number; title: string }[]>()
  for (const spot of [...gridInteractSpots.value, ...gridEdgeSpots.value]) {
    const { x: ax, y: ay } = spot
    let ac = Math.floor(ax / t)
    let ar = Math.floor(ay / t)
    if (ac >= cols) ac = cols - 1
    if (ar >= rows) ar = rows - 1
    const key = `${ar}:${ac}`
    const entry = { x: (ax - ac * t) * scale, y: (ay - ar * t) * scale, title: spotTitle(spot) }
    const list = map.get(key)
    if (list) list.push(entry)
    else map.set(key, [entry])
  }
  return map
})

function interactSpotsInTile(r: number, c: number): { x: number; y: number; title: string }[] {
  return spotsByTile.value.get(`${r}:${c}`) ?? EMPTY_SPOTS
}

const standDiagrams = computed(() => gridInteractSpots.value.map(spotDiagram))
const edgeDiagrams = computed(() => gridEdgeSpots.value.map(spotDiagram))

function edgeSpotLabel(spot: InteractSpot): string {
  const named = spot.post ? ` ${spot.post}` : ''
  if (spot.kind === 'edge') return `Edge${named}: ${spot.edge} ${spot.offset} at ${spot.x}, ${spot.y}`
  return `Stand${named}: ${spot.x}, ${spot.y}`
}

function spotPixelDims(): { w: number; h: number } {
  const viewBox = props.asset?.svgViewBox
  if (viewBox) return { w: viewBox.w, h: viewBox.h }
  const t = canvasTileSize.value
  return { w: Math.max(1, (props.asset?.w ?? 1) * t), h: Math.max(1, (props.asset?.h ?? 1) * t) }
}

function convertSpotToEdge(index: number) {
  const spot = gridInteractSpots.value[index]
  if (!spot) return
  const dims = spotPixelDims()
  const { edge, offset } = snapSpotToEdge(spot.x, spot.y, dims.w, dims.h)
  gridInteractSpots.value.splice(index, 1)
  gridEdgeSpots.value.push({ ...spot, kind: 'edge', edge, offset })
}

function convertSpotToStand(index: number) {
  const spot = gridEdgeSpots.value[index]
  if (!spot) return
  gridEdgeSpots.value.splice(index, 1)
  gridInteractSpots.value.push({ kind: 'stand', x: spot.x, y: spot.y, ...(spot.post ? { post: spot.post } : {}) })
}

function setSpotPost(list: 'stand' | 'edge', index: number, name: string) {
  const spot = list === 'stand' ? gridInteractSpots.value[index] : gridEdgeSpots.value[index]
  if (!spot) return
  const post = name.trim()
  if (!post) delete spot.post
  else spot.post = post
}

function refreshEdgeCache(spot: EdgeInteractSpot) {
  const dims = spotPixelDims()
  const anchor = resolveInteractSpotAnchor(spot, dims.w, dims.h)
  spot.x = anchor.x
  spot.y = anchor.y
}

interface SpotDiagram {
  viewBox: string
  width: number
  height: number
  edgeX1: number
  edgeY1: number
  edgeX2: number
  edgeY2: number
  hasEdge: boolean
  dotX: number
  dotY: number
  dotR: number
  lineWidth: number
}

function spotDiagram(spot: InteractSpot): SpotDiagram {
  const dims = spotPixelDims()
  const anchor = resolveInteractSpotAnchor(spot, dims.w, dims.h)
  const minX = Math.min(0, dims.w, anchor.x)
  const minY = Math.min(0, dims.h, anchor.y)
  const maxX = Math.max(0, dims.w, anchor.x)
  const maxY = Math.max(0, dims.h, anchor.y)
  const span = Math.max(1, maxX - minX + maxY - minY)
  const pad = Math.max(2, span * 0.08)
  const edges: Record<string, [number, number, number, number]> = {
    N: [0, 0, dims.w, 0],
    S: [0, dims.h, dims.w, dims.h],
    E: [dims.w, 0, dims.w, dims.h],
    W: [0, 0, 0, dims.h],
  }
  const line = spot.kind === 'edge' ? edges[spot.edge] : undefined
  return {
    viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
    width: dims.w,
    height: dims.h,
    edgeX1: line?.[0] ?? 0,
    edgeY1: line?.[1] ?? 0,
    edgeX2: line?.[2] ?? 0,
    edgeY2: line?.[3] ?? 0,
    hasEdge: line !== undefined,
    dotX: anchor.x,
    dotY: anchor.y,
    dotR: Math.max(1.5, span * 0.03),
    lineWidth: Math.max(0.75, span * 0.015),
  }
}

function setSpotEdge(index: number, edge: string) {
  const spot = gridEdgeSpots.value[index]
  if (!spot || (edge !== 'N' && edge !== 'S' && edge !== 'E' && edge !== 'W')) return
  spot.edge = edge
  refreshEdgeCache(spot)
}

function setSpotOffset(index: number, value: number) {
  const spot = gridEdgeSpots.value[index]
  if (!spot || !Number.isFinite(value) || value < 0) return
  spot.offset = value
  refreshEdgeCache(spot)
}

function toggleInteractSpotAt(r: number, c: number) {
  if (gridTiles.value[r]?.[c] !== 'walkable') {
    useToast().warning('Spots need walkable tiles - paint the tile Walkable first (Walkable tab)')
    return
  }
  const [x, y] = computeInteractSpotPx(r, c)
  const idx = interactSpotIndexAtPx(x, y)
  if (idx >= 0) gridInteractSpots.value.splice(idx, 1)
  else gridInteractSpots.value.push({ kind: 'stand', x, y })
}

function clearAllInteractSpots() {
  gridInteractSpots.value = []
}

function fillAllInteractSpots() {
  const existing = new Set(gridInteractSpots.value.map((spot) => `${spot.x},${spot.y}`))
  const spots: InteractSpot[] = [...gridInteractSpots.value]
  for (let r = 0; r < gridTiles.value.length; r++) {
    for (let c = 0; c < gridTiles.value[r].length; c++) {
      if (gridTiles.value[r][c] === 'walkable') {
        const [x, y] = computeInteractSpotPx(r, c)
        const key = `${x},${y}`
        if (!existing.has(key)) {
          spots.push({ kind: 'stand', x, y })
          existing.add(key)
        }
      }
    }
  }
  gridInteractSpots.value = spots
}

function detectEdgeSide(e: MouseEvent): BorderSide | null {
  const target = e.currentTarget as HTMLElement | null
  if (!target) return null
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const w = rect.width
  const h = rect.height
  const distances = [
    { side: 'top' as BorderSide, d: y },
    { side: 'right' as BorderSide, d: w - x },
    { side: 'bottom' as BorderSide, d: h - y },
    { side: 'left' as BorderSide, d: x },
  ]
  const nearest = distances.reduce((a, b) => (a.d < b.d ? a : b))
  if (nearest.d <= 7) return nearest.side
  return null
}

function updateMirroredEdge(r: number, c: number, side: BorderSide, update: (edges: TileEdges, edgeSide: BorderSide) => void) {
  const target = gridEdges.value[r]?.[c]
  if (target) update(target, side)
  const mirror = mirrorTileEdge(r, c, side)
  const mirrorCell = gridEdges.value[mirror.r]?.[mirror.c]
  if (mirrorCell) update(mirrorCell, mirror.side)
}

function toggleEdgeAt(r: number, c: number, side: BorderSide) {
  const e = gridEdges.value[r]?.[c]
  if (!e) return
  if (e[side]) {
    updateMirroredEdge(r, c, side, (cell, s) => {
      delete cell[s]
      delete cell[doorKeyForSide(s)]
    })
  } else {
    updateMirroredEdge(r, c, side, (cell, s) => {
      cell[s] = true
    })
  }
}

function onWalkTileDown(r: number, c: number) {
  isDraggingGrid.value = true
  paintTile(r, c, walkBrush.value)
}

function onWalkTileEnter(r: number, c: number) {
  if (!isDraggingGrid.value) return
  paintTile(r, c, walkBrush.value)
}

function toggleEdgeSelection(r: number, c: number, e: MouseEvent) {
  const side = detectEdgeSide(e)
  if (!side) return
  const key = tileEdgeKey(r, c, side)
  if (selectedEdges.value.has(key)) selectedEdges.value.delete(key)
  else selectedEdges.value.add(key)
}

function clearEdgeSelection() {
  selectedEdges.value.clear()
}

function isSelectedEdge(r: number, c: number, side: BorderSide): boolean {
  return activeGridTab.value === 'door' && doorTool.value === 'select' && selectedEdges.value.has(tileEdgeKey(r, c, side))
}

function deleteSelectedDoors() {
  if (!selectedEdges.value.size) return
  for (const key of selectedEdges.value) {
    const [r, c, side] = key.split(',')
    updateMirroredEdge(Number(r), Number(c), side as BorderSide, (cell, s) => {
      delete cell[doorKeyForSide(s)]
    })
  }
  selectedEdges.value.clear()
}

async function applyDoorModeToSelected() {
  const asset = props.asset
  if (!asset || !selectedEdges.value.size) return
  const picked = new Set<number>()
  const selected = [...selectedEdges.value].map(key => {
    const [r, c, side] = key.split(',')
    return { r: Number(r), c: Number(c), side: side as BorderSide }
  })
  ;(asset.wallSegments ?? []).forEach((segment, index) => {
    if (segment.door !== true) return
    if (selected.some(entry => segmentCoversTileEdge(segment, entry.r, entry.c, entry.side))) picked.add(index)
  })
  if (!picked.size) {
    useToast().warning('No asset doors touch the selected edges')
    return
  }
  const mode = selectedDoorMode.value === 'auto' ? undefined : selectedDoorMode.value
  let next = asset.wallSegments ?? []
  for (const index of picked) next = withSegmentDoorMode(next, index, mode)
  await store.updateAsset(asset.id, { wallSegments: next })
  selectedEdges.value.clear()
}

function onDoorTileDown(r: number, c: number, e: MouseEvent) {
  const side = detectEdgeSide(e)
  if (!side) return
  if (doorTool.value === 'select') {
    toggleEdgeSelection(r, c, e)
    return
  }
  if (doorTool.value === 'border') {
    toggleEdgeAt(r, c, side)
    return
  }
  toggleDoorAt(r, c, side)
}

function onDoorTileHover(r: number, c: number, e: MouseEvent) {
  if (activeGridTab.value !== 'door') {
    if (hoverEdge.value) hoverEdge.value = null
    return
  }
  const side = detectEdgeSide(e)
  const prev = hoverEdge.value
  if (side === null) {
    if (prev) hoverEdge.value = null
    return
  }
  if (!prev || prev.r !== r || prev.c !== c || prev.side !== side) hoverEdge.value = { r, c, side }
}

function isPreviewEdge(r: number, c: number, side: BorderSide): boolean {
  const hover = hoverEdge.value
  if (!hover || activeGridTab.value !== 'door' || doorTool.value !== 'door') return false
  if (hover.r !== r || hover.c !== c || hover.side !== side) return false
  const edges = gridEdges.value[r]?.[c]
  if (!edges) return false
  const doorKey = doorKeyForSide(side)
  return !edges[doorKey]
}

function toggleDoorAt(r: number, c: number, side: BorderSide) {
  const e = gridEdges.value[r]?.[c]
  if (!e) return
  if (e[doorKeyForSide(side)]) {
    updateMirroredEdge(r, c, side, (cell, s) => {
      delete cell[doorKeyForSide(s)]
    })
  } else {
    updateMirroredEdge(r, c, side, (cell, s) => {
      cell[s] = true
      cell[doorKeyForSide(s)] = true
    })
  }
}

function onInteractSpotTileDown(r: number, c: number) {
  toggleInteractSpotAt(r, c)
}

function onTileActivate(r: number, c: number, e: MouseEvent) {
  if (e.detail > 0) return
  const key = activeGridConfig.value.key
  if (key === 'walk') paintTile(r, c, walkBrush.value)
  else if (key === 'interactspots') toggleInteractSpotAt(r, c)
}

function onDragEnd() {
  isDraggingGrid.value = false
}

function fillAllTiles(state: TileState) {
  for (const row of gridTiles.value) {
    for (let i = 0; i < row.length; i++) row[i] = state
  }
  if (state === 'blocked') removeInteractSpotsOnBlockedTiles()
}

function fillGridRow(r: number) {
  if (!gridTiles.value[r]) return
  for (let i = 0; i < gridTiles.value[r].length; i++) gridTiles.value[r][i] = walkBrush.value
}

function fillGridCol(c: number) {
  for (let r = 0; r < gridTiles.value.length; r++) {
    if (gridTiles.value[r]) gridTiles.value[r][c] = walkBrush.value
  }
}

function blockOuterSides() {
  if (gridEdges.value.length === 0) return
  const rows = gridEdges.value.length
  const cols = gridEdges.value[0]?.length ?? 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const e = gridEdges.value[r][c]
      if (!e) continue
      if (r === 0) e.top = true
      if (r === rows - 1) e.bottom = true
      if (c === 0) e.left = true
      if (c === cols - 1) e.right = true
    }
  }
}

async function fillAllTilesBlocked() {
  const confirmed = await confirm({
    title: 'Block all tiles',
    message: 'Set every tile to blocked? Interact spots on blocked tiles will be removed.',
    confirmLabel: 'Block All',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  fillAllTiles('blocked')
}

function clearAllEdges() {
  for (const row of gridEdges.value) {
    for (const e of row) {
      if (e) {
        e.top = false
        e.right = false
        e.bottom = false
        e.left = false
        delete e.doorTop
        delete e.doorRight
        delete e.doorBottom
        delete e.doorLeft
      }
    }
  }
}

async function clearAllEdgesConfirmed() {
  const confirmed = await confirm({
    title: 'Clear edges',
    message: 'Remove all wall edges on this grid? This cannot be undone.',
    confirmLabel: 'Clear',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  clearAllEdges()
}

function clearAllDoors() {
  for (const row of gridEdges.value) {
    for (const e of row) {
      if (!e) continue
      delete e.doorTop
      delete e.doorRight
      delete e.doorBottom
      delete e.doorLeft
    }
  }
}

function walkTileBg(state: TileState): string {
  if (state === 'blocked') return 'color-mix(in srgb, var(--accent-red) 18%, transparent)'
  return 'color-mix(in srgb, var(--accent-green) 14%, transparent)'
}
function walkTileBorder(state: TileState): string {
  if (state === 'blocked') return '1px solid var(--accent-red)'
  return '1px solid var(--accent-green)'
}
function walkTileIcon(state: TileState): string {
  return state === 'blocked' ? 'x' : ''
}

function doorTileBg(state: TileState): string {
  if (state === 'blocked') return 'color-mix(in srgb, var(--bg-primary) 60%, transparent)'
  return 'color-mix(in srgb, var(--bg-primary) 80%, transparent)'
}
function doorTileBorder(_state: TileState): string {
  return '1px solid var(--border-dim)'
}
function doorTileIcon(_state: TileState): string {
  return ''
}

function interactSpotTileBg(state: TileState): string {
  if (state === 'blocked') return 'color-mix(in srgb, var(--accent-red) 10%, transparent)'
  return 'color-mix(in srgb, var(--accent-green) 8%, transparent)'
}
function interactSpotTileBorder(_state: TileState): string {
  if (_state === 'blocked') return '1px solid var(--accent-red)'
  return '1px solid var(--border-dim)'
}
function interactSpotTileIcon(_state: TileState): string {
  return ''
}

type GridOverlay = 'none' | 'edges' | 'interactspots'

interface GridConfig {
  key: string
  label: string
  hint?: string
  tools: { label: string; active: boolean; onClick: () => void }[]
  tileBg: (s: TileState) => string
  tileBorder: (s: TileState) => string
  tileIcon: (s: TileState) => string
  onTileDown: (r: number, c: number, e: MouseEvent) => void
  onTileEnter?: (r: number, c: number) => void
  actions: { label: string; onClick: () => void; disabled?: boolean; active?: boolean }[]
  overlay: GridOverlay
  showColFill: boolean
  disabled?: boolean
}

const gridConfigs = computed<GridConfig[]>(() => [
  {
    key: 'walk',
    label: 'Walkable',
    hint: 'Paint tiles people can stand on. Blocked tiles stop movement.',
    tools: [
      { label: 'Walk', active: walkBrush.value === 'walkable', onClick: () => (walkBrush.value = 'walkable') },
      { label: 'Block', active: walkBrush.value === 'blocked', onClick: () => (walkBrush.value = 'blocked') },
    ],
    tileBg: walkTileBg,
    tileBorder: walkTileBorder,
    tileIcon: walkTileIcon,
    onTileDown: (r, c) => onWalkTileDown(r, c),
    onTileEnter: (r, c) => onWalkTileEnter(r, c),
    actions: [
      { label: 'All Walk', onClick: () => fillAllTiles('walkable') },
      { label: 'All Block', onClick: () => void fillAllTilesBlocked() },
    ],
    overlay: 'none',
    showColFill: true,
  },
  {
    key: 'door',
    label: 'Doors & Edges',
    hint: 'Click a tile edge to toggle a door. Walls are added under doors automatically.',
    tools: [
      { label: 'Door', active: doorTool.value === 'door', onClick: () => (doorTool.value = 'door') },
      { label: 'Edge', active: doorTool.value === 'border', onClick: () => (doorTool.value = 'border') },
      { label: 'Select', active: doorTool.value === 'select', onClick: () => (doorTool.value = 'select') },
    ],
    tileBg: doorTileBg,
    tileBorder: doorTileBorder,
    tileIcon: doorTileIcon,
    onTileDown: (r, c, e) => onDoorTileDown(r, c, e),
    actions: [
      { label: 'Outer Walls', onClick: blockOuterSides },
      { label: 'Clear Doors', onClick: clearAllDoors },
      { label: 'Clear Edges', onClick: () => void clearAllEdgesConfirmed() },
    ],
    overlay: 'edges',
    showColFill: false,
  },
  {
    key: 'interactspots',
    label: `Interact Spots - ${gridInteractSpots.value.length + gridEdgeSpots.value.length}`,
    hint: 'Click a walkable tile to add a guest spot. Spots snap to the nearest walkable cell in game.',
    tools: [],
    tileBg: interactSpotTileBg,
    tileBorder: interactSpotTileBorder,
    tileIcon: interactSpotTileIcon,
    onTileDown: (r, c) => onInteractSpotTileDown(r, c),
    actions: [
      { label: 'Fill All Walkable', onClick: fillAllInteractSpots },
      { label: 'Clear All', onClick: clearAllInteractSpots, disabled: gridInteractSpots.value.length === 0 },
    ],
    overlay: 'interactspots',
    showColFill: false,
  },
  {
    key: 'assign',
    label: 'Assign NPC',
    tools: [],
    tileBg: interactSpotTileBg,
    tileBorder: interactSpotTileBorder,
    tileIcon: interactSpotTileIcon,
    onTileDown: () => {},
    actions: [],
    overlay: 'none',
    showColFill: false,
  },
])

const activeGridTab = computed<GridTab>(() => props.activeTab ?? 'walk')
const activeGridConfig = computed(
  () => gridConfigs.value.find((config) => config.key === activeGridTab.value) ?? gridConfigs.value[0],
)

async function saveGrid() {
  const a = props.asset
  if (!a || isSavingGrid.value) return
  isSavingGrid.value = true
  editedGridDuringSave.value = false
  let ok = false
  try {
    const states = gridTiles.value.map((row) => [...row])
    const grid = states.map((row) => row.map((t) => t === 'walkable'))
    const wallSegments = reattachDoorModes(props.asset?.wallSegments, edgesToWallSegments(gridEdges.value))
    const interactSpots = [...gridInteractSpots.value, ...gridEdgeSpots.value].map((p) => ({ ...p }))
    const interact = normalizeInteractConfig({
      capacity: interactCapacity.value,
      durationMin: interactDurationMin.value,
      durationMax: interactDurationMax.value,
    })
    const queue = normalizeNpcQueueConfig({
      maxMembers: queueMaxMembers.value,
      admissionDepth: queueAdmissionDepth.value,
    })
    await store.updateAsset(a.id, {
      walkable: walkthrough.value,
      walkableGrid: grid,
      tileStates: states,
      wallSegments,
      interactSpots,
      interact,
      queue,
    })
    ok = true
    useToast().success('Walkable grid saved')
  } finally {
    isSavingGrid.value = false
    if (editedGridDuringSave.value) scheduleAutoSave()
    else if (ok) saveGridBaseline()
  }
}

const isSavingGrid = ref(false)
const editedGridDuringSave = ref(false)

watch([gridTiles, gridEdges, gridInteractSpots, gridEdgeSpots], () => {
  if (isSavingGrid.value) editedGridDuringSave.value = true
}, { deep: true })
</script>

<template>
  <div
    class="form__col"
    :style="{ '--tile-size': tilePx + 'px' }"
    @mouseup="onDragEnd"
    @mouseleave="onDragEnd"
    @wheel.stop
  >
    <div class="form__row">
      <span class="form__hint">{{ asset?.name ?? '' }} - {{ gridCols }}x{{ gridTiles.length }} tiles</span>
      <div class="walkablegrid__passable">
        <label>Passable</label>
        <button
          :class="{ 'flag--success': walkthrough, 'flag--danger': !walkthrough }"
          :title="
            walkthrough ? 'NPCs can walk through this object' : 'NPCs cannot walk through this object (solid wall)'
          "
          @click="walkthrough = !walkthrough"
        >
          {{ walkthrough ? 'ON' : 'OFF' }}
        </button>
      </div>
    </div>
    <div class="walkablegrid__layout">
      <div class="walkablegrid__layer">
        <div class="walkablegrid__label">Real Visual</div>
        <div class="walkablegrid__preview">
          <svg
            :ref="setPreviewEl"
            :viewBox="svgPreviewViewBox"
            preserveAspectRatio="xMidYMid meet"
            class="walkablegrid__fill"
            :style="previewVars"
          ></svg>
        </div>
      </div>

      <div class="walkablegrid__editor">
        <div v-if="activeGridConfig?.disabled" class="form__hint">
          Doors & Edges are ignored while Passable is ON - turn it OFF to edit walls and doors.
        </div>
        <div v-if="activeGridConfig?.hint" class="form__hint">
          {{ activeGridConfig.hint }}
        </div>
        <div v-if="activeGridConfig?.key !== 'assign'" class="walkablegrid__legend">
          <span class="walkablegrid__item"
            ><span class="walkablegrid__dot walkablegrid__dot--walkable"></span>Walkable</span
          >
          <span class="walkablegrid__item"
            ><span class="walkablegrid__dot walkablegrid__dot--blocked"></span>Blocked</span
          >
          <span class="walkablegrid__item"
            ><span class="walkablegrid__dot walkablegrid__dot--edge"></span>Wall edge</span
          >
          <span class="walkablegrid__item"
            ><span class="walkablegrid__dot walkablegrid__dot--edge walkablegrid__dot--door"></span>Door (door
            edge)</span
          >
          <span class="walkablegrid__item"
            ><span class="walkablegrid__dot walkablegrid__dot--edge walkablegrid__dot--selected"></span>Selected</span
          >
        </div>
        <div v-if="activeGridConfig?.key === 'assign'" class="form__row form__row--border">
          <label class="form__col"
            >Capacity
            <input
              v-model.number="interactCapacity"
              class="size--fit"
              type="number"
              min="0"
              :placeholder="String(gridInteractSpots.length + gridEdgeSpots.length)"
          /></label>
          <label class="form__col"
            >Min <input v-model.number="interactDurationMin" class="size--fit" type="number" min="0" step="0.1"
          /></label>
          <label class="form__col"
            >Max <input v-model.number="interactDurationMax" class="size--fit" type="number" min="0" step="0.1"
          /></label>
          <label class="form__col"
            >Queue <input v-model.number="queueMaxMembers" class="size--fit" type="number" min="1" max="100"
          /></label>
          <label class="form__col"
            >Admit <input v-model.number="queueAdmissionDepth" class="size--fit" type="number" min="1" max="20"
          /></label>
          <span class="form__hint"
            >Capacity 0 = one NPC per interactspot. Duration is random between Min and Max seconds.</span
          >
        </div>
        <div v-if="activeGridConfig?.key === 'interactspots'" class="form__row form__row--border">
          <span class="form__hint">Spots ({{ gridInteractSpots.length + gridEdgeSpots.length }}): stand = fixed point, edge = anchor sliding along one object side.</span>
          <ul class="form__row form--wrap">
            <li v-for="(spot, i) in gridInteractSpots" :key="'stand-spot-' + i">
              <svg :viewBox="standDiagrams[i]?.viewBox" width="56" role="img" :aria-label="`Stand spot ${i + 1} position`">
                <rect x="0" y="0" :width="standDiagrams[i]?.width ?? 0" :height="standDiagrams[i]?.height ?? 0" fill="none" stroke="var(--border-dim)" :stroke-width="standDiagrams[i]?.lineWidth ?? 1" />
                <circle :cx="standDiagrams[i]?.dotX ?? 0" :cy="standDiagrams[i]?.dotY ?? 0" :r="standDiagrams[i]?.dotR ?? 2" fill="var(--accent-green)" />
              </svg>
              <span class="form__hint">{{ edgeSpotLabel(spot) }}</span>
              <input
                :value="spot.post ?? ''"
                class="size--fit"
                type="text"
                placeholder="post name"
                :aria-label="`Post name for stand spot ${i + 1}`"
                @change="setSpotPost('stand', i, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" @click="convertSpotToEdge(i)">To edge</button>
            </li>
            <li v-for="(spot, i) in gridEdgeSpots" :key="'edge-spot-' + i">
              <svg :viewBox="edgeDiagrams[i]?.viewBox" width="56" role="img" :aria-label="`Edge spot ${i + 1} anchor`">
                <rect x="0" y="0" :width="edgeDiagrams[i]?.width ?? 0" :height="edgeDiagrams[i]?.height ?? 0" fill="none" stroke="var(--border-dim)" :stroke-width="edgeDiagrams[i]?.lineWidth ?? 1" />
                <line
                  :x1="edgeDiagrams[i]?.edgeX1 ?? 0" :y1="edgeDiagrams[i]?.edgeY1 ?? 0"
                  :x2="edgeDiagrams[i]?.edgeX2 ?? 0" :y2="edgeDiagrams[i]?.edgeY2 ?? 0"
                  stroke="var(--accent-green)" :stroke-width="(edgeDiagrams[i]?.lineWidth ?? 1) * 1.5" stroke-linecap="round"
                />
                <circle :cx="edgeDiagrams[i]?.dotX ?? 0" :cy="edgeDiagrams[i]?.dotY ?? 0" :r="edgeDiagrams[i]?.dotR ?? 2" fill="var(--accent-green)" />
              </svg>
              <span class="form__hint">{{ edgeSpotLabel(spot) }}</span>
              <select
                :value="spot.edge"
                :aria-label="`Edge side for edge spot ${i + 1}`"
                @change="setSpotEdge(i, ($event.target as HTMLSelectElement).value)"
              >
                <option value="N">N</option>
                <option value="S">S</option>
                <option value="E">E</option>
                <option value="W">W</option>
              </select>
              <input
                :value="spot.offset"
                class="size--fit"
                type="number"
                min="0"
                aria-label="Edge offset"
                @change="setSpotOffset(i, Number(($event.target as HTMLInputElement).value))"
              />
              <input
                :value="spot.post ?? ''"
                class="size--fit"
                type="text"
                placeholder="post name"
                :aria-label="`Post name for edge spot ${i + 1}`"
                @change="setSpotPost('edge', i, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" @click="convertSpotToStand(i)">To stand</button>
            </li>
          </ul>
          <span v-if="!gridInteractSpots.length && !gridEdgeSpots.length" class="empty">No spots - click a walkable tile</span>
        </div>
        <div v-if="activeGridConfig && activeGridConfig.key !== 'assign'" class="walkablegrid__layer">
          <div class="walkablegrid__label">
            <span>{{ activeGridConfig.label }}</span>
          </div>
          <div class="walkablegrid__grid" :style="{ '--cols': gridCols }" @mouseleave="hoverEdge = null">
            <span
              v-for="c in gridCols"
              :key="'col' + c"
              class="walkablegrid__col"
              role="button"
              tabindex="0"
              :aria-label="'Fill column ' + c"
              :title="activeGridConfig.showColFill ? 'Fill column ' + c : undefined"
              @click="activeGridConfig.showColFill && fillGridCol(c - 1)"
              @keydown.enter.prevent="activeGridConfig.showColFill && fillGridCol(c - 1)"
              >{{ c }}</span
            >
            <template v-for="(row, r) in gridTiles" :key="'row' + r">
              <span
                class="walkablegrid__row"
                role="button"
                tabindex="0"
                :aria-label="'Fill row ' + (r + 1)"
                :title="activeGridConfig.showColFill ? 'Fill row ' + (r + 1) : undefined"
                @click="activeGridConfig.showColFill && fillGridRow(r)"
                @keydown.enter.prevent="activeGridConfig.showColFill && fillGridRow(r)"
                >{{ r + 1 }}</span
              >
              <button
                v-for="(state, c) in row"
                :key="'tile' + r + '-' + c"
                type="button"
                class="walkablegrid__tile"
                :style="{ background: activeGridConfig.tileBg(state), border: activeGridConfig.tileBorder(state) }"
                :aria-label="activeGridConfig.key + ' grid ' + state + ' tile, row ' + (r + 1) + ' column ' + (c + 1)"
                @mousedown.prevent="activeGridConfig.onTileDown(r, c, $event)"
                @click="onTileActivate(r, c, $event)"
                @mouseenter="activeGridConfig.onTileEnter?.(r, c)"
                @mousemove="onDoorTileHover(r, c, $event)"
              >
                {{ activeGridConfig.tileIcon(state)
                }}<span
                  v-if="activeGridConfig.overlay === 'edges' && (gridEdges[r]?.[c]?.top || isPreviewEdge(r, c, 'top') || isSelectedEdge(r, c, 'top'))"
                  class="walkablegrid__mark walkablegrid__edge--top"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorTop || isPreviewEdge(r, c, 'top'), 'walkablegrid__edge--selected': isSelectedEdge(r, c, 'top') }"
                ></span
                ><span
                  v-if="activeGridConfig.overlay === 'edges' && (gridEdges[r]?.[c]?.right || isPreviewEdge(r, c, 'right') || isSelectedEdge(r, c, 'right'))"
                  class="walkablegrid__mark walkablegrid__edge--right"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorRight || isPreviewEdge(r, c, 'right'), 'walkablegrid__edge--selected': isSelectedEdge(r, c, 'right') }"
                ></span
                ><span
                  v-if="activeGridConfig.overlay === 'edges' && (gridEdges[r]?.[c]?.bottom || isPreviewEdge(r, c, 'bottom') || isSelectedEdge(r, c, 'bottom'))"
                  class="walkablegrid__mark walkablegrid__edge--bottom"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorBottom || isPreviewEdge(r, c, 'bottom'), 'walkablegrid__edge--selected': isSelectedEdge(r, c, 'bottom') }"
                ></span
                ><span
                  v-if="activeGridConfig.overlay === 'edges' && (gridEdges[r]?.[c]?.left || isPreviewEdge(r, c, 'left') || isSelectedEdge(r, c, 'left'))"
                  class="walkablegrid__mark walkablegrid__edge--left"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorLeft || isPreviewEdge(r, c, 'left'), 'walkablegrid__edge--selected': isSelectedEdge(r, c, 'left') }"
                ></span
                ><span
                  v-for="(a, ai) in activeGridConfig.overlay === 'interactspots' ? interactSpotsInTile(r, c) : []"
                  :key="'interactspot_' + r + '_' + c + '_' + ai"
                  class="walkablegrid__mark walkablegrid__spot"
                  :title="a.title"
                ></span>
              </button>
            </template>
          </div>
          <div class="walkablegrid__tools">
            <button
              v-for="t in activeGridConfig.tools"
              :key="t.label"
              type="button"
              :class="{ 'flag--active': t.active }"
              @click="t.onClick"
            >
              {{ t.label }}
            </button>
            <button v-for="a in activeGridConfig.actions" :key="a.label" :disabled="a.disabled" @click="a.onClick">
              {{ a.label }}
            </button>
          </div>
          <div v-if="activeGridConfig.key === 'door' && doorTool === 'select'" class="form__row form--wrap">
            <span class="form__hint">{{ selectedEdges.size }} edge{{ selectedEdges.size === 1 ? '' : 's' }} selected - click tile edges to toggle</span>
            <select
              :value="selectedDoorMode"
              aria-label="Door mode for selected edges"
              @change="selectedDoorMode = ($event.target as HTMLSelectElement).value as 'auto' | 'hold-open' | 'auto-close'"
            >
              <option value="auto">Auto</option>
              <option value="hold-open">Hold open</option>
              <option value="auto-close">Auto-close</option>
            </select>
            <button type="button" :disabled="!selectedEdges.size" @click="applyDoorModeToSelected">Apply mode</button>
            <button type="button" :disabled="!selectedEdges.size" @click="deleteSelectedDoors">Delete</button>
            <button type="button" :disabled="!selectedEdges.size" @click="clearEdgeSelection">Clear</button>
          </div>
        </div>
      </div>
    </div>

    <div class="form__row form__row--border">
      <span class="form__hint">{{ gridDirty ? 'Unsaved changes - auto-saving...' : 'All changes saved' }}</span>
      <span class="form__hint">Edits save automatically</span>
    </div>
  </div>
</template>
<style scoped>
.walkablegrid__layout {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  align-items: flex-start;
}

.walkablegrid__layout > .walkablegrid__layer,
.walkablegrid__editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-dim);
  padding: var(--gap-sm);
  width: 100%;
}

.walkablegrid__layer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  user-select: none;
}

.walkablegrid__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
}

.walkablegrid__grid {
  display: grid;
  grid-template-columns: 1fr repeat(var(--cols, 1), 1fr);
  place-content: center;
  gap: 0;
  flex: 1;
  flex-shrink: 0;
  width: fit-content;
  margin: auto;
}

.walkablegrid__grid::before {
  content: '';
  width: var(--tile-size, 40px);
  height: var(--tile-size, 40px);
}

.walkablegrid__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  padding: var(--gap-sm);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.walkablegrid__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-sm);
  color: var(--text-secondary);
  padding-bottom: var(--gap-sm);
}

.walkablegrid__item {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xxs);
}

.walkablegrid__dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
}

.walkablegrid__dot--walkable {
  background: color-mix(in srgb, var(--accent-green) 30%, transparent);
  border: 1px solid var(--accent-green);
}

.walkablegrid__dot--blocked {
  background: color-mix(in srgb, var(--accent-red) 30%, transparent);
  border: 1px solid var(--accent-red);
}

.walkablegrid__dot--edge {
  background: linear-gradient(to top, var(--accent-gold) 0 3px, transparent 3px);
}

.walkablegrid__dot--door {
  background: linear-gradient(to top, var(--accent-blue) 0 3px, transparent 3px);
}

.walkablegrid__dot--selected {
  background: linear-gradient(to top, var(--accent-primary) 0 3px, transparent 3px);
}

.walkablegrid__fill {
  width: 100%;
  height: 100%;
}

.walkablegrid__passable {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.walkablegrid__col,
.walkablegrid__row,
.walkablegrid__tile {
  width: var(--tile-size, 40px);
  height: var(--tile-size, 40px);
}

.walkablegrid__col,
.walkablegrid__row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  cursor: pointer;
}

.walkablegrid__tile {
  position: relative;
  display: grid;
  place-content: center;
  place-items: center;
  padding: 0;
}

.walkablegrid__tile:hover,
.walkablegrid__tile:active {
  border-color: inherit;
  color: inherit;
  background: inherit;
}

.walkablegrid__spot {
  position: absolute;
  inset: 0;
  margin: auto;
  width: calc(var(--tile-size, 32px) * 0.5);
  height: calc(var(--tile-size, 32px) * 0.5);
  border-radius: 50%;
  background: var(--accent-blue);
  outline: 1px solid var(--text-primary);
  z-index: var(--z-layer-1, 1);
}

.walkablegrid__mark {
  position: absolute;
  pointer-events: none;
}

.walkablegrid__edge--top,
.walkablegrid__edge--right,
.walkablegrid__edge--bottom,
.walkablegrid__edge--left {
  background: var(--accent-gold);
}

.walkablegrid__edge--door {
  background: var(--accent-blue);
}

.walkablegrid__edge--selected {
  background: var(--accent-primary);
}

.walkablegrid__edge--top {
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walkablegrid__edge--right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
}

.walkablegrid__edge--bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walkablegrid__edge--left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 2px;
}

.walkablegrid__tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}
</style>
