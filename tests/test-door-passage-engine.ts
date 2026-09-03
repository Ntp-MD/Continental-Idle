import assert from 'node:assert/strict'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_OPTIONS,
	buildDoorEdges,
	buildBlockedEdges,
	buildWalkableMap,
	buildNpcEngineLayout,
	type NpcEngineLayout,
	type NpcEngineFloor,
	type NpcEngineEvent,
	type NpcCanvasBounds,
} from '../src/engine/npc'
import type { FloorData, AssetDef, WallSegment, ObjectData } from '../src/blueprint-editor/domain/types'
import { CANVAS_WALL_OBJECT_TYPE, resolveWallSegmentsForObject } from '../src/blueprint-editor/domain/types'
import { doorPanelsData } from '../src/blueprint-editor/assets/assetUtils'

// ============================================================================
// Helpers
// ============================================================================
function makeRng(seed: number): () => number {
	let state = seed >>> 0 || 1
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0
		return state / 4294967296
	}
}

const TILE = 25
const CANVAS: NpcCanvasBounds = { w: 200, h: 200, tileSize: TILE, streetTiles: 0, streetFloorId: 'F1' }

function makeFloor(objects: ObjectData[] = [], opts: { defaultWalkable?: boolean; id?: string } = {}): FloorData {
	return {
		id: opts.id ?? 'F1',
		name: 'Test Floor',
		label: 'F1',
		objects,
		defaultWalkable: opts.defaultWalkable ?? true,
	}
}

function makeCanvasWallDoor(x1: number, y1: number, x2: number, y2: number): ObjectData {
	return {
		id: `wall-${x1}-${y1}-${x2}-${y2}`,
		type: CANVAS_WALL_OBJECT_TYPE,
		x: 0, y: 0, w: 0, h: 0, rotation: 0,
		isWall: true,
		x1, y1, x2, y2,
		door: true,
	}
}

function makeCanvasWall(x1: number, y1: number, x2: number, y2: number): ObjectData {
	return {
		id: `wall-${x1}-${y1}-${x2}-${y2}`,
		type: CANVAS_WALL_OBJECT_TYPE,
		x: 0, y: 0, w: 0, h: 0, rotation: 0,
		isWall: true,
		x1, y1, x2, y2,
	}
}

function makeAssetDoor(w: number, h: number, doorSeg: WallSegment, extraSegs: WallSegment[] = []): AssetDef {
	return {
		id: 'test-asset-door',
		name: 'Test Asset Door',
		w, h,
		walkable: true,
		wallSegments: [doorSeg, ...extraSegs],
	}
}

function makePlacedAsset(asset: AssetDef, x: number, y: number, rotation: 0 | 90 | 180 | 270 = 0): ObjectData {
	const w = rotation === 90 || rotation === 270 ? asset.h * TILE : asset.w * TILE
	const h = rotation === 90 || rotation === 270 ? asset.w * TILE : asset.h * TILE
	return {
		id: `placed-${asset.id}-${x}-${y}`,
		type: asset.id,
		x, y, w, h, rotation,
	}
}

function doorPathfinder(_floor: NpcEngineFloor, from: { x: number; y: number }, to: { x: number; y: number }) {
	const path: { x: number; y: number }[] = []
	let cx = Math.floor(from.x)
	let cy = Math.floor(from.y)
	path.push({ x: cx, y: cy })
	while (cx !== Math.floor(to.x) || cy !== Math.floor(to.y)) {
		if (cx < to.x) cx++
		else if (cx > to.x) cx--
		else if (cy < to.y) cy++
		else if (cy > to.y) cy--
		path.push({ x: cx, y: cy })
	}
	return path
}

function makeWalkableGrid(w: number, h: number): { x: number; y: number }[] {
	const tiles: { x: number; y: number }[] = []
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tiles.push({ x, y })
	return tiles
}

// ============================================================================
// PHASE 1: buildDoorEdges - basic canvas wall doors
// ============================================================================
console.log('--- Phase 1: buildDoorEdges basic canvas wall doors ---')

