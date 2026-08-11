<script setup lang="ts">
import ErrorBoundary from "@/components/overlays/ErrorBoundary.vue";
</script>

<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
</template>
