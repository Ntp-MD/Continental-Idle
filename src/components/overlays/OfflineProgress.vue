<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/gameState'
import { getTotalOfflineEfficiency } from '@/engine/skillManager'
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
  <div v-if="visible" class="panel" @click.self="dismiss">
    <div class="panel__content" role="dialog" aria-modal="true" aria-labelledby="offline__title">
      <h2 id="offline__title" class="panel__title">Welcome Back</h2>
      <div class="offline__progress">
        <p class="offline__progress__time">You were away for {{ offlineTimeDisplay }}</p>
        <p class="offline__progress__efficiency">Offline efficiency: {{ offlineEfficiencyPct }}%</p>
        <p class="offline__progress__total">Total earnings: {{ totalEarned }}</p>
        <div class="offline__progress__list">
          <div v-for="e in earnings" :key="e.branchId" class="offline__progress__row">
            <span class="offline__progress__branch">{{ e.branchName }}</span>
            <span class="offline__progress__amount">{{ e.amount }}</span>
          </div>
        </div>
        <button class="btn btn__gold btn__block" @click="dismiss" aria-label="Collect offline earnings">COLLECT</button>
      </div>
    </div>
  </div>
</template>
