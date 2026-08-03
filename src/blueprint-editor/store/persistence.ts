import type { RoomData, ObjectData, AssetDef } from '../types'
import { state, toast, isStateLocked, withStateLock, assetMap } from './state'
import { editorLog, editorFloorLabelToFloorId } from './utils'
import { assetCatalog } from './dataLoader'
import { EDITOR_CONFIG } from './migrate'

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
		if (error instanceof Error && error.message === 'Operation in progress, please wait') {
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
		return true
	}

	isSaving = true
	let hasDebounced = false
	let success = false
	try {
		const body = JSON.stringify({
			version: state.layout.version,
			canvas: state.layout.canvas,
			floors: state.layout.floors,
			roomTemplates: state.layout.roomTemplates ?? [],
			globalTags: state.layout.globalTags ?? [],
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

/**
 * Extract custom assets (non-catalog IDs or overrides of catalog assets) and
 * deleted default IDs from the runtime `state.assetRegistry`.
 */
function extractCustomAssets(): { customAssets: AssetDef[]; deletedDefaultIds: string[] } {
	const catalogMap = new Map(assetCatalog.map(a => [a.id, a]))
	const currentIds = new Set(state.assetRegistry.map(a => a.id))
	const customAssets: AssetDef[] = []
	for (const asset of state.assetRegistry) {
		const catalogAsset = catalogMap.get(asset.id)
		if (!catalogAsset) {
			customAssets.push(asset)
		} else if (JSON.stringify(asset) !== JSON.stringify(catalogAsset)) {
			customAssets.push(asset)
		}
	}
	const deletedDefaultIds = assetCatalog.filter(a => !currentIds.has(a.id)).map(a => a.id)
	return { customAssets, deletedDefaultIds }
}

export async function saveAssets(): Promise<void> {
	if (isStateLocked()) return saveAssetsLocked()
	try {
		await withStateLock(saveAssetsLocked)
	} catch (error) {
		if (error instanceof Error && error.message === 'Operation in progress, please wait') {
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
		return
	}

	isSavingAssets = true
	let hasDebounced = false
	try {
		const { customAssets, deletedDefaultIds } = extractCustomAssets()
		// Keep state.layout.deletedDefaultIds in sync for runtime use.
		state.layout.deletedDefaultIds = deletedDefaultIds
		const body = JSON.stringify({ customAssets, deletedDefaultIds })

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
			throw new Error('Assets were not saved to customAssets.json')
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
		if (error instanceof Error && error.message === 'Operation in progress, please wait') {
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
		return true
	}

	isSavingNpcConfig = true
	let hasDebounced = false
	let success = false
	try {
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
		const synced: Record<string, {
			defaultWalkable: boolean
			rooms: Array<{ id: string; x: number; y: number; w: number; h: number; label: string; sub: string; radius: number; roomType: string; walkable: boolean; entrances?: unknown[]; anchorPoints?: [number, number][]; tags?: string[] }>
			objects: Array<{ id: string; type: string; x: number; y: number; w: number; h: number; rotation: number; walkable: boolean; entranceRequired: boolean; walkableGrid?: boolean[][]; tileStates?: string[][]; roomId?: string; label?: string; fillColor?: string; tags?: string[] }>
			zones: Array<{ id: string; x: number; y: number; w: number; h: number; label: string; color: string; tags?: string[] }>
		}> = {}
		for (const floor of state.layout.floors) {
			const floorId = editorFloorLabelToFloorId(floor.label)
			if (!floorId) continue
			synced[floorId] = {
				defaultWalkable: floor.defaultWalkable ?? true,
				rooms: floor.rooms.map((r: RoomData) => ({
					id: r.id,
					x: r.x,
					y: r.y,
					w: r.w,
					h: r.h,
					label: r.label,
					sub: '',
					radius: r.radius ?? 0,
					roomType: r.roomType ?? 'room',
					walkable: r.walkable ?? true,
					...(r.entrances ? { entrances: r.entrances } : {}),
					...(r.anchorPoints ? { anchorPoints: r.anchorPoints } : {}),
					...(r.tags ? { tags: r.tags } : {}),
				})),
				zones: (floor.zones ?? []).map(z => ({ ...z })),
				objects: floor.objects.map((o: ObjectData) => ({
					id: o.id,
					type: o.type,
					x: o.x,
					y: o.y,
					w: o.w,
					h: o.h,
					rotation: o.rotation,
					fillColor: o.fillColor,
					walkable: o.walkable ?? !o.isWall,
					entranceRequired: o.entranceRequired ?? false,
					...(o.walkableGrid ? { walkableGrid: o.walkableGrid } : {}),
					...(o.tileStates ? { tileStates: o.tileStates } : {}),
					...(o.roomId ? { roomId: o.roomId } : {}),
					...(o.label ? { label: o.label } : {}),
					...((() => {
						const assetTags = assetMap().get(o.type)?.tags ?? []
						const tags = [...assetTags, ...(o.customProps?.tags ?? [])]
						return tags.length > 0 ? { tags: [...new Set(tags)] } : {}
					})()),
				})),
			}
		}
		window.dispatchEvent(new CustomEvent('blueprint:sync', {
			detail: {
				version: 3,
				canvas: state.layout.canvas,
				npcConfig: state.layout.npcConfig,
				floors: synced,
				timestamp: Date.now(),
			},
		}))
		return true
	} catch (e) {
		editorLog.error('syncToGame', e)
		toast.error('Sync failed')
		return false
	}
}
