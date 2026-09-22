<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
import {
  createBlueprintStore,
  provideBlueprintStore,
  emptySeed,
  createPersistencePort,
  createWindowSyncPort,
} from '@/blueprint-editor/blueprintStore'

const BlueprintEditor = defineAsyncComponent(() => import('@/blueprint-editor/BlueprintEditor.vue'))
const UiShowcase = defineAsyncComponent(() => import('@/dev/UiShowcase.vue'))
const DesignExplore = defineAsyncComponent(() => import('@/dev/DesignExplore.vue'))

const bootError = ref('')
let store: ReturnType<typeof createBlueprintStore> | null = null
try {
  store = createBlueprintStore({
    persistence: createPersistencePort(),
    sync: createWindowSyncPort(),
    seed: emptySeed(),
  })
  provideBlueprintStore(store)
} catch (error) {
  bootError.value = error instanceof Error ? error.message : String(error)
}

const isShowcase = import.meta.env.DEV && new URLSearchParams(window.location.search).has('showcase')
const isDesign = import.meta.env.DEV && new URLSearchParams(window.location.search).has('design')
</script>

<template>
  <ErrorBoundary>
    <div v-if="bootError" class="editor--loading" role="alert">Failed to start the editor: {{ bootError }}</div>
    <DesignExplore v-else-if="isDesign" />
    <UiShowcase v-else-if="isShowcase" />
    <BlueprintEditor v-else-if="store" />
  </ErrorBoundary>
</template>

<style scoped>
.editor--loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap-md);
  text-align: center;
  background: var(--bg-primary);
  color: var(--text-secondary);
}
</style>
