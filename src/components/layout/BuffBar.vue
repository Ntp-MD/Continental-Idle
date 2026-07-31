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
