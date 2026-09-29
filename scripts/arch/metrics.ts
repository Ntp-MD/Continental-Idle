/**
 * metrics.ts - the measured KPI vector.
 *
 * Every number here is recomputed from tiles. Nothing is inherited from whatever the generator
 * believed while it was drawing (SKILL.md ## Validation, "Compute, do not narrate"). A KPI is
 * published with its band and the band's source, because a value with no band is not judgeable
 * and a band with no source is an opinion (EV-20..EV-30).
 */
import type { ArchWorld, Cell, FloorNode, Kpi, RoomNode } from './types'
import { METRES_PER_TILE } from './world'

/** Tags that mark a room as back-of-house / service rather than public or guest. */
const SERVICE_TAGS = new Set(['back-of-house', 'housekeeping', 'staff', 'laundry', 'storage', 'mechanical'])

export function isServiceRoom(room: RoomNode): boolean {
	return room.typeId === 'staff-room' || room.typeId === 'storage' || room.typeId === 'laundry'
		|| room.fixtureTags.some(tag => SERVICE_TAGS.has(tag))
}

function key(x: number, y: number): string {
	return `${x},${y}`
}

const ORTHO: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/** Cells an agent can actually stand on: engine-walkable and not eaten by a furniture block-out. */
export function freeCellMatrix(floor: FloorNode): boolean[][] {
	const blocked = new Set<string>(floor.furniture.flatMap(item => item.blockedCells.map(cell => key(cell.x, cell.y))))
	return floor.walkable.map((row, y) => row.map((walkable, x) => walkable && !blocked.has(key(x, y))))
}

/**
 * Local clearance at a cell: the smaller of the free horizontal and vertical run through it.
 * A corridor "2 tiles wide" on paper that measures 1 here is the whole point of the metric.
 */
export function clearanceAt(free: boolean[][], x: number, y: number): number {
	if (!free[y]?.[x]) return 0
	let h = 1
	for (let i = x - 1; free[y][i]; i--) h++
	for (let i = x + 1; free[y][i]; i++) h++
	let v = 1
	for (let j = y - 1; free[j]?.[x]; j--) v++
	for (let j = y + 1; free[j]?.[x]; j++) v++
	return Math.min(h, v)
}

export interface CirculationProfile {
	cells: Cell[]
	counts: Record<number, number>
	min: number
	p50: number
	singleFileTiles: number
	/** Circulation tiles the width profile actually sampled - door thresholds are excluded. */
	widthSamples: number
	/** Junction cells: three or more free orthogonal neighbours - a wayfinding decision point. */
	decisionPoints: Cell[]
	/** Dead-end cells: exactly one free orthogonal neighbour, the tip of a cul-de-sac. */
	deadEnds: Cell[]
}

/** Measure the circulation network instead of asserting its quality (PP-21, TH-15, CODE-06). */
export function circulationProfile(floor: FloorNode): CirculationProfile {
	const free = freeCellMatrix(floor)
	const corridorCells = new Set<string>(floor.corridors.flatMap(room => room.cells.map(cell => key(cell.x, cell.y))))
	const cells: Cell[] = []
	const counts: Record<number, number> = {}
	const decisionPoints: Cell[] = []
	const deadEnds: Cell[] = []
	let widthSamples = 0
	for (let y = 0; y < floor.rows; y++) {
		for (let x = 0; x < floor.cols; x++) {
			if (!free[y][x] || floor.street[y][x]) continue
			const isDoor = floor.tileStates[y]?.[x] === 'door'
			if (!corridorCells.has(key(x, y)) && !isDoor) continue
			cells.push({ x, y })
			// A door sits in a wall, so its run along that wall is 1 by construction. It is a
			// threshold, not a route segment: scoring it reports every doorway as a bottleneck.
			if (isDoor) continue
			const clearance = clearanceAt(free, x, y)
			counts[clearance] = (counts[clearance] ?? 0) + 1
			widthSamples++
			let neighbours = 0
			for (const [dx, dy] of ORTHO) if (free[y + dy]?.[x + dx]) neighbours++
			if (neighbours >= 3) decisionPoints.push({ x, y })
			if (neighbours === 1) deadEnds.push({ x, y })
		}
	}
	const widths = Object.entries(counts).flatMap(([w, n]) => Array.from({ length: n }, () => Number(w))).sort((a, b) => a - b)
	return {
		cells,
		counts,
		min: widths.length ? widths[0] : 0,
		p50: widths.length ? widths[Math.floor(widths.length / 2)] : 0,
		singleFileTiles: counts[1] ?? 0,
		widthSamples,
		decisionPoints,
		deadEnds,
	}
}

