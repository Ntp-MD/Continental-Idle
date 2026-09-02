<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NpcRole, NpcTask } from '../types'
import { managedTagSet, taskMatchesQuery } from '../blueprintStore'
import ColorInput from './ColorInput.vue'
import TagChip from './TagChip.vue'
import SearchInput from './SearchInput.vue'

const props = defineProps<{
  role: NpcRole
  tasks: NpcTask[]
  allTags: string[]
  triggerRates: Record<string, number> | undefined
}>()

const emit = defineEmits<{
  (e: 'update'): void
  (e: 'rename', value: string): void
  (e: 'chance', value: number): void
  (e: 'commit-color', value: string | undefined): void
  (e: 'add-tag', kind: 'focus' | 'restricted', tag: string): void
  (e: 'remove-tag', kind: 'focus' | 'restricted', tag: string): void
  (e: 'toggle-task', taskId: string): void
  (e: 'set-rate', tag: string, rate: number): void
}>()

const newFocusTag = ref('')
const newRestrictedTag = ref('')
const taskFilter = ref('')
const ratesExpanded = ref(false)
const rateSearch = ref('')
const rateScopeAll = ref(false)

const availableFocusTags = computed(() => props.allTags.filter((tag) => !props.role.focusTags.includes(tag)))
const availableRestrictedTags = computed(() => props.allTags.filter((tag) => !props.role.restrictedTags.includes(tag)))

const filteredAssignTasks = computed(() => {
  const query = taskFilter.value.trim().toLowerCase()
  if (!query) return props.tasks
  return props.tasks.filter((task) => taskMatchesQuery(task, query))
})

const roleTagScope = computed<string[]>(() => {
  const set = new Set<string>([...props.role.focusTags, ...props.role.restrictedTags])
  for (const tag of props.role.spawnRule?.targetTags ?? []) set.add(tag)
  for (const id of props.role.taskIds) {
    const task = props.tasks.find((item) => item.id === id)
    for (const tag of task?.tags ?? []) set.add(tag)
  }
  return [...set]
})

const rateRows = computed<string[]>(() => {
  const base = rateScopeAll.value
    ? [...props.allTags]
    : [...new Set([...roleTagScope.value, ...Object.keys(props.triggerRates ?? {})])].filter(
        (tag) => managedTagSet.value.has(tag) || (props.triggerRates?.[tag] ?? 0) > 0,
      )
  const query = rateSearch.value.trim().toLowerCase()
  const list = query ? base.filter((tag) => tag.toLowerCase().includes(query)) : base
  return list.sort((a, b) => a.localeCompare(b))
})

const roleRateCount = computed(() => roleTagScope.value.filter((tag) => (props.triggerRates?.[tag] ?? 0) > 0).length)

const configuredRateCount = computed(() => Object.keys(props.triggerRates ?? {}).length)

function submitRoleTag(kind: 'focus' | 'restricted') {
  const input = kind === 'focus' ? newFocusTag : newRestrictedTag
  const value = input.value.trim()
  if (!value) return
  emit('add-tag', kind, value)
  input.value = ''
}
</script>

