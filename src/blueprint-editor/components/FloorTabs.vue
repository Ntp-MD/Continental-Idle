<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { sanitizeString } from '../../utils/sanitize'

const store = useAssetsStore()

const open = ref(false)
const editingId = ref<string | null>(null)
const editingNameRaw = ref('')
const editingName = computed({
  get: () => editingNameRaw.value,
  set: (v: string) => { editingNameRaw.value = sanitizeString(v) },
})
const dragIndex = ref<number | null>(null)
const containerRef = ref<HTMLElement>()
useFocusTrap(open, containerRef)

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
  if (!el.closest('.floor__overlay') && !el.closest('.floor__trigger')) close()
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
  editingNameRaw.value = name
}

async function commitRename() {
  if (editingId.value) {
    await store.renameFloor(editingId.value, editingNameRaw.value.trim() || 'Unnamed')
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

async function onToggleWalkable(floor: { id: string; name: string; defaultWalkable?: boolean }, e: Event) {
  floor.defaultWalkable = (e.target as HTMLInputElement).checked
  await store.renameFloor(floor.id, floor.name)
}
</script>

<template>
  <button class="floor__trigger" @click.stop="toggle">
    <span class="floor__trigger__label">{{ currentFloor?.label ?? '—' }}</span>
    <span class="floor__trigger__name">{{ currentFloor?.name ?? 'No Floor' }}</span>
    <span class="floor__trigger__caret" :class="{ 'floor__trigger__caretrotated': open }">▾</span>
  </button>

  <Teleport to="body">
    <div v-if="open" ref="containerRef" class="floor__overlay" role="dialog" aria-modal="true" aria-labelledby="floor__overlay__title" @click.self="close">
      <div class="floor__overlay__header">
        <span id="floor__overlay__title" class="floor__overlay__title">Floors ({{ store.state.layout.floors.length }})</span>
        <button class="btn__dashed" @click="async () => { await store.addFloor(); useToast().success('Floor added') }">+ Add</button>
        <button class="btn__ghost btn__icon btn__text__danger" aria-label="Close floor panel" @click="close">✕</button>
      </div>
      <div class="floor__overlay__body">
        <div
          v-for="(floor, index) in store.state.layout.floors"
          :key="floor.id"
          class="floor__overlay__item"
          :class="{ 'floor__overlay__active': floor.id === store.state.currentFloorId }"
          :title="floor.label + ' — ' + floor.name"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
          @click="store.selectFloor(floor.id)"
        >
          <span class="floor__overlay__dimlabel">{{ floor.label }}</span>
          <input
            v-if="editingId === floor.id"
            v-model="editingName"
            class="floor__overlay__dimlabel"
            aria-label="Rename floor"
            @click.stop
            @keydown.enter="commitRename"
            @blur="commitRename"
          />
          <span v-else class="floor__overlay__itembold" @dblclick.stop="startRename(floor.id, floor.name)">{{ floor.name }}</span>
          <label class="floor__overlay__walkable" title="Default walkable for empty areas on this floor" @click.stop>
            <input
              type="checkbox"
              :checked="floor.defaultWalkable ?? true"
              @change="onToggleWalkable(floor, $event)"
            />
            <span>Walk</span>
          </label>
          <button class="btn__ghost" title="Duplicate" aria-label="Duplicate floor" @click.stop="async () => { await store.duplicateFloor(floor.id); useToast().success('Floor duplicated') }">⧉</button>
          <button class="btn__ghost btn__text__danger" title="Delete" aria-label="Delete floor" @click.stop="onDeleteFloor(floor.id)">✕</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>


<style scoped>

.floor__trigger {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  cursor: pointer;
  flex-shrink: 0;
}

.floor__trigger:hover {
  border-color: var(--accent-gold);
}

.floor__trigger__label {
  font-size: var(--font-xs);
  opacity: 0.7;
  font-weight: 700;
  color: var(--accent-gold);
}

.floor__trigger__name {
  font-weight: 600;
  font-size: var(--font-sm);
}

.floor__trigger__caret {
  font-size: var(--font-xs);
  opacity: 0.7;
  color: var(--text-primary);
  transition: transform var(--duration-fast) ease-out;
}

.floor__trigger__caretrotated {
  transform: rotate(180deg);
}

.floor__overlay {
  position: fixed;
  bottom: 16px;
  left: 16px;
  width: 260px;
  max-width: calc(100vw - 32px);
  max-height: 40vh;
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

.floor__overlay__header {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-dim);
}

.floor__overlay__title {
  flex: 1;
  font-weight: 700;
  font-size: var(--font-sm);
}

.floor__overlay__body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.floor__overlay__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  padding: var(--gap-sm) var(--gap-md);
  border-bottom: 1px solid var(--border-dim);
  cursor: pointer;
  transition: background var(--duration-fast) ease-out;
}

.floor__overlay__item:hover {
  background: var(--bg-secondary);
}

.floor__overlay__itembold {
  font-weight: 500;
}

.floor__overlay__dimlabel {
  font-size: var(--font-xs);
  opacity: 0.7;
  flex: 1;
}

.floor__overlay__active {
  border-color: var(--accent-gold);
  background: color-mix(in srgb, var(--accent-gold) 12%, transparent);
}

.floor__overlay__walkable {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: var(--font-xs);
}</style>