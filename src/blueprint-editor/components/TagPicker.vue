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
  <div class="picker">
    <div class="picker__field" @click="showDropdown = true">
      <span v-for="tag in modelValue" :key="tag" class="chip flag--success">
        {{ tag }}
        <button class="chip__remove" @click.stop="removeTag(tag)">x</button>
      </span>
      <input v-model="inputValue" :placeholder="modelValue.length === 0 ? placeholder : ''" class="picker__input" @keydown="onKeydown" @focus="showDropdown = true" @blur="showDropdown = false" />
    </div>
    <div v-if="showDropdown && filteredTags.length > 0" class="picker__dropdown">
      <button v-for="tag in filteredTags" :key="tag" class="picker__option" @mousedown.prevent="onDropdownClick(tag)">{{ tag }}</button>
    </div>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
  width: 100%;
}

.picker__field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-xs);
  padding: 0 var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  cursor: text;
}

.picker__field:focus-within {
  border-color: var(--accent-primary);
}

.picker__input {
  flex: 1;
  font-size: var(--font-sm);
  background: transparent;
  border: none;
  outline: none;
}

.picker__input:focus {
  border: none;
}

.picker__input::placeholder {
  color: var(--text-primary);
  opacity: 0.6;
}

.picker__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-layer-2);
  max-height: 40vh;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.picker__option {
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

.picker__option:hover {
  background: var(--bg-primary);
}
</style>
