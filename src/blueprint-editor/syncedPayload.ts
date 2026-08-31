/**
 * Pure BlueprintData -> SyncedLayoutPayload mapper.
 *
 * Single source of truth for floor-key assignment and object field
 * propagation, used by BOTH the editor's manual "Sync Game" action and
 * the game's boot-time loader. Kept free of editor-state / DOM imports
 * so it can run headless in tests.
 */
import type {
	AssetDef,
	FloorLayoutData,
	NpcSimulationConfig,
	ObjectData,
	SyncedFloor,
	SyncedLayoutPayload,
	SyncedObject,
} from './types'
import {
	normalizeAllowedRoleIds,
	normalizeFloorWalkable,
	normalizeInteractConfig,
	normalizeInteractSpots,
	normalizeNpcConfig,
	normalizeNpcQueueConfig,
	normalizeNpcSpawnZones,
	normalizeTileStates,
	normalizeWallSegments,
	normalizeWalkableGrid,
	resolveStreetTiles,
} from './types'
import { assignSyncKey } from './store/storeUtils'
import { assetSizeFor } from './geometry'
import { editorLog } from './store/utils'

export function buildSyncedPayload(
	layout: FloorLayoutData,
	assets: ReadonlyMap<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): SyncedLayoutPayload | null {
	try {
		const floors: Record<string, SyncedFloor> = {}
		const usedKeys = new Set<string>()
		const tileSize = layout.canvas.tileSize
		layout.floors.forEach((floor, index) => {
			const floorId = assignSyncKey(floor.label, index, usedKeys)
			usedKeys.add(floorId)
			const allowedRoleIds = normalizeAllowedRoleIds(floor.allowedRoleIds)
			const walkable = normalizeFloorWalkable(floor.walkable)
			const spawnZones = normalizeNpcSpawnZones(floor.spawnZones)
			floors[floorId] = {
				defaultWalkable: floor.defaultWalkable ?? true,
				...(walkable ? { walkable } : {}),
				...(spawnZones?.length ? { spawnZones } : {}),
				...(allowedRoleIds ? { allowedRoleIds } : {}),
				objects: floor.objects.map((o: ObjectData) => buildSyncedObject(o, assets, tileSize)),
			}
		})
		if (Object.keys(floors).length === 0) return null

		const normalizedNpcConfig = npcConfig ? normalizeNpcConfig(npcConfig) : undefined
		return {
			version: 3,
			canvas: {
				width: layout.canvas.width,
				height: layout.canvas.height,
				tileSize: layout.canvas.tileSize,
				...(layout.canvas.bgColor ? { bgColor: layout.canvas.bgColor } : {}),
				streetWidthTiles: resolveStreetTiles(layout),
				...(layout.streetFloorId ? { streetFloorId: layout.streetFloorId } : {}),
			},
			floors,
			...(normalizedNpcConfig ? { npcConfig: normalizedNpcConfig } : {}),
			timestamp: Date.now(),
		}
	} catch (error) {
		editorLog.error('buildSyncedPayload', error)
		return null
	}
}

function buildSyncedObject(o: ObjectData, assets: ReadonlyMap<string, AssetDef>, tileSize: number): SyncedObject {
	const asset = assets.get(o.type)
	const size = hasPositiveSize(o)
		? { w: o.w, h: o.h }
		: assetSizeFor(o.type, o.rotation ?? 0, tileSize, assets)
	const interactSpots = normalizeInteractSpots(asset?.interactSpots)
	const interact = normalizeInteractConfig(asset?.interact)
	const queue = normalizeNpcQueueConfig(asset?.queue)
	const walkableGrid = normalizeWalkableGrid(asset?.walkableGrid)
	const tileStates = normalizeTileStates(asset?.tileStates)
	const wallSegments = normalizeWallSegments(asset?.wallSegments)
	const obj: SyncedObject = {
		id: o.id,
		type: o.type,
		x: o.x,
		y: o.y,
		w: size?.w ?? 0,
		h: size?.h ?? 0,
		rotation: o.rotation,
		...(o.isWall ? { isWall: true } : {}),
		walkable: asset?.walkable ?? false,
		doorRequired: asset?.doorRequired ?? false,
	}
	if (o.fillColor) obj.fillColor = o.fillColor
	if (o.strokeColor) obj.strokeColor = o.strokeColor
	if (o.label) obj.label = o.label
	if (walkableGrid) obj.walkableGrid = walkableGrid
	if (tileStates) obj.tileStates = tileStates
	if (wallSegments) obj.wallSegments = wallSegments
	if (o.isWall && [o.x1, o.y1, o.x2, o.y2].every((value): value is number => typeof value === 'number' && Number.isFinite(value))) {
		obj.x1 = o.x1
		obj.y1 = o.y1
		obj.x2 = o.x2
		obj.y2 = o.y2
	}
	if (interactSpots?.length) obj.interactSpots = interactSpots
	if (interact) obj.interact = interact
	if (queue) obj.queue = queue
	return obj
}

function hasPositiveSize(o: ObjectData): boolean {
	return typeof o.w === 'number' && Number.isFinite(o.w) && o.w > 0
		&& typeof o.h === 'number' && Number.isFinite(o.h) && o.h > 0
}
