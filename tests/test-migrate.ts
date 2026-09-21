import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from '../src/blueprint-editor/store/migrate'
import { readBlueprintDataFile, UnsupportedBlueprintVersionError, InvalidBlueprintDataError } from '../src/blueprint-editor/store/schemaMigration'
import { normalizeNpcConfig } from '../src/blueprint-editor/domain/types'
import { assetSizeFor } from '../src/blueprint-editor/domain/geometry'
import { seedOriginAssets } from '../src/blueprint-editor/store/seed'
const originAssets = await seedOriginAssets()

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

const layoutOnly = makeLayout()
const { npcConfig: topLevelNpc, ...layoutWithoutNpc } = layoutOnly as Record<string, unknown>
const result2b = migrate(layoutWithoutNpc, originAssets, topLevelNpc)
assert.equal(result2b.layout.npcConfig!.roles.length, 1, 'top-level npcConfig fallback should survive migration')
assert.equal(result2b.layout.npcConfig!.defaultRoleId, 'role-1', 'top-level defaultRoleId should survive migration')

const withSettings = migrate(makeLayout({ editorSettings: { dragThresholdPx: 7, npcDotSize: 9 } }), originAssets)
assert.equal(withSettings.layout.editorSettings?.dragThresholdPx, 7, 'editorSettings survive migration')
assert.equal(withSettings.layout.editorSettings?.npcDotSize, 9, 'editorSettings survive migration field by field')
const withoutSettings = migrate(makeLayout(), originAssets)
assert.equal(withoutSettings.layout.editorSettings, undefined, 'absent editorSettings stay absent after migration')

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

const withInvalidPlacement = makeLayout({
	floors: [makeFloor({
		objects: [
			{ id: 'obj-ok', type: validAsset.id, x: 0, y: 0, rotation: 0, w: 50, h: 25 },
			{ id: '', type: validAsset.id, x: 0, y: 0, rotation: 0, w: 50, h: 25 },
			{ id: 'obj-far', type: validAsset.id, x: 1e9, y: 0, rotation: 0, w: 50, h: 25 },
		],
	})],
})
const result8 = migrate(withInvalidPlacement, originAssets)
assert.equal(result8.layout.floors[0].objects.length, 1, 'objects with unusable placement are dropped, not corrupted')
assert.equal(result8.layout.floors[0].objects[0].id, 'obj-ok', 'surviving objects keep a valid id')

const withLegacyWall = makeLayout({
	floors: [makeFloor({
		objects: [
			{ id: 'wall-1', type: validAsset.id, x: 0, y: 0, rotation: 0, w: 0, h: 0, isWall: true, x1: 0, y1: 0, x2: 100, y2: 0 },
		],
	})],
})
const result6 = migrate(withLegacyWall, originAssets)
assert.equal(result6.layout.floors[0].objects.length, 1, 'legacy wall keys do not drop the object')
assert.equal(result6.layout.floors[0].objects[0].id, 'wall-1')
assert.equal('isWall' in result6.layout.floors[0].objects[0], false, 'legacy isWall key is stripped')

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

const lookSalvaged = normalizeNpcConfig({
	speed: 0.5,
	defaultRoleId: 'r1',
	roles: [
		{
			id: 'r1', label: 'Look', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0,
			appearance: {
				skinTones: ['#e7c19b', 'not-a-color', '#c08a5c', 42],
				trousers: '#2b2f38',
				hat: 'cap',
				hatColor: '#f5f5f0',
				junk: 'ignored',
			},
		},
		{
			id: 'r2', label: 'BrokenLook', color: '#000', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0,
			appearance: { skinTones: 'nope', trousers: 'not-a-color', hat: 'sombrero', hatColor: 7 },
		},
		{ id: 'r3', label: 'EmptyLook', color: '#000', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0, appearance: { junk: 1 } },
	],
	tasks: [],
	pool: [{ roleId: 'r1', count: 2 }, { roleId: 'r2', count: 1 }, { roleId: 'r3', count: 1 }],
})
assert.ok(lookSalvaged, 'lenient appearance: roles survive bad appearance fields')
assert.equal(lookSalvaged!.roles.length, 3, 'no role is dropped for a bad appearance')
const lookRole = lookSalvaged!.roles[0]
assert.deepEqual(lookRole.appearance, { skinTones: ['#e7c19b', '#c08a5c'], trousers: '#2b2f38', hat: 'cap', hatColor: '#f5f5f0' }, 'invalid tones/colors dropped, junk stripped')
assert.equal(lookSalvaged!.roles[1].appearance, undefined, 'fully-invalid appearance is dropped, not kept as empty object')
assert.equal(lookSalvaged!.roles[2].appearance, undefined, 'appearance with only junk keys is dropped')
assert.equal(lookSalvaged!.pool.length, 3, 'pool entries survive alongside appearance salvage')

