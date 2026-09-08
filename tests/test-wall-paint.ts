import assert from 'node:assert/strict'
import { computed, ref } from 'vue'
import { useCanvasSelection } from '../src/blueprint-editor/composables/useCanvasSelection'
import { useWallPaint, type WallSelection } from '../src/blueprint-editor/composables/useWallPaint'
import { doorPanelsData, doorPanelsSvg } from '../src/blueprint-editor/assets/assetUtils'
import { resolveWallSegmentsForObject } from '../src/blueprint-editor/domain/types'
import { doorRuns, withDoorRunMode, withoutDoorRun, segmentCoversTileEdge, type BorderSide } from '../src/blueprint-editor/domain/gridEditing'
import type { AssetsStore } from '../src/blueprint-editor/store/index'
import type { AssetDef, FloorData, ObjectData, WallSegment } from '../src/blueprint-editor/domain/types'

const listeners = new Map<string, Array<(event: MouseEvent) => void>>()
const windowMock = {
	addEventListener: (type: string, listener: (event: MouseEvent) => void) => {
		listeners.set(type, [...(listeners.get(type) ?? []), listener])
	},
	removeEventListener: (type: string, listener: (event: MouseEvent) => void) => {
		listeners.set(type, (listeners.get(type) ?? []).filter(item => item !== listener))
	},
}

defineWindow(windowMock)

function defineWindow(value: unknown): void {
	; (globalThis as { window?: unknown }).window = value
}

function emit(type: string, event: MouseEvent): void {
	for (const listener of [...(listeners.get(type) ?? [])]) listener(event)
}

const floor: FloorData = {
	id: 'floor-wall',
	name: 'Wall Floor',
	label: 'W',
	objects: [],
	defaultWalkable: true,
}
let saves = 0
let id = 0
const wallTool = useWallPaint({
	disabled: () => false,
	localPoint: event => ({ x: event.clientX, y: event.clientY }),
	tileSize: () => 10,
	canvasWidth: () => 20,
	canvasHeight: () => 20,
	floor: computed(() => floor),
	wallAtEdge: (col, row, side) => {
		const hit = floor.objects.find(object => object.isWall && segmentCoversTileEdge({ x1: object.x1!, y1: object.y1!, x2: object.x2!, y2: object.y2! }, row, col, side))
		return hit ? { floorId: floor.id, objectId: hit.id, segment: { x1: hit.x1!, y1: hit.y1!, x2: hit.x2!, y2: hit.y2! }, locked: hit.locked } : null
	},
	wallsInRect: () => floor.objects
		.filter(object => object.isWall)
		.map(object => ({
			floorId: floor.id,
			objectId: object.id,
			segment: { x1: object.x1!, y1: object.y1!, x2: object.x2!, y2: object.y2! },
		})),
	idGenerator: prefix => `${prefix}-${++id}`,
	commit: async () => { saves++ },
	remove: async (_floorId, objectIds) => {
		floor.objects = floor.objects.filter(object => !objectIds.includes(object.id))
	},
})

wallTool.active.value = true

// Plot paint: a click paints the nearest tile edge as a 1-tile wall
assert.equal(wallTool.onMouseDown({ button: 0, clientX: 4, clientY: 0 } as MouseEvent), true)
emit('mouseup', {} as MouseEvent)
assert.deepEqual(floor.objects[0], {
	id: 'wall-1',
	type: '__canvas-wall__',
	x: 0,
	y: 0,
	w: 10,
	h: 1,
	rotation: 0,
	isWall: true,
	x1: 0,
	y1: 0,
	x2: 1,
	y2: 0,
})
assert.equal(saves, 1, 'one save per stroke')

