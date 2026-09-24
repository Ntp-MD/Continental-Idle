import { test } from 'vitest'
import assert from 'node:assert/strict'
import { boardingCells, envelopeOf, generatedHotel, groupsOf, biggestOf, portalCars } from './hotelFixture'

// Gates the generated 21-floor tower (scripts/generate-hotel.mjs), not the working seed:
// a hand-built floor is allowed to be unfinished, the generator output is not.

const hotel = generatedHotel()
const inEnvelope = envelopeOf(hotel)

test('every walkable tile inside the envelope is reachable on every tower floor', () => {
	assert.equal(hotel.floors.length, 21, `the generator emits ${hotel.floors.length} floors, not 21`)
	const offenders: string[] = []
	for (const floor of hotel.floors) {
		const map = hotel.built.floorMaps.get(floor.id)
		assert.ok(map, `floor ${floor.label} has no engine walkable map`)
		const groups = groupsOf(map!.tiles, inEnvelope)
		if (groups.length > 1) offenders.push(`${floor.label}: ${groups.map(g => g.size).sort((a, b) => b - a).join(' + ')}`)
	}
	assert.deepEqual(offenders, [], `floors whose walkable space is cut into islands:\n  ${offenders.join('\n  ')}`)
})

test('every lift car in the tower can actually be boarded from its floor', () => {
	for (const floor of hotel.floors) {
		const map = hotel.built.floorMaps.get(floor.id)!
		const room = biggestOf(groupsOf(map.tiles, inEnvelope))
		const cars = portalCars(hotel, floor)
		assert.ok(cars.length >= 1, `floor ${floor.label} has no portal object`)
		const approaches = boardingCells(hotel, floor, room)
		assert.ok(approaches.every(a => a >= 2), `floor ${floor.label} has a lift car with fewer than 2 reachable approach tiles: ${approaches.join(',')}`)
	}
})
