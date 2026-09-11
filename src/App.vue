<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ErrorBoundary from '@/components/overlays/ErrorBoundary.vue'
import { getModCliProvider, isModCliRoute, MOD_CLI_DEFAULT_PROVIDER } from '../mod-cli/src/modCliViteAdapter'

const BlueprintEditor = defineAsyncComponent(() => import('@/blueprint-editor/BlueprintEditor.vue'))
const UiShowcase = defineAsyncComponent(() => import('@/dev/UiShowcase.vue'))
const ModCLI = defineAsyncComponent(() => import('../mod-cli/src/ModCLI.vue'))

const isShowcase = new URLSearchParams(window.location.search).has('showcase')
const isModCli = isModCliRoute(window.location.pathname)
const modCliProvider = isModCli ? (getModCliProvider(window.location.pathname) ?? MOD_CLI_DEFAULT_PROVIDER) : MOD_CLI_DEFAULT_PROVIDER
</script>

<template>
  <ErrorBoundary>
    <UiShowcase v-if="isShowcase" />
    <ModCLI v-else-if="isModCli" :initial-provider="modCliProvider" />
    <BlueprintEditor v-else />
  </ErrorBoundary>
</template>
