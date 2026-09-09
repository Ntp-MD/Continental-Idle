<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { genId, useAssetsStore } from '../../blueprintStore'
import { useToast, reportSaved } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { sanitizeString } from '../../../utils/sanitize'
import { spawnZoneAllowsRole } from '../../domain/types'
import type { FloorData, NpcSpawnZone } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'

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
const newZoneLabel = ref('')
const newZoneX = ref(0)
const newZoneY = ref(0)
const newZoneW = ref(100)
const newZoneH = ref(100)
const newZoneRoles = ref<string[]>([])

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
  if (!reportSaved(saved, 'Floor renamed', 'Failed to rename floor')) return
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
  reportSaved(!!floor, 'Floor added', 'Failed to add floor')
}

async function onDuplicate(id: string) {
  const duplicated = await store.duplicateFloor(id)
  reportSaved(!!duplicated, 'Floor duplicated', 'Failed to duplicate floor')
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
  if (!reportSaved(deleted, 'Floor deleted', 'Failed to delete floor')) return
  if (selectedFloorId.value === id) selectedFloorId.value = floors.value[0]?.id ?? null
}

function onDragStart(index: number) {
  floorDragIndex.value = index
}
async function onDrop(index: number) {
  if (floorDragIndex.value === null) return
  const saved = await store.reorderFloors(floorDragIndex.value, index)
  floorDragIndex.value = null
  reportSaved(!!saved, 'Floors reordered', 'Failed to reorder floors')
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

function isZoneRole(zone: NpcSpawnZone, roleId: string): boolean {
  return spawnZoneAllowsRole(zone, roleId)
}
async function toggleZoneRole(zoneId: string, roleId: string): Promise<void> {
  const floor = selectedFloor.value
  if (!floor) return
  const zone = floor.spawnZones?.find((entry) => entry.id === zoneId)
  if (!zone) return
  const allIds = availableRoles.value.map((role) => role.id)
  const explicit = zone.roleIds?.length ? [...zone.roleIds] : [...allIds]
  const next = explicit.includes(roleId) ? explicit.filter((id) => id !== roleId) : [...explicit, roleId]
  const trimmed = next.filter((id) => allIds.includes(id))
  const zones = (floor.spawnZones ?? []).map((entry) => {
    if (entry.id !== zoneId) return entry
    const nextZone: NpcSpawnZone = { ...entry, roleIds: trimmed }
    if (!trimmed.length || trimmed.length >= allIds.length) delete nextZone.roleIds
    return nextZone
  })
  await store.updateFloor(floor.id, { spawnZones: zones })
}

function toggleNewZoneRole(roleId: string) {
  const set = new Set(newZoneRoles.value)
  if (set.has(roleId)) set.delete(roleId)
  else set.add(roleId)
  newZoneRoles.value = [...set]
}

async function addSpawnZone() {
  const floor = selectedFloor.value
  if (!floor) return
  const label = sanitizeString(newZoneLabel.value.trim()) || `Zone ${(floor.spawnZones?.length ?? 0) + 1}`
  const rect = { x: newZoneX.value, y: newZoneY.value, w: newZoneW.value, h: newZoneH.value }
  if (
    ![rect.x, rect.y, rect.w, rect.h].every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    rect.x < 0 || rect.y < 0 || rect.w <= 0 || rect.h <= 0
  ) {
    toast.warning('Zone needs finite x/y and positive w/h')
    return
  }
  const zone: NpcSpawnZone = {
    id: genId('zone'),
    label,
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    ...(newZoneRoles.value.length ? { roleIds: [...newZoneRoles.value] } : {}),
  }
  const saved = await store.updateFloor(floor.id, { spawnZones: [...(floor.spawnZones ?? []), zone] })
  if (!reportSaved(saved, `Zone "${label}" added`, 'Failed to add zone')) return
  newZoneLabel.value = ''
  newZoneRoles.value = []
}

async function deleteSpawnZone(zoneId: string) {
  const floor = selectedFloor.value
  if (!floor) return
  const zone = floor.spawnZones?.find((entry) => entry.id === zoneId)
  if (!zone) return
  const ok = await confirm({
    title: 'Delete spawn zone',
    message: `Delete zone "${zone.label}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!ok) return
  const saved = await store.updateFloor(floor.id, { spawnZones: (floor.spawnZones ?? []).filter((entry) => entry.id !== zoneId) })
  reportSaved(saved, `Zone "${zone.label}" deleted`, 'Failed to delete zone')
}

function floorCounts(f: FloorData): string {
  return `${f.objects.length} objects`
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-floor-manager" title="Floor Manager" @close="onClose">
    <div class="form__row form--start">
      <!-- Left pane: Floor list -->
      <div class="form__col floor__body right--border">
        <div class="floor__heading">
          <span>Floors ({{ floors.length }})</span>
          <button class="flag--dashed" @click="onAdd">+ Add</button>
        </div>
        <ul class="form__col">
          <li
            v-for="(f, index) in floors"
            :key="f.id"
            class="card__item floor__item"
            :class="{ 'flag--active': selectedFloor?.id === f.id }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop="onDrop(index)"
            @click="selectFloor(f.id)"
          >
            <span class="floor__label" :style="{ color: f.labelColor || undefined }">{{ f.label }}</span>
            <span class="size--stretch truncate">{{ f.name }}</span>
            <span class="floor__count">{{ floorCounts(f) }}</span>
            <span v-if="f.id === store.state.currentFloorId" class="badge">ACTIVE</span>
            <button
              type="button"
              title="Duplicate floor"
              :aria-label="`Duplicate floor ${f.name}`"
              @click.stop="onDuplicate(f.id)"
            >
              Duplicate
            </button>
            <button
              type="button"
              class="flag--danger"
              title="Delete floor"
              :aria-label="`Delete floor ${f.name}`"
              :disabled="floors.length <= 1"
              @click.stop="onDelete(f.id)"
            >
              x
            </button>
          </li>
        </ul>
      </div>

      <!-- Right pane: Detail editor -->
      <div class="form__col floor__body">
        <template v-if="selectedFloor">
          <div class="form__row form--start form--wrap">
          <div class="form__col form--section">
            <div class="floor__heading">
              <span>Details</span>
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
              <span class="floor__count">{{ floorCounts(selectedFloor) }}</span>
            </div>
          </div>

          <div class="form__col form--section">
            <div>Walkability</div>
            <label class="form__row floor__check">
              <input type="checkbox" :checked="selectedFloor.defaultWalkable ?? true" @change="toggleWalkable" />
              <span>Empty areas are walkable</span>
            </label>
          </div>
          </div>

          <div class="form__col form--section">
            <div>Allowed Roles</div>
            <div class="form__row">
              <span v-if="!selectedFloor.allowedRoleIds?.length" class="empty">All roles allowed</span>
              <button v-else @click="clearRoles">Clear (allow all)</button>
            </div>
            <ul class="form__row form--wrap">
              <li v-for="role in availableRoles" :key="role.id" class="floor__role">
                <label class="card__item" :class="{ 'flag--active': isRoleAllowed(role.id) }">
                  <input type="checkbox" :checked="isRoleAllowed(role.id)" @change="toggleRole(role.id)" />
                  <span class="swatch" :style="{ background: role.color }" />
                  <span>{{ role.label }}</span>
                </label>
              </li>
            </ul>
            <span v-if="!availableRoles.length" class="empty"
              >No roles configured - open Role Manager to add roles</span
            >
          </div>

          <div class="form__col form--section">
            <div>Spawn Zones</div>
            <ul v-if="selectedFloor.spawnZones?.length" class="form__col">
              <li v-for="zone in selectedFloor.spawnZones" :key="zone.id" class="form__col card__item">
                <div class="form__row">
                  <span class="size--stretch truncate">{{ zone.label }} ({{ zone.x }},{{ zone.y }} {{ zone.w }}x{{ zone.h }})</span>
                  <small class="form__hint">{{ zone.roleIds?.length ? `${zone.roleIds.length} roles` : 'all roles' }}</small>
                  <button type="button" class="flag--danger" :aria-label="`Delete zone ${zone.label}`" @click="deleteSpawnZone(zone.id)">x</button>
                </div>
                <ul v-if="availableRoles.length" class="form__row form--wrap">
                  <li v-for="role in availableRoles" :key="`zone-${zone.id}-${role.id}`" class="floor__role">
                    <label class="card__item" :class="{ 'flag--active': isZoneRole(zone, role.id) }">
                      <input type="checkbox" :checked="isZoneRole(zone, role.id)" :aria-label="`${role.label} spawns in ${zone.label}`" @change="toggleZoneRole(zone.id, role.id)" />
                      <span class="swatch" :style="{ background: role.color }" />
                      <span>{{ role.label }}</span>
                    </label>
                  </li>
                </ul>
              </li>
            </ul>
            <div v-else class="empty">No zones - NPCs spawn anywhere walkable</div>
            <div class="form__row">
              <input
                v-model="newZoneLabel"
                class="size--stretch"
                type="text"
                placeholder="New zone"
                aria-label="New zone label"
                @keydown.enter="addSpawnZone"
              />
              <button type="button" class="flag--active" @click="addSpawnZone">Add</button>
            </div>
            <div class="form__row form--wrap">
              <label class="form__col">X<input v-model.number="newZoneX" class="size--fit" type="number" min="0" aria-label="Zone x" /></label>
              <label class="form__col">Y<input v-model.number="newZoneY" class="size--fit" type="number" min="0" aria-label="Zone y" /></label>
              <label class="form__col">W<input v-model.number="newZoneW" class="size--fit" type="number" min="1" aria-label="Zone width" /></label>
              <label class="form__col">H<input v-model.number="newZoneH" class="size--fit" type="number" min="1" aria-label="Zone height" /></label>
            </div>
            <ul v-if="availableRoles.length" class="form__row form--wrap">
              <li v-for="role in availableRoles" :key="`zone-role-${role.id}`">
                <label class="card__item" :class="{ 'flag--active': newZoneRoles.includes(role.id) }">
                  <input type="checkbox" :checked="newZoneRoles.includes(role.id)" @change="toggleNewZoneRole(role.id)" />
                  <span class="swatch" :style="{ background: role.color }" />
                  <span>{{ role.label }}</span>
                </label>
              </li>
            </ul>
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
</template>

<style>
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
  color: var(--text-secondary);
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
  width: min(96vw, 980px);
  max-height: calc(100vh - 32px);
}

#modal-floor-manager .form__row > .floor__body {
  flex: 1 1 260px;
  height: stretch;
}
</style>
