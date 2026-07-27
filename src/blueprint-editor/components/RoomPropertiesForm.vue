<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { useAssetsStore } from '../blueprint-store'
import { useToast } from '../composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import { validateRoomAnchors } from '../asset-utils'
import type { EntrancePoint, RoomData, RoomType } from '../types'
import TagPicker from './TagPicker.vue'

const props = defineProps<{ room: RoomData }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const fields = ref({ x: 0, y: 0, w: 0, h: 0, label: '', category: '', roomType: 'room' as RoomType, walkable: true, radius: 0, padding: 0, fillColor: '', rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 })
const roomTags = ref<string[]>([])
const entrances = ref<EntrancePoint[]>([])
const anchors = ref<[number, number][]>([])
const invalidAnchorCount = computed(() => validateRoomAnchors(props.room, store.currentFloor.value?.objects ?? []).invalid.length)
const errorFields = ref<Record<string, boolean>>({})
const rxSync = ref(true)
const flashErrorTimers = new Map<string, number>()

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

watch(() => props.room, (room) => {
  errorFields.value = {}
  fields.value = { x: room.x, y: room.y, w: room.w, h: room.h, label: room.label, category: room.category ?? '', roomType: room.roomType ?? 'room', walkable: room.walkable ?? true, radius: room.radius ?? 0, padding: room.padding ?? 0, fillColor: room.fillColor ?? '', rxTL: room.rx?.tl ?? 0, rxTR: room.rx?.tr ?? 0, rxBR: room.rx?.br ?? 0, rxBL: room.rx?.bl ?? 0 }
  roomTags.value = room.tags ? [...room.tags] : []
  entrances.value = room.entrances?.map(e => ({ ...e })) ?? []
  anchors.value = room.anchorPoints?.map(p => [...p] as [number, number]) ?? [[room.w / 2, room.h / 2]]
}, { immediate: true })

async function commitField(field: 'x' | 'y' | 'w' | 'h' | 'label' | 'category' | 'roomType' | 'walkable' | 'radius' | 'fillColor' | 'padding') {
  if (field === 'fillColor') {
    await store.updateRoomProps({ fillColor: fields.value.fillColor || undefined })
    return
  }
  const patch: Partial<RoomData> = { [field]: fields.value[field] } as Partial<RoomData>
  const ok = await store.updateRoomProps(patch)
  if (!ok) {
    flashError(field)
    ;(fields.value as unknown as Record<string, unknown>)[field] = (props.room as unknown as Record<string, unknown>)[field]
  }
}

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = fields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateRoomProps({ rx: undefined })
  } else {
    await store.updateRoomProps({ rx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
  }
}

async function onRxInput(corner: 'rxTL' | 'rxTR' | 'rxBR' | 'rxBL') {
  if (rxSync.value) {
    const val = fields.value[corner]
    fields.value.rxTL = val
    fields.value.rxTR = val
    fields.value.rxBR = val
    fields.value.rxBL = val
  }
  await commitRx()
}

async function onRoomTypeChange() {
  await store.updateRoomProps({ roomType: fields.value.roomType })
  fields.value.walkable = fields.value.roomType !== 'wall'
}

async function onWalkableToggle() {
  await store.updateRoomProps({ walkable: fields.value.walkable })
}

async function saveRoomTags(tags: string[]) {
  roomTags.value = tags
  await store.updateRoomProps({ tags })
}

async function updateEntrances() {
  await store.updateRoomProps({ entrances: entrances.value.length > 0 ? entrances.value.map(e => ({ ...e })) : undefined })
}

async function addEntrance() {
  entrances.value.push({ side: 'top', offset: Math.max(0, fields.value.w / 2 - 12.5), width: 25 })
  await updateEntrances()
}

async function removeEntrance(index: number) {
  entrances.value.splice(index, 1)
  await updateEntrances()
}

async function updateAnchors() {
  await store.updateRoomProps({ anchorPoints: anchors.value.map(p => [...p] as [number, number]) })
}

async function addAnchor() {
  anchors.value.push([fields.value.w / 2, fields.value.h / 2])
  await updateAnchors()
}

async function removeAnchor(index: number) {
  anchors.value.splice(index, 1)
  await updateAnchors()
}

async function clearFillColor() {
  fields.value.fillColor = ''
  await store.updateRoomProps({ fillColor: undefined })
}

async function saveAsTemplate() {
  const name = window.prompt('Template name:', props.room.label || 'Room Template')
  if (!name) return
  await store.addRoomTemplate(props.room, name)
  useToast().success('Room template saved')
}

async function saveRoomWithObjects() {
  const name = window.prompt('Template name (room + objects):', props.room.label || 'Room Template')
  if (!name) return
  await store.addRoomTemplate(props.room, name)
  useToast().success('Room + objects template saved')
}

async function onSave() {
  await run(() => store.saveLayout())
  useToast().success('Properties saved')
}

async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    useToast().success('ID copied')
  } catch {
    useToast().warning('Copy failed')
  }
}

