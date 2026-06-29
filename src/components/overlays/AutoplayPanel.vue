<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { autoplayBot, type AutoplaySpeed } from '@/engine/autoplay'
import { eventBus } from '@/engine/event-bus'

const running = ref(autoplayBot.isRunning())
const speed = ref<AutoplaySpeed>(autoplayBot.getSpeed())
const logEntries = ref<string[]>([])
const statusUpdate = ref(0)

let statusInterval: number | null = null

const speeds: AutoplaySpeed[] = [1, 10, 100, 1000]

const status = computed(() => {
  statusUpdate.value
  return autoplayBot.getStatus()
})

function toggleAutoplay() {
  if (running.value) {
    autoplayBot.stop()
    running.value = false
  } else {
    autoplayBot.start()
    running.value = true
  }
}

function changeSpeed(s: AutoplaySpeed) {
  speed.value = s
  autoplayBot.setSpeed(s)
}

function syncRunningState() {
  running.value = autoplayBot.isRunning()
}

onMounted(() => {
  statusInterval = window.setInterval(() => {
    statusUpdate.value++
    logEntries.value = autoplayBot.getLog().slice(0, 30).map(e => e.message)
  }, 200)
  eventBus.on('autoplay:started', syncRunningState)
  eventBus.on('autoplay:stopped', syncRunningState)
})

onUnmounted(() => {
  if (statusInterval !== null) clearInterval(statusInterval)
  eventBus.off('autoplay:started', syncRunningState)
  eventBus.off('autoplay:stopped', syncRunningState)
})
</script>

<template>
  <div class="autoplay-panel">
    <div class="autoplay-panel__header">
      <h2 class="autoplay-panel__title">AI Autoplay</h2>
      <button
        class="autoplay-panel__toggle"
        :class="{ 'autoplay-panel__toggle--active': running }"
        @click="toggleAutoplay"
      >
        {{ running ? 'STOP' : 'START' }}
      </button>
    </div>

    <div class="autoplay-panel__speeds">
      <span class="autoplay-panel__label">Speed:</span>
      <button
        v-for="s in speeds"
        :key="s"
        class="autoplay-panel__speed-btn"
        :class="{ 'autoplay-panel__speed-btn--active': speed === s }"
        @click="changeSpeed(s)"
      >
        {{ s }}x
      </button>
    </div>

    <div class="autoplay-panel__stats">
      <div class="autoplay-panel__stat">
        <span class="autoplay-panel__stat-label">branch</span>
        <span class="autoplay-panel__stat-value">{{ status.activeBranch }}</span>
      </div>
      <div class="autoplay-panel__stat">
        <span class="autoplay-panel__stat-label">Currency</span>
        <span class="autoplay-panel__stat-value">{{ status.activeCurrency }}</span>
      </div>
      <div class="autoplay-panel__stat">
        <span class="autoplay-panel__stat-label">Income</span>
        <span class="autoplay-panel__stat-value">{{ status.activeIncome }}</span>
      </div>
      <div class="autoplay-panel__stat">
        <span class="autoplay-panel__stat-label">Prestige</span>
        <span class="autoplay-panel__stat-value">{{ status.totalPrestige }}</span>
      </div>
      <div class="autoplay-panel__stat">
        <span class="autoplay-panel__stat-label">Favor</span>
        <span class="autoplay-panel__stat-value">{{ status.tableFavor }}</span>
      </div>
      <div class="autoplay-panel__stat">
        <span class="autoplay-panel__stat-label">Conquered</span>
        <span class="autoplay-panel__stat-value">{{ status.conqueredCount }}/{{ status.totalBranches }}</span>
      </div>
    </div>

    <div class="autoplay-panel__progress-bar">
      <div
        class="autoplay-panel__progress-fill"
        :style="{ width: (status.conqueredCount / status.totalBranches * 100) + '%' }"
      ></div>
    </div>

    <div class="autoplay-panel__log">
      <div class="autoplay-panel__log-title">Action Log</div>
      <div class="autoplay-panel__log-list">
        <div v-for="(entry, i) in logEntries" :key="i" class="autoplay-panel__log-entry">
          {{ entry }}
        </div>
        <div v-if="logEntries.length === 0" class="autoplay-panel__log-empty">
          No actions yet. Press START to begin.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.autoplay-panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: min(320px, calc(100vw - 32px));
  background: var(--autoplay-bg);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: var(--gap-md);
  z-index: 9000;
  font-family: system-ui, sans-serif;
  color: var(--text-primary);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-panel);
}

.autoplay-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--gap-sm);
}

.autoplay-panel__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--text-bright);
}

.autoplay-panel__toggle {
  padding: var(--gap-xs) var(--gap-md);
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  background: var(--autoplay-toggle);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.autoplay-panel__toggle--active {
  background: var(--accent-red);
  color: var(--text-bright);
}

.autoplay-panel__speeds {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  margin-bottom: var(--gap-sm);
}

.autoplay-panel__label {
  font-size: 12px;
  color: var(--text-dim);
  margin-right: var(--gap-xs);
}

.autoplay-panel__speed-btn {
  padding: var(--gap-xs) var(--gap-sm);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 4px;
  background: transparent;
  color: var(--text-dim);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.autoplay-panel__speed-btn--active {
  background: var(--autoplay-speed-active);
  color: var(--text-bright);
  border-color: var(--autoplay-speed-active);
}

.autoplay-panel__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-xs);
  margin-bottom: var(--gap-sm);
}

.autoplay-panel__stat {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.autoplay-panel__stat-label {
  font-size: 10px;
  color: var(--autoplay-text-dim);
  text-transform: uppercase;
}

.autoplay-panel__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.autoplay-panel__progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--gap-sm);
}

.autoplay-panel__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--autoplay-progress-1), var(--autoplay-progress-2));
  transition: width 0.3s;
}

.autoplay-panel__log {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--gap-sm);
}

.autoplay-panel__log-title {
  font-size: 11px;
  color: var(--autoplay-text-dim);
  text-transform: uppercase;
  margin-bottom: var(--gap-xs);
}

.autoplay-panel__log-list {
  max-height: 140px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
}

.autoplay-panel__log-entry {
  color: var(--text-secondary);
  padding: var(--gap-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.autoplay-panel__log-empty {
  color: var(--node-locked);
  font-style: italic;
  padding: var(--gap-sm) 0;
}

.autoplay-panel__log-list::-webkit-scrollbar {
  width: 4px;
}

.autoplay-panel__log-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
</style>
