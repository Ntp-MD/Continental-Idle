<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import { useFieldError } from '../composables/useFieldError'
import { useClipboardCopy } from '../composables/useClipboardCopy'
import type { ObjectData } from '../types'
import TagPicker from './tagPicker.vue'

const props = defineProps<{ object: ObjectData }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()
const { errorFields, flashError } = useFieldError()
const { copyId } = useClipboardCopy()

const fields = ref({ x: 0, y: 0, w: 0, h: 0, objLabel: '' })

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
  <div class="properties__content">
    <div class="properties__section">
      <div class="properties__title">Object</div>
      <div class="properties__row">
      <label>ID</label>
      <div class="properties__idrow">
        <input type="text" :value="object.id" disabled class="input input__readonly" title="Object ID" />
        <button class="btn__sm" @click="copyId(object.id)">Copy</button>
      </div>
    </div>
    <div class="properties__row">
      <label>X</label>
      <input class="input" type="number" v-model.number="fields.x" :class="{ 'input__error': errorFields.x }" @change="commitField('x')" />
    </div>
    <div class="properties__row">
      <label>Y</label>
      <input class="input" type="number" v-model.number="fields.y" :class="{ 'input__error': errorFields.y }" @change="commitField('y')" />
    </div>
    <div class="properties__row">
      <label>Rotation</label>
      <span class="properties__value">{{ object.rotation }}°</span>
    </div>
    <div class="properties__row">
      <label>Label</label>
      <input class="input" type="text" v-model="fields.objLabel" @change="commitField('objLabel')" placeholder="Custom label" />
    </div>
    <div class="properties__row">
      <label>Linked Room</label>
      <select class="input" :value="linkedRoomId" @change="onRoomLinkChange">
        <option value="">None</option>
        <option v-for="room in roomOptions" :key="room.id" :value="room.id">{{ room.label }}</option>
      </select>
    </div>
    <div v-if="object.tileStates && object.tileStates.length > 0" class="properties__row">
      <label></label>
      <label>
        <input type="checkbox" v-model="entranceRequired" /> Require entrance (block boundary)
      </label>
    </div>
    </div>
    <div class="properties__section">
      <div class="properties__title">NPC Anchors</div>
      <div class="properties__hint">Points where NPCs stand when targeting this object. Coordinates are relative to the object's top-left corner.</div>
      <div v-for="(anchor, i) in anchors" :key="'anchor_' + i" class="properties__row">
        <label>A{{ i + 1 }}</label>
        <div class="properties__anchorrow">
          <input class="input input__readonly" type="number" :value="anchor[0]" @change="anchor[0] = +($event.target as HTMLInputElement).value; updateAnchors()" style="width: 48px" />
          <input class="input input__readonly" type="number" :value="anchor[1]" @change="anchor[1] = +($event.target as HTMLInputElement).value; updateAnchors()" style="width: 48px" />
          <button class="btn__sm btn__danger" @click="removeAnchor(i)">×</button>
        </div>
      </div>
      <button class="btn__sm btn__dashed" @click="addAnchor">+ Add Anchor</button>
    </div>
    <div class="properties__section">
      <div class="properties__title">Instance Properties</div>
    <div class="properties__row">
      <label>Instance Label</label>
      <input class="input" type="text" v-model="instanceLabel" @change="saveInstanceLabel" placeholder="Unique label for this instance" />
    </div>
    <div class="properties__row">
      <label>Notes</label>
      <textarea v-model="customNotes" @change="saveCustomNotes" placeholder="Add notes..." class="textarea" rows="2"></textarea>
    </div>
    <div class="properties__row">
      <label>Tags</label>
      <TagPicker :model-value="customTags" @update:model-value="saveCustomTags" placeholder="tag1, tag2, tag3" />
    </div>
    <div class="properties__btngroup">
      <button @click="rotate">Rotate (R)</button>
      <button @click="toggleLock">{{ object.locked ? 'Unlock' : 'Lock' }}</button>
      <button v-if="object.linkGroupId" @click="doUnlink">Unlink</button>
    </div>
    <div class="properties__deletesection">
      <button class="btn__success" :disabled="pending" @click="onSave">Save</button>
      <button :disabled="pending" @click="store.select(null); store.selectAsset(null)">Deselect</button>
      <button class="btn__danger" :disabled="pending" @click="remove">Delete</button>
    </div>
    </div>
  </div>
</template>
