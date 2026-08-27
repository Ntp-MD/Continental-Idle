import type { AssetDef, FloorData, NpcRole, ObjectData, ResolvedObjectDef, WallSegment } from '../../blueprint-editor/types'
import { CANVAS_WALL_OBJECT_TYPE, resolveInteractForTarget, resolveObjectDef, resolveWallSegmentsForObject, STREET_TILES } from '../../blueprint-editor/types'
import { buildNpcQueues } from './queueBuild'
import { getObjectTags, hasMatchingTag } from './tagMatching'
import type { NpcEngineBlockedEdge, NpcEngineFloor, NpcEngineInteractionTarget, NpcEngineLayout, NpcEnginePoint } from './types'

const PORTAL_TAG = 'portal'
const INTERACT_SPOT_SEARCH_RADIUS = 5

export interface NpcWalkableMap {
	tiles: Set<string>
	width: number
	height: number
	cellSize: number
}

export interface NpcCanvasBounds {
	w: number
	h: number
	tileSize: number
	streetTiles?: number
	streetFloorId?: string
}

export interface NpcLayoutBuildResult {
	layout: NpcEngineLayout
	floorMaps: Map<string, NpcWalkableMap>
	floorDataMap: Map<string, FloorData>
	interactionTargetsByKey: Map<string, NpcEngineInteractionTarget>
}

export type GetAssetDef = (type: string) => AssetDef | undefined
export type GetAssetTags = (type: string) => string[] | undefined

export function cellSizeOf(tileSize: number): number {
	return Math.max(1, Math.round(tileSize) || 1)
}

export function tileKey(x: number, y: number): string {
	return `${x},${y}`
}

export function pixelToCell(value: number, tileSize: number): number {
	return Math.floor(value / cellSizeOf(tileSize))
}

export function cellToPixel(value: number, tileSize: number): number {
	return (value + 0.5) * cellSizeOf(tileSize)
}

export function interactionTargetKey(target: Pick<NpcEngineInteractionTarget, 'floorId' | 'itemId' | 'interactSpotId'>): string {
	return `${target.floorId}:${target.itemId}:${target.interactSpotId}`
}

export function toEngineWalkablePoints(tiles: ReadonlySet<string>): NpcEnginePoint[] {
	return [...tiles].map(key => {
		const [x, y] = key.split(',').map(Number)
		return { x, y }
	})
}

function resolveGridIndex(
	cells: readonly (readonly unknown[])[],
	length: number,
	local: number,
): number {
	return Math.min(cells.length - 1, Math.floor(Math.max(0, local) * cells.length / Math.max(1, length)))
}

function resolveTileState(
	definition: ResolvedObjectDef,
	object: ObjectData,
	px: number,
	py: number,
): 'walkable' | 'blocked' | 'entrance' | undefined {
	if (!definition.tileStates?.length) return undefined
	const localX = Math.max(0, Math.min(object.w - 0.001, px - object.x))
	const localY = Math.max(0, Math.min(object.h - 0.001, py - object.y))
	const row = resolveGridIndex(definition.tileStates, object.h, localY)
	const cols = definition.tileStates[row]?.length ?? 0
	const col = cols ? Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, object.w))) : 0
	return definition.tileStates[row]?.[col]
}

function isWalkableState(state: 'walkable' | 'blocked' | 'entrance' | undefined): boolean {
	return state === 'walkable' || state === 'entrance'
}

function isEdgeTile(row: number, col: number, rows: number, cols: number): boolean {
	return row === 0 || row === rows - 1 || col === 0 || col === cols - 1
}

export function isStreetTile(tx: number, ty: number, width: number, height: number, streetTiles: number): boolean {
	const start = streetTiles
	const endX = width - streetTiles
	const endY = height - streetTiles
	if (endX <= start || endY <= start) return false
	return tx < start || tx >= endX || ty < start || ty >= endY
}

