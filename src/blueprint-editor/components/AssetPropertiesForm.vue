<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import { useWalkableGridPanel } from "../composables/useWalkableGridPanel";
import { useClipboardCopy } from "../composables/useClipboardCopy";
import { renderSvgInto } from "../svgSanitizer";
import type { AssetDef } from "../types";
import { isHexColor, isValidColor } from "../types";
import TagPicker from "./TagPicker.vue";
import ColorInput from "./ColorInput.vue";
import { managedTagSet } from "../store/tags";

const props = defineProps<{ asset: AssetDef }>();
const store = useAssetsStore();
const confirm = useConfirm().confirm;
const { pending, run } = useAsyncAction();
const { showWalkableGridPanel, openWalkableGridPanel, closeWalkableGridPanel } = useWalkableGridPanel();
const { copyId } = useClipboardCopy();

const assetFields = ref<{ name: string; defaultLabel: string; w: number; h: number; pxW: number; pxH: number; usePx: boolean; defaultPadding: number; defaultRadius: number; defaultLabelPadding: number; rxTL: number; rxTR: number; rxBR: number; rxBL: number; defaultBgColor: string | undefined; defaultLabelColor: string | undefined }>({
  name: "",
  defaultLabel: "",
  w: 1,
  h: 1,
  pxW: 0,
  pxH: 0,
  usePx: false,
  defaultPadding: 0,
  defaultRadius: 0,
  defaultLabelPadding: 0,
  rxTL: 0,
  rxTR: 0,
  rxBR: 0,
  rxBL: 0,
  defaultBgColor: "",
  defaultLabelColor: "",
});
const assetRxSync = ref(true);
const assetTags = ref<string[]>([]);
const collapsedSections = ref<Record<string, boolean>>({ general: false, dimensions: false });
const portal = ref(props.asset.tags?.includes("portal") ?? false);
let syncingAsset = false;
function toggleSection(key: string) {
  collapsedSections.value[key] = !collapsedSections.value[key];
}

watch(
  () => props.asset,
  (a) => {
    syncingAsset = true;
    assetFields.value = {
      name: a.name,
      defaultLabel: a.defaultLabel ?? "",
      w: a.w,
      h: a.h,
      pxW: a.pxW ?? 0,
      pxH: a.pxH ?? 0,
      usePx: a.usePx ?? false,
      defaultPadding: a.defaultPadding ?? 0,
      defaultRadius: a.defaultRadius ?? 0,
      defaultLabelPadding: a.defaultLabelPadding ?? 0,
      rxTL: a.defaultRx?.tl ?? 0,
      rxTR: a.defaultRx?.tr ?? 0,
      rxBR: a.defaultRx?.br ?? 0,
      rxBL: a.defaultRx?.bl ?? 0,
      defaultBgColor: a.defaultBgColor,
      defaultLabelColor: a.defaultLabelColor,
    };
    assetTags.value = a.tags ? [...a.tags] : [];
    portal.value = a.tags?.includes("portal") ?? false;
    closeWalkableGridPanel();
    nextTick(() => {
      syncingAsset = false;
    });
  },
  { immediate: true },
);

const isLinkedAsset = computed(() => !!props.asset.linkedParts);
const linkedPartCount = computed(() => props.asset.linkedParts?.length ?? 0);
const isSvgAsset = computed(() => !!props.asset.svg);
const isNpcDeployed = computed(() => store.state.mode === "npc-preview");
const orphanAssetTags = computed(() => assetTags.value.filter((tag) => !managedTagSet.value.has(tag)));

const previewSvgEl = ref<SVGSVGElement | null>(null);
const previewSvgViewBox = computed(() => {
  const vb = props.asset.svgViewBox;
  if (!vb || vb.w === 0 || vb.h === 0) return `0 0 ${props.asset.w} ${props.asset.h}`;
  return `0 0 ${vb.w} ${vb.h}`;
});
const previewSvg = computed(() => props.asset.svg?.replace(/var\(--border-dim\)/g, "#fff") ?? "");

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

watch(portal, async (v) => {
  if (syncingAsset) return;
  if (isNpcDeployed.value) {
    useToast().warning("Cannot toggle Portal while NPCs are deployed. Exit NPC preview first.");
    portal.value = !v;
    return;
  }
  const tags = new Set(assetTags.value);
  if (v) tags.add("portal");
  else tags.delete("portal");
  const newTags = [...tags];
  assetTags.value = newTags;
  try {
    await store.updateAsset(props.asset.id, { tags: newTags });
  } catch {
    portal.value = !v;
  }
});

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

