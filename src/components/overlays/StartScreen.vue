<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const emit = defineEmits<{ start: [] }>();
const router = useRouter();

const loading = ref(false);
const loadingProgress = ref(0);
const loadingText = ref("Initializing Continental OS...");

let loadingInterval: number | null = null;

function startGame() {
  loading.value = true;
  const steps = ["Initializing Continental OS...", "Loading world map...", "Establishing HQ connection...", "Ready."];
  let step = 0;
  loadingInterval = window.setInterval(() => {
    step++;
    loadingProgress.value = Math.min(100, (step / steps.length) * 100);
    loadingText.value = steps[step] || steps[steps.length - 1];
    if (step >= steps.length) {
      if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
      }
      emit("start");
    }
  }, 200);
}

onUnmounted(() => {
  if (loadingInterval) clearInterval(loadingInterval);
});
</script>

<template>
  <div class="start">
    <!-- Loading overlay -->
    <div v-if="loading" class="start--loading">
      <div class="start__loadingtext">CONTINENTAL OS v2.0</div>
      <div class="start__loadingbar">
        <div class="start__loadingfill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="start__loadingstatus">{{ loadingText }}</div>
    </div>

    <div v-else class="start__content">
      <!-- Left column: logo + actions -->
      <aside class="start__panel">
        <h1 class="start__title">
          <img class="start__logo" src="/Continental-Idle-logo.png" alt="Continental" />
        </h1>
        <p class="start__subtitle">Hotel Simulation</p>

        <div class="start__actions">
          <button class="flag--warning" @click="startGame">ENTER HOTEL</button>
          <button class="flag--ghost" @click="router.push({ name: 'editor' })" aria-label="Open Blueprint Editor">Blueprint Editor</button>
        </div>
      </aside>

      <!-- Right column: info board -->
      <section class="start__board">
        <div class="start__story">
          <div class="start__storyicon">?</div>
          <div class="start__storytext">
            <p class="start__storyline">Welcome to the Continental — a world where hospitality and precision meet.</p>
            <p class="start__storyline">Design your hotel in the Blueprint Editor, then watch it come alive with NPCs moving through your layout.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.start {
  position: fixed;
  inset: 0;
  height: 100dvh;
  background: var(--bg-primary);
  display: flex;
  justify-content: center;
  align-items: stretch;
  overflow: hidden;
  z-index: 5000;
  padding: var(--gap-md) 0;
}

.start__content {
  padding: var(--gap-md);
  flex: 1;
  display: grid;
  grid-template-columns: 20fr 80fr;
  gap: var(--gap-md);
  overflow: hidden;
}

.start__panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  overflow: hidden;
}

.start__board {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  overflow: hidden;
}

.start__actions {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  flex-shrink: 0;
}

.start__title {
  flex-shrink: 0;
}

.start__logo {
  display: block;
  width: 100%;
  max-width: 80vw;
  height: auto;
  margin: 0 auto;
}

.start__subtitle {
  font-size: var(--font-md);
  font-weight: 400;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 3px;
  text-align: center;
  flex-shrink: 0;
}

.start__story {
  display: flex;
  gap: var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
  flex: 1;
  overflow-y: auto;
}

.start__storyicon {
  font-size: var(--font-xl);
  color: var(--accent-red);
  flex-shrink: 0;
  opacity: 0.7;
}

.start__storytext {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  flex: 1;
}

.start__storyline {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.start button {
  font-size: var(--font-md);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-radius: var(--radius-md);
}

.start .flag--warning {
  padding: var(--gap-sm) var(--gap-lg);
}

.start--loading {
  text-align: center;
  padding: var(--gap-xl);
}

.start__loadingtext {
  font-size: var(--font-xl);
  color: var(--accent-primary);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: var(--gap-md);
}

.start__loadingbar {
  width: 100%;
  max-width: 80vw;
  height: 3px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xs);
  margin: 0 auto var(--gap-sm);
  overflow: hidden;
}

.start__loadingfill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width var(--duration-fast);
  border-radius: var(--radius-xs);
  box-shadow: 0 0 8px rgba(240, 192, 64, 0.4);
}

.start__loadingstatus {
  font-size: var(--font-sm);
  color: var(--text-dim);
}
</style>
