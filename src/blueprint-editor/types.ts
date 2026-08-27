export type EditorMode = 'object' | 'draw' | 'move' | 'npc-preview'
export type Rotation = 0 | 90 | 180 | 270

export const STREET_TILES = 8

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

export type TileState = 'walkable' | 'blocked' | 'entrance'

export type WalkableGrid = boolean[][]

export interface TileEdges {
	top?: boolean
	right?: boolean
	bottom?: boolean
	left?: boolean
}

export interface FloorWalkable {
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
}

export interface WallSegment {
	x1: number
	y1: number
	x2: number
	y2: number
}

export function normalizeFloorWalkable(value: unknown): FloorWalkable | undefined {
	if (!value || typeof value !== 'object') return undefined
	const record = value as Record<string, unknown>
	const walkableGrid = normalizeWalkableGrid(record.walkableGrid)
	const tileStates = normalizeTileStates(record.tileStates)
	const tileEdges = normalizeTileEdges(record.tileEdges)
	if (!walkableGrid && !tileStates && !tileEdges) return undefined
	return {
		...(walkableGrid ? { walkableGrid } : {}),
		...(tileStates ? { tileStates } : {}),
		...(tileEdges ? { tileEdges } : {}),
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
	if (!value || typeof value !== 'object') return undefined
	const record = value as Record<string, unknown>
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
	if (!Array.isArray(value)) return undefined
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
		if (!Number.isFinite(x) || !Number.isFinite(y)) continue
		const key = `${x},${y}`
		if (seen.has(key)) continue
		seen.add(key)
		points.push({ x, y })
	}
	return points.length > 0 ? points : undefined
}


export function normalizeInteractConfig(value: unknown): InteractConfig | undefined {
	if (!value || typeof value !== 'object') return undefined
	const rec = value as Record<string, unknown>
	const result: InteractConfig = {}
	if (typeof rec.capacity === 'number' && Number.isFinite(rec.capacity) && rec.capacity > 0) {
		result.capacity = Math.floor(rec.capacity)
	}
	const rawMin = typeof rec.durationMin === 'number' && Number.isFinite(rec.durationMin) ? Math.max(0, rec.durationMin) : undefined
	const rawMax = typeof rec.durationMax === 'number' && Number.isFinite(rec.durationMax) ? Math.max(0, rec.durationMax) : undefined
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
	if (!value || typeof value !== 'object') return undefined
	const rec = value as Record<string, unknown>
	const tl = typeof rec.tl === 'number' && Number.isFinite(rec.tl) ? Math.max(0, rec.tl) : 0
	const tr = typeof rec.tr === 'number' && Number.isFinite(rec.tr) ? Math.max(0, rec.tr) : 0
	const br = typeof rec.br === 'number' && Number.isFinite(rec.br) ? Math.max(0, rec.br) : 0
	const bl = typeof rec.bl === 'number' && Number.isFinite(rec.bl) ? Math.max(0, rec.bl) : 0
	if (tl === 0 && tr === 0 && br === 0 && bl === 0) return undefined
	return { tl, tr, br, bl }
}


export function normalizeTileEdges(value: unknown): TileEdges[][] | undefined {
	if (!Array.isArray(value) || value.length === 0) return undefined
	const rows: TileEdges[][] = []
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0) return undefined
		const cols: TileEdges[] = []
		for (const cell of row) {
			if (!cell || typeof cell !== 'object') return undefined
			const rec = cell as Record<string, unknown>
			const edge: TileEdges = {}
			if (typeof rec.top === 'boolean') edge.top = rec.top
			if (typeof rec.right === 'boolean') edge.right = rec.right
			if (typeof rec.bottom === 'boolean') edge.bottom = rec.bottom
			if (typeof rec.left === 'boolean') edge.left = rec.left
			cols.push(edge)
		}
		rows.push(cols)
	}
	return rows
}


