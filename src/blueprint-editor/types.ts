export type EditorMode = 'object' | 'draw' | 'move' | 'npc-preview'
export type Rotation = 0 | 90 | 180 | 270

export const STREET_TILES = 8
export const CANVAS_WALL_OBJECT_TYPE = '__canvas-wall__'

export function resolveStreetTiles(layout: { streetWidthTiles?: number } | null | undefined): number {
	const v = layout?.streetWidthTiles
	return typeof v === 'number' && Number.isInteger(v) && v >= 5 && v <= 20 ? v : STREET_TILES
}

export type SvgRole = 'wall' | 'door' | 'fixture'

export interface SvgRoleInfo {
	role: SvgRole
	tag: string
	attrs?: Record<string, string>
}

export type TileState = 'walkable' | 'blocked' | 'door'

export type WalkableGrid = boolean[][]

export interface FloorWalkable {
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
}

export interface WallSegment {
	x1: number
	y1: number
	x2: number
	y2: number
	door?: boolean
}

const MAX_DATA_STRING_LENGTH = 512
const MAX_SVG_ATTRIBUTE_LENGTH = 4096
const MAX_SVG_LENGTH = 250_000
const MAX_GRID_ROWS = 256
const MAX_GRID_COLUMNS = 256
const MAX_WALL_SEGMENTS = 2048
const MAX_INTERACT_SPOTS = 512
const MAX_SVG_ROLES = 512
const MAX_ASSET_DIMENSION = 10_000
const MAX_PIXEL_DIMENSION = 1_000_000
const MAX_ASSETS = 1000
const MAX_FLOORS = 100
const MAX_OBJECTS_PER_FLOOR = 10_000
const MAX_NPC_ENTRIES = 1000
const SAFE_SVG_TAGS = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'text', 'tspan'])

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(record, key)
}

function normalizeText(value: unknown, maxLength = MAX_DATA_STRING_LENGTH): string | undefined {
	if (typeof value !== 'string') return undefined
	const text = value.trim()
	return text && text.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(text) ? text : undefined
}

function normalizeIdentifier(value: unknown, maxLength = 128): string | undefined {
	const identifier = normalizeText(value, maxLength)
	return identifier && /^[a-z0-9_][a-z0-9._:-]*$/i.test(identifier) ? identifier : undefined
}

export function normalizeTag(value: unknown): string | undefined {
	const tag = normalizeText(value, 128)?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
	return tag || undefined
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

export function isSafeSvgMarkup(svg: string): boolean {
	if (!svg || svg.length > MAX_SVG_LENGTH) return false
	const tagPattern = /<\s*([a-z][a-z0-9:-]*)\b/gi
	let tagMatch: RegExpExecArray | null
	while ((tagMatch = tagPattern.exec(svg)) !== null) {
		if (!SAFE_SVG_TAGS.has(tagMatch[1].toLowerCase())) return false
	}
	return !/<\s*!\s*(?:DOCTYPE|ENTITY)\b/i.test(svg)
		&& !/\bon[\w:-]+\s*=/i.test(svg)
		&& !/\bstyle\s*=\s*["'][^"']*(?:expression\s*\(|javascript:|vbscript:|mhtml:|@import|behavior:|binding:|url\s*\()/i.test(svg)
		&& !/\b(?:href|xlink:href)\s*=\s*["']\s*(?:javascript|data|blob|vbscript|mhtml):/i.test(svg)
		&& !/\b(?:javascript|vbscript|data|blob|mhtml):/i.test(svg)
}

export function normalizeWallSegment(value: unknown): WallSegment | undefined {
	if (!value || typeof value !== 'object') return undefined
	const record = value as Record<string, unknown>
	if (![record.x1, record.y1, record.x2, record.y2].every(item => isFiniteNumber(item) && Math.abs(item) <= MAX_ASSET_DIMENSION)) return undefined
	const x1 = record.x1 as number
	const y1 = record.y1 as number
	const x2 = record.x2 as number
	const y2 = record.y2 as number
	if (x1 !== x2 && y1 !== y2) return undefined
	if (x1 === x2 && y1 === y2) return undefined
	const door = record.door === true
	const base = (a: number, b: number, c: number, d: number): WallSegment => {
		const seg: WallSegment = { x1: a, y1: b, x2: c, y2: d }
		if (door) seg.door = true
		return seg
	}
	if (x1 === x2) return y1 <= y2 ? base(x1, y1, x2, y2) : base(x2, y2, x1, y1)
	return x1 <= x2 ? base(x1, y1, x2, y2) : base(x2, y2, x1, y1)
}

export function normalizeWallSegments(value: unknown): WallSegment[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_WALL_SEGMENTS) return undefined
	const seen = new Map<string, WallSegment>()
	for (const item of value) {
		const segment = normalizeWallSegment(item)
		if (!segment) continue
		const key = `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`
		const existing = seen.get(key)
		if (existing) {
			if (segment.door) existing.door = true
			continue
		}
		seen.set(key, segment)
	}
	const segments = [...seen.values()]
	return segments.length > 0 ? segments : undefined
}

export function resolveWallSegmentsForObject(
	segments: readonly WallSegment[] | undefined,
	asset: Pick<AssetDef, 'w' | 'h' | 'usePx' | 'pxW' | 'pxH'>,
	object: Pick<ObjectData, 'x' | 'y' | 'w' | 'h' | 'rotation'>,
	tileSize: number,
): WallSegment[] {
	if (!segments?.length || asset.w <= 0 || asset.h <= 0) return []
	const sourceW = asset.usePx ? (asset.pxW ?? asset.w * tileSize) : asset.w * tileSize
	const sourceH = asset.usePx ? (asset.pxH ?? asset.h * tileSize) : asset.h * tileSize
	if (sourceW <= 0 || sourceH <= 0 || object.w <= 0 || object.h <= 0) return []
	const rotatedW = object.rotation === 90 || object.rotation === 270 ? sourceH : sourceW
	const rotatedH = object.rotation === 90 || object.rotation === 270 ? sourceW : sourceH
	const scaleX = object.w / rotatedW
	const scaleY = object.h / rotatedH
	const transformPoint = (x: number, y: number): { x: number; y: number } => {
		const localX = x / asset.w * sourceW
		const localY = y / asset.h * sourceH
		if (object.rotation === 90) return { x: object.x + (sourceH - localY) * scaleX, y: object.y + localX * scaleY }
		if (object.rotation === 180) return { x: object.x + (sourceW - localX) * scaleX, y: object.y + (sourceH - localY) * scaleY }
		if (object.rotation === 270) return { x: object.x + localY * scaleX, y: object.y + (sourceW - localX) * scaleY }
		return { x: object.x + localX * scaleX, y: object.y + localY * scaleY }
	}
	return segments.flatMap(segment => {
		const a = transformPoint(segment.x1, segment.y1)
		const b = transformPoint(segment.x2, segment.y2)
		return normalizeWallSegment({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }) ?? []
	})
}

export function normalizeFloorWalkable(value: unknown): FloorWalkable | undefined {
	if (!isRecord(value)) return undefined
	const hasWalkableGrid = hasOwn(value, 'walkableGrid')
	const hasTileStates = hasOwn(value, 'tileStates')
	const walkableGrid = normalizeWalkableGrid(value.walkableGrid)
	const tileStates = normalizeTileStates(value.tileStates)
	if (hasWalkableGrid && !walkableGrid) return undefined
	if (hasTileStates && !tileStates) return undefined
	if (!walkableGrid && !tileStates) return undefined
	if (walkableGrid && tileStates && (walkableGrid.length !== tileStates.length || walkableGrid.some((row, index) => row.length !== tileStates[index]?.length))) return undefined
	return {
		...(walkableGrid ? { walkableGrid } : {}),
		...(tileStates ? { tileStates } : {}),
	}
}

export interface InteractSpot {
	x: number
	y: number
}

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

export function normalizeInteractSpots(value: unknown): InteractSpot[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_INTERACT_SPOTS) return undefined
	const seen = new Set<string>()
	const points: InteractSpot[] = []
	for (const point of value) {
		let x: number | undefined
		let y: number | undefined
		if (Array.isArray(point) && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number') {
			x = point[0]
			y = point[1]
		} else if (point && typeof point === 'object') {
			const item = point as Record<string, unknown>
			if (typeof item.x === 'number' && typeof item.y === 'number') {
				x = item.x
				y = item.y
			}
		}
		if (x === undefined || y === undefined) continue
		if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > MAX_PIXEL_DIMENSION || Math.abs(y) > MAX_PIXEL_DIMENSION) continue
		const key = `${x},${y}`
		if (seen.has(key)) continue
		seen.add(key)
		points.push({ x, y })
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


export function normalizeWalkableGrid(value: unknown): WalkableGrid | undefined {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_GRID_ROWS) return undefined
	const rows: boolean[][] = []
	let columnCount = 0
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0 || row.length > MAX_GRID_COLUMNS) return undefined
		if (columnCount === 0) columnCount = row.length
		if (row.length !== columnCount) return undefined
		const cols: boolean[] = []
		for (const cell of row) {
			if (typeof cell !== 'boolean') return undefined
			cols.push(cell)
		}
		rows.push(cols)
	}
	return rows
}


