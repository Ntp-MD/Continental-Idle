<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { useAssetsStore, startAssetDrag } from '../blueprintStore'
import { assetSizeLabel, assetOriginLabel as originLabel, placedCountTitle } from '../assetUtils'
import { useAssetListState } from '../composables/useAssetListState'
import SearchInput from './SearchInput.vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
const AssetPickerModal = defineAsyncComponent(() => import('./AssetPickerModal.vue'))

const store = useAssetsStore()

const showPicker = ref(false)

const { searchQuery, incompleteMap, incompleteTitle, placedCounts, placedObjectCount, filteredAssets } =
  useAssetListState()

const incompleteCount = computed(() => incompleteMap.value.size)

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
          class="flag--ghost"
          title="Browse assets in a grid"
          aria-label="Browse assets"
          @click="showPicker = true"
        >
          Browse
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
        :class="{ 'flag--active': store.state.selectedAssetId === asset.id }"
        :title="incompleteTitle(asset) || undefined"
        @mousedown="onAssetMouseDown(asset.id, $event)"
        @click="onItemClick(asset.id)"
        @keydown.enter.prevent="onItemClick(asset.id)"
      >
        <span class="assets__tiles">{{ assetSizeLabel(asset) }} - {{ originLabel(asset) }}</span>
        <span class="assets__name size--stretch">{{ asset.name }}</span>
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
    background var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.assets__item:hover {
  border-color: var(--accent-primary);
}
</style>
