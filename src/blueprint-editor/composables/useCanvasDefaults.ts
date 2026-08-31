import { computed } from 'vue'
import { normalizeEditorSettings } from '../types'
import { state } from '../store/state'

export function useCanvasDefaults() {
  const canvasTileSize = computed(() => Math.max(1, state.layout.canvas.tileSize))
  const editorSettings = computed(() => normalizeEditorSettings(state.layout.editorSettings))
  return { canvasTileSize, editorSettings }
}
