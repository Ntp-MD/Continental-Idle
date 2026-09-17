<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
import {
  createBlueprintStore, provideBlueprintStore, emptySeed,
  createHttpPersistencePort, createWindowSyncPort,
} from '@/blueprint-editor/blueprintStore'

const BlueprintEditor = defineAsyncComponent(() => import('@/blueprint-editor/BlueprintEditor.vue'))
const UiShowcase = defineAsyncComponent(() => import('@/dev/UiShowcase.vue'))

const store = createBlueprintStore({
  persistence: createHttpPersistencePort(),
  sync: createWindowSyncPort(),
  seed: emptySeed(),
})
provideBlueprintStore(store)

const isShowcase = import.meta.env.DEV && new URLSearchParams(window.location.search).has('showcase')
</script>

<template>
  <ErrorBoundary>
    <UiShowcase v-if="isShowcase" />
    <BlueprintEditor v-else />
  </ErrorBoundary>
</template>