export function normalizeTileStates(value: unknown): TileState[][] | undefined {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_GRID_ROWS) return undefined
	const rows: TileState[][] = []
	let columnCount = 0
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0 || row.length > MAX_GRID_COLUMNS) return undefined
		if (columnCount === 0) columnCount = row.length
		if (row.length !== columnCount) return undefined
		const cols: TileState[] = []
		for (const cell of row) {
			if (cell !== 'walkable' && cell !== 'blocked' && cell !== 'door') return undefined
			cols.push(cell)
		}
		rows.push(cols)
	}
	return rows
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
	wallSegments?: WallSegment[]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}

export interface ObjectDefinitionSize {
	w: number
	h: number
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
	let result = spots.map(({ x, y }) => ({ x, y }))
	let currentWidth = width
	let currentHeight = height
	for (let i = 0; i < n; i++) {
		result = result.map(({ x, y }) => ({ x: currentHeight - y, y: x }))
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
	const walkableGrid = rotateGrid90(normalizeWalkableGrid(asset?.walkableGrid), rotSteps)
	const tileStates = rotateGrid90(normalizeTileStates(asset?.tileStates), rotSteps)
	const wallSegments = normalizeWallSegments(asset?.wallSegments)
	const interactSpots = normalizeInteractSpots(asset?.interactSpots)
	const sourceSize = size
		? (rotSteps % 2 === 0 ? size : { w: size.h, h: size.w })
		: asset?.svgViewBox
	const rotatedInteractSpots = sourceSize
		? rotateInteractSpots90(interactSpots, sourceSize.w, sourceSize.h, rotSteps)
		: interactSpots
	const interact = normalizeInteractConfig(asset?.interact)
	const queue = normalizeNpcQueueConfig(asset?.queue)
	return { walkable, doorRequired, walkableGrid, tileStates, wallSegments, interactSpots: rotatedInteractSpots, interact, queue }
}


export function normalizeObjectPlacement(value: unknown): ObjectPlacement | undefined {
	if (!isRecord(value)) return undefined
	const record = value
	const id = normalizeIdentifier(record.id)
	const type = normalizeIdentifier(record.type)
	if (!id || !type || !isFiniteNumber(record.x) || !isFiniteNumber(record.y) || Math.abs(record.x) > MAX_PIXEL_DIMENSION || Math.abs(record.y) > MAX_PIXEL_DIMENSION) return undefined
	const rawRotation = typeof record.rotation === 'number' ? record.rotation : 0
	const rotation = [0, 90, 180, 270].includes(rawRotation) ? rawRotation as Rotation : 0
	const placement: ObjectPlacement = {
		id,
		type,
		x: record.x,
		y: record.y,
		rotation,
	}
	const linkGroupId = normalizeIdentifier(record.linkGroupId)
	if (linkGroupId) placement.linkGroupId = linkGroupId
	if (typeof record.locked === 'boolean') placement.locked = record.locked
	if (typeof record.isWall === 'boolean') placement.isWall = record.isWall
	for (const key of ['x1', 'y1', 'x2', 'y2'] as const) {
		const value = record[key]
		if (isFiniteNumber(value)) placement[key] = value
	}
	const fillColor = typeof record.fillColor === 'string' && isValidColor(record.fillColor.trim()) ? record.fillColor.trim() : undefined
	if (fillColor) placement.fillColor = fillColor
	const strokeColor = typeof record.strokeColor === 'string' && isValidColor(record.strokeColor.trim()) ? record.strokeColor.trim() : undefined
	if (strokeColor) placement.strokeColor = strokeColor
	return placement
}

export function normalizeAllowedRoleIds(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined
	const seen = new Set<string>()
	const ids: string[] = []
	for (const entry of value) {
		const trimmed = normalizeIdentifier(entry)
		if (!trimmed) continue
		if (seen.has(trimmed)) continue
		seen.add(trimmed)
		ids.push(trimmed)
	}
	return ids.length > 0 ? ids : undefined
}

export interface AssetBase {
	id: string
	name: string
	category?: string
	w: number
	h: number
	custom?: boolean
	isWall?: boolean
	wallSegments?: WallSegment[]
	walkable?: boolean
	doorRequired?: boolean
	defaultPadding?: number
	defaultRx?: { tl: number; tr: number; br: number; bl: number }
	defaultFillColor?: string
	defaultStrokeColor?: string
	defaultLabel?: string
	defaultRadius?: number
	defaultLabelPadding?: number
	defaultLocked?: boolean
	tags?: string[]
}

export type AssetOrigin = 'drawn' | 'svg-import' | 'flattened'

export interface AssetDef extends AssetBase {
	origin?: AssetOrigin
	pxW?: number
	pxH?: number
	usePx?: boolean
	svg?: string
	svgViewBox?: { w: number; h: number }
	svgRoles?: SvgRoleInfo[]
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}

export interface OriginAssetFile {
	$schema: string
	version: number
	originAssets: AssetDef[]
}

export interface BlueprintTagDefinition {
	id: string
	label: string
}

export interface PersistedFloorData extends Omit<FloorData, 'objects'> {
	objects: ObjectPlacement[]
}

export interface PersistedFloorLayoutData extends Omit<FloorLayoutData, 'floors'> {
	floors: PersistedFloorData[]
}

export interface BlueprintDataFile {
	$schema: string
	version: number
	tags: BlueprintTagDefinition[]
	originAssets: AssetDef[]
	layout: PersistedFloorLayoutData
	npcConfig: NpcSimulationConfig
}

export const BLUEPRINT_DATA_SCHEMA = 'blueprint-data.v2.json'
export const BLUEPRINT_DATA_VERSION = 2

const SVG_COLOR_VALUE_RE = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\([^)]*\)|hsla?\([^)]*\))$/

