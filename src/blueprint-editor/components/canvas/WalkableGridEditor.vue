<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, nextTick } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { assetSvgVarStyle, assetFallbackShapeSvg, assetPreviewViewBox } from '../assetUtils'
import { useCanvasDefaults } from '../composables/useCanvasDefaults'
import { useSvgPreview } from '../composables/useSvgPreview'
import { useDirtyBaseline } from '../composables/useDirtyBaseline'
import { wallSegmentsToEdges, edgesToWallSegments, type TileEdges, type BorderSide } from '../gridEditing'
import type { AssetDef, TileState, InteractSpot } from '../types'
import { normalizeInteractConfig, normalizeNpcQueueConfig, resolveInteractForTarget } from '../types'

export type GridTab = 'walk' | 'door' | 'interactspots'

const props = defineProps<{ asset?: AssetDef; active: boolean; activeTab?: GridTab }>()

const store = useAssetsStore()
const confirm = useConfirm().confirm

const gridTiles = ref<TileState[][]>([])
const gridEdges = ref<TileEdges[][]>([])
const walkBrush = ref<TileState>('walkable')
const doorBrush = ref<'door' | 'border'>('door')
const isDraggingGrid = ref(false)
const previousGridAssetId = ref<string | null>(null)
const isRestoring = ref(false)

const gridInteractSpots = ref<InteractSpot[]>([])
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
  capacity: interactCapacity.value,
  durationMin: interactDurationMin.value,
  durationMax: interactDurationMax.value,
  maxMembers: queueMaxMembers.value,
  admissionDepth: queueAdmissionDepth.value,
}))

watch(gridDirty, (dirty) => {
  if (dirty) scheduleAutoSave()
})

let autoSaveTimer: number | null = null
const AUTO_SAVE_DELAY_MS = 300

function scheduleAutoSave() {
  if (autoSaveTimer !== null) window.clearTimeout(autoSaveTimer)
  autoSaveTimer = window.setTimeout(() => {
    autoSaveTimer = null
    void saveGrid()
  }, AUTO_SAVE_DELAY_MS)
}

