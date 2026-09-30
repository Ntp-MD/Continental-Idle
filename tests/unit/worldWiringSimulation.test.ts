import { test } from 'vitest'
import assert from 'node:assert/strict'
import { useNpcSimulationCore } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import { NPC_ENGINE_TICKS_PER_SECOND, type NpcEngineEvent } from '../../src/engine/npc'
import { TAKINGS_DAY_SECONDS, TAKING_RATES_CENTS } from '../../src/blueprint-editor/domain/economy/takings'
import { objectiveRewardCents } from '../../src/blueprint-editor/domain/economy/purchases'
import { FACTION_RELATIONS_DEFAULT } from '../../src/blueprint-editor/domain/economy/standing-world'
import { CONTINUITY_CEILING, CONTINUITY_MONEY_FLOOR, houseMultiplier } from '../../src/blueprint-editor/domain/economy/continuity'
import { hotelModel } from './hotelFixture'
import { frameDeadline, framesUntil } from './frameWaits'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const TILE = 25
const GUEST = 'role-guest'
const DESK = 'role-desk'
const CANVAS = { w: TILE * 10, h: TILE * 10, tileSize: TILE, streetTiles: 5 }
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
		{ id: DESK, label: 'Desk', color: '#1d3557', focusTags: [], restrictedTags: [], taskIds: ['duty-desk'], focusChance: 0 },
	],
	tasks: [{ id: 'duty-desk', label: 'Duty', tags: ['front-desk'] }],
	pool: [{ roleId: GUEST, count: 4 }, { roleId: DESK, count: 4 }],
} as unknown as NpcSimulationConfig

const PRESENT = 8
const resolveDesk = () => ({ roleId: DESK, tags: [] as string[] })

/** An agent that lost its path - the engine's own statement that this one had to give ground. */
const jammed = (agentId: string): NpcEngineEvent => ({ type: 'blocked', agentId, floorId: 'F1', tick: 60 })

/**
 * What the house is worth, read through the same settled world the panel reads. Standing is held at
 * its neutral multiplier deliberately: this file is about the world, and a bad queue is covered by
 * `continuity.test.ts` at the unit level.
 */
function houseWorthOf(core: ReturnType<typeof buildCore>): number {
	const world = core.getWorld()
	return houseMultiplier({ standing: 1, continuity: world.continuity, pressurePenalty: world.pressure.demandPenalty })
}

function buildCore() {
	return useNpcSimulationCore({
		getConfig: () => config,
		getFloors: () => model.floors,
		getCanvas: () => ({ w: TILE * 10, h: TILE * 10, tileSize: TILE }),
		getViewFloorId: () => 'F1',
		idPrefix: 'npc-world-test-',
		random: () => 0.5,
		getAssetDef: type => model.assetMap.get(type),
		getAssetTags: type => model.assetMap.get(type)?.tags,
	})
}

test('a newly deployed house is neutral, unindebted and welcome everywhere', () => {
	const core = buildCore()
	try {
		const world = core.getWorld()
		assert.equal(world.continuity.score, CONTINUITY_CEILING)
		assert.equal(world.continuity.breaches, 0)
		assert.equal(world.continuity.underPressure, false)
		assert.equal(world.pressure.outstandingCents, 0)
		assert.equal(world.pressure.underAudit, false)
		assert.deepEqual(world.world.estranged, [])
		assert.equal(world.incidentsToday, 0)
	} finally {
		core.reset()
	}
})

