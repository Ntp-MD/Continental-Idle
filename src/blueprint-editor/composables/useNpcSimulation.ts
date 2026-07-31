import { ref, watch, type Ref } from 'vue'
import type { FloorData, NpcSimDot, NpcRole, NpcTask, NpcSimulationConfig, ObjectData, TileEdges } from '../types'
import { isNpcConfig } from '../types'
import { getDefaultNpcConfig, mergeNpcConfig } from '../store/npc'

const npcs = ref<NpcSimDot[]>([])
let animationId: number | null = null
const isPausedRef = ref(false)
let nextId = 1

function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value))
}

function cellSizeOf(tileSize: number): number {
	return Math.max(1, Math.round(tileSize) || 1)
}

function pixelToCell(value: number, tileSize: number): number {
	return Math.floor(value / cellSizeOf(tileSize))
}

function cellToPixel(value: number, tileSize: number): number {
	return (value + 0.5) * cellSizeOf(tileSize)
}

function isTileWalkable(floor: FloorData, canvasW: number, canvasH: number, tileSize: number, tx: number, ty: number): boolean {
	const size = cellSizeOf(tileSize)
	const maxW = Math.ceil(canvasW / size)
	const maxH = Math.ceil(canvasH / size)
	if (tx < 0 || ty < 0 || tx >= maxW || ty >= maxH) return false
	const px = cellToPixel(tx, size)
	const py = cellToPixel(ty, size)
	const defaultWalk = floor.defaultWalkable ?? true

	for (const obj of floor.objects) {
		if (px < obj.x || px >= obj.x + obj.w || py < obj.y || py >= obj.y + obj.h) continue
		const localX = Math.max(0, Math.min(obj.w - 0.001, px - obj.x))
		const localY = Math.max(0, Math.min(obj.h - 0.001, py - obj.y))
		let isEntrance = false
		if (obj.tileStates?.length) {
			const rows = obj.tileStates.length
			const cols = obj.tileStates[0]?.length ?? 0
			const row = Math.min(rows - 1, Math.floor(localY * rows / Math.max(1, obj.h)))
			const col = Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, obj.w)))
			isEntrance = obj.tileStates[row]?.[col] === 'entrance'
			const isBoundary = row === 0 || row === rows - 1 || col === 0 || col === cols - 1
			if (!obj.tileEdges && obj.entranceRequired && isBoundary && !isEntrance) return false
		}
		if (obj.walkable === false && !isEntrance) return false
		if (obj.walkableGrid?.length && !isEntrance) {
			const row = Math.min(obj.walkableGrid.length - 1, Math.floor(localY * obj.walkableGrid.length / Math.max(1, obj.h)))
			const cols = obj.walkableGrid[row]?.length ?? 0
			if (cols > 0) {
				const col = Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, obj.w)))
				if (obj.walkableGrid[row][col] === false) return false
			}
		}
	}

	for (const room of floor.rooms) {
		if (px < room.x || px >= room.x + room.w || py < room.y || py >= room.y + room.h) continue
		if (room.walkable === false) return false
	}
	return defaultWalk
}

function getTileEdge(obj: ObjectData, tx: number, ty: number, tileSize: number, side: keyof TileEdges): boolean | undefined {
	if (!obj.tileEdges?.length) return undefined
	const px = cellToPixel(tx, tileSize)
	const py = cellToPixel(ty, tileSize)
	if (px < obj.x || px >= obj.x + obj.w || py < obj.y || py >= obj.y + obj.h) return undefined
	const localX = Math.max(0, Math.min(obj.w - 0.001, px - obj.x))
	const localY = Math.max(0, Math.min(obj.h - 0.001, py - obj.y))
	const rows = obj.tileEdges.length
	const row = Math.min(rows - 1, Math.floor(localY * rows / Math.max(1, obj.h)))
	const cols = obj.tileEdges[row]?.length ?? 0
	if (cols === 0) return undefined
	const col = Math.min(cols - 1, Math.floor(localX * cols / Math.max(1, obj.w)))
	return obj.tileEdges[row][col]?.[side]
}

