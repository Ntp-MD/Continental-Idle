<script setup lang="ts">
import { provide, onMounted, ref } from "vue";
import Toolbar from "./components/Toolbar.vue";
import AssetPalette from "./components/AssetPalette.vue";
import EditorCanvas from "./components/EditorCanvas.vue";
import PropertiesPanel from "./components/PropertiesPanel.vue";
import ToastContainer from "./components/toastContainer.vue";
import ConfirmDialog from "@/components/overlays/confirmDialog.vue";
import { useAssetsStore } from "./blueprintStore";
import { useNpcSimulation } from "./composables/useNpcSimulation";
import { reloadEditorData } from "./store/state";

const emit = defineEmits<{ close: [] }>();

function onClose() {
  emit("close");
}

const store = useAssetsStore();
const ready = ref(false);

onMounted(async () => {
  await reloadEditorData();
  ready.value = true;
});

const npcSimulation = useNpcSimulation(
  () => store.state.layout.npcConfig,
  () => store.currentFloor.value,
  () => ({ w: store.state.layout.canvas.width, h: store.state.layout.canvas.height, tileSize: store.state.layout.canvas.tileSize }),
  (id: string) => store.state.layout.floors.find((f) => f.id === id),
  () => store.state.layout.floors,
  (id: string) => store.assetMap().get(id)?.tags,
  (id: string) => store.assetMap().get(id),
);

provide("npcSimulation", npcSimulation);
</script>

<template>
  <div class="editor__app">
    <template v-if="ready">
      <Toolbar @close="onClose" />
      <div class="editor__app__main">
        <AssetPalette />
        <EditorCanvas />
        <PropertiesPanel />
      </div>
      <ToastContainer />
      <ConfirmDialog />
    </template>
    <div v-else class="editor__loading">Loading editor…</div>
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

.editor__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
  font-size: var(--font-md);
}

.editor__app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
