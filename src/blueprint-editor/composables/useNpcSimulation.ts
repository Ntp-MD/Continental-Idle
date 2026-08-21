import { onUnmounted, ref, watch, type Ref } from 'vue'
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
	type NpcEngineInteractionTarget,
	type NpcWalkableMap,
} from '@/engine/npc'
import type { AssetDef, FloorData, NpcRole, NpcSimDot, NpcSimulationConfig } from '../types'
import { isNpcConfig } from '../types'
import { mergeNpcConfig } from '../store/npcDefault'

const MAX_ROLE_SPAWN_COUNT = 100
const MAX_SIMULATION_STEPS = 8

function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value))
}

function resolveRole(config: NpcSimulationConfig, roleId: string): NpcRole | undefined {
	return config.roles.find(role => role.id === roleId)
		?? config.roles.find(role => role.id === config.defaultRoleId)
		?? config.roles[0]
}

export function useNpcSimulation(
	getConfig?: () => NpcSimulationConfig | undefined,
	getFloor?: () => FloorData | undefined,
	getCanvas?: () => NpcCanvasBounds,
	getFloorById?: (id: string) => FloorData | undefined,
	getAllFloors?: () => FloorData[],
	getAssetTags?: (type: string) => string[] | undefined,
	getAssetDef?: (type: string) => AssetDef | undefined,
	getManagedTags?: () => readonly string[],
): { npcs: Ref<NpcSimDot[]>; deploy: (floorId?: string) => void; start: () => void; stop: () => void; pause: () => void; resume: () => void; reset: () => void; refresh: () => void; isPaused: Ref<boolean>; simSpeed: Ref<number>; config: Ref<NpcSimulationConfig> } {
	const npcs = ref<NpcSimDot[]>([])
	const isPaused = ref(false)
	const simSpeed = ref(1)
	const config = ref<NpcSimulationConfig>({ speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [] })

	let animationId: number | null = null
	let engine: NpcEngine | null = null
	let deployedFloorId: string | null = null
	let deploymentActive = false
	let nextId = 1
	let floorMaps = new Map<string, NpcWalkableMap>()
	let floorDataMap = new Map<string, FloorData>()
	let interactionTargetsByKey = new Map<string, NpcEngineInteractionTarget>()
	let currentCanvas: NpcCanvasBounds | null = null
	let currentViewFloorId: string | null = null

	function isRoleAllowedOnFloor(roleId: string, floorId: string): boolean {
		const floor = floorDataMap.get(floorId)
		if (!floor?.allowedRoleIds?.length) return true
		return floor.allowedRoleIds.includes(roleId)
	}

	function syncAgents(): void {
		const currentEngine = engine
		if (!currentEngine) return
		const agents = currentEngine.listAgents()
		const agentMap = new Map<string, ReturnType<typeof currentEngine.listAgents>[number]>()
		for (const agent of agents) agentMap.set(agent.id, agent)

		let needsFilter = false
		for (const npc of npcs.value) {
			const agent = agentMap.get(npc.id)
			if (!agent) { needsFilter = true; continue }
			if (agent.floorId !== npc.floorId) {
				npc.floorId = agent.floorId
				needsFilter = true
			}
			const map = floorMaps.get(agent.floorId)
			if (!map) continue
			const cs = map.cellSize
			npc.x = cellToPixel(agent.x, cs)
			npc.y = cellToPixel(agent.y, cs)
			npc.targetX = cellToPixel(agent.targetX, cs)
			npc.targetY = cellToPixel(agent.targetY, cs)
			npc.pathIdx = agent.pathIndex
			npc.status = agent.status
			if (npc.path.length !== agent.path.length || agent.pathIndex < npc.pathIdx) {
				npc.path = agent.path.map(point => [cellToPixel(point.x, cs), cellToPixel(point.y, cs)] as [number, number])
			}
			npc.pauseTimer = agent.status === 'interacting' || agent.status === 'waiting' || agent.status === 'queued' ? agent.interactionRemainingTicks : 0
			npc.interactTargetKey = agent.reservationItemId
			npc.interactSpotKey = agent.reservationInteractSpotId
			const target = agent.reservationItemId && agent.reservationInteractSpotId
				? interactionTargetsByKey.get(`${agent.floorId}:${agent.reservationItemId}:${agent.reservationInteractSpotId}`)
				: undefined
			npc.interactDurationMin = target ? Math.round(target.durationMinSeconds * NPC_ENGINE_TICKS_PER_SECOND) : 0
			npc.interactDurationMax = target ? Math.round(target.durationMaxSeconds * NPC_ENGINE_TICKS_PER_SECOND) : 0
		}

		if (needsFilter) {
			npcs.value = npcs.value.filter(npc => {
				const agent = agentMap.get(npc.id)
				return agent && (npc.floorId === currentViewFloorId || agent.floorId === currentViewFloorId)
			})
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
				const allowedFloorIds = entry.floorIds ?? []
				if (allowedFloorIds.length > 0 && !allowedFloorIds.includes(floor.id)) continue
				if (!isRoleAllowedOnFloor(role.id, floor.id)) continue
				if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTags)) continue
				const map = floorMaps.get(floor.id)
				if (!map) continue
				const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTags)
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
					const id = `npc-sim-${nextId++}`
					const speed = Math.max(0.01, config.value.speed || 1 / 30) + (Math.random() - 0.5) * 0.02
					engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: speed * NPC_ENGINE_TICKS_PER_SECOND / map.cellSize })
					if (floor.id === currentViewFloorId) {
						npcs.value.push({
							id,
							floorId: floor.id,
							type: role.id,
							x: cellToPixel(x, map.cellSize),
							y: cellToPixel(y, map.cellSize),
							targetX: cellToPixel(x, map.cellSize),
							targetY: cellToPixel(y, map.cellSize),
							speed,
							color: role.color,
							status: 'idle',
							pauseTimer: 0,
							pathIdx: 0,
							path: [],
							interactTargetKey: null,
							interactSpotKey: null,
							interactDurationMin: 0,
							interactDurationMax: 0,
						})
					}
				}
				spawnCursor = (spawnCursor + count) % keys.length
			}
		}
	}

	function buildEngine(floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
		currentCanvas = canvas
		const built = buildNpcEngineLayout(floors, canvas, getAssetDef, getAssetTags)
		floorMaps = built.floorMaps
		floorDataMap = built.floorDataMap
		interactionTargetsByKey = built.interactionTargetsByKey

		const policy = createNpcEnginePolicy({
			getConfig: () => config.value,
			floors: built.layout.floors,
			floorMaps,
			floorDataMap,
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			getTickNumber: () => engine?.tickNumber ?? 0,
			listAgents: () => engine?.listAgents() ?? [],
			getAssetTags,
			getManagedTags,
		})

		engine = new NpcEngine(built.layout, {
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
			...policy,
		})

		spawnAgents(floors, canvas)
		syncAgents()
	}

	function rebuild(): void {
		if (!deploymentActive || !currentCanvas) return
		const floors = getAllFloors?.() ?? []
		if (floors.length) buildEngine(floors, currentCanvas)
	}

	function refresh(): void {
		rebuild()
	}

	function frame(): void {
		if (!isPaused.value && engine) {
			const steps = Math.max(1, Math.min(MAX_SIMULATION_STEPS, simSpeed.value))
			engine.tick(steps)
			syncAgents()
			engine.drainEvents()
		}
		animationId = window.requestAnimationFrame(frame)
	}

	function start(): void {
		if (animationId === null) animationId = window.requestAnimationFrame(frame)
	}

	function stopLoop(): void {
		if (animationId !== null) window.cancelAnimationFrame(animationId)
		animationId = null
		isPaused.value = false
	}

	function reset(): void {
		stopLoop()
		engine = null
		floorMaps = new Map()
		floorDataMap = new Map()
		interactionTargetsByKey = new Map()
		currentCanvas = null
		currentViewFloorId = null
		deployedFloorId = null
		deploymentActive = false
		npcs.value = []
	}

	function deploy(floorId?: string): void {
		const canvas = getCanvas?.()
		const floor = floorId && getFloorById ? getFloorById(floorId) : getFloor?.()
		if (!canvas || !floor) return
		const floors = getAllFloors?.() ?? [floor]
		if (!floors.length) return
		stopLoop()
		deploymentActive = true
		deployedFloorId = floor.id
		currentViewFloorId = floor.id
		buildEngine(floors, canvas)
		start()
	}

	function syncConfig(): void {
		const value = getConfig?.()
		if (!value || !isNpcConfig(value)) return
		config.value = mergeNpcConfig(deepClone(value))
		if (!engine) return
		const speed = Math.max(0.01, config.value.speed || 1 / 30)
		for (const agent of engine.listAgents()) {
			agent.speed = speed * NPC_ENGINE_TICKS_PER_SECOND / Math.max(1, floorMaps.get(agent.floorId)?.cellSize ?? 1)
		}
	}

	syncConfig()
	onUnmounted(stopLoop)

	watch(() => getConfig?.(), syncConfig, { deep: true })

	watch(() => getFloor?.()?.id, floorId => {
		if (!floorId) return
		currentViewFloorId = floorId
		if (deploymentActive && deployedFloorId && floorId !== deployedFloorId) {
			deployedFloorId = floorId
			syncAgents()
		}
	})

	watch(() => getFloor?.(), floor => {
		if (floor && floor.id === currentViewFloorId) rebuild()
	}, { deep: true })

	watch(() => getCanvas?.(), canvas => {
		if (!deploymentActive || !canvas) return
		const floors = getAllFloors?.() ?? []
		if (floors.length) buildEngine(floors, canvas)
	}, { deep: true })

	watch(() => config.value.speed, speed => {
		for (const npc of npcs.value) npc.speed = speed
		if (!engine) return
		for (const agent of engine.listAgents()) {
			agent.speed = Math.max(0.01, speed || 1 / 30) * NPC_ENGINE_TICKS_PER_SECOND / Math.max(1, floorMaps.get(agent.floorId)?.cellSize ?? 1)
		}
	})

	return {
		npcs,
		deploy,
		start,
		stop: () => {
			deploymentActive = false
			deployedFloorId = null
			stopLoop()
		},
		pause: () => { isPaused.value = true },
		resume: () => { isPaused.value = false },
		reset,
		refresh,
		isPaused,
		simSpeed,
		config,
	}
}
