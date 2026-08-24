import type { NpcEngineFloor, NpcEnginePoint } from './types'

const SQRT2 = Math.SQRT2

function key(point: NpcEnginePoint): string {
	return `${point.x},${point.y}`
}

function octileDistance(ax: number, ay: number, bx: number, by: number): number {
	const dx = Math.abs(ax - bx)
	const dy = Math.abs(ay - by)
	return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy)
}

interface FloorIndex {
	width: number
	height: number
	count: number
	idOf: Map<string, number>
	xs: Int32Array
	ys: Int32Array
	walkGrid: Int32Array
	blocked: Set<number> | null
	gScore: Float64Array
	parent: Int32Array
	stamp: Int32Array
	transientMark: Uint8Array
	lastTransientCells: number[]
	searchGen: number
	heapNode: number[]
	heapG: number[]
	heapF: number[]
}

const floorIndexCache = new WeakMap<NpcEngineFloor, FloorIndex>()

function resolveFloorIndex(floor: NpcEngineFloor): FloorIndex {
	let index = floorIndexCache.get(floor)
	if (!index) {
		const width = floor.width
		const height = floor.height
		const count = floor.walkable.length
		const idOf = new Map<string, number>()
		const xs = new Int32Array(count)
		const ys = new Int32Array(count)
		const walkGrid = new Int32Array(width * height)
		for (let i = 0; i < count; i++) {
			const x = Math.floor(floor.walkable[i].x)
			const y = Math.floor(floor.walkable[i].y)
			xs[i] = x
			ys[i] = y
			idOf.set(`${x},${y}`, i)
			walkGrid[y * width + x] = i + 1
		}
		let blocked: Set<number> | null = null
		if ((floor.blockedEdges?.length ?? 0) > 0) {
			blocked = new Set<number>()
			for (const edge of floor.blockedEdges!) {
				const fromId = idOf.get(key(edge.from))
				const toId = idOf.get(key(edge.to))
				if (fromId === undefined || toId === undefined) continue
				blocked.add(fromId * count + toId)
				blocked.add(toId * count + fromId)
			}
		}
		index = {
			width,
			height,
			count,
			idOf,
			xs,
			ys,
			walkGrid,
			blocked,
			gScore: new Float64Array(count),
			parent: new Int32Array(count),
			stamp: new Int32Array(count),
			transientMark: new Uint8Array(width * height),
			lastTransientCells: [],
			searchGen: 0,
			heapNode: [],
			heapG: [],
			heapF: [],
		}
		floorIndexCache.set(floor, index)
	}
	return index
}

