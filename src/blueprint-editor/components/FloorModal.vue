<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { sanitizeString } from '../../utils/sanitize'
import { resolveStreetTiles } from '../types'
import type { FloorData } from '../types'
import ModalShell from './ModalShell.vue'
const FloorWalkablePanel = defineAsyncComponent(() => import('./FloorWalkablePanel.vue'))

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const confirm = useConfirm().confirm

const selectedFloorId = ref<string | null>(null)
const editingName = ref(false)
const editingNameRaw = ref('')
const editingLabel = ref(false)
const editingLabelRaw = ref('')
const floorDragIndex = ref<number | null>(null)
const showWalkable = ref(false)

const floors = computed(() => store.state.layout.floors)
const availableRoles = computed(() => store.state.layout.npcConfig?.roles ?? [])

const selectedFloor = computed<FloorData | undefined>(
  () => floors.value.find((f) => f.id === selectedFloorId.value) ?? floors.value[0],
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedFloorId.value = store.state.currentFloorId ?? floors.value[0]?.id ?? null
      editingName.value = false
      editingLabel.value = false
    }
  },
)

function onClose() {
  emit('close')
}

function selectFloor(id: string) {
  selectedFloorId.value = id
  editingName.value = false
  editingLabel.value = false
}

function startEditName() {
  if (!selectedFloor.value) return
  editingName.value = true
  editingNameRaw.value = selectedFloor.value.name
}
async function commitName() {
  if (!selectedFloor.value) return
  const name = editingNameRaw.value.trim() || 'Unnamed'
  const saved = await store.renameFloor(selectedFloor.value.id, name)
  if (!saved) return toast.error('Failed to rename floor')
  toast.info('Floor renamed')
  editingName.value = false
}

function startEditLabel() {
  if (!selectedFloor.value) return
  editingLabel.value = true
  editingLabelRaw.value = selectedFloor.value.label
}
async function commitLabel() {
  if (!selectedFloor.value) return
  const label = editingLabelRaw.value.trim() || selectedFloor.value.label
  const saved = await store.updateFloor(selectedFloor.value.id, { label })
  if (!saved) return toast.error('Failed to save floor label')
  editingLabel.value = false
}

async function onAdd() {
  const floor = await store.addFloor()
  if (floor) toast.success('Floor added')
  else toast.error('Failed to add floor')
}

async function onDuplicate(id: string) {
  const duplicated = await store.duplicateFloor(id)
  if (duplicated) toast.success('Floor duplicated')
  else toast.error('Failed to duplicate floor')
}

