<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useAssetsStore } from '../blueprint-store'
import { useToast } from '../composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import FloorTabs from './FloorTabs.vue'
import NpcSettingsModal from './NpcSettingsModal.vue'
import { useNpcSimulation } from '../composables/useNpcSimulation'

const store = useAssetsStore()
const toast = useToast()
const emit = defineEmits<{ close: [] }>()
const { pending, run } = useAsyncAction()
const npcSimulation = inject('npcSimulation') as ReturnType<typeof useNpcSimulation>
const { npcs, isPaused, pause, resume, stop, reset } = npcSimulation
const showNpcSettings = ref(false)
const showShortcuts = ref(false)

function onNpcSettings() {
  showNpcSettings.value = true
}

function onDeployNpc() {
  const hasRoles = (store.state.layout.npcConfig?.roles?.length ?? 0) > 0
  if (!hasRoles) {
    toast.info('Configure NPC roles first')
    showNpcSettings.value = true
    return
  }
  store.setMode('npc-preview')
  npcSimulation.deploy(store.state.currentFloorId)
}

const total = computed(() => npcs.value.length)
const countsByRole = computed(() => {
  const map = new Map<string, number>()
  for (const npc of npcs.value) map.set(npc.type, (map.get(npc.type) ?? 0) + 1)
  return map
})
function onTogglePause() { isPaused.value ? resume() : pause() }
function onStop() { stop() }
function onReset() { reset() }
function onClose() { stop(); store.setMode('object'); emit('close') }

const widthInput = ref(store.state.layout.canvas.width)
const heightInput = ref(store.state.layout.canvas.height)
const tileInput = ref(store.state.layout.canvas.tileSize)

watch(() => store.state.layout.canvas, (c) => {
  widthInput.value = c.width
  heightInput.value = c.height
  tileInput.value = c.tileSize
})

async function applyCanvasSize() {
  const ok = window.confirm('Changing canvas size will re-snap all rooms/objects to the new grid. Continue?')
  if (!ok) return
  await run(() => store.resizeCanvas(widthInput.value, heightInput.value, tileInput.value)).catch(() => {})
  toast.info('Canvas resized')
}

async function onSave() {
  await run(() => store.saveLayout()).catch(() => {})
  toast.success('Layout saved')
}

async function onClear() {
  if (!window.confirm('Clear all rooms and objects on this floor?')) return
  try {
    await store.clearFloor(store.state.currentFloorId)
    toast.info('Floor cleared')
  } catch {
    toast.error('Clear floor failed')
  }
}

async function onClearAll() {
  if (!window.confirm('Clear ALL rooms and objects on EVERY floor?')) return
  try {
    await store.clearAllFloors()
    toast.info('All floors cleared')
  } catch {
    toast.error('Clear all floors failed')
  }
}


</script>

