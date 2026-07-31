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


<style scoped>

.toast__container {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  z-index: 3000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  min-width: 240px;
  max-width: 380px;
  padding: var(--gap-sm) var(--gap-md);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: 500;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--bg-primary) 50%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: toastIn var(--duration-fast) ease-out;
  border-left: 3px solid;
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs);
  font-weight: 700;
}

.toast__msg {
  flex: 1;
  line-height: 1.4;
}

.toast__success {
  background: color-mix(in srgb, var(--bg-card) 95%, transparent);
  border-left-color: var(--accent-green);
  color: var(--text-primary);
}
.toast__success .toast__icon {
  background: color-mix(in srgb, var(--accent-green) 15%, transparent);
  color: var(--accent-green);
}

.toast__warning {
  background: color-mix(in srgb, var(--bg-card) 95%, transparent);
  border-left-color: var(--accent-gold);
  color: var(--text-primary);
}
.toast__warning .toast__icon {
  background: color-mix(in srgb, var(--accent-gold) 15%, transparent);
  color: var(--accent-gold);
}

.toast__error {
  background: color-mix(in srgb, var(--bg-card) 95%, transparent);
  border-left-color: var(--accent-red);
  color: var(--text-primary);
}
.toast__error .toast__icon {
  background: color-mix(in srgb, var(--accent-red) 15%, transparent);
  color: var(--accent-red);
}

.toast__info {
  background: color-mix(in srgb, var(--bg-card) 95%, transparent);
  border-left-color: var(--text-primary);
  color: var(--text-primary);
}
.toast__info .toast__icon {
  background: color-mix(in srgb, var(--text-primary) 15%, transparent);
  color: var(--text-primary);
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