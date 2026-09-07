import { onMounted, onUnmounted, watch, type ComputedRef, type Ref } from 'vue'
import type { NpcSimDot } from '../domain/types'

export interface ChatBubble {
	x: number
	y: number
	text: string
	dim: boolean
}

export type NpcMoodKind = 'patient' | 'stuck' | 'bored' | 'lost' | 'waiting' | 'detouring' | 'unknown' | null

export const NPC_MOOD_LEGEND: readonly { kind: Exclude<NpcMoodKind, null>; label: string; color: string }[] = [
	{ kind: 'stuck', label: 'Stuck (cross)', color: 'var(--accent-red)' },
	{ kind: 'patient', label: 'Patient', color: 'var(--accent-blue)' },
	{ kind: 'detouring', label: 'Detouring', color: 'var(--accent-blue)' },
	{ kind: 'waiting', label: 'Waiting', color: 'var(--accent-gold)' },
	{ kind: 'lost', label: 'Lost (dot)', color: 'var(--accent-gold)' },
	{ kind: 'bored', label: 'Bored', color: 'var(--text-secondary)' },
]

const ARRIVAL_TAG_TEXT = 'Just arrived'
const ARRIVAL_TAG_FONT = '10px system-ui, sans-serif'
const ARRIVAL_TAG_W = 68
const ARRIVAL_TAG_H = 14

export function resolveNpcMood(status: NpcSimDot['status'], reason: string | undefined): NpcMoodKind {
	if (status === 'queued') return 'patient'
	if (status !== 'waiting') return null
	if (reason === 'queued') return 'patient'
	switch (reason) {
		case 'no-path':
		case 'repath-failed':
			return 'stuck'
		case 'no-target':
		case 'no-wander':
			return 'bored'
		case 'no-floor':
		case 'wrong-floor':
			return 'lost'
		case 'portal-busy':
		case 'spot-busy':
		case 'reserve-raced':
			return 'waiting'
		case 'repath-blocked':
			return 'detouring'
		case 'queue-left':
		case 'yielded':
		case undefined:
			return null
		default:
			return 'unknown'
	}
}

export interface NpcOverlayDrawSources {
	frameDots: Map<string, NpcSimDot>
	waitReasons: ReadonlyMap<string, string>
	arrivalMarks: ReadonlyMap<string, number>
	floorId: () => string
	guides: Ref<boolean>
	svg: Ref<SVGSVGElement | null>
	canvas: Ref<HTMLCanvasElement | null>
	viewBox: ComputedRef<string>
	rulerSize: ComputedRef<number>
	chats: () => readonly ChatBubble[]
}

