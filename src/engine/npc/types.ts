export interface NpcEnginePoint {
	x: number
	y: number

	roleId?: string
}

export interface NpcEngineFloor {
	id: string
	width: number
	height: number
	tileSize: number

	walkable: readonly NpcEnginePoint[]

	blockedEdges?: readonly NpcEngineBlockedEdge[]

	allowedRoleIds?: readonly string[]
}

export interface NpcEngineBlockedEdge {
	from: NpcEnginePoint
	to: NpcEnginePoint
}

export interface NpcEngineInteractionTarget {
	floorId: string
	itemId: string
	anchorId: string
	x: number
	y: number
	tags: readonly string[]
	capacity?: number
	durationMinSeconds: number
	durationMaxSeconds: number

	transitionToFloorId?: string

	destinationPortalKey?: string

	portalEndpointKey?: string
}

export interface NpcEngineLayout {
	floors: readonly NpcEngineFloor[]
	interactionTargets: readonly NpcEngineInteractionTarget[]
}

export type NpcEngineAgentStatus = 'walking' | 'waiting' | 'interacting' | 'idle'

export interface NpcEngineAgent {
	id: string

	roleId?: string
	floorId: string
	x: number
	y: number
	targetX: number
	targetY: number
	speed: number
	status: NpcEngineAgentStatus
	path: readonly NpcEnginePoint[]
	pathIndex: number
	reservationItemId: string | null
	reservationAnchorId: string | null
	interactionRemainingTicks: number

	crossFloorCooldownUntil: number
}

export type NpcEngineEventType =
	| 'waiting'
	| 'interaction-start'
	| 'interaction-end'
	| 'blocked'
	| 'repath'
	| 'repath-failed'
	| 'floor-transition'

export interface NpcEngineEvent {
	type: NpcEngineEventType
	agentId: string
	floorId: string
	itemId?: string
	anchorId?: string
	tick: number

	fromFloorId?: string
	toFloorId?: string
}

export type NpcEnginePathfinder = (
	floor: NpcEngineFloor,
	from: NpcEnginePoint,
	to: NpcEnginePoint,
	blockedCells?: ReadonlySet<string>,
) => readonly NpcEnginePoint[] | null

export interface NpcEngineOptions {
	ticksPerSecond?: number

	agentClearance?: number
	random?: () => number
	pathfinder: NpcEnginePathfinder
	targetSelector?: (
		agent: NpcEngineAgent,
		targets: readonly NpcEngineInteractionTarget[],
	) => NpcEngineInteractionTarget | null

	wanderSelector?: (agent: NpcEngineAgent) => NpcEnginePoint | null
	targetTags?: readonly string[]


	crossFloorSelector?: (
		agent: NpcEngineAgent,
		candidates: readonly NpcEngineInteractionTarget[],
		floors: readonly NpcEngineFloor[],
	) => NpcEngineInteractionTarget | null
}
