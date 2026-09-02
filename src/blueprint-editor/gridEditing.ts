import type { WallSegment } from './types'

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

export function segmentHasDoor(segment: WallSegment, edges: TileEdges[][]): boolean {
  if (segment.y1 === segment.y2) {
    const boundary = Math.round(segment.y1)
    const start = Math.round(Math.min(segment.x1, segment.x2))
    const end = Math.round(Math.max(segment.x1, segment.x2))
    for (let col = start; col < end; col++) {
      if (edges[boundary]?.[col]?.doorTop) return true
      if (edges[boundary - 1]?.[col]?.doorBottom) return true
    }
    return false
  }
  const boundary = Math.round(segment.x1)
  const start = Math.round(Math.min(segment.y1, segment.y2))
  const end = Math.round(Math.max(segment.y1, segment.y2))
  for (let row = start; row < end; row++) {
    if (edges[row]?.[boundary]?.doorLeft) return true
    if (edges[row]?.[boundary - 1]?.doorRight) return true
  }
  return false
}
