import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { TileBrush } from '../domain/types'

export interface TilePaintRect {
	row0: number
	col0: number
	row1: number
	col1: number
}

export interface TilePaintState {
	active: Ref<boolean>
	preview: ComputedRef<{ x: number; y: number; w: number; h: number; brush: TileBrush } | null>
	selection: ComputedRef<{ brush: TileBrush; rect: TilePaintRect } | null>
	onMouseDown: (e: MouseEvent) => void
	onMouseMove: (e: MouseEvent) => void
	onMouseUp: () => void
	clearSelection: () => void
	setSelection: (rect: TilePaintRect) => void
}

export function useCanvasTilePaint(
	opts: {
		brush: () => TileBrush | null
		localPoint: (e: MouseEvent) => { x: number; y: number } | null
		tileSize: () => number
		canvasWidth: () => number
		canvasHeight: () => number
		onCommit: (brush: TileBrush, rect: TilePaintRect) => void
	},
): TilePaintState {
	const active = ref(false)
	const startCell = ref<{ r: number; c: number } | null>(null)
	const currentCell = ref<{ r: number; c: number } | null>(null)
	const storedSelection = ref<{ brush: TileBrush; rect: TilePaintRect } | null>(null)

	function cellAt(p: { x: number; y: number }): { r: number; c: number } | null {
		const t = opts.tileSize()
		const c = Math.floor(p.x / t)
		const r = Math.floor(p.y / t)
		return { r, c }
	}

	function isInsideCanvas(p: { x: number; y: number }): boolean {
		return p.x >= 0 && p.x <= opts.canvasWidth() && p.y >= 0 && p.y <= opts.canvasHeight()
	}

	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0) return
		const brush = opts.brush()
		if (!brush) return
		const p = opts.localPoint(e)
		if (!p || !isInsideCanvas(p)) return
		active.value = true
		startCell.value = cellAt(p)
		currentCell.value = cellAt(p)
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
	}

	function onMouseMove(e: MouseEvent) {
		if (!active.value) return
		const p = opts.localPoint(e)
		if (!p) return
		currentCell.value = cellAt(p)
	}

	function onMouseUp() {
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		const brush = opts.brush()
		const start = startCell.value
		const current = currentCell.value
		active.value = false
		startCell.value = null
		currentCell.value = null
		if (!brush || !start) return
		const end = current ?? start
		const rect: TilePaintRect = {
			row0: Math.min(start.r, end.r),
			row1: Math.max(start.r, end.r),
			col0: Math.min(start.c, end.c),
			col1: Math.max(start.c, end.c),
		}
		opts.onCommit(brush, rect)
	}

	function rectPixels(rect: TilePaintRect): { x: number; y: number; w: number; h: number } {
		const t = opts.tileSize()
		return { x: rect.col0 * t, y: rect.row0 * t, w: (rect.col1 - rect.col0 + 1) * t, h: (rect.row1 - rect.row0 + 1) * t }
	}

	const selection = computed(() => {
		const stored = storedSelection.value
		if (!stored) return null
		return stored
	})

	const preview = computed(() => {
		const start = startCell.value
		const current = currentCell.value
		const brush = opts.brush()
		if (!start || !current || !brush) {
			const sel = selection.value
			return sel ? { ...rectPixels(sel.rect), brush: sel.brush } : null
		}
		const t = opts.tileSize()
		const c0 = Math.min(start.c, current.c)
		const c1 = Math.max(start.c, current.c)
		const r0 = Math.min(start.r, current.r)
		const r1 = Math.max(start.r, current.r)
		return { x: c0 * t, y: r0 * t, w: (c1 - c0 + 1) * t, h: (r1 - r0 + 1) * t, brush }
	})

	function clearSelection() {
		storedSelection.value = null
	}

	function setSelection(rect: TilePaintRect) {
		storedSelection.value = { brush: 'erase', rect }
	}

	return { active, preview, selection, onMouseDown, onMouseMove, onMouseUp, clearSelection, setSelection }
}