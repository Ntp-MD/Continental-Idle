import type { NpcEngineAgent, NpcEnginePoint } from './types'

const DEFAULT_MAX_MEMORY = 32
const DEFAULT_SMALL_MAP_THRESHOLD = 8
const SAMPLE_SIZE = 24

export class WanderMemory {
	private readonly maxMemory: number
	private readonly smallMapThreshold: number
	private readonly random: () => number
	private readonly recentTiles = new Map<string, number>()
	private readonly order: string[] = []

	constructor(maxMemory = DEFAULT_MAX_MEMORY, smallMapThreshold = DEFAULT_SMALL_MAP_THRESHOLD, random: () => number = () => 0) {
		this.maxMemory = maxMemory
		this.smallMapThreshold = smallMapThreshold
		this.random = random
	}

	recordVisit(point: NpcEnginePoint, tick: number): void {
		const key = `${Math.floor(point.x)},${Math.floor(point.y)}`
		if (!this.recentTiles.has(key)) {
			this.recentTiles.set(key, tick)
			this.order.push(key)
			if (this.order.length > this.maxMemory) {
				const oldest = this.order.shift()
				if (oldest !== undefined) this.recentTiles.delete(oldest)
			}
		}
	}

	selectWanderTile(
		candidates: readonly NpcEnginePoint[],
		agent: NpcEngineAgent,
		avoid: readonly NpcEnginePoint[] = [],
	): NpcEnginePoint | null {
		if (candidates.length === 0) return null
		if (candidates.length <= this.smallMapThreshold) return this.pickLeastRecent(candidates)
		const sampled: NpcEnginePoint[] = []
		for (let i = 0; i < SAMPLE_SIZE; i++) {
			sampled.push(candidates[Math.floor(this.random() * candidates.length)])
		}
		const separated = sampled.filter(candidate => avoid.every(point => Math.hypot(candidate.x - point.x, candidate.y - point.y) > 1.25))
		const pool = separated.length > 0 ? separated : sampled
		const unvisited = pool.filter(c => !this.recentTiles.has(`${Math.floor(c.x)},${Math.floor(c.y)}`))
		if (unvisited.length > 0) return this.pickNearest(unvisited, agent)
		return this.pickLeastRecent(pool)
	}

	private pickNearest(candidates: readonly NpcEnginePoint[], agent: NpcEngineAgent): NpcEnginePoint | null {
		let best: NpcEnginePoint | null = null
		let bestDist = Infinity
		for (const c of candidates) {
			const distance = Math.hypot(c.x - agent.x, c.y - agent.y)
			if (distance < bestDist) {
				best = c
				bestDist = distance
			}
		}
		return best
	}

	private pickLeastRecent(candidates: readonly NpcEnginePoint[]): NpcEnginePoint | null {
		let best: NpcEnginePoint | null = null
		let bestTick = Infinity
		let bestKey = ''
		for (const c of candidates) {
			const key = `${Math.floor(c.x)},${Math.floor(c.y)}`
			const tick = this.recentTiles.get(key) ?? -1
			if (tick < bestTick || (tick === bestTick && key < bestKey)) {
				best = c
				bestTick = tick
				bestKey = key
			}
		}
		return best
	}

	clear(): void {
		this.recentTiles.clear()
		this.order.length = 0
	}
}
