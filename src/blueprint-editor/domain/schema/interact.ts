import type { AssetDef } from './assets'
import type { Rotation } from './primitives'
import { type TileState, normalizeTileStates, normalizeWalkableGrid, tileStatesToWalkableGrid } from './walkable'
import { MAX_ASSET_DIMENSION, MAX_INTERACT_SPOTS, MAX_PIXEL_DIMENSION, isFiniteNumber, isRecord, normalizeTag } from './helpers'

export type InteractSpotEdge = 'N' | 'S' | 'E' | 'W'

export interface StandInteractSpot {
	kind?: 'stand'
	x: number
	y: number
	post?: string
}

export interface EdgeInteractSpot {
	kind?: 'edge'
	edge: InteractSpotEdge
	offset: number
	x: number
	y: number
	post?: string
}

export type InteractSpot = StandInteractSpot | EdgeInteractSpot

export interface InteractConfig {
	capacity?: number

	durationMin?: number

	durationMax?: number
}

export interface NpcQueueConfig {
	maxMembers?: number
	admissionDepth?: number
}

export function normalizeNpcQueueConfig(value: unknown): NpcQueueConfig | undefined {
	if (!isRecord(value)) return undefined
	const record = value
	const maxMembers = typeof record.maxMembers === 'number' && Number.isFinite(record.maxMembers)
		? Math.max(1, Math.min(100, Math.floor(record.maxMembers)))
		: undefined
	const admissionDepth = typeof record.admissionDepth === 'number' && Number.isFinite(record.admissionDepth)
		? Math.max(1, Math.min(20, Math.floor(record.admissionDepth)))
		: undefined
	if (maxMembers === undefined && admissionDepth === undefined) return undefined
	return { ...(maxMembers === undefined ? {} : { maxMembers }), ...(admissionDepth === undefined ? {} : { admissionDepth }) }
}

function isInteractSpotEdge(value: unknown): value is InteractSpotEdge {
	return value === 'N' || value === 'S' || value === 'E' || value === 'W'
}

export function normalizeInteractSpots(value: unknown): InteractSpot[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_INTERACT_SPOTS) return undefined
	const seen = new Set<string>()
	const points: InteractSpot[] = []
	for (const point of value) {
		let item: Record<string, unknown> | undefined
		if (Array.isArray(point) && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number') {
			item = { x: point[0], y: point[1] }
		} else if (point && typeof point === 'object') {
			item = point as Record<string, unknown>
		}
		if (!item) continue
		const post = normalizeTag(item.post)
		if (item.kind === 'edge' || (item.kind !== 'stand' && item.edge !== undefined && item.offset !== undefined)) {
			const rawEdge = typeof item.edge === 'string' ? item.edge.toUpperCase() : undefined
			if (!isInteractSpotEdge(rawEdge)) continue
			if (typeof item.offset !== 'number' || !Number.isFinite(item.offset) || item.offset < 0 || item.offset > MAX_PIXEL_DIMENSION) continue
			if (typeof item.x !== 'number' || typeof item.y !== 'number' || !Number.isFinite(item.x) || !Number.isFinite(item.y) || Math.abs(item.x) > MAX_PIXEL_DIMENSION || Math.abs(item.y) > MAX_PIXEL_DIMENSION) continue
			const key = `edge:${rawEdge}:${item.offset}:${post ?? ''}:${item.x},${item.y}`
			if (seen.has(key)) continue
			seen.add(key)
			points.push({ kind: 'edge', edge: rawEdge, offset: item.offset, x: item.x, y: item.y, ...(post ? { post } : {}) })
			continue
		}
		if (typeof item.x !== 'number' || typeof item.y !== 'number') continue
		const x = item.x
		const y = item.y
		if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > MAX_PIXEL_DIMENSION || Math.abs(y) > MAX_PIXEL_DIMENSION) continue
		const key = `stand:${x},${y}:${post ?? ''}`
		if (seen.has(key)) continue
		seen.add(key)
		points.push({ kind: 'stand', x, y, ...(post ? { post } : {}) })
	}
	return points.length > 0 ? points : undefined
}


