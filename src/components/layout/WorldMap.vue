<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { gameState } from '@/engine/game-state'
import { BRANCHES, getBranchDef } from '@/data/branches'
import { eventBus } from '@/engine/event-bus'
import { getBranchIncomePerSecond } from '@/engine/income-engine'
import { canInitiateTakeover, initiateTakeover, getTakeoverCost, getTakeoverProgress, getHqHealthPercent, getAttackersOnTarget } from '@/engine/takeover-manager'
import { formatIncome, formatNumber } from '@/engine/format'
import type { BranchId } from '@/types'

const svgRef = ref<SVGSVGElement | null>(null)
const mapLoading = ref(true)
const mapError = ref(false)
const tooltipVisible = ref(false)
const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipName = ref('')
const tooltipState = ref('')
const tooltipPrestige = ref('')
const tooltipIncome = ref('')
const tooltipTakeover = ref('')

let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let gSel: d3.Selection<SVGGraphicsElement, unknown, null, undefined> | null = null
let cachedWorld: { features: Array<{ type: string; geometry: unknown }> } | null = null

function getNodeState(branchId: BranchId): string {
  const state = gameState.get()
  if (branchId === state.hqBranch) return 'hq'
  if (state.worldMap.conqueredBranches.includes(branchId)) return 'conquered'
  if (state.worldMap.royalBranches.includes(branchId)) return 'royal'
  if (state.worldMap.unlockedBranches.includes(branchId)) return 'active'
  return 'locked'
}

function drawMap() {
  if (!svgRef.value) return

  const svg = svgRef.value
  const width = svg.clientWidth || 800
  const height = svg.clientHeight || 400

  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))

  svgSel = d3.select(svg)
  svgSel.selectAll('*').remove()

  const projection = d3.geoMercator()
    .scale(width / 6.5)
    .translate([width / 2, height / 2])

  const path = d3.geoPath().projection(projection)

  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 8])
    .on('zoom', (event) => {
      if (gSel) gSel.attr('transform', event.transform)
    })

  svgSel.call(zoomBehavior)

  gSel = svgSel.append('g') as unknown as d3.Selection<SVGGraphicsElement, unknown, null, undefined>

  gSel.append('rect')
    .attr('class', 'ocean')
    .attr('width', width)
    .attr('height', height)

  if (cachedWorld) {
    mapLoading.value = false
    gSel.selectAll('path.land')
      .data(cachedWorld.features)
      .enter()
      .append('path')
      .attr('class', 'land')
      .attr('d', path as unknown as (d: unknown) => string)
    drawNodes(projection)
  } else {
    mapLoading.value = true
    mapError.value = false
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((data: unknown) => {
        if (!gSel) return
        const topo = data as { objects: { countries: { type: string; geometries: unknown[] } } }
        cachedWorld = topojson.feature(topo as never, topo.objects.countries as never) as unknown as { features: Array<{ type: string; geometry: unknown }> }
        gSel.selectAll('path.land')
          .data(cachedWorld.features)
          .enter()
          .append('path')
          .attr('class', 'land')
          .attr('d', path as unknown as (d: unknown) => string)
        drawNodes(projection)
        mapLoading.value = false
      })
      .catch(() => {
        mapError.value = true
        mapLoading.value = false
        drawNodes(projection)
      })
  }
}

interface NodeData {
  id: BranchId
  name: string
  lat: number
  lon: number
  accentColor: string
  unlockPrestige: number
  nodeState: string
  income: number
  takeoverProgress: number
  hqHealthPercent: number
  attackerCount: number
}

