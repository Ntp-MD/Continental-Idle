export type EditorMode = 'wall' | 'object' | 'move' | 'erase'
export type Rotation = 0 | 90 | 180 | 270

export interface CompositePart {
  dx: number
  dy: number
  w: number
  h: number
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
  custom?: boolean
  pxW?: number
  pxH?: number
  usePx?: boolean
  parts?: CompositePart[]
  linkedParts?: LinkedPart[]
  defaultPadding?: number
  defaultRx?: { tl: number; tr: number; br: number; bl: number }
  defaultBgColor?: string
}

export interface RoomData {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  radius?: number
  locked?: boolean
  fillColor?: string
  rx?: { tl: number; tr: number; br: number; bl: number }
  padding?: number
}

export interface ObjectData {
  id: string
  subId?: string
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

export interface ObjectCustomProps {
  notes?: string
  tags?: string[]
  metadata?: Record<string, string | number>
}

export interface ValidationRule {
  required?: string[]
  minValues?: Record<string, number>
  maxValues?: Record<string, number>
}

export interface RoomTemplate {
  id: string
  name: string
  category: string
  w: number
  h: number
  label: string
  radius?: number
  fillColor?: string
  rx?: { tl: number; tr: number; br: number; bl: number }
  padding?: number
}

export interface LayoutData {
  version: number
  canvas: CanvasConfig
  customAssets: AssetDef[]
  hiddenBuiltinIds: string[]
  assetCategories: string[]
  floors: FloorData[]
  objectCustomProps: Record<string, ObjectCustomProps>
  instanceLabels: Record<string, string>
  validationRules: Record<string, ValidationRule>
  roomTemplates?: RoomTemplate[]
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
