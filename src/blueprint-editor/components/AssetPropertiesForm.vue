<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useAsyncAction } from '../composables/useAsyncAction'
import { useWalkableGridPanel } from '../composables/useWalkableGridPanel'
import { useClipboardCopy } from '../composables/useClipboardCopy'
import type { AssetDef } from '../types'
import { isHexColor } from '../store/state'
import TagPicker from './tagPicker.vue'

const props = defineProps<{ asset: AssetDef }>()
const store = useAssetsStore()
const { pending, run } = useAsyncAction()
const { showWalkableGridPanel, openWalkableGridPanel, closeWalkableGridPanel } = useWalkableGridPanel()
const { copyId } = useClipboardCopy()

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
  if (field === 'defaultBgColor' && typeof val === 'string' && val && !isHexColor(val)) {
    useToast().warning('Background color must be a hex code')
    return
  }
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
  <div class="properties__content">
    <!-- General -->
    <div class="properties__section">
      <div class="properties__title properties__titletoggle" @click="toggleSection('general')">
        <span>General</span>
        <span class="properties__collapsearrow">{{ collapsedSections.general ? '▸' : '▾' }}</span>
      </div>
    <div v-show="!collapsedSections.general" class="properties__section__content">
    <div class="properties__row">
      <label>ID</label>
      <div class="properties__idrow">
        <input type="text" :value="asset.id" disabled class="input input__readonly" title="Asset ID" />
        <button class="btn__sm" @click="copyId(asset.id)">Copy</button>
      </div>
    </div>
    <div v-if="isLinkedAsset" class="alert alert__info alert__sm">
      <span class="properties__collapsedicon">⛓</span>
      <span>Linked set — {{ linkedPartCount }} objects. Drag to place all parts linked together.</span>
    </div>
    <div class="properties__row">
      <label>Name</label>
      <input class="input" type="text" v-model="assetFields.name" @change="commitField('name')" />
    </div>
    <div class="properties__row">
      <label>NPC Tags</label>
      <TagPicker :model-value="assetTags" @update:model-value="saveAssetTags" placeholder="rest, service, target" />
    </div>
    <div v-if="isSvgAsset" class="properties__row">
      <label>Rotate Origin</label>
      <button class="btn__sm" @click="onRotateAsset">↻ 90°</button>
    </div>
    </div>
    </div>

    <!-- Dimensions -->
    <div class="properties__section">
      <div class="properties__title properties__titletoggle" @click="toggleSection('dimensions')">
        <span>Dimensions & Style</span>
        <span class="properties__collapsearrow">{{ collapsedSections.dimensions ? '▸' : '▾' }}</span>
      </div>
    <div v-show="!collapsedSections.dimensions" class="properties__section__content">
    <template v-if="!isLinkedAsset">
      <div v-if="!isSvgAsset" class="properties__row">
        <label>Unit Mode</label>
        <div class="properties__unittoggle">
          <button class="btn__sm" :class="{ 'btn__warning': !assetFields.usePx }" @click="assetFields.usePx ? toggleUsePx() : null">Tiles</button>
          <button class="btn__sm" :class="{ 'btn__warning': assetFields.usePx }" @click="!assetFields.usePx ? toggleUsePx() : null">Pixels</button>
        </div>
      </div>
      <template v-if="!assetFields.usePx">
        <div class="properties__row">
          <label>Width (tiles)</label>
          <input class="input" type="number" min="1" v-model.number="assetFields.w" @change="commitField('w')" />
        </div>
        <div class="properties__row">
          <label>Height (tiles)</label>
          <input class="input" type="number" min="1" v-model.number="assetFields.h" @change="commitField('h')" />
        </div>
      </template>
      <template v-else>
        <div class="properties__row">
          <label>Width (px)</label>
          <input type="number" min="1" v-model.number="assetFields.pxW" @change="commitField('pxW')" />
        </div>
        <div class="properties__row">
          <label>Height (px)</label>
          <input type="number" min="1" v-model.number="assetFields.pxH" @change="commitField('pxH')" />
        </div>
      </template>
    </template>
    <div class="properties__row">
      <label>Default Padding</label>
      <input type="number" min="0" v-model.number="assetFields.defaultPadding" @change="commitField('defaultPadding')" />
    </div>
    <div class="properties__row">
      <label>Bg Color</label>
      <div class="properties__colorrow">
        <input
          class="input"
          v-model="assetFields.defaultBgColor"
          placeholder="#RRGGBB"
          aria-label="Asset background color hex value"
          @change="commitField('defaultBgColor')"
        />
        <button class="btn__sm" type="button" @click="clearAssetBgColor">Reset</button>
      </div>
    </div>
    <div class="properties__row properties__row__toggle">
      <label>Entrance Only</label>
      <button
        class="btn__sm"
        :class="{ 'btn__success': entranceRequired, 'btn__danger': !entranceRequired }"
        @click="entranceRequired = !entranceRequired"
        :title="entranceRequired ? 'NPCs can only enter through tiles marked entrance in the walkable grid' : 'NPCs can freely walk across all walkable tiles'"
      >
        {{ entranceRequired ? 'ON' : 'OFF' }}
      </button>
    </div>
    <template v-if="!isLinkedAsset">
      <div class="properties__row">
        <label>Corner Radius</label>
        <div class="properties__rxgrid">
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">↖ TL</span>
            <input type="number" min="0" v-model.number="assetFields.rxTL" @input="onRxInput('rxTL')" class="input input__num input__compact" />
          </div>
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">TR ↗</span>
            <input type="number" min="0" v-model.number="assetFields.rxTR" @input="onRxInput('rxTR')" class="input input__num input__compact" />
          </div>
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">↙ BL</span>
            <input type="number" min="0" v-model.number="assetFields.rxBL" @input="onRxInput('rxBL')" class="input input__num input__compact" />
          </div>
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">BR ↘</span>
            <input type="number" min="0" v-model.number="assetFields.rxBR" @input="onRxInput('rxBR')" class="input input__num input__compact" />
          </div>
        </div>
      </div>
      <div class="properties__row">
        <label></label>
        <label class="properties__rxsync">
          <input type="checkbox" v-model="assetRxSync" /> Sync all corners
        </label>
      </div>
    </template>
    </div>
    </div>

    <div v-if="assetInUse" class="alert alert__info alert__sm">
      <span class="properties__collapsedicon">i</span>
      <span>Asset is placed on floors — changes apply to all instances.</span>
    </div>
    <div v-if="collapsedCount > 0" class="alert alert__danger alert__sm">
      <span class="properties__collapsedicon">✕</span>
      <span>{{ collapsedCount }} object(s) collapsed — overlapping! Shown in red on canvas.</span>
    </div>
    <div v-if="!isLinkedAsset" class="properties__deletesection">
      <button class="btn__warning" @click="showWalkableGridPanel ? closeWalkableGridPanel() : openWalkableGridPanel()">
        {{ showWalkableGridPanel ? 'Close Walkable Grid' : 'Manage Walkable Grid' }}
      </button>
    </div>
    <div class="properties__deletesection">
      <button class="btn__primary" :disabled="pending" @click="onSave">Save Asset</button>
    </div>
    <div class="properties__deletesection properties__deletesection__alone">
      <button class="btn__danger" :disabled="pending" @click="deleteAsset">Delete Asset</button>
    </div>
  </div>
</template>

<style scoped>
.properties__section__content {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.properties__titletoggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: color var(--duration-fast) ease-out;
}

.properties__titletoggle:hover,
.properties__titletoggle:hover .properties__collapsearrow {
  color: var(--accent-gold);
}

</style>
