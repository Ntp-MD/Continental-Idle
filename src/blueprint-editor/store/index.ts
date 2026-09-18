import { inject, provide, type InjectionKey } from 'vue'
import type { BlueprintStore } from './state'
import { createBlueprintStore, emptySeed } from './createStore'

export { createBlueprintStore, emptySeed }
export type { BlueprintStoreDeps, BlueprintStoreSeed } from './createStore'
export type { BlueprintStore, EditorState, AssetPatch, FloorPatch } from './state'
export { dragState, startAssetDrag, endAssetDrag } from './state'
export { createHttpPersistencePort, createWindowSyncPort } from './httpPorts'
export { createPersistencePort, resolvePersistenceMode, PersistenceUnavailableError } from './persistenceFactory'
export { createLocalPersistencePort, createIndexedDbStorage, createMemoryStorage, isIndexedDbAvailable } from './localPort'
export type { BlueprintStorage } from './localPort'
export { readBlueprintDataFile, InvalidBlueprintDataError, UnsupportedBlueprintVersionError } from './schemaMigration'
export { serializeWorkspace, parseWorkspace } from './workspaceFile'
export { PayloadTooLargeError } from './ports'
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