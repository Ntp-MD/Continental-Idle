import { state, currentFloor, snap, assetMap, dragState } from './state'
import {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
import {
	beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
import {
	addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset, refreshOriginInstances,
} from './assets'
import { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
import {
	copySelected, pasteObjects,
} from './metadata'
import { saveLayout, saveAssets, saveNpcConfig, saveBlueprintData, syncToGame } from './persistence'
import { selectedObject, selectedAsset, selectAsset, selectedObjectIds } from './selection'
import { setMode, resizeCanvas, setCanvasBgColor, setCanvasLabelColor, setStreetFloor, setStreetWidth } from './mode'
import { tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag } from './tags'
export * from '../crud/originAssets'
export * from '../crud/floorPlan'
export * from '../crud/tagManager'

export {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
export {
	beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
export {
	addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset, refreshOriginInstances,
} from './assets'
export { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
export {
	copySelected, pasteObjects,
} from './metadata'
export { saveLayout, saveAssets, saveNpcConfig, saveBlueprintData, syncToGame } from './persistence'
export { selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection } from './selection'
export { getLinkedObjects } from './utils'
export { setMode, resizeCanvas, setCanvasBgColor, setCanvasLabelColor, setStreetFloor, setStreetWidth } from './mode'
export { tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag } from './tags'
export { dragState, startAssetDrag, endAssetDrag } from './state'

export function useAssetsStore() {
	return {
		state,
		currentFloor,
		snap,
		assetMap,
		dragState,
		addFloor, deleteFloor, duplicateFloor, renameFloor,
		reorderFloors, selectFloor, updateFloor,
		beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
		moveSelectedTo, commitMove, rotateSelected,
		createLinkedAssetFromSelection, flattenToSvgAsset,
		linkObjects, unlinkObject, toggleObjectLock,
		addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset, refreshOriginInstances,
		updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk,
		copySelected, pasteObjects,
		saveLayout, saveAssets, saveNpcConfig, saveBlueprintData, syncToGame,
		selectedObject, selectedAsset, selectAsset, selectedObjectIds,
		setMode, resizeCanvas, setCanvasBgColor, setCanvasLabelColor, setStreetFloor, setStreetWidth,
		tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag,
	}
}

export type AssetsStore = ReturnType<typeof useAssetsStore>

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		const hot = import.meta.hot!
		hot.data._editorState = {
			currentFloorId: state.currentFloorId,
			mode: state.mode,
			selectionState: state.selectionState,
			selectedAssetId: state.selectedAssetId,
		}
	})
}
