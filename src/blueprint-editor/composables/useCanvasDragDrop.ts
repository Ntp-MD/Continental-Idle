import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { dragState, endAssetDrag } from '../blueprintStore'
import { findAssetCached } from '../assetUtils'
import { buildingArea } from '../geometry'
import { useToast } from '@/composables/useToast'
import type { FloorData } from '../types'
import type { AssetsStore } from '../store/index'

export interface DragDropState {
	mousePos: Ref<{ x: number; y: number }>
	paletteValid: Ref<boolean>
	paletteGhost: ComputedRef<{ w: number; h: number } | null>
	paletteGhostParts: ComputedRef<null>
	paletteGhostRect: ComputedRef<{ x: number; y: number; w: number; h: number } | null>
	onWindowMouseMoveForDrag: (e: MouseEvent) => void
	onWindowMouseUpForDrag: (e: MouseEvent) => void
}

export function useCanvasDragDrop(
	opts: {
		svgRef: Ref<SVGSVGElement | null>
		localPoint: (e: MouseEvent) => { x: number; y: number } | null
		canvasWidth: () => number
		canvasHeight: () => number
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
		const t = opts.tileSize()
		const aw = opts.store.snap(asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t)
		const ah = opts.store.snap(asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t)
		return { w: aw, h: ah }
	})

	const paletteGhostParts = computed(() => null as null)

	const paletteGhostRect = computed(() => {
		const ghost = paletteGhost.value
		if (!ghost) return null
		const b = buildingArea(opts.canvasWidth(), opts.canvasHeight(), opts.tileSize())
		let x = opts.store.snap(mousePos.value.x - ghost.w / 2)
		let y = opts.store.snap(mousePos.value.y - ghost.h / 2)
		x -= Math.max(0, x + ghost.w - (b.x + b.w))
		y -= Math.max(0, y + ghost.h - (b.y + b.h))
		if (x < b.x) x = b.x
		if (y < b.y) y = b.y
		return { x, y, w: ghost.w, h: ghost.h }
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
		if (!opts.store.canPlaceObject(assetId, p.x - ghost.w / 2, p.y - ghost.h / 2)) return
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

	return { mousePos, paletteValid, paletteGhost, paletteGhostParts, paletteGhostRect, onWindowMouseMoveForDrag, onWindowMouseUpForDrag }
}
