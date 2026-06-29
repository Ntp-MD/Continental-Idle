<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, markRaw, computed } from 'vue'
import { gameState } from '@/engine/game-state'
import { getBranchDef } from '@/data/branches'
import { BUILDINGS } from '@/data/buildings'
import { STAFF_MAP } from '@/data/staff'
import { ASSASSIN_MAP } from '@/data/assassins'
import { getAIOwner } from '@/engine/ai-owner-manager'
import { getVisitors, callVisitor, royalMarkScroll, hireVisitor, dismissVisitor, canCallVisitor, canUseRoyalMarkScroll } from '@/engine/visitor-manager'
import { fireStaff } from '@/engine/staff-manager'
import { fireAssassin } from '@/engine/assassin-manager'
import { eventBus } from '@/engine/event-bus'
import type { FloorId, VisitorEntry } from '@/types'

import HQRoomLayer from './hq/HQRoomLayer.vue'
import HQFalloutView from './hq/HQFalloutView.vue'
import HQNpcLayer from './hq/HQNpcLayer.vue'
import type { NpcDot } from './hq/HQNpcLayer.vue'
import HQVisitorCard from './hq/HQVisitorCard.vue'
import HQToolbar from './hq/HQToolbar.vue'
import HQFloorSelector from './hq/HQFloorSelector.vue'
import {
  SVG_W, SVG_H,
  FLOOR_IDS, getRoomsOnFloor, ROOM_ANCHORS,
  STAFF_COLORS, ASSASSIN_COLORS, GUEST_COLORS,
  getBuildingFloor, getGuestRoomTier, isFloorUnlocked,
} from './hq/hq-layout'

