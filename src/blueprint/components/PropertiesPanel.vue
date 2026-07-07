<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEditorStore } from '../editor-store'
import { findAssetCached } from '../editor-assets'
import { useToast } from '@/composables/useToast'
import type { RoomData, ObjectData, AssetDef } from '../types'

const store = useEditorStore()

const room = computed(() => store.selectedRoom())
const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)

const fields = ref({ x: 0, y: 0, w: 0, h: 0, label: '', radius: 0, labelPadding: 0, padding: 0, fillColor: '', objLabel: '', rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0 })
const errorFields = ref<Record<string, boolean>>({})
const rxSync = ref(true)

const assetFields = ref({ name: '', w: 1, h: 1, category: '', pxW: 0, pxH: 0, usePx: false, defaultPadding: 0, rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0, defaultBgColor: '' })

const customNotes = ref('')
const customTags = ref('')
const instanceLabel = ref('')

watch([room, object], () => {
  errorFields.value = {}
  if (room.value) {
    fields.value = { x: room.value.x, y: room.value.y, w: room.value.w, h: room.value.h, label: room.value.label, radius: room.value.radius ?? 0, labelPadding: 0, padding: room.value.padding ?? 0, fillColor: room.value.fillColor ?? '', objLabel: '', rxTL: room.value.rx?.tl ?? 0, rxTR: room.value.rx?.tr ?? 0, rxBR: room.value.rx?.br ?? 0, rxBL: room.value.rx?.bl ?? 0 }
  } else if (object.value) {
    fields.value = { x: object.value.x, y: object.value.y, w: object.value.w, h: object.value.h, label: '', radius: object.value.radius ?? 0, labelPadding: object.value.labelPadding ?? 0, padding: object.value.padding ?? 0, fillColor: object.value.fillColor ?? '', objLabel: object.value.label ?? '', rxTL: object.value.rx?.tl ?? 0, rxTR: object.value.rx?.tr ?? 0, rxBR: object.value.rx?.br ?? 0, rxBL: object.value.rx?.bl ?? 0 }
    if (object.value.subId) {
      const props = store.getObjectCustomProps(object.value.subId)
      customNotes.value = props?.notes ?? ''
      customTags.value = props?.tags?.join(', ') ?? ''
      instanceLabel.value = store.getInstanceLabel(object.value.subId) ?? ''
    } else {
      customNotes.value = ''
      customTags.value = ''
      instanceLabel.value = ''
    }
  }
}, { immediate: true })

watch(asset, (a) => {
  if (a) {
    assetFields.value = { name: a.name, w: a.w, h: a.h, category: a.category, pxW: a.pxW ?? 0, pxH: a.pxH ?? 0, usePx: a.usePx ?? false, defaultPadding: a.defaultPadding ?? 0, rxTL: a.defaultRx?.tl ?? 0, rxTR: a.defaultRx?.tr ?? 0, rxBR: a.defaultRx?.br ?? 0, rxBL: a.defaultRx?.bl ?? 0, defaultBgColor: a.defaultBgColor ?? '' }
  }
}, { immediate: true })

const FLASH_ERROR_MS = 1200

function flashError(field: string) {
  errorFields.value[field] = true
  setTimeout(() => { errorFields.value[field] = false }, FLASH_ERROR_MS)
}

async function commitRoomField(field: 'x' | 'y' | 'w' | 'h' | 'label' | 'radius' | 'fillColor' | 'padding') {
  if (!room.value) return
  if (field === 'fillColor') {
    await store.updateRoomProps({ fillColor: fields.value.fillColor || undefined })
    return
  }
  const patch: Partial<RoomData> = { [field]: fields.value[field] } as Partial<RoomData>
  const ok = await store.updateRoomProps(patch)
  if (!ok) {
    flashError(field)
    ;(fields.value as unknown as Record<string, unknown>)[field] = (room.value as unknown as Record<string, unknown>)[field]
  }
}

