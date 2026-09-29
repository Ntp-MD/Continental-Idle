import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	REPUTATION_NEUTRAL,
	REPUTATION_RECOVERY_FRACTION,
	STANDING_REPAIR_POINTS,
	advanceStanding,
	clampStanding,
	readReputation,
	repairStanding,
	standingReading,
} from '../../src/blueprint-editor/domain/economy/reputation'
import { createTakingsLedger } from '../../src/blueprint-editor/domain/economy/takings'
import { parseWalletRecord } from '../../src/blueprint-editor/domain/economy/wallet'
import { createWalletStore } from '../../src/blueprint-editor/store/wallet'
import { createMemoryStorage } from '../../src/blueprint-editor/store/localPort'

const noSource = () => undefined

test('one closed day closes part of the gap to the record, and converges rather than jumping', () => {
	const poor = readReputation(10, 90)
	assert.equal(poor.score, 10)
	const afterOneDay = advanceStanding(REPUTATION_NEUTRAL, poor)
	assert.equal(afterOneDay, Math.round(REPUTATION_NEUTRAL + (poor.score - REPUTATION_NEUTRAL) * REPUTATION_RECOVERY_FRACTION))
	// Recovery is a curve: the same evidence repeated settles at the record, whole points and no lower.
	let score = REPUTATION_NEUTRAL
	for (let day = 0; day < 30; day++) score = advanceStanding(score, poor)
	assert.ok(score >= poor.score && score - poor.score <= 1, `settled at ${score}, expected the ${poor.score} record`)
	assert.ok(advanceStanding(50, readReputation(100, 0)) > 50, 'good service must lift a fallen room')
})

test('standing is clamped to the band and an unjudged room recovers toward neutral', () => {
	assert.equal(clampStanding(-20), 0)
	assert.equal(clampStanding(160), 100)
	const unproven = readReputation(0, 0)
	assert.equal(advanceStanding(20, unproven) > 20, true)
	assert.equal(advanceStanding(95, unproven) < 95, true)
	// The multiplier is read off the standing, and it never exceeds face value.
	const reading = standingReading(140, unproven)
	assert.equal(reading.score, 100)
	assert.ok(reading.multiplier <= 1)
	assert.equal(reading.unproven, true, 'a standing reading must still say whether the crowd has judged')
})

test('a repair lifts toward neutral and stops there', () => {
	assert.equal(repairStanding(30).score, 30 + STANDING_REPAIR_POINTS)
	assert.equal(repairStanding(30).repaired, true)
	assert.equal(repairStanding(REPUTATION_NEUTRAL - 3).score, REPUTATION_NEUTRAL, 'a repair overshoots neutral')
	assert.equal(repairStanding(REPUTATION_NEUTRAL).repaired, false)
	assert.equal(repairStanding(95).repaired, false, 'money cannot buy a reputation the crowd did not give')
})

test('the ledger closes every day it jumps over, so recovery folds once per day', () => {
	const closes: number[] = []
	let standing = REPUTATION_NEUTRAL
	const ledger = createTakingsLedger({
		ticksPerSecond: 1,
		daySeconds: 10,
		isVisitor: () => true,
		onDayClose: day => {
			closes.push(day.served + day.walkOuts)
			standing = advanceStanding(standing, readReputation(day.served, day.walkOuts))
		},
	})
	// A three-day jump must close three days, not one: a long idle stretch cannot skip recovery.
	ledger.ingest([], 35, noSource)
	assert.equal(closes.length, 3)
	assert.equal(ledger.snapshot().daysCompleted, 3)
	assert.equal(standing, REPUTATION_NEUTRAL, 'a room with no record drifts nowhere')
})

test('standing persists with the bank, and a tampered score is rejected with the record', async () => {
	const storage = createMemoryStorage()
	const wallet = createWalletStore(storage)
	await wallet.commit(12_00, 300, 1_000, 42)
	const restored = await wallet.restore(2_000)
	assert.equal(restored.record?.standingScore, 42)

	// A session that has not judged the room must not overwrite the saved standing with nothing.
	await wallet.commit(1_00, 0, 3_000)
	assert.equal((await wallet.restore(4_000)).record?.standingScore, 42)

	await storage.write(JSON.stringify({ bankCents: 1, perMinuteCents: 0, standingScore: 130, savedAtMs: 1 }))
	assert.equal(parseWalletRecord(JSON.parse(await storage.read() as string)), null, 'a standing above the band is a rewritten record')
	await storage.write(JSON.stringify({ bankCents: 1, perMinuteCents: 0, standingScore: 12.5, savedAtMs: 1 }))
	assert.equal(parseWalletRecord(JSON.parse(await storage.read() as string)), null)
	await storage.write(JSON.stringify({ bankCents: 1, perMinuteCents: 0, savedAtMs: 1 }))
	const legacy = parseWalletRecord(JSON.parse(await storage.read() as string))
	assert.equal(legacy?.standingScore, undefined, 'an old record still reads, it simply has no saved standing')
})
