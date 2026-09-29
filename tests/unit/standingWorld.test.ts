import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
	creditService,
	createWorldState,
	FACTION_HOSTILE_BELOW,
	factionTrafficShare,
	readWorld,
	releasePerson,
	WORLD_MEMORY_CAPACITY,
	type Faction,
	type WorldState,
} from '@/blueprint-editor/domain/economy/standing-world'

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
})
