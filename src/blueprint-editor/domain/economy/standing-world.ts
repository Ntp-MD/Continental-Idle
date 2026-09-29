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
	}
}
