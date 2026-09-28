/**
 * world.ts - the persistent world model stage of the Architecture Agent Harness.
 *
 * The agent must not hold the building in prose. This module turns an authored payload into
 * a queryable structure - site, floors, rooms, corridors, doors, portals, furniture and the
 * relationship graph between them - so a later revision edits a known world instead of
 * redrawing one.
 *
 * Every spatial fact here comes from the HOST engine (buildNpcEngineLayout, deriveFloorRooms,
 * groupDoorCells, resolveRoomType). The harness derives, it never re-implements: a validator
 * that disagrees with the engine about what a room is would be validating a fiction.
 */
import fs from 'node:fs'
import path from 'node:path'
import { buildNpcEngineLayout, isStreetTile, pixelToCell } from '../../src/engine/npc/layoutBuild'
import type { NpcLayoutBuildResult } from '../../src/engine/npc/layoutBuild'
import { deriveFloorRooms } from '../../src/engine/npc/rooms'
import { tileKey } from '../../src/engine/npc/keys'
import { migrate } from '../../src/blueprint-editor/store/migrate'
import { buildAssetMap } from '../../src/blueprint-editor/assets/assetUtils'
import {
	assetPixelSize,
	groupDoorCells,
	resolveFloorTileStates,
	ROOM_TYPE_SPECS,
	HALL_ROOM_TYPE,
	type AssetDef,
	type FloorData,
	type FloorLayoutData,
	type TileState,
} from '../../src/blueprint-editor/domain/types'
import type {
	ArchWorld,
	ArrivalSpec,
	Bounds,
	Cell,
	DoorNode,
	FloorCounts,
	FloorNode,
	FloorOccupancy,
	FurnitureNode,
	OccupancyRecord,
	PortalNode,
	Relation,
	StationRequirement,
	RoomNode,
	SiteRecord,
	VerticalRecord,
} from './types'

/** 1 tile = 0.5 m is a skill convention; the engine stores tiles and pixels only. */
export const METRES_PER_TILE = 0.5

const PORTAL_TAG = 'portal'

/** Labels come from the host's own room vocabulary, never from a harness-private synonym. */
const LABEL_BY_TYPE = new Map<string, string>([
	...ROOM_TYPE_SPECS.map(spec => [spec.id, spec.label] as const),
	[HALL_ROOM_TYPE.id, HALL_ROOM_TYPE.label] as const,
])

export interface WorldBundle {
	world: ArchWorld
	layout: FloorLayoutData
	assets: AssetDef[]
	assetMap: Map<string, AssetDef>
	engine: NpcLayoutBuildResult
	sourcePath: string
}

interface RawDataFile {
	layout?: unknown
	originAssets?: AssetDef[]
	npcConfig?: unknown
	canvas?: unknown
	floors?: unknown
}

interface RawRole { id: string; label?: string; taskIds?: string[] }
interface RawTask { id: string; label?: string; tags?: string[]; post?: { assetId?: string } }
interface RawPool { roleId: string; count: number; floorIds?: string[] }

/**
 * Declared occupancy, read from the host's own `npcConfig`. Every capacity verdict needs an occupant
 * load, and this payload has carried one all along: the simulation population per floor. It is a
 * design load and not a code occupant load - the two are never mixed in a report.
 */
/**
 * Declared arrival demand, read from `spec.json` beside this module. The host payload carries a
 * population but not a footfall rate, and PP-08's desk arithmetic needs the rate - so it is declared
 * here rather than guessed in a check. Absent means station counts stay unjudgeable.
 */
function readArrivalSpec(): ArrivalSpec | null {
	const url = new URL('./spec.json', import.meta.url)
	if (!fs.existsSync(url)) return null
	const raw = JSON.parse(fs.readFileSync(url, 'utf8')) as { arrival?: ArrivalSpec }
	return raw.arrival ?? null
}

