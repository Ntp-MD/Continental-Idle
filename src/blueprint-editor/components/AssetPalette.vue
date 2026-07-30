<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAssetsStore, startAssetDrag, startRoomTemplateDrag } from '../blueprintStore'
import { useToast } from '../composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import type { AssetDef } from '../types'

const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const searchQuery = ref('')

const ORIGIN_LABELS: Record<string, string> = {
  'drawn': 'Drawn',
  'svg-import': 'SVG Import',
  'linked': 'Linked Sets',
  'flattened': 'Flattened',
}

const ORIGIN_ORDER = ['drawn', 'svg-import', 'linked', 'flattened']

function assetIcon(asset: AssetDef): string {
  switch (asset.origin) {
    case 'svg-import': return '★'
    case 'linked': return '⛓'
    case 'flattened': return '◆'
    default: return asset.svg ? '★' : asset.linkedParts ? '⛓' : '▭'
  }
}

function assetSizeLabel(asset: AssetDef): string {
  if (asset.linkedParts) return `${asset.linkedParts.length} linked`
  if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}×${asset.pxH ?? asset.h}px`
  return `${asset.w}×${asset.h}`
}

const allAssets = computed(() => [...store.assetMap().values()])

const grouped = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const groups: Record<string, typeof allAssets.value> = {}
  for (const asset of allAssets.value) {
    const origin = asset.origin ?? 'drawn'
    if (q && !asset.name.toLowerCase().includes(q) && !asset.id.toLowerCase().includes(q)) continue
    if (!groups[origin]) groups[origin] = []
    groups[origin].push(asset)
  }
  return groups
})

const categoryOrder = computed(() => {
  return ORIGIN_ORDER.filter(origin => (grouped.value[origin]?.length ?? 0) > 0)
})

const showAddForm = ref(false)
const newName = ref('')
const newW = ref(1)
const newH = ref(1)
const newRx = ref(0)
const newBgColor = ref('')

const showSvgForm = ref(false)
const svgName = ref('')
const svgW = ref(1)
const svgH = ref(1)
const svgContent = ref('')

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


async function submitNewAsset() {
  if (!newName.value.trim()) {
    useToast().warning('Asset name cannot be empty')
    return
  }
  const rx = newRx.value > 0 ? { tl: newRx.value, tr: newRx.value, br: newRx.value, bl: newRx.value } : undefined
  await run(() => store.addAsset(newName.value.trim(), newW.value, newH.value, undefined, undefined, rx, newBgColor.value || undefined))
  useToast().success('Asset added')
  newName.value = ''
  newW.value = 1
  newH.value = 1
  newRx.value = 0
  newBgColor.value = ''
  showAddForm.value = false
}

async function submitSvgAsset() {
  if (!svgName.value.trim()) { useToast().warning('Asset name cannot be empty'); return }
  if (!svgContent.value.trim()) { useToast().warning('SVG content cannot be empty'); return }
  const result = await run(() => store.addSvgAsset(svgName.value.trim(), svgW.value, svgH.value, svgContent.value))
  if (result) {
    useToast().success('SVG asset imported')
    svgName.value = ''
    svgContent.value = ''
    showSvgForm.value = false
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
  <div class="asset__palette">
    <div class="asset__palette__header">Asset Palette</div>
    <div class="asset__palette__search">
      <input class="input" v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
      <button v-if="searchQuery" class="btn btn__ghost btn__icon" @click="searchQuery = ''" aria-label="Clear search" title="Clear search">×</button>
    </div>
    <div class="asset__palette__scroll">
      <div v-if="!Object.values(grouped).some(g => g.length)" class="asset__palette__empty">No assets found</div>
      <div v-for="cat in categoryOrder" :key="cat" class="asset__palette__category">
        <div class="asset__palette__category__title">{{ ORIGIN_LABELS[cat] ?? cat }}</div>
        <div v-if="!grouped[cat]?.length" class="asset__palette__category__empty">No items</div>
        <template v-for="asset in grouped[cat]" :key="asset.id">
          <div
            class="asset__palette__item"
            :class="{ 'asset__palette__item__selected': store.state.selectedAssetId === asset.id, 'asset__palette__item__linked': !!asset.linkedParts }"
            @mousedown="onAssetMouseDown(asset.id, $event)"
            @click="onItemClick(asset.id)"
          >
            <span class="asset__palette__item__icon">{{ assetIcon(asset) }}</span>
            <span class="asset__palette__item__name">{{ asset.name }}</span>
            <span class="asset__palette__item__size">{{ assetSizeLabel(asset) }}</span>
          </div>
        </template>
      </div>

      <div v-if="roomTemplates.length > 0" class="asset__palette__category">
        <div class="asset__palette__category__title">Room Templates</div>
        <div class="asset__palette__hint">Select a room, then click "Save as Template" in properties to create one. Drag onto canvas to place.</div>
        <div
          v-for="tpl in roomTemplates"
          :key="tpl.id"
          class="asset__palette__item asset__palette__item__room__template"
          @mousedown="onRoomTemplateMouseDown(tpl.id, $event)"
        >
          <span class="asset__palette__item__icon">▢</span>
          <span class="asset__palette__item__name">{{ tpl.name }}</span>
          <span class="asset__palette__item__size">{{ tpl.w }}×{{ tpl.h }}</span>
          <button class="btn btn__ghost btn__icon btn__text__danger" @click.stop="onDeleteRoomTemplate(tpl.id)" title="Delete template" aria-label="Delete room template">×</button>
        </div>
      </div>
      <div v-else class="asset__palette__category">
        <div class="asset__palette__category__title">Room Templates</div>
        <div class="asset__palette__hint">Select a room in the canvas, then click "Save as Template" in properties to create a reusable room template.</div>
      </div>
    </div>

    <div class="asset__palette__footer">
      <button class="btn btn__dashed btn__block" @click="showAddForm = !showAddForm">
        {{ showAddForm ? 'Cancel' : '+ Add New Asset' }}
      </button>
      <button class="btn btn__dashed btn__block" @click="showSvgForm = !showSvgForm">
        {{ showSvgForm ? 'Cancel' : '+ Import SVG Asset' }}
      </button>

      <div v-if="showAddForm" class="asset__palette__form">
        <input class="input" v-model="newName" placeholder="Asset name" />
        <div class="asset__palette__form__row">
          <input class="input input__num" type="number" min="1" v-model.number="newW" placeholder="W" />
          <span>×</span>
          <input class="input input__num" type="number" min="1" v-model.number="newH" placeholder="H" />
        </div>
        <input class="input" type="number" min="0" v-model.number="newRx" placeholder="Corner radius (0 = none)" />
        <div class="asset__palette__form__row">
          <input type="color" v-model="newBgColor" class="input input__color" />
          <input class="input" :value="newBgColor || 'var(--text-bright)'" @input="newBgColor = ($event.target as HTMLInputElement).value" placeholder="Bg color" />
        </div>
        <button class="btn btn__primary btn__block" :disabled="pending" @click="submitNewAsset">Add Asset</button>
      </div>

      <div v-if="showSvgForm" class="asset__palette__form">
        <input class="input" v-model="svgName" placeholder="Asset name" />
        <div class="asset__palette__form__row">
          <input class="input input__num" type="number" min="1" :value="svgW" disabled placeholder="W (auto)" />
          <span>×</span>
          <input class="input input__num" type="number" min="1" :value="svgH" disabled placeholder="H (auto)" />
        </div>
        <textarea class="textarea" v-model="svgContent" placeholder="Paste SVG here (must include viewBox)..." rows="6"></textarea>
        <button class="btn btn__primary btn__block" :disabled="pending" @click="submitSvgAsset">Import SVG</button>
      </div>
    </div>
  </div>
</template>


<style scoped>

.asset__palette {
  display: flex;
  flex-direction: column;
	width: 100%;
  max-width: 250px;
  min-width: 0;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-dim);
  color: var(--text-primary);
  overflow: hidden;
}

.asset__palette__header {
  display: flex;
  align-items: center;
  padding: var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  font-weight: 700;
  font-size: var(--font-md);
  flex-shrink: 0;
}

.asset__palette__footer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-md);
  background: var(--bg-card);
  border-top: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.asset__palette__search {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-sm);
  border-bottom: 1px solid var(--border-dim);
}

.asset__palette__form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.asset__palette__form__row {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.asset__palette__scroll {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-xs);
}

.asset__palette__empty {
  padding: var(--gap-md);
  text-align: center;
  font-size: var(--font-sm);
  opacity: 0.7;
}

.asset__palette__category {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.asset__palette__category__title {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  opacity: 0.7;
}

.asset__palette__category__empty {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  opacity: 0.5;
}

.asset__palette__hint {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  color: var(--text-dim);
  line-height: 1.5;
  border-left: 2px solid var(--border-dim);
  margin: var(--gap-xs) var(--gap-sm);
}

.asset__palette__item {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  transition: background var(--duration-fast) ease-out, border-color var(--duration-fast) ease-out;
}

.asset__palette__item:hover {
  background: var(--bg-card);
  border-color: var(--accent-gold);
}

.asset__palette__item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  font-size: var(--font-lg);
}

.asset__palette__item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-sm);
}

.asset__palette__item__size {
  font-size: var(--font-xs);
  opacity: 0.7;
  white-space: nowrap;
}

.asset__palette__item__room__template {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--accent-gold) 50%, transparent);
}</style>