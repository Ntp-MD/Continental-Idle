import { reactive, computed, ref } from 'vue'
import type {
  LayoutData, FloorData, RoomData, ObjectData, AssetDef, SimpleAsset,
  EditorMode, Selection, Rect, Rotation,
  CompositePart, MultiSelection, LinkedPart,
  ObjectCustomProps, ValidationRule, RoomTemplate,
} from '../types'
import { aabbOverlap } from '../utils'
import { findAsset, findAssetCached, buildAssetMap } from '../assets-utils'
import { normalizeObject } from '../geometry'
import { useToast } from '@/composables/useToast'
import { EDITOR_CONFIG } from '../assets-config'
import { SEED_ASSETS } from '../assets-property'

export const toast = useToast()

let stateLock = false

export function withStateLock<T>(fn: () => Promise<T>): Promise<T> {
  if (stateLock) {
    toast.warning('Operation in progress, please wait')
    return Promise.reject(new Error('Operation in progress'))
  }
  stateLock = true
  try {
    return fn()
  } finally {
    stateLock = false
  }
}

export const editorLog = {
  error(context: string, error: unknown) {
    console.error(`[BlueprintEditor] ${context}:`, error)
  },
  warn(context: string, ...args: unknown[]) {
    console.warn(`[BlueprintEditor] ${context}:`, ...args)
  },
  info(context: string, ...args: unknown[]) {
    console.info(`[BlueprintEditor] ${context}:`, ...args)
  },
}

export { EDITOR_CONFIG }
export const LAYOUT_VERSION = EDITOR_CONFIG.layoutVersion
export const HISTORY_LIMIT = EDITOR_CONFIG.historyLimit

export const SAVED_LAYOUT: LayoutData = {
  "version": 1,
  "assetCategories": [
    "tools",
    "Merged",
    "Linked Sets"
  ],
  "canvas": {
    "width": 1200,
    "height": 600,
    "tileSize": 25
  },
  "customAssets": [],
  "floors": [
    {
      "id": "floor-mr8wexze-1",
      "name": "New Floor",
      "label": "F0",
      "rooms": [],
      "objects": [
        {
          "id": "o-15e5fd33-1ccd-48ab-9821-a254c4b0fc60",
          "subId": "sub-15f0678b-4346-4d34-ba3b-72378e0a77ee",
          "type": "builtin-restroom-1",
          "x": 1125,
          "y": 0,
          "w": 75,
          "h": 75,
          "rotation": 0,
          "collapsed": false
        },
        {
          "id": "o-7c8059bc-ffba-460f-99ab-ea980e63bd49",
          "subId": "sub-ab90ca7f-444a-4392-b5dc-e9baee17cae6",
          "type": "builtin-restroom-1",
          "x": 1125,
          "y": 75,
          "w": 75,
          "h": 75,
          "rotation": 0,
          "collapsed": false
        },
        {
          "id": "o-ac76ee74-8e15-4add-b1b4-febee64035be",
          "subId": "sub-be9c7504-2722-491f-ae06-ba4d793fc553",
          "type": "builtin-reception-1",
          "x": 450,
          "y": 275,
          "w": 250,
          "h": 25,
          "rotation": 0,
          "collapsed": false
        },
        {
          "id": "o-d3e08a1a-ddce-4bee-855b-797d035d597a",
          "subId": "sub-10f98895-ba5a-4faa-8083-7c5d18b5f07c",
          "type": "builtin-sportscar-4seat-1",
          "x": 450,
          "y": 175,
          "w": 125,
          "h": 75,
          "rotation": 0,
          "collapsed": false
        }
      ],
      "zones": []
    }
  ],
  "roomTemplates": []
}



