export function readOccupancy(config: unknown, layout: FloorLayoutData): OccupancyRecord {
	const source = config as { roles?: RawRole[]; tasks?: RawTask[]; pool?: RawPool[] } | undefined
	const pool = Array.isArray(source?.pool) ? source.pool : []
	const arrival = readArrivalSpec()
	if (!pool.length) {
		return { declared: false, floors: [], arrival, note: 'no npcConfig.pool in this payload, so no occupant load is declared and every capacity verdict is unavailable' }
	}
	const rolesById = new Map((source?.roles ?? []).map(role => [role.id, role]))
	const tasksById = new Map((source?.tasks ?? []).map(task => [task.id, task]))
	const floors: FloorOccupancy[] = layout.floors.map(floor => {
		const byRole = pool
			.filter(entry => (entry.floorIds ?? []).includes(floor.id))
			.map(entry => ({ roleId: entry.roleId, label: rolesById.get(entry.roleId)?.label ?? entry.roleId, count: entry.count }))
			.filter(entry => entry.count > 0)
		const occupants = byRole.reduce((sum, entry) => sum + entry.count, 0)
		// A task with a post asset is a promise that a piece of furniture and the room around it exist.
		const stations: StationRequirement[] = []
		for (const entry of byRole) {
			for (const taskId of rolesById.get(entry.roleId)?.taskIds ?? []) {
				const task = tasksById.get(taskId)
				const assetId = task?.post?.assetId
				if (!task || !assetId) continue
				const existing = stations.find(station => station.taskId === task.id)
				if (existing) existing.roles.push({ roleId: entry.roleId, label: entry.label, count: entry.count })
				else stations.push({ taskId: task.id, label: task.label ?? task.id, assetId, tags: task.tags ?? [], roles: [{ roleId: entry.roleId, label: entry.label, count: entry.count }] })
			}
		}
		return { floorId: floor.id, occupants, byRole, stations }
	})
	return { declared: true, floors, arrival, note: 'occupancy is the simulation population declared in npcConfig.pool: a design load, not a code occupant load' }
}

export function readDataFile(filePath: string): { layout: FloorLayoutData; assets: AssetDef[]; occupancy: OccupancyRecord } {
	const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as RawDataFile
	const assets = Array.isArray(raw.originAssets) ? raw.originAssets : []
	// Accept both the full data file ({layout, originAssets, npcConfig}) and a bare FloorLayoutData.
	const candidate = raw.layout ?? (raw.floors && raw.canvas ? raw : undefined)
	if (!candidate) throw new Error(`${filePath}: no layout object found (expected {layout,originAssets} or FloorLayoutData)`)
	const { layout } = migrate(candidate, assets, raw.npcConfig)
	return { layout, assets, occupancy: readOccupancy(raw.npcConfig, layout) }
}

export function gridDimensions(layout: FloorLayoutData): { cols: number; rows: number } {
	const tileSize = Math.max(1, Math.round(layout.canvas.tileSize))
	return { cols: Math.max(0, Math.ceil(layout.canvas.width / tileSize)), rows: Math.max(0, Math.ceil(layout.canvas.height / tileSize)) }
}

function boundsOf(cells: readonly Cell[]): Bounds {
	let minX = Number.POSITIVE_INFINITY
	let minY = Number.POSITIVE_INFINITY
	let maxX = Number.NEGATIVE_INFINITY
	let maxY = Number.NEGATIVE_INFINITY
	for (const cell of cells) {
		if (cell.x < minX) minX = cell.x
		if (cell.y < minY) minY = cell.y
		if (cell.x > maxX) maxX = cell.x
		if (cell.y > maxY) maxY = cell.y
	}
	if (!cells.length) return { minX: 0, minY: 0, maxX: -1, maxY: -1 }
	return { minX, minY, maxX, maxY }
}

/**
 * Local clearance at a cell: the smaller of the free horizontal and free vertical run through
 * it. This is the interior-coupling number - a 4x5 m room that leaves a 600 mm gap reads as
 * clearance 1 tile here, which is what makes "the room fits" a furniture question, not an
 * area question.
 */
function localClearance(free: boolean[][], x: number, y: number): number {
	if (!free[y]?.[x]) return 0
	let h = 1
	for (let i = x - 1; free[y][i]; i--) h++
	for (let i = x + 1; free[y][i]; i++) h++
	let v = 1
	for (let j = y - 1; free[j]?.[x]; j--) v++
	for (let j = y + 1; free[j]?.[x]; j++) v++
	return Math.min(h, v)
}

/**
 * Depth from the building envelope, not from the grid edge. The host models a street ring, and on
 * a padded or real site the grid edge is pavement - measuring daylight depth from it would call
 * every room windowless. A façade cell is a building cell with exterior beside it; depth is the
 * BFS distance inward from that ring, through walls as well as floor, because plan depth is about
 * distance from the glass and not about reachability (TH-26, EQ-*).
 */
