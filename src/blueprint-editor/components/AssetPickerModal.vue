<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAssetsStore, startAssetDrag } from '../blueprintStore'
import {
  assetSvgVarStyle,
  assetPreviewSvg,
  assetPreviewViewBox,
  assetSettingsIssuesMap,
  assetIncompleteTitle,
  placedObjectCounts as computePlacedObjectCounts,
  assetSizeLabel,
  assetOriginLabel as originLabel,
} from '../assetUtils'
import { renderSvgInto } from '../svgSanitizer'
import { useCanvasWallStyle, DOOR_COLOR } from '../composables/useCanvasWallStyle'
import { useDebouncedRef } from '@/composables/useDebounceFn'
import type { AssetDef } from '../types'
import ModalShell from './ModalShell.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useAssetsStore()
const searchQuery = ref('')
const debouncedSearch = useDebouncedRef(searchQuery, 150)

const { canvasTileSize, wallColor, wallThickness } = useCanvasWallStyle()

const allAssets = computed(() => [...store.assetMap().values()])

const filteredAssets = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase()
  if (!q) return allAssets.value
  return allAssets.value.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
})

const incompleteMap = computed(() => assetSettingsIssuesMap(allAssets.value))

function incompleteTitle(asset: AssetDef): string {
  return assetIncompleteTitle(incompleteMap.value, asset.id)
}

const placedCounts = computed(() => computePlacedObjectCounts(store.state.layout.floors))

function placedObjectCount(assetId: string): number {
  return placedCounts.value.get(assetId) ?? 0
}

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
  <ModalShell
    :open="open"
    title="Asset Picker"
    width="90vw"
    max-width="720px"
    max-height="80vh"
    body-class="form__col"
    @close="emit('close')"
  >
    <div class="form__search">
      <input v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
      <button
        v-if="searchQuery"
        class="flag--ghost"
        aria-label="Clear search"
        title="Clear search"
        @click="searchQuery = ''"
      >
        x
      </button>
    </div>
    <div class="picker__scroll">
      <div v-if="!filteredAssets.length" class="empty empty--pad">No assets found</div>
      <div v-else class="picker__grid">
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
          class="picker__item"
          :class="{ 'picker__item--selected': store.state.selectedAssetId === asset.id }"
          role="button"
          tabindex="0"
          :title="
            incompleteTitle(asset) || `${asset.name} (${assetSizeLabel(asset)}) - click, then click the canvas to place`
          "
          @click="pick(asset)"
          @keydown.enter="pick(asset)"
        >
          <div class="picker__thumb">
            <svg
              :ref="(el) => setThumbEl(asset.id, el)"
              :viewBox="assetViewBox(asset)"
              preserveAspectRatio="xMidYMid meet"
              :style="assetSvgVarStyle(asset)"
            ></svg>
            <span
              v-if="incompleteMap.get(asset.id)?.length"
              class="badge badge--warning flag--warning"
              title="Incomplete settings"
              >!</span
            >
            <span
              class="badge badge--count"
              :class="{ 'badge--placed': placedObjectCount(asset.id) > 0 }"
              :title="`${placedObjectCount(asset.id)} placed object${placedObjectCount(asset.id) === 1 ? '' : 's'}`"
              >{{ placedObjectCount(asset.id) }}</span
            >
          </div>
          <span>{{ asset.name }}</span>
          <span class="picker__meta truncate">{{ assetSizeLabel(asset) }} - {{ originLabel(asset) }}</span>
        </div>
      </div>
    </div>
  </ModalShell>
</template>
