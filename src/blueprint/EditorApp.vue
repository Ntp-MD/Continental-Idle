<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Toolbar from './components/Toolbar.vue'
import AssetPalette from './components/AssetPalette.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import ToastContainer from '@/components/overlays/ToastContainer.vue'
import { useEditorStore } from './editor-store'

const store = useEditorStore()

function flushOnUnload() {
  store.flushSave()
}

onMounted(() => {
  window.addEventListener('beforeunload', flushOnUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', flushOnUnload)
  store.flushSave()
})
</script>

<template>
  <div class="editor-app">
    <Toolbar />
    <div class="editor-app__main">
      <AssetPalette />
      <EditorCanvas />
      <PropertiesPanel />
    </div>
    <ToastContainer />
  </div>
</template>

<style scoped>
.editor-app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100vw;
  background: var(--bg-primary, #08090c);
  overflow: hidden;
}

.editor-app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