<template>
  <section class="form__col npc__detail">
    <h3 class="form__title">Editing: {{ role.label }}</h3>
    <div class="form__grid">
      <div class="form__col">
        <h4 class="form__title">Basics</h4>
        <div class="form__row">
          <label :for="`npc-role-label-${role.id}`">Label</label>
          <input
            :id="`npc-role-label-${role.id}`"
            :value="role.label"
            type="text"
            @change="emit('rename', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="form__row">
          <label :for="`npc-role-color-${role.id}`">Color</label>
          <ColorInput
            :model-value="role.color"
            placeholder="#RRGGBB"
            aria-label="Role color"
            @commit="emit('commit-color', $event)"
          />
        </div>
        <div class="form__row">
          <label :for="`npc-role-chance-${role.id}`">Focus Chance</label>
          <input
            :id="`npc-role-chance-${role.id}`"
            :value="role.focusChance"
            type="range"
            min="0"
            max="100"
            @change="emit('chance', +($event.target as HTMLInputElement).value)"
          />
          <span class="form__hint npc__rate">{{ role.focusChance }}%</span>
        </div>
      </div>

      <div class="form__col">
        <h4 class="form__title">Focus Tags</h4>
        <p class="npc__hinttext">Where this NPC prefers to go. Empty = wanders anywhere.</p>
        <div class="form__row">
          <TagChip
            v-for="tag in role.focusTags"
            :key="`focus-${tag}`"
            :label="tag"
            variant="focus"
            removable
            :class="{ 'flag--warning': !managedTagSet.has(tag) }"
            @remove="emit('remove-tag', 'focus', tag)"
          />
          <span v-if="!role.focusTags.length" class="empty">None - NPC wanders</span>
        </div>
        <div class="form__row">
          <input v-model="newFocusTag" type="text" placeholder="tag name" @keydown.enter="submitRoleTag('focus')" />
          <button type="button" @click="submitRoleTag('focus')">Add</button>
        </div>
        <div v-if="availableFocusTags.length" class="npc__suggest">
          <button
            v-for="tag in availableFocusTags.slice(0, 8)"
            :key="`fsug-${tag}`"
            type="button"
            class="npc__suggestion"
            @click="emit('add-tag', 'focus', tag)"
          >
            + {{ tag }}
          </button>
        </div>
      </div>

      <div class="form__col">
        <h4 class="form__title">Restricted Tags</h4>
        <p class="npc__hinttext">Places this NPC avoids.</p>
        <div class="form__row">
          <TagChip
            v-for="tag in role.restrictedTags"
            :key="`restricted-${tag}`"
            :label="tag"
            variant="restricted"
            removable
            :class="{ 'flag--warning': !managedTagSet.has(tag) }"
            @remove="emit('remove-tag', 'restricted', tag)"
          />
          <span v-if="!role.restrictedTags.length" class="empty">No restrictions</span>
        </div>
        <div class="form__row">
          <input
            v-model="newRestrictedTag"
            type="text"
            placeholder="tag name"
            @keydown.enter="submitRoleTag('restricted')"
          />
          <button type="button" @click="submitRoleTag('restricted')">Add</button>
        </div>
        <div v-if="availableRestrictedTags.length" class="npc__suggest">
          <button
            v-for="tag in availableRestrictedTags.slice(0, 8)"
            :key="`rsug-${tag}`"
            type="button"
            class="npc__suggestion"
            @click="emit('add-tag', 'restricted', tag)"
          >
            + {{ tag }}
          </button>
        </div>
      </div>

      <div class="form__col npc__scroll">
        <h4 class="form__title">Assigned Tasks</h4>
        <SearchInput v-model="taskFilter" placeholder="Search tasks..." label="Search assigned tasks" />
        <label v-for="task in filteredAssignTasks" :key="task.id" class="card__item npc__pickrow">
          <input
            type="checkbox"
            :checked="role.taskIds.includes(task.id)"
            :aria-label="`Assign task ${task.label}`"
            @change="emit('toggle-task', task.id)"
          />
          <span class="npc__tagname truncate">{{ task.label }}</span>
          <small class="npc__picktags truncate">{{ task.tags.join(', ') }}</small>
        </label>
        <div v-if="!filteredAssignTasks.length" class="empty">
          {{ tasks.length ? 'No matching tasks' : 'No tasks yet - create them under Tags & Tasks' }}
        </div>
      </div>

      <div class="form__col">
        <div class="form__row">
          <h4 class="form__title">Tag Trigger Rates</h4>
          <button
            type="button"
            class="flag--ghost"
            :aria-expanded="ratesExpanded"
            @click="ratesExpanded = !ratesExpanded"
          >
            {{ ratesExpanded ? 'Hide' : 'Show' }}
          </button>
        </div>
        <template v-if="ratesExpanded">
          <div class="form__row">
            <SearchInput
              v-model="rateSearch"
              class="npc__ratesearch"
              placeholder="Search tags..."
              label="Search rate tags"
            />
            <label class="npc__scope"><input v-model="rateScopeAll" type="checkbox" /> All tags</label>
          </div>
          <label v-for="tag in rateRows" :key="`rate-${tag}`" class="form__row">
            <span class="npc__tagname truncate">{{ tag }}</span>
            <input
              class="npc__rate"
              type="number"
              min="0"
              max="100"
              step="1"
              :value="triggerRates?.[tag] ?? 0"
              :aria-label="`Trigger rate for ${tag}`"
              @change="emit('set-rate', tag, +($event.target as HTMLInputElement).value)"
            />
            <span class="form__hint">%/min</span>
          </label>
          <div v-if="!rateRows.length" class="empty">No tags match</div>
        </template>
        <div v-else class="empty">{{ roleRateCount }} configured for this role / {{ configuredRateCount }} total</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.npc__detail {
  min-width: 0;
  padding: var(--gap-md);
}

.npc__hinttext {
  color: var(--text-secondary);
  opacity: 0.8;
}

.npc__suggest {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}

.npc__scroll {
  max-height: 200px;
  overflow-y: auto;
  padding-right: var(--gap-xs);
}

.npc__pickrow {
  flex-shrink: 0;
}

.npc__picktags {
  color: var(--text-dim);
  max-width: 40%;
}

.npc__tagname {
  flex: 1;
  min-width: 0;
}

.npc__ratesearch {
  flex: 1;
  min-width: 0;
}

.npc__scope {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  white-space: nowrap;
  cursor: pointer;
}
</style>
