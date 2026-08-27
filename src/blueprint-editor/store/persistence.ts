import type { SyncedLayoutPayload } from '../types'
import { state, toast, isStateLocked, withStateLock, assetMap, reloadEditorData } from './state'
import { editorLog } from './utils'
import { EDITOR_CONFIG } from './migrate'
import { buildBlueprintData, fetchBlueprintDataFromDisk } from './dataLoader'
import { validateSettingsCompleteness, buildAssetMap } from '../assetUtils'
import type { AssetDef, FloorLayoutData, NpcSimulationConfig } from '../types'
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
					headers: { 'Content-Type': 'application/json', 'X-Blueprint-Save': '1' },
					body,
				})
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				const verified = await res.json() as { ok?: boolean; data?: unknown }
				if (verified.ok !== true || !verified.data) throw new Error('Persistence verification response was invalid')
				return true
			} catch (error) {
				editorLog.error(`saveBlueprintData attempt ${attempt}`, error)
				if (attempt === MAX_SAVE_RETRIES) throw error
				await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
			}
		}
		return false
	} catch (error) {
		try {
			await reloadEditorData()
		} catch (reloadError) {
			editorLog.error('reload after failed save', reloadError)
		}
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

export async function saveLayout(): Promise<boolean> {
	return saveBlueprintData()
}

export async function saveAssets(): Promise<void> {
	await saveBlueprintData()
}

export async function saveNpcConfig(): Promise<boolean> {
	return saveBlueprintData()
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

export async function loadPersistedSyncPayload(): Promise<SyncedLayoutPayload | null> {
	const data = await fetchBlueprintDataFromDisk()
	if (!data) return null
	const assets = buildAssetMap(data.originAssets)
	const npcConfig: NpcSimulationConfig | undefined = data.npcConfig ?? undefined
	return buildSyncedPayload(data.layout as FloorLayoutData, assets, npcConfig)
}
