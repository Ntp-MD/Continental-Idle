import type { NpcEngineEvent } from '@/engine/npc'
import { settleDayIncidents } from './incidents'

/**
 * The Continental's business: money exists only where a visitor completed a service, so a plan that
 * cannot circulate earns less without any rule having to say so.
 *
 * The tariff is priced off the world, not off a hotel rate card. A room here is a place to disappear
 * in, a contract is the actual product, and the bar is the only trade that never touches the High
 * Table. Every figure is a declared balance: there is no corpus source for what an assassin is worth.
 */

/** Declared balance figures - game economy, not a building code. No source in the corpus. */
export const TAKING_RATES_CENTS: Readonly<Record<string, number>> = {
	// Accepting a contract books a retainer. It is the floor of the business, not the prize.
	'contract-board': 2400,
	// Closing one is the whole product: the room's real product is a finished contract.
	'contract-closed': 4800,
	// The chamberlain is where a mark becomes a client. A name is worth more than a drink.
	'chamberlain': 1800,
	// The bar is the one service with no contract behind it, and the smallest reliable earner.
	'bar': 850,
	// The kitchen that keeps the staff on their feet for a night that may run long.
	'kitchen': 450,
	// A guest in a back room is out of the world: they spend, and they do not cause a scene.
	'chambers': 300,
	// A table where people are negotiated with rather than served.
	'back-room': 1200,
	// Medical: a Continental that cannot patch its own people cannot hold a contract.
	'infirmary': 700,
}

/** Rolling window the income rate is measured over, in simulation seconds. */
export const TAKINGS_RATE_WINDOW_SECONDS = 30

/**
 * One hotel day, in simulation seconds. Declared game tempo, not a building rule: the engine runs
 * 10 ticks per second, so a day is 30 wall-clock seconds at 1x and under 4 at 8x - short enough that
 * a plan's daily income is readable inside one sitting, long enough for the crowd to circulate.
 */
export const TAKINGS_DAY_SECONDS = 300

const POST_TAG_PREFIX = 'post:'

export interface TakingsSource {
	readonly roleId: string
	readonly tags: readonly string[]
}

/** Resolves what an event's agent was actually standing at. Undefined = agent unknown. */
export type TakingsResolver = (event: NpcEngineEvent) => TakingsSource | undefined

/** The lookups a resolver needs, supplied by whoever owns the engine and its target index. */
export interface TakingsSourceIndex {
	roleOf(agentId: string): string | undefined
	tagsFor(floorId: string, itemId: string, interactSpotId: string): readonly string[] | undefined
}

export function createTakingsResolver(index: TakingsSourceIndex): TakingsResolver {
	return event => {
		const roleId = index.roleOf(event.agentId)
		if (roleId === undefined) return undefined
		const tags =
			event.itemId !== undefined && event.interactSpotId !== undefined
				? index.tagsFor(event.floorId, event.itemId, event.interactSpotId) ?? []
				: []
		return { roleId, tags }
	}
}

export interface TakingsLedgerOptions {
	readonly ticksPerSecond: number
	/** A role that consumes rather than works. */
	isVisitor(roleId: string): boolean
	/** What one closed hotel day costs the operator - payroll, charged when the day book rolls. */
	readonly dailyChargeCents?: () => number
	/**
	 * Called once per closed hotel day, with the counted outcomes so far. Standing is not money, so the
	 * ledger does not own it - but the day boundary is the ledger's, and both surfaces (app and arch
	 * tool) must recover on the same boundary or their readings cannot be compared.
	 */
	readonly onDayClose?: (day: { day: number; served: number; walkOuts: number; incidents: number }) => void
	readonly rates?: Readonly<Record<string, number>>
	readonly rateWindowSeconds?: number
	readonly daySeconds?: number
}

export interface TakingsByTag {
	readonly tag: string
	readonly cents: number
	readonly count: number
}

export interface TakingsSnapshot {
	readonly bankCents: number
	/** Balance carried in by deposits, which survives a reset because no re-deploy un-earns money. */
	readonly carriedCents: number
	/** Billable interactions completed by visitors. */
	readonly served: number
	/** Visitors that gave up waiting in a line: a lost sale, and the only cost signal a slow plan pays. */
	readonly walkOuts: number
	/** Visitors that left a line because its facility became unavailable - a different cause, counted apart. */
	readonly queueAbandons: number
	readonly perMinuteCents: number
	readonly simSeconds: number
	readonly byTag: readonly TakingsByTag[]
	/** Hotel days closed since the run started, and what the last one earned. */
	readonly daysCompleted: number
	readonly lastDayCents: number
	/** The payroll the last closed day billed, and the part of it the bank did not cover. */
	readonly lastDayPayrollCents: number
	readonly lastDayUnpaidCents: number
	readonly todayCents: number
	/** Live rate projected onto a full day, not a measured day total. */
	readonly perDayCents: number
	readonly servicesPerDay: number
}

function isPostTag(tag: string): boolean {
	return tag.startsWith(POST_TAG_PREFIX)
}

/**
 * One rule for who counts as a customer: a role that holds no duty post consumes, every other
 * role works. Both the running simulation and the offline measurement read it here.
 */
