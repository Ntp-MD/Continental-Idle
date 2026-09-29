/**
 * Money going out. A ledger that only ever receives is a scoreboard, so what the lobby can buy is
 * priced off the two declared balances it already earns and pays at: the tariff table and the day
 * wage. Nothing here is a second price list.
 */
import { rateForTags } from './takings'
import { STAFF_DAY_WAGE_CENTS } from './upkeep'

/** Declared balance: a fixture costs this many days of what it itself bills. */
export const FIXTURE_COST_DAYS = 3

/** Declared balance: hiring a head costs this many days of the wage it will then draw forever. */
export const STAFF_HIRE_COST_DAYS = 5

/** Declared balance: what one goodwill repair costs. What it buys is `reputation.ts`'s rule. */
export const STANDING_REPAIR_COST_CENTS = 45_000

/**
 * Only a facility that bills can be bought. A tag the tariff table does not price is free seating,
 * and free seating is not something a player should be able to purchase more of - it earns nothing,
 * so it would be a pure burn with no service behind it.
 */
export function fixturePriceCents(tags: readonly string[] | undefined): number | null {
	const rate = rateForTags(tags ?? [])
	return rate ? rate.cents * FIXTURE_COST_DAYS : null
}

/** A new head is priced against the wage it adds to every closed day from now on. */
export function staffHirePriceCents(): number {
	return STAFF_DAY_WAGE_CENTS * STAFF_HIRE_COST_DAYS
}

/** The bank covers the price exactly at the boundary; it never covers a partial purchase. */
export function affordable(bankCents: number, priceCents: number): boolean {
	return Math.floor(bankCents) >= Math.floor(priceCents)
}
