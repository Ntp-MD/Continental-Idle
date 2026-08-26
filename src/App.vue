<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import ErrorBoundary from "@/components/overlays/ErrorBoundary.vue";

const BlueprintEditor = defineAsyncComponent(() => import("@/blueprint-editor/BlueprintEditor.vue"));
</script>

<template>
  <ErrorBoundary>
    <BlueprintEditor />
  </ErrorBoundary>
</template>
