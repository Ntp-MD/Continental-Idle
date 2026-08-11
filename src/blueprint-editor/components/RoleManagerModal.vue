<script setup lang="ts">
import { ref, watch, inject, computed, onUnmounted } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useNpcSimulation } from "../composables/useNpcSimulation";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { sanitizeString } from "../../utils/sanitize";
import { isHexColor } from "../store/state";
import { managedTagSet } from "../store/tags";
import { genId } from "../store/utils";
import type { NpcSimulationConfig, NpcRole } from "../types";
import ModalShell from "./ModalShell.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const toast = useToast();
const confirm = useConfirm().confirm;
const pending = ref(false);

const npcSimulation = inject("npcSimulation") as ReturnType<typeof useNpcSimulation>;

const draft = ref<NpcSimulationConfig>(cloneConfig(npcSimulation.config.value));
const selectedRoleId = ref("");
const activeTab = ref<"roles" | "settings">("roles");
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
          targetTags: Array.from(new Set((role.spawnRule.targetTags ?? []).map((s) => s.trim()).filter(Boolean))),
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
      role.spawnRule.targetTags = role.spawnRule.targetTags ?? [];
      role.spawnRule.count = role.spawnRule.count ?? 0;
      role.spawnRule.speedMultiplier = role.spawnRule.speedMultiplier ?? 1;
    }
  }
  selectedRoleId.value = draft.value.roles[0]?.id ?? "";
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
    spawnRule: { floorLabels: [], targetTags: [], count: 0, speedMultiplier: 1 },
  });
  if (!draft.value.defaultRoleId) draft.value.defaultRoleId = id;
  selectedRoleId.value = id;
  void persistDraftToDisk();
}

function canDeleteRole(role: NpcRole): boolean {
  return role.id !== draft.value.defaultRoleId;
}

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

