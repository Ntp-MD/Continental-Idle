<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '../composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import { useWalkableGridPanel } from '../composables/useWalkableGridPanel'
import type { AssetDef } from '../types'
import TagPicker from './tagPicker.vue'

const props = defineProps<{ asset: AssetDef }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()
const { showWalkableGridPanel, openWalkableGridPanel, closeWalkableGridPanel } = useWalkableGridPanel()

const assetFields = ref({ name: '', w: 1, h: 1, pxW: 0, pxH: 0, usePx: false, defaultPadding: 0, rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0, defaultBgColor: '' })
const assetRxSync = ref(true)
const assetTags = ref<string[]>([])
const collapsedSections = ref<Record<string, boolean>>({ general: false, dimensions: false })
const entranceRequired = ref(props.asset.entranceRequired ?? false)
function toggleSection(key: string) {
  collapsedSections.value[key] = !collapsedSections.value[key]
}

watch(() => props.asset, (a) => {
  assetFields.value = { name: a.name, w: a.w, h: a.h, pxW: a.pxW ?? 0, pxH: a.pxH ?? 0, usePx: a.usePx ?? false, defaultPadding: a.defaultPadding ?? 0, rxTL: a.defaultRx?.tl ?? 0, rxTR: a.defaultRx?.tr ?? 0, rxBR: a.defaultRx?.br ?? 0, rxBL: a.defaultRx?.bl ?? 0, defaultBgColor: a.defaultBgColor ?? '' }
  assetTags.value = a.tags ? [...a.tags] : []
  entranceRequired.value = a.entranceRequired ?? false
  closeWalkableGridPanel()
}, { immediate: true })

const isLinkedAsset = computed(() => !!props.asset.linkedParts)
const linkedPartCount = computed(() => props.asset.linkedParts?.length ?? 0)
const isSvgAsset = computed(() => !!props.asset.svg)

watch(entranceRequired, async (v) => {
  try {
    await store.updateAsset(props.asset.id, { entranceRequired: v })
  } catch {
    entranceRequired.value = !v
  }
})

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

async function commitField(field: 'name' | 'w' | 'h' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultBgColor') {
  const val = assetFields.value[field]
  await store.updateAsset(props.asset.id, { [field]: val } as Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultBgColor'>>)
}

async function toggleUsePx() {
  assetFields.value.usePx = !assetFields.value.usePx
  await store.updateAsset(props.asset.id, { usePx: assetFields.value.usePx })
}

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = assetFields.value
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateAsset(props.asset.id, { defaultRx: undefined })
  } else {
    await store.updateAsset(props.asset.id, { defaultRx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } })
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
  await store.updateAsset(props.asset.id, { defaultBgColor: undefined })
}

async function saveAssetTags(tags: string[]) {
  assetTags.value = tags
  await store.updateAsset(props.asset.id, { tags })
}

async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    useToast().success('ID copied')
  } catch {
    useToast().warning('Copy failed')
  }
}

async function onRotateAsset() {
  if (!isSvgAsset.value || !props.asset.svgViewBox) return
  await store.rotateAsset(props.asset.id)
  useToast().info('Asset rotated 90°')
}

async function onSave() {
  await run(async () => {
    await store.saveAssets()
    await store.saveLayout()
  })
  useToast().success('Asset saved')
}

async function deleteAsset() {
  if (assetInUse.value) {
    useToast().warning('Cannot delete — asset is placed on floors. Remove instances first.')
    return
  }
  if (!window.confirm('Remove this asset from the palette?')) return
  const deleted = await run(() => store.deleteAsset(props.asset.id))
  if (!deleted) return
  store.selectAsset(null)
  useToast().success('Asset removed from palette')
}

</script>