const props = defineProps<{ inline?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const viewMode = ref<'birdseye' | 'fallout'>('birdseye')
const showLabels = ref(true)
const selectedFloor = ref<FloorId>('1')
const selectedNpcId = ref<string | null>(null)
const selectedVisitor = ref<VisitorEntry | null>(null)
const visitors = ref<VisitorEntry[]>([])

const hqName = ref('')
const hqOwner = ref('')

const staffDots = ref<NpcDot[]>([])
const assassinDots = ref<NpcDot[]>([])
const guestDots = ref<NpcDot[]>([])
const visitorDots = ref<NpcDot[]>([])

let rafId: number | null = null

interface AnimDot {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  pathIdx: number
  path: [number, number][]
  pauseTimer: number
  floor: FloorId
}

const animStaff = ref<AnimDot[]>([])
const animAssassins = ref<AnimDot[]>([])
const animGuests = ref<AnimDot[]>([])

const hqBranchState = computed(() => {
  const state = gameState.get()
  return state.branches[state.hqBranch]
})

const buildingLevels = computed(() => {
  const branch = hqBranchState.value
  if (!branch) return {} as Record<string, number>
  const levels: Record<string, number> = {}
  BUILDINGS.forEach(b => { levels[b.id] = branch.buildings[b.id]?.level || 0 })
  return levels
})

const buildingsUnlocked = computed(() => {
  const branch = hqBranchState.value
  if (!branch) return {} as Record<string, { level: number; unlocked: boolean }>
  const result: Record<string, { level: number; unlocked: boolean }> = {}
  BUILDINGS.forEach(b => { result[b.id] = branch.buildings[b.id] || { level: 0, unlocked: false } })
  return result
})

const goldenCoins = computed(() => gameState.get().goldenCoins)
const royalMarks = computed(() => gameState.get().royalMarks)
const branchCurrency = computed(() => hqBranchState.value?.currency || 0)

const npcDotsByFloor = computed(() => {
  const result = {} as Record<FloorId, { x: number; y: number; color: string }[]>
  FLOOR_IDS.forEach(f => { result[f] = [] })
  const allDots: { x: number; y: number; color: string; floor: FloorId }[] = [
    ...staffDots.value.map(d => ({ x: d.x, y: d.y, color: d.color, floor: getNpcFloor(d.id) })),
    ...assassinDots.value.map(d => ({ x: d.x, y: d.y, color: d.color, floor: getNpcFloor(d.id) })),
    ...guestDots.value.map(d => ({ x: d.x, y: d.y, color: d.color, floor: getNpcFloor(d.id) })),
  ]
  allDots.forEach(d => {
    if (result[d.floor]) {
      result[d.floor].push({ x: d.x, y: d.y, color: d.color })
    }
  })
  if (selectedFloor.value === '1') {
    visitorDots.value.forEach(d => {
      result['1'].push({ x: d.x, y: d.y, color: d.color })
    })
  }
  return result
})

function getNpcFloor(id: string): FloorId {
  const s = animStaff.value.find(d => d.id === id)
  if (s) return s.floor
  const a = animAssassins.value.find(d => d.id === id)
  if (a) return a.floor
  const g = animGuests.value.find(d => d.id === id)
  if (g) return g.floor
  return '1'
}

function randAnchor(floor: FloorId, roomId: string): [number, number] {
  const anchors = ROOM_ANCHORS[floor]?.[roomId]
  if (!anchors || anchors.length === 0) return [450, 300]
  return anchors[Math.floor(Math.random() * anchors.length)]
}

function getStaffFloor(assignedTo: string | null): FloorId {
  if (!assignedTo) {
    const floors: FloorId[] = ['1', '2', '3']
    return floors[Math.floor(Math.random() * floors.length)]
  }
  if (assignedTo === 'guestRooms') {
    return getGuestRoomTier(buildingLevels.value['guestRooms'] || 0)
  }
  return getBuildingFloor(assignedTo)
}

function initStaff(): void {
  const state = gameState.get()
  const branch = state.branches[state.hqBranch]
  if (!branch) return

  const dots: NpcDot[] = []
  const anims: AnimDot[] = []

  Object.values(branch.staff).forEach(staff => {
    const def = STAFF_MAP[staff.typeId]
    if (!def) return

    const floor = getStaffFloor(staff.assignedTo)
    const roomId = staff.assignedTo || 'reception'
    const [x, y] = randAnchor(floor, roomId)
    const dest = randAnchor(floor, roomId)

    dots.push({
      id: staff.id, x, y,
      color: STAFF_COLORS[staff.typeId] || '#aaa',
      name: def.name, profession: def.name,
      level: staff.level, rarity: staff.rarity,
    })
    anims.push({
      id: staff.id, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.2 + Math.random() * 0.3,
      pathIdx: 0, path: [[x, y], dest],
      pauseTimer: Math.floor(Math.random() * 80), floor,
    })
  })

  dots.forEach(d => markRaw(d))
  anims.forEach(a => markRaw(a))
  staffDots.value = dots
  animStaff.value = anims
}

function initAssassins(): void {
  const state = gameState.get()
  const branch = state.branches[state.hqBranch]
  if (!branch) return

  const dots: NpcDot[] = []
  const anims: AnimDot[] = []
  const floor: FloorId = '9'

  Object.values(branch.assassins).forEach(assassin => {
    const def = ASSASSIN_MAP[assassin.typeId]
    if (!def) return

    const [x, y] = randAnchor(floor, 'armory')
    const dest = randAnchor(floor, 'armory')

    dots.push({
      id: assassin.id, x, y,
      color: ASSASSIN_COLORS[assassin.typeId] || '#ff1744',
      name: def.name, profession: def.name,
      level: assassin.level, rarity: assassin.rarity,
    })
    anims.push({
      id: assassin.id, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.3 + Math.random() * 0.4,
      pathIdx: 0, path: [[x, y], dest],
      pauseTimer: Math.floor(Math.random() * 60), floor,
    })
  })

  dots.forEach(d => markRaw(d))
  anims.forEach(a => markRaw(a))
  assassinDots.value = dots
  animAssassins.value = anims
}

function initGuests(): void {
  const guestFloors: FloorId[] = ['1', '2', '3', '4', '5', '6']
  const unlocked = guestFloors.filter(f => isFloorUnlocked(f, buildingsUnlocked.value))
  const floors = unlocked.length > 0 ? unlocked : ['1']

  const dots: NpcDot[] = []
  const anims: AnimDot[] = []

  for (let i = 0; i < 15; i++) {
    const floor = floors[Math.floor(Math.random() * floors.length)] as FloorId
    const rooms = getRoomsOnFloor(floor)
    const room = rooms[Math.floor(Math.random() * rooms.length)]
    if (!room) continue

    const [x, y] = randAnchor(floor, room.id)
    const dest = randAnchor(floor, room.id)

    dots.push({
      id: 'guest_' + i, x, y,
      color: GUEST_COLORS[i % GUEST_COLORS.length],
      name: 'Guest', profession: 'Visitor',
      level: 1, rarity: 'C',
    })
    anims.push({
      id: 'guest_' + i, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.15 + Math.random() * 0.35,
      pathIdx: 0, path: [[x, y], dest],
      pauseTimer: Math.floor(Math.random() * 60), floor,
    })
  }

  dots.forEach(d => markRaw(d))
  anims.forEach(a => markRaw(a))
  guestDots.value = dots
  animGuests.value = anims
}

function initVisitors(): void {
  visitors.value = getVisitors()
  const dots: NpcDot[] = visitors.value.map((v, i) => {
    const def = v.isAssassin ? ASSASSIN_MAP[v.typeId] : STAFF_MAP[v.typeId]
    return {
      id: v.id, x: 350 + i * 60, y: 200,
      color: v.isAssassin ? (ASSASSIN_COLORS[v.typeId] || '#ff1744') : (STAFF_COLORS[v.typeId] || '#aaa'),
      name: def?.name || v.typeId,
      profession: v.isAssassin ? 'Assassin' : 'Staff',
      level: 1, rarity: v.rarity, isVisitor: true,
    }
  })
  dots.forEach(d => markRaw(d))
  visitorDots.value = dots
}

function animate(): void {
  const updateDots = (anims: AnimDot[], dots: NpcDot[]) => {
    for (let i = 0; i < anims.length; i++) {
      const a = anims[i]
      if (a.pauseTimer > 0) { a.pauseTimer--; continue }
      if (a.pathIdx < a.path.length) {
        const [wx, wy] = a.path[a.pathIdx]
        const dx = wx - a.x, dy = wy - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 2) {
          a.pathIdx++
          if (a.pathIdx >= a.path.length) {
            a.pauseTimer = 60 + Math.floor(Math.random() * 120)
            const rooms = getRoomsOnFloor(a.floor)
            const room = rooms[Math.floor(Math.random() * rooms.length)]
            if (room) {
              const dest = randAnchor(a.floor, room.id)
              a.path = [[a.x, a.y], dest]
              a.pathIdx = 0
              a.targetX = dest[0]; a.targetY = dest[1]
            }
          }
        } else {
          a.x += (dx / dist) * a.speed
          a.y += (dy / dist) * a.speed
        }
      }
      if (dots[i]) { dots[i].x = a.x; dots[i].y = a.y }
    }
  }
  updateDots(animStaff.value, staffDots.value)
  updateDots(animAssassins.value, assassinDots.value)
  updateDots(animGuests.value, guestDots.value)
  rafId = requestAnimationFrame(animate)
}

