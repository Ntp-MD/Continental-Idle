import { MAX_GRID_COLUMNS, MAX_GRID_ROWS } from '../../limits'
import { hasOwn, isRecord } from './helpers'

export type TileState = 'walkable' | 'blocked' | 'door'

export type TileBrush = TileState | 'erase'

export type WalkableGrid = boolean[][]

export interface FloorWalkable {
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
}

export function resolveFloorTileStates(
	floor: { walkable?: FloorWalkable; defaultWalkable?: boolean },
	rows: number,
	cols: number,
): TileState[][] {
	const existing = floor.walkable?.tileStates
	if (existing?.length === rows && existing.every((row) => row.length === cols)) {
		return existing.map((row) => [...row])
	}
	const existingGrid = floor.walkable?.walkableGrid
	if (existingGrid?.length === rows && existingGrid.every((row) => row.length === cols)) {
		return existingGrid.map((row) => row.map((cell) => (cell ? 'walkable' : 'blocked')))
	}
	const fallback: TileState = floor.defaultWalkable === false ? 'blocked' : 'walkable'
	return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fallback))
}

export function applyTileBrush(states: TileState[][], brush: TileBrush, row0: number, col0: number, row1: number, col1: number): void {
	for (let row = Math.max(0, row0); row <= Math.min(states.length - 1, row1); row++) {
		const cells = states[row]
		for (let col = Math.max(0, col0); col <= Math.min(cells.length - 1, col1); col++) {
			if (brush === 'erase') cells[col] = cells[col] === 'walkable' ? 'blocked' : 'walkable'
			else cells[col] = brush
		}
	}
}

export function tileStatesToWalkableGrid(states: TileState[][]): WalkableGrid {
	return states.map((row) => row.map((state) => state === 'walkable' || state === 'door'))
}

export interface DoorGroupCell {
	row: number
	col: number
	slideDir: -1 | 1
}

export interface DoorGroup {
	key: string
	axis: 'x' | 'y'
	cells: DoorGroupCell[]
}

export function groupDoorCells(states: TileState[][]): DoorGroup[] {
	const groups: DoorGroup[] = []
	if (!states?.length) return groups
	const seen = new Set<string>()
	const isDoor = (row: number, col: number): boolean => states[row]?.[col] === 'door'
	for (let row = 0; row < states.length; row++) {
		const cols = states[row]?.length ?? 0
		for (let col = 0; col < cols; col++) {
			const key = `${row},${col}`
			if (!isDoor(row, col) || seen.has(key)) continue
			const cells: Array<{ row: number; col: number }> = []
			const queue = [{ row, col }]
			seen.add(key)
			while (queue.length) {
				const current = queue.shift()!
				cells.push(current)
				const neighbors = [
					[current.row - 1, current.col],
					[current.row + 1, current.col],
					[current.row, current.col - 1],
					[current.row, current.col + 1],
				]
				for (const [nr, nc] of neighbors) {
					const nk = `${nr},${nc}`
					if (nr < 0 || nc < 0 || !isDoor(nr, nc) || seen.has(nk)) continue
					seen.add(nk)
					queue.push({ row: nr, col: nc })
				}
			}
			const minRow = Math.min(...cells.map((cell) => cell.row))
			const maxRow = Math.max(...cells.map((cell) => cell.row))
			const minCol = Math.min(...cells.map((cell) => cell.col))
			const maxCol = Math.max(...cells.map((cell) => cell.col))
			const axis: 'x' | 'y' = maxCol - minCol >= maxRow - minRow ? 'x' : 'y'
			const sorted = [...cells].sort((a, b) => (axis === 'x' ? a.col - b.col : a.row - b.row))
			const half = Math.ceil(sorted.length / 2)
			groups.push({
				key: `${minRow},${minCol}`,
				axis,
				cells: sorted.map((cell, index) => ({ row: cell.row, col: cell.col, slideDir: index < half ? -1 : 1 })),
			})
		}
	}
	return groups
}

export function rescaleFloorWalkable(walkable: FloorWalkable | undefined, rows: number, cols: number): FloorWalkable | undefined {
	if (!walkable) return walkable
	const states = walkable.tileStates
	if (states?.length && states[0]?.length) {
		const oldRows = states.length
		const oldCols = states[0].length
		if (oldRows === rows && oldCols === cols) return walkable
		const scale = (map: (or: number, oc: number) => TileState): TileState[][] =>
			Array.from({ length: rows }, (_, row) =>
				Array.from({ length: cols }, (_, col) => {
					const or = Math.min(oldRows - 1, Math.floor((row * oldRows) / rows))
					const oc = Math.min(oldCols - 1, Math.floor((col * oldCols) / cols))
					return map(or, oc)
				}),
			)
		const scaled = scale((or, oc) => states[or][oc] ?? 'walkable')
		return { walkableGrid: tileStatesToWalkableGrid(scaled), tileStates: scaled }
	}
	const grid = walkable.walkableGrid
	if (grid?.length && grid[0]?.length) {
		const oldRows = grid.length
		const oldCols = grid[0].length
		if (oldRows === rows && oldCols === cols) return walkable
		const scaled = Array.from({ length: rows }, (_, row) =>
			Array.from({ length: cols }, (_, col) => {
				const or = Math.min(oldRows - 1, Math.floor((row * oldRows) / rows))
				const oc = Math.min(oldCols - 1, Math.floor((col * oldCols) / cols))
				return grid[or]?.[oc] ?? true
			}),
		)
		return { walkableGrid: scaled }
	}
	return walkable
}

export function normalizeFloorWalkable(value: unknown): FloorWalkable | undefined {
	if (!isRecord(value)) return undefined
	const hasWalkableGrid = hasOwn(value, 'walkableGrid')
	const hasTileStates = hasOwn(value, 'tileStates')
	const walkableGrid = normalizeWalkableGrid(value.walkableGrid)
	const tileStates = normalizeTileStates(value.tileStates)
	if (hasWalkableGrid && !walkableGrid) return undefined
	if (hasTileStates && !tileStates) return undefined
	if (!walkableGrid && !tileStates) return undefined
	if (walkableGrid && tileStates && (walkableGrid.length !== tileStates.length || walkableGrid.some((row, index) => row.length !== tileStates[index]?.length))) return undefined
	return {
		...(walkableGrid ? { walkableGrid } : {}),
		...(tileStates ? { tileStates } : {}),
	}
}

export function normalizeWalkableGrid(value: unknown): WalkableGrid | undefined {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_GRID_ROWS) return undefined
	const rows: boolean[][] = []
	let columnCount = 0
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0 || row.length > MAX_GRID_COLUMNS) return undefined
		if (columnCount === 0) columnCount = row.length
		if (row.length !== columnCount) return undefined
		const cols: boolean[] = []
		for (const cell of row) {
			if (typeof cell !== 'boolean') return undefined
			cols.push(cell)
		}
		rows.push(cols)
	}
	return rows
}


export function normalizeTileStates(value: unknown): TileState[][] | undefined {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_GRID_ROWS) return undefined
	const rows: TileState[][] = []
	let columnCount = 0
	for (const row of value) {
		if (!Array.isArray(row) || row.length === 0 || row.length > MAX_GRID_COLUMNS) return undefined
		if (columnCount === 0) columnCount = row.length
		if (row.length !== columnCount) return undefined
		const cols: TileState[] = []
		for (const cell of row) {
			if (cell !== 'walkable' && cell !== 'blocked' && cell !== 'door') return undefined
			cols.push(cell)
		}
		rows.push(cols)
	}
	return rows
}