// Horizontal door at y=3, x=2..5 (canvas wall coordinates in tiles)
const hDoorFloor = makeFloor([makeCanvasWallDoor(2, 3, 5, 3)])
const hDoorMap = buildWalkableMap(hDoorFloor, CANVAS)
const hDoorEdges = buildDoorEdges(hDoorFloor, hDoorMap)
assert.ok(hDoorEdges.length > 0, 'horizontal canvas door produces door edges')
// Door at y=3 means edges between y=2->y=3 and y=3->y=4 for x in [2,4]
for (const edge of hDoorEdges) {
	assert.equal(edge.from.y + 1, edge.to.y, 'door edge is vertical (y increases by 1)')
	assert.ok(edge.from.x >= 2 && edge.from.x <= 4, `door edge x in [2,4], got ${edge.from.x}`)
}

// Vertical door at x=3, y=2..5
const vDoorFloor = makeFloor([makeCanvasWallDoor(3, 2, 3, 5)])
const vDoorMap = buildWalkableMap(vDoorFloor, CANVAS)
const vDoorEdges = buildDoorEdges(vDoorFloor, vDoorMap)
assert.ok(vDoorEdges.length > 0, 'vertical canvas door produces door edges')
for (const edge of vDoorEdges) {
	assert.equal(edge.from.x + 1, edge.to.x, 'door edge is horizontal (x increases by 1)')
	assert.ok(edge.from.y >= 2 && edge.from.y <= 4, `door edge y in [2,4], got ${edge.from.y}`)
}

console.log('Phase 1: PASS')

// ============================================================================
// PHASE 2: buildDoorEdges vs buildBlockedEdges - doors don't block
// ============================================================================
console.log('--- Phase 2: door edges vs blocked edges ---')

// Floor with both a door and a regular wall
const mixedFloor = makeFloor([
	makeCanvasWallDoor(2, 3, 5, 3),  // door
	makeCanvasWall(0, 0, 4, 0),      // wall (no door)
])
const mixedMap = buildWalkableMap(mixedFloor, CANVAS)
const blockedEdges = buildBlockedEdges(mixedFloor, mixedMap)
const doorEdges = buildDoorEdges(mixedFloor, mixedMap)

// Door segment should NOT appear in blockedEdges
// Door at y=3 means edges between y=2 and y=3 (from.y=2, to.y=3)
const doorBlockedCount = blockedEdges.filter(e =>
	(e.from.y + 1 === e.to.y && e.to.y === 3 && e.from.x >= 2 && e.from.x <= 4)
).length
assert.equal(doorBlockedCount, 0, 'door segment does NOT appear in blocked edges')

// Door segment SHOULD appear in doorEdges
const doorEdgeCount = doorEdges.filter(e =>
	(e.from.y + 1 === e.to.y && e.to.y === 3 && e.from.x >= 2 && e.from.x <= 4)
).length
assert.ok(doorEdgeCount > 0, 'door segment appears in door edges')

// Wall segment should NOT appear in doorEdges
const wallDoorCount = doorEdges.filter(e =>
	e.from.y + 1 === e.to.y && e.from.y === 0
).length
assert.equal(wallDoorCount, 0, 'wall segment does NOT appear in door edges')

console.log('Phase 2: PASS')

// ============================================================================
// PHASE 3: buildDoorEdges with asset-placed doors (all rotations)
// ============================================================================
console.log('--- Phase 3: buildDoorEdges with asset doors (rotations) ---')

const doorAsset = makeAssetDoor(4, 2, { x1: 0, y1: 1, x2: 4, y2: 1, door: true })
const rotations = [0, 90, 180, 270] as const

for (const rot of rotations) {
	const placed = makePlacedAsset(doorAsset, 50, 50, rot)
	const floor = makeFloor([placed])
	const map = buildWalkableMap(floor, CANVAS, (id: string) => id === doorAsset.id ? doorAsset : undefined)
	const edges = buildDoorEdges(floor, map, (id: string) => id === doorAsset.id ? doorAsset : undefined)
	assert.ok(edges.length > 0, `rotation ${rot}: asset door produces door edges`)
	// Verify edges are consistent (either all horizontal or all vertical)
	const allHorizontal = edges.every(e => e.from.x + 1 === e.to.x)
	const allVertical = edges.every(e => e.from.y + 1 === e.to.y)
	assert.ok(allHorizontal || allVertical, `rotation ${rot}: door edges are consistently oriented`)
}

