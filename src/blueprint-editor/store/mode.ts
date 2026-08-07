import type { EditorMode } from '../types'
import { state, snap, clamp, assetMap } from './state'
import { normalizeObject } from '../geometry'
import { saveLayout } from './persistence'

export function setMode(mode: EditorMode) {
	state.mode = mode
	state.selectionState = { primary: null, items: [] }
}

export async function resizeCanvas(width: number, height: number, tileSize: number): Promise<void> {
	const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
	const w = Math.max(t, Math.round(width / t) * t)
	const h = Math.max(t, Math.round(height / t) * t)
	state.layout.canvas = { width: w, height: h, tileSize: t }
	for (const asset of state.assetRegistry) {
		if (asset.linkedParts) {
			for (const p of asset.linkedParts) {
				p.dx = snap(Math.round(p.dx), t)
				p.dy = snap(Math.round(p.dy), t)
				p.w = snap(Math.round(p.w), t)
				p.h = snap(Math.round(p.h), t)
			}
		}
	}
	for (const floor of state.layout.floors) {
		for (const r of floor.rooms) {
			const snapped = clamp({ x: Math.round(r.x / t) * t, y: Math.round(r.y / t) * t, w: Math.round(r.w / t) * t || t, h: Math.round(r.h / t) * t || t })
			Object.assign(r, snapped)
		}
		for (const o of floor.objects) {
			normalizeObject(o, state.layout.canvas.tileSize, assetMap())
			const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
			o.x = snapped.x
			o.y = snapped.y
			o.w = snapped.w
			o.h = snapped.h
		}
	}
	await saveLayout()
}