export function applySvgColorConvention(svg: string): string {
	return svg.replace(/\b(fill|stroke)(\s*=\s*)(["\'])([^"\']*)\3/g, (_m, attr: string, sep: string, q: string, value: string) => {
		const v = value.trim()
		if (v.startsWith('var(--obj-fill') || v.startsWith('var(--obj-stroke')) return _m
		if (attr === 'fill') {
			if (v === 'none') return `${attr}${sep}${q}var(--obj-fill,none)${q}`
			if (SVG_COLOR_VALUE_RE.test(v)) return `${attr}${sep}${q}var(--obj-fill,${v})${q}`
		} else if (SVG_COLOR_VALUE_RE.test(v)) {
			return `${attr}${sep}${q}var(--obj-stroke,${v})${q}`
		}
		return _m
	})
}

function normalizeSvgRoles(value: unknown): SvgRoleInfo[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_SVG_ROLES) return undefined
	const roles: SvgRoleInfo[] = []
	for (const item of value) {
		if (!isRecord(item) || !['wall', 'door', 'fixture'].includes(item.role as string)) return undefined
		const tag = normalizeText(item.tag, 64)
		if (!tag || !/^[a-z][a-z0-9:_-]*$/i.test(tag)) return undefined
		const roleInfo: SvgRoleInfo = { role: item.role as SvgRole, tag }
		if (hasOwn(item, 'attrs')) {
			if (!isRecord(item.attrs)) return undefined
			const attrs: Record<string, string> = {}
			const entries = Object.entries(item.attrs)
			if (entries.length > 64) return undefined
			for (const [name, attrValue] of entries) {
				if (!/^[a-z_:][a-z0-9:_.-]*$/i.test(name) || typeof attrValue !== 'string' || attrValue.length > MAX_SVG_ATTRIBUTE_LENGTH) return undefined
				attrs[name] = attrValue
			}
			if (entries.length > 0) roleInfo.attrs = attrs
		}
		roles.push(roleInfo)
	}
	return roles
}

function normalizeAssetColor(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined
	const color = value.trim()
	return color.length <= 32 && isValidColor(color) ? color : undefined
}

export function normalizeOriginAsset(value: unknown): AssetDef | undefined {
	if (!isRecord(value)) return undefined
	const record = value
	const id = normalizeIdentifier(record.id)
	const name = normalizeText(record.name)
	if (!id || !name || !isFiniteNumber(record.w) || record.w <= 0 || record.w > MAX_ASSET_DIMENSION || !isFiniteNumber(record.h) || record.h <= 0 || record.h > MAX_ASSET_DIMENSION) return undefined
	const asset: AssetDef = { id, name, w: record.w, h: record.h }

	if (hasOwn(record, 'category')) {
		if (typeof record.category !== 'string') return undefined
		const category = normalizeText(record.category)
		if (category) asset.category = category
	}
	if (hasOwn(record, 'custom')) {
		if (typeof record.custom !== 'boolean') return undefined
		asset.custom = record.custom
	}
	if (hasOwn(record, 'isWall')) {
		if (typeof record.isWall !== 'boolean') return undefined
		asset.isWall = record.isWall
	}
	if (hasOwn(record, 'wallSegments')) {
		if (!Array.isArray(record.wallSegments)) return undefined
		const wallSegments = normalizeWallSegments(record.wallSegments)
		if (record.wallSegments.length > 0 && !wallSegments) return undefined
		if (wallSegments) asset.wallSegments = wallSegments
	}
	if (hasOwn(record, 'walkable')) {
		if (typeof record.walkable !== 'boolean') return undefined
		asset.walkable = record.walkable
	}
	if (hasOwn(record, 'doorRequired')) {
		if (typeof record.doorRequired !== 'boolean') return undefined
		asset.doorRequired = record.doorRequired
	}
	if (hasOwn(record, 'defaultPadding')) {
		if (!isFiniteNumber(record.defaultPadding) || record.defaultPadding < 0 || record.defaultPadding > MAX_ASSET_DIMENSION) return undefined
		if (record.defaultPadding > 0) asset.defaultPadding = record.defaultPadding
	}
	if (hasOwn(record, 'defaultRx')) {
		if (!isRecord(record.defaultRx)) return undefined
		const defaultRx = normalizeCornerRx(record.defaultRx)
		if (defaultRx) asset.defaultRx = defaultRx
	}
	for (const key of ['defaultFillColor', 'defaultStrokeColor'] as const) {
		if (!hasOwn(record, key)) continue
		const color = normalizeAssetColor(record[key])
		if (!color) return undefined
		asset[key] = color
	}
	if (hasOwn(record, 'defaultLabel')) {
		if (typeof record.defaultLabel !== 'string') return undefined
		const label = normalizeText(record.defaultLabel)
		if (label) asset.defaultLabel = label
	}
	for (const key of ['defaultRadius', 'defaultLabelPadding'] as const) {
		if (!hasOwn(record, key)) continue
		if (!isFiniteNumber(record[key]) || record[key] < 0 || record[key] > MAX_ASSET_DIMENSION) return undefined
		if (record[key] > 0) asset[key] = record[key]
	}
	if (hasOwn(record, 'defaultLocked')) {
		if (typeof record.defaultLocked !== 'boolean') return undefined
		asset.defaultLocked = record.defaultLocked
	}
	if (hasOwn(record, 'tags')) {
		const tags = normalizeTags(record.tags)
		if (!tags) return undefined
		if (tags.length > 0) asset.tags = tags
	}
	if (hasOwn(record, 'origin')) {
		if (!['drawn', 'svg-import', 'flattened'].includes(record.origin as string)) return undefined
		asset.origin = record.origin as AssetOrigin
	}
	for (const key of ['pxW', 'pxH'] as const) {
		if (!hasOwn(record, key)) continue
		if (!isFiniteNumber(record[key]) || record[key] <= 0 || record[key] > MAX_PIXEL_DIMENSION) return undefined
		asset[key] = record[key]
	}
	if (hasOwn(record, 'usePx')) {
		if (typeof record.usePx !== 'boolean') return undefined
		asset.usePx = record.usePx
	}
	if (hasOwn(record, 'svg')) {
		if (typeof record.svg !== 'string') return undefined
		const svg = record.svg.trim()
		if (svg) {
			if (!isSafeSvgMarkup(svg)) return undefined
			asset.svg = applySvgColorConvention(svg)
		}
	}
	if (hasOwn(record, 'svgViewBox')) {
		if (!isRecord(record.svgViewBox) || !isFiniteNumber(record.svgViewBox.w) || record.svgViewBox.w <= 0 || record.svgViewBox.w > MAX_PIXEL_DIMENSION || !isFiniteNumber(record.svgViewBox.h) || record.svgViewBox.h <= 0 || record.svgViewBox.h > MAX_PIXEL_DIMENSION) return undefined
		asset.svgViewBox = { w: record.svgViewBox.w, h: record.svgViewBox.h }
	}
	if (hasOwn(record, 'svgRoles')) {
		const svgRoles = normalizeSvgRoles(record.svgRoles)
		if (!svgRoles) return undefined
		if (svgRoles.length > 0) asset.svgRoles = svgRoles
	}
	if (hasOwn(record, 'walkableGrid')) {
		const walkableGrid = normalizeWalkableGrid(record.walkableGrid)
		if (!walkableGrid) return undefined
		asset.walkableGrid = walkableGrid
	}
	if (hasOwn(record, 'tileStates')) {
		const tileStates = normalizeTileStates(record.tileStates)
		if (!tileStates) return undefined
		asset.tileStates = tileStates
	}
	if (hasOwn(record, 'interactSpots')) {
		if (!Array.isArray(record.interactSpots)) return undefined
		const interactSpots = normalizeInteractSpots(record.interactSpots)
		if (record.interactSpots.length > 0 && !interactSpots) return undefined
		if (interactSpots) asset.interactSpots = interactSpots
	}
	if (hasOwn(record, 'interact')) {
		const interact = normalizeInteractConfig(record.interact)
		if (!interact) return undefined
		asset.interact = interact
	}
	if (hasOwn(record, 'queue')) {
		const queue = normalizeNpcQueueConfig(record.queue)
		if (!queue) return undefined
		asset.queue = queue
	}
	if (asset.walkableGrid && asset.tileStates) {
		if (asset.walkableGrid.length !== asset.tileStates.length || asset.walkableGrid.some((row, index) => row.length !== asset.tileStates?.[index]?.length)) return undefined
		if (asset.walkableGrid.some((row, rowIndex) => row.some((cell, columnIndex) => cell !== (asset.tileStates?.[rowIndex]?.[columnIndex] === 'walkable' || asset.tileStates?.[rowIndex]?.[columnIndex] === 'door')))) return undefined
	}
	if (asset.svg && !asset.svgViewBox) return undefined
	return asset
}

