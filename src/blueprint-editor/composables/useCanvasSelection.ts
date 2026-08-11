import { ref, type Ref, type ComputedRef } from 'vue'
import type { Rect, ObjectData, FloorData, EditorMode } from '../types'
import type { AssetsStore } from '../store/index'
import { aabbOverlap } from '../collision'

export interface SelectionState {
	boxSelect: Ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number } | null>
	onCanvasMouseDown: (e: MouseEvent) => void
	onBoxSelectMouseMove: (e: MouseEvent) => void
	onBoxSelectMouseUp: () => void
}

export function useCanvasSelection(
	opts: {
		spaceDown: Ref<boolean>
		localPoint: (e: MouseEvent) => { x: number; y: number } | null
		canvasWidth: () => number
		canvasHeight: () => number
		startPan: (e: MouseEvent) => void
		floor: ComputedRef<FloorData | undefined>
		store: AssetsStore
		getMode: () => EditorMode
	},
): SelectionState {
	const BOX_SELECT_THRESHOLD = 4
	const boxSelect = ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number } | null>(null)

	function onCanvasMouseDown(e: MouseEvent) {
		if (e.button === 1) return
		if (opts.spaceDown.value) return
		const p = opts.localPoint(e)
		if (!p) return
		const inside = p.x >= 0 && p.x <= opts.canvasWidth() && p.y >= 0 && p.y <= opts.canvasHeight()
		if (!inside) {
			opts.startPan(e)
			return
		}
		const store = opts.store
		if (store.state.mode === 'move') {
			opts.startPan(e)
			return
		}
		if (store.state.mode === 'erase') {
			const obj = opts.floor.value?.objects.find(o =>
				!o.locked &&
				p.x >= o.x && p.x <= o.x + o.w &&
				p.y >= o.y && p.y <= o.y + o.h
			)
			if (obj) {
				store.select({ type: 'object', id: obj.id })
				store.deleteSelected().catch(() => { })
				return
			}
			return
		}
		store.select(null)
		store.selectAsset(null)
		boxSelect.value = { startX: p.x, startY: p.y, x: p.x, y: p.y, w: 0, h: 0 }
		window.addEventListener('mousemove', onBoxSelectMouseMove)
		window.addEventListener('mouseup', onBoxSelectMouseUp)
	}

	function onBoxSelectMouseMove(e: MouseEvent) {
		if (!boxSelect.value) return
		const p = opts.localPoint(e)
		if (!p) return
		const x = Math.min(p.x, boxSelect.value.startX)
		const y = Math.min(p.y, boxSelect.value.startY)
		const w = Math.abs(p.x - boxSelect.value.startX)
		const h = Math.abs(p.y - boxSelect.value.startY)
		boxSelect.value.x = x
		boxSelect.value.y = y
		boxSelect.value.w = w
		boxSelect.value.h = h
	}

	function onBoxSelectMouseUp() {
		window.removeEventListener('mousemove', onBoxSelectMouseMove)
		window.removeEventListener('mouseup', onBoxSelectMouseUp)
		if (boxSelect.value && boxSelect.value.w > BOX_SELECT_THRESHOLD && boxSelect.value.h > BOX_SELECT_THRESHOLD) {
			const rect: Rect = { x: boxSelect.value.x, y: boxSelect.value.y, w: boxSelect.value.w, h: boxSelect.value.h }
			const floor = opts.floor.value
			const objs: ObjectData[] = floor?.objects ?? []
			const hitIds = objs.filter(o => aabbOverlap(o, rect)).map(o => o.id)
			const store = opts.store
			if (hitIds.length === 1) {
				store.select({ type: 'object', id: hitIds[0] })
			} else if (hitIds.length > 1) {
				const items = hitIds.map(id => ({ type: 'object' as const, id }))
				store.state.selectionState = { primary: items[0], items }
			}
		}
		boxSelect.value = null
	}

	return {
		boxSelect,
		onCanvasMouseDown,
		onBoxSelectMouseMove,
		onBoxSelectMouseUp,
	}
}