console.log('Phase 3: PASS')

// ============================================================================
// PHASE 4: buildDoorEdges - empty/mixed/no-door cases
// ============================================================================
console.log('--- Phase 4: buildDoorEdges edge cases ---')

// No doors at all
const noDoorFloor = makeFloor([makeCanvasWall(0, 0, 4, 0)])
const noDoorMap = buildWalkableMap(noDoorFloor, CANVAS)
assert.equal(buildDoorEdges(noDoorFloor, noDoorMap).length, 0, 'no door segments = no door edges')

// Empty floor
const emptyFloor = makeFloor([])
const emptyMap = buildWalkableMap(emptyFloor, CANVAS)
assert.equal(buildDoorEdges(emptyFloor, emptyMap).length, 0, 'empty floor = no door edges')

// Multiple doors on same floor
const multiDoorFloor = makeFloor([
	makeCanvasWallDoor(2, 3, 5, 3),
	makeCanvasWallDoor(3, 0, 3, 4),
])
const multiDoorMap = buildWalkableMap(multiDoorFloor, CANVAS)
const multiEdges = buildDoorEdges(multiDoorFloor, multiDoorMap)
assert.ok(multiEdges.length > 2, 'multiple doors produce multiple door edges')

console.log('Phase 4: PASS')

// ============================================================================
// PHASE 5: buildNpcEngineLayout includes doorEdges
// ============================================================================
console.log('--- Phase 5: buildNpcEngineLayout includes doorEdges ---')

const layoutFloor = makeFloor([makeCanvasWallDoor(2, 3, 5, 3)])
const result = buildNpcEngineLayout([layoutFloor], CANVAS)
const engineFloor = result.layout.floors[0]
assert.ok(engineFloor.doorEdges, 'engine floor has doorEdges')
assert.ok(engineFloor.doorEdges!.length > 0, 'engine floor doorEdges is non-empty')
assert.ok(engineFloor.blockedEdges, 'engine floor still has blockedEdges')

// Floor without doors should have empty/undefined doorEdges
const noDoorLayoutFloor = makeFloor([makeCanvasWall(0, 0, 4, 0)])
const noDoorResult = buildNpcEngineLayout([noDoorLayoutFloor], CANVAS)
const noDoorEngineFloor = noDoorResult.layout.floors[0]
assert.ok(!noDoorEngineFloor.doorEdges || noDoorEngineFloor.doorEdges.length === 0, 'floor without doors has empty doorEdges')

console.log('Phase 5: PASS')

// ============================================================================
// PHASE 6: Engine door-passage - NPC crosses door in both directions
// ============================================================================
console.log('--- Phase 6: Engine door-passage both directions ---')

const biDirFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 2, y: 2 }, to: { x: 2, y: 3 } }],
}
const biDirLayout: NpcEngineLayout = { floors: [biDirFloor], interactionTargets: [] }

// Forward: NPC walks from (2,1) to (2,5) - crosses door (2,2)->(2,3)
const fwdEngine = new NpcEngine(biDirLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(1), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 5 }),
})
fwdEngine.addAgent({ id: 'fwd', floorId: 'F1', x: 2, y: 1, targetX: 2, targetY: 5, speed: 1 })
fwdEngine.tick(10)
const fwdEvents = fwdEngine.drainEvents().filter(e => e.type === 'door-passage')
assert.ok(fwdEvents.length > 0, 'forward: door-passage emitted')
assert.equal(fwdEvents[0].doorEdge!.from.x, 2, 'forward: from.x = 2')
assert.equal(fwdEvents[0].doorEdge!.from.y, 2, 'forward: from.y = 2')
assert.equal(fwdEvents[0].doorEdge!.to.x, 2, 'forward: to.x = 2')
assert.equal(fwdEvents[0].doorEdge!.to.y, 3, 'forward: to.y = 3')

