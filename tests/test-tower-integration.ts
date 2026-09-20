import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from '../src/blueprint-editor/store/migrate'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_OPTIONS,
	buildNpcEngineLayout,
	buildRoleWalkableMap,
	createNpcEnginePolicy,
	filterNpcSpawnTiles,
} from '../src/engine/npc'
import type { AssetDef } from '../src/blueprint-editor/domain/types'

// Deploy-pipeline integration on the REAL workspace seed: whatever the seed
// currently holds must always be deployable. Expectations derive from the
// seed itself (pool totals, portal floors), never hardcoded counts, so this
// stays green as floors are added or emptied.

function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const seedPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/blueprint-editor/data/blueprint-data.json')
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as {
	layout: Record<string, unknown>
	originAssets: AssetDef[]
	npcConfig: Record<string, unknown>
}

// 1. Ingress: the real seed migrates (sizes re-derived, salvage applied).
const { layout } = migrate(seed.layout, seed.originAssets, seed.npcConfig)
assert.ok(layout.floors.length > 0, 'seed has at least one floor')
const config = layout.npcConfig!
assert.ok(config, 'seed migrates with an npc config')

const assetMap = new Map(seed.originAssets.map(asset => [asset.id, asset]))
const getAssetDef = (type: string) => assetMap.get(type)
const getAssetTags = (type: string) => assetMap.get(type)?.tags
const canvas = layout.canvas as { width: number; height: number; tileSize: number }
const bounds = {
	w: canvas.width,
	h: canvas.height,
	tileSize: canvas.tileSize,
	streetTiles: (layout as { streetWidthTiles?: number }).streetWidthTiles,
	streetFloorId: (layout as { streetFloorId?: string }).streetFloorId,
}

// 2. Layout build: every floor maps, every target references a real floor.
const built = buildNpcEngineLayout(layout.floors, bounds, getAssetDef, getAssetTags)
const floorIds = new Set(layout.floors.map(floor => floor.id))
for (const floor of layout.floors) {
	const map = built.floorMaps.get(floor.id)
	assert.ok(map && map.tiles.size > 0, `floor "${floor.label}" builds a non-empty walkable map`)
}
for (const target of built.layout.interactionTargets) {
	assert.ok(floorIds.has(target.floorId), `target ${target.itemId} references a real floor`)
}

// 3. Portals are symmetric: every ride down has a ride up.
const portals = built.layout.interactionTargets.filter(target => target.transitionToFloorId)
const portalFloors = new Set(portals.flatMap(target => [target.floorId, target.transitionToFloorId as string]))
if (portalFloors.size >= 2) {
	for (const target of portals) {
		const back = portals.some(other =>
			other.floorId === target.transitionToFloorId && other.transitionToFloorId === target.floorId,
		)
		assert.ok(back, `portal ${target.itemId} -> ${target.transitionToFloorId} has a return route`)
	}
}

// 4. Spawn resolution: every pool entry finds cells on its floors.
const TPS = 60
const random = mulberry32(20260920)
let tickNow = 0
let engine!: NpcEngine
const policy = createNpcEnginePolicy({
	getConfig: () => ({ speed: 0.2, defaultRoleId: '', roles: config.roles, tasks: config.tasks, pool: config.pool }) as never,
	floors: built.layout.floors,
	floorMaps: built.floorMaps,
	floorDataMap: built.floorDataMap,
	ticksPerSecond: TPS,
	getTickNumber: () => tickNow,
	listAgents: () => engine.listAgents(),
	getAssetTags,
	random,
})
engine = new NpcEngine(built.layout, { ...NPC_ENGINE_DEFAULT_OPTIONS, ticksPerSecond: TPS, random, ...policy })
const roles = new Map(config.roles.map(role => [role.id, role]))
let expected = 0
let spawned = 0
const MAX_AGENTS = 200
for (const entry of config.pool) {
	const role = roles.get(entry.roleId)
	assert.ok(role, `pool entry references a known role "${entry.roleId}"`)
	for (const floor of layout.floors) {
		if (entry.floorIds?.length && !entry.floorIds.includes(floor.id)) continue
		const map = built.floorMaps.get(floor.id)!
		const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTags)
		const keys = [...filterNpcSpawnTiles(roleMap, floor, role.id)]
		assert.ok(keys.length > 0, `role "${role.label}" has spawn cells on floor "${floor.label}"`)
		for (const key of keys.slice(0, Math.max(0, entry.count))) {
			if (spawned >= MAX_AGENTS) break
			const [x, y] = key.split(',').map(Number)
			engine.addAgent({ id: `seed-${spawned}`, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: 0.6 })
			spawned++
		}
		expected += entry.count
	}
}
assert.ok(spawned > 0 || expected === 0, 'non-empty pool spawns agents')
assert.ok(spawned <= MAX_AGENTS, 'agent cap holds on large seeds')

// 5. Sim smoke: ticks hold without throwing and nobody leaves known floors.
for (tickNow = 1; tickNow <= 120; tickNow++) engine.tick(1)
const agents = engine.listAgents()
assert.equal(agents.length, spawned, 'no agent lost during ticks')
for (const agent of agents) {
	assert.ok(floorIds.has(agent.floorId), `agent ${agent.id} stays on a known floor`)
}

console.log(`Tower integration checks passed (${layout.floors.length} floors, ${spawned}/${expected} agents, ${portals.length} portal routes)`)
