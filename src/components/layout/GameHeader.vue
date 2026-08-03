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
  <header class="game">
    <h1 class="game__title">
      Continental — {{ branchName }}
      <span v-if="isHq" class="game__hqbadge">HQ</span>
    </h1>
    <div class="game__currencies">
      <div class="game__currency">
        <span class="game__currency__label">Gold</span>
        <span class="game__currency__value">{{ currency }}</span>
      </div>
      <div v-if="goldenCoins !== '0'" class="game__currency">
        <span class="game__currency__label">GC</span>
        <span class="game__currency__value" style="color: #c9a84c">{{ goldenCoins }}</span>
      </div>
      <div v-if="royalMarks !== '0'" class="game__currency">
        <span class="game__currency__label">RM</span>
        <span class="game__currency__value" style="color: #b8860b">{{ royalMarks }}</span>
      </div>
      <div class="game__currency">
        <span class="game__currency__label">Income</span>
        <span class="game__currency__value game__currency__income">{{ income }}</span>
      </div>
      <div v-if="inactiveIncome !== '0/s'" class="game__currency">
        <span class="game__currency__label">Idle</span>
        <span class="game__currency__value game__currency__income">{{ inactiveIncome }}</span>
      </div>
      <div class="game__currency">
        <span class="game__currency__label">Favor</span>
        <span class="game__currency__value game__currency__favor">{{ favor }}</span>
        <span v-if="prestigeMult > 0" class="game__currencysub">+{{ prestigeMult }}%</span>
      </div>
      <div class="game__currency">
        <span class="game__currency__label">Prestige</span>
        <span class="game__currency__value">{{ prestige }}</span>
      </div>
      <div class="game__currency">
        <span class="game__currency__label">Rep</span>
        <span class="game__currency__value">{{ reputation }}</span>
      </div>
      <div class="game__currency">
        <span class="game__currency__label">Guests</span>
        <span class="game__currency__value">{{ satisfaction }}%</span>
      </div>
      <div v-if="permBonus > 0" class="game__currency">
        <span class="game__currency__label">Perm</span>
        <span class="game__currency__value game__currency__income">+{{ permBonus }}%</span>
      </div>
      <div class="heat__meter" :class="{ 'heat__meter__critical': heat >= 8 }">
        <span class="heat__meter__label">Heat</span>
        <div class="heat__meter__bar">
          <div class="heat__meter__fill" :style="{ width: (heat / 10 * 100) + '%' }"></div>
        </div>
        <span class="heat__meter__value">{{ heat }}/10</span>
        <span v-if="heat >= 8" class="heat__meter__warning">?</span>
      </div>
      <div v-if="debtCount > 0" class="game__currency game__currency__debt" :class="{ 'game__currency__debtwarn': debtWarning }">
        <span class="game__currency__label">Debt</span>
        <span class="game__currency__value">{{ debtTotal }} ({{ debtCount }})</span>
        <span v-if="debtWarning" class="game__currency__warning">?</span>
      </div>
      <div v-if="graceMinutes > 0" class="game__currency game__currency__grace">
        <span class="game__currency__label">Grace</span>
        <span class="game__currency__value">{{ graceMinutes }}m</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.heat__meter {
	display: flex;
	align-items: center;
	gap: var(--gap-xs);
}

.heat__meter__label {
	font-size: var(--font-xs);
	color: var(--text-dim);
	text-transform: uppercase;
}

.heat__meter__bar {
	width: 80px;
	height: 5px;
	background: var(--bg-primary);
	border: none;
	border-radius: 3px;
	overflow: hidden;
}

.heat__meter__fill {
	height: 100%;
	background: linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-red) 100%);
	transition: width var(--duration-normal) var(--ease-out);
	border-radius: 3px;
}

.heat__meter__value {
	font-size: var(--font-xs);
	color: var(--accent-red);
}

.heat__meter__critical .heat__meter__fill {
	background: var(--accent-red);
	animation: heat-pulse 0.8s infinite alternate;
}

.heat__meter__critical .heat__meter__value {
	color: var(--accent-red);
	font-weight: bold;
}

.heat__meter__warning {
	font-size: var(--font-md);
	color: var(--accent-red);
	animation: heat-pulse 0.8s infinite alternate;
}

.game__currency__debtwarn {
	animation: heat-pulse 0.8s infinite alternate;
}

.game__currency__debtwarn .game__currency__value {
	color: var(--accent-red);
}

.game__currency__warning {
	font-size: var(--font-md);
	color: var(--accent-red);
}

.game__hqbadge {
	display: inline-block;
	font-size: var(--font-xs);
	background: var(--accent-gold);
	color: var(--bg-primary);
	padding: var(--gap-xs) var(--gap-xs);
	margin-left: var(--gap-xs);
	letter-spacing: 1px;
}

.game__currencysub {
	font-size: var(--font-xs);
	color: var(--accent-gold);
	margin-left: var(--gap-xs);
}

.game__currency__grace .game__currency__label,
.game__currency__grace .game__currency__value {
	color: var(--accent-blue);
}

@keyframes heat-pulse {
	from {
		opacity: 0.6;
	}

	to {
		opacity: 1;
	}
}
</style>
