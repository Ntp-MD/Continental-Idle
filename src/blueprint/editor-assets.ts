import type { AssetDef } from './editor-types'

export const BUILTIN_ASSETS: AssetDef[] = [
  { id: 'elevator', name: 'Elevator', category: 'Core', w: 2, h: 2, shape: 'rect' },
  { id: 'column', name: 'Column', category: 'Core', w: 1, h: 1, shape: 'rect' },
  // Door Standard: 1×1 tile, arc shape, swings inward into room. rotation=0: leaf at top, swings down. rotation=90: leaf at left, swings right. rotation=180: leaf at bottom, swings up. rotation=270: leaf at right, swings left. Placed at room-corridor wall boundary.
  { id: 'door-standard', name: 'Door Standard', category: 'Door', w: 1, h: 1, shape: 'arc' },
  // Door Sliding: 2×1 tiles, rect shape, slides horizontally. Used for closets, bathroom partitions, narrow passages.
  { id: 'door-sliding', name: 'Door Sliding', category: 'Door', w: 2, h: 1, shape: 'rect' },
  // Door Lobby: 4×1 tiles, rect shape, double-wide opening. Used for lobby entrances and large public openings.
  { id: 'door-lobby', name: 'Door Lobby', category: 'Door', w: 4, h: 1, shape: 'rect' },

  { id: 'bed', name: 'Bed', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'nightstand', name: 'Nightstand', category: 'Furniture', w: 1, h: 1, shape: 'rect' },
  { id: 'desk', name: 'Desk', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'chair', name: 'Chair', category: 'Furniture', w: 1, h: 1, shape: 'rect' },
  { id: 'sofa', name: 'Sofa', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'table-chairs', name: 'Table + Chairs', category: 'Furniture', w: 2, h: 2, shape: 'rect' },
  { id: 'plant', name: 'Plant', category: 'Furniture', w: 1, h: 1, shape: 'circle' },

  { id: 'reception-counter', name: 'Reception Counter', category: 'Furniture', w: 8, h: 1, shape: 'rect' },
  { id: 'concierge-desk', name: 'Concierge Desk', category: 'Furniture', w: 4, h: 1, shape: 'rect' },
  { id: 'luggage-rack', name: 'Luggage Rack', category: 'Furniture', w: 2, h: 1, shape: 'rect' },
  { id: 'bar-counter', name: 'Bar Counter', category: 'Furniture', w: 12, h: 1, shape: 'rect' },
  { id: 'bar-stool', name: 'Bar Stool', category: 'Furniture', w: 1, h: 1, shape: 'circle' },

  { id: 'kitchen-stove', name: 'Kitchen Stove', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'prep-station', name: 'Prep Station', category: 'Furniture', w: 2, h: 1, shape: 'rect' },
  { id: 'storage-shelf', name: 'Storage Shelf', category: 'Furniture', w: 1, h: 2, shape: 'rect' },

  { id: 'wardrobe', name: 'Wardrobe', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'minibar', name: 'Minibar', category: 'Furniture', w: 1, h: 1, shape: 'rect' },
  { id: 'tv-stand', name: 'TV Stand', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'bathtub', name: 'Bathtub', category: 'Furniture', w: 1, h: 2, shape: 'round' },

  { id: 'weapon-rack', name: 'Weapon Rack', category: 'Furniture', w: 2, h: 1, shape: 'rect' },
  { id: 'control-desk', name: 'Control Desk', category: 'Furniture', w: 4, h: 1, shape: 'rect' },
  { id: 'server-rack', name: 'Server Rack', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'filing-cabinet', name: 'Filing Cabinet', category: 'Furniture', w: 1, h: 1, shape: 'rect' },

  { id: 'trash-bin', name: 'Trash Bin', category: 'Furniture', w: 1, h: 1, shape: 'circle' },
  { id: 'helipad', name: 'Helipad Marker', category: 'Furniture', w: 4, h: 4, shape: 'circle' },
  { id: 'dining-table-round', name: 'Dining Table Round', category: 'Furniture', w: 2, h: 2, shape: 'circle' },
]

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
