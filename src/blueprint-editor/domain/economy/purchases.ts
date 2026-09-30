/**
 * The shop: the money that leaves the bank, and the one bonus that is paid into it for reasons other
 * than a service. A ledger that only ever receives is a scoreboard, so what the lobby can buy is
 * priced off the two declared balances it already earns and pays at: the tariff table and the day
 * wage. Nothing here is a second price list. And because every purchase is a price the game could
 * simply print, the payout side is held to the same discipline: it is a share of money the
 * simulation already measured, never a fresh income of its own.
 */
import { rateForTags } from './takings'
import { STAFF_DAY_WAGE_CENTS } from './upkeep'

/** Declared balance: a fixture costs this many days of what it itself bills. */
export const FIXTURE_COST_DAYS = 3

/**
 * Declared balance: every facility of the same kind the floor already holds adds this many days-of-
 * billing to the next one. A house with four bars is not the same house as one with four bars and a
 * free fifth, and a price that never moves makes the second purchase a copy of the first.
 */
export const FIXTURE_HOLDING_COST_DAYS = 1

/** Declared balance: a kind stops getting dearer here, so a large floor never becomes unbuyable. */
export const FIXTURE_MAX_COST_DAYS = 12

/** Declared balance: hiring a head costs this many days of the wage it will then draw forever. */
export const STAFF_HIRE_COST_DAYS = 5

/** Declared balance: what one goodwill repair costs. What it buys is `reputation.ts`'s rule. */
export const STANDING_REPAIR_COST_CENTS = 45_000

/**
 * Declared balance: what one message round the room to a wronged house costs. Four days of a head's
 * wage, and dearer per point than a standing repair (4,800 against 4,500) on purpose: mending one
 * faction is a narrower favour than restoring the room's own name, so it should not be the cheaper
 * route back to a full street. What it buys is `standing-world.ts`'s rule.
 */
export const FACTION_GOODWILL_COST_CENTS = 24_000

/**
 * Declared balance: a goal met on a closed day pays this share of what that day itself took, times
 * the streak it extends. Deliberately a share of measured takings rather than a flat sum: a lobby
 * that served nobody has no bonus to be paid, so the reward can scale a house's income but cannot
 * replace it.
 */
export const OBJECTIVE_REWARD_FRACTION = 0.02

/** Declared balance: past this many days a streak pays no further, so a long run beats a first night without compounding. */
export const OBJECTIVE_REWARD_STREAK_CAP = 5

/**
 * Declared balance: whatever the board asks for, one day's bonuses cannot exceed this share of that
 * day's own takings. The faucet cap - five goals at full streak would want 50% of the takings, and a
 * house that got paid that much would be graded on the bonus rather than on the lobby.
 */
export const OBJECTIVE_REWARD_DAY_CAP_FRACTION = 0.25

/**
 * Only a facility that bills can be bought. A tag the tariff table does not price is free seating,
 * and free seating is not something a player should be able to purchase more of - it earns nothing,
 * so it would be a pure burn with no service behind it.
 */
export function fixturePriceCents(tags: readonly string[] | undefined, ownedCount = 0): number | null {
	const rate = rateForTags(tags ?? [])
	if (!rate) return null
	const days = Math.min(
		FIXTURE_COST_DAYS + FIXTURE_HOLDING_COST_DAYS * Math.max(0, Math.floor(ownedCount)),
		FIXTURE_MAX_COST_DAYS,
	)
	return rate.cents * days
}

/**
 * Declared balance: what a fixture comes back as when the house trades it in. Half of what the first
 * one of its kind cost - deliberately not half of what the player paid, because the holding premium
 * bought scarcity, not an asset: five bars on the floor cost more each, and selling one returns the
 * price of the trade, not the value of the crowding.
 */
export const FIXTURE_SALE_FRACTION = 0.5

/** The trade-in: what the fixture bills, for half the days a first one costs. Null is nothing to sell. */
export function fixtureSaleCents(tags: readonly string[] | undefined): number | null {
	const full = fixturePriceCents(tags, 0)
	return full === null ? null : Math.floor(full * FIXTURE_SALE_FRACTION)
}

/**
 * How many of each billable facility the floor holds, keyed by the tag that bills it and counted
 * through `rateForTags` - the same rule that prices and bills a fixture, so a table that is both
 * `dining` and `lounge` counts once, as the thing it actually is.
 */
export function facilityHoldings(tagLists: readonly (readonly string[])[]): Map<string, number> {
	const holdings = new Map<string, number>()
	for (const tags of tagLists) {
		const rate = rateForTags(tags)
		if (!rate) continue
		holdings.set(rate.tag, (holdings.get(rate.tag) ?? 0) + 1)
	}
	return holdings
}

/** How many of the kind this asset belongs to the floor already holds, in the shop's own terms. */
export function holdingCountFor(holdings: ReadonlyMap<string, number>, tags: readonly string[] | undefined): number {
	const rate = rateForTags(tags ?? [])
	return rate ? holdings.get(rate.tag) ?? 0 : 0
}

/** A new head is priced against the wage it adds to every closed day from now on. */
export function staffHirePriceCents(): number {
	return STAFF_DAY_WAGE_CENTS * STAFF_HIRE_COST_DAYS
}

/** The bank covers the price exactly at the boundary; it never covers a partial purchase. */
export function affordable(bankCents: number, priceCents: number): boolean {
	return Math.floor(bankCents) >= Math.floor(priceCents)
}

/** A goal, read only for what it is worth: whether the day met it and the streak it now carries. */
export interface RewardableGoal {
	readonly met: boolean
	readonly streak: number
}

export interface ObjectiveReward {
	/** Whole cents the closed day is worth on top of its own takings. */
	readonly cents: number
	/** True when the board wanted more than the day cap allows, so a capped night says so rather than looking miscalculated. */
	readonly capped: boolean
}

/**
 * What a closed day's board is worth. The caller passes the streaks *after* the day folded them, so
 * the night that just ended is the night being paid for - a board read before the fold would pay for
 * yesterday's run and leave today's met and unpaid.
 */
export function objectiveRewardCents(input: {
	lastDayCents: number
	goals: readonly RewardableGoal[]
}): ObjectiveReward {
	const day = Math.max(0, Math.floor(input.lastDayCents))
	let wanted = 0
	for (const goal of input.goals) {
		if (!goal.met) continue
		wanted += day * OBJECTIVE_REWARD_FRACTION * Math.min(Math.max(0, goal.streak), OBJECTIVE_REWARD_STREAK_CAP)
	}
	const ceiling = day * OBJECTIVE_REWARD_DAY_CAP_FRACTION
	return { cents: Math.floor(Math.min(wanted, ceiling)), capped: wanted > ceiling }
}
