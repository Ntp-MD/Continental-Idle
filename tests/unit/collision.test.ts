import { test } from 'vitest'
import assert from 'node:assert/strict'
import { aabbOverlap, unionRects, objectOverlapsAny, rectHitsStructure, recalcCollapsed } from '../../src/blueprint-editor/domain/collision'
import type { AssetDef, ObjectData, Rect, SvgRole, TileState } from '../../src/blueprint-editor/domain/types'

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })

function asset(id: string, svg = false): AssetDef {
	return { id, name: id, w: 1, h: 1, ...(svg ? { svg: '<svg/>' } : {}) }
}
function roleAsset(id: string, role: SvgRole): AssetDef {
	return { id, name: id, w: 1, h: 1, svg: `<svg><rect data-role="${role}"/></svg>`, svgRoles: [{ role, tag: 'rect' }] }
}
function obj(id: string, type: string, x: number, y: number, w = 10, h = 10): ObjectData {
	return { id, type, x, y, w, h, rotation: 0 }
}

const wall = roleAsset('wall', 'wall')
const door = roleAsset('door', 'door')
const fixture = roleAsset('fixture', 'fixture')

const assetMap = new Map<string, AssetDef>([
	['a', asset('a')],
	['svg', asset('svg', true)],
	['wall', wall],
	['door', door],
	['fixture', fixture],
])

test('aabbOverlap and unionRects', () => {
	assert.equal(aabbOverlap(rect(0, 0, 10, 10), rect(5, 5, 10, 10)), true, 'overlap detected')
	assert.equal(aabbOverlap(rect(0, 0, 10, 10), rect(10, 0, 10, 10)), false, 'touching edges are not overlap')
	assert.equal(aabbOverlap(rect(2, 2, 1, 1), rect(0, 0, 10, 10)), true, 'nested rects overlap')

	assert.equal(unionRects([]), null, 'empty union is null')
	assert.deepEqual(unionRects([rect(0, 0, 10, 10), rect(5, 5, 10, 10)]), rect(0, 0, 15, 15), 'union bounds')
	assert.equal(unionRects([rect(NaN, 0, 10, 10)]), null, 'non-finite rects ignored')
})

test('a wall or door never shares space with another object', () => {
	assert.equal(objectOverlapsAny([obj('o1', 'svg', 0, 0)], assetMap, rect(5, 5, 10, 10), undefined, wall), true, 'a wall cannot be dropped on decorative art')
	assert.equal(objectOverlapsAny([obj('o1', 'fixture', 0, 0)], assetMap, rect(5, 5, 10, 10), undefined, door), true, 'a door cannot be dropped on fixture art')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10), undefined, wall), true, 'a wall cannot be dropped on furniture')
	assert.equal(objectOverlapsAny([obj('o1', 'wall', 0, 0)], assetMap, rect(5, 5, 10, 10), undefined, asset('a')), true, 'furniture cannot cover a wall')
	assert.equal(objectOverlapsAny([obj('o1', 'door', 0, 0)], assetMap, rect(5, 5, 10, 10), undefined, asset('svg', true)), true, 'art cannot cover a door')
	assert.equal(objectOverlapsAny([obj('o1', 'wall', 0, 0)], assetMap, rect(50, 50, 10, 10), undefined, fixture), false, 'a clear cell stays free')
	assert.equal(objectOverlapsAny([obj('o1', 'fixture', 0, 0)], assetMap, rect(5, 5, 10, 10), undefined, fixture), false, 'fixture art keeps the svg exemption')
	assert.equal(objectOverlapsAny([obj('o1', 'wall', 0, 0)], assetMap, rect(5, 5, 10, 10), 'o1', wall), false, 'the excluded id stays excluded')
})

