<script setup lang="ts">
import { ref, watch, inject, computed } from 'vue'
import { useAssetsStore } from '../blueprint-store'
import { useNpcSimulation } from '../composables/useNpcSimulation'
import { useAsyncAction } from '../composables/useAsyncAction'
import { useToast } from '../composables/useToast'
import { currentFloor } from '../store/state'
import type { NpcSimulationConfig, NpcRole, NpcTask } from '../types'
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const { pending, run } = useAsyncAction()

const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>

const draft = ref<NpcSimulationConfig>(cloneConfig(npcSimulation.config.value))
const selectedRoleId = ref('')
const selectedTaskId = ref('')

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function resetDraft() {
  draft.value = cloneConfig(npcSimulation.config.value)
  draft.value.tasks = draft.value.tasks ?? []
  for (const role of draft.value.roles) {
    role.behavior = role.behavior ?? { focusChance: 0, restrictedTaskIds: [] }
    role.behavior.focusChance = role.behavior.focusChance ?? 0
    role.behavior.restrictedTaskIds = role.behavior.restrictedTaskIds ?? []
  }
  selectedRoleId.value = draft.value.roles[0]?.id ?? ''
  selectedTaskId.value = draft.value.tasks[0]?.id ?? ''
  selectedRole.value = draft.value.roles[0]
  selectedTask.value = draft.value.tasks[0]
}

watch(() => props.open, (open) => {
  if (open) resetDraft()
})

const selectedRole = ref<NpcRole | undefined>()
const selectedTask = ref<NpcTask | undefined>()

watch(selectedRoleId, (id) => {
  selectedRole.value = draft.value.roles.find(r => r.id === id)
}, { immediate: true })

watch(selectedTaskId, (id) => {
  selectedTask.value = draft.value.tasks.find(t => t.id === id)
}, { immediate: true })

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function randomColor(): string {
  const letters = '89ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * letters.length)]
  return color
}

function onAddRole() {
  const id = randomId('role')
  draft.value.roles.push({
    id,
    label: 'New Role',
    color: randomColor(),
    behavior: { focusChance: 0, restrictedTaskIds: [] },
  })
  selectedRoleId.value = id
}

function canDeleteRole(role: NpcRole): boolean {
  return role.id !== draft.value.defaultRoleId
}

function onDeleteRole(role: NpcRole) {
  if (role.id === draft.value.defaultRoleId) {
    toast.warning('Default role cannot be deleted')
    return
  }
  draft.value.roles = draft.value.roles.filter(r => r.id !== role.id)
  draft.value.pool = draft.value.pool.filter(p => p.roleId !== role.id)
  if (selectedRoleId.value === role.id) {
    selectedRoleId.value = draft.value.roles[0]?.id ?? ''
  }
}

const newTaskLabel = ref('')
const newTaskTag = ref('')
const newTag = ref('')
const tagSearch = ref('')

const zones = computed(() => currentFloor.value?.zones ?? [])

const filteredTags = computed(() => {
  const q = tagSearch.value.trim().toLowerCase()
  const tags = store.globalTags.value
  if (!q) return tags
  return tags.filter(t => t.toLowerCase().includes(q))
})

async function onAddTag() {
  const t = newTag.value.trim()
  if (!t) return
  await store.addTag(t)
  newTag.value = ''
}

async function onRemoveTag(tag: string) {
  await store.removeTag(tag)
}

function onAddZone() {
  store.setMode('zone')
  emit('close')
}

function onKeydownTag(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    onAddTag()
  }
}

function onAddTask() {
  const label = newTaskLabel.value.trim()
  const tag = newTaskTag.value.trim()
  if (!label) {
    toast.warning('Task label is required')
    return
  }
  const id = randomId('task')
  const tags = tag ? [tag] : []
  draft.value.tasks.push({ id, label, tags })
  newTaskLabel.value = ''
  newTaskTag.value = ''
  selectedTaskId.value = id
}

function onDeleteTask(task: NpcTask) {
  draft.value.tasks = draft.value.tasks.filter(t => t.id !== task.id)
  for (const role of draft.value.roles) {
    if (role.behavior.focusTaskId === task.id) role.behavior.focusTaskId = undefined
    role.behavior.restrictedTaskIds = role.behavior.restrictedTaskIds.filter(id => id !== task.id)
  }
  if (selectedTaskId.value === task.id) {
    selectedTaskId.value = draft.value.tasks[0]?.id ?? ''
  }
}

function onAddTaskTag() {
  if (!selectedTask.value) return
  const tag = newTaskTag.value.trim()
  if (!tag) return
  if (selectedTask.value.tags.includes(tag)) return
  selectedTask.value.tags.push(tag)
  newTaskTag.value = ''
}

