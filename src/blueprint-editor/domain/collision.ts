import type { ObjectData, AssetDef, Rect } from './types'
import { findAssetCached } from '../assets/assetUtils'

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

export function objectOverlapsAny(
	objects: ObjectData[],
	assetMap: Map<string, AssetDef>,
	rect: Rect,
	excludeId?: string | string[],
): boolean {
	const excluded = Array.isArray(excludeId) ? new Set(excludeId) : excludeId ? new Set([excludeId]) : null
	return objects.some(o => {
		if (excluded && excluded.has(o.id)) return false
		if (o.isWall) return false
		const asset = findAssetCached(assetMap, o.type)
		if (asset?.svg) return false
		return aabbOverlap(rect, o)
	})
}

export function recalcCollapsed(
	floor: { objects: ObjectData[] },
	assetMap: Map<string, AssetDef>,
	changedRect?: Rect,
): void {
	const objCount = floor.objects.length
	if (objCount <= 1) {
		if (objCount === 1) floor.objects[0].collapsed = false
		return
	}
	function getAsset(type: string): AssetDef | undefined {
		return findAssetCached(assetMap, type)
	}
	const candidates = changedRect
		? floor.objects.filter(o => aabbOverlap(o, changedRect))
		: floor.objects
	for (const obj of candidates) {
		if (obj.isWall) { obj.collapsed = false; continue }
		const asset = getAsset(obj.type)
		if (asset?.svg) { obj.collapsed = false; continue }
		obj.collapsed = floor.objects.some(o => {
			if (o.id === obj.id || o.isWall) return false
			if (!aabbOverlap(obj, o)) return false
			const oAsset = getAsset(o.type)
			if (oAsset?.svg) return false
			return true
		})
	}
}
