import { state } from './state'
import { computed } from 'vue'


export const globalTags = computed(() => {
	const set = new Set<string>()


	for (const role of state.layout.npcConfig?.roles ?? []) {
		for (const t of role.focusTags) set.add(t)
		for (const t of role.restrictedTags) set.add(t)
	}


	for (const task of state.layout.npcConfig?.tasks ?? []) {
		for (const t of task.tags) set.add(t)
	}


	for (const floor of state.layout.floors) {
		for (const room of floor.rooms ?? []) {
			for (const t of room.tags ?? []) set.add(t)
		}
	}


	for (const floor of state.layout.floors) {
		for (const obj of floor.objects ?? []) {
			for (const t of obj.customProps?.tags ?? []) set.add(t)
		}
	}

	return [...set].sort((a, b) => a.localeCompare(b))
})


export async function addTag(_tag: string): Promise<void> { }


export async function removeTag(_tag: string): Promise<void> { }


export async function ensureTag(_tag: string): Promise<void> { }


export async function ensureTags(_tags: string[]): Promise<void> { }
