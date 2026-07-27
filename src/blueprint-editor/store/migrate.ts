import type { LayoutData, RoomData, ObjectData, AssetBase, AssetDef, LinkedPart, Rotation, RoomTemplate, RoomTemplateObject, TileState, NpcSimulationConfig, LegacyNpcSimulationConfig, NpcRole, NpcTask, NpcDeploymentPool } from '../types'
import { isAssetDef, validateLayoutData, validateLayoutIntegrity, isNpcConfig } from '../types'
import { findAssetCached, buildAssetMap } from '../asset-utils'
import { normalizeObject, snap } from '../geometry'
import { recalcCollapsed } from '../collision'
import { EDITOR_CONFIG } from '../editor-config'
import { ASSET_REGISTRY } from '../asset-registry'
import { editorLog } from './log'
import { genId } from './ids'
import { getDefaultNpcConfig } from './npc-default'

export { EDITOR_CONFIG }
export const LAYOUT_VERSION = EDITOR_CONFIG.layoutVersion
export const HISTORY_LIMIT = EDITOR_CONFIG.historyLimit

function readTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const tags = value.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean)
  return tags.length > 0 ? tags : undefined
}

function isRoomType(value: unknown): value is 'room' | 'hallway' | 'wall' | 'elevator' {
  return typeof value === 'string' && ['room', 'hallway', 'wall', 'elevator'].includes(value)
}

function isRoomTemplateObject(value: unknown): value is RoomTemplateObject {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (typeof o.type !== 'string' || !o.type.trim()) return false
  if (typeof o.dx !== 'number' || !isFinite(o.dx)) return false
  if (typeof o.dy !== 'number' || !isFinite(o.dy)) return false
  if (typeof o.w !== 'number' || !isFinite(o.w) || o.w <= 0) return false
  if (typeof o.h !== 'number' || !isFinite(o.h) || o.h <= 0) return false
  if (![0, 90, 180, 270].includes(o.rotation as number)) return false
  if (o.padding !== undefined && (typeof o.padding !== 'number' || o.padding <= 0)) return false
  if (o.radius !== undefined && (typeof o.radius !== 'number' || !isFinite(o.radius))) return false
  if (o.fillColor !== undefined && typeof o.fillColor !== 'string') return false
  if (o.label !== undefined && typeof o.label !== 'string') return false
  if (o.instanceLabel !== undefined && typeof o.instanceLabel !== 'string') return false
  if (o.linkGroupId !== undefined && typeof o.linkGroupId !== 'string') return false
  if (o.rx !== undefined) {
    const r = o.rx as Record<string, unknown>
    if (typeof r.tl !== 'number' || typeof r.tr !== 'number' || typeof r.br !== 'number' || typeof r.bl !== 'number') return false
  }
  if (o.customProps !== undefined && (typeof o.customProps !== 'object' || o.customProps === null)) return false
  return true
}

function isRoomTemplate(value: unknown): value is RoomTemplate {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  if (typeof t.id !== 'string' || !t.id.trim()) return false
  if (typeof t.name !== 'string' || !t.name.trim()) return false
  if (t.category !== undefined && (typeof t.category !== 'string' || !t.category.trim())) return false
  if (typeof t.label !== 'string') return false
  if (typeof t.w !== 'number' || !isFinite(t.w) || t.w <= 0) return false
  if (typeof t.h !== 'number' || !isFinite(t.h) || t.h <= 0) return false
  if (t.roomType !== undefined && !isRoomType(t.roomType)) return false
  if (t.radius !== undefined && (typeof t.radius !== 'number' || !isFinite(t.radius))) return false
  if (t.fillColor !== undefined && typeof t.fillColor !== 'string') return false
  if (t.padding !== undefined && (typeof t.padding !== 'number' || t.padding <= 0)) return false
  if (t.tags !== undefined && (!Array.isArray(t.tags) || t.tags.some(tag => typeof tag !== 'string'))) return false
  if (t.rx !== undefined) {
    const r = t.rx as Record<string, unknown>
    if (typeof r.tl !== 'number' || typeof r.tr !== 'number' || typeof r.br !== 'number' || typeof r.bl !== 'number') return false
  }
  if (t.objects !== undefined && (!Array.isArray(t.objects) || !t.objects.every(isRoomTemplateObject))) return false
  return true
}

