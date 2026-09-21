<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NpcRole, NpcRoleAppearance, NpcRoleHat, NpcTask } from '../../domain/types'
import { spawnZoneAllowsRole } from '../../domain/types'
import { taskMatchesQuery, useAssetsStore } from '../../blueprintStore'
import ColorInput from '../inputs/ColorInput.vue'
import TagChip from '../inputs/TagChip.vue'
import SearchInput from '../inputs/SearchInput.vue'

const props = defineProps<{
  role: NpcRole
  tasks: NpcTask[]
  allTags: string[]
  triggerRates: Record<string, number> | undefined
  isDefault: boolean
  poolCount: number
  poolFloorIds: string[]
  floors: { id: string; label: string }[]
}>()

const store = useAssetsStore()
const { managedTagSet } = store

const emit = defineEmits<{
  (e: 'rename', value: string): void
  (e: 'chance', value: number): void
  (e: 'commit-color', value: string | undefined): void
  (e: 'commit-appearance', patch: Partial<NpcRoleAppearance>): void
  (e: 'add-tag', kind: 'focus' | 'restricted', tag: string): void
  (e: 'remove-tag', kind: 'focus' | 'restricted', tag: string): void
  (e: 'toggle-task', taskId: string): void
  (e: 'set-rate', tag: string, rate: number): void
  (e: 'set-count', count: number): void
  (e: 'toggle-floor', floorId: string): void
  (e: 'add-spawn-tag', tag: string): void
  (e: 'remove-spawn-tag', tag: string): void
  (e: 'view-zones'): void
  (e: 'remove'): void
}>()

const newFocusTag = ref('')
const newRestrictedTag = ref('')
const newSpawnTag = ref('')
const taskFilter = ref('')
const rateSearch = ref('')
const rateScopeAll = ref(false)

type DetailTab = 'basics' | 'tags' | 'tasks' | 'spawn' | 'rates'
const activeTab = ref<DetailTab>('basics')

const tabs: { key: DetailTab; label: string }[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'tags', label: 'Tags' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'spawn', label: 'Spawn' },
  { key: 'rates', label: 'Rates' },
]

const tabBadges = computed<Partial<Record<DetailTab, number>>>(() => ({
  tags: props.role.focusTags.length + props.role.restrictedTags.length,
  tasks: props.role.taskIds.length,
  rates: Object.keys(props.triggerRates ?? {}).length,
}))

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

const zoneCoverage = computed(() => {
  let zones = 0
  const floorLabels: string[] = []
  for (const floor of store.state.layout.floors) {
    if (floor.allowedRoleIds?.length && !floor.allowedRoleIds.includes(props.role.id)) continue
    const match = (floor.spawnZones ?? []).filter((zone) => spawnZoneAllowsRole(zone, props.role.id))
    if (match.length) {
      zones += match.length
      floorLabels.push(floor.label)
    }
  }
  return { zones, floorLabels }
})

const roleRateCount = computed(() => roleTagScope.value.filter((tag) => (props.triggerRates?.[tag] ?? 0) > 0).length)

const ratesOverrideFocus = computed(() => Object.keys(props.triggerRates ?? {}).length > 0)

const configuredRateCount = computed(() => Object.keys(props.triggerRates ?? {}).length)

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

function submitRoleTag(kind: 'focus' | 'restricted') {
  const input = kind === 'focus' ? newFocusTag : newRestrictedTag
  const value = input.value.trim()
  if (!value) return
  emit('add-tag', kind, value)
  input.value = ''
}

function submitSpawnTag() {
  const value = newSpawnTag.value.trim()
  if (!value) return
  emit('add-spawn-tag', value)
  newSpawnTag.value = ''
}

function parseSkinTones(raw: string): string[] | undefined {
  const tones = raw.split(',').map((tone) => tone.trim()).filter(Boolean)
  return tones.length ? tones : undefined
}

function commitHat(value: string) {
  emit('commit-appearance', { hat: value as NpcRoleHat })
}
</script>

