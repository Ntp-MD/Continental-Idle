<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useConfirm } from '@/composables/useConfirm'
import { useToast, reportSaved } from '@/composables/useToast'
import { isHexColor, normalizeNpcConfig, clampInt } from '../../domain/types'
import { genId, emptyNpcConfig, taskMatchesQuery, cloneDeepRaw } from '../../blueprintStore'
import { useDebouncedCallback } from '@/composables/useDebounceFn'
import { sanitizeString } from '../../../utils/sanitize'
import type { NpcRole, NpcSimulationConfig, NpcTask } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'
import NpcRoleList from './NpcRoleList.vue'
import NpcRoleDetail from './NpcRoleDetail.vue'
import NpcTaskCard from './NpcTaskCard.vue'
import SearchInput from '../inputs/SearchInput.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const confirm = useConfirm().confirm
const toast = useToast()
const view = ref<'roles' | 'library'>('roles')
const selectedRoleId = ref('')
const tagSearch = ref('')
const libTaskFilter = ref('')
const newTag = ref('')
const pending = ref(false)
const saveState = ref<'' | 'saved' | 'unsaved'>('')
let saveStateTimer: number | null = null

function markSaved() {
  saveState.value = 'saved'
  if (saveStateTimer) window.clearTimeout(saveStateTimer)
  saveStateTimer = window.setTimeout(() => (saveState.value = ''), 1500)
}

const draft = ref<NpcSimulationConfig>(emptyNpcConfig())
const roles = computed(() => draft.value.roles)
const tags = computed(() => store.globalTags.value)
const filteredTags = computed(() => {
  const query = tagSearch.value.trim().toLowerCase()
  return query ? tags.value.filter((tag) => tag.includes(query)) : tags.value
})
const selectedRole = computed<NpcRole | undefined>(() => roles.value.find((role) => role.id === selectedRoleId.value))
const invalidRole = computed(() => roles.value.find((role) => !role.label.trim() || !isHexColor(role.color)))

const filteredLibTasks = computed(() => {
  const query = libTaskFilter.value.trim().toLowerCase()
  if (!query) return draft.value.tasks
  return draft.value.tasks.filter((task) => taskMatchesQuery(task, query))
})

const missingDefault = computed(
  () => roles.value.length > 0 && !roles.value.some((role) => role.id === draft.value.defaultRoleId),
)

const statusText = computed(() => {
  if (invalidRole.value)
    return `Cannot save - "${invalidRole.value.label || invalidRole.value.id}" needs a label and valid color`
  if (missingDefault.value) return 'Cannot save - select a default role'
  if (saveState.value === 'unsaved') return 'Changes not saved'
  if (saveState.value === 'saved') return 'Saved'
  return ''
})

function normalizeConfig(value: NpcSimulationConfig): NpcSimulationConfig {
  const normalized = normalizeNpcConfig(cloneDeepRaw(value))
  if (!normalized) throw new Error('Invalid NPC configuration')
  for (const role of normalized.roles) role.label = sanitizeString(role.label)
  for (const task of normalized.tasks) task.label = sanitizeString(task.label)
  return normalized
}

function isPersistable(value: NpcSimulationConfig): boolean {
  return (
    value.roles.every((role) => role.label && isHexColor(role.color)) &&
    (!value.roles.length || value.roles.some((role) => role.id === value.defaultRoleId))
  )
}

async function persistConfig(showToast = false): Promise<boolean> {
  queuePersist.cancel()
  const normalized = normalizeConfig(draft.value)
  if (!isPersistable(normalized)) {
    saveState.value = 'unsaved'
    if (showToast) {
      const bad = normalized.roles.find((role) => !role.label || !isHexColor(role.color))
      toast.warning(`Cannot save - role "${bad?.label || bad?.id || '?'}" needs a label and valid color`)
    }
    return false
  }
  pending.value = true
  try {
    await store.updateNpcConfig(normalized)
    if (showToast) toast.success('NPC settings saved')
    else markSaved()
    return true
  } catch {
    toast.error('Failed to save NPC settings')
    return false
  } finally {
    pending.value = false
  }
}