function facadeDepthField(
	cols: number,
	rows: number,
	exterior: (x: number, y: number) => boolean,
): number[][] {
	const field: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => -1))
	const queue: Cell[] = []
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			if (exterior(x, y)) continue
			const onFacade = x === 0 || y === 0 || x === cols - 1 || y === rows - 1
				|| exterior(x - 1, y) || exterior(x + 1, y) || exterior(x, y - 1) || exterior(x, y + 1)
			if (onFacade) {
				field[y][x] = 0
				queue.push({ x, y })
			}
		}
	}
	while (queue.length) {
		const cell = queue.shift()!
		const next = field[cell.y][cell.x] + 1
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
			const nx = cell.x + dx
			const ny = cell.y + dy
			if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
			if (exterior(nx, ny) || field[ny][nx] !== -1) continue
			field[ny][nx] = next
			queue.push({ x: nx, y: ny })
		}
	}
	return field
}

function countStates(states: TileState[][]): { walkable: number; blocked: number; door: number } {
	let walkable = 0
	let blocked = 0
	let door = 0
	for (const row of states) {
		for (const cell of row) {
			if (cell === 'blocked') blocked++
			else if (cell === 'door') door++
			else walkable++
		}
	}
	return { walkable, blocked, door }
}

function doorCellsOf(states: TileState[][]): Set<string> {
	const cells = new Set<string>()
	states.forEach((row, y) => row.forEach((state, x) => {
		if (state === 'door') cells.add(tileKey(x, y))
	}))
	return cells
}

function objectCells(object: { x: number; y: number; w: number; h: number }, cellSize: number, cols: number, rows: number): Cell[] {
	const fromX = Math.max(0, Math.floor(object.x / cellSize))
	const toX = Math.min(cols, Math.ceil((object.x + object.w) / cellSize))
	const fromY = Math.max(0, Math.floor(object.y / cellSize))
	const toY = Math.min(rows, Math.ceil((object.y + object.h) / cellSize))
	const cells: Cell[] = []
	for (let y = fromY; y < toY; y++) for (let x = fromX; x < toX; x++) cells.push({ x, y })
	return cells
}

