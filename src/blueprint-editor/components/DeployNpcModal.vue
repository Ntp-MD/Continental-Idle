<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useToast } from "@/composables/useToast";
import { useAssetsStore } from "../blueprintStore";
import { state } from "../store/state";
import { normalizeNpcConfig, type NpcSimulationConfig, type NpcRole, type NpcSpawnRule } from "../types";
import ModalShell from "./ModalShell.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void; (e: "deploy"): void }>();

const toast = useToast();
const store = useAssetsStore();

if (!state.layout.npcConfig) {
  state.layout.npcConfig = { speed: 0.2, defaultRoleId: "", roles: [], tasks: [], pool: [] };
}
function cloneConfig(value: NpcSimulationConfig): NpcSimulationConfig {
  return JSON.parse(JSON.stringify(value)) as NpcSimulationConfig;
}

const draft = ref<NpcSimulationConfig>(cloneConfig(state.layout.npcConfig));
const newSpawnTag = ref<Record<string, string>>({});

const roles = computed(() => draft.value.roles);
const floors = computed(() => store.state.layout.floors);

let persistTimer: number | null = null;
function schedulePersist(): void {
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    const normalized = normalizeNpcConfig(draft.value);
    if (normalized) void store.updateNpcConfig(normalized);
  }, 400);
}

watch(
  () => props.open,
  (open) => {
    if (open && state.layout.npcConfig) {
      draft.value = cloneConfig(state.layout.npcConfig);
    }
  },
);

function ensureSpawnRuleFor(role: NpcRole): NpcSpawnRule {
  if (!role.spawnRule) {
    role.spawnRule = { targetTags: [], count: 0 };
  }
  return role.spawnRule;
}

function getPoolCount(roleId: string): number {
  return draft.value.pool.find((p) => p.roleId === roleId)?.count ?? 0;
}

function getPoolFloorIds(roleId: string): string[] {
  return draft.value.pool.find((p) => p.roleId === roleId)?.floorIds ?? [];
}

function togglePoolFloor(roleId: string, floorId: string): void {
  const entry = draft.value.pool.find((p) => p.roleId === roleId);
  if (!entry) return;
  const current = new Set(entry.floorIds ?? []);
  if (current.has(floorId)) current.delete(floorId);
  else current.add(floorId);
  entry.floorIds = current.size ? [...current] : undefined;
  schedulePersist();
}

function setPoolCount(roleId: string, count: number) {
  const safe = Math.max(0, Math.min(100, Math.floor(count || 0)));
  const entry = draft.value.pool.find((p) => p.roleId === roleId);
  if (safe === 0) {
    if (entry) draft.value.pool = draft.value.pool.filter((p) => p.roleId !== roleId);
  } else {
    if (entry) entry.count = safe;
    else draft.value.pool.push({ roleId, count: safe });
  }
  schedulePersist();
}

function onAddSpawnTagFor(role: NpcRole) {
  const tag = (newSpawnTag.value[role.id] ?? "").trim();
  if (!tag) return;
  const rule = ensureSpawnRuleFor(role);
  if (!rule.targetTags!.includes(tag)) rule.targetTags!.push(tag);
  newSpawnTag.value[role.id] = "";
  schedulePersist();
}

function onRemoveSpawnTagFrom(role: NpcRole, tag: string) {
  if (!role.spawnRule?.targetTags) return;
  role.spawnRule.targetTags = role.spawnRule.targetTags.filter((t) => t !== tag);
  schedulePersist();
}

function totalNpcCount(): number {
  return draft.value.pool.reduce((sum, p) => sum + p.count, 0);
}

async function persistDraft(): Promise<void> {
  const normalized = normalizeNpcConfig(draft.value);
  if (normalized) await store.updateNpcConfig(normalized);
}

async function onClose() {
  if (persistTimer) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  await persistDraft();
  emit("close");
}

async function onDeploy() {
  if (totalNpcCount() === 0) {
    toast.warning("Set at least one NPC count before deploying");
    return;
  }
  if (persistTimer) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  await persistDraft();
  emit("deploy");
}
</script>

