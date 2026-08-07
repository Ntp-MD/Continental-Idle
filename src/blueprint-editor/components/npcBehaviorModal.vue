<script setup lang="ts">
import { ref, watch, inject, computed, onUnmounted } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useNpcSimulation } from "../composables/useNpcSimulation";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useFocusTrap } from "../../composables/useFocusTrap";
import { sanitizeString } from "../../utils/sanitize";
import { currentFloor, isHexColor, state } from "../store/state";
import { genId } from "../store/utils";
import type { NpcSimulationConfig, NpcRole, NpcTask, NpcSpawnRule } from "../types";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;
const pending = ref(false);

const isOpen = computed(() => props.open);
const containerRef = ref<HTMLElement>();
useFocusTrap(isOpen, containerRef);

const npcSimulation = inject("npcSimulation") as ReturnType<typeof useNpcSimulation>;

const draft = ref<NpcSimulationConfig>(cloneConfig(npcSimulation.config.value));
const selectedRoleId = ref("");
const selectedTaskId = ref("");
const activeTab = ref<"roles" | "tags" | "tasks" | "spawn">("roles");
let lastPersistedConfig = JSON.stringify(draft.value);

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDraft(): NpcSimulationConfig {
  const config = cloneConfig(draft.value);
  config.tasks = (config.tasks ?? []).map((task) => ({
    ...task,
    label: task.label.trim(),
    tags: Array.from(new Set(task.tags.map((tag) => tag.trim()).filter(Boolean))),
  }));
  config.roles = config.roles.map((role) => ({
    ...role,
    label: sanitizeString(role.label),
    focusTags: Array.from(new Set(role.focusTags.map((t) => t.trim()).filter(Boolean))),
    restrictedTags: Array.from(new Set(role.restrictedTags.map((t) => t.trim()).filter(Boolean))),
    taskIds: Array.from(new Set(role.taskIds)),
    focusChance: Math.max(0, Math.min(100, Math.floor(role.focusChance ?? 100))),
    spawnRule: role.spawnRule
      ? {
          floorLabels: Array.from(new Set((role.spawnRule.floorLabels ?? []).map((s) => s.trim()).filter(Boolean))),
          roomTags: Array.from(new Set((role.spawnRule.roomTags ?? []).map((s) => s.trim()).filter(Boolean))),
          count: Math.max(0, Math.floor(role.spawnRule.count ?? 0)),
          speedMultiplier: role.spawnRule.speedMultiplier ?? 1,
        }
      : undefined,
  }));
  const rates = config.tagTriggerRates ?? {};
  const cleaned: Record<string, number> = {};
  for (const [tag, rate] of Object.entries(rates)) {
    const clamped = Math.max(0, Math.min(100, Math.floor(rate)));
    if (clamped > 0) cleaned[tag.trim()] = clamped;
  }
  config.tagTriggerRates = Object.keys(cleaned).length > 0 ? cleaned : undefined;
  return config;
}

function isPersistableConfig(config: NpcSimulationConfig): boolean {
  if (config.tasks.some((task) => !task.label)) return false;
  if (config.roles.some((role) => !role.label || !isColor(role.color))) return false;
  if (!config.roles.some((role) => role.id === config.defaultRoleId)) return false;
  return !config.roles.some((role) => role.focusChance < 0 || role.focusChance > 100);
}

async function persistDraftToDisk(showToast = false): Promise<boolean> {
  const config = normalizeDraft();
  if (!isPersistableConfig(config)) {
    if (showToast) toast.warning("Cannot save — config has missing label, invalid color, or no default role");
    return false;
  }
  const serialized = JSON.stringify(config);
  if (serialized === lastPersistedConfig) return true;
  pending.value = true;
  try {
    const allTags = [...config.tasks.flatMap((t) => t.tags), ...config.roles.flatMap((r) => [...r.focusTags, ...r.restrictedTags])];
    if (allTags.length > 0) await store.ensureTags(allTags);
    store.syncNpcConfigToState(config);
    await store.persistNpcConfigToDisk();
    lastPersistedConfig = serialized;
    if (showToast) toast.success("NPC settings saved");
    return true;
  } catch {
    toast.error("Failed to save NPC settings");
    return false;
  } finally {
    pending.value = false;
  }
}

