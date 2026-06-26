<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gameState } from '@/engine/game-state'
import { getBranchIncomePerSecond } from '@/engine/income-engine'
import { getTotalOfflineEfficiency } from '@/engine/skill-manager'
import { formatNumber, formatTime } from '@/engine/format'
import { getBranchDef } from '@/data/branches'
import type { BranchId } from '@/types'

interface OfflineEarning {
  branchId: BranchId
  branchName: string
  amount: string
}

const visible = ref(false)
const offlineTimeDisplay = ref('')
const totalEarned = ref('0')
const earnings = ref<OfflineEarning[]>([])

function check() {
  const state = gameState.get()
  const offlineSeconds = state.lastOfflineSeconds
  const storedEarnings = state.lastOfflineEarnings
  if (offlineSeconds < 10 || storedEarnings <= 0) return

  visible.value = true
  offlineTimeDisplay.value = formatTime(offlineSeconds)

  const offlineRate = 0.5 + getTotalOfflineEfficiency()
  const list: OfflineEarning[] = []

  state.worldMap.unlockedBranches.forEach(branchId => {
    const income = getBranchIncomePerSecond(branchId)
    const earned = income * offlineSeconds * offlineRate
    if (earned > 0) {
      list.push({
        branchId,
        branchName: getBranchDef(branchId)?.name || branchId,
        amount: formatNumber(earned),
      })
    }
  })

  totalEarned.value = formatNumber(storedEarnings)
  earnings.value = list

  gameState.clearOfflineEarnings()
}

function dismiss() {
  visible.value = false
}

onMounted(() => {
  setTimeout(check, 500)
})
</script>

<template>
  <div v-if="visible" class="game-panel" @click.self="dismiss">
    <div class="game-panel__content">
      <h2 class="game-panel__title">Welcome Back</h2>
      <div class="offline-progress">
        <p class="offline-progress__time">You were away for {{ offlineTimeDisplay }}</p>
        <p class="offline-progress__total">Total earnings: {{ totalEarned }}</p>
        <div class="offline-progress__list">
          <div v-for="e in earnings" :key="e.branchId" class="offline-progress__row">
            <span class="offline-progress__branch">{{ e.branchName }}</span>
            <span class="offline-progress__amount">{{ e.amount }}</span>
          </div>
        </div>
        <button class="offline-progress__btn" @click="dismiss">COLLECT</button>
      </div>
    </div>
  </div>
</template>
