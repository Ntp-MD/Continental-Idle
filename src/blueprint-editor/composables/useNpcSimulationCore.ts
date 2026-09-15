import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
	NPC_ENGINE_DEFAULT_OPTIONS,
	NPC_ENGINE_TICKS_PER_SECOND,
	buildNpcEngineLayout,
	buildRoleWalkableMap,
	cellToPixel,
	filterNpcSpawnTiles,
	createNpcEnginePolicy,
	floorMatchesTargetTags,
	type NpcCanvasBounds,
	type NpcWalkableMap,
	type NpcEngineEvent,
} from '@/engine/npc'
import type { AssetDef, FloorData, NpcRole, NpcSimDot, NpcSimulationConfig } from '@/blueprint-editor/domain/types'
import {
	isNpcConfig,
	clampInt,
	NPC_DEFAULT_SPEED,
	NPC_OPTION_DEFAULTS,
	NPC_FRAME_DEFAULTS,
} from '@/blueprint-editor/domain/types'
import { mergeNpcConfig, editorLog, cloneDeepRaw } from '@/blueprint-editor/blueprintStore'

const MAX_ROLE_SPAWN_COUNT = 100
const SYNC_INTERVAL_MS = 250

export interface NpcSimulationCoreHost {
	getConfig(): NpcSimulationConfig | undefined
	getFloors(): readonly FloorData[]
	getCanvas(): NpcCanvasBounds
	getViewFloorId(): string | null
	idPrefix: string
	random?: () => number
	getAssetDef?(type: string): AssetDef | undefined
	getAssetTags?(type: string): string[] | undefined
	getManagedTags?(): readonly string[]
}

function resolveRole(config: NpcSimulationConfig, roleId: string): NpcRole | undefined {
	return config.roles.find(role => role.id === roleId)
		?? config.roles.find(role => role.id === config.defaultRoleId)
		?? config.roles[0]
}

export function latchArrivalEvent(
	arrived: Set<string>,
	marks: Map<string, number>,
	event: NpcEngineEvent,
	idPrefix: string,
): void {
	if (event.type !== 'interaction-start') return
	if (arrived.has(event.agentId)) return
	if (!event.agentId.startsWith(idPrefix)) return
	arrived.add(event.agentId)
	marks.set(event.agentId, event.tick)
}

export const ARRIVAL_MARK_MAX_AGE_TICKS = 5 * NPC_ENGINE_TICKS_PER_SECOND
export const ARRIVAL_MARK_LIVE_CAP = 50

export function pruneArrivalMarks(marks: Map<string, number>, currentTick: number): void {
	for (const [agentId, tick] of marks) {
		if (currentTick - tick > ARRIVAL_MARK_MAX_AGE_TICKS) marks.delete(agentId)
	}
	if (marks.size <= ARRIVAL_MARK_LIVE_CAP) return
	const byAge = [...marks.entries()].sort((a, b) => a[1] - b[1])
	for (const [agentId] of byAge.slice(0, byAge.length - ARRIVAL_MARK_LIVE_CAP)) marks.delete(agentId)
}

interface NpcSimCoreState {
	npcs: ShallowRef<NpcSimDot[]>
	socialEvents: ShallowRef<NpcEngineEvent[]>
	isPaused: Ref<boolean>
	simSpeed: Ref<number>
	config: Ref<NpcSimulationConfig>
	animationId: number | null
	engine: NpcEngine | null
	deploymentActive: boolean
	nextId: number
	spawnFloorOverride: string | null
	tickCostEma: number
	floorMaps: Map<string, NpcWalkableMap>
	floorDataMap: Map<string, FloorData>
	currentCanvas: NpcCanvasBounds | null
	viewFloorId: string | null
	lastSyncAt: number
	frameDots: Map<string, NpcSimDot>
	waitReasons: Map<string, string>
	arrived: Set<string>
	arrivalMarks: Map<string, number>
	seenAgentIds: Set<string>
	dotRoleColors: Map<string, string>
}

function getAssetTagsSafe(host: NpcSimulationCoreHost): ((type: string) => string[] | undefined) | undefined {
	return host.getAssetTags ? (type: string) => host.getAssetTags!(type) : undefined
}

