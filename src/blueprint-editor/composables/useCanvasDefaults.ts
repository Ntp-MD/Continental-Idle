import { computed } from 'vue'
import { normalizeEditorSettings } from '../types'
import { useAssetsStore } from '../blueprintStore'

export function useCanvasDefaults() {
	const { state } = useAssetsStore()
	const canvasTileSize = computed(() => Math.max(1, state.layout.canvas.tileSize))
	const editorSettings = computed(() => normalizeEditorSettings(state.layout.editorSettings))
	return { canvasTileSize, editorSettings }
}
