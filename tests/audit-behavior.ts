import assert from 'node:assert/strict'
import { NpcEngine } from '../src/engine/npc'
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import type { AssetDef, FloorData, NpcSimulationConfig, ObjectData, TileEdges } from '../src/blueprint-editor/types'

const TILE = 25
const CANVAS = { w: 1600, h: 1000, tileSize: TILE }
const TPS = 60
const RUN_TICKS = 6 * 60 * TPS

function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const random = mulberry32(20260824)

const ASSETS = [
	{
		id: 'audit-reception',
		name: 'Reception Desk',
		w: 4,
		h: 1,
		origin: 'drawn',
		walkable: false,
		tags: ['front-desk', 'back-of-house'],
		tileStates: [['entrance', 'entrance', 'entrance', 'entrance']],
		interactSpots: [{ x: 50, y: -12 }],
		interact: { capacity: 1, durationMin: 25, durationMax: 35 },
		queue: { maxMembers: 3, admissionDepth: 4 },
	},
	{
		id: 'audit-sofa',
		name: 'Lounge Sofa',
		w: 2,
		h: 1,
		origin: 'drawn',
		walkable: false,
		tags: ['guest-area', 'lounge'],
		tileStates: [['blocked', 'blocked']],
		interactSpots: [{ x: 12, y: 37 }, { x: 37, y: 37 }],
		interact: { capacity: 1, durationMin: 8, durationMax: 20 },
	},
	{
		id: 'audit-bar',
		name: 'Bar Counter',
		w: 4,
		h: 1,
		origin: 'drawn',
		walkable: false,
		tags: ['bar'],
		tileStates: [['entrance', 'entrance', 'entrance', 'entrance']],
		interactSpots: [{ x: 25, y: -12 }, { x: 75, y: -12 }],
		interact: { capacity: 2, durationMin: 10, durationMax: 25 },
		queue: { maxMembers: 3, admissionDepth: 4 },
	},
	{
		id: 'audit-staffdesk',
		name: 'Staff Desk',
		w: 3,
		h: 1,
		origin: 'drawn',
		walkable: false,
		tags: ['front-desk', 'back-of-house'],
		tileStates: [['entrance', 'entrance', 'entrance']],
		interactSpots: [{ x: 37, y: -12 }],
		interact: { capacity: 1, durationMin: 50, durationMax: 70 },
		queue: { maxMembers: 3, admissionDepth: 4 },
	},
	{
		id: 'audit-elevator',
		name: 'Elevator',
		w: 3,
		h: 3,
		origin: 'svg-import',
		walkable: false,
		tags: ['portal'],
		walkableGrid: [[true, true, true], [true, true, true], [true, true, true]],
		tileStates: [['walkable', 'walkable', 'walkable'], ['walkable', 'walkable', 'walkable'], ['walkable', 'walkable', 'walkable']],
		interactSpots: [12.5, 37.5, 62.5].flatMap(y => [12.5, 37.5, 62.5].map(x => ({ x, y }))),
	},
] as unknown as AssetDef[]

const assetMap = new Map(ASSETS.map(asset => [asset.id, asset]))
const getAssetDef = (type: string): AssetDef | undefined => assetMap.get(type)
const getAssetTags = (type: string): string[] | undefined => assetMap.get(type)?.tags

function object(type: string, id: string, x: number, y: number): ObjectData {
	const asset = assetMap.get(type)!
	return { id, type, x, y, w: asset.w * TILE, h: asset.h * TILE, rotation: 0 }
}

function sealedNorthEdge(doorCols: number[]): { tileEdges: TileEdges[][] } {
	const rows: TileEdges[][] = Array.from({ length: 40 }, () => [])
	for (const col of doorCols) rows[18][col] = { top: true }
	return { tileEdges: rows }
}

const FLOORS: FloorData[] = [
	{
		id: 'G',
		name: 'Lobby',
		label: 'G',
		defaultWalkable: true,
		walkable: sealedNorthEdge([24, 25, 26, 27]),
		objects: [
			object('audit-elevator', 'elev-g', 300, 400),
			object('audit-reception', 'reception-g', 600, 450),
			object('audit-sofa', 'sofa-g1', 900, 500),
			object('audit-sofa', 'sofa-g2', 1000, 500),
		],
	},
	{
		id: 'F1',
		name: 'Lounge Bar',
		label: 'F1',
		defaultWalkable: true,
		walkable: sealedNorthEdge([28, 29, 30, 31]),
		objects: [
			object('audit-elevator', 'elev-f1', 300, 400),
			object('audit-bar', 'bar-f1', 700, 450),
			object('audit-sofa', 'sofa-f1', 900, 550),
		],
	},
	{
		id: 'F2',
		name: 'Staff Area',
		label: 'F2',
		defaultWalkable: true,
		allowedRoleIds: ['role-concierge'],
		walkable: sealedNorthEdge([24, 25, 26]),
		objects: [
			object('audit-elevator', 'elev-f2', 300, 400),
			object('audit-staffdesk', 'staffdesk-f2', 600, 450),
		],
	},
]

