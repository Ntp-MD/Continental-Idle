/**
 * Reputation: what the crowd's experience is worth.
 *
 * Derived from counted outcomes only - services completed against visits that were lost at a line -
 * so there is no hidden state to drift and no per-event valuation to invent. A walk-out already costs
 * the one spend nobody made; this is the second, slower cost: the room itself earns less.
 */

/** Declared game feel. A hotel that has served nobody yet is neither trusted nor ruined. */
export const REPUTATION_NEUTRAL = 70

/** The worst a hotel can fall to, as a score. Kept above zero so a bad room is still tradable. */
export const REPUTATION_FLOOR = 0

/**
 * A declared band, and the reason it is not 1:1. At full trust a room earns its face value; at the
 * floor it still earns half, so a congested lobby shrinks income without ever flatlining it.
 */
export function incomeMultiplier(score: number): number {
	const clamped = Math.min(100, Math.max(REPUTATION_FLOOR, score))
	return (0.5 + clamped / 200)
}

export interface ReputationReading {
	readonly score: number
	readonly multiplier: number
	/** True when there is no evidence yet, so the score shown is the neutral default. */
	readonly unproven: boolean
	readonly servedShare: number
}

export function readReputation(served: number, walkOuts: number): ReputationReading {
	const attempts = served + walkOuts
	if (attempts <= 0) {
		return { score: REPUTATION_NEUTRAL, multiplier: incomeMultiplier(REPUTATION_NEUTRAL), unproven: true, servedShare: 0 }
	}
	const servedShare = served / attempts
	const score = Math.round(REPUTATION_FLOOR + (100 - REPUTATION_FLOOR) * servedShare)
	return { score, multiplier: incomeMultiplier(score), unproven: false, servedShare }
}

/** Gross takings are the ledger's; net is what the room actually banked at its current standing. */
export function netOf(grossCents: number, reading: ReputationReading): number {
	return Math.round(grossCents * reading.multiplier)
}

/**
 * Declared recovery: the share of the gap to the counted evidence that one closed hotel day closes.
 * Below 1 on purpose - a lobby that fixes its queue does not restore goodwill the same afternoon.
 */
export const REPUTATION_RECOVERY_FRACTION = 0.4

/** Declared balance: how many points one goodwill repair buys. Its price is `purchases.ts`'s. */
export const STANDING_REPAIR_POINTS = 10

function clampScore(score: number): number {
	return Math.min(100, Math.max(REPUTATION_FLOOR, Math.round(score)))
}

/** The one standing clamp, so a restored record and a repair cannot disagree on the band. */
export function clampStanding(score: number): number {
	return clampScore(score)
}

/**
 * One closed day moves standing part of the way toward what the crowd's counted outcomes say. Lag is
 * the mechanic: one bad day does not finish a room, and a fixed queue does not heal it instantly. The
 * evidence is the run's cumulative served-against-lost share, so standing converges toward it.
 */
export function advanceStanding(score: number, evidence: ReputationReading): number {
	const from = clampScore(score)
	const fraction = Math.min(1, Math.max(0, REPUTATION_RECOVERY_FRACTION))
	return clampScore(from + (evidence.score - from) * fraction)
}

/**
 * Bought goodwill repairs damage; it does not buy a reputation the crowd did not give, so the lift
 * stops at neutral. At or above neutral there is nothing to repair and the purchase is refused.
 */
export function repairStanding(score: number): { readonly score: number; readonly repaired: boolean } {
	const from = clampScore(score)
	if (from >= REPUTATION_NEUTRAL) return { score: from, repaired: false }
	return { score: Math.min(REPUTATION_NEUTRAL, from + STANDING_REPAIR_POINTS), repaired: true }
}

/** The reading money is multiplied by: the standing the room holds now, judged against its evidence. */
export function standingReading(score: number, evidence: ReputationReading): ReputationReading {
	const clamped = clampScore(score)
	return {
		score: clamped,
		multiplier: incomeMultiplier(clamped),
		unproven: evidence.unproven,
		servedShare: evidence.servedShare,
	}
}
