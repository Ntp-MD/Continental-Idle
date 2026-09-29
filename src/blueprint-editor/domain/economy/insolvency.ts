/**
 * Insolvency as a state, not a number. A day the bank cannot pay takes staff off the floor, so an
 * over-staffed lobby is told by what it stops doing rather than by a red figure on a panel. The wage
 * rule stays `upkeep.ts`'s; this module only decides who is still on shift after it.
 */

/**
 * Declared balance. The crew that stays on shift even when the day cannot be paid: without it an
 * unpaid day is unrecoverable - no staff, no service, no takings, and the next day cannot be paid
 * either. Two is the smallest crew that can still open a lobby.
 */
export const STAFF_MIN_CREW = 2

export interface StaffStrike {
	readonly onDuty: number
	readonly offDuty: number
	readonly insolvent: boolean
}

/**
 * Heads the bank can keep on shift: what it covers at the day wage, floored at the minimum crew and
 * capped at the deployment. `bankCents` is the money available *to* the payroll, not what is left
 * after it.
 */
export function staffOnDuty(bankCents: number, staffHeadcount: number, wageCents: number): number {
	const heads = Math.max(0, Math.floor(staffHeadcount))
	if (heads === 0) return 0
	const payable = Math.floor(Math.max(0, bankCents) / Math.max(1, wageCents))
	// The floor is what makes the state survivable; the cap is what makes it a consequence.
	return Math.min(heads, Math.max(payable, Math.min(STAFF_MIN_CREW, heads)))
}

/** The crew split for one day's payroll. */
export function settleStrike(input: {
	bankCents: number
	staffHeadcount: number
	wageCents: number
}): StaffStrike {
	const heads = Math.max(0, Math.floor(input.staffHeadcount))
	const onDuty = staffOnDuty(input.bankCents, heads, input.wageCents)
	return { onDuty, offDuty: heads - onDuty, insolvent: heads - onDuty > 0 }
}

/**
 * Read the strike off a closed day. The wages actually paid are `payroll - unpaid`, so that is the
 * money the crew was really funded from: a day that paid in full funds every head deployed and brings
 * the whole crew back, a shortfall keeps exactly the heads it covered (never fewer than the minimum
 * crew). The leftover balance is deliberately not the measure - paying a bill in full can still leave
 * less in the bank than the bill itself.
 */
export function strikeFromClose(close: {
	payrollCents: number
	unpaidCents: number
	staffHeadcount: number
	wageCents: number
}): StaffStrike {
	const funded = Math.max(0, close.payrollCents - close.unpaidCents)
	return settleStrike({ bankCents: funded, staffHeadcount: close.staffHeadcount, wageCents: close.wageCents })
}