export interface HallClassification {
	/** Hall regions that read as circulation: you pass through them, or you arrive in them. */
	networks: RoomNode[]
	/** False when nothing on the floor reads as circulation - then every enclosed region is suspect. */
	identified: boolean
	/**
	 * Regions excused as circulation by door count alone, with no arrival inside them. These are the
	 * judgement calls in this classifier: a space you pass through to four places is probably a
	 * corridor, but a suite with connecting doors looks identical from here. Surfaced as a KPI so a
	 * finding that stops firing stays visible and arguable rather than silently gone.
	 */
	inferred: RoomNode[]
	/** Enclosed hall regions that are not circulation - rooms the host silently retyped as hallway. */
	untagged: RoomNode[]
}

/**
 * Separate genuine circulation from enclosed regions the host could not type.
 *
 * Size is not evidence: leave exactly one region and it is by definition the largest, so a single
 * mistyped room clears a check whose whole job is to notice a lost room. Arrival is not sufficient
 * either - once the lobby is typed, the arrival cell sits inside a room and the anchor is gone.
 * Topology survives both: a corridor is something you pass *through* to two or more other spaces,
 * while a room is entered once. Arrival is kept as a secondary anchor because an entrance hall with a
 * single door onward is still circulation, and when nothing qualifies at all every enclosed region is
 * reported rather than silently excusing one.
 */
export function classifyHalls(world: ArchWorld, floor: FloorNode): HallClassification {
	const halls = floor.rooms.filter(room => room.isCorridor && !room.isStreet)
	const arrival = entryCell(world, floor)
	const arrivalKey = arrival ? `${arrival.x},${arrival.y}` : null
	const doorById = new Map(floor.doors.map(door => [door.id, door]))
	const onward = (room: RoomNode): number => new Set(room.doorIds
		.flatMap(id => doorById.get(id)?.connects ?? [])
		.filter(target => target !== room.id)).size
	const anchored = (room: RoomNode): boolean => arrivalKey !== null && room.cells.some(cell => `${cell.x},${cell.y}` === arrivalKey)
	const networks = halls.filter(room => anchored(room) || onward(room) >= 2)
	return {
		networks,
		identified: networks.length > 0,
		inferred: networks.filter(room => !anchored(room)),
		untagged: halls.filter(room => !networks.includes(room) && room.areaTiles >= 4),
	}
}

export interface MetricRegression {
	floorId: string
	key: string
	label: string
	direction: 'up' | 'down'
	unit: string
	before: number
	after: number
	delta: number
	gate: boolean
}

/**
 * Metrics that moved the wrong way between two versions of a world, judged by each KPI's own declared
 * direction - so this adds no new policy and no new thresholds.
 *
 * The loop recomputed the whole metric vector on every pass and then looked only at finding ids, which
 * let a pass that cleared one finding while quietly degrading clearance or net-to-gross read as
 * progress. `band` metrics are skipped deliberately: whether a value moved toward or away from a band
 * needs a jurisdiction, and inventing a verdict here is the thing the rest of this harness refuses to do.
 */
export function regressions(before: ArchWorld, after: ArchWorld): MetricRegression[] {
	const out: MetricRegression[] = []
	for (const floor of after.floors) {
		const prior = before.floors.find(candidate => candidate.id === floor.id)
		if (!prior) continue
		const beforeKpis = floorKpis(before, prior)
		const afterKpis = new Map(floorKpis(after, floor).map(kpi => [kpi.key, kpi]))
		for (const was of beforeKpis) {
			const now = afterKpis.get(was.key)
			if (!now || (was.direction !== 'up' && was.direction !== 'down')) continue
			const delta = now.value - was.value
			if (Math.abs(delta) < 1e-9) continue
			// A non-gate extreme rising from zero usually means "there was nothing to measure before",
			// not "this got worse": typing a lost room makes depth metrics exist for the first time. Gate
			// metrics keep reporting it, because unreachable tiles going 0 -> 63 is the whole point of them.
			if (was.value === 0 && !was.gate) continue
			if (was.direction === 'up' ? delta < 0 : delta > 0) {
				out.push({ floorId: floor.id, key: was.key, label: was.label, direction: was.direction, unit: was.unit, before: was.value, after: now.value, delta, gate: was.gate })
			}
		}
	}
	return out
}

