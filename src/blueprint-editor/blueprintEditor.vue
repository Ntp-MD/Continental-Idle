<script setup lang="ts">
import { provide } from 'vue'
import Toolbar from './components/toolbar.vue'
import AssetPalette from './components/assetPalette.vue'
import EditorCanvas from './components/editorCanvas.vue'
import PropertiesPanel from './components/propertiesPanel.vue'
import ToastContainer from './components/toastContainer.vue'
import { useAssetsStore } from './blueprintStore'
import { useNpcSimulation } from './composables/useNpcSimulation'
import { getDefaultNpcConfig } from './store/npcDefault'

const emit = defineEmits<{ close: [] }>()

function onClose() {
  emit('close')
}

const store = useAssetsStore()

const npcSimulation = useNpcSimulation(
  () => store.state.layout.npcConfig ?? getDefaultNpcConfig(),
  () => store.currentFloor.value,
  () => ({ w: store.state.layout.canvas.width, h: store.state.layout.canvas.height, tileSize: store.state.layout.canvas.tileSize }),
  (id: string) => store.state.layout.floors.find(f => f.id === id),
  (id: string) => store.assetMap().get(id)?.tags,
)

provide('npcSimulation', npcSimulation)
</script>

<template>
  <div class="editor__app">
    <Toolbar @close="onClose" />
    <div class="editor__app__main">
      <AssetPalette />
      <EditorCanvas />
      <PropertiesPanel />
    </div>
    <ToastContainer />
  </div>
</template>

<style scoped>
.editor__app {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

.editor__app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