function objectBlocksTile(
	object: ObjectData,
	definition: ResolvedObjectDef,
	px: number,
	py: number,
): boolean {
	if (object.isWall && object.type === CANVAS_WALL_OBJECT_TYPE) return false
	if (definition.walkable === true) return false
	const state = resolveTileState(definition, object, px, py)
	if (state === 'blocked') return true
	if (definition.walkable === false) return !isWalkableState(state)
	const localX = Math.max(0, Math.min(object.w - 0.001, px - object.x))
	const localY = Math.max(0, Math.min(object.h - 0.001, py - object.y))
	if (definition.tileStates?.length && definition.entranceRequired && !definition.wallSegments?.length) {
		const row = resolveGridIndex(definition.tileStates, object.h, localY)
		const cols = definition.tileStates[row]?.length ?? 0
		const col = cols ? Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, object.w))) : 0
		if (isEdgeTile(row, col, definition.tileStates.length, cols) && !isWalkableState(state)) return true
	}
	if (definition.walkableGrid?.length) {
		const row = resolveGridIndex(definition.walkableGrid, object.h, localY)
		const cols = definition.walkableGrid[row]?.length ?? 0
		if (cols && definition.walkableGrid[row][Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, object.w)))] === false) return true
	}
	return false
}

function isTileWalkable(
	floor: FloorData,
	width: number,
	height: number,
	tileSize: number,
	tx: number,
	ty: number,
	objects: readonly ObjectData[],
	getAssetDef?: GetAssetDef,
	streetTiles: number = STREET_TILES,
	isStreetFloor: boolean = true,
): boolean {
	if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false
	const px = cellToPixel(tx, tileSize)
	const py = cellToPixel(ty, tileSize)
	if (isStreetTile(tx, ty, width, height, streetTiles)) {
		if (!isStreetFloor) return false
		for (const object of objects) {
			if (px < object.x || px >= object.x + object.w || py < object.y || py >= object.y + object.h) continue
			const definition = resolveObjectDef(object.rotation, getAssetDef?.(object.type), { w: object.w, h: object.h })
			if (objectBlocksTile(object, definition, px, py)) return false
		}
		return true
	}
	const walkable = floor.walkable
	const walkableState = walkable?.tileStates?.[ty]?.[tx]
	if (walkableState === 'blocked') return false
	if (walkable?.walkableGrid?.length && walkable.walkableGrid[ty]?.[tx] === false) return false
	for (const object of objects) {
		if (px < object.x || px >= object.x + object.w || py < object.y || py >= object.y + object.h) continue
		const definition = resolveObjectDef(object.rotation, getAssetDef?.(object.type), { w: object.w, h: object.h })
		if (objectBlocksTile(object, definition, px, py)) return false
	}
	const walkableAllows = walkableState === 'walkable'
		|| walkableState === 'entrance'
		|| walkable?.walkableGrid?.[ty]?.[tx] === true
	return walkableAllows || (floor.defaultWalkable ?? true)
}

export function buildWalkableMap(
	floor: FloorData,
	canvas: NpcCanvasBounds,
	getAssetDef?: GetAssetDef,
): NpcWalkableMap {
	const cellSize = cellSizeOf(canvas.tileSize)
	const width = Math.max(0, Math.ceil(canvas.w / cellSize))
	const height = Math.max(0, Math.ceil(canvas.h / cellSize))
	const objectsByCell = new Map<string, ObjectData[]>()
	const tiles = new Set<string>()
	for (const object of floor.objects) {
		const fromX = Math.max(0, Math.floor(object.x / cellSize))
		const toX = Math.min(width, Math.ceil((object.x + object.w) / cellSize))
		const fromY = Math.max(0, Math.floor(object.y / cellSize))
		const toY = Math.min(height, Math.ceil((object.y + object.h) / cellSize))
		for (let y = fromY; y < toY; y++) {
			for (let x = fromX; x < toX; x++) {
				const key = tileKey(x, y)
				const objects = objectsByCell.get(key) ?? []
				objects.push(object)
				objectsByCell.set(key, objects)
			}
		}
	}
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const isStreetFloor = !canvas.streetFloorId || canvas.streetFloorId === floor.id
			if (isTileWalkable(floor, width, height, cellSize, x, y, objectsByCell.get(tileKey(x, y)) ?? [], getAssetDef, canvas.streetTiles ?? STREET_TILES, isStreetFloor)) tiles.add(tileKey(x, y))
		}
	}
	return { tiles, width, height, cellSize }
}