async function onDelete(id: string) {
  if (floors.value.length <= 1) return
  const ok = await confirm({
    title: 'Delete floor',
    message: 'Delete this floor? This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!ok) return
  const deleted = await store.deleteFloor(id)
  if (!deleted) {
    toast.error('Failed to delete floor')
    return
  }
  if (selectedFloorId.value === id) selectedFloorId.value = floors.value[0]?.id ?? null
  toast.success('Floor deleted')
}

function onDragStart(index: number) {
  floorDragIndex.value = index
}
async function onDrop(index: number) {
  if (floorDragIndex.value === null) return
  const saved = await store.reorderFloors(floorDragIndex.value, index)
  floorDragIndex.value = null
  if (saved) toast.info('Floors reordered')
  else toast.error('Failed to reorder floors')
}

async function toggleWalkable(e: Event) {
  if (!selectedFloor.value) return
  const checked = (e.target as HTMLInputElement).checked
  await store.updateFloor(selectedFloor.value.id, { defaultWalkable: checked })
}

function isRoleAllowed(roleId: string): boolean {
  if (!selectedFloor.value) return true
  if (!selectedFloor.value.allowedRoleIds?.length) return true
  return selectedFloor.value.allowedRoleIds.includes(roleId)
}
async function toggleRole(roleId: string) {
  if (!selectedFloor.value) return
  const current = selectedFloor.value.allowedRoleIds ?? []
  const next = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
  await store.updateFloor(selectedFloor.value.id, { allowedRoleIds: next })
}
async function clearRoles() {
  if (!selectedFloor.value) return
  await store.updateFloor(selectedFloor.value.id, { allowedRoleIds: [] })
}

function floorCounts(f: FloorData): string {
  return `${f.objects.length} objects`
}
</script>

<template>
  <ModalShell
    :open="open"
    title="Floor Manager"
    width="60vw"
    max-width="800px"
    height="auto"
    max-height="calc(100vh - 32px)"
    body-class="form__grid"
    @close="onClose"
  >
    <!-- Left pane: Floor list -->
    <div class="form__col floor__body">
      <div class="floor__heading">
        <span>Floors ({{ floors.length }})</span>
        <button class="flag--dashed" @click="onAdd">+ Add</button>
      </div>
      <div class="form__col form__col--scroll">
        <div
          v-for="(f, index) in floors"
          :key="f.id"
          class="card__item floor__item"
          :class="{
            'floor__item--active': f.id === selectedFloorId,
            'floor__item--current': f.id === store.state.currentFloorId,
          }"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
          @click="selectFloor(f.id)"
        >
          <span class="floor__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
          <span class="floor__name truncate">{{ f.name }}</span>
          <span class="floor__count">{{ floorCounts(f) }}</span>
          <span v-if="f.id === store.state.currentFloorId" class="badge badge--blue">ACTIVE</span>
        </div>
      </div>
    </div>

    <!-- Right pane: Detail editor -->
    <div class="form__col floor__body">
      <div v-if="selectedFloor" class="form__col">
        <div class="floor__heading">
          <span>Floor Details</span>
          <button type="button" class="flag--warning" @click="showWalkable = true">Edit Walkable</button>
        </div>

        <div class="form__row">
          <label>Label</label>
          <input
            v-if="editingLabel"
            v-model="editingLabelRaw"
            aria-label="Edit floor label"
            @keydown.enter="commitLabel"
            @blur="commitLabel"
          />
          <input
            v-else
            class="input--disabled"
            :value="selectedFloor.label"
            readonly
            aria-label="Floor label"
            @dblclick="startEditLabel"
          />
        </div>

        <div class="form__row">
          <label>Name</label>
          <input
            v-if="editingName"
            :value="editingNameRaw"
            aria-label="Edit floor name"
            @input="editingNameRaw = sanitizeString(($event.target as HTMLInputElement).value)"
            @keydown.enter="commitName"
            @blur="commitName"
          />
          <input
            v-else
            class="input--disabled"
            :value="selectedFloor.name"
            readonly
            title="Double-click to edit"
            aria-label="Floor name"
            @dblclick="startEditName"
          />
        </div>

        <div class="form__row">
          <label>Default Walkable</label>
          <label class="form__group floor__check">
            <input type="checkbox" :checked="selectedFloor.defaultWalkable ?? true" @change="toggleWalkable" />
            <span>Empty areas are walkable</span>
          </label>
        </div>

        <div class="form__row">
          <label>Stats</label>
          <span class="form__hint">{{ floorCounts(selectedFloor) }}</span>
        </div>

        <div class="floor__heading">Allowed Roles</div>
        <div class="form__col">
          <div class="form__row">
            <span v-if="!selectedFloor.allowedRoleIds?.length" class="form__hint">All roles allowed</span>
            <button v-else class="flag--ghost" @click="clearRoles">Clear (allow all)</button>
          </div>
          <div class="form__row">
            <label
              v-for="role in availableRoles"
              :key="role.id"
              class="chip"
              :class="{ 'flag--active': isRoleAllowed(role.id) }"
            >
              <input type="checkbox" :checked="isRoleAllowed(role.id)" @change="toggleRole(role.id)" />
              <span class="swatch" :style="{ background: role.color }" />
              <span>{{ role.label }}</span>
            </label>
            <span v-if="!availableRoles.length" class="form__hint"
              >No roles configured - open Role Manager to add roles</span
            >
          </div>
        </div>

        <div class="modal__actions modal__actions--border">
          <button class="flag--ghost" @click="onDuplicate(selectedFloor.id)">Duplicate</button>
          <button class="flag--danger" :disabled="floors.length <= 1" @click="onDelete(selectedFloor.id)">
            Delete
          </button>
        </div>
      </div>
      <div v-else class="empty empty--center">Select a floor to edit</div>
    </div>
  </ModalShell>
  <FloorWalkablePanel
    :open="showWalkable"
    :floor="selectedFloor"
    :street-tiles="resolveStreetTiles(store.state.layout)"
    @close="showWalkable = false"
  />
</template>
