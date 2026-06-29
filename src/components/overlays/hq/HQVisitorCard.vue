<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { VisitorEntry } from '@/types'
import { STAFF_MAP } from '@/data/staff'
import { ASSASSIN_MAP } from '@/data/assassins'
import { getRarityColor, getRarityCostMult } from '@/data/rarity'
import { formatNumber } from '@/engine/format'

const props = defineProps<{
  visitor: VisitorEntry
  branchCurrency: number
}>()

const emit = defineEmits<{ hire: [id: string], dismiss: [id: string] }>()

const now = ref(Date.now())
let timerId: number | null = null

onMounted(() => {
  timerId = window.setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

const timeLeft = computed(() => {
  const remaining = Math.max(0, Math.ceil((props.visitor.expiresAt - now.value) / 1000))
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return `${mins}m ${secs}s`
})

const isExpiringSoon = computed(() => {
  return (props.visitor.expiresAt - now.value) < 300000
})

function getTypeName(v: VisitorEntry): string {
  if (v.isAssassin) return ASSASSIN_MAP[v.typeId]?.name || v.typeId
  return STAFF_MAP[v.typeId]?.name || v.typeId
}

function getHireCost(v: VisitorEntry): number {
  const def = v.isAssassin ? ASSASSIN_MAP[v.typeId] : STAFF_MAP[v.typeId]
  if (!def) return Infinity
  return Math.ceil(def.hireCost * getRarityCostMult(v.rarity))
}

function canAfford(v: VisitorEntry): boolean {
  return props.branchCurrency >= getHireCost(v)
}

function traitList(v: VisitorEntry): string {
  return v.traits.join(', ') || '—'
}
</script>

<template>
  <div class="hq-visitor-card">
    <div class="hq-visitor-card__header" :style="{ borderColor: getRarityColor(props.visitor.rarity) }">
      <span class="hq-visitor-card__rarity" :style="{ color: getRarityColor(props.visitor.rarity) }">{{ props.visitor.rarity }}</span>
      <span class="hq-visitor-card__name">{{ getTypeName(props.visitor) }}</span>
      <span class="hq-visitor-card__type">{{ props.visitor.isAssassin ? 'Assassin' : 'Staff' }}</span>
    </div>
    <div class="hq-visitor-card__stats">
      <div class="hq-visitor-card__stat"><span>PREC</span><b>{{ props.visitor.stats.precision }}</b></div>
      <div class="hq-visitor-card__stat"><span>SPD</span><b>{{ props.visitor.stats.speed }}</b></div>
      <div class="hq-visitor-card__stat"><span>CHA</span><b>{{ props.visitor.stats.charisma }}</b></div>
      <div class="hq-visitor-card__stat"><span>LCK</span><b>{{ props.visitor.stats.luck }}</b></div>
    </div>
    <div class="hq-visitor-card__traits">Traits: {{ traitList(props.visitor) }}</div>
    <div class="hq-visitor-card__timer" :class="{ 'hq-visitor-card__timer--urgent': isExpiringSoon }">
      Leaves in {{ timeLeft }}
    </div>
    <div class="hq-visitor-card__actions">
      <button
        class="hq-visitor-card__hire"
        :disabled="!canAfford(props.visitor)"
        @click="emit('hire', props.visitor.id)"
      >Hire ({{ formatNumber(getHireCost(props.visitor)) }})</button>
      <button class="hq-visitor-card__dismiss" @click="emit('dismiss', props.visitor.id)">Dismiss</button>
    </div>
  </div>
</template>

<style scoped>
.hq-visitor-card {
  background: #1a1a1a;
  border: 1px solid #8a7340;
  border-radius: 6px;
  padding: 10px;
  min-width: 200px;
}
.hq-visitor-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid;
  padding-bottom: 6px;
  margin-bottom: 8px;
}
.hq-visitor-card__rarity {
  font-weight: bold;
  font-size: 14px;
}
.hq-visitor-card__name {
  font-family: Georgia, serif;
  color: #c9a84c;
  font-size: 13px;
}
.hq-visitor-card__type {
  font-size: 10px;
  color: #666;
  margin-left: auto;
}
.hq-visitor-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 4px;
  margin-bottom: 6px;
}
.hq-visitor-card__stat {
  text-align: center;
  font-size: 10px;
  color: #888;
}
.hq-visitor-card__stat b {
  display: block;
  color: #c9a84c;
  font-size: 13px;
}
.hq-visitor-card__traits {
  font-size: 10px;
  color: #777;
  margin-bottom: 8px;
}
.hq-visitor-card__timer {
  font-size: 10px;
  color: #888;
  margin-bottom: 8px;
  text-align: right;
}
.hq-visitor-card__timer--urgent {
  color: #ff5722;
  font-weight: bold;
}
.hq-visitor-card__actions {
  display: flex;
  gap: 6px;
}
.hq-visitor-card__hire {
  flex: 1;
  background: #c9a84c;
  color: #1a1a1a;
  border: none;
  border-radius: 4px;
  padding: 6px;
  font-size: 11px;
  cursor: pointer;
  font-weight: bold;
}
.hq-visitor-card__hire:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}
.hq-visitor-card__dismiss {
  background: #333;
  color: #999;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
}
</style>
