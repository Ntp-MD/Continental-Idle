import { isKnownTag } from './tagRegistry'

export type EditorMode = 'object' | 'move' | 'erase' | 'npc-preview'
export type Rotation = 0 | 90 | 180 | 270

export interface EntrancePoint {
	side: 'top' | 'bottom' | 'left' | 'right'
	offset: number
	width: number
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

export interface InteractSpot {
	x: number
	y: number
}

export interface InteractConfig {
	capacity?: number

	durationMin?: number

	durationMax?: number
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
}


export function resolveObjectDef(
	rotation: Rotation,
	asset: AssetDef | undefined,
): ResolvedObjectDef {
	const walkable = asset?.walkable ?? false
	const entranceRequired = asset?.entranceRequired ?? false
	const rotSteps = Math.round(rotation / 90)
	const walkableGrid = rotateGrid90(normalizeWalkableGrid(asset?.walkableGrid), rotSteps)
	const tileStates = rotateGrid90(normalizeTileStates(asset?.tileStates), rotSteps)
	const tileEdges = rotateTileEdges90(normalizeTileEdges(asset?.tileEdges), rotSteps)
	const interactSpots = normalizeInteractSpots(asset?.interactSpots)
	const interact = normalizeInteractConfig(asset?.interact)
	return { walkable, entranceRequired, walkableGrid, tileStates, tileEdges, interactSpots, interact }
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
	defaultBgColor?: string
	defaultLabelColor?: string
	defaultLabel?: string
	defaultRadius?: number
	defaultLabelPadding?: number
	defaultCustomProps?: ObjectCustomProps
	defaultInstanceLabel?: string
	defaultValidationRule?: ValidationRule
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
}

export interface OriginAssetFile {
	$schema: string
	version: number
	originAssets: AssetDef[]
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
	if (record.interactSpots !== undefined) asset.interactSpots = normalizeInteractSpots(record.interactSpots)
	if (record.interact !== undefined) asset.interact = normalizeInteractConfig(record.interact)
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

	floorLabels?: string[]

	targetTags?: string[]

	count: number

	speedMultiplier?: number
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
	pauseTimer: number
	pathIdx: number
	path: [number, number][]
	interactTargetKey: string | null
	interactSpotKey: string | null
	interactDurationMin: number
	interactDurationMax: number
}

export interface ObjectData {
	id: string
	subId?: string
	type: string
	x: number
	y: number
	w: number
	h: number
	rotation: Rotation
	radius?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	labelPadding?: number
	padding?: number
	collapsed?: boolean
	linkGroupId?: string
	fillColor?: string
	locked?: boolean
	label?: string
	isWall?: boolean
	customProps?: ObjectCustomProps
	instanceLabel?: string
	validationRule?: ValidationRule
}

export interface FloorData {
	id: string
	name: string
	label: string
	labelColor?: string
	objects: ObjectData[]
	defaultWalkable?: boolean

	allowedRoleIds?: string[]
}

export interface CanvasConfig {
	width: number
	height: number
	tileSize: number
}

export interface ObjectCustomProps {
	notes?: string
	metadata?: Record<string, string | number>
}

export interface ValidationRule {
	required?: string[]
	minValues?: Record<string, number>
	maxValues?: Record<string, number>
}

export interface FloorLayoutData {
	version: number
	canvas: CanvasConfig
	floors: FloorData[]
	objectCustomProps?: Record<string, ObjectCustomProps>
	instanceLabels?: Record<string, string>
	validationRules?: Record<string, ValidationRule>
	npcConfig?: NpcSimulationConfig
}


export interface SyncedCanvas {
	width: number
	height: number
	tileSize: number
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
	label?: string
	walkable?: boolean
	entranceRequired?: boolean
	walkableGrid?: boolean[][]
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
}


export interface SyncedFloor {
	defaultWalkable?: boolean
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

export type Selection = { type: 'object'; id: string } | null

export interface MultiSelection {
	type: 'object'
	ids: string[]
}

export type EntityType = 'object'

export interface EntityRef {
	type: EntityType
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
	if (!layout.canvas || typeof layout.canvas !== 'object') return null
	if (typeof layout.canvas.width !== 'number' || layout.canvas.width <= 0) return null
	if (typeof layout.canvas.height !== 'number' || layout.canvas.height <= 0) return null
	if (typeof layout.canvas.tileSize !== 'number' || layout.canvas.tileSize <= 0) return null

	if (!Array.isArray(layout.floors) || layout.floors.length === 0) return null

	for (const floor of layout.floors) {
		if (!floor.id || typeof floor.id !== 'string') return null
		if (!floor.name || typeof floor.name !== 'string') return null
		if (!floor.label || typeof floor.label !== 'string') return null
		if (!Array.isArray(floor.objects)) return null
		if (floor.allowedRoleIds !== undefined && (!Array.isArray(floor.allowedRoleIds) || floor.allowedRoleIds.some(id => typeof id !== 'string' || !id.trim()))) return null
		for (const object of floor.objects) {
			if (!object || typeof object !== 'object') return null
			if (typeof object.id !== 'string' || typeof object.type !== 'string') return null
		}
	}

	if (layout.npcConfig !== undefined && !isNpcConfig(layout.npcConfig)) return null

	return layout
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
		return typeof pool.roleId !== 'string' || typeof pool.count !== 'number'
	})) return false
	if (c.tagTriggerRates !== undefined) {
		if (typeof c.tagTriggerRates !== 'object' || c.tagTriggerRates === null) return false
		for (const [tag, rate] of Object.entries(c.tagTriggerRates as Record<string, unknown>)) {
			if (typeof tag !== 'string' || typeof rate !== 'number' || !isFinite(rate) || rate < 0 || rate > 100) return false
		}
	}
	return true
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
		for (const role of layout.npcConfig.roles) {
			for (const tag of role.focusTags) {
				if (!isKnownTag(tag)) issues.push(`Role ${role.id} has unknown focusTag: ${tag}`)
			}
			for (const tag of role.restrictedTags) {
				if (!isKnownTag(tag)) issues.push(`Role ${role.id} has unknown restrictedTag: ${tag}`)
			}
		}
		for (const pool of layout.npcConfig.pool) {
			if (!knownRoleIds.has(pool.roleId)) {
				issues.push(`NPC pool references unknown role: ${pool.roleId}`)
			}
		}
		if (!knownRoleIds.has(layout.npcConfig.defaultRoleId)) {
			issues.push(`NPC defaultRoleId references unknown role: ${layout.npcConfig.defaultRoleId}`)
		}
		if (layout.npcConfig.tagTriggerRates) {
			for (const tag of Object.keys(layout.npcConfig.tagTriggerRates)) {
				if (!isKnownTag(tag)) issues.push(`tagTriggerRates has unknown tag: ${tag}`)
			}
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
