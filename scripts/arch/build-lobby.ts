/**
 * build-lobby.ts - turn a tile-exact plan file into the host payload.
 *
 * The representation is the point. The deleted generator held rooms as rectangles and a rect-fill
 * painter, so it could only ever emit axis-aligned bands - the mechanical cause of the sameness
 * verdict. This one reads a plan written one wall run, one door tile and one fixture at a time, so
 * freestanding screens, L-shaped plans and deliberate asymmetry are expressible, and walls stay
 * one tile (0.5 m) thick on this grid.
 *
 * It draws nothing on its own and judges nothing: it validates what the plan claims, renders the
 * result back as ASCII so a human can look at it, and writes floor-g. Measurement stays with
 * `npm run arch` (render / metrics / eval), which recomputes from tiles and does not believe this file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tileKey } from '../../src/engine/npc/keys'
import { loadWorld } from './world'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FLOOR_ID = 'floor-g'

type TileState = 'walkable' | 'blocked' | 'door'

interface WallRun { name: string; x0: number; y0: number; x1: number; y1: number }
interface Placement { id: string; type: string; x: number; y: number; rotation: number }
interface AssetBox { id: string; w: number; h: number; walkable: boolean }

interface Plan {
	street: number
	walls: WallRun[]
	doors: { x: number; y: number }[]
	facadeDoors: { edge: string; a: number; b: number }[]
	furniture: Placement[]
}

class PlanError extends Error {}

function rotated(asset: AssetBox, rotation: number): { w: number; h: number } {
	return rotation % 180 === 0 ? { w: asset.w, h: asset.h } : { w: asset.h, h: asset.w }
}

/** Seat counts come from the declared 0.6 m pitch in scripts/arch/spec.json, not from a vibe. */
function seatsOf(asset: AssetBox, w: number): number {
	if (asset.id.startsWith('sofa')) return Math.max(1, Math.round(w * 0.5 / 0.6))
	if (asset.id.startsWith('bench')) return Math.max(1, Math.round(w * 0.5 / 0.6))
	if (asset.id.includes('chair') || asset.id.includes('stool') || asset.id.includes('ottoman') || asset.id.includes('lounger')) return 1
	if (asset.id.includes('table') || asset.id.includes('piano') || asset.id.includes('rug')) return 0
	return 0
}

function parsePlan(text: string, assets: Map<string, AssetBox>): Plan {
	const plan: Plan = { street: 8, walls: [], doors: [], facadeDoors: [], furniture: [] }
	let section = ''
	const num = (raw: string, what: string): number => {
		const value = Number(raw)
		if (!Number.isFinite(value)) throw new PlanError(`${what}: not a number: "${raw}"`)
		return value
	}
	text.split('\n').forEach((line, index) => {
		const where = `line ${index + 1}`
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) return
		if (trimmed.startsWith('%%')) { section = trimmed.slice(2).split(/\s+/)[0]; return }
		const f = trimmed.split(/\s+/)
		switch (section) {
			case 'envelope':
				if (f[0] === 'street') plan.street = num(f[1], where)
				return
			case 'walls': {
				const [name, x0, y0, x1, y1] = [f[0], num(f[1], where), num(f[2], where), num(f[3], where), num(f[4], where)]
				if (x0 !== x1 && y0 !== y1) throw new PlanError(`${where}: wall "${name}" is diagonal - draw it as two runs`)
				plan.walls.push({ name, x0, y0, x1, y1 })
				return
			}
			case 'doors':
				if (f[0] !== 'door') throw new PlanError(`${where}: expected "door <x> <y>"`)
				plan.doors.push({ x: num(f[1], where), y: num(f[2], where) })
				return
			case 'facade-doors':
				plan.facadeDoors.push({ edge: f[0], a: num(f[1], where), b: num(f[2], where) })
				return
			case 'furniture': {
				const kind = f[0]
				const put = (type: string, id: string, x: number, y: number, rotation: number): void => {
					if (!assets.has(type)) throw new PlanError(`${where}: unknown asset "${type}"`)
					plan.furniture.push({ id, type, x, y, rotation })
				}
				if (kind === 'put') return put(f[1], f[2], num(f[3], where), num(f[4], where), f[5] ? num(f[5], where) : 0)
				// The three cluster macros are the seat vocabulary: a round of chairs, a sofa pair,
				// a bench pair. They differ in footprint and seat count, which is the point.
				if (kind === 'clover') {
					const x = num(f[1], where); const y = num(f[2], where)
					put('side-table-1', `clv-${x}-${y}-t`, x, y, 0)
					for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
						put('armchair-1', `clv-${x}-${y}-${dx}-${dy}`, x + dx, y + dy, 0)
					}
					return
				}
				if (kind === 'sofa-group') {
					const x = num(f[1], where); const y = num(f[2], where)
					put('sofa-1', `sfg-${x}-${y}-a`, x, y, 0)
					put('sofa-1', `sfg-${x}-${y}-b`, x, y + 2, 0)
					put('armchair-1', `sfg-${x}-${y}-c`, x + 3, y, 0)
					put('armchair-1', `sfg-${x}-${y}-d`, x + 3, y + 2, 0)
					put('side-table-1', `sfg-${x}-${y}-t`, x + 3, y + 1, 0)
					return
				}
				if (kind === 'bench-group') {
					const x = num(f[1], where); const y = num(f[2], where)
					put('bench-park-3', `bng-${x}-${y}-a`, x, y, 0)
					put('bench-park-3', `bng-${x}-${y}-b`, x, y + 2, 0)
					put('armchair-1', `bng-${x}-${y}-c`, x + 3, y, 0)
					put('armchair-1', `bng-${x}-${y}-d`, x + 3, y + 2, 0)
					put('side-table-1', `bng-${x}-${y}-t`, x + 3, y + 1, 0)
					return
				}
				if (kind === 'grid') {
					const type = f[1]; const id = f[2]
					const x = num(f[3], where); const y = num(f[4], where)
					const cols = num(f[5], where); const rows = num(f[6], where)
					const stepX = num(f[7], where); const stepY = num(f[8], where)
					const rotation = f[9] ? num(f[9], where) : 0
					for (let c = 0; c < cols; c++) {
						for (let r = 0; r < rows; r++) put(type, `${id}-${c}-${r}`, x + c * stepX, y + r * stepY, rotation)
					}
					return
				}
				throw new PlanError(`${where}: unknown furniture directive "${kind}"`)
			}
			default:
				throw new PlanError(`${where}: furniture/wall line outside any section ("${trimmed.slice(0, 24)}")`)
		}
	})
	return plan
}

