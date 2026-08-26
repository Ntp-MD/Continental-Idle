<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useConfirm } from "@/composables/useConfirm";
import { useToast } from "@/composables/useToast";
import { isHexColor, normalizeNpcConfig } from "../types";
import { managedTagSet } from "../store/tags";
import { genId, emptyNpcConfig } from "../store/utils";
import { sanitizeString } from "../../utils/sanitize";
import type { NpcRole, NpcSimulationConfig, NpcTask } from "../types";
import ModalShell from "./ModalShell.vue";
import ColorInput from "./ColorInput.vue";
import TagChip from "./TagChip.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const confirm = useConfirm().confirm;
const toast = useToast();
const view = ref<"roles" | "library">("roles");
const selectedRoleId = ref("");
const tagSearch = ref("");
const taskFilter = ref("");
const libTaskFilter = ref("");
const newTag = ref("");
const newFocusTag = ref("");
const newRestrictedTag = ref("");
const newTaskTags = ref<Record<string, string>>({});
const pending = ref(false);
const saveState = ref<"" | "saved" | "unsaved">("");
let saveStateTimer: number | null = null;
let rateTimer: number | null = null;
const ratesExpanded = ref(false);
const rateSearch = ref("");
const rateScopeAll = ref(false);

function markSaved() {
  saveState.value = "saved";
  if (saveStateTimer) window.clearTimeout(saveStateTimer);
  saveStateTimer = window.setTimeout(() => (saveState.value = ""), 1500);
}

const draft = ref<NpcSimulationConfig>(emptyNpcConfig());
const roles = computed(() => draft.value.roles);
const tags = computed(() => store.globalTags.value);
const filteredTags = computed(() => {
  const query = tagSearch.value.trim().toLowerCase();
  return query ? tags.value.filter((tag) => tag.includes(query)) : tags.value;
});
const selectedRole = computed<NpcRole | undefined>(() => roles.value.find((role) => role.id === selectedRoleId.value));
const availableFocusTags = computed(() => tags.value.filter((tag) => !selectedRole.value?.focusTags.includes(tag)));
const availableRestrictedTags = computed(() => tags.value.filter((tag) => !selectedRole.value?.restrictedTags.includes(tag)));
const invalidRole = computed(() => roles.value.find((role) => !role.label.trim() || !isHexColor(role.color)));

function taskMatchesQuery(task: NpcTask, query: string): boolean {
  return task.label.toLowerCase().includes(query) || task.tags.some((tag) => tag.toLowerCase().includes(query));
}

const filteredAssignTasks = computed(() => {
  if (!selectedRole.value) return [];
  const query = taskFilter.value.trim().toLowerCase();
  if (!query) return draft.value.tasks;
  return draft.value.tasks.filter((task) => taskMatchesQuery(task, query));
});

const filteredLibTasks = computed(() => {
  const query = libTaskFilter.value.trim().toLowerCase();
  if (!query) return draft.value.tasks;
  return draft.value.tasks.filter((task) => taskMatchesQuery(task, query));
});

const selectedRoleTagScope = computed<string[]>(() => {
  const role = selectedRole.value;
  if (!role) return [];
  const set = new Set<string>([...role.focusTags, ...role.restrictedTags]);
  for (const tag of role.spawnRule?.targetTags ?? []) set.add(tag);
  for (const id of role.taskIds) {
    const task = draft.value.tasks.find((item) => item.id === id);
    for (const tag of task?.tags ?? []) set.add(tag);
  }
  return [...set];
});

const rateRows = computed<string[]>(() => {
  const base = rateScopeAll.value ? [...tags.value] : [...new Set([...selectedRoleTagScope.value, ...Object.keys(draft.value.tagTriggerRates ?? {})])].filter((tag) => managedTagSet.value.has(tag) || (draft.value.tagTriggerRates?.[tag] ?? 0) > 0);
  const query = rateSearch.value.trim().toLowerCase();
  const list = query ? base.filter((tag) => tag.toLowerCase().includes(query)) : base;
  return list.sort((a, b) => a.localeCompare(b));
});