function onNpcClick(dot: NpcDot): void {
  selectedNpcId.value = dot.id
  if (dot.isVisitor) {
    const v = visitors.value.find(vis => vis.id === dot.id)
    if (v) selectedVisitor.value = v
  }
}

function onHireVisitor(visitorId: string): void {
  const state = gameState.get()
  if (hireVisitor(visitorId, state.hqBranch)) {
    initStaff(); initAssassins(); initVisitors()
    selectedVisitor.value = null; selectedNpcId.value = null
  }
}

function onDismissVisitor(visitorId: string): void {
  dismissVisitor(visitorId); initVisitors()
  selectedVisitor.value = null; selectedNpcId.value = null
}

function onCallVisitor(): void { if (callVisitor()) initVisitors() }
function onRoyalMarkScroll(): void { if (royalMarkScroll()) initVisitors() }

function onFireStaff(staffId: string): void {
  const state = gameState.get()
  if (fireStaff(staffId, state.hqBranch)) { initStaff(); selectedNpcId.value = null }
}

function onFireAssassin(assassinId: string): void {
  const state = gameState.get()
  if (fireAssassin(assassinId, state.hqBranch)) { initAssassins(); selectedNpcId.value = null }
}

const selectedNpc = computed(() => {
  if (!selectedNpcId.value) return null
  const sDot = staffDots.value.find(d => d.id === selectedNpcId.value)
  if (sDot) {
    const staff = hqBranchState.value?.staff[selectedNpcId.value]
    return staff ? { type: 'staff' as const, dot: sDot, data: staff } : null
  }
  const aDot = assassinDots.value.find(d => d.id === selectedNpcId.value)
  if (aDot) {
    const assassin = hqBranchState.value?.assassins[selectedNpcId.value]
    return assassin ? { type: 'assassin' as const, dot: aDot, data: assassin } : null
  }
  return null
})

