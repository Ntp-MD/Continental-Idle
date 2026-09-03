<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const icons: Record<string, string> = {
  success: 'OK',
  warning: '!',
  error: 'x',
  info: 'i',
}

const classMap: Record<string, string> = {
  success: 'flag--success',
  warning: 'flag--warning',
  error: 'flag--danger',
  info: 'flag--active',
}
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

<style scoped>
.toasts {
  position: fixed;
  top: var(--gap-md);
  right: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  z-index: var(--z-layer-5);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  min-width: 165px;
  max-width: 90vw;
  padding: var(--gap-sm) var(--gap-md);
  background: color-mix(in srgb, var(--bg-primary) 95%, transparent);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: toastIn var(--duration-normal) var(--ease-out);
  border-left: 3px solid;
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-pill);
}

.toast__msg {
  flex: 1;
  line-height: 1.4;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(24px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
