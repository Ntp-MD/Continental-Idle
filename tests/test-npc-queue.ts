import assert from 'node:assert/strict'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS, findNpcGridPath, type NpcEngineAgent, type NpcEngineQueue, type NpcEngineFloor } from '../src/engine/npc'
import { buildNpcQueues } from '../src/engine/npc/queueBuild'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import type { AssetDef, FloorData } from '../src/blueprint-editor/domain/types'

const target = {
	floorId: 'F1',
	itemId: 'object:desk',
	interactSpotId: 'object:desk:0',
	x: 5,
	y: 5,
	tags: ['service'],
	capacity: 1,
	durationMinSeconds: 2,
	durationMaxSeconds: 2,
}
const queue: NpcEngineQueue = {
	key: 'F1:queue:desk',
	targetKeys: ['F1:object:desk:object:desk:0'],
	slots: [{ x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }],
	admissionPoints: [{ x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 }],
	maxMembers: 3,
}
const queueAsset: AssetDef = {
	id: 'asset-queue',
	name: 'Queue Asset',
	w: 3,
	h: 4,
	tileStates: [['walkable', 'walkable', 'walkable'], ['walkable', 'walkable', 'door'], ['walkable', 'walkable', 'door'], ['walkable', 'walkable', 'blocked']],
	interactSpots: [{ x: 62.5, y: 12.5 }, { x: 62.5, y: 12.5 }],
}
const queueFloorData: FloorData = {
	id: 'F1',
	name: 'Floor 1',
	label: 'F1',
	objects: [{ id: 'desk', type: queueAsset.id, x: 100, y: 100, w: 75, h: 100, rotation: 0 }],
}
const queueFloor: NpcEngineFloor = {
	id: 'F1',
	width: 12,
	height: 12,
	tileSize: 25,
	walkable: Array.from({ length: 12 * 12 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
}
const queueTargets = [
	{ ...target, itemId: 'object:desk', interactSpotId: 'object:desk:0' },
	{ ...target, itemId: 'object:desk', interactSpotId: 'object:desk:1' },
]
const builtQueues = buildNpcQueues(queueFloor, queueFloorData, 25, new Map([[queueAsset.id, queueAsset]]), queueTargets)
assert.equal(builtQueues.length, 1)
assert.equal(builtQueues[0].maxMembers, 3)
assert.deepEqual(builtQueues[0].slots, [{ x: 7, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 5 }])

const engine = new NpcEngine({
	floors: [{ id: 'F1', width: 12, height: 12, tileSize: 1, walkable: [] }],
	interactionTargets: [target],
	queues: [queue],
}, {
	...NPC_ENGINE_DEFAULT_OPTIONS,
	ticksPerSecond: 1,
	random: () => 0,
	pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
	targetSelector: (_agent, targets) => targets[0] ?? null,
	queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
	wanderSelector: () => ({ x: 10, y: 10 }),
})

const startPositions = [[0, 0], [4, 9], [5, 9], [6, 9], [0, 4]]
for (let i = 0; i < startPositions.length; i++) {
	const [x, y] = startPositions[i]
	engine.addAgent({ id: `npc-${i}`, floorId: 'F1', x, y, targetX: x, targetY: y, speed: 10 })
}
engine.tick()

const agents = new Map(engine.getAgents().map(agent => [agent.id, agent]))
assert.equal(agents.get('npc-0')?.status, 'interacting')
assert.equal(agents.get('npc-1')?.queueSlotIndex, 0)
assert.equal(agents.get('npc-2')?.queueSlotIndex, 1)
assert.equal(agents.get('npc-3')?.queueSlotIndex, 2)
assert.equal(agents.get('npc-4')?.status, 'walking')
assert.equal(agents.get('npc-4')?.reservationItemId, null)

engine.tick(2)
const afterRelease = new Map(engine.getAgents().map(agent => [agent.id, agent]))
assert.equal(afterRelease.get('npc-1')?.status, 'interacting')
assert.equal(afterRelease.get('npc-1')?.reservationInteractSpotId, 'object:desk:0')
assert.equal(afterRelease.get('npc-2')?.queueSlotIndex, 0)
assert.equal(afterRelease.get('npc-3')?.queueSlotIndex, 1)

console.log('NPC queue checks passed')

// Queue front holds its place while the target stays occupied (no line switching)
{
	const holdBed = { ...target, tags: ['rest'], durationMinSeconds: 100000, durationMaxSeconds: 100000 }
	const holdQueue: NpcEngineQueue = {
		key: 'F1:queue:hold',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 6 }, { x: 5, y: 7 }],
		admissionPoints: [{ x: 5, y: 9 }],
		maxMembers: 2,
	}
	const holdFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const holdEngine = new NpcEngine({ floors: [holdFloor], interactionTargets: [holdBed], queues: [holdQueue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 1,
		random: () => 0,
		pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => ({ x: 0, y: 11 }),
	})
	holdEngine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 10, status: 'idle' })
	holdEngine.addAgent({ id: 'waiter', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10, status: 'idle' })
	let joined = false
	let leftAfterJoin = false
	for (let i = 0; i < 30; i++) {
		holdEngine.tick(1)
		const waiter = holdEngine.getAgent('waiter')!
		if (waiter.queueKey) joined = true
		if (joined && !waiter.queueKey && waiter.status !== 'interacting') leftAfterJoin = true
	}
	assert.ok(joined, 'waiter joins the line')
	assert.equal(leftAfterJoin, false, 'front never abandons the line while target occupied')
}

