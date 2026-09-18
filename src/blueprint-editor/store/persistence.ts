import type { BlueprintDataFile } from '../domain/types'
import type { BlueprintStore } from './state'
import { editorLog, emptyNpcConfig, cloneDeepRaw } from './storeUtils'
import { validateSettingsCompleteness } from '../assets/validation'
import { buildSyncedPayload } from '../syncedPayload'
import { buildBlueprintData } from './dataLoader'
import { migrate } from './migrate'
import { readBlueprintDataFile } from './schemaMigration'

export function createPersistenceCommands(store: BlueprintStore) {
	const state = store.state
	const assetMap = () => store.assetMap()
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)

	function syncToGame(): boolean {
		try {
			const payload = buildSyncedPayload(state.layout, assetMap(), state.layout.npcConfig)
			if (!payload) {
				store.toast.error('Sync failed: no floors could be mapped to the game')
				return false
			}
			store.sync.emit(payload)

			const completeness = validateSettingsCompleteness(state.layout, assetMap(), state.layout.npcConfig)
			if (completeness.issues.length > 0) {
				for (const issue of completeness.issues) editorLog.warn('Settings', issue)
				store.toast.warning(`Synced with ${completeness.issues.length} setting issue(s) - see console for details`)
			}
			return true
		} catch (error) {
			editorLog.error('syncToGame', error)
			store.toast.error('Sync failed')
			return false
		}
	}

	function exportWorkspace(): BlueprintDataFile {
		return cloneDeepRaw(buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig ?? emptyNpcConfig(), state.tagDefinitions))
	}

	async function importWorkspace(file: BlueprintDataFile): Promise<boolean> {
		return withStateLock(async () => {
			const normalized = readBlueprintDataFile(cloneDeepRaw(file))
			const migrated = migrate(normalized.layout, normalized.originAssets, normalized.npcConfig)
			state.layout = migrated.layout
			state.layout.npcConfig = cloneDeepRaw(normalized.npcConfig)
			state.assetRegistry = normalized.originAssets.map(asset => cloneDeepRaw(asset))
			for (const asset of state.assetRegistry) store.initAssetFields(asset)
			state.tagDefinitions = normalized.tags.map(tag => ({ ...tag }))
			if (!state.layout.floors.some(floor => floor.id === state.currentFloorId)) {
				state.currentFloorId = state.layout.floors[0]?.id ?? ''
			}
			state.selectionState = { primary: null, items: [] }
			state.selectedAssetId = null
			return store.save()
		})
	}

	return { syncToGame, exportWorkspace, importWorkspace }
}

export type PersistenceCommands = ReturnType<typeof createPersistenceCommands>