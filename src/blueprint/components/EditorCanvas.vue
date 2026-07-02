<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useEditorStore, dragState, endAssetDrag } from '../editor-store'
import { findAsset } from '../editor-assets'
import { ROOM_CATEGORY_COLORS } from '../editor-types'
import { useToast } from '@/composables/useToast'
import type { Rect, AssetShape } from '../editor-types'

const store = useEditorStore()
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const canvas = computed(() => store.state.layout.canvas)
const floor = computed(() => store.currentFloor.value)

/* ---------- Zoom & Pan (Photoshop-style) ---------- */
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const MIN_ZOOM = 0.1
const MAX_ZOOM = 8

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
  const cw = containerRef.value.clientWidth - 24
  const ch = containerRef.value.clientHeight - 24
  const fitZoom = Math.min(cw / canvas.value.width, ch / canvas.value.height)
  zoom.value = fitZoom * 0.8
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
  if (store.state.mode !== 'wall') {
    store.select(null)
    store.selectAsset(null)
    startPan(e)
    return
  }
  wallDrag.value = { startX: p.x, startY: p.y, x: p.x, y: p.y, w: 0, h: 0, valid: false }
  window.addEventListener('mousemove', onWallMouseMove)
  window.addEventListener('mouseup', onWallMouseUp)
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

function onWallMouseUp() {
  window.removeEventListener('mousemove', onWallMouseMove)
  window.removeEventListener('mouseup', onWallMouseUp)
  if (wallDrag.value && wallDrag.value.valid && wallDrag.value.w > 0 && wallDrag.value.h > 0) {
    store.addRoom({ x: wallDrag.value.x, y: wallDrag.value.y, w: wallDrag.value.w, h: wallDrag.value.h }, store.state.wallCategory)
  }
  wallDrag.value = null
}

/* ---------- Palette drop (Object mode) ---------- */
const paletteGhost = computed(() => {
  if (!dragState.assetId) return null
  const asset = findAsset(store.state.layout.customAssets, dragState.assetId)
  if (!asset) return null
  const t = canvas.value.tileSize
  return { w: asset.pxW ?? asset.w * t, h: asset.pxH ?? asset.h * t, shape: asset.shape }
})

const mousePos = ref({ x: -1000, y: -1000 })
const paletteValid = ref(false)

function onWindowMouseMoveForDrag(e: MouseEvent) {
  if (!dragState.assetId || !svgRef.value) return
  const p = localPoint(e)
  mousePos.value = p
  const ghost = paletteGhost.value
  if (!ghost) return
  const x = p.x - ghost.w / 2
  const y = p.y - ghost.h / 2
  paletteValid.value = store.canPlaceObject(dragState.assetId, x, y)
}

