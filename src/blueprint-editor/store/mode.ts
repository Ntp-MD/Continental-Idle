import type { EditorMode, EditorSettings, Rect, TileBrush } from '../domain/types'
import { isValidColor, normalizeEditorSettings, EDITOR_FIELD_SPECS, rescaleFloorWalkable, canvasWithinGridCaps, resolveStreetTiles } from '../domain/types'
import type { BlueprintStore } from './state'
import { normalizeObject } from '../domain/geometry'
import { layoutHasContent } from './storeUtils'

export function createModeCommands(store: BlueprintStore) {
	const state = store.state
	const clamp = (rect: Rect) => store.clamp(rect)
	const assetMap = () => store.assetMap()
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)
	const saveBlueprintData = () => store.save()

	function setMode(mode: EditorMode) {
		state.mode = mode
		state.tileBrush = null
		state.selectionState = { primary: null, items: [] }
	}

	function setTileBrush(brush: TileBrush | null) {
		state.tileBrush = brush
		state.selectionState = { primary: null, items: [] }
	}

	async function resizeCanvas(width: number, height: number, tileSize: number): Promise<boolean> {
		return withStateLock(async () => {
			const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
			if (!Number.isFinite(t) || t <= 0) return false
			const w = Math.max(t, Math.round(width / t) * t)
			const h = Math.max(t, Math.round(height / t) * t)
			if (!canvasWithinGridCaps({ width: w, height: h, tileSize: t })) return false
			const changed = w !== state.layout.canvas.width || h !== state.layout.canvas.height || t !== state.layout.canvas.tileSize
			if (changed && layoutHasContent(state.layout)) return false
			state.layout.canvas = { ...state.layout.canvas, width: w, height: h, tileSize: t }
			const rows = Math.max(1, Math.ceil(h / t))
			const cols = Math.max(1, Math.ceil(w / t))
			for (const floor of state.layout.floors) {
				floor.walkable = rescaleFloorWalkable(floor.walkable, rows, cols)
				for (const o of floor.objects) {
					normalizeObject(o, state.layout.canvas.tileSize, assetMap())
					const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
					o.x = snapped.x
					o.y = snapped.y
					o.w = snapped.w
					o.h = snapped.h
				}
			}
			return saveBlueprintData()
		})
	}

	async function setCanvasBgColor(bgColor: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (bgColor !== undefined && !isValidColor(bgColor)) return false
			if (bgColor) state.layout.canvas.bgColor = bgColor
			else delete state.layout.canvas.bgColor
			return saveBlueprintData()
		})
	}

	async function setCanvasLabelColor(labelColor: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (labelColor !== undefined && !isValidColor(labelColor)) return false
			if (labelColor) state.layout.canvas.labelColor = labelColor
			else delete state.layout.canvas.labelColor
			return saveBlueprintData()
		})
	}

	async function setCanvasWallColor(wallColor: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (wallColor !== undefined && !isValidColor(wallColor)) return false
			if (wallColor) state.layout.canvas.wallColor = wallColor
			else delete state.layout.canvas.wallColor
			return saveBlueprintData()
		})
	}

	async function setCanvasGridColor(gridColor: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (gridColor !== undefined && !isValidColor(gridColor)) return false
			if (gridColor) state.layout.canvas.gridColor = gridColor
			else delete state.layout.canvas.gridColor
			return saveBlueprintData()
		})
	}

	async function setCanvasStreetSidewalkColor(color: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (color !== undefined && !isValidColor(color)) return false
			if (color) state.layout.canvas.streetSidewalkColor = color
			else delete state.layout.canvas.streetSidewalkColor
			return saveBlueprintData()
		})
	}

	async function setCanvasStreetRoadColor(color: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (color !== undefined && !isValidColor(color)) return false
			if (color) state.layout.canvas.streetRoadColor = color
			else delete state.layout.canvas.streetRoadColor
			return saveBlueprintData()
		})
	}

	async function setCanvasStreetMarkingColor(color: string | undefined): Promise<boolean> {
		return withStateLock(async () => {
			if (color !== undefined && !isValidColor(color)) return false
			if (color) state.layout.canvas.streetMarkingColor = color
			else delete state.layout.canvas.streetMarkingColor
			return saveBlueprintData()
		})
	}

	async function setStreetFloor(floorId: string | null): Promise<boolean> {
		return withStateLock(async () => {
			if (floorId !== null && !state.layout.floors.some(f => f.id === floorId)) return false
			if (floorId) state.layout.streetFloorId = floorId
			else delete state.layout.streetFloorId
			return saveBlueprintData()
		})
	}

	async function setStreetWidth(tiles: number | null): Promise<boolean> {
		return withStateLock(async () => {
			if (tiles !== null && (!Number.isInteger(tiles) || tiles < 5 || tiles > 20)) return false
			if (tiles !== null) state.layout.streetWidthTiles = tiles
			else delete state.layout.streetWidthTiles
			const tileSize = Math.max(1, Math.round(state.layout.canvas.tileSize))
			const cols = Math.max(1, Math.ceil(state.layout.canvas.width / tileSize))
			const rows = Math.max(1, Math.ceil(state.layout.canvas.height / tileSize))
			const street = resolveStreetTiles(state.layout)
			for (const floor of state.layout.floors) {
				const states = floor.walkable?.tileStates
				if (!states || states.length !== rows) continue
				for (let row = 0; row < rows; row++) {
					if (row >= (states[row]?.length ?? 0)) continue
					for (let col = 0; col < states[row].length; col++) {
						if (row < street || row >= rows - street || col < street || col >= cols - street) {
							states[row][col] = 'walkable'
						}
					}
				}
				const grid = floor.walkable?.walkableGrid
				if (grid?.length === rows && grid.every((grow, index) => grow.length === states[index]?.length)) {
					for (let row = 0; row < rows; row++) {
						for (let col = 0; col < grid[row].length; col++) {
							if (row < street || row >= rows - street || col < street || col >= cols - street) {
								grid[row][col] = true
							}
						}
					}
				}
			}
			return saveBlueprintData()
		})
	}

	async function setEditorSettings(patch: Partial<EditorSettings>): Promise<boolean> {
		return withStateLock(async () => {
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
			return saveBlueprintData()
		})
	}

	async function resetEditorSettings(): Promise<boolean> {
		return withStateLock(async () => {
			delete state.layout.editorSettings
			return saveBlueprintData()
		})
	}

	return {
		setMode, setTileBrush, resizeCanvas, setCanvasBgColor, setCanvasLabelColor,
		setCanvasWallColor, setCanvasGridColor, setCanvasStreetSidewalkColor,
		setCanvasStreetRoadColor, setCanvasStreetMarkingColor, setStreetFloor,
		setStreetWidth, setEditorSettings, resetEditorSettings,
	}
}

export type ModeCommands = ReturnType<typeof createModeCommands>