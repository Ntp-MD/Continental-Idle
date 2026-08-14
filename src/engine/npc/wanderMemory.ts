import type { NpcEngineAgent, NpcEnginePoint } from './types'

const DEFAULT_MAX_MEMORY = 32
const DEFAULT_SMALL_MAP_THRESHOLD = 8

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
		const separated = candidates.filter(candidate => avoid.every(point => Math.hypot(candidate.x - point.x, candidate.y - point.y) > 1.25))
		const pool = separated.length > 0 ? separated : candidates
		if (pool.length <= this.smallMapThreshold) return this.pickLeastRecent(pool)
		const unvisited = pool.filter(c => !this.recentTiles.has(`${Math.floor(c.x)},${Math.floor(c.y)}`))
		if (unvisited.length > 0) return this.pickControlled(unvisited, agent)
		return this.pickLeastRecent(pool)
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

	private pickControlled(candidates: readonly NpcEnginePoint[], agent: NpcEngineAgent): NpcEnginePoint | null {
		const ranked = candidates.slice().sort((a, b) => {
			const distance = Math.hypot(a.x - agent.x, a.y - agent.y) - Math.hypot(b.x - agent.x, b.y - agent.y)
			if (distance !== 0) return distance
			return `${Math.floor(a.x)},${Math.floor(a.y)}`.localeCompare(`${Math.floor(b.x)},${Math.floor(b.y)}`)
		})
		const shortlist = ranked.slice(0, Math.min(8, ranked.length))
		return shortlist[Math.min(shortlist.length - 1, Math.floor(Math.max(0, Math.min(0.999999, this.random())) * shortlist.length))] ?? null
	}

	clear(): void {
		this.recentTiles.clear()
		this.order.length = 0
	}
}
