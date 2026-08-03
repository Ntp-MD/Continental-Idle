<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const icons: Record<string, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
}
</script>

<template>
  <div class="toast__container" aria-live="polite">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="`toast__${t.type}`"
    >
      <span class="toast__icon">{{ icons[t.type] }}</span>
      <span class="toast__msg">{{ t.message }}</span>
    </div>
  </div>
</template>