function getAssetDefSafe(host: NpcSimulationCoreHost): ((type: string) => AssetDef | undefined) | undefined {
	return host.getAssetDef ? (type: string) => host.getAssetDef!(type) : undefined
}

function isRoleAllowedOnFloor(state: NpcSimCoreState, roleId: string, floorId: string): boolean {
	const floor = state.floorDataMap.get(floorId)
	if (!floor?.allowedRoleIds?.length) return true
	return floor.allowedRoleIds.includes(roleId)
}

function dotColorFor(state: NpcSimCoreState, requestedRoleId: string): string {
	let color = state.dotRoleColors.get(requestedRoleId)
	if (color === undefined) {
		color = resolveRole(state.config.value, requestedRoleId)?.color ?? '#8ecae6'
		state.dotRoleColors.set(requestedRoleId, color)
	}
	return color
}

function syncAgents(state: NpcSimCoreState): void {
	const currentEngine = state.engine
	if (!currentEngine) return
	const agents = currentEngine.listAgents()
	state.seenAgentIds.clear()
	for (const agent of agents) {
		const map = state.floorMaps.get(agent.floorId)
		if (!map) continue
		const cs = map.cellSize
		state.seenAgentIds.add(agent.id)
		const existing = state.frameDots.get(agent.id)
		const dot: NpcSimDot = existing ?? {
			id: agent.id,
			floorId: agent.floorId,
			type: agent.roleId ?? '',
			x: 0,
			y: 0,
			targetX: 0,
			targetY: 0,
			speed: 0,
			color: '#8ecae6',
			status: 'idle',
			pauseTimer: 0,
			pathIdx: 0,
			path: [],
			interactTargetKey: null,
			interactSpotKey: null,
			interactDurationMin: 0,
			interactDurationMax: 0,
		}
		state.frameDots.set(agent.id, dot)
		dot.floorId = agent.floorId
		dot.type = agent.roleId ?? ''
		dot.x = cellToPixel(agent.x, cs)
		dot.y = cellToPixel(agent.y, cs)
		dot.targetX = cellToPixel(agent.targetX, cs)
		dot.targetY = cellToPixel(agent.targetY, cs)
		dot.status = agent.status
		if (agent.reservationItemId !== null && agent.reservationInteractSpotId !== null) {
			dot.interactTargetKey = `${agent.floorId}:${agent.reservationItemId}`
			dot.interactSpotKey = `${agent.floorId}:${agent.reservationItemId}:${agent.reservationInteractSpotId}`
		} else {
			dot.interactTargetKey = null
			dot.interactSpotKey = null
		}
		if (dot.path.length !== agent.path.length || agent.pathIndex < dot.pathIdx) {
			dot.path = agent.path.map(point => [cellToPixel(point.x, cs), cellToPixel(point.y, cs)] as [number, number])
		}
		dot.pathIdx = agent.pathIndex
		dot.color = dotColorFor(state, agent.roleId ?? '')
	}
	if (state.frameDots.size > state.seenAgentIds.size) {
		for (const id of state.frameDots.keys()) {
			if (!state.seenAgentIds.has(id)) state.frameDots.delete(id)
		}
	}
	for (const id of state.waitReasons.keys()) {
		const dot = state.frameDots.get(id)
		if (!dot || (dot.status !== 'waiting' && dot.status !== 'queued')) state.waitReasons.delete(id)
	}
	const now = performance.now()
	if (now - state.lastSyncAt >= SYNC_INTERVAL_MS && !state.isPaused.value) {
		state.lastSyncAt = now
		state.npcs.value = [...state.frameDots.values()].filter(dot => dot.floorId === state.viewFloorId)
	}
}

