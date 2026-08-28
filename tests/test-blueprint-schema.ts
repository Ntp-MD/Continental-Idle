import assert from 'node:assert/strict'
import { applySvgColorConvention, isSafeSvgMarkup, normalizeBlueprintDataFile, normalizeObjectPlacement, normalizeOriginAsset, normalizeTag, resolveObjectDef, parseCanvasConfig, CANVAS_FIELD_SPECS } from '../src/blueprint-editor/types'
import { serializeAsset, serializeObject } from '../src/blueprint-editor/assetUtils'
import { resolvePlacedObject } from '../src/blueprint-editor/geometry'
import { buildBlueprintData } from '../src/blueprint-editor/store/dataLoader'
import type { AssetDef, CanvasConfig, FloorLayoutData, ObjectData } from '../src/blueprint-editor/types'

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
assert.equal(normalizeTag('Guest Room'), 'guest-room')
assert.equal(normalizeTag('bad<tag>'), 'badtag')
assert.equal(normalizeTag('   '), undefined)

const runtimeObject: ObjectData = {
	...rawPlacement!,
	w: 50,
	h: 25,
	padding: 10,
	fillColor: '#fff',
	strokeColor: '#123456',
}
const serializedObject = serializeObject(runtimeObject)
assert.deepEqual(serializedObject, {
	id: 'obj-test',
	type: 'asset-test',
	x: 25,
	y: 50,
	rotation: 0,
	fillColor: '#fff',
	strokeColor: '#123456',
})

