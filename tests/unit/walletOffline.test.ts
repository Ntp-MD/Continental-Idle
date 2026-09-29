import { test } from 'vitest'
import assert from 'node:assert/strict'
import { accrueOffline, parseWalletRecord, WALLET_OFFLINE_CAP_MINUTES } from '../../src/blueprint-editor/domain/economy/wallet'
import { createTakingsLedger } from '../../src/blueprint-editor/domain/economy/takings'

const MINUTE = 60_000

function ledger(): ReturnType<typeof createTakingsLedger> {
	return createTakingsLedger({ ticksPerSecond: 60, isVisitor: () => true })
}

test('a deposit is money, not a service', () => {
	// The away credit is computed from the live rate, so a deposit that raised that rate would
	// compound itself across sessions.
	const tally = (() => {
		const book = ledger()
		book.deposit(5_000)
		return book.snapshot()
	})()
	assert.equal(tally.bankCents, 5_000)
	assert.equal(tally.carriedCents, 5_000)
	assert.equal(tally.served, 0, 'an absent period completed no guest')
	assert.equal(tally.perMinuteCents, 0)
	assert.equal(tally.perDayCents, 0)
})

test('re-deploying the crowd keeps the carried balance and drops only this session', () => {
	const book = ledger()
	book.deposit(4_000)
	book.reset()
	assert.equal(book.snapshot().bankCents, 4_000, 'a re-deploy re-measures the lobby, it does not un-earn money')
	assert.equal(book.snapshot().served, 0)
})

test('an hour away at a measured rate pays that rate', () => {
	const away = accrueOffline({ savedAtMs: 0, nowMs: 60 * MINUTE, perMinuteCents: 840 })
	assert.equal(away.earnedCents, 840 * 60)
	assert.equal(away.creditedMinutes, 60)
	assert.equal(away.capped, false)
})

test('a lobby that never earned charges nobody for an absent period', () => {
	// Same principle as an unproven reputation reading: no evidence, no money.
	assert.deepEqual(accrueOffline({ savedAtMs: 0, nowMs: 24 * 60 * MINUTE, perMinuteCents: 0 }), {
		earnedCents: 0,
		creditedMinutes: 0,
		capped: false,
	})
})

test('a save from the future accrues nothing instead of creating a debt', () => {
	// Clocks move backwards: a device clock change must not be payable by the player.
	const away = accrueOffline({ savedAtMs: 10 * MINUTE, nowMs: 0, perMinuteCents: 500 })
	assert.equal(away.earnedCents, 0)
	assert.equal(away.capped, false)
})

test('away time is credited up to the declared cap and no further', () => {
	const atCap = accrueOffline({ savedAtMs: 0, nowMs: WALLET_OFFLINE_CAP_MINUTES * MINUTE, perMinuteCents: 100 })
	assert.equal(atCap.capped, false)
	assert.equal(atCap.earnedCents, WALLET_OFFLINE_CAP_MINUTES * 100)

	const past = accrueOffline({ savedAtMs: 0, nowMs: (WALLET_OFFLINE_CAP_MINUTES + 120) * MINUTE, perMinuteCents: 100 })
	assert.equal(past.capped, true, 'a period longer than the cap says so')
	assert.equal(past.creditedMinutes, WALLET_OFFLINE_CAP_MINUTES)
	assert.equal(past.earnedCents, WALLET_OFFLINE_CAP_MINUTES * 100, 'the overrun is free, not paid')
})

test('money stays whole cents over a month away', () => {
	// A fractional balance is how an idle game drifts. The expectation is a literal, not a re-run of
	// the same floor the rule performs - computing it with floor here would agree with the mutant.
	const away = accrueOffline({ savedAtMs: 0, nowMs: 30 * 24 * 60 * MINUTE, perMinuteCents: 155.2 })
	assert.equal(away.earnedCents, 74_496, '155.2 x 480 minutes is 74496 cents once the odd fraction is dropped')
	assert.equal(Number.isInteger(away.earnedCents), true)

	const half = accrueOffline({ savedAtMs: 0, nowMs: MINUTE, perMinuteCents: 0.5 })
	assert.equal(half.earnedCents, 0, 'half a cent is not money yet')
})

test('a stored wallet round-trips, and extra keys do not void it', () => {
	assert.deepEqual(parseWalletRecord({ bankCents: 71_110, perMinuteCents: 155.2, savedAtMs: 1234 }), {
		bankCents: 71_110,
		perMinuteCents: 155.2,
		savedAtMs: 1234,
	})
	assert.deepEqual(
		parseWalletRecord({ bankCents: 0, perMinuteCents: 0, savedAtMs: 0, fromAnotherVersion: true }),
		{ bankCents: 0, perMinuteCents: 0, savedAtMs: 0 },
		'an empty wallet is a real reading, not a missing one',
	)
})

test('a tampered record mints nothing', () => {
	const base = { perMinuteCents: 10, savedAtMs: 1 }
	assert.equal(parseWalletRecord({ ...base, bankCents: 0.5 }), null, 'the ledger only ever writes whole cents')
	assert.equal(parseWalletRecord({ ...base, bankCents: -1 }), null)
	assert.equal(parseWalletRecord({ ...base, perMinuteCents: -10 }), null)
	assert.equal(parseWalletRecord({ ...base, perMinuteCents: Number.NaN }), null)
	assert.equal(parseWalletRecord({ ...base, savedAtMs: Number.NaN }), null)
	assert.equal(parseWalletRecord({ ...base, savedAtMs: 'yesterday' }), null)
})
