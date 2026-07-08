import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { dragState, endAssetDrag, endRoomTemplateDrag } from '../assets-store'
import { findAssetCached } from '../assets-utils'
import type { FloorData } from '../types'

const ROOM_DEFAULT_FILL = '#e8e4dc'

export interface DragDropState {
  mousePos: Ref<{ x: number; y: number }>
  paletteValid: Ref<boolean>
  paletteGhost: ComputedRef<{ w: number; h: number; linkedParts?: { dx: number; dy: number; w: number; h: number }[] } | null>
  paletteGhostParts: ComputedRef<{ x: number; y: number; w: number; h: number }[] | null>
  paletteGhostRect: ComputedRef<{ x: number; y: number; w: number; h: number } | null>
  roomTemplateGhost: ComputedRef<{ w: number; h: number; fillColor: string } | null>
  roomTemplateGhostRect: ComputedRef<{ x: number; y: number; w: number; h: number; fillColor: string } | null>
  roomTemplateValid: Ref<boolean>
  onWindowMouseMoveForDrag: (e: MouseEvent) => void
  onWindowMouseUpForDrag: (e: MouseEvent) => void
  onRoomTemplateMouseMove: (e: MouseEvent) => void
  onRoomTemplateMouseUp: (e: MouseEvent) => void
}