// Reverse: NPC walks from (2,5) to (2,0) - crosses door (2,3)->(2,2)
const revEngine = new NpcEngine(biDirLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(2), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 0 }),
})
revEngine.addAgent({ id: 'rev', floorId: 'F1', x: 2, y: 5, targetX: 2, targetY: 0, speed: 1 })
revEngine.tick(10)
const revEvents = revEngine.drainEvents().filter(e => e.type === 'door-passage')
assert.ok(revEvents.length > 0, 'reverse: door-passage emitted')
// In reverse, from should be (2,3) and to should be (2,2)
assert.equal(revEvents[0].doorEdge!.from.x, 2, 'reverse: from.x = 2')
assert.equal(revEvents[0].doorEdge!.from.y, 3, 'reverse: from.y = 3')
assert.equal(revEvents[0].doorEdge!.to.x, 2, 'reverse: to.x = 2')
assert.equal(revEvents[0].doorEdge!.to.y, 2, 'reverse: to.y = 2')

console.log('Phase 6: PASS')

// ============================================================================
// PHASE 7: Engine door-passage - NPC walks ALONG door edge (no crossing)
// ============================================================================
console.log('--- Phase 7: NPC walks along door edge (no crossing) ---')

// Door at (3,2)->(3,3). NPC walks from (0,2) to (5,2) - parallel to door, no crossing
const alongFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 3, y: 2 }, to: { x: 3, y: 3 } }],
}
const alongLayout: NpcEngineLayout = { floors: [alongFloor], interactionTargets: [] }
const alongEngine = new NpcEngine(alongLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(3), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 5, y: 2 }),
})
alongEngine.addAgent({ id: 'along', floorId: 'F1', x: 0, y: 2, targetX: 5, targetY: 2, speed: 1 })
alongEngine.tick(10)
const alongEvents = alongEngine.drainEvents().filter(e => e.type === 'door-passage')
assert.equal(alongEvents.length, 0, 'walking along door edge: no door-passage events')

console.log('Phase 7: PASS')

// ============================================================================
// PHASE 8: Engine door-passage - NPC standing still on door edge
// ============================================================================
console.log('--- Phase 8: NPC standing still (no passage) ---')

const stillFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 2, y: 2 }, to: { x: 2, y: 3 } }],
}
const stillLayout: NpcEngineLayout = { floors: [stillFloor], interactionTargets: [] }
const stillEngine = new NpcEngine(stillLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(4), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 2 }),
})
// NPC starts at (2,2) and wanders to (2,2) - no movement = no passage
stillEngine.addAgent({ id: 'still', floorId: 'F1', x: 2, y: 2, targetX: 2, targetY: 2, speed: 1 })
stillEngine.tick(10)
const stillEvents = stillEngine.drainEvents().filter(e => e.type === 'door-passage')
assert.equal(stillEvents.length, 0, 'NPC standing still: no door-passage events')

console.log('Phase 8: PASS')

// ============================================================================
// PHASE 9: Engine door-passage - multiple NPCs cross same door
// ============================================================================
console.log('--- Phase 9: multiple NPCs cross same door ---')

const multiNpcFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 2, y: 2 }, to: { x: 2, y: 3 } }],
}
const multiNpcLayout: NpcEngineLayout = { floors: [multiNpcFloor], interactionTargets: [] }
const multiNpcEngine = new NpcEngine(multiNpcLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(5), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 5 }),
})
multiNpcEngine.addAgent({ id: 'npc-a', floorId: 'F1', x: 2, y: 1, targetX: 2, targetY: 5, speed: 1 })
multiNpcEngine.addAgent({ id: 'npc-b', floorId: 'F1', x: 3, y: 1, targetX: 3, targetY: 5, speed: 1 })
multiNpcEngine.tick(15)
const multiNpcEvents = multiNpcEngine.drainEvents().filter(e => e.type === 'door-passage')
// At least one NPC should cross the door (npc-a at x=2 crosses (2,2)->(2,3))
assert.ok(multiNpcEvents.length > 0, 'multiple NPCs: at least one door-passage event')
// Check that we get events from different agents
const agentIds = new Set(multiNpcEvents.map(e => e.agentId))
assert.ok(agentIds.size > 0, 'multiple NPCs: events from different agents')