// Drag plot: one wall edge per visited cell, one save per stroke
assert.equal(wallTool.onMouseDown({ button: 0, clientX: 5, clientY: 15 } as MouseEvent), true)
emit('mousemove', { clientX: 15, clientY: 15 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.equal(floor.objects.length, 3, 'drag paints one wall edge per visited cell')
assert.deepEqual(floor.objects.map(object => [object.x1, object.y1, object.x2, object.y2]), [[0, 0, 1, 0], [0, 1, 1, 1], [1, 1, 2, 1]])
assert.equal(saves, 2)

assert.equal(wallTool.onMouseDown({ button: 0, clientX: 15, clientY: 5 } as MouseEvent), true)
emit('mouseup', {} as MouseEvent)
assert.deepEqual([floor.objects[3]?.x1, floor.objects[3]?.y1, floor.objects[3]?.x2, floor.objects[3]?.y2], [1, 0, 2, 0])
assert.equal(saves, 3)

// Erase stroke: starting on an existing wall edge erases every visited edge
assert.equal(wallTool.onMouseDown({ button: 0, clientX: 4, clientY: 0 } as MouseEvent), true)
emit('mousemove', { clientX: 15, clientY: 15 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.deepEqual(floor.objects.map(object => [object.x1, object.y1, object.x2, object.y2]), [[0, 1, 1, 1], [1, 0, 2, 0]], 'erase removes visited wall edges')
assert.equal(saves, 4)

// Locked wall edges are a no-op for both paint and erase
floor.objects.push({ id: 'wall-locked', type: '__canvas-wall__', x: 10, y: 10, w: 10, h: 1, rotation: 0, isWall: true, x1: 1, y1: 1, x2: 2, y2: 1, locked: true })
assert.equal(wallTool.onMouseDown({ button: 0, clientX: 15, clientY: 15 } as MouseEvent), false, 'locked edge ignores plotting')
assert.equal(floor.objects.length, 3, 'locked wall untouched')

const objectToolStore = {
	state: { mode: 'object', selectionState: { primary: null, items: [] } },
	select: () => { },
	selectAsset: () => { },
} as unknown as AssetsStore
const objectSelection = useCanvasSelection({
	spaceDown: ref(false),
	localPoint: event => ({ x: event.clientX, y: event.clientY }),
	canvasWidth: () => 20,
	canvasHeight: () => 20,
	startPan: () => { },
	floor: computed(() => floor),
	store: objectToolStore,
	getMode: () => 'object',
	zoom: ref(1),
	boxSelectThresholdPx: () => 4,
	onBoxSelectComplete: rect => wallTool.selectInRect(rect),
})
objectSelection.onCanvasMouseDown({ button: 0, clientX: 0, clientY: 0 } as MouseEvent)
emit('mousemove', { clientX: 20, clientY: 20 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.equal(wallTool.selected.value.length, 3)
await wallTool.deleteSelected()
assert.equal(floor.objects.length, 0)
assert.equal(wallTool.selected.value.length, 0)

const outsideSelection: WallSelection[] = []
assert.deepEqual(outsideSelection, [])
assert.equal(wallTool.onMouseDown({ button: 2, clientX: 0, clientY: 0 } as MouseEvent), false)
wallTool.cancel()
assert.equal(listeners.get('mousemove')?.length ?? 0, 0)
assert.equal(listeners.get('mouseup')?.length ?? 0, 0)
console.log('Draw Wall and object-tool multi-select checks passed')

// --- Door panel rendering checks ---

const tileSize = 25
const thickness = 3

// Horizontal door segment (y1 === y2), 4 tiles wide -> split into 2 halves
const hSeg: WallSegment = { x1: 0, y1: 5, x2: 4, y2: 5, door: true }
const hPanels = doorPanelsData([hSeg], tileSize, thickness)
assert.equal(hPanels.length, 2)
assert.ok(hPanels.every(p => p.horizontal))
assert.equal(hPanels[0].length, 2 * tileSize)
assert.equal(hPanels[1].length, 2 * tileSize)
assert.equal(hPanels[0].cx, tileSize)
assert.equal(hPanels[1].cx, 3 * tileSize)
assert.equal(hPanels[0].cy, 5 * tileSize)
assert.equal(hPanels[0].slideDir, -1)
assert.equal(hPanels[1].slideDir, 1)
assert.equal(hPanels[0].group, hPanels[1].group)
assert.equal(hPanels[0].thickness, thickness)

// Vertical door segment (x1 === x2), 3 tiles tall -> split into 2 halves
const vSeg: WallSegment = { x1: 2, y1: 0, x2: 2, y2: 3, door: true }
const vPanels = doorPanelsData([vSeg], tileSize, thickness)
assert.equal(vPanels.length, 2)
assert.equal(vPanels[0].horizontal, false)
assert.equal(vPanels[0].cx, 2 * tileSize)
assert.equal(vPanels[0].length, 1.5 * tileSize)
assert.equal(vPanels[0].slideDir, -1)
assert.equal(vPanels[1].slideDir, 1)

// Narrow 1-tile door stays a single panel sliding into the wall side
const narrowSeg: WallSegment = { x1: 0, y1: 5, x2: 1, y2: 5, door: true }
const narrowPanels = doorPanelsData([narrowSeg], tileSize, thickness)
assert.equal(narrowPanels.length, 1)
assert.equal(narrowPanels[0].length, tileSize)
assert.equal(narrowPanels[0].half, undefined)

// Canvas path: segments arrive pre-scaled in px with tileSize 1, so the real
// px-per-tile must be passed or every door (even 1-wide) splits into halves
const canvasOne: WallSegment = { x1: 0, y1: 125, x2: 25, y2: 125, door: true }
assert.equal(doorPanelsData([canvasOne], 1, thickness, tileSize).length, 1, 'canvas 1-wide door stays single')
const canvasTwo: WallSegment = { x1: 0, y1: 125, x2: 50, y2: 125, door: true }
const canvasTwoPanels = doorPanelsData([canvasTwo], 1, thickness, tileSize)
assert.equal(canvasTwoPanels.length, 2, 'canvas 2-wide door splits into halves')
assert.equal(canvasTwoPanels[0].slideDir, -1)
assert.equal(canvasTwoPanels[1].slideDir, 1)
const canvasFour: WallSegment = { x1: 0, y1: 125, x2: 100, y2: 125, door: true }
assert.equal(doorPanelsData([canvasFour], 1, thickness, tileSize).length, 2, 'canvas 4-wide door splits into halves')

// Non-door segments are filtered out
const wallOnly: WallSegment = { x1: 0, y1: 0, x2: 5, y2: 0 }
assert.equal(doorPanelsData([wallOnly], tileSize, thickness).length, 0)

// SVG output at progress=0 (closed): two halves meeting at the center
const closedSvg = doorPanelsSvg([hSeg], tileSize, thickness, '#3b82f6', 0)
assert.ok(closedSvg.includes('<g class="door-overlay">'))
assert.ok(closedSvg.includes('<rect'))
assert.equal(closedSvg.match(/<rect/g)!.length, 2)
const fmt = (n: number) => n.toFixed(2)
assert.ok(closedSvg.includes(`x="${fmt(0)}"`), 'closed left half starts at 0')
assert.ok(closedSvg.includes(`x="${fmt(2 * tileSize)}"`), 'closed right half starts at center')

// SVG output at progress=1 (open): halves slid apart by half length each
const openSvg = doorPanelsSvg([hSeg], tileSize, thickness, '#3b82f6', 1)
assert.equal(openSvg.match(/<rect/g)!.length, 2)
assert.ok(openSvg.includes(`x="${fmt(-2 * tileSize)}"`), 'open left half slid left')
assert.ok(openSvg.includes(`x="${fmt(4 * tileSize)}"`), 'open right half slid right')

// Empty segments produce empty SVG
assert.equal(doorPanelsSvg([], tileSize, thickness, '#fff', 1), '')

// --- Rotated asset door panel checks ---
// Asset with a door segment, rotated 90deg, should produce valid door panels
const doorAsset: AssetDef = {
	id: 'door-asset',
	name: 'Door Asset',
	w: 3,
	h: 2,
	wallSegments: [{ x1: 0, y1: 1, x2: 3, y2: 1, door: true }],
}
const object = { x: 100, y: 200, w: 3 * tileSize, h: 2 * tileSize, rotation: 90 as const }
const rotatedSegs = resolveWallSegmentsForObject(doorAsset.wallSegments, doorAsset, object, tileSize)
assert.ok(rotatedSegs.length > 0, 'rotated door segments produced')
assert.ok(rotatedSegs.every(s => s.door === true), 'door flag preserved after rotation')
const rotatedPanels = doorPanelsData(rotatedSegs, tileSize, thickness)
assert.equal(rotatedPanels.length, 2, 'wide rotated door splits into 2 halves')
// After 90deg rotation, a horizontal segment (y1===y2) becomes vertical (x1===x2)
assert.ok(rotatedPanels.every(p => !p.horizontal), 'horizontal door becomes vertical after 90deg rotation')

console.log('Door panel rendering checks passed')

// --- Door run group ops checks (1x1 canonical) ---

const runSegs: WallSegment[] = [
	{ x1: 0, y1: 5, x2: 1, y2: 5, door: true, doorMode: 'hold-open' },
	{ x1: 1, y1: 5, x2: 2, y2: 5, door: true },
	{ x1: 2, y1: 5, x2: 3, y2: 5, door: true },
	{ x1: 4, y1: 5, x2: 5, y2: 5, door: true, doorMode: 'hold-open' },
	{ x1: 0, y1: 0, x2: 0, y2: 3 },
]
const runs = doorRuns(runSegs)
assert.equal(runs.length, 2, 'contiguous 1-tile door pieces group into one run, gap starts a new run')
assert.equal(runs[0].count, 3)
assert.equal(runs[0].lo, 0)
assert.equal(runs[0].hi, 3)
assert.equal(runs[1].lo, 4)

const modeApplied = withDoorRunMode(runSegs, runs[0].anchor, 'auto-close')
assert.ok(modeApplied.slice(0, 3).every(s => s.doorMode === 'auto-close'), 'mode applies to the whole run')
assert.equal(modeApplied[3].doorMode, 'hold-open', 'other run keeps its own mode')
assert.equal(modeApplied[4].doorMode, undefined, 'non-door segment untouched')

const cleared = withDoorRunMode(runSegs, runs[0].anchor, undefined)
assert.ok(cleared.slice(0, 3).every(s => s.doorMode === undefined), 'auto mode clears explicit modes on the run')

const removed = withoutDoorRun(runSegs, runs[0].anchor)
assert.equal(removed.filter(s => s.door).length, 1, 'run delete removes only that run')
assert.equal(removed.find(s => !s.door), runSegs[4], 'non-door walls survive run delete')

console.log('Door run group ops checks passed')