export function visitorRoleIds(roles: readonly { id: string; taskIds: readonly string[] }[]): Set<string> {
	return new Set(roles.filter(role => role.taskIds.length === 0).map(role => role.id))
}

/**
 * One payment per interaction, at the best rate its tags qualify for: a table that is
 * both `dining` and `lounge` bills as dining, and a free-standing seat bills as nothing.
 */
export function rateForTags(
	tags: readonly string[],
	rates: Readonly<Record<string, number>> = TAKING_RATES_CENTS,
): { readonly tag: string; readonly cents: number } | null {
	if (tags.some(isPostTag)) return null
	let best: { tag: string; cents: number } | null = null
	for (const tag of tags) {
		const cents = rates[tag]
		if (cents === undefined) continue
		if (!best || cents > best.cents) best = { tag, cents }
	}
	return best
}

export function formatTakings(cents: number): string {
	// A loss is displayable now that payroll exists, and the modulo of a negative number would
	// otherwise print a second sign in the fraction ("-120.-0").
	const sign = cents < 0 ? '-' : ''
	const abs = Math.floor(Math.abs(cents))
	const whole = Math.floor(abs / 100)
	const frac = String(abs % 100).padStart(2, '0')
	return `${sign}${whole.toLocaleString('en-US')}.${frac}`
}

export interface TakingsLedger {
	/**
	 * Feed one drained batch of engine events, stamped with the engine's current tick. `present` is
	 * how many agents were in the house, which is the denominator a scene is measured against.
	 */
	ingest(events: readonly NpcEngineEvent[], tick: number, resolve: TakingsResolver, present?: number): void
	/**
	 * Money that no served interaction produced - a restored balance, earnings from an absent period.
	 * Moves the bank only: it is not a service, so it must not raise the live rate, the day book, or
	 * the served count, and a rate that counted it would compound the next away credit off itself.
	 */
	deposit(cents: number): void
	/**
	 * Money the player spent - a fixture, a hire. The mirror of `deposit` and the same rule: the bank
	 * only, never the rate window, the day book or the served count. It clamps `carriedCents` down
	 * with the bank, because `reset()` restores the bank *from* carried, so an unclamped purchase
	 * would mint the money straight back on the next re-deploy. A price the bank cannot cover is
	 * refused outright: no part-payment, no debt.
	 */
	withdraw(cents: number): boolean
	snapshot(): TakingsSnapshot
	reset(): void
}