/** Build the world model. Deterministic: same payload in, same world out. */
export function buildWorld(sourcePath: string, layout: FloorLayoutData, assets: AssetDef[], occupancy: OccupancyRecord): WorldBundle {
	const assetMap = buildAssetMap(assets)
	const getAssetDef = (type: string): AssetDef | undefined => assetMap.get(type)
	const getAssetTags = (type: string): string[] | undefined => assetMap.get(type)?.tags

	const { cols, rows } = gridDimensions(layout)
	const cellSize = Math.max(1, Math.round(layout.canvas.tileSize))
	const streetWidthTiles = layout.streetWidthTiles ?? 0
	const streetFloorId = layout.streetFloorId ?? null
	const canvas = { w: layout.canvas.width, h: layout.canvas.height, tileSize: layout.canvas.tileSize, streetTiles: layout.streetWidthTiles, streetFloorId: layout.streetFloorId ?? undefined }

	const engine = buildNpcEngineLayout(layout.floors, canvas, getAssetDef, getAssetTags)

	const site: SiteRecord = {
		streetWidthTiles,
		streetFloorId,
		cols,
		rows,
		metresPerTile: METRES_PER_TILE,
		// The host has no orientation. All four edges are treated as façade and north is declared,
		// so an environmental claim is traceable to an assumption rather than invented (EN-26).
		facadeEdges: ['north', 'south', 'east', 'west'],
		north: 'north',
	}

	// Room types the engine resolved, keyed by `${floorId}:${roomId}` - the host's own answer,
	// including its priority-ladder traps, so the harness reports what the game will actually do.
	const typeByRoomKey = new Map<string, { typeId: string; privacy: 'open' | 'private' }>()
	for (const target of engine.layout.interactionTargets) {
		if (!target.roomId || !target.roomType) continue
		typeByRoomKey.set(`${target.floorId}:${target.roomId}`, { typeId: target.roomType, privacy: target.roomPrivate ? 'private' : 'open' })
	}

	const portalDestinations = new Map<string, Set<string>>()
	/** Boarding cells come from the engine's own portal targets - a portal's footprint is blocked by definition. */
	const portalSpots = new Map<string, Cell[]>()
	for (const target of engine.layout.interactionTargets) {
		if (!target.transitionToFloorId) continue
		const key = `${target.floorId}:${target.itemId}`
		const set = portalDestinations.get(key) ?? new Set<string>()
		set.add(target.transitionToFloorId)
		portalDestinations.set(key, set)
		const spots = portalSpots.get(key) ?? []
		spots.push({ x: target.x, y: target.y })
		portalSpots.set(key, spots)
	}

	const floors: FloorNode[] = []
	const relations: Relation[] = []

	layout.floors.forEach((floor: FloorData, index: number) => {
		const map = engine.floorMaps.get(floor.id)
		const tileStates = resolveFloorTileStates(floor, rows, cols)
		const isStreetFloor = !streetFloorId || streetFloorId === floor.id
		const walkable: boolean[][] = Array.from({ length: rows }, (_, y) =>
			Array.from({ length: cols }, (_, x) => Boolean(map?.tiles.has(tileKey(x, y)))),
		)

		const doorCells = doorCellsOf(tileStates)
		const roomIdByCell = map ? deriveFloorRooms(map, doorCells) : new Map<string, string>()
		// The street ring is site. Left inside the room list it becomes the largest "hallway" on
		// the floor, which silently reclassifies the real corridor as an untagged room and reports
		// the pavement as unreachable floor.
		const street: boolean[][] = Array.from({ length: rows }, (_, y) =>
			Array.from({ length: cols }, (_, x) => isStreetFloor && isStreetTile(x, y, cols, rows, streetWidthTiles)),
		)

		// Furniture, with the cells each item actually blocks: authored-walkable but not
		// engine-walkable means the object ate it. That difference is the host's own stamping.
		const furniture: FurnitureNode[] = []
		const blockedByFurniture = new Set<string>()
		for (const object of floor.objects) {
			const def = getAssetDef(object.type)
			const size = def ? assetPixelSize(def, cellSize) : { w: object.w ?? 0, h: object.h ?? 0 }
			const w = object.w || size.w
			const h = object.h || size.h
			const cells = objectCells({ x: object.x, y: object.y, w, h }, cellSize, cols, rows)
			const blocked = cells.filter(cell => {
				const state = tileStates[cell.y]?.[cell.x]
				const authored = state === 'walkable' || state === 'door'
				const effective = walkable[cell.y]?.[cell.x] === true
				return authored && !effective
			})
			for (const cell of blocked) blockedByFurniture.add(tileKey(cell.x, cell.y))
			const tags = getAssetTags(object.type) ?? []
			const center = cells.length ? cells[Math.floor(cells.length / 2)] : { x: pixelToCell(object.x, cellSize), y: pixelToCell(object.y, cellSize) }
			furniture.push({
				id: `${floor.id}#${object.id}`,
				floorId: floor.id,
				objectId: object.id,
				assetId: object.type,
				assetName: def?.name ?? object.type,
				tags,
				rotation: object.rotation,
				bounds: boundsOf(cells),
				cells,
				blockedCells: blocked,
				walkable: def?.walkable !== false && blocked.length === 0,
				portal: tags.includes(PORTAL_TAG),
				roomId: roomIdByCell.get(tileKey(center.x, center.y)) ?? null,
			})
		}

		const depthField = facadeDepthField(cols, rows, (x, y) => isStreetFloor && isStreetTile(x, y, cols, rows, streetWidthTiles))
		const free: boolean[][] = Array.from({ length: rows }, (_, y) =>
			Array.from({ length: cols }, (_, x) => walkable[y][x] && !blockedByFurniture.has(tileKey(x, y))),
		)

		// Rooms and corridors. A room the host typed `hall` is circulation, not occupancy -
		// counting it as a room is how a plan silently loses programme (SKILL.md host fact 2).
		const cellsByRoom = new Map<string, Cell[]>()
		for (const [key, roomId] of roomIdByCell) {
			const [x, y] = key.split(',').map(Number)
			const list = cellsByRoom.get(roomId) ?? []
			list.push({ x, y })
			cellsByRoom.set(roomId, list)
		}

		const doorGroups = groupDoorCells(tileStates)
		const doors: DoorNode[] = doorGroups.map(group => {
			const cells = group.cells.map(cell => ({ x: cell.col, y: cell.row }))
			// The rooms a door joins are found on the far side of each door cell, skipping other
			// door cells: a door belongs to no room, so its neighbours define what it connects.
			const sides = new Set<string>()
			for (const cell of cells) {
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
					const key = tileKey(cell.x + dx, cell.y + dy)
					if (doorCells.has(key)) continue
					const roomId = roomIdByCell.get(key)
					if (roomId) sides.add(roomId)
				}
			}
			const list = [...sides]
			return {
				id: `${floor.id}#door-${group.key}`,
				floorId: floor.id,
				groupKey: group.key,
				axis: group.axis,
				cells,
				widthTiles: cells.length,
				// Qualified so they are comparable with RoomNode.id; the host's own local ids are bare,
				// and a `connects` that silently never matches `room.id` is a trap for every consumer.
				connects: list.length === 2 ? [`${floor.id}#${list[0]}`, `${floor.id}#${list[1]}`] : null,
			}
		})

		const rooms: RoomNode[] = [...cellsByRoom.entries()].map(([localId, cells]) => {
			const resolved = typeByRoomKey.get(`${floor.id}:${localId}`)
			const bounds = boundsOf(cells)
			const interiorW = Math.max(0, bounds.maxX - bounds.minX + 1)
			const interiorH = Math.max(0, bounds.maxY - bounds.minY + 1)
			const cellSet = new Set(cells.map(cell => tileKey(cell.x, cell.y)))
			const streetCells = cells.filter(cell => street[cell.y]?.[cell.x]).length
			const doorIds = doors.filter(door => door.cells.some(cell => {
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
					if (cellSet.has(tileKey(cell.x + dx, cell.y + dy))) return true
				}
				return false
			})).map(door => door.id)
			const tags = furniture
				.filter(item => item.roomId === localId)
				.flatMap(item => item.tags)
			let deepest = -1
			let shallowest = Number.POSITIVE_INFINITY
			let minRunAtDoor = Number.POSITIVE_INFINITY
			let minRun = Number.POSITIVE_INFINITY
			let freeCells = 0
			for (const cell of cells) {
				const depth = depthField[cell.y]?.[cell.x] ?? -1
				if (depth >= 0) {
					if (depth > deepest) deepest = depth
					if (depth < shallowest) shallowest = depth
				}
				if (!free[cell.y][cell.x]) continue
				freeCells++
				const clearance = localClearance(free, cell.x, cell.y)
				if (clearance < minRun) minRun = clearance
				const nearDoor = doorIds.length > 0 && doors.some(door =>
					door.cells.some(dc => Math.abs(dc.x - cell.x) + Math.abs(dc.y - cell.y) <= 1))
				if (nearDoor && clearance < minRunAtDoor) minRunAtDoor = clearance
			}
			return {
				id: `${floor.id}#${localId}`,
				floorId: floor.id,
				localId,
				typeId: resolved?.typeId ?? 'hall',
				typeLabel: LABEL_BY_TYPE.get(resolved?.typeId ?? 'hall') ?? 'Hallway',
				privacy: resolved?.privacy ?? 'open',
				cells,
				bounds,
				areaTiles: cells.length,
				areaM2: cells.length * METRES_PER_TILE * METRES_PER_TILE,
				interiorW,
				interiorH,
				fixtureTags: [...new Set(tags)],
				fixtureCount: furniture.filter(item => item.roomId === localId).length,
				doorIds,
				isCorridor: (resolved?.typeId ?? 'hall') === 'hall',
				isStreet: cells.length > 0 && streetCells / cells.length > 0.5,
				depthFromFacade: deepest,
				minDepthFromFacade: Number.isFinite(shallowest) ? shallowest : -1,
				freeCells,
				minFreeRun: Number.isFinite(minRunAtDoor) ? minRunAtDoor : (Number.isFinite(minRun) ? minRun : 0),
			}
		})

		const portals: PortalNode[] = furniture.filter(item => item.portal).map(item => {
			// The engine only emits portal targets when a second portal floor exists, so on a
			// single-floor payload fall back to the walkable cells beside the car: that is where a
			// person boards, and a portal with no boarding cell is a wall with a lift in it.
			const engineSpots = portalSpots.get(`${floor.id}:portal:${item.objectId}`) ?? []
			const spots = engineSpots.length ? engineSpots : boardingCells(item.cells, walkable)
			return {
				id: `${floor.id}#portal-${item.objectId}`,
				floorId: floor.id,
				objectId: item.objectId,
				assetId: item.assetId,
				cells: item.cells,
				spotCells: spots,
				destinationFloorIds: [...(portalDestinations.get(`${floor.id}:portal:${item.objectId}`) ?? [])],
			}
		})

		const stateCounts = countStates(tileStates)

		// One classification pass, mutually exclusive and exhaustive, so the reconciliation closes
		// by construction. The naive version (rooms + blocked + doors) silently drops two real
		// classes: tiles an object blocks, and the street ring on the street floor. Both are floor
		// that no person can occupy, and counting them as circulation is how a plan over-reports
		// its own generosity.
		let roomTiles = 0
		let circulationTiles = 0
		let structureTiles = 0
		let furnitureTiles = 0
		let streetTiles = 0
		const roomClass = new Map<string, boolean>()
		for (const room of rooms) roomClass.set(room.localId, room.isCorridor)
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const state = tileStates[y]?.[x]
				if (state === 'blocked') {
					structureTiles++
					continue
				}
				if (isStreetFloor && isStreetTile(x, y, cols, rows, streetWidthTiles)) {
					streetTiles++
					continue
				}
				if (!walkable[y][x]) {
					furnitureTiles++
					continue
				}
				if (state === 'door') {
					circulationTiles++
					continue
				}
				const roomId = roomIdByCell.get(tileKey(x, y))
				if (roomId === undefined) {
					circulationTiles++
					continue
				}
				if (roomClass.get(roomId)) circulationTiles++
				else roomTiles++
			}
		}
		const gridTiles = cols * rows

		// Reachability: flood the effective walkable set from the largest walkable region, so tiles
		// the simulation can never enter are counted rather than assumed away.
		const unreachableTiles = countUnreachable(walkable, street, cols, rows)

		const counts: FloorCounts = {
			walkable: stateCounts.walkable,
			blocked: stateCounts.blocked,
			door: stateCounts.door,
			roomTiles,
			circulationTiles,
			structureTiles,
			furnitureTiles,
			streetTiles,
			gridTiles,
			reconciles: roomTiles + circulationTiles + structureTiles + furnitureTiles + streetTiles === gridTiles,
			unreachableTiles,
		}

		floors.push({
			id: floor.id,
			name: floor.name,
			label: floor.label,
			index,
			rows,
			cols,
			tileStates,
			walkable,
			street,
			rooms,
			corridors: rooms.filter(room => room.isCorridor),
			doors,
			portals,
			furniture,
			counts,
			isStreetFloor,
		})

		// Relationship graph: doors are traversals, shared walls are adjacencies without a door.
		for (const door of doors) {
			if (!door.connects) continue
			relations.push({ kind: 'door', from: door.connects[0], to: door.connects[1], weight: 1, floorId: floor.id })
		}
		const roomOfCell = new Map<string, string>()
		for (const room of rooms) for (const cell of room.cells) roomOfCell.set(tileKey(cell.x, cell.y), room.localId)
		const sharedWall = new Map<string, number>()
		for (const room of rooms) {
			for (const cell of room.cells) {
				for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
					const nx = cell.x + dx
					const ny = cell.y + dy
					if (nx >= cols || ny >= rows) continue
					if (tileStates[ny]?.[nx] !== 'blocked') continue
					// A wall tile separates two rooms when rooms sit on both far sides of it.
					const a = roomOfCell.get(tileKey(cell.x, cell.y))
					const b = roomOfCell.get(tileKey(cell.x + 2 * dx, cell.y + 2 * dy)) ?? roomOfCell.get(tileKey(cell.x + dx - dy, cell.y + dy + dx))
					if (!a || !b || a === b) continue
					const key = a < b ? `${a}|${b}` : `${b}|${a}`
					sharedWall.set(key, (sharedWall.get(key) ?? 0) + 1)
				}
			}
		}
		for (const [key, weight] of sharedWall) {
			const [a, b] = key.split('|')
			relations.push({ kind: 'shared-wall', from: `${floor.id}#${a}`, to: `${floor.id}#${b}`, weight, floorId: floor.id })
		}
		for (const portal of portals) {
			for (const destination of portal.destinationFloorIds) {
				relations.push({ kind: 'vertical', from: portal.id, to: `${destination}#portal`, weight: 1, floorId: floor.id })
			}
		}
	})

	const vertical = buildVerticalRecord(floors)

	const world: ArchWorld = {
		source: path.basename(sourcePath),
		builtAt: new Date().toISOString(),
		canvas: { width: layout.canvas.width, height: layout.canvas.height, tileSize: cellSize, cols, rows },
		site,
		floors,
		relations,
		vertical,
		occupancy,
		scaleNote: `1 tile = ${METRES_PER_TILE} m (skill convention; the engine stores tiles and pixels only)`,
	}

	return { world, layout, assets, assetMap, engine, sourcePath }
}

