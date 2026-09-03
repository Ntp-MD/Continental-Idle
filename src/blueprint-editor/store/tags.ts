import { computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { saveBlueprintData } from './persistence'
import { state } from './state'
import { buildTagCatalog } from '../assets/tagCatalog'
import { normalizeTag } from '../domain/types'

export const tagCatalog = computed(() => buildTagCatalog(state.tagDefinitions, state.assetRegistry, state.layout.npcConfig))
export const globalTags = computed(() => tagCatalog.value.definitions.map(tag => tag.id).sort((a, b) => a.localeCompare(b)))
export const managedTagSet = computed(() => new Set(globalTags.value))

export async function addTag(tag: string): Promise<void> {
	const normalized = normalizeTag(tag)
	if (!normalized || state.tagDefinitions.some(item => item.id === normalized)) return
	state.tagDefinitions.push({ id: normalized, label: normalized })
	await saveBlueprintData()
}

export async function removeTag(tag: string): Promise<boolean> {
	const normalized = normalizeTag(tag)
	if (!normalized) return false
	const before = state.tagDefinitions.length
	state.tagDefinitions = state.tagDefinitions.filter(item => item.id !== normalized)
	if (state.tagDefinitions.length === before) return false
	for (const asset of state.assetRegistry) {
		if (asset.tags?.includes(normalized)) {
			asset.tags = asset.tags.filter(t => t !== normalized)
			if (asset.tags.length === 0) delete asset.tags
		}
	}
	const npcConfig = state.layout.npcConfig
	if (npcConfig) {
		for (const role of npcConfig.roles) {
			role.focusTags = role.focusTags.filter(t => t !== normalized)
			role.restrictedTags = role.restrictedTags.filter(t => t !== normalized)
			if (role.spawnRule?.targetTags) {
				role.spawnRule.targetTags = role.spawnRule.targetTags.filter(t => t !== normalized)
				if (role.spawnRule.targetTags.length === 0) delete role.spawnRule.targetTags
			}
		}
		for (const task of npcConfig.tasks) {
			task.tags = task.tags.filter(t => t !== normalized)
		}
		if (npcConfig.tagTriggerRates?.[normalized] !== undefined) {
			delete npcConfig.tagTriggerRates[normalized]
			if (Object.keys(npcConfig.tagTriggerRates).length === 0) delete npcConfig.tagTriggerRates
		}
	}
	return saveBlueprintData()
}

export async function ensureTag(tag: string): Promise<void> {
	const normalized = normalizeTag(tag)
	if (normalized && !managedTagSet.value.has(normalized)) {
		useToast().warning(`Tag "${normalized}" is not defined in the NPC Manager.`)
	}
}