const currentFloorDots = computed(() => {
  const floor = selectedFloor.value
  return [
    ...staffDots.value.filter(d => getNpcFloor(d.id) === floor),
    ...assassinDots.value.filter(d => getNpcFloor(d.id) === floor),
    ...guestDots.value.filter(d => getNpcFloor(d.id) === floor),
    ...(floor === '1' ? visitorDots.value : []),
  ]
})

const floorUnlocked = computed(() => isFloorUnlocked(selectedFloor.value, buildingsUnlocked.value))

function refreshVisitors(): void { initVisitors() }

onMounted(() => {
  const state = gameState.get()
  const def = getBranchDef(state.hqBranch)
  hqName.value = def?.name || 'HQ'
  const owner = getAIOwner(state.hqBranch)
  hqOwner.value = owner ? owner.name : 'Unknown'
  initStaff(); initAssassins(); initGuests(); initVisitors()
  eventBus.on('visitor:arrived', refreshVisitors)
  eventBus.on('visitor:left', refreshVisitors)
  eventBus.on('visitor:hired', refreshVisitors)
  eventBus.on('visitor:dismissed', refreshVisitors)
  nextTick(() => { rafId = requestAnimationFrame(animate) })
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  eventBus.off('visitor:arrived', refreshVisitors)
  eventBus.off('visitor:left', refreshVisitors)
  eventBus.off('visitor:hired', refreshVisitors)
  eventBus.off('visitor:dismissed', refreshVisitors)
})
</script>

<template>
  <div :class="props.inline ? 'hq-office hq-office--inline' : 'hq-office hq-office--overlay'" @click.self="!props.inline && emit('close')">
    <HQToolbar
      :view-mode="viewMode" :show-labels="showLabels"
      :golden-coins="goldenCoins" :royal-marks="royalMarks"
      :can-call-visitor="canCallVisitor()" :can-use-royal-mark="canUseRoyalMarkScroll()"
      :visitor-count="visitors.length"
      @toggle-view="viewMode = viewMode === 'birdseye' ? 'fallout' : 'birdseye'"
      @toggle-labels="showLabels = !showLabels"
      @call-visitor="onCallVisitor" @royal-mark-scroll="onRoyalMarkScroll"
    />
    <div class="hq-office__content">
      <template v-if="viewMode === 'birdseye'">
        <div class="hq-office__main">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="hq-office__svg" preserveAspectRatio="xMidYMid meet">
            <HQRoomLayer :floor="selectedFloor" :unlocked="floorUnlocked" :building-levels="buildingLevels" />
            <HQNpcLayer v-if="floorUnlocked" :dots="currentFloorDots" :show-labels="showLabels" :selected-npc-id="selectedNpcId" @click="onNpcClick" />
          </svg>
        </div>
        <div class="hq-office__sidebar">
          <HQFloorSelector :selected-floor="selectedFloor" :buildings="buildingsUnlocked" :npc-dots="npcDotsByFloor" @select="selectedFloor = $event" />
        </div>
      </template>
      <template v-else>
        <div class="hq-office__fallout">
          <HQFalloutView :buildings="buildingsUnlocked" :npc-dots="npcDotsByFloor" :show-labels="showLabels" @select-floor="selectedFloor = $event; viewMode = 'birdseye'" />
        </div>
      </template>
    </div>
    <div v-if="visitors.length > 0 && selectedFloor === '1'" class="hq-office__visitors">
      <HQVisitorCard v-for="v in visitors" :key="v.id" :visitor="v" :branch-currency="branchCurrency" @hire="onHireVisitor" @dismiss="onDismissVisitor" />
    </div>
    <div v-if="selectedNpc && !selectedVisitor" class="hq-office__stats-panel">
      <div class="hq-office__stats-header">
        <span>{{ selectedNpc.dot.name }} Lv.{{ selectedNpc.dot.level }}</span>
        <span class="hq-office__stats-rarity">{{ selectedNpc.dot.rarity }}</span>
        <button class="hq-office__stats-close" @click="selectedNpcId = null">Ã—</button>
      </div>
      <div class="hq-office__stats-body">
        <div class="hq-office__stats-row">
          <span>PREC</span><b>{{ selectedNpc.data.stats.precision }}</b>
          <span>SPD</span><b>{{ selectedNpc.data.stats.speed }}</b>
        </div>
        <div class="hq-office__stats-row">
          <span>CHA</span><b>{{ selectedNpc.data.stats.charisma }}</b>
          <span>LCK</span><b>{{ selectedNpc.data.stats.luck }}</b>
        </div>
        <div class="hq-office__stats-traits">Traits: {{ selectedNpc.data.traits.join(', ') || 'â€”' }}</div>
        <button v-if="selectedNpc.type === 'staff'" class="hq-office__fire-btn" @click="onFireStaff(selectedNpc.data.id)">Fire Staff</button>
        <button v-else class="hq-office__fire-btn" @click="onFireAssassin(selectedNpc.data.id)">Fire Assassin</button>
      </div>
    </div>
    <div v-if="selectedVisitor" class="hq-office__visitor-detail">
      <HQVisitorCard :visitor="selectedVisitor" :branch-currency="branchCurrency" @hire="onHireVisitor" @dismiss="onDismissVisitor" />
      <button class="hq-office__stats-close" @click="selectedVisitor = null; selectedNpcId = null">Ã—</button>
    </div>
    <div v-if="props.inline" class="hq-office__info"><span>{{ hqName }} â€” {{ hqOwner }}</span></div>
  </div>