function buildGrid(plan: Plan, width: number, height: number): { grid: TileState[][]; wallAt: (x: number, y: number) => boolean } {
	const grid: TileState[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 'walkable' as TileState))
	const sw = plan.street
	const x0 = sw; const y0 = sw; const x1 = width - 1 - sw; const y1 = height - 1 - sw
	for (let y = y0; y <= y1; y++) {
		for (const x of [x0, x1]) grid[y][x] = 'blocked'
	}
	for (let x = x0; x <= x1; x++) {
		for (const y of [y0, y1]) grid[y][x] = 'blocked'
	}
	// Everything inside the facade is plate; the street outside stays walkable by the host's own rule.
	for (const run of plan.walls) {
		for (let y = Math.min(run.y0, run.y1); y <= Math.max(run.y0, run.y1); y++) {
			for (let x = Math.min(run.x0, run.x1); x <= Math.max(run.x0, run.x1); x++) {
				if (x <= x0 || x >= x1 || y <= y0 || y >= y1) throw new PlanError(`wall "${run.name}" at (${x},${y}) sits on the facade ring`)
				grid[y][x] = 'blocked'
			}
		}
	}
	const wallAt = (x: number, y: number): boolean => grid[y]?.[x] === 'blocked'
	for (const door of plan.doors) {
		if (!wallAt(door.x, door.y)) throw new PlanError(`door (${door.x},${door.y}) is not on a wall line`)
		grid[door.y][door.x] = 'door'
	}
	for (const fd of plan.facadeDoors) {
		const cells: { x: number; y: number }[] = []
		for (let i = fd.a; i <= fd.b; i++) {
			if (fd.edge === 'south') cells.push({ x: i, y: y1 })
			else if (fd.edge === 'north') cells.push({ x: i, y: y0 })
			else if (fd.edge === 'west') cells.push({ x: x0, y: i })
			else if (fd.edge === 'east') cells.push({ x: x1, y: i })
			else throw new PlanError(`facade door edge "${fd.edge}" is not north | south | east | west`)
		}
		for (const cell of cells) {
			if (grid[cell.y][cell.x] !== 'blocked') throw new PlanError(`facade door (${cell.x},${cell.y}) is not on the facade ring`)
			grid[cell.y][cell.x] = 'door'
		}
	}
	return { grid, wallAt }
}

