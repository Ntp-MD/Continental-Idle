<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, nextTick, markRaw, triggerRef, computed } from 'vue'
import { gameState } from '@/engine/gameState'
import { getBranchDef } from '@/data/branches'
import { BUILDINGS } from '@/data/buildings'
import { STAFF_MAP } from '@/data/staff'
import { ASSASSIN_MAP } from '@/data/assassins'
import { getAIOwner } from '@/engine/aiOwnerManager'
import { getVisitors, callVisitor, royalMarkScroll, hireVisitor, dismissVisitor, canCallVisitor, canUseRoyalMarkScroll } from '@/engine/visitorManager'
import { fireStaff } from '@/engine/staffManager'
import { fireAssassin } from '@/engine/assassinManager'
import { eventBus } from '@/engine/eventBus'
import type { FloorId, VisitorEntry } from '@/types'

import HQRoomLayer from './hq/hqRoomLayer.vue'
import HQFalloutView from './hq/hqFalloutView.vue'
import HQNpcLayer from './hq/hqNpcLayer.vue'
import type { NpcDot } from './hq/hqNpcLayer.vue'
import HQVisitorCard from './hq/hqVisitorCard.vue'
import HQToolbar from './hq/hqToolbar.vue'
import HQFloorSelector from './hq/hqFloorSelector.vue'
import {
  SVG_W, SVG_H,
  FLOOR_IDS, getRoomsOnFloor, ROOM_ANCHORS,
  STAFF_COLORS, ASSASSIN_COLORS, GUEST_COLORS,
  getBuildingFloor, getGuestRoomTier, isFloorUnlocked, applySyncedLayout,
} from './hq/hqLayout'
import { findNpcPath } from '@/engine/npcPathfinding'
import { getGuestCount } from '@/engine/guestManager'

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

const staffDots = shallowRef<NpcDot[]>([])
const assassinDots = shallowRef<NpcDot[]>([])
const guestDots = shallowRef<NpcDot[]>([])
const visitorDots = shallowRef<NpcDot[]>([])

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
  /** Role: staff prefer their assigned building room. */
  focusRoom?: string
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

const npcDotsByFloor = shallowRef<Record<FloorId, { x: number; y: number; color: string }[]>>({} as Record<FloorId, { x: number; y: number; color: string }[]>)
let sidebarUpdateTimer: number | null = null

