import type { ObjectData, ObjectCustomProps, ValidationRule } from '../types'
import { state, toast, genId, snap, clamp, objectOverlapsAny, recalcCollapsed, currentFloor } from './state'
import { pushHistory } from './history'
import { saveLayout } from './persistence'

let clipboard: ObjectData[] | null = null

export function copySelected() {
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

export async function pasteObjects() {
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

function findObjectBySubId(subId: string): ObjectData | undefined {
  for (const floor of state.layout.floors) {
    const obj = floor.objects.find(o => o.subId === subId)
    if (obj) return obj
  }
  return undefined
}

export function getObjectCustomProps(subId: string): ObjectCustomProps | undefined {
  return findObjectBySubId(subId)?.customProps
}

export async function setObjectCustomProps(subId: string, props: ObjectCustomProps): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  obj.customProps = props
  pushHistory()
  await saveLayout()
}

export async function deleteObjectCustomProps(subId: string): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  delete obj.customProps
  pushHistory()
  await saveLayout()
}

export function getInstanceLabel(subId: string): string | undefined {
  return findObjectBySubId(subId)?.instanceLabel
}

export async function setInstanceLabel(subId: string, label: string): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  obj.instanceLabel = label
  pushHistory()
  await saveLayout()
}

export async function deleteInstanceLabel(subId: string): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  delete obj.instanceLabel
  pushHistory()
  await saveLayout()
}

export function getValidationRule(subId: string): ValidationRule | undefined {
  return findObjectBySubId(subId)?.validationRule
}

export async function setValidationRule(subId: string, rule: ValidationRule): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  obj.validationRule = rule
  pushHistory()
  await saveLayout()
}

export async function deleteValidationRule(subId: string): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  delete obj.validationRule
  pushHistory()
  await saveLayout()
}

export function findObjectsByTag(tag: string): ObjectData[] {
  const results: ObjectData[] = []
  for (const floor of state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.customProps?.tags?.includes(tag)) {
        results.push(obj)
      }
    }
  }
  return results
}

export function findObjectsByTagOnCurrentFloor(tag: string): ObjectData[] {
  const floor = currentFloor.value
  if (!floor) return []
  const results: ObjectData[] = []
  for (const obj of floor.objects) {
    if (obj.customProps?.tags?.includes(tag)) {
      results.push(obj)
    }
  }
  return results
}
