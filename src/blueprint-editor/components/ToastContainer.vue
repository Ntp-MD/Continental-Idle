<script setup lang="ts">
import { useToast } from "@/composables/useToast";

const { toasts } = useToast();

const icons: Record<string, string> = {
  success: "OK",
  warning: "!",
  error: "x",
  info: "i",
};

const classMap: Record<string, string> = {
  success: "flag--success",
  warning: "flag--warning",
  error: "flag--danger",
  info: "flag--active",
};
</script>

<template>
  <Teleport to="body">
    <div class="toasts" aria-live="polite">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="classMap[t.type]">
        <span class="toast__icon">{{ icons[t.type] }}</span>
        <span class="toast__msg">{{ t.message }}</span>
      </div>
    </div>
  </Teleport>
</template>
