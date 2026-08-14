<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import { useFieldError } from "../composables/useFieldError";
import { useClipboardCopy } from "../composables/useClipboardCopy";
import type { ObjectData, AssetDef } from "../types";

const props = defineProps<{ object: ObjectData }>();
const store = useAssetsStore();
const { pending, run } = useAsyncAction();
const { confirm } = useConfirm();
const { errorFields, flashError } = useFieldError();
const { copyId } = useClipboardCopy();

const fields = ref({ x: 0, y: 0 });

const assetDef = computed<AssetDef | undefined>(() => store.assetMap().get(props.object.type));

watch(
  () => props.object,
  (obj) => {
    errorFields.value = {};
    fields.value = { x: obj.x, y: obj.y };
  },
  { immediate: true },
);

async function commitField(field: "x" | "y") {
  const patch: Partial<ObjectData> = { [field]: fields.value[field] } as Partial<ObjectData>;
  const ok = await store.updateObjectProps(patch);
  if (!ok) {
    flashError(field);
    (fields.value as unknown as Record<string, unknown>)[field] = (props.object as unknown as Record<string, unknown>)[field];
  }
}

async function rotate() {
  await store.rotateSelected();
}

async function remove() {
  const confirmed = await confirm({
    title: "Delete object",
    message: `Delete object "${props.object.id}"? This cannot be undone via UI (only Ctrl+Z).`,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    danger: true,
  });
  if (!confirmed) return;
  await store.deleteSelected();
}

async function doUnlink() {
  await store.unlinkObject(props.object.id);
  useToast().info("Object unlinked");
}

async function onSave() {
  await run(() => store.saveLayout());
  useToast().success("Properties saved");
}
</script>

<template>
  <div class="properties__content">
    <div class="properties__section">
      <div class="properties__title">Object</div>
      <div class="properties__row">
        <label>ID</label>
        <div class="properties__idrow">
          <input type="text" :value="object.id" disabled class="input input--readonly" title="Object ID" />
          <button @click="copyId(object.id)">Copy</button>
        </div>
      </div>
      <div class="properties__row">
        <label>X</label>
        <input class="input" type="number" v-model.number="fields.x" :class="{ 'input--error': errorFields.x }" @change="commitField('x')" />
      </div>
      <div class="properties__row">
        <label>Y</label>
        <input class="input" type="number" v-model.number="fields.y" :class="{ 'input--error': errorFields.y }" @change="commitField('y')" />
      </div>
      <div class="properties__row">
        <label>Rotation</label>
        <div class="properties__row-inline">
          <span class="properties__value">{{ object.rotation }}°</span>
          <button @click="rotate" title="Rotate 90° (R)">↻ Rotate</button>
        </div>
      </div>
    </div>

    <div class="properties__section">
      <div class="properties__title">Origin Asset</div>
      <div class="properties__row">
        <label>Name</label>
        <span class="properties__value">{{ assetDef?.name ?? object.type }}</span>
      </div>
      <div class="properties__row">
        <label>Placed Label</label>
        <span class="properties__value">{{ assetDef?.defaultLabel ?? assetDef?.name ?? "—" }}</span>
      </div>
      <div class="properties__row">
        <label>Size</label>
        <span class="properties__value">{{ object.w }}×{{ object.h }}</span>
      </div>
      <div class="properties__row">
        <label>Bg Color</label>
        <span class="properties__value">{{ assetDef?.defaultBgColor ?? "—" }}</span>
      </div>
      <div class="properties__row">
        <label>Label Color</label>
        <span class="properties__value">{{ assetDef?.defaultLabelColor ?? "—" }}</span>
      </div>
      <div class="properties__row">
        <label>Walkthrough</label>
        <span class="properties__value">{{ assetDef?.walkable ?? true }}</span>
      </div>
      <div class="properties__row">
        <label>Entrance</label>
        <span class="properties__value">{{ assetDef?.entranceRequired ?? false }}</span>
      </div>
      <div class="properties__hint">Edit these in the Asset Properties panel.</div>
    </div>

    <div class="properties__btngroup">
      <button v-if="object.linkGroupId" @click="doUnlink">Unlink</button>
    </div>
    <div class="properties__actions">
      <button class="btn--success" :disabled="pending" @click="onSave">Save</button>
      <button
        :disabled="pending"
        @click="
          store.select(null);
          store.selectAsset(null);
        "
      >
        Deselect
      </button>
      <button class="btn--danger" :disabled="pending" @click="remove">Delete</button>
    </div>
  </div>
</template>
