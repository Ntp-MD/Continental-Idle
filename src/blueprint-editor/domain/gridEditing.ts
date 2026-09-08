import type { DoorMode, WallSegment } from './types'

export type TileEdges = {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
  doorTop?: boolean
  doorRight?: boolean
  doorBottom?: boolean
  doorLeft?: boolean
}

export type BorderSide = 'top' | 'right' | 'bottom' | 'left'

export function wallSegmentsToEdges(
  segments: readonly WallSegment[] | undefined,
  rows: number,
  cols: number,
): TileEdges[][] {
  const edges = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({}) as TileEdges))
  for (const segment of segments ?? []) {
    const isDoor = segment.door === true
    if (segment.y1 === segment.y2) {
      const boundary = Math.round(segment.y1)
      const start = Math.round(Math.min(segment.x1, segment.x2))
      const end = Math.max(start + 1, Math.round(Math.max(segment.x1, segment.x2)))
      for (let col = start; col < end; col++) {
        if (boundary >= 0 && boundary < rows && col >= 0 && col < cols) {
          edges[boundary][col].top = true
          if (isDoor) edges[boundary][col].doorTop = true
        }
        if (boundary - 1 >= 0 && boundary - 1 < rows && col >= 0 && col < cols) {
          edges[boundary - 1][col].bottom = true
          if (isDoor) edges[boundary - 1][col].doorBottom = true
        }
      }
    } else {
      const boundary = Math.round(segment.x1)
      const start = Math.round(Math.min(segment.y1, segment.y2))
      const end = Math.max(start + 1, Math.round(Math.max(segment.y1, segment.y2)))
      for (let row = start; row < end; row++) {
        if (row >= 0 && row < rows && boundary >= 0 && boundary < cols) {
          edges[row][boundary].left = true
          if (isDoor) edges[row][boundary].doorLeft = true
        }
        if (row >= 0 && row < rows && boundary - 1 >= 0 && boundary - 1 < cols) {
          edges[row][boundary - 1].right = true
          if (isDoor) edges[row][boundary - 1].doorRight = true
        }
      }
    }
  }
  return edges
}

export function edgesToWallSegments(edges: TileEdges[][]): WallSegment[] {
	const segments: WallSegment[] = []
	const seen = new Map<string, number>()
	const add = (segment: { x1: number; y1: number; x2: number; y2: number }, door: boolean) => {
		const key = `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`
		const idx = seen.get(key)
		if (idx !== undefined) {
			if (door) segments[idx].door = true
			return
		}
		seen.set(key, segments.length)
		segments.push(door ? { ...segment, door: true } : segment)
	}
	for (let row = 0; row < edges.length; row++) {
		for (let col = 0; col < (edges[row]?.length ?? 0); col++) {
			const edge = edges[row][col]
			if (edge.top) add({ x1: col, y1: row, x2: col + 1, y2: row }, !!edge.doorTop)
			if (edge.bottom) add({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 }, !!edge.doorBottom)
			if (edge.left) add({ x1: col, y1: row, x2: col, y2: row + 1 }, !!edge.doorLeft)
			if (edge.right) add({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 }, !!edge.doorRight)
		}
	}
	return segments
}

export function reattachDoorModes(
	previous: readonly WallSegment[] | undefined,
	next: readonly WallSegment[],
): WallSegment[] {
	if (!previous?.length) return [...next]
	const modes = new Map<string, NonNullable<WallSegment['doorMode']>>()
	for (const segment of previous) {
		if (segment.door === true && segment.doorMode !== undefined) {
			modes.set(`${segment.x1},${segment.y1},${segment.x2},${segment.y2}`, segment.doorMode)
		}
	}
	if (!modes.size) return [...next]
	return next.map(segment => {
		if (segment.door !== true || segment.doorMode !== undefined) return segment
		const mode = modes.get(`${segment.x1},${segment.y1},${segment.x2},${segment.y2}`)
		return mode === undefined ? segment : { ...segment, doorMode: mode }
	})
}

export function tileEdgeKey(row: number, col: number, side: BorderSide): string {
  return `${row},${col},${side}`
}

interface SegmentRun {
	horizontal: boolean
	fixed: number
	door: boolean
	doorMode: DoorMode | undefined
	pieces: { lo: number; hi: number }[]
}

