import type { AssetDef, ObjectData, Rotation, Rect } from './types'
import { findAsset, findAssetCached } from './asset-utils'

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
  if (o.linkGroupId) {
    o.x = Math.round(o.x / tileSize) * tileSize
    o.y = Math.round(o.y / tileSize) * tileSize
    return
  }
  const sz = assetSizeFor(o.type, o.rotation, tileSize, assetLookup)
  if (sz) {
    o.w = sz.w
    o.h = sz.h
  }
  o.x = Math.round(o.x / tileSize) * tileSize
  o.y = Math.round(o.y / tileSize) * tileSize
  const asset = Array.isArray(assetLookup)
    ? findAsset(assetLookup, o.type)
    : findAssetCached(assetLookup, o.type)
  if (asset?.defaultRx && !o.rx) {
    o.rx = { ...asset.defaultRx }
  }
  if (asset?.walkableGrid) {
    if (!o.walkableGrid && asset.walkableGrid) {
      o.walkableGrid = asset.walkableGrid.map(row => [...row])
    }
    if (!o.tileStates && asset.tileStates) {
      o.tileStates = asset.tileStates.map(row => [...row])
    }
    if (!o.tileEdges && asset.tileEdges) {
      o.tileEdges = asset.tileEdges.map(row => row.map(e => e ? { ...e } : e))
    }
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

export function clamp(rect: Rect, maxWidth: number, maxHeight: number): Rect {
  let { x, y, w, h } = rect
  w = Math.min(w, maxWidth)
  h = Math.min(h, maxHeight)
  x = Math.max(0, Math.min(x, maxWidth - w))
  y = Math.max(0, Math.min(y, maxHeight - h))
  return { x, y, w, h }
}
