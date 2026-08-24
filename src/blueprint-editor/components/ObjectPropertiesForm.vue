<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import { useFieldError } from "../composables/useFieldError";
import { useClipboardCopy } from "../composables/useClipboardCopy";
import type { ObjectData, AssetDef } from "../types";
import ColorInput from "./ColorInput.vue";

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

async function commitColor(field: "fillColor" | "strokeColor", value: string | undefined) {
  const ok = await store.updateObjectProps({ [field]: value ?? "" } as Partial<ObjectData>);
  if (!ok) flashError(field);
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
  <div class="form__group">
    <div class="form__group">
      <h3>Object</h3>
      <div class="form__row">
        <label>ID</label>
        <div class="form__row">
          <input type="text" :value="object.id" disabled class="input--disabled" title="Object ID" />
          <button @click="copyId(object.id)">Copy</button>
        </div>
      </div>
      <div class="form__row">
        <label>X</label>
        <input type="number" v-model.number="fields.x" :class="{ 'input--danger': errorFields.x }" @change="commitField('x')" />
      </div>
      <div class="form__row">
        <label>Y</label>
        <input type="number" v-model.number="fields.y" :class="{ 'input--danger': errorFields.y }" @change="commitField('y')" />
      </div>
      <div class="form__row">
        <label>Rotation</label>
        <div class="form__row">
          <span>{{ object.rotation }}°</span>
          <button @click="rotate" title="Rotate 90° (R)">↻ Rotate</button>
        </div>
      </div>
    </div>

    <div class="form__group">
      <h3>Origin Asset</h3>
      <div class="form__row">
        <label>Name</label>
        <span>{{ assetDef?.name ?? object.type }}</span>
      </div>
      <div class="form__row">
        <label>Placed Label</label>
        <span>{{ assetDef?.defaultLabel ?? assetDef?.name ?? "—" }}</span>
      </div>
      <div class="form__row">
        <label>Size</label>
        <span>{{ object.w }}×{{ object.h }}</span>
      </div>
      <div class="form__row">
        <label>Fill Color</label>
        <ColorInput :model-value="props.object.fillColor ?? ''" allow-transparent placeholder="asset default" aria-label="Object fill color override" @commit="(v) => commitColor('fillColor', v)" />
        <span class="form__hint">empty = asset default</span>
      </div>
      <div class="form__row">
        <label>Stroke Color</label>
        <ColorInput :model-value="props.object.strokeColor ?? ''" allow-transparent placeholder="theme outline" aria-label="Object stroke color override" @commit="(v) => commitColor('strokeColor', v)" />
        <span class="form__hint">overrides SVG outline</span>
      </div>
      <div class="form__row">
        <label>Bg Color</label>
        <span>{{ assetDef?.defaultBgColor ?? "—" }}</span>
      </div>
      <div class="form__row">
        <label>Label Color</label>
        <span>{{ assetDef?.defaultLabelColor ?? "—" }}</span>
      </div>
      <div class="form__row">
        <label>Walkthrough</label>
        <span>{{ assetDef?.walkable ?? true }}</span>
      </div>
      <div class="form__row">
        <label>Entrance</label>
        <span>{{ assetDef?.entranceRequired ?? false }}</span>
      </div>
      <div>Edit these in the Asset Properties panel.</div>
    </div>

    <div class="form__row">
      <button v-if="object.linkGroupId" @click="doUnlink">Unlink</button>
    </div>
    <div class="form__row">
      <button class="flag--success" :disabled="pending" @click="onSave">Save</button>
      <button
        :disabled="pending"
        @click="
          store.select(null);
          store.selectAsset(null);
        "
      >
        Deselect
      </button>
      <button class="flag--danger" :disabled="pending" @click="remove">Delete</button>
    </div>
  </div>
</template>