async function commitRoomRx() {
  if (!room.value) return
  const { rxTL, rxTR, rxBR, rxBL } = fields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateRoomProps({ rx: undefined })
  } else {
    await store.updateRoomProps({ rx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
  }
}

async function onRoomRxInput(corner: 'rxTL' | 'rxTR' | 'rxBR' | 'rxBL') {
  if (rxSync.value) {
    const val = fields.value[corner]
    fields.value.rxTL = val
    fields.value.rxTR = val
    fields.value.rxBR = val
    fields.value.rxBL = val
  }
  await commitRoomRx()
}

async function clearRoomFillColor() {
  if (!room.value) return
  fields.value.fillColor = ''
  await store.updateRoomProps({ fillColor: undefined })
}

async function saveRoomAsTemplate() {
  if (!room.value) return
  const name = window.prompt('Template name:', room.value.label || 'Room Template')
  if (!name) return
  await store.addRoomTemplate(room.value, name)
  useToast().success('Room template saved')
}

async function commitObjectField(field: 'x' | 'y' | 'w' | 'h' | 'radius' | 'labelPadding' | 'padding' | 'fillColor' | 'objLabel') {
  if (!object.value) return
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
    ;(fields.value as unknown as Record<string, unknown>)[field] = (object.value as unknown as Record<string, unknown>)[field]
  }
}

async function commitRx() {
  if (!object.value) return
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
  if (!object.value) return
  await store.toggleObjectLock(object.value.id)
}

async function clearFillColor() {
  if (!object.value) return
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
  if (!object.value?.subId) return
  const props = store.getObjectCustomProps(object.value.subId) || {}
  props.notes = customNotes.value || undefined
  await store.setObjectCustomProps(object.value.subId, props)
}

async function saveCustomTags() {
  if (!object.value?.subId) return
  const tags = customTags.value.split(',').map(t => t.trim()).filter(t => t)
  const props = store.getObjectCustomProps(object.value.subId) || {}
  props.tags = tags.length > 0 ? tags : undefined
  await store.setObjectCustomProps(object.value.subId, props)
}

async function saveInstanceLabel() {
  if (!object.value?.subId) return
  if (instanceLabel.value) {
    await store.setInstanceLabel(object.value.subId, instanceLabel.value)
  } else {
    await store.deleteInstanceLabel(object.value.subId)
  }
}

