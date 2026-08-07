import { onUnmounted, ref, watch, type Ref } from 'vue'
import { NpcEngine, findNpcGridPath, selectBestTarget, WanderMemory, NPC_ENGINE_TICKS_PER_SECOND, getRoomTags as getRoomTagsShared, type NpcEngineLayout, type NpcEngineFloor, type NpcEngineInteractionTarget } from '@/engine/npc'
import type { AssetDef, FloorData, InteractConfig, NpcSimDot, NpcRole, NpcSimulationConfig, ObjectData, TileEdges } from '../types'
import { isNpcConfig, resolveInteractForTarget, resolveObjectDef } from '../types'
import { mergeNpcConfig } from '../store/npcDefault'

const SIMULATION_TICKS_PER_SECOND = NPC_ENGINE_TICKS_PER_SECOND

interface WalkableMap { tiles: Set<string>; width: number; height: number; cellSize: number }
interface InteractionSource {
	floorId: string
	itemId: string
	anchorId: string
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
function hasMatchingTag(tags: string[] | undefined, targetTags: string[]): boolean {
	if (!tags || targetTags.length === 0) return false
	const normalized = new Set(tags.map(tag => tag.trim().toLowerCase()))
	return targetTags.some(tag => normalized.has(tag.trim().toLowerCase()))
}
function getObjectTags(obj: ObjectData, getAssetTags?: (type: string) => string[] | undefined): string[] {
	return [...new Set([...(getAssetTags?.(obj.type) ?? []), ...(obj.customProps?.tags ?? []), obj.type, ...(obj.label ? [obj.label] : [])])]
}
function getRoomTags(room: FloorData['rooms'][number]): string[] {
	return getRoomTagsShared(room.roomType, room.tags)
}
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
		const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type))
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
	for (const room of floor.rooms) if (px >= room.x && px < room.x + room.w && py >= room.y && py < room.y + room.h && room.walkable === false) return false
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
			if (!floor.objects.some(obj => { const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type)); return getTileEdge(obj, def, x, y, map.cellSize, side) === true || getTileEdge(obj, def, nx, ny, map.cellSize, side === 'right' ? 'left' : 'top') === true })) continue
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
	for (const obj of floor.objects) mark(obj.x, obj.y, obj.w, obj.h, getObjectTags(obj, getAssetTags)); for (const room of floor.rooms) mark(room.x, room.y, room.w, room.h, getRoomTags(room))
	return { ...map, tiles: new Set([...map.tiles].filter(key => !forbidden.has(key))) }
}
function focusTags(config: NpcSimulationConfig, role: NpcRole): string[] { return [...new Set([...role.focusTags, ...role.taskIds.flatMap(id => config.tasks.find(task => task.id === id)?.tags ?? [])])] }
function makeInteractionTargets(floor: FloorData, map: WalkableMap, getAssetTags?: (type: string) => string[] | undefined, getAssetDef?: (type: string) => AssetDef | undefined): InteractionSource[] {
	const output: InteractionSource[] = []
	const add = (itemId: string, x: number, y: number, tags: string[], anchors: { x: number; y: number }[] | undefined, interact?: InteractConfig) => { if (!anchors?.length) return; anchors.forEach((anchor, index) => { const tx = pixelToCell(x + anchor.x, map.cellSize), ty = pixelToCell(y + anchor.y, map.cellSize); const nearest = map.tiles.has(tileKey(tx, ty)) ? tileKey(tx, ty) : findNearestWalkable(map, tx, ty, 5); if (!nearest) return; const [cellX, cellY] = nearest.split(',').map(Number); const resolved = resolveInteractForTarget(interact, anchors.length); output.push({ floorId: floor.id, itemId, anchorId: `${itemId}:${index}`, x: cellX, y: cellY, tags, capacity: resolved.capacity, durationMinSeconds: resolved.durationMinSeconds, durationMaxSeconds: resolved.durationMaxSeconds }) }) }

	for (const obj of floor.objects) {
		if (getObjectTags(obj, getAssetTags).includes('portal')) continue
		const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type))
		add(`object:${obj.id}`, obj.x, obj.y, getObjectTags(obj, getAssetTags), def.anchorPoints, def.interact)
	}
	for (const room of floor.rooms) add(`room:${room.id}`, room.x, room.y, getRoomTags(room), room.anchorPoints, room.interact)
	return output
}