const configuredRateCount = computed(() => Object.keys(draft.value.tagTriggerRates ?? {}).length);

const roleRateCount = computed(() => selectedRoleTagScope.value.filter((tag) => (draft.value.tagTriggerRates?.[tag] ?? 0) > 0).length);

const missingDefault = computed(() => roles.value.length > 0 && !roles.value.some((role) => role.id === draft.value.defaultRoleId));

const statusText = computed(() => {
  if (invalidRole.value) return `Cannot save - "${invalidRole.value.label || invalidRole.value.id}" needs a label and valid color`;
  if (missingDefault.value) return "Cannot save - select a default role";
  if (saveState.value === "unsaved") return "Changes not saved";
  if (saveState.value === "saved") return "Saved";
  return "";
});

function cloneConfig(value: NpcSimulationConfig): NpcSimulationConfig {
  return JSON.parse(JSON.stringify(value)) as NpcSimulationConfig;
}

function normalizeConfig(value: NpcSimulationConfig): NpcSimulationConfig {
  const normalized = normalizeNpcConfig(cloneConfig(value));
  if (!normalized) throw new Error("Invalid NPC configuration");
  for (const role of normalized.roles) role.label = sanitizeString(role.label);
  for (const task of normalized.tasks) task.label = sanitizeString(task.label);
  return normalized;
}

function isPersistable(value: NpcSimulationConfig): boolean {
  return value.roles.every((role) => role.label && isHexColor(role.color)) && (!value.roles.length || value.roles.some((role) => role.id === value.defaultRoleId));
}

async function persistConfig(showToast = false): Promise<boolean> {
  flushRatePersist();
  const normalized = normalizeConfig(draft.value);
  if (!isPersistable(normalized)) {
    saveState.value = "unsaved";
    if (showToast) {
      const bad = normalized.roles.find((role) => !role.label || !isHexColor(role.color));
      toast.warning(`Cannot save - role "${bad?.label || bad?.id || "?"}" needs a label and valid color`);
    }
    return false;
  }
  pending.value = true;
  try {
    await store.updateNpcConfig(normalized);
    if (showToast) toast.success("NPC settings saved");
    else markSaved();
    return true;
  } catch {
    toast.error("Failed to save NPC settings");
    return false;
  } finally {
    pending.value = false;
  }
}

function flushRatePersist() {
  if (rateTimer) {
    window.clearTimeout(rateTimer);
    rateTimer = null;
  }
}

function queuePersist() {
  flushRatePersist();
  rateTimer = window.setTimeout(() => {
    rateTimer = null;
    void persistConfig();
  }, 400);
}

function resetSelection() {
  selectedRoleId.value = draft.value.roles[0]?.id ?? "";
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      draft.value = cloneConfig(store.state.layout.npcConfig ?? emptyNpcConfig());
      view.value = "roles";
      resetSelection();
    }
  },
);

function randomColor(): string {
  const letters = "89ABCDEF";
  return `#${Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("")}`;
}

async function addRole() {
  const id = genId("role");
  draft.value.roles.push({
    id,
    label: "New Role",
    color: randomColor(),
    focusTags: [],
    restrictedTags: [],
    taskIds: [],
    focusChance: 100,
    spawnRule: { targetTags: [], count: 0 },
  });
  if (!draft.value.defaultRoleId) draft.value.defaultRoleId = id;
  view.value = "roles";
  selectedRoleId.value = id;
  await persistConfig();
}

