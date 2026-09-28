import { test } from 'vitest'
import assert from 'node:assert/strict'
import { ASSET_DEF_FIELD_COVERAGE, OBJECT_DATA_FIELD_COVERAGE, serializeAsset, serializeObject } from '../../src/blueprint-editor/assets/assetUtils'
import { normalizeOriginAsset, resolveObjectDef } from '../../src/blueprint-editor/domain/types'
import type { AssetDef, ObjectData } from '../../src/blueprint-editor/domain/types'

// Sample fixture must populate EVERY AssetDef field (see ASSET_DEF_FIELD_COVERAGE).
// When adding a field to AssetDef (types.ts): add it to ASSET_DEF_FIELD_COVERAGE
// (typecheck fails otherwise), then extend this fixture + serializeAsset + the
// updateAsset patch union in src/blueprint-editor/store/assets.ts.
// svgRoles + walkableGrid are DERIVED (not persisted): they stay in the fixture
// because they are live in-memory fields, but serializeAsset must drop them.
const sample: AssetDef = {
	id: 'sample-1',
	name: 'Sample',
	w: 2,
	h: 1,
	walkable: true,
	doorRequired: true,
	defaultPadding: 2,
	defaultRx: { tl: 1, tr: 2, br: 3, bl: 4 },
	defaultFillColor: '#8a97ab',
	defaultStrokeColor: '#5c6675',
	defaultLabel: 'LBL',
	defaultRadius: 2,
	defaultLabelPadding: 3,
	defaultLocked: true,
	tags: ['portal'],
	origin: 'svg-import',
	pxW: 60,
	pxH: 30,
	usePx: true,
	svg: '<rect x="0" y="0" width="50" height="25" fill="#8a97ab" stroke="#5c6675"/>',
	svgViewBox: { w: 50, h: 25 },
	svgRoles: [{ role: 'fixture', tag: 'g', attrs: {} }],
	walkableGrid: [[true]],
	tileStates: [['walkable']],
	interactSpots: [{ x: 12.5, y: 12.5 }],
	interact: { capacity: 1, durationMin: 1, durationMax: 3 },
	queue: { maxMembers: 3, admissionDepth: 4 },
}

function assertSurvives(label: string, out: Record<string, unknown> | undefined, exempt: string[] = []): void {
	assert.ok(out, `${label}: output is undefined`)
	for (const key of Object.keys(sample)) {
		if (exempt.includes(key)) continue
		assert.ok(
			out[key] !== undefined,
			`${label} drops AssetDef field "${key}" - extend ${label} when adding schema fields`,
		)
	}
}

test('fixture covers every AssetDef field', () => {
	const covered = Object.keys(ASSET_DEF_FIELD_COVERAGE).sort()
	const fixtureKeys = Object.keys(sample).sort()
	assert.deepEqual(fixtureKeys, covered, 'test fixture is missing AssetDef fields - extend `sample`')
})

test('serializeAsset and normalizeOriginAsset keep every field', () => {
	assertSurvives('serializeAsset', serializeAsset(JSON.parse(JSON.stringify(sample))) as unknown as Record<string, unknown>, ['svgRoles', 'walkableGrid'])
	assertSurvives('normalizeOriginAsset', normalizeOriginAsset(JSON.parse(JSON.stringify(sample))) as unknown as Record<string, unknown>)
})

test('derived fields are not persisted, legacy values still load, resolve derives from tileStates', () => {
	const serialized = serializeAsset(JSON.parse(JSON.stringify(sample)) as AssetDef)
	assert.equal('svgRoles' in serialized, false, 'derived svgRoles are not persisted')
	assert.equal('walkableGrid' in serialized, false, 'derived walkableGrid is not persisted')
	const legacy = normalizeOriginAsset(JSON.parse(JSON.stringify(sample)))
	assert.deepEqual(legacy?.svgRoles, [{ role: 'fixture', tag: 'g' }], 'legacy persisted svgRoles still load')
	assert.deepEqual(legacy?.walkableGrid, sample.walkableGrid, 'legacy persisted walkableGrid still loads')
	const statesOnly: AssetDef = { id: 'states-only', name: 'States Only', w: 1, h: 1, tileStates: [['door']] }
	const resolved = resolveObjectDef(0, statesOnly, { w: 25, h: 25 })
	assert.deepEqual(resolved.walkableGrid, [[true]], 'resolve derives the grid from tileStates when none is stored')
	assert.deepEqual(resolved.tileStates, [['door']], 'tileStates pass through untouched')
})

// When adding a field to ObjectData (domain/schema/objects.ts) typecheck fails until it is
// classified here; then this test fails until serializeObject matches the classification.
test('serializeObject writes exactly the fields the object manifest marks persisted', () => {
	const full: ObjectData = {
		id: 'o1', type: 'grill', x: 10, y: 20, w: 30, h: 40, rotation: 90,
		linkGroupId: 'g1', locked: true, fillColor: '#ffffff', strokeColor: '#000000',
		radius: 2, rx: { tl: 1, tr: 2, br: 3, bl: 4 }, labelPadding: 5, padding: 6,
		collapsed: true, label: 'Grill',
	}
	assert.deepEqual(
		Object.keys(full).sort(),
		Object.keys(OBJECT_DATA_FIELD_COVERAGE).sort(),
		'the sample object must exercise every manifest key - extend it with the new field',
	)

	const persisted = (Object.keys(OBJECT_DATA_FIELD_COVERAGE) as (keyof ObjectData)[])
		.filter(key => OBJECT_DATA_FIELD_COVERAGE[key] === 'persisted')
	const derived = (Object.keys(OBJECT_DATA_FIELD_COVERAGE) as (keyof ObjectData)[])
		.filter(key => OBJECT_DATA_FIELD_COVERAGE[key] === 'derived')

	const out = serializeObject(full) as unknown as Record<string, unknown>
	assert.deepEqual(
		Object.keys(out).sort(),
		[...persisted].sort(),
		'serializeObject must write every persisted field and no derived one',
	)
	for (const key of derived) {
		assert.equal(out[key], undefined, `derived ObjectData field "${key}" must not reach the payload`)
	}
	assert.equal(persisted.length, 9, 'the persisted half of ObjectData is w/h-free by design')
})