function onWindowMouseUpForDrag(e: MouseEvent) {
  if (!dragState.assetId) return
  const assetId = dragState.assetId
  const svgEl = svgRef.value
  if (svgEl) {
    const rect = svgEl.getBoundingClientRect()
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
    const ghost = paletteGhost.value
    if (inside && ghost) {
      const p = localPoint(e)
      store.addObject(assetId, p.x - ghost.w / 2, p.y - ghost.h / 2)
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

/* ---------- Select / Move existing items ---------- */
const moving = ref<{ type: 'room' | 'object'; id: string; startX: number; startY: number; first: boolean } | null>(null)

function onRoomMouseDown(e: MouseEvent, id: string) {
  if (e.button === 1 || spaceDown.value) return
  if (store.state.mode === 'move') return
  e.stopPropagation()
  store.select({ type: 'room', id })
  const p = localPoint(e)
  moving.value = { type: 'room', id, startX: p.x, startY: p.y, first: true }
  window.addEventListener('mousemove', onMoveMouseMove)
  window.addEventListener('mouseup', onMoveMouseUp)
}

function onObjectMouseDown(e: MouseEvent, id: string) {
  if (e.button === 1 || spaceDown.value) return
  if (store.state.mode === 'move') return
  e.stopPropagation()
  store.select({ type: 'object', id })
  const p = localPoint(e)
  moving.value = { type: 'object', id, startX: p.x, startY: p.y, first: true }
  window.addEventListener('mousemove', onMoveMouseMove)
  window.addEventListener('mouseup', onMoveMouseUp)
}

function onMoveMouseMove(e: MouseEvent) {
  if (!moving.value) return
  const p = localPoint(e)
  const dx = p.x - moving.value.startX
  const dy = p.y - moving.value.startY
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return
  store.moveSelected(dx, dy, moving.value.first)
  moving.value.first = false
  moving.value.startX = p.x
  moving.value.startY = p.y
}

function onMoveMouseUp() {
  window.removeEventListener('mousemove', onMoveMouseMove)
  window.removeEventListener('mouseup', onMoveMouseUp)
  moving.value = null
}

/* ---------- Keyboard ---------- */
function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if (e.code === 'Space') {
    e.preventDefault()
    spaceDown.value = true
    return
  }
  if (e.key === 'Delete') {
    if (store.state.selection) {
      e.preventDefault()
      store.deleteSelected()
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (store.state.selection?.type === 'object') {
      store.rotateSelected()
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
  } else if (e.key === 'Escape') {
    if (dragState.assetId) endAssetDrag()
    if (wallDrag.value) {
      window.removeEventListener('mousemove', onWallMouseMove)
      window.removeEventListener('mouseup', onWallMouseUp)
      wallDrag.value = null
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spaceDown.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  requestAnimationFrame(fitToScreen)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onWallMouseMove)
  window.removeEventListener('mouseup', onWallMouseUp)
  window.removeEventListener('mousemove', onWindowMouseMoveForDrag)
  window.removeEventListener('mouseup', onWindowMouseUpForDrag)
  window.removeEventListener('mousemove', onMoveMouseMove)
  window.removeEventListener('mouseup', onMoveMouseUp)
  window.removeEventListener('mousemove', onPanMouseMove)
  window.removeEventListener('mouseup', onPanMouseUp)
})

function assetLabel(type: string): string {
  return findAsset(store.state.layout.customAssets, type)?.name ?? type
}

function assetShape(type: string): AssetShape | undefined {
  return findAsset(store.state.layout.customAssets, type)?.shape
}
</script>

<template>
  <div
    ref="containerRef"
    class="editor-canvas"
    :class="{ 'editor-canvas--panning': spaceDown, 'editor-canvas--dragging': !!panning, 'editor-canvas--wall-mode': store.state.mode === 'wall', 'editor-canvas--move-mode': store.state.mode === 'move' }"
    @wheel="onWheel"
    @mousedown="onPanMouseDown"
    @auxclick.prevent
  >
      <svg
        ref="svgRef"
        class="editor-canvas__svg"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
        @mousedown="onCanvasMouseDown"
      >
        <defs>
          <pattern id="grid" :width="canvas.tileSize" :height="canvas.tileSize" patternUnits="userSpaceOnUse">
            <path :d="`M ${canvas.tileSize} 0 L 0 0 0 ${canvas.tileSize}`" fill="none" stroke="#d4d4d0" stroke-width="0.5" />
          </pattern>
        </defs>

        <rect :width="canvas.width" :height="canvas.height" fill="#f7f7f5" />

        <g v-if="floor && floor.rooms.length === 0 && floor.objects.length === 0">
          <text :x="canvas.width / 2" :y="canvas.height / 2 - 10" text-anchor="middle" font-size="16" fill="#999" font-family="Arial, sans-serif" style="pointer-events: none">
            Empty floor — start drawing walls or drag objects from the palette
          </text>
        </g>

        <g v-if="floor">
          <g v-for="room in floor.rooms" :key="room.id" @mousedown="onRoomMouseDown($event, room.id)">
            <rect
              :x="room.x" :y="room.y" :width="room.w" :height="room.h"
              :fill="ROOM_CATEGORY_COLORS[room.cat]"
              stroke="#333333"
              :stroke-width="1.5"
              :rx="room.radius ?? 0"
              :class="{ 'editor-canvas__selected': store.state.selection?.type === 'room' && store.state.selection.id === room.id }"
              style="cursor: move"
            />
            <text :x="room.x + room.w / 2" :y="room.y + room.h / 2" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#222" font-family="Arial, sans-serif" style="text-transform: uppercase; pointer-events: none">
              {{ room.label }}
            </text>
          </g>

          <g v-for="obj in floor.objects" :key="obj.id" @mousedown="onObjectMouseDown($event, obj.id)">
            <rect
              v-if="assetShape(obj.type) !== 'circle'"
              :x="obj.x" :y="obj.y" :width="obj.w" :height="obj.h"
              fill="#c9c5bb" stroke="#555" stroke-width="1"
              :rx="obj.radius ?? (assetShape(obj.type) === 'round' ? 6 : 0)"
              :class="{ 'editor-canvas__selected': store.state.selection?.type === 'object' && store.state.selection.id === obj.id, 'editor-canvas__collapsed': obj.collapsed }"
              style="cursor: move"
            />
            <ellipse
              v-else
              :cx="obj.x + obj.w / 2" :cy="obj.y + obj.h / 2" :rx="obj.w / 2" :ry="obj.h / 2"
              fill="#c9c5bb" stroke="#555" stroke-width="1"
              :class="{ 'editor-canvas__selected': store.state.selection?.type === 'object' && store.state.selection.id === obj.id, 'editor-canvas__collapsed': obj.collapsed }"
              style="cursor: move"
            />
            <rect
              v-if="obj.padding && obj.padding > 0"
              :x="obj.x + obj.padding" :y="obj.y + obj.padding"
              :width="obj.w - obj.padding * 2" :height="obj.h - obj.padding * 2"
              fill="none" stroke="#999" stroke-width="0.5" stroke-dasharray="2 2"
              style="pointer-events: none"
            />
            <text :x="obj.x + obj.w / 2" :y="obj.y + obj.h / 2 + (obj.labelPadding ?? 0)" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#222" font-family="Arial, sans-serif" style="pointer-events: none">
              {{ assetLabel(obj.type) }}
            </text>
          </g>
        </g>

        <rect :width="canvas.width" :height="canvas.height" fill="url(#grid)" style="pointer-events: none" />

        <rect :width="canvas.width" :height="canvas.height" fill="none" stroke="#1a1a1a" stroke-width="2" />

        <rect
          v-if="wallDrag"
          :x="wallDrag.x" :y="wallDrag.y" :width="wallDrag.w" :height="wallDrag.h"
          :fill="wallDrag.valid ? 'rgba(61,214,140,0.25)' : 'rgba(239,68,68,0.25)'"
          :stroke="wallDrag.valid ? '#3dd68c' : '#ef4444'"
          stroke-width="1.5"
          stroke-dasharray="4 3"
        />

        <g v-if="dragState.assetId && paletteGhost">
          <rect
            :x="mousePos.x - paletteGhost.w / 2" :y="mousePos.y - paletteGhost.h / 2"
            :width="paletteGhost.w" :height="paletteGhost.h"
            :fill="paletteValid ? 'rgba(61,214,140,0.35)' : 'rgba(239,68,68,0.35)'"
            :stroke="paletteValid ? '#3dd68c' : '#ef4444'"
            stroke-width="1.5"
          />
        </g>
      </svg>

    <div class="editor-canvas__zoom-controls">
      <button class="editor-canvas__zoom-btn" @click="zoomBy(1 / 1.25)" title="Zoom Out (-)" aria-label="Zoom out">−</button>
      <span class="editor-canvas__zoom-display" aria-label="Zoom level">{{ zoomPercent }}%</span>
      <button class="editor-canvas__zoom-btn" @click="zoomBy(1.25)" title="Zoom In (+)" aria-label="Zoom in">+</button>
      <button class="editor-canvas__zoom-btn editor-canvas__zoom-btn--fit" @click="fitToScreen" title="Fit to Screen (Ctrl+0)" aria-label="Fit to screen">Fit</button>
      <button class="editor-canvas__zoom-btn editor-canvas__zoom-btn--fit" @click="centerView" title="Center View" aria-label="Center view">Center</button>
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

.editor-canvas--move-mode.editor-canvas--dragging .editor-canvas__svg {
  cursor: grabbing;
}

.editor-canvas__svg {
  display: block;
  width: 100%;
  height: 100%;
  background: #f7f7f5;
  box-shadow: var(--shadow-panel, 0 12px 48px rgba(0, 0, 0, 0.6));
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
</style>
