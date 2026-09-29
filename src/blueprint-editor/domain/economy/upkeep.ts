/**
 * Payroll: the other side of the takings ledger. A crowd that is only ever counted as customers makes
 * every plan look profitable, so the staff half of the same deployment is priced here.
 */

/** Declared balance, same standing as the tariff table: one staff member costs this per hotel day. */
export const STAFF_DAY_WAGE_CENTS = 6_000

export interface DailySettlement {
	readonly staffHeadcount: number
	readonly payrollCents: number
	/** Wages the bank could not cover. Written off as money, kept as a state - see `insolvency.ts`. */
	readonly unpaidWagesCents: number
	/** False only while every head deployed that day was actually paid for. */
	readonly insolvent: boolean
	/** Income minus payroll. Negative means the lobby is paying for its own crowd. */
	readonly profitCents: number
	readonly selfFunding: boolean
	/** Days of bank left at this burn; null while the day is not losing money. */
	readonly runwayDays: number | null
}

/**
 * Headcount of the roles that work, not the roles that visit: the same visitor rule the ledger bills
 * with, read the other way round.
 */
export function staffHeadcount(pool: readonly { roleId: string; count: number }[], isVisitor: (roleId: string) => boolean): number {
	let total = 0
	for (const entry of pool) {
		if (isVisitor(entry.roleId)) continue
		total += Math.max(0, Math.floor(entry.count))
	}
	return total
}

/**
 * The wage rule, in one place, so the ledger's day charge and the panel's projection cannot drift.
 * Expects a headcount already produced by `staffHeadcount` or `settleDay`, both of which clamp.
 */
export function payrollCents(staffHeadcount: number): number {
	return staffHeadcount * STAFF_DAY_WAGE_CENTS
}

/**
 * `incomeCents` is expected already net of standing: bad service shrinking income is reputation's
 * job, so folding a second penalty in here would charge the same failure twice.
 */
export function settleDay(input: {
	bankCents: number
	incomePerDayCents: number
	staffHeadcount: number
}): DailySettlement {
	const staff = Math.max(0, Math.floor(input.staffHeadcount))
	const payroll = payrollCents(staff)
	const paidCents = Math.min(Math.max(0, Math.floor(input.bankCents)), payroll)
	const profitCents = Math.round(input.incomePerDayCents) - payroll
	const selfFunding = profitCents >= 0
	return {
		staffHeadcount: staff,
		payrollCents: payroll,
		unpaidWagesCents: payroll - paidCents,
		insolvent: payroll - paidCents > 0,
		profitCents,
		selfFunding,
		// Floor, not round: "one day of runway" that is really 0.4 days is still bankrupt tomorrow.
		runwayDays: selfFunding ? null : Math.floor(Math.max(0, input.bankCents) / -profitCents),
	}
}
