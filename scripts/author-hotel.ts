/**
 * author-hotel.ts - lay out the eleven-floor Continental from the assets the library already has.
 *
 * The brief is the player's own sentence: place each floor, release the NPCs, watch them live. So
 * every floor here is built from two things only: the 65 origin assets in the workspace, and the
 * tiles the engine can actually walk on. Nothing is invented, nothing is renamed, and the script
 * refuses to write a payload it cannot read back.
 *
 * What the tariff decides. `TAKING_RATES_CENTS` prices a service by its best qualifying tag, and
 * with the parts that exist only four tags can be earned at all: `chamberlain` (reception-desk),
 * `bar`, `kitchen` and `chambers` (double-bed-1). The other four rates - the two contract boards,
 * the back room and the infirmary - have no asset carrying them, so no plan built from this library
 * can bill them. That is recorded in the output rather than hidden.
 *
 * What the geometry is. One plate on every floor, rows 8..51 and columns 8..81 of the 90x60 grid,
 * bounded by a perimeter wall that sits on the street ring - the same ring `streetEntrances` reads,
 * so the ground floor's doors are the only way in and every upper floor is sealed against a street
 * that is not there. A lift core at the west end carries one `elevator-1` per floor, which is what
 * makes the eleven floors one building rather than eleven rooms: `buildNpcEngineLayout` pairs every
 * portal with the first portal on every other floor, so one car per floor is a full mesh.
 *
 *     npm run author:hotel            write the eleven floors into the dev store
 *     npm run author:hotel -- --check  build and validate, write nothing
 */
import fs from 'node:fs'
import path from 'node:path'
import { readBlueprintDataFile } from '../src/blueprint-editor/store/schemaMigration'
import { normalizeNpcConfigForPersistence, normalizePersistedLayoutData, normalizeTagDefinitions } from '../src/blueprint-editor/domain/schema/dataFile'
import { normalizeOriginAssetFile } from '../src/blueprint-editor/domain/schema/assets'
import { tileStatesToWalkableGrid } from '../src/blueprint-editor/domain/schema/walkable'
import { TAKING_RATES_CENTS } from '../src/blueprint-editor/domain/economy/takings'
import { MAX_OBJECTS_PER_FLOOR, MAX_PAYLOAD_BYTES } from '../src/blueprint-editor/limits'
import type { AssetDef, FloorData, NpcSimulationConfig } from '../src/blueprint-editor/domain/types'

type TileState = 'walkable' | 'blocked' | 'door'
type Grid = TileState[][]

const ROOT = path.resolve(import.meta.dirname, '..')
const FILE = path.join(ROOT, 'src/blueprint-editor/data/blueprint-data.json')

const COLS = 90
const ROWS = 60
const TILE = 20
/** The street ring, in tiles. Doors on the ground floor live on this line and nowhere else. */
const STREET = 8
const PLATE_TOP = STREET
const PLATE_BOTTOM = ROWS - 1 - STREET
const PLATE_LEFT = STREET
const PLATE_RIGHT = COLS - 1 - STREET

/** The lift core: columns 8..13, walled off from the building with the corridor running through it. */
const CORE_RIGHT = 13
/** The corridor band, and the two wall lines the room doors are cut into. */
const CORRIDOR_TOP = 26
const CORRIDOR_BOTTOM = 28
const ROOM_COLS = [15, 26, 37, 48, 59, 70]
const NORTH_BAND = { from: 9, to: 24, doorRow: 25 }
const SOUTH_BAND = { from: 30, to: 50, doorRow: 29 }

function blankGrid(): Grid {
	return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 'walkable' as TileState))
}

function inPlate(c: number, r: number): boolean {
	return c >= PLATE_LEFT && c <= PLATE_RIGHT && r >= PLATE_TOP && r <= PLATE_BOTTOM
}

function set(grid: Grid, c: number, r: number, state: TileState): void {
	if (r < 0 || r >= ROWS || c < 0 || c >= COLS) throw new Error(`tile ${c},${r} is off the canvas`)
	grid[r][c] = state
}

function wallH(grid: Grid, row: number, c0: number, c1: number): void {
	for (let c = c0; c <= c1; c++) set(grid, c, row, 'blocked')
}

function wallV(grid: Grid, col: number, r0: number, r1: number): void {
	for (let r = r0; r <= r1; r++) set(grid, col, r, 'blocked')
}

function perimeter(grid: Grid): void {
	wallH(grid, PLATE_TOP, PLATE_LEFT, PLATE_RIGHT)
	wallH(grid, PLATE_BOTTOM, PLATE_LEFT, PLATE_RIGHT)
	wallV(grid, PLATE_LEFT, PLATE_TOP, PLATE_BOTTOM)
	wallV(grid, PLATE_RIGHT, PLATE_TOP, PLATE_BOTTOM)
}