export function normalizeWalkableGrid(value: unknown): WalkableGrid | undefined {
	if (!Array.isArray(value) || value.length === 0) return undefined
	const rows: boolean[][] = []
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0) return undefined
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
	if (!Array.isArray(value) || value.length === 0) return undefined
	const rows: TileState[][] = []
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0) return undefined
		const cols: TileState[] = []
		for (const cell of row) {
			if (cell !== 'walkable' && cell !== 'blocked' && cell !== 'entrance') return undefined
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


export function rotateTileEdges90(edges: TileEdges[][] | undefined, times: number): TileEdges[][] | undefined {
	if (!edges || edges.length === 0) return edges
	const n = ((times % 4) + 4) % 4
	if (n === 0) return edges
	let result = edges
	for (let i = 0; i < n; i++) {
		const rows = result.length
		const cols = result[0]?.length ?? 0
		const rotated: TileEdges[][] = []
		for (let r = 0; r < cols; r++) {
			rotated[r] = []
			for (let c = 0; c < rows; c++) {
				const e = result[rows - 1 - c][r]
				rotated[r][c] = e ? { top: e.left, right: e.top, bottom: e.right, left: e.bottom } : e
			}
		}
		result = rotated
	}
	return result
}


export interface ResolvedObjectDef {
	walkable: boolean
	entranceRequired: boolean
	walkableGrid?: boolean[][]
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
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
	const entranceRequired = asset?.entranceRequired ?? false
	const rotSteps = Math.round(rotation / 90)
	const walkableGrid = rotateGrid90(normalizeWalkableGrid(asset?.walkableGrid), rotSteps)
	const tileStates = rotateGrid90(normalizeTileStates(asset?.tileStates), rotSteps)
	const tileEdges = rotateTileEdges90(normalizeTileEdges(asset?.tileEdges), rotSteps)
	const interactSpots = normalizeInteractSpots(asset?.interactSpots)
	const sourceSize = size
		? (rotSteps % 2 === 0 ? size : { w: size.h, h: size.w })
		: asset?.svgViewBox
	const rotatedInteractSpots = sourceSize
		? rotateInteractSpots90(interactSpots, sourceSize.w, sourceSize.h, rotSteps)
		: interactSpots
	const interact = normalizeInteractConfig(asset?.interact)
	const queue = normalizeNpcQueueConfig(asset?.queue)
	return { walkable, entranceRequired, walkableGrid, tileStates, tileEdges, interactSpots: rotatedInteractSpots, interact, queue }
}


export function normalizeObjectPlacement(value: unknown): ObjectPlacement | undefined {
	if (!value || typeof value !== 'object') return undefined
	const record = value as Record<string, unknown>
	if (typeof record.id !== 'string' || !record.id.trim()) return undefined
	if (typeof record.type !== 'string' || !record.type.trim()) return undefined
	if (typeof record.x !== 'number' || !Number.isFinite(record.x)) return undefined
	if (typeof record.y !== 'number' || !Number.isFinite(record.y)) return undefined
	const rawRotation = typeof record.rotation === 'number' ? record.rotation : 0
	const rotation = [0, 90, 180, 270].includes(rawRotation) ? rawRotation as Rotation : 0
	const placement: ObjectPlacement = {
		id: record.id,
		type: record.type,
		x: record.x,
		y: record.y,
		rotation,
	}
	if (typeof record.subId === 'string' && record.subId) placement.subId = record.subId
	if (typeof record.linkGroupId === 'string' && record.linkGroupId) placement.linkGroupId = record.linkGroupId
	if (typeof record.locked === 'boolean') placement.locked = record.locked
	if (typeof record.subId === 'string' && record.subId) placement.subId = record.subId
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
		if (typeof entry !== 'string') continue
		const trimmed = entry.trim()
		if (!trimmed) continue
		if (seen.has(trimmed)) continue
		seen.add(trimmed)
		ids.push(trimmed)
	}
	return ids.length > 0 ? ids : undefined
}

export interface LinkedPart {
	type: string
	dx: number
	dy: number
	w: number
	h: number
	rotation?: Rotation
	padding?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	fillColor?: string
	label?: string
}

