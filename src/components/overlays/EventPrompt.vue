<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { eventEngine } from '@/engine/event-engine'
import { eventBus } from '@/engine/event-bus'
import { gameState } from '@/engine/game-state'
import { DEFENDER_LOYALTY_THRESHOLD } from '@/engine/event-engine'
import { shouldRevealEventOutcomes } from '@/engine/abilities'
import { useToast } from '@/composables/useToast'
import type { RaidData } from '@/types'

const toast = useToast()

const visible = ref(false)
const eventName = ref('')
const eventDesc = ref('')
const choices = ref<Array<{ id: string; label: string; details: string; disabled: boolean; isBest?: boolean; isSafe?: boolean }>>([])
const timer = ref(60)
const maxTimer = ref(60)
const raidData = ref<RaidData | null>(null)
const revealOutcomes = ref(false)

let timerInterval: number | null = null

function update() {
  const active = eventEngine.getActiveEvent()
  if (active) {
    visible.value = true
    eventName.value = active.definition.name
    eventDesc.value = active.definition.description
    maxTimer.value = active.definition.autoResolveTimeout
    raidData.value = eventEngine.getRaidData()

    const branch = gameState.get().branches[active.branch]
    const allAssigned = branch
      ? Object.values(branch.assassins).filter(a => a.assignedBranch === active.branch && !a.lentTo && a.attackTarget === null)
      : []
    const eligibleDefenders = allAssigned.filter(a => a.loyalty >= DEFENDER_LOYALTY_THRESHOLD)
    const hasDefenders = eligibleDefenders.length > 0
    const disloyalCount = allAssigned.length - eligibleDefenders.length

    revealOutcomes.value = shouldRevealEventOutcomes(active.branch)

    choices.value = active.definition.choices.map(c => {
      let details = ''
      const staffTypeMet = !c.requires?.staffType || (branch
        ? Object.values(branch.staff).some(s =>
            s.typeId === c.requires!.staffType &&
            s.assignedTo !== null &&
            (!c.requires!.minLevel || s.level >= c.requires!.minLevel))
        : false)
      const disabled = !!(c.requires?.assassinAssigned && !hasDefenders) || !staffTypeMet

      if (c.id === 'fight' && raidData.value) {
        const r = raidData.value
        if (hasDefenders) {
          let line = `Win chance: ${Math.round(r.winChance * 100)}% | Your power: ${r.defenderPower} vs Enemy: ${r.attackerPower}`
          if (disloyalCount > 0) {
            line += ` (${disloyalCount} assassin${disloyalCount > 1 ? 's' : ''} too disloyal to fight)`
          }
          details = line
        } else if (allAssigned.length > 0) {
          details = `All ${allAssigned.length} assassin${allAssigned.length > 1 ? 's' : ''} too disloyal to defend (need ${DEFENDER_LOYALTY_THRESHOLD}+ loyalty)`
        } else {
          details = 'No assassins available to defend'
        }
      } else {
        const parts: string[] = []
        if (c.reputationChange !== 0) parts.push(`Rep ${c.reputationChange > 0 ? '+' : ''}${c.reputationChange}`)
        c.rewards.forEach(r => parts.push(`+${r.type}:${r.value}`))
        c.penalties.forEach(p => parts.push(`-${p.type}:${p.value}`))
        details = parts.join(', ')
      }
      return { id: c.id, label: c.label, details, disabled, isBest: c.isBest, isSafe: c.isSafe }
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
    raidData.value = null
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  }
}

function resolve(choiceId: string) {
  const result = eventEngine.resolveEvent(choiceId)
  if (result !== false) {
    visible.value = false
  } else {
    toast.warning('Requirements not met for this choice')
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

    <div v-if="raidData" class="event-prompt__raid-info">
      <div class="event-prompt__raid-row">
        <span class="event-prompt__raid-label">Attackers:</span>
        <span class="event-prompt__raid-value">{{ raidData.attackers.length }} (Power: {{ raidData.attackerPower }})</span>
      </div>
      <div v-for="a in raidData.attackers" :key="a.name" class="event-prompt__raid-attacker">
        {{ a.name }} — Lv.{{ a.level }} | PRE {{ a.precision }} SPD {{ a.speed }}
      </div>
      <div class="event-prompt__raid-row">
        <span class="event-prompt__raid-label">Your defenders:</span>
        <span class="event-prompt__raid-value">{{ raidData.defenderCount }} (Power: {{ raidData.defenderPower }})</span>
      </div>
      <div v-if="raidData.defenderCount > 0" class="event-prompt__raid-row">
        <span class="event-prompt__raid-label">Win chance:</span>
        <span class="event-prompt__raid-value event-prompt__raid-win">{{ Math.round(raidData.winChance * 100) }}%</span>
      </div>
    </div>

    <div class="event-prompt__timer-bar">
      <div class="event-prompt__timer-fill" :style="{ width: (timer / maxTimer * 100) + '%' }"></div>
    </div>
    <div class="event-prompt__actions">
      <button
        v-for="c in choices"
        :key="c.id"
        :disabled="c.disabled"
        :aria-disabled="c.disabled"
        :class="{ 'event-prompt__btn--disabled': c.disabled }"
        @click="!c.disabled && resolve(c.id)"
      >
        {{ c.label }}
        <span v-if="revealOutcomes && c.isBest" class="event-prompt__badge event-prompt__badge--best">★ Best</span>
        <span v-if="revealOutcomes && c.isSafe" class="event-prompt__badge event-prompt__badge--safe">🛡 Safe</span>
        <span v-if="c.details" class="event-prompt__details">{{ c.details }}</span>
      </button>
    </div>
  </div>
</template>
