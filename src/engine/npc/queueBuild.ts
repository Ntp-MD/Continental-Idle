import type { AssetDef, FloorData, ObjectData, TileState } from '../../blueprint-editor/domain/types'
import { resolveObjectDef, resolveQueueForTarget } from '../../blueprint-editor/domain/types'
import type { NpcEngineFloor, NpcEngineInteractionTarget, NpcEnginePoint, NpcEngineQueue } from './types'

interface Direction {
	dr: number
	dc: number
	tangent: 'row' | 'col'
}

const DIRECTIONS: readonly Direction[] = [
	{ dr: -1, dc: 0, tangent: 'col' },
	{ dr: 1, dc: 0, tangent: 'col' },
	{ dr: 0, dc: -1, tangent: 'row' },
	{ dr: 0, dc: 1, tangent: 'row' },
]

function key(x: number, y: number): string {
	return `${x},${y}`
}

function objectTargetKeys(objectId: string, targets: readonly NpcEngineInteractionTarget[]): string[] {
	const itemId = `object:${objectId}`
	return targets
		.filter(target => target.itemId === itemId && !target.transitionToFloorId)
		.map(target => `${target.floorId}:${target.itemId}:${target.interactSpotId}`)
}

function objectCell(object: ObjectData, row: number, col: number, tileSize: number): NpcEnginePoint {
	return { x: Math.floor(object.x / tileSize) + col, y: Math.floor(object.y / tileSize) + row }
}

function doorCellsForDirection(
	tileStates: TileState[][] | undefined,
	direction: Direction,
): Array<{ row: number; col: number }> {
	if (!tileStates?.length) return []
	const rows = tileStates.length
	const cols = tileStates[0]?.length ?? 0
	const cells: Array<{ row: number; col: number }> = []
	if (direction.dr === -1 && direction.dc === 0) {
		for (let col = 0; col < cols; col++) if (tileStates[0]?.[col] === 'door') cells.push({ row: 0, col })
	} else if (direction.dr === 1 && direction.dc === 0) {
		for (let col = 0; col < cols; col++) if (tileStates[rows - 1]?.[col] === 'door') cells.push({ row: rows - 1, col })
	} else if (direction.dc === -1) {
		for (let row = 0; row < rows; row++) if (tileStates[row]?.[0] === 'door') cells.push({ row, col: 0 })
	} else if (direction.dc === 1) {
		for (let row = 0; row < rows; row++) if (tileStates[row]?.[cols - 1] === 'door') cells.push({ row, col: cols - 1 })
	}
	return cells
}

function sideCellsForDirection(
	direction: Direction,
	rows: number,
	cols: number,
): Array<{ row: number; col: number }> {
	const cells: Array<{ row: number; col: number }> = []
	if (direction.dc === 0) {
		const row = direction.dr === -1 ? 0 : rows - 1
		for (let col = 0; col < cols; col++) cells.push({ row, col })
	} else {
		const col = direction.dc === -1 ? 0 : cols - 1
		for (let row = 0; row < rows; row++) cells.push({ row, col })
	}
	return cells
}

export function buildNpcQueues(
	floor: NpcEngineFloor,
	floorData: FloorData,
	tileSize: number,
	assets: ReadonlyMap<string, AssetDef>,
	targets: readonly NpcEngineInteractionTarget[],
): NpcEngineQueue[] {
	const walkable = new Set(floor.walkable.map(point => key(point.x, point.y)))
	const queues: NpcEngineQueue[] = []
	for (const object of floorData.objects) {
		const asset = assets.get(object.type)
		const definition = resolveObjectDef(object.rotation, asset, { w: object.w, h: object.h })
		if (!asset) continue
		const resolvedQueue = resolveQueueForTarget(definition.queue)
		const maxQueueSlots = resolvedQueue.maxMembers
		const admissionDepth = resolvedQueue.admissionDepth
		const rows = asset.h
		const cols = asset.w
		if (rows <= 0 || cols <= 0) continue
		const targetKeys = objectTargetKeys(object.id, targets)
		if (!targetKeys.length) continue
		const hasDoorCells = DIRECTIONS.some(direction => doorCellsForDirection(definition.tileStates, direction).length > 0)
		if (!hasDoorCells && !definition.queue) continue
		const targetCells = new Set(
			targets
				.filter(target => target.itemId === `object:${object.id}` && !target.transitionToFloorId)
				.map(target => key(target.x, target.y)),
		)
		for (const direction of DIRECTIONS) {
			const doorCells = hasDoorCells
				? doorCellsForDirection(definition.tileStates, direction)
				: sideCellsForDirection(direction, rows, cols)
			if (!doorCells.length) continue
			doorCells.sort((a, b) => (direction.tangent === 'row' ? a.row - b.row : a.col - b.col))
			const groups: Array<Array<{ row: number; col: number }>> = []
			for (const cell of doorCells) {
				const previous = groups[groups.length - 1]?.at(-1)
				const previousIndex = direction.tangent === 'row' ? previous?.row : previous?.col
				const currentIndex = direction.tangent === 'row' ? cell.row : cell.col
				if (previous && previousIndex !== undefined && currentIndex === previousIndex + 1) groups[groups.length - 1].push(cell)
				else groups.push([cell])
			}
			for (const group of groups) {
				const candidateSlots: Array<{ point: NpcEnginePoint; depth: number; tangentDistance: number }> = []
				const midpoint = group.reduce((sum, cell) => sum + (direction.tangent === 'row' ? cell.row : cell.col), 0) / group.length
				for (let depth = 1; depth <= maxQueueSlots; depth++) {
					for (const cell of group) {
						const base = objectCell(object, cell.row, cell.col, tileSize)
						const point = { x: base.x + direction.dc * depth, y: base.y + direction.dr * depth }
						if (!walkable.has(key(point.x, point.y)) || targetCells.has(key(point.x, point.y))) continue
						const tangent = direction.tangent === 'row' ? cell.row : cell.col
						candidateSlots.push({ point, depth, tangentDistance: Math.abs(tangent - midpoint) })
					}
				}
				candidateSlots.sort((a, b) => a.depth - b.depth || a.tangentDistance - b.tangentDistance || a.point.y - b.point.y || a.point.x - b.point.x)
				const slots: NpcEnginePoint[] = []
				const seen = new Set<string>()
				for (const candidate of candidateSlots) {
					const pointKey = key(candidate.point.x, candidate.point.y)
					if (seen.has(pointKey)) continue
					seen.add(pointKey)
					slots.push(candidate.point)
				}
				if (!slots.length) continue
				slots.splice(maxQueueSlots)
				const admissionPoints = group
					.map(cell => {
						const base = objectCell(object, cell.row, cell.col, tileSize)
						return { x: base.x + direction.dc * admissionDepth, y: base.y + direction.dr * admissionDepth }
					})
					.filter(point => {
						if (!walkable.has(key(point.x, point.y))) return false
						if (targetCells.has(key(point.x, point.y))) return false
						return true
					})
				queues.push({
					key: `${floor.id}:queue:${object.id}:${direction.dr}:${direction.dc}:${group[0].row}:${group[0].col}`,
					targetKeys,
					slots,
					admissionPoints,
					maxMembers: maxQueueSlots,
				})
			}
		}
	}
	return queues
}
