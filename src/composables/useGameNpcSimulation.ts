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
	interactionTargetKey,
	type NpcCanvasBounds,
	type NpcEngineInteractionTarget,
	type NpcWalkableMap,
} from '@/engine/npc'
import type { FloorData, NpcRole, NpcSimDot, NpcSimulationConfig, ObjectData, SyncedLayoutPayload, SyncedObject } from '@/blueprint-editor/types'
import { isNpcConfig } from '@/blueprint-editor/types'
import { mergeNpcConfig } from '@/blueprint-editor/store/npcDefault'
import { buildAssetMap } from '@/blueprint-editor/assetUtils'
import { originAssets } from '@/blueprint-editor/store/dataLoader'

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

function toObjectData(object: SyncedObject): ObjectData {
	return {
		id: object.id,
		type: object.type,
		x: object.x,
		y: object.y,
		w: object.w,
		h: object.h,
		rotation: object.rotation,
		fillColor: object.fillColor,
		label: object.label,
	}
}

function toFloors(payload: SyncedLayoutPayload): FloorData[] {
	return Object.keys(payload.floors)
		.sort((a, b) => {
			if (a === 'G') return -1
			if (b === 'G') return 1
			return Number(a) - Number(b)
		})
		.map(id => ({
			id,
			name: id,
			label: id,
			objects: payload.floors[id].objects.map(toObjectData),
			defaultWalkable: payload.floors[id].defaultWalkable,
			walkable: payload.floors[id].walkable,
			spawnZones: payload.floors[id].spawnZones,
			allowedRoleIds: payload.floors[id].allowedRoleIds,
		}))
}

export function useGameNpcSimulation(
	payloadRef: Ref<SyncedLayoutPayload | null>,
): { npcs: Ref<NpcSimDot[]>; deploy: () => void; start: () => void; stop: () => void; pause: () => void; resume: () => void; reset: () => void; isPaused: Ref<boolean>; simSpeed: Ref<number>; config: Ref<NpcSimulationConfig>; currentFloorId: Ref<string | null>; setFloor: (floorId: string) => void } {
	const npcs = ref<NpcSimDot[]>([])
	const isPaused = ref(false)
	const simSpeed = ref(1)
	const config = ref<NpcSimulationConfig>({ speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [] })
	const currentFloorId = ref<string | null>(null)

	let animationId: number | null = null
	let engine: NpcEngine | null = null
	let deploymentActive = false
	let nextId = 1
	let floorMaps = new Map<string, NpcWalkableMap>()
	let floorDataMap = new Map<string, FloorData>()
	let interactionTargetsByKey = new Map<string, NpcEngineInteractionTarget>()
	let currentCanvas: NpcCanvasBounds | null = null
	let currentViewFloorId: string | null = null

	const assetMap = buildAssetMap(originAssets)
	const getAssetDef = (type: string) => assetMap.get(type)
	const getAssetTags = (type: string) => assetMap.get(type)?.tags

	function isRoleAllowedOnFloor(roleId: string, floorId: string): boolean {
		const floor = floorDataMap.get(floorId)
		if (!floor?.allowedRoleIds?.length) return true
		return floor.allowedRoleIds.includes(roleId)
	}

	function syncAgents(): void {
		const currentEngine = engine
		if (!currentEngine) return
		for (const npc of npcs.value) {
			const agent = currentEngine.getAgent(npc.id)
			if (!agent) continue
			const map = floorMaps.get(agent.floorId)
			if (!map) continue
			npc.x = cellToPixel(agent.x, map.cellSize)
			npc.y = cellToPixel(agent.y, map.cellSize)
			npc.targetX = cellToPixel(agent.targetX, map.cellSize)
			npc.targetY = cellToPixel(agent.targetY, map.cellSize)
			npc.pathIdx = agent.pathIndex
			npc.status = agent.status
			npc.path = agent.path.map(point => [cellToPixel(point.x, map.cellSize), cellToPixel(point.y, map.cellSize)] as [number, number])
			npc.pauseTimer = agent.status === 'interacting' || agent.status === 'waiting' || agent.status === 'queued' ? agent.interactionRemainingTicks : 0
			npc.interactTargetKey = agent.reservationItemId
			npc.interactSpotKey = agent.reservationInteractSpotId
			const target = agent.reservationItemId && agent.reservationInteractSpotId
				? interactionTargetsByKey.get(interactionTargetKey({ floorId: agent.floorId, itemId: agent.reservationItemId, interactSpotId: agent.reservationInteractSpotId }))
				: undefined
			npc.interactDurationMin = target ? Math.round(target.durationMinSeconds * NPC_ENGINE_TICKS_PER_SECOND) : 0
			npc.interactDurationMax = target ? Math.round(target.durationMaxSeconds * NPC_ENGINE_TICKS_PER_SECOND) : 0
		}

		npcs.value = npcs.value.filter(npc => npc.floorId === currentViewFloorId || currentEngine.getAgent(npc.id)?.floorId === currentViewFloorId)

		for (const npc of npcs.value) {
			const agent = currentEngine.getAgent(npc.id)
			if (agent && agent.floorId !== npc.floorId) npc.floorId = agent.floorId
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
					const id = `npc-game-${nextId++}`
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
		const payload = payloadRef.value
		if (!deploymentActive || !currentCanvas || !payload) return
		const floors = toFloors(payload)
		if (floors.length) buildEngine(floors, currentCanvas)
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
		deploymentActive = false
		npcs.value = []
	}

	function deploy(): void {
		const payload = payloadRef.value
		if (!payload) return
		const floors = toFloors(payload)
		if (!floors.length) return
		stopLoop()
		deploymentActive = true
		currentViewFloorId = floors[0].id
		currentFloorId.value = floors[0].id
		buildEngine(floors, { w: payload.canvas.width, h: payload.canvas.height, tileSize: payload.canvas.tileSize })
		start()
	}

	function setFloor(floorId: string): void {
		currentFloorId.value = floorId
		currentViewFloorId = floorId
		if (deploymentActive) syncAgents()
	}

	function syncConfig(): void {
		const payload = payloadRef.value
		if (!payload?.npcConfig || !isNpcConfig(payload.npcConfig)) return
		config.value = mergeNpcConfig(deepClone(payload.npcConfig))
		rebuild()
	}

	syncConfig()
	onUnmounted(stopLoop)

	watch(() => payloadRef.value, () => {
		syncConfig()
		if (!deploymentActive && payloadRef.value) deploy()
	}, { deep: true })

	watch(() => config.value.speed, speed => {
		for (const npc of npcs.value) npc.speed = speed
		rebuild()
	})

	return {
		npcs,
		deploy,
		start,
		stop: () => {
			deploymentActive = false
			stopLoop()
		},
		pause: () => { isPaused.value = true },
		resume: () => { isPaused.value = false },
		reset,
		isPaused,
		simSpeed,
		config,
		currentFloorId,
		setFloor,
	}
}