export function normalizeOriginAssetFile(value: unknown): OriginAssetFile | undefined {
	if (!isRecord(value) || !Array.isArray(value.originAssets) || value.originAssets.length > MAX_ASSETS) return undefined
	const assets: AssetDef[] = []
	const assetIds = new Set<string>()
	for (const item of value.originAssets) {
		const asset = normalizeOriginAsset(item)
		if (!asset || assetIds.has(asset.id)) return undefined
		assetIds.add(asset.id)
		assets.push(asset)
	}
	return { $schema: typeof value.$schema === 'string' ? value.$schema : 'origin-assets.v2.json', version: typeof value.version === 'number' ? value.version : 2, originAssets: assets }
}

export interface NpcTask {
	id: string
	label: string
	tags: string[]
}


export interface NpcSpawnRule {

	targetTags?: string[]

	count: number
}

export interface NpcRole {
	id: string
	label: string
	color: string

	focusTags: string[]

	restrictedTags: string[]

	taskIds: string[]

	focusChance: number
	spawnRule?: NpcSpawnRule
}

export interface NpcDeploymentPool {
	roleId: string
	count: number
	floorIds?: string[]
}

export interface NpcSimulationConfig {
	speed: number
	defaultRoleId: string
	roles: NpcRole[]
	tasks: NpcTask[]
	pool: NpcDeploymentPool[]

	tagTriggerRates?: Record<string, number>
	crossFloorCooldownSeconds: number
	progressWatchdogTicks: number
	maxRepathAttempts: number
	repathCooldownSeconds: number
	repathCooldownExponent: number
	pathBudgetMinPerTick: number
	pathBudgetAgentsPerCall: number
	chooseTargetMinPerTick: number
	chooseTargetAgentsPerSlot: number
	wanderMemorySize: number
	wanderSmallMapThreshold: number
	triggerRatePeriodSeconds: number
	frameSimBudgetMs: number
	maxSimulationSteps: number
}

export interface NpcSimDot {
	id: string
	floorId: string
	type: string
	x: number
	y: number
	targetX: number
	targetY: number
	speed: number
	color: string
	status: 'walking' | 'queued' | 'waiting' | 'interacting' | 'idle'
	pauseTimer: number
	pathIdx: number
	path: [number, number][]
	interactTargetKey: string | null
	interactSpotKey: string | null
	interactDurationMin: number
	interactDurationMax: number
}

export interface ObjectPlacement {
	id: string
	type: string
	x: number
	y: number
	rotation: Rotation
	isWall?: boolean
	x1?: number
	y1?: number
	x2?: number
	y2?: number
	door?: boolean
	linkGroupId?: string
	locked?: boolean
	fillColor?: string
	strokeColor?: string
}

export interface ObjectData extends ObjectPlacement {
	w: number
	h: number
	radius?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	labelPadding?: number
	padding?: number
	collapsed?: boolean
	label?: string
	isWall?: boolean
}

export interface ResolvedObject extends ObjectPlacement {
	w: number
	h: number
	radius?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	labelPadding?: number
	padding?: number
	fillColor?: string
	label?: string
	isWall?: boolean
	walkable: boolean
	doorRequired: boolean
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	wallSegments?: WallSegment[]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}

export interface NpcSpawnZone {
	id: string
	label: string
	x: number
	y: number
	w: number
	h: number
	roleIds?: string[]
}

export function normalizeNpcSpawnZones(value: unknown): NpcSpawnZone[] | undefined {
	if (value === undefined || value === null) return undefined
	if (!Array.isArray(value) || value.length > MAX_OBJECTS_PER_FLOOR) return undefined
	const zones: NpcSpawnZone[] = []
	const seen = new Set<string>()
	for (const item of value) {
		if (!isRecord(item)) continue
		const record = item
		const id = normalizeIdentifier(record.id)
		if (!id || seen.has(id)) continue
		if (!isFiniteNumber(record.x) || !isFiniteNumber(record.y) || Math.abs(record.x) > MAX_PIXEL_DIMENSION || Math.abs(record.y) > MAX_PIXEL_DIMENSION) continue
		if (!isFiniteNumber(record.w) || record.w <= 0 || record.w > MAX_PIXEL_DIMENSION || !isFiniteNumber(record.h) || record.h <= 0 || record.h > MAX_PIXEL_DIMENSION) continue
		const roleIds = normalizeAllowedRoleIds(record.roleIds)
		seen.add(id)
		zones.push({
			id,
			label: normalizeText(record.label) ?? id,
			x: Math.max(0, record.x),
			y: Math.max(0, record.y),
			w: Math.max(1, record.w),
			h: Math.max(1, record.h),
			...(roleIds?.length ? { roleIds } : {}),
		})
	}
	return zones
}

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
	wallThickness?: number
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
	wallThickness: { kind: 'int', min: 1, max: 10 },
} as const satisfies Record<keyof CanvasConfig, CanvasFieldSpec>

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
	wallHitTolerancePx: number
	wallHitToleranceTileRatio: number
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
	wallThicknessRatio: number
	sidewalkTileRatio: number
	walkableGridMinTilePx: number
	walkableGridMaxTilePx: number
	walkableGridMaxWidthPx: number
	walkableGridMaxHeightPx: number
}

