import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	advanceObjectiveStreaks,
	OBJECTIVE_BOARD_SIZE,
	OBJECTIVE_TARGETS,
	objectiveInputFor,
	readObjectives,
	settleObjectives,
	topObjectives,
	ZERO_OBJECTIVE_STREAKS,
	type ObjectiveInput,
	type ObjectiveStreaks,
} from '../../src/blueprint-editor/domain/economy/objectives'
import { objectiveRewardCents } from '../../src/blueprint-editor/domain/economy/purchases'
import { settleDay } from '../../src/blueprint-editor/domain/economy/upkeep'

function input(over: Partial<ObjectiveInput> = {}): ObjectiveInput {
	return {
		daysCompleted: 1,
		served: 0,
		walkOuts: 0,
		lastDayCents: 0,
		settlement: settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 0 }),
		neutralityScore: 100,
		pressureOutstandingCents: 0,
		...over,
	}
}

/** The domain owns the zero board, so a new goal cannot be missing from a test harness that predates it. */
const ZERO: ObjectiveStreaks = ZERO_OBJECTIVE_STREAKS

test('a run that has not closed a day cannot be judged yet', () => {
	const board = readObjectives(input({ daysCompleted: 0 }))
	assert.equal(board.length, 5)
	for (const goal of board) {
		assert.equal(goal.verdict, 'unknown', `${goal.id} must read unproven before a day has closed`)
		assert.equal(goal.met, false, 'a goal that cannot be judged is not met')
	}
})

test('a day that met everything reads met, and one that met nothing reads unmet', () => {
	const good = readObjectives(input({
		served: OBJECTIVE_TARGETS['full-room'],
		walkOuts: 0,
		lastDayCents: OBJECTIVE_TARGETS['earn-the-day'],
		settlement: settleDay({ bankCents: 90_000, incomePerDayCents: 90_000, staffHeadcount: 2 }),
		neutralityScore: 100,
		pressureOutstandingCents: 0,
	}))
	for (const goal of good) assert.equal(goal.verdict, 'met', `${goal.id} should be met on a clean day`)

	const bad = readObjectives(input({
		served: 0,
		walkOuts: 40,
		lastDayCents: 0,
		settlement: settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 5 }),
		neutralityScore: 10,
		pressureOutstandingCents: 9_000,
	}))
	for (const goal of bad) assert.equal(goal.verdict, 'unmet', `${goal.id} should be unmet on a bad day`)
})

test('each goal is checked on the counter it names, and on nothing else', () => {
	// A big room that never pays its bill has not had a good night, however many it served.
	const busy = readObjectives(input({
		served: 200,
		walkOuts: 0,
		lastDayCents: 0,
		settlement: settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 5 }),
	}))
	assert.equal(busy.find(g => g.id === 'full-room')?.verdict, 'met')
	assert.equal(busy.find(g => g.id === 'pay-the-bill')?.verdict, 'unmet')
	assert.equal(busy.find(g => g.id === 'earn-the-day')?.verdict, 'unmet')
})

test('a goal the player nearly made reads as nearly made', () => {
	const [full] = readObjectives(input({ served: Math.floor(OBJECTIVE_TARGETS['full-room'] / 2) })).filter(g => g.id === 'full-room')
	assert.ok(full)
	assert.equal(full.verdict, 'unmet')
	assert.ok(full.progress > 0.4 && full.progress < 0.6, `halfway should read about half, got ${full.progress}`)
})

test('turning people away is worse the more of them there are', () => {
	const [none] = readObjectives(input({ walkOuts: 0 })).filter(g => g.id === 'no-one-walks')
	const [many] = readObjectives(input({ walkOuts: 40 })).filter(g => g.id === 'no-one-walks')
	assert.equal(none?.verdict, 'met')
	assert.equal(many?.verdict, 'unmet')
	assert.ok((none?.progress ?? 0) > (many?.progress ?? 0), 'a clean night must read further along than a bad one')
})

test('a streak counts closed days only, and a missed day ends it', () => {
	let streaks = ZERO
	for (let day = 0; day < 3; day++) streaks = advanceObjectiveStreaks(streaks, readObjectives(input({ served: 100 }), streaks))
	assert.equal(streaks['full-room'], 3, 'three clean days in a row')
	// A day that misses the goal ends the run of it, whatever it earned.
	streaks = advanceObjectiveStreaks(streaks, readObjectives(input({ served: 0 }), streaks))
	assert.equal(streaks['full-room'], 0)
})

