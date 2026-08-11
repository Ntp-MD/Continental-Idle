import type { ObjectData, OriginAssetFile, SyncedFloor, SyncedObject, SyncedLayoutPayload } from '../types'
import { normalizeAllowedRoleIds, normalizeInteractSpots, normalizeInteractConfig, normalizeTileEdges, normalizeTileStates, normalizeWalkableGrid, normalizeOriginAssetFile, isNpcConfig } from '../types'
import { state, toast, isStateLocked, withStateLock, assetMap } from './state'
import { editorLog, editorFloorLabelToFloorId } from './utils'
import { EDITOR_CONFIG } from './migrate'
import { serializeObject } from '../assetUtils'

let saveDebounceTimer: number | null = null
let isSaving = false
let assetsSaveDebounceTimer: number | null = null
let isSavingAssets = false
let npcConfigSaveDebounceTimer: number | null = null
let isSavingNpcConfig = false
const MAX_SAVE_RETRIES = 3


export async function saveLayout(): Promise<boolean> {
	if (isStateLocked()) return saveLayoutLocked()
	try {
		return await withStateLock(saveLayoutLocked)
	} catch (error) {
		if (error instanceof Error && error.message === 'Operation in progress') {
			await new Promise(resolve => window.setTimeout(resolve, 0))
			return saveLayout()
		}
		throw error
	}
}

async function saveLayoutLocked(): Promise<boolean> {
	if (isSaving) {
		if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer)
		saveDebounceTimer = window.setTimeout(() => saveLayout(), EDITOR_CONFIG.saveDebounceMs)
		editorLog.info('saveLayout', 'save deferred — another save in progress')
		return true
	}

	isSaving = true
	let hasDebounced = false
	let success = false
	try {
		const body = JSON.stringify({
			version: state.layout.version,
			canvas: state.layout.canvas,
			floors: state.layout.floors.map(f => ({
				...f,
				objects: f.objects.map(o => serializeObject(o)),
			})),
		})

		const attemptSave = async (attempt: number): Promise<boolean> => {
			try {
				const res = await fetch(EDITOR_CONFIG.saveEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Blueprint-Save': '1' },
					body,
				})
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return true
			} catch (e) {
				editorLog.error('saveLayout attempt ' + attempt, e)
				if (attempt < MAX_SAVE_RETRIES) {
					await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
					return attemptSave(attempt + 1)
				}
				return false
			}
		}

		success = await attemptSave(1)
		if (!success) {
			editorLog.error('saveLayout', 'All retries failed')
			toast.error('Failed to save - falling back to download')
			const blob = new Blob([body], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'blueprintLayout.json'
			a.click()
			window.setTimeout(() => URL.revokeObjectURL(url), 1000)
			throw new Error('Layout was not saved to blueprintLayout.json')
		}
	} finally {
		isSaving = false
		if (saveDebounceTimer) {
			window.clearTimeout(saveDebounceTimer)
			saveDebounceTimer = null
			hasDebounced = true
		}
	}

	if (hasDebounced) return saveLayout()
	return success
}

function serializeOriginAssets(): OriginAssetFile {
	const normalized = normalizeOriginAssetFile({
		$schema: 'origin-assets.v1.json',
		version: 1,
		originAssets: state.assetRegistry,
	})
	if (!normalized) throw new Error('Origin asset registry failed normalization')
	return normalized
}


export async function saveAssets(): Promise<void> {
	if (isStateLocked()) return saveAssetsLocked()
	try {
		await withStateLock(saveAssetsLocked)
	} catch (error) {
		if (error instanceof Error && error.message === 'Operation in progress') {
			await new Promise(resolve => window.setTimeout(resolve, 0))
			return saveAssets()
		}
		throw error
	}
}

async function saveAssetsLocked(): Promise<void> {
	if (isSavingAssets) {
		if (assetsSaveDebounceTimer) window.clearTimeout(assetsSaveDebounceTimer)
		assetsSaveDebounceTimer = window.setTimeout(() => saveAssets(), EDITOR_CONFIG.saveDebounceMs)
		editorLog.info('saveAssets', 'save deferred — another save in progress')
		return
	}

	isSavingAssets = true
	let hasDebounced = false
	try {
		const body = JSON.stringify(serializeOriginAssets())

		const attemptSave = async (attempt: number): Promise<boolean> => {
			try {
				const res = await fetch(EDITOR_CONFIG.assetsSaveEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Blueprint-Save': '1' },
					body,
				})
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return true
			} catch (e) {
				editorLog.error('saveAssets attempt ' + attempt, e)
				if (attempt < MAX_SAVE_RETRIES) {
					await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
					return attemptSave(attempt + 1)
				}
				return false
			}
		}

		const success = await attemptSave(1)
		if (!success) {
			editorLog.error('saveAssets', 'All retries failed')
			toast.error('Failed to save assets')
			throw new Error('Origin assets were not saved to originAssets.json')
		}
	} finally {
		isSavingAssets = false
		if (assetsSaveDebounceTimer) {
			window.clearTimeout(assetsSaveDebounceTimer)
			assetsSaveDebounceTimer = null
			hasDebounced = true
		}
	}

	if (hasDebounced) await saveAssets()
}


