<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { isHexColor } from "../types";

const props = withDefaults(
  defineProps<{
    modelValue: string | undefined;
    allowTransparent?: boolean;
    placeholder?: string;
    ariaLabel?: string;
  }>(),
  {
    allowTransparent: false,
    placeholder: "#RRGGBB",
    ariaLabel: "Color value",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | undefined): void;
  (e: "commit", value: string | undefined): void;
}>();

const draftValue = ref(props.modelValue);
const textValue = ref(props.modelValue ?? "");
const isEditing = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    if (isEditing.value) return;
    draftValue.value = v;
    textValue.value = v ?? "";
  },
);

const nativeValue = computed(() => toNative(draftValue.value));
const isTransparent = computed(() => draftValue.value === "transparent");
const swatchStyle = computed(() => {
  if (isTransparent.value) return { background: "transparent" };
  const c = draftValue.value;
  if (c && isHexColor(c)) return { background: c };
  return { background: "var(--bg-card)" };
});

function commitValue(value: string | undefined) {
  isEditing.value = false;
  draftValue.value = value;
  textValue.value = value ?? "";
  emit("update:modelValue", value);
  emit("commit", value);
}

function toNative(v: string | undefined): string {
  if (!v || v === "transparent") return "#000000";
  if (isHexColor(v)) {
    if (v.length === 4) return "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    if (v.length === 7) return v;
    if (v.length === 9) return v.slice(0, 7);
  }
  return "#000000";
}

function onNativeInput(e: Event) {
  isEditing.value = true;
  const val = (e.target as HTMLInputElement).value;
  draftValue.value = val;
  textValue.value = val;
  emit("update:modelValue", val);
}

function onNativeChange() {
  commitValue(draftValue.value);
}

function onTextChange() {
  const v = textValue.value.trim();
  if (!v) {
    commitValue(undefined);
    return;
  }
  if (v === "transparent" && props.allowTransparent) {
    commitValue("transparent");
    return;
  }
  if (isHexColor(v)) {
    commitValue(v);
    return;
  }
  textValue.value = draftValue.value ?? "";
}

function toggleTransparent() {
  commitValue(isTransparent.value ? undefined : "transparent");
}
</script>

<template>
  <div class="colorinput">
    <label class="colorinput__swatch" :style="swatchStyle" :title="isTransparent ? 'Transparent' : 'Pick color'">
      <input class="colorinput__native" type="color" :value="nativeValue" :aria-label="ariaLabel" @input="onNativeInput" @change="onNativeChange" />
      <span v-if="isTransparent" class="colorinput__slash" aria-hidden="true" />
    </label>
    <input class="input colorinput__text" type="text" v-model="textValue" :placeholder="placeholder" :aria-label="ariaLabel" @change="onTextChange" />
    <button v-if="allowTransparent" type="button" class="colorinput__transparent" :class="{ 'colorinput__transparent--active': isTransparent }" @click="toggleTransparent" title="Toggle transparent" aria-label="Toggle transparent">T</button>
  </div>
</template>

<style scoped>
.colorinput {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  width: 100%;
}

.colorinput__swatch {
  position: relative;
  flex-shrink: 0;
  width: var(--control-height);
  height: var(--control-height);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: pointer;
  overflow: hidden;
  background-image: linear-gradient(45deg, var(--bg-tertiary) 25%, transparent 25%), linear-gradient(-45deg, var(--bg-tertiary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--bg-tertiary) 75%), linear-gradient(-45deg, transparent 75%, var(--bg-tertiary) 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
}

.colorinput__swatch:hover {
  border-color: var(--accent-gold);
}

.colorinput__native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}

.colorinput__native::-webkit-color-swatch-wrapper {
  padding: 0;
}

.colorinput__native::-webkit-color-swatch {
  border: none;
}

.colorinput__text {
  flex: 1;
  min-width: 0;
}

.colorinput__slash {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent-red);
  transform: translateY(-50%) rotate(-45deg);
  transform-origin: center;
}

.colorinput__transparent {
  flex-shrink: 0;
  width: var(--control-height);
  height: var(--control-height);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.colorinput__transparent:hover {
  border-color: var(--accent-gold);
  color: var(--text-primary);
}

.colorinput__transparent--active {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
  background: color-mix(in srgb, var(--accent-gold) 12%, transparent);
}
</style>
