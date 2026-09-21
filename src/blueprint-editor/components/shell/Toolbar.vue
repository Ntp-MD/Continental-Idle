<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../../composables/useAsyncAction'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
const NpcManagerModal = defineAsyncComponent(() => import('../modals/NpcManagerModal.vue'))
const FloorModal = defineAsyncComponent(() => import('../modals/FloorModal.vue'))
const DeployNpcModal = defineAsyncComponent(() => import('../modals/DeployNpcModal.vue'))
const SettingsModal = defineAsyncComponent(() => import('../modals/SettingsModal.vue'))
const WorkspaceModal = defineAsyncComponent(() => import('../modals/WorkspaceModal.vue'))
const ShortcutsModal = defineAsyncComponent(() => import('./ShortcutsModal.vue'))
import { useNpcSimulation } from '../../composables/useNpcSimulation'
import { validateSettingsCompleteness } from '../../assets/validation'

const store = useAssetsStore()
const toast = useToast()
const isDev = import.meta.env.DEV
const previewActive = computed(() => store.state.mode === 'npc-preview')
const { pending, run } = useAsyncAction()
const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
const showNpcManager = ref(false)
const showFloorModal = ref(false)
const showDeployModal = ref(false)
const showSettings = ref(false)
const showWorkspace = ref(false)
const showShortcuts = ref(false)

function onHelpKey(e: KeyboardEvent) {
  if (e.key !== '?') return
  const el = e.target as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable))
    return
  showShortcuts.value = true
}

onMounted(() => window.addEventListener('keydown', onHelpKey))
onUnmounted(() => window.removeEventListener('keydown', onHelpKey))

function isWiringIssue(issue: string): boolean {
  return /spawn zone|post|pool|Task "|Role "|trigger rate/i.test(issue)
}

const wiringIssues = computed(() =>
  validateSettingsCompleteness(store.state.layout, store.assetMap(), store.state.layout.npcConfig).issues.filter(isWiringIssue),
)

function onNpcManager() {
  if (showDeployModal.value) {
    toast.info('Close the Deploy dialog first - it holds unsent changes')
    return
  }
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
  if (showNpcManager.value) {
    toast.info('Close the NPC Manager first - it holds unsent changes')
    return
  }
  showDeployModal.value = true
}

function openFloorFromNpc() {
  showNpcManager.value = false
  showFloorModal.value = true
}

function openNpcFromDeploy() {
  showDeployModal.value = false
  showNpcManager.value = true
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

async function onCreateFirstFloor() {
  try {
    const floor = await run(() => store.addFloor())
    if (floor) toast.success('Floor created')
    else toast.error('Failed to create a floor')
  } catch {
    toast.error('Failed to create a floor')
  }
}

function onSwitchMode(mode: 'object' | 'draw' | 'move') {
  if (previewActive.value) {
    // In NPC preview only the Move tool is allowed; it must never cancel the deployment. Panning is done by dragging the canvas in preview.

    return
  }
  store.setMode(mode)
}

function onTileBrush(brush: 'walkable' | 'blocked' | 'door') {
  if (previewActive.value) return
  store.setTileBrush(store.state.tileBrush === brush ? null : brush)
}

function onUndo() {
  if (previewActive.value) return
  void store.undo().then((ok) => {
    if (!ok) toast.info('Nothing left to undo')
  })
}

function onUndoKey(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
  const el = e.target as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable))
    return
  e.preventDefault()
  onUndo()
}

