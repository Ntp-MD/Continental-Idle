import type { BlueprintStore } from './state'
import { editorLog } from './storeUtils'
import { validateSettingsCompleteness } from '../assets/validation'
import { buildSyncedPayload } from '../syncedPayload'

export function createPersistenceCommands(store: BlueprintStore) {
	const state = store.state
	const assetMap = () => store.assetMap()

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

	return { syncToGame }
}

export type PersistenceCommands = ReturnType<typeof createPersistenceCommands>