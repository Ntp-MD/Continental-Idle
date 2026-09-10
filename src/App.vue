<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'

const BlueprintEditor = defineAsyncComponent(() => import('@/blueprint-editor/BlueprintEditor.vue'))
const UiShowcase = defineAsyncComponent(() => import('@/dev/UiShowcase.vue'))
const ModCLI = defineAsyncComponent(() => import('../mod-cli/src/ModCLI.vue'))

const isShowcase = new URLSearchParams(window.location.search).has('showcase')
const isModCli = new URLSearchParams(window.location.search).has('modcli')
</script>

<template>
  <ErrorBoundary>
    <UiShowcase v-if="isShowcase" />
    <ModCLI v-else-if="isModCli" />
    <BlueprintEditor v-else />
  </ErrorBoundary>
</template>
