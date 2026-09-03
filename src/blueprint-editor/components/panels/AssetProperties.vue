<script setup lang="ts">
import { ref, watch, computed, nextTick, defineAsyncComponent } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { useClipboardCopy } from '../../composables/useClipboardCopy'
import { assetSvgVarStyle, assetPreviewSvg, assetPreviewViewBox, assetIsSvg } from '../../assets/assetUtils'
import { useCanvasWallStyle, DOOR_COLOR } from '../../composables/useCanvasWallStyle'
import { useSvgPreview } from '../../composables/useSvgPreview'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
import type { AssetDef } from '../../domain/types'
import TagPicker from '../inputs/TagPicker.vue'
const AssetEditModal = defineAsyncComponent(() => import('../modals/AssetEditModal.vue'))
import { managedTagSet } from '../../blueprintStore'

const props = defineProps<{ asset: AssetDef }>()
const store = useAssetsStore()
const confirm = useConfirm().confirm
const { pending, run } = useAsyncAction()
const { copyId } = useClipboardCopy()

const assetFields = ref<{ name: string; defaultLabel: string }>({
  name: '',
  defaultLabel: '',
})
const assetTags = ref<string[]>([])
const showEditor = ref(false)

watch(
  () => props.asset,
  (a) => {
    assetFields.value = {
      name: a.name,
      defaultLabel: a.defaultLabel ?? '',
    }
    assetTags.value = a.tags ? [...a.tags] : []
    showEditor.value = false
  },
  { immediate: true },
)

const isSvgAsset = computed(() => assetIsSvg(props.asset))
const isNpcDeployed = store.isNpcPreview
const orphanAssetTags = computed(() => assetTags.value.filter((tag) => !managedTagSet.value.has(tag)))

const { canvasTileSize, wallColor, wallThickness } = useCanvasWallStyle()

const previewSvgViewBox = computed(() => assetPreviewViewBox(props.asset, canvasTileSize.value))

const previewSvg = computed(() =>
  assetPreviewSvg(props.asset, canvasTileSize.value, wallColor.value, wallThickness.value, DOOR_COLOR),
)
const previewVars = computed(() => assetSvgVarStyle(props.asset))

const previewSvgEl = ref<SVGSVGElement | null>(null)
const { render: renderPreview } = useSvgPreview(previewSvg, previewSvgEl)

watch(
  () => props.asset.id,
  () => nextTick(renderPreview),
)

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
  return store.state.layout.floors.some((f) => f.objects.some((o) => o.type === props.asset.id))
})

async function commitField(field: 'name' | 'defaultLabel') {
  const val = assetFields.value[field]
  await store.updateAsset(props.asset.id, { [field]: val } as Partial<AssetDef>)
}

async function saveAssetTags(tags: string[]) {
  if (isNpcDeployed.value && tags.includes('portal') !== assetTags.value.includes('portal')) {
    useToast().warning('Cannot change Portal tag while NPCs are deployed. Exit NPC preview first.')
    return
  }
  assetTags.value = tags
  await store.updateAsset(props.asset.id, { tags })
}

async function deleteAsset() {
  if (assetInUse.value) {
    useToast().warning('Cannot delete - asset is placed on floors. Remove instances first.')
    return
  }
  const confirmed = await confirm({
    title: 'Remove asset',
    message: 'Remove this asset from the palette?',
    confirmLabel: 'Remove',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const deleted = await run(() => store.deleteAsset(props.asset.id))
  if (!deleted) return
  store.selectAsset(null)
  useToast().success('Asset removed from palette')
}

async function duplicateAsset() {
  const copy = await run(() => store.duplicateAsset(props.asset.id))
  if (copy) store.selectAsset(copy.id)
}
</script>

<template>
  <div class="form__col">
    <div class="form__col">
      <label>Preview</label>
      <div class="preview__svg">
        <svg
          ref="previewSvgEl"
          :viewBox="previewSvgViewBox"
          width="80"
          height="80"
          preserveAspectRatio="xMidYMid meet"
          :style="previewVars"
        ></svg>
      </div>
      <span v-if="!isSvgAsset" class="form__hint">Shape preview - non-SVG asset</span>
    </div>
    <div class="form__row">
      <label>Origin</label>
      <span>{{ asset.origin ?? 'drawn' }}</span>
    </div>
    <div class="form__row">
      <label>ID</label>
      <div class="form__group form__enter">
        <input type="text" :value="asset.id" disabled title="Asset ID" />
        <button @click="copyId(asset.id)">Copy</button>
      </div>
    </div>

    <div class="form__row">
      <label>Name</label>
      <input v-model="assetFields.name" type="text" aria-label="Asset name" @change="commitField('name')" />
    </div>
    <div class="form__row">
      <label>Label</label>
      <input
        v-model="assetFields.defaultLabel"
        type="text"
        aria-label="Asset label"
        placeholder="Use asset name"
        @change="commitField('defaultLabel')"
      />
    </div>
    <div class="form__row">
      <label>Tags</label>
      <TagPicker :model-value="assetTags" placeholder="rest, service, target" @update:model-value="saveAssetTags" />
    </div>
    <div v-if="orphanAssetTags.length" class="card">
      Undefined tags: {{ orphanAssetTags.join(', ') }}. Recreate the tag definition or remove these assignments.
    </div>
    <div class="form__row">
      <label>Edit Asset</label>
      <button class="flag--warning" @click="showEditor = true">Manage</button>
    </div>

    <div v-if="collapsedCount > 0" class="card">
      <span>{{ collapsedCount }} object(s) collapsed - overlapping! Shown in red on canvas.</span>
    </div>
    <div class="form__row">
      <button class="flag--warning" :disabled="pending" @click="duplicateAsset">Duplicate</button>
      <button class="flag--danger" :disabled="pending" @click="deleteAsset">Delete</button>
    </div>
  </div>

  <ErrorBoundary>
    <AssetEditModal :open="showEditor" :asset="asset" @close="showEditor = false" />
  </ErrorBoundary>
</template>

<style scoped>
.preview__svg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  aspect-ratio: 1;
  height: auto;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  padding: var(--gap-sm);
}

.preview__svg svg {
  overflow: hidden;
}
</style>
