<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { genId, useAssetsStore } from '../../blueprintStore'
import { useToast, reportSaved } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { sanitizeString } from '../../../utils/sanitize'
import { spawnZoneAllowsRole } from '../../domain/types'
import type { FloorData, NpcSpawnZone } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const toast = useToast()
const confirm = useConfirm().confirm
const { pending, run } = useAsyncAction()

const selectedFloorId = ref<string | null>(null)
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

const wiringIssues = store.wiringIssues

watch(
  () => props.open,
  (open) => {
    if (open) selectedFloorId.value = store.state.currentFloorId ?? floors.value[0]?.id ?? null
  },
)

function onClose() {
  emit('close')
}

function isZoneRole(zone: NpcSpawnZone, roleId: string): boolean {
  return spawnZoneAllowsRole(zone, roleId)
}

async function toggleZoneRole(zoneId: string, roleId: string): Promise<void> {
  const floor = selectedFloor.value
  if (!floor || pending.value) return
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
  await run(() => store.updateFloor(floor.id, { spawnZones: zones }))
}

function toggleNewZoneRole(roleId: string) {
  const set = new Set(newZoneRoles.value)
  if (set.has(roleId)) set.delete(roleId)
  else set.add(roleId)
  newZoneRoles.value = [...set]
}

function armZoneDraw() {
  const floor = selectedFloor.value
  if (!floor) return
  const label = sanitizeString(newZoneLabel.value.trim()) || `Zone ${(floor.spawnZones?.length ?? 0) + 1}`
  store.armZoneDraw({ label, roleIds: [...newZoneRoles.value] })
  store.selectFloor(floor.id)
  store.setMode('zone')
  newZoneLabel.value = ''
  newZoneRoles.value = []
  toast.info('Spawn Zones closed - drag a rectangle on the canvas for the new zone')
  emit('close')
}

