<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { gameState } from '@/engine/gameState'

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
  <div v-if="hasError" class="error_boundary">
    <div class="error_boundary__card">
      <h2 class="error_boundary__title">Something went wrong</h2>
      <p class="error_boundary__message">{{ errorMessage }}</p>
      <p class="error_boundary__hint">Try reloading first. If the error persists, your save data may be corrupted.</p>
      <div class="error_boundary__actions">
        <button class="error_boundary__btn" @click="doReload">Reload Page</button>
        <button class="error_boundary__btn error_boundary__btn__danger" @click="doResetSave">Delete Save & Reset</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>