function scheduleDraftPersist() {
  if (!props.open) return;
  void persistDraftToDisk();
}

function resetDraft() {
  draft.value = cloneConfig(npcSimulation.config.value);
  draft.value.tasks = draft.value.tasks ?? [];
  for (const role of draft.value.roles) {
    role.focusTags = role.focusTags ?? [];
    role.restrictedTags = role.restrictedTags ?? [];
    role.taskIds = role.taskIds ?? [];
    role.focusChance = role.focusChance ?? 100;
    if (role.spawnRule) {
      role.spawnRule.floorLabels = role.spawnRule.floorLabels ?? [];
      role.spawnRule.roomTags = role.spawnRule.roomTags ?? [];
      role.spawnRule.count = role.spawnRule.count ?? 0;
      role.spawnRule.speedMultiplier = role.spawnRule.speedMultiplier ?? 1;
    }
  }
  selectedRoleId.value = draft.value.roles[0]?.id ?? "";
  selectedTaskId.value = draft.value.tasks[0]?.id ?? "";
  activeTab.value = "roles";
  lastPersistedConfig = JSON.stringify(normalizeDraft());
}

watch(
  () => props.open,
  (open) => {
    if (open) resetDraft();
  },
);

watch(draft, scheduleDraftPersist, { deep: true });

const selectedRole = computed<NpcRole | undefined>(() => draft.value.roles.find((r) => r.id === selectedRoleId.value));
const selectedTask = computed<NpcTask | undefined>(() => draft.value.tasks.find((t) => t.id === selectedTaskId.value));

function randomColor(): string {
  const letters = "89ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * letters.length)];
  return color;
}

function onAddRole() {
  const id = genId("role");
  draft.value.roles.push({
    id,
    label: "New Role",
    color: randomColor(),
    focusTags: [],
    restrictedTags: [],
    taskIds: [],
    focusChance: 100,
    spawnRule: { floorLabels: [], roomTags: [], count: 0, speedMultiplier: 1 },
  });
  if (!draft.value.defaultRoleId) draft.value.defaultRoleId = id;
  selectedRoleId.value = id;
  void persistDraftToDisk();
}

function canDeleteRole(role: NpcRole): boolean {
  return role.id !== draft.value.defaultRoleId;
}

const newSpawnFloor = ref<Record<string, string>>({});
const newSpawnTag = ref<Record<string, string>>({});

function ensureSpawnRuleFor(role: NpcRole): NpcSpawnRule {
  if (!role.spawnRule) {
    role.spawnRule = { floorLabels: [], roomTags: [], count: 0, speedMultiplier: 1 };
  }
  return role.spawnRule;
}

function onAddSpawnFloorFor(role: NpcRole) {
  const label = (newSpawnFloor.value[role.id] ?? "").trim();
  if (!label) return;
  const rule = ensureSpawnRuleFor(role);
  if (!rule.floorLabels!.includes(label)) rule.floorLabels!.push(label);
  newSpawnFloor.value[role.id] = "";
  void persistDraftToDisk();
}

function onRemoveSpawnFloorFrom(role: NpcRole, label: string) {
  if (!role.spawnRule?.floorLabels) return;
  role.spawnRule.floorLabels = role.spawnRule.floorLabels.filter((f) => f !== label);
  void persistDraftToDisk();
}

function onAddSpawnTagFor(role: NpcRole) {
  const tag = (newSpawnTag.value[role.id] ?? "").trim();
  if (!tag) return;
  const rule = ensureSpawnRuleFor(role);
  if (!rule.roomTags!.includes(tag)) {
    rule.roomTags!.push(tag);
    void store.ensureTag(tag);
  }
  newSpawnTag.value[role.id] = "";
  void persistDraftToDisk();
}

function onRemoveSpawnTagFrom(role: NpcRole, tag: string) {
  if (!role.spawnRule?.roomTags) return;
  role.spawnRule.roomTags = role.spawnRule.roomTags.filter((t) => t !== tag);
  void persistDraftToDisk();
}

const floorLabels = computed(() => state.layout.floors.map((f) => f.label));

