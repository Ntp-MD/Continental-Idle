import type {
	NpcEngineAgent,
	NpcEngineEvent,
	NpcEngineFloor,
	NpcEngineInteractionTarget,
	NpcEngineLayout,
	NpcEngineOptions,
	NpcEngineQueue,
	NpcEnginePoint,
} from './types'

const DEFAULT_TICKS_PER_SECOND = 60
const EPSILON = 0.000001
const CROSS_FLOOR_COOLDOWN_SECONDS = 30
const PROGRESS_WATCHDOG_TICKS = 120
const MAX_REPATH_ATTEMPTS = 4
const REPATH_COOLDOWN_SECONDS = 2
const REPATH_COOLDOWN_EXPONENT = 1.5
const PATH_BUDGET_MIN_PER_TICK = 2
const PATH_BUDGET_AGENTS_PER_CALL = 100
const CHOOSE_TARGET_MIN_PER_TICK = 8
const CHOOSE_TARGET_AGENTS_PER_SLOT = 20

const EXIT_DIRECTIONS: readonly NpcEnginePoint[] = [
	{ x: 1, y: 0 },
	{ x: -1, y: 0 },
	{ x: 0, y: 1 },
	{ x: 0, y: -1 },
]

type MutableAgent = NpcEngineAgent & {
	path: NpcEnginePoint[]
}

interface MoveProposal {
	agentId: string
	fromKey: string
	toKey: string
	toPoint: NpcEnginePoint
}

function samePoint(a: NpcEnginePoint, b: NpcEnginePoint): boolean {
	return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON
}

function clampRandom(value: number): number {
	return Math.max(0, Math.min(0.9999999999999999, value))
}

function cellKey(floorId: string, x: number, y: number): string {
	return `${floorId}:${Math.floor(x)},${Math.floor(y)}`
}

export class NpcEngine {
	private readonly layout: NpcEngineLayout
	private readonly options: NpcEngineOptions
	private readonly ticksPerSecond: number
	private readonly agentClearance: number
	private readonly random: () => number
	private readonly agents = new Map<string, MutableAgent>()
	private readonly reservations = new Map<string, Set<string>>()
	private readonly reservationKeyByAgent = new Map<string, string>()
	private readonly interactSpotReservations = new Map<string, string>()
	private readonly queueMembers = new Map<string, string[]>()
	private readonly queueSlotReservations = new Map<string, string>()
	private readonly queueArrivalSequence = new Map<string, number>()
	private readonly waitingUntil = new Map<string, number>()
	private readonly blockedTargets = new Map<string, Map<string, number>>()
	private readonly events: NpcEngineEvent[] = []
	private tickCount = 0

	private readonly cellReservations = new Map<string, string>()
	private readonly cellByAgent = new Map<string, string>()
	private readonly floorById = new Map<string, NpcEngineFloor>()
	private readonly queueByKey = new Map<string, NpcEngineQueue>()
	private readonly targetsByKey = new Map<string, NpcEngineInteractionTarget>()
	private readonly portalEndpointsByKey = new Map<string, NpcEngineInteractionTarget>()
	private readonly portalRoutesByPair = new Map<string, NpcEngineInteractionTarget[]>()
	private readonly walkableCellsByFloor = new Map<string, Set<string>>()
	private readonly scratchBlockedCells = new Set<string>()
	private readonly progressWatchdog = new Map<string, number>()
	private readonly repathAttempts = new Map<string, number>()
	private readonly repathCooldownUntil = new Map<string, number>()
	private agentListCache: MutableAgent[] | null = null
	private priorityOffset = 0
	private releasedThisTick = new Set<string>()
	private pathCallsThisTick = 0
	private chooseTargetCallsThisTick = 0
	private readonly walkersScratch: MutableAgent[] = []
	private readonly proposalsScratch = new Map<string, MoveProposal>()
	private readonly agentByFromCellScratch = new Map<string, string>()
	private readonly yieldedScratch = new Set<string>()
	private readonly priorityScratch = new Map<string, number>()

	constructor(layout: NpcEngineLayout, options: NpcEngineOptions) {
		this.layout = layout
		this.options = options
		this.ticksPerSecond = Math.max(1, Math.round(options.ticksPerSecond ?? DEFAULT_TICKS_PER_SECOND))
		this.agentClearance = Math.max(0, options.agentClearance ?? 0.5)
		this.random = options.random ?? Math.random
		for (const floor of layout.floors) this.floorById.set(floor.id, floor)
		for (const queue of layout.queues ?? []) this.queueByKey.set(queue.key, queue)
		for (const target of layout.interactionTargets) {
			this.targetsByKey.set(this.targetKey(target), target)
			if (target.portalEndpointKey) this.portalEndpointsByKey.set(target.portalEndpointKey, target)
		}
	}

	private lastChooseTargetTick = new Map<string, number>()
	private static readonly CHOOSE_TARGET_INTERVAL = 4

	get tickNumber(): number {
		return this.tickCount
	}

	getAgents(): readonly NpcEngineAgent[] {
		return Array.from(this.agents.values()).map(agent => ({ ...agent, path: agent.path.slice() }))
	}

	listAgents(): readonly NpcEngineAgent[] {
		this.agentListCache ??= Array.from(this.agents.values())
		return this.agentListCache
	}

	getAgent(agentId: string): NpcEngineAgent | undefined {
		return this.agents.get(agentId)
	}

