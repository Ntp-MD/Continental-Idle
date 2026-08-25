<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import type { AssetDef } from "../types";
import { isHexColor, isValidColor } from "../types";
import ColorInput from "./ColorInput.vue";

const props = defineProps<{ asset: AssetDef }>();
const store = useAssetsStore();

const dimFields = ref<{
  w: number;
  h: number;
  pxW: number;
  pxH: number;
  usePx: boolean;
  defaultPadding: number;
  defaultRadius: number;
  defaultLabelPadding: number;
  rxTL: number;
  rxTR: number;
  rxBR: number;
  rxBL: number;
  defaultFillColor: string | undefined;
  defaultStrokeColor: string | undefined;
}>({
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
  defaultFillColor: "",
  defaultStrokeColor: "",
});
const assetRxSync = ref(true);
const assetColorSync = ref(true);
const portal = ref(props.asset.tags?.includes("portal") ?? false);
const assetTags = ref<string[]>([]);
let syncingAsset = false;

watch(
  () => props.asset,
  (a) => {
    syncingAsset = true;
    dimFields.value = {
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
      defaultFillColor: a.defaultFillColor,
      defaultStrokeColor: a.defaultStrokeColor,
    };
    assetTags.value = a.tags ? [...a.tags] : [];
    portal.value = a.tags?.includes("portal") ?? false;
    nextTick(() => {
      syncingAsset = false;
    });
  },
  { immediate: true },
);

const isLinkedAsset = computed(() => !!props.asset.linkedParts);
const isSvgAsset = computed(() => !!props.asset.svg);
const isNpcDeployed = computed(() => store.state.mode === "npc-preview");

const assetInUse = computed(() => {
  return store.state.layout.floors.some((f) => f.objects.some((o) => o.type === props.asset.id));
});

const SIZE_FIELDS = ["w", "h", "pxW", "pxH"] as const;
const sizeLocked = computed(() => assetInUse.value);

function revertSizeField(field: "w" | "h" | "pxW" | "pxH") {
  dimFields.value[field] = props.asset[field] ?? 0;
}

async function commitField(field: "w" | "h" | "pxW" | "pxH" | "usePx" | "defaultPadding" | "defaultRadius" | "defaultLabelPadding" | "defaultFillColor" | "defaultStrokeColor") {
  if ((SIZE_FIELDS as readonly string[]).includes(field) && sizeLocked.value) {
    useToast().warning("Cannot resize - asset is placed on floors. Remove instances first.");
    revertSizeField(field as "w" | "h" | "pxW" | "pxH");
    return;
  }
  const val = dimFields.value[field];
  if ((field === "defaultFillColor" || field === "defaultStrokeColor") && typeof val === "string" && val && !isValidColor(val)) {
    useToast().warning("Color must be a hex code or 'transparent'");
    return;
  }
  await store.updateAsset(props.asset.id, { [field]: val } as Partial<AssetDef>);
  if (field === "defaultFillColor" && assetColorSync.value && typeof val === "string" && val && isHexColor(val)) {
    const derived = darkenHex(val);
    dimFields.value.defaultStrokeColor = derived;
    await store.updateAsset(props.asset.id, { defaultStrokeColor: derived });
  }
}

function darkenHex(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.round(v * 0.55).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

async function toggleUsePx() {
  if (sizeLocked.value) {
    useToast().warning("Cannot change unit mode - asset is placed on floors. Remove instances first.");
    return;
  }
  dimFields.value.usePx = !dimFields.value.usePx;
  await store.updateAsset(props.asset.id, { usePx: dimFields.value.usePx });
}

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = dimFields.value;
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateAsset(props.asset.id, { defaultRx: undefined });
  } else {
    await store.updateAsset(props.asset.id, { defaultRx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } });
  }
}

async function onRxInput(corner: "rxTL" | "rxTR" | "rxBR" | "rxBL") {
  if (assetRxSync.value) {
    const val = dimFields.value[corner];
    dimFields.value.rxTL = val;
    dimFields.value.rxTR = val;
    dimFields.value.rxBR = val;
    dimFields.value.rxBL = val;
  }
  await commitRx();
}

async function clearAssetFillColor() {
  dimFields.value.defaultFillColor = undefined;
  await store.updateAsset(props.asset.id, { defaultFillColor: undefined });
}

async function clearAssetStrokeColor() {
  dimFields.value.defaultStrokeColor = undefined;
  await store.updateAsset(props.asset.id, { defaultStrokeColor: undefined });
}

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
</script>

