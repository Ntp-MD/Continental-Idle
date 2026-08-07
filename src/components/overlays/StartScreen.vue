<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { gameState } from "@/engine/gameState";
import { getPrologue, getStoryContext } from "@/data/story";

const emit = defineEmits<{ start: []; quickStart: [] }>();
const router = useRouter();

const loading = ref(false);
const loadingProgress = ref(0);
const loadingText = ref("Initializing Continental OS...");

const prologue = getPrologue();
const storyContext = getStoryContext();

let loadingInterval: number | null = null;
let continueTimeout: number | null = null;

function startGame() {
  loading.value = true;
  const steps = ["Initializing Continental OS...", "Loading world map...", "Establishing HQ connection...", "Recruiting staff...", "Ready."];
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
      gameState.reset("bangkok");
      gameState.save();
      emit("start");
    }
  }, 200);
}

function quickStart() {
  gameState.reset("bangkok");
  gameState.save();
  emit("quickStart");
}

onUnmounted(() => {
  if (loadingInterval) clearInterval(loadingInterval);
  if (continueTimeout) clearTimeout(continueTimeout);
});
</script>

<template>
  <div class="start">
    <!-- Loading overlay -->
    <div v-if="loading" class="start__loading">
      <div class="start__loadingtext">CONTINENTAL OS v2.0</div>
      <div class="start__loadingbar">
        <div class="start__loading__fill" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="start__loadingstatus">{{ loadingText }}</div>
    </div>

    <div v-else class="start__content">
      <!-- Left column: logo + actions (20%) -->
      <aside class="start__panel">
        <h1 class="start__title">
          <img class="start__logo" src="/Continental-Idle-logo.png" alt="Continental Idle" />
        </h1>
        <p class="start__subtitle">The High Table Awaits</p>

        <div class="start__actions">
          <button class="btn__warning" @click="startGame">START NEW GAME</button>

          <button class="btn__success" @click="quickStart">QUICK START + AI AUTOPLAY</button>

          <button class="start__editorbtn" @click="router.push({ name: 'editor' })" aria-label="Open Blueprint Editor">Blueprint Editor</button>
        </div>
      </aside>

      <!-- Right column: story board (80%) -->
      <section class="start__board">
        <!-- Prologue -->
        <div class="start__story">
          <div class="start__storyicon">?</div>
          <div class="start__storytext">
            <p class="start__storyline" v-for="(line, i) in prologue.split('\n\n')" :key="i">{{ line }}</p>
          </div>
        </div>

        <div class="start__info">
          <p>
            As the <strong>{{ storyContext.playerTitle }}</strong
            >, your HQ generates <strong>1.2x income</strong> and is your starting Continental branch.
          </p>
          <p>Conquer rival AI controllers, establish supply routes, and claim your seat at the High Table.</p>
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
  min-height: 0;
  overflow: hidden;
}

.start__panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  min-height: 0;
  overflow: hidden;
}

.start__board {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  min-height: 0;
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
  max-width: 320px;
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
  background: var(--bg-card);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
  flex: 1;
  min-height: 0;
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

.start__info {
  color: var(--text-dim);
  font-size: var(--font-sm);
  line-height: 1.6;
  flex-shrink: 0;
}

.start .btn {
  font-size: var(--font-md);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-radius: var(--radius-md);
}

.start .btn__warning,
.start .btn__success {
  padding: var(--gap-sm) var(--gap-lg);
}

.start .btn__success {
  padding: var(--gap-sm) var(--gap-md);
}

.start__editorbtn {
  border: 1px solid var(--border-dim);
  background: transparent;
  color: var(--text-secondary);
  padding: var(--gap-sm) var(--gap-md);
  font-size: var(--font-md);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.start__editorbtn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.start__loading {
  text-align: center;
  padding: var(--gap-xl);
}

.start__loadingtext {
  font-size: var(--font-xl);
  color: var(--accent-gold);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: var(--gap-md);
}

.start__loadingbar {
  width: 100%;
  max-width: 300px;
  height: 3px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xs);
  margin: 0 auto var(--gap-sm);
  overflow: hidden;
}

.start__loading__fill {
  height: 100%;
  background: var(--gradient-gold);
  transition: width var(--duration-fast);
  border-radius: var(--radius-xs);
  box-shadow: 0 0 8px rgba(240, 192, 64, 0.4);
}

.start__loadingstatus {
  font-size: var(--font-sm);
  color: var(--text-dim);
}
</style>
