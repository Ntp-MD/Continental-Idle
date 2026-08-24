import { state, currentFloor, snap, assetMap, dragState } from './state'
import {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
import {
	beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
import {
	addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset, refreshOriginInstances,
} from './assets'
import { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
import {
	copySelected, pasteObjects,
} from './metadata'
import { saveLayout, saveAssets, saveNpcConfig, saveBlueprintData, syncToGame } from './persistence'
import { selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection } from './selection'
import { getLinkedObjects } from './utils'
import { setMode, resizeCanvas, setCanvasBgColor, setStreetFloor, setStreetWidth } from './mode'
import { tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag, ensureTags } from './tags'
export * from '../crud/originAssets'
export * from '../crud/floorPlan'
export * from '../crud/npcSettings'
export * from '../crud/tagManager'
import { listOriginAssets, getOriginAsset, createOriginAsset, createSvgOriginAsset } from '../crud/originAssets'
import { listFloors, getFloor, getPlacedObject, createFloor, createPlacedObject } from '../crud/floorPlan'
import { listNpcRoles, getNpcRole, listNpcTasks, getNpcTask, createNpcRole, updateNpcRole, deleteNpcRole, createNpcTask, updateNpcTask, deleteNpcTask, updateNpcSettings } from '../crud/npcSettings'
import { listTags, getTag, createTag, updateTag, deleteTag, findTagReferences } from '../crud/tagManager'

export {
	addFloor, deleteFloor, duplicateFloor, renameFloor,
	reorderFloors, selectFloor, updateFloor,
} from './floors'
export {
	beginDrawnObject, addObject, canPlaceObject, select, toggleMultiSelect, deleteSelected,
	moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
	createLinkedAssetFromSelection,
	flattenToSvgAsset,
	linkObjects, unlinkObject, toggleObjectLock,
} from './objects'
export {
	addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset, refreshOriginInstances,
} from './assets'
export { updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk } from './npcDefault'
export {
	copySelected, pasteObjects,
} from './metadata'
export { saveLayout, saveAssets, saveNpcConfig, saveBlueprintData, syncToGame } from './persistence'
export { selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection } from './selection'
export { getLinkedObjects } from './utils'
export { setMode, resizeCanvas, setCanvasBgColor, setStreetFloor, setStreetWidth } from './mode'
export { tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag, ensureTags } from './tags'
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
		moveSelectedTo, commitMove, rotateSelected, updateObjectProps,
		createLinkedAssetFromSelection, flattenToSvgAsset,
		linkObjects, unlinkObject, toggleObjectLock,
		addAsset, addSvgAsset, updateAsset, deleteAsset, rotateAsset, duplicateAsset, refreshOriginInstances,
		listOriginAssets, getOriginAsset, createOriginAsset, createSvgOriginAsset,
		listFloors, getFloor, getPlacedObject, createFloor, createPlacedObject,
		listNpcRoles, getNpcRole, listNpcTasks, getNpcTask, createNpcRole, updateNpcRole, deleteNpcRole, createNpcTask, updateNpcTask, deleteNpcTask, updateNpcSettings,
		listTags, getTag, createTag, updateTag, deleteTag, findTagReferences,
		updateNpcConfig, syncNpcConfigToState, persistNpcConfigToDisk,
		copySelected, pasteObjects,
		saveLayout, saveAssets, saveNpcConfig, saveBlueprintData, syncToGame,
		selectedObject, selectedAsset, selectAsset, selectedObjectIds, clearSelection,
		getLinkedObjects,
		setMode, resizeCanvas, setCanvasBgColor, setStreetFloor, setStreetWidth,
		tagCatalog, globalTags, managedTagSet, addTag, removeTag, ensureTag, ensureTags,
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
