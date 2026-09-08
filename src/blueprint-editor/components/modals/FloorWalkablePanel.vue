<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { STREET_TILES, type FloorData, type TileState, type WallSegment } from '../../domain/types'
import { edgesToWallSegments, reattachDoorModes, wallSegmentsToEdges, tileEdgeKey, doorKeyForSide, mirrorTileEdge, segmentCoversTileEdge, type TileEdges, type BorderSide } from '../../domain/gridEditing'
import { useDirtyBaseline } from '../../composables/useDirtyBaseline'
import { useDebouncedCallback } from '@/composables/useDebounceFn'
import ModalShell from '../shell/ModalShell.vue'

type WalkableMode = 'walk' | 'wall' | 'door' | 'select'

const props = defineProps<{
  streetTiles?: number
  open: boolean
  floor?: FloorData
}>()
const emit = defineEmits<{ (event: 'close'): void }>()

const store = useAssetsStore()
const confirm = useConfirm().confirm
const activeMode = ref<WalkableMode>('walk')
const walkBrush = ref<TileState>('walkable')
const tileStates = ref<TileState[][]>([])
const wallSegments = ref<WallSegment[]>([])
const gridEdges = ref<TileEdges[][]>([])
const { dirty, saveBaseline } = useDirtyBaseline(() => ({
  tileStates: tileStates.value,
  wallSegments: wallSegments.value,
  gridEdges: gridEdges.value,
}))

function wallKey(segment: WallSegment): string {
  return `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`
}

function addWall(segment: WallSegment): void {
  const key = wallKey(segment)
  const existing = wallSegments.value.find((item) => wallKey(item) === key)
  if (existing) {
    if (segment.door) existing.door = true
    return
  }
  wallSegments.value.push(segment)
}

function detectEdgeSide(e: MouseEvent, target: HTMLElement): BorderSide | null {
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

function updateMirroredEdge(row: number, col: number, side: BorderSide, update: (edges: TileEdges, edgeSide: BorderSide) => void): void {
  const target = gridEdges.value[row]?.[col]
  if (target) update(target, side)
  const mirror = mirrorTileEdge(row, col, side)
  const mirrorCell = gridEdges.value[mirror.r]?.[mirror.c]
  if (mirrorCell) update(mirrorCell, mirror.side)
}

function toggleDoorAt(row: number, col: number, side: BorderSide): void {
  const e = gridEdges.value[row]?.[col]
  if (!e) return
  if (e[doorKeyForSide(side)]) {
    updateMirroredEdge(row, col, side, (cell, s) => {
      delete cell[doorKeyForSide(s)]
    })
  } else {
    updateMirroredEdge(row, col, side, (cell, s) => {
      cell[s] = true
      cell[doorKeyForSide(s)] = true
    })
  }
}

function toggleWallAt(row: number, col: number, side: BorderSide): void {
  const e = gridEdges.value[row]?.[col]
  if (!e) return
  if (e[side]) {
    updateMirroredEdge(row, col, side, (cell, s) => {
      delete cell[s]
      delete cell[doorKeyForSide(s)]
    })
  } else {
    updateMirroredEdge(row, col, side, (cell, s) => {
      cell[s] = true
    })
  }
}

const selectedEdges = ref<Set<string>>(new Set())
const selectedTiles = ref<Set<string>>(new Set())
const selectedDoorMode = ref<'auto' | 'hold-open' | 'auto-close'>('auto')
const hoverEdge = ref<{ r: number; c: number; side: BorderSide } | null>(null)
const selectAnchor = ref<{ r: number; c: number } | null>(null)
const selectDraft = ref<{ r: number; c: number } | null>(null)

function tileKey(row: number, col: number): string {
  return `${row},${col}`
}

function toggleTileSelection(row: number, col: number): void {
  const key = tileKey(row, col)
  if (selectedTiles.value.has(key)) selectedTiles.value.delete(key)
  else selectedTiles.value.add(key)
}

function onSelectDown(row: number, col: number, e: MouseEvent): void {
  const side = detectEdgeSide(e, e.currentTarget as HTMLElement)
  if (side) {
    const key = tileEdgeKey(row, col, side)
    if (selectedEdges.value.has(key)) selectedEdges.value.delete(key)
    else selectedEdges.value.add(key)
    selectAnchor.value = null
    selectDraft.value = null
    return
  }
  selectAnchor.value = { r: row, c: col }
  selectDraft.value = { r: row, c: col }
}

function onSelectEnter(row: number, col: number): void {
  if (activeMode.value !== 'select' || !selectAnchor.value) return
  selectDraft.value = { r: row, c: col }
}

function onSelectUp(): void {
  const anchor = selectAnchor.value
  const draft = selectDraft.value
  selectAnchor.value = null
  selectDraft.value = null
  if (activeMode.value !== 'select' || !anchor || !draft) return
  if (anchor.r === draft.r && anchor.c === draft.c) {
    toggleTileSelection(anchor.r, anchor.c)
    return
  }
  const top = Math.min(anchor.r, draft.r)
  const bottom = Math.max(anchor.r, draft.r)
  const left = Math.min(anchor.c, draft.c)
  const right = Math.max(anchor.c, draft.c)
  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) selectedTiles.value.add(tileKey(r, c))
  }
}