function isObjectEntranceTile(
	tx: number,
	ty: number,
	tileSize: number,
	definitions: ReadonlyArray<{ object: ObjectData; definition: ResolvedObjectDef }>,
): boolean {
	const px = cellToPixel(tx, tileSize)
	const py = cellToPixel(ty, tileSize)
	for (const { object, definition } of definitions) {
		if (px < object.x || px >= object.x + object.w || py < object.y || py >= object.y + object.h) continue
		if (resolveTileState(definition, object, px, py) === 'entrance') return true
	}
	return false
}

function wallBlocksEdge(segment: WallSegment, x: number, y: number, nx: number, ny: number, tileSize: number): boolean {
	const epsilon = 1e-6
	if (segment.y1 === segment.y2 && nx === x && ny === y + 1) {
		const boundary = Math.round(segment.y1 / tileSize)
		const start = Math.min(segment.x1, segment.x2) / tileSize
		const end = Math.max(segment.x1, segment.x2) / tileSize
		return boundary === ny && x >= start - epsilon && x < end - epsilon
	}
	if (segment.x1 === segment.x2 && nx === x + 1 && ny === y) {
		const boundary = Math.round(segment.x1 / tileSize)
		const start = Math.min(segment.y1, segment.y2) / tileSize
		const end = Math.max(segment.y1, segment.y2) / tileSize
		return boundary === nx && y >= start - epsilon && y < end - epsilon
	}
	return false
}

function wallSegmentsForFloor(floor: FloorData, tileSize: number, getAssetDef?: GetAssetDef): WallSegment[] {
	const segments: WallSegment[] = []
	for (const object of floor.objects) {
		if (object.isWall && object.type === CANVAS_WALL_OBJECT_TYPE) {
			if ([object.x1, object.y1, object.x2, object.y2].every((value): value is number => typeof value === 'number' && Number.isFinite(value))) {
				segments.push({ x1: object.x1! * tileSize, y1: object.y1! * tileSize, x2: object.x2! * tileSize, y2: object.y2! * tileSize })
			}
			continue
		}
		const asset = getAssetDef?.(object.type)
		if (!asset?.wallSegments?.length) continue
		segments.push(...resolveWallSegmentsForObject(asset.wallSegments, asset, object, tileSize))
	}
	return segments
}

export function buildBlockedEdges(
	floor: FloorData,
	map: NpcWalkableMap,
	getAssetDef?: GetAssetDef,
): NpcEngineBlockedEdge[] {
	const definitions = floor.objects.map(object => ({
		object,
		definition: resolveObjectDef(object.rotation, getAssetDef?.(object.type), { w: object.w, h: object.h }),
	}))
	const floorTileStates = floor.walkable?.tileStates
	const wallSegments = wallSegmentsForFloor(floor, map.cellSize, getAssetDef)
	const edges: NpcEngineBlockedEdge[] = []
	for (const cell of map.tiles) {
		const [x, y] = cell.split(',').map(Number)
		for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
			const nx = x + dx
			const ny = y + dy
			if (!map.tiles.has(tileKey(nx, ny))) continue
			const isEntranceA = floorTileStates?.[y]?.[x] === 'entrance' || isObjectEntranceTile(x, y, map.cellSize, definitions)
			const isEntranceB = floorTileStates?.[ny]?.[nx] === 'entrance' || isObjectEntranceTile(nx, ny, map.cellSize, definitions)
			if (isEntranceA || isEntranceB) continue
			const blocked = wallSegments.some(segment => wallBlocksEdge(segment, x, y, nx, ny, map.cellSize))
			if (!blocked) continue
			edges.push({ from: { x, y }, to: { x: nx, y: ny } })
		}
	}
	return edges
}

