import { test } from 'vitest'
import assert from 'node:assert/strict'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS } from '../../src/engine/npc'
import { createNpcEnginePolicy } from '../../src/engine/npc/policy'
import { queueLineCapacity } from '../../src/engine/npc/queueBuild'
import { deriveFloorRooms } from '../../src/engine/npc/rooms'
import { hotelModel } from './hotelFixture'
import type { NpcEngineQueue, NpcWalkableMap } from '../../src/engine/npc'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const TILE = 25

function line(maxMembers: number, slots: number): NpcEngineQueue {
	return {
		key: 'F1:queue:desk',
		targetKeys: ['F1:object:desk:spot-0'],
		slots: Array.from({ length: slots }, (_, i) => ({ x: i, y: 0 })),
		admissionPoints: [],
		maxMembers,
	}
}

test('a guest never takes a staffed duty post', () => {
	// Behavioural, not selector-level: called through the policy by hand the guest is refused by an
	// earlier reachability check, so the post filter itself was never the thing under test.
	const desk: AssetDef = {
		id: 'front-desk-1',
		name: 'Front Desk',
		w: 2,
		h: 1,
		walkable: false,
		tags: ['front-desk'],
		interactSpots: [{ kind: 'stand', x: 12.5, y: 12.5, post: 'reception-station' }],
	}
	const model = hotelModel(
		{
			canvas: { width: TILE * 10, height: TILE * 10, tileSize: TILE },
			floors: [{ id: 'F1', name: 'Lobby', label: 'F1', defaultWalkable: true, objects: [{ id: 'desk-1', type: desk.id, x: TILE * 4, y: TILE * 3, w: 2, h: 1, rotation: 0 }] }],
		},
		[desk],
	)
	assert.ok(model.built.layout.interactionTargets.some(t => t.tags.some(tag => tag.startsWith('post:'))), 'the fixture must produce a duty post')
	const config = {
		speed: 0.2,
		defaultRoleId: 'role-guest',
		roles: [{ id: 'role-guest', label: 'Guest', color: '#3794ff', focusTags: ['front-desk'], restrictedTags: [], taskIds: [], focusChance: 100 }],
		tasks: [],
		pool: [{ roleId: 'role-guest', count: 1 }],
	} as unknown as NpcSimulationConfig
	let engine: NpcEngine
	const policy = createNpcEnginePolicy({
		getConfig: () => config,
		floors: model.built.layout.floors,
		floorMaps: model.built.floorMaps,
		floorDataMap: model.built.floorDataMap,
		interactionTargets: model.built.layout.interactionTargets,
		ticksPerSecond: 10,
		getTickNumber: () => engine.tickNumber,
		listAgents: () => engine.listAgents(),
		getAssetTags: (type: string) => model.assetMap.get(type)?.tags,
		random: () => 0,
	})
	engine = new NpcEngine(model.built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 10,
		random: () => 0,
		...policy,
	})
	const cells = [...(model.built.floorMaps.get('F1')?.tiles ?? [])]
	assert.ok(cells.length > 0, 'the fixture floor must be walkable somewhere')
	const [sx, sy] = cells[0].split(',').map(Number)
	engine.addAgent({ id: 'guest-1', roleId: 'role-guest', floorId: 'F1', x: sx, y: sy, targetX: sx, targetY: sy, speed: 20 })
	for (let tick = 0; tick < 600; tick++) engine.tick(1)
	const starts = engine.drainEvents().filter(event => event.type === 'interaction-start')
	assert.deepEqual(starts, [], 'a guest that only sees staffed posts must wait, not stand on the desk')
})