const cap8 = normalizeNpcConfig({
	speed: 0.5,
	defaultRoleId: 'r1',
	roles: [{ id: 'r1', label: 'Cap', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0, appearance: { skinTones: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777', '#888888', '#999999', '#aaaaaa'] } }],
	tasks: [],
	pool: [],
})
assert.ok(cap8)
assert.equal(cap8!.roles[0].appearance?.skinTones?.length, 8, 'skinTones capped at 8')

const roundTripped = migrate(makeLayout(), originAssets)
const reMigrated = migrate(JSON.parse(JSON.stringify(roundTripped.layout)), originAssets)
assert.deepEqual(reMigrated.layout.floors[0].id, roundTripped.layout.floors[0].id, 'round-trip should be stable')
assert.equal(reMigrated.layout.npcConfig!.roles.length, roundTripped.layout.npcConfig!.roles.length)

const lookRoundTripped = normalizeNpcConfig({
	speed: 0.5,
	defaultRoleId: 'r1',
	roles: [{ id: 'r1', label: 'RT', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0, appearance: { skinTones: ['#c08a5c'], hat: 'boater' } }],
	tasks: [],
	pool: [],
})
const reNormalized = normalizeNpcConfig(JSON.parse(JSON.stringify(lookRoundTripped)))
assert.deepEqual(reNormalized!.roles[0].appearance, lookRoundTripped!.roles[0].appearance, 'appearance survives a normalize round-trip')

const fixturePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'blueprint-data.v2.golden.json')
const golden = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')) as Record<string, unknown>

const loaded = readBlueprintDataFile(golden)
assert.deepEqual(JSON.parse(JSON.stringify(loaded)), golden, 'golden fixture round-trips through the loader unchanged')

const idempotent = readBlueprintDataFile(JSON.parse(JSON.stringify(loaded)))
assert.deepEqual(JSON.parse(JSON.stringify(idempotent)), golden, 'loading a loaded file is idempotent')

assert.throws(() => readBlueprintDataFile({ ...golden, version: 999 }), UnsupportedBlueprintVersionError, 'a newer file version is rejected explicitly')
assert.throws(() => readBlueprintDataFile({ ...golden, version: 'two' }), InvalidBlueprintDataError, 'a non-numeric version is rejected')
assert.throws(() => readBlueprintDataFile({ ...golden, $schema: undefined }), InvalidBlueprintDataError, 'a missing schema is rejected')
assert.throws(() => readBlueprintDataFile(null), InvalidBlueprintDataError, 'a null payload is rejected')
assert.throws(() => readBlueprintDataFile({ ...golden, originAssets: 'nope' }), InvalidBlueprintDataError, 'a malformed payload is rejected instead of silently dropped')
assert.equal((readBlueprintDataFile(golden).layout.floors.length), 1, 'the loaded file keeps its floors')

const zeroSize = migrate(makeLayout({
	floors: [makeFloor({
		objects: [{ id: 'obj-zero', type: validAsset.id, x: 50, y: 50, rotation: 0, w: 0, h: 0 }],
	})],
}), originAssets)
const enriched = zeroSize.layout.floors[0].objects[0]
const expectedSize = assetSizeFor(validAsset.id, 0, 25, originAssets)
assert.ok(expectedSize, 'test asset resolves a size')
assert.equal(enriched.w, expectedSize!.w, 'persisted w:0 is re-derived from the live asset on ingress')
assert.equal(enriched.h, expectedSize!.h, 'persisted h:0 is re-derived from the live asset on ingress')

console.log('Migration salvage checks passed')
