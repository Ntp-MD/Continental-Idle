import type { FloorData, NpcRole, NpcSimulationConfig } from '../../blueprint-editor/domain/types'
import { buildRoleWalkableMap, toEngineWalkablePoints, type GetAssetTags } from './layoutBuild'
import { interactionTargetKey, roleFloorCacheKey, tileKey } from './keys'
import { queueLineCapacity } from './queueBuild'
import { findNpcGridPath } from './pathfinding'
import { selectBestTarget } from './targetScoring'
import { getRoleFocusTags, hasMatchingTag, hasPostTag } from './tagMatching'
import { WanderMemory } from './wanderMemory'
import type { NpcEngineAgent, NpcEngineFloor, NpcEngineInteractionTarget, NpcEngineOptions, NpcEnginePoint, NpcWalkableMap } from './types'

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
	interactionTargets?: readonly NpcEngineInteractionTarget[]
}

export type NpcEnginePolicy = Required<Pick<
	NpcEngineOptions,
	'pathfinder' | 'targetSelector' | 'queueSelector' | 'crossFloorSelector' | 'wanderSelector' | 'socialSelector'
>>

// A queue's target keys never change for the life of the layout, so membership tests run
// against a cached set instead of an `includes` scan per candidate target per queue.
const targetKeysByQueue = new WeakMap<object, Set<string>>()

function targetKeySetOf(queue: { targetKeys: readonly string[] }): Set<string> {
	let set = targetKeysByQueue.get(queue)
	if (set === undefined) {
		set = new Set(queue.targetKeys)
		targetKeysByQueue.set(queue, set)
	}
	return set
}

interface RoleContext {
	role: NpcRole
	map: NpcWalkableMap
	floor: FloorData
	roleMap: NpcWalkableMap
}

interface PolicyState {
	roleMapCache: Map<string, NpcWalkableMap>
	roleFloorCache: Map<string, NpcEngineFloor>
	baseFloorCache: Map<string, NpcEngineFloor>
	roleWanderCandidateCache: Map<string, NpcEnginePoint[]>
	wanderMemoryByAgent: Map<string, WanderMemory>
	targetLastSelectedTick: Map<string, number>
	furnishedTileCache: Map<string, Set<string>>
	wanderPoolCache: Map<string, NpcEnginePoint[]>
	wanderAvoidByFloor: Map<string, NpcEnginePoint[]>
	wanderAvoidTick: number
	wanderMemoryCalls: number
}

function resolveRole(config: NpcSimulationConfig, roleId: string | undefined): NpcRole | undefined {
	return config.roles.find(role => role.id === roleId)
		?? config.roles.find(role => role.id === config.defaultRoleId)
		?? config.roles[0]
}

function resolveRoleContext(
	context: NpcPolicyContext,
	state: PolicyState,
	roleId: string | undefined,
	floorId: string,
): RoleContext | null {
	const role = resolveRole(context.getConfig(), roleId)
	const map = context.floorMaps.get(floorId)
	const floor = context.floorDataMap.get(floorId)
	if (!role || !map || !floor) return null
	const cacheKey = roleFloorCacheKey(role, floorId)
	let roleMap = state.roleMapCache.get(cacheKey)
	if (!roleMap) {
		roleMap = buildRoleWalkableMap(map, floor, role, context.getAssetTags)
		state.roleMapCache.set(cacheKey, roleMap)
	}
	return { role, map, floor, roleMap }
}

function resolveRoleFloor(state: PolicyState, engineFloor: NpcEngineFloor, roleContext: RoleContext): NpcEngineFloor {
	if (!roleContext.role.restrictedTags.length) return engineFloor
	const cacheKey = roleFloorCacheKey(roleContext.role, engineFloor.id)
	let roleFloor = state.roleFloorCache.get(cacheKey)
	if (!roleFloor) {
		roleFloor = { ...engineFloor, walkable: toEngineWalkablePoints(roleContext.roleMap.tiles) }
		state.roleFloorCache.set(cacheKey, roleFloor)
	}
	return roleFloor
}

function resolveBaseFloor(context: NpcPolicyContext, state: PolicyState, floorId: string): NpcEngineFloor | undefined {
	let floor = state.baseFloorCache.get(floorId)
	if (!floor) {
		floor = context.floors.find(candidate => candidate.id === floorId)
		if (!floor) return undefined
		state.baseFloorCache.set(floorId, floor)
	}
	return floor
}

