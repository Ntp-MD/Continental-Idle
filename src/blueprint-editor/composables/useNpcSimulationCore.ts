import { ref, shallowRef } from 'vue'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
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
import { isNpcConfig, clampInt } from '@/blueprint-editor/domain/types'
import { mergeNpcConfig, editorLog, cloneDeepRaw } from '@/blueprint-editor/blueprintStore'

const MAX_ROLE_SPAWN_COUNT = 100

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

export function useNpcSimulationCore(host: NpcSimulationCoreHost) {
	const npcs = shallowRef<NpcSimDot[]>([])
	const socialEvents = shallowRef<NpcEngineEvent[]>([])
	const isPaused = ref(false)
	const simSpeed = ref(1)
	const config = ref<NpcSimulationConfig>({
		speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [],
		crossFloorCooldownSeconds: 30, progressWatchdogTicks: 120, maxRepathAttempts: 4,
		repathCooldownSeconds: 2, repathCooldownExponent: 1.5, pathBudgetMinPerTick: 2,
		pathBudgetAgentsPerCall: 100, chooseTargetMinPerTick: 8, chooseTargetAgentsPerSlot: 20,
		wanderMemorySize: 32, wanderSmallMapThreshold: 8, triggerRatePeriodSeconds: 60,
		frameSimBudgetMs: 6, maxSimulationSteps: 8,
	})

	let animationId: number | null = null
	let engine: NpcEngine | null = null
	let deploymentActive = false
	let nextId = 1
	let spawnFloorOverride: string | null = null
	let tickCostEma = 0
	let floorMaps = new Map<string, NpcWalkableMap>()
	let floorDataMap = new Map<string, FloorData>()
	let currentCanvas: NpcCanvasBounds | null = null
	let viewFloorId: string | null = host.getViewFloorId()

	const SYNC_INTERVAL_MS = 250
	let lastSyncAt = 0
	const frameDots = new Map<string, NpcSimDot>()
	const waitReasons = new Map<string, string>()
	const arrived = new Set<string>()
	const arrivalMarks = new Map<string, number>()
	const seenAgentIds = new Set<string>()
	const dotRoleColors = new Map<string, string>()

	function isRoleAllowedOnFloor(roleId: string, floorId: string): boolean {
		const floor = floorDataMap.get(floorId)
		if (!floor?.allowedRoleIds?.length) return true
		return floor.allowedRoleIds.includes(roleId)
	}

	function dotColorFor(requestedRoleId: string): string {
		let color = dotRoleColors.get(requestedRoleId)
		if (color === undefined) {
			color = resolveRole(config.value, requestedRoleId)?.color ?? '#8ecae6'
			dotRoleColors.set(requestedRoleId, color)
		}
		return color
	}

	function syncAgents(): void {
		const currentEngine = engine
		if (!currentEngine) return
		const agents = currentEngine.listAgents()
		seenAgentIds.clear()
		for (const agent of agents) {
			const map = floorMaps.get(agent.floorId)
			if (!map) continue
			const cs = map.cellSize
			seenAgentIds.add(agent.id)
			const existing = frameDots.get(agent.id)
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
			frameDots.set(agent.id, dot)
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
			dot.color = dotColorFor(agent.roleId ?? '')
		}
		if (frameDots.size > seenAgentIds.size) {
			for (const id of frameDots.keys()) {
				if (!seenAgentIds.has(id)) frameDots.delete(id)
			}
		}
		for (const id of waitReasons.keys()) {
			const dot = frameDots.get(id)
			if (!dot || (dot.status !== 'waiting' && dot.status !== 'queued')) waitReasons.delete(id)
		}
		const now = performance.now()
		if (now - lastSyncAt >= SYNC_INTERVAL_MS && !isPaused.value) {
			lastSyncAt = now
			npcs.value = [...frameDots.values()].filter(dot => dot.floorId === viewFloorId)
		}
	}

	function spawnAgents(floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
		if (!engine) return
		const rand = host.random ?? Math.random
		npcs.value = []
		const occupiedSpawnKeys = new Set<string>()
		let spawnCursor = 0
		const skipped = new Map<string, number>()
		const skip = (reason: string, count: number) => { skipped.set(reason, (skipped.get(reason) ?? 0) + count) }
		let spawned = 0

		for (const entry of config.value.pool) {
			const count = clampInt(entry.count || 0, 0, MAX_ROLE_SPAWN_COUNT)
			const role = resolveRole(config.value, entry.roleId)
			if (!role) { skip('unknown-role', count * floors.length); continue }
			for (const floor of floors) {
				if (spawnFloorOverride && floor.id !== spawnFloorOverride) { skip('floor-override', count); continue }
				const allowedFloorIds = entry.floorIds ?? []
				if (allowedFloorIds.length > 0 && !allowedFloorIds.includes(floor.id)) { skip('floor-id-filter', count); continue }
				if (!isRoleAllowedOnFloor(role.id, floor.id)) { skip('role-floor-restriction', count); continue }
				if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTagsSafe())) { skip('target-tags', count); continue }
				const map = floorMaps.get(floor.id)
				if (!map) { skip('no-floor-map', count); continue }
				const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTagsSafe())
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
					const id = `${host.idPrefix}${nextId++}`
					const speed = Math.max(0.01, config.value.speed || 1 / 30) + (rand() - 0.5) * 0.02
					engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: speed * NPC_ENGINE_TICKS_PER_SECOND / map.cellSize })
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

	function getAssetTagsSafe(): ((type: string) => string[] | undefined) | undefined {
		return host.getAssetTags ? (type: string) => host.getAssetTags!(type) : undefined
	}

	function getAssetDefSafe(): ((type: string) => AssetDef | undefined) | undefined {
		return host.getAssetDef ? (type: string) => host.getAssetDef!(type) : undefined
	}

	function buildEngine(floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
		currentCanvas = canvas
		const built = buildNpcEngineLayout(floors, canvas, getAssetDefSafe(), getAssetTagsSafe())
		floorMaps = built.floorMaps
		floorDataMap = built.floorDataMap

		const policy = createNpcEnginePolicy({
			getConfig: () => config.value,
			floors: built.layout.floors,
			floorMaps,
			floorDataMap,
			interactionTargets: built.layout.interactionTargets,
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			getTickNumber: () => engine?.tickNumber ?? 0,
			listAgents: () => engine?.listAgents() ?? [],
			getAssetTags: getAssetTagsSafe(),
			getManagedTags: host.getManagedTags,
			random: host.random,
		})

		const cfg = host.getConfig()
		engine = new NpcEngine(built.layout, {
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
			random: host.random,
			crossFloorCooldownSeconds: cfg?.crossFloorCooldownSeconds ?? 30,
			progressWatchdogTicks: cfg?.progressWatchdogTicks ?? 120,
			maxRepathAttempts: cfg?.maxRepathAttempts ?? 4,
			repathCooldownSeconds: cfg?.repathCooldownSeconds ?? 2,
			repathCooldownExponent: cfg?.repathCooldownExponent ?? 1.5,
			pathBudgetMinPerTick: cfg?.pathBudgetMinPerTick ?? 2,
			pathBudgetAgentsPerCall: cfg?.pathBudgetAgentsPerCall ?? 100,
			chooseTargetMinPerTick: cfg?.chooseTargetMinPerTick ?? 8,
			chooseTargetAgentsPerSlot: cfg?.chooseTargetAgentsPerSlot ?? 20,
			wanderMemorySize: cfg?.wanderMemorySize ?? 32,
			wanderSmallMapThreshold: cfg?.wanderSmallMapThreshold ?? 8,
			triggerRatePeriodSeconds: cfg?.triggerRatePeriodSeconds ?? 60,
			socialRadius: 2,
			socialCooldownSeconds: 45,
			socialChatDurationMinSeconds: 3,
			socialChatDurationMaxSeconds: 8,
			...policy,
		})

		spawnAgents(floors, canvas)
		syncAgents()
	}

	function frame(): void {
		if (!isPaused.value && engine) {
			const cfg = host.getConfig()
			const maxSteps = cfg?.maxSimulationSteps ?? 8
			const budgetMs = cfg?.frameSimBudgetMs ?? 6
			const desired = Math.max(1, Math.min(maxSteps, Math.round(simSpeed.value)))
			let steps = desired
			if (tickCostEma > 0) {
				steps = Math.max(1, Math.min(desired, Math.floor(budgetMs / tickCostEma)))
			}
			const t0 = performance.now()
			engine.tick(steps)
			tickCostEma = tickCostEma === 0 ? (performance.now() - t0) / steps : tickCostEma * 0.85 + ((performance.now() - t0) / steps) * 0.15
			syncAgents()
			const events = engine.drainEvents()
			pruneArrivalMarks(arrivalMarks, engine.tickNumber)
			if (events.length > 0) {
				const chatEvents = events.filter(e => e.type === 'chatting-start' || e.type === 'chatting-end')
				if (chatEvents.length > 0 || socialEvents.value.length > 0) socialEvents.value = chatEvents
				for (const event of events) {
					if (event.type === 'waiting' && event.reason) {
						const dot = frameDots.get(event.agentId)
						if (dot && (dot.status === 'waiting' || dot.status === 'queued')) waitReasons.set(event.agentId, event.reason)
					}
					latchArrivalEvent(arrived, arrivalMarks, event, host.idPrefix)
				}
			} else {
				if (socialEvents.value.length > 0) socialEvents.value = []
			}
		}
		animationId = requestAnimationFrame(frame)
	}

	function start(): void {
		if (animationId === null) animationId = requestAnimationFrame(frame)
	}

	function stopLoop(): void {
		if (animationId !== null) cancelAnimationFrame(animationId)
		animationId = null
		isPaused.value = false
	}

	/** Merge raw external config into working config; returns true when applied. */
	function ingestConfig(raw: NpcSimulationConfig | undefined): boolean {
		if (!raw || !isNpcConfig(raw)) return false
		config.value = mergeNpcConfig(cloneDeepRaw(raw))
		dotRoleColors.clear()
		applyConfigSpeedToAgents()
		return true
	}

	function applyConfigSpeedToAgents(): void {
		const speed = Math.max(0.01, config.value.speed || 1 / 30)
		if (!engine) return
		for (const agent of engine.listAgents()) {
			agent.speed = speed * NPC_ENGINE_TICKS_PER_SECOND / Math.max(1, floorMaps.get(agent.floorId)?.cellSize ?? 1)
		}
	}

	return {
		npcs,
		frameDots,
		waitReasons,
		arrivalMarks,
		socialEvents,
		isPaused,
		simSpeed,
		config,
		ingestConfig,
		deploy(floors: readonly FloorData[], canvas: NpcCanvasBounds, newViewFloorId: string, spawnFloorId?: string): void {
			stopLoop()
			ingestConfig(host.getConfig())
			spawnFloorOverride = spawnFloorId ?? null
			tickCostEma = 0
			deploymentActive = true
			waitReasons.clear()
			arrived.clear()
			arrivalMarks.clear()
			viewFloorId = newViewFloorId
			buildEngine(floors, canvas)
			start()
		},
		refresh(): void {
			if (!deploymentActive || !currentCanvas) return
			ingestConfig(host.getConfig())
			const floors = host.getFloors()
			if (floors.length) buildEngine(floors, currentCanvas)
		},
		setViewFloorId(floorId: string): void {
			viewFloorId = floorId
			if (deploymentActive) syncAgents()
		},
		reset(): void {
			stopLoop()
			engine = null
			floorMaps = new Map()
			floorDataMap = new Map()
			frameDots.clear()
			waitReasons.clear()
			arrived.clear()
			arrivalMarks.clear()
			dotRoleColors.clear()
			currentCanvas = null
			viewFloorId = null
			deploymentActive = false
			spawnFloorOverride = null
			tickCostEma = 0
			npcs.value = []
			socialEvents.value = []
		},
		start,
		stopLoop,
		isDeploymentActive(): boolean {
			return deploymentActive
		},
		getViewFloorId(): string | null {
			return viewFloorId
		},
	}
}

export type NpcSimulationCore = ReturnType<typeof useNpcSimulationCore>
