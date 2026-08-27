<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import { useClipboardCopy } from "../composables/useClipboardCopy";
import { renderSvgInto } from "../svgSanitizer";
import { assetSvgVarStyle } from "../assetUtils";
import type { AssetDef } from "../types";
import TagPicker from "./TagPicker.vue";
import AssetEditModal from "./AssetEditModal.vue";
import { managedTagSet } from "../store/tags";

const props = defineProps<{ asset: AssetDef }>();
const store = useAssetsStore();
const confirm = useConfirm().confirm;
const { pending, run } = useAsyncAction();
const { copyId } = useClipboardCopy();

const assetFields = ref<{ name: string; defaultLabel: string }>({
  name: "",
  defaultLabel: "",
});
const assetTags = ref<string[]>([]);
const showEditor = ref(false);
const portal = ref(props.asset.tags?.includes("portal") ?? false);

watch(
  () => props.asset,
  (a) => {
    assetFields.value = {
      name: a.name,
      defaultLabel: a.defaultLabel ?? "",
    };
    assetTags.value = a.tags ? [...a.tags] : [];
    portal.value = a.tags?.includes("portal") ?? false;
    showEditor.value = false;
  },
  { immediate: true },
);

const isSvgAsset = computed(() => !!props.asset.svg);
const isNpcDeployed = computed(() => store.state.mode === "npc-preview");
const orphanAssetTags = computed(() => assetTags.value.filter((tag) => !managedTagSet.value.has(tag)));

const previewSvgEl = ref<SVGSVGElement | null>(null);
const canvasTileSize = computed(() => Math.max(1, store.state.layout.canvas.tileSize));

const previewSvgViewBox = computed(() => {
  const a = props.asset;
  const vb = a.svgViewBox;
  if (!vb || vb.w === 0 || vb.h === 0) {
    const w = a.usePx ? (a.pxW ?? a.w * canvasTileSize.value) : a.w * canvasTileSize.value;
    const h = a.usePx ? (a.pxH ?? a.h * canvasTileSize.value) : a.h * canvasTileSize.value;
    return `0 0 ${w} ${h}`;
  }
  return `0 0 ${vb.w} ${vb.h}`;
});

function fallbackShapeSvg(a: AssetDef): string {
  const TILE = canvasTileSize.value;
  const w = a.usePx ? (a.pxW ?? a.w * TILE) : a.w * TILE;
  const h = a.usePx ? (a.pxH ?? a.h * TILE) : a.h * TILE;
  const rx = Math.max(a.defaultRx?.tl ?? 0, a.defaultRx?.tr ?? 0, a.defaultRx?.br ?? 0, a.defaultRx?.bl ?? 0);
  const rawFill = a.defaultFillColor ?? "none";
  const fill = !rawFill || rawFill === "transparent" ? "none" : rawFill;
  const stroke = a.defaultStrokeColor ?? "#6f7680";
  return `<rect x="1" y="1" width="${Math.max(1, w - 2)}" height="${Math.max(1, h - 2)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
}

const previewSvg = computed(() => props.asset.svg?.replace(/var\(--border-dim\)/g, "#fff") ?? fallbackShapeSvg(props.asset));
const previewVars = computed(() => assetSvgVarStyle(props.asset));

function renderPreview() {
  const el = previewSvgEl.value;
  const svg = previewSvg.value;
  if (el && svg) renderSvgInto(el, svg);
}

watch(previewSvg, () => nextTick(renderPreview));
watch(
  () => props.asset.id,
  () => nextTick(renderPreview),
);
onMounted(renderPreview);

const collapsedCount = computed(() => {
  let count = 0;
  for (const floor of store.state.layout.floors) {
    for (const obj of floor.objects) {
      if (obj.type === props.asset.id && obj.collapsed) count++;
    }
  }
  return count;
});

const assetInUse = computed(() => {
  return store.state.layout.floors.some((f) => f.objects.some((o) => o.type === props.asset.id));
});

async function commitField(field: "name" | "defaultLabel") {
  const val = assetFields.value[field];
  await store.updateAsset(props.asset.id, { [field]: val } as Partial<AssetDef>);
}

async function saveAssetTags(tags: string[]) {
  if (isNpcDeployed.value && tags.includes("portal") !== assetTags.value.includes("portal")) {
    useToast().warning("Cannot change Portal tag while NPCs are deployed. Exit NPC preview first.");
    return;
  }
  assetTags.value = tags;
  portal.value = tags.includes("portal");
  await store.updateAsset(props.asset.id, { tags });
}

async function deleteAsset() {
  if (assetInUse.value) {
    useToast().warning("Cannot delete - asset is placed on floors. Remove instances first.");
    return;
  }
  const confirmed = await confirm({
    title: "Remove asset",
    message: "Remove this asset from the palette?",
    confirmLabel: "Remove",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  const deleted = await run(() => store.deleteAsset(props.asset.id));
  if (!deleted) return;
  store.selectAsset(null);
  useToast().success("Asset removed from palette");
}

async function duplicateAsset() {
  const copy = await run(() => store.duplicateAsset(props.asset.id));
  if (copy) store.selectAsset(copy.id);
}
</script>

<template>
  <div class="form__group">
    <div class="form__col">
      <label>Preview</label>
      <div class="preview__svg">
        <svg ref="previewSvgEl" :viewBox="previewSvgViewBox" width="80" height="80" preserveAspectRatio="xMidYMid meet" :style="previewVars"></svg>
      </div>
      <span v-if="!isSvgAsset" class="form__hint">Shape preview - non-SVG asset</span>
    </div>
    <div class="form__row">
      <label>Origin</label>
      <span>{{ asset.origin ?? "drawn" }}</span>
    </div>
    <div class="form__row">
      <label>ID</label>
      <div class="form__row">
        <input type="text" :value="asset.id" disabled class="input--disabled" title="Asset ID" />
        <button @click="copyId(asset.id)">Copy</button>
      </div>
    </div>

    <div class="form__row">
      <label>Name</label>
      <input type="text" v-model="assetFields.name" @change="commitField('name')" />
    </div>
    <div class="form__row">
      <label>Label</label>
      <input type="text" v-model="assetFields.defaultLabel" @change="commitField('defaultLabel')" placeholder="Use asset name" />
    </div>
    <div class="form__row">
      <label>Tags</label>
      <TagPicker :model-value="assetTags" @update:model-value="saveAssetTags" placeholder="rest, service, target" />
    </div>
    <div v-if="orphanAssetTags.length" class="card">Undefined tags: {{ orphanAssetTags.join(", ") }}. Recreate the tag definition or remove these assignments.</div>
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

  <AssetEditModal :open="showEditor" :asset="asset" @close="showEditor = false" />
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
  display: block;
  overflow: hidden;
}
</style>
