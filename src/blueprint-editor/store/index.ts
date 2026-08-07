import { state, currentFloor, snap, assetMap, dragState } from './state'
import {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
import {
	addRoom, canPlaceRoom, updateRoomProps, addRoomTemplate,
	deleteRoomTemplate, addRoomFromTemplate, eraseWallTile,
} from './rooms'
import {
	addObject, addWallObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, linkObjectToRoom, linkObjectsToRoom, linkAllObjectsInRoom, unlinkObjectFromRoom, toggleObjectLock,
} from './objects'
import {
	addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset,
} from './assets'
import { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
import {
	copySelected, pasteObjects,
} from './metadata'
import { saveLayout, saveAssets, saveNpcConfig, syncToGame } from './persistence'
import { selectedRoom, selectedObject, selectedAsset, selectAsset, findRoomTemplate, selectedObjectIds, clearSelection } from './selection'
import { getLinkedObjects } from './utils'
import { setMode, resizeCanvas } from './mode'
import { globalTags, addTag, removeTag, ensureTag, ensureTags } from './tags'

export {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
export {
	addRoom, canPlaceRoom, updateRoomProps, addRoomTemplate,
	deleteRoomTemplate, addRoomFromTemplate, eraseWallTile,
} from './rooms'
export {
	addObject, addWallObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, linkObjectToRoom, linkObjectsToRoom, linkAllObjectsInRoom, unlinkObjectFromRoom, toggleObjectLock,
} from './objects'
export {
	addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset,
} from './assets'
export { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
export {
	copySelected, pasteObjects,
} from './metadata'
export { saveLayout, saveAssets, saveNpcConfig, syncToGame } from './persistence'
export { selectedRoom, selectedObject, selectedAsset, selectAsset, findRoomTemplate, selectedObjectIds, clearSelection } from './selection'
export { getLinkedObjects } from './utils'
export { setMode, resizeCanvas } from './mode'
export { globalTags, addTag, removeTag, ensureTag, ensureTags } from './tags'
export { dragState, startAssetDrag, endAssetDrag, startRoomTemplateDrag, endRoomTemplateDrag } from './state'

export function useAssetsStore() {
	return {
		state,
		currentFloor,
		snap,
		assetMap,
		dragState,
		addFloor, deleteFloor, duplicateFloor, renameFloor,
		reorderFloors, selectFloor, updateFloor,
		addRoom, canPlaceRoom, updateRoomProps, addRoomTemplate,
		deleteRoomTemplate, addRoomFromTemplate, eraseWallTile,
		addObject, addWallObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
		moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
		createLinkedAssetFromSelection, flattenToSvgAsset,
		linkObjects, unlinkObject, linkObjectToRoom, linkObjectsToRoom, linkAllObjectsInRoom, unlinkObjectFromRoom, toggleObjectLock,
		addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset,
		updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk,
		copySelected, pasteObjects,
		saveLayout, saveAssets, saveNpcConfig, syncToGame,
		selectedRoom, selectedObject, selectedAsset, selectAsset, findRoomTemplate, selectedObjectIds, clearSelection,
		getLinkedObjects,
		setMode, resizeCanvas,
		globalTags, addTag, removeTag, ensureTag, ensureTags,
	}
}

export type AssetsStore = ReturnType<typeof useAssetsStore>

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