async function commitAssetField(field: 'name' | 'w' | 'h' | 'category' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultBgColor') {
  if (!asset.value) return
  const val = assetFields.value[field]
  await store.updateCustomAsset(asset.value.id, { [field]: val } as Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'category' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultBgColor'>>)
}

async function toggleUsePx() {
  if (!asset.value) return
  assetFields.value.usePx = !assetFields.value.usePx
  await store.updateCustomAsset(asset.value.id, { usePx: assetFields.value.usePx })
}

const assetRxSync = ref(true)

async function commitAssetRx() {
  if (!asset.value) return
  const { rxTL, rxTR, rxBR, rxBL } = assetFields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateCustomAsset(asset.value.id, { defaultRx: undefined })
  } else {
    await store.updateCustomAsset(asset.value.id, { defaultRx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
  }
}

async function onAssetRxInput(corner: 'rxTL' | 'rxTR' | 'rxBR' | 'rxBL') {
  if (assetRxSync.value) {
    const val = assetFields.value[corner]
    assetFields.value.rxTL = val
    assetFields.value.rxTR = val
    assetFields.value.rxBR = val
    assetFields.value.rxBL = val
  }
  await commitAssetRx()
}

async function clearAssetBgColor() {
  if (!asset.value) return
  assetFields.value.defaultBgColor = ''
  await store.updateCustomAsset(asset.value.id, { defaultBgColor: undefined })
}

const isCompositeAsset = computed(() => !!(asset.value?.parts && asset.value.parts.length > 0))
const partCount = computed(() => asset.value?.parts?.length ?? 0)
const isLinkedAsset = computed(() => !!(asset.value?.linkedParts && asset.value.linkedParts.length > 0))
const linkedPartCount = computed(() => asset.value?.linkedParts?.length ?? 0)
const isSvgAsset = computed(() => !!(asset.value?.special && asset.value.svg))
const isSvgObject = computed(() => {
  if (!object.value) return false
  const a = findAssetCached(store.assetMap(), object.value.type)
  return !!(a?.special && a.svg)
})

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

async function onSaveAsset() {
  await store.saveLayout()
  useToast().success('Asset saved')
}

async function onSaveProps() {
  await store.saveLayout()
  useToast().success('Properties saved')
}

async function deleteAsset() {
  if (!asset.value) return
  const msg = assetInUse.value
    ? 'This asset is placed on floors. Deleting will remove all instances. Continue?'
    : 'Remove this asset from the palette?'
  if (!window.confirm(msg)) return
  await store.deleteCustomAsset(asset.value.id)
  store.selectAsset(null)
  useToast().success('Asset removed from palette')
}

/* ---------- Asset Category Manager ---------- */
const showCatManager = ref(false)

const assetCategories = computed(() => store.state.layout.assetCategories ?? [])

const newAssetCat = ref('')

async function addAssetCat() {
  const name = await store.addAssetCategory(newAssetCat.value)
  if (name) newAssetCat.value = ''
}

async function renameAssetCat(oldName: string) {
  const newName = window.prompt('Rename category:', oldName)
  if (!newName) return
  const trimmed = newName.trim()
  if (!trimmed) {
    useToast().warning('Category name cannot be empty')
    return
  }
  if (trimmed === oldName) return
  if (trimmed.length > 50) {
    useToast().warning('Category name too long (max 50 characters)')
    return
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    useToast().warning('Category name can only contain letters, numbers, spaces, hyphens, and underscores')
    return
  }
  await store.renameAssetCategory(oldName, trimmed)
}

async function deleteAssetCat(name: string) {
  await store.deleteAssetCategory(name)
}

async function doMerge() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  await store.mergeObjects([...store.state.multiSelection.ids])
}

async function doLink() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  await store.linkObjects([...store.state.multiSelection.ids])
}

async function doUnlink() {
  if (!object.value) return
  await store.unlinkObject(object.value.id)
}

const compositeName = ref('')
const linkedName = ref('')

async function doCreateComposite() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  const id = await store.createCompositeAssetFromSelection(compositeName.value || undefined)
  if (id) {
    compositeName.value = ''
  }
}

async function doCreateLinked() {
  if (!store.state.multiSelection || store.state.multiSelection.ids.length < 2) return
  const id = await store.createLinkedAssetFromSelection(linkedName.value || undefined)
  if (id) {
    linkedName.value = ''
  }
}

async function doUngroup() {
  if (!object.value) return
  await store.ungroupObject(object.value.id)
}

/* ---------- Zone Management ---------- */
const showZoneManager = ref(false)
const newZoneLabel = ref('')
const newZoneColor = ref('#06b6d4')
const newZoneW = ref(200)
const newZoneH = ref(100)

const zones = computed(() => store.currentFloor.value?.zones ?? [])

async function addZone() {
  const floor = store.currentFloor.value
  if (!floor) return
  const t = store.state.layout.canvas.tileSize
  const x = Math.round((floor.rooms[0]?.x ?? 0) / t) * t
  const y = Math.round((floor.rooms[0]?.y ?? 0) / t) * t
  await store.addZone(x, y, newZoneW.value, newZoneH.value, newZoneLabel.value || undefined, newZoneColor.value || undefined)
  newZoneLabel.value = ''
  newZoneColor.value = '#06b6d4'
}

async function deleteZone(id: string) {
  await store.deleteZone(id)
}

async function updateZoneColor(id: string, color: string) {
  await store.updateZone(id, { color })
}

async function updateZoneLabel(id: string, label: string) {
  await store.updateZone(id, { label })
}

async function updateZoneX(id: string, x: number) {
  await store.updateZone(id, { x })
}