/** One line, same wording wherever a repair is reported: what moved, which way, and whether it is a gate. */
export function formatRegressions(rows: readonly MetricRegression[]): string {
	if (!rows.length) return 'none'
	return rows.map(row => `${row.label} ${row.before}${row.unit} -> ${row.after}${row.unit}${row.gate ? ' [gate]' : ''}`).join('; ')
}

/**
 * Arrival cell: the free circulation cell nearest a façade edge on the street floor, or the
 * nearest portal otherwise. Depth-from-entry is meaningless without a declared arrival point.
 */
export function entryCell(world: ArchWorld, floor: FloorNode): Cell | null {
	const profile = circulationProfile(floor)
	const candidates = profile.cells.length ? profile.cells : freeCellMatrix(floor).flatMap((row, y) => row.map((free, x) => (free ? { x, y } : null))).filter((c): c is Cell => c !== null)
	if (!candidates.length) return null
	if (floor.isStreetFloor && world.site.streetWidthTiles > 0) {
		const street = world.site.streetWidthTiles
		const nearStreet = candidates.filter(cell => cell.x < street || cell.y < street || cell.x >= floor.cols - street || cell.y >= floor.rows - street)
		if (nearStreet.length) return nearStreet[0]
	}
	if (floor.portals.length) {
		const portal = floor.portals[0].spotCells[0] ?? floor.portals[0].cells[0]
		if (portal) return portal
	}
	return candidates.reduce((best, cell) => {
		const edge = Math.min(cell.x, cell.y, floor.cols - 1 - cell.x, floor.rows - 1 - cell.y)
		const bestEdge = Math.min(best.x, best.y, floor.cols - 1 - best.x, floor.rows - 1 - best.y)
		return edge < bestEdge ? cell : best
	})
}

/** BFS depth in tiles from the entry over free cells - the measured wayfinding depth (SA-*). */
export function depthFieldFrom(floor: FloorNode, from: Cell): Map<string, number> {
	const free = freeCellMatrix(floor)
	const depth = new Map<string, number>()
	if (!free[from.y]?.[from.x]) return depth
	depth.set(key(from.x, from.y), 0)
	const queue: Cell[] = [from]
	while (queue.length) {
		const cell = queue.shift()!
		const next = (depth.get(key(cell.x, cell.y)) ?? 0) + 1
		for (const [dx, dy] of ORTHO) {
			const nx = cell.x + dx
			const ny = cell.y + dy
			if (!free[ny]?.[nx]) continue
			const k = key(nx, ny)
			if (depth.has(k)) continue
			depth.set(k, next)
			queue.push({ x: nx, y: ny })
		}
	}
	return depth
}

export interface FloorMetrics {
	gridTiles: number
	plateTiles: number
	structureTiles: number
	doorTiles: number
	roomTiles: number
	circulationTiles: number
	furnitureTiles: number
	streetTiles: number
	reconciles: boolean
	unreachableTiles: number
	netToGross: number
	circulationShare: number
	structureShare: number
	furnitureShare: number
	roomCount: number
	typedRoomCount: number
	/** The sample size behind the room rows: 0 means the plan types no rooms, so nothing is measured. */
	programmeRoomSamples: number
	untaggedRoomCount: number
	/** Hall regions called circulation by door count alone - the judgement calls behind this classifier. */
	circulationInferred: number
	serviceShare: number
	corridorMinWidth: number
	/** Route tiles actually width-sampled; the share rows below are unread at 0. */
	corridorWidthSamples: number
	corridorP50Width: number
	corridorSingleFileShare: number
	decisionPoints: number
	deadEnds: number
	maxDepthFromEntry: number
	meanDepthFromEntry: number
	portals: number
	maxRoomDepthFromFacade: number
	meanRoomDepthFromFacade: number
	roomsBeyondDaylightDepth: number
	worstFreeRun: number
	worstFreeRunRoom: string
	furnitureCount: number
	publicServiceAdjacencies: number
}