test('an orderly night closes a day and leaves the house exactly as safe as it was', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		core.takings.ingest([], DAY_TICKS, resolveDesk, PRESENT)
		frameDeadline('the world never settled on the closed day', await framesUntil(() => core.takings.snapshot().daysCompleted >= 1))
		const world = core.getWorld()
		// A room that never jammed pays nothing for the night: recovery from full is still full.
		assert.equal(world.continuity.score, CONTINUITY_CEILING)
		assert.equal(world.continuity.breaches, 0)
		assert.equal(world.pressure.outstandingCents, 0)
		assert.equal(world.pressure.daysUnderPressure, 0)
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a night of scenes costs neutrality, and the House answers once the house is unsafe', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		// Enough blocked-agent-seconds to clear the incident floor by a wide margin, at a ratio no
		// room's own traffic would produce on its own.
		const jam = Array.from({ length: 60 }, (_, index) => jammed(`jam-${index}`))
		for (let i = 0; i < 10; i++) core.takings.ingest(jam, 100 + i, resolveDesk, PRESENT)
		core.takings.ingest(jam, DAY_TICKS, resolveDesk, PRESENT)

		frameDeadline('the scenes never reached neutrality', await framesUntil(() => core.getWorld().continuity.breaches > 0))
		const world = core.getWorld()
		assert.ok(world.continuity.score < CONTINUITY_CEILING, 'a jammed night must cost the house something')
		// One bad night is enough to cross the notice line here, because a bad night is 10 scenes and
		// a scene costs 25 points. The two ladders are separate facts, but the House only ever acts
		// on what neutrality already decided - it never forms its own opinion of the night.
		assert.equal(world.continuity.underPressure, world.continuity.score < 40)
		assert.equal(world.pressure.daysUnderPressure, world.continuity.underPressure ? 1 : 0)
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a run of bad nights puts the house under notice, and the House starts taking money', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		// The House can only fine money the house holds, so a bankrupt one is never fined - that is
		// the rule, not a gap in the wiring, and it is why the bank is funded before the bad nights.
		core.takings.deposit(500_000)
		// Enough nights to walk neutrality under the notice line and let the House stack fines,
		// which is the state the audit and the faction rules answer to.
		const jam = Array.from({ length: 60 }, (_, index) => jammed(`jam-${index}`))
		let tick = 0
		for (let day = 0; day < 5; day++) {
			tick += DAY_TICKS
			for (let i = 0; i < 10; i++) core.takings.ingest(jam, tick - DAY_TICKS + i, resolveDesk, PRESENT)
			core.takings.ingest(jam, tick, resolveDesk, PRESENT)
		}
		frameDeadline('the world never forgot the house', await framesUntil(() => core.getWorld().continuity.breaches >= 50))
		const world = core.getWorld()
		assert.equal(world.continuity.underPressure, true, 'a run of bad nights should have been noticed')
		assert.ok(world.pressure.outstandingCents > 0, 'the House should have taken money by now')
		assert.ok(world.continuity.multiplier < 1, 'an unsafe house trades at a discount')
		assert.ok(world.continuity.multiplier >= 0.5, 'and never below half')
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a night of scenes leaves the house worth less than face value, and never less than the floor', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		// The reading the panel prices income with, driven off the same world the sim settled.
		const safe = houseWorthOf(core)
		assert.equal(safe, 1, 'a fresh house is worth exactly face value')

		const jam = Array.from({ length: 60 }, (_, index) => jammed(`jam-${index}`))
		for (let i = 0; i < 10; i++) core.takings.ingest(jam, 100 + i, resolveDesk, PRESENT)
		core.takings.ingest(jam, DAY_TICKS, resolveDesk, PRESENT)
		frameDeadline('the scenes never reached neutrality', await framesUntil(() => core.getWorld().continuity.breaches > 0))

		const worth = houseWorthOf(core)
		assert.ok(worth < safe, 'a bad night must cost the house money')
		assert.ok(worth >= CONTINUITY_MONEY_FLOOR, `a bad night took the house to ${worth}`)
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a house that recovers is paid back what the bad night took', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		const jam = Array.from({ length: 60 }, (_, index) => jammed(`jam-${index}`))
		for (let i = 0; i < 10; i++) core.takings.ingest(jam, 100 + i, resolveDesk, PRESENT)
		core.takings.ingest(jam, DAY_TICKS, resolveDesk, PRESENT)
		frameDeadline('the scenes never reached neutrality', await framesUntil(() => core.getWorld().continuity.breaches > 0))
		const lost = houseWorthOf(core)

		// Enough quiet days for the ladder to climb all the way back, and the house with it. The
		// ledger rolls every day between two ticks, so one ingest per day is the whole story. The
		// count is derived from the declared recovery fraction and then rounded up twice over: the
		// ladder rounds its own score to a whole point, so the last gap is closed a point at a time.
		const quietDays = Math.ceil(Math.log(0.001) / Math.log(1 - 0.25)) + 12
		for (let day = 1; day <= quietDays; day++) {
			core.takings.ingest([], DAY_TICKS * day, resolveDesk, PRESENT)
		}
		frameDeadline('the house never recovered', await framesUntil(() => core.getWorld().continuity.score === CONTINUITY_CEILING))
		assert.ok(houseWorthOf(core) > lost, 'a house that holds the peace is paid back')
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('the world is cleared by a re-deploy: the same plan is not punished for yesterday', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		// A night worth paying for, so the assertions below cannot pass by both halves reading zero.
		const served = Array.from({ length: 50 }, (_, index) => ({
			type: 'interaction-end' as const, agentId: `served-${index}`, floorId: 'F1', tick: 0,
		}))
		core.takings.ingest(served, DAY_TICKS, () => ({ roleId: GUEST, tags: ['bar'] as string[] }), PRESENT)
		frameDeadline('the good night never paid', await framesUntil(() => core.getObjectiveReward().cents > 0))
		core.reset()
		const world = core.getWorld()
		assert.equal(world.continuity.score, CONTINUITY_CEILING)
		assert.equal(world.continuity.breaches, 0)
		assert.equal(world.pressure.outstandingCents, 0)
		assert.equal(world.world.returningShare, 0, 'a fresh house knows nobody')
		assert.equal(world.world.strongest !== null, true, 'every faction starts level, so one leads')
		assert.deepEqual(core.getObjectiveReward(), { cents: 0, capped: false }, 'a re-deploy still owes the player yesterday\'s bonus')
		assert.equal(core.getObjectives().every(goal => goal.verdict === 'unknown'), true, 'the board is unjudged again, not carried over')
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a house the street wrote off is written back in by the quiet nights', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	core.isPaused.value = true
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		const resolveGuest = () => ({ roleId: GUEST, tags: ['bar'] as string[] })
		const walkOut = (day: number): NpcEngineEvent => ({
			type: 'waiting', agentId: `lost-${day}`, floorId: 'F1', tick: 0, reason: 'impatient',
		})
		// Twenty nights of clients given up on. A guest the world never released books to `neutral`, so
		// that is the house that takes the grudge - and below the hostile line it stops sending anyone.
		for (let day = 1; day <= 20; day++) core.takings.ingest([walkOut(day)], day * DAY_TICKS, resolveGuest, PRESENT)
		const shunned = core.getWorld()
		assert.equal(shunned.world.estranged.includes('neutral'), true, `nobody wrote the house off after twenty lost clients: ${JSON.stringify(shunned.world.standings)}`)
		const owedWhileShunned = shunned.world.expectedWalkIns

		// Quiet nights, and nobody at all to serve. The recovery has to run on the clock alone, because
		// a faction that sends nobody can never earn its way back by service - a gate on service would
		// delete it from the street permanently.
		for (let day = 21; day <= 45; day++) core.takings.ingest([], day * DAY_TICKS, resolveGuest, PRESENT)
		const healed = core.getWorld()
		assert.deepEqual(healed.world.estranged, [], 'the street never forgot')
		assert.ok(healed.world.expectedWalkIns > owedWhileShunned, 'a faction written back in did not restore the crowd owed')
		assert.equal(
			healed.world.standings.find(faction => faction.id === 'neutral')?.relations,
			FACTION_RELATIONS_DEFAULT,
			'recovery kept climbing past even',
		)
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a day that ends is one decision, not many: the world never settles twice for the same close', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		const jam = Array.from({ length: 60 }, (_, index) => jammed(`jam-${index}`))
		for (let i = 0; i < 10; i++) core.takings.ingest(jam, 100 + i, resolveDesk, PRESENT)
		core.takings.ingest(jam, DAY_TICKS, resolveDesk, PRESENT)
		frameDeadline('the scenes never reached neutrality', await framesUntil(() => core.getWorld().continuity.breaches > 0))
		const first = core.getWorld()
		// Many more frames pass over the same closed day; the reading must be stable, not compounding.
		await new Promise(resolve => window.setTimeout(resolve, 500))
		assert.deepEqual(core.getWorld(), first)
	} finally {
		core.stopLoop()
	}
}, 45_000)

