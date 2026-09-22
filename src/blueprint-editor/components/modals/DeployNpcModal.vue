<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDebouncedCallback } from '@/composables/useDebounceFn'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { useAssetsStore, emptyNpcConfig, cloneDeepRaw } from '../../blueprintStore'
import { validateSettingsCompleteness } from '../../assets/validation'
import {
  normalizeNpcConfig,
  type NpcSimulationConfig,
} from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'
import TagChip from '../inputs/TagChip.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'deploy', spawnFloorId: string): void; (e: 'open-npc-manager'): void }>()

const store = useAssetsStore()
const { pending, run } = useAsyncAction()
const status = ref('')
const statusTone = ref<'' | 'warn' | 'fail'>('')

if (!store.state.layout.npcConfig) {
  store.state.layout.npcConfig = emptyNpcConfig()
}

const draft = ref<NpcSimulationConfig>(cloneDeepRaw(store.state.layout.npcConfig))
const spawnFloorId = ref('')

const roles = computed(() => draft.value.roles)
const floors = computed(() => store.state.layout.floors)
const selectedRoleId = ref('')
const selectedRole = computed(() => roles.value.find((role) => role.id === selectedRoleId.value) ?? roles.value[0])

const schedulePersist = useDebouncedCallback(() => {
  const normalized = normalizeNpcConfig(draft.value)
  if (normalized) void store.updateNpcConfig(normalized)
}, 400)

watch(
  () => props.open,
  (open) => {
    status.value = ''
    statusTone.value = ''
    if (open && store.state.layout.npcConfig) {
      draft.value = cloneDeepRaw(store.state.layout.npcConfig)
    }
  },
)

function getPoolCount(roleId: string): number {
  return draft.value.pool.find((p) => p.roleId === roleId)?.count ?? 0
}

function getPoolFloorIds(roleId: string): string[] {
  return draft.value.pool.find((p) => p.roleId === roleId)?.floorIds ?? []
}

const totalNpcCount = computed(() => draft.value.pool.reduce((sum, p) => sum + p.count, 0))

async function persistDraft(): Promise<void> {
  const normalized = normalizeNpcConfig(draft.value)
  if (normalized) await store.updateNpcConfig(normalized)
}

async function onClose() {
  schedulePersist.cancel()
  await persistDraft()
  emit('close')
}

function openNpcManager() {
  schedulePersist.cancel()
  void persistDraft().then(() => emit('open-npc-manager'))
}

async function onDeploy() {
  if (pending.value) return
  if (totalNpcCount.value === 0) {
    status.value = 'Set at least one NPC count before deploying'
    statusTone.value = 'warn'
    return
  }
  const gated = validateSettingsCompleteness(store.state.layout, store.assetMap(), draft.value).issues.filter(
    (issue) => issue.includes('spawn rule targets tags'),
  )
  if (gated.length > 0) {
    status.value = gated[0] + (gated.length > 1 ? ` (+${gated.length - 1} more)` : '')
    statusTone.value = 'fail'
    return
  }
  status.value = ''
  statusTone.value = ''
  schedulePersist.cancel()
  await run(() => persistDraft())
  emit('deploy', spawnFloorId.value)
}
</script>

<template>
  <ModalShell
    :open="open"
    modal-id="modal-deploy-npc"
    title="Deploy NPCs"
    :status="status"
    :status-tone="statusTone"
    @close="onClose"
  >
    <div class="form__col form--section">
      <div>Simulation</div>
      <label class="form__row" for="deploy-npc-speed">
        <span>Walk speed</span>
        <input
          id="deploy-npc-speed"
          v-model.number="draft.speed"
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          @change="schedulePersist"
        />
        <output>{{ draft.speed.toFixed(2) }}</output>
      </label>
      <p class="form__hint">Base walking speed for every deployed NPC.</p>
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

    <div v-else class="form__row form--start form--wrap">
      <aside class="form__col deploy__sidebar">
        <div>Roles</div>
        <ul class="form__col">
          <li
            v-for="role in roles"
            :key="role.id"
            class="card__item"
            :class="{ 'flag--active': selectedRole?.id === role.id }"
            role="button"
            tabindex="0"
            :aria-pressed="selectedRole?.id === role.id"
            @click="selectedRoleId = role.id"
            @keydown.self.enter.prevent="selectedRoleId = role.id"
            @keydown.self.space.prevent="selectedRoleId = role.id"
          >
            <span class="swatch" :style="{ background: role.color }" />
            <strong class="size--stretch">{{ role.label }}</strong>
            <span
              class="badge"
              :title="`Deploy count for ${role.label} - edit counts in NPC Manager`"
              >{{ getPoolCount(role.id) }}</span
            >
          </li>
        </ul>
        <p class="form__hint">Edit counts in NPC Manager</p>
      </aside>

      <section v-if="selectedRole" class="form__col deploy__detail">
        <h3>Deployment: {{ selectedRole.label }}</h3>
        <template v-if="getPoolCount(selectedRole.id) > 0">
          <div class="form__col form--section">
            <div>Spawn Floors</div>
            <template v-if="!spawnFloorId">
              <ul v-if="getPoolFloorIds(selectedRole.id).length" class="form__row form--wrap">
                <li v-for="floor in floors" :key="`spawn-floor-${selectedRole.id}-${floor.id}`">
                  <span
                    v-if="getPoolFloorIds(selectedRole.id).includes(floor.id)"
                    class="card__item flag--active"
                  >
                    {{ floor.label }}
                  </span>
                </li>
              </ul>
              <p v-else class="form__hint">All floors</p>
            </template>
            <p v-else class="form__hint">Spawn floor is forced in Simulation above.</p>
          </div>
          <div class="form__col form--section">
            <div>Target Tags</div>
            <ul v-if="selectedRole.spawnRule?.targetTags?.length" class="form__row form--wrap">
              <li v-for="tag in selectedRole.spawnRule?.targetTags ?? []" :key="'st_' + selectedRole.id + tag">
                <TagChip :label="tag" />
              </li>
            </ul>
            <span v-else class="empty">No target tags</span>
          </div>
          <p class="form__hint">Edit spawn floors and target tags in NPC Manager</p>
          <button type="button" @click="openNpcManager">Open NPC Manager</button>
        </template>
        <template v-else>
          <p class="form__hint">Set a count above 0 in NPC Manager to deploy this role.</p>
          <button type="button" @click="openNpcManager">Open NPC Manager</button>
        </template>
      </section>
    </div>

    <template #footer>
      <span class="form__hint">Total: {{ totalNpcCount }} NPCs</span>
      <div class="form__row">
        <button @click="onClose">Cancel</button>
        <button class="flag--active" :disabled="totalNpcCount === 0 || pending" @click="onDeploy">Deploy</button>
      </div>
    </template>
  </ModalShell>
</template>

<style>
.deploy__sidebar {
  flex: 1 1 240px;
  max-width: 360px;
  min-width: 0;
}

.deploy__sidebar .card__item:hover {
  border-color: var(--accent-primary);
}

.deploy__detail {
  flex: 1 1 320px;
  min-width: 0;
}
</style>

<style>
#modal-deploy-npc {
  width: min(94vw, 760px);
  max-height: calc(100vh - 32px);
}
</style>