function updateSidebarDots(): void {
  const result = {} as Record<FloorId, { x: number; y: number; color: string }[]>
  FLOOR_IDS.forEach(f => { result[f] = [] })
  const allDots: { x: number; y: number; color: string; floor: FloorId }[] = [
    ...staffDots.value.map(d => ({ x: d.x, y: d.y, color: d.color, floor: (d.floor as FloorId) || '1' })),
    ...assassinDots.value.map(d => ({ x: d.x, y: d.y, color: d.color, floor: (d.floor as FloorId) || '1' })),
    ...guestDots.value.map(d => ({ x: d.x, y: d.y, color: d.color, floor: (d.floor as FloorId) || '1' })),
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
  npcDotsByFloor.value = result
}

function randAnchor(floor: FloorId, roomId: string): [number, number] {
  const anchors = ROOM_ANCHORS[floor]?.[roomId]
  if (anchors && anchors.length > 0) return anchors[Math.floor(Math.random() * anchors.length)]
  const room = getRoomsOnFloor(floor).find(item => item.id === roomId)
  if (room) return [room.x + room.w / 2, room.y + room.h / 2]
  return [SVG_W / 2, SVG_H / 2]
}

/** Build a corridor-routed path from (x,y) to a random anchor in the room. */
function pathToRoom(floor: FloorId, from: [number, number], roomId: string): [number, number][] {
  const dest = randAnchor(floor, roomId)
  return findNpcPath(floor, { x: from[0], y: from[1] }, { x: dest[0], y: dest[1] })
}

/** Pick a random room on the floor and route a corridor path to it.
 *  When `focusRoom` is given, NPCs head there ~70% of the time and wander otherwise. */
function pathToRandomRoom(floor: FloorId, from: [number, number], focusRoom?: string): [number, number][] {
  const rooms = getRoomsOnFloor(floor)
  if (rooms.length === 0) return [from]
  if (focusRoom && rooms.some(r => r.id === focusRoom) && Math.random() < 0.7) {
    return pathToRoom(floor, from, focusRoom)
  }
  const room = rooms[Math.floor(Math.random() * rooms.length)]
  return pathToRoom(floor, from, room.id)
}

/** Persist current staff/assassin dot positions to the branch so they survive HQ close/reopen. */
function saveNpcPositions(): void {
  const state = gameState.get()
  const branch = state.branches[state.hqBranch]
  if (!branch) return
  const positions = branch.npcPositions
  staffDots.value.forEach(d => {
    positions[d.id] = { x: d.x, y: d.y, floor: (d.floor as FloorId) || '1' }
  })
  assassinDots.value.forEach(d => {
    positions[d.id] = { x: d.x, y: d.y, floor: (d.floor as FloorId) || '9' }
  })
}

/** Restore a saved position for an NPC id, or null if none. */
function restorePosition(id: string): { x: number; y: number; floor: FloorId } | null {
  const branch = gameState.get().branches[gameState.get().hqBranch]
  if (!branch) return null
  const saved = branch.npcPositions[id]
  if (!saved) return null
  return { x: saved.x, y: saved.y, floor: saved.floor }
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
    const saved = restorePosition(staff.id)
    const x = saved?.x ?? randAnchor(floor, roomId)[0]
    const y = saved?.y ?? randAnchor(floor, roomId)[1]
    const useFloor = saved?.floor ?? floor
    const path = saved
      ? pathToRandomRoom(useFloor, [x, y])
      : pathToRoom(useFloor, [x, y], roomId)
    const dest = path[path.length - 1] || [x, y]

    dots.push({
      id: staff.id, x, y,
      color: STAFF_COLORS[staff.typeId] || '#aaa',
      name: def.name, profession: def.name,
      level: staff.level, rarity: staff.rarity,
      floor: useFloor,
    })
    anims.push({
      id: staff.id, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.2 + Math.random() * 0.3,
      pathIdx: 0, path,
      pauseTimer: Math.floor(Math.random() * 80), floor: useFloor,
      focusRoom: staff.assignedTo || undefined,
    })
  })

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

    const saved = restorePosition(assassin.id)
    const x = saved?.x ?? randAnchor(floor, 'armory')[0]
    const y = saved?.y ?? randAnchor(floor, 'armory')[1]
    const useFloor = saved?.floor ?? floor
    const path = saved
      ? pathToRandomRoom(useFloor, [x, y])
      : pathToRoom(useFloor, [x, y], 'armory')
    const dest = path[path.length - 1] || [x, y]

    dots.push({
      id: assassin.id, x, y,
      color: ASSASSIN_COLORS[assassin.typeId] || '#ff1744',
      name: def.name, profession: def.name,
      level: assassin.level, rarity: assassin.rarity,
      floor: useFloor,
    })
    anims.push({
      id: assassin.id, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.3 + Math.random() * 0.4,
      pathIdx: 0, path,
      pauseTimer: Math.floor(Math.random() * 60), floor: useFloor,
    })
  })

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

  const PATRON_NAMES = ['Mr. Smith', 'Ms. Chen', 'Mr. Volkov', 'Ms. Dubois', 'Mr. Okafor', 'Ms. Rossi', 'Mr. Lindqvist', 'Ms. Yamamoto', 'Mr. Reyes', 'Ms. Novak', 'Mr. Almasi', 'Ms. Park']
  const state = gameState.get()
  const totalGuests = Math.max(8, getGuestCount(state.hqBranch))

  for (let i = 0; i < totalGuests; i++) {
    const floor = floors[Math.floor(Math.random() * floors.length)] as FloorId
    const rooms = getRoomsOnFloor(floor)
    const room = rooms[Math.floor(Math.random() * rooms.length)]
    if (!room) continue

    const [x, y] = randAnchor(floor, room.id)
    const path = pathToRoom(floor, [x, y], room.id)
    const dest = path[path.length - 1] || [x, y]

    dots.push({
      id: 'guest_' + i, x, y,
      color: GUEST_COLORS[i % GUEST_COLORS.length],
      name: i < PATRON_NAMES.length ? PATRON_NAMES[i] : 'Guest',
      profession: i < PATRON_NAMES.length ? 'Patron' : 'Visitor',
      level: 1, rarity: 'C',
      floor,
    })
    anims.push({
      id: 'guest_' + i, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.15 + Math.random() * 0.35,
      pathIdx: 0, path,
      pauseTimer: Math.floor(Math.random() * 60), floor,
    })
  }

  initAmbientPatrons(dots, anims)

  anims.forEach(a => markRaw(a))
  guestDots.value = dots
  animGuests.value = anims
}

