<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import type { AssetDef } from "../types";
import { isHexColor, isValidColor } from "../types";
import ModalShell from "./ModalShell.vue";
import ColorInput from "./ColorInput.vue";

const props = defineProps<{ open: boolean; asset: AssetDef }>();
const emit = defineEmits<{ (e: "close"): void }>();
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
  defaultBgColor: string | undefined;
  defaultLabelColor: string | undefined;
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
  defaultBgColor: "",
  defaultLabelColor: "",
});
const assetRxSync = ref(true);
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
      defaultBgColor: a.defaultBgColor,
      defaultLabelColor: a.defaultLabelColor,
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

async function commitField(field: "w" | "h" | "pxW" | "pxH" | "usePx" | "defaultPadding" | "defaultRadius" | "defaultLabelPadding" | "defaultBgColor" | "defaultLabelColor") {
  if ((SIZE_FIELDS as readonly string[]).includes(field) && sizeLocked.value) {
    useToast().warning("Cannot resize — asset is placed on floors. Remove instances first.");
    revertSizeField(field as "w" | "h" | "pxW" | "pxH");
    return;
  }
  const val = dimFields.value[field];
  if (field === "defaultBgColor" && typeof val === "string" && val && !isValidColor(val)) {
    useToast().warning("Background color must be a hex code or 'transparent'");
    return;
  }
  if (field === "defaultLabelColor" && typeof val === "string" && val && !isHexColor(val)) {
    useToast().warning("Label color must be a hex code");
    return;
  }
  await store.updateAsset(props.asset.id, { [field]: val } as Partial<AssetDef>);
}

async function toggleUsePx() {
  if (sizeLocked.value) {
    useToast().warning("Cannot change unit mode — asset is placed on floors. Remove instances first.");
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

async function clearAssetBgColor() {
  dimFields.value.defaultBgColor = undefined;
  await store.updateAsset(props.asset.id, { defaultBgColor: undefined });
}

async function clearAssetLabelColor() {
  dimFields.value.defaultLabelColor = undefined;
  await store.updateAsset(props.asset.id, { defaultLabelColor: undefined });
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

function onClose() {
  emit("close");
}
</script>

<template>
  <ModalShell :open="open" title="Origin Setting" max-width="500px" width="90vw" max-height="85vh" @close="onClose">
    <div class="modal__body">
      <template v-if="!isLinkedAsset">
        <div v-if="sizeLocked" class="card">
          <span>⊘</span>
          <span>Size is locked — asset is placed on floors. Remove all instances to resize.</span>
        </div>
        <div v-if="!isSvgAsset" class="form__row">
          <label>Unit Mode</label>
          <div class="form__row form__row--tight">
            <button :class="{ 'flag--warning': !dimFields.usePx }" :disabled="sizeLocked" @click="dimFields.usePx ? toggleUsePx() : null">Tiles</button>
            <button :class="{ 'flag--warning': dimFields.usePx }" :disabled="sizeLocked" @click="!dimFields.usePx ? toggleUsePx() : null">Pixels</button>
          </div>
        </div>
        <template v-if="!dimFields.usePx">
          <div class="form__row">
            <label>Width</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.w" @change="commitField('w')" />
          </div>
          <div class="form__row">
            <label>Height</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.h" @change="commitField('h')" />
          </div>
        </template>
        <template v-else>
          <div class="form__row">
            <label>Width (px)</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.pxW" @change="commitField('pxW')" />
          </div>
          <div class="form__row">
            <label>Height (px)</label>
            <input type="number" min="1" :disabled="sizeLocked" v-model.number="dimFields.pxH" @change="commitField('pxH')" />
          </div>
        </template>
      </template>
      <div class="form__row">
        <label>Default Padding</label>
        <input type="number" min="0" v-model.number="dimFields.defaultPadding" @change="commitField('defaultPadding')" />
      </div>
      <div class="form__row">
        <label>Label Radius</label>
        <input type="number" min="0" v-model.number="dimFields.defaultRadius" @change="commitField('defaultRadius')" />
      </div>
      <div class="form__row">
        <label>Label Padding</label>
        <input type="number" min="0" v-model.number="dimFields.defaultLabelPadding" @change="commitField('defaultLabelPadding')" />
      </div>
      <div class="form__row">
        <label>Bg Color</label>
        <div class="form__row">
          <ColorInput v-model="dimFields.defaultBgColor" :allow-transparent="true" placeholder="#RRGGBB or transparent" aria-label="Asset background color" @commit="commitField('defaultBgColor')" />
          <button type="button" @click="clearAssetBgColor">Reset</button>
        </div>
      </div>
      <div class="form__row">
        <label>Label Color</label>
        <div class="form__row">
          <ColorInput v-model="dimFields.defaultLabelColor" placeholder="#RRGGBB" aria-label="Asset label color" @commit="commitField('defaultLabelColor')" />
          <button type="button" @click="clearAssetLabelColor">Reset</button>
        </div>
      </div>
      <div class="form__row">
        <label>Portal</label>
        <button :class="{ 'flag--success': portal, 'flag--danger': !portal }" :disabled="isNpcDeployed" @click="portal = !portal" :title="isNpcDeployed ? 'Exit NPC preview to change Portal setting' : portal ? 'NPCs can travel to another floor through this object' : 'NPCs cannot use this object for cross-floor travel'">
          {{ portal ? "ON" : "OFF" }}
        </button>
      </div>
      <template v-if="!isLinkedAsset">
        <div class="form__row">
          <label>Corner Radius</label>
          <div class="form__row form__row--tight">
            <label class="form__row form__row--tight">
              <span>↖ TL</span>
              <input type="number" min="0" v-model.number="dimFields.rxTL" @input="onRxInput('rxTL')" class="input--num input--compact" />
            </label>
            <label class="form__row form__row--tight">
              <span>TR ↗</span>
              <input type="number" min="0" v-model.number="dimFields.rxTR" @input="onRxInput('rxTR')" class="input--num input--compact" />
            </label>
            <label class="form__row form__row--tight">
              <span>↙ BL</span>
              <input type="number" min="0" v-model.number="dimFields.rxBL" @input="onRxInput('rxBL')" class="input--num input--compact" />
            </label>
            <label class="form__row form__row--tight">
              <span>BR ↘</span>
              <input type="number" min="0" v-model.number="dimFields.rxBR" @input="onRxInput('rxBR')" class="input--num input--compact" />
            </label>
            <button type="button" class="flag--icon" :aria-pressed="assetRxSync" :title="assetRxSync ? 'Sync all corners — ON' : 'Sync all corners — OFF'" @click="assetRxSync = !assetRxSync">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </ModalShell>
</template>

<style scoped></style>
