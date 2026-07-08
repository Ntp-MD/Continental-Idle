<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAssetsStore } from '../assets-store'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import FloorTabs from './FloorTabs.vue'

const store = useAssetsStore()
const toast = useToast()
const { pending, run } = useAsyncAction()

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
  await run(() => store.resizeCanvas(widthInput.value, heightInput.value, tileInput.value))
  toast.info('Canvas resized')
}

async function onSave() {
  await run(() => store.saveLayout())
  toast.success('Layout saved')
}

function onUndo() {
  store.undo()
  toast.info('Undone')
}

function onRedo() {
  store.redo()
  toast.info('Redone')
}

function onClear() {
  if (!window.confirm('Clear all rooms and objects on this floor?')) return
  store.clearFloor(store.state.currentFloorId)
  toast.info('Floor cleared')
}

function onClearAll() {
  if (!window.confirm('Clear ALL rooms and objects on EVERY floor? This cannot be undone except via Undo.')) return
  store.clearAllFloors()
  toast.info('All floors cleared')
}

async function onSync() {
  const ok = window.confirm(
    'Sync layout to game?\n\n' +
    'This will overwrite the in-game floor layouts with your editor rooms.\n' +
    'Note: Objects (furniture, doors) and zones are not synced — only room layouts.\n' +
    'Only floors G through F11 are synced (floors F12+ are not yet supported).\n' +
    'You MUST restart the game for changes to take effect.\n\n' +
    'Continue?'
  )
  if (!ok) return
  await run(async () => {
    const success = store.syncToGame()
    if (success) {
      toast.success('Layout synced! Restart the game to apply changes.')
    } else {
      toast.error('Sync failed — check console for details')
    }
  })
}

const showHelp = ref(false)

function onHelpOutsideClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.editor-toolbar__help-popup') && !el.closest('[title="Keyboard shortcuts"]')) {
    showHelp.value = false
  }
}

function onHelpKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showHelp.value) showHelp.value = false
}

onMounted(() => {
  document.addEventListener('click', onHelpOutsideClick)
  document.addEventListener('keydown', onHelpKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onHelpOutsideClick)
  document.removeEventListener('keydown', onHelpKeydown)
})
</script>

