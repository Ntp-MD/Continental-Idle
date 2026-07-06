<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore, startAssetDrag } from '../editor-store'
import { useToast } from '@/composables/useToast'
import { BUILTIN_ASSETS } from '../editor-assets'
import type { AssetShape, AssetDef } from '../editor-types'

const store = useEditorStore()

const searchQuery = ref('')

const SHAPE_ICON: Record<AssetShape, string> = {
  rect: '▭',
  circle: '◯',
  round: '▢',
  arc: '◜',
}

function assetIcon(asset: AssetDef): string {
  if (asset.parts && asset.parts.length > 0) return '▦'
  if (asset.linkedParts && asset.linkedParts.length > 0) return '⛓'
  return SHAPE_ICON[asset.shape] ?? '▭'
}

function assetSizeLabel(asset: AssetDef): string {
  if (asset.parts && asset.parts.length > 0) return `${asset.parts.length} parts`
  if (asset.linkedParts && asset.linkedParts.length > 0) return `${asset.linkedParts.length} linked`
  if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}×${asset.pxH ?? asset.h}px`
  return `${asset.w}×${asset.h}`
}

const allAssets = computed(() => {
  const customIds = new Set(store.state.layout.customAssets.map(a => a.id))
  const hiddenIds = new Set(store.state.layout.hiddenBuiltinIds ?? [])
  return [
    ...BUILTIN_ASSETS.filter(a => !customIds.has(a.id) && !hiddenIds.has(a.id)),
    ...store.state.layout.customAssets,
  ]
})

const grouped = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const groups: Record<string, typeof allAssets.value> = {}
  for (const asset of allAssets.value) {
    if (q && !asset.name.toLowerCase().includes(q) && !asset.id.toLowerCase().includes(q) && !asset.category.toLowerCase().includes(q)) continue
    if (!groups[asset.category]) groups[asset.category] = []
    groups[asset.category].push(asset)
  }
  return groups
})

const categoryOrder = computed(() => {
  const stored = store.state.layout.assetCategories ?? []
  const all = new Set<string>(stored)
  for (const c of Object.keys(grouped.value)) all.add(c)
  return [...all].filter(cat => (grouped.value[cat]?.length ?? 0) > 0)
})

const showAddForm = ref(false)
const newName = ref('')
const newCategory = ref('')
const newW = ref(1)
const newH = ref(1)
const newShape = ref<AssetShape>('rect')
const newRx = ref(0)

const existingCategories = computed(() => {
  const stored = store.state.layout.assetCategories ?? []
  const cats = new Set<string>(stored)
  for (const a of allAssets.value) cats.add(a.category)
  return [...cats].sort()
})

function submitNewAsset() {
  if (!newName.value.trim()) {
    useToast().warning('Asset name cannot be empty')
    return
  }
  const rx = newRx.value > 0 ? { tl: newRx.value, tr: newRx.value, br: newRx.value, bl: newRx.value } : undefined
  store.addCustomAsset(newName.value.trim(), newW.value, newH.value, newShape.value, newCategory.value.trim(), undefined, undefined, rx)
  useToast().success('Asset added')
  newName.value = ''
  newCategory.value = ''
  newW.value = 1
  newH.value = 1
  newShape.value = 'rect'
  newRx.value = 0
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

</script>

<template>
  <div class="asset-palette">
    <div class="asset-palette__header">Asset Palette</div>
    <div class="asset-palette__search">
      <input class="asset-palette__search-input" v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
    </div>
    <div class="asset-palette__scroll">
      <div v-if="!Object.values(grouped).some(g => g.length)" class="asset-palette__empty">No assets found</div>
      <div v-for="cat in categoryOrder" :key="cat" class="asset-palette__category">
        <div class="asset-palette__category-title">{{ cat }}</div>
        <div v-if="!grouped[cat]?.length" class="asset-palette__category-empty">No items</div>
        <template v-for="asset in grouped[cat]" :key="asset.id">
          <div
            class="asset-palette__item"
            :class="{ 'asset-palette__item--selected': store.state.selectedAssetId === asset.id, 'asset-palette__item--composite': asset.parts && asset.parts.length > 0, 'asset-palette__item--linked': asset.linkedParts && asset.linkedParts.length > 0 }"
            @mousedown="onAssetMouseDown(asset.id, $event)"
            @click="onItemClick(asset.id)"
          >
            <span class="asset-palette__item-icon">{{ assetIcon(asset) }}</span>
            <span class="asset-palette__item-name">{{ asset.name }}</span>
            <span class="asset-palette__item-size">{{ assetSizeLabel(asset) }}</span>
          </div>
        </template>
      </div>
    </div>

    <button class="asset-palette__add-btn" @click="showAddForm = !showAddForm">
      {{ showAddForm ? 'Cancel' : '+ Add New Asset' }}
    </button>

    <div v-if="showAddForm" class="asset-palette__form">
      <input class="asset-palette__form-input" v-model="newName" placeholder="Asset name" />
      <select class="asset-palette__form-input" v-model="newCategory">
        <option value="" disabled>Select category...</option>
        <option v-for="cat in existingCategories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <input class="asset-palette__form-input" v-model="newCategory" placeholder="...or type new category" />
      <div class="asset-palette__form-row">
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" v-model.number="newW" placeholder="W" />
        <span>×</span>
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" v-model.number="newH" placeholder="H" />
      </div>
      <select class="asset-palette__form-input" v-model="newShape">
        <option value="rect">Rect</option>
        <option value="circle">Circle</option>
        <option value="round">Round</option>
        <option value="arc">Arc</option>
      </select>
      <input class="asset-palette__form-input" type="number" min="0" v-model.number="newRx" placeholder="Corner radius (0 = none)" />
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

.asset-palette__search {
  padding: 8px;
  border-bottom: 1px solid var(--border-dim, #252530);
}

.asset-palette__search-input {
  width: 100%;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.asset-palette__search-input:focus {
  outline: none;
  border-color: var(--accent-gold, #f0c040);
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

.asset-palette__category-empty {
  font-size: 10px;
  color: var(--text-dim, #6a6a74);
  padding: 2px 8px 6px;
  opacity: 0.5;
}

.asset-palette__item {
  display: flex;
  align-items: center;
  gap: 6px;
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

.asset-palette__item--composite .asset-palette__item-icon {
  color: var(--accent-gold, #f0c040);
}

.asset-palette__item--linked .asset-palette__item-icon {
  color: #06b6d4;
}

.asset-palette__item-icon {
  font-size: 14px;
  color: var(--text-dim, #6a6a74);
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.asset-palette__item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-palette__item-size {
  color: var(--text-dim, #6a6a74);
  font-size: 10px;
  flex-shrink: 0;
}

.asset-palette__empty {
  padding: 16px 8px;
  font-size: 12px;
  color: var(--text-dim, #6a6a74);
  text-align: center;
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
