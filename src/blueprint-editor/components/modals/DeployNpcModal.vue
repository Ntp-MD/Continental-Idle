<script setup lang="ts">
import { ref, computed, toRaw, watch, onUnmounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useAssetsStore, state, emptyNpcConfig } from '../blueprintStore'
import { normalizeNpcConfig, type NpcSimulationConfig, type NpcRole, type NpcSpawnRule } from '../types'
import ModalShell from './ModalShell.vue'
import TagChip from './TagChip.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'deploy', spawnFloorId: string): void }>()

const toast = useToast()
const store = useAssetsStore()

if (!state.layout.npcConfig) {
  state.layout.npcConfig = emptyNpcConfig()
}

const draft = ref<NpcSimulationConfig>(structuredClone(toRaw(state.layout.npcConfig)))
const newSpawnTag = ref<Record<string, string>>({})
const spawnFloorId = ref('')

const roles = computed(() => draft.value.roles)
const floors = computed(() => store.state.layout.floors)
const selectedRoleId = ref('')
const selectedRole = computed(() => roles.value.find((role) => role.id === selectedRoleId.value) ?? roles.value[0])

let persistTimer: number | null = null
function schedulePersist(): void {
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    const normalized = normalizeNpcConfig(draft.value)
    if (normalized) void store.updateNpcConfig(normalized)
  }, 400)
}

onUnmounted(() => {
  if (persistTimer) {
    window.clearTimeout(persistTimer)
    persistTimer = null
  }
})

watch(
  () => props.open,
  (open) => {
    if (open && state.layout.npcConfig) {
      draft.value = structuredClone(toRaw(state.layout.npcConfig))
    }
  },
)

function ensureSpawnRuleFor(role: NpcRole): NpcSpawnRule {
  if (!role.spawnRule) {
    role.spawnRule = { targetTags: [], count: 0 }
  }
  return role.spawnRule
}

function getPoolCount(roleId: string): number {
  return draft.value.pool.find((p) => p.roleId === roleId)?.count ?? 0
}

function getPoolFloorIds(roleId: string): string[] {
  return draft.value.pool.find((p) => p.roleId === roleId)?.floorIds ?? []
}

function togglePoolFloor(roleId: string, floorId: string): void {
  const entry = draft.value.pool.find((p) => p.roleId === roleId)
  if (!entry) return
  const current = new Set(entry.floorIds ?? [])
  if (current.has(floorId)) current.delete(floorId)
  else current.add(floorId)
  entry.floorIds = current.size ? [...current] : undefined
  schedulePersist()
}

function setPoolCount(roleId: string, count: number) {
  const safe = Math.max(0, Math.min(100, Math.floor(count || 0)))
  const entry = draft.value.pool.find((p) => p.roleId === roleId)
  if (safe === 0) {
    if (entry) draft.value.pool = draft.value.pool.filter((p) => p.roleId !== roleId)
  } else {
    if (entry) entry.count = safe
    else draft.value.pool.push({ roleId, count: safe })
  }
  schedulePersist()
}

function onAddSpawnTagFor(role: NpcRole) {
  const tag = (newSpawnTag.value[role.id] ?? '').trim()
  if (!tag) return
  const rule = ensureSpawnRuleFor(role)
  if (!rule.targetTags!.includes(tag)) rule.targetTags!.push(tag)
  newSpawnTag.value[role.id] = ''
  schedulePersist()
}

function onRemoveSpawnTagFrom(role: NpcRole, tag: string) {
  if (!role.spawnRule?.targetTags) return
  role.spawnRule.targetTags = role.spawnRule.targetTags.filter((t) => t !== tag)
  schedulePersist()
}

const totalNpcCount = computed(() => draft.value.pool.reduce((sum, p) => sum + p.count, 0))

async function persistDraft(): Promise<void> {
  const normalized = normalizeNpcConfig(draft.value)
  if (normalized) await store.updateNpcConfig(normalized)
}

async function onClose() {
  if (persistTimer) {
    window.clearTimeout(persistTimer)
    persistTimer = null
  }
  await persistDraft()
  emit('close')
}

