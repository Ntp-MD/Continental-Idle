/**
 * types.ts - the Architecture Agent Harness vocabulary.
 *
 * Everything the harness passes between its stages (world model, render, checks,
 * findings, KPI vector) is declared here so no stage invents a private shape.
 * Rule ids quoted in `Finding.rule` resolve into architecture-skill/research/.
 */
import type { TileState } from '../../src/blueprint-editor/domain/types'

export type Severity = 'critical' | 'major' | 'moderate' | 'minor'

/** Three-valued, per SKILL.md ## Validation. An unknown is never promoted to pass. */
export type Verdict = 'pass' | 'fail' | 'unknown'

export type CheckCategory =
	| 'model-integrity'
	| 'geometry'
	| 'circulation'
	| 'safety'
	| 'interior'
	| 'operations'
	| 'environment'
	| 'experience'

export interface Cell {
	x: number
	y: number
}

export interface Bounds {
	minX: number
	minY: number
	maxX: number
	maxY: number
}

/**
 * One measured defect. `cells` is mandatory when the finding is spatial: the
 * counterexample is coordinates, never an adjective (VA-08, VA-18).
 */
export interface Finding {
	id: string
	check: string
	category: CheckCategory
	severity: Severity
	verdict: Verdict
	floorId?: string
	roomId?: string
	metric: string
	actual: string
	required: string
	rule: string
	/** Why this is bad. Negative examples carry their reason, not just their shape. */
	why: string
	/** Cheapest repair on the blast-radius ladder: retag < move door < resize < move wall < move core. */
	correction: string
	cells: Cell[]
}

export interface DoorNode {
	id: string
	floorId: string
	/** Host door-group key, `${minRow},${minCol}` from groupDoorCells. */
	groupKey: string
	axis: 'x' | 'y'
	cells: Cell[]
	widthTiles: number
	/** Qualified `RoomNode.id` values on each side; null when the door does not separate two derived rooms. */
	connects: [string, string] | null
}

export interface FurnitureNode {
	id: string
	floorId: string
	objectId: string
	assetId: string
	assetName: string
	tags: string[]
	rotation: 0 | 90 | 180 | 270
	bounds: Bounds
	cells: Cell[]
	blockedCells: Cell[]
	walkable: boolean
	portal: boolean
	roomId: string | null
}

export interface RoomNode {
	id: string
	floorId: string
	localId: string
	typeId: string
	typeLabel: string
	privacy: 'open' | 'private'
	cells: Cell[]
	bounds: Bounds
	areaTiles: number
	areaM2: number
	/** Usable span after the wall tax, in tiles. */
	interiorW: number
	interiorH: number
	fixtureTags: string[]
	fixtureCount: number
	doorIds: string[]
	/** True when the host typed it `hall` - it counts as circulation, not occupancy. */
	isCorridor: boolean
	/** True when most of the region is the street ring: site, not building, and never programme. */
	isStreet: boolean
	/** Deepest tile of the room measured from the building envelope - the plan-depth number. */
	depthFromFacade: number
	/** Shallowest tile: 1 means the room touches the facade wall, more means it has no glass. */
	minDepthFromFacade: number
	/** Walkable tiles with no furniture block-out: what a person can actually stand on. */
	freeCells: number
	/** Narrowest free run through the room, in tiles - the interior-coupling number. */
	minFreeRun: number
}

export interface PortalNode {
	id: string
	floorId: string
	objectId: string
	assetId: string
	cells: Cell[]
	spotCells: Cell[]
	destinationFloorIds: string[]
}

export interface FloorCounts {
	walkable: number
	blocked: number
	door: number
	roomTiles: number
	circulationTiles: number
	structureTiles: number
	/** Authored walkable/door tiles an object blocks: furniture eats floor, and hiding it inflates area. */
	furnitureTiles: number
	/** Tiles in the street ring on the street floor - site, not building plate. */
	streetTiles: number
	gridTiles: number
	/** True when occupied + circulation + structure + furniture + street === grid. */
	reconciles: boolean
	unreachableTiles: number
}

