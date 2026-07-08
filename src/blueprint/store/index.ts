import { computed } from 'vue'
import type { EditorMode } from '../types'
import { normalizeObject } from '../geometry'
import {
  state, currentFloor, snap, assetMap, selectedRoom, selectedObject,
  selectedAsset, selectAsset, dragState, startAssetDrag, endAssetDrag,
  startRoomTemplateDrag, endRoomTemplateDrag,
  undoStack, redoStack,
  invalidateAssetMap, clamp,
} from './state'
import { pushHistory, undo, redo } from './history'
import { saveLayout, syncToGame } from './persistence'
import {
  addFloor, deleteFloor, duplicateFloor, renameFloor,
  reorderFloors, clearFloor, clearAllFloors, selectFloor,
} from './floors'
import {
  addRoom, canPlaceRoom, updateRoomProps, addRoomTemplate,
  deleteRoomTemplate, addRoomFromTemplate, eraseWallTile,
} from './rooms'
import {
  addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
  moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
  mergeObjects, createCompositeAssetFromSelection, createLinkedAssetFromSelection,
  ungroupObject, linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
import { getLinkedObjects } from './state'
import {
  addCustomAsset, addSvgAsset, updateCustomAsset, deleteCustomAsset,
  addAssetCategory, renameAssetCategory, deleteAssetCategory,
} from './asset-library'
import { addZone, updateZone, deleteZone } from './zones'
import {
  copySelected, pasteObjects,
  getObjectCustomProps, setObjectCustomProps, deleteObjectCustomProps,
  getInstanceLabel, setInstanceLabel, deleteInstanceLabel,
  getValidationRule, setValidationRule, deleteValidationRule,
  findObjectsByTag, findObjectsByTagOnCurrentFloor,
} from './metadata'

export function setMode(mode: EditorMode) {
  state.mode = mode
  state.selection = null
  state.multiSelection = null
}

export async function resizeCanvas(width: number, height: number, tileSize: number): Promise<void> {
  const t = tileSize > 0 ? tileSize : state.layout.canvas.tileSize
  const w = Math.max(t, Math.round(width / t) * t)
  const h = Math.max(t, Math.round(height / t) * t)
  pushHistory()
  state.layout.canvas = { width: w, height: h, tileSize: t }
  invalidateAssetMap()
  for (const asset of state.layout.customAssets) {
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
  for (const floor of state.layout.floors) {
    for (const r of floor.rooms) {
      const snapped = clamp({ x: Math.round(r.x / t) * t, y: Math.round(r.y / t) * t, w: Math.round(r.w / t) * t || t, h: Math.round(r.h / t) * t || t })
      Object.assign(r, snapped)
    }
    for (const o of floor.objects) {
      normalizeObject(o, state.layout.canvas.tileSize, assetMap())
      const snapped = clamp({ x: Math.round(o.x / t) * t, y: Math.round(o.y / t) * t, w: o.w, h: o.h })
      o.x = snapped.x
      o.y = snapped.y
    }
  }
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

export function useAssetsStore() {
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
    addSvgAsset,
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

export { dragState, startAssetDrag, endAssetDrag, startRoomTemplateDrag, endRoomTemplateDrag }