export interface EditorFieldSpec {
	kind: 'number'
	required?: boolean
	min?: number
	max?: number
}

export const EDITOR_FIELD_SPECS = {
	wallHitTolerancePx: { kind: 'number', min: 1, max: 100 },
	wallHitToleranceTileRatio: { kind: 'number', min: 0.01, max: 1 },
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
	wallThicknessRatio: { kind: 'number', min: 0.01, max: 0.5 },
	sidewalkTileRatio: { kind: 'number', min: 0.1, max: 0.5 },
	walkableGridMinTilePx: { kind: 'number', min: 4, max: 40 },
	walkableGridMaxTilePx: { kind: 'number', min: 10, max: 80 },
	walkableGridMaxWidthPx: { kind: 'number', min: 200, max: 2000 },
	walkableGridMaxHeightPx: { kind: 'number', min: 200, max: 2000 },
} as const satisfies Record<keyof EditorSettings, EditorFieldSpec>

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
	wallHitTolerancePx: 6,
	wallHitToleranceTileRatio: 0.2,
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
	wallThicknessRatio: 0.12,
	sidewalkTileRatio: 0.25,
	walkableGridMinTilePx: 14,
	walkableGridMaxTilePx: 40,
	walkableGridMaxWidthPx: 900,
	walkableGridMaxHeightPx: 560,
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


export interface SyncedCanvas {
	width: number
	height: number
	tileSize: number
	bgColor?: string
	streetWidthTiles?: number
	streetFloorId?: string
}


export interface SyncedObject {
	id: string
	type: string
	x: number
	y: number
	w: number
	h: number
	rotation: Rotation
	isWall?: boolean
	x1?: number
	y1?: number
	x2?: number
	y2?: number
	fillColor?: string
	strokeColor?: string
	label?: string
	walkable?: boolean
	doorRequired?: boolean
	walkableGrid?: boolean[][]
	tileStates?: TileState[][]
	wallSegments?: WallSegment[]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}


export interface SyncedFloor {
	defaultWalkable?: boolean
	walkable?: FloorWalkable
	spawnZones?: NpcSpawnZone[]
	allowedRoleIds?: string[]
	objects: SyncedObject[]
}


export interface SyncedLayoutPayload {
	version: number
	canvas: SyncedCanvas
	floors: Record<string, SyncedFloor>
	npcConfig?: NpcSimulationConfig
	timestamp?: number
}

export interface Rect {
	x: number
	y: number
	w: number
	h: number
}

export interface EntityRef {
	type: 'object'
	id: string
}

export interface SelectionState {
	primary: EntityRef | null
	items: EntityRef[]
}

function isValidWallPlacement(object: ObjectPlacement): boolean {
	const hasWallFields = [object.x1, object.y1, object.x2, object.y2].some(value => value !== undefined)
	if (!object.isWall) return !hasWallFields
	return object.type === CANVAS_WALL_OBJECT_TYPE
		&& normalizeWallSegment({ x1: object.x1, y1: object.y1, x2: object.x2, y2: object.y2 }) !== undefined
}

