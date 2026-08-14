import type { NpcEngineFloor, NpcEngineInteractionTarget, NpcEnginePoint, NpcEngineQueue } from '@/engine/npc'
import type { AssetDef, FloorData, ObjectData } from './types'
import { resolveObjectDef } from './types'

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
		const states = definition.tileStates
		if (!states?.length) continue
		const rows = states.length
		const cols = states[0]?.length ?? 0
		if (!cols) continue
		const targetKeys = objectTargetKeys(object.id, targets)
		if (!targetKeys.length) continue
		for (const direction of DIRECTIONS) {
			const entranceCells: Array<{ row: number; col: number }> = []
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					if (states[row]?.[col] !== 'entrance') continue
					if (row === 0 && direction.dr === -1 && direction.dc === 0) entranceCells.push({ row, col })
					if (row === rows - 1 && direction.dr === 1 && direction.dc === 0) entranceCells.push({ row, col })
					if (col === 0 && direction.dr === 0 && direction.dc === -1) entranceCells.push({ row, col })
					if (col === cols - 1 && direction.dr === 0 && direction.dc === 1) entranceCells.push({ row, col })
				}
			}
			if (!entranceCells.length) continue
			entranceCells.sort((a, b) => (direction.tangent === 'row' ? a.row - b.row : a.col - b.col))
			const groups: Array<Array<{ row: number; col: number }>> = []
			for (const cell of entranceCells) {
				const previous = groups[groups.length - 1]?.at(-1)
				const previousIndex = direction.tangent === 'row' ? previous?.row : previous?.col
				const currentIndex = direction.tangent === 'row' ? cell.row : cell.col
				if (previous && previousIndex !== undefined && currentIndex === previousIndex + 1) groups[groups.length - 1].push(cell)
				else groups.push([cell])
			}
			for (const group of groups) {
				const candidateSlots: Array<{ point: NpcEnginePoint; depth: number; tangentDistance: number }> = []
				const midpoint = group.reduce((sum, cell) => sum + (direction.tangent === 'row' ? cell.row : cell.col), 0) / group.length
				for (let depth = 1; depth <= 3; depth++) {
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
				slots.splice(3)
				const admissionCandidates = group
					.map(cell => {
						const base = objectCell(object, cell.row, cell.col, tileSize)
						return { x: base.x + direction.dc * 4, y: base.y + direction.dr * 4 }
					})
					.filter(point => walkable.has(key(point.x, point.y)))
				const admissionPoints = admissionCandidates
				queues.push({
					key: `${floor.id}:queue:${object.id}:${direction.dr}:${direction.dc}:${group[0].row}:${group[0].col}`,
					targetKeys,
					slots,
					admissionPoints,
					maxMembers: 3,
				})
			}
		}
	}
	return queues
}
