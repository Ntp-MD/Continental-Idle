<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAssetsStore, startAssetDrag } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useAsyncAction } from "../composables/useAsyncAction";
import { sanitizeString } from "../../utils/sanitize";
import { isHexColor } from "../store/state";
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

const filteredAssets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allAssets.value;
  return allAssets.value.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
});

function originLabel(asset: AssetDef): string {
  return ORIGIN_LABELS[asset.origin ?? "drawn"] ?? asset.origin ?? "Drawn";
}

const showAddForm = ref(false);
const newNameRaw = ref("");
const newName = computed({
  get: () => newNameRaw.value,
  set: (v: string) => {
    newNameRaw.value = sanitizeString(v);
  },
});
const newW = ref(1);
const newH = ref(1);
const newRx = ref(0);
const newBgColor = ref("");

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

async function submitNewAsset() {
  if (!newName.value.trim()) {
    useToast().warning("Asset name cannot be empty");
    return;
  }
  if (newBgColor.value && !isHexColor(newBgColor.value)) {
    useToast().warning("Background color must be a hex code");
    return;
  }
  const rx = newRx.value > 0 ? { tl: newRx.value, tr: newRx.value, br: newRx.value, bl: newRx.value } : undefined;
  await run(() => store.addAsset(newName.value.trim(), newW.value, newH.value, undefined, undefined, rx, newBgColor.value || undefined));
  useToast().success("Asset added");
  newNameRaw.value = "";
  newW.value = 1;
  newH.value = 1;
  newRx.value = 0;
  newBgColor.value = "";
  showAddForm.value = false;
}

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
  <div class="asset__palette">
    <div class="asset__palette-header">Asset Palette</div>
    <div class="asset__palette-search">
      <input class="input" v-model="searchQuery" placeholder="Search assets..." type="text" aria-label="Search assets" />
      <button v-if="searchQuery" class="btn--ghost btn--icon" @click="searchQuery = ''" aria-label="Clear search" title="Clear search">×</button>
    </div>
    <div class="asset__palette-scroll">
      <div v-if="!filteredAssets.length" class="asset__palette-empty">No assets found</div>
      <div v-for="asset in filteredAssets" :key="asset.id" class="asset__palette-item" :class="{ 'asset__palette--selected': store.state.selectedAssetId === asset.id, 'asset__palette--linked': !!asset.linkedParts }" @mousedown="onAssetMouseDown(asset.id, $event)" @click="onItemClick(asset.id)">
        <span class="asset__palette-itemicon">{{ assetIcon(asset) }}</span>
        <span class="asset__palette-itemtruncate">{{ asset.name }}</span>
        <span class="asset__palette-dimlabel">{{ assetSizeLabel(asset) }} · {{ originLabel(asset) }}</span>
      </div>
    </div>

    <div class="asset__palette-footer">
      <button class="btn--dashed" @click="showAddForm = !showAddForm">
        {{ showAddForm ? "Cancel" : "+ Add New Asset" }}
      </button>
      <button class="btn--dashed" @click="showSvgForm = !showSvgForm">
        {{ showSvgForm ? "Cancel" : "+ Import SVG Asset" }}
      </button>

      <div v-if="showAddForm" class="asset__palette-form">
        <input id="asset-new-name" class="input" v-model="newName" placeholder="Asset name" aria-label="Asset name" />
        <div class="asset__palette-formhstack">
          <input id="asset-new-w" class="input input--num" type="number" min="1" v-model.number="newW" placeholder="W" aria-label="Asset width in tiles" />
          <span aria-hidden="true">×</span>
          <input id="asset-new-h" class="input input--num" type="number" min="1" v-model.number="newH" placeholder="H" aria-label="Asset height in tiles" />
        </div>
        <input id="asset-new-rx" class="input" type="number" min="0" v-model.number="newRx" placeholder="Corner radius (0 = none)" aria-label="Corner radius (0 = none)" />
        <input id="asset-new-bgcolor" class="input" v-model="newBgColor" placeholder="#RRGGBB" aria-label="Background color hex value" />
        <button class="btn--primary" :disabled="pending" @click="submitNewAsset">Add Asset</button>
      </div>

      <div v-if="showSvgForm" class="asset__palette-form">
        <input class="input" v-model="svgName" placeholder="Asset name" aria-label="SVG asset name" />
        <div class="asset__palette-formhstack">
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
.asset__palette {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 250px;
  min-width: 0;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-dim);
  color: var(--text-primary);
  overflow: hidden;
}

.asset__palette-header {
  display: flex;
  align-items: center;
  padding: var(--gap-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  font-weight: 700;
  font-size: var(--font-md);
  flex-shrink: 0;
}

.asset__palette-footer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-md);
  background: var(--bg-card);
  border-top: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.asset__palette-search {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-sm);
  border-bottom: 1px solid var(--border-dim);
}

.asset__palette-form,
.asset__palette-category {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.asset__palette-formhstack {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.asset__palette-scroll {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  padding: var(--gap-xs);
}

.asset__palette-empty {
  padding: var(--gap-md);
  text-align: center;
  font-size: var(--font-sm);
  opacity: 0.7;
}

.asset__palette-categorylabel {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  opacity: 0.7;
}

.asset__palette-dimlabel {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  opacity: 0.7;
  white-space: nowrap;
}

.asset__palette-hint {
  padding: var(--gap-xs) var(--gap-sm);
  font-size: var(--font-xs);
  color: var(--text-dim);
  line-height: 1.5;
  border-left: 2px solid var(--border-dim);
  margin: var(--gap-xs) var(--gap-sm);
}

.asset__palette-item {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  transition:
    background var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.asset__palette-item:hover {
  background: var(--bg-card);
  border-color: var(--accent-gold);
}

.asset__palette-itemicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  font-size: var(--font-lg);
}

.asset__palette-itemtruncate {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-sm);
}

.asset__palette-roomaccent {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--accent-gold) 50%, transparent);
}

.asset__palette--selected {
  border-color: var(--accent-gold);
  background: color-mix(in srgb, var(--accent-gold) 12%, transparent);
}

.asset__palette--linked {
  border-color: var(--accent-blue);
}
</style>
