<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useConfirm } from "@/composables/useConfirm";
import { useToast } from "@/composables/useToast";
import { isHexColor } from "../types";
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

function ensureNpcConfig(): NpcSimulationConfig {
  if (!store.state.layout.npcConfig) {
    store.state.layout.npcConfig = { speed: 0.2, defaultRoleId: "", roles: [], tasks: [], pool: [] };
  }
  return store.state.layout.npcConfig;
}

const config = computed(() => ensureNpcConfig());
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
  const normalized = cloneConfig(value);
  normalized.roles = normalized.roles.map((role) => ({
    ...role,
    label: sanitizeString(role.label),
    focusTags: Array.from(new Set((role.focusTags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    restrictedTags: Array.from(new Set((role.restrictedTags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    taskIds: Array.from(new Set(role.taskIds ?? [])),
    focusChance: Math.max(0, Math.min(100, Math.floor(role.focusChance ?? 100))),
    spawnRule: role.spawnRule
      ? {
          targetTags: Array.from(new Set((role.spawnRule.targetTags ?? []).map((tag) => tag.trim()).filter(Boolean))),
          count: Math.max(0, Math.floor(role.spawnRule.count ?? 0)),
        }
      : undefined,
  }));
  const rates: Record<string, number> = {};
  for (const [tag, rate] of Object.entries(normalized.tagTriggerRates ?? {})) {
    const safeRate = Math.max(0, Math.min(100, Math.floor(rate)));
    if (safeRate > 0 && tag.trim()) rates[tag.trim()] = safeRate;
  }
  normalized.tagTriggerRates = Object.keys(rates).length ? rates : undefined;
  normalized.pool = normalized.pool.filter((entry) => normalized.roles.some((role) => role.id === entry.roleId));
  if (!normalized.roles.some((role) => role.id === normalized.defaultRoleId)) {
    normalized.defaultRoleId = normalized.roles[0]?.id ?? "";
  }
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
    if (open) resetSelection();
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
    <div class="npcmanager__body">
      <section class="npcmanager__column">
        <div class="npcmanager__heading">Roles</div>
        <div class="scroll">
          <div v-for="role in roles" :key="role.id" class="npcmanager__role" :class="{ 'npcmanager__role--active': selectedRoleId === role.id }" role="button" tabindex="0" @click="selectedRoleId = role.id" @keydown.enter="selectedRoleId = role.id">
            <span class="npcmanager__swatch" :style="{ background: role.color }" />
            <span class="npcmanager__roletext"
              ><strong>{{ role.label }}</strong
              ><small>{{ role.id === config.defaultRoleId ? "Default role" : "" }}</small></span
            >
            <button type="button" class="btn--ghost btn--icon" :class="{ 'btn--warning': role.id === config.defaultRoleId }" :title="role.id === config.defaultRoleId ? 'Default role' : 'Set as default role'" @click.stop="setDefaultRole(role)">★</button>
            <button v-if="role.id !== config.defaultRoleId" type="button" class="btn--danger btn--icon" @click.stop="deleteRole(role)" aria-label="Delete role">×</button>
          </div>
          <div v-if="!roles.length" class="npcmanager__empty">No roles</div>
        </div>
        <button type="button" class="btn--primary" :disabled="pending" @click="addRole">+ Add Role</button>
      </section>

      <section class="npcmanager__column">
        <div class="npcmanager__heading">Tags</div>
        <input v-model="tagSearch" class="input" type="search" placeholder="Search tags..." />
        <div class="npcmanager__tagadd">
          <input v-model="newTag" class="input" type="text" placeholder="New tag" @keydown.enter="addTag" />
          <button type="button" class="btn--primary" @click="addTag">Add</button>
        </div>
        <div class="scroll">
          <div v-for="tag in filteredTags" :key="tag" class="npcmanager__tagrow">
            <span>{{ tag }}</span>
            <button type="button" class="btn--danger btn--icon" @click="removeTag(tag)" aria-label="Delete tag">×</button>
          </div>
          <div v-if="!filteredTags.length" class="npcmanager__empty">No tags</div>
        </div>
      </section>

      <section class="npcmanager__column npcmanager__detail">
        <div class="npcmanager__heading">Role Detail <span v-if="saveState === 'saved'" class="npcmanager__saved" aria-live="polite">✓ Saved</span><span v-else-if="saveState === 'unsaved'" class="npcmanager__unsaved" aria-live="polite">⚠ Not saved — check label and color</span></div>
        <template v-if="selectedRole">
          <div class="layout__row">
            <label class="npcmanager__label" :for="`npc-role-label-${selectedRole.id}`">Label</label>
            <input :id="`npc-role-label-${selectedRole.id}`" v-model="selectedRole.label" class="input" type="text" @change="updateRole" />
          </div>
          <div class="layout__row">
            <label class="npcmanager__label" :for="`npc-role-color-${selectedRole.id}`">Color</label>
            <ColorInput :model-value="selectedRole.color" @commit="commitRoleColor" placeholder="#RRGGBB" aria-label="Role color" />
          </div>

          <div class="npcmanager__section">Focus Tags</div>
          <div class="npcmanager__taglist">
            <TagChip v-for="tag in selectedRole.focusTags" :key="`focus-${tag}`" :label="tag" variant="focus" removable :class="{ 'tag--orphaned': !managedTagSet.has(tag) }" @remove="removeRoleTag('focus', tag)" />
            <span v-if="!selectedRole.focusTags.length" class="npcmanager__empty">No focus tags — NPC wanders</span>
          </div>
          <div class="layout__row">
            <input v-model="newFocusTag" class="input" type="text" placeholder="tag name" @keydown.enter="addRoleTag('focus')" />
            <select v-if="availableFocusTags.length" v-model="newFocusTag" class="input">
              <option value="">or pick…</option>
              <option v-for="tag in availableFocusTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <button type="button" @click="addRoleTag('focus')">Add</button>
          </div>

          <div class="npcmanager__section">Restricted Tags</div>
          <div class="npcmanager__taglist">
            <TagChip v-for="tag in selectedRole.restrictedTags" :key="`restricted-${tag}`" :label="tag" variant="restricted" removable :class="{ 'tag--orphaned': !managedTagSet.has(tag) }" @remove="removeRoleTag('restricted', tag)" />
            <span v-if="!selectedRole.restrictedTags.length" class="npcmanager__empty">No restrictions</span>
          </div>
          <div class="layout__row">
            <input v-model="newRestrictedTag" class="input" type="text" placeholder="tag name" @keydown.enter="addRoleTag('restricted')" />
            <select v-if="availableRestrictedTags.length" v-model="newRestrictedTag" class="input">
              <option value="">or pick…</option>
              <option v-for="tag in availableRestrictedTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <button type="button" @click="addRoleTag('restricted')">Add</button>
          </div>

          <div class="layout__row">
            <label class="npcmanager__label" :for="`npc-role-chance-${selectedRole.id}`">Focus Chance</label>
            <input :id="`npc-role-chance-${selectedRole.id}`" v-model.number="selectedRole.focusChance" class="npcmanager__grow" type="range" min="0" max="100" @change="updateRole" />
            <span class="npcmanager__value">{{ selectedRole.focusChance }}%</span>
          </div>

          <div class="npcmanager__section">Tag Trigger Rates</div>
          <div v-for="tag in tags" :key="`rate-${tag}`" class="layout__row">
            <label class="npcmanager__taglabel" :for="`npc-rate-${tag}`">{{ tag }}</label>
            <input :id="`npc-rate-${tag}`" class="input npcmanager__rate" type="number" min="0" max="100" step="1" :value="triggerRate(tag)" @change="setTriggerRate(tag, +($event.target as HTMLInputElement).value)" />
            <span class="npcmanager__value">%/min</span>
          </div>
          <div v-if="!tags.length" class="npcmanager__empty">Add tags to configure trigger rates</div>
        </template>
        <div v-else class="npcmanager__empty">Select a role to edit</div>
      </section>
    </div>
  </ModalShell>
</template>

<style scoped>
.npcmanager__body {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(180px, 0.8fr) minmax(360px, 1.6fr);
  flex: 1;
  overflow: hidden;
}

.npcmanager__column {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  min-width: 0;
  padding: var(--gap-md);
  border-right: 1px solid var(--border-dim);
}

.npcmanager__column:last-child {
  border-right: 0;
}

.npcmanager__heading,
.npcmanager__section {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.npcmanager__section {
  font-size: var(--font-xs);
}

.npcmanager__role,
.npcmanager__tagrow {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.npcmanager__role {
  cursor: pointer;
}
.npcmanager__role:hover,
.npcmanager__role--active {
  background: var(--bg-card);
}
.npcmanager__role--active {
  border-color: var(--accent-blue);
}
.npcmanager__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.npcmanager__roletext {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}
.npcmanager__roletext strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.npcmanager__roletext small {
  color: var(--text-dim);
  font-size: var(--font-xs);
}
.npcmanager__tagrow span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.npcmanager__tagadd {
  display: flex;
  gap: var(--gap-xs);
  flex-shrink: 0;
}
.npcmanager__tagadd .input {
  min-width: 0;
  flex: 1;
}
.npcmanager__detail {
  overflow-y: auto;
}
.npcmanager__label {
  flex-shrink: 0;
  min-width: 72px;
}
.npcmanager__taglabel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.npcmanager__taglist {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
}
.npcmanager__grow {
  flex: 1;
  min-width: 0;
}

.npcmanager__color {
  width: var(--control-height);
  height: var(--control-height);
  padding: 0;
  flex-shrink: 0;
  cursor: pointer;
}
.npcmanager__rate {
  width: 72px;
  flex: 0 0 72px;
}
.npcmanager__value {
  flex-shrink: 0;
  font-size: var(--font-sm);
  text-align: right;
}
.npcmanager__empty {
  color: var(--text-secondary);
  font-size: var(--font-xs);
  opacity: 0.7;
  padding: var(--gap-xs) 0;
}

.npcmanager__saved {
  color: var(--accent-green);
  font-size: var(--font-xs);
  text-transform: none;
  letter-spacing: 0;
}

.npcmanager__unsaved {
  color: var(--accent-gold);
  font-size: var(--font-xs);
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 900px) {
  .npcmanager__body {
    grid-template-columns: 1fr 1fr;
    overflow-y: auto;
  }
  .npcmanager__detail {
    grid-column: 1 / -1;
    border-top: 1px solid var(--border-dim);
    border-right: 0;
  }
}
</style>