/**
 * The lift core, and on a room floor the two bands of rooms either side of the corridor.
 *
 * A hall floor gets the core and nothing else: the plate stays open so the programme can be laid
 * out per floor, and the shaft wall is the one piece every floor has to share or the lifts would
 * open onto a wall.
 */
function structure(grid: Grid, kind: 'rooms' | 'hall'): void {
	// The core's east wall, with the corridor punched straight through it. Door tiles, not bare
	// openings: CIR-03 reads a room with no door as dead area, and the lift lobby is a room.
	wallV(grid, CORE_RIGHT + 1, PLATE_TOP + 1, PLATE_BOTTOM - 1)
	set(grid, CORE_RIGHT + 1, CORRIDOR_TOP, 'door')
	set(grid, CORE_RIGHT + 1, CORRIDOR_TOP + 1, 'door')
	set(grid, CORE_RIGHT + 1, CORRIDOR_BOTTOM, 'door')
	if (kind === 'hall') return
	// The corridor's north and south walls, one per room frontage.
	wallH(grid, NORTH_BAND.doorRow, CORE_RIGHT + 2, PLATE_RIGHT - 1)
	wallH(grid, SOUTH_BAND.doorRow, CORE_RIGHT + 2, PLATE_RIGHT - 1)
	// Room party walls, and a door in front of every room.
	for (const c0 of ROOM_COLS) {
		const doorCol = c0 + 2
		wallV(grid, c0 - 1, NORTH_BAND.from, NORTH_BAND.to)
		wallV(grid, c0 - 1, SOUTH_BAND.from, SOUTH_BAND.to)
		set(grid, doorCol, NORTH_BAND.doorRow, 'door')
		set(grid, doorCol, SOUTH_BAND.doorRow, 'door')
	}
	// The last room closes on the plate's own perimeter wall; drawing a second closing line one tile
	// inside it makes a wall two tiles thick, which is what floorGeometry reads.
}

/** Room anchor cells: the top-left tile inside each room, which is where furniture is measured from. */
function roomAnchors(): { c: number; r: number; band: 'north' | 'south' }[] {
	const out: { c: number; r: number; band: 'north' | 'south' }[] = []
	for (const band of [NORTH_BAND, SOUTH_BAND] as const) {
		for (const c0 of ROOM_COLS) {
			out.push({ c: c0, r: band.from + 1, band: band === NORTH_BAND ? 'north' : 'south' })
		}
	}
	return out
}

interface Placement {
	readonly type: string
	/** Offset from the anchor, in tiles. */
	readonly dx: number
	readonly dy: number
	readonly rotation?: number
}

interface Placed {
	readonly id: string
	readonly type: string
	readonly x: number
	readonly y: number
	readonly rotation: number
}

const footprints = new Map<string, { w: number; h: number }>()

function footprintOf(assetId: string): { w: number; h: number } {
	const box = footprints.get(assetId)
	if (!box) throw new Error(`the library has no asset "${assetId}"`)
	return box
}

/**
 * Turn one tile coordinate into a placed object, checking the claim before it is written: the
 * footprint has to sit inside the plate on cells nobody has walked a wall through. A payload whose
 * furniture overlaps its own geometry is the class of defect this whole file exists to avoid.
 */
/**
 * The cells this floor's furniture owns. The painted grid is deliberately left alone: `tileStates` is
 * the walking surface - wall, door, open floor - and what a fixture blocks is derived from the object
 * definition at runtime. Baking a bed's footprint into the paint makes the seed fail two of its own
 * invariants, "a wall or door never shares a cell with another object" and "no wall is two tiles
 * thick", and hides the interact spots an agent has to stand on.
 */
type Occupancy = Set<string>

function place(grid: Grid, used: Occupancy, floorId: string, index: number, at: { c: number; r: number }, item: Placement): Placed {
	const { w, h } = footprintOf(item.type)
	for (let dy = 0; dy < h; dy++) {
		for (let dx = 0; dx < w; dx++) {
			const c = at.c + dx
			const r = at.r + dy
			if (!inPlate(c, r)) throw new Error(`${floorId}: ${item.type} at ${at.c},${at.r} runs off the plate`)
			if (grid[r][c] !== 'walkable') throw new Error(`${floorId}: ${item.type} at ${at.c},${at.r} covers a ${grid[r][c]} tile at ${c},${r}`)
			if (used.has(`${c},${r}`)) throw new Error(`${floorId}: ${item.type} at ${at.c},${at.r} stands on furniture already placed at ${c},${r}`)
		}
	}
	for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) used.add(`${at.c + dx},${at.r + dy}`)
	return {
		id: `obj-${floorId}-${index}`,
		type: item.type,
		x: at.c * TILE,
		y: at.r * TILE,
		rotation: item.rotation ?? 0,
	}
}

