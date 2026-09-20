import assert from 'node:assert/strict'
import { collectFloorEntrances, isGuestRoleId, validateSettingsCompleteness } from '../src/blueprint-editor/assets/validation'
import { EDITOR_FIELD_SPECS } from '../src/blueprint-editor/domain/types'
import { settingsFieldKeys } from '../src/blueprint-editor/components/modals/settingsFields'
import type { FloorLayoutData, NpcSimulationConfig, ObjectData, TileState } from '../src/blueprint-editor/domain/types'

const STREET_HINT_SNIPPET = 'need a street-side spawn zone'
const ENTRANCE_HINT_SNIPPET = 'need an entrance door'

const CANVAS = { width: 800, height: 600, tileSize: 25 }

function makeLayout(opts: {
	streetFloorId?: string
	zones?: { x: number; y: number; w: number; h: number; roleIds?: string[] }[]
	objects?: ObjectData[]
	doors?: Array<[number, number]>
}): FloorLayoutData {
	const floor: FloorLayoutData['floors'][number] = { id: 'F1', name: 'Lobby', label: 'Lobby', objects: opts.objects ?? [] }
	if (opts.zones) {
		floor.spawnZones = opts.zones.map((zone, i) => ({ id: `zone-${i}`, label: `Z${i}`, ...zone }))
	}
	if (opts.doors) {
		floor.walkable = makeWalkable(opts.doors)
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

// ── Entrance fixtures: door tiles crossing the street ring count ──
const GRID_COLS = 32
const GRID_ROWS = 24

function makeWalkable(doors: Array<[number, number]>): { walkableGrid: boolean[][]; tileStates: TileState[][] } {
	const tileStates: TileState[][] = Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => 'walkable' as TileState))
	for (const [x, y] of doors) tileStates[y][x] = 'door'
	return { walkableGrid: tileStates.map(row => row.map(() => true)), tileStates }
}

const BOUNDARY_DOOR: [number, number] = [12, 8]
const INTERIOR_DOOR: [number, number] = [16, 12]
const STREET_DOOR: [number, number] = [2, 4]
const EAST_BOUNDARY_DOOR: [number, number] = [23, 10]

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

// Entrance hint clears once a ring-boundary door tile exists.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }], doors: [BOUNDARY_DOOR] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), false)
	assert.equal(hasEntranceHint(result.issues), false)
	console.log('entrance hint absent with boundary door passed')
}

// Interior-only door tiles do not clear the entrance hint.
{
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }], doors: [INTERIOR_DOOR] }),
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

// ── collectFloorEntrances: only door tiles crossing the street ring count ──
{
	const entrances = collectFloorEntrances(
		{ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [], walkable: makeWalkable([BOUNDARY_DOOR, INTERIOR_DOOR, STREET_DOOR]) },
		CANVAS,
		8,
	)
	assert.equal(entrances.length, 1, 'only the ring-boundary door tile is an entrance')
	assert.deepEqual([entrances[0].x, entrances[0].y], BOUNDARY_DOOR)
	console.log('entrance derivation boundary-only passed')
}

{
	const entrances = collectFloorEntrances(
		{ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [], walkable: makeWalkable([EAST_BOUNDARY_DOOR]) },
		CANVAS,
		8,
	)
	assert.equal(entrances.length, 1, 'east ring-boundary door tile is an entrance')
	assert.deepEqual([entrances[0].x, entrances[0].y], EAST_BOUNDARY_DOOR)
	console.log('entrance derivation east door passed')
}

{
	const entrances = collectFloorEntrances({ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [] }, CANVAS, 8)
	assert.equal(entrances.length, 0)
	console.log('entrance derivation empty floor passed')
}

// Pool targeting a floor with no placed objects: spawn-with-nothing-to-do hint fires.
{
	const result = validateSettingsCompleteness(
		makeLayout({}),
		new Map(),
		makeConfig([{ roleId: 'role-staff', count: 2, floorIds: ['F1'] }]),
	)
	assert.ok(result.issues.some(issue => issue.includes('no placed objects')), 'pool->empty floor is flagged')
	console.log('empty-floor pool hint passed')
}

// Same pool against a furnished floor: no empty-floor hint.
{
	const layout = makeLayout({})
	layout.floors[0].objects = [{ id: 'o1', type: 'chair', x: 0, y: 0, rotation: 0, w: 20, h: 20 }]
	const result = validateSettingsCompleteness(
		layout,
		new Map(),
		makeConfig([{ roleId: 'role-staff', count: 2, floorIds: ['F1'] }]),
	)
	assert.equal(result.issues.some(issue => issue.includes('no placed objects')), false)
	console.log('empty-floor pool hint absent when furnished passed')
}

