import { computed, nextTick, ref, watch } from 'vue'
import type { AssetDef } from '../domain/types'
import { assetPreviewSvg, assetPreviewViewBox, assetSvgVarStyle } from '../assets/assetUtils'
import { useCanvasWallStyle, DOOR_COLOR } from './useCanvasWallStyle'
import { useSvgPreview } from './useSvgPreview'

export interface AssetPreviewSources {
	asset: () => AssetDef | undefined
	isActive?: () => boolean
}

export function useAssetPreview(sources: AssetPreviewSources) {
	const { canvasTileSize, wallColor, wallThickness } = useCanvasWallStyle()

	const viewBox = computed(() => {
		const asset = sources.asset()
		return asset ? assetPreviewViewBox(asset, canvasTileSize.value) : ''
	})
	const svg = computed(() => {
		const asset = sources.asset()
		return asset ? assetPreviewSvg(asset, canvasTileSize.value, wallColor.value, wallThickness.value, DOOR_COLOR) : ''
	})
	const vars = computed(() => assetSvgVarStyle(sources.asset()))

	const elRef = ref<SVGSVGElement | null>(null)
	const { render } = useSvgPreview(svg, elRef)

	function setEl(el: unknown): void {
		elRef.value = el as SVGSVGElement | null
	}

	if (sources.isActive) {
		watch(sources.isActive, (active) => {
			if (active) nextTick(render)
		})
	}

	return { viewBox, svg, vars, elRef, render, setEl }
}
