import { computed } from 'vue'
import type { ObjectData, EntityRef } from '../types'
import { findAssetCached } from '../assetUtils'
import { state, currentFloor, assetMap } from './state'

export function selectAsset(id: string | null) {
	state.selectedAssetId = id
	if (id) state.selectionState = { primary: null, items: [] }
}

export const selectedAsset = computed(() =>
	state.selectedAssetId ? findAssetCached(assetMap(), state.selectedAssetId) ?? null : null,
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

export function selectedObject(): ObjectData | undefined {
	const primary = state.selectionState.primary
	if (primary?.type !== 'object') return undefined
	return currentFloor.value?.objects.find((o: ObjectData) => o.id === primary.id)
}

export function selectedObjectIds(): string[] {
	return state.selectionState.items.map(item => item.id)
}

export function toggleMultiSelect(id: string) {
	const ref: EntityRef = { type: 'object', id }
	const items = state.selectionState.items
	const existingIdx = items.findIndex(item => item.id === id)

	if (existingIdx >= 0) {
		const nextItems = items.filter((_, index) => index !== existingIdx)
		state.selectionState = nextItems.length
			? { primary: nextItems[0], items: nextItems }
			: { primary: null, items: [] }
		return
	}

	const nextItems = [...items, ref]
	state.selectionState = { primary: nextItems[0], items: nextItems }
}