export function normalizeInteractConfig(value: unknown): InteractConfig | undefined {
	if (!isRecord(value)) return undefined
	const rec = value
	const result: InteractConfig = {}
	if (typeof rec.capacity === 'number' && Number.isFinite(rec.capacity) && rec.capacity > 0) {
		result.capacity = Math.min(1000, Math.floor(rec.capacity))
	}
	const rawMin = typeof rec.durationMin === 'number' && Number.isFinite(rec.durationMin) ? Math.min(86_400, Math.max(0, rec.durationMin)) : undefined
	const rawMax = typeof rec.durationMax === 'number' && Number.isFinite(rec.durationMax) ? Math.min(86_400, Math.max(0, rec.durationMax)) : undefined
	const durationMin = rawMin ?? 1
	const durationMax = rawMax === undefined ? (rawMin === undefined ? 3 : rawMin) : Math.max(durationMin, rawMax)
	result.durationMin = durationMin
	result.durationMax = durationMax
	return result
}


export interface CornerRx {
	tl: number
	tr: number
	br: number
	bl: number
}

export function normalizeCornerRx(value: unknown): CornerRx | undefined {
	if (!isRecord(value)) return undefined
	const rec = value
	const clampRadius = (item: unknown): number => isFiniteNumber(item) ? Math.min(MAX_ASSET_DIMENSION, Math.max(0, item)) : 0
	const tl = clampRadius(rec.tl)
	const tr = clampRadius(rec.tr)
	const br = clampRadius(rec.br)
	const bl = clampRadius(rec.bl)
	if (tl === 0 && tr === 0 && br === 0 && bl === 0) return undefined
	return { tl, tr, br, bl }
}


export function resolveInteractForTarget(
	interact: InteractConfig | undefined,
	interactSpotCount: number,
): { capacity: number; durationMinSeconds: number; durationMaxSeconds: number } {
	const durationMinSeconds = typeof interact?.durationMin === 'number' && Number.isFinite(interact.durationMin)
		? Math.max(0, interact.durationMin)
		: 1
	const durationMaxSeconds = typeof interact?.durationMax === 'number' && Number.isFinite(interact.durationMax)
		? Math.max(durationMinSeconds, interact.durationMax)
		: Math.max(durationMinSeconds, 3)
	const capacity = typeof interact?.capacity === 'number' && interact.capacity > 0
		? Math.floor(interact.capacity)
		: Math.max(1, interactSpotCount)
	return { capacity, durationMinSeconds, durationMaxSeconds }
}


export function resolveQueueForTarget(
	queue: NpcQueueConfig | undefined,
): { maxMembers: number; admissionDepth: number } {
	const maxMembers = typeof queue?.maxMembers === 'number' && Number.isFinite(queue.maxMembers)
		? Math.max(1, Math.min(100, Math.floor(queue.maxMembers)))
		: 3
	const admissionDepth = typeof queue?.admissionDepth === 'number' && Number.isFinite(queue.admissionDepth)
		? Math.max(1, Math.min(20, Math.floor(queue.admissionDepth)))
		: 4
	return { maxMembers, admissionDepth }
}


export function rotateGrid90<T>(grid: T[][] | undefined, times: number): T[][] | undefined {
	if (!grid || grid.length === 0) return grid
	const n = ((times % 4) + 4) % 4
	if (n === 0) return grid
	let result = grid
	for (let i = 0; i < n; i++) {
		const rows = result.length
		const cols = result[0]?.length ?? 0
		const rotated: T[][] = []
		for (let r = 0; r < cols; r++) {
			rotated[r] = []
			for (let c = 0; c < rows; c++) {
				rotated[r][c] = result[rows - 1 - c][r]
			}
		}
		result = rotated
	}
	return result
}


export interface ResolvedObjectDef {
	walkable: boolean
	doorRequired: boolean
	walkableGrid?: boolean[][]
	tileStates?: TileState[][]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}

export interface ObjectDefinitionSize {
	w: number
	h: number
}

const INTERACT_SPOT_EDGE_ROTATION: Record<InteractSpotEdge, InteractSpotEdge> = { N: 'E', E: 'S', S: 'W', W: 'N' }

function rotateSpotEdge(edge: InteractSpotEdge, times: number): InteractSpotEdge {
	let result = edge
	const n = ((times % 4) + 4) % 4
	for (let i = 0; i < n; i++) result = INTERACT_SPOT_EDGE_ROTATION[result]
	return result
}

