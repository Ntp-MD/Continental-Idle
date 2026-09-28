/**
 * render.ts - the visual feedback stage of the Architecture Agent Harness.
 *
 * Coordinates in a text buffer are not a plan. This renders the derived world so the agent can
 * look at the geometry it just wrote and see what prose cannot show: a corridor that reads as
 * 2 tiles wide but looks oppressive, door leaves that collide, furniture that does not fit,
 * dead space that no metric named. Three outputs, one geometry:
 *   ascii - cheap, in-context, for the fast inner loop
 *   png   - the real look, via the dependency-free encoder in png.ts
 *   svg   - vector, for reports and diffs
 * The findings overlay draws counterexample cells, so a report and a picture cannot disagree.
 */
import { Raster, drawText, parseHexColor, textWidth, type Rgb } from './png'
import { METRES_PER_TILE } from './world'
import type { ArchWorld, Cell, FloorNode, Finding } from './types'

export interface RenderOptions {
	/** Pixels per tile in the PNG/SVG output. */
	scale?: number
	rooms?: boolean
	furniture?: boolean
	portals?: boolean
	labels?: boolean
	grid?: boolean
	/** Cells to mark, in addition to any findings. */
	markCells?: Cell[]
	findings?: Finding[]
	/** Restrict the picture to a window of the grid. */
	zoom?: { x0: number; y0: number; x1: number; y1: number }
}

const PALETTE: Record<string, string> = {
	bedroom: '#7fb3d5',
	bathroom: '#76d7c4',
	spa: '#a3d9a5',
	pool: '#5dade2',
	kitchen: '#f0b27a',
	restaurant: '#e59866',
	bar: '#d7bde2',
	gym: '#f1948a',
	lounge: '#f7dc6f',
	laundry: '#aab7b8',
	conference: '#85c1e9',
	shop: '#eb984e',
	'staff-room:': '#b3b6b7',
	'staff-room': '#95a5a6',
	storage: '#8d6e63',
	lobby: '#f5b7b1',
	hall: '#3a3f44',
}

function paletteFor(typeId: string): string {
	return PALETTE[typeId] ?? '#808080'
}

function cellSet(cells: readonly Cell[]): Set<string> {
	return new Set(cells.map(cell => `${cell.x},${cell.y}`))
}

/**
 * ASCII plan. One character per tile, rulers every 10 tiles, legend beneath. Cheap enough to
 * paste into a reasoning step, which is the point: the agent reads the shape, not the numbers.
 */
export function renderAscii(floor: FloorNode, world: ArchWorld, options: RenderOptions = {}): string {
	const zoom = options.zoom ?? { x0: 0, y0: 0, x1: floor.cols - 1, y1: floor.rows - 1 }
	const findings = options.findings ?? []
	const marked = cellSet([...(options.markCells ?? []), ...findings.flatMap(finding => finding.cells)])
	const furnitureBlocked = cellSet(floor.furniture.flatMap(item => item.blockedCells.map(cell => cell)))
	const portalCells = cellSet(floor.portals.flatMap(portal => portal.cells))

	const roomCharByCell = new Map<string, string>()
	const legend: string[] = []
	if (options.rooms !== false) {
		const typed = floor.rooms.filter(room => !room.isCorridor)
		typed.forEach((room, index) => {
			const symbol = index < 26 ? String.fromCharCode(65 + index) : String(index)
			legend.push(`${symbol} = ${room.typeLabel} (${room.localId}) ${room.areaTiles} tiles / ${room.areaM2.toFixed(1)} m2`)
			for (const cell of room.cells) roomCharByCell.set(`${cell.x},${cell.y}`, symbol)
		})
	}

	const headerTop = '     ' + Array.from({ length: zoom.x1 - zoom.x0 + 1 }, (_, i) => {
		const x = zoom.x0 + i
		return x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' '
	}).join('')
	const headerBottom = '     ' + Array.from({ length: zoom.x1 - zoom.x0 + 1 }, (_, i) => {
		const x = zoom.x0 + i
		return x % 10 === 0 ? String(x % 10) : ' '
	}).join('')

	const lines: string[] = [
		`${floor.label} (${floor.id})  ${floor.cols}x${floor.rows} tiles = ${(floor.cols * METRES_PER_TILE).toFixed(1)}x${(floor.rows * METRES_PER_TILE).toFixed(1)} m   [${world.source}]`,
		headerTop,
		headerBottom,
	]

	for (let y = zoom.y0; y <= zoom.y1; y++) {
		const rowLabel = String(y).padStart(4, ' ') + ' '
		let line = ''
		for (let x = zoom.x0; x <= zoom.x1; x++) {
			const key = `${x},${y}`
			const state = floor.tileStates[y]?.[x]
			if (marked.has(key)) {
				line += 'X'
				continue
			}
			if (portalCells.has(key) && options.portals !== false) {
				line += 'P'
				continue
			}
			if (state === 'blocked') {
				line += furnitureBlocked.has(key) ? 'F' : '#'
				continue
			}
			if (state === 'door') {
				line += '+'
				continue
			}
			if (!floor.walkable[y]?.[x]) {
				line += furnitureBlocked.has(key) ? 'F' : '='
				continue
			}
			line += roomCharByCell.get(key) ?? '.'
		}
		lines.push(rowLabel + line)
	}

	lines.push('', 'legend:  # wall/blocked   = blocked-by-object   F furniture footprint   + door   P portal   . circulation (hall)   X finding counterexample   A-Z typed rooms')
	if (legend.length) lines.push(...legend)
	const c = floor.counts
	lines.push(
		`counts:  grid ${c.gridTiles} = occupied ${c.roomTiles} + circulation ${c.circulationTiles} + structure ${c.structureTiles} + furniture ${c.furnitureTiles} + street ${c.streetTiles}  reconciles=${c.reconciles}  unreachable=${c.unreachableTiles}`,
	)
	return lines.join('\n')
}

