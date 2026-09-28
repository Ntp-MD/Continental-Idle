/**
 * fixtures.ts - the failure library, as executable negative examples.
 *
 * Research that only collects good architecture teaches an agent what to aim at and nothing about
 * what to reject. Every fixture here is a deliberately broken plan, written as ASCII so the defect
 * is visible before it is measured, paired with the finding ids it must produce and the reason it
 * is bad. The library is the suite's own test: a validator that cannot catch a known-bad plan is
 * not a validator, and a validator that fires on a known-good plan is noise.
 *
 * Fixture plans are parsed into host tile states, so the fixtures go through the same migrate ->
 * buildNpcEngineLayout path as authored content. Nothing here bypasses the engine.
 */
import type { AssetDef } from '../../src/blueprint-editor/domain/types'

export const FIXTURE_TILE_SIZE = 20

/**
 * The host models a street ring on one floor, and `migrate` rejects a street width below
 * MIN_STREET_WIDTH_TILES - an undefined width silently falls back to the engine default, which
 * on a small fixture swallows the whole plan and makes walls walkable. So every fixture is padded
 * with a real street margin and declares itself the street floor: the padding is site, the plan
 * inside it is the building.
 */
export const FIXTURE_STREET_TILES = 5
export const FIXTURE_FLOOR_ID = 'floor-1'

interface FixtureAssetSpec {
	id: string
	name: string
	w: number
	h: number
	tags: string[]
	walkable?: boolean
}

const ASSET_SPECS: FixtureAssetSpec[] = [
	{ id: 'fx-bed', name: 'Bed', w: 3, h: 2, tags: ['living'], walkable: false },
	{ id: 'fx-sofa', name: 'Sofa', w: 3, h: 2, tags: ['lounge'], walkable: false },
	{ id: 'fx-sink', name: 'Sink', w: 1, h: 1, tags: ['hygiene'], walkable: false },
	{ id: 'fx-desk', name: 'Desk', w: 2, h: 1, tags: ['business'], walkable: false },
	{ id: 'fx-shelf', name: 'Shelf', w: 2, h: 1, tags: ['storage'], walkable: false },
	{ id: 'fx-counter', name: 'Service Counter', w: 3, h: 1, tags: ['back-of-house'], walkable: false },
	{ id: 'fx-lift', name: 'Lift', w: 2, h: 2, tags: ['portal'], walkable: false },
]

export function fixtureAssets(): AssetDef[] {
	return ASSET_SPECS.map(spec => ({
		id: spec.id,
		name: spec.name,
		w: spec.w,
		h: spec.h,
		walkable: spec.walkable ?? false,
		tags: [...spec.tags],
		origin: 'drawn' as const,
		interactSpots: [{ kind: 'stand' as const, x: (spec.w * FIXTURE_TILE_SIZE) / 2, y: spec.h * FIXTURE_TILE_SIZE + FIXTURE_TILE_SIZE / 2 }],
		interact: { capacity: 1, durationMin: 1, durationMax: 2 },
	}))
}

export interface FixtureObject {
	id: string
	type: string
	/** Tile coordinates - the fixture speaks tiles, the payload speaks pixels. */
	x: number
	y: number
	rotation?: 0 | 90 | 180 | 270
}

export interface FixtureFloor {
	plan: string[]
	objects?: FixtureObject[]
	label?: string
}

/** A declared simulation population, so a fixture can carry the load its plan must hold. */
export interface FixtureNpc {
	roles: { id: string; label: string; taskIds?: string[] }[]
	tasks: { id: string; label: string; assetId?: string; tags?: string[] }[]
	pool: { roleId: string; count: number; floorIds: string[] }[]
}
export interface Fixture {
	id: string
	name: string
	/** Polarity: a `bad` fixture must fire its findings; a `good` fixture must stay quiet. */
	polarity: 'good' | 'bad'
	/** Why this plan is bad. The reason travels with the example - a picture of a failure teaches nothing. */
	whyBad?: string
	/** The correction a designer should reach for, on the blast-radius ladder. */
	correction?: string
	/** Finding ids that must appear. For a good fixture, ids that must NOT appear. */
	expect: string[]
	/** The single-storey case. Use `floors` instead when the example is about the section. */
	plan?: string[]
	objects?: FixtureObject[]
	/**
	 * More storeys. When present this replaces `plan` / `objects` entirely; the first entry is the
	 * street floor. Every floor shares one canvas, which is how the host models a building - a core
	 * that lands on different cells per floor is therefore a real drift, not a different drawing.
	 */
	floors?: FixtureFloor[]
	/** Rule ids in architecture-skill/research that this example instantiates. */
	rules: string[]
	/** Declared population and posts. Absent means no occupancy is declared, so capacity is unjudgeable. */
	npcConfig?: FixtureNpc
}