/**
 * Single-aspect sidelit depth cap, derived rather than asserted: TH-26 quotes the code daylight zone
 * as "depth up to 1.0 times the height from floor to the top of the fenestration", so a declared 4.0 m
 * head height gives 4.0 m = 8 tiles. The height is the parameter - change the assumption, not the
 * arithmetic. EN 17037 targets lux, which this grid cannot measure, so this is a depth proxy only.
 */
export const WINDOW_HEAD_HEIGHT_METRES = 4
export const DAYLIGHT_DEPTH_CEILING_TILES = Math.round(WINDOW_HEAD_HEIGHT_METRES / METRES_PER_TILE)

export function measureFloor(world: ArchWorld, floor: FloorNode): FloorMetrics {
	const profile = circulationProfile(floor)
	const c = floor.counts
	const typed = floor.rooms.filter(room => !room.isCorridor && !room.isStreet)
	const halls = classifyHalls(world, floor)
	const serviceTiles = typed.filter(isServiceRoom).reduce((sum, room) => sum + room.areaTiles, 0)
	const depths = typed.map(room => room.depthFromFacade).filter(depth => depth >= 0)
	const beyond = typed.filter(room => room.depthFromFacade > DAYLIGHT_DEPTH_CEILING_TILES)
	const entry = entryCell(world, floor)
	const field = entry ? depthFieldFrom(floor, entry) : new Map<string, number>()
	const roomDepths = typed.map(room => {
		let best = Number.POSITIVE_INFINITY
		for (const cell of room.cells) {
			const d = field.get(key(cell.x, cell.y))
			if (d !== undefined && d < best) best = d
		}
		return Number.isFinite(best) ? best : null
	}).filter((d): d is number => d !== null)

	const worst = typed.reduce<{ run: number; id: string }>(
		(acc, room) => (room.freeCells > 0 && room.minFreeRun < acc.run ? { run: room.minFreeRun, id: room.id } : acc),
		{ run: Number.POSITIVE_INFINITY, id: '' },
	)

	const serviceIds = new Set(typed.filter(isServiceRoom).map(room => room.localId))
	let publicServiceAdjacencies = 0
	for (const relation of world.relations) {
		if (relation.floorId !== floor.id) continue
		if (relation.kind !== 'door' && relation.kind !== 'shared-wall') continue
		const a = relation.from.split('#')[1]
		const b = relation.to.split('#')[1]
		if (!a || !b) continue
		if (serviceIds.has(a) !== serviceIds.has(b)) publicServiceAdjacencies++
	}

	// The street ring is site, not building plate. Charging it to circulation would let a plan
	// look efficient by standing on the pavement.
	const plate = Math.max(0, c.gridTiles - c.streetTiles)
	const gross = c.roomTiles + c.circulationTiles + c.structureTiles + c.furnitureTiles
	return {
		gridTiles: c.gridTiles,
		plateTiles: plate,
		structureTiles: c.structureTiles,
		doorTiles: c.door,
		roomTiles: c.roomTiles,
		circulationTiles: c.circulationTiles,
		furnitureTiles: c.furnitureTiles,
		streetTiles: c.streetTiles,
		reconciles: c.reconciles,
		unreachableTiles: c.unreachableTiles,
		netToGross: gross ? c.roomTiles / gross : 0,
		circulationShare: plate ? c.circulationTiles / plate : 0,
		structureShare: plate ? c.structureTiles / plate : 0,
		furnitureShare: plate ? c.furnitureTiles / plate : 0,
		roomCount: floor.rooms.length,
		typedRoomCount: typed.length,
		programmeRoomSamples: typed.length,
		untaggedRoomCount: halls.untagged.length,
		circulationInferred: halls.inferred.length,
		serviceShare: c.roomTiles ? serviceTiles / c.roomTiles : 0,
		corridorMinWidth: profile.min,
		corridorP50Width: profile.p50,
		corridorWidthSamples: profile.widthSamples,
		corridorSingleFileShare: profile.widthSamples ? profile.singleFileTiles / profile.widthSamples : 0,
		decisionPoints: profile.decisionPoints.length,
		deadEnds: profile.deadEnds.length,
		maxDepthFromEntry: roomDepths.length ? Math.max(...roomDepths) : 0,
		meanDepthFromEntry: roomDepths.length ? roomDepths.reduce((a, b) => a + b, 0) / roomDepths.length : 0,
		portals: floor.portals.length,
		maxRoomDepthFromFacade: depths.length ? Math.max(...depths) : 0,
		meanRoomDepthFromFacade: depths.length ? depths.reduce((a, b) => a + b, 0) / depths.length : 0,
		roomsBeyondDaylightDepth: beyond.length,
		worstFreeRun: Number.isFinite(worst.run) ? worst.run : 0,
		worstFreeRunRoom: worst.id,
		furnitureCount: floor.furniture.length,
		publicServiceAdjacencies,
	}
}