export function genId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function migrate(data: unknown): LayoutData {
  if (!data || typeof data !== 'object') return JSON.parse(JSON.stringify(SAVED_LAYOUT))
  const d = data as Record<string, unknown>
  const canvas = d.canvas
  const validCanvas = canvas && typeof canvas === 'object'
    && typeof (canvas as Record<string, unknown>).tileSize === 'number'
    && isFinite((canvas as Record<string, unknown>).tileSize as number)
    && (canvas as Record<string, unknown>).tileSize as number > 0
  const migrated: LayoutData = {
    version: LAYOUT_VERSION,
    assetCategories: Array.isArray(d.assetCategories)
      ? d.assetCategories.filter((c: unknown): c is string => typeof c === 'string')
      : [],
    canvas: validCanvas
      ? {
          width: typeof (canvas as Record<string, unknown>).width === 'number' && isFinite((canvas as Record<string, unknown>).width as number) ? (canvas as Record<string, unknown>).width as number : EDITOR_CONFIG.defaultCanvas.width,
          height: typeof (canvas as Record<string, unknown>).height === 'number' && isFinite((canvas as Record<string, unknown>).height as number) ? (canvas as Record<string, unknown>).height as number : EDITOR_CONFIG.defaultCanvas.height,
          tileSize: (canvas as Record<string, unknown>).tileSize as number,
        }
      : { ...EDITOR_CONFIG.defaultCanvas },
    customAssets: Array.isArray(d.customAssets)
      ? d.customAssets.filter(
          (a: unknown): a is Record<string, unknown> => {
            const rec = a as Record<string, unknown>
            return typeof rec?.id === 'string' && typeof rec?.name === 'string'
              && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
              && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
          }
        ).map((a) => {
          const base = {
            id: a.id as string,
            name: a.name as string,
            category: typeof a.category === 'string' ? a.category : 'Custom',
            w: a.w as number,
            h: a.h as number,
            custom: true as boolean,
          }
          if (typeof a.defaultPadding === 'number' && a.defaultPadding > 0) (base as any).defaultPadding = a.defaultPadding
          if (typeof a.defaultBgColor === 'string' && a.defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a.defaultBgColor)) (base as any).defaultBgColor = a.defaultBgColor
          if (a.defaultRx && typeof a.defaultRx === 'object') {
            const rx = a.defaultRx as Record<string, unknown>
            if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
              (base as any).defaultRx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
            }
          }
          const hasParts = Array.isArray(a.parts) && a.parts.length > 0
          const hasLinkedParts = Array.isArray(a.linkedParts) && a.linkedParts.length > 0
          const hasSvg = typeof a.svg === 'string' && a.svg && (a.special === true || (a.svgViewBox && typeof (a.svgViewBox as Record<string, unknown>).w === 'number'))
          if (hasParts) {
            const parts: CompositePart[] = (a.parts as Record<string, unknown>[])
              .filter((p: unknown): p is Record<string, unknown> => {
                const rec = p as Record<string, unknown>
                return typeof rec?.dx === 'number' && typeof rec?.dy === 'number'
                  && typeof rec?.w === 'number' && typeof rec?.h === 'number'
              })
              .map((p) => {
                const part: CompositePart = {
                  dx: p.dx as number,
                  dy: p.dy as number,
                  w: p.w as number,
                  h: p.h as number,
                }
                if (typeof p.rotation === 'number' && [0, 90, 180, 270].includes(p.rotation)) {
                  part.rotation = p.rotation as Rotation
                }
                if (typeof p.type === 'string') {
                  part.type = p.type
                }
                return part
              })
            return { kind: 'composite' as const, ...base, parts }
          }
          if (hasLinkedParts) {
            const linkedParts: LinkedPart[] = (a.linkedParts as Record<string, unknown>[])
              .filter((p: unknown): p is Record<string, unknown> => {
                const rec = p as Record<string, unknown>
                return typeof rec?.type === 'string' && typeof rec?.dx === 'number' && typeof rec?.dy === 'number'
                  && typeof rec?.w === 'number' && typeof rec?.h === 'number'
              })
              .map((p) => {
                const part: LinkedPart = {
                  type: p.type as string,
                  dx: p.dx as number,
                  dy: p.dy as number,
                  w: p.w as number,
                  h: p.h as number,
                }
                if (typeof p.rotation === 'number' && [0, 90, 180, 270].includes(p.rotation)) {
                  part.rotation = p.rotation as Rotation
                }
                return part
              })
            return { kind: 'linked' as const, ...base, linkedParts }
          }
          if (hasSvg) {
            const svg = a.svg as string
            let svgViewBox = { w: 50, h: 25 }
            if (a.svgViewBox && typeof a.svgViewBox === 'object') {
              const vb = a.svgViewBox as Record<string, unknown>
              if (typeof vb.w === 'number' && typeof vb.h === 'number' && vb.w > 0 && vb.h > 0) {
                svgViewBox = { w: vb.w, h: vb.h }
              }
            }
            return { kind: 'svg' as const, ...base, svg, svgViewBox }
          }
          const simple: AssetDef = { kind: 'simple', ...base }
          if (typeof a.usePx === 'boolean') (simple as SimpleAsset).usePx = a.usePx
          if (typeof a.pxW === 'number' && a.pxW > 0) (simple as SimpleAsset).pxW = Math.floor(a.pxW)
          if (typeof a.pxH === 'number' && a.pxH > 0) (simple as SimpleAsset).pxH = Math.floor(a.pxH)
          return simple
        })
      : [],
    floors: Array.isArray(d.floors) && d.floors.length > 0
      ? d.floors.map((f: unknown) => {
          const fRec = (f ?? {}) as Record<string, unknown>
          return {
          id: typeof fRec.id === 'string' ? fRec.id : genId('floor'),
          name: typeof fRec.name === 'string' ? fRec.name : 'Unnamed',
          label: typeof fRec.label === 'string' ? fRec.label : 'F?',
          rooms: Array.isArray(fRec.rooms) ? fRec.rooms.filter(
            (r: unknown): r is Record<string, unknown> => {
              const rec = r as Record<string, unknown>
              return typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((r) => {
            const room: RoomData = {
              id: typeof r.id === 'string' ? r.id : genId('r'),
              x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number,
              label: typeof r.label === 'string' ? r.label : '',
            }
            if (typeof r.radius === 'number' && r.radius >= 0) room.radius = r.radius
            if (r.locked === true) room.locked = true
            if (typeof r.fillColor === 'string' && r.fillColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(r.fillColor)) room.fillColor = r.fillColor
            if (r.rx && typeof r.rx === 'object') {
              const rrx = r.rx as Record<string, unknown>
              if (typeof rrx.tl === 'number' && typeof rrx.tr === 'number' && typeof rrx.br === 'number' && typeof rrx.bl === 'number') {
                room.rx = { tl: rrx.tl, tr: rrx.tr, br: rrx.br, bl: rrx.bl }
              }
            }
            if (typeof r.padding === 'number' && r.padding >= 0) room.padding = r.padding
            return room
          }) : [],
          objects: Array.isArray(fRec.objects) ? fRec.objects.filter(
            (o: unknown): o is Record<string, unknown> => {
              const rec = o as Record<string, unknown>
              return typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((o) => {
            const obj: ObjectData = {
              id: typeof o.id === 'string' ? o.id : genId('o'),
              subId: typeof o.subId === 'string' ? o.subId : genId('sub'),
              type: typeof o.type === 'string' ? o.type : 'unknown',
              x: o.x as number, y: o.y as number, w: o.w as number, h: o.h as number,
              rotation: [0, 90, 180, 270].includes(o.rotation as number) ? o.rotation as Rotation : 0,
            }
            if (typeof o.radius === 'number' && o.radius >= 0) obj.radius = o.radius
            if (o.rx && typeof o.rx === 'object') {
              const rx = o.rx as Record<string, unknown>
              if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
                obj.rx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
              }
            }
            if (typeof o.labelPadding === 'number' && o.labelPadding >= 0) obj.labelPadding = o.labelPadding
            if (typeof o.padding === 'number' && o.padding >= 0) obj.padding = o.padding
            if (Array.isArray(o.linkedIds)) {
              obj.linkedIds = o.linkedIds.filter((lid: unknown): lid is string => typeof lid === 'string')
              if (obj.linkedIds.length === 0) delete obj.linkedIds
            }
            if (typeof o.fillColor === 'string' && o.fillColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(o.fillColor)) obj.fillColor = o.fillColor
            if (o.locked === true) obj.locked = true
            if (typeof o.label === 'string' && o.label) obj.label = o.label
            if (o.customProps && typeof o.customProps === 'object') obj.customProps = o.customProps as ObjectCustomProps
            if (typeof o.instanceLabel === 'string' && o.instanceLabel) obj.instanceLabel = o.instanceLabel
            if (o.validationRule && typeof o.validationRule === 'object') obj.validationRule = o.validationRule as ValidationRule
            return obj
          }) : [],
          zones: Array.isArray(fRec.zones) ? fRec.zones.filter(
            (z: unknown): z is Record<string, unknown> => {
              const rec = z as Record<string, unknown>
              return typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((z) => ({
            id: typeof z.id === 'string' ? z.id : genId('zone'),
            x: z.x as number, y: z.y as number, w: z.w as number, h: z.h as number,
            label: typeof z.label === 'string' ? z.label : 'Zone',
            color: typeof z.color === 'string' ? z.color : '#06b6d4',
          })) : [],
        }})
      : [],
    roomTemplates: Array.isArray((d as Record<string, unknown>).roomTemplates)
      ? (d as Record<string, unknown>).roomTemplates as RoomTemplate[]
      : [],
  }
  const oldCustomProps = migrated.objectCustomProps ?? {}
  const oldInstanceLabels = migrated.instanceLabels ?? {}
  const oldValidationRules = migrated.validationRules ?? {}
  for (const floor of migrated.floors) {
    for (const obj of floor.objects) {
      if (obj.subId) {
        if (oldCustomProps[obj.subId]) obj.customProps = oldCustomProps[obj.subId]
        if (oldInstanceLabels[obj.subId]) obj.instanceLabel = oldInstanceLabels[obj.subId]
        if (oldValidationRules[obj.subId]) obj.validationRule = oldValidationRules[obj.subId]
      }
    }
  }
  delete migrated.objectCustomProps
  delete migrated.instanceLabels
  delete migrated.validationRules
  const t = migrated.canvas.tileSize
  for (const asset of migrated.customAssets) {
    if (asset.kind === 'linked') {
      for (const p of asset.linkedParts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    } else if (asset.kind === 'composite') {
      for (const p of asset.parts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
  }
  for (const floor of migrated.floors) {
    const validIds = new Set(floor.objects.map(o => o.id))
    const beforeCount = floor.objects.length
    floor.objects = floor.objects.filter(o => findAsset([...SEED_ASSETS, ...migrated.customAssets], o.type))
    const removedCount = beforeCount - floor.objects.length
    if (removedCount > 0) {
      editorLog.warn('Migration', `removed ${removedCount} object(s) with unknown asset types from floor "${floor.label}"`)
    }
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => validIds.has(lid))
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
      normalizeObject(o, migrated.canvas.tileSize, [...SEED_ASSETS, ...migrated.customAssets])
    }
    recalcCollapsed(floor, [...SEED_ASSETS, ...migrated.customAssets])
  }
  return migrated
}

export function loadInitial(): LayoutData {
  const hmrData = (import.meta as any).hot?.data?._editorLayout as string | undefined
  if (hmrData) {
    try { return migrate(JSON.parse(hmrData)) } catch { /* fall through */ }
  }
  return migrate(JSON.parse(JSON.stringify(SAVED_LAYOUT)))
}

export interface EditorState {
  layout: LayoutData
  currentFloorId: string
  mode: EditorMode
  selection: Selection
  multiSelection: MultiSelection | null
  selectedAssetId: string | null
}

const _hmrData = (import.meta as any).hot?.data
export const state = reactive<EditorState>({
  layout: loadInitial(),
  currentFloorId: _hmrData?._editorState?.currentFloorId ?? '',
  mode: _hmrData?._editorState?.mode ?? 'object',
  selection: _hmrData?._editorState?.selection ?? null,
  multiSelection: _hmrData?._editorState?.multiSelection ?? null,
  selectedAssetId: _hmrData?._editorState?.selectedAssetId ?? null,
})

if (!state.currentFloorId) state.currentFloorId = state.layout.floors[0]?.id ?? ''

let _assetMap: Map<string, AssetDef> | null = null
let _assetMapVersion = -1
let _assetMapMutations = 0
export function invalidateAssetMap() {
  _assetMapMutations++
}
export function assetMap(): Map<string, AssetDef> {
  if (!_assetMap || _assetMapVersion !== _assetMapMutations) {
    _assetMap = buildAssetMap(state.layout.customAssets)
    _assetMapVersion = _assetMapMutations
  }
  return _assetMap
}

export const dragState = reactive<{ assetId: string | null; roomTemplateId: string | null }>({ assetId: null, roomTemplateId: null })

export function startAssetDrag(assetId: string) {
  dragState.assetId = assetId
}
export function endAssetDrag() {
  dragState.assetId = null
  dragState.roomTemplateId = null
}
export function startRoomTemplateDrag(templateId: string) {
  dragState.roomTemplateId = templateId
}
export function endRoomTemplateDrag() {
  dragState.roomTemplateId = null
}

export function findRoomTemplate(id: string): RoomTemplate | undefined {
  return state.layout.roomTemplates?.find(t => t.id === id)
}

export function selectAsset(id: string | null) {
  state.selectedAssetId = id
  if (id) state.selection = null
  state.multiSelection = null
}

export const selectedAsset = computed(() =>
  state.selectedAssetId ? findAsset([...SEED_ASSETS, ...state.layout.customAssets], state.selectedAssetId) ?? null : null
)

export const undoStack = ref<string[]>(_hmrData?._editorState?.undoStack ?? [])
export const redoStack = ref<string[]>(_hmrData?._editorState?.redoStack ?? [])

export const currentFloor = computed<FloorData | undefined>(() =>
  state.layout.floors.find(f => f.id === state.currentFloorId)
)

export function snap(value: number, tileSize?: number): number {
  const t = tileSize ?? state.layout.canvas.tileSize
  if (t <= 0) return value
  const snapped = Math.round(value / t) * t
  if (value > 0 && snapped < t) return t
  return snapped
}

export function selectedRoom(): RoomData | undefined {
  if (state.selection?.type !== 'room') return undefined
  return currentFloor.value?.rooms.find(r => r.id === state.selection!.id)
}

export function selectedObject(): ObjectData | undefined {
  if (state.selection?.type !== 'object') return undefined
  return currentFloor.value?.objects.find(o => o.id === state.selection!.id)
}

export function roomOverlapsAny(rect: Rect, excludeId?: string): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  return floor.rooms.some(r => r.id !== excludeId && aabbOverlap(rect, r))
}

export function objectOverlapsAny(rect: Rect, excludeId?: string | string[]): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  const am = assetMap()
  const excluded = Array.isArray(excludeId) ? new Set(excludeId) : excludeId ? new Set([excludeId]) : null
  return floor.objects.some(o => {
    if (excluded && excluded.has(o.id)) return false
    const asset = findAssetCached(am, o.type)
    if (asset?.kind === 'svg') return false
    if (asset?.kind === 'composite') {
      return asset.parts.some(part => {
        const partRect = { x: o.x + part.dx, y: o.y + part.dy, w: part.w, h: part.h }
        return aabbOverlap(rect, partRect)
      })
    }
    return aabbOverlap(rect, o)
  })
}

export function recalcCollapsed(floor: FloorData, customAssets?: AssetDef[], changedRect?: Rect) {
  const am = customAssets ? buildAssetMap(customAssets) : assetMap()
  const objCount = floor.objects.length
  if (objCount <= 1) {
    if (objCount === 1) floor.objects[0].collapsed = false
    return
  }
  function getAsset(type: string): AssetDef | undefined {
    return findAssetCached(am, type)
  }
  const candidates = changedRect
    ? floor.objects.filter(o => aabbOverlap(o, changedRect))
    : floor.objects
  for (const obj of candidates) {
    const asset = getAsset(obj.type)
    if (asset?.kind === 'svg') { obj.collapsed = false; continue }
    const hasParts = asset?.kind === 'composite'
    obj.collapsed = floor.objects.some(o => {
      if (o.id === obj.id) return false
      if (!aabbOverlap(obj, o)) return false
      const oAsset = getAsset(o.type)
      if (oAsset?.kind === 'svg') return false
      if (hasParts && asset.kind === 'composite') {
        const parts = asset.parts
        if (oAsset?.kind === 'composite') {
          return oAsset.parts.some(op => parts.some(mp => {
            const mr = { x: obj.x + mp.dx, y: obj.y + mp.dy, w: mp.w, h: mp.h }
            const or = { x: o.x + op.dx, y: o.y + op.dy, w: op.w, h: op.h }
            return aabbOverlap(mr, or)
          }))
        }
        return parts.some(mp => {
          const mr = { x: obj.x + mp.dx, y: obj.y + mp.dy, w: mp.w, h: mp.h }
          return aabbOverlap(mr, o)
        })
      }
      if (oAsset?.kind === 'composite') {
        return oAsset.parts.some(op => {
          const or = { x: o.x + op.dx, y: o.y + op.dy, w: op.w, h: op.h }
          return aabbOverlap(obj, or)
        })
      }
      return true
    })
  }
}

export function clamp(rect: Rect): Rect {
  const { width, height } = state.layout.canvas
  let { x, y, w, h } = rect
  w = Math.min(w, width)
  h = Math.min(h, height)
  x = Math.max(0, Math.min(x, width - w))
  y = Math.max(0, Math.min(y, height - h))
  return { x, y, w, h }
}

export const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function isValidColor(c: string | undefined): boolean {
  return !c || (typeof c === 'string' && HEX_COLOR_RE.test(c))
}

export function groupBoundsOf(objs: ObjectData[]): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of objs) {
    minX = Math.min(minX, o.x)
    minY = Math.min(minY, o.y)
    maxX = Math.max(maxX, o.x + o.w)
    maxY = Math.max(maxY, o.y + o.h)
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

export function getLinkedObjects(obj: ObjectData): ObjectData[] {
  const floor = currentFloor.value
  if (!floor || !obj.linkedIds || obj.linkedIds.length === 0) return []
  return floor.objects.filter(o => obj.linkedIds!.includes(o.id))
}

export function buildCompositeParts(objs: ObjectData[]): { parts: CompositePart[]; minX: number; minY: number; totalW: number; totalH: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const obj of objs) {
    minX = Math.min(minX, obj.x)
    minY = Math.min(minY, obj.y)
    maxX = Math.max(maxX, obj.x + obj.w)
    maxY = Math.max(maxY, obj.y + obj.h)
  }
  const totalW = maxX - minX
  const totalH = maxY - minY
  const parts: CompositePart[] = objs.map(obj => ({
    dx: Math.round(obj.x - minX),
    dy: Math.round(obj.y - minY),
    w: Math.round(obj.w),
    h: Math.round(obj.h),
    rotation: 0,
    type: obj.type,
  }))
  return { parts, minX, minY, totalW, totalH }
}

export function editorFloorLabelToFloorId(label: string): string | null {
  if (label === 'G') return 'G'
  const match = label.match(/^F(\d+)$/)
  if (match) {
    return match[1]
  }
  return null
}
