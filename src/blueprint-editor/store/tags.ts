import { computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { saveBlueprintData } from './persistence'
import { state } from './state'
import { buildTagCatalog } from '../tagCatalog'

function normalizeTag(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, '-')
}

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
	const before = state.tagDefinitions.length
	state.tagDefinitions = state.tagDefinitions.filter(item => item.id !== normalized)
	if (state.tagDefinitions.length === before) return false
	return saveBlueprintData()
}

export async function ensureTag(tag: string): Promise<void> {
	const normalized = normalizeTag(tag)
	if (normalized && !managedTagSet.value.has(normalized)) {
		useToast().warning(`Tag "${normalized}" is not defined in the NPC Manager.`)
	}
}