/** Free tiles a hall layout may drop furniture on: the plate minus the core, corridor, walls and others' cells. */
function hallSpot(grid: Grid, used: Occupancy, c: number, r: number, assetId: string): { c: number; r: number } | null {
	const { w, h } = footprintOf(assetId)
	if (c + w > PLATE_RIGHT || r + h > PLATE_BOTTOM) return null
	for (let dy = 0; dy < h; dy++) {
		for (let dx = 0; dx < w; dx++) {
			if (!inPlate(c + dx, r + dy)) return null
			if (grid[r + dy][c + dx] !== 'walkable') return null
			if (used.has(`${c + dx},${r + dy}`)) return null
		}
	}
	return { c, r }
}

interface FloorPlan {
	readonly id: string
	readonly label: string
	readonly name: string
	readonly kind: 'rooms' | 'hall'
	/** Furniture for a room floor, placed once in every room. */
	readonly room?: readonly Placement[]
	/** Furniture for a hall floor, placed in order at the given tile anchors. */
	readonly hall?: readonly (Placement & { c: number; r: number })[]
	/** Street doors, ground floor only. */
	readonly streetDoors?: readonly [number, number][]
	readonly allowedRoleIds: readonly string[]
}

const GUEST = 'role-guest'

/**
 * The lift, at one cell for the whole building. BLD-02 measures the portal stack across floors and a
 * drifting floor is "a different building per floor", so the car is not a per-floor choice: buildFloor
 * puts every floor's car here and nowhere else, and no plan can disagree with it.
 *
 * One car, though the eval asks for two (CIR-07: a single portal is one way up and one way out). The
 * engine pairs every portal with the FIRST portal on each other floor, so a second car is not a second
 * destination - its travellers land on the same endpoint cell, and `isOccupied` turns that into a jam:
 * measured at 122 portal-busy waits with one car against 1,010 with two, on a house that served 40
 * billed services a day before the second car and 20 after. The library's only other portal asset is
 * the escalator, whose single interact spot clamps the same way. So the egress rule stays a finding,
 * and the living house keeps one lift.
 */
const LIFT = { c: 10, r: 20 }

/**
 * The eleven floors. The order is the building, bottom up: the arrival floor, the three floors a
 * guest spends money on, the eight floors a guest sleeps and works on.
 */