export interface FloorNode {
	id: string
	name: string
	label: string
	index: number
	rows: number
	cols: number
	/** Authored tile states, before furniture is stamped. */
	tileStates: TileState[][]
	/** Effective walkability after furniture stamping, from the host engine. */
	walkable: boolean[][]
	/** Tiles in the street ring: outside the building, excluded from plate and room semantics. */
	street: boolean[][]
	rooms: RoomNode[]
	corridors: RoomNode[]
	doors: DoorNode[]
	portals: PortalNode[]
	furniture: FurnitureNode[]
	counts: FloorCounts
	isStreetFloor: boolean
}

export type RelationKind = 'door' | 'shared-wall' | 'vertical' | 'serves'

export interface Relation {
	kind: RelationKind
	from: string
	to: string
	/** Traversal cost proxy: 1 for a door, shared-wall length in tiles, portal hop for vertical. */
	weight: number
	floorId?: string
}

export interface SiteRecord {
	streetWidthTiles: number
	streetFloorId: string | null
	cols: number
	rows: number
	metresPerTile: number
	/** Grid edges treated as façade. The host has no orientation, so this is declared, not derived. */
	facadeEdges: ('north' | 'south' | 'east' | 'west')[]
	/** Which grid edge north is bound to - an assumption the agent must state (EN-26). */
	north: 'north' | 'south' | 'east' | 'west'
}

export interface VerticalRecord {
	portalFloorIds: string[]
	floorsWithPortals: number
	floorsWithoutPortals: string[]
	/** Portal cell sets that repeat on every portal floor - the stack discipline (MS-01). */
	stackedPortalKeys: string[]
	stackDrift: { floorId: string; missing: string[]; extra: string[] }[]
}

/** A staffed post the simulation says must exist, derived from an npc task carrying a post asset. */
export interface StationRequirement {
	taskId: string
	label: string
	assetId: string
	tags: string[]
	/** How many agents of each role that runs this post the floor is given. */
	roles: { roleId: string; label: string; count: number }[]
}

export interface FloorOccupancy {
	floorId: string
	/** Agents the simulation is told to place on this floor - the host's only occupant figure. */
	occupants: number
	byRole: { roleId: string; label: string; count: number }[]
	stations: StationRequirement[]
}

/**
 * Declared occupancy, read from `npcConfig`. A plan judged without a load cannot produce a capacity
 * verdict at all, and the host already carries the load - it was simply never read.
 */
/**
 * Arrival demand the host payload does not carry: how many people walk in per day, and the PP-08
 * service assumptions used to turn that into staffed positions. Declared, never inferred.
 */
export interface ArrivalSpec {
	walkInsPerDay: number
	walkOutsPerDay: number
	serviceMinutesPerArrival: number
	peakWindowMinutes: number
	peakFactor: number
}

export interface OccupancyRecord {
	declared: boolean
	floors: FloorOccupancy[]
	/** Null when no arrival spec is declared, in which case station counts cannot be judged. */
	arrival: ArrivalSpec | null
	note: string
}

export interface ArchWorld {
	source: string
	builtAt: string
	canvas: { width: number; height: number; tileSize: number; cols: number; rows: number }
	site: SiteRecord
	floors: FloorNode[]
	relations: Relation[]
	vertical: VerticalRecord
	occupancy: OccupancyRecord
	/** Metres per tile is a skill convention, never engine data (SKILL.md host facts). */
	scaleNote: string
}

export interface Kpi {
	key: string
	label: string
	value: number
	unit: string
	/** Interpretation band and where the band came from - a KPI without a band is not judgeable. */
	band: string
	bandSource: string
	/** higher-is-better | lower-is-better | target-band */
	direction: 'up' | 'down' | 'band'
	gate: boolean
}

export interface FloorReport {
	floorId: string
	label: string
	findings: Finding[]
	kpis: Kpi[]
}

export interface EvaluationReport {
	source: string
	evaluatedAt: string
	/** Model-integrity gate verdict; on failure every semantic verdict is `unknown`. */
	gate: { verdict: Verdict; findings: Finding[] }
	floors: FloorReport[]
	building: { findings: Finding[]; kpis: Kpi[] }
	counts: Record<Severity, number>
	/** A Critical finding blocks any "done" claim (SKILL.md ## Failure Detection). */
	blocksDone: boolean
	verdict: Verdict
}
