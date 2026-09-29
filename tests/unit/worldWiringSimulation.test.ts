import { test } from 'vitest'
import assert from 'node:assert/strict'
import { useNpcSimulationCore } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import { NPC_ENGINE_TICKS_PER_SECOND, type NpcEngineEvent } from '../../src/engine/npc'
import { TAKINGS_DAY_SECONDS } from '../../src/blueprint-editor/domain/economy/takings'
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
		core.takings.ingest([], DAY_TICKS, resolveDesk, PRESENT)
		frameDeadline('the world never settled', await framesUntil(() => core.takings.snapshot().daysCompleted >= 1))
		core.reset()
		const world = core.getWorld()
		assert.equal(world.continuity.score, CONTINUITY_CEILING)
		assert.equal(world.continuity.breaches, 0)
		assert.equal(world.pressure.outstandingCents, 0)
		assert.equal(world.world.returningShare, 0, 'a fresh house knows nobody')
		assert.equal(world.world.strongest !== null, true, 'every faction starts level, so one leads')
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
	try {
		frameDeadline('the crowd never reached the engine', await framesUntil(() => core.frameDots.size > 0))
		// Before a day has closed there is no night to judge, so every goal reads unproven rather
		// than failed - the three-valued verdict, and the reason an idle lobby is not a losing one.
		for (const goal of core.getObjectives()) {
			assert.equal(goal.verdict, 'unknown', `${goal.id} must be unjudged before the first close`)
		}

		const resolveGuest = () => ({ roleId: GUEST, tags: ['bar'] as string[] })
		for (let day = 1; day <= 2; day++) {
			const served: NpcEngineEvent[] = Array.from({ length: 50 }, (_, index) => ({
				type: 'interaction-end', agentId: `served-${day}-${index}`, floorId: 'F1', tick: 0,
			}))
			core.takings.ingest(served, day * DAY_TICKS, resolveGuest, PRESENT)
			await new Promise(resolve => window.setTimeout(resolve, 0))
		}
		const board = core.getObjectives()
		const full = board.find(goal => goal.id === 'full-room')
		assert.equal(full?.verdict, 'met', 'a night that served the room met the goal')
		assert.equal(full?.streak, 1, 'two closed days, one of them met, is a streak of one')
		// A goal the house did not earn reads unmet and carries no streak: the goal that was not met
		// is the one that keeps the run honest.
		const earned = board.find(goal => goal.id === 'earn-the-day')
		assert.equal(earned?.verdict, 'unmet')
		assert.equal(earned?.streak, 0)
	} finally {
		core.stopLoop()
	}
}, 45_000)
