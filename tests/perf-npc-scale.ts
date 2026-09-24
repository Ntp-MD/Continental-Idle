import { seedOriginAssets, seedLayout } from '../src/blueprint-editor/store/seed'
const originAssets = await seedOriginAssets()
import { generatedHotel } from './unit/hotelFixture'
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import { interactionTargetKey } from '../src/engine/npc/keys'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS, findNpcGridPath } from '../src/engine/npc'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import { normalizeObject } from '../src/blueprint-editor/domain/geometry'
import type { FloorData, NpcSimulationConfig, AssetDef, ObjectData } from '../src/blueprint-editor/domain/types'
import type { NpcEngineInteractionTarget } from '../src/engine/npc/types'

const seedCanvas = (await seedLayout()).canvas
const TILE = seedCanvas.tileSize
const RING = (await seedLayout()).streetWidthTiles ?? 8
const assetMap = new Map<string, AssetDef>(originAssets.map(a => [a.id, a]))

function normalizeFloors(raw: FloorData[]): FloorData[] {
	for (const floor of raw) for (const o of floor.objects as ObjectData[]) {
		o.x = Math.round(o.x / TILE) * TILE
		o.y = Math.round(o.y / TILE) * TILE
		normalizeObject(o, TILE, [...assetMap.values()])
	}
	return raw
}

