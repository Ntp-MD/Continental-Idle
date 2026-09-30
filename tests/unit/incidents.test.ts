import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { INCIDENT_MAX_PER_DAY, INCIDENT_RATE_THRESHOLD, settleDayIncidents } from '@/blueprint-editor/domain/economy/incidents'

describe('scenes in the house', () => {
	it('a room where nobody is blocked commits no scene at all', () => {
		assert.equal(settleDayIncidents({ blockedThisDay: 0, presentAgentTicks: 100_000 }), 0)
	})

	it('an empty house cannot commit a scene, however many agents are said to have jammed', () => {
		// Zero presence is not "an infinite rate of violence" - it is an unmeasured night.
		assert.equal(settleDayIncidents({ blockedThisDay: 500, presentAgentTicks: 0 }), 0)
	})

	it('a busy but orderly room is not a fight: the rate is per agent-tick, not absolute', () => {
		// The same blocked-per-agent ratio at two very different room sizes. If the charge were
		// absolute, the larger plan would be punished for its size rather than for its shape.
		const small = settleDayIncidents({ blockedThisDay: 10, presentAgentTicks: 100_000 })
		const large = settleDayIncidents({ blockedThisDay: 100, presentAgentTicks: 1_000_000 })
		assert.equal(small, large)
	})

	it('an orderly room pays nothing however long the night runs', () => {
		// Well below the declared rate over a whole day of agent-ticks.
		const agentTicks = 100_000
		assert.ok(1 / agentTicks < INCIDENT_RATE_THRESHOLD)
		assert.equal(settleDayIncidents({ blockedThisDay: 1, presentAgentTicks: agentTicks }), 0)
	})

	it('a room below the line is not rounded up into one', () => {
		// The gap between the two rules: the rate is below the declared line, but the severity it
		// would be scaled by rounds to a whole scene. The line has to win, or "a rate, not a count"
		// would be a rate that charges a single blocked agent in a quiet house. Half the threshold is
		// where the two rules disagree most, so it is where the room is tested.
		const rate = INCIDENT_RATE_THRESHOLD * 0.75
		const present = 4_000
		const blocked = Math.round(rate * present)
		assert.ok(blocked > 0, 'the room did have blocked agents in it')
		assert.equal(blocked / present / INCIDENT_RATE_THRESHOLD, 0.75, 'the severity rounds to a whole scene')
		assert.equal(settleDayIncidents({ blockedThisDay: blocked, presentAgentTicks: present }), 0,
			'a room under the line pays nothing, however many scenes its fraction rounds to')
	})

	it('a room that cannot pass anyone is charged, and more so the worse it gets', () => {
		const gentle = settleDayIncidents({ blockedThisDay: 200, presentAgentTicks: 100_000 })
		const brutal = settleDayIncidents({ blockedThisDay: 800, presentAgentTicks: 100_000 })
		assert.ok(gentle > 0, 'a jammed room must cost the house something')
		assert.ok(brutal > gentle, 'a worse night must cost more')
	})

	it('the charge is capped, so one pathological frame cannot end the house', () => {
		assert.equal(settleDayIncidents({ blockedThisDay: 1_000_000, presentAgentTicks: 1 }), INCIDENT_MAX_PER_DAY)
	})

	it('a second close on the same day charges nothing twice', () => {
		// The same once-per-close discipline the payroll strike uses: the ledger clears its tally, so
		// a re-settle with nothing new must not re-add the severity.
		const first = settleDayIncidents({ blockedThisDay: 200, presentAgentTicks: 100_000 })
		const second = settleDayIncidents({ blockedThisDay: 0, presentAgentTicks: 100_000, charge: first })
		assert.equal(second, first)
	})

	it('the charge is a whole number, so a day can never settle for a fraction of a scene', () => {
		for (let n = 1; n < 60; n++) {
			const charge = settleDayIncidents({ blockedThisDay: n * 3, presentAgentTicks: 50_000 })
			assert.ok(Number.isInteger(charge), `charged ${charge} for ${n} blocked agents`)
		}
	})
})