function resolveWanderCandidates(state: PolicyState, roleContext: RoleContext, floorId: string): NpcEnginePoint[] {
	const cacheKey = roleFloorCacheKey(roleContext.role, floorId)
	let candidates = state.roleWanderCandidateCache.get(cacheKey)
	if (!candidates) {
		candidates = toEngineWalkablePoints(roleContext.roleMap.tiles)
		state.roleWanderCandidateCache.set(cacheKey, candidates)
	}
	return candidates
}

function resolveWanderMemory(
	context: NpcPolicyContext,
	state: PolicyState,
	random: () => number,
	agentId: string,
): WanderMemory {
	let memory = state.wanderMemoryByAgent.get(agentId)
	if (!memory) {
		const cfg = context.getConfig()
		memory = new WanderMemory(cfg.wanderMemorySize, cfg.wanderSmallMapThreshold, random)
		state.wanderMemoryByAgent.set(agentId, memory)
	}
	return memory
}

function resolveFocusTags(context: NpcPolicyContext, role: NpcRole): string[] {
	return getRoleFocusTags(context.getConfig(), role, context.getManagedTags?.())
}

function isReachableByRole(target: NpcEngineInteractionTarget, roleContext: RoleContext): boolean {
	return roleContext.roleMap.tiles.has(tileKey(target.x, target.y))
}

function selectPostTarget(
	context: NpcPolicyContext,
	roleContext: RoleContext,
	agent: NpcEngineAgent,
	targets: readonly NpcEngineInteractionTarget[],
): NpcEngineInteractionTarget | null {
	const config = context.getConfig()
	const claims: { assetId: string; post?: string }[] = []
	for (const taskId of roleContext.role.taskIds) {
		const post = config.tasks.find(task => task.id === taskId)?.post
		if (post) claims.push(post)
	}
	if (!claims.length) return null
	const floorData = context.floorDataMap.get(agent.floorId)
	const heldByOthers = new Set<string>()
	for (const other of context.listAgents()) {
		if (other.id === agent.id || other.floorId !== agent.floorId) continue
		if (other.reservationItemId !== null && other.reservationInteractSpotId !== null) {
			heldByOthers.add(`${other.floorId}:${other.reservationItemId}:${other.reservationInteractSpotId}`)
		}
	}
	let best: NpcEngineInteractionTarget | null = null
	let bestDistance = Number.POSITIVE_INFINITY
	let bestKey = ''
	for (const target of targets) {
		if (target.floorId !== agent.floorId || target.transitionToFloorId) continue
		const key = interactionTargetKey(target)
		if (heldByOthers.has(key)) continue
		const objectType = floorData?.objects.find(object => `object:${object.id}` === target.itemId)?.type
		if (!objectType) continue
		const claimed = claims.some(claim => claim.assetId === objectType && (!claim.post || target.tags.includes(`post:${claim.post}`)))
		if (!claimed) continue
		if (!isReachableByRole(target, roleContext)) continue
		const distance = Math.abs(target.x - agent.x) + Math.abs(target.y - agent.y)
		if (distance < bestDistance || (distance === bestDistance && (bestKey === '' || key < bestKey))) {
			best = target
			bestDistance = distance
			bestKey = key
		}
	}
	return best
}

function selectScoredTarget(
	context: NpcPolicyContext,
	state: PolicyState,
	agent: NpcEngineAgent,
	targets: readonly NpcEngineInteractionTarget[],
	random: () => number,
): NpcEngineInteractionTarget | null {
	const selected = selectBestTarget({
		agent,
		targets,
		currentTick: context.getTickNumber(),
		targetLastSelectedTick: state.targetLastSelectedTick,
		random,
	})
	if (selected) state.targetLastSelectedTick.set(interactionTargetKey(selected), context.getTickNumber())
	return selected
}

function resolveTriggeredTags(
	config: NpcSimulationConfig,
	ticksPerSecond: number,
	random: () => number,
	tags: readonly string[],
): string[] {
	const triggerRates = config.tagTriggerRates ?? {}
	const ticksPerPeriod = ticksPerSecond * config.triggerRatePeriodSeconds
	const triggered: string[] = []
	for (const tag of tags) {
		const ratePerPeriod = triggerRates[tag] ?? 0
		if (ratePerPeriod <= 0) continue
		if (random() < ratePerPeriod / ticksPerPeriod) triggered.push(tag)
	}
	return triggered
}