<template>
  <div class="modal__body">
    <div v-if="sizeLocked" class="card">
      <span>Size is locked - asset is placed on floors. Remove all instances to resize.</span>
    </div>
    <div class="originpanel__section">
      <div class="originpanel__title">Dimensions</div>
      <div v-if="!isSvgAsset" class="form__row">
        <label>Unit Mode</label>
        <div class="form__row form__row--tight">
          <button :class="{ 'flag--warning': !dimFields.usePx }" :disabled="sizeLocked" @click="dimFields.usePx ? toggleUsePx() : null">Tiles</button>
          <button :class="{ 'flag--warning': dimFields.usePx }" :disabled="sizeLocked" @click="!dimFields.usePx ? toggleUsePx() : null">Pixels</button>
        </div>
      </div>
      <template v-if="!dimFields.usePx">
        <div class="form__row form__row--pair">
          <div class="form__row">
            <label>Width</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.w" @change="commitField('w')" />
          </div>
          <div class="form__row">
            <label>Height</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.h" @change="commitField('h')" />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="form__row form__row--pair">
          <div class="form__row">
            <label>Width (px)</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.pxW" @change="commitField('pxW')" />
          </div>
          <div class="form__row">
            <label>Height (px)</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.pxH" @change="commitField('pxH')" />
          </div>
        </div>
      </template>
      <div class="form__row form__row--pair">
        <div class="form__row">
          <label>Default Padding</label>
          <input type="number" min="0" v-model.number="dimFields.defaultPadding" @change="commitField('defaultPadding')" />
        </div>
        <div class="form__row">
          <label>Label Padding</label>
          <input type="number" min="0" v-model.number="dimFields.defaultLabelPadding" @change="commitField('defaultLabelPadding')" />
        </div>
      </div>
      <div class="form__row">
        <label>Shape Radius</label>
        <input type="number" min="0" v-model.number="dimFields.defaultRadius" @change="commitField('defaultRadius')" />
      </div>
      <div v-if="!isLinkedAsset" class="form__row">
        <label>Corner Radius</label>
        <div class="form__row form__row--tight">
          <label class="form__row form__row--tight">
            <span>TL</span>
            <input type="number" min="0" v-model.number="dimFields.rxTL" @input="onRxInput('rxTL')" />
          </label>
          <label class="form__row form__row--tight">
            <span>TR</span>
            <input type="number" min="0" v-model.number="dimFields.rxTR" @input="onRxInput('rxTR')" />
          </label>
          <label class="form__row form__row--tight">
            <span>BL</span>
            <input type="number" min="0" v-model.number="dimFields.rxBL" @input="onRxInput('rxBL')" />
          </label>
          <label class="form__row form__row--tight">
            <span>BR</span>
            <input type="number" min="0" v-model.number="dimFields.rxBR" @input="onRxInput('rxBR')" />
          </label>
          <button type="button" class="flag--icon" :class="{ 'flag--active': assetRxSync }" :aria-pressed="assetRxSync" :title="assetRxSync ? 'Sync all corners - ON' : 'Sync all corners - OFF'" @click="assetRxSync = !assetRxSync">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="originpanel__section">
      <div class="originpanel__title">Appearance</div>
      <div class="form__row">
        <label>Fill Color</label>
        <div class="form__row">
          <ColorInput v-model="dimFields.defaultFillColor" :allow-transparent="true" placeholder="#RRGGBB (empty = wireframe)" aria-label="Asset fill color" @commit="commitField('defaultFillColor')" />
          <button type="button" @click="clearAssetFillColor">Reset</button>
          <button type="button" class="flag--icon" :class="{ 'flag--active': assetColorSync }" :aria-pressed="assetColorSync" :title="assetColorSync ? 'Outline follows Fill - ON' : 'Outline follows Fill - OFF'" @click="assetColorSync = !assetColorSync">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      </div>
      <div class="form__row">
        <label>Outline Color</label>
        <div class="form__row">
          <ColorInput v-model="dimFields.defaultStrokeColor" allow-transparent placeholder="#RRGGBB (empty = auto from fill)" aria-label="Asset outline color" @commit="commitField('defaultStrokeColor')" />
          <button type="button" @click="clearAssetStrokeColor">Reset</button>
        </div>
      </div>
    </div>
    <div class="originpanel__section">
      <div class="originpanel__title">Behavior</div>
      <div class="form__row">
        <label>Portal</label>
        <button :class="{ 'flag--success': portal, 'flag--danger': !portal }" :disabled="isNpcDeployed" @click="portal = !portal" :title="isNpcDeployed ? 'Exit NPC preview to change Portal setting' : portal ? 'NPCs can travel to another floor through this object' : 'NPCs cannot use this object for cross-floor travel'">
          {{ portal ? "ON" : "OFF" }}
        </button>
      </div>
      <div class="form__hint">Portal objects let NPCs travel between floors (e.g. elevators, stairs).</div>
    </div>
  </div>
</template>

<style scoped>
.originpanel__section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  padding: var(--gap-sm);
}

.originpanel__title {
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-dim);
}
</style>