async function updateZoneY(id: string, y: number) {
  await store.updateZone(id, { y })
}

async function updateZoneW(id: string, w: number) {
  await store.updateZone(id, { w })
}

async function updateZoneH(id: string, h: number) {
  await store.updateZone(id, { h })
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
            <input type="color" :value="zone.color" @change="updateZoneColor(zone.id, ($event.target as HTMLInputElement).value)" class="properties-panel__cat-color" />
            <input type="text" :value="zone.label" @change="updateZoneLabel(zone.id, ($event.target as HTMLInputElement).value)" class="properties-panel__cat-label" />
            <button class="properties-panel__btn properties-panel__btn--danger properties-panel__btn--sm" @click="deleteZone(zone.id)">×</button>
          </div>
          <div class="properties-panel__zone-pos">
            <label>X</label>
            <input type="number" :value="zone.x" @change="updateZoneX(zone.id, +($event.target as HTMLInputElement).value)" />
            <label>Y</label>
            <input type="number" :value="zone.y" @change="updateZoneY(zone.id, +($event.target as HTMLInputElement).value)" />
          </div>
          <div class="properties-panel__zone-pos">
            <label>W</label>
            <input type="number" :value="zone.w" @change="updateZoneW(zone.id, +($event.target as HTMLInputElement).value)" />
            <label>H</label>
            <input type="number" :value="zone.h" @change="updateZoneH(zone.id, +($event.target as HTMLInputElement).value)" />
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
      <template v-if="!isSvgAsset">
      <div class="properties-panel__row">
        <label>Category</label>
        <select v-model="assetFields.category" @change="commitAssetField('category')">
          <option v-for="cat in assetCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <button class="properties-panel__btn" @click="showCatManager = !showCatManager">{{ showCatManager ? 'Close' : 'Manage Asset Categories' }}</button>
      <div v-if="showCatManager && asset" class="properties-panel__cat-manager">
        <div v-for="cat in assetCategories" :key="cat" class="properties-panel__cat-row">
          <span class="properties-panel__cat-label" @dblclick="renameAssetCat(cat)" title="Double-click to rename">{{ cat }}</span>
          <button class="properties-panel__btn properties-panel__btn--sm" @click="renameAssetCat(cat)" title="Rename">✎</button>
          <button class="properties-panel__btn properties-panel__btn--danger properties-panel__btn--sm" @click="deleteAssetCat(cat)">×</button>
        </div>
        <div class="properties-panel__cat-add">
          <input type="text" v-model="newAssetCat" placeholder="New category name" class="properties-panel__cat-label" />
          <button class="properties-panel__btn properties-panel__btn--sm" @click="addAssetCat">+</button>
        </div>
      </div>
      <template v-if="!isCompositeAsset && !isLinkedAsset">
        <div class="properties-panel__row">
          <label>Unit Mode</label>
          <div class="properties-panel__unit-toggle">
            <button class="properties-panel__unit-btn" :class="{ 'properties-panel__unit-btn--active': !assetFields.usePx }" @click="assetFields.usePx ? toggleUsePx() : null">Tiles</button>
            <button class="properties-panel__unit-btn" :class="{ 'properties-panel__unit-btn--active': assetFields.usePx }" @click="!assetFields.usePx ? toggleUsePx() : null">Pixels</button>
          </div>
        </div>
        <template v-if="!assetFields.usePx">
          <div class="properties-panel__row">
            <label>Width (tiles)</label>
            <input type="number" min="1" v-model.number="assetFields.w" @change="commitAssetField('w')" />
          </div>
          <div class="properties-panel__row">
            <label>Height (tiles)</label>
            <input type="number" min="1" v-model.number="assetFields.h" @change="commitAssetField('h')" />
          </div>
        </template>
        <template v-else>
          <div class="properties-panel__row">
            <label>Width (px)</label>
            <input type="number" min="1" v-model.number="assetFields.pxW" @change="commitAssetField('pxW')" />
          </div>
          <div class="properties-panel__row">
            <label>Height (px)</label>
            <input type="number" min="1" v-model.number="assetFields.pxH" @change="commitAssetField('pxH')" />
          </div>
        </template>
      </template>
      <div class="properties-panel__row">
        <label>Default Padding</label>
        <input type="number" min="0" v-model.number="assetFields.defaultPadding" @change="commitAssetField('defaultPadding')" />
      </div>
      <div class="properties-panel__row">
        <label>Bg Color</label>
        <div class="properties-panel__color-row">
          <input type="color" :value="assetFields.defaultBgColor || '#ffffff'" @input="assetFields.defaultBgColor = ($event.target as HTMLInputElement).value; commitAssetField('defaultBgColor')" class="properties-panel__cat-color" />
          <button class="properties-panel__btn properties-panel__btn--sm" @click="clearAssetBgColor">Reset</button>
        </div>
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
        <button class="properties-panel__btn properties-panel__btn--save" @click="onSaveAsset">Save Asset</button>
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
          <label>Radius</label>
          <input type="number" min="0" v-model.number="fields.radius" @change="commitRoomField('radius')" />
        </div>
        <div class="properties-panel__row">
          <label>Padding</label>
          <input type="number" min="0" v-model.number="fields.padding" @change="commitRoomField('padding')" />
        </div>
        <div class="properties-panel__row">
          <label>Corner Radius</label>
          <div class="properties-panel__rx-grid">
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">↖ TL</span>
              <input type="number" min="0" v-model.number="fields.rxTL" @input="onRoomRxInput('rxTL')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">TR ↗</span>
              <input type="number" min="0" v-model.number="fields.rxTR" @input="onRoomRxInput('rxTR')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">↙ BL</span>
              <input type="number" min="0" v-model.number="fields.rxBL" @input="onRoomRxInput('rxBL')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">BR ↘</span>
              <input type="number" min="0" v-model.number="fields.rxBR" @input="onRoomRxInput('rxBR')" class="properties-panel__rx-input" />
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
            <input type="color" :value="fields.fillColor || '#e8e4dc'" @input="fields.fillColor = ($event.target as HTMLInputElement).value; commitRoomField('fillColor')" class="properties-panel__cat-color" />
            <button class="properties-panel__btn properties-panel__btn--sm" @click="clearRoomFillColor">Reset</button>
          </div>
        </div>
        <div class="properties-panel__btn-group">
          <button class="properties-panel__btn" @click="saveRoomAsTemplate">Save as Template</button>
        </div>
      </template>

      <template v-if="object">
        <div class="properties-panel__row">
          <label>Rotation</label>
          <span class="properties-panel__value">{{ object.rotation }}°</span>
        </div>
        <template v-if="!isSvgObject">
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
        </template>
        <div class="properties-panel__row">
          <label>Label</label>
          <input type="text" v-model="fields.objLabel" @change="commitObjectField('objLabel')" placeholder="Custom label" />
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
      </template>

      <div class="properties-panel__delete-section">
        <button class="properties-panel__btn properties-panel__btn--save" @click="onSaveProps">Save</button>
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

.properties-panel__btn--save {
  color: #08090c;
  background: var(--accent-green, #3dd68c);
  border-color: var(--accent-green, #3dd68c);
  font-weight: bold;
}

.properties-panel__btn--save:hover:not(:disabled) {
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

.properties-panel__textarea {
  flex: 1;
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 40px;
  font-family: inherit;
}

.properties-panel__textarea:focus {
  outline: none;
  border-color: var(--accent-blue, #3b82f6);
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

.properties-panel__unit-toggle {
  display: flex;
  gap: 0;
  flex: 1;
}

.properties-panel__unit-btn {
  flex: 1;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-secondary, #a0a0a8);
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.properties-panel__unit-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.properties-panel__unit-btn:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.properties-panel__unit-btn--active {
  background: var(--accent-gold, #f0c040);
  color: #08090c;
  border-color: var(--accent-gold, #f0c040);
  font-weight: bold;
}
</style>
