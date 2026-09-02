import { ref, watch, nextTick, onMounted, type Ref } from 'vue'
import { renderSvgInto } from '../svgSanitizer'

export function useSvgPreview(
	svgSource: Ref<string>,
	svgEl: Ref<SVGSVGElement | null> = ref<SVGSVGElement | null>(null),
) {

	function render() {
		const el = svgEl.value
		const svg = svgSource.value
		if (el && svg) renderSvgInto(el, svg)
	}

	watch(svgSource, () => nextTick(render))
	onMounted(render)

	return { svgEl, render }
}
