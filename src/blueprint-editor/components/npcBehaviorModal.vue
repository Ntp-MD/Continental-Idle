<script setup lang="ts">
import { ref, watch, inject, computed, onUnmounted } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useNpcSimulation } from '../composables/useNpcSimulation'
import { useToast } from '@/composables/useToast'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { sanitizeString } from '../../utils/sanitize'
import { currentFloor, isHexColor } from '../store/state'
import { NPC_ROLE_META } from '../store/npcDefault'
import { EDITOR_CONFIG } from '../editorConfig'
import type { NpcSimulationConfig, NpcRole, NpcTask } from '../types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const pending = ref(false)

const isOpen = computed(() => props.open)
const containerRef = ref<HTMLElement>()
useFocusTrap(isOpen, containerRef)

const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>

const draft = ref<NpcSimulationConfig>(cloneConfig(npcSimulation.config.value))
const selectedRoleId = ref('')
const selectedTaskId = ref('')
const activeTab = ref<'roles' | 'tasks' | 'pool' | 'zones'>('roles')
let persistTimer: number | null = null
let lastPersistedConfig = JSON.stringify(draft.value)

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function normalizeDraft(): NpcSimulationConfig {
  const config = cloneConfig(draft.value)
  config.tasks = (config.tasks ?? []).map(task => ({
    ...task,
    label: task.label.trim(),
    tags: Array.from(new Set(task.tags.map(tag => tag.trim()).filter(Boolean))),
  }))
  config.roles = config.roles.map(role => ({
    ...role,
    label: sanitizeString(role.label),
    behavior: {
      ...role.behavior,
      focusChance: role.behavior.focusTaskId ? Math.max(0, Math.min(100, Math.floor(role.behavior.focusChance))) : 0,
      restrictedTaskIds: Array.from(new Set(role.behavior.restrictedTaskIds)),
    },
  }))
  return config
}

function isPersistableConfig(config: NpcSimulationConfig): boolean {
  if (config.tasks.some(task => !task.label)) return false
  if (config.roles.some(role => !role.label || !isColor(role.color))) return false
  if (!config.roles.some(role => role.id === config.defaultRoleId)) return false
  return !config.roles.some(role => role.behavior.focusTaskId !== undefined && (role.behavior.focusChance < 0 || role.behavior.focusChance > 100))
}

async function persistDraft(showToast = false): Promise<boolean> {
  const config = normalizeDraft()
  if (!isPersistableConfig(config)) return false
  const serialized = JSON.stringify(config)
  if (serialized === lastPersistedConfig) return true
  pending.value = true
  try {
    await store.updateNpcConfig(config)
    lastPersistedConfig = serialized
    if (showToast) toast.success('NPC settings saved')
    return true
  } catch {
    toast.error('Failed to save NPC settings')
    return false
  } finally {
    pending.value = false
  }
}

function scheduleDraftPersist() {
  if (!props.open || JSON.stringify(normalizeDraft()) === lastPersistedConfig) return
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    void persistDraft()
  }, EDITOR_CONFIG.saveDebounceMs)
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
  activeTab.value = 'roles'
  lastPersistedConfig = JSON.stringify(draft.value)
}

watch(() => props.open, (open) => {
  if (open) resetDraft()
})

watch(draft, scheduleDraftPersist, { deep: true })

const selectedRole = computed<NpcRole | undefined>(() => draft.value.roles.find(r => r.id === selectedRoleId.value))
const selectedTask = computed<NpcTask | undefined>(() => draft.value.tasks.find(t => t.id === selectedTaskId.value))

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
  void persistDraft()
}

function canDeleteRole(role: NpcRole): boolean {
  return role.id !== draft.value.defaultRoleId
}

