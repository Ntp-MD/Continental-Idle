<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEditorStore } from '../editor-store'
import { useToast } from '@/composables/useToast'
import type { AssetShape, RoomData, ObjectData, AssetDef } from '../editor-types'

const store = useEditorStore()

const room = computed(() => store.selectedRoom())
const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)

const fields = ref({ x: 0, y: 0, w: 0, h: 0, label: '', cat: 'public', radius: 0, labelPadding: 0, padding: 0, fillColor: '', objLabel: '', rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 })
const errorFields = ref<Record<string, boolean>>({})
const rxSync = ref(true)

const assetFields = ref({ name: '', w: 1, h: 1, shape: 'rect' as AssetShape, category: '', pxW: 0, pxH: 0, defaultPadding: 0, rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 })

watch([room, object], () => {
  errorFields.value = {}
  if (room.value) {
    fields.value = { x: room.value.x, y: room.value.y, w: room.value.w, h: room.value.h, label: room.value.label, cat: room.value.cat, radius: room.value.radius ?? 0, labelPadding: 0, padding: 0, fillColor: '', objLabel: '', rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 }
  } else if (object.value) {
    fields.value = { x: object.value.x, y: object.value.y, w: object.value.w, h: object.value.h, label: '', cat: 'public', radius: object.value.radius ?? 0, labelPadding: object.value.labelPadding ?? 0, padding: object.value.padding ?? 0, fillColor: object.value.fillColor ?? '', objLabel: object.value.label ?? '', rxTL: object.value.rx?.tl ?? 0, rxTR: object.value.rx?.tr ?? 0, rxBR: object.value.rx?.br ?? 0, rxBL: object.value.rx?.bl ?? 0 }
  }
}, { immediate: true })

watch(asset, (a) => {
  if (a) {
    assetFields.value = { name: a.name, w: a.w, h: a.h, shape: a.shape, category: a.category, pxW: a.pxW ?? 0, pxH: a.pxH ?? 0, defaultPadding: a.defaultPadding ?? 0, rxTL: a.defaultRx?.tl ?? 0, rxTR: a.defaultRx?.tr ?? 0, rxBR: a.defaultRx?.br ?? 0, rxBL: a.defaultRx?.bl ?? 0 }
  }
}, { immediate: true })

function flashError(field: string) {
  errorFields.value[field] = true
  setTimeout(() => { errorFields.value[field] = false }, 1200)
}

function commitRoomField(field: 'x' | 'y' | 'w' | 'h' | 'label' | 'cat' | 'radius') {
  if (!room.value) return
  const patch: Partial<RoomData> = { [field]: fields.value[field] } as Partial<RoomData>
  const ok = store.updateRoomProps(patch)
  if (!ok) {
    flashError(field)
    ;(fields.value as unknown as Record<string, unknown>)[field] = (room.value as unknown as Record<string, unknown>)[field]
  }
}

function commitObjectField(field: 'x' | 'y' | 'w' | 'h' | 'radius' | 'labelPadding' | 'padding' | 'fillColor' | 'objLabel') {
  if (!object.value) return
  if (field === 'fillColor') {
    store.updateObjectProps({ fillColor: fields.value.fillColor || undefined })
    return
  }
  if (field === 'objLabel') {
    store.updateObjectProps({ label: fields.value.objLabel || undefined })
    return
  }
  const patch: Partial<ObjectData> = { [field]: fields.value[field] } as Partial<ObjectData>
  const ok = store.updateObjectProps(patch)
  if (!ok) {
    flashError(field)
    ;(fields.value as unknown as Record<string, unknown>)[field] = (object.value as unknown as Record<string, unknown>)[field]
  }
}