function floors(): FloorPlan[] {
	const bedRoom: readonly Placement[] = [
		{ type: 'double-bed-1', dx: 1, dy: 1 },
		{ type: 'washbasin', dx: 6, dy: 1 },
		{ type: 'toilet', dx: 7, dy: 3 },
		{ type: 'table-1', dx: 1, dy: 6 },
		{ type: 'armchair-1', dx: 4, dy: 6 },
	]
	const roomsFloor = (id: string, label: string, name: string, extra: readonly Placement[] = []): FloorPlan => ({
		id,
		label,
		name,
		kind: 'rooms',
		room: [...bedRoom, ...extra],
		allowedRoleIds: [GUEST, 'role-housekeeper', 'role-engineer', 'role-security'],
	})
	return [
		{
			id: 'floor-g',
			label: 'G',
			name: 'Arrival floor',
			kind: 'hall',
			// The chamberlain's desk is the money on this floor - it is the only asset in the library that
			// carries the `chamberlain` tag, and the rate on it is the highest the house can bill.
			hall: [
				{ type: 'reception-desk', dx: 0, dy: 0, c: 20, r: 12 },
				// Two desks, because the chamberlain's rate (1800) is the richest the house can bill and
				// one desk is three guest-side spots for up to five hundred arrivals a day.
				{ type: 'reception-desk', dx: 0, dy: 0, c: 30, r: 12 },
				{ type: 'concierge-desk-4', dx: 0, dy: 0, c: 20, r: 14 },
				{ type: 'bell-stand-1', dx: 0, dy: 0, c: 26, r: 14 },
				{ type: 'luggage-cart-2', dx: 0, dy: 0, c: 28, r: 14 },
				{ type: 'safe-deposit-2', dx: 0, dy: 0, c: 34, r: 14 },
				{ type: 'sofa-1', dx: 0, dy: 0, c: 20, r: 34 },
				{ type: 'sofa-1', dx: 0, dy: 0, c: 24, r: 34 },
				{ type: 'armchair-1', dx: 0, dy: 0, c: 28, r: 34 },
				{ type: 'table-1', dx: 0, dy: 0, c: 22, r: 37 },
				{ type: 'grand-piano-3', dx: 0, dy: 0, c: 34, r: 34 },
				{ type: 'potted-plant-1', dx: 0, dy: 0, c: 40, r: 34 },
				{ type: 'clock-1', dx: 0, dy: 0, c: 40, r: 14 },
				{ type: 'wayfinding-totem-1', dx: 0, dy: 0, c: 42, r: 14 },
				{ type: 'toilet', dx: 0, dy: 0, c: 46, r: 12 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 47, r: 12 },
				{ type: 'toilet', dx: 0, dy: 0, c: 46, r: 14 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 47, r: 14 },
			],
			streetDoors: [[25, PLATE_TOP], [26, PLATE_TOP], [55, PLATE_BOTTOM], [56, PLATE_BOTTOM]],
			allowedRoleIds: [GUEST, 'role-receptionist', 'role-bartender', 'role-security', 'role-server', 'role-engineer', 'role-housekeeper', 'role-attendant'],
		},
		{
			id: 'floor-dining',
			label: '1',
			name: 'Dining room',
			kind: 'hall',
			hall: [
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 18, r: 10 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 24, r: 10 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 30, r: 10 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 36, r: 10 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 18, r: 16 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 24, r: 16 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 30, r: 16 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 36, r: 16 },
				{ type: 'dining-table-4', dx: 0, dy: 0, c: 18, r: 34 },
				// The bar end of the dining room. A `dining` table has no rate in the tariff - the only
				// tags that pay are chambers, chamberlain, bar and kitchen - so the three tables at the
				// south end are high tables, which carry `bar` and let the room earn what it serves.
				{ type: 'high-table-1', dx: 0, dy: 0, c: 24, r: 34 },
				{ type: 'high-table-1', dx: 0, dy: 0, c: 30, r: 34 },
				{ type: 'dining-chair-1', dx: 0, dy: 0, c: 21, r: 10 },
				{ type: 'dining-chair-1', dx: 0, dy: 0, c: 27, r: 10 },
				{ type: 'dining-chair-1', dx: 0, dy: 0, c: 33, r: 10 },
				{ type: 'dining-chair-1', dx: 0, dy: 0, c: 39, r: 10 },
				{ type: 'high-table-1', dx: 0, dy: 0, c: 44, r: 34 },
				{ type: 'high-table-1', dx: 0, dy: 0, c: 46, r: 34 },
				{ type: 'side-table-1', dx: 0, dy: 0, c: 21, r: 17 },
				{ type: 'rug-4', dx: 0, dy: 0, c: 42, r: 12 },
				{ type: 'painting-2', dx: 0, dy: 0, c: 42, r: 42 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 48, r: 12 },
				{ type: 'toilet', dx: 0, dy: 0, c: 48, r: 14 },
			],
			allowedRoleIds: [GUEST, 'role-server', 'role-engineer', 'role-security'],
		},
		{
			id: 'floor-bar',
			label: '2',
			name: 'Bar lounge',
			kind: 'hall',
			hall: [
				{ type: 'bar-counter', dx: 0, dy: 0, c: 18, r: 10 },
				{ type: 'bar-counter', dx: 0, dy: 0, c: 23, r: 10 },
				{ type: 'bar-counter', dx: 0, dy: 0, c: 28, r: 10 },
				{ type: 'bar-stool-1', dx: 0, dy: 0, c: 19, r: 12 },
				{ type: 'bar-stool-1', dx: 0, dy: 0, c: 21, r: 12 },
				{ type: 'bar-stool-1', dx: 0, dy: 0, c: 24, r: 12 },
				{ type: 'bar-stool-1', dx: 0, dy: 0, c: 26, r: 12 },
				{ type: 'bar-stool-1', dx: 0, dy: 0, c: 29, r: 12 },
				{ type: 'high-table-1', dx: 0, dy: 0, c: 18, r: 16 },
				{ type: 'high-table-1', dx: 0, dy: 0, c: 21, r: 16 },
				{ type: 'high-table-1', dx: 0, dy: 0, c: 24, r: 16 },
				{ type: 'sofa-1', dx: 0, dy: 0, c: 30, r: 16 },
				{ type: 'single-sofa-1', dx: 0, dy: 0, c: 34, r: 16 },
				{ type: 'table-1', dx: 0, dy: 0, c: 32, r: 34 },
				{ type: 'armchair-1', dx: 0, dy: 0, c: 36, r: 34 },
				{ type: 'fireplace-3', dx: 0, dy: 0, c: 40, r: 34 },
				{ type: 'sculpture-2', dx: 0, dy: 0, c: 44, r: 42 },
				{ type: 'vending-machine', dx: 0, dy: 0, c: 46, r: 42 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 48, r: 12 },
				{ type: 'toilet', dx: 0, dy: 0, c: 48, r: 14 },
			],
			allowedRoleIds: [GUEST, 'role-bartender', 'role-server', 'role-security', 'role-engineer'],
		},
		{
			id: 'floor-business',
			label: '3',
			name: 'Business floor',
			kind: 'hall',
			hall: [
				{ type: 'safe-deposit-2', dx: 0, dy: 0, c: 18, r: 10 },
				{ type: 'safe-deposit-2', dx: 0, dy: 0, c: 18, r: 13 },
				{ type: 'printer-1', dx: 0, dy: 0, c: 24, r: 10 },
				{ type: 'office-chair', dx: 0, dy: 0, c: 26, r: 10 },
				{ type: 'kiosk-2', dx: 0, dy: 0, c: 30, r: 10 },
				{ type: 'display-case-3', dx: 0, dy: 0, c: 34, r: 10 },
				{ type: 'shop-shelf-3', dx: 0, dy: 0, c: 40, r: 10 },
				{ type: 'table-1', dx: 0, dy: 0, c: 20, r: 34 },
				{ type: 'table-1', dx: 0, dy: 0, c: 24, r: 34 },
				{ type: 'theatre-seat-1', dx: 0, dy: 0, c: 22, r: 37 },
				{ type: 'theatre-seat-1', dx: 0, dy: 0, c: 26, r: 37 },
				{ type: 'wayfinding-totem-1', dx: 0, dy: 0, c: 44, r: 34 },
				{ type: 'first-aid-1', dx: 0, dy: 0, c: 46, r: 34 },
				{ type: 'fire-extinguisher-1', dx: 0, dy: 0, c: 47, r: 36 },
				{ type: 'exit-sign-1', dx: 0, dy: 0, c: 46, r: 38 },
			],
			allowedRoleIds: [GUEST, 'role-attendant', 'role-security', 'role-engineer'],
		},
		roomsFloor('floor-beds-1', '4', 'Guest rooms, lower'),
		roomsFloor('floor-beds-2', '5', 'Guest rooms, middle'),
		roomsFloor('floor-beds-3', '6', 'Guest rooms, upper'),
		{
			id: 'floor-wellness',
			label: '7',
			name: 'Wellness floor',
			kind: 'hall',
			hall: [
				{ type: 'treadmill-1', dx: 0, dy: 0, c: 18, r: 10 },
				{ type: 'treadmill-1', dx: 0, dy: 0, c: 20, r: 10 },
				{ type: 'treadmill-1', dx: 0, dy: 0, c: 22, r: 10 },
				{ type: 'weight-rack-3', dx: 0, dy: 0, c: 26, r: 10 },
				{ type: 'weight-rack-3', dx: 0, dy: 0, c: 30, r: 10 },
				{ type: 'pool-lounger-1', dx: 0, dy: 0, c: 18, r: 34 },
				{ type: 'pool-lounger-1', dx: 0, dy: 0, c: 21, r: 34 },
				{ type: 'pool-lounger-1', dx: 0, dy: 0, c: 24, r: 34 },
				{ type: 'water-feature-3', dx: 0, dy: 0, c: 28, r: 34 },
				{ type: 'hedge-3', dx: 0, dy: 0, c: 34, r: 34 },
				{ type: 'bathtub', dx: 0, dy: 0, c: 40, r: 16 },
				{ type: 'shower-stall-2', dx: 0, dy: 0, c: 40, r: 19 },
				{ type: 'towel-rail-2', dx: 0, dy: 0, c: 44, r: 16 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 46, r: 16 },
				{ type: 'staff-locker-1', dx: 0, dy: 0, c: 46, r: 40 },
			],
			allowedRoleIds: [GUEST, 'role-attendant', 'role-engineer', 'role-security'],
		},
		{
			id: 'floor-housekeeping',
			label: '8',
			name: 'Housekeeping floor',
			kind: 'hall',
			hall: [
				{ type: 'washer-1', dx: 0, dy: 0, c: 18, r: 10 },
				{ type: 'washer-1', dx: 0, dy: 0, c: 20, r: 10 },
				{ type: 'washer-1', dx: 0, dy: 0, c: 22, r: 10 },
				{ type: 'linen-shelf-3', dx: 0, dy: 0, c: 26, r: 10 },
				{ type: 'linen-shelf-3', dx: 0, dy: 0, c: 30, r: 10 },
				{ type: 'mop-sink-2', dx: 0, dy: 0, c: 36, r: 10 },
				{ type: 'bin-store-2', dx: 0, dy: 0, c: 18, r: 34 },
				{ type: 'staff-locker-1', dx: 0, dy: 0, c: 22, r: 34 },
				{ type: 'staff-locker-1', dx: 0, dy: 0, c: 22, r: 36 },
				{ type: 'shop-shelf-3', dx: 0, dy: 0, c: 26, r: 34 },
				{ type: 'table-1', dx: 0, dy: 0, c: 34, r: 34 },
				{ type: 'office-chair', dx: 0, dy: 0, c: 37, r: 34 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 46, r: 12 },
				{ type: 'toilet', dx: 0, dy: 0, c: 46, r: 14 },
			],
			allowedRoleIds: [GUEST, 'role-housekeeper', 'role-attendant', 'role-engineer'],
		},
		{
			id: 'floor-kitchen',
			label: '9',
			name: 'Kitchen floor',
			kind: 'hall',
			hall: [
				{ type: 'kitchen-table-1', dx: 0, dy: 0, c: 18, r: 10 },
				{ type: 'kitchen-table-1', dx: 0, dy: 0, c: 21, r: 10 },
				{ type: 'kitchen-sink', dx: 0, dy: 0, c: 24, r: 10 },
				{ type: 'kitchen-sink', dx: 0, dy: 0, c: 27, r: 10 },
				{ type: 'table-stove', dx: 0, dy: 0, c: 30, r: 10 },
				{ type: 'oven-1', dx: 0, dy: 0, c: 33, r: 10 },
				{ type: 'exhaust-hood-3', dx: 0, dy: 0, c: 30, r: 13 },
				{ type: 'kitchen-table-1', dx: 0, dy: 0, c: 18, r: 16 },
				{ type: 'washer-1', dx: 0, dy: 0, c: 21, r: 16 },
				{ type: 'bin-store-2', dx: 0, dy: 0, c: 26, r: 16 },
				{ type: 'mop-sink-2', dx: 0, dy: 0, c: 30, r: 16 },
				{ type: 'linen-shelf-3', dx: 0, dy: 0, c: 34, r: 16 },
				{ type: 'staff-locker-1', dx: 0, dy: 0, c: 18, r: 34 },
				{ type: 'staff-locker-1', dx: 0, dy: 0, c: 18, r: 36 },
				{ type: 'office-chair', dx: 0, dy: 0, c: 22, r: 34 },
				{ type: 'toilet', dx: 0, dy: 0, c: 46, r: 12 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 46, r: 14 },
			],
			allowedRoleIds: [GUEST, 'role-chef', 'role-server', 'role-engineer', 'role-attendant'],
		},
		{
			id: 'floor-services',
			label: '10',
			name: 'Plant floor',
			kind: 'hall',
			// No escalator here: it is the library's second portal asset, its footprint cannot join the
			// stacked shaft (BLD-02), and its single interact spot clamps every destination routed to it.
			hall: [
				{ type: 'stair-flight-4', dx: 0, dy: 0, c: 24, r: 30 },
				{ type: 'exhaust-hood-3', dx: 0, dy: 0, c: 30, r: 10 },
				{ type: 'printer-1', dx: 0, dy: 0, c: 36, r: 10 },
				{ type: 'shop-shelf-3', dx: 0, dy: 0, c: 38, r: 16 },
				{ type: 'staff-locker-1', dx: 0, dy: 0, c: 18, r: 40 },
				{ type: 'bin-store-2', dx: 0, dy: 0, c: 20, r: 40 },
				{ type: 'fire-extinguisher-1', dx: 0, dy: 0, c: 44, r: 40 },
				{ type: 'first-aid-1', dx: 0, dy: 0, c: 46, r: 40 },
				{ type: 'washbasin', dx: 0, dy: 0, c: 48, r: 12 },
				{ type: 'mop-sink-2', dx: 0, dy: 0, c: 44, r: 12 },
			],
			allowedRoleIds: [GUEST, 'role-engineer', 'role-attendant', 'role-security', 'role-housekeeper'],
		},
	]
}

