import assert from 'node:assert/strict'
import { applyWallSegment } from '../src/blueprint-editor/composables/useWallPaint'
import { wallRunsFromEdges, deriveRoomFromSegments } from '../src/blueprint-editor/roomConvert'
import { buildNpcEngineLayout } from '../src/engine/npc/layoutBuild'
import type { AssetDef, FloorData, TileEdges } from '../src/blueprint-editor/types'

const T = 25

function grid(rows: number, cols: number): TileEdges[][] {
	return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({}) as TileEdges))
}

// ── wallRunsFromEdges dedupes mirror sides ──
{
	const edges = grid(4, 4)
	applyWallSegment(edges, { x1: 0, y1: T, x2: T * 2, y2: T }, T, true)
	const runs = wallRunsFromEdges(edges, T)
	assert.equal(runs.length, 2, 'one run per tile, mirrors deduped')
	assert.deepEqual(
		runs.map(r => [r.x1, r.y1, r.x2, r.y2]).sort(),
		[[0, T, T, T], [T, T, T * 2, T]],
	)
}

// ── deriveRoomFromSegments builds local edges with preserved door ──
{
	const segments = [
		{ x1: 100, y1: 100, x2: 300, y2: 100 },
		{ x1: 100, y1: 100, x2: 100, y2: 200 },
		{ x1: 300, y1: 100, x2: 300, y2: 200 },
		{ x1: 100, y1: 200, x2: 175, y2: 200 },
		{ x1: 225, y1: 200, x2: 300, y2: 200 },
	]
	const room = deriveRoomFromSegments(segments, T)!
	assert.ok(room)
	assert.equal(room.x, 100)
	assert.equal(room.y, 100)
	assert.equal(room.widthTiles, 8)
	assert.equal(room.heightTiles, 4)

	const e = room.tileEdges
	assert.equal(e[0][0].top, true, 'top wall')
	assert.equal(e[0][0].left, true, 'left wall')
	assert.equal(e[3][7].right, true, 'right wall clipped mirror lands on inner cell')
	assert.equal(e[3][7].bottom, true, 'bottom wall clipped mirror lands on inner cell')
	assert.equal(e[3][6].right ?? undefined, undefined)
	assert.equal(e[3][3].top, undefined, 'door gap stays open')
	assert.equal(e[3][3].bottom, undefined, 'door gap stays open')
	assert.equal(e[3][4].top, undefined, 'door gap stays open')
	assert.equal(e[3][1].bottom, true, 'bottom wall left of door (clipped to inner side)')

	const runs = wallRunsFromEdges(room.tileEdges, T)
	assert.ok(runs.length >= 4, 'derived room renders its own runs')
}

// ── invalid input ──
assert.equal(deriveRoomFromSegments([], T), null, 'no segments')
assert.equal(deriveRoomFromSegments([{ x1: 10, y1: 0, x2: 50, y2: 0 }], T), null, 'unaligned segment rejected')
assert.equal(deriveRoomFromSegments([{ x1: 25, y1: 25, x2: 25, y2: 25 }], T), null, 'zero-size rejected')

// ── engine: converted room blocks perimeter, passes door ──
{
	const segments = [
		{ x1: 100, y1: 100, x2: 300, y2: 100 },
		{ x1: 100, y1: 100, x2: 100, y2: 200 },
		{ x1: 300, y1: 100, x2: 300, y2: 200 },
		{ x1: 100, y1: 200, x2: 175, y2: 200 },
		{ x1: 225, y1: 200, x2: 300, y2: 200 },
	]
	const room = deriveRoomFromSegments(segments, T)!
	const tileStates = room.tileEdges.map(row => row.map(() => 'walkable' as const))
	const asset: AssetDef = {
		id: 'a-room',
		name: 'Room',
		w: room.widthTiles,
		h: room.heightTiles,
		walkable: false,
		tileEdges: room.tileEdges,
		tileStates,
	} as AssetDef
	const floor: FloorData = {
		id: 'f1',
		name: 'F',
		label: 'G',
		defaultWalkable: true,
		objects: [{ id: 'o-room', type: 'a-room', x: 100, y: 100, w: 200, h: 100, rotation: 0 }],
	}
	const defMap = new Map([[asset.id, asset]])
	const { layout, floorMaps } = buildNpcEngineLayout(
		[floor],
		{ w: 500, h: 400, tileSize: T },
		type => defMap.get(type),
	)
	const engineFloor = layout.floors[0]!
	const map = floorMaps.get('f1')!
	const blocked = new Set(engineFloor.blockedEdges.map(x => `${x.from.x},${x.from.y}>${x.to.x},${x.to.y}`))

	for (let c = 4; c < 12; c++) {
		if (c === 7 || c === 8) continue
		assert.ok(blocked.has(`${c},7>${c},8`) || blocked.has(`${c},8>${c},7`), `perimeter blocks col ${c}`)
	}
	assert.ok(!blocked.has('7,7>7,8') && !blocked.has('8,7>8,8'), 'door passable')
	assert.ok(blocked.has('3,5>4,5') || blocked.has('4,5>3,5'), 'left wall blocks interior pair')

	const reachable = bfs('6,9', map, blocked)
	assert.ok(reachable.has('6,6'), 'npc enters room through door to interior')
	assert.ok(reachable.has('10,5'), 'interior fully reachable')

	function bfs(startKey: string, m: typeof map, blockedSet: Set<string>): Set<string> {
		const seen = new Set([startKey])
		const queue = [startKey]
		while (queue.length) {
			const cur = queue.shift()!
			const [x, y] = cur.split(',').map(Number)
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
				const nx = x + dx
				const ny = y + dy
				const key = `${nx},${ny}`
				if (!m.tiles.has(key) || seen.has(key)) continue
				if (blockedSet.has(`${x},${y}>${nx},${ny}`) || blockedSet.has(`${nx},${ny}>${x},${y}`)) continue
				seen.add(key)
				queue.push(key)
			}
		}
		return seen
	}
}

console.log('Room conversion checks passed')
