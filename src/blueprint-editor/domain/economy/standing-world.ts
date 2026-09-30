/**
 * Who walks in the door, and whether the house remembers them.
 *
 * The arrival flow used to release interchangeable agents from a single role: `t0, t1, t2...`, all
 * of them the same person. That is why the world had no factions and no memory - not because the
 * idea was missing, but because there was no identity for a rule to act on. A contract you broke has
 * to be broken *by someone*, and the same someone has to be able to come back.
 *
 * This module owns that identity. It is deliberately pure and bounded: a name is a small record
 * drawn from a declared roster, not a character model, and what the house remembers about each one
 * stays here rather than being scattered across the simulation.
 */

/** Declared balance. How many distinct regulars the world can hold before old names are forgotten. */
export const WORLD_MEMORY_CAPACITY = 24

/**
 * The factions a regular can belong to. Not decoration: two clients of the same house arriving on
 * the same night is a negotiation the player should be able to lose money on, and a client whose
 * faction is under pressure at the table changes what the table is worth.
 */
export type Faction = 'underworld' | 'continental' | 'neutral' | 'rival'

/** Declared balance. A fresh name starts neutral, exactly as a new walk-in does. */
export const FACTION_RELATIONS_DEFAULT = 50
/** Below this a faction has been slighted badly enough to stop sending people. */
export const FACTION_HOSTILE_BELOW = 20
/** Above this a faction considers the house its own, and sends more people than it owes. */
export const FACTION_LOYAL_ABOVE = 70

/**
 * Declared balance. Who a client belongs to when the house cannot say. A standing crowd deployed from
 * the pool was never released by the world, so it has no faction of its own - and treating it as
 * nobody would mean a served guest moved no world at all, which is the opposite of what the ladder is
 * for. An unplaced client is a neutral one: the house can still win them round.
 */
export const ANONYMOUS_FACTION: Faction = 'neutral'

export interface WorldFaction {
	readonly id: Faction
	/** Standing with this faction, 0-100. */
	readonly relations: number
	/** How many times this faction's people have been turned away, served, or had a scene here. */
	readonly visits: number
	readonly served: number
	readonly lost: number
}

export interface WorldPerson {
	readonly id: string
	/** Stable per person, so the same id is the same face every time it walks in. */
	readonly faction: Faction
	/** Times they have completed a service here. The first visit is not the same as the fifth. */
	readonly visits: number
	/** Set once they have been personally offended, which is not the same as a bad queue. */
	readonly offended: boolean
}

export interface WorldState {
	readonly factions: Record<Faction, WorldFaction>
	readonly people: readonly WorldPerson[]
	/** How many arrivals the world has released in total, including forgotten ones. */
	readonly arrivals: number
}

function newFaction(id: Faction): WorldFaction {
	return { id, relations: FACTION_RELATIONS_DEFAULT, visits: 0, served: 0, lost: 0 }
}

export function createWorldState(): WorldState {
	return {
		factions: {
			underworld: newFaction('underworld'),
			continental: newFaction('continental'),
			neutral: newFaction('neutral'),
			rival: newFaction('rival'),
		},
		people: [],
		arrivals: 0,
	}
}

/**
 * Which factions are currently willing to send people, and how readily. A house that has wronged
 * nobody gets everyone; one that has lost a faction's confidence gets that faction's walk-ins
 * thinned to nothing, which is how a world reacts to a player rather than to a number.
 */
export function willingFactions(state: WorldState): readonly Faction[] {
	return (Object.keys(state.factions) as Faction[]).filter(id => state.factions[id].relations >= FACTION_HOSTILE_BELOW)
}

/** Declared balance. Loyalty and hostility are one ladder read twice, never two ladders. */
export function factionTrafficShare(faction: WorldFaction): number {
	if (faction.relations < FACTION_HOSTILE_BELOW) return 0
	if (faction.relations >= FACTION_LOYAL_ABOVE) return 2
	return 1
}

function hashString(value: string): number {
	let hash = 0x811c9dc5
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193)
	}
	return hash >>> 0
}

function pickFaction(factionIds: readonly Faction[], seed: number): Faction {
	return factionIds[hashString(String(seed)) % factionIds.length]
}

function clampRelations(value: number): number {
	return Math.min(100, Math.max(0, Math.round(value)))
}

