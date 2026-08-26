import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FloorData, FloorWalkable, TileEdges, TileState } from '../types'

export interface WallSegment {
	x1: number
	y1: number
	x2: number
	y2: number
}

export interface WallSelection {
	floorId: string
	segment: WallSegment
}

export interface WallSelectionBox {
	floorId: string
	startX: number
	startY: number
	x: number
	y: number
	w: number
	h: number
}

export interface WallPaintState {
	active: Ref<boolean>
	erasing: Ref<boolean>
	selected: Ref<WallSelection[]>
	selectionBox: Ref<WallSelectionBox | null>
	preview: ComputedRef<WallSegment | null>
	onMouseDown: (e: MouseEvent) => boolean
	clearSelected: () => void
	deleteSelected: () => Promise<void>
}

export function applyWallSegment(edges: TileEdges[][], segment: WallSegment, tileSize: number, on: boolean): void {
	const rows = edges.length
	const cols = edges[0]?.length ?? 0
	const setEdge = (r: number, c: number, side: keyof TileEdges) => {
		const cell = edges[r]?.[c]
		if (!cell) return
		if (on) cell[side] = true
		else delete cell[side]
	}

	if (segment.y1 === segment.y2) {
		const boundary = Math.round(segment.y1 / tileSize)
		const startCol = Math.round(Math.min(segment.x1, segment.x2) / tileSize)
		const endCol = Math.max(startCol + 1, Math.round(Math.max(segment.x1, segment.x2) / tileSize))
		for (let c = startCol; c < endCol; c++) {
			if (boundary >= 0 && boundary < rows) setEdge(boundary, c, 'top')
			if (boundary - 1 >= 0 && boundary - 1 < rows) setEdge(boundary - 1, c, 'bottom')
		}
		return
	}

	const boundary = Math.round(segment.x1 / tileSize)
	const startRow = Math.round(Math.min(segment.y1, segment.y2) / tileSize)
	const endRow = Math.max(startRow + 1, Math.round(Math.max(segment.y1, segment.y2) / tileSize))
	for (let r = startRow; r < endRow; r++) {
		if (boundary >= 0 && boundary < cols) setEdge(r, boundary, 'left')
		if (boundary - 1 >= 0 && boundary - 1 < cols) setEdge(r, boundary - 1, 'right')
	}
}

