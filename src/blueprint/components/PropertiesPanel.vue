<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEditorStore } from '../editor-store'
import { ROOM_CATEGORIES, ROOM_CATEGORY_LABELS } from '../editor-types'
import type { RoomCategory, AssetShape, RoomData, ObjectData, AssetDef } from '../editor-types'

const store = useEditorStore()

const room = computed(() => store.selectedRoom())
const object = computed(() => store.selectedObject())
const asset = computed(() => store.selectedAsset.value)

const fields = ref({ x: 0, y: 0, w: 0, h: 0, label: '', cat: 'public' as RoomCategory, radius: 0, labelPadding: 0, padding: 0 })
const errorFields = ref<Record<string, boolean>>({})

const assetFields = ref({ name: '', w: 1, h: 1, shape: 'rect' as AssetShape, pxW: 0, pxH: 0 })

watch([room, object], () => {
  errorFields.value = {}
  if (room.value) {
    fields.value = { x: room.value.x, y: room.value.y, w: room.value.w, h: room.value.h, label: room.value.label, cat: room.value.cat, radius: room.value.radius ?? 0, labelPadding: 0, padding: 0 }
  } else if (object.value) {
    fields.value = { x: object.value.x, y: object.value.y, w: object.value.w, h: object.value.h, label: '', cat: 'public', radius: object.value.radius ?? 0, labelPadding: object.value.labelPadding ?? 0, padding: object.value.padding ?? 0 }
  }
}, { immediate: true })

watch(asset, (a) => {
  if (a) {
    assetFields.value = { name: a.name, w: a.w, h: a.h, shape: a.shape, pxW: a.pxW ?? 0, pxH: a.pxH ?? 0 }
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

function commitObjectField(field: 'x' | 'y' | 'w' | 'h' | 'radius' | 'labelPadding' | 'padding') {
  if (!object.value) return
  const patch: Partial<ObjectData> = { [field]: fields.value[field] } as Partial<ObjectData>
  const ok = store.updateObjectProps(patch)
  if (!ok) {
    flashError(field)
    ;(fields.value as unknown as Record<string, unknown>)[field] = (object.value as unknown as Record<string, unknown>)[field]
  }
}

function rotate() {
  store.rotateSelected()
}

function remove() {
  store.deleteSelected()
}

function commitAssetField(field: 'name' | 'w' | 'h' | 'shape' | 'pxW' | 'pxH') {
  if (!asset.value) return
  const val = assetFields.value[field]
  store.updateCustomAsset(asset.value.id, { [field]: val } as Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'shape' | 'category' | 'pxW' | 'pxH'>>)
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

function deleteAsset() {
  if (!asset.value) return
  if (!window.confirm('Delete this custom asset? Objects already placed will remain.')) return
  store.deleteCustomAsset(asset.value.id)
  store.selectAsset(null)
}
</script>

<template>
  <div class="properties-panel">
    <div class="properties-panel__header">
      <span>Properties</span>
      <span class="properties-panel__floor-context">{{ store.currentFloor.value?.label ?? '—' }} · {{ store.currentFloor.value?.name ?? '' }}</span>
    </div>

    <div v-if="!room && !object && !asset" class="properties-panel__empty">
      Select a room, object, or asset to edit
    </div>

    <!-- Asset editor -->
    <div v-if="asset" class="properties-panel__body properties-panel__body--scroll">
      <div class="properties-panel__section-title">Asset: {{ asset.name }}</div>
      <div class="properties-panel__row">
        <label>Name</label>
        <input type="text" v-model="assetFields.name" @change="commitAssetField('name')" />
      </div>
      <div class="properties-panel__row">
        <label>Width</label>
        <input type="number" min="1" v-model.number="assetFields.w" @change="commitAssetField('w')" />
      </div>
      <div class="properties-panel__row">
        <label>Height</label>
        <input type="number" min="1" v-model.number="assetFields.h" @change="commitAssetField('h')" />
      </div>
      <div class="properties-panel__row">
        <label>Shape</label>
        <select v-model="assetFields.shape" @change="commitAssetField('shape')">
          <option value="rect">Rect</option>
          <option value="circle">Circle</option>
          <option value="round">Round</option>
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
      <div v-if="asset.custom && (assetFields.pxW > 0 || assetFields.pxH > 0)" class="properties-panel__readonly-note">Using px override — tile size ignored</div>
      <div v-if="collapsedCount > 0" class="properties-panel__collapsed-alert">
        <span class="properties-panel__collapsed-icon">✕</span>
        <span>{{ collapsedCount }} object(s) collapsed — overlapping! Shown in red on canvas.</span>
      </div>
      <button v-if="asset.custom" class="properties-panel__btn properties-panel__btn--danger" @click="deleteAsset">Delete Asset</button>
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
        <input type="number" v-model.number="fields.w" :class="{ 'properties-panel__input--error': errorFields.w }" @change="room ? commitRoomField('w') : commitObjectField('w')" />
      </div>
      <div class="properties-panel__row">
        <label>Height</label>
        <input type="number" v-model.number="fields.h" :class="{ 'properties-panel__input--error': errorFields.h }" @change="room ? commitRoomField('h') : commitObjectField('h')" />
      </div>

      <template v-if="room">
        <div class="properties-panel__row">
          <label>Label</label>
          <input type="text" v-model="fields.label" @change="commitRoomField('label')" />
        </div>
        <div class="properties-panel__row">
          <label>Category</label>
          <select v-model="fields.cat" @change="commitRoomField('cat')">
            <option v-for="cat in ROOM_CATEGORIES" :key="cat" :value="cat">{{ ROOM_CATEGORY_LABELS[cat] }}</option>
          </select>
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
          <label>Radius</label>
          <input type="number" min="0" v-model.number="fields.radius" @change="commitObjectField('radius')" />
        </div>
        <div class="properties-panel__row">
          <label>Label Pad</label>
          <input type="number" v-model.number="fields.labelPadding" @change="commitObjectField('labelPadding')" />
        </div>
        <div class="properties-panel__row">
          <label>Padding</label>
          <input type="number" min="0" v-model.number="fields.padding" @change="commitObjectField('padding')" />
        </div>
        <button class="properties-panel__btn" @click="rotate">Rotate (R)</button>
      </template>

      <button class="properties-panel__btn properties-panel__btn--danger" @click="remove">Delete</button>
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
  padding: 16px;
  font-size: 12px;
  color: var(--text-dim, #6a6a74);
  flex-shrink: 0;
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
  width: 110px;
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
</style>
