/**
 * What the High Table does about a house that is not holding up its end.
 *
 * The pressure is a state, not an event: it accrues while the house is below notice and is spent
 * one day at a time as consequences, so a bad week compounds without the player having to be told
 * a rule exists. It reads `continuity.ts` and `standing-world.ts` rather than duplicating either
 * ladder - the House of Peace and the world outside it are separate questions, and this is only
 * the institution that connects them.
 */

/** Declared balances: what a day of pressure costs, what pays it back, and where an audit starts. */
export const PRESSURE_DAILY_COST_CENTS = 1_200
export const PRESSURE_RELEASE_DAY = 900

/** Declared balance. At this much outstanding pressure an auditor is sent, whatever the score says. */
export const HIGH_TABLE_AUDIT_ABOVE = 3 * PRESSURE_DAILY_COST_CENTS

export interface PressureState {
	/** Cents the House of Peace has already taken from the house, and has not been paid back. */
	readonly outstandingCents: number
	/** Closed days the house has been under notice. */
	readonly daysUnderPressure: number
	/** Auditors sent, and still in the building. */
	readonly audits: number
}

export function createPressureState(): PressureState {
	return { outstandingCents: 0, audits: 0, daysUnderPressure: 0 }
}

export interface PressureReading {
	readonly outstandingCents: number
	readonly daysUnderPressure: number
	readonly audits: number
	readonly underAudit: boolean
	/**
	 * What the pressure costs the business beyond the fine itself: an audited house loses clients
	 * before anyone has done anything wrong, which is the part a player can actually feel.
	 */
	readonly demandPenalty: number
}

/** Declared band: pressure never removes more than half the walk-ins, or a mistake ends the run. */
export function pressurePenalty(outstandingCents: number): number {
	// Clamped above as well as below: a negative balance (a house that overpaid, or a tampered
	// record) must not hand back MORE than face value, which would turn a penalty into a bonus.
	return Math.min(1, Math.max(0.5, 1 - Math.max(0, outstandingCents) / (HIGH_TABLE_AUDIT_ABOVE * 2)))
}

export function pressureReading(state: PressureState): PressureReading {
	const outstanding = Math.max(0, Math.floor(state.outstandingCents))
	return {
		outstandingCents: outstanding,
		daysUnderPressure: state.daysUnderPressure,
		audits: state.audits,
		underAudit: outstanding >= HIGH_TABLE_AUDIT_ABOVE,
		demandPenalty: pressurePenalty(outstanding),
	}
}

/**
 * The fine one closed day under notice costs, clamped to the money the house actually holds. The
 * ledger floors the bank at zero and this never goes past it, so a bankrupt house is not fined into
 * a debt the payroll rule did not already authorise. One rule, read by the settle and by the caller
 * that moves the money.
 */
export function dailyFineCents(bankCents: number): number {
	return Math.min(Math.max(0, Math.floor(bankCents)), PRESSURE_DAILY_COST_CENTS)
}

/**
 * One closed day of High Table business. A house under notice is fined, and the fine buys back a
 * little goodwill, so pressure is a treadmill rather than a countdown: standing still costs ground,
 * which is exactly the pressure a neutral house exists to relieve.
 */
export function settlePressure(
	state: PressureState,
	closed: { underNotice: boolean; bankCents: number },
): PressureState {
	if (!closed.underNotice) {
		// Back in good standing the House of Peace forgets, and forgives what it took.
		return { outstandingCents: 0, audits: 0, daysUnderPressure: 0 }
	}
	const fine = dailyFineCents(closed.bankCents)
	const outstanding = Math.max(0, state.outstandingCents + fine - PRESSURE_RELEASE_DAY)
	return {
		outstandingCents: outstanding,
		daysUnderPressure: state.daysUnderPressure + 1,
		// An audit is sent when the fines have stacked past the notice threshold, and stands down
		// once they have been paid back below it - the same boundary read in both directions.
		audits: outstanding >= HIGH_TABLE_AUDIT_ABOVE ? state.audits + 1 : 0,
	}
}
