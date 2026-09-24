import { test } from 'vitest'
import assert from 'node:assert/strict'
import { collectFloorEntrances, isGuestRoleId, validateSettingsCompleteness } from '../../src/blueprint-editor/assets/validation'
import { EDITOR_FIELD_SPECS, normalizeEditorSettings } from '../../src/blueprint-editor/domain/types'
import { settingsFieldKeys } from '../../src/blueprint-editor/components/modals/settingsFields'
import type { FloorLayoutData, NpcSimulationConfig, ObjectData, TileState } from '../../src/blueprint-editor/domain/types'

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

test('guest role id predicate', () => {
	assert.equal(isGuestRoleId('role-guest'), true)
	assert.equal(isGuestRoleId('role-bartender'), false)
})

test('street hint absent and entrance hint fires for a served sidewalk zone, both clear with a boundary door', () => {
	const served = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(served.issues), false)
	assert.equal(hasEntranceHint(served.issues), true)

	const withBoundaryDoor = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }], doors: [BOUNDARY_DOOR] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(withBoundaryDoor.issues), false)
	assert.equal(hasEntranceHint(withBoundaryDoor.issues), false)

	const withInteriorDoor = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100 }], doors: [INTERIOR_DOOR] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasEntranceHint(withInteriorDoor.issues), true)
})

test('street hint fires for a missing zone and reports the zone hint only', () => {
	const result = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(result.issues), true)
	assert.equal(hasEntranceHint(result.issues), false)
})

test('street hint fires for interior, band-edge and sub-tile sidewalk zones', () => {
	const interior = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 300, y: 250, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(interior.issues), true)

	const bandEdge = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 200, y: 200, w: 100, h: 100 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(bandEdge.issues), true)

	// A sub-tile zone fully inside the sidewalk can never spawn a guest.
	const subTile = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 190, y: 190, w: 4, h: 4 }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(subTile.issues), true)
})

test('street hint suppresses without a street floor, for off-street pools and for staff-only roles', () => {
	const noStreetFloor = validateSettingsCompleteness(
		makeLayout({}),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(noStreetFloor.issues), false)

	const offStreetPool = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6, floorIds: ['F2'] }]),
	)
	assert.equal(hasStreetHint(offStreetPool.issues), false)

	const staffOnlyZone = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1', zones: [{ x: 50, y: 50, w: 100, h: 100, roleIds: ['role-staff'] }] }),
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(staffOnlyZone.issues), true)

	const staffPool = validateSettingsCompleteness(
		makeLayout({ streetFloorId: 'F1' }),
		new Map(),
		makeConfig([{ roleId: 'role-staff', count: 2 }]),
	)
	assert.equal(hasStreetHint(staffPool.issues), false)

	const restrictedFloorLayout = makeLayout({ streetFloorId: 'F1', zones: [{ x: 300, y: 250, w: 100, h: 100 }] })
	restrictedFloorLayout.floors[0].allowedRoleIds = ['role-staff']
	const restrictedFloor = validateSettingsCompleteness(
		restrictedFloorLayout,
		new Map(),
		makeConfig([{ roleId: 'role-guest', count: 6 }]),
	)
	assert.equal(hasStreetHint(restrictedFloor.issues), false)
})

test('collectFloorEntrances only counts door tiles crossing the street ring', () => {
	const entrances = collectFloorEntrances(
		{ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [], walkable: makeWalkable([BOUNDARY_DOOR, INTERIOR_DOOR, STREET_DOOR]) },
		CANVAS,
		8,
	)
	assert.equal(entrances.length, 1, 'only the ring-boundary door tile is an entrance')
	assert.deepEqual([entrances[0].x, entrances[0].y], BOUNDARY_DOOR)

	const eastEntrances = collectFloorEntrances(
		{ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [], walkable: makeWalkable([EAST_BOUNDARY_DOOR]) },
		CANVAS,
		8,
	)
	assert.equal(eastEntrances.length, 1, 'east ring-boundary door tile is an entrance')
	assert.deepEqual([eastEntrances[0].x, eastEntrances[0].y], EAST_BOUNDARY_DOOR)

	assert.equal(collectFloorEntrances({ id: 'F1', name: 'Lobby', label: 'Lobby', objects: [] }, CANVAS, 8).length, 0)
})

test('pool targeting a floor with no placed objects is flagged, a furnished floor is quiet', () => {
	const empty = validateSettingsCompleteness(
		makeLayout({}),
		new Map(),
		makeConfig([{ roleId: 'role-staff', count: 2, floorIds: ['F1'] }]),
	)
	assert.ok(empty.issues.some(issue => issue.includes('no placed objects')), 'pool->empty floor is flagged')

	const furnished = makeLayout({})
	furnished.floors[0].objects = [{ id: 'o1', type: 'chair', x: 0, y: 0, rotation: 0, w: 20, h: 20 }]
	const result = validateSettingsCompleteness(
		furnished,
		new Map(),
		makeConfig([{ roleId: 'role-staff', count: 2, floorIds: ['F1'] }]),
	)
	assert.equal(result.issues.some(issue => issue.includes('no placed objects')), false)
})

test('2x2 solid wall masses are surfaced (single-tile wall rule)', () => {
	const layout = makeLayout({})
	layout.floors[0].walkable = {
		walkableGrid: [[true, true], [true, true]],
		tileStates: [['blocked', 'blocked'], ['blocked', 'blocked']],
	}
	const result = validateSettingsCompleteness(layout, new Map(), makeConfig([{ roleId: 'role-staff', count: 2 }]))
	assert.ok(result.issues.some(issue => issue.includes('2x2')), 'solid wall mass flagged')
})

