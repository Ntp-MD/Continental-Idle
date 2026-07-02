<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

const emit = defineEmits(['close'])

const NS = 'http://www.w3.org/2000/svg'
const W = 1200, H = 600
const GRID_SIZE = 25

const GRID_LINE = { stroke: '#d4d4d0', 'stroke-width': 0.5 }
const WALL_EXT = { stroke: '#1a1a1a', 'stroke-width': 2, fill: 'none' }
const WALL_INT = { stroke: '#1a1a1a', 'stroke-width': 1.5, fill: 'none' }
const COL_FILL = '#1a1a1a'

const CAT: Record<string, string> = {
  public: '#e8e4dc',
  service: '#dcd8d0',
  back: '#d4d0c8',
  security: '#d0ccc4',
  utility: '#ccc8c0',
  open: '#f7f7f5',
}

const ELEVATOR = {
  w: 50,
  h: 50,
  fill: '#ebebe9',
  stroke: '#1a1a1a',
  'stroke-width': 1.5,
}

const FLOORS = [
  { id: 'G', name: 'Basement', info: 'Black Market · Vault · Underground Services · Loading Bay' },
  { id: '1', name: 'Lobby', info: 'Concierge · Waiting Lounge · Reception Desk · Main Entrance · Reception Office' },
  { id: '2', name: 'Restaurant & Bar', info: 'Kitchen · Bar / Lounge · Loading Bay' },
  { id: '3', name: 'Service Floor', info: 'Laundry Service · Staff Room' },
  { id: '4', name: 'Security', info: 'Control Center · Armory' },
  { id: '5', name: 'Staff Rooms', info: 'Staff Room' },
  { id: '6', name: 'Staff Rooms', info: 'Staff Room' },
  { id: '7', name: 'Standard Rooms', info: '20 Standard Guest Rooms' },
  { id: '8', name: 'Standard Rooms', info: '20 Standard Guest Rooms' },
  { id: '9', name: 'Standard Rooms', info: '20 Standard Guest Rooms' },
  { id: '10', name: 'Standard Rooms', info: '20 Standard Guest Rooms' },
  { id: '11', name: 'Deluxe Rooms', info: '16 Deluxe Guest Rooms' },
  { id: '12', name: 'Deluxe Rooms', info: '16 Deluxe Guest Rooms' },
  { id: '13', name: 'Executive Rooms', info: '10 Executive Guest Rooms' },
  { id: '14', name: 'Executive Rooms', info: '10 Executive Guest Rooms' },
  { id: '15', name: 'VIP Suites', info: '8 VIP Suites' },
  { id: '16', name: 'VIP Suites', info: '8 VIP Suites' },
  { id: '17', name: 'Penthouse', info: '4 Penthouse Suites' },
  { id: '18', name: 'Penthouse', info: '4 Penthouse Suites' },
  { id: '19', name: 'Intel', info: 'Datacenter · Intelligence Network' },
  { id: '20', name: 'Management', info: 'Safe House · Manager\'s Office' },
  { id: '21', name: 'Rooftop', info: 'Rooftop Terrace · Helipad' },
]

const CAT_LABEL: Record<string, string> = {
  public: 'Public / Guest',
  service: 'Guest Service',
  back: 'Back of House',
  security: 'Restricted / Security',
  utility: 'Utility',
}

const FLOOR_CATS: Record<string, string[]> = {
  '1': ['public', 'service', 'back'],
}

const currentFloor = ref('1')
const svgRef = ref<SVGSVGElement | null>(null)

function el(tag: string, attrs: Record<string, string | number>, parent: Element): SVGElement {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, String(attrs[k]))
  if (parent) parent.appendChild(e)
  return e
}

