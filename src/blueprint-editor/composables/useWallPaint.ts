import { ref, type Ref, type ComputedRef } from 'vue'
import type { FloorData, WallSegment } from '../domain/types'
import { CANVAS_WALL_OBJECT_TYPE, normalizeWallSegment } from '../domain/types'
import { mirrorTileEdge, tileEdgeKey, type BorderSide } from '../domain/gridEditing'
import { wallSegmentToObjectRect } from '../assets/assetUtils'
import { genId } from '../blueprintStore'

export type { WallSegment }

export interface WallSelection {
	floorId: string
	objectId: string
	segment: WallSegment
	locked?: boolean
}

export interface WallEdge {
	col: number
	row: number
	side: BorderSide
}

interface WallStroke {
	mode: 'paint' | 'erase'
	touched: Set<string>
}

export interface WallPaintState {
	active: Ref<boolean>
	selected: Ref<WallSelection[]>
	onMouseDown: (e: MouseEvent) => boolean
	selectInRect: (rect: { x: number; y: number; w: number; h: number }) => void
	clearSelection: () => void
	deleteSelected: () => Promise<void>
	cancel: () => void
}

export function useWallPaint(opts: {
	disabled: () => boolean
	localPoint: (e: MouseEvent) => { x: number; y: number } | null
	tileSize: () => number
	canvasWidth: () => number
	canvasHeight: () => number
	floor: ComputedRef<FloorData | undefined>
	wallAtEdge?: (col: number, row: number, side: BorderSide) => WallSelection | null
	wallsInRect?: (rect: { x: number; y: number; w: number; h: number }) => WallSelection[]
	commit: () => Promise<void>
	remove: (floorId: string, objectIds: string[]) => Promise<void>
	idGenerator?: (prefix: string) => string
	selection?: Ref<WallSelection[]>
}): WallPaintState {
	const active = ref(false)
	const selected = opts.selection ?? ref<WallSelection[]>([])
	const makeId = opts.idGenerator ?? genId
	let stroke: WallStroke | null = null

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
			if (seen.has(wall.objectId)) return false
			seen.add(wall.objectId)
			return true
		})
		selected.value = walls.filter(wall => wall.floorId === floor.id)
	}

	function cancel() {
		stroke = null
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
	}

	function edgeAtPoint(point: { x: number; y: number }): WallEdge | null {
		const t = opts.tileSize()
		const col = Math.floor(point.x / t)
		const row = Math.floor(point.y / t)
		const cols = Math.floor(opts.canvasWidth() / t)
		const rows = Math.floor(opts.canvasHeight() / t)
		if (col < 0 || row < 0 || col >= cols || row >= rows) return null
		const left = point.x - col * t
		const top = point.y - row * t
		const right = (col + 1) * t - point.x
		const bottom = (row + 1) * t - point.y
		const nearest = Math.min(left, right, top, bottom)
		const side: BorderSide = nearest === top ? 'top' : nearest === bottom ? 'bottom' : nearest === left ? 'left' : 'right'
		return { col, row, side }
	}

	function edgeKey(edge: WallEdge): string {
		const mirror = mirrorTileEdge(edge.row, edge.col, edge.side)
		return tileEdgeKey(mirror.r, mirror.c, mirror.side)
	}

	function edgeSegment(edge: WallEdge): WallSegment | undefined {
		const { col, row, side } = edge
		if (side === 'top') return normalizeWallSegment({ x1: col, y1: row, x2: col + 1, y2: row })
		if (side === 'bottom') return normalizeWallSegment({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 })
		if (side === 'left') return normalizeWallSegment({ x1: col, y1: row, x2: col, y2: row + 1 })
		return normalizeWallSegment({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 })
	}

	function applyEdge(edge: WallEdge) {
		if (!stroke) return
		const key = edgeKey(edge)
		if (stroke.touched.has(key)) return
		stroke.touched.add(key)
		const floor = opts.floor.value
		if (!floor) return
		const existing = opts.wallAtEdge?.(edge.col, edge.row, edge.side) ?? null
		if (stroke.mode === 'erase') {
			if (!existing || existing.locked) return
			floor.objects = floor.objects.filter(object => object.id !== existing.objectId)
			return
		}
		if (existing) return
		const segment = edgeSegment(edge)
		if (!segment) return
		const rect = wallSegmentToObjectRect(segment, opts.tileSize())
		floor.objects.push({
			id: makeId('wall'),
			type: CANVAS_WALL_OBJECT_TYPE,
			x: rect.x,
			y: rect.y,
			w: rect.w,
			h: rect.h,
			rotation: 0,
			isWall: true,
			x1: segment.x1,
			y1: segment.y1,
			x2: segment.x2,
			y2: segment.y2,
		})
	}

	function onMouseDown(e: MouseEvent): boolean {
		if (e.button !== 0 || !active.value || opts.disabled()) return false
		const point = opts.localPoint(e)
		const floor = opts.floor.value
		if (!point || !floor) return false
		const edge = edgeAtPoint(point)
		if (!edge) return false
		const existing = opts.wallAtEdge?.(edge.col, edge.row, edge.side) ?? null
		if (existing?.locked) return false
		cancel()
		clearSelection()
		stroke = { mode: existing ? 'erase' : 'paint', touched: new Set() }
		applyEdge(edge)
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
		return true
	}

	function onMouseMove(e: MouseEvent) {
		if (!stroke) return
		const point = opts.localPoint(e)
		if (!point) return
		const edge = edgeAtPoint(point)
		if (!edge) return
		applyEdge(edge)
	}

	async function onMouseUp() {
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		const touched = stroke?.touched.size ?? 0
		stroke = null
		if (touched === 0) return
		await opts.commit()
	}

	async function deleteSelected() {
		const picked = selected.value
		const floor = opts.floor.value
		if (picked.length === 0 || !floor || picked.some(selection => selection.floorId !== floor.id)) {
			clearSelection()
			return
		}
		await opts.remove(floor.id, [...new Set(picked.map(selection => selection.objectId))])
		clearSelection()
	}

	return { active, selected, onMouseDown, selectInRect, clearSelection, deleteSelected, cancel }
}
