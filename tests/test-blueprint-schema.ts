import assert from 'node:assert/strict'
import { applySvgColorConvention, isSafeSvgMarkup, normalizeBlueprintDataFile, normalizeInteractSpots, normalizeNpcConfig, normalizeObjectPlacement, normalizeOriginAsset, normalizeTag, normalizeWallSegment, normalizeWallSegments, resolveInteractSpotAnchor, resolveObjectDef, rotateInteractSpots90, snapSpotToEdge, parseCanvasConfig, CANVAS_FIELD_SPECS } from '../src/blueprint-editor/domain/types'
import { serializeAsset, serializeObject, resolveDoorMode } from '../src/blueprint-editor/assets/assetUtils'
import { reattachDoorModes } from '../src/blueprint-editor/domain/gridEditing'
import { resolvePlacedObject } from '../src/blueprint-editor/domain/geometry'
import { buildBlueprintData } from '../src/blueprint-editor/store/dataLoader'
import { emptyNpcConfig } from '../src/blueprint-editor/store/storeUtils'
import type { AssetDef, CanvasConfig, FloorLayoutData, ObjectData } from '../src/blueprint-editor/domain/types'

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
assert.deepEqual(resolveObjectDef(0, rotatableAsset, { w: 50, h: 25 }).interactSpots, [{ kind: 'stand', x: 10, y: 5 }, { kind: 'stand', x: 40, y: 20 }])
assert.deepEqual(resolveObjectDef(90, rotatableAsset, { w: 25, h: 50 }).interactSpots, [{ kind: 'stand', x: 20, y: 10 }, { kind: 'stand', x: 5, y: 40 }])
assert.deepEqual(resolveObjectDef(180, rotatableAsset, { w: 50, h: 25 }).interactSpots, [{ kind: 'stand', x: 40, y: 20 }, { kind: 'stand', x: 10, y: 5 }])
assert.deepEqual(resolveObjectDef(270, rotatableAsset, { w: 25, h: 50 }).interactSpots, [{ kind: 'stand', x: 5, y: 40 }, { kind: 'stand', x: 20, y: 10 }])

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
	...emptyNpcConfig(),
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
	...emptyNpcConfig(),
}, [])
assert.deepEqual(wallSaved.layout.floors[0].objects[0], serializedWall)

console.log('Wall paint persistence checks passed')

// ── Wall doorMode placement round-trip ──
assert.deepEqual(
  normalizeObjectPlacement({ id: 'door-test', type: '__canvas-wall__', x: 0, y: 0, rotation: 0, isWall: true, x1: 0, y1: 0, x2: 2, y2: 0, door: true, doorMode: 'auto-close' }),
  { id: 'door-test', type: '__canvas-wall__', x: 0, y: 0, rotation: 0, isWall: true, x1: 0, y1: 0, x2: 2, y2: 0, door: true, doorMode: 'auto-close' },
  'wall door mode survives placement normalize',
)
assert.equal(
  normalizeObjectPlacement({ id: 'door-test', type: '__canvas-wall__', x: 0, y: 0, rotation: 0, isWall: true, door: true, doorMode: 'party' })?.doorMode,
  undefined,
  'unknown door mode dropped',
)
assert.deepEqual(
  serializeObject({ id: 'door-test', type: '__canvas-wall__', x: 0, y: 0, rotation: 0, isWall: true, door: true, doorMode: 'hold-open' }),
  { id: 'door-test', type: '__canvas-wall__', x: 0, y: 0, rotation: 0, isWall: true, door: true, doorMode: 'hold-open' },
  'wall door mode survives serialize',
)
console.log('Wall door mode checks passed')