async function onDeploy() {
  if (totalNpcCount.value === 0) {
    toast.warning('Set at least one NPC count before deploying')
    return
  }
  if (persistTimer) {
    window.clearTimeout(persistTimer)
    persistTimer = null
  }
  await persistDraft()
  emit('deploy', spawnFloorId.value)
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-deploy-npc" title="Deploy NPCs" @close="onClose">
    <div class="form__group">
      <div class="form__title">Simulation</div>
      <label class="form__row" for="deploy-npc-speed">
        <span>Speed</span>
        <input
          id="deploy-npc-speed"
          v-model.number="draft.speed"
          type="range"
          min="0.01"
          max="0.2"
          step="0.01"
          @change="schedulePersist"
        />
        <output>{{ draft.speed.toFixed(2) }}</output>
      </label>
      <label class="form__row" for="deploy-spawn-floor">
        <span>Spawn floor</span>
        <select id="deploy-spawn-floor" v-model="spawnFloorId">
          <option value="">All floors (per-role filters below)</option>
          <option v-for="floor in floors" :key="`deploy-floor-${floor.id}`" :value="floor.id">
            {{ floor.label }} - {{ floor.name }}
          </option>
        </select>
      </label>
      <p class="form__hint">
        Spawn floor forces every NPC onto one floor; "All floors" uses each role's floor checks below.
      </p>
    </div>

    <div v-if="roles.length === 0" class="empty">No roles configured. Open NPC Manager to create roles first.</div>

    <div v-else class="deploy__layout">
      <aside class="form__col deploy__sidebar">
        <div class="form__title">Roles</div>
        <div
          v-for="role in roles"
          :key="role.id"
          class="deploy__row"
          :class="{ 'flag--active': selectedRole?.id === role.id }"
          role="button"
          tabindex="0"
          @click="selectedRoleId = role.id"
          @keydown.self.enter.prevent="selectedRoleId = role.id"
          @keydown.self.space.prevent="selectedRoleId = role.id"
        >
          <span class="swatch" :style="{ background: role.color }" />
          <strong class="deploy__name">{{ role.label }}</strong>
          <button
            class="deploy__step"
            aria-label="Decrease count"
            @click.stop="setPoolCount(role.id, getPoolCount(role.id) - 1)"
          >
            -
          </button>
          <input
            :id="`deploy-role-count-${role.id}`"
            class="deploy__count"
            :value="getPoolCount(role.id)"
            type="number"
            min="0"
            max="100"
            :aria-label="`Count for ${role.label}`"
            @click.stop
            @input="setPoolCount(role.id, Number(($event.target as HTMLInputElement).value))"
          />
          <button
            class="deploy__step"
            aria-label="Increase count"
            @click.stop="setPoolCount(role.id, getPoolCount(role.id) + 1)"
          >
            +
          </button>
        </div>
        <span v-if="!roles.length" class="empty">No roles</span>
      </aside>

      <section v-if="selectedRole" class="form__col deploy__detail">
        <h3 class="form__title">Spawn Rule: {{ selectedRole.label }}</h3>
        <template v-if="getPoolCount(selectedRole.id) > 0">
          <div class="form__group">
            <div class="form__title">Spawn Floors</div>
            <template v-if="!spawnFloorId">
              <div class="form__row">
                <label
                  v-for="floor in floors"
                  :key="`spawn-floor-${selectedRole.id}-${floor.id}`"
                  class="chip"
                  :class="{ 'flag--active': getPoolFloorIds(selectedRole.id).includes(floor.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="getPoolFloorIds(selectedRole.id).includes(floor.id)"
                    @change="togglePoolFloor(selectedRole.id, floor.id)"
                  />
                  <span>{{ floor.label }}</span>
                </label>
              </div>
              <p v-if="!getPoolFloorIds(selectedRole.id).length" class="form__hint">All floors</p>
            </template>
            <p v-else class="form__hint">Spawn floor is forced in Simulation above.</p>
          </div>
          <div class="form__group">
            <div class="form__title">Target Tags</div>
            <div class="form__row">
              <TagChip
                v-for="tag in selectedRole.spawnRule?.targetTags ?? []"
                :key="'st_' + selectedRole.id + tag"
                :label="tag"
                removable
                @remove="onRemoveSpawnTagFrom(selectedRole, tag)"
              />
              <span v-if="!selectedRole.spawnRule?.targetTags?.length" class="empty">No target tags</span>
            </div>
            <input
              v-model="newSpawnTag[selectedRole.id]"
              type="text"
              placeholder="+ tag"
              aria-label="Add target tag"
              @keydown.enter="onAddSpawnTagFor(selectedRole)"
            />
          </div>
        </template>
        <p v-else class="form__hint">Set a count above 0 to configure spawn floors and target tags.</p>
      </section>
    </div>

    <template #footer>
      <span class="form__hint">Total: {{ totalNpcCount }} NPCs</span>
      <div class="form__row">
        <button class="flag--ghost" @click="onClose">Cancel</button>
        <button class="flag--active" :disabled="totalNpcCount === 0" @click="onDeploy">Deploy</button>
      </div>
    </template>
  </ModalShell>
</template>

<style scoped>
.deploy__layout {
  display: flex;
  flex-wrap: wrap;
}

.deploy__sidebar {
  flex: 1 1 240px;
  max-width: 360px;
  min-width: 0;
}

.deploy__row {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  cursor: pointer;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.deploy__row:hover,
.deploy__row.flag--active {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
}

.deploy__detail {
  flex: 1 1 320px;
  min-width: 0;
}

.deploy__name {
  flex: 1;
  min-width: 0;
}

.deploy__count {
  text-align: center;
}
</style>

<style>
#modal-deploy-npc {
  width: min(94vw, 760px);
  max-height: calc(100vh - 32px);
}
</style>