function drawGrid(g: Element) {
  const defs = el('defs', {}, g)
  const pat = el('pattern', { id: 'grid', width: GRID_SIZE, height: GRID_SIZE, patternUnits: 'userSpaceOnUse' }, defs)
  el('rect', { width: GRID_SIZE, height: GRID_SIZE, fill: '#f7f7f5' }, pat)
  el('path', { d: `M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`, fill: 'none', ...GRID_LINE }, pat)
  el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#grid)' }, g)
}

function drawElevator(g: Element, x: number, y: number, count = 1) {
  for (let i = 0; i < count; i++) {
    const cx = x + i * ELEVATOR.w
    const r = el('rect', { x: cx, y, width: ELEVATOR.w, height: ELEVATOR.h, fill: ELEVATOR.fill, stroke: ELEVATOR.stroke, 'stroke-width': ELEVATOR['stroke-width'] }, g)
    el('title', {}, r).textContent = 'Elevator'
    el('rect', { x: cx + 4, y: y + 4, width: ELEVATOR.w - 8, height: ELEVATOR.h - 8, fill: 'none', stroke: ELEVATOR.stroke, 'stroke-width': 0.7 }, g)
    el('line', { x1: cx + ELEVATOR.w / 2, y1: y + 4, x2: cx + ELEVATOR.w / 2, y2: y + ELEVATOR.h - 4, stroke: ELEVATOR.stroke, 'stroke-width': 1 }, g)
  }
}

function drawRoom(g: Element, x: number, y: number, w: number, h: number, cat: string, label: string) {
  const fill = cat ? (CAT[cat] || '#ffffff') : '#ffffff'
  const r = el('rect', { x, y, width: w, height: h, fill }, g)
  if (label) el('title', {}, r).textContent = label
  el('rect', { x, y, width: w, height: h, ...WALL_INT }, g)
}

function drawDoor(g: Element, x: number, y: number, orient: string, swing: string, size = 25) {
  const half = size / 2, gap = 3
  if (orient === 'h') {
    el('rect', { x: x - half - gap, y: y - 2, width: size + gap * 2, height: 4, fill: '#f7f7f5' }, g)
    if (swing === 'down') el('line', { x1: x - half, y1: y, x2: x - half, y2: y + half, stroke: '#1a1a1a', 'stroke-width': 1 }, g)
    else el('line', { x1: x - half, y1: y, x2: x - half, y2: y - half, stroke: '#1a1a1a', 'stroke-width': 1 }, g)
  } else {
    el('rect', { x: x - 2, y: y - half - gap, width: 4, height: size + gap * 2, fill: '#f7f7f5' }, g)
    if (swing === 'right') el('line', { x1: x, y1: y - half, x2: x + half, y2: y - half, stroke: '#1a1a1a', 'stroke-width': 1 }, g)
    else el('line', { x1: x, y1: y - half, x2: x - half, y2: y - half, stroke: '#1a1a1a', 'stroke-width': 1 }, g)
  }
}

function drawLabel(g: Element, cx: number, cy: number, text: string, sub: string | null, size = 12) {
  el('text', { x: cx, y: cy, 'text-anchor': 'middle', 'font-size': size, fill: '#333333', 'letter-spacing': '1' }, g).textContent = text.toUpperCase()
  if (sub) {
    el('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': 9, fill: '#666666' }, g).textContent = sub.toUpperCase()
  }
}

function drawCol(g: Element, x: number, y: number, w: number, h: number) {
  const r = el('rect', { x, y, width: w, height: h, fill: COL_FILL }, g)
  el('title', {}, r).textContent = 'Structural Column'
}

function drawFurn(g: Element, x: number, y: number, w: number, h: number, shape: string | null, label: string | null) {
  let e: SVGElement
  if (shape === 'circle') {
    e = el('ellipse', { cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, fill: '#ebebe9', stroke: '#999999', 'stroke-width': 0.75 }, g)
  } else {
    e = el('rect', { x, y, width: w, height: h, rx: shape === 'round' ? 10 : 0, fill: '#ebebe9', stroke: '#999999', 'stroke-width': 0.75 }, g)
  }
  if (label) el('title', {}, e).textContent = label
}