async function onDeleteRole(role: NpcRole) {
  if (role.id === draft.value.defaultRoleId) {
    toast.warning("Default role cannot be deleted");
    return;
  }
  const confirmed = await confirm({
    title: "Delete role",
    message: `Delete role "${role.label}"? Its deployment count and behavior settings will also be removed.`,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  draft.value.roles = draft.value.roles.filter((r) => r.id !== role.id);
  draft.value.pool = draft.value.pool.filter((p) => p.roleId !== role.id);
  if (selectedRoleId.value === role.id) {
    selectedRoleId.value = draft.value.roles[0]?.id ?? "";
  }
  void persistDraftToDisk();
}

const newTaskLabel = ref("");
const newTaskTag = ref("");
const newSelectedTaskTag = ref("");
const newTag = ref("");
const tagSearch = ref("");
const selectedTag = ref("");

const filteredTags = computed(() => {
  const q = tagSearch.value.trim().toLowerCase();
  const tags = store.globalTags.value;
  if (!q) return tags;
  return tags.filter((t) => t.toLowerCase().includes(q));
});

const tagUsage = computed(() => {
  const tag = selectedTag.value;
  if (!tag) return null;
  const roles: { role: NpcRole; type: "focus" | "restricted" }[] = [];
  for (const role of draft.value.roles) {
    if (role.focusTags.includes(tag)) roles.push({ role, type: "focus" });
    if (role.restrictedTags.includes(tag)) roles.push({ role, type: "restricted" });
  }
  const tasks = draft.value.tasks.filter((t) => t.tags.includes(tag));
  return { roles, tasks };
});

async function onAddTag() {
  const t = newTag.value.trim();
  if (!t) return;
  await store.addTag(t);
  newTag.value = "";
}

async function onRemoveTag(tag: string) {
  await store.removeTag(tag);
  if (draft.value.tagTriggerRates && tag in draft.value.tagTriggerRates) {
    delete draft.value.tagTriggerRates[tag];
    void persistDraftToDisk();
  }
}

function tagTriggerRate(tag: string): number {
  return draft.value.tagTriggerRates?.[tag] ?? 0;
}

function setTagTriggerRate(tag: string, rate: number) {
  if (!draft.value.tagTriggerRates) draft.value.tagTriggerRates = {};
  const clamped = Math.max(0, Math.min(100, Math.floor(rate)));
  if (clamped === 0 && tag in draft.value.tagTriggerRates) {
    delete draft.value.tagTriggerRates[tag];
  } else if (clamped > 0) {
    draft.value.tagTriggerRates[tag] = clamped;
  }
  void persistDraftToDisk();
}

function onKeydownTag(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    onAddTag();
  }
}

function onAddTask() {
  const label = newTaskLabel.value.trim();
  const tag = newTaskTag.value.trim();
  if (!label) {
    toast.warning("Task label is required");
    return;
  }
  const id = genId("task");
  const tags = tag ? [tag] : [];
  draft.value.tasks.push({ id, label, tags });
  if (tag) void store.ensureTag(tag);
  newTaskLabel.value = "";
  newTaskTag.value = "";
  selectedTaskId.value = id;
  void persistDraftToDisk();
}

async function onDeleteTask(task: NpcTask) {
  const confirmed = await confirm({
    title: "Delete task",
    message: `Delete task "${task.label}"? Roles using this task preset will lose its tag contribution.`,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  draft.value.tasks = draft.value.tasks.filter((t) => t.id !== task.id);
  for (const role of draft.value.roles) {
    role.taskIds = role.taskIds.filter((id) => id !== task.id);
  }
  if (selectedTaskId.value === task.id) {
    selectedTaskId.value = draft.value.tasks[0]?.id ?? "";
  }
  void persistDraftToDisk();
}

function onAddTaskTag() {
  if (!selectedTask.value) return;
  const tag = newSelectedTaskTag.value.trim();
  if (!tag) return;
  if (selectedTask.value.tags.includes(tag)) return;
  selectedTask.value.tags.push(tag);
  void store.ensureTag(tag);
  newSelectedTaskTag.value = "";
  void persistDraftToDisk();
}

function onRemoveTaskTag(task: NpcTask, index: number) {
  task.tags.splice(index, 1);
  void persistDraftToDisk();
}

const newFocusTag = ref("");
const newRestrictedTag = ref("");

function onAddFocusTag() {
  if (!selectedRole.value || !newFocusTag.value) return;
  const tag = newFocusTag.value.trim();
  if (!tag) return;
  if (!selectedRole.value.focusTags.includes(tag)) {
    selectedRole.value.focusTags.push(tag);
    void store.ensureTag(tag);
    void persistDraftToDisk();
  }
  newFocusTag.value = "";
}

function onRemoveFocusTag(tag: string) {
  if (!selectedRole.value) return;
  selectedRole.value.focusTags = selectedRole.value.focusTags.filter((t) => t !== tag);
  void persistDraftToDisk();
}

function onAddRestrictedTag() {
  if (!selectedRole.value || !newRestrictedTag.value) return;
  const tag = newRestrictedTag.value.trim();
  if (!tag) return;
  if (!selectedRole.value.restrictedTags.includes(tag)) {
    selectedRole.value.restrictedTags.push(tag);
    void store.ensureTag(tag);
    void persistDraftToDisk();
  }
  newRestrictedTag.value = "";
}

function onRemoveRestrictedTag(tag: string) {
  if (!selectedRole.value) return;
  selectedRole.value.restrictedTags = selectedRole.value.restrictedTags.filter((t) => t !== tag);
  void persistDraftToDisk();
}

function toggleRoleTask(taskId: string) {
  if (!selectedRole.value) return;
  const ids = selectedRole.value.taskIds;
  const idx = ids.indexOf(taskId);
  if (idx === -1) ids.push(taskId);
  else ids.splice(idx, 1);
  void persistDraftToDisk();
}

function isRoleTaskSelected(taskId: string): boolean {
  return !!selectedRole.value?.taskIds.includes(taskId);
}

const availableFocusTags = computed(() => {
  const all = store.globalTags.value;
  return all.filter((t) => !selectedRole.value?.focusTags.includes(t));
});

const availableRestrictedTags = computed(() => {
  const all = store.globalTags.value;
  return all.filter((t) => !selectedRole.value?.restrictedTags.includes(t));
});

function taskUsage(taskId: string): { role: NpcRole }[] {
  return draft.value.roles.filter((role) => role.taskIds.includes(taskId)).map((role) => ({ role }));
}

function getPoolCount(roleId: string): number {
  return draft.value.pool.find((p) => p.roleId === roleId)?.count ?? 0;
}

function setPoolCount(roleId: string, count: number) {
  const safe = Math.max(0, Math.min(100, Math.floor(count || 0)));
  const entry = draft.value.pool.find((p) => p.roleId === roleId);
  if (safe === 0) {
    if (entry) {
      draft.value.pool = draft.value.pool.filter((p) => p.roleId !== roleId);
    }
    return;
  }
  if (entry) {
    entry.count = safe;
  } else {
    draft.value.pool.push({ roleId, count: safe });
  }
}

function totalNpcCount(): number {
  return draft.value.pool.reduce((sum, p) => sum + p.count, 0);
}

function isColor(value: string): boolean {
  return isHexColor(value);
}

function onClose() {
  void persistDraftToDisk(true);
  emit("close");
}

onUnmounted(() => {
  void persistDraftToDisk();
});
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
          <button :class="{ npcmodal__tabactive: activeTab === 'roles' }" @click="activeTab = 'roles'">Roles</button>
          <button :class="{ npcmodal__tabactive: activeTab === 'tags' }" @click="activeTab = 'tags'">Tags</button>
          <button :class="{ npcmodal__tabactive: activeTab === 'tasks' }" @click="activeTab = 'tasks'">Tasks</button>
          <button :class="{ npcmodal__tabactive: activeTab === 'spawn' }" @click="activeTab = 'spawn'">Spawn & Settings</button>
        </div>

        <div class="npcmodal__body">
          <!-- Tab: Roles -->
          <div v-if="activeTab === 'roles'" class="npcmodal__tabpanel">
            <div class="npcmodal__split">
              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Roles</div>
                <div class="npcmodal__scroll">
                  <div v-for="role in draft.roles" :key="role.id" class="npcmodal__rolerow" :class="{ npcmodal__rowactive: selectedRoleId === role.id }" role="button" tabindex="0" @click="selectedRoleId = role.id" @keydown.enter="selectedRoleId = role.id">
                    <span class="npcmodal__swatch" :style="{ background: role.color }" />
                    <span class="npcmodal__truncate">
                      <strong>{{ role.label }}</strong>
                      <small>{{ getPoolCount(role.id) }} deployed</small>
                    </span>
                    <button v-if="canDeleteRole(role)" type="button" class="btn__danger btn__icon" @click.stop.prevent="onDeleteRole(role)" aria-label="Delete role">×</button>
                  </div>
                </div>
                <button @click="onAddRole">+ Add Role</button>
              </div>

              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Role Detail</div>
                <div v-if="selectedRole" class="npcmodal__editor">
                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'role__label__' + selectedRole.id">Label</label>
                    <input :id="'role__label__' + selectedRole.id" v-model="selectedRole.label" type="text" class="input" />
                  </div>
                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'role__color__' + selectedRole.id">Color</label>
                    <input :id="'role__color__' + selectedRole.id" v-model="selectedRole.color" type="text" class="input" placeholder="#RRGGBB" aria-label="Role color hex value" />
                  </div>

                  <div class="npcmodal__targets">Focus Tags</div>
                  <div class="npcmodal__taglist">
                    <div v-for="tag in selectedRole.focusTags" :key="'ft_' + tag" class="tag tag__focus">
                      <span>{{ tag }}</span>
                      <button class="tag__remove" @click="onRemoveFocusTag(tag)" aria-label="Remove focus tag">×</button>
                    </div>
                    <div v-if="!selectedRole.focusTags.length" class="npcmodal__empty">No focus tags — NPC wanders</div>
                  </div>
                  <div class="layout__row">
                    <input v-model="newFocusTag" type="text" placeholder="tag name" class="input" @keydown.enter="onAddFocusTag" />
                    <select v-model="newFocusTag" class="input" v-if="availableFocusTags.length">
                      <option value="">or pick…</option>
                      <option v-for="tag in availableFocusTags" :key="tag" :value="tag">{{ tag }}</option>
                    </select>
                    <button @click="onAddFocusTag" :disabled="!newFocusTag">Add</button>
                  </div>

                  <div class="npcmodal__targets">Restricted Tags</div>
                  <div class="npcmodal__taglist">
                    <div v-for="tag in selectedRole.restrictedTags" :key="'rt_' + tag" class="tag tag__restricted">
                      <span>{{ tag }}</span>
                      <button class="tag__remove" @click="onRemoveRestrictedTag(tag)" aria-label="Remove restriction">×</button>
                    </div>
                    <div v-if="!selectedRole.restrictedTags.length" class="npcmodal__empty">No restrictions</div>
                  </div>
                  <div class="layout__row">
                    <input v-model="newRestrictedTag" type="text" placeholder="tag name" class="input" @keydown.enter="onAddRestrictedTag" />
                    <select v-model="newRestrictedTag" class="input" v-if="availableRestrictedTags.length">
                      <option value="">or pick…</option>
                      <option v-for="tag in availableRestrictedTags" :key="tag" :value="tag">{{ tag }}</option>
                    </select>
                    <button @click="onAddRestrictedTag" :disabled="!newRestrictedTag">Add</button>
                  </div>

                  <div class="npcmodal__targets">Task Presets</div>
                  <div class="npcmodal__presets" v-if="draft.tasks.length">
                    <label v-for="task in draft.tasks" :key="'rtpreset_' + task.id" class="npcmodal__taskcheck">
                      <input type="checkbox" :checked="isRoleTaskSelected(task.id)" @change="toggleRoleTask(task.id)" />
                      <span
                        >{{ task.label }} <small>({{ task.tags.join(", ") }})</small></span
                      >
                    </label>
                  </div>
                  <div v-else class="npcmodal__empty">No task presets — create some in the Tasks tab</div>

                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'role__chance__' + selectedRole.id">Focus Chance</label>
                    <input :id="'role__chance__' + selectedRole.id" v-model.number="selectedRole.focusChance" type="range" min="0" max="100" class="npcmodal__grow" />
                    <span class="npcmodal__value">{{ selectedRole.focusChance }}%</span>
                  </div>

                  <div class="npcmodal__targets">Deployment</div>
                  <div class="layout__row">
                    <label class="npcmodal__label">Pool count</label>
                    <div class="layout__wrap">
                      <button class="btn__icon" @click="setPoolCount(selectedRole.id, getPoolCount(selectedRole.id) - 1)">−</button>
                      <input :value="getPoolCount(selectedRole.id)" type="number" min="0" max="100" class="input input__count" @input="setPoolCount(selectedRole.id, Number(($event.target as HTMLInputElement).value))" />
                      <button class="btn__icon" @click="setPoolCount(selectedRole.id, getPoolCount(selectedRole.id) + 1)">+</button>
                    </div>
                  </div>
                </div>
                <div v-else class="npcmodal__empty">Select a role to edit</div>
              </div>
            </div>
          </div>

          <!-- Tab: Tags -->
          <div v-if="activeTab === 'tags'" class="npcmodal__tabpanel">
            <div class="npcmodal__split">
              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Tags</div>
                <div class="npcmodal__scroll">
                  <div v-for="tag in filteredTags" :key="tag" class="npcmodal__rolerow" :class="{ npcmodal__rowactive: selectedTag === tag }" role="button" tabindex="0" @click="selectedTag = tag" @keydown.enter="selectedTag = tag">
                    <span class="npcmodal__truncate">
                      <strong>{{ tag }}</strong>
                    </span>
                    <button type="button" class="btn__danger btn__icon" @click.stop.prevent="onRemoveTag(tag)" aria-label="Delete tag">✕</button>
                  </div>
                  <div v-if="filteredTags.length === 0" class="npcmodal__empty">No tags</div>
                </div>
              </div>

              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Tag Detail</div>
                <div class="layout__row">
                  <input v-model="newTag" type="text" placeholder="New tag" class="input" @keydown="onKeydownTag" />
                  <button @click="onAddTag">Add</button>
                </div>
                <div class="layout__row">
                  <input v-model="tagSearch" type="text" placeholder="Search tags..." class="input" />
                </div>
                <div v-if="selectedTag && tagUsage" class="npcmodal__editor">
                  <div class="npcmodal__detail">
                    <span class="tag">{{ selectedTag }}</span>
                  </div>

                  <div class="npcmodal__targets">Trigger Rate</div>
                  <div class="layout__row">
                    <input type="number" min="0" max="100" step="1" class="input" :value="tagTriggerRate(selectedTag)" @input="setTagTriggerRate(selectedTag, +($event.target as HTMLInputElement).value)" />
                    <span class="npcmodal__value">%/min</span>
                  </div>
                  <div class="npcmodal__hint">Chance per minute an idle NPC heads to a target with this tag. 0 = never, 100 = always.</div>

                  <div class="npcmodal__targets">Used by roles ({{ tagUsage.roles.length }})</div>
                  <div class="npcmodal__scroll npcmodal__usagelist">
                    <div v-for="usage in tagUsage.roles" :key="usage.role.id + usage.type" class="npcmodal__usagerow">
                      <span class="npcmodal__swatch" :style="{ background: usage.role.color }" />
                      <span class="npcmodal__usagename">{{ usage.role.label }}</span>
                      <span class="tag" :class="usage.type === 'focus' ? 'tag__focus' : 'tag__restricted'">{{ usage.type }}</span>
                    </div>
                    <div v-if="tagUsage.roles.length === 0" class="npcmodal__empty">Not used by any role</div>
                  </div>

                  <div class="npcmodal__targets">Used by tasks ({{ tagUsage.tasks.length }})</div>
                  <div class="npcmodal__scroll npcmodal__usagelist">
                    <div v-for="task in tagUsage.tasks" :key="task.id" class="npcmodal__usagerow">
                      <span class="npcmodal__usagename">{{ task.label }}</span>
                    </div>
                    <div v-if="tagUsage.tasks.length === 0" class="npcmodal__empty">Not used by any task</div>
                  </div>
                </div>
                <div v-else class="npcmodal__empty">Select a tag to view usage</div>
              </div>
            </div>
          </div>

          <!-- Tab: Tasks -->
          <div v-if="activeTab === 'tasks'" class="npcmodal__tabpanel">
            <div class="npcmodal__split">
              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Tasks</div>
                <div class="npcmodal__scroll">
                  <div v-for="task in draft.tasks" :key="task.id" class="npcmodal__rolerow" :class="{ npcmodal__rowactive: selectedTaskId === task.id }" role="button" tabindex="0" @click="selectedTaskId = task.id" @keydown.enter="selectedTaskId = task.id">
                    <span class="npcmodal__truncate">
                      <strong>{{ task.label }}</strong>
                      <small>{{ task.tags.join(", ") || "No tags" }}</small>
                    </span>
                    <button type="button" class="btn__danger btn__icon" @click.stop.prevent="onDeleteTask(task)" aria-label="Delete task">✕</button>
                  </div>
                </div>
                <div class="layout__row">
                  <input v-model="newTaskLabel" type="text" placeholder="New task label" class="input" />
                </div>
                <div class="layout__row">
                  <input v-model="newTaskTag" type="text" placeholder="tag (optional)" class="input" />
                  <button @click="onAddTask">Add</button>
                </div>
              </div>

              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Task Detail</div>
                <div v-if="selectedTask" class="npcmodal__editor">
                  <div class="layout__row">
                    <label class="npcmodal__label" :for="'task__label__' + selectedTask.id">Label</label>
                    <input :id="'task__label__' + selectedTask.id" v-model="selectedTask.label" type="text" class="input" />
                  </div>

                  <button class="btn__danger" @click="onDeleteTask(selectedTask)">Delete Task</button>

                  <div class="npcmodal__targets">Tags</div>
                  <div class="npcmodal__taglist">
                    <div v-for="(tag, index) in selectedTask.tags" :key="index" class="tag">
                      <span>{{ tag }}</span>
                      <button class="tag__remove" @click="onRemoveTaskTag(selectedTask, index)" aria-label="Remove tag">×</button>
                    </div>
                    <div v-if="!selectedTask.tags.length" class="npcmodal__empty">No tags</div>
                  </div>
                  <div class="layout__row">
                    <input v-model="newSelectedTaskTag" type="text" placeholder="add tag" class="input" @keydown.enter="onAddTaskTag" />
                    <button @click="onAddTaskTag">Add</button>
                  </div>

                  <div class="npcmodal__targets">Used by roles (as preset)</div>
                  <div class="npcmodal__scroll npcmodal__usagelist">
                    <div v-for="usage in taskUsage(selectedTask.id)" :key="usage.role.id" class="npcmodal__usagerow">
                      <span class="npcmodal__swatch" :style="{ background: usage.role.color }" />
                      <span class="npcmodal__usagename">{{ usage.role.label }}</span>
                    </div>
                    <div v-if="taskUsage(selectedTask.id).length === 0" class="npcmodal__empty">Not used by any role</div>
                  </div>
                </div>
                <div v-else class="npcmodal__empty">Select a task to edit</div>
              </div>
            </div>
          </div>

          <!-- Tab: Spawn & Settings -->
          <div v-if="activeTab === 'spawn'" class="npcmodal__tabpanel">
            <div class="npcmodal__split">
              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Spawn & Deployment</div>
                <div class="npcmodal__scroll">
                  <div v-for="role in draft.roles" :key="role.id" class="npcmodal__spawnrow">
                    <div class="npcmodal__spawnhead">
                      <span class="npcmodal__swatch" :style="{ background: role.color }" />
                      <span class="npcmodal__spawnname">{{ role.label }}</span>
                    </div>
                    <div class="npcmodal__spawnfields">
                      <div class="npcmodal__spawnfield">
                        <label class="npcmodal__label">Count</label>
                        <div class="layout__wrap">
                          <button class="btn__icon" @click="setPoolCount(role.id, getPoolCount(role.id) - 1)">−</button>
                          <input :value="getPoolCount(role.id)" type="number" min="0" max="100" class="input input__count" @input="setPoolCount(role.id, Number(($event.target as HTMLInputElement).value))" />
                          <button class="btn__icon" @click="setPoolCount(role.id, getPoolCount(role.id) + 1)">+</button>
                        </div>
                      </div>
                      <div class="npcmodal__spawnfield">
                        <label class="npcmodal__label">Speed ×</label>
                        <input v-model.number="ensureSpawnRuleFor(role).speedMultiplier" type="number" min="0.1" step="0.1" class="input input__count" />
                      </div>
                    </div>
                    <div class="npcmodal__targets">Spawn Floors</div>
                    <div class="npcmodal__taglist">
                      <div v-for="label in role.spawnRule?.floorLabels ?? []" :key="'sf_' + role.id + label" class="tag">
                        <span>{{ label }}</span>
                        <button class="tag__remove" @click="onRemoveSpawnFloorFrom(role, label)" aria-label="Remove floor">×</button>
                      </div>
                      <div v-if="!(role.spawnRule?.floorLabels ?? []).length" class="npcmodal__empty">Any floor</div>
                    </div>
                    <div class="layout__row">
                      <select v-model="newSpawnFloor[role.id]" class="input">
                        <option value="">+ Add floor…</option>
                        <option v-for="label in floorLabels" :key="label" :value="label">{{ label }}</option>
                      </select>
                      <button @click="onAddSpawnFloorFor(role)" :disabled="!newSpawnFloor[role.id]">Add</button>
                    </div>
                    <div class="npcmodal__targets">Spawn Room Tags</div>
                    <div class="npcmodal__taglist">
                      <div v-for="tag in role.spawnRule?.roomTags ?? []" :key="'st_' + role.id + tag" class="tag">
                        <span>{{ tag }}</span>
                        <button class="tag__remove" @click="onRemoveSpawnTagFrom(role, tag)" aria-label="Remove tag">×</button>
                      </div>
                      <div v-if="!(role.spawnRule?.roomTags ?? []).length" class="npcmodal__empty">Any room</div>
                    </div>
                    <div class="layout__row">
                      <input v-model="newSpawnTag[role.id]" type="text" placeholder="room tag" class="input" @keydown.enter="onAddSpawnTagFor(role)" />
                      <button @click="onAddSpawnTagFor(role)" :disabled="!newSpawnTag[role.id]">Add</button>
                    </div>
                  </div>
                </div>
                <div class="npcmodal__total">Total: {{ totalNpcCount() }} NPCs</div>
              </div>

              <div class="npcmodal__pane">
                <div class="npcmodal__heading">Global Settings</div>
                <div class="layout__row">
                  <label class="npcmodal__label" for="setting__speed">Sim Speed</label>
                  <input id="setting__speed" v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" class="npcmodal__grow" />
                  <span class="npcmodal__value">{{ draft.speed.toFixed(2) }}</span>
                </div>
                <div class="layout__row">
                  <label class="npcmodal__label" for="setting__defaultrole">Default Role</label>
                  <select id="setting__defaultrole" v-model="draft.defaultRoleId" class="input">
                    <option v-for="role in draft.roles" :key="role.id" :value="role.id">{{ role.label }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.npcmodal {
  z-index: 1002;
  top: 60px;
  overflow: hidden;
  align-items: stretch;
}

.npcmodal__dialog {
  max-width: 900px;
  height: 100vh;
  max-height: 90vh;
  width: 50vw;
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

.npcmodal__single {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-height: 0;
  max-width: 500px;
  margin: 0 auto;
}

.npcmodal__heading {
  font-weight: 600;
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.npcmodal__scroll {
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

.npcmodal__rowactive {
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

.npcmodal__editor {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.npcmodal__detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
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

.npcmodal__empty {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  opacity: 0.6;
  padding: var(--gap-xs) 0;
}

.npcmodal__hint {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  opacity: 0.7;
  padding: var(--gap-xs) 0;
  line-height: 1.4;
}

.npcmodal__presets {
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

.npcmodal__taskcheck small {
  color: var(--text-dim);
  font-size: var(--font-xs);
}

.npcmodal__taglist {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}

.npcmodal__total {
  text-align: right;
  font-size: var(--font-sm);
  font-weight: 600;
  padding: var(--gap-xs) 0;
}

.npcmodal__subheading {
  margin-top: var(--gap-md);
  border-top: 1px solid var(--border-dim);
  padding-top: var(--gap-md);
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

.tag__restricted {
  background: color-mix(in srgb, var(--accent-red) 15%, transparent);
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.tag__focus {
  background: color-mix(in srgb, var(--accent-blue) 15%, transparent);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.npcmodal__spawnrow {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.npcmodal__spawnhead {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.npcmodal__spawnname {
  font-weight: 600;
  font-size: var(--font-sm);
}

.npcmodal__spawnfields {
  display: flex;
  gap: var(--gap-md);
}

.npcmodal__spawnfield {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.npcmodal__usagelist {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.npcmodal__usagerow {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.npcmodal__usagename {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-sm);
}

.npcmodal__tagscroll {
  max-height: 200px;
}
</style>
