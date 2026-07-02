import type { AssetDef } from './editor-types'

export const ASSET_CATEGORIES = ['Structural', 'Furniture', 'Service', 'Kitchen', 'Room', 'Security', 'Misc'] as const

export const BUILTIN_ASSETS: AssetDef[] = [
  { id: 'elevator', name: 'Elevator', category: 'Structural', w: 2, h: 2, shape: 'rect' },
  { id: 'column', name: 'Column', category: 'Structural', w: 1, h: 1, shape: 'rect' },
  { id: 'door-standard', name: 'Door Standard', category: 'Structural', w: 1, h: 1, shape: 'rect' },
  { id: 'door-sliding', name: 'Door Sliding', category: 'Structural', w: 2, h: 1, shape: 'rect' },
  { id: 'door-lobby', name: 'Door Lobby', category: 'Structural', w: 4, h: 1, shape: 'rect' },

  { id: 'bed', name: 'Bed', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'nightstand', name: 'Nightstand', category: 'Furniture', w: 1, h: 1, shape: 'rect' },
  { id: 'desk', name: 'Desk', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'chair', name: 'Chair', category: 'Furniture', w: 1, h: 1, shape: 'rect' },
  { id: 'sofa', name: 'Sofa', category: 'Furniture', w: 1, h: 2, shape: 'rect' },
  { id: 'table-chairs', name: 'Table + Chairs', category: 'Furniture', w: 2, h: 2, shape: 'rect' },
  { id: 'plant', name: 'Plant', category: 'Furniture', w: 1, h: 1, shape: 'circle' },

  { id: 'reception-counter', name: 'Reception Counter', category: 'Service', w: 8, h: 1, shape: 'rect' },
  { id: 'concierge-desk', name: 'Concierge Desk', category: 'Service', w: 4, h: 1, shape: 'rect' },
  { id: 'luggage-rack', name: 'Luggage Rack', category: 'Service', w: 2, h: 1, shape: 'rect' },
  { id: 'bar-counter', name: 'Bar Counter', category: 'Service', w: 12, h: 1, shape: 'rect' },
  { id: 'bar-stool', name: 'Bar Stool', category: 'Service', w: 1, h: 1, shape: 'circle' },

  { id: 'kitchen-stove', name: 'Kitchen Stove', category: 'Kitchen', w: 1, h: 2, shape: 'rect' },
  { id: 'prep-station', name: 'Prep Station', category: 'Kitchen', w: 2, h: 1, shape: 'rect' },
  { id: 'storage-shelf', name: 'Storage Shelf', category: 'Kitchen', w: 1, h: 2, shape: 'rect' },

  { id: 'wardrobe', name: 'Wardrobe', category: 'Room', w: 1, h: 2, shape: 'rect' },
  { id: 'minibar', name: 'Minibar', category: 'Room', w: 1, h: 1, shape: 'rect' },
  { id: 'tv-stand', name: 'TV Stand', category: 'Room', w: 1, h: 2, shape: 'rect' },
  { id: 'bathtub', name: 'Bathtub', category: 'Room', w: 1, h: 2, shape: 'round' },

  { id: 'weapon-rack', name: 'Weapon Rack', category: 'Security', w: 2, h: 1, shape: 'rect' },
  { id: 'control-desk', name: 'Control Desk', category: 'Security', w: 4, h: 1, shape: 'rect' },
  { id: 'server-rack', name: 'Server Rack', category: 'Security', w: 1, h: 2, shape: 'rect' },
  { id: 'filing-cabinet', name: 'Filing Cabinet', category: 'Security', w: 1, h: 1, shape: 'rect' },

  { id: 'trash-bin', name: 'Trash Bin', category: 'Misc', w: 1, h: 1, shape: 'circle' },
  { id: 'helipad', name: 'Helipad Marker', category: 'Misc', w: 4, h: 4, shape: 'circle' },
  { id: 'dining-table-round', name: 'Dining Table Round', category: 'Misc', w: 2, h: 2, shape: 'circle' },
]

export function findAsset(assets: AssetDef[], type: string): AssetDef | undefined {
  return BUILTIN_ASSETS.find(a => a.id === type) || assets.find(a => a.id === type)
}