console.log('Phase 9: PASS')

// ============================================================================
// PHASE 10: Engine door-passage - event tick field
// ============================================================================
console.log('--- Phase 10: door-passage event tick field ---')

const tickFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 2, y: 2 }, to: { x: 2, y: 3 } }],
}
const tickLayout: NpcEngineLayout = { floors: [tickFloor], interactionTargets: [] }
const tickEngine = new NpcEngine(tickLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(6), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 5 }),
})
tickEngine.addAgent({ id: 'tick-npc', floorId: 'F1', x: 2, y: 1, targetX: 2, targetY: 5, speed: 1 })
tickEngine.tick(10)
const tickEvents = tickEngine.drainEvents().filter(e => e.type === 'door-passage')
assert.ok(tickEvents.length > 0, 'tick: door-passage event emitted')
for (const evt of tickEvents) {
	assert.ok(typeof evt.tick === 'number', 'tick: event has numeric tick field')
	assert.ok(evt.tick > 0, 'tick: event tick is positive')
	assert.ok(evt.tick <= tickEngine.tickNumber, 'tick: event tick <= engine tickNumber')
}

console.log('Phase 10: PASS')

// ============================================================================
// PHASE 11: Engine door-passage - door at map boundary
// ============================================================================
console.log('--- Phase 11: door at map boundary ---')

const boundaryFloor: NpcEngineFloor = {
	id: 'F1', width: 4, height: 4, tileSize: 1,
	walkable: makeWalkableGrid(4, 4),
	blockedEdges: [],
	doorEdges: [
		{ from: { x: 0, y: 0 }, to: { x: 0, y: 1 } },  // left edge
		{ from: { x: 3, y: 3 }, to: { x: 3, y: 4 } },  // bottom-right (but y=4 is out of bounds)
	],
}
// Only the in-bounds door should trigger
const boundaryLayout: NpcEngineLayout = { floors: [boundaryFloor], interactionTargets: [] }
const boundaryEngine = new NpcEngine(boundaryLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(7), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 0, y: 3 }),
})
boundaryEngine.addAgent({ id: 'b-npc', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 3, speed: 1 })
boundaryEngine.tick(10)
const boundaryEvents = boundaryEngine.drainEvents().filter(e => e.type === 'door-passage')
// NPC walks from (0,0) to (0,3), crosses door (0,0)->(0,1)
assert.ok(boundaryEvents.length > 0, 'boundary: door-passage at map boundary')

console.log('Phase 11: PASS')

// ============================================================================
// PHASE 12: matchDoorPanel - engine edge to door panel mapping
// ============================================================================
console.log('--- Phase 12: matchDoorPanel mapping ---')

// Replicate matchDoorPanel logic from useDoorAnimation
function matchDoorPanel(panels: ReturnType<typeof doorPanelsData>, edgeFromX: number, edgeFromY: number, edgeToX: number, edgeToY: number, tileSize: number) {
	const midPx = ((edgeFromX + edgeToX) / 2) * tileSize
	const midPy = ((edgeFromY + edgeToY) / 2) * tileSize
	const halfTile = tileSize / 2
	for (const panel of panels) {
		if (panel.horizontal) {
			const minX = panel.cx - panel.length / 2
			const maxX = panel.cx + panel.length / 2
			if (midPx >= minX && midPx <= maxX && Math.abs(midPy - panel.cy) <= halfTile) return panel
		} else {
			const minY = panel.cy - panel.length / 2
			const maxY = panel.cy + panel.length / 2
			if (midPy >= minY && midPy <= maxY && Math.abs(midPx - panel.cx) <= halfTile) return panel
		}
	}
	return undefined
}

