import type { FloorWalkable } from './walkable'
import type { NpcSpawnZone, ObjectData } from './objects'
import type { NpcSimulationConfig } from './npc'
import { MAX_GRID_COLUMNS, MAX_GRID_ROWS } from '../../limits'
import { isRecord, isValidColor } from './helpers'

export interface FloorData {
	id: string
	name: string
	label: string
	labelColor?: string
	objects: ObjectData[]
	defaultWalkable?: boolean
	walkable?: FloorWalkable
	spawnZones?: NpcSpawnZone[]

	allowedRoleIds?: string[]
}

export interface CanvasConfig {
	width: number
	height: number
	tileSize: number
	bgColor?: string
	labelColor?: string
	wallColor?: string
	gridColor?: string
	streetSidewalkColor?: string
	streetRoadColor?: string
	streetMarkingColor?: string
}

export interface CanvasFieldSpec {
	kind: 'number' | 'color' | 'int'
	required?: boolean
	min?: number
	max?: number
}

export const CANVAS_FIELD_SPECS = {
	width: { kind: 'number', required: true, min: 1, max: 100_000 },
	height: { kind: 'number', required: true, min: 1, max: 100_000 },
	tileSize: { kind: 'number', required: true, min: 1, max: 1_000 },
	bgColor: { kind: 'color' },
	labelColor: { kind: 'color' },
	wallColor: { kind: 'color' },
	gridColor: { kind: 'color' },
	streetSidewalkColor: { kind: 'color' },
	streetRoadColor: { kind: 'color' },
	streetMarkingColor: { kind: 'color' },
} as const satisfies Record<keyof CanvasConfig, CanvasFieldSpec>

export function canvasWithinGridCaps(canvas: { width: number; height: number; tileSize: number }): boolean {
	const tileSize = canvas.tileSize
	if (!Number.isFinite(tileSize) || tileSize <= 0) return false
	const cols = Math.ceil(canvas.width / tileSize)
	const rows = Math.ceil(canvas.height / tileSize)
	return cols <= MAX_GRID_COLUMNS && rows <= MAX_GRID_ROWS
}

export function parseCanvasConfig(raw: unknown, strict: boolean): CanvasConfig | null {
	if (!raw || typeof raw !== 'object') return null
	const rec = raw as Record<string, unknown>
	const out: Record<string, unknown> = {}
	for (const [key, spec] of Object.entries(CANVAS_FIELD_SPECS) as [string, CanvasFieldSpec][]) {
		const value = rec[key]
		if (value === undefined || value === null) {
			if (spec.required) return null
			continue
		}
		let ok = false
		if (spec.kind === 'number') ok = typeof value === 'number' && Number.isFinite(value) && (spec.min === undefined || value >= spec.min) && (spec.max === undefined || value <= spec.max)
		else if (spec.kind === 'color') ok = typeof value === 'string' && isValidColor(value)
		else if (spec.kind === 'int') ok = typeof value === 'number' && Number.isInteger(value) && (spec.min === undefined || value >= spec.min) && (spec.max === undefined || value <= spec.max)
		if (!ok) {
			if (strict) return null
			continue
		}
		out[key] = value
	}
	if (Object.keys(out).length === 0) return null
	const width = out.width
	const height = out.height
	const tileSize = out.tileSize
	if (typeof width === 'number' && typeof height === 'number' && typeof tileSize === 'number'
		&& !canvasWithinGridCaps({ width, height, tileSize })) return null
	return { ...out } as unknown as CanvasConfig
}

export interface FloorLayoutData {
	version: number
	canvas: CanvasConfig
	floors: FloorData[]
	streetWidthTiles?: number
	streetFloorId?: string
	npcConfig?: NpcSimulationConfig
	editorSettings?: EditorSettings
}

