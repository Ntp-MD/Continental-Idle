import assert from 'node:assert/strict'
import { computed } from 'vue'
import { useWallPaint } from '../src/blueprint-editor/composables/useWallPaint'
import type { FloorData } from '../src/blueprint-editor/types'

	; (async () => {
		const selectedWallSegment = { x1: 0, y1: 10, x2: 10, y2: 10 }
		const secondWallSegment = { x1: 10, y1: 10, x2: 20, y2: 10 }
		const listeners = new Map<string, Array<(event: MouseEvent) => void>>()
		const windowMock = {
			addEventListener: (type: string, listener: (event: MouseEvent) => void) => {
				listeners.set(type, [...(listeners.get(type) ?? []), listener])
			},
			removeEventListener: (type: string, listener: (event: MouseEvent) => void) => {
				listeners.set(type, (listeners.get(type) ?? []).filter(item => item !== listener))
			},
		}
			; (globalThis as { window?: unknown }).window = windowMock
		const selectedWallFloor: FloorData = {
			id: 'floor-wall',
			name: 'Wall Floor',
			label: 'W',
			objects: [],
			defaultWalkable: true,
			walkable: { tileEdges: [[{ bottom: true }, { bottom: true }], [{ top: true }, { top: true }]] },
		}
		let clearedObjectSelection = false
		let deletedWalkable: FloorData['walkable']
		const wallTool = useWallPaint({
			disabled: () => false,
			localPoint: (event) => ({ x: event.clientX, y: event.clientY }),
			tileSize: () => 10,
			canvasWidth: () => 20,
			canvasHeight: () => 20,
			floor: computed(() => selectedWallFloor),
			wallAtPoint: (point) => point.y === 10 ? selectedWallSegment : null,
			wallsInRect: () => [selectedWallSegment, secondWallSegment],
			clearOtherSelection: () => { clearedObjectSelection = true },
			commit: async (_floorId, walkable) => { deletedWalkable = walkable },
		})
		wallTool.active.value = true

		assert.equal(wallTool.onMouseDown({ button: 0, clientX: 5, clientY: 10 } as MouseEvent), true)
		for (const listener of listeners.get('mouseup') ?? []) listener({} as MouseEvent)
		assert.deepEqual(wallTool.selected.value, [{ floorId: 'floor-wall', segment: selectedWallSegment }])
		assert.equal(clearedObjectSelection, true)
		assert.equal(wallTool.onMouseDown({ button: 0, clientX: 0, clientY: 0 } as MouseEvent), true)
		for (const listener of listeners.get('mousemove') ?? []) listener({ clientX: 20, clientY: 20 } as MouseEvent)
		for (const listener of listeners.get('mouseup') ?? []) listener({} as MouseEvent)
		await Promise.resolve()
		assert.deepEqual(wallTool.selected.value, [
			{ floorId: 'floor-wall', segment: selectedWallSegment },
			{ floorId: 'floor-wall', segment: secondWallSegment },
		])
		await wallTool.deleteSelected()
		assert.deepEqual(deletedWalkable?.tileEdges, [[{}, {}], [{}, {}]])
		assert.equal(wallTool.selected.value.length, 0)
		assert.equal(wallTool.selectionBox.value, null)

		// Shift+drag box-selects walls even with the tool inactive (any mode)
		const inactiveDeleted: FloorData['walkable'][] = []
		const inactiveTool = useWallPaint({
			disabled: () => false,
			localPoint: (event) => ({ x: event.clientX, y: event.clientY }),
			tileSize: () => 10,
			canvasWidth: () => 20,
			canvasHeight: () => 20,
			floor: computed(() => selectedWallFloor),
			wallAtPoint: () => null,
			wallsInRect: () => [selectedWallSegment, secondWallSegment],
			clearOtherSelection: () => { clearedObjectSelection = true },
			commit: async (_floorId, walkable) => { inactiveDeleted.push(walkable) },
		})
		assert.equal(inactiveTool.active.value, false)
		assert.equal(inactiveTool.onMouseDown({ button: 0, clientX: 0, clientY: 0, shiftKey: true } as MouseEvent), true)
		for (const listener of listeners.get('mousemove') ?? []) listener({ clientX: 20, clientY: 20 } as MouseEvent)
		for (const listener of listeners.get('mouseup') ?? []) listener({} as MouseEvent)
		assert.equal(inactiveTool.selected.value.length, 2)
		assert.equal(inactiveDeleted.length, 0)
		console.log('Wall multi-selection deletion checks passed')
	})().catch(error => {
		console.error(error)
		process.exitCode = 1
	})
