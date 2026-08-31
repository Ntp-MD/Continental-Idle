import { computed } from 'vue'
import { state } from '../store/state'
import { useCanvasDefaults } from './useCanvasDefaults'

export const DEFAULT_WALL_COLOR = 'var(--accent-green)'
export const DOOR_COLOR = 'var(--accent-blue)'

export function useCanvasWallStyle() {
  const { canvasTileSize, editorSettings } = useCanvasDefaults()
  const wallColor = computed(() => state.layout.canvas.wallColor || DEFAULT_WALL_COLOR)
  const wallThickness = computed(() =>
    state.layout.canvas.wallThickness ?? Math.max(2, Math.round(canvasTileSize.value * editorSettings.value.wallThicknessRatio)),
  )
  return { wallColor, wallThickness, canvasTileSize, editorSettings }
}