function segmentRunKey(segment: WallSegment, includeMode: boolean): string {
	const horizontal = segment.y1 === segment.y2
	const fixed = horizontal ? segment.y1 : segment.x1
	const mode = includeMode ? (segment.doorMode ?? '') : ''
	return `${horizontal ? 'h' : 'v'}:${fixed}:${segment.door === true}:${mode}`
}

export function mergeCollinearWallSegments(segments: readonly WallSegment[]): WallSegment[] {
	const runs = new Map<string, SegmentRun>()
	for (const segment of segments) {
		const horizontal = segment.y1 === segment.y2
		const fixed = horizontal ? segment.y1 : segment.x1
		const lo = Math.min(horizontal ? segment.x1 : segment.y1, horizontal ? segment.x2 : segment.y2)
		const hi = Math.max(horizontal ? segment.x1 : segment.y1, horizontal ? segment.x2 : segment.y2)
		const key = segmentRunKey(segment, true)
		const run = runs.get(key) ?? { horizontal, fixed, door: segment.door === true, doorMode: segment.doorMode, pieces: [] }
		run.pieces.push({ lo, hi })
		runs.set(key, run)
	}
	const out: WallSegment[] = []
	for (const run of runs.values()) {
		run.pieces.sort((a, b) => a.lo - b.lo)
		let start = run.pieces[0]!.lo
		let end = run.pieces[0]!.hi
		const flush = () => {
			const segment: WallSegment = run.horizontal
				? { x1: start, y1: run.fixed, x2: end, y2: run.fixed }
				: { x1: run.fixed, y1: start, x2: run.fixed, y2: end }
			if (run.door) {
				segment.door = true
				if (run.doorMode !== undefined) segment.doorMode = run.doorMode
			}
			out.push(segment)
		}
		for (let i = 1; i < run.pieces.length; i++) {
			const piece = run.pieces[i]!
			if (piece.lo <= end) {
				end = Math.max(end, piece.hi)
				continue
			}
			flush()
			start = piece.lo
			end = piece.hi
		}
		flush()
	}
	return out
}

export function doorRunBounds(
	segments: readonly WallSegment[],
	anchor: WallSegment,
): { horizontal: boolean; fixed: number; lo: number; hi: number } | null {
	if (anchor.door !== true) return null
	const horizontal = anchor.y1 === anchor.y2
	const fixed = horizontal ? anchor.y1 : anchor.x1
	let lo = Math.min(horizontal ? anchor.x1 : anchor.y1, horizontal ? anchor.x2 : anchor.y2)
	let hi = Math.max(horizontal ? anchor.x1 : anchor.y1, horizontal ? anchor.x2 : anchor.y2)
	const intervals: { lo: number; hi: number }[] = []
	for (const segment of segments) {
		if (segment.door !== true) continue
		const segmentHorizontal = segment.y1 === segment.y2
		if (segmentHorizontal !== horizontal) continue
		if ((segmentHorizontal ? segment.y1 : segment.x1) !== fixed) continue
		intervals.push({
			lo: Math.min(segmentHorizontal ? segment.x1 : segment.y1, segmentHorizontal ? segment.x2 : segment.y2),
			hi: Math.max(segmentHorizontal ? segment.x1 : segment.y1, segmentHorizontal ? segment.x2 : segment.y2),
		})
	}
	let changed = true
	while (changed) {
		changed = false
		for (const interval of intervals) {
			if (interval.lo <= hi && interval.hi >= lo) {
				const nextLo = Math.min(lo, interval.lo)
				const nextHi = Math.max(hi, interval.hi)
				if (nextLo !== lo || nextHi !== hi) {
					lo = nextLo
					hi = nextHi
					changed = true
				}
			}
		}
	}
	return { horizontal, fixed, lo, hi }
}

export interface DoorRun {
	horizontal: boolean
	fixed: number
	lo: number
	hi: number
	anchor: WallSegment
	count: number
}

function segmentBounds(segment: WallSegment, horizontal: boolean): { lo: number; hi: number; fixed: number } {
	const fixed = horizontal ? segment.y1 : segment.x1
	return {
		fixed,
		lo: Math.min(horizontal ? segment.x1 : segment.y1, horizontal ? segment.x2 : segment.y2),
		hi: Math.max(horizontal ? segment.x1 : segment.y1, horizontal ? segment.x2 : segment.y2),
	}
}

