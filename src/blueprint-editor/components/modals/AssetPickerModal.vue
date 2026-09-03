<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { useAssetsStore, startAssetDrag } from '../../blueprintStore'
import {
  assetSvgVarStyle,
  assetPreviewSvg,
  assetPreviewViewBox,
  assetSizeLabel,
  assetOriginLabel as originLabel,
  placedCountTitle,
} from '../../assets/assetUtils'
import { renderSvgInto } from '../../assets/svgSanitizer'
import { useCanvasWallStyle, DOOR_COLOR } from '../../composables/useCanvasWallStyle'
import { useAssetListState } from '../../composables/useAssetListState'
import type { AssetDef } from '../../domain/types'
import ModalShell from '../shell/ModalShell.vue'
import SearchInput from '../inputs/SearchInput.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()

const { searchQuery, incompleteMap, incompleteTitle, placedCounts, placedObjectCount, filteredAssets } =
  useAssetListState()

const { canvasTileSize, wallColor, wallThickness } = useCanvasWallStyle()

function assetViewBox(asset: AssetDef): string {
  return assetPreviewViewBox(asset, canvasTileSize.value)
}

function thumbSvg(asset: AssetDef): string {
  return assetPreviewSvg(asset, canvasTileSize.value, wallColor.value, wallThickness.value, DOOR_COLOR)
}

const thumbEls = new Map<string, SVGSVGElement>()

function setThumbEl(id: string, el: unknown) {
  const svg = el as SVGSVGElement | null
  if (svg) thumbEls.set(id, svg)
  else thumbEls.delete(id)
}

function renderThumbs() {
  if (!props.open) return
  for (const asset of filteredAssets.value) {
    const el = thumbEls.get(asset.id)
    if (el) renderSvgInto(el, thumbSvg(asset))
  }
}

watch([() => props.open, filteredAssets], () => nextTick(renderThumbs))

function pick(asset: AssetDef) {
  store.setMode('object')
  store.selectAsset(asset.id)
  startAssetDrag(asset.id)
  emit('close')
}
</script>

<template>
  <ModalShell :open="open" modal-id="modal-asset-picker" title="Asset Picker" @close="emit('close')">
    <SearchInput v-model="searchQuery" placeholder="Search assets..." label="Search assets" />
    <div class="picker__scroll">
      <div v-if="!filteredAssets.length" class="empty">No assets found</div>
      <ul v-else class="picker__grid">
        <li
          v-for="asset in filteredAssets"
          :key="asset.id"
          v-memo="[
            asset.id,
            asset.name,
            store.state.selectedAssetId,
            incompleteMap.get(asset.id),
            placedCounts.get(asset.id),
          ]"
          class="picker__item"
          :class="{ 'flag--active': store.state.selectedAssetId === asset.id }"
          role="button"
          tabindex="0"
          :aria-pressed="store.state.selectedAssetId === asset.id"
          :title="
            incompleteTitle(asset) || `${asset.name} (${assetSizeLabel(asset)}) - click, then click the canvas to place`
          "
          @click="pick(asset)"
          @keydown.enter="pick(asset)"
          @keydown.space.prevent="pick(asset)"
        >
          <svg
            :ref="(el) => setThumbEl(asset.id, el)"
            class="picker__thumb"
            :viewBox="assetViewBox(asset)"
            preserveAspectRatio="xMidYMid meet"
            :style="assetSvgVarStyle(asset)"
          ></svg>
          <span
            v-if="incompleteMap.get(asset.id)?.length"
            class="badge flag--warning picker__badge"
            title="Incomplete settings"
            >!</span
          >
          <span
            class="badge picker__badge picker__badge--count"
            :title="placedCountTitle(placedObjectCount(asset.id))"
            >{{ placedObjectCount(asset.id) }}</span
          >
          <span>{{ asset.name }}</span>
          <span class="picker__meta truncate">{{ assetSizeLabel(asset) }} - {{ originLabel(asset) }}</span>
        </li>
      </ul>
    </div>
  </ModalShell>
</template>

<style scoped>
#modal-asset-picker {
  width: min(94vw, 720px);
  max-height: calc(100vh - 32px);
}

.picker__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.picker__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-sm);
}

.picker__item {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 150px;
  max-width: 200px;
  min-width: 0;
  gap: var(--gap-xxs);
  padding: var(--gap-xs);
  cursor: pointer;
}

.picker__item:hover {
  background: var(--bg-primary);
}

svg.picker__thumb {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-xs);
  background: var(--bg-primary);
  overflow: hidden;
}

.picker__badge {
  position: absolute;
  top: var(--gap-xs);
  right: var(--gap-xs);
}

.picker__badge--count {
  top: auto;
  bottom: var(--gap-xs);
}

.picker__meta {
  opacity: 0.7;
  text-align: center;
}
</style>
