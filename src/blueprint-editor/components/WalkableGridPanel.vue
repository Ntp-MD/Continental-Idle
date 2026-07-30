<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '../composables/useToast'
import { useWalkableGridPanel } from '../composables/useWalkableGridPanel'
import { renderSvgInto } from '../svgSanitizer'
import type { AssetDef, TileState, TileEdges } from '../types'

type BorderSide = 'top' | 'right' | 'bottom' | 'left'

const store = useAssetsStore()
const { showWalkableGridPanel, closeWalkableGridPanel } = useWalkableGridPanel()

const svgAsset = computed(() => {
  const a = store.selectedAsset.value
  return a && a.svg ? a : undefined
})

const gridTiles = ref<TileState[][]>([])
const gridEdges = ref<TileEdges[][]>([])
const gridBrush = ref<TileState>('walkable')
const isDraggingGrid = ref(false)
const gridDirty = ref(false)
const savedGridKey = ref('')
const previousSvgAssetId = ref<string | null>(null)
const isRestoring = ref(false)

const gridBrushes: { value: TileState; label: string; icon: string; color: string }[] = [
  { value: 'walkable', label: 'Walkable', icon: '✓', color: 'var(--accent-green)' },
  { value: 'blocked', label: 'Blocked', icon: '✕', color: 'var(--accent-red)' },
  { value: 'entrance', label: 'Entrance', icon: '→', color: 'var(--accent-gold)' },
]

const gridCols = computed(() => gridTiles.value[0]?.length ?? 0)

function gridKey(): string {
  return gridTiles.value.map(row => row.join(',')).join('|') + '#' + JSON.stringify(gridEdges.value)
}

function checkGridDirty() {
  gridDirty.value = gridKey() !== savedGridKey.value
}

const tilePx = ref(32)
const GRID_GAP = 1
const tilePreviewW = computed(() => gridCols.value * tilePx.value + (gridCols.value - 1) * GRID_GAP)
const tilePreviewH = computed(() => gridTiles.value.length * tilePx.value + (gridTiles.value.length - 1) * GRID_GAP)
const svgPreviewW = computed(() => {
  const a = svgAsset.value
  if (!a || !a.svgViewBox || a.svgViewBox.w === 0 || a.svgViewBox.h === 0) return tilePreviewW.value
  const scale = Math.min(tilePreviewW.value / a.svgViewBox.w, tilePreviewH.value / a.svgViewBox.h)
  return Math.round(a.svgViewBox.w * scale)
})
const svgPreviewH = computed(() => {
  const a = svgAsset.value
  if (!a || !a.svgViewBox || a.svgViewBox.w === 0 || a.svgViewBox.h === 0) return tilePreviewH.value
  const scale = Math.min(tilePreviewW.value / a.svgViewBox.w, tilePreviewH.value / a.svgViewBox.h)
  return Math.round(a.svgViewBox.h * scale)
})
const svgPreviewViewBox = computed(() => {
  const a = svgAsset.value
  if (!a || !a.svgViewBox) return ''
  return `0 0 ${a.svgViewBox.w} ${a.svgViewBox.h}`
})
const previewSvg = computed(() => svgAsset.value?.svg?.replace(/var\(--blueprint-line\)/g, 'var(--object-detail-line)') ?? '')

const previewSvgEl = ref<SVGSVGElement | null>(null)

function renderPreview() {
  const el = previewSvgEl.value
  const svg = previewSvg.value
  if (el && svg) renderSvgInto(el, svg)
}

watch(previewSvg, () => {
  nextTick(renderPreview)
})
onMounted(renderPreview)

const assetSignature = computed(() => ({
  id: svgAsset.value?.id,
  w: svgAsset.value?.w,
  h: svgAsset.value?.h,
  tileStates: svgAsset.value?.tileStates,
  tileEdges: svgAsset.value?.tileEdges,
}))

watch(assetSignature, (newSig, oldSig) => {
  if (isRestoring.value) {
    isRestoring.value = false
    return
  }

  const sameId = newSig.id === oldSig?.id
  if (!sameId && gridDirty.value && previousSvgAssetId.value) {
    if (!window.confirm('You have unsaved walkable grid changes. Discard them?')) {
      isRestoring.value = true
      store.selectAsset(previousSvgAssetId.value)
      return
    }
  }

  if (svgAsset.value) {
    initGridTiles(svgAsset.value)
    savedGridKey.value = gridKey()
    gridDirty.value = false
    previousSvgAssetId.value = svgAsset.value.id
  } else {
    gridTiles.value = []
    gridEdges.value = []
    savedGridKey.value = ''
    gridDirty.value = false
    previousSvgAssetId.value = null
  }
}, { immediate: true })

