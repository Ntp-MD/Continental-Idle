import { test } from 'vitest'
import assert from 'node:assert/strict'
import { seedLayout, seedOriginAssets } from '../../src/blueprint-editor/store/seed'
import { resolveFloorTileStates } from '../../src/blueprint-editor/domain/types'
import { envelopeOf, groupsOf, biggestOf, hotelModel } from './hotelFixture'

// Rules that hold for whatever the working seed currently holds - the building standard
// the editor enforces while a floor is being drawn, hand-built or generated.

const layout = await seedLayout()
const model = hotelModel(layout, await seedOriginAssets())
const inEnvelope = envelopeOf(model)

test('no wall in the working seed is two tiles thick', () => {
	const offenders: string[] = []
	for (const floor of model.floors) {
		const states = resolveFloorTileStates(floor, model.rows, model.cols)
		for (let r = 0; r < states.length - 1; r++) {
			const row = states[r]
			const below = states[r + 1]
			for (let c = 0; c < row.length - 1; c++) {
				if (row[c] === 'blocked' && row[c + 1] === 'blocked' && below[c] === 'blocked' && below[c + 1] === 'blocked') offenders.push(`${floor.label} at ${r},${c}`)
			}
		}
	}
	assert.deepEqual(offenders, [], `${offenders.length} 2x2 solid block(s) - a wall is one tile thick: ${offenders.slice(0, 8).join(' | ')}`)
})

test('the street ring reaches the interior of the street floor', () => {
	assert.ok(layout.streetFloorId, 'the seed names a street floor')
	const street = model.floors.find(floor => floor.id === layout.streetFloorId)!
	assert.ok(street, `street floor "${layout.streetFloorId}" is missing from the seed`)
	const map = model.built.floorMaps.get(street.id)
	assert.ok(map && map.tiles.size > 0, `floor ${street.label} builds no walkable map`)
	const ring = biggestOf(groupsOf(map!.tiles))
	const reached = [...ring].some(k => {
		const [c, r] = k.split(',').map(Number)
		return inEnvelope(c, r)
	})
	assert.ok(reached, `the street never reaches floor ${street.label}'s interior - an entrance door is needed on the street floor`)
})
