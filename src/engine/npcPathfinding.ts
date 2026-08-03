import type { FloorId } from '@/types'
import { CORRIDOR_NODES, type PathNode } from '@/components/overlays/hqLayout'

export interface Point {
	x: number
	y: number
}

interface CorridorGraph {
	nodes: PathNode[]
	edges: number[][]
}

const graphCache = new Map<FloorId, CorridorGraph>()

function buildGraph(floor: FloorId): CorridorGraph {
	const nodes = CORRIDOR_NODES[floor] || []
	const edges: number[][] = nodes.map(() => [])
	const TOL = 1
	for (let i = 0; i < nodes.length; i++) {
		for (let j = i + 1; j < nodes.length; j++) {
			const a = nodes[i]
			const b = nodes[j]
			if (Math.abs(a.x - b.x) <= TOL || Math.abs(a.y - b.y) <= TOL) {
				edges[i].push(j)
				edges[j].push(i)
			}
		}
	}
	return { nodes, edges }
}

function getGraph(floor: FloorId): CorridorGraph {
	let g = graphCache.get(floor)
	if (!g) {
		g = buildGraph(floor)
		graphCache.set(floor, g)
	}
	return g
}

function dist(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y)
}

function nearestNode(graph: CorridorGraph, p: Point): number {
	let best = -1
	let bestD = Infinity
	for (let i = 0; i < graph.nodes.length; i++) {
		const d = dist(graph.nodes[i], p)
		if (d < bestD) {
			bestD = d
			best = i
		}
	}
	return best
}

function shortestNodePath(graph: CorridorGraph, startIdx: number, endIdx: number): number[] {
	if (startIdx === endIdx) return [startIdx]
	const n = graph.nodes.length
	const distArr = new Array(n).fill(Infinity)
	const prev = new Array(n).fill(-1)
	const visited = new Array(n).fill(false)
	distArr[startIdx] = 0

	for (let iter = 0; iter < n; iter++) {
		let u = -1
		let best = Infinity
		for (let i = 0; i < n; i++) {
			if (!visited[i] && distArr[i] < best) {
				best = distArr[i]
				u = i
			}
		}
		if (u === -1) break
		visited[u] = true
		if (u === endIdx) break
		for (const v of graph.edges[u]) {
			const w = dist(graph.nodes[u], graph.nodes[v])
			if (distArr[u] + w < distArr[v]) {
				distArr[v] = distArr[u] + w
				prev[v] = u
			}
		}
	}

	if (distArr[endIdx] === Infinity) return []
	const path: number[] = []
	let cur = endIdx
	while (cur !== -1) {
		path.unshift(cur)
		cur = prev[cur]
	}
	return path
}

/**
 * Builds a multi-waypoint path from `from` to `to` on the given floor,
 * routed through the floor's corridor node graph so NPCs walk through
 * corridors instead of cutting straight through walls.
 */
export function findNpcPath(floor: FloorId, from: Point, to: Point): [number, number][] {
	const graph = getGraph(floor)
	if (graph.nodes.length === 0) {
		return [[from.x, from.y], [to.x, to.y]]
	}

	const startNode = nearestNode(graph, from)
	const endNode = nearestNode(graph, to)
	const nodePath = shortestNodePath(graph, startNode, endNode)

	const points: [number, number][] = [[from.x, from.y]]
	for (const idx of nodePath) {
		const node = graph.nodes[idx]
		const last = points[points.length - 1]
		if (last[0] !== node.x || last[1] !== node.y) {
			points.push([node.x, node.y])
		}
	}
	const last = points[points.length - 1]
	if (last[0] !== to.x || last[1] !== to.y) {
		points.push([to.x, to.y])
	}
	return points
}