export function findNpcGridPath(
	floor: NpcEngineFloor,
	from: NpcEnginePoint,
	to: NpcEnginePoint,
	blockedCells?: ReadonlySet<string>,
): NpcEnginePoint[] {
	const idx = resolveFloorIndex(floor)
	const { width, height, count, xs, ys, walkGrid } = idx

	const startX = Math.floor(from.x)
	const startY = Math.floor(from.y)
	const goalX = Math.floor(to.x)
	const goalY = Math.floor(to.y)
	if (startX < 0 || startY < 0 || startX >= width || startY >= height) return []
	if (goalX < 0 || goalY < 0 || goalX >= width || goalY >= height) return []
	const startCell = startY * width + startX
	const goalCell = goalY * width + goalX
	const startId = walkGrid[startCell] - 1
	const goalId = walkGrid[goalCell] - 1
	if (startId < 0 || goalId < 0) return []
	if (startId === goalId) return [{ x: startX, y: startY }]

	idx.searchGen++
	const searchGen = idx.searchGen
	const { gScore, parent, stamp } = idx

	const transientMark = idx.transientMark
	const lastTransientCells = idx.lastTransientCells
	for (let i = 0; i < lastTransientCells.length; i++) transientMark[lastTransientCells[i]] = 0
	lastTransientCells.length = 0
	if (blockedCells && blockedCells.size > 0) {
		for (const cellKeyStr of blockedCells) {
			const comma = cellKeyStr.indexOf(',')
			const x = Number(cellKeyStr.slice(0, comma))
			const y = Number(cellKeyStr.slice(comma + 1))
			if (!Number.isFinite(x) || !Number.isFinite(y)) continue
			if (x < 0 || y < 0 || x >= width || y >= height) continue
			const cell = y * width + x
			transientMark[cell] = 1
			lastTransientCells.push(cell)
		}
	}

	const blocked = idx.blocked
	const count_ = count
	const isBlockedEdge = (fromId: number, toId: number): boolean =>
		blocked !== null && blocked.has(fromId * count_ + toId)

	const heapNode = idx.heapNode
	const heapG = idx.heapG
	const heapF = idx.heapF
	heapNode.length = 0
	heapG.length = 0
	heapF.length = 0

	let poppedNode = 0
	let poppedG = 0
	const push = (node: number, g: number, f: number): void => {
		let index = heapNode.length
		heapNode.push(node)
		heapG.push(g)
		heapF.push(f)
		while (index > 0) {
			const parentIndex = (index - 1) >> 1
			if (heapF[parentIndex] <= heapF[index]) break
			const tNode = heapNode[parentIndex]; heapNode[parentIndex] = heapNode[index]; heapNode[index] = tNode
			const tG = heapG[parentIndex]; heapG[parentIndex] = heapG[index]; heapG[index] = tG
			const tF = heapF[parentIndex]; heapF[parentIndex] = heapF[index]; heapF[index] = tF
			index = parentIndex
		}
	}
	const pop = (): void => {
		poppedNode = heapNode[0]
		poppedG = heapG[0]
		const lastNode = heapNode.pop()!
		const lastG = heapG.pop()!
		const lastF = heapF.pop()!
		if (heapNode.length > 0) {
			heapNode[0] = lastNode
			heapG[0] = lastG
			heapF[0] = lastF
			let index = 0
			while (true) {
				const left = index * 2 + 1
				const right = left + 1
				let smallest = index
				if (left < heapNode.length && heapF[left] < heapF[smallest]) smallest = left
				if (right < heapNode.length && heapF[right] < heapF[smallest]) smallest = right
				if (smallest === index) break
				const tNode = heapNode[smallest]; heapNode[smallest] = heapNode[index]; heapNode[index] = tNode
				const tG = heapG[smallest]; heapG[smallest] = heapG[index]; heapG[index] = tG
				const tF = heapF[smallest]; heapF[smallest] = heapF[index]; heapF[index] = tF
				index = smallest
			}
		}
	}

	const bestG = (node: number): number => (stamp[node] === searchGen ? gScore[node] : Infinity)

	push(startId, 0, octileDistance(startX, startY, goalX, goalY))
	gScore[startId] = 0
	parent[startId] = -1
	stamp[startId] = searchGen

	const maxIterations = Math.max(1000, count * 2)
	let iterations = 0

	while (++iterations <= maxIterations) {
		if (heapNode.length === 0) break
		pop()
		const currentNode = poppedNode
		const currentG = poppedG
		if (currentG !== bestG(currentNode)) continue
		if (currentNode === goalId) {
			const path: NpcEnginePoint[] = []
			let cursor = currentNode
			while (cursor !== -1) {
				path.unshift({ x: xs[cursor], y: ys[cursor] })
				cursor = parent[cursor]
			}
			return path
		}

		const cx = xs[currentNode]
		const cy = ys[currentNode]

		for (let d = 0; d < 4; d++) {
			const nx = cx + CARDINAL_DX[d]
			const ny = cy + CARDINAL_DY[d]
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
			const nextId = walkGrid[ny * width + nx] - 1
			if (nextId < 0) continue
			if (isBlockedEdge(currentNode, nextId)) continue
			if (transientMark[ny * width + nx] !== 0) continue
			const nextScore = currentG + 1
			if (nextScore >= bestG(nextId)) continue
			parent[nextId] = currentNode
			stamp[nextId] = searchGen
			gScore[nextId] = nextScore
			push(nextId, nextScore, nextScore + octileDistance(nx, ny, goalX, goalY))
		}

		for (let d = 0; d < 4; d++) {
			const dx = DIAGONAL_DX[d]
			const dy = DIAGONAL_DY[d]
			const nx = cx + dx
			const ny = cy + dy
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
			const s1x = cx + dx
			const s1y = cy
			const s2x = cx
			const s2y = cy + dy
			const side1 = walkGrid[s1y * width + s1x] - 1
			const side2 = walkGrid[s2y * width + s2x] - 1
			if (side1 < 0 || side2 < 0) continue
			const nextId = walkGrid[ny * width + nx] - 1
			if (nextId < 0) continue
			if (isBlockedEdge(currentNode, nextId)) continue
			if (isBlockedEdge(currentNode, side1) || isBlockedEdge(currentNode, side2)) continue
			if (isBlockedEdge(side1, nextId) || isBlockedEdge(side2, nextId)) continue
			if (transientMark[s1y * width + s1x] !== 0 || transientMark[s2y * width + s2x] !== 0) continue
			if (transientMark[ny * width + nx] !== 0) continue
			const nextScore = currentG + SQRT2
			if (nextScore >= bestG(nextId)) continue
			parent[nextId] = currentNode
			stamp[nextId] = searchGen
			gScore[nextId] = nextScore
			push(nextId, nextScore, nextScore + octileDistance(nx, ny, goalX, goalY))
		}
	}
	return []
}

const CARDINAL_DX = [1, -1, 0, 0]
const CARDINAL_DY = [0, 0, 1, -1]
const DIAGONAL_DX = [1, 1, -1, -1]
const DIAGONAL_DY = [1, -1, 1, -1]
