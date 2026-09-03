import type { FloorData, NpcRole, NpcSimulationConfig } from '../../blueprint-editor/domain/types'
import { buildRoleWalkableMap, interactionTargetKey, tileKey, toEngineWalkablePoints, type GetAssetTags, type NpcWalkableMap } from './layoutBuild'
import { findNpcGridPath } from './pathfinding'
import { selectBestTarget } from './targetScoring'
import { getRoleFocusTags, hasMatchingTag } from './tagMatching'
import { WanderMemory } from './wanderMemory'
import type { NpcEngineAgent, NpcEngineFloor, NpcEngineInteractionTarget, NpcEngineOptions, NpcEnginePoint } from './types'



export interface NpcPolicyContext {
	getConfig: () => NpcSimulationConfig
	floors: readonly NpcEngineFloor[]
	floorMaps: ReadonlyMap<string, NpcWalkableMap>
	floorDataMap: ReadonlyMap<string, FloorData>
	ticksPerSecond: number
	getTickNumber: () => number
	listAgents: () => readonly NpcEngineAgent[]
	getAssetTags?: GetAssetTags
	getManagedTags?: () => readonly string[]
	random?: () => number
}

export type NpcEnginePolicy = Required<Pick<
	NpcEngineOptions,
	'pathfinder' | 'targetSelector' | 'queueSelector' | 'crossFloorSelector' | 'wanderSelector'
>>

interface RoleContext {
	role: NpcRole
	map: NpcWalkableMap
	floor: FloorData
	roleMap: NpcWalkableMap
}

