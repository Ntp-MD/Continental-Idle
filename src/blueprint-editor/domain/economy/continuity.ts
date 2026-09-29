/**
 * The rule the whole world turns on: the Continental is a neutral ground.
 *
 * Every other economy module prices a *service*. This one prices the room itself, and it reads the
 * engine's own event stream rather than a flag a designer sets, so a plan that cannot keep the peace
 * earns less without a rule having to say so. A shooting is a `blocked` event the engine already
 * emits when an agent cannot pass - the same evidence `arch takings` prints, read for its meaning
 * instead of its cost.
 */

/**
 * Declared balance. A scene costs this much standing on the day it happens, and takes this many days
 * to forget. Zero on both would make a single incident end the game, which is a punishment, not a
 * consequence; unbounded on both would make the rule cosmetic.
 */
export const NEUTRALITY_BREACH_COST = 25
export const NEUTRALITY_RECOVERY_DAYS = 3

/**
 * Declared balance. The share of the gap to full safety that one closed day closes. Below 1, so a
 * night of gunfire is not undone by the following morning - the player has to hold the peace, and
 * cannot buy the recovery back the way `purchases.ts` lets them buy standing.
 */
export const NEUTRALITY_RECOVERY_FRACTION = 0.25

/** Declared balance: below this standing the High Table notices, and a door is the response. */
export const HIGH_TABLE_ATTENTION_STANDING = 40

/**
 * Standing is 0-100 and bounded at both ends, so the worst a room can fall to is still a room the
 * player can rebuild. Same clamp discipline as `reputation.ts`; the two ladders are different
 * things (a bad queue vs a breach of neutrality) and are added, never merged.
 */
export const CONTINUITY_FLOOR = 0
export const CONTINUITY_CEILING = 100

function clamp(value: number): number {
	return Math.min(CONTINUITY_CEILING, Math.max(CONTINUITY_FLOOR, Math.round(value)))
}

export interface ContinuityReading {
	/** How safe the house is, 0-100. Starts neutral; a breach pushes it down over days. */
	readonly score: number
	/** True when the High Table is watching closely enough to act on. */
	readonly underPressure: boolean
	/**
	 * What the house is worth to a client, as a multiplier. Deliberately the weakest of the three
	 * levers (standing and the tariff both move faster) because neutrality is a floor, not a driver:
	 * a pristine lobby that serves nobody still earns nothing.
	 */
	readonly multiplier: number
	/** Incidents counted since the run started. Kept so the HUD can name the number, not a feeling. */
	readonly breaches: number
	readonly daysRecovering: number
}

/** Declared band: a breached house still takes clients, at a discount that bottoms out at half. */
export function continuityMultiplier(score: number): number {
	return 0.5 + clamp(score) / 200
}

export interface ContinuityState {
	score: number
	breaches: number
	/** Days still to run before the last breach stops costing. Zero once recovered. */
	daysRecovering: number
}

export function createContinuityState(): ContinuityState {
	// A fresh deployment is a fresh house: the player has just opened, and the world owes it nothing.
	return { score: CONTINUITY_CEILING, breaches: 0, daysRecovering: 0 }
}

/**
 * A breach costs standing immediately, and the cost deepens for each further day the house is known
 * to be unsafe. A single bad night is a wound; a week of them is a reputation. This is why the
 * recovery timer exists: the player can pay for a new front, but the street takes time to forget.
 */
export function recordBreach(state: ContinuityState, breachesOnDay: number): ContinuityState {
	if (breachesOnDay <= 0) return state
	// Repeated incidents on one day compound rather than summing: five scenes is not five times the
	// damage of one, it is the same bad night counted five times, and a linear sum would end the
	// house from a single busy evening.
	const weight = 1 + Math.log2(1 + breachesOnDay - 1)
	const cost = Math.round(NEUTRALITY_BREACH_COST * weight)
	return {
		score: clamp(state.score - cost),
		breaches: state.breaches + breachesOnDay,
		daysRecovering: Math.max(state.daysRecovering, NEUTRALITY_RECOVERY_DAYS),
	}
}

