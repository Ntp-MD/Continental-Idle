<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent, watch, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import WorldMap from "@/components/layout/WorldMap.vue";
import HotelCanvas from "@/components/HotelCanvas.vue";
import StartScreen from "@/components/overlays/StartScreen.vue";
import ToastContainer from "@/components/overlays/ToastContainer.vue";
import ErrorBoundary from "@/components/overlays/ErrorBoundary.vue";
import { useToast } from "@/composables/useToast";
import type { SyncedLayoutPayload } from "@/blueprint-editor/types";

const BlueprintEditor = defineAsyncComponent(() => import("@/blueprint-editor/BlueprintEditor.vue"));

const toast = useToast();
const route = useRoute();
const router = useRouter();

const showEditor = ref(route.name === "editor");
const showStart = ref(true);
const activeTab = ref<"hotel" | "worldmap">("hotel");
const syncedPayload = shallowRef<SyncedLayoutPayload | null>(null);

function openEditor() {
  showEditor.value = true;
  router.push({ name: "editor" });
}

function closeEditor() {
  showEditor.value = false;
  router.push({ name: "game" });
}

watch(
  () => route.name,
  (name) => {
    showEditor.value = name === "editor";
  },
);

function handleBlueprintSync(e: Event) {
  const detail = (e as CustomEvent).detail as SyncedLayoutPayload;
  if (detail && detail.floors) {
    syncedPayload.value = detail;
  }
  toast.success("Blueprint synced to game");
}

onMounted(() => {
  window.addEventListener("blueprint:sync", handleBlueprintSync);
});

onUnmounted(() => {
  window.removeEventListener("blueprint:sync", handleBlueprintSync);
});
</script>

<template>
  <BlueprintEditor v-if="route.name === 'editor'" @close="closeEditor" />
  <ErrorBoundary v-else>
    <StartScreen v-if="showStart" @start="showStart = false" />
    <div class="game__layout" v-else>
      <div class="game__tabs">
        <button class="game__tab" :class="{ 'game__tab--active': activeTab === 'hotel' }" @click="activeTab = 'hotel'">Hotel</button>
        <button class="game__tab" :class="{ 'game__tab--active': activeTab === 'worldmap' }" @click="activeTab = 'worldmap'">World Map</button>
      </div>
      <div class="game__main">
        <main class="game__content">
          <HotelCanvas v-if="activeTab === 'hotel'" :payload="syncedPayload" />
          <WorldMap v-else-if="activeTab === 'worldmap'" />
          <div class="mapactions">
            <button class="mapactions__btn" @click="openEditor" aria-label="Open blueprint editor">Editor</button>
          </div>
        </main>
      </div>
      <footer class="game__status">
        <span>Continental — Hotel Simulation</span>
      </footer>
      <ToastContainer />
      <BlueprintEditor v-if="showEditor" @close="closeEditor" />
    </div>
  </ErrorBoundary>
</template>

<style scoped>
.game__layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.game__tabs {
  display: flex;
  gap: 0;
  padding: 0 8px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.game__tab {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
}

.game__tab:hover {
  color: var(--text-bright);
}

.game__tab--active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.game__main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.game__content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.mapactions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
}

.mapactions__btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-bright);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mapactions__btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
}

.game__status {
  flex-shrink: 0;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--text-dim);
  background: var(--bg-card);
  border-top: 1px solid var(--border-dim);
  text-align: center;
}
</style>