export function fixtureFloorId(index: number): string {
	return index === 0 ? FIXTURE_FLOOR_ID : `floor-${index + 1}`
}

/** Every fixture speaks one or more plans; this is the single place that resolves which. */
export function fixtureFloors(fixture: Fixture): { id: string; label: string; plan: string[]; objects: FixtureObject[] }[] {
	const entries: FixtureFloor[] = fixture.floors ?? (fixture.plan ? [{ plan: fixture.plan, objects: fixture.objects }] : [])
	if (!entries.length) throw new Error(`fixture "${fixture.id}" declares neither plan nor floors`)
	return entries.map((entry, index) => ({
		id: fixtureFloorId(index),
		label: entry.label ?? (index === 0 ? fixture.name : `${fixture.name} L${index + 1}`),
		plan: entry.plan,
		objects: entry.objects ?? [],
	}))
}

/**
 * Plan legend:  #  blocked (wall / structure)
 *               .  walkable floor
 *               +  door
 * Every row must be the same length. The plan is the drawing; the checks are the critique.
 */
export function planToTileStates(plan: readonly string[]): ('walkable' | 'blocked' | 'door')[][] {
	const width = plan[0]?.length ?? 0
	for (const [i, row] of plan.entries()) {
		if (row.length !== width) throw new Error(`plan row ${i} is ${row.length} chars, expected ${width}`)
	}
	return plan.map(row => [...row].map(char => {
		if (char === '#') return 'blocked' as const
		if (char === '+') return 'door' as const
		if (char === '.') return 'walkable' as const
		throw new Error(`unknown plan character "${char}" - use # . +`)
	}))
}

/** A tile plan padded on every side with the open street ring the host expects. */
function paddedTileStates(plan: readonly string[], pad: number): ('walkable' | 'blocked' | 'door')[][] {
	const inner = planToTileStates(plan)
	const width = inner[0].length + pad * 2
	const openCell = (): 'walkable' => 'walkable'
	const margin = (): 'walkable'[] => Array.from({ length: pad }, openCell)
	const openRow = (): 'walkable'[] => Array.from({ length: width }, openCell)
	const states = [
		...Array.from({ length: pad }, openRow),
		...inner.map(row => [...margin(), ...row, ...margin()]),
		...Array.from({ length: pad }, openRow),
	]
	// Objects are placed in the same padded coordinate space, so a row of the wrong width slides the
	// whole plan sideways while every count still looks plausible. Fail loudly instead.
	if (states.some(row => row.length !== width)) throw new Error(`padded plan rows are not ${width} cells wide`)
	return states
}

export function fixtureToDataFile(fixture: Fixture): unknown {
	const pad = FIXTURE_STREET_TILES
	const floors = fixtureFloors(fixture)
	const statesByFloor = floors.map(floor => paddedTileStates(floor.plan, pad))
	const cols = statesByFloor[0][0].length
	const rows = statesByFloor[0].length
	for (const [index, states] of statesByFloor.entries()) {
		// Storeys share one canvas in this host, so a second floor drawn to a different size is a
		// broken fixture, not a stepped section - and the coordinates would silently disagree.
		if (states[0].length !== cols || states.length !== rows) {
			throw new Error(`fixture "${fixture.id}" floor "${floors[index].id}" is ${states[0].length}x${states.length}, expected ${cols}x${rows} - storeys share one canvas`)
		}
	}
	return {
		$schema: 'blueprint-data.v2.json',
		version: 2,
		tags: [],
		originAssets: fixtureAssets(),
		layout: {
			version: 3,
			canvas: { width: cols * FIXTURE_TILE_SIZE, height: rows * FIXTURE_TILE_SIZE, tileSize: FIXTURE_TILE_SIZE },
			streetWidthTiles: FIXTURE_STREET_TILES,
			streetFloorId: floors[0].id,
			floors: floors.map((floor, index) => ({
				id: floor.id,
				name: floor.label,
				label: floor.label,
				defaultWalkable: false,
				walkable: { tileStates: statesByFloor[index] },
				objects: floor.objects.map(object => ({
					id: object.id,
					type: object.type,
					x: (object.x + pad) * FIXTURE_TILE_SIZE,
					y: (object.y + pad) * FIXTURE_TILE_SIZE,
					rotation: object.rotation ?? 0,
				})),
				spawnZones: [],
			})),
		},
		npcConfig: fixture.npcConfig && {
			defaultRoleId: fixture.npcConfig.roles[0]?.id ?? '',
			roles: fixture.npcConfig.roles.map(role => ({ id: role.id, label: role.label, taskIds: role.taskIds ?? [] })),
			tasks: fixture.npcConfig.tasks.map(task => ({
				id: task.id,
				label: task.label,
				tags: task.tags ?? [],
				...(task.assetId ? { post: { assetId: task.assetId, post: 'station' } } : {}),
			})),
			pool: fixture.npcConfig.pool,
		},
	}
}

