<script setup lang="ts">
import { ref, watch, inject, computed } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useNpcSimulation } from '../composables/useNpcSimulation'
import { useAsyncAction } from '../composables/useAsyncAction'
import { useToast } from '@/composables/useToast'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { sanitizeString } from '../../utils/sanitize'
import { currentFloor } from '../store/state'
import { NPC_ROLE_META } from '../store/npcDefault'
import type { NpcSimulationConfig, NpcRole, NpcTask } from '../types'
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const { pending, run } = useAsyncAction()

const isOpen = computed(() => props.open)
const containerRef = ref<HTMLElement>()
useFocusTrap(isOpen, containerRef)

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

function getRoleMeta(role: NpcRole) {
  return NPC_ROLE_META[role.id] ?? {
    category: 'custom' as const,
    summary: 'Custom editor role',
    recommendedTags: [],
  }
}

const selectedRoleMeta = computed(() => selectedRole.value ? getRoleMeta(selectedRole.value) : null)

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
    role.label = sanitizeString(role.label)
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
    <div v-if="open" class="modal__overlay npcsettings__modal" @click.self="onClose">
      <div ref="containerRef" class="npcsettings__dialog__vstack" role="dialog" aria-modal="true" aria-labelledby="npc__settings__title">
        <div class="npcsettings__space__row">
          <span id="npc__settings__title" class="npcsettings__title__label">NPC Behavior Manager</span>
          <button class="npcsettings__button" @click="onClose" aria-label="Close">✕</button>
        </div>

        <div class="npcsettings__body__vstack">
          <div class="npcsettings__grid">
            <!-- Role list -->
            <div class="layout__column card__primary">
              <div class="npcsettings__section__hstack">Roles</div>
              <div class="npcsettings__scroll__stack">
                <div
                  v-for="role in draft.roles"
                  :key="role.id"
                  class="npcsettings__role__hstack"
                  :class="{ 'npcsettings__role__hstackactive': selectedRoleId === role.id }"
                  role="button"
                  tabindex="0"
                  @click="selectedRoleId = role.id"
                  @keydown.enter="selectedRoleId = role.id"
                >
                  <span class="npcsettings__role__swatch" :style="{ background: role.color }" />
                  <span class="npcsettings__role__truncate">
                    <strong>{{ role.label }}</strong>
                    <small>{{ getRoleMeta(role).category }} · {{ getPoolCount(role.id) }} deployed</small>
                  </span>
                  <button
                    v-if="canDeleteRole(role)"
                    class="btn btn__ghost btn__icon btn__text__danger"
                    @click.stop="onDeleteRole(role)"
                    aria-label="Delete role"
                  >×</button>
                </div>
              </div>
              <button class="btn" @click="onAddRole">+ Add Role</button>
            </div>

            <!-- Behavior & Tasks -->
            <div class="layout__column card__primary">
              <div class="npcsettings__section__hstack">Role Behavior</div>
              <div v-if="selectedRole" class="npcsettings__behavior">
                <div class="npcsettings__role__detail">
                  <span class="tag">{{ selectedRoleMeta?.category }}<span v-if="selectedRoleMeta?.rank"> · Rank {{ selectedRoleMeta.rank }}</span></span>
                  <span class="npcsettings__role__description">{{ selectedRoleMeta?.summary }}</span>
                  <span v-if="selectedRoleMeta?.recommendedTags.length" class="npcsettings__role__recommended">Recommended tags: {{ selectedRoleMeta.recommendedTags.join(', ') }}</span>
                </div>
                <div class="layout__row">
                  <label class="npcsettings__label__bold" :for="'role__label__' + selectedRole.id">Label</label>
                  <input :id="'role__label__' + selectedRole.id" v-model="selectedRole.label" type="text" class="input" />
                </div>
                <div class="layout__row">
                  <label class="npcsettings__label__bold" :for="'role__color__' + selectedRole.id">Color</label>
                  <div class="npcsettings__color__hstack">
                    <input :id="'role__color__' + selectedRole.id" v-model="selectedRole.color" type="color" class="input input__color" />
                    <input v-model="selectedRole.color" type="text" class="input" aria-label="Role color hex value" />
                  </div>
                </div>

                <div class="npcsettings__targets">Focus Task</div>
                <select v-model="selectedRole.behavior.focusTaskId" class="input" :aria-label="'Focus task for ' + selectedRole.label">
                  <option value="">None</option>
                  <option v-for="task in draft.tasks" :key="task.id" :value="task.id">{{ task.label }}</option>
                </select>
                <div class="layout__row">
                  <label class="npcsettings__label__bold" :for="'role__chance__' + selectedRole.id">Chance</label>
                  <input :id="'role__chance__' + selectedRole.id" v-model.number="selectedRole.behavior.focusChance" type="range" min="0" max="100" class="npcsettings__grow" />
                  <span class="npcsettings__value">{{ selectedRole.behavior.focusChance }}%</span>
                </div>

                <div class="npcsettings__targets">Restricted Tasks</div>
                <div class="npcsettings__taskchecks">
                  <label v-for="task in draft.tasks" :key="task.id" class="npcsettings__taskcheck">
                    <input type="checkbox" :checked="isRestrictedTask(task.id)" @change="toggleRestrictedTask(task.id)" />
                    <span>{{ task.label }}</span>
                  </label>
                  <div v-if="draft.tasks.length === 0" class="npcsettings__empty">No tasks</div>
                </div>
              </div>

              <div class="npcsettings__section__hstack npcsettings__titletasks">Tasks</div>
              <div class="npcsettings__scroll__stack">
                <div
                  v-for="task in draft.tasks"
                  :key="task.id"
                  class="npcsettings__role__hstack"
                  :class="{ 'npcsettings__role__hstackactive': selectedTaskId === task.id }"
                  role="button"
                  tabindex="0"
                  @click="selectedTaskId = task.id"
                  @keydown.enter="selectedTaskId = task.id"
                >
                  <span class="npcsettings__role__truncate">
                    <strong>{{ task.label }}</strong>
                    <small>{{ task.tags.join(', ') || 'No tags' }}</small>
                  </span>
                  <button v-if="draft.tasks.length > 1" class="btn btn__ghost btn__icon btn__text__danger" @click.stop="onDeleteTask(task)" aria-label="Delete task">×</button>
                </div>
              </div>
              <div class="layout__row">
                <input v-model="newTaskLabel" type="text" placeholder="New task label" class="input" />
              </div>
              <div class="layout__row">
                <input v-model="newTaskTag" type="text" placeholder="tag" class="input" />
                <button class="btn" @click="onAddTask">Add</button>
              </div>

              <div v-if="selectedTask" class="npcsettings__behavior">
                <div class="npcsettings__targets">Tags for {{ selectedTask.label }}</div>
                <div v-for="(tag, index) in selectedTask.tags" :key="index" class="tag">
                  <span>{{ tag }}</span>
                  <button class="tag__remove" @click="onRemoveTaskTag(selectedTask, index)" aria-label="Remove tag">×</button>
                </div>
                <div class="layout__row">
                  <input v-model="newTaskTag" type="text" placeholder="add tag" class="input" />
                  <button class="btn" @click="onAddTaskTag">Add</button>
                </div>
              </div>
            </div>

            <!-- Pool & Speed -->
            <div class="layout__column card__primary">
              <div class="npcsettings__section__hstack">Deployment Pool</div>
              <div class="npcsettings__scroll__stack">
                <div v-for="role in draft.roles" :key="role.id" class="npcsettings__pool__hstack">
                  <span class="npcsettings__pool__truncate" :style="{ color: role.color }">{{ role.label }}</span>
                  <div class="layout__wrap">
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
              <div class="npcsettings__value">Total: {{ totalNpcCount() }} NPCs</div>

              <div class="npcsettings__section__hstack npcsettings__titlespeed">Speed</div>
              <div class="layout__row">
                <input v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" class="npcsettings__grow" />
                <span class="npcsettings__value">{{ draft.speed.toFixed(2) }}</span>
              </div>

              <div class="npcsettings__section__hstack npcsettings__titlezones">Zones</div>
              <div class="npcsettings__scroll__stack">
                <div v-for="zone in zones" :key="zone.id" class="npcsettings__zone__hstack">
                  <span class="npcsettings__zone__truncate">{{ zone.label }}</span>
                  <span class="npcsettings__zone__truncate">{{ (zone.tags ?? []).join(', ') || '-' }}</span>
                </div>
                <div v-if="zones.length === 0" class="npcsettings__empty">No zones</div>
              </div>
              <button class="btn" @click="onAddZone">+ Add Zone on Canvas</button>

              <div class="npcsettings__section__hstack npcsettings__titletags">Global Tags</div>
              <div class="layout__row">
                <input v-model="newTag" type="text" placeholder="New tag" class="input" @keydown="onKeydownTag" />
                <button class="btn" @click="onAddTag">Add</button>
              </div>
              <div class="npcsettings__search__hstack">
                <input v-model="tagSearch" type="text" placeholder="Search tags..." class="input" />
              </div>
              <div class="npcsettings__scroll__stack">
                <div v-for="tag in filteredTags" :key="tag" class="tag">
                  <span>{{ tag }}</span>
                  <button class="tag__remove" @click="onRemoveTag(tag)" aria-label="Remove tag">×</button>
                </div>
                <div v-if="filteredTags.length === 0" class="npcsettings__empty">No tags</div>
              </div>
            </div>
          </div>
        </div>

        <div class="npcsettings__footer__hstack">
          <button class="btn btn__primary" :disabled="pending" @click="onSave">Save Behavior</button>
          <button class="btn" :disabled="pending" @click="onClose">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>


