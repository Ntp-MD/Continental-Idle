import { test } from 'vitest'
import assert from 'node:assert/strict'
import { useNpcSimulationCore } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import { TAKING_RATES_CENTS } from '../../src/blueprint-editor/domain/economy/takings'
import { hotelModel } from './hotelFixture'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const TILE = 25
const GUEST = 'role-guest'

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

async function framesRunning(ms: number): Promise<void> {
	await new Promise(resolve => window.setTimeout(resolve, ms))
}

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
		assert.equal(core.trafficOn.value, false, 'footfall starts off')
		assert.ok(core.getTrafficSummary().entrances === 2, `expected 2 street doors, got ${core.getTrafficSummary().entrances}`)

		// The guest crowd the modal deployed is replaced by traffic, not stacked under it.
		core.setTraffic(true)
		assert.equal(core.trafficOn.value, true)
		// The dots, not `npcs`: the view list is refreshed on a 250 ms throttle, the dot map is the
		// immediate truth about who is still in the engine.
		assert.equal(core.frameDots.size, 0, 'the standing visitors should be gone the moment traffic starts')

		await framesRunning(4000)
		const summary = core.getTrafficSummary()
		assert.ok(summary.spawned > 0, `nobody walked in through a street door in 4s of frames: ${JSON.stringify(summary)}`)
		assert.ok(summary.inside > 0, 'arrivals should still be inside the room')
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
})

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
		await framesRunning(3000)
		const snapshot = core.takings.snapshot()
		assert.ok(snapshot.served > 0, `the deployed guests completed no billable service in 3s of frames: ${JSON.stringify(snapshot)}`)
		assert.equal(snapshot.bankCents, snapshot.served * TAKING_RATES_CENTS.bar)
		assert.deepEqual(snapshot.byTag.map(entry => entry.tag), ['bar'])
		assert.ok(snapshot.perMinuteCents > 0, 'the income rate must be live while service is happening')
	} finally {
		core.stopLoop()
	}
})