function drawOpenZone(g: Element, x: number, y: number, w: number, h: number, cat: string) {
  el('rect', { x, y, width: w, height: h, fill: CAT[cat] || CAT.open }, g)
}

function drawLobby(g: Element) {
  drawOpenZone(g, 175, 325, 850, 125, 'open')
  drawOpenZone(g, 0, 450, 1200, 150, 'open')

  drawRoom(g, 375, 0, 450, 175, 'back', 'Reception Office')
  drawRoom(g, 0, 0, 175, 450, 'service', 'Concierge')
  drawRoom(g, 1025, 0, 175, 450, 'public', 'Waiting Lounge')

  el('rect', { x: 0, y: 0, width: W, height: H, ...WALL_EXT }, g)

  drawCol(g, 175, 175, 25, 25)
  drawCol(g, 375, 175, 25, 25)
  drawCol(g, 825, 175, 25, 25)
  drawCol(g, 1000, 175, 25, 25)
  drawCol(g, 175, 450, 25, 25)
  drawCol(g, 425, 450, 25, 25)
  drawCol(g, 750, 450, 25, 25)
  drawCol(g, 1000, 450, 25, 25)

  drawElevator(g, 225, 0, 2)
  drawElevator(g, 875, 0, 2)
  drawFurn(g, 150, 425, 25, 25, 'circle', 'Plant')
  drawFurn(g, 1025, 425, 25, 25, 'circle', 'Plant')

  for (let mx = 0; mx < 1200; mx += 100) {
    for (let my = 450; my < 600; my += 75) {
      el('rect', { x: mx, y: my, width: 100, height: 75, fill: 'none', stroke: '#e0e0de', 'stroke-width': 0.4 }, g)
    }
  }

  el('rect', { x: 300, y: 340, width: 600, height: 90, fill: 'none', stroke: '#ccc8c0', 'stroke-width': 0.5, 'stroke-dasharray': '4 3' }, g)

  drawDoor(g, 600, 175, 'h', 'down')
  drawDoor(g, 175, 350, 'v', 'right')
  drawDoor(g, 1025, 350, 'v', 'left')
  drawDoor(g, 500, 600, 'h', 'up', 100)
  drawDoor(g, 700, 600, 'h', 'up', 100)
  drawDoor(g, 175, 100, 'v', 'right')

  drawFurn(g, 475, 350, 250, 25, null, 'Reception Counter')
  drawFurn(g, 475, 375, 25, 50, null, 'Reception Counter')

  drawFurn(g, 25, 275, 100, 25, null, 'Concierge Desk')
  drawFurn(g, 25, 350, 50, 25, null, 'Bell Desk')
  drawFurn(g, 100, 350, 50, 25, null, 'Bell Desk')
  drawFurn(g, 25, 400, 50, 25, null, 'Luggage Rack')
  drawFurn(g, 100, 400, 50, 25, null, 'Luggage Rack')
  drawFurn(g, 25, 25, 50, 50, null, 'Luggage Storage')
  drawFurn(g, 100, 25, 50, 50, null, 'Luggage Storage')
  drawFurn(g, 25, 100, 50, 50, null, 'Luggage Storage')
  drawFurn(g, 100, 100, 50, 50, null, 'Luggage Storage')
  drawFurn(g, 25, 175, 50, 50, null, 'Luggage Storage')
  drawFurn(g, 100, 175, 50, 50, null, 'Luggage Storage')
  drawFurn(g, 125, 250, 25, 25, 'circle', 'Plant')

  drawFurn(g, 1050, 275, 25, 50, null, 'Sofa')
  drawFurn(g, 1150, 275, 25, 50, null, 'Sofa')
  drawFurn(g, 1075, 375, 50, 50, 'circle', 'Coffee Table')
  drawFurn(g, 1050, 400, 25, 50, null, 'Sofa')
  drawFurn(g, 1150, 400, 25, 50, null, 'Sofa')
  drawFurn(g, 1100, 250, 25, 25, 'circle', 'Plant')
  drawFurn(g, 1050, 25, 25, 50, null, 'Sofa')
  drawFurn(g, 1150, 25, 25, 50, null, 'Sofa')
  drawFurn(g, 1075, 100, 50, 50, 'circle', 'Coffee Table')
  drawFurn(g, 1050, 125, 25, 50, null, 'Sofa')
  drawFurn(g, 1150, 125, 25, 50, null, 'Sofa')
  drawFurn(g, 1100, 0, 25, 25, 'circle', 'Plant')
  drawFurn(g, 1050, 175, 25, 50, null, 'Sofa')
  drawFurn(g, 1150, 175, 25, 50, null, 'Sofa')

  drawFurn(g, 400, 25, 50, 25, null, 'Desk')
  drawFurn(g, 400, 50, 25, 25, 'round', 'Chair')
  drawFurn(g, 475, 25, 25, 50, null, 'Filing Cabinet')
  drawFurn(g, 550, 25, 50, 25, null, 'Desk')
  drawFurn(g, 550, 50, 25, 25, 'round', 'Chair')
  drawFurn(g, 625, 25, 25, 50, null, 'Filing Cabinet')
  drawFurn(g, 700, 25, 25, 25, null, 'Filing Cabinet')
  drawFurn(g, 700, 75, 25, 25, null, 'Filing Cabinet')
  drawFurn(g, 700, 125, 25, 25, null, 'Filing Cabinet')
  drawFurn(g, 750, 25, 50, 25, null, 'Desk')
  drawFurn(g, 750, 50, 25, 25, 'round', 'Chair')
  drawFurn(g, 400, 100, 125, 50, null, 'Meeting Table')
  drawFurn(g, 550, 100, 125, 50, null, 'Meeting Table')

  drawFurn(g, 200, 325, 50, 25, null, 'Sofa')
  drawFurn(g, 200, 350, 25, 25, null, 'Chair')
  drawFurn(g, 225, 350, 25, 25, null, 'Chair')
  drawFurn(g, 300, 325, 50, 25, null, 'Sofa')
  drawFurn(g, 300, 350, 25, 25, null, 'Chair')
  drawFurn(g, 325, 350, 25, 25, null, 'Chair')
  drawFurn(g, 250, 380, 50, 25, 'round', 'Coffee Table')

  drawFurn(g, 750, 325, 50, 25, null, 'Sofa')
  drawFurn(g, 750, 350, 25, 25, null, 'Chair')
  drawFurn(g, 775, 350, 25, 25, null, 'Chair')
  drawFurn(g, 850, 325, 50, 25, null, 'Sofa')
  drawFurn(g, 850, 350, 25, 25, null, 'Chair')
  drawFurn(g, 875, 350, 25, 25, null, 'Chair')
  drawFurn(g, 950, 325, 50, 25, null, 'Sofa')
  drawFurn(g, 950, 350, 25, 25, null, 'Chair')
  drawFurn(g, 975, 350, 25, 25, null, 'Chair')
  drawFurn(g, 800, 380, 50, 25, 'round', 'Coffee Table')
  drawFurn(g, 900, 380, 50, 25, 'round', 'Coffee Table')

  drawFurn(g, 50, 475, 25, 25, null, 'Chair')
  drawFurn(g, 75, 475, 25, 25, null, 'Chair')
  drawFurn(g, 150, 475, 25, 25, 'circle', 'Plant')
  drawFurn(g, 250, 475, 50, 25, null, 'Sofa')
  drawFurn(g, 350, 475, 25, 25, null, 'Chair')
  drawFurn(g, 375, 475, 25, 25, null, 'Chair')
  drawFurn(g, 450, 475, 25, 25, 'circle', 'Plant')
  drawFurn(g, 700, 475, 25, 25, 'circle', 'Plant')
  drawFurn(g, 750, 475, 25, 25, null, 'Chair')
  drawFurn(g, 775, 475, 25, 25, null, 'Chair')
  drawFurn(g, 850, 475, 50, 25, null, 'Sofa')
  drawFurn(g, 950, 475, 25, 25, 'circle', 'Plant')
  drawFurn(g, 1000, 475, 25, 25, null, 'Chair')
  drawFurn(g, 1025, 475, 25, 25, null, 'Chair')
  drawFurn(g, 50, 525, 50, 25, null, 'Sofa')
  drawFurn(g, 125, 525, 25, 25, 'circle', 'Plant')
  drawFurn(g, 200, 525, 50, 25, null, 'Sofa')
  drawFurn(g, 300, 525, 25, 25, null, 'Chair')
  drawFurn(g, 325, 525, 25, 25, null, 'Chair')
  drawFurn(g, 850, 525, 50, 25, null, 'Sofa')
  drawFurn(g, 950, 525, 25, 25, null, 'Chair')
  drawFurn(g, 975, 525, 25, 25, null, 'Chair')
  drawFurn(g, 1050, 525, 50, 25, null, 'Sofa')
  drawFurn(g, 1125, 525, 25, 25, 'circle', 'Plant')

  drawFurn(g, 200, 425, 25, 25, 'circle', 'Floor Lamp')
  drawFurn(g, 975, 425, 25, 25, 'circle', 'Floor Lamp')
  drawFurn(g, 100, 525, 25, 25, 'circle', 'Floor Lamp')
  drawFurn(g, 1100, 525, 25, 25, 'circle', 'Floor Lamp')

  drawFurn(g, 425, 560, 25, 25, 'circle', 'Plant')
  drawFurn(g, 750, 560, 25, 25, 'circle', 'Plant')

  el('rect', { x: 500, y: 575, width: 200, height: 20, fill: 'none', stroke: '#bbb7af', 'stroke-width': 0.6, 'stroke-dasharray': '3 2' }, g)

  drawLabel(g, 600, 90, 'Reception Office', 'Back Office')
  drawLabel(g, 87, 350, 'Concierge', 'Guest Services · Luggage')
  drawLabel(g, 87, 75, 'Luggage Storage', null, 8)
  drawLabel(g, 1112, 350, 'Waiting Lounge', 'Seating Area')
  drawLabel(g, 1112, 75, 'Waiting Lounge', 'Private Seating', 8)
  drawLabel(g, 600, 335, 'Reception Desk', 'Grand Lobby')
  drawLabel(g, 275, 65, 'Elevator', null, 8)
  drawLabel(g, 925, 65, 'Elevator', null, 8)
  drawLabel(g, 600, 585, 'Main Entrance', 'Lobby Doors', 10)
}

