<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../assets-store'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import type { AssetDef, SimpleAsset } from '../types'

const props = defineProps<{ asset: AssetDef }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()

const assetFields = ref({ name: '', w: 1, h: 1, category: '', pxW: 0, pxH: 0, usePx: false, defaultPadding: 0, rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0, defaultBgColor: '' })
const assetRxSync = ref(true)
const showCatManager = ref(false)
const newAssetCat = ref('')

watch(() => props.asset, (a) => {
  const sa = a.kind === 'simple' ? a : undefined
  assetFields.value = { name: a.name, w: a.w, h: a.h, category: a.category, pxW: sa?.pxW ?? 0, pxH: sa?.pxH ?? 0, usePx: sa?.usePx ?? false, defaultPadding: a.defaultPadding ?? 0, rxTL: a.defaultRx?.tl ?? 0, rxTR: a.defaultRx?.tr ?? 0, rxBR: a.defaultRx?.br ?? 0, rxBL: a.defaultRx?.bl ?? 0, defaultBgColor: a.defaultBgColor ?? '' }
}, { immediate: true })

const isCompositeAsset = computed(() => props.asset.kind === 'composite')
const partCount = computed(() => props.asset.kind === 'composite' ? props.asset.parts.length : 0)
const isLinkedAsset = computed(() => props.asset.kind === 'linked')
const linkedPartCount = computed(() => props.asset.kind === 'linked' ? props.asset.linkedParts.length : 0)
const isSvgAsset = computed(() => props.asset.kind === 'svg')

const collapsedCount = computed(() => {
  let count = 0
  for (const floor of store.state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.type === props.asset.id && obj.collapsed) count++
    }
  }
  return count
})

const assetInUse = computed(() => {
  return store.state.layout.floors.some(f => f.objects.some(o => o.type === props.asset.id))
})

const assetCategories = computed(() => store.state.layout.assetCategories ?? [])

async function commitField(field: 'name' | 'w' | 'h' | 'category' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultBgColor') {
  const val = assetFields.value[field]
  await store.updateCustomAsset(props.asset.id, { [field]: val } as Partial<Pick<SimpleAsset, 'name' | 'w' | 'h' | 'category' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultBgColor'>>)
}

async function toggleUsePx() {
  assetFields.value.usePx = !assetFields.value.usePx
  await store.updateCustomAsset(props.asset.id, { usePx: assetFields.value.usePx })
}

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = assetFields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateCustomAsset(props.asset.id, { defaultRx: undefined })
  } else {
    await store.updateCustomAsset(props.asset.id, { defaultRx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
  }
}

async function onRxInput(corner: 'rxTL' | 'rxTR' | 'rxBR' | 'rxBL') {
  if (assetRxSync.value) {
    const val = assetFields.value[corner]
    assetFields.value.rxTL = val
    assetFields.value.rxTR = val
    assetFields.value.rxBR = val
    assetFields.value.rxBL = val
  }
  await commitRx()
}

async function clearAssetBgColor() {
  assetFields.value.defaultBgColor = ''
  await store.updateCustomAsset(props.asset.id, { defaultBgColor: undefined })
}

async function onSave() {
  await run(() => store.saveLayout())
  useToast().success('Asset saved')
}

async function deleteAsset() {
  if (assetInUse.value) {
    useToast().warning('Cannot delete — asset is placed on floors. Remove instances first.')
    return
  }
  if (!window.confirm('Remove this asset from the palette?')) return
  await run(() => store.deleteCustomAsset(props.asset.id))
  store.selectAsset(null)
  useToast().success('Asset removed from palette')
}

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
</script>

<template>
  <div class="properties-panel__content">
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
      <input type="text" v-model="assetFields.name" @change="commitField('name')" />
    </div>
    <template v-if="!isSvgAsset">
      <div class="properties-panel__row">
        <label>Category</label>
        <select v-model="assetFields.category" @change="commitField('category')">
          <option v-for="cat in assetCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <button class="properties-panel__btn" @click="showCatManager = !showCatManager">{{ showCatManager ? 'Close' : 'Manage Asset Categories' }}</button>
      <div v-if="showCatManager" class="properties-panel__cat-manager">
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
            <input type="number" min="1" v-model.number="assetFields.w" @change="commitField('w')" />
          </div>
          <div class="properties-panel__row">
            <label>Height (tiles)</label>
            <input type="number" min="1" v-model.number="assetFields.h" @change="commitField('h')" />
          </div>
        </template>
        <template v-else>
          <div class="properties-panel__row">
            <label>Width (px)</label>
            <input type="number" min="1" v-model.number="assetFields.pxW" @change="commitField('pxW')" />
          </div>
          <div class="properties-panel__row">
            <label>Height (px)</label>
            <input type="number" min="1" v-model.number="assetFields.pxH" @change="commitField('pxH')" />
          </div>
        </template>
      </template>
      <div class="properties-panel__row">
        <label>Default Padding</label>
        <input type="number" min="0" v-model.number="assetFields.defaultPadding" @change="commitField('defaultPadding')" />
      </div>
      <div class="properties-panel__row">
        <label>Bg Color</label>
        <div class="properties-panel__color-row">
          <input type="color" :value="assetFields.defaultBgColor || '#ffffff'" @input="assetFields.defaultBgColor = ($event.target as HTMLInputElement).value; commitField('defaultBgColor')" class="properties-panel__cat-color" />
          <button class="properties-panel__btn properties-panel__btn--sm" @click="clearAssetBgColor">Reset</button>
        </div>
      </div>
      <template v-if="!isCompositeAsset && !isLinkedAsset">
        <div class="properties-panel__row">
          <label>Corner Radius</label>
          <div class="properties-panel__rx-grid">
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">↖ TL</span>
              <input type="number" min="0" v-model.number="assetFields.rxTL" @input="onRxInput('rxTL')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">TR ↗</span>
              <input type="number" min="0" v-model.number="assetFields.rxTR" @input="onRxInput('rxTR')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">↙ BL</span>
              <input type="number" min="0" v-model.number="assetFields.rxBL" @input="onRxInput('rxBL')" class="properties-panel__rx-input" />
            </div>
            <div class="properties-panel__rx-corner">
              <span class="properties-panel__rx-label">BR ↘</span>
              <input type="number" min="0" v-model.number="assetFields.rxBR" @input="onRxInput('rxBR')" class="properties-panel__rx-input" />
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
      <button class="properties-panel__btn properties-panel__btn--save" :disabled="pending" @click="onSave">Save Asset</button>
      <button class="properties-panel__btn properties-panel__btn--danger" :disabled="pending" @click="deleteAsset">Delete Asset</button>
    </div>
  </div>
</template>