function commitRx() {
  if (!object.value) return
  const { rxTL, rxTR, rxBR, rxBL } = fields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    store.updateObjectProps({ rx: undefined })
  } else {
    store.updateObjectProps({ rx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
  }
}

function onRxInput(corner: 'rxTL' | 'rxTR' | 'rxBR' | 'rxBL') {
  if (rxSync.value) {
    const val = fields.value[corner]
    fields.value.rxTL = val
    fields.value.rxTR = val
    fields.value.rxBR = val
    fields.value.rxBL = val
  }
  commitRx()
}

function toggleLock() {
  if (!object.value) return
  store.toggleObjectLock(object.value.id)
}

function clearFillColor() {
  if (!object.value) return
  fields.value.fillColor = ''
  store.updateObjectProps({ fillColor: undefined })
}

function rotate() {
  store.rotateSelected()
}

function remove() {
  store.deleteSelected()
}

function commitAssetField(field: 'name' | 'w' | 'h' | 'shape' | 'category' | 'pxW' | 'pxH' | 'defaultPadding') {
  if (!asset.value) return
  const val = assetFields.value[field]
  store.updateCustomAsset(asset.value.id, { [field]: val } as Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'shape' | 'category' | 'pxW' | 'pxH' | 'defaultPadding'>>)
}

const assetRxSync = ref(true)

function commitAssetRx() {
  if (!asset.value) return
  const { rxTL, rxTR, rxBR, rxBL } = assetFields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    store.updateCustomAsset(asset.value.id, { defaultRx: undefined })
  } else {
    store.updateCustomAsset(asset.value.id, { defaultRx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
  }
}

function onAssetRxInput(corner: 'rxTL' | 'rxTR' | 'rxBR' | 'rxBL') {
  if (assetRxSync.value) {
    const val = assetFields.value[corner]
    assetFields.value.rxTL = val
    assetFields.value.rxTR = val
    assetFields.value.rxBR = val
    assetFields.value.rxBL = val
  }
  commitAssetRx()
}

const isCompositeAsset = computed(() => !!(asset.value?.parts && asset.value.parts.length > 0))
const partCount = computed(() => asset.value?.parts?.length ?? 0)
const isLinkedAsset = computed(() => !!(asset.value?.linkedParts && asset.value.linkedParts.length > 0))
const linkedPartCount = computed(() => asset.value?.linkedParts?.length ?? 0)

function resetPx() {
  assetFields.value.pxW = 0
  assetFields.value.pxH = 0
  store.updateCustomAsset(asset.value!.id, { pxW: 0, pxH: 0 })
}

const collapsedCount = computed(() => {
  if (!asset.value) return 0
  let count = 0
  for (const floor of store.state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.type === asset.value!.id && obj.collapsed) count++
    }
  }
  return count
})

const assetInUse = computed(() => {
  if (!asset.value) return false
  return store.state.layout.floors.some(f => f.objects.some(o => o.type === asset.value!.id))
})

function deleteAsset() {
  if (!asset.value) return
  const msg = assetInUse.value
    ? 'This asset is placed on floors. Deleting will remove all instances. Continue?'
    : 'Remove this asset from the palette?'
  if (!window.confirm(msg)) return
  store.deleteCustomAsset(asset.value.id)
  store.selectAsset(null)
  useToast().success('Asset removed from palette')
}

/* ---------- Room Category Manager ---------- */
const showCatManager = ref(false)
const newCatLabel = ref('')
const newCatColor = ref('#e0d4e8')

const roomCategories = computed(() => store.state.layout.roomCategories ?? [])
const assetCategories = computed(() => store.state.layout.assetCategories ?? [])

function addRoomCat() {
  const def = store.addRoomCategory(newCatLabel.value, newCatColor.value)
  if (def) {
    newCatLabel.value = ''
    newCatColor.value = '#e0d4e8'
  }
}

function deleteRoomCat(id: string) {
  store.deleteRoomCategory(id)
}

/* ---------- Asset Category Manager ---------- */
const newAssetCat = ref('')

function addAssetCat() {
  const name = store.addAssetCategory(newAssetCat.value)
  if (name) newAssetCat.value = ''
}

function deleteAssetCat(name: string) {
  store.deleteAssetCategory(name)
}

function doMerge() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  store.mergeObjects([...store.state.multiSelection.ids])
}

