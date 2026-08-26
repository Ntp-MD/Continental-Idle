<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent, watch, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import WorldMap from "@/components/layout/WorldMap.vue";
import HotelCanvas from "@/components/HotelCanvas.vue";
import CadPlans from "@/components/CadPlans.vue";
import StartScreen from "@/components/overlays/StartScreen.vue";
import ToastContainer from "@/components/overlays/ToastContainer.vue";
import ErrorBoundary from "@/components/overlays/ErrorBoundary.vue";
import { useToast } from "@/composables/useToast";
import { loadPersistedSyncPayload } from "@/blueprint-editor/store/persistence";
import type { SyncedLayoutPayload } from "@/blueprint-editor/types";

const BlueprintEditor = defineAsyncComponent(() => import("@/blueprint-editor/BlueprintEditor.vue"));

const toast = useToast();
const route = useRoute();
const router = useRouter();

const showEditor = ref(route.name === "editor");
const showStart = ref(true);
const activeTab = ref<"hotel" | "worldmap" | "plans">("hotel");
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
  void loadPersistedSyncPayload()
    .then((persisted) => {
      if (persisted && !syncedPayload.value) syncedPayload.value = persisted;
    })
    .catch(() => {});
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
        <button class="game__tab" :class="{ 'game__tab--active': activeTab === 'plans' }" @click="activeTab = 'plans'">Plans</button>
        <button class="game__tab" :class="{ 'game__tab--active': activeTab === 'worldmap' }" @click="activeTab = 'worldmap'">World Map</button>
      </div>
      <div class="game__main">
        <main class="game__content">
          <HotelCanvas v-if="activeTab === 'hotel'" :payload="syncedPayload" />
          <CadPlans v-else-if="activeTab === 'plans'" />
          <WorldMap v-else-if="activeTab === 'worldmap'" />
          <div class="mapactions">
            <button class="mapactions__btn" @click="openEditor" aria-label="Open blueprint editor" title="Blueprint editor">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </main>
      </div>
      <footer class="game__status">
        <span>Continental - Hotel Simulation</span>
      </footer>
      <ToastContainer />
      <BlueprintEditor v-if="showEditor" @close="closeEditor" />
    </div>
  </ErrorBoundary>
</template>

<style scoped>
.game__layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.game__tabs {
  display: flex;
  gap: 0;
  padding: 0 8px;
  background: var(--bg-primary);
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--bg-primary) 80%, transparent);
  color: var(--text-dim);
  cursor: pointer;
}

.mapactions__btn:hover {
  color: var(--text-bright);
  border-color: var(--border-color);
}

.game__status {
  padding: 4px 12px;
  font-size: 11px;
  background: var(--bg-primary);
  text-align: center;
}
</style>