function hasTriggerRates(config: NpcSimulationConfig): boolean {
	return Object.keys(config.tagTriggerRates ?? {}).length > 0
}

// A guest leaving floor 13 wants the floor that actually has the thing it is after (the pool,
// the dining room), not the neighbouring bedroom floor. Density wins, distance only breaks ties.
function pickNearestFloorTarget(
	targets: readonly NpcEngineInteractionTarget[],
	currentFloorId: string,
	floors: readonly NpcEngineFloor[],
): NpcEngineInteractionTarget | null {
	if (!targets.length) return null
	const floorIndex = new Map<string, number>()
	floors.forEach((floor, i) => { if (!floorIndex.has(floor.id)) floorIndex.set(floor.id, i) })
	const currentIndex = Math.max(0, floorIndex.get(currentFloorId) ?? 0)
	const countByFloor = new Map<string, number>()
	for (const target of targets) {
		if (target.floorId === currentFloorId) continue
		countByFloor.set(target.floorId, (countByFloor.get(target.floorId) ?? 0) + 1)
	}
	let best: NpcEngineInteractionTarget | null = null
	let bestScore = Number.NEGATIVE_INFINITY
	for (const target of targets) {
		if (target.floorId === currentFloorId) continue
		const score = (countByFloor.get(target.floorId) ?? 0) * 100 - Math.abs((floorIndex.get(target.floorId) ?? 0) - currentIndex)
		if (score > bestScore) { bestScore = score; best = target }
	}
	return best
}

function resolveFurnishedTiles(context: NpcPolicyContext, state: PolicyState, floorId: string): Set<string> | null {
	const targets = context.interactionTargets
	if (!targets?.length) return null
	let furnished = state.furnishedTileCache.get(floorId)
	if (furnished) return furnished
	furnished = new Set<string>()
	const cellSize = context.floorMaps.get(floorId)?.cellSize
	const floor = context.floorDataMap.get(floorId)
	if (cellSize && floor) {
		for (const target of targets) {
			if (target.floorId !== floorId || !target.itemId.startsWith('object:')) continue
			const object = floor.objects.find(candidate => `object:${candidate.id}` === target.itemId)
			if (!object || !(object.w > 0) || !(object.h > 0)) continue
			for (let y = Math.floor(object.y / cellSize); y < Math.ceil((object.y + object.h) / cellSize); y++) {
				for (let x = Math.floor(object.x / cellSize); x < Math.ceil((object.x + object.w) / cellSize); x++) {
					furnished.add(tileKey(x, y))
				}
			}
		}
	}
	state.furnishedTileCache.set(floorId, furnished)
	return furnished
}

// Candidates and furnished tiles are both per-(role, floor) caches, so the exclusion is
// filtered once here instead of copying several thousand points on every wander pick.
function resolveWanderPool(
	context: NpcPolicyContext,
	state: PolicyState,
	roleContext: RoleContext,
	floorId: string,
): NpcEnginePoint[] {
	const cacheKey = roleFloorCacheKey(roleContext.role, floorId)
	const cached = state.wanderPoolCache.get(cacheKey)
	if (cached) return cached
	const candidates = resolveWanderCandidates(state, roleContext, floorId)
	const furnished = resolveFurnishedTiles(context, state, floorId)
	const pool = furnished ? candidates.filter(point => !furnished.has(tileKey(point.x, point.y))) : candidates
	state.wanderPoolCache.set(cacheKey, pool)
	return pool
}

function makePathfinder(context: NpcPolicyContext, state: PolicyState): NpcEnginePolicy['pathfinder'] {
	return (engineFloor, agent, to, blockedCells) => {
		const roleContext = resolveRoleContext(context, state, agent.roleId, engineFloor.id)
		if (!roleContext) return findNpcGridPath(engineFloor, agent, to, blockedCells)
		return findNpcGridPath(resolveRoleFloor(state, engineFloor, roleContext), agent, to, blockedCells)
	}
}