export async function saveNpcConfig(): Promise<boolean> {
	if (isStateLocked()) return saveNpcConfigLocked()
	try {
		return await withStateLock(saveNpcConfigLocked)
	} catch (error) {
		if (error instanceof Error && error.message === 'Operation in progress') {
			await new Promise(resolve => window.setTimeout(resolve, 0))
			return saveNpcConfig()
		}
		throw error
	}
}

async function saveNpcConfigLocked(): Promise<boolean> {
	if (isSavingNpcConfig) {
		if (npcConfigSaveDebounceTimer) window.clearTimeout(npcConfigSaveDebounceTimer)
		npcConfigSaveDebounceTimer = window.setTimeout(() => saveNpcConfig(), EDITOR_CONFIG.saveDebounceMs)
		editorLog.info('saveNpcConfig', 'save deferred — another save in progress')
		return true
	}

	isSavingNpcConfig = true
	let hasDebounced = false
	let success = false
	try {
		if (!isNpcConfig(state.layout.npcConfig)) {
			editorLog.error('saveNpcConfig', 'NPC config failed validation — aborting save')
			toast.error('NPC config is malformed — cannot save')
			return false
		}
		const body = JSON.stringify(state.layout.npcConfig)

		const attemptSave = async (attempt: number): Promise<boolean> => {
			try {
				const res = await fetch(EDITOR_CONFIG.npcConfigSaveEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Blueprint-Save': '1' },
					body,
				})
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return true
			} catch (e) {
				editorLog.error('saveNpcConfig attempt ' + attempt, e)
				if (attempt < MAX_SAVE_RETRIES) {
					await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
					return attemptSave(attempt + 1)
				}
				return false
			}
		}

		success = await attemptSave(1)
		if (!success) {
			editorLog.error('saveNpcConfig', 'All retries failed')
			toast.error('Failed to save NPC config')
			throw new Error('NPC config was not saved to npcConfig.json')
		}
	} finally {
		isSavingNpcConfig = false
		if (npcConfigSaveDebounceTimer) {
			window.clearTimeout(npcConfigSaveDebounceTimer)
			npcConfigSaveDebounceTimer = null
			hasDebounced = true
		}
	}

	if (hasDebounced) return saveNpcConfig()
	return success
}

export function syncToGame(): boolean {
	try {
		const floors: Record<string, SyncedFloor> = {}
		for (const floor of state.layout.floors) {
			const floorId = editorFloorLabelToFloorId(floor.label)
			if (!floorId) continue
			const allowedRoleIds = normalizeAllowedRoleIds(floor.allowedRoleIds)
			floors[floorId] = {
				defaultWalkable: floor.defaultWalkable ?? true,
				...(allowedRoleIds ? { allowedRoleIds } : {}),
				objects: floor.objects.map((o: ObjectData) => {
					const asset = assetMap().get(o.type)
					const interactSpots = normalizeInteractSpots(asset?.interactSpots)
					const interact = normalizeInteractConfig(asset?.interact)
					const walkableGrid = normalizeWalkableGrid(asset?.walkableGrid)
					const tileStates = normalizeTileStates(asset?.tileStates)
					const tileEdges = normalizeTileEdges(asset?.tileEdges)
					const obj: SyncedObject = {
						id: o.id,
						type: o.type,
						x: o.x,
						y: o.y,
						w: o.w,
						h: o.h,
						rotation: o.rotation,
						walkable: asset?.walkable ?? false,
						entranceRequired: asset?.entranceRequired ?? false,
					}
					if (o.fillColor) obj.fillColor = o.fillColor
					if (o.label) obj.label = o.label
					if (walkableGrid) obj.walkableGrid = walkableGrid
					if (tileStates) obj.tileStates = tileStates
					if (tileEdges) obj.tileEdges = tileEdges
					if (interactSpots?.length) obj.interactSpots = interactSpots
					if (interact) obj.interact = interact
					return obj
				}),
			}
		}
		const payload: SyncedLayoutPayload = {
			version: 3,
			canvas: state.layout.canvas,
			floors,
			timestamp: Date.now(),
		}
		window.dispatchEvent(new CustomEvent('blueprint:sync', { detail: payload }))
		return true
	} catch (e) {
		editorLog.error('syncToGame', e)
		toast.error('Sync failed')
		return false
	}
}
