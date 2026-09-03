<script setup lang="ts">
import { ref, computed, inject, onUnmounted, defineAsyncComponent } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAsyncAction } from '../../composables/useAsyncAction'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
const NpcManagerModal = defineAsyncComponent(() => import('../modals/NpcManagerModal.vue'))
const FloorModal = defineAsyncComponent(() => import('../modals/FloorModal.vue'))
const DeployNpcModal = defineAsyncComponent(() => import('../modals/DeployNpcModal.vue'))
const SettingsModal = defineAsyncComponent(() => import('../modals/SettingsModal.vue'))
import ModalShell from './ModalShell.vue'
import { useNpcSimulation } from '../../composables/useNpcSimulation'

const store = useAssetsStore()
const toast = useToast()
const confirm = useConfirm().confirm
const { pending, run } = useAsyncAction()
const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
const { npcs, isPaused, pause, resume, reset, stop, simSpeed } = npcSimulation
const showNpcManager = ref(false)
const showFloorModal = ref(false)
const showDeployModal = ref(false)
const showSettings = ref(false)

function onNpcManager() {
  showNpcManager.value = true
}

function onFloorManager() {
  showFloorModal.value = true
}

function onDeployNpc() {
  const hasRoles = (store.state.layout.npcConfig?.roles?.length ?? 0) > 0
  if (!hasRoles) {
    toast.info('Configure NPC roles first')
    showNpcManager.value = true
    return
  }
  showDeployModal.value = true
}

function onOpenShowcase() {
  const url = new URL(window.location.href)
  url.searchParams.set('showcase', '1')
  window.location.assign(url)
}

function onConfirmDeploy(spawnFloorId?: string) {
  showDeployModal.value = false
  store.setMode('npc-preview')
  npcSimulation.deploy(store.state.currentFloorId, spawnFloorId || undefined)
}

async function onSyncOrigins() {
  try {
    const refreshedCount = await run(async () => {
      const count = await store.refreshOriginInstances()
      npcSimulation.refresh()
      return count
    })
    toast.success(`Origins refreshed${refreshedCount ? ` - ${refreshedCount} instances rebuilt` : ''}`)
  } catch {
    toast.error('Failed to refresh origins')
  }
}

const total = computed(() => npcs.value.length)
const currentFloorLabel = computed(() => store.currentFloor.value?.label ?? '-')
const countsByRole = computed(() => {
  const map = new Map<string, number>()
  for (const npc of npcs.value) map.set(npc.type, (map.get(npc.type) ?? 0) + 1)
  return map
})

function onTogglePause() {
  if (isPaused.value) resume()
  else pause()
}

const NPC_STATUS_ORDER = ['walking', 'interacting', 'queued', 'waiting', 'idle'] as const
type NpcStatusKey = (typeof NPC_STATUS_ORDER)[number]
const NPC_STATUS_LABELS: Record<NpcStatusKey, string> = {
  walking: 'Moving',
  interacting: 'Interacting',
  queued: 'Queued',
  waiting: 'Waiting',
  idle: 'Idle',
}
const statusCounts = ref<{ key: NpcStatusKey; label: string; count: number }[]>([])
const statusTimer = window.setInterval(() => {
  if (store.state.mode !== 'npc-preview') return
  const counts = new Map<string, number>()
  for (const npc of npcs.value) counts.set(npc.status, (counts.get(npc.status) ?? 0) + 1)
  const next = NPC_STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    key: status,
    label: NPC_STATUS_LABELS[status],
    count: counts.get(status)!,
  }))
  const prev = statusCounts.value
  if (prev.length === next.length && prev.every((p, i) => p.key === next[i].key && p.count === next[i].count)) return
  statusCounts.value = next
}, 300)
onUnmounted(() => window.clearInterval(statusTimer))