export function resolveInteractSpotAnchor(spot: InteractSpot, width: number, height: number): { x: number; y: number } {
	if (spot.kind !== 'edge') return { x: spot.x, y: spot.y }
	const w = Number.isFinite(width) && width > 0 ? width : 0
	const h = Number.isFinite(height) && height > 0 ? height : 0
	const edgeLength = spot.edge === 'N' || spot.edge === 'S' ? w : h
	const offset = Number.isFinite(spot.offset) ? Math.min(Math.max(0, spot.offset), edgeLength) : 0
	switch (spot.edge) {
		case 'N': return { x: offset, y: 0 }
		case 'S': return { x: offset, y: h }
		case 'E': return { x: w, y: offset }
		case 'W': return { x: 0, y: offset }
		default: return { x: spot.x, y: spot.y }
	}
}

export function snapSpotToEdge(x: number, y: number, width: number, height: number): { edge: InteractSpotEdge; offset: number } {
	const w = Number.isFinite(width) && width > 0 ? width : 0
	const h = Number.isFinite(height) && height > 0 ? height : 0
	const px = Number.isFinite(x) ? x : 0
	const py = Number.isFinite(y) ? y : 0
	const distances: { edge: InteractSpotEdge; distance: number; offset: number }[] = [
		{ edge: 'N', distance: py, offset: px },
		{ edge: 'S', distance: h - py, offset: px },
		{ edge: 'E', distance: w - px, offset: py },
		{ edge: 'W', distance: px, offset: py },
	]
	let best = distances[0]
	for (const candidate of distances) {
		if (candidate.distance < best.distance) best = candidate
	}
	const edgeLength = best.edge === 'N' || best.edge === 'S' ? w : h
	return { edge: best.edge, offset: Math.min(Math.max(0, best.offset), edgeLength) }
}

export function rotateInteractSpots90(
	spots: InteractSpot[] | undefined,
	width: number,
	height: number,
	times: number,
): InteractSpot[] | undefined {
	if (!spots || spots.length === 0) return spots
	const n = ((times % 4) + 4) % 4
	if (n === 0) return spots
	let result: InteractSpot[] = spots.map(spot => ({ ...spot }))
	let currentWidth = width
	let currentHeight = height
	for (let i = 0; i < n; i++) {
		result = result.map(spot => {
			if (spot.kind === 'edge') {
				const edge = rotateSpotEdge(spot.edge, 1)
				const anchor = resolveInteractSpotAnchor(spot, currentWidth, currentHeight)
				return { ...spot, edge, x: currentHeight - anchor.y, y: anchor.x }
			}
			return { ...spot, x: currentHeight - spot.y, y: spot.x }
		})
		const nextWidth = currentHeight
		currentHeight = currentWidth
		currentWidth = nextWidth
	}
	return result
}


export function resolveObjectDef(
	rotation: Rotation,
	asset: AssetDef | undefined,
	size?: ObjectDefinitionSize,
): ResolvedObjectDef {
	const walkable = asset?.walkable ?? false
	const doorRequired = asset?.doorRequired ?? false
	const rotSteps = Math.round(rotation / 90)
	const tileStates = rotateGrid90(normalizeTileStates(asset?.tileStates), rotSteps)
	const walkableGrid = rotateGrid90(
		normalizeWalkableGrid(asset?.walkableGrid) ?? (tileStates ? tileStatesToWalkableGrid(tileStates) : undefined),
		rotSteps,
	)
	const interactSpots = normalizeInteractSpots(asset?.interactSpots)
	const sourceSize = size
		? (rotSteps % 2 === 0 ? size : { w: size.h, h: size.w })
		: asset?.svgViewBox
	const rotatedInteractSpots = sourceSize
		? rotateInteractSpots90(interactSpots, sourceSize.w, sourceSize.h, rotSteps)
		: interactSpots
	const interact = normalizeInteractConfig(asset?.interact)
	const queue = normalizeNpcQueueConfig(asset?.queue)
	return { walkable, doorRequired, walkableGrid, tileStates, interactSpots: rotatedInteractSpots, interact, queue }
}


