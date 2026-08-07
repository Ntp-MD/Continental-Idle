<script setup lang="ts">
import type { FloorId } from '@/types'
import { FLOOR_IDS, FLOOR_NAMES, THUMB_W, THUMB_H, SVG_W, SVG_H, GOLD, GOLD_DIM, BG_DARK, BG_DARKER, isFloorUnlocked, getRoomsOnFloor } from './hqLayout'

const props = defineProps<{
  selectedFloor: FloorId
  buildings: Record<string, { level: number; unlocked: boolean }>
  npcDots: Record<FloorId, { x: number; y: number; color: string }[]>
}>()

const emit = defineEmits<{ select: [floor: FloorId] }>()

function thumbScaleX(x: number): number {
  return (x / SVG_W) * THUMB_W
}
function thumbScaleY(y: number): number {
  return (y / SVG_H) * THUMB_H
}
</script>

<template>
  <div class="hqfloorselector">
    <div
      v-for="floor in FLOOR_IDS"
      :key="floor"
      class="hqfloorselector__item"
      :class="{ 'is__selected': floor === props.selectedFloor, 'is__locked': !isFloorUnlocked(floor, props.buildings) }"
      @click="emit('select', floor)"
    >
      <svg :viewBox="`0 0 ${THUMB_W} ${THUMB_H}`" class="hqfloorselector__thumb" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" :width="THUMB_W" :height="THUMB_H" :fill="floor === props.selectedFloor ? BG_DARK : BG_DARKER" :stroke="floor === props.selectedFloor ? GOLD : GOLD_DIM" stroke-width="1"/>
        <template v-if="isFloorUnlocked(floor, props.buildings)">
          <rect
            v-for="room in getRoomsOnFloor(floor)"
            :key="room.id"
            :x="thumbScaleX(room.x)" :y="thumbScaleY(room.y)"
            :width="thumbScaleX(room.w)" :height="thumbScaleY(room.h)"
            fill="#222" :stroke="GOLD_DIM" stroke-width="0.5"
          />
          <circle
            v-for="(dot, i) in (props.npcDots[floor] || [])"
            :key="'dot_' + i"
            :cx="thumbScaleX(dot.x)" :cy="thumbScaleY(dot.y)"
            r="1.5" :fill="dot.color"
          />
        </template>
        <template v-else>
          <text :x="THUMB_W / 2" :y="THUMB_H / 2" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#444">🔒</text>
        </template>
      </svg>
      <span class="hqfloorselector__label">{{ floor === 'G' ? 'G' : 'F' + floor }} · {{ FLOOR_NAMES[floor] }}</span>
    </div>
  </div>
</template>

<style scoped>
.hqfloorselector {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  max-height: 600px;
  padding-right: 4px;
}
.hqfloorselector__item {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.15s;
}
.hqfloorselector__item:hover {
  transform: scale(1.02);
}
.hqfloorselector__item.is__selected {
  box-shadow: 0 0 6px rgba(201, 168, 76, 0.4);
}
.hqfloorselector__item.is__locked {
  opacity: 0.5;
}
.hqfloorselector__thumb {
  display: block;
  width: 100%;
  height: 60px;
}
.hqfloorselector__label {
  font-size: 9px;
  color: #888;
  text-align: center;
  padding: 2px 0;
  font-family: Georgia, serif;
  letter-spacing: 1px;
}
</style>