	drainEvents(): NpcEngineEvent[] {
		return this.events.splice(0)
	}

	addAgent(agent: Omit<NpcEngineAgent, 'status' | 'path' | 'pathIndex' | 'reservationItemId' | 'reservationInteractSpotId' | 'interactionRemainingTicks' | 'crossFloorCooldownUntil'> & Partial<Pick<NpcEngineAgent, 'status' | 'path' | 'pathIndex' | 'reservationItemId' | 'reservationInteractSpotId' | 'interactionRemainingTicks' | 'crossFloorCooldownUntil'>>): void {
		if (this.agents.has(agent.id)) throw new Error(`NPC agent already exists: ${agent.id}`)
		this.agentListCache = null
		this.agents.set(agent.id, {
			...agent,
			status: agent.status ?? 'idle',
			path: agent.path ? [...agent.path] : [],
			pathIndex: agent.pathIndex ?? 0,
			reservationItemId: agent.reservationItemId ?? null,
			reservationInteractSpotId: agent.reservationInteractSpotId ?? null,
			interactionRemainingTicks: agent.interactionRemainingTicks ?? 0,
			queueKey: agent.queueKey ?? null,
			queuePendingKey: agent.queuePendingKey ?? null,
			queueSlotIndex: agent.queueSlotIndex ?? null,
			queueArrivalSequence: agent.queueArrivalSequence ?? null,
			crossFloorCooldownUntil: agent.crossFloorCooldownUntil ?? 0,
		})
		this.syncCellReservation(this.agents.get(agent.id)!)
		const decideSpreadTicks = Math.floor(clampRandom(this.random()) * this.ticksPerSecond)
		this.lastChooseTargetTick.set(agent.id, this.tickCount + decideSpreadTicks - NpcEngine.CHOOSE_TARGET_INTERVAL)
	}

	removeAgent(agentId: string): boolean {
		const agent = this.agents.get(agentId)
		if (!agent) return false
		this.agentListCache = null
		this.leaveQueue(agent)
		this.releaseReservation(agent)
		this.waitingUntil.delete(agentId)
		this.blockedTargets.delete(agentId)
		this.progressWatchdog.delete(agentId)
		this.repathAttempts.delete(agentId)
		this.repathCooldownUntil.delete(agentId)
		this.clearCellReservation(agentId)
		this.agents.delete(agentId)
		return true
	}

	reset(): void {
		this.agents.clear()
		this.agentListCache = null
		this.reservations.clear()
		this.reservationKeyByAgent.clear()
		this.interactSpotReservations.clear()
		this.queueMembers.clear()
		this.queueSlotReservations.clear()
		this.queueArrivalSequence.clear()
		this.waitingUntil.clear()
		this.blockedTargets.clear()
		this.events.length = 0
		this.tickCount = 0
		this.cellReservations.clear()
		this.cellByAgent.clear()
		this.progressWatchdog.clear()
		this.repathAttempts.clear()
		this.repathCooldownUntil.clear()
		this.priorityOffset = 0
	}

	setAgentFloor(agentId: string, floorId: string): boolean {
		const agent = this.agents.get(agentId)
		if (!agent || !this.getFloor(floorId)) return false
		this.leaveQueue(agent)
		agent.queuePendingKey = null
		this.releaseReservation(agent)
		this.waitingUntil.delete(agent.id)
		this.blockedTargets.delete(agent.id)
		this.progressWatchdog.delete(agent.id)
		this.clearCellReservation(agentId)
		agent.floorId = floorId
		agent.path = []
		agent.pathIndex = 0
		agent.status = 'idle'
		agent.interactionRemainingTicks = 0
		return true
	}

	tick(count = 1): void {
		for (let i = 0; i < Math.max(0, Math.floor(count)); i++) this.step()
	}

	private step(): void {
		this.tickCount++
		this.priorityOffset = this.tickCount % Math.max(1, this.agents.size)
		this.pathCallsThisTick = 0
		this.chooseTargetCallsThisTick = 0
		this.releasedThisTick.clear()
		const releasedInteractions = new Set<string>()

		for (const agent of this.agents.values()) {
			if (agent.status === 'queued') {
				if (this.isQueueFront(agent)) this.chooseTarget(agent)
				continue
			}
			if (agent.status === 'interacting') {
				agent.interactionRemainingTicks--
			if (agent.interactionRemainingTicks <= 0) {
				const itemId = agent.reservationItemId ?? undefined
				const interactSpotId = agent.reservationInteractSpotId ?? undefined
				this.releaseReservation(agent)
				releasedInteractions.add(agent.id)
				this.releasedThisTick.add(agent.id)
				if (!this.standsOnInteractionSpot(agent) || !this.vacateSpotCell(agent)) agent.status = 'idle'
				this.emit({ type: 'interaction-end', agentId: agent.id, floorId: agent.floorId, itemId, interactSpotId })
			}
				continue
			}

			const justReleased = releasedInteractions.has(agent.id)
			if (agent.status === 'waiting') {
				if (this.tickCount < (this.waitingUntil.get(agent.id) ?? 0)) continue
				this.waitingUntil.delete(agent.id)
				agent.status = 'idle'
			}
			if (agent.status === 'idle') {
				const lastTick = this.lastChooseTargetTick.get(agent.id) ?? -Infinity
				const due = this.tickCount - lastTick >= NpcEngine.CHOOSE_TARGET_INTERVAL
				if (justReleased || due) {
					if (this.chooseTargetCallsThisTick >= Math.max(CHOOSE_TARGET_MIN_PER_TICK, Math.ceil(this.agents.size / CHOOSE_TARGET_AGENTS_PER_SLOT))) {
						this.lastChooseTargetTick.set(agent.id, this.tickCount - (NpcEngine.CHOOSE_TARGET_INTERVAL - 1))
						continue
					}
					this.chooseTargetCallsThisTick++
					this.lastChooseTargetTick.set(agent.id, this.tickCount)
					this.chooseTarget(agent)
				}
			}
		}

		this.resolveWalkingAgents()
	}