function doLink() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  store.linkObjects([...store.state.multiSelection.ids])
}

function doUnlink() {
  if (!object.value) return
  store.unlinkObject(object.value.id)
}

const compositeName = ref('')
const linkedName = ref('')

function doCreateComposite() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  const id = store.createCompositeAssetFromSelection(compositeName.value || undefined)
  if (id) {
    compositeName.value = ''
  }
}

function doCreateLinked() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  const id = store.createLinkedAssetFromSelection(linkedName.value || undefined)
  if (id) {
    linkedName.value = ''
  }
}

function doUngroup() {
  if (!object.value) return
  store.ungroupObject(object.value.id)
}

/* ---------- Zone Management ---------- */
const showZoneManager = ref(false)
const newZoneLabel = ref('')
const newZoneColor = ref('#06b6d4')
const newZoneW = ref(200)
const newZoneH = ref(100)

const zones = computed(() => store.currentFloor.value?.zones ?? [])

function addZone() {
  const floor = store.currentFloor.value
  if (!floor) return
  const x = Math.round((floor.rooms[0]?.x ?? 0) / 25) * 25
  const y = Math.round((floor.rooms[0]?.y ?? 0) / 25) * 25
  store.addZone(x, y, newZoneW.value, newZoneH.value, newZoneLabel.value || undefined, newZoneColor.value || undefined)
  newZoneLabel.value = ''
  newZoneColor.value = '#06b6d4'
}

function deleteZone(id: string) {
  store.deleteZone(id)
}

const isComposite = computed(() => {
  if (!object.value) return false
  const asset = store.state.layout.customAssets.find(a => a.id === object.value!.type)
  return !!(asset?.parts && asset.parts.length > 0)
})
</script>

