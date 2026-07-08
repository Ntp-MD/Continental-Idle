<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAssetsStore } from '../assets-store'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import type { RoomData } from '../types'

const props = defineProps<{ room: RoomData }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const fields = ref({ x: 0, y: 0, w: 0, h: 0, label: '', radius: 0, padding: 0, fillColor: '', rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 })
const errorFields = ref<Record<string, boolean>>({})
const rxSync = ref(true)

const FLASH_ERROR_MS = 1200
function flashError(field: string) {
  errorFields.value[field] = true
  setTimeout(() => { errorFields.value[field] = false }, FLASH_ERROR_MS)
}

watch(() => props.room, (room) => {
  errorFields.value = {}
  fields.value = { x: room.x, y: room.y, w: room.w, h: room.h, label: room.label, radius: room.radius ?? 0, padding: room.padding ?? 0, fillColor: room.fillColor ?? '', rxTL: room.rx?.tl ?? 0, rxTR: room.rx?.tr ?? 0, rxBR: room.rx?.br ?? 0, rxBL: room.rx?.bl ?? 0 }
}, { immediate: true })

async function commitField(field: 'x' | 'y' | 'w' | 'h' | 'label' | 'radius' | 'fillColor' | 'padding') {
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

async function onSave() {
  await run(() => store.saveLayout())
  useToast().success('Properties saved')
}

async function remove() {
  await run(() => store.deleteSelected())
}
</script>

<template>
  <div class="properties-panel__content">
    <div class="properties-panel__row">
      <label>X</label>
      <input type="number" v-model.number="fields.x" :class="{ 'properties-panel__input--error': errorFields.x }" @change="commitField('x')" />
    </div>
    <div class="properties-panel__row">
      <label>Y</label>
      <input type="number" v-model.number="fields.y" :class="{ 'properties-panel__input--error': errorFields.y }" @change="commitField('y')" />
    </div>
    <div class="properties-panel__row">
      <label>Width</label>
      <input type="number" v-model.number="fields.w" :class="{ 'properties-panel__input--error': errorFields.w }" @change="commitField('w')" />
    </div>
    <div class="properties-panel__row">
      <label>Height</label>
      <input type="number" v-model.number="fields.h" :class="{ 'properties-panel__input--error': errorFields.h }" @change="commitField('h')" />
    </div>
    <div class="properties-panel__row">
      <label>Label</label>
      <input type="text" v-model="fields.label" @change="commitField('label')" />
    </div>
    <div class="properties-panel__row">
      <label>Radius</label>
      <input type="number" min="0" v-model.number="fields.radius" @change="commitField('radius')" />
    </div>
    <div class="properties-panel__row">
      <label>Padding</label>
      <input type="number" min="0" v-model.number="fields.padding" @change="commitField('padding')" />
    </div>
    <div class="properties-panel__row">
      <label>Corner Radius</label>
      <div class="properties-panel__rx-grid">
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">↖ TL</span>
          <input type="number" min="0" v-model.number="fields.rxTL" @input="onRxInput('rxTL')" class="properties-panel__rx-input" />
        </div>
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">TR ↗</span>
          <input type="number" min="0" v-model.number="fields.rxTR" @input="onRxInput('rxTR')" class="properties-panel__rx-input" />
        </div>
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">↙ BL</span>
          <input type="number" min="0" v-model.number="fields.rxBL" @input="onRxInput('rxBL')" class="properties-panel__rx-input" />
        </div>
        <div class="properties-panel__rx-corner">
          <span class="properties-panel__rx-label">BR ↘</span>
          <input type="number" min="0" v-model.number="fields.rxBR" @input="onRxInput('rxBR')" class="properties-panel__rx-input" />
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
        <input type="color" :value="fields.fillColor || '#e8e4dc'" @input="fields.fillColor = ($event.target as HTMLInputElement).value; commitField('fillColor')" class="properties-panel__cat-color" />
        <button class="properties-panel__btn properties-panel__btn--sm" @click="clearFillColor">Reset</button>
      </div>
    </div>
    <div class="properties-panel__btn-group">
      <button class="properties-panel__btn" @click="saveAsTemplate">Save as Template</button>
    </div>
    <div class="properties-panel__delete-section">
      <button class="properties-panel__btn properties-panel__btn--save" :disabled="pending" @click="onSave">Save</button>
      <button class="properties-panel__btn" :disabled="pending" @click="store.select(null); store.selectAsset(null)">Deselect</button>
      <button class="properties-panel__btn properties-panel__btn--danger" :disabled="pending" @click="remove">Delete</button>
    </div>
  </div>
</template>
