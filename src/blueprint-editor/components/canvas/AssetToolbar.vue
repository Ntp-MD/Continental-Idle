<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { useAssetsStore, startAssetDrag } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAsyncAction } from '../../composables/useAsyncAction'
import { assetSizeLabel, assetOriginLabel as originLabel, placedCountTitle } from '../../assets/assetUtils'
import { useAssetListState } from '../../composables/useAssetListState'
import SearchInput from '../inputs/SearchInput.vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
const AssetPickerModal = defineAsyncComponent(() => import('../modals/AssetPickerModal.vue'))
const ImportSvgModal = defineAsyncComponent(() => import('../modals/ImportSvgModal.vue'))

const store = useAssetsStore()
const toast = useToast()
const confirm = useConfirm().confirm
const { pending, run } = useAsyncAction()

const showPicker = ref(false)
const showImportSvg = ref(false)

const { searchQuery, incompleteMap, incompleteTitle, placedCounts, placedObjectCount, filteredAssets } =
  useAssetListState()

const incompleteCount = computed(() => incompleteMap.value.size)
const totalAssets = computed(() => store.state.assetRegistry.length)
const totalInstances = computed(() => store.state.layout.floors.reduce((sum, f) => sum + f.objects.length, 0))
const affectedFloors = computed(() => store.state.layout.floors.filter((f) => f.objects.length > 0).length)
const isNpcPreview = computed(() => store.isNpcPreview.value)

async function deleteAllAssets() {
  if (isNpcPreview.value) {
    toast.warning('Cannot delete assets while NPCs are deployed. Exit NPC preview first.')
    return
  }
  if (totalAssets.value === 0) return
  const confirmed = await confirm({
    title: 'Delete all assets',
    message: `Delete all ${totalAssets.value} assets? ${totalInstances.value} placed object(s) on ${affectedFloors.value} floor(s) will be deleted too.`,
    confirmLabel: 'Delete All',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  const count = await run(() => store.deleteAllAssets())
  if (count) toast.success(`Deleted ${count} asset(s)`)
}

function onAssetMouseDown(assetId: string, e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  store.setMode('object')
  startAssetDrag(assetId)
}

function onItemClick(assetId: string) {
  store.selectAsset(assetId)
}
</script>

<template>
  <div class="sidebar__panel">
    <div class="form__header">Origin Asset</div>
    <div class="form__col">
      <SearchInput v-model="searchQuery" placeholder="Search assets..." label="Search assets">
        <button
          title="Browse assets in a grid"
          aria-label="Browse assets"
          @click="showPicker = true"
        >
          Browse
        </button>
        <button
          title="Create an asset from SVG markup"
          aria-label="Import SVG asset"
          @click="showImportSvg = true"
        >
          Import SVG
        </button>
      </SearchInput>
    </div>
    <div class="form__col">
      <div class="form__header">
        <span>Assets List</span>
        <span
          v-if="incompleteCount"
          class="badge flag--warning"
          title="Assets showing the yellow marker have incomplete settings"
          >{{ incompleteCount }} incomplete</span
        >
        <button
          class="flag--danger"
          type="button"
          aria-label="Delete all origin assets"
          title="Delete every asset and its placed objects"
          :disabled="pending || !totalAssets || isNpcPreview"
          @click="deleteAllAssets"
        >
          Delete All
        </button>
      </div>
      <div v-if="!filteredAssets.length" class="empty">No assets found</div>
      <div
        v-for="asset in filteredAssets"
        :key="asset.id"
        v-memo="[
          asset.id,
          asset.name,
          store.state.selectedAssetId,
          incompleteMap.get(asset.id),
          placedCounts.get(asset.id),
        ]"
        class="card__item assets__item"
        role="button"
        tabindex="0"
        :aria-pressed="store.state.selectedAssetId === asset.id"
        :class="{ 'flag--active': store.state.selectedAssetId === asset.id }"
        :title="incompleteTitle(asset) || undefined"
        @mousedown="onAssetMouseDown(asset.id, $event)"
        @click="onItemClick(asset.id)"
        @keydown.enter.prevent="onItemClick(asset.id)"
        @keydown.space.prevent="onItemClick(asset.id)"
      >
        <span class="assets__tiles">{{ assetSizeLabel(asset) }} - {{ originLabel(asset) }}</span>
        <span class="size--stretch">{{ asset.name }}</span>
        <span v-if="incompleteMap.get(asset.id)?.length" class="badge flag--warning" title="Incomplete settings"
          >!</span
        >
        <span
          class="badge"
          :title="placedCountTitle(placedObjectCount(asset.id))"
          >{{ placedObjectCount(asset.id) }}</span
        >
      </div>
    </div>
    <ErrorBoundary>
      <AssetPickerModal :open="showPicker" @close="showPicker = false" />
      <ImportSvgModal :open="showImportSvg" @close="showImportSvg = false" />
    </ErrorBoundary>
  </div>
</template>

<style scoped>
.assets__tiles {
  padding: var(--gap-xs) var(--gap-sm);
  opacity: 0.7;
  white-space: nowrap;
}

.assets__item {
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.assets__item:hover {
  border-color: var(--accent-primary);
}
</style>