// ---------------------------------------------------------------------------
// The library
// ---------------------------------------------------------------------------

/**
 * GOOD: a double-loaded corridor, two rooms per side, one tagged service room, two portals, and
 * circulation wide enough to pass. This is the control: if findings fire here, the suite is
 * producing noise, not evidence.
 */
const GOOD_PLAN = [
	'###################',
	'#........#........#',
	'#........#........#',
	'#........#........#',
	'#........#........#',
	'#........#........#',
	'####+########+#####',
	'#.................#',
	'#.................#',
	'#.................#',
	'#.................#',
	'####+########+#####',
	'#........#........#',
	'#........#........#',
	'#........#........#',
	'#........#........#',
	'#........#........#',
	'###################',
]

const GOOD_FIXTURE: Fixture = {
	id: 'good-double-loaded',
	name: 'Good: double-loaded corridor',
	polarity: 'good',
	expect: ['GATE-01', 'GATE-02', 'GATE-03', 'GATE-04', 'GATE-05', 'GATE-06', 'CIR-01', 'CIR-03', 'CIR-06', 'CIR-07', 'GEO-01', 'GEO-02', 'INT-01', 'INT-04', 'OPS-01', 'ENV-02'],
	rules: ['TH-11', 'PP-11', 'MS-01', 'PP-02'],
	npcConfig: {
		roles: [{ id: 'role-staff', label: 'Staff', taskIds: ['task-desk'] }],
		tasks: [{ id: 'task-desk', label: 'Business desk', assetId: 'fx-desk', tags: ['business'] }],
		pool: [{ roleId: 'role-staff', count: 8, floorIds: [FIXTURE_FLOOR_ID] }],
	},
	plan: GOOD_PLAN,
	objects: [
		{ id: 'bed-1', type: 'fx-bed', x: 1, y: 1 },
		{ id: 'desk-1', type: 'fx-desk', x: 5, y: 1 },
		{ id: 'counter-1', type: 'fx-counter', x: 11, y: 1 },
		{ id: 'shelf-1', type: 'fx-shelf', x: 11, y: 3 },
		{ id: 'bed-2', type: 'fx-bed', x: 1, y: 12 },
		{ id: 'bed-3', type: 'fx-bed', x: 10, y: 12 },
		{ id: 'desk-2', type: 'fx-desk', x: 15, y: 12 },
		{ id: 'lift-a', type: 'fx-lift', x: 1, y: 7 },
		{ id: 'lift-b', type: 'fx-lift', x: 14, y: 7 },
	],
}