export function validateLayoutData(data: unknown): FloorLayoutData | null {
	if (!isRecord(data)) return null
	const layout = data as unknown as FloorLayoutData
	const persistedInput = { ...data }
	delete persistedInput.npcConfig
	const persisted = normalizePersistedLayoutData(persistedInput)
	if (!persisted || (layout.npcConfig !== undefined && !isNpcConfig(layout.npcConfig))) return null
	Object.assign(layout, { canvas: persisted.canvas })
	return layout
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function isHexColor(c: string | undefined): c is string {
	return typeof c === 'string' && HEX_COLOR_RE.test(c)
}

export function isValidColor(c: string | undefined): boolean {
	if (!c) return true
	if (c === 'transparent') return true
	return isHexColor(c)
}

function isValidTagTriggerRates(value: unknown): boolean {
	if (value === undefined) return true
	if (!isRecord(value) || Object.keys(value).length > 256) return false
	return Object.entries(value).every(([tag, rate]) => !!normalizeTag(tag) && isFiniteNumber(rate) && rate >= 0 && rate <= 100)
}

function normalizeTagTriggerRates(value: unknown): Record<string, number> | undefined {
	if (!isRecord(value)) return undefined
	const rates: Record<string, number> = {}
	for (const [tag, rate] of Object.entries(value)) {
		const normalized = normalizeTag(tag)
		if (normalized && isFiniteNumber(rate) && rate > 0) rates[normalized] = Math.max(0, Math.min(100, Math.floor(rate)))
	}
	return Object.keys(rates).length ? rates : undefined
}

export function isNpcConfig(value: unknown): value is NpcSimulationConfig {
	if (!isRecord(value)) return false
	const c = value
	if (!isFiniteNumber(c.speed) || c.speed < 0 || c.speed > 1) return false
	if (typeof c.defaultRoleId !== 'string' || (c.defaultRoleId !== '' && !normalizeIdentifier(c.defaultRoleId))) return false
	if (!Array.isArray(c.roles) || c.roles.length > MAX_NPC_ENTRIES) return false
	if (!Array.isArray(c.tasks) || c.tasks.length > MAX_NPC_ENTRIES) return false
	if (!Array.isArray(c.pool) || c.pool.length > MAX_NPC_ENTRIES) return false
	if (c.roles.some((role: unknown) => !isValidRole(role))) return false
	if (c.tasks.some((task: unknown) => !isValidTask(task))) return false
	if (c.pool.some((pool: unknown) => !isValidPoolEntry(pool))) return false
	if (!isValidTagTriggerRates(c.tagTriggerRates)) return false
	const numericFields: Array<keyof typeof c> = ['crossFloorCooldownSeconds', 'progressWatchdogTicks', 'maxRepathAttempts', 'repathCooldownSeconds', 'repathCooldownExponent', 'pathBudgetMinPerTick', 'pathBudgetAgentsPerCall', 'chooseTargetMinPerTick', 'chooseTargetAgentsPerSlot', 'wanderMemorySize', 'wanderSmallMapThreshold', 'triggerRatePeriodSeconds', 'frameSimBudgetMs', 'maxSimulationSteps']
	for (const field of numericFields) {
		const v = c[field]
		if (v !== undefined && !isFiniteNumber(v)) return false
	}
	return true
}

function isValidRole(r: unknown): r is NpcRole {
	if (!isRecord(r)) return false
	const role = r
	const color = normalizeText(role.color, 32)
	if (!normalizeIdentifier(role.id) || !normalizeText(role.label) || !color || !isValidColor(color)) return false
	if (!isFiniteNumber(role.focusChance) || role.focusChance < 0 || role.focusChance > 100) return false
	if (!Array.isArray(role.focusTags) || !normalizeTags(role.focusTags)) return false
	if (!Array.isArray(role.restrictedTags) || !normalizeTags(role.restrictedTags)) return false
	if (!Array.isArray(role.taskIds) || role.taskIds.length > MAX_NPC_ENTRIES || role.taskIds.some((taskId: unknown) => !normalizeIdentifier(taskId))) return false
	if (role.spawnRule !== undefined) {
		if (!isRecord(role.spawnRule) || !isFiniteNumber(role.spawnRule.count) || role.spawnRule.count < 0 || role.spawnRule.count > 1000) return false
		if (role.spawnRule.targetTags !== undefined && (!Array.isArray(role.spawnRule.targetTags) || !normalizeTags(role.spawnRule.targetTags))) return false
	}
	return true
}

function isValidTask(t: unknown): t is NpcTask {
	if (!isRecord(t)) return false
	return !!normalizeIdentifier(t.id) && !!normalizeText(t.label)
		&& Array.isArray(t.tags) && !!normalizeTags(t.tags)
}

function isValidPoolEntry(p: unknown): p is NpcDeploymentPool {
	if (!isRecord(p)) return false
	if (!normalizeIdentifier(p.roleId) || !isFiniteNumber(p.count) || p.count < 0 || p.count > 1000) return false
	return p.floorIds === undefined
		|| (Array.isArray(p.floorIds) && p.floorIds.length <= MAX_NPC_ENTRIES && p.floorIds.every((id: unknown) => !!normalizeIdentifier(id)))
}

export function normalizeNpcConfig(value: unknown): NpcSimulationConfig | undefined {
	if (!isRecord(value)) return undefined
	const c = value
	if (!isFiniteNumber(c.speed) || c.speed < 0 || c.speed > 1) return undefined
	if (typeof c.defaultRoleId !== 'string' || c.defaultRoleId.length > MAX_DATA_STRING_LENGTH) return undefined
	if (!Array.isArray(c.roles) || c.roles.length > MAX_NPC_ENTRIES || !Array.isArray(c.tasks) || c.tasks.length > MAX_NPC_ENTRIES || !Array.isArray(c.pool) || c.pool.length > MAX_NPC_ENTRIES) return undefined
	const rawRoles = c.roles as unknown[]
	const rawTasks = c.tasks as unknown[]
	const rawPool = c.pool as unknown[]
	const roles = rawRoles.filter(isValidRole)
	const tasks = rawTasks.filter(isValidTask)
	const validPool = rawPool.filter(isValidPoolEntry)
	const pool = validPool.filter(entry => roles.some(role => role.id === entry.roleId))
	const droppedRoles = rawRoles.length - roles.length
	const droppedTasks = rawTasks.length - tasks.length
	const droppedPool = rawPool.length - pool.length
	if (droppedRoles > 0 || droppedTasks > 0 || droppedPool > 0) {
		const parts: string[] = []
		if (droppedRoles > 0) parts.push(`${droppedRoles} role(s)`)
		if (droppedTasks > 0) parts.push(`${droppedTasks} task(s)`)
		if (droppedPool > 0) parts.push(`${droppedPool} pool entr(y/ies)`)
		console.warn(`[BlueprintEditor] NPC config salvage: dropped ${parts.join(', ')} during normalization`)
	}
	if (roles.length === 0) return undefined
	const taskIds = new Set(tasks.map(task => task.id.trim()))
	const config: NpcSimulationConfig = {
		speed: Math.max(0.001, Math.min(1, c.speed)),
		defaultRoleId: c.defaultRoleId.trim(),
		roles: roles.map(role => {
			const normalized: NpcRole = {
				id: role.id.trim(),
				label: role.label.trim(),
				color: role.color.trim(),
				focusTags: normalizeTags(role.focusTags) ?? [],
				restrictedTags: normalizeTags(role.restrictedTags) ?? [],
				taskIds: [...new Set(role.taskIds.map(taskId => taskId.trim()).filter(taskId => taskIds.has(taskId)))],
				focusChance: Math.max(0, Math.min(100, Math.floor(role.focusChance))),
			}
			if (role.spawnRule) {
				normalized.spawnRule = {
					targetTags: normalizeTags(role.spawnRule.targetTags) ?? [],
					count: Math.max(0, Math.min(1000, Math.floor(role.spawnRule.count))),
				}
			}
			return normalized
		}),
		tasks: tasks.map(task => ({
			id: task.id.trim(),
			label: task.label.trim(),
			tags: normalizeTags(task.tags) ?? [],
		})),
		pool: pool.map(entry => ({
			roleId: entry.roleId.trim(),
			count: Math.max(0, Math.min(1000, Math.floor(entry.count))),
			...(entry.floorIds?.length ? { floorIds: [...new Set(entry.floorIds.map(id => id.trim()).filter(Boolean))] } : {}),
		})),
		crossFloorCooldownSeconds: isFiniteNumber(c.crossFloorCooldownSeconds) && c.crossFloorCooldownSeconds > 0 ? c.crossFloorCooldownSeconds : 30,
		progressWatchdogTicks: isFiniteNumber(c.progressWatchdogTicks) && c.progressWatchdogTicks > 0 ? Math.floor(c.progressWatchdogTicks) : 120,
		maxRepathAttempts: isFiniteNumber(c.maxRepathAttempts) && c.maxRepathAttempts > 0 ? Math.floor(c.maxRepathAttempts) : 4,
		repathCooldownSeconds: isFiniteNumber(c.repathCooldownSeconds) && c.repathCooldownSeconds > 0 ? c.repathCooldownSeconds : 2,
		repathCooldownExponent: isFiniteNumber(c.repathCooldownExponent) && c.repathCooldownExponent > 0 ? c.repathCooldownExponent : 1.5,
		pathBudgetMinPerTick: isFiniteNumber(c.pathBudgetMinPerTick) && c.pathBudgetMinPerTick > 0 ? Math.floor(c.pathBudgetMinPerTick) : 2,
		pathBudgetAgentsPerCall: isFiniteNumber(c.pathBudgetAgentsPerCall) && c.pathBudgetAgentsPerCall > 0 ? Math.floor(c.pathBudgetAgentsPerCall) : 100,
		chooseTargetMinPerTick: isFiniteNumber(c.chooseTargetMinPerTick) && c.chooseTargetMinPerTick > 0 ? Math.floor(c.chooseTargetMinPerTick) : 8,
		chooseTargetAgentsPerSlot: isFiniteNumber(c.chooseTargetAgentsPerSlot) && c.chooseTargetAgentsPerSlot > 0 ? Math.floor(c.chooseTargetAgentsPerSlot) : 20,
		wanderMemorySize: isFiniteNumber(c.wanderMemorySize) && c.wanderMemorySize > 0 ? Math.floor(c.wanderMemorySize) : 32,
		wanderSmallMapThreshold: isFiniteNumber(c.wanderSmallMapThreshold) && c.wanderSmallMapThreshold > 0 ? Math.floor(c.wanderSmallMapThreshold) : 8,
		triggerRatePeriodSeconds: isFiniteNumber(c.triggerRatePeriodSeconds) && c.triggerRatePeriodSeconds > 0 ? c.triggerRatePeriodSeconds : 60,
		frameSimBudgetMs: isFiniteNumber(c.frameSimBudgetMs) && c.frameSimBudgetMs > 0 ? c.frameSimBudgetMs : 6,
		maxSimulationSteps: isFiniteNumber(c.maxSimulationSteps) && c.maxSimulationSteps > 0 ? Math.floor(c.maxSimulationSteps) : 8,
	}
	config.tagTriggerRates = normalizeTagTriggerRates(c.tagTriggerRates)
	if (!config.roles.some(role => role.id === config.defaultRoleId)) config.defaultRoleId = config.roles[0]?.id ?? ''
	return config
}

export function normalizeTags(value: unknown): string[] | undefined {
	if (value === undefined || value === null) return undefined
	if (!Array.isArray(value) || value.length > 256) return undefined
	if (value.length === 0) return []
	const seen = new Set<string>()
	const result: string[] = []
	for (const tag of value) {
		if (typeof tag !== 'string') return undefined
		if (!tag.trim()) continue
		const id = normalizeTag(tag)
		if (!id) return undefined
		if (seen.has(id)) continue
		seen.add(id)
		result.push(id)
	}
	return result
}

export function normalizeTagDefinitions(value: unknown): BlueprintTagDefinition[] | undefined {
	if (!Array.isArray(value) || value.length > 256) return undefined
	const tags: BlueprintTagDefinition[] = []
	const seen = new Set<string>()
	for (const item of value) {
		if (!isRecord(item)) return undefined
		const id = normalizeTag(item.id)
		const label = normalizeText(item.label)
		if (!id || !label || seen.has(id)) return undefined
		seen.add(id)
		tags.push({ id, label })
	}
	return tags
}

function normalizePersistedSpawnZones(value: unknown): NpcSpawnZone[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_OBJECTS_PER_FLOOR) return undefined
	const normalized = normalizeNpcSpawnZones(value)
	if (!normalized || normalized.length !== value.length) return undefined
	for (const item of value) {
		if (!isRecord(item)) return undefined
		if (hasOwn(item, 'label') && typeof item.label !== 'string') return undefined
		if (hasOwn(item, 'roleIds')) {
			if (!Array.isArray(item.roleIds) || item.roleIds.some(roleId => !normalizeIdentifier(roleId))) return undefined
		}
	}
	return normalized
}