<template>
  <div class="properties-panel">
    <div class="properties-panel__header">
      <span>Properties</span>
      <span class="properties-panel__floor-context">{{ store.currentFloor.value?.label ?? '—' }} · {{ store.currentFloor.value?.name ?? '' }}</span>
    </div>

    <div v-if="!room && !object && !asset && !store.state.multiSelection" class="properties-panel__body">
      <div class="properties-panel__empty">Select a room, object, or asset to edit properties.</div>
      <div class="properties-panel__empty-hint">Click an asset in the palette to edit its definition. Click an object on the canvas to edit instance properties.</div>
      <button class="properties-panel__btn" @click="showZoneManager = !showZoneManager">{{ showZoneManager ? 'Close' : 'Manage Zones' }}</button>
      <div v-if="showZoneManager" class="properties-panel__cat-manager">
        <div v-for="zone in zones" :key="zone.id" class="properties-panel__zone-row">
          <div class="properties-panel__cat-row">
            <input type="color" :value="zone.color" @change="store.updateZone(zone.id, { color: ($event.target as HTMLInputElement).value })" class="properties-panel__cat-color" />
            <input type="text" :value="zone.label" @change="store.updateZone(zone.id, { label: ($event.target as HTMLInputElement).value })" class="properties-panel__cat-label" />
            <button class="properties-panel__btn properties-panel__btn--danger properties-panel__btn--sm" @click="deleteZone(zone.id)">×</button>
          </div>
          <div class="properties-panel__zone-pos">
            <label>X</label>
            <input type="number" :value="zone.x" @change="store.updateZone(zone.id, { x: +($event.target as HTMLInputElement).value })" />
            <label>Y</label>
            <input type="number" :value="zone.y" @change="store.updateZone(zone.id, { y: +($event.target as HTMLInputElement).value })" />
          </div>
          <div class="properties-panel__zone-pos">
            <label>W</label>
            <input type="number" :value="zone.w" @change="store.updateZone(zone.id, { w: +($event.target as HTMLInputElement).value })" />
            <label>H</label>
            <input type="number" :value="zone.h" @change="store.updateZone(zone.id, { h: +($event.target as HTMLInputElement).value })" />
          </div>
        </div>
        <div class="properties-panel__cat-add">
          <input type="text" v-model="newZoneLabel" placeholder="Zone label" class="properties-panel__cat-label" />
          <input type="color" v-model="newZoneColor" class="properties-panel__cat-color" />
        </div>
        <div class="properties-panel__row">
          <label>W</label>
          <input type="number" min="25" step="25" v-model.number="newZoneW" />
        </div>
        <div class="properties-panel__row">
          <label>H</label>
          <input type="number" min="25" step="25" v-model.number="newZoneH" />
        </div>
        <button class="properties-panel__btn" @click="addZone">+ Add Zone</button>
      </div>
    </div>

    <!-- Multi-selection -->
    <div v-if="store.state.multiSelection && store.state.multiSelection.ids.length >= 2" class="properties-panel__body">
      <div class="properties-panel__section-title">{{ store.state.multiSelection.ids.length }} objects selected</div>
      <div class="properties-panel__row">
        <label>Tip</label>
        <span class="properties-panel__value">Shift+click to add/remove</span>
      </div>
      <button class="properties-panel__btn" @click="doMerge">Merge Objects</button>
      <button class="properties-panel__btn" @click="doLink">Link Objects</button>
      <div class="properties-panel__section-title">Save as Composite Asset</div>
      <div class="properties-panel__row">
        <label>Name</label>
        <input type="text" v-model="compositeName" placeholder="e.g. U-Shape Sofa" />
      </div>
      <button class="properties-panel__btn" @click="doCreateComposite">Save as Composite Asset</button>
      <div class="properties-panel__section-title">Save as Linked Set</div>
      <div class="properties-panel__row">
        <label>Name</label>
        <input type="text" v-model="linkedName" placeholder="e.g. Table + Chairs" />
      </div>
      <button class="properties-panel__btn" @click="doCreateLinked">Save as Linked Asset</button>
    </div>

    <!-- Asset editor -->
    <div v-if="asset" class="properties-panel__body properties-panel__body--scroll">
      <div class="properties-panel__section-title">Asset: {{ asset.name }}</div>
      <div v-if="isCompositeAsset" class="properties-panel__composite-info">
        <span class="properties-panel__collapsed-icon">▦</span>
        <span>Composite asset — {{ partCount }} parts. Size & shape are auto-calculated from parts.</span>
      </div>
      <div v-if="isLinkedAsset" class="properties-panel__linked-info">
        <span class="properties-panel__collapsed-icon">⛓</span>
        <span>Linked set — {{ linkedPartCount }} objects. Drag to place all parts linked together.</span>
      </div>
      <div class="properties-panel__row">
        <label>Name</label>
        <input type="text" v-model="assetFields.name" @change="commitAssetField('name')" />
      </div>
      <div class="properties-panel__row">
        <label>Category</label>
        <select v-model="assetFields.category" @change="commitAssetField('category')">
          <option v-for="cat in assetCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <button class="properties-panel__btn" @click="showCatManager = !showCatManager">{{ showCatManager ? 'Close' : 'Manage Asset Categories' }}</button>
      <div v-if="showCatManager && asset" class="properties-panel__cat-manager">
        <div v-for="cat in assetCategories" :key="cat" class="properties-panel__cat-row">
          <span class="properties-panel__cat-label">{{ cat }}</span>
          <button class="properties-panel__btn properties-panel__btn--danger properties-panel__btn--sm" @click="deleteAssetCat(cat)">×</button>
        </div>
        <div class="properties-panel__cat-add">
          <input type="text" v-model="newAssetCat" placeholder="New category name" class="properties-panel__cat-label" />
          <button class="properties-panel__btn properties-panel__btn--sm" @click="addAssetCat">+</button>
        </div>
      </div>
      <template v-if="!isCompositeAsset && !isLinkedAsset">
        <div class="properties-panel__row">
          <label>Width (tiles)</label>
          <input type="number" min="1" v-model.number="assetFields.w" @change="commitAssetField('w')" />
        </div>
        <div class="properties-panel__row">
          <label>Height (tiles)</label>
          <input type="number" min="1" v-model.number="assetFields.h" @change="commitAssetField('h')" />
        </div>
        <div class="properties-panel__row">
          <label>Shape</label>
          <select v-model="assetFields.shape" @change="commitAssetField('shape')">
            <option value="rect">Rect</option>
            <option value="circle">Circle</option>
            <option value="round">Round</option>
            <option value="arc">Arc</option>
          </select>
        </div>
        <div class="properties-panel__row">
          <label>px Width</label>
          <input type="number" min="0" v-model.number="assetFields.pxW" @change="commitAssetField('pxW')" />
        </div>
        <div class="properties-panel__row">
          <label>px Height</label>
          <input type="number" min="0" v-model.number="assetFields.pxH" @change="commitAssetField('pxH')" />
        </div>
        <button v-if="assetFields.pxW > 0 || assetFields.pxH > 0" class="properties-panel__btn properties-panel__btn--sm" @click="resetPx">Reset px Override</button>
        <div v-if="assetFields.pxW > 0 || assetFields.pxH > 0" class="properties-panel__readonly-note">Using px override — tile size ignored</div>
      </template>
      <div class="properties-panel__row">
        <label>Default Padding</label>
        <input type="number" min="0" v-model.number="assetFields.defaultPadding" @change="commitAssetField('defaultPadding')" />
      </div>
      <template v-if="!isCompositeAsset && !isLinkedAsset">
        <div class="properties-panel__row">
          <label>Corner Radius</label>
          <div class="properties-panel__rx-grid">
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">↖ TL</span>
              <input type="number" min="0" v-model.number="assetFields.rxTL" @input="onAssetRxInput('rxTL')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">TR ↗</span>
              <input type="number" min="0" v-model.number="assetFields.rxTR" @input="onAssetRxInput('rxTR')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">↙ BL</span>
              <input type="number" min="0" v-model.number="assetFields.rxBL" @input="onAssetRxInput('rxBL')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">BR ↘</span>
              <input type="number" min="0" v-model.number="assetFields.rxBR" @input="onAssetRxInput('rxBR')" class="properties-panel__rx-input" />
            </div>
          </div>
        </div>
        <div class="properties-panel__row">
          <label></label>
          <label class="properties-panel__rx-sync">
            <input type="checkbox" v-model="assetRxSync" /> Sync all corners
          </label>
        </div>
      </template>
      <div v-if="assetInUse" class="properties-panel__inuse-info">
        <span class="properties-panel__collapsed-icon">i</span>
        <span>Asset is placed on floors — changes apply to all instances.</span>
      </div>
      <div v-if="collapsedCount > 0" class="properties-panel__collapsed-alert">
        <span class="properties-panel__collapsed-icon">✕</span>
        <span>{{ collapsedCount }} object(s) collapsed — overlapping! Shown in red on canvas.</span>
      </div>
      <div class="properties-panel__delete-section">
        <button class="properties-panel__btn properties-panel__btn--danger" @click="deleteAsset">Delete Asset</button>
      </div>
    </div>

    <!-- Room/Object editor -->
    <div v-else-if="room || object" class="properties-panel__body properties-panel__body--scroll">
      <div class="properties-panel__row">
        <label>X</label>
        <input type="number" v-model.number="fields.x" :class="{ 'properties-panel__input--error': errorFields.x }" @change="room ? commitRoomField('x') : commitObjectField('x')" />
      </div>
      <div class="properties-panel__row">
        <label>Y</label>
        <input type="number" v-model.number="fields.y" :class="{ 'properties-panel__input--error': errorFields.y }" @change="room ? commitRoomField('y') : commitObjectField('y')" />
      </div>
      <div class="properties-panel__row">
        <label>Width</label>
        <input v-if="room" type="number" v-model.number="fields.w" :class="{ 'properties-panel__input--error': errorFields.w }" @change="commitRoomField('w')" />
        <input v-else type="number" :value="fields.w" disabled class="properties-panel__input--readonly" title="Object size is determined by its asset definition" />
      </div>
      <div class="properties-panel__row">
        <label>Height</label>
        <input v-if="room" type="number" v-model.number="fields.h" :class="{ 'properties-panel__input--error': errorFields.h }" @change="commitRoomField('h')" />
        <input v-else type="number" :value="fields.h" disabled class="properties-panel__input--readonly" title="Object size is determined by its asset definition" />
      </div>

      <template v-if="room">
        <div class="properties-panel__row">
          <label>Label</label>
          <input type="text" v-model="fields.label" @change="commitRoomField('label')" />
        </div>
        <div class="properties-panel__row">
          <label>Category</label>
          <select v-model="fields.cat" @change="commitRoomField('cat')">
            <option v-for="cat in roomCategories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
          </select>
        </div>
        <button class="properties-panel__btn" @click="showCatManager = !showCatManager">{{ showCatManager ? 'Close' : 'Manage Categories' }}</button>
        <div v-if="showCatManager" class="properties-panel__cat-manager">
          <div v-for="cat in roomCategories" :key="cat.id" class="properties-panel__cat-row">
            <input type="color" :value="cat.color" @input="store.updateRoomCategory(cat.id, { color: ($event.target as HTMLInputElement).value })" class="properties-panel__cat-color" />
            <input type="text" :value="cat.label" @change="store.updateRoomCategory(cat.id, { label: ($event.target as HTMLInputElement).value })" class="properties-panel__cat-label" />
            <button v-if="!cat.builtin" class="properties-panel__btn properties-panel__btn--danger properties-panel__btn--sm" @click="deleteRoomCat(cat.id)">×</button>
          </div>
          <div class="properties-panel__cat-add">
            <input type="text" v-model="newCatLabel" placeholder="New category name" class="properties-panel__cat-label" />
            <input type="color" v-model="newCatColor" class="properties-panel__cat-color" />
            <button class="properties-panel__btn properties-panel__btn--sm" @click="addRoomCat">+</button>
          </div>
        </div>
        <div class="properties-panel__row">
          <label>Radius</label>
          <input type="number" min="0" v-model.number="fields.radius" @change="commitRoomField('radius')" />
        </div>
      </template>

      <template v-if="object">
        <div class="properties-panel__row">
          <label>Rotation</label>
          <span class="properties-panel__value">{{ object.rotation }}°</span>
        </div>
        <div class="properties-panel__row">
          <label>Label Pad</label>
          <input type="number" min="0" v-model.number="fields.labelPadding" @change="commitObjectField('labelPadding')" />
        </div>
        <div class="properties-panel__row">
          <label>Padding</label>
          <input type="number" min="0" v-model.number="fields.padding" @change="commitObjectField('padding')" />
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
            <input type="color" :value="fields.fillColor || '#ffffff'" @input="fields.fillColor = ($event.target as HTMLInputElement).value; commitObjectField('fillColor')" class="properties-panel__cat-color" />
            <button class="properties-panel__btn properties-panel__btn--sm" @click="clearFillColor">Reset</button>
          </div>
        </div>
        <div class="properties-panel__row">
          <label>Label</label>
          <input type="text" v-model="fields.objLabel" @change="commitObjectField('objLabel')" placeholder="Custom label" />
        </div>
        <div class="properties-panel__btn-group">
          <button class="properties-panel__btn" @click="rotate">Rotate (R)</button>
          <button class="properties-panel__btn" @click="toggleLock">{{ object.locked ? 'Unlock' : 'Lock' }}</button>
          <button v-if="isComposite" class="properties-panel__btn" @click="doUngroup">Ungroup</button>
          <button v-if="object.linkedIds && object.linkedIds.length > 0" class="properties-panel__btn" @click="doUnlink">Unlink</button>
        </div>
      </template>

      <div class="properties-panel__delete-section">
        <button class="properties-panel__btn" @click="store.select(null); store.selectAsset(null)">Deselect</button>
        <button v-if="object || room" class="properties-panel__btn properties-panel__btn--danger" @click="remove">Delete</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  width: 260px;
  min-width: 260px;
  background: var(--bg-card, #161820);
  border-left: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.properties-panel__header {
  padding: 12px 14px;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border-dim, #252530);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.properties-panel__floor-context {
  font-size: 10px;
  font-weight: normal;
  letter-spacing: 0;
  color: var(--text-dim, #6a6a74);
}

.properties-panel__empty {
  padding: 16px 0;
  font-size: 12px;
  color: var(--text-dim, #6a6a74);
  flex-shrink: 0;
}

.properties-panel__empty-hint {
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
  line-height: 1.5;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--border-dim, #252530);
  margin-bottom: 4px;
}

.properties-panel__section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--accent-gold, #f0c040);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.properties-panel__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.properties-panel__body--scroll {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.properties-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.properties-panel__row input,
.properties-panel__row select {
  flex: 1;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 5px 6px;
  border-radius: 4px;
}

.properties-panel__input--error {
  border-color: var(--accent-red, #ef4444) !important;
  box-shadow: 0 0 0 1px var(--accent-red, #ef4444);
}

.properties-panel__value {
  color: var(--text-secondary, #a0a0a8);
}

.properties-panel__btn {
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.properties-panel__btn:hover:not(:disabled):not(.properties-panel__btn--danger) {
  border-color: var(--accent-gold, #f0c040);
}

.properties-panel__btn--danger {
  color: var(--accent-red, #ef4444);
  border-color: var(--accent-red, #ef4444);
}

.properties-panel__btn--danger:hover:not(:disabled) {
  opacity: 0.85;
}

.properties-panel__readonly-note {
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
  font-style: italic;
  padding: 4px 0;
}

.properties-panel__inuse-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: var(--accent-gold, #f0c040);
  background: rgba(240, 192, 64, 0.08);
  border: 1px solid rgba(240, 192, 64, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
}

.properties-panel__inuse-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
  background: rgba(100, 100, 120, 0.08);
  border: 1px solid rgba(100, 100, 120, 0.2);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
}

.properties-panel__collapsed-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: var(--accent-red, #ef4444);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
}

.properties-panel__collapsed-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
}

.properties-panel__cat-manager {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--bg-tertiary, #101216);
  border-radius: 6px;
  margin: 4px 0;
}

.properties-panel__cat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.properties-panel__cat-color {
  width: 28px;
  height: 24px;
  border: 1px solid var(--border-dim, #252530);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.properties-panel__cat-label {
  flex: 1;
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 0;
}

.properties-panel__cat-add {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.properties-panel__btn--sm {
  padding: 4px 8px;
  font-size: 14px;
  min-width: 28px;
}

.properties-panel__color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.properties-panel__zone-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.properties-panel__zone-pos {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.properties-panel__zone-pos label {
  color: var(--text-dim, #6a6a74);
  min-width: 12px;
}

.properties-panel__zone-pos input {
  width: 60px;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 3px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.properties-panel__rx-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  width: 100%;
}

.properties-panel__rx-corner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.properties-panel__rx-label {
  font-size: 10px;
  color: var(--text-dim, #6a6a74);
  min-width: 28px;
  flex-shrink: 0;
}

.properties-panel__rx-sync {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-dim, #6a6a74);
}

.properties-panel__rx-sync input {
  width: auto;
}

.properties-panel__rx-input {
  width: 100%;
  min-width: 0;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 3px 4px;
  border-radius: 3px;
  font-size: 11px;
  text-align: center;
}

.properties-panel__composite-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent-gold, #f0c040);
  background: rgba(240, 192, 64, 0.08);
  border: 1px solid rgba(240, 192, 64, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.properties-panel__linked-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.properties-panel__btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
}

.properties-panel__btn-group .properties-panel__btn {
  flex: 1;
  min-width: 70px;
}

.properties-panel__delete-section {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-dim, #252530);
}

.properties-panel__delete-section .properties-panel__btn {
  flex: 1;
}
</style>