export const FIXTURES: Fixture[] = [
	GOOD_FIXTURE,
	{
		id: 'bad-single-file-corridor',
		name: 'Bad: 1-tile corridor serving four rooms',
		polarity: 'bad',
		whyBad: 'The corridor reads as "circulation" in the report and as a queue in reality. One tile is strict single file: two people cannot pass, a cart cannot turn, and under octile A* every meeting becomes a detour or a blockage. Four rooms depend on it, so one encounter stops the floor.',
		correction: 'Widen the run to 2 tiles, taking the tile from the rooms rather than from another corridor - then re-run the checks the widening touched.',
		expect: ['CIR-01'],
		rules: ['CODE-05', 'PP-10', 'PP-11', 'FL-04'],
		plan: [
			'####################',
			'#.......#..........#',
			'#.......#..........#',
			'#.......#..........#',
			'#.......+..........#',
			'#####.##############',
			'#..................#',
			'####################',
			'#.......+..........#',
			'#.......#..........#',
			'#.......#..........#',
			'#.......#..........#',
			'####################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 2, y: 1 },
			{ id: 'bed-2', type: 'fx-bed', x: 12, y: 1 },
			{ id: 'bed-3', type: 'fx-bed', x: 2, y: 8 },
			{ id: 'bed-4', type: 'fx-bed', x: 12, y: 8 },
			{ id: 'lift-a', type: 'fx-lift', x: 2, y: 6 },
			{ id: 'lift-b', type: 'fx-lift', x: 16, y: 6 },
			{ id: 'counter-1', type: 'fx-counter', x: 9, y: 6 },
		],
	},
	{
		id: 'bad-sealed-room',
		name: 'Bad: a room with walls and no door',
		polarity: 'bad',
		whyBad: 'The room is drawn, tagged and counted as programme, but nobody can enter it. Its area inflates net-to-gross, its occupant load inflates the egress demand, and if it were ever occupied its occupants would have no way out. Area without access is not a room.',
		correction: 'Cut a door run into the wall that reaches circulation, then re-check the door width and the swing reserve on both sides.',
		expect: ['CIR-03'],
		rules: ['FL-09', 'VA-07'],
		plan: [
			'####################',
			'#........#.........#',
			'#........#.........#',
			'#........#.........#',
			'####+###############',
			'#..................#',
			'#..................#',
			'####################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 1, y: 1 },
			{ id: 'sofa-1', type: 'fx-sofa', x: 11, y: 1 },
			{ id: 'lift-a', type: 'fx-lift', x: 1, y: 5 },
			{ id: 'lift-b', type: 'fx-lift', x: 16, y: 5 },
			{ id: 'counter-1', type: 'fx-counter', x: 8, y: 6 },
		],
	},
	{
		id: 'bad-untagged-room',
		name: 'Bad: enclosed rooms with no fixture tag',
		polarity: 'bad',
		whyBad: 'The host types a room from its fixture tags, and an unrecognised room silently becomes a hallway. These two rooms are walls on the plan and corridor in the engine: the programme loses two rooms, the circulation share inflates, and the report claims space that does not exist as space.',
		correction: 'Place the discriminating fixture - last, because the lowest-priority tag wins and a hygiene fixture will retype a kitchen as a bathroom.',
		expect: ['INT-04'],
		rules: ['FL-07', 'SKILL host fact 2', 'SKILL host fact 3d'],
		plan: [
			'##################',
			'#......#.........#',
			'#......#.........#',
			'#......#.........#',
			'#......#.........#',
			'###+########+#####',
			'#................#',
			'#................#',
			'#................#',
			'##################',
		],
		objects: [
			{ id: 'lift-a', type: 'fx-lift', x: 2, y: 7 },
			{ id: 'lift-b', type: 'fx-lift', x: 13, y: 7 },
		],
	},
	{
		id: 'bad-crowded-bedroom',
		name: 'Bad: a bedroom whose furniture leaves no way through',
		polarity: 'bad',
		whyBad: 'This is the interior/architecture coupling failure the plan cannot see. The shell is a perfectly reasonable rectangle, but once the bed, the desk and the wardrobe are placed the gap left at the door is under 1.0 m - a person cannot pass the bed to reach the window, and cannot turn at the door. The room measures fine and does not work.',
		correction: 'Move or drop a fixture, or rotate the bed off the door swing. Retagging is not a fix for a clearance failure; growing the shell is the honest one.',
		expect: ['INT-01'],
		rules: ['HS-*', 'PP-14', 'AX-*', 'TH-24'],
		plan: [
			'##############',
			'#......#.....#',
			'#......#.....#',
			'#......#.....#',
			'#......#.....#',
			'###.######+###',
			'#............#',
			'#............#',
			'#............#',
			'##############',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 1, y: 1 },
			{ id: 'desk-1', type: 'fx-desk', x: 5, y: 1 },
			{ id: 'shelf-1', type: 'fx-shelf', x: 1, y: 3 },
			{ id: 'shelf-2', type: 'fx-shelf', x: 3, y: 3 },
			{ id: 'counter-1', type: 'fx-counter', x: 9, y: 1 },
			{ id: 'shelf-3', type: 'fx-shelf', x: 9, y: 3 },
			{ id: 'lift-a', type: 'fx-lift', x: 1, y: 6 },
			{ id: 'lift-b', type: 'fx-lift', x: 10, y: 6 },
		],
	},
	{
		id: 'bad-windowless-bedroom',
		name: 'Bad: long-stay rooms buried in the plate',
		polarity: 'bad',
		whyBad: 'The plate is deeper than the sidelit band, so the rooms in the middle have no facade, no daylight and no ventilation path. For rooms people sleep in that is a habitability failure, and it forces the mechanical system to carry a load the massing created. Depth is a plate problem: no amount of room shuffling fixes it.',
		correction: 'Change the massing - a thinner plate or a courtyard - and push circulation, storage and service into the deep band where light does not matter.',
		// ENV-01 used to be expected here. It no longer fires: the depth cap is now derived from a
		// declared 4 m window head height (8 tiles), which is right for a glazed lobby and too generous
		// for a bedroom. The windowless case is still condemned by ENV-02 - no façade at all - and the
		// per-typology head height that would let ENV-01 judge a domestic room is an open gap, not a
		// reason to keep a fixture green on a number that no longer means what it said.
		expect: ['ENV-02'],
		rules: ['TH-26', 'EN-04', 'EN-08', 'EQ-*'],
		plan: [
			'############################',
			'#..........................#',
			'#..........................#',
			'#..........................#',
			'#.......##+#####+###.......#',
			'#.......#....#.....#.......#',
			'#.......#....#.....#.......#',
			'#.......#....#.....#.......#',
			'#.......#....#.....#.......#',
			'#.......#....#.....#.......#',
			'#.......##+#####+###.......#',
			'#..........................#',
			'#..........................#',
			'#..........................#',
			'############################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 9, y: 5 },
			{ id: 'bed-2', type: 'fx-bed', x: 14, y: 5 },
			{ id: 'lift-a', type: 'fx-lift', x: 1, y: 1 },
			{ id: 'lift-b', type: 'fx-lift', x: 24, y: 1 },
		],
	},
	{
		id: 'bad-unreachable-pocket',
		name: 'Bad: sealed walkable pocket counted as floor',
		polarity: 'bad',
		whyBad: 'The pocket is walkable in the data and unreachable in the world. It inflates the area, the circulation share and any capacity computed from tiles, while no agent can ever stand on it. Phantom geometry is how an unsafe plan scores well.',
		correction: 'Either open a door into the pocket or block it and re-classify it as structure - never leave it as floor nobody can reach.',
		expect: ['GATE-02'],
		rules: ['FL-09', 'VA-07'],
		plan: [
			'##################',
			'#........#.......#',
			'#........#.......#',
			'#........+.......#',
			'#........#.......#',
			'#........#########',
			'#........#.......#',
			'#........#.......#',
			'##################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 2, y: 1 },
			{ id: 'sofa-1', type: 'fx-sofa', x: 12, y: 1 },
			{ id: 'lift-a', type: 'fx-lift', x: 2, y: 6 },
			{ id: 'lift-b', type: 'fx-lift', x: 12, y: 6 },
			{ id: 'counter-1', type: 'fx-counter', x: 5, y: 6 },
		],
	},
	{
		id: 'bad-single-portal',
		name: 'Bad: one lift, no alternative',
		polarity: 'bad',
		whyBad: 'One portal is one way up and one way out. If the lift is the fire, the floor has no escape, and the queue at that single portal is the whole building\'s vertical capacity. Two portals remote from each other is the floor, not a luxury.',
		correction: 'Add a second portal remote from the first, on the stacked core coordinates the rest of the building uses - not somewhere new.',
		expect: ['CIR-07'],
		rules: ['FL-08', 'MS-10', 'VT-*', 'CODE-01'],
		plan: [
			'################',
			'#......#.......#',
			'#......#.......#',
			'#......+.......#',
			'#......#.......#',
			'#..............#',
			'#......#.......#',
			'#......+.......#',
			'#......#.......#',
			'################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 2, y: 1 },
			{ id: 'bed-2', type: 'fx-bed', x: 10, y: 1 },
			{ id: 'bed-3', type: 'fx-bed', x: 2, y: 6 },
			{ id: 'bed-4', type: 'fx-bed', x: 10, y: 6 },
			{ id: 'lift-a', type: 'fx-lift', x: 7, y: 5 },
			{ id: 'counter-1', type: 'fx-counter', x: 11, y: 5 },
		],
	},
	{
		id: 'bad-no-back-of-house',
		name: 'Bad: guest floor with no service room',
		polarity: 'bad',
		whyBad: 'Support space is programme, not leftover. With no floor-level pantry, linen or waste room, staff improvise storage in guest space or haul everything vertically, housekeeping has no catchment, and the operating model the design assumes does not run. The plan looks efficient because the work has been made invisible.',
		correction: 'Programme BOH as a bounded share with a catchment before the geometry - add the room, do not convert a guest room by tag alone.',
		expect: ['OPS-01'],
		rules: ['PP-02', 'PP-03', 'PP-05', 'OM-*', 'HO-*'],
		plan: [
			'####################',
			'#........#.........#',
			'#........#.........#',
			'#........+.........#',
			'#........#.........#',
			'#..................#',
			'#........#.........#',
			'#........+.........#',
			'#........#.........#',
			'####################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 2, y: 1 },
			{ id: 'bed-2', type: 'fx-bed', x: 12, y: 1 },
			{ id: 'bed-3', type: 'fx-bed', x: 2, y: 6 },
			{ id: 'bed-4', type: 'fx-bed', x: 12, y: 6 },
			{ id: 'sofa-1', type: 'fx-sofa', x: 8, y: 5 },
			{ id: 'lift-a', type: 'fx-lift', x: 4, y: 5 },
			{ id: 'lift-b', type: 'fx-lift', x: 15, y: 5 },
		],
	},
	{
		id: 'bad-phantom-door',
		name: 'Bad: a door that leads into a wall',
		polarity: 'bad',
		whyBad: 'A door tile with no walkable neighbour is a hole in a wall that goes nowhere. The plan shows an opening, the engine has no route, and the room behind it is unreachable while still counting as programme. This is the cheapest defect to draw and the hardest to notice without measuring.',
		correction: 'Move the door run onto a wall line that has walkable floor on both sides, or delete it and re-draw the opening where the route actually is.',
		expect: ['GATE-03'],
		rules: ['VA-07', 'FL-06'],
		plan: [
			'####################',
			'#..................#',
			'#..###.............#',
			'#..#+#.............#',
			'#..###.............#',
			'#..................#',
			'####+###############',
			'#..................#',
			'#..................#',
			'####################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 8, y: 1 },
			{ id: 'sofa-1', type: 'fx-sofa', x: 13, y: 4 },
			{ id: 'lift-a', type: 'fx-lift', x: 1, y: 7 },
			{ id: 'lift-b', type: 'fx-lift', x: 16, y: 7 },
			{ id: 'counter-1', type: 'fx-counter', x: 8, y: 8 },
		],
	},
	{
		id: 'bad-sliver-rooms',
		name: 'Bad: rounding leftovers become 1-tile rooms',
		polarity: 'bad',
		whyBad: 'Quantisation slivers: 0.5 m strips that no person, cart or wheelchair can use, produced by absorbing rounding error into a room instead of into a wall or service band. They still count as programme area, so the plan over-reports what it delivers.',
		correction: 'Absorb the remainder into the wall, the service band or a declared tolerance strip - the absorber order is fixed, and never into a room\'s usable area.',
		expect: ['GEO-01'],
		rules: ['TH-02', 'GT-10', 'GT-18'],
		plan: [
			'####################',
			'#.#................#',
			'###................#',
			'#..................#',
			'#..................#',
			'####+###############',
			'#..................#',
			'#..................#',
			'####################',
		],
		objects: [
			{ id: 'bed-1', type: 'fx-bed', x: 5, y: 3 },
			{ id: 'sofa-1', type: 'fx-sofa', x: 12, y: 1 },
			{ id: 'lift-a', type: 'fx-lift', x: 1, y: 6 },
			{ id: 'lift-b', type: 'fx-lift', x: 16, y: 6 },
			{ id: 'counter-1', type: 'fx-counter', x: 8, y: 7 },
		],
	},
]

