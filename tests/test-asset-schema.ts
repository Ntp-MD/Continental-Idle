import assert from 'node:assert/strict'
import { ASSET_DEF_FIELD_COVERAGE, serializeAsset } from '../src/blueprint-editor/assetUtils'
import { normalizeOriginAsset } from '../src/blueprint-editor/types'
import type { AssetDef } from '../src/blueprint-editor/types'

// Sample fixture must populate EVERY AssetDef field (see ASSET_DEF_FIELD_COVERAGE).
// When adding a field to AssetDef (types.ts): add it to ASSET_DEF_FIELD_COVERAGE
// (typecheck fails otherwise), then extend this fixture + serializeAsset + the
// updateAsset patch union in store/objects.ts / store/assets.ts.
const sample: AssetDef = {
	id: 'sample-1',
	name: 'Sample',
	category: 'Special',
	w: 2,
	h: 1,
	custom: true,
	isWall: false,
	walkable: true,
	entranceRequired: true,
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
	linkedParts: [{ type: 'sample-part', dx: 0, dy: 0, w: 25, h: 25 }],
	svg: '<rect x="0" y="0" width="50" height="25" fill="#8a97ab" stroke="#5c6675"/>',
	svgViewBox: { w: 50, h: 25 },
	svgRoles: [{ role: 'fixture', tag: 'g', attrs: {} }],
	walkableGrid: [[true]],
	tileStates: [['walkable']],
	tileEdges: [[{ top: true, right: true, bottom: true, left: true }]],
	interactSpots: [{ x: 12.5, y: 12.5 }],
	interact: { capacity: 1, durationMin: 1, durationMax: 3 },
	queue: { maxMembers: 3, admissionDepth: 4 },
}

{
	const covered = Object.keys(ASSET_DEF_FIELD_COVERAGE).sort()
	const fixtureKeys = Object.keys(sample).sort()
	assert.deepEqual(fixtureKeys, covered, 'test fixture is missing AssetDef fields — extend `sample`')
}

function assertSurvives(label: string, out: Record<string, unknown> | undefined): void {
	assert.ok(out, `${label}: output is undefined`)
	for (const key of Object.keys(sample)) {
		assert.ok(
			out[key] !== undefined,
			`${label} drops AssetDef field "${key}" — extend ${label} when adding schema fields`,
		)
	}
}

assertSurvives('serializeAsset', serializeAsset(JSON.parse(JSON.stringify(sample))) as unknown as Record<string, unknown>)
assertSurvives('normalizeOriginAsset', normalizeOriginAsset(JSON.parse(JSON.stringify(sample))) as unknown as Record<string, unknown>)

console.log('Asset schema coverage checks passed')