async function remove() {
  await run(() => store.deleteSelected())
}
</script>

<template>
  <div class="properties-panel__content">
    <div class="properties-panel__section">
      <div class="properties-panel__section-title">Room</div>
      <div class="properties-panel__row">
      <label>ID</label>
      <div class="properties-panel__id-row">
        <input type="text" :value="room.id" disabled class="input input--readonly" title="Room ID" />
        <button class="btn btn-sm" @click="copyId(room.id)">Copy</button>
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
      <label>Width</label>
      <input class="input" type="number" v-model.number="fields.w" :class="{ 'input--error': errorFields.w }" @change="commitField('w')" />
    </div>
    <div class="properties-panel__row">
      <label>Height</label>
      <input class="input" type="number" v-model.number="fields.h" :class="{ 'input--error': errorFields.h }" @change="commitField('h')" />
    </div>
    <div class="properties-panel__row">
      <label>Label</label>
      <input class="input" type="text" v-model="fields.label" @change="commitField('label')" />
    </div>
    <div class="properties-panel__row">
      <label>Category</label>
      <select class="input" v-model="fields.category" @change="commitField('category')">
        <option value="">— Select —</option>
        <option value="public">Public</option>
        <option value="service">Service</option>
        <option value="back">Back</option>
        <option value="security">Security</option>
        <option value="utility">Utility</option>
        <option value="open">Open</option>
      </select>
    </div>
    <div class="properties-panel__row">
      <label>Room Type</label>
      <select class="input" v-model="fields.roomType" @change="onRoomTypeChange">
        <option value="room">Room</option>
        <option value="hallway">Hallway</option>
        <option value="elevator">Elevator</option>
        <option value="entrance">Entrance</option>
        <option value="wall">Wall</option>
        <optgroup label="Public">
          <option value="reception">Reception</option>
          <option value="lounge">Lounge</option>
          <option value="concierge">Concierge</option>
          <option value="bar">Bar</option>
          <option value="guestRoom">Guest Room</option>
        </optgroup>
        <optgroup label="Service">
          <option value="kitchen">Kitchen</option>
          <option value="laundry">Laundry</option>
          <option value="staffRoom">Staff Room</option>
          <option value="loadingBay">Loading Bay</option>
        </optgroup>
        <optgroup label="Security">
          <option value="armory">Armory</option>
          <option value="safeHouse">Safe House</option>
          <option value="controlCenter">Control Center</option>
          <option value="datacenter">Datacenter</option>
          <option value="vault">Vault</option>
          <option value="blackMarket">Black Market</option>
        </optgroup>
        <optgroup label="Special">
          <option value="rooftop">Rooftop</option>
        </optgroup>
      </select>
    </div>
    <div class="properties-panel__row">
      <label>NPC Tags</label>
      <TagPicker :model-value="roomTags" @update:model-value="saveRoomTags" placeholder="rest, service, target" />
    </div>
    <div class="properties-panel__row">
      <label>Walkable</label>
      <label class="properties-panel__rx-sync">
        <input type="checkbox" v-model="fields.walkable" @change="onWalkableToggle" /> NPC can walk here
      </label>
    </div>
    <div class="properties-panel__section">
      <div class="properties-panel__section-title">NPC Navigation</div>
      <div class="properties-panel__row">
        <label>Anchors</label>
        <button class="btn btn-sm" @click="addAnchor">+ Add</button>
      </div>
      <div v-if="invalidAnchorCount > 0" class="properties-panel__warning">{{ invalidAnchorCount }} anchor(s) are blocked or outside the room.</div>
      <div v-for="(anchor, index) in anchors" :key="`anchor-${index}`" class="properties-panel__row">
        <label>#{{ index + 1 }}</label>
        <div class="properties-panel__id-row">
          <input class="input" type="number" min="0" :max="fields.w" v-model.number="anchor[0]" @change="updateAnchors" />
          <input class="input" type="number" min="0" :max="fields.h" v-model.number="anchor[1]" @change="updateAnchors" />
          <button class="btn btn-sm" @click="removeAnchor(index)">×</button>
        </div>
      </div>
      <div class="properties-panel__row">
        <label>Entrances</label>
        <button class="btn btn-sm" @click="addEntrance">+ Add</button>
      </div>
      <div v-for="(entrance, index) in entrances" :key="`entrance-${index}`" class="properties-panel__row">
        <label>#{{ index + 1 }}</label>
        <div class="properties-panel__id-row">
          <select class="input" v-model="entrance.side" @change="updateEntrances">
            <option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option>
          </select>
          <input class="input" type="number" min="0" v-model.number="entrance.offset" @change="updateEntrances" />
          <input class="input" type="number" min="1" v-model.number="entrance.width" @change="updateEntrances" />
          <button class="btn btn-sm" @click="removeEntrance(index)">×</button>
        </div>
      </div>
    </div>
    <div class="properties-panel__row">
      <label>Radius</label>
      <input class="input" type="number" min="0" v-model.number="fields.radius" @change="commitField('radius')" />
    </div>
    <div class="properties-panel__row">
      <label>Padding</label>
      <input class="input" type="number" min="0" v-model.number="fields.padding" @change="commitField('padding')" />
    </div>
    <div class="properties-panel__row">
      <label>Corner Radius</label>
      <div class="properties-panel__rx-grid">
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">↖ TL</span>
          <input type="number" min="0" v-model.number="fields.rxTL" @input="onRxInput('rxTL')" class="input input-compact" />
        </div>
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">TR ↗</span>
          <input type="number" min="0" v-model.number="fields.rxTR" @input="onRxInput('rxTR')" class="input input-compact" />
        </div>
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">↙ BL</span>
          <input type="number" min="0" v-model.number="fields.rxBL" @input="onRxInput('rxBL')" class="input input-compact" />
        </div>
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">BR ↘</span>
          <input type="number" min="0" v-model.number="fields.rxBR" @input="onRxInput('rxBR')" class="input input-compact" />
        </div>
      </div>
    </div>
    <div class="properties-panel__row">
      <label></label>
      <label class="properties-panel__rx-sync">
        <input type="checkbox" v-model="rxSync" /> Sync all corners
      </label>
    </div>
    <div class="properties-panel__row">
      <label>Fill Color</label>
      <div class="properties-panel__color-row">
        <input type="color" :value="fields.fillColor || '#e8e4dc'" @input="fields.fillColor = ($event.target as HTMLInputElement).value; commitField('fillColor')" class="input input__color" />
        <button class="btn btn-sm" @click="clearFillColor">Reset</button>
      </div>
    </div>
    <div class="properties-panel__btn-group">
      <button class="btn" @click="saveAsTemplate">Save as Template</button>
      <button class="btn" @click="saveRoomWithObjects">Save Room + Objects</button>
    </div>
    <div class="properties-panel__delete-section">
      <button class="btn btn__success" :disabled="pending" @click="onSave">Save</button>
      <button class="btn" :disabled="pending" @click="store.select(null); store.selectAsset(null)">Deselect</button>
      <button class="btn btn__danger" :disabled="pending" @click="remove">Delete</button>
    </div>
    </div>
  </div>
</template>