<template>
  <ModalShell :open="open" title="Deploy NPCs" max-width="520px" width="50vw" height="auto" max-height="80vh" @close="onClose">
    <div class="deploy__body">
      <div class="deploy__speed">
        <label class="deploy__label" for="deploy-npc-speed">NPC Speed</label>
        <input id="deploy-npc-speed" v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" @change="schedulePersist" />
        <span>{{ draft.speed.toFixed(2) }}</span>
      </div>

      <div v-if="roles.length === 0" class="deploy__empty">No roles configured. Open NPC Manager to create roles first.</div>

      <div v-else class="scroll">
        <div v-for="role in roles" :key="role.id" class="deploy__row">
          <div class="deploy__rowhead">
            <span class="swatch" :style="{ background: role.color }" />
            <span class="deploy__rolename">{{ role.label }}</span>
            <div class="deploy__fields">
              <div class="deploy__field">
                <label class="deploy__label">Count</label>
                <div class="layout__wrap">
                  <button class="btn--icon" @click="setPoolCount(role.id, getPoolCount(role.id) - 1)">−</button>
                  <input :value="getPoolCount(role.id)" type="number" min="0" max="100" class="input input--compact" @input="setPoolCount(role.id, Number(($event.target as HTMLInputElement).value))" />
                  <button class="btn--icon" @click="setPoolCount(role.id, getPoolCount(role.id) + 1)">+</button>
                </div>
              </div>
            </div>
          </div>

          <div class="deploy__floorsrow">
            <span class="deploy__section">Spawn floors</span>
            <label v-for="floor in floors" :key="`spawn-floor-${role.id}-${floor.id}`" class="deploy__floorcheck">
              <input type="checkbox" :checked="getPoolFloorIds(role.id).includes(floor.id)" @change="togglePoolFloor(role.id, floor.id)" />
              <span>{{ floor.label }}</span>
            </label>
            <span v-if="!getPoolFloorIds(role.id).length" class="deploy__dim">All floors</span>
          </div>

          <div class="deploy__tagsrow">
            <div class="deploy__taggroup">
              <span class="deploy__section">Target tags</span>
              <div class="deploy__taglist">
                <div v-for="tag in role.spawnRule?.targetTags ?? []" :key="'st_' + role.id + tag" class="chip">
                  <span>{{ tag }}</span>
                  <button class="chip__remove" @click="onRemoveSpawnTagFrom(role, tag)" aria-label="Remove tag">×</button>
                </div>
                <input v-model="newSpawnTag[role.id]" type="text" placeholder="+ tag" class="input deploy__addinput" @keydown.enter="onAddSpawnTagFor(role)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="deploy__footer">
        <span class="deploy__total">Total: {{ totalNpcCount() }} NPCs</span>
        <div class="actions">
          <button class="btn--ghost" @click="onClose">Cancel</button>
          <button class="btn--primary" @click="onDeploy" :disabled="totalNpcCount() === 0">Deploy</button>
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.input--compact {
  width: 2.5em;
  text-align: center;
  padding: 0 2px;
}

.deploy__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--gap-sm);
  gap: var(--gap-sm);
  overflow: hidden;
}

.deploy__speed {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) 0;
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.deploy__speed input {
  flex: 1;
  min-width: 0;
}

.deploy__row {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.deploy__rowhead {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.deploy__rolename {
  font-weight: 600;
  font-size: var(--font-sm);
  margin-right: auto;
}

.deploy__fields {
  display: flex;
  gap: var(--gap-sm);
  align-items: center;
}

.deploy__field {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.deploy__label {
  flex-shrink: 0;
}

.deploy__floorsrow {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.deploy__floorcheck {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-xs);
}

.deploy__dim {
  color: var(--text-secondary);
  font-size: var(--font-xs);
}

.deploy__tagsrow {
  display: flex;
  gap: var(--gap-sm);
  flex-wrap: wrap;
}

.deploy__taggroup {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 8em;
}

.deploy__section {
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.deploy__taglist {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-xs);
  align-items: center;
}

.deploy__addselect,
.deploy__addinput {
  width: 5.5em;
  flex-shrink: 0;
}

.deploy__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  padding: var(--gap-lg);
}

.deploy__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--gap-xs);
  border-top: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.deploy__total {
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--text-primary);
}
</style>
