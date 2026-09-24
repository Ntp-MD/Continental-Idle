import { computed } from 'vue'
import type { ObjectData, EntityRef } from '../domain/types'
import { findAssetCached } from '../assets/assetUtils'
import type { BlueprintStore } from './state'

export function createSelectionCommands(store: BlueprintStore) {
	const state = store.state
	const currentFloor = store.currentFloor
	const assetMap = () => store.assetMap()

	function selectAsset(id: string | null) {
		state.selectedAssetId = id
		if (id) clearSelection()
	}

	const selectedAsset = computed(() =>
		state.selectedAssetId ? findAssetCached(assetMap(), state.selectedAssetId) ?? null : null,
	)

	// Single owner of the selection shape: every write to `selectionState` goes through
	// these two, so `primary` can never disagree with `items`.
	function setSelection(items: EntityRef[]) {
		state.selectionState = items.length ? { primary: items[0]!, items } : { primary: null, items: [] }
	}

	function clearSelection() {
		state.selectionState = { primary: null, items: [] }
	}

	function select(ref: EntityRef | null) {
		if (ref) {
			setSelection([ref])
			state.selectedAssetId = null
		} else {
			clearSelection()
		}
	}

	function selectedObject(): ObjectData | undefined {
		const primary = state.selectionState.primary
		if (primary?.type !== 'object') return undefined
		return currentFloor.value?.objects.find((o: ObjectData) => o.id === primary.id)
	}

	function selectedObjectIds(): string[] {
		return state.selectionState.items.map(item => item.id)
	}

	function toggleMultiSelect(id: string) {
		const ref: EntityRef = { type: 'object', id }
		const items = state.selectionState.items
		const existingIdx = items.findIndex(item => item.id === id)

		if (existingIdx >= 0) {
			setSelection(items.filter((_, index) => index !== existingIdx))
			return
		}

		setSelection([...items, ref])
	}

	return { selectAsset, selectedAsset, select, setSelection, clearSelection, selectedObject, selectedObjectIds, toggleMultiSelect }
}