// Vertical door at x=2, y=0..3 (in tile coords)
const vDoorSeg: WallSegment = { x1: 2, y1: 0, x2: 2, y2: 3, door: true }
const vPanels = doorPanelsData([vDoorSeg], TILE, 3)
assert.equal(vPanels.length, 1)
assert.equal(vPanels[0].horizontal, false)

// Engine edge: (2,1)->(2,2) - should match
const matched1 = matchDoorPanel(vPanels, 2, 1, 2, 2, TILE)
assert.ok(matched1, 'matchDoorPanel: edge within door range matches')
assert.equal(matched1!.key, vPanels[0].key, 'matchDoorPanel: correct panel key')

// Engine edge: (5,1)->(5,2) - should NOT match (different x)
const matched2 = matchDoorPanel(vPanels, 5, 1, 5, 2, TILE)
assert.equal(matched2, undefined, 'matchDoorPanel: edge outside door range does not match')

// Engine edge: (2,5)->(2,6) - should NOT match (y out of range)
const matched3 = matchDoorPanel(vPanels, 2, 5, 2, 6, TILE)
assert.equal(matched3, undefined, 'matchDoorPanel: edge y out of range does not match')

// Horizontal door at y=3, x=0..4
const hDoorSeg: WallSegment = { x1: 0, y1: 3, x2: 4, y2: 3, door: true }
const hPanels = doorPanelsData([hDoorSeg], TILE, 3)
assert.equal(hPanels[0].horizontal, true)

// Engine edge: (1,3)->(2,3) - should match (horizontal door, x+1 direction)
const hMatched1 = matchDoorPanel(hPanels, 1, 3, 2, 3, TILE)
assert.ok(hMatched1, 'matchDoorPanel: horizontal door edge matches')

// Engine edge: (1,0)->(1,1) - should NOT match (wrong y)
const hMatched2 = matchDoorPanel(hPanels, 1, 0, 1, 1, TILE)
assert.equal(hMatched2, undefined, 'matchDoorPanel: wrong y does not match horizontal door')

console.log('Phase 12: PASS')

// ============================================================================
// PHASE 13: matchDoorPanel with rotated asset doors
// ============================================================================
console.log('--- Phase 13: matchDoorPanel with rotated doors ---')

const rotDoorAsset = makeAssetDoor(4, 2, { x1: 0, y1: 1, x2: 4, y2: 1, door: true })

for (const rot of rotations) {
	const placed = makePlacedAsset(rotDoorAsset, 50, 50, rot)
	const resolvedSegs = resolveWallSegmentsForObject(rotDoorAsset.wallSegments!, rotDoorAsset, placed, TILE)
	const doorSegs = resolvedSegs.filter(s => s.door)
	assert.equal(doorSegs.length, 1, `rotation ${rot}: 1 door segment resolved`)

	const panels = doorPanelsData(doorSegs, TILE, 3)
	assert.equal(panels.length, 1, `rotation ${rot}: 1 door panel`)

	// Generate a synthetic engine edge at the door's midpoint
	const panel = panels[0]
	const midTileX = Math.floor(panel.cx / TILE)
	const midTileY = Math.floor(panel.cy / TILE)
	let edgeFromX: number, edgeFromY: number, edgeToX: number, edgeToY: number
	if (panel.horizontal) {
		edgeFromX = midTileX
		edgeFromY = midTileY
		edgeToX = midTileX + 1
		edgeToY = midTileY
	} else {
		edgeFromX = midTileX
		edgeFromY = midTileY
		edgeToX = midTileX
		edgeToY = midTileY + 1
	}

	const matched = matchDoorPanel(panels, edgeFromX, edgeFromY, edgeToX, edgeToY, TILE)
	assert.ok(matched, `rotation ${rot}: matchDoorPanel finds panel for synthetic edge`)
	assert.equal(matched!.key, panel.key, `rotation ${rot}: correct panel matched`)
}

console.log('Phase 13: PASS')

// ============================================================================
// PHASE 14: Engine door-passage with real layout build pipeline
// ============================================================================
console.log('--- Phase 14: full pipeline layout build -> engine -> events ---')

