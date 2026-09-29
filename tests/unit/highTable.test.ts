import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
	advanceContinuity,
	createContinuityState,
	continuityReading,
	recordBreach,
} from '@/blueprint-editor/domain/economy/continuity'
import {
	createPressureState,
	HIGH_TABLE_AUDIT_ABOVE,
	pressurePenalty,
	pressureReading,
	settlePressure,
} from '@/blueprint-editor/domain/economy/highTable'

describe('the House of Peace', () => {
	it('a house holding its neutrality pays nothing and is forgotten', () => {
		const state = createPressureState()
		const settled = settlePressure(state, { underNotice: false, bankCents: 100_000 })
		assert.deepEqual(settled, state)
		assert.equal(pressureReading(settled).underAudit, false)
	})

	it('a house under notice is fined each day it stays under notice', () => {
		let state = createPressureState()
		const before = pressureReading(state).outstandingCents
		state = settlePressure(state, { underNotice: true, bankCents: 100_000 })
		assert.ok(pressureReading(state).outstandingCents > before)
		assert.equal(pressureReading(state).daysUnderPressure, 1)
	})

	it('the fine never takes money the house does not have', () => {
		const broke = settlePressure(createPressureState(), { underNotice: true, bankCents: 0 })
		assert.equal(pressureReading(broke).outstandingCents, 0)
		assert.equal(pressureReading(broke).demandPenalty, 1, 'an unfunded fine is not a punishment')
	})

	it('standing still costs ground: a bankrupt house falls further behind every day', () => {
		let state = createPressureState()
		for (let i = 0; i < 5; i++) state = settlePressure(state, { underNotice: true, bankCents: 0 })
		assert.equal(pressureReading(state).outstandingCents, 0)
		// Nothing owed when nothing could be paid, but the House has taken note.
		assert.ok(pressureReading(state).daysUnderPressure >= 5)
	})

	it('an audited house is called out once fines have stacked past the notice threshold', () => {
		let state = createPressureState()
		for (let i = 0; i < 12; i++) state = settlePressure(state, { underNotice: true, bankCents: 100_000 })
		assert.ok(pressureReading(state).outstandingCents >= HIGH_TABLE_AUDIT_ABOVE)
		assert.equal(pressureReading(state).underAudit, true)
		assert.ok(pressureReading(state).audits > 0)
	})

	it('returning to good standing clears the House entirely', () => {
		let state = createPressureState()
		for (let i = 0; i < 12; i++) state = settlePressure(state, { underNotice: true, bankCents: 100_000 })
		const forgiven = settlePressure(state, { underNotice: false, bankCents: 100_000 })
		assert.equal(pressureReading(forgiven).outstandingCents, 0)
		assert.equal(pressureReading(forgiven).audits, 0)
		assert.equal(pressureReading(forgiven).daysUnderPressure, 0)
	})

	it('the demand penalty is closed at both ends and never removes more than half the walk-ins', () => {
		assert.equal(pressurePenalty(0), 1)
		assert.equal(pressurePenalty(-500), 1)
		assert.equal(pressurePenalty(HIGH_TABLE_AUDIT_ABOVE * 2), 0.5)
		assert.equal(pressurePenalty(HIGH_TABLE_AUDIT_ABOVE * 50), 0.5)
	})

	it('pressure and neutrality are one story, not two: a breach is what brings the House', () => {
		// A house that holds neutrality is never noticed, whatever its bank looks like.
		const safe = continuityReading(advanceContinuity(createContinuityState(), 0.5))
		assert.equal(safe.underPressure, false)
		let broken = recordBreach(createContinuityState(), 1)
		for (let i = 0; i < 4; i++) broken = recordBreach(broken, 1)
		assert.equal(continuityReading(broken).underPressure, true)
	})
})
