<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/game-state'
import { getBranchIncomePerSecond } from '@/engine/income-engine'
import { getTotalDebt, getDebtCount } from '@/engine/debt-manager'
import { formatNumber, formatIncome } from '@/engine/format'
import { eventBus } from '@/engine/event-bus'
import { getBranchDef } from '@/data/branches'

const currency = ref('0')
const income = ref('0/s')
const favor = ref('0')
const prestige = ref(0)
const branchName = ref('')
const heat = ref(0)
const debtTotal = ref('0')
const debtCount = ref(0)
const reputation = ref(0)
const satisfaction = ref(50)
const isHq = ref(false)
const prestigeMult = ref(0)
const permBonus = ref(0)
const inactiveIncome = ref('0/s')
const graceMinutes = ref(0)

let lastInactiveUpdate = 0

function update() {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  if (!branch) return
  const def = getBranchDef(state.activeBranch)

  currency.value = formatNumber(branch.currency)
  income.value = formatIncome(getBranchIncomePerSecond())
  favor.value = formatNumber(state.tableFavor)
  prestige.value = branch.prestige
  branchName.value = def.name
  heat.value = branch.heatLevel
  debtTotal.value = formatNumber(getTotalDebt())
  debtCount.value = getDebtCount()
  reputation.value = Math.floor(branch.reputation)
  satisfaction.value = Math.floor(branch.guestSatisfaction)
  isHq.value = state.activeBranch === state.hqBranch
  prestigeMult.value = Math.round(state.tableFavor * 2)
  permBonus.value = Math.round(state.permanentIncomeBonus * 100)

  const now = Date.now()
  if (now - lastInactiveUpdate > 5000) {
    lastInactiveUpdate = now
    let inactiveTotal = 0
    state.worldMap.unlockedBranches.forEach(tid => {
      if (tid === state.activeBranch) return
      inactiveTotal += getBranchIncomePerSecond(tid) * 0.5
    })
    inactiveIncome.value = formatIncome(inactiveTotal)
  }

  const graceMs = branch.excommunicadoGraceUntil - Date.now()
  graceMinutes.value = graceMs > 0 ? Math.ceil(graceMs / 60000) : 0
}

onMounted(() => {
  update()
  eventBus.on('income:tick', update)
  eventBus.on('income:update', update)
})

onUnmounted(() => {
  eventBus.off('income:tick', update)
  eventBus.off('income:update', update)
})
</script>

<template>
  <header class="game-header">
    <h1 class="game-header__title">
      Continental — {{ branchName }}
      <span v-if="isHq" class="game-header__hq-badge">HQ</span>
    </h1>
    <div class="game-header__currencies">
      <div class="game-header__currency">
        <span class="game-header__currency-label">Gold</span>
        <span class="game-header__currency-value">{{ currency }}</span>
      </div>
      <div class="game-header__currency">
        <span class="game-header__currency-label">Income</span>
        <span class="game-header__currency-value game-header__currency-value--income">{{ income }}</span>
      </div>
      <div v-if="inactiveIncome !== '0/s'" class="game-header__currency">
        <span class="game-header__currency-label">Idle</span>
        <span class="game-header__currency-value game-header__currency-value--income">{{ inactiveIncome }}</span>
      </div>
      <div class="game-header__currency">
        <span class="game-header__currency-label">Favor</span>
        <span class="game-header__currency-value game-header__currency-value--favor">{{ favor }}</span>
        <span v-if="prestigeMult > 0" class="game-header__currency-sub">+{{ prestigeMult }}%</span>
      </div>
      <div class="game-header__currency">
        <span class="game-header__currency-label">Prestige</span>
        <span class="game-header__currency-value">{{ prestige }}</span>
      </div>
      <div class="game-header__currency">
        <span class="game-header__currency-label">Rep</span>
        <span class="game-header__currency-value">{{ reputation }}</span>
      </div>
      <div class="game-header__currency">
        <span class="game-header__currency-label">Guests</span>
        <span class="game-header__currency-value">{{ satisfaction }}%</span>
      </div>
      <div v-if="permBonus > 0" class="game-header__currency">
        <span class="game-header__currency-label">Perm</span>
        <span class="game-header__currency-value game-header__currency-value--income">+{{ permBonus }}%</span>
      </div>
      <div class="heat-meter">
        <span class="heat-meter__label">Heat</span>
        <div class="heat-meter__bar">
          <div class="heat-meter__fill" :style="{ width: (heat / 10 * 100) + '%' }"></div>
        </div>
        <span class="heat-meter__value">{{ heat }}/10</span>
      </div>
      <div v-if="debtCount > 0" class="game-header__currency game-header__currency--debt">
        <span class="game-header__currency-label">Debt</span>
        <span class="game-header__currency-value">{{ debtTotal }} ({{ debtCount }})</span>
      </div>
      <div v-if="graceMinutes > 0" class="game-header__currency game-header__currency--grace">
        <span class="game-header__currency-label">Grace</span>
        <span class="game-header__currency-value">{{ graceMinutes }}m</span>
      </div>
    </div>
  </header>
</template>
