<script setup lang="ts">
import { computed } from 'vue'
import type { FloorId } from '@/types'
import { GOLD, GOLD_DIM, GOLD_DARK, BG_DARK, BG_DARKER, BG_CORRIDOR, isFloorUnlocked, FLOOR_IDS, FLOOR_NAMES } from './hqLayout'

interface SimpleDot {
  id?: string
  x: number
  y: number
  color: string
  name?: string
}

const props = defineProps<{
  buildings: Record<string, { level: number; unlocked: boolean }>
  npcDots: Record<FloorId, SimpleDot[]>
  showLabels: boolean
}>()

const emit = defineEmits<{ selectFloor: [floor: FloorId] }>()

const FALLOUT_W = 900
const BAND_H = 70
const BAND_GAP = 4
const ELEVATOR_W = 40

interface Band {
  floors: FloorId[]
  label: string
  y: number
}

const BANDS = computed<Band[]>(() => {
  return FLOOR_IDS.map((floorId, i) => ({
    floors: [floorId],
    label: FLOOR_NAMES[floorId] || `Floor ${floorId}`,
    y: i * (BAND_H + BAND_GAP),
  }))
})

const totalH = computed(() => BANDS.value.length * (BAND_H + BAND_GAP))

function bandUnlocked(band: Band): boolean {
  return band.floors.some(f => isFloorUnlocked(f, props.buildings))
}

function npcInBand(band: Band): SimpleDot[] {
  const dots: SimpleDot[] = []
  band.floors.forEach((f, fi) => {
    const floorDots = props.npcDots[f] || []
    floorDots.forEach(d => {
      dots.push({
        ...d,
        y: band.y + 20 + fi * 12,
      })
    })
  })
  return dots
}
</script>

<template>
  <svg :viewBox="`0 0 ${FALLOUT_W} ${totalH}`" class="hqfalloutview" preserveAspectRatio="xMidYMid meet">
    <!-- Elevator shaft -->
    <rect x="0" y="0" :width="ELEVATOR_W" :height="totalH" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="1"/>
    <text :x="ELEVATOR_W / 2" :y="20" text-anchor="middle" font-size="8" :fill="GOLD_DIM" writing-mode="tb">ELEVATOR</text>

    <!-- Bands -->
    <g v-for="band in BANDS" :key="band.label">
      <rect
        :x="ELEVATOR_W + 2" :y="band.y"
        :width="FALLOUT_W - ELEVATOR_W - 4" :height="BAND_H"
        :fill="bandUnlocked(band) ? BG_DARK : BG_DARKER"
        :stroke="bandUnlocked(band) ? GOLD_DIM : GOLD_DARK"
        stroke-width="1"
        @click="emit('selectFloor', band.floors[0])"
        style="cursor: pointer"
      />
      <!-- Band label -->
      <text :x="ELEVATOR_W + 12" :y="band.y + 16" font-family="Georgia,serif" font-size="10" :fill="GOLD" letter-spacing="2">{{ band.label.toUpperCase() }}</text>

      <template v-if="bandUnlocked(band)">
        <!-- Floor numbers for multi-floor bands -->
        <text
          v-for="(f, fi) in band.floors"
          :key="'fn_' + f"
          :x="ELEVATOR_W + 12 + fi * 80"
          :y="band.y + 32"
          font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM"
        >F{{ f }}</text>

        <!-- NPCs -->
        <g v-for="dot in npcInBand(band)" :key="dot.id">
          <circle :cx="ELEVATOR_W + 20 + (dot.x % 700)" :cy="dot.y" r="3" :fill="dot.color" stroke="#fff" stroke-width="0.5"/>
          <text v-if="props.showLabels" :x="ELEVATOR_W + 20 + (dot.x % 700)" :y="dot.y - 5" text-anchor="middle" font-size="6" :fill="GOLD">{{ dot.name }}</text>
        </g>
      </template>
      <text v-else :x="FALLOUT_W / 2" :y="band.y + BAND_H / 2" text-anchor="middle" font-size="12" :fill="GOLD_DARK">🔒</text>
    </g>
  </svg>
</template>