export interface AssetBase {
	id: string
	name: string
	category?: string
	w: number
	h: number
	custom?: boolean
	isWall?: boolean
	walkable?: boolean
	entranceRequired?: boolean
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

export type AssetOrigin = 'drawn' | 'svg-import' | 'linked' | 'flattened'

export interface AssetDef extends AssetBase {
	origin?: AssetOrigin
	pxW?: number
	pxH?: number
	usePx?: boolean
	linkedParts?: LinkedPart[]
	svg?: string
	svgViewBox?: { w: number; h: number }
	svgRoles?: SvgRoleInfo[]
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
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

export function normalizeOriginAsset(value: unknown): AssetDef | undefined {
	if (!value || typeof value !== 'object') return undefined
	const record = value as Record<string, unknown>
	if (typeof record.id !== 'string' || !record.id.trim() || typeof record.name !== 'string' || typeof record.w !== 'number' || !Number.isFinite(record.w) || record.w <= 0 || typeof record.h !== 'number' || !Number.isFinite(record.h) || record.h <= 0) return undefined
	const asset = JSON.parse(JSON.stringify(record)) as AssetDef
	if (asset.origin !== undefined && !['drawn', 'svg-import', 'linked', 'flattened'].includes(asset.origin)) delete asset.origin
	if (record.walkableGrid !== undefined) asset.walkableGrid = normalizeWalkableGrid(record.walkableGrid)
	if (record.tileStates !== undefined) asset.tileStates = normalizeTileStates(record.tileStates)
	if (record.tileEdges !== undefined) asset.tileEdges = normalizeTileEdges(record.tileEdges)
	const tags = normalizeTags(record.tags)
	if (tags !== undefined) asset.tags = tags
	else delete asset.tags
	if (record.interactSpots !== undefined) asset.interactSpots = normalizeInteractSpots(record.interactSpots)
	if (record.interact !== undefined) asset.interact = normalizeInteractConfig(record.interact)
	if (record.queue !== undefined) asset.queue = normalizeNpcQueueConfig(record.queue)
	if (asset.svg) asset.svg = applySvgColorConvention(asset.svg)
	return asset
}

export function normalizeOriginAssetFile(value: unknown): OriginAssetFile | undefined {
	if (!value || typeof value !== 'object') return undefined
	const record = value as Record<string, unknown>
	if (!Array.isArray(record.originAssets)) return undefined
	const assets = new Map<string, AssetDef>()
	for (const value of record.originAssets) {
		const asset = normalizeOriginAsset(value)
		if (asset) assets.set(asset.id, asset)
	}
	return { $schema: typeof record.$schema === 'string' ? record.$schema : 'origin-assets.v1.json', version: typeof record.version === 'number' ? record.version : 1, originAssets: [...assets.values()] }
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
	subId?: string
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
	entranceRequired: boolean
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
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
	if (!Array.isArray(value)) return undefined
	const zones: NpcSpawnZone[] = []
	const seen = new Set<string>()
	for (const item of value) {
		if (!item || typeof item !== 'object') continue
		const record = item as Record<string, unknown>
		if (typeof record.id !== 'string' || !record.id.trim() || seen.has(record.id)) continue
		if (typeof record.x !== 'number' || !Number.isFinite(record.x) || typeof record.y !== 'number' || !Number.isFinite(record.y)) continue
		if (typeof record.w !== 'number' || !Number.isFinite(record.w) || record.w <= 0 || typeof record.h !== 'number' || !Number.isFinite(record.h) || record.h <= 0) continue
		const roleIds = normalizeAllowedRoleIds(record.roleIds)
		seen.add(record.id)
		zones.push({
			id: record.id.trim(),
			label: typeof record.label === 'string' && record.label.trim() ? record.label.trim() : record.id.trim(),
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
	width: { kind: 'number', required: true },
	height: { kind: 'number', required: true },
	tileSize: { kind: 'number', required: true },
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
		if (spec.kind === 'number') ok = typeof value === 'number' && Number.isFinite(value) && value > 0
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
	fillColor?: string
	strokeColor?: string
	label?: string
	walkable?: boolean
	entranceRequired?: boolean
	walkableGrid?: boolean[][]
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
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

export function validateLayoutData(data: unknown): FloorLayoutData | null {
	if (!data || typeof data !== 'object') return null
	const layout = data as FloorLayoutData

	if (typeof layout.version !== 'number' || layout.version < 0) return null
	const canvas = parseCanvasConfig(layout.canvas, true)
	if (!canvas) return null
	Object.assign(layout, { canvas })

	if (!Array.isArray(layout.floors) || layout.floors.length === 0) return null

	for (const floor of layout.floors) {
		if (!floor.id || typeof floor.id !== 'string') return null
		if (!floor.name || typeof floor.name !== 'string') return null
		if (!floor.label || typeof floor.label !== 'string') return null
		if (!Array.isArray(floor.objects)) return null
		if (floor.walkable !== undefined && !normalizeFloorWalkable(floor.walkable)) return null
		if (floor.spawnZones !== undefined && !normalizeNpcSpawnZones(floor.spawnZones)) return null
		if (floor.allowedRoleIds !== undefined && (!Array.isArray(floor.allowedRoleIds) || floor.allowedRoleIds.some(id => typeof id !== 'string' || !id.trim()))) return null
		for (const object of floor.objects) {
			if (!object || typeof object !== 'object') return null
			if (typeof object.id !== 'string' || typeof object.type !== 'string') return null
		}
	}

	if (layout.npcConfig !== undefined && !isNpcConfig(layout.npcConfig)) return null

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

export function isNpcConfig(value: unknown): value is NpcSimulationConfig {
	if (!value || typeof value !== 'object') return false
	const c = value as Record<string, unknown>
	if (typeof c.speed !== 'number' || !isFinite(c.speed)) return false
	if (typeof c.defaultRoleId !== 'string') return false
	if (!Array.isArray(c.roles)) return false
	if (!Array.isArray(c.tasks)) return false
	if (!Array.isArray(c.pool)) return false
	if (c.roles.some((r: unknown) => {
		if (!r || typeof r !== 'object') return true
		const role = r as Record<string, unknown>
		if (typeof role.id !== 'string' || typeof role.label !== 'string' || typeof role.color !== 'string') return true
		if (typeof role.focusChance !== 'number' || role.focusChance < 0 || role.focusChance > 100) return true
		if (!Array.isArray(role.focusTags) || role.focusTags.some((t: unknown) => typeof t !== 'string')) return true
		if (!Array.isArray(role.restrictedTags) || role.restrictedTags.some((t: unknown) => typeof t !== 'string')) return true
		if (!Array.isArray(role.taskIds) || role.taskIds.some((t: unknown) => typeof t !== 'string')) return true
		return false
	})) return false
	if (c.tasks.some((t: unknown) => {
		if (!t || typeof t !== 'object') return true
		const task = t as Record<string, unknown>
		return typeof task.id !== 'string' || typeof task.label !== 'string' || !Array.isArray(task.tags) || task.tags.some((x: unknown) => typeof x !== 'string')
	})) return false
	if (c.pool.some((p: unknown) => {
		if (!p || typeof p !== 'object') return true
		const pool = p as Record<string, unknown>
		if (typeof pool.roleId !== 'string' || typeof pool.count !== 'number') return true
		return pool.floorIds !== undefined && (!Array.isArray(pool.floorIds) || pool.floorIds.some((id: unknown) => typeof id !== 'string'))
	})) return false
	if (c.tagTriggerRates !== undefined) {
		if (typeof c.tagTriggerRates !== 'object' || c.tagTriggerRates === null) return false
		for (const [tag, rate] of Object.entries(c.tagTriggerRates as Record<string, unknown>)) {
			if (typeof tag !== 'string' || typeof rate !== 'number' || !isFinite(rate) || rate < 0 || rate > 100) return false
		}
	}
	return true
}

export function normalizeNpcConfig(value: unknown): NpcSimulationConfig | undefined {
	if (!isNpcConfig(value)) return undefined
	const config = JSON.parse(JSON.stringify(value)) as NpcSimulationConfig
	config.speed = Math.max(0.001, Math.min(1, config.speed))
	for (const role of config.roles) {
		role.label = role.label.trim()
		role.focusTags = normalizeTags(role.focusTags) ?? []
		role.restrictedTags = normalizeTags(role.restrictedTags) ?? []
		role.taskIds = [...new Set(role.taskIds.filter(taskId => config.tasks.some(task => task.id === taskId)))]
		role.focusChance = Math.max(0, Math.min(100, Math.floor(role.focusChance)))
		if (role.spawnRule) {
			role.spawnRule.targetTags = normalizeTags(role.spawnRule.targetTags)
			role.spawnRule.count = Math.max(0, Math.min(1000, Math.floor(role.spawnRule.count)))
		}
	}
	for (const task of config.tasks) {
		task.label = task.label.trim()
		task.tags = normalizeTags(task.tags) ?? []
	}
	const rates: Record<string, number> = {}
	for (const [tag, rate] of Object.entries(config.tagTriggerRates ?? {})) {
		const normalized = normalizeTags([tag])?.[0]
		if (normalized && Number.isFinite(rate) && rate > 0) rates[normalized] = Math.max(0, Math.min(100, Math.floor(rate)))
	}
	config.tagTriggerRates = Object.keys(rates).length ? rates : undefined
	config.pool = config.pool
		.filter(entry => config.roles.some(role => role.id === entry.roleId))
		.map(entry => ({
			roleId: entry.roleId,
			count: Math.max(0, Math.min(1000, Math.floor(entry.count))),
			...(entry.floorIds?.length ? { floorIds: [...new Set(entry.floorIds.map(id => id.trim()).filter(Boolean))] } : {}),
		}))
	if (!config.roles.some(role => role.id === config.defaultRoleId)) config.defaultRoleId = config.roles[0]?.id ?? ''
	return config
}

export function normalizeTags(value: unknown): string[] | undefined {
	if (value === undefined || value === null) return undefined
	if (!Array.isArray(value)) return undefined
	if (value.length === 0) return []
	const seen = new Set<string>()
	const result: string[] = []
	for (const tag of value) {
		if (typeof tag !== 'string') return undefined
		const id = tag.trim().toLowerCase()
		if (!id || seen.has(id)) continue
		seen.add(id)
		result.push(id)
	}
	return result
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

function isAssetBase(value: unknown): value is AssetBase {
	if (!value || typeof value !== 'object') return false
	const a = value as Record<string, unknown>
	return typeof a.id === 'string'
		&& typeof a.name === 'string'
		&& typeof a.w === 'number'
		&& typeof a.h === 'number'
}

function isRotation(value: unknown): value is Rotation {
	return typeof value === 'number' && [0, 90, 180, 270].includes(value)
}

function isLinkedPart(value: unknown): value is LinkedPart {
	if (!value || typeof value !== 'object') return false
	const p = value as Record<string, unknown>
	return typeof p.type === 'string'
		&& typeof p.dx === 'number'
		&& typeof p.dy === 'number'
		&& typeof p.w === 'number'
		&& typeof p.h === 'number'
		&& (p.rotation === undefined || isRotation(p.rotation))
}

export function isSimpleAsset(value: unknown): value is AssetDef {
	if (!isAssetBase(value)) return false
	const a = value as unknown as Record<string, unknown>
	if (Array.isArray(a.linkedParts) && a.linkedParts.length > 0) return false
	if (typeof a.svg === 'string' && a.svg) return false
	return typeof a.usePx === 'boolean' || a.usePx === undefined
}

export function isLinkedAsset(value: unknown): value is AssetDef {
	if (!isAssetBase(value)) return false
	const a = value as unknown as Record<string, unknown>
	return Array.isArray(a.linkedParts) && a.linkedParts.length > 0 && a.linkedParts.every(isLinkedPart)
}

export function isSvgAsset(value: unknown): value is AssetDef {
	if (!isAssetBase(value)) return false
	const a = value as unknown as Record<string, unknown>
	if (Array.isArray(a.linkedParts) && a.linkedParts.length > 0) return false
	return typeof a.svg === 'string'
		&& !!a.svgViewBox
		&& typeof (a.svgViewBox as Record<string, unknown>).w === 'number'
		&& typeof (a.svgViewBox as Record<string, unknown>).h === 'number'
}

export function isAssetDef(value: unknown): value is AssetDef {
	return isSimpleAsset(value) || isLinkedAsset(value) || isSvgAsset(value)
}