function placeFurniture(plan: Plan, grid: TileState[][], assets: Map<string, AssetBox>, width: number, height: number): { seats: number; blocked: Set<string> } {
	const blocked = new Set<string>()
	let seats = 0
	for (const item of plan.furniture) {
		const asset = assets.get(item.type)!
		const { w, h } = rotated(asset, item.rotation)
		const cells: [number, number][] = []
		for (let y = item.y; y < item.y + h; y++) for (let x = item.x; x < item.x + w; x++) cells.push([x, y])
		for (const [x, y] of cells) {
			if (x < 0 || y < 0 || x >= width || y >= height) throw new PlanError(`${item.id} (${item.type}) reaches outside the canvas`)
			if (grid[y][x] !== 'walkable') throw new PlanError(`${item.id} (${item.type}) sits on a ${grid[y][x]} tile at (${x},${y})`)
		}
		if (!asset.walkable) {
			for (const [x, y] of cells) {
				const key = `${x},${y}`
				if (blocked.has(key)) throw new PlanError(`${item.id} (${item.type}) overlaps another fixture at (${x},${y})`)
				blocked.add(key)
			}
		}
		seats += seatsOf(asset, w)
	}
	return { seats, blocked }
}

function renderAscii(grid: TileState[][], furniture: Placement[], assets: Map<string, AssetBox>, width: number): string {
	const glyph: Record<TileState, string> = { walkable: '.', blocked: '#', door: '+' }
	const rows: string[][] = grid.map(row => row.map(state => glyph[state]))
	const marks: Record<string, string> = {
		'reception-desk': 'D', 'concierge-desk-4': 'D', 'bar-counter': 'B', 'elevator-1': 'L', 'stair-flight-4': 'X',
		'sofa-1': 's', 'armchair-1': 'o', 'bench-park-3': '=', 'dining-chair-1': 'o', 'bar-stool-1': 'o',
		'cafe-table-2': 't', 'side-table-1': 't', 'high-table-1': 'T', 'dining-table-4': 'T', 'custom-table-set': 't',
		toilet: 'c', washbasin: 'w', 'urinal-1': 'u', 'baby-change-1': 'b', 'wheelchair-space-2': 'A',
		'potted-plant-1': '*', 'hedge-3': '*', 'sculpture-2': '&', 'painting-2': 'a', 'water-feature-3': '~',
		'grand-piano-3': 'P', 'display-case-3': 'e', 'shop-shelf-3': 'e', 'kiosk-2': 'e', 'luggage-shelf-3': 'g',
		'luggage-cart-2': 'g', 'coat-check-3': 'g', 'linen-shelf-3': 'g', 'staff-locker-1': 'k', 'office-chair': 'h',
		rug: 'r', 'tactile-path-1': ':',
	}
	for (const item of furniture) {
		const asset = assets.get(item.type)!
		const { w, h } = rotated(asset, item.rotation)
		const mark = marks[item.type] ?? (asset.walkable ? '.' : 'o')
		for (let y = item.y; y < item.y + h; y++) for (let x = item.x; x < item.x + w; x++) rows[y][x] = mark
	}
	const ruler1 = '    ' + Array.from({ length: width }, (_, x) => (x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' ')).join('')
	const ruler2 = '    ' + Array.from({ length: width }, (_, x) => (x % 10 === 9 ? '|' : ' ')).join('')
	const body = rows.map((row, y) => `${String(y).padStart(3, ' ')}  ${row.join('')}`)
	return [ruler1, ruler2, ...body].join('\n')
}

interface Pocket {
	size: number
	bbox: string
	owners: string[]
}

/**
 * Reachability is judged by the host engine, never by this file's own idea of what blocks a tile.
 * An asset stamps its own padding, so a fixture that looks a tile clear of a partition can still
 * seal a walkable strip behind it - and a sealed strip is a critical GATE-02 finding that forces
 * every other verdict to UNKNOWN. Finding that out one guess per eval round trip is the expensive
 * way, so the plan is built, handed to the engine, and refused here before anything is written.
 */