// Transient doorway crowd: retry the same target without failure or blacklist
{
	const corridor: NpcEngineFloor = {
		id: 'F1', width: 6, height: 6, tileSize: 1,
		walkable: [0, 1, 2, 3, 4, 5].map(y => ({ x: 2, y })),
	}
	const farBed = {
		floorId: 'F1', itemId: 'bed', interactSpotId: 'bed:0',
		x: 2, y: 5, tags: [] as string[], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}
	const crowdEngine = new NpcEngine({ floors: [corridor], interactionTargets: [farBed] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: () => farBed,
		wanderSelector: () => null,
	})
	crowdEngine.addAgent({ id: 'camper', floorId: 'F1', x: 2, y: 3, targetX: 2, targetY: 3, speed: 1, status: 'idle' })
	crowdEngine.addAgent({ id: 'walker', floorId: 'F1', x: 2, y: 0, targetX: 2, targetY: 5, speed: 1, status: 'idle' })
	crowdEngine.tick(1500)
	const failures = crowdEngine.drainEvents().filter(e => e.type === 'repath-failed')
	assert.equal(failures.length, 0, 'transient crowd causes no repath failures')
}

console.log('NPC queue patience checks passed')

// Handoff: finished occupant yields the spot; the line advances instead of hogging it
{
	const handoffBed = { ...target, durationMinSeconds: 2, durationMaxSeconds: 2 }
	const handoffQueue: NpcEngineQueue = {
		key: 'F1:queue:handoff',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 8 }],
		admissionPoints: [{ x: 5, y: 9 }],
		maxMembers: 1,
	}
	const handoffFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const handoffEngine = new NpcEngine({ floors: [handoffFloor], interactionTargets: [handoffBed], queues: [handoffQueue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	handoffEngine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	handoffEngine.addAgent({ id: 'next', floorId: 'F1', x: 5, y: 10, targetX: 5, targetY: 10, speed: 30, status: 'idle' })
	let nextInteracted = false
	for (let i = 0; i < 600; i++) {
		handoffEngine.tick(1)
		if (handoffEngine.drainEvents().some(e => e.type === 'interaction-start' && e.agentId === 'next')) { nextInteracted = true; break }
	}
	assert.ok(nextInteracted, 'line advances: next agent interacts after handoff')
}

console.log('NPC queue handoff checks passed')

// Yield under repath cooldown must not eject a queue member (dynamic blocks while detouring)
{
	const hold2Bed = { ...target, durationMinSeconds: 100000, durationMaxSeconds: 100000 }
	const hold2Queue: NpcEngineQueue = {
		key: 'F1:queue:hold2',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 2 }],
		admissionPoints: [{ x: 5, y: 10 }],
		maxMembers: 1,
	}
	const hold2Floor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const hold2Engine = new NpcEngine({ floors: [hold2Floor], interactionTargets: [hold2Bed], queues: [hold2Queue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (agent, targets) => agent.id === 'm0' ? null : (targets[0] ?? null),
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	hold2Engine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 1, targetX: 5, targetY: 1, speed: 30, status: 'idle' })
	hold2Engine.addAgent({ id: 'm0', floorId: 'F1', x: 5, y: 11, targetX: 5, targetY: 11, speed: 30, status: 'idle' })
	let joined = false
	let ejected = false
	for (let i = 1; i <= 60; i++) {
		hold2Engine.tick(1)
		if (i === 6) hold2Engine.addAgent({ id: 'blockB1', floorId: 'F1', x: 5, y: 6, targetX: 5, targetY: 6, speed: 30, status: 'idle' })
		if (i === 14) hold2Engine.addAgent({ id: 'blockB2', floorId: 'F1', x: 5, y: 4, targetX: 5, targetY: 4, speed: 30, status: 'idle' })
		const member = hold2Engine.getAgent('m0')!
		if (member.queueKey) joined = true
		if (joined && !member.queueKey && member.status !== 'interacting') ejected = true
	}
	assert.ok(joined, 'member joins the line')
	assert.equal(ejected, false, 'cooldown yield never ejects a queue member')
}

console.log('NPC queue yield-hold checks passed')

// Standalone objects with an explicit queue config build queues without doors
{
	const looAsset: AssetDef = {
		id: 'asset-loo',
		name: 'Loo',
		w: 1,
		h: 1,
		interactSpots: [{ x: 12.5, y: 30 }],
		queue: { maxMembers: 3, admissionDepth: 4 },
	}
	const looFloorData: FloorData = {
		id: 'F1',
		name: 'Floor 1',
		label: 'F1',
		objects: [{ id: 'loo', type: looAsset.id, x: 100, y: 100, w: 25, h: 25, rotation: 0 }],
	}
	const looFloor: NpcEngineFloor = {
		id: 'F1',
		width: 12,
		height: 12,
		tileSize: 25,
		walkable: Array.from({ length: 12 * 12 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const looTargets = [{
		floorId: 'F1',
		itemId: 'object:loo',
		interactSpotId: 'object:loo:0',
		x: 4,
		y: 5,
		tags: ['plumbing'],
		capacity: 1,
		durationMinSeconds: 3,
		durationMaxSeconds: 8,
	}]
	const looQueues = buildNpcQueues(looFloor, looFloorData, 25, new Map([[looAsset.id, looAsset]]), looTargets)
	assert.ok(looQueues.length >= 1, 'doorless toilet with queue config builds queues')
	for (const built of looQueues) {
		assert.deepEqual(built.targetKeys, ['F1:object:loo:object:loo:0'])
		assert.ok(built.slots.length > 0 && built.slots.length <= 3, 'slots within maxMembers')
		for (const slot of built.slots) {
			assert.ok(slot.x >= 0 && slot.y >= 0 && slot.x < 12 && slot.y < 12, 'slot on floor')
			assert.ok(!(slot.x === 4 && slot.y === 5), 'slot never sits on the interact cell')
		}
		for (const point of built.admissionPoints) {
			assert.ok(point.x >= 0 && point.y >= 0 && point.x < 12 && point.y < 12, 'admission point on floor')
		}
	}

	const plainAsset: AssetDef = {
		id: 'asset-plain',
		name: 'Plain',
		w: 1,
		h: 1,
		interactSpots: [{ x: 12.5, y: 30 }],
	}
	const plainFloorData: FloorData = {
		id: 'F1',
		name: 'Floor 1',
		label: 'F1',
		objects: [{ id: 'plain', type: plainAsset.id, x: 100, y: 100, w: 25, h: 25, rotation: 0 }],
	}
	const plainTargets = [{
		floorId: 'F1',
		itemId: 'object:plain',
		interactSpotId: 'object:plain:0',
		x: 4,
		y: 5,
		tags: ['plumbing'],
		capacity: 1,
		durationMinSeconds: 3,
		durationMaxSeconds: 8,
	}]
	assert.equal(buildNpcQueues(looFloor, plainFloorData, 25, new Map([[plainAsset.id, plainAsset]]), plainTargets).length, 0, 'doorless object without queue config builds no queues')
}

console.log('NPC standalone queue checks passed')

// Busy queue guards its doorway: slots always guarded, admission guarded once the line is full
{
	const farTarget = {
		floorId: 'F1', itemId: 'far', interactSpotId: 'far:0',
		x: 5, y: 2, tags: [] as string[], capacity: 2, durationMinSeconds: 1, durationMaxSeconds: 1,
	}
	const guardQueue: NpcEngineQueue = {
		key: 'F1:queue:guard',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 6 }],
		admissionPoints: [{ x: 5, y: 7 }],
		maxMembers: 1,
	}
	const guardFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 12 * 12 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const guardEngine = new NpcEngine({ floors: [guardFloor], interactionTargets: [target, farTarget], queues: [guardQueue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (agent, targets) => agent.id === 'camper'
			? (targets.find(candidate => candidate.itemId === 'object:desk') ?? null)
			: agent.id === 'm'
				? null
				: (targets.find(candidate => candidate.itemId === 'far') ?? null),
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	guardEngine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 10, status: 'idle' })
	guardEngine.addAgent({ id: 'm', floorId: 'F1', x: 5, y: 8, targetX: 5, targetY: 8, speed: 30, status: 'idle' })
	guardEngine.addAgent({ id: 'walker', floorId: 'F1', x: 5, y: 10, targetX: 5, targetY: 10, speed: 10, status: 'idle' })
	guardEngine.tick(1)
	assert.equal(guardEngine.getAgent('camper')?.status, 'interacting', 'camper occupies the guarded target')
	guardEngine.tick(30)
	assert.ok(guardEngine.getAgent('m')?.queueKey === guardQueue.key, 'joiner reaches admission while the line has space')
	const walker = guardEngine.getAgent('walker')!
	assert.equal(walker.status, 'walking', 'outsider still paths to its own target')
	for (const point of walker.path) {
		const cell = `${Math.floor(point.x)},${Math.floor(point.y)}`
		assert.ok(cell !== '5,6' && cell !== '5,7', 'outsider routes around the guarded doorway once the line is full')
	}
	guardEngine.removeAgent('camper')
	guardEngine.removeAgent('m')
	guardEngine.removeAgent('walker')
	guardEngine.addAgent({ id: 'walker2', floorId: 'F1', x: 5, y: 10, targetX: 5, targetY: 10, speed: 10, status: 'idle' })
	guardEngine.tick(1)
	const walker2 = guardEngine.getAgent('walker2')!
	assert.equal(walker2.status, 'walking', 'second outsider paths after unlock')
	assert.ok(walker2.path.some(point => Math.floor(point.x) === 5 && Math.floor(point.y) === 6), 'doorway walkable again once interaction ends')
}

console.log('NPC doorway guard checks passed')

// Full queues are skipped: overflow goes to the nearest queue with space, never overfills
{
	const tiles = new Set<string>()
	for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) tiles.add(`${x},${y}`)
	const floorMap = { tiles, width: 12, height: 12, cellSize: 1 }
	const floorDataF1: FloorData = { id: 'F1', name: 'F1', label: 'F1', objects: [] }
	const engineFloorF1: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: [...tiles].map(cell => {
			const [x, y] = cell.split(',').map(Number)
			return { x, y }
		}),
	}
	const role = { id: 'guest', label: 'Guest', color: '#fff', focusTags: ['service'], restrictedTags: [], taskIds: [], focusChance: 100 }
	const cfg = {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		speed: 1, defaultRoleId: 'guest', roles: [role], tasks: [], pool: [],
		frameSimBudgetMs: 6, maxSimulationSteps: 8,
	}
	const mkAgent = (id: string, x: number, y: number, queueKey: string | null = null, queuePendingKey: string | null = null): NpcEngineAgent => ({
		id, floorId: 'F1', x, y, targetX: x, targetY: y, speed: 1, status: 'idle',
		path: [], pathIndex: 0, reservationItemId: null, reservationInteractSpotId: null,
		interactionRemainingTicks: 0, chatPartnerId: null, queueKey, queuePendingKey, queueSlotIndex: null,
		queueArrivalSequence: null, crossFloorCooldownUntil: 0,
	})
	const tA = {
		floorId: 'F1', itemId: 'object:a', interactSpotId: 'object:a:0',
		x: 2, y: 2, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}
	const tB = {
		floorId: 'F1', itemId: 'object:b', interactSpotId: 'object:b:0',
		x: 9, y: 9, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}
	const qA: NpcEngineQueue = {
		key: 'QA', targetKeys: ['F1:object:a:object:a:0'],
		slots: [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }],
		admissionPoints: [{ x: 2, y: 6 }], maxMembers: 3,
	}
	const qB: NpcEngineQueue = {
		key: 'QB', targetKeys: ['F1:object:b:object:b:0'],
		slots: [{ x: 9, y: 8 }, { x: 9, y: 7 }, { x: 9, y: 6 }],
		admissionPoints: [{ x: 9, y: 5 }], maxMembers: 3,
	}
	let agents: NpcEngineAgent[] = [mkAgent('m1', 2, 3, 'QA'), mkAgent('m2', 2, 4, 'QA'), mkAgent('m3', 2, 5, 'QA')]
	const policy = createNpcEnginePolicy({
		getConfig: () => cfg,
		floors: [engineFloorF1],
		floorMaps: new Map([['F1', floorMap]]),
		floorDataMap: new Map([['F1', floorDataF1]]),
		ticksPerSecond: 60,
		getTickNumber: () => 0,
		listAgents: () => agents,
		random: () => 0,
	})
	const seeker = mkAgent('seeker', 2, 6)
	assert.equal(policy.queueSelector(seeker, [tA, tB], [], [qA, qB])?.key, 'QB', 'full nearest queue skipped for queue with space')
	agents = [...agents, mkAgent('n1', 9, 8, 'QB'), mkAgent('n2', 9, 7, 'QB'), mkAgent('n3', 9, 6, 'QB')]
	assert.equal(policy.queueSelector(seeker, [tA, tB], [], [qA, qB]), null, 'all queues full returns null instead of overfilling')
}

