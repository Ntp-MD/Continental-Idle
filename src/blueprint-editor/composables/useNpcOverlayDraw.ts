import { onMounted, onUnmounted, watch, type ComputedRef, type Ref } from 'vue'
import type { NpcSimDot } from '../domain/types'

export interface NpcOverlayDrawSources {
	frameDots: Map<string, NpcSimDot>
	floorId: () => string
	guides: Ref<boolean>
	svg: Ref<SVGSVGElement | null>
	canvas: Ref<HTMLCanvasElement | null>
	viewBox: ComputedRef<string>
	rulerSize: ComputedRef<number>
}

export function useNpcOverlayDraw(sources: NpcOverlayDrawSources) {
	let drawRaf: number | null = null
	let geoDirty = true
	const geo = { sLeft: 0, sTop: 0, sWidth: 0, sHeight: 0, a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, dpr: 1 }
	const themeColors = { accent: '#4cc9f0', guide: '#3a86ff', green: '#2ec4b6' }
	let geoObserver: ResizeObserver | null = null

	function readThemeColors(): void {
		const style = getComputedStyle(document.documentElement)
		themeColors.accent = style.getPropertyValue('--accent-primary').trim() || '#4cc9f0'
		themeColors.guide = style.getPropertyValue('--accent-blue').trim() || '#3a86ff'
		themeColors.green = style.getPropertyValue('--accent-green').trim() || '#2ec4b6'
	}

	function syncGeometry(): boolean {
		const canvas = sources.canvas.value
		const svg = sources.svg.value
		if (!canvas || !svg) return false
		const sRect = svg.getBoundingClientRect()
		const host = canvas.parentElement
		if (!host) return false
		const hRect = host.getBoundingClientRect()
		geo.sLeft = sRect.left
		geo.sTop = sRect.top
		geo.sWidth = sRect.width
		geo.sHeight = sRect.height
		canvas.style.left = `${sRect.left - hRect.left}px`
		canvas.style.top = `${sRect.top - hRect.top}px`
		canvas.style.width = `${sRect.width}px`
		canvas.style.height = `${sRect.height}px`
		const dpr = window.devicePixelRatio || 1
		geo.dpr = dpr
		const targetW = Math.round(sRect.width * dpr)
		const targetH = Math.round(sRect.height * dpr)
		if (canvas.width !== targetW || canvas.height !== targetH) {
			canvas.width = targetW
			canvas.height = targetH
		}
		const ctm = svg.getScreenCTM()
		if (!ctm) return false
		geo.a = ctm.a
		geo.b = ctm.b
		geo.c = ctm.c
		geo.d = ctm.d
		geo.e = ctm.e
		geo.f = ctm.f
		geoDirty = false
		return true
	}

	function markDirty(): void {
		geoDirty = true
	}

	function markDirtyWhenActive(): void {
		if (drawRaf !== null) geoDirty = true
	}

	function onScroll(): void {
		markDirtyWhenActive()
	}

	function drawFrame(): void {
		drawRaf = requestAnimationFrame(drawFrame)
		const canvas = sources.canvas.value
		const svg = sources.svg.value
		if (!canvas || !svg) return
		if (geoDirty && !syncGeometry()) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		const dpr = geo.dpr
		const vw = geo.sWidth
		const vh = geo.sHeight
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		ctx.clearRect(0, 0, vw, vh)
		const colAccent = themeColors.accent
		const colGuide = themeColors.guide
		const colGreen = themeColors.green
		const colRing = 'rgba(255,255,255,0.8)'
		const fid = sources.floorId()
		for (const dot of sources.frameDots.values()) {
			if (dot.floorId !== fid) continue
			const sx = geo.a * dot.x + geo.c * dot.y + geo.e - geo.sLeft
			const sy = geo.b * dot.x + geo.d * dot.y + geo.f - geo.sTop
			if (sx < -8 || sy < -8 || sx > vw + 8 || sy > vh + 8) continue
			if (sources.guides.value && dot.status === 'walking') {
				if (dot.path.length > 1) {
					ctx.beginPath()
					ctx.setLineDash([4, 3])
					ctx.moveTo(sx, sy)
					for (let i = dot.pathIdx; i < dot.path.length; i++) {
						ctx.lineTo(
							geo.a * dot.path[i][0] + geo.c * dot.path[i][1] + geo.e - geo.sLeft,
							geo.b * dot.path[i][0] + geo.d * dot.path[i][1] + geo.f - geo.sTop,
						)
					}
					ctx.strokeStyle = colGuide
					ctx.lineWidth = 1
					ctx.globalAlpha = 0.7
					ctx.stroke()
					ctx.setLineDash([])
					ctx.globalAlpha = 1
				}
				const tx = geo.a * dot.targetX + geo.c * dot.targetY + geo.e - geo.sLeft
				const ty = geo.b * dot.targetX + geo.d * dot.targetY + geo.f - geo.sTop
				ctx.strokeStyle = colAccent
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(tx - 3, ty)
				ctx.lineTo(tx + 3, ty)
				ctx.moveTo(tx, ty - 3)
				ctx.lineTo(tx, ty + 3)
				ctx.stroke()
			}
			ctx.beginPath()
			ctx.arc(sx, sy, 4, 0, Math.PI * 2)
			ctx.fillStyle = dot.color
			ctx.fill()
			ctx.lineWidth = 1
			ctx.strokeStyle = dot.status === 'interacting' ? colGreen : colRing
			ctx.stroke()
		}
	}

	function startNpcDraw(): void {
		readThemeColors()
		markDirty()
		window.addEventListener('scroll', onScroll, { passive: true })
		if (drawRaf === null) drawRaf = requestAnimationFrame(drawFrame)
	}

	function stopNpcDraw(): void {
		if (drawRaf !== null) {
			cancelAnimationFrame(drawRaf)
			drawRaf = null
		}
		window.removeEventListener('scroll', onScroll)
		const canvas = sources.canvas.value
		const ctx = canvas?.getContext('2d')
		if (canvas && ctx) {
			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.clearRect(0, 0, canvas.width, canvas.height)
		}
	}

	watch([sources.viewBox, sources.rulerSize], markDirtyWhenActive, { flush: 'post' })

	onMounted(() => {
		const host = sources.canvas.value?.parentElement ?? null
		if (host) {
			geoObserver = new ResizeObserver(markDirtyWhenActive)
			geoObserver.observe(host)
		}
	})

	onUnmounted(() => {
		stopNpcDraw()
		geoObserver?.disconnect()
		geoObserver = null
	})

	return { startNpcDraw, stopNpcDraw }
}
