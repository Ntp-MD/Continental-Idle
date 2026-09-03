import type { AssetDef, FloorData, ObjectData, WallSegment } from '../../blueprint-editor/domain/types'
import { resolveObjectDef, resolveQueueForTarget, normalizeWallSegment } from '../../blueprint-editor/domain/types'
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

function edgeKey(from: NpcEnginePoint, to: NpcEnginePoint): string {
	return `${key(from.x, from.y)}>${key(to.x, to.y)}`
}

function isBlockedEdge(floor: NpcEngineFloor, from: NpcEnginePoint, to: NpcEnginePoint): boolean {
	return (floor.blockedEdges ?? []).some(edge => edgeKey(edge.from, edge.to) === edgeKey(from, to) || edgeKey(edge.from, edge.to) === edgeKey(to, from))
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

function rotateWallSegmentsGrid(segments: WallSegment[], w: number, h: number, rotSteps: number): WallSegment[] {
	const steps = ((rotSteps % 4) + 4) % 4
	if (steps === 0) return segments
	const result: WallSegment[] = []
	for (const seg of segments) {
		let x1 = seg.x1, y1 = seg.y1, x2 = seg.x2, y2 = seg.y2
		const door = seg.door
		for (let i = 0; i < steps; i++) {
			const nx1 = h - 1 - y1
			const ny1 = x1
			const nx2 = h - 1 - y2
			const ny2 = x2
			x1 = nx1; y1 = ny1; x2 = nx2; y2 = ny2
			const tmp = w; w = h; h = tmp
		}
		const normalized = normalizeWallSegment({ x1, y1, x2, y2, door })
		if (normalized) result.push(normalized)
	}
	return result
}

function doorCellsForDirection(
	segments: WallSegment[],
	direction: Direction,
	rows: number,
	cols: number,
): Array<{ row: number; col: number }> {
	const cells: Array<{ row: number; col: number }> = []
	const seen = new Set<string>()
	for (const seg of segments) {
		if (direction.dr === -1 && direction.dc === 0 && seg.y1 === seg.y2) {
			const row = Math.round(seg.y1)
			if (row !== 0) continue
			const startCol = Math.round(Math.min(seg.x1, seg.x2))
			const endCol = Math.round(Math.max(seg.x1, seg.x2))
			for (let col = startCol; col < endCol; col++) {
				const k = `0,${col}`
				if (!seen.has(k)) { seen.add(k); cells.push({ row: 0, col }) }
			}
		} else if (direction.dr === 1 && direction.dc === 0 && seg.y1 === seg.y2) {
			const row = Math.round(seg.y1)
			if (row !== rows) continue
			const startCol = Math.round(Math.min(seg.x1, seg.x2))
			const endCol = Math.round(Math.max(seg.x1, seg.x2))
			for (let col = startCol; col < endCol; col++) {
				const k = `${rows - 1},${col}`
				if (!seen.has(k)) { seen.add(k); cells.push({ row: rows - 1, col }) }
			}
		} else if (direction.dr === 0 && direction.dc === -1 && seg.x1 === seg.x2) {
			const col = Math.round(seg.x1)
			if (col !== 0) continue
			const startRow = Math.round(Math.min(seg.y1, seg.y2))
			const endRow = Math.round(Math.max(seg.y1, seg.y2))
			for (let row = startRow; row < endRow; row++) {
				const k = `${row},0`
				if (!seen.has(k)) { seen.add(k); cells.push({ row, col: 0 }) }
			}
		} else if (direction.dr === 0 && direction.dc === 1 && seg.x1 === seg.x2) {
			const col = Math.round(seg.x1)
			if (col !== cols) continue
			const startRow = Math.round(Math.min(seg.y1, seg.y2))
			const endRow = Math.round(Math.max(seg.y1, seg.y2))
			for (let row = startRow; row < endRow; row++) {
				const k = `${row},${cols - 1}`
				if (!seen.has(k)) { seen.add(k); cells.push({ row, col: cols - 1 }) }
			}
		}
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
		const rotSteps = Math.round(object.rotation / 90)
		const doorSegments = rotateWallSegmentsGrid(
			asset.wallSegments?.filter(seg => seg.door) ?? [],
			asset.w, asset.h, rotSteps,
		)
		if (!doorSegments.length) continue
		for (const direction of DIRECTIONS) {
			const doorCells = doorCellsForDirection(doorSegments, direction, rows, cols)
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
						const previousPoint = { x: point.x - direction.dc, y: point.y - direction.dr }
						if (!walkable.has(key(point.x, point.y)) || isBlockedEdge(floor, previousPoint, point)) continue
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
					.filter(point => walkable.has(key(point.x, point.y)))
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
