<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../editor-store'
import { useToast } from '@/composables/useToast'
import { ROOM_CATEGORIES, ROOM_CATEGORY_LABELS } from '../editor-types'
import type { RoomCategory } from '../editor-types'
import FloorTabs from './FloorTabs.vue'

const store = useEditorStore()
const toast = useToast()

const widthInput = ref(store.state.layout.canvas.width)
const heightInput = ref(store.state.layout.canvas.height)
const tileInput = ref(store.state.layout.canvas.tileSize)

watch(() => store.state.layout.canvas, (c) => {
  widthInput.value = c.width
  heightInput.value = c.height
  tileInput.value = c.tileSize
})

function applyCanvasSize() {
  const ok = window.confirm('Changing canvas size will re-snap all rooms/objects to the new grid. Continue?')
  if (!ok) return
  store.resizeCanvas(widthInput.value, heightInput.value, tileInput.value)
  toast.info('Canvas resized')
}

function onExport() {
  store.exportJSON()
  toast.success('Layout exported')
}

const fileInput = ref<HTMLInputElement | null>(null)

function onImportClick() {
  fileInput.value?.click()
}

function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ok = window.confirm('Import this file? Current layout will be replaced (use Undo to revert).')
  if (!ok) {
    ;(e.target as HTMLInputElement).value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => store.importJSON(String(reader.result))
  reader.onerror = () => toast.error('Failed to read file')
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

function onClear() {
  if (!window.confirm('Clear all rooms and objects on this floor?')) return
  store.clearFloor(store.state.currentFloorId)
  toast.info('Floor cleared')
}

function onLoadLobbyPreset() {
  const ok = window.confirm('Load lobby preset onto F1? This will replace all rooms and objects on the Lobby floor.')
  if (!ok) return
  const success = store.applyLobbyPreset()
  if (success) {
    toast.success('Lobby preset loaded on F1')
  } else {
    toast.error('Lobby floor (F1) not found')
  }
}

function onSync() {
  const ok = window.confirm(
    'Sync layout to game?\n\n' +
    'This will overwrite the in-game floor layouts with your editor rooms.\n' +
    'Note: Objects (furniture, doors) are not synced — only room layouts.\n' +
    'Only floors G through F11 are synced (floors F12+ are not yet supported).\n' +
    'You MUST restart the game for changes to take effect.\n\n' +
    'Continue?'
  )
  if (!ok) return
  const success = store.syncToGame()
  if (success) {
    toast.success('Layout synced! Restart the game to apply changes.')
  }
}

const draftName = ref('')
const showDraftPanel = ref(false)
const draftList = ref<{ id: string; name: string; timestamp: number }[]>([])

function refreshDrafts() {
  draftList.value = store.loadDrafts()
}

function onSaveDraft() {
  const name = draftName.value.trim() || `Draft ${new Date().toLocaleString()}`
  const success = store.saveDraft(name)
  if (success) {
    toast.success(`Draft saved: ${name}`)
    draftName.value = ''
    refreshDrafts()
  }
}

function onLoadDraft(id: string) {
  const ok = window.confirm('Load this draft? Current layout will be replaced.')
  if (!ok) return
  const success = store.loadDraft(id)
  if (success) {
    toast.success('Draft loaded')
    showDraftPanel.value = false
  }
}

function onDeleteDraft(id: string) {
  if (!window.confirm('Delete this draft? This cannot be undone.')) return
  store.deleteDraft(id)
  toast.info('Draft deleted')
  refreshDrafts()
}

function toggleDraftPanel() {
  showDraftPanel.value = !showDraftPanel.value
  if (showDraftPanel.value) refreshDrafts()
}

function onDraftOutsideClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.editor-toolbar__draft-popup') && !el.closest('.editor-toolbar__btn--drafts-toggle')) {
    showDraftPanel.value = false
  }
}

function onDraftKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showDraftPanel.value) showDraftPanel.value = false
}