export const SAVED_LAYOUT: LayoutData = {"version":2,"canvas":{"width":1200,"height":600,"tileSize":25},"floors":[{"id":"floor-mr8wexze-1","name":"New Floor","label":"F0","rooms":[],"objects":[{"id":"obj-f72f0b8c00","type":"builtin-table-set-1","x":175,"y":425,"w":75,"h":75,"rotation":0,"subId":"sub-081d68860c","collapsed":false,"walkable":true,"entranceRequired":false,"walkableGrid":[[true,true,true],[true,true,true],[true,true,true]],"tileStates":[["walkable","walkable","walkable"],["walkable","walkable","walkable"],["walkable","walkable","walkable"]]},{"id":"obj-4bfe05f860","type":"builtin-restroom-1","x":275,"y":150,"w":75,"h":75,"rotation":0,"subId":"sub-7687debbe1","collapsed":false,"walkable":true,"entranceRequired":false,"walkableGrid":[[true,true,true],[true,true,true],[true,true,true]],"tileStates":[["walkable","walkable","walkable"],["walkable","walkable","walkable"],["walkable","walkable","walkable"]],"tileEdges":[[{"top":true,"left":true},{"top":true},{"top":true,"right":true}],[{"left":true},{},{"right":true}],[{"bottom":true,"left":true},{"bottom":false},{"bottom":true,"right":true}]]}],"defaultWalkable":true,"zones":[]},{"id":"floor-ecc4c8ee52","name":"New Floor","label":"F1","rooms":[{"id":"room-3eb482e4d5","x":200,"y":175,"w":175,"h":125,"label":"New Room","roomType":"room","walkable":true,"anchorPoints":[[87.5,62.5]]}],"objects":[],"defaultWalkable":true,"zones":[]}],"roomTemplates":[],"npcConfig":{"speed":0.2,"defaultRoleId":"quest","roles":[{"id":"quest","label":"Quest","color":"#22d3ee","behavior":{"focusChance":0,"restrictedTaskIds":[]}}],"tasks":[],"pool":[{"roleId":"quest","count":10}]},"globalTags":["Hygiene"],"deletedDefaultIds":[]}























































































































































































































































