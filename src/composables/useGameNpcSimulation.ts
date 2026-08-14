import { onUnmounted, ref, watch, type Ref } from 'vue'
import { NpcEngine, findNpcGridPath, selectBestTarget, WanderMemory, NPC_ENGINE_TICKS_PER_SECOND, type NpcEngineLayout, type NpcEngineFloor, type NpcEngineInteractionTarget } from '@/engine/npc'
import type { AssetDef, FloorData, InteractConfig, NpcSimDot, NpcRole, NpcSimulationConfig, ObjectData, TileEdges } from '@/blueprint-editor/types'
import { isNpcConfig, resolveInteractForTarget, resolveObjectDef } from '@/blueprint-editor/types'
import { mergeNpcConfig } from '@/blueprint-editor/store/npcDefault'
import type { SyncedLayoutPayload, SyncedObject } from '@/blueprint-editor/types'
import { buildAssetMap } from '@/blueprint-editor/assetUtils'
import { originAssets } from '@/blueprint-editor/store/dataLoader'
import { floorMatchesTargetTags, getObjectTags, getRoleFocusTags, hasMatchingTag } from '@/engine/npc/layoutAdapter'
import { buildNpcQueues } from '@/blueprint-editor/npcQueue'

const SIMULATION_TICKS_PER_SECOND = NPC_ENGINE_TICKS_PER_SECOND

interface WalkableMap { tiles: Set<string>; width: number; height: number; cellSize: number }
interface InteractionSource {
	floorId: string
	itemId: string
	interactSpotId: string
	x: number
	y: number
	tags: string[]
	capacity?: number
	durationMinSeconds: number
	durationMaxSeconds: number
	transitionToFloorId?: string
	destinationPortalKey?: string
	portalEndpointKey?: string
}

function deepClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) }
function cellSizeOf(tileSize: number): number { return Math.max(1, Math.round(tileSize) || 1) }
function tileKey(x: number, y: number): string { return `${x},${y}` }
function pixelToCell(value: number, tileSize: number): number { return Math.floor(value / cellSizeOf(tileSize)) }
function cellToPixel(value: number, tileSize: number): number { return (value + 0.5) * cellSizeOf(tileSize) }
function getTileEdge(obj: ObjectData, def: ReturnType<typeof resolveObjectDef>, tx: number, ty: number, tileSize: number, side: keyof TileEdges): boolean | undefined {
	if (!def.tileEdges?.length) return undefined
	const px = cellToPixel(tx, tileSize), py = cellToPixel(ty, tileSize)
	if (px < obj.x || px >= obj.x + obj.w || py < obj.y || py >= obj.y + obj.h) return undefined
	const row = Math.min(def.tileEdges.length - 1, Math.floor(Math.max(0, py - obj.y) * def.tileEdges.length / Math.max(1, obj.h)))
	const cols = def.tileEdges[row]?.length ?? 0
	if (!cols) return undefined
	const col = Math.min(cols - 1, Math.floor(Math.max(0, px - obj.x) * cols / Math.max(1, obj.w)))
	return def.tileEdges[row][col]?.[side]
}
function isTileWalkable(floor: FloorData, width: number, height: number, tileSize: number, tx: number, ty: number, getAssetDef?: (type: string) => AssetDef | undefined): boolean {
	if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false
	const px = cellToPixel(tx, tileSize), py = cellToPixel(ty, tileSize)
	for (const obj of floor.objects) {
		if (px < obj.x || px >= obj.x + obj.w || py < obj.y || py >= obj.y + obj.h) continue
		const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type), { w: obj.w, h: obj.h })
		const localX = Math.max(0, Math.min(obj.w - 0.001, px - obj.x)), localY = Math.max(0, Math.min(obj.h - 0.001, py - obj.y))
		let entrance = false
		if (def.tileStates?.length) {
			const row = Math.min(def.tileStates.length - 1, Math.floor(localY * def.tileStates.length / Math.max(1, obj.h)))
			const cols = def.tileStates[row]?.length ?? 0
			const col = cols ? Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, obj.w))) : 0
			entrance = def.tileStates[row]?.[col] === 'entrance'
			if (!def.tileEdges && def.entranceRequired && (row === 0 || row === def.tileStates.length - 1 || col === 0 || col === cols - 1) && !entrance) return false
		}
		if (def.walkable === false && !entrance) return false
		if (def.walkableGrid?.length && !entrance) {
			const row = Math.min(def.walkableGrid.length - 1, Math.floor(localY * def.walkableGrid.length / Math.max(1, obj.h)))
			const cols = def.walkableGrid[row]?.length ?? 0
			if (cols && def.walkableGrid[row][Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, obj.w)))] === false) return false
		}
	}
	return floor.defaultWalkable ?? true
}
function buildWalkableMap(floor: FloorData, canvasW: number, canvasH: number, tileSize: number, getAssetDef?: (type: string) => AssetDef | undefined): WalkableMap {
	const cellSize = cellSizeOf(tileSize), width = Math.max(0, Math.ceil(canvasW / cellSize)), height = Math.max(0, Math.ceil(canvasH / cellSize)), tiles = new Set<string>()
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (isTileWalkable(floor, width, height, cellSize, x, y, getAssetDef)) tiles.add(tileKey(x, y))
	return { tiles, width, height, cellSize }
}

