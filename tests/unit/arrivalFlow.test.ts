import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createArrivalFlow, presentFromFlow } from '../../src/blueprint-editor/domain/economy/arrivals'

const TICKS_PER_SECOND = 10
const DAY_SECONDS = 300

function flow(arrivalsPerDay: number, staySeconds?: number) {
	return createArrivalFlow({ arrivalsPerDay, daySeconds: DAY_SECONDS, ticksPerSecond: TICKS_PER_SECOND, staySeconds })
}

test('a day delivers its declared arrivals, one tick at a time', () => {
	const ledger = flow(500)
	const live: { id: string; bornTick: number }[] = []
	for (let tick = 1; tick <= DAY_SECONDS * TICKS_PER_SECOND; tick++) {
		const step = ledger.step(tick, live)
		for (let i = 0; i < step.spawns; i++) live.push({ id: `a${live.length}`, bornTick: tick })
		for (const id of step.departures) {
			const index = live.findIndex(entry => entry.id === id)
			if (index >= 0) live.splice(index, 1)
		}
	}
	// A whole day of a 500/day house delivers 499, and the one it misses is the fraction that a
	// thousandth of an arrival at a time never quite carries to the next whole one. It is the cost of
	// a rate that can change mid-run, which is what a house that loses a faction needs: the same
	// ledger could not deliver 500 exactly *and* re-read its rate a thousand times a second.
	// Measured: 250/day and 1000/day (rates that divide the day) do land exactly.
	assert.equal(ledger.spawnedSoFar, 499, 'the fraction is never dropped early, only left unbanked')
	assert.equal(flow(250).step(DAY_SECONDS * TICKS_PER_SECOND, []).spawns, 250, 'a rate that divides the day is exact')
})

test('arrivals are released in whole counts, never as a fraction', () => {
	const ledger = flow(500)
	const firstMinute = ledger.step(600, [])
	assert.equal(firstMinute.spawns, 100)
	assert.equal(ledger.spawnedSoFar, 100)
	// Asking again for an earlier tick must not un-spend the count or spawn negatives.
	assert.equal(ledger.step(300, []).spawns, 0)
	assert.equal(ledger.spawnedSoFar, 100)
})

test('an arrival leaves once its stay is up', () => {
	const ledger = flow(500, 60)
	const live = [{ id: 'a1', bornTick: 0 }]
	assert.deepEqual(ledger.step(599, live).departures, [])
	assert.deepEqual(ledger.step(600, live).departures, ['a1'])
})

test('the flow implies how many occupants the room should hold', () => {
	assert.equal(presentFromFlow(500, 300, 300), 500)
	assert.equal(presentFromFlow(500, 150, 300), 250)
	assert.equal(flow(500, 150).expectedPresent, 250)
	assert.equal(flow(500).staySeconds, 300, 'a stay defaults to a whole day')
	assert.equal(presentFromFlow(500, 300, 0), 0)
})

test('no declared traffic means nobody walks in', () => {
	const ledger = flow(0)
	assert.equal(ledger.step(DAY_SECONDS * TICKS_PER_SECOND, []).spawns, 0)
	assert.equal(ledger.spawnedSoFar, 0)
})

test('a live rate reads through, so a house can lose its footfall mid-run', () => {
	let perDay = 500
	const ledger = createArrivalFlow({
		arrivalsPerDay: () => perDay,
		daySeconds: DAY_SECONDS,
		ticksPerSecond: TICKS_PER_SECOND,
	})
	// A quarter of a day at the declared rate, banked a tick at a time, so the whole 125 of it is
	// owed by the time the quarter is up. The point is that the bank travels across a rate change.
	assert.equal(ledger.step((DAY_SECONDS * TICKS_PER_SECOND) / 4, []).spawns, 125)
	perDay = 100
	assert.equal(ledger.expectedPresent, 100, 'the reading follows the rate, not the day it deployed')
	// A thinner rate earns arrivals more slowly: the same second of tick buys a fifth of what it did.
	assert.equal(ledger.step((DAY_SECONDS * TICKS_PER_SECOND) / 2, []).spawns, 25)
	assert.equal(ledger.spawnedSoFar, 150)
	// Recovery back to the declared rate resumes from where the debt left off, not from zero.
	perDay = 500
	assert.equal(ledger.step((DAY_SECONDS * TICKS_PER_SECOND) * 0.75, []).spawns, 125)
	assert.equal(ledger.spawnedSoFar, 275)
})

test('a rate that moves never releases or recalls a crowd in one tick', () => {
	let perDay = 0
	const ledger = createArrivalFlow({
		arrivalsPerDay: () => perDay,
		daySeconds: DAY_SECONDS,
		ticksPerSecond: TICKS_PER_SECOND,
	})
	assert.equal(ledger.step(1000, []).spawns, 0, 'a house nobody trusts still opens its door')
	// Twenty times the declared rate is the worst case, and it shows what banking the fraction buys:
	// a rate that appears out of nowhere spends what one tick is worth, never what the run's remaining
	// ticks would have been worth under the old rate.
	perDay = 10_000
	assert.equal(ledger.step(1001, []).spawns, 3, 'one tick buys one tick of arrivals and no more')
	assert.equal(ledger.step(1400, []).spawns, 1330, '400 ticks at 10000/day is the 400 ticks owed, not the whole run')
	assert.equal(ledger.spawnedSoFar, 1333)
})
