import assert from 'node:assert/strict'
import { buildSyncedPayload } from '../src/blueprint-editor/syncedPayload'
import { buildAssetMap } from '../src/blueprint-editor/assetUtils'
import type { AssetDef, FloorLayoutData, NpcSimulationConfig } from '../src/blueprint-editor/types'

const NPC_CONFIG: NpcSimulationConfig = {
	speed: 0.2,
	defaultRoleId: 'staff',
	roles: [{ id: 'staff', label: 'Staff', color: '#ffffff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 100 }],
	tasks: [],
	pool: [{ roleId: 'staff', count: 3 }],
}

function makeLayout(over?: Partial<FloorLayoutData>): FloorLayoutData {
	return {
		version: 2,
		canvas: { width: 500, height: 400, tileSize: 25 },
		floors: [
			{ id: 'f1', name: 'Ground', label: 'G', objects: [] },
			{ id: 'f2', name: 'Level 1', label: 'F1', objects: [] },
		],
		...over,
	}
}

function makeAsset(over: Partial<AssetDef>): AssetDef {
	return {
		id: 'a-desk',
		name: 'Desk',
		w: 1,
		h: 1,
		walkable: false,
		interactSpots: [{ x: 12.5, y: 12.5 }],
		interact: { durationMin: 2, durationMax: 4 },
		queue: { maxMembers: 2, admissionDepth: 3 },
		...over,
	} as AssetDef
}

// ── Floor-key mapping (assignSyncKey contract) ──
{
	const payload = buildSyncedPayload(makeLayout(), new Map(), undefined)!
	assert.deepEqual(Object.keys(payload.floors).sort(), ['1', 'G'], "labels 'G'/'F1' map to keys G/1 (integer-like keys iterate first)")
	const dup = buildSyncedPayload(
		makeLayout({
			floors: [
				{ id: 'a', name: 'Atrium', label: 'Lobby', objects: [] },
				{ id: 'b', name: 'Mezzanine', label: 'Lobby', objects: [] },
			],
		}),
		new Map(),
		undefined,
	)!
	assert.deepEqual(Object.keys(dup.floors).sort(), ['1', 'G'], 'unmapped labels auto-index by order (first -> G)')

	const collisions = buildSyncedPayload(
		makeLayout({
			floors: [
				{ id: 'a', name: 'A', label: 'F1', objects: [] },
				{ id: 'b', name: 'B', label: 'F1', objects: [] },
				{ id: 'c', name: 'C', label: 'F1', objects: [] },
			],
		}),
		new Map(),
		undefined,
	)!
	assert.deepEqual(Object.keys(collisions.floors).sort(), ['1', '1_2', '1_3'], 'colliding numeric keys get _N suffix')
	const f0 = buildSyncedPayload(
		makeLayout({ floors: [{ id: 'x', name: 'Ground', label: 'Ground', objects: [] }] }),
		new Map(),
		undefined,
	)!
	assert.ok('G' in f0.floors, 'unrecognized first-floor label falls back to G')
}

// ── Object field propagation from origin asset ──
{
	const desk = makeAsset({})
	const layout = makeLayout({
		floors: [
			{
				id: 'f1',
				name: 'Ground',
				label: 'G',
				objects: [
					{ id: 'o1', type: 'a-desk', x: 25, y: 25, w: 25, h: 25, rotation: 90 as const, fillColor: '#112233' },
					{ id: 'o2', type: 'missing-asset', x: 100, y: 100, w: 25, h: 25, rotation: 0 },
				],
			},
		],
	})
	const payload = buildSyncedPayload(layout, buildAssetMap([desk]), NPC_CONFIG)!
	const floor = payload.floors['G']!

	assert.equal(floor.objects.length, 2)
	const mapped = floor.objects[0]
	assert.equal(mapped.walkable, false, 'walkable inherited from origin asset')
	assert.equal(mapped.doorRequired, false)
	assert.deepEqual(mapped.interactSpots, [{ x: 12.5, y: 12.5 }])
	assert.equal(mapped.interact?.capacity, undefined)
	assert.equal(mapped.interact?.durationMin, 2)
	assert.equal(mapped.queue?.maxMembers, 2)
	assert.equal(mapped.fillColor, '#112233', 'instance fill kept')
	assert.equal(mapped.strokeColor, undefined, 'unset stroke stays unset')

	const orphan = floor.objects[1]
	assert.equal(orphan.walkable, false, 'unknown asset type degrades to non-walkable')
	assert.equal(orphan.interactSpots, undefined)
}

// ── Persisted placements without w/h derive size from origin asset ──
{
	const table = makeAsset({ id: 'a-table', name: 'Table', w: 2, h: 1 })
	const layout = makeLayout({
		floors: [
			{
				id: 'f1',
				name: 'Ground',
				label: 'G',
				objects: [
					{ id: 'o1', type: 'a-table', x: 325, y: 225, rotation: 0 },
					{ id: 'o2', type: 'a-table', x: 400, y: 300, rotation: 90 },
				],
			},
		],
	} as Partial<FloorLayoutData>)
	const payload = buildSyncedPayload(layout, buildAssetMap([table]), undefined)!
	const floor = payload.floors['G']!
	assert.equal(floor.objects[0].w, 50, 'missing w derived from asset (2 tiles x tileSize)')
	assert.equal(floor.objects[0].h, 25, 'missing h derived from asset (1 tile x tileSize)')
	assert.equal(floor.objects[1].w, 25, 'rotation 90 swaps derived width')
	assert.equal(floor.objects[1].h, 50, 'rotation 90 swaps derived height')
}

// ── Wall object and asset wall propagation ──
{
	const wall = makeAsset({ id: 'a-wall', name: 'Wall', w: 2, h: 1, walkable: true, wallSegments: [{ x1: 0, y1: 0, x2: 2, y2: 0 }] })
	const payload = buildSyncedPayload(makeLayout({
		floors: [{
			id: 'f1',
			name: 'Ground',
			label: 'G',
			objects: [
				{ id: 'canvas-wall', type: '__canvas-wall__', x: 0, y: 0, w: 50, h: 1, rotation: 0, isWall: true, x1: 0, y1: 1, x2: 2, y2: 1 },
				{ id: 'asset-wall', type: wall.id, x: 100, y: 100, w: 50, h: 25, rotation: 0 },
			],
		}],
	}), buildAssetMap([wall]), undefined)!
	const syncedObjects = payload.floors.G!.objects
	assert.equal(syncedObjects[0].isWall, true)
	assert.deepEqual([syncedObjects[0].x1, syncedObjects[0].y1, syncedObjects[0].x2, syncedObjects[0].y2], [0, 1, 2, 1])
	assert.deepEqual(syncedObjects[1].wallSegments, wall.wallSegments)
}

// ── Canvas + npcConfig ──
{
	const payload = buildSyncedPayload(makeLayout(), new Map(), NPC_CONFIG)!
	assert.equal(payload.canvas.streetWidthTiles, 8, 'street width defaults to STREET_TILES')
	assert.equal(payload.version, 3)
	assert.ok(typeof payload.timestamp === 'number')
	assert.ok(payload.npcConfig)

	const custom = buildSyncedPayload(
		makeLayout({ streetWidthTiles: 6 }),
		new Map(),
		undefined,
	)!
	assert.equal(custom.canvas.streetWidthTiles, 6, 'explicit street width honored')
	assert.equal(custom.npcConfig, undefined, 'npcConfig omitted when absent')
}

// ── Degenerate input ──
{
	assert.equal(buildSyncedPayload(makeLayout({ floors: [] }), new Map(), undefined), null, 'zero floors -> null')
}
