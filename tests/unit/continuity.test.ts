import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
	advanceContinuity,
	CONTINUITY_CEILING,
	CONTINUITY_FLOOR,
	continuityMultiplier,
	continuityReading,
	createContinuityState,
	CONTINUITY_MONEY_FLOOR,
	houseMultiplier,
	priceOfCreditCents,
	recordBreach,
} from '@/blueprint-editor/domain/economy/continuity'

describe('neutrality', () => {
	it('a fresh house is at full neutrality with no breaches recorded', () => {
		const state = createContinuityState()
		const reading = continuityReading(state)
		assert.equal(reading.score, CONTINUITY_CEILING)
		assert.equal(reading.breaches, 0)
		assert.equal(reading.underPressure, false)
		assert.equal(houseMultiplier({ standing: reading.multiplier, continuity: reading, pressurePenalty: 1 }), 1)
	})

	it('a breach costs standing immediately and starts the recovery clock', () => {
		const breached = recordBreach(createContinuityState(), 1)
		assert.ok(breached.score < CONTINUITY_CEILING)
		assert.equal(breached.breaches, 1)
		assert.ok(breached.daysRecovering > 0)
	})

	it('a quiet day changes nothing at all', () => {
		const before = createContinuityState()
		assert.deepEqual(advanceContinuity(before, 0.4), before)
	})

	it('recovery is partial: a breach is not undone by the next morning', () => {
		const breached = recordBreach(createContinuityState(), 1)
		const oneDay = advanceContinuity(breached, 0.5)
		assert.ok(oneDay.score > breached.score)
		assert.ok(oneDay.score < CONTINUITY_CEILING)
		assert.ok(oneDay.daysRecovering < breached.daysRecovering)
	})

	it('the last point is always recoverable: a house can climb the final point home', () => {
		// From 99 the declared 0.25 fraction is 0.25 of a point, and a plain round sends it straight
		// back to 99 - so a house could sit one point short forever, a permanent discount the player
		// could do nothing about. Found by a measured run, not by reading the code.
		const stranded = { score: 99, breaches: 3, daysRecovering: 0 }
		assert.equal(advanceContinuity(stranded, 0.25).score, CONTINUITY_CEILING)
	})

	it('a slow recovery is still slow: rounding up is only for the last point', () => {
		const low = { score: 40, breaches: 2, daysRecovering: 0 }
		const oneDay = advanceContinuity(low, 0.25)
		assert.ok(oneDay.score > 40, 'a day of quiet must still move the ladder')
		assert.ok(oneDay.score < 60, 'but it must not jump most of the way home')
	})

	it('a house given enough days returns to full neutrality and stops recovering', () => {
		let state = recordBreach(createContinuityState(), 3)
		for (let i = 0; i < 20; i++) state = advanceContinuity(state, 0.5)
		assert.equal(state.score, CONTINUITY_CEILING)
		assert.equal(state.daysRecovering, 0)
		const recovered = continuityReading(state)
		assert.equal(houseMultiplier({ standing: 1, continuity: recovered, pressurePenalty: 1 }), 1)
	})

	it('repeated incidents on one day cost more, but never end the house from one bad night', () => {
		const single = recordBreach(createContinuityState(), 1)
		const riot = recordBreach(createContinuityState(), 5)
		assert.ok(riot.score < single.score, 'a bad night should compound')
		assert.ok(riot.score >= CONTINUITY_FLOOR)
	})

	it('the discount is closed at both ends and never prices below half', () => {
		assert.equal(continuityMultiplier(CONTINUITY_CEILING), 1)
		assert.equal(continuityMultiplier(CONTINUITY_FLOOR), 0.5)
		assert.equal(continuityMultiplier(-40), 0.5)
		assert.equal(continuityMultiplier(400), 1)
	})

	it('a house under pressure is flagged for the High Table, and a safe one is not', () => {
		let state = createContinuityState()
		for (let i = 0; i < 6; i++) state = recordBreach(state, 1)
		const reading = continuityReading(state)
		assert.equal(reading.underPressure, reading.score < 40)
	})

	it('standing is a whole number and stays inside the band however hard it is hit', () => {
		let state = createContinuityState()
		for (let i = 0; i < 200; i++) state = recordBreach(state, 9)
		const reading = continuityReading(state)
		assert.equal(reading.score, CONTINUITY_FLOOR)
		assert.ok(Number.isInteger(reading.score))
	})
})