function cancelBoxSelect(): void {
  selectAnchor.value = null
  selectDraft.value = null
}

function clearSelection(): void {
  selectedEdges.value.clear()
  selectedTiles.value.clear()
}

function isSelectedTile(row: number, col: number): boolean {
  if (activeMode.value !== 'select') return false
  if (selectedTiles.value.has(tileKey(row, col))) return true
  const anchor = selectAnchor.value
  const draft = selectDraft.value
  if (!anchor || !draft) return false
  const top = Math.min(anchor.r, draft.r)
  const bottom = Math.max(anchor.r, draft.r)
  const left = Math.min(anchor.c, draft.c)
  const right = Math.max(anchor.c, draft.c)
  return row >= top && row <= bottom && col >= left && col <= right
}

function isSelectedEdge(row: number, col: number, side: BorderSide): boolean {
  return activeMode.value === 'select' && selectedEdges.value.has(tileEdgeKey(row, col, side))
}

type EdgeKind = 'Door' | 'Wall' | 'Empty'

function edgeKind(row: number, col: number, side: BorderSide): EdgeKind {
  const edges = gridEdges.value[row]?.[col]
  if (!edges) return 'Empty'
  if (edges[doorKeyForSide(side)]) return 'Door'
  if (edges[side]) return 'Wall'
  return 'Empty'
}

interface SelectionItem {
  key: string
  label: string
}

const selectionItems = computed<SelectionItem[]>(() => {
  const items: SelectionItem[] = []
  for (const key of selectedTiles.value) {
    const [r, c] = key.split(',').map(Number)
    const state = tileStates.value[r]?.[c] ?? 'blocked'
    items.push({ key: `tile-${key}`, label: `Tile R${r - buildingStartRow.value + 1} C${c - buildingStartCol.value + 1} - ${state === 'walkable' ? 'Walkable' : 'Blocked'}` })
  }
  for (const key of selectedEdges.value) {
    const [r, c, side] = key.split(',')
    items.push({ key: `edge-${key}`, label: `Edge R${Number(r) - buildingStartRow.value + 1} C${Number(c) - buildingStartCol.value + 1} ${side} - ${edgeKind(Number(r), Number(c), side as BorderSide)}` })
  }
  return items.slice(0, 12)
})

const selectionRemainder = computed(() => selectedTiles.value.size + selectedEdges.value.size - selectionItems.value.length)

