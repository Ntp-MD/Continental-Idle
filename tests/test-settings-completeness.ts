import assert from 'node:assert/strict'
import { collectFloorEntrances, isGuestRoleId, validateSettingsCompleteness } from '../src/blueprint-editor/assets/assetUtils'
import { CANVAS_WALL_OBJECT_TYPE } from '../src/blueprint-editor/domain/types'
import type { AssetDef, FloorLayoutData, NpcSimulationConfig, ObjectData } from '../src/blueprint-editor/domain/types'

const STREET_HINT_SNIPPET = 'need a street-side spawn zone'
const ENTRANCE_HINT_SNIPPET = 'need an entrance door'

const CANVAS = { width: 800, height: 600, tileSize: 25 }

function makeLayout(opts: {
	streetFloorId?: string
	zones?: { x: number; y: number; w: number; h: number; roleIds?: string[] }[]
	objects?: ObjectData[]
}): FloorLayoutData {
	const floor: FloorLayoutData['floors'][number] = { id: 'F1', name: 'Lobby', label: 'Lobby', objects: opts.objects ?? [] }
	if (opts.zones) {
		floor.spawnZones = opts.zones.map((zone, i) => ({ id: `zone-${i}`, label: `Z${i}`, ...zone }))
	}
	return {
		version: 1,
		canvas: CANVAS,
		floors: [floor],
		streetWidthTiles: 8,
		...(opts.streetFloorId ? { streetFloorId: opts.streetFloorId } : {}),
	}
}

function makeConfig(pool: { roleId: string; count: number; floorIds?: string[] }[]): NpcSimulationConfig {
	return {
		speed: 1 / 30,
		defaultRoleId: 'role-guest',
		roles: [
			{ id: 'role-guest', label: 'Guest', color: '#8ecae6', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0 },
			{ id: 'role-staff', label: 'Staff', color: '#b08d57', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0 },
		],
		tasks: [],
		pool,
		crossFloorCooldownSeconds: 30, progressWatchdogTicks: 120, maxRepathAttempts: 4,
		repathCooldownSeconds: 2, repathCooldownExponent: 1.5, pathBudgetMinPerTick: 2,
		pathBudgetAgentsPerCall: 100, chooseTargetMinPerTick: 8, chooseTargetAgentsPerSlot: 20,
		wanderMemorySize: 32, wanderSmallMapThreshold: 8, triggerRatePeriodSeconds: 60,
		frameSimBudgetMs: 6, maxSimulationSteps: 8,
	}
}

function hasStreetHint(issues: string[]): boolean {
	return issues.some(issue => issue.includes(STREET_HINT_SNIPPET))
}

function hasEntranceHint(issues: string[]): boolean {
	return issues.some(issue => issue.includes(ENTRANCE_HINT_SNIPPET))
}

// ── Entrance fixtures (plan A4c): only doors crossing the street ring count ──
const doorAsset: AssetDef = {
	id: 'door-asset',
	name: 'Door',
	category: 'Special',
	w: 1,
	h: 2,
	custom: true,
	isWall: true,
	wallSegments: [{ x1: 0, y1: 0, x2: 0, y2: 2, door: true }],
	walkable: false,
	doorRequired: true,
	defaultPadding: 0,
	defaultRx: { tl: 0, tr: 0, br: 0, bl: 0 },
	defaultFillColor: '#8a97ab',
	defaultStrokeColor: '#5c6675',
	defaultLabel: 'DR',
	defaultRadius: 0,
	defaultLabelPadding: 0,
	defaultLocked: false,
	tags: [],
	origin: 'svg-import',
	pxW: 25,
	pxH: 50,
	usePx: false,
	svg: '<rect x="0" y="0" width="25" height="50" fill="#8a97ab" stroke="#5c6675"/>',
	svgViewBox: { w: 25, h: 50 },
	svgRoles: [],
	walkableGrid: [[true], [true]],
	tileStates: [['walkable'], ['walkable']],
	interactSpots: [],
	interact: { capacity: 1, durationMin: 1, durationMax: 3 },
	queue: { maxMembers: 3, admissionDepth: 4 },
}
const doorAssetMap = new Map<string, AssetDef>([['door-asset', doorAsset]])
const topBoundaryDoor: ObjectData = { id: 'wall-door-top', type: CANVAS_WALL_OBJECT_TYPE, x: 300, y: 200, w: 50, h: 25, rotation: 0, isWall: true, x1: 12, y1: 8, x2: 14, y2: 8, door: true }
const interiorDoor: ObjectData = { id: 'wall-door-in', type: CANVAS_WALL_OBJECT_TYPE, x: 300, y: 300, w: 50, h: 25, rotation: 0, isWall: true, x1: 12, y1: 12, x2: 14, y2: 12, door: true }
const streetOnlyDoor: ObjectData = { id: 'wall-door-st', type: CANVAS_WALL_OBJECT_TYPE, x: 50, y: 100, w: 50, h: 25, rotation: 0, isWall: true, x1: 2, y1: 4, x2: 4, y2: 4, door: true }
const assetDoorObject: ObjectData = { id: 'asset-door-1', type: 'door-asset', x: 600, y: 250, w: 25, h: 50, rotation: 0, isWall: true }