function findNearestWalkable(map: NpcWalkableMap, x: number, y: number, radius: number): NpcEnginePoint | null {
	if (map.tiles.has(tileKey(x, y))) return { x, y }
	for (let r = 1; r <= radius; r++) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
				if (map.tiles.has(tileKey(x + dx, y + dy))) return { x: x + dx, y: y + dy }
			}
		}
	}
	return null
}

export function buildRoleWalkableMap(
	map: NpcWalkableMap,
	floor: FloorData,
	role: NpcRole,
	getAssetTags?: GetAssetTags,
): NpcWalkableMap {
	if (!role.restrictedTags.length) return map
	const forbidden = new Set<string>()
	for (const object of floor.objects) {
		if (!hasMatchingTag(getObjectTags(object, getAssetTags), role.restrictedTags)) continue
		const fromY = Math.max(0, Math.floor(object.y / map.cellSize))
		const toY = Math.min(map.height, Math.ceil((object.y + object.h) / map.cellSize))
		const fromX = Math.max(0, Math.floor(object.x / map.cellSize))
		const toX = Math.min(map.width, Math.ceil((object.x + object.w) / map.cellSize))
		for (let ty = fromY; ty < toY; ty++) {
			for (let tx = fromX; tx < toX; tx++) forbidden.add(tileKey(tx, ty))
		}
	}
	return { ...map, tiles: new Set([...map.tiles].filter(key => !forbidden.has(key))) }
}

export function filterNpcSpawnTiles(map: NpcWalkableMap, floor: FloorData, roleId: string): Set<string> {
	const zones = floor.spawnZones ?? []
	if (zones.length === 0) return new Set(map.tiles)
	return new Set([...map.tiles].filter(cell => {
		const [x, y] = cell.split(',').map(Number)
		const px = cellToPixel(x, map.cellSize)
		const py = cellToPixel(y, map.cellSize)
		return zones.some(zone =>
			(!zone.roleIds?.length || zone.roleIds.includes(roleId))
			&& px >= zone.x && px < zone.x + zone.w
			&& py >= zone.y && py < zone.y + zone.h,
		)
	}))
}

function buildObjectInteractionTargets(
	floor: FloorData,
	map: NpcWalkableMap,
	getAssetTags?: GetAssetTags,
	getAssetDef?: GetAssetDef,
): NpcEngineInteractionTarget[] {
	const targets: NpcEngineInteractionTarget[] = []
	for (const object of floor.objects) {
		const tags = getObjectTags(object, getAssetTags)
		if (tags.includes(PORTAL_TAG)) continue
		const definition = resolveObjectDef(object.rotation, getAssetDef?.(object.type), { w: object.w, h: object.h })
		const interactSpots = definition.interactSpots
		if (!interactSpots?.length) continue
		const itemId = `object:${object.id}`
		const resolved = resolveInteractForTarget(definition.interact, interactSpots.length)
		interactSpots.forEach((interactSpot, index) => {
			const cell = findNearestWalkable(
				map,
				pixelToCell(object.x + interactSpot.x, map.cellSize),
				pixelToCell(object.y + interactSpot.y, map.cellSize),
				INTERACT_SPOT_SEARCH_RADIUS,
			)
			if (!cell) return
			targets.push({
				floorId: floor.id,
				itemId,
				interactSpotId: `${itemId}:${index}`,
				x: cell.x,
				y: cell.y,
				tags,
				capacity: resolved.capacity,
				durationMinSeconds: resolved.durationMinSeconds,
				durationMaxSeconds: resolved.durationMaxSeconds,
			})
		})
	}
	return targets
}

function portalEndpointKey(floorId: string, itemId: string, interactSpotIndex: number): string {
	return `${floorId}:${itemId}:endpoint:${interactSpotIndex}`
}

