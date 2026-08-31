import assert from 'node:assert/strict'
import { migrate } from '../src/blueprint-editor/store/migrate'
import { normalizeNpcConfig, CANVAS_WALL_OBJECT_TYPE } from '../src/blueprint-editor/types'
import { originAssets } from '../src/blueprint-editor/store/dataLoader'

const validAsset = originAssets[0]
if (!validAsset) throw new Error('test requires at least one origin asset')

function makeFloor(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'floor-1',
		name: 'Ground',
		label: 'G',
		objects: [],
		defaultWalkable: true,
		...overrides,
	}
}

function makeLayout(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		version: 3,
		canvas: { width: 1600, height: 1200, tileSize: 25 },
		floors: [makeFloor()],
		npcConfig: {
			speed: 0.2,
			defaultRoleId: 'role-1',
			roles: [{
				id: 'role-1',
				label: 'Guest',
				color: '#3794ff',
				focusTags: [],
				restrictedTags: [],
				taskIds: [],
				focusChance: 70,
			}],
			tasks: [],
			pool: [],
		},
		...overrides,
	}
}

const result = migrate(makeLayout(), originAssets)
assert.ok(result.layout, 'migrate should return a layout')
assert.equal(result.layout.floors.length, 1, 'should preserve floor count')
assert.equal(result.layout.floors[0].id, 'floor-1')
assert.equal(result.layout.npcConfig!.roles.length, 1)
assert.equal(result.layout.npcConfig!.roles[0].id, 'role-1')

assert.throws(() => migrate(null, originAssets), /Cannot migrate invalid layout data/)
assert.throws(() => migrate('not-an-object', originAssets), /Cannot migrate invalid layout data/)

const result2 = migrate(makeLayout({ npcConfig: undefined }), originAssets)
assert.ok(result2.layout.npcConfig, 'missing npcConfig should produce empty config')
assert.equal(result2.layout.npcConfig.roles.length, 0)

const badNpc = makeLayout({
	npcConfig: {
		speed: 0.2,
		defaultRoleId: 'role-1',
		roles: [
			{ id: 'role-1', label: 'Good', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 50 },
			{ id: 'role-2', label: 'Bad', color: '#000' },
		],
		tasks: [],
		pool: [],
	},
})
const result3 = migrate(badNpc, originAssets)
assert.equal(result3.layout.npcConfig!.roles.length, 1, 'partial salvage: bad role dropped, good role kept')
assert.equal(result3.layout.npcConfig!.roles[0].id, 'role-1')

const allBadNpc = makeLayout({
	npcConfig: {
		speed: 0.2,
		defaultRoleId: 'x',
		roles: [{ id: 'r', label: 'Bad' }],
		tasks: [],
		pool: [],
	},
})
const result4 = migrate(allBadNpc, originAssets)
assert.equal(result4.layout.npcConfig!.roles.length, 0, 'all roles invalid -> empty config (not crash)')

const withObject = makeLayout({
	floors: [makeFloor({
		objects: [
			{ id: 'obj-1', type: validAsset.id, x: 0, y: 0, rotation: 0, w: 50, h: 25 },
			{ id: 'obj-2', type: 'nonexistent-asset', x: 0, y: 0, rotation: 0, w: 50, h: 25 },
		],
	})],
})
const result5 = migrate(withObject, originAssets)
assert.equal(result5.layout.floors[0].objects.length, 1, 'object with unknown asset type should be filtered out')
assert.equal(result5.layout.floors[0].objects[0].id, 'obj-1')

const withWall = makeLayout({
	floors: [makeFloor({
		objects: [
			{ id: 'wall-1', type: CANVAS_WALL_OBJECT_TYPE, x: 0, y: 0, rotation: 0, w: 0, h: 0, isWall: true, x1: 0, y1: 0, x2: 100, y2: 0 },
		],
	})],
})
const result6 = migrate(withWall, originAssets)
assert.equal(result6.layout.floors[0].objects.length, 1, 'wall objects should survive asset lookup (isWall bypass)')
assert.equal(result6.layout.floors[0].objects[0].id, 'wall-1')

const withBadFloor = makeLayout({
	floors: [
		{ id: 'floor-bad', name: 'Bad', label: 'X' },
		makeFloor(),
	],
})
const result7 = migrate(withBadFloor, originAssets)
assert.ok(result7.layout.floors.length >= 1, 'floors missing objects array should get empty objects')

const salvaged = normalizeNpcConfig({
	speed: 0.5,
	defaultRoleId: 'r1',
	roles: [
		{ id: 'r1', label: 'Good', color: '#fff', focusTags: ['a'], restrictedTags: [], taskIds: [], focusChance: 50 },
		{ id: 'r2', label: 'NoChance', color: '#000', focusTags: [], restrictedTags: [], taskIds: [] },
		{ id: 'r3', label: 'NoTags', color: '#000', focusChance: 50 },
		'not-an-object',
	],
	tasks: [
		{ id: 't1', label: 'Task1', tags: ['a'] },
		{ id: 't2', label: 'BadTask' },
	],
	pool: [
		{ roleId: 'r1', count: 5 },
		{ roleId: 'r2', count: 3 },
		{ roleId: 'nonexistent', count: 1 },
	],
})
assert.ok(salvaged, 'normalizeNpcConfig should salvage partial config')
assert.equal(salvaged!.roles.length, 1, 'only valid role survives')
assert.equal(salvaged!.roles[0].id, 'r1')
assert.equal(salvaged!.tasks.length, 1, 'only valid task survives')
assert.equal(salvaged!.tasks[0].id, 't1')
assert.equal(salvaged!.pool.length, 1, 'pool entries for dropped roles filtered out')
assert.equal(salvaged!.pool[0].roleId, 'r1')

const noRoles = normalizeNpcConfig({
	speed: 0.5,
	defaultRoleId: 'x',
	roles: [{ id: 'r', label: 'Bad' }],
	tasks: [],
	pool: [],
})
assert.equal(noRoles, undefined, 'no valid roles -> undefined (caller falls back to empty)')

const notObject = normalizeNpcConfig('not-an-object')
assert.equal(notObject, undefined)

const badSpeed = normalizeNpcConfig({ speed: 'fast', defaultRoleId: '', roles: [], tasks: [], pool: [] })
assert.equal(badSpeed, undefined, 'non-number speed -> undefined')

const roundTripped = migrate(makeLayout(), originAssets)
const reMigrated = migrate(JSON.parse(JSON.stringify(roundTripped.layout)), originAssets)
assert.deepEqual(reMigrated.layout.floors[0].id, roundTripped.layout.floors[0].id, 'round-trip should be stable')
assert.equal(reMigrated.layout.npcConfig!.roles.length, roundTripped.layout.npcConfig!.roles.length)

console.log('Migration salvage checks passed')
