<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { useAssetsStore } from '../blueprint-store'
import { useToast } from '../composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import type { ObjectData } from '../types'
import TagPicker from './TagPicker.vue'

const props = defineProps<{ object: ObjectData }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const fields = ref({ x: 0, y: 0, w: 0, h: 0, objLabel: '' })
const errorFields = ref<Record<string, boolean>>({})
const flashErrorTimers = new Map<string, number>()

const customNotes = ref('')
const customTags = ref<string[]>([])
const instanceLabel = ref('')
const linkedRoomId = ref('')
const entranceRequired = ref(props.object.entranceRequired ?? false)
const anchors = ref<[number, number][]>([])

const roomOptions = computed(() => store.currentFloor.value?.rooms ?? [])

watch(() => props.object.entranceRequired, (v) => {
  entranceRequired.value = v ?? false
})

watch(entranceRequired, async (v) => {
  try {
    await store.updateObjectProps({ entranceRequired: v })
  } catch {
    entranceRequired.value = !v
  }
})

const FLASH_ERROR_MS = 1200
function flashError(field: string) {
  const existing = flashErrorTimers.get(field)
  if (existing) window.clearTimeout(existing)
  errorFields.value[field] = true
  const id = window.setTimeout(() => {
    errorFields.value[field] = false
    flashErrorTimers.delete(field)
  }, FLASH_ERROR_MS)
  flashErrorTimers.set(field, id)
}

onBeforeUnmount(() => {
  for (const id of flashErrorTimers.values()) window.clearTimeout(id)
  flashErrorTimers.clear()
})

watch(() => props.object, (obj) => {
  errorFields.value = {}
  linkedRoomId.value = obj.roomId ?? ''
  entranceRequired.value = obj.entranceRequired ?? false
  anchors.value = obj.anchorPoints ? obj.anchorPoints.map(p => [...p] as [number, number]) : []
  fields.value = { x: obj.x, y: obj.y, w: obj.w, h: obj.h, objLabel: obj.label ?? '' }
  if (obj.subId) {
    const cp = store.getObjectCustomProps(obj.subId)
    customNotes.value = cp?.notes ?? ''
    customTags.value = cp?.tags ? [...cp.tags] : []
    instanceLabel.value = store.getInstanceLabel(obj.subId) ?? ''
  } else {
    customNotes.value = ''
    customTags.value = []
    instanceLabel.value = ''
  }
}, { immediate: true })

watch(() => props.object.roomId, (roomId) => {
  linkedRoomId.value = roomId ?? ''
})

async function commitField(field: 'x' | 'y' | 'objLabel') {
  if (field === 'objLabel') {
    await store.updateObjectProps({ label: fields.value.objLabel || undefined })
    return
  }
  const patch: Partial<ObjectData> = { [field]: fields.value[field] } as Partial<ObjectData>
  const ok = await store.updateObjectProps(patch)
  if (!ok) {
    flashError(field)
    ;(fields.value as unknown as Record<string, unknown>)[field] = (props.object as unknown as Record<string, unknown>)[field]
  }
}

async function toggleLock() {
  await store.toggleObjectLock(props.object.id)
  useToast().info(props.object.locked ? 'Object unlocked' : 'Object locked')
}

async function rotate() {
  await store.rotateSelected()
}

async function remove() {
  await store.deleteSelected()
}

async function saveCustomNotes() {
  if (!props.object.subId) return
  const p = store.getObjectCustomProps(props.object.subId) || {}
  p.notes = customNotes.value || undefined
  await store.setObjectCustomProps(props.object.subId, p)
}

async function saveCustomTags(tags: string[]) {
  if (!props.object.subId) return
  customTags.value = tags
  const p = store.getObjectCustomProps(props.object.subId) || {}
  p.tags = tags.length > 0 ? tags : undefined
  await store.setObjectCustomProps(props.object.subId, p)
}

async function saveInstanceLabel() {
  if (!props.object.subId) return
  if (instanceLabel.value) {
    await store.setInstanceLabel(props.object.subId, instanceLabel.value)
  } else {
    await store.deleteInstanceLabel(props.object.subId)
  }
}

async function doUnlink() {
  await store.unlinkObject(props.object.id)
  useToast().info('Object unlinked')
}

async function onRoomLinkChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  const previous = linkedRoomId.value
  linkedRoomId.value = value
  if (!value) {
    const ok = await store.unlinkObjectFromRoom(props.object.id)
    if (!ok) linkedRoomId.value = previous
  } else {
    const ok = await store.linkObjectToRoom(props.object.id, value)
    if (!ok) linkedRoomId.value = previous
  }
}

async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    useToast().success('ID copied')
  } catch {
    useToast().warning('Copy failed')
  }
}

