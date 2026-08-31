<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";

const hasError = ref(false);
const errorMessage = ref("");

onErrorCaptured((err: unknown) => {
  hasError.value = true;
  errorMessage.value = err instanceof Error ? err.message : String(err);
  return false;
});

function doReload() {
  location.reload();
}
</script>

<template>
  <div v-if="hasError" class="errorboundary">
    <div class="errorboundary__card">
      <h2 class="errorboundary__title">Something went wrong</h2>
      <p class="errorboundary__message">{{ errorMessage }}</p>
      <p class="errorboundary__hint">Try reloading the page.</p>
      <div class="form__row">
        <button class="flag--ghost" @click="doReload">Reload Page</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.errorboundary {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  z-index: 9999;
}

.errorboundary__card {
  background: var(--bg-primary);
  border: 1px solid var(--accent-red);
  border-radius: var(--radius-lg);
  padding: var(--gap-xl);
  width: fit-content;
  max-width: 90vw;
  text-align: center;
}

.errorboundary__title {
  color: var(--accent-red);
  font-size: var(--font-xl);
  margin-bottom: var(--gap-sm);
}

.errorboundary__message {
  color: var(--text-secondary);
  font-size: var(--font-lg);
  margin-bottom: var(--gap-sm);
  word-break: break-word;
}

.errorboundary__hint {
  color: var(--text-dim);
  font-size: var(--font-md);
  margin-bottom: var(--gap-md);
}

.errorboundary .form__row button {
  padding: var(--gap-sm) var(--gap-md);
  font-size: var(--font-md);
}
</style>