function makeTargetSelector(
	context: NpcPolicyContext,
	state: PolicyState,
	random: () => number,
): NpcEnginePolicy['targetSelector'] {
	return (agent, targets) => {
		const roleContext = resolveRoleContext(context, state, agent.roleId, agent.floorId)
		if (!roleContext) return null
		const posted = selectPostTarget(context, roleContext, agent, targets)
		if (posted) return posted
		// A role with cross-floor business deliberately passes on the local floor sometimes,
		// which is what puts guests and staff through the lift lobby instead of the sofa.
		const crossFloorChance = roleContext.role.crossFloorChance ?? 0
		if (crossFloorChance > 0 && random() * 100 < crossFloorChance) return null
		const openTargets = targets.filter(target => !hasPostTag(target.tags))
		const tags = resolveFocusTags(context, roleContext.role)
		if (!tags.length) {
			const reachable = openTargets.filter(target => isReachableByRole(target, roleContext))
			return reachable.length ? selectScoredTarget(context, state, agent, reachable, random) : null
		}

		const config = context.getConfig()
		if (!hasTriggerRates(config)) {
			if (roleContext.role.focusChance <= 0 || random() * 100 >= roleContext.role.focusChance) return null
			const matching = openTargets.filter(target => hasMatchingTag(target.tags, tags) && isReachableByRole(target, roleContext))
			return matching.length ? selectScoredTarget(context, state, agent, matching, random) : null
		}

		const triggered = resolveTriggeredTags(config, context.ticksPerSecond, random, tags)
		if (!triggered.length) return null
		const matching = openTargets.filter(target => hasMatchingTag(target.tags, triggered) && isReachableByRole(target, roleContext))
		return matching.length ? selectScoredTarget(context, state, agent, matching, random) : null
	}
}

function makeQueueSelector(context: NpcPolicyContext, state: PolicyState): NpcEnginePolicy['queueSelector'] {
	return (agent, targets, availableTargets, queues) => {
		const roleContext = resolveRoleContext(context, state, agent.roleId, agent.floorId)
		if (!roleContext) return null
		const tags = resolveFocusTags(context, roleContext.role)
		const availableKeys = new Set(availableTargets.map(interactionTargetKey))
		const openTargets = targets.filter(target => !hasPostTag(target.tags))

		const matchingTargets = tags.length
			? openTargets.filter(target =>
				!availableKeys.has(interactionTargetKey(target))
				&& hasMatchingTag(target.tags, tags)
				&& isReachableByRole(target, roleContext),
			)
			: openTargets.filter(target =>
				!availableKeys.has(interactionTargetKey(target))
				&& isReachableByRole(target, roleContext),
			)
		if (!matchingTargets.length) return null

		const baseFloor = resolveBaseFloor(context, state, agent.floorId)
		if (!baseFloor) return null
		const matchingKeys = new Set(matchingTargets.map(interactionTargetKey))
		const candidates = queues.filter(queue => queue.targetKeys.some(key => matchingKeys.has(key)))
		if (!candidates.length) return null
		const occupantsByQueue = new Map<string, number>()
		for (const other of context.listAgents()) {
			if (other.floorId !== agent.floorId) continue
			if (other.queueKey) occupantsByQueue.set(other.queueKey, (occupantsByQueue.get(other.queueKey) ?? 0) + 1)
			if (other.queuePendingKey) occupantsByQueue.set(other.queuePendingKey, (occupantsByQueue.get(other.queuePendingKey) ?? 0) + 1)
		}
		const withSpace = candidates.filter(queue => (occupantsByQueue.get(queue.key) ?? 0) < queueLineCapacity(queue))
		if (!withSpace.length) return null

		let best: typeof withSpace[number] | null = null
		let bestDistance = Number.POSITIVE_INFINITY
		for (const queue of withSpace) {
			const queueKeys = targetKeySetOf(queue)
			let shortest = Number.POSITIVE_INFINITY
			for (const target of matchingTargets) {
				if (!queueKeys.has(interactionTargetKey(target))) continue
				const dist = Math.abs(target.x - agent.x) + Math.abs(target.y - agent.y)
				if (dist < shortest) shortest = dist
			}
			const slot = queue.slots[0]
			if (slot) {
				const slotDist = Math.abs(slot.x - agent.x) + Math.abs(slot.y - agent.y)
				if (slotDist < shortest) shortest = slotDist
			}
			// stable-sort equivalent: a strict `<` keeps the first minimum, exactly as the
			// previous slice().sort() did, without copying and ordering the whole list
			if (shortest < bestDistance) { bestDistance = shortest; best = queue }
		}
		return best
	}
}

