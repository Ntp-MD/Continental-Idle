<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const emit = defineEmits<{ start: [] }>();
const router = useRouter();

const loading = ref(false);
const loadingProgress = ref(0);
const loadingText = ref("Initializing Continental OS...");

let loadingInterval: number | null = null;

function startGame() {
  if (loading.value) return;
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

function openEditor() {
  router.push({ name: "editor" });
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !loading.value) startGame();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  if (loadingInterval) clearInterval(loadingInterval);
});

const features = [
  {
    title: "Blueprint Editor",
    desc: "Design your hotel on a tile grid — rooms, corridors, lobbies, elevators, bathrooms and lounges.",
    tag: "Design",
  },
  {
    title: "Living Simulation",
    desc: "Deploy up to hundreds of NPCs that walk, queue, interact and ride elevators between floors.",
    tag: "Simulate",
  },
  {
    title: "Real Behavior",
    desc: "Roles with focus tags, reservations, queues and pathfinding drive every guest's decisions.",
    tag: "Systems",
  },
];

const steps = ["Design floors & place furniture in the Blueprint Editor", "Enter the hotel and deploy NPC guests", "Watch them explore, queue and ride elevators"];
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
          <button class="flag--warning start__cta" @click="startGame">Enter Hotel<span class="start__ctahint">Enter</span></button>
          <button class="flag--ghost" @click="openEditor" aria-label="Open Blueprint Editor">Blueprint Editor</button>
        </div>

        <div class="start__footnote">
          <span>v2.0</span>
          <span>Design · Simulate · Manage</span>
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

        <div class="start__features">
          <article v-for="f in features" :key="f.title" class="start__feature">
            <div class="start__featuretag">{{ f.tag }}</div>
            <h2 class="start__featuretitle">{{ f.title }}</h2>
            <p class="start__featuredesc">{{ f.desc }}</p>
          </article>
        </div>

        <div class="start__quickstart">
          <div class="start__quicktitle">Quick Start</div>
          <ol class="start__steps">
            <li v-for="(s, i) in steps" :key="i" class="start__step">
              <span class="start__stepnum">{{ i + 1 }}</span>
              <span>{{ s }}</span>
            </li>
          </ol>
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
  grid-template-columns: minmax(280px, 30fr) 70fr;
  gap: var(--gap-md);
  overflow: hidden;
}

.start__panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  overflow-y: auto;
  padding-right: var(--gap-xs);
}

.start__board {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  overflow-y: auto;
  padding-right: var(--gap-xs);
}

.start__actions {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  flex-shrink: 0;
}

.start__cta {
  position: relative;
  padding: var(--gap-sm) var(--gap-lg);
}

.start__ctahint {
  position: absolute;
  right: var(--gap-sm);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-xxs, 10px);
  font-weight: 400;
  letter-spacing: 1px;
  opacity: 0.75;
  border: 1px solid currentColor;
  border-radius: var(--radius-xs, 3px);
  padding: 1px 6px;
}

.start__footnote {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  font-size: var(--font-xs, 11px);
  color: var(--text-dim);
  letter-spacing: 1px;
  text-transform: uppercase;
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
  flex-shrink: 0;
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

.start__features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--gap-md);
}

.start__feature {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
}

.start__featuretag {
  align-self: flex-start;
  font-size: var(--font-xxs, 10px);
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent-primary);
  border: 1px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
  border-radius: var(--radius-xs, 3px);
  padding: 2px 8px;
}

.start__featuretitle {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-primary);
}

.start__featuredesc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.start__quickstart {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
}

.start__quicktitle {
  font-size: var(--font-sm);
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.start__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.start__step {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.start__stepnum {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--accent-primary);
  color: var(--accent-primary);
  font-size: var(--font-xs, 11px);
  font-weight: 600;
}

@media (max-width: 900px) {
  .start {
    overflow-y: auto;
    padding: var(--gap-md) 0;
  }

  .start__content {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .start__panel,
  .start__board {
    overflow: visible;
  }
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