<template>
  <section class="form__col npc__detail">
    <div class="form__row">
      <h3 class="size--stretch">Editing: {{ role.label }}</h3>
      <button
        type="button"
        class="flag--danger"
        :title="isDefault ? 'Delete this role - another role will become Default' : 'Delete this role'"
        @click="emit('remove')"
      >
        Delete
      </button>
    </div>
    <div class="tabs__bar" role="tablist" aria-label="Role detail sections">
      <button
        v-for="t in tabs"
        :id="`npc-role-tab--${t.key}`"
        :key="t.key"
        type="button"
        role="tab"
        class="tabs__tab"
        :class="{ 'flag--active': activeTab === t.key }"
        :aria-selected="activeTab === t.key"
        :aria-controls="`npc-role-panel--${t.key}`"
        @click="activeTab = t.key"
      >
        {{ t.label }}
        <span v-if="tabBadges[t.key]" class="badge">{{ tabBadges[t.key] }}</span>
      </button>
    </div>
    <div class="form__col">
      <div
        v-if="activeTab === 'basics'"
        :id="`npc-role-panel--basics`"
        role="tabpanel"
        aria-labelledby="npc-role-tab--basics"
        class="form__col form--section"
      >
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
          <label :for="`npc-role-skin-${role.id}`">Skin Tones</label>
          <input
            :id="`npc-role-skin-${role.id}`"
            :value="role.appearance?.skinTones?.join(', ') ?? ''"
            type="text"
            placeholder="#e7c19b, #c08a5c (empty = random)"
            @change="emit('commit-appearance', { skinTones: parseSkinTones(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="form__row">
          <label :for="`npc-role-trousers-${role.id}`">Trousers</label>
          <ColorInput
            :model-value="role.appearance?.trousers ?? ''"
            placeholder="#RRGGBB (empty = default)"
            aria-label="Role trousers color"
            @commit="emit('commit-appearance', { trousers: $event })"
          />
        </div>
        <div class="form__row">
          <label :for="`npc-role-hat-${role.id}`">Hat</label>
          <select
            :id="`npc-role-hat-${role.id}`"
            :value="role.appearance?.hat ?? 'none'"
            @change="commitHat(($event.target as HTMLSelectElement).value)"
          >
            <option value="none">None</option>
            <option value="cap">Cap</option>
            <option value="boater">Boater</option>
          </select>
        </div>
        <div class="form__row">
          <label :for="`npc-role-hatcolor-${role.id}`">Hat Color</label>
          <ColorInput
            :model-value="role.appearance?.hatColor ?? ''"
            placeholder="#RRGGBB (empty = trousers color)"
            aria-label="Role hat color"
            @commit="emit('commit-appearance', { hatColor: $event })"
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
            :disabled="ratesOverrideFocus"
            :aria-describedby="ratesOverrideFocus ? `npc-role-chance-hint-${role.id}` : undefined"
            @change="emit('chance', +($event.target as HTMLInputElement).value)"
          />
          <span class="form__hint">{{ role.focusChance }}%</span>
          <span v-if="ratesOverrideFocus" :id="`npc-role-chance-hint-${role.id}`" class="form__hint">Trigger rates override focus chance</span>
        </div>
      </div>

      <div
        v-if="activeTab === 'tags'"
        :id="`npc-role-panel--tags`"
        role="tabpanel"
        aria-labelledby="npc-role-tab--tags"
        class="form__row form--start form--wrap"
      >
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
      </div>

      <div
        v-if="activeTab === 'tasks'"
        :id="`npc-role-panel--tasks`"
        role="tabpanel"
        aria-labelledby="npc-role-tab--tasks"
        class="form__col form--section npc__scroll"
      >
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

      <div
        v-if="activeTab === 'spawn'"
        :id="`npc-role-panel--spawn`"
        role="tabpanel"
        aria-labelledby="npc-role-tab--spawn"
        class="form__col form--section"
      >
        <h4>Spawn</h4>
        <div class="form__row">
          <label :for="`npc-role-count-${role.id}`">Count</label>
          <button
            type="button"
            aria-label="Decrease count"
            @click="emit('set-count', poolCount - 1)"
          >
            -
          </button>
          <input
            :id="`npc-role-count-${role.id}`"
            :value="poolCount"
            type="number"
            min="0"
            max="100"
            :aria-label="`Count for ${role.label}`"
            @change="emit('set-count', +($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            aria-label="Increase count"
            @click="emit('set-count', poolCount + 1)"
          >
            +
          </button>
        </div>
        <template v-if="poolCount > 0">
          <div>Spawn Floors</div>
          <ul class="form__row form--wrap">
            <li v-for="floor in floors" :key="`spawn-floor-${role.id}-${floor.id}`">
              <label
                class="card__item"
                :class="{ 'flag--active': poolFloorIds.includes(floor.id) }"
              >
                <input
                  type="checkbox"
                  :checked="poolFloorIds.includes(floor.id)"
                  @change="emit('toggle-floor', floor.id)"
                />
                <span>{{ floor.label }}</span>
              </label>
            </li>
          </ul>
          <p v-if="!poolFloorIds.length" class="form__hint">All floors</p>
          <div>Target Tags</div>
          <ul v-if="role.spawnRule?.targetTags?.length" class="form__row form--wrap">
            <li v-for="tag in role.spawnRule?.targetTags ?? []" :key="'st_' + role.id + tag">
              <TagChip :label="tag" removable @remove="emit('remove-spawn-tag', tag)" />
            </li>
          </ul>
          <span v-else class="empty">No target tags</span>
          <input
            v-model="newSpawnTag"
            type="text"
            placeholder="+ tag"
            aria-label="Add target tag"
            @keydown.enter="submitSpawnTag"
          />
        </template>
        <p v-else class="form__hint">Set a count above 0 to configure spawn floors and target tags.</p>
        <div class="form__col form--section">
          <div class="form__row">
            <div class="size--stretch">Spawn Zones</div>
            <span class="badge" :class="{ 'flag--warning': zoneCoverage.zones === 0 }">{{ zoneCoverage.zones }}</span>
            <button type="button" @click="emit('view-zones')">Open Floor Manager</button>
          </div>
          <p class="form__hint">
            {{
              zoneCoverage.zones
                ? `Zones on floors: ${zoneCoverage.floorLabels.join(', ')}`
                : 'No spawn zones allow this role - NPCs spawn anywhere walkable'
            }}
          </p>
        </div>
      </div>

      <div
        v-if="activeTab === 'rates'"
        :id="`npc-role-panel--rates`"
        role="tabpanel"
        aria-labelledby="npc-role-tab--rates"
        class="form__col form--section"
      >
        <div class="form__row">
          <h4>Tag Trigger Rates</h4>
        </div>
        <div class="form__row">
          <span class="form__hint">{{ roleRateCount }} configured for this role / {{ configuredRateCount }} total</span>
        </div>
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
      </div>
    </div>
  </section>
</template>

<style>
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
