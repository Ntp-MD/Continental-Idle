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
	normalizeTileEdges,
	normalizeTileStates,
	normalizeWalkableGrid,
	resolveStreetTiles,
} from './types'
import { assignSyncKey } from './store/storeUtils'

export function buildSyncedPayload(
	layout: FloorLayoutData,
	assets: ReadonlyMap<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): SyncedLayoutPayload | null {
	try {
		const floors: Record<string, SyncedFloor> = {}
		const usedKeys = new Set<string>()
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
				objects: floor.objects.map((o: ObjectData) => buildSyncedObject(o, assets)),
			}
		})
		if (Object.keys(floors).length === 0) return null

		const normalizedNpcConfig = npcConfig ? normalizeNpcConfig(npcConfig) : undefined
		return {
			version: 3,
			canvas: { ...layout.canvas, streetWidthTiles: resolveStreetTiles(layout) },
			floors,
			...(normalizedNpcConfig ? { npcConfig: normalizedNpcConfig } : {}),
			timestamp: Date.now(),
		}
	} catch {
		return null
	}
}

function buildSyncedObject(o: ObjectData, assets: ReadonlyMap<string, AssetDef>): SyncedObject {
	const asset = assets.get(o.type)
	const interactSpots = normalizeInteractSpots(asset?.interactSpots)
	const interact = normalizeInteractConfig(asset?.interact)
	const queue = normalizeNpcQueueConfig(asset?.queue)
	const walkableGrid = normalizeWalkableGrid(asset?.walkableGrid)
	const tileStates = normalizeTileStates(asset?.tileStates)
	const tileEdges = normalizeTileEdges(asset?.tileEdges)
	const obj: SyncedObject = {
		id: o.id,
		type: o.type,
		x: o.x,
		y: o.y,
		w: o.w,
		h: o.h,
		rotation: o.rotation,
		walkable: asset?.walkable ?? false,
		entranceRequired: asset?.entranceRequired ?? false,
	}
	if (o.fillColor) obj.fillColor = o.fillColor
	if (o.strokeColor) obj.strokeColor = o.strokeColor
	if (o.label) obj.label = o.label
	if (walkableGrid) obj.walkableGrid = walkableGrid
	if (tileStates) obj.tileStates = tileStates
	if (tileEdges) obj.tileEdges = tileEdges
	if (interactSpots?.length) obj.interactSpots = interactSpots
	if (interact) obj.interact = interact
	if (queue) obj.queue = queue
	return obj
}
