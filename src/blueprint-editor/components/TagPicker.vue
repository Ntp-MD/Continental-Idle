<script setup lang="ts">
import { ref, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    placeholder?: string;
    label?: string;
  }>(),
  {
    placeholder: "Add tag...",
    label: "Tags",
  },
);

const emit = defineEmits<{ (e: "update:modelValue", tags: string[]): void }>();

const store = useAssetsStore();
const inputValue = ref("");
const showDropdown = ref(false);

const availableTags = computed(() => store.globalTags.value);

const filteredTags = computed(() => {
  const q = inputValue.value.trim().toLowerCase();
  if (!q) return availableTags.value.filter((t) => !props.modelValue.includes(t));
  return availableTags.value.filter((t) => !props.modelValue.includes(t) && t.toLowerCase().includes(q));
});

async function addTag(raw: string) {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const next = new Set([...props.modelValue]);
  const added: string[] = [];
  for (const t of parts) {
    if (next.has(t)) continue;
    next.add(t);
    added.push(t);
  }
  if (added.length === 0) {
    inputValue.value = "";
    return;
  }
  emit("update:modelValue", [...next]);
  for (const t of added) await store.ensureTag(t);
  inputValue.value = "";
}

function removeTag(tag: string) {
  emit(
    "update:modelValue",
    props.modelValue.filter((t) => t !== tag),
  );
}

async function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    if (inputValue.value.trim()) await addTag(inputValue.value);
  } else if (e.key === "Backspace" && !inputValue.value && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1]);
  }
}

async function onDropdownClick(tag: string) {
  await addTag(tag);
  showDropdown.value = false;
}
</script>

<template>
  <div class="tag__picker">
    <div class="tag__picker-field" @click="showDropdown = true">
      <span v-for="tag in modelValue" :key="tag" class="tag__picker-chip">
        {{ tag }}
        <button class="tag__picker-chipbtn" @click.stop="removeTag(tag)">×</button>
      </span>
      <input v-model="inputValue" :placeholder="modelValue.length === 0 ? placeholder : ''" class="tag__picker-input" @keydown="onKeydown" @focus="showDropdown = true" @blur="showDropdown = false" />
    </div>
    <div v-if="showDropdown && filteredTags.length > 0" class="tag__picker-dropdown">
      <button v-for="tag in filteredTags" :key="tag" class="tag__picker-option" @mousedown.prevent="onDropdownClick(tag)">{{ tag }}</button>
    </div>
  </div>
</template>

<style scoped>
.tag__picker {
  position: relative;
  width: 100%;
}

.tag__picker-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-xs);
  min-height: 30px;
  padding: var(--gap-xs) var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: text;
}

.tag__picker-field:focus-within {
  border-color: var(--accent-gold);
}

.tag__picker-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-xs) var(--gap-xs) var(--gap-xs);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-xs);
  font-size: var(--font-xs);
  color: var(--text-primary);
  white-space: nowrap;
}

.tag__picker-chipbtn {
  background: transparent;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: var(--font-sm);
  line-height: 1;
  padding: 0;
}

.tag__picker-input {
  flex: 1;
  min-width: 60px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--font-sm);
  padding: var(--gap-xs) 0;
}

.tag__picker-input::placeholder {
  color: var(--text-primary);
  opacity: 0.6;
}

.tag__picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-canvas-ui);
  max-height: 160px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--bg-primary) 30%, transparent);
}

.tag__picker-option {
  display: block;
  width: 100%;
  padding: var(--gap-xs) var(--gap-sm);
  background: transparent;
  border: none;
  text-align: left;
  color: var(--text-primary);
  font-size: var(--font-sm);
  cursor: pointer;
}

.tag__picker-option:hover {
  background: var(--bg-card);
}
</style>
