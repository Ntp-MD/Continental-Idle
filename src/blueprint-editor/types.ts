export type EditorMode = 'wall' | 'zone' | 'object' | 'move' | 'erase' | 'npc-preview'
export type Rotation = 0 | 90 | 180 | 270

export type RoomType =
	| 'wall' | 'room' | 'hallway' | 'elevator' | 'entrance'
	| 'reception' | 'kitchen' | 'bar' | 'guestRoom' | 'armory' | 'safeHouse'
	| 'lounge' | 'concierge' | 'laundry' | 'staffRoom' | 'controlCenter'
	| 'datacenter' | 'rooftop' | 'loadingBay' | 'vault' | 'blackMarket'

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
	anchorPoints?: [number, number][]
}

export interface RoomData {
	id: string
	x: number
	y: number
	w: number
	h: number
	label: string
	category?: string
	roomType?: RoomType
	walkable?: boolean
	entrances?: EntrancePoint[]
	anchorPoints?: [number, number][]
	radius?: number
	locked?: boolean
	fillColor?: string
	rx?: { tl: number; tr: number; br: number; bl: number }
	padding?: number
	tags?: string[]
}

// Legacy NPC types kept for migration only
export type NpcSimType = 'staff' | 'guest' | 'assassin' | 'visitor'

export interface LegacyNpcRoleBehavior {
	targetTags: string[]
	randomChance: number
}

export interface LegacyNpcSimulationConfig {
	count: number
	speed: number
	color: string
	role: NpcSimType
	roleBehaviors: Record<NpcSimType, LegacyNpcRoleBehavior>
}

export interface NpcTask {
	id: string
	label: string
	tags: string[]
}

export interface NpcRoleBehavior {
	focusTaskId?: string
	focusChance: number
	restrictedTaskIds: string[]
}

export interface NpcRole {
	id: string
	label: string
	color: string
	behavior: NpcRoleBehavior
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
	roomId: string | null
	color: string
	pauseTimer: number
	pathIdx: number
	path: [number, number][]
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
	walkable?: boolean
	entranceRequired?: boolean
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	tileEdges?: TileEdges[][]
	anchorPoints?: [number, number][]
	roomId?: string
	customProps?: ObjectCustomProps
	instanceLabel?: string
	validationRule?: ValidationRule
}

export interface ZoneData {
	id: string
	x: number
	y: number
	w: number
	h: number
	label: string
	color: string
	tags?: string[]
}

export interface FloorData {
	id: string
	name: string
	label: string
	rooms: RoomData[]
	objects: ObjectData[]
	zones?: ZoneData[]
	defaultWalkable?: boolean
}

export interface CanvasConfig {
	width: number
	height: number
	tileSize: number
}

export interface ObjectCustomProps {
	notes?: string
	tags?: string[]
	metadata?: Record<string, string | number>
}

export interface ValidationRule {
	required?: string[]
	minValues?: Record<string, number>
	maxValues?: Record<string, number>
}

export interface RoomTemplateObject {
	type: string
	dx: number
	dy: number
	w: number
	h: number
	rotation: Rotation
	padding?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	fillColor?: string
	radius?: number
	label?: string
	instanceLabel?: string
	customProps?: ObjectCustomProps
	linkGroupId?: string
}

export interface RoomTemplate {
	id: string
	name: string
	category?: string
	w: number
	h: number
	label: string
	roomType?: RoomType
	radius?: number
	tags?: string[]
	fillColor?: string
	rx?: { tl: number; tr: number; br: number; bl: number }
	padding?: number
	objects?: RoomTemplateObject[]
}

export interface FloorLayoutData {
	version: number
	canvas: CanvasConfig
	floors: FloorData[]
	objectCustomProps?: Record<string, ObjectCustomProps>
	instanceLabels?: Record<string, string>
	validationRules?: Record<string, ValidationRule>
	roomTemplates?: RoomTemplate[]
	npcConfig?: NpcSimulationConfig
	globalTags?: string[]
	deletedDefaultIds?: string[]
}

export interface Rect {
	x: number
	y: number
	w: number
	h: number
}

export type Selection = { type: 'room' | 'object'; id: string } | null

export interface MultiSelection {
	type: 'object'
	ids: string[]
	roomId?: string
}

export type EntityType = 'room' | 'object' | 'zone'

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
		if (!Array.isArray(floor.rooms)) return null
		if (!Array.isArray(floor.objects)) return null
		if (floor.zones !== undefined && (!Array.isArray(floor.zones) || floor.zones.some(zone => !zone || typeof zone !== 'object' || (zone.tags !== undefined && (!Array.isArray(zone.tags) || zone.tags.some(tag => typeof tag !== 'string')))))) return null
		if (floor.rooms.some(room => !room || typeof room !== 'object' || (room.tags !== undefined && (!Array.isArray(room.tags) || room.tags.some(tag => typeof tag !== 'string'))))) return null
		if (floor.objects.some(object => !object || typeof object !== 'object' || (object.customProps?.tags !== undefined && (!Array.isArray(object.customProps.tags) || object.customProps.tags.some(tag => typeof tag !== 'string'))))) return null
	}

	if (layout.npcConfig !== undefined && !isNpcConfig(layout.npcConfig)) return null

	return layout
}

export function isNpcConfig(value: unknown): value is NpcSimulationConfig {
	if (!value || typeof value !== 'object') return false
	const c = value as Record<string, unknown>
	if (typeof c.speed !== 'number' || !isFinite(c.speed)) return false
	if (typeof c.defaultRoleId !== 'string') return false
	if (!Array.isArray(c.roles) || c.roles.length === 0) return false
	if (!Array.isArray(c.tasks)) return false
	if (!Array.isArray(c.pool)) return false
	if (c.roles.some((r: unknown) => {
		if (!r || typeof r !== 'object') return true
		const role = r as Record<string, unknown>
		if (typeof role.id !== 'string' || typeof role.label !== 'string' || typeof role.color !== 'string') return true
		const b = role.behavior as Record<string, unknown> | undefined
		if (!b || typeof b !== 'object') return true
		if (b.focusTaskId !== undefined && typeof b.focusTaskId !== 'string') return true
		if (typeof b.focusChance !== 'number' || b.focusChance < 0 || b.focusChance > 100) return true
		if (!Array.isArray(b.restrictedTaskIds) || b.restrictedTaskIds.some((id: unknown) => typeof id !== 'string')) return true
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
	return true
}

export function validateLayoutIntegrity(layout: FloorLayoutData): string[] {
	const issues: string[] = []
	const globalIds = new Set<string>()
	for (const floor of layout.floors) {
		const roomIds = new Set<string>()
		for (const room of floor.rooms) {
			if (globalIds.has(room.id)) issues.push(`Duplicate room id: ${room.id}`)
			globalIds.add(room.id)
			roomIds.add(room.id)
		}
		const objectIds = new Set<string>()
		for (const object of floor.objects) {
			if (globalIds.has(object.id)) issues.push(`Duplicate object id: ${object.id}`)
			globalIds.add(object.id)
			objectIds.add(object.id)
		}
		for (const object of floor.objects) {
			if (object.roomId && !roomIds.has(object.roomId)) {
				issues.push(`Object ${object.id} references missing room ${object.roomId}`)
			}
			if (object.linkGroupId && !objectIds.has(object.linkGroupId)) {
				issues.push(`Object ${object.id} references missing link group ${object.linkGroupId}`)
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
