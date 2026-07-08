import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

export interface ViewportState {
  zoom: Ref<number>
  panX: Ref<number>
  panY: Ref<number>
  viewBox: ComputedRef<string>
  zoomPercent: ComputedRef<number>
  spaceDown: Ref<boolean>
  panning: Ref<{ startX: number; startY: number; panX: number; panY: number } | null>
  svgRef: Ref<SVGSVGElement | null>
  containerRef: Ref<HTMLElement | null>
  RULER_SIZE: number
  fitToScreen: () => void
  centerView: () => void
  zoomBy: (factor: number, cx?: number, cy?: number) => void
  onWheel: (e: WheelEvent) => void
  startPan: (e: MouseEvent) => void
  onPanMouseDown: (e: MouseEvent) => void
  onPanMouseMove: (e: MouseEvent) => void
  onPanMouseUp: () => void
  localPoint: (e: MouseEvent) => { x: number; y: number }
}

export function useCanvasViewport(
  canvasWidth: () => number,
  canvasHeight: () => number,
): ViewportState {
  const ZOOM_STORAGE_KEY = 'blueprint-zoom-state'
  function loadZoomState(): { zoom: number; panX: number; panY: number } {
    try {
      const raw = sessionStorage.getItem(ZOOM_STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return { zoom: 1, panX: 0, panY: 0 }
  }
  function saveZoomState(zoom: number, panX: number, panY: number) {
    try {
      sessionStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify({ zoom, panX, panY }))
    } catch { /* ignore */ }
  }

  const svgRef = ref<SVGSVGElement | null>(null)
  const containerRef = ref<HTMLElement | null>(null)

  const _initial = loadZoomState()
  const zoom = ref(_initial.zoom)
  const panX = ref(_initial.panX)
  const panY = ref(_initial.panY)
  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 8
  const RULER_SIZE = 22

  watch(zoom, v => saveZoomState(v, panX.value, panY.value))
  watch(panX, v => saveZoomState(zoom.value, v, panY.value))
  watch(panY, v => saveZoomState(zoom.value, panX.value, v))

  const viewBox = computed(() => {
    const w = canvasWidth() / zoom.value
    const h = canvasHeight() / zoom.value
    const cx = canvasWidth() / 2 + panX.value
    const cy = canvasHeight() / 2 + panY.value
    return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`
  })

  const zoomPercent = computed(() => Math.round(zoom.value * 100))

  function fitToScreen() {
    if (!containerRef.value) return
    const pad = 12 + RULER_SIZE
    const cw = containerRef.value.clientWidth - pad * 2
    const ch = containerRef.value.clientHeight - pad * 2
    const fitZoom = Math.min(cw / canvasWidth(), ch / canvasHeight())
    zoom.value = fitZoom
    panX.value = 0
    panY.value = 0
  }

  function centerView() {
    panX.value = 0
    panY.value = 0
  }

  function zoomBy(factor: number, cx?: number, cy?: number) {
    const oldZoom = zoom.value
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor))
    if (cx !== undefined && cy !== undefined) {
      const ratio = oldZoom / newZoom
      panX.value = (panX.value + cx) * ratio - cx
      panY.value = (panY.value + cy) * ratio - cy
    }
    zoom.value = newZoom
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const svg = svgRef.value
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const svgPt = pt.matrixTransform(ctm.inverse())
    const cx = svgPt.x - canvasWidth() / 2
    const cy = svgPt.y - canvasHeight() / 2
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    zoomBy(factor, cx, cy)
  }

  const spaceDown = ref(false)
  const panning = ref<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  function startPan(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    panning.value = { startX: e.clientX, startY: e.clientY, panX: panX.value, panY: panY.value }
    window.addEventListener('mousemove', onPanMouseMove)
    window.addEventListener('mouseup', onPanMouseUp)
  }

  function onPanMouseDown(e: MouseEvent) {
    if (spaceDown.value || e.button === 1) {
      startPan(e)
    }
  }

  function onPanMouseMove(e: MouseEvent) {
    if (!panning.value) return
    const dx = (e.clientX - panning.value.startX) / zoom.value
    const dy = (e.clientY - panning.value.startY) / zoom.value
    panX.value = panning.value.panX - dx
    panY.value = panning.value.panY - dy
  }

  function onPanMouseUp() {
    window.removeEventListener('mousemove', onPanMouseMove)
    window.removeEventListener('mouseup', onPanMouseUp)
    panning.value = null
  }

  function localPoint(e: MouseEvent): { x: number; y: number } {
    const svg = svgRef.value
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const svgPt = pt.matrixTransform(ctm.inverse())
    return { x: svgPt.x, y: svgPt.y }
  }

  return {
    zoom,
    panX,
    panY,
    viewBox,
    zoomPercent,
    spaceDown,
    panning,
    svgRef,
    containerRef,
    RULER_SIZE,
    fitToScreen,
    centerView,
    zoomBy,
    onWheel,
    startPan,
    onPanMouseDown,
    onPanMouseMove,
    onPanMouseUp,
    localPoint,
  }
}
