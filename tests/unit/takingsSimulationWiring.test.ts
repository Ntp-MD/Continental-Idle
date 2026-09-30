import { test } from 'vitest'
import assert from 'node:assert/strict'
import { useNpcSimulationCore } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import { TAKINGS_DAY_SECONDS, TAKING_RATES_CENTS } from '../../src/blueprint-editor/domain/economy/takings'
import { NPC_ENGINE_TICKS_PER_SECOND, type NpcEngineEvent } from '../../src/engine/npc'
import { FACTION_HOSTILE_BELOW, FACTION_RELATIONS_DEFAULT } from '../../src/blueprint-editor/domain/economy/standing-world'
import { hotelModel } from './hotelFixture'
import { frameDeadline, framesUntil } from './frameWaits'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const TILE = 25
const GUEST = 'role-guest'
const DAY_TICKS = TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND

const barCounter: AssetDef = {
	id: 'bar-counter',
	name: 'Bar counter',
	w: 2,
	h: 1,
	tags: ['bar'],
	interactSpots: [{ x: 12.5, y: 37.5 }],
	interact: { capacity: 1, durationMin: 1, durationMax: 1 },
}

const model = hotelModel(
	{
		canvas: { width: TILE * 10, height: TILE * 10, tileSize: TILE },
		floors: [
			{
				id: 'F1',
				name: 'Lobby',
				label: 'F1',
				defaultWalkable: true,
				objects: [{ id: 'bar-1', type: barCounter.id, x: TILE * 4, y: TILE * 2, w: 2, h: 1, rotation: 0 }],
			},
		],
	},
	[barCounter],
)

const config = {
	speed: 0.2,
	defaultRoleId: GUEST,
	roles: [
		{ id: GUEST, label: 'Guest', color: '#8ecae6', focusTags: ['bar'], restrictedTags: [], taskIds: [], focusChance: 100 },
	],
	tasks: [],
	pool: [{ roleId: GUEST, count: 3 }],
} as unknown as NpcSimulationConfig

test('footfall turns the deployed crowd into arrivals that come in the street door and leave', async () => {
	const tile = 25
	const cols = 20
	const rows = 20
	const states: ('door' | 'walkable')[][] = Array.from({ length: rows }, (_, r) =>
		Array.from({ length: cols }, (_, c) => ((r === 5 || r === 14) && c === 10 ? 'door' : 'walkable')),
	)
	const model = hotelModel(
		{
			canvas: { width: tile * cols, height: tile * rows, tileSize: tile },
			floors: [
				{
					id: 'F1',
					name: 'Lobby',
					label: 'F1',
					defaultWalkable: true,
					walkable: { tileStates: states },
					objects: [{ id: 'bar-1', type: barCounter.id, x: tile * 10, y: tile * 8, w: 2, h: 1, rotation: 0 }],
				},
			],
		},
		[barCounter],
	)
	const trafficConfig = {
		...config,
		pool: [{ roleId: GUEST, count: 600 }],
	} as unknown as NpcSimulationConfig

	const core = useNpcSimulationCore({
		getConfig: () => trafficConfig,
		getFloors: () => model.floors,
		getCanvas: () => ({ w: tile * cols, h: tile * rows, tileSize: tile, streetTiles: 5 }),
		getViewFloorId: () => 'F1',
		idPrefix: 'npc-traffic-test-',
		random: () => 0.5,
		getAssetDef: type => model.assetMap.get(type),
		getAssetTags: type => model.assetMap.get(type)?.tags,
	})

	core.ingestConfig(trafficConfig)
	core.simSpeed.value = 8
	core.deploy(model.floors, { w: tile * cols, h: tile * rows, tileSize: tile, streetTiles: 5 }, 'F1')
	try {
		// Deploying opens the street: this house has two doors and guests in its pool, so the player
		// does not have to press a second control to see the house run. The toggle stays for turning
		// it off again.
		assert.equal(core.trafficOn.value, true, 'deploying left the street shut on a house that can take guests')
		assert.ok(core.getTrafficSummary().entrances === 2, `expected 2 street doors, got ${core.getTrafficSummary().entrances}`)

		// The guest crowd the modal deployed is replaced by traffic, not stacked under it.
		// The dots, not `npcs`: the view list is refreshed on a 250 ms throttle, the dot map is the
		// immediate truth about who is still in the engine.
		assert.equal(core.frameDots.size, 0, 'the standing visitors should be gone the moment traffic starts')

		const waited = await framesUntil(() => {
			const summary = core.getTrafficSummary()
			return summary.spawned > 0 && summary.inside > 0
		})
		frameDeadline('arrivals never came through the street door', waited)
		const summary = core.getTrafficSummary()
		assert.ok(summary.spawned > 0, `nobody walked in through a street door in ${waited}ms of frames: ${JSON.stringify(summary)}`)
		assert.ok(summary.inside > 0, 'arrivals should still be inside the room')
		// `npcs` is the throttled view list (250 ms), not the engine truth, so it is polled for: right
		// after the first arrival walks in it can still hold the pre-toggle crowd.
		frameDeadline('the throttled view list never showed only arrivals',
			await framesUntil(() => core.npcs.value.length > 0
				&& core.npcs.value.every(dot => dot.id.startsWith('npc-traffic-test-t'))))
		assert.ok(
			core.npcs.value.every(dot => dot.id.startsWith('npc-traffic-test-t')),
			'every guest now should be an arrival',
		)

		// Switching back off must not leave ghost arrivals in the engine.
		core.setTraffic(false)
		assert.equal(core.getTrafficSummary().inside, 0)
		assert.equal(core.getTrafficSummary().spawned, 0)
	} finally {
		core.stopLoop()
	}
}, 30_000)