function initAmbientPatrons(dots: NpcDot[], anims: AnimDot[]): void {
  const AMBIENT_NAMES = ['Mr. Watanabe', 'Ms. Costa', 'Mr. Petrov', 'Ms. Adebayo', 'Mr. Kowalski', 'Ms. Nakamura', 'Mr. Fontaine', 'Ms. Eriksson']
  const ambientFloors: FloorId[] = ['1', '2']
  const ambientRooms: Partial<Record<FloorId, string[]>> = {
    '1': ['reception', 'lounge', 'concierge'],
    '2': ['kitchen', 'bar'],
  }

  for (let i = 0; i < 8; i++) {
    const floor = ambientFloors[Math.floor(Math.random() * ambientFloors.length)] as FloorId
    if (!isFloorUnlocked(floor, buildingsUnlocked.value)) continue
    const roomIds = ambientRooms[floor]
    if (!roomIds) continue
    const roomId = roomIds[Math.floor(Math.random() * roomIds.length)]
    const [x, y] = randAnchor(floor, roomId)
    const path = pathToRoom(floor, [x, y], roomId)
    const dest = path[path.length - 1] || [x, y]

    dots.push({
      id: 'ambient_' + i, x, y,
      color: GUEST_COLORS[(i + 2) % GUEST_COLORS.length],
      name: AMBIENT_NAMES[i % AMBIENT_NAMES.length],
      profession: 'Patron',
      level: 1, rarity: 'D',
      floor,
    })
    anims.push({
      id: 'ambient_' + i, x, y,
      targetX: dest[0], targetY: dest[1],
      speed: 0.1 + Math.random() * 0.25,
      pathIdx: 0, path,
      pauseTimer: Math.floor(Math.random() * 100),
      floor,
    })
  }
}

function initVisitors(): void {
  visitors.value = getVisitors()
  const receptionAnchors = ROOM_ANCHORS['1']?.reception || [[600, 300] as [number, number]]
  const dots: NpcDot[] = visitors.value.map((v, i) => {
    const def = v.isAssassin ? ASSASSIN_MAP[v.typeId] : STAFF_MAP[v.typeId]
    const [x, y] = receptionAnchors[i % receptionAnchors.length]
    return {
      id: v.id, x, y,
      color: v.isAssassin ? (ASSASSIN_COLORS[v.typeId] || '#ff1744') : (STAFF_COLORS[v.typeId] || '#aaa'),
      name: def?.name || v.typeId,
      profession: v.isAssassin ? 'Assassin' : 'Staff',
      level: 1, rarity: v.rarity, isVisitor: true,
      floor: '1' as const,
    }
  })
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
            const newPath = pathToRandomRoom(a.floor, [a.x, a.y], a.focusRoom)
            a.path = newPath
            a.pathIdx = 0
            const dest = newPath[newPath.length - 1] || [a.x, a.y]
            a.targetX = dest[0]; a.targetY = dest[1]
          }
        } else {
          a.x += (dx / dist) * a.speed
          a.y += (dy / dist) * a.speed
        }
      }
      if (dots[i]) {
        dots[i].x = a.x; dots[i].y = a.y
        // Mark staff focused when resting in their assigned room
        if (a.focusRoom && a.pathIdx >= a.path.length) {
          dots[i].focused = true
        } else if (a.focusRoom) {
          dots[i].focused = false
        }
      }
    }
  }
  updateDots(animStaff.value, staffDots.value)
  updateDots(animAssassins.value, assassinDots.value)
  updateDots(animGuests.value, guestDots.value)
  triggerRef(staffDots)
  triggerRef(assassinDots)
  triggerRef(guestDots)
  if (sidebarUpdateTimer === null) {
    sidebarUpdateTimer = window.setTimeout(() => {
      updateSidebarDots()
      sidebarUpdateTimer = null
    }, 200)
  }
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
    ...staffDots.value.filter(d => (d.floor as FloorId) === floor),
    ...assassinDots.value.filter(d => (d.floor as FloorId) === floor),
    ...guestDots.value.filter(d => (d.floor as FloorId) === floor),
    ...(floor === '1' ? visitorDots.value : []),
  ]
})