const selectionSummary = computed(() => {
  const tileCount = selectedTiles.value.size
  const edgeCount = selectedEdges.value.size
  if (!tileCount && !edgeCount) return 'Nothing selected - click a tile, drag a box, or click a tile edge'
  const parts: string[] = []
  if (tileCount) {
    let walkable = 0
    for (const key of selectedTiles.value) {
      const [r, c] = key.split(',').map(Number)
      if (tileStates.value[r]?.[c] === 'walkable') walkable++
    }
    parts.push(`${tileCount} tile${tileCount === 1 ? '' : 's'} (${walkable} walkable, ${tileCount - walkable} blocked)`)
  }
  if (edgeCount) {
    let doors = 0
    let walls = 0
    for (const key of selectedEdges.value) {
      const [r, c, side] = key.split(',')
      const kind = edgeKind(Number(r), Number(c), side as BorderSide)
      if (kind === 'Door') doors++
      else if (kind === 'Wall') walls++
    }
    parts.push(`${edgeCount} edge${edgeCount === 1 ? '' : 's'} (${doors} door${doors === 1 ? '' : 's'}, ${walls} wall${walls === 1 ? '' : 's'}, ${edgeCount - doors - walls} empty)`)
  }
  return `${parts.join(', ')} selected`
})

function isPreviewEdge(row: number, col: number, side: BorderSide): boolean {
  const hover = hoverEdge.value
  if (!hover || (activeMode.value !== 'door' && activeMode.value !== 'wall')) return false
  if (hover.r !== row || hover.c !== col || hover.side !== side) return false
  const edges = gridEdges.value[row]?.[col]
  if (!edges) return false
  if (activeMode.value === 'wall') return !edges[side]
  return !edges[doorKeyForSide(side)]
}

function onTileHover(row: number, col: number, e: MouseEvent): void {
  if (activeMode.value !== 'door' && activeMode.value !== 'wall') {
    if (hoverEdge.value) hoverEdge.value = null
    return
  }
  const side = detectEdgeSide(e, e.currentTarget as HTMLElement)
  const prev = hoverEdge.value
  if (side === null) {
    if (prev) hoverEdge.value = null
    return
  }
  if (!prev || prev.r !== row || prev.c !== col || prev.side !== side) hoverEdge.value = { r: row, c: col, side }
}

function deleteSelectedDoors(): void {
  if (!selectedEdges.value.size || !props.floor) return
  for (const key of selectedEdges.value) {
    const [r, c, side] = key.split(',')
    updateMirroredEdge(Number(r), Number(c), side as BorderSide, (cell, s) => {
      delete cell[s]
      delete cell[doorKeyForSide(s)]
    })
  }
  selectedEdges.value.clear()
}

async function applyDoorModeToSelected(): Promise<void> {
  const floor = props.floor
  if (!floor || !selectedEdges.value.size) return
  const picked = new Set<string>()
  const selected = [...selectedEdges.value].map(key => {
    const [r, c, side] = key.split(',')
    return { r: Number(r), c: Number(c), side: side as BorderSide }
  })
  for (const object of floor.objects) {
    if (!object.isWall || object.door !== true) continue
    if ([object.x1, object.y1, object.x2, object.y2].some(value => typeof value !== 'number')) continue
    const segment = { x1: object.x1!, y1: object.y1!, x2: object.x2!, y2: object.y2! }
    if (selected.some(entry => segmentCoversTileEdge(segment, entry.r, entry.c, entry.side))) picked.add(object.id)
  }
  if (!picked.size) {
    useToast().warning('No wall doors touch the selected edges')
    return
  }
  const mode = selectedDoorMode.value === 'auto' ? undefined : selectedDoorMode.value
  const ids = [...picked]
  const saved = await store.setWallDoorMode(floor.id, ids, mode)
  if (!saved) useToast().error('Failed to save door mode')
  else useToast().success(`Door mode set on ${picked.size} wall${picked.size === 1 ? '' : 's'}`)
  selectedEdges.value.clear()
}