function flushAutoSave() {
  if (autoSaveTimer !== null) {
    window.clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

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

const svgPreviewViewBox = computed(() => {
  const a = props.asset
  if (!a) return ''
  return assetPreviewViewBox(a, canvasTileSize.value)
})

const previewSvg = computed(
  () =>
    props.asset?.svg?.replace(/var\(--border-dim\)/g, '#fff') ??
    (props.asset ? assetFallbackShapeSvg(props.asset, canvasTileSize.value) : ''),
)
const previewVars = computed(() => assetSvgVarStyle(props.asset))

const previewSvgEl = ref<SVGSVGElement | null>(null)
const { render: renderPreview } = useSvgPreview(previewSvg, previewSvgEl)

watch([() => props.active, () => props.asset?.id], ([visible]) => {
  if (visible) nextTick(renderPreview)
})

watch(
  () => props.active,
  (visible) => {
    if (!visible) flushAutoSave()
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
      flushAutoSave()
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
        return
      }
    }

    if (props.asset) {
      initGridTiles(props.asset)
      gridInteractSpots.value = props.asset.interactSpots ? props.asset.interactSpots.map((p) => ({ ...p })) : []
      const resolved = resolveInteractForTarget(props.asset.interact, gridInteractSpots.value.length)
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

function interactSpotsInTile(r: number, c: number): { x: number; y: number; i: number }[] {
  const t = canvasTileSize.value
  const scale = tilePx.value / t
  const rows = gridTiles.value.length
  const cols = gridCols.value
  const found: { x: number; y: number; i: number }[] = []
  for (let i = 0; i < gridInteractSpots.value.length; i++) {
    const { x: ax, y: ay } = gridInteractSpots.value[i]
    let ac = Math.floor(ax / t)
    let ar = Math.floor(ay / t)
    if (ac >= cols) ac = cols - 1
    if (ar >= rows) ar = rows - 1
    if (ac === c && ar === r) {
      found.push({ x: (ax - c * t) * scale, y: (ay - r * t) * scale, i })
    }
  }
  return found
}

function toggleInteractSpotAt(r: number, c: number) {
  if (gridTiles.value[r]?.[c] !== 'walkable') {
    useToast().warning('Interactspots can only be placed on walkable tiles')
    return
  }
  const [x, y] = computeInteractSpotPx(r, c)
  const idx = interactSpotIndexAtPx(x, y)
  if (idx >= 0) gridInteractSpots.value.splice(idx, 1)
  else gridInteractSpots.value.push({ x, y })
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
          spots.push({ x, y })
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

function toggleEdgeAt(r: number, c: number, side: BorderSide) {
  const e = gridEdges.value[r]?.[c]
  if (!e) return
  e[side] = !e[side]
}

function onWalkTileDown(r: number, c: number) {
  isDraggingGrid.value = true
  paintTile(r, c, walkBrush.value)
}

function onWalkTileEnter(r: number, c: number) {
  if (!isDraggingGrid.value) return
  paintTile(r, c, walkBrush.value)
}

function onDoorTileDown(r: number, c: number, e: MouseEvent) {
  const side = detectEdgeSide(e)
  if (!side) return
  if (doorBrush.value === 'border') {
    toggleEdgeAt(r, c, side)
    return
  }
  toggleDoorAt(r, c, side)
}

function toggleDoorAt(r: number, c: number, side: BorderSide) {
  const e = gridEdges.value[r]?.[c]
  if (!e) return
  const key = `door${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof TileEdges
  if (e[key]) {
    delete e[key]
  } else {
    const wallKey = side as keyof TileEdges
    if (!e[wallKey]) e[wallKey] = true
    e[key] = true
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
    disabled: walkthrough.value,
    tools: [
      { label: 'Door', active: doorBrush.value === 'door', onClick: () => (doorBrush.value = 'door') },
      { label: 'Edge', active: doorBrush.value === 'border', onClick: () => (doorBrush.value = 'border') },
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
    label: `Interact Spots - ${gridInteractSpots.value.length}`,
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
])

const activeGridTab = computed<GridTab>(() => props.activeTab ?? 'walk')
const activeGridConfig = computed(
  () => gridConfigs.value.find((config) => config.key === activeGridTab.value) ?? gridConfigs.value[0],
)

async function saveGrid() {
  const a = props.asset
  if (!a) return
  const states = gridTiles.value.map((row) => [...row])
  const grid = states.map((row) => row.map((t) => t === 'walkable'))
  const wallSegments = edgesToWallSegments(gridEdges.value)
  const interactSpots = gridInteractSpots.value.map((p) => ({ ...p }))
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
  saveGridBaseline()
  useToast().success('Walkable grid saved')
}

onBeforeUnmount(() => {
  flushAutoSave()
})
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
            ref="previewSvgEl"
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
        <div class="walkablegrid__legend">
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
        </div>
        <div v-if="activeGridConfig?.key === 'interactspots'" class="form__row form__row--border">
          <label class="form__group"
            >Capacity
            <input
              v-model.number="interactCapacity"
              class="size--fit"
              type="number"
              min="0"
              :placeholder="String(gridInteractSpots.length)"
          /></label>
          <label class="form__group"
            >Min <input v-model.number="interactDurationMin" class="size--fit" type="number" min="0" step="0.1"
          /></label>
          <label class="form__group"
            >Max <input v-model.number="interactDurationMax" class="size--fit" type="number" min="0" step="0.1"
          /></label>
          <label class="form__group"
            >Queue <input v-model.number="queueMaxMembers" class="size--fit" type="number" min="1" max="100"
          /></label>
          <label class="form__group"
            >Admit <input v-model.number="queueAdmissionDepth" class="size--fit" type="number" min="1" max="20"
          /></label>
          <span class="form__hint"
            >Capacity 0 = one NPC per interactspot. Duration is random between Min and Max seconds.</span
          >
        </div>
        <div v-if="activeGridConfig" class="walkablegrid__layer">
          <div class="walkablegrid__label">
            <span>{{ activeGridConfig.label }}</span>
          </div>
          <div class="walkablegrid__grid" :style="{ '--cols': gridCols }">
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
              >
                {{ activeGridConfig.tileIcon(state)
                }}<span
                  v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.top"
                  class="walkablegrid__mark walkablegrid__edge--top"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorTop }"
                ></span
                ><span
                  v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.right"
                  class="walkablegrid__mark walkablegrid__edge--right"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorRight }"
                ></span
                ><span
                  v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.bottom"
                  class="walkablegrid__mark walkablegrid__edge--bottom"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorBottom }"
                ></span
                ><span
                  v-if="activeGridConfig.overlay === 'edges' && gridEdges[r]?.[c]?.left"
                  class="walkablegrid__mark walkablegrid__edge--left"
                  :class="{ 'walkablegrid__edge--door': gridEdges[r]?.[c]?.doorLeft }"
                ></span
                ><span
                  v-for="a in activeGridConfig.overlay === 'interactspots' ? interactSpotsInTile(r, c) : []"
                  :key="'interactspot_' + a.i"
                  class="walkablegrid__mark walkablegrid__spot"
                  :title="
                    'NPC interactspot IS' +
                    (a.i + 1) +
                    ' (' +
                    gridInteractSpots[a.i].x +
                    ', ' +
                    gridInteractSpots[a.i].y +
                    ')'
                  "
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
  flex-wrap: wrap;
  gap: var(--gap-sm);
  align-items: flex-start;
}

.walkablegrid__layout > .walkablegrid__layer,
.walkablegrid__editor {
  border: 1px solid var(--border-dim);
  padding: var(--gap-sm);
}

.walkablegrid__editor {
  display: flex;
  flex-direction: column;
  flex: 1 1 240px;
  max-width: 320px;
  gap: var(--gap-sm);
  min-width: 0;
}

.walkablegrid__layer {
  display: flex;
  flex-direction: column;
  flex: 1 1 320px;
  min-width: 0;
  gap: var(--gap-md);
  user-select: none;
  align-items: stretch;
}

.walkablegrid__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-dim);
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
  height: 300px;
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
  outline: 1px solid var(--text-bright);
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
