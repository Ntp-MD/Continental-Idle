<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAssetsStore, startAssetDrag } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useAsyncAction } from "../composables/useAsyncAction";
import type { AssetDef } from "../types";

const store = useAssetsStore();
const { pending, run } = useAsyncAction();

const searchQuery = ref("");

const ORIGIN_LABELS: Record<string, string> = {
  drawn: "Drawn",
  "svg-import": "SVG",
  linked: "Linked",
  flattened: "Flattened",
};

function assetIcon(asset: AssetDef): string {
  switch (asset.origin) {
    case "svg-import":
      return "★";
    case "linked":
      return "⛓";
    case "flattened":
      return "◆";
    default:
      return asset.svg ? "★" : asset.linkedParts ? "⛓" : "▭";
  }
}

function assetSizeLabel(asset: AssetDef): string {
  if (asset.linkedParts) return `${asset.linkedParts.length} linked`;
  if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}×${asset.pxH ?? asset.h}px`;
  return `${asset.w}×${asset.h}`;
}

const allAssets = computed(() => [...store.assetMap().values()]);

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

const filteredAssets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allAssets.value;
  return allAssets.value.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
});

function originLabel(asset: AssetDef): string {
  return ORIGIN_LABELS[asset.origin ?? "drawn"] ?? asset.origin ?? "Drawn";
}

const showSvgForm = ref(false);
const svgName = ref("");
const svgW = ref(1);
const svgH = ref(1);
const svgContent = ref("");

const TILE_UNIT = 25;

watch(svgContent, (val) => {
  if (!val) return;
  const m = val.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!m) return;
  const parts = m[1].split(/[\s,]+/).map(Number);
  if (parts.length < 4 || parts.some(isNaN)) return;
  const vbW = parts[2];
  const vbH = parts[3];
  if (vbW <= 0 || vbH <= 0) return;
  svgW.value = Math.max(1, Math.round(vbW / TILE_UNIT));
  svgH.value = Math.max(1, Math.round(vbH / TILE_UNIT));
});

async function submitSvgAsset() {
  if (!svgName.value.trim()) {
    useToast().warning("Asset name cannot be empty");
    return;
  }
  if (!svgContent.value.trim()) {
    useToast().warning("SVG content cannot be empty");
    return;
  }
  const result = await run(() => store.addSvgAsset(svgName.value.trim(), svgW.value, svgH.value, svgContent.value));
  if (result) {
    useToast().success("SVG asset imported");
    svgName.value = "";
    svgContent.value = "";
    showSvgForm.value = false;
  }
}

function onAssetMouseDown(assetId: string, e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  store.setMode("object");
  startAssetDrag(assetId);
}

function onItemClick(assetId: string) {
  store.selectAsset(assetId);
}
</script>

<template>
  <div class="palette">
    <div class="palette__header">Asset Palette</div>
    <div class="palette__search">
      <input class="input input--bare" v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
      <button v-if="searchQuery" class="btn--ghost btn--icon" @click="searchQuery = ''" aria-label="Clear search" title="Clear search">×</button>
    </div>
    <div class="palette__scroll">
      <div v-if="!filteredAssets.length" class="palette__empty">No assets found</div>
      <div v-for="asset in filteredAssets" :key="asset.id" class="card--item palette__item" :class="{ 'palette--selected': store.state.selectedAssetId === asset.id, 'palette--linked': !!asset.linkedParts }" @mousedown="onAssetMouseDown(asset.id, $event)" @click="onItemClick(asset.id)">
        <span class="palette__icon">{{ assetIcon(asset) }}</span>
        <span class="palette__name">{{ asset.name }}</span>
        <span class="palette__meta">{{ assetSizeLabel(asset) }} · {{ originLabel(asset) }}</span>
        <span class="palette__count" :class="{ 'palette__count--placed': placedObjectCount(asset.id) > 0 }" :title="`${placedObjectCount(asset.id)} placed object${placedObjectCount(asset.id) === 1 ? '' : 's'}`">{{ placedObjectCount(asset.id) }}</span>
      </div>
    </div>

    <div class="palette__footer">
      <button class="btn--dashed" @click="store.setMode('draw')">+ Draw Object</button>
      <button class="btn--dashed" @click="showSvgForm = !showSvgForm">
        {{ showSvgForm ? "Cancel" : "+ Import SVG Asset" }}
      </button>

      <div v-if="showSvgForm" class="palette__form">
        <input class="input" v-model="svgName" placeholder="Asset name" aria-label="SVG asset name" />
        <div class="palette__dims">
          <input class="input input--num" type="number" min="1" :value="svgW" disabled placeholder="W (auto)" aria-label="SVG width (auto)" />
          <span aria-hidden="true">×</span>
          <input class="input input--num" type="number" min="1" :value="svgH" disabled placeholder="H (auto)" aria-label="SVG height (auto)" />
        </div>
        <textarea class="textarea" v-model="svgContent" placeholder="Paste SVG here (must include viewBox)..." rows="6" aria-label="SVG content"></textarea>
        <button class="btn--primary" :disabled="pending" @click="submitSvgAsset">Import SVG</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 20em;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-dim);
  color: var(--text-primary);
  overflow: hidden;
}

.palette__header {
  display: flex;
  align-items: center;
  padding: var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  font-weight: 700;
  font-size: var(--font-md);
  flex-shrink: 0;
}

.palette__footer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-md);
  background: var(--bg-card);
  border-top: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.palette__search {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-sm);
  border-bottom: 1px solid var(--border-dim);
}

.palette__search .input--bare {
  padding: 0;
  height: auto;
  background: transparent;
  border: none;
  box-shadow: none;
  outline: none;
}

.palette__search .input--bare:focus {
  box-shadow: none;
  border: none;
}

.palette__dims .input--num {
  width: 3.5em;
  text-align: center;
}

.palette__form,
.palette__category {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.palette__dims {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.palette__scroll {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-sm);
}

.palette__empty {
  padding: var(--gap-md);
  text-align: center;
  font-size: var(--font-sm);
  opacity: 0.7;
}

.palette__categorylabel {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  opacity: 0.7;
}

.palette__meta {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  opacity: 0.7;
  white-space: nowrap;
}

.palette__count {
  flex-shrink: 0;
  min-width: 1.125em;
  padding: 2px 5px;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  font-size: var(--font-xs);
  line-height: 1;
  text-align: center;
}

.palette__count--placed {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: color-mix(in srgb, var(--accent-blue) 12%, transparent);
}

.palette__hint {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  color: var(--text-dim);
  line-height: 1.5;
  border-left: 2px solid var(--border-dim);
  margin: var(--gap-xs) var(--gap-sm);
}

.palette__item {
  gap: var(--gap-sm);
  transition:
    background var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.palette__item:hover {
  border-color: var(--accent-primary);
}

.palette__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75em;
  height: 1.75em;
  flex-shrink: 0;
  font-size: var(--font-lg);
}

.palette__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-sm);
}

.palette__roomaccent {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--accent-primary) 50%, transparent);
}

.palette--selected {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
}

.palette--linked {
  border-color: var(--accent-blue);
}
</style>