/** The one thing every floor shares: a car that reaches all the others. */
function buildFloor(plan: FloorPlan): FloorData {
	const grid = blankGrid()
	perimeter(grid)
	structure(grid, plan.kind)
	for (const [c, r] of plan.streetDoors ?? []) set(grid, c, r, 'door')

	const objects: Placed[] = []
	const used: Occupancy = new Set()
	let next = 0
	// The car first, on every floor, at the one cell the whole building shares: place() throws if the
	// stack is not free, so a floor that drifts fails the build instead of the sim.
	objects.push(place(grid, used, plan.id, next++, LIFT, { type: 'elevator-1', dx: 0, dy: 0 }))
	if (plan.kind === 'rooms') {
		for (const anchor of roomAnchors()) {
			for (const item of plan.room ?? []) {
				objects.push(place(grid, used, plan.id, next++, { c: anchor.c + item.dx, r: anchor.r + item.dy }, item))
			}
		}
	} else {
		for (const item of plan.hall ?? []) {
			const spot = hallSpot(grid, used, item.c, item.r, item.type)
			if (!spot) throw new Error(`${plan.id}: no room for ${item.type} at ${item.c},${item.r}`)
			objects.push(place(grid, used, plan.id, next++, spot, item))
		}
	}
	if (objects.length > MAX_OBJECTS_PER_FLOOR) throw new Error(`${plan.id} places ${objects.length} objects, over the cap`)

	const tileStates = grid.map(row => [...row]) as FloorData['walkable'] extends { tileStates?: infer T } ? T : never
	return {
		id: plan.id,
		name: plan.name,
		label: plan.label,
		objects: objects as FloorData['objects'],
		defaultWalkable: true,
		walkable: {
			tileStates,
			walkableGrid: tileStatesToWalkableGrid(tileStates as Parameters<typeof tileStatesToWalkableGrid>[0]),
		},
		allowedRoleIds: [...plan.allowedRoleIds],
	}
}

