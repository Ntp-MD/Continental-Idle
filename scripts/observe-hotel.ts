/**
 * observe-hotel.ts - headless crowd observation for ROADMAP Step 5.
 *
 * Boots the real authored content into the shared engine with a seeded RNG,
 * spawns the configured pool using the same rules as the runtime core
 * (pool -> floorIds -> allowedRoleIds -> spawnZones -> targetTags), then
 * samples statuses once per simulated second and prints calm-metrics plus a
 * cross-floor travel estimate.
 *
 * Deterministic: mulberry32 seed feeds everything (spawn picks, policy).
 * Run: npx tsx scripts/observe-hotel.ts   (OBS_SECONDS env overrides duration)
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildNpcEngineLayout, buildRoleWalkableMap, filterNpcSpawnTiles } from '../src/engine/npc/layoutBuild'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import { NPC_ENGINE_DEFAULT_OPTIONS, NpcEngine, floorMatchesTargetTags } from '../src/engine/npc'
import { buildAssetMap } from '../src/blueprint-editor/assets/assetUtils'
import { migrate } from '../src/blueprint-editor/store/migrate'
import type { AssetDef } from '../src/blueprint-editor/domain/types'

function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | (t << 16))
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const seedPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/blueprint-editor/data/blueprint-data.json')
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as { layout: unknown; originAssets: AssetDef[]; npcConfig: unknown }
const { layout } = migrate(seed.layout, seed.originAssets, seed.npcConfig)
const npcConfig = layout.npcConfig!
const assetMap = buildAssetMap(seed.originAssets)
const floors = layout.floors
const canvas = {
	w: layout.canvas.width,
	h: layout.canvas.height,
	tileSize: layout.canvas.tileSize,
	streetTiles: layout.streetWidthTiles,
	streetFloorId: layout.streetFloorId,
}
const floorKeys = floors.map(floor => floor.id)

const random = mulberry32(20260825)
const built = buildNpcEngineLayout(floors, canvas, type => assetMap.get(type), type => assetMap.get(type)?.tags)
const policy = createNpcEnginePolicy({
	getConfig: () => npcConfig,
	floors: built.layout.floors,
	floorMaps: built.floorMaps,
	floorDataMap: built.floorDataMap,
	ticksPerSecond: 60,
	getTickNumber: () => engine.tickNumber,
	listAgents: () => engine.listAgents(),
	getAssetTags: type => assetMap.get(type)?.tags,
	random,
})
const engine = new NpcEngine(built.layout, {
	...NPC_ENGINE_DEFAULT_OPTIONS,
	ticksPerSecond: 60, random,
	socialRadius: 2, socialCooldownSeconds: 20,
	socialChatDurationMinSeconds: 5, socialChatDurationMaxSeconds: 14,
	...policy,
})

// Spawn exactly like useNpcSimulationCore.spawnAgents: pool -> floorIds ->
// allowedRoleIds -> targetTags -> role walkable map -> spawn zones.
const TPS = 60
const getAssetTags = (type: string) => assetMap.get(type)?.tags
let agentSeq = 0
for (const entry of npcConfig.pool) {
	const role = npcConfig.roles.find(r => r.id === entry.roleId)
	if (!role) continue
	for (const floor of floors) {
		if (entry.floorIds?.length && !entry.floorIds.includes(floor.id)) continue
		if (floor.allowedRoleIds?.length && !floor.allowedRoleIds.includes(role.id)) continue
		if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTags)) continue
		const map = built.floorMaps.get(floor.id)
		if (!map) continue
		const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTags)
		const cells = [...filterNpcSpawnTiles(roleMap, floor, role.id)]
		assert.ok(cells.length > 0, `no spawn cells for ${role.id} on ${floor.id}`)
		for (let i = 0; i < entry.count; i++) {
			const key = cells[(random() * cells.length) | 0]!
			const [cx, cy] = key.split(',').map(Number)
			engine.addAgent({ id: `obs-${agentSeq++}`, roleId: role.id, floorId: floor.id, x: cx!, y: cy!, targetX: cx!, targetY: cy!, speed: Math.max(0.01, npcConfig.speed) * TPS / map.cellSize })
		}
	}
}

const SIM_SECONDS = Number(process.env.OBS_SECONDS ?? 600)
const SAMPLE_EVERY = TPS
const statusSamples: Record<string, number> = {}
const waitingReasons: Record<string, number> = {}
let chatsStarted = 0
const ridesByFloorPair = new Map<string, number>()
let samplesTaken = 0
let prevFloorById = new Map<string, string>()

if (process.env.OBS_DEBUG) {
	const spawnDist: Record<string, Record<string, number>> = {}
	for (const a of engine.listAgents()) {
		spawnDist[a.floorId] ??= {}
		const label = (a.roleId ?? '').replace('role-', '')
		spawnDist[a.floorId]![label] = (spawnDist[a.floorId]![label] ?? 0) + 1
	}
	console.log('post-spawn distribution:')
	for (const key of floorKeys) console.log(`  ${key.padStart(2)}:`, JSON.stringify(spawnDist[key] ?? {}))
}

while (engine.tickNumber < SIM_SECONDS * TPS) {
	engine.tick(Math.min(SAMPLE_EVERY, SIM_SECONDS * TPS - engine.tickNumber))
	const nextFloorById = new Map<string, string>()
	for (const agent of engine.listAgents()) {
		statusSamples[agent.status] = (statusSamples[agent.status] ?? 0) + 1
		nextFloorById.set(agent.id, agent.floorId)
		const prev = prevFloorById.get(agent.id)
		if (prev && prev !== agent.floorId) {
			const pairKey = `${prev}->${agent.floorId}`
			ridesByFloorPair.set(pairKey, (ridesByFloorPair.get(pairKey) ?? 0) + 1)
		}
	}
	prevFloorById = nextFloorById
	samplesTaken++
	for (const event of engine.drainEvents()) {
		if (event.type === 'chatting-start') { chatsStarted++ ; continue }
		if (event.type !== 'waiting') continue
		const reason = event.reason ?? 'unknown'
		waitingReasons[reason] = (waitingReasons[reason] ?? 0) + 1
	}
}

console.log(`simulated ${SIM_SECONDS}s @${TPS}tps | agents=${engine.listAgents().length} | ${samplesTaken} samples`)
const totalStatus = Object.values(statusSamples).reduce((a, b) => a + b, 0)
for (const [status, n] of Object.entries(statusSamples)) {
	console.log(`  ${status.padEnd(12)} ${(n / totalStatus * 100).toFixed(1)}%`)
}
const totalWaits = Object.values(waitingReasons).reduce((a, b) => a + b, 0)
console.log('\nwaiting reasons (events):')
for (const [reason, n] of Object.entries(waitingReasons).sort((a, b) => b[1] - a[1])) {
	console.log(`  ${reason.padEnd(14)} ${n} (${(n / Math.max(1, totalWaits) * 100).toFixed(1)}%)`)
}
if (!totalWaits) console.log('  none')
console.log(`\nchats started: ${chatsStarted}`)
console.log('\ncross-floor travels (sampled):')
for (const [pair, n] of [...ridesByFloorPair.entries()].sort((a, b) => b[1] - a[1])) {
	console.log(`  ${pair}: ~${n}`)
}
if (!ridesByFloorPair.size) console.log('  none')

const byFloorRoles: Record<string, Record<string, number>> = {}
for (const a of engine.listAgents()) {
	byFloorRoles[a.floorId] ??= {}
	const label = (a.roleId ?? '').replace('role-', '')
	byFloorRoles[a.floorId]![label] = (byFloorRoles[a.floorId]![label] ?? 0) + 1
}
console.log('\nfinal population per floor:')
for (const key of floorKeys) {
	const roles = byFloorRoles[key] ?? {}
	console.log(`  ${key.padStart(2)}: ${Object.values(roles).reduce((a, b) => a + b, 0)} | ${Object.entries(roles).map(([r, n]) => `${r}:${n}`).join(' ') || '-'}`)
}
assert.ok(engine.listAgents().length > 0, 'agents deployed')
console.log('\nOBSERVE OK')