function migrateNpcConfig(value: unknown): NpcSimulationConfig {
  const fallback = getDefaultNpcConfig()
  if (!value || typeof value !== 'object') return fallback
  const c = value as Record<string, unknown>

  if (isNpcConfig(c)) return c as NpcSimulationConfig

  const speed = (typeof c.speed === 'number' && isFinite(c.speed)) ? c.speed : fallback.speed
  const defaultRoleId = typeof c.defaultRoleId === 'string' ? c.defaultRoleId : (typeof c.role === 'string' ? c.role : fallback.defaultRoleId)

  let rawRoles: any[] = []
  if (Array.isArray(c.roles)) {
    rawRoles = c.roles
  } else if (c.roleBehaviors && typeof c.roleBehaviors === 'object') {
    const old = c as unknown as LegacyNpcSimulationConfig
    const legacyColors: Record<string, string> = {
      guest: '#22d3ee',
      staff: '#f472b6',
      visitor: '#a78bfa',
      assassin: 'var(--accent-danger)',
    }
    for (const roleId of Object.keys(old.roleBehaviors ?? {})) {
      rawRoles.push({ id: roleId, label: roleId.charAt(0).toUpperCase() + roleId.slice(1), color: legacyColors[roleId] ?? '#22d3ee', focusTask: undefined, focusChance: 0, restrictedTasks: [] })
    }
    const selectedRole = old.role
    if (!rawRoles.some((r: any) => r.id === selectedRole)) {
      rawRoles.push({ id: selectedRole, label: selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1), color: legacyColors[selectedRole] ?? '#22d3ee', focusTask: undefined, focusChance: 0, restrictedTasks: [] })
    }
  }

  if (rawRoles.length === 0) return fallback

  let pool: NpcDeploymentPool[] = []
  if (Array.isArray(c.pool)) {
    pool = c.pool.map((p: unknown) => {
      const rec = p as Record<string, unknown>
      return { roleId: typeof rec.roleId === 'string' ? rec.roleId : defaultRoleId, count: typeof rec.count === 'number' ? Math.max(0, Math.floor(rec.count)) : 0 }
    }).filter(p => p.count > 0)
  } else if (typeof c.count === 'number') {
    pool = [{ roleId: defaultRoleId, count: Math.max(0, Math.floor(c.count)) }]
  }
  if (pool.length === 0) {
    pool = [{ roleId: defaultRoleId, count: 10 }]
  }

  const existingTasks: NpcTask[] = Array.isArray(c.tasks)
    ? c.tasks.filter((t: unknown) => {
        const rec = t as Record<string, unknown>
        return rec && typeof rec.id === 'string' && typeof rec.label === 'string' && Array.isArray(rec.tags)
      }).map((t: unknown) => {
        const rec = t as NpcTask
        return { id: rec.id, label: rec.label, tags: [...rec.tags] }
      })
    : []

  const tagToTask = new Map<string, NpcTask>()
  for (const r of rawRoles) {
    if (typeof r.focusTask === 'string' && r.focusTask.trim()) {
      const tag = r.focusTask.trim()
      if (!tagToTask.has(tag)) tagToTask.set(tag, { id: genId('task'), label: tag, tags: [tag] })
    }
    if (Array.isArray(r.restrictedTasks)) {
      for (const t of r.restrictedTasks) {
        if (typeof t === 'string' && t.trim()) {
          const tag = t.trim()
          if (!tagToTask.has(tag)) tagToTask.set(tag, { id: genId('task'), label: tag, tags: [tag] })
        }
      }
    }
  }
  for (const task of existingTasks) {
    if (!tagToTask.has(task.label)) tagToTask.set(task.label, task)
  }

  const tasks = Array.from(tagToTask.values())
  const taskIdForTag = (tag: string) => tasks.find(t => t.tags.includes(tag))?.id

  const roles: NpcRole[] = rawRoles.map((r: any) => {
    const id = typeof r.id === 'string' ? r.id : genId('role')
    const label = typeof r.label === 'string' ? r.label : id
    const color = typeof r.color === 'string' ? r.color : '#22d3ee'
    const focusTag = typeof r.focusTask === 'string' ? r.focusTask.trim() : ''
    const focusTaskId = focusTag ? taskIdForTag(focusTag) : undefined
    const restrictedTags = Array.isArray(r.restrictedTasks)
      ? r.restrictedTasks.map((t: unknown) => typeof t === 'string' ? t.trim() : '').filter(Boolean)
      : []
    const restrictedTaskIds = restrictedTags.map((tag: string) => taskIdForTag(tag)).filter((id: string | undefined): id is string => typeof id === 'string')
    const focusChance = typeof r.focusChance === 'number' ? Math.max(0, Math.min(100, Math.floor(r.focusChance))) : 0
    return { id, label, color, behavior: { focusTaskId, focusChance, restrictedTaskIds } }
  })

  if (roles.length === 0) return fallback

  return { speed, defaultRoleId, roles, tasks, pool }
}

