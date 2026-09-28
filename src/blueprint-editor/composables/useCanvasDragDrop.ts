import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { dragState, endAssetDrag } from '../blueprintStore'
import { findAssetCached } from '../assets/assetUtils'
import { assetPixelSize } from '../domain/types'
import { useToast } from '@/composables/useToast'
import type { FloorData } from '../domain/types'
import type { AssetsStore } from '../store/index'

export interface DragDropState {
	mousePos: Ref<{ x: number; y: number }>
	paletteValid: Ref<boolean>
	paletteGhost: ComputedRef<{ w: number; h: number } | null>
	paletteGhostRect: ComputedRef<{ x: number; y: number; w: number; h: number } | null>
	onWindowMouseMoveForDrag: (e: MouseEvent) => void
	onWindowMouseUpForDrag: (e: MouseEvent) => void
}

export function useCanvasDragDrop(
	opts: {
		svgRef: Ref<SVGSVGElement | null>
		localPoint: (e: MouseEvent) => { x: number; y: number } | null
		floor: ComputedRef<FloorData | undefined>
		store: AssetsStore
		tileSize: () => number
	},
): DragDropState {	const mousePos = ref({ x: -1000, y: -1000 })
	const paletteValid = ref(false)
	const toast = useToast()

	const paletteGhost = computed(() => {
		if (!dragState.assetId) return null
		const asset = findAssetCached(opts.store.assetMap(), dragState.assetId)
		if (!asset) return null
		return assetPixelSize(asset, opts.tileSize())
	})

	// Resolved through the same `placementRect` the drop uses, so the preview is exactly the
	// rect that gets gated - an inline clamp here would never shrink an oversized asset the
	// way `store.clamp` does, and the ghost would promise a spot the object does not take.
	const paletteGhostRect = computed(() => {
		const ghost = paletteGhost.value
		if (!ghost || !dragState.assetId) return null
		return opts.store.placementRect(dragState.assetId, mousePos.value.x - ghost.w / 2, mousePos.value.y - ghost.h / 2)
	})

	function onWindowMouseMoveForDrag(e: MouseEvent) {
		if (!dragState.assetId || !opts.svgRef.value) return
		const p = opts.localPoint(e)
		if (!p) return
		mousePos.value = p
		const ghost = paletteGhost.value
		if (ghost) paletteValid.value = opts.store.canPlaceObject(dragState.assetId, p.x - ghost.w / 2, p.y - ghost.h / 2)
	}

	function onWindowMouseUpForDrag(e: MouseEvent): void {
		if (!dragState.assetId) return
		const assetId = dragState.assetId
		const svgEl = opts.svgRef.value
		const ghost = paletteGhost.value
		endAssetDrag()
		if (!svgEl || !ghost) return
		const rect = svgEl.getBoundingClientRect()
		const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
		if (!inside) return
		const p = opts.localPoint(e)
		if (!p) return
		// No pre-check here: `addObject` runs the same gate and owns the refusal toast, so an
		// early return would swallow the only feedback the drop gives.
		opts.store.addObject(assetId, p.x - ghost.w / 2, p.y - ghost.h / 2).catch((err: unknown) => {
			toast.error(err instanceof Error ? err.message : 'Failed to place object')
		})
	}

	watch(() => dragState.assetId, (id) => {
		if (id) {
			window.addEventListener('mousemove', onWindowMouseMoveForDrag)
			window.addEventListener('mouseup', onWindowMouseUpForDrag)
		} else {
			window.removeEventListener('mousemove', onWindowMouseMoveForDrag)
			window.removeEventListener('mouseup', onWindowMouseUpForDrag)
		}
	})

	onUnmounted(() => {
		window.removeEventListener('mousemove', onWindowMouseMoveForDrag)
		window.removeEventListener('mouseup', onWindowMouseUpForDrag)
	})

	return { mousePos, paletteValid, paletteGhost, paletteGhostRect, onWindowMouseMoveForDrag, onWindowMouseUpForDrag }
}
