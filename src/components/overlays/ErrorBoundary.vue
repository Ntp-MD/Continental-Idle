<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { gameState } from '@/engine/game-state'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err: unknown) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  return false
})

function doResetSave() {
  gameState.deleteSave()
  location.reload()
}

function doReload() {
  location.reload()
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary__card">
      <h2 class="error-boundary__title">Something went wrong</h2>
      <p class="error-boundary__message">{{ errorMessage }}</p>
      <p class="error-boundary__hint">Try reloading first. If the error persists, your save data may be corrupted.</p>
      <div class="error-boundary__actions">
        <button class="error-boundary__btn" @click="doReload">Reload Page</button>
        <button class="error-boundary__btn error-boundary__btn--danger" @click="doResetSave">Delete Save & Reset</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>