function spawnAgents(state: NpcSimCoreState, host: NpcSimulationCoreHost, floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
	if (!state.engine) return
	const rand = host.random ?? Math.random
	state.npcs.value = []
	const occupiedSpawnKeys = new Set<string>()
	let spawnCursor = 0
	const skipped = new Map<string, number>()
	const skip = (reason: string, count: number) => { skipped.set(reason, (skipped.get(reason) ?? 0) + count) }
	let spawned = 0

	for (const entry of state.config.value.pool) {
		const count = clampInt(entry.count || 0, 0, MAX_ROLE_SPAWN_COUNT)
		const role = resolveRole(state.config.value, entry.roleId)
		if (!role) { skip('unknown-role', count * floors.length); continue }
		for (const floor of floors) {
			if (state.spawnFloorOverride && floor.id !== state.spawnFloorOverride) { skip('floor-override', count); continue }
			const allowedFloorIds = entry.floorIds ?? []
			if (allowedFloorIds.length > 0 && !allowedFloorIds.includes(floor.id)) { skip('floor-id-filter', count); continue }
			if (!isRoleAllowedOnFloor(state, role.id, floor.id)) { skip('role-floor-restriction', count); continue }
			if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTagsSafe(host))) { skip('target-tags', count); continue }
			const map = state.floorMaps.get(floor.id)
			if (!map) { skip('no-floor-map', count); continue }
			const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTagsSafe(host))
			const keys = [...filterNpcSpawnTiles(roleMap, floor, role.id)]
			if (!keys.length) { skip('no-spawn-cells', count); continue }
			const centerX = canvas.w / 2 / map.cellSize
			const centerY = canvas.h / 2 / map.cellSize
			const keyPts = keys.map(k => {
				const sep = k.indexOf(',')
				const x = Number(k.slice(0, sep))
				const y = Number(k.slice(sep + 1))
				return { k, d: Math.hypot(x - centerX, y - centerY) }
			})
			keyPts.sort((a, b) => a.d - b.d)
			for (let i = 0; i < keys.length; i++) keys[i] = keyPts[i].k
			const spawnOffset = Math.floor(rand() * Math.max(1, keys.length))
			for (let i = 0; i < count; i++) {
				let spawnIndex = (spawnCursor + spawnOffset + i) % keys.length
				let attempts = 0
				while (attempts < keys.length && occupiedSpawnKeys.has(`${floor.id}:${keys[spawnIndex]}`)) {
					spawnIndex = (spawnIndex + 1) % keys.length
					attempts++
				}
				if (attempts >= keys.length) { skip('occupied-cells', count - i); break }
				const spawnKey = keys[spawnIndex]
				occupiedSpawnKeys.add(`${floor.id}:${spawnKey}`)
				const [x, y] = spawnKey.split(',').map(Number)
				const id = `${host.idPrefix}${state.nextId++}`
				const speed = Math.max(0.01, state.config.value.speed || 1 / 30) + (rand() - 0.5) * 0.02
				state.engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: speed * NPC_ENGINE_TICKS_PER_SECOND / map.cellSize })
				spawned++
			}
			spawnCursor = (spawnCursor + count) % keys.length
		}
	}
	const attempted = spawned + [...skipped.values()].reduce((a, b) => a + b, 0)
	if (attempted > 0 || skipped.size > 0) {
		editorLog.info('NpcSpawn', { attempted, spawned, skipped: Object.fromEntries(skipped) })
	}
}