</template>

<style scoped>
.hq-office { display: flex; flex-direction: column; background: #0d0d0d; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
.hq-office--inline { height: 100%; min-height: 400px; }
.hq-office--overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.85); }
.hq-office__content { display: flex; flex: 1; overflow: hidden; }
.hq-office__main { flex: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.hq-office__svg { width: 100%; height: 100%; max-height: 600px; }
.hq-office__sidebar { width: 200px; flex-shrink: 0; overflow-y: auto; border-left: 1px solid #222; padding: 4px; }
.hq-office__fallout { flex: 1; overflow: auto; padding: 8px; }
.hq-office__visitors { display: flex; gap: 8px; padding: 8px; flex-wrap: wrap; border-top: 1px solid #222; }
.hq-office__stats-panel { position: absolute; right: 220px; top: 60px; background: #1a1a1a; border: 1px solid #c9a84c; border-radius: 6px; padding: 10px; min-width: 220px; z-index: 10; }
.hq-office--inline .hq-office__stats-panel { position: relative; right: auto; top: auto; margin: 4px; }
.hq-office__stats-header { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #333; padding-bottom: 6px; margin-bottom: 8px; font-family: Georgia, serif; color: #c9a84c; font-size: 13px; }
.hq-office__stats-rarity { font-weight: bold; font-size: 14px; }
.hq-office__stats-close { margin-left: auto; background: none; border: none; color: #888; font-size: 18px; cursor: pointer; }
.hq-office__stats-body { font-size: 11px; color: #aaa; }
.hq-office__stats-row { display: grid; grid-template-columns: auto auto auto auto; gap: 6px; margin-bottom: 4px; align-items: center; }
.hq-office__stats-row span { color: #666; font-size: 9px; }
.hq-office__stats-row b { color: #c9a84c; }
.hq-office__stats-traits { font-size: 10px; color: #777; margin: 6px 0; }
.hq-office__fire-btn { width: 100%; background: #3a1a1a; color: #ff5252; border: 1px solid #5a2a2a; border-radius: 4px; padding: 6px; font-size: 11px; cursor: pointer; margin-top: 6px; }
.hq-office__fire-btn:hover { background: #5a2a2a; }
.hq-office__visitor-detail { position: relative; display: inline-block; }
.hq-office__info { padding: 4px 12px; font-size: 11px; color: #666; font-family: Georgia, serif; border-top: 1px solid #222; }
</style>
