import { computed } from 'vue'
import { state, currentFloor, snap, assetMap, dragState, reloadEditorData } from './state'
import {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor, paintFloorTiles,
} from './floors'
import {
	beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
import {
	addSvgAsset, updateAsset, deleteAsset, duplicateAsset, refreshOriginInstances,
} from './assets'
import { updateNpcConfig } from './npcDefault'
import {
	copySelected, pasteObjects,
} from './metadata'
import { saveBlueprintData, syncToGame } from './persistence'
import { selectedObject, selectedAsset, selectAsset, selectedObjectIds } from './selection'
import { setMode, setTileBrush, resizeCanvas, setCanvasBgColor, setCanvasLabelColor, setStreetFloor, setStreetWidth, setEditorSettings, resetEditorSettings } from './mode'
import { tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag } from './tags'

export {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor, paintFloorTiles,
} from './floors'
export {
	beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
export {
	addSvgAsset, updateAsset, deleteAsset, duplicateAsset, refreshOriginInstances,
} from './assets'
export { updateNpcConfig } from './npcDefault'
export {
	copySelected, pasteObjects,
} from './metadata'
export { saveBlueprintData, syncToGame } from './persistence'
export { reloadEditorData } from './state'
export { selectedObject, selectedAsset, selectAsset, selectedObjectIds } from './selection'
export { setMode, setTileBrush, resizeCanvas, setCanvasBgColor, setCanvasLabelColor, setStreetFloor, setStreetWidth, setEditorSettings, resetEditorSettings } from './mode'
export { tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag } from './tags'
export { dragState, startAssetDrag, endAssetDrag } from './state'

export const isNpcPreview = computed(() => state.mode === 'npc-preview')

export function useAssetsStore() {
	return {
		state,
		isNpcPreview,
		reloadEditorData,
		currentFloor,
		snap,
		assetMap,
		dragState,
		addFloor, deleteFloor, duplicateFloor, renameFloor,
		reorderFloors, selectFloor, updateFloor, paintFloorTiles,
		beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
		moveSelectedTo, commitMove, rotateSelected,
		flattenToSvgAsset,
		linkObjects, unlinkObject, toggleObjectLock,
		addSvgAsset, updateAsset, deleteAsset, duplicateAsset, refreshOriginInstances,
		updateNpcConfig,
		copySelected, pasteObjects,
		saveBlueprintData, syncToGame,
		selectedObject, selectedAsset, selectAsset, selectedObjectIds,
		setMode, setTileBrush, resizeCanvas, setCanvasBgColor, setCanvasLabelColor, setStreetFloor, setStreetWidth, setEditorSettings, resetEditorSettings,
		tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag,
	}
}

export type AssetsStore = ReturnType<typeof useAssetsStore>
