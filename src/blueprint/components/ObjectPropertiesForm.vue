<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../assets-store'
import { findAssetCached } from '../assets-utils'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import type { ObjectData } from '../types'

const props = defineProps<{ object: ObjectData }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const fields = ref({ x: 0, y: 0, w: 0, h: 0, radius: 0, labelPadding: 0, padding: 0, fillColor: '', objLabel: '', rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 })
const errorFields = ref<Record<string, boolean>>({})
const rxSync = ref(true)

const customNotes = ref('')
const customTags = ref('')
const instanceLabel = ref('')

const FLASH_ERROR_MS = 1200
function flashError(field: string) {
  errorFields.value[field] = true
  setTimeout(() => { errorFields.value[field] = false }, FLASH_ERROR_MS)
}

const isSvgObject = computed(() => {
  const a = findAssetCached(store.assetMap(), props.object.type)
  return a?.kind === 'svg'
})

const isComposite = computed(() => {
  const asset = store.state.layout.customAssets.find(a => a.id === props.object.type)
  return asset?.kind === 'composite'
})

watch(() => props.object, (obj) => {
  errorFields.value = {}
  fields.value = { x: obj.x, y: obj.y, w: obj.w, h: obj.h, radius: obj.radius ?? 0, labelPadding: obj.labelPadding ?? 0, padding: obj.padding ?? 0, fillColor: obj.fillColor ?? '', objLabel: obj.label ?? '', rxTL: obj.rx?.tl ?? 0, rxTR: obj.rx?.tr ?? 0, rxBR: obj.rx?.br ?? 0, rxBL: obj.rx?.bl ?? 0 }
  if (obj.subId) {
    const cp = store.getObjectCustomProps(obj.subId)
    customNotes.value = cp?.notes ?? ''
    customTags.value = cp?.tags?.join(', ') ?? ''
    instanceLabel.value = store.getInstanceLabel(obj.subId) ?? ''
  } else {
    customNotes.value = ''
    customTags.value = ''
    instanceLabel.value = ''
  }
}, { immediate: true })

async function commitField(field: 'x' | 'y' | 'w' | 'h' | 'radius' | 'labelPadding' | 'padding' | 'fillColor' | 'objLabel') {
  if (field === 'fillColor') {
    await store.updateObjectProps({ fillColor: fields.value.fillColor || undefined })
    return
  }
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

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = fields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateObjectProps({ rx: undefined })
  } else {
    await store.updateObjectProps({ rx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
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

async function toggleLock() {
  await store.toggleObjectLock(props.object.id)
  useToast().info(props.object.locked ? 'Object unlocked' : 'Object locked')
}

async function clearFillColor() {
  fields.value.fillColor = ''
  await store.updateObjectProps({ fillColor: undefined })
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

async function saveCustomTags() {
  if (!props.object.subId) return
  const tags = customTags.value.split(',').map(t => t.trim()).filter(t => t)
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

async function doUngroup() {
  await store.ungroupObject(props.object.id)
}

async function onSave() {
  await run(() => store.saveLayout())
  useToast().success('Properties saved')
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
      <input type="number" :value="fields.w" disabled class="properties-panel__input--readonly" title="Object size is determined by its asset definition" />
    </div>
    <div class="properties-panel__row">
      <label>Height</label>
      <input type="number" :value="fields.h" disabled class="properties-panel__input--readonly" title="Object size is determined by its asset definition" />
    </div>
    <div class="properties-panel__row">
      <label>Rotation</label>
      <span class="properties-panel__value">{{ object.rotation }}°</span>
    </div>
    <template v-if="!isSvgObject">
      <div class="properties-panel__row">
        <label>Label Pad</label>
        <input type="number" min="0" v-model.number="fields.labelPadding" @change="commitField('labelPadding')" />
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
          <input type="color" :value="fields.fillColor || '#ffffff'" @input="fields.fillColor = ($event.target as HTMLInputElement).value; commitField('fillColor')" class="properties-panel__cat-color" />
          <button class="properties-panel__btn properties-panel__btn--sm" @click="clearFillColor">Reset</button>
        </div>
      </div>
    </template>
    <div class="properties-panel__row">
      <label>Label</label>
      <input type="text" v-model="fields.objLabel" @change="commitField('objLabel')" placeholder="Custom label" />
    </div>
    <div class="properties-panel__section-title">Instance Properties</div>
    <div class="properties-panel__row">
      <label>Instance Label</label>
      <input type="text" v-model="instanceLabel" @change="saveInstanceLabel" placeholder="Unique label for this instance" />
    </div>
    <div class="properties-panel__row">
      <label>Notes</label>
      <textarea v-model="customNotes" @change="saveCustomNotes" placeholder="Add notes..." class="properties-panel__textarea" rows="2"></textarea>
    </div>
    <div class="properties-panel__row">
      <label>Tags</label>
      <input type="text" v-model="customTags" @change="saveCustomTags" placeholder="tag1, tag2, tag3" />
    </div>
    <div class="properties-panel__btn-group">
      <button class="properties-panel__btn" @click="rotate">Rotate (R)</button>
      <button class="properties-panel__btn" @click="toggleLock">{{ object.locked ? 'Unlock' : 'Lock' }}</button>
      <button v-if="isComposite" class="properties-panel__btn" @click="doUngroup">Ungroup</button>
      <button v-if="object.linkedIds && object.linkedIds.length > 0" class="properties-panel__btn" @click="doUnlink">Unlink</button>
    </div>
    <div class="properties-panel__delete-section">
      <button class="properties-panel__btn properties-panel__btn--save" :disabled="pending" @click="onSave">Save</button>
      <button class="properties-panel__btn" :disabled="pending" @click="store.select(null); store.selectAsset(null)">Deselect</button>
      <button class="properties-panel__btn properties-panel__btn--danger" :disabled="pending" @click="remove">Delete</button>
    </div>
  </div>
</template>
