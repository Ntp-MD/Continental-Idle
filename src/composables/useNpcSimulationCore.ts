import { ref, shallowRef, toRaw } from 'vue'
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
} from '@/engine/npc'
import type { AssetDef, FloorData, NpcRole, NpcSimDot, NpcSimulationConfig } from '@/blueprint-editor/types'
import { isNpcConfig } from '@/blueprint-editor/types'
import { mergeNpcConfig } from '@/blueprint-editor/store/npcDefault'

const MAX_ROLE_SPAWN_COUNT = 100

export interface NpcSimulationCoreHost {
	getConfig(): NpcSimulationConfig | undefined
	getFloors(): readonly FloorData[]
	getCanvas(): NpcCanvasBounds
	getViewFloorId(): string | null
	idPrefix: string
	syncIntervalMs?: number
	getAssetDef?(type: string): AssetDef | undefined
	getAssetTags?(type: string): string[] | undefined
	getManagedTags?(): readonly string[]
}

function resolveRole(config: NpcSimulationConfig, roleId: string): NpcRole | undefined {
	return config.roles.find(role => role.id === roleId)
		?? config.roles.find(role => role.id === config.defaultRoleId)
		?? config.roles[0]
}

export function useNpcSimulationCore(host: NpcSimulationCoreHost) {
	const npcs = shallowRef<NpcSimDot[]>([])
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

	const SYNC_INTERVAL_MS = host.syncIntervalMs ?? 250
	let lastSyncAt = 0
	const frameDots = new Map<string, NpcSimDot>()

	function isRoleAllowedOnFloor(roleId: string, floorId: string): boolean {
		const floor = floorDataMap.get(floorId)
		if (!floor?.allowedRoleIds?.length) return true
		return floor.allowedRoleIds.includes(roleId)
	}

	function syncAgents(): void {
		const currentEngine = engine
		if (!currentEngine) return
		const agents = currentEngine.listAgents()
		const seen = new Set<string>()
		for (const agent of agents) {
			const map = floorMaps.get(agent.floorId)
			if (!map) continue
			const cs = map.cellSize
			seen.add(agent.id)
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
			if (dot.path.length !== agent.path.length || agent.pathIndex < dot.pathIdx) {
				dot.path = agent.path.map(point => [cellToPixel(point.x, cs), cellToPixel(point.y, cs)] as [number, number])
			}
			dot.pathIdx = agent.pathIndex
			const role = resolveRole(config.value, agent.roleId ?? '')
			if (role && dot) dot.color = role.color
		}
		for (const id of frameDots.keys()) {
			if (!seen.has(id)) frameDots.delete(id)
		}
		const now = performance.now()
		if (now - lastSyncAt >= SYNC_INTERVAL_MS && !isPaused.value) {
			lastSyncAt = now
			npcs.value = [...frameDots.values()].filter(dot => dot.floorId === viewFloorId)
		}
	}

	function spawnAgents(floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
		if (!engine) return
		npcs.value = []
		const occupiedSpawnKeys = new Set<string>()
		let spawnCursor = 0

		for (const entry of config.value.pool) {
			const role = resolveRole(config.value, entry.roleId)
			if (!role) continue
			const count = Math.max(0, Math.min(MAX_ROLE_SPAWN_COUNT, Math.floor(entry.count || 0)))
			for (const floor of floors) {
				if (spawnFloorOverride && floor.id !== spawnFloorOverride) continue
				const allowedFloorIds = entry.floorIds ?? []
				if (allowedFloorIds.length > 0 && !allowedFloorIds.includes(floor.id)) continue
				if (!isRoleAllowedOnFloor(role.id, floor.id)) continue
				if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTagsSafe())) continue
				const map = floorMaps.get(floor.id)
				if (!map) continue
				const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTagsSafe())
				const keys = [...filterNpcSpawnTiles(roleMap, floor, role.id)]
				if (!keys.length) continue
				const centerX = canvas.w / 2 / map.cellSize
				const centerY = canvas.h / 2 / map.cellSize
				keys.sort((a, b) => {
					const [ax, ay] = a.split(',').map(Number)
					const [bx, by] = b.split(',').map(Number)
					return Math.hypot(ax - centerX, ay - centerY) - Math.hypot(bx - centerX, by - centerY)
				})
				const spawnOffset = Math.floor(Math.random() * Math.max(1, keys.length))
				for (let i = 0; i < count; i++) {
					let spawnIndex = (spawnCursor + spawnOffset + i) % keys.length
					let attempts = 0
					while (attempts < keys.length && occupiedSpawnKeys.has(`${floor.id}:${keys[spawnIndex]}`)) {
						spawnIndex = (spawnIndex + 1) % keys.length
						attempts++
					}
					if (attempts >= keys.length) break
					const spawnKey = keys[spawnIndex]
					occupiedSpawnKeys.add(`${floor.id}:${spawnKey}`)
					const [x, y] = spawnKey.split(',').map(Number)
					const id = `${host.idPrefix}${nextId++}`
					const speed = Math.max(0.01, config.value.speed || 1 / 30) + (Math.random() - 0.5) * 0.02
					engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: speed * NPC_ENGINE_TICKS_PER_SECOND / map.cellSize })
				}
				spawnCursor = (spawnCursor + count) % keys.length
			}
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
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			getTickNumber: () => engine?.tickNumber ?? 0,
			listAgents: () => engine?.listAgents() ?? [],
			getAssetTags: getAssetTagsSafe(),
			getManagedTags: host.getManagedTags,
		})

		const cfg = host.getConfig()
		engine = new NpcEngine(built.layout, {
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
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
			engine.drainEvents()
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
		config.value = mergeNpcConfig(structuredClone(toRaw(raw)))
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
		isPaused,
		simSpeed,
		config,
		ingestConfig,
		deploy(floors: readonly FloorData[], canvas: NpcCanvasBounds, newViewFloorId: string, spawnFloorId?: string): void {
			stopLoop()
			spawnFloorOverride = spawnFloorId ?? null
			tickCostEma = 0
			deploymentActive = true
			viewFloorId = newViewFloorId
			buildEngine(floors, canvas)
			start()
		},
		refresh(): void {
			if (!deploymentActive || !currentCanvas) return
			const floors = host.getFloors()
			if (floors.length) buildEngine(floors, currentCanvas)
		},
		setViewFloorId(floorId: string): void {
			viewFloorId = floorId
			if (deploymentActive) syncAgents()
		},
		clearDeployment(): void {
			deploymentActive = false
		},
		reset(): void {
			stopLoop()
			engine = null
			floorMaps = new Map()
			floorDataMap = new Map()
			frameDots.clear()
			currentCanvas = null
			viewFloorId = null
			deploymentActive = false
			spawnFloorOverride = null
			tickCostEma = 0
			npcs.value = []
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
