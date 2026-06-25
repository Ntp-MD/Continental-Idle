<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '../engine/game-state'
import { getThemeDef } from '../data/themes'
import { EVENTS } from '../data/events'
import { eventBus } from '../engine/event-bus'

interface LogEntry {
  time: string
  themeName: string
  eventName: string
  choice: string
  outcome: string
}

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const entries = ref<LogEntry[]>([])

function update() {
  if (!props.visible) return
  const state = gameState.get()
  entries.value = [...state.eventLog].reverse().slice(0, 50).map(e => {
    const def = EVENTS.find(ev => ev.id === e.eventId)
    const choice = def?.choices.find(c => c.id === e.choiceId)
    const date = new Date(e.timestamp)
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      themeName: getThemeDef(e.theme)?.name || e.theme,
      eventName: def?.name || e.eventId,
      choice: choice?.label || e.choiceId,
      outcome: e.outcome,
    }
  })
}

onMounted(() => {
  update()
  eventBus.on('event:resolved', update)
  eventBus.on('event:ignored', update)
})

onUnmounted(() => {
  eventBus.off('event:resolved', update)
  eventBus.off('event:ignored', update)
})

watch(() => props.visible, (v) => { if (v) update() })
</script>

<template>
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content">
      <h2 class="game-panel__title">Event History</h2>
      <div class="event-log">
        <div v-if="entries.length === 0" class="event-log__empty">No events recorded yet</div>
        <div v-for="(e, i) in entries" :key="i" class="event-log__row" :class="e.outcome === 'ignored' ? 'event-log__row--ignored' : ''">
          <span class="event-log__time">{{ e.time }}</span>
          <span class="event-log__theme">{{ e.themeName }}</span>
          <span class="event-log__name">{{ e.eventName }}</span>
          <span class="event-log__choice">{{ e.choice }}</span>
          <span class="event-log__outcome" :class="e.outcome === 'ignored' ? 'event-log__outcome--ignored' : 'event-log__outcome--resolved'">{{ e.outcome }}</span>
        </div>
      </div>
      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