test('zone purpose: live work quiet, dead tasks flagged, task-less wanderer exempt', () => {
	const cookingAssetMap = new Map([['stove', { id: 'stove', name: 'Stove', w: 1, h: 1, tags: ['cooking'] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'stove', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-staff'] }],
	})
	const liveConfig = makeConfig([{ roleId: 'role-staff', count: 1 }])
	liveConfig.roles.find(r => r.id === 'role-staff')!.taskIds = ['task-cook']
	liveConfig.tasks = [{ id: 'task-cook', label: 'Cook', tags: ['cooking'] }]
	const live = validateSettingsCompleteness(layout, cookingAssetMap, liveConfig)
	assert.equal(live.issues.some(issue => issue.includes('none of its tasks')), false)

	const sofaAssetMap = new Map([['sofa', { id: 'sofa', name: 'Sofa', w: 1, h: 1, tags: ['lounge'] } as never]])
	const deadLayout = makeLayout({
		objects: [{ id: 'o1', type: 'sofa', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-staff'] }],
	})
	const deadConfig = makeConfig([{ roleId: 'role-staff', count: 1 }])
	deadConfig.roles.find(r => r.id === 'role-staff')!.taskIds = ['task-cook']
	deadConfig.tasks = [{ id: 'task-cook', label: 'Cook', tags: ['cooking'] }]
	const dead = validateSettingsCompleteness(deadLayout, sofaAssetMap, deadConfig)
	assert.ok(dead.issues.some(issue => issue.includes('none of its tasks')), 'purposeless zone is flagged')

	const wandererLayout = makeLayout({
		objects: [{ id: 'o1', type: 'sofa', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
		zones: [{ x: 0, y: 0, w: 100, h: 100, roleIds: ['role-guest'] }],
	})
	const wanderer = validateSettingsCompleteness(wandererLayout, sofaAssetMap, makeConfig([{ roleId: 'role-guest', count: 1 }]))
	assert.equal(wanderer.issues.some(issue => issue.includes('none of its tasks')), false)
})

test('post-bound task stays quiet on the live post name and fires once the post is renamed', () => {
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
})

test('role focus tags: unmatched fires, matched and defined stays quiet', () => {
	const assetMap = new Map([['sofa', { id: 'sofa', name: 'Sofa', w: 1, h: 1, tags: ['lounge'] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'sofa', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
	})
	const config = makeConfig([{ roleId: 'role-staff', count: 1 }])
	config.roles.find(r => r.id === 'role-staff')!.focusTags = ['sauna']
	assert.ok(validateSettingsCompleteness(layout, assetMap, config).issues.some(issue => issue.includes('focuses on tags')), 'unmatched focus tags flagged')

	const matched = makeConfig([{ roleId: 'role-staff', count: 1 }])
	matched.roles.find(r => r.id === 'role-staff')!.focusTags = ['lounge']
	const result = validateSettingsCompleteness(layout, assetMap, matched, new Set(['lounge']))
	assert.equal(result.issues.some(issue => issue.includes('focuses on tags')), false)
	assert.equal(result.issues.some(issue => issue.includes('undefined tags')), false)
})

test('undefined role/task tags are flagged only when the managed set is passed', () => {
	const assetMap = new Map([['sofa', { id: 'sofa', name: 'Sofa', w: 1, h: 1, tags: ['lounge'] } as never]])
	const layout = makeLayout({
		objects: [{ id: 'o1', type: 'sofa', x: 0, y: 0, rotation: 0, w: 20, h: 20 }],
	})
	const config = makeConfig([{ roleId: 'role-staff', count: 1 }])
	config.roles.find(r => r.id === 'role-staff')!.focusTags = ['lounge']
	config.roles.find(r => r.id === 'role-staff')!.taskIds = ['task-lounge']
	config.tasks = [{ id: 'task-lounge', label: 'Lounge', tags: ['lounge'] }]
	const result = validateSettingsCompleteness(layout, assetMap, config, new Set<string>())
	assert.ok(result.issues.some(issue => issue.includes('Role "Staff" uses undefined tags')), 'orphan role tag flagged')
	assert.ok(result.issues.some(issue => issue.includes('Task "Lounge" uses undefined tags')), 'orphan task tag flagged')

	const quiet = validateSettingsCompleteness(layout, assetMap, config)
	assert.equal(quiet.issues.some(issue => issue.includes('undefined tags')), false, 'orphan check skipped without the managed set')
})

test('alignTolerancePx round-trips through normalize and clamps to spec', () => {
	assert.equal(normalizeEditorSettings({ alignTolerancePx: 10 }).alignTolerancePx, 10)
	assert.equal(normalizeEditorSettings({ alignTolerancePx: 99 }).alignTolerancePx, 6, 'over-max falls back to default')
	assert.equal(normalizeEditorSettings({}).alignTolerancePx, 6, 'missing key falls back to default')
})

test('every editor field spec has a Settings modal row (no silent omissions)', () => {
	const covered = new Set(settingsFieldKeys())
	const missing = (Object.keys(EDITOR_FIELD_SPECS) as (keyof typeof EDITOR_FIELD_SPECS)[]).filter(key => !covered.has(key))
	assert.deepEqual(missing, [], `spec keys missing from Settings modal: ${missing.join(', ')}`)
})