async function onSave() {
  await run(() => store.saveLayout())
  useToast().success('Properties saved')
}

async function updateAnchors() {
  await store.updateObjectProps({ anchorPoints: anchors.value.map(p => [...p] as [number, number]) })
}

function addAnchor() {
  anchors.value.push([Math.round(props.object.w / 2), Math.round(props.object.h / 2)])
  updateAnchors()
}

function removeAnchor(index: number) {
  anchors.value.splice(index, 1)
  updateAnchors()
}
</script>

<template>
  <div class="properties-panel__content">
    <div class="properties-panel__section">
      <div class="properties-panel__section-title">Object</div>
      <div class="properties-panel__row">
      <label>ID</label>
      <div class="properties-panel__id-row">
        <input type="text" :value="object.id" disabled class="input input--readonly" title="Object ID" />
        <button class="btn btn-sm" @click="copyId(object.id)">Copy</button>
      </div>
    </div>
    <div class="properties-panel__row">
      <label>X</label>
      <input class="input" type="number" v-model.number="fields.x" :class="{ 'input--error': errorFields.x }" @change="commitField('x')" />
    </div>
    <div class="properties-panel__row">
      <label>Y</label>
      <input class="input" type="number" v-model.number="fields.y" :class="{ 'input--error': errorFields.y }" @change="commitField('y')" />
    </div>
    <div class="properties-panel__row">
      <label>Rotation</label>
      <span class="properties-panel__value">{{ object.rotation }}°</span>
    </div>
    <div class="properties-panel__row">
      <label>Label</label>
      <input class="input" type="text" v-model="fields.objLabel" @change="commitField('objLabel')" placeholder="Custom label" />
    </div>
    <div class="properties-panel__row">
      <label>Linked Room</label>
      <select class="input" :value="linkedRoomId" @change="onRoomLinkChange">
        <option value="">None</option>
        <option v-for="room in roomOptions" :key="room.id" :value="room.id">{{ room.label }}</option>
      </select>
    </div>
    <div v-if="object.tileStates && object.tileStates.length > 0" class="properties-panel__row">
      <label></label>
      <label>
        <input type="checkbox" v-model="entranceRequired" /> Require entrance (block boundary)
      </label>
    </div>
    </div>
    <div class="properties-panel__section">
      <div class="properties-panel__section-title">NPC Anchors</div>
      <div class="properties-panel__hint">Points where NPCs stand when targeting this object. Coordinates are relative to the object's top-left corner.</div>
      <div v-for="(anchor, i) in anchors" :key="'anchor-' + i" class="properties-panel__row">
        <label>A{{ i + 1 }}</label>
        <div class="properties-panel__anchor-row">
          <input class="input input--readonly" type="number" :value="anchor[0]" @change="anchor[0] = +($event.target as HTMLInputElement).value; updateAnchors()" style="width: 48px" />
          <input class="input input--readonly" type="number" :value="anchor[1]" @change="anchor[1] = +($event.target as HTMLInputElement).value; updateAnchors()" style="width: 48px" />
          <button class="btn btn-sm btn__danger" @click="removeAnchor(i)">×</button>
        </div>
      </div>
      <button class="btn btn-sm btn__dashed" @click="addAnchor">+ Add Anchor</button>
    </div>
    <div class="properties-panel__section">
      <div class="properties-panel__section-title">Instance Properties</div>
    <div class="properties-panel__row">
      <label>Instance Label</label>
      <input class="input" type="text" v-model="instanceLabel" @change="saveInstanceLabel" placeholder="Unique label for this instance" />
    </div>
    <div class="properties-panel__row">
      <label>Notes</label>
      <textarea v-model="customNotes" @change="saveCustomNotes" placeholder="Add notes..." class="textarea" rows="2"></textarea>
    </div>
    <div class="properties-panel__row">
      <label>Tags</label>
      <TagPicker :model-value="customTags" @update:model-value="saveCustomTags" placeholder="tag1, tag2, tag3" />
    </div>
    <div class="properties-panel__btn-group">
      <button class="btn" @click="rotate">Rotate (R)</button>
      <button class="btn" @click="toggleLock">{{ object.locked ? 'Unlock' : 'Lock' }}</button>
      <button v-if="object.linkGroupId" class="btn" @click="doUnlink">Unlink</button>
    </div>
    <div class="properties-panel__delete-section">
      <button class="btn btn__success" :disabled="pending" @click="onSave">Save</button>
      <button class="btn" :disabled="pending" @click="store.select(null); store.selectAsset(null)">Deselect</button>
      <button class="btn btn__danger" :disabled="pending" @click="remove">Delete</button>
    </div>
    </div>
  </div>
</template>
