import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildNpcEngineLayout } from '../../src/engine/npc/layoutBuild'
import { normalizeObject } from '../../src/blueprint-editor/domain/geometry'
import type { AssetDef, FloorData } from '../../src/blueprint-editor/domain/types'

// The 21-floor tower is a generated artifact, not hand-held data: scripts/generate-hotel.mjs
// rebuilds it into the working seed with --write. The tower gates below read that generated
// output instead of the working seed, so the contract stays gated while the seed itself is
// free to hold anything - an empty lobby, a floor under construction.

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

export interface GeneratedTower extends HotelModel {
	npcConfig: Record<string, unknown>
}

let generated: GeneratedTower | undefined

export function generatedHotel(): GeneratedTower {
	generated ??= (() => {
		const script = path.resolve('scripts/generate-hotel.mjs')
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'continental-hotel-'))
		const out = path.join(dir, 'hotel.json')
		try {
			execFileSync(process.execPath, [script, `--out=${out}`], { encoding: 'utf8' })
			const file = JSON.parse(fs.readFileSync(out, 'utf8')) as { originAssets: AssetDef[]; layout: RawLayout; npcConfig: Record<string, unknown> }
			return { ...hotelModel(file.layout, file.originAssets), npcConfig: file.npcConfig }
		} finally {
			fs.rmSync(dir, { recursive: true, force: true })
		}
	})()
	return generated
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

export const portalCars = (model: HotelModel, floor: FloorData) =>
	floor.objects.filter(o => (model.assetMap.get(o.type)?.tags ?? []).includes('portal'))

// Reachable tiles a lift car can be entered from: the walkable ring around its footprint.
export function boardingCells(model: HotelModel, floor: FloorData, room: Set<string>): number[] {
	return portalCars(model, floor).map(car => {
		const def = model.assetMap.get(car.type)!
		const w = def.usePx ? Math.round((def.pxW ?? 0) / model.tile) : def.w
		const h = def.usePx ? Math.round((def.pxH ?? 0) / model.tile) : def.h
		const c0 = Math.round(car.x / model.tile)
		const r0 = Math.round(car.y / model.tile)
		let approach = 0
		for (let r = r0 - 1; r <= r0 + h; r++) for (let c = c0 - 1; c <= c0 + w; c++) {
			if (r >= r0 && r < r0 + h && c >= c0 && c < c0 + w) continue
			if (room.has(`${c},${r}`)) approach++
		}
		return approach
	})
}
