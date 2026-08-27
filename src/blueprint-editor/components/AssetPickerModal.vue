<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useAssetsStore, startAssetDrag } from "../blueprintStore";
import { assetSettingsIssues, assetSvgVarStyle } from "../assetUtils";
import { renderSvgInto } from "../svgSanitizer";
import type { AssetDef } from "../types";
import ModalShell from "./ModalShell.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const store = useAssetsStore();
const searchQuery = ref("");

const ORIGIN_LABELS: Record<string, string> = {
  drawn: "Drawn",
  "svg-import": "SVG",
  linked: "Linked",
  flattened: "Flattened",
};

const canvasTileSize = computed(() => Math.max(1, store.state.layout.canvas.tileSize));

const allAssets = computed(() => [...store.assetMap().values()]);

const filteredAssets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allAssets.value;
  return allAssets.value.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
});

const incompleteMap = computed(() => {
  const map = new Map<string, string[]>();
  for (const asset of allAssets.value) {
    const issues = assetSettingsIssues(asset);
    if (issues.length > 0) map.set(asset.id, issues);
  }
  return map;
});

function incompleteTitle(asset: AssetDef): string {
  const issues = incompleteMap.value.get(asset.id);
  return issues?.length ? `Incomplete settings: ${issues.join(", ")}` : "";
}

const placedObjectCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const floor of store.state.layout.floors) {
    for (const object of floor.objects) {
      counts.set(object.type, (counts.get(object.type) ?? 0) + 1);
    }
  }
  return counts;
});

function placedObjectCount(assetId: string): number {
  return placedObjectCounts.value.get(assetId) ?? 0;
}

function assetSizeLabel(asset: AssetDef): string {
  if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}x${asset.pxH ?? asset.h}px`;
  return `${asset.w}x${asset.h}`;
}

function originLabel(asset: AssetDef): string {
  return ORIGIN_LABELS[asset.origin ?? "drawn"] ?? asset.origin ?? "Drawn";
}

function assetViewBox(asset: AssetDef): string {
  const vb = asset.svgViewBox;
  if (!vb || vb.w === 0 || vb.h === 0) {
    const w = asset.usePx ? (asset.pxW ?? asset.w * canvasTileSize.value) : asset.w * canvasTileSize.value;
    const h = asset.usePx ? (asset.pxH ?? asset.h * canvasTileSize.value) : asset.h * canvasTileSize.value;
    return `0 0 ${w} ${h}`;
  }
  return `0 0 ${vb.w} ${vb.h}`;
}

function fallbackShapeSvg(asset: AssetDef): string {
  const w = asset.usePx ? (asset.pxW ?? asset.w * canvasTileSize.value) : asset.w * canvasTileSize.value;
  const h = asset.usePx ? (asset.pxH ?? asset.h * canvasTileSize.value) : asset.h * canvasTileSize.value;
  const rx = Math.max(asset.defaultRx?.tl ?? 0, asset.defaultRx?.tr ?? 0, asset.defaultRx?.br ?? 0, asset.defaultRx?.bl ?? 0);
  const rawFill = asset.defaultFillColor ?? "none";
  const fill = !rawFill || rawFill === "transparent" ? "none" : rawFill;
  const stroke = asset.defaultStrokeColor ?? "#6f7680";
  return `<rect x="1" y="1" width="${Math.max(1, w - 2)}" height="${Math.max(1, h - 2)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
}

function thumbSvg(asset: AssetDef): string {
  return asset.svg?.replace(/var\(--border-dim\)/g, "#fff") ?? fallbackShapeSvg(asset);
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
  <ModalShell :open="open" title="Asset Picker" max-width="720px" width="90vw" max-height="80vh" @close="emit('close')">
    <div class="modal__body picker__body">
      <div class="form__search">
        <input v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
        <button v-if="searchQuery" class="flag--ghost flag--icon" @click="searchQuery = ''" aria-label="Clear search" title="Clear search">x</button>
      </div>
      <div class="picker__scroll">
        <div v-if="!filteredAssets.length" class="empty picker__empty">No assets found</div>
        <div v-else class="picker__grid">
          <div v-for="asset in filteredAssets" :key="asset.id" class="picker__item" :class="{ 'picker__item--selected': store.state.selectedAssetId === asset.id }" role="button" tabindex="0" :title="incompleteTitle(asset) || `${asset.name} (${assetSizeLabel(asset)}) - click, then click the canvas to place`" @click="pick(asset)" @keydown.enter="pick(asset)">
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