function applyOuterWall(): void {
  for (let row = buildingStartRow.value; row < buildingEndRow.value; row++) {
    for (let col = buildingStartCol.value; col < buildingEndCol.value; col++) {
      if (row === buildingStartRow.value) addWall({ x1: col, y1: row, x2: col + 1, y2: row })
      if (row === buildingEndRow.value - 1) addWall({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 })
      if (col === buildingStartCol.value) addWall({ x1: col, y1: row, x2: col, y2: row + 1 })
      if (col === buildingEndCol.value - 1) addWall({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 })
    }
  }
  syncEdgesFromSegments()
}

function clearAllDoors(): void {
  wallSegments.value = wallSegments.value.map((seg) => {
    const { door: _door, ...rest } = seg
    return rest as WallSegment
  })
  syncEdgesFromSegments()
}

async function clearAllEdges(): Promise<void> {
  if (!props.floor) return
  const confirmed = await confirm({
    title: 'Clear walls',
    message: 'Remove all walls and doors on this floor? This cannot be undone.',
    confirmLabel: 'Clear',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const saved = await store.replaceCanvasWallSegments(props.floor.id, [])
  if (!saved) {
    useToast().error('Failed to clear walls')
    return
  }
  wallSegments.value = []
  gridEdges.value = []
  saveBaseline()
  useToast().success('Walls cleared')
}

const tileSize = computed(() => Math.max(1, Math.round(store.state.layout.canvas.tileSize)))
const cols = computed(() => Math.max(1, Math.ceil(store.state.layout.canvas.width / tileSize.value)))
const rows = computed(() => Math.max(1, Math.ceil(store.state.layout.canvas.height / tileSize.value)))
const resolvedStreetTiles = computed(() => props.streetTiles ?? STREET_TILES)
const buildingStartRow = computed(() => Math.min(resolvedStreetTiles.value, Math.floor(rows.value / 2)))
const buildingEndRow = computed(() => Math.max(rows.value - resolvedStreetTiles.value, buildingStartRow.value))
const buildingStartCol = computed(() => Math.min(resolvedStreetTiles.value, Math.floor(cols.value / 2)))
const buildingEndCol = computed(() => Math.max(cols.value - resolvedStreetTiles.value, buildingStartCol.value))
const buildingRows = computed(() => buildingEndRow.value - buildingStartRow.value)
const buildingCols = computed(() => buildingEndCol.value - buildingStartCol.value)
const gridStyle = computed(() => ({ '--walk-cols': buildingCols.value }))

function createTileStates(floor?: FloorData): TileState[][] {
  const existing = floor?.walkable?.tileStates
  if (existing?.length === rows.value && existing.every((row) => row.length === cols.value)) {
    return existing.map((row) => row.map((t) => (t === 'door' ? 'walkable' : t)))
  }
  const existingGrid = floor?.walkable?.walkableGrid
  if (existingGrid?.length === rows.value && existingGrid.every((row) => row.length === cols.value)) {
    return existingGrid.map((row) => row.map((cell) => (cell ? 'walkable' : 'blocked')))
  }
  const fallback: TileState = floor?.defaultWalkable === false ? 'blocked' : 'walkable'
  return Array.from({ length: rows.value }, () => Array.from({ length: cols.value }, () => fallback))
}

function syncEdgesFromSegments(): void {
  gridEdges.value = wallSegmentsToEdges(wallSegments.value, rows.value, cols.value)
}

function resetDraft(): void {
  tileStates.value = createTileStates(props.floor)
  selectedEdges.value.clear()
  selectedTiles.value.clear()
  cancelBoxSelect()
  hoverEdge.value = null
  wallSegments.value = (props.floor?.objects ?? [])
    .filter(
      (object) =>
        object.isWall && [object.x1, object.y1, object.x2, object.y2].every((value) => typeof value === 'number'),
    )
    .map((object) => {
      const seg: WallSegment = { x1: object.x1!, y1: object.y1!, x2: object.x2!, y2: object.y2! }
      if (object.door) seg.door = true
      if (object.doorMode !== undefined) seg.doorMode = object.doorMode
      return seg
    })
  syncEdgesFromSegments()
  saveBaseline()
}

watch(
  () => [props.open, props.floor?.id, cols.value, rows.value],
  ([open]) => {
    if (open) resetDraft()
  },
  { immediate: true },
)

function tileState(row: number, col: number): TileState {
  return tileStates.value[row]?.[col] ?? 'blocked'
}

function updateTile(row: number, col: number, e: MouseEvent): void {
  if (activeMode.value === 'select') {
    onSelectDown(row, col, e)
    return
  }
  if (activeMode.value === 'door') {
    const side = detectEdgeSide(e, e.currentTarget as HTMLElement)
    if (side) {
      toggleDoorAt(row, col, side)
    }
    return
  }
  if (activeMode.value === 'wall') {
    const side = detectEdgeSide(e, e.currentTarget as HTMLElement)
    if (side) {
      toggleWallAt(row, col, side)
    }
    return
  }
  tileStates.value[row][col] = walkBrush.value
}

function activateTile(row: number, col: number): void {
  if (activeMode.value !== 'walk') return
  tileStates.value[row][col] = walkBrush.value
}

function setMode(mode: WalkableMode): void {
  activeMode.value = mode
  if (mode !== 'select') cancelBoxSelect()
}

async function saveWalkable(): Promise<void> {
  if (!props.floor || isSavingWalkable.value) return
  isSavingWalkable.value = true
  editedDuringSave.value = false
  let ok = false
  try {
    const states = tileStates.value.map((row) => [...row])
    for (let row = 0; row < rows.value; row++) {
      for (let col = 0; col < cols.value; col++) {
        const isStreet =
          row < buildingStartRow.value ||
          row >= buildingEndRow.value ||
          col < buildingStartCol.value ||
          col >= buildingEndCol.value
        if (isStreet) states[row][col] = 'walkable'
      }
    }
    const walkableGrid = states.map((row) => row.map((state) => state === 'walkable'))
    const segmentsWithDoor = reattachDoorModes(wallSegments.value, edgesToWallSegments(gridEdges.value))
    const saved = await store.updateFloor(props.floor.id, {
      walkable: { walkableGrid, tileStates: states },
    })
    const wallsSaved = saved ? await store.replaceCanvasWallSegments(props.floor.id, segmentsWithDoor) : false
    if (saved && wallsSaved) {
      applyingOwnWalkable.value = true
      try {
        wallSegments.value = segmentsWithDoor.map((seg) => ({ ...seg }))
        syncEdgesFromSegments()
      } finally {
        applyingOwnWalkable.value = false
      }
      ok = true
      useToast().success('Walkable saved')
    } else {
      useToast().error('Failed to save walkable')
    }
  } finally {
    isSavingWalkable.value = false
    if (editedDuringSave.value) scheduleAutoSave()
    else if (ok) saveBaseline()
  }
}

const isSavingWalkable = ref(false)
const applyingOwnWalkable = ref(false)
const editedDuringSave = ref(false)

watch([tileStates, wallSegments, gridEdges], () => {
  if (isSavingWalkable.value && !applyingOwnWalkable.value) editedDuringSave.value = true
}, { deep: true })

const scheduleAutoSave = useDebouncedCallback(() => {
  void saveWalkable()
}, 300)

watch(dirty, (isDirty) => {
  if (isDirty && !isSavingWalkable.value) scheduleAutoSave()
})

async function resetWalkable(): Promise<void> {
  const confirmed = await confirm({
    title: 'Reset walkable grid',
    message: 'Reset the whole grid and remove all walls? This cannot be undone.',
    confirmLabel: 'Reset',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const fallback: TileState = props.floor?.defaultWalkable === false ? 'blocked' : 'walkable'
  tileStates.value = Array.from({ length: rows.value }, (_, row) =>
    Array.from({ length: cols.value }, (_, col) => {
      const isStreet =
        row < buildingStartRow.value ||
        row >= buildingEndRow.value ||
        col < buildingStartCol.value ||
        col >= buildingEndCol.value
      return isStreet ? 'walkable' : fallback
    }),
  )
  wallSegments.value = []
  gridEdges.value = []
  selectedEdges.value.clear()
  selectedTiles.value.clear()
  cancelBoxSelect()
}

function close(): void {
  if (dirty.value) scheduleAutoSave.flush()
  else scheduleAutoSave.cancel()
  emit('close')
}
</script>

<template>
  <ModalShell
    :open="open"
    modal-id="modal-walkable-setting"
    title="Walkable Setting"
    :status="dirty ? 'Unsaved walkable changes - auto-saving...' : 'Walkable saved'"
    :status-tone="dirty ? 'warn' : 'success'"
    @close="close"
  >
    <div class="form__row form--wrap" role="toolbar" aria-label="Walkable setting tools">
      <button type="button" :class="{ 'flag--warning': activeMode === 'walk' }" @click="setMode('walk')">
        Walkable
      </button>
      <button type="button" :class="{ 'flag--warning': activeMode === 'wall' }" @click="setMode('wall')">
        Wall
      </button>
      <button type="button" :class="{ 'flag--warning': activeMode === 'door' }" @click="setMode('door')">
        Door
      </button>
      <button type="button" :class="{ 'flag--warning': activeMode === 'select' }" @click="setMode('select')">
        Select
      </button>
      <template v-if="activeMode === 'walk'">
        <button type="button" :class="{ 'flag--warning': walkBrush === 'walkable' }" @click="walkBrush = 'walkable'">
          Walk
        </button>
        <button type="button" :class="{ 'flag--warning': walkBrush === 'blocked' }" @click="walkBrush = 'blocked'">
          Block
        </button>
      </template>
      <template v-else-if="activeMode === 'wall'">
        <button type="button" @click="clearAllEdges">Clear Walls</button>
      </template>
      <template v-else-if="activeMode === 'door'">
        <button type="button" @click="applyOuterWall">Outer Walls</button>
        <button type="button" @click="clearAllDoors">Clear Doors</button>
      </template>
      <div v-if="activeMode === 'select'" class="form__col">
        <div class="form__row form--wrap">
          <span class="form__hint">{{ selectionSummary }}</span>
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
          <button type="button" :disabled="!selectedEdges.size" @click="deleteSelectedDoors">Delete doors + walls</button>
          <button type="button" :disabled="!selectedEdges.size && !selectedTiles.size" @click="clearSelection">Clear</button>
        </div>
        <div v-if="selectionItems.length" class="form__col" aria-label="Current selection">
          <span v-for="item in selectionItems" :key="item.key" class="form__hint">{{ item.label }}</span>
          <span v-if="selectionRemainder > 0" class="form__hint">and {{ selectionRemainder }} more...</span>
        </div>
      </div>
    </div>

    <div v-if="activeMode === 'walk'" class="form__hint">Paint walkable or blocked tiles. Blocked tiles stop movement.</div>
    <div v-else-if="activeMode === 'wall'" class="form__hint">Click a tile edge to toggle a wall. Removing a wall also removes its door.</div>
    <div v-else-if="activeMode === 'door'" class="form__hint">Click a tile edge to toggle a door. Walls are added under doors automatically.</div>
    <div v-else class="form__hint">Click a tile or drag a box to select tiles, click a tile edge to select it. Apply a door mode or delete doors and walls on selected edges.</div>

    <div class="form__row form--wrap walk__legend" aria-label="Walkable legend">
      <span><i class="swatch walk__swatch--walkable" />Walkable</span>
      <span><i class="swatch walk__swatch--blocked" />Blocked</span>
      <span><i class="swatch walk__swatch--wall" />Wall edge</span>
      <span><i class="swatch walk__swatch--door" />Door (door edge)</span>
      <span><i class="swatch walk__swatch--selected" />Selected</span>
    </div>

      <div
        class="walk__grid"
        :style="gridStyle"
        role="grid"
        :aria-label="`${buildingCols} by ${buildingRows} walkable grid`"
        @mouseleave="hoverEdge = null; cancelBoxSelect()"
        @mouseup="onSelectUp"
      >
      <template v-for="rowIndex in buildingRows" :key="`walk-row-${rowIndex}`">
        <button
          v-for="colIndex in buildingCols"
          :key="`walk-cell-${rowIndex}-${colIndex}`"
          type="button"
          class="walk__cell"
          :class="[`walk__cell--${tileState(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)}`, { 'walk__cell--selected': isSelectedTile(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1) }]"
          :aria-label="`Row ${rowIndex}, column ${colIndex}, ${tileState(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)}`"
            @mousedown.prevent="updateTile(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, $event)"
            @click="activateTile(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)"
            @mouseenter="onSelectEnter(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)"
            @mousemove="onTileHover(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, $event)"
          >
            <span
              v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.top || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'top') || isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'top')"
              class="walk__edge walk__edge--top"
              :class="{
                'walk__edge--door':
                  gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorTop || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'top'),
                'walk__edge--selected': isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'top'),
              }"
            ></span>
            <span
              v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.right || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'right') || isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'right')"
              class="walk__edge walk__edge--right"
              :class="{
                'walk__edge--door':
                  gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorRight || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'right'),
                'walk__edge--selected': isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'right'),
              }"
            ></span>
            <span
              v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.bottom || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'bottom') || isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'bottom')"
              class="walk__edge walk__edge--bottom"
              :class="{
                'walk__edge--door':
                  gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorBottom || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'bottom'),
                'walk__edge--selected': isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'bottom'),
              }"
            ></span>
            <span
              v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.left || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'left') || isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'left')"
              class="walk__edge walk__edge--left"
              :class="{
                'walk__edge--door':
                  gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorLeft || isPreviewEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'left'),
                'walk__edge--selected': isSelectedEdge(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, 'left'),
              }"
            ></span>
        </button>
      </template>
    </div>

    <template #footer>
      <div class="form__row">
        <button type="button" @click="resetWalkable">Reset to floor default</button>
        <button type="button" class="flag--success" :disabled="!dirty || isSavingWalkable" @click="saveWalkable">Save Walkable</button>
      </div>
    </template>
  </ModalShell>
