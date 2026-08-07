<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { sanitizeTag } from '../../utils/sanitize'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const newTagRaw = ref('')
const newTag = computed({
  get: () => newTagRaw.value,
  set: (v: string) => { newTagRaw.value = sanitizeTag(v) },
})
const search = ref('')

const tags = computed(() => store.globalTags.value)

const filteredTags = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tags.value
  return tags.value.filter(t => t.toLowerCase().includes(q))
})

async function addTag() {
  const t = newTagRaw.value.trim()
  if (!t) return
  await store.addTag(t)
  newTagRaw.value = ''
}

async function removeTag(tag: string) {
  await store.removeTag(tag)
}

async function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    await addTag()
  }
}
</script>

<template>
  <div v-if="open" class="modal__overlay tagmanager__modal" @click.self="emit('close')">
    <div class="tagmanager__dialog__vstack">
      <div class="tagmanager__space__row">
        <span class="tagmanager__title__label">Tag Manager</span>
        <button class="btn__ghost btn__icon" @click="emit('close')" aria-label="Close">✕</button>
      </div>
      <div class="tagmanager__body__vstack">
        <div class="tagmanager__add__hstack">
          <input
            v-model="newTag"
            class="tagmanager__input__panel"
            placeholder="New tag name..."
            @keydown="onKeydown"
          />
          <button class="btn__primary" @click="addTag">Add</button>
        </div>
        <div class="tagmanager__search__hstack">
          <input
            v-model="search"
            class="tagmanager__input__panel"
            placeholder="Search tags..."
          />
        </div>
        <div class="tagmanager__scroll__stack">
          <div v-if="filteredTags.length === 0" class="tagmanager__empty">
            No tags found
          </div>
          <div
            v-for="tag in filteredTags"
            :key="tag"
            class="tag"
          >
            <span class="tag__name">{{ tag }}</span>
            <button class="btn__danger btn__icon" @click="removeTag(tag)">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>

.tagmanager__modal {
  z-index: 1001;
}

.tagmanager__dialog__vstack {
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tagmanager__space__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
}

.tagmanager__title__label {
  font-weight: 600;
  font-size: var(--font-md);
  color: var(--text-primary);
}

.tagmanager__body__vstack {
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  overflow-y: auto;
}

.tagmanager__add__hstack {
  display: flex;
  gap: var(--gap-xs);
}

.tagmanager__search__hstack {
  display: flex;
}

.tagmanager__input__panel {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--font-sm);
  padding: var(--gap-xs) var(--gap-sm);
  outline: none;
}

.tagmanager__input__panel:focus {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-gold) 15%, transparent);
}

.tagmanager__scroll__stack {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 40vh;
  overflow-y: auto;
}

.tagmanager__scroll__stack .tag {
  justify-content: space-between;
}

.tag__name {
	flex: 1;
}</style>