const CONFIG = {
	speed: 0.15,
	defaultRoleId: 'role-guest',
	roles: [
		{ id: 'role-concierge', label: 'Concierge', color: '#b08d57', focusTags: ['front-desk'], restrictedTags: ['guest-area'], taskIds: [], focusChance: 100 },
		{ id: 'role-guest', label: 'Guest', color: '#8ecae6', focusTags: ['lounge', 'bar'], restrictedTags: ['back-of-house'], taskIds: [], focusChance: 60 },
	],
	tasks: [],
	pool: [],
} as unknown as NpcSimulationConfig

interface SpawnSpec {
	id: string
	roleId: string
	floorId: string
	x: number
	y: number
}

const SPAWNS: SpawnSpec[] = [
	{ id: 'concierge-1', roleId: 'role-concierge', floorId: 'G', x: 22, y: 16 },
	{ id: 'concierge-2', roleId: 'role-concierge', floorId: 'G', x: 26, y: 20 },
	{ id: 'concierge-3', roleId: 'role-concierge', floorId: 'G', x: 20, y: 20 },
	{ id: 'concierge-4', roleId: 'role-concierge', floorId: 'G', x: 18, y: 18 },
	{ id: 'guest-g1', roleId: 'role-guest', floorId: 'G', x: 32, y: 24 },
	{ id: 'guest-g2', roleId: 'role-guest', floorId: 'G', x: 36, y: 22 },
	{ id: 'guest-g3', roleId: 'role-guest', floorId: 'G', x: 40, y: 26 },
	{ id: 'guest-g4', roleId: 'role-guest', floorId: 'G', x: 28, y: 28 },
	{ id: 'guest-g5', roleId: 'role-guest', floorId: 'G', x: 44, y: 20 },
	{ id: 'guest-f1a', roleId: 'role-guest', floorId: 'F1', x: 30, y: 24 },
	{ id: 'guest-f1b', roleId: 'role-guest', floorId: 'F1', x: 34, y: 26 },
	{ id: 'guest-f1c', roleId: 'role-guest', floorId: 'F1', x: 38, y: 22 },
]

const built = buildNpcEngineLayout(FLOORS, CANVAS, getAssetDef, getAssetTags)

let tickNow = 0
let engine!: NpcEngine
const policy = createNpcEnginePolicy({
	getConfig: () => CONFIG,
	floors: built.layout.floors,
	floorMaps: built.floorMaps,
	floorDataMap: built.floorDataMap,
	ticksPerSecond: TPS,
	getTickNumber: () => tickNow,
	listAgents: () => engine.listAgents(),
	getAssetTags,
	random,
})

engine = new NpcEngine(built.layout, {
	ticksPerSecond: TPS,
	agentClearance: 0.5,
	random,
	...policy,
})

for (const spawn of SPAWNS) {
	engine.addAgent({ id: spawn.id, roleId: spawn.roleId, floorId: spawn.floorId, x: spawn.x, y: spawn.y, targetX: spawn.x, targetY: spawn.y, speed: CONFIG.speed * TPS / TILE })
}

interface InteractionSpan {
	agentId: string
	itemId: string
	floorId: string
	startTick: number
	endTick: number
}

const openSpans = new Map<string, { itemId: string; floorId: string; startTick: number }>()
const spans: InteractionSpan[] = []
const transitions: Array<{ agentId: string; roleId: string; from: string; to: string; tick: number }> = []
const roleById = new Map(SPAWNS.map(spawn => [spawn.id, spawn.roleId]))

let overlapViolations = 0
let minPairDistance = Number.POSITIVE_INFINITY
let minTransitionDistance = Number.POSITIVE_INFINITY
let maxQueueDepth = 0
let guestOnStaffFloorSamples = 0
const standingTicksByGuest = new Map<string, number>()

for (tickNow = 1; tickNow <= RUN_TICKS; tickNow++) {
	engine.tick(1)
	for (const event of engine.drainEvents()) {
		if (event.type === 'interaction-start') {
			openSpans.set(event.agentId, { itemId: event.itemId ?? '', floorId: event.floorId, startTick: event.tick })
		} else if (event.type === 'interaction-end') {
			const open = openSpans.get(event.agentId)
			openSpans.delete(event.agentId)
			if (open) spans.push({ agentId: event.agentId, itemId: open.itemId, floorId: open.floorId, startTick: open.startTick, endTick: event.tick })
		} else if (event.type === 'floor-transition') {
			transitions.push({ agentId: event.agentId, roleId: roleById.get(event.agentId) ?? '', from: event.fromFloorId ?? '', to: event.toFloorId ?? '', tick: event.tick })
			const agent = engine.getAgent(event.agentId)
			if (agent) {
				for (const other of engine.listAgents()) {
					if (other.id === agent.id || other.floorId !== agent.floorId) continue
					minTransitionDistance = Math.min(minTransitionDistance, Math.hypot(other.x - agent.x, other.y - agent.y))
				}
			}
		}
	}

	const agents = engine.listAgents()
	for (let i = 0; i < agents.length; i++) {
		const a = agents[i]
		if (a.queueKey || a.queuePendingKey) {
			const queueId = a.queueKey ?? a.queuePendingKey
			let depth = 0
			for (const other of agents) if ((other.queueKey ?? other.queuePendingKey) === queueId) depth++
			maxQueueDepth = Math.max(maxQueueDepth, depth)
		}
		if (roleById.get(a.id) === 'role-guest') {
			if (a.floorId === 'F2') guestOnStaffFloorSamples++
			if (a.status === 'waiting' || a.status === 'idle') standingTicksByGuest.set(a.id, (standingTicksByGuest.get(a.id) ?? 0) + 1)
		}
		for (let j = i + 1; j < agents.length; j++) {
			const b = agents[j]
			if (a.floorId !== b.floorId) continue
			const distance = Math.hypot(a.x - b.x, a.y - b.y)
			minPairDistance = Math.min(minPairDistance, distance)
			if (distance < 0.45) overlapViolations++
		}
	}
}