describe('what the house is worth', () => {
	const safe = continuityReading(createContinuityState())

	it('a house nobody has touched is worth exactly face value', () => {
		assert.equal(houseMultiplier({ standing: 1, continuity: safe, pressurePenalty: 1 }), 1)
	})

	it('a breach costs money, and the House standing on top of it costs more', () => {
		const breached = continuityReading(recordBreach(createContinuityState(), 1))
		const afterScene = houseMultiplier({ standing: 1, continuity: breached, pressurePenalty: 1 })
		const afterAudit = houseMultiplier({ standing: 1, continuity: breached, pressurePenalty: 0.5 })
		assert.ok(afterScene < 1, 'a scene must cost the house something')
		assert.ok(afterAudit < afterScene, 'an audit on top must cost more')
	})

	it('a bad queue and a bad night compound rather than one cancelling the other', () => {
		// The floor is 0.5, so a half-standing house with a scene and an audit reaches it. The claim
		// is that neither ladder can be ignored: a night that only costs a discount, and a queue that
		// only costs a discount, are each worse than the last - never restored by the other.
		const breached = continuityReading(recordBreach(createContinuityState(), 1))
		const queueOnly = houseMultiplier({ standing: 0.8, continuity: breached, pressurePenalty: 1 })
		const nightOnly = houseMultiplier({ standing: 0.5, continuity: breached, pressurePenalty: 0.5 })
		const both = houseMultiplier({ standing: 0.5, continuity: breached, pressurePenalty: 1 })
		assert.ok(nightOnly < queueOnly, 'standing and the world are different levers, not one')
		assert.ok(both <= nightOnly, 'a bad queue on top of a bad night is never an improvement')
	})

	it('the house can never be worth more than face value, whatever it is handed', () => {
		// A tampered or over-optimistic pressure reading must not pay a house a bonus.
		assert.equal(houseMultiplier({ standing: 2, continuity: safe, pressurePenalty: 5 }), 1)
		assert.equal(houseMultiplier({ standing: 1, continuity: safe, pressurePenalty: 5 }), 1)
	})

	it('a house at the worst on every ladder still trades, at a loss', () => {
		const worst = continuityReading(recordBreach(createContinuityState(), 50))
		const worth = houseMultiplier({ standing: 0.5, continuity: worst, pressurePenalty: 0.5 })
		assert.ok(worth < 1, 'a ruined house must still be worth less than face value')
		assert.ok(worth >= CONTINUITY_MONEY_FLOOR, `a ruined house still traded at ${worth}`)
	})

	it('recovering the house restores what it is worth, one ladder at a time', () => {
		const breached = continuityReading(recordBreach(createContinuityState(), 1))
		const lost = houseMultiplier({ standing: 1, continuity: breached, pressurePenalty: 1 })
		let state = recordBreach(createContinuityState(), 1)
		for (let i = 0; i < 40; i++) state = advanceContinuity(state, 0.5)
		const regained = houseMultiplier({ standing: 1, continuity: continuityReading(state), pressurePenalty: 1 })
		assert.ok(regained > lost)
		assert.equal(regained, 1)
	})

	it('the price of the credit is the share of the night the reading says is not kept', () => {
		// Face value costs nothing, and the worst reading costs the night whole - never more, and never
		// a refund: a worth above 1 would turn a good name into free money.
		assert.equal(priceOfCreditCents(10_000, 1), 0)
		assert.equal(priceOfCreditCents(10_000, 0.85), 1_500)
		assert.equal(priceOfCreditCents(10_000, CONTINUITY_MONEY_FLOOR), 5_000)
		assert.equal(priceOfCreditCents(10_000, 2), 0, 'a worth above face value paid the house')
		assert.equal(priceOfCreditCents(0, 0.5), 0)
		assert.equal(priceOfCreditCents(-100, 0.5), 0, 'a negative night became a debt')
		assert.equal(Number.isInteger(priceOfCreditCents(1_050, 0.85)), true, 'a fractional cent left the ledger')
		// A reading that is not a number charges nothing: this is the one place a derived figure takes
		// money out of the balance, so it fails toward the house rather than taking a night whole.
		assert.equal(priceOfCreditCents(10_000, Number.NaN), 0)
		assert.equal(priceOfCreditCents(Number.NaN, 0.5), 0)
	})
})