function drawNodes(projection: d3.GeoProjection) {
  if (!gSel) return
  const state = gameState.get()

  const nodes: NodeData[] = BRANCHES.map(t => ({
    id: t.id,
    name: t.name,
    lat: t.lat,
    lon: t.lon,
    accentColor: t.accentColor,
    unlockPrestige: t.unlockPrestige,
    nodeState: getNodeState(t.id),
    income: getBranchIncomePerSecond(t.id),
    takeoverProgress: getTakeoverProgress(t.id),
    hqHealthPercent: getHqHealthPercent(t.id),
    attackerCount: getAttackersOnTarget(t.id),
  }))

  const activeNodes = nodes.filter(d => d.nodeState === 'hq' || d.nodeState === 'active')

  // Connection lines between active nodes
  interface ConnectionPair {
    x1: number; y1: number; x2: number; y2: number;
    from: string; to: string;
  }
  const connectionPairs: ConnectionPair[] = []
  for (let i = 0; i < activeNodes.length; i++) {
    for (let j = i + 1; j < activeNodes.length; j++) {
      const c1 = projection([activeNodes[i].lon, activeNodes[i].lat])
      const c2 = projection([activeNodes[j].lon, activeNodes[j].lat])
      if (c1 && c2) {
        connectionPairs.push({
          x1: c1[0], y1: c1[1], x2: c2[0], y2: c2[1],
          from: activeNodes[i].name, to: activeNodes[j].name,
        })
      }
    }
  }

  gSel.selectAll('.connection-line')
    .data(connectionPairs)
    .enter()
    .insert('line', '.node-group')
    .attr('class', d => {
      const hasHQ = d.from === getBranchDef(state.hqBranch).name || d.to === getBranchDef(state.hqBranch).name
      return 'connection-line' + (hasHQ ? ' active-route' : '')
    })
    .attr('x1', d => d.x1)
    .attr('y1', d => d.y1)
    .attr('x2', d => d.x2)
    .attr('y2', d => d.y2)

  // Node groups
  const nodeGroups = gSel.selectAll('.node-group')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => `node-group node-${d.nodeState}`)
    .attr('transform', d => {
      const coords = projection([d.lon, d.lat])
      return coords ? `translate(${coords[0]},${coords[1]})` : ''
    })
    .style('cursor', d => d.nodeState === 'locked' ? 'not-allowed' : 'pointer')
    .attr('tabindex', d => d.nodeState === 'locked' ? -1 : 0)
    .attr('role', 'button')
    .attr('aria-label', d => `${d.name} — ${d.nodeState}`)

  // Pulse rings for HQ and active
  nodeGroups.filter(d => d.nodeState === 'hq' || d.nodeState === 'active')
    .append('circle')
    .attr('class', 'node-pulse')
    .attr('r', 8)
    .style('stroke', d => d.nodeState === 'hq' ? '#ffd700' : '#4caf50')

  // Hover ring
  nodeGroups.append('circle')
    .attr('class', 'node-ring')
    .attr('r', 12)
    .style('stroke', d => d.nodeState === 'hq' ? '#ffd700' : d.nodeState === 'active' ? '#4caf50' : '#666')

  // Node circle
  nodeGroups.append('circle')
    .attr('r', 6)
    .attr('class', 'node-circle')
    .style('fill', d => {
      if (d.nodeState === 'hq') return '#ffd700'
      if (d.nodeState === 'active') return '#4caf50'
      if (d.nodeState === 'conquered') return '#9c27b0'
      if (d.nodeState === 'royal') return '#1e88e5'
      return '#555'
    })
    .style('stroke', d => d.id === state.activeBranch ? '#fff' : 'none')
    .style('stroke-width', '2px')

  // Node icon
  nodeGroups.append('text')
    .attr('class', 'node-icon')
    .attr('dy', 3)
    .attr('text-anchor', 'middle')
    .style('font-size', '9px')
    .style('fill', '#0a0a0a')
    .style('pointer-events', 'none')
    .text(d => d.nodeState === 'hq' ? '\u2605' : d.nodeState === 'active' ? '' : '')

  // Node label
  nodeGroups.append('text')
    .attr('class', 'node-label')
    .attr('dy', 16)
    .attr('text-anchor', 'middle')
    .style('font-size', '8px')
    .style('fill', d => d.nodeState === 'locked' ? '#666' : '#aaa')
    .style('pointer-events', 'none')
    .text(d => d.name)

  // Takeover progress ring + HQ Health Bar
  nodeGroups.filter(d => d.takeoverProgress > 0 && d.nodeState === 'locked')
    .append('circle')
    .attr('class', 'node-takeover-ring')
    .attr('r', 9)
    .style('fill', 'none')
    .style('stroke', '#ff9800')
    .style('stroke-width', '2px')
    .style('stroke-dasharray', d => {
      const circumference = 2 * Math.PI * 9
      const filled = (d.takeoverProgress / 100) * circumference
      return `${filled} ${circumference}`
    })
    .style('stroke-dashoffset', '0')
    .style('transform', 'rotate(-90deg)')
    .style('transform-origin', 'center')
    .style('pointer-events', 'none')

  nodeGroups.filter(d => d.takeoverProgress > 0 && d.nodeState === 'locked')
    .append('text')
    .attr('class', 'node-takeover-label')
    .attr('dy', -12)
    .attr('text-anchor', 'middle')
    .style('font-size', '7px')
    .style('fill', '#ff9800')
    .style('pointer-events', 'none')
    .text(d => `${d.takeoverProgress.toFixed(0)}%`)

  // HQ Health bar for locked nodes with active takeover
  nodeGroups.filter(d => d.takeoverProgress > 0 && d.nodeState === 'locked')
    .each(function(this: SVGGElement, d: NodeData) {
      const g = d3.select(this)
      const barWidth = 24
      const barHeight = 3
      const barY = 14

      g.append('rect')
        .attr('class', 'node-hpbar-bg')
        .attr('x', -barWidth / 2)
        .attr('y', barY)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .style('fill', '#333')
        .style('pointer-events', 'none')

      g.append('rect')
        .attr('class', 'node-hpbar-fill')
        .attr('x', -barWidth / 2)
        .attr('y', barY)
        .attr('width', barWidth * d.hqHealthPercent / 100)
        .attr('height', barHeight)
        .style('fill', d.hqHealthPercent > 50 ? '#4caf50' : d.hqHealthPercent > 25 ? '#ff9800' : '#f44336')
        .style('pointer-events', 'none')

      if (d.attackerCount > 0) {
        g.append('text')
          .attr('class', 'node-attacker-count')
          .attr('dy', barY + 10)
          .attr('text-anchor', 'middle')
          .style('font-size', '6px')
          .style('fill', '#ff5722')
          .style('pointer-events', 'none')
          .text(`\u2694 ${d.attackerCount}`)
      }
    })

  // Interactions
  nodeGroups
    .on('mouseover', function(this: SVGGElement, _, d: NodeData) {
      tooltipVisible.value = true
      tooltipName.value = d.name
      tooltipState.value = d.nodeState.toUpperCase()
      tooltipPrestige.value = d.unlockPrestige === 0 ? 'FREE' : `P${d.unlockPrestige}`
      tooltipIncome.value = d.nodeState === 'locked' ? 'Locked' : formatIncome(d.income)
      if (d.nodeState === 'locked') {
        const canTake = canInitiateTakeover(d.id)
        const progress = getTakeoverProgress(d.id)
        const hpPercent = getHqHealthPercent(d.id)
        const attackers = getAttackersOnTarget(d.id)
        if (progress > 0) {
          tooltipTakeover.value = `HQ HP: ${hpPercent.toFixed(0)}% | Attackers: ${attackers}`
        } else if (canTake) {
          tooltipTakeover.value = `Click to start takeover (${formatNumber(getTakeoverCost(d.id))})`
        } else {
          tooltipTakeover.value = ''
        }
      } else {
        tooltipTakeover.value = ''
      }
      d3.select(this).select('.node-ring').classed('visible', true)
    })
    .on('mousemove', function (event) {
      const rect = svgRef.value!.getBoundingClientRect()
      tooltipX.value = event.clientX - rect.left + 12
      tooltipY.value = event.clientY - rect.top - 10
    })
    .on('mouseout', function () {
      tooltipVisible.value = false
      d3.select(this).select('.node-ring').classed('visible', false)
    })
    .on('click', function(this: SVGGElement, event: MouseEvent, d: NodeData) {
      event.stopPropagation()
      const gs = gameState.get()
      if (gs.worldMap.unlockedBranches.includes(d.id)) {
        gameState.setActiveBranch(d.id)
        eventBus.emit('branch:switch', { branchId: d.id })
        eventBus.emit('income:update')
        redrawNodes()
      } else if (canInitiateTakeover(d.id) && getTakeoverProgress(d.id) === 0) {
        initiateTakeover(d.id)
        redrawNodes()
      }
    })
    .on('keydown', function(this: SVGGElement, event: KeyboardEvent, d: NodeData) {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      event.stopPropagation()
      const gs = gameState.get()
      if (gs.worldMap.unlockedBranches.includes(d.id)) {
        gameState.setActiveBranch(d.id)
        eventBus.emit('branch:switch', { branchId: d.id })
        eventBus.emit('income:update')
        redrawNodes()
      } else if (canInitiateTakeover(d.id) && getTakeoverProgress(d.id) === 0) {
        initiateTakeover(d.id)
        redrawNodes()
      }
    })
}

