/**
 * checks.ts - the independent evaluators.
 *
 * Five separate check groups plus the model-integrity gate. They are independent of each other
 * and, more importantly, independent of the generator: nothing here reads a claim, a comment or
 * a report. Every number is recomputed from the tiles the payload actually contains, and every
 * finding ships a counterexample as coordinates rather than an adjective (VA-08, VA-18).
 *
 * Verdicts are three-valued. Where this host cannot decide a question - a jurisdiction's dead-end
 * limit, a measured illuminance, a real door leaf swing - the verdict is `unknown` and the finding
 * says what would close it. An unknown is never promoted to a pass (VA-01, VA-04).
 */
import { octileDistance } from '../../src/engine/npc/distance'
import { findNpcGridPath } from '../../src/engine/npc/pathfinding'
import type { WorldBundle } from './world'
import { METRES_PER_TILE } from './world'
import { clearanceAt, circulationProfile, classifyHalls, DAYLIGHT_DEPTH_CEILING_TILES, depthFieldFrom, entryCell, freeCellMatrix, isServiceRoom } from './metrics'
import type { Cell, Finding, FloorNode, FurnitureNode, RoomNode, Severity } from './types'

const ORTHO: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

function k(x: number, y: number): string {
	return `${x},${y}`
}

function m(tiles: number): string {
	return `${(tiles * METRES_PER_TILE).toFixed(2)} m`
}

/** Cap the cells a single finding paints, so an overlay stays readable and a report stays small. */
function sample(cells: readonly Cell[], limit = 24): Cell[] {
	return cells.length <= limit ? [...cells] : cells.filter((_, i) => i % Math.ceil(cells.length / limit) === 0)
}

function finding(partial: Omit<Finding, 'cells'> & { cells?: Cell[] }): Finding {
	return { ...partial, cells: sample(partial.cells ?? []) }
}

/** Long-stay room types: a windowless or over-deep one is a real defect, not a preference. */
const LONG_STAY_TYPES = new Set(['bedroom', 'lounge', 'restaurant', 'gym', 'conference', 'spa'])

/**
 * Declared interior minima in tiles. These are working bands for this grid, labelled as
 * BUILDING-TYPE CONVENTION - there is no global code minimum for a guest room (TH-24, HS-*).
 */
const MIN_ROOM_TILES: Record<string, number> = {
	bedroom: 24,
	bathroom: 8,
	spa: 16,
	kitchen: 24,
	restaurant: 48,
	bar: 16,
	gym: 32,
	lounge: 32,
	conference: 32,
	shop: 24,
	lobby: 48,
	storage: 6,
	laundry: 16,
	'staff-room': 16,
	pool: 48,
}

const PROPORTION_CEILING: Record<string, number> = {
	bedroom: 3,
	lounge: 2.5,
	restaurant: 2.5,
	conference: 2.5,
	lobby: 4,
}

// ---------------------------------------------------------------------------
// Gate: model integrity. On failure every semantic verdict below is unknown.
// ---------------------------------------------------------------------------