function render() {
  const svg = svgRef.value
  if (!svg) return
  svg.innerHTML = ''
  const g = el('g', {}, svg)
  drawGrid(g)
  if (currentFloor.value === '1') drawLobby(g)
}

const currentFloorData = computed(() => FLOORS.find(f => f.id === currentFloor.value) || FLOORS[0])
const currentFloorCats = computed(() => FLOOR_CATS[currentFloor.value] || [])
const sheetNumber = computed(() => {
  const idx = FLOORS.findIndex(f => f.id === currentFloor.value)
  return String(idx + 1).padStart(2, '0')
})

watch(currentFloor, () => {
  nextTick(() => render())
})

onMounted(() => {
  nextTick(() => render())
})
</script>

<template>
  <div class="blueprint-preview" @click.self="emit('close')">
    <div class="blueprint-preview__content" role="dialog" aria-modal="true" aria-labelledby="panel-title-blueprint">
      <div class="blueprint-preview__header">
        <div>
          <h2 id="panel-title-blueprint" class="blueprint-preview__title">The Continental</h2>
          <div class="blueprint-preview__sub">Architectural Floor Plan Survey · High Table Property Registry</div>
        </div>
        <div class="blueprint-preview__doc-id">
          DWG NO. CONT-IDLE-000<br>
          SCALE 1 : 100 · SHEET {{ sheetNumber }} / 22
        </div>
      </div>

      <div class="blueprint-preview__tabs">
        <button
          v-for="f in FLOORS"
          :key="f.id"
          class="blueprint-preview__tab"
          :class="{ 'blueprint-preview__tab--active': f.id === currentFloor }"
          @click="currentFloor = f.id"
        >{{ f.id === 'G' ? 'G' : 'F' + f.id }}</button>
      </div>

      <div class="blueprint-preview__sheet">
        <div class="blueprint-preview__legend">
          <span class="blueprint-preview__floor-label">
            Floor {{ currentFloorData.id === 'G' ? 'G' : currentFloorData.id }} — {{ currentFloorData.name }}
          </span>
          <span class="blueprint-preview__floor-info">{{ currentFloorData.info }}</span>
          <span v-for="cat in currentFloorCats" :key="cat" class="blueprint-preview__legend-item">
            <i class="blueprint-preview__legend-swatch" :style="{ background: CAT[cat] }"></i>
            {{ CAT_LABEL[cat] }}
          </span>
        </div>
        <svg ref="svgRef" :viewBox="`0 0 ${W} ${H}`" xmlns="http://www.w3.org/2000/svg" class="blueprint-preview__svg"></svg>
      </div>

      <div class="blueprint-preview__footer">
        Adjudicator copy · No business may be conducted on the premises · Continental-Idle reference plan
      </div>

      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.blueprint-preview {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.blueprint-preview__content {
  background: #e9e9e6;
  border-radius: 8px;
  max-width: 1280px;
  width: 100%;
  padding: 28px 20px 20px;
  font-family: Arial, Helvetica, sans-serif;
  color: #222222;
}

.blueprint-preview__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid #333333;
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.blueprint-preview__title {
  margin: 0;
  font-family: 'Times New Roman', Georgia, serif;
  letter-spacing: 6px;
  font-size: 28px;
  font-weight: 400;
  color: #1a1a1a;
  text-transform: uppercase;
}

.blueprint-preview__sub {
  font-size: 11px;
  letter-spacing: 3px;
  color: #666666;
  margin-top: 4px;
  text-transform: uppercase;
}

.blueprint-preview__doc-id {
  text-align: right;
  font-size: 11px;
  color: #666666;
  line-height: 1.7;
  letter-spacing: 1px;
}

.blueprint-preview__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.blueprint-preview__tab {
  background: #ffffff;
  border: 1px solid #aaaaaa;
  color: #666666;
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 1px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.blueprint-preview__tab:hover {
  border-color: #333333;
  color: #222222;
}

.blueprint-preview__tab--active {
  background: #333333;
  color: #ffffff;
  border-color: #333333;
  font-weight: bold;
}

.blueprint-preview__sheet {
  background: #ffffff;
  border: 1px solid #aaaaaa;
  position: relative;
}

.blueprint-preview__svg {
  display: block;
  width: 100%;
  height: auto;
}

.blueprint-preview__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border-bottom: 1px solid #aaaaaa;
  font-size: 10.5px;
  color: #666666;
  letter-spacing: 0.5px;
}

.blueprint-preview__floor-label {
  font-size: 13px;
  font-weight: bold;
  color: #222222;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.blueprint-preview__floor-info {
  color: #666666;
  font-size: 10px;
}

.blueprint-preview__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.blueprint-preview__legend-swatch {
  display: inline-block;
  width: 14px;
  height: 10px;
  border: 1px solid #666666;
}

.blueprint-preview__footer {
  text-align: center;
  margin-top: 12px;
  font-size: 10px;
  letter-spacing: 2px;
  color: #999999;
  text-transform: uppercase;
}

.blueprint-preview__content :deep(.game-panel__close) {
  margin-top: 16px;
}
</style>
