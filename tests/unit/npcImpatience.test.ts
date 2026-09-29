import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_OPTIONS,
	findNpcGridPath,
	type NpcEngineFloor,
	type NpcEngineInteractionTarget,
	type NpcEngineQueue,
} from '../../src/engine/npc'

const counter: NpcEngineInteractionTarget = {
	floorId: 'F1',
	itemId: 'object:desk',
	interactSpotId: 'object:desk:0',
	x: 5,
	y: 5,
	tags: ['front-desk'],
	capacity: 1,
	durationMinSeconds: 600,
	durationMaxSeconds: 600,
}
const deskQueue: NpcEngineQueue = {
	key: 'F1:queue:desk',
	targetKeys: ['F1:object:desk:object:desk:0'],
	slots: [{ x: 5, y: 6 }],
	admissionPoints: [{ x: 5, y: 7 }],
	maxMembers: 1,
}
const floor: NpcEngineFloor = {
	id: 'F1',
	width: 12,
	height: 12,
	tileSize: 1,
	walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
}

function patienceEngine(): NpcEngine {
	return new NpcEngine({ floors: [floor], interactionTargets: [counter], queues: [deskQueue] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		queuePatienceSeconds: 0.5,
		random: () => 0,
		pathfinder: (f, from, to, blocked) => findNpcGridPath(f, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		queueSelector: (_agent, _targets, _available, queues) => queues[0] ?? null,
		wanderSelector: () => null,
	})
}

test('running out of patience emits the walk-out event nobody could see before', () => {
	const engine = patienceEngine()
	// Both agents want the one counter; whichever gets it first holds it for the whole run, so
	// the other one has to queue. The reservation has to be earned through the engine, because
	// hand-setting reservation fields never registers it in the engine's own maps.
	engine.addAgent({ id: 'holder', roleId: 'role-receptionist', floorId: 'F1', x: 5, y: 5, targetX: 5, targetY: 5, speed: 30, status: 'idle' })
	engine.addAgent({ id: 'waiter', roleId: 'role-guest', floorId: 'F1', x: 5, y: 10, targetX: 5, targetY: 10, speed: 30, status: 'idle' })

	let joined = false
	for (let tick = 0; tick < 1200 && !joined; tick++) {
		engine.tick(1)
		joined = engine.getAgent('waiter')?.queueKey === deskQueue.key
	}
	assert.ok(joined, `the waiter must join the line (holder status ${engine.getAgent('holder')?.status}) before patience can run out`)

	const reasons: string[] = []
	for (let tick = 0; tick < 240; tick++) {
		engine.tick(1)
		for (const event of engine.drainEvents()) {
			if (event.agentId !== 'waiter') continue
			reasons.push(`${event.type}:${event.reason ?? ''}`)
		}
	}
	assert.ok(reasons.includes('waiting:impatient'), `expected a waiting:impatient event, got ${JSON.stringify(reasons)}`)
	assert.equal(engine.getAgent('waiter')?.queueKey, null, 'the walk-out must actually leave the line')
})
