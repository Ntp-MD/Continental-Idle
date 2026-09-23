import { test } from 'vitest'
import assert from 'node:assert/strict'
import { aabbOverlap, unionRects, objectOverlapsAny, recalcCollapsed } from '../../src/blueprint-editor/domain/collision'
import type { AssetDef, ObjectData, Rect } from '../../src/blueprint-editor/domain/types'

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })

function asset(id: string, svg = false): AssetDef {
	return { id, name: id, w: 1, h: 1, ...(svg ? { svg: '<svg/>' } : {}) }
}
function obj(id: string, type: string, x: number, y: number, w = 10, h = 10): ObjectData {
	return { id, type, x, y, w, h, rotation: 0 }
}

const assetMap = new Map<string, AssetDef>([
	['a', asset('a')],
	['svg', asset('svg', true)],
])

test('aabbOverlap and unionRects', () => {
	assert.equal(aabbOverlap(rect(0, 0, 10, 10), rect(5, 5, 10, 10)), true, 'overlap detected')
	assert.equal(aabbOverlap(rect(0, 0, 10, 10), rect(10, 0, 10, 10)), false, 'touching edges are not overlap')
	assert.equal(aabbOverlap(rect(2, 2, 1, 1), rect(0, 0, 10, 10)), true, 'nested rects overlap')

	assert.equal(unionRects([]), null, 'empty union is null')
	assert.deepEqual(unionRects([rect(0, 0, 10, 10), rect(5, 5, 10, 10)]), rect(0, 0, 15, 15), 'union bounds')
	assert.equal(unionRects([rect(NaN, 0, 10, 10)]), null, 'non-finite rects ignored')
})

test('objectOverlapsAny', () => {
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10)), true, 'overlaps non-svg object')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(50, 50, 10, 10)), false, 'no overlap')
	assert.equal(objectOverlapsAny([obj('o1', 'svg', 0, 0)], assetMap, rect(5, 5, 10, 10)), false, 'svg objects are not collision bodies')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10), 'o1'), false, 'excluded id ignored')
	assert.equal(objectOverlapsAny([obj('o1', 'a', 0, 0), obj('o2', 'a', 0, 0)], assetMap, rect(5, 5, 10, 10), ['o1']), true, 'array exclude keeps other hit')
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
})
