import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	advanceObjectiveStreaks,
	OBJECTIVE_BOARD_SIZE,
	OBJECTIVE_TARGETS,
	readObjectives,
	topObjectives,
	type ObjectiveId,
	type ObjectiveInput,
} from '../../src/blueprint-editor/domain/economy/objectives'
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

const ZERO: Readonly<Record<ObjectiveId, number>> = {
	'pay-the-bill': 0,
	'full-room': 0,
	'no-one-walks': 0,
	'keep-the-peace': 0,
	'earn-the-day': 0,
}

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
	const streaks = { ...ZERO, 'full-room': 9, 'no-one-walks': 4, 'pay-the-bill': 7 } as Readonly<Record<ObjectiveId, number>>
	const board = readObjectives(input({ served: 100, walkOuts: 0 }), streaks)
	const top = topObjectives(board)
	assert.equal(top.length, OBJECTIVE_BOARD_SIZE)
	assert.equal(top[0]?.id, 'full-room', 'the longest run is the headline')
	assert.equal(top[1]?.id, 'pay-the-bill')
	assert.equal(top[2]?.id, 'no-one-walks')
})
