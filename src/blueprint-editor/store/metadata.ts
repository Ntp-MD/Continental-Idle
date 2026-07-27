import type { ObjectData, ObjectCustomProps } from '../types'
import { objectOverlapsAny, recalcCollapsed } from '../collision'
import { state, toast, snap, clamp, assetMap, currentFloor } from './state'
import { genId } from './ids'
import { selectedObjectIds } from './selection'
import { saveLayout } from './persistence'

let clipboard: ObjectData[] | null = null

export function copySelected() {
  const floor = currentFloor.value
  if (!floor) return
  const objIds = selectedObjectIds()
  if (objIds.length > 0) {
    clipboard = floor.objects
      .filter(o => objIds.includes(o.id))
      .map(o => ({
        ...o,
        walkableGrid: o.walkableGrid?.map(row => [...row]),
        tileStates: o.tileStates?.map(row => [...row]),
        tileEdges: o.tileEdges?.map(row => row.map(e => e ? { ...e } : e)),
      }))
    toast.info(`Copied ${clipboard.length} object(s)`)
  } else {
    const primary = state.selectionState.primary
    if (primary?.type === 'object') {
      const o = floor.objects.find(o => o.id === primary.id)
      if (o) {
        clipboard = [{
          ...o,
          walkableGrid: o.walkableGrid?.map(row => [...row]),
          tileStates: o.tileStates?.map(row => [...row]),
          tileEdges: o.tileEdges?.map(row => row.map(e => e ? { ...e } : e)),
        }]
        toast.info('Copied 1 object')
      }
    }
  }
}

export async function pasteObjects(): Promise<void> {
  const floor = currentFloor.value
  if (!floor || !clipboard || clipboard.length === 0) return
  const tileSize = state.layout.canvas.tileSize
  const offset = tileSize
  const newIds: string[] = []
  const idMap = new Map<string, string>()
  const pendingCopies: ObjectData[] = []
  for (const c of clipboard) {
    const newId = genId('obj')
    idMap.set(c.id, newId)
    const rawX = c.x + offset
    const rawY = c.y + offset
    const rect = clamp({ x: snap(rawX), y: snap(rawY), w: c.w, h: c.h })
    if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
      toast.warning(`Skipped pasting "${c.type}" - would overlap existing object`)
      continue
    }
    newIds.push(newId)
    const { locked, collapsed, linkGroupId, walkableGrid, tileStates, tileEdges, ...rest } = c
    const copy: ObjectData = {
      ...rest,
      id: newId,
      subId: genId('sub'),
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      ...(walkableGrid ? { walkableGrid: walkableGrid.map(row => [...row]) } : {}),
      ...(tileStates ? { tileStates: tileStates.map(row => [...row]) } : {}),
      ...(tileEdges ? { tileEdges: tileEdges.map(row => row.map(e => e ? { ...e } : e)) } : {}),
    }
    pendingCopies.push(copy)
  }
  if (pendingCopies.length === 0) {
    toast.warning('Paste failed - all objects would overlap')
    return
  }
  for (const copy of pendingCopies) {
    floor.objects.push(copy)
  }
  const pastedGroups = new Map<string, string>()
  for (const c of clipboard) {
    if (!c.linkGroupId) continue
    const newId = idMap.get(c.id)
    if (!newId || !newIds.includes(newId)) continue
    const sourceGroup = c.linkGroupId
    let groupId = pastedGroups.get(sourceGroup)
    if (!groupId) {
      groupId = genId('link')
      pastedGroups.set(sourceGroup, groupId)
    }
    const obj = floor.objects.find(o => o.id === newId)
    if (obj) obj.linkGroupId = groupId
  }
  if (newIds.length > 1) {
    state.selectionState = { primary: { type: 'object', id: newIds[0] }, items: newIds.map(id => ({ type: 'object' as const, id })) }
  } else {
    state.selectionState = { primary: { type: 'object', id: newIds[0] }, items: [{ type: 'object', id: newIds[0] }] }
  }
  recalcCollapsed(floor, assetMap())
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
  await saveLayout()
}

export function getInstanceLabel(subId: string): string | undefined {
  return findObjectBySubId(subId)?.instanceLabel
}

export async function setInstanceLabel(subId: string, label: string): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  obj.instanceLabel = label
  await saveLayout()
}

export async function deleteInstanceLabel(subId: string): Promise<void> {
  const obj = findObjectBySubId(subId)
  if (!obj) return
  delete obj.instanceLabel
  await saveLayout()
}