function overlayCells(options: RenderOptions): Set<string> {
	return cellSet([...(options.markCells ?? []), ...(options.findings ?? []).flatMap(finding => finding.cells)])
}

/** Vector plan, for reports and for diffing two revisions side by side. */
export function renderSvg(floor: FloorNode, options: RenderOptions = {}): string {
	const scale = options.scale ?? 8
	const zoom = options.zoom ?? { x0: 0, y0: 0, x1: floor.cols - 1, y1: floor.rows - 1 }
	const w = (zoom.x1 - zoom.x0 + 1) * scale
	const h = (zoom.y1 - zoom.y0 + 1) * scale
	const marked = overlayCells(options)
	const furnitureBlocked = cellSet(floor.furniture.flatMap(item => item.blockedCells.map(cell => cell)))
	const portalCells = cellSet(floor.portals.flatMap(portal => portal.cells))
	const parts: string[] = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
		`<rect width="${w}" height="${h}" fill="#1b1e21"/>`,
	]
	// Cell -> room, resolved once. Doing this lookup inside the per-pixel loop meant rebuilding a Set of
	// every room's cells for every tile until one matched: quadratic in room area times canvas size.
	const roomByCell = new Map<string, (typeof floor.rooms)[number]>()
	for (const room of floor.rooms) {
		for (const cell of room.cells) {
			const cellKey = `${cell.x},${cell.y}`
			if (!roomByCell.has(cellKey)) roomByCell.set(cellKey, room)
		}
	}
	for (let y = zoom.y0; y <= zoom.y1; y++) {
		for (let x = zoom.x0; x <= zoom.x1; x++) {
			const key = `${x},${y}`
			const state = floor.tileStates[y]?.[x]
			let fill: string | null
			if (marked.has(key)) fill = '#e74c3c'
			else if (portalCells.has(key) && options.portals !== false) fill = '#9b59b6'
			else if (state === 'blocked') fill = furnitureBlocked.has(key) ? '#6d4c41' : '#cfd3d6'
			else if (state === 'door') fill = '#f39c12'
			else if (!floor.walkable[y]?.[x]) fill = furnitureBlocked.has(key) ? '#6d4c41' : '#5d6d7e'
			else if (options.rooms !== false) {
				const room = roomByCell.get(key)
				fill = room ? (room.isCorridor ? '#2c3136' : paletteFor(room.typeId)) : '#2c3136'
			} else fill = '#2c3136'
			if (!fill) continue
			parts.push(`<rect x="${(x - zoom.x0) * scale}" y="${(y - zoom.y0) * scale}" width="${scale}" height="${scale}" fill="${fill}"/>`)
		}
	}
	if (options.grid !== false && scale >= 6) {
		for (let x = zoom.x0; x <= zoom.x1 + 1; x++) {
			if (x % 10 !== 0) continue
			parts.push(`<line x1="${(x - zoom.x0) * scale}" y1="0" x2="${(x - zoom.x0) * scale}" y2="${h}" stroke="#ffffff18"/>`)
		}
		for (let y = zoom.y0; y <= zoom.y1 + 1; y++) {
			if (y % 10 !== 0) continue
			parts.push(`<line x1="0" y1="${(y - zoom.y0) * scale}" x2="${w}" y2="${(y - zoom.y0) * scale}" stroke="#ffffff18"/>`)
		}
	}
	parts.push('</svg>')
	return parts.join('\n')
}

