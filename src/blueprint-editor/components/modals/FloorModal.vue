<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { sanitizeString } from '../../../utils/sanitize'
import { resolveStreetTiles } from '../../domain/types'
import type { FloorData } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'
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
  <ModalShell :open="open" modal-id="modal-floor-manager" title="Floor Manager" @close="onClose">
    <div class="form__split">
      <!-- Left pane: Floor list -->
      <div class="form__col floor__body">
        <div class="form__title floor__heading">
          <span>Floors ({{ floors.length }})</span>
          <button class="flag--dashed" @click="onAdd">+ Add</button>
        </div>
        <div
          v-for="(f, index) in floors"
          :key="f.id"
          class="card__item floor__item"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop="onDrop(index)"
          @click="selectFloor(f.id)"
        >
          <span class="floor__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
          <span class="form__name truncate">{{ f.name }}</span>
          <span class="floor__count">{{ floorCounts(f) }}</span>
          <span v-if="f.id === store.state.currentFloorId" class="badge">ACTIVE</span>
        </div>
      </div>

      <!-- Right pane: Detail editor -->
      <div class="form__col floor__body">
        <template v-if="selectedFloor">
          <div class="form__group">
            <div class="form__title floor__heading">
              <span>Details</span>
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
                :value="selectedFloor.label"
                readonly
                title="Double-click to edit"
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
                :value="selectedFloor.name"
                readonly
                title="Double-click to edit"
                aria-label="Floor name"
                @dblclick="startEditName"
              />
            </div>
            <div class="form__row">
              <label>Stats</label>
              <span class="form__hint">{{ floorCounts(selectedFloor) }}</span>
            </div>
          </div>

          <div class="form__group">
            <div class="form__title">Walkability</div>
            <label class="form__field floor__check">
              <input type="checkbox" :checked="selectedFloor.defaultWalkable ?? true" @change="toggleWalkable" />
              <span>Empty areas are walkable</span>
            </label>
          </div>

          <div class="form__group">
            <div class="form__title">Allowed Roles</div>
            <div class="form__row">
              <span v-if="!selectedFloor.allowedRoleIds?.length" class="form__hint">All roles allowed</span>
              <button v-else @click="clearRoles">Clear (allow all)</button>
            </div>
            <div class="form__row form__row--wrap">
              <label
                v-for="role in availableRoles"
                :key="role.id"
                class="card__item floor__role"
                :class="{ 'flag--active': isRoleAllowed(role.id) }"
              >
                <input type="checkbox" :checked="isRoleAllowed(role.id)" @change="toggleRole(role.id)" />
                <span class="swatch" :style="{ background: role.color }" />
                <span>{{ role.label }}</span>
              </label>
            </div>
            <span v-if="!availableRoles.length" class="form__hint"
              >No roles configured - open Role Manager to add roles</span
            >
          </div>
        </template>
        <div v-else class="empty">Select a floor to edit</div>
      </div>
    </div>
    <template v-if="selectedFloor" #footer>
      <button @click="onDuplicate(selectedFloor.id)">Duplicate</button>
      <button class="flag--danger" :disabled="floors.length <= 1" @click="onDelete(selectedFloor.id)">Delete</button>
    </template>
  </ModalShell>
  <FloorWalkablePanel
    :open="showWalkable"
    :floor="selectedFloor"
    :street-tiles="resolveStreetTiles(store.state.layout)"
    @close="showWalkable = false"
  />
</template>

<style scoped>
.floor__body {
  min-width: 0;
  overflow: hidden;
}

.floor__item:hover {
  border-color: var(--accent-primary);
}

.floor__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.floor__label {
  min-width: fit-content;
}

.floor__count {
  color: var(--text-dim);
  white-space: nowrap;
}

.floor__check {
  cursor: pointer;
}

.floor__role {
  flex-shrink: 0;
}

.floor__role:hover {
  border-color: var(--accent-primary);
}
</style>

<style>
#modal-floor-manager {
  width: min(94vw, 800px);
  max-height: calc(100vh - 32px);
}

#modal-floor-manager .form__split > .floor__body {
  flex: 1 1 260px;
  min-width: 0;
}
</style>
