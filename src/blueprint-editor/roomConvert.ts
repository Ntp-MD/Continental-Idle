import type { TileEdges, WallSegment } from './types'
import { applyWallSegment } from './composables/useWallPaint'

export function wallRunsFromEdges(edges: TileEdges[][], tileSize: number): WallSegment[] {
	const runs: WallSegment[] = []
	const seen = new Set<string>()
	const addRun = (run: WallSegment) => {
		const key = `${run.x1},${run.y1},${run.x2},${run.y2}`
		if (seen.has(key)) return
		seen.add(key)
		runs.push(run)
	}
	for (let r = 0; r < edges.length; r++) {
		const row = edges[r]
		if (!row) continue
		for (let c = 0; c < row.length; c++) {
			const cell = row[c]
			if (!cell) continue
			if (cell.top) addRun({ x1: c * tileSize, y1: r * tileSize, x2: (c + 1) * tileSize, y2: r * tileSize })
			if (cell.bottom) addRun({ x1: c * tileSize, y1: (r + 1) * tileSize, x2: (c + 1) * tileSize, y2: (r + 1) * tileSize })
			if (cell.left) addRun({ x1: c * tileSize, y1: r * tileSize, x2: c * tileSize, y2: (r + 1) * tileSize })
			if (cell.right) addRun({ x1: (c + 1) * tileSize, y1: r * tileSize, x2: (c + 1) * tileSize, y2: (r + 1) * tileSize })
		}
	}
	return runs
}

export interface DerivedRoom {
	x: number
	y: number
	widthTiles: number
	heightTiles: number
	tileEdges: TileEdges[][]
}

function isAligned(value: number, tileSize: number): boolean {
	return Math.round(value) % tileSize === 0
}

export function deriveRoomFromSegments(segments: readonly WallSegment[], tileSize: number): DerivedRoom | null {
	if (!segments.length || tileSize <= 0) return null
	for (const seg of segments) {
		if (!isAligned(seg.x1, tileSize) || !isAligned(seg.y1, tileSize)
			|| !isAligned(seg.x2, tileSize) || !isAligned(seg.y2, tileSize)) return null
	}
	const minX = Math.min(...segments.map(s => Math.min(s.x1, s.x2)))
	const maxX = Math.max(...segments.map(s => Math.max(s.x1, s.x2)))
	const minY = Math.min(...segments.map(s => Math.min(s.y1, s.y2)))
	const maxY = Math.max(...segments.map(s => Math.max(s.y1, s.y2)))
	const widthTiles = Math.round((maxX - minX) / tileSize)
	const heightTiles = Math.round((maxY - minY) / tileSize)
	if (widthTiles <= 0 || heightTiles <= 0) return null

	const localEdges: TileEdges[][] = Array.from({ length: heightTiles }, () =>
		Array.from({ length: widthTiles }, () => ({} as TileEdges)),
	)
	for (const seg of segments) {
		applyWallSegment(localEdges, { ...seg, x1: seg.x1 - minX, y1: seg.y1 - minY, x2: seg.x2 - minX, y2: seg.y2 - minY }, tileSize, true)
	}
	return { x: minX, y: minY, widthTiles, heightTiles, tileEdges: localEdges }
}
