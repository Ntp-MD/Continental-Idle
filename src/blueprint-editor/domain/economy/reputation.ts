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
