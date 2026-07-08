import type { AssetDef, ObjectData, Rotation, CompositePart } from './types'
import { findAsset, findAssetCached } from './assets-utils'

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
  const sa = asset.kind === 'simple' ? asset : undefined
  const aw = sa?.usePx ? (sa.pxW ?? asset.w * tileSize) : asset.w * tileSize
  const ah = sa?.usePx ? (sa.pxH ?? asset.h * tileSize) : asset.h * tileSize
  const swap = rotation === 90 || rotation === 270
  return swap ? { w: ah, h: aw } : { w: aw, h: ah }
}

export function normalizeObject(
  o: ObjectData,
  tileSize: number,
  assetLookup: AssetDef[] | Map<string, AssetDef>,
): void {
  if (o.linkedIds && o.linkedIds.length > 0) {
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
}

export function svgTransform(obj: ObjectData, asset: AssetDef | undefined): string {
  const vb = asset?.kind === 'svg' ? asset.svgViewBox : { w: 50, h: 25 }
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

export function compositeOutlinePath(obj: ObjectData, parts: CompositePart[] | undefined): string | null {
  if (!parts || parts.length === 0) return null

  const rects = parts.map(p => {
    const cx = obj.x + p.dx + p.w / 2
    const cy = obj.y + p.dy + p.h / 2
    if (p.rotation === 90 || p.rotation === 270) {
      const nw = p.h, nh = p.w
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh }
    }
    return { x: obj.x + p.dx, y: obj.y + p.dy, w: p.w, h: p.h }
  }).map(r => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }))

  const xsSet = new Set<number>()
  const ysSet = new Set<number>()
  for (const r of rects) { xsSet.add(r.x); xsSet.add(r.x + r.w); ysSet.add(r.y); ysSet.add(r.y + r.h) }
  const sx = [...xsSet].sort((a, b) => a - b)
  const sy = [...ysSet].sort((a, b) => a - b)

  const filled: boolean[][] = []
  for (let i = 0; i < sy.length - 1; i++) {
    filled[i] = []
    for (let j = 0; j < sx.length - 1; j++) {
      const cx = sx[j], cy = sy[i], cw = sx[j + 1] - sx[j], ch = sy[i + 1] - sy[i]
      filled[i][j] = rects.some(r => cx >= r.x && cx + cw <= r.x + r.w && cy >= r.y && cy + ch <= r.y + r.h)
    }
  }

  const segs: string[] = []
  for (let i = 0; i < filled.length; i++) {
    for (let j = 0; j < filled[i].length; j++) {
      if (!filled[i][j]) continue
      const x1 = sx[j], x2 = sx[j + 1], y1 = sy[i], y2 = sy[i + 1]
      if (i === 0 || !filled[i - 1][j]) segs.push(`${x1} ${y1} ${x2} ${y1}`)
      if (i === filled.length - 1 || !filled[i + 1][j]) segs.push(`${x1} ${y2} ${x2} ${y2}`)
      if (j === 0 || !filled[i][j - 1]) segs.push(`${x1} ${y1} ${x1} ${y2}`)
      if (j === filled[i].length - 1 || !filled[i][j + 1]) segs.push(`${x2} ${y1} ${x2} ${y2}`)
    }
  }
  if (segs.length === 0) return null
  return segs.map(s => `M${s.split(' ')[0]} ${s.split(' ')[1]}L${s.split(' ')[2]} ${s.split(' ')[3]}`).join(' ')
}

export function compositePartDetailsPath(obj: ObjectData, parts: CompositePart[] | undefined): string | null {
  if (!parts || parts.length <= 1) return null
  const segs: string[] = []
  for (const p of parts) {
    const cx = obj.x + p.dx + p.w / 2
    const cy = obj.y + p.dy + p.h / 2
    let x = obj.x + p.dx, y = obj.y + p.dy, w = p.w, h = p.h
    if (p.rotation === 90 || p.rotation === 270) {
      x = cx - p.h / 2; y = cy - p.w / 2; w = p.h; h = p.w
    }
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h)
    segs.push(`${x} ${y} ${x + w} ${y}`)
    segs.push(`${x} ${y + h} ${x + w} ${y + h}`)
    segs.push(`${x} ${y} ${x} ${y + h}`)
    segs.push(`${x + w} ${y} ${x + w} ${y + h}`)
  }
  if (segs.length === 0) return null
  return segs.map(s => `M${s.split(' ')[0]} ${s.split(' ')[1]}L${s.split(' ')[2]} ${s.split(' ')[3]}`).join(' ')
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