/**
 * One open storey with a street door, used by the section examples. The plan is deliberately boring:
 * the only thing these fixtures differ by is where the core lands on each floor, so a finding that
 * fires here is about the stack and nothing else.
 */
const STACK_PLAN = [
	'#########+##########',
	'#..................#',
	'#..................#',
	'#..................#',
	'#..................#',
	'#..................#',
	'#..................#',
	'#..................#',
	'#..................#',
	'####################',
]

/**
 * Two storeys stack the car on the same cells and the third moves it. The reference is the consensus,
 * so exactly one floor may be blamed - naming the two that already stack is the bug this guards.
 */
FIXTURES.push({
	id: 'bad-drifting-lift',
	name: 'Bad: a lift that moves between floors',
	polarity: 'bad',
	rules: ['MS-01', 'SR-15', 'FL-20'],
	expect: ['BLD-02'],
	whyBad: 'A shaft is one object through the building. When the car lands on different cells on the top storey there is no continuous shaft: the structure needs a transfer slab, the lobby serves a different core from the guest floors, and the escape route from the top leaves nowhere to go. Two floors agree, so those two are the reference and the third is the deviation - telling the aligned floors to move would break a working stack.',
	correction: 'Rung "core": snap the deviating storey onto the consensus portal cells. Do not move the floors that already stack.',
	floors: [
		{ label: 'Bad: drifting lift - ground', plan: STACK_PLAN, objects: [{ id: 'lift-g', type: 'fx-lift', x: 2, y: 6 }] },
		{ label: 'Level 1', plan: STACK_PLAN, objects: [{ id: 'lift-1', type: 'fx-lift', x: 2, y: 6 }] },
		{ label: 'Level 2', plan: STACK_PLAN, objects: [{ id: 'lift-2', type: 'fx-lift', x: 14, y: 6 }] },
	],
})

