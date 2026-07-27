<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssetsStore } from '../blueprint-store'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const newTag = ref('')
const search = ref('')

const tags = computed(() => store.globalTags.value)

const filteredTags = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tags.value
  return tags.value.filter(t => t.toLowerCase().includes(q))
})

async function addTag() {
  const t = newTag.value.trim()
  if (!t) return
  await store.addTag(t)
  newTag.value = ''
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
  <div v-if="open" class="tag__manager__modal" @click.self="emit('close')">
    <div class="tag__manager__modal__dialog">
      <div class="tag__manager__modal__header">
        <span class="tag__manager__modal__title">Tag Manager</span>
        <button class="btn btn__ghost btn__icon" @click="emit('close')" aria-label="Close">✕</button>
      </div>
      <div class="tag__manager__modal__body">
        <div class="tag__manager__modal__add__row">
          <input
            v-model="newTag"
            class="tag__manager__modal__input"
            placeholder="New tag name..."
            @keydown="onKeydown"
          />
          <button class="btn btn__primary" @click="addTag">Add</button>
        </div>
        <div class="tag__manager__modal__search__row">
          <input
            v-model="search"
            class="tag__manager__modal__input"
            placeholder="Search tags..."
          />
        </div>
        <div class="tag__manager__modal__list">
          <div v-if="filteredTags.length === 0" class="tag__manager__modal__empty">
            No tags found
          </div>
          <div
            v-for="tag in filteredTags"
            :key="tag"
            class="tag"
          >
            <span class="tag__name">{{ tag }}</span>
            <button class="btn btn__ghost btn__icon btn__text__danger" @click="removeTag(tag)">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>

.tag__manager__modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg-primary) 60%, transparent);
}

.tag__manager__modal__dialog {
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tag__manager__modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
}

.tag__manager__modal__title {
  font-weight: 600;
  font-size: var(--font-md);
  color: var(--text-primary);
}

.tag__manager__modal__body {
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  overflow-y: auto;
}

.tag__manager__modal__add__row {
  display: flex;
  gap: var(--gap-xs);
}

.tag__manager__modal__search__row {
  display: flex;
}

.tag__manager__modal__input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--font-sm);
  padding: var(--gap-xs) var(--gap-sm);
  outline: none;
}

.tag__manager__modal__input:focus {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-gold) 15%, transparent);
}

.tag__manager__modal__list {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 40vh;
  overflow-y: auto;
}

.tag__manager__modal__list .tag {
  justify-content: space-between;
}</style>