test('a goal is judged on a day the house closed, and a streak moves once per close', async () => {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	// Paused before the first frame: this file is about what the ledger does with the day it is handed,
	// and a crowd that walks up to the bar on its own would add services no assertion can predict.
	core.isPaused.value = true
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		// Before a day has closed there is no night to judge, so every goal reads unproven rather
		// than failed - the three-valued verdict, and the reason an idle lobby is not a losing one.
		for (const goal of core.getObjectives()) {
			assert.equal(goal.verdict, 'unknown', `${goal.id} must be unjudged before the first close`)
		}

		const resolveGuest = () => ({ roleId: GUEST, tags: ['bar'] as string[] })
		const night = (day: number): NpcEngineEvent[] => Array.from({ length: 50 }, (_, index) => ({
			type: 'interaction-end', agentId: `served-${day}-${index}`, floorId: 'F1', tick: 0,
		}))
		const nightly = 50 * TAKING_RATES_CENTS.bar

		// Night one. The close judges the board, folds its streaks and pays the bonus, so the only money
		// in the bank that no interaction billed is the bonus itself - which is what makes the
		// arithmetic below exact rather than indicative.
		core.takings.ingest(night(1), DAY_TICKS, resolveGuest, PRESENT)
		await new Promise(resolve => window.setTimeout(resolve, 0))
		const firstBoard = core.getObjectives()
		const first = core.getObjectiveReward()
		assert.ok(first.cents > 0, 'a night that met goals paid nothing on its first night')
		assert.deepEqual(first, objectiveRewardCents({ lastDayCents: nightly, goals: firstBoard }))
		let snap = core.takings.snapshot()
		assert.equal(snap.lastDayCents, nightly, 'the bonus entered the day book')
		assert.equal(snap.served, 50, 'a bonus payment invented a served client')
		assert.equal(snap.bankCents, nightly - snap.lastDayPayrollCents - snap.lastDayDiscountCents + first.cents, 'the first night\'s bonus never reached the bank')

		// Night two, the same work again: a run is worth more than its first night, and the bank carries
		// both nights' bonuses, wage bills and credit costs.
		const bankBeforeLast = snap.bankCents
		core.takings.ingest(night(2), DAY_TICKS * 2, resolveGuest, PRESENT)
		await new Promise(resolve => window.setTimeout(resolve, 0))
		const board = core.getObjectives()
		const full = board.find(goal => goal.id === 'full-room')
		assert.equal(full?.verdict, 'met', 'a night that served the room met the goal')
		assert.equal(full?.streak, 2, 'both closed days met it, so the run is two nights long - a board that pays for yesterday would read one')
		// A goal the house did not earn reads unmet and carries no streak: the goal that was not met
		// is the one that keeps the run honest.
		const earned = board.find(goal => goal.id === 'earn-the-day')
		assert.equal(earned?.verdict, 'unmet')
		assert.equal(earned?.streak, 0)

		const reward = core.getObjectiveReward()
		snap = core.takings.snapshot()
		assert.ok(reward.cents > first.cents, 'a second night of the same work paid no more than the first')
		assert.deepEqual(reward, objectiveRewardCents({ lastDayCents: snap.lastDayCents, goals: board }))
		assert.equal(reward.capped, false, 'a night this size should not have needed the cap')
		assert.equal(snap.lastDayCents, nightly, 'the bonus entered the day book')
		assert.equal(snap.served, 100, 'a bonus payment invented a served client')
		assert.equal(
			snap.bankCents,
			bankBeforeLast + nightly - snap.lastDayPayrollCents - snap.lastDayDiscountCents + reward.cents,
			'the night did not settle to the cent: takings, the wage bill, the price of the credit, the bonus',
		)
	} finally {
		core.stopLoop()
	}
}, 45_000)