onMounted(() => window.addEventListener('keydown', onUndoKey))
onUnmounted(() => window.removeEventListener('keydown', onUndoKey))
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

    <button title="Keyboard shortcuts" aria-label="Keyboard shortcuts" @click="showShortcuts = true">?</button>

    <button
      title="Undo (Ctrl+Z)"
      aria-label="Undo last change"
      :disabled="!store.canUndo.value || previewActive"
      @click="onUndo"
    >
      Undo
    </button>

    <div class="form__row right--border">
      <span class="form__hint">Tools</span>
      <button
        :disabled="previewActive"
        :class="{ 'flag--active': store.state.mode === 'object' }"
        aria-label="Switch to free tool mode - select objects and wall/door tiles"
        @click="onSwitchMode('object')"
      >
        Free tool
      </button>
      <button
        :disabled="previewActive"
        :class="{ 'flag--active': store.state.mode === 'draw' }"
        aria-label="Switch to draw mode"
        @click="onSwitchMode('draw')"
      >
        Draw Object
      </button>
      <button
        :class="{ 'flag--active': store.state.mode === 'move' }"
        aria-label="Switch to move mode"
        @click="onSwitchMode('move')"
      >
        Move
      </button>
    </div>

    <div class="form__row right--border">
      <span class="form__hint">Floor paint</span>
      <button
        :disabled="previewActive"
        :class="{ 'flag--active': store.state.tileBrush === 'walkable' }"
        aria-label="Paint walkable tiles on the current floor"
        @click="onTileBrush('walkable')"
      >
        Walk
      </button>
      <button
        :disabled="previewActive"
        :class="{ 'flag--active': store.state.tileBrush === 'blocked' }"
        aria-label="Paint wall tiles on the current floor"
        @click="onTileBrush('blocked')"
      >
        Wall
      </button>
      <button
        :disabled="previewActive"
        :class="{ 'flag--active': store.state.tileBrush === 'door' }"
        aria-label="Paint door tiles on the current floor"
        @click="onTileBrush('door')"
      >
        Door
      </button>
    </div>

    <div class="form__row right--border">
      <span class="form__hint">Manage</span>
      <button
        title="Configure NPC roles and tags"
        aria-label="Open NPC manager"
        :disabled="previewActive"
        @click="onNpcManager"
      >
        NPC Manager
      </button>
      <span
        v-if="wiringIssues.length"
        class="badge flag--warning"
        role="status"
        :title="wiringIssues.join('\n')"
      >
        {{ wiringIssues.length }} wiring
      </span>
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
        title="Export or import the workspace as a JSON file"
        aria-label="Open workspace import and export"
        @click="showWorkspace = true"
      >
        Workspace
      </button>
      <button
        v-if="isDev"
        :disabled="previewActive"
        title="Open UI showcase (all primitives and components)"
        aria-label="Open UI showcase"
        @click="onOpenShowcase"
      >
        UI Showcase
      </button>
    </div>

    <div class="form__row right--border">
      <span class="form__hint">Preview</span>

      <button
        :disabled="previewActive"
        :class="{ 'flag--active': store.state.mode === 'npc-preview' }"
        title="Deploy NPCs on current floor (configure roles first)"
        @click="onDeployNpc"
      >
        Deploy NPCs
      </button>
    </div>

    <div v-if="!store.state.layout.floors.length" class="form__row right--border" role="status">
      <span class="form__hint">No floors yet</span>
      <button
        class="flag--active"
        :disabled="pending || previewActive"
        aria-label="Create the first floor"
        @click="onCreateFirstFloor"
      >
        Create first floor
      </button>
      <button :disabled="previewActive" aria-label="Import a workspace file" @click="showWorkspace = true">
        Import workspace
      </button>
    </div>

    <ErrorBoundary>
      <NpcManagerModal :open="showNpcManager" @close="showNpcManager = false" @open-floor-manager="openFloorFromNpc" />
      <FloorModal :open="showFloorModal" @close="showFloorModal = false" />
      <DeployNpcModal :open="showDeployModal" @close="showDeployModal = false" @deploy="onConfirmDeploy" @open-npc-manager="openNpcFromDeploy" />
      <SettingsModal :open="showSettings" @close="showSettings = false" />
      <WorkspaceModal :open="showWorkspace" @close="showWorkspace = false" />
      <ShortcutsModal :open="showShortcuts" @close="showShortcuts = false" />
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
</style>