export function migrate(data: unknown): { layout: LayoutData; legacyAssets: AssetDef[] } {
  if (!data || typeof data !== 'object') return { layout: JSON.parse(JSON.stringify(SAVED_LAYOUT)), legacyAssets: [] }
  const d = data as Record<string, unknown>
  const canvas = d.canvas
  const validCanvas = canvas && typeof canvas === 'object'
    && typeof (canvas as Record<string, unknown>).tileSize === 'number'
    && isFinite((canvas as Record<string, unknown>).tileSize as number)
    && (canvas as Record<string, unknown>).tileSize as number > 0
  const legacyAssets = Array.isArray(d.customAssets)
      ? d.customAssets.filter(
          (a: unknown): a is Record<string, unknown> => {
            const rec = a as Record<string, unknown>
            return typeof rec?.id === 'string' && typeof rec?.name === 'string'
              && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
              && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
          }
        ).map((a) => {
          const base: AssetBase = {
            id: a.id as string,
            name: a.name as string,
            category: typeof a.category === 'string' ? a.category : undefined,
            w: a.w as number,
            h: a.h as number,
          }
          const assetTags = readTags(a.tags)
          if (assetTags) base.tags = assetTags
          if (typeof a.defaultPadding === 'number' && a.defaultPadding > 0) base.defaultPadding = a.defaultPadding
          if (typeof a.defaultBgColor === 'string' && a.defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a.defaultBgColor)) base.defaultBgColor = a.defaultBgColor
          if (a.defaultRx && typeof a.defaultRx === 'object') {
            const rx = a.defaultRx as Record<string, unknown>
            if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
              base.defaultRx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
            }
          }
          const hasLinkedParts = Array.isArray(a.linkedParts) && a.linkedParts.length > 0
          const hasSvg = typeof a.svg === 'string' && a.svg && (a.special === true || (a.svgViewBox && typeof (a.svgViewBox as Record<string, unknown>).w === 'number'))
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
            return { origin: 'linked', ...base, linkedParts }
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
            return { origin: 'svg-import', ...base, svg, svgViewBox }
          }
          const simple: AssetDef = { origin: 'drawn', ...base }
          if (typeof a.usePx === 'boolean') simple.usePx = a.usePx
          if (typeof a.pxW === 'number' && a.pxW > 0) simple.pxW = Math.floor(a.pxW)
          if (typeof a.pxH === 'number' && a.pxH > 0) simple.pxH = Math.floor(a.pxH)
          return simple
        }).filter(isAssetDef)
      : []

  const migrated: LayoutData = {
    version: LAYOUT_VERSION,
    canvas: validCanvas
      ? {
          width: typeof (canvas as Record<string, unknown>).width === 'number' && isFinite((canvas as Record<string, unknown>).width as number) ? (canvas as Record<string, unknown>).width as number : EDITOR_CONFIG.defaultCanvas.width,
          height: typeof (canvas as Record<string, unknown>).height === 'number' && isFinite((canvas as Record<string, unknown>).height as number) ? (canvas as Record<string, unknown>).height as number : EDITOR_CONFIG.defaultCanvas.height,
          tileSize: (canvas as Record<string, unknown>).tileSize as number,
        }
      : { ...EDITOR_CONFIG.defaultCanvas },
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
          ).map((r) => ({
            id: typeof r.id === 'string' ? r.id : genId('room'),
            x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number,
            label: typeof r.label === 'string' ? r.label : 'Room',
            category: typeof r.category === 'string' ? r.category : undefined,
            roomType: typeof r.roomType === 'string' ? r.roomType as RoomData['roomType'] : 'room',
            walkable: typeof r.walkable === 'boolean' ? r.walkable : true,
            entrances: Array.isArray(r.entrances) ? r.entrances.filter((e): e is { side: 'top' | 'bottom' | 'left' | 'right'; offset: number; width: number } => {
              const entry = e as Record<string, unknown>
              return ['top', 'bottom', 'left', 'right'].includes(entry.side as string)
                && typeof entry.offset === 'number' && typeof entry.width === 'number' && entry.width > 0
            }) : undefined,
            anchorPoints: Array.isArray(r.anchorPoints) ? r.anchorPoints.filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number') : undefined,
            radius: typeof r.radius === 'number' && r.radius > 0 ? r.radius : undefined,
            fillColor: typeof r.fillColor === 'string' ? r.fillColor : undefined,
            rx: typeof r.rx === 'object' && r.rx !== null ? r.rx : undefined,
            padding: typeof r.padding === 'number' && r.padding > 0 ? r.padding : undefined,
            tags: readTags(r.tags),
            locked: typeof r.locked === 'boolean' ? r.locked : undefined,
          } as RoomData)) : [],
          objects: Array.isArray(fRec.objects) ? fRec.objects.filter(
            (o: unknown): o is Record<string, unknown> => {
              const rec = o as Record<string, unknown>
              return typeof rec?.id === 'string' && typeof rec?.type === 'string'
                && typeof rec?.x === 'number' && isFinite(rec.x as number)
                && typeof rec?.y === 'number' && isFinite(rec.y as number)
                && typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
                && typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
            }
          ).map((o) => {
            const base: ObjectData = {
              id: o.id as string,
              type: o.type as string,
              x: o.x as number, y: o.y as number, w: o.w as number, h: o.h as number,
              rotation: typeof o.rotation === 'number' && [0, 90, 180, 270].includes(o.rotation) ? (o.rotation as Rotation) : 0,
            }
            if (typeof o.subId === 'string') base.subId = o.subId
            if (typeof o.radius === 'number' && o.radius > 0) base.radius = o.radius
            if (typeof o.label === 'string') base.label = o.label
            if (typeof o.padding === 'number' && o.padding > 0) base.padding = o.padding
            if (typeof o.labelPadding === 'number' && o.labelPadding > 0) base.labelPadding = o.labelPadding
            if (typeof o.fillColor === 'string') base.fillColor = o.fillColor
            if (typeof o.locked === 'boolean') base.locked = o.locked
            if (typeof o.collapsed === 'boolean') base.collapsed = o.collapsed
            if (typeof o.linkGroupId === 'string' && o.linkGroupId) base.linkGroupId = o.linkGroupId
            if (typeof o.isWall === 'boolean') base.isWall = o.isWall
            if (typeof o.walkable === 'boolean') base.walkable = o.walkable
            if (typeof o.entranceRequired === 'boolean') base.entranceRequired = o.entranceRequired
            const objectTags = readTags(o.customProps && typeof o.customProps === 'object' ? (o.customProps as Record<string, unknown>).tags : undefined)
            if (objectTags) base.customProps = { ...(o.customProps as ObjectData['customProps']), tags: objectTags }
            if (typeof o.roomId === 'string') base.roomId = o.roomId
            if (typeof o.rx === 'object' && o.rx !== null) base.rx = o.rx as ObjectData['rx']
            if (Array.isArray(o.walkableGrid) && o.walkableGrid.length > 0 && o.walkableGrid.every((row: unknown) => Array.isArray(row) && row.every((cell: unknown) => typeof cell === 'boolean'))) {
              base.walkableGrid = o.walkableGrid as boolean[][]
            }
            if (Array.isArray(o.tileStates) && o.tileStates.length > 0 && o.tileStates.every((row: unknown) => Array.isArray(row) && row.every((cell: unknown) => cell === 'walkable' || cell === 'blocked' || cell === 'entrance'))) {
              base.tileStates = o.tileStates as TileState[][]
            }
            if (Array.isArray(o.anchorPoints) && o.anchorPoints.length > 0 && o.anchorPoints.every((p: unknown) => Array.isArray(p) && p.length === 2 && typeof p[0] === "number" && typeof p[1] === "number")) {
              base.anchorPoints = o.anchorPoints as [number, number][]
            }
            return base
          }) : [],
          defaultWalkable: typeof fRec.defaultWalkable === 'boolean' ? fRec.defaultWalkable : true,
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
            tags: readTags(z.tags),
          })) : [],
        }})
      : [],
    roomTemplates: Array.isArray((d as Record<string, unknown>).roomTemplates)
      ? ((d as Record<string, unknown>).roomTemplates as unknown[]).filter(isRoomTemplate)
      : [],
    npcConfig: migrateNpcConfig(d.npcConfig),
    globalTags: readTags(d.globalTags),
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
      const customTags = readTags(obj.customProps?.tags)
      if (customTags) obj.customProps = { ...obj.customProps, tags: customTags }
    }
  }
  delete migrated.objectCustomProps
  delete migrated.instanceLabels
  delete migrated.validationRules

  const migratedAssetMap = buildAssetMap([...ASSET_REGISTRY, ...legacyAssets])
  const t = migrated.canvas.tileSize
  for (const asset of legacyAssets) {
    if (asset.linkedParts) {
      for (const p of asset.linkedParts) {
        p.dx = snap(Math.round(p.dx), t)
        p.dy = snap(Math.round(p.dy), t)
        p.w = snap(Math.round(p.w), t)
        p.h = snap(Math.round(p.h), t)
      }
    }
  }
  for (const floor of migrated.floors) {
    const beforeCount = floor.objects.length
    floor.objects = floor.objects.filter(o => findAssetCached(migratedAssetMap, o.type))
    const removedCount = beforeCount - floor.objects.length
    if (removedCount > 0) {
      editorLog.warn('Migration', `removed ${removedCount} object(s) with unknown asset types from floor "${floor.label}"`)
    }

    for (const room of floor.rooms) {
      if (!room.roomType) {
        room.roomType = room.locked ? 'wall' : 'room'
      }
      if (room.walkable === undefined) {
        room.walkable = room.roomType !== 'wall'
      }
    }

    const validIds = new Set(floor.objects.map(o => o.id))
    const roomIds = new Set(floor.rooms.map(room => room.id))
    const adjacency = new Map<string, Set<string>>()
    for (const obj of floor.objects) {
      if (obj.roomId && !roomIds.has(obj.roomId)) delete obj.roomId
      if (obj.walkable === undefined) {
        obj.walkable = !obj.isWall
      }
      const linked = ((obj as any).linkedIds ?? []).filter((id: string) => validIds.has(id) && id !== obj.id)
      adjacency.set(obj.id, new Set(linked))
      if (linked.length === 0) delete (obj as any).linkedIds
      else (obj as any).linkedIds = linked
      normalizeObject(obj, migrated.canvas.tileSize, migratedAssetMap)
    }

    const visited = new Set<string>()
    for (const obj of floor.objects) {
      if (visited.has(obj.id)) continue
      const members: string[] = []
      const queue = [obj.id]
      visited.add(obj.id)
      while (queue.length > 0) {
        const id = queue.shift()!
        members.push(id)
        for (const linkedId of adjacency.get(id) ?? []) {
          if (!visited.has(linkedId)) {
            visited.add(linkedId)
            queue.push(linkedId)
          }
        }
      }
      const existingGroup = members
        .map(id => floor.objects.find(candidate => candidate.id === id)?.linkGroupId)
        .find((id): id is string => !!id)
      if (members.length > 1 || existingGroup) {
        const groupId = existingGroup ?? genId('link')
        for (const id of members) {
          const member = floor.objects.find(candidate => candidate.id === id)
          if (member) {
            member.linkGroupId = groupId
            delete (member as any).linkedIds
          }
        }
      }
    }
    recalcCollapsed(floor, migratedAssetMap)
  }
  const integrityIssues = validateLayoutIntegrity(migrated)
  if (integrityIssues.length > 0) {
    editorLog.warn('Migration', `layout integrity issues: ${integrityIssues.join('; ')}`)
  }
  if (!validateLayoutData(migrated as unknown)) {
    editorLog.error('Migration', 'Migrated layout failed schema validation, falling back to default')
    return { layout: JSON.parse(JSON.stringify(SAVED_LAYOUT)), legacyAssets: [] }
  }
  return { layout: migrated, legacyAssets }
}

export function loadInitial(): { layout: LayoutData; legacyAssets: AssetDef[] } {
  const hmrData = import.meta.hot?.data?._editorLayout as string | undefined
  if (hmrData) {
    try { return migrate(JSON.parse(hmrData)) } catch { /* fall through */ }
  }
  return migrate(JSON.parse(JSON.stringify(SAVED_LAYOUT)))
}

function cloneAsset(a: AssetDef): AssetDef {
  return JSON.parse(JSON.stringify(a))
}

export function mergeAssetRegistry(base: AssetDef[], overrides: AssetDef[], deletedDefaultIds: Set<string> = new Set()): AssetDef[] {
  const map = new Map(base.map(cloneAsset).filter(a => !deletedDefaultIds.has(a.id)).map(a => [a.id, a]))
  for (const a of overrides) map.set(a.id, cloneAsset(a))
  return [...map.values()]
}