/**
 * The world remembers by identity, not by count: a regular who has been here three times is the
 * same person and gets the same treatment the third time. `arrivals` counts everyone, including the
 * ones the cap has since forgotten, so a player's traffic is never silently reduced by a full
 * roster - the people are forgotten, the volume is not.
 */
export function releasePerson(state: WorldState, index: number): WorldState {
	const willing = willingFactions(state)
	// A house nobody trusts still gets strangers through the door: the world does not go empty, it
	// goes cold. A new faction appearing here is what keeps a bankrupt house recoverable.
	const pool: readonly Faction[] = willing.length ? willing : (['neutral'] as const)
	const seed = state.arrivals + index
	const faction = pickFaction(pool, seed)
	const repeat = state.people[seed % Math.max(1, state.people.length)] ?? null
	const known = repeat !== null && !repeat.offended
	const person: WorldPerson = known
		? { ...repeat, visits: repeat.visits + 1 }
		: { id: `p${seed}`, faction, visits: 1, offended: false }
	const people = [...state.people, person]
	// Oldest out first: a full roster should forget the least recent, not the least important.
	const kept = people.length > WORLD_MEMORY_CAPACITY ? people.slice(people.length - WORLD_MEMORY_CAPACITY) : people
	return {
		...state,
		people: kept,
		arrivals: state.arrivals + 1,
		factions: {
			...state.factions,
			[faction]: { ...state.factions[faction], visits: state.factions[faction].visits + 1 },
		},
	}
}

/**
 * Declared recovery: the share of the gap back to even that one closed day heals for a faction the
 * house has wronged. Below 1 so a grudge is not ended by one quiet night - and unconditional in the
 * sense that matters: a hostile faction sends nobody, so a recovery that waited on service could never
 * run, and losing a house would be permanent rather than expensive.
 */
export const FACTION_RECOVERY_FRACTION = 0.2

/** Declared balance: how many points one message round the room buys. Its price is `purchases.ts`'s. */
export const FACTION_GOODWILL_POINTS = 5

/**
 * A faction heals toward even from below, and never from above. A grudge fades with the street;
 * standing a house earned by serving its people is not taken away by a night it happened not to see
 * them. The last point is rounded up for the reason continuity's ladder rounds up: the score is a
 * whole number, so from 49 a day's gain is 0.2, which rounds straight back to 49 and strands the
 * house one point short of even with no way to close it.
 */
function healRelations(relations: number): number {
	if (relations >= FACTION_RELATIONS_DEFAULT) return relations
	const gained = (FACTION_RELATIONS_DEFAULT - relations) * Math.min(1, Math.max(0, FACTION_RECOVERY_FRACTION))
	return clampRelations(relations + (gained > 0 && gained < 1 ? 1 : gained))
}

/**
 * One closed day, spent: every wronged house a step back toward even - except the ones that had a
 * client tonight, which were just judged and must not be quietly forgiven on the same day.
 *
 * The exception is load-bearing, not politeness. A bad night costs a faction two points, and healing
 * a fifth of the gap from 48 is worth two points, so a house that forgot on every night could never be
 * written off at all: the measured run sat at 44 through twenty lost clients. Forgetting is what a
 * street does with a grudge it has not been reminded of.
 */
export function advanceFactions(state: WorldState, reminded: readonly Faction[] = []): WorldState {
	const justJudged = new Set(reminded)
	const factions = { ...state.factions }
	let healed = false
	for (const id of Object.keys(state.factions) as Faction[]) {
		if (justJudged.has(id)) continue
		const next = healRelations(state.factions[id].relations)
		if (next !== state.factions[id].relations) {
			factions[id] = { ...state.factions[id], relations: next }
			healed = true
		}
	}
	return healed ? { ...state, factions } : state
}

/**
 * Bought goodwill with one house: the lift stops at even and never above it, because money can undo a
 * grudge but cannot purchase loyalty the faction's people did not give - the same line `reputation.ts`
 * holds for the room's own standing. At or above even there is nothing to buy and the repair is
 * refused, so a player cannot bank a bonus against the day the world turns warm by itself.
 */
export function repairFaction(state: WorldState, faction: Faction): { state: WorldState; repaired: boolean; relations: number } {
	const from = state.factions[faction]
	if (!from || from.relations >= FACTION_RELATIONS_DEFAULT) {
		return { state, repaired: false, relations: from?.relations ?? FACTION_RELATIONS_DEFAULT }
	}
	const relations = Math.min(FACTION_RELATIONS_DEFAULT, from.relations + FACTION_GOODWILL_POINTS)
	return { state: { ...state, factions: { ...state.factions, [faction]: { ...from, relations } } }, repaired: true, relations }
}

