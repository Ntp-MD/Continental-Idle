<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useAssetsStore, startAssetDrag } from "../blueprintStore";
import { assetSvgVarStyle, assetPreviewSvg, assetPreviewViewBox, assetSettingsIssuesMap, assetIncompleteTitle, placedObjectCounts as computePlacedObjectCounts, assetSizeLabel, assetOriginLabel as originLabel } from "../assetUtils";
import { renderSvgInto } from "../svgSanitizer";
import { useCanvasWallStyle, DOOR_COLOR } from "../composables/useCanvasWallStyle";
import { useDebouncedRef } from "@/composables/useDebounceFn";
import type { AssetDef } from "../types";
import ModalShell from "./ModalShell.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const searchQuery = ref("");
const debouncedSearch = useDebouncedRef(searchQuery, 150);

const { canvasTileSize, wallColor, wallThickness } = useCanvasWallStyle();

const allAssets = computed(() => [...store.assetMap().values()]);

const filteredAssets = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase();
  if (!q) return allAssets.value;
  return allAssets.value.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
});

const incompleteMap = computed(() => assetSettingsIssuesMap(allAssets.value));

function incompleteTitle(asset: AssetDef): string {
  return assetIncompleteTitle(incompleteMap.value, asset.id);
}

const placedCounts = computed(() => computePlacedObjectCounts(store.state.layout.floors));

function placedObjectCount(assetId: string): number {
  return placedCounts.value.get(assetId) ?? 0;
}

function assetViewBox(asset: AssetDef): string {
  return assetPreviewViewBox(asset, canvasTileSize.value);
}

function thumbSvg(asset: AssetDef): string {
  return assetPreviewSvg(asset, canvasTileSize.value, wallColor.value, wallThickness.value, DOOR_COLOR);
}

const thumbEls = new Map<string, SVGSVGElement>();

function setThumbEl(id: string, el: unknown) {
  const svg = el as SVGSVGElement | null;
  if (svg) thumbEls.set(id, svg);
  else thumbEls.delete(id);
}

function renderThumbs() {
  if (!props.open) return;
  for (const asset of filteredAssets.value) {
    const el = thumbEls.get(asset.id);
    if (el) renderSvgInto(el, thumbSvg(asset));
  }
}

watch([() => props.open, filteredAssets], () => nextTick(renderThumbs));

function pick(asset: AssetDef) {
  store.setMode("object");
  store.selectAsset(asset.id);
  startAssetDrag(asset.id);
  emit("close");
}
</script>

<template>
  <ModalShell :open="open" title="Asset Picker" dialog-class="picker__dialog" @close="emit('close')">
    <div class="modal__body picker__body">
      <div class="form__search">
        <input v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
        <button v-if="searchQuery" class="flag--ghost" aria-label="Clear search" title="Clear search" @click="searchQuery = ''">x</button>
      </div>
      <div class="picker__scroll">
        <div v-if="!filteredAssets.length" class="empty picker__empty">No assets found</div>
        <div v-else class="picker__grid">
          <div v-for="asset in filteredAssets" :key="asset.id" v-memo="[asset.id, asset.name, store.state.selectedAssetId, incompleteMap.get(asset.id), placedCounts.get(asset.id)]" class="picker__item" :class="{ 'picker__item--selected': store.state.selectedAssetId === asset.id }" role="button" tabindex="0" :title="incompleteTitle(asset) || `${asset.name} (${assetSizeLabel(asset)}) - click, then click the canvas to place`" @click="pick(asset)" @keydown.enter="pick(asset)">
            <div class="picker__thumb">
              <svg :ref="(el) => setThumbEl(asset.id, el)" :viewBox="assetViewBox(asset)" preserveAspectRatio="xMidYMid meet" :style="assetSvgVarStyle(asset)"></svg>
              <span v-if="incompleteMap.get(asset.id)?.length" class="badge badge--warning flag--warning" title="Incomplete settings">!</span>
              <span class="badge badge--count" :class="{ 'badge--placed': placedObjectCount(asset.id) > 0 }" :title="`${placedObjectCount(asset.id)} placed object${placedObjectCount(asset.id) === 1 ? '' : 's'}`">{{ placedObjectCount(asset.id) }}</span>
            </div>
            <span class="asset__name">{{ asset.name }}</span>
            <span class="picker__meta">{{ assetSizeLabel(asset) }} - {{ originLabel(asset) }}</span>
          </div>
        </div>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped>
:deep(.picker__dialog) {
  width: 90vw;
  max-width: 720px;
  max-height: 80vh;
}
.picker__body {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.picker__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.picker__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap-sm);
}

.picker__item {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xxs);
  padding: var(--gap-xs);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  cursor: pointer;
  transition:
    background var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.picker__item:hover {
  border-color: var(--accent-primary);
}

.picker__item--selected {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
}

.picker__item--linked {
  border-color: var(--accent-blue);
}

.picker__thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-xs);
  background: var(--bg-primary);
  overflow: hidden;
}

.picker__thumb svg {
  display: block;
  width: 100%;
  height: 100%;
}

.picker__thumb .badge--warning {
  position: absolute;
  top: 2px;
  right: 2px;
}

.picker__thumb .badge--count {
  position: absolute;
  top: 2px;
  left: 2px;
  background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
}

.picker__item .asset__name {
  text-align: center;
}

.picker__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-xs);
  opacity: 0.7;
  text-align: center;
}

.picker__empty {
  padding: var(--gap-md);
  opacity: 0.7;
}
</style>
