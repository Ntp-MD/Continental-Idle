import { floorPlanData } from '../src/blueprint-editor/data/floorPlan.data'
import { originAssets } from '../src/blueprint-editor/store/dataLoader'
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS, findNpcGridPath } from '../src/engine/npc'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import { normalizeObject } from '../src/blueprint-editor/domain/geometry'
import type { FloorData, NpcSimulationConfig, AssetDef, ObjectData } from '../src/blueprint-editor/domain/types'

const TILE = 25
const assetMap = new Map<string, AssetDef>(originAssets.map(a => [a.id, a]))

function normalizeFloors(raw: FloorData[]): FloorData[] {
	for (const floor of raw) for (const o of floor.objects as ObjectData[]) {
		o.x = Math.round(o.x / TILE) * TILE
		o.y = Math.round(o.y / TILE) * TILE
		normalizeObject(o, TILE, [...assetMap.values()])
	}
	return raw
}

function cloneTo11Floors(): FloorData[] {
	const base = normalizeFloors(JSON.parse(JSON.stringify(floorPlanData.floors)))
	const out: FloorData[] = [base[0]]
	const pool = base.length > 1 ? base.slice(1) : base
	for (let i = 0; i < 10; i++) {
		const src = pool[i % pool.length]
		const copy: FloorData = JSON.parse(JSON.stringify(src))
		copy.id = `floor-sim-${i + 1}`
		copy.label = `S${i + 1}`
		copy.name = `Sim ${i + 1}`
		out.push(copy)
	}
	return out
}

let seed = 987654321
const random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }

function runScenario(name: string, floors: FloorData[], perFloor: number, ticks: number): void {
	const built = buildNpcEngineLayout(floors, { w: 1600, h: 1000, tileSize: TILE }, t => assetMap.get(t), t => assetMap.get(t)?.tags)
	const config = {
		speed: 1 / 30, defaultRoleId: 'guest',
		roles: [{ id: 'guest', label: 'Guest', color: '#8ecae6', focusTags: ['bathroom'], restrictedTags: [], taskIds: [], focusChance: 30 }],
		tasks: [], pool: [],
	} as unknown as NpcSimulationConfig
	let tickNow = 0
	let engine!: NpcEngine
	const policy = createNpcEnginePolicy({
		getConfig: () => config,
		floors: built.layout.floors,
		floorMaps: built.floorMaps,
		floorDataMap: built.floorDataMap,
		ticksPerSecond: 60,
		getTickNumber: () => tickNow,
		listAgents: () => engine.listAgents(),
		getAssetTags: type => assetMap.get(type)?.tags,
		random,
	})
	const timings: Record<string, { n: number; ms: number }> = {}
	function timed<K extends string>(key: K, fn: any): any {
		return (...args: any[]) => {
			const t0 = performance.now()
			const r = fn(...args)
			timings[key] = timings[key] ?? { n: 0, ms: 0 }
			timings[key].n++
			timings[key].ms += performance.now() - t0
			return r
		}
	}
	engine = new NpcEngine(built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		agentClearance: 0.5,
		random,
		pathfinder: timed('pathfinder', (f: any, a: any, to: any, b: any) => findNpcGridPath(f, a, to, b)),
		targetSelector: process.argv.includes('--no-target') ? () => null : timed('target', policy.targetSelector),
		queueSelector: policy.queueSelector,
		crossFloorSelector: process.argv.includes('--no-cross') ? () => null : timed('cross', policy.crossFloorSelector),
		wanderSelector: process.argv.includes('--no-wander') ? () => null : timed('wander', policy.wanderSelector),
	})

	let total = 0
	for (const floor of floors) {
		const map = built.floorMaps.get(floor.id)!
		const tiles = [...map.tiles]
		for (let i = 0; i < perFloor; i++) {
			const [x, y] = tiles[Math.floor(random() * tiles.length)].split(',').map(Number)
			engine.addAgent({ id: `n-${total++}`, roleId: 'guest', floorId: floor.id, x, y, targetX: x, targetY: y, speed: 1.5 })
		}
	}

	const samples: number[] = []
	const spikes: Array<{ tick: number; ms: number }> = []
	let transitions = 0
	let over16 = 0
	let over8 = 0
	for (let i = 0; i < ticks + 300; i++) {
		tickNow++
		const t0 = performance.now()
		engine.tick(1)
		const dt = performance.now() - t0
		engine.drainEvents().forEach(e => { if (e.type === 'floor-transition') transitions++ })
		if (i >= 300) {
			samples.push(dt)
			if (dt > 8) { over8++; spikes.push({ tick: i - 300, ms: dt }) }
			if (dt > 16.7) over16++
		}
	}
	if (spikes.length > 1) {
		const gaps: number[] = []
		for (let i = 1; i < spikes.length; i++) gaps.push(spikes[i].tick - spikes[i - 1].tick)
		gaps.sort((a, b) => a - b)
		console.log(`spike gaps(ms@60tps): median=${gaps[Math.floor(gaps.length / 2)]} min=${gaps[0]} max=${gaps[gaps.length - 1]} ticks | first spikes: ${spikes.slice(0, 12).map(s => `#${s.tick}=${s.ms.toFixed(1)}ms`).join(' ')}`)
	} else {
		console.log(`spikes>8ms: ${spikes.length}`)
	}
	samples.sort((a, b) => a - b)
	const avg = samples.reduce((s, v) => s + v, 0) / samples.length
	const p50 = samples[Math.floor(samples.length * 0.5)]
	const p95 = samples[Math.floor(samples.length * 0.95)]
	const p99 = samples[Math.floor(samples.length * 0.99)]
	const max = samples[samples.length - 1]
	console.log(`\n[${name}] agents=${total} floors=${floors.length} sampled=${samples.length} ticks`)
	console.log(`avg=${avg.toFixed(3)}ms p50=${p50.toFixed(3)} p95=${p95.toFixed(3)} p99=${p99.toFixed(3)} MAX=${max.toFixed(3)}ms`)
	console.log(`ticks>8ms=${over8} (${(over8 / samples.length * 100).toFixed(2)}%) ticks>16.7ms(frame)=${over16} (${(over16 / samples.length * 100).toFixed(2)}%)`)
	console.log(`elevator rides observed=${transitions}`)
	const parts = Object.entries(timings).map(([k, v]) => `${k}: ${v.ms.toFixed(0)}ms/${v.n}calls`).join(' | ')
	console.log('selector/path split:', parts || 'none')
}

const perFloorTiers = [25, 50, 75, 100]
if (process.argv.includes('--current')) {
	const curFloors = normalizeFloors(JSON.parse(JSON.stringify(floorPlanData.floors)))
	runScenario(`CURRENT layout: ${curFloors.length} floor(s) x 100`, curFloors, 100, 1800)
} else {
	for (const perFloor of perFloorTiers) {
		runScenario(`FUTURE scale: 11 floors x ${perFloor}`, cloneTo11Floors(), perFloor, 1800)
	}
}
