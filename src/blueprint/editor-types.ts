export type RoomCategory = 'public' | 'service' | 'back' | 'security' | 'utility' | 'open'
export type AssetShape = 'rect' | 'circle' | 'round' | 'arc'
export type EditorMode = 'wall' | 'object' | 'move' | 'erase'
export type Rotation = 0 | 90 | 180 | 270

export interface RoomCategoryDef {
  id: string
  label: string
  color: string
  builtin?: boolean
}

export interface CompositePart {
  dx: number
  dy: number
  w: number
  h: number
  shape: AssetShape
  rotation?: Rotation
  type?: string
}

export interface LinkedPart {
  type: string
  dx: number
  dy: number
  w: number
  h: number
  rotation?: Rotation
}

export interface AssetDef {
  id: string
  name: string
  category: string
  w: number
  h: number
  shape: AssetShape
  custom?: boolean
  pxW?: number
  pxH?: number
  parts?: CompositePart[]
  linkedParts?: LinkedPart[]
  defaultPadding?: number
  defaultRx?: { tl: number; tr: number; br: number; bl: number }
}

export interface RoomData {
  id: string
  x: number
  y: number
  w: number
  h: number
  cat: string
  label: string
  radius?: number
  locked?: boolean
}

export interface ObjectData {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  rotation: Rotation
  radius?: number
  rx?: { tl: number; tr: number; br: number; bl: number }
  labelPadding?: number
  padding?: number
  collapsed?: boolean
  linkedIds?: string[]
  fillColor?: string
  locked?: boolean
  label?: string
}

export interface ZoneData {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  color: string
}

export interface FloorData {
  id: string
  name: string
  label: string
  rooms: RoomData[]
  objects: ObjectData[]
  zones?: ZoneData[]
}

export interface CanvasConfig {
  width: number
  height: number
  tileSize: number
}

export interface LayoutData {
  version: number
  canvas: CanvasConfig
  customAssets: AssetDef[]
  hiddenBuiltinIds: string[]
  roomCategories: RoomCategoryDef[]
  assetCategories: string[]
  floors: FloorData[]
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Selection = { type: 'room' | 'object'; id: string } | null

export interface MultiSelection {
  type: 'object'
  ids: string[]
}

const ROOM_CATEGORIES: RoomCategory[] = ['public', 'service', 'back', 'security', 'utility', 'open']

const ROOM_CATEGORY_COLORS: Record<RoomCategory, string> = {
  public: '#e8e4dc',
  service: '#d4e0f0',
  back: '#e0d4e8',
  security: '#f0d4d4',
  utility: '#d4e8d4',
  open: '#f7f7f5',
}

const ROOM_CATEGORY_LABELS: Record<RoomCategory, string> = {
  public: 'Public / Guest',
  service: 'Guest Service',
  back: 'Back of House',
  security: 'Restricted / Security',
  utility: 'Utility',
  open: 'Open Area',
}

export const DEFAULT_ROOM_CATEGORIES: RoomCategoryDef[] = ROOM_CATEGORIES.map(id => ({
  id,
  label: ROOM_CATEGORY_LABELS[id],
  color: ROOM_CATEGORY_COLORS[id],
  builtin: true,
}))

export function aabbOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export const DEFAULT_TILE_SIZE = 25
