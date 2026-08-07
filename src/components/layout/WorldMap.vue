<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { gameState } from '@/engine/gameState'
import { BRANCHES, getBranchDef } from '@/data/branches'
import { eventBus } from '@/engine/eventBus'
import { getBranchIncomePerSecond } from '@/engine/incomeEngine'
import { canInitiateTakeover, initiateTakeover, getTakeoverCost, getTakeoverProgress, getHqHealthPercent, getAttackersOnTarget, getActiveAttackRoutes } from '@/engine/takeoverManager'
import { getAIOwner } from '@/engine/aiOwnerManager'
import { getSupplyRoutes } from '@/engine/supplyRouteManager'
import { SUPPLY_ROUTE_MAP } from '@/data/supplyRoutes'
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
const tooltipOwner = ref('')

let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let gSel: d3.Selection<SVGGraphicsElement, unknown, null, undefined> | null = null
let cachedWorld: { features: Array<{ type: string; geometry: unknown }> } | null = null
let redrawFrameId: number | null = null
let resizeFrameId: number | null = null

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
    const fetchPromise = d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Map data fetch timeout')), 10000)
    )
    Promise.race([fetchPromise, timeoutPromise])
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

function drawAttackLines(projection: d3.GeoProjection) {
  if (!gSel) return
  const routes = getActiveAttackRoutes()
  if (routes.length === 0) return

  gSel.selectAll('.attackline').remove()
  gSel.selectAll('[data-map-layer="attack-plane"]').remove()

  const attackLayer = gSel.insert('g', '.nodegroup').attr('data-map-layer', 'attack')

  routes.forEach((route, idx) => {
    const fromDef = BRANCHES.find(b => b.id === route.from)
    const toDef = BRANCHES.find(b => b.id === route.to)
    if (!fromDef || !toDef) return

    const fromCoords = projection([fromDef.lon, fromDef.lat])
    const toCoords = projection([toDef.lon, toDef.lat])
    if (!fromCoords || !toCoords) return

    const [x1, y1] = fromCoords
    const [x2, y2] = toCoords
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const offset = Math.min(dist * 0.3, 60)
    const angle = Math.atan2(dy, dx)
    const ctrlX = midX + Math.sin(angle) * offset
    const ctrlY = midY - Math.cos(angle) * offset
    const pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`

    const routeId = `attack-path-${idx}`

    attackLayer.append('path')
      .attr('class', 'attackline')
      .attr('d', pathD)
      .attr('id', routeId)
      .style('fill', 'none')
      .style('stroke', 'var(--accent-red)')
      .style('stroke_width', '1.5px')
      .style('stroke_dasharray', '6 4')
      .style('opacity', '0.7')
      .style('pointer_events', 'none')

    const planeGroup = attackLayer.append('g')
      .attr('data-map-layer', 'attack-plane')
      .style('pointer_events', 'none')

    planeGroup.append('text')
      .attr('text_anchor', 'middle')
      .attr('dy', 3)
      .style('font_size', '10px')
      .style('fill', 'var(--accent-red)')
      .text('\u2708')

    if (route.attackerCount > 1) {
      planeGroup.append('text')
        .attr('text_anchor', 'middle')
        .attr('dy', -6)
        .style('font_size', '7px')
        .style('fill', 'var(--accent-red)')
        .style('font_weight', 'bold')
        .text(`x${route.attackerCount}`)
    }

    const pathEl = document.getElementById(routeId) as SVGPathElement | null
    if (pathEl) {
      const duration = Math.max(2000, Math.min(6000, dist * 15))

      planeGroup.append('animateMotion')
        .attr('dur', `${duration}ms`)
        .attr('repeatCount', 'indefinite')
        .attr('rotate', 'auto')
        .attr('path', pathD)
    }
  })
}

function drawSupplyRoutes(projection: d3.GeoProjection) {
  if (!gSel) return
  const supplyRoutes = getSupplyRoutes()
  if (supplyRoutes.length === 0) return

  gSel.selectAll('.supplyline').remove()
  gSel.selectAll('[data-map-layer="supply-truck"]').remove()

  const supplyLayer = gSel.insert('g', '.nodegroup').attr('data-map-layer', 'supply')

  supplyRoutes.forEach((route, idx) => {
    const fromDef = BRANCHES.find(b => b.id === route.from)
    const toDef = BRANCHES.find(b => b.id === route.to)
    if (!fromDef || !toDef) return

    const fromCoords = projection([fromDef.lon, fromDef.lat])
    const toCoords = projection([toDef.lon, toDef.lat])
    if (!fromCoords || !toCoords) return

    const [x1, y1] = fromCoords
    const [x2, y2] = toCoords
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const offset = Math.min(dist * 0.25, 50)
    const angle = Math.atan2(dy, dx)
    const ctrlX = midX - Math.sin(angle) * offset
    const ctrlY = midY + Math.cos(angle) * offset
    const pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`

    const routeId = `supply-path-${idx}`
    const typeDef = SUPPLY_ROUTE_MAP[route.type]
    const color = typeDef?.color ?? 'var(--text-dim)'
    const opacity = 0.3 + (route.stability / 100) * 0.5

    supplyLayer.append('path')
      .attr('class', 'supplyline')
      .attr('d', pathD)
      .attr('id', routeId)
      .style('fill', 'none')
      .style('stroke', color)
      .style('stroke_width', '2px')
      .style('stroke_dasharray', '8 6')
      .style('opacity', String(opacity))
      .style('pointer_events', 'none')

    const truckGroup = supplyLayer.append('g')
      .attr('data-map-layer', 'supply-truck')
      .style('pointer_events', 'none')

    truckGroup.append('text')
      .attr('text_anchor', 'middle')
      .attr('dy', 3)
      .style('font_size', '9px')
      .style('fill', color)
      .text(typeDef?.icon || '\u2693')

    const pathEl = document.getElementById(routeId) as SVGPathElement | null
    if (pathEl) {
      const duration = Math.max(3000, Math.min(8000, dist * 20))

      truckGroup.append('animateMotion')
        .attr('dur', `${duration}ms`)
        .attr('repeatCount', 'indefinite')
        .attr('rotate', 'auto')
        .attr('path', pathD)
    }
  })
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

  gSel.selectAll('.connectionline')
    .data(connectionPairs)
    .enter()
    .insert('line', '.nodegroup')
    .attr('class', d => {
      const hasHQ = d.from === getBranchDef(state.hqBranch).name || d.to === getBranchDef(state.hqBranch).name
      return 'connectionline' + (hasHQ ? ' active__route' : '')
    })
    .attr('x1', d => d.x1)
    .attr('y1', d => d.y1)
    .attr('x2', d => d.x2)
    .attr('y2', d => d.y2)


  const nodeGroups = gSel.selectAll('.nodegroup')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => d.nodeState === 'locked' ? 'nodegroup nodelocked' : 'nodegroup')
    .attr('transform', d => {
      const coords = projection([d.lon, d.lat])
      return coords ? `translate(${coords[0]},${coords[1]})` : ''
    })
    .style('cursor', d => d.nodeState === 'locked' ? 'not_allowed' : 'pointer')
    .attr('tabindex', d => d.nodeState === 'locked' ? -1 : 0)
    .attr('role', 'button')
    .attr('aria_label', d => `${d.name} — ${d.nodeState}`)


  nodeGroups.filter(d => d.nodeState === 'hq' || d.nodeState === 'active')
    .append('circle')
    .attr('class', 'nodepulse')
    .attr('r', 8)
    .style('stroke', d => d.nodeState === 'hq' ? 'var(--accent-gold)' : 'var(--accent-green)')


  nodeGroups.append('circle')
    .attr('class', 'nodering')
    .attr('r', 12)
    .style('stroke', d => d.nodeState === 'hq' ? 'var(--accent-gold)' : d.nodeState === 'active' ? 'var(--accent-green)' : 'var(--text-dim)')


  nodeGroups.each(function(this: SVGGElement, d: NodeData) {
    const g = d3.select(this)
    if (d.nodeState === 'hq') {

      g.append('rect')
                .attr('x', -8)
        .attr('y', -6)
        .attr('width', 16)
        .attr('height', 12)
        .style('fill', 'var(--bg-card)')
        .style('stroke', d.id === state.activeBranch ? 'var(--accent-gold)' : 'var(--border-dim)')
        .style('stroke_width', '1px')
    } else {

      g.append('circle')
        .attr('r', 6)
        .attr('class', 'nodecircle')
        .style('fill', () => {
          if (d.nodeState === 'active') return 'var(--accent-green)'
          if (d.nodeState === 'conquered') return 'var(--accent-blue)'
          if (d.nodeState === 'royal') return 'var(--accent-blue)'
          return 'var(--text-dim)'
        })
        .style('stroke', d.id === state.activeBranch ? 'var(--text-bright)' : 'none')
        .style('stroke_width', '2px')
    }
  })


  nodeGroups.append('text')
        .attr('dy', 3)
    .attr('text_anchor', 'middle')
    .style('font_size', '9px')
    .style('fill', 'var(--bg-primary)')
    .style('pointer_events', 'none')
    .text(d => d.nodeState === 'hq' ? '\u2605' : d.nodeState === 'active' ? '' : '')


  nodeGroups.append('text')
    .attr('class', 'nodelabel')
    .attr('dy', 16)
    .attr('text_anchor', 'middle')
    .style('font_size', '8px')
    .style('fill', d => d.nodeState === 'locked' ? 'var(--text-dim)' : 'var(--text-dim)')
    .style('pointer_events', 'none')
    .text(d => d.name)


  nodeGroups.filter(d => d.takeoverProgress > 0 && d.nodeState === 'locked')
    .append('circle')
    .attr('data-map-element', 'takeover-ring')
    .attr('r', 9)
    .style('fill', 'none')
    .style('stroke', 'var(--accent-gold)')
    .style('stroke_width', '2px')
    .style('stroke_dasharray', d => {
      const circumference = 2 * Math.PI * 9
      const filled = (d.takeoverProgress / 100) * circumference
      return `${filled} ${circumference}`
    })
    .style('stroke_dashoffset', '0')
    .style('transform', 'rotate(-90deg)')
    .style('transform_origin', 'center')
    .style('pointer_events', 'none')

  nodeGroups.filter(d => d.takeoverProgress > 0 && d.nodeState === 'locked')
    .append('text')
    .attr('data-map-element', 'takeover-label')
    .attr('dy', -12)
    .attr('text_anchor', 'middle')
    .style('font_size', '7px')
    .style('fill', 'var(--accent-gold)')
    .style('pointer_events', 'none')
    .text(d => `${d.takeoverProgress.toFixed(0)}%`)


  nodeGroups.filter(d => d.takeoverProgress > 0 && d.nodeState === 'locked')
    .each(function(this: SVGGElement, d: NodeData) {
      const g = d3.select(this)
      const barWidth = 24
      const barHeight = 3
      const barY = 14

      g.append('rect')
        .attr('data-map-element', 'hpbar-bg')
        .attr('x', -barWidth / 2)
        .attr('y', barY)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .style('fill', 'var(--border-dim)')
        .style('pointer_events', 'none')

      g.append('rect')
        .attr('data-map-element', 'hpbar-fill')
        .attr('x', -barWidth / 2)
        .attr('y', barY)
        .attr('width', barWidth * d.hqHealthPercent / 100)
        .attr('height', barHeight)
        .style('fill', d.hqHealthPercent > 50 ? 'var(--accent-green)' : d.hqHealthPercent > 25 ? 'var(--accent-gold)' : 'var(--accent-red)')
        .style('pointer_events', 'none')

      if (d.attackerCount > 0) {
        g.append('text')
          .attr('data-map-element', 'attacker-count')
          .attr('dy', barY + 10)
          .attr('text_anchor', 'middle')
          .style('font_size', '6px')
          .style('fill', 'var(--accent-red)')
          .style('pointer_events', 'none')
          .text(`\u2694 ${d.attackerCount}`)
      }
    })


  nodeGroups
    .on('mouseover', function(this: SVGGElement, _, d: NodeData) {
      tooltipVisible.value = true
      tooltipName.value = d.name
      tooltipState.value = d.nodeState.toUpperCase()
      if (d.nodeState === 'hq' || d.nodeState === 'active' || d.nodeState === 'conquered' || d.nodeState === 'royal') {
        tooltipOwner.value = 'You'
      } else {
        const owner = getAIOwner(d.id)
        tooltipOwner.value = owner ? owner.name : 'Unknown'
      }
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
      d3.select(this).select('.nodering').classed('visible', true)
    })
    .on('mousemove', function (event) {
      const rect = svgRef.value!.getBoundingClientRect()
      tooltipX.value = event.clientX - rect.left + 12
      tooltipY.value = event.clientY - rect.top - 10
    })
    .on('mouseout', function () {
      tooltipVisible.value = false
      d3.select(this).select('.nodering').classed('visible', false)
    })
    .on('click', function(this: SVGGElement, event: MouseEvent, d: NodeData) {
      event.stopPropagation()
      const gs = gameState.get()
      if (d.nodeState === 'hq') {
        if (gs.activeBranch !== d.id) {
          gameState.setActiveBranch(d.id)
          eventBus.emit('branch:switch', { branchId: d.id })
          eventBus.emit('income:update')
          redrawNodes()
        }
        eventBus.emit('hq:office-view')
        return
      }
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
      if (d.nodeState === 'hq') {
        if (gs.activeBranch !== d.id) {
          gameState.setActiveBranch(d.id)
          eventBus.emit('branch:switch', { branchId: d.id })
          eventBus.emit('income:update')
          redrawNodes()
        }
        eventBus.emit('hq:office-view')
        return
      }
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
  gSel.selectAll('.nodegroup').remove()
  gSel.selectAll('.connectionline').remove()
  gSel.selectAll('.attackline').remove()
  gSel.selectAll('[data-map-layer="attack-plane"]').remove()
  gSel.selectAll('.supplyline').remove()
  gSel.selectAll('[data-map-layer="supply-truck"]').remove()
  const w = svgRef.value?.clientWidth || 800
  const h = svgRef.value?.clientHeight || 400
  const projection = d3.geoMercator()
    .scale(w / 6.5)
    .translate([w / 2, h / 2])
  drawSupplyRoutes(projection)
  drawAttackLines(projection)
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

let lastTakeoverUpdate = 0

function updateTakeoverProgress() {
  const now = Date.now()
  if (now - lastTakeoverUpdate < 5000) return
  lastTakeoverUpdate = now
  if (!gSel) return

  const w = svgRef.value?.clientWidth || 800
  const h = svgRef.value?.clientHeight || 400
  const projection = d3.geoMercator()
    .scale(w / 6.5)
    .translate([w / 2, h / 2])
  drawAttackLines(projection)
  drawSupplyRoutes(projection)

  gSel.selectAll<SVGGElement, NodeData>('.nodegroup').each(function(d: NodeData) {
    const progress = getTakeoverProgress(d.id)
    const hpPercent = getHqHealthPercent(d.id)
    const attackerCount = getAttackersOnTarget(d.id)
    const sel = d3.select(this)
    const existingRing = sel.select('[data-map-element="takeover-ring"]')
    const existingLabel = sel.select('[data-map-element="takeover-label"]')
    const existingHpBg = sel.select('[data-map-element="hpbar-bg"]')
    const existingHpFill = sel.select('[data-map-element="hpbar-fill"]')
    const existingAttacker = sel.select('[data-map-element="attacker-count"]')

    if (progress > 0 && d.nodeState === 'locked') {
      const circumference = 2 * Math.PI * 9
      const filled = (progress / 100) * circumference
      if (existingRing.empty()) {
        sel.append('circle')
          .attr('data-map-element', 'takeover-ring')
          .attr('r', 9)
          .style('fill', 'none')
          .style('stroke', 'var(--accent-gold)')
          .style('stroke_width', '2px')
          .style('stroke_dasharray', `${filled} ${circumference}`)
          .style('stroke_dashoffset', '0')
          .style('transform', 'rotate(-90deg)')
          .style('transform_origin', 'center')
          .style('pointer_events', 'none')
        sel.append('text')
          .attr('data-map-element', 'takeover-label')
          .attr('dy', -12)
          .attr('text_anchor', 'middle')
          .style('font_size', '7px')
          .style('fill', 'var(--accent-gold)')
          .style('pointer_events', 'none')
          .text(`${progress.toFixed(0)}%`)

        const barWidth = 24
        const barHeight = 3
        const barY = 14
        sel.append('rect')
          .attr('data-map-element', 'hpbar-bg')
          .attr('x', -barWidth / 2)
          .attr('y', barY)
          .attr('width', barWidth)
          .attr('height', barHeight)
          .style('fill', 'var(--border-dim)')
          .style('pointer_events', 'none')
        sel.append('rect')
          .attr('data-map-element', 'hpbar-fill')
          .attr('x', -barWidth / 2)
          .attr('y', barY)
          .attr('width', barWidth * hpPercent / 100)
          .attr('height', barHeight)
          .style('fill', hpPercent > 50 ? 'var(--accent-green)' : hpPercent > 25 ? 'var(--accent-gold)' : 'var(--accent-red)')
          .style('pointer_events', 'none')
      } else {
        existingRing.style('stroke_dasharray', `${filled} ${circumference}`)
        existingLabel.text(`${progress.toFixed(0)}%`)
        existingHpFill
          .attr('width', 24 * hpPercent / 100)
          .style('fill', hpPercent > 50 ? 'var(--accent-green)' : hpPercent > 25 ? 'var(--accent-gold)' : 'var(--accent-red)')
      }

      if (attackerCount > 0 && existingAttacker.empty()) {
        sel.append('text')
          .attr('data-map-element', 'attacker-count')
          .attr('dy', 24)
          .attr('text_anchor', 'middle')
          .style('font_size', '6px')
          .style('fill', 'var(--accent-red)')
          .style('pointer_events', 'none')
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

function scheduleRedraw(): void {
  if (redrawFrameId !== null) return
  redrawFrameId = requestAnimationFrame(() => {
    redrawFrameId = null
    redrawNodes()
  })
}

function handleResize(): void {
  if (resizeFrameId !== null) return
  resizeFrameId = requestAnimationFrame(() => {
    resizeFrameId = null
    drawMap()
  })
}

function update() {
  scheduleRedraw()
}

onMounted(() => {
  drawMap()
  eventBus.on('branch:unlock', update)
  eventBus.on('branch:royal', update)
  eventBus.on('prestige:reset', update)
  eventBus.on('income:update', update)
  eventBus.on('income:tick', updateTakeoverProgress)
  eventBus.on('takeover:complete', update)
  eventBus.on('takeover:started', update)
  eventBus.on('assassin:attack', update)
  eventBus.on('assassin:attack-cancel', update)
  eventBus.on('assassin:recalled', update)
  eventBus.on('supplyroute:established', update)
  eventBus.on('supplyroute:hijacked', update)
  eventBus.on('supplyroute:collapsed', update)
  eventBus.on('supplyroute:dismantled', update)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (redrawFrameId !== null) cancelAnimationFrame(redrawFrameId)
  if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId)
  eventBus.off('supplyroute:established', update)
  eventBus.off('supplyroute:hijacked', update)
  eventBus.off('supplyroute:collapsed', update)
  eventBus.off('supplyroute:dismantled', update)
  window.removeEventListener('resize', handleResize)
  eventBus.off('branch:unlock', update)
  eventBus.off('branch:royal', update)
  eventBus.off('prestige:reset', update)
  eventBus.off('income:update', update)
  eventBus.off('income:tick', updateTakeoverProgress)
  eventBus.off('takeover:complete', update)
  eventBus.off('takeover:started', update)
  eventBus.off('assassin:attack', update)
  eventBus.off('assassin:attack-cancel', update)
  eventBus.off('assassin:recalled', update)
})
</script>

<template>
  <div class="map">
    <svg ref="svgRef" class="map__svg"></svg>

    <div v-if="mapLoading" class="map__status map__status__loading">
      Loading world map...
    </div>
    <div v-if="mapError" class="map__status map__status__error">
      Map data unavailable — showing branches only
    </div>

    <div class="map__controls">
      <button class="map__btn" aria-label="Zoom in" @click="zoomIn">+</button>
      <button class="map__btn" aria-label="Zoom out" @click="zoomOut">-</button>
      <button class="map__btn" aria-label="Reset zoom" @click="resetZoom">Reset</button>
    </div>

    <div class="map__legend">
      <div class="map__legend">
        <span class="map__legenddot" style="background: var(--accent-gold);"></span>
        HQ
      </div>
      <div class="map__legend">
        <span class="map__legenddot" style="background: var(--accent-green);"></span>
        Active
      </div>
      <div class="map__legend">
        <span class="map__legenddot" style="background: var(--accent-blue);"></span>
        Conquered
      </div>
      <div class="map__legend">
        <span class="map__legenddot" style="background: var(--accent-blue);"></span>
        Royal
      </div>
      <div class="map__legend">
        <span class="map__legenddot" style="background: var(--text-dim);"></span>
        Locked
      </div>
    </div>

    <div
      v-if="tooltipVisible"
      class="map__tooltip"
      role="tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="map__tipname">{{ tooltipName }}</div>
      <div class="map__tiprow">Owner: <span class="map__tipval">{{ tooltipOwner }}</span></div>
      <div class="map__tiprow">State: <span class="map__tipval">{{ tooltipState }}</span></div>
      <div class="map__tiprow">Prestige: <span class="map__tipval">{{ tooltipPrestige }}</span></div>
      <div class="map__tiprow">Income: <span class="map__tipval">{{ tooltipIncome }}</span></div>
      <div v-if="tooltipTakeover" class="map__tiprow" style="color: var(--accent-gold);">{{ tooltipTakeover }}</div>
    </div>
  </div>
</template>