function buildBlockedEdges(floor: FloorData, map: WalkableMap, getAssetDef?: (type: string) => AssetDef | undefined): { from: { x: number; y: number }; to: { x: number; y: number } }[] {
	const edges: { from: { x: number; y: number }; to: { x: number; y: number } }[] = []
	for (const cell of map.tiles) {
		const [x, y] = cell.split(',').map(Number)
		for (const [dx, dy, side] of [[1, 0, 'right'], [0, 1, 'bottom']] as const) {
			const nx = x + dx
			const ny = y + dy
			if (!map.tiles.has(tileKey(nx, ny))) continue
			if (!floor.objects.some(obj => { const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type), { w: obj.w, h: obj.h }); return getTileEdge(obj, def, x, y, map.cellSize, side) === true || getTileEdge(obj, def, nx, ny, map.cellSize, side === 'right' ? 'left' : 'top') === true })) continue
			edges.push({ from: { x, y }, to: { x: nx, y: ny } })
		}
	}
	return edges
}
function findNearestWalkable(map: WalkableMap, x: number, y: number, radius: number): string | null {
	for (let r = 1; r <= radius; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if ((Math.abs(dx) === r || Math.abs(dy) === r) && map.tiles.has(tileKey(x + dx, y + dy))) return tileKey(x + dx, y + dy)
	return null
}
function getRole(config: NpcSimulationConfig, roleId: string): NpcRole | undefined { return config.roles.find(role => role.id === roleId) ?? config.roles.find(role => role.id === config.defaultRoleId) ?? config.roles[0] }
function getRoleMap(map: WalkableMap, floor: FloorData, role: NpcRole, getAssetTags?: (type: string) => string[] | undefined): WalkableMap {
	if (!role.restrictedTags.length) return map
	const forbidden = new Set<string>()
	const mark = (x: number, y: number, w: number, h: number, tags: string[]) => { if (!hasMatchingTag(tags, role.restrictedTags)) return; for (let ty = Math.max(0, Math.floor(y / map.cellSize)); ty < Math.min(map.height, Math.ceil((y + h) / map.cellSize)); ty++) for (let tx = Math.max(0, Math.floor(x / map.cellSize)); tx < Math.min(map.width, Math.ceil((x + w) / map.cellSize)); tx++) forbidden.add(tileKey(tx, ty)) }
	for (const obj of floor.objects) mark(obj.x, obj.y, obj.w, obj.h, getObjectTags(obj, getAssetTags))
	return { ...map, tiles: new Set([...map.tiles].filter(key => !forbidden.has(key))) }
}
function makeInteractionTargets(floor: FloorData, map: WalkableMap, getAssetTags?: (type: string) => string[] | undefined, getAssetDef?: (type: string) => AssetDef | undefined): InteractionSource[] {
	const output: InteractionSource[] = []
	const add = (itemId: string, x: number, y: number, tags: string[], interactSpots: { x: number; y: number }[] | undefined, interact?: InteractConfig) => { if (!interactSpots?.length) return; interactSpots.forEach((interactSpot, index) => { const tx = pixelToCell(x + interactSpot.x, map.cellSize), ty = pixelToCell(y + interactSpot.y, map.cellSize); const nearest = map.tiles.has(tileKey(tx, ty)) ? tileKey(tx, ty) : findNearestWalkable(map, tx, ty, 5); if (!nearest) return; const [cellX, cellY] = nearest.split(',').map(Number); const resolved = resolveInteractForTarget(interact, interactSpots.length); output.push({ floorId: floor.id, itemId, interactSpotId: `${itemId}:${index}`, x: cellX, y: cellY, tags, capacity: resolved.capacity, durationMinSeconds: resolved.durationMinSeconds, durationMaxSeconds: resolved.durationMaxSeconds }) }) }

	for (const obj of floor.objects) {
		if (getObjectTags(obj, getAssetTags).includes('portal')) continue
		const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type), { w: obj.w, h: obj.h })
		add(`object:${obj.id}`, obj.x, obj.y, getObjectTags(obj, getAssetTags), def.interactSpots, def.interact)
	}
	return output
}

