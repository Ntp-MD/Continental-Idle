import type { AssetDef } from './types'

export const BUILTIN_ASSETS: AssetDef[] = []

const BUILTIN_ASSET_MAP = new Map<string, AssetDef>(BUILTIN_ASSETS.map(a => [a.id, a]))

export function findAsset(assets: AssetDef[], type: string): AssetDef | undefined {
  return assets.find(a => a.id === type) || BUILTIN_ASSET_MAP.get(type)
}

export function findAssetCached(assetMap: Map<string, AssetDef>, type: string): AssetDef | undefined {
  return assetMap.get(type) ?? BUILTIN_ASSET_MAP.get(type)
}

export function buildAssetMap(customAssets: AssetDef[]): Map<string, AssetDef> {
  const map = new Map<string, AssetDef>(BUILTIN_ASSET_MAP)
  for (const a of customAssets) map.set(a.id, a)
  return map
}