function sideForDirection(dx: number, dy: number): keyof TileEdges {
	if (dx > 0) return 'right'
	if (dx < 0) return 'left'
	if (dy > 0) return 'bottom'
	return 'top'
}

function oppositeSide(side: keyof TileEdges): keyof TileEdges {
	switch (side) {
		case 'top': return 'bottom'
		case 'bottom': return 'top'
		case 'left': return 'right'
		case 'right': return 'left'
	}
}

function canMoveBetween(floor: FloorData, canvasW: number, canvasH: number, tileSize: number, x1: number, y1: number, x2: number, y2: number): boolean {
	if (!isTileWalkable(floor, canvasW, canvasH, tileSize, x2, y2)) return false
	const dx = x2 - x1
	const dy = y2 - y1
	if ((Math.abs(dx) + Math.abs(dy)) !== 1) return true
	const side = sideForDirection(dx, dy)
	const opp = oppositeSide(side)

	for (const obj of floor.objects) {
		if (getTileEdge(obj, x1, y1, tileSize, side) === true) return false
		if (getTileEdge(obj, x2, y2, tileSize, opp) === true) return false
	}
	return true
}

interface WalkableMap {
	tiles: Set<string>
	width: number
	height: number
	cellSize: number
}

function tileKey(x: number, y: number): string {
	return x + ',' + y
}

function buildWalkableMap(floor: FloorData, canvasW: number, canvasH: number, tileSize: number): WalkableMap {
	const size = cellSizeOf(tileSize)
	const width = Math.max(0, Math.ceil(canvasW / size))
	const height = Math.max(0, Math.ceil(canvasH / size))
	const tiles = new Set<string>()
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (isTileWalkable(floor, canvasW, canvasH, size, x, y)) tiles.add(tileKey(x, y))
		}
	}
	return { tiles, width, height, cellSize: size }
}

function pickRandomTile(map: WalkableMap): [number, number] {
	if (map.tiles.size === 0) return [0, 0]
	const index = Math.floor(Math.random() * map.tiles.size)
	let current = 0
	for (const key of map.tiles) {
		if (current++ === index) return key.split(',').map(Number) as [number, number]
	}
	return [0, 0]
}

const DIRS: [number, number][] = [
	[1, 0], [-1, 0], [0, 1], [0, -1],
]

const MAX_PATH_ITERATIONS = 5000

class BinaryMinHeap {
	private heap: { node: string; g: number; f: number }[] = []

	push(node: string, g: number, f: number): void {
		this.heap.push({ node, g, f })
		let i = this.heap.length - 1
		while (i > 0) {
			const p = (i - 1) >> 1
			if (this.heap[p].f <= this.heap[i].f) break
			const t = this.heap[p]
			this.heap[p] = this.heap[i]
			this.heap[i] = t
			i = p
		}
	}

	pop(): { node: string; g: number; f: number } | undefined {
		if (this.heap.length === 0) return undefined
		const out = this.heap[0]
		const last = this.heap.pop()!
		if (this.heap.length > 0) {
			this.heap[0] = last
			let i = 0
			while (true) {
				const l = (i << 1) + 1
				const r = (i << 1) + 2
				let smallest = i
				if (l < this.heap.length && this.heap[l].f < this.heap[smallest].f) smallest = l
				if (r < this.heap.length && this.heap[r].f < this.heap[smallest].f) smallest = r
				if (smallest === i) break
				const t = this.heap[i]
				this.heap[i] = this.heap[smallest]
				this.heap[smallest] = t
				i = smallest
			}
		}
		return out
	}
}