async function cloneTo11Floors(): Promise<FloorData[]> {
	const base = normalizeFloors(JSON.parse(JSON.stringify((await seedLayout()).floors)))
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

interface ScenarioOptions { realConfig?: NpcSimulationConfig; scale?: number }

function runScenario(name: string, floors: FloorData[], perFloor: number, ticks: number, options: ScenarioOptions = {}): void {
	const built = buildNpcEngineLayout(floors, { w: seedCanvas.width, h: seedCanvas.height, tileSize: TILE }, t => assetMap.get(t), t => assetMap.get(t)?.tags)
	const config = (options.realConfig ?? {
		speed: 1 / 30, defaultRoleId: 'guest',
		roles: [{ id: 'guest', label: 'Guest', color: '#8ecae6', focusTags: ['bathroom'], restrictedTags: [], taskIds: [], focusChance: 30 }],
		tasks: [], pool: [],
	}) as unknown as NpcSimulationConfig
	const portalEvents: Record<string, number> = {}
	const crossPicks = { total: 0, picked: 0, refused: 0 }
	const visitedByFloor = new Map<string, Set<string>>()
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
	// Every cross-floor failure is repath-failed on a portal target, so capture a few and ask
	// the pathfinder again after the run, this time without the crowd blockers.
	const portalPathProbes: Array<{ floorId: string, from: string, to: string }> = []
	engine = new NpcEngine(built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		agentClearance: Number(process.argv.find(a => a.startsWith('--clearance='))?.split('=')[1] ?? 0.5),
		random,
		pathfinder: (f: any, a: any, to: any, b: any) => {
			const path = timed('pathfinder', (f2: any, a2: any, to2: any, b2: any) => findNpcGridPath(f2, a2, to2, b2))(f, a, to, b)
			if (!path && typeof to?.itemId === 'string' && to.itemId.startsWith('portal:') && portalPathProbes.length < 6) {
				portalPathProbes.push({ floorId: a.floorId, from: `${Math.floor(a.x)},${Math.floor(a.y)}`, to: `${to.x},${to.y}` })
			}
			return path
		},
		targetSelector: process.argv.includes('--no-target') ? () => null : timed('target', policy.targetSelector),
		queueSelector: policy.queueSelector,
		crossFloorSelector: (agent: unknown, candidates: unknown, floors: unknown) => {
			if (process.argv.includes('--no-cross')) return null
			const picked = timed('cross', policy.crossFloorSelector)(agent, candidates, floors)
			crossPicks.total++
			if (picked) crossPicks.picked++
			else crossPicks.refused++
			return picked
		},
		wanderSelector: process.argv.includes('--no-wander') ? () => null : timed('wander', policy.wanderSelector),
	})

	// Why a chosen destination never becomes a ride: count each rejection reason the engine can
	// give between "the selector picked a floor" and "the agent boarded a car".
	const portalDiag = { routeCalls: 0, routeNull: 0, spotTaken: 0, carFull: 0, agentHolding: 0, roomClaimed: 0, reserveOk: 0 }
	if (options.realConfig) {
		const e = engine as unknown as {
			findPortalRoute(sourceFloorId: string, destFloorId: string, agentId: string): unknown
			canReserve(target: NpcEngineInteractionTarget, agentId: string): boolean
			reservations: Map<string, Set<string>>
			interactSpotReservations: Map<string, string>
			reservationKeyByAgent: Map<string, string>
			claimedRooms: Map<string, string>
		}
		const origRoute = e.findPortalRoute.bind(e)
		e.findPortalRoute = (source, dest, agentId) => {
			portalDiag.routeCalls++
			const route = origRoute(source, dest, agentId)
			if (!route) portalDiag.routeNull++
			return route
		}
		const origCanReserve = e.canReserve.bind(e)
		e.canReserve = (target, agentId) => {
			const ok = origCanReserve(target, agentId)
			if (!target.itemId.startsWith('portal:')) return ok
			if (ok) { portalDiag.reserveOk++; return ok }
			const itemKey = `${target.floorId}:${target.itemId}`
			const holders = e.reservations.get(itemKey)
			if (e.reservationKeyByAgent.has(agentId) && !holders?.has(agentId)) portalDiag.agentHolding++
			else if (holders?.size && holders.size >= Math.max(1, Math.floor(target.capacity ?? 1))) portalDiag.carFull++
			else if (e.interactSpotReservations.has(interactionTargetKey(target))) portalDiag.spotTaken++
			else if (target.roomPrivate && target.roomId && e.claimedRooms.get(`${target.floorId}:${target.roomId}`) !== agentId) portalDiag.roomClaimed++
			return ok
		}
	}

	let total = 0
	const allFloorIds = floors.map(f => f.id)
	const spawnPlan: Array<{ floorId: string, roleId: string }> = []
	if (options.realConfig) {
		// the seed's own pool, scaled up: each entry may only spawn on floors that carry a zone for it
		for (const entry of options.realConfig.pool ?? []) {
			const wanted = (entry.floorIds ?? allFloorIds).filter(id => allFloorIds.includes(id))
			if (!wanted.length) continue
			for (let i = 0; i < Math.max(1, entry.count) * (options.scale ?? 1); i++) spawnPlan.push({ floorId: wanted[i % wanted.length], roleId: entry.roleId })
		}
	} else {
		for (const floor of floors) for (let i = 0; i < perFloor; i++) spawnPlan.push({ floorId: floor.id, roleId: 'guest' })
	}
	const tilesByFloor = new Map<string, string[]>()
	// spawn inside the building: the engine map also exposes the street ring on every floor,
	// and an agent placed there is outside the envelope and can never reach a lift
	const ring = RING
	const gridRows = seedCanvas.height / TILE, gridCols = seedCanvas.width / TILE
	const inBuilding = (k: string) => {
		const [c, r] = k.split(',').map(Number)
		return r >= ring && r <= gridRows - 1 - ring && c >= ring && c <= gridCols - 1 - ring
	}
	for (const item of spawnPlan) {
		const map = built.floorMaps.get(item.floorId)!
		let tiles = tilesByFloor.get(item.floorId)
		if (!tiles) { tiles = [...map.tiles].filter(inBuilding); tilesByFloor.set(item.floorId, tiles) }
		const [x, y] = tiles[Math.floor(random() * tiles.length)].split(',').map(Number)
		engine.addAgent({ id: `n-${total++}`, roleId: item.roleId, floorId: item.floorId, x, y, targetX: x, targetY: y, speed: 1.5 })
	}

	const samples: number[] = []
	const spikes: Array<{ tick: number; ms: number }> = []
	const boardingsByCar = new Map<string, number>()
	const ridesByPair = new Map<string, number>()
	let transitions = 0
	let over16 = 0
	let over8 = 0
	for (let i = 0; i < ticks + 300; i++) {
		tickNow++
		const t0 = performance.now()
		engine.tick(1)
		const dt = performance.now() - t0
		engine.drainEvents().forEach(e => {
			if (e.type === 'floor-transition') {
				transitions++
				if (e.itemId) boardingsByCar.set(e.itemId, (boardingsByCar.get(e.itemId) ?? 0) + 1)
				const from = (e as unknown as { fromFloorId?: string }).fromFloorId
				if (from) ridesByPair.set(`${from}->${e.floorId}`, (ridesByPair.get(`${from}->${e.floorId}`) ?? 0) + 1)
			}
			if (e.itemId?.startsWith('portal:')) portalEvents[e.type] = (portalEvents[e.type] ?? 0) + 1
			if (e.itemId?.startsWith('portal:') && e.type === 'repath-failed' && portalPathProbes.length < 6) {
				const live = engine.listAgents().find((a: any) => a.id === e.agentId) as any
				if (live) portalPathProbes.push({ floorId: e.floorId, from: `${Math.floor(live.x)},${Math.floor(live.y)}`, to: `${Math.floor(live.targetX)},${Math.floor(live.targetY)}` })
			}
		})
		if (i >= 300) {
			samples.push(dt)
			if (dt > 8) { over8++; spikes.push({ tick: i - 300, ms: dt }) }
			if (dt > 16.7) over16++
		}
		// coverage: which in-building cells an agent has actually stood on
		if (options.realConfig && tickNow % 5 === 0) {
			for (const agent of engine.listAgents() as any[]) {
				const k = `${Math.floor(agent.x)},${Math.floor(agent.y)}`
				if (!inBuilding(k)) continue
				let seen = visitedByFloor.get(agent.floorId)
				if (!seen) { seen = new Set<string>(); visitedByFloor.set(agent.floorId, seen) }
				seen.add(k)
			}
		}
	}
	if (options.realConfig) {
		let visitedTotal = 0, buildableTotal = 0
		const lines: string[] = []
		for (const floor of floors) {
			const map = built.floorMaps.get(floor.id)!
			const usable = [...map.tiles].filter(inBuilding)
			const seen = visitedByFloor.get(floor.id) ?? new Set<string>()
			visitedTotal += seen.size
			buildableTotal += usable.length
			lines.push(`${floor.label}=${seen.size}/${usable.length}`)
		}
		console.log(`tile coverage over the run: ${(100 * visitedTotal / Math.max(1, buildableTotal)).toFixed(1)}% of in-building walkable cells visited (${visitedTotal}/${buildableTotal})`)
		console.log(`per floor: ${lines.join(' ')}`)
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
	console.log(`cross-floor selector: called ${crossPicks.total}, chose a destination ${crossPicks.picked}, refused ${crossPicks.refused} -> routes rejected after a pick: ${crossPicks.picked - transitions}`)
	console.log(`portal route lookups: ${portalDiag.routeCalls}, no route found ${portalDiag.routeNull} | reserve rejections: agent already holding ${portalDiag.agentHolding}, car at capacity ${portalDiag.carFull}, spot taken ${portalDiag.spotTaken}, room claimed ${portalDiag.roomClaimed}, accepted ${portalDiag.reserveOk}`)
	const cars = [...boardingsByCar.entries()].sort((a, b) => b[1] - a[1])
	console.log(`per-car boardings: ${cars.length} distinct cars used | ${cars.slice(0, 8).map(([id, n]) => `${id}=${n}`).join(' ')}${cars.length > 8 ? ' ...' : ''}`)
	console.log(`portal events by type: ${Object.entries(portalEvents).map(([k, v]) => `${k}=${v}`).join(' ') || 'none'}`)
	for (const probe of portalPathProbes) {
		const map = built.floorMaps.get(probe.floorId)
		if (!map) continue
		const reach = new Set([probe.from])
		const stack = [probe.from]
		while (stack.length) {
			const [x, y] = stack.pop()!.split(',').map(Number)
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const k = `${x + dx},${y + dy}`
				if (map.tiles.has(k) && !reach.has(k)) { reach.add(k); stack.push(k) }
			}
		}
		const [fromX, fromY] = probe.from.split(',').map(Number)
		const [toX, toY] = probe.to.split(',').map(Number)
		const clear = findNpcGridPath(built.layout.floors.find(f => f.id === probe.floorId)!, { x: fromX, y: fromY }, { x: toX, y: toY }, undefined)
		console.log(`probe ${probe.floorId}: standing on ${probe.from} walkable=${map.tiles.has(probe.from)} -> target ${probe.to} walkable=${map.tiles.has(probe.to)} clearPath=${clear.length}`)
	}
	const pairs = [...ridesByPair.entries()].sort((a, b) => b[1] - a[1])
	console.log(`floor pairs travelled: ${pairs.length} | ${pairs.slice(0, 8).map(([p, n]) => `${p}=${n}`).join(' ')}`)
	const statusCounts = new Map<string, number>()
	for (const agent of engine.listAgents()) statusCounts.set(agent.status, (statusCounts.get(agent.status) ?? 0) + 1)
	console.log(`end-of-run status: ${[...statusCounts.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s}=${n}`).join(' ')}`)
	const parts = Object.entries(timings).map(([k, v]) => `${k}: ${v.ms.toFixed(0)}ms/${v.n}calls`).join(' | ')
	console.log('selector/path split:', parts || 'none')
	if (options.realConfig) {
		const frameBudgetMs = 16.7
		const failures: string[] = []
		if (total < 1000) failures.push(`only ${total} agents spawned, the gate needs 1000+`)
		if (p95 > frameBudgetMs) failures.push(`p95 tick ${p95.toFixed(2)}ms exceeds the ${frameBudgetMs}ms frame budget`)
		if (over16 / samples.length > 0.05) failures.push(`${(over16 / samples.length * 100).toFixed(2)}% of ticks drop a frame (limit 5%)`)
		console.log(failures.length ? `\nSCALE GATE FAIL: ${failures.join('; ')}` : `\nSCALE GATE PASS: ${total} agents, p95 ${p95.toFixed(2)}ms, ${(over16 / samples.length * 100).toFixed(2)}% dropped frames`)
		if (failures.length) process.exitCode = 1
	}
}

const perFloorTiers = [25, 50, 75, 100]
if (process.argv.includes('--real')) {
	// The tower, not the working seed: the scale gate must measure the same 21-floor
	// building whatever the editor currently holds (an empty lobby is a valid state).
	const tower = generatedHotel()
	const realConfig = tower.npcConfig as unknown as NpcSimulationConfig
	const scale = Number(process.argv.find(a => a.startsWith('--scale='))?.split('=')[1] ?? 12)
	const realTicks = Number(process.argv.find(a => a.startsWith('--ticks='))?.split('=')[1] ?? 5400)
	runScenario(`GENERATED tower: ${tower.floors.length} floors, seed pool x${scale}`, tower.floors, 0, realTicks, { realConfig, scale })
} else if (process.argv.includes('--current')) {
	const curFloors = normalizeFloors(JSON.parse(JSON.stringify((await seedLayout()).floors)))
	runScenario(`CURRENT layout: ${curFloors.length} floor(s) x 100`, curFloors, 100, 1800)
} else {
	for (const perFloor of perFloorTiers) {
		runScenario(`FUTURE scale: 11 floors x ${perFloor}`, await cloneTo11Floors(), perFloor, 1800)
	}
}
