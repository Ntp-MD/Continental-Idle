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
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import { NpcEngine } from '../src/engine/npc'
import { buildSyncedPayload } from '../src/blueprint-editor/syncedPayload'
import { buildAssetMap } from '../src/blueprint-editor/assetUtils'
import { normalizeOriginAssetFile, normalizeNpcConfig, normalizeNpcSpawnZones } from '../src/blueprint-editor/types'
import type { FloorData } from '../src/blueprint-editor/types'
import { originAssetsData } from '../src/blueprint-editor/data/originAssets.data'
import { floorPlanData } from '../src/blueprint-editor/data/floorPlan.data'
import { npcSettingsData } from '../src/blueprint-editor/data/npcSettings.data'

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

const assetMap = buildAssetMap(normalizeOriginAssetFile({ $schema: 'origin-assets.v1.json', version: 1, originAssets: originAssetsData })!.originAssets)
const npcConfig = normalizeNpcConfig(npcSettingsData)!
const payload = buildSyncedPayload(floorPlanData as never, assetMap, npcConfig)!
const floorKeys = Object.keys(payload.floors).sort((a, b) => (a === 'G' ? -1 : b === 'G' ? 1 : Number(a) - Number(b)))
const floors: FloorData[] = floorKeys.map(id => ({
	id,
	name: id,
	label: id,
	objects: payload.floors[id].objects.map(o => ({ id: o.id, type: o.type, x: o.x!, y: o.y!, w: o.w!, h: o.h!, rotation: o.rotation })),
	defaultWalkable: payload.floors[id].defaultWalkable,
	walkable: payload.floors[id].walkable,
	spawnZones: payload.floors[id].spawnZones,
	allowedRoleIds: payload.floors[id].allowedRoleIds,
}))
const canvas = { w: payload.canvas.width, h: payload.canvas.height, tileSize: payload.canvas.tileSize, streetTiles: payload.canvas.streetWidthTiles, streetFloorId: payload.canvas.streetFloorId }

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
const engine = new NpcEngine(built.layout, { ticksPerSecond: 60, random, ...policy })

// Spawn exactly like useNpcSimulationCore.spawnAgents.
const TPS = 60
for (const entry of npcConfig.pool) {
	const role = npcConfig.roles.find(r => r.id === entry.roleId)
	if (!role) continue
	for (const floor of floors) {
		if (floor.allowedRoleIds?.length && !floor.allowedRoleIds.includes(role.id)) continue
		if (role.spawnRule?.targetTags?.length) {
			const tagsOnFloor = new Set(floor.objects.flatMap(o => assetMap.get(o.type)?.tags ?? []))
			if (!role.spawnRule.targetTags.some(t => tagsOnFloor.has(t))) continue
		}
		const map = built.floorMaps.get(floor.id)
		if (!map) continue
		const zones = normalizeNpcSpawnZones(floor.spawnZones) ?? []
		let cells = [...map.tiles]
		if (zones.length) {
			cells = cells.filter(key => {
				const [x, y] = key.split(',').map(Number)
				const px = x * map.cellSize
				const py = y * map.cellSize
				return zones.some(z => px >= z.x && px < z.x + z.w && py >= z.y && py < z.y + z.h)
			})
		}
		assert.ok(cells.length > 0, `no spawn cells for ${role.id} on ${floor.id}`)
		for (let i = 0; i < entry.count; i++) {
			const key = cells[(random() * cells.length) | 0]!
			const [cx, cy] = key.split(',').map(Number)
			engine.addAgent({ id: `obs-${entry.roleId}-${floor.id}-${i}`, roleId: role.id, floorId: floor.id, x: cx!, y: cy!, targetX: cx!, targetY: cy!, speed: Math.max(0.01, npcConfig.speed) * TPS / map.cellSize })
		}
	}
}

const SIM_SECONDS = Number(process.env.OBS_SECONDS ?? 600)
const SAMPLE_EVERY = TPS
const statusSamples: Record<string, number> = {}
const ridesByFloorPair = new Map<string, number>()
let samplesTaken = 0
let prevFloorById = new Map<string, string>()

if (process.env.OBS_DEBUG) {
	const spawnDist: Record<string, Record<string, number>> = {}
	for (const a of engine.listAgents()) {
		spawnDist[a.floorId] ??= {}
		const label = a.roleId.replace('role-', '')
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
}

console.log(`simulated ${SIM_SECONDS}s @${TPS}tps | agents=${engine.listAgents().length} | ${samplesTaken} samples`)
const totalStatus = Object.values(statusSamples).reduce((a, b) => a + b, 0)
for (const [status, n] of Object.entries(statusSamples)) {
	console.log(`  ${status.padEnd(12)} ${(n / totalStatus * 100).toFixed(1)}%`)
}
console.log('\ncross-floor travels (sampled):')
for (const [pair, n] of [...ridesByFloorPair.entries()].sort((a, b) => b[1] - a[1])) {
	console.log(`  ${pair}: ~${n}`)
}
if (!ridesByFloorPair.size) console.log('  none')

const byFloorRoles: Record<string, Record<string, number>> = {}
for (const a of engine.listAgents()) {
	byFloorRoles[a.floorId] ??= {}
	const label = a.roleId.replace('role-', '')
	byFloorRoles[a.floorId]![label] = (byFloorRoles[a.floorId]![label] ?? 0) + 1
}
console.log('\nfinal population per floor:')
for (const key of floorKeys) {
	const roles = byFloorRoles[key] ?? {}
	console.log(`  ${key.padStart(2)}: ${Object.values(roles).reduce((a, b) => a + b, 0)} | ${Object.entries(roles).map(([r, n]) => `${r}:${n}`).join(' ') || '-'}`)
}
assert.ok(engine.listAgents().length > 0, 'agents deployed')
console.log('\nOBSERVE OK')
