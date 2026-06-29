<script setup lang="ts">
import type { FloorId } from '@/types'
import { SVG_W, SVG_H, GOLD, GOLD_DIM, GOLD_DARK, BG_DARK, BG_DARKER, BG_CORRIDOR, getRoomsOnFloor, FLOOR_NAMES, ELEVATOR_X } from './hq-layout'

const props = defineProps<{
  floor: FloorId
  unlocked: boolean
  buildingLevels: Record<string, number>
}>()

const WALL_THICKNESS = 6
</script>

<template>
  <g v-if="props.unlocked">
    <!-- Outer walls -->
    <rect x="0" y="0" :width="SVG_W" :height="SVG_H" :fill="BG_DARKER" :stroke="GOLD_DIM" stroke-width="2"/>
    <rect :x="WALL_THICKNESS" :y="WALL_THICKNESS" :width="SVG_W - WALL_THICKNESS * 2" :height="SVG_H - WALL_THICKNESS * 2" :fill="BG_DARK" :stroke="GOLD_DARK" stroke-width="0.5"/>

    <!-- Elevator shaft indicator -->
    <rect :x="ELEVATOR_X - 30" :y="SVG_H - 80" width="60" height="60" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="1" stroke-dasharray="4,2"/>
    <text :x="ELEVATOR_X" :y="SVG_H - 45" text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD_DIM">ELEV</text>

    <!-- Rooms -->
    <g v-for="room in getRoomsOnFloor(props.floor)" :key="room.id">
      <!-- Room fill -->
      <rect :x="room.x" :y="room.y" :width="room.w" :height="room.h" :fill="room.visual ? '#0a0a0a' : '#151515'" :stroke="room.visual ? GOLD_DARK : GOLD_DIM" stroke-width="1.5"/>
      <!-- Room label -->
      <text :x="room.x + room.w / 2" :y="room.y + 20" text-anchor="middle" font-family="Georgia,serif" font-size="12" :fill="GOLD" letter-spacing="2">{{ room.label }}</text>
      <text v-if="room.sub" :x="room.x + room.w / 2" :y="room.y + 36" text-anchor="middle" font-family="Georgia,serif" font-size="8" :fill="GOLD_DIM">{{ room.sub }}</text>
      <!-- Building level indicator -->
      <text
        v-if="!room.visual && props.buildingLevels[room.id] !== undefined && props.buildingLevels[room.id] > 0"
        :x="room.x + room.w - 12" :y="room.y + 16"
        text-anchor="end" font-family="Georgia,serif" font-size="10" :fill="GOLD"
      >Lv.{{ props.buildingLevels[room.id] }}</text>
      <!-- Visual only badge -->
      <text
        v-if="room.visual"
        :x="room.x + room.w / 2" :y="room.y + room.h / 2 + 10"
        text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DARK" letter-spacing="2"
      >VISUAL ONLY</text>
    </g>

    <!-- Floor name -->
    <text :x="SVG_W / 2" :y="SVG_H - 10" text-anchor="middle" font-family="Georgia,serif" font-size="9" :fill="GOLD_DIM" letter-spacing="4">{{ FLOOR_NAMES[props.floor].toUpperCase() }}</text>
  </g>
  <g v-else>
    <rect x="0" y="0" :width="SVG_W" :height="SVG_H" :fill="BG_DARKER" :stroke="GOLD_DARK" stroke-width="1"/>
    <text :x="SVG_W / 2" :y="SVG_H / 2" text-anchor="middle" font-family="Georgia,serif" font-size="16" :fill="GOLD_DARK">🔒 LOCKED</text>
    <text :x="SVG_W / 2" :y="SVG_H / 2 + 24" text-anchor="middle" font-family="Georgia,serif" font-size="10" :fill="GOLD_DARK">{{ FLOOR_NAMES[props.floor] }}</text>
  </g>
</template>