function segmentInBounds(segment: WallSegment, bounds: { horizontal: boolean; fixed: number; lo: number; hi: number }): boolean {
	const horizontal = segment.y1 === segment.y2
	if (horizontal !== bounds.horizontal) return false
	if ((horizontal ? segment.y1 : segment.x1) !== bounds.fixed) return false
	const { lo, hi } = segmentBounds(segment, horizontal)
	return lo >= bounds.lo && hi <= bounds.hi
}

export function doorRuns(segments: readonly WallSegment[]): DoorRun[] {
	const runs: DoorRun[] = []
	const consumed = new Set<WallSegment>()
	for (const segment of segments) {
		if (segment.door !== true || consumed.has(segment)) continue
		const bounds = doorRunBounds(segments, segment)
		if (!bounds) continue
		let count = 0
		for (const piece of segments) {
			if (piece.door !== true || consumed.has(piece)) continue
			if (!segmentInBounds(piece, bounds)) continue
			consumed.add(piece)
			count++
		}
		runs.push({ ...bounds, anchor: segment, count })
	}
	return runs
}

export function withoutDoorRun(segments: readonly WallSegment[], anchor: WallSegment): WallSegment[] {
	const bounds = doorRunBounds(segments, anchor)
	if (!bounds) return [...segments]
	return segments.filter(segment => segment.door !== true || !segmentInBounds(segment, bounds))
}

export function doorRunLabel(run: Pick<DoorRun, 'horizontal' | 'fixed' | 'lo' | 'hi'>): string {
	return run.horizontal
		? `${run.lo},${run.fixed} -> ${run.hi},${run.fixed}`
		: `${run.fixed},${run.lo} -> ${run.fixed},${run.hi}`
}

export function withDoorRunMode(
	segments: readonly WallSegment[],
	anchor: WallSegment,
	mode: DoorMode | undefined,
): WallSegment[] {
	const bounds = doorRunBounds(segments, anchor)
	if (!bounds) return [...segments]
	return segments.map(segment => {
		if (segment.door !== true || !segmentInBounds(segment, bounds)) return segment
		const next = { ...segment }
		if (mode !== undefined) next.doorMode = mode
		else delete next.doorMode
		return next
	})
}

export function mirrorTileEdge(
  row: number,
  col: number,
  side: BorderSide,
): { r: number; c: number; side: BorderSide } {
  if (side === 'top') return { r: row - 1, c: col, side: 'bottom' }
  if (side === 'bottom') return { r: row + 1, c: col, side: 'top' }
  if (side === 'left') return { r: row, c: col - 1, side: 'right' }
  return { r: row, c: col + 1, side: 'left' }
}

export function doorKeyForSide(side: BorderSide): 'doorTop' | 'doorRight' | 'doorBottom' | 'doorLeft' {
  return `door${side.charAt(0).toUpperCase() + side.slice(1)}` as 'doorTop' | 'doorRight' | 'doorBottom' | 'doorLeft'
}

export function segmentCoversTileEdge(
  segment: Pick<WallSegment, 'x1' | 'y1' | 'x2' | 'y2'>,
  row: number,
  col: number,
  side: BorderSide,
): boolean {
  if (segment.y1 === segment.y2) {
    const start = Math.round(Math.min(segment.x1, segment.x2))
    const end = Math.max(start + 1, Math.round(Math.max(segment.x1, segment.x2)))
    if (side === 'top') return Math.round(segment.y1) === row && col >= start && col < end
    if (side === 'bottom') return Math.round(segment.y1) === row + 1 && col >= start && col < end
    return false
  }
  if (segment.x1 === segment.x2) {
    const start = Math.round(Math.min(segment.y1, segment.y2))
    const end = Math.max(start + 1, Math.round(Math.max(segment.y1, segment.y2)))
    if (side === 'left') return Math.round(segment.x1) === col && row >= start && row < end
    if (side === 'right') return Math.round(segment.x1) === col + 1 && row >= start && row < end
    return false
  }
  return false
}