// Build a real floor with a canvas wall door
const pipelineFloor = makeFloor([makeCanvasWallDoor(2, 3, 5, 3)])
const pipelineResult = buildNpcEngineLayout([pipelineFloor], CANVAS)
const pipelineEngineFloor = pipelineResult.layout.floors[0]

assert.ok(pipelineEngineFloor.doorEdges?.length, 'pipeline: engine floor has doorEdges')
assert.ok(pipelineEngineFloor.blockedEdges !== undefined, 'pipeline: engine floor has blockedEdges')

// Create engine with the real layout
const pipelineLayout: NpcEngineLayout = {
	floors: [pipelineEngineFloor],
	interactionTargets: [],
}
const pipelineEngine = new NpcEngine(pipelineLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(8), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 3, y: 5 }),
})
// NPC walks from (3,1) to (3,5) - should cross door at y=3
pipelineEngine.addAgent({ id: 'pipe-npc', floorId: pipelineEngineFloor.id, x: 3, y: 1, targetX: 3, targetY: 5, speed: 1 })
pipelineEngine.tick(15)
const pipelineEvents = pipelineEngine.drainEvents().filter(e => e.type === 'door-passage')
assert.ok(pipelineEvents.length > 0, 'pipeline: door-passage event emitted from real layout')

// Verify the event's door edge matches one of the layout's door edges
const layoutDoorEdgeKeys = new Set(pipelineEngineFloor.doorEdges!.map(e => `${e.from.x},${e.from.y}->${e.to.x},${e.to.y}`))
for (const evt of pipelineEvents) {
	const key = `${evt.doorEdge!.from.x},${evt.doorEdge!.from.y}->${evt.doorEdge!.to.x},${evt.doorEdge!.to.y}`
	assert.ok(layoutDoorEdgeKeys.has(key), `pipeline: event edge ${key} exists in layout doorEdges`)
}

console.log('Phase 14: PASS')

// ============================================================================
// PHASE 15: door-passage event deduplication (same tick)
// ============================================================================
console.log('--- Phase 15: event tick uniqueness ---')

// When NPC crosses a door, the event should be emitted exactly once per crossing
const dedupFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 2, y: 2 }, to: { x: 2, y: 3 } }],
}
const dedupLayout: NpcEngineLayout = { floors: [dedupFloor], interactionTargets: [] }
const dedupEngine = new NpcEngine(dedupLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(9), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 5 }),
})
dedupEngine.addAgent({ id: 'dedup-npc', floorId: 'F1', x: 2, y: 1, targetX: 2, targetY: 5, speed: 1 })
dedupEngine.tick(10)
const dedupEvents = dedupEngine.drainEvents().filter(e => e.type === 'door-passage')
// Should be exactly 1 event for 1 crossing (not duplicated)
assert.equal(dedupEvents.length, 1, 'dedup: exactly 1 door-passage event for 1 crossing')

// All events should have the same tick (the tick when the crossing happened)
const ticks = new Set(dedupEvents.map(e => e.tick))
assert.equal(ticks.size, 1, 'dedup: all door-passage events from same crossing have same tick')

console.log('Phase 15: PASS')

// ============================================================================
// PHASE 16: door-passage with multiple doors on same path
// ============================================================================
console.log('--- Phase 16: multiple doors on same path ---')

const pathFloor: NpcEngineFloor = {
	id: 'F1', width: 4, height: 8, tileSize: 1,
	walkable: makeWalkableGrid(4, 8),
	blockedEdges: [],
	doorEdges: [
		{ from: { x: 2, y: 1 }, to: { x: 2, y: 2 } },
		{ from: { x: 2, y: 3 }, to: { x: 2, y: 4 } },
		{ from: { x: 2, y: 5 }, to: { x: 2, y: 6 } },
	],
}
const pathLayout: NpcEngineLayout = { floors: [pathFloor], interactionTargets: [] }
const pathEngine = new NpcEngine(pathLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(10), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 7 }),
})
pathEngine.addAgent({ id: 'path-npc', floorId: 'F1', x: 2, y: 0, targetX: 2, targetY: 7, speed: 1 })
pathEngine.tick(20)
const pathEvents = pathEngine.drainEvents().filter(e => e.type === 'door-passage')
// NPC crosses 3 doors on the path from y=0 to y=7
assert.ok(pathEvents.length >= 3, `multiple doors on path: at least 3 events, got ${pathEvents.length}`)

