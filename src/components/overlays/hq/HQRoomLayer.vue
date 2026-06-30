<script setup lang="ts">
import type { FloorId } from '@/types'
import { SVG_W, SVG_H, GOLD, GOLD_DIM, GOLD_DARK, BG_DARK, BG_DARKER, BG_CORRIDOR, getRoomsOnFloor, getRoomFurniture, FLOOR_NAMES, ELEVATOR_X, ELEVATOR_Y, ELEVATOR_R, CORRIDOR_LAYOUT, DOOR_LAYOUT, DOOR_WIDTHS } from './hq-layout'

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

    <!-- Corridors -->
    <g v-for="(seg, i) in CORRIDOR_LAYOUT[props.floor]" :key="'corr-' + i">
      <rect :x="seg.x" :y="seg.y" :width="seg.w" :height="seg.h" :fill="BG_CORRIDOR" :stroke="GOLD_DARK" stroke-width="0.5"/>
      <!-- Dashed center line -->
      <line v-if="seg.vertical" :x1="seg.x + seg.w / 2" :y1="seg.y + 8" :x2="seg.x + seg.w / 2" :y2="seg.y + seg.h - 8" :stroke="GOLD_DARK" stroke-width="0.5" stroke-dasharray="6 4"/>
      <line v-else :x1="seg.x + 8" :y1="seg.y + seg.h / 2" :x2="seg.x + seg.w - 8" :y2="seg.y + seg.h / 2" :stroke="GOLD_DARK" stroke-width="0.5" stroke-dasharray="6 4"/>
      <!-- Corridor label -->
      <text v-if="seg.label"
        :x="seg.vertical ? seg.x + seg.w / 2 : seg.x + seg.w / 2"
        :y="seg.vertical ? seg.y + seg.h / 2 + 3 : seg.y + seg.h / 2 + 3"
        :text-anchor="'middle'"
        :font-size="7"
        :fill="GOLD_DARK"
        :letter-spacing="2"
        :transform="seg.vertical ? `rotate(-90 ${seg.x + seg.w / 2} ${seg.y + seg.h / 2 + 3})` : undefined"
        font-family="Georgia,serif"
      >{{ seg.label }}</text>
    </g>

    <!-- Rooms -->
    <g v-for="room in getRoomsOnFloor(props.floor)" :key="room.id">
      <!-- Room fill -->
      <rect :x="room.x" :y="room.y" :width="room.w" :height="room.h" :fill="room.visual ? '#0a0a0a' : '#151515'" :stroke="room.visual ? GOLD_DARK : GOLD_DIM" stroke-width="1.5"/>
      <!-- Furniture (room-relative via transform) -->
      <g class="hq-furniture" :transform="`translate(${room.x}, ${room.y})`">
        <template v-for="f in getRoomFurniture(room.id)" :key="`${room.id}-f-${f.x}-${f.y}`">
          <rect v-if="f.type === 'rect'" :x="f.x" :y="f.y" :width="f.w" :height="f.h" :fill="f.fill" :stroke="f.stroke" :stroke-width="f.strokeWidth" :stroke-dasharray="f.strokeDasharray" :opacity="f.opacity"/>
          <circle v-else-if="f.type === 'circle'" :cx="f.x" :cy="f.y" :r="f.r" :fill="f.fill" :stroke="f.stroke" :stroke-width="f.strokeWidth" :opacity="f.opacity"/>
          <ellipse v-else-if="f.type === 'ellipse'" :cx="f.x" :cy="f.y" :rx="f.rx" :ry="f.ry" :fill="f.fill" :stroke="f.stroke" :stroke-width="f.strokeWidth" :opacity="f.opacity"/>
          <line v-else-if="f.type === 'line'" :x1="f.x" :y1="f.y" :x2="f.x2" :y2="f.y2" :stroke="f.stroke" :stroke-width="f.strokeWidth" :stroke-dasharray="f.strokeDasharray" :opacity="f.opacity"/>
          <text v-else-if="f.type === 'text'" :x="f.x" :y="f.y" :text-anchor="f.textAnchor" :font-size="f.fontSize" :fill="f.fill" :opacity="f.opacity">{{ f.text }}</text>
          <path v-else-if="f.type === 'path'" :d="f.d" :fill="f.fill" :stroke="f.stroke" :stroke-width="f.strokeWidth" :opacity="f.opacity"/>
        </template>
      </g>
      <!-- Room label -->
      <text :x="room.x + room.w / 2" :y="room.y + (room.roomNum ? 14 : 20)" text-anchor="middle" font-family="Georgia,serif" :font-size="room.roomNum ? 7 : 12" :fill="GOLD" :letter-spacing="room.roomNum ? 0.5 : 2">{{ room.label }}</text>
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

    <!-- Doors -->
    <g v-for="(door, i) in DOOR_LAYOUT[props.floor]" :key="'door-' + i">
      <!-- Door gap (cut through wall into corridor color) -->
      <rect
        v-if="door.side === 'top' || door.side === 'bottom'"
        :x="door.x - DOOR_WIDTHS[door.category] / 2"
        :y="door.y - 3"
        :width="DOOR_WIDTHS[door.category]"
        :height="6"
        :fill="BG_CORRIDOR"
      />
      <rect
        v-else
        :x="door.x - 3"
        :y="door.y - DOOR_WIDTHS[door.category] / 2"
        :width="6"
        :height="DOOR_WIDTHS[door.category]"
        :fill="BG_CORRIDOR"
      />
      <!-- Door swing arc (inward opening) -->
      <template v-if="door.category === 'sliding'">
        <!-- Sliding door: two parallel lines indicating panels -->
        <line
          v-if="door.side === 'top' || door.side === 'bottom'"
          :x1="door.x - DOOR_WIDTHS[door.category] / 2" :y1="door.y"
          :x2="door.x + DOOR_WIDTHS[door.category] / 2" :y2="door.y"
          :stroke="GOLD_DIM" stroke-width="1.5"
        />
        <line
          v-if="door.side === 'left' || door.side === 'right'"
          :x1="door.x" :y1="door.y - DOOR_WIDTHS[door.category] / 2"
          :x2="door.x" :y2="door.y + DOOR_WIDTHS[door.category] / 2"
          :stroke="GOLD_DIM" stroke-width="1.5"
        />
        <!-- Sliding panel indicators -->
        <line v-if="door.side === 'top'" :x1="door.x - DOOR_WIDTHS[door.category] / 2" :y1="door.y - 1" :x2="door.x" :y2="door.y - 1" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'top'" :x1="door.x" :y1="door.y + 1" :x2="door.x + DOOR_WIDTHS[door.category] / 2" :y2="door.y + 1" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'bottom'" :x1="door.x - DOOR_WIDTHS[door.category] / 2" :y1="door.y + 1" :x2="door.x" :y2="door.y + 1" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'bottom'" :x1="door.x" :y1="door.y - 1" :x2="door.x + DOOR_WIDTHS[door.category] / 2" :y2="door.y - 1" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'left'" :x1="door.x - 1" :y1="door.y - DOOR_WIDTHS[door.category] / 2" :x2="door.x - 1" :y2="door.y" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'left'" :x1="door.x + 1" :y1="door.y" :x2="door.x + 1" :y2="door.y + DOOR_WIDTHS[door.category] / 2" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'right'" :x1="door.x + 1" :y1="door.y - DOOR_WIDTHS[door.category] / 2" :x2="door.x + 1" :y2="door.y" :stroke="GOLD" stroke-width="0.8"/>
        <line v-if="door.side === 'right'" :x1="door.x - 1" :y1="door.y" :x2="door.x - 1" :y2="door.y + DOOR_WIDTHS[door.category] / 2" :stroke="GOLD" stroke-width="0.8"/>
      </template>
      <template v-else>
        <!-- Standard & lobby doors: arc showing inward swing -->
        <path
          v-if="door.side === 'top'"
          :d="`M ${door.x - DOOR_WIDTHS[door.category] / 2} ${door.y} A ${DOOR_WIDTHS[door.category]} ${DOOR_WIDTHS[door.category]} 0 0 1 ${door.x + DOOR_WIDTHS[door.category] / 2} ${door.y + 4}`"
          fill="none" :stroke="GOLD_DIM" stroke-width="0.8"
        />
        <path
          v-if="door.side === 'bottom'"
          :d="`M ${door.x - DOOR_WIDTHS[door.category] / 2} ${door.y} A ${DOOR_WIDTHS[door.category]} ${DOOR_WIDTHS[door.category]} 0 0 0 ${door.x + DOOR_WIDTHS[door.category] / 2} ${door.y - 4}`"
          fill="none" :stroke="GOLD_DIM" stroke-width="0.8"
        />
        <path
          v-if="door.side === 'left'"
          :d="`M ${door.x} ${door.y - DOOR_WIDTHS[door.category] / 2} A ${DOOR_WIDTHS[door.category]} ${DOOR_WIDTHS[door.category]} 0 0 1 ${door.x + 4} ${door.y + DOOR_WIDTHS[door.category] / 2}`"
          fill="none" :stroke="GOLD_DIM" stroke-width="0.8"
        />
        <path
          v-if="door.side === 'right'"
          :d="`M ${door.x} ${door.y - DOOR_WIDTHS[door.category] / 2} A ${DOOR_WIDTHS[door.category]} ${DOOR_WIDTHS[door.category]} 0 0 0 ${door.x - 4} ${door.y + DOOR_WIDTHS[door.category] / 2}`"
          fill="none" :stroke="GOLD_DIM" stroke-width="0.8"
        />
        <!-- Door leaf line -->
        <line v-if="door.side === 'top'" :x1="door.x - DOOR_WIDTHS[door.category] / 2" :y1="door.y" :x2="door.x - DOOR_WIDTHS[door.category] / 2" :y2="door.y + DOOR_WIDTHS[door.category] * 0.6" :stroke="GOLD" stroke-width="1"/>
        <line v-if="door.side === 'bottom'" :x1="door.x - DOOR_WIDTHS[door.category] / 2" :y1="door.y" :x2="door.x - DOOR_WIDTHS[door.category] / 2" :y2="door.y - DOOR_WIDTHS[door.category] * 0.6" :stroke="GOLD" stroke-width="1"/>
        <line v-if="door.side === 'left'" :x1="door.x" :y1="door.y - DOOR_WIDTHS[door.category] / 2" :x2="door.x + DOOR_WIDTHS[door.category] * 0.6" :y2="door.y - DOOR_WIDTHS[door.category] / 2" :stroke="GOLD" stroke-width="1"/>
        <line v-if="door.side === 'right'" :x1="door.x" :y1="door.y - DOOR_WIDTHS[door.category] / 2" :x2="door.x - DOOR_WIDTHS[door.category] * 0.6" :y2="door.y - DOOR_WIDTHS[door.category] / 2" :stroke="GOLD" stroke-width="1"/>
        <!-- Double door for lobby -->
        <line v-if="door.side === 'top' && door.category === 'lobby'" :x1="door.x + DOOR_WIDTHS[door.category] / 2" :y1="door.y" :x2="door.x + DOOR_WIDTHS[door.category] / 2" :y2="door.y + DOOR_WIDTHS[door.category] * 0.6" :stroke="GOLD" stroke-width="1"/>
        <line v-if="door.side === 'bottom' && door.category === 'lobby'" :x1="door.x + DOOR_WIDTHS[door.category] / 2" :y1="door.y" :x2="door.x + DOOR_WIDTHS[door.category] / 2" :y2="door.y - DOOR_WIDTHS[door.category] * 0.6" :stroke="GOLD" stroke-width="1"/>
        <line v-if="door.side === 'left' && door.category === 'lobby'" :x1="door.x" :y1="door.y + DOOR_WIDTHS[door.category] / 2" :x2="door.x + DOOR_WIDTHS[door.category] * 0.6" :y2="door.y + DOOR_WIDTHS[door.category] / 2" :stroke="GOLD" stroke-width="1"/>
        <line v-if="door.side === 'right' && door.category === 'lobby'" :x1="door.x" :y1="door.y + DOOR_WIDTHS[door.category] / 2" :x2="door.x - DOOR_WIDTHS[door.category] * 0.6" :y2="door.y + DOOR_WIDTHS[door.category] / 2" :stroke="GOLD" stroke-width="1"/>
      </template>
    </g>

    <!-- Circular glass elevator -->
    <g v-if="CORRIDOR_LAYOUT[props.floor].length > 0">
      <!-- White mask to hide corridor behind -->
      <circle :cx="ELEVATOR_X" :cy="ELEVATOR_Y" :r="ELEVATOR_R + 6" fill="#0d0d0d"/>
      <!-- Outer ring -->
      <circle :cx="ELEVATOR_X" :cy="ELEVATOR_Y" :r="ELEVATOR_R" :fill="BG_CORRIDOR" :stroke="GOLD_DIM" stroke-width="1.5"/>
      <!-- Inner ring (glass effect) -->
      <circle :cx="ELEVATOR_X" :cy="ELEVATOR_Y" :r="ELEVATOR_R - 6" fill="none" :stroke="GOLD_DARK" stroke-width="0.7"/>
      <!-- Cross dividers — 4 compartments -->
      <line :x1="ELEVATOR_X - ELEVATOR_R" :y1="ELEVATOR_Y" :x2="ELEVATOR_X + ELEVATOR_R" :y2="ELEVATOR_Y" :stroke="GOLD_DARK" stroke-width="1"/>
      <line :x1="ELEVATOR_X" :y1="ELEVATOR_Y - ELEVATOR_R" :x2="ELEVATOR_X" :y2="ELEVATOR_Y + ELEVATOR_R" :stroke="GOLD_DARK" stroke-width="1"/>
      <!-- Arrow indicators -->
      <path :d="`M ${ELEVATOR_X - 4} ${ELEVATOR_Y - 11} L ${ELEVATOR_X} ${ELEVATOR_Y - 17} L ${ELEVATOR_X + 4} ${ELEVATOR_Y - 11}`" fill="none" :stroke="GOLD_DIM" stroke-width="1"/>
      <path :d="`M ${ELEVATOR_X - 4} ${ELEVATOR_Y + 11} L ${ELEVATOR_X} ${ELEVATOR_Y + 17} L ${ELEVATOR_X + 4} ${ELEVATOR_Y + 11}`" fill="none" :stroke="GOLD_DIM" stroke-width="1"/>
      <text :x="ELEVATOR_X" :y="ELEVATOR_Y + ELEVATOR_R + 12" text-anchor="middle" font-family="Georgia,serif" font-size="7" :fill="GOLD_DIM" letter-spacing="1">GLASS ELEVATOR</text>
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
