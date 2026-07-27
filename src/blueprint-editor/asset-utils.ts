import type { AssetDef, ObjectData, RoomData, SvgRole, SvgRoleInfo, WalkableGrid, TileState } from './types'

export function findAsset(assets: AssetDef[], type: string): AssetDef | undefined {
  return assets.find(a => a.id === type)
}

export function findAssetCached(assetMap: Map<string, AssetDef>, type: string): AssetDef | undefined {
  return assetMap.get(type)
}

export function buildAssetMap(assets: AssetDef[]): Map<string, AssetDef> {
  return new Map<string, AssetDef>(
    assets.map(a => [a.id, a])
  )
}

const VALID_ROLES = new Set<SvgRole>(['wall', 'door', 'fixture'])

export function parseSvgRoles(svg: string): SvgRoleInfo[] {
  if (!svg) return []
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    const result: SvgRoleInfo[] = []
    const all = doc.querySelectorAll('*')
    for (const el of Array.from(all)) {
      const role = el.getAttribute('data-role')
      if (!role) continue
      if (!VALID_ROLES.has(role as SvgRole)) continue
      const info: SvgRoleInfo = {
        role: role as SvgRole,
        tag: el.tagName.toLowerCase(),
      }
      const attrs: Record<string, string> = {}
      for (const attr of Array.from(el.attributes)) {
        if (attr.name !== 'data-role') attrs[attr.name] = attr.value
      }
      if (Object.keys(attrs).length > 0) info.attrs = attrs
      result.push(info)
    }
    return result
  } catch {
    return []
  }
}

export function validateRoomAnchors(room: RoomData, objects: ObjectData[]): { valid: boolean; invalid: [number, number][] } {
  const anchors = room.anchorPoints ?? [[room.w / 2, room.h / 2]]
  const invalid = anchors.filter(([x, y]) => {
    if (x < 0 || y < 0 || x > room.w || y > room.h) return true
    const worldX = room.x + x
    const worldY = room.y + y
    return objects.some(obj => {
      if (obj.walkable !== false && !obj.walkableGrid) return false
      if (worldX < obj.x || worldX >= obj.x + obj.w || worldY < obj.y || worldY >= obj.y + obj.h) return false
      if (!obj.walkableGrid || obj.walkableGrid.length === 0) return obj.walkable === false
      const row = Math.min(obj.walkableGrid.length - 1, Math.floor((worldY - obj.y) / (obj.h / obj.walkableGrid.length)))
      const cols = obj.walkableGrid[row]?.length ?? 0
      if (cols === 0) return obj.walkable === false
      const col = Math.min(cols - 1, Math.floor((worldX - obj.x) / (obj.w / cols)))
      return obj.walkable === false || obj.walkableGrid[row][col] === false
    })
  })
  return { valid: invalid.length === 0, invalid }
}

export function buildWalkableGrid(
  w: number,
  h: number,
  roles?: SvgRoleInfo[],
  tileStates?: TileState[][],
): { walkableGrid: WalkableGrid; tileStates: TileState[][] } {
  const rows = Math.max(1, Math.round(h))
  const cols = Math.max(1, Math.round(w))
  if (tileStates && tileStates.length === rows && tileStates[0]?.length === cols) {
    const grid: WalkableGrid = tileStates.map(row => row.map(t => t === 'walkable' || t === 'entrance'))
    return { walkableGrid: grid, tileStates }
  }
  const hasWall = roles?.some(r => r.role === 'wall') ?? false
  const hasFixture = roles?.some(r => r.role === 'fixture') ?? false
  const defaultState: TileState = (hasWall || hasFixture) ? 'blocked' : 'walkable'
  const states: TileState[][] = []
  const grid: WalkableGrid = []
  for (let r = 0; r < rows; r++) {
    states[r] = []
    grid[r] = []
    for (let c = 0; c < cols; c++) {
      states[r][c] = defaultState
      grid[r][c] = defaultState === 'walkable'
    }
  }
  return { walkableGrid: grid, tileStates: states }
}
