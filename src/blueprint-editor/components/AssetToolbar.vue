<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAssetsStore, startAssetDrag } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useAsyncAction } from "../composables/useAsyncAction";
import { assetSettingsIssues } from "../assetUtils";
import type { AssetDef } from "../types";
import AssetPickerModal from "./AssetPickerModal.vue";

const store = useAssetsStore();
const { pending, run } = useAsyncAction();

const searchQuery = ref("");
const showPicker = ref(false);

const ORIGIN_LABELS: Record<string, string> = {
  drawn: "Drawn",
  "svg-import": "SVG",
  linked: "Linked",
  flattened: "Flattened",
};

function assetSizeLabel(asset: AssetDef): string {
  if (asset.linkedParts) return `${asset.linkedParts.length} linked`;
  if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}x${asset.pxH ?? asset.h}px`;
  return `${asset.w}x${asset.h}`;
}

const allAssets = computed(() => [...store.assetMap().values()]);

const incompleteMap = computed(() => {
  const map = new Map<string, string[]>();
  for (const asset of allAssets.value) {
    const issues = assetSettingsIssues(asset);
    if (issues.length > 0) map.set(asset.id, issues);
  }
  return map;
});

const incompleteCount = computed(() => incompleteMap.value.size);

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
  <div class="form__panel">
    <div class="form__header">Origin Asset</div>
    <div class="form__group">
      <div class="form__search">
        <input v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
        <button v-if="searchQuery" class="flag--ghost flag--icon" @click="searchQuery = ''" aria-label="Clear search" title="Clear search">x</button>
      </div>
    </div>
    <div class="form__group has__scroll">
      <div class="form__header">
        <span>Assets List</span>
        <span v-if="incompleteCount" class="assets__warn flag--warning" title="Assets showing the yellow marker have incomplete settings">{{ incompleteCount }} incomplete</span>
        <button class="flag--ghost" @click="showPicker = true" title="Browse assets in a grid" aria-label="Browse assets">Browse</button>
      </div>
      <div v-if="!filteredAssets.length" class="empty assets__empty">No assets found</div>
      <div v-for="asset in filteredAssets" :key="asset.id" class="card--item assets__items" :class="{ 'assets--selected': store.state.selectedAssetId === asset.id, 'assets--linked': !!asset.linkedParts }" :title="incompleteTitle(asset) || undefined" @mousedown="onAssetMouseDown(asset.id, $event)" @click="onItemClick(asset.id)">
        <span class="assets__tiles">{{ assetSizeLabel(asset) }} - {{ originLabel(asset) }}</span>
        <span class="assets__name">{{ asset.name }}</span>
        <span v-if="incompleteMap.get(asset.id)?.length" class="assets__warn flag--warning" title="Incomplete settings">!</span>
        <span class="assets__count" :class="{ 'assets__count--placed': placedObjectCount(asset.id) > 0 }" :title="`${placedObjectCount(asset.id)} placed object${placedObjectCount(asset.id) === 1 ? '' : 's'}`">{{ placedObjectCount(asset.id) }}</span>
      </div>
    </div>
    <div class="form__group form__group--bottom">
      <button class="flag--dashed" @click="store.setMode('draw')">+ Draw Object</button>
      <button class="flag--dashed" @click="showSvgForm = !showSvgForm">
        {{ showSvgForm ? "Cancel" : "+ Import SVG Asset" }}
      </button>

      <div v-if="showSvgForm" class="form__group">
        <input v-model="svgName" placeholder="Asset name" aria-label="SVG asset name" />
        <div class="form__row form__row--tight">
          <input type="number" min="1" :value="svgW" disabled placeholder="W (auto)" aria-label="SVG width (auto)" />
          <span aria-hidden="true">x</span>
          <input type="number" min="1" :value="svgH" disabled placeholder="H (auto)" aria-label="SVG height (auto)" />
        </div>
        <textarea v-model="svgContent" placeholder="Paste SVG here (must include viewBox)..." rows="6" aria-label="SVG content"></textarea>
        <button class="flag--active" :disabled="pending" @click="submitSvgAsset">Import SVG</button>
      </div>
    </div>
    <AssetPickerModal :open="showPicker" @close="showPicker = false" />
  </div>
</template>

<style scoped>
.assets__empty {
  padding: var(--gap-md);
  opacity: 0.7;
}

.assets__tiles {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  opacity: 0.7;
  white-space: nowrap;
}

.assets__count {
  flex-shrink: 0;
  min-width: 11px;
  padding: 2px 5px;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  font-size: var(--font-xs);
  line-height: 1;
  text-align: center;
}

.assets__count--placed {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: color-mix(in srgb, var(--accent-blue) 12%, transparent);
}

.assets__warn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 var(--gap-xxs);
  font-size: var(--font-xs);
  line-height: 1;
}

.assets__items {
  gap: var(--gap-sm);
  transition:
    background var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.assets__items:hover {
  border-color: var(--accent-primary);
}

.assets__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-sm);
}

.assets--selected {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
}

.assets--linked {
  border-color: var(--accent-blue);
}
</style>