<style scoped>

.npcsettings__modal {
  z-index: 1001;
  overflow: hidden;
  align-items: stretch;
}

.npcsettings__dialog__vstack {
  width: 100%;
  max-width: 80%;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  color: var(--text-primary);
  overflow: hidden;
}

.npcsettings__space__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.npcsettings__title__label {
  font-weight: 600;
  font-size: var(--font-md);
}

.npcsettings__button {
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-md);
  line-height: 1;
}

.npcsettings__body__vstack {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: var(--gap-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.npcsettings__footer__hstack {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  border-top: 1px solid var(--border-dim);
  background: var(--bg-card);
}

.npcsettings__grid {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1.6fr 1fr;
  gap: var(--gap-md);
}

.npcsettings__grid > .layout__column {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}



.layout__row,
.npcsettings__color__hstack,
.npcsettings__search__hstack {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  width: 100%;
}

.layout__row .input {
  flex: 1;
  min-width: 0;
}

.npcsettings__search__hstack .input,
.npcsettings__behavior > .input {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.npcsettings__label__bold {
  font-weight: 500;
  flex-shrink: 0;
}

.npcsettings__value {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.npcsettings__grow {
  flex: 1;
  min-width: 0;
}

.npcsettings__color__hstack .input:not(.input__color) {
  flex: 1;
  min-width: 0;
}

.input__color {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-shrink: 0;
}

.input__count {
  width: 48px;
  text-align: center;
  flex-shrink: 0;
}

.tag__remove {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0 var(--gap-xs);
  font-size: var(--font-sm);
  line-height: 1;
}

.tag__remove:hover {
  color: var(--accent-red);
  background: transparent;
  border: none;
  box-shadow: none;
  transform: none;
}

.npcsettings__section__hstack {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-weight: 600;
  font-size: var(--font-sm);
  padding: var(--gap-xs) 0;
  opacity: 0.9;
}

.layout__wrap {
  width: 100%;
}

.npcsettings__scroll__stack {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: var(--gap-xs);
  overflow-y: auto;
}

.npcsettings__pool__hstack,
.npcsettings__zone__hstack {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.npcsettings__pool__hstack:hover,
.npcsettings__zone__hstack:hover,
.npcsettings__role__hstack:hover {
  background: var(--bg-card);
}

.npcsettings__pool__truncate,
.npcsettings__zone__truncate,
.npcsettings__role__truncate {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.npcsettings__role__hstack {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
}

.npcsettings__role__hstackactive {
  border-color: var(--accent-blue);
  background: var(--bg-card);
}

.npcsettings__role__hstack:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

.npcsettings__role__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.npcsettings__role__truncate,
.npcsettings__role__detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.npcsettings__role__truncate small,
.npcsettings__role__description,
.npcsettings__role__recommended {
  color: var(--text-dim);
  font-size: var(--font-xs);
  font-weight: 400;
}

.npcsettings__role__description {
  color: var(--text-secondary);
}

.npcsettings__role__recommended {
  color: var(--accent-blue);
}

.npcsettings__behavior {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--gap-sm);
}

.npcsettings__targets {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.npcsettings__taskchecks {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--gap-xs);
}

.npcsettings__taskcheck {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-sm);
  cursor: pointer;
}

.npcsettings__empty {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  opacity: 0.6;
  padding: var(--gap-xs) 0;
}

.npcsettings__titletasks,
.npcsettings__titlespeed,
.npcsettings__titlezones,
.npcsettings__titletags {
  margin-top: var(--gap-sm);
  border-top: 1px solid var(--border-dim);
  padding-top: var(--gap-sm);
}
</style>