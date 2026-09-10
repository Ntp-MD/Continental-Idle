export interface NpcEnginePoint {
	x: number
	y: number
}

export interface NpcEngineFloor {
	id: string
	width: number
	height: number
	tileSize: number

	walkable: readonly NpcEnginePoint[]

	allowedRoleIds?: readonly string[]
}

export interface NpcEngineInteractionTarget {
	floorId: string
	itemId: string
	interactSpotId: string
	x: number
	y: number
	tags: readonly string[]
	capacity?: number
	durationMinSeconds: number
	durationMaxSeconds: number

	transitionToFloorId?: string

	destinationPortalKey?: string

	portalEndpointKey?: string

	roomId?: string

	roomType?: string

	roomPrivate?: boolean
}

export interface NpcEngineQueue {
	key: string
	targetKeys: readonly string[]
	slots: readonly NpcEnginePoint[]
	admissionPoints: readonly NpcEnginePoint[]
	maxMembers: number
}

export interface NpcEngineLayout {
	floors: readonly NpcEngineFloor[]
	interactionTargets: readonly NpcEngineInteractionTarget[]
	queues?: readonly NpcEngineQueue[]
}

export type NpcEngineAgentStatus = 'walking' | 'queued' | 'waiting' | 'interacting' | 'chatting' | 'idle'

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
	reservationInteractSpotId: string | null
	interactionRemainingTicks: number
	chatPartnerId: string | null
	queueKey?: string | null
	queuePendingKey?: string | null
	queueSlotIndex?: number | null
	queueArrivalSequence?: number | null

	crossFloorCooldownUntil: number
}

export type NpcEngineEventType =
	| 'waiting'
	| 'interaction-start'
	| 'interaction-end'
	| 'chatting-start'
	| 'chatting-end'
	| 'blocked'
	| 'repath'
	| 'repath-failed'
	| 'floor-transition'

export type NpcEngineWaitReason =
	| 'yielded'
	| 'repath-failed'
	| 'repath-blocked'
	| 'no-floor'
	| 'queue-left'
	| 'no-wander'
	| 'no-target'
	| 'wrong-floor'
	| 'reserve-raced'
	| 'no-path'
	| 'portal-busy'
	| 'spot-busy'
	| 'queued'

export interface NpcEngineEvent {
	type: NpcEngineEventType
	agentId: string
	floorId: string
	itemId?: string
	interactSpotId?: string
	reason?: NpcEngineWaitReason
	partnerId?: string
	tick: number

	fromFloorId?: string
	toFloorId?: string
}

export type NpcEnginePathfinder = (
	floor: NpcEngineFloor,
	agent: NpcEngineAgent,
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
	socialSelector?: (
		agent: NpcEngineAgent,
		candidates: readonly NpcEngineAgent[],
	) => NpcEngineAgent | null
	queueSelector?: (
		agent: NpcEngineAgent,
		targets: readonly NpcEngineInteractionTarget[],
		availableTargets: readonly NpcEngineInteractionTarget[],
		queues: readonly NpcEngineQueue[],
	) => NpcEngineQueue | null
	targetTags?: readonly string[]


	crossFloorSelector?: (
		agent: NpcEngineAgent,
		candidates: readonly NpcEngineInteractionTarget[],
		floors: readonly NpcEngineFloor[],
	) => NpcEngineInteractionTarget | null

	crossFloorCooldownSeconds: number
	queuePatienceSeconds?: number
	socialRadius?: number
	socialCooldownSeconds?: number
	socialChatDurationMinSeconds?: number
	socialChatDurationMaxSeconds?: number
	progressWatchdogTicks: number
	maxRepathAttempts: number
	repathCooldownSeconds: number
	repathCooldownExponent: number
	pathBudgetMinPerTick: number
	pathBudgetAgentsPerCall: number
	chooseTargetMinPerTick: number
	chooseTargetAgentsPerSlot: number
	wanderMemorySize: number
	wanderSmallMapThreshold: number
	triggerRatePeriodSeconds: number
}