FIXTURES.push({
	id: 'bad-floor-no-lift',
	name: 'Bad: an occupied floor nobody can reach',
	polarity: 'bad',
	rules: ['FL-08', 'MS-10'],
	expect: ['BLD-01'],
	whyBad: 'A storey with no vertical access has programme that does not exist. It is counted in the plate, carried in the area schedule, and unreachable by every route the sim can take - so it also cannot be escaped from, which makes it a safety finding and not just a usability one.',
	correction: 'Rung "core": continue the stacked core to the top storey on the same cells the lower floors already use.',
	floors: [
		{ label: 'Bad: no lift on the top floor - ground', plan: STACK_PLAN, objects: [{ id: 'lift-g', type: 'fx-lift', x: 2, y: 6 }] },
		{ label: 'Level 1', plan: STACK_PLAN, objects: [{ id: 'lift-1', type: 'fx-lift', x: 2, y: 6 }] },
		{ label: 'Level 2', plan: STACK_PLAN, objects: [] },
	],
})

/**
 * A bare plate: nothing typed, nothing furnished, everything walkable. This is the state a rebuild
 * starts from, and the suite's own blind spot recorded as a test case - it produces no findings,
 * because there is no programme declared to be missing. The vector stage still has to be honest
 * about it, so the room-derived rows are pinned here as unmeasurable rather than as zeroes.
 */