export function createNpcEnginePolicy(context: NpcPolicyContext): NpcEnginePolicy {
	const random = context.random ?? Math.random
	const roleMapCache = new Map<string, NpcWalkableMap>()
	const roleFloorCache = new Map<string, NpcEngineFloor>()
	const baseFloorCache = new Map<string, NpcEngineFloor>()
	const roleWanderCandidateCache = new Map<string, NpcEnginePoint[]>()
	const wanderMemoryByAgent = new Map<string, WanderMemory>()
	const targetLastSelectedTick = new Map<string, number>()
	let wanderAvoidTick = -1
	const wanderAvoidByFloor = new Map<string, NpcEnginePoint[]>()

	function resolveRole(roleId: string | undefined): NpcRole | undefined {
		const config = context.getConfig()
		return config.roles.find(role => role.id === roleId)
			?? config.roles.find(role => role.id === config.defaultRoleId)
			?? config.roles[0]
	}

	function resolveRoleContext(roleId: string | undefined, floorId: string): RoleContext | null {
		const role = resolveRole(roleId)
		const map = context.floorMaps.get(floorId)
		const floor = context.floorDataMap.get(floorId)
		if (!role || !map || !floor) return null
		const cacheKey = `${role.id}:${floorId}`
		let roleMap = roleMapCache.get(cacheKey)
		if (!roleMap) {
			roleMap = buildRoleWalkableMap(map, floor, role, context.getAssetTags)
			roleMapCache.set(cacheKey, roleMap)
		}
		return { role, map, floor, roleMap }
	}

	function resolveRoleFloor(engineFloor: NpcEngineFloor, roleContext: RoleContext): NpcEngineFloor {
		if (!roleContext.role.restrictedTags.length) return engineFloor
		const cacheKey = `${roleContext.role.id}:${engineFloor.id}`
		let roleFloor = roleFloorCache.get(cacheKey)
		if (!roleFloor) {
			roleFloor = { ...engineFloor, walkable: toEngineWalkablePoints(roleContext.roleMap.tiles) }
			roleFloorCache.set(cacheKey, roleFloor)
		}
		return roleFloor
	}

	function resolveBaseFloor(floorId: string): NpcEngineFloor | undefined {
		let floor = baseFloorCache.get(floorId)
		if (!floor) {
			floor = context.floors.find(candidate => candidate.id === floorId)
			if (!floor) return undefined
			baseFloorCache.set(floorId, floor)
		}
		return floor
	}

	function resolveWanderCandidates(roleContext: RoleContext, floorId: string): NpcEnginePoint[] {
		const cacheKey = `${roleContext.role.id}:${floorId}`
		let candidates = roleWanderCandidateCache.get(cacheKey)
		if (!candidates) {
			candidates = toEngineWalkablePoints(roleContext.roleMap.tiles)
			roleWanderCandidateCache.set(cacheKey, candidates)
		}
		return candidates
	}

	function resolveWanderMemory(agentId: string): WanderMemory {
		let memory = wanderMemoryByAgent.get(agentId)
		if (!memory) {
			const cfg = context.getConfig()
			memory = new WanderMemory(
				cfg.wanderMemorySize,
				cfg.wanderSmallMapThreshold,
				random,
			)
			wanderMemoryByAgent.set(agentId, memory)
		}
		return memory
	}

	function resolveFocusTags(role: NpcRole): string[] {
		return getRoleFocusTags(context.getConfig(), role, context.getManagedTags?.())
	}

	function isReachableByRole(target: NpcEngineInteractionTarget, roleContext: RoleContext): boolean {
		return roleContext.roleMap.tiles.has(tileKey(target.x, target.y))
	}

	function selectScoredTarget(
		agent: NpcEngineAgent,
		targets: readonly NpcEngineInteractionTarget[],
	): NpcEngineInteractionTarget | null {
		const selected = selectBestTarget({
			agent,
			targets,
			currentTick: context.getTickNumber(),
			targetLastSelectedTick,
			random,
		})
		if (selected) targetLastSelectedTick.set(interactionTargetKey(selected), context.getTickNumber())
		return selected
	}

	function resolveTriggeredTags(tags: readonly string[]): string[] {
		const triggerRates = context.getConfig().tagTriggerRates ?? {}
		const ticksPerPeriod = context.ticksPerSecond * context.getConfig().triggerRatePeriodSeconds
		const triggered: string[] = []
		for (const tag of tags) {
			const ratePerPeriod = triggerRates[tag] ?? 0
			if (ratePerPeriod <= 0) continue
			if (random() < ratePerPeriod / ticksPerPeriod) triggered.push(tag)
		}
		return triggered
	}

	function hasTriggerRates(): boolean {
		return Object.keys(context.getConfig().tagTriggerRates ?? {}).length > 0
	}

	function pickNearestFloorTarget(
		targets: readonly NpcEngineInteractionTarget[],
		currentFloorId: string,
		floors: readonly NpcEngineFloor[],
	): NpcEngineInteractionTarget | null {
		if (!targets.length) return null
		const floorIds = floors.map(floor => floor.id)
		const currentIndex = floorIds.indexOf(currentFloorId)
		return targets.reduce((best, target) =>
			Math.abs(floorIds.indexOf(target.floorId) - currentIndex) < Math.abs(floorIds.indexOf(best.floorId) - currentIndex)
				? target
				: best,
		)
	}

	const pathfinder: NpcEnginePolicy['pathfinder'] = (engineFloor, agent, to, blockedCells) => {
		const roleContext = resolveRoleContext(agent.roleId, engineFloor.id)
		if (!roleContext) return findNpcGridPath(engineFloor, agent, to, blockedCells)
		return findNpcGridPath(resolveRoleFloor(engineFloor, roleContext), agent, to, blockedCells)
	}

	const targetSelector: NpcEnginePolicy['targetSelector'] = (agent, targets) => {
		const roleContext = resolveRoleContext(agent.roleId, agent.floorId)
		if (!roleContext) return null
		const tags = resolveFocusTags(roleContext.role)
		if (!tags.length) {
			const reachable = targets.filter(target => isReachableByRole(target, roleContext))
			return reachable.length ? selectScoredTarget(agent, reachable) : null
		}

		if (!hasTriggerRates()) {
			if (roleContext.role.focusChance <= 0 || random() * 100 >= roleContext.role.focusChance) return null
			const matching = targets.filter(target => hasMatchingTag(target.tags, tags) && isReachableByRole(target, roleContext))
			return matching.length ? selectScoredTarget(agent, matching) : null
		}

		const triggered = resolveTriggeredTags(tags)
		if (!triggered.length) return null
		const matching = targets.filter(target => hasMatchingTag(target.tags, triggered) && isReachableByRole(target, roleContext))
		return matching.length ? selectScoredTarget(agent, matching) : null
	}

	const queueSelector: NpcEnginePolicy['queueSelector'] = (agent, targets, availableTargets, queues) => {
		const roleContext = resolveRoleContext(agent.roleId, agent.floorId)
		if (!roleContext) return null
		const tags = resolveFocusTags(roleContext.role)
		const availableKeys = new Set(availableTargets.map(interactionTargetKey))

		const matchingTargets = tags.length
			? targets.filter(target =>
				!availableKeys.has(interactionTargetKey(target))
				&& hasMatchingTag(target.tags, tags)
				&& isReachableByRole(target, roleContext),
			)
			: targets.filter(target =>
				!availableKeys.has(interactionTargetKey(target))
				&& isReachableByRole(target, roleContext),
			)
		if (!matchingTargets.length) return null

		const baseFloor = resolveBaseFloor(agent.floorId)
		if (!baseFloor) return null
		const matchingKeys = new Set(matchingTargets.map(interactionTargetKey))
		const candidates = queues.filter(queue => queue.targetKeys.some(key => matchingKeys.has(key)))
		if (!candidates.length) return null

		const distanceByQueue = new Map<string, number>()
		for (const queue of candidates) {
			let shortest = Number.POSITIVE_INFINITY
			for (const target of matchingTargets) {
				if (!queue.targetKeys.includes(interactionTargetKey(target))) continue
				const dist = Math.abs(target.x - agent.x) + Math.abs(target.y - agent.y)
				if (dist < shortest) shortest = dist
			}
			const slot = queue.slots[0]
			if (slot) {
				const slotDist = Math.abs(slot.x - agent.x) + Math.abs(slot.y - agent.y)
				if (slotDist < shortest) shortest = slotDist
			}
			distanceByQueue.set(queue.key, shortest)
		}

		return candidates
			.slice()
			.sort((a, b) => (distanceByQueue.get(a.key) ?? Number.POSITIVE_INFINITY) - (distanceByQueue.get(b.key) ?? Number.POSITIVE_INFINITY))[0]
			?? null
	}

	const crossFloorSelector: NpcEnginePolicy['crossFloorSelector'] = (agent, candidates, floors) => {
		const role = resolveRole(agent.roleId)
		if (!role) return null
		const tags = resolveFocusTags(role)
		if (!tags.length) return null
		const matching = candidates.filter(target => hasMatchingTag(target.tags, tags))
		if (!matching.length) return null
		return pickNearestFloorTarget(matching, agent.floorId, floors)
	}

	const wanderSelector: NpcEnginePolicy['wanderSelector'] = agent => {
		const roleContext = resolveRoleContext(agent.roleId, agent.floorId)
		if (!roleContext) return null
		const candidates = resolveWanderCandidates(roleContext, agent.floorId)
		if (!candidates.length) return null
		const tick = context.getTickNumber()
		if (tick !== wanderAvoidTick) {
			wanderAvoidTick = tick
			wanderAvoidByFloor.clear()
			for (const other of context.listAgents()) {
				if (other.status !== 'walking' && other.status !== 'queued') continue
				const list = wanderAvoidByFloor.get(other.floorId) ?? []
				list.push({ x: other.targetX, y: other.targetY })
				wanderAvoidByFloor.set(other.floorId, list)
			}
		}
		const memory = resolveWanderMemory(agent.id)
		const selected = memory.selectWanderTile(candidates, agent, wanderAvoidByFloor.get(agent.floorId) ?? [])
		if (selected) memory.recordVisit(selected, context.getTickNumber())
		return selected
	}

	return { pathfinder, targetSelector, queueSelector, crossFloorSelector, wanderSelector }
}
