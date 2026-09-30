/**
 * What a guest wants, and when they will get up and go and get it.
 *
 * Before this, an agent had no inner life: every few ticks the policy rolled a dice (`focusChance`)
 * and the crowd's behaviour was noise with a shape - a guest who had just drunk a pint was exactly as
 * likely to want another one as one who had been standing in the lobby for four hours. A need gives
 * each agent a reason that persists between decisions, so a room reads as people rather than as
 * particles: thirsty, then a drink, then the toilet, then tired, then a bed.
 *
 * The numbers are declared, not measured: nothing in this repo observes how long a real guest goes
 * without a drink. What is fixed is the *shape* - each need rises on its own clock, an agent only acts
 * on an urge past `NEED_ACT_AT`, and using the thing resets that need's clock.
 *
 * Urgency is read from the tick a need was last served, so nothing has to be updated every tick:
 * a thousand agents cost the same as one, and the state is four integers per head instead of a decay
 * loop that has to run whether or not anyone is watching.
 */

export type NpcNeedKey = 'thirst' | 'appetite' | 'rest' | 'cleanliness'

export const NPC_NEED_KEYS: readonly NpcNeedKey[] = ['thirst', 'appetite', 'rest', 'cleanliness']

/** The tick each need was last served. A need never served is measured from the agent's own spawn. */
export type NpcNeeds = Record<NpcNeedKey, number>

/**
 * What serves each need, in the tags the asset library already carries. `kitchen` is deliberately
 * absent from `appetite`: it is a staff post tag, and a guest who cannot be served at it would stand
 * hungry in front of it forever.
 */
export const NEED_TAGS: Record<NpcNeedKey, readonly string[]> = {
	thirst: ['bar'],
	appetite: ['dining'],
	// The desk is on the list because it is how a tired guest gets the room: a lobby with a vacant bed
	// and no chamberlain answered is a lobby the guest still has to cross.
	rest: ['chambers', 'lounge', 'front-desk'],
	cleanliness: ['hygiene', 'wellness', 'pool', 'fitness'],
}

/** Seconds of sim time an agent goes before the urge is fully upon them. */
export const NEED_RISE_SECONDS: Record<NpcNeedKey, number> = {
	thirst: 90,
	appetite: 150,
	rest: 240,
	cleanliness: 300,
}

/** The urgency past which an agent stops wandering and goes after the thing. */
export const NEED_ACT_AT = 0.5

function clamp01(value: number): number {
	return value < 0 ? 0 : value > 1 ? 1 : value
}

/**
 * A crowd spawned all at once must not all get thirsty at the same second, or the house would breathe
 * in and out instead of living. And nobody walks in fresh: a guest arrives carrying whatever they have
 * already gone without, so each clock is back-dated across its whole range. Half the house therefore
 * wants something the moment it is released, which is what fills the queues at the start of a night
 * instead of leaving an empty lobby for the first two minutes of play.
 */
export function createNeeds(currentTick: number, ticksPerSecond: number, random: () => number): NpcNeeds {
	const needs = {} as NpcNeeds
	for (const key of NPC_NEED_KEYS) {
		const spread = random() * NEED_RISE_SECONDS[key] * ticksPerSecond
		needs[key] = currentTick - Math.floor(spread)
	}
	return needs
}

/** 0 = just served, 1 = as bad as it gets. */
export function needUrgency(needs: NpcNeeds, key: NpcNeedKey, currentTick: number, ticksPerSecond: number): number {
	const riseTicks = Math.max(1, NEED_RISE_SECONDS[key] * ticksPerSecond)
	return clamp01((currentTick - needs[key]) / riseTicks)
}

/** The tags that serve a need, or an empty list for a key nothing serves. */
export function needTags(key: NpcNeedKey | null): readonly string[] {
	return key === null ? [] : NEED_TAGS[key]
}

/**
 * Does this fixture serve this need? A staff station never does: its tags are the `post:` kind, which
 * appear nowhere in `NEED_TAGS`, so the bartender's side of the counter cannot settle a guest's thirst.
 */
function servesNeed(tags: readonly string[], key: NpcNeedKey): boolean {
	return NEED_TAGS[key].some(tag => tags.includes(tag))
}

/**
 * The worst urge this agent can actually do something about, or null when nothing is past the acting
 * threshold. `allowedTags` is the role's own vocabulary: a role that cannot use a bar is not made
 * thirsty by one, and a role with no focus tags at all is allowed to want everything.
 */
export function dominantNeed(
	needs: NpcNeeds,
	currentTick: number,
	ticksPerSecond: number,
	allowedTags: readonly string[] | null,
): NpcNeedKey | null {
	return urgesByUrgency(needs, currentTick, ticksPerSecond, allowedTags)[0] ?? null
}

/**
 * Every urge past the acting threshold, worst first. A person who wants a bath and finds the bathroom
 * locked still sits down - they do not stand in the corridor wanting a bath - so the policy works down
 * this list and takes the first thing the floor can actually serve.
 */
export function urgesByUrgency(
	needs: NpcNeeds,
	currentTick: number,
	ticksPerSecond: number,
	allowedTags: readonly string[] | null,
): NpcNeedKey[] {
	const ranked: Array<{ key: NpcNeedKey; urgency: number }> = []
	for (const key of NPC_NEED_KEYS) {
		if (allowedTags !== null && !NEED_TAGS[key].some(tag => allowedTags.includes(tag))) continue
		const urgency = needUrgency(needs, key, currentTick, ticksPerSecond)
		if (urgency > NEED_ACT_AT) ranked.push({ key, urgency })
	}
	// Deterministic: urgency descending, then the declared key order, so a tie never depends on a map.
	return ranked.sort((a, b) => b.urgency - a.urgency || NPC_NEED_KEYS.indexOf(a.key) - NPC_NEED_KEYS.indexOf(b.key))
		.map(entry => entry.key)
}

/**
 * A visit is over: every need the fixture serves is reset. Which needs a tag serves is declared in
 * `NEED_TAGS`, so a shower washes and a bed rests, and neither does the other's job.
 */
export function serveNeeds(needs: NpcNeeds, tags: readonly string[], currentTick: number): NpcNeedKey[] {
	const served: NpcNeedKey[] = []
	for (const key of NPC_NEED_KEYS) {
		if (!servesNeed(tags, key)) continue
		needs[key] = currentTick
		served.push(key)
	}
	return served
}

/**
 * A role with no posted work is a guest: it consumes what the house offers, so it is the one with
 * urges. This is the same rule the ledger bills with (`visitorRoleIds` in
 * `blueprint-editor/domain/economy/takings`), and `needs.test.ts` pins the two together so a role
 * cannot be a customer in one layer and a worker in the other.
 */
export function isVisitorRole(role: { taskIds: readonly string[] }): boolean {
	return role.taskIds.length === 0
}