function findPath(map: WalkableMap, floor: FloorData, canvasW: number, canvasH: number, sx: number, sy: number, tx: number, ty: number): [number, number][] {
	const start = tileKey(sx, sy)
	const goal = tileKey(tx, ty)
	if (!map.tiles.has(start) || !map.tiles.has(goal)) return []
	if (start === goal) return [[sx, sy]]

	const cameFrom = new Map<string, string>()
	const gScore = new Map<string, number>()
	const heap = new BinaryMinHeap()
	gScore.set(start, 0)
	heap.push(start, 0, Math.hypot(tx - sx, ty - sy))

	let iterations = 0
	while (true) {
		if (++iterations > MAX_PATH_ITERATIONS) return []
		const current = heap.pop()
		if (!current) break
		if (current.g !== gScore.get(current.node)) continue
		if (current.node === goal) {
			const path: [number, number][] = []
			let c: string | undefined = current.node
			while (c) {
				const [cx, cy] = c.split(',').map(Number)
				path.unshift([cx, cy])
				c = cameFrom.get(c)
			}
			return path
		}
		const [cx, cy] = current.node.split(',').map(Number)
		const ng = current.g + 1
		for (const [dx, dy] of DIRS) {
			const nx = cx + dx
			const ny = cy + dy
			const nk = tileKey(nx, ny)
			if (!map.tiles.has(nk)) continue
			if (!canMoveBetween(floor, canvasW, canvasH, map.cellSize, cx, cy, nx, ny)) continue
			if (ng < (gScore.get(nk) ?? Infinity)) {
				cameFrom.set(nk, current.node)
				gScore.set(nk, ng)
				heap.push(nk, ng, ng + Math.hypot(tx - nx, ty - ny))
			}
		}
	}
	return []
}

const ROOM_TYPE_TAGS: Record<string, string[]> = {
	reception: ['reception', 'guestRooms', 'vip'],
	guestRoom: ['guestRooms'],
	lounge: ['vip', 'guestRooms'],
	bar: ['bar'],
	kitchen: ['kitchen'],
	laundry: ['laundry', 'underground'],
	staffRoom: ['staffRoom', 'security'],
	armory: ['armory', 'security'],
	vault: ['vault', 'security'],
	safeHouse: ['safeHouse', 'security'],
	blackMarket: ['blackMarket', 'underground'],
	controlCenter: ['controlCenter', 'security'],
	datacenter: ['datacenter', 'intelNetwork'],
	loadingBay: ['loadingBay', 'underground'],
}

function hasMatchingTag(tags: string[] | undefined, targetTags: string[]): boolean {
	if (!tags || targetTags.length === 0) return false
	const normalized = new Set(tags.map(tag => tag.trim().toLowerCase()))
	return targetTags.some(tag => normalized.has(tag.trim().toLowerCase()))
}

function getObjectTags(obj: ObjectData, getAssetTags?: (type: string) => string[] | undefined): string[] {
	return [...new Set([
		...(getAssetTags?.(obj.type) ?? []),
		...(obj.customProps?.tags ?? []),
		obj.type,
		...(obj.label ? [obj.label] : []),
	])]
}

function getRoomTags(room: FloorData['rooms'][number]): string[] {
	const roomType = room.roomType ?? ''
	return [...new Set([
		...(room.tags ?? []),
		roomType,
		...(ROOM_TYPE_TAGS[roomType] ?? []),
	])]
}

function addTaggedEntityTiles(target: Set<string>, map: WalkableMap, x: number, y: number, w: number, h: number, tags: string[], targetTags: string[]): void {
	if (!hasMatchingTag(tags, targetTags)) return
	const minX = Math.max(0, pixelToCell(x, map.cellSize))
	const minY = Math.max(0, pixelToCell(y, map.cellSize))
	const maxX = Math.min(map.width, Math.ceil((x + w) / map.cellSize))
	const maxY = Math.min(map.height, Math.ceil((y + h) / map.cellSize))
	for (let ty = minY; ty < maxY; ty++) {
		for (let tx = minX; tx < maxX; tx++) {
			if (map.tiles.has(tileKey(tx, ty))) target.add(tileKey(tx, ty))
		}
	}
}