export function floorKpis(world: ArchWorld, floor: FloorNode): Kpi[] {
	const m = measureFloor(world, floor)
	const pct = (v: number): number => Number((v * 100).toFixed(1))
	// Route widths and dead-end tips both come from the same sampled cell set. With no sample the
	// honest reading is "nothing measured", never a number: published as a minimum a zero becomes a
	// gate failure no geometry can deserve, and published as a maximum it becomes a gate that passes
	// on absence of evidence - the quieter and worse of the two errors.
	const widthsMeasured = m.corridorWidthSamples > 0
	const UNMEASURED_CIRCULATION = 'unmeasurable - no circulation tile on this floor was width-sampled'
	// The room rows are computed over typed rooms. On a bare plate that set is empty, and an empty
	// set answers "0 rooms past daylight" as a pass and "0 tiles of clearance" as a failure - one
	// silence and one phantom defect, both from the same missing sample.
	const roomsMeasured = m.programmeRoomSamples > 0
	const UNMEASURED_PROGRAMME = 'unmeasurable - no typed room on this floor'
	// Capacity needs a load, and the load is declared by the simulation rather than by the plan.
	const occupancy = world.occupancy.floors.find(record => record.floorId === floor.id)
	const load = occupancy?.occupants ?? 0
	// Furniture is capacity, not decoration: the hall floor people can actually stand on, the floor
	// eaten by seating, and the staffed positions that exist, each read against the declared load.
	const hallTiles = m.circulationTiles
	const standingPerPed = load ? Number(((hallTiles * METRES_PER_TILE * METRES_PER_TILE) / load).toFixed(2)) : 0
	const seatingTiles = floor.furniture.filter(item => item.tags.some(tag => tag === 'lounge' || tag === 'living')).reduce((sum, item) => sum + item.cells.length, 0)
	const servicePositions = floor.furniture.filter(item => item.tags.some(tag => tag === 'front-desk' || tag === 'bar' || tag === 'cooking' || tag === 'laundry' || tag === 'back-of-house')).length
	return [
		{ key: 'netToGross', label: 'net-to-gross', value: pct(m.netToGross), unit: '%', band: 'type-specific, no universal figure', bandSource: 'economics.md EC-*, space-programming.md SP-*', direction: 'band', gate: false },
		// The 12-20% "hotel typical" band this row used to quote does not exist in the knowledge base.
		// TH-15 is an office figure on T4 vendor data, EC-17 says the hotel range has no source at all,
		// and both grant that an open hall is usable space. Publishing it as a gate enforced an invention.
		{ key: 'circulationShare', label: 'circulation share of plate', value: pct(m.circulationShare), unit: '%', band: 'order of magnitude only: office 12-25% (T4 practice data), hotel 10-20% is a design call with no source, lobby 10-15% is a practitioner claim; reclassify an open hall before judging', bandSource: 'TH-15 architecture-theory.md:170,415, EC-17 economics.md:267, economics.md:131', direction: 'down', gate: false },
		{ key: 'structureShare', label: 'structure/wall share', value: pct(m.structureShare), unit: '%', band: 'wall tax 2W+2H-4 per room', bandSource: 'TH-02', direction: 'down', gate: false },
		{ key: 'circulationWidthSamples', label: 'route tiles width-sampled', value: m.corridorWidthSamples, unit: 'count', band: 'the sample size behind the circulation rows below; 0 means they are not measured', bandSource: 'PP-11, CODE-05', direction: 'band', gate: false },
		{ key: 'corridorMinWidth', label: 'narrowest circulation', value: m.corridorMinWidth, unit: 'tiles', band: widthsMeasured ? '>= 2 tiles (1.0 m) clears the 36 in (914 mm) floor; >= 3 tiles (1.5 m) for the 44 in (1118 mm) accessible floor. Values confirmed, the occupancy trigger wording is not, so the 50-occupant split is a conservative design assumption' : UNMEASURED_CIRCULATION, bandSource: 'CODE-05 building-codes.md:149-153', direction: widthsMeasured ? 'up' : 'band', gate: widthsMeasured },
		{ key: 'corridorP50Width', label: 'median circulation width', value: m.corridorP50Width, unit: 'tiles', band: widthsMeasured ? '>=2' : UNMEASURED_CIRCULATION, bandSource: 'PP-11', direction: widthsMeasured ? 'up' : 'band', gate: false },
		{ key: 'singleFileShare', label: 'single-file circulation share', value: pct(m.corridorSingleFileShare), unit: '%', band: widthsMeasured ? '0 on primary routes' : UNMEASURED_CIRCULATION, bandSource: 'PP-11, CODE-05', direction: widthsMeasured ? 'down' : 'band', gate: widthsMeasured },
		{ key: 'decisionPoints', label: 'wayfinding decision points', value: m.decisionPoints, unit: 'count', band: 'fewer is more legible; signed in compare only (experience -2, safety -1), never gated here', bandSource: 'PP-21, SA-*', direction: 'down', gate: false },
		{ key: 'deadEnds', label: 'dead-end tips', value: m.deadEnds, unit: 'count', band: widthsMeasured ? 'bounded length, limit is jurisdictional' : UNMEASURED_CIRCULATION, bandSource: 'CODE-06, FL-05', direction: widthsMeasured ? 'down' : 'band', gate: widthsMeasured },
		{ key: 'programmeRoomSamples', label: 'rooms typed on this floor', value: m.programmeRoomSamples, unit: 'count', band: 'the sample size behind the room rows below; 0 means they are not measured', bandSource: 'FL-07, SKILL host fact 2', direction: 'band', gate: false },
		{ key: 'roomsBeyondDaylight', label: 'rooms past sidelit depth', value: m.roomsBeyondDaylightDepth, unit: 'count', band: roomsMeasured ? '0 for long-occupancy rooms' : UNMEASURED_PROGRAMME, bandSource: 'TH-26, EQ-*', direction: roomsMeasured ? 'down' : 'band', gate: roomsMeasured },
		{ key: 'worstFreeRun', label: 'tightest furnished clearance', value: m.worstFreeRun, unit: 'tiles', band: roomsMeasured ? '>=2 (1.0 m) where a person must pass' : UNMEASURED_PROGRAMME, bandSource: 'HS-*, PP-14, AX-*', direction: roomsMeasured ? 'up' : 'band', gate: roomsMeasured },
		{ key: 'untaggedRooms', label: 'rooms collapsed to hallway', value: m.untaggedRoomCount, unit: 'count', band: '0', bandSource: 'FL-07, SKILL host fact 2', direction: 'down', gate: true },
		{ key: 'circulationInferred', label: 'hall regions called circulation by door count, not arrival', value: m.circulationInferred, unit: 'count', band: 'report alongside untaggedRooms - each one is a judgement, not a measurement', bandSource: 'FL-07, VA-07', direction: 'band', gate: false },
		{ key: 'occupantLoad', label: 'declared occupants on this floor', value: load, unit: 'agents', band: occupancy ? 'simulation population from npcConfig.pool - a design load, never quoted as a code occupant load' : 'undeclared - no npcConfig.pool for this floor, so no capacity verdict is available', bandSource: 'payload npcConfig; HB-11 human-behavior.md:141 for the code-load distinction', direction: 'band', gate: false },
		{ key: 'standingAreaPerOccupant', label: 'standing area per declared occupant in the halls', value: standingPerPed, unit: 'm²', band: load ? '>= 1.21 m2/ped is LOS A free standing; < 0.19 is LOS F packed standing (HB-10). The intermediate bands are not in this corpus, so only the two ends are named and only the floor is judged' : UNMEASURED_PROGRAMME, bandSource: 'HB-10 human-behavior.md:131,136, HB-01 :41', direction: 'up', gate: false },
		{ key: 'seatingFurnitureTiles', label: 'floor taken by seating furniture', value: seatingTiles, unit: 'tiles', band: 'provision measured, not judged: the corpus holds no seats-per-occupant or seats-per-key ratio for a lobby (HO-17 is derived, and hotel-operating-standards.md:463 records every F&B and lobby seating index as missing)', bandSource: 'HO-17 hotel-operating-standards.md:340, :463', direction: 'band', gate: false },
		{ key: 'servicePositions', label: 'staffed positions standing in a room', value: servicePositions, unit: 'count', band: occupancy ? `counted against the arrival demand in scripts/arch/spec.json - see OPS-05 for the verdict` : 'no arrival spec declared, so provision is counted and not judged', bandSource: 'PP-08 professional-practice.md:298,301,311', direction: 'band', gate: false },
		{ key: 'unreachableTiles', label: 'unreachable walkable tiles', value: m.unreachableTiles, unit: 'tiles', band: '0', bandSource: 'FL-09, VA-07', direction: 'down', gate: true },
		{ key: 'serviceShare', label: 'BOH share of room area', value: pct(m.serviceShare), unit: '%', band: 'operator input; audit found no authoritative figure', bandSource: 'PP-02, HO-* (unsourced - declare it)', direction: 'band', gate: false },
		{ key: 'portals', label: 'vertical portals', value: m.portals, unit: 'count', band: floor.isStreetFloor ? 'n/a on the street arrival floor - CIR-06 exempts it, guests enter from the pavement; >=1 once a floor is reached vertically' : '>=1; a floor with one portal and no alternative is Critical', bandSource: 'FL-08, VT-*', direction: 'up', gate: !floor.isStreetFloor },
		{ key: 'reconciles', label: 'tile-class reconciliation', value: m.reconciles ? 1 : 0, unit: 'bool', band: 'occupied + circulation + structure = grid', bandSource: 'SKILL host fact 1b', direction: 'up', gate: true },
	]
}

