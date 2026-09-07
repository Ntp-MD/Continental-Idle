<script setup lang="ts">
import { ref, computed, inject, defineAsyncComponent } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../../composables/useAsyncAction'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
const NpcManagerModal = defineAsyncComponent(() => import('../modals/NpcManagerModal.vue'))
const FloorModal = defineAsyncComponent(() => import('../modals/FloorModal.vue'))
const DeployNpcModal = defineAsyncComponent(() => import('../modals/DeployNpcModal.vue'))
const SettingsModal = defineAsyncComponent(() => import('../modals/SettingsModal.vue'))
import { useNpcSimulation } from '../../composables/useNpcSimulation'

const store = useAssetsStore()
const toast = useToast()
const previewActive = computed(() => store.state.mode === 'npc-preview')
const { pending, run } = useAsyncAction()
const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
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

function onSwitchMode(mode: 'object' | 'draw' | 'move') {
  if (previewActive.value) {
    // In NPC preview only the Move tool is allowed; it must never cancel the deployment. Panning is done by dragging the canvas in preview.

    return
  }
  store.setMode(mode)
}

function onSyncToGame() {
  if (store.syncToGame()) toast.success('Blueprint synced to game')
  else toast.error('Blueprint sync failed')
}
</script>

<template>
  <div class="editor__toolbar">
    <button title="Settings" aria-label="Settings" :disabled="previewActive" @click="showSettings = true">
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
      :disabled="previewActive"
      :class="{ 'flag--active': store.state.mode === 'object' && !store.state.wallPaint }"
      aria-label="Switch to object mode"
      @click="onSwitchMode('object')"
    >
      Object
    </button>
    <button
      :disabled="previewActive"
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
      :disabled="previewActive"
      title="Draw walls on tile boundaries"
      aria-label="Toggle draw wall tool"
      @click="store.setWallPaint(!store.state.wallPaint)"
    >
      Draw Wall
    </button>

    <button title="Configure NPC roles and tags" aria-label="Open NPC manager" :disabled="previewActive" @click="onNpcManager">
      NPC Manager
    </button>
    <button
      :disabled="pending || previewActive"
      title="Re-resolve every placed object from its origin asset and rebuild walkable layout"
      aria-label="Refresh all placed objects from origins"
      @click="onSyncOrigins"
    >
      Refresh Objects
    </button>
    <button
      :disabled="previewActive"
      title="Manage floors: add, delete, reorder, role restrictions"
      aria-label="Open floor manager"
      @click="onFloorManager"
    >
      Floor Manager
    </button>
    <button
      :disabled="previewActive"
      title="Open UI showcase (all primitives and components)"
      aria-label="Open UI showcase"
      @click="onOpenShowcase"
    >
      UI Showcase
    </button>

    <button
      :disabled="previewActive"
      :class="{ 'flag--active': store.state.mode === 'npc-preview' }"
      title="Deploy NPCs on current floor (configure roles first)"
      @click="onDeployNpc"
    >
      Deploy NPCs
    </button>

    <button
      :disabled="previewActive"
      class="flag--success editor__toolbar--spacer"
      title="Apply blueprint layout to the main game"
      aria-label="Sync blueprint to game"
      @click="onSyncToGame"
    >
      Sync Game
    </button>

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
</style>
