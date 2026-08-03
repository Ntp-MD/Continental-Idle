<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { eventEngine } from '@/engine/eventEngine'
import { eventBus } from '@/engine/eventBus'
import { gameState } from '@/engine/gameState'
import { DEFENDER_LOYALTY_THRESHOLD } from '@/engine/eventEngine'
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
  <div v-if="visible" class="event" role="dialog" aria-modal="true" aria-labelledby="event__title">
    <div class="event__header">
      <span class="event__icon">?</span>
      <span class="event__text" id="event__title">{{ eventName }}</span>
      <span class="event__timer">{{ timer }}s</span>
    </div>
    <div class="event__desc">{{ eventDesc }}</div>

    <div v-if="raidData" class="event__raidinfo">
      <div class="event__raidrow">
        <span class="event__raidlabel">Attackers:</span>
        <span class="event__raidvalue">{{ raidData.attackers.length }} (Power: {{ raidData.attackerPower }})</span>
      </div>
      <div v-for="a in raidData.attackers" :key="a.name" class="event__raidattacker">
        {{ a.name }} — Lv.{{ a.level }} | PRE {{ a.precision }} SPD {{ a.speed }}
      </div>
      <div class="event__raidrow">
        <span class="event__raidlabel">Your defenders:</span>
        <span class="event__raidvalue">{{ raidData.defenderCount }} (Power: {{ raidData.defenderPower }})</span>
      </div>
      <div v-if="raidData.defenderCount > 0" class="event__raidrow">
        <span class="event__raidlabel">Win chance:</span>
        <span class="event__raidvalue event__raidwin">{{ Math.round(raidData.winChance * 100) }}%</span>
      </div>
    </div>

    <div class="event__timerbar">
      <div class="event__timerfill" :style="{ width: (timer / maxTimer * 100) + '%' }"></div>
    </div>
    <div class="event__actions">
      <button
        v-for="c in choices"
        :key="c.id"
        :disabled="c.disabled"
        :aria-disabled="c.disabled"
        @click="!c.disabled && resolve(c.id)"
      >
        {{ c.label }}
        <span v-if="revealOutcomes && c.isBest" class="event__tag event__tag__best">? Best</span>
        <span v-if="revealOutcomes && c.isSafe" class="event__tag event__tag__safe">?? Safe</span>
        <span v-if="c.details" class="event__details">{{ c.details }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.event {
	background: var(--bg-card);
	border: 1px solid var(--accent-red);
	border-radius: var(--radius-md);
	padding: var(--gap-sm) var(--gap-md);
	display: flex;
	flex-direction: column;
	gap: var(--gap-xs);
	font-size: var(--font-sm);
	box-shadow: 0 4px 20px rgba(239, 68, 68, 0.1);
	animation: event-slide-in var(--duration-normal) var(--ease-out);
}

@keyframes event-slide-in {
	from {
		opacity: 0;
		transform: translateY(-8px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.event__header {
	display: flex;
	align-items: center;
	gap: var(--gap-sm);
	flex-shrink: 0;
}

.event__icon {
	color: var(--accent-red);
	font-size: var(--font-lg);
}

.event__text {
	flex: 1;
	color: var(--text-primary);
	font-weight: bold;
	text-transform: uppercase;
	letter-spacing: 1px;
}

.event__desc {
	flex: 1;
	color: var(--text-secondary);
	font-size: var(--font-sm);
	line-height: 1.4;
}

.event__timerbar {
	height: 3px;
	background: var(--bg-primary);
	overflow: hidden;
	flex-shrink: 0;
}

.event__timerfill {
	height: 100%;
	background: var(--accent-red);
	transition: width var(--duration-normal) linear;
}

.event__timer {
	color: var(--accent-red);
	font-weight: bold;
	flex-shrink: 0;
}

.event__actions {
	display: flex;
	gap: var(--gap-xs);
	flex-shrink: 0;
	flex-wrap: wrap;
}

.event__tag {
	display: inline-block;
	font-size: var(--font-xs);
	padding: var(--gap-xs) var(--gap-xs);
	border-radius: var(--radius-xs);
	margin-left: var(--gap-xs);
	font-weight: 700;
}

.event__tag__best {
	background: color-mix(in srgb, var(--accent-gold) 20%, transparent);
	color: var(--accent-gold);
}

.event__tag__safe {
	background: color-mix(in srgb, var(--accent-green) 20%, transparent);
	color: var(--accent-green);
}

.event__details {
	display: block;
	font-size: var(--font-xs);
	color: var(--text-dim);
	margin-top: var(--gap-xs);
	font-style: italic;
}

.event__raidinfo {
	display: flex;
	flex-direction: column;
	gap: var(--gap-xs);
	padding: var(--gap-xs) var(--gap-sm);
	border: 1px solid var(--border-dim);
	background: var(--bg-primary);
	font-size: var(--font-xs);
}

.event__raidrow {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.event__raidlabel {
	color: var(--text-secondary);
}

.event__raidvalue {
	color: var(--text-primary);
	font-weight: bold;
}

.event__raidwin {
	color: var(--accent-gold);
}

.event__raidattacker {
	color: var(--accent-red);
	font-size: var(--font-xs);
	padding-left: var(--gap-sm);
}
</style>