</template>
<style>
.walk__legend {
  color: var(--text-secondary);
}

.walk__legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
}

.walk__swatch--walkable,
.walk__cell--walkable {
  background: color-mix(in srgb, var(--accent-green) 35%, var(--bg-primary));
}

.walk__swatch--blocked,
.walk__cell--blocked {
  background: var(--bg-primary);
}

.walk__swatch--wall {
  border-color: var(--accent-gold);
  border-style: solid;
  border-width: 2px;
}

.walk__swatch--door {
  border-color: var(--accent-blue);
  border-style: solid;
  border-width: 2px;
}

.walk__swatch--selected {
  border-color: var(--accent-primary);
  border-style: solid;
  border-width: 2px;
}

.walk__grid {
  display: grid;
  grid-template-columns: repeat(var(--walk-cols), minmax(0, 1fr));
  width: min(100%, 900px);
  border: 1px solid var(--border-dim);
  background: var(--bg-primary);
  margin: 0 auto;
}

.walk__cell {
  position: relative;
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1;
  padding: 0;
  border-radius: 0;
  cursor: crosshair;
}

.walk__cell--selected {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.walk__edge {
  position: absolute;
  pointer-events: none;
  background: var(--accent-gold);
}

.walk__edge--door {
  background: var(--accent-blue);
}

.walk__edge--selected {
  background: var(--accent-primary);
}

.walk__edge--top {
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walk__edge--right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
}

.walk__edge--bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walk__edge--left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 2px;
}
</style>

<style>
#modal-walkable-setting {
  width: min(94vw, 1000px);
  max-height: calc(100vh - 32px);
}
</style>