async function deleteRole(role: NpcRole) {
  if (role.id === draft.value.defaultRoleId) {
    toast.warning("Default role cannot be deleted");
    return;
  }
  if (
    !(await confirm({
      title: "Delete role",
      message: `Delete role "${role.label}"? Its deployment count and behavior settings will also be removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      danger: true,
    }))
  )
    return;
  draft.value.roles = draft.value.roles.filter((item) => item.id !== role.id);
  draft.value.pool = draft.value.pool.filter((entry) => entry.roleId !== role.id);
  if (selectedRoleId.value === role.id) resetSelection();
  const ok = await persistConfig();
  if (ok) toast.success(`Role "${role.label}" deleted`);
  else toast.error("Failed to delete role - changes not saved");
}

async function setDefaultRole(role: NpcRole) {
  draft.value.defaultRoleId = role.id;
  await persistConfig();
}

async function updateRole() {
  await persistConfig();
}

function roleSummary(role: NpcRole): string {
  return `${role.focusTags.length} focus - ${role.taskIds.length} tasks`;
}

function taskUsage(taskId: string): number {
  return roles.value.filter((role) => role.taskIds.includes(taskId)).length;
}

async function addTask() {
  const id = genId("task");
  draft.value.tasks.push({ id, label: "New Task", tags: [] });
  view.value = "library";
  await persistConfig();
}

async function deleteTask(taskId: string) {
  const task = draft.value.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const usedBy = draft.value.roles.filter((role) => role.taskIds.includes(taskId));
  if (
    !(await confirm({
      title: "Delete task",
      message: usedBy.length ? `Delete task "${task.label}"? It will also be removed from ${usedBy.length} role(s): ${usedBy.map((role) => role.label).join(", ")}.` : `Delete task "${task.label}"?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      danger: true,
    }))
  )
    return;
  draft.value.tasks = draft.value.tasks.filter((item) => item.id !== taskId);
  for (const role of draft.value.roles) role.taskIds = role.taskIds.filter((id) => id !== taskId);
  await persistConfig();
}

async function updateTask() {
  await persistConfig();
}

async function addTaskTag(task: NpcTask) {
  const input = (newTaskTags.value[task.id] ?? "").trim();
  if (!input) return;
  for (const part of input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)) {
    if (!task.tags.includes(part)) task.tags.push(part);
  }
  newTaskTags.value[task.id] = "";
  await store.ensureTag(task.tags[task.tags.length - 1]);
  await updateTask();
}

async function removeTaskTag(task: NpcTask, tag: string) {
  task.tags = task.tags.filter((item) => item !== tag);
  await updateTask();
}

async function toggleTaskAssignment(taskId: string) {
  if (!selectedRole.value) return;
  const ids = selectedRole.value.taskIds;
  const index = ids.indexOf(taskId);
  if (index >= 0) ids.splice(index, 1);
  else ids.push(taskId);
  await updateRole();
}

async function commitRoleColor(value: string | undefined) {
  if (!selectedRole.value) return;
  selectedRole.value.color = value ?? "#cccccc";
  await updateRole();
}

async function addTag() {
  const tag = newTag.value.trim();
  if (!tag) return;
  await store.addTag(tag);
  newTag.value = "";
}

