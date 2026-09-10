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
} from './domain/types'
import {
	normalizeAllowedRoleIds,
	normalizeFloorWalkable,
	normalizeNpcConfig,
	normalizeNpcSpawnZones,
	resolveDefaultWalkable,
	resolveObjectDef,
	resolveStreetTiles,
} from './domain/types'
import { assignSyncKey, editorLog } from './store/storeUtils'
import { assetSizeFor } from './domain/geometry'

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
				defaultWalkable: resolveDefaultWalkable(floor),
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
	const definition = resolveObjectDef(o.rotation ?? 0, asset, size ?? undefined)
	const obj: SyncedObject = {
		id: o.id,
		type: o.type,
		x: o.x,
		y: o.y,
		w: size?.w ?? 0,
		h: size?.h ?? 0,
		rotation: o.rotation,
		walkable: definition.walkable,
		doorRequired: definition.doorRequired,
	}
	if (o.fillColor) obj.fillColor = o.fillColor
	if (o.strokeColor) obj.strokeColor = o.strokeColor
	if (o.label) obj.label = o.label
	if (definition.walkableGrid) obj.walkableGrid = definition.walkableGrid
	if (definition.tileStates) obj.tileStates = definition.tileStates
	if (definition.interactSpots?.length) obj.interactSpots = definition.interactSpots
	if (definition.interact) obj.interact = definition.interact
	if (definition.queue) obj.queue = definition.queue
	return obj
}

function hasPositiveSize(o: ObjectData): boolean {
	return typeof o.w === 'number' && Number.isFinite(o.w) && o.w > 0
		&& typeof o.h === 'number' && Number.isFinite(o.h) && o.h > 0
}