function makeSocialSelector(
	context: NpcPolicyContext,
	random: () => number,
): NpcEnginePolicy['socialSelector'] {
	return (agent, candidates) => {
		const role = resolveRole(context.getConfig(), agent.roleId)
		const tags = role ? resolveFocusTags(context, role) : []
		if (hasMatchingTag(tags, ['soc-loner'])) return null
		const open = candidates.filter(candidate => {
			const partnerRole = resolveRole(context.getConfig(), candidate.roleId)
			const partnerTags = partnerRole ? resolveFocusTags(context, partnerRole) : []
			return !hasMatchingTag(partnerTags, ['soc-loner'])
		})
		if (!open.length) return null
		let best = open[0]
		let bestDist = Infinity
		for (const candidate of open) {
			const dist = Math.abs(candidate.x - agent.x) + Math.abs(candidate.y - agent.y)
			if (dist < bestDist) { bestDist = dist; best = candidate }
		}
		if (!hasMatchingTag(tags, ['soc-chatty']) && random() >= 0.4) return null
		return best
	}
}

function makeCrossFloorSelector(context: NpcPolicyContext): NpcEnginePolicy['crossFloorSelector'] {
	return (agent, candidates, floors) => {
		const role = resolveRole(context.getConfig(), agent.roleId)
		if (!role) return null
		const tags = resolveFocusTags(context, role)
		if (!tags.length) return null
		const matching = candidates.filter(target => !hasPostTag(target.tags) && hasMatchingTag(target.tags, tags))
		if (!matching.length) return null
		return pickNearestFloorTarget(matching, agent.floorId, floors)
	}
}

function makeWanderSelector(
	context: NpcPolicyContext,
	state: PolicyState,
	random: () => number,
): NpcEnginePolicy['wanderSelector'] {
	return agent => {
		if (++state.wanderMemoryCalls % 1024 === 0 && state.wanderMemoryByAgent.size > 0) {
			const live = new Set<string>()
			for (const other of context.listAgents()) live.add(other.id)
			for (const id of state.wanderMemoryByAgent.keys()) if (!live.has(id)) state.wanderMemoryByAgent.delete(id)
		}
		const roleContext = resolveRoleContext(context, state, agent.roleId, agent.floorId)
		if (!roleContext) return null
		const candidates = resolveWanderCandidates(state, roleContext, agent.floorId)
		if (!candidates.length) return null
		const tick = context.getTickNumber()
		if (tick !== state.wanderAvoidTick) {
			state.wanderAvoidTick = tick
			state.wanderAvoidByFloor.clear()
			for (const other of context.listAgents()) {
				if (other.status !== 'walking' && other.status !== 'queued') continue
				const list = state.wanderAvoidByFloor.get(other.floorId) ?? []
				list.push({ x: other.targetX, y: other.targetY })
				state.wanderAvoidByFloor.set(other.floorId, list)
			}
		}
		const memory = resolveWanderMemory(context, state, random, agent.id)
		const pool = resolveWanderPool(context, state, roleContext, agent.floorId)
		const selected = memory.selectWanderTile(pool.length ? pool : candidates, agent, state.wanderAvoidByFloor.get(agent.floorId) ?? [])
		if (selected) memory.recordVisit(selected, context.getTickNumber())
		return selected
	}
}

export function createNpcEnginePolicy(context: NpcPolicyContext): NpcEnginePolicy {
	const random = context.random ?? Math.random
	const state: PolicyState = {
		roleMapCache: new Map(),
		roleFloorCache: new Map(),
		baseFloorCache: new Map(),
		roleWanderCandidateCache: new Map(),
		wanderMemoryByAgent: new Map(),
		targetLastSelectedTick: new Map(),
		furnishedTileCache: new Map(),
		wanderPoolCache: new Map(),
		wanderAvoidByFloor: new Map(),
		wanderAvoidTick: -1,
		wanderMemoryCalls: 0,
	}
	return {
		pathfinder: makePathfinder(context, state),
		targetSelector: makeTargetSelector(context, state, random),
		queueSelector: makeQueueSelector(context, state),
		crossFloorSelector: makeCrossFloorSelector(context),
		wanderSelector: makeWanderSelector(context, state, random),
		socialSelector: makeSocialSelector(context, random),
	}
}