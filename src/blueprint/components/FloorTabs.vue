<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useEditorStore } from '../editor-store'
import { useToast } from '@/composables/useToast'

const store = useEditorStore()

const open = ref(false)
const editingId = ref<string | null>(null)
const editingName = ref('')
const dragIndex = ref<number | null>(null)

const currentFloor = computed(() =>
  store.state.layout.floors.find(f => f.id === store.state.currentFloorId)
)

function toggle() {
  open.value = !open.value
  if (!open.value) editingId.value = null
}

function close() {
  open.value = false
  editingId.value = null
}

function onOutside(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.floor-overlay') && !el.closest('.floor-trigger')) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  document.addEventListener('click', onOutside)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onOutside)
  document.removeEventListener('keydown', onKeydown)
})

function startRename(id: string, name: string) {
  editingId.value = id
  editingName.value = name
}

async function commitRename() {
  if (editingId.value) {
    await store.renameFloor(editingId.value, editingName.value.trim() || 'Unnamed')
    useToast().info('Floor renamed')
  }
  editingId.value = null
}

async function onDeleteFloor(id: string) {
  if (store.state.layout.floors.length <= 1) return
  if (!window.confirm('Delete this floor? This cannot be undone via UI (only Ctrl+Z).')) return
  await store.deleteFloor(id)
  useToast().info('Floor deleted')
}

function onDragStart(index: number) {
  dragIndex.value = index
}

async function onDrop(index: number) {
  if (dragIndex.value === null) return
  await store.reorderFloors(dragIndex.value, index)
  dragIndex.value = null
  useToast().info('Floors reordered')
}
</script>

<template>
  <button class="floor-trigger" @click.stop="toggle">
    <span class="floor-trigger__label">{{ currentFloor?.label ?? '—' }}</span>
    <span class="floor-trigger__name">{{ currentFloor?.name ?? 'No Floor' }}</span>
    <span class="floor-trigger__caret" :class="{ 'floor-trigger__caret--open': open }">▾</span>
  </button>

  <Teleport to="body">
    <div v-if="open" class="floor-overlay" role="dialog" aria-modal="true" aria-labelledby="floor-overlay-title" @click.stop>
      <div class="floor-overlay__header">
        <span id="floor-overlay-title" class="floor-overlay__title">Floors ({{ store.state.layout.floors.length }})</span>
        <button class="floor-overlay__add" @click="async () => { await store.addFloor(); useToast().success('Floor added') }">+ Add</button>
        <button class="floor-overlay__close" aria-label="Close floor panel" @click="close">✕</button>
      </div>
      <div class="floor-overlay__body">
        <div
          v-for="(floor, index) in store.state.layout.floors"
          :key="floor.id"
          class="floor-overlay__item"
          :class="{ 'floor-overlay__item--active': floor.id === store.state.currentFloorId }"
          :title="floor.label + ' — ' + floor.name"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
          @click="store.selectFloor(floor.id)"
        >
          <span class="floor-overlay__item-label">{{ floor.label }}</span>
          <input
            v-if="editingId === floor.id"
            v-model="editingName"
            class="floor-overlay__rename-input"
            @click.stop
            @keydown.enter="commitRename"
            @blur="commitRename"
          />
          <span v-else class="floor-overlay__item-name" @dblclick.stop="startRename(floor.id, floor.name)">{{ floor.name }}</span>
          <button class="floor-overlay__action" title="Duplicate" aria-label="Duplicate floor" @click.stop="async () => { await store.duplicateFloor(floor.id); useToast().success('Floor duplicated') }">⧉</button>
          <button class="floor-overlay__action floor-overlay__action--danger" title="Delete" aria-label="Delete floor" @click.stop="onDeleteFloor(floor.id)">✕</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.floor-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.floor-trigger:hover {
  border-color: var(--accent-gold, #f0c040);
}

.floor-trigger__label {
  font-weight: bold;
  color: var(--accent-gold, #f0c040);
}

.floor-trigger__name {
  color: var(--text-secondary, #a0a0a8);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.floor-trigger__caret {
  font-size: 10px;
  color: var(--text-dim, #6a6a74);
  transition: transform 0.15s;
}

.floor-trigger__caret--open {
  transform: rotate(180deg);
}

.floor-overlay {
  position: fixed;
  top: 60px;
  right: var(--floor-overlay-right, 280px);
  z-index: 9999;
  width: 260px;
  background: var(--bg-card, #161820);
  border: 1px solid var(--border-dim, #252530);
  border-radius: 6px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.floor-overlay__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-tertiary, #101216);
  border-bottom: 1px solid var(--border-dim, #252530);
}

.floor-overlay__title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim, #6a6a74);
  flex: 1;
}

.floor-overlay__add {
  background: transparent;
  border: 1px dashed var(--border-dim, #252530);
  color: var(--text-secondary, #a0a0a8);
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
  transition: all 0.1s;
}

.floor-overlay__add:hover {
  border-color: var(--accent-gold, #f0c040);
  color: var(--accent-gold, #f0c040);
}

.floor-overlay__close {
  background: none;
  border: none;
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
}

.floor-overlay__close:hover {
  color: var(--accent-red, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

.floor-overlay__body {
  padding: 4px;
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.floor-overlay__item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.1s;
  overflow: hidden;
}

.floor-overlay__item:hover {
  background: var(--bg-card-hover, #1c1e28);
}

.floor-overlay__item--active {
  background: var(--accent-gold-dim, rgba(240, 192, 64, 0.12));
}

.floor-overlay__item-label {
  font-weight: bold;
  color: var(--accent-gold, #f0c040);
  min-width: 24px;
  text-align: center;
  background: var(--bg-secondary, #0c0d10);
  border-radius: 3px;
  padding: 2px 4px;
  flex-shrink: 0;
}

.floor-overlay__item-name {
  color: var(--text-secondary, #a0a0a8);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.floor-overlay__rename-input {
  width: 90px;
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--accent-gold, #f0c040);
  color: var(--text-primary, #e8e8ec);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 11px;
}

.floor-overlay__action {
  background: none;
  border: none;
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.1s;
}

.floor-overlay__action:hover {
  color: var(--text-primary, #e8e8ec);
}

.floor-overlay__action--danger:hover {
  color: var(--accent-red, #ef4444);
}
</style>
