<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gameState } from '@/engine/gameState'
import { eventBus } from '@/engine/eventBus'

interface BuffDisplay {
  id: string
  label: string
  type: 'buff' | 'debuff'
  remaining: number
  maxDuration: number
}

const buffs = ref<BuffDisplay[]>([])

function update() {
  const state = gameState.get()
  const now = Date.now()
  const result: BuffDisplay[] = []

  state.activeBuffs.forEach(b => {
    if (b.expiresAt === null || b.expiresAt <= now) return
    const remaining = Math.ceil((b.expiresAt - now) / 1000)

    if (b.type === 'incomeMultiplier') {
      result.push({
        id: b.id,
        label: `Income x${b.value}`,
        type: 'buff',
        remaining,
        maxDuration: remaining,
      })
    } else if (b.type === 'incomeFreeze') {
      result.push({
        id: b.id,
        label: 'Income Frozen',
        type: 'debuff',
        remaining,
        maxDuration: remaining,
      })
    }
  })

  buffs.value = result
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
  <div v-if="buffs.length > 0" class="buff">
    <div
      v-for="b in buffs"
      :key="b.id"
      class="buff__item"
      :class="b.type === 'debuff' ? 'buff__item__debuff' : 'buff__item__buff'"
    >
      <span class="buff__label">{{ b.label }}</span>
      <span class="buff__timer">{{ b.remaining }}s</span>
    </div>
  </div>
</template>

<style scoped>
.buff {
	display: flex;
	gap: var(--gap-xs);
	padding: var(--gap-xs) var(--gap-sm);
	background: var(--bg-secondary);
	border-bottom: 1px solid var(--border-dim);
	flex-shrink: 0;
	overflow-x: auto;
}

.buff__item {
	display: flex;
	align-items: center;
	gap: var(--gap-xs);
	font-size: var(--font-xs);
	font-weight: 500;
	padding: var(--gap-xs) var(--gap-sm);
	border: 1px solid;
	border-radius: 100px;
	flex-shrink: 0;
}

.buff__item__buff {
	border-color: var(--accent-green);
	color: var(--accent-green);
	background: color-mix(in srgb, var(--accent-green) 10%, transparent);
}

.buff__item__debuff {
	border-color: var(--accent-red);
	color: var(--accent-red);
	background: color-mix(in srgb, var(--accent-red) 10%, transparent);
}

.buff__timer {
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
</style>
