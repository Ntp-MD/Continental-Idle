import type { AssetDef } from './types'

export function findAsset(assets: AssetDef[], type: string): AssetDef | undefined {
  return assets.find(a => a.id === type)
}

export function findAssetCached(assetMap: Map<string, AssetDef>, type: string): AssetDef | undefined {
  return assetMap.get(type)
}

export function buildAssetMap(customAssets: AssetDef[]): Map<string, AssetDef> {
  return new Map<string, AssetDef>(customAssets.map(a => [a.id, a]))
}