export function createTakingsLedger(options: TakingsLedgerOptions): TakingsLedger {
	const rates = options.rates ?? TAKING_RATES_CENTS
	const windowSeconds = Math.max(1, Math.floor(options.rateWindowSeconds ?? TAKINGS_RATE_WINDOW_SECONDS))
	const daySeconds = Math.max(1, Math.floor(options.daySeconds ?? TAKINGS_DAY_SECONDS))
	const ticksPerSecond = Math.max(1, Math.floor(options.ticksPerSecond))
	const chargeCents = options.dailyChargeCents
	const onDayClose = options.onDayClose
	const centsBuckets = new Array<number>(windowSeconds).fill(0)
	const servedBuckets = new Array<number>(windowSeconds).fill(0)
	const tally = new Map<string, { cents: number; count: number }>()
	let currentSecond = 0
	let windowCents = 0
	let windowServed = 0
	let dayCents = 0
	let lastDayCents = 0
	let daysCompleted = 0
	let lastDayPayrollCents = 0
	let lastDayUnpaidCents = 0
	let carriedCents = 0
	let bankCents = 0
	let served = 0
	let walkOuts = 0
	let queueAbandons = 0
	/**
	 * Agents that lost their path since the last close, and how many were in the house while it
	 * happened. The ledger is the one place every drained event batch already passes through, so the
	 * evidence a scene is measured from is collected here rather than by a second reader of the same
	 * stream - two readers of one stream is how a count and a day boundary drift apart.
	 */
	let blockedThisDay = 0
	let presentAgentTicks = 0

	function clearWindow(): void {
		centsBuckets.fill(0)
		servedBuckets.fill(0)
		windowCents = 0
		windowServed = 0
	}

	/**
	 * Carried money can never exceed the bank, or `reset()` - which restores the bank *from* carried -
	 * would mint back money a withdrawal already took. One rule, shared by payroll and purchases.
	 */
	function clampCarriedToBank(): void {
		carriedCents = Math.min(carriedCents, bankCents)
	}

	/** Buckets are a ring over sim seconds, so the rate stays exact instead of decayed. */
	function advanceTo(second: number): void {
		if (second <= currentSecond) return
		if (second - currentSecond >= windowSeconds) {
			currentSecond = second
			clearWindow()
		} else {
			// Stepping to second S invalidates exactly the bucket holding S - windowSeconds,
			// which is the one that just aged out. Clearing the arrival slot instead loses the
			// oldest second the moment it is written.
			while (currentSecond < second) {
				currentSecond += 1
				const slot = currentSecond % windowSeconds
				windowCents -= centsBuckets[slot]
				windowServed -= servedBuckets[slot]
				centsBuckets[slot] = 0
				servedBuckets[slot] = 0
			}
		}
		// Days close on the clock, not on payment: an idle day must read as 0, not as missing.
		const day = Math.floor(second / daySeconds)
		for (; daysCompleted < day; daysCompleted++) {
			// The stamp is the day being closed, taken BEFORE the counter rolls: the ledger's own
			// `daysCompleted` is only incremented by the loop below, so a listener reading the
			// snapshot during the close would otherwise see the previous day and skip this one.
			const closedDay = daysCompleted + 1
			lastDayCents = dayCents
			dayCents = 0
			// A closed day bills the staff it deployed. The bank floors at zero rather than going
			// negative: unpaid payroll is written off - the game has no debt to carry - but it is
			// recorded, because a day that could not be paid is now a state the player can see.
			const charge = chargeCents?.() ?? 0
			lastDayPayrollCents = charge
			lastDayUnpaidCents = Math.max(0, charge - bankCents)
			if (charge > 0) {
				bankCents = Math.max(0, bankCents - charge)
				clampCarriedToBank()
			}
			// The day boundary is the ledger's, whatever else closes on it: standing recovers here in
			// the app and in the arch tool alike, from the same counted outcomes, and the world is
			// handed the night it just closed. The two counters clear *after* the callback, so a
			// listener reading the snapshot during the close still sees the day that is ending.
			const closedIncidents = settleDayIncidents({ blockedThisDay, presentAgentTicks })
			blockedThisDay = 0
			presentAgentTicks = 0
			onDayClose?.({ day: closedDay, served, walkOuts, incidents: closedIncidents })
		}
	}

	function pay(tag: string, cents: number): void {
		bankCents += cents
		dayCents += cents
		windowCents += cents
		windowServed += 1
		const slot = currentSecond % windowSeconds
		centsBuckets[slot] += cents
		servedBuckets[slot] += 1
		const entry = tally.get(tag)
		if (entry) {
			entry.cents += cents
			entry.count += 1
		} else {
			tally.set(tag, { cents, count: 1 })
		}
		served += 1
	}

	return {
		ingest(events, tick, resolve, present = 0) {
			const second = Math.floor(tick / ticksPerSecond)
			// Every event this batch covers is a second of the same crowd, so one tick of presence is
			// credited per event: a batch of 8 steps in a house of 100 is 800 agent-ticks, which is
			// what makes the scene rate a rate and not a count.
			presentAgentTicks += Math.max(0, present) * events.length
			// Counted BEFORE the clock moves, all of it. A close settles the day that is ending, so a
			// batch that crosses midnight has to be charged to the day it happened in - counting any of
			// it afterwards would file the walk-outs and the takings that ended a day into the next
			// morning's tally, and the night that cost the house a client and its neutrality would be
			// charged to a day that was quiet.
			for (const event of events) {
				if (event.type === 'blocked') blockedThisDay += 1
			}
			for (const event of events) {
				if (event.type === 'blocked') continue
				if (event.type === 'interaction-end') {
					const source = resolve(event)
					if (!source || !options.isVisitor(source.roleId)) continue
					const rate = rateForTags(source.tags, rates)
					if (rate) pay(rate.tag, rate.cents)
					continue
				}
				if (event.type === 'waiting' && (event.reason === 'impatient' || event.reason === 'queue-left')) {
					const source = resolve(event)
					if (!source || !options.isVisitor(source.roleId)) continue
					if (event.reason === 'impatient') walkOuts += 1
					else queueAbandons += 1
				}
			}
			advanceTo(second)
		},
		deposit(cents) {
			const amount = Math.floor(cents)
			if (!(amount > 0)) return
			bankCents += amount
			carriedCents += amount
		},
		withdraw(cents) {
			const amount = Math.floor(cents)
			if (!(amount > 0) || amount > bankCents) return false
			bankCents -= amount
			clampCarriedToBank()
			return true
		},
		snapshot() {
			const byTag = [...tally.entries()]
				.map(([tag, entry]) => ({ tag, cents: entry.cents, count: entry.count }))
				.sort((a, b) => b.cents - a.cents || a.tag.localeCompare(b.tag))
			return {
				bankCents,
				carriedCents,
				served,
				walkOuts,
				queueAbandons,
				perMinuteCents: Math.floor((windowCents * 60) / windowSeconds),
				simSeconds: currentSecond,
				byTag,
				daysCompleted,
				lastDayCents,
				lastDayPayrollCents,
				lastDayUnpaidCents,
				todayCents: dayCents,
				perDayCents: Math.floor((windowCents * daySeconds) / windowSeconds),
				servicesPerDay: Math.floor((windowServed * daySeconds) / windowSeconds),
			}
		},
		reset() {
			clearWindow()
			tally.clear()
			currentSecond = 0
			dayCents = 0
			lastDayCents = 0
			lastDayPayrollCents = 0
			lastDayUnpaidCents = 0
			daysCompleted = 0
			// A re-deploy re-measures the lobby; it does not un-earn money that already arrived.
			bankCents = carriedCents
			served = 0
			walkOuts = 0
			queueAbandons = 0
		},
	}
}