onMounted(() => {
  document.addEventListener('click', onDraftOutsideClick)
  document.addEventListener('keydown', onDraftKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onDraftOutsideClick)
  document.removeEventListener('keydown', onDraftKeydown)
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
      <select
        v-if="store.state.mode === 'wall'"
        class="editor-toolbar__wall-cat"
        :value="store.state.wallCategory"
        @change="store.state.wallCategory = ($event.target as HTMLSelectElement).value as RoomCategory"
        title="Room category for new walls"
      >
        <option v-for="cat in ROOM_CATEGORIES" :key="cat" :value="cat">{{ ROOM_CATEGORY_LABELS[cat] }}</option>
      </select>
    </div>

    <div class="editor-toolbar__group">
      <button class="editor-toolbar__btn" :disabled="!store.canUndo.value" @click="store.undo()">Undo</button>
      <button class="editor-toolbar__btn" :disabled="!store.canRedo.value" @click="store.redo()">Redo</button>
    </div>

    <div class="editor-toolbar__group">
      <button class="editor-toolbar__btn" @click="onExport">Export</button>
      <button class="editor-toolbar__btn" @click="onImportClick">Import</button>
      <input ref="fileInput" type="file" accept="application/json" class="editor-toolbar__file" @change="onImportFile" />
      <button class="editor-toolbar__btn" @click="onLoadLobbyPreset">Load Lobby</button>
      <button class="editor-toolbar__btn editor-toolbar__btn--danger" @click="onClear">Clear Floor</button>
    </div>

    <div class="editor-toolbar__group">
      <input
        class="editor-toolbar__draft-input"
        v-model="draftName"
        placeholder="Draft name..."
        @keydown.enter="onSaveDraft"
      />
      <button class="editor-toolbar__btn editor-toolbar__btn--draft" @click="onSaveDraft">Save Draft</button>
      <button class="editor-toolbar__btn editor-toolbar__btn--drafts-toggle" @click="toggleDraftPanel">Drafts</button>
    </div>

    <Teleport to="body">
      <div v-if="showDraftPanel" class="editor-toolbar__draft-popup" role="dialog" aria-modal="true" aria-labelledby="draft-popup-title">
        <div class="editor-toolbar__draft-popup-header">
          <span id="draft-popup-title">Drafts</span>
          <button class="editor-toolbar__draft-popup-close" @click="showDraftPanel = false">✕</button>
        </div>
        <div v-if="draftList.length === 0" class="editor-toolbar__draft-empty">No drafts saved</div>
        <div
          v-for="d in draftList"
          :key="d.id"
          class="editor-toolbar__draft-item"
        >
          <span class="editor-toolbar__draft-name">{{ d.name }}</span>
          <span class="editor-toolbar__draft-time">{{ new Date(d.timestamp).toLocaleString() }}</span>
          <button class="editor-toolbar__btn editor-toolbar__btn--small" @click="onLoadDraft(d.id)">Load</button>
          <button class="editor-toolbar__btn editor-toolbar__btn--small editor-toolbar__btn--danger" @click="onDeleteDraft(d.id)">Del</button>
        </div>
      </div>
    </Teleport>

    <div class="editor-toolbar__group editor-toolbar__group--sync">
      <FloorTabs />
      <button class="editor-toolbar__btn editor-toolbar__btn--sync" @click="onSync">Sync to Game</button>
    </div>
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

.editor-toolbar__btn:hover:not(:disabled):not(.editor-toolbar__btn--danger):not(.editor-toolbar__btn--sync):not(.editor-toolbar__btn--draft) {
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

.editor-toolbar__wall-cat {
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 140px;
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

.editor-toolbar__file {
  display: none;
}

.editor-toolbar__draft-input {
  width: 120px;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.editor-toolbar__btn--draft {
  background: var(--accent-blue, #4a9eff);
  color: #08090c;
  border-color: var(--accent-blue, #4a9eff);
  font-weight: bold;
}

.editor-toolbar__btn--draft:hover:not(:disabled) {
  opacity: 0.85;
}

.editor-toolbar__btn--small {
  padding: 3px 8px;
  font-size: 11px;
}

.editor-toolbar__draft-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 8px;
  padding: 0;
  z-index: 10000;
  min-width: 360px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
}

.editor-toolbar__draft-popup-header {
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

.editor-toolbar__draft-popup-close {
  background: none;
  border: none;
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
}

.editor-toolbar__draft-popup-close:hover {
  color: var(--accent-red, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

.editor-toolbar__draft-empty {
  text-align: center;
  color: var(--text-secondary, #a0a0a8);
  padding: 16px;
  font-size: 12px;
}

.editor-toolbar__draft-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.editor-toolbar__draft-item:last-child {
  border-bottom: none;
}

.editor-toolbar__draft-name {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary, #e8e8ec);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-toolbar__draft-time {
  font-size: 11px;
  color: var(--text-secondary, #a0a0a8);
  white-space: nowrap;
}
</style>