function portalEndpointKey(floorId: string, itemId: string, interactSpotIndex: number): string {
	return `${floorId}:${itemId}:endpoint:${interactSpotIndex}`
}

function makePortalTargets(
	allFloors: FloorData[],
	floorMaps: Map<string, WalkableMap>,
	getAssetTags?: (type: string) => string[] | undefined,
	getAssetDef?: (type: string) => AssetDef | undefined,
): InteractionSource[] {
	const output: InteractionSource[] = []
	const portals = allFloors.flatMap(floor =>
		floor.objects
			.filter(obj => getObjectTags(obj, getAssetTags).includes('portal'))
			.map(obj => ({ floor, obj })),
	)
	const portalFloorIds = new Set(portals.map(p => p.floor.id))

	for (const { floor, obj } of portals) {
		const map = floorMaps.get(floor.id)
		if (!map) continue
		const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type), { w: obj.w, h: obj.h })
		const interactSpots = def.interactSpots
		if (!interactSpots?.length) continue
		const otherPortalFloors = [...portalFloorIds].filter(fid => fid !== floor.id)

		interactSpots.forEach((interactSpot, interactSpotIdx) => {
			const rawX = pixelToCell(obj.x + interactSpot.x, map.cellSize)
			const rawY = pixelToCell(obj.y + interactSpot.y, map.cellSize)
			const nearest = map.tiles.has(tileKey(rawX, rawY))
				? tileKey(rawX, rawY)
				: findNearestWalkable(map, rawX, rawY, 5)
			if (!nearest) return
			const [cellX, cellY] = nearest.split(',').map(Number)
			const endpointKey = portalEndpointKey(floor.id, `portal:${obj.id}`, interactSpotIdx)

			for (const destFloorId of otherPortalFloors) {
				const destPortal = portals.find(p => p.floor.id === destFloorId)
				if (!destPortal) continue
				const destInteractSpotIdx = interactSpotIdx
				const destEndpointKey = portalEndpointKey(destFloorId, `portal:${destPortal.obj.id}`, destInteractSpotIdx)

				output.push({
					floorId: floor.id,
					itemId: `portal:${obj.id}`,
					interactSpotId: `portal:${interactSpotIdx}→${destFloorId}`,
					x: cellX,
					y: cellY,
					tags: ['portal', `portal:${destFloorId}`],
					capacity: 1,
					durationMinSeconds: 0,
					durationMaxSeconds: 0,
					transitionToFloorId: destFloorId,
					destinationPortalKey: destEndpointKey,
					portalEndpointKey: endpointKey,
				})
			}
		})
	}
	return output
}

function syncedObjectToObjectData(obj: SyncedObject): ObjectData {
	return {
		id: obj.id,
		type: obj.type,
		x: obj.x,
		y: obj.y,
		w: obj.w,
		h: obj.h,
		rotation: obj.rotation,
		fillColor: obj.fillColor,
		label: obj.label,
	}
}

function syncedPayloadToFloors(payload: SyncedLayoutPayload): FloorData[] {
	const floorIds = Object.keys(payload.floors).sort((a, b) => {
		if (a === 'G') return -1
		if (b === 'G') return 1
		return Number(a) - Number(b)
	})
	return floorIds.map(id => {
		const syncedFloor = payload.floors[id]
		return {
			id,
			name: id,
			label: id,
			objects: syncedFloor.objects.map(syncedObjectToObjectData),
			defaultWalkable: syncedFloor.defaultWalkable,
			allowedRoleIds: syncedFloor.allowedRoleIds,
		}
	})
}