<template>
  <div class="properties_panel__content">
    <!-- General -->
    <div class="properties_panel__section">
      <div class="properties_panel__section_title properties_panel__section_title__toggle" @click="toggleSection('general')">
        <span>General</span>
        <span class="properties_panel__collapse_arrow">{{ collapsedSections.general ? '▸' : '▾' }}</span>
      </div>
    <div v-show="!collapsedSections.general" class="properties_panel__section__content">
    <div class="properties_panel__row">
      <label>ID</label>
      <div class="properties_panel__id_row">
        <input type="text" :value="asset.id" disabled class="input input__readonly" title="Asset ID" />
        <button class="btn btn_sm" @click="copyId(asset.id)">Copy</button>
      </div>
    </div>
    <div v-if="isLinkedAsset" class="alert alert_info alert_sm">
      <span class="properties_panel__collapsed_icon">⛓</span>
      <span>Linked set — {{ linkedPartCount }} objects. Drag to place all parts linked together.</span>
    </div>
    <div class="properties_panel__row">
      <label>Name</label>
      <input class="input" type="text" v-model="assetFields.name" @change="commitField('name')" />
    </div>
    <div class="properties_panel__row">
      <label>NPC Tags</label>
      <TagPicker :model-value="assetTags" @update:model-value="saveAssetTags" placeholder="rest, service, target" />
    </div>
    <div v-if="isSvgAsset" class="properties_panel__row">
      <label>Rotate Origin</label>
      <button class="btn btn_sm" @click="onRotateAsset">↻ 90°</button>
    </div>
    </div>
    </div>

    <!-- Dimensions -->
    <div class="properties_panel__section">
      <div class="properties_panel__section_title properties_panel__section_title__toggle" @click="toggleSection('dimensions')">
        <span>Dimensions & Style</span>
        <span class="properties_panel__collapse_arrow">{{ collapsedSections.dimensions ? '▸' : '▾' }}</span>
      </div>
    <div v-show="!collapsedSections.dimensions" class="properties_panel__section__content">
    <template v-if="!isLinkedAsset">
      <div v-if="!isSvgAsset" class="properties_panel__row">
        <label>Unit Mode</label>
        <div class="properties_panel__unit_toggle">
          <button class="btn btn_sm" :class="{ 'btn__warning': !assetFields.usePx }" @click="assetFields.usePx ? toggleUsePx() : null">Tiles</button>
          <button class="btn btn_sm" :class="{ 'btn__warning': assetFields.usePx }" @click="!assetFields.usePx ? toggleUsePx() : null">Pixels</button>
        </div>
      </div>
      <template v-if="!assetFields.usePx">
        <div class="properties_panel__row">
          <label>Width (tiles)</label>
          <input class="input" type="number" min="1" v-model.number="assetFields.w" @change="commitField('w')" />
        </div>
        <div class="properties_panel__row">
          <label>Height (tiles)</label>
          <input class="input" type="number" min="1" v-model.number="assetFields.h" @change="commitField('h')" />
        </div>
      </template>
      <template v-else>
        <div class="properties_panel__row">
          <label>Width (px)</label>
          <input type="number" min="1" v-model.number="assetFields.pxW" @change="commitField('pxW')" />
        </div>
        <div class="properties_panel__row">
          <label>Height (px)</label>
          <input type="number" min="1" v-model.number="assetFields.pxH" @change="commitField('pxH')" />
        </div>
      </template>
    </template>
    <div class="properties_panel__row">
      <label>Default Padding</label>
      <input type="number" min="0" v-model.number="assetFields.defaultPadding" @change="commitField('defaultPadding')" />
    </div>
    <div class="properties_panel__row">
      <label>Bg Color</label>
      <div class="properties_panel__color_row">
        <input type="color" :value="assetFields.defaultBgColor || 'var(--text-bright)'" @input="assetFields.defaultBgColor = ($event.target as HTMLInputElement).value; commitField('defaultBgColor')" class="input input__color" />
        <button class="btn btn_sm" @click="clearAssetBgColor">Reset</button>
      </div>
    </div>
    <div v-if="isSvgAsset" class="properties_panel__row properties_panel__row__toggle">
      <label>Entrance Only</label>
      <button
        class="btn btn_sm"
        :class="{ 'btn__success': entranceRequired, 'btn__danger': !entranceRequired }"
        @click="entranceRequired = !entranceRequired"
        :title="entranceRequired ? 'NPCs can only enter through tiles marked entrance in the walkable grid' : 'NPCs can freely walk across all walkable tiles'"
      >
        {{ entranceRequired ? 'ON' : 'OFF' }}
      </button>
    </div>
    <template v-if="!isLinkedAsset && !isSvgAsset">
      <div class="properties_panel__row">
        <label>Corner Radius</label>
        <div class="properties_panel__rx_grid">
          <div class="properties_panel__rx_corner">
            <span class="properties_panel__rx_label">↖ TL</span>
            <input type="number" min="0" v-model.number="assetFields.rxTL" @input="onRxInput('rxTL')" class="input input_num input_compact" />
          </div>
          <div class="properties_panel__rx_corner">
            <span class="properties_panel__rx_label">TR ↗</span>
            <input type="number" min="0" v-model.number="assetFields.rxTR" @input="onRxInput('rxTR')" class="input input_num input_compact" />
          </div>
          <div class="properties_panel__rx_corner">
            <span class="properties_panel__rx_label">↙ BL</span>
            <input type="number" min="0" v-model.number="assetFields.rxBL" @input="onRxInput('rxBL')" class="input input_num input_compact" />
          </div>
          <div class="properties_panel__rx_corner">
            <span class="properties_panel__rx_label">BR ↘</span>
            <input type="number" min="0" v-model.number="assetFields.rxBR" @input="onRxInput('rxBR')" class="input input_num input_compact" />
          </div>
        </div>
      </div>
      <div class="properties_panel__row">
        <label></label>
        <label class="properties_panel__rx_sync">
          <input type="checkbox" v-model="assetRxSync" /> Sync all corners
        </label>
      </div>
    </template>
    </div>
    </div>

    <div v-if="assetInUse" class="alert alert_info alert_sm">
      <span class="properties_panel__collapsed_icon">i</span>
      <span>Asset is placed on floors — changes apply to all instances.</span>
    </div>
    <div v-if="collapsedCount > 0" class="alert alert_danger alert_sm">
      <span class="properties_panel__collapsed_icon">✕</span>
      <span>{{ collapsedCount }} object(s) collapsed — overlapping! Shown in red on canvas.</span>
    </div>
    <div v-if="isSvgAsset" class="properties_panel__delete_section">
      <button class="btn btn__warning" @click="showWalkableGridPanel ? closeWalkableGridPanel() : openWalkableGridPanel()">
        {{ showWalkableGridPanel ? 'Close Walkable Grid' : 'Manage Walkable Grid' }}
      </button>
    </div>
    <div class="properties_panel__delete_section">
      <button class="btn btn__primary" :disabled="pending" @click="onSave">Save Asset</button>
    </div>
    <div class="properties_panel__delete_section properties_panel__delete_section__alone">
      <button class="btn btn__danger" :disabled="pending" @click="deleteAsset">Delete Asset</button>
    </div>
  </div>
</template>

<style scoped>
.properties_panel__section__content {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.properties_panel__section_title__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: color var(--duration-fast) ease-out;
}

.properties_panel__section_title__toggle:hover {
  color: var(--accent-gold);
}

.properties_panel__section_title__toggle:hover .properties_panel__collapse_arrow {
  color: var(--accent-gold);
}

</style>