function onDeleteRole(role: NpcRole) {
  if (role.id === draft.value.defaultRoleId) {
    toast.warning('Default role cannot be deleted')
    return
  }
  if (!window.confirm(`Delete role "${role.label}"? Its deployment count and behavior settings will also be removed.`)) return
  draft.value.roles = draft.value.roles.filter(r => r.id !== role.id)
  draft.value.pool = draft.value.pool.filter(p => p.roleId !== role.id)
  if (selectedRoleId.value === role.id) {
    selectedRoleId.value = draft.value.roles[0]?.id ?? ''
  }
  void persistDraft()
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
  void persistDraft()
}

function onDeleteTask(task: NpcTask) {
  if (!window.confirm(`Delete task "${task.label}"? Role restrictions and focus settings for this task will also be removed.`)) return
  draft.value.tasks = draft.value.tasks.filter(t => t.id !== task.id)
  for (const role of draft.value.roles) {
    if (role.behavior.focusTaskId === task.id) role.behavior.focusTaskId = undefined
    role.behavior.restrictedTaskIds = role.behavior.restrictedTaskIds.filter(id => id !== task.id)
  }
  if (selectedTaskId.value === task.id) {
    selectedTaskId.value = draft.value.tasks[0]?.id ?? ''
  }
  void persistDraft()
}

function onAddTaskTag() {
  if (!selectedTask.value) return
  const tag = newTaskTag.value.trim()
  if (!tag) return
  if (selectedTask.value.tags.includes(tag)) return
  selectedTask.value.tags.push(tag)
  newTaskTag.value = ''
  void persistDraft()
}

function onRemoveTaskTag(task: NpcTask, index: number) {
  task.tags.splice(index, 1)
  void persistDraft()
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

function getRoleMeta(role: NpcRole) {
  return NPC_ROLE_META[role.id] ?? {
    category: 'custom' as const,
    summary: 'Custom editor role',
    recommendedTags: [],
  }
}

const selectedRoleMeta = computed(() => selectedRole.value ? getRoleMeta(selectedRole.value) : null)

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
  return isHexColor(value)
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
  const allTags = draft.value.tasks.flatMap(t => t.tags)
  if (allTags.length > 0) await store.ensureTags(allTags)
  await persistDraft(true)
}

function onClose() {
  if (persistTimer) {
    window.clearTimeout(persistTimer)
    persistTimer = null
    void persistDraft()
  }
  emit('close')
}