function buildPortalInteractionTargets(
	floors: readonly FloorData[],
	floorMaps: ReadonlyMap<string, NpcWalkableMap>,
	getAssetTags?: GetAssetTags,
	getAssetDef?: GetAssetDef,
): NpcEngineInteractionTarget[] {
	const portals = floors.flatMap(floor =>
		floor.objects
			.filter(object => getObjectTags(object, getAssetTags).includes(PORTAL_TAG))
			.map(object => ({ floor, object })),
	)
	const portalFloorIds = new Set(portals.map(portal => portal.floor.id))
	const targets: NpcEngineInteractionTarget[] = []

	for (const { floor, object } of portals) {
		const map = floorMaps.get(floor.id)
		if (!map) continue
		const definition = resolveObjectDef(object.rotation, getAssetDef?.(object.type), { w: object.w, h: object.h })
		const interactSpots = definition.interactSpots
		if (!interactSpots?.length) continue
		const itemId = `portal:${object.id}`
		const destinationFloorIds = [...portalFloorIds].filter(floorId => floorId !== floor.id)

		interactSpots.forEach((interactSpot, interactSpotIndex) => {
			const cell = findNearestWalkable(
				map,
				pixelToCell(object.x + interactSpot.x, map.cellSize),
				pixelToCell(object.y + interactSpot.y, map.cellSize),
				INTERACT_SPOT_SEARCH_RADIUS,
			)
			if (!cell) return
			const endpointKey = portalEndpointKey(floor.id, itemId, interactSpotIndex)

			for (const destinationFloorId of destinationFloorIds) {
				const destination = portals.find(portal => portal.floor.id === destinationFloorId)
				if (!destination) continue
				targets.push({
					floorId: floor.id,
					itemId,
					interactSpotId: `portal:${interactSpotIndex}->${destinationFloorId}`,
					x: cell.x,
					y: cell.y,
					tags: [PORTAL_TAG, `${PORTAL_TAG}:${destinationFloorId}`],
					capacity: 1,
					durationMinSeconds: 0,
					durationMaxSeconds: 0,
					transitionToFloorId: destinationFloorId,
					destinationPortalKey: portalEndpointKey(destinationFloorId, `portal:${destination.object.id}`, interactSpotIndex),
					portalEndpointKey: endpointKey,
				})
			}
		})
	}
	return targets
}

export function buildNpcEngineLayout(
	floors: readonly FloorData[],
	canvas: NpcCanvasBounds,
	getAssetDef?: GetAssetDef,
	getAssetTags?: GetAssetTags,
): NpcLayoutBuildResult {
	const floorMaps = new Map<string, NpcWalkableMap>()
	const floorDataMap = new Map<string, FloorData>()
	const engineFloors: NpcEngineFloor[] = []
	const interactionTargets: NpcEngineInteractionTarget[] = []
	const assets = new Map<string, AssetDef>()

	for (const floor of floors) {
		const map = buildWalkableMap(floor, canvas, getAssetDef)
		floorMaps.set(floor.id, map)
		floorDataMap.set(floor.id, floor)
		interactionTargets.push(...buildObjectInteractionTargets(floor, map, getAssetTags, getAssetDef))
		engineFloors.push({
			id: floor.id,
			width: map.width,
			height: map.height,
			tileSize: map.cellSize,
			walkable: toEngineWalkablePoints(map.tiles),
			blockedEdges: buildBlockedEdges(floor, map, getAssetDef),
			allowedRoleIds: floor.allowedRoleIds,
		})
		for (const object of floor.objects) {
			const asset = getAssetDef?.(object.type)
			if (asset) assets.set(object.type, asset)
		}
	}

	interactionTargets.push(...buildPortalInteractionTargets(floors, floorMaps, getAssetTags, getAssetDef))

	const queues = floors.flatMap(floor => {
		const engineFloor = engineFloors.find(candidate => candidate.id === floor.id)
		return engineFloor ? buildNpcQueues(engineFloor, floor, canvas.tileSize, assets, interactionTargets) : []
	})

	return {
		layout: { floors: engineFloors, interactionTargets, queues },
		floorMaps,
		floorDataMap,
		interactionTargetsByKey: new Map(interactionTargets.map(target => [interactionTargetKey(target), target])),
	}
}