/**
 * One night's outcomes, counted per house: the shape `takings.ts` hands over on its own close. Declared
 * here rather than imported from the ledger, because the ledger reads this module for `Faction` and a
 * cycle would be the price of sharing the type the other way.
 */
export type NightCounting = Readonly<Partial<Record<Faction, { readonly served: number; readonly lost: number }>>>

/**
 * One closed night, settled against the world: the houses whose clients were actually there are judged
 * for how their people were treated, and the ones the street was not reminded of fade a step toward
 * even. Exported because two surfaces run it - the played house and `arch takings` - and a grudge that
 * heals on one and not the other is a tool measuring a different game than the one being built.
 *
 * The two halves are one function deliberately: the order is the rule. Credit first, then fade, so the
 * night a faction was wronged is not also the night it was forgiven.
 */
export function settleWorldNight(state: WorldState, byFaction: NightCounting): WorldState {
	const present: Faction[] = []
	let next = state
	for (const [id, counted] of Object.entries(byFaction) as [Faction, { served: number; lost: number }][]) {
		if (counted.served + counted.lost === 0) continue
		present.push(id)
		next = creditService(next, id, counted.served >= counted.lost)
	}
	return advanceFactions(next, present)
}

/**
 * The person the last `releasePerson` put through the door, so a caller can bind an agent id to the
 * face it just released. The roster keeps its newest entry last (the cap forgets from the front), so
 * this is the one a caller has just written - and it is a read of the state rather than a second copy
 * of the pick, which is how a binding could drift from the world it claims to describe.
 */
export function latestReleased(state: WorldState): WorldPerson | null {
	return state.people.length ? state.people[state.people.length - 1] : null
}

/**
 * What a served interaction is worth to the house beyond its tariff: a satisfied client of a loyal
 * faction is the reason the world keeps sending people. Recorded on the faction, not on the person,
 * so one night's takings do not compound off themselves the way an away credit would.
 */
export function creditService(state: WorldState, faction: Faction, satisfied: boolean): WorldState {
	const entry = state.factions[faction]
	// Declared balance: a good night moves a faction one step, a bad one costs more. Losing a client
	// hurts the house's standing more than winning one helps it, so a bad room is hard to leave.
	const gain = satisfied ? 1 : -2
	return {
		...state,
		factions: {
			...state.factions,
			[faction]: {
				...entry,
				served: entry.served + (satisfied ? 1 : 0),
				lost: entry.lost + (satisfied ? 0 : 1),
				relations: clampRelations(entry.relations + gain),
			},
		},
	}
}

export interface WorldReading {
	/** Walk-ins the world's current factions would actually send, against the roster's full size. */
	readonly expectedWalkIns: number
	/** Factions that have stopped coming, by name. Empty while the house is welcome everywhere. */
	readonly estranged: readonly Faction[]
	/** The most loyal faction, which is the one worth protecting. */
	readonly strongest: Faction | null
	/** How many of the last few arrivals were people the house had met before. */
	readonly returningShare: number
	/**
	 * Each faction's own book: standing, and the served/lost counts that produced it. Published so the
	 * screen can name who the house actually pleased, rather than leaving `estranged` as the only
	 * readable consequence of attribution.
	 */
	readonly standings: readonly WorldFaction[]
}

export function readWorld(state: WorldState, poolSize: number): WorldReading {
	const ids = Object.keys(state.factions) as Faction[]
	const estranged = ids.filter(id => state.factions[id].relations < FACTION_HOSTILE_BELOW)
	const total = ids.reduce((sum, id) => sum + factionTrafficShare(state.factions[id]), 0)
	const regulars = state.people.filter(person => person.visits > 1).length
	return {
		expectedWalkIns: Math.round((poolSize * total) / Math.max(1, ids.length)),
		estranged,
		strongest: ids.reduce<Faction | null>(
			(best, id) => (best === null || state.factions[id].relations > state.factions[best].relations ? id : best),
			null,
		),
		returningShare: state.people.length ? regulars / state.people.length : 0,
		standings: ids.map(id => state.factions[id]),
	}
}
