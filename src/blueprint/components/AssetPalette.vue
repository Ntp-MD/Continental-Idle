<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAssetsStore, startAssetDrag, startRoomTemplateDrag } from '../assets-store'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import { SEED_ASSETS } from '../assets-property'
import type { AssetDef } from '../types'

const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const searchQuery = ref('')

function assetIcon(asset: AssetDef): string {
  switch (asset.kind) {
    case 'svg': return '★'
    case 'composite': return '▦'
    case 'linked': return '⛓'
    default: return '▭'
  }
}

function assetSizeLabel(asset: AssetDef): string {
  switch (asset.kind) {
    case 'composite': return `${asset.parts.length} parts`
    case 'linked': return `${asset.linkedParts.length} linked`
    case 'simple':
      if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}×${asset.pxH ?? asset.h}px`
      return `${asset.w}×${asset.h}`
    default: return `${asset.w}×${asset.h}`
  }
}

const allAssets = computed(() => {
  return [...SEED_ASSETS, ...store.state.layout.customAssets]
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
const newCategoryCustom = ref('')
const newW = ref(1)
const newH = ref(1)
const newRx = ref(0)
const newBgColor = ref('')

const showSvgForm = ref(false)
const svgName = ref('')
const svgW = ref(1)
const svgH = ref(1)
const svgContent = ref('')
const svgCategory = ref('')

const TILE_UNIT = 25

watch(svgContent, (val) => {
  if (!val) return
  const m = val.match(/viewBox\s*=\s*["']([^"']+)["']/)
  if (!m) return
  const parts = m[1].split(/[\s,]+/).map(Number)
  if (parts.length < 4 || parts.some(isNaN)) return
  const vbW = parts[2]
  const vbH = parts[3]
  if (vbW <= 0 || vbH <= 0) return
  svgW.value = Math.max(1, Math.round(vbW / TILE_UNIT))
  svgH.value = Math.max(1, Math.round(vbH / TILE_UNIT))
})

const existingCategories = computed(() => {
  const stored = store.state.layout.assetCategories ?? []
  const cats = new Set<string>(stored)
  for (const a of allAssets.value) cats.add(a.category)
  return [...cats].sort()
})

async function submitNewAsset() {
  if (!newName.value.trim()) {
    useToast().warning('Asset name cannot be empty')
    return
  }
  const rx = newRx.value > 0 ? { tl: newRx.value, tr: newRx.value, br: newRx.value, bl: newRx.value } : undefined
  const category = newCategoryCustom.value.trim() || newCategory.value.trim()
  await run(() => store.addCustomAsset(newName.value.trim(), newW.value, newH.value, category, undefined, undefined, rx, newBgColor.value || undefined))
  useToast().success('Asset added')
  newName.value = ''
  newCategory.value = ''
  newCategoryCustom.value = ''
  newW.value = 1
  newH.value = 1
  newRx.value = 0
  newBgColor.value = ''
  showAddForm.value = false
}

async function submitSvgAsset() {
  if (!svgName.value.trim()) { useToast().warning('Asset name cannot be empty'); return }
  if (!svgContent.value.trim()) { useToast().warning('SVG content cannot be empty'); return }
  const result = await run(() => store.addSvgAsset(svgName.value.trim(), svgW.value, svgH.value, svgContent.value, svgCategory.value.trim() || undefined))
  if (result) {
    useToast().success('SVG asset imported')
    svgName.value = ''
    svgContent.value = ''
    svgCategory.value = ''
    showSvgForm.value = false
  }
}

async function addNewCategory() {
  const name = window.prompt('Enter new category name:')
  if (!name) return
  const trimmed = name.trim()
  if (!trimmed) {
    useToast().warning('Category name cannot be empty')
    return
  }
  if (trimmed.length > 50) {
    useToast().warning('Category name too long (max 50 characters)')
    return
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    useToast().warning('Category name can only contain letters, numbers, spaces, hyphens, and underscores')
    return
  }
  const added = await store.addAssetCategory(trimmed)
  if (added) {
    useToast().success(`Category "${added}" added`)
  } else {
    useToast().warning('Category already exists')
  }
}

function onAssetMouseDown(assetId: string, e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  store.setMode('object')
  startAssetDrag(assetId)
}

const roomTemplates = computed(() => store.state.layout.roomTemplates ?? [])

function onRoomTemplateMouseDown(templateId: string, e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  startRoomTemplateDrag(templateId)
}

async function onDeleteRoomTemplate(id: string) {
  await store.deleteRoomTemplate(id)
  useToast().info('Room template deleted')
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
      <button v-if="searchQuery" class="asset-palette__search-clear" @click="searchQuery = ''" aria-label="Clear search" title="Clear search">×</button>
    </div>
    <div class="asset-palette__scroll">
      <div v-if="!Object.values(grouped).some(g => g.length)" class="asset-palette__empty">No assets found</div>
      <div v-for="cat in categoryOrder" :key="cat" class="asset-palette__category">
        <div class="asset-palette__category-title">{{ cat }}</div>
        <div v-if="!grouped[cat]?.length" class="asset-palette__category-empty">No items</div>
        <template v-for="asset in grouped[cat]" :key="asset.id">
          <div
            class="asset-palette__item"
            :class="{ 'asset-palette__item--selected': store.state.selectedAssetId === asset.id, 'asset-palette__item--composite': asset.kind === 'composite', 'asset-palette__item--linked': asset.kind === 'linked' }"
            @mousedown="onAssetMouseDown(asset.id, $event)"
            @click="onItemClick(asset.id)"
          >
            <span class="asset-palette__item-icon">{{ assetIcon(asset) }}</span>
            <span class="asset-palette__item-name">{{ asset.name }}</span>
            <span class="asset-palette__item-size">{{ assetSizeLabel(asset) }}</span>
          </div>
        </template>
      </div>

      <div v-if="roomTemplates.length > 0" class="asset-palette__category">
        <div class="asset-palette__category-title">Room Templates</div>
        <div
          v-for="tpl in roomTemplates"
          :key="tpl.id"
          class="asset-palette__item asset-palette__item--room-template"
          @mousedown="onRoomTemplateMouseDown(tpl.id, $event)"
        >
          <span class="asset-palette__item-icon">▢</span>
          <span class="asset-palette__item-name">{{ tpl.name }}</span>
          <span class="asset-palette__item-size">{{ tpl.w }}×{{ tpl.h }}</span>
          <button class="asset-palette__item-delete" @click.stop="onDeleteRoomTemplate(tpl.id)" title="Delete template" aria-label="Delete room template">×</button>
        </div>
      </div>
    </div>

    <button class="asset-palette__add-btn" @click="showAddForm = !showAddForm">
      {{ showAddForm ? 'Cancel' : '+ Add New Asset' }}
    </button>
    <button class="asset-palette__add-btn" @click="addNewCategory">
      + Add New Category
    </button>
    <button class="asset-palette__add-btn" @click="showSvgForm = !showSvgForm">
      {{ showSvgForm ? 'Cancel' : '+ Import SVG Asset' }}
    </button>

    <div v-if="showAddForm" class="asset-palette__form">
      <input class="asset-palette__form-input" v-model="newName" placeholder="Asset name" />
      <select class="asset-palette__form-input" v-model="newCategory">
        <option value="" disabled>Select category...</option>
        <option v-for="cat in existingCategories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <input class="asset-palette__form-input" v-model="newCategoryCustom" placeholder="...or type new category" />
      <div class="asset-palette__form-row">
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" v-model.number="newW" placeholder="W" />
        <span>×</span>
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" v-model.number="newH" placeholder="H" />
      </div>
      <input class="asset-palette__form-input" type="number" min="0" v-model.number="newRx" placeholder="Corner radius (0 = none)" />
      <div class="asset-palette__form-row">
        <input type="color" v-model="newBgColor" class="asset-palette__form-input asset-palette__form-input--color" />
        <input class="asset-palette__form-input" :value="newBgColor || '#ffffff'" @input="newBgColor = ($event.target as HTMLInputElement).value" placeholder="Bg color" />
      </div>
      <button class="asset-palette__form-submit" :disabled="pending" @click="submitNewAsset">Add Asset</button>
    </div>

    <div v-if="showSvgForm" class="asset-palette__form">
      <input class="asset-palette__form-input" v-model="svgName" placeholder="Asset name" />
      <input class="asset-palette__form-input" v-model="svgCategory" placeholder="Category (default: Special)" />
      <div class="asset-palette__form-row">
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" :value="svgW" disabled placeholder="W (auto)" />
        <span>×</span>
        <input class="asset-palette__form-input asset-palette__form-input--num" type="number" min="1" :value="svgH" disabled placeholder="H (auto)" />
      </div>
      <textarea class="asset-palette__form-textarea" v-model="svgContent" placeholder="Paste SVG here (must include viewBox)..." rows="6"></textarea>
      <button class="asset-palette__form-submit" :disabled="pending" @click="submitSvgAsset">Import SVG</button>
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
  display: flex;
  gap: 4px;
}

.asset-palette__search-input {
  flex: 1;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.asset-palette__search-clear {
  background: none;
  border: none;
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 14px;
  padding: 0 6px;
  border-radius: 3px;
  line-height: 1;
}

.asset-palette__search-clear:hover {
  color: var(--accent-red, #ef4444);
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

.asset-palette__form-input--color {
  width: 36px;
  min-width: 36px;
  height: 28px;
  padding: 2px;
  cursor: pointer;
}

.asset-palette__form-textarea {
  width: 100%;
  background: var(--bg-tertiary, #101216);
  border: 1px solid var(--border-dim, #252530);
  color: var(--text-primary, #e8e8ec);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--font-mono, monospace);
  resize: vertical;
  min-height: 80px;
}

.asset-palette__form-textarea:focus {
  outline: none;
  border-color: var(--accent-gold, #f0c040);
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

.asset-palette__item--room-template .asset-palette__item-icon {
  color: #3dd68c;
}

.asset-palette__item-delete {
  background: none;
  border: none;
  color: var(--text-dim, #6a6a74);
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  flex-shrink: 0;
  line-height: 1;
}

.asset-palette__item-delete:hover {
  color: #ef4444;
}
</style>
