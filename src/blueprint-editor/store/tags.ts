import { computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { saveAssets, saveLayout } from './persistence'
import { persistNpcConfigToDisk } from './npcDefault'
import { state } from './state'

function normalizeTag(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

export const globalTags = computed(() => {
	const tags = new Set<string>()
	for (const asset of state.assetRegistry) for (const tag of asset.tags ?? []) tags.add(tag)
	return [...tags].sort((a, b) => a.localeCompare(b))
})

export const managedTagSet = computed(() => new Set(globalTags.value))

export async function addTag(tag: string): Promise<void> {
	const normalized = normalizeTag(tag)
	if (!normalized) return
	useToast().warning(`Add tag "${normalized}" to an origin asset first.`)
}

export async function removeTag(tag: string): Promise<void> {
	const normalized = normalizeTag(tag)
	for (const asset of state.assetRegistry) {
		if (asset.tags?.includes(normalized)) {
			asset.tags = asset.tags.filter(item => item !== normalized)
			if (asset.tags.length === 0) delete asset.tags
		}
	}
	const npc = state.layout.npcConfig
	if (npc) {
		for (const role of npc.roles) {
			role.focusTags = role.focusTags.filter(item => item !== normalized)
			role.restrictedTags = role.restrictedTags.filter(item => item !== normalized)
		}
		for (const task of npc.tasks) task.tags = task.tags.filter(item => item !== normalized)
		if (npc.tagTriggerRates) {
			delete npc.tagTriggerRates[normalized]
			if (Object.keys(npc.tagTriggerRates).length === 0) delete npc.tagTriggerRates
		}
	}
	await saveAssets()
	await saveLayout()
	await persistNpcConfigToDisk()
}

export async function ensureTag(tag: string): Promise<void> {
	const normalized = normalizeTag(tag)
	if (normalized && !globalTags.value.includes(normalized)) {
		useToast().warning(`Tag "${normalized}" is not defined on an origin asset.`)
	}
}

export async function ensureTags(tags: string[]): Promise<void> {
	for (const tag of tags) await ensureTag(tag)
}

export function hydrateCustomTags(): void { }