function initGridTiles(a: AssetDef) {
  const rows = Math.max(1, a.h)
  const cols = Math.max(1, a.w)

  const states = a.tileStates
  if (states && states.length === rows && states[0]?.length === cols) {
    gridTiles.value = states.map(row => [...row])
  } else {
    const grid = a.walkableGrid
    if (grid && grid.length === rows && grid[0]?.length === cols) {
      gridTiles.value = grid.map(row => row.map(cell => cell ? 'walkable' : 'blocked'))
    } else {
      const defaultStates: TileState[][] = []
      for (let r = 0; r < rows; r++) {
        defaultStates[r] = []
        for (let c = 0; c < cols; c++) defaultStates[r][c] = 'walkable'
      }
      gridTiles.value = defaultStates
    }
  }

  const edges = a.tileEdges
  if (edges && edges.length === rows && edges[0]?.length === cols) {
    gridEdges.value = edges.map(row => row.map(e => e ? { ...e } : e))
  } else {
    const defaultEdges: TileEdges[][] = []
    for (let r = 0; r < rows; r++) {
      defaultEdges[r] = []
      for (let c = 0; c < cols; c++) defaultEdges[r][c] = {}
    }
    gridEdges.value = defaultEdges
  }
}

function paintTile(r: number, c: number) {
  if (!gridTiles.value[r]) return
  gridTiles.value[r][c] = gridBrush.value
  checkGridDirty()
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
  checkGridDirty()
}

function onTileDown(r: number, c: number, e: MouseEvent) {
  isDraggingGrid.value = true
  const side = detectEdgeSide(e)
  if (side) toggleEdgeAt(r, c, side)
  else paintTile(r, c)
}

function onTileEnter(r: number, c: number) {
  if (!isDraggingGrid.value) return
  // only paint tile state while dragging; edge toggling is click-by-click
  paintTile(r, c)
}

function onDragEnd() {
  isDraggingGrid.value = false
}

function fillAllTiles(state: TileState) {
  for (const row of gridTiles.value) {
    for (let i = 0; i < row.length; i++) row[i] = state
  }
  checkGridDirty()
}

function fillGridRow(r: number) {
  if (!gridTiles.value[r]) return
  for (let i = 0; i < gridTiles.value[r].length; i++) gridTiles.value[r][i] = gridBrush.value
  checkGridDirty()
}

function fillGridCol(c: number) {
  for (let r = 0; r < gridTiles.value.length; r++) {
    if (gridTiles.value[r]) gridTiles.value[r][c] = gridBrush.value
  }
  checkGridDirty()
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
  checkGridDirty()
}

function clearAllEdges() {
  for (const row of gridEdges.value) {
    for (const e of row) {
      if (e) { e.top = false; e.right = false; e.bottom = false; e.left = false }
    }
  }
  checkGridDirty()
}

function tileBg(state: TileState): string {
  switch (state) {
    case 'walkable': return 'color-mix(in srgb, var(--accent-green) 15%, transparent)'
    case 'blocked': return 'color-mix(in srgb, var(--accent-red) 15%, transparent)'
    case 'entrance': return 'color-mix(in srgb, var(--accent-gold) 15%, transparent)'
  }
}

function tileBorder(state: TileState): string {
  switch (state) {
    case 'walkable': return '1px solid var(--accent-green)'
    case 'blocked': return '1px solid var(--accent-red)'
    case 'entrance': return '1px solid var(--accent-gold)'
  }
}

function tileIcon(state: TileState): string {
  switch (state) {
    case 'walkable': return '✓'
    case 'blocked': return '✕'
    case 'entrance': return '→'
  }
}

async function saveGrid() {
  const a = svgAsset.value
  if (!a) return
  const states = gridTiles.value.map(row => [...row])
  const grid = states.map(row => row.map(t => t === 'walkable' || t === 'entrance'))
  const edges = gridEdges.value.map(row => row.map(e => e ? { ...e } : e))
  await store.updateAsset(a.id, { walkableGrid: grid, tileStates: states, tileEdges: edges })
  savedGridKey.value = gridKey()
  gridDirty.value = false
  useToast().success('Walkable grid saved')
}

/* ---------- Drag ---------- */
const pos = ref({ x: 120, y: 120 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panelX: 0, panelY: 0 })

function onHeaderMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.walkable__grid__panel__close')) return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY, panelX: pos.value.x, panelY: pos.value.y }
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function onWindowMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  const maxX = window.innerWidth - 100
  const maxY = window.innerHeight - 40
  pos.value = {
    x: Math.max(0, Math.min(dragStart.value.panelX + e.clientX - dragStart.value.x, maxX)),
    y: Math.max(0, Math.min(dragStart.value.panelY + e.clientY - dragStart.value.y, maxY)),
  }
}

function onWindowMouseUp() {
  isDragging.value = false
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
})
</script>

<template>
  <div
    v-if="svgAsset && showWalkableGridPanel"
    class="walkable__grid__panel"
    :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    @mousedown.stop
    @wheel.stop
  >
    <div class="walkable__grid__panel__header" @mousedown="onHeaderMouseDown">
      <span>Walkable Grid — {{ svgAsset.name }}</span>
      <span class="walkable__grid__panel__size">{{ gridCols }}×{{ gridTiles.length }}</span>
      <button class="walkable__grid__panel__close" @click.stop="closeWalkableGridPanel" title="Close">×</button>
    </div>

    <div class="walkable__grid__panel__body">
      <div class="walkable__grid__editor" :style="{ '--tile-size': tilePx + 'px' }" @mouseup="onDragEnd" @mouseleave="onDragEnd">
        <div class="walkable__grid__editor__brushes">
          <button
            v-for="b in gridBrushes"
            :key="b.value"
            type="button"
            class="btn"
            :class="{ 'btn__active': gridBrush === b.value }"
            :aria-pressed="gridBrush === b.value"
            :aria-label="'Select ' + b.label + ' brush'"
            @click="gridBrush = b.value"
          >
            <span class="walkable__grid__editor__brush__swatch" :style="{ background: b.color }">{{ b.icon }}</span>
            <span class="walkable__grid__editor__brush__label">{{ b.label }}</span>
          </button>
        </div>

        <div class="walkable__grid__editor__hint">
          Click tile body to paint state · Click near a tile edge to toggle its wall
        </div>

        <div class="walkable__grid__editor__zoom">
          <button class="btn btn__ghost btn__icon" @click="tilePx = Math.max(16, tilePx - 4)" title="Smaller tiles">−</button>
          <span class="walkable__grid__editor__zoom__label">{{ tilePx }}px</span>
          <button class="btn btn__ghost btn__icon" @click="tilePx = Math.min(64, tilePx + 4)" title="Larger tiles">+</button>
        </div>

        <div class="walkable__grid__editor__body">
          <div class="walkable__grid__editor__preview">
            <div class="walkable__grid__editor__col__headers">
              <span class="walkable__grid__editor__corner"></span>
              <span v-for="c in gridCols" :key="c" class="walkable__grid__editor__col__header">{{ c }}</span>
            </div>
            <div class="walkable__grid__editor__preview__content">
              <div class="walkable__grid__editor__preview__row_headers">
                <span v-for="(_, r) in gridTiles" :key="r" class="walkable__grid__editor__row__header">{{ r + 1 }}</span>
              </div>
              <div
                class="walkable__grid__editor__preview__stage"
                :style="{ width: `${tilePreviewW}px`, height: `${tilePreviewH}px` }"
              >
                <svg
                  ref="previewSvgEl"
                  :viewBox="svgPreviewViewBox"
                  :width="svgPreviewW"
                  :height="svgPreviewH"
                  preserveAspectRatio="xMidYMid meet"
                  class="walkable__grid__editor__svg"
                ></svg>
              </div>
            </div>
          </div>

          <div class="walkable__grid__editor__grid">
            <div class="walkable__grid__editor__col__headers">
              <span class="walkable__grid__editor__corner"></span>
              <span v-for="c in gridCols" :key="c" class="walkable__grid__editor__col__header" :title="'Fill column ' + c" @click="fillGridCol(c - 1)">{{ c }}</span>
            </div>
            <div v-for="(row, r) in gridTiles" :key="r" class="walkable__grid__editor__row">
              <span class="walkable__grid__editor__row__header" :title="'Fill row ' + (r + 1)" @click="fillGridRow(r)">{{ r + 1 }}</span>
              <button
                v-for="(state, c) in row"
                :key="c"
                type="button"
                class="walkable__grid__editor__tile"
                :style="{ background: tileBg(state), border: tileBorder(state) }"
                :aria-label="state + ' tile, row ' + (r + 1) + ' column ' + (c + 1)"
                @mousedown.prevent="onTileDown(r, c, $event)"
                @mouseenter="onTileEnter(r, c)"
              >
                <span class="walkable__grid__editor__tile__icon">{{ tileIcon(state) }}</span>
                <span v-if="gridEdges[r]?.[c]?.top" class="walkable__grid__editor__tile__edge walkable__grid__editor__tile__edge__top"></span>
                <span v-if="gridEdges[r]?.[c]?.right" class="walkable__grid__editor__tile__edge walkable__grid__editor__tile__edge__right"></span>
                <span v-if="gridEdges[r]?.[c]?.bottom" class="walkable__grid__editor__tile__edge walkable__grid__editor__tile__edge__bottom"></span>
                <span v-if="gridEdges[r]?.[c]?.left" class="walkable__grid__editor__tile__edge walkable__grid__editor__tile__edge__left"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="walkable__grid__editor__actions">
          <button class="btn" @click="fillAllTiles('walkable')">All Walkable</button>
          <button class="btn" @click="fillAllTiles('blocked')">All Blocked</button>
          <button class="btn" @click="blockOuterSides">Outer Walls</button>
          <button class="btn" @click="clearAllEdges">Clear Edges</button>
          <button class="btn btn__success" :class="{ 'btn__dirty': gridDirty }" @click="saveGrid">Save Grid{{ gridDirty ? ' *' : '' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>

.walkable__grid__panel {
  position: absolute;
  z-index: 200;
  width: max-content;
  min-width: 360px;
  max-width: calc(100vw - 32px);
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.walkable__grid__panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  cursor: grab;
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--accent-gold);
  user-select: none;
}

.walkable__grid__panel__close {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: var(--font-md);
  line-height: 1;
  padding: 0 var(--gap-xs);
  cursor: pointer;
  transition: color var(--duration-fast) ease-out;
}

.walkable__grid__panel__close:hover {
  color: var(--accent-red);
}

.walkable__grid__panel__size {
  font-size: var(--font-xs);
  opacity: 0.7;
}

.walkable__grid__panel__body {
  flex: 1;
  overflow: auto;
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.walkable__grid__editor {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  padding: var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  user-select: none;
}

.walkable__grid__editor__body {
  display: flex;
  flex-direction: row;
  gap: var(--gap-md);
  align-items: stretch;
  justify-content: center;
}

.walkable__grid__editor__preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  flex-shrink: 0;
}

.walkable__grid__editor__preview__content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0;
}