const SIZE_FIELDS = ["w", "h", "pxW", "pxH"] as const;
const sizeLocked = computed(() => assetInUse.value);

function revertSizeField(field: "w" | "h" | "pxW" | "pxH") {
  assetFields.value[field] = props.asset[field] ?? 0;
}

async function commitField(field: "name" | "defaultLabel" | "w" | "h" | "pxW" | "pxH" | "usePx" | "defaultPadding" | "defaultRadius" | "defaultLabelPadding" | "defaultBgColor" | "defaultLabelColor") {
  if ((SIZE_FIELDS as readonly string[]).includes(field) && sizeLocked.value) {
    useToast().warning("Cannot resize — asset is placed on floors. Remove instances first.");
    revertSizeField(field as "w" | "h" | "pxW" | "pxH");
    return;
  }
  const val = assetFields.value[field];
  if (field === "defaultBgColor" && typeof val === "string" && val && !isValidColor(val)) {
    useToast().warning("Background color must be a hex code or 'transparent'");
    return;
  }
  if (field === "defaultLabelColor" && typeof val === "string" && val && !isHexColor(val)) {
    useToast().warning("Label color must be a hex code");
    return;
  }
  await store.updateAsset(props.asset.id, { [field]: val } as Partial<Pick<AssetDef, "name" | "defaultLabel" | "w" | "h" | "pxW" | "pxH" | "usePx" | "defaultPadding" | "defaultRadius" | "defaultLabelPadding" | "defaultBgColor" | "defaultLabelColor">>);
}

async function toggleUsePx() {
  if (sizeLocked.value) {
    useToast().warning("Cannot change unit mode — asset is placed on floors. Remove instances first.");
    return;
  }
  assetFields.value.usePx = !assetFields.value.usePx;
  await store.updateAsset(props.asset.id, { usePx: assetFields.value.usePx });
}

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = assetFields.value;
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateAsset(props.asset.id, { defaultRx: undefined });
  } else {
    await store.updateAsset(props.asset.id, { defaultRx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } });
  }
}

async function onRxInput(corner: "rxTL" | "rxTR" | "rxBR" | "rxBL") {
  if (assetRxSync.value) {
    const val = assetFields.value[corner];
    assetFields.value.rxTL = val;
    assetFields.value.rxTR = val;
    assetFields.value.rxBR = val;
    assetFields.value.rxBL = val;
  }
  await commitRx();
}

async function clearAssetBgColor() {
  assetFields.value.defaultBgColor = undefined;
  await store.updateAsset(props.asset.id, { defaultBgColor: undefined });
}

