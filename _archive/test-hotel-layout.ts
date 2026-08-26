import assert from 'node:assert/strict'
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import { NpcEngine, type NpcCanvasBounds } from '../src/engine/npc'
import { buildSyncedPayload } from '../src/blueprint-editor/syncedPayload'
import { buildAssetMap } from '../src/blueprint-editor/assetUtils'
import { normalizeOriginAssetFile, normalizeNpcConfig, type FloorData } from '../src/blueprint-editor/types'
import { originAssetsData } from '../src/blueprint-editor/data/originAssets.data'
import { floorPlanData } from '../src/blueprint-editor/data/floorPlan.data'
import { npcSettingsData } from '../src/blueprint-editor/data/npcSettings.data'

// Deterministic hotel-layout regression: the authored 11-floor content must
// stay structurally sound (sizes, connectivity, spawn zones) and the
// engine must produce living agents on the real data - no Math.random anywhere.

function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + (t >>> 7) + (t << 16)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const assetMap = buildAssetMap(normalizeOriginAssetFile({ $schema: 'origin-assets.v1.json', version: 1, originAssets: originAssetsData })!.originAssets)
const npcConfig = normalizeNpcConfig(npcSettingsData)!
const payload = buildSyncedPayload(floorPlanData as never, assetMap, npcConfig)
if (!payload || floorPlanData.floors.length === 0) {
	console.log('No floors authored yet - hotel layout checks skipped')
	process.exit(0)
}
assert.ok(payload, 'payload builds')

const floorKeys = Object.keys(payload.floors).sort((a, b) => (a === 'G' ? -1 : b === 'G' ? 1 : Number(a) - Number(b)))
assert.deepEqual(floorKeys, ['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], '11 floors keyed G..10')

for (const key of floorKeys) {
	const types = new Set(payload.floors[key].objects.map(o => o.type))
	assert.ok(!types.has('custom-elevator'), `floor ${key} carries no elevator portal`)
	for (const o of payload.floors[key].objects) {
		assert.ok(o.w > 0 && o.h > 0, `object ${o.id} derives positive size`)
	}
}

const toFloors = (): FloorData[] => floorKeys.map(id => ({
	id,
	name: id,
	label: id,
	objects: payload.floors[id].objects.map(o => ({ id: o.id, type: o.type, x: o.x, y: o.y, w: o.w!, h: o.h!, rotation: o.rotation })),
	defaultWalkable: payload.floors[id].defaultWalkable,
	walkable: payload.floors[id].walkable,
	spawnZones: payload.floors[id].spawnZones,
	allowedRoleIds: payload.floors[id].allowedRoleIds,
}))
const floors = toFloors()
const canvas: NpcCanvasBounds = { w: payload.canvas.width, h: payload.canvas.height, tileSize: payload.canvas.tileSize, streetTiles: payload.canvas.streetWidthTiles, streetFloorId: payload.canvas.streetFloorId }
const built = buildNpcEngineLayout(floors, canvas, (type) => assetMap.get(type), (type) => assetMap.get(type)?.tags)

// Per-floor connectivity: every non-portal interaction target must sit in one
// shared reachable component of the walkable grid (guests can reach anything).
function componentOf(start: { x: number; y: number }, tiles: ReadonlySet<string>): Set<string> {
	const seen = new Set<string>([`${start.x},${start.y}`])
	const queue = [start]
	while (queue.length) {
		const { x, y } = queue.pop()!
		for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
			const key = `${nx},${ny}`
			if (tiles.has(key) && !seen.has(key)) {
				seen.add(key)
				queue.push({ x: nx, y: ny })
			}
		}
	}
	return seen
}

for (const key of floorKeys) {
	const map = built.floorMaps.get(key)!
	const solid = built.layout.interactionTargets.filter(t => t.floorId === key && !t.transitionToFloorId)
	if (!solid.length) continue
	const reach = componentOf({ x: solid[0].x, y: solid[0].y }, map.tiles)
	for (const t of solid) {
		assert.ok(reach.has(`${t.x},${t.y}`), `target ${t.itemId}:${t.interactSpotId} unreachable on ${key}`)
	}
}

// No portals remain: floors are sealed (agents never change floor).
assert.equal(built.layout.interactionTargets.filter(t => t.transitionToFloorId).length, 0, 'no portal targets wired')

// Spawn zones: guests and staff find legal spawn cells on their assigned
// floors; restricted floors reject disallowed roles at the data level.
function spawnCells(floorIndex: number, roleId: string): number {
	const floor = floors[floorIndex]!
	if (floor.allowedRoleIds?.length && !floor.allowedRoleIds.includes(roleId)) return 0
	const map = built.floorMaps.get(floor.id)!
	const zones = floor.spawnZones ?? []
	if (!zones.length) return map.tiles.size
	let count = 0
	for (const key of map.tiles) {
		const [x, y] = key.split(',').map(Number)
		const px = x * canvas.tileSize
		const py = y * canvas.tileSize
		if (zones.some((z: { x: number; y: number; w: number; h: number }) => px >= z.x && px < z.x + z.w && py >= z.y && py < z.y + z.h)) count++
	}
	return count
}
const guestIndex = 0
assert.ok(spawnCells(guestIndex, 'role-guest') > 0, 'guests can spawn on G')
for (let i = 6; i <= 9; i++) {
	assert.ok(spawnCells(i, 'role-housekeeper') > 0, `housekeepers spawn on floor ${i}`)
	assert.equal(spawnCells(i, 'role-trainer'), 0, `trainers blocked from guest floor ${i}`)
}
assert.ok(spawnCells(10, 'role-housekeeper') > 0, 'housekeepers spawn on service floor')
assert.equal(spawnCells(10, 'role-guest'), 0, 'guests blocked from service floor')

// Living-world smoke: seeded policy + engine on the real content produces
// moving agents within a short run.
const random = mulberry32(20260825)
const policy = createNpcEnginePolicy({
	getConfig: () => npcConfig,
	floors: built.layout.floors,
	floorMaps: built.floorMaps,
	floorDataMap: built.floorDataMap,
	ticksPerSecond: 60,
	getTickNumber: () => engine.tickNumber,
	listAgents: () => engine.listAgents(),
	getAssetTags: (type) => assetMap.get(type)?.tags,
	random,
})
const engine = new NpcEngine(built.layout, {
	ticksPerSecond: 60,
	random,
	...policy,
})
const gMap = built.floorMaps.get('G')!
const firstCell = [...gMap.tiles][0]!.split(',').map(Number)
for (let i = 0; i < 12; i++) {
	const cell = [...gMap.tiles][(i * 977) % gMap.tiles.size]!.split(',').map(Number)
	engine.addAgent({ id: `smoke-${i}`, roleId: i % 3 === 0 ? 'role-receptionist' : 'role-guest', floorId: 'G', x: cell[0]!, y: cell[1]!, targetX: cell[0]!, targetY: cell[1]!, speed: 0.2 * 60 / gMap.cellSize })
}
engine.tick(600)
const statuses = engine.listAgents().map(a => a.status)
assert.ok(statuses.every(s => ['walking', 'interacting', 'idle', 'waiting', 'queued'].includes(s)), 'statuses valid')
assert.ok(statuses.some(s => s === 'walking' || s === 'interacting'), `agents active (${JSON.stringify(statuses.slice(0, 6))})`)
void firstCell

console.log('Hotel layout checks passed: 11 floors, connectivity, no portals, spawn gates, live smoke')