onUnmounted(() => {
  if (persistTimer) {
    window.clearTimeout(persistTimer)
    persistTimer = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal__overlay npcmodal" @click.self="onClose">
      <div ref="containerRef" class="npcmodal__dialog" role="dialog" aria-modal="true" aria-labelledby="npc__modal__title">
        <div class="npcmodal__header">
          <span id="npc__modal__title" class="npcmodal__title">NPC Behavior Manager</span>
          <button class="npcmodal__close" @click="onClose" aria-label="Close">✕</button>
        </div>

        <div class="npcmodal__tabs">
          <button
            :class="{ 'npcmodal__tabactive': activeTab === 'roles' }"
            @click="activeTab = 'roles'"
          >Roles & Behavior</button>
          <button
            :class="{ 'npcmodal__tabactive': activeTab === 'tasks' }"
            @click="activeTab = 'tasks'"
          >Tasks & Tags</button>
          <button
            :class="{ 'npcmodal__tabactive': activeTab === 'pool' }"
            @click="activeTab = 'pool'"
          >Deployment & Speed</button>
          <button
            :class="{ 'npcmodal__tabactive': activeTab === 'zones' }"
            @click="activeTab = 'zones'"
          >Zones</button>
        </div>

        <div class="npcmodal__body">
          <!-- Tab: Roles & Behavior -->
          <div v-if="activeTab === 'roles'" class="npcmodal__tabpanel">
            <div class="npcmodal__split">
              <div class="npcmodal__pane">
                <div class="npcmodal__sectiontitle">Roles</div>
                <div class="npcmodal__scrolllist">
                  <div
                    v-for="role in draft.roles"
                    :key="role.id"
                    class="npcmodal__rolerow"
                    :class="{ 'npcmodal__rolerowactive': selectedRoleId === role.id }"
                    role="button"
                    tabindex="0"
                    @click="selectedRoleId = role.id"
                    @keydown.enter="selectedRoleId = role.id"
                  >
                    <span class="npcmodal__swatch" :style="{ background: role.color }" />
                    <span class="npcmodal__truncate">
                      <strong>{{ role.label }}</strong>
                      <small>{{ getRoleMeta(role).category }} · {{ getPoolCount(role.id) }} deployed</small>
                    </span>
                    <button
                      v-if="canDeleteRole(role)"
                      type="button"
                      class="btn__ghost btn__icon btn__text__danger"
                      @click.stop.prevent="onDeleteRole(role)"
                      aria-label="Delete role"
                    >×</button>
                  </div>
                </div>
                <button @click="onAddRole">+ Add Role</button>
              </div>

              <div class="npcmodal__pane">
                <div class="npcmodal__sectiontitle">Role Behavior</div>
                <div v-if="selectedRole" class="npcmodal__behavioredit">
                  <div class="npcmodal__roledetail">
                    <span class="tag">{{ selectedRoleMeta?.category }}<span v-if="selectedRoleMeta?.rank"> · Rank {{ selectedRoleMeta.rank }}</span></span>
                    <span class="npcmodal__rolesummary">{{ selectedRoleMeta?.summary }}</span>
                    <span v-if="selectedRoleMeta?.recommendedTags.length" class="npcmodal__rolerecommended">Recommended: {{ selectedRoleMeta.recommendedTags.join(', ') }}</span>
                  </div>
                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'role__label__' + selectedRole.id">Label</label>
                    <input :id="'role__label__' + selectedRole.id" v-model="selectedRole.label" type="text" class="input" />
                  </div>
                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'role__color__' + selectedRole.id">Color</label>
                    <input
                      :id="'role__color__' + selectedRole.id"
                      v-model="selectedRole.color"
                      type="text"
                      class="input"
                      placeholder="#RRGGBB"
                      aria-label="Role color hex value"
                    />
                  </div>
                  <div class="npcmodal__targets">Focus Task</div>
                  <select v-model="selectedRole.behavior.focusTaskId" class="input" :aria-label="'Focus task for ' + selectedRole.label">
                    <option value="">None</option>
                    <option v-for="task in draft.tasks" :key="task.id" :value="task.id">{{ task.label }}</option>
                  </select>
                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'role__chance__' + selectedRole.id">Chance</label>
                    <input :id="'role__chance__' + selectedRole.id" v-model.number="selectedRole.behavior.focusChance" type="range" min="0" max="100" class="npcmodal__grow" />
                    <span class="npcmodal__value">{{ selectedRole.behavior.focusChance }}%</span>
                  </div>
                  <div class="npcmodal__targets">Restricted Tasks</div>
                  <div class="npcmodal__taskchecks">
                    <label v-for="task in draft.tasks" :key="task.id" class="npcmodal__taskcheck">
                      <input type="checkbox" :checked="isRestrictedTask(task.id)" @change="toggleRestrictedTask(task.id)" />
                      <span>{{ task.label }}</span>
                    </label>
                    <div v-if="draft.tasks.length === 0" class="npcmodal__empty">No tasks</div>
                  </div>
                </div>
                <div v-else class="npcmodal__empty">Select a role to edit its behavior</div>
              </div>
            </div>
          </div>

          <!-- Tab: Tasks & Tags -->
          <div v-if="activeTab === 'tasks'" class="npcmodal__tabpanel">
            <div class="npcmodal__split">
              <div class="npcmodal__pane">
                <div class="npcmodal__sectiontitle">Tasks</div>
                <div class="npcmodal__scrolllist">
                  <div
                    v-for="task in draft.tasks"
                    :key="task.id"
                    class="npcmodal__rolerow"
                    :class="{ 'npcmodal__rolerowactive': selectedTaskId === task.id }"
                    role="button"
                    tabindex="0"
                    @click="selectedTaskId = task.id"
                    @keydown.enter="selectedTaskId = task.id"
                  >
                    <span class="npcmodal__truncate">
                      <strong>{{ task.label }}</strong>
                      <small>{{ task.tags.join(', ') || 'No tags' }}</small>
                    </span>
                    <button v-if="draft.tasks.length > 1" type="button" class="btn__ghost btn__icon btn__text__danger" @click.stop.prevent="onDeleteTask(task)" aria-label="Delete task">×</button>
                  </div>
                </div>
                <div class="layout__row">
                  <input v-model="newTaskLabel" type="text" placeholder="New task label" class="input" />
                </div>
                <div class="layout__row">
                  <input v-model="newTaskTag" type="text" placeholder="tag" class="input" />
                  <button @click="onAddTask">Add</button>
                </div>
                <div v-if="selectedTask" class="npcmodal__tasktags">
                  <div class="npcmodal__targets">Tags for {{ selectedTask.label }}</div>
                  <div class="npcmodal__taglist">
                    <div v-for="(tag, index) in selectedTask.tags" :key="index" class="tag">
                      <span>{{ tag }}</span>
                      <button class="tag__remove" @click="onRemoveTaskTag(selectedTask, index)" aria-label="Remove tag">×</button>
                    </div>
                  </div>
                  <div class="layout__row">
                    <input v-model="newTaskTag" type="text" placeholder="add tag" class="input" />
                    <button @click="onAddTaskTag">Add</button>
                  </div>
                </div>
              </div>

              <div class="npcmodal__pane">
                <div class="npcmodal__sectiontitle">Global Tags</div>
                <div class="layout__row">
                  <input v-model="newTag" type="text" placeholder="New tag" class="input" @keydown="onKeydownTag" />
                  <button @click="onAddTag">Add</button>
                </div>
                <div class="layout__row">
                  <input v-model="tagSearch" type="text" placeholder="Search tags..." class="input" />
                </div>
                <div class="npcmodal__scrolllist">
                  <div v-for="tag in filteredTags" :key="tag" class="tag">
                    <span>{{ tag }}</span>
                    <button class="tag__remove" @click="onRemoveTag(tag)" aria-label="Remove tag">×</button>
                  </div>
                  <div v-if="filteredTags.length === 0" class="npcmodal__empty">No tags</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Deployment & Speed -->
          <div v-if="activeTab === 'pool'" class="npcmodal__tabpanel">
            <div class="npcmodal__singlepane">
              <div class="npcmodal__sectiontitle">Deployment Pool</div>
              <div class="npcmodal__poollist">
                <div v-for="role in draft.roles" :key="role.id" class="npcmodal__poolrow">
                  <span class="npcmodal__poolname" :style="{ color: role.color }">{{ role.label }}</span>
                  <div class="layout__wrap">
                    <button class="btn__icon" @click="setPoolCount(role.id, getPoolCount(role.id) - 1)">−</button>
                    <input
                      :value="getPoolCount(role.id)"
                      type="number"
                      min="0"
                      max="100"
                      class="input input__count"
                      @input="setPoolCount(role.id, Number(($event.target as HTMLInputElement).value))"
                    />
                    <button class="btn__icon" @click="setPoolCount(role.id, getPoolCount(role.id) + 1)">+</button>
                  </div>
                </div>
              </div>
              <div class="npcmodal__total">Total: {{ totalNpcCount() }} NPCs</div>

              <div class="npcmodal__sectiontitle npcmodal__speedtitle">Speed</div>
              <div class="layout__row">
                <input v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" class="npcmodal__grow" />
                <span class="npcmodal__value">{{ draft.speed.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Tab: Zones -->
          <div v-if="activeTab === 'zones'" class="npcmodal__tabpanel">
            <div class="npcmodal__singlepane">
              <div class="npcmodal__sectiontitle">Zones on Current Floor</div>
              <div class="npcmodal__scrolllist">
                <div v-for="zone in zones" :key="zone.id" class="npcmodal__zonerow">
                  <span class="npcmodal__truncate">{{ zone.label }}</span>
                  <span class="npcmodal__truncate">{{ (zone.tags ?? []).join(', ') || '-' }}</span>
                </div>
                <div v-if="zones.length === 0" class="npcmodal__empty">No zones on this floor</div>
              </div>
            </div>
          </div>
        </div>

        <div class="npcmodal__footer">
          <button class="btn__primary" :disabled="pending" @click="onSave">Save Behavior</button>
          <button :disabled="pending" @click="onClose">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.npcmodal {
  z-index: 1001;
  overflow: hidden;
  align-items: stretch;
}

.npcmodal__dialog {
  width: 100%;
  max-width: 900px;
  height: 100vh;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  color: var(--text-primary);
  overflow: hidden;
}

.npcmodal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.npcmodal__title {
  font-weight: 600;
  font-size: var(--font-md);
}

.npcmodal__close {
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-md);
  line-height: 1;
}

.npcmodal__tabs {
  display: flex;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.npcmodal__tabs button {
  padding: var(--gap-xs) var(--gap-sm);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: 500;
}

.npcmodal__tabs button:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.npcmodal__tabactive {
  background: var(--bg-primary) !important;
  border-color: var(--border-dim) !important;
  color: var(--text-primary) !important;
}

.npcmodal__body {
  flex: 1;
  min-height: 0;
  padding: var(--gap-md);
  overflow: hidden;
}

.npcmodal__tabpanel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  min-height: 0;
}

.npcmodal__split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-md);
  height: 100%;
  min-height: 0;
}

.npcmodal__pane {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.npcmodal__singlepane {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-height: 0;
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
}

.npcmodal__sectiontitle {
  font-weight: 600;
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.npcmodal__scrolllist {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.npcmodal__rolerow {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-align: left;
  flex-shrink: 0;
}

.npcmodal__rolerow:hover {
  background: var(--bg-card);
}

.npcmodal__rolerowactive {
  border-color: var(--accent-blue);
  background: var(--bg-card);
}

.npcmodal__rolerow:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

.npcmodal__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.npcmodal__truncate {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.npcmodal__truncate small {
  color: var(--text-dim);
  font-size: var(--font-xs);
  font-weight: 400;
}

.npcmodal__behavioredit {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.npcmodal__roledetail {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.npcmodal__rolesummary {
  color: var(--text-secondary);
  font-size: var(--font-xs);
}

.npcmodal__rolerecommended {
  color: var(--accent-blue);
  font-size: var(--font-xs);
}

.npcmodal__label {
  font-weight: 500;
  flex-shrink: 0;
}

.npcmodal__value {
  flex-shrink: 0;
  text-align: right;
  font-size: var(--font-sm);
}

.npcmodal__grow {
  flex: 1;
  min-width: 0;
}

.npcmodal__targets {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.npcmodal__taskchecks {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.npcmodal__taskcheck {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-sm);
  cursor: pointer;
}

.npcmodal__empty {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  opacity: 0.6;
  padding: var(--gap-xs) 0;
}

.npcmodal__tasktags {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding-top: var(--gap-sm);
  border-top: 1px solid var(--border-dim);
}

.npcmodal__taglist {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}

.npcmodal__poollist {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.npcmodal__poolrow {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.npcmodal__poolrow:hover {
  background: var(--bg-card);
}

.npcmodal__poolname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.npcmodal__total {
  text-align: right;
  font-size: var(--font-sm);
  font-weight: 600;
  padding: var(--gap-xs) 0;
}

.npcmodal__speedtitle {
  margin-top: var(--gap-md);
  border-top: 1px solid var(--border-dim);
  padding-top: var(--gap-md);
}

.npcmodal__zonerow {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.npcmodal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  border-top: 1px solid var(--border-dim);
  background: var(--bg-card);
  flex-shrink: 0;
}

.layout__row {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  width: 100%;
  flex-shrink: 0;
}

.layout__row .input {
  flex: 1;
  min-width: 0;
}

.layout__wrap {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
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
</style>
