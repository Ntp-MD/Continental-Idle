import { test } from 'vitest'
import assert from 'node:assert/strict'
import { useNpcSimulationCore } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import { NPC_ENGINE_TICKS_PER_SECOND, type NpcEngineEvent } from '../../src/engine/npc'
import { TAKINGS_DAY_SECONDS } from '../../src/blueprint-editor/domain/economy/takings'
import { STAFF_MIN_CREW } from '../../src/blueprint-editor/domain/economy/insolvency'
import { STAFF_DAY_WAGE_CENTS } from '../../src/blueprint-editor/domain/economy/upkeep'
import { REPUTATION_NEUTRAL, REPUTATION_RECOVERY_FRACTION } from '../../src/blueprint-editor/domain/economy/reputation'
import { hotelModel } from './hotelFixture'
import { frameDeadline, framesUntil } from './frameWaits'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const TILE = 25
const GUEST = 'role-guest'
const DESK = 'role-desk'
const STAFF_DEPLOYED = 8

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
		{ id: DESK, label: 'Desk', color: '#1d3557', focusTags: [], restrictedTags: [], taskIds: ['duty-desk'], focusChance: 0 },
	],
	tasks: [{ id: 'duty-desk', label: 'Duty', tags: ['front-desk'] }],
	pool: [{ roleId: GUEST, count: 4 }, { roleId: DESK, count: STAFF_DEPLOYED }],
} as unknown as NpcSimulationConfig

const guestLostTheirPlace = (agentId: string): NpcEngineEvent => ({
	type: 'waiting',
	agentId,
	floorId: 'F1',
	reason: 'impatient',
	tick: 60,
})

const resolveGuest = () => ({ roleId: GUEST, tags: [] as string[] })

function buildCore() {
	return useNpcSimulationCore({
		getConfig: () => config,
		getFloors: () => model.floors,
		getCanvas: () => ({ w: TILE * 10, h: TILE * 10, tileSize: TILE }),
		getViewFloorId: () => 'F1',
		idPrefix: 'npc-strike-test-',
		random: () => 0.5,
		getAssetDef: type => model.assetMap.get(type),
		getAssetTags: type => model.assetMap.get(type)?.tags,
	})
}

test('a day the bank cannot pay takes the unpaid staff out of the engine, and a paid day brings them back', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, { w: TILE * 10, h: TILE * 10, tileSize: TILE }, 'F1')
	const day = TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND
	try {
		frameDeadline('the staff half of the deployment never reached the engine',
			await framesUntil(() => core.countStaffOnDuty() === STAFF_DEPLOYED))
		assert.equal(core.countStaffOnDuty(), STAFF_DEPLOYED, 'the staff half of the deployment did not reach the engine')
		assert.equal(core.getStrike().offDuty, 0, 'nobody should be off duty before a day has closed')

		// Three guests give up on a line, then the hotel day closes against an empty bank.
		core.takings.ingest([0, 1, 2].map(index => guestLostTheirPlace(`lost-${index}`)), 120, resolveGuest)
		core.takings.ingest([], day, resolveGuest)
		frameDeadline('the unpaid day closed without taking anyone off the floor',
			await framesUntil(() => core.getStrike().offDuty > 0))

		const strike = core.getStrike()
		assert.equal(strike.unpaidCents, STAFF_DEPLOYED * STAFF_DAY_WAGE_CENTS, 'the whole bill went unpaid and was not recorded')
		assert.equal(strike.insolvent, true)
		assert.equal(core.countStaffOnDuty(), STAFF_MIN_CREW, 'the crew in the engine is not what the wages could cover')
		assert.equal(strike.offDuty, STAFF_DEPLOYED - STAFF_MIN_CREW)

		// Standing moves on the same boundary, toward the record: three lost guests, none served.
		const expected = Math.round(REPUTATION_NEUTRAL + (0 - REPUTATION_NEUTRAL) * REPUTATION_RECOVERY_FRACTION)
		assert.equal(core.getStandingScore(), expected, 'standing did not fold on the closed day')

		// A day that covers the bill must return everybody, even though the bank is now thinner than
		// the payroll was - the crew is decided off what wages were funded from, not what is left.
		core.takings.deposit(STAFF_DEPLOYED * STAFF_DAY_WAGE_CENTS * 2)
		core.takings.ingest([], day * 2, resolveGuest)
		frameDeadline('a paid day never brought the crew back into the engine',
			await framesUntil(() => core.countStaffOnDuty() === STAFF_DEPLOYED))

		assert.equal(core.getStrike().unpaidCents, 0, 'the second day did not pay its bill')
		assert.equal(core.getStrike().offDuty, 0, 'a paid day left staff off the floor')
		assert.equal(core.countStaffOnDuty(), STAFF_DEPLOYED, 'the crew did not come back into the engine')
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('re-deploying the crowd is not a way to forget an unpaid day', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, { w: TILE * 10, h: TILE * 10, tileSize: TILE }, 'F1')
	const day = TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND
	try {
		frameDeadline('the deployment never reached the engine',
			await framesUntil(() => core.countStaffOnDuty() === STAFF_DEPLOYED))
		core.takings.ingest([], day, resolveGuest)
		frameDeadline('the unpaid day closed without furloughing anyone',
			await framesUntil(() => core.countStaffOnDuty() === STAFF_MIN_CREW))
		assert.equal(core.countStaffOnDuty(), STAFF_MIN_CREW, 'the first unpaid day should have furloughed the surplus')

		// A fresh deployment rebuilds the engine from the pool: the strike belongs to the day that
		// closed, and the new crowd arrives whole rather than inheriting half a crew.
		core.deploy(model.floors, { w: TILE * 10, h: TILE * 10, tileSize: TILE }, 'F1')
		frameDeadline('the re-deployed crowd never reached the engine',
			await framesUntil(() => core.countStaffOnDuty() === STAFF_DEPLOYED))
		assert.equal(core.countStaffOnDuty(), STAFF_DEPLOYED, 'a re-deploy did not restore the full deployment')
		assert.equal(core.getStrike().offDuty, 0, 'the strike state survived a re-deploy')
		assert.equal(core.takings.snapshot().daysCompleted, 0, 'the day book was not reset')
	} finally {
		core.stopLoop()
	}
}, 45_000)