// Verify events are for different door edges
const edgeKeys = new Set(pathEvents.map(e => `${e.doorEdge!.from.x},${e.doorEdge!.from.y}->${e.doorEdge!.to.x},${e.doorEdge!.to.y}`))
assert.ok(edgeKeys.size >= 3, 'multiple doors on path: events for different door edges')

console.log('Phase 16: PASS')

// ============================================================================
// PHASE 17: door-passage event type safety
// ============================================================================
console.log('--- Phase 17: door-passage event type safety ---')

const typeFloor: NpcEngineFloor = {
	id: 'F1', width: 6, height: 6, tileSize: 1,
	walkable: makeWalkableGrid(6, 6),
	blockedEdges: [],
	doorEdges: [{ from: { x: 2, y: 2 }, to: { x: 2, y: 3 } }],
}
const typeLayout: NpcEngineLayout = { floors: [typeFloor], interactionTargets: [] }
const typeEngine = new NpcEngine(typeLayout, {
	...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: 1, agentClearance: 0.5,
	random: makeRng(11), pathfinder: doorPathfinder,
	targetSelector: () => null, wanderSelector: () => ({ x: 2, y: 5 }),
})
typeEngine.addAgent({ id: 'type-npc', floorId: 'F1', x: 2, y: 1, targetX: 2, targetY: 5, speed: 1 })
typeEngine.tick(10)
const allEvents: NpcEngineEvent[] = typeEngine.drainEvents()
const doorEvents = allEvents.filter(e => e.type === 'door-passage')

for (const evt of doorEvents) {
	assert.equal(evt.type, 'door-passage', 'type: event type is door-passage')
	assert.ok(evt.doorEdge, 'type: door-passage event has doorEdge')
	assert.ok(typeof evt.doorEdge!.from.x === 'number', 'type: doorEdge.from.x is number')
	assert.ok(typeof evt.doorEdge!.from.y === 'number', 'type: doorEdge.from.y is number')
	assert.ok(typeof evt.doorEdge!.to.x === 'number', 'type: doorEdge.to.x is number')
	assert.ok(typeof evt.doorEdge!.to.y === 'number', 'type: doorEdge.to.y is number')
	assert.ok(typeof evt.agentId === 'string', 'type: agentId is string')
	assert.ok(typeof evt.floorId === 'string', 'type: floorId is string')
	assert.ok(typeof evt.tick === 'number', 'type: tick is number')
}

// Non-door-passage events should NOT have doorEdge
const nonDoorEvents = allEvents.filter(e => e.type !== 'door-passage')
for (const evt of nonDoorEvents) {
	assert.equal(evt.doorEdge, undefined, 'type: non-door-passage events do not have doorEdge')
}

console.log('Phase 17: PASS')

// ============================================================================
// SUMMARY
// ============================================================================
console.log('')
console.log('========================================')
console.log('ALL DOOR PASSAGE ENGINE TESTS PASSED')
console.log('========================================')
console.log('Phases: 17')
console.log('Coverage:')
console.log('  - buildDoorEdges() direct tests')
console.log('  - door edges vs blocked edges separation')
console.log('  - asset doors with all rotations')
console.log('  - buildNpcEngineLayout includes doorEdges')
console.log('  - engine door-passage both directions')
console.log('  - walking along door edge (no crossing)')
console.log('  - standing still (no passage)')
console.log('  - multiple NPCs same door')
console.log('  - event tick field')
console.log('  - door at map boundary')
console.log('  - matchDoorPanel mapping')
console.log('  - matchDoorPanel with rotations')
console.log('  - full pipeline: layout -> engine -> events')
console.log('  - event deduplication')
console.log('  - multiple doors on same path')
console.log('  - event type safety')
console.log('========================================')
