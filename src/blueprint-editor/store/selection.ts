import { computed } from 'vue'
import type { RoomData, ObjectData, RoomTemplate, EntityRef } from '../types'
import { findAssetCached } from '../asset-utils'
import { state, currentFloor, assetMap } from './state'

export function findRoomTemplate(id: string): RoomTemplate | undefined {
  return state.layout.roomTemplates?.find((t: RoomTemplate) => t.id === id)
}

export function selectAsset(id: string | null) {
  state.selectedAssetId = id
  if (id) state.selectionState = { primary: null, items: [] }
}

export const selectedAsset = computed(() =>
  state.selectedAssetId ? findAssetCached(assetMap(), state.selectedAssetId) ?? null : null
)

export function select(ref: EntityRef | null) {
  if (ref) {
    state.selectionState = { primary: ref, items: [ref] }
    state.selectedAssetId = null
  } else {
    state.selectionState = { primary: null, items: [] }
  }
}

export function clearSelection() {
  state.selectionState = { primary: null, items: [] }
}

export function selectedRoom(): RoomData | undefined {
  const primary = state.selectionState.primary
  if (primary?.type !== 'room') return undefined
  return currentFloor.value?.rooms.find((r: RoomData) => r.id === primary.id)
}

export function selectedObject(): ObjectData | undefined {
  const primary = state.selectionState.primary
  if (primary?.type !== 'object') return undefined
  return currentFloor.value?.objects.find((o: ObjectData) => o.id === primary.id)
}

export function selectedObjectIds(): string[] {
  return state.selectionState.items
    .filter(item => item.type === 'object')
    .map(item => item.id)
}

export function toggleMultiSelect(id: string, isRoom = false) {
  const ref: EntityRef = isRoom ? { type: 'room', id } : { type: 'object', id }
  const items = state.selectionState.items
  const existingIdx = items.findIndex(item => item.type === ref.type && item.id === ref.id)

  if (existingIdx >= 0) {
    items.splice(existingIdx, 1)
    if (items.length === 0) {
      state.selectionState = { primary: null, items: [] }
    } else if (items.length === 1) {
      state.selectionState = { primary: items[0], items: [...items] }
    } else {
      state.selectionState = { primary: items[0], items: [...items] }
    }
    return
  }

  if (items.length === 0) {
    state.selectionState = { primary: ref, items: [ref] }
  } else {
    const newItems = [...items, ref]
    state.selectionState = { primary: items[0], items: newItems }
  }
}