export function buildingKpis(world: ArchWorld): Kpi[] {
	const perFloor = world.floors.map(floor => measureFloor(world, floor))
	const totalGrid = perFloor.reduce((sum, m) => sum + m.gridTiles, 0)
	const totalRooms = perFloor.reduce((sum, m) => sum + m.roomTiles, 0)
	const totalCirc = perFloor.reduce((sum, m) => sum + m.circulationTiles, 0)
	const totalStruct = perFloor.reduce((sum, m) => sum + m.structureTiles, 0)
	const gross = totalRooms + totalCirc + totalStruct
	return [
		{ key: 'buildingNetToGross', label: 'building net-to-gross', value: gross ? Number(((totalRooms / gross) * 100).toFixed(1)) : 0, unit: '%', band: 'type-specific', bandSource: 'economics.md EC-*', direction: 'band', gate: false },
		{ key: 'buildingCirculationShare', label: 'building circulation share', value: totalGrid ? Number(((totalCirc / totalGrid) * 100).toFixed(1)) : 0, unit: '%', band: 'order of magnitude only - no sourced hotel ceiling exists; reclassify an open hall before judging', bandSource: 'TH-15 architecture-theory.md:170, EC-17 economics.md:267', direction: 'down', gate: false },
		{ key: 'floorsWithoutPortal', label: 'floors with no portal', value: world.vertical.floorsWithoutPortals.length, unit: 'count', band: '0 - every occupied floor needs vertical access', bandSource: 'FL-08, MS-10', direction: 'down', gate: true },
		{ key: 'stackDrift', label: 'portal stack drift', value: world.vertical.stackDrift.length, unit: 'floors', band: '0 - the stack is one object', bandSource: 'MS-01, SR-15, FL-20', direction: 'down', gate: true },
	]
}

export function kpiTable(kpis: readonly Kpi[], title: string): string {
	const rows = kpis.map(kpi => [kpi.label, `${kpi.value} ${kpi.unit}`, kpi.gate ? 'GATE' : '-', kpi.band, kpi.bandSource])
	const widths = [0, 1, 2, 3, 4].map(i => Math.max(...rows.map(row => String(row[i]).length), ['metric', 'value', 'gate', 'band', 'band source'][i].length))
	const line = (cells: readonly string[]): string => cells.map((cell, i) => String(cell).padEnd(widths[i])).join('  ')
	return [
		`### ${title}`,
		line(['metric', 'value', 'gate', 'band', 'band source']),
		widths.map(w => '-'.repeat(w)).join('  '),
		...rows.map(row => line(row.map(String))),
	].join('\n')
}
