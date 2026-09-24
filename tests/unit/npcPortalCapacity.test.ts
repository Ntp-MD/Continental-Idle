import { test } from 'vitest'
import assert from 'node:assert/strict'
import { generatedHotel, portalCars } from './hotelFixture'

// Vertical capacity of the generated tower (scripts/generate-hotel.mjs): a lift that
// cannot carry its own cab load, or that does not connect to every floor, is a defect
// in the generator, not in whatever the working seed currently holds.

const hotel = generatedHotel()
const floors = hotel.floors

test('a lift car admits as many riders as its cab capacity, not one', () => {
	const carCapacity = hotel.assetMap.get('elevator-1')!.interact?.capacity ?? 1
	const portalTargets = hotel.built.layout.interactionTargets.filter(target => target.itemId.startsWith('portal:'))
	assert.ok(portalTargets.length > 0, 'the tower exposes no portal targets')
	for (const target of portalTargets) {
		assert.equal(target.capacity, carCapacity, `portal target ${target.interactSpotId} is capped at ${target.capacity}, the cab holds ${carCapacity}`)
	}
})

test('every tower floor can reach every other tower floor by lift', () => {
	const floorIds = floors.map(floor => floor.id)
	for (const floor of floors) {
		const destinations = new Set(
			hotel.built.layout.interactionTargets
				.filter(target => target.floorId === floor.id && target.itemId.startsWith('portal:'))
				.map(target => target.transitionToFloorId)
				.filter((id): id is string => !!id),
		)
		const expected = new Set(floorIds.filter(id => id !== floor.id))
		assert.equal(destinations.size, expected.size, `floor ${floor.label} reaches ${destinations.size} of ${expected.size} floors by lift`)
		for (const destination of expected) assert.ok(destinations.has(destination), `floor ${floor.label} cannot reach ${destination}`)
	}
})

test('each tower floor carries the same bank of cars', () => {
	const carsPerFloor = floors.map(floor => portalCars(hotel, floor).length)
	assert.ok(carsPerFloor.every(count => count >= 3), `a floor has fewer than 3 cars: ${carsPerFloor.join(',')}`)
	assert.equal(new Set(carsPerFloor).size, 1, `car count differs between floors: ${[...new Set(carsPerFloor)].join(',')}`)
})
