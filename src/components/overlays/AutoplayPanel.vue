<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { autoplayBot, type AutoplaySpeed } from '@/engine/autoplay'
import { eventBus } from '@/engine/eventBus'

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
  <div class="autoplay_panel">
    <div class="autoplay_panel__header">
      <h2 class="autoplay_panel__title">AI Autoplay</h2>
      <button
        class="autoplay_panel__toggle"
        :class="{ 'autoplay_panel__toggle__active': running }"
        @click="toggleAutoplay"
      >
        {{ running ? 'STOP' : 'START' }}
      </button>
    </div>

    <div class="autoplay_panel__speeds">
      <span class="autoplay_panel__label">Speed:</span>
      <button
        v-for="s in speeds"
        :key="s"
        class="autoplay_panel__speed_btn"
        :class="{ 'autoplay_panel__speed_btn__active': speed === s }"
        @click="changeSpeed(s)"
      >
        {{ s }}x
      </button>
    </div>

    <div class="autoplay_panel__stats">
      <div class="autoplay_panel__stat">
        <span class="autoplay_panel__stat_label">branch</span>
        <span class="autoplay_panel__stat_value">{{ status.activeBranch }}</span>
      </div>
      <div class="autoplay_panel__stat">
        <span class="autoplay_panel__stat_label">Currency</span>
        <span class="autoplay_panel__stat_value">{{ status.activeCurrency }}</span>
      </div>
      <div class="autoplay_panel__stat">
        <span class="autoplay_panel__stat_label">Income</span>
        <span class="autoplay_panel__stat_value">{{ status.activeIncome }}</span>
      </div>
      <div class="autoplay_panel__stat">
        <span class="autoplay_panel__stat_label">Prestige</span>
        <span class="autoplay_panel__stat_value">{{ status.totalPrestige }}</span>
      </div>
      <div class="autoplay_panel__stat">
        <span class="autoplay_panel__stat_label">Favor</span>
        <span class="autoplay_panel__stat_value">{{ status.tableFavor }}</span>
      </div>
      <div class="autoplay_panel__stat">
        <span class="autoplay_panel__stat_label">Conquered</span>
        <span class="autoplay_panel__stat_value">{{ status.conqueredCount }}/{{ status.totalBranches }}</span>
      </div>
    </div>

    <div class="autoplay_panel__progress_bar">
      <div
        class="autoplay_panel__progress_fill"
        :style="{ width: (status.conqueredCount / status.totalBranches * 100) + '%' }"
      ></div>
    </div>

    <div class="autoplay_panel__log">
      <div class="autoplay_panel__log_title">Action Log</div>
      <div class="autoplay_panel__log_list">
        <div v-for="(entry, i) in logEntries" :key="i" class="autoplay_panel__log_entry">
          {{ entry }}
        </div>
        <div v-if="logEntries.length === 0" class="autoplay_panel__log_empty">
          No actions yet. Press START to begin.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.autoplay_panel {
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

.autoplay_panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--gap-sm);
}

.autoplay_panel__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--text-bright);
}

.autoplay_panel__toggle {
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

.autoplay_panel__toggle__active {
  background: var(--accent-red);
  color: var(--text-bright);
}

.autoplay_panel__speeds {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  margin-bottom: var(--gap-sm);
}

.autoplay_panel__label {
  font-size: 12px;
  color: var(--text-dim);
  margin-right: var(--gap-xs);
}

.autoplay_panel__speed_btn {
  padding: var(--gap-xs) var(--gap-sm);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 4px;
  background: transparent;
  color: var(--text-dim);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.autoplay_panel__speed_btn__active {
  background: var(--autoplay-speed-active);
  color: var(--text-bright);
  border-color: var(--autoplay-speed-active);
}

.autoplay_panel__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-xs);
  margin-bottom: var(--gap-sm);
}

.autoplay_panel__stat {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.autoplay_panel__stat_label {
  font-size: 10px;
  color: var(--autoplay-text-dim);
  text-transform: uppercase;
}

.autoplay_panel__stat_value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.autoplay_panel__progress_bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--gap-sm);
}

.autoplay_panel__progress_fill {
  height: 100%;
  background: linear-gradient(90deg, var(--autoplay-progress-1), var(--autoplay-progress-2));
  transition: width 0.3s;
}

.autoplay_panel__log {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--gap-sm);
}

.autoplay_panel__log_title {
  font-size: 11px;
  color: var(--autoplay-text-dim);
  text-transform: uppercase;
  margin-bottom: var(--gap-xs);
}

.autoplay_panel__log_list {
  max-height: 140px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
}

.autoplay_panel__log_entry {
  color: var(--text-secondary);
  padding: var(--gap-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.autoplay_panel__log_empty {
  color: var(--node-locked);
  font-style: italic;
  padding: var(--gap-sm) 0;
}

.autoplay_panel__log_list::-webkit-scrollbar {
  width: 4px;
}

.autoplay_panel__log_list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
</style>