console.log('NPC queue overflow checks passed')

// FIFO: the line advances in join order, never LIFO or random
{
	const fifoBed = { ...target, durationMinSeconds: 2, durationMaxSeconds: 2 }
	const fifoQueue: NpcEngineQueue = {
		key: 'F1:queue:fifo',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 8 }, { x: 5, y: 9 }],
		admissionPoints: [{ x: 5, y: 10 }],
		maxMembers: 2,
	}
	const fifoFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const fifoEngine = new NpcEngine({ floors: [fifoFloor], interactionTargets: [fifoBed], queues: [fifoQueue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	fifoEngine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	fifoEngine.addAgent({ id: 'first', floorId: 'F1', x: 5, y: 11, targetX: 5, targetY: 11, speed: 30, status: 'idle' })
	for (let i = 0; i < 60 && !fifoEngine.getAgent('first')?.queueKey; i++) fifoEngine.tick(1)
	assert.ok(fifoEngine.getAgent('first')?.queueKey, 'first joins the line first')
	fifoEngine.addAgent({ id: 'second', floorId: 'F1', x: 0, y: 11, targetX: 0, targetY: 11, speed: 30, status: 'idle' })
	const starts: string[] = []
	for (let i = 0; i < 900 && !(starts.includes('first') && starts.includes('second')); i++) {
		fifoEngine.tick(1)
		for (const e of fifoEngine.drainEvents()) {
			if (e.type === 'interaction-start') starts.push(e.agentId)
		}
	}
	assert.ok(starts.includes('first') && starts.includes('second'), 'both waiters get served')
	assert.ok(starts.indexOf('first') < starts.indexOf('second'), 'line advances in join order (FIFO)')
}

console.log('NPC queue FIFO checks passed')

// Free target is taken directly: no queue detour when nothing is busy
{
	const freeBed = { ...target, durationMinSeconds: 2, durationMaxSeconds: 2 }
	const freeFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const freeEngine = new NpcEngine({ floors: [freeFloor], interactionTargets: [freeBed], queues: [queue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	freeEngine.addAgent({ id: 'solo', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 30, status: 'idle' })
	freeEngine.tick(1)
	const solo = freeEngine.getAgent('solo')!
	assert.equal(solo.queueKey, null, 'no queue join when target is free')
	assert.equal(solo.queuePendingKey, null, 'no queue approach when target is free')
	assert.equal(solo.reservationItemId, 'object:desk', 'free target reserved directly')
}

console.log('NPC free-target checks passed')

// Capacity 1 + single spot: never two occupants at once, nobody starves
{
	const singleBed = { ...target, durationMinSeconds: 5, durationMaxSeconds: 5 }
	const singleFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const singleEngine = new NpcEngine({ floors: [singleFloor], interactionTargets: [singleBed] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		wanderSelector: () => null,
	})
	singleEngine.addAgent({ id: 'a', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	singleEngine.addAgent({ id: 'b', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 30, status: 'idle' })
	let concurrent = 0
	let maxConcurrent = 0
	const served = new Set<string>()
	for (let i = 0; i < 1200 && served.size < 2; i++) {
		singleEngine.tick(1)
		for (const e of singleEngine.drainEvents()) {
			if (e.type === 'interaction-start') { concurrent++; served.add(e.agentId) }
			if (e.type === 'interaction-end') concurrent--
		}
		maxConcurrent = Math.max(maxConcurrent, concurrent)
	}
	assert.equal(maxConcurrent, 1, 'capacity-1 spot never double-occupies')
	assert.equal(served.size, 2, 'both agents get served, nobody starves')
}

console.log('NPC single-occupancy checks passed')

// Patience: a stuck line is abandoned for the next-nearest line instead of waiting forever
{
	const longBed = { ...target, durationMinSeconds: 100000, durationMaxSeconds: 100000 }
	const longFar = {
		floorId: 'F1', itemId: 'far', interactSpotId: 'far:0',
		x: 9, y: 9, tags: [] as string[], capacity: 1, durationMinSeconds: 100000, durationMaxSeconds: 100000,
	}
	const patienceQueue: NpcEngineQueue = {
		key: 'F1:queue:patience',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 6 }, { x: 5, y: 7 }],
		admissionPoints: [{ x: 5, y: 8 }],
		maxMembers: 2,
	}
	const patienceQueueB: NpcEngineQueue = {
		key: 'F1:queue:patience-b',
		targetKeys: ['F1:far:far:0'],
		slots: [{ x: 9, y: 8 }],
		admissionPoints: [{ x: 9, y: 7 }],
		maxMembers: 1,
	}
	const patienceFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const patienceEngine = new NpcEngine({ floors: [patienceFloor], interactionTargets: [longBed, longFar], queues: [patienceQueue, patienceQueueB] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		queuePatienceSeconds: 0.5,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (agent, targets) => agent.id === 'm'
			? null
			: (targets.find(candidate => candidate.itemId === 'object:desk') ?? targets.find(candidate => candidate.itemId === 'far') ?? null),
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	patienceEngine.addAgent({ id: 'camperA', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	patienceEngine.addAgent({ id: 'camperB', floorId: 'F1', x: 9, y: 9, targetX: 9, targetY: 9, speed: 30, status: 'idle' })
	patienceEngine.addAgent({ id: 'm', floorId: 'F1', x: 2, y: 8, targetX: 2, targetY: 8, speed: 30, status: 'idle' })
	for (let i = 0; i < 60 && !patienceEngine.getAgent('m')?.queueKey; i++) patienceEngine.tick(1)
	assert.equal(patienceEngine.getAgent('m')?.queueKey, patienceQueue.key, 'waiter joins the busy line')
	patienceEngine.removeAgent('camperB')
	patienceEngine.tick(5)
	assert.equal(patienceEngine.getAgent('m')?.queueKey, patienceQueue.key, 'waiter holds the line inside patience')
	let moved = false
	for (let i = 0; i < 600 && !moved; i++) {
		patienceEngine.tick(1)
		const m = patienceEngine.getAgent('m')!
		if (m.queueKey === patienceQueueB.key || (m.queueKey === null && m.reservationItemId === 'far')) moved = true
	}
	assert.ok(moved, 'waiter abandons the stuck line for the next-nearest line')
	assert.equal(patienceEngine.getAgent('camperA')?.status, 'interacting', 'original occupant undisturbed')
}

console.log('NPC queue patience-timeout checks passed')

// Lifecycle: per-agent engine maps are released with the agent and cleared on reset
{
	const lifeFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const lifeEngine = new NpcEngine({ floors: [lifeFloor], interactionTargets: [target] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 1,
		random: () => 0,
		pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		targetSelector: (_agent, targets) => targets[0] ?? null,
		wanderSelector: () => null,
	})
	lifeEngine.addAgent({ id: 'x', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	lifeEngine.addAgent({ id: 'y', floorId: 'F1', x: 1, y: 1, targetX: 1, targetY: 1, speed: 10 })
	const internals = lifeEngine as unknown as { lastChooseTargetTick: Map<string, number> }
	assert.equal(internals.lastChooseTargetTick.size, 2, 'decision spread tracked per agent')
	lifeEngine.removeAgent('x')
	assert.equal(internals.lastChooseTargetTick.size, 1, 'agent removal releases decision state')
	lifeEngine.reset()
	assert.equal(internals.lastChooseTargetTick.size, 0, 'reset clears decision state')
}

console.log('NPC engine lifecycle checks passed')

// Waiting events carry reasons: line joins and occupied-spot bounces are distinguishable
{
	const reasonFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const spotEngine = new NpcEngine({ floors: [reasonFloor], interactionTargets: [target] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (agent, targets) => agent.id === 'sitter' ? null : (targets[0] ?? null),
		wanderSelector: () => null,
	})
	spotEngine.addAgent({ id: 'sitter', floorId: 'F1', x: 4.6, y: 5, targetX: 4.6, targetY: 5, speed: 10, status: 'idle' })
	spotEngine.addAgent({ id: 'walker', floorId: 'F1', x: 5, y: 6, targetX: 5, targetY: 6, speed: 30, status: 'idle' })
	let wanderReason = false
	for (let i = 0; i < 10 && !wanderReason; i++) {
		spotEngine.tick(1)
		for (const e of spotEngine.drainEvents()) {
			if (e.type === 'waiting' && e.reason === 'no-wander') wanderReason = true
		}
	}
	assert.ok(wanderReason, 'idle wait without options emits no-wander')

	const lineEngine = new NpcEngine({ floors: [reasonFloor], interactionTargets: [target], queues: [queue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	lineEngine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	lineEngine.addAgent({ id: 'joiner', floorId: 'F1', x: 5, y: 10, targetX: 5, targetY: 10, speed: 30, status: 'idle' })
	let queuedReason = false
	for (let i = 0; i < 300 && !queuedReason; i++) {
		lineEngine.tick(1)
		for (const e of lineEngine.drainEvents()) {
			if (e.type === 'waiting' && e.reason === 'queued') queuedReason = true
		}
	}
	assert.ok(queuedReason, 'line join emits queued')
}

console.log('NPC waiting-reason checks passed')

// Admit race: arrival at a just-filled line backs off instead of re-approaching
{
	const raceBed = { ...target, durationMinSeconds: 100000, durationMaxSeconds: 100000 }
	const raceQueue: NpcEngineQueue = {
		key: 'F1:queue:race',
		targetKeys: ['F1:object:desk:object:desk:0'],
		slots: [{ x: 5, y: 6 }],
		admissionPoints: [{ x: 5, y: 9 }],
		maxMembers: 1,
	}
	const raceFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const raceEngine = new NpcEngine({ floors: [raceFloor], interactionTargets: [raceBed], queues: [raceQueue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
	raceEngine.addAgent({ id: 'camper', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	raceEngine.addAgent({ id: 'first', floorId: 'F1', x: 5, y: 9, targetX: 5, targetY: 9, speed: 30, status: 'idle' })
	raceEngine.addAgent({ id: 'late', floorId: 'F1', x: 5, y: 10, targetX: 5, targetY: 10, speed: 10, status: 'idle' })
	for (let i = 0; i < 30; i++) raceEngine.tick(1)
	assert.equal(raceEngine.getAgent('first')?.queueKey, raceQueue.key, 'firstcomer holds the only slot')
	const late = raceEngine.getAgent('late')!
	assert.equal(late.queueKey, null, 'latecomer never joins the full line')
	assert.equal(late.queuePendingKey, null, 'latecomer stops approaching the full line')
	assert.equal(late.status, 'waiting', 'latecomer backs off instead of thrashing')
	for (let i = 0; i < 120; i++) raceEngine.tick(1)
	const lateAfter = raceEngine.getAgent('late')!
	assert.equal(lateAfter.queuePendingKey, null, 'no re-approach while the line stays full')
	assert.ok(lateAfter.status === 'waiting' || lateAfter.status === 'idle', 'latecomer waits out the occupation')
}

console.log('NPC admit-race checks passed')

// Fuzz: random join/leave/remove churn never breaks line invariants
{
	function mulberry32(seed: number): () => number {
		let a = seed
		return () => {
			a |= 0
			a = (a + 0x6D2B79F5) | 0
			let t = a
			t = Math.imul(t ^ (t >>> 15), t | 1)
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296
		}
	}
	const fuzzBedA = { ...target, itemId: 'object:deskA', interactSpotId: 'object:deskA:0', x: 3, y: 3, durationMinSeconds: 1, durationMaxSeconds: 2 }
	const fuzzBedB = { ...target, itemId: 'object:deskB', interactSpotId: 'object:deskB:0', x: 8, y: 8, durationMinSeconds: 1, durationMaxSeconds: 2 }
	const fuzzQueueA: NpcEngineQueue = {
		key: 'F1:queue:fuzzA',
		targetKeys: ['F1:object:deskA:object:deskA:0'],
		slots: [{ x: 3, y: 4 }, { x: 3, y: 5 }],
		admissionPoints: [{ x: 3, y: 6 }],
		maxMembers: 2,
	}
	const fuzzQueueB: NpcEngineQueue = {
		key: 'F1:queue:fuzzB',
		targetKeys: ['F1:object:deskB:object:deskB:0'],
		slots: [{ x: 8, y: 7 }],
		admissionPoints: [{ x: 8, y: 6 }],
		maxMembers: 1,
	}
	const fuzzFloor: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
	const fuzzEngine = new NpcEngine({ floors: [fuzzFloor], interactionTargets: [fuzzBedA, fuzzBedB], queues: [fuzzQueueA, fuzzQueueB] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 10,
		queuePatienceSeconds: 2,
		random: mulberry32(1234),
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => ({ x: 0, y: 0 }),
	})
	const rand = mulberry32(987)
	let nextId = 0
	const live: string[] = []
	function checkInvariants(round: number): void {
		for (const q of [fuzzQueueA, fuzzQueueB]) {
			const members = fuzzEngine.listAgents().filter(a => a.queueKey === q.key)
			const cap = Math.min(q.maxMembers, q.slots.length)
			assert.ok(members.length <= cap, `round ${round}: line ${q.key} within capacity`)
			const slots = members.map(a => a.queueSlotIndex)
			assert.equal(new Set(slots).size, slots.length, `round ${round}: slot indexes unique on ${q.key}`)
			for (const s of slots) assert.ok(s !== null && s !== undefined && s >= 0 && s < q.slots.length, `round ${round}: slot index in range on ${q.key}`)
			const seqs = members.map(a => a.queueArrivalSequence)
			assert.equal(new Set(seqs).size, seqs.length, `round ${round}: arrival sequences unique on ${q.key}`)
		}
		const pending = fuzzEngine.listAgents().filter(a => a.queuePendingKey !== null && a.queuePendingKey !== undefined)
		for (const p of pending) assert.ok(p.status === 'walking', `round ${round}: pending agent walks to admission`)
	}
	for (let round = 0; round < 60; round++) {
		const roll = rand()
		if ((roll < 0.45 && live.length < 8) || live.length === 0) {
			const id = `f-${nextId++}`
			fuzzEngine.addAgent({
				id, floorId: 'F1',
				x: Math.floor(rand() * 12), y: Math.floor(rand() * 12),
				targetX: 0, targetY: 0, speed: 5 + Math.floor(rand() * 30), status: 'idle',
			})
			live.push(id)
		} else if (roll < 0.65 && live.length > 0) {
			const victim = live.splice(Math.floor(rand() * live.length), 1)[0]
			assert.equal(fuzzEngine.removeAgent(victim), true, `round ${round}: removal reports success`)
		} else {
			fuzzEngine.tick(1 + Math.floor(rand() * 10))
		}
		checkInvariants(round)
	}
	fuzzEngine.tick(300)
	checkInvariants(999)
}

console.log('NPC queue fuzz checks passed')
