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
        <button class="btn__gold" @click="dismiss" aria-label="Collect offline earnings">COLLECT</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === Offline Progress Panel === */
.offline__progress {
	display: flex;
	flex-direction: column;
	gap: var(--gap-sm);
}

.offline__progress__time,
.offline__progress__efficiency,
.offline__progress__total {
	font-size: var(--font-sm);
	color: var(--text-secondary);
	text-align: center;
}

.offline__progress__total {
	color: var(--accent-gold);
	font-weight: 600;
	font-size: var(--font-md);
}

.offline__progress__list {
	display: flex;
	flex-direction: column;
	gap: var(--gap-xs);
	padding: var(--gap-sm);
	background: var(--bg-tertiary);
	border: 1px solid var(--border-dim);
	border-radius: var(--radius-sm);
	max-height: 40vh;
	overflow-y: auto;
}

.offline__progress__row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: var(--font-sm);
}

.offline__progress__branch {
	color: var(--text-secondary);
}

.offline__progress__amount {
	color: var(--accent-green);
	font-weight: 600;
}

.offline__progress .btn {
	margin-top: var(--gap-md);
	padding: var(--gap-sm) var(--gap-lg);
	font-size: var(--font-md);
	font-weight: 700;
	letter-spacing: 1px;
	transition: transform var(--duration-fast) var(--ease-out);
}

.offline__progress .btn:hover {
	transform: scale(1.03);
}
</style>