function addAnchoredEntityTiles(target: Set<string>, map: WalkableMap, x: number, y: number, w: number, h: number, tags: string[], targetTags: string[], anchorPoints?: [number, number][]): void {
	if (!hasMatchingTag(tags, targetTags)) return
	if (anchorPoints && anchorPoints.length > 0) {
		for (const [ax, ay] of anchorPoints) {
			const tx = pixelToCell(x + ax, map.cellSize)
			const ty = pixelToCell(y + ay, map.cellSize)
			if (map.tiles.has(tileKey(tx, ty))) {
				target.add(tileKey(tx, ty))
			} else {
				const nearby = findNearestWalkable(map, tx, ty, 5)
				if (nearby) target.add(nearby)
			}
		}
	} else {
		addTaggedEntityTiles(target, map, x, y, w, h, tags, targetTags)
	}
}

function findNearestWalkable(map: WalkableMap, x: number, y: number, radius: number): string | null {
	for (let r = 1; r <= radius; r++) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
				const key = tileKey(x + dx, y + dy)
				if (map.tiles.has(key)) return key
			}
		}
	}
	return null
}

function findTaggedWalkableTiles(floor: FloorData, map: WalkableMap, targetTags: string[], getAssetTags?: (type: string) => string[] | undefined): Set<string> {
	const target = new Set<string>()
	for (const obj of floor.objects) {
		const tags = getObjectTags(obj, getAssetTags)
		addAnchoredEntityTiles(target, map, obj.x, obj.y, obj.w, obj.h, tags, targetTags, obj.anchorPoints)
	}
	for (const room of floor.rooms) {
		addAnchoredEntityTiles(target, map, room.x, room.y, room.w, room.h, getRoomTags(room), targetTags, room.anchorPoints)
	}
	for (const zone of floor.zones ?? []) {
		addTaggedEntityTiles(target, map, zone.x, zone.y, zone.w, zone.h, zone.tags ?? [], targetTags)
	}
	return target
}

function getRoleMap(map: WalkableMap, floor: FloorData, role: NpcRole, tasks: NpcTask[], getAssetTags?: (type: string) => string[] | undefined): WalkableMap {
	const restrictedTags = role.behavior.restrictedTaskIds.flatMap(id => tasks.find(t => t.id === id)?.tags ?? [])
	if (restrictedTags.length === 0) return map
	const forbidden = new Set<string>()
	for (const obj of floor.objects) {
		const tags = getObjectTags(obj, getAssetTags)
		addTaggedEntityTiles(forbidden, map, obj.x, obj.y, obj.w, obj.h, tags, restrictedTags)
	}
	for (const room of floor.rooms) {
		addTaggedEntityTiles(forbidden, map, room.x, room.y, room.w, room.h, getRoomTags(room), restrictedTags)
	}
	for (const zone of floor.zones ?? []) {
		addTaggedEntityTiles(forbidden, map, zone.x, zone.y, zone.w, zone.h, zone.tags ?? [], restrictedTags)
	}
	const allowed = new Set<string>()
	for (const k of map.tiles) {
		if (!forbidden.has(k)) allowed.add(k)
	}
	return { ...map, tiles: allowed }
}

function getRole(config: NpcSimulationConfig, roleId: string): NpcRole | undefined {
	return config.roles.find(r => r.id === roleId) ?? config.roles.find(r => r.id === config.defaultRoleId) ?? config.roles[0]
}

function chooseTarget(npc: NpcSimDot, floor: FloorData, map: WalkableMap, canvasW: number, canvasH: number, config: NpcSimulationConfig, getAssetTags?: (type: string) => string[] | undefined): void {
	const curTx = pixelToCell(npc.x, map.cellSize)
	const curTy = pixelToCell(npc.y, map.cellSize)

	const role = getRole(config, npc.type)
	if (!role) return
	const roleMap = getRoleMap(map, floor, role, config.tasks, getAssetTags)
	const targetTiles = new Set<string>()

	const focusTask = role.behavior.focusTaskId ? config.tasks.find(t => t.id === role.behavior.focusTaskId) : undefined
	const focusChance = role.behavior.focusChance ?? 0
	if (focusTask && focusTask.tags.length > 0 && focusChance > 0 && Math.random() * 100 < focusChance) {
		const tiles = findTaggedWalkableTiles(floor, roleMap, focusTask.tags, getAssetTags)
		for (const t of tiles) targetTiles.add(t)
	}

	const useTaggedTarget = targetTiles.size > 0
	const targetMap = useTaggedTarget ? { ...roleMap, tiles: targetTiles } : roleMap
	const [tx, ty] = pickRandomTile(targetMap)
	let path = findPath(roleMap, floor, canvasW, canvasH, curTx, curTy, tx, ty)
	if (path.length === 0 && useTaggedTarget) {
		const [rx, ry] = pickRandomTile(roleMap)
		path = findPath(roleMap, floor, canvasW, canvasH, curTx, curTy, rx, ry)
	}
	if (path.length === 0) return
	npc.path = path.map(([x, y]) => [cellToPixel(x, map.cellSize), cellToPixel(y, map.cellSize)] as [number, number])
	npc.pathIdx = 0
	npc.targetX = npc.path[0][0]
	npc.targetY = npc.path[0][1]
}