/**
 * Walkable tiles cut off from the largest interior region. The street ring is excluded: pavement
 * is site, and being unable to walk from the road into a floor plate is a separate question from
 * sealed-off floor.
 */
/** Walkable cells orthogonally beside a footprint: where a person stands to use the object. */
function boardingCells(cells: readonly Cell[], walkable: boolean[][]): Cell[] {
	const out: Cell[] = []
	const seen = new Set<string>()
	for (const cell of cells) {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
			const nx = cell.x + dx
			const ny = cell.y + dy
			if (walkable[ny]?.[nx] !== true) continue
			const neighbourKey = tileKey(nx, ny)
			if (seen.has(neighbourKey)) continue
			seen.add(neighbourKey)
			out.push({ x: nx, y: ny })
		}
	}
	return out
}

function countUnreachable(walkable: boolean[][], street: boolean[][], cols: number, rows: number): number {
	const regions: number[] = []
	const seen: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			if (!walkable[y][x] || street[y][x] || seen[y][x]) continue
			let size = 0
			const queue: Cell[] = [{ x, y }]
			seen[y][x] = true
			while (queue.length) {
				const cell = queue.pop()!
				size++
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
					const nx = cell.x + dx
					const ny = cell.y + dy
					if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
					if (seen[ny][nx] || !walkable[ny][nx] || street[ny][nx]) continue
					seen[ny][nx] = true
					queue.push({ x: nx, y: ny })
				}
			}
			regions.push(size)
		}
	}
	if (regions.length <= 1) return 0
	const largest = Math.max(...regions)
	return regions.reduce((sum, size) => (size === largest ? sum : sum + size), 0)
}