function staffPool(config: NpcSimulationConfig): NpcSimulationConfig['pool'] {
	// One entry per role, because that is what the ingress means: mergeDeploymentPool folds duplicates
	// into a single record and normalizeNpcConfigForPersistence rejects a pool whose count changed. A
	// file with eleven guest entries does not load; a file with one entry of eleven floors does.
	//
	// And the count is per floor, not per entry - spawnAgents loops the floors an entry names and
	// releases `count` agents on each. So 45 guests over eleven floors is 495 of the ~500 arrivals a
	// day the brief asks for, spread through the building rather than parked in the lobby.
	const plans = floors()
	const typesOn = new Map(plans.map(plan => [plan.id, new Set([...(plan.room ?? []), ...(plan.hall ?? [])].map(item => item.type))]))
	const stationOf = (roleId: string): string[] => {
		const role = config.roles.find(candidate => candidate.id === roleId)
		if (!role) return []
		return [...new Set(role.taskIds.map(taskId => config.tasks.find(task => task.id === taskId)?.post?.assetId).filter((id): id is string => !!id))]
	}
	const pool: { roleId: string; count: number; floorIds?: string[] }[] = [
		{ roleId: GUEST, count: 45, floorIds: plans.map(plan => plan.id) },
	]
	const staff: [string, number, string[]][] = [
		['role-receptionist', 4, ['floor-g']],
		['role-bartender', 4, ['floor-bar', 'floor-g']],
		['role-server', 6, ['floor-dining', 'floor-bar']],
		['role-chef', 6, ['floor-kitchen']],
		['role-housekeeper', 4, ['floor-beds-1', 'floor-beds-2', 'floor-beds-3', 'floor-housekeeping']],
		['role-attendant', 3, ['floor-wellness', 'floor-housekeeping', 'floor-services']],
		['role-engineer', 3, ['floor-services', 'floor-kitchen', 'floor-bar']],
		['role-security', 3, ['floor-g', 'floor-business', 'floor-services']],
	]
	for (const [roleId, count, wanted] of staff) {
		// OPS-04 fails "a declared staff post has no station on its floor", and the station is read from
		// the role's own tasks (task.post.assetId). So the deployment is filtered by what the floor holds
		// rather than by what this file claims, and a claim that loses floors is said out loud.
		const stations = stationOf(roleId)
		// A role with no posted task has no station to be without: it keeps the floors it asked for.
		const floored = stations.length === 0 ? wanted : wanted.filter(id => stations.some(station => typesOn.get(id)?.has(station)))
		if (stations.length > 0 && floored.length !== wanted.length) {
			console.log(`  note: ${roleId} asks for ${wanted.join(',')}; only ${floored.join(',') || 'no'} floor(s) hold its station (${stations.join(',')})`)
		}
		if (floored.length) pool.push({ roleId, count, floorIds: floored })
	}
	return pool as NpcSimulationConfig['pool']
}