function redrawNodes() {
  if (!gSel) return
  gSel.selectAll('.node-group').remove()
  gSel.selectAll('.connection-line').remove()
  const w = svgRef.value?.clientWidth || 800
  const h = svgRef.value?.clientHeight || 400
  const projection = d3.geoMercator()
    .scale(w / 6.5)
    .translate([w / 2, h / 2])
  drawNodes(projection)
}

function zoomIn() {
  if (svgSel && zoomBehavior) svgSel.transition().call(zoomBehavior.scaleBy, 1.5)
}

function zoomOut() {
  if (svgSel && zoomBehavior) svgSel.transition().call(zoomBehavior.scaleBy, 1 / 1.5)
}

function resetZoom() {
  if (svgSel && zoomBehavior) svgSel.transition().call(zoomBehavior.transform, d3.zoomIdentity)
}

function updateTakeoverProgress() {
  if (!gSel) return
  gSel.selectAll<SVGGElement, NodeData>('.node-group').each(function(d: NodeData) {
    const progress = getTakeoverProgress(d.id)
    const hpPercent = getHqHealthPercent(d.id)
    const attackerCount = getAttackersOnTarget(d.id)
    const sel = d3.select(this)
    const existingRing = sel.select('.node-takeover-ring')
    const existingLabel = sel.select('.node-takeover-label')
    const existingHpBg = sel.select('.node-hpbar-bg')
    const existingHpFill = sel.select('.node-hpbar-fill')
    const existingAttacker = sel.select('.node-attacker-count')

    if (progress > 0 && d.nodeState === 'locked') {
      const circumference = 2 * Math.PI * 9
      const filled = (progress / 100) * circumference
      if (existingRing.empty()) {
        sel.append('circle')
          .attr('class', 'node-takeover-ring')
          .attr('r', 9)
          .style('fill', 'none')
          .style('stroke', '#ff9800')
          .style('stroke-width', '2px')
          .style('stroke-dasharray', `${filled} ${circumference}`)
          .style('stroke-dashoffset', '0')
          .style('transform', 'rotate(-90deg)')
          .style('transform-origin', 'center')
          .style('pointer-events', 'none')
        sel.append('text')
          .attr('class', 'node-takeover-label')
          .attr('dy', -12)
          .attr('text-anchor', 'middle')
          .style('font-size', '7px')
          .style('fill', '#ff9800')
          .style('pointer-events', 'none')
          .text(`${progress.toFixed(0)}%`)

        const barWidth = 24
        const barHeight = 3
        const barY = 14
        sel.append('rect')
          .attr('class', 'node-hpbar-bg')
          .attr('x', -barWidth / 2)
          .attr('y', barY)
          .attr('width', barWidth)
          .attr('height', barHeight)
          .style('fill', '#333')
          .style('pointer-events', 'none')
        sel.append('rect')
          .attr('class', 'node-hpbar-fill')
          .attr('x', -barWidth / 2)
          .attr('y', barY)
          .attr('width', barWidth * hpPercent / 100)
          .attr('height', barHeight)
          .style('fill', hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336')
          .style('pointer-events', 'none')
      } else {
        existingRing.style('stroke-dasharray', `${filled} ${circumference}`)
        existingLabel.text(`${progress.toFixed(0)}%`)
        existingHpFill
          .attr('width', 24 * hpPercent / 100)
          .style('fill', hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336')
      }

      if (attackerCount > 0 && existingAttacker.empty()) {
        sel.append('text')
          .attr('class', 'node-attacker-count')
          .attr('dy', 24)
          .attr('text-anchor', 'middle')
          .style('font-size', '6px')
          .style('fill', '#ff5722')
          .style('pointer-events', 'none')
          .text(`\u2694 ${attackerCount}`)
      } else if (attackerCount > 0) {
        existingAttacker.text(`\u2694 ${attackerCount}`)
      } else if (!existingAttacker.empty()) {
        existingAttacker.remove()
      }
    } else {
      existingRing.remove()
      existingLabel.remove()
      existingHpBg.remove()
      existingHpFill.remove()
      existingAttacker.remove()
    }
  })
}

function update() {
  redrawNodes()
}

onMounted(() => {
  drawMap()
  eventBus.on('branch:unlock', update)
  eventBus.on('branch:royal', update)
  eventBus.on('prestige:reset', update)
  eventBus.on('income:update', update)
  eventBus.on('income:tick', updateTakeoverProgress)
  eventBus.on('takeover:complete', update)
  window.addEventListener('resize', drawMap)
})

onUnmounted(() => {
  window.removeEventListener('resize', drawMap)
  eventBus.off('branch:unlock', update)
  eventBus.off('branch:royal', update)
  eventBus.off('prestige:reset', update)
  eventBus.off('income:update', update)
  eventBus.off('income:tick', updateTakeoverProgress)
  eventBus.off('takeover:complete', update)
})
</script>

<template>
  <div class="world-map">
    <svg ref="svgRef" class="world-map__svg"></svg>

    <div v-if="mapLoading" class="world-map__status world-map__status--loading">
      Loading world map...
    </div>
    <div v-if="mapError" class="world-map__status world-map__status--error">
      Map data unavailable — showing branches only
    </div>

    <div class="world-map__controls">
      <button class="world-map__btn" aria-label="Zoom in" @click="zoomIn">+</button>
      <button class="world-map__btn" aria-label="Zoom out" @click="zoomOut">-</button>
      <button class="world-map__btn" aria-label="Reset zoom" @click="resetZoom">Reset</button>
    </div>

    <div class="world-map__legend">
      <div class="world-map__legend-item">
        <span class="world-map__legend-dot" style="background: #ffd700;"></span>
        HQ
      </div>
      <div class="world-map__legend-item">
        <span class="world-map__legend-dot" style="background: #4caf50;"></span>
        Active
      </div>
      <div class="world-map__legend-item">
        <span class="world-map__legend-dot" style="background: #9c27b0;"></span>
        Conquered
      </div>
      <div class="world-map__legend-item">
        <span class="world-map__legend-dot" style="background: #1e88e5;"></span>
        Royal
      </div>
      <div class="world-map__legend-item">
        <span class="world-map__legend-dot" style="background: #555;"></span>
        Locked
      </div>
    </div>

    <div
      v-if="tooltipVisible"
      class="world-map__tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="world-map__tooltip-name">{{ tooltipName }}</div>
      <div class="world-map__tooltip-row">State: <span class="world-map__tooltip-val">{{ tooltipState }}</span></div>
      <div class="world-map__tooltip-row">Prestige: <span class="world-map__tooltip-val">{{ tooltipPrestige }}</span></div>
      <div class="world-map__tooltip-row">Income: <span class="world-map__tooltip-val">{{ tooltipIncome }}</span></div>
      <div v-if="tooltipTakeover" class="world-map__tooltip-row" style="color: var(--accent-orange);">{{ tooltipTakeover }}</div>
    </div>
  </div>
</template>
