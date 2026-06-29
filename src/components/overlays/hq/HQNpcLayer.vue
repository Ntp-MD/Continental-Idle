<script setup lang="ts">
import { GOLD, GOLD_DIM } from './hq-layout'
import { getRarityColor } from '@/data/rarity'
import type { Rarity } from '@/types'

export interface NpcDot {
  id: string
  x: number
  y: number
  color: string
  name: string
  profession: string
  level: number
  rarity: Rarity
  isVisitor?: boolean
  floor?: string
}

const props = defineProps<{
  dots: NpcDot[]
  showLabels: boolean
  selectedNpcId: string | null
}>()

const emit = defineEmits<{ click: [dot: NpcDot] }>()

function rarityColor(rarity: Rarity): string {
  return getRarityColor(rarity)
}
</script>

<template>
  <g>
    <!-- NPC dots -->
    <g v-for="dot in props.dots" :key="dot.id">
      <!-- Rarity ring -->
      <circle :cx="dot.x" :cy="dot.y" r="6" :fill="rarityColor(dot.rarity)" :opacity="0.3"/>
      <!-- Main dot -->
      <circle
        :cx="dot.x" :cy="dot.y" r="4"
        :fill="dot.color"
        stroke="#fff"
        stroke-width="0.8"
        :class="{ 'hq-npc-dot--selected': dot.id === props.selectedNpcId, 'hq-npc-dot--visitor': dot.isVisitor }"
        @click="emit('click', dot)"
        style="cursor: pointer"
      />
      <!-- Visitor pulsing ring -->
      <circle v-if="dot.isVisitor" :cx="dot.x" :cy="dot.y" r="10" fill="none" :stroke="GOLD" stroke-width="1" opacity="0.5">
        <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <!-- Visitor ! icon -->
      <text v-if="dot.isVisitor" :x="dot.x" :y="dot.y - 12" text-anchor="middle" font-size="10" :fill="GOLD" font-weight="bold">!</text>
      <!-- Labels -->
      <g v-if="props.showLabels">
        <text :x="dot.x" :y="dot.y - 8" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD">{{ dot.name }}</text>
        <text :x="dot.x" :y="dot.y + 14" text-anchor="middle" font-family="Georgia,serif" font-size="6" :fill="GOLD_DIM">{{ dot.profession }} Lv.{{ dot.level }}</text>
      </g>
      <!-- Rarity badge -->
      <text :x="dot.x + 6" :y="dot.y - 4" font-family="Georgia,serif" font-size="7" :fill="rarityColor(dot.rarity)" font-weight="bold">{{ dot.rarity }}</text>
    </g>
  </g>
</template>

<style scoped>
.hq-npc-dot--selected {
  stroke-width: 2;
  filter: drop-shadow(0 0 4px #c9a84c);
}
.hq-npc-dot--visitor {
  animation: pulse 1s ease-in-out infinite alternate;
}
@keyframes pulse {
  from { opacity: 1; }
  to { opacity: 0.6; }
}
</style>
