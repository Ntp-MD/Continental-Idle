<script setup lang="ts">
import { provide } from 'vue'
import { useRouter } from 'vue-router'
import Toolbar from './components/Toolbar.vue'
import AssetPalette from './components/AssetPalette.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useAssetsStore } from './blueprint-store'
import { useNpcSimulation } from './composables/useNpcSimulation'
import { getDefaultNpcConfig } from './store/npc'

const emit = defineEmits<{ close: [] }>()
const router = useRouter()

function onClose() {
  emit('close')
  router.push({ name: 'game' })
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: var(--bg-primary);
  overflow: hidden;
}

.editor__app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