function tick(floor: FloorData, map: WalkableMap, canvasW: number, canvasH: number, config: NpcSimulationConfig, getAssetTags?: (type: string) => string[] | undefined): void {
	const floorId = floor.id
	if (map.tiles.size === 0) return
	for (const npc of npcs.value) {
		if (npc.floorId !== floorId) continue
		if (npc.pauseTimer > 0) {
			npc.pauseTimer--
			continue
		}
		if (npc.path.length === 0) {
			chooseTarget(npc, floor, map, canvasW, canvasH, config, getAssetTags)
			continue
		}
		const dx = npc.targetX - npc.x
		const dy = npc.targetY - npc.y
		const distance = Math.hypot(dx, dy)
		if (distance < 0.1) {
			npc.pathIdx++
			if (npc.pathIdx >= npc.path.length) {
				npc.pauseTimer = 30 + Math.floor(Math.random() * 90)
				chooseTarget(npc, floor, map, canvasW, canvasH, config, getAssetTags)
			} else {
				npc.targetX = npc.path[npc.pathIdx][0]
				npc.targetY = npc.path[npc.pathIdx][1]
			}
			continue
		}
		const step = Math.min(npc.speed, distance)
		npc.x += dx / distance * step
		npc.y += dy / distance * step
	}
}

let cachedMap: WalkableMap | null = null
let cachedFloorId: string | null = null
let cachedCanvasKey = ''

function getMap(floor: FloorData | undefined, canvasW: number, canvasH: number, tileSize: number): WalkableMap | null {
	if (!floor) return null
	const size = cellSizeOf(tileSize)
	const key = floor.id + ':' + canvasW + 'x' + canvasH + ':' + size
	if (cachedFloorId !== floor.id || cachedCanvasKey !== key) {
		cachedFloorId = floor.id
		cachedCanvasKey = key
		cachedMap = buildWalkableMap(floor, canvasW, canvasH, size)
	}
	return cachedMap
}

function start(getFloor: () => FloorData | undefined, getCanvas: () => { w: number; h: number; tileSize: number }, getConfig: () => NpcSimulationConfig, getAssetTags?: (type: string) => string[] | undefined): void {
	if (animationId !== null) return
	const loop = () => {
		if (!isPausedRef.value) {
			const floor = getFloor()
			const c = getCanvas()
			if (floor && c) {
				const map = getMap(floor, c.w, c.h, c.tileSize)
				if (map) tick(floor, map, c.w, c.h, getConfig(), getAssetTags)
			}
		}
		animationId = window.requestAnimationFrame(loop)
	}
	animationId = window.requestAnimationFrame(loop)
}

function stop(): void {
	if (animationId !== null) window.cancelAnimationFrame(animationId)
	animationId = null
	isPausedRef.value = false
}

function pause(): void {
	isPausedRef.value = true
}

function resume(): void {
	isPausedRef.value = false
}

function reset(): void {
	npcs.value = []
	cachedFloorId = null
	cachedMap = null
	isPausedRef.value = false
}

