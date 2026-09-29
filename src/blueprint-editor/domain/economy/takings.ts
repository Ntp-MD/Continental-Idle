import type { NpcEngineEvent } from '@/engine/npc'

/**
 * Guest spending read straight off the simulation's event stream: money exists only
 * where a visitor actually completed a service, so a plan that cannot circulate
 * earns less without any rule having to say so.
 */

/** Declared balance figures - game economy, not a building code. No source in the corpus. */
export const TAKING_RATES_CENTS: Readonly<Record<string, number>> = {
	living: 2400,
	'front-desk': 1800,
	treatment: 1500,
	business: 1200,
	meeting: 900,
	dining: 850,
	wellness: 700,
	retail: 620,
	laundry: 450,
	bar: 380,
	pool: 300,
	fitness: 250,
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
	/** Feed one drained batch of engine events, stamped with the engine's current tick. */
	ingest(events: readonly NpcEngineEvent[], tick: number, resolve: TakingsResolver): void
	/**
	 * Money that no served interaction produced - a restored balance, earnings from an absent period.
	 * Moves the bank only: it is not a service, so it must not raise the live rate, the day book, or
	 * the served count, and a rate that counted it would compound the next away credit off itself.
	 */
	deposit(cents: number): void
	snapshot(): TakingsSnapshot
	reset(): void
}

export function createTakingsLedger(options: TakingsLedgerOptions): TakingsLedger {
	const rates = options.rates ?? TAKING_RATES_CENTS
	const windowSeconds = Math.max(1, Math.floor(options.rateWindowSeconds ?? TAKINGS_RATE_WINDOW_SECONDS))
	const daySeconds = Math.max(1, Math.floor(options.daySeconds ?? TAKINGS_DAY_SECONDS))
	const ticksPerSecond = Math.max(1, Math.floor(options.ticksPerSecond))
	const chargeCents = options.dailyChargeCents
	const centsBuckets = new Array<number>(windowSeconds).fill(0)
	const servedBuckets = new Array<number>(windowSeconds).fill(0)
	const tally = new Map<string, { cents: number; count: number }>()
	let currentSecond = 0
	let windowCents = 0
	let windowServed = 0
	let dayCents = 0
	let lastDayCents = 0
	let daysCompleted = 0
	let carriedCents = 0
	let bankCents = 0
	let served = 0
	let walkOuts = 0
	let queueAbandons = 0

	function clearWindow(): void {
		centsBuckets.fill(0)
		servedBuckets.fill(0)
		windowCents = 0
		windowServed = 0
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
			lastDayCents = dayCents
			dayCents = 0
			// A closed day bills the staff it deployed. The bank floors at zero rather than going
			// negative: unpaid payroll is written off until insolvency is a state the game has.
			const charge = chargeCents?.() ?? 0
			if (charge > 0) {
				bankCents = Math.max(0, bankCents - charge)
				// Carried money can never exceed the bank, or reset() would mint back what payroll
				// already took.
				carriedCents = Math.min(carriedCents, bankCents)
			}
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
		ingest(events, tick, resolve) {
			advanceTo(Math.floor(tick / ticksPerSecond))
			for (const event of events) {
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
		},
		deposit(cents) {
			bankCents += cents
			carriedCents += cents
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
				perMinuteCents: Math.round((windowCents * 60) / windowSeconds),
				simSeconds: currentSecond,
				byTag,
				daysCompleted,
				lastDayCents,
				todayCents: dayCents,
				perDayCents: Math.round((windowCents * daySeconds) / windowSeconds),
				servicesPerDay: Math.round((windowServed * daySeconds) / windowSeconds),
			}
		},
		reset() {
			clearWindow()
			tally.clear()
			currentSecond = 0
			dayCents = 0
			lastDayCents = 0
			daysCompleted = 0
			// A re-deploy re-measures the lobby; it does not un-earn money that already arrived.
			bankCents = carriedCents
			served = 0
			walkOuts = 0
			queueAbandons = 0
		},
	}
}