/**
 * Which portal cells form the stack, and which floors deviate from it.
 *
 * The reference is the consensus position - a cell present on more than half the portal floors - not
 * the intersection. An intersection lets one mis-stacked floor erase the shared stack, so all floors
 * end up reported as drifting and the two correct ones are told to move.
 */
function buildVerticalRecord(floors: readonly FloorNode[]): VerticalRecord {
	const portalFloors = floors.filter(floor => floor.portals.length > 0)
	const keySets = portalFloors.map(floor => new Set(floor.portals.flatMap(portal => portal.cells.map(cell => tileKey(cell.x, cell.y)))))
	const coverage = new Map<string, number>()
	for (const set of keySets) for (const key of set) coverage.set(key, (coverage.get(key) ?? 0) + 1)
	const stacked = [...coverage.entries()].filter(([, count]) => count > keySets.length / 2).map(([key]) => key)
	const stackDrift = keySets.map((set, i) => ({
		floorId: portalFloors[i].id,
		missing: stacked.filter(key => !set.has(key)),
		extra: [...set].filter(key => !stacked.includes(key)),
	})).filter(entry => entry.missing.length > 0 || entry.extra.length > 0)

	return {
		portalFloorIds: portalFloors.map(floor => floor.id),
		floorsWithPortals: portalFloors.length,
		floorsWithoutPortals: floors.filter(floor => floor.portals.length === 0).map(floor => floor.id),
		stackedPortalKeys: stacked,
		stackDrift,
	}
}

export function loadWorld(filePath: string): WorldBundle {
	const resolved = path.resolve(filePath)
	const { layout, assets, occupancy } = readDataFile(resolved)
	return buildWorld(resolved, layout, assets, occupancy)
}

export function findFloor(world: ArchWorld, floorIdOrLabel: string | undefined): FloorNode {
	if (!floorIdOrLabel) return world.floors[0]
	const needle = floorIdOrLabel.toLowerCase()
	const hit = world.floors.find(floor =>
		floor.id.toLowerCase() === needle
		|| floor.label.toLowerCase() === needle
		|| floor.name.toLowerCase() === needle
		|| floor.index === Number(floorIdOrLabel))
	if (!hit) throw new Error(`floor "${floorIdOrLabel}" not found; have: ${world.floors.map(floor => floor.id).join(', ')}`)
	return hit
}
