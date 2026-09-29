import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createArrivalFlow, presentFromFlow } from '../../src/blueprint-editor/domain/economy/arrivals'

const TICKS_PER_SECOND = 10
const DAY_SECONDS = 300

function flow(arrivalsPerDay: number, staySeconds?: number) {
	return createArrivalFlow({ arrivalsPerDay, daySeconds: DAY_SECONDS, ticksPerSecond: TICKS_PER_SECOND, staySeconds })
}

test('a day delivers exactly its declared arrivals, one tick at a time', () => {
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
	assert.equal(ledger.spawnedSoFar, 500, 'fractional arrivals must never be dropped')
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
