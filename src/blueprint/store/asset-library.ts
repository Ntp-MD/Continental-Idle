import type { AssetDef, SimpleAsset, SvgAsset } from '../types'
import { aabbOverlap } from '../utils'
import {
  state, toast, genId, clamp, invalidateAssetMap, withStateLock,
} from './state'
import { pushHistory } from './history'
import { saveLayout } from './persistence'

export async function addCustomAsset(name: string, w: number, h: number, category?: string, pxW?: number, pxH?: number, defaultRx?: { tl: number; tr: number; br: number; bl: number }, defaultBgColor?: string): Promise<AssetDef> {
  return withStateLock(async () => {
    const safeW = Math.max(1, Math.floor(w))
  const safeH = Math.max(1, Math.floor(h))
  const safeCat = (category && category.trim()) || 'Misc'
  const asset: SimpleAsset = { kind: 'simple', id: genId('custom'), name, category: safeCat, w: safeW, h: safeH, custom: true }
  if (pxW !== undefined && pxW > 0) asset.pxW = Math.floor(pxW)
  if (pxH !== undefined && pxH > 0) asset.pxH = Math.floor(pxH)
  if (defaultRx && (defaultRx.tl > 0 || defaultRx.tr > 0 || defaultRx.br > 0 || defaultRx.bl > 0)) asset.defaultRx = defaultRx
  if (defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(defaultBgColor)) asset.defaultBgColor = defaultBgColor
  pushHistory()
  state.layout.customAssets.push(asset)
  invalidateAssetMap()
  await saveLayout()
  return asset
  })
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?\/?>/gi, '')
}

export async function addSvgAsset(name: string, w: number, h: number, svgString: string, category?: string): Promise<AssetDef | null> {
  return withStateLock(async () => {
    const safeW = Math.max(1, Math.floor(w))
    const safeH = Math.max(1, Math.floor(h))
  const safeCat = (category && category.trim()) || 'Special'
  const trimmed = svgString.trim()
  if (!trimmed) { toast.warning('SVG content cannot be empty'); return null }
  const viewBoxMatch = trimmed.match(/viewBox\s*=\s*["']([^"']+)["']/)
  if (!viewBoxMatch) { toast.warning('SVG must have a viewBox attribute'); return null }
  const parts = viewBoxMatch[1].split(/[\s,]+/).map(Number)
  if (parts.length < 4 || parts.some(isNaN)) { toast.warning('Invalid viewBox format'); return null }
  const vbW = parts[2]
  const vbH = parts[3]
  if (vbW <= 0 || vbH <= 0) { toast.warning('Invalid viewBox dimensions'); return null }
  const innerMatch = trimmed.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  const rawSvg = innerMatch ? innerMatch[1].trim() : trimmed
  const innerSvg = sanitizeSvg(rawSvg)
  const asset: SvgAsset = {
    kind: 'svg',
    id: genId('custom'), name, category: safeCat,
    w: safeW, h: safeH, custom: true,
    svg: innerSvg,
    svgViewBox: { w: vbW, h: vbH },
  }
  pushHistory()
  state.layout.customAssets.push(asset)
  invalidateAssetMap()
  await saveLayout()
  return asset
  })
}

export async function updateCustomAsset(id: string, patch: Partial<Pick<SimpleAsset, 'name' | 'w' | 'h' | 'category' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultRx' | 'defaultBgColor'>>): Promise<void> {
  let asset = state.layout.customAssets.find(a => a.id === id)
  if (!asset) return
  pushHistory()
  if (patch.name !== undefined) asset.name = patch.name
  if (patch.w !== undefined) asset.w = Math.max(1, Math.floor(patch.w))
  if (patch.h !== undefined) asset.h = Math.max(1, Math.floor(patch.h))
  if (patch.category !== undefined) asset.category = patch.category
  if (asset.kind === 'simple') {
    if (patch.usePx !== undefined) asset.usePx = patch.usePx
    if (patch.pxW !== undefined) asset.pxW = patch.pxW > 0 ? Math.floor(patch.pxW) : undefined
    if (patch.pxH !== undefined) asset.pxH = patch.pxH > 0 ? Math.floor(patch.pxH) : undefined
  }
  if (patch.defaultPadding !== undefined) asset.defaultPadding = patch.defaultPadding > 0 ? patch.defaultPadding : undefined
  if (patch.defaultRx !== undefined) {
    const r = patch.defaultRx
    asset.defaultRx = (r.tl > 0 || r.tr > 0 || r.br > 0 || r.bl > 0) ? r : undefined
  }
  if (patch.defaultBgColor !== undefined) {
    asset.defaultBgColor = (patch.defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(patch.defaultBgColor)) ? patch.defaultBgColor : undefined
  }

  const t = state.layout.canvas.tileSize
  const newW = asset.kind === 'simple' && asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
  const newH = asset.kind === 'simple' && asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
  const collapsedIds: string[] = []

  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.type !== id) continue
      obj.w = newW
      obj.h = newH
      const clamped = clamp({ x: obj.x, y: obj.y, w: newW, h: newH })
      obj.x = clamped.x
      obj.y = clamped.y
      if (asset.defaultPadding && asset.defaultPadding > 0) {
        obj.padding = asset.defaultPadding
      } else if (obj.padding !== undefined && patch.defaultPadding !== undefined) {
        obj.padding = undefined
      }
      if (patch.defaultRx !== undefined) {
        obj.rx = asset.defaultRx ? { ...asset.defaultRx } : undefined
      }
      if (patch.defaultBgColor !== undefined) {
        obj.fillColor = asset.defaultBgColor || undefined
      }
      const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
      obj.collapsed = overlaps
      if (overlaps) collapsedIds.push(obj.id)
    }
  }

  if (collapsedIds.length > 0) {
    toast.error(`${collapsedIds.length} object(s) collapsed due to overlap - shown in red`)
  }

  invalidateAssetMap()
}

export async function deleteCustomAsset(id: string): Promise<void> {
  const inUse = state.layout.floors.some(f => f.objects.some(o => o.type === id))
  if (inUse) {
    toast.warning('Cannot delete — asset is placed on floors. Remove instances first.')
    return
  }
  pushHistory()
  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== id)
  invalidateAssetMap()
  if (state.selectedAssetId === id) state.selectedAssetId = null
  await saveLayout()
}

export async function addAssetCategory(name: string): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) {
    toast.warning('Category name cannot be empty')
    return null
  }
  if (state.layout.assetCategories.includes(trimmed)) {
    toast.warning('Category already exists')
    return null
  }
  pushHistory()
  state.layout.assetCategories.push(trimmed)
  await saveLayout()
  return trimmed
}

export async function renameAssetCategory(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) return
  if (state.layout.assetCategories.includes(trimmed)) {
    toast.warning('Category already exists')
    return
  }
  pushHistory()
  const idx = state.layout.assetCategories.indexOf(oldName)
  if (idx >= 0) state.layout.assetCategories[idx] = trimmed
  for (const a of state.layout.customAssets) {
    if (a.category === oldName) a.category = trimmed
  }
  invalidateAssetMap()
  await saveLayout()
}

export async function deleteAssetCategory(name: string): Promise<void> {
  const inUse = state.layout.customAssets.some(a => a.category === name)
  if (inUse) {
    toast.warning('Cannot delete - assets are using this category')
    return
  }
  pushHistory()
  state.layout.assetCategories = state.layout.assetCategories.filter(c => c !== name)
  await saveLayout()
}