function onRemoveTaskTag(task: NpcTask, index: number) {
  task.tags.splice(index, 1)
}

function toggleRestrictedTask(taskId: string) {
  if (!selectedRole.value) return
  const ids = selectedRole.value.behavior.restrictedTaskIds
  const idx = ids.indexOf(taskId)
  if (idx === -1) ids.push(taskId)
  else ids.splice(idx, 1)
}

function isRestrictedTask(taskId: string): boolean {
  return !!selectedRole.value?.behavior.restrictedTaskIds.includes(taskId)
}

function getPoolCount(roleId: string): number {
  return draft.value.pool.find(p => p.roleId === roleId)?.count ?? 0
}

function setPoolCount(roleId: string, count: number) {
  const safe = Math.max(0, Math.min(100, Math.floor(count || 0)))
  const entry = draft.value.pool.find(p => p.roleId === roleId)
  if (safe === 0) {
    if (entry) {
      draft.value.pool = draft.value.pool.filter(p => p.roleId !== roleId)
    }
    return
  }
  if (entry) {
    entry.count = safe
  } else {
    draft.value.pool.push({ roleId, count: safe })
  }
}

function totalNpcCount(): number {
  return draft.value.pool.reduce((sum, p) => sum + p.count, 0)
}

function isColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
}

function validate(): boolean {
  if (draft.value.tasks.some(t => !t.label.trim())) {
    toast.warning('All task labels must be filled')
    return false
  }
  if (draft.value.roles.some(r => !r.label.trim())) {
    toast.warning('All role labels must be filled')
    return false
  }
  if (draft.value.roles.some(r => !isColor(r.color))) {
    toast.warning('Invalid role color')
    return false
  }
  if (!draft.value.roles.some(r => r.id === draft.value.defaultRoleId)) {
    toast.warning('Default role must exist')
    return false
  }
  if (draft.value.roles.some(r => r.behavior.focusTaskId !== undefined && (r.behavior.focusChance < 0 || r.behavior.focusChance > 100))) {
    toast.warning('Invalid focus chance')
    return false
  }
  return true
}

async function onSave() {
  if (!validate()) return
  for (const task of draft.value.tasks) {
    task.label = task.label.trim()
    task.tags = Array.from(new Set(task.tags.map(t => t.trim()).filter(Boolean)))
  }
  for (const role of draft.value.roles) {
    role.behavior.focusChance = role.behavior.focusTaskId ? Math.max(0, Math.min(100, Math.floor(role.behavior.focusChance))) : 0
    role.behavior.restrictedTaskIds = Array.from(new Set(role.behavior.restrictedTaskIds))
  }
  const allTags = draft.value.tasks.flatMap(t => t.tags)
  if (allTags.length > 0) await store.ensureTags(allTags)
  await run(() => store.updateNpcConfig(draft.value))
  emit('close')
  toast.success('NPC settings saved')
}

function onClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="npc__settings__modal" @click.self="onClose">
      <div class="npc__settings__modal__dialog" role="dialog" aria-modal="true" aria-labelledby="npc-settings-title">
        <div class="npc__settings__modal__header">
          <span id="npc-settings-title" class="npc__settings__modal__title">NPC Behavior Manager</span>
          <button class="npc__settings__modal__close" @click="onClose" aria-label="Close">✕</button>
        </div>

        <div class="npc__settings__modal__body">
          <div class="npc__settings__modal__columns">
            <!-- Role list -->
            <div class="npc__settings__modal__column npc__settings__modal__column__roles">
              <div class="npc__settings__modal__section__title">Roles</div>
              <div class="npc__settings__modal__role__list">
                <button
                  v-for="role in draft.roles"
                  :key="role.id"
                  class="npc__settings__modal__role__item"
                  :class="{ 'npc__settings__modal__role__item__active': selectedRoleId === role.id }"
                  @click="selectedRoleId = role.id"
                >
                  <span class="npc__settings__modal__role__color" :style="{ background: role.color }" />
                  <span class="npc__settings__modal__role__label">{{ role.label }}</span>
                  <button
                    v-if="canDeleteRole(role)"
                    class="btn btn__ghost btn__icon btn__text__danger"
                    @click.stop="onDeleteRole(role)"
                    aria-label="Delete role"
                  >×</button>
                </button>
              </div>
              <button class="btn" @click="onAddRole">+ Add Role</button>
            </div>

            <!-- Behavior & Tasks -->
            <div class="npc__settings__modal__column npc__settings__modal__column__behavior">
              <div class="npc__settings__modal__section__title">Role Behavior</div>
              <div v-if="selectedRole" class="npc__settings__modal__behavior__panel">
                <div class="npc__settings__modal__row">
                  <label class="npc__settings__modal__label">Label</label>
                  <input v-model="selectedRole.label" type="text" class="input" />
                </div>
                <div class="npc__settings__modal__row">
                  <label class="npc__settings__modal__label">Color</label>
                  <div class="npc__settings__modal__color__row">
                    <input v-model="selectedRole.color" type="color" class="input input__color" />
                    <input v-model="selectedRole.color" type="text" class="input" />
                  </div>
                </div>

                <div class="npc__settings__modal__targets__header">Focus Task</div>
                <select v-model="selectedRole.behavior.focusTaskId" class="input">
                  <option value="">None</option>
                  <option v-for="task in draft.tasks" :key="task.id" :value="task.id">{{ task.label }}</option>
                </select>
                <div class="npc__settings__modal__row">
                  <label class="npc__settings__modal__label">Chance</label>
                  <input v-model.number="selectedRole.behavior.focusChance" type="range" min="0" max="100" class="npc__settings__modal__range" />
                  <span class="npc__settings__modal__value">{{ selectedRole.behavior.focusChance }}%</span>
                </div>

                <div class="npc__settings__modal__targets__header">Restricted Tasks</div>
                <div class="npc__settings__modal__task__checks">
                  <label v-for="task in draft.tasks" :key="task.id" class="npc__settings__modal__task__check">
                    <input type="checkbox" :checked="isRestrictedTask(task.id)" @change="toggleRestrictedTask(task.id)" />
                    <span>{{ task.label }}</span>
                  </label>
                  <div v-if="draft.tasks.length === 0" class="npc__settings__modal__empty">No tasks</div>
                </div>
              </div>

              <div class="npc__settings__modal__section__title npc__settings__modal__section__title__tasks">Tasks</div>
              <div class="npc__settings__modal__task__list">
                <button
                  v-for="task in draft.tasks"
                  :key="task.id"
                  class="npc__settings__modal__role__item"
                  :class="{ 'npc__settings__modal__role__item__active': selectedTaskId === task.id }"
                  @click="selectedTaskId = task.id"
                >
                  <span class="npc__settings__modal__role__label">{{ task.label }}</span>
                  <button v-if="draft.tasks.length > 1" class="btn btn__ghost btn__icon btn__text__danger" @click.stop="onDeleteTask(task)" aria-label="Delete task">×</button>
                </button>
              </div>
              <div class="npc__settings__modal__row">
                <input v-model="newTaskLabel" type="text" placeholder="New task label" class="input" />
              </div>
              <div class="npc__settings__modal__row">
                <input v-model="newTaskTag" type="text" placeholder="tag" class="input" />
                <button class="btn" @click="onAddTask">Add</button>
              </div>

              <div v-if="selectedTask" class="npc__settings__modal__behavior__panel">
                <div class="npc__settings__modal__targets__header">Tags for {{ selectedTask.label }}</div>
                <div v-for="(tag, index) in selectedTask.tags" :key="index" class="tag">
                  <span>{{ tag }}</span>
                  <button class="tag__remove" @click="onRemoveTaskTag(selectedTask, index)" aria-label="Remove tag">×</button>
                </div>
                <div class="npc__settings__modal__row">
                  <input v-model="newTaskTag" type="text" placeholder="add tag" class="input" />
                  <button class="btn" @click="onAddTaskTag">Add</button>
                </div>
              </div>
            </div>

            <!-- Pool & Speed -->
            <div class="npc__settings__modal__column npc__settings__modal__column__pool">
              <div class="npc__settings__modal__section__title">Deployment Pool</div>
              <div class="npc__settings__modal__pool__list">
                <div v-for="role in draft.roles" :key="role.id" class="npc__settings__modal__pool__row">
                  <span class="npc__settings__modal__pool__role" :style="{ color: role.color }">{{ role.label }}</span>
                  <div class="npc__settings__modal__pool__controls">
                    <button class="btn btn__icon" @click="setPoolCount(role.id, getPoolCount(role.id) - 1)">−</button>
                    <input
                      :value="getPoolCount(role.id)"
                      type="number"
                      min="0"
                      max="100"
                      class="input input__count"
                      @input="setPoolCount(role.id, Number(($event.target as HTMLInputElement).value))"
                    />
                    <button class="btn btn__icon" @click="setPoolCount(role.id, getPoolCount(role.id) + 1)">+</button>
                  </div>
                </div>
              </div>
              <div class="npc__settings__modal__total">Total: {{ totalNpcCount() }} NPCs</div>

              <div class="npc__settings__modal__section__title npc__settings__modal__section__title__speed">Speed</div>
              <div class="npc__settings__modal__row">
                <input v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" class="npc__settings__modal__range" />
                <span class="npc__settings__modal__value">{{ draft.speed.toFixed(2) }}</span>
              </div>

              <div class="npc__settings__modal__section__title npc__settings__modal__section__title__zones">Zones</div>
              <div class="npc__settings__modal__zone__list">
                <div v-for="zone in zones" :key="zone.id" class="npc__settings__modal__zone__row">
                  <span class="npc__settings__modal__zone__label">{{ zone.label }}</span>
                  <span class="npc__settings__modal__zone__tags">{{ (zone.tags ?? []).join(', ') || '-' }}</span>
                </div>
                <div v-if="zones.length === 0" class="npc__settings__modal__empty">No zones</div>
              </div>
              <button class="btn" @click="onAddZone">+ Add Zone on Canvas</button>

              <div class="npc__settings__modal__section__title npc__settings__modal__section__title__tags">Global Tags</div>
              <div class="npc__settings__modal__row">
                <input v-model="newTag" type="text" placeholder="New tag" class="input" @keydown="onKeydownTag" />
                <button class="btn" @click="onAddTag">Add</button>
              </div>
              <div class="npc__settings__modal__search__row">
                <input v-model="tagSearch" type="text" placeholder="Search tags..." class="input" />
              </div>
              <div class="npc__settings__modal__tag__list">
                <div v-for="tag in filteredTags" :key="tag" class="tag">
                  <span>{{ tag }}</span>
                  <button class="tag__remove" @click="onRemoveTag(tag)" aria-label="Remove tag">×</button>
                </div>
                <div v-if="filteredTags.length === 0" class="npc__settings__modal__empty">No tags</div>
              </div>
            </div>
          </div>
        </div>

        <div class="npc__settings__modal__footer">
          <button class="btn btn__primary" :disabled="pending" @click="onSave">Save Behavior</button>
          <button class="btn" :disabled="pending" @click="onClose">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>


