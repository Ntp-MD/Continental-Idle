<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { eventEngine } from '../engine/event-engine'
import { eventBus } from '../engine/event-bus'
import { shouldRevealEventOutcomes } from '../engine/abilities'
import { gameState } from '../engine/game-state'

const visible = ref(false)
const eventName = ref('')
const eventDesc = ref('')
const choices = ref<Array<{ id: string; label: string; details: string }>>([])
const timer = ref(60)
const maxTimer = ref(60)

let timerInterval: number | null = null

function update() {
  const active = eventEngine.getActiveEvent()
  if (active) {
    visible.value = true
    eventName.value = active.definition.name
    eventDesc.value = active.definition.description
    maxTimer.value = active.definition.autoResolveTimeout
    const reveal = shouldRevealEventOutcomes(gameState.getActiveThemeId())
    choices.value = active.definition.choices.map(c => {
      let details = ''
      if (reveal) {
        const parts: string[] = []
        if (c.reputationChange !== 0) parts.push(`Rep ${c.reputationChange > 0 ? '+' : ''}${c.reputationChange}`)
        c.rewards.forEach(r => parts.push(`+${r.type}:${r.value}`))
        c.penalties.forEach(p => parts.push(`-${p.type}:${p.value}`))
        details = parts.join(', ')
      }
      return { id: c.id, label: c.label, details }
    })
    const elapsed = (Date.now() - active.triggeredAt) / 1000
    timer.value = Math.max(0, Math.ceil(active.definition.autoResolveTimeout - elapsed))

    if (!timerInterval) {
      timerInterval = window.setInterval(() => {
        const ev = eventEngine.getActiveEvent()
        if (ev) {
          const el = (Date.now() - ev.triggeredAt) / 1000
          timer.value = Math.max(0, Math.ceil(ev.definition.autoResolveTimeout - el))
        } else {
          visible.value = false
          if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
        }
      }, 1000)
    }
  } else {
    visible.value = false
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  }
}

function resolve(choiceId: string) {
  const result = eventEngine.resolveEvent(choiceId)
  if (result !== false) {
    visible.value = false
  }
}

onMounted(() => {
  eventBus.on('event:trigger', update)
  eventBus.on('event:resolved', update)
  eventBus.on('event:ignored', update)
  eventBus.on('event:rejected', update)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  eventBus.off('event:trigger', update)
  eventBus.off('event:resolved', update)
  eventBus.off('event:ignored', update)
  eventBus.off('event:rejected', update)
})
</script>

<template>
  <div v-if="visible" class="event-prompt">
    <div class="event-prompt__header">
      <span class="event-prompt__icon">⚠</span>
      <span class="event-prompt__text">{{ eventName }}</span>
      <span class="event-prompt__timer">{{ timer }}s</span>
    </div>
    <div class="event-prompt__desc">{{ eventDesc }}</div>
    <div class="event-prompt__timer-bar">
      <div class="event-prompt__timer-fill" :style="{ width: (timer / maxTimer * 100) + '%' }"></div>
    </div>
    <div class="event-prompt__actions">
      <button v-for="c in choices" :key="c.id" @click="resolve(c.id)">
        {{ c.label }}
        <span v-if="c.details" class="event-prompt__details">{{ c.details }}</span>
      </button>
    </div>
  </div>
</template>
