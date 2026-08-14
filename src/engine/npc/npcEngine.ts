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
	private readonly interactSpotReservations = new Map<string, string>()
	private readonly queueMembers = new Map<string, string[]>()
	private readonly queueSlotReservations = new Map<string, string>()
	private readonly queueArrivalSequence = new Map<string, number>()
	private readonly waitingUntil = new Map<string, number>()
	private readonly blockedTargets = new Map<string, Map<string, number>>()
	private readonly events: NpcEngineEvent[] = []
	private tickCount = 0

	private readonly cellReservations = new Map<string, string>()
	private readonly progressWatchdog = new Map<string, number>()
	private readonly repathAttempts = new Map<string, number>()
	private readonly repathCooldownUntil = new Map<string, number>()
	private priorityOffset = 0

	constructor(layout: NpcEngineLayout, options: NpcEngineOptions) {
		this.layout = layout
		this.options = options
		this.ticksPerSecond = Math.max(1, Math.round(options.ticksPerSecond ?? DEFAULT_TICKS_PER_SECOND))
		this.agentClearance = Math.max(0, options.agentClearance ?? 0.5)
		this.random = options.random ?? Math.random
	}

	get tickNumber(): number {
		return this.tickCount
	}

	getAgents(): readonly NpcEngineAgent[] {
		return Array.from(this.agents.values()).map(agent => ({ ...agent, path: agent.path.slice() }))
	}

	drainEvents(): NpcEngineEvent[] {
		return this.events.splice(0)
	}

	addAgent(agent: Omit<NpcEngineAgent, 'status' | 'path' | 'pathIndex' | 'reservationItemId' | 'reservationInteractSpotId' | 'interactionRemainingTicks' | 'crossFloorCooldownUntil'> & Partial<Pick<NpcEngineAgent, 'status' | 'path' | 'pathIndex' | 'reservationItemId' | 'reservationInteractSpotId' | 'interactionRemainingTicks' | 'crossFloorCooldownUntil'>>): void {
		if (this.agents.has(agent.id)) throw new Error(`NPC agent already exists: ${agent.id}`)
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
	}

	removeAgent(agentId: string): boolean {
		const agent = this.agents.get(agentId)
		if (!agent) return false
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
		this.reservations.clear()
		this.interactSpotReservations.clear()
		this.queueMembers.clear()
		this.queueSlotReservations.clear()
		this.queueArrivalSequence.clear()
		this.waitingUntil.clear()
		this.blockedTargets.clear()
		this.events.length = 0
		this.tickCount = 0
		this.cellReservations.clear()
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
		this.cellReservations.clear()
		this.priorityOffset = this.tickCount % Math.max(1, this.agents.size)

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
					agent.status = 'idle'
					this.emit({ type: 'interaction-end', agentId: agent.id, floorId: agent.floorId, itemId, interactSpotId })
				}
				continue
			}

			if (agent.status === 'waiting') {
				if (this.tickCount < (this.waitingUntil.get(agent.id) ?? 0)) continue
				this.waitingUntil.delete(agent.id)
				agent.status = 'idle'
			}
			if (agent.status === 'idle') this.chooseTarget(agent)
		}

		this.resolveWalkingAgents()
	}

	private resolveWalkingAgents(): void {
		const walkers: MutableAgent[] = []
		for (const agent of this.agents.values()) {
			if (agent.status === 'walking') walkers.push(agent)
		}
		if (walkers.length === 0) return

		const walkerIds = walkers.map(a => a.id)
		const priorityOf = (id: string): number => {
			const idx = walkerIds.indexOf(id)
			if (idx < 0) return Infinity
			return (idx + this.priorityOffset) % walkerIds.length
		}

		const proposals = new Map<string, MoveProposal>()
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

		const sortedWalkers = walkers.slice().sort((a, b) => priorityOf(a.id) - priorityOf(b.id))
		const yielded = new Set<string>()

		for (const agent of sortedWalkers) {
			const proposal = proposals.get(agent.id)
			if (!proposal) continue

			if (proposal.fromKey === proposal.toKey) {
				this.cellReservations.set(proposal.toKey, agent.id)
				continue
			}

			const existingHolder = this.cellReservations.get(proposal.toKey)
			if (existingHolder && existingHolder !== agent.id) {
				yielded.add(agent.id)
				continue
			}

			const swapConflict = this.detectSwapConflict(agent, proposal, proposals)
			if (swapConflict) {
				if (priorityOf(agent.id) < priorityOf(swapConflict)) {
					yielded.add(swapConflict)
					this.cellReservations.delete(proposal.fromKey)
				} else {
					yielded.add(agent.id)
					continue
				}
			}

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

	private detectSwapConflict(agent: MutableAgent, proposal: MoveProposal, proposals: Map<string, MoveProposal>): string | null {
		for (const [otherId, otherProposal] of proposals) {
			if (otherId === agent.id) continue
			if (otherProposal.fromKey === proposal.toKey && otherProposal.toKey === proposal.fromKey) {
				return otherId
			}
		}
		return null
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

	private collectBlockedCells(agent: MutableAgent): Set<string> {
		const blocked = new Set<string>()
		const prefix = `${agent.floorId}:`
		for (const [cellKeyVal, holderId] of this.cellReservations) {
			if (holderId === agent.id) continue
			if (!cellKeyVal.startsWith(prefix)) continue
			blocked.add(cellKeyVal.slice(prefix.length))
		}
		return blocked
	}

	private resetProgress(agent: MutableAgent): void {
		this.progressWatchdog.delete(agent.id)
		this.repathAttempts.set(agent.id, 0)
	}

	private clearCellReservation(agentId: string): void {
		for (const [key, holder] of this.cellReservations) {
			if (holder === agentId) this.cellReservations.delete(key)
		}
	}

	private queueSlotKey(queueKey: string, slotIndex: number): string {
		return `${queueKey}:${slotIndex}`
	}

	private getQueue(queueKey: string): NpcEngineQueue | undefined {
		return this.layout.queues?.find(queue => queue.key === queueKey)
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
		const point = queue.admissionPoints.slice().sort((a, b) => {
			const occupancy = (candidate: NpcEnginePoint) => Array.from(this.agents.values()).filter(other => other.id !== agent.id && other.queuePendingKey === queue.key && other.targetX === candidate.x && other.targetY === candidate.y).length
			return occupancy(a) - occupancy(b) || Math.hypot(a.x - agent.x, a.y - agent.y) - Math.hypot(b.x - agent.x, b.y - agent.y)
		})[0]
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

	private chooseTarget(agent: MutableAgent): void {

		const sameFloorTargets = this.layout.interactionTargets.filter(target =>
			target.floorId === agent.floorId && !target.transitionToFloorId,
		)
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
				agent.status = 'waiting'
				this.emit({ type: 'waiting', agentId: agent.id, floorId: agent.floorId, itemId: sameFloorTargets[0].itemId })
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
		const path = floor ? this.options.pathfinder(floor, agent, selected) : null
		if (!path || path.length === 0) {
			this.releaseReservation(agent)
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
		const target = this.layout.interactionTargets.find(item => item.itemId === agent.reservationItemId && item.interactSpotId === agent.reservationInteractSpotId && item.floorId === agent.floorId)
		if (!target) {
			this.releaseReservation(agent)
			agent.status = 'idle'
			return
		}


		if (target.transitionToFloorId && target.destinationPortalKey) {

			const destEndpoint = this.layout.interactionTargets.find(t => t.portalEndpointKey === target.destinationPortalKey)
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

			agent.crossFloorCooldownUntil = this.tickCount + CROSS_FLOOR_COOLDOWN_SECONDS * this.ticksPerSecond

			this.emit({ type: 'floor-transition', agentId: agent.id, floorId: target.transitionToFloorId, fromFloorId, toFloorId: target.transitionToFloorId })

			return
		}


		agent.x = target.x
		agent.y = target.y
		agent.status = 'interacting'
		agent.interactionRemainingTicks = this.durationTicks(target)
		this.emit({ type: 'interaction-start', agentId: agent.id, floorId: agent.floorId, itemId: target.itemId, interactSpotId: target.interactSpotId })
	}

	private targetKey(target: NpcEngineInteractionTarget): string {
		return `${target.floorId}:${target.itemId}:${target.interactSpotId}`
	}

	private setWaiting(agent: MutableAgent): void {
		if (agent.queueKey) this.leaveQueue(agent)
		agent.queuePendingKey = null
		agent.status = 'waiting'
		this.waitingUntil.set(agent.id, this.tickCount + this.ticksPerSecond)
	}

	private markBlocked(agent: MutableAgent): void {
		if (agent.reservationItemId === null || agent.reservationInteractSpotId === null) return
		const target = this.layout.interactionTargets.find(item => item.floorId === agent.floorId && item.itemId === agent.reservationItemId && item.interactSpotId === agent.reservationInteractSpotId)
		if (!target) return
		const blocked = this.blockedTargets.get(agent.id) ?? new Map<string, number>()
		blocked.set(this.targetKey(target), this.tickCount + this.ticksPerSecond * 2)
		this.blockedTargets.set(agent.id, blocked)
	}

	private isOccupied(agent: MutableAgent, point: NpcEnginePoint, floorId?: string): boolean {
		const checkFloorId = floorId ?? agent.floorId
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
		return !Array.from(this.reservations.values()).some(set => set.has(agentId))
	}

	private reserve(target: NpcEngineInteractionTarget, agentId: string): boolean {
		const key = `${target.floorId}:${target.itemId}`
		const interactSpotKey = `${key}:${target.interactSpotId}`
		const holders = this.reservations.get(key) ?? new Set<string>()
		const capacity = Math.max(1, Math.floor(target.capacity ?? 1))
		if (holders.has(agentId)) return true
		if (this.interactSpotReservations.has(interactSpotKey) || holders.size >= capacity) return false
		if (Array.from(this.reservations.values()).some(set => set.has(agentId))) return false
		holders.add(agentId)
		this.reservations.set(key, holders)
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
		return this.layout.floors.find(floor => floor.id === floorId)
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
		return this.layout.interactionTargets.find(t =>
			t.floorId === sourceFloorId &&
			t.transitionToFloorId === destFloorId &&
			this.canReserve(t, agentId),
		) ?? null
	}

	private emit(event: Omit<NpcEngineEvent, 'tick'>): void {
		this.events.push({ ...event, tick: this.tickCount })
	}
}