function spawnAll(floor: FloorData, canvasW: number, canvasH: number, tileSize: number, config: NpcSimulationConfig, getAssetTags?: (type: string) => string[] | undefined): void {
	npcs.value = []
	cachedFloorId = null
	const map = getMap(floor, canvasW, canvasH, tileSize)
	if (!map || map.tiles.size === 0) return
	let spawnCursor = 0

	for (const entry of config.pool) {
		const count = Math.max(0, Math.min(100, Math.floor(entry.count || 0)))
		if (count === 0) continue
		const role = getRole(config, entry.roleId)
		if (!role) continue
		const roleMap = getRoleMap(map, floor, role, config.tasks, getAssetTags)
		const spawnKeys = Array.from(roleMap.tiles)
		if (spawnKeys.length === 0) continue
		for (let i = 0; i < count; i++) {
			const index = (spawnCursor + Math.floor(i * spawnKeys.length / count)) % spawnKeys.length
			const [tx, ty] = spawnKeys[index].split(',').map(Number) as [number, number]
			const x = cellToPixel(tx, roleMap.cellSize)
			const y = cellToPixel(ty, roleMap.cellSize)
			const npc: NpcSimDot = {
				id: `npc-sim-${nextId++}`,
				floorId: floor.id,
				type: role.id,
				x,
				y,
				targetX: x,
				targetY: y,
				speed: Math.max(0.01, config.speed || 1 / 30) + (Math.random() - 0.5) * 0.02,
				roomId: null,
				color: role.color,
				pauseTimer: Math.floor(Math.random() * 60),
				pathIdx: 0,
				path: [[x, y]],
			}
			npcs.value.push(npc)
			chooseTarget(npc, floor, map, canvasW, canvasH, config, getAssetTags)
		}
		spawnCursor = (spawnCursor + count) % spawnKeys.length
	}
}

export function useNpcSimulation(
	getConfig?: () => NpcSimulationConfig | undefined,
	getFloor?: () => FloorData | undefined,
	getCanvas?: () => { w: number; h: number; tileSize: number },
	getFloorById?: (id: string) => FloorData | undefined,
	getAssetTags?: (type: string) => string[] | undefined,
): {
	npcs: Ref<NpcSimDot[]>
	deploy: (floorId?: string) => void
	start: () => void
	stop: () => void
	pause: () => void
	resume: () => void
	reset: () => void
	isPaused: Ref<boolean>
	config: Ref<NpcSimulationConfig>
} {
	const config = ref<NpcSimulationConfig>(getDefaultNpcConfig())

	function syncConfig() {
		const c = getConfig?.()
		if (c && isNpcConfig(c)) {
			config.value = mergeNpcConfig(deepClone(c))
		} else {
			config.value = getDefaultNpcConfig()
		}
	}

	let deployedFloorId: string | null = null
	let deploymentActive = false

	function deploy(floorId?: string): void {
		if (!getCanvas) return
		const c = getCanvas()
		const f = floorId && getFloorById ? getFloorById(floorId) : getFloor?.()
		if (!f || !c) return
		deploymentActive = true
		deployedFloorId = f.id
		stop()
		spawnAll(f, c.w, c.h, c.tileSize, config.value, getAssetTags)
		start(getFloor ?? (() => f), getCanvas, () => config.value, getAssetTags)
	}

	syncConfig()
	watch(() => getConfig?.(), syncConfig, { deep: false })

	watch(() => config.value.speed, (v) => {
		for (const npc of npcs.value) npc.speed = v
	})

	watch(() => getFloor?.()?.id, (floorId) => {
		cachedFloorId = null
		cachedCanvasKey = ''
		if (deploymentActive && deployedFloorId && floorId && floorId !== deployedFloorId) deploy(floorId)
	})

	function stopSimulation(): void {
		deploymentActive = false
		deployedFloorId = null
		stop()
	}

	return {
		npcs,
		deploy,
		start: () => {
			if (getFloor && getCanvas) start(getFloor, getCanvas, () => config.value, getAssetTags)
		},
		stop: stopSimulation,
		pause,
		resume,
		reset,
		isPaused: isPausedRef,
		config,
	}
}