export interface PngRender {
	png: Buffer
	/** Raw pixels, kept beside the encoded buffer so renders can be composed without decoding. */
	rgba: Uint8Array
	width: number
	height: number
}

/**
 * Raster plan. Room fills are typed, findings are outlined in red and labelled with their id,
 * and a legend strip names every colour - a picture the agent can read without a caption it
 * has to trust.
 */
export function renderPng(floor: FloorNode, options: RenderOptions = {}): PngRender {
	const scale = Math.max(2, options.scale ?? 8)
	const zoom = options.zoom ?? { x0: 0, y0: 0, x1: floor.cols - 1, y1: floor.rows - 1 }
	const cols = zoom.x1 - zoom.x0 + 1
	const rows = zoom.y1 - zoom.y0 + 1
	const legendRows = options.labels === false ? 0 : 6 + (options.findings?.length ?? 0)
	const legendHeight = legendRows * 14 + 12
	const width = cols * scale
	const height = rows * scale + legendHeight
	const bg = parseHexColor('#14171a', { r: 20, g: 23, b: 26 })
	const raster = new Raster(width, height, bg)

	const roomByCell = new Map<string, { typeId: string; isCorridor: boolean; id: string }>()
	if (options.rooms !== false) {
		for (const room of floor.rooms) for (const cell of room.cells) roomByCell.set(`${cell.x},${cell.y}`, { typeId: room.typeId, isCorridor: room.isCorridor, id: room.id })
	}
	const furnitureByCell = new Map<string, FurnitureShade>()
	if (options.furniture !== false) {
		for (const item of floor.furniture) {
			for (const cell of item.cells) furnitureByCell.set(`${cell.x},${cell.y}`, { blocked: item.blockedCells.some(b => b.x === cell.x && b.y === cell.y), portal: item.portal })
		}
	}
	const portalCells = cellSet(floor.portals.flatMap(portal => portal.cells))
	const marked = overlayCells(options)
	const wallColor = parseHexColor('#dfe4e8', { r: 223, g: 228, b: 232 })
	const objectColor = parseHexColor('#8d6e63', { r: 141, g: 110, b: 99 })
	const doorColor = parseHexColor('#f5b041', { r: 245, g: 176, b: 65 })
	const hallColor = parseHexColor('#2b3138', { r: 43, g: 49, b: 56 })
	const deadColor = parseHexColor('#566573', { r: 86, g: 101, b: 115 })
	const portalColor = parseHexColor('#a569bd', { r: 165, g: 105, b: 189 })
	const findingColor = parseHexColor('#e74c3c', { r: 231, g: 76, b: 60 })
	const gridColor = parseHexColor('#ffffff', { r: 255, g: 255, b: 255 })

	for (let y = zoom.y0; y <= zoom.y1; y++) {
		for (let x = zoom.x0; x <= zoom.x1; x++) {
			const key = `${x},${y}`
			const px = (x - zoom.x0) * scale
			const py = (y - zoom.y0) * scale
			const state = floor.tileStates[y]?.[x]
			const room = roomByCell.get(key)
			const furniture = furnitureByCell.get(key)
			let color: Rgb
			if (state === 'blocked') color = furniture?.blocked ? objectColor : wallColor
			else if (state === 'door') color = doorColor
			else if (!floor.walkable[y]?.[x]) color = furniture?.blocked ? objectColor : deadColor
			else if (portalCells.has(key) && options.portals !== false) color = portalColor
			else if (room) color = room.isCorridor ? hallColor : parseHexColor(paletteFor(room.typeId), hallColor)
			else color = hallColor
			raster.fillRect(px, py, scale, scale, color)
			if (marked.has(key)) raster.strokeRect(px, py, scale, scale, findingColor)
			if (options.grid !== false && scale >= 8 && (x % 10 === 0 || y % 10 === 0)) {
				if (x % 10 === 0) raster.line(px, py, px, py + scale - 1, { r: gridColor.r, g: gridColor.g, b: gridColor.b })
				if (y % 10 === 0) raster.line(px, py, px + scale - 1, py, { r: gridColor.r, g: gridColor.g, b: gridColor.b })
			}
		}
	}

	if (options.labels !== false) {
		for (const room of floor.rooms) {
			if (room.isCorridor) continue
			const cx = room.bounds.minX + Math.floor((room.bounds.maxX - room.bounds.minX) / 2)
			const cy = room.bounds.minY + Math.floor((room.bounds.maxY - room.bounds.minY) / 2)
			if (cx < zoom.x0 || cx > zoom.x1 || cy < zoom.y0 || cy > zoom.y1) continue
			const text = room.typeId.slice(0, 6).toUpperCase()
			const tx = (cx - zoom.x0) * scale - Math.floor(textWidth(text, 1) / 2)
			const ty = (cy - zoom.y0) * scale - 3
			raster.fillRect(tx - 2, ty - 2, textWidth(text, 1) + 4, 11, { r: 20, g: 23, b: 26 })
			drawText(raster, text, tx, ty, 1, { r: 250, g: 250, b: 250 })
		}

		let ly = rows * scale + 8
		const legend: [string, string][] = [
			['#dfe4e8', 'WALL / BLOCKED'],
			['#8d6e63', 'FURNITURE BLOCK-OUT'],
			['#f5b041', 'DOOR'],
			['#a569bd', 'PORTAL (LIFT / STAIR)'],
			['#2b3138', 'CIRCULATION / HALL'],
			['#e74c3c', 'FINDING COUNTEREXAMPLE'],
		]
		for (const [hex, text] of legend) {
			raster.fillRect(8, ly, 10, 10, parseHexColor(hex, bg))
			drawText(raster, text, 24, ly + 2, 1, { r: 210, g: 215, b: 220 })
			ly += 14
		}
		const types = [...new Set(floor.rooms.filter(room => !room.isCorridor).map(room => room.typeId))]
		drawText(raster, `ROOM TYPES: ${types.join(' ') || 'NONE'}`, 200, rows * scale + 10, 1, { r: 190, g: 195, b: 200 })
		const findings = options.findings ?? []
		findings.forEach((finding, i) => {
			drawText(
				raster,
				`${finding.id} ${finding.severity.toUpperCase()} ${finding.metric} = ${finding.actual} (need ${finding.required})`,
				200,
				rows * scale + 24 + i * 14,
				1,
				finding.severity === 'critical' ? { r: 255, g: 120, b: 110 } : { r: 220, g: 200, b: 150 },
			)
		})
		drawText(raster, `${floor.label} ${cols}X${rows} TILES  1 TILE = ${METRES_PER_TILE} M`, 8, rows * scale + 8 + 6 * 14, 1, { r: 150, g: 155, b: 160 })
	}

	return { png: raster.toPng(), rgba: raster.data, width, height }
}

