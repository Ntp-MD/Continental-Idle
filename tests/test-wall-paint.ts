import assert from 'node:assert/strict'
import { computed, ref } from 'vue'
import { useCanvasSelection } from '../src/blueprint-editor/composables/useCanvasSelection'
import { useWallPaint } from '../src/blueprint-editor/composables/useWallPaint'
import type { AssetsStore } from '../src/blueprint-editor/store/index'
import type { FloorData } from '../src/blueprint-editor/types'

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
	walkable: { tileEdges: [[{}, {}], [{}, {}]] },
}
const saved: NonNullable<FloorData['walkable']>[] = []
const wallTool = useWallPaint({
	disabled: () => false,
	localPoint: event => ({ x: event.clientX, y: event.clientY }),
	tileSize: () => 10,
	canvasWidth: () => 20,
	canvasHeight: () => 20,
	floor: computed(() => floor),
	wallAtPoint: () => null,
	wallsInRect: () => [
		{ x1: 0, y1: 0, x2: 10, y2: 0 },
		{ x1: 10, y1: 10, x2: 10, y2: 20 },
		{ x1: 0, y1: 10, x2: 10, y2: 10 },
	],
	commit: async (_floorId, walkable) => {
		floor.walkable = walkable
		saved.push(walkable)
	},
})

wallTool.active.value = true
assert.equal(wallTool.onMouseDown({ button: 0, clientX: 4, clientY: 0 } as MouseEvent), true)
emit('mouseup', {} as MouseEvent)
assert.deepEqual(floor.walkable?.tileEdges, [[{ top: true }, {}], [{}, {}]])
assert.equal(saved.length, 1)

assert.equal(wallTool.onMouseDown({ button: 0, clientX: 5, clientY: 5 } as MouseEvent), true)
emit('mousemove', { clientX: 5, clientY: 20 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.deepEqual(floor.walkable?.tileEdges, [[{ top: true }, {}], [{ right: true }, { left: true }]])
assert.equal(saved.length, 2)

assert.equal(wallTool.onMouseDown({ button: 0, clientX: 4, clientY: 10 } as MouseEvent), true)
emit('mousemove', { clientX: 14, clientY: 10 } as MouseEvent)
emit('mouseup', {} as MouseEvent)
assert.deepEqual(floor.walkable?.tileEdges, [[{ bottom: true, top: true }, {}], [{ right: true, top: true }, { left: true }]])
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
assert.deepEqual(floor.walkable?.tileEdges, [[{}, {}], [{}, {}]])
assert.equal(saved.length, 4)
assert.equal(wallTool.selected.value.length, 0)

assert.equal(wallTool.onMouseDown({ button: 2, clientX: 0, clientY: 0 } as MouseEvent), false)
wallTool.cancel()
assert.equal(listeners.get('mousemove')?.length ?? 0, 0)
assert.equal(listeners.get('mouseup')?.length ?? 0, 0)
console.log('Draw Wall and object-tool multi-select checks passed')
