<script setup lang="ts">
import { provide } from 'vue'
import Toolbar from './components/toolbar.vue'
import AssetPalette from './components/assetPalette.vue'
import EditorCanvas from './components/editorCanvas.vue'
import PropertiesPanel from './components/propertiesPanel.vue'
import ToastContainer from './components/toastContainer.vue'
import { useAssetsStore } from './blueprintStore'
import { useNpcSimulation } from './composables/useNpcSimulation'
import { getDefaultNpcConfig } from './store/npc'

const emit = defineEmits<{ close: [] }>()

function onClose() {
  emit('close')
}

const store = useAssetsStore()

const npcSimulation = useNpcSimulation(
  () => store.state.layout.npcConfig ?? getDefaultNpcConfig(),
  () => store.currentFloor.value,
  () => ({ w: store.state.layout.canvas.width, h: store.state.layout.canvas.height }),
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
  width: 100%;
  height: 100vh;
  background: var(--bg-primary);
  overflow: hidden;
}

.editor__app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.editor__back_btn {
  position: absolute;
  top: var(--gap-sm);
  left: var(--gap-sm);
  z-index: 1001;
  padding: var(--gap-xs) var(--gap-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.editor__back_btn:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}
</style>
