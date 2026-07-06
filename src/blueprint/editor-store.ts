import { reactive, computed, ref } from 'vue'
import type {
  LayoutData, FloorData, RoomData, ObjectData, AssetDef,
  EditorMode, Selection, Rect, Rotation,
  CompositePart, MultiSelection, ZoneData, LinkedPart,
  ObjectCustomProps, ValidationRule, RoomTemplate,
} from './types'
import { aabbOverlap } from './utils'
import { findAsset, findAssetCached, buildAssetMap } from './editor-assets'
import { useToast } from '@/composables/useToast'
import { EDITOR_CONFIG } from './editor-config'

const toast = useToast()

const editorLog = {
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

const LAYOUT_VERSION = EDITOR_CONFIG.layoutVersion
const HISTORY_LIMIT = EDITOR_CONFIG.historyLimit

const SAVED_LAYOUT: LayoutData = {
  "version": 1,
  "hiddenBuiltinIds": [],
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
  "customAssets": [
    {
      "id": "custom-mr8wdziq-1",
      "name": "Table",
      "category": "tools",
      "w": 1,
      "h": 2,
      "custom": true
    },
    {
      "id": "custom-mr8wfbqa-1",
      "name": "Chair",
      "category": "tools",
      "w": 1,
      "h": 1,
      "custom": true,
      "defaultPadding": 5,
      "defaultRx": {
        "tl": 3,
        "tr": 3,
        "br": 3,
        "bl": 3
      }
    },
    {
      "id": "linked-mr8ztb1g-1",
      "name": "Table Set",
      "category": "Linked Sets",
      "w": 3,
      "h": 2,
      "custom": true,
      "linkedParts": [
        {
          "type": "custom-mr8wdziq-1",
          "dx": 25,
          "dy": 0,
          "w": 25,
          "h": 50,
          "rotation": 0
        },
        {
          "type": "custom-mr8wfbqa-1",
          "dx": 50,
          "dy": 0,
          "w": 25,
          "h": 25,
          "rotation": 0
        },
        {
          "type": "custom-mr8wfbqa-1",
          "dx": 0,
          "dy": 0,
          "w": 25,
          "h": 25,
          "rotation": 0
        },
        {
          "type": "custom-mr8wfbqa-1",
          "dx": 0,
          "dy": 25,
          "w": 25,
          "h": 25,
          "rotation": 0
        },
        {
          "type": "custom-mr8wfbqa-1",
          "dx": 50,
          "dy": 25,
          "w": 25,
          "h": 25,
          "rotation": 0
        }
      ]
    },
    {
      "id": "custom-mr8zu9xo-1",
      "name": "Door",
      "category": "tools",
      "w": 2,
      "h": 1,
      "custom": true
    },
    {
      "id": "custom-mr907rdo-1",
      "name": "Bar",
      "category": "Misc",
      "w": 1,
      "h": 8,
      "custom": true
    },
    {
      "id": "custom-mr92zwu5-7",
      "name": "For Sofa",
      "category": "Misc",
      "w": 2,
      "h": 1,
      "custom": true,
      "pxW": 40,
      "pxH": 25
    }
  ],
  "floors": [
    {
      "id": "floor-mr8wexze-1",
      "name": "New Floor",
      "label": "F0",
      "rooms": [],
      "objects": [
        {
          "id": "o-mr8zrvak-1",
          "subId": "sub-mr8zrvak-2",
          "type": "custom-mr8wdziq-1",
          "x": 175,
          "y": 50,
          "w": 25,
          "h": 50,
          "rotation": 0,
          "linkedIds": [
            "o-mr8zryfh-1",
            "o-mr8zrzr0-1",
            "o-mr8zs16c-1",
            "o-mr8zs2pw-1"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8zryfh-1",
          "subId": "sub-mr8zryfh-2",
          "type": "custom-mr8wfbqa-1",
          "x": 200,
          "y": 50,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8zrvak-1",
            "o-mr8zrzr0-1",
            "o-mr8zs16c-1",
            "o-mr8zs2pw-1"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8zrzr0-1",
          "subId": "sub-mr8zrzr0-2",
          "type": "custom-mr8wfbqa-1",
          "x": 150,
          "y": 50,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8zrvak-1",
            "o-mr8zryfh-1",
            "o-mr8zs16c-1",
            "o-mr8zs2pw-1"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8zs16c-1",
          "subId": "sub-mr8zs16c-2",
          "type": "custom-mr8wfbqa-1",
          "x": 150,
          "y": 75,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8zrvak-1",
            "o-mr8zryfh-1",
            "o-mr8zrzr0-1",
            "o-mr8zs2pw-1"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8zs2pw-1",
          "subId": "sub-mr8zs2pw-2",
          "type": "custom-mr8wfbqa-1",
          "x": 200,
          "y": 75,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8zrvak-1",
            "o-mr8zryfh-1",
            "o-mr8zrzr0-1",
            "o-mr8zs16c-1"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8ztdpw-1",
          "subId": "sub-mr8ztdpw-2",
          "type": "custom-mr8wdziq-1",
          "x": 175,
          "y": 125,
          "w": 25,
          "h": 50,
          "rotation": 0,
          "linkedIds": [
            "o-mr8ztdpw-3",
            "o-mr8ztdpw-5",
            "o-mr8ztdpw-7",
            "o-mr8ztdpw-9"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8ztdpw-3",
          "subId": "sub-mr8ztdpw-4",
          "type": "custom-mr8wfbqa-1",
          "x": 200,
          "y": 125,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8ztdpw-1",
            "o-mr8ztdpw-5",
            "o-mr8ztdpw-7",
            "o-mr8ztdpw-9"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8ztdpw-5",
          "subId": "sub-mr8ztdpw-6",
          "type": "custom-mr8wfbqa-1",
          "x": 150,
          "y": 125,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8ztdpw-1",
            "o-mr8ztdpw-3",
            "o-mr8ztdpw-7",
            "o-mr8ztdpw-9"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8ztdpw-7",
          "subId": "sub-mr8ztdpw-8",
          "type": "custom-mr8wfbqa-1",
          "x": 150,
          "y": 150,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8ztdpw-1",
            "o-mr8ztdpw-3",
            "o-mr8ztdpw-5",
            "o-mr8ztdpw-9"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr8ztdpw-9",
          "subId": "sub-mr8ztdpw-10",
          "type": "custom-mr8wfbqa-1",
          "x": 200,
          "y": 150,
          "w": 25,
          "h": 25,
          "rotation": 0,
          "rx": {
            "tl": 3,
            "tr": 3,
            "br": 3,
            "bl": 3
          },
          "padding": 5,
          "linkedIds": [
            "o-mr8ztdpw-1",
            "o-mr8ztdpw-3",
            "o-mr8ztdpw-5",
            "o-mr8ztdpw-7"
          ],
          "collapsed": false
        },
        {
          "id": "o-mr9058oc-1",
          "subId": "sub-mr9058oc-2",
          "type": "custom-mr8zu9xo-1",
          "x": 450,
          "y": 0,
          "w": 50,
          "h": 25,
          "rotation": 0,
          "collapsed": false
        },
        {
          "id": "o-mr907u8d-1",
          "subId": "sub-mr907u8d-2",
          "type": "custom-mr907rdo-1",
          "x": 1075,
          "y": 25,
          "w": 25,
          "h": 200,
          "rotation": 0,
          "collapsed": false
        },
        {
          "id": "o-mr92tiph-1",
          "subId": "sub-mr92tiph-2",
          "type": "custom-mr8wdziq-1",
          "x": 350,
          "y": 325,
          "w": 25,
          "h": 50,
          "rotation": 0,
          "collapsed": false
        },
        {
          "id": "o-mr931mxx-14",
          "subId": "sub-mr931mxx-15",
          "type": "custom-mr92zwu5-7",
          "rotation": 0,
          "x": 350,
          "y": 300,
          "w": 40,
          "h": 25,
          "collapsed": false
        }
      ],
      "zones": []
    },
    {
      "id": "floor-mr905qt8-1",
      "name": "Test Gen",
      "label": "F1",
      "rooms": [],
      "objects": [],
      "zones": []
    }
  ],
  "objectCustomProps": {},
  "instanceLabels": {},
  "validationRules": {},
  "roomTemplates": []
}































































































































































































let idCounter = 1
function initIdCounter(): void {
  let maxCounter = 0
  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      const m = obj.id.match(/-([0-9a-z]+)$/)
      if (m) {
        const n = parseInt(m[1], 36)
        if (n > maxCounter) maxCounter = n
      }
    }
    for (const room of floor.rooms) {
      const m = room.id.match(/-([0-9a-z]+)$/)
      if (m) {
        const n = parseInt(m[1], 36)
        if (n > maxCounter) maxCounter = n
      }
    }
  }
  for (const asset of state.layout.customAssets) {
    const m = asset.id.match(/-([0-9a-z]+)$/)
    if (m) {
      const n = parseInt(m[1], 36)
      if (n > maxCounter) maxCounter = n
    }
  }
  idCounter = maxCounter + 1
}
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${idCounter++}`
}


function migrate(data: unknown): LayoutData {
  if (!data || typeof data !== 'object') return JSON.parse(JSON.stringify(SAVED_LAYOUT))
  const d = data as Record<string, unknown>
  const canvas = d.canvas
  const validCanvas = canvas && typeof canvas === 'object'
    && typeof (canvas as Record<string, unknown>).tileSize === 'number'
    && isFinite((canvas as Record<string, unknown>).tileSize as number)
    && (canvas as Record<string, unknown>).tileSize as number > 0
  const hiddenBuiltinIds: string[] = Array.isArray(d.hiddenBuiltinIds)
    ? d.hiddenBuiltinIds.filter((id: unknown): id is string => typeof id === 'string')
    : []
  const migrated: LayoutData = {
    version: LAYOUT_VERSION,
    hiddenBuiltinIds,
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
          const asset: AssetDef = {
            id: a.id as string,
            name: a.name as string,
            category: typeof a.category === 'string' ? a.category : 'Custom',
            w: a.w as number,
            h: a.h as number,
            custom: true,
          }
          if (typeof a.usePx === 'boolean') asset.usePx = a.usePx
          if (typeof a.pxW === 'number' && a.pxW > 0) asset.pxW = Math.floor(a.pxW)
          if (typeof a.pxH === 'number' && a.pxH > 0) asset.pxH = Math.floor(a.pxH)
          if (Array.isArray(a.parts)) {
            asset.parts = a.parts
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
          }
          if (Array.isArray(a.linkedParts)) {
            asset.linkedParts = a.linkedParts
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
          }
          if (typeof a.defaultPadding === 'number' && a.defaultPadding > 0) asset.defaultPadding = a.defaultPadding
          if (typeof a.defaultBgColor === 'string' && a.defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a.defaultBgColor)) asset.defaultBgColor = a.defaultBgColor
          if (a.defaultRx && typeof a.defaultRx === 'object') {
            const rx = a.defaultRx as Record<string, unknown>
            if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
              asset.defaultRx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
            }
          }
          return asset
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
    objectCustomProps: typeof d.objectCustomProps === 'object' && d.objectCustomProps !== null
      ? d.objectCustomProps as Record<string, ObjectCustomProps>
      : {},
    instanceLabels: typeof d.instanceLabels === 'object' && d.instanceLabels !== null
      ? d.instanceLabels as Record<string, string>
      : {},
    validationRules: typeof d.validationRules === 'object' && d.validationRules !== null
      ? d.validationRules as Record<string, ValidationRule>
      : {},
    roomTemplates: Array.isArray((d as Record<string, unknown>).roomTemplates)
      ? (d as Record<string, unknown>).roomTemplates as RoomTemplate[]
      : [],
  }
  const t = migrated.canvas.tileSize
  for (const asset of migrated.customAssets) {
    if (asset.linkedParts && asset.linkedParts.length > 0) {
      for (const p of asset.linkedParts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
    if (asset.parts && asset.parts.length > 0) {
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
    floor.objects = floor.objects.filter(o => findAsset(migrated.customAssets, o.type))
    const removedCount = beforeCount - floor.objects.length
    if (removedCount > 0) {
      editorLog.warn('Migration', `removed ${removedCount} object(s) with unknown asset types from floor "${floor.label}"`)
    }
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => validIds.has(lid))
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
      normalizeObject(o, migrated.canvas.tileSize, migrated.customAssets)
    }
    recalcCollapsed(floor, migrated.customAssets)
  }
  return migrated
}

function loadInitial(): LayoutData {
  const hmrData = (import.meta as any).hot?.data?._editorLayout as string | undefined
  if (hmrData) {
    try { return migrate(JSON.parse(hmrData)) } catch { /* fall through */ }
  }
  return migrate(JSON.parse(JSON.stringify(SAVED_LAYOUT)))
}

interface EditorState {
  layout: LayoutData
  currentFloorId: string
  mode: EditorMode
  selection: Selection
  multiSelection: MultiSelection | null
  selectedAssetId: string | null
}

const _hmrData = (import.meta as any).hot?.data
const state = reactive<EditorState>({
  layout: loadInitial(),
  currentFloorId: _hmrData?._editorState?.currentFloorId ?? '',
  mode: _hmrData?._editorState?.mode ?? 'object',
  selection: _hmrData?._editorState?.selection ?? null,
  multiSelection: _hmrData?._editorState?.multiSelection ?? null,
  selectedAssetId: _hmrData?._editorState?.selectedAssetId ?? null,
})

if (!state.currentFloorId) state.currentFloorId = state.layout.floors[0]?.id ?? ''
initIdCounter()

let _assetMap: Map<string, AssetDef> | null = null
let _assetMapVersion = -1
let _assetMapMutations = 0
function invalidateAssetMap() {
  _assetMapMutations++
}
function assetMap(): Map<string, AssetDef> {
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

function findRoomTemplate(id: string): RoomTemplate | undefined {
  return state.layout.roomTemplates?.find(t => t.id === id)
}

function selectAsset(id: string | null) {
  state.selectedAssetId = id
  if (id) state.selection = null
  state.multiSelection = null
}

const selectedAsset = computed(() =>
  state.selectedAssetId ? findAsset(state.layout.customAssets, state.selectedAssetId) ?? null : null
)

const undoStack = ref<string[]>(_hmrData?._editorState?.undoStack ?? [])
const redoStack = ref<string[]>(_hmrData?._editorState?.redoStack ?? [])

function snapshot(): string {
  return JSON.stringify(state.layout)
}

function restore(json: string) {
  let parsed: LayoutData
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    editorLog.error('restoreHistorySnapshot', e)
    return
  }
  if (!parsed || !parsed.floors || !parsed.floors.length) {
    editorLog.error('restoreHistorySnapshot', 'Invalid snapshot - missing floors')
    return
  }
  state.layout = parsed
  invalidateAssetMap()
  if (!state.layout.floors.find(f => f.id === state.currentFloorId)) {
    state.currentFloorId = state.layout.floors[0]?.id ?? ''
  }
  state.selection = null
  state.multiSelection = null
  for (const floor of state.layout.floors) {
    recalcCollapsed(floor)
  }
}

function pushHistory() {
  const snap = snapshot()
  if (undoStack.value.length > 0 && undoStack.value[undoStack.value.length - 1] === snap) return
  undoStack.value.push(snap)
  if (undoStack.value.length > HISTORY_LIMIT) undoStack.value.shift()
  redoStack.value.length = 0
}

function undo() {
  if (undoStack.value.length === 0) return
  redoStack.value.push(snapshot())
  const prev = undoStack.value.pop()!
  restore(prev)
}

function redo() {
  if (redoStack.value.length === 0) return
  undoStack.value.push(snapshot())
  const next = redoStack.value.pop()!
  restore(next)
}

const currentFloor = computed<FloorData | undefined>(() =>
  state.layout.floors.find(f => f.id === state.currentFloorId)
)

function snap(value: number, tileSize?: number): number {
  const t = tileSize ?? state.layout.canvas.tileSize
  if (t <= 0) return value
  const snapped = Math.round(value / t) * t
  if (value > 0 && snapped < t) return t
  return snapped
}

function selectedRoom(): RoomData | undefined {
  if (state.selection?.type !== 'room') return undefined
  return currentFloor.value?.rooms.find(r => r.id === state.selection!.id)
}

function selectedObject(): ObjectData | undefined {
  if (state.selection?.type !== 'object') return undefined
  return currentFloor.value?.objects.find(o => o.id === state.selection!.id)
}

function roomOverlapsAny(rect: Rect, excludeId?: string): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  return floor.rooms.some(r => r.id !== excludeId && aabbOverlap(rect, r))
}

function objectOverlapsAny(rect: Rect, excludeId?: string | string[]): boolean {
  const floor = currentFloor.value
  if (!floor) return false
  const am = assetMap()
  const excluded = Array.isArray(excludeId) ? new Set(excludeId) : excludeId ? new Set([excludeId]) : null
  return floor.objects.some(o => {
    if (excluded && excluded.has(o.id)) return false
    const asset = findAssetCached(am, o.type)
    if (asset?.parts && asset.parts.length > 0) {
      return asset.parts.some(part => {
        const partRect = { x: o.x + part.dx, y: o.y + part.dy, w: part.w, h: part.h }
        return aabbOverlap(rect, partRect)
      })
    }
    return aabbOverlap(rect, o)
  })
}

function recalcCollapsed(floor: FloorData, customAssets?: AssetDef[], changedRect?: Rect) {
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
    const hasParts = asset?.parts && asset.parts.length > 0
    obj.collapsed = floor.objects.some(o => {
      if (o.id === obj.id) return false
      if (!aabbOverlap(obj, o)) return false
      const oAsset = getAsset(o.type)
      if (hasParts) {
        const parts = asset!.parts!
        if (oAsset?.parts && oAsset.parts.length > 0) {
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
      if (oAsset?.parts && oAsset.parts.length > 0) {
        return oAsset.parts.some(op => {
          const or = { x: o.x + op.dx, y: o.y + op.dy, w: op.w, h: op.h }
          return aabbOverlap(obj, or)
        })
      }
      return true
    })
  }
}

function clamp(rect: Rect): Rect {
  const { width, height } = state.layout.canvas
  let { x, y, w, h } = rect
  w = Math.min(w, width)
  h = Math.min(h, height)
  x = Math.max(0, Math.min(x, width - w))
  y = Math.max(0, Math.min(y, height - h))
  return { x, y, w, h }
}

async function addRoom(rect: Rect, label = 'New Room', template?: RoomTemplate): Promise<RoomData | null> {
  const floor = currentFloor.value
  if (!floor) return null
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  if (snapped.w <= 0 || snapped.h <= 0) {
    toast.warning('Room too small - minimum 1 tile')
    return null
  }
  if (roomOverlapsAny(snapped)) {
    toast.warning('Cannot place room - overlaps existing room')
    return null
  }
  pushHistory()
  const room: RoomData = {
    id: genId('r'), ...snapped,
    label: template?.label ?? label,
  }
  if (template?.radius && template.radius > 0) room.radius = template.radius
  if (template?.fillColor) room.fillColor = template.fillColor
  if (template?.rx) room.rx = template.rx
  if (template?.padding && template.padding > 0) room.padding = template.padding
  floor.rooms.push(room)
  state.selection = { type: 'room', id: room.id }
  await saveLayout()
  return room
}

function assetSizeFor(type: string, rotation: Rotation, tileSize?: number, customAssets?: AssetDef[]): { w: number; h: number } | null {
  const asset = customAssets
    ? findAsset(customAssets, type)
    : findAssetCached(assetMap(), type)
  if (!asset) return null
  const t = tileSize ?? state.layout.canvas.tileSize
  const aw = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
  const ah = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
  const swap = rotation === 90 || rotation === 270
  return swap ? { w: ah, h: aw } : { w: aw, h: ah }
}

function normalizeObject(o: ObjectData, tileSize?: number, customAssets?: AssetDef[]): void {
  // Don't resize objects that are part of a linked set - their sizes come from linkedParts
  if (o.linkedIds && o.linkedIds.length > 0) {
    const t = tileSize ?? state.layout.canvas.tileSize
    o.x = Math.round(o.x / t) * t
    o.y = Math.round(o.y / t) * t
    return
  }
  const sz = assetSizeFor(o.type, o.rotation, tileSize, customAssets)
  if (sz) {
    o.w = sz.w
    o.h = sz.h
  }
  const t = tileSize ?? state.layout.canvas.tileSize
  o.x = Math.round(o.x / t) * t
  o.y = Math.round(o.y / t) * t
  const asset = customAssets
    ? findAsset(customAssets, o.type)
    : findAssetCached(assetMap(), o.type)
  if (asset?.defaultRx && !o.rx) {
    o.rx = { ...asset.defaultRx }
  }
}

async function addObject(type: string, x: number, y: number): Promise<ObjectData | null> {
  if (state.mode === 'wall') return null
  const floor = currentFloor.value
  const asset = findAssetCached(assetMap(), type)
  if (!floor || !asset) return null
  const t = state.layout.canvas.tileSize
  const w = snap(asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t)
  const h = snap(asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t)
  const rect = clamp({ x: snap(x), y: snap(y), w, h })

  if (asset.linkedParts && asset.linkedParts.length > 0) {
    const parts = asset.linkedParts
    const partRects = parts.map(p => ({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) }))
    const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
    const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
    const overflowX = Math.max(0, groupMaxX - state.layout.canvas.width)
    const overflowY = Math.max(0, groupMaxY - state.layout.canvas.height)
    if (overflowX > 0 || overflowY > 0) {
      for (const pr of partRects) {
        pr.x -= overflowX
        pr.y -= overflowY
      }
    }
    for (const pr of partRects) {
      if (objectOverlapsAny(pr)) {
        toast.warning('Cannot place - one or more parts overlap existing objects')
        return null
      }
    }
    pushHistory()
    const newIds: string[] = []
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      const pr = partRects[i]
      const partAsset = findAssetCached(assetMap(), p.type)
      const obj: ObjectData = {
        id: genId('o'),
        subId: genId('sub'),
        type: p.type,
        rotation: p.rotation ?? 0,
        ...pr,
      }
      if (asset.defaultPadding) obj.padding = asset.defaultPadding
      if (asset.defaultRx) obj.rx = { ...asset.defaultRx }
      if (asset.defaultBgColor) obj.fillColor = asset.defaultBgColor
      if (partAsset?.defaultPadding && obj.padding === undefined) obj.padding = partAsset.defaultPadding
      if (partAsset?.defaultRx && obj.rx === undefined) obj.rx = { ...partAsset.defaultRx }
      floor.objects.push(obj)
      newIds.push(obj.id)
    }
    for (const id of newIds) {
      const obj = floor.objects.find(o => o.id === id)!
      obj.linkedIds = newIds.filter(otherId => otherId !== id)
    }
    state.selection = { type: 'object', id: newIds[0] }
    state.multiSelection = { type: 'object', ids: newIds }
    await saveLayout()
    return floor.objects.find(o => o.id === newIds[0]) ?? null
  }

  if (objectOverlapsAny(rect)) {
    toast.warning('Cannot place object - overlaps existing object')
    return null
  }
  pushHistory()
  const obj: ObjectData = { id: genId('o'), subId: genId('sub'), type, rotation: 0, ...rect }
  if (asset.defaultPadding !== undefined) obj.padding = asset.defaultPadding
  if (asset.defaultRx) obj.rx = { ...asset.defaultRx }
  if (asset.defaultBgColor) obj.fillColor = asset.defaultBgColor
  floor.objects.push(obj)
  state.selection = { type: 'object', id: obj.id }
  await saveLayout()
  return obj
}

function canPlaceObject(type: string, x: number, y: number): boolean {
  if (state.mode === 'wall') return false
  const asset = findAssetCached(assetMap(), type)
  if (!asset) return false
  const t = state.layout.canvas.tileSize
  const w = snap(asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t)
  const h = snap(asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t)
  const rect = clamp({ x: snap(x), y: snap(y), w, h })
  if (asset.linkedParts && asset.linkedParts.length > 0) {
    const partRects = asset.linkedParts.map(p =>
      ({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) })
    )
    const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
    const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
    const overflowX = Math.max(0, groupMaxX - state.layout.canvas.width)
    const overflowY = Math.max(0, groupMaxY - state.layout.canvas.height)
    if (overflowX > 0 || overflowY > 0) {
      for (const pr of partRects) {
        pr.x -= overflowX
        pr.y -= overflowY
      }
    }
    return partRects.every(pr => !objectOverlapsAny(pr))
  }
  return !objectOverlapsAny(rect)
}

function canPlaceRoom(rect: Rect): boolean {
  const snapped = clamp({ x: snap(rect.x), y: snap(rect.y), w: snap(rect.w), h: snap(rect.h) })
  return snapped.w > 0 && snapped.h > 0 && !roomOverlapsAny(snapped)
}

function select(sel: Selection) {
  state.selection = sel
  state.multiSelection = null
  if (sel) state.selectedAssetId = null
}

function toggleMultiSelect(id: string) {
  if (!state.multiSelection) {
    if (state.selection?.type === 'object' && state.selection.id !== id) {
      state.multiSelection = { type: 'object', ids: [state.selection.id, id] }
    } else {
      state.multiSelection = { type: 'object', ids: [id] }
    }
    state.selection = null
  } else {
    const idx = state.multiSelection.ids.indexOf(id)
    if (idx >= 0) {
      state.multiSelection.ids.splice(idx, 1)
      if (state.multiSelection.ids.length === 0) {
        state.multiSelection = null
      } else if (state.multiSelection.ids.length === 1) {
        state.selection = { type: 'object', id: state.multiSelection.ids[0] }
        state.multiSelection = null
      }
    } else {
      state.multiSelection.ids.push(id)
    }
  }
}

async function deleteSelected(): Promise<void> {
  const floor = currentFloor.value
  if (!floor) return

  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    const allIds = state.multiSelection.ids
    const ids = allIds.filter(id => {
      const o = floor.objects.find(o => o.id === id)
      return !o?.locked
    })
    if (ids.length === 0) {
      toast.warning('All selected objects are locked')
      return
    }
    if (ids.length < allIds.length) {
      toast.info(`${allIds.length - ids.length} locked object(s) skipped`)
    }
    pushHistory()
    cleanupObjectData(ids)
    floor.objects = floor.objects.filter(o => !ids.includes(o.id))
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => !ids.includes(lid))
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
    }
    state.multiSelection = null
    recalcCollapsed(floor)
    await saveLayout()
    return
  }

  if (!state.selection) return
  if (state.selection.type === 'room') {
    const r = floor.rooms.find(r => r.id === state.selection!.id)
    if (r?.locked) {
      toast.warning('Cannot delete a locked hotel wall')
      return
    }
  } else {
    const o = floor.objects.find(o => o.id === state.selection!.id)
    if (o?.locked) {
      toast.warning('Cannot delete a locked object - unlock first')
      return
    }
  }
  pushHistory()
  if (state.selection.type === 'room') {
    floor.rooms = floor.rooms.filter(r => r.id !== state.selection!.id)
  } else {
    const delId = state.selection.id
    cleanupObjectData([delId])
    floor.objects = floor.objects.filter(o => o.id !== delId)
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => lid !== delId)
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
    }
  }
  state.selection = null
  recalcCollapsed(floor)
  await saveLayout()
}

function groupBoundsOf(objs: ObjectData[]): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of objs) {
    minX = Math.min(minX, o.x)
    minY = Math.min(minY, o.y)
    maxX = Math.max(maxX, o.x + o.w)
    maxY = Math.max(maxY, o.y + o.h)
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

function moveSelectedTo(x: number, y: number) {
  const floor = currentFloor.value
  if (!floor) return

  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    const ids = state.multiSelection.ids
    const objs = floor.objects.filter(o => ids.includes(o.id) && !o.locked)
    if (objs.length === 0) return
    const bounds = groupBoundsOf(objs)
    const { width, height } = state.layout.canvas
    const clampedX = Math.max(0, Math.min(x, width - bounds.w))
    const clampedY = Math.max(0, Math.min(y, height - bounds.h))
    const dx = clampedX - bounds.minX
    const dy = clampedY - bounds.minY
    for (const o of objs) {
      o.x += dx
      o.y += dy
    }
    return
  }

  if (!state.selection) return
  if (state.selection.type === 'room') {
    const r = selectedRoom()
    if (!r || r.locked) return
    const rect = clamp({ x, y, w: r.w, h: r.h })
    r.x = rect.x
    r.y = rect.y
  } else {
    const o = selectedObject()
    if (!o || o.locked) return
    const linked = getLinkedObjects(o).filter(l => !l.locked)
    if (linked.length > 0) {
      const group = [o, ...linked]
      const bounds = groupBoundsOf(group)
      const { width, height } = state.layout.canvas
      const clampedX = Math.max(0, Math.min(x, width - bounds.w))
      const clampedY = Math.max(0, Math.min(y, height - bounds.h))
      const dx = clampedX - bounds.minX
      const dy = clampedY - bounds.minY
      for (const m of group) {
        m.x += dx
        m.y += dy
      }
      o.collapsed = floor.objects.some(other => other.id !== o.id && aabbOverlap(o, other))
      return
    }
    const rect = clamp({ x, y, w: o.w, h: o.h })
    o.x = rect.x
    o.y = rect.y
    o.collapsed = floor.objects.some(other => other.id !== o.id && aabbOverlap(o, other))
  }
}

async function commitMove(): Promise<void> {
  const floor = currentFloor.value
  if (!floor) return

  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    const ids = state.multiSelection.ids
    const objs = floor.objects.filter(o => ids.includes(o.id) && !o.locked)
    let moveRect: Rect | undefined
    if (objs.length > 0) {
      const bounds = groupBoundsOf(objs)
      const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
      moveRect = clamped
      const dx = clamped.x - bounds.minX
      const dy = clamped.y - bounds.minY
      const oldPositions = objs.map(o => ({ id: o.id, x: o.x, y: o.y }))
      for (const o of objs) {
        o.x += dx
        o.y += dy
      }
      const groupIds = objs.map(o => o.id)
      const hasOverlap = objs.some(o => objectOverlapsAny(o, groupIds))
      if (hasOverlap) {
        for (const op of oldPositions) {
          const mo = floor.objects.find(fo => fo.id === op.id)
          if (mo) { mo.x = op.x; mo.y = op.y }
        }
      }
    }
    recalcCollapsed(floor, undefined, moveRect)
    await saveLayout()
    return
  }

  if (!state.selection) return
  if (state.selection.type === 'room') {
    const r = selectedRoom()
    if (r) {
      const rect = clamp({ x: snap(r.x), y: snap(r.y), w: r.w, h: r.h })
      if (!roomOverlapsAny(rect, r.id)) {
        r.x = rect.x
        r.y = rect.y
      }
    }
  } else {
    const o = selectedObject()
    if (o && !o.locked) {
      const linked = getLinkedObjects(o)
      if (linked.length > 0) {
        const group = [o, ...linked]
        const groupIds = group.map(m => m.id)
        const oldPositions = group.map(m => ({ id: m.id, x: m.x, y: m.y }))
        const bounds = groupBoundsOf(group)
        const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
        const dx = clamped.x - bounds.minX
        const dy = clamped.y - bounds.minY
        for (const m of group) {
          m.x += dx
          m.y += dy
        }
        const hasOverlap = group.some(m => objectOverlapsAny(m, groupIds))
        if (hasOverlap) {
          for (const op of oldPositions) {
            const mo = floor.objects.find(fo => fo.id === op.id)
            if (mo) { mo.x = op.x; mo.y = op.y }
          }
        }
      } else {
        const rect = clamp({ x: snap(o.x), y: snap(o.y), w: o.w, h: o.h })
        if (!objectOverlapsAny(rect, o.id)) {
          o.x = rect.x
          o.y = rect.y
        }
      }
    }
  }
  const movedObj = selectedObject()
  recalcCollapsed(floor, undefined, movedObj ? { x: movedObj.x, y: movedObj.y, w: movedObj.w, h: movedObj.h } : undefined)
  await saveLayout()
}


async function eraseWallTile(roomId: string, clickX: number, clickY: number) {
  const floor = currentFloor.value
  if (!floor) return
  const room = floor.rooms.find(r => r.id === roomId)
  if (!room) return
  if (room.locked) {
    toast.warning('Cannot erase a locked hotel wall')
    return
  }
  const t = state.layout.canvas.tileSize
  const distLeft = clickX - room.x
  const distRight = (room.x + room.w) - clickX
  const distTop = clickY - room.y
  const distBottom = (room.y + room.h) - clickY
  const minDist = Math.min(distLeft, distRight, distTop, distBottom)
  if (minDist < 0 || minDist > t * 2) return

  pushHistory()
  if (minDist === distLeft && room.w > t) {
    room.x += t
    room.w -= t
  } else if (minDist === distRight && room.w > t) {
    room.w -= t
  } else if (minDist === distTop && room.h > t) {
    room.y += t
    room.h -= t
  } else if (minDist === distBottom && room.h > t) {
    room.h -= t
  } else {
    floor.rooms = floor.rooms.filter(r => r.id !== roomId)
  }
  recalcCollapsed(floor)
  await saveLayout()
}

async function rotateSelected(): Promise<void> {
  if (state.selection?.type !== 'object') return
  const o = selectedObject()
  if (!o) return
  if (o.locked) {
    toast.warning('Cannot rotate a locked object - unlock first')
    return
  }
  const asset = findAssetCached(assetMap(), o.type)
  if (asset?.parts && asset.parts.length > 0) {
    toast.warning('Cannot rotate a merged object - ungroup first')
    return
  }
  if (o.linkedIds && o.linkedIds.length > 0) {
    toast.warning('Cannot rotate a linked object - unlink first')
    return
  }
  const rect = clamp({ x: o.x, y: o.y, w: o.h, h: o.w })
  if (objectOverlapsAny(rect, o.id)) {
    toast.warning('Cannot rotate - would overlap another object')
    return
  }
  pushHistory()
  const nw = o.h
  const nh = o.w
  o.w = nw
  o.h = nh
  o.rotation = ((o.rotation + 90) % 360) as Rotation
  o.x = rect.x
  o.y = rect.y
  const cf = currentFloor.value
  if (cf) recalcCollapsed(cf)
  await saveLayout()
}

async function updateRoomProps(patch: Partial<RoomData>): Promise<boolean> {
  const r = selectedRoom()
  if (!r) return false
  if (r.locked && (patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)) {
    toast.warning('Cannot resize a locked hotel wall')
    return false
  }
  const rect = clamp({
    x: patch.x ?? r.x, y: patch.y ?? r.y,
    w: patch.w ?? r.w, h: patch.h ?? r.h,
  })
  if ((patch.x !== undefined || patch.y !== undefined || patch.w !== undefined || patch.h !== undefined)
    && roomOverlapsAny(rect, r.id)) {
    return false
  }
  if (patch.fillColor !== undefined && !isValidColor(patch.fillColor)) {
    toast.warning('Invalid fill color')
    return false
  }
  const changed = (patch.x !== undefined && r.x !== rect.x) ||
    (patch.y !== undefined && r.y !== rect.y) ||
    (patch.w !== undefined && r.w !== rect.w) ||
    (patch.h !== undefined && r.h !== rect.h) ||
    (patch.label !== undefined && r.label !== (patch.label || '')) ||
    (patch.radius !== undefined && r.radius !== patch.radius) ||
    (patch.locked !== undefined && r.locked !== patch.locked) ||
    (patch.fillColor !== undefined && (r.fillColor ?? '') !== (patch.fillColor || '')) ||
    (patch.rx !== undefined && r.rx !== patch.rx) ||
    (patch.padding !== undefined && r.padding !== patch.padding)
  if (!changed) return true
  pushHistory()
  if (patch.x !== undefined) r.x = rect.x
  if (patch.y !== undefined) r.y = rect.y
  if (patch.w !== undefined) r.w = rect.w
  if (patch.h !== undefined) r.h = rect.h
  if (patch.label !== undefined) r.label = patch.label || ''
  if (patch.radius !== undefined) r.radius = patch.radius
  if (patch.locked !== undefined) r.locked = patch.locked
  if (patch.fillColor !== undefined) r.fillColor = patch.fillColor || undefined
  if (patch.rx !== undefined) r.rx = patch.rx
  if (patch.padding !== undefined) r.padding = patch.padding
  await saveLayout()
  return true
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function isValidColor(c: string | undefined): boolean {
  return !c || (typeof c === 'string' && HEX_COLOR_RE.test(c))
}

async function updateObjectProps(patch: Partial<ObjectData>): Promise<boolean> {
  const o = selectedObject()
  if (!o) return false
  if (o.locked && patch.locked === undefined) {
    toast.warning('Object is locked - unlock to edit properties')
    return false
  }
  if (patch.fillColor !== undefined && !isValidColor(patch.fillColor)) {
    toast.warning('Invalid fill color')
    return false
  }
  const needsSize = patch.x !== undefined || patch.y !== undefined
  const sz = assetSizeFor(o.type, o.rotation)
  const w = sz?.w ?? o.w
  const h = sz?.h ?? o.h
  const rect = clamp({
    x: patch.x ?? o.x, y: patch.y ?? o.y,
    w, h,
  })
  if (needsSize && objectOverlapsAny(rect, o.id)) {
    return false
  }
  const changed = (patch.x !== undefined && o.x !== rect.x) ||
    (patch.y !== undefined && o.y !== rect.y) ||
    (needsSize && (o.w !== w || o.h !== h)) ||
    (patch.radius !== undefined && o.radius !== patch.radius) ||
    (patch.rx !== undefined && o.rx !== patch.rx) ||
    (patch.labelPadding !== undefined && o.labelPadding !== patch.labelPadding) ||
    (patch.padding !== undefined && o.padding !== patch.padding) ||
    (patch.fillColor !== undefined && (o.fillColor ?? '') !== (patch.fillColor || '')) ||
    (patch.locked !== undefined && o.locked !== patch.locked) ||
    (patch.label !== undefined && (o.label ?? '') !== (patch.label || ''))
  if (!changed) return true
  pushHistory()
  if (patch.x !== undefined) o.x = rect.x
  if (patch.y !== undefined) o.y = rect.y
  if (needsSize) {
    o.w = w
    o.h = h
  }
  if (patch.radius !== undefined) o.radius = patch.radius
  if (patch.rx !== undefined) o.rx = patch.rx
  if (patch.labelPadding !== undefined) o.labelPadding = patch.labelPadding
  if (patch.padding !== undefined) o.padding = patch.padding
  if (patch.fillColor !== undefined) o.fillColor = patch.fillColor || undefined
  if (patch.locked !== undefined) o.locked = patch.locked
  if (patch.label !== undefined) o.label = patch.label || undefined
  const cf = currentFloor.value
  if (cf) recalcCollapsed(cf)
  await saveLayout()
  return true
}

function setMode(mode: EditorMode) {
  state.mode = mode
  state.selection = null
  state.multiSelection = null
}

async function resizeCanvas(width: number, height: number, tileSize: number): Promise<void> {
  const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
  const w = Math.max(t, Math.round(width / t) * t)
  const h = Math.max(t, Math.round(height / t) * t)
  pushHistory()
  state.layout.canvas = { width: w, height: h, tileSize: t }
  invalidateAssetMap()
  for (const asset of state.layout.customAssets) {
    if (asset.linkedParts && asset.linkedParts.length > 0) {
      for (const p of asset.linkedParts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
    if (asset.parts && asset.parts.length > 0) {
      for (const p of asset.parts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
  }
  for (const floor of state.layout.floors) {
    for (const r of floor.rooms) {
      const snapped = clamp({ x: Math.round(r.x / t) * t, y: Math.round(r.y / t) * t, w: Math.round(r.w / t) * t || t, h: Math.round(r.h / t) * t || t })
      Object.assign(r, snapped)
    }
    for (const o of floor.objects) {
      normalizeObject(o)
      const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
      o.x = snapped.x
      o.y = snapped.y
    }
  }
  await saveLayout()
}

async function addRoomTemplate(room: RoomData, name: string, category?: string): Promise<RoomTemplate> {
  const tpl: RoomTemplate = {
    id: genId('roomtpl'),
    name: name.trim() || room.label || 'Room Template',
    category: (category && category.trim()) || 'Rooms',
    w: room.w,
    h: room.h,
    label: room.label,
  }
  if (room.radius && room.radius > 0) tpl.radius = room.radius
  if (room.fillColor) tpl.fillColor = room.fillColor
  if (room.rx) tpl.rx = room.rx
  if (room.padding && room.padding > 0) tpl.padding = room.padding
  pushHistory()
  if (!state.layout.roomTemplates) state.layout.roomTemplates = []
  state.layout.roomTemplates.push(tpl)
  await saveLayout()
  return tpl
}

async function deleteRoomTemplate(id: string): Promise<void> {
  if (!state.layout.roomTemplates) return
  pushHistory()
  state.layout.roomTemplates = state.layout.roomTemplates.filter(t => t.id !== id)
  await saveLayout()
}

async function addRoomFromTemplate(templateId: string, x: number, y: number): Promise<RoomData | null> {
  const tpl = findRoomTemplate(templateId)
  if (!tpl) return null
  return addRoom({ x, y, w: tpl.w, h: tpl.h }, tpl.label, tpl)
}

async function addCustomAsset(name: string, w: number, h: number, category?: string, pxW?: number, pxH?: number, defaultRx?: { tl: number; tr: number; br: number; bl: number }, defaultBgColor?: string): Promise<AssetDef> {
  const safeW = Math.max(1, Math.floor(w))
  const safeH = Math.max(1, Math.floor(h))
  const safeCat = (category && category.trim()) || 'Misc'
  const asset: AssetDef = { id: genId('custom'), name, category: safeCat, w: safeW, h: safeH, custom: true }
  if (pxW !== undefined && pxW > 0) asset.pxW = Math.floor(pxW)
  if (pxH !== undefined && pxH > 0) asset.pxH = Math.floor(pxH)
  if (defaultRx && (defaultRx.tl > 0 || defaultRx.tr > 0 || defaultRx.br > 0 || defaultRx.bl > 0)) asset.defaultRx = defaultRx
  if (defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(defaultBgColor)) asset.defaultBgColor = defaultBgColor
  pushHistory()
  state.layout.customAssets.push(asset)
  invalidateAssetMap()
  await saveLayout()
  return asset
}

async function updateCustomAsset(id: string, patch: Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'category' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultRx' | 'defaultBgColor'>>): Promise<void> {
  let asset = state.layout.customAssets.find(a => a.id === id)
  if (!asset) return
  pushHistory()
  if (patch.name !== undefined) asset.name = patch.name
  if (patch.w !== undefined) asset.w = Math.max(1, Math.floor(patch.w))
  if (patch.h !== undefined) asset.h = Math.max(1, Math.floor(patch.h))
  if (patch.category !== undefined) asset.category = patch.category
  if (patch.usePx !== undefined) asset.usePx = patch.usePx
  if (patch.pxW !== undefined) asset.pxW = patch.pxW > 0 ? Math.floor(patch.pxW) : undefined
  if (patch.pxH !== undefined) asset.pxH = patch.pxH > 0 ? Math.floor(patch.pxH) : undefined
  if (patch.defaultPadding !== undefined) asset.defaultPadding = patch.defaultPadding > 0 ? patch.defaultPadding : undefined
  if (patch.defaultRx !== undefined) {
    const r = patch.defaultRx
    asset.defaultRx = (r.tl > 0 || r.tr > 0 || r.br > 0 || r.bl > 0) ? r : undefined
  }
  if (patch.defaultBgColor !== undefined) {
    asset.defaultBgColor = (patch.defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(patch.defaultBgColor)) ? patch.defaultBgColor : undefined
  }

  const t = state.layout.canvas.tileSize
  const newW = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
  const newH = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
  const collapsedIds: string[] = []

  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.type !== id) continue
      obj.w = newW
      obj.h = newH
      const clamped = clamp({ x: obj.x, y: obj.y, w: newW, h: newH })
      obj.x = clamped.x
      obj.y = clamped.y
      if (asset.defaultPadding && asset.defaultPadding > 0) {
        obj.padding = asset.defaultPadding
      } else if (obj.padding !== undefined && patch.defaultPadding !== undefined) {
        obj.padding = undefined
      }
      if (patch.defaultRx !== undefined) {
        obj.rx = asset.defaultRx ? { ...asset.defaultRx } : undefined
      }
      if (patch.defaultBgColor !== undefined) {
        obj.fillColor = asset.defaultBgColor || undefined
      }
      const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
      obj.collapsed = overlaps
      if (overlaps) collapsedIds.push(obj.id)
    }
  }

  if (collapsedIds.length > 0) {
    toast.error(`${collapsedIds.length} object(s) collapsed due to overlap - shown in red`)
  }

  invalidateAssetMap()
}

async function deleteCustomAsset(id: string): Promise<void> {
  let removedCount = 0
  for (const floor of state.layout.floors) {
    removedCount += floor.objects.filter(o => o.type === id).length
  }
  pushHistory()
  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== id)
  invalidateAssetMap()
  for (const floor of state.layout.floors) {
    const removedIds = new Set(floor.objects.filter(o => o.type === id).map(o => o.id))
    cleanupObjectData([...removedIds])
    floor.objects = floor.objects.filter(o => o.type !== id)
    for (const o of floor.objects) {
      if (o.linkedIds) {
        o.linkedIds = o.linkedIds.filter(lid => !removedIds.has(lid))
        if (o.linkedIds.length === 0) delete o.linkedIds
      }
    }
  }
  if (state.selectedAssetId === id) state.selectedAssetId = null
  if (removedCount > 0) {
    toast.info(`Removed ${removedCount} object(s) using this asset`)
  }
  await saveLayout()
}

/* ---------- Asset Category CRUD ---------- */
async function addAssetCategory(name: string): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) {
    toast.warning('Category name cannot be empty')
    return null
  }
  if (state.layout.assetCategories.includes(trimmed)) {
    toast.warning('Category already exists')
    return null
  }
  pushHistory()
  state.layout.assetCategories.push(trimmed)
  await saveLayout()
  return trimmed
}

async function renameAssetCategory(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) return
  if (state.layout.assetCategories.includes(trimmed)) {
    toast.warning('Category already exists')
    return
  }
  pushHistory()
  const idx = state.layout.assetCategories.indexOf(oldName)
  if (idx >= 0) state.layout.assetCategories[idx] = trimmed
  for (const a of state.layout.customAssets) {
    if (a.category === oldName) a.category = trimmed
  }
  invalidateAssetMap()
  await saveLayout()
}

async function deleteAssetCategory(name: string): Promise<void> {
  const inUse = state.layout.customAssets.some(a => a.category === name)
  if (inUse) {
    toast.warning('Cannot delete - assets are using this category')
    return
  }
  pushHistory()
  state.layout.assetCategories = state.layout.assetCategories.filter(c => c !== name)
  await saveLayout()
}

/* ---------- Merge / Ungroup ---------- */
function rotatedCorners(obj: ObjectData): [number, number][] {
  const cx = obj.x + obj.w / 2
  const cy = obj.y + obj.h / 2
  const rad = (obj.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = obj.w / 2
  const hh = obj.h / 2
  const corners: [number, number][] = [
    [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
  ]
  return corners.map(([dx, dy]) => [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos,
  ])
}

function buildCompositeParts(objs: ObjectData[]): { parts: CompositePart[]; minX: number; minY: number; totalW: number; totalH: number } {
  // IMPORTANT: rotateSelected() already swaps w/h and adjusts x/y.
  // So obj.w/h are the VISUAL dimensions after rotation.
  // Do NOT use rotatedCorners() here - it would double-rotate.
  // Do NOT set part.rotation to obj.rotation - parts are already in visual orientation.
  // Changing this will break merged objects with rotated parts.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const obj of objs) {
    minX = Math.min(minX, obj.x)
    minY = Math.min(minY, obj.y)
    maxX = Math.max(maxX, obj.x + obj.w)
    maxY = Math.max(maxY, obj.y + obj.h)
  }

  const totalW = maxX - minX
  const totalH = maxY - minY

  const parts: CompositePart[] = objs.map(obj => {
    return {
      dx: Math.round(obj.x - minX),
      dy: Math.round(obj.y - minY),
      w: Math.round(obj.w),
      h: Math.round(obj.h),
      rotation: 0,
      type: obj.type,
    }
  })

  return { parts, minX, minY, totalW, totalH }
}

async function mergeObjects(ids: string[]): Promise<string | null> {
  const floor = currentFloor.value
  if (!floor || ids.length < 2) return null

  const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
  if (objs.length < 2) return null
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot merge locked objects - unlock first')
    return null
  }

  const { parts, minX, minY, totalW, totalH } = buildCompositeParts(objs)
  const t = state.layout.canvas.tileSize

  const assetId = genId('merged')
  const assetDef: AssetDef = {
    id: assetId,
    name: `Merged ${objs.length}`,
    category: 'Merged',
    w: Math.round(totalW / t),
    h: Math.round(totalH / t),
    custom: true,
    parts,
  }

  pushHistory()
  state.layout.customAssets.push(assetDef)
  invalidateAssetMap()
  if (!state.layout.assetCategories.includes('Merged')) {
    state.layout.assetCategories.push('Merged')
  }

  const allMergedIds = new Set(ids)
  for (const obj of objs) {
    if (obj.linkedIds) {
      for (const lid of obj.linkedIds) allMergedIds.add(lid)
    }
  }
  for (const o of floor.objects) {
    if (!o.linkedIds) continue
    o.linkedIds = o.linkedIds.filter(lid => !allMergedIds.has(lid))
    if (o.linkedIds.length === 0) delete o.linkedIds
  }

  cleanupObjectData(ids)
  floor.objects = floor.objects.filter(o => !ids.includes(o.id))

  const newObj: ObjectData = {
    id: genId('o'),
    subId: genId('sub'),
    type: assetId,
    x: minX,
    y: minY,
    w: totalW,
    h: totalH,
    rotation: 0,
  }

  const overlaps = floor.objects.some(o => aabbOverlap(newObj, o))
  newObj.collapsed = overlaps

  floor.objects.push(newObj)

  state.selection = { type: 'object', id: newObj.id }
  state.multiSelection = null

  toast.success(`Merged ${objs.length} objects into 1`)
  await saveLayout()
  return newObj.id
}

async function createCompositeAssetFromSelection(name?: string, category?: string): Promise<string | null> {
  const floor = currentFloor.value
  if (!floor) return null
  const ids = state.multiSelection?.ids
  if (!ids || ids.length < 2) {
    toast.warning('Select at least 2 objects first (Shift+click)')
    return null
  }

  const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
  if (objs.length < 2) return null
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot merge locked objects - unlock first')
    return null
  }

  const { parts, totalW, totalH } = buildCompositeParts(objs)
  const t = state.layout.canvas.tileSize

  const safeName = (name && name.trim()) || `Composite ${objs.length}`
  const safeCat = (category && category.trim()) || 'Composite'
  const assetId = genId('composite')
  const assetDef: AssetDef = {
    id: assetId,
    name: safeName,
    category: safeCat,
    w: Math.round(totalW / t),
    h: Math.round(totalH / t),
    custom: true,
    parts,
  }

  pushHistory()
  state.layout.customAssets.push(assetDef)
  invalidateAssetMap()
  if (!state.layout.assetCategories.includes(safeCat)) {
    state.layout.assetCategories.push(safeCat)
  }

  toast.success(`Created "${safeName}" composite asset - find it in the ${safeCat} category`)
  await saveLayout()
  return assetId
}

async function createLinkedAssetFromSelection(name?: string, category?: string): Promise<string | null> {
  const floor = currentFloor.value
  if (!floor) return null
  const ids = state.multiSelection?.ids
  if (!ids || ids.length < 2) {
    toast.warning('Select at least 2 objects first (Shift+click)')
    return null
  }

  const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
  if (objs.length < 2) return null
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot link locked objects - unlock first')
    return null
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const obj of objs) {
    minX = Math.min(minX, obj.x)
    minY = Math.min(minY, obj.y)
    maxX = Math.max(maxX, obj.x + obj.w)
    maxY = Math.max(maxY, obj.y + obj.h)
  }
  minX = snap(Math.round(minX))
  minY = snap(Math.round(minY))
  maxX = snap(Math.round(maxX))
  maxY = snap(Math.round(maxY))

  const totalW = maxX - minX
  const totalH = maxY - minY
  const t = state.layout.canvas.tileSize

  const linkedParts: LinkedPart[] = objs.map(obj => ({
    type: obj.type,
    dx: snap(Math.round(obj.x - minX)),
    dy: snap(Math.round(obj.y - minY)),
    w: snap(Math.round(obj.w)),
    h: snap(Math.round(obj.h)),
    rotation: obj.rotation,
  }))

  const safeName = (name && name.trim()) || `Linked Set ${objs.length}`
  const safeCat = (category && category.trim()) || 'Linked Sets'
  const assetId = genId('linked')
  const assetDef: AssetDef = {
    id: assetId,
    name: safeName,
    category: safeCat,
    w: Math.round(totalW / t),
    h: Math.round(totalH / t),
    custom: true,
    linkedParts,
  }

  pushHistory()
  state.layout.customAssets.push(assetDef)
  invalidateAssetMap()
  if (!state.layout.assetCategories.includes(safeCat)) {
    state.layout.assetCategories.push(safeCat)
  }

  toast.success(`Created "${safeName}" linked asset - find it in the ${safeCat} category`)
  await saveLayout()
  return assetId
}

async function ungroupObject(id: string): Promise<string[] | null> {
  const floor = currentFloor.value
  if (!floor) return null

  const obj = floor.objects.find(o => o.id === id)
  if (!obj) return null
  if (obj.locked) {
    toast.warning('Cannot ungroup a locked object - unlock first')
    return null
  }

  const asset = findAssetCached(assetMap(), obj.type)
  if (!asset?.parts || asset.parts.length === 0) {
    toast.warning('This object is not a merged group')
    return null
  }

  pushHistory()

  if (obj.linkedIds) {
    for (const linkedId of obj.linkedIds) {
      const linked = floor.objects.find(o => o.id === linkedId)
      if (linked?.linkedIds) {
        linked.linkedIds = linked.linkedIds.filter(lid => lid !== id)
        if (linked.linkedIds.length === 0) delete linked.linkedIds
      }
    }
  }

  const newIds: string[] = []
  for (const part of asset.parts) {
    const t = state.layout.canvas.tileSize
    const partW = Math.round(part.w / t)
    const partH = Math.round(part.h / t)
    let typeId: string
    if (part.type && state.layout.customAssets.some(a => a.id === part.type)) {
      typeId = part.type
    } else {
      const customMatch = state.layout.customAssets.find(a => a.w === partW && a.h === partH && (!a.parts || a.parts.length === 0))
      typeId = customMatch?.id ?? 'unknown'
    }
    const newObj: ObjectData = {
      id: genId('o'),
      subId: genId('sub'),
      type: typeId,
      x: obj.x + part.dx,
      y: obj.y + part.dy,
      w: part.w,
      h: part.h,
      rotation: part.rotation ?? 0,
    }
    const partAssetDef = findAssetCached(assetMap(), typeId)
    if (partAssetDef?.defaultPadding !== undefined) newObj.padding = partAssetDef.defaultPadding
    if (partAssetDef?.defaultRx) newObj.rx = { ...partAssetDef.defaultRx }
    const overlaps = floor.objects.some(o => aabbOverlap(newObj, o))
    newObj.collapsed = overlaps
    floor.objects.push(newObj)
    newIds.push(newObj.id)
  }

  floor.objects = floor.objects.filter(o => o.id !== id)
  cleanupObjectData([id])

  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== asset.id)
  invalidateAssetMap()

  state.multiSelection = { type: 'object', ids: newIds }
  state.selection = null

  toast.success(`Ungrouped into ${newIds.length} objects`)
  await saveLayout()
  return newIds
}

/* ---------- Linked Objects ---------- */
function getLinkedObjects(obj: ObjectData): ObjectData[] {
  const floor = currentFloor.value
  if (!floor || !obj.linkedIds || obj.linkedIds.length === 0) return []
  return floor.objects.filter(o => obj.linkedIds!.includes(o.id))
}

async function linkObjects(ids: string[]): Promise<boolean> {
  const floor = currentFloor.value
  if (!floor || ids.length < 2) return false
  const objs = floor.objects.filter(o => ids.includes(o.id))
  if (objs.length < 2) {
    toast.warning('Some selected objects not found on current floor')
    return false
  }
  if (objs.some(o => o.locked)) {
    toast.warning('Cannot link locked objects - unlock first')
    return false
  }

  pushHistory()
  // Union all pre-existing linked groups of the selected objects into one fully-connected group
  const groupIds = new Set<string>()
  for (const obj of objs) {
    groupIds.add(obj.id)
    if (obj.linkedIds) {
      for (const lid of obj.linkedIds) groupIds.add(lid)
    }
  }
  const allGroupIds = Array.from(groupIds)
  for (const id of allGroupIds) {
    const obj = floor.objects.find(o => o.id === id)
    if (!obj) continue
    obj.linkedIds = allGroupIds.filter(oid => oid !== id)
  }
  toast.success(`Linked ${allGroupIds.length} objects`)
  await saveLayout()
  return true
}

async function unlinkObject(id: string): Promise<boolean> {
  const floor = currentFloor.value
  if (!floor) return false
  const obj = floor.objects.find(o => o.id === id)
  if (!obj || !obj.linkedIds || obj.linkedIds.length === 0) return false
  if (obj.locked) {
    toast.warning('Cannot unlink a locked object - unlock first')
    return false
  }

  pushHistory()
  for (const linkedId of obj.linkedIds) {
    const linked = floor.objects.find(o => o.id === linkedId)
    if (linked?.linkedIds) {
      linked.linkedIds = linked.linkedIds.filter(lid => lid !== id)
      if (linked.linkedIds.length === 0) delete linked.linkedIds
    }
  }
  delete obj.linkedIds
  toast.success('Unlinked object')
  await saveLayout()
  return true
}


async function addFloor(): Promise<FloorData> {
  pushHistory()
  const n = state.layout.floors.length
  const floor: FloorData = { id: genId('floor'), name: `New Floor`, label: `F${n}`, rooms: [], objects: [], zones: [] }
  state.layout.floors.push(floor)
  await saveLayout()
  return floor
}

async function deleteFloor(id: string) {
  if (state.layout.floors.length <= 1) return
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  cleanupObjectData(floor.objects.map(o => o.id))
  state.layout.floors = state.layout.floors.filter(f => f.id !== id)
  if (state.currentFloorId === id) {
    state.currentFloorId = state.layout.floors[0].id
  }
  state.selection = null
  state.multiSelection = null
  await saveLayout()
}

async function duplicateFloor(id: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  const copy: FloorData = JSON.parse(JSON.stringify(floor))
  copy.id = genId('floor')
  copy.name = `${floor.name} Copy`
  copy.rooms.forEach(r => (r.id = genId('r')))
  if (copy.zones) {
    copy.zones.forEach(z => (z.id = genId('zone')))
  }
  const idMap = new Map<string, string>()
  for (const o of copy.objects) {
    const newId = genId('o')
    idMap.set(o.id, newId)
    o.id = newId
    o.subId = genId('sub')
  }
  for (const o of copy.objects) {
    if (o.linkedIds) {
      o.linkedIds = o.linkedIds.map(lid => idMap.get(lid) ?? lid).filter(lid => idMap.has(lid))
      if (o.linkedIds.length === 0) delete o.linkedIds
    }
  }
  const idx = state.layout.floors.findIndex(f => f.id === id)
  state.layout.floors.splice(idx + 1, 0, copy)
  await saveLayout()
}

async function renameFloor(id: string, name: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  floor.name = name
  await saveLayout()
}

async function reorderFloors(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  if (fromIndex < 0 || toIndex < 0) return
  if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return
  pushHistory()
  const floors = state.layout.floors
  const [moved] = floors.splice(fromIndex, 1)
  floors.splice(toIndex, 0, moved)
  await saveLayout()
}

async function clearFloor(id: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  cleanupObjectData(floor.objects.map(o => o.id))
  floor.rooms = []
  floor.objects = []
  floor.zones = []
  state.selection = null
  state.multiSelection = null
  await saveLayout()
}

async function clearAllFloors() {
  pushHistory()
  for (const floor of state.layout.floors) {
    cleanupObjectData(floor.objects.map(o => o.id))
    floor.rooms = []
    floor.objects = []
    floor.zones = []
  }
  state.selection = null
  state.multiSelection = null
  await saveLayout()
}

function selectFloor(id: string) {
  state.currentFloorId = id
  state.selection = null
  state.multiSelection = null
}

let saveDebounceTimer: number | null = null
let isSaving = false
const MAX_SAVE_RETRIES = 3

async function saveLayout() {
  if (isSaving) {
    if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer)
    saveDebounceTimer = window.setTimeout(() => saveLayout(), EDITOR_CONFIG.saveDebounceMs)
    return
  }

  isSaving = true
  const data = state.layout
  const ts = `// Auto-generated by Blueprint Editor - ${new Date().toISOString()}
import type { LayoutData } from './types'

const SAVED_LAYOUT: LayoutData = ${JSON.stringify(data, null, 2)}
`

  const attemptSave = async (attempt: number): Promise<boolean> => {
    try {
      const res = await fetch(EDITOR_CONFIG.saveEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: ts,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return true
    } catch (e) {
      editorLog.error('saveLayout attempt ' + attempt, e)
      if (attempt < MAX_SAVE_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        return attemptSave(attempt + 1)
      }
      return false
    }
  }

  const success = await attemptSave(1)
  if (!success) {
    editorLog.error('saveLayout', 'All retries failed')
    toast.error('Failed to save - falling back to download')
    const blob = new Blob([ts], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'editor-store-layout.ts'
    a.click()
    URL.revokeObjectURL(url)
  }

  isSaving = false
  if (saveDebounceTimer) {
    window.clearTimeout(saveDebounceTimer)
    saveDebounceTimer = null
    saveLayout()
  }
}

const SYNC_KEY = EDITOR_CONFIG.syncKey

/* ---------- Custom Properties ---------- */
function cleanupObjectData(ids: string[]): void {
  const subIdsToRemove = new Set<string>()
  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      if (ids.includes(obj.id) && obj.subId) {
        subIdsToRemove.add(obj.subId)
      }
    }
  }
  for (const subId of subIdsToRemove) {
    delete state.layout.objectCustomProps[subId]
    delete state.layout.instanceLabels[subId]
    delete state.layout.validationRules[subId]
  }
}

function getObjectCustomProps(subId: string): ObjectCustomProps | undefined {
  return state.layout.objectCustomProps[subId]
}

async function setObjectCustomProps(subId: string, props: ObjectCustomProps): Promise<void> {
  state.layout.objectCustomProps[subId] = props
  pushHistory()
  await saveLayout()
}

async function deleteObjectCustomProps(subId: string): Promise<void> {
  delete state.layout.objectCustomProps[subId]
  pushHistory()
  await saveLayout()
}

/* ---------- Instance Labels ---------- */
function getInstanceLabel(subId: string): string | undefined {
  return state.layout.instanceLabels[subId]
}

async function setInstanceLabel(subId: string, label: string): Promise<void> {
  state.layout.instanceLabels[subId] = label
  pushHistory()
  await saveLayout()
}

async function deleteInstanceLabel(subId: string): Promise<void> {
  delete state.layout.instanceLabels[subId]
  pushHistory()
  await saveLayout()
}

/* ---------- Validation Rules ---------- */
function getValidationRule(subId: string): ValidationRule | undefined {
  return state.layout.validationRules[subId]
}

async function setValidationRule(subId: string, rule: ValidationRule): Promise<void> {
  state.layout.validationRules[subId] = rule
  pushHistory()
  await saveLayout()
}

async function deleteValidationRule(subId: string): Promise<void> {
  delete state.layout.validationRules[subId]
  pushHistory()
  await saveLayout()
}

/* ---------- Search/Filter ---------- */
function findObjectsByTag(tag: string): ObjectData[] {
  const results: ObjectData[] = []
  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      if (!obj.subId) continue
      const props = state.layout.objectCustomProps[obj.subId]
      if (props?.tags?.includes(tag)) {
        results.push(obj)
      }
    }
  }
  return results
}

function findObjectsByTagOnCurrentFloor(tag: string): ObjectData[] {
  const floor = currentFloor.value
  if (!floor) return []
  const results: ObjectData[] = []
  for (const obj of floor.objects) {
    if (!obj.subId) continue
    const props = state.layout.objectCustomProps[obj.subId]
    if (props?.tags?.includes(tag)) {
      results.push(obj)
    }
  }
  return results
}

function editorFloorLabelToFloorId(label: string): string | null {
  if (label === 'G') return 'G'
  const match = label.match(/^F(\d+)$/)
  if (match) {
    return match[1]
  }
  return null
}

function syncToGame(): boolean {
  try {
    const synced: Record<string, Array<{ id: string; x: number; y: number; w: number; h: number; label: string; sub: string; radius: number }>> = {}
    for (const floor of state.layout.floors) {
      const floorId = editorFloorLabelToFloorId(floor.label)
      if (!floorId) continue
      synced[floorId] = floor.rooms.map(r => ({
        id: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        label: r.label,
        sub: '',
        radius: r.radius ?? 0,
      }))
    }
    localStorage.setItem(SYNC_KEY, JSON.stringify({ version: 1, floors: synced, timestamp: Date.now() }))
    return true
  } catch (e) {
    editorLog.error('syncToGame', e)
    toast.error('Sync failed - storage error')
    return false
  }
}

/* ---------- Zone Marks ---------- */
async function addZone(x: number, y: number, w: number, h: number, label?: string, color?: string): Promise<ZoneData | null> {
  const floor = currentFloor.value
  if (!floor) return null
  pushHistory()
  const rect = clamp({ x: snap(x), y: snap(y), w: snap(w), h: snap(h) })
  const zone: ZoneData = { id: genId('zone'), x: rect.x, y: rect.y, w: rect.w, h: rect.h, label: label || 'New Zone', color: color || '#06b6d4' }
  if (!floor.zones) floor.zones = []
  floor.zones.push(zone)
  await saveLayout()
  return zone
}

async function updateZone(id: string, patch: Partial<ZoneData>): Promise<void> {
  const floor = currentFloor.value
  if (!floor?.zones) return
  const z = floor.zones.find(z => z.id === id)
  if (!z) return
  pushHistory()
  if (patch.x !== undefined) z.x = clamp({ x: snap(patch.x), y: z.y, w: z.w, h: z.h }).x
  if (patch.y !== undefined) z.y = clamp({ x: z.x, y: snap(patch.y), w: z.w, h: z.h }).y
  if (patch.w !== undefined) z.w = clamp({ x: z.x, y: z.y, w: snap(patch.w), h: z.h }).w
  if (patch.h !== undefined) z.h = clamp({ x: z.x, y: z.y, w: z.w, h: snap(patch.h) }).h
  if (patch.label !== undefined) z.label = patch.label
  if (patch.color !== undefined) z.color = patch.color
  await saveLayout()
}

async function deleteZone(id: string): Promise<void> {
  const floor = currentFloor.value
  if (!floor?.zones) return
  pushHistory()
  floor.zones = floor.zones.filter(z => z.id !== id)
  if (floor.zones.length === 0) delete floor.zones
  await saveLayout()
}

/* ---------- Copy / Paste ---------- */
let clipboard: ObjectData[] | null = null

function copySelected() {
  const floor = currentFloor.value
  if (!floor) return
  if (state.multiSelection && state.multiSelection.ids.length > 0) {
    clipboard = floor.objects
      .filter(o => state.multiSelection!.ids.includes(o.id))
      .map(o => ({ ...o }))
    toast.info(`Copied ${clipboard.length} object(s)`)
  } else if (state.selection?.type === 'object') {
    const o = floor.objects.find(o => o.id === state.selection!.id)
    if (o) {
      clipboard = [{ ...o }]
      toast.info('Copied 1 object')
    }
  }
}

async function pasteObjects() {
  const floor = currentFloor.value
  if (!floor || !clipboard || clipboard.length === 0) return
  const tileSize = state.layout.canvas.tileSize
  const offset = tileSize
  const newIds: string[] = []
  const idMap = new Map<string, string>()
  const pendingCopies: ObjectData[] = []
  for (const c of clipboard) {
    const newId = genId('o')
    idMap.set(c.id, newId)
    const rawX = c.x + offset
    const rawY = c.y + offset
    const rect = clamp({ x: snap(rawX), y: snap(rawY), w: c.w, h: c.h })
    if (objectOverlapsAny(rect)) {
      toast.warning(`Skipped pasting "${c.type}" - would overlap existing object`)
      continue
    }
    newIds.push(newId)
    const { locked, collapsed, linkedIds, ...rest } = c
    const copy: ObjectData = {
      ...rest,
      id: newId,
      subId: genId('sub'),
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
    }
    pendingCopies.push(copy)
  }
  if (pendingCopies.length === 0) {
    toast.warning('Paste failed - all objects would overlap')
    return
  }
  pushHistory()
  for (const copy of pendingCopies) {
    floor.objects.push(copy)
  }
  for (const c of clipboard) {
    if (!c.linkedIds || c.linkedIds.length === 0) continue
    const newId = idMap.get(c.id)
    if (!newId || !newIds.includes(newId)) continue
    const remapped = c.linkedIds
      .map(lid => idMap.get(lid))
      .filter((lid): lid is string => lid !== undefined && newIds.includes(lid))
    if (remapped.length > 0) {
      const obj = floor.objects.find(o => o.id === newId)
      if (obj) obj.linkedIds = remapped
    }
  }
  if (newIds.length > 1) {
    state.multiSelection = { type: 'object', ids: newIds }
    state.selection = null
  } else {
    state.selection = { type: 'object', id: newIds[0] }
    state.multiSelection = null
  }
  recalcCollapsed(floor)
  await saveLayout()
  toast.success(`Pasted ${newIds.length} object(s)`)
}

/* ---------- Toggle Object Lock ---------- */
async function toggleObjectLock(id: string): Promise<void> {
  const floor = currentFloor.value
  if (!floor) return
  const o = floor.objects.find(o => o.id === id)
  if (!o) return
  pushHistory()
  o.locked = !o.locked
  toast.info(o.locked ? 'Object locked' : 'Object unlocked')
  await saveLayout()
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    const hot = import.meta.hot!
    hot.data._editorLayout = JSON.stringify(state.layout)
    hot.data._editorState = {
      currentFloorId: state.currentFloorId,
      mode: state.mode,
      selection: state.selection,
      multiSelection: state.multiSelection,
      selectedAssetId: state.selectedAssetId,
      undoStack: [...undoStack.value],
      redoStack: [...redoStack.value],
    }
  })
}

export function useEditorStore() {
  return {
    state,
    currentFloor,
    snap,
    assetMap,
    selectedRoom,
    selectedObject,
    addRoom,
    addRoomFromTemplate,
    addRoomTemplate,
    deleteRoomTemplate,
    addObject,
    canPlaceObject,
    canPlaceRoom,
    select,
    selectAsset,
    selectedAsset,
    deleteSelected,
    pushHistory,
    commitMove,
    moveSelectedTo,
    eraseWallTile,
    rotateSelected,
    updateRoomProps,
    updateObjectProps,
    setMode,
    resizeCanvas,
    addCustomAsset,
    updateCustomAsset,
    deleteCustomAsset,
    addAssetCategory,
    renameAssetCategory,
    deleteAssetCategory,
    toggleMultiSelect,
    mergeObjects,
    createCompositeAssetFromSelection,
    createLinkedAssetFromSelection,
    ungroupObject,
    linkObjects,
    unlinkObject,
    getLinkedObjects,
    addFloor,
    deleteFloor,
    duplicateFloor,
    renameFloor,
    reorderFloors,
    clearFloor,
    clearAllFloors,
    selectFloor,
    syncToGame,
    saveLayout,
    undo,
    redo,
    canUndo: computed(() => undoStack.value.length > 0),
    canRedo: computed(() => redoStack.value.length > 0),
    addZone,
    updateZone,
    deleteZone,
    copySelected,
    pasteObjects,
    toggleObjectLock,
    getObjectCustomProps,
    setObjectCustomProps,
    deleteObjectCustomProps,
    getInstanceLabel,
    setInstanceLabel,
    deleteInstanceLabel,
    getValidationRule,
    setValidationRule,
    deleteValidationRule,
    findObjectsByTag,
    findObjectsByTagOnCurrentFloor,
  }
}
