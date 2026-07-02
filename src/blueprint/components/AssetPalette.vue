<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore, startAssetDrag } from '../editor-store'
import { BUILTIN_ASSETS, ASSET_CATEGORIES } from '../editor-assets'
import type { AssetShape, AssetDef } from '../editor-types'

const store = useEditorStore()

const allAssets = computed(() => [...BUILTIN_ASSETS, ...store.state.layout.customAssets])

const grouped = computed(() => {
  const groups: Record<string, typeof allAssets.value> = {}
  for (const asset of allAssets.value) {
    if (!groups[asset.category]) groups[asset.category] = []
    groups[asset.category].push(asset)
  }
  return groups
})

const categoryOrder = computed(() => [...ASSET_CATEGORIES, ...Object.keys(grouped.value).filter(c => !(ASSET_CATEGORIES as readonly string[]).includes(c))])

const showAddForm = ref(false)
const newName = ref('')
const newW = ref(1)
const newH = ref(1)
const newShape = ref<AssetShape>('rect')

function submitNewAsset() {
  if (!newName.value.trim()) return
  store.addCustomAsset(newName.value.trim(), newW.value, newH.value, newShape.value)
  newName.value = ''
  newW.value = 1
  newH.value = 1
  newShape.value = 'rect'
  showAddForm.value = false
}

function onAssetMouseDown(assetId: string, e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  store.setMode('object')
  startAssetDrag(assetId)
}

/* ---------- Click to select asset for PropertiesPanel ---------- */
function onItemClick(assetId: string) {
  store.selectAsset(assetId)
}

function onEditClick(asset: AssetDef, e: MouseEvent) {
  e.stopPropagation()
  store.selectAsset(asset.id)
}

function onDeleteAsset(id: string, e: MouseEvent) {
  e.stopPropagation()
  if (!window.confirm('Delete this custom asset? Objects already placed will remain.')) return
  store.deleteCustomAsset(id)
}
</script>

<template>
  <div class="asset-palette">
    <div class="asset-palette__header">Asset Palette</div>
    <div class="asset-palette__scroll">
      <div v-for="cat in categoryOrder" :key="cat" v-show="grouped[cat]?.length" class="asset-palette__category">
        <div class="asset-palette__category-title">{{ cat }}</div>
        <template v-for="asset in grouped[cat]" :key="asset.id">
          <div
            class="asset-palette__item"
            :class="{ 'asset-palette__item--selected': store.state.selectedAssetId === asset.id }"
            @mousedown="onAssetMouseDown(asset.id, $event)"
            @click="onItemClick(asset.id)"
          >
            <span class="asset-palette__item-name">{{ asset.name }}</span>
            <span class="asset-palette__item-right">
              <span class="asset-palette__item-size">{{ asset.pxW ?? asset.w }}×{{ asset.pxH ?? asset.h }}{{ (asset.pxW || asset.pxH) ? 'px' : '' }}</span>
              <span v-if="asset.custom" class="asset-palette__item-edit" title="Edit" aria-label="Edit asset" @mousedown.stop="onEditClick(asset, $event)">✎</span>
              <span v-if="asset.custom" class="asset-palette__item-delete" title="Delete" aria-label="Delete asset" @mousedown.stop="onDeleteAsset(asset.id, $event)">✕</span>
            </span>
          </div>
        </template>
      </div>
    </div>

    <button class="asset-palette__add-btn" @click="showAddForm = !showAddForm">
      {{ showAddForm ? 'Cancel' : '+ Add New Asset' }}
    </button>

    <div v-if="showAddForm" class="asset-palette__form">
      <input class="asset-palette__form-input" v-model="newName" placeholder="Asset name" />
      <div class="asset-palette__form-row">
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" v-model.number="newW" placeholder="W" />
        <span>×</span>
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" v-model.number="newH" placeholder="H" />
      </div>
      <select class="asset-palette__form-input" v-model="newShape">
        <option value="rect">Rect</option>
        <option value="circle">Circle</option>
        <option value="round">Round</option>
      </select>
      <button class="asset-palette__form-submit" @click="submitNewAsset">Add Asset</button>
    </div>
  </div>
</template>

<style scoped>
.asset-palette {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-width: 220px;
  background: var(--bg-card, #161820);
  border-right: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
}

.asset-palette__header {
  padding: 12px 14px;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.asset-palette__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.asset-palette__category-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim, #6a6a74);
  margin: 10px 0 4px;
}

.asset-palette__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: grab;
  font-size: 12px;
  user-select: none;
}

.asset-palette__item:hover {
  background: var(--bg-card-hover, #1c1e28);
}

.asset-palette__item--selected {
  background: var(--accent-gold-dim, rgba(240, 192, 64, 0.12));
  border-left: 2px solid var(--accent-gold, #f0c040);
}

.asset-palette__item-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.asset-palette__item-size {
  color: var(--text-dim, #6a6a74);
  font-size: 11px;
}

.asset-palette__item-edit {
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 12px;
  padding: 1px 3px;
  border-radius: 3px;
}

.asset-palette__item-edit:hover {
  color: var(--accent-gold, #f0c040);
}

.asset-palette__item-delete {
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 11px;
  padding: 1px 3px;
  border-radius: 3px;
}

.asset-palette__item-delete:hover {
  color: var(--accent-red, #ef4444);
}

.asset-palette__add-btn {
  margin: 8px;
  padding: 8px;
  background: var(--bg-tertiary, #101216);
  border: 1px dashed var(--border-dim, #252530);
  color: var(--text-secondary, #a0a0a8);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.asset-palette__add-btn:hover {
  border-color: var(--accent-gold, #f0c040);
  color: var(--accent-gold, #f0c040);
}

.asset-palette__form {
  margin: 0 8px 8px;
  padding: 8px;
  background: var(--bg-tertiary, #101216);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.asset-palette__form-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.asset-palette__form-input {
  background: var(--bg-secondary, #0c0d10);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px;
  border-radius: 4px;
  font-size: 12px;
}

.asset-palette__form-input--num {
  width: 50px;
}

.asset-palette__form-submit {
  background: var(--accent-gold, #f0c040);
  color: #08090c;
  border: none;
  padding: 6px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 12px;
}

.asset-palette__form-submit:hover {
  opacity: 0.85;
}
</style>
