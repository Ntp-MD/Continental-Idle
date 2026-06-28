<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { gameState } from '@/engine/game-state'
import { getBranchDef } from '@/data/branches'
import { BUILDINGS } from '@/data/buildings'
import { STAFF_MAP } from '@/data/staff'
import { ASSASSIN_MAP } from '@/data/assassins'
import { getAIOwner } from '@/engine/ai-owner-manager'

const props = defineProps<{ inline?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const SVG_W = 1088
const SVG_H = 680

// Continental Hotel color palette
const GOLD = '#c9a84c'
const GOLD_DIM = '#8a7340'
const GOLD_DARK = '#5a5a5a'
const BG_DARK = '#1a1a1a'
const BG_DARKER = '#0d0d0d'
const BG_CORRIDOR = '#111111'
const LABEL_DARK = '#333333'

// Room fills per floor type
const FLOOR_FILLS: Record<string, string> = {
  reception: 'url(#marble)',
  bar: 'url(#tile)',
  kitchen: '#1a1a1a',
  guestRooms: '#111111',
  vip: 'url(#wood)',
  armory: '#0d0d0d',
  vault: 'url(#wood)',
  underground: '#111111',
  safeHouse: '#0d0d0d',
  blackMarket: '#0a0a0a',
  intelNetwork: '#111111',
  laundry: BG_CORRIDOR,
}

// Room stroke colors (last suite = presidential = gold border)
const FLOOR_STROKES: Record<string, string> = {
  reception: GOLD_DIM,
  bar: GOLD_DIM,
  kitchen: GOLD_DIM,
  guestRooms: GOLD_DIM,
  vip: GOLD_DIM,
  armory: GOLD_DIM,
  vault: GOLD_DIM,
  underground: GOLD_DIM,
  safeHouse: GOLD_DIM,
  blackMarket: GOLD_DIM,
  intelNetwork: GOLD_DIM,
  laundry: GOLD_DARK,
}

const ROOM_LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
  reception:    { x: 260, y: 70,  w: 568, h: 140 },
  bar:          { x: 30,  y: 240, w: 320, h: 130 },
  kitchen:      { x: 360, y: 240, w: 368, h: 130 },
  guestRooms:   { x: 30,  y: 412, w: 1028, h: 58 },
  vip:          { x: 838, y: 70,  w: 220, h: 140 },
  armory:       { x: 738, y: 240, w: 320, h: 130 },
  vault:        { x: 30,  y: 70,  w: 220, h: 140 },
  underground:  { x: 30,  y: 490, w: 1028, h: 58 },
  safeHouse:    { x: 740, y: 570, w: 318, h: 60  },
  blackMarket:  { x: 30,  y: 570, w: 440, h: 60  },
  intelNetwork: { x: 480, y: 570, w: 240, h: 60  },
  laundry:      { x: 30,  y: 375, w: 1028, h: 18  },
}

// Room display labels (matching the Continental theme)
const ROOM_LABELS: Record<string, { name: string; sub: string }> = {
  reception:    { name: 'GRAND LOBBY',    sub: 'Reception' },
  bar:          { name: 'THE BAR',        sub: 'No Business Conducted' },
  kitchen:      { name: 'RESTAURANT',     sub: 'Fine Dining · Gold Coin Payment' },
  guestRooms:   { name: 'GUEST SUITES',   sub: 'Floor 1' },
  vip:          { name: "MANAGER'S OFFICE", sub: "Winston's Sanctum" },
  armory:       { name: 'SOMMELIER',      sub: '& ARMORY' },
  vault:        { name: 'CONCIERGE',      sub: "Charon's Desk" },
  underground:  { name: 'INNER PASSAGE',  sub: '' },
  safeHouse:    { name: 'PRIVATE GARAGE', sub: 'Exit' },
  blackMarket:  { name: 'POOL',           sub: 'Private Courtyard' },
  intelNetwork: { name: 'SPA & SAUNA',    sub: 'Medical Assistance' },
  laundry:      { name: 'EAST-WEST PASSAGE', sub: '' },
}

// Suite row data for guest rooms area
const suitesTop = [
  { line1: 'Suite', line2: '101' },
  { line1: 'Suite', line2: '102' },
  { line1: 'Suite', line2: '103' },
  { line1: 'Suite', line2: '104' },
  { line1: 'Suite', line2: '105' },
  { line1: 'Presidential', line2: 'Suite' },
]

const suitesBottom = [
  { line1: 'Suite', line2: '201' },
  { line1: 'Suite', line2: '202' },
  { line1: 'Suite', line2: '203' },
  { line1: 'Suite', line2: '204' },
  { line1: 'Suite', line2: '205' },
  { line1: 'Storage &', line2: 'Utilities' },
]

const corners = [
  { key: 'tl', cx: 50, cy: 50 },
  { key: 'tr', cx: 1038, cy: 50 },
  { key: 'bl', cx: 50, cy: 637 },
  { key: 'br', cx: 1038, cy: 637 },
]

// Staff: cool blue-green palette (distinct from guests & assassins)
const STAFF_COLORS: Record<string, string> = {
  concierge: '#00e5ff',
  bartender: '#00bfa5',
  chef: '#00c853',
  cleaner: '#2196f3',
  sommelier: '#18ffff',
  intelOfficer: '#00b0ff',
  adjudicator: '#69f0ae',
  vaultKeeper: '#00e676',
}

// Assassins: red-crimson palette (distinct from staff & guests)
const ASSASSIN_COLORS: Record<string, string> = {
  streetSamurai: '#ff1744',
  enforcer: '#d50000',
  shadowBlade: '#ff5252',
  nightOwl: '#ff8a80',
  highTableEnforcer: '#b71c1c',
}

interface StaffDot {
  id: string
  name: string
  level: number
  color: string
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  bounds: { x: number; y: number; w: number; h: number }
  pathIdx: number
  path: [number, number][]
  pauseTimer: number
  chatTimer: number
  chatText: string
}

interface AssassinDot {
  id: string
  name: string
  level: number
  color: string
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  bounds: { x: number; y: number; w: number; h: number }
  pathIdx: number
  path: [number, number][]
  pauseTimer: number
  chatTimer: number
  chatText: string
}

const staffDots = ref<StaffDot[]>([])
const assassinDots = ref<AssassinDot[]>([])
const chatBubbles = ref<ChatBubble[]>([])
const unlockedRooms = ref<string[]>([])
const hqName = ref('')
const hqOwner = ref('')
const hoveredStaff = ref<StaffDot | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

const svgRef = ref<SVGSVGElement | null>(null)
let circleEls: SVGCircleElement[] = []
let assassinEls: SVGCircleElement[] = []
let guestEls: SVGCircleElement[] = []
let rafId: number | null = null

interface GuestDot {
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  color: string
  pauseTimer: number
  trail: { x: number; y: number }[]
  pathIdx: number
  path: [number, number][]
  chatTimer: number
  chatText: string
}

interface ChatBubble {
  id: number
  x: number
  y: number
  text: string
  color: string
  timer: number
}

// ── Path network: corridor waypoints connecting all rooms ──
// Main corridor Y=225 (between floor 1 and floor 2)
// Lower corridor Y=385 (between suites and basement)
// Vertical connectors at key X positions
const CORRIDOR_Y1 = 225
const CORRIDOR_Y2 = 385