function portalEndpointKey(floorId: string, itemId: string, anchorIndex: number): string {
	return `${floorId}:${itemId}:endpoint:${anchorIndex}`
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
		const def = resolveObjectDef(obj.rotation, getAssetDef?.(obj.type))
		const anchors = def.anchorPoints
		if (!anchors?.length) continue
		const otherPortalFloors = [...portalFloorIds].filter(fid => fid !== floor.id)

		anchors.forEach((anchor, anchorIdx) => {
			const rawX = pixelToCell(obj.x + anchor.x, map.cellSize)
			const rawY = pixelToCell(obj.y + anchor.y, map.cellSize)
			const nearest = map.tiles.has(tileKey(rawX, rawY))
				? tileKey(rawX, rawY)
				: findNearestWalkable(map, rawX, rawY, 5)
			if (!nearest) return
			const [cellX, cellY] = nearest.split(',').map(Number)
			const endpointKey = portalEndpointKey(floor.id, `portal:${obj.id}`, anchorIdx)

			for (const destFloorId of otherPortalFloors) {
				const destPortal = portals.find(p => p.floor.id === destFloorId)
				if (!destPortal) continue
				const destAnchorIdx = anchorIdx
				const destEndpointKey = portalEndpointKey(destFloorId, `portal:${destPortal.obj.id}`, destAnchorIdx)

				output.push({
					floorId: floor.id,
					itemId: `portal:${obj.id}`,
					anchorId: `portal:${anchorIdx}→${destFloorId}`,
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

export function useNpcSimulation(
	getConfig?: () => NpcSimulationConfig | undefined,
	getFloor?: () => FloorData | undefined,
	getCanvas?: () => { w: number; h: number; tileSize: number },
	getFloorById?: (id: string) => FloorData | undefined,
	getAllFloors?: () => FloorData[],
	getAssetTags?: (type: string) => string[] | undefined,
	getAssetDef?: (type: string) => AssetDef | undefined,
): { npcs: Ref<NpcSimDot[]>; deploy: (floorId?: string) => void; start: () => void; stop: () => void; pause: () => void; resume: () => void; reset: () => void; isPaused: Ref<boolean>; simSpeed: Ref<number>; config: Ref<NpcSimulationConfig> } {
	const npcs = ref<NpcSimDot[]>([]), isPaused = ref(false), simSpeed = ref(1), config = ref<NpcSimulationConfig>({ speed: 1 / 30, defaultRoleId: '', roles: [], tasks: [], pool: [] })
	let animationId: number | null = null, engine: NpcEngine | null = null, deployedFloorId: string | null = null, deploymentActive = false, nextId = 1
	let floorMaps = new Map<string, WalkableMap>()
	let floorDataMap = new Map<string, FloorData>()
	const wanderMemory = new WanderMemory()
	const targetLastSelectedTick = new Map<string, number>()
	let currentCanvas: { w: number; h: number; tileSize: number } | null = null
	let currentViewFloorId: string | null = null
	let currentInteractionTargets = new Map<string, InteractionSource>()
	const visualById = new Map<string, { type: string; color: string }>()

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
			npc.pauseTimer = agent.status === 'interacting' || agent.status === 'waiting' ? agent.interactionRemainingTicks : 0
			npc.interactTargetKey = agent.reservationItemId
			npc.interactAnchorKey = agent.reservationAnchorId
			const target = agent.reservationItemId && agent.reservationAnchorId ? currentInteractionTargets.get(`${agent.floorId}:${agent.reservationItemId}:${agent.reservationAnchorId}`) : undefined
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

		currentInteractionTargets = new Map(allSources.map(source => [`${source.floorId}:${source.itemId}:${source.anchorId}`, source]))
		const layout: NpcEngineLayout = { floors: engineFloors, interactionTargets: allSources }

		const triggerRates = config.value.tagTriggerRates ?? {}
		const hasTriggerRates = Object.keys(triggerRates).length > 0
		const tickRate = SIMULATION_TICKS_PER_SECOND * 60
		engine = new NpcEngine(layout, {
			ticksPerSecond: SIMULATION_TICKS_PER_SECOND, agentClearance: 0.5, targetSelector: (agent, targets) => {
				const role = getRole(config.value, agent.roleId ?? '')
				if (!role) return null
				const tags = focusTags(config.value, role)
				if (!tags.length) return null
				const map = floorMaps.get(agent.floorId)
				const floor = floorDataMap.get(agent.floorId)
				if (!map || !floor) return null
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				if (!hasTriggerRates) {
					if (role.focusChance <= 0 || Math.random() * 100 >= role.focusChance) return null
					const matching = targets.filter(target => hasMatchingTag(target.tags as string[], tags) && roleMap.tiles.has(tileKey(target.x, target.y)))
					if (!matching.length) return null
					const selected = selectBestTarget({ agent, targets: matching, currentTick: engine!.tickNumber, targetLastSelectedTick })
					if (selected) targetLastSelectedTick.set(`${selected.floorId}:${selected.itemId}:${selected.anchorId}`, engine!.tickNumber)
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
				const selected = selectBestTarget({ agent, targets: matching, currentTick: engine!.tickNumber, targetLastSelectedTick })
				if (selected) targetLastSelectedTick.set(`${selected.floorId}:${selected.itemId}:${selected.anchorId}`, engine!.tickNumber)
				return selected
			}, crossFloorSelector: (agent, candidates, floors) => {
				const role = getRole(config.value, agent.roleId ?? '')
				if (!role) return null
				const tags = focusTags(config.value, role)
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
				const selected = wanderMemory.selectWanderTile(candidates, agent)
				if (selected) wanderMemory.recordVisit(selected, engine!.tickNumber)
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
		visualById.clear(); npcs.value = []; const occupiedSpawnKeys = new Set<string>(); let spawnCursor = 0
		for (const entry of config.value.pool) {
			const role = getRole(config.value, entry.roleId)
			if (!role) continue
			const count = Math.max(0, Math.min(100, Math.floor(entry.count || 0)))
			// Spawn NPCs across all floors that allow this role.
			for (const floor of allFloors) {
				if (!isRoleAllowedOnFloor(role.id, floor.id)) continue
				const map = floorMaps.get(floor.id)
				if (!map) continue
				const roleMap = getRoleMap(map, floor, role, getAssetTags)
				const keys = [...roleMap.tiles]
				if (!keys.length) continue
				for (let i = 0; i < count; i++) {
					const availableSpawnKeys = keys.filter(key => !occupiedSpawnKeys.has(`${floor.id}:${key}`))
					if (!availableSpawnKeys.length) break
					const spawnKey = availableSpawnKeys[(spawnCursor + i) % availableSpawnKeys.length]
					occupiedSpawnKeys.add(`${floor.id}:${spawnKey}`)
					const [x, y] = spawnKey.split(',').map(Number)
					const id = `npc-sim-${nextId++}`, oldSpeed = Math.max(0.01, config.value.speed || 1 / 30) + (Math.random() - 0.5) * 0.02
					engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: oldSpeed * SIMULATION_TICKS_PER_SECOND / map.cellSize })
					if (floor.id === currentViewFloorId) {
						npcs.value.push({ id, floorId: floor.id, type: role.id, x: cellToPixel(x, map.cellSize), y: cellToPixel(y, map.cellSize), targetX: cellToPixel(x, map.cellSize), targetY: cellToPixel(y, map.cellSize), speed: oldSpeed, roomId: null, color: role.color, pauseTimer: 0, pathIdx: 0, path: [], interactTargetKey: null, interactAnchorKey: null, interactDurationMin: 0, interactDurationMax: 0 })
					}
					visualById.set(id, { type: role.id, color: role.color })
				}
				spawnCursor = (spawnCursor + count) % keys.length
			}
		}
		syncAgents()
	}
	function frame(): void { if (!isPaused.value && engine) { const steps = Math.max(1, Math.min(8, simSpeed.value)); for (let i = 0; i < steps; i++) { engine.tick(); } syncAgents(); engine.drainEvents() } animationId = window.requestAnimationFrame(frame) }
	function start(): void { if (animationId === null) animationId = window.requestAnimationFrame(frame) }
	function stopLoop(): void { if (animationId !== null) window.cancelAnimationFrame(animationId); animationId = null; isPaused.value = false }
	function reset(): void { stopLoop(); engine = null; floorMaps = new Map(); floorDataMap = new Map(); currentCanvas = null; currentViewFloorId = null; currentInteractionTargets.clear(); deployedFloorId = null; deploymentActive = false; visualById.clear(); npcs.value = []; wanderMemory.clear(); targetLastSelectedTick.clear() }
	function deploy(floorId?: string): void {
		const canvas = getCanvas?.()
		const floor = floorId && getFloorById ? getFloorById(floorId) : getFloor?.()
		if (!canvas || !floor) return
		const allFloors = getAllFloors?.() ?? (floor ? [floor] : [])
		if (!allFloors.length) return
		stopLoop(); deploymentActive = true; deployedFloorId = floor.id; currentViewFloorId = floor.id; buildEngine(allFloors, canvas); start()
	}
	function syncConfig(): void { const value = getConfig?.(); if (value && isNpcConfig(value)) { config.value = mergeNpcConfig(deepClone(value)); if (deploymentActive && currentCanvas) { const allFloors = getAllFloors?.() ?? []; if (allFloors.length) buildEngine(allFloors, currentCanvas) } } }
	syncConfig(); onUnmounted(stopLoop)
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
		if (deploymentActive && floor && floor.id === currentViewFloorId && currentCanvas) {
			const allFloors = getAllFloors?.() ?? (floor ? [floor] : [])
			if (allFloors.length) buildEngine(allFloors, currentCanvas)
		}
	}, { deep: true })
	watch(() => getCanvas?.(), canvas => { if (deploymentActive && canvas) { const allFloors = getAllFloors?.() ?? []; if (allFloors.length) buildEngine(allFloors, canvas) } }, { deep: true })
	watch(() => config.value.speed, speed => {
		for (const npc of npcs.value) npc.speed = speed
		if (deploymentActive && currentCanvas) { const allFloors = getAllFloors?.() ?? []; if (allFloors.length) buildEngine(allFloors, currentCanvas) }
	})
	return { npcs, deploy, start, stop: () => { deploymentActive = false; deployedFloorId = null; stopLoop() }, pause: () => { isPaused.value = true }, resume: () => { isPaused.value = false }, reset, isPaused, simSpeed, config }
}
