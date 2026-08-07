import { ref, type Ref } from 'vue'
import { useToast } from '@/composables/useToast'
import type { Rect } from '../types'
import type { EditorMode } from '../types'

export interface WallPaintState {
	wallDrag: Ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number; valid: boolean } | null>
	onWallMouseMove: (e: MouseEvent) => void
	onWallMouseUp: () => Promise<void>
}

export function useWallPaintTool(
	opts: {
		localPoint: (e: MouseEvent) => { x: number; y: number } | null
		canPlaceRoom: (rect: Rect) => boolean
		addWallObject: (rect: Rect) => Promise<unknown>
		getMode: () => EditorMode
	},
): WallPaintState {
	const wallDrag = ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number; valid: boolean } | null>(null)
	const toast = useToast()

	function onWallMouseMove(e: MouseEvent) {
		if (!wallDrag.value) return
		const p = opts.localPoint(e)
		if (!p) return
		const x = Math.min(p.x, wallDrag.value.startX)
		const y = Math.min(p.y, wallDrag.value.startY)
		const w = Math.abs(p.x - wallDrag.value.startX)
		const h = Math.abs(p.y - wallDrag.value.startY)
		const rect: Rect = { x, y, w, h }
		wallDrag.value.x = x
		wallDrag.value.y = y
		wallDrag.value.w = w
		wallDrag.value.h = h
		wallDrag.value.valid = opts.canPlaceRoom(rect)
	}

	async function onWallMouseUp() {
		window.removeEventListener('mousemove', onWallMouseMove)
		window.removeEventListener('mouseup', onWallMouseUp)
		if (wallDrag.value && wallDrag.value.valid && wallDrag.value.w > 0 && wallDrag.value.h > 0) {
			const rect = { x: wallDrag.value.x, y: wallDrag.value.y, w: wallDrag.value.w, h: wallDrag.value.h }
			try {
				await opts.addWallObject(rect)
			} catch (e: unknown) {
				toast.error(e instanceof Error ? e.message : 'Failed to draw shape')
				console.error('wall draw failed', e)
			}
		}
		wallDrag.value = null
	}

	return {
		wallDrag,
		onWallMouseMove,
		onWallMouseUp,
	}
}