<template>
  <div class="editor__toolbar">
    <div class="editor__toolbar__group">
      <button class="btn btn__ghost btn__icon" @click="showShortcuts = !showShortcuts" title="Keyboard Shortcuts" aria-label="Keyboard shortcuts">?</button>
    </div>

    <div class="editor__toolbar__group">
      <label class="editor__toolbar__field">
        <span>W</span>
        <input class="input" type="number" v-model.number="widthInput" min="100" step="25" />
      </label>
      <label class="editor__toolbar__field">
        <span>H</span>
        <input class="input" type="number" v-model.number="heightInput" min="100" step="25" />
      </label>
      <label class="editor__toolbar__field">
        <span>Tile</span>
        <input class="input" type="number" v-model.number="tileInput" min="5" step="5" />
      </label>
      <button class="btn" @click="applyCanvasSize">Apply</button>
    </div>

    <div class="editor__toolbar__group editor__toolbar__group__mode">
      <button
        class="btn"
        :class="{ 'btn__warning': store.state.mode === 'wall' }"
        @click="store.setMode('wall')"
      >Wall</button>
      <button
        class="btn"
        :class="{ 'btn__warning': store.state.mode === 'zone' }"
        @click="store.setMode('zone')"
      >Zone</button>
      <button
        class="btn"
        :class="{ 'btn__warning': store.state.mode === 'object' }"
        @click="store.setMode('object')"
      >Object</button>
      <button
        class="btn"
        :class="{ 'btn__warning': store.state.mode === 'move' }"
        @click="store.setMode('move')"
      >Move</button>
      <button
        class="btn"
        :class="{ 'btn__warning': store.state.mode === 'erase' }"
        @click="store.setMode('erase')"
        title="Erase wall tiles (click room edges to trim)"
      >Erase</button>
    </div>

    <div class="editor__toolbar__group editor__toolbar__group__npc__mode">
      <button
        class="btn"
        @click="onNpcSettings"
        title="Configure NPC roles, tasks, and behavior"
      >NPC Settings</button>
      <button
        class="btn"
        :class="{ 'btn__warning': store.state.mode === 'npc-preview' }"
        @click="onDeployNpc"
        title="Deploy NPCs on current floor (configure roles first)"
      >Deploy NPCs</button>
    </div>

    <div v-if="store.state.mode === 'npc-preview'" class="editor__toolbar__group editor__toolbar__group__npc">
      <div class="editor__toolbar__npc__counter">Total: {{ total }}</div>
      <div class="editor__toolbar__npc__roles">
        <div v-for="[type, count] in countsByRole" :key="type" class="editor__toolbar__npc__role">
          <span class="editor__toolbar__npc__role__name">{{ type }}</span>
          <span class="editor__toolbar__npc__role__count">{{ count }}</span>
        </div>
      </div>
      <button class="btn" @click="onTogglePause">{{ isPaused ? 'Resume' : 'Pause' }}</button>
      <button class="btn" @click="onStop">Stop</button>
      <button class="btn btn__danger" @click="onReset">Reset</button>
      <button class="btn" @click="onClose">Close</button>
    </div>

    <div class="editor__toolbar__group">
      <button class="btn btn__primary" :disabled="pending" @click="onSave" title="Save layout to assets-store.ts">Save</button>
      <button class="btn btn__danger" :disabled="pending" @click="onClear" title="Clear all rooms and objects on this floor">Clear Floor</button>
      <button class="btn btn__danger" :disabled="pending" @click="onClearAll" title="Clear all rooms and objects on every floor">Clear All Floors</button>
    </div>

    <div class="editor__toolbar__group editor__toolbar__group__sync">
      <FloorTabs />
    </div>

    <NpcSettingsModal :open="showNpcSettings" @close="showNpcSettings = false" />

    <Teleport to="body">
      <div v-if="showShortcuts" class="editor__shortcuts__overlay" @click.self="showShortcuts = false">
        <div class="editor__shortcuts__panel">
          <div class="editor__shortcuts__header">
            <span>Keyboard Shortcuts</span>
            <button class="btn btn__ghost btn__icon" @click="showShortcuts = false" aria-label="Close">✕</button>
          </div>
          <div class="editor__shortcuts__body">
            <div class="editor__shortcuts__row"><kbd>Delete</kbd><span>Delete selected</span></div>
            <div class="editor__shortcuts__row"><kbd>R</kbd><span>Rotate object</span></div>
            <div class="editor__shortcuts__row"><kbd>L</kbd><span>Lock/unlock object</span></div>
            <div class="editor__shortcuts__row"><kbd>Ctrl+C</kbd><span>Copy selected</span></div>
            <div class="editor__shortcuts__row"><kbd>Ctrl+V</kbd><span>Paste objects</span></div>
            <div class="editor__shortcuts__row"><kbd>Ctrl+L</kbd><span>Link selected objects</span></div>
            <div class="editor__shortcuts__row"><kbd>Shift+Click</kbd><span>Add to selection</span></div>
            <div class="editor__shortcuts__row"><kbd>Arrow Keys</kbd><span>Move selected by 1 tile</span></div>
            <div class="editor__shortcuts__row"><kbd>Space+Drag</kbd><span>Pan canvas</span></div>
            <div class="editor__shortcuts__row"><kbd>Ctrl+0</kbd><span>Fit to screen</span></div>
            <div class="editor__shortcuts__row"><kbd>+/-</kbd><span>Zoom in/out</span></div>
            <div class="editor__shortcuts__row"><kbd>Esc</kbd><span>Deselect / cancel drag</span></div>
          </div>
        </div>
      </div>
    </Teleport>
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
  min-height: 48px;
}

.editor__toolbar__group {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.editor__toolbar__group__mode,
.editor__toolbar__group__npc__mode,
.editor__toolbar__group__npc,
.editor__toolbar__group__sync {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.editor__toolbar__field {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.editor__toolbar__field span {
  font-size: var(--font-xs);
  color: var(--text-primary);
  opacity: 0.7;
}

.editor__toolbar__field input {
  width: 48px;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  color: var(--text-primary);
  padding: 3px var(--gap-xs);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  transition: border-color var(--duration-fast) ease-out;
}

.editor__toolbar__field input:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-gold) 15%, transparent);
}

.editor__toolbar__npc__counter,
.editor__toolbar__npc__role__count {
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}

.editor__toolbar__npc__roles {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  flex-wrap: wrap;
}

.editor__toolbar__npc__role {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}

.editor__toolbar__npc__role__name {
  font-weight: 500;
}

.editor__shortcuts__overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg-primary) 60%, transparent);
}

.editor__shortcuts__panel {
  width: min(360px, calc(100vw - 32px));
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
}

.editor__shortcuts__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  font-weight: 600;
  font-size: var(--font-md);
}

.editor__shortcuts__body {
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  max-height: 60vh;
  overflow-y: auto;
}

.editor__shortcuts__row {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
  font-size: var(--font-sm);
}

.editor__shortcuts__row kbd {
  display: inline-block;
  min-width: 100px;
  padding: 2px var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  color: var(--accent-gold);
  text-align: center;
}

.editor__shortcuts__row span {
  color: var(--text-secondary);
}
</style>