async function addZone() {
  const floor = selectedFloor.value
  if (!floor || pending.value) return
  const label = sanitizeString(newZoneLabel.value.trim()) || `Zone ${(floor.spawnZones?.length ?? 0) + 1}`
  const rect = { x: newZoneX.value, y: newZoneY.value, w: newZoneW.value, h: newZoneH.value }
  if (
    ![rect.x, rect.y, rect.w, rect.h].every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    rect.x < 0 ||
    rect.y < 0 ||
    rect.w <= 0 ||
    rect.h <= 0
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
  const saved = await run(() => store.updateFloor(floor.id, { spawnZones: [...(floor.spawnZones ?? []), zone] }))
  if (!reportSaved(saved, `Zone "${label}" added`, 'Failed to add zone')) return
  newZoneLabel.value = ''
  newZoneRoles.value = []
}

async function deleteZone(zoneId: string) {
  const floor = selectedFloor.value
  if (!floor || pending.value) return
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
  const saved = await run(() =>
    store.updateFloor(floor.id, {
      spawnZones: (floor.spawnZones ?? []).filter((entry) => entry.id !== zoneId),
    }),
  )
  reportSaved(saved, `Zone "${zone.label}" deleted`, 'Failed to delete zone')
}

async function clearAllZones() {
  const floor = selectedFloor.value
  if (!floor || !floor.spawnZones?.length || pending.value) return
  const count = floor.spawnZones.length
  const ok = await confirm({
    title: 'Clear spawn zones',
    message: `Delete all ${count} spawn zone(s) from "${floor.name}"? NPCs will then spawn anywhere walkable. This action cannot be undone.`,
    confirmLabel: 'Clear all',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!ok) return
  const saved = await run(() => store.clearSpawnZones(floor.id))
  reportSaved(saved, `Cleared ${count} spawn zone(s)`, 'Failed to clear spawn zones')
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-spawn-zones" title="Spawn Zones" @close="onClose">
    <div class="form__row">
      <label class="form__col">
        <span>Floor</span>
        <select v-model="selectedFloorId" aria-label="Floor">
          <option v-for="floor in floors" :key="floor.id" :value="floor.id">{{ floor.label }} - {{ floor.name }}</option>
        </select>
      </label>
    </div>

    <template v-if="selectedFloor">
      <div class="form__header">
        <span class="size--stretch">{{ selectedFloor.spawnZones?.length ?? 0 }} zone(s) on {{ selectedFloor.label }}</span>
        <button
          type="button"
          class="flag--danger"
          :disabled="!selectedFloor.spawnZones?.length || pending"
          @click="clearAllZones"
        >
          Clear all
        </button>
      </div>

      <div class="form__col form--section">
        <div>Zones</div>
        <ul v-if="selectedFloor.spawnZones?.length" class="form__col">
          <li v-for="zone in selectedFloor.spawnZones" :key="zone.id" class="form__col card__item">
            <div class="form__row">
              <span class="size--stretch truncate"
                >{{ zone.label }} ({{ zone.x }},{{ zone.y }} {{ zone.w }}x{{ zone.h }})</span
              >
              <small class="form__hint">{{ zone.roleIds?.length ? `${zone.roleIds.length} roles` : 'all roles' }}</small>
              <button
                type="button"
                class="card__item--remove flag--danger"
                :aria-label="`Delete zone ${zone.label}`"
                :disabled="pending"
                @click="deleteZone(zone.id)"
              >
                x
              </button>
            </div>
            <ul v-if="availableRoles.length" class="form__row form--wrap">
              <li v-for="role in availableRoles" :key="`zone-${zone.id}-${role.id}`" class="spawn__role">
                <label class="card__item" :class="{ 'flag--active': isZoneRole(zone, role.id) }">
                  <input
                    type="checkbox"
                    :checked="isZoneRole(zone, role.id)"
                    :aria-label="`${role.label} spawns in ${zone.label}`"
                    :disabled="pending"
                    @change="toggleZoneRole(zone.id, role.id)"
                  />
                  <span class="swatch" :style="{ background: role.color }" />
                  <span>{{ role.label }}</span>
                </label>
              </li>
            </ul>
          </li>
        </ul>
        <div v-else class="empty">No zones - NPCs spawn anywhere walkable</div>
      </div>

      <div class="form__col form--section">
        <div>Add zone</div>
        <div class="form__row">
          <input
            v-model="newZoneLabel"
            class="size--stretch"
            type="text"
            placeholder="New zone"
            aria-label="New zone label"
            :disabled="pending"
            @keydown.enter="addZone"
          />
          <button type="button" class="flag--active" :disabled="pending" @click="addZone">Add</button>
          <button
            type="button"
            title="Close this dialog and drag a rectangle on the canvas for the new zone"
            @click="armZoneDraw"
          >
            Draw
          </button>
        </div>
        <div class="form__row form--wrap">
          <label class="form__col"
            >X<input v-model.number="newZoneX" class="size--fit" type="number" min="0" aria-label="Zone x"
          /></label>
          <label class="form__col"
            >Y<input v-model.number="newZoneY" class="size--fit" type="number" min="0" aria-label="Zone y"
          /></label>
          <label class="form__col"
            >W<input v-model.number="newZoneW" class="size--fit" type="number" min="1" aria-label="Zone width"
          /></label>
          <label class="form__col"
            >H<input v-model.number="newZoneH" class="size--fit" type="number" min="1" aria-label="Zone height"
          /></label>
        </div>
        <ul v-if="availableRoles.length" class="form__row form--wrap">
          <li v-for="role in availableRoles" :key="`zone-role-${role.id}`" class="spawn__role">
            <label class="card__item" :class="{ 'flag--active': newZoneRoles.includes(role.id) }">
              <input
                type="checkbox"
                :checked="newZoneRoles.includes(role.id)"
                @change="toggleNewZoneRole(role.id)"
              />
              <span class="swatch" :style="{ background: role.color }" />
              <span>{{ role.label }}</span>
            </label>
          </li>
        </ul>
      </div>

      <div class="form__col form--section">
        <div class="form__row">
          <span class="size--stretch">Wiring</span>
          <span class="badge" :class="{ 'flag--warning': wiringIssues.length > 0 }">{{ wiringIssues.length }}</span>
        </div>
        <ul v-if="wiringIssues.length" class="form__col">
          <li v-for="(issue, index) in wiringIssues" :key="`wiring-${index}`" class="form__hint">{{ issue }}</li>
        </ul>
        <div v-else class="empty">No wiring issues</div>
      </div>
    </template>
    <div v-else class="empty">No floors yet - create one in Floor Manager first</div>

    <template #footer>
      <div class="form__row">
        <button @click="onClose">Close</button>
      </div>
    </template>
  </ModalShell>
</template>

<style scoped>
.spawn__role {
  flex-shrink: 0;
}

.spawn__role:hover {
  border-color: var(--accent-primary);
}
</style>

<style>
#modal-spawn-zones {
  width: min(94vw, 720px);
  max-height: calc(100vh - 32px);
}
</style>
