<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getBranchDef } from '@/data/branches'
import { AI_TEMPERAMENTS } from '@/data/aiOwners'
import {
  getAllAIOwners, getPowerBalance, getThreatLevel,
  sendGift, canSendGift, proposeTruce, canProposeTruce
} from '@/engine/aiOwnerManager'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/eventBus'
import type { AIOwnerState, BranchId } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const ACTION_DEBOUNCE_MS = 200

function createDebouncedAction<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  let lastCall = 0
  return (...args: A) => {
    const now = Date.now()
    if (now - lastCall < ACTION_DEBOUNCE_MS) return
    lastCall = now
    fn(...args)
  }
}

const owners = ref<AIOwnerState[]>([])
const playerPower = ref(0)
const aiPower = ref(0)
const ratio = ref(0)

function refresh() {
  if (!props.visible) return
  owners.value = [...getAllAIOwners()].sort((a, b) => b.power - a.power)
  const balance = getPowerBalance()
  playerPower.value = balance.player
  aiPower.value = balance.ai
  ratio.value = balance.ratio
}

const activeOwners = computed(() => owners.value.filter(o => !o.defeated))
const defeatedOwners = computed(() => owners.value.filter(o => o.defeated))

const balanceLabel = computed(() => {
  if (ratio.value === Infinity) return 'Supreme'
  if (ratio.value > 3) return 'Dominant'
  if (ratio.value > 1.5) return 'Strong'
  if (ratio.value > 0.8) return 'Contested'
  if (ratio.value > 0.4) return 'Vulnerable'
  return 'Overwhelmed'
})

const balanceColor = computed(() => {
  if (ratio.value === Infinity || ratio.value > 3) return '#4caf50'
  if (ratio.value > 1.5) return '#8bc34a'
  if (ratio.value > 0.8) return '#ff9800'
  if (ratio.value > 0.4) return '#ff5722'
  return '#f44336'
})

function getTemperamentColor(temperament: string): string {
  return AI_TEMPERAMENTS[temperament as keyof typeof AI_TEMPERAMENTS]?.color ?? '#888'
}

function getTemperamentIcon(temperament: string): string {
  return AI_TEMPERAMENTS[temperament as keyof typeof AI_TEMPERAMENTS]?.icon ?? '?'
}

function getTemperamentName(temperament: string): string {
  return AI_TEMPERAMENTS[temperament as keyof typeof AI_TEMPERAMENTS]?.name ?? temperament
}

function getThreatColor(branchId: BranchId): string {
  const threat = getThreatLevel(branchId)
  switch (threat) {
    case 'critical': return '#f44336'
    case 'high': return '#ff5722'
    case 'medium': return '#ff9800'
    default: return '#4caf50'
  }
}

function getThreatLabel(branchId: BranchId): string {
  const threat = getThreatLevel(branchId)
  return threat.charAt(0).toUpperCase() + threat.slice(1)
}

function getPowerPercent(owner: AIOwnerState): number {
  const maxDisplay = Math.max(owner.power, playerPower.value, 1)
  return (owner.power / maxDisplay) * 100
}

function getRelationsLabel(relations: number): string {
  if (relations > 30) return 'Friendly'
  if (relations > 0) return 'Tolerant'
  if (relations > -30) return 'Hostile'
  return 'Nemesis'
}

function getRelationsColor(relations: number): string {
  if (relations > 30) return '#4caf50'
  if (relations > 0) return '#8bc34a'
  if (relations > -30) return '#ff9800'
  return '#f44336'
}

function doSendGift(branchId: BranchId) {
  if (sendGift(branchId)) {
    refresh()
  }
}

function doProposeTruce(branchId: BranchId) {
  if (proposeTruce(branchId)) {
    refresh()
  }
}

interface RelationLogEntry {
  id: number
  text: string
  time: string
  type: 'gift' | 'truce' | 'ai'
}

const relationLog = ref<RelationLogEntry[]>([])
let logCounter = 0
const MAX_LOG_ENTRIES = 10

function addRelationLog(text: string, type: 'gift' | 'truce' | 'ai') {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  relationLog.value.unshift({ id: ++logCounter, text, time, type })
  if (relationLog.value.length > MAX_LOG_ENTRIES) {
    relationLog.value = relationLog.value.slice(0, MAX_LOG_ENTRIES)
  }
}

function handleDiplomacyGiftLog(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string; gain: number }
  addRelationLog(`Gift to ${detail.ownerName} (+${detail.gain})`, 'gift')
}

function handleDiplomacyTruceLog(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string }
  addRelationLog(`Truce with ${detail.ownerName} (+20)`, 'truce')
}

function handleAIActionLog(e: Event) {
  const detail = (e as CustomEvent).detail as { ownerName: string; eventType: string }
  addRelationLog(`${detail.ownerName}: ${detail.eventType}`, 'ai')
}

const debouncedDoSendGift = createDebouncedAction(doSendGift)
const debouncedDoProposeTruce = createDebouncedAction(doProposeTruce)

onMounted(() => {
  refresh()
  eventBus.on('income:tick', refresh)
  eventBus.on('ai:action', refresh)
  eventBus.on('ai:defeated', refresh)
  eventBus.on('takeover:complete', refresh)
  eventBus.on('branch:unlock', refresh)
  eventBus.on('diplomacy:gift', refresh)
  eventBus.on('diplomacy:truce', refresh)
  eventBus.on('diplomacy:gift', handleDiplomacyGiftLog)
  eventBus.on('diplomacy:truce', handleDiplomacyTruceLog)
  eventBus.on('ai:action', handleAIActionLog)
})