// 2x2 solid wall masses are surfaced (single-tile wall rule).
{
	const layout = makeLayout({})
	layout.floors[0].walkable = {
		walkableGrid: [[true, true], [true, true]],
		tileStates: [['blocked', 'blocked'], ['blocked', 'blocked']],
	}
	const result = validateSettingsCompleteness(layout, new Map(), makeConfig([{ roleId: 'role-staff', count: 2 }]))
	assert.ok(result.issues.some(issue => issue.includes('2x2')), 'solid wall mass flagged')
	console.log('2x2 wall mass hint passed')
}

// Spawn zone whose role has live work on the floor: no purposeless-zone hint.
{
	const assetMap = new Map([['stove', { id: 'stove', name: 'Stove', w: 1, h: 1, tags: ['cooking'] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'stove', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-staff'] }],
	})
	const config = makeConfig([{ roleId: 'role-staff', count: 1 }])
	config.roles.find(r => r.id === 'role-staff')!.taskIds = ['task-cook']
	config.tasks = [{ id: 'task-cook', label: 'Cook', tags: ['cooking'] }]
	const result = validateSettingsCompleteness(layout, assetMap, config)
	assert.equal(result.issues.some(issue => issue.includes('none of its tasks')), false)
	console.log('zoned role with live work is quiet passed')
}

// Zone spawns a tasked role but nothing on the floor matches: hint fires.
{
	const assetMap = new Map([['sofa', { id: 'sofa', name: 'Sofa', w: 1, h: 1, tags: ['lounge'] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'sofa', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-staff'] }],
	})
	const config = makeConfig([{ roleId: 'role-staff', count: 1 }])
	config.roles.find(r => r.id === 'role-staff')!.taskIds = ['task-cook']
	config.tasks = [{ id: 'task-cook', label: 'Cook', tags: ['cooking'] }]
	const result = validateSettingsCompleteness(layout, assetMap, config)
	assert.ok(result.issues.some(issue => issue.includes('none of its tasks')), 'purposeless zone is flagged')
	console.log('zoned role with dead tasks hint passed')
}

// Task-less wanderer in a zone: exempt, no hint.
{
	const assetMap = new Map([['sofa', { id: 'sofa', name: 'Sofa', w: 1, h: 1, tags: ['lounge'] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'sofa', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-guest'] }],
	})
	const result = validateSettingsCompleteness(layout, assetMap, makeConfig([{ roleId: 'role-guest', count: 1 }]))
	assert.equal(result.issues.some(issue => issue.includes('none of its tasks')), false)
	console.log('taskless wanderer exempt passed')
}

// Post-bound task: live post name is quiet, renamed post fires the hint.
{
	const assetMap = new Map([['desk', { id: 'desk', name: 'Desk', w: 1, h: 1, tags: ['front-desk'], interactSpots: [{ kind: 'stand', x: 1, y: 1, post: 'station' }] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'desk', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-staff'] }],
	})
	const config = makeConfig([{ roleId: 'role-staff', count: 1 }])
	config.roles.find(r => r.id === 'role-staff')!.taskIds = ['task-desk']
	config.tasks = [{ id: 'task-desk', label: 'Desk', tags: [], post: { assetId: 'desk', post: 'station' } }]
	assert.equal(validateSettingsCompleteness(layout, assetMap, config).issues.some(issue => issue.includes('none of its tasks')), false)
	config.tasks[0].post = { assetId: 'desk', post: 'renamed' }
	assert.ok(validateSettingsCompleteness(layout, assetMap, config).issues.some(issue => issue.includes('none of its tasks')), 'renamed post flagged')
	console.log('post-bound zone purpose passed')
}

// Every editor field spec has a Settings modal row (no silent omissions).
{
	const covered = new Set(settingsFieldKeys())
	const missing = (Object.keys(EDITOR_FIELD_SPECS) as (keyof typeof EDITOR_FIELD_SPECS)[]).filter(key => !covered.has(key))
	assert.deepEqual(missing, [], `spec keys missing from Settings modal: ${missing.join(', ')}`)
	console.log('settings modal field coverage passed')
}

console.log('settings completeness checks passed')
