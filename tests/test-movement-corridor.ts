import assert from 'node:assert/strict'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS, findNpcGridPath, type NpcEngineFloor, type NpcEngineInteractionTarget } from '../src/engine/npc'

// Movement-corridor regression suite: guards the cell-reservation lifecycle.
// The invariant: no two agents may ever share a floor cell at any tick
// boundary, and crossing traffic must complete (no deadlock).

interface CorridorResult { shared: number | null; aX: number; bX: number; ticks: number; aStatus: string; bStatus: string }

function makeEngine(clearance: number, oneRow: boolean): NpcEngine {
	const floor: NpcEngineFloor = {
		id: 'F1',
		width: 12,
		height: 12,
		tileSize: 1,
		walkable: oneRow
			? Array.from({ length: 12 }, (_, x) => ({ x, y: 6 }))
			: [
					...Array.from({ length: 12 }, (_, x) => ({ x, y: 5 })),
					...Array.from({ length: 12 }, (_, x) => ({ x, y: 6 })),
				],
	}
	const targets: NpcEngineInteractionTarget[] = [
		{ floorId: 'F1', itemId: 'east', interactSpotId: 's', x: 9, y: 5, tags: [], durationMinSeconds: 1, durationMaxSeconds: 1 },
		{ floorId: 'F1', itemId: 'west', interactSpotId: 's', x: 1, y: 5, tags: [], durationMinSeconds: 1, durationMaxSeconds: 1 },
	]
	return new NpcEngine(
		{ floors: [floor], interactionTargets: targets },
		{
			...NPC_ENGINE_DEFAULT_OPTIONS,
			ticksPerSecond: 4,
			agentClearance: clearance,
			random: () => 0.5,
			pathfinder: findNpcGridPath,
			targetSelector: (agent, available) => available.find(t => (agent.id === 'A') === (t.itemId === 'east')) ?? null,
			wanderSelector: () => null,
			queueSelector: () => null,
			crossFloorSelector: () => null,
			socialSelector: () => null,
		},
	)
}

function runCrossing(clearance: number, speed: number, oneRow = false): CorridorResult {
	const engine = makeEngine(clearance, oneRow)
	engine.addAgent({ id: 'A', roleId: 'g', floorId: 'F1', x: 1.5, y: 5.5, targetX: 1.5, targetY: 5.5, speed })
	engine.addAgent({ id: 'B', roleId: 'g', floorId: 'F1', x: 9.5, y: 5.5, targetX: 9.5, targetY: 5.5, speed })
	let shared: number | null = null
	let ticks = 0
	for (let t = 1; t <= 1500; t++) {
		ticks = t
		engine.tick(1)
		engine.drainEvents()
		const a = engine.getAgent('A')!
		const b = engine.getAgent('B')!
		if (Math.floor(a.x) === Math.floor(b.x) && Math.floor(a.y) === Math.floor(b.y)) { shared = t; break }
		if (a.status === 'interacting' && b.status === 'interacting') break
	}
	const a = engine.getAgent('A')!
	const b = engine.getAgent('B')!
	return { shared, aX: a.x, bX: b.x, ticks, aStatus: a.status, bStatus: b.status }
}

function runAdjacentSwap(clearance: number): CorridorResult {
	const engine = makeEngine(clearance, false)
	const mid = 4.5
	engine.addAgent({ id: 'A', roleId: 'g', floorId: 'F1', x: mid, y: 5.5, targetX: mid, targetY: 5.5, speed: 4 })
	engine.addAgent({ id: 'B', roleId: 'g', floorId: 'F1', x: mid + 1, y: 5.5, targetX: mid + 1, targetY: 5.5, speed: 4 })
	let shared: number | null = null
	let ticks = 0
	for (let t = 1; t <= 400; t++) {
		ticks = t
		engine.tick(1)
		engine.drainEvents()
		const a = engine.getAgent('A')!
		const b = engine.getAgent('B')!
		if (Math.floor(a.x) === Math.floor(b.x) && Math.floor(a.y) === Math.floor(b.y)) { shared = t; break }
		if (a.status === 'interacting' && b.status === 'interacting') break
	}
	const a = engine.getAgent('A')!
	const b = engine.getAgent('B')!
	return { shared, aX: a.x, bX: b.x, ticks, aStatus: a.status, bStatus: b.status }
}

// Case 1: slow crossing traffic (partial moves) - the reported mid-move window.
for (const clearance of [0.5, 1]) {
	const r = runCrossing(clearance, 2)
	console.log(`cross clearance=${clearance}: shared=${r.shared ?? 'none'} A.x=${r.aX.toFixed(2)} B.x=${r.bX.toFixed(2)} ticks=${r.ticks}`)
	assert.equal(r.shared, null, `clearance ${clearance}: crossing must never share a floor cell`)
	assert.ok(r.aX > 7.5 && r.bX < 3.5, `clearance ${clearance}: both must cross (A.x=${r.aX.toFixed(2)}, B.x=${r.bX.toFixed(2)})`)
}

// Case 2: adjacent fast swap - one-tick atomic exchange completes cleanly.
{
	const r = runAdjacentSwap(1)
	console.log(`fast swap: shared=${r.shared ?? 'none'} A.x=${r.aX.toFixed(2)} B.x=${r.bX.toFixed(2)} ticks=${r.ticks}`)
	assert.equal(r.shared, null, 'fast swap must not share a floor cell')
	assert.ok(r.aX > r.bX, `fast swap must exchange sides (A.x=${r.aX.toFixed(2)}, B.x=${r.bX.toFixed(2)})`)
}

// Case 3: dead-end 1-row corridor - head-on agents must stand (never
// co-occupy), run bounded, statuses sane (waiting/queued, not stuck walking).
{
	const r = runCrossing(0.5, 2, true)
	console.log(`dead-end: shared=${r.shared ?? 'none'} ticks=${r.ticks} A=${r.aStatus} B=${r.bStatus}`)
	assert.equal(r.shared, null, 'dead-end must never share a floor cell')
	assert.ok(r.ticks >= 1500, 'dead-end run must be bounded')
	assert.notEqual(r.aStatus, 'interacting', 'dead-end: A must not ghost through to its target')
	assert.notEqual(r.bStatus, 'interacting', 'dead-end: B must not ghost through to its target')
}

console.log('movement corridor checks passed')