onUnmounted(() => {
  eventBus.off('income:tick', refresh)
  eventBus.off('ai:action', refresh)
  eventBus.off('ai:defeated', refresh)
  eventBus.off('takeover:complete', refresh)
  eventBus.off('branch:unlock', refresh)
  eventBus.off('diplomacy:gift', refresh)
  eventBus.off('diplomacy:truce', refresh)
  eventBus.off('diplomacy:gift', handleDiplomacyGiftLog)
  eventBus.off('diplomacy:truce', handleDiplomacyTruceLog)
  eventBus.off('ai:action', handleAIActionLog)
})
</script>

<template>
  <div v-if="visible" class="panel" @click.self="emit('close')">
    <div class="panel__content powerbalance__panel" role="dialog" aria-modal="true" aria-labelledby="powerbalance__title">
      <h2 id="powerbalance__title" class="panel__title">Power Balance</h2>

      <!-- Balance Summary -->
      <section class="powerbalance__summary">
        <div class="powerbalance__bars">
          <div class="powerbalance__bar powerbalance__bar__player">
            <span class="powerbalance__barlabel">You</span>
            <div class="powerbalance__bartrack">
              <div class="powerbalance__barfill powerbalance__barfill__player"
                :style="{ width: (playerPower + aiPower > 0 ? Math.min(100, (playerPower / (playerPower + aiPower)) * 100) : 50) + '%' }">
              </div>
            </div>
            <span class="powerbalance__barvalue">{{ formatNumber(playerPower) }}</span>
          </div>
          <div class="powerbalance__bar powerbalance__bar__ai">
            <span class="powerbalance__barlabel">AI</span>
            <div class="powerbalance__bartrack">
              <div class="powerbalance__barfill powerbalance__barfill__ai"
                :style="{ width: (playerPower + aiPower > 0 ? Math.min(100, (aiPower / (playerPower + aiPower)) * 100) : 50) + '%' }">
              </div>
            </div>
            <span class="powerbalance__barvalue">{{ formatNumber(aiPower) }}</span>
          </div>
        </div>
        <div class="powerbalance__status" :style="{ color: balanceColor }">
          Status: {{ balanceLabel }}
        </div>
      </section>

      <!-- AI Owners List -->
      <section class="powerbalance__section">
        <h3 class="powerbalance__heading">AI Controllers ({{ activeOwners.length }} active)</h3>
        <div v-if="activeOwners.length === 0" class="powerbalance__empty">
          All AI controllers have been defeated.
        </div>
        <div v-else class="powerbalance__list">
          <div v-for="owner in activeOwners" :key="owner.branchId" class="card__panel">
            <div class="powerbalance__head">
              <span class="powerbalance__icon" :style="{ color: getTemperamentColor(owner.temperament) }">
                {{ getTemperamentIcon(owner.temperament) }}
              </span>
              <span class="powerbalance__ownername">{{ owner.name }}</span>
              <span class="powerbalance__branchname">{{ getBranchDef(owner.branchId)?.name }}</span>
              <span class="powerbalance__threatbadge" :style="{ color: getThreatColor(owner.branchId), borderColor: getThreatColor(owner.branchId) }">
                {{ getThreatLabel(owner.branchId) }}
              </span>
            </div>
            <div class="powerbalance__ownerstats">
              <span class="powerbalance__stat">
                Power: <strong>{{ formatNumber(owner.power) }}</strong>
              </span>
              <span class="powerbalance__stat">
                Type: <strong>{{ getTemperamentName(owner.temperament) }}</strong>
              </span>
              <span class="powerbalance__stat">
                Relations: <span :style="{ color: getRelationsColor(owner.relations) }">{{ getRelationsLabel(owner.relations) }}</span>
              </span>
            </div>
            <div class="powerbalance__powerbar">
              <div class="powerbalance__powerfill"
                :style="{ width: getPowerPercent(owner) + '%', background: getTemperamentColor(owner.temperament) }">
              </div>
            </div>
            <div class="powerbalance__diplomacy">
              <button
                class="powerbalance__diplobtn"
                :disabled="!canSendGift(owner.branchId)"
                @click="debouncedDoSendGift(owner.branchId)"
              >Send Gift (500K)</button>
              <button
                class="powerbalance__diplobtn"
                :disabled="!canProposeTruce(owner.branchId)"
                @click="debouncedDoProposeTruce(owner.branchId)"
              >Propose Truce (5 GC)</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Defeated Owners -->
      <section v-if="defeatedOwners.length > 0" class="powerbalance__section">
        <h3 class="powerbalance__heading">Defeated ({{ defeatedOwners.length }})</h3>
        <div class="powerbalance__defeateds">
          <span v-for="owner in defeatedOwners" :key="owner.branchId" class="powerbalance__defeatedone">
            {{ getTemperamentIcon(owner.temperament) }} {{ owner.name }} ({{ getBranchDef(owner.branchId)?.name }})
          </span>
        </div>
      </section>

      <!-- Relations Log -->
      <section v-if="relationLog.length > 0" class="powerbalance__section">
        <h3 class="powerbalance__heading">Relations Log</h3>
        <div class="powerbalance__log">
          <div v-for="entry in relationLog" :key="entry.id" class="powerbalance__entry" :class="'powerbalance__entry__' + entry.type">
            <span class="powerbalance__logtime">{{ entry.time }}</span>
            <span class="powerbalance__logtext">{{ entry.text }}</span>
          </div>
        </div>
      </section>

      <button class="panel__close" @click="emit('close')" aria-label="Close power balance panel">✕</button>
    </div>
  </div>
</template>