function buildEngine(state: NpcSimCoreState, host: NpcSimulationCoreHost, floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
	state.currentCanvas = canvas
	const built = buildNpcEngineLayout(floors, canvas, getAssetDefSafe(host), getAssetTagsSafe(host))
	state.floorMaps = built.floorMaps
	state.floorDataMap = built.floorDataMap

	const policy = createNpcEnginePolicy({
		getConfig: () => state.config.value,
		floors: built.layout.floors,
		floorMaps: state.floorMaps,
		floorDataMap: state.floorDataMap,
		interactionTargets: built.layout.interactionTargets,
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		getTickNumber: () => state.engine?.tickNumber ?? 0,
		listAgents: () => state.engine?.listAgents() ?? [],
		getAssetTags: getAssetTagsSafe(host),
		getManagedTags: host.getManagedTags,
		random: host.random,
	})

	const cfg = host.getConfig()
	state.engine = new NpcEngine(built.layout, {
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
		random: host.random,
		crossFloorCooldownSeconds: cfg?.crossFloorCooldownSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.crossFloorCooldownSeconds,
		progressWatchdogTicks: cfg?.progressWatchdogTicks ?? NPC_ENGINE_DEFAULT_OPTIONS.progressWatchdogTicks,
		maxRepathAttempts: cfg?.maxRepathAttempts ?? NPC_ENGINE_DEFAULT_OPTIONS.maxRepathAttempts,
		repathCooldownSeconds: cfg?.repathCooldownSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.repathCooldownSeconds,
		repathCooldownExponent: cfg?.repathCooldownExponent ?? NPC_ENGINE_DEFAULT_OPTIONS.repathCooldownExponent,
		pathBudgetMinPerTick: cfg?.pathBudgetMinPerTick ?? NPC_ENGINE_DEFAULT_OPTIONS.pathBudgetMinPerTick,
		pathBudgetAgentsPerCall: cfg?.pathBudgetAgentsPerCall ?? NPC_ENGINE_DEFAULT_OPTIONS.pathBudgetAgentsPerCall,
		chooseTargetMinPerTick: cfg?.chooseTargetMinPerTick ?? NPC_ENGINE_DEFAULT_OPTIONS.chooseTargetMinPerTick,
		chooseTargetAgentsPerSlot: cfg?.chooseTargetAgentsPerSlot ?? NPC_ENGINE_DEFAULT_OPTIONS.chooseTargetAgentsPerSlot,
		wanderMemorySize: cfg?.wanderMemorySize ?? NPC_ENGINE_DEFAULT_OPTIONS.wanderMemorySize,
		wanderSmallMapThreshold: cfg?.wanderSmallMapThreshold ?? NPC_ENGINE_DEFAULT_OPTIONS.wanderSmallMapThreshold,
		triggerRatePeriodSeconds: cfg?.triggerRatePeriodSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.triggerRatePeriodSeconds,
		socialRadius: 2,
		socialCooldownSeconds: 45,
		socialChatDurationMinSeconds: 3,
		socialChatDurationMaxSeconds: 8,
		...policy,
	})

	spawnAgents(state, host, floors, canvas)
	syncAgents(state)
}

function frame(state: NpcSimCoreState, host: NpcSimulationCoreHost): void {
	if (!state.isPaused.value && state.engine) {
		const cfg = host.getConfig()
		const maxSteps = cfg?.maxSimulationSteps ?? 8
		const budgetMs = cfg?.frameSimBudgetMs ?? 6
		const desired = Math.max(1, Math.min(maxSteps, Math.round(state.simSpeed.value)))
		let steps = desired
		if (state.tickCostEma > 0) {
			steps = Math.max(1, Math.min(desired, Math.floor(budgetMs / state.tickCostEma)))
		}
		const t0 = performance.now()
		state.engine.tick(steps)
		state.tickCostEma = state.tickCostEma === 0 ? (performance.now() - t0) / steps : state.tickCostEma * 0.85 + ((performance.now() - t0) / steps) * 0.15
		syncAgents(state)
		const events = state.engine.drainEvents()
		pruneArrivalMarks(state.arrivalMarks, state.engine.tickNumber)
		if (events.length > 0) {
			const chatEvents = events.filter(e => e.type === 'chatting-start' || e.type === 'chatting-end')
			if (chatEvents.length > 0 || state.socialEvents.value.length > 0) state.socialEvents.value = chatEvents
			for (const event of events) {
				if (event.type === 'waiting' && event.reason) {
					const dot = state.frameDots.get(event.agentId)
					if (dot && (dot.status === 'waiting' || dot.status === 'queued')) state.waitReasons.set(event.agentId, event.reason)
				}
				latchArrivalEvent(state.arrived, state.arrivalMarks, event, host.idPrefix)
			}
		} else {
			if (state.socialEvents.value.length > 0) state.socialEvents.value = []
		}
	}
	state.animationId = requestAnimationFrame(() => frame(state, host))
}

function applyConfigSpeedToAgents(state: NpcSimCoreState): void {
	const speed = Math.max(0.01, state.config.value.speed || 1 / 30)
	if (!state.engine) return
	for (const agent of state.engine.listAgents()) {
		agent.speed = speed * NPC_ENGINE_TICKS_PER_SECOND / Math.max(1, state.floorMaps.get(agent.floorId)?.cellSize ?? 1)
	}
}