async function clearAssetLabelColor() {
  assetFields.value.defaultLabelColor = undefined;
  await store.updateAsset(props.asset.id, { defaultLabelColor: undefined });
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

async function onRotateAsset() {
  if (!isSvgAsset.value || !props.asset.svgViewBox) return;
  await store.rotateAsset(props.asset.id);
  useToast().info("Asset rotated 90°");
}

async function onSave() {
  await run(async () => {
    await store.saveAssets();
    await store.saveLayout();
  });
  useToast().success("Asset saved");
}

async function deleteAsset() {
  if (assetInUse.value) {
    useToast().warning("Cannot delete — asset is placed on floors. Remove instances first.");
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
  <div class="properties__content">
    <!-- General -->
    <div class="properties__section">
      <div class="properties__title properties__collapse" @click="toggleSection('general')">
        <span>General</span>
        <span class="properties__caret">{{ collapsedSections.general ? "▸" : "▾" }}</span>
      </div>
      <div v-show="!collapsedSections.general" class="properties__section-content">
        <div v-if="isSvgAsset" class="properties__row">
          <label>Preview</label>
          <div class="assetpreview">
            <svg ref="previewSvgEl" :viewBox="previewSvgViewBox" width="80" height="80" preserveAspectRatio="xMidYMid meet" class="assetpreview__svg"></svg>
          </div>
        </div>
        <div class="properties__row">
          <label>ID</label>
          <div class="properties__idrow">
            <input type="text" :value="asset.id" disabled class="input input--readonly" title="Asset ID" />
            <button @click="copyId(asset.id)">Copy</button>
          </div>
        </div>
        <div class="properties__row">
          <label>Origin</label>
          <span class="properties__value">{{ asset.origin ?? "drawn" }}</span>
        </div>
        <div v-if="isLinkedAsset" class="alert alert--info alert--sm">
          <span class="properties__badge">⛓</span>
          <span>Linked set — {{ linkedPartCount }} objects. Drag to place all parts linked together.</span>
        </div>
        <div class="properties__row">
          <label>Name</label>
          <input class="input" type="text" v-model="assetFields.name" @change="commitField('name')" />
        </div>
        <div class="properties__row">
          <label>Placed Label</label>
          <input class="input" type="text" v-model="assetFields.defaultLabel" @change="commitField('defaultLabel')" placeholder="Use asset name" />
        </div>
        <div class="properties__row">
          <label>NPC Tags</label>
          <TagPicker :model-value="assetTags" @update:model-value="saveAssetTags" placeholder="rest, service, target" />
        </div>
        <div v-if="orphanAssetTags.length" class="alert alert--warning alert--sm">Undefined tags: {{ orphanAssetTags.join(", ") }}. Recreate the tag definition or remove these assignments.</div>
        <div v-if="isSvgAsset" class="properties__row">
          <label>Rotate Origin</label>
          <button @click="onRotateAsset">↻ 90°</button>
        </div>
        <div v-if="!isLinkedAsset" class="properties__row">
          <label>Walkable Grid</label>
          <button class="btn--warning" @click="showWalkableGridPanel ? closeWalkableGridPanel() : openWalkableGridPanel()">
            {{ showWalkableGridPanel ? "Close" : "Manage" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dimensions -->
    <div class="properties__section">
      <div class="properties__title properties__collapse" @click="toggleSection('dimensions')">
        <span>Dimensions & Style</span>
        <span class="properties__caret">{{ collapsedSections.dimensions ? "▸" : "▾" }}</span>
      </div>
      <div v-show="!collapsedSections.dimensions" class="properties__section-content">
        <template v-if="!isLinkedAsset">
          <div v-if="sizeLocked" class="alert alert--warning alert--sm">
            <span class="properties__badge">⊘</span>
            <span>Size is locked — asset is placed on floors. Remove all instances to resize.</span>
          </div>
          <div v-if="!isSvgAsset" class="properties__row">
            <label>Unit Mode</label>
            <div class="properties__unitpicker">
              <button :class="{ 'btn--warning': !assetFields.usePx }" :disabled="sizeLocked" @click="assetFields.usePx ? toggleUsePx() : null">Tiles</button>
              <button :class="{ 'btn--warning': assetFields.usePx }" :disabled="sizeLocked" @click="!assetFields.usePx ? toggleUsePx() : null">Pixels</button>
            </div>
          </div>
          <template v-if="!assetFields.usePx">
            <div class="properties__row-pair">
              <div class="properties__row">
                <label>Width</label>
                <input class="input" type="number" min="1" :disabled="sizeLocked" v-model.number="assetFields.w" @change="commitField('w')" />
              </div>
              <div class="properties__row">
                <label>Height</label>
                <input class="input" type="number" min="1" :disabled="sizeLocked" v-model.number="assetFields.h" @change="commitField('h')" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="properties__row-pair">
              <div class="properties__row">
                <label>Width (px)</label>
                <input type="number" min="1" :disabled="sizeLocked" v-model.number="assetFields.pxW" @change="commitField('pxW')" />
              </div>
              <div class="properties__row">
                <label>Height (px)</label>
                <input type="number" min="1" :disabled="sizeLocked" v-model.number="assetFields.pxH" @change="commitField('pxH')" />
              </div>
            </div>
          </template>
        </template>
        <div class="properties__row">
          <label>Default Padding</label>
          <input type="number" min="0" v-model.number="assetFields.defaultPadding" @change="commitField('defaultPadding')" />
        </div>
        <div class="properties__row">
          <label>Label Radius</label>
          <input type="number" min="0" v-model.number="assetFields.defaultRadius" @change="commitField('defaultRadius')" />
        </div>
        <div class="properties__row">
          <label>Label Padding</label>
          <input type="number" min="0" v-model.number="assetFields.defaultLabelPadding" @change="commitField('defaultLabelPadding')" />
        </div>
        <div class="properties__row">
          <label>Bg Color</label>
          <div class="properties__colorrow">
            <ColorInput v-model="assetFields.defaultBgColor" :allow-transparent="true" placeholder="#RRGGBB or transparent" aria-label="Asset background color" @commit="commitField('defaultBgColor')" />
            <button type="button" @click="clearAssetBgColor">Reset</button>
          </div>
        </div>
        <div class="properties__row">
          <label>Label Color</label>
          <div class="properties__colorrow">
            <ColorInput v-model="assetFields.defaultLabelColor" placeholder="#RRGGBB" aria-label="Asset label color" @commit="commitField('defaultLabelColor')" />
            <button type="button" @click="clearAssetLabelColor">Reset</button>
          </div>
        </div>
        <div class="properties__row properties__row--toggle">
          <label>Portal</label>
          <button :class="{ 'btn--success': portal, 'btn--danger': !portal }" :disabled="isNpcDeployed" @click="portal = !portal" :title="isNpcDeployed ? 'Exit NPC preview to change Portal setting' : portal ? 'NPCs can travel to another floor through this object' : 'NPCs cannot use this object for cross-floor travel'">
            {{ portal ? "ON" : "OFF" }}
          </button>
        </div>
        <template v-if="!isLinkedAsset">
          <div class="properties__row">
            <label>Corner Radius</label>
            <div class="properties__rxgrid">
              <div class="properties__rxcorner">
                <span class="properties__rxlabel">↖ TL</span>
                <input type="number" min="0" v-model.number="assetFields.rxTL" @input="onRxInput('rxTL')" class="input input--num input--compact" />
              </div>
              <div class="properties__rxcorner">
                <span class="properties__rxlabel">TR ↗</span>
                <input type="number" min="0" v-model.number="assetFields.rxTR" @input="onRxInput('rxTR')" class="input input--num input--compact" />
              </div>
              <div class="properties__rxcorner">
                <span class="properties__rxlabel">↙ BL</span>
                <input type="number" min="0" v-model.number="assetFields.rxBL" @input="onRxInput('rxBL')" class="input input--num input--compact" />
              </div>
              <div class="properties__rxcorner">
                <span class="properties__rxlabel">BR ↘</span>
                <input type="number" min="0" v-model.number="assetFields.rxBR" @input="onRxInput('rxBR')" class="input input--num input--compact" />
              </div>
              <button type="button" class="btn--icon properties__rxsync" :class="{ 'properties__rxsync--active': assetRxSync }" :aria-pressed="assetRxSync" :title="assetRxSync ? 'Sync all corners — ON' : 'Sync all corners — OFF'" @click="assetRxSync = !assetRxSync">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="collapsedCount > 0" class="alert alert--danger alert--sm">
      <span class="properties__badge">✕</span>
      <span>{{ collapsedCount }} object(s) collapsed — overlapping! Shown in red on canvas.</span>
    </div>
    <div class="properties__actions">
      <button class="btn--primary" :disabled="pending" @click="onSave">Save Asset</button>
      <button class="btn--warning" :disabled="pending" @click="duplicateAsset">Duplicate</button>
      <button class="btn--danger" :disabled="pending" @click="deleteAsset">Delete Asset</button>
    </div>
  </div>
</template>

<style scoped>
.properties__section-content {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.input--num {
  width: 3.5em;
  text-align: center;
}

.input--compact {
  width: 2.5em;
  text-align: center;
  padding: 0 2px;
}

.assetpreview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5.25em;
  aspect-ratio: 1;
  height: auto;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  overflow: hidden;
}

.assetpreview__svg {
  display: block;
}

.properties__collapse {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: color var(--duration-fast) ease-out;
}

.properties__collapse:hover,
.properties__collapse:hover .properties__caret {
  color: var(--accent-primary);
}

.properties__unitpicker {
  display: flex;
  gap: var(--gap-xs);
}

.properties__caret {
  color: var(--text-dim);
  font-size: var(--font-xs);
}

.properties__badge {
  width: 1.125em;
  height: 1.125em;
  border-radius: var(--radius-pill);
  background: var(--bg-tertiary);
  font-weight: 700;
  flex-shrink: 0;
}
</style>
