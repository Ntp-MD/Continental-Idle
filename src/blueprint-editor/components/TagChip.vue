<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
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

const variantClass = computed(() => {
  switch (props.variant) {
    case "focus":
      return "flag--success";
    case "restricted":
      return "flag--danger";
    default:
      return "";
  }
});
</script>

<template>
  <div class="chip" :class="variantClass">
    <span class="chip__label"
      ><slot>{{ label }}</slot></span
    >
    <button v-if="removable" type="button" class="chip__remove" aria-label="Remove tag" @click="emit('remove')">×</button>
  </div>
</template>

<style scoped>
.chip__label {
  min-width: 0;
}
</style>
