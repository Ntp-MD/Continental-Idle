/**
 * generate-hotel.mjs - builds the 21-floor hotel into the canonical seed file.
 *
 * Design authority: docs/design/hotel-21-floor-program.md. Every dimension below
 * traces to that document; the reference tags (R1..R14) point at its register.
 *
 *   node scripts/generate-hotel.mjs              validate + report, write nothing
 *   node scripts/generate-hotel.mjs --write      validate, then write the seed file
 *   node scripts/generate-hotel.mjs --out=<file> validate, then write that file
 *
 * The seed file is only written when every per-floor and cross-floor check passes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'src', 'blueprint-editor', 'data', 'blueprint-data.json')
const WRITE = process.argv.includes('--write')
const OUT_ARG = process.argv.find(a => a.startsWith('--out='))?.slice('--out='.length)
const TARGET = OUT_ARG ? path.resolve(root, OUT_ARG) : dataPath
const DEBUG_LABEL = (() => {
	const i = process.argv.indexOf('--debug')
	return i === -1 ? null : (process.argv[i + 1] ?? 'G').toUpperCase()
})()

// ---------- grid contract: 1 tile = 0.5 m, tileSize 20 px ----------

const TILE = 20
const COLS = 80
const ROWS = 50
const STREET = 8
const MAX_PAYLOAD = 5 * 1024 * 1024

const ENV = { r0: 8, c0: 8, r1: 41, c1: 71 }          // 64 x 34 tiles = 32.0 x 17.0 m
const BAND_N = { r0: 9, r1: 21, wall: 22 }             // north band, corridor-side wall row 22
const BAND_S = { r0: 28, r1: 40, wall: 27 }            // south band, corridor-side wall row 27
const CORR = { r0: 23, r1: 26, c0: 28, c1: 66 }        // 2.0 m clear guest spine
const CORE_W_WALL = 12                                 // core west wall / stair 1 east wall
const HOIST = { r0: 8, r1: 14, c0: 8, c1: 27 }         // hoistway block; east wall = party line 27
const HOIST_IN = { r0: 9, r1: 13, c0: 9, c1: 26 }
const S1 = { r0: 14, r1: 41, c0: 8, c1: 12, in: { r0: 15, r1: 40, c0: 9, c1: 11 } }
const S2 = { r0: 8, r1: 41, c0: 67, c1: 71, in: { r0: 9, r1: 40, c0: 68, c1: 70 } }
const HALL = { r0: 15, r1: 26, c0: 13, c1: 26 }        // lift hall, 3 x 3 m+ clear
const RISER_W = { r0: 14, r1: 18, c0: 24, c1: 27, in: { r0: 15, r1: 17, c0: 25, c1: 26 }, door: [24, 15, 16] }
const RISER_E = { r0: 18, r1: 21, c0: 24, c1: 27, in: { r0: 19, r1: 20, c0: 25, c1: 26 }, door: [24, 19, 20] }
const HK = { r0: 32, r1: 41, c0: 14, c1: 19, in: { r0: 33, r1: 40, c0: 15, c1: 18 }, doorRow: 32, door: [16, 17] }
const STAIR_DOOR = [23, 24]
// Five cars, not three: a 21-floor / 116-key tower with 1200 agents moving needs the
// boarding slots, and each car's 4 spots are also the lift lobby's standing room.
const LIFTS = [{ id: 'P1', col: 14 }, { id: 'P2', col: 18 }, { id: 'SV1', col: 22 }, { id: 'P3', col: 10 }, { id: 'P4', col: 25 }]
const STAIR_FLIGHTS = [[9, 15], [9, 19], [9, 29], [9, 33], [9, 37], [68, 9], [68, 13], [68, 17], [68, 29], [68, 33], [68, 37]]
// The only cells where the tower envelope may be opened: the ground-floor entrance and the
// service door. Every other floor keeps these cells solid, which is what makes the core standard.
const GRADE_OPENINGS = new Set(['8,36', '8,37', '26,8', '27,8'])
const COLUMN_CELLS = [[35, 22], [43, 22], [51, 22], [59, 22], [35, 27], [43, 27], [51, 27], [59, 27]]
const BAYS = {
	standard: [[28, 34], [36, 42], [44, 50], [52, 58], [60, 66]],       // 5 x 7 clear, 28.0 sq m gross
	superior: [[28, 36], [38, 46], [48, 56], [58, 66]],                 // 4 x 9 clear, 35.0 sq m gross
	executive: [[28, 39], [41, 52], [54, 66]],                          // 3 x 12/13 clear, 45.5-49 sq m
	suite: [[28, 46], [48, 66]],                                         // 2 x 19 clear, 70.0 sq m
}

// ---------- primitives ----------

const newGrid = () => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 'walkable'))
const px = tiles => tiles * TILE
const inGrid = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS
// rect normalizes its corners so head-anchored offsets work in both bands
const rect = (r0, c0, r1, c1) => ({ r0: Math.min(r0, r1), c0: Math.min(c0, c1), r1: Math.max(r0, r1), c1: Math.max(c0, c1) })
const area = s => (s.r1 - s.r0 + 1) * (s.c1 - s.c0 + 1)

function fill(g, s, state) {
	if (process.env.TRACE_ROW && state === 'blocked' && Number(process.env.TRACE_ROW) >= s.r0 && Number(process.env.TRACE_ROW) <= s.r1) {
		const at = new Error().stack.split('\n')[2]?.trim().replace('at ', '') ?? '?'
		console.log(`TRACE blocked row ${process.env.TRACE_ROW} by ${at} rect(${s.r0},${s.c0},${s.r1},${s.c1})`)
	}
	for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) {
		if (!inGrid(r, c)) throw new Error(`paint outside the grid at ${r},${c}`)
		g[r][c] = state
	}
}

function perimeter(g, s, state = 'blocked') {
	fill(g, rect(s.r0, s.c0, s.r0, s.c1), state)
	fill(g, rect(s.r1, s.c0, s.r1, s.c1), state)
	fill(g, rect(s.r0, s.c0, s.r1, s.c0), state)
	fill(g, rect(s.r0, s.c1, s.r1, s.c1), state)
}

function doorH(g, row, c0, c1) { for (let c = c0; c <= c1; c++) g[row][c] = 'door' }
function doorV(g, col, r0, r1) { for (let r = r0; r <= r1; r++) g[r][col] = 'door' }

function zoneOf(id, label, s, roleIds) {
	return {
		id, label,
		x: px(s.c0), y: px(s.r0),
		w: (s.c1 - s.c0 + 1) * TILE, h: (s.r1 - s.r0 + 1) * TILE,
		...(roleIds ? { roleIds } : {}),
	}
}

// head-anchored row map: offset 0 = window/head side, offset 12 = corridor side
const rowsOf = band => band === BAND_N ? (o => band.r0 + o) : (o => band.r1 - o)

// ---------- shared vertical systems ----------

function layCore(g) {
	perimeter(g, ENV)
	perimeter(g, HOIST)
	fill(g, HOIST_IN, 'walkable')
	fill(g, rect(HOIST.r1, HOIST.c0, HOIST.r1, HALL.c0 - 1), 'blocked')     // stair-1 enclosure keeps its wall here
	fill(g, rect(HOIST.r1, HALL.c0, HOIST.r1, HALL.c1), 'walkable')        // arcade: the bank opens into the lift hall
	// col 12 is the stair-1 west wall only from row 14 down (perimeter(S1)); through the hoistway
	// band it must stay open, otherwise the bank's west bay becomes a pocket nothing can reach
	perimeter(g, S1)
	fill(g, S1.in, 'walkable')
	perimeter(g, S2)
	fill(g, S2.in, 'walkable')
	for (const riser of [RISER_W, RISER_E]) {
		perimeter(g, riser)
		fill(g, riser.in, 'walkable')
	}
	return g
}

// Doors are punched last so no band or space fill can overwrite them.
function punchCoreDoors(g) {
	doorV(g, CORE_W_WALL, STAIR_DOOR[0], STAIR_DOOR[1])
	doorV(g, 67, STAIR_DOOR[0], STAIR_DOOR[1])
	for (const riser of [RISER_W, RISER_E]) doorV(g, riser.door[0], riser.door[1], riser.door[2])
}

function coreObjects(objects) {
	for (const lift of LIFTS) objects.push(makeObject('elevator-1', lift.col, 10))
	objects.push(makeObject('riser-closet', 25, 16))
	objects.push(makeObject('riser-closet', 25, 19))
	for (const [c, r] of STAIR_FLIGHTS) objects.push(makeObject('stair-flight', c, r))
}

function layHousekeeping(g, objects, declared) {
	perimeter(g, HK)
	fill(g, HK.in, 'walkable')
	doorH(g, HK.doorRow, HK.door[0], HK.door[1])
	objects.push(makeObject('linen-shelf', 15, 36))
	objects.push(makeObject('housekeeping-cart', 15, 38))
	objects.push(makeObject('soiled-linen', 18, 33))
	declared.push({ name: 'housekeeping', s: HK.in, minTiles: 24 })
}

function layColumns(g, objects) {
	for (const [c, r] of COLUMN_CELLS) if (g[r][c] === 'walkable') objects.push(makeObject('column', c, r))
}

// ---------- catalog ----------

const NEW_TAGS = [
	{ id: 'business', label: 'business' },
	{ id: 'housekeeping', label: 'housekeeping' },
	{ id: 'storage', label: 'storage' },
	{ id: 'mechanical', label: 'mechanical' },
	{ id: 'treatment', label: 'treatment' },
	{ id: 'pool', label: 'pool' },
	{ id: 'staff', label: 'staff' },
	{ id: 'structure', label: 'structure' },
]

function drawn(id, name, w, h, tags, opts = {}) {
	return {
		id, name, w, h, tags, origin: 'drawn', walkable: opts.walkable === true,
		defaultFillColor: '#ffffff',
		...(opts.spots ? { interactSpots: opts.spots } : {}),
		...(opts.interact ? { interact: opts.interact } : {}),
		...(opts.label ? { defaultLabel: opts.label } : {}),
	}
}

const at = (w, h, side = 'S', post) => {
	const spot = side === 'S' ? { x: w * TILE / 2, y: h * TILE + TILE / 2 }
		: side === 'N' ? { x: w * TILE / 2, y: -TILE / 2 }
			: side === 'E' ? { x: w * TILE + TILE / 2, y: h * TILE / 2 }
				: { x: -TILE / 2, y: h * TILE / 2 }
	return [{ kind: 'stand', ...spot, ...(post ? { post } : {}) }]
}

const NEW_ASSETS = [
	drawn('bed-king', 'King Bed', 4, 4, ['living'], { walkable: true, spots: [{ kind: 'stand', x: 20, y: 90 }, { kind: 'stand', x: 60, y: 90 }], interact: { capacity: 2, durationMin: 30, durationMax: 90 } }),
	drawn('bed-double', 'Double Bed', 3, 4, ['living'], { walkable: true, spots: [{ kind: 'stand', x: 15, y: 90 }, { kind: 'stand', x: 45, y: 90 }], interact: { capacity: 2, durationMin: 30, durationMax: 90 } }),
	drawn('bed-single', 'Single Bed', 2, 4, ['living'], { walkable: true, spots: [{ kind: 'stand', x: 20, y: 90 }], interact: { capacity: 1, durationMin: 30, durationMax: 90 } }),
	drawn('wardrobe', 'Wardrobe', 5, 1, ['living'], { spots: at(5, 1), interact: { capacity: 2, durationMin: 2, durationMax: 5 } }),
	drawn('nightstand', 'Nightstand', 1, 1, ['living']),
	drawn('desk-guest', 'Writing Desk', 4, 2, ['living', 'business'], { spots: at(4, 2, 'N'), interact: { capacity: 1, durationMin: 4, durationMax: 10 } }),
	drawn('luggage-rack', 'Luggage Rack', 2, 1, ['living']),
	drawn('minibar', 'Minibar', 2, 1, ['living', 'storage'], { spots: at(2, 1), interact: { capacity: 1, durationMin: 2, durationMax: 5 } }),
	drawn('tv-stand', 'Television', 3, 1, ['living', 'lounge'], { spots: at(3, 1), interact: { capacity: 3, durationMin: 10, durationMax: 30 } }),
	drawn('armchair', 'Armchair', 1, 1, ['lounge'], { walkable: true, spots: [{ kind: 'stand', x: 10, y: 30 }], interact: { capacity: 1, durationMin: 5, durationMax: 20 } }),
	drawn('tub-long', 'Soaking Tub', 4, 2, ['hygiene', 'wellness'], { spots: at(4, 2), interact: { capacity: 1, durationMin: 20, durationMax: 40 } }),
	drawn('linen-shelf', 'Linen Shelf', 3, 1, ['housekeeping', 'storage'], { spots: at(3, 1, 'E'), interact: { capacity: 1, durationMin: 3, durationMax: 8 }, label: 'linen' }),
	drawn('housekeeping-cart', 'Housekeeping Cart', 2, 1, ['housekeeping'], { spots: at(2, 1, 'E'), interact: { capacity: 1, durationMin: 3, durationMax: 8 } }),
	drawn('soiled-linen', 'Soiled Linen Bin', 1, 1, ['housekeeping', 'back-of-house'], { spots: at(1, 1, 'W'), interact: { capacity: 1, durationMin: 2, durationMax: 6 } }),
	drawn('dryer', 'Tumble Dryer', 1, 1, ['laundry'], { spots: at(1, 1), interact: { capacity: 1, durationMin: 10, durationMax: 20 } }),
	drawn('ironing-table', 'Ironing Table', 2, 1, ['laundry'], { spots: at(2, 1), interact: { capacity: 1, durationMin: 5, durationMax: 12 } }),
	drawn('dry-store-shelf', 'Dry Store Shelf', 4, 1, ['storage', 'back-of-house'], { spots: at(4, 1), interact: { capacity: 2, durationMin: 3, durationMax: 9 }, label: 'stock' }),
	drawn('cold-store', 'Cold Store', 3, 2, ['storage', 'cooking', 'back-of-house'], { spots: at(3, 2), interact: { capacity: 1, durationMin: 4, durationMax: 10 } }),
	drawn('dish-return', 'Dish Return', 2, 1, ['cooking', 'back-of-house'], { spots: at(2, 1, 'N'), interact: { capacity: 2, durationMin: 4, durationMax: 10 }, label: 'dishwash' }),
	drawn('pass-window', 'Kitchen Pass', 4, 1, ['cooking'], { spots: at(4, 1), interact: { capacity: 2, durationMin: 2, durationMax: 6 }, label: 'pass' }),
	drawn('waste-room', 'Waste Compactor', 2, 2, ['storage', 'back-of-house'], { spots: at(2, 2, 'E'), interact: { capacity: 1, durationMin: 4, durationMax: 10 } }),
	drawn('staff-locker', 'Staff Lockers', 4, 1, ['staff', 'back-of-house'], { spots: at(4, 1), interact: { capacity: 2, durationMin: 5, durationMax: 15 } }),
	drawn('service-cart', 'Service Trolley', 2, 1, ['back-of-house'], { spots: at(2, 1, 'W'), interact: { capacity: 1, durationMin: 3, durationMax: 8 } }),
	drawn('uniform-desk', 'Staff Office Desk', 3, 1, ['staff', 'front-desk'], { spots: at(3, 1), interact: { capacity: 1, durationMin: 5, durationMax: 15 } }),
	drawn('banquet-round', 'Banquet Round', 4, 4, ['dining'], { walkable: true, spots: [{ kind: 'stand', x: 40, y: 5 }, { kind: 'stand', x: 40, y: 75 }, { kind: 'stand', x: 5, y: 40 }, { kind: 'stand', x: 75, y: 40 }], interact: { capacity: 4, durationMin: 20, durationMax: 60 } }),
	drawn('high-table', 'Cocktail Table', 2, 2, ['dining', 'bar', 'lounge'], { walkable: true, spots: [{ kind: 'stand', x: 20, y: 5 }, { kind: 'stand', x: 20, y: 35 }], interact: { capacity: 2, durationMin: 10, durationMax: 30 } }),
	drawn('banquet-table', 'Banquet Trestle', 6, 1, ['dining', 'business'], { walkable: true, spots: [{ kind: 'stand', x: 30, y: -5 }, { kind: 'stand', x: 90, y: 25 }], interact: { capacity: 2, durationMin: 20, durationMax: 60 } }),
	drawn('cafe-counter', 'Cafe Counter', 4, 1, ['dining', 'front-desk'], { spots: at(4, 1, 'N', 'cafe-point'), interact: { capacity: 2, durationMin: 3, durationMax: 8 } }),
	drawn('pastry-bench', 'Pastry Bench', 3, 1, ['cooking'], { spots: at(3, 1), interact: { capacity: 1, durationMin: 6, durationMax: 14 } }),
	drawn('av-cart', 'AV Cart', 2, 2, ['business'], { spots: at(2, 2, 'E'), interact: { capacity: 1, durationMin: 4, durationMax: 10 } }),
	drawn('boardroom-table', 'Boardroom Table', 8, 2, ['business', 'dining'], { walkable: true, spots: [{ kind: 'stand', x: 40, y: -5 }, { kind: 'stand', x: 40, y: 45 }, { kind: 'stand', x: 120, y: 45 }], interact: { capacity: 3, durationMin: 20, durationMax: 60 } }),
	drawn('print-station', 'Print Station', 2, 1, ['business'], { spots: at(2, 1), interact: { capacity: 1, durationMin: 3, durationMax: 7 } }),
	drawn('pool-lap', 'Lap Pool', 24, 10, ['wellness', 'pool', 'fitness'], { spots: [{ kind: 'stand', x: 60, y: 210 }, { kind: 'stand', x: 180, y: 210 }, { kind: 'stand', x: 300, y: 210 }, { kind: 'stand', x: 420, y: 210 }], interact: { capacity: 4, durationMin: 20, durationMax: 60 } }),
	drawn('gym-bike', 'Exercise Bike', 2, 4, ['fitness'], { walkable: true, spots: [{ kind: 'stand', x: 20, y: 90 }], interact: { capacity: 1, durationMin: 10, durationMax: 40 } }),
	drawn('cable-machine', 'Cable Machine', 2, 2, ['fitness'], { spots: at(2, 2), interact: { capacity: 1, durationMin: 8, durationMax: 20 } }),
	drawn('weights-rack', 'Weights Rack', 3, 1, ['fitness'], { spots: at(3, 1), interact: { capacity: 2, durationMin: 8, durationMax: 20 } }),
	drawn('spa-bed', 'Treatment Bed', 2, 4, ['wellness', 'treatment'], { walkable: true, spots: [{ kind: 'stand', x: 20, y: 90 }], interact: { capacity: 1, durationMin: 30, durationMax: 60 }, label: 'therapy' }),
	drawn('towel-cabinet', 'Towel Cabinet', 2, 1, ['wellness', 'housekeeping'], { spots: at(2, 1), interact: { capacity: 1, durationMin: 2, durationMax: 5 } }),
	drawn('stair-flight', 'Stair Flight', 3, 4, ['structure'], { spots: at(3, 4, 'E'), interact: { capacity: 1, durationMin: 2, durationMax: 5 } }),
	drawn('riser-closet', 'Riser Cupboard', 2, 2, ['structure', 'back-of-house'], { spots: at(2, 3, 'W'), interact: { capacity: 1, durationMin: 4, durationMax: 10 }, label: 'riser' }),
	drawn('column', 'Structural Column', 1, 1, ['structure']),
	drawn('ahu', 'Air Handling Unit', 6, 4, ['mechanical', 'back-of-house'], { spots: at(6, 4), interact: { capacity: 1, durationMin: 8, durationMax: 20 }, label: 'plant' }),
	drawn('chiller', 'Chiller', 8, 5, ['mechanical', 'back-of-house'], { spots: at(8, 5), interact: { capacity: 1, durationMin: 8, durationMax: 20 } }),
	drawn('water-tank', 'Water Tank', 4, 4, ['mechanical', 'back-of-house'], { spots: at(4, 4, 'E'), interact: { capacity: 1, durationMin: 6, durationMax: 12 } }),
	drawn('fire-pump', 'Fire Pump', 3, 2, ['mechanical', 'back-of-house'], { spots: at(3, 2), interact: { capacity: 1, durationMin: 6, durationMax: 12 } }),
	drawn('control-panel', 'Building Control Panel', 2, 1, ['mechanical', 'business'], { spots: at(2, 1), interact: { capacity: 1, durationMin: 5, durationMax: 15 }, label: 'bms' }),
	drawn('signage', 'Directory Sign', 1, 2, ['lounge'], { spots: at(1, 2, 'E'), interact: { capacity: 2, durationMin: 2, durationMax: 6 } }),
	drawn('greeting-desk', 'Bell Desk', 3, 1, ['front-desk'], { spots: at(3, 1, 'N', 'bell-point'), interact: { capacity: 1, durationMin: 3, durationMax: 8 } }),
	drawn('concierge-desk', 'Concierge Desk', 3, 1, ['front-desk'], { spots: at(3, 1, 'N', 'concierge-point'), interact: { capacity: 1, durationMin: 4, durationMax: 10 } }),
]

const ROLES = [
	{ id: 'role-guest', label: 'Guest', color: '#3794ff', focusTags: ['portal', 'hygiene', 'living', 'lounge', 'front-desk', 'dining', 'wellness', 'fitness', 'bar', 'pool', 'soc-chatty'], restrictedTags: ['back-of-house', 'mechanical'], taskIds: [], focusChance: 70 },
	{ id: 'role-receptionist', label: 'Receptionist', color: '#f4a261', focusTags: ['front-desk'], restrictedTags: [], taskIds: ['task-reception', 'task-concierge', 'task-bell'], focusChance: 100 },
	{ id: 'role-chef', label: 'Chef', color: '#e9f5db', focusTags: ['cooking', 'hygiene', 'soc-loner'], restrictedTags: [], taskIds: ['task-kitchen-table', 'task-kitchen-sink', 'task-kitchen-stove', 'task-pass', 'task-dishwash'], focusChance: 100 },
	{ id: 'role-housekeeper', label: 'Housekeeper', color: '#b5e2fa', focusTags: ['hygiene', 'living', 'laundry', 'housekeeping'], restrictedTags: [], taskIds: ['task-linen', 'task-laundry'], focusChance: 90 },
	{ id: 'role-server', label: 'Server', color: '#ffd166', focusTags: ['dining', 'bar', 'cooking', 'soc-chatty'], restrictedTags: [], taskIds: ['task-cafe', 'task-table-service'], focusChance: 100 },
	{ id: 'role-bartender', label: 'Bartender', color: '#c084d8', focusTags: ['bar', 'soc-chatty'], restrictedTags: [], taskIds: ['task-bar'], focusChance: 100 },
	{ id: 'role-engineer', label: 'Engineer', color: '#9aa5b1', focusTags: ['mechanical', 'structure', 'laundry'], restrictedTags: [], taskIds: ['task-control-panel', 'task-riser', 'task-plant'], focusChance: 100 },
	{ id: 'role-attendant', label: 'Laundry Attendant', color: '#7fd1ae', focusTags: ['laundry', 'housekeeping', 'storage'], restrictedTags: [], taskIds: ['task-laundry', 'task-store'], focusChance: 100 },
	{ id: 'role-therapist', label: 'Spa Therapist', color: '#f7b6d2', focusTags: ['treatment', 'wellness', 'fitness'], restrictedTags: [], taskIds: ['task-spa'], focusChance: 100 },
	{ id: 'role-security', label: 'Security Officer', color: '#5c677d', focusTags: ['front-desk', 'portal', 'lounge'], restrictedTags: [], taskIds: ['task-lobby-post'], focusChance: 80 },
]

const TASKS = [
	{ id: 'task-reception', label: 'Reception station', tags: ['front-desk'], post: { assetId: 'reception-desk', post: 'reception-station' } },
	{ id: 'task-concierge', label: 'Concierge point', tags: ['front-desk'], post: { assetId: 'concierge-desk', post: 'concierge-point' } },
	{ id: 'task-bell', label: 'Bell desk', tags: ['front-desk'], post: { assetId: 'greeting-desk', post: 'bell-point' } },
	{ id: 'task-lobby-post', label: 'Lobby post', tags: ['front-desk', 'lounge'] },
	{ id: 'task-kitchen-table', label: 'Kitchen station', tags: ['cooking'], post: { assetId: 'kitchen-table-1', post: 'kitchen-station' } },
	{ id: 'task-kitchen-sink', label: 'Wash station', tags: ['cooking'], post: { assetId: 'kitchen-sink', post: 'kitchen-station' } },
	{ id: 'task-kitchen-stove', label: 'Cooking battery', tags: ['cooking'], post: { assetId: 'table-stove', post: 'kitchen-station' } },
	{ id: 'task-pass', label: 'Kitchen pass', tags: ['cooking'], post: { assetId: 'pass-window', post: 'pass' } },
	{ id: 'task-dishwash', label: 'Dish return', tags: ['cooking'], post: { assetId: 'dish-return', post: 'dishwash' } },
	{ id: 'task-cafe', label: 'Cafe counter', tags: ['dining'], post: { assetId: 'cafe-counter', post: 'cafe-point' } },
	{ id: 'task-table-service', label: 'Table service', tags: ['dining', 'lounge'] },
	{ id: 'task-bar', label: 'Bar service', tags: ['bar'], post: { assetId: 'bar-counter', post: 'bar-back' } },
	{ id: 'task-linen', label: 'Linen handling', tags: ['housekeeping'], post: { assetId: 'linen-shelf', post: 'linen' } },
	{ id: 'task-laundry', label: 'Laundry duty', tags: ['laundry'], post: { assetId: 'washer-1', post: 'washer' } },
	{ id: 'task-store', label: 'Stock control', tags: ['storage'], post: { assetId: 'dry-store-shelf', post: 'stock' } },
	{ id: 'task-control-panel', label: 'BMS panel', tags: ['mechanical', 'business'], post: { assetId: 'control-panel', post: 'bms' } },
	{ id: 'task-riser', label: 'Riser check', tags: ['structure'], post: { assetId: 'riser-closet', post: 'riser' } },
	{ id: 'task-plant', label: 'Plant room round', tags: ['mechanical'], post: { assetId: 'ahu', post: 'plant' } },
	{ id: 'task-spa', label: 'Treatment session', tags: ['treatment'], post: { assetId: 'spa-bed', post: 'therapy' } },
]

const POOL_PLAN = [
	{ roleId: 'role-guest', count: 58 },
	{ roleId: 'role-receptionist', count: 4 },
	{ roleId: 'role-security', count: 2, floorIds: ['floor-g'] },
	{ roleId: 'role-bartender', count: 3 },
	{ roleId: 'role-chef', count: 8 },
	{ roleId: 'role-server', count: 7 },
	{ roleId: 'role-housekeeper', count: 9 },
	{ roleId: 'role-attendant', count: 3 },
	{ roleId: 'role-engineer', count: 3 },
	{ roleId: 'role-therapist', count: 3 },
]

const base = JSON.parse(fs.readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, ''))
const ASSET_MAP = new Map()
for (const a of [...base.originAssets, ...NEW_ASSETS]) ASSET_MAP.set(a.id, a)


// ---------- rooms ----------

function paintBands(g, bays) {
	for (const band of [BAND_N, BAND_S]) {
		fill(g, rect(band.wall, bays[0][0] - 1, band.wall, bays[bays.length - 1][1] + 1), 'blocked')
		for (const [c0, c1] of bays) {
			fill(g, rect(band.r0, c0 - 1, band.r1, c0 - 1), 'blocked')
			fill(g, rect(band.r0, c1 + 1, band.r1, c1 + 1), 'blocked')
			fill(g, rect(band.r0, c0, band.r1, c1), 'walkable')
		}
	}
	fill(g, CORR, 'walkable')
	fill(g, HALL, 'walkable')
}

// Bay plan, shared by every room type. Discipline, applied identically to all four
// types: the west column stays clear as the in-room aisle; the bathroom sits in the
// corridor-side corner behind 1-tile partitions with a 2-tile (1.0 m) door and its
// entry column kept free; every fixture and piece of furniture lives either in the
// head strip (offsets y0..y5) or against the far wall, so nothing can bisect a bay.
// Only the north band is drawn - mirrorBandSouth() repeats it below the corridor.
const PART_ROW = 6         // head-anchored row carrying the bathroom's partition line
const BATH_LAST = 12       // the bathroom reaches the corridor-side wall: 6 rows deep

function bathShell(g, objects, bay, y, partColOffset, fixtures) {
	const [c0, c1] = bay
	const partCol = c0 + partColOffset
	fill(g, rect(y(PART_ROW), partCol + 1, y(PART_ROW), c1), 'blocked')
	fill(g, rect(y(PART_ROW + 1), partCol, y(BATH_LAST), partCol), 'blocked')
	doorV(g, partCol, y(8), y(9))
	for (const [type, dc, dy] of fixtures) objects.push(makeObject(type, c0 + dc, y(dy)))
}

function roomStandard(g, objects, bay, y, opts) {
	const [c0] = bay
	bathShell(g, objects, bay, y, 3, [['toilet', 4, 12], ['washbasin', 5, 12], ['shower', 6, 10]])
	if (opts.twin) {
		objects.push(makeObject('bed-single', c0 + 1, y(0)))
		objects.push(makeObject('bed-single', c0 + 4, y(0)))
	} else {
		objects.push(makeObject('bed-double', c0 + 2, y(0)))
		objects.push(makeObject('nightstand', c0 + 1, y(0)))
		objects.push(makeObject('nightstand', c0 + 5, y(0)))
	}
	objects.push(makeObject('wardrobe', c0 + 1, y(4)))
	objects.push(makeObject('table-1', c0 + 1, y(5)))
	objects.push(makeObject('office-chair', c0 + 3, y(5)))
	objects.push(makeObject('luggage-rack', c0 + 1, y(11)))
	doorH(g, BAND_N.wall, c0, c0 + 1)
}

function roomSuperior(g, objects, bay, y) {
	const [c0] = bay
	bathShell(g, objects, bay, y, 3, [['toilet', 4, 12], ['washbasin', 5, 12], ['shower', 8, 10], ['bathtub', 6, 8], ['washbasin', 7, 12]])
	objects.push(makeObject('bed-king', c0 + 3, y(0)))
	objects.push(makeObject('nightstand', c0 + 2, y(0)))
	objects.push(makeObject('nightstand', c0 + 7, y(0)))
	objects.push(makeObject('tv-stand', c0 + 1, y(4)))
	objects.push(makeObject('sofa-1', c0 + 6, y(4)))
	objects.push(makeObject('wardrobe', c0 + 1, y(5)))
	objects.push(makeObject('armchair', c0 + 7, y(5)))
	objects.push(makeObject('luggage-rack', c0 + 1, y(11)))
	doorH(g, BAND_N.wall, c0, c0 + 1)
}

function roomExecutive(g, objects, bay, y, kind) {
	const [c0] = bay
	if (kind === 'suite') {
		// 19-column bay: bathroom in the far corner (5 x 6 tiles = 7.5 sq m), a living
		// room in the west half and the bedroom between living room and bathroom.
		bathShell(g, objects, bay, y, 13, [['toilet', 14, 12], ['washbasin', 15, 12], ['shower', 17, 10], ['tub-long', 15, 8]])
		objects.push(makeObject('bed-king', c0 + 8, y(0)))
		objects.push(makeObject('nightstand', c0 + 7, y(0)))
		objects.push(makeObject('nightstand', c0 + 12, y(0)))
		objects.push(makeObject('wardrobe', c0 + 9, y(4)))
		objects.push(makeObject('sofa-1', c0 + 2, y(4)))
		objects.push(makeObject('table-1', c0 + 1, y(5)))
		objects.push(makeObject('single-sofa-1', c0 + 4, y(5)))
		objects.push(makeObject('tv-stand', c0 + 1, y(7)))
		objects.push(makeObject('desk-guest', c0 + 4, y(9)))
		objects.push(makeObject('office-chair', c0 + 1, y(9)))
		objects.push(makeObject('armchair', c0 + 3, y(11)))
		objects.push(makeObject('minibar', c0 + 6, y(11)))
		objects.push(makeObject('luggage-rack', c0 + 1, y(12)))
	} else {
		// 12-column bay: bathroom 4 x 6 tiles = 6.0 sq m, entry hall along the west wall
		bathShell(g, objects, bay, y, 7, [['toilet', 8, 12], ['washbasin', 9, 11], ['shower', 11, 12], ['bathtub', 10, 8]])
		objects.push(makeObject('bed-king', c0 + 4, y(0)))
		objects.push(makeObject('nightstand', c0 + 3, y(0)))
		objects.push(makeObject('nightstand', c0 + 8, y(0)))
		objects.push(makeObject('tv-stand', c0 + 1, y(4)))
		objects.push(makeObject('sofa-1', c0 + 1, y(5)))
		objects.push(makeObject('table-1', c0 + 3, y(5)))
		objects.push(makeObject('wardrobe', c0 + 6, y(5)))
		objects.push(makeObject('desk-guest', c0 + 1, y(6)))
		objects.push(makeObject('office-chair', c0 + 5, y(6)))
		objects.push(makeObject('armchair', c0 + 5, y(7)))
		objects.push(makeObject('minibar', c0 + 1, y(8)))
		objects.push(makeObject('luggage-rack', c0 + 1, y(11)))
	}
	doorH(g, BAND_N.wall, c0, c0 + 1)
}

function layRoom(g, objects, declared, bay, plan, opts) {
	const y = rowsOf(BAND_N)
	if (plan === 'standard') roomStandard(g, objects, bay, y, opts)
	else if (plan === 'superior') roomSuperior(g, objects, bay, y)
	else if (plan === 'executive') roomExecutive(g, objects, bay, y, 'executive')
	else roomExecutive(g, objects, bay, y, 'suite')
	declared.push({ name: `n${bay[0]}`, s: rect(BAND_N.r0, bay[0], BAND_N.r1, bay[1]), minTiles: ROOM_MIN[plan] })
}

const ROOM_MIN = { standard: 85, superior: 108, executive: 145, suite: 200 }

// The south band is the north band reflected about the corridor, so the repeated module
// cannot drift and both wings keep identical footprints, furniture and door widths.
function mirrorBandSouth(g, objects, declared) {
	for (let c = 27; c <= 67; c++) {
		for (let o = 0; o <= 12; o++) g[BAND_S.r1 - o][c] = g[BAND_N.r0 + o][c]
		g[BAND_S.wall][c] = g[BAND_N.wall][c]
	}
	const mirrored = []
	for (const obj of objects) {
		const r0 = obj.y / TILE
		const c0 = obj.x / TILE
		if (r0 < BAND_N.r0 || r0 > BAND_N.wall || c0 < 27 || c0 > 67) continue
		const asset = ASSET_MAP.get(obj.type)
		if (!asset) continue
		const steps = ((Math.round(obj.rotation / 90) % 4) + 4) % 4
		const h = steps % 2 === 1 ? asset.w : asset.h
		mirrored.push({ ...obj, id: `${obj.id}s`, rotation: (obj.rotation + 180) % 360, y: px(49 - r0 - h + 1) })
	}
	objects.push(...mirrored)
	for (const d of [...declared]) {
		if (!d.name.startsWith('n')) continue
		declared.push({ ...d, name: `s${d.s.c0}`, s: rect(BAND_S.r0, d.s.c0, BAND_S.r1, d.s.c1) })
	}
}

// ---------- floors ----------

let objCounter = 0
function makeObject(type, col, row, rotation = 0) {
	objCounter += 1
	return { id: `obj-h${String(objCounter).padStart(4, '0')}`, type, x: px(col), y: px(row), rotation }
}

function newFloor(id, name, label) {
	const g = newGrid()
	return { g, floor: { id, name, label, objects: [], defaultWalkable: false }, declared: [], sealed: [] }
}

function sealFloor(entry, spawnZones, allowedRoleIds) {
	const { g, floor } = entry
	floor.walkable = {
		walkableGrid: g.map(row => row.map(state => state !== 'blocked')),
		tileStates: g.map(row => [...row]),
	}
	if (spawnZones.length) floor.spawnZones = spawnZones
	if (allowedRoleIds.length) floor.allowedRoleIds = allowedRoleIds
	return entry
}

function guestFloor(num, plan, opts) {
	const entry = newFloor(`floor-${num}`, opts.name, String(num))
	const { g, floor, declared } = entry
	paintBands(g, BAYS[plan])
	for (const bay of BAYS[plan]) layRoom(g, floor.objects, declared, bay, plan, { twin: opts.twin })
	mirrorBandSouth(g, floor.objects, declared)
	layCore(g)
	punchCoreDoors(g)
	coreObjects(floor.objects)
	layHousekeeping(g, floor.objects, declared)
	layColumns(g, floor.objects)
	const zones = [
		zoneOf(`f${num}-z-guest`, 'Guest corridor', rect(24, 30, 25, 46), ['role-guest']),
		zoneOf(`f${num}-z-hk`, 'Housekeeping', rect(34, 14, 36, 17), ['role-housekeeper']),
	]
	return sealFloor(entry, zones, opts.roles ?? ['role-guest', 'role-housekeeper'])
}

function publicFloor(spec) {
	const entry = newFloor(spec.id, spec.name, spec.label)
	const { g, floor, declared } = entry
	// the building's horizontal circulation exists on every floor, not only the guest floors:
	// without it each public space is an island sealed off from the lift hall and the stairs
	fill(g, CORR, 'walkable')
	fill(g, rect(CORR.r0, HALL.c1, CORR.r1, CORR.c0), 'walkable')
	for (const space of spec.spaces) {
		const s = space.rect
		if (space.open) fill(g, s, 'walkable')
		else {
			perimeter(g, s)
			fill(g, rect(s.r0 + 1, s.c0 + 1, s.r1 - 1, s.c1 - 1), 'walkable')
			declared.push({ name: space.name, s: rect(s.r0 + 1, s.c0 + 1, s.r1 - 1, s.c1 - 1), minTiles: space.min ?? 40 })
		}
		for (const d of space.doors ?? []) {
			if (d.edge === 'S') doorH(g, s.r1, d.at, d.at + (d.span ?? 1))
			else if (d.edge === 'N') doorH(g, s.r0, d.at, d.at + (d.span ?? 1))
			else if (d.edge === 'E') doorV(g, s.c1, d.at, d.at + (d.span ?? 1))
			else doorV(g, s.c0, d.at, d.at + (d.span ?? 1))
		}
	}
	// the core is imposed last so its cells are identical on all 21 floors
	layCore(g)
	// openings punched after the core: only the street floor cuts the envelope wall
	for (const o of spec.openings ?? []) {
		if (o.row !== undefined) doorH(g, o.row, o.c0, o.c1)
		else doorV(g, o.col, o.r0, o.r1)
	}
	punchCoreDoors(g)
	coreObjects(floor.objects)
	for (const item of spec.items ?? []) floor.objects.push(makeObject(item[0], item[1], item[2], item[3] ?? 0))
	layColumns(g, floor.objects)
	return sealFloor(entry, spec.zones ?? [], spec.roles ?? [])
}

// ---------- program: 21 floors ----------

const BUILT = []

BUILT.push(publicFloor({
	id: 'floor-g', name: 'Lobby', label: 'G',
	// Main entrance opposite the taxi drop-off, and a service door landing on the stair 1
	// half-landing and discharging to the yard: two exits at grade, FOH/BOH never share a door.
	openings: [{ row: 8, c0: 36, c1: 37 }, { col: 8, r0: 26, r1: 27 }],
	spaces: [
		{ name: 'arrival hall', open: true, rect: rect(8, 13, 41, 66) },
		{ name: 'public restrooms', rect: rect(33, 58, 41, 67), doors: [{ edge: 'W', at: 36, span: 1 }, { edge: 'N', at: 62, span: 1 }], min: 40 },
		{ name: 'luggage and bell store', rect: rect(33, 44, 41, 52), doors: [{ edge: 'N', at: 47, span: 1 }], min: 40 },
	],
	items: [
		['reception-desk', 30, 17], ['reception-desk', 30, 19],
		['concierge-desk', 40, 17], ['greeting-desk', 40, 19],
		['sofa-1', 30, 28], ['sofa-1', 34, 28], ['single-sofa-1', 38, 28], ['table-1', 32, 30],
		['custom-table-set', 40, 30], ['bench', 28, 25], ['bench', 60, 25],
		['plant-1', 29, 15], ['plant-1', 45, 15], ['plant-1', 29, 32], ['plant-1', 55, 32],
		['signage', 28, 20], ['bar-counter', 52, 15], ['high-table', 51, 20], ['high-table', 55, 20],
		['toilet', 60, 35], ['washbasin', 62, 35], ['toilet', 64, 35], ['washbasin', 60, 38],
		['uniform-desk', 45, 35], ['dry-store-shelf', 47, 38], ['service-cart', 14, 25],
		['armchair', 34, 26], ['armchair', 38, 26], ['tv-stand', 30, 26],
	],
	zones: [
		zoneOf('g-z-street', 'Street arrival', rect(2, 32, 6, 42), ['role-guest']),
		zoneOf('g-z-street-e', 'Street arrival east', rect(20, 74, 30, 77), ['role-guest']),
		zoneOf('g-z-yard', 'Service yard', rect(24, 1, 29, 6), ['role-housekeeper', 'role-attendant', 'role-chef', 'role-server', 'role-security']),
		zoneOf('g-z-lobby', 'Lobby', rect(24, 28, 26, 46), ['role-guest']),
		zoneOf('g-z-desk', 'Front desk', rect(15, 28, 16, 40), ['role-receptionist', 'role-security']),
		zoneOf('g-z-bar', 'Lobby bar', rect(16, 50, 18, 58), ['role-bartender']),
		zoneOf('g-z-service', 'Service line', rect(34, 14, 37, 20), ['role-housekeeper', 'role-attendant', 'role-chef', 'role-server']),
	],
	roles: ['role-guest', 'role-receptionist', 'role-security', 'role-bartender', 'role-housekeeper', 'role-attendant', 'role-chef', 'role-server'],
}))

BUILT.push(publicFloor({
	id: 'floor-1', name: 'Restaurant', label: '1',
	spaces: [
		{ name: 'dining room', rect: rect(8, 27, 22, 67), doors: [{ edge: 'S', at: 40, span: 1 }, { edge: 'S', at: 52, span: 1 }], min: 200 },
		{ name: 'production kitchen', rect: rect(27, 27, 41, 50), doors: [{ edge: 'N', at: 32, span: 1 }, { edge: 'E', at: 33, span: 1 }], min: 120 },
		{ name: 'bar and lounge', rect: rect(27, 52, 41, 67), doors: [{ edge: 'N', at: 56, span: 1 }, { edge: 'W', at: 30, span: 1 }], min: 100 },
	],
	items: [
		['custom-table-set', 29, 10], ['custom-table-set', 33, 10], ['custom-table-set', 37, 10], ['custom-table-set', 41, 10],
		['custom-table-set', 45, 10], ['custom-table-set', 49, 10], ['custom-table-set', 53, 10], ['custom-table-set', 57, 10],
		['custom-table-set', 29, 14], ['custom-table-set', 33, 14], ['custom-table-set', 37, 14], ['custom-table-set', 41, 14],
		['custom-table-set', 45, 14], ['custom-table-set', 49, 14], ['custom-table-set', 53, 14], ['custom-table-set', 57, 14],
		['cafe-counter', 61, 18], ['table-1', 29, 19], ['plant-1', 65, 10],
		['kitchen-table-1', 29, 29], ['table-stove', 34, 29], ['kitchen-sink', 38, 29], ['pass-window', 42, 29],
		['dish-return', 29, 38], ['dry-store-shelf', 33, 37], ['cold-store', 38, 34], ['washer-1', 46, 38],
		['pastry-bench', 43, 31], ['kitchen-table-1', 34, 32], ['service-cart', 47, 30], ['soiled-linen', 22, 33],
		['bar-counter', 54, 29], ['high-table', 55, 33], ['high-table', 59, 33], ['high-table', 63, 33], ['treadmill-1', 64, 29],
	],
	zones: [
		zoneOf('1-z-guest', 'Dining', rect(23, 30, 26, 50), ['role-guest']),
		zoneOf('1-z-kitchen', 'Kitchen', rect(30, 29, 31, 40), ['role-chef']),
		zoneOf('1-z-service', 'Floor service', rect(33, 54, 36, 64), ['role-server', 'role-bartender']),
	],
	roles: ['role-guest', 'role-chef', 'role-server', 'role-bartender'],
}))

BUILT.push(publicFloor({
	id: 'floor-2', name: 'Ballroom', label: '2',
	spaces: [
		{ name: 'ballroom', rect: rect(8, 27, 22, 52), doors: [{ edge: 'S', at: 30, span: 1 }, { edge: 'S', at: 46, span: 1 }], min: 150 },
		{ name: 'breakout north', rect: rect(8, 54, 22, 67), doors: [{ edge: 'S', at: 60, span: 1 }, { edge: 'W', at: 14, span: 1 }], min: 80 },
		{ name: 'breakout south', rect: rect(27, 27, 41, 45), doors: [{ edge: 'N', at: 34, span: 1 }], min: 100 },
		{ name: 'banquet kitchen', rect: rect(27, 47, 41, 67), doors: [{ edge: 'N', at: 52, span: 1 }, { edge: 'W', at: 33, span: 1 }], min: 100 },
	],
	items: [
		['banquet-round', 29, 10], ['banquet-round', 35, 10], ['banquet-round', 41, 10], ['banquet-round', 47, 10],
		['banquet-round', 29, 16], ['banquet-round', 35, 16], ['banquet-round', 41, 16], ['banquet-round', 47, 16],
		['banquet-table', 56, 11], ['banquet-table', 56, 15], ['boardroom-table', 58, 19],
		['banquet-table', 29, 29], ['banquet-table', 29, 33], ['banquet-table', 29, 37], ['high-table', 40, 38],
		['table-stove', 49, 29], ['kitchen-sink', 53, 29], ['dry-store-shelf', 49, 37], ['dish-return', 56, 37], ['pass-window', 60, 31],
		['signage', 26, 24], ['service-cart', 24, 33], ['soiled-linen', 26, 30], ['towel-cabinet', 64, 28],
	],
	zones: [
		zoneOf('2-z-event', 'Pre-function', rect(23, 30, 26, 52), ['role-guest']),
		zoneOf('2-z-banquet', 'Banquet kitchen', rect(30, 49, 32, 60), ['role-chef']),
		zoneOf('2-z-service', 'Event service', rect(33, 29, 36, 40), ['role-server', 'role-housekeeper']),
	],
	roles: ['role-guest', 'role-chef', 'role-server', 'role-housekeeper'],
}))

BUILT.push(publicFloor({
	id: 'floor-3', name: 'Meetings', label: '3',
	spaces: [
		{ name: 'boardroom', rect: rect(8, 27, 22, 41), doors: [{ edge: 'S', at: 30, span: 1 }], min: 80 },
		{ name: 'meeting north', rect: rect(8, 43, 22, 54), doors: [{ edge: 'S', at: 46, span: 1 }], min: 70 },
		{ name: 'meeting east', rect: rect(8, 56, 22, 67), doors: [{ edge: 'S', at: 60, span: 1 }], min: 70 },
		{ name: 'meeting south', rect: rect(27, 27, 41, 46), doors: [{ edge: 'N', at: 32, span: 1 }], min: 100 },
		{ name: 'business centre', rect: rect(27, 48, 41, 67), doors: [{ edge: 'N', at: 52, span: 1 }, { edge: 'W', at: 33, span: 1 }], min: 100 },
	],
	items: [
		['boardroom-table', 29, 13], ['office-chair', 29, 16], ['office-chair', 32, 16], ['av-cart', 39, 10],
		['banquet-table', 45, 11], ['banquet-table', 45, 15], ['av-cart', 52, 19],
		['banquet-table', 58, 11], ['banquet-table', 58, 15], ['high-table', 63, 19],
		['banquet-table', 29, 29], ['banquet-table', 29, 33], ['banquet-table', 29, 37], ['custom-table-set', 40, 30],
		['print-station', 50, 29], ['desk-guest', 54, 29], ['office-chair', 56, 31], ['uniform-desk', 60, 36], ['dry-store-shelf', 50, 37], ['plant-1', 65, 28],
		['signage', 26, 24], ['service-cart', 24, 33],
	],
	zones: [
		zoneOf('3-z-conf', 'Registration', rect(23, 30, 26, 52), ['role-guest']),
		zoneOf('3-z-biz', 'Business centre', rect(31, 50, 34, 60), ['role-server']),
	],
	roles: ['role-guest', 'role-server'],
}))

BUILT.push(publicFloor({
	id: 'floor-4', name: 'Wellness', label: '4',
	spaces: [
		{ name: 'pool hall', rect: rect(8, 27, 22, 55), doors: [{ edge: 'S', at: 30, span: 1 }, { edge: 'S', at: 44, span: 1 }], min: 150 },
		{ name: 'fitness room', rect: rect(8, 57, 22, 67), doors: [{ edge: 'W', at: 14, span: 1 }], min: 60 },
		{ name: 'treatment one', rect: rect(27, 27, 41, 37), doors: [{ edge: 'N', at: 32, span: 1 }], min: 60 },
		{ name: 'treatment two', rect: rect(27, 39, 41, 49), doors: [{ edge: 'N', at: 43, span: 1 }], min: 60 },
		{ name: 'lockers and showers', rect: rect(27, 51, 41, 60), doors: [{ edge: 'N', at: 54, span: 1 }], min: 60 },
		{ name: 'spa store', rect: rect(27, 62, 41, 67), doors: [{ edge: 'W', at: 33, span: 1 }], min: 30 },
	],
	items: [
		['pool-lap', 28, 10], ['bench', 28, 21], ['bench', 34, 21], ['towel-cabinet', 50, 20], ['plant-1', 53, 10],
		['treadmill-1', 58, 10], ['treadmill-1', 61, 10], ['gym-bike', 64, 10], ['weights-rack', 58, 16], ['cable-machine', 63, 17],
		['spa-bed', 29, 29], ['towel-cabinet', 34, 28], ['armchair', 35, 36],
		['spa-bed', 41, 29], ['towel-cabinet', 46, 28], ['armchair', 47, 36],
		['shower', 53, 29], ['toilet', 55, 29], ['washbasin', 57, 29], ['bathtub', 52, 35], ['single-sofa-1', 58, 36],
		['washer-1', 63, 29], ['dryer', 64, 29], ['linen-shelf', 63, 36],
		['signage', 26, 24], ['soiled-linen', 26, 30],
	],
	zones: [
		zoneOf('4-z-wellness', 'Wellness', rect(23, 30, 26, 52), ['role-guest']),
		zoneOf('4-z-therapy', 'Treatment', rect(31, 29, 34, 36), ['role-therapist']),
	],
	roles: ['role-guest', 'role-therapist'],
}))

BUILT.push(publicFloor({
	id: 'floor-5', name: 'Service', label: '5',
	spaces: [
		{ name: 'on-premises laundry', rect: rect(8, 27, 22, 47), doors: [{ edge: 'S', at: 30, span: 1 }, { edge: 'E', at: 14, span: 1 }], min: 120 },
		{ name: 'dry and cold store', rect: rect(8, 49, 22, 67), doors: [{ edge: 'S', at: 52, span: 1 }, { edge: 'W', at: 15, span: 1 }], min: 100 },
		{ name: 'staff room', rect: rect(27, 27, 41, 46), doors: [{ edge: 'N', at: 32, span: 1 }], min: 100 },
		{ name: 'engineering and HR', rect: rect(27, 48, 41, 67), doors: [{ edge: 'N', at: 52, span: 1 }, { edge: 'W', at: 33, span: 1 }], min: 100 },
	],
	items: [
		['washer-1', 29, 10], ['washer-1', 31, 10], ['washer-1', 33, 10], ['dryer', 35, 10], ['dryer', 37, 10],
		['ironing-table', 29, 15], ['linen-shelf', 40, 13], ['linen-shelf', 40, 16], ['service-cart', 44, 19],
		['dry-store-shelf', 50, 10], ['dry-store-shelf', 55, 10], ['cold-store', 50, 14], ['waste-room', 62, 18],
		['staff-locker', 29, 29], ['staff-locker', 29, 31], ['banquet-table', 35, 30], ['banquet-table', 35, 33], ['kitchen-sink', 42, 29], ['dish-return', 42, 33],
		['uniform-desk', 50, 29], ['office-chair', 53, 30], ['desk-guest', 56, 29], ['ahu', 50, 35], ['control-panel', 58, 36], ['dry-store-shelf', 62, 33],
		['signage', 26, 24], ['housekeeping-cart', 21, 33], ['soiled-linen', 26, 30],
	],
	zones: [
		zoneOf('5-z-laundry', 'Laundry', rect(13, 29, 14, 40), ['role-attendant']),
		zoneOf('5-z-hk', 'Housekeeping hub', rect(31, 29, 34, 40), ['role-housekeeper']),
		zoneOf('5-z-eng', 'Engineering', rect(31, 50, 34, 60), ['role-engineer']),
		zoneOf('5-z-stores', 'Stores', rect(12, 50, 13, 60), ['role-chef', 'role-server']),
	],
	roles: ['role-attendant', 'role-housekeeper', 'role-engineer', 'role-chef', 'role-server'],
}))

for (let n = 6; n <= 11; n++) BUILT.push(guestFloor(n, 'standard', { name: `Guest ${n}` }))
BUILT.push(guestFloor(12, 'standard', { name: 'Accessible Guest 12', twin: false }))
for (let n = 13; n <= 15; n++) BUILT.push(guestFloor(n, 'superior', { name: `Superior ${n}` }))
BUILT.push(guestFloor(16, 'executive', { name: 'Executive 16' }))
BUILT.push(guestFloor(17, 'executive', { name: 'Club Level 17' }))
BUILT.push(guestFloor(18, 'executive', { name: 'Junior Suites 18' }))
BUILT.push(guestFloor(19, 'suite', { name: `Grand Suites 19` }))

BUILT.push(publicFloor({
	id: 'floor-20', name: 'Roof', label: '20',
	spaces: [
		{ name: 'sky bar', rect: rect(8, 27, 22, 49), doors: [{ edge: 'S', at: 30, span: 1 }], min: 120 },
		{ name: 'mechanical north', rect: rect(8, 51, 22, 67), doors: [{ edge: 'W', at: 14, span: 1 }], min: 100 },
		{ name: 'plant room', rect: rect(27, 27, 41, 51), doors: [{ edge: 'N', at: 34, span: 1 }], min: 120 },
		{ name: 'bar kitchen', rect: rect(27, 53, 41, 67), doors: [{ edge: 'N', at: 56, span: 1 }, { edge: 'W', at: 33, span: 1 }], min: 80 },
	],
	items: [
		['bar-counter', 29, 10], ['high-table', 29, 13], ['high-table', 33, 13], ['high-table', 37, 13], ['high-table', 41, 13],
		['high-table', 29, 17], ['high-table', 33, 17], ['high-table', 37, 17], ['cafe-counter', 42, 19], ['plant-1', 46, 10],
		['chiller', 52, 10], ['water-tank', 61, 10], ['ahu', 61, 16], ['fire-pump', 52, 17],
		['ahu', 29, 29], ['ahu', 36, 29], ['control-panel', 29, 36], ['water-tank', 40, 34], ['dry-store-shelf', 46, 29],
		['kitchen-sink', 55, 29], ['dish-return', 59, 29], ['dry-store-shelf', 55, 37], ['service-cart', 63, 33], ['washer-1', 65, 29],
		['signage', 26, 24], ['soiled-linen', 26, 33],
	],
	zones: [
		zoneOf('20-z-bar', 'Sky bar', rect(23, 30, 26, 46), ['role-guest']),
		zoneOf('20-z-plant', 'Plant round', rect(31, 29, 34, 46), ['role-engineer']),
		zoneOf('20-z-kitchen', 'Bar kitchen', rect(31, 55, 34, 64), ['role-server']),
	],
	roles: ['role-guest', 'role-engineer', 'role-server'],
}))

const FLOORS = BUILT.map(entry => entry.floor)
const DECLARED = new Map(BUILT.map(entry => [entry.floor.id, entry.declared]))
const SEALED = new Map(BUILT.map(entry => [entry.floor.id, entry.sealed]))

// ---------- validators ----------

const problems = []
const report = []
const fail = (floor, check, detail) => problems.push({ floor, check, detail })

const cellKey = (r, c) => `${r},${c}`

function assetCells(asset, obj) {
	const steps = (Math.round((obj.rotation ?? 0) / 90) + 4) % 4
	const odd = steps % 2 === 1
	const w = odd ? asset.h : asset.w
	const h = odd ? asset.w : asset.h
	const c0 = obj.x / TILE
	const r0 = obj.y / TILE
	const cells = []
	for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) cells.push([r, c])
	return cells
}

function bfsCover(g, floor, sealed) {
	const blockedByObject = new Set()
	for (const obj of floor.objects) {
		const asset = ASSET_MAP.get(obj.type)
		if (!asset || asset.walkable) continue
		for (const [r, c] of assetCells(asset, obj)) blockedByObject.add(cellKey(r, c))
	}
	const sealedCells = new Set()
	for (const s of sealed) for (let r = s.r0; r <= s.r1; r++) for (let c = s.c0; c <= s.c1; c++) sealedCells.add(cellKey(r, c))
	const passable = new Set()
	for (let r = ENV.r0; r <= ENV.r1; r++) for (let c = ENV.c0; c <= ENV.c1; c++) {
		if (g[r][c] === 'blocked' || blockedByObject.has(cellKey(r, c))) continue
		passable.add(cellKey(r, c))
	}
	const start = cellKey(24, 30)
	const seen = new Set(passable.has(start) ? [start] : [])
	const queue = [...seen]
	while (queue.length) {
		const [r, c] = queue.shift().split(',').map(Number)
		for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const k = cellKey(r + dr, c + dc)
			if (!passable.has(k) || seen.has(k)) continue
			seen.add(k)
			queue.push(k)
		}
	}
	const unreachable = [...passable].filter(k => !seen.has(k) && !sealedCells.has(k))
	return { passable, seen, unreachable, blockedByObject, sealedCells }
}

// The tile an interact spot actually resolves to, in the same floor-cell space the engine
// uses, so "the car exists" can never again pass while "nobody can board it" fails.
function spotCell(asset, obj, spot) {
	const w = asset.usePx ? asset.pxW / TILE : asset.w
	const h = asset.usePx ? asset.pxH / TILE : asset.h
	if (spot.kind !== 'edge') return cellKey(Math.floor((obj.y / TILE) + spot.y / TILE), Math.floor((obj.x / TILE) + spot.x / TILE))
	const along = spot.offset / TILE
	const [c, r] = spot.edge === 'N' ? [along, 0] : spot.edge === 'S' ? [along, h] : spot.edge === 'W' ? [0, along] : [w, along]
	return cellKey(Math.floor(obj.y / TILE + r), Math.floor(obj.x / TILE + c))
}

function validateFloor(entry) {
	const { floor } = entry
	const label = floor.label
	const g = floor.walkable.tileStates
	const declared = DECLARED.get(floor.id)
	const sealed = SEALED.get(floor.id)
	const checks = { grid: true, walls: true, objects: true, rooms: true, access: true, egress: true, core: true, portal: true, ops: true, economy: true }

	for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
		if (!['walkable', 'blocked', 'door'].includes(g[r][c])) { fail(label, 'grid', `illegal state at ${r},${c}`); checks.grid = false }
	}
	for (const obj of floor.objects) {
		if (obj.x % TILE || obj.y % TILE) { fail(label, 'grid', `${obj.id} off-grid at ${obj.x},${obj.y}`); checks.grid = false }
		if (!ASSET_MAP.has(obj.type)) { fail(label, 'grid', `${obj.id} uses unknown asset ${obj.type}`); checks.grid = false }
	}

	let masses = 0
	const massSpots = []
	for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS - 1; c++) {
		if (g[r][c] === 'blocked' && g[r][c + 1] === 'blocked' && g[r + 1][c] === 'blocked' && g[r + 1][c + 1] === 'blocked') { masses++; massSpots.push(`${r},${c}`) }
	}
	if (masses) { fail(label, 'walls', `${masses} 2x2 blocked mass(es) at ${massSpots.slice(0, 6).join(' ')} - walls must be single tile`); checks.walls = false }

	const occupied = new Map()
	for (const obj of floor.objects) {
		const asset = ASSET_MAP.get(obj.type)
		if (!asset) continue
		for (const [r, c] of assetCells(asset, obj)) {
			if (!inGrid(r, c)) { fail(label, 'objects', `${obj.id} spills off the grid`); checks.objects = false; continue }
			if (g[r][c] === 'blocked' && !asset.walkable) { fail(label, 'objects', `${obj.id} ${obj.type} embedded in a wall at ${r},${c}`); checks.objects = false }
			if (g[r][c] === 'door') { fail(label, 'objects', `${obj.id} ${obj.type} blocks the door cell ${r},${c}`); checks.objects = false }
			const k = cellKey(r, c)
			if (occupied.has(k)) {
				fail(label, 'objects', `${obj.id} ${obj.type} overlaps ${occupied.get(k)} at ${r},${c}`)
				checks.objects = false
			}
			if (asset.walkable) continue
			occupied.set(k, obj.id)
		}
	}

	for (const space of declared) {
		let doors = 0
		for (let r = space.s.r0 - 1; r <= space.s.r1 + 1; r++) for (let c = space.s.c0 - 1; c <= space.s.c1 + 1; c++) {
			if (!inGrid(r, c)) continue
			const onBorder = r === space.s.r0 - 1 || r === space.s.r1 + 1 || c === space.s.c0 - 1 || c === space.s.c1 + 1
			if (onBorder && g[r][c] === 'door') doors++
		}
		if (!doors) { fail(label, 'rooms', `${space.name} has no door`); checks.rooms = false }
		if (area(space.s) < space.minTiles) { fail(label, 'rooms', `${space.name} is ${area(space.s)} tiles, under its ${space.minTiles} tile target`); checks.rooms = false }
	}

	const cover = bfsCover(g, floor, sealed)
	if (!cover.passable.has(cellKey(24, 30))) { fail(label, 'access', 'corridor seed cell is not passable'); checks.access = false }
	if (cover.unreachable.length) {
		fail(label, 'access', `${cover.unreachable.length} unreachable cell(s): ${cover.unreachable.slice(0, 6).join(' ')}`)
		checks.access = false
	}

	for (const [stair, name] of [[S1, 'stair 1'], [S2, 'stair 2']]) {
		let found = false
		for (let r = stair.r0; r <= stair.r1; r++) for (const c of [stair.c0, stair.c1]) if (g[r][c] === 'door') found = true
		if (!found) { fail(label, 'egress', `${name} has no door cell`); checks.egress = false }
	}
	if (g[23][67] !== 'door' && g[24][67] !== 'door') { fail(label, 'egress', 'corridor does not reach stair 2'); checks.egress = false }
	if (g[23][12] !== 'door' && g[24][12] !== 'door') { fail(label, 'egress', 'hall does not reach stair 1'); checks.egress = false }

	const coreOk = REFERENCE_CORE.every(([r, c, state]) => g[r][c] === state
		|| (label === 'G' && state === 'blocked' && g[r][c] === 'door' && GRADE_OPENINGS.has(cellKey(r, c))))
	if (!coreOk) {
		const bad = REFERENCE_CORE.filter(([r, c, state]) => g[r][c] !== state && !(label === 'G' && state === 'blocked' && g[r][c] === 'door' && GRADE_OPENINGS.has(cellKey(r, c)))).slice(0, 5)
		fail(label, 'core', `core cells differ from the building standard: ${bad.map(([r, c, s]) => `${r},${c} want ${s} got ${g[r][c]}`).join(' | ')}`)
		checks.core = false
	}
	const corePlaced = new Set(floor.objects.map(o => `${o.type}@${o.x / TILE},${o.y / TILE}`))
	for (const [type, c, r] of CORE_OBJECTS) {
		if (!corePlaced.has(`${type}@${c},${r}`)) { fail(label, 'core', `missing ${type} at ${r},${c} (vertical element)`); checks.core = false }
	}

	if (!floor.objects.some(o => (ASSET_MAP.get(o.type)?.tags ?? []).includes('portal'))) {
		fail(label, 'portal', 'no lift car on this floor, cross-floor travel is impossible'); checks.portal = false
	}
	for (const obj of floor.objects) {
		const asset = ASSET_MAP.get(obj.type)
		if (!asset?.tags?.includes('portal')) continue
		const spots = asset.interactSpots ?? []
		const standable = spots.filter(spot => cover.seen.has(spotCell(asset, obj, spot)))
		if (!spots.length) { fail(label, 'portal', `${obj.id} ${obj.type} has no interact spot - the car cannot be boarded`); checks.portal = false }
		else if (!standable.length) { fail(label, 'portal', `${obj.id} ${obj.type} at ${obj.y / TILE},${obj.x / TILE} has no reachable approach tile`); checks.portal = false }
	}

	for (const roleId of floor.allowedRoleIds ?? []) {
		if (!(floor.spawnZones ?? []).some(z => (z.roleIds ?? []).includes(roleId))) {
			fail(label, 'ops', `role ${roleId} is allowed here with no spawn zone`); checks.ops = false
		}
	}
	for (const z of floor.spawnZones ?? []) {
		for (const roleId of z.roleIds ?? []) {
			if (!(floor.allowedRoleIds ?? []).includes(roleId)) {
				fail(label, 'ops', `zone ${z.id} spawns ${roleId}, which this floor does not allow`); checks.ops = false
			}
		}
	}
	const usable = floor.objects.some(o => (ASSET_MAP.get(o.type)?.interactSpots ?? []).length > 0)
	if (floor.objects.length && !usable) { fail(label, 'ops', 'floor has objects but none are interactable'); checks.ops = false }

	// an agent that spawns where it cannot walk is stuck: every in-envelope zone must touch circulation
	for (const z of floor.spawnZones ?? []) {
		const c0 = z.x / TILE, r0 = z.y / TILE
		const c1 = c0 + z.w / TILE - 1, r1 = r0 + z.h / TILE - 1
		if (r1 < ENV.r0 || r0 > ENV.r1 || c1 < ENV.c0 || c0 > ENV.c1) continue
		let served = false
		for (let r = Math.max(r0, ENV.r0); r <= Math.min(r1, ENV.r1) && !served; r++) for (let c = Math.max(c0, ENV.c0); c <= Math.min(c1, ENV.c1); c++) {
			if (cover.seen.has(cellKey(r, c))) { served = true; break }
		}
		if (!served) { fail(label, 'ops', `spawn zone ${z.label} is sealed off from the main circulation`); checks.ops = false }
	}

	let slivers = 0
	for (let r = ENV.r0; r <= ENV.r1; r++) for (let c = ENV.c0; c <= ENV.c1; c++) {
		if (g[r][c] === 'blocked') continue
		const neigh = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => inGrid(r + dr, c + dc) && g[r + dr][c + dc] !== 'blocked').length
		if (neigh === 0) slivers++
	}
	if (slivers) { fail(label, 'economy', `${slivers} isolated single cell(s)`); checks.economy = false }

	const keys = floor.objects.filter(o => o.type.startsWith('bed-')).length
	report.push({ label, name: floor.name, objects: floor.objects.length, keys, zones: (floor.spawnZones ?? []).length, ...checks })
}

// Canonical core cells: every floor must carry the same wall lines, door cells and
// shaft footprints in the same tiles (cross-floor vertical continuity).
function buildReferenceCore() {
	const g = newGrid()
	layCore(g)
	punchCoreDoors(g)
	const cells = []
	const inHousekeepingZone = (r, c) => r >= HK.r0 - 1 && r <= HK.r1 && c >= HK.c0 - 1 && c <= HK.c1 + 1
	const coreCols = [...Array.from({ length: 19 }, (_, i) => i + 8), ...[68, 69, 70, 71]]
	for (const c of coreCols) for (let r = ENV.r0; r <= ENV.r1; r++) {
		if (inHousekeepingZone(r, c)) continue
		cells.push([r, c, g[r][c]])
	}
	return cells
}

const CORE_OBJECTS = [
	...LIFTS.map(l => ['elevator-1', l.col, 10]),
	['riser-closet', 25, 16], ['riser-closet', 25, 19],
	...STAIR_FLIGHTS.map(([c, r]) => ['stair-flight', c, r]),
]

const REFERENCE_CORE = buildReferenceCore()

// ---------- emit ----------


const GLYPH = {
	'bed-double': 'b', 'bed-king': 'B', 'bed-single': 's', wardrobe: 'w', nightstand: 'n', 'desk-guest': 'D', 'tv-stand': 't',
	toilet: 'T', washbasin: 'w', shower: 'H', bathtub: 'U', 'tub-long': 'U', minibar: 'm', 'luggage-rack': 'L', armchair: 'a',
	'elevator-1': 'E', 'riser-closet': 'X', 'stair-flight': 'Z', column: 'O', 'linen-shelf': 'l', 'housekeeping-cart': 'c',
	'soiled-linen': 'u', 'custom-table-set': 'Q', 'table-1': 'q', 'sofa-1': 'F', 'single-sofa-1': 'f', 'bar-counter': '8',
	'banquet-round': 'R', 'high-table': 'h', 'banquet-table': 'N', 'reception-desk': '7', 'kitchen-table-1': 'K', 'table-stove': 'S',
	'kitchen-sink': 'I', 'cafe-counter': '6', 'office-chair': 'i', 'dry-store-shelf': 'd', 'cold-store': 'C', 'dish-return': 'j',
	'pass-window': 'P', washer: 'W', 'washer-1': 'W', dryer: 'y', 'pool-lap': '~', 'treadmill-1': 'r', 'gym-bike': 'g',
	'weights-rack': 'v', 'cable-machine': 'x', 'spa-bed': 'p', 'towel-cabinet': 'k', ahu: 'A', chiller: 'J', 'water-tank': 'M',
	'fire-pump': 'e', 'control-panel': '&', signage: '!', 'greeting-desk': '3', 'concierge-desk': '4', 'uniform-desk': '5',
	'av-cart': 'v', 'boardroom-table': 'N', 'print-station': '&', 'ironing-table': 'z', 'waste-room': 'W', 'staff-locker': 'K',
	'service-cart': 'c', 'vending-machine': 'V', bench: '=', plant: '*', 'custom-draft-object': "'", 'custom-draft-object-5': 'Q',
	'kitchen-table': 'K', 'plant-1': '*',
}

if (DEBUG_LABEL) {
	const entry = BUILT.find(e => e.floor.label.toUpperCase() === DEBUG_LABEL)
	if (!entry) {
		console.log(`no floor labelled ${DEBUG_LABEL}; available: ${FLOORS.map(f => f.label).join(' ')}`)
		process.exit(1)
	}
	const g = entry.floor.walkable.tileStates
	const overlay = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null))
	for (const obj of entry.floor.objects) {
		const asset = ASSET_MAP.get(obj.type)
		if (!asset) continue
		for (const [r, c] of assetCells(asset, obj)) {
			if (!inGrid(r, c)) continue
			overlay[r][c] = GLYPH[obj.type] ?? '?'
		}
	}
	const head = '    ' + Array.from({ length: COLS - ENV.c0 + 1 }, (_, i) => i + ENV.c0).map(c => String(c % 10)).join('')
	console.log(`floor ${entry.floor.label} ${entry.floor.name}  (# wall, + door, . open, letters = objects)`)
	console.log(head)
	for (let r = ENV.r0; r <= ENV.r1; r++) {
		let line = ''
		for (let c = ENV.c0; c <= ENV.c1; c++) line += overlay[r][c] ?? (g[r][c] === 'blocked' ? '#' : g[r][c] === 'door' ? '+' : '.')
		console.log(String(r).padStart(3) + ' ' + line)
	}
	console.log(`declared rooms: ${entry.declared.map(d => `${d.name}[${area(d.s)}t]`).join(' ')}`)
	process.exit(0)
}

for (const entry of BUILT) validateFloor(entry)

const ids = FLOORS.map(f => f.id)
if (new Set(ids).size !== ids.length) fail('building', 'cross-floor', 'duplicate floor ids')
if (FLOORS.length !== 21) fail('building', 'cross-floor', `expected 21 floors, got ${FLOORS.length}`)
const labels = FLOORS.map(f => f.label).join(' ')
if (labels !== 'G 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20') fail('building', 'cross-floor', `floor labels out of program order: ${labels}`)
// Arrival at grade: the street ring must connect to the lobby, the tower envelope above
// grade must stay sealed, and the ground floor needs two exits (entrance + service door).
{
	const street = BUILT.find(b => b.floor.label === 'G')
	const g = street.floor.walkable.tileStates
	const seen = new Set([cellKey(0, 0)])
	const queue = [[0, 0]]
	while (queue.length) {
		const [r, c] = queue.shift()
		for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const rr = r + dr, cc = c + dc
			if (!inGrid(rr, cc)) continue
			const k = cellKey(rr, cc)
			if (seen.has(k) || g[rr][cc] === 'blocked') continue
			seen.add(k)
			queue.push([rr, cc])
		}
	}
	if (!seen.has(cellKey(24, 30))) fail('building', 'arrival', 'the street never reaches the lobby - the front door is missing')
	const unopened = [...GRADE_OPENINGS].filter(k => { const [r, c] = k.split(',').map(Number); return g[r][c] !== 'door' })
	if (unopened.length) fail('building', 'arrival', `grade opening(s) not punched: ${unopened.join(' ')}`)
	for (const other of BUILT.filter(b => b !== street)) {
		const og = other.floor.walkable.tileStates
		const leaks = []
		for (let r = ENV.r0; r <= ENV.r1; r++) for (const c of [ENV.c0, ENV.c1]) if (og[r][c] === 'door') leaks.push(`${r},${c}`)
		for (let c = ENV.c0; c <= ENV.c1; c++) for (const r of [ENV.r0, ENV.r1]) if (og[r][c] === 'door') leaks.push(`${r},${c}`)
		if (leaks.length) fail(other.floor.label, 'arrival', `opening punched through the tower envelope above grade at ${leaks.join(' ')}`)
	}
}

const keyTotal = report.reduce((n, r) => n + r.keys, 0)
if (keyTotal !== 116) fail('building', 'program', `expected 116 keys, laid out ${keyTotal}`)
for (const roleId of POOL_PLAN.map(p => p.roleId)) if (!ROLES.some(r => r.id === roleId)) fail('building', 'program', `pool references unknown role ${roleId}`)
for (const role of ROLES) for (const taskId of role.taskIds) if (!TASKS.some(t => t.id === taskId)) fail('building', 'program', `role ${role.id} references unknown task ${taskId}`)
const allTags = new Set([...base.tags.map(t => t.id), ...NEW_TAGS.map(t => t.id)])
for (const asset of ASSET_MAP.values()) for (const t of asset.tags ?? []) if (!allTags.has(t)) fail('building', 'program', `asset ${asset.id} uses unregistered tag ${t}`)
for (const role of ROLES) for (const t of [...role.focusTags, ...role.restrictedTags]) if (!allTags.has(t)) fail('building', 'program', `role ${role.id} uses unregistered tag ${t}`)
for (const task of TASKS) for (const t of task.tags) if (!allTags.has(t)) fail('building', 'program', `task ${task.id} uses unregistered tag ${t}`)

const layout = {
	version: base.layout.version,
	canvas: base.layout.canvas,
	floors: FLOORS,
	streetWidthTiles: STREET,
	streetFloorId: 'floor-g',
	editorSettings: base.layout.editorSettings,
}

// A role spawns on every floor that carries a zone for it; a role whose zones cover the
// whole building gets no floorIds at all, which is what the engine expects. Derived from
// the built floors so a pool entry can never name a floor it cannot spawn on.
function buildPool() {
	const allFloorIds = FLOORS.map(f => f.id)
	return POOL_PLAN.map(entry => {
		const wanted = entry.floorIds ?? allFloorIds
		const served = FLOORS.filter(f => (f.spawnZones ?? []).some(z => (z.roleIds ?? []).includes(entry.roleId))).map(f => f.id)
		const floorIds = wanted.filter(id => served.includes(id))
		if (!floorIds.length) throw new Error('role ' + entry.roleId + ' has no spawn zone on any floor')
		return { roleId: entry.roleId, count: entry.count, ...(floorIds.length === allFloorIds.length ? {} : { floorIds }) }
	})
}

// Share of target decisions that skip the current floor on purpose. Without it an agent only
// ever rides when its own floor has nothing free, which for a guest floor full of beds is never
// - and a hotel whose lifts are empty is not operating. Staff share is lower: their work is
// floor-bound, but not entirely (kitchen to roof satellite, laundry to guest floors, bar to lobby).
const CROSS_FLOOR_SHARE = {
	'role-guest': 22, 'role-server': 26, 'role-bartender': 14, 'role-housekeeper': 16,
	'role-chef': 10, 'role-attendant': 10, 'role-engineer': 12, 'role-therapist': 8, 'role-security': 6,
}
for (const role of ROLES) {
	const share = CROSS_FLOOR_SHARE[role.id]
	if (share) role.crossFloorChance = share
}

const npcConfig = {
	speed: base.npcConfig.speed,
	defaultRoleId: 'role-guest',
	roles: ROLES,
	tasks: TASKS,
	pool: buildPool(),
	...Object.fromEntries([
		'crossFloorCooldownSeconds', 'progressWatchdogTicks', 'maxRepathAttempts', 'repathCooldownSeconds', 'repathCooldownExponent',
		'pathBudgetMinPerTick', 'pathBudgetAgentsPerCall', 'chooseTargetMinPerTick', 'chooseTargetAgentsPerSlot', 'wanderMemorySize',
		'wanderSmallMapThreshold', 'triggerRatePeriodSeconds', 'frameSimBudgetMs', 'maxSimulationSteps',
	].map(key => [key, base.npcConfig[key]])),
}

const tagIds = new Set(base.tags.map(t => t.id))
const file = {
	$schema: base.$schema,
	version: base.version,
	tags: [...base.tags, ...NEW_TAGS.filter(t => !tagIds.has(t.id))],
	originAssets: [...ASSET_MAP.values()],
	layout,
	npcConfig,
}
const body = JSON.stringify(file, null, 2)

const yes = r => [r.grid && 'grid', r.walls && 'objects', r.rooms && 'rooms', r.access && 'access', r.egress && 'egress', r.core && 'core', r.portal && 'portal', r.ops && 'ops', r.economy && 'tiles'].filter(Boolean).join(' ')
console.log('floor  name                 objects keys zones  checks')
for (const r of report) console.log(`  ${String(r.label).padEnd(3)} ${r.name.padEnd(18)} ${String(r.objects).padStart(5)} ${String(r.keys).padStart(3)} ${String(r.zones).padStart(4)}  ${r.grid && r.walls && r.objects && r.rooms && r.access && r.egress && r.core && r.portal && r.ops && r.economy ? 'ALL PASS' : 'FAILED: ' + yes(r)}`)
console.log(`\nfloors ${FLOORS.length}  keys ${keyTotal}  objects ${FLOORS.reduce((n, f) => n + f.objects.length, 0)}  assets ${ASSET_MAP.size}  tags ${file.tags.length}  pool ${POOL_PLAN.reduce((n, p) => n + p.count, 0)} agents  payload ${(body.length / 1048576).toFixed(2)} / 5 MB`)

if (problems.length) {
	console.log(`\nFAILED ${problems.length} problem(s)`)
	for (const p of problems.slice(0, 80)) console.log(`  [${p.floor}] ${p.check}: ${p.detail}`)
	if (problems.length > 80) console.log(`  ... and ${problems.length - 80} more`)
	process.exitCode = 1
} else if (body.length > MAX_PAYLOAD) {
	console.log('\nFAILED: payload over the 5 MB cap')
	process.exitCode = 1
} else if (WRITE || OUT_ARG) {
	const tmp = `${TARGET}.tmp`
	fs.mkdirSync(path.dirname(TARGET), { recursive: true })
	fs.writeFileSync(tmp, body)
	fs.renameSync(tmp, TARGET)
	console.log(`\nwrote ${path.relative(root, TARGET)}`)
} else {
	console.log('\nall checks green (dry run - pass --write to emit the file)')
}