test('the board is three goals, ranked by what the house has actually kept up', () => {
	const streaks = { ...ZERO, 'full-room': 9, 'no-one-walks': 4, 'pay-the-bill': 7 } satisfies ObjectiveStreaks
	const board = readObjectives(input({ served: 100, walkOuts: 0 }), streaks)
	const top = topObjectives(board)
	assert.equal(top.length, OBJECTIVE_BOARD_SIZE)
	assert.equal(top[0]?.id, 'full-room', 'the longest run is the headline')
	assert.equal(top[1]?.id, 'pay-the-bill')
	assert.equal(top[2]?.id, 'no-one-walks')
})

test('a settled day pays on the streak the day itself earned, not the one it inherited', () => {
	// The order is the rule: read the night, fold it, then price the fold. Priced on the inherited
	// streaks the first good night would pay nothing and every later one would pay for yesterday.
	const night = input({ served: OBJECTIVE_TARGETS['full-room'], lastDayCents: 10_000 })
	const first = settleObjectives(night, ZERO)
	assert.equal(first.board.find(goal => goal.id === 'full-room')?.met, true)
	assert.equal(first.streaks['full-room'], 1, 'the night folded into the board it is being paid on')
	assert.equal(
		first.reward.cents,
		objectiveRewardCents({ lastDayCents: 10_000, goals: first.board.map(goal => ({ met: goal.met, streak: 1 })) }).cents,
		'the bonus was not priced on the streaks the day inherited',
	)
	assert.ok(first.reward.cents > 0, 'a met night pays on its first night, not on its second')

	const second = settleObjectives(night, first.streaks)
	assert.ok(second.reward.cents > first.reward.cents, 'a run is worth more than its first night')
	// The board a caller polls is the reading, not the fold: it carries the streaks already banked.
	const polled = settleObjectives(night, second.streaks)
	assert.equal(polled.board.find(goal => goal.id === 'full-room')?.streak, 2, 'the board shows the two nights already closed')
	assert.equal(polled.streaks['full-room'], 3, 'and the fold is the third')
})

test('an unmet night folds to nothing and pays nothing', () => {
	const settled = settleObjectives(
		input({ served: 0, walkOuts: 40, lastDayCents: 10_000, neutralityScore: 10 }),
		{ ...ZERO, 'full-room': 9, 'no-one-walks': 6 },
	)
	assert.equal(settled.board.every(goal => !goal.met), true, 'a night this bad meets nothing')
	assert.equal(settled.streaks['full-room'], 0)
	assert.equal(settled.reward.cents, 0, 'a night that met nothing is not paid for a run it did not continue')
})

test('the board is built from the day book it is judging, at the day the ledger stamped', () => {
	const close = {
		bankCents: 30_000,
		carriedCents: 0,
		served: 100,
		walkOuts: 0,
		queueAbandons: 0,
		perMinuteCents: 1_000,
		simSeconds: 600,
		byTag: [],
		daysCompleted: 1,
		lastDayCents: 10_000,
		lastDayPayrollCents: 0,
		lastDayUnpaidCents: 0,
		lastDayDiscountCents: 0,
		todayCents: 0,
		perDayCents: 60_000,
		servicesPerDay: 70,
	}
	const read = objectiveInputFor({
		close,
		closedDay: 2,
		moneyMultiplier: 1,
		staffHeadcount: 4,
		neutralityScore: 100,
		pressureOutstandingCents: 0,
	})
	assert.equal(read.daysCompleted, 2, 'the board is told which day closed, rather than reading a counter that has not rolled')
	assert.equal(read.served, 100)
	assert.equal(read.settlement.payrollCents, 4 * 6_000, 'the payroll is the one the day was billed')
	assert.equal(read.settlement.profitCents, 60_000 - 24_000, 'the day is priced on the live rate the ledger projected')
	// A house whose bank covers the wage bill is not insolvent, and the goal is judged on that.
	assert.equal(read.settlement.insolvent, false)
	const board = readObjectives(read, ZERO)
	assert.equal(board.find(goal => goal.id === 'full-room')?.met, true)
	assert.equal(board.find(goal => goal.id === 'pay-the-bill')?.met, true)
	assert.equal(board.find(goal => goal.id === 'earn-the-day')?.met, false)
	// Four of the five goals are met on a 100.00 night (only `earn-the-day` wants a bigger day), each
	// starting a streak of one: four shares of 2%, and the night's own cap of 25% is nowhere near binding.
	assert.equal(board.filter(goal => goal.met).length, 4)
	assert.equal(settleObjectives(read, ZERO).reward.cents, 800)
})