	private resolveWalkingAgents(): void {
		const walkers = this.walkersScratch
		walkers.length = 0
		for (const agent of this.agents.values()) {
			if (agent.status === 'walking') walkers.push(agent)
		}

		const proposals = this.proposalsScratch
		proposals.clear()
		for (const agent of walkers) {
			const next = agent.path[agent.pathIndex]
			if (!next) {
				proposals.set(agent.id, {
					agentId: agent.id,
					fromKey: cellKey(agent.floorId, agent.x, agent.y),
					toKey: cellKey(agent.floorId, agent.x, agent.y),
					toPoint: { x: agent.x, y: agent.y },
				})
				continue
			}
			proposals.set(agent.id, {
				agentId: agent.id,
				fromKey: cellKey(agent.floorId, agent.x, agent.y),
				toKey: cellKey(agent.floorId, next.x, next.y),
				toPoint: { x: next.x, y: next.y },
			})
		}

		const agentByFromCell = this.agentByFromCellScratch
		agentByFromCell.clear()
		for (const proposal of proposals.values()) agentByFromCell.set(proposal.fromKey, proposal.agentId)
		const priorityByAgentId = this.priorityScratch
		priorityByAgentId.clear()
		walkers.forEach((agent, index) => priorityByAgentId.set(agent.id, (index + this.priorityOffset) % walkers.length))
		const priorityOf = (id: string): number => priorityByAgentId.get(id) ?? Infinity
		const sortedWalkers = walkers.sort((a, b) => {
			const ra = this.releasedThisTick.has(a.id) ? -1 : 0
			const rb = this.releasedThisTick.has(b.id) ? -1 : 0
			return ra - rb || priorityOf(a.id) - priorityOf(b.id)
		})
		const yielded = this.yieldedScratch
		yielded.clear()

		for (const agent of sortedWalkers) {
			const proposal = proposals.get(agent.id)
			if (!proposal) continue

			if (proposal.fromKey === proposal.toKey) {
				this.syncCellReservation(agent)
				continue
			}

			const existingHolder = this.cellReservations.get(proposal.toKey)
			if (existingHolder && existingHolder !== agent.id) {
				yielded.add(agent.id)
				continue
			}

			const swapConflict = this.detectSwapConflict(agent, proposal, proposals, agentByFromCell)
			if (swapConflict) {
				if (priorityOf(agent.id) < priorityOf(swapConflict)) {
					yielded.add(swapConflict)
					this.cellReservations.delete(proposal.fromKey)
				} else {
					yielded.add(agent.id)
					continue
				}
			}

			this.cellReservations.delete(proposal.fromKey)
			this.cellReservations.set(proposal.toKey, agent.id)
		}

		for (const agent of walkers) {
			if (yielded.has(agent.id)) {
				this.handleYielded(agent)
			} else {
				this.executeMove(agent)
			}
		}
	}

	private detectSwapConflict(agent: MutableAgent, proposal: MoveProposal, proposals: Map<string, MoveProposal>, agentByFromCell: Map<string, string>): string | null {
		const otherId = agentByFromCell.get(proposal.toKey)
		if (!otherId || otherId === agent.id) return null
		const otherProposal = proposals.get(otherId)
		return otherProposal?.toKey === proposal.fromKey ? otherId : null
	}

	private executeMove(agent: MutableAgent): void {
		const next = agent.path[agent.pathIndex]
		if (!next) {
			if (agent.queuePendingKey) this.admitQueue(agent)
			else if (agent.queueKey) this.beginQueueWait(agent)
			else this.beginInteraction(agent)
			return
		}

		const distance = Math.hypot(next.x - agent.x, next.y - agent.y)
		const stepDistance = Math.max(0, agent.speed) / this.ticksPerSecond
		if (distance <= stepDistance || distance < EPSILON) {
			agent.x = next.x
			agent.y = next.y
			agent.pathIndex++
			this.syncCellReservation(agent)
			this.resetProgress(agent)
			if (agent.pathIndex >= agent.path.length) {
				if (agent.queuePendingKey) this.admitQueue(agent)
				else if (agent.queueKey) this.beginQueueWait(agent)
				else this.beginInteraction(agent)
			}
			return
		}
		const ratio = stepDistance / distance
		agent.x += (next.x - agent.x) * ratio
		agent.y += (next.y - agent.y) * ratio
		this.syncCellReservation(agent)
		this.resetProgress(agent)
	}