/**
 * A house on footfall: the declared crowd walks in through the street doors instead of standing there,
 * and `arrivalId` names an agent the same way the traffic step does, so a test can file an event
 * against a real arrival rather than an invented one.
 */
function trafficHouse(idPrefix: string): { core: ReturnType<typeof useNpcSimulationCore>; arrivalId: (index: number) => string } {
	const tile = 25
	const cols = 20
	const rows = 20
	const states: ('door' | 'walkable')[][] = Array.from({ length: rows }, (_, r) =>
		Array.from({ length: cols }, (_, c) => ((r === 5 || r === 14) && c === 10 ? 'door' : 'walkable')),
	)
	const model = hotelModel(
		{
			canvas: { width: tile * cols, height: tile * rows, tileSize: tile },
			floors: [
				{
					id: 'F1',
					name: 'Lobby',
					label: 'F1',
					defaultWalkable: true,
					walkable: { tileStates: states },
					objects: [{ id: 'bar-1', type: barCounter.id, x: tile * 10, y: tile * 8, w: 2, h: 1, rotation: 0 }],
				},
			],
		},
		[barCounter],
	)
	const trafficConfig = { ...config, pool: [{ roleId: GUEST, count: 600 }] } as unknown as NpcSimulationConfig
	const canvas = { w: tile * cols, h: tile * rows, tileSize: tile, streetTiles: 5 }
	const core = useNpcSimulationCore({
		getConfig: () => trafficConfig,
		getFloors: () => model.floors,
		getCanvas: () => canvas,
		getViewFloorId: () => 'F1',
		idPrefix,
		random: () => 0.5,
		getAssetDef: type => model.assetMap.get(type),
		getAssetTags: type => model.assetMap.get(type)?.tags,
	})
	core.ingestConfig(trafficConfig)
	core.simSpeed.value = 8
	core.deploy(model.floors, canvas, 'F1')
	core.setTraffic(true)
	return { core, arrivalId: index => `${idPrefix}t${index}` }
}

/** Every event the resolver is asked about is filed against the agent id it carries. */
function resolveThrough(core: ReturnType<typeof useNpcSimulationCore>, event: NpcEngineEvent) {
	return { roleId: GUEST, tags: [] as string[], faction: core.factionOf(event.agentId) }
}

test('a house the world turns against is owed a thinner street', async () => {
	const { core, arrivalId } = trafficHouse('npc-ostracized-test-')
	const PRESENT = 600
	try {
		frameDeadline('arrivals never came through the street door', await framesUntil(() => core.getTrafficSummary().spawned > 0))
		const declared = core.getWorld().world.expectedWalkIns
		assert.ok(declared > 0, 'a welcome house owes itself the whole declared crowd')
		assert.deepEqual(core.getWorld().world.estranged, [], 'a new house is welcome everywhere')

		// Walk out whoever the street actually sends, night after night. A hostile faction gets no more
		// clients, so it stops being charged and the survivors keep taking the traffic until they are
		// hostile too - the roster thins faction by faction, which is the honest shape of a world
		// reacting to a house rather than to a number.
		let days = 0
		while (days < 30 && core.getWorld().world.estranged.length === 0) {
			days += 1
			const newest = core.getTrafficSummary().spawned - 1
			const clients: string[] = []
			for (let i = newest; i >= 0 && clients.length < 20; i--) {
				const id = arrivalId(i)
				if (core.factionOf(id)) clients.push(id)
			}
			assert.ok(clients.length > 0, `day ${days}: the street delivered nobody the house could place`)
			const lost: NpcEngineEvent[] = clients.map(agentId => ({
				type: 'waiting', agentId, floorId: 'F1', tick: 0, reason: 'impatient',
			}))
			core.takings.ingest(lost, days * DAY_TICKS, event => resolveThrough(core, event), PRESENT)
			await new Promise(done => window.setTimeout(done, 0))
		}
		frameDeadline('the world never turned against the house', await framesUntil(() => core.getWorld().world.estranged.length > 0))
		const world = core.getWorld()
		const estranged = world.world.estranged
		assert.ok(estranged.length > 0, `${days} bad nights offended nobody`)
		// Attribution is the whole claim: a faction that never had a client in this house has no
		// business being angry, and the old reading charged every one of them for one queue.
		for (const entry of world.world.standings) {
			if (entry.served + entry.lost > 0) {
				assert.ok(entry.relations < FACTION_HOSTILE_BELOW, `${entry.id} had clients and was not judged for them`)
			} else {
				assert.equal(entry.relations, FACTION_RELATIONS_DEFAULT, `${entry.id} estranged on a night nobody from ${entry.id} came`)
			}
		}
		assert.ok(world.world.expectedWalkIns < declared, 'a lost faction did not thin the crowd the street owes')
		// The crowd the world now owes is the number the flow reads, not a copy the panel shows: this
		// run hands `createArrivalFlow` a function (`() => worldTrafficPerDay(state)`), and
		// `arrivalFlow.test.ts` pins what a live rate does to the arrivals owed across a day.
	} finally {
		core.stopLoop()
	}
}, 60_000)

