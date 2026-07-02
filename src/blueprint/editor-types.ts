export type RoomCategory = 'public' | 'service' | 'back' | 'security' | 'utility' | 'open'
export type AssetShape = 'rect' | 'circle' | 'round'
export type EditorMode = 'wall' | 'object' | 'move'
export type Rotation = 0 | 90

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
}

export interface RoomData {
  id: string
  x: number
  y: number
  w: number
  h: number
  cat: RoomCategory
  label: string
  radius?: number
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
  labelPadding?: number
  padding?: number
  collapsed?: boolean
}

export interface FloorData {
  id: string
  name: string
  label: string
  rooms: RoomData[]
  objects: ObjectData[]
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
  floors: FloorData[]
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Selection = { type: 'room' | 'object'; id: string } | null

export const ROOM_CATEGORIES: RoomCategory[] = ['public', 'service', 'back', 'security', 'utility', 'open']

export const ROOM_CATEGORY_COLORS: Record<RoomCategory, string> = {
  public: '#e8e4dc',
  service: '#d4e0f0',
  back: '#e0d4e8',
  security: '#f0d4d4',
  utility: '#d4e8d4',
  open: '#f7f7f5',
}

export const ROOM_CATEGORY_LABELS: Record<RoomCategory, string> = {
  public: 'Public / Guest',
  service: 'Guest Service',
  back: 'Back of House',
  security: 'Restricted / Security',
  utility: 'Utility',
  open: 'Open Area',
}

export function aabbOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
