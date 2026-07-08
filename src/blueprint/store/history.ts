import { state, editorLog, undoStack, redoStack, invalidateAssetMap, recalcCollapsed, HISTORY_LIMIT } from './state'
import { validateLayoutData } from '../types'

export function snapshot(): string {
  return JSON.stringify(state.layout)
}

export function restore(json: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    editorLog.error('restoreHistorySnapshot', e)
    return
  }
  const validated = validateLayoutData(parsed)
  if (!validated) {
    editorLog.error('restoreHistorySnapshot', 'Invalid layout schema')
    return
  }
  state.layout = validated
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

export function pushHistory() {
  const snap = snapshot()
  if (undoStack.value.length > 0 && undoStack.value[undoStack.value.length - 1] === snap) return
  if (undoStack.value.length >= HISTORY_LIMIT) undoStack.value.shift()
  undoStack.value.push(snap)
  redoStack.value.length = 0
}

export function undo() {
  if (undoStack.value.length === 0) return
  redoStack.value.push(snapshot())
  const prev = undoStack.value.pop()!
  restore(prev)
}

export function redo() {
  if (redoStack.value.length === 0) return
  undoStack.value.push(snapshot())
  const next = redoStack.value.pop()!
  restore(next)
}
