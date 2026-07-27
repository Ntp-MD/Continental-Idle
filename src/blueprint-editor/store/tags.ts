import { state } from './state'
import { saveLayout } from './persistence'
import { computed } from 'vue'

export const globalTags = computed(() => state.globalTags)

function syncToLayout() {
  state.layout.globalTags = [...state.globalTags]
}

export async function addTag(tag: string): Promise<void> {
  const t = tag.trim()
  if (!t) return
  if (state.globalTags.includes(t)) return
  state.globalTags.push(t)
  state.globalTags.sort((a, b) => a.localeCompare(b))
  syncToLayout()
  await saveLayout()
}

export async function removeTag(tag: string): Promise<void> {
  const idx = state.globalTags.indexOf(tag)
  if (idx === -1) return
  state.globalTags.splice(idx, 1)
  syncToLayout()
  await saveLayout()
}

export async function ensureTag(tag: string): Promise<void> {
  const t = tag.trim()
  if (!t) return
  if (!state.globalTags.includes(t)) {
    await addTag(t)
  }
}

export async function ensureTags(tags: string[]): Promise<void> {
  for (const t of tags) await ensureTag(t)
}
