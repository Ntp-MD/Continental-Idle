import type { BlueprintDataFile } from '../domain/types'
import type { BlueprintStore } from './state'
import { emptyNpcConfig, cloneDeepRaw } from './storeUtils'
import { buildBlueprintData } from './dataLoader'
import { migrate } from './migrate'
import { readBlueprintDataFile } from './schemaMigration'

export function createPersistenceCommands(store: BlueprintStore) {
	const state = store.state
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)

	function exportWorkspace(): BlueprintDataFile {
		return cloneDeepRaw(buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig ?? emptyNpcConfig(), state.tagDefinitions))
	}

	async function importWorkspace(file: BlueprintDataFile): Promise<boolean> {
		return withStateLock(async () => {
			const normalized = readBlueprintDataFile(cloneDeepRaw(file))
			const migrated = migrate(normalized.layout, normalized.originAssets, normalized.npcConfig)
			const countObjects = (floors: { objects: unknown[] }[]) => floors.reduce((sum, floor) => sum + floor.objects.length, 0)
			const losses: string[] = []
			const droppedObjects = countObjects(normalized.layout.floors) - countObjects(migrated.layout.floors)
			if (droppedObjects > 0) losses.push(`${droppedObjects} object(s)`)
			const droppedRoles = normalized.npcConfig.roles.length - (migrated.layout.npcConfig?.roles.length ?? 0)
			if (droppedRoles > 0) losses.push(`${droppedRoles} role(s)`)
			const droppedTasks = normalized.npcConfig.tasks.length - (migrated.layout.npcConfig?.tasks.length ?? 0)
			if (droppedTasks > 0) losses.push(`${droppedTasks} task(s)`)
			const droppedPool = normalized.npcConfig.pool.length - (migrated.layout.npcConfig?.pool.length ?? 0)
			if (droppedPool > 0) losses.push(`${droppedPool} pool entr(y/ies)`)
			state.layout = migrated.layout
			state.layout.npcConfig = cloneDeepRaw(normalized.npcConfig)
			state.assetRegistry = normalized.originAssets.map(asset => cloneDeepRaw(asset))
			for (const asset of state.assetRegistry) store.initAssetFields(asset)
			state.tagDefinitions = normalized.tags.map(tag => ({ ...tag }))
			if (!state.layout.floors.some(floor => floor.id === state.currentFloorId)) {
				state.currentFloorId = state.layout.floors[0]?.id ?? ''
			}
			store.clearSelection()
			state.selectedAssetId = null
			const saved = await store.save()
			if (saved && losses.length > 0) {
				store.toast.warning(`Workspace imported with losses: ${losses.join(', ')}`)
			}
			return saved
		})
	}

	return { exportWorkspace, importWorkspace }
}