const queuePersist = useDebouncedCallback(() => {
  void persistConfig()
}, 400)

function resetSelection() {
  selectedRoleId.value = draft.value.roles[0]?.id ?? ''
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      draft.value = cloneDeepRaw(store.state.layout.npcConfig ?? emptyNpcConfig())
      view.value = 'roles'
      resetSelection()
    }
  },
  { immediate: true },
)

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

function colorForId(id: string): string {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return hslToHex(h % 360, 60, 55)
}

async function addRole() {
  const id = genId('role')
  draft.value.roles.push({
    id,
    label: 'New Role',
    color: colorForId(id),
    focusTags: [],
    restrictedTags: [],
    taskIds: [],
    focusChance: 100,
    spawnRule: { targetTags: [], count: 0 },
  })
  if (!draft.value.defaultRoleId) draft.value.defaultRoleId = id
  view.value = 'roles'
  selectedRoleId.value = id
  await persistConfig()
}

async function deleteRole(role: NpcRole) {
  const isDefault = role.id === draft.value.defaultRoleId
  const others = draft.value.roles.filter((item) => item.id !== role.id)
  if (others.length === 0) {
    toast.warning('At least one role is required - cannot delete the last role')
    return
  }
  if (
    !(await confirm({
      title: 'Delete role',
      message: isDefault
        ? `Delete role "${role.label}"? "${others[0].label}" will become the default role.`
        : `Delete role "${role.label}"? Its deployment count and behavior settings will also be removed.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    }))
  )
    return
  draft.value.roles = others
  draft.value.pool = draft.value.pool.filter((entry) => entry.roleId !== role.id)
  if (isDefault) draft.value.defaultRoleId = others[0].id
  if (selectedRoleId.value === role.id) resetSelection()
  removeRoleFromFloors(role.id)
  const ok = await persistConfig()
  reportSaved(ok, `Role "${role.label}" deleted`, 'Failed to delete role - changes not saved')
}

function removeRoleFromFloors(roleId: string) {
  for (const floor of store.state.layout.floors) {
    if (floor.allowedRoleIds?.includes(roleId)) {
      const next = floor.allowedRoleIds.filter((id) => id !== roleId)
      if (next.length) floor.allowedRoleIds = next
      else delete floor.allowedRoleIds
    }
    if (floor.spawnZones?.some((zone) => zone.roleIds?.includes(roleId))) {
      floor.spawnZones = floor.spawnZones.map((zone) => {
        const roleIds = zone.roleIds?.filter((id) => id !== roleId)
        return roleIds?.length ? { ...zone, roleIds } : { ...zone, roleIds: undefined }
      })
    }
  }
}

async function setDefaultRole(role: NpcRole) {
  draft.value.defaultRoleId = role.id
  await persistConfig()
}

async function updateRole() {
  queuePersist()
}

async function renameRole(value: string) {
  if (!selectedRole.value) return
  selectedRole.value.label = value
  await updateRole()
}

async function setRoleChance(value: number) {
  if (!selectedRole.value) return
  selectedRole.value.focusChance = value
  await updateRole()
}

async function renameTask(task: NpcTask, value: string) {
  task.label = value
  await updateTask()
}

const taskUsageMap = computed(() => {
  const map = new Map<string, number>()
  for (const role of roles.value) {
    for (const taskId of role.taskIds) map.set(taskId, (map.get(taskId) ?? 0) + 1)
  }
  return map
})

function taskUsage(taskId: string): number {
  return taskUsageMap.value.get(taskId) ?? 0
}

async function addTask() {
  const id = genId('task')
  draft.value.tasks.push({ id, label: 'New Task', tags: [] })
  view.value = 'library'
  await persistConfig()
}

async function deleteTask(taskId: string) {
  const task = draft.value.tasks.find((item) => item.id === taskId)
  if (!task) return
  const usedBy = draft.value.roles.filter((role) => role.taskIds.includes(taskId))
  if (
    !(await confirm({
      title: 'Delete task',
      message: usedBy.length
        ? `Delete task "${task.label}"? It will also be removed from ${usedBy.length} role(s): ${usedBy.map((role) => role.label).join(', ')}.`
        : `Delete task "${task.label}"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    }))
  )
    return
  draft.value.tasks = draft.value.tasks.filter((item) => item.id !== taskId)
  for (const role of draft.value.roles) role.taskIds = role.taskIds.filter((id) => id !== taskId)
  await persistConfig()
}

