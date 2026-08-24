import type { AssetDef, ObjectData, ObjectPlacement, ResolvedObject, Rotation, Rect } from './types'
import { resolveObjectDef, STREET_TILES } from './types'
import { findAsset, findAssetCached } from './assetUtils'

export function assetSizeFor(
	type: string,
	rotation: Rotation,
	tileSize: number,
	assetLookup: AssetDef[] | Map<string, AssetDef>,
): { w: number; h: number } | null {
	const asset = Array.isArray(assetLookup)
		? findAsset(assetLookup, type)
		: findAssetCached(assetLookup, type)
	if (!asset) return null
	const aw = asset.usePx ? (asset.pxW ?? asset.w * tileSize) : asset.w * tileSize
	const ah = asset.usePx ? (asset.pxH ?? asset.h * tileSize) : asset.h * tileSize
	const swap = rotation === 90 || rotation === 270
	return swap ? { w: ah, h: aw } : { w: aw, h: ah }
}

export function normalizeObject(
	o: ObjectData,
	tileSize: number,
	assetLookup: AssetDef[] | Map<string, AssetDef>,
): void {
	o.x = Math.round(o.x / tileSize) * tileSize
	o.y = Math.round(o.y / tileSize) * tileSize
	const asset = Array.isArray(assetLookup)
		? findAsset(assetLookup, o.type)
		: findAssetCached(assetLookup, o.type)
	const resolved = resolvePlacedObject({
		id: o.id,
		type: o.type,
		x: o.x,
		y: o.y,
		rotation: o.rotation,
		subId: o.subId,
		linkGroupId: o.linkGroupId,
		locked: o.locked,
		instanceLabel: o.instanceLabel,
	}, asset, tileSize)
	if (!resolved) return
	o.w = resolved.w
	o.h = resolved.h
	o.radius = resolved.radius
	o.labelPadding = resolved.labelPadding
	o.instanceLabel = resolved.instanceLabel
	o.locked = resolved.locked
	o.padding = resolved.padding
	o.rx = resolved.rx
	o.fillColor = resolved.fillColor
	o.isWall = resolved.isWall
}

export function resolvePlacedObject(
	placement: ObjectPlacement,
	asset: AssetDef | undefined,
	tileSize: number,
): ResolvedObject | undefined {
	if (!asset) return undefined
	const size = assetSizeFor(placement.type, placement.rotation, tileSize, [asset])
	if (!size) return undefined
	const definition = resolveObjectDef(placement.rotation, asset, size)
	return {
		...placement,
		w: size.w,
		h: size.h,
		label: asset.defaultLabel,
		radius: asset.defaultRadius,
		labelPadding: asset.defaultLabelPadding,
		padding: asset.defaultPadding,
		rx: asset.defaultRx ? { ...asset.defaultRx } : undefined,
		fillColor: placement.fillColor ?? asset.defaultBgColor,
		strokeColor: placement.strokeColor,
		isWall: asset.isWall,
		locked: placement.locked ?? asset.defaultLocked,
		instanceLabel: placement.instanceLabel ?? asset.defaultInstanceLabel,
		walkable: definition.walkable,
		entranceRequired: definition.entranceRequired,
		walkableGrid: definition.walkableGrid,
		tileStates: definition.tileStates,
		tileEdges: definition.tileEdges,
		interactSpots: definition.interactSpots,
		interact: definition.interact,
	}
}

export function svgTransform(obj: ObjectData, asset: AssetDef | undefined): string {
	const vb = asset?.svgViewBox ? asset.svgViewBox : { w: 50, h: 25 }
	const rot = obj.rotation || 0
	if (rot === 0) {
		return `translate(${obj.x}, ${obj.y}) scale(${obj.w / vb.w}, ${obj.h / vb.h})`
	} else if (rot === 90) {
		return `translate(${obj.x + obj.w}, ${obj.y}) rotate(90) scale(${obj.h / vb.w}, ${obj.w / vb.h})`
	} else if (rot === 180) {
		return `translate(${obj.x + obj.w}, ${obj.y + obj.h}) rotate(180) scale(${obj.w / vb.w}, ${obj.h / vb.h})`
	} else {
		return `translate(${obj.x}, ${obj.y + obj.h}) rotate(270) scale(${obj.h / vb.w}, ${obj.w / vb.h})`
	}
}

export function roundedRectPath(
	x: number,
	y: number,
	w: number,
	h: number,
	rx?: { tl: number; tr: number; br: number; bl: number },
): string | null {
	if (!rx) return null
	const { tl, tr, br, bl } = rx
	if (tl === 0 && tr === 0 && br === 0 && bl === 0) return null
	const maxR = Math.min(w, h) / 2
	const r = (v: number) => Math.max(0, Math.min(v, maxR))
	const rtl = r(tl), rtr = r(tr), rbr = r(br), rbl = r(bl)
	return [
		`M ${x + rtl} ${y}`,
		`L ${x + w - rtr} ${y}`,
		rtr > 0 ? `A ${rtr} ${rtr} 0 0 1 ${x + w} ${y + rtr}` : '',
		`L ${x + w} ${y + h - rbr}`,
		rbr > 0 ? `A ${rbr} ${rbr} 0 0 1 ${x + w - rbr} ${y + h}` : '',
		`L ${x + rbl} ${y + h}`,
		rbl > 0 ? `A ${rbl} ${rbl} 0 0 1 ${x} ${y + h - rbl}` : '',
		`L ${x} ${y + rtl}`,
		rtl > 0 ? `A ${rtl} ${rtl} 0 0 1 ${x + rtl} ${y}` : '',
		'Z',
	].filter(Boolean).join(' ')
}

export function snap(value: number, tileSize: number): number {
	if (tileSize <= 0) return value
	const snapped = Math.round(value / tileSize) * tileSize
	if (value > 0 && snapped < tileSize) return tileSize
	return snapped
}

export function clamp(rect: Rect, maxWidth: number, maxHeight: number, minX = 0, minY = 0): Rect {
	let { x, y, w, h } = rect
	w = Math.min(w, maxWidth - minX)
	h = Math.min(h, maxHeight - minY)
	x = Math.max(minX, Math.min(x, maxWidth - w))
	y = Math.max(minY, Math.min(y, maxHeight - h))
	return { x, y, w, h }
}

export function buildingArea(width: number, height: number, tileSize: number, streetTiles: number = STREET_TILES): Rect {
	const inset = streetTiles * tileSize
	return { x: inset, y: inset, w: Math.max(0, width - inset * 2), h: Math.max(0, height - inset * 2) }
}
