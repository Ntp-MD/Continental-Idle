<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder: string
  label: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="form__search">
    <input
      :value="props.modelValue"
      class="size--fill"
      type="search"
      :placeholder="placeholder"
      :aria-label="label"
      @input="onInput"
    />
    <button v-if="modelValue" type="button" class="flag--ghost" aria-label="Clear search" title="Clear search" @click="clear">
      x
    </button>
    <slot />
  </div>
</template>
