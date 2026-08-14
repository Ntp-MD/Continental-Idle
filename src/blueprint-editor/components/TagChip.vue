<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    variant?: "default" | "focus" | "restricted";
    removable?: boolean;
  }>(),
  {
    label: "",
    variant: "default",
    removable: false,
  },
);

const emit = defineEmits<{ remove: [] }>();
</script>

<template>
  <div class="tagchip" :class="{ [`tagchip--${variant}`]: variant !== 'default' }">
    <span class="tagchip__label"
      ><slot>{{ label }}</slot></span
    >
    <button v-if="removable" type="button" class="tagchip__remove" aria-label="Remove tag" @click="emit('remove')">×</button>
  </div>
</template>

<style scoped>
.tagchip {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-sm);
  padding: var(--gap-xs) var(--gap-sm);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.tagchip--focus {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.tagchip--restricted {
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.tagchip--default {
  border-color: var(--border-dim);
}

.tagchip__label {
  min-width: 0;
}

.tagchip__remove {
  padding: 0;
  border: 0;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  line-height: 1;
}

.tagchip__remove:hover {
  border: 0;
  background: transparent;
  color: currentColor;
  box-shadow: none;
  transform: none;
}
</style>