const floorUnlocked = computed(() => isFloorUnlocked(selectedFloor.value, buildingsUnlocked.value))

function refreshVisitors(): void { initVisitors() }

function handleBlueprintSync(): void {
  applySyncedLayout()
  initStaff()
  initAssassins()
  initGuests()
  initVisitors()
  updateSidebarDots()
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  } else if (rafId === null) {
    rafId = requestAnimationFrame(animate)
  }
}

onMounted(() => {
  const state = gameState.get()
  const def = getBranchDef(state.hqBranch)
  hqName.value = def?.name || 'HQ'
  const owner = getAIOwner(state.hqBranch)
  hqOwner.value = owner ? owner.name : 'Unknown'
  initStaff(); initAssassins(); initGuests(); initVisitors()
  updateSidebarDots()
  eventBus.on('visitor:arrived', refreshVisitors)
  eventBus.on('visitor:left', refreshVisitors)
  eventBus.on('visitor:hired', refreshVisitors)
  eventBus.on('visitor:dismissed', refreshVisitors)
  window.addEventListener('blueprint:sync', handleBlueprintSync)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  nextTick(() => { rafId = requestAnimationFrame(animate) })
})

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (sidebarUpdateTimer !== null) { clearTimeout(sidebarUpdateTimer); sidebarUpdateTimer = null }
  saveNpcPositions()
  eventBus.off('visitor:arrived', refreshVisitors)
  eventBus.off('visitor:left', refreshVisitors)
  eventBus.off('visitor:hired', refreshVisitors)
  eventBus.off('visitor:dismissed', refreshVisitors)
  window.removeEventListener('blueprint:sync', handleBlueprintSync)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div :class="props.inline ? 'hqoffice hqoffice__inline' : 'hqoffice hqoffice__overlay'" @click.self="!props.inline && emit('close')">
    <HQToolbar
      :view-mode="viewMode" :show-labels="showLabels"
      :golden-coins="goldenCoins" :royal-marks="royalMarks"
      :can-call-visitor="canCallVisitor()" :can-use-royal-mark="canUseRoyalMarkScroll()"
      :visitor-count="visitors.length"
      @toggle-view="viewMode = viewMode === 'birdseye' ? 'fallout' : 'birdseye'"
      @toggle-labels="showLabels = !showLabels"
      @call-visitor="onCallVisitor" @royal-mark-scroll="onRoyalMarkScroll"
    />
    <div class="hqoffice__content">
      <template v-if="viewMode === 'birdseye'">
        <div class="hqoffice__main">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="hqoffice__svg" preserveAspectRatio="xMidYMid meet">
            <HQRoomLayer :floor="selectedFloor" :unlocked="floorUnlocked" :building-levels="buildingLevels" />
            <HQNpcLayer v-if="floorUnlocked" :dots="currentFloorDots" :show-labels="showLabels" :selected-npc-id="selectedNpcId" @click="onNpcClick" />
          </svg>
        </div>
        <div class="hqoffice__sidebar">
          <HQFloorSelector :selected-floor="selectedFloor" :buildings="buildingsUnlocked" :npc-dots="npcDotsByFloor" @select="selectedFloor = $event" />
        </div>
      </template>
      <template v-else>
        <div class="hqoffice__fallout">
          <HQFalloutView :buildings="buildingsUnlocked" :npc-dots="npcDotsByFloor" :show-labels="showLabels" @select-floor="selectedFloor = $event; viewMode = 'birdseye'" />
        </div>
      </template>
    </div>
    <div v-if="visitors.length > 0 && selectedFloor === '1'" class="hqoffice__visitors">
      <HQVisitorCard v-for="v in visitors" :key="v.id" :visitor="v" :branch-currency="branchCurrency" @hire="onHireVisitor" @dismiss="onDismissVisitor" />
    </div>
    <div v-if="selectedNpc && !selectedVisitor" class="hqoffice__statspanel">
      <div class="hqoffice__statshead">
        <span>{{ selectedNpc.dot.name }} Lv.{{ selectedNpc.dot.level }}</span>
        <span class="hqoffice__statsrarity">{{ selectedNpc.dot.rarity }}</span>
        <button class="hqoffice__statsclose" @click="selectedNpcId = null">×</button>
      </div>
      <div class="hqoffice__statsbody">
        <div class="hqoffice__statsrow">
          <span>PREC</span><b>{{ selectedNpc.data.stats.precision }}</b>
          <span>SPD</span><b>{{ selectedNpc.data.stats.speed }}</b>
        </div>
        <div class="hqoffice__statsrow">
          <span>CHA</span><b>{{ selectedNpc.data.stats.charisma }}</b>
          <span>LCK</span><b>{{ selectedNpc.data.stats.luck }}</b>
        </div>
        <div class="hqoffice__statstraits">Traits: {{ selectedNpc.data.traits.join(', ') || '—' }}</div>
        <button v-if="selectedNpc.type === 'staff'" class="hqoffice__firebtn" @click="onFireStaff(selectedNpc.data.id)">Fire Staff</button>
        <button v-else class="hqoffice__firebtn" @click="onFireAssassin(selectedNpc.data.id)">Fire Assassin</button>
      </div>
    </div>
    <div v-if="selectedVisitor" class="hqoffice__visitor">
      <HQVisitorCard :visitor="selectedVisitor" :branch-currency="branchCurrency" @hire="onHireVisitor" @dismiss="onDismissVisitor" />
      <button class="hqoffice__statsclose" @click="selectedVisitor = null; selectedNpcId = null">×</button>
    </div>
    <div v-if="props.inline" class="hqoffice__info"><span>{{ hqName }} — {{ hqOwner }}</span></div>
  </div>