// ── InteractSpot union (stand/edge/post) + task.post round-trip ──
assert.deepEqual(normalizeInteractSpots([[1, 2]]), [{ kind: 'stand', x: 1, y: 2 }], 'tuple ingress normalizes to stand')
assert.deepEqual(normalizeInteractSpots([{ x: 1, y: 2, post: 'Bar Back' }]), [{ kind: 'stand', x: 1, y: 2, post: 'bar-back' }], 'post slug uses tag semantics')
assert.deepEqual(
	normalizeInteractSpots([{ kind: 'edge', edge: 'n', offset: 20, x: 20, y: 0, post: 'Bar-Back' }]),
	[{ kind: 'edge', edge: 'N', offset: 20, x: 20, y: 0, post: 'bar-back' }],
	'edge ingress uppercases edge enum and keeps render cache',
)
assert.equal(normalizeInteractSpots([{ kind: 'edge', edge: 'N', offset: 5 }]), undefined, 'edge without render cache is dropped')
assert.equal(normalizeInteractSpots([{ kind: 'edge', edge: 'Q', offset: 5, x: 0, y: 0 }]), undefined, 'unknown edge enum is dropped')
assert.deepEqual(
	normalizeInteractSpots([{ x: 1, y: 1 }, { x: 1, y: 1, post: 'a' }, { x: 1, y: 1, post: 'a' }]),
	[{ kind: 'stand', x: 1, y: 1 }, { kind: 'stand', x: 1, y: 1, post: 'a' }],
	'dedupe accounts for post names',
)
assert.equal(normalizeInteractSpots([]), undefined)
assert.equal(normalizeInteractSpots('nope'), undefined)
assert.deepEqual(resolveInteractSpotAnchor({ kind: 'edge', edge: 'S', offset: 7, x: 0, y: 0 }, 100, 50), { x: 7, y: 50 })
assert.deepEqual(resolveInteractSpotAnchor({ x: 3, y: 4 }, 100, 50), { x: 3, y: 4 }, 'bare legacy spot anchors as-is')
assert.deepEqual(
	rotateInteractSpots90([{ kind: 'edge', edge: 'N', offset: 20, x: 20, y: 0 }], 100, 50, 1),
	[{ kind: 'edge', edge: 'E', offset: 20, x: 50, y: 20 }],
	'edge rotates enum clockwise and refreshes render cache from the anchor',
)
assert.deepEqual(
	rotateInteractSpots90([{ kind: 'edge', edge: 'N', offset: 20, x: 20, y: 0, post: 'back' }], 100, 50, 2),
	[{ kind: 'edge', edge: 'S', offset: 20, x: 80, y: 50, post: 'back' }],
	'post names never rotate; offset scalar preserved',
)
assert.deepEqual(snapSpotToEdge(20, 2, 100, 50), { edge: 'N', offset: 20 }, 'near top snaps north')
assert.deepEqual(snapSpotToEdge(20, 49, 100, 50), { edge: 'S', offset: 20 }, 'near bottom snaps south')
assert.deepEqual(snapSpotToEdge(99, 20, 100, 50), { edge: 'E', offset: 20 }, 'near right snaps east')
assert.deepEqual(snapSpotToEdge(1, 20, 100, 50), { edge: 'W', offset: 20 }, 'near left snaps west')
assert.deepEqual(snapSpotToEdge(150, 25, 100, 50), { edge: 'E', offset: 25 }, 'offset clamps to edge length')
assert.deepEqual(snapSpotToEdge(50, 25, 100, 50), { edge: 'N', offset: 50 }, 'center ties break toward north deterministically')
const postedConfig = normalizeNpcConfig({
	speed: 0.2,
	defaultRoleId: 'r1',
	roles: [{ id: 'r1', label: 'Staff', color: '#fff', focusTags: [], restrictedTags: [], taskIds: ['t1'], focusChance: 100 }],
	tasks: [
		{ id: 't1', label: 'Tend', tags: ['bar'], post: { assetId: 'bar-1', post: 'Bar Back' } },
		{ id: 't2', label: 'Plain', tags: [] },
		{ id: 't3', label: 'Broken', tags: [], post: { assetId: '' } },
	],
	pool: [],
})
assert.ok(postedConfig)
assert.deepEqual(postedConfig.tasks[0].post, { assetId: 'bar-1', post: 'bar-back' })
assert.equal(postedConfig.tasks[1].post, undefined)
assert.equal(postedConfig.tasks[2].post, undefined, 'bad post sanitizes in place - task survives')
assert.equal(postedConfig.tasks.length, 3, 'no task dropped by post sanitize')
console.log('InteractSpot union + task.post checks passed')

// ── WallSegment.doorMode round-trip ──
assert.deepEqual(
  normalizeWallSegment({ x1: 0, y1: 5, x2: 4, y2: 5, door: true, doorMode: 'auto-close' }),
  { x1: 0, y1: 5, x2: 4, y2: 5, door: true, doorMode: 'auto-close' },
  'door mode survives normalize',
)
assert.equal(normalizeWallSegment({ x1: 0, y1: 5, x2: 4, y2: 5, door: true, doorMode: 'party' })?.doorMode, undefined, 'unknown mode dropped')
assert.equal(normalizeWallSegment({ x1: 0, y1: 5, x2: 4, y2: 5, doorMode: 'auto-close' })?.doorMode, undefined, 'mode without door flag dropped')
const mergedModes = normalizeWallSegments([
  { x1: 0, y1: 5, x2: 4, y2: 5, door: true },
  { x1: 0, y1: 5, x2: 4, y2: 5, door: true, doorMode: 'hold-open' },
])
assert.equal(mergedModes?.[0]?.doorMode, 'hold-open', 'dedupe merges mode onto first')
assert.equal(resolveDoorMode(undefined, true), 'auto-close', 'rooms derive auto-close')
assert.equal(resolveDoorMode(undefined, false), 'hold-open', 'passage derives hold-open')
assert.equal(resolveDoorMode('hold-open', true), 'hold-open', 'explicit wins over derived')
assert.deepEqual(
  reattachDoorModes(
    [{ x1: 0, y1: 0, x2: 1, y2: 0, door: true, doorMode: 'auto-close' }],
    [{ x1: 0, y1: 0, x2: 1, y2: 0, door: true }],
  ),
  [{ x1: 0, y1: 0, x2: 1, y2: 0, door: true, doorMode: 'auto-close' }],
  'grid save reattaches mode by coords',
)
console.log('Door mode model checks passed')

console.log('Blueprint schema checks passed')
