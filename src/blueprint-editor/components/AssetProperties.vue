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
import TagPicker from "./TagPicker.vue";
import OriginSettingModal from "./OriginSettingModal.vue";
import { managedTagSet } from "../store/tags";

const props = defineProps<{ asset: AssetDef }>();
const store = useAssetsStore();
const confirm = useConfirm().confirm;
const { pending, run } = useAsyncAction();
const { showWalkableGridPanel, openWalkableGridPanel, closeWalkableGridPanel } = useWalkableGridPanel();
const { copyId } = useClipboardCopy();

const assetFields = ref<{ name: string; defaultLabel: string }>({
  name: "",
  defaultLabel: "",
});
const assetTags = ref<string[]>([]);
const showOriginSetting = ref(false);
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
    closeWalkableGridPanel();
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
  <div class="form__group">
    <div v-if="isSvgAsset" class="form__col">
      <label>Preview</label>
      <div class="preview__svg">
        <svg ref="previewSvgEl" :viewBox="previewSvgViewBox" width="80" height="80" preserveAspectRatio="xMidYMid meet" class="preview__svg"></svg>
      </div>
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

    <div v-if="isLinkedAsset" class="alert flag--active">
      <span>Linked set — {{ linkedPartCount }} objects. Drag to place all parts linked together.</span>
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
    <div v-if="orphanAssetTags.length" class="alert flag--warning">Undefined tags: {{ orphanAssetTags.join(", ") }}. Recreate the tag definition or remove these assignments.</div>
    <div v-if="isSvgAsset" class="form__row">
      <label>Rotate</label>
      <button @click="onRotateAsset">↻ 90°</button>
    </div>
    <div v-if="!isLinkedAsset" class="form__row">
      <label>Origin Setting</label>
      <button class="flag--warning" @click="showOriginSetting = true">Manage</button>
    </div>
    <div v-if="!isLinkedAsset" class="form__row">
      <label>Walkable Grid</label>
      <button class="flag--warning" @click="showWalkableGridPanel ? closeWalkableGridPanel() : openWalkableGridPanel()">
        {{ showWalkableGridPanel ? "Close" : "Manage" }}
      </button>
    </div>

    <div v-if="collapsedCount > 0" class="alert flag--danger">
      <span>{{ collapsedCount }} object(s) collapsed — overlapping! Shown in red on canvas.</span>
    </div>
    <div class="form__row">
      <button class="flag--success" :disabled="pending" @click="onSave">Save</button>
      <button class="flag--warning" :disabled="pending" @click="duplicateAsset">Duplicate</button>
      <button class="flag--danger" :disabled="pending" @click="deleteAsset">Delete</button>
    </div>
  </div>

  <OriginSettingModal :open="showOriginSetting" :asset="asset" @close="showOriginSetting = false" />
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
</style>