assert.equal(isGuestRoleId('role-guest'), true)
assert.equal(isGuestRoleId('role-bartender'), false)
console.log('guest role id predicate passed')

// Sidewalk zone (any-role) on the street floor satisfies the convention.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), false)
	console.log('street hint absent with sidewalk zone passed')
}

// Sidewalk zone served but no street-connecting door: entrance hint fires.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasEntranceHint(result.issues), true)
	console.log('entrance hint present without doors passed')
}

// Entrance hint clears once a ring-boundary door exists.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }], objects: [topBoundaryDoor] }),
		doorAssetMap,
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), false)
	assert.equal(hasEntranceHint(result.issues), false)
	console.log('entrance hint absent with boundary door passed')
}

// Interior-only doors do not clear the entrance hint.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }], objects: [interiorDoor] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasEntranceHint(result.issues), true)
	console.log('entrance hint present with interior door passed')
}

// Hints are mutually exclusive: missing zone reports the zone hint only.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	assert.equal(hasEntranceHint(result.issues), false)
	console.log('hints mutually exclusive passed')
}

// Interior-only zone does not satisfy the convention.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 300, y: 250, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	console.log('street hint present with interior zone passed')
}

// Zone exactly outside the street band does not count as sidewalk.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 200, y: 200, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	console.log('street hint band edge passed')
}

// No zones at all: hint present.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	console.log('street hint present without zones passed')
}

// Sub-tile zone fully inside the sidewalk can never spawn a guest: hint must fire.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 190, y: 190, w: 4, h: 4 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	console.log('street hint present for sub-tile sidewalk zone passed')
}

// No street floor configured: hint suppressed (A7.11).
{
	const result = validateSettingsCompleteness(
		makeLayout({}),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), false)
	console.log('street hint suppressed without street floor passed')
}

// Guest pool restricted away from the street floor: hint suppressed (A7.15).
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6, floorIds: ['F2'] }]),
	)
	assert.equal(hasStreetHint(result.issues), false)
	console.log('street hint suppressed for non-street pool floors passed')
}

// Zone restricted to staff only does not serve guests.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100, roleIds: ['role-staff'] }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	console.log('street hint present for staff-only zone passed')
}

// Staff-only pool never triggers the hint.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-staff', count: 2 }]),
	)
	assert.equal(hasStreetHint(result.issues), false)
	console.log('street hint suppressed for staff pool passed')
}

// Street floor role restrictions exclude the guest role: hint suppressed.
{
	const layout = makeLayout({ streetFloorId: 'F1', zones: [{ x: 300, y: 250, w: 100, h: 100 }] })
	layout.floors[0].allowedRoleIds = ['role-staff']
	const result = validateSettingsCompleteness(layout, new Map(), makeConfig([{ roleId: 'role-guest', count: 6 }]))
	assert.equal(hasStreetHint(result.issues), false)
	console.log('street hint suppressed by floor role restriction passed')
}

// ── collectFloorEntrances (plan A4c): only doors crossing the street ring count ──
{
	const entrances = collectFloorEntrances(
		{ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [topBoundaryDoor, interiorDoor, streetOnlyDoor] },
		CANVAS,
		8,
		doorAssetMap,
	)
	assert.equal(entrances.length, 1, 'only the ring-boundary door is an entrance')
	assert.equal(entrances[0].ownerObjectId, 'wall-door-top')
	console.log('entrance derivation boundary-only passed')
}

{
	const entrances = collectFloorEntrances(
		{ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [assetDoorObject] },
		CANVAS,
		8,
		doorAssetMap,
	)
	assert.equal(entrances.length, 1, 'asset door on the ring boundary is an entrance')
	assert.equal(entrances[0].ownerObjectId, 'asset-door-1')
	assert.equal(entrances[0].centerX, 600)
	console.log('entrance derivation asset door passed')
}

{
	const entrances = collectFloorEntrances({ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [] }, CANVAS, 8, doorAssetMap)
	assert.equal(entrances.length, 0)
	console.log('entrance derivation empty floor passed')
}

console.log('settings completeness checks passed')
