/**
 * Pure BlueprintData <-> SyncedLayoutPayload boundary.
 *
 * Egress: buildSyncedPayload (editor -> game DTO).
 * Ingress: loadSyncedPayload (game DTO -> runtime FloorData + canvas).
 *
 * Single source of truth for floor-key assignment and object field
 * propagation, shared by the egress builder and the game's boot-time
 * loader. Kept free of editor-state / DOM imports so it can run headless
 * in tests. The toolbar Sync Game button was removed, so egress currently
 * has no UI trigger.
 */
import type {
	AssetDef,
	FloorData,
	FloorLayoutData,
	NpcSimulationConfig,
	ObjectData,
	SyncedFloor,
	SyncedLayoutPayload,
	SyncedObject,
} from './domain/types'
import {
	isFiniteNumber,
	normalizeAllowedRoleIds,
	normalizeFloorWalkable,
	normalizeNpcConfig,
	normalizeNpcSpawnZones,
	normalizeObjectPlacement,
	normalizeText,
	resolveDefaultWalkable,
	resolveObjectDef,
	resolveStreetTiles,
} from './domain/types'
import { editorLog } from './domain/logger'
import { assetSizeFor } from './domain/geometry'

export function buildSyncedPayload(
	layout: FloorLayoutData,
	assets: ReadonlyMap<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): SyncedLayoutPayload | null {
	try {
		const floors: Record<string, SyncedFloor> = {}
		const floorKeys = assignSyncKeys(layout.floors)
		const tileSize = layout.canvas.tileSize
		for (const floor of layout.floors) {
			const floorId = floorKeys.get(floor.id)
			if (!floorId) continue
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
		}
		if (Object.keys(floors).length === 0) return null

		const normalizedNpcConfig = npcConfig ? normalizeNpcConfig(npcConfig) : undefined
		const streetFloorKey = layout.streetFloorId ? floorKeys.get(layout.streetFloorId) : undefined
		return {
			version: SYNCED_PAYLOAD_VERSION,
			canvas: {
				width: layout.canvas.width,
				height: layout.canvas.height,
				tileSize: layout.canvas.tileSize,
				...(layout.canvas.bgColor ? { bgColor: layout.canvas.bgColor } : {}),
				streetWidthTiles: resolveStreetTiles(layout),
				...(streetFloorKey ? { streetFloorId: streetFloorKey } : {}),
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

export interface SyncedRuntimeCanvas {
	w: number
	h: number
	tileSize: number
	streetTiles?: number
	streetFloorId?: string
}

export interface LoadedRuntimeLayout {
	floors: FloorData[]
	canvas: SyncedRuntimeCanvas
}

export const SYNCED_PAYLOAD_VERSION = 3

/**
 * Ingress loader for the game/runtime: normalizes a synced payload back
 * into the runtime `FloorData[]` + canvas the shared engine consumes.
 * Asset definitions stay a caller concern (the runtime loads origin
 * assets from the data file and passes the asset map into the engine).
 */
export function loadSyncedPayload(payload: SyncedLayoutPayload): LoadedRuntimeLayout {
	if (payload.version !== SYNCED_PAYLOAD_VERSION) {
		throw new Error(`Unsupported synced payload version ${payload.version} (want ${SYNCED_PAYLOAD_VERSION})`)
	}
	const floors = Object.entries(payload.floors)
		.sort(([a], [b]) => compareFloorKeys(a, b))
		.map(([key, synced]) => toFloorData(key, synced))
	const canvas: SyncedRuntimeCanvas = {
		w: payload.canvas.width,
		h: payload.canvas.height,
		tileSize: payload.canvas.tileSize,
		streetTiles: payload.canvas.streetWidthTiles,
	}
	if (payload.canvas.streetFloorId && payload.floors[payload.canvas.streetFloorId]) {
		canvas.streetFloorId = payload.canvas.streetFloorId
	}
	return { floors, canvas }
}

/**
 * Assign one stable sync key per floor. Keys are a function of each
 * floor's own identity (canonical label, else stable id order), never of
 * array position, so reordering floors leaves every key unchanged.
 */
export function assignSyncKeys(floors: readonly { id: string; label: string }[]): Map<string, string> {
	const ordered = [...floors].sort((a, b) => compareFloorIds(a.id, b.id))
	const used = new Set<string>()
	const keys = new Map<string, string>()
	ordered.forEach((floor, ordinal) => {
		const canonical = editorFloorLabelToFloorId(floor.label)
		const base = canonical ?? (ordinal === 0 ? 'G' : String(ordinal))
		let key = base
		let n = 2
		while (used.has(key)) {
			key = `${base}_${n}`
			n++
		}
		used.add(key)
		keys.set(floor.id, key)
	})
	return keys
}

export function compareFloorKeys(a: string, b: string): number {
	if (a === b) return 0
	const rank = floorKeyRank(a) - floorKeyRank(b)
	if (rank !== 0) return rank
	if (floorKeyRank(a) === 1) return Number(a) - Number(b)
	return a < b ? -1 : 1
}

function floorKeyRank(key: string): number {
	if (key === 'G') return 0
	return /^\d+$/.test(key) ? 1 : 2
}

function compareFloorIds(a: string, b: string): number {
	if (a === b) return 0
	return a < b ? -1 : 1
}

function editorFloorLabelToFloorId(label: string): string | null {
	if (label === 'G') return 'G'
	const match = label.match(/^F(\d+)$/)
	if (match) {
		const floorNumber = parseInt(match[1], 10)
		return floorNumber === 0 ? 'G' : String(floorNumber)
	}
	return null
}

function toFloorData(key: string, synced: SyncedFloor): FloorData {
	const floor: FloorData = {
		id: key,
		name: key,
		label: key,
		objects: synced.objects.map(toObjectData).filter((object): object is ObjectData => object !== null),
	}
	if (typeof synced.defaultWalkable === 'boolean') floor.defaultWalkable = synced.defaultWalkable
	const walkable = normalizeFloorWalkable(synced.walkable)
	if (walkable) floor.walkable = walkable
	const spawnZones = normalizeNpcSpawnZones(synced.spawnZones)
	if (spawnZones?.length) floor.spawnZones = spawnZones
	const allowedRoleIds = normalizeAllowedRoleIds(synced.allowedRoleIds)
	if (allowedRoleIds) floor.allowedRoleIds = allowedRoleIds
	return floor
}

function toObjectData(o: SyncedObject): ObjectData | null {
	const placement = normalizeObjectPlacement(o)
	if (!placement) return null
	const object: ObjectData = {
		...placement,
		w: isFiniteNumber(o.w) ? o.w : 0,
		h: isFiniteNumber(o.h) ? o.h : 0,
	}
	const label = normalizeText(o.label)
	if (label) object.label = label
	return object
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
