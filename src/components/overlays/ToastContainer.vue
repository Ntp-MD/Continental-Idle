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
  <div class="toast-container" aria-live="polite">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="`toast--${t.type}`"
    >
      <span class="toast__icon">{{ icons[t.type] }}</span>
      <span class="toast__msg">{{ t.message }}</span>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 3000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
  max-width: 380px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: toastIn 0.3s ease-out;
  border-left: 3px solid;
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.toast__msg {
  flex: 1;
  line-height: 1.4;
}

.toast--success {
  background: rgba(22, 24, 32, 0.95);
  border-left-color: #3dd68c;
  color: #e8e8ec;
}
.toast--success .toast__icon {
  background: rgba(61, 214, 140, 0.15);
  color: #3dd68c;
}

.toast--warning {
  background: rgba(22, 24, 32, 0.95);
  border-left-color: #f59e0b;
  color: #e8e8ec;
}
.toast--warning .toast__icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.toast--error {
  background: rgba(22, 24, 32, 0.95);
  border-left-color: #ef4444;
  color: #e8e8ec;
}
.toast--error .toast__icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.toast--info {
  background: rgba(22, 24, 32, 0.95);
  border-left-color: #6a6a74;
  color: #e8e8ec;
}
.toast--info .toast__icon {
  background: rgba(106, 106, 116, 0.15);
  color: #a0a0a8;
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
