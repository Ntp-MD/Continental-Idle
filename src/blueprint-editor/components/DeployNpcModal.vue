<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useToast } from "@/composables/useToast";
import { useAssetsStore } from "../blueprintStore";
import { state } from "../store/state";
import { normalizeNpcConfig, type NpcSimulationConfig, type NpcRole, type NpcSpawnRule } from "../types";
import ModalShell from "./ModalShell.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void; (e: "deploy", spawnFloorId: string): void }>();

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
const spawnFloorId = ref("");

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
  emit("deploy", spawnFloorId.value);
}
</script>

<template>
  <ModalShell :open="open" title="Deploy NPCs" max-width="520px" width="50vw" height="auto" max-height="80vh" @close="onClose">
    <div class="modal__body deploy__body">
      <div class="deploy__section">
        <div class="form__title">Simulation</div>
        <div class="form__row">
          <label class="label--fixed" for="deploy-npc-speed">NPC Speed</label>
          <input id="deploy-npc-speed" v-model.number="draft.speed" type="range" min="0.01" max="0.2" step="0.01" @change="schedulePersist" />
          <span>{{ draft.speed.toFixed(2) }}</span>
        </div>
        <div class="form__row">
          <label class="label--fixed" for="deploy-spawn-floor">Spawn floor</label>
          <select id="deploy-spawn-floor" v-model="spawnFloorId">
            <option value="">All floors (per-role filters below)</option>
            <option v-for="floor in floors" :key="`deploy-floor-${floor.id}`" :value="floor.id">{{ floor.label }} - {{ floor.name }}</option>
          </select>
        </div>
        <div class="form__hint">Spawn floor forces every NPC onto one floor; "All floors" uses each role's floor checks below.</div>
      </div>

      <div v-if="roles.length === 0" class="empty empty--center deploy__empty">No roles configured. Open NPC Manager to create roles first.</div>

      <div v-else class="form__col form__col--tight form__col--scroll deploy__roles">
        <div class="form__title">Roles</div>
        <div v-for="role in roles" :key="role.id" class="deploy__row">
          <div class="form__row form__row--tight form__row--wrap">
            <span class="swatch" :style="{ background: role.color }" />
            <input class="input--disabled" :value="role.label" readonly aria-label="Role name" />
            <div class="form__row">
              <div class="form__row form__row--tight">
                <label class="label--fixed">Count</label>
                <div class="form__row form__row--wrap">
                  <button class="flag--icon" aria-label="Decrease count" @click="setPoolCount(role.id, getPoolCount(role.id) - 1)">-</button>
                  <input :value="getPoolCount(role.id)" type="number" min="0" max="100" aria-label="Role count" @input="setPoolCount(role.id, Number(($event.target as HTMLInputElement).value))" />
                  <button class="flag--icon" aria-label="Increase count" @click="setPoolCount(role.id, getPoolCount(role.id) + 1)">+</button>
                </div>
              </div>
            </div>
          </div>

          <div class="form__row form__row--tight form__row--wrap">
            <span class="form__title">Spawn floors</span>
            <label v-for="floor in floors" :key="`spawn-floor-${role.id}-${floor.id}`" class="deploy__floorcheck">
              <input type="checkbox" :checked="getPoolFloorIds(role.id).includes(floor.id)" @change="togglePoolFloor(role.id, floor.id)" />
              <span>{{ floor.label }}</span>
            </label>
            <span v-if="!getPoolFloorIds(role.id).length" class="form__hint">All floors</span>
          </div>

          <div class="form__row form__row--wrap">
            <div class="deploy__taggroup">
              <span class="form__title">Target tags</span>
              <div class="form__row form__row--tight form__row--wrap">
                <div v-for="tag in role.spawnRule?.targetTags ?? []" :key="'st_' + role.id + tag" class="chip">
                  <span>{{ tag }}</span>
                  <button class="chip__remove" @click="onRemoveSpawnTagFrom(role, tag)" aria-label="Remove tag">x</button>
                </div>
                <input v-model="newSpawnTag[role.id]" type="text" placeholder="+ tag" class="deploy__addinput" @keydown.enter="onAddSpawnTagFor(role)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form__row form__row--between form__row--border">
        <span class="form__hint">Total: {{ totalNpcCount() }} NPCs</span>
        <div class="form__row">
          <button class="flag--ghost" @click="onClose">Cancel</button>
          <button class="flag--active" @click="onDeploy" :disabled="totalNpcCount() === 0">Deploy</button>
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
.deploy__body {
  flex: 1;
  min-height: 0;
  padding: var(--gap-sm);
  overflow: hidden;
  gap: var(--gap-xs);
}

.deploy__section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.deploy__roles {
  flex: 1;
  min-height: 0;
}

.deploy__row {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.deploy__floorcheck {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-xs);
}

.deploy__taggroup {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xxs);
  flex: 1;
  min-width: 96px;
}

.deploy__addinput {
  width: 61px;
  flex-shrink: 0;
}

.deploy__empty {
  color: var(--text-secondary);
  padding: var(--gap-lg);
}

.deploy__body > .form__row--border {
  padding-top: var(--gap-xs);
}
</style>