	private handleYielded(agent: MutableAgent): void {
		const stuckSince = this.progressWatchdog.get(agent.id)
		if (stuckSince === undefined) {
			this.progressWatchdog.set(agent.id, this.tickCount)
		}

		const stuckTicks = this.tickCount - (stuckSince ?? this.tickCount)
		if (stuckTicks >= PROGRESS_WATCHDOG_TICKS) {
			this.forceRepath(agent)
			return
		}

		if (this.canRepath(agent)) {
			this.attemptRepath(agent)
			return
		}

		this.emit({ type: 'blocked', agentId: agent.id, floorId: agent.floorId })
		this.setWaiting(agent)
	}

	private canRepath(agent: MutableAgent): boolean {
		const cooldown = this.repathCooldownUntil.get(agent.id) ?? 0
		return this.tickCount >= cooldown
	}

	private attemptRepath(agent: MutableAgent): void {
		if (this.pathBudgetExceeded()) return
		const attempts = this.repathAttempts.get(agent.id) ?? 0
		if (attempts >= MAX_REPATH_ATTEMPTS) {
			this.emit({ type: 'repath-failed', agentId: agent.id, floorId: agent.floorId, itemId: agent.reservationItemId ?? undefined, interactSpotId: agent.reservationInteractSpotId ?? undefined })
			this.markBlocked(agent)
			this.releaseReservation(agent)
			agent.path = []
			agent.pathIndex = 0
			this.setWaiting(agent)
			this.repathAttempts.set(agent.id, 0)
			this.repathCooldownUntil.set(agent.id, this.tickCount + this.ticksPerSecond * REPATH_COOLDOWN_SECONDS * Math.pow(2, MAX_REPATH_ATTEMPTS))
			return
		}

		const floor = this.getFloor(agent.floorId)
		if (!floor) {
			this.setWaiting(agent)
			return
		}

		const blockedCells = this.collectBlockedCells(agent)
		const target = { x: agent.targetX, y: agent.targetY }
		this.pathCallsThisTick++
		const path = this.options.pathfinder(floor, agent, target, blockedCells)

		if (!path || path.length === 0) {
			this.emit({ type: 'repath-failed', agentId: agent.id, floorId: agent.floorId, itemId: agent.reservationItemId ?? undefined, interactSpotId: agent.reservationInteractSpotId ?? undefined })
			this.markBlocked(agent)
			this.releaseReservation(agent)
			agent.path = []
			agent.pathIndex = 0
			this.setWaiting(agent)
			this.repathAttempts.set(agent.id, attempts + 1)
			this.repathCooldownUntil.set(agent.id, this.tickCount + this.ticksPerSecond * REPATH_COOLDOWN_SECONDS * Math.pow(REPATH_COOLDOWN_EXPONENT, attempts))
			return
		}

		agent.path = path.map(point => ({ x: point.x, y: point.y }))
		agent.pathIndex = samePoint(agent.path[0], agent) ? 1 : 0
		this.emit({ type: 'repath', agentId: agent.id, floorId: agent.floorId })
		this.repathAttempts.set(agent.id, attempts + 1)
		this.repathCooldownUntil.set(agent.id, this.tickCount + this.ticksPerSecond * REPATH_COOLDOWN_SECONDS * Math.pow(REPATH_COOLDOWN_EXPONENT, attempts))
	}

	private forceRepath(agent: MutableAgent): void {
		this.progressWatchdog.delete(agent.id)
		this.repathAttempts.set(agent.id, 0)
		this.attemptRepath(agent)
	}

	private collectBlockedCells(agent: MutableAgent): ReadonlySet<string> {
		const blocked = this.scratchBlockedCells
		blocked.clear()
		const floorId = agent.floorId
		for (const other of this.agents.values()) {
			if (other.id === agent.id || other.floorId !== floorId) continue
			blocked.add(`${Math.floor(other.x)},${Math.floor(other.y)}`)
		}
		return blocked
	}

	private syncCellReservation(agent: MutableAgent): void {
		const key = cellKey(agent.floorId, agent.x, agent.y)
		const previous = this.cellByAgent.get(agent.id)
		if (previous === key) return
		if (previous !== undefined && this.cellReservations.get(previous) === agent.id) this.cellReservations.delete(previous)
		this.cellReservations.set(key, agent.id)
		this.cellByAgent.set(agent.id, key)
	}

	private resetProgress(agent: MutableAgent): void {
		this.progressWatchdog.delete(agent.id)
		this.repathAttempts.set(agent.id, 0)
	}

	private clearCellReservation(agentId: string): void {
		const previous = this.cellByAgent.get(agentId)
		if (previous === undefined) return
		if (this.cellReservations.get(previous) === agentId) this.cellReservations.delete(previous)
		this.cellByAgent.delete(agentId)
	}

	private queueSlotKey(queueKey: string, slotIndex: number): string {
		return `${queueKey}:${slotIndex}`
	}

	private getQueue(queueKey: string): NpcEngineQueue | undefined {
		return this.queueByKey.get(queueKey)
	}

	private isQueueFront(agent: MutableAgent): boolean {
		if (!agent.queueKey) return false
		return this.queueMembers.get(agent.queueKey)?.[0] === agent.id
	}

	private queueHasCapacity(queue: NpcEngineQueue): boolean {
		const members = this.queueMembers.get(queue.key)?.length ?? 0
		return members < Math.min(Math.max(0, Math.floor(queue.maxMembers)), queue.slots.length)
	}

