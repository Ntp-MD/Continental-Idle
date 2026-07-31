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
  <div v-if="hasError" class="errorboundary">
    <div class="errorboundary__card">
      <h2 class="errorboundary__title">Something went wrong</h2>
      <p class="errorboundary__message">{{ errorMessage }}</p>
      <p class="errorboundary__hint">Try reloading first. If the error persists, your save data may be corrupted.</p>
      <div class="actions actions__center">
        <button class="btn btn__ghost" @click="doReload">Reload Page</button>
        <button class="btn btn__danger" @click="doResetSave">Delete Save & Reset</button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>
