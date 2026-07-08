import { ref, type Ref } from 'vue'
import type { Rect } from '../types'

export interface WallPaintState {
  wallDrag: Ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number; valid: boolean } | null>
  onWallMouseMove: (e: MouseEvent) => void
  onWallMouseUp: () => Promise<void>
}

export function useWallPaintTool(
  opts: {
    localPoint: (e: MouseEvent) => { x: number; y: number }
    canPlaceRoom: (rect: Rect) => boolean
    addRoom: (rect: Rect) => Promise<unknown>
  },
): WallPaintState {
  const wallDrag = ref<{ startX: number; startY: number; x: number; y: number; w: number; h: number; valid: boolean } | null>(null)

  function onWallMouseMove(e: MouseEvent) {
    if (!wallDrag.value) return
    const p = opts.localPoint(e)
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
      await opts.addRoom({ x: wallDrag.value.x, y: wallDrag.value.y, w: wallDrag.value.w, h: wallDrag.value.h })
    }
    wallDrag.value = null
  }

  return {
    wallDrag,
    onWallMouseMove,
    onWallMouseUp,
  }
}
