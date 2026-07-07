<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/game-state'
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
const offlineEfficiencyPct = ref(50)

function check() {
  const state = gameState.get()
  const offlineSeconds = state.lastOfflineSeconds
  const storedEarnings = state.lastOfflineEarnings
  if (offlineSeconds < 10 || storedEarnings <= 0) return

  visible.value = true
  offlineTimeDisplay.value = formatTime(offlineSeconds)
  totalEarned.value = formatNumber(storedEarnings)

  const efficiency = 0.5 + getTotalOfflineEfficiency()
  offlineEfficiencyPct.value = Math.round(efficiency * 100)

  const breakdown = state.lastOfflineBreakdown
  const list: OfflineEarning[] = []
  for (const [branchId, amount] of Object.entries(breakdown)) {
    if (amount > 0) {
      list.push({
        branchId: branchId as BranchId,
        branchName: getBranchDef(branchId as BranchId)?.name || branchId,
        amount: formatNumber(amount),
      })
    }
  }
  list.sort((a, b) => {
    const aVal = breakdown[a.branchId] || 0
    const bVal = breakdown[b.branchId] || 0
    return bVal - aVal
  })
  earnings.value = list
}

function dismiss() {
  visible.value = false
  gameState.clearOfflineEarnings()
}

let checkTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  checkTimeout = setTimeout(check, 500)
})

onUnmounted(() => {
  if (checkTimeout) clearTimeout(checkTimeout)
})
</script>

<template>
  <div v-if="visible" class="game-panel" @click.self="dismiss">
    <div class="game-panel__content" role="dialog" aria-modal="true" aria-labelledby="offline-title">
      <h2 id="offline-title" class="game-panel__title">Welcome Back</h2>
      <div class="offline-progress">
        <p class="offline-progress__time">You were away for {{ offlineTimeDisplay }}</p>
        <p class="offline-progress__efficiency">Offline efficiency: {{ offlineEfficiencyPct }}%</p>
        <p class="offline-progress__total">Total earnings: {{ totalEarned }}</p>
        <div class="offline-progress__list">
          <div v-for="e in earnings" :key="e.branchId" class="offline-progress__row">
            <span class="offline-progress__branch">{{ e.branchName }}</span>
            <span class="offline-progress__amount">{{ e.amount }}</span>
          </div>
        </div>
        <button class="offline-progress__btn" @click="dismiss" aria-label="Collect offline earnings">COLLECT</button>
      </div>
    </div>
  </div>
</template>
