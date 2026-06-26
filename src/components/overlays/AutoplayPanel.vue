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

function onLog(e: CustomEvent) {
  const message = e.detail as string
  logEntries.value.unshift(message)
  if (logEntries.value.length > 30) {
    logEntries.value = logEntries.value.slice(0, 30)
  }
}

onMounted(() => {
  eventBus.on('autoplay:log', onLog)
  statusInterval = window.setInterval(() => {
    statusUpdate.value++
  }, 200)
})

onUnmounted(() => {
  eventBus.off('autoplay:log', onLog)
  if (statusInterval !== null) clearInterval(statusInterval)
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
  width: 320px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  z-index: 9000;
  font-family: system-ui, sans-serif;
  color: #e0e0e0;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.autoplay-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.autoplay-panel__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.autoplay-panel__toggle {
  padding: 6px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  background: #2a2a3a;
  color: #aaa;
  transition: all 0.2s;
}

.autoplay-panel__toggle--active {
  background: #e74c3c;
  color: #fff;
}

.autoplay-panel__speeds {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.autoplay-panel__label {
  font-size: 12px;
  color: #888;
  margin-right: 4px;
}

.autoplay-panel__speed-btn {
  padding: 3px 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.autoplay-panel__speed-btn--active {
  background: #4a90e2;
  color: #fff;
  border-color: #4a90e2;
}

.autoplay-panel__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
}

.autoplay-panel__stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.autoplay-panel__stat-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}

.autoplay-panel__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}

.autoplay-panel__progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.autoplay-panel__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #2ecc71);
  transition: width 0.3s;
}

.autoplay-panel__log {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 8px;
}

.autoplay-panel__log-title {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.autoplay-panel__log-list {
  max-height: 140px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
}

.autoplay-panel__log-entry {
  color: #aaa;
  padding: 1px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.autoplay-panel__log-empty {
  color: #555;
  font-style: italic;
  padding: 8px 0;
}

.autoplay-panel__log-list::-webkit-scrollbar {
  width: 4px;
}

.autoplay-panel__log-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
</style>
