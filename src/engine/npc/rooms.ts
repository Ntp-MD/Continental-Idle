// rooms - derive floor rooms from the engine walkable map. Door cells are
// boundaries: they belong to no room, so occupancy never gates a doorway.
import { tileKey } from './keys'
import type { NpcWalkableMap } from './types'

export function deriveFloorRooms(map: NpcWalkableMap, doorCells: ReadonlySet<string>): Map<string, string> {
	const roomIdByCell = new Map<string, string>()
	const cellsPerRow = map.width
	const visited = new Uint8Array(map.width * map.height)
	const queue: number[] = []
	let roomIndex = 0
	for (let y = 0; y < map.height; y++) {
		for (let x = 0; x < map.width; x++) {
			const seed = tileKey(x, y)
			if (roomIdByCell.has(seed) || doorCells.has(seed) || !map.tiles.has(seed)) continue
			roomIndex++
			const roomId = `room-${roomIndex}`
			roomIdByCell.set(seed, roomId)
			queue.length = 0
			queue.push(y * cellsPerRow + x)
			visited[y * cellsPerRow + x] = 1
			while (queue.length) {
				const cell = queue.pop()!
				const cx = cell % cellsPerRow
				const cy = (cell - cx) / cellsPerRow
				for (let d = 0; d < 4; d++) {
					const nx = cx + NEIGHBOUR_DX[d]
					const ny = cy + NEIGHBOUR_DY[d]
					if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue
					const index = ny * cellsPerRow + nx
					if (visited[index]) continue
					const key = tileKey(nx, ny)
					if (roomIdByCell.has(key) || doorCells.has(key) || !map.tiles.has(key)) continue
					visited[index] = 1
					roomIdByCell.set(key, roomId)
					queue.push(index)
				}
			}
		}
	}
	return roomIdByCell
}

const NEIGHBOUR_DX = [1, -1, 0, 0]
const NEIGHBOUR_DY = [0, 0, 1, -1]
