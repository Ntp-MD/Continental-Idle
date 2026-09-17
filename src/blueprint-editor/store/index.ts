import { inject, provide, type InjectionKey } from 'vue'
import type { BlueprintStore } from './state'
import { createBlueprintStore, defaultSeed } from './createStore'

export { createBlueprintStore, defaultSeed }
export type { BlueprintStoreDeps, BlueprintStoreSeed } from './createStore'
export type { BlueprintStore, EditorState, AssetPatch, FloorPatch } from './state'
export { dragState, startAssetDrag, endAssetDrag } from './state'
export { createHttpPersistencePort, createWindowSyncPort } from './httpPorts'
export type { PersistencePort, SyncPort } from './ports'

export type AssetsStore = BlueprintStore

export const STORE_KEY = Symbol('blueprintStore') as InjectionKey<BlueprintStore>

export function provideBlueprintStore(store: BlueprintStore): void {
	provide(STORE_KEY, store)
}

export function useAssetsStore(): BlueprintStore {
	const store = inject(STORE_KEY)
	if (!store) throw new Error('No BlueprintStore provided - call provideBlueprintStore() at the app root')
	return store
}