export function useWallPaint(opts: {
	disabled: () => boolean
	localPoint: (e: MouseEvent) => { x: number; y: number } | null
	tileSize: () => number
	canvasWidth: () => number
	canvasHeight: () => number
	floor: ComputedRef<FloorData | undefined>
	wallAtPoint?: (point: { x: number; y: number }) => WallSegment | null
	wallsInRect?: (rect: { x: number; y: number; w: number; h: number }) => WallSegment[]
	clearOtherSelection?: () => void
	commit: (floorId: string, walkable: FloorWalkable) => Promise<void>
}): WallPaintState {
	const active = ref(false)
	const erasing = ref(false)
	const selected = ref<WallSelection[]>([])
	const selectionBox = ref<WallSelectionBox | null>(null)
	const segment = ref<WallSegment | null>(null)
	let start: { x: number; y: number; erase: boolean; floorId: string; hit: WallSegment | null } | null = null
	let selecting = false

	const preview = computed(() => segment.value)

	function snap(v: number, t: number): number {
		return Math.round(v / t) * t
	}

	function clearSelected() {
		selected.value = []
		selectionBox.value = null
		if (selecting) {
			selecting = false
			start = null
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}

	function updateSelectionBox(point: { x: number; y: number }) {
		if (!selectionBox.value) return
		const box = selectionBox.value
		box.x = Math.min(box.startX, point.x)
		box.y = Math.min(box.startY, point.y)
		box.w = Math.abs(point.x - box.startX)
		box.h = Math.abs(point.y - box.startY)
	}

	function selectWallsInBox() {
		const box = selectionBox.value
		selectionBox.value = null
		const floor = opts.floor.value
		if (!box || !floor || floor.id !== box.floorId) return
		const walls = opts.wallsInRect?.({ x: box.x, y: box.y, w: box.w, h: box.h }) ?? []
		selected.value = walls.map(segment => ({ floorId: floor.id, segment }))
		if (selected.value.length > 0) opts.clearOtherSelection?.()
	}

	function onMouseDown(e: MouseEvent): boolean {
		if (e.button !== 0 && e.button !== 2) return false
		const p = opts.localPoint(e)
		if (!p) return false
		const floor = opts.floor.value
		if (!floor) return false
		const disabled = opts.disabled()
		const hit = !disabled && e.button === 0 && !e.altKey ? opts.wallAtPoint?.(p) ?? null : null
		const boxSelect = !disabled && e.button === 0 && e.shiftKey
		if (!active.value && !hit && !boxSelect) return false
		clearSelected()
		selecting = boxSelect
		start = { x: p.x, y: p.y, erase: e.button === 2 || e.altKey, floorId: floor.id, hit }
		erasing.value = start.erase
		segment.value = boxSelect ? null : { x1: p.x, y1: p.y, x2: p.x, y2: p.y }
		if (boxSelect) {
			opts.clearOtherSelection?.()
			selectionBox.value = { floorId: floor.id, startX: p.x, startY: p.y, x: p.x, y: p.y, w: 0, h: 0 }
		}
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
		return true
	}

	function onMouseMove(e: MouseEvent) {
		if (!start) return
		const p = opts.localPoint(e)
		if (!p) return
		const dx = Math.abs(p.x - start.x)
		const dy = Math.abs(p.y - start.y)
		if (!selecting && !start.erase && Math.max(dx, dy) > 4) {
			const box = {
				x: Math.min(start.x, p.x),
				y: Math.min(start.y, p.y),
				w: dx,
				h: dy,
			}
			const hasWalls = (opts.wallsInRect?.(box).length ?? 0) > 0
			if (start.hit || hasWalls) {
				selecting = true
				segment.value = null
				selectionBox.value = { floorId: start.floorId, startX: start.x, startY: start.y, ...box }
			}
		}
		if (selecting) {
			updateSelectionBox(p)
			return
		}
		const t = opts.tileSize()
		if (dx >= dy) {
			const gy = snap(start.y, t)
			segment.value = { x1: snap(start.x, t), y1: gy, x2: snap(p.x, t), y2: gy }
		} else {
			const gx = snap(start.x, t)
			segment.value = { x1: gx, y1: snap(start.y, t), x2: gx, y2: snap(p.y, t) }
		}
	}

	function baseGrid<T>(rows: number, cols: number, fill: () => T): T[][] {
		return Array.from({ length: rows }, () => Array.from({ length: cols }, fill))
	}

	function resolveWalkable(floor: FloorData, rows: number, cols: number): Required<FloorWalkable> {
		const w = floor.walkable
		const gridOk = !!w?.walkableGrid && w.walkableGrid.length === rows && w.walkableGrid[0]?.length === cols
		const statesOk = !!w?.tileStates && w.tileStates.length === rows && w.tileStates[0]?.length === cols
		const edgesOk = !!w?.tileEdges && w.tileEdges.length === rows && w.tileEdges[0]?.length === cols
		const blockedDefault = floor.defaultWalkable === false
		return {
			walkableGrid: gridOk ? w!.walkableGrid!.map(row => [...row]) : baseGrid(rows, cols, () => !blockedDefault),
			tileStates: statesOk ? w!.tileStates!.map(row => [...row]) : baseGrid<TileState>(rows, cols, () => (blockedDefault ? 'blocked' : 'walkable')),
			tileEdges: edgesOk ? w!.tileEdges!.map(row => row.map(edge => ({ ...(edge ?? {}) }))) : baseGrid<TileEdges>(rows, cols, () => ({})),
		}
	}

	async function onMouseUp() {
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		const seg = segment.value
		segment.value = null
		const st = start
		start = null
		if (selecting) {
			selecting = false
			selectWallsInBox()
			return
		}
		const floor = opts.floor.value
		if (!seg || !st || !floor) return
		if (floor.id !== st.floorId) return
		if (st.hit && !st.erase && seg.x1 === st.x && seg.y1 === st.y && seg.x2 === st.x && seg.y2 === st.y) {
			selected.value = [{ floorId: floor.id, segment: st.hit }]
			opts.clearOtherSelection?.()
			return
		}
		const t = opts.tileSize()
		const cols = Math.max(1, Math.round(opts.canvasWidth() / t))
		const rows = Math.max(1, Math.round(opts.canvasHeight() / t))
		const walkable = resolveWalkable(floor, rows, cols)
		applyWallSegment(walkable.tileEdges, seg, t, !st.erase)
		await opts.commit(floor.id, walkable)
	}

	async function deleteSelected() {
		const picked = selected.value
		const floor = opts.floor.value
		if (picked.length === 0 || !floor || picked.some(selection => selection.floorId !== floor.id)) {
			clearSelected()
			return
		}
		const t = opts.tileSize()
		const cols = Math.max(1, Math.round(opts.canvasWidth() / t))
		const rows = Math.max(1, Math.round(opts.canvasHeight() / t))
		const walkable = resolveWalkable(floor, rows, cols)
		for (const selection of picked) applyWallSegment(walkable.tileEdges, selection.segment, t, false)
		await opts.commit(floor.id, walkable)
		clearSelected()
	}

	return { active, erasing, selected, selectionBox, preview, onMouseDown, clearSelected, deleteSelected }
}
