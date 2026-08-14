import assert from 'node:assert/strict'
import { NpcEngine, type NpcEngineQueue, type NpcEngineFloor } from '../src/engine/npc'
import { buildNpcQueues } from '../src/blueprint-editor/npcQueue'
import type { AssetDef, FloorData } from '../src/blueprint-editor/types'

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
	tileStates: [['walkable', 'walkable', 'blocked'], ['walkable', 'walkable', 'entrance'], ['walkable', 'walkable', 'entrance'], ['walkable', 'walkable', 'blocked']],
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
