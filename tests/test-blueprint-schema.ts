import assert from 'node:assert/strict'
import { normalizeObjectPlacement, resolveObjectDef } from '../src/blueprint-editor/types'
import { serializeAsset, serializeObject } from '../src/blueprint-editor/assetUtils'
import { resolvePlacedObject } from '../src/blueprint-editor/geometry'
import { buildBlueprintData } from '../src/blueprint-editor/store/dataLoader'
import type { AssetDef, FloorLayoutData, ObjectData } from '../src/blueprint-editor/types'

const rawPlacement = normalizeObjectPlacement({
	id: 'obj-test',
	type: 'asset-test',
	x: 25,
	y: 50,
	rotation: 360,
	w: 999,
	h: 999,
	walkableGrid: [[true]],
	interactSpots: [{ x: 1, y: 1 }],
	unknownField: true,
})
assert.deepEqual(rawPlacement, {
	id: 'obj-test',
	type: 'asset-test',
	x: 25,
	y: 50,
	rotation: 0,
})

const runtimeObject: ObjectData = {
	...rawPlacement!,
	w: 50,
	h: 25,
	padding: 10,
	fillColor: '#fff',
}
const serializedObject = serializeObject(runtimeObject)
assert.deepEqual(serializedObject, {
	id: 'obj-test',
	type: 'asset-test',
	x: 25,
	y: 50,
	rotation: 0,
})

const runtimeAsset = {
	id: 'asset-test',
	name: 'Test Asset',
	origin: 'drawn',
	w: 2,
	h: 1,
	defaultPadding: 0,
	defaultRx: { tl: 0, tr: 0, br: 0, bl: 0 },
	entranceRequired: false,
	tags: [],
	unknownField: true,
} as unknown as AssetDef
const resolvedObject = resolvePlacedObject(rawPlacement!, runtimeAsset, 25)
assert.equal(resolvedObject?.w, 50)
assert.equal(resolvedObject?.h, 25)

const rotatableAsset: AssetDef = {
	...runtimeAsset,
	interactSpots: [{ x: 10, y: 5 }, { x: 40, y: 20 }],
}
assert.deepEqual(resolveObjectDef(0, rotatableAsset, { w: 50, h: 25 }).interactSpots, [{ x: 10, y: 5 }, { x: 40, y: 20 }])
assert.deepEqual(resolveObjectDef(90, rotatableAsset, { w: 25, h: 50 }).interactSpots, [{ x: 20, y: 10 }, { x: 5, y: 40 }])
assert.deepEqual(resolveObjectDef(180, rotatableAsset, { w: 50, h: 25 }).interactSpots, [{ x: 40, y: 20 }, { x: 10, y: 5 }])
assert.deepEqual(resolveObjectDef(270, rotatableAsset, { w: 25, h: 50 }).interactSpots, [{ x: 5, y: 40 }, { x: 20, y: 10 }])

const serializedAsset = serializeAsset(runtimeAsset)
assert.equal('unknownField' in serializedAsset, false)
assert.equal('defaultPadding' in serializedAsset, false)
assert.equal('defaultRx' in serializedAsset, false)
assert.equal('entranceRequired' in serializedAsset, false)
assert.equal('tags' in serializedAsset, false)

const layout: FloorLayoutData = {
	version: 2,
	canvas: { width: 400, height: 300, tileSize: 25 },
	floors: [{
		id: 'floor-test',
		name: 'Test Floor',
		label: 'T1',
		objects: [runtimeObject],
	}],
}
const saved = buildBlueprintData(layout, [runtimeAsset], {
	speed: 0.2,
	defaultRoleId: '',
	roles: [],
	tasks: [],
	pool: [],
}, [])
const savedObject = saved.layout.floors[0].objects[0]
assert.deepEqual(Object.keys(savedObject).sort(), ['id', 'rotation', 'type', 'x', 'y'])
assert.equal('w' in savedObject, false)
assert.equal('interactSpots' in savedObject, false)
assert.equal('walkableGrid' in savedObject, false)

console.log('Blueprint schema checks passed')
