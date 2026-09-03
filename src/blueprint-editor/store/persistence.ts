import { state, toast, isStateLocked, withStateLock, assetMap, updateLastSavedSnapshot, revertToLastSavedSnapshot } from './state'
import { editorLog } from './storeUtils'
import { EDITOR_CONFIG } from '../editorConfig'
import { buildBlueprintData } from './dataLoader'
import { validateSettingsCompleteness } from '../assets/assetUtils'
import { normalizeBlueprintDataFile } from '../domain/types'
import { buildSyncedPayload } from '../syncedPayload'

const MAX_SAVE_RETRIES = 3
let isSavingBlueprintData = false

async function saveBlueprintDataLocked(): Promise<boolean> {
	if (isSavingBlueprintData) return false
	isSavingBlueprintData = true
	try {
		const body = JSON.stringify(buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig, state.tagDefinitions), null, 2) + '\n'
		for (let attempt = 1; attempt <= MAX_SAVE_RETRIES; attempt++) {
			try {
				const res = await fetch(EDITOR_CONFIG.blueprintDataEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Blueprint-Client': '1', 'X-Blueprint-Save': '1' },
					body,
				})
				if (!res.ok || !res.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error(`HTTP ${res.status}`)
				const response: unknown = await res.json()
				if (!response || typeof response !== 'object') throw new Error('Persistence verification response was invalid')
				const verified = response as Record<string, unknown>
				if (verified.ok !== true || !normalizeBlueprintDataFile(verified.data)) throw new Error('Persistence verification response was invalid')
				updateLastSavedSnapshot()
				return true
			} catch (error) {
				editorLog.error(`saveBlueprintData attempt ${attempt}`, error)
				if (attempt === MAX_SAVE_RETRIES) throw error
				await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
			}
		}
		return false
	} catch (error) {
		revertToLastSavedSnapshot()
		toast.error('Failed to save blueprint data')
		throw error
	} finally {
		isSavingBlueprintData = false
	}
}

export async function saveBlueprintData(): Promise<boolean> {
	if (isStateLocked()) return saveBlueprintDataLocked()
	return withStateLock(saveBlueprintDataLocked)
}

export function syncToGame(): boolean {
	try {
		const payload = buildSyncedPayload(state.layout, assetMap(), state.layout.npcConfig)
		if (!payload) {
			toast.error('Sync failed: no floors could be mapped to the game')
			return false
		}
		window.dispatchEvent(new CustomEvent('blueprint:sync', { detail: payload }))

		const completeness = validateSettingsCompleteness(state.layout, assetMap(), state.layout.npcConfig)
		if (completeness.issues.length > 0) {
			for (const issue of completeness.issues) editorLog.warn('Settings', issue)
			toast.warning(`Synced with ${completeness.issues.length} setting issue(s) - see console for details`)
		}
		return true
	} catch (error) {
		editorLog.error('syncToGame', error)
		toast.error('Sync failed')
		return false
	}
}

