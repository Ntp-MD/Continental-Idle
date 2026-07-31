<script setup lang="ts">
import ErrorBoundary from '@/components/overlays/errorBoundary.vue'
</script>

<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
</template>
