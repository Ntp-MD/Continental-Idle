import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FloorData, FloorWalkable, TileEdges, TileState, WallSegment } from '../types'

export type { WallSegment }

export interface WallSelection {
	floorId: string
	segment: WallSegment
}

export interface WallPaintState {
	active: Ref<boolean>
	selected: Ref<WallSelection[]>
	preview: ComputedRef<WallSegment | null>
	onMouseDown: (e: MouseEvent) => boolean
	selectInRect: (rect: { x: number; y: number; w: number; h: number }) => void
	clearSelection: () => void
	deleteSelected: () => Promise<void>
	cancel: () => void
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
	commit: (floorId: string, walkable: FloorWalkable) => Promise<void>
	selection?: Ref<WallSelection[]>
}): WallPaintState {
	const active = ref(false)
	const selected = opts.selection ?? ref<WallSelection[]>([])
	const segment = ref<WallSegment | null>(null)
	let start: { x: number; y: number; floorId: string; hit: WallSegment | null } | null = null

	const preview = computed(() => segment.value)

	function snap(v: number, t: number): number {
		return Math.round(v / t) * t
	}

	function clearSelection() {
		selected.value = []
	}

	function selectInRect(rect: { x: number; y: number; w: number; h: number }) {
		const floor = opts.floor.value
		if (!floor) {
			clearSelection()
			return
		}
		const seen = new Set<string>()
		const walls = (opts.wallsInRect?.(rect) ?? []).filter(wall => {
			const key = `${wall.x1},${wall.y1},${wall.x2},${wall.y2}`
			if (seen.has(key)) return false
			seen.add(key)
			return true
		})
		selected.value = walls.map(segment => ({ floorId: floor.id, segment }))
	}

	function cancel() {
		segment.value = null
		start = null
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
	}

	function onMouseDown(e: MouseEvent): boolean {
		if (e.button !== 0 || !active.value || opts.disabled()) return false
		const p = opts.localPoint(e)
		const floor = opts.floor.value
		if (!p || !floor) return false
		cancel()
		clearSelection()
		const hit = opts.wallAtPoint?.(p) ?? null
		start = { x: p.x, y: p.y, floorId: floor.id, hit }
		segment.value = hit ? { ...hit } : { x1: p.x, y1: p.y, x2: p.x, y2: p.y }
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
		return true
	}

	function onMouseMove(e: MouseEvent) {
		if (!start) return
		const p = opts.localPoint(e)
		if (!p) return
		const t = opts.tileSize()
		const dx = Math.abs(p.x - start.x)
		const dy = Math.abs(p.y - start.y)
		const horizontal = start.hit ? start.hit.y1 === start.hit.y2 : dx >= dy
		if (horizontal) {
			const gy = start.hit ? start.hit.y1 : snap(start.y, t)
			segment.value = { x1: snap(start.x, t), y1: gy, x2: snap(p.x, t), y2: gy }
		} else {
			const gx = start.hit ? start.hit.x1 : snap(start.x, t)
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
		const st = start
		segment.value = null
		start = null
		const floor = opts.floor.value
		if (!seg || !st || !floor || floor.id !== st.floorId) return
		const t = opts.tileSize()
		const cols = Math.max(1, Math.round(opts.canvasWidth() / t))
		const rows = Math.max(1, Math.round(opts.canvasHeight() / t))
		const walkable = resolveWalkable(floor, rows, cols)
		applyWallSegment(walkable.tileEdges, seg, t, true)
		await opts.commit(floor.id, walkable)
	}

	async function deleteSelected() {
		const picked = selected.value
		const floor = opts.floor.value
		if (picked.length === 0 || !floor || picked.some(selection => selection.floorId !== floor.id)) {
			clearSelection()
			return
		}
		const t = opts.tileSize()
		const cols = Math.max(1, Math.round(opts.canvasWidth() / t))
		const rows = Math.max(1, Math.round(opts.canvasHeight() / t))
		const walkable = resolveWalkable(floor, rows, cols)
		for (const selection of picked) applyWallSegment(walkable.tileEdges, selection.segment, t, false)
		await opts.commit(floor.id, walkable)
		clearSelection()
	}

	return { active, selected, preview, onMouseDown, selectInRect, clearSelection, deleteSelected, cancel }
}
