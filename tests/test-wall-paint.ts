import assert from 'node:assert/strict'
import { computed, ref } from 'vue'
import { useCanvasSelection } from '../src/blueprint-editor/composables/useCanvasSelection'
import { useWallPaint, type WallSelection } from '../src/blueprint-editor/composables/useWallPaint'
import type { AssetsStore } from '../src/blueprint-editor/store/index'
import type { FloorData, ObjectData } from '../src/blueprint-editor/types'

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
	subId: 'wall-sub-2',
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