/**
 * One closed day moves the house back toward safety by a declared share of the gap. Below 1, so a
 * night of gunfire is not undone by the following morning - the player has to hold the peace.
 *
 * Recovery is unconditional and the countdown is only a readout. Gating the climb on the countdown
 * would strand the house partway at whatever the last breach left, with no way back to full: a
 * single incident then costs a permanent slice of income that no amount of careful play repairs.
 */
export function advanceContinuity(state: ContinuityState, perDayFraction: number): ContinuityState {
	const fraction = Math.min(1, Math.max(0, perDayFraction))
	// The climb is rounded up whenever it is the last point missing, because the score is a whole
	// number and a plain round strands a house at 99 forever: from 99 the day's gain is 0.25, which
	// rounds straight back to 99, so no amount of quiet could ever restore it. The measured run hit
	// exactly that - 99 after thirty quiet days - which is a permanent discount the player can do
	// nothing about. Anything larger still rounds normally, so a slow recovery stays slow.
	const gained = (CONTINUITY_CEILING - state.score) * fraction
	const score = clamp(state.score + (gained > 0 && gained < 1 ? 1 : gained))
	// Only the deficit counts, so an empty countdown cannot be extended by days the house was
	// already safe, and a house back at full has nothing left to remember.
	const daysRecovering = score >= CONTINUITY_CEILING ? 0 : Math.max(0, state.daysRecovering - 1)
	return { score, breaches: state.breaches, daysRecovering }
}

export function continuityReading(state: ContinuityState): ContinuityReading {
	const score = clamp(state.score)
	return {
		score,
		underPressure: score < HIGH_TABLE_ATTENTION_STANDING,
		multiplier: continuityMultiplier(score),
		breaches: state.breaches,
		daysRecovering: state.daysRecovering,
	}
}

/**
 * What the house is actually worth on the night, after every ladder that has an opinion about it.
 *
 * Three multipliers, multiplied once, in one place. This is deliberately a *reader* of money rather
 * than a writer: the ledger still owns the bank and still counts whole cents at face value, exactly
 * as `netOf` prices a service against the standing it earned. A breached house is not billed less -
 * it is *worth* less, which is a different thing and the reason the discount lives here and not in
 * the tariff.
 *
 * Continuity and pressure are pulled toward 1 rather than applied raw, so a house that has never
 * been breached is a factor of exactly 1 whatever the High Table has on account. Without that, a
 * fresh house would open at 0.5 x 0.5 and halve its own income for a crisis it has not had.
 */
export function houseMultiplier(input: {
	readonly standing: number
	readonly continuity: ContinuityReading
	readonly pressurePenalty: number
}): number {
	// 0.9 is the declared floor each world's own multiplier already bottoms out at, so a house at
	// the worst on both ladders still takes 0.81 of face value rather than collapsing to a quarter.
	const continuityFactor = 0.9 + input.continuity.multiplier * 0.1
	const pressureFactor = 0.9 + Math.min(1, Math.max(0, input.pressurePenalty)) * 0.1
	const raw = Math.min(1, Math.max(0, input.standing)) * continuityFactor * pressureFactor
	// A floor, and a load-bearing one. Without it the three ladders compound: 0.5 standing x a
	// breached house x an audit is 0.45, and a house that has had a bad month can no longer pay a
	// wage, so it can never recover, so the bad month never ends. The floor keeps a ruined house
	// tradable at a loss, which is what makes climbing back out of one a decision rather than an
	// impossibility.
	return Math.max(CONTINUITY_MONEY_FLOOR, raw)
}

/** Declared balance. The worst any house can be worth, so a bad month is survivable. */
export const CONTINUITY_MONEY_FLOOR = 0.5