function findPockets(payloadPath: string, furniture: Placement[], assets: Map<string, AssetBox>, width: number, height: number): Pocket[] {
	const bundle = loadWorld(payloadPath)
	const map = bundle.engine.floorMaps.get(FLOOR_ID)
	if (!map) throw new PlanError(`the engine produced no floor map for "${FLOOR_ID}"`)
	const open = (x: number, y: number): boolean => map.tiles.has(tileKey(x, y))
	// 4-neighbour, so this guard agrees with the validator's own connectivity count.
	const seen = Array.from({ length: height }, () => Array<boolean>(width).fill(false))
	const regions: [number, number][][] = []
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (!open(x, y) || seen[y][x]) continue
			const cells: [number, number][] = []
			const queue: [number, number][] = [[x, y]]
			seen[y][x] = true
			while (queue.length) {
				const [cx, cy] = queue.pop()!
				cells.push([cx, cy])
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
					const nx = cx + dx; const ny = cy + dy
					if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
					if (seen[ny][nx] || !open(nx, ny)) continue
					seen[ny][nx] = true
					queue.push([nx, ny])
				}
			}
			regions.push(cells)
		}
	}
	const largest = Math.max(...regions.map(region => region.length))
	const padded = furniture.map(item => {
		const asset = assets.get(item.type)!
		const { w, h } = rotated(asset, item.rotation)
		return { id: item.id, x0: item.x - 1, y0: item.y - 1, x1: item.x + w, y1: item.y + h }
	})
	return regions.filter(region => region.length !== largest).map(region => {
		const xs = region.map(cell => cell[0]); const ys = region.map(cell => cell[1])
		const owners = padded
			.filter(box => region.some(([x, y]) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1))
			.map(box => box.id)
		return {
			size: region.length,
			bbox: `x ${Math.min(...xs)}..${Math.max(...xs)} y ${Math.min(...ys)}..${Math.max(...ys)}`,
			owners,
		}
	})
}

export interface BuildResult {
	width: number
	height: number
	plate: { x0: number; y0: number; x1: number; y1: number }
	wallRuns: number
	doors: number
	fixtures: number
	seats: number
	ascii: string
	wrote: string | null
}

export function buildLobby(payloadPath: string, planPath: string, writeInPlace: boolean): BuildResult {
	const raw = JSON.parse(fs.readFileSync(payloadPath, 'utf8'))
	const canvas = raw.layout.canvas as { width: number; height: number; tileSize: number }
	const width = Math.round(canvas.width / canvas.tileSize)
	const height = Math.round(canvas.height / canvas.tileSize)
	const assets = new Map<string, AssetBox>()
	for (const asset of raw.originAssets as AssetBox[]) assets.set(asset.id, asset)

	const plan = parsePlan(fs.readFileSync(planPath, 'utf8'), assets)
	const { grid } = buildGrid(plan, width, height)
	const { seats } = placeFurniture(plan, grid, assets, width, height)

	const sw = plan.street
	const result: BuildResult = {
		width,
		height,
		plate: { x0: sw, y0: sw, x1: width - 1 - sw, y1: height - 1 - sw },
		wallRuns: plan.walls.length,
		doors: plan.doors.length + plan.facadeDoors.reduce((sum, fd) => sum + (fd.b - fd.a + 1), 0),
		fixtures: plan.furniture.length,
		seats,
		ascii: renderAscii(grid, plan.furniture, assets, width),
		wrote: null,
	}

	if (writeInPlace) {
		apply(raw, grid, plan, canvas.tileSize)
		const checkPath = path.join(HERE, 'out', '.plan-check.json')
		fs.mkdirSync(path.dirname(checkPath), { recursive: true })
		fs.writeFileSync(checkPath, `${JSON.stringify(raw, null, 1)}\n`)
		const pockets = findPockets(checkPath, plan.furniture, assets, width, height)
		if (pockets.length) {
			const detail = pockets
				.sort((a, b) => b.size - a.size)
				.map(pocket => `  ${pocket.size} tiles sealed at ${pocket.bbox}${pocket.owners.length ? ` - fixtures touching it: ${pocket.owners.join(', ')}` : ' - no fixture touches it, a wall run is closing it'}`)
				.join('\n')
			throw new PlanError(`the engine seals ${pockets.length} walkable pocket(s) - the plan is not writable:\n${detail}`)
		}
		fs.writeFileSync(payloadPath, `${JSON.stringify(raw, null, 1)}\n`)
		result.wrote = payloadPath
	}
	return result
}

/** Stamp the drawn grid and the placed fixtures onto the floor, in the host's own units. */
interface WritableFloor {
	id: string
	walkable?: { tileStates?: TileState[][] }
	objects?: unknown[]
}

function apply(raw: { layout: { floors: WritableFloor[] } }, grid: TileState[][], plan: Plan, tileSize: number): void {
	const floor = raw.layout.floors.find(candidate => candidate.id === FLOOR_ID)
	if (!floor) throw new PlanError(`floor "${FLOOR_ID}" not found in the payload`)
	floor.walkable ??= {}
	floor.walkable.tileStates = grid
	floor.objects = plan.furniture.map(item => ({
		id: item.id,
		type: item.type,
		x: item.x * tileSize,
		y: item.y * tileSize,
		rotation: item.rotation,
	}))
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
	// One command surface: the work lives in buildLobby(), `arch build` is how it is run.
	console.error('use: npm run arch -- build [--dry] [--plan path]')
	process.exit(1)
}
