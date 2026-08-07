import type { NpcEngineFloor, NpcEnginePoint } from './types'

const CARDINAL_DIRECTIONS: readonly NpcEnginePoint[] = [
	{ x: 1, y: 0 },
	{ x: -1, y: 0 },
	{ x: 0, y: 1 },
	{ x: 0, y: -1 },
]

const DIAGONAL_DIRECTIONS: readonly NpcEnginePoint[] = [
	{ x: 1, y: 1 },
	{ x: 1, y: -1 },
	{ x: -1, y: 1 },
	{ x: -1, y: -1 },
]

const SQRT2 = Math.SQRT2

function key(point: NpcEnginePoint): string {
	return `${point.x},${point.y}`
}

function edgeKey(from: NpcEnginePoint, to: NpcEnginePoint): string {
	return `${key(from)}>${key(to)}`
}

class MinHeap {
	private values: { node: NpcEnginePoint; g: number; f: number }[] = []

	push(value: { node: NpcEnginePoint; g: number; f: number }): void {
		this.values.push(value)
		let index = this.values.length - 1
		while (index > 0) {
			const parent = (index - 1) >> 1
			if (this.values[parent].f <= this.values[index].f) break
				;[this.values[parent], this.values[index]] = [this.values[index], this.values[parent]]
			index = parent
		}
	}

	pop(): { node: NpcEnginePoint; g: number; f: number } | undefined {
		const first = this.values[0]
		const last = this.values.pop()
		if (this.values.length > 0 && last) {
			this.values[0] = last
			let index = 0
			while (true) {
				const left = index * 2 + 1
				const right = left + 1
				let smallest = index
				if (left < this.values.length && this.values[left].f < this.values[smallest].f) smallest = left
				if (right < this.values.length && this.values[right].f < this.values[smallest].f) smallest = right
				if (smallest === index) break
					;[this.values[index], this.values[smallest]] = [this.values[smallest], this.values[index]]
				index = smallest
			}
		}
		return first
	}
}

function octileDistance(a: NpcEnginePoint, b: NpcEnginePoint): number {
	const dx = Math.abs(a.x - b.x)
	const dy = Math.abs(a.y - b.y)
	return (dx + dy) + (SQRT2 - 2) * Math.min(dx, dy)
}

export function findNpcGridPath(
	floor: NpcEngineFloor,
	from: NpcEnginePoint,
	to: NpcEnginePoint,
	blockedCells?: ReadonlySet<string>,
): NpcEnginePoint[] {
	const walkable = new Set(floor.walkable.map(key))
	const start = { x: Math.floor(from.x), y: Math.floor(from.y) }
	const goal = { x: Math.floor(to.x), y: Math.floor(to.y) }
	if (!walkable.has(key(start)) || !walkable.has(key(goal))) return []
	if (key(start) === key(goal)) return [start]

	const blockedEdges = new Set((floor.blockedEdges ?? []).flatMap(edge => [edgeKey(edge.from, edge.to), edgeKey(edge.to, edge.from)]))
	const transientBlocked = blockedCells ?? new Set<string>()
	const cameFrom = new Map<string, string>()
	const scores = new Map<string, number>([[key(start), 0]])
	const heap = new MinHeap()
	heap.push({ node: start, g: 0, f: octileDistance(start, goal) })
	const maxIterations = Math.max(1000, walkable.size * 2)
	let iterations = 0

	while (++iterations <= maxIterations) {
		const current = heap.pop()
		if (!current) break
		const currentKey = key(current.node)
		if (current.g !== scores.get(currentKey)) continue
		if (currentKey === key(goal)) {
			const path: NpcEnginePoint[] = []
			let cursor: string | undefined = currentKey
			while (cursor) {
				const [x, y] = cursor.split(',').map(Number)
				path.unshift({ x, y })
				cursor = cameFrom.get(cursor)
			}
			return path
		}

		for (const direction of CARDINAL_DIRECTIONS) {
			const next = { x: current.node.x + direction.x, y: current.node.y + direction.y }
			const nextKey = key(next)
			if (!walkable.has(nextKey) || blockedEdges.has(edgeKey(current.node, next))) continue
			if (transientBlocked.has(nextKey)) continue
			const nextScore = current.g + 1
			if (nextScore >= (scores.get(nextKey) ?? Infinity)) continue
			cameFrom.set(nextKey, currentKey)
			scores.set(nextKey, nextScore)
			heap.push({ node: next, g: nextScore, f: nextScore + octileDistance(next, goal) })
		}

		for (const direction of DIAGONAL_DIRECTIONS) {
			const next = { x: current.node.x + direction.x, y: current.node.y + direction.y }
			const nextKey = key(next)
			if (!walkable.has(nextKey) || blockedEdges.has(edgeKey(current.node, next))) continue
			if (transientBlocked.has(nextKey)) continue
			const side1 = { x: current.node.x + direction.x, y: current.node.y }
			const side2 = { x: current.node.x, y: current.node.y + direction.y }
			if (!walkable.has(key(side1)) || !walkable.has(key(side2))) continue
			if (blockedEdges.has(edgeKey(current.node, side1)) || blockedEdges.has(edgeKey(current.node, side2))) continue
			if (blockedEdges.has(edgeKey(side1, next)) || blockedEdges.has(edgeKey(side2, next))) continue
			if (transientBlocked.has(key(side1)) || transientBlocked.has(key(side2))) continue
			const nextScore = current.g + SQRT2
			if (nextScore >= (scores.get(nextKey) ?? Infinity)) continue
			cameFrom.set(nextKey, currentKey)
			scores.set(nextKey, nextScore)
			heap.push({ node: next, g: nextScore, f: nextScore + octileDistance(next, goal) })
		}
	}
	return []
}
