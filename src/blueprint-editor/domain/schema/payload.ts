import type { Rotation } from './primitives'
import type { FloorWalkable, TileState } from './walkable'
import type { InteractConfig, InteractSpot, NpcQueueConfig } from './interact'
import type { NpcSpawnZone } from './objects'
import type { NpcSimulationConfig } from './npc'

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
	doorRequired?: boolean
	walkableGrid?: boolean[][]
	tileStates?: TileState[][]
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

