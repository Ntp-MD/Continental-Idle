import { buildNpcEngineLayout } from '../../src/engine/npc/layoutBuild'
import { normalizeObject } from '../../src/blueprint-editor/domain/geometry'
import type { AssetDef, FloorData } from '../../src/blueprint-editor/domain/types'

// Shared model for tests that read a floor layout through the engine: points and
// footprints are snapped to the grid and normalized first, exactly like the store.

export interface HotelModel {
	assetMap: Map<string, AssetDef>
	floors: FloorData[]
	built: ReturnType<typeof buildNpcEngineLayout>
	tile: number
	cols: number
	rows: number
	street: number
}

export interface RawLayout {
	floors: readonly unknown[]
	canvas: { width: number; height: number; tileSize: number }
	streetWidthTiles?: number
}

// Objects arrive at tile granularity but the engine reads their resolved footprint,
// so every consumer snaps to the grid and normalizes first - exactly like the store does.
export function hotelModel(rawLayout: RawLayout, rawAssets: AssetDef[]): HotelModel {
	const tile = rawLayout.canvas.tileSize
	const assetMap = new Map<string, AssetDef>(rawAssets.map(a => [a.id, a]))
	const floors = JSON.parse(JSON.stringify(rawLayout.floors)) as FloorData[]
	for (const floor of floors) {
		for (const object of floor.objects) {
			object.x = Math.round(object.x / tile) * tile
			object.y = Math.round(object.y / tile) * tile
			normalizeObject(object, tile, [...assetMap.values()])
		}
	}
	const built = buildNpcEngineLayout(
		floors,
		{ w: rawLayout.canvas.width, h: rawLayout.canvas.height, tileSize: tile },
		type => assetMap.get(type),
		type => assetMap.get(type)?.tags,
	)
	return {
		assetMap,
		floors,
		built,
		tile,
		cols: rawLayout.canvas.width / tile,
		rows: rawLayout.canvas.height / tile,
		street: rawLayout.streetWidthTiles ?? 0,
	}
}

// Everything the building occupies, minus the street ring the engine draws around it.
export function envelopeOf(model: HotelModel): (c: number, r: number) => boolean {
	const { street, cols, rows } = model
	return (c, r) => r >= street && r <= rows - 1 - street && c >= street && c <= cols - 1 - street
}

// Connected components of the engine's own walkable cells, optionally limited to a region.
export function groupsOf(tiles: Set<string>, inside?: (c: number, r: number) => boolean): Set<string>[] {
	const pool = new Set<string>()
	for (const k of tiles) {
		if (!inside) { pool.add(k); continue }
		const [c, r] = k.split(',').map(Number)
		if (inside(c, r)) pool.add(k)
	}
	const claimed = new Set<string>()
	const groups: Set<string>[] = []
	for (const start of pool) {
		if (claimed.has(start)) continue
		const group = new Set<string>([start])
		claimed.add(start)
		const stack = [start]
		while (stack.length) {
			const [x, y] = stack.pop()!.split(',').map(Number)
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const k = `${x + dx},${y + dy}`
				if (!pool.has(k) || claimed.has(k)) continue
				claimed.add(k)
				group.add(k)
				stack.push(k)
			}
		}
		groups.push(group)
	}
	return groups
}

export const biggestOf = (groups: Set<string>[]) => groups.reduce((a, b) => (a.size >= b.size ? a : b), new Set<string>())