export function useGameNpcSimulation(
	payloadRef: Ref<SyncedLayoutPayload | null>,
): { npcs: Ref<NpcSimDot[]>; deploy: () => void; start: () => void; stop: () => void; pause: () => void; resume: () => void; reset: () => void; isPaused: Ref<boolean>; simSpeed: Ref<number>; config: Ref<NpcSimulationConfig>; currentFloorId: Ref<string | null>; setFloor: (floorId: string) => void } {
	const npcs = ref<NpcSimDot[]>([]), isPaused = ref(false), simSpeed = ref(1), config = ref<NpcSimulationConfig>({ speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [] })
	const currentFloorId = ref<string | null>(null)
	let animationId: number | null = null, engine: NpcEngine | null = null, deploymentActive = false, nextId = 1
	let floorMaps = new Map<string, WalkableMap>()
	let floorDataMap = new Map<string, FloorData>()
	const wanderMemoryByAgent = new Map<string, WanderMemory>()
	const targetLastSelectedTick = new Map<string, number>()
	const getWanderMemory = (agentId: string): WanderMemory => {
		let memory = wanderMemoryByAgent.get(agentId)
		if (!memory) {
			memory = new WanderMemory(32, 8, Math.random)
			wanderMemoryByAgent.set(agentId, memory)
		}
		return memory
	}
	let currentCanvas: { w: number; h: number; tileSize: number } | null = null
	let currentViewFloorId: string | null = null
	let currentInteractionTargets = new Map<string, InteractionSource>()

	const assetMap = buildAssetMap(originAssets)
	const getAssetDef = (type: string) => assetMap.get(type)
	const getAssetTags = (type: string) => {
		const def = assetMap.get(type)
		return def?.tags
	}

	function isRoleAllowedOnFloor(roleId: string, floorId: string): boolean {
		const floor = floorDataMap.get(floorId)
		if (!floor?.allowedRoleIds?.length) return true
		return floor.allowedRoleIds.includes(roleId)
	}


	function pickNearestFloor(
		targets: readonly NpcEngineInteractionTarget[],
		currentFloorId: string,
		floors: readonly { id: string }[],
	): NpcEngineInteractionTarget | null {
		if (!targets.length) return null
		const floorIds = floors.map(f => f.id)
		const currentIdx = floorIds.indexOf(currentFloorId)
		return targets.reduce((best, t) => {
			const dist = Math.abs(floorIds.indexOf(t.floorId) - currentIdx)
			const bestDist = Math.abs(floorIds.indexOf(best.floorId) - currentIdx)
			return dist < bestDist ? t : best
		})
	}

	function syncAgents(): void {
		if (!engine) return
		const agents = new Map(engine.getAgents().map(agent => [agent.id, agent]))

		for (const npc of npcs.value) {
			const agent = agents.get(npc.id)
			if (!agent) continue
			const map = floorMaps.get(agent.floorId)
			if (!map) continue
			npc.x = cellToPixel(agent.x, map.cellSize)
			npc.y = cellToPixel(agent.y, map.cellSize)
			npc.targetX = cellToPixel(agent.targetX, map.cellSize)
			npc.targetY = cellToPixel(agent.targetY, map.cellSize)
			npc.pathIdx = agent.pathIndex
			npc.path = agent.path.map(point => [cellToPixel(point.x, map.cellSize), cellToPixel(point.y, map.cellSize)] as [number, number])
			npc.pauseTimer = agent.status === 'interacting' || agent.status === 'waiting' || agent.status === 'queued' ? agent.interactionRemainingTicks : 0
			npc.interactTargetKey = agent.reservationItemId
			npc.interactSpotKey = agent.reservationInteractSpotId
			const target = agent.reservationItemId && agent.reservationInteractSpotId ? currentInteractionTargets.get(`${agent.floorId}:${agent.reservationItemId}:${agent.reservationInteractSpotId}`) : undefined
			npc.interactDurationMin = target ? Math.round(target.durationMinSeconds * SIMULATION_TICKS_PER_SECOND) : 0
			npc.interactDurationMax = target ? Math.round(target.durationMaxSeconds * SIMULATION_TICKS_PER_SECOND) : 0
		}

		npcs.value = npcs.value.filter(npc => npc.floorId === currentViewFloorId || agents.get(npc.id)?.floorId === currentViewFloorId)

		for (const npc of npcs.value) {
			const agent = agents.get(npc.id)
			if (agent && agent.floorId !== npc.floorId) npc.floorId = agent.floorId
		}
	}
	function buildEngine(allFloors: FloorData[], canvas: { w: number; h: number; tileSize: number }): void {
		currentCanvas = canvas
		floorMaps = new Map()
		floorDataMap = new Map()
		const allSources: InteractionSource[] = []
		const engineFloors: NpcEngineFloor[] = []

		for (const floor of allFloors) {
			const map = buildWalkableMap(floor, canvas.w, canvas.h, canvas.tileSize, getAssetDef)
			floorMaps.set(floor.id, map)
			floorDataMap.set(floor.id, floor)
			const sources = makeInteractionTargets(floor, map, getAssetTags, getAssetDef)
			allSources.push(...sources)
			engineFloors.push({
				id: floor.id,
				width: map.width,
				height: map.height,
				tileSize: map.cellSize,
				walkable: [...map.tiles].map(key => { const [x, y] = key.split(',').map(Number); return { x, y } }),
				blockedEdges: buildBlockedEdges(floor, map, getAssetDef),
				allowedRoleIds: floor.allowedRoleIds,
			})
		}

		const portalSources = makePortalTargets(allFloors, floorMaps, getAssetTags, getAssetDef)
		allSources.push(...portalSources)
		const queues = allFloors.flatMap(floor => {
			const engineFloor = engineFloors.find(value => value.id === floor.id)
			return engineFloor ? buildNpcQueues(engineFloor, floor, canvas.tileSize, assetMap, allSources) : []
		})

		currentInteractionTargets = new Map(allSources.map(source => [`${source.floorId}:${source.itemId}:${source.interactSpotId}`, source]))
		const layout: NpcEngineLayout = { floors: engineFloors, interactionTargets: allSources, queues }

		const triggerRates = config.value.tagTriggerRates ?? {}
		const hasTriggerRates = Object.keys(triggerRates).length > 0
		const tickRate = SIMULATION_TICKS_PER_SECOND * 60
		engine = new NpcEngine(layout, {
			ticksPerSecond: SIMULATION_TICKS_PER_SECOND, agentClearance: 0.5, queueSelector: (agent, targets, availableTargets, queueDefinitions) => {
				const role = getRole(config.value, agent.roleId ?? '')
				const map = floorMaps.get(agent.floorId)
				const floor = floorDataMap.get(agent.floorId)
				if (!role || !map || !floor) return null
				const tags = getRoleFocusTags(config.value, role)
				if (!tags.length) return null
				const availableKeys = new Set(availableTargets.map(target => `${target.floorId}:${target.itemId}:${target.interactSpotId}`))
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				const matchingTargets = targets.filter(target => !availableKeys.has(`${target.floorId}:${target.itemId}:${target.interactSpotId}`) && hasMatchingTag(target.tags, tags) && roleMap.tiles.has(tileKey(target.x, target.y)))
				if (!matchingTargets.length) return null
				const roleFloor = { id: agent.floorId, width: map.width, height: map.height, tileSize: map.cellSize, walkable: [...roleMap.tiles].map(value => { const [x, y] = value.split(',').map(Number); return { x, y } }) }
				return queueDefinitions
					.filter(queue => queue.targetKeys.some(targetKey => matchingTargets.some(target => targetKey === `${target.floorId}:${target.itemId}:${target.interactSpotId}`)))
					.sort((a, b) => {
						const distance = (queue: typeof a) => Math.min(...matchingTargets.filter(target => queue.targetKeys.includes(`${target.floorId}:${target.itemId}:${target.interactSpotId}`)).map(target => findNpcGridPath(roleFloor, agent, target)?.length ?? Number.POSITIVE_INFINITY))
						return distance(a) - distance(b)
					})[0] ?? null
			}, targetSelector: (agent, targets) => {
				const role = getRole(config.value, agent.roleId ?? '')
				if (!role) return null
				const tags = getRoleFocusTags(config.value, role)
				if (!tags.length) return null
				const map = floorMaps.get(agent.floorId)
				const floor = floorDataMap.get(agent.floorId)
				if (!map || !floor) return null
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				if (!hasTriggerRates) {
					if (role.focusChance <= 0 || Math.random() * 100 >= role.focusChance) return null
					const matching = targets.filter(target => hasMatchingTag(target.tags as string[], tags) && roleMap.tiles.has(tileKey(target.x, target.y)))
					if (!matching.length) return null
					const selected = selectBestTarget({ agent, targets: matching, currentTick: engine!.tickNumber, targetLastSelectedTick, random: Math.random })
					if (selected) targetLastSelectedTick.set(`${selected.floorId}:${selected.itemId}:${selected.interactSpotId}`, engine!.tickNumber)
					return selected
				}
				const triggered: string[] = []
				for (const tag of tags) {
					const ratePerMin = triggerRates[tag] ?? 0
					if (ratePerMin <= 0) continue
					const probPerTick = ratePerMin / tickRate
					if (Math.random() < probPerTick) triggered.push(tag)
				}
				if (!triggered.length) return null
				const matching = targets.filter(target => hasMatchingTag(target.tags as string[], triggered) && roleMap.tiles.has(tileKey(target.x, target.y)))
				if (!matching.length) return null
				const selected = selectBestTarget({ agent, targets: matching, currentTick: engine!.tickNumber, targetLastSelectedTick, random: Math.random })
				if (selected) targetLastSelectedTick.set(`${selected.floorId}:${selected.itemId}:${selected.interactSpotId}`, engine!.tickNumber)
				return selected
			}, crossFloorSelector: (agent, candidates, floors) => {
				const role = getRole(config.value, agent.roleId ?? '')
				if (!role) return null
				const tags = getRoleFocusTags(config.value, role)
				if (!tags.length) return null
				const matching = candidates.filter(t => hasMatchingTag(t.tags as string[], tags))
				if (!matching.length) return null
				return pickNearestFloor(matching, agent.floorId, floors)
			}, wanderSelector: (agent) => {
				const role = getRole(config.value, agent.roleId ?? '')
				const map = floorMaps.get(agent.floorId)
				const floor = floorDataMap.get(agent.floorId)
				if (!role || !map || !floor) return null
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				const keys = [...roleMap.tiles]
				if (!keys.length) return null
				const candidates = keys.map(key => { const [x, y] = key.split(',').map(Number); return { x, y } })
				const activeDestinations = engine?.getAgents().filter(other => other.id !== agent.id && other.floorId === agent.floorId && (other.status === 'walking' || other.status === 'queued')).map(other => ({ x: other.targetX, y: other.targetY })) ?? []
				const memory = getWanderMemory(agent.id)
				const selected = memory.selectWanderTile(candidates, agent, activeDestinations)
				if (selected) memory.recordVisit(selected, engine!.tickNumber)
				return selected
			}, pathfinder: (engineFloor, from, to, blockedCells) => {
				const role = getRole(config.value, from.roleId ?? '')
				const map = floorMaps.get(engineFloor.id)
				const floor = floorDataMap.get(engineFloor.id)
				if (!role || !map || !floor) return findNpcGridPath(engineFloor, from, to, blockedCells)
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				const roleFloor = { ...engineFloor, walkable: [...roleMap.tiles].map(key => { const [x, y] = key.split(',').map(Number); return { x, y } }) }
				return findNpcGridPath(roleFloor, from, to, blockedCells)
			}
		})
		npcs.value = []; const occupiedSpawnKeys = new Set<string>(); let spawnCursor = 0
		for (const entry of config.value.pool) {
			const role = getRole(config.value, entry.roleId)
			if (!role) continue
			const count = Math.max(0, Math.min(100, Math.floor(entry.count || 0)))
			for (const floor of allFloors) {
				if (!isRoleAllowedOnFloor(role.id, floor.id)) continue
				if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTags)) continue
				const map = floorMaps.get(floor.id)
				if (!map) continue
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				const keys = [...roleMap.tiles]
				if (!keys.length) continue
				const cx = canvas.w / 2 / map.cellSize
				const cy = canvas.h / 2 / map.cellSize
				keys.sort((a, b) => {
					const [ax, ay] = a.split(',').map(Number)
					const [bx, by] = b.split(',').map(Number)
					return Math.hypot(ax - cx, ay - cy) - Math.hypot(bx - cx, by - cy)
				})
				const spawnOffset = Math.floor(Math.random() * Math.max(1, keys.length))
				for (let i = 0; i < count; i++) {
					const availableSpawnKeys = keys.filter(key => !occupiedSpawnKeys.has(`${floor.id}:${key}`))
					if (!availableSpawnKeys.length) break
					const spawnKey = availableSpawnKeys[(spawnCursor + spawnOffset + i) % availableSpawnKeys.length]
					occupiedSpawnKeys.add(`${floor.id}:${spawnKey}`)
					const [x, y] = spawnKey.split(',').map(Number)
					const id = `npc-game-${nextId++}`, oldSpeed = Math.max(0.01, config.value.speed || 1 / 30) + (Math.random() - 0.5) * 0.02
					engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: oldSpeed * SIMULATION_TICKS_PER_SECOND / map.cellSize })
					if (floor.id === currentViewFloorId) {
						npcs.value.push({ id, floorId: floor.id, type: role.id, x: cellToPixel(x, map.cellSize), y: cellToPixel(y, map.cellSize), targetX: cellToPixel(x, map.cellSize), targetY: cellToPixel(y, map.cellSize), speed: oldSpeed, color: role.color, pauseTimer: 0, pathIdx: 0, path: [], interactTargetKey: null, interactSpotKey: null, interactDurationMin: 0, interactDurationMax: 0 })
					}
				}
				spawnCursor = (spawnCursor + count) % keys.length
			}
		}
		syncAgents()
	}
	function frame(): void { if (!isPaused.value && engine) { const steps = Math.max(1, Math.min(8, simSpeed.value)); for (let i = 0; i < steps; i++) { engine.tick(); } syncAgents(); engine.drainEvents() } animationId = window.requestAnimationFrame(frame) }
	function start(): void { if (animationId === null) animationId = window.requestAnimationFrame(frame) }
	function stopLoop(): void { if (animationId !== null) window.cancelAnimationFrame(animationId); animationId = null; isPaused.value = false }
	function reset(): void { stopLoop(); engine = null; floorMaps = new Map(); floorDataMap = new Map(); currentCanvas = null; currentViewFloorId = null; currentInteractionTargets.clear(); deploymentActive = false; npcs.value = []; wanderMemoryByAgent.clear(); targetLastSelectedTick.clear() }
	function deploy(): void {
		const payload = payloadRef.value
		if (!payload) return
		const floors = syncedPayloadToFloors(payload)
		if (!floors.length) return
		const canvas = { w: payload.canvas.width, h: payload.canvas.height, tileSize: payload.canvas.tileSize }
		const firstFloorId = floors[0].id
		stopLoop(); deploymentActive = true; currentViewFloorId = firstFloorId; currentFloorId.value = firstFloorId; buildEngine(floors, canvas); start()
	}
	function setFloor(floorId: string): void {
		currentFloorId.value = floorId
		currentViewFloorId = floorId
		if (deploymentActive) {
			syncAgents()
		}
	}
	function syncConfig(): void {
		const payload = payloadRef.value
		if (payload?.npcConfig && isNpcConfig(payload.npcConfig)) {
			config.value = mergeNpcConfig(deepClone(payload.npcConfig))
			if (deploymentActive && currentCanvas) {
				const floors = syncedPayloadToFloors(payload)
				if (floors.length) buildEngine(floors, currentCanvas)
			}
		}
	}
	syncConfig(); onUnmounted(stopLoop)

	watch(() => payloadRef.value, () => {
		syncConfig()
		if (!deploymentActive && payloadRef.value) {
			deploy()
		}
	}, { deep: true })

	watch(() => config.value.speed, speed => {
		for (const npc of npcs.value) npc.speed = speed
		if (deploymentActive && currentCanvas) {
			const payload = payloadRef.value
			if (payload) {
				const floors = syncedPayloadToFloors(payload)
				if (floors.length) buildEngine(floors, currentCanvas)
			}
		}
	})

	return { npcs, deploy, start, stop: () => { deploymentActive = false; stopLoop() }, pause: () => { isPaused.value = true }, resume: () => { isPaused.value = false }, reset, isPaused, simSpeed, config, currentFloorId, setFloor }
}