export function useCanvasDragDrop(
  opts: {
    svgRef: Ref<SVGSVGElement | null>
    localPoint: (e: MouseEvent) => { x: number; y: number }
    canvasWidth: () => number
    canvasHeight: () => number
    floor: ComputedRef<FloorData | undefined>
    store: {
      state: { mode: string; layout: { roomTemplates?: { id: string; w: number; h: number; fillColor?: string }[] } }
      assetMap: () => Map<string, unknown>
      snap: (v: number) => number
      canPlaceObject: (type: string, x: number, y: number) => boolean
      canPlaceRoom: (rect: { x: number; y: number; w: number; h: number }) => boolean
      addObject: (type: string, x: number, y: number) => Promise<unknown>
      addRoomFromTemplate: (templateId: string, x: number, y: number) => Promise<unknown>
    }
    tileSize: () => number
  },
): DragDropState {
  const mousePos = ref({ x: -1000, y: -1000 })
  const paletteValid = ref(false)
  const roomTemplateValid = ref(false)

  const paletteGhost = computed(() => {
    if (!dragState.assetId) return null
    const asset = findAssetCached(opts.store.assetMap() as Map<string, any>, dragState.assetId)
    if (!asset) return null
    const t = opts.tileSize()
    const sa = asset.kind === 'simple' ? asset : undefined
    const aw = opts.store.snap(sa?.pxW ?? asset.w * t)
    const ah = opts.store.snap(sa?.pxH ?? asset.h * t)
    const linkedParts = asset.kind === 'linked' ? asset.linkedParts.map(p => ({ dx: p.dx, dy: p.dy, w: opts.store.snap(p.w), h: opts.store.snap(p.h) })) : undefined
    return { w: aw, h: ah, linkedParts }
  })

  const paletteGhostParts = computed(() => {
    const ghost = paletteGhost.value
    if (!ghost?.linkedParts || ghost.linkedParts.length === 0) return null
    const gx = opts.store.snap(mousePos.value.x - ghost.w / 2)
    const gy = opts.store.snap(mousePos.value.y - ghost.h / 2)
    const rects = ghost.linkedParts.map(p => ({
      x: opts.store.snap(gx + p.dx),
      y: opts.store.snap(gy + p.dy),
      w: p.w,
      h: p.h,
    }))
    const groupMaxX = Math.max(...rects.map(r => r.x + r.w))
    const groupMaxY = Math.max(...rects.map(r => r.y + r.h))
    const overflowX = Math.max(0, groupMaxX - opts.canvasWidth())
    const overflowY = Math.max(0, groupMaxY - opts.canvasHeight())
    if (overflowX > 0 || overflowY > 0) {
      for (const r of rects) {
        r.x -= overflowX
        r.y -= overflowY
      }
    }
    return rects
  })

  const paletteGhostRect = computed(() => {
    const ghost = paletteGhost.value
    if (!ghost) return null
    let x = opts.store.snap(mousePos.value.x - ghost.w / 2)
    let y = opts.store.snap(mousePos.value.y - ghost.h / 2)
    const overflowX = Math.max(0, x + ghost.w - opts.canvasWidth())
    const overflowY = Math.max(0, y + ghost.h - opts.canvasHeight())
    if (overflowX > 0) x -= overflowX
    if (overflowY > 0) y -= overflowY
    return { x, y, w: ghost.w, h: ghost.h }
  })

  const roomTemplateGhost = computed(() => {
    if (!dragState.roomTemplateId) return null
    const tpl = opts.store.state.layout.roomTemplates?.find(t => t.id === dragState.roomTemplateId)
    if (!tpl) return null
    return { w: tpl.w, h: tpl.h, fillColor: tpl.fillColor ?? ROOM_DEFAULT_FILL }
  })

  const roomTemplateGhostRect = computed(() => {
    const ghost = roomTemplateGhost.value
    if (!ghost) return null
    let x = opts.store.snap(mousePos.value.x - ghost.w / 2)
    let y = opts.store.snap(mousePos.value.y - ghost.h / 2)
    const overflowX = Math.max(0, x + ghost.w - opts.canvasWidth())
    const overflowY = Math.max(0, y + ghost.h - opts.canvasHeight())
    if (overflowX > 0) x -= overflowX
    if (overflowY > 0) y -= overflowY
    return { x, y, w: ghost.w, h: ghost.h, fillColor: ghost.fillColor }
  })

  function onWindowMouseMoveForDrag(e: MouseEvent) {
    if (!dragState.assetId || !opts.svgRef.value) return
    const p = opts.localPoint(e)
    mousePos.value = p
    const ghost = paletteGhost.value
    if (!ghost) return
    const x = p.x - ghost.w / 2
    const y = p.y - ghost.h / 2
    paletteValid.value = opts.store.canPlaceObject(dragState.assetId, x, y)
  }

  async function onWindowMouseUpForDrag(e: MouseEvent) {
    if (!dragState.assetId) return
    if (opts.store.state.mode === 'wall') {
      endAssetDrag()
      return
    }
    const assetId = dragState.assetId
    const svgEl = opts.svgRef.value
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect()
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
      const ghost = paletteGhost.value
      if (inside && ghost) {
        const p = opts.localPoint(e)
        await opts.store.addObject(assetId, p.x - ghost.w / 2, p.y - ghost.h / 2)
      }
    }
    endAssetDrag()
  }

  function onRoomTemplateMouseMove(e: MouseEvent) {
    if (!dragState.roomTemplateId || !opts.svgRef.value) return
    const p = opts.localPoint(e)
    mousePos.value = p
    const ghost = roomTemplateGhostRect.value
    if (ghost) {
      roomTemplateValid.value = opts.store.canPlaceRoom({ x: ghost.x, y: ghost.y, w: ghost.w, h: ghost.h })
    }
  }

  async function onRoomTemplateMouseUp(e: MouseEvent) {
    if (!dragState.roomTemplateId) return
    const templateId = dragState.roomTemplateId
    const svgEl = opts.svgRef.value
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect()
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
      const ghost = roomTemplateGhostRect.value
      if (inside && ghost && roomTemplateValid.value) {
        await opts.store.addRoomFromTemplate(templateId, ghost.x, ghost.y)
      }
    }
    endRoomTemplateDrag()
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

  watch(() => dragState.roomTemplateId, (id) => {
    if (id) {
      window.addEventListener('mousemove', onRoomTemplateMouseMove)
      window.addEventListener('mouseup', onRoomTemplateMouseUp)
    } else {
      window.removeEventListener('mousemove', onRoomTemplateMouseMove)
      window.removeEventListener('mouseup', onRoomTemplateMouseUp)
    }
  })

  return {
    mousePos,
    paletteValid,
    paletteGhost,
    paletteGhostParts,
    paletteGhostRect,
    roomTemplateGhost,
    roomTemplateGhostRect,
    roomTemplateValid,
    onWindowMouseMoveForDrag,
    onWindowMouseUpForDrag,
    onRoomTemplateMouseMove,
    onRoomTemplateMouseUp,
  }
}