	private beginQueueApproach(queue: NpcEngineQueue, agent: MutableAgent): boolean {
		const pendingCountByPoint = new Map<string, number>()
		for (const other of this.agents.values()) {
			if (other.id === agent.id || other.queuePendingKey !== queue.key) continue
			const pointKey = `${other.targetX}|${other.targetY}`
			pendingCountByPoint.set(pointKey, (pendingCountByPoint.get(pointKey) ?? 0) + 1)
		}
		const occupancyOf = (point: NpcEnginePoint): number => pendingCountByPoint.get(`${point.x}|${point.y}`) ?? 0
		const distanceTo = (point: NpcEnginePoint): number => Math.hypot(point.x - agent.x, point.y - agent.y)
		const sortedPoints = queue.admissionPoints.slice().sort((a, b) => occupancyOf(a) - occupancyOf(b) || distanceTo(a) - distanceTo(b))
		const point = sortedPoints[0]
		if (!point) return false
		const floor = this.getFloor(agent.floorId)
		const path = floor ? this.options.pathfinder(floor, agent, point, this.collectBlockedCells(agent)) : null
		if (!path || path.length === 0) return false
		agent.queuePendingKey = queue.key
		agent.targetX = point.x
		agent.targetY = point.y
		agent.path = path.map(value => ({ x: value.x, y: value.y }))
		agent.pathIndex = samePoint(agent.path[0], agent) ? 1 : 0
		agent.status = 'walking'
		return true
	}

	private admitQueue(agent: MutableAgent): void {
		const queueKey = agent.queuePendingKey
		agent.queuePendingKey = null
		const queue = queueKey ? this.getQueue(queueKey) : undefined
		if (!queue || !this.queueHasCapacity(queue) || !this.joinQueue(queue, agent)) {
			agent.status = 'idle'
			this.chooseTarget(agent)
		}
	}

	private beginQueueWait(agent: MutableAgent): void {
		agent.path = []
		agent.pathIndex = 0
		agent.status = 'queued'
		this.emit({ type: 'waiting', agentId: agent.id, floorId: agent.floorId })
	}

	private assignQueueSlot(agent: MutableAgent, queue: NpcEngineQueue, slotIndex: number): boolean {
		const point = queue.slots[slotIndex]
		if (!point) return false
		const floor = this.getFloor(agent.floorId)
		const path = floor ? this.options.pathfinder(floor, agent, point, this.collectBlockedCells(agent)) : null
		if (!path || path.length === 0) return false
		agent.queueSlotIndex = slotIndex
		agent.targetX = point.x
		agent.targetY = point.y
		agent.path = path.map(value => ({ x: value.x, y: value.y }))
		agent.pathIndex = samePoint(agent.path[0], agent) ? 1 : 0
		agent.status = 'walking'
		return true
	}

	private joinQueue(queue: NpcEngineQueue, agent: MutableAgent): boolean {
		if (agent.queueKey === queue.key) return true
		const members = this.queueMembers.get(queue.key) ?? []
		const maxMembers = Math.min(Math.max(0, Math.floor(queue.maxMembers)), queue.slots.length)
		if (members.length >= maxMembers) return false
		const slotIndex = members.length
		const slotKey = this.queueSlotKey(queue.key, slotIndex)
		if (this.queueSlotReservations.has(slotKey)) return false
		const sequence = (this.queueArrivalSequence.get(queue.key) ?? 0) + 1
		this.queueArrivalSequence.set(queue.key, sequence)
		members.push(agent.id)
		this.queueMembers.set(queue.key, members)
		this.queueSlotReservations.set(slotKey, agent.id)
		agent.queueKey = queue.key
		agent.queueArrivalSequence = sequence
		if (!this.assignQueueSlot(agent, queue, slotIndex)) {
			this.queueSlotReservations.delete(slotKey)
			this.queueMembers.set(queue.key, members.filter(id => id !== agent.id))
			agent.queueKey = null
			agent.queueSlotIndex = null
			agent.queueArrivalSequence = null
			return false
		}
		return true
	}

	private leaveQueue(agent: MutableAgent): void {
		const queueKey = agent.queueKey
		if (!queueKey) return
		const queue = this.getQueue(queueKey)
		const members = this.queueMembers.get(queueKey) ?? []
		const index = members.indexOf(agent.id)
		if (index >= 0) members.splice(index, 1)
		if (agent.queueSlotIndex !== null && agent.queueSlotIndex !== undefined) this.queueSlotReservations.delete(this.queueSlotKey(queueKey, agent.queueSlotIndex))
		if (members.length === 0) {
			this.queueMembers.delete(queueKey)
		} else {
			this.queueMembers.set(queueKey, members)
			if (queue) {
				for (let i = 0; i < members.length; i++) {
					const member = this.agents.get(members[i])
					if (!member) continue
					if (member.queueSlotIndex !== null && member.queueSlotIndex !== undefined) this.queueSlotReservations.delete(this.queueSlotKey(queueKey, member.queueSlotIndex))
					member.queueSlotIndex = i
					this.queueSlotReservations.set(this.queueSlotKey(queueKey, i), member.id)
					if (member.status === 'queued' || member.status === 'walking') this.assignQueueSlot(member, queue, i)
				}
			}
		}
		agent.queueKey = null
		agent.queuePendingKey = null
		agent.queueSlotIndex = null
		agent.queueArrivalSequence = null
	}

	private sameFloorTargetsCache = new Map<string, NpcEngineInteractionTarget[]>()

