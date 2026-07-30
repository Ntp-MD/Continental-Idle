<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/gameState'
import { getBranchIncomePerSecond } from '@/engine/incomeEngine'
import { getTotalDebt, getDebtCount } from '@/engine/debtManager'
import { formatNumber, formatIncome } from '@/engine/format'
import { eventBus } from '@/engine/eventBus'
import { getBranchDef } from '@/data/branches'

const currency = ref('0')
const goldenCoins = ref('0')
const royalMarks = ref('0')
const income = ref('0/s')
const favor = ref('0')
const prestige = ref(0)
const branchName = ref('')
const heat = ref(0)
const debtTotal = ref('0')
const debtCount = ref(0)
const debtWarning = ref(false)
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

  const incomePerSec = getBranchIncomePerSecond()
  const totalDebtNum = getTotalDebt()
  currency.value = formatNumber(branch.currency)
  goldenCoins.value = formatNumber(Math.floor(state.goldenCoins))
  royalMarks.value = formatNumber(Math.floor(state.royalMarks))
  income.value = formatIncome(incomePerSec)
  favor.value = formatNumber(state.tableFavor)
  prestige.value = branch.prestige
  branchName.value = def.name
  heat.value = branch.heatLevel
  debtTotal.value = formatNumber(totalDebtNum)
  debtCount.value = getDebtCount()
  const debtInterestPerSec = totalDebtNum * 0.01 / 60
  debtWarning.value = debtCount.value > 0 && debtInterestPerSec > incomePerSec
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
      const inactiveBranch = state.branches[tid]
      if (!inactiveBranch) return
      const rate = inactiveBranch.upgrades.includes('continentalCharter') ? 0.6 : 0.5
      inactiveTotal += getBranchIncomePerSecond(tid) * rate
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
  <header class="game_header">
    <h1 class="game_header__title">
      Continental — {{ branchName }}
      <span v-if="isHq" class="game_header__hq_badge">HQ</span>
    </h1>
    <div class="game_header__currencies">
      <div class="game_header__currency">
        <span class="game_header__currency_label">Gold</span>
        <span class="game_header__currency_value">{{ currency }}</span>
      </div>
      <div v-if="goldenCoins !== '0'" class="game_header__currency">
        <span class="game_header__currency_label">GC</span>
        <span class="game_header__currency_value" style="color: #c9a84c">{{ goldenCoins }}</span>
      </div>
      <div v-if="royalMarks !== '0'" class="game_header__currency">
        <span class="game_header__currency_label">RM</span>
        <span class="game_header__currency_value" style="color: #b8860b">{{ royalMarks }}</span>
      </div>
      <div class="game_header__currency">
        <span class="game_header__currency_label">Income</span>
        <span class="game_header__currency_value game_header__currency_value__income">{{ income }}</span>
      </div>
      <div v-if="inactiveIncome !== '0/s'" class="game_header__currency">
        <span class="game_header__currency_label">Idle</span>
        <span class="game_header__currency_value game_header__currency_value__income">{{ inactiveIncome }}</span>
      </div>
      <div class="game_header__currency">
        <span class="game_header__currency_label">Favor</span>
        <span class="game_header__currency_value game_header__currency_value__favor">{{ favor }}</span>
        <span v-if="prestigeMult > 0" class="game_header__currency_sub">+{{ prestigeMult }}%</span>
      </div>
      <div class="game_header__currency">
        <span class="game_header__currency_label">Prestige</span>
        <span class="game_header__currency_value">{{ prestige }}</span>
      </div>
      <div class="game_header__currency">
        <span class="game_header__currency_label">Rep</span>
        <span class="game_header__currency_value">{{ reputation }}</span>
      </div>
      <div class="game_header__currency">
        <span class="game_header__currency_label">Guests</span>
        <span class="game_header__currency_value">{{ satisfaction }}%</span>
      </div>
      <div v-if="permBonus > 0" class="game_header__currency">
        <span class="game_header__currency_label">Perm</span>
        <span class="game_header__currency_value game_header__currency_value__income">+{{ permBonus }}%</span>
      </div>
      <div class="heat_meter" :class="{ 'heat_meter__critical': heat >= 8 }">
        <span class="heat_meter__label">Heat</span>
        <div class="heat_meter__bar">
          <div class="heat_meter__fill" :style="{ width: (heat / 10 * 100) + '%' }"></div>
        </div>
        <span class="heat_meter__value">{{ heat }}/10</span>
        <span v-if="heat >= 8" class="heat_meter__warning">?</span>
      </div>
      <div v-if="debtCount > 0" class="game_header__currency game_header__currency__debt" :class="{ 'game_header__currency__debt_warning': debtWarning }">
        <span class="game_header__currency_label">Debt</span>
        <span class="game_header__currency_value">{{ debtTotal }} ({{ debtCount }})</span>
        <span v-if="debtWarning" class="game_header__currency_warning">?</span>
      </div>
      <div v-if="graceMinutes > 0" class="game_header__currency game_header__currency__grace">
        <span class="game_header__currency_label">Grace</span>
        <span class="game_header__currency_value">{{ graceMinutes }}m</span>
      </div>
    </div>
  </header>
</template>
