<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NpcRole, NpcTask } from '../../domain/types'
import { managedTagSet, taskMatchesQuery } from '../../blueprintStore'
import ColorInput from '../inputs/ColorInput.vue'
import TagChip from '../inputs/TagChip.vue'
import SearchInput from '../inputs/SearchInput.vue'

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
    <h3>Editing: {{ role.label }}</h3>
    <div class="form__col">
      <div class="form__col form--section">
        <h4>Basics</h4>
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
          <span class="form__hint">{{ role.focusChance }}%</span>
        </div>
      </div>

      <div class="form__col form--section">
        <h4>Focus Tags</h4>
        <p class="npc__hint">Where this NPC prefers to go. Empty = wanders anywhere.</p>
        <ul v-if="role.focusTags.length" class="form__row form--wrap">
          <li v-for="tag in role.focusTags" :key="`focus-${tag}`">
            <TagChip
              :label="tag"
              variant="focus"
              removable
              :class="{ 'flag--warning': !managedTagSet.has(tag) }"
              @remove="emit('remove-tag', 'focus', tag)"
            />
          </li>
        </ul>
        <span v-else class="empty">None - NPC wanders</span>
        <div class="form__row">
          <input v-model="newFocusTag" type="text" placeholder="tag name" @keydown.enter="submitRoleTag('focus')" />
          <button type="button" @click="submitRoleTag('focus')">Add</button>
        </div>
        <ul v-if="availableFocusTags.length" class="form__row form--wrap">
          <li v-for="tag in availableFocusTags.slice(0, 8)" :key="`fsug-${tag}`">
            <button
              type="button"
              class="card__item"
              @click="emit('add-tag', 'focus', tag)"
            >
              + {{ tag }}
            </button>
          </li>
        </ul>
      </div>

      <div class="form__col form--section">
        <h4>Restricted Tags</h4>
        <p class="npc__hint">Places this NPC avoids.</p>
        <ul v-if="role.restrictedTags.length" class="form__row form--wrap">
          <li v-for="tag in role.restrictedTags" :key="`restricted-${tag}`">
            <TagChip
              :label="tag"
              variant="restricted"
              removable
              :class="{ 'flag--warning': !managedTagSet.has(tag) }"
              @remove="emit('remove-tag', 'restricted', tag)"
            />
          </li>
        </ul>
        <span v-else class="empty">No restrictions</span>
        <div class="form__row">
          <input
            v-model="newRestrictedTag"
            type="text"
            placeholder="tag name"
            @keydown.enter="submitRoleTag('restricted')"
          />
          <button type="button" @click="submitRoleTag('restricted')">Add</button>
        </div>
        <ul v-if="availableRestrictedTags.length" class="form__row form--wrap">
          <li v-for="tag in availableRestrictedTags.slice(0, 8)" :key="`rsug-${tag}`">
            <button
              type="button"
              class="card__item"
              @click="emit('add-tag', 'restricted', tag)"
            >
              + {{ tag }}
            </button>
          </li>
        </ul>
      </div>

      <div class="form__col form--section npc__scroll">
        <h4>Assigned Tasks</h4>
        <SearchInput v-model="taskFilter" placeholder="Search tasks..." label="Search assigned tasks" />
        <ul v-if="filteredAssignTasks.length" class="form__col">
          <li v-for="task in filteredAssignTasks" :key="task.id">
            <label class="card__item npc__pick">
              <input
                type="checkbox"
                :checked="role.taskIds.includes(task.id)"
                :aria-label="`Assign task ${task.label}`"
                @change="emit('toggle-task', task.id)"
              />
              <span class="size--stretch truncate">{{ task.label }}</span>
              <small class="npc__tags truncate">{{ task.tags.join(', ') }}</small>
            </label>
          </li>
        </ul>
        <div v-else class="empty">
          {{ tasks.length ? 'No matching tasks' : 'No tasks yet - create them under Tags & Tasks' }}
        </div>
      </div>

      <div class="form__col form--section">
        <div class="form__row">
          <h4>Tag Trigger Rates</h4>
          <button
            type="button"
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
              class="npc__search"
              placeholder="Search tags..."
              label="Search rate tags"
            />
            <label class="form__row"><input v-model="rateScopeAll" type="checkbox" /> All tags</label>
          </div>
          <label v-for="tag in rateRows" :key="`rate-${tag}`" class="form__row">
            <span class="size--stretch truncate">{{ tag }}</span>
            <input
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
.npc__hint {
  color: var(--text-secondary);
  opacity: 0.8;
}

.npc__scroll {
  max-height: 200px;
  overflow-y: auto;
  padding-right: var(--gap-xs);
}

.npc__pick {
  flex-shrink: 0;
}

.npc__tags {
  color: var(--text-secondary);
  max-width: 40%;
}

.npc__search {
  flex: 1;
  min-width: 0;
}

</style>
