<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/gameState'
import { getBranchDef } from '@/data/branches'
import { EVENTS } from '@/data/events'
import { eventBus } from '@/engine/eventBus'

interface LogEntry {
  id: string
  time: string
  branchName: string
  eventName: string
  choice: string
  outcome: string
}

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const entries = ref<LogEntry[]>([])
const filter = ref<'all' | 'resolved' | 'ignored' | 'ai'>('all')

const filteredEntries = computed(() => {
  if (filter.value === 'all') return entries.value
  if (filter.value === 'ai') return entries.value.filter(e => e.eventName.startsWith('AI '))
  return entries.value.filter(e => e.outcome === filter.value)
})

function getEventName(eventId: string): string {
  const def = EVENTS.find(ev => ev.id === eventId)
  if (def) return def.name
  if (eventId.startsWith('ai_')) {
    const parts = eventId.split('_')
    const eventType = parts[1]
    const labels: Record<string, string> = {
      raid: 'AI Raid',
      tribute: 'AI Tribute Demand',
      sabotage: 'AI Sabotage',
      spy: 'AI Spy Caught',
      provocation: 'AI Provocation',
      truce: 'AI Truce Offer',
    }
    return labels[eventType] || eventId
  }
  return eventId
}

function getChoiceLabel(eventId: string, choiceId: string): string {
  const def = EVENTS.find(ev => ev.id === eventId)
  const choice = def?.choices.find(c => c.id === choiceId)
  if (choice) return choice.label
  if (eventId.startsWith('ai_')) {
    const labels: Record<string, string> = {
      fight: 'Defend with assassins',
      pay: 'Pay tribute',
      ignore: 'Ignore',
      refuse: 'Refuse',
      repair: 'Repair',
      retaliate: 'Retaliate',
      endure: 'Endure',
      interrogate: 'Interrogate',
      release: 'Release',
      stand: 'Stand firm',
      back: 'Back down',
      accept: 'Accept',
      reject: 'Reject',
    }
    return labels[choiceId] || choiceId
  }
  return choiceId
}

function update() {
  if (!props.visible) return
  const state = gameState.get()
  entries.value = [...state.eventLog].reverse().slice(0, 50).map((e, i) => {
    const date = new Date(e.timestamp)
    return {
      id: `${e.timestamp}-${e.eventId}-${i}`,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: getBranchDef(e.branch)?.name || e.branch,
      eventName: getEventName(e.eventId),
      choice: getChoiceLabel(e.eventId, e.choiceId),
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
  <div v-if="visible" class="game_panel" @click.self="emit('close')">
    <div class="game_panel__content" role="dialog" aria-modal="true" aria-labelledby="panel_title_eventlog">
      <h2 id="panel_title_eventlog" class="game_panel__title">Event History</h2>
      <div class="event_log__filters">
        <button class="event_log__filter" :class="{ 'event_log__filter__active': filter === 'all' }" @click="filter = 'all'">All</button>
        <button class="event_log__filter" :class="{ 'event_log__filter__active': filter === 'resolved' }" @click="filter = 'resolved'">Resolved</button>
        <button class="event_log__filter" :class="{ 'event_log__filter__active': filter === 'ignored' }" @click="filter = 'ignored'">Ignored</button>
        <button class="event_log__filter" :class="{ 'event_log__filter__active': filter === 'ai' }" @click="filter = 'ai'">AI Events</button>
      </div>
      <div class="event_log">
        <div v-if="filteredEntries.length === 0" class="event_log__empty">No events recorded yet</div>
        <div v-for="e in filteredEntries" :key="e.id" class="event_log__row" :class="e.outcome === 'ignored' ? 'event_log__row__ignored' : ''">
          <span class="event_log__time">{{ e.time }}</span>
          <span class="event_log__branch">{{ e.branchName }}</span>
          <span class="event_log__name">{{ e.eventName }}</span>
          <span class="event_log__choice">{{ e.choice }}</span>
          <span class="event_log__outcome" :class="e.outcome === 'ignored' ? 'event_log__outcome__ignored' : 'event_log__outcome__resolved'">{{ e.outcome }}</span>
        </div>
      </div>
      <button class="game_panel__close" @click="emit('close')" aria-label="Close event history panel">?</button>
    </div>
  </div>
</template>