const runtimeAsset = {
	id: 'asset-test',
	name: 'Test Asset',
	origin: 'drawn',
	w: 2,
	h: 1,
	defaultPadding: 0,
	defaultRx: { tl: 0, tr: 0, br: 0, bl: 0 },
	doorRequired: false,
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
assert.equal('doorRequired' in serializedAsset, false)
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
assert.deepEqual(Object.keys(savedObject).sort(), ['fillColor', 'id', 'rotation', 'strokeColor', 'type', 'x', 'y'])
assert.equal('w' in savedObject, false)
assert.equal('interactSpots' in savedObject, false)
assert.equal('walkableGrid' in savedObject, false)

const normalizedAsset = normalizeOriginAsset({
	...runtimeAsset,
	defaultFillColor: '#fff',
	unknownField: true,
})
assert.ok(normalizedAsset)
assert.equal('unknownField' in normalizedAsset, false)

const normalizedData = normalizeBlueprintDataFile({
	...saved,
	originAssets: [{ ...saved.originAssets[0], unknownField: true }],
	layout: {
		...saved.layout,
		floors: [{
			...saved.layout.floors[0],
			objects: [{ ...saved.layout.floors[0].objects[0], unknownField: true }],
		}],
	},
})
assert.ok(normalizedData)
assert.equal('unknownField' in normalizedData.originAssets[0], false)
assert.equal('unknownField' in normalizedData.layout.floors[0].objects[0], false)
const normalizedInvalidOptional = normalizeBlueprintDataFile({
	...saved,
	layout: {
		...saved.layout,
		floors: [{
			...saved.layout.floors[0],
			objects: [{ ...saved.layout.floors[0].objects[0], fillColor: 'not-a-color' }],
		}],
	},
})
assert.ok(normalizedInvalidOptional)
assert.equal('fillColor' in normalizedInvalidOptional.layout.floors[0].objects[0], false)
assert.equal(normalizeOriginAsset({ ...runtimeAsset, walkableGrid: [[true], [true, false]] }), undefined)
assert.equal(isSafeSvgMarkup('<script>alert(1)</script>'), false)
assert.equal(isSafeSvgMarkup('<rect fill="#fff"/>'), true)
assert.equal(normalizeBlueprintDataFile({ ...saved, version: 3 }), undefined)
assert.equal(normalizeBlueprintDataFile({
	...saved,
	originAssets: [{ ...saved.originAssets[0], svg: '<script>alert(1)</script>', svgViewBox: { w: 10, h: 10 } }],
}), undefined)
console.log('Blueprint boundary hardening checks passed')

const conv = applySvgColorConvention
assert.equal(conv('<rect fill="none" stroke="#ff0000"/>'), '<rect fill="var(--obj-fill,none)" stroke="var(--obj-stroke,#ff0000)"/>')
assert.equal(conv('<rect stroke="url(#grad)" fill="#aabbcc"/>'), '<rect stroke="url(#grad)" fill="var(--obj-fill,#aabbcc)"/>')
assert.equal(conv('<rect fill="var(--obj-fill,none)" stroke="none"/>'), '<rect fill="var(--obj-fill,none)" stroke="none"/>')
assert.equal(conv("<circle fill='#fff' stroke='rgba(1,2,3,0.5)'/>"), "<circle fill='var(--obj-fill,#fff)' stroke='var(--obj-stroke,rgba(1,2,3,0.5))'/>")
assert.equal(conv('<path d="M0 0"/>'), '<path d="M0 0"/>')
assert.equal(conv('<rect fill="none" stroke="#abc" fill="none"/>'), '<rect fill="var(--obj-fill,none)" stroke="var(--obj-stroke,#abc)" fill="var(--obj-fill,none)"/>')
console.log('SVG color convention checks passed')

const canvasKeys = Object.keys(CANVAS_FIELD_SPECS).sort()
assert.deepEqual(canvasKeys, ['bgColor', 'height', 'labelColor', 'tileSize', 'wallColor', 'wallThickness', 'width'])

const sampleCanvas: Required<CanvasConfig> = { width: 100, height: 50, tileSize: 25, bgColor: '#000000', labelColor: '#cccccc', wallColor: '#ffffff', wallThickness: 4 }
const roundTrip = parseCanvasConfig(sampleCanvas, true)
assert.deepEqual(roundTrip, sampleCanvas)

const strictCanvas = parseCanvasConfig({ width: 100, height: 50, tileSize: 25, wallColor: '#ffffff', wallThickness: 4 }, true)
assert.deepEqual(strictCanvas, { width: 100, height: 50, tileSize: 25, wallColor: '#ffffff', wallThickness: 4 })
assert.equal(parseCanvasConfig({ width: 100, height: 50, tileSize: 25, wallColor: 'white' }, true), null)
assert.equal(parseCanvasConfig({ width: 100, height: 50, tileSize: 25, wallThickness: 11 }, true), null)
assert.equal(parseCanvasConfig({ height: 50, tileSize: 25 }, true), null)

const lenientCanvas = parseCanvasConfig({ width: 100, height: 50, tileSize: 25, wallColor: 'not-a-color', wallThickness: 99 }, false)
assert.deepEqual(lenientCanvas, { width: 100, height: 50, tileSize: 25 })
console.log('Canvas config pipeline checks passed')

const wallObject: ObjectData = {
	id: 'wall-test',
	type: '__canvas-wall__',
	x: 0,
	y: 0,
	w: 50,
	h: 1,
	rotation: 0,
	isWall: true,
	x1: 0,
	y1: 0,
	x2: 2,
	y2: 0,
}
const serializedWall = serializeObject(wallObject)
assert.deepEqual(serializedWall, {
	id: 'wall-test',
	type: '__canvas-wall__',
	x: 0,
	y: 0,
	rotation: 0,
	isWall: true,
	x1: 0,
	y1: 0,
	x2: 2,
	y2: 0,
})
const wallSaved = buildBlueprintData({
	...layout,
	floors: [{ ...layout.floors[0], objects: [wallObject] }],
}, [], {
	speed: 0.2,
	defaultRoleId: '',
	roles: [],
	tasks: [],
	pool: [],
}, [])
assert.deepEqual(wallSaved.layout.floors[0].objects[0], serializedWall)

console.log('Wall paint persistence checks passed')

console.log('Blueprint schema checks passed')
