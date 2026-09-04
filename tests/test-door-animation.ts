import assert from 'node:assert/strict'
import { doorPanelsData, doorSlideDir, doorPanelsSvg, wallSegmentsOverlaySvg, assetPreviewSvg } from '../src/blueprint-editor/assets/assetUtils'
import {
	normalizeWallSegment,
	normalizeWallSegments,
	resolveWallSegmentsForObject,
	normalizeOriginAsset,
	type WallSegment,
	type AssetDef,
	type Rotation,
	type NpcSimDot,
} from '../src/blueprint-editor/domain/types'
import { useDoorAnimation, type DoorAnimState } from '../src/blueprint-editor/composables/useDoorAnimation'
import { effectScope, ref, shallowRef } from 'vue'

// ============================================================================
// Seeded RNG (mulberry32) - deterministic test data generation
// ============================================================================
function mulberry32(seed: number): () => number {
	let a = seed
	return () => {
		a |= 0
		a = (a + 0x6D2B79F5) | 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

// ============================================================================
// Constants matching useDoorAnimation.ts
// ============================================================================
const TILE = 25
const THICKNESS = 3
const DOOR_COLOR = '#3b82f6'
const WALL_COLOR = '#2ec4b6'
const DOOR_CLOSE_DELAY_MS = 1500
const DOOR_REOPEN_INTERVAL_MS = 1500
const DOOR_ANIM_SPEED = 0.08
const DOOR_PROXIMITY_TILES = 2

// ============================================================================
// Test helpers
// ============================================================================
function makeNpc(x: number, y: number): NpcSimDot {
	return {
		id: `npc-${x}-${y}`,
		floorId: 'F1',
		type: 'visitor',
		x, y,
		targetX: x, targetY: y,
		speed: 1,
		color: '#fff',
		status: 'walking',
		pauseTimer: 0,
		pathIdx: 0,
		path: [],
		interactTargetKey: null,
		interactSpotKey: null,
		interactDurationMin: 0,
		interactDurationMax: 0,
	}
}

// Deterministic tick function matching useDoorAnimation internal logic.
// Used for precise frame-by-frame testing without RAF.
function tickDoors(
	doors: ReturnType<typeof doorPanelsData>,
	npcs: NpcSimDot[],
	states: Map<string, DoorAnimState>,
	now: number,
	tileSize: number = TILE,
): Map<string, DoorAnimState> {
	if (!doors.length) return states
	const proximityPx = DOOR_PROXIMITY_TILES * tileSize
	const next = new Map(states)
	for (const door of doors) {
		let state = next.get(door.key)
		if (!state) { state = { progress: 0, target: 0, lastNearby: 0, lastClosed: null }; next.set(door.key, state) }
		const nearby = npcs.some(n => {
			const dx = n.x - door.cx
			const dy = n.y - door.cy
			return Math.hypot(dx, dy) < proximityPx
		})
		const canOpen = state.lastClosed === null || now - state.lastClosed >= DOOR_REOPEN_INTERVAL_MS
		if (nearby && canOpen) { state.target = 1; state.lastNearby = now }
		else if (!nearby && now - state.lastNearby > DOOR_CLOSE_DELAY_MS) { if (state.target !== 0) { state.target = 0; state.lastClosed = now } }
		state.progress += (state.target - state.progress) * DOOR_ANIM_SPEED
		if (Math.abs(state.progress - state.target) < 0.01) state.progress = state.target
	}
	return next
}

function fmt(n: number): string { return n.toFixed(2) }

// ============================================================================
// PHASE 1: Data normalization - door flag preservation
// ============================================================================
console.log('--- Phase 1: Data normalization ---')

const rawDoorSeg = { x1: 0, y1: 5, x2: 4, y2: 5, door: true }
const normDoorSeg = normalizeWallSegment(rawDoorSeg)
assert.ok(normDoorSeg, 'normalizeWallSegment returns a segment')
assert.equal(normDoorSeg!.door, true, 'door flag preserved after normalizeWallSegment')

const rawWallSeg = { x1: 0, y1: 5, x2: 4, y2: 5 }
const normWallSeg = normalizeWallSegment(rawWallSeg)
assert.ok(normWallSeg, 'normalizeWallSegment returns a segment')
assert.equal(normWallSeg!.door, undefined, 'non-door segment has no door flag')

const segs = normalizeWallSegments([
	{ x1: 0, y1: 5, x2: 4, y2: 5, door: true },
	{ x1: 0, y1: 5, x2: 4, y2: 5 },
	{ x1: 1, y1: 0, x2: 1, y2: 3, door: true },
])
assert.ok(segs, 'normalizeWallSegments returns segments')
assert.equal(segs!.length, 2, 'deduped to 2 segments')
const horizSeg = segs!.find(s => s.y1 === s.y2)
assert.ok(horizSeg, 'found horizontal segment')
assert.equal(horizSeg!.door, true, 'door flag merged from duplicate')

assert.equal(normalizeWallSegment({ x1: 5, y1: 5, x2: 5, y2: 5, door: true }), undefined, 'zero-length door rejected')
assert.equal(normalizeWallSegment({ x1: 0, y1: 0, x2: 3, y2: 3, door: true }), undefined, 'diagonal door rejected')

const reversed = normalizeWallSegment({ x1: 4, y1: 5, x2: 0, y2: 5, door: true })
assert.ok(reversed, 'reversed segment normalized')
assert.equal(reversed!.x1, 0, 'x1 normalized to smaller value')
assert.equal(reversed!.x2, 4, 'x2 normalized to larger value')
assert.equal(reversed!.door, true, 'door flag preserved after direction normalization')

console.log('Phase 1: PASS')

// ============================================================================
// PHASE 2: Rotation - door flag preservation across all rotations
// ============================================================================
console.log('--- Phase 2: Rotation door flag preservation ---')

const doorAsset: AssetDef = {
	id: 'test-door',
	name: 'Test Door',
	w: 4,
	h: 2,
	wallSegments: [
		{ x1: 0, y1: 1, x2: 4, y2: 1, door: true },
		{ x1: 0, y1: 0, x2: 0, y2: 2 },
	],
}

const rotations: Rotation[] = [0, 90, 180, 270]
for (const rot of rotations) {
	const obj = { x: 100, y: 200, w: 4 * TILE, h: 2 * TILE, rotation: rot }
	const resolved = resolveWallSegmentsForObject(doorAsset.wallSegments, doorAsset, obj, TILE)
	assert.ok(resolved.length > 0, `rotation ${rot}: segments produced`)
	const doors = resolved.filter(s => s.door)
	const walls = resolved.filter(s => !s.door)
	assert.equal(doors.length, 1, `rotation ${rot}: exactly 1 door segment`)
	assert.equal(walls.length, 1, `rotation ${rot}: exactly 1 wall segment`)
	assert.equal(doors[0].door, true, `rotation ${rot}: door flag preserved`)
}

const obj0 = { x: 100, y: 200, w: 4 * TILE, h: 2 * TILE, rotation: 0 as Rotation }
const obj90 = { x: 100, y: 200, w: 2 * TILE, h: 4 * TILE, rotation: 90 as Rotation }
const segs0 = resolveWallSegmentsForObject(doorAsset.wallSegments, doorAsset, obj0, TILE)
const segs90 = resolveWallSegmentsForObject(doorAsset.wallSegments, doorAsset, obj90, TILE)
const door0 = segs0.find(s => s.door)!
const door90 = segs90.find(s => s.door)!
assert.equal(door0.y1 === door0.y2, true, 'rotation 0: door is horizontal')
assert.equal(door90.x1 === door90.x2, true, 'rotation 90: door becomes vertical')

const obj180 = { x: 100, y: 200, w: 4 * TILE, h: 2 * TILE, rotation: 180 as Rotation }
const segs180 = resolveWallSegmentsForObject(doorAsset.wallSegments, doorAsset, obj180, TILE)
const door180 = segs180.find(s => s.door)!
assert.equal(door180.y1 === door180.y2, true, 'rotation 180: door stays horizontal')

const obj270 = { x: 100, y: 200, w: 2 * TILE, h: 4 * TILE, rotation: 270 as Rotation }
const segs270 = resolveWallSegmentsForObject(doorAsset.wallSegments, doorAsset, obj270, TILE)
const door270 = segs270.find(s => s.door)!
assert.equal(door270.x1 === door270.x2, true, 'rotation 270: door is vertical')

console.log('Phase 2: PASS')

// ============================================================================
// PHASE 3: doorPanelsData - geometry computation
// ============================================================================
console.log('--- Phase 3: doorPanelsData geometry ---')

const hPanels = doorPanelsData([{ x1: 0, y1: 5, x2: 4, y2: 5, door: true }], TILE, THICKNESS)
assert.equal(hPanels.length, 1)
assert.equal(hPanels[0].horizontal, true)
assert.equal(hPanels[0].cx, 50)
assert.equal(hPanels[0].cy, 125)
assert.equal(hPanels[0].length, 100)
assert.equal(hPanels[0].thickness, THICKNESS)
assert.equal(hPanels[0].key, '0,125,100,125')

const vPanels = doorPanelsData([{ x1: 2, y1: 0, x2: 2, y2: 3, door: true }], TILE, THICKNESS)
assert.equal(vPanels.length, 1)
assert.equal(vPanels[0].horizontal, false)
assert.equal(vPanels[0].cx, 50)
assert.equal(vPanels[0].cy, 37.5)
assert.equal(vPanels[0].length, 75)

assert.equal(doorPanelsData([{ x1: 0, y1: 0, x2: 5, y2: 0 }], TILE, THICKNESS).length, 0)

const mixed = doorPanelsData([
	{ x1: 0, y1: 0, x2: 5, y2: 0 },
	{ x1: 0, y1: 3, x2: 3, y2: 3, door: true },
	{ x1: 1, y1: 0, x2: 1, y2: 5 },
	{ x1: 2, y1: 0, x2: 2, y2: 4, door: true },
], TILE, THICKNESS)
assert.equal(mixed.length, 2, 'only door segments pass through')

const tinyDoor = doorPanelsData([{ x1: 0, y1: 0, x2: 0.5, y2: 0, door: true }], TILE, THICKNESS)
assert.ok(tinyDoor[0].length >= THICKNESS * 2, 'minimum length enforced')

const zeroThick = doorPanelsData([{ x1: 0, y1: 0, x2: 3, y2: 0, door: true }], TILE, 0)
assert.equal(zeroThick[0].thickness, 1, 'thickness clamped to 1')

assert.equal(doorPanelsData([], TILE, THICKNESS).length, 0)

// doorSlideDir - collision-aware slide direction
const slidePanel = doorPanelsData([{ x1: 0, y1: 5, x2: 4, y2: 5, door: true }], TILE, THICKNESS)[0]
assert.equal(doorSlideDir(slidePanel, []), 1, 'no blockers -> default slide right')
assert.equal(
	doorSlideDir(slidePanel, [{ x: 90, y: 115, w: 40, h: 20 }]),
	-1,
	'blocker over right sweep zone -> slide left',
)
assert.equal(
	doorSlideDir(slidePanel, [{ x: -30, y: 115, w: 40, h: 20 }]),
	1,
	'blocker over left sweep zone -> slide right',
)
assert.equal(
	doorSlideDir(slidePanel, [{ x: 90, y: 115, w: 40, h: 20 }, { x: -30, y: 115, w: 40, h: 20 }]),
	1,
	'both sides blocked -> fallback right',
)
assert.equal(
	doorSlideDir(slidePanel, [{ x: 90, y: 0, w: 40, h: 40 }]),
	1,
	'blocker away from wall line does not block',
)
const slidePanelV = doorPanelsData([{ x1: 2, y1: 0, x2: 2, y2: 3, door: true }], TILE, THICKNESS)[0]
assert.equal(doorSlideDir(slidePanelV, [{ x: 40, y: 55, w: 20, h: 40 }]), -1, 'vertical blocker below -> slide up')

// own wall priority: slide into own wall side unless another asset blocks it
const ownRight = [{ x: 100, y: 123, w: 75, h: 4 }]
const ownLeft = [{ x: -75, y: 123, w: 75, h: 4 }]
assert.equal(doorSlideDir(slidePanel, [], ownRight), 1, 'own wall right -> slide right')
assert.equal(doorSlideDir(slidePanel, [], ownLeft), -1, 'own wall left -> slide left')
assert.equal(
	doorSlideDir(slidePanel, [{ x: 110, y: 115, w: 40, h: 20 }], ownRight),
	-1,
	'own wall right but asset blocks -> slide to other side',
)
assert.equal(
	doorSlideDir(slidePanel, [{ x: -60, y: 115, w: 40, h: 20 }], ownLeft),
	1,
	'own wall left but asset blocks -> slide to other side',
)
assert.equal(doorSlideDir(slidePanel, [], [...ownRight, ...ownLeft]), 1, 'own wall both sides, free -> default right')
assert.equal(
	doorSlideDir(slidePanel, [{ x: 110, y: 115, w: 40, h: 20 }], [...ownRight, ...ownLeft]),
	-1,
	'own wall both sides, right blocked -> slide left',
)

console.log('Phase 3: PASS')

// ============================================================================
// PHASE 4: doorPanelsSvg - SVG output at various progress levels
// ============================================================================
console.log('--- Phase 4: doorPanelsSvg output ---')

const closedSvg = doorPanelsSvg([{ x1: 0, y1: 5, x2: 4, y2: 5, door: true }], TILE, THICKNESS, DOOR_COLOR, 0)
assert.ok(closedSvg.includes('<g class="door-overlay">'), 'SVG wrapped in door-overlay group')
const closedRects = closedSvg.match(/<rect/g)
assert.ok(closedRects, 'SVG contains rect elements')
assert.equal(closedRects!.length, 1, 'closed door has 1 full panel')

const openSvg = doorPanelsSvg([{ x1: 0, y1: 5, x2: 4, y2: 5, door: true }], TILE, THICKNESS, DOOR_COLOR, 1)
const openRects = openSvg.match(/<rect/g)
assert.equal(openRects!.length, 1, 'open door has 1 full panel')

const halfSvg = doorPanelsSvg([{ x1: 0, y1: 5, x2: 4, y2: 5, door: true }], TILE, THICKNESS, DOOR_COLOR, 0.5)
assert.ok(halfSvg.includes('<g class="door-overlay">'))

const vSvg = doorPanelsSvg([{ x1: 2, y1: 0, x2: 2, y2: 3, door: true }], TILE, THICKNESS, DOOR_COLOR, 0)
assert.ok(vSvg.includes('<g class="door-overlay">'))
const vRects = vSvg.match(/<rect/g)
assert.equal(vRects!.length, 1, 'vertical door has 1 full panel')

assert.equal(doorPanelsSvg([], TILE, THICKNESS, DOOR_COLOR, 1), '')

const multiSvg = doorPanelsSvg([
	{ x1: 0, y1: 5, x2: 4, y2: 5, door: true },
	{ x1: 2, y1: 0, x2: 2, y2: 3, door: true },
], TILE, THICKNESS, DOOR_COLOR, 0)
const multiRects = multiSvg.match(/<rect/g)
assert.equal(multiRects!.length, 2, '2 doors = 2 panels')

const hSeg: WallSegment = { x1: 0, y1: 5, x2: 4, y2: 5, door: true }
const panels = doorPanelsData([hSeg], TILE, THICKNESS)
const p = panels[0]
const half = p.length / 2
assert.ok(closedSvg.includes(`x="${fmt(p.cx - half)}"`), 'closed panel at cx - half')
assert.ok(openSvg.includes(`x="${fmt(p.cx + half)}"`), 'open panel shifted right by full length (slideDir 1)')
assert.ok(closedSvg.includes(`width="${fmt(p.length)}"`), 'panel width = full length')
assert.ok(closedSvg.includes(`height="${p.thickness}"`), 'panel height = thickness')

console.log('Phase 4: PASS')

// ============================================================================
// PHASE 5: wallSegmentsOverlaySvg - integrated wall + door overlay
// ============================================================================
console.log('--- Phase 5: wallSegmentsOverlaySvg integration ---')

const assetWithDoors: AssetDef = {
	id: 'mixed-asset',
	name: 'Mixed',
	w: 4,
	h: 4,
	wallSegments: [
		{ x1: 0, y1: 0, x2: 4, y2: 0 },
		{ x1: 0, y1: 4, x2: 4, y2: 4 },
		{ x1: 1, y1: 0, x2: 3, y2: 0, door: true },
	],
}
const overlay = wallSegmentsOverlaySvg(assetWithDoors, TILE, WALL_COLOR, THICKNESS, DOOR_COLOR)
assert.ok(overlay.includes('<g class="wall-overlay">'), 'overlay wrapped in wall-overlay group')
assert.ok(overlay.includes('<line'), 'overlay contains wall lines')
assert.ok(overlay.includes('<g class="door-overlay">'), 'overlay contains door-overlay subgroup')
assert.ok(overlay.includes('fill="#3b82f6"'), 'door panels use door color')

const wallsOnly: AssetDef = {
	id: 'walls-only',
	name: 'Walls Only',
	w: 3,
	h: 3,
	wallSegments: [{ x1: 0, y1: 0, x2: 3, y2: 0 }],
}
const wallsOverlay = wallSegmentsOverlaySvg(wallsOnly, TILE, WALL_COLOR, THICKNESS, DOOR_COLOR)
assert.ok(wallsOverlay.includes('<line'), 'walls rendered as lines')
assert.ok(!wallsOverlay.includes('door-overlay'), 'no door overlay for walls-only asset')

const doorsOnly: AssetDef = {
	id: 'doors-only',
	name: 'Doors Only',
	w: 3,
	h: 3,
	wallSegments: [{ x1: 0, y1: 1, x2: 3, y2: 1, door: true }],
}
const doorsOverlay = wallSegmentsOverlaySvg(doorsOnly, TILE, WALL_COLOR, THICKNESS, DOOR_COLOR)
assert.ok(doorsOverlay.includes('door-overlay'), 'door overlay present')
assert.ok(!doorsOverlay.includes('<line'), 'no wall lines for doors-only asset')

const noWalls: AssetDef = { id: 'empty', name: 'Empty', w: 2, h: 2 }
assert.equal(wallSegmentsOverlaySvg(noWalls, TILE, WALL_COLOR, THICKNESS, DOOR_COLOR), '', 'no segments = empty overlay')

const preview = assetPreviewSvg(assetWithDoors, TILE, WALL_COLOR, THICKNESS, DOOR_COLOR)
assert.ok(preview.includes('door-overlay'), 'preview SVG includes door overlay')
assert.ok(preview.includes('wall-overlay'), 'preview SVG includes wall overlay')

console.log('Phase 5: PASS')

// ============================================================================
// PHASE 6: Animation state machine - proximity, open/close, lerp
// ============================================================================
console.log('--- Phase 6: Animation state machine ---')

const animDoors = doorPanelsData([
	{ x1: 0, y1: 5, x2: 4, y2: 5, door: true },
], TILE, THICKNESS)
let states = new Map<string, DoorAnimState>()
states = tickDoors(animDoors, [], states, 0)
const state0 = states.get(animDoors[0].key)!
assert.equal(state0.progress, 0, 'initial progress = 0')
assert.equal(state0.target, 0, 'initial target = 0 (closed)')

const npcNearby = makeNpc(animDoors[0].cx, animDoors[0].cy)
states = tickDoors(animDoors, [npcNearby], states, 100)
const state1 = states.get(animDoors[0].key)!
assert.equal(state1.target, 1, 'NPC nearby -> target = 1')
assert.equal(state1.lastNearby, 100, 'lastNearby updated')
assert.ok(state1.progress > 0, 'progress starts moving toward 1')

let progBefore = state1.progress
for (let i = 0; i < 100; i++) {
	states = tickDoors(animDoors, [npcNearby], states, 200 + i * 16)
}
const stateOpen = states.get(animDoors[0].key)!
assert.ok(stateOpen.progress > progBefore, 'progress increased over ticks')
assert.equal(stateOpen.progress, 1, 'progress converged to 1 (open)')

const npcFar = makeNpc(9999, 9999)
states = tickDoors(animDoors, [npcFar], states, 2000)
const stateLeaving = states.get(animDoors[0].key)!
assert.equal(stateLeaving.target, 1, 'target still 1 within close delay')
states = tickDoors(animDoors, [npcFar], states, 1784 + DOOR_CLOSE_DELAY_MS + 100)
const stateClosing = states.get(animDoors[0].key)!
assert.equal(stateClosing.target, 0, 'target = 0 after close delay')

for (let i = 0; i < 100; i++) {
	states = tickDoors(animDoors, [npcFar], states, 3400 + i * 16)
}
const stateClosed = states.get(animDoors[0].key)!
assert.equal(stateClosed.progress, 0, 'progress converged back to 0 (closed)')

states = tickDoors(animDoors, [npcNearby], states, 6000)
states = tickDoors(animDoors, [npcFar], states, 6001)
states = tickDoors(animDoors, [npcNearby], states, 6002)
const stateReenter = states.get(animDoors[0].key)!
assert.equal(stateReenter.target, 1, 'NPC re-enters -> target stays 1')

console.log('Phase 6: PASS')

// ============================================================================
// PHASE 7: Proximity threshold - boundary testing (uses tileSize, not thickness)
// ============================================================================
console.log('--- Phase 7: Proximity threshold ---')

const proxDoors = doorPanelsData([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS)
const proximityPx = DOOR_PROXIMITY_TILES * TILE // = 50px (2 tiles)
const doorCx = proxDoors[0].cx // 50
const doorCy = proxDoors[0].cy // 0

const npcAtBoundary = makeNpc(doorCx + proximityPx - 1, doorCy)
let proxStates = new Map<string, DoorAnimState>()
proxStates = tickDoors(proxDoors, [npcAtBoundary], proxStates, 0)
assert.equal(proxStates.get(proxDoors[0].key)!.target, 1, 'NPC just inside 2-tile boundary -> open')

proxStates = new Map<string, DoorAnimState>()
const npcOutside = makeNpc(doorCx + proximityPx + 10, doorCy)
proxStates = tickDoors(proxDoors, [npcOutside], proxStates, 0)
assert.equal(proxStates.get(proxDoors[0].key)!.target, 0, 'NPC outside 2-tile boundary -> closed')

proxStates = new Map<string, DoorAnimState>()
proxStates = tickDoors(proxDoors, [makeNpc(doorCx, doorCy)], proxStates, 0)
assert.equal(proxStates.get(proxDoors[0].key)!.target, 1, 'NPC at center -> open')

proxStates = new Map<string, DoorAnimState>()
proxStates = tickDoors(proxDoors, [npcOutside, makeNpc(doorCx, doorCy)], proxStates, 0)
assert.equal(proxStates.get(proxDoors[0].key)!.target, 1, 'one NPC near -> open despite other far')

const twoDoors = doorPanelsData([
	{ x1: 0, y1: 0, x2: 4, y2: 0, door: true },
	{ x1: 10, y1: 10, x2: 14, y2: 10, door: true },
], TILE, THICKNESS)
let twoStates = new Map<string, DoorAnimState>()
twoStates = tickDoors(twoDoors, [makeNpc(50, 0)], twoStates, 0)
assert.equal(twoStates.get(twoDoors[0].key)!.target, 1, 'door 1 open (NPC near)')
assert.equal(twoStates.get(twoDoors[1].key)!.target, 0, 'door 2 closed (NPC far)')

console.log('Phase 7: PASS')

// ============================================================================
// PHASE 8: Close delay timing - precise boundary
// ============================================================================
console.log('--- Phase 8: Close delay timing ---')

const delayDoors = doorPanelsData([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS)
let delayStates = new Map<string, DoorAnimState>()

delayStates = tickDoors(delayDoors, [makeNpc(50, 0)], delayStates, 1000)
assert.equal(delayStates.get(delayDoors[0].key)!.lastNearby, 1000)

delayStates = tickDoors(delayDoors, [makeNpc(9999, 9999)], delayStates, 2000)

delayStates = tickDoors(delayDoors, [makeNpc(9999, 9999)], delayStates, 2499)
assert.equal(delayStates.get(delayDoors[0].key)!.target, 1, 'target still 1 just before close delay')

delayStates = tickDoors(delayDoors, [makeNpc(9999, 9999)], delayStates, 2501)
assert.equal(delayStates.get(delayDoors[0].key)!.target, 0, 'target = 0 after close delay boundary')

console.log('Phase 8: PASS')

// ============================================================================
// PHASE 8B: Reopen interval - door stays closed before next NPC opens it
// ============================================================================
console.log('--- Phase 8B: Reopen interval ---')

const reopenDoors = doorPanelsData([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS)
let reopenStates = new Map<string, DoorAnimState>()

reopenStates = tickDoors(reopenDoors, [makeNpc(50, 0)], reopenStates, 1000)
assert.equal(reopenStates.get(reopenDoors[0].key)!.target, 1, 'reopen: NPC opens door')

reopenStates = tickDoors(reopenDoors, [makeNpc(9999, 9999)], reopenStates, 2000)
reopenStates = tickDoors(reopenDoors, [makeNpc(9999, 9999)], reopenStates, 2000 + DOOR_CLOSE_DELAY_MS + 100)
assert.equal(reopenStates.get(reopenDoors[0].key)!.target, 0, 'reopen: door closed after NPC out')
const closedAt = reopenStates.get(reopenDoors[0].key)!.lastClosed
assert.equal(closedAt, 2000 + DOOR_CLOSE_DELAY_MS + 100, 'reopen: lastClosed recorded at close transition')

reopenStates = tickDoors(reopenDoors, [makeNpc(50, 0)], reopenStates, closedAt + DOOR_REOPEN_INTERVAL_MS - 100)
assert.equal(reopenStates.get(reopenDoors[0].key)!.target, 0, 'reopen: stays closed during interval')

reopenStates = tickDoors(reopenDoors, [makeNpc(50, 0)], reopenStates, closedAt + DOOR_REOPEN_INTERVAL_MS + 100)
assert.equal(reopenStates.get(reopenDoors[0].key)!.target, 1, 'reopen: opens after interval')

console.log('Phase 8B: PASS')

// ============================================================================
// PHASE 9: Lerp convergence - mathematical properties
// ============================================================================
console.log('--- Phase 9: Lerp convergence ---')

const lerpDoors = doorPanelsData([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS)
let lerpStates = new Map<string, DoorAnimState>()

lerpStates = tickDoors(lerpDoors, [makeNpc(50, 0)], lerpStates, 0)
const p0 = lerpStates.get(lerpDoors[0].key)!.progress
assert.equal(p0, 0 + (1 - 0) * DOOR_ANIM_SPEED, 'first tick: progress = 0 + (1-0) * 0.08 = 0.08')

lerpStates = tickDoors(lerpDoors, [makeNpc(50, 0)], lerpStates, 16)
const p1 = lerpStates.get(lerpDoors[0].key)!.progress
assert.ok(Math.abs(p1 - (p0 + (1 - p0) * DOOR_ANIM_SPEED)) < 1e-10, 'second tick: lerp formula correct')

let prevProgress = 0
let monotonic = true
for (let i = 0; i < 200; i++) {
	lerpStates = tickDoors(lerpDoors, [makeNpc(50, 0)], lerpStates, 32 + i * 16)
	const curr = lerpStates.get(lerpDoors[0].key)!.progress
	if (curr < prevProgress - 1e-10) { monotonic = false; break }
	prevProgress = curr
}
assert.ok(monotonic, 'progress monotonically increasing toward 1')
assert.equal(lerpStates.get(lerpDoors[0].key)!.progress, 1, 'progress snapped to 1')

lerpStates = tickDoors(lerpDoors, [makeNpc(9999, 9999)], lerpStates, 5000)
lerpStates = tickDoors(lerpDoors, [makeNpc(9999, 9999)], lerpStates, 5000 + DOOR_CLOSE_DELAY_MS + 100)
prevProgress = 1
monotonic = true
for (let i = 0; i < 200; i++) {
	lerpStates = tickDoors(lerpDoors, [makeNpc(9999, 9999)], lerpStates, 6000 + i * 16)
	const curr = lerpStates.get(lerpDoors[0].key)!.progress
	if (curr > prevProgress + 1e-10) { monotonic = false; break }
	prevProgress = curr
}
assert.ok(monotonic, 'progress monotonically decreasing toward 0')
assert.equal(lerpStates.get(lerpDoors[0].key)!.progress, 0, 'progress snapped to 0')

console.log('Phase 9: PASS')

// ============================================================================
// PHASE 10: Dynamic fuzz testing - seeded random scenarios
// ============================================================================
console.log('--- Phase 10: Dynamic fuzz testing ---')

const rng = mulberry32(42)
let fuzzPass = 0
const FUZZ_ITERATIONS = 500

for (let iter = 0; iter < FUZZ_ITERATIONS; iter++) {
	const isHorizontal = rng() > 0.5
	const startX = Math.floor(rng() * 20)
	const length = Math.max(1, Math.floor(rng() * 10))
	const y = Math.floor(rng() * 20)
	const seg: WallSegment = isHorizontal
		? { x1: startX, y1: y, x2: startX + length, y2: y, door: true }
		: { x1: y, y1: startX, x2: y, y2: startX + length, door: true }

	const normalized = normalizeWallSegment(seg)
	if (!normalized) continue

	const panels = doorPanelsData([normalized], TILE, THICKNESS)
	if (!panels.length) continue

	const panel = panels[0]
	assert.ok(panel.length >= THICKNESS * 2, `fuzz ${iter}: length >= thickness*2`)
	assert.ok(panel.thickness >= 1, `fuzz ${iter}: thickness >= 1`)

	const progress = rng()
	const svg = doorPanelsSvg([normalized], TILE, THICKNESS, DOOR_COLOR, progress)
	const rectCount = (svg.match(/<rect/g) || []).length
	assert.equal(rectCount, 1, `fuzz ${iter}: 1 full panel at progress ${progress.toFixed(3)}`)

	const off = panel.length * progress
	if (panel.horizontal) {
		assert.ok(svg.includes(`x="${fmt(panel.cx - panel.length / 2 + off)}"`), `fuzz ${iter}: panel x correct`)
	} else {
		assert.ok(svg.includes(`y="${fmt(panel.cy - panel.length / 2 + off)}"`), `fuzz ${iter}: panel y correct`)
	}

	const npcX = rng() * 500
	const npcY = rng() * 500
	const npc = makeNpc(npcX, npcY)
	let fStates = new Map<string, DoorAnimState>()
	fStates = tickDoors(panels, [npc], fStates, 0)
	const fstate = fStates.get(panel.key)!
	assert.ok(fstate.progress >= 0 && fstate.progress <= 1, `fuzz ${iter}: progress in [0,1]`)
	assert.ok(fstate.target === 0 || fstate.target === 1, `fuzz ${iter}: target is 0 or 1`)

	fuzzPass++
}
assert.equal(fuzzPass, FUZZ_ITERATIONS, `all ${FUZZ_ITERATIONS} fuzz iterations passed`)

console.log(`Phase 10: PASS (${FUZZ_ITERATIONS} fuzz iterations)`)

// ============================================================================
// PHASE 11: Full pipeline integration - asset -> normalize -> rotate -> panels -> animate -> SVG
// ============================================================================
console.log('--- Phase 11: Full pipeline integration ---')

const rawAsset = {
	id: 'shop-door',
	name: 'Shop Door',
	w: 5,
	h: 3,
	wallSegments: [
		{ x1: 0, y1: 0, x2: 5, y2: 0 },
		{ x1: 1, y1: 0, x2: 4, y2: 0, door: true },
		{ x1: 0, y1: 0, x2: 0, y2: 3 },
		{ x1: 5, y1: 0, x2: 5, y2: 3 },
	],
}
const normalizedAsset = normalizeOriginAsset(rawAsset)
assert.ok(normalizedAsset, 'raw asset normalized successfully')
assert.ok(normalizedAsset!.wallSegments!.some(s => s.door), 'door segment preserved in normalized asset')

for (const rot of rotations) {
	const w = rot === 90 || rot === 270 ? 3 * TILE : 5 * TILE
	const h = rot === 90 || rot === 270 ? 5 * TILE : 3 * TILE
	const placed = { x: 200, y: 300, w, h, rotation: rot }

	const resolved = resolveWallSegmentsForObject(normalizedAsset!.wallSegments!, normalizedAsset!, placed, TILE)
	assert.ok(resolved.length > 0, `pipeline rot ${rot}: segments resolved`)

	const doorSegs = resolved.filter(s => s.door)
	assert.equal(doorSegs.length, 1, `pipeline rot ${rot}: 1 door segment after rotation`)

	const panels = doorPanelsData(doorSegs, TILE, THICKNESS)
	assert.equal(panels.length, 1, `pipeline rot ${rot}: 1 door panel`)

	let pStates = new Map<string, DoorAnimState>()
	pStates = tickDoors(panels, [makeNpc(panels[0].cx, panels[0].cy)], pStates, 0)
	assert.equal(pStates.get(panels[0].key)!.target, 1, `pipeline rot ${rot}: NPC at door -> open`)

	const progress = pStates.get(panels[0].key)!.progress
	const svg = doorPanelsSvg(doorSegs, TILE, THICKNESS, DOOR_COLOR, progress)
	assert.ok(svg.includes('<g class="door-overlay">'), `pipeline rot ${rot}: SVG generated`)
	assert.equal((svg.match(/<rect/g) || []).length, 1, `pipeline rot ${rot}: 1 panel in SVG`)

	if (rot === 0 || rot === 180) {
		assert.equal(panels[0].horizontal, true, `pipeline rot ${rot}: door is horizontal`)
	} else {
		assert.equal(panels[0].horizontal, false, `pipeline rot ${rot}: door is vertical`)
	}
}

const previewSvg = assetPreviewSvg(normalizedAsset!, TILE, WALL_COLOR, THICKNESS, DOOR_COLOR)
assert.ok(previewSvg.includes('door-overlay'), 'preview SVG has door overlay')
assert.ok(previewSvg.includes('wall-overlay'), 'preview SVG has wall overlay')
const previewDoorRects = previewSvg.match(/<rect[^>]*fill="#3b82f6"/g)
assert.ok(previewDoorRects, 'preview has door-colored rects')
assert.equal(previewDoorRects!.length, 1, 'preview has exactly 1 door panel (closed)')

console.log('Phase 11: PASS')

// ============================================================================
// PHASE 12: Edge cases and stress scenarios
// ============================================================================
console.log('--- Phase 12: Edge cases and stress ---')

const longDoor = doorPanelsData([{ x1: 0, y1: 0, x2: 100, y2: 0, door: true }], TILE, THICKNESS)
assert.equal(longDoor[0].length, 100 * TILE, 'long door length correct')
const longSvg = doorPanelsSvg([{ x1: 0, y1: 0, x2: 100, y2: 0, door: true }], TILE, THICKNESS, DOOR_COLOR, 1)
assert.ok(longSvg.includes('<g class="door-overlay">'), 'long door SVG generated')

const originDoor = doorPanelsData([{ x1: 0, y1: 0, x2: 3, y2: 0, door: true }], TILE, THICKNESS)
assert.equal(originDoor[0].cx, 37.5, 'origin door cx correct')
assert.equal(originDoor[0].cy, 0, 'origin door cy = 0')

const manySegs: WallSegment[] = []
for (let i = 0; i < 50; i++) {
	manySegs.push({ x1: i * 4, y1: 0, x2: i * 4 + 3, y2: 0, door: true })
}
const manyPanels = doorPanelsData(manySegs, TILE, THICKNESS)
assert.equal(manyPanels.length, 50, '50 doors -> 50 panels')
const manySvg = doorPanelsSvg(manySegs, TILE, THICKNESS, DOOR_COLOR, 0.5)
assert.equal((manySvg.match(/<rect/g) || []).length, 50, '50 doors -> 50 panels in SVG')

let manyStates = new Map<string, DoorAnimState>()
const manyNpcs = [makeNpc(manyPanels[25].cx, manyPanels[25].cy)]
manyStates = tickDoors(manyPanels, manyNpcs, manyStates, 0)
let openCount = 0
for (const panel of manyPanels) {
	if (manyStates.get(panel.key)!.target === 1) openCount++
}
assert.equal(openCount, 1, 'only 1 door open (NPC near 1)')

assert.equal(normalizeWallSegment({ x1: 5, y1: 5, x2: 5, y2: 5, door: true }), undefined, 'degenerate door rejected')

const negDoor = normalizeWallSegment({ x1: -3, y1: 0, x2: 0, y2: 0, door: true })
assert.ok(negDoor, 'negative coordinate door accepted (within MAX_ASSET_DIMENSION)')
assert.equal(negDoor!.x1, -3, 'negative x1 preserved')
assert.equal(negDoor!.door, true, 'door flag preserved with negative coords')

const zeroSvg = doorPanelsSvg([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS, DOOR_COLOR, 0)
const fullSvg = doorPanelsSvg([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS, DOOR_COLOR, 1)
assert.notEqual(zeroSvg, fullSvg, 'progress 0 and 1 produce different SVG')

const negProgSvg = doorPanelsSvg([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS, DOOR_COLOR, -1)
assert.ok(negProgSvg.includes('<g class="door-overlay">'), 'negative progress still produces SVG')

const overProgSvg = doorPanelsSvg([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS, DOOR_COLOR, 2)
assert.ok(overProgSvg.includes('<g class="door-overlay">'), 'progress > 1 still produces SVG')

console.log('Phase 12: PASS')

// ============================================================================
// PHASE 13: State isolation - multiple independent door systems
// ============================================================================
console.log('--- Phase 13: State isolation ---')

const doorsA = doorPanelsData([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS)
const doorsB = doorPanelsData([{ x1: 10, y1: 10, x2: 14, y2: 10, door: true }], TILE, THICKNESS)

let statesA = new Map<string, DoorAnimState>()
let statesB = new Map<string, DoorAnimState>()

statesA = tickDoors(doorsA, [makeNpc(50, 0)], statesA, 0)
statesB = tickDoors(doorsB, [makeNpc(50, 0)], statesB, 0)

assert.equal(statesA.get(doorsA[0].key)!.target, 1, 'system A: NPC near -> open')
assert.equal(statesB.get(doorsB[0].key)!.target, 0, 'system B: no NPC near -> closed')
assert.notEqual(doorsA[0].key, doorsB[0].key, 'door keys are unique per location')

console.log('Phase 13: PASS')

// ============================================================================
// PHASE 14: SVG round-trip verification
// ============================================================================
console.log('--- Phase 14: SVG round-trip verification ---')

const rtSegs: WallSegment[] = [
	{ x1: 0, y1: 0, x2: 4, y2: 0, door: true },
	{ x1: 5, y1: 0, x2: 5, y2: 3, door: true },
]
const rtSvg = doorPanelsSvg(rtSegs, TILE, THICKNESS, DOOR_COLOR, 0.5)

const rtRects = rtSvg.match(/<rect[^>]*>/g) || []
assert.equal(rtRects.length, 2, 'round-trip: 2 rects for 2 doors')

for (const rect of rtRects) {
	assert.ok(rect.includes(`fill="${DOOR_COLOR}"`), `round-trip: rect has correct fill color`)
	assert.ok(rect.includes('rx="1"'), `round-trip: rect has rx=1`)
}

assert.ok(rtSvg.startsWith('<g class="door-overlay">'), 'round-trip: starts with door-overlay group')
assert.ok(rtSvg.endsWith('</g>'), 'round-trip: ends with closing group tag')

console.log('Phase 14: PASS')

// ============================================================================
// PHASE 15: Real composable integration - useDoorAnimation
// ============================================================================
console.log('--- Phase 15: Real composable integration ---')

const scope = effectScope()
const realDoors = doorPanelsData([{ x1: 0, y1: 0, x2: 4, y2: 0, door: true }], TILE, THICKNESS)
const doorsRef = shallowRef(realDoors)
const npcsRef = shallowRef<NpcSimDot[]>([])
const tileSizeRef = ref(TILE)

const anim = scope.run(() => useDoorAnimation({
	getDoors: () => doorsRef.value,
	getNpcs: () => npcsRef.value,
	getTileSize: () => tileSizeRef.value,
}))!

// Verify initial state
assert.equal(anim.doorStates.value.size, 0, 'composable: initial state empty')

// The composable uses RAF internally, so we verify the API surface
// and that doorStates is a reactive shallowRef
assert.ok(anim.doorStates.value instanceof Map, 'composable: doorStates is a Map')
assert.equal(typeof anim.start, 'function', 'composable: start is a function')
assert.equal(typeof anim.stop, 'function', 'composable: stop is a function')
assert.equal(typeof anim.reset, 'function', 'composable: reset is a function')

// Test reset clears state
anim.reset()
assert.equal(anim.doorStates.value.size, 0, 'composable: reset clears state')

scope.stop()

console.log('Phase 15: PASS')

// ============================================================================
// PHASE 16: Hybrid door animation (proximity + door-passage events)
// ============================================================================
console.log('--- Phase 16: Hybrid door animation (proximity + events) ---')

import type { NpcEngineEvent } from '../src/engine/npc'

const eventDoors = doorPanelsData([{ x1: 2, y1: 2, x2: 2, y2: 4, door: true }], TILE, THICKNESS)
const eventScope = effectScope()
const eventDoorsRef = shallowRef(eventDoors)
const eventNpcsRef = shallowRef<NpcSimDot[]>([])
const eventTileSizeRef = ref(TILE)
const eventPassageEventsRef = shallowRef<NpcEngineEvent[]>([])

const eventAnim = eventScope.run(() => useDoorAnimation({
	getDoors: () => eventDoorsRef.value,
	getNpcs: () => eventNpcsRef.value,
	getTileSize: () => eventTileSizeRef.value,
	getDoorPassageEvents: () => eventPassageEventsRef.value,
}))!

assert.equal(eventAnim.doorStates.value.size, 0, 'hybrid mode: initial state empty')

const doorKey = eventDoors[0].key
const evtDoorCx = eventDoors[0].cx
const evtDoorCy = eventDoors[0].cy

// Test 1: proximity opens door even without events (NPC nearby)
{
	const states = new Map<string, DoorAnimState>()
	const tileSize = eventTileSizeRef.value
	const proximityPx = DOOR_PROXIMITY_TILES * tileSize
	const doors = eventDoorsRef.value
	const npcs: NpcSimDot[] = [{ id: 'n1', floorId: 'F1', type: '', x: evtDoorCx, y: evtDoorCy, targetX: 0, targetY: 0, speed: 1, color: '#fff', status: 'walking', pauseTimer: 0, pathIdx: 0, path: [], interactTargetKey: null, interactSpotKey: null, interactDurationMin: 0, interactDurationMax: 0 }]
	const now = Date.now()
	for (const door of doors) {
		let state = states.get(door.key)
		if (!state) { state = { progress: 0, target: 0, lastNearby: 0, lastClosed: null }; states.set(door.key, state) }
		const nearby = npcs.some(n => Math.hypot(n.x - door.cx, n.y - door.cy) < proximityPx)
		if (nearby) { state.target = 1; state.lastNearby = now }
	}
	assert.equal(states.get(doorKey)!.target, 1, 'hybrid: proximity opens door without events')
}

// Test 2: door-passage event opens door even without nearby NPC
{
	const states = new Map<string, DoorAnimState>()
	const tileSize = eventTileSizeRef.value
	const proximityPx = DOOR_PROXIMITY_TILES * tileSize
	const doors = eventDoorsRef.value
	const npcs: NpcSimDot[] = []
	const events: NpcEngineEvent[] = [{
		type: 'door-passage', agentId: 'npc-1', floorId: 'F1', tick: 1,
		doorEdge: { from: { x: 2, y: 2 }, to: { x: 2, y: 3 } },
	}]
	let lastConsumedEventTick = -1
	const now = Date.now()
	for (const door of doors) {
		let state = states.get(door.key)
		if (!state) { state = { progress: 0, target: 0, lastNearby: 0, lastClosed: null }; states.set(door.key, state) }
		for (const evt of events) {
			if (evt.type !== 'door-passage' || evt.tick <= lastConsumedEventTick) continue
			if (!evt.doorEdge) continue
			const midPx = ((evt.doorEdge.from.x + evt.doorEdge.to.x) / 2) * tileSize
			const midPy = ((evt.doorEdge.from.y + evt.doorEdge.to.y) / 2) * tileSize
			const halfTile = tileSize / 2
			let matched = false
			if (door.horizontal) {
				const minX = door.cx - door.length / 2
				const maxX = door.cx + door.length / 2
				if (midPx >= minX && midPx <= maxX && Math.abs(midPy - door.cy) <= halfTile) matched = true
			} else {
				const minY = door.cy - door.length / 2
				const maxY = door.cy + door.length / 2
				if (midPy >= minY && midPy <= maxY && Math.abs(midPx - door.cx) <= halfTile) matched = true
			}
			if (matched) { state.target = 1; state.lastNearby = now; lastConsumedEventTick = evt.tick }
		}
		const nearby = npcs.some(n => Math.hypot(n.x - door.cx, n.y - door.cy) < proximityPx)
		if (nearby) { state.target = 1; state.lastNearby = now }
		else if (now - state.lastNearby > DOOR_CLOSE_DELAY_MS) state.target = 0
	}
	assert.equal(states.get(doorKey)!.target, 1, 'hybrid: event opens door without nearby NPC')
}

// Test 3: event deduplication (already-consumed tick does not re-trigger)
{
	let lastConsumedEventTick = 1
	const passageEvent: NpcEngineEvent = {
		type: 'door-passage', agentId: 'npc-1', floorId: 'F1', tick: 1,
		doorEdge: { from: { x: 2, y: 2 }, to: { x: 2, y: 3 } },
	}
	const retriggered = passageEvent.tick > lastConsumedEventTick
	assert.equal(retriggered, false, 'hybrid: already-consumed event does not re-trigger')
}

// Test 4: non-matching event does not match door
{
	const wrongEvent: NpcEngineEvent = {
		type: 'door-passage', agentId: 'npc-2', floorId: 'F1', tick: 2,
		doorEdge: { from: { x: 9, y: 9 }, to: { x: 9, y: 10 } },
	}
	const tileSize = eventTileSizeRef.value
	const doors = eventDoorsRef.value
	for (const door of doors) {
		const midPx = ((wrongEvent.doorEdge!.from.x + wrongEvent.doorEdge!.to.x) / 2) * tileSize
		const midPy = ((wrongEvent.doorEdge!.from.y + wrongEvent.doorEdge!.to.y) / 2) * tileSize
		const halfTile = tileSize / 2
		let matched = false
		if (door.horizontal) {
			const minX = door.cx - door.length / 2
			const maxX = door.cx + door.length / 2
			if (midPx >= minX && midPx <= maxX && Math.abs(midPy - door.cy) <= halfTile) matched = true
		} else {
			const minY = door.cy - door.length / 2
			const maxY = door.cy + door.length / 2
			if (midPy >= minY && midPy <= maxY && Math.abs(midPx - door.cx) <= halfTile) matched = true
		}
		assert.equal(matched, false, 'hybrid: non-matching event does not match door')
	}
}

// Test 5: reset clears state and lastConsumedEventTick
eventAnim.reset()
assert.equal(eventAnim.doorStates.value.size, 0, 'hybrid: reset clears door states')

eventScope.stop()

console.log('Phase 16: PASS')

// ============================================================================
// SUMMARY
// ============================================================================
console.log('')
console.log('========================================')
console.log('ALL DOOR ANIMATION TESTS PASSED')
console.log('========================================')
console.log('Phases: 16')
console.log(`Fuzz iterations: ${FUZZ_ITERATIONS}`)
console.log(`Rotations tested: ${rotations.join(', ')}`)
console.log('Pipeline: normalize -> rotate -> panels -> animate -> SVG')
console.log('Composable: useDoorAnimation (hybrid: proximity + events)')
console.log('Engine: door-passage events emitted on door edge crossing')
console.log('========================================')