export function normalizePersistedLayoutData(value: unknown): PersistedFloorLayoutData | undefined {
	if (!isRecord(value) || !isFiniteNumber(value.version) || !Number.isInteger(value.version) || value.version < 0 || value.version > 100) return undefined
	if (hasOwn(value, 'npcConfig') && value.npcConfig !== undefined) return undefined
	const canvas = parseCanvasConfig(value.canvas, true)
	if (!canvas || !Array.isArray(value.floors) || value.floors.length === 0 || value.floors.length > MAX_FLOORS) return undefined

	const floors: PersistedFloorData[] = []
	const floorIds = new Set<string>()
	const objectIds = new Set<string>()
	for (const item of value.floors) {
		if (!isRecord(item)) return undefined
		const id = normalizeIdentifier(item.id)
		const name = normalizeText(item.name)
		const label = normalizeText(item.label)
		if (!id || !name || !label || floorIds.has(id) || !Array.isArray(item.objects) || item.objects.length > MAX_OBJECTS_PER_FLOOR) return undefined
		floorIds.add(id)
		const objects: ObjectPlacement[] = []
		for (const objectValue of item.objects) {
			const placement = normalizeObjectPlacement(objectValue)
			if (!placement || !isValidWallPlacement(placement) || objectIds.has(placement.id)) return undefined
			objectIds.add(placement.id)
			objects.push(placement)
		}
		const floor: PersistedFloorData = { id, name, label, objects }
		if (item.labelColor !== undefined) {
			const labelColor = normalizeAssetColor(item.labelColor)
			if (!labelColor) return undefined
			floor.labelColor = labelColor
		}
		if (item.defaultWalkable !== undefined) {
			if (typeof item.defaultWalkable !== 'boolean') return undefined
			floor.defaultWalkable = item.defaultWalkable
		}
		if (item.walkable !== undefined) {
			const walkable = normalizeFloorWalkable(item.walkable)
			if (!walkable) return undefined
			floor.walkable = walkable
		}
		if (item.spawnZones !== undefined) {
			const spawnZones = normalizePersistedSpawnZones(item.spawnZones)
			if (!spawnZones) return undefined
			floor.spawnZones = spawnZones
		}
		if (item.allowedRoleIds !== undefined) {
			if (!Array.isArray(item.allowedRoleIds) || item.allowedRoleIds.length > MAX_NPC_ENTRIES || item.allowedRoleIds.some(roleId => !normalizeIdentifier(roleId))) return undefined
			const allowedRoleIds = normalizeAllowedRoleIds(item.allowedRoleIds)
			if (allowedRoleIds?.length) floor.allowedRoleIds = allowedRoleIds
		}
		floors.push(floor)
	}

	const layout: PersistedFloorLayoutData = { version: value.version, canvas, floors }
	if (hasOwn(value, 'streetWidthTiles')) {
		if (!isFiniteNumber(value.streetWidthTiles) || !Number.isInteger(value.streetWidthTiles) || value.streetWidthTiles < 5 || value.streetWidthTiles > 20) return undefined
		layout.streetWidthTiles = value.streetWidthTiles
	}
	if (hasOwn(value, 'streetFloorId')) {
		if (typeof value.streetFloorId !== 'string') return undefined
		const streetFloorId = value.streetFloorId.trim()
		if (!streetFloorId || !floorIds.has(streetFloorId)) return undefined
		layout.streetFloorId = streetFloorId
	}
	if (hasOwn(value, 'editorSettings') && value.editorSettings !== undefined) {
		layout.editorSettings = normalizeEditorSettings(value.editorSettings)
	}
	return layout
}

export interface ProjectSettings {
	canvas: CanvasConfig
	editor: EditorSettings
	npc: NpcSimulationConfig
	streetWidthTiles: number
}

