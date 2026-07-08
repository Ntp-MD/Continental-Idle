<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAssetsStore, dragState, endAssetDrag, endRoomTemplateDrag } from '../assets-store'
import { findAssetCached } from '../assets-utils'
import { svgTransform as svgTransformGeo, compositeOutlinePath as compositeOutlinePathGeo, compositePartDetailsPath as compositePartDetailsPathGeo, roundedRectPath } from '../geometry'
import { useToast } from '@/composables/useToast'
import type { CompositePart, ObjectData, RoomData } from '../types'
import { useCanvasViewport } from '../composables/useCanvasViewport'
import { useCanvasSelection } from '../composables/useCanvasSelection'
import { useCanvasDragDrop } from '../composables/useCanvasDragDrop'
import { useWallPaintTool } from '../composables/useWallPaintTool'

function renderSvgContent(g: SVGGElement, html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`,
    'image/svg+xml',
  )
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    console.warn('[EditorCanvas] Failed to parse SVG content:', parserError.textContent, html)
    return
  }
  while (g.firstChild) g.removeChild(g.firstChild)
  Array.from(doc.documentElement.children).forEach(child => {
    const node = document.importNode(child, true) as SVGElement
    const role = node.getAttribute('data-role')
    if (role) {
      node.classList.add(`svg-role--${role}`)
    }
    g.appendChild(node)
  })
}

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
const canvas = computed(() => store.state.layout.canvas)
const floor = computed(() => store.currentFloor.value)

const ROOM_DEFAULT_FILL = '#e8e4dc'

/* ---------- Viewport (zoom, pan, localPoint) ---------- */
const vp = useCanvasViewport(
  () => canvas.value.width,
  () => canvas.value.height,
)
const {
  zoom, panX, panY, viewBox, zoomPercent, spaceDown, panning,
  svgRef, containerRef, RULER_SIZE,
  fitToScreen, centerView, zoomBy, onWheel,
  startPan, onPanMouseDown, onPanMouseMove, onPanMouseUp, localPoint,
} = vp

/* ---------- Wall drawing (Wall mode) ---------- */
const wall = useWallPaintTool({
  localPoint,
  canPlaceRoom: store.canPlaceRoom,
  addRoom: store.addRoom,
})
const { wallDrag, onWallMouseMove, onWallMouseUp } = wall

/* ---------- Selection (box-select, click-select) ---------- */
const sel = useCanvasSelection({
  spaceDown,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  startPan,
  floor,
  store: store as any,
  wallDrag,
  onWallMouseMove,
  onWallMouseUp,
})
const { boxSelect, onCanvasMouseDown, onBoxSelectMouseMove, onBoxSelectMouseUp } = sel

/* ---------- Drag & drop (palette, room template) ---------- */
const dd = useCanvasDragDrop({
  svgRef,
  localPoint,
  canvasWidth: () => canvas.value.width,
  canvasHeight: () => canvas.value.height,
  floor,
  store: store as any,
  tileSize: () => canvas.value.tileSize,
})
const {
  mousePos, paletteValid, paletteGhost, paletteGhostParts, paletteGhostRect,
  roomTemplateGhost, roomTemplateGhostRect, roomTemplateValid,
  onWindowMouseMoveForDrag, onWindowMouseUpForDrag,
  onRoomTemplateMouseMove, onRoomTemplateMouseUp,
} = dd

/* ---------- UI state ---------- */
const showGrid = ref(true)
const showLabels = ref(true)
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

/* ---------- Move (room/object drag) ---------- */
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

/* ---------- Container mouse + toggles ---------- */
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

/* ---------- Keyboard ---------- */
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

const ZOOM_STORAGE_KEY = 'blueprint-zoom-state'

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

/* ---------- Render helpers ---------- */
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
  const a = findAssetCached(store.assetMap(), type)
  return a?.kind === 'composite' ? a.parts : undefined
}

function assetSvg(type: string): string | undefined {
  const a = findAssetCached(store.assetMap(), type)
  return a?.kind === 'svg' ? a.svg : undefined
}

function svgTransform(obj: ObjectData): string {
  const asset = findAssetCached(store.assetMap(), obj.type)
  return svgTransformGeo(obj, asset)
}

function compositeOutlinePath(obj: ObjectData): string | null {
  return compositeOutlinePathGeo(obj, assetParts(obj.type))
}

function compositePartDetailsPath(obj: ObjectData): string | null {
  return compositePartDetailsPathGeo(obj, assetParts(obj.type))
}

function isObjectSelected(id: string): boolean {
  if (store.state.selection?.type === 'object' && store.state.selection.id === id) return true
  if (store.state.multiSelection?.ids.includes(id)) return true
  return false
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
            <template v-if="assetSvg(obj.type)">
              <rect
                :x="obj.x + (obj.padding ?? 0)" :y="obj.y + (obj.padding ?? 0)"
                :width="obj.w - (obj.padding ?? 0) * 2" :height="obj.h - (obj.padding ?? 0) * 2"
                :fill="objFillColor(obj)" stroke="none"
                :class="{ 'editor-canvas__collapsed': obj.collapsed }"
                :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
              />
              <g
                v-svg-content="assetSvg(obj.type)"
                :transform="svgTransform(obj)"
                :data-obj-id="obj.id"
                :class="{ 'editor-canvas__selected': isObjectSelected(obj.id), 'editor-canvas__collapsed': obj.collapsed, 'editor-canvas__dragging-item': moving?.id === obj.id, 'editor-canvas__locked': obj.locked }"
                :style="{ cursor: moving?.id === obj.id ? 'grabbing' : 'move' }"
              />
            </template>
            <template v-else-if="assetParts(obj.type)">
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
              <path
                v-if="compositePartDetailsPath(obj)"
                :d="compositePartDetailsPath(obj)!"
                fill="none" stroke="#555" stroke-width="0.5" stroke-linecap="square" opacity="0.5"
                :style="{ pointerEvents: 'none' }"
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
          v-if="boxSelect && boxSelect.w > 4"
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

.editor-canvas__svg:focus {
  outline: 2px solid var(--accent-gold, #f0c040);
  outline-offset: -2px;
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

.svg-role--wall {
  stroke: #3b82f6 !important;
}

.svg-role--door {
  stroke: #22c55e !important;
}

.svg-role--fixture {
  stroke: var(--blueprint-line);
}
</style>