test('a facility serves only its declared capacity, even when it has more spots', () => {
	// capacity below the spot count is the only arrangement where the capacity rule is the thing
	// deciding: with capacity equal to the spots, one-agent-per-spot already caps it.
	const bar: AssetDef = {
		id: 'snack-bar',
		name: 'Snack Bar',
		w: 2,
		h: 1,
		walkable: false,
		tags: ['bar'],
		interactSpots: [{ kind: 'stand', x: 8, y: 12 }, { kind: 'stand', x: 25, y: 12 }, { kind: 'stand', x: 42, y: 12 }],
		interact: { capacity: 2, durationMin: 5, durationMax: 5 },
	}
	const model = hotelModel(
		{
			canvas: { width: TILE * 10, height: TILE * 10, tileSize: TILE },
			floors: [{ id: 'F1', name: 'Lobby', label: 'F1', defaultWalkable: true, objects: [{ id: 'bar-1', type: bar.id, x: TILE * 4, y: TILE * 3, w: 2, h: 1, rotation: 0 }] }],
		},
		[bar],
	)
	const config = {
		speed: 0.2,
		defaultRoleId: 'role-guest',
		roles: [{ id: 'role-guest', label: 'Guest', color: '#3794ff', focusTags: ['bar'], restrictedTags: [], taskIds: [], focusChance: 100 }],
		tasks: [],
		pool: [{ roleId: 'role-guest', count: 6 }],
	} as unknown as NpcSimulationConfig
	let engine: NpcEngine
	const policy = createNpcEnginePolicy({
		getConfig: () => config,
		floors: model.built.layout.floors,
		floorMaps: model.built.floorMaps,
		floorDataMap: model.built.floorDataMap,
		interactionTargets: model.built.layout.interactionTargets,
		ticksPerSecond: 10,
		getTickNumber: () => engine.tickNumber,
		listAgents: () => engine.listAgents(),
		getAssetTags: (type: string) => model.assetMap.get(type)?.tags,
		random: () => 0,
	})
	engine = new NpcEngine(model.built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 10,
		random: () => 0,
		...policy,
	})
	const cells = [...(model.built.floorMaps.get('F1')?.tiles ?? [])]
	// Start them on the near side so all three reach the counter inside the run: a fixture where
	// only two guests arrive passes with the capacity rule removed, which is how this test first
	// fooled the gate.
	// Six heads for two places: a crowd big enough that some instant always has more claimants than
	// the fixture may serve. Three was enough when a served guest went straight back to the counter;
	// with an urge that is settled by the visit, they walk away and the third claimant never arrives.
	for (let i = 0; i < 6; i++) {
		const [x, y] = cells[(i * 3) % cells.length].split(',').map(Number)
		engine.addAgent({ id: `g${i}`, roleId: 'role-guest', floorId: 'F1', x, y, targetX: x, targetY: y, speed: 40 })
	}
	let holdersAtOnce = 0
	// Long enough that all three arrive *after* their thirst bites, not just after spawn: a run that
	// ends before the third head reaches the counter passes with the capacity rule removed.
	for (let tick = 0; tick < 4000; tick++) {
		engine.tick(1)
		holdersAtOnce = Math.max(holdersAtOnce, engine.listAgents().filter(agent => agent.reservationItemId === 'object:bar-1').length)
	}
	assert.equal(holdersAtOnce, 2, `expected two of the three guests to hold the two-place bar, saw ${holdersAtOnce}`)
})

test('a queue line holds the smaller of what it declares and what it physically has', () => {
	assert.equal(queueLineCapacity(line(9, 1)), 1, 'nine declared, one slot built: one stands')
	assert.equal(queueLineCapacity(line(2, 5)), 2, 'more floor than declaration does not lengthen the line')
	assert.equal(queueLineCapacity(line(3, 3)), 3)
	assert.equal(queueLineCapacity(line(-1, 4)), 0, 'a negative declaration is no line at all')
	assert.equal(queueLineCapacity(line(4, 0)), 0, 'no slots, no queue')
})

function strip(tiles: string[], width: number, height: number): NpcWalkableMap {
	return { tiles: new Set(tiles), width, height, cellSize: 25 }
}

test('a doorway is a seam, not a room of its own', () => {
	const fiveInARow = strip(['0,0', '1,0', '2,0', '3,0', '4,0'], 5, 1)
	const split = deriveFloorRooms(fiveInARow, new Set(['2,0']))
	assert.ok(split.has('0,0') && split.has('4,0'), 'both ends get a room')
	// The traversal never crosses a door cell, so the only thing the seed check decides is whether
	// the door tile itself is claimed as a room. That is the observable consequence, and the
	// assertion is on it - not on a room split that holds either way.
	assert.equal(split.has('2,0'), false, 'a door cell belongs to no room')
	assert.notEqual(split.get('1,0'), split.get('3,0'), 'the two sides stay separate rooms')

	const open = deriveFloorRooms(fiveInARow, new Set())
	assert.equal(open.get('0,0'), open.get('4,0'), 'with no door it is one hall')
})

test('a room seed never starts on an unwalkable cell', () => {
	const map = strip(['0,0', '1,0', '3,0'], 5, 1)
	const rooms = deriveFloorRooms(map, new Set())
	assert.ok(rooms.has('0,0') && rooms.has('1,0') && rooms.has('3,0'))
	assert.notEqual(rooms.get('1,0'), rooms.get('3,0'), 'a gap the agent cannot cross splits the room')
	assert.equal(rooms.has('2,0'), false, 'the cell that is not walkable belongs to no room')
})
