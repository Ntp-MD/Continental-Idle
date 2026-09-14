<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'

const BlueprintEditor = defineAsyncComponent(() => import('@/blueprint-editor/BlueprintEditor.vue'))
const UiShowcase = defineAsyncComponent(() => import('@/dev/UiShowcase.vue'))

const isShowcase = new URLSearchParams(window.location.search).has('showcase')
</script>

<template>
  <ErrorBoundary>
    <UiShowcase v-if="isShowcase" />
    <BlueprintEditor v-else />
  </ErrorBoundary>
</template>