<template>
  <div class="editor-toolbar">
    <div class="editor-toolbar__group">
      <label class="editor-toolbar__field">
        <span>W</span>
        <input type="number" v-model.number="widthInput" min="100" step="25" />
      </label>
      <label class="editor-toolbar__field">
        <span>H</span>
        <input type="number" v-model.number="heightInput" min="100" step="25" />
      </label>
      <label class="editor-toolbar__field">
        <span>Tile</span>
        <input type="number" v-model.number="tileInput" min="5" step="5" />
      </label>
      <button class="editor-toolbar__btn" @click="applyCanvasSize">Apply</button>
    </div>

    <div class="editor-toolbar__group editor-toolbar__group--mode">
      <button
        class="editor-toolbar__btn"
        :class="{ 'editor-toolbar__btn--active': store.state.mode === 'wall' }"
        @click="store.setMode('wall')"
      >Wall</button>
      <button
        class="editor-toolbar__btn"
        :class="{ 'editor-toolbar__btn--active': store.state.mode === 'object' }"
        @click="store.setMode('object')"
      >Object</button>
      <button
        class="editor-toolbar__btn"
        :class="{ 'editor-toolbar__btn--active': store.state.mode === 'move' }"
        @click="store.setMode('move')"
      >Move</button>
      <button
        class="editor-toolbar__btn"
        :class="{ 'editor-toolbar__btn--active': store.state.mode === 'erase' }"
        @click="store.setMode('erase')"
        title="Erase wall tiles (click room edges to trim)"
      >Erase</button>
    </div>

    <div class="editor-toolbar__group">
      <button class="editor-toolbar__btn" :disabled="!store.canUndo.value" @click="onUndo" title="Undo (Ctrl+Z)">Undo</button>
      <button class="editor-toolbar__btn" :disabled="!store.canRedo.value" @click="onRedo" title="Redo (Ctrl+Y or Ctrl+Shift+Z)">Redo</button>
      <button class="editor-toolbar__btn" @click="showHelp = !showHelp" title="Keyboard shortcuts">?</button>
    </div>

    <div class="editor-toolbar__group">
      <button class="editor-toolbar__btn editor-toolbar__btn--save" :disabled="pending" @click="onSave" title="Save layout to assets-store.ts">Save</button>
      <button class="editor-toolbar__btn editor-toolbar__btn--danger" :disabled="pending" @click="onClear" title="Clear all rooms and objects on this floor">Clear Floor</button>
      <button class="editor-toolbar__btn editor-toolbar__btn--danger" :disabled="pending" @click="onClearAll" title="Clear all rooms and objects on every floor">Clear All Floors</button>
    </div>

    <div class="editor-toolbar__group editor-toolbar__group--sync">
      <FloorTabs />
      <button class="editor-toolbar__btn editor-toolbar__btn--sync" :disabled="pending" @click="onSync" title="Sync room layouts to the game (G–F11 only)">Sync to Game</button>
    </div>

    <Teleport to="body">
      <div v-if="showHelp" class="editor-toolbar__help-popup" role="dialog" aria-modal="true" aria-labelledby="help-popup-title">
        <div class="editor-toolbar__help-header">
          <span id="help-popup-title">Keyboard Shortcuts</span>
          <button class="editor-toolbar__help-close" @click="showHelp = false">✕</button>
        </div>
        <div class="editor-toolbar__help-body">
          <div class="editor-toolbar__help-row"><kbd>Space</kbd><span>Pan canvas (hold + drag)</span></div>
          <div class="editor-toolbar__help-row"><kbd>Del</kbd><span>Delete selected</span></div>
          <div class="editor-toolbar__help-row"><kbd>R</kbd><span>Rotate selected object</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+Z</kbd><span>Undo</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+Y</kbd><span>Redo</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+Shift+Z</kbd><span>Redo (alt)</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+0</kbd><span>Fit to screen</span></div>
          <div class="editor-toolbar__help-row"><kbd>+</kbd><span>Zoom in</span></div>
          <div class="editor-toolbar__help-row"><kbd>-</kbd><span>Zoom out</span></div>
          <div class="editor-toolbar__help-row"><kbd>↑↓←→</kbd><span>Move selected by 1 tile</span></div>
          <div class="editor-toolbar__help-row"><kbd>Shift+click</kbd><span>Add/remove from multi-selection</span></div>
          <div class="editor-toolbar__help-row"><kbd>Drag empty area</kbd><span>Box select objects</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+G</kbd><span>Merge selected objects</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+Shift+G</kbd><span>Ungroup merged object</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+L</kbd><span>Link selected objects</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+Shift+L</kbd><span>Unlink object</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+C</kbd><span>Copy selected object(s)</span></div>
          <div class="editor-toolbar__help-row"><kbd>Ctrl+V</kbd><span>Paste object(s)</span></div>
          <div class="editor-toolbar__help-row"><kbd>L</kbd><span>Toggle lock on selected object</span></div>
          <div class="editor-toolbar__help-row"><kbd>Esc</kbd><span>Cancel drag / deselect</span></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: var(--bg-card, #161820);
  border-bottom: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  flex-wrap: nowrap;
  overflow-x: auto;
  flex-shrink: 0;
  position: relative;
}

.editor-toolbar__group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 12px;
  border-right: 1px solid var(--border-dim, #252530);
}

.editor-toolbar__group:last-child {
  border-right: none;
  padding-right: 0;
}

.editor-toolbar__field {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #a0a0a8);
}

.editor-toolbar__field input {
  width: 64px;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 4px 6px;
  border-radius: 4px;
}

.editor-toolbar__btn {
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.editor-toolbar__btn:hover:not(:disabled):not(.editor-toolbar__btn--danger):not(.editor-toolbar__btn--sync) {
  border-color: var(--accent-gold, #f0c040);
}

.editor-toolbar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-toolbar__btn--active {
  background: var(--accent-gold, #f0c040);
  color: #08090c;
  border-color: var(--accent-gold, #f0c040);
  font-weight: bold;
}

.editor-toolbar__btn--danger {
  color: var(--accent-red, #ef4444);
  border-color: var(--accent-red, #ef4444);
}

.editor-toolbar__btn--danger:hover:not(:disabled) {
  opacity: 0.85;
}

.editor-toolbar__group--sync {
  margin-left: auto;
  gap: 8px;
}

.editor-toolbar__btn--sync {
  background: var(--accent-green, #3dd68c);
  color: #08090c;
  border-color: var(--accent-green, #3dd68c);
  font-weight: bold;
}

.editor-toolbar__btn--sync:hover:not(:disabled) {
  opacity: 0.85;
}

.editor-toolbar__help-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 8px;
  z-index: 10000;
  min-width: 280px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
}

.editor-toolbar__help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-tertiary, #101216);
  border-bottom: 1px solid var(--border-dim, #252530);
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--text-primary, #e8e8ec);
}

.editor-toolbar__help-close {
  background: none;
  border: none;
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
}

.editor-toolbar__help-close:hover {
  color: var(--accent-red, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

.editor-toolbar__help-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-toolbar__help-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary, #a0a0a8);
}

.editor-toolbar__help-row kbd {
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  color: var(--text-primary, #e8e8ec);
  min-width: 70px;
  text-align: center;
}
</style>