	private getSameFloorTargets(floorId: string): NpcEngineInteractionTarget[] {
		let targets = this.sameFloorTargetsCache.get(floorId)
		if (!targets) {
			targets = this.layout.interactionTargets.filter(target => target.floorId === floorId && !target.transitionToFloorId)
			this.sameFloorTargetsCache.set(floorId, targets)
		}
		return targets
	}

	private pathBudgetExceeded(): boolean {
		return this.pathCallsThisTick >= Math.max(PATH_BUDGET_MIN_PER_TICK, Math.ceil(this.agents.size / PATH_BUDGET_AGENTS_PER_CALL))
	}

	private chooseTarget(agent: MutableAgent): void {
		if (this.pathBudgetExceeded()) return
		const sameFloorTargets = this.getSameFloorTargets(agent.floorId)
		const blocked = this.blockedTargets.get(agent.id)
		const available = sameFloorTargets.filter(target => this.canReserve(target, agent.id) && (blocked?.get(this.targetKey(target)) ?? 0) <= this.tickCount)
		let selected = this.options.targetSelector
			? this.options.targetSelector(agent, available)
			: this.defaultTarget(agent, available)


		if (!selected && agent.crossFloorCooldownUntil <= this.tickCount && this.options.crossFloorSelector) {
			const crossCandidates = this.layout.interactionTargets.filter(t =>
				t.floorId !== agent.floorId &&
				!t.transitionToFloorId &&
				this.canReserve(t, agent.id) &&
				this.isRoleAllowedOnFloor(agent, t.floorId) &&
				(blocked?.get(this.targetKey(t)) ?? 0) <= this.tickCount,
			)
			if (crossCandidates.length > 0) {
				const dest = this.options.crossFloorSelector(agent, crossCandidates, this.layout.floors)
				if (dest && this.isValidCrossFloorResult(dest, crossCandidates)) {
					const portal = this.findPortalRoute(agent.floorId, dest.floorId, agent.id)
					if (portal && this.canReserve(portal, agent.id)) selected = portal
				}
			}
		}

		if (!selected && agent.queueKey) {
			const queue = this.getQueue(agent.queueKey)
			if (queue) {
				const queueTargetKeys = new Set(queue.targetKeys)
				selected = available.find(target => queueTargetKeys.has(this.targetKey(target))) ?? null
			}
			if (!selected) {
				this.leaveQueue(agent)
				this.setWaiting(agent)
				return
			}
		}

		if (selected && agent.queueKey) this.leaveQueue(agent)
		if (!selected) {
			const queue = this.options.queueSelector?.(agent, sameFloorTargets, available, this.layout.queues ?? [])
			if (queue && this.queueHasCapacity(queue) && this.beginQueueApproach(queue, agent)) return
			if (this.options.targetSelector && this.options.wanderSelector) {
				const wander = this.options.wanderSelector(agent)
				if (wander && !this.isOccupied(agent, wander)) {
					agent.targetX = wander.x
					agent.targetY = wander.y
					const floor = this.getFloor(agent.floorId)
					const blockedCells = this.collectBlockedCells(agent)
					this.pathCallsThisTick++
					const path = floor ? this.options.pathfinder(floor, agent, { x: wander.x, y: wander.y }, blockedCells) : null
					if (path && path.length > 0) {
						agent.path = path.map(point => ({ x: point.x, y: point.y }))
						agent.pathIndex = samePoint(agent.path[0], agent) ? 1 : 0
						agent.status = 'walking'
						return
					}
				}
				this.setWaiting(agent)
				return
			}
			if (this.options.targetSelector) {
				this.setWaiting(agent)
				return
			}
			if (sameFloorTargets.length > 0) {
				this.setWaiting(agent, sameFloorTargets[0].itemId)
			} else {
				agent.status = 'idle'
			}
			return
		}


		if (selected.floorId !== agent.floorId && !selected.transitionToFloorId) {
			this.setWaiting(agent)
			return
		}

		if (!this.reserve(selected, agent.id)) {
			this.setWaiting(agent)
			this.emit({ type: 'waiting', agentId: agent.id, floorId: agent.floorId, itemId: selected.itemId, interactSpotId: selected.interactSpotId })
			return
		}

		agent.targetX = selected.x
		agent.targetY = selected.y
		const floor = this.getFloor(agent.floorId)
		const blockedCells = this.collectBlockedCells(agent)
		this.pathCallsThisTick++
		const path = floor ? this.options.pathfinder(floor, agent, selected, blockedCells) : null
		if (!path || path.length === 0) {
			this.releaseReservation(agent)
			this.markBlocked(agent)
			agent.status = 'idle'
			this.emit({ type: 'repath-failed', agentId: agent.id, floorId: agent.floorId, itemId: selected.itemId, interactSpotId: selected.interactSpotId })
			return
		}
		agent.path = path.map(point => ({ x: point.x, y: point.y }))
		agent.pathIndex = samePoint(agent.path[0], agent) ? 1 : 0
		agent.status = 'walking'
	}

	private defaultTarget(_agent: MutableAgent, targets: readonly NpcEngineInteractionTarget[]): NpcEngineInteractionTarget | null {
		const tags = this.options.targetTags ?? []
		const matching = tags.length === 0 ? targets : targets.filter(target => target.tags.some(tag => tags.includes(tag)))
		return matching[0] ?? null
	}

