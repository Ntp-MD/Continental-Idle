import { computed } from 'vue'
import type { BlueprintTagDefinition } from '../types'
import { state } from '../store/state'
import { addTag, ensureTag, ensureTags } from '../store/tags'
import { saveBlueprintData } from '../store/persistence'

export const tagDefinitions = computed(() => state.tagDefinitions)

export function listTags(): readonly BlueprintTagDefinition[] {
	return state.tagDefinitions
}

export function getTag(id: string): BlueprintTagDefinition | undefined {
	return state.tagDefinitions.find(tag => tag.id === id)
}

export const createTag = addTag
export { ensureTag, ensureTags }

export async function updateTag(id: string, patch: Partial<BlueprintTagDefinition>): Promise<boolean> {
	const tag = getTag(id)
	if (!tag) return false
	if (patch.id !== undefined && patch.id !== id && state.tagDefinitions.some(item => item.id === patch.id)) return false
	Object.assign(tag, patch)
	await saveBlueprintData()
	return true
}

export async function deleteTag(id: string): Promise<boolean> {
	const before = state.tagDefinitions.length
	state.tagDefinitions = state.tagDefinitions.filter(tag => tag.id !== id)
	if (state.tagDefinitions.length === before) return false
	await saveBlueprintData()
	return true
}

export function findTagReferences(id: string): { assets: string[]; roles: string[]; tasks: string[] } {
	const assets = state.assetRegistry.filter(asset => asset.tags?.includes(id)).map(asset => asset.id)
	const npc = state.layout.npcConfig
	return {
		assets,
		roles: npc?.roles.filter(role => role.focusTags.includes(id) || role.restrictedTags.includes(id)).map(role => role.id) ?? [],
		tasks: npc?.tasks.filter(task => task.tags.includes(id)).map(task => task.id) ?? [],
	}
}
