import { state, currentFloor, snap, assetMap, dragState } from './state'
import {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
import {
	addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
import {
	addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset,
} from './assets'
import { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
import {
	copySelected, pasteObjects,
} from './metadata'
import { saveLayout, saveAssets, saveNpcConfig, syncToGame } from './persistence'
import { selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection } from './selection'
import { getLinkedObjects } from './utils'
import { setMode, resizeCanvas } from './mode'
import { globalTags, managedTagSet, addTag, removeTag, ensureTag, ensureTags, hydrateCustomTags } from './tags'

export {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
export {
	addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
export {
	addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset,
} from './assets'
export { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
export {
	copySelected, pasteObjects,
} from './metadata'
export { saveLayout, saveAssets, saveNpcConfig, syncToGame } from './persistence'
export { selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection } from './selection'
export { getLinkedObjects } from './utils'
export { setMode, resizeCanvas } from './mode'
export { globalTags, managedTagSet, addTag, removeTag, ensureTag, ensureTags, hydrateCustomTags } from './tags'
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
		addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
		moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
		createLinkedAssetFromSelection, flattenToSvgAsset,
		linkObjects, unlinkObject, toggleObjectLock,
		addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset,
		updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk,
		copySelected, pasteObjects,
		saveLayout, saveAssets, saveNpcConfig, syncToGame,
		selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection,
		getLinkedObjects,
		setMode, resizeCanvas,
		globalTags, managedTagSet, addTag, removeTag, ensureTag, ensureTags, hydrateCustomTags,
	}
}

export type AssetsStore = ReturnType<typeof useAssetsStore>

hydrateCustomTags()

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		const hot = import.meta.hot!
		hot.data._editorLayout = JSON.stringify(state.layout)
		hot.data._editorState = {
			currentFloorId: state.currentFloorId,
			mode: state.mode,
			selectionState: state.selectionState,
			selectedAssetId: state.selectedAssetId,
			assetRegistry: state.assetRegistry,
		}
	})
}