test('objectOverlapsAny', () => {
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10)), true, 'overlaps non-svg object')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(50, 50, 10, 10)), false, 'no overlap')
	assert.equal(objectOverlapsAny([obj('o1', 'svg', 0, 0)], assetMap, rect(5, 5, 10, 10)), false, 'svg objects are not collision bodies')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10), 'o1'), false, 'excluded id ignored')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0), obj('o2', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10), ['o1']), true, 'array exclude keeps other hit')
})

test('rectHitsStructure keeps objects off painted wall and door cells', () => {
	const tileStates: TileState[][] = [
		['walkable', 'blocked', 'door'],
		['walkable', 'walkable', 'walkable'],
	]
	const floor = { walkable: { tileStates } }
	assert.equal(rectHitsStructure(floor, rect(0, 0, 20, 20), 20), false, 'an open cell takes the object')
	assert.equal(rectHitsStructure(floor, rect(20, 0, 20, 20), 20), true, 'a wall cell refuses it')
	assert.equal(rectHitsStructure(floor, rect(40, 0, 20, 20), 20), true, 'a door cell refuses it')
	assert.equal(rectHitsStructure(floor, rect(0, 0, 60, 20), 20), true, 'a wide object may not straddle a wall')
	assert.equal(rectHitsStructure(floor, rect(0, 20, 60, 20), 20), false, 'the open row below takes it')
	assert.equal(rectHitsStructure(floor, rect(100, 100, 20, 20), 20), false, 'past the painted region is open floor')
	assert.equal(rectHitsStructure({ walkable: { walkableGrid: [[true, false]] } }, rect(20, 0, 20, 20), 20), true, 'a legacy blocked cell refuses it')
	assert.equal(rectHitsStructure(undefined, rect(0, 0, 20, 20), 20), false, 'no floor, no geometry')
	assert.equal(rectHitsStructure({}, rect(0, 0, 20, 20), 20), false, 'an unpainted floor has no geometry yet')
})

test('recalcCollapsed', () => {
	const single = { objects: [obj('o1', 'a', 0, 0)] }
	recalcCollapsed(single, assetMap)
	assert.equal(single.objects[0].collapsed, false, 'single object not collapsed')

	const pair = { objects: [obj('o1', 'a', 0, 0), obj('o2', 'a', 5, 5)] }
	recalcCollapsed(pair, assetMap)
	assert.equal(pair.objects[0].collapsed, true, 'overlapping objects collapsed')
	assert.equal(pair.objects[1].collapsed, true, 'both overlapping objects collapsed')

	const disjoint = { objects: [obj('o1', 'a', 0, 0), obj('o2', 'a', 100, 100)] }
	recalcCollapsed(disjoint, assetMap)
	assert.equal(disjoint.objects[0].collapsed, false, 'disjoint objects not collapsed')
	assert.equal(disjoint.objects[1].collapsed, false, 'disjoint objects not collapsed')

	const withSvg = { objects: [obj('o1', 'svg', 0, 0), obj('o2', 'a', 5, 5)] }
	recalcCollapsed(withSvg, assetMap)
	assert.equal(withSvg.objects[0].collapsed, false, 'svg object never collapsed')
	assert.equal(withSvg.objects[1].collapsed, false, 'overlap with svg body does not collapse')

	const wallOnDesk = { objects: [obj('o1', 'wall', 0, 0), obj('o2', 'a', 5, 5)] }
	recalcCollapsed(wallOnDesk, assetMap)
	assert.equal(wallOnDesk.objects[0].collapsed, true, 'the wall reports the clash')
	assert.equal(wallOnDesk.objects[1].collapsed, true, 'the furniture reports the clash')

	const artOnDoor = { objects: [obj('o1', 'door', 0, 0), obj('o2', 'svg', 5, 5)] }
	recalcCollapsed(artOnDoor, assetMap)
	assert.equal(artOnDoor.objects[0].collapsed, true, 'the door reports the clash')
	assert.equal(artOnDoor.objects[1].collapsed, false, 'decorative art is never collapsed')
})