FIXTURES.push({
	id: 'bare-plate',
	name: 'Bad: an empty plate with a population assigned to it',
	polarity: 'bad',
	rules: ['SP-*', 'FL-07', 'HB-10', 'HB-11', 'PP-08'],
	expect: ['GEO-06', 'CAP-01', 'OPS-04', 'OPS-05', 'SP-01'],
	npcConfig: {
		roles: [{ id: 'role-guest', label: 'Guest', taskIds: ['task-arrival'] }, { id: 'role-receptionist', label: 'Reception', taskIds: ['task-arrival'] }],
		tasks: [{ id: 'task-arrival', label: 'Arrival desk', assetId: 'fx-desk', tags: ['front-desk'] }],
		pool: [{ roleId: 'role-guest', count: 690, floorIds: ['floor-1'] }, { roleId: 'role-receptionist', count: 10, floorIds: ['floor-1'] }],
	},
	whyBad: 'An undivided slab with 700 declared occupants on it. It reconciles perfectly, every room-based check has an empty sample set to stay quiet about, and the old suite therefore reported it as nearly clean. Three things are now said out loud: there is no enclosure, so there is no building; the standing area per person is below even the evacuation-lobby code floor, so the population does not fit; and the arrival desk the simulation promises has nowhere to stand.',
	correction: 'Programme before geometry, in this order: enclosure (rung "wall"), then the rooms the population needs, then the stations its roles run. Re-tagging cannot fix any of the three.',
	plan: Array.from({ length: 18 }, () => '.'.repeat(19)),
	objects: [],
})
