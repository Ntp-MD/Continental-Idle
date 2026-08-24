import type { ObjectData, SyncedFloor, SyncedObject, SyncedLayoutPayload } from '../types'
import { normalizeAllowedRoleIds, normalizeInteractSpots, normalizeInteractConfig, normalizeNpcQueueConfig, normalizeNpcSpawnZones, normalizeFloorWalkable, normalizeTileEdges, normalizeTileStates, normalizeWalkableGrid, normalizeNpcConfig, resolveStreetTiles } from '../types'
import { state, toast, isStateLocked, withStateLock, assetMap, reloadEditorData } from './state'
import { editorLog, assignSyncKey } from './utils'
import { EDITOR_CONFIG } from './migrate'
import { buildBlueprintData } from './dataLoader'
import { validateSettingsCompleteness } from '../assetUtils'

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
		const floors: Record<string, SyncedFloor> = {}
		const usedKeys = new Set<string>()
		const mappedInfo: string[] = []
		state.layout.floors.forEach((floor, index) => {
			const floorId = assignSyncKey(floor.label, index, usedKeys)
			usedKeys.add(floorId)
			mappedInfo.push(`${floor.label || floor.name || '?'}->${floorId}`)
			const allowedRoleIds = normalizeAllowedRoleIds(floor.allowedRoleIds)
			const walkable = normalizeFloorWalkable(floor.walkable)
			const spawnZones = normalizeNpcSpawnZones(floor.spawnZones)
			floors[floorId] = {
				defaultWalkable: floor.defaultWalkable ?? true,
				...(walkable ? { walkable } : {}),
				...(spawnZones?.length ? { spawnZones } : {}),
				...(allowedRoleIds ? { allowedRoleIds } : {}),
				objects: floor.objects.map((o: ObjectData) => {
					const asset = assetMap().get(o.type)
					const interactSpots = normalizeInteractSpots(asset?.interactSpots)
					const interact = normalizeInteractConfig(asset?.interact)
					const queue = normalizeNpcQueueConfig(asset?.queue)
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
					if (o.strokeColor) obj.strokeColor = o.strokeColor
					if (o.label) obj.label = o.label
					if (walkableGrid) obj.walkableGrid = walkableGrid
					if (tileStates) obj.tileStates = tileStates
					if (tileEdges) obj.tileEdges = tileEdges
					if (interactSpots?.length) obj.interactSpots = interactSpots
					if (interact) obj.interact = interact
					if (queue) obj.queue = queue
					return obj
				}),
				}
		})
		if (Object.keys(floors).length === 0) {
			toast.error('Sync failed: no floors could be mapped to the game')
			editorLog.error('syncToGame', new Error('zero mappable floors'))
			return false
		}
		editorLog.info('syncToGame floors', mappedInfo.join(', '))
		const npcConfig = normalizeNpcConfig(state.layout.npcConfig)
		const payload: SyncedLayoutPayload = {
			version: 3,
			canvas: { ...state.layout.canvas, streetWidthTiles: resolveStreetTiles(state.layout) },
			floors,
			...(npcConfig ? { npcConfig } : {}),
			timestamp: Date.now(),
		}
		window.dispatchEvent(new CustomEvent('blueprint:sync', { detail: payload }))

		const completeness = validateSettingsCompleteness(state.layout, assetMap(), state.layout.npcConfig)
		if (completeness.issues.length > 0) {
			for (const issue of completeness.issues) editorLog.warn('Settings', issue)
			toast.warning(`Synced with ${completeness.issues.length} setting issue(s) — see console for details`)
		}
		return true
	} catch (error) {
		editorLog.error('syncToGame', error)
		toast.error('Sync failed')
		return false
	}
}