/**
 * Which half of the contract the payload breaks. `readBlueprintDataFile` answers a rejected file with
 * one sentence - "failed validation" - which is no answer to a generator with eleven floors of
 * geometry in the dock. Naming the stage is what makes the read-back check worth running.
 */
function rejectedStage(payload: unknown): string {
	const file = payload as { tags?: unknown; originAssets?: unknown; layout?: unknown; npcConfig?: unknown }
	if (!normalizeTagDefinitions(file.tags)) return 'tags'
	if (!normalizeOriginAssetFile({ originAssets: file.originAssets })) return 'originAssets'
	if (!normalizePersistedLayoutData(file.layout)) return 'layout'
	if (!normalizeNpcConfigForPersistence(file.npcConfig)) return 'npcConfig'
	return 'cross-reference: a floor names a role or an asset type the file does not define'
}

function main(): void {
	const check = process.argv.includes('--check')
	const raw = JSON.parse(fs.readFileSync(FILE, 'utf8')) as {
		version?: string
		layout: { canvas: Record<string, unknown>; floors: FloorData[]; streetFloorId?: string; streetWidthTiles?: number }
		originAssets: AssetDef[]
		npcConfig: NpcSimulationConfig
	}
	for (const asset of raw.originAssets) footprints.set(asset.id, { w: asset.w, h: asset.h })

	const plans = floors()
	const missing = new Set<string>()
	for (const plan of plans) {
		const wanted = [...(plan.room ?? []), ...(plan.hall ?? [])].map(i => i.type)
		wanted.push('elevator-1')
		for (const type of wanted) if (!footprints.has(type)) missing.add(type)
	}
	if (missing.size) throw new Error(`the plan asks for assets the library does not have: ${[...missing].join(', ')}`)

	const built = plans.map(plan => buildFloor(plan))
	const ground = built.find(f => f.id === 'floor-g')
	if (!ground) throw new Error('the arrival floor is missing from the build')

	// npcConfig lives at the top of the file, NOT inside layout: the ingress refuses a layout that
	// carries one (dataFile.ts normalizePersistedLayoutData), so nesting it writes a file nobody can open.
	const layout = {
		...raw.layout,
		floors: built,
		streetFloorId: 'floor-g',
		streetWidthTiles: STREET,
	}
	const payload = {
		...raw,
		layout,
		npcConfig: { ...raw.npcConfig, pool: staffPool(raw.npcConfig) } as NpcSimulationConfig,
	}
	const text = JSON.stringify(payload, null, 2) + '\n'

	// Read it back through the door the app uses. A plan the ingress rejects is a plan nobody can
	// open, and this file has written one of those before.
	let parsed
	try {
		parsed = readBlueprintDataFile(JSON.parse(text))
	} catch (error) {
		throw new Error(`rejected at: ${rejectedStage(JSON.parse(text))}`, { cause: error })
	}

	const billable = new Set(Object.keys(TAKING_RATES_CENTS))
	const carried = new Set(raw.originAssets.flatMap(a => a.tags ?? []))
	const unpriceable = [...billable].filter(tag => !carried.has(tag))
	const tagsOf = new Map(raw.originAssets.map(a => [a.id, a.tags ?? []]))
	const bytes = Buffer.byteLength(text)
	console.log(`floors: ${parsed.layout.floors.length}`)
	for (const f of parsed.layout.floors) {
		const spots = f.objects.reduce((sum, o) => sum + (raw.originAssets.find(a => a.id === o.type)?.interactSpots?.length ?? 0), 0)
		// What this floor can bill is read from what was actually placed, not from what the library
		// happens to own: a plan that never sets down the desk cannot collect the chamberlain's rate.
		const sold = [...billable].filter(tag => f.objects.some(o => tagsOf.get(o.type)?.includes(tag)))
		console.log(`  ${f.label.padEnd(3)} ${f.name.padEnd(20)} objects ${String(f.objects.length).padStart(3)}  spots ${String(spots).padStart(3)}  roles ${f.allowedRoleIds?.length ?? 0}  bills ${sold.join(',') || 'nothing'}`)
	}
	const deployed = parsed.npcConfig.pool.reduce((s, e) => s + e.count * (e.floorIds?.length ?? built.length), 0)
	console.log(`pool entries: ${parsed.npcConfig.pool.length}, agents on release: ${deployed} (a pool count is per floor, not per entry)`)
	console.log(`payload: ${(bytes / 1024 / 1024).toFixed(2)} MB of a ${(MAX_PAYLOAD_BYTES / 1024 / 1024).toFixed(0)} MB cap`)
	console.log(`tariff tags no asset carries (unreachable at any plan): ${unpriceable.join(', ') || 'none'}`)
	if (bytes > MAX_PAYLOAD_BYTES) throw new Error(`the payload is over the persistence cap: ${bytes} bytes`)
	if (check) {
		console.log('--check: validated, wrote nothing')
		return
	}
	const tmp = `${FILE}.tmp`
	fs.writeFileSync(tmp, text)
	fs.renameSync(tmp, FILE)
	console.log(`wrote ${path.relative(ROOT, FILE)}`)
}

main()