/** One closed night of the same work, at whatever standing the caller asks the house to start on. */
async function oneNightAt(standingScore: number) {
	const core = buildCore()
	core.ingestConfig(config)
	core.simSpeed.value = 8
	core.deploy(model.floors, CANVAS, 'F1')
	core.isPaused.value = true
	core.setStanding(standingScore)
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		const served: NpcEngineEvent[] = Array.from({ length: 50 }, (_, index) => ({
			type: 'interaction-end', agentId: `kept-${index}`, floorId: 'F1', tick: 0,
		}))
		core.takings.ingest(served, DAY_TICKS, () => ({ roleId: GUEST, tags: ['bar'] as string[] }), PRESENT)
		await new Promise(resolve => window.setTimeout(resolve, 0))
		return { snapshot: core.takings.snapshot(), worth: core.getHouseWorth(), bonus: core.getObjectiveReward().cents, discount: core.takings.snapshot().lastDayDiscountCents }
	} finally {
		core.stopLoop()
	}
}

test('the price of a bad name is charged in money, not only displayed', async () => {
	const good = await oneNightAt(100)
	const poor = await oneNightAt(50)
	const gross = 50 * TAKING_RATES_CENTS.bar
	// A house the world trusts at face value keeps the whole night: the discount is not a fee everyone
	// pays, it is the reading.
	assert.equal(good.worth, 1, `a trusted house was not worth face value (${good.worth})`)
	assert.equal(good.snapshot.lastDayCents, gross, 'the day book stopped being what the counter took')
	assert.equal(good.snapshot.lastDayDiscountCents, 0, 'a welcome house was made to pay for its name')
	// The same night, the same work, a worse standing: less of it is kept, and the number the panel
	// explains is the number the close took.
	assert.ok(poor.worth < good.worth, 'standing did not move what the house is worth')
	assert.equal(poor.snapshot.lastDayCents, gross, 'the crowd was billed at the discounted tariff')
	assert.ok(poor.snapshot.lastDayDiscountCents > 0, 'a bad name cost nothing at the close')
	assert.equal(
		poor.snapshot.bankCents,
		gross - poor.discount - poor.snapshot.lastDayPayrollCents + poor.bonus,
		'the bank is not what the night took, less the wage bill and the price of the credit',
	)
	assert.ok(good.snapshot.bankCents > poor.snapshot.bankCents, 'the two houses kept the same amount of the same night')
}, 45_000)