interface FurnitureShade {
	blocked: boolean
	portal: boolean
}

/** A side-by-side contact sheet, so "compare" is something the agent sees, not only reads. */
export function renderContactSheet(renders: readonly PngRender[], labels: readonly string[], columns = 2): PngRender {
	if (renders.length === 0) throw new Error('renderContactSheet: nothing to compose')
	const gap = 12
	const labelHeight = 18
	const cellW = Math.max(...renders.map(render => render.width))
	const cellH = Math.max(...renders.map(render => render.height))
	const rows = Math.ceil(renders.length / columns)
	const width = columns * cellW + (columns + 1) * gap
	const height = rows * (cellH + labelHeight) + (rows + 1) * gap
	const sheet = new Raster(width, height, { r: 10, g: 12, b: 14 })
	renders.forEach((render, i) => {
		const col = i % columns
		const row = Math.floor(i / columns)
		const ox = gap + col * (cellW + gap)
		const oy = gap + row * (cellH + labelHeight + gap)
		drawText(sheet, labels[i] ?? `OPTION ${i + 1}`, ox, oy, 2, { r: 240, g: 240, b: 240 })
		for (let y = 0; y < render.height; y++) {
			for (let x = 0; x < render.width; x++) {
				const src = (y * render.width + x) * 4
				sheet.setPixel(ox + x, oy + labelHeight + y, { r: render.rgba[src], g: render.rgba[src + 1], b: render.rgba[src + 2] })
			}
		}
	})
	return { png: sheet.toPng(), rgba: sheet.data, width, height }
}