</template>

<style scoped>
.hqoffice { display: flex; flex-direction: column; background: #0d0d0d; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
.hqoffice__inline { height: 100%; min-height: 400px; }
.hqoffice__overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.85); }
.hqoffice__content { display: flex; flex: 1; overflow: hidden; }
.hqoffice__main { flex: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.hqoffice__svg { width: 100%; height: 100%; max-height: 600px; }
.hqoffice__sidebar { width: 200px; flex-shrink: 0; overflow-y: auto; border-left: 1px solid #222; padding: 4px; }
.hqoffice__fallout { flex: 1; overflow: auto; padding: 8px; }
.hqoffice__visitors { display: flex; gap: 8px; padding: 8px; flex-wrap: wrap; border-top: 1px solid #222; }
.hqoffice__statspanel { position: absolute; right: 220px; top: 60px; background: #1a1a1a; border: 1px solid #c9a84c; border-radius: 6px; padding: 10px; min-width: 220px; z-index: 10; }
.hqoffice__inline .hqoffice__statspanel { position: relative; right: auto; top: auto; margin: 4px; }
.hqoffice__statshead { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #333; padding-bottom: 6px; margin-bottom: 8px; font-family: Georgia, serif; color: #c9a84c; font-size: 13px; }
.hqoffice__statsrarity { font-weight: bold; font-size: 14px; }
.hqoffice__statsclose { margin-left: auto; background: none; border: none; color: #888; font-size: 18px; cursor: pointer; }
.hqoffice__statsbody { font-size: 11px; color: #aaa; }
.hqoffice__statsrow { display: grid; grid-template-columns: auto auto auto auto; gap: 6px; margin-bottom: 4px; align-items: center; }
.hqoffice__statsrow span { color: #666; font-size: 9px; }
.hqoffice__statsrow b { color: #c9a84c; }
.hqoffice__statstraits { font-size: 10px; color: #777; margin: 6px 0; }
.hqoffice__firebtn { width: 100%; background: #3a1a1a; color: #ff5252; border: 1px solid #5a2a2a; border-radius: 4px; padding: 6px; font-size: 11px; cursor: pointer; margin-top: 6px; }
.hqoffice__firebtn:hover { background: #5a2a2a; }
.hqoffice__visitor { position: relative; display: inline-block; }
.hqoffice__info { padding: 4px 12px; font-size: 11px; color: #666; font-family: Georgia, serif; border-top: 1px solid #222; }
</style>