const PATH_NODES: [number, number][] = [
  // Top floor corridor (y=225) — left to right
  [140, CORRIDOR_Y1], [300, CORRIDOR_Y1], [544, CORRIDOR_Y1], [748, CORRIDOR_Y1], [948, CORRIDOR_Y1],
  // Mid corridor (y=385) — left to right
  [140, CORRIDOR_Y2], [300, CORRIDOR_Y2], [544, CORRIDOR_Y2], [748, CORRIDOR_Y2], [948, CORRIDOR_Y2],
  // Vertical connectors
  [140, 300], [300, 300], [544, 300], [748, 300], [948, 300],
  // Room anchors — top floor
  [140, 120], [544, 120], [948, 120],
  // Room anchors — mid floor
  [190, 300], [544, 300], [900, 300],
  // Guest suites corridor
  [190, 440], [544, 440], [900, 440],
  // Basement corridor
  [250, 600], [544, 600], [900, 600],
]

// Path edges: pairs of node indices that are connected
const PATH_EDGES: [number, number][] = [
  // Top corridor horizontal
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Mid corridor horizontal
  [5, 6], [6, 7], [7, 8], [8, 9],
  // Vertical connectors top→mid
  [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
  [10, 5], [11, 6], [12, 7], [13, 8], [14, 9],
  // Room anchors top floor → corridor
  [15, 0], [16, 2], [17, 4],
  // Room anchors mid floor → corridor
  [18, 1], [19, 2], [20, 3],
  // Guest suites → mid corridor
  [21, 6], [22, 7], [23, 8],
  // Basement → mid corridor
  [24, 5], [25, 7], [26, 9],
]

// Build adjacency list for pathfinding
const PATH_ADJ: number[][] = PATH_NODES.map(() => [])
for (const [a, b] of PATH_EDGES) {
  PATH_ADJ[a].push(b)
  PATH_ADJ[b].push(a)
}

// Find shortest path between two nodes via BFS
function findPath(fromIdx: number, toIdx: number): number[] {
  if (fromIdx === toIdx) return [fromIdx]
  const visited = new Set<number>([fromIdx])
  const queue: { node: number; path: number[] }[] = [{ node: fromIdx, path: [fromIdx] }]
  while (queue.length > 0) {
    const { node, path } = queue.shift()!
    for (const next of PATH_ADJ[node]) {
      if (visited.has(next)) continue
      visited.add(next)
      const newPath = [...path, next]
      if (next === toIdx) return newPath
      queue.push({ node: next, path: newPath })
    }
  }
  return [fromIdx]
}

// Find nearest path node to a point
function nearestNode(x: number, y: number): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < PATH_NODES.length; i++) {
    const [nx, ny] = PATH_NODES[i]
    const d = (nx - x) ** 2 + (ny - y) ** 2
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

// Build a waypoint path from one room to another
function buildPath(from: [number, number], to: [number, number]): [number, number][] {
  const fromIdx = nearestNode(from[0], from[1])
  const toIdx = nearestNode(to[0], to[1])
  const nodePath = findPath(fromIdx, toIdx)
  const waypoints: [number, number][] = [from]
  for (const idx of nodePath) {
    waypoints.push([...PATH_NODES[idx]])
  }
  waypoints.push(to)
  return waypoints
}

// Room anchor points (where staff/guests stand inside rooms)
const ROOM_ANCHORS: Record<string, [number, number][]> = {
  reception: [[400, 140], [544, 140], [688, 140], [400, 180], [688, 180]],
  bar: [[120, 300], [190, 300], [260, 300], [120, 340], [260, 340]],
  kitchen: [[440, 300], [544, 300], [648, 300], [440, 340], [648, 340]],
  vault: [[100, 120], [180, 120], [100, 180], [180, 180]],
  vip: [[900, 120], [990, 120], [900, 180], [990, 180]],
  armory: [[820, 300], [900, 300], [980, 300], [820, 340], [980, 340]],
  guestRooms: [[190, 440], [354, 440], [518, 440], [682, 440], [846, 440]],
  underground: [[250, 600], [544, 600], [800, 600]],
  safeHouse: [[850, 600], [950, 600], [1000, 600]],
  blackMarket: [[150, 600], [300, 600], [400, 600]],
  intelNetwork: [[560, 600], [640, 600], [700, 600]],
  laundry: [[300, 385], [544, 385], [800, 385]],
}

// Pick a random anchor from a room
function randAnchor(roomId: string): [number, number] {
  const anchors = ROOM_ANCHORS[roomId]
  if (!anchors || anchors.length === 0) return randPoint(FOOTPRINT)
  return anchors[Math.floor(Math.random() * anchors.length)]
}

// Chat lines for different contexts
const STAFF_CHATS = [
  'Welcome to The Continental.',
  'Table for two?',
  'Right away, sir.',
  'The bar is closed.',
  'Gold coins only.',
  'No business at the bar.',
  'Your suite is ready.',
  'Tea service?',
  'Very good, madam.',
  'I\'ll inform the Manager.',
  'The vault is secured.',
  'Room 101 is prepared.',
]

const ASSASSIN_CHATS = [
  '...target acquired.',
  'Staying off the grid.',
  'The High Table watches.',
  'No loose ends.',
  'Excommunicado?',
  'I need a marker.',
  'Stay sharp.',
  'The Continental is neutral.',
]

const GUEST_CHATS = [
  'Lovely hotel!',
  'Another martini?',
  'Is the spa open?',
  'I love this place.',
  'The service here...',
  'Gold coin, please.',
  'Such elegance!',
  'Room service?',
  'The manager is in?',
]

// Guests: warm pastel palette (distinct from staff blues & assassin reds)
const GUEST_COLORS = ['#ffb74d', '#ffd54f', '#ffcc80', '#ffe082', '#ffca28', '#fff176', '#ffd54f', '#ffecb3']
const guests = ref<GuestDot[]>([])
const GUEST_COUNT = 15

// Building footprint bounds for movement
const FOOTPRINT = { x: 30, y: 74, w: 1028, h: 586 }

function randPoint(b: { x: number; y: number; w: number; h: number }): [number, number] {
  const p = 8
  return [b.x + p + Math.random() * (b.w - p * 2), b.y + p + Math.random() * (b.h - p * 2)]
}

function initGuests(): void {
  const arr: GuestDot[] = []
  const rooms = unlockedRooms.value.length > 0 ? unlockedRooms.value : ['reception']
  for (let i = 0; i < GUEST_COUNT; i++) {
    const startRoom = rooms[Math.floor(Math.random() * rooms.length)]
    const destRoom = rooms[Math.floor(Math.random() * rooms.length)]
    const [x, y] = randAnchor(startRoom)
    const dest = randAnchor(destRoom)
    const path = buildPath([x, y], dest)
    arr.push({
      x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.15 + Math.random() * 0.35,
      color: GUEST_COLORS[i % GUEST_COLORS.length],
      pauseTimer: Math.floor(Math.random() * 60),
      trail: [],
      pathIdx: 0,
      path,
      chatTimer: 0,
      chatText: '',
    })
  }
  arr.forEach(g => markRaw(g))
  guests.value = arr
}

function initStaff(): void {
  const state = gameState.get()
  const branch = state.branches[state.hqBranch]
  if (!branch) return

  unlockedRooms.value = BUILDINGS
    .filter(b => branch.buildings[b.id]?.unlocked)
    .map(b => b.id)

  const dots: StaffDot[] = []
  Object.values(branch.staff).forEach(staff => {
    const def = STAFF_MAP[staff.typeId]
    if (!def) return

    let assignedRoom: string | null = null
    if (staff.assignedTo && ROOM_LAYOUT[staff.assignedTo] && unlockedRooms.value.includes(staff.assignedTo)) {
      assignedRoom = staff.assignedTo
    }

    const bounds = assignedRoom ? ROOM_LAYOUT[assignedRoom] : FOOTPRINT
    const [x, y] = assignedRoom ? randAnchor(assignedRoom) : randPoint(bounds)
    // Staff patrol: go to another anchor in same room, or patrol to corridor and back
    const dest = assignedRoom ? randAnchor(assignedRoom) : randPoint(bounds)
    const path = buildPath([x, y], dest)

    dots.push({
      id: staff.id,
      name: def.name,
      level: staff.level,
      color: STAFF_COLORS[staff.typeId] || '#aaa',
      x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.2 + Math.random() * 0.3,
      bounds,
      pathIdx: 0,
      path,
      pauseTimer: Math.floor(Math.random() * 80),
      chatTimer: 0,
      chatText: '',
    })
  })

  dots.forEach(d => markRaw(d))
  staffDots.value = dots
}

function initAssassins(): void {
  const state = gameState.get()
  const branch = state.branches[state.hqBranch]
  if (!branch) return

  const rooms = unlockedRooms.value.length > 0 ? unlockedRooms.value : ['reception']
  const dots: AssassinDot[] = []
  Object.values(branch.assassins).forEach(assassin => {
    const def = ASSASSIN_MAP[assassin.typeId]
    if (!def) return

    const bounds = FOOTPRINT
    const startRoom = rooms[Math.floor(Math.random() * rooms.length)]
    const destRoom = rooms[Math.floor(Math.random() * rooms.length)]
    const [x, y] = randAnchor(startRoom)
    const dest = randAnchor(destRoom)
    const path = buildPath([x, y], dest)

    dots.push({
      id: assassin.id,
      name: def.name,
      level: assassin.level,
      color: ASSASSIN_COLORS[assassin.typeId] || '#ff1744',
      x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.3 + Math.random() * 0.4,
      bounds,
      pathIdx: 0,
      path,
      pauseTimer: Math.floor(Math.random() * 60),
      chatTimer: 0,
      chatText: '',
    })
  })

  dots.forEach(d => markRaw(d))
  assassinDots.value = dots
}

let chatBubbleId = 0

function spawnChat(x: number, y: number, text: string, color: string): void {
  const id = chatBubbleId++
  chatBubbles.value.push({ id, x, y, text, color, timer: 120 })
  markRaw(chatBubbles.value[chatBubbles.value.length - 1])
}

function animate(): void {
  const dots = staffDots.value
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i]
    if (dot.pauseTimer > 0) {
      dot.pauseTimer--
    } else {
      // Follow waypoint path
      if (dot.pathIdx < dot.path.length) {
        const [wx, wy] = dot.path[dot.pathIdx]
        const dx = wx - dot.x
        const dy = wy - dot.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 2) {
          dot.pathIdx++
          if (dot.pathIdx >= dot.path.length) {
            // Reached destination — pause then pick new patrol point within bounds
            dot.pauseTimer = 60 + Math.floor(Math.random() * 120)
            const dest = randPoint(dot.bounds)
            dot.path = buildPath([dot.x, dot.y], dest)
            dot.pathIdx = 0
            dot.targetX = dest[0]
            dot.targetY = dest[1]
          }
        } else {
          dot.x += (dx / dist) * dot.speed
          dot.y += (dy / dist) * dot.speed
        }
      }
    }

    // Chat: random chance to say something
    if (dot.chatTimer > 0) {
      dot.chatTimer--
    } else if (Math.random() < 0.002) {
      dot.chatText = STAFF_CHATS[Math.floor(Math.random() * STAFF_CHATS.length)]
      dot.chatTimer = 200
      spawnChat(dot.x, dot.y - 8, dot.chatText, dot.color)
    }

    const el = circleEls[i]
    if (el) {
      el.setAttribute('cx', String(dot.x))
      el.setAttribute('cy', String(dot.y))
    }
  }

  const ads = assassinDots.value
  for (let i = 0; i < ads.length; i++) {
    const dot = ads[i]
    if (dot.pauseTimer > 0) {
      dot.pauseTimer--
    } else {
      if (dot.pathIdx < dot.path.length) {
        const [wx, wy] = dot.path[dot.pathIdx]
        const dx = wx - dot.x
        const dy = wy - dot.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 2) {
          dot.pathIdx++
          if (dot.pathIdx >= dot.path.length) {
            dot.pauseTimer = 40 + Math.floor(Math.random() * 80)
            const rooms = unlockedRooms.value.length > 0 ? unlockedRooms.value : ['reception']
            const destRoom = rooms[Math.floor(Math.random() * rooms.length)]
            const dest = randAnchor(destRoom)
            dot.path = buildPath([dot.x, dot.y], dest)
            dot.pathIdx = 0
            dot.targetX = dest[0]
            dot.targetY = dest[1]
          }
        } else {
          dot.x += (dx / dist) * dot.speed
          dot.y += (dy / dist) * dot.speed
        }
      }
    }

    if (dot.chatTimer > 0) {
      dot.chatTimer--
    } else if (Math.random() < 0.0015) {
      dot.chatText = ASSASSIN_CHATS[Math.floor(Math.random() * ASSASSIN_CHATS.length)]
      dot.chatTimer = 250
      spawnChat(dot.x, dot.y - 8, dot.chatText, dot.color)
    }

    const el = assassinEls[i]
    if (el) {
      el.setAttribute('cx', String(dot.x))
      el.setAttribute('cy', String(dot.y))
    }
  }

  const gs = guests.value
  for (let i = 0; i < gs.length; i++) {
    const g = gs[i]
    if (g.pauseTimer > 0) {
      g.pauseTimer--
    } else {
      if (g.pathIdx < g.path.length) {
        const [wx, wy] = g.path[g.pathIdx]
        const dx = wx - g.x
        const dy = wy - g.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 2) {
          g.pathIdx++
          if (g.pathIdx >= g.path.length) {
            g.pauseTimer = 60 + Math.floor(Math.random() * 180)
            const rooms = unlockedRooms.value.length > 0 ? unlockedRooms.value : ['reception']
            const destRoom = rooms[Math.floor(Math.random() * rooms.length)]
            const dest = randAnchor(destRoom)
            g.path = buildPath([g.x, g.y], dest)
            g.pathIdx = 0
            g.targetX = dest[0]
            g.targetY = dest[1]
          }
        } else {
          g.x += (dx / dist) * g.speed
          g.y += (dy / dist) * g.speed
        }
      }
    }

    if (g.chatTimer > 0) {
      g.chatTimer--
    } else if (Math.random() < 0.001) {
      g.chatText = GUEST_CHATS[Math.floor(Math.random() * GUEST_CHATS.length)]
      g.chatTimer = 300
      spawnChat(g.x, g.y - 6, g.chatText, g.color)
    }

    const el = guestEls[i]
    if (el) {
      el.setAttribute('cx', String(g.x))
      el.setAttribute('cy', String(g.y))
    }
  }

  // Decay chat bubbles
  const bubbles = chatBubbles.value
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].timer--
    if (bubbles[i].timer <= 0) {
      bubbles.splice(i, 1)
    }
  }

  rafId = requestAnimationFrame(animate)
}

