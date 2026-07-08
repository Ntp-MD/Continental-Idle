import type { AssetDef } from './types'
import { SEED_ASSETS } from './assets-property'

export type SvgRole = 'wall' | 'door' | 'fixture'

export interface SvgRoleInfo {
  role: SvgRole
  tag: string
  attrs: Record<string, string>
}

export function findAsset(assets: AssetDef[], type: string): AssetDef | undefined {
  return assets.find(a => a.id === type)
}

export function findAssetCached(assetMap: Map<string, AssetDef>, type: string): AssetDef | undefined {
  return assetMap.get(type)
}

export function buildAssetMap(customAssets: AssetDef[]): Map<string, AssetDef> {
  return new Map<string, AssetDef>(
    [...SEED_ASSETS, ...customAssets].map(a => [a.id, a])
  )
}

export function parseSvgRoles(svgString: string): SvgRoleInfo[] {
  if (!svgString) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${svgString}</svg>`,
    'image/svg+xml',
  )
  const parserError = doc.querySelector('parsererror')
  if (parserError) return []
  const results: SvgRoleInfo[] = []
  for (const el of Array.from(doc.documentElement.querySelectorAll('*'))) {
    const role = el.getAttribute('data-role')
    if (role === 'wall' || role === 'door' || role === 'fixture') {
      const attrs: Record<string, string> = {}
      for (const attr of Array.from(el.attributes)) {
        if (attr.name !== 'data-role') attrs[attr.name] = attr.value
      }
      results.push({ role, tag: el.tagName.toLowerCase(), attrs })
    }
  }
  return results
}