function getPoolCount(roleId: string): number {
  return draft.value.pool.find((p) => p.roleId === roleId)?.count ?? 0;
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
  <ModalShell :open="open" title="Role Manager" max-width="900px" width="50vw" height="90vh" max-height="90vh" @close="onClose">
    <div class="rolemodal__tabs">
      <button :class="{ rolemodal__tabactive: activeTab === 'roles' }" @click="activeTab = 'roles'">Roles</button>
      <button :class="{ rolemodal__tabactive: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</button>
    </div>

    <div class="rolemodal__body">
      <!-- Tab: Roles -->
      <div v-if="activeTab === 'roles'" class="rolemodal__tabpanel">
        <div class="rolemodal__split">
          <div class="rolemodal__pane">
            <div class="rolemodal__heading">Roles</div>
            <div class="rolemodal__scroll">
              <div v-for="role in draft.roles" :key="role.id" class="rolemodal__rolerow" :class="{ rolemodal__rowactive: selectedRoleId === role.id }" role="button" tabindex="0" @click="selectedRoleId = role.id" @keydown.enter="selectedRoleId = role.id">
                <span class="rolemodal__swatch" :style="{ background: role.color }" />
                <span class="rolemodal__truncate">
                  <strong>{{ role.label }}</strong>
                  <small>{{ getPoolCount(role.id) }} deployed</small>
                </span>
                <button v-if="canDeleteRole(role)" type="button" class="btn__danger btn__icon" @click.stop.prevent="onDeleteRole(role)" aria-label="Delete role">×</button>
              </div>
            </div>
            <button @click="onAddRole">+ Add Role</button>
          </div>

          <div class="rolemodal__pane">
            <div class="rolemodal__heading">Role Detail</div>
            <div v-if="selectedRole" class="rolemodal__editor">
              <div class="layout__row">
                <label class="rolemodal__label" :for="'role__label__' + selectedRole.id">Label</label>
                <input :id="'role__label__' + selectedRole.id" v-model="selectedRole.label" type="text" class="input" />
              </div>
              <div class="layout__row">
                <label class="rolemodal__label" :for="'role__color__' + selectedRole.id">Color</label>
                <input :id="'role__color__' + selectedRole.id" v-model="selectedRole.color" type="text" class="input" placeholder="#RRGGBB" aria-label="Role color hex value" />
              </div>

              <div class="rolemodal__targets">Focus Tags</div>
              <div class="rolemodal__taglist">
                <div v-for="tag in selectedRole.focusTags" :key="'ft_' + tag" class="tag tag__focus" :class="{ 'tag--orphaned': !managedTagSet.has(tag) }">
                  <span>{{ tag }}</span>
                  <button class="tag__remove" @click="onRemoveFocusTag(tag)" aria-label="Remove focus tag">×</button>
                </div>
                <div v-if="!selectedRole.focusTags.length" class="rolemodal__empty">No focus tags — NPC wanders</div>
              </div>
              <div class="layout__row">
                <input v-model="newFocusTag" type="text" placeholder="tag name" class="input" @keydown.enter="onAddFocusTag" />
                <select v-model="newFocusTag" class="input" v-if="availableFocusTags.length">
                  <option value="">or pick…</option>
                  <option v-for="tag in availableFocusTags" :key="tag" :value="tag">{{ tag }}</option>
                </select>
                <button @click="onAddFocusTag" :disabled="!newFocusTag">Add</button>
              </div>

              <div class="rolemodal__targets">Restricted Tags</div>
              <div class="rolemodal__taglist">
                <div v-for="tag in selectedRole.restrictedTags" :key="'rt_' + tag" class="tag tag__restricted" :class="{ 'tag--orphaned': !managedTagSet.has(tag) }">
                  <span>{{ tag }}</span>
                  <button class="tag__remove" @click="onRemoveRestrictedTag(tag)" aria-label="Remove restriction">×</button>
                </div>
                <div v-if="!selectedRole.restrictedTags.length" class="rolemodal__empty">No restrictions</div>
              </div>
              <div class="layout__row">
                <input v-model="newRestrictedTag" type="text" placeholder="tag name" class="input" @keydown.enter="onAddRestrictedTag" />
                <select v-model="newRestrictedTag" class="input" v-if="availableRestrictedTags.length">
                  <option value="">or pick…</option>
                  <option v-for="tag in availableRestrictedTags" :key="tag" :value="tag">{{ tag }}</option>
                </select>
                <button @click="onAddRestrictedTag" :disabled="!newRestrictedTag">Add</button>
              </div>

              <div class="rolemodal__targets">Task Presets</div>
              <div class="rolemodal__presets" v-if="draft.tasks.length">
                <label v-for="task in draft.tasks" :key="'rtpreset_' + task.id" class="rolemodal__taskcheck">
                  <input type="checkbox" :checked="isRoleTaskSelected(task.id)" @change="toggleRoleTask(task.id)" />
                  <span
                    >{{ task.label }} <small>({{ task.tags.join(", ") }})</small></span
                  >
                </label>
              </div>
              <div v-else class="rolemodal__empty">No task presets</div>

              <div class="layout__row">
                <label class="rolemodal__label" :for="'role__chance__' + selectedRole.id">Focus Chance</label>
                <input :id="'role__chance__' + selectedRole.id" v-model.number="selectedRole.focusChance" type="range" min="0" max="100" class="rolemodal__grow" />
                <span class="rolemodal__value">{{ selectedRole.focusChance }}%</span>
              </div>
            </div>
            <div v-else class="rolemodal__empty">Select a role to edit</div>
          </div>
        </div>
      </div>

      <!-- Tab: Settings -->
      <div v-if="activeTab === 'settings'" class="rolemodal__tabpanel">
        <div class="rolemodal__split">
          <div class="rolemodal__pane">
            <div class="rolemodal__heading">Global Settings</div>
            <div class="layout__row">
              <label class="rolemodal__label" for="setting__speed">Sim Speed</label>
              <input id="setting__speed" v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" class="rolemodal__grow" />
              <span class="rolemodal__value">{{ draft.speed.toFixed(2) }}</span>
            </div>
            <div class="layout__row">
              <label class="rolemodal__label" for="setting__defaultrole">Default Role</label>
              <select id="setting__defaultrole" v-model="draft.defaultRoleId" class="input">
                <option v-for="role in draft.roles" :key="role.id" :value="role.id">{{ role.label }}</option>
              </select>
            </div>
          </div>
          <div class="rolemodal__pane">
            <div class="rolemodal__heading">Deployment</div>
            <div class="rolemodal__empty">Spawn settings moved to the Deploy NPCs dialog. Click "Deploy NPCs" in the toolbar to configure counts, spawn floors, and target tags.</div>
          </div>
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.rolemodal__tabs {
  display: flex;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.rolemodal__tabs button {
  padding: var(--gap-xs) var(--gap-sm);
  background: transparent;
  border: 1px solid transparent;
  font-size: var(--font-sm);
}

.rolemodal__tabs button:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.rolemodal__tabactive {
  background: var(--bg-primary) !important;
  border-color: var(--border-dim) !important;
  color: var(--text-primary) !important;
}

.rolemodal__body {
  flex: 1;
  min-height: 0;
  padding: var(--gap-md);
  overflow: hidden;
}

.rolemodal__tabpanel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  min-height: 0;
}

.rolemodal__split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-md);
  min-height: 0;
}

.rolemodal__pane {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.rolemodal__heading {
  font-weight: 600;
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rolemodal__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.rolemodal__rolerow {
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

.rolemodal__rolerow:hover {
  background: var(--bg-card);
}

.rolemodal__rowactive {
  border-color: var(--accent-blue);
  background: var(--bg-card);
}

.rolemodal__rolerow:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

.rolemodal__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rolemodal__truncate {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rolemodal__truncate small {
  color: var(--text-dim);
  font-size: var(--font-xs);
  font-weight: 400;
}

.rolemodal__editor {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.rolemodal__label {
  flex-shrink: 0;
}

.rolemodal__value {
  flex-shrink: 0;
  text-align: right;
  font-size: var(--font-sm);
}

.rolemodal__grow {
  flex: 1;
  min-width: 0;
}

.rolemodal__targets {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rolemodal__empty {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  opacity: 0.6;
  padding: var(--gap-xs) 0;
}

.rolemodal__presets {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.rolemodal__taskcheck {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-sm);
  cursor: pointer;
}

.rolemodal__taskcheck small {
  color: var(--text-dim);
  font-size: var(--font-xs);
}

.rolemodal__taglist {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
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

.tag--orphaned {
  border-color: var(--accent-gold) !important;
  color: var(--accent-gold) !important;
  background: color-mix(in srgb, var(--accent-gold) 10%, transparent) !important;
}
</style>