function ingestConfig(state: NpcSimCoreState, raw: NpcSimulationConfig | undefined): boolean {
	if (!raw || !isNpcConfig(raw)) return false
	state.config.value = mergeNpcConfig(cloneDeepRaw(raw))
	state.dotRoleColors.clear()
	applyConfigSpeedToAgents(state)
	return true
}

export function useNpcSimulationCore(host: NpcSimulationCoreHost) {
	const state: NpcSimCoreState = {
		npcs: shallowRef<NpcSimDot[]>([]),
		socialEvents: shallowRef<NpcEngineEvent[]>([]),
		isPaused: ref(false),
		simSpeed: ref(1),
		config: ref<NpcSimulationConfig>({
			speed: NPC_DEFAULT_SPEED,
			defaultRoleId: '',
			roles: [],
			tasks: [],
			pool: [],
			...NPC_OPTION_DEFAULTS,
			...NPC_FRAME_DEFAULTS,
		}),
		animationId: null,
		engine: null,
		deploymentActive: false,
		nextId: 1,
		spawnFloorOverride: null,
		tickCostEma: 0,
		floorMaps: new Map(),
		floorDataMap: new Map(),
		currentCanvas: null,
		viewFloorId: host.getViewFloorId(),
		lastSyncAt: 0,
		frameDots: new Map(),
		waitReasons: new Map(),
		arrived: new Set(),
		arrivalMarks: new Map(),
		seenAgentIds: new Set(),
		dotRoleColors: new Map(),
	}

	function startLoop(): void {
		if (state.animationId === null) state.animationId = requestAnimationFrame(() => frame(state, host))
	}

	function stopLoop(): void {
		if (state.animationId !== null) cancelAnimationFrame(state.animationId)
		state.animationId = null
		state.isPaused.value = false
	}

	return {
		npcs: state.npcs,
		frameDots: state.frameDots,
		waitReasons: state.waitReasons,
		arrivalMarks: state.arrivalMarks,
		socialEvents: state.socialEvents,
		isPaused: state.isPaused,
		simSpeed: state.simSpeed,
		config: state.config,
		ingestConfig: (raw: NpcSimulationConfig | undefined) => ingestConfig(state, raw),
		deploy(floors: readonly FloorData[], canvas: NpcCanvasBounds, newViewFloorId: string, spawnFloorId?: string): void {
			stopLoop()
			ingestConfig(state, host.getConfig())
			state.spawnFloorOverride = spawnFloorId ?? null
			state.tickCostEma = 0
			state.deploymentActive = true
			state.waitReasons.clear()
			state.arrived.clear()
			state.arrivalMarks.clear()
			state.viewFloorId = newViewFloorId
			buildEngine(state, host, floors, canvas)
			startLoop()
		},
		refresh(): void {
			if (!state.deploymentActive || !state.currentCanvas) return
			ingestConfig(state, host.getConfig())
			const floors = host.getFloors()
			if (floors.length) buildEngine(state, host, floors, state.currentCanvas)
		},
		setViewFloorId(floorId: string): void {
			state.viewFloorId = floorId
			if (state.deploymentActive) syncAgents(state)
		},
		reset(): void {
			stopLoop()
			state.engine = null
			state.floorMaps = new Map()
			state.floorDataMap = new Map()
			state.frameDots.clear()
			state.waitReasons.clear()
			state.arrived.clear()
			state.arrivalMarks.clear()
			state.dotRoleColors.clear()
			state.currentCanvas = null
			state.viewFloorId = null
			state.deploymentActive = false
			state.spawnFloorOverride = null
			state.tickCostEma = 0
			state.npcs.value = []
			state.socialEvents.value = []
		},
		start: startLoop,
		stopLoop,
		isDeploymentActive(): boolean {
			return state.deploymentActive
		},
		getViewFloorId(): string | null {
			return state.viewFloorId
		},
	}
}

export type NpcSimulationCore = ReturnType<typeof useNpcSimulationCore>