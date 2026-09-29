import { test } from 'vitest'
import assert from 'node:assert/strict'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS, findNpcGridPath, interactionTargetKey } from '../../src/engine/npc'
import {
	createTakingsLedger,
	createTakingsResolver,
	TAKING_RATES_CENTS,
} from '../../src/blueprint-editor/domain/economy/takings'
import { hotelModel } from './hotelFixture'
import type { AssetDef } from '../../src/blueprint-editor/domain/types'

const TILE = 25
const TICKS_PER_SECOND = 10
const GUEST = 'role-guest'
const BARTENDER = 'role-bartender'

function barAsset(id: string, tags: string[]): AssetDef {
	return {
		id,
		name: id,
		w: 2,
		h: 1,
		tags,
		interactSpots: [{ x: 12.5, y: 37.5 }],
		interact: { capacity: 1, durationMin: 1, durationMax: 1 },
	}
}

function lobby(asset: AssetDef) {
	return hotelModel(
		{
			canvas: { width: TILE * 10, height: TILE * 10, tileSize: TILE },
			floors: [
				{
					id: 'F1',
					name: 'Lobby',
					label: 'F1',
					defaultWalkable: true,
					objects: [{ id: 'fixture', type: asset.id, x: TILE * 4, y: TILE * 2, w: 2, h: 1, rotation: 0 }],
				},
			],
		},
		[asset],
	)
}

/** The same two lookups the running app supplies: engine for the role, built layout for the tags. */
function run(model: ReturnType<typeof lobby>, roles: Record<string, string>, ticks: number) {
	const visitorRoleIds = new Set(Object.entries(roles).filter(([, role]) => role === GUEST).map(([id]) => id))
	const ledger = createTakingsLedger({
		ticksPerSecond: TICKS_PER_SECOND,
		isVisitor: roleId => visitorRoleIds.has(roleId),
	})
	const tagsByKey = new Map(model.built.layout.interactionTargets.map(target => [interactionTargetKey(target), target.tags]))
	const engine = new NpcEngine(model.built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: TICKS_PER_SECOND,
		random: () => 0,
		pathfinder: findNpcGridPath,
		targetSelector: (_agent, targets) => targets[0] ?? null,
		wanderSelector: () => null,
	})
	const resolver = createTakingsResolver({
		roleOf: agentId => engine.getAgent(agentId)?.roleId,
		tagsFor: (floorId, itemId, interactSpotId) => tagsByKey.get(interactionTargetKey({ floorId, itemId, interactSpotId })),
	})
	let nextId = 0
	for (const roleId of Object.keys(roles)) {
		const cell = model.built.layout.floors[0].walkable[nextId++]
		if (!cell) break
		engine.addAgent({ id: roleId, roleId, floorId: 'F1', x: cell.x, y: cell.y, targetX: cell.x, targetY: cell.y, speed: 1 })
	}
	for (let tick = 0; tick < ticks; tick++) {
		engine.tick(1)
		ledger.ingest(engine.drainEvents(), engine.tickNumber, resolver)
	}
	return ledger.snapshot()
}

test('a guest served at a tagged facility keeps paying through the real engine', () => {
	const model = lobby(barAsset('bar-counter', ['bar']))
	assert.ok(model.built.layout.interactionTargets.length > 0, 'the fixture must build an interaction target')
	const snapshot = run(model, { 'npc-guest': GUEST }, 400)
	// One agent, one facility, repeatedly served: that recurrence is the idle income loop.
	assert.ok(snapshot.served > 1, `expected repeat service, got ${snapshot.served} completed interactions`)
	assert.equal(snapshot.bankCents, snapshot.served * TAKING_RATES_CENTS.bar)
	assert.deepEqual(snapshot.byTag, [{ tag: 'bar', cents: snapshot.bankCents, count: snapshot.served }])
})

test('a staff member working the same facility earns nothing', () => {
	const model = lobby(barAsset('bar-counter', ['bar']))
	assert.equal(run(model, { 'npc-staff': BARTENDER }, 400).bankCents, 0)
})

test('the same plan with a free tag on the fixture earns nothing', () => {
	const model = lobby(barAsset('lounge-sofa', ['lounge']))
	const snapshot = run(model, { 'npc-guest': GUEST }, 400)
	assert.ok(snapshot.simSeconds > 0, 'the run must advance simulation time')
	assert.equal(snapshot.bankCents, 0)
	assert.equal(snapshot.served, 0)
})