const receptionSpans = spans.filter(span => span.itemId.includes('reception'))
const staffDeskSpans = spans.filter(span => span.itemId.includes('staffdesk'))
const seatSpans = spans.filter(span => span.itemId.includes('sofa') || span.itemId.includes('bar'))
const guestSeatSpans = seatSpans.filter(span => roleById.get(span.agentId) === 'role-guest')
const conciergeTransitions = transitions.filter(transition => transition.roleId === 'role-concierge')
const guestTransitions = transitions.filter(transition => transition.roleId === 'role-guest')
const guestToStaffArea = guestTransitions.filter(transition => transition.to === 'F2').length

const maxConfiguredSeconds = Math.max(...ASSETS.map(asset => (asset as { interact?: { durationMax?: number } }).interact?.durationMax ?? 0))
const dwellOk = spans.every(span => {
	const ticks = span.endTick - span.startTick
	return ticks >= 2 && ticks <= (maxConfiguredSeconds + 1) * TPS
})
const receptionDwells = receptionSpans.map(span => (span.endTick - span.startTick) / TPS)

assert.ok(receptionSpans.length >= 3, `staff must park at reception repeatedly (got ${receptionSpans.length})`)
assert.ok(dwellOk, 'all interaction dwells must stay within configured bounds')
assert.ok(staffDeskSpans.length >= 1, 'staff must commute to F2 and use the staff desk')
assert.ok(conciergeTransitions.some(transition => transition.to === 'F2'), 'staff must ride the elevator to F2 at least once')
assert.equal(guestToStaffArea, 0, 'guests must never enter F2')
assert.equal(guestOnStaffFloorSamples, 0, 'guests must never stand on F2')
assert.equal(overlapViolations, 0, 'agents must never overlap')
assert.ok(minTransitionDistance >= 0.45, `riders must exit before entering (min post-transition distance ${minTransitionDistance.toFixed(3)})`)
assert.ok(guestSeatSpans.length >= 5, `guests must use lounge/bar seats (got ${guestSeatSpans.length})`)
assert.ok(maxQueueDepth >= 2, `queues must form under contention (max queue depth ${maxQueueDepth})`)

const standingRatios = [...standingTicksByGuest.entries()].map(([id, ticks]) => ({ id, ratio: ticks / RUN_TICKS }))
standingRatios.sort((a, b) => b.ratio - a.ratio)
const avgStanding = standingRatios.reduce((sum, entry) => sum + entry.ratio, 0) / Math.max(1, standingRatios.length)

console.log('STEP 1 BEHAVIOR AUDIT (3 floors, 3 concierges + 8 guests, 360s sim, seed 20260824)')
console.log('')
console.log('Check              Result')
console.log('Staff pathing      reception parks=' + receptionSpans.length + ', dwells(s)=' + receptionDwells.map(d => d.toFixed(1)).join('/') + ', F2 desk uses=' + staffDeskSpans.length + ', rides to F2=' + conciergeTransitions.filter(t => t.to === 'F2').length)
console.log('Guest roaming      lounge/bar sits=' + guestSeatSpans.length + ' across ' + new Set(guestSeatSpans.map(span => span.agentId)).size + ' guests, F2 intrusions=' + guestToStaffArea)
console.log('Elevator etiquette rides=' + transitions.length + ' (guests=' + guestTransitions.length + '), overlap violations=' + overlapViolations + ', min pair dist=' + minPairDistance.toFixed(3) + ', min post-ride dist=' + minTransitionDistance.toFixed(3) + ', max queue depth=' + maxQueueDepth)
console.log('Idle moments       avg standing ratio=' + (avgStanding * 100).toFixed(1) + '%, top: ' + standingRatios.slice(0, 3).map(entry => entry.id + '=' + (entry.ratio * 100).toFixed(1) + '%').join(', '))
console.log('')
console.log('Interaction mix by item:')
const mixByItem = new Map<string, number>()
for (const span of spans) mixByItem.set(span.itemId, (mixByItem.get(span.itemId) ?? 0) + 1)
for (const [itemId, count] of [...mixByItem.entries()].sort((a, b) => b[1] - a[1])) console.log('  ' + itemId + ': ' + count)
