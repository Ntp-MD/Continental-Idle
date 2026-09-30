import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
	advanceFactions,
	creditService,
	createWorldState,
	FACTION_HOSTILE_BELOW,
	FACTION_RELATIONS_DEFAULT,
	factionTrafficShare,
	latestReleased,
	readWorld,
	releasePerson,
	repairFaction,
	settleWorldNight,
	WORLD_MEMORY_CAPACITY,
	type Faction,
	type WorldState,
} from '@/blueprint-editor/domain/economy/standing-world'

/** Derived from the world's own roster, so a new faction cannot be left out of these assertions. */
const FACTIONS = Object.keys(createWorldState().factions) as Faction[]

function withRelations(relations: Partial<Record<Faction, number>>, base = createWorldState()): WorldState {
	const factions = { ...base.factions }
	for (const [id, value] of Object.entries(relations) as [Faction, number][]) {
		factions[id] = { ...factions[id], relations: value }
	}
	return { ...base, factions }
}

describe('the world outside the house', () => {
	it('a new world holds every faction and nobody owes anything', () => {
		const state = createWorldState()
		const reading = readWorld(state, 100)
		assert.equal(reading.estranged.length, 0)
		assert.ok(reading.strongest)
		assert.equal(reading.expectedWalkIns, 100)
	})

	it('the house remembers who walked in: a repeat arrival is the same person, not a new one', () => {
		let state = createWorldState()
		// The roster is empty at first, so force a few distinct faces before the repeat can happen.
		for (let i = 0; i < 6; i++) state = releasePerson(state, i)
		const firstIds = state.people.map(p => p.id)
		for (let i = 0; i < 6; i++) state = releasePerson(state, i)
		const returned = state.people.filter(p => p.visits > 1)
		assert.ok(returned.length > 0, 'the house should recognise some of its own regulars')
		assert.ok(firstIds.every(id => state.people.some(p => p.id === id)), 'a known person keeps the same id')
	})

	it('a served client strengthens their faction, and losing one costs more than winning one gains', () => {
		const start = createWorldState().factions.neutral.relations
		const won = creditService(createWorldState(), 'neutral', true)
		const lost = creditService(createWorldState(), 'neutral', false)
		assert.equal(won.factions.neutral.relations, start + 1)
		assert.equal(lost.factions.neutral.relations, start - 2)
	})

	it('a faction the house has wronged stops sending people, and is named as estranged', () => {
		const state = withRelations({ rival: FACTION_HOSTILE_BELOW - 1 })
		const reading = readWorld(state, 100)
		assert.deepEqual(reading.estranged, ['rival'])
		assert.equal(factionTrafficShare(state.factions.rival), 0)
		assert.ok(reading.expectedWalkIns < 100, 'a lost faction thins the walk-ins')
	})

	it('a loyal faction sends more people, not just the same ones', () => {
		const neutral = factionTrafficShare(createWorldState().factions.neutral)
		const loyal = factionTrafficShare(withRelations({ neutral: 80 }).factions.neutral)
		assert.ok(loyal > neutral)
	})

	it('relations stay whole and inside the band however long the world is played', () => {
		let state = createWorldState()
		for (let i = 0; i < 500; i++) state = creditService(state, 'neutral', i % 3 !== 0)
		const entry = state.factions.neutral
		assert.ok(Number.isInteger(entry.relations))
		assert.ok(entry.relations >= 0 && entry.relations <= 100)
	})

	it('a full roster forgets the oldest names without reducing the traffic', () => {
		let state = createWorldState()
		for (let i = 0; i < WORLD_MEMORY_CAPACITY * 3; i++) state = releasePerson(state, i)
		assert.equal(state.people.length, WORLD_MEMORY_CAPACITY)
		assert.equal(state.arrivals, WORLD_MEMORY_CAPACITY * 3)
	})

	it('a house nobody trusts still gets strangers through the door', () => {
		let state = createWorldState()
		for (const id of Object.keys(state.factions) as Faction[]) {
			state = withRelations({ [id]: 0 }, state)
		}
		assert.equal(readWorld(state, 100).expectedWalkIns, 0)
		// The flow itself must not stall: an empty world is cold, not closed.
		const after = releasePerson(state, 0)
		assert.equal(after.arrivals, 1)
		assert.equal(after.people.length, 1)
	})

	it('the returning share rises as the same people keep coming back', () => {
		let state = createWorldState()
		for (let i = 0; i < 30; i++) state = releasePerson(state, i)
		assert.ok(readWorld(state, 100).returningShare > 0)
	})

	it('the world says who just walked in, so a face can be bound to the agent carrying it', () => {
		let state = createWorldState()
		assert.equal(latestReleased(state), null, 'nobody has come through the door yet')
		state = releasePerson(state, 0)
		const first = latestReleased(state)
		assert.ok(first, 'a released person is readable by the caller that released them')
		assert.equal(first, state.people[state.people.length - 1])
		assert.ok(FACTIONS.includes(first.faction), 'every face belongs to a faction the house keeps')
		// The cap forgets from the front, so the newest face is still the last entry however full the
		// roster is - which is what lets a caller read the binding instead of guessing it.
		for (let i = 1; i < WORLD_MEMORY_CAPACITY * 3; i++) state = releasePerson(state, i)
		assert.equal(state.people.length, WORLD_MEMORY_CAPACITY)
		assert.equal(latestReleased(state), state.people[WORLD_MEMORY_CAPACITY - 1])
	})

	it('the reading names each faction\'s own book, so attribution is visible and not just implied', () => {
		let state = createWorldState()
		state = creditService(state, 'rival', true)
		state = creditService(state, 'rival', false)
		const standings = readWorld(state, 100).standings
		assert.equal(standings.length, FACTIONS.length)
		const rival = standings.find(entry => entry.id === 'rival')
		assert.deepEqual({ served: rival?.served, lost: rival?.lost, relations: rival?.relations }, { served: 1, lost: 1, relations: 49 })
		const untouched = standings.find(entry => entry.id === 'continental')
		assert.deepEqual({ served: untouched?.served, lost: untouched?.lost }, { served: 0, lost: 0 })
	})

	it('a closed day heals a share of the gap back to even, and never past even', () => {
		const wronged = withRelations({ rival: 10 })
		const oneDay = advanceFactions(wronged)
		assert.equal(oneDay.factions.rival.relations, 18, 'one day closed a fifth of the gap')
		assert.equal(oneDay.factions.neutral.relations, FACTION_RELATIONS_DEFAULT, 'a house at even has nothing to heal')
		const proud = withRelations({ rival: 80 })
		assert.equal(advanceFactions(proud), proud, 'standing a house earned is not decayed by a night it saw nobody')
	})

	it('one call settles the night: the houses that were there are judged, the rest fade', () => {
		const state = withRelations({ rival: 30, neutral: 30 })
		const settled = settleWorldNight(state, { rival: { served: 0, lost: 3 }, neutral: { served: 0, lost: 0 } })
		assert.equal(settled.factions.rival.relations, 28, 'a night its own client gave up on cost the house two points')
		assert.equal(settled.factions.neutral.relations, 34, 'a house whose night counted nothing was judged anyway')
		assert.equal(settled.factions.underworld.relations, FACTION_RELATIONS_DEFAULT, 'a house at even drifted on a night it saw nobody')
		// Nothing in the night changes nothing in the world, and an all-even roster is returned whole.
		assert.deepEqual(settleWorldNight(state, {}), advanceFactions(state), 'an empty night took a different road through the rule')
	})

	it('a house the street was reminded of tonight is judged, not forgiven', () => {
		const wronged = withRelations({ rival: 10 })
		// The exception is what keeps a grudge possible: healing a fifth of the gap from 48 is worth the
		// two points a bad night costs, so forgiven-on-the-same-close means no faction can ever sink.
		assert.equal(advanceFactions(wronged, ['rival']).factions.rival.relations, 10)
		assert.equal(advanceFactions(wronged, ['neutral']).factions.rival.relations, 18, 'an unrelated house still heals')
	})

	it('a faction the street wrote off is written back in, and the last point is not stranded', () => {
		let state = withRelations({ rival: 0 })
		// Geometric recovery on whole points is the trap continuity already fell into: from 49 the day's
		// gain is 0.2, which rounds straight back to 49, so a plain round strands a house one point short
		// of even with no way to close it.
		for (let day = 0; day < 40; day++) state = advanceFactions(state)
		assert.equal(state.factions.rival.relations, FACTION_RELATIONS_DEFAULT, 'the grudge faded but stopped at even')
		// And it crossed back over the line that shuts its traffic off, which is the whole point.
		assert.ok(state.factions.rival.relations >= FACTION_HOSTILE_BELOW)
		const partial = withRelations({ rival: 1 })
		const healed = advanceFactions(advanceFactions(partial))
		assert.ok(healed.factions.rival.relations > partial.factions.rival.relations, 'a faction at 1 cannot move at all')
	})

	it('a message round the room ends a grudge and cannot buy loyalty', () => {
		let state = withRelations({ rival: 46 })
		const first = repairFaction(state, 'rival')
		assert.equal(first.repaired, true)
		assert.equal(first.relations, FACTION_RELATIONS_DEFAULT, 'the lift stopped at even, not at the points it buys')
		state = first.state
		const second = repairFaction(state, 'rival')
		assert.equal(second.repaired, false, 'a house already at even had something sold to it anyway')
		assert.equal(second.state, state, 'a refused repair still rewrote the world')
		const proud = repairFaction(withRelations({ rival: 90 }), 'rival')
		assert.equal(proud.repaired, false, 'money bought standing the faction did not give')
	})
})
