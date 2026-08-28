import type { EditorMode, EditorSettings } from '../types'
import { isValidColor, normalizeEditorSettings, EDITOR_FIELD_SPECS } from '../types'
import { state, clamp, assetMap } from './state'
import { normalizeObject } from '../geometry'
import { saveLayout } from './persistence'

export function setMode(mode: EditorMode) {
	state.mode = mode
	state.wallPaint = false
	state.selectionState = { primary: null, items: [] }
}

export function setWallPaint(on: boolean) {
	state.wallPaint = on
}

export async function resizeCanvas(width: number, height: number, tileSize: number): Promise<boolean> {
	const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
	const w = Math.max(t, Math.round(width / t) * t)
	const h = Math.max(t, Math.round(height / t) * t)
	state.layout.canvas = { ...state.layout.canvas, width: w, height: h, tileSize: t }
	for (const floor of state.layout.floors) {
		for (const o of floor.objects) {
			normalizeObject(o, state.layout.canvas.tileSize, assetMap())
			if (o.isWall) continue
			const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
			o.x = snapped.x
			o.y = snapped.y
			o.w = snapped.w
			o.h = snapped.h
		}
	}
	return saveLayout()
}

export async function setCanvasBgColor(bgColor: string | undefined): Promise<boolean> {
	if (bgColor !== undefined && !isValidColor(bgColor)) return false
	if (bgColor) state.layout.canvas.bgColor = bgColor
	else delete state.layout.canvas.bgColor
	return saveLayout()
}

export async function setCanvasLabelColor(labelColor: string | undefined): Promise<boolean> {
	if (labelColor !== undefined && !isValidColor(labelColor)) return false
	if (labelColor) state.layout.canvas.labelColor = labelColor
	else delete state.layout.canvas.labelColor
	return saveLayout()
}

export async function setWallColor(wallColor: string | undefined): Promise<boolean> {
	if (wallColor !== undefined && !isValidColor(wallColor)) return false
	if (wallColor) state.layout.canvas.wallColor = wallColor
	else delete state.layout.canvas.wallColor
	return saveLayout()
}

export async function setWallThickness(thickness: number | null): Promise<boolean> {
	if (thickness !== null && (!Number.isInteger(thickness) || thickness < 1 || thickness > 10)) return false
	if (thickness !== null) state.layout.canvas.wallThickness = thickness
	else delete state.layout.canvas.wallThickness
	return saveLayout()
}

export async function setStreetFloor(floorId: string | null): Promise<boolean> {
	if (floorId !== null && !state.layout.floors.some(f => f.id === floorId)) return false
	if (floorId) state.layout.streetFloorId = floorId
	else delete state.layout.streetFloorId
	return saveLayout()
}

export async function setStreetWidth(tiles: number | null): Promise<boolean> {
	if (tiles !== null && (!Number.isInteger(tiles) || tiles < 5 || tiles > 20)) return false
	if (tiles !== null) state.layout.streetWidthTiles = tiles
	else delete state.layout.streetWidthTiles
	return saveLayout()
}

export async function setEditorSettings(patch: Partial<EditorSettings>): Promise<boolean> {
	const current = normalizeEditorSettings(state.layout.editorSettings)
	const merged = { ...current, ...patch }
	for (const key of Object.keys(EDITOR_FIELD_SPECS) as (keyof EditorSettings)[]) {
		const spec = EDITOR_FIELD_SPECS[key]
		const v = merged[key]
		if (typeof v !== 'number' || !Number.isFinite(v)) return false
		if (spec.min !== undefined && v < spec.min) return false
		if (spec.max !== undefined && v > spec.max) return false
	}
	state.layout.editorSettings = merged
	return saveLayout()
}

export async function resetEditorSettings(): Promise<boolean> {
	delete state.layout.editorSettings
	return saveLayout()
}
