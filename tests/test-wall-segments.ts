import assert from 'node:assert/strict'
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import { normalizeWallSegment, resolveWallSegmentsForObject } from '../src/blueprint-editor/types'
import type { AssetDef, FloorData } from '../src/blueprint-editor/types'

const TILE = 25

assert.deepEqual(normalizeWallSegment({ x1: 2, y1: 3, x2: 1, y2: 3 }), { x1: 1, y1: 3, x2: 2, y2: 3 })
assert.equal(normalizeWallSegment({ x1: 1, y1: 1, x2: 2, y2: 2 }), undefined)
assert.equal(normalizeWallSegment({ x1: 1, y1: 1, x2: 1, y2: 1 }), undefined)

const wallAsset: AssetDef = {
	id: 'a-wall',
	name: 'Wall Asset',
	w: 2,
	h: 2,
	walkable: true,
	wallSegments: [{ x1: 0, y1: 0, x2: 2, y2: 0 }],
}
const rotated = resolveWallSegmentsForObject(wallAsset.wallSegments, wallAsset, {
	x: 100,
	y: 100,
	w: 50,
	h: 50,
	rotation: 90,
}, TILE)
assert.deepEqual(rotated, [{ x1: 150, y1: 100, x2: 150, y2: 150 }])

const floor: FloorData = {
	id: 'f1',
	name: 'Ground',
	label: 'G',
	defaultWalkable: true,
	objects: [
		{
			id: 'wall-canvas',
			type: '__canvas-wall__',
			x: 100,
			y: 200,
			w: 200,
			h: 1,
			rotation: 0,
			isWall: true,
			x1: 4,
			y1: 8,
			x2: 12,
			y2: 8,
		},
		{ id: 'wall-asset', type: wallAsset.id, x: 100, y: 100, w: 50, h: 50, rotation: 0 },
	],
}
const assets = new Map([[wallAsset.id, wallAsset]])
const { layout, floorMaps } = buildNpcEngineLayout(
	[floor],
	{ w: 500, h: 400, tileSize: TILE },
	type => assets.get(type),
)
const blocked = new Set((layout.floors[0]?.blockedEdges ?? []).map(edge => `${edge.from.x},${edge.from.y}>${edge.to.x},${edge.to.y}`))

for (let col = 4; col < 12; col++) {
	assert.ok(blocked.has(`${col},7>${col},8`), `canvas wall blocks column ${col}`)
}
assert.ok(blocked.has('4,3>4,4'), 'asset-setting wall blocks its transformed top edge')
assert.ok(floorMaps.get('f1')?.tiles.has('4,7'))
assert.ok(floorMaps.get('f1')?.tiles.has('4,8'))
console.log('Wall segment engine checks passed')
