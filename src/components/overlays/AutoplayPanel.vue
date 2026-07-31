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
  <div class="autoplay__panel">
    <div class="autoplay__panel__header">
      <h2 class="autoplay__panel__title">AI Autoplay</h2>
      <button
        class="autoplay__panel__toggle"
        :class="{ 'autoplay__panel__toggleactive': running }"
        @click="toggleAutoplay"
        :aria-label="running ? 'Stop autoplay' : 'Start autoplay'"
        :aria-pressed="running"
      >
        {{ running ? 'STOP' : 'START' }}
      </button>
    </div>

    <div class="autoplay__panel__speeds">
      <span class="autoplay__panel__label">Speed:</span>
      <button
        v-for="s in speeds"
        :key="s"
        class="autoplay__panel__speedbtn"
        :class="{ 'autoplay__panel__speedbtnactive': speed === s }"
        @click="changeSpeed(s)"
        :aria-label="`Set autoplay speed to ${s}x`"
        :aria-pressed="speed === s"
      >
        {{ s }}x
      </button>
    </div>

    <div class="autoplay__panel__stats">
      <div class="autoplay__panel__stat">
        <span class="autoplay__panel__statlabel">branch</span>
        <span class="autoplay__panel__statvalue">{{ status.activeBranch }}</span>
      </div>
      <div class="autoplay__panel__stat">
        <span class="autoplay__panel__statlabel">Currency</span>
        <span class="autoplay__panel__statvalue">{{ status.activeCurrency }}</span>
      </div>
      <div class="autoplay__panel__stat">
        <span class="autoplay__panel__statlabel">Income</span>
        <span class="autoplay__panel__statvalue">{{ status.activeIncome }}</span>
      </div>
      <div class="autoplay__panel__stat">
        <span class="autoplay__panel__statlabel">Prestige</span>
        <span class="autoplay__panel__statvalue">{{ status.totalPrestige }}</span>
      </div>
      <div class="autoplay__panel__stat">
        <span class="autoplay__panel__statlabel">Favor</span>
        <span class="autoplay__panel__statvalue">{{ status.tableFavor }}</span>
      </div>
      <div class="autoplay__panel__stat">
        <span class="autoplay__panel__statlabel">Conquered</span>
        <span class="autoplay__panel__statvalue">{{ status.conqueredCount }}/{{ status.totalBranches }}</span>
      </div>
    </div>

    <div class="autoplay__panel__progressbar">
      <div
        class="autoplay__panel__progressfill"
        :style="{ width: (status.conqueredCount / status.totalBranches * 100) + '%' }"
      ></div>
    </div>

    <div class="autoplay__panel__log">
      <div class="autoplay__panel__logtitle">Action Log</div>
      <div class="autoplay__panel__loglist">
        <div v-for="(entry, i) in logEntries" :key="i" class="autoplay__panel__entry">
          {{ entry }}
        </div>
        <div v-if="logEntries.length === 0" class="autoplay__panel__logempty">
          No actions yet. Press START to begin.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.autoplay__panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: min(320px, calc(100vw - 32px));
  background: var(--bg-overlay);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: var(--gap-md);
  z-index: 9000;
  font-family: system-ui, sans-serif;
  color: var(--text-primary);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-panel);
}

.autoplay__panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--gap-sm);
}

.autoplay__panel__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--text-bright);
}

.autoplay__panel__toggle {
  padding: var(--gap-xs) var(--gap-md);
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  background: var(--bg-card-hover);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.autoplay__panel__toggleactive {
  background: var(--accent-red);
  color: var(--text-bright);
}

.autoplay__panel__speeds {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  margin-bottom: var(--gap-sm);
}

.autoplay__panel__label {
  font-size: 12px;
  color: var(--text-dim);
  margin-right: var(--gap-xs);
}

.autoplay__panel__speedbtn {
  padding: var(--gap-xs) var(--gap-sm);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 4px;
  background: transparent;
  color: var(--text-dim);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.autoplay__panel__speedbtnactive {
  background: var(--accent-blue);
  color: var(--text-bright);
  border-color: var(--accent-blue);
}

.autoplay__panel__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-xs);
  margin-bottom: var(--gap-sm);
}

.autoplay__panel__stat {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.autoplay__panel__statlabel {
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
}

.autoplay__panel__statvalue {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.autoplay__panel__progressbar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--gap-sm);
}

.autoplay__panel__progressfill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
  transition: width 0.3s;
}

.autoplay__panel__log {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--gap-sm);
}

.autoplay__panel__logtitle {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  margin-bottom: var(--gap-xs);
}

.autoplay__panel__loglist {
  max-height: 140px;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.5;
}

.autoplay__panel__entry {
  color: var(--text-secondary);
  padding: var(--gap-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.autoplay__panel__logempty {
  color: var(--text-dim);
  font-style: italic;
  padding: var(--gap-sm) 0;
}

.autoplay__panel__loglist::-webkit-scrollbar {
  width: 4px;
}

.autoplay__panel__loglist::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
</style>
