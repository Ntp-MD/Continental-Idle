import type { ObjectData, Rect, AssetDef, LinkedPart, Rotation } from '../types'
import { aabbOverlap } from '../utils'
import { findAssetCached } from '../assets-utils'
import { assetSizeFor } from '../geometry'
import {
  state, toast, genId, snap, clamp, assetMap, invalidateAssetMap,
  objectOverlapsAny, roomOverlapsAny, recalcCollapsed, currentFloor, selectedRoom, selectedObject,
  isValidColor, groupBoundsOf, getLinkedObjects, buildCompositeParts, withStateLock,
} from './state'
import { pushHistory } from './history'
import { saveLayout } from './persistence'

export async function addObject(type: string, x: number, y: number): Promise<ObjectData | null> {
  return withStateLock(async () => {
    if (state.mode === 'wall') return null
  const floor = currentFloor.value
  const asset = findAssetCached(assetMap(), type)
  if (!floor || !asset) return null
  const t = state.layout.canvas.tileSize
  const aw = asset.kind === 'simple' && asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
  const ah = asset.kind === 'simple' && asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
  const w = snap(aw)
  const h = snap(ah)
  const rect = clamp({ x: snap(x), y: snap(y), w, h })

  if (asset.kind === 'linked') {
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

  if (asset.kind !== 'svg' && objectOverlapsAny(rect)) {
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
  })
}

export function canPlaceObject(type: string, x: number, y: number): boolean {
  if (state.mode === 'wall') return false
  const asset = findAssetCached(assetMap(), type)
  if (!asset) return false
  const t = state.layout.canvas.tileSize
  const aw = asset.kind === 'simple' && asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
  const ah = asset.kind === 'simple' && asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
  const w = snap(aw)
  const h = snap(ah)
  const rect = clamp({ x: snap(x), y: snap(y), w, h })
  if (asset.kind === 'svg') return true
  if (asset.kind === 'linked') {
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

export function select(sel: typeof state.selection) {
  state.selection = sel
  state.multiSelection = null
  if (sel) state.selectedAssetId = null
}

export function toggleMultiSelect(id: string) {
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

export async function deleteSelected(): Promise<void> {
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

export function moveSelectedTo(x: number, y: number) {
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

export async function commitMove(): Promise<void> {
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

export async function rotateSelected(): Promise<void> {
  if (state.selection?.type !== 'object') return
  const o = selectedObject()
  if (!o) return
  if (o.locked) {
    toast.warning('Cannot rotate a locked object - unlock first')
    return
  }
  const asset = findAssetCached(assetMap(), o.type)
  if (asset?.kind === 'composite') {
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

export async function updateObjectProps(patch: Partial<ObjectData>): Promise<boolean> {
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
  const sz = assetSizeFor(o.type, o.rotation, state.layout.canvas.tileSize, assetMap())
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

export async function mergeObjects(ids: string[]): Promise<string | null> {
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
    kind: 'composite',
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

export async function createCompositeAssetFromSelection(name?: string, category?: string): Promise<string | null> {
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
    kind: 'composite',
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

export async function createLinkedAssetFromSelection(name?: string, category?: string): Promise<string | null> {
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
    kind: 'linked',
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

export async function ungroupObject(id: string): Promise<string[] | null> {
  const floor = currentFloor.value
  if (!floor) return null

  const obj = floor.objects.find(o => o.id === id)
  if (!obj) return null
  if (obj.locked) {
    toast.warning('Cannot ungroup a locked object - unlock first')
    return null
  }

  const asset = findAssetCached(assetMap(), obj.type)
  if (!asset || asset.kind !== 'composite') {
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
      const customMatch = state.layout.customAssets.find(a => a.w === partW && a.h === partH && a.kind !== 'composite')
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

  state.layout.customAssets = state.layout.customAssets.filter(a => a.id !== asset.id)
  invalidateAssetMap()

  state.multiSelection = { type: 'object', ids: newIds }
  state.selection = null

  toast.success(`Ungrouped into ${newIds.length} objects`)
  await saveLayout()
  return newIds
}

export async function linkObjects(ids: string[]): Promise<boolean> {
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

export async function unlinkObject(id: string): Promise<boolean> {
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

export async function toggleObjectLock(id: string): Promise<void> {
  const floor = currentFloor.value
  if (!floor) return
  const o = floor.objects.find(o => o.id === id)
  if (!o) return
  pushHistory()
  o.locked = !o.locked
  toast.info(o.locked ? 'Object locked' : 'Object unlocked')
  await saveLayout()
}
