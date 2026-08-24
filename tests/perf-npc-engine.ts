import { NpcEngine, findNpcGridPath, type NpcEngineFloor, type NpcEngineInteractionTarget, type NpcEngineLayout, type NpcEnginePoint } from '../src/engine/npc'

function mulberry32(seed: number): () => number {
	return () => {
		seed |= 0
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const GRID = 48
const random = mulberry32(20260823)

function buildFloor(): NpcEngineFloor {
	const walkable: NpcEnginePoint[] = []
	for (let y = 0; y < GRID; y++) {
		for (let x = 0; x < GRID; x++) {
			const isBorder = x === 0 || y === 0 || x === GRID - 1 || y === GRID - 1
			const isWallBand = y === Math.floor(GRID / 2) && x % 6 !== 0
			if (!isBorder && !isWallBand) walkable.push({ x, y })
		}
	}
	return { id: 'F1', width: GRID, height: GRID, tileSize: 1, walkable }
}

function buildTargets(floorId: string, count: number): NpcEngineInteractionTarget[] {
	const targets: NpcEngineInteractionTarget[] = []
	for (let i = 0; i < count; i++) {
		const x = 2 + (i * 5) % (GRID - 4)
		const y = 2 + Math.floor(i / ((GRID - 4) / 5)) % (GRID - 4)
		targets.push({
			floorId,
			itemId: `item-${i}`,
			interactSpotId: `spot-${i}`,
			x,
			y,
			tags: ['service'],
			capacity: 3,
			durationMinSeconds: 2,
			durationMaxSeconds: 6,
		})
	}
	return targets
}

function buildEngine(agentCount: number): NpcEngine {
	const floor = buildFloor()
	const layout: NpcEngineLayout = {
		floors: [floor],
		interactionTargets: buildTargets('F1', 20),
	}
	const engine = new NpcEngine(layout, {
		ticksPerSecond: 60,
		agentClearance: 0.5,
		random,
		pathfinder: findNpcGridPath,
		targetSelector: (_agent, targets) => targets[Math.floor(random() * targets.length)] ?? null,
		wanderSelector: agent => {
			for (let attempt = 0; attempt < 8; attempt++) {
				const x = 1 + Math.floor(random() * (GRID - 2))
				const y = 1 + Math.floor(random() * (GRID - 2))
				if ((x !== Math.round(agent.x) || y !== Math.round(agent.y))) return { x, y }
			}
			return null
		},
	})
	let placed = 0
	for (let y = 1; y < GRID - 1 && placed < agentCount; y += 2) {
		for (let x = 1; x < GRID - 1 && placed < agentCount; x += 2) {
			engine.addAgent({ id: `npc-${placed}`, roleId: 'guest', floorId: 'F1', x, y, targetX: x, targetY: y, speed: 0.5 })
			placed++
		}
	}
	return engine
}

function measure(agentCount: number, ticks: number): void {
	process.stdout.write(`agents=${String(agentCount).padStart(5)} `)
	const engine = buildEngine(agentCount)
	engine.tick(30)

	const samples: number[] = []
	for (let i = 0; i < ticks; i++) {
		const start = performance.now()
		engine.tick(1)
		samples.push(performance.now() - start)
	}
	engine.drainEvents()

	samples.sort((a, b) => a - b)
	const avg = samples.reduce((sum, v) => sum + v, 0) / samples.length
	const p95 = samples[Math.floor(samples.length * 0.95)]
	const max = samples[samples.length - 1]
	const perSecond = (avg * 60).toFixed(1).padStart(7)
	process.stdout.write(
		`avg=${avg.toFixed(3)}ms p95=${p95.toFixed(3)}ms max=${max.toFixed(3)}ms ~cpu@60tps=${perSecond}ms/s\n`,
	)
}

process.stdout.write(`NPC engine tick benchmark — ${GRID}x${GRID} grid, real A* pathfinding\n`)
for (const count of [100, 250, 500, 1000]) {
	measure(count, 600)
}
