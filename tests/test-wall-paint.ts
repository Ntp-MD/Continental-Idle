import assert from 'node:assert/strict'
import { computed, ref } from 'vue'
import { useCanvasSelection } from '../src/blueprint-editor/composables/useCanvasSelection'
import { useWallPaint, type WallSelection } from '../src/blueprint-editor/composables/useWallPaint'
import { doorPanelsData, doorPanelsSvg } from '../src/blueprint-editor/assetUtils'
import { resolveWallSegmentsForObject } from '../src/blueprint-editor/types'
import type { AssetsStore } from '../src/blueprint-editor/store/index'
import type { AssetDef, FloorData, ObjectData, WallSegment } from '../src/blueprint-editor/types'

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
const saved: ObjectData[] = []
let id = 0
const wallTool = useWallPaint({
	disabled: () => false,
	localPoint: event => ({ x: event.clientX, y: event.clientY }),
	tileSize: () => 10,
	canvasWidth: () => 20,
	canvasHeight: () => 20,
	floor: computed(() => floor),
	wallAtPoint: () => null,
	wallsInRect: () => floor.objects
		.filter(object => object.isWall)
		.map(object => ({
			floorId: floor.id,
			objectId: object.id,
			segment: { x1: object.x1!, y1: object.y1!, x2: object.x2!, y2: object.y2! },
		})),
	idGenerator: prefix => `${prefix}-${++id}`,
	commit: async (_floorId, wall) => {
		floor.objects.push(wall)
		saved.push(wall)
	},
	remove: async (_floorId, objectIds) => {
		floor.objects = floor.objects.filter(object => !objectIds.includes(object.id))
	},
})

wallTool.active.value = true
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
assert.equal(saved.length, 1)

assert.equal(wallTool.onMouseDown({ button: 0, clientX: 5, clientY: 5 } as MouseEvent), true)
emit('mousemove', { clientX: 5, clientY: 20 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.deepEqual([floor.objects[1]?.x1, floor.objects[1]?.y1, floor.objects[1]?.x2, floor.objects[1]?.y2], [1, 1, 1, 2])
assert.equal(saved.length, 2)

assert.equal(wallTool.onMouseDown({ button: 0, clientX: 4, clientY: 10 } as MouseEvent), true)
emit('mousemove', { clientX: 14, clientY: 10 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.deepEqual([floor.objects[2]?.x1, floor.objects[2]?.y1, floor.objects[2]?.x2, floor.objects[2]?.y2], [0, 1, 1, 1])
assert.equal(saved.length, 3)

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
assert.equal(saved.length, 3)
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

// Horizontal door segment (y1 === y2), 4 tiles wide
const hSeg: WallSegment = { x1: 0, y1: 5, x2: 4, y2: 5, door: true }
const hPanels = doorPanelsData([hSeg], tileSize, thickness)
assert.equal(hPanels.length, 1)
assert.equal(hPanels[0].horizontal, true)
assert.equal(hPanels[0].cx, (0 + 4) * tileSize / 2)
assert.equal(hPanels[0].cy, 5 * tileSize)
assert.equal(hPanels[0].length, 4 * tileSize)
assert.equal(hPanels[0].thickness, thickness)

// Vertical door segment (x1 === x2), 3 tiles tall
const vSeg: WallSegment = { x1: 2, y1: 0, x2: 2, y2: 3, door: true }
const vPanels = doorPanelsData([vSeg], tileSize, thickness)
assert.equal(vPanels.length, 1)
assert.equal(vPanels[0].horizontal, false)
assert.equal(vPanels[0].cx, 2 * tileSize)
assert.equal(vPanels[0].cy, (0 + 3) * tileSize / 2)
assert.equal(vPanels[0].length, 3 * tileSize)

// Non-door segments are filtered out
const wallOnly: WallSegment = { x1: 0, y1: 0, x2: 5, y2: 0 }
assert.equal(doorPanelsData([wallOnly], tileSize, thickness).length, 0)

// SVG output at progress=0 (closed): two panels side by side, no offset
const closedSvg = doorPanelsSvg([hSeg], tileSize, thickness, '#3b82f6', 0)
assert.ok(closedSvg.includes('<g class="door-overlay">'))
assert.ok(closedSvg.includes('<rect'))
// At progress=0, left panel starts at cx - length/2, right panel starts at cx
const halfLen = (4 * tileSize) / 2
const cx = (0 + 4) * tileSize / 2
const fmt = (n: number) => n.toFixed(2)
assert.ok(closedSvg.includes(`x="${fmt(cx - halfLen)}"`), 'closed left panel at cx - half')
assert.ok(closedSvg.includes(`x="${fmt(cx)}"`), 'closed right panel at cx')

// SVG output at progress=1 (open): panels offset by half length
const openSvg = doorPanelsSvg([hSeg], tileSize, thickness, '#3b82f6', 1)
assert.ok(openSvg.includes(`x="${fmt(cx - halfLen - halfLen)}"`), 'open left panel shifted left by half')
assert.ok(openSvg.includes(`x="${fmt(cx + halfLen)}"`), 'open right panel shifted right by half')

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
assert.ok(rotatedPanels.length > 0, 'door panels from rotated asset')
// After 90deg rotation, a horizontal segment (y1===y2) becomes vertical (x1===x2)
assert.ok(rotatedPanels.every(p => !p.horizontal), 'horizontal door becomes vertical after 90deg rotation')

console.log('Door panel rendering checks passed')
