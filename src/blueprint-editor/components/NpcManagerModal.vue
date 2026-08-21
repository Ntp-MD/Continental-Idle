<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useConfirm } from "@/composables/useConfirm";
import { useToast } from "@/composables/useToast";
import { isHexColor, normalizeNpcConfig } from "../types";
import { managedTagSet } from "../store/tags";
import { genId } from "../store/utils";
import { sanitizeString } from "../../utils/sanitize";
import type { NpcRole, NpcSimulationConfig } from "../types";
import ModalShell from "./ModalShell.vue";
import ColorInput from "./ColorInput.vue";
import TagChip from "./TagChip.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const confirm = useConfirm().confirm;
const toast = useToast();
const selectedRoleId = ref("");
const tagSearch = ref("");
const newTag = ref("");
const newFocusTag = ref("");
const newRestrictedTag = ref("");
const pending = ref(false);
const saveState = ref<"" | "saved" | "unsaved">("");
let saveStateTimer: number | null = null;

function markSaved() {
  saveState.value = "saved";
  if (saveStateTimer) window.clearTimeout(saveStateTimer);
  saveStateTimer = window.setTimeout(() => (saveState.value = ""), 1500);
}

const draft = ref<NpcSimulationConfig>({ speed: 0.2, defaultRoleId: "", roles: [], tasks: [], pool: [] });
const config = computed(() => draft.value);
const roles = computed(() => config.value.roles);
const tags = computed(() => store.globalTags.value);
const filteredTags = computed(() => {
  const query = tagSearch.value.trim().toLowerCase();
  return query ? tags.value.filter((tag) => tag.includes(query)) : tags.value;
});
const selectedRole = computed<NpcRole | undefined>(() => roles.value.find((role) => role.id === selectedRoleId.value));
const availableFocusTags = computed(() => tags.value.filter((tag) => !selectedRole.value?.focusTags.includes(tag)));
const availableRestrictedTags = computed(() => tags.value.filter((tag) => !selectedRole.value?.restrictedTags.includes(tag)));

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
  const normalized = normalizeConfig(config.value);
  if (!isPersistable(normalized)) {
    saveState.value = "unsaved";
    if (showToast) toast.warning("Cannot save — every role needs a label and valid color");
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

function resetSelection() {
  selectedRoleId.value = config.value.roles[0]?.id ?? "";
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      draft.value = cloneConfig(store.state.layout.npcConfig ?? { speed: 0.2, defaultRoleId: "", roles: [], tasks: [], pool: [] });
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
  config.value.roles.push({
    id,
    label: "New Role",
    color: randomColor(),
    focusTags: [],
    restrictedTags: [],
    taskIds: [],
    focusChance: 100,
    spawnRule: { targetTags: [], count: 0 },
  });
  if (!config.value.defaultRoleId) config.value.defaultRoleId = id;
  selectedRoleId.value = id;
  await persistConfig();
}

async function deleteRole(role: NpcRole) {
  if (role.id === config.value.defaultRoleId) {
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
  config.value.roles = config.value.roles.filter((item) => item.id !== role.id);
  config.value.pool = config.value.pool.filter((entry) => entry.roleId !== role.id);
  if (selectedRoleId.value === role.id) resetSelection();
  const ok = await persistConfig();
  if (ok) toast.success(`Role "${role.label}" deleted`);
  else toast.error("Failed to delete role — changes not saved");
}

async function setDefaultRole(role: NpcRole) {
  config.value.defaultRoleId = role.id;
  await persistConfig();
}

async function updateRole() {
  await persistConfig();
}

async function addTask() {
  config.value.tasks.push({ id: genId("task"), label: "New Task", tags: [] });
  await persistConfig();
}

async function deleteTask(taskId: string) {
  const task = config.value.tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (!(await confirm({ title: "Delete task", message: `Delete task "${task.label}"?`, confirmLabel: "Delete", cancelLabel: "Cancel", danger: true }))) return;
  config.value.tasks = config.value.tasks.filter((item) => item.id !== taskId);
  for (const role of config.value.roles) role.taskIds = role.taskIds.filter((id) => id !== taskId);
  await persistConfig();
}

async function updateTask() {
  await persistConfig();
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
    else toast.error("Failed to delete tag — changes not saved");
  } catch {
    toast.error("Failed to delete tag — changes not saved");
  }
}

async function addRoleTag(kind: "focus" | "restricted") {
  if (!selectedRole.value) return;
  const input = kind === "focus" ? newFocusTag : newRestrictedTag;
  const tag = input.value.trim();
  if (!tag) return;
  const target = kind === "focus" ? selectedRole.value.focusTags : selectedRole.value.restrictedTags;
  if (!target.includes(tag)) target.push(tag);
  await store.ensureTag(tag);
  input.value = "";
  await persistConfig();
}

async function removeRoleTag(kind: "focus" | "restricted", tag: string) {
  if (!selectedRole.value) return;
  if (kind === "focus") selectedRole.value.focusTags = selectedRole.value.focusTags.filter((item) => item !== tag);
  else selectedRole.value.restrictedTags = selectedRole.value.restrictedTags.filter((item) => item !== tag);
  await persistConfig();
}

function triggerRate(tag: string): number {
  return config.value.tagTriggerRates?.[tag] ?? 0;
}

async function setTriggerRate(tag: string, rate: number) {
  const safeRate = Math.max(0, Math.min(100, Math.floor(rate || 0)));
  if (!config.value.tagTriggerRates) config.value.tagTriggerRates = {};
  if (safeRate === 0) delete config.value.tagTriggerRates[tag];
  else config.value.tagTriggerRates[tag] = safeRate;
  await persistConfig();
}

function onClose() {
  void persistConfig(true).then(() => emit("close"));
}

onUnmounted(() => {
  if (saveStateTimer) window.clearTimeout(saveStateTimer);
});
</script>

<template>
  <ModalShell :open="open" title="NPC Manager" max-width="1200px" width="min(90vw, 1200px)" height="90vh" max-height="90vh" @close="onClose">
    <div class="modal__body npc__body">
      <section class="form__group npc__column">
        <h3 class="form__title">Roles</h3>
        <div class="form__col form__col--tight form__col--scroll">
          <div v-for="role in roles" :key="role.id" class="card--item npc__role" :class="{ 'npc__role--active': selectedRoleId === role.id }" role="button" tabindex="0" @click="selectedRoleId = role.id" @keydown.enter="selectedRoleId = role.id">
            <span class="swatch swatch--round" :style="{ background: role.color }" />
            <span class="npc__text"
              ><strong class="npc__label">{{ role.label }}</strong
              ><small class="npc__sub">{{ role.id === config.defaultRoleId ? "Default role" : "" }}</small></span
            >
            <button type="button" class="flag--ghost flag--icon" :class="{ 'flag--warning': role.id === config.defaultRoleId }" :title="role.id === config.defaultRoleId ? 'Default role' : 'Set as default role'" @click.stop="setDefaultRole(role)">★</button>
            <button v-if="role.id !== config.defaultRoleId" type="button" class="flag--danger flag--icon" @click.stop="deleteRole(role)" aria-label="Delete role">×</button>
          </div>
          <div v-if="!roles.length" class="empty npc__empty">No roles</div>
        </div>
        <button type="button" class="flag--active" :disabled="pending" @click="addRole">+ Add Role</button>
      </section>

      <section class="form__group npc__column">
        <h3 class="form__title">Tags</h3>
        <input v-model="tagSearch" type="search" placeholder="Search tags..." />
        <div class="form__row form__row--tight npc__add">
          <input v-model="newTag" class="input--grow" type="text" placeholder="New tag" @keydown.enter="addTag" />
          <button type="button" class="flag--active" @click="addTag">Add</button>
        </div>
        <div class="form__col form__col--tight form__col--scroll">
          <div v-for="tag in filteredTags" :key="tag" class="card--item">
            <input class="input--disabled input--grow" :value="tag" readonly aria-label="Tag name" />
            <button type="button" class="flag--danger flag--icon" @click="removeTag(tag)" aria-label="Delete tag">×</button>
          </div>
          <div v-if="!filteredTags.length" class="empty npc__empty">No tags</div>
        </div>
        <h3 class="form__title">Tasks</h3>
        <div class="form__col form__col--tight form__col--scroll">
          <div v-for="task in config.tasks" :key="task.id" class="form__row form__row--tight npc__task">
            <input v-model="task.label" class="input--grow" type="text" aria-label="Task label" @change="updateTask" />
            <input
              class="input--grow"
              :value="task.tags.join(', ')"
              type="text"
              aria-label="Task tags"
              placeholder="tags"
              @change="
                task.tags = ($event.target as HTMLInputElement).value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean);
                updateTask();
              "
            />
            <button type="button" class="flag--danger flag--icon" @click="deleteTask(task.id)" aria-label="Delete task">×</button>
          </div>
          <div v-if="!config.tasks.length" class="empty npc__empty">No tasks</div>
        </div>
        <button type="button" class="flag--active" :disabled="pending" @click="addTask">+ Add Task</button>
      </section>

      <section class="form__group npc__column npc__detail">
        <h3 class="form__title">Role Detail <span v-if="saveState === 'saved'" class="npc__saved" aria-live="polite">✓ Saved</span><span v-else-if="saveState === 'unsaved'" class="npc__unsaved" aria-live="polite">⚠ Not saved — check label and color</span></h3>
        <template v-if="selectedRole">
          <div class="form__row">
            <label class="label--fixed" :for="`npc-role-label-${selectedRole.id}`">Label</label>
            <input :id="`npc-role-label-${selectedRole.id}`" v-model="selectedRole.label" type="text" @change="updateRole" />
          </div>
          <div class="form__row">
            <label class="label--fixed" :for="`npc-role-color-${selectedRole.id}`">Color</label>
            <ColorInput :model-value="selectedRole.color" @commit="commitRoleColor" placeholder="#RRGGBB" aria-label="Role color" />
          </div>

          <h4 class="form__subtitle">Focus Tags</h4>
          <div class="form__row form__row--tight form__row--wrap">
            <TagChip v-for="tag in selectedRole.focusTags" :key="`focus-${tag}`" :label="tag" variant="focus" removable :class="{ 'flag--warning': !managedTagSet.has(tag) }" @remove="removeRoleTag('focus', tag)" />
            <span v-if="!selectedRole.focusTags.length" class="empty npc__empty">No focus tags — NPC wanders</span>
          </div>
          <div class="form__row">
            <input v-model="newFocusTag" type="text" placeholder="tag name" @keydown.enter="addRoleTag('focus')" />
            <select v-if="availableFocusTags.length" v-model="newFocusTag">
              <option value="">or pick…</option>
              <option v-for="tag in availableFocusTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <button type="button" @click="addRoleTag('focus')">Add</button>
          </div>

          <h4 class="form__subtitle">Restricted Tags</h4>
          <div class="form__row form__row--tight form__row--wrap">
            <TagChip v-for="tag in selectedRole.restrictedTags" :key="`restricted-${tag}`" :label="tag" variant="restricted" removable :class="{ 'flag--warning': !managedTagSet.has(tag) }" @remove="removeRoleTag('restricted', tag)" />
            <span v-if="!selectedRole.restrictedTags.length" class="empty npc__empty">No restrictions</span>
          </div>
          <div class="form__row">
            <input v-model="newRestrictedTag" type="text" placeholder="tag name" @keydown.enter="addRoleTag('restricted')" />
            <select v-if="availableRestrictedTags.length" v-model="newRestrictedTag">
              <option value="">or pick…</option>
              <option v-for="tag in availableRestrictedTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <button type="button" @click="addRoleTag('restricted')">Add</button>
          </div>

          <div class="form__row">
            <label class="label--fixed" :for="`npc-role-chance-${selectedRole.id}`">Focus Chance</label>
            <input :id="`npc-role-chance-${selectedRole.id}`" v-model.number="selectedRole.focusChance" class="input--grow" type="range" min="0" max="100" @change="updateRole" />
            <input class="input--disabled input--num" :value="`${selectedRole.focusChance}%`" readonly aria-label="Focus chance value" />
          </div>

          <h4 class="form__subtitle">Tag Trigger Rates</h4>
          <div v-for="tag in tags" :key="`rate-${tag}`" class="form__row">
            <label class="npc__tagname" :for="`npc-rate-${tag}`">{{ tag }}</label>
            <input :id="`npc-rate-${tag}`" class="npc__rate" type="number" min="0" max="100" step="1" :value="triggerRate(tag)" @change="setTriggerRate(tag, +($event.target as HTMLInputElement).value)" />
            <span class="form__hint">%/min</span>
          </div>
          <div v-if="!tags.length" class="empty npc__empty">Add tags to configure trigger rates</div>
        </template>
        <div v-else class="empty npc__empty">Select a role to edit</div>
      </section>
    </div>
  </ModalShell>