.walkable__grid__editor__preview__row_headers {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.walkable__grid__editor__preview__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
}

.walkable__grid__editor__svg {
  position: absolute;
  left: 0;
  top: 0;
  display: block;
}

.walkable__grid__editor__zoom {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  justify-content: center;
}

.walkable__grid__editor__zoom__label {
  font-size: var(--font-xs);
  color: var(--text-dim);
  min-width: 36px;
  text-align: center;
}

.walkable__grid__editor__brushes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}

.walkable__grid__editor__brush__swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-dim);
  font-size: var(--font-xs);
}

.walkable__grid__editor__brush__label {
  font-size: var(--font-xs);
}

.walkable__grid__editor__hint {
  font-size: var(--font-xs);
  opacity: 0.7;
  text-align: center;
}

.walkable__grid__editor__grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.walkable__grid__editor__col__headers {
  display: flex;
  align-items: center;
  gap: 0;
}

.walkable__grid__editor__corner,
.walkable__grid__editor__col__header,
.walkable__grid__editor__row__header {
  width: var(--tile-size, 32px);
  height: var(--tile-size, 32px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs);
  opacity: 0.7;
  cursor: pointer;
}

.walkable__grid__editor__row {
  display: flex;
  align-items: center;
  gap: 0;
}

.walkable__grid__editor__tile {
  position: relative;
  width: var(--tile-size, 32px);
  height: var(--tile-size, 32px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  padding: 0;
  font-size: var(--font-xs);
}

.walkable__grid__editor__tile__icon {
  pointer-events: none;
}

.walkable__grid__editor__tile__edge {
  position: absolute;
  background: var(--text-primary);
  pointer-events: none;
}

.walkable__grid__editor__tile__edge__top {
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walkable__grid__editor__tile__edge__right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
}

.walkable__grid__editor__tile__edge__bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.walkable__grid__editor__tile__edge__left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 2px;
}

.walkable__grid__editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
  padding-top: var(--gap-sm);
  border-top: 1px solid var(--border-dim);
}
</style>