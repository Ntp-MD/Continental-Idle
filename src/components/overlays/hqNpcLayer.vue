<script setup lang="ts">
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

  focused?: boolean
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
    <g v-for="dot in props.dots" :key="dot.id">
      <!-- Rarity glow -->
      <circle :cx="dot.x" :cy="dot.y" r="6" :fill="rarityColor(dot.rarity)" opacity="0.25" />
      <!-- Focused staff glow (near assigned building) -->
      <circle v-if="dot.focused" :cx="dot.x" :cy="dot.y" r="9" fill="none" stroke="var(--accent-gold)" stroke-width="1" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Main dot -->
      <circle
        :cx="dot.x" :cy="dot.y" r="4"
        :fill="dot.color"
        stroke="var(--text-bright)"
        stroke-width="1"
        :class="{ 'hqnpcdot__selected': dot.id === props.selectedNpcId, 'hqnpcdot__visitor': dot.isVisitor }"
        @click="emit('click', dot)"
        style="cursor: pointer"
      />
      <!-- Visitor pulsing ring -->
      <circle v-if="dot.isVisitor" :cx="dot.x" :cy="dot.y" r="10" fill="none" stroke="var(--accent-gold)" stroke-width="1" opacity="0.5">
        <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <!-- Visitor ! icon -->
      <text v-if="dot.isVisitor" :x="dot.x" :y="dot.y - 12" text-anchor="middle" font-size="10" fill="var(--accent-gold)" font-weight="bold">!</text>
      <!-- Labels -->
      <g v-if="props.showLabels">
        <text :x="dot.x" :y="dot.y - 8" text-anchor="middle" font-size="7" fill="var(--accent-gold)">{{ dot.name }}</text>
        <text :x="dot.x" :y="dot.y + 14" text-anchor="middle" font-size="6" fill="var(--text-dim)">{{ dot.profession }} Lv.{{ dot.level }}</text>
      </g>
      <!-- Rarity badge -->
      <text :x="dot.x + 6" :y="dot.y - 4" font-size="7" :fill="rarityColor(dot.rarity)" font-weight="bold">{{ dot.rarity }}</text>
    </g>
  </g>
</template>

<style scoped>
.hqnpcdot__selected {
  stroke-width: 2;
  filter: drop-shadow(0 0 4px var(--accent-gold));
}
.hqnpcdot__visitor {
  animation: hq_npc_pulse 1s ease-in-out infinite alternate;
}
@keyframes hq_npc_pulse {
  from { opacity: 1; }
  to { opacity: 0.6; }
}
</style>