export interface EditorSettings {
	dragThresholdPx: number
	cycleThresholdPx: number
	boxSelectThresholdPx: number
	interactSpotRadiusPx: number
	lockIndicatorRadiusPx: number
	labelFontSizePx: number
	lockLabelFontSizePx: number
	interactSpotFontSizePx: number
	zoneLabelFontSizePx: number
	emptyStateFontSizePx: number
	rulerTickFontSizePx: number
	streetDashRatio: number
	streetGapRatio: number
	rulerMinPx: number
	rulerMaxPx: number
	rulerBasePx: number
	sidewalkTileRatio: number
	walkableGridMinTilePx: number
	walkableGridMaxTilePx: number
	walkableGridMaxWidthPx: number
	walkableGridMaxHeightPx: number
	npcDotSize: number
}

export interface EditorFieldSpec {
	kind: 'number'
	required?: boolean
	min?: number
	max?: number
}

export const EDITOR_FIELD_SPECS = {
	dragThresholdPx: { kind: 'number', min: 0.5, max: 50 },
	cycleThresholdPx: { kind: 'number', min: 1, max: 50 },
	boxSelectThresholdPx: { kind: 'number', min: 1, max: 50 },
	interactSpotRadiusPx: { kind: 'number', min: 1, max: 20 },
	lockIndicatorRadiusPx: { kind: 'number', min: 1, max: 20 },
	labelFontSizePx: { kind: 'number', min: 2, max: 32 },
	lockLabelFontSizePx: { kind: 'number', min: 1, max: 16 },
	interactSpotFontSizePx: { kind: 'number', min: 1, max: 16 },
	zoneLabelFontSizePx: { kind: 'number', min: 2, max: 24 },
	emptyStateFontSizePx: { kind: 'number', min: 4, max: 64 },
	rulerTickFontSizePx: { kind: 'number', min: 4, max: 32 },
	streetDashRatio: { kind: 'number', min: 0.1, max: 2 },
	streetGapRatio: { kind: 'number', min: 0.05, max: 2 },
	rulerMinPx: { kind: 'number', min: 4, max: 100 },
	rulerMaxPx: { kind: 'number', min: 10, max: 200 },
	rulerBasePx: { kind: 'number', min: 4, max: 100 },
	sidewalkTileRatio: { kind: 'number', min: 0.1, max: 0.5 },
	walkableGridMinTilePx: { kind: 'number', min: 4, max: 40 },
	walkableGridMaxTilePx: { kind: 'number', min: 10, max: 80 },
	walkableGridMaxWidthPx: { kind: 'number', min: 200, max: 2000 },
	walkableGridMaxHeightPx: { kind: 'number', min: 200, max: 2000 },
	npcDotSize: { kind: 'number', min: 2, max: 12 },
} as const satisfies Record<keyof EditorSettings, EditorFieldSpec>

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
	dragThresholdPx: 2,
	cycleThresholdPx: 6,
	boxSelectThresholdPx: 4,
	interactSpotRadiusPx: 4,
	lockIndicatorRadiusPx: 3,
	labelFontSizePx: 8,
	lockLabelFontSizePx: 4,
	interactSpotFontSizePx: 5,
	zoneLabelFontSizePx: 6,
	emptyStateFontSizePx: 16,
	rulerTickFontSizePx: 12,
	streetDashRatio: 0.4,
	streetGapRatio: 0.27,
	rulerMinPx: 16,
	rulerMaxPx: 32,
	rulerBasePx: 22,
	sidewalkTileRatio: 0.25,
	walkableGridMinTilePx: 14,
	walkableGridMaxTilePx: 40,
	walkableGridMaxWidthPx: 900,
	walkableGridMaxHeightPx: 560,
	npcDotSize: 4,
}

export function normalizeEditorSettings(value: unknown): EditorSettings {
	if (!isRecord(value)) return { ...DEFAULT_EDITOR_SETTINGS }
	const result = { ...DEFAULT_EDITOR_SETTINGS }
	for (const key of Object.keys(EDITOR_FIELD_SPECS) as (keyof EditorSettings)[]) {
		const spec = EDITOR_FIELD_SPECS[key]
		const raw = value[key]
		if (typeof raw !== 'number' || !Number.isFinite(raw)) continue
		if (spec.min !== undefined && raw < spec.min) continue
		if (spec.max !== undefined && raw > spec.max) continue
		result[key] = raw
	}
	return result
}


