<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NpcTask } from '../../domain/types'
import { managedTagSet } from '../../blueprintStore'
import TagChip from '../inputs/TagChip.vue'

export interface TaskStationAsset {
  id: string
  name: string
  posts: string[]
}

const props = defineProps<{
  task: NpcTask
  usageCount: number
  assets: TaskStationAsset[]
}>()

const emit = defineEmits<{
  (e: 'update'): void
  (e: 'rename', value: string): void
  (e: 'remove'): void
  (e: 'remove-tag', tag: string): void
  (e: 'add-tag', value: string): void
  (e: 'set-post-asset', assetId: string): void
  (e: 'set-post-name', name: string): void
  (e: 'clear-post'): void
}>()

const newTagInput = ref('')

const postSuggestions = computed(() => props.assets.find((asset) => asset.id === props.task.post?.assetId)?.posts ?? [])

function submitTag() {
  const value = newTagInput.value.trim()
  if (!value) return
  emit('add-tag', value)
  newTagInput.value = ''
}
</script>

<template>
  <article class="form__col npc__card">
    <div class="form__row">
      <input
        :value="task.label"
        type="text"
        aria-label="Task label"
        @change="emit('rename', ($event.target as HTMLInputElement).value)"
      />
      <button type="button" class="flag--danger" aria-label="Delete task" @click="emit('remove')">x</button>
    </div>
    <ul v-if="task.tags.length" class="form__row form--wrap">
      <li v-for="tag in task.tags" :key="`${task.id}-${tag}`">
        <TagChip
          :label="tag"
          removable
          :class="{ 'flag--warning': !managedTagSet.has(tag) }"
          @remove="emit('remove-tag', tag)"
        />
      </li>
    </ul>
    <span v-else class="empty">No tags</span>
    <div class="form__row">
      <input
        v-model="newTagInput"
        type="text"
        placeholder="add tag"
        aria-label="Add task tag"
        @keydown.enter.prevent="submitTag"
        @change="submitTag"
      />
      <small class="npc__usage">used by {{ usageCount }} role(s)</small>
    </div>
    <div class="form__row">
      <label :for="`task-station-asset-${task.id}`">Station</label>
      <select
        :id="`task-station-asset-${task.id}`"
        :value="task.post?.assetId ?? ''"
        :class="{ 'flag--warning': !!task.post && !assets.some((asset) => asset.id === task.post?.assetId) }"
        aria-label="Station asset"
        @change="emit('set-post-asset', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">No station - tag task</option>
        <option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.name }}</option>
      </select>
    </div>
    <template v-if="task.post">
      <div class="form__row">
        <label :for="`task-station-spot-${task.id}`">Spot</label>
        <input
          :id="`task-station-spot-${task.id}`"
          :value="task.post.post ?? ''"
          type="text"
          placeholder="any spot"
          aria-label="Station spot name"
          @change="emit('set-post-name', ($event.target as HTMLInputElement).value)"
        />
        <button type="button" @click="emit('clear-post')">Clear</button>
      </div>
      <ul v-if="postSuggestions.length" class="form__row form--wrap">
        <li v-for="name in postSuggestions" :key="`${task.id}-post-${name}`">
          <button type="button" class="card__item" @click="emit('set-post-name', name)">+ {{ name }}</button>
        </li>
      </ul>
    </template>
  </article>
</template>

<style>
.npc__card {
  flex-shrink: 0;
}

.npc__usage {
  color: var(--text-secondary);
  white-space: nowrap;
  align-self: center;
}
</style>