async function updateTask() {
  queuePersist()
}

async function addTaskTag(task: NpcTask, value: string) {
  const input = value.trim()
  if (!input) return
  for (const part of input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)) {
    if (!task.tags.includes(part)) task.tags.push(part)
  }
  await store.ensureTag(task.tags[task.tags.length - 1])
  await updateTask()
}

async function removeTaskTag(task: NpcTask, tag: string) {
  task.tags = task.tags.filter((item) => item !== tag)
  await updateTask()
}

async function toggleTaskAssignment(taskId: string) {
  if (!selectedRole.value) return
  const ids = selectedRole.value.taskIds
  const index = ids.indexOf(taskId)
  if (index >= 0) ids.splice(index, 1)
  else ids.push(taskId)
  await updateRole()
}

async function commitRoleColor(value: string | undefined) {
  if (!selectedRole.value) return
  selectedRole.value.color = value ?? '#cccccc'
  await updateRole()
}

async function addTag() {
  const tag = newTag.value.trim()
  if (!tag) return
  await store.addTag(tag)
  newTag.value = ''
}

async function removeTag(tag: string) {
  if (
    !(await confirm({
      title: 'Delete tag',
      message: `Delete "${tag}"? It will be removed from all origin assets, roles and tasks.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    }))
  )
    return
  try {
    reportSaved(await store.removeTag(tag), `Tag "${tag}" deleted`, 'Failed to delete tag - changes not saved')
  } catch {
    toast.error('Failed to delete tag - changes not saved')
  }
}

async function addRoleTag(kind: 'focus' | 'restricted', tag: string) {
  if (!selectedRole.value) return
  const value = tag.trim()
  if (!value) return
  const target = kind === 'focus' ? selectedRole.value.focusTags : selectedRole.value.restrictedTags
  if (!target.includes(value)) target.push(value)
  await store.ensureTag(value)
  queuePersist()
}

async function removeRoleTag(kind: 'focus' | 'restricted', tag: string) {
  if (!selectedRole.value) return
  if (kind === 'focus') selectedRole.value.focusTags = selectedRole.value.focusTags.filter((item) => item !== tag)
  else selectedRole.value.restrictedTags = selectedRole.value.restrictedTags.filter((item) => item !== tag)
  queuePersist()
}

function setTriggerRate(tag: string, rate: number) {
  const safeRate = clampInt(rate || 0, 0, 100)
  if (!draft.value.tagTriggerRates) draft.value.tagTriggerRates = {}
  if (safeRate === 0) delete draft.value.tagTriggerRates[tag]
  else draft.value.tagTriggerRates[tag] = safeRate
  queuePersist()
}

function onClose() {
  queuePersist.cancel()
  void persistConfig(true).then(() => emit('close'))
}

onUnmounted(() => {
  if (saveStateTimer) window.clearTimeout(saveStateTimer)
})
</script>

<template>
  <ModalShell :open="open" modal-id="modal-npc-manager" title="NPC Manager" @close="onClose">
    <template #header>
      <span
        class="npc__status-text truncate"
        :class="{ 'npc__status-text--invalid': invalidRole || missingDefault }"
        aria-live="polite"
        >{{ statusText }}</span
      >
    </template>
    <div class="tabs__bar">
      <button
        type="button"
        class="tabs__tab"
        :class="{ 'flag--active': view === 'roles' }"
        :aria-pressed="view === 'roles'"
        @click="view = 'roles'"
      >
        Role Editor ({{ roles.length }})
      </button>
      <button
        type="button"
        class="tabs__tab"
        :class="{ 'flag--active': view === 'library' }"
        :aria-pressed="view === 'library'"
        @click="view = 'library'"
      >
        Tags &amp; Tasks ({{ tags.length }} / {{ draft.tasks.length }})
      </button>
    </div>

    <div v-if="view === 'roles'" class="form__row form--start form--wrap">
      <NpcRoleList
        :roles="roles"
        :default-role-id="draft.defaultRoleId"
        :selected-id="selectedRoleId"
        :pending="pending"
        @select="selectedRoleId = $event"
        @set-default="setDefaultRole"
        @remove="deleteRole"
        @add="addRole"
      />
      <NpcRoleDetail
        v-if="selectedRole"
        :key="selectedRole.id"
        :role="selectedRole"
        :tasks="draft.tasks"
        :all-tags="tags"
        :trigger-rates="draft.tagTriggerRates"
        :is-default="selectedRole.id === draft.defaultRoleId"
        @update="updateRole"
        @rename="renameRole"
        @chance="setRoleChance"
        @commit-color="commitRoleColor"
        @add-tag="addRoleTag"
        @remove-tag="removeRoleTag"
        @toggle-task="toggleTaskAssignment"
        @set-rate="setTriggerRate"
        @remove="deleteRole(selectedRole)"
      />
      <section v-else class="npc__detail">
        <div class="empty">Select a role on the left to edit it</div>
      </section>
    </div>

    <div v-else class="form__row form--start form--wrap">
      <section class="form__col npc__panel">
        <div>Tags</div>
        <SearchInput v-model="tagSearch" placeholder="Search tags..." label="Search tags" />
        <div class="form__row npc__add">
          <input
            v-model="newTag"
            class="size--stretch"
            type="text"
            placeholder="New tag"
            aria-label="New tag"
            @keydown.enter="addTag"
          />
          <button type="button" class="flag--active" @click="addTag">Add</button>
        </div>
        <ul v-if="filteredTags.length" class="form__col">
          <li v-for="tag in filteredTags" :key="tag" class="card__item">
            <span class="size--stretch truncate">{{ tag }}</span>
            <button type="button" class="flag--danger" aria-label="Delete tag" @click="removeTag(tag)">x</button>
          </li>
        </ul>
        <div v-else class="empty">No tags</div>
      </section>

      <section class="form__col npc__panel">
        <div>Tasks</div>
        <SearchInput v-model="libTaskFilter" placeholder="Search tasks..." label="Search tasks" />
        <ul v-if="filteredLibTasks.length" class="form__col">
          <li v-for="task in filteredLibTasks" :key="task.id">
            <NpcTaskCard
              :task="task"
              :usage-count="taskUsage(task.id)"
              @update="updateTask"
              @rename="(value) => renameTask(task, value)"
              @remove="deleteTask(task.id)"
              @remove-tag="(tag) => removeTaskTag(task, tag)"
              @add-tag="(value) => addTaskTag(task, value)"
            />
          </li>
        </ul>
        <div v-else class="empty">No tasks yet - click "+ Add Task"</div>
        <button type="button" class="flag--active size--fill" :disabled="pending" @click="addTask">+ Add Task</button>
      </section>
    </div>
  </ModalShell>
</template>
<style>
.npc__panel button {
  flex-shrink: 0;
}

.form__row > .npc__sidebar {
  flex: 1 1 220px;
  max-width: 340px;
}

.form__row > .npc__detail {
  flex: 1 1 320px;
}

.npc__detail,
.npc__panel {
  min-width: 0;
  padding: var(--gap-md);
}

.form__row > .npc__panel {
  flex: 1 1 280px;
}

.npc__add {
  flex-shrink: 0;
}

.npc__status-text {
  color: var(--text-secondary);
  margin-right: auto;
}

.npc__status-text--invalid {
  color: var(--accent-gold);
}

#modal-npc-manager {
  width: min(90vw, 1200px);
  height: 90vh;
  max-height: calc(100vh - 32px);
}
</style>