test('an arrival who walks out offends its own faction and leaves the others alone', async () => {
	const { core, arrivalId } = trafficHouse('npc-one-line-test-')
	try {
		frameDeadline('arrivals never came through the street door', await framesUntil(() => core.getTrafficSummary().spawned > 0))
		// The freshest arrival still in the house: the binding is of a live agent to a face, and an
		// arrival that has already left takes it with it.
		const client = arrivalId(core.getTrafficSummary().spawned - 1)
		const offended = core.factionOf(client)
		assert.ok(offended, 'an arrival the street just delivered carries no face, so the binding is gone')
		core.takings.ingest(
			[{ type: 'waiting', agentId: client, floorId: 'F1', tick: 0, reason: 'impatient' }],
			DAY_TICKS,
			event => resolveThrough(core, event),
			600,
		)
		await new Promise(done => window.setTimeout(done, 0))
		const standings = core.getWorld().world.standings
		const moved = standings.filter(entry => entry.lost > 0 || entry.served > 0)
		assert.deepEqual(moved.map(entry => entry.id), [offended], 'a client of one house was charged to others')
		assert.equal(moved[0]?.lost, 1)
		for (const entry of standings.filter(row => row.id !== offended)) {
			assert.equal(entry.relations, FACTION_RELATIONS_DEFAULT, `${entry.id} moved on a queue nobody from ${entry.id} stood in`)
		}
		// One lost house is a thinner street, not an empty one - the ladder still has three to hear.
		assert.ok(core.getWorld().world.expectedWalkIns > 0, 'losing one faction closed the whole street')
	} finally {
		core.stopLoop()
	}
}, 60_000)

test('the running simulation pays the ledger without any caller wiring', async () => {
	const core = useNpcSimulationCore({
		getConfig: () => config,
		getFloors: () => model.floors,
		getCanvas: () => ({ w: TILE * 10, h: TILE * 10, tileSize: TILE }),
		getViewFloorId: () => 'F1',
		idPrefix: 'npc-wiring-test-',
		random: () => 0.5,
		getAssetDef: type => model.assetMap.get(type),
		getAssetTags: type => model.assetMap.get(type)?.tags,
	})

	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, { w: TILE * 10, h: TILE * 10, tileSize: TILE }, 'F1')
	try {
		// Poll for the first billable service instead of sleeping a fixed window: under a full parallel
		// run the animation frames get starved, and a 3 s sleep then measures machine load.
		const waited = await framesUntil(() => core.takings.snapshot().served > 0)
		frameDeadline('the deployed guests completed no billable service', waited)
		const snapshot = core.takings.snapshot()
		assert.ok(snapshot.served > 0, `served nothing after ${waited}ms of frames: ${JSON.stringify(snapshot)}`)
		assert.equal(snapshot.bankCents, snapshot.served * TAKING_RATES_CENTS.bar)
		assert.deepEqual(snapshot.byTag.map(entry => entry.tag), ['bar'])
		assert.ok(snapshot.perMinuteCents > 0, 'the income rate must be live while service is happening')
	} finally {
		core.stopLoop()
	}
}, 30_000)

test('a house with no street door keeps its crowd instead of emptying the room', async () => {
	// The same crowd, on a plate with no door. Footfall cannot deliver here, so arming it would
	// delete the standing guests and put nobody in their place - the deployment would look broken.
	// The house that cannot take arrivals keeps the people it was given.
	const core = useNpcSimulationCore({
		getConfig: () => config,
		getFloors: () => model.floors,
		getCanvas: () => ({ w: TILE * 10, h: TILE * 10, tileSize: TILE }),
		getViewFloorId: () => 'F1',
		idPrefix: 'npc-nodoor-test-',
		random: () => 0.5,
		getAssetDef: type => model.assetMap.get(type),
		getAssetTags: type => model.assetMap.get(type)?.tags,
	})
	core.ingestConfig(config)
	core.deploy(model.floors, { w: TILE * 10, h: TILE * 10, tileSize: TILE }, 'F1')
	try {
		assert.equal(core.getTrafficSummary().entrances, 0, 'this plate is meant to have no street door')
		assert.equal(core.trafficOn.value, false, 'footfall cannot run with no door to deliver through')
		frameDeadline('the deployment put nobody on the plate', await framesUntil(() => core.frameDots.size > 0))
	} finally {
		core.stopLoop()
	}
}, 30_000)