	private beginInteraction(agent: MutableAgent): void {
		const target = agent.reservationItemId !== null && agent.reservationInteractSpotId !== null
			? this.targetsByKey.get(`${agent.floorId}:${agent.reservationItemId}:${agent.reservationInteractSpotId}`)
			: undefined
		if (!target) {
			this.releaseReservation(agent)
			agent.status = 'idle'
			return
		}


		if (target.transitionToFloorId && target.destinationPortalKey) {

			const destEndpoint = this.portalEndpointsByKey.get(target.destinationPortalKey)
			if (!destEndpoint) {
				this.releaseReservation(agent)
				agent.status = 'idle'
				this.emit({ type: 'repath-failed', agentId: agent.id, floorId: agent.floorId, itemId: target.itemId, interactSpotId: target.interactSpotId })
				return
			}


			if (this.isOccupied(agent, destEndpoint, target.transitionToFloorId)) {

				this.releaseReservation(agent)
				this.setWaiting(agent)
				return
			}

			this.releaseReservation(agent)
			const fromFloorId = agent.floorId

			this.setAgentFloor(agent.id, target.transitionToFloorId)

			agent.x = destEndpoint.x
			agent.y = destEndpoint.y
			this.syncCellReservation(agent)

			agent.crossFloorCooldownUntil = this.tickCount + CROSS_FLOOR_COOLDOWN_SECONDS * this.ticksPerSecond

			this.emit({ type: 'floor-transition', agentId: agent.id, floorId: target.transitionToFloorId, fromFloorId, toFloorId: target.transitionToFloorId })

			return
		}


		if (this.isOccupiedByScan(agent, target, target.floorId)) {
			this.releaseReservation(agent)
			this.setWaiting(agent)
			return
		}
		agent.x = target.x
		agent.y = target.y
		this.syncCellReservation(agent)
		agent.status = 'interacting'
		agent.interactionRemainingTicks = this.durationTicks(target)
		this.emit({ type: 'interaction-start', agentId: agent.id, floorId: agent.floorId, itemId: target.itemId, interactSpotId: target.interactSpotId })
	}

	private targetKey(target: NpcEngineInteractionTarget): string {
		return `${target.floorId}:${target.itemId}:${target.interactSpotId}`
	}

	private setWaiting(agent: MutableAgent, emitItemId?: string): void {
		if (agent.queueKey) this.leaveQueue(agent)
		agent.queuePendingKey = null
		if (agent.reservationItemId !== null) this.releaseReservation(agent)
		const vacated = this.standsOnInteractionSpot(agent) && this.vacateSpotCell(agent)
		if (!vacated) {
			agent.status = 'waiting'
			const jitter = Math.floor(this.random() * this.ticksPerSecond)
			this.waitingUntil.set(agent.id, this.tickCount + this.ticksPerSecond + jitter)
		}
		if (emitItemId !== undefined) this.emit({ type: 'waiting', agentId: agent.id, floorId: agent.floorId, itemId: emitItemId })
	}

	private standsOnInteractionSpot(agent: MutableAgent): boolean {
		const cx = Math.floor(agent.x)
		const cy = Math.floor(agent.y)
		for (const target of this.targetsByKey.values()) {
			if (target.transitionToFloorId) continue
			if (target.floorId === agent.floorId && target.x === cx && target.y === cy) return true
		}
		return false
	}

	private walkableCellSet(floorId: string): Set<string> | null {
		let cells = this.walkableCellsByFloor.get(floorId)
		if (!cells) {
			const floor = this.floorById.get(floorId)
			if (!floor) return null
			cells = new Set(floor.walkable.map(point => `${point.x},${point.y}`))
			this.walkableCellsByFloor.set(floorId, cells)
		}
		return cells
	}

	private vacateSpotCell(agent: MutableAgent): boolean {
		const floor = this.getFloor(agent.floorId)
		if (!floor) return false
		const cells = this.walkableCellSet(floor.id)
		const fromX = Math.floor(agent.x)
		const fromY = Math.floor(agent.y)
		for (const direction of EXIT_DIRECTIONS) {
			const exit = { x: fromX + direction.x, y: fromY + direction.y }
			if (cells && cells.size > 0 && !cells.has(`${exit.x},${exit.y}`)) continue
			if (this.isOccupied(agent, exit)) continue
			this.pathCallsThisTick++
			const path = this.options.pathfinder(floor, agent, exit, this.collectBlockedCells(agent))
			if (!path || path.length === 0) continue
			agent.path = path.map(point => ({ x: point.x, y: point.y }))
			agent.pathIndex = samePoint(agent.path[0], agent) ? 1 : 0
			agent.status = 'walking'
			return true
		}
		return false
	}

	private markBlocked(agent: MutableAgent): void {
		if (agent.reservationItemId === null || agent.reservationInteractSpotId === null) return
		const target = this.targetsByKey.get(`${agent.floorId}:${agent.reservationItemId}:${agent.reservationInteractSpotId}`)
		if (!target) return
		const blocked = this.blockedTargets.get(agent.id) ?? new Map<string, number>()
		for (const [key, until] of blocked) if (until <= this.tickCount) blocked.delete(key)
		blocked.set(this.targetKey(target), this.tickCount + this.ticksPerSecond * 2)
		this.blockedTargets.set(agent.id, blocked)
	}