export function runGate(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	const c = floor.counts

	if (!c.reconciles) {
		findings.push(finding({
			id: 'GATE-01', check: 'tile-class reconciliation', category: 'model-integrity', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'occupied + circulation + structure + furniture + street',
			actual: `${c.roomTiles}+${c.circulationTiles}+${c.structureTiles}+${c.furnitureTiles}+${c.streetTiles} = ${c.roomTiles + c.circulationTiles + c.structureTiles + c.furnitureTiles + c.streetTiles}`,
			required: `= grid ${c.gridTiles}`, rule: 'SKILL.md host fact 1b, VA-07',
			why: 'A floor whose tile classes do not close has geometry the harness cannot account for, so every area, share and capacity computed on it is fiction.',
			correction: 'Find the unclassified tiles (render --png and look for the gap), then fix the authored states - do not adjust the counts.',
			cells: [],
		}))
	}

	if (c.unreachableTiles > 0) {
		findings.push(finding({
			id: 'GATE-02', check: 'walkable region connectivity', category: 'model-integrity', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'walkable tiles outside the largest region',
			actual: `${c.unreachableTiles} tiles`, required: '0 tiles', rule: 'FL-09, VA-07',
			why: 'Sealed-off walkable floor is phantom geometry: it inflates area and circulation scores while no agent can ever stand on it.',
			correction: 'Either open a door into the pocket or block it and re-classify it as structure.',
			cells: unreachableCells(floor).slice(0, 24),
		}))
	}

	const phantomDoors = floor.doors.filter(door => !door.cells.some(cell =>
		ORTHO.some(([dx, dy]) => floor.walkable[cell.y + dy]?.[cell.x + dx] === true)))
	if (phantomDoors.length) {
		findings.push(finding({
			id: 'GATE-03', check: 'door opens onto walkable floor', category: 'model-integrity', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'door groups with no walkable neighbour',
			actual: `${phantomDoors.length} of ${floor.doors.length}`, required: '0', rule: 'VA-07, FL-06',
			why: 'A door tile that touches no walkable tile is a hole in a wall that leads nowhere; the room behind it is unreachable but still counts as programme.',
			correction: 'Move the door run onto a wall line that has walkable floor on both sides, or delete it.',
			cells: phantomDoors.flatMap(door => door.cells),
		}))
	}

	const danglingDoors = floor.doors.filter(door => door.connects === null && door.cells.length > 0)
	if (danglingDoors.length) {
		findings.push(finding({
			id: 'GATE-04', check: 'door separates two derived rooms', category: 'model-integrity', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'door groups that do not join exactly two rooms',
			actual: `${danglingDoors.length}`, required: '0 (a door that divides nothing is decoration)', rule: 'SKILL.md host fact 1a, FL-06',
			why: 'Isolated door tiles in an open field do not divide it - you walk around them. The plan then reads as having a doorway the simulation does not have.',
			correction: 'Extend the door run into a cut set across the region, or remove the tiles.',
			cells: danglingDoors.flatMap(door => door.cells),
		}))
	}

	const emptyRooms = floor.rooms.filter(room => room.freeCells === 0)
	if (emptyRooms.length) {
		findings.push(finding({
			id: 'GATE-05', check: 'room has usable interior', category: 'model-integrity', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'rooms with zero free cells',
			actual: `${emptyRooms.length}`, required: '0', rule: 'VA-07, TH-02',
			why: 'A room entirely filled by walls or furniture block-out is not a room; it is area the report will claim and no person can enter.',
			correction: 'Shrink the furniture or enlarge the shell until at least one free cell remains, then re-check clearance.',
			cells: emptyRooms.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const deadPortals = floor.portals.filter(portal => portal.spotCells.length === 0)
	if (deadPortals.length) {
		findings.push(finding({
			id: 'GATE-06', check: 'portal anchored on walkable floor', category: 'model-integrity', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'portals with no walkable interaction cell',
			actual: `${deadPortals.length}`, required: '0', rule: 'VA-07, FL-08',
			why: 'A lift or stair whose boarding cell is blocked cannot be used, so the floor it serves is effectively unreachable - vertical capacity is an anchor, not an object.',
			correction: 'Clear the tiles in front of the portal, or move the portal to a wall that opens onto circulation.',
			cells: deadPortals.flatMap(portal => portal.cells),
		}))
	}

	return findings
}

function unreachableCells(floor: FloorNode): Cell[] {
	const seen: boolean[][] = Array.from({ length: floor.rows }, () => Array.from({ length: floor.cols }, () => false))
	const regions: Cell[][] = []
	for (let y = 0; y < floor.rows; y++) {
		for (let x = 0; x < floor.cols; x++) {
			if (!floor.walkable[y][x] || seen[y][x]) continue
			const region: Cell[] = []
			const queue: Cell[] = [{ x, y }]
			seen[y][x] = true
			while (queue.length) {
				const cell = queue.pop()!
				region.push(cell)
				for (const [dx, dy] of ORTHO) {
					const nx = cell.x + dx
					const ny = cell.y + dy
					if (nx < 0 || ny < 0 || nx >= floor.cols || ny >= floor.rows) continue
					if (seen[ny][nx] || !floor.walkable[ny][nx]) continue
					seen[ny][nx] = true
					queue.push({ x: nx, y: ny })
				}
			}
			regions.push(region)
		}
	}
	if (regions.length <= 1) return []
	const largest = regions.reduce((a, b) => (b.length > a.length ? b : a))
	return regions.filter(region => region !== largest).flat()
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Rooms that are building programme: not circulation, and not the street ring. */
function occupantRooms(floor: FloorNode): RoomNode[] {
	return floor.rooms.filter(room => !room.isCorridor && !room.isStreet)
}

/**
 * An object that blocks its own cells is cut out of the room it stands in, so `roomId` is null for
 * exactly the furniture a provision check has to find. Containment is read from the footprint's
 * neighbours instead: the room a person stands in to use the object is the room the object is in.
 */
function roomBearing(floor: FloorNode, item: FurnitureNode): RoomNode | null {
	const byCell = new Map<string, RoomNode>()
	for (const room of floor.rooms) for (const cell of room.cells) byCell.set(k(cell.x, cell.y), room)
	for (const cell of item.cells) {
		for (const [dx, dy] of ORTHO) {
			const room = byCell.get(k(cell.x + dx, cell.y + dy))
			if (room && !room.isCorridor) return room
		}
	}
	return null
}

export function runGeometry(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	// A plate with no structure at all is ground, not a building. The tile classes still reconcile, so
	// the integrity gate passes and every room-based check has an empty sample set to complain about -
	// which is how an empty plan can otherwise report as nearly clean.
	if (floor.counts.structureTiles === 0 && floor.counts.gridTiles > floor.counts.streetTiles) {
		findings.push(finding({
			id: 'GEO-06', check: 'the plate has no enclosure', category: 'geometry', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'structure tiles on the plate',
			actual: `0 blocked tiles of ${floor.counts.gridTiles - floor.counts.streetTiles} plate tiles - open floor with no wall, room edge or shaft drawn`,
			required: '>= 1 structure tile classifying the plate as built; a floor plan without enclosure has no rooms to type, no adjacency to test and no capacity to place',
			rule: 'SP-* space-programming.md (programme precedes geometry), SKILL.md host fact 1b',
			why: 'Nothing on this floor can be judged yet. Rooms, daylight, catchment and privacy are all relations to an enclosure, so an open plate passes them by having nothing to fail - a green report here says the input is empty, not that the design is good.',
			correction: 'Draw the enclosure first: outer wall, core and the room boundaries the programme needs. Rung "wall" or "core", not a retag.',
			cells: [],
		}))
	}

	// A sliver is a geometry defect whatever the host typed it as - and it is usually untagged,
	// so filtering to occupant rooms would hide exactly the cases this check exists for.
	const slivers = floor.rooms.filter(room => !room.isStreet && (room.areaTiles <= 2 || room.interiorW < 1 || room.interiorH < 1))
	if (slivers.length) {
		findings.push(finding({
			id: 'GEO-01', check: 'quantisation sliver', category: 'geometry', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'rooms of 2 tiles or fewer',
			actual: `${slivers.length}`, required: '0 - a 1x1 usable room needs a 3x3 shell', rule: 'TH-02, GT-10',
			why: 'Rounding leftovers become 0.5 m slivers that no person, cart or wheelchair can use, yet they still count as programme area.',
			correction: 'Absorb the sliver into the adjacent wall, service band or room - the absorber order is fixed, and never into a room\'s usable area.',
			cells: slivers.flatMap(room => room.cells),
		}))
	}

	const undersized = occupantRooms(floor).filter(room => {
		const min = MIN_ROOM_TILES[room.typeId]
		return min !== undefined && room.areaTiles < min
	})
	if (undersized.length) {
		findings.push(finding({
			id: 'GEO-02', check: 'room area against its type minimum', category: 'geometry', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'typed rooms below their declared minimum',
			actual: undersized.map(room => `${room.typeId} ${room.areaTiles}t`).join(', '),
			required: undersized.map(room => `${room.typeId} >= ${MIN_ROOM_TILES[room.typeId]}t`).join(', '),
			rule: 'TH-24, HS-* (BUILDING-TYPE CONVENTION - no global code minimum exists)',
			why: 'A room that measures below its type minimum cannot hold its fixture envelope plus the clearance to use it; it is a drawing, not a room.',
			correction: 'Resize the shell or re-tag the room to a type whose envelope it actually fits.',
			cells: undersized.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const disproportionate = occupantRooms(floor).filter(room => {
		const ceiling = PROPORTION_CEILING[room.typeId] ?? (room.isCorridor ? 4 : 3.5)
		if (room.interiorH === 0 || room.interiorW === 0) return false
		const ratio = Math.max(room.interiorW / room.interiorH, room.interiorH / room.interiorW)
		return ratio > ceiling
	})
	if (disproportionate.length) {
		findings.push(finding({
			id: 'GEO-03', check: 'room proportion', category: 'geometry', severity: 'moderate', verdict: 'fail',
			floorId: floor.id, metric: 'interior aspect ratio vs type ceiling',
			actual: disproportionate.map(room => `${room.typeId} ${room.interiorW}x${room.interiorH}`).join(', '),
			required: '<= 3 sleeping / 2.5 living / 3.5 other / 4 circulation', rule: 'TH-25',
			why: 'An over-elongated room is unusable at its far end: furniture lines up along one axis, the far end becomes storage, and the room reads as a corridor.',
			correction: 'Re-partition the long axis into two rooms, or widen the shell by taking tiles from adjacent circulation.',
			cells: disproportionate.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const overlaps = furnitureOverlaps(floor)
	if (overlaps.length) {
		findings.push(finding({
			id: 'GEO-04', check: 'furniture footprint overlap', category: 'geometry', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'tile collisions between object footprints',
			actual: `${overlaps.length} collisions`, required: '0', rule: 'PP-14, HS-*',
			why: 'Two objects on the same tile is geometry that cannot be built; whichever one the engine stamps last silently wins, so the plan and the simulation disagree.',
			correction: 'Move one of the objects; if both must stay, the room is too small and the shell has to grow.',
			cells: overlaps,
		}))
	}

	const outside = floor.furniture.filter(item =>
		item.bounds.minX < 0 || item.bounds.minY < 0 || item.bounds.maxX >= floor.cols || item.bounds.maxY >= floor.rows)
	if (outside.length) {
		findings.push(finding({
			id: 'GEO-05', check: 'object inside the grid', category: 'geometry', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'objects extending past the grid',
			actual: `${outside.length}`, required: '0', rule: 'GT-18, VA-07',
			why: 'Part of the object falls off the world; the footprint the report reasons about is not the footprint the engine stamps.',
			correction: 'Move the object inside the canvas bounds.',
			cells: outside.flatMap(item => item.cells).slice(0, 24),
		}))
	}

	return findings
}

function furnitureOverlaps(floor: FloorNode): Cell[] {
	const seen = new Map<string, string>()
	const collisions: Cell[] = []
	for (const item of floor.furniture) {
		for (const cell of item.cells) {
			const key = k(cell.x, cell.y)
			const previous = seen.get(key)
			if (previous && previous !== item.id) collisions.push(cell)
			else seen.set(key, item.id)
		}
	}
	return collisions
}

// ---------------------------------------------------------------------------
// Circulation and safety
// ---------------------------------------------------------------------------

export function runCirculation(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	const profile = circulationProfile(floor)
	const free = freeCellMatrix(floor)

	if (profile.widthSamples) {
		const narrow = profile.cells.filter(cell =>
			floor.tileStates[cell.y]?.[cell.x] !== 'door' && clearanceAt(free, cell.x, cell.y) < 2)
		if (narrow.length) {
			const severity: Severity = narrow.length / profile.widthSamples > 0.25 ? 'major' : 'moderate'
			findings.push(finding({
				id: 'CIR-01', check: 'circulation width', category: 'circulation', severity, verdict: 'fail',
				floorId: floor.id, metric: 'circulation tiles narrower than 2 (single file)',
				actual: `${narrow.length}/${profile.widthSamples} tiles = ${((narrow.length / profile.widthSamples) * 100).toFixed(1)}% (min ${profile.min} tiles = ${m(profile.min)})`,
				required: '>= 2 tiles (1.00 m) to pass, >= 3 (1.50 m) to queue', rule: 'CODE-05/27, PP-10/11, FL-04',
				why: 'A 1-tile route is strict single file: two people cannot pass, a cart cannot turn, and under octile A* every meeting becomes a detour or a blockage.',
				correction: 'Widen the run by one tile, taking it from the adjacent room rather than from another corridor - and re-run the checks that the widening touches.',
				cells: narrow,
			}))
		}

		if (profile.deadEnds.length) {
			const longest = longestDeadEndRun(floor, free, profile.deadEnds)
			findings.push(finding({
				id: 'CIR-02', check: 'dead-end circulation', category: 'safety', severity: longest.tiles > 15 ? 'major' : 'moderate', verdict: 'fail',
				floorId: floor.id, metric: 'dead-end tips and longest dead-end run',
				actual: `${profile.deadEnds.length} tips, longest ${longest.tiles} tiles = ${m(longest.tiles)}`,
				required: 'bounded by the jurisdiction\'s limit - UNKNOWN, conservative default 15 tiles (7.5 m) used here', rule: 'CODE-06, FL-05 (REQUIRES CODE VERIFICATION)',
				why: 'A dead end is a single direction of escape; past the limit a person must pass the fire to get out, and the queue at the tip is the model\'s only expression of that.',
				correction: 'Loop the route back into the network, or add a second exit at the tip.',
				cells: longest.cells.length ? longest.cells : profile.deadEnds,
			}))
		}
	}

	const sealedRooms = occupantRooms(floor).filter(room => room.doorIds.length === 0)
	if (sealedRooms.length) {
		findings.push(finding({
			id: 'CIR-03', check: 'room has a door', category: 'safety', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'occupied rooms with no door',
			actual: `${sealedRooms.length}`, required: '0', rule: 'FL-09, VA-07',
			why: 'A room nobody can enter is not programme, it is dead area - and if it is meant to be occupied, its occupants have no escape.',
			correction: 'Cut a door run into the room\'s wall that reaches circulation, then re-check the width and the swing reserve.',
			cells: sealedRooms.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const entry = entryCell(bundle.world, floor)
	if (entry) {
		const field = depthFieldFrom(floor, entry)
		let farthest: { cell: Cell; depth: number } | null = null
		for (const [key_, depth] of field) {
			const [x, y] = key_.split(',').map(Number)
			// The street ring is site, not building. Measuring to the far pavement made every ground
			// floor report a life-safety distance walked across the road.
			if (floor.street[y]?.[x]) continue
			if (farthest === null || depth > farthest.depth) {
				farthest = { cell: { x, y }, depth }
			}
		}
		if (farthest) {
			findings.push(finding({
				id: 'CIR-04', check: 'travel distance to the farthest point', category: 'safety',
				severity: farthest.depth * METRES_PER_TILE > 30 ? 'major' : 'minor',
				verdict: 'unknown',
				floorId: floor.id, metric: 'farthest free tile from the declared arrival point',
				actual: `${farthest.depth} tiles = ${m(farthest.depth)} at (${farthest.cell.x},${farthest.cell.y})`,
				required: 'jurisdiction travel-distance limit - UNKNOWN (needs jurisdiction + edition + clause)', rule: 'CODE-01..08, FQ-* (REQUIRES CODE VERIFICATION)',
				why: 'Travel distance is a life-safety limit, and a number without a jurisdiction is not a verdict. It is reported measured so a reviewer can judge it.',
				correction: 'Name the jurisdiction and edition, then compare; if over, add an exit or shorten the route.',
				cells: [farthest.cell, entry],
			}))
		}

		const detour = measureDetour(bundle, floor, entry)
		if (detour.pairs > 0 && detour.worstRatio > 1.3) {
			findings.push(finding({
				id: 'CIR-05', check: 'desire-line detour over the real A* network', category: 'circulation', severity: 'moderate', verdict: 'fail',
				floorId: floor.id, metric: 'worst path length / octile straight-line ratio',
				actual: `${detour.worstRatio.toFixed(2)}x over ${detour.pairs} sampled trips (mean ${detour.meanRatio.toFixed(2)}x)`,
				required: '<= 1.30x before people leave the path', rule: 'PP-13, TH-11, VA-15',
				why: 'A route that doubles back is not circulation, it is a maze: past roughly 30% detour people stop following it, and the plan\'s capacity claim stops being true.',
				correction: 'Open the plan between the pair, or move the room so the route is direct - measure again after the change.',
				cells: detour.cells,
			}))
		}
	}

	if (floor.portals.length === 0 && !floor.isStreetFloor) {
		findings.push(finding({
			id: 'CIR-06', check: 'floor has vertical access', category: 'safety', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'portals on the floor', actual: '0', required: '>= 1, and a floor with one portal and no alternative is still a failure',
			rule: 'FL-08, MS-10, VT-*',
			why: 'A floor with no lift or stair cannot be reached, occupied or escaped; every room on it is area that does not exist.',
			correction: 'Place the core on the stacked portal coordinates every other floor uses, not somewhere new.',
			cells: [],
		}))
	} else if (floor.portals.length === 1) {
		findings.push(finding({
			id: 'CIR-07', check: 'single portal floor', category: 'safety', severity: 'critical', verdict: 'fail',
			floorId: floor.id, metric: 'distinct vertical portals', actual: '1', required: '>= 2 remote from each other, or one plus a stair',
			rule: 'FL-08, CODE-01..08 (REQUIRES CODE VERIFICATION)',
			why: 'One portal is one way up and one way out; if it is the lift and the lift is the fire, the floor has no alternative escape.',
			correction: 'Add a second portal remote from the first, on the same stacked core coordinates where the building has them.',
			cells: floor.portals.flatMap(portal => portal.cells),
		}))
	}

	return findings
}

interface DeadEndRun { tiles: number; cells: Cell[] }

function longestDeadEndRun(floor: FloorNode, free: boolean[][], tips: readonly Cell[]): DeadEndRun {
	let best: DeadEndRun = { tiles: 0, cells: [] }
	for (const tip of tips) {
		const run: Cell[] = []
		let current: Cell | null = tip
		let previous: Cell | null = null
		for (let guard = 0; guard < 1000 && current; guard++) {
			run.push(current)
			const neighbours = ORTHO
				.map(([dx, dy]) => ({ x: current!.x + dx, y: current!.y + dy }))
				.filter(cell => free[cell.y]?.[cell.x])
				.filter(cell => !(previous && cell.x === previous.x && cell.y === previous.y))
			if (neighbours.length !== 1) break
			previous = current
			current = neighbours[0]
		}
		if (run.length > best.tiles) best = { tiles: run.length, cells: run }
	}
	return best
}

interface DetourResult { pairs: number; worstRatio: number; meanRatio: number; cells: Cell[] }

/**
 * Circulation is validated with real trips over the host's octile A*, not by looking at corridors
 * (VA-15). A sample of room-to-room journeys is routed and compared with the straight-line
 * distance; the ratio is the detour the plan actually imposes.
 */
function measureDetour(bundle: WorldBundle, floor: FloorNode, entry: Cell): DetourResult {
	const engineFloor = bundle.engine.layout.floors.find(candidate => candidate.id === floor.id)
	if (!engineFloor) return { pairs: 0, worstRatio: 0, meanRatio: 0, cells: [] }
	const typed = floor.rooms.filter(room => !room.isCorridor && room.freeCells > 0)
	if (typed.length < 2) return { pairs: 0, worstRatio: 0, meanRatio: 0, cells: [] }

	const free = freeCellMatrix(floor)
	const centroidOf = (room: RoomNode): Cell | null => {
		let best: Cell | null = null
		let bestClearance = -1
		for (const cell of room.cells) {
			const clearance = free[cell.y][cell.x] ? clearanceAt(free, cell.x, cell.y) : 0
			if (clearance > bestClearance) {
				bestClearance = clearance
				best = cell
			}
		}
		return best
	}

	const picks = typed.slice(0, 12)
	let pairs = 0
	let worstRatio = 0
	let sumRatio = 0
	const cells: Cell[] = []
	for (let i = 0; i < picks.length; i++) {
		for (let j = i + 1; j < picks.length; j++) {
			const a = centroidOf(picks[i])
			const b = centroidOf(picks[j])
			if (!a || !b) continue
			const straight = octileDistance(a.x, a.y, b.x, b.y)
			if (straight <= 2) continue
			const route = findNpcGridPath(engineFloor, a, b)
			if (!route.length) continue
			pairs++
			const ratio = route.length / straight
			sumRatio += ratio
			if (ratio > worstRatio) {
				worstRatio = ratio
				cells.length = 0
				cells.push(a, b, ...route.filter((_, index) => index % 3 === 0))
			}
		}
	}
	if (worstRatio > 1.3) cells.push(entry)
	return { pairs, worstRatio, meanRatio: pairs ? sumRatio / pairs : 0, cells }
}

// ---------------------------------------------------------------------------
// Interior: furniture and human scale, not room boxes
// ---------------------------------------------------------------------------

export function runInterior(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	const free = freeCellMatrix(floor)

	const tight = occupantRooms(floor).filter(room => room.freeCells > 0 && room.minFreeRun < 2)
	if (tight.length) {
		findings.push(finding({
			id: 'INT-01', check: 'furnished clearance inside the room', category: 'interior', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'narrowest free run at a door approach, after furniture',
			actual: tight.map(room => `${room.typeId} ${room.minFreeRun}t = ${m(room.minFreeRun)}`).join(', '),
			required: '>= 2 tiles (1.00 m) where a person must pass; 3 (1.50 m) for an accessible route', rule: 'HS-*, PP-14, AX-*, PP-22',
			why: 'This is the interior/architecture coupling failure: the shell measures fine on the plan, but once the bed, wardrobe, desk and door reserve are placed, what is left is a gap nobody can walk through. The room is not good - it is full.',
			correction: 'Move or drop a fixture, rotate the bed off the door swing, or grow the shell. Retagging is not a fix for a clearance failure.',
			cells: tight.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const crowded = occupantRooms(floor).filter(room => {
		if (room.areaTiles === 0) return false
		const blocked = room.cells.filter(cell => !free[cell.y][cell.x]).length
		return blocked / room.areaTiles > 0.6
	})
	if (crowded.length) {
		findings.push(finding({
			id: 'INT-02', check: 'furniture coverage of a room', category: 'interior', severity: 'moderate', verdict: 'fail',
			floorId: floor.id, metric: 'share of room tiles blocked by objects',
			actual: crowded.map(room => `${room.typeId} ${((room.cells.filter(cell => !free[cell.y][cell.x]).length / room.areaTiles) * 100).toFixed(0)}%`).join(', '),
			required: '<= 60%', rule: 'HS-*, TH-24',
			why: 'Above roughly 60% coverage the room is a furniture store with a door; circulation between fixtures disappears before the area number suggests it should.',
			correction: 'Remove fixtures or enlarge the shell; then re-measure the clearance at the door, not the area.',
			cells: crowded.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const colliding = collidingDoorReserves(floor)
	if (colliding.length) {
		findings.push(finding({
			id: 'INT-03', check: 'door reserve overlap', category: 'interior', severity: 'moderate', verdict: 'fail',
			floorId: floor.id, metric: 'door pairs whose swing reserves overlap',
			actual: `${colliding.length}`, required: '0 - two reservations must never overlap', rule: 'PP-14, AX-*',
			why: 'Two doors swinging into the same tile cannot both be open; in use one blocks the other, and the accessible manoeuvring space the plan claims does not exist.',
			correction: 'Separate the openings along the wall, or hang one on the opposite side.',
			cells: colliding,
		}))
	}

	// Circulation is topological, not a size ranking - see classifyHalls. Any other enclosed hall
	// region is a room the plan believes in and the simulation does not.
	const halls = classifyHalls(bundle.world, floor)
	const untagged = halls.untagged
	if (untagged.length) {
		findings.push(finding({
			id: 'INT-04', check: 'room resolves to its intended type', category: 'interior', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'enclosed regions the host typed as hallway',
			actual: `${untagged.length} regions, ${untagged.reduce((sum, room) => sum + room.areaTiles, 0)} tiles${halls.identified ? '' : ' (nothing on this floor reads as circulation, so every enclosed region is listed)'}`,
			required: '0 - every room tile-set carries a fixture tag', rule: 'FL-07, SKILL.md host fact 2',
			why: 'An untagged enclosed room is silently typed as hallway: the plan loses the room, its programme disappears, and the circulation share inflates. Two errors from one omission, which is why they are reported together.',
			correction: 'Place the discriminating fixture - last, because the lowest priority tag wins and a hygiene fixture will retype a kitchen as a bathroom.',
			cells: untagged.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	const mistyped = occupantRooms(floor).filter(room => {
		return room.fixtureTags.includes('hygiene') && !['bathroom', 'spa'].includes(room.typeId)
			|| room.fixtureTags.includes('living') && room.typeId !== 'bedroom'
	})
	if (mistyped.length) {
		findings.push(finding({
			id: 'INT-05', check: 'priority ladder did not retype the room', category: 'interior', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'rooms whose resolved type contradicts their fixture mix',
			actual: mistyped.map(room => `${room.id} -> ${room.typeId} with [${room.fixtureTags.join(',')}]`).join('; '),
			required: 'the discriminating tag must win', rule: 'SKILL.md host fact 3d, FL-07',
			why: 'living(10) and hygiene(20) outrank cooking/dining/retail/meeting(40) and front-desk(50), so one hand-wash sink retypes a restaurant as a bathroom and one sofa retypes a lobby as a bedroom. The simulation then routes people to the wrong room.',
			correction: 'Move the conflicting fixture out, or re-tag it; then re-derive the room type rather than assuming it.',
			cells: mistyped.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	return findings
}

/** Reserve = the tile band immediately on both sides of a door run (PP-14's door reserve space). */
function collidingDoorReserves(floor: FloorNode): Cell[] {
	const claimed = new Map<string, string>()
	const collisions: Cell[] = []
	for (const door of floor.doors) {
		for (const cell of door.cells) {
			for (const [dx, dy] of ORTHO) {
				const nx = cell.x + dx
				const ny = cell.y + dy
				if (floor.tileStates[ny]?.[nx] === 'door') continue
				if (!floor.walkable[ny]?.[nx]) continue
				const key = k(nx, ny)
				const owner = claimed.get(key)
				if (owner && owner !== door.id) collisions.push({ x: nx, y: ny })
				else claimed.set(key, door.id)
			}
		}
	}
	return collisions
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export function runOperations(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	const typed = occupantRooms(floor)
	const service = typed.filter(isServiceRoom)
	const guestFacing = typed.filter(room => ['bedroom', 'lounge', 'restaurant', 'bar', 'gym', 'spa', 'lobby', 'shop'].includes(room.typeId))

	if (guestFacing.length > 0 && service.length === 0) {
		findings.push(finding({
			id: 'OPS-01', check: 'back-of-house on an occupied floor', category: 'operations', severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'service rooms on a floor with guest-facing rooms',
			actual: `0 service rooms serving ${guestFacing.length} guest-facing rooms`,
			required: '>= 1 bounded service room per floor catchment', rule: 'PP-02, PP-03, PP-05, OM-*',
			why: 'Support space is programme, not leftover. Without a floor-level pantry, linen and waste room, staff either improvise storage in guest space or haul everything vertically, and the operational model the design assumes does not run.',
			correction: 'Programme the BOH as a bounded share with a catchment before the geometry - add the room, do not convert a guest room by tag alone.',
			cells: guestFacing.flatMap(room => room.cells).slice(0, 16),
		}))
	}

	if (service.length > 0 && guestFacing.length > 0) {
		const ratio = guestFacing.length / service.length
		if (ratio > 20) {
			findings.push(finding({
				id: 'OPS-02', check: 'service catchment bound', category: 'operations', severity: 'moderate', verdict: 'fail',
				floorId: floor.id, metric: 'guest-facing rooms per service room',
				actual: `${ratio.toFixed(1)}:1`, required: '<= 20:1 as a declared working bound (operator input, no authoritative source)', rule: 'PP-03, HO-* (unsourced - declare it)',
				why: 'A housekeeping pantry serving more rooms than a cart round can reach becomes a corridor of parked trolleys, which is how circulation capacity is quietly spent.',
				correction: 'Add a second catchment, or split the floor into two service zones.',
				cells: service.flatMap(room => room.cells),
			}))
		}
	}

	const exposed = service.filter(room => room.doorIds.every(doorId => {
		const door = floor.doors.find(candidate => candidate.id === doorId)
		if (!door?.connects) return false
		const otherId = door.connects.find(part => part !== room.id)
		if (!otherId) return false
		const other = floor.rooms.find(candidate => candidate.id === otherId)
		return other ? !other.isCorridor : false
	}))
	if (exposed.length) {
		findings.push(finding({
			id: 'OPS-03', check: 'service route kept off the public route', category: 'operations', severity: 'moderate', verdict: 'fail',
			floorId: floor.id, metric: 'service rooms opening directly into a public room',
			actual: `${exposed.length}`, required: '0 - a service door opens onto circulation, not onto guests', rule: 'PP-01, TH-08, OM-*',
			why: 'Waste, linen and delivery then cross the guest route at a doorway, and the crossing count - not the area - is what makes the separation real or fictional.',
			correction: 'Insert a service corridor or a buffer room between the service door and the public space.',
			cells: exposed.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	return findings
}

// ---------------------------------------------------------------------------
// Capacity against declared occupancy
// ---------------------------------------------------------------------------

/**
 * Standing capacity and station provision against the population the simulation declares in
 * `npcConfig.pool`. Only two area figures are used, both retrieved: 0.28 m2 per person is the code
 * floor for occupant-evacuation lift lobbies (HB-11) and 1.21 m2 per person is free standing, LOS A
 * (HB-10). The corpus has no lobby occupant factor, no seats-per-key and no counters-per-key, so no
 * such ratio is invented here - a missing station is reported, a missing count is not.
 */
export function runCapacity(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	const record = bundle.world.occupancy.floors.find(entry => entry.floorId === floor.id)
	if (!record || record.occupants <= 0) return findings

	const c = floor.counts
	const plate = Math.max(0, c.gridTiles - c.streetTiles)

	// Hall that no door, station or route touches is not a lobby, it is an unprogrammed slab. The
	// reach is a declared design assumption (4 m to the nearest thing you might do there), not a code
	// limit: what it judges is whether the floor was drawn for its population or just left open.
	const UNASSIGNED_REACH_TILES = 8
	const free = freeCellMatrix(floor)
	const distance = new Map<string, number>()
	const frontier: Cell[] = []
	for (const door of floor.doors) for (const cell of door.cells) frontier.push(cell)
	for (const item of floor.furniture) for (const cell of item.cells) frontier.push(cell)
	for (const cell of frontier) distance.set(k(cell.x, cell.y), 0)
	let queue = frontier
	for (let depth = 0; queue.length; depth++) {
		const next: Cell[] = []
		for (const cell of queue) {
			for (const [dx, dy] of ORTHO) {
				const nx = cell.x + dx
				const ny = cell.y + dy
				const key = k(nx, ny)
				if (!free[ny]?.[nx] || floor.street[ny]?.[nx] || distance.has(key)) continue
				distance.set(key, depth + 1)
				next.push({ x: nx, y: ny })
			}
		}
		queue = next
	}
	const profile = circulationProfile(floor)
	const stranded = profile.cells.filter(cell => {
		const found = distance.get(k(cell.x, cell.y))
		return found === undefined || found > UNASSIGNED_REACH_TILES
	})
	if (stranded.length * 2 > plate) {
		findings.push(finding({
			id: 'SP-01', check: 'the plate is programmed, not left open', category: 'operations',
			severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'circulation tiles beyond reach of any door, station or fixture',
			actual: `${stranded.length} of ${plate} plate tiles (${((stranded.length / plate) * 100).toFixed(0)}%) sit more than ${UNASSIGNED_REACH_TILES} tiles = ${m(UNASSIGNED_REACH_TILES)} from anything to do or depart from, for ${record.occupants} declared occupants`,
			required: '<= 50% of the plate unassigned at a declared 4 m reach - a design assumption, not a code limit',
			rule: 'SP-* space-programming.md (programme precedes geometry), TH-15 (an open hall is usable only if it is for something)',
			why: 'A floor that is mostly empty hall reads as generous on an area schedule and behaves as nowhere: nobody crosses it, nothing is reached from it, and it is heated, lit and cleaned for no use. The share of unassigned plate is the difference between a room you enter and a field you traverse.',
			correction: 'Programme the void before decorating it: bring the arrival sequence through it (reception and the lift hall within sight of the entrance), or give it a use - seating, queue, market, lounge. Rung "wall", because the fix is rooms, not furniture.',
			cells: stranded.slice(0, 24),
		}))
	}

	const perOccupant = plate * METRES_PER_TILE * METRES_PER_TILE / record.occupants
	const show = (value: number): string => `${value.toFixed(2)} m²`

	if (perOccupant < 0.28) {
		findings.push(finding({
			id: 'CAP-01', check: 'standing capacity against the declared population', category: 'operations',
			severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'plate area per declared occupant',
			actual: `${show(perOccupant)} per person - plate ${plate} tiles = ${show(plate * METRES_PER_TILE * METRES_PER_TILE)} over ${record.occupants} declared agents (${record.byRole.map(role => `${role.roleId} ${role.count}`).join(', ')})`,
			required: '>= 0.28 m² per person is the retrieved code floor, and only for occupant-evacuation lift lobbies; the floor is void where no evacuation lift is required',
			rule: 'HB-11 human-behavior.md:141, HB-10 :131,136 (REQUIRES CODE VERIFICATION for any non-evacuation lobby)',
			why: 'Below the standing floor the declared population physically does not fit the plate it is assigned to: the queue becomes the through-route, and a lobby that cannot hold its arrivals has stopped being a lobby and become an obstruction.',
			correction: 'Grow the hall, or move population off this floor in npcConfig.pool - do not re-describe the area until the tile count changes.',
			cells: [],
		}))
	} else if (perOccupant < 1.21) {
		findings.push(finding({
			id: 'CAP-01', check: 'standing capacity against the declared population', category: 'operations',
			severity: 'moderate', verdict: 'fail',
			floorId: floor.id, metric: 'plate area per declared occupant',
			actual: `${show(perOccupant)} per person, below the 1.21 m² (LOS A) free-standing band`,
			required: '>= 1.21 m² per person for a lobby that holds its population comfortably; 0.28 m² is the code floor for evacuation lobbies only',
			rule: 'HB-10 human-behavior.md:131,136, HB-11 :141',
			why: 'This is the band where a waiting population starts pressing on movement: the arrival experience degrades before any geometry is wrong, which is why it is reported and not silently passed.',
			correction: 'Take the shortfall from low-value floor - a deeper hall at the entrance, not a narrower route to the core.',
			cells: [],
		}))
	}

	// A posted task is a promise that a station and the room around it exist on this floor.
	for (const station of record.stations) {
		const placed = floor.furniture.filter(item => item.assetId === station.assetId && roomBearing(floor, item) !== null)
		if (placed.length) continue
		const staff = station.roles.reduce((sum, role) => sum + role.count, 0)
		findings.push(finding({
			id: 'OPS-04', check: 'a declared staff post has no station on its floor', category: 'operations',
			severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: `station "${station.assetId}" for task "${station.taskId}"`,
			actual: `0 of "${station.assetId}" inside a room on ${floor.id}, while ${staff} declared agent(s) run this post (${station.roles.map(role => `${role.roleId} ${role.count}`).join(', ')})`,
			required: '>= 1 station of the declared type inside a room on the floor its roles are assigned to; how many desks the load needs is PP-08 and needs a declared arrival rate, which this payload does not carry',
			rule: 'PP-08 professional-practice.md:311 (heuristic method, inputs undeclared), HB-20 human-behavior.md:236',
			why: 'The simulation says this work happens here and the plan gives it nowhere to happen. The agents will idle or improvise the nearest guest space, and a station drawn on the plan but absent from the room list is invisible to every other check in this suite.',
			correction: `Add "${station.assetId}" inside the room that serves it, then re-check the room's type: a station dropped into circulation proves nothing about the space around it.`,
			cells: [],
		}))
	}

	// Standing capacity in the halls, judged only at the sourced floor. Area per occupant (CAP-01) can
	// be met by a slab nobody can use; this asks how much of the floor is actually standing space for
	// the people the payload puts on it.
	const standingPerPed = c.circulationTiles > 0 && record.occupants > 0
		? c.circulationTiles * METRES_PER_TILE * METRES_PER_TILE / record.occupants
		: 0
	if (record.occupants > 0 && c.circulationTiles > 0 && standingPerPed < 0.19) {
		findings.push(finding({
			id: 'CAP-02', check: 'standing capacity of the halls against the declared population', category: 'operations',
			severity: 'major', verdict: 'fail',
			floorId: floor.id, metric: 'hall floor per declared occupant',
			actual: `${standingPerPed.toFixed(2)} m² per person across ${c.circulationTiles} circulation tiles for ${record.occupants} declared agents - LOS F, packed standing`,
			required: '>= 0.19 m² per person is the LOS F boundary; the intermediate LOS bands are not in this corpus, so nothing between 0.19 and 1.21 is claimed',
			rule: 'HB-10 human-behavior.md:131,136, HB-01 :41',
			why: 'Below this the population is not using the lobby, it is pressing through it: queues stop being queues and become obstruction, and every route width measurement in this report was taken on floor that people cannot actually stand on while doing anything else.',
			correction: 'Give the halls more floor or move population off the floor in npcConfig.pool - seating and service positions do not substitute for standing area.',
			cells: [],
		}))
	}

	// PP-08 turns a declared arrival rate into staffed positions. The rate is a design input
	// (`spec.json`), not a guess: 250 walk-ins per day over a 120-minute peak window at 3x off-peak
	// intensity, 4 service minutes each. A station is one object, so no desk length is invented.
	const spec = bundle.world.occupancy.arrival
	if (spec) {
		const blocksPerDay = Math.max(1, 1440 / spec.peakWindowMinutes)
		const peakArrivals = Math.ceil(spec.walkInsPerDay / blocksPerDay * spec.peakFactor)
		const required = Math.max(1, Math.ceil(peakArrivals * spec.serviceMinutesPerArrival / spec.peakWindowMinutes))
		for (const station of record.stations.filter(entry => entry.tags.includes('front-desk'))) {
			const provided = floor.furniture.filter(item => item.assetId === station.assetId && roomBearing(floor, item) !== null).length
			if (provided >= required) continue
			findings.push(finding({
				id: 'OPS-05', check: 'staffed positions against declared arrival demand', category: 'operations',
				severity: provided === 0 ? 'major' : 'moderate', verdict: 'fail',
				floorId: floor.id, metric: `"${station.assetId}" positions for ${spec.walkInsPerDay} walk-ins/day`,
				actual: `${provided} in a room on ${floor.id}; PP-08 asks for ${required} (peak ${peakArrivals} arrivals in ${spec.peakWindowMinutes} min at ${spec.peakFactor}x off-peak, ${spec.serviceMinutesPerArrival} min each)`,
				required: `>= ${required} positions of "${station.assetId}", each one an object inside a room`,
				rule: 'PP-08 professional-practice.md:298,301,311 (heuristic method on declared inputs, not a code limit)',
				why: 'Below the computed provision the arrival queue is not delayed by bad luck, it is delayed by arithmetic: every minute of service time is a person standing in the lobby, and the lobby was sized without them. The in/out split and the peak factor are declared inputs, so this number can be argued with by changing them, not by arguing with the tool.',
				correction: `Add ${required - provided} more "${station.assetId}" inside the reception room, or declare a lower walk-in figure in scripts/arch/spec.json - and re-check the queue standing area, because the desks and the queue grow together.`,
				cells: [],
			}))
		}
	}

	return findings
}

// ---------------------------------------------------------------------------
// Environment and experience
// ---------------------------------------------------------------------------

export function runEnvironment(bundle: WorldBundle, floor: FloorNode): Finding[] {
	const findings: Finding[] = []
	const typed = occupantRooms(floor)
	if (!typed.length) return findings

	// TH-26's subject is rooms "intended for long occupancy", and its own remedy for a room that
	// cannot meet the cap is to reclassify it as interior - corridor, store, plant. Judging a kitchen
	// or a laundry by the sidelit depth of a lounge fires the rule at rooms the rule excuses, and the
	// KPI row for this already reads "0 for long-occupancy rooms".
	const deep = typed.filter(room => LONG_STAY_TYPES.has(room.typeId) && room.depthFromFacade > DAYLIGHT_DEPTH_CEILING_TILES)
	if (deep.length) {
		const longStay = deep.filter(room => LONG_STAY_TYPES.has(room.typeId))
		findings.push(finding({
			id: 'ENV-01', check: 'sidelit depth from the facade', category: 'environment',
			severity: longStay.length ? 'major' : 'moderate', verdict: 'fail',
			floorId: floor.id, metric: 'rooms deeper than the sidelit band',
			actual: deep.map(room => `${room.typeId} ${room.depthFromFacade}t = ${m(room.depthFromFacade)}`).join(', '),
			required: `<= ${DAYLIGHT_DEPTH_CEILING_TILES} tiles (~2.5 m) for single-aspect sidelit rooms`, rule: 'TH-26, EN-04, EQ-* (EN 17037 targets; the popular 1.5x/2.5x floor-height multipliers are UNCITED)',
			why: 'Daylight falls off with depth from the glass. Past the band the room is artificially lit all day, which for a bedroom, lounge or restaurant is a quality failure the plan cannot see.',
			correction: 'Change the massing - a thinner plate or a courtyard - rather than the room layout; depth is a plate problem.',
			cells: deep.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	// A room touches the facade when its shallowest cell sits against the envelope wall, i.e. at
	// depth 1 (the wall itself is depth 0). Anything deeper has no glass.
	const windowless = typed.filter(room => room.minDepthFromFacade > 1 || room.minDepthFromFacade < 0)
	if (windowless.length) {
		const longStay = windowless.filter(room => LONG_STAY_TYPES.has(room.typeId))
		if (longStay.length) {
			findings.push(finding({
				id: 'ENV-02', check: 'long-stay room has facade access', category: 'environment', severity: 'major', verdict: 'fail',
				floorId: floor.id, metric: 'long-occupancy rooms touching no facade edge',
				actual: `${longStay.length}: ${longStay.map(room => room.typeId).join(', ')}`,
				required: '0 - a windowless occupied room is a finding, not a detail', rule: 'EN-08, TH-26, HB-16',
				why: 'No view, no daylight, no ventilation path. For a room people sleep or eat in, that is a habitability failure, and it forces the mechanical system to carry a load the plan created.',
				correction: 'Move the long-stay rooms to the perimeter band and push circulation, storage and service into the core.',
				cells: longStay.flatMap(room => room.cells).slice(0, 24),
			}))
		}
	}

	const profile = circulationProfile(floor)
	const junctions = new Set(profile.decisionPoints.map(cell => k(cell.x, cell.y)))
	const exposedPrivate = floor.rooms.filter(room => room.privacy === 'private' && room.doorIds.some(doorId => {
		const door = floor.doors.find(candidate => candidate.id === doorId)
		if (!door) return false
		return door.cells.some(cell =>
			[[-2, 0], [2, 0], [0, -2], [0, 2], [-1, 0], [1, 0], [0, -1], [0, 1]]
				.some(([dx, dy]) => junctions.has(k(cell.x + dx, cell.y + dy))))
	}))
	if (exposedPrivate.length) {
		findings.push(finding({
			id: 'ENV-03', check: 'privacy at the threshold', category: 'experience', severity: 'minor', verdict: 'fail',
			floorId: floor.id, metric: 'private rooms whose door opens beside a circulation junction',
			actual: `${exposedPrivate.length}`, required: '0 where privacy is a stated objective', rule: 'HB-17, TH-07, PP-21',
			why: 'A private door at a decision point is seen by everyone passing through it; the privacy gradient the zoning claimed is not the one the geometry delivers.',
			correction: 'Recess the doorway, add a short lobby, or move the junction - the cheapest lever first.',
			cells: exposedPrivate.flatMap(room => room.cells).slice(0, 24),
		}))
	}

	return findings
}

// ---------------------------------------------------------------------------
// Building scale
// ---------------------------------------------------------------------------

export function runBuilding(bundle: WorldBundle): Finding[] {
	const findings: Finding[] = []
	const { world } = bundle

	if (world.vertical.floorsWithoutPortals.length && world.floors.length > 1) {
		findings.push(finding({
			id: 'BLD-01', check: 'every occupied floor has vertical access', category: 'safety', severity: 'critical', verdict: 'fail',
			metric: 'floors with no portal', actual: world.vertical.floorsWithoutPortals.join(', '), required: 'none',
			rule: 'FL-08, MS-10',
			why: 'A floor with no portal is unreachable and unescapable; its programme does not exist no matter how well it is drawn.',
			correction: 'Extend the stacked core to every occupied floor on the same coordinates.',
			cells: [],
		}))
	}

	if (world.vertical.stackDrift.length) {
		const toCell = (key: string): Cell => {
			const [x, y] = key.split(',').map(Number)
			return { x, y }
		}
		findings.push(finding({
			id: 'BLD-02', check: 'portal stack alignment', category: 'geometry', severity: 'critical', verdict: 'fail',
			metric: 'floors whose portal cells differ from the consensus stack',
			actual: `${world.vertical.stackDrift.length} floor(s) drifting: ${world.vertical.stackDrift
				.map(entry => `${entry.floorId} (missing ${entry.missing.length}, off-stack ${entry.extra.length})`).join('; ')}`,
			required: '0 - the stack is one object', rule: 'MS-01, SR-15, FL-20',
			why: 'A lift or stair that moves between floors has no continuous shaft: structurally it needs a transfer, operationally it is a different building per floor, and for egress it is a broken escape route. Only the deviating floors are named - the floors that already agree are the reference the others snap to.',
			correction: 'Snap every portal to the published control-grid coordinates; a floor that cannot is a deviation to register, not a layout to keep.',
			cells: world.vertical.stackDrift.flatMap(entry => [...entry.extra, ...entry.missing].map(toCell)),
		}))
	}

	const inconsistent = world.floors.filter(floor => !floor.counts.reconciles)
	if (inconsistent.length) {
		findings.push(finding({
			id: 'BLD-03', check: 'whole-building tile reconciliation', category: 'model-integrity', severity: 'critical', verdict: 'fail',
			metric: 'floors whose tile classes do not close', actual: inconsistent.map(floor => floor.id).join(', '), required: 'none',
			rule: 'VA-07, SKILL.md host fact 1b',
			why: 'If one floor does not close, the building totals summed from it are wrong, and every cross-floor comparison inherits the error.',
			correction: 'Fix the floor classification first; do not patch the totals.',
			cells: [],
		}))
	}

	return findings
}
