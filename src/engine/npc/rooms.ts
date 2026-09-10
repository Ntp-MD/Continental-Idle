// rooms - derive floor rooms from the engine walkable map. Door cells are
// boundaries: they belong to no room, so occupancy never gates a doorway.
import type { NpcWalkableMap } from './layoutBuild'

export function deriveFloorRooms(map: NpcWalkableMap, doorCells: ReadonlySet<string>): Map<string, string> {
	const roomIdByCell = new Map<string, string>()
	let roomIndex = 0
	for (let y = 0; y < map.height; y++) {
		for (let x = 0; x < map.width; x++) {
			const seed = `${x},${y}`
			if (roomIdByCell.has(seed) || doorCells.has(seed) || !map.tiles.has(seed)) continue
			roomIndex++
			const roomId = `room-${roomIndex}`
			roomIdByCell.set(seed, roomId)
			const queue = [seed]
			while (queue.length) {
				const current = queue.pop()!
				const [cx, cy] = current.split(',').map(Number)
				for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
					const key = `${nx},${ny}`
					if (roomIdByCell.has(key) || doorCells.has(key) || !map.tiles.has(key)) continue
					roomIdByCell.set(key, roomId)
					queue.push(key)
				}
			}
		}
	}
	return roomIdByCell
}