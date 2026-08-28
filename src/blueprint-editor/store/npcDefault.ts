import { toRaw } from 'vue'
import type { NpcSimulationConfig } from '../types'
import { state } from './state'
import { saveNpcConfig } from './persistence'

export function mergeNpcConfig(config: NpcSimulationConfig): NpcSimulationConfig {
	const roleIds = new Set(config.roles.map(role => role.id))
	const taskIds = new Set(config.tasks.map(task => task.id))

	const rawRates = config.tagTriggerRates ?? {}
	const tagTriggerRates: Record<string, number> = {}
	for (const [tag, rate] of Object.entries(rawRates)) {
		const clamped = Math.max(0, Math.min(100, Math.floor(rate)))
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

export function syncNpcConfigToState(config: NpcSimulationConfig): void {
	state.layout.npcConfig = structuredClone(toRaw(config))
}


export async function persistNpcConfigToDisk(): Promise<void> {
	const saved = await saveNpcConfig()
	if (!saved) throw new Error('NPC configuration was not saved')
}

export async function updateNpcConfig(config: NpcSimulationConfig): Promise<void> {
	syncNpcConfigToState(config)
	await persistNpcConfigToDisk()
}