<style scoped>

.npc__settings__modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg-primary) 60%, transparent);
}

.npc__settings__modal__dialog {
  width: min(720px, calc(100vw - 32px));
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  color: var(--text-primary);
  overflow: hidden;
}

.npc__settings__modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.npc__settings__modal__title {
  font-weight: 600;
  font-size: var(--font-md);
}

.npc__settings__modal__close {
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-md);
  line-height: 1;
}

.npc__settings__modal__body {
  padding: var(--gap-md);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.npc__settings__modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  border-top: 1px solid var(--border-dim);
  background: var(--bg-card);
}

.npc__settings__modal__columns {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: var(--gap-md);
}

@media (max-width: 640px) {
  .npc__settings__modal__columns {
    grid-template-columns: 1fr;
  }
}

.npc__settings__modal__column,
.npc__settings__modal__column__behavior,
.npc__settings__modal__column__pool,
.npc__settings__modal__column__roles {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
}

.npc__settings__modal__column__behavior,
.npc__settings__modal__column__pool,
.npc__settings__modal__column__roles {
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  padding: var(--gap-sm);
  background: var(--bg-primary);
}

.npc__settings__modal__row,
.npc__settings__modal__color__row,
.npc__settings__modal__search__row {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
}

.npc__settings__modal__label {
  font-weight: 500;
  min-width: 80px;
}

.npc__settings__modal__value,
.npc__settings__modal__total {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.npc__settings__modal__range {
  flex: 1;
  min-width: 0;
}

.npc__settings__modal__section__title,
.npc__settings__modal__section__title__speed,
.npc__settings__modal__section__title__tags,
.npc__settings__modal__section__title__tasks,
.npc__settings__modal__section__title__zones {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-weight: 600;
  font-size: var(--font-sm);
  padding: var(--gap-xs) 0;
  opacity: 0.9;
}

.npc__settings__modal__pool__controls {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.npc__settings__modal__pool__list,
.npc__settings__modal__role__list,
.npc__settings__modal__task__list,
.npc__settings__modal__tag__list,
.npc__settings__modal__zone__list {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 25vh;
  overflow-y: auto;
}

.npc__settings__modal__pool__row,
.npc__settings__modal__zone__row {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.npc__settings__modal__pool__row:hover,
.npc__settings__modal__zone__row:hover,
.npc__settings__modal__role__item:hover {
  background: var(--bg-card);
}

.npc__settings__modal__pool__role,
.npc__settings__modal__zone__label,
.npc__settings__modal__zone__tags,
.npc__settings__modal__role__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npc__settings__modal__role__item {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
}

.npc__settings__modal__role__item__active {
  border-color: var(--accent-blue);
  background: var(--bg-card);
}

.npc__settings__modal__role__color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.npc__settings__modal__role__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}</style>