export function normalizeProjectSettings(layout: FloorLayoutData): ProjectSettings {
	return {
		canvas: layout.canvas,
		editor: normalizeEditorSettings(layout.editorSettings),
		npc: normalizeNpcConfig(layout.npcConfig) ?? {
			speed: 1 / 30,
			defaultRoleId: '',
			roles: [],
			tasks: [],
			pool: [],
			crossFloorCooldownSeconds: 30,
			progressWatchdogTicks: 120,
			maxRepathAttempts: 4,
			repathCooldownSeconds: 2,
			repathCooldownExponent: 1.5,
			pathBudgetMinPerTick: 2,
			pathBudgetAgentsPerCall: 100,
			chooseTargetMinPerTick: 8,
			chooseTargetAgentsPerSlot: 20,
			wanderMemorySize: 32,
			wanderSmallMapThreshold: 8,
			triggerRatePeriodSeconds: 60,
			frameSimBudgetMs: 6,
			maxSimulationSteps: 8,
		},
		streetWidthTiles: resolveStreetTiles(layout),
	}
}

export function normalizeNpcConfigForPersistence(value: unknown): NpcSimulationConfig | undefined {
	if (!isRecord(value) || !Array.isArray(value.roles) || !Array.isArray(value.tasks) || !Array.isArray(value.pool)) return undefined
	if (value.roles.length > MAX_NPC_ENTRIES || value.tasks.length > MAX_NPC_ENTRIES || value.pool.length > MAX_NPC_ENTRIES) return undefined
	if (typeof value.defaultRoleId !== 'string' || value.defaultRoleId.length > MAX_DATA_STRING_LENGTH) return undefined
	if (!isValidTagTriggerRates(value.tagTriggerRates)) return undefined
	if (value.roles.length === 0) {
		if (value.defaultRoleId.trim() || value.tasks.length > 0 || value.pool.length > 0 || !isFiniteNumber(value.speed) || value.speed < 0 || value.speed > 1) return undefined
		const tagTriggerRates = normalizeTagTriggerRates(value.tagTriggerRates)
		return {
			speed: Math.max(0.001, Math.min(1, value.speed)),
			defaultRoleId: '',
			roles: [],
			tasks: [],
			pool: [],
			crossFloorCooldownSeconds: 30,
			progressWatchdogTicks: 120,
			maxRepathAttempts: 4,
			repathCooldownSeconds: 2,
			repathCooldownExponent: 1.5,
			pathBudgetMinPerTick: 2,
			pathBudgetAgentsPerCall: 100,
			chooseTargetMinPerTick: 8,
			chooseTargetAgentsPerSlot: 20,
			wanderMemorySize: 32,
			wanderSmallMapThreshold: 8,
			triggerRatePeriodSeconds: 60,
			frameSimBudgetMs: 6,
			maxSimulationSteps: 8,
			...(tagTriggerRates ? { tagTriggerRates } : {}),
		}
	}
	if (!isNpcConfig(value)) return undefined
	const normalized = normalizeNpcConfig(value)
	if (!normalized || normalized.roles.length !== value.roles.length || normalized.tasks.length !== value.tasks.length || normalized.pool.length !== value.pool.length) return undefined
	const roleIds = new Set<string>()
	for (const role of normalized.roles) {
		if (roleIds.has(role.id)) return undefined
		roleIds.add(role.id)
	}
	const taskIds = new Set<string>()
	for (const task of normalized.tasks) {
		if (taskIds.has(task.id)) return undefined
		taskIds.add(task.id)
	}
	if (!roleIds.has(normalized.defaultRoleId)) return undefined
	for (let index = 0; index < value.roles.length; index++) {
		const rawRole = value.roles[index]
		if (!isRecord(rawRole) || !Array.isArray(rawRole.taskIds)) return undefined
		const rawTaskIds = rawRole.taskIds.map(taskId => normalizeIdentifier(taskId))
		if (rawTaskIds.some((taskId): taskId is undefined => !taskId)) return undefined
		const canonicalTaskIds = rawTaskIds.filter((taskId): taskId is string => !!taskId)
		if (new Set(canonicalTaskIds).size !== normalized.roles[index].taskIds.length || canonicalTaskIds.some(taskId => !taskIds.has(taskId))) return undefined
	}
	for (const entry of normalized.pool) {
		if (!roleIds.has(entry.roleId)) return undefined
	}
	return normalized
}

export function normalizeBlueprintDataFile(value: unknown): BlueprintDataFile | undefined {
	if (!isRecord(value) || value.$schema !== BLUEPRINT_DATA_SCHEMA || value.version !== BLUEPRINT_DATA_VERSION) return undefined
	const tags = normalizeTagDefinitions(value.tags)
	const layout = normalizePersistedLayoutData(value.layout)
	const npcConfig = normalizeNpcConfigForPersistence(value.npcConfig)
	const assetFile = normalizeOriginAssetFile({ originAssets: value.originAssets })
	if (!tags || !layout || !npcConfig || !assetFile) return undefined
	const assets = assetFile.originAssets
	const assetIds = new Set(assets.map(asset => asset.id))
	const roleIds = new Set(npcConfig.roles.map(role => role.id))
	for (const floor of layout.floors) {
		for (const roleId of floor.allowedRoleIds ?? []) if (!roleIds.has(roleId)) return undefined
		for (const zone of floor.spawnZones ?? []) for (const roleId of zone.roleIds ?? []) if (!roleIds.has(roleId)) return undefined
		for (const object of floor.objects) {
			if (object.type !== CANVAS_WALL_OBJECT_TYPE && !assetIds.has(object.type)) return undefined
		}
	}
	return { $schema: BLUEPRINT_DATA_SCHEMA, version: BLUEPRINT_DATA_VERSION, tags, originAssets: assets, layout, npcConfig }
}

export function validateLayoutIntegrity(layout: FloorLayoutData): string[] {
	const issues: string[] = []
	const globalIds = new Set<string>()
	const knownRoleIds = new Set<string>()
	if (layout.npcConfig) {
		for (const role of layout.npcConfig.roles) knownRoleIds.add(role.id)
	}
	for (const floor of layout.floors) {
		const objectIds = new Set<string>()
		for (const object of floor.objects) {
			if (globalIds.has(object.id)) issues.push(`Duplicate object id: ${object.id}`)
			globalIds.add(object.id)
			objectIds.add(object.id)
			if (object.linkGroupId && !objectIds.has(object.linkGroupId)) {
				issues.push(`Object ${object.id} references missing link group ${object.linkGroupId}`)
			}
		}
		if (floor.allowedRoleIds) {
			for (const roleId of floor.allowedRoleIds) {
				if (knownRoleIds.size > 0 && !knownRoleIds.has(roleId)) {
					issues.push(`Floor ${floor.id} references unknown role: ${roleId}`)
				}
			}
		}
	}
	if (layout.npcConfig) {
		for (const pool of layout.npcConfig.pool) {
			if (!knownRoleIds.has(pool.roleId)) {
				issues.push(`NPC pool references unknown role: ${pool.roleId}`)
			}
		}
		if (!knownRoleIds.has(layout.npcConfig.defaultRoleId)) {
			issues.push(`NPC defaultRoleId references unknown role: ${layout.npcConfig.defaultRoleId}`)
		}
	}
	return issues
}
