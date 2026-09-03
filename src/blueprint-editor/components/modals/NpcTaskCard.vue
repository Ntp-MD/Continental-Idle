<script setup lang="ts">
import { ref } from 'vue'
import type { NpcTask } from '../../domain/types'
import { managedTagSet } from '../../blueprintStore'
import TagChip from '../inputs/TagChip.vue'

defineProps<{
  task: NpcTask
  usageCount: number
}>()

const emit = defineEmits<{
  (e: 'update'): void
  (e: 'rename', value: string): void
  (e: 'remove'): void
  (e: 'remove-tag', tag: string): void
  (e: 'add-tag', value: string): void
}>()

const newTagInput = ref('')

function submitTag() {
  const value = newTagInput.value.trim()
  if (!value) return
  emit('add-tag', value)
  newTagInput.value = ''
}
</script>

<template>
  <article class="form__col npc__taskcard">
    <div class="form__row">
      <input
        :value="task.label"
        type="text"
        aria-label="Task label"
        @change="emit('rename', ($event.target as HTMLInputElement).value)"
      />
      <button type="button" class="flag--danger" aria-label="Delete task" @click="emit('remove')">x</button>
    </div>
    <div class="form__row form__row--wrap">
      <TagChip
        v-for="tag in task.tags"
        :key="`${task.id}-${tag}`"
        :label="tag"
        removable
        :class="{ 'flag--warning': !managedTagSet.has(tag) }"
        @remove="emit('remove-tag', tag)"
      />
      <span v-if="!task.tags.length" class="empty">No tags</span>
    </div>
    <div class="form__row">
      <input
        v-model="newTagInput"
        type="text"
        placeholder="add tag"
        aria-label="Add task tag"
        @keydown.enter.prevent="submitTag"
        @change="submitTag"
      />
      <small class="npc__usagenote">used by {{ usageCount }} role(s)</small>
    </div>
  </article>
</template>

<style scoped>
.npc__taskcard {
  flex-shrink: 0;
}

.npc__usagenote {
  color: var(--text-dim);
  white-space: nowrap;
  align-self: center;
}
</style>