async function removeTag(tag: string) {
  if (
    !(await confirm({
      title: "Delete tag",
      message: `Delete "${tag}"? Existing role and asset assignments will remain as orphan references and show warnings.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      danger: true,
    }))
  )
    return;
  try {
    const deleted = await store.removeTag(tag);
    if (deleted) toast.success(`Tag "${tag}" deleted`);
    else toast.error("Failed to delete tag - changes not saved");
  } catch {
    toast.error("Failed to delete tag - changes not saved");
  }
}

async function addRoleTag(kind: "focus" | "restricted", tag?: string) {
  if (!selectedRole.value) return;
  const input = kind === "focus" ? newFocusTag : newRestrictedTag;
  const value = (tag ?? input.value).trim();
  if (!value) return;
  const target = kind === "focus" ? selectedRole.value.focusTags : selectedRole.value.restrictedTags;
  if (!target.includes(value)) target.push(value);
  await store.ensureTag(value);
  if (!tag) input.value = "";
  await persistConfig();
}

async function removeRoleTag(kind: "focus" | "restricted", tag: string) {
  if (!selectedRole.value) return;
  if (kind === "focus") selectedRole.value.focusTags = selectedRole.value.focusTags.filter((item) => item !== tag);
  else selectedRole.value.restrictedTags = selectedRole.value.restrictedTags.filter((item) => item !== tag);
  await persistConfig();
}

function triggerRate(tag: string): number {
  return draft.value.tagTriggerRates?.[tag] ?? 0;
}

function setTriggerRate(tag: string, rate: number) {
  const safeRate = Math.max(0, Math.min(100, Math.floor(rate || 0)));
  if (!draft.value.tagTriggerRates) draft.value.tagTriggerRates = {};
  if (safeRate === 0) delete draft.value.tagTriggerRates[tag];
  else draft.value.tagTriggerRates[tag] = safeRate;
  queuePersist();
}

function onClose() {
  flushRatePersist();
  void persistConfig(true).then(() => emit("close"));
}

onUnmounted(() => {
  flushRatePersist();
  if (saveStateTimer) window.clearTimeout(saveStateTimer);
});
</script>

<template>
  <ModalShell :open="open" title="NPC Manager" max-width="1200px" width="min(90vw, 1200px)" height="90vh" max-height="90vh" @close="onClose">
    <div class="modal__body npc__body">
      <div class="npc__viewswitch">
        <button type="button" class="npc__switchbtn" :class="{ 'flag--active': view === 'roles' }" :aria-pressed="view === 'roles'" @click="view = 'roles'">Role Editor ({{ roles.length }})</button>
        <button type="button" class="npc__switchbtn" :class="{ 'flag--active': view === 'library' }" :aria-pressed="view === 'library'" @click="view = 'library'">Tags &amp; Tasks ({{ tags.length }} / {{ draft.tasks.length }})</button>
      </div>

      <div v-if="view === 'roles'" class="npc__main npc__editor">
        <aside class="npc__sidebar">
          <h3 class="form__title">Roles</h3>
          <div class="form__col form__col--tight npc__scrolllist">
            <div v-for="role in roles" :key="role.id" class="card__item npc__role" :class="{ 'npc__role--active': selectedRoleId === role.id }" role="button" tabindex="0" @click="selectedRoleId = role.id" @keydown.self.enter.prevent="selectedRoleId = role.id" @keydown.self.space.prevent="selectedRoleId = role.id">
              <span class="swatch swatch--round" :style="{ background: role.color }" />
              <span class="npc__text"
                ><strong class="npc__label">{{ role.label }}</strong
                ><small class="npc__sub"><span v-if="role.id === draft.defaultRoleId" class="npc__subbadge">Default</span>{{ roleSummary(role) }}</small></span
              >
              <button v-if="role.id !== draft.defaultRoleId" type="button" class="flag--ghost" title="Set as default role" aria-label="Set as default role" @click.stop="setDefaultRole(role)">Default</button>
              <button v-if="role.id !== draft.defaultRoleId" type="button" class="flag--danger flag--icon" @click.stop="deleteRole(role)" aria-label="Delete role">x</button>
            </div>
            <div v-if="!roles.length" class="empty npc__empty">No roles yet - click "+ Add Role"</div>
          </div>
          <button type="button" class="flag--active" :disabled="pending" @click="addRole">+ Add Role</button>
        </aside>

        <section v-if="selectedRole" class="npc__detailpane">
          <h3 class="form__title">Editing: {{ selectedRole.label }}</h3>
          <div class="npc__sections">
            <div class="npc__section">
              <h4 class="form__subtitle">Basics</h4>
              <div class="form__row">
                <label class="label--fixed" :for="`npc-role-label-${selectedRole.id}`">Label</label>
                <input :id="`npc-role-label-${selectedRole.id}`" v-model="selectedRole.label" type="text" @change="updateRole" />
              </div>
              <div class="form__row">
                <label class="label--fixed" :for="`npc-role-color-${selectedRole.id}`">Color</label>
                <ColorInput :model-value="selectedRole.color" @commit="commitRoleColor" placeholder="#RRGGBB" aria-label="Role color" />
              </div>
              <div class="form__row">
                <label class="label--fixed" :for="`npc-role-chance-${selectedRole.id}`">Focus Chance</label>
                <input :id="`npc-role-chance-${selectedRole.id}`" v-model.number="selectedRole.focusChance" type="range" min="0" max="100" @change="updateRole" />
                <span class="form__hint npc__rate">{{ selectedRole.focusChance }}%</span>
              </div>
            </div>

            <div class="npc__section">
              <h4 class="form__subtitle">Focus Tags</h4>
              <p class="npc__hinttext">Where this NPC prefers to go. Empty = wanders anywhere.</p>
              <div class="form__row form__row--tight form__row--wrap">
                <TagChip v-for="tag in selectedRole.focusTags" :key="`focus-${tag}`" :label="tag" variant="focus" removable :class="{ 'flag--warning': !managedTagSet.has(tag) }" @remove="removeRoleTag('focus', tag)" />
                <span v-if="!selectedRole.focusTags.length" class="empty npc__empty">None - NPC wanders</span>
              </div>
              <div class="form__row">
                <input v-model="newFocusTag" type="text" placeholder="tag name" @keydown.enter="addRoleTag('focus')" />
                <button type="button" @click="addRoleTag('focus')">Add</button>
              </div>
              <div v-if="availableFocusTags.length" class="npc__suggest">
                <button v-for="tag in availableFocusTags.slice(0, 8)" :key="`fsug-${tag}`" type="button" class="npc__suggestion" @click="addRoleTag('focus', tag)">+ {{ tag }}</button>
              </div>
            </div>

            <div class="npc__section">
              <h4 class="form__subtitle">Restricted Tags</h4>
              <p class="npc__hinttext">Places this NPC avoids.</p>
              <div class="form__row form__row--tight form__row--wrap">
                <TagChip v-for="tag in selectedRole.restrictedTags" :key="`restricted-${tag}`" :label="tag" variant="restricted" removable :class="{ 'flag--warning': !managedTagSet.has(tag) }" @remove="removeRoleTag('restricted', tag)" />
                <span v-if="!selectedRole.restrictedTags.length" class="empty npc__empty">No restrictions</span>
              </div>
              <div class="form__row">
                <input v-model="newRestrictedTag" type="text" placeholder="tag name" @keydown.enter="addRoleTag('restricted')" />
                <button type="button" @click="addRoleTag('restricted')">Add</button>
              </div>
              <div v-if="availableRestrictedTags.length" class="npc__suggest">
                <button v-for="tag in availableRestrictedTags.slice(0, 8)" :key="`rsug-${tag}`" type="button" class="npc__suggestion" @click="addRoleTag('restricted', tag)">+ {{ tag }}</button>
              </div>
            </div>

            <div class="npc__section">
              <h4 class="form__subtitle">Assigned Tasks</h4>
              <input v-model="taskFilter" type="search" placeholder="Search tasks..." />
              <div class="form__col form__col--tight npc__scrollbox">
                <label v-for="task in filteredAssignTasks" :key="task.id" class="card__item npc__pickrow">
                  <input type="checkbox" :checked="selectedRole.taskIds.includes(task.id)" :aria-label="`Assign task ${task.label}`" @change="toggleTaskAssignment(task.id)" />
                  <span class="npc__tagname">{{ task.label }}</span>
                  <small class="npc__picktags">{{ task.tags.join(", ") }}</small>
                </label>
                <div v-if="!filteredAssignTasks.length" class="empty npc__empty">{{ draft.tasks.length ? "No matching tasks" : "No tasks yet - create them under Tags & Tasks" }}</div>
              </div>
            </div>

            <div class="npc__section npc__section--wide">
              <div class="form__row form__row--between npc__rateshead">
                <h4 class="form__subtitle">Tag Trigger Rates</h4>
                <button type="button" class="flag--ghost flag--icon" :aria-expanded="ratesExpanded" @click="ratesExpanded = !ratesExpanded">{{ ratesExpanded ? "Hide" : "Show" }}</button>
              </div>
              <template v-if="ratesExpanded">
                <div class="form__row form__row--tight">
                  <input v-model="rateSearch" type="search" placeholder="Search tags..." />
                  <label class="npc__scope"><input v-model="rateScopeAll" type="checkbox" /> All tags</label>
                </div>
                <div v-for="tag in rateRows" :key="`rate-${tag}`" class="form__row">
                  <label class="npc__tagname" :for="`npc-rate-${tag}`">{{ tag }}</label>
                  <input :id="`npc-rate-${tag}`" class="npc__rate" type="number" min="0" max="100" step="1" :value="triggerRate(tag)" @change="setTriggerRate(tag, +($event.target as HTMLInputElement).value)" />
                  <span class="form__hint">%/min</span>
                </div>
                <div v-if="!rateRows.length" class="empty npc__empty">No tags match</div>
              </template>
              <div v-else class="empty npc__empty">{{ roleRateCount }} configured for this role / {{ configuredRateCount }} total</div>
            </div>
          </div>
        </section>
        <section v-else class="npc__detailpane npc__centerpane">
          <div class="empty npc__empty">Select a role on the left to edit it</div>
        </section>
      </div>

      <div v-else class="npc__main npc__library">
        <section class="npc__panel">
          <h3 class="form__title">Tags</h3>
          <input v-model="tagSearch" type="search" placeholder="Search tags..." />
          <div class="form__row form__row--tight npc__add">
            <input v-model="newTag" type="text" placeholder="New tag" @keydown.enter="addTag" />
            <button type="button" class="flag--active" @click="addTag">Add</button>
          </div>
          <div class="form__col form__col--tight npc__scrolllist">
            <div v-for="tag in filteredTags" :key="tag" class="card__item">
              <span class="npc__tagname">{{ tag }}</span>
              <button type="button" class="flag--danger flag--icon" @click="removeTag(tag)" aria-label="Delete tag">x</button>
            </div>
            <div v-if="!filteredTags.length" class="empty npc__empty">No tags</div>
          </div>
        </section>

        <section class="npc__panel">
          <h3 class="form__title">Tasks</h3>
          <input v-model="libTaskFilter" type="search" placeholder="Search tasks..." />
          <div class="form__col form__col--tight npc__scrolllist">
            <div v-for="task in filteredLibTasks" :key="task.id" class="npc__taskcard">
              <div class="form__row form__row--tight">
                <input v-model="task.label" type="text" aria-label="Task label" @change="updateTask" />
                <button type="button" class="flag--danger flag--icon" @click="deleteTask(task.id)" aria-label="Delete task">x</button>
              </div>
              <div class="form__row form__row--tight form__row--wrap">
                <TagChip v-for="tag in task.tags" :key="`${task.id}-${tag}`" :label="tag" removable :class="{ 'flag--warning': !managedTagSet.has(tag) }" @remove="removeTaskTag(task, tag)" />
                <span v-if="!task.tags.length" class="empty npc__empty">No tags</span>
              </div>
              <div class="form__row form__row--tight">
                <input :value="newTaskTags[task.id] ?? ''" type="text" placeholder="add tag" aria-label="Add task tag" @keydown.enter.prevent="addTaskTag(task)" @change="addTaskTag(task)" />
                <small class="npc__usagenote">used by {{ taskUsage(task.id) }} role(s)</small>
              </div>
            </div>
            <div v-if="!filteredLibTasks.length" class="empty npc__empty">No tasks yet - click "+ Add Task"</div>
          </div>
          <button type="button" class="flag--active" :disabled="pending" @click="addTask">+ Add Task</button>
        </section>
      </div>

      <div class="npc__status" aria-live="polite">
        <span v-if="statusText" :class="invalidRole || missingDefault || saveState === 'unsaved' ? 'npc__unsaved' : 'npc__saved'">{{ statusText }}</span>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.npc__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
  gap: 0;
  overflow: hidden;
}

.npc__body button {
  white-space: nowrap;
}
.npc__viewswitch .npc__switchbtn,
.npc__sidebar button,
.npc__panel button,
.npc__role .flag--icon {
  flex-shrink: 0;
}

.npc__viewswitch {
  display: flex;
  gap: var(--gap-xs);
  padding: var(--gap-sm) var(--gap-md);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}
.npc__switchbtn {
  background: transparent;
}
.npc__main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.npc__editor {
  display: grid;
  grid-template-columns: minmax(200px, 0.7fr) minmax(0, 2fr);
}
.npc__sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  padding: var(--gap-md);
  border-right: 1px solid var(--border-dim);
}
.npc__scrolllist {
  flex: 1;
  overflow-y: auto;
}
.npc__role--active {
  background: var(--bg-primary);
  border-color: var(--accent-blue);
}
.npc__text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}
.npc__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.npc__sub {
  color: var(--text-dim);
  font-size: var(--font-xs);
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  overflow: hidden;
  white-space: nowrap;
}
.npc__subbadge {
  border: 1px solid var(--accent-green);
  color: var(--accent-green);
  font-size: var(--font-xs);
  line-height: 1;
  padding: 1px var(--gap-xs);
  flex-shrink: 0;
}

.npc__detailpane {
  overflow-y: auto;
  padding: var(--gap-md);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}
.npc__centerpane {
  align-items: center;
  justify-content: center;
}
.npc__sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--gap-md);
  align-items: start;
}
.npc__section {
  border: 1px solid var(--border-dim);
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
}
.npc__section--wide {
  grid-column: 1 / -1;
}
.npc__hinttext {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-xs);
  opacity: 0.8;
}
.npc__suggest {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}
.npc__suggestion {
  background: transparent;
  border: 1px dashed var(--border-dim);
  color: var(--text-secondary);
  font-size: var(--font-xs);
  padding: 2px var(--gap-sm);
  cursor: pointer;
}
.npc__suggestion:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}
.npc__scrollbox {
  max-height: 200px;
  overflow-y: auto;
  flex: 0 0 auto;
  padding-right: var(--gap-xs);
}
.npc__pickrow {
  cursor: pointer;
  align-items: center;
  flex-shrink: 0;
}
.npc__picktags {
  color: var(--text-dim);
  font-size: var(--font-xs);
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.npc__rateshead {
  align-items: center;
}
.npc__scope {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  white-space: nowrap;
  font-size: var(--font-xs);
  cursor: pointer;
}
.npc__rate {
  width: 50px;
  flex: 0 0 50px;
}
.npc__tagname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.npc__empty {
  color: var(--text-secondary);
  font-size: var(--font-xs);
  opacity: 0.7;
  padding: var(--gap-xs) 0;
}

.npc__library {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
}
.npc__panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  padding: var(--gap-md);
  overflow: hidden;
}
.npc__panel:first-child {
  border-right: 1px solid var(--border-dim);
}
.npc__add {
  flex-shrink: 0;
}
.npc__taskcard {
  border: 1px solid var(--border-dim);
  padding: var(--gap-sm);
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex-shrink: 0;
}
.npc__usagenote {
  color: var(--text-dim);
  font-size: var(--font-xs);
  white-space: nowrap;
  align-self: center;
}

.npc__status {
  min-height: 24px;
  border-top: 1px solid var(--border-dim);
  padding: var(--gap-xs) var(--gap-md);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.npc__saved,
.npc__unsaved {
  font-size: var(--font-xs);
  text-transform: none;
  letter-spacing: 0;
}
.npc__saved {
  color: var(--accent-green);
}
.npc__unsaved {
  color: var(--accent-gold);
}

@media (max-width: 900px) {
  .npc__editor {
    grid-template-columns: 1fr;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .npc__sidebar {
    max-height: 240px;
    border-right: 0;
    border-bottom: 1px solid var(--border-dim);
  }
  .npc__detailpane {
    overflow: visible;
  }
  .npc__library {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .npc__panel:first-child {
    border-right: 0;
    border-bottom: 1px solid var(--border-dim);
  }
}
</style>