</template>

<style scoped>
.npc__body {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(180px, 0.8fr) minmax(360px, 1.6fr);
  flex: 1;
  padding: 0;
  gap: 0;
  overflow: hidden;
}

.npc__column {
  min-width: 0;
  padding: var(--gap-md);
  border-right: 1px solid var(--border-dim);
}

.npc__column:last-child {
  border-right: 0;
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
}
.npc__tagname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.npc__task {
  flex-shrink: 0;
}

.npc__add {
  flex-shrink: 0;
}
.npc__detail {
  overflow-y: auto;
}
.npc__rate {
  width: 50px;
  flex: 0 0 50px;
}
.npc__empty {
  color: var(--text-secondary);
  font-size: var(--font-xs);
  opacity: 0.7;
  padding: var(--gap-xs) 0;
}

.npc__saved {
  color: var(--accent-green);
  font-size: var(--font-xs);
  text-transform: none;
  letter-spacing: 0;
}

.npc__unsaved {
  color: var(--accent-gold);
  font-size: var(--font-xs);
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 900px) {
  .npc__body {
    grid-template-columns: 1fr 1fr;
    overflow-y: auto;
  }
  .npc__detail {
    grid-column: 1 / -1;
    border-top: 1px solid var(--border-dim);
    border-right: 0;
  }
}
</style>