async function onReset() {
  const confirmed = await confirm({
    title: 'Clear Simulation',
    message: 'Remove all deployed NPCs and exit preview?',
    confirmLabel: 'Clear',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  reset()
  store.setMode('move')
}
function onExitDeploy() {
  stop()
  store.setMode('move')
}
function onSwitchMode(mode: 'object' | 'draw' | 'move') {
  if (store.state.mode === 'npc-preview') stop()
  store.setMode(mode)
}

function onSyncToGame() {
  if (store.syncToGame()) toast.success('Blueprint synced to game')
  else toast.error('Blueprint sync failed')
}
</script>

<template>
  <div class="editor__toolbar">
    <button title="Settings" aria-label="Settings" @click="showSettings = true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <button
      :class="{ 'flag--active': store.state.mode === 'object' && !store.state.wallPaint }"
      aria-label="Switch to object mode"
      @click="onSwitchMode('object')"
    >
      Object
    </button>
    <button
      :class="{ 'flag--active': store.state.mode === 'draw' && !store.state.wallPaint }"
      aria-label="Switch to draw mode"
      @click="onSwitchMode('draw')"
    >
      Draw Object
    </button>
    <button
      :class="{ 'flag--active': store.state.mode === 'move' && !store.state.wallPaint }"
      aria-label="Switch to move mode"
      @click="onSwitchMode('move')"
    >
      Move
    </button>
    <button
      :class="{ 'flag--active': store.state.wallPaint }"
      :disabled="store.state.mode === 'npc-preview'"
      title="Draw walls on tile boundaries"
      aria-label="Toggle draw wall tool"
      @click="store.setWallPaint(!store.state.wallPaint)"
    >
      Draw Wall
    </button>

    <button title="Configure NPC roles and tags" aria-label="Open NPC manager" @click="onNpcManager">
      NPC Manager
    </button>
    <button
      :disabled="pending"
      title="Re-resolve every placed object from its origin asset and rebuild walkable layout"
      aria-label="Refresh all placed objects from origins"
      @click="onSyncOrigins"
    >
      Refresh Objects
    </button>
    <button
      title="Manage floors: add, delete, reorder, role restrictions"
      aria-label="Open floor manager"
      @click="onFloorManager"
    >
      Floor Manager
    </button>
    <button
      title="Open UI showcase (all primitives and components)"
      aria-label="Open UI showcase"
      @click="onOpenShowcase"
    >
      UI Showcase
    </button>

    <button
      :class="{ 'flag--active': store.state.mode === 'npc-preview' }"
      title="Deploy NPCs on current floor (configure roles first)"
      @click="onDeployNpc"
    >
      Deploy NPCs
    </button>

    <button
      class="flag--success editor__toolbar--spacer"
      title="Apply blueprint layout to the main game"
      aria-label="Sync blueprint to game"
      @click="onSyncToGame"
    >
      Sync Game
    </button>

    <ModalShell
      :open="store.state.mode === 'npc-preview'"
      modal-id="modal-npc-preview"
      title="NPC Preview"
      width="min(94vw, 340px)"
      max-width="340px"
      floating
      @close="onExitDeploy"
    >
      <div class="form__row">
        <div class="form__col">
          <strong>{{ currentFloorLabel }}</strong>
          <span>{{ total }} NPC{{ total === 1 ? '' : 's' }}</span>
        </div>
        <span class="badge" :class="isPaused ? 'flag--warning' : 'flag--success'" role="status">{{
          isPaused ? 'Paused' : 'Running'
        }}</span>
        <div class="form__row form--wrap">
          <span v-for="[type, count] in countsByRole" :key="type" class="npc__role">
            <span>{{ type }}</span>
            <b>{{ count }}</b>
          </span>
        </div>
      </div>
      <div v-if="total > 0" class="form__row form--wrap">
        <span v-for="s in statusCounts" :key="s.key" class="form__hint"> {{ s.label }} <b>{{ s.count }}</b> </span>
      </div>
      <template #footer>
        <div class="form__row form--wrap">
          <button
            type="button"
            :aria-label="isPaused ? 'Resume NPC simulation' : 'Pause NPC simulation'"
            @click="onTogglePause"
          >
            {{ isPaused ? 'Resume' : 'Pause' }}
          </button>
          <div class="form__row" role="group" aria-label="Simulation speed">
            <button
              v-for="s in [1, 2, 4, 8]"
              :key="s"
              type="button"
              :class="{ 'flag--active': simSpeed === s }"
              :aria-pressed="simSpeed === s"
              @click="simSpeed = s"
            >
              {{ s }}x
            </button>
          </div>
          <button type="button" class="flag--danger" aria-label="Clear all NPCs and exit preview" @click="onReset">
            Clear
          </button>
        </div>
      </template>
    </ModalShell>

    <ErrorBoundary>
      <NpcManagerModal :open="showNpcManager" @close="showNpcManager = false" />
      <FloorModal :open="showFloorModal" @close="showFloorModal = false" />
      <DeployNpcModal :open="showDeployModal" @close="showDeployModal = false" @deploy="onConfirmDeploy" />
      <SettingsModal :open="showSettings" @close="showSettings = false" />
    </ErrorBoundary>
  </div>
</template>

<style scoped>
.editor__toolbar {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-dim);
  color: var(--text-primary);
  flex-wrap: wrap;
  overflow: visible;
  flex-shrink: 0;
  position: relative;
}

.editor__toolbar--spacer {
  margin-left: auto;
}

.npc__role {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xxs) var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.npc__role b {
  color: var(--accent-blue);
}
</style>
