import type { NpcSimulationConfig } from '../domain/types'
import { clampInt, normalizeNpcConfig } from '../domain/types'
import type { BlueprintStore } from './state'
import { cloneDeepRaw } from './storeUtils'

export function mergeNpcConfig(config: NpcSimulationConfig): NpcSimulationConfig {
	const roleIds = new Set(config.roles.map(role => role.id))
	const taskIds = new Set(config.tasks.map(task => task.id))

	const rawRates = config.tagTriggerRates ?? {}
	const tagTriggerRates: Record<string, number> = {}
	for (const [tag, rate] of Object.entries(rawRates)) {
		const clamped = clampInt(rate, 0, 100)
		if (clamped > 0) tagTriggerRates[tag.trim()] = clamped
	}

	return {
		...config,
		roles: config.roles.map(role => ({
			...role,
			taskIds: role.taskIds.filter(id => taskIds.has(id)),
		})),
		tasks: config.tasks,
		pool: config.pool.filter(entry => roleIds.has(entry.roleId)),
		tagTriggerRates: Object.keys(tagTriggerRates).length > 0 ? tagTriggerRates : undefined,
	}
}

export function createNpcCommands(store: BlueprintStore) {
	const state = store.state
	const saveBlueprintData = () => store.save()

	function syncNpcConfigToState(config: NpcSimulationConfig): void {
		const raw = cloneDeepRaw(config)
		state.layout.npcConfig = normalizeNpcConfig(raw) ?? raw
	}

	async function persistNpcConfigToDisk(): Promise<void> {
		const saved = await saveBlueprintData()
		if (!saved) throw new Error('NPC configuration was not saved')
	}

	async function updateNpcConfig(config: NpcSimulationConfig): Promise<void> {
		syncNpcConfigToState(config)
		await persistNpcConfigToDisk()
	}

	return { syncNpcConfigToState, persistNpcConfigToDisk, updateNpcConfig }
}

export type NpcCommands = ReturnType<typeof createNpcCommands>