	private isOccupied(agent: MutableAgent, point: NpcEnginePoint, floorId?: string): boolean {
		const checkFloorId = floorId ?? agent.floorId
		const clearance = this.agentClearance
		if (clearance >= 1) return this.isOccupiedByScan(agent, point, checkFloorId)
		const minX = Math.floor(point.x - clearance)
		const maxX = Math.floor(point.x + clearance)
		const minY = Math.floor(point.y - clearance)
		const maxY = Math.floor(point.y + clearance)
		for (let cy = minY; cy <= maxY; cy++) {
			for (let cx = minX; cx <= maxX; cx++) {
				const holderId = this.cellReservations.get(cellKey(checkFloorId, cx, cy))
				if (!holderId || holderId === agent.id) continue
				const other = this.agents.get(holderId)
				if (!other) continue
				if (Math.hypot(other.x - point.x, other.y - point.y) <= clearance) return true
				if (other.status === 'walking') {
					const next = other.path[other.pathIndex]
					if (next && Math.hypot(next.x - point.x, next.y - point.y) <= clearance) return true
				}
			}
		}
		return false
	}

	private isOccupiedByScan(agent: MutableAgent, point: NpcEnginePoint, checkFloorId: string): boolean {
		for (const other of this.agents.values()) {
			if (other.id === agent.id || other.floorId !== checkFloorId) continue
			if (Math.hypot(other.x - point.x, other.y - point.y) <= this.agentClearance) return true
			if (other.status === 'walking') {
				const next = other.path[other.pathIndex]
				if (next && Math.hypot(next.x - point.x, next.y - point.y) <= this.agentClearance) return true
			}
		}
		return false
	}

	private canReserve(target: NpcEngineInteractionTarget, agentId: string): boolean {
		const key = `${target.floorId}:${target.itemId}`
		const interactSpotKey = `${key}:${target.interactSpotId}`
		const holders = this.reservations.get(key)
		if (holders?.has(agentId)) return true
		if (this.interactSpotReservations.has(interactSpotKey) || (holders?.size ?? 0) >= Math.max(1, Math.floor(target.capacity ?? 1))) return false
		return !this.reservationKeyByAgent.has(agentId)
	}

	private reserve(target: NpcEngineInteractionTarget, agentId: string): boolean {
		const key = `${target.floorId}:${target.itemId}`
		const interactSpotKey = `${key}:${target.interactSpotId}`
		const holders = this.reservations.get(key) ?? new Set<string>()
		const capacity = Math.max(1, Math.floor(target.capacity ?? 1))
		if (holders.has(agentId)) return true
		if (this.interactSpotReservations.has(interactSpotKey) || holders.size >= capacity) return false
		if (this.reservationKeyByAgent.has(agentId)) return false
		holders.add(agentId)
		this.reservations.set(key, holders)
		this.reservationKeyByAgent.set(agentId, key)
		this.interactSpotReservations.set(interactSpotKey, agentId)
		const agent = this.agents.get(agentId)
		if (agent) {
			agent.reservationItemId = target.itemId
			agent.reservationInteractSpotId = target.interactSpotId
		}
		return true
	}

	private releaseReservation(agent: MutableAgent): void {
		if (agent.reservationItemId !== null) {
			const key = `${agent.floorId}:${agent.reservationItemId}`
			const interactSpotKey = `${key}:${agent.reservationInteractSpotId ?? ''}`
			const holders = this.reservations.get(key)
			holders?.delete(agent.id)
			this.interactSpotReservations.delete(interactSpotKey)
			this.reservationKeyByAgent.delete(agent.id)
			if (holders?.size === 0) this.reservations.delete(key)
		}
		agent.reservationItemId = null
		agent.reservationInteractSpotId = null
		agent.interactionRemainingTicks = 0
	}

	private durationTicks(target: NpcEngineInteractionTarget): number {
		const min = Math.max(0, Math.ceil(Math.min(target.durationMinSeconds, target.durationMaxSeconds) * this.ticksPerSecond))
		const max = Math.max(min, Math.floor(Math.max(target.durationMinSeconds, target.durationMaxSeconds) * this.ticksPerSecond))
		return min + Math.floor(clampRandom(this.random()) * (max - min + 1))
	}

	private getFloor(floorId: string): NpcEngineFloor | undefined {
		return this.floorById.get(floorId)
	}

	private isRoleAllowedOnFloor(agent: MutableAgent, floorId: string): boolean {
		const floor = this.getFloor(floorId)
		if (!floor?.allowedRoleIds?.length) return true
		return floor.allowedRoleIds.includes(agent.roleId ?? '')
	}

	private isValidCrossFloorResult(target: NpcEngineInteractionTarget, candidates: readonly NpcEngineInteractionTarget[]): boolean {
		return candidates.some(c => c.floorId === target.floorId && c.itemId === target.itemId && c.interactSpotId === target.interactSpotId)
	}

	private findPortalRoute(sourceFloorId: string, destFloorId: string, agentId: string): NpcEngineInteractionTarget | null {
		const pairKey = `${sourceFloorId}>${destFloorId}`
		let routes = this.portalRoutesByPair.get(pairKey)
		if (!routes) {
			routes = this.layout.interactionTargets.filter(t => t.floorId === sourceFloorId && t.transitionToFloorId === destFloorId)
			this.portalRoutesByPair.set(pairKey, routes)
		}
		return routes.find(t => this.canReserve(t, agentId)) ?? null
	}

	private emit(event: Omit<NpcEngineEvent, 'tick'>): void {
		this.events.push({ ...event, tick: this.tickCount })
	}
}
