import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FloorData, WallSegment, ObjectData } from '../types'
import { CANVAS_WALL_OBJECT_TYPE, normalizeWallSegment } from '../types'
import { wallSegmentToObjectRect } from '../assetUtils'
import { genId } from '../store/storeUtils'

export type { WallSegment }

export interface WallSelection {
	floorId: string
	objectId: string
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

export function useWallPaint(opts: {
	disabled: () => boolean
	localPoint: (e: MouseEvent) => { x: number; y: number } | null
	tileSize: () => number
	canvasWidth: () => number
	canvasHeight: () => number
	floor: ComputedRef<FloorData | undefined>
	wallAtPoint?: (point: { x: number; y: number }) => WallSelection | null
	wallsInRect?: (rect: { x: number; y: number; w: number; h: number }) => WallSelection[]
	commit: (floorId: string, wall: ObjectData) => Promise<void>
	remove: (floorId: string, objectIds: string[]) => Promise<void>
	idGenerator?: (prefix: string) => string
	selection?: Ref<WallSelection[]>
}): WallPaintState {
	const active = ref(false)
	const selected = opts.selection ?? ref<WallSelection[]>([])
	const makeId = opts.idGenerator ?? genId
	const segment = ref<WallSegment | null>(null)
	let start: { x: number; y: number; floorId: string } | null = null

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
			if (seen.has(wall.objectId)) return false
			seen.add(wall.objectId)
			return true
		})
		selected.value = walls.filter(wall => wall.floorId === floor.id)
	}

	function cancel() {
		segment.value = null
		start = null
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
	}

	function onMouseDown(e: MouseEvent): boolean {
		if (e.button !== 0 || !active.value || opts.disabled()) return false
		const point = opts.localPoint(e)
		const floor = opts.floor.value
		if (!point || !floor) return false
		cancel()
		clearSelection()
		start = { x: point.x, y: point.y, floorId: floor.id }
		segment.value = { x1: point.x, y1: point.y, x2: point.x, y2: point.y }
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
		return true
	}

	function onMouseMove(e: MouseEvent) {
		if (!start) return
		const point = opts.localPoint(e)
		if (!point) return
		const t = opts.tileSize()
		const dx = Math.abs(point.x - start.x)
		const dy = Math.abs(point.y - start.y)
		if (dx >= dy) {
			segment.value = { x1: snap(start.x, t), y1: snap(start.y, t), x2: snap(point.x, t), y2: snap(start.y, t) }
		} else {
			segment.value = { x1: snap(start.x, t), y1: snap(start.y, t), x2: snap(start.x, t), y2: snap(point.y, t) }
		}
	}

	async function onMouseUp() {
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		const raw = segment.value
		const current = start
		segment.value = null
		start = null
		if (!raw || !current || !opts.floor.value) return
		const t = opts.tileSize()
		const source = raw.x1 === raw.x2 && raw.y1 === raw.y2
			? { x1: snap(raw.x1, t), y1: snap(raw.y1, t), x2: snap(raw.x1, t) + t, y2: snap(raw.y1, t) }
			: raw
		const normalized = normalizeWallSegment({ x1: source.x1 / t, y1: source.y1 / t, x2: source.x2 / t, y2: source.y2 / t })
		if (!normalized) return
		const rect = wallSegmentToObjectRect(normalized, t)
		await opts.commit(current.floorId, {
			id: makeId('wall'),
			type: CANVAS_WALL_OBJECT_TYPE,
			x: rect.x,
			y: rect.y,
			w: rect.w,
			h: rect.h,
			rotation: 0,
			isWall: true,
			x1: normalized.x1,
			y1: normalized.y1,
			x2: normalized.x2,
			y2: normalized.y2,
		})
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

	return { active, selected, preview, onMouseDown, selectInRect, clearSelection, deleteSelected, cancel }
}
