import type { FloorData } from '../types'
import { state, genId } from './state'
import { pushHistory } from './history'
import { saveLayout } from './persistence'

export async function addFloor(): Promise<FloorData> {
  pushHistory()
  const n = state.layout.floors.length
  const floor: FloorData = { id: genId('floor'), name: `New Floor`, label: `F${n}`, rooms: [], objects: [], zones: [] }
  state.layout.floors.push(floor)
  await saveLayout()
  return floor
}

export async function deleteFloor(id: string) {
  if (state.layout.floors.length <= 1) return
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  state.layout.floors = state.layout.floors.filter(f => f.id !== id)
  if (state.currentFloorId === id) {
    state.currentFloorId = state.layout.floors[0].id
  }
  state.selection = null
  state.multiSelection = null
  await saveLayout()
}

export async function duplicateFloor(id: string) {
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

export async function renameFloor(id: string, name: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  floor.name = name
  await saveLayout()
}

export async function reorderFloors(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  if (fromIndex < 0 || toIndex < 0) return
  if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return
  pushHistory()
  const floors = state.layout.floors
  const [moved] = floors.splice(fromIndex, 1)
  floors.splice(toIndex, 0, moved)
  await saveLayout()
}

export async function clearFloor(id: string) {
  const floor = state.layout.floors.find(f => f.id === id)
  if (!floor) return
  pushHistory()
  floor.rooms = []
  floor.objects = []
  floor.zones = []
  state.selection = null
  state.multiSelection = null
  await saveLayout()
}

export async function clearAllFloors() {
  pushHistory()
  for (const floor of state.layout.floors) {
    floor.rooms = []
    floor.objects = []
    floor.zones = []
  }
  state.selection = null
  state.multiSelection = null
  await saveLayout()
}

export function selectFloor(id: string) {
  state.currentFloorId = id
  state.selection = null
  state.multiSelection = null
}
