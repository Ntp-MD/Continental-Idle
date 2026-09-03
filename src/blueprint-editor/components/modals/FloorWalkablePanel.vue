<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useConfirm } from '@/composables/useConfirm'
import { STREET_TILES, type FloorData, type TileState, type WallSegment } from '../types'
import { segmentHasDoor, wallSegmentsToEdges, type TileEdges, type BorderSide } from '../gridEditing'
import { useDirtyBaseline } from '../composables/useDirtyBaseline'
import ModalShell from './ModalShell.vue'

type WalkableMode = 'walk' | 'door'

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

function toggleDoorAt(row: number, col: number, side: BorderSide): void {
  const e = gridEdges.value[row]?.[col]
  if (!e) return
  const doorKey = `door${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof TileEdges
  if (e[doorKey]) {
    delete e[doorKey]
  } else {
    const wallKey = side as keyof TileEdges
    if (!e[wallKey]) e[wallKey] = true
    e[doorKey] = true
  }
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
  const confirmed = await confirm({
    title: 'Clear walls',
    message: 'Remove all wall segments on this floor? This cannot be undone.',
    confirmLabel: 'Clear',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  wallSegments.value = []
  gridEdges.value = []
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
  wallSegments.value = (props.floor?.objects ?? [])
    .filter(
      (object) =>
        object.isWall && [object.x1, object.y1, object.x2, object.y2].every((value) => typeof value === 'number'),
    )
    .map((object) => {
      const seg: WallSegment = { x1: object.x1!, y1: object.y1!, x2: object.x2!, y2: object.y2! }
      if (object.door) seg.door = true
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
  if (activeMode.value === 'door') {
    const side = detectEdgeSide(e, e.currentTarget as HTMLElement)
    if (side) {
      toggleDoorAt(row, col, side)
    }
    return
  }
  tileStates.value[row][col] = walkBrush.value
}

function activateTile(row: number, col: number): void {
  if (activeMode.value === 'door') return
  tileStates.value[row][col] = walkBrush.value
}

function setMode(mode: WalkableMode): void {
  activeMode.value = mode
}

async function saveWalkable(): Promise<void> {
  if (!props.floor) return
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
  const segmentsWithDoor = wallSegments.value.map((seg) => {
    const result: WallSegment = { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2 }
    if (segmentHasDoor(seg, gridEdges.value)) result.door = true
    return result
  })
  const saved = await store.updateFloor(props.floor.id, {
    walkable: { walkableGrid, tileStates: states },
  })
  if (saved) await store.replaceCanvasWallSegments(props.floor.id, segmentsWithDoor)
  if (saved) saveBaseline()
}

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
}

function close(): void {
  emit('close')
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-walkable-setting" title="Walkable Setting" @close="close">
    <div class="form__row" role="toolbar" aria-label="Walkable setting tools">
      <button type="button" :class="{ 'flag--warning': activeMode === 'walk' }" @click="setMode('walk')">
        Wall / Block
      </button>
      <button type="button" :class="{ 'flag--warning': activeMode === 'door' }" @click="setMode('door')">
        Door / Door
      </button>
      <template v-if="activeMode === 'walk'">
        <button type="button" :class="{ 'flag--warning': walkBrush === 'walkable' }" @click="walkBrush = 'walkable'">
          Walk
        </button>
        <button type="button" :class="{ 'flag--warning': walkBrush === 'blocked' }" @click="walkBrush = 'blocked'">
          Block
        </button>
      </template>
      <template v-else>
        <button type="button" @click="applyOuterWall">Outer Walls</button>
        <button type="button" @click="clearAllDoors">Clear Doors</button>
        <button type="button" @click="clearAllEdges">Clear Walls</button>
      </template>
    </div>

    <div class="form__row walk__legend" aria-label="Walkable legend">
      <span><i class="swatch walk__swatch--walkable" />Walkable</span>
      <span><i class="swatch walk__swatch--blocked" />Blocked</span>
      <span><i class="swatch walk__swatch--wall" />Wall edge</span>
      <span><i class="swatch walk__swatch--door" />Door (door edge)</span>
    </div>

    <div
      class="walk__grid"
      :style="gridStyle"
      role="grid"
      :aria-label="`${buildingCols} by ${buildingRows} walkable grid`"
    >
      <template v-for="rowIndex in buildingRows" :key="`walk-row-${rowIndex}`">
        <button
          v-for="colIndex in buildingCols"
          :key="`walk-cell-${rowIndex}-${colIndex}`"
          type="button"
          class="walk__cell"
          :class="`walk__cell--${tileState(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)}`"
          :aria-label="`Row ${rowIndex}, column ${colIndex}, ${tileState(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)}`"
          @mousedown.prevent="updateTile(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1, $event)"
          @click="activateTile(buildingStartRow + rowIndex - 1, buildingStartCol + colIndex - 1)"
        >
          <span
            v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.top"
            class="walk__edge walk__edge--top"
            :class="{
              'walk__edge--door':
                gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorTop,
            }"
          ></span>
          <span
            v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.right"
            class="walk__edge walk__edge--right"
            :class="{
              'walk__edge--door':
                gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorRight,
            }"
          ></span>
          <span
            v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.bottom"
            class="walk__edge walk__edge--bottom"
            :class="{
              'walk__edge--door':
                gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorBottom,
            }"
          ></span>
          <span
            v-if="gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.left"
            class="walk__edge walk__edge--left"
            :class="{
              'walk__edge--door':
                gridEdges[buildingStartRow + rowIndex - 1]?.[buildingStartCol + colIndex - 1]?.doorLeft,
            }"
          ></span>
        </button>
      </template>
    </div>

    <template #footer>
      <span class="form__hint">{{ dirty ? 'Unsaved walkable changes' : 'Walkable saved' }}</span>
      <div class="form__row">
        <button type="button" class="flag--ghost" @click="resetWalkable">Reset to floor default</button>
        <button type="button" class="flag--success" :disabled="!dirty" @click="saveWalkable">Save Walkable</button>
      </div>
    </template>
  </ModalShell>
</template>
<style scoped>
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

.walk__grid {
  display: grid;
  grid-template-columns: repeat(var(--walk-cols), minmax(0, 1fr));
  width: min(100%, 900px);
  aspect-ratio: var(--walk-cols) / auto;
  border: 1px solid var(--border-dim);
  background: var(--bg-primary);
  margin: 0 auto;
}

.walk__cell {
  position: relative;
  min-width: 0;
  aspect-ratio: 1;
  padding: 0;
  border-radius: 0;
  cursor: crosshair;
}

.walk__edge {
  position: absolute;
  pointer-events: none;
  background: var(--accent-gold);
}

.walk__edge--door {
  background: var(--accent-blue);
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
