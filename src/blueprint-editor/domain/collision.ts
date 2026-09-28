import type { ObjectData, AssetDef, Rect, FloorWalkable } from './types'
import { findAssetCached, assetIsSvg, assetIsStructural } from '../assets/assetUtils'

export function aabbOverlap(a: Rect, b: Rect): boolean {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function unionRects(rects: Rect[]): Rect | null {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
	for (const r of rects) {
		if (!Number.isFinite(r.x) || !Number.isFinite(r.y) || !Number.isFinite(r.w) || !Number.isFinite(r.h)) continue
		minX = Math.min(minX, r.x)
		minY = Math.min(minY, r.y)
		maxX = Math.max(maxX, r.x + r.w)
		maxY = Math.max(maxY, r.y + r.h)
	}
	if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null
	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// A wall or a door is geometry, so it never shares space. Decorative SVG art keeps the
// standing exemption, and the exemption belongs to the side that is already on the floor:
// a new object may land on existing art, but art is a real footprint while it is being
// placed, so it may not land on a body - and `recalcCollapsed` would never flag it if it did.
export function placementCollides(
	moving: AssetDef | undefined | null,
	placed: AssetDef | undefined | null,
): boolean {
	if (assetIsStructural(moving) || assetIsStructural(placed)) return true
	return !assetIsSvg(placed)
}

export function objectOverlapsAny(
	objects: ObjectData[],
	assetMap: Map<string, AssetDef>,
	rect: Rect,
	excludeId?: string | string[],
	movingAsset?: AssetDef | null,
): boolean {
	const excluded = Array.isArray(excludeId) ? new Set(excludeId) : excludeId ? new Set([excludeId]) : null
	return objects.some(o => {
		if (excluded && excluded.has(o.id)) return false
		if (!placementCollides(movingAsset, findAssetCached(assetMap, o.type))) return false
		return aabbOverlap(rect, o)
	})
}

// `collapsed` is the canvas's only persistent clash state, so it carries both halves of
// the rule: another object's body, and painted wall or door cells under the object.
export function recalcCollapsed(
	floor: { objects: ObjectData[]; walkable?: FloorWalkable },
	assetMap: Map<string, AssetDef>,
	tileSize: number,
	changedRect?: Rect,
): void {
	const objCount = floor.objects.length
	if (objCount === 0) return
	function getAsset(type: string): AssetDef | undefined {
		return findAssetCached(assetMap, type)
	}
	const buried = (o: ObjectData) => rectHitsStructure(floor, o, tileSize)
	if (objCount === 1) {
		floor.objects[0].collapsed = buried(floor.objects[0])
		return
	}
	const candidates = changedRect
		? floor.objects.filter(o => aabbOverlap(o, changedRect))
		: floor.objects
	for (const obj of candidates) {
		if (buried(obj)) { obj.collapsed = true; continue }
		const asset = getAsset(obj.type)
		if (!assetIsStructural(asset) && assetIsSvg(asset)) { obj.collapsed = false; continue }
		obj.collapsed = floor.objects.some(o => {
			if (o.id === obj.id) return false
			if (!aabbOverlap(obj, o)) return false
			return placementCollides(asset, getAsset(o.type))
		})
	}
}

// Painted wall and door cells are geometry, so no object may cover them. A floor with no
// painted walkable data has no authored geometry to respect yet, and cells outside the
// painted region stay open floor.
export function rectHitsStructure(
	floor: { walkable?: FloorWalkable } | undefined,
	rect: Rect,
	tileSize: number,
): boolean {
	const painted = floor?.walkable
	if (!painted || tileSize <= 0) return false
	const { tileStates, walkableGrid } = painted
	if (!tileStates?.length && !walkableGrid?.length) return false
	const firstCol = Math.floor(rect.x / tileSize)
	const lastCol = Math.ceil((rect.x + rect.w) / tileSize) - 1
	const firstRow = Math.floor(rect.y / tileSize)
	const lastRow = Math.ceil((rect.y + rect.h) / tileSize) - 1
	for (let row = Math.max(0, firstRow); row <= lastRow; row++) {
		for (let col = Math.max(0, firstCol); col <= lastCol; col++) {
			const state = tileStates?.[row]?.[col]
			if (state ? state !== 'walkable' : walkableGrid?.[row]?.[col] === false) return true
		}
	}
	return false
}