function onStaffHover(dot: StaffDot, event: MouseEvent): void {
  hoveredStaff.value = dot
  const svg = svgRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  tooltipX.value = event.clientX - rect.left + 10
  tooltipY.value = event.clientY - rect.top - 10
}

function onStaffLeave(): void {
  hoveredStaff.value = null
}

function roomLabel(id: string): { name: string; sub: string } {
  return ROOM_LABELS[id] ?? { name: '', sub: '' }
}

function roomFill(id: string): string {
  return FLOOR_FILLS[id] ?? BG_DARK
}

function roomStroke(id: string): string {
  return FLOOR_STROKES[id] ?? GOLD_DIM
}

function isUnlocked(id: string): boolean {
  return unlockedRooms.value.includes(id)
}

onMounted(() => {
  const state = gameState.get()
  const def = getBranchDef(state.hqBranch)
  hqName.value = def?.name || 'HQ'
  const owner = getAIOwner(state.hqBranch)
  hqOwner.value = owner ? owner.name : 'Unknown'
  initStaff()
  initAssassins()
  initGuests()
  nextTick(() => {
    if (svgRef.value) {
      circleEls = Array.from(svgRef.value.querySelectorAll<SVGCircleElement>('.hq-office__staff-dot'))
      assassinEls = Array.from(svgRef.value.querySelectorAll<SVGCircleElement>('.hq-office__assassin-dot'))
      guestEls = Array.from(svgRef.value.querySelectorAll<SVGCircleElement>('.hq-office__guest-dot'))
    }
    rafId = requestAnimationFrame(animate)
  })
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <!-- INLINE VERSION (embedded in dashboard) -->
  <div v-if="props.inline" class="hq-office hq-office--inline">
    <div v-if="staffDots.length === 0 && assassinDots.length === 0" class="hq-office__empty">
      No staff or assassins hired. Hire them from the Staff panel to see them walk around the office.
    </div>

    <div v-else class="hq-office__svg-wrap">
      <svg ref="svgRef" :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="hq-office__svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </marker>
          <pattern id="marble" patternUnits="userSpaceOnUse" width="24" height="24">
            <rect width="24" height="24" fill="#f5f0e8"/>
            <path d="M0 12 Q6 8 12 12 Q18 16 24 12" stroke="#ddd5c0" stroke-width="0.5" fill="none"/>
            <path d="M0 6 Q8 4 12 6 Q16 4 24 6" stroke="#e8e0ce" stroke-width="0.3" fill="none"/>
          </pattern>
          <pattern id="wood" patternUnits="userSpaceOnUse" width="8" height="40">
            <rect width="8" height="40" fill="#222222"/>
            <rect x="0.5" y="0" width="7" height="40" fill="#2a2a2a"/>
            <line x1="0" y1="20" x2="8" y2="20" stroke="#333333" stroke-width="0.5"/>
          </pattern>
          <pattern id="tile" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#111111"/>
            <rect x="1" y="1" width="8" height="8" fill="#1a1a1a"/>
            <rect x="11" y="1" width="8" height="8" fill="#1a1a1a"/>
            <rect x="1" y="11" width="8" height="8" fill="#1a1a1a"/>
            <rect x="11" y="11" width="8" height="8" fill="#1a1a1a"/>
          </pattern>
        </defs>

        <!-- Outer border 1px #ccc -->
        <rect x="1" y="1" :width="SVG_W - 2" :height="SVG_H - 2" fill="none" stroke="var(--border-color)" stroke-width="1"/>

        <!-- Building footprint -->
        <rect x="30" y="30" width="1028" height="630" :fill="BG_DARK" :stroke="GOLD_DIM" stroke-width="2"/>

        <!-- Path route lines (corridors) -->
        <g class="hq-office__paths" opacity="0.15">
          <line v-for="(edge, ei) in PATH_EDGES" :key="'pe-' + ei" :x1="PATH_NODES[edge[0]][0]" :y1="PATH_NODES[edge[0]][1]" :x2="PATH_NODES[edge[1]][0]" :y2="PATH_NODES[edge[1]][1]" :stroke="GOLD" stroke-width="0.8" stroke-dasharray="3,3"/>
        </g>

        <!-- Title banner -->
        <rect x="30" y="30" width="1028" height="36" :fill="BG_DARKER"/>
        <text x="544" y="54" text-anchor="middle" font-family="Georgia, serif" font-size="17" font-weight="700" :fill="GOLD" letter-spacing="4">THE CONTINENTAL</text>

        <!-- Compass rose -->
        <g transform="translate(1018, 52)">
          <circle cx="0" cy="0" r="14" :fill="BG_DARKER" :stroke="GOLD_DARK" stroke-width="0.5"/>
          <polygon points="0,-11 3,0 0,3 -3,0" :fill="GOLD"/>
          <polygon points="0,11 3,0 0,-3 -3,0" :fill="GOLD_DARK"/>
          <text x="0" y="-14" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD">N</text>
        </g>

        <!-- GRAND LOBBY (reception) -->
        <template v-if="isUnlocked('reception')">
          <rect x="260" y="70" width="568" height="140" :fill="roomFill('reception')" :stroke="roomStroke('reception')" stroke-width="1"/>
          <text x="544" y="125" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" :fill="LABEL_DARK" letter-spacing="2">{{ roomLabel('reception').name }}</text>
          <rect x="280" y="90" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <rect x="798" y="90" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <rect x="280" y="180" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <rect x="798" y="180" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <rect x="464" y="155" width="160" height="22" rx="2" fill="#222222" :stroke="GOLD_DIM" stroke-width="0.8"/>
          <text x="544" y="170" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD">{{ roomLabel('reception').sub }}</text>
          <rect x="494" y="195" width="50" height="5" :fill="GOLD" :stroke="GOLD_DIM" stroke-width="0.5"/>
        </template>

        <!-- CONCIERGE / VAULT (vault) -->
        <template v-if="isUnlocked('vault')">
          <rect x="30" y="70" width="220" height="140" :fill="roomFill('vault')" :stroke="roomStroke('vault')" stroke-width="1"/>
          <text x="140" y="130" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">{{ roomLabel('vault').name }}</text>
          <text x="140" y="145" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">{{ roomLabel('vault').sub }}</text>
          <rect x="60" y="85" width="28" height="28" rx="2" fill="#111111" :stroke="GOLD" stroke-width="1"/>
          <circle cx="74" cy="99" r="7" fill="none" :stroke="GOLD" stroke-width="0.8"/>
          <text x="74" y="126" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DIM">VAULT</text>
        </template>

        <!-- MANAGER'S OFFICE (vip) -->
        <template v-if="isUnlocked('vip')">
          <rect x="838" y="70" width="220" height="140" :fill="roomFill('vip')" :stroke="roomStroke('vip')" stroke-width="1"/>
          <text x="948" y="120" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">MANAGER'S</text>
          <text x="948" y="135" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">OFFICE</text>
          <text x="948" y="150" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">{{ roomLabel('vip').sub }}</text>
          <rect x="868" y="85" width="60" height="30" rx="2" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.8"/>
          <rect x="888" y="120" width="20" height="20" rx="1" fill="#111111" :stroke="GOLD_DIM" stroke-width="0.5"/>
        </template>

        <!-- Main Corridor (laundry) -->
        <template v-if="isUnlocked('laundry')">
          <rect x="30" y="215" width="1028" height="20" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <text x="544" y="229" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="3">· · · · · · MAIN CORRIDOR · · · · · ·</text>
        </template>

        <!-- THE BAR (bar) -->
        <template v-if="isUnlocked('bar')">
          <rect x="30" y="240" width="320" height="130" :fill="roomFill('bar')" :stroke="roomStroke('bar')" stroke-width="1"/>
          <text x="190" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" :fill="GOLD" letter-spacing="2">{{ roomLabel('bar').name }}</text>
          <rect x="50" y="255" width="180" height="14" rx="2" fill="#222222" :stroke="GOLD" stroke-width="0.8"/>
          <rect x="50" y="255" width="14" height="50" rx="2" fill="#222222" :stroke="GOLD" stroke-width="0.8"/>
          <circle cx="85" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="115" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="145" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="175" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="230" cy="320" r="12" fill="none" :stroke="GOLD_DARK" stroke-width="1"/>
          <circle cx="290" cy="345" r="12" fill="none" :stroke="GOLD_DARK" stroke-width="1"/>
          <circle cx="100" cy="340" r="12" fill="none" :stroke="GOLD_DARK" stroke-width="1"/>
          <text x="190" y="365" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">{{ roomLabel('bar').sub }}</text>
        </template>

        <!-- RESTAURANT (kitchen) -->
        <template v-if="isUnlocked('kitchen')">
          <rect x="360" y="240" width="368" height="130" :fill="roomFill('kitchen')" :stroke="roomStroke('kitchen')" stroke-width="1"/>
          <text x="544" y="295" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" :fill="GOLD" letter-spacing="1">{{ roomLabel('kitchen').name }}</text>
          <rect x="380" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="460" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="540" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="620" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="380" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="460" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="540" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <rect x="620" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
          <circle cx="400" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
          <circle cx="480" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
          <circle cx="560" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
          <circle cx="640" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
          <text x="544" y="355" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="1">{{ roomLabel('kitchen').sub }}</text>
        </template>

        <!-- SOMMELIER & ARMORY (armory) -->
        <template v-if="isUnlocked('armory')">
          <rect x="738" y="240" width="320" height="130" :fill="roomFill('armory')" :stroke="roomStroke('armory')" stroke-width="1"/>
          <text x="898" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">SOMMELIER</text>
          <text x="898" y="315" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">&amp; ARMORY</text>
          <line x1="765" y1="255" x2="765" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
          <line x1="773" y1="255" x2="773" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
          <line x1="781" y1="255" x2="781" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
          <line x1="789" y1="255" x2="789" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
          <rect x="758" y="250" width="40" height="4" rx="1" fill="#222222" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <text x="764" y="298" font-family="Georgia,serif" font-size="7" :fill="GOLD_DARK">Coat Check</text>
          <rect x="810" y="255" width="120" height="35" fill="#0a0a0a" :stroke="GOLD_DARK" stroke-width="0.5"/>
          <text x="870" y="275" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK">Wine Cellar</text>
          <circle cx="825" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="838" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="851" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="864" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="877" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="890" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <circle cx="903" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
        </template>

        <!-- East-West Passage (laundry corridor) -->
        <template v-if="isUnlocked('laundry')">
          <rect x="30" y="375" width="1028" height="18" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <text x="544" y="388" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="3">· · · · · · EAST - WEST PASSAGE · · · · · ·</text>
        </template>

        <!-- Suites label -->
        <rect x="30" y="395" width="1028" height="14" :fill="BG_DARKER"/>
        <text x="544" y="406" text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD_DIM" letter-spacing="4">GUEST SUITES — FLOOR 1</text>

        <!-- Suite row top (guestRooms) -->
        <template v-if="isUnlocked('guestRooms')">
          <rect v-for="(_, i) in suitesTop" :key="'top-' + i"
            :x="30 + i * 164" y="412" :width="i === 5 ? 208 : 160" height="58"
            fill="#111111" :stroke="i === 5 ? GOLD : GOLD_DIM" :stroke-width="i === 5 ? 1 : 0.8"/>
          <text v-for="(suite, i) in suitesTop" :key="'top-label-' + i"
            :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="442"
            text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line1 }}</text>
          <text v-for="(suite, i) in suitesTop" :key="'top-num-' + i"
            :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="454"
            text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line2 }}</text>
        </template>

        <!-- Inner passage (underground) -->
        <template v-if="isUnlocked('underground')">
          <rect x="30" y="473" width="1028" height="14" :fill="BG_DARKER" :stroke="GOLD_DARK" stroke-width="0.3"/>
          <text x="544" y="484" text-anchor="middle" font-family="Georgia,serif" font-size="7" fill="#444444" letter-spacing="3">· · · INNER PASSAGE · · ·</text>
        </template>

        <!-- Suite row bottom (underground) -->
        <template v-if="isUnlocked('underground')">
          <rect v-for="(_, i) in suitesBottom" :key="'bot-' + i"
            :x="30 + i * 164" y="490" :width="i === 5 ? 208 : 160" height="58"
            :fill="i === 5 ? '#0d0d0d' : '#111111'" :stroke="GOLD_DIM" stroke-width="0.8"/>
          <text v-for="(suite, i) in suitesBottom" :key="'bot-label-' + i"
            :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="520"
            text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line1 }}</text>
          <text v-for="(suite, i) in suitesBottom" :key="'bot-num-' + i"
            :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="532"
            text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line2 }}</text>
        </template>

        <!-- Service Corridor -->
        <rect x="30" y="551" width="1028" height="16" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="0.5"/>
        <text x="544" y="563" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="3">· · · · · · SERVICE CORRIDOR · · · · · ·</text>

        <!-- POOL (blackMarket) -->
        <template v-if="isUnlocked('blackMarket')">
          <rect x="30" y="570" width="440" height="60" :fill="roomFill('blackMarket')" :stroke="roomStroke('blackMarket')" stroke-width="1"/>
          <rect x="60" y="580" width="380" height="40" rx="20" fill="#0d2030" stroke="#1a4060" stroke-width="1.5"/>
          <ellipse cx="250" cy="600" rx="120" ry="14" fill="#0d2030" stroke="#1e5070" stroke-width="0.5"/>
          <text x="250" y="604" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#4a90c4" letter-spacing="1">{{ roomLabel('blackMarket').name }}</text>
          <text x="250" y="625" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK">{{ roomLabel('blackMarket').sub }}</text>
        </template>

        <!-- SPA & SAUNA (intelNetwork) -->
        <template v-if="isUnlocked('intelNetwork')">
          <rect x="480" y="570" width="240" height="60" :fill="roomFill('intelNetwork')" :stroke="roomStroke('intelNetwork')" stroke-width="1"/>
          <text x="600" y="600" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">SPA &amp;</text>
          <text x="600" y="615" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">SAUNA</text>
          <text x="600" y="628" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DIM">{{ roomLabel('intelNetwork').sub }}</text>
        </template>

        <!-- PRIVATE GARAGE (safeHouse) -->
        <template v-if="isUnlocked('safeHouse')">
          <rect x="740" y="570" width="318" height="60" :fill="roomFill('safeHouse')" :stroke="roomStroke('safeHouse')" stroke-width="1"/>
          <text x="899" y="598" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">PRIVATE</text>
          <text x="899" y="613" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">GARAGE</text>
          <rect x="870" y="620" width="56" height="14" rx="5" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.8"/>
          <rect x="876" y="616" width="44" height="8" rx="3" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.5"/>
          <circle cx="881" cy="634" r="3" fill="#0d0d0d" stroke="#5a5a5a" stroke-width="1"/>
          <circle cx="915" cy="634" r="3" fill="#0d0d0d" stroke="#5a5a5a" stroke-width="1"/>
          <line x1="950" y1="615" x2="1030" y2="615" :stroke="GOLD" stroke-width="1.5" marker-end="url(#arrow)"/>
          <text x="990" y="608" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD">EXIT</text>
        </template>

        <!-- Footer -->
        <rect x="30" y="636" width="1028" height="2" :fill="GOLD_DIM" opacity="0.4"/>
        <text x="544" y="648" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="2">MANAGEMENT RESERVES THE RIGHT TO REVOKE MEMBERSHIP · ALL DISPUTES SETTLED IN-HOUSE</text>

        <!-- Owner line -->
        <text x="544" y="658" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DARK" letter-spacing="1">{{ hqName }} — Owner: {{ hqOwner }}</text>

        <!-- Corner decorations -->
        <circle v-for="c in corners" :key="c.key" :cx="c.cx" :cy="c.cy" r="8" fill="none" :stroke="GOLD_DIM" stroke-width="0.8"/>
        <text v-for="c in corners" :key="'t' + c.key" :x="c.cx" :y="c.cy + 4" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD">✦</text>

        <!-- Guest dots (warm pastel, small, low opacity) -->
        <circle v-for="(g, gi) in guests" :key="'guest-' + gi" :cx="g.x" :cy="g.y" :r="2" :fill="g.color" :stroke="BG_DARK" stroke-width="0.3" opacity="0.55" class="hq-office__guest-dot"/>
        <!-- Assassin dots (red, thick white ring) -->
        <circle v-for="dot in assassinDots" :key="'assassin-' + dot.id" :cx="dot.x" :cy="dot.y" :r="4" :fill="dot.color" stroke="#ffffff" stroke-width="1.5" class="hq-office__assassin-dot"/>
        <!-- Staff dots (cool blue-green, larger, bright border) -->
        <circle v-for="dot in staffDots" :key="dot.id" :cx="dot.x" :cy="dot.y" :r="3.5" :fill="dot.color" stroke="#ffffff" stroke-width="0.8" class="hq-office__staff-dot" @mouseenter="onStaffHover(dot, $event)" @mouseleave="onStaffLeave"/>
        <!-- Chat bubbles -->
        <g v-for="b in chatBubbles" :key="'cb-' + b.id" class="hq-office__chat-bubble" :transform="`translate(${b.x}, ${b.y})`">
          <rect x="-30" y="-14" width="60" height="12" rx="3" :fill="BG_DARKER" :stroke="b.color" stroke-width="0.5" opacity="0.9"/>
          <text x="0" y="-5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="4" :fill="b.color">{{ b.text }}</text>
        </g>
      </svg>

      <div v-if="hoveredStaff" class="hq-office__tooltip" :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }">
        <div class="hq-office__tooltip-name">{{ hoveredStaff.name }}</div>
        <div class="hq-office__tooltip-level">Level {{ hoveredStaff.level }}</div>
      </div>
    </div>

    <div v-if="staffDots.length > 0 || assassinDots.length > 0" class="hq-office__legend">
      <div v-for="dot in staffDots" :key="dot.id" class="hq-office__legend-item">
        <span class="hq-office__legend-dot" :style="{ background: dot.color }"></span>
        <span class="hq-office__legend-name">{{ dot.name }}</span>
        <span class="hq-office__legend-level">Lv.{{ dot.level }}</span>
      </div>
      <div v-for="dot in assassinDots" :key="'al-' + dot.id" class="hq-office__legend-item">
        <span class="hq-office__legend-dot" :style="{ background: dot.color, borderColor: '#fff' }"></span>
        <span class="hq-office__legend-name">{{ dot.name }}</span>
        <span class="hq-office__legend-level">Lv.{{ dot.level }}</span>
      </div>
    </div>
  </div>

  <!-- OVERLAY VERSION (modal) -->
  <div v-else class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content hq-office">
      <div class="hq-office__header">
        <span class="hq-office__title">{{ hqName }} — HQ</span>
        <span class="hq-office__owner">Owner: {{ hqOwner }}</span>
        <button class="hq-office__close" aria-label="Close" @click="emit('close')">✕</button>
      </div>

      <div v-if="staffDots.length === 0 && assassinDots.length === 0" class="hq-office__empty">
        No staff or assassins hired. Hire them from the Staff panel to see them walk around the office.
      </div>

      <div v-else class="hq-office__svg-wrap">
        <svg ref="svgRef" :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="hq-office__svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow-o" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <pattern id="marble-o" patternUnits="userSpaceOnUse" width="24" height="24">
              <rect width="24" height="24" fill="#f5f0e8"/>
              <path d="M0 12 Q6 8 12 12 Q18 16 24 12" stroke="#ddd5c0" stroke-width="0.5" fill="none"/>
              <path d="M0 6 Q8 4 12 6 Q16 4 24 6" stroke="#e8e0ce" stroke-width="0.3" fill="none"/>
            </pattern>
            <pattern id="wood-o" patternUnits="userSpaceOnUse" width="8" height="40">
              <rect width="8" height="40" fill="#222222"/>
              <rect x="0.5" y="0" width="7" height="40" fill="#2a2a2a"/>
              <line x1="0" y1="20" x2="8" y2="20" stroke="#333333" stroke-width="0.5"/>
            </pattern>
            <pattern id="tile-o" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="#111111"/>
              <rect x="1" y="1" width="8" height="8" fill="#1a1a1a"/>
              <rect x="11" y="1" width="8" height="8" fill="#1a1a1a"/>
              <rect x="1" y="11" width="8" height="8" fill="#1a1a1a"/>
              <rect x="11" y="11" width="8" height="8" fill="#1a1a1a"/>
            </pattern>
          </defs>

          <!-- Outer border 1px #ccc -->
          <rect x="1" y="1" :width="SVG_W - 2" :height="SVG_H - 2" fill="none" stroke="var(--border-color)" stroke-width="1"/>

          <!-- Building footprint -->
          <rect x="30" y="30" width="1028" height="630" :fill="BG_DARK" :stroke="GOLD_DIM" stroke-width="2"/>

          <!-- Path route lines (corridors) -->
          <g class="hq-office__paths" opacity="0.15">
            <line v-for="(edge, ei) in PATH_EDGES" :key="'pe-o-' + ei" :x1="PATH_NODES[edge[0]][0]" :y1="PATH_NODES[edge[0]][1]" :x2="PATH_NODES[edge[1]][0]" :y2="PATH_NODES[edge[1]][1]" :stroke="GOLD" stroke-width="0.8" stroke-dasharray="3,3"/>
          </g>

          <!-- Title banner -->
          <rect x="30" y="30" width="1028" height="36" :fill="BG_DARKER"/>
          <text x="544" y="54" text-anchor="middle" font-family="Georgia, serif" font-size="17" font-weight="700" :fill="GOLD" letter-spacing="4">THE CONTINENTAL</text>

          <!-- Compass rose -->
          <g transform="translate(1018, 52)">
            <circle cx="0" cy="0" r="14" :fill="BG_DARKER" :stroke="GOLD_DARK" stroke-width="0.5"/>
            <polygon points="0,-11 3,0 0,3 -3,0" :fill="GOLD"/>
            <polygon points="0,11 3,0 0,-3 -3,0" :fill="GOLD_DARK"/>
            <text x="0" y="-14" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD">N</text>
          </g>

          <!-- GRAND LOBBY (reception) -->
          <template v-if="isUnlocked('reception')">
            <rect x="260" y="70" width="568" height="140" fill="url(#marble-o)" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="544" y="125" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" :fill="LABEL_DARK" letter-spacing="2">GRAND LOBBY</text>
            <rect x="280" y="90" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <rect x="798" y="90" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <rect x="280" y="180" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <rect x="798" y="180" width="10" height="10" fill="#b8a070" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <rect x="464" y="155" width="160" height="22" rx="2" fill="#222222" :stroke="GOLD_DIM" stroke-width="0.8"/>
            <text x="544" y="170" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD">RECEPTION</text>
            <rect x="494" y="195" width="50" height="5" :fill="GOLD" :stroke="GOLD_DIM" stroke-width="0.5"/>
          </template>

          <!-- CONCIERGE (vault) -->
          <template v-if="isUnlocked('vault')">
            <rect x="30" y="70" width="220" height="140" fill="url(#wood-o)" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="140" y="130" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">CONCIERGE</text>
            <text x="140" y="145" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">Charon's Desk</text>
            <rect x="60" y="85" width="28" height="28" rx="2" fill="#111111" :stroke="GOLD" stroke-width="1"/>
            <circle cx="74" cy="99" r="7" fill="none" :stroke="GOLD" stroke-width="0.8"/>
            <text x="74" y="126" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DIM">VAULT</text>
          </template>

          <!-- MANAGER'S OFFICE (vip) -->
          <template v-if="isUnlocked('vip')">
            <rect x="838" y="70" width="220" height="140" fill="url(#wood-o)" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="948" y="120" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">MANAGER'S</text>
            <text x="948" y="135" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">OFFICE</text>
            <text x="948" y="150" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">Winston's Sanctum</text>
            <rect x="868" y="85" width="60" height="30" rx="2" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.8"/>
            <rect x="888" y="120" width="20" height="20" rx="1" fill="#111111" :stroke="GOLD_DIM" stroke-width="0.5"/>
          </template>

          <!-- Main Corridor -->
          <template v-if="isUnlocked('laundry')">
            <rect x="30" y="215" width="1028" height="20" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <text x="544" y="229" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="3">· · · · · · MAIN CORRIDOR · · · · · ·</text>
          </template>

          <!-- THE BAR -->
          <template v-if="isUnlocked('bar')">
            <rect x="30" y="240" width="320" height="130" fill="url(#tile-o)" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="190" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" :fill="GOLD" letter-spacing="2">THE BAR</text>
            <rect x="50" y="255" width="180" height="14" rx="2" fill="#222222" :stroke="GOLD" stroke-width="0.8"/>
            <rect x="50" y="255" width="14" height="50" rx="2" fill="#222222" :stroke="GOLD" stroke-width="0.8"/>
            <circle cx="85" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="115" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="145" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="175" cy="285" r="5" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="230" cy="320" r="12" fill="none" :stroke="GOLD_DARK" stroke-width="1"/>
            <circle cx="290" cy="345" r="12" fill="none" :stroke="GOLD_DARK" stroke-width="1"/>
            <circle cx="100" cy="340" r="12" fill="none" :stroke="GOLD_DARK" stroke-width="1"/>
            <text x="190" y="365" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">No Business Conducted</text>
          </template>

          <!-- RESTAURANT -->
          <template v-if="isUnlocked('kitchen')">
            <rect x="360" y="240" width="368" height="130" fill="#1a1a1a" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="544" y="295" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" :fill="GOLD" letter-spacing="1">RESTAURANT</text>
            <rect x="380" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="460" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="540" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="620" y="258" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="380" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="460" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="540" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <rect x="620" y="300" width="40" height="20" rx="2" fill="none" :stroke="GOLD_DARK" stroke-width="0.8"/>
            <circle cx="400" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
            <circle cx="480" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
            <circle cx="560" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
            <circle cx="640" cy="255" r="3" fill="#333333" :stroke="GOLD_DARK" stroke-width="0.5"/>
            <text x="544" y="355" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="1">Fine Dining · Gold Coin Payment</text>
          </template>

          <!-- SOMMELIER & ARMORY -->
          <template v-if="isUnlocked('armory')">
            <rect x="738" y="240" width="320" height="130" fill="#0d0d0d" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="898" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD" letter-spacing="1">SOMMELIER</text>
            <text x="898" y="315" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">&amp; ARMORY</text>
            <line x1="765" y1="255" x2="765" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
            <line x1="773" y1="255" x2="773" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
            <line x1="781" y1="255" x2="781" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
            <line x1="789" y1="255" x2="789" y2="285" :stroke="GOLD_DARK" stroke-width="1.5"/>
            <rect x="758" y="250" width="40" height="4" rx="1" fill="#222222" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <text x="764" y="298" font-family="Georgia,serif" font-size="7" :fill="GOLD_DARK">Coat Check</text>
            <rect x="810" y="255" width="120" height="35" fill="#0a0a0a" :stroke="GOLD_DARK" stroke-width="0.5"/>
            <text x="870" y="275" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK">Wine Cellar</text>
            <circle cx="825" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="838" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="851" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="864" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="877" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="890" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <circle cx="903" cy="266" r="3" fill="#333333" :stroke="GOLD_DIM" stroke-width="0.5"/>
          </template>

          <!-- East-West Passage -->
          <template v-if="isUnlocked('laundry')">
            <rect x="30" y="375" width="1028" height="18" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="0.5"/>
            <text x="544" y="388" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="3">· · · · · · EAST - WEST PASSAGE · · · · · ·</text>
          </template>

          <!-- Suites label -->
          <rect x="30" y="395" width="1028" height="14" :fill="BG_DARKER"/>
          <text x="544" y="406" text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD_DIM" letter-spacing="4">GUEST SUITES — FLOOR 1</text>

          <!-- Suite row top -->
          <template v-if="isUnlocked('guestRooms')">
            <rect v-for="(_, i) in suitesTop" :key="'top-o-' + i"
              :x="30 + i * 164" y="412" :width="i === 5 ? 208 : 160" height="58"
              fill="#111111" :stroke="i === 5 ? GOLD : GOLD_DIM" :stroke-width="i === 5 ? 1 : 0.8"/>
            <text v-for="(suite, i) in suitesTop" :key="'top-label-o-' + i"
              :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="442"
              text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line1 }}</text>
            <text v-for="(suite, i) in suitesTop" :key="'top-num-o-' + i"
              :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="454"
              text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line2 }}</text>
          </template>

          <!-- Inner passage -->
          <template v-if="isUnlocked('underground')">
            <rect x="30" y="473" width="1028" height="14" :fill="BG_DARKER" :stroke="GOLD_DARK" stroke-width="0.3"/>
            <text x="544" y="484" text-anchor="middle" font-family="Georgia,serif" font-size="7" fill="#444444" letter-spacing="3">· · · INNER PASSAGE · · ·</text>
          </template>

          <!-- Suite row bottom -->
          <template v-if="isUnlocked('underground')">
            <rect v-for="(_, i) in suitesBottom" :key="'bot-o-' + i"
              :x="30 + i * 164" y="490" :width="i === 5 ? 208 : 160" height="58"
              :fill="i === 5 ? '#0d0d0d' : '#111111'" :stroke="GOLD_DIM" stroke-width="0.8"/>
            <text v-for="(suite, i) in suitesBottom" :key="'bot-label-o-' + i"
              :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="520"
              text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line1 }}</text>
            <text v-for="(suite, i) in suitesBottom" :key="'bot-num-o-' + i"
              :x="30 + i * 164 + (i === 5 ? 104 : 80)" y="532"
              text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD">{{ suite.line2 }}</text>
          </template>

          <!-- Service Corridor -->
          <rect x="30" y="551" width="1028" height="16" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="0.5"/>
          <text x="544" y="563" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="3">· · · · · · SERVICE CORRIDOR · · · · · ·</text>

          <!-- POOL -->
          <template v-if="isUnlocked('blackMarket')">
            <rect x="30" y="570" width="440" height="60" fill="#0a0a0a" :stroke="GOLD_DIM" stroke-width="1"/>
            <rect x="60" y="580" width="380" height="40" rx="20" fill="#0d2030" stroke="#1a4060" stroke-width="1.5"/>
            <ellipse cx="250" cy="600" rx="120" ry="14" fill="#0d2030" stroke="#1e5070" stroke-width="0.5"/>
            <text x="250" y="604" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#4a90c4" letter-spacing="1">POOL</text>
            <text x="250" y="625" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK">Private Courtyard</text>
          </template>

          <!-- SPA & SAUNA -->
          <template v-if="isUnlocked('intelNetwork')">
            <rect x="480" y="570" width="240" height="60" fill="#111111" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="600" y="600" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">SPA &amp;</text>
            <text x="600" y="615" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">SAUNA</text>
            <text x="600" y="628" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DIM">Medical Assistance</text>
          </template>

          <!-- PRIVATE GARAGE -->
          <template v-if="isUnlocked('safeHouse')">
            <rect x="740" y="570" width="318" height="60" fill="#0d0d0d" :stroke="GOLD_DIM" stroke-width="1"/>
            <text x="899" y="598" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">PRIVATE</text>
            <text x="899" y="613" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" :fill="GOLD">GARAGE</text>
            <rect x="870" y="620" width="56" height="14" rx="5" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.8"/>
            <rect x="876" y="616" width="44" height="8" rx="3" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.5"/>
            <circle cx="881" cy="634" r="3" fill="#0d0d0d" stroke="#5a5a5a" stroke-width="1"/>
            <circle cx="915" cy="634" r="3" fill="#0d0d0d" stroke="#5a5a5a" stroke-width="1"/>
            <line x1="950" y1="615" x2="1030" y2="615" :stroke="GOLD" stroke-width="1.5" marker-end="url(#arrow-o)"/>
            <text x="990" y="608" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD">EXIT</text>
          </template>

          <!-- Footer -->
          <rect x="30" y="636" width="1028" height="2" :fill="GOLD_DIM" opacity="0.4"/>
          <text x="544" y="648" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DARK" letter-spacing="2">MANAGEMENT RESERVES THE RIGHT TO REVOKE MEMBERSHIP · ALL DISPUTES SETTLED IN-HOUSE</text>

          <!-- Owner line -->
          <text x="544" y="658" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DARK" letter-spacing="1">{{ hqName }} — Owner: {{ hqOwner }}</text>

          <!-- Corner decorations -->
          <circle v-for="c in corners" :key="'c-o-' + c.key" :cx="c.cx" :cy="c.cy" r="8" fill="none" :stroke="GOLD_DIM" stroke-width="0.8"/>
          <text v-for="c in corners" :key="'t-o-' + c.key" :x="c.cx" :y="c.cy + 4" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD">✦</text>

          <!-- Guest dots (warm pastel, small, low opacity) -->
          <circle v-for="(g, gi) in guests" :key="'guest-o-' + gi" :cx="g.x" :cy="g.y" :r="2" :fill="g.color" :stroke="BG_DARK" stroke-width="0.3" opacity="0.55" class="hq-office__guest-dot"/>
          <!-- Assassin dots (red, thick white ring) -->
          <circle v-for="dot in assassinDots" :key="'assassin-o-' + dot.id" :cx="dot.x" :cy="dot.y" :r="4" :fill="dot.color" stroke="#ffffff" stroke-width="1.5" class="hq-office__assassin-dot"/>
          <!-- Staff dots (cool blue-green, larger, bright border) -->
          <circle v-for="dot in staffDots" :key="'dot-o-' + dot.id" :cx="dot.x" :cy="dot.y" :r="3.5" :fill="dot.color" stroke="#ffffff" stroke-width="0.8" class="hq-office__staff-dot" @mouseenter="onStaffHover(dot, $event)" @mouseleave="onStaffLeave"/>
          <!-- Chat bubbles -->
          <g v-for="b in chatBubbles" :key="'cb-o-' + b.id" class="hq-office__chat-bubble" :transform="`translate(${b.x}, ${b.y})`">
            <rect x="-30" y="-14" width="60" height="12" rx="3" :fill="BG_DARKER" :stroke="b.color" stroke-width="0.5" opacity="0.9"/>
            <text x="0" y="-5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="4" :fill="b.color">{{ b.text }}</text>
          </g>
        </svg>

        <div v-if="hoveredStaff" class="hq-office__tooltip" :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }">
          <div class="hq-office__tooltip-name">{{ hoveredStaff.name }}</div>
          <div class="hq-office__tooltip-level">Level {{ hoveredStaff.level }}</div>
        </div>
      </div>

      <div v-if="staffDots.length > 0 || assassinDots.length > 0" class="hq-office__legend">
        <div v-for="dot in staffDots" :key="dot.id" class="hq-office__legend-item">
          <span class="hq-office__legend-dot" :style="{ background: dot.color }"></span>
          <span class="hq-office__legend-name">{{ dot.name }}</span>
          <span class="hq-office__legend-level">Lv.{{ dot.level }}</span>
        </div>
        <div v-for="dot in assassinDots" :key="'al-o-' + dot.id" class="hq-office__legend-item">
          <span class="hq-office__legend-dot" :style="{ background: dot.color, borderColor: '#fff' }"></span>
          <span class="hq-office__legend-name">{{ dot.name }}</span>
          <span class="hq-office__legend-level">Lv.{{ dot.level }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
