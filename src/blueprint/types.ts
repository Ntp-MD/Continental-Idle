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

export interface AssetBase {
  id: string
  name: string
  category: string
  w: number
  h: number
  custom?: boolean
  isWall?: boolean
  defaultPadding?: number
  defaultRx?: { tl: number; tr: number; br: number; bl: number }
  defaultBgColor?: string
}

export interface SimpleAsset extends AssetBase {
  kind: 'simple'
  pxW?: number
  pxH?: number
  usePx?: boolean
}

export interface CompositeAsset extends AssetBase {
  kind: 'composite'
  parts: CompositePart[]
}

export interface LinkedAsset extends AssetBase {
  kind: 'linked'
  linkedParts: LinkedPart[]
}

export interface SvgAsset extends AssetBase {
  kind: 'svg'
  svg: string
  svgViewBox: { w: number; h: number }
}

export type AssetDef = SimpleAsset | CompositeAsset | LinkedAsset | SvgAsset

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
  isWall?: boolean
  customProps?: ObjectCustomProps
  instanceLabel?: string
  validationRule?: ValidationRule
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
  assetCategories: string[]
  floors: FloorData[]
  objectCustomProps?: Record<string, ObjectCustomProps>
  instanceLabels?: Record<string, string>
  validationRules?: Record<string, ValidationRule>
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

export function validateLayoutData(data: unknown): LayoutData | null {
  if (!data || typeof data !== 'object') return null
  const layout = data as LayoutData
  
  if (typeof layout.version !== 'number' || layout.version < 0) return null
  if (!layout.canvas || typeof layout.canvas !== 'object') return null
  if (typeof layout.canvas.width !== 'number' || layout.canvas.width <= 0) return null
  if (typeof layout.canvas.height !== 'number' || layout.canvas.height <= 0) return null
  if (typeof layout.canvas.tileSize !== 'number' || layout.canvas.tileSize <= 0) return null
  
  if (!Array.isArray(layout.customAssets)) return null
  if (!Array.isArray(layout.assetCategories)) return null
  if (!Array.isArray(layout.floors) || layout.floors.length === 0) return null
  
  for (const floor of layout.floors) {
    if (!floor.id || typeof floor.id !== 'string') return null
    if (!floor.name || typeof floor.name !== 'string') return null
    if (!floor.label || typeof floor.label !== 'string') return null
    if (!Array.isArray(floor.rooms)) return null
    if (!Array.isArray(floor.objects)) return null
  }
  
  return layout
}