export function useNpcOverlayDraw(sources: NpcOverlayDrawSources) {
	let drawRaf: number | null = null
	let geoDirty = true
	const geo = { sLeft: 0, sTop: 0, sWidth: 0, sHeight: 0, a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, dpr: 1 }
	const themeColors = { accent: '#4cc9f0', guide: '#3a86ff', green: '#2ec4b6', gold: '#d29922', red: '#dc2626', secondary: '#6e7681' }
	let geoObserver: ResizeObserver | null = null

	function readThemeColors(): void {
		const style = getComputedStyle(document.documentElement)
		themeColors.accent = style.getPropertyValue('--accent-primary').trim() || '#4cc9f0'
		themeColors.guide = style.getPropertyValue('--accent-blue').trim() || '#3a86ff'
		themeColors.green = style.getPropertyValue('--accent-green').trim() || '#2ec4b6'
		themeColors.gold = style.getPropertyValue('--accent-gold').trim() || '#d29922'
		themeColors.red = style.getPropertyValue('--accent-red').trim() || '#dc2626'
		themeColors.secondary = style.getPropertyValue('--text-secondary').trim() || '#6e7681'
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
		const colGold = themeColors.gold
		const colRed = themeColors.red
		const colDim = themeColors.secondary
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
		const mood = resolveNpcMood(dot.status, sources.waitReasons.get(dot.id))
		if (dot.status === 'interacting' || dot.status === 'chatting') ctx.strokeStyle = colGreen
		else if (mood === 'stuck') ctx.strokeStyle = colRed
		else if (mood === 'lost' || mood === 'waiting') ctx.strokeStyle = colGold
		else if (mood === 'patient' || mood === 'detouring') ctx.strokeStyle = colGuide
		else if (mood === 'bored' || mood === 'unknown') ctx.strokeStyle = colDim
		else ctx.strokeStyle = colRing
		ctx.stroke()
		if (mood === 'stuck') {
			ctx.beginPath()
			ctx.moveTo(sx - 3, sy - 3)
			ctx.lineTo(sx + 3, sy + 3)
			ctx.moveTo(sx + 3, sy - 3)
			ctx.lineTo(sx - 3, sy + 3)
			ctx.stroke()
		} else if (mood === 'lost') {
			ctx.fillStyle = colGold
			ctx.beginPath()
			ctx.arc(sx, sy - 7, 2, 0, Math.PI * 2)
			ctx.fill()
		}
		}
		if (sources.arrivalMarks.size > 0) {
			ctx.font = ARRIVAL_TAG_FONT
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			for (const agentId of sources.arrivalMarks.keys()) {
				const dot = sources.frameDots.get(agentId)
				if (!dot || dot.floorId !== fid) continue
				const sx = geo.a * dot.x + geo.c * dot.y + geo.e - geo.sLeft
				const sy = geo.b * dot.x + geo.d * dot.y + geo.f - geo.sTop
				if (sx < -8 || sy < -8 || sx > vw + 8 || sy > vh + 8) continue
				const boxX = Math.max(4, Math.min(vw - ARRIVAL_TAG_W - 4, sx - ARRIVAL_TAG_W / 2))
				const boxY = Math.max(4, sy - 16 - ARRIVAL_TAG_H)
				ctx.fillStyle = 'rgba(20,24,32,0.92)'
				ctx.strokeStyle = colGreen
				ctx.lineWidth = 1
				ctx.beginPath()
				if (typeof ctx.roundRect === 'function') ctx.roundRect(boxX, boxY, ARRIVAL_TAG_W, ARRIVAL_TAG_H, 4)
				else ctx.rect(boxX, boxY, ARRIVAL_TAG_W, ARRIVAL_TAG_H)
				ctx.fill()
				ctx.stroke()
				ctx.fillStyle = '#ffffff'
				ctx.fillText(ARRIVAL_TAG_TEXT, boxX + ARRIVAL_TAG_W / 2, boxY + ARRIVAL_TAG_H / 2 + 0.5)
			}
			ctx.textAlign = 'start'
			ctx.textBaseline = 'alphabetic'
		}
		const chats = sources.chats()
		if (chats.length > 0) {
			ctx.font = '11px system-ui, sans-serif'
			const drawn: { x: number; y: number; w: number }[] = []
			for (const chat of chats) {
				const bx = geo.a * chat.x + geo.c * chat.y + geo.e - geo.sLeft
				const by = geo.b * chat.x + geo.d * chat.y + geo.f - geo.sTop
				let text = chat.text
				let boxWidth = ctx.measureText(text).width + 16
				const maxWidth = 220
				if (boxWidth > maxWidth) {
					while (text.length > 1 && ctx.measureText(text + '...').width + 16 > maxWidth) text = text.slice(0, -1)
					text += '...'
					boxWidth = ctx.measureText(text).width + 16
				}
				const boxHeight = 20
				let boxX = Math.max(4, Math.min(vw - boxWidth - 4, bx - boxWidth / 2))
				if (vw - boxWidth - 4 < 4) boxX = 4
				let boxY = by - 34
				let below = false
				if (boxY < 4) {
					boxY = by + 14
					below = true
				}
				const centerX = boxX + boxWidth / 2
				const centerY = boxY + boxHeight / 2
				if (drawn.some(other => Math.abs(other.x - centerX) < (other.w + boxWidth) / 2 - 8 && Math.abs(other.y - centerY) < 20)) continue
				drawn.push({ x: centerX, y: centerY, w: boxWidth })
				ctx.fillStyle = 'rgba(20,24,32,0.92)'
				ctx.strokeStyle = colAccent
				ctx.lineWidth = 1
				ctx.beginPath()
				if (typeof ctx.roundRect === 'function') ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6)
				else ctx.rect(boxX, boxY, boxWidth, boxHeight)
				ctx.fill()
				ctx.stroke()
				const tipX = Math.max(boxX + 6, Math.min(boxX + boxWidth - 6, bx))
				ctx.beginPath()
				if (below) {
					ctx.moveTo(tipX - 4, boxY)
					ctx.lineTo(tipX + 4, boxY)
					ctx.lineTo(bx, by)
				} else {
					ctx.moveTo(tipX - 4, boxY + boxHeight)
					ctx.lineTo(tipX + 4, boxY + boxHeight)
					ctx.lineTo(bx, by)
				}
				ctx.closePath()
				ctx.fill()
				ctx.fillStyle = chat.dim ? 'rgba(255,255,255,0.6)' : '#ffffff'
				ctx.fillText(text, boxX + 8, boxY + 14)
			}
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
