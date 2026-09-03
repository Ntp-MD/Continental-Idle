<script setup lang="ts">
import { provide, onMounted, ref } from 'vue'
import Toolbar from './components/shell/Toolbar.vue'
import AssetToolbar from './components/canvas/AssetToolbar.vue'
import EditorCanvas from './components/canvas/EditorCanvas.vue'
import PropertiesPanel from './components/panels/PropertiesPanel.vue'
import ToastContainer from './components/shell/ToastContainer.vue'
import ConfirmDialog from '@/components/overlays/ConfirmDialog.vue'
import { useAssetsStore } from './blueprintStore'
import { useNpcSimulation } from './composables/useNpcSimulation'
import { resolveStreetTiles } from './domain/types'

const store = useAssetsStore()
const ready = ref(false)
const loadError = ref('')

onMounted(async () => {
  try {
    await store.reloadEditorData()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
    return
  }
  ready.value = true
})

const npcSimulation = useNpcSimulation({
  getConfig: () => store.state.layout.npcConfig,
  getFloor: () => store.currentFloor.value,
  getCanvas: () => ({
    w: store.state.layout.canvas.width,
    h: store.state.layout.canvas.height,
    tileSize: store.state.layout.canvas.tileSize,
    streetTiles: resolveStreetTiles(store.state.layout),
    streetFloorId: store.state.layout.streetFloorId,
  }),
  getFloorById: (id: string) => store.state.layout.floors.find((f) => f.id === id),
  getAllFloors: () => store.state.layout.floors,
  getAssetTags: (id: string) => store.assetMap().get(id)?.tags,
  getAssetDef: (id: string) => store.assetMap().get(id),
  getManagedTags: () => store.globalTags.value,
})

provide('npcSimulation', npcSimulation)
</script>

<template>
  <div class="editor__app">
    <template v-if="ready">
      <Toolbar />
      <div class="editor__main">
        <AssetToolbar />
        <EditorCanvas />
        <PropertiesPanel />
      </div>
      <ToastContainer />
      <ConfirmDialog />
    </template>
    <div v-else-if="loadError" class="editor--loading" role="alert">Failed to load editor: {{ loadError }}</div>
    <div v-else class="editor--loading" role="status">Loading editor...</div>
  </div>
</template>

<style scoped>
.editor__app {
  position: fixed;
  inset: 0;
  z-index: var(--z-layer-app);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

.editor--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
}

.editor__main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.editor__main > :first-child {
  border-right: 1px solid var(--border-dim);
}

.editor__main > :last-child {
  border-left: 1px solid var(--border-dim);
}
</style>
