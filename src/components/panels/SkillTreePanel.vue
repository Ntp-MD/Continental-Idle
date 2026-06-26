<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { gameState } from '@/engine/game-state'
import { upgradeSkill, canUpgradeSkill, getSkillLevel } from '@/engine/skill-manager'
import { SKILL_MAX_LEVEL, getBranchNodes } from '@/data/skills'
import { formatNumber } from '@/engine/format'
import { eventBus } from '@/engine/event-bus'
import type { SkillTreeState } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const favor = ref(0)
const branches = ref<Array<{
  key: keyof SkillTreeState
  name: string
  level: number
  nodes: Array<{
    level: number
    name: string
    description: string
    favorCost: string
    unlocked: boolean
    canUpgrade: boolean
  }>
}>>([])

const branchNames: Record<keyof SkillTreeState, string> = {
  commerce: 'Commerce',
  personnel: 'Personnel',
  shadow: 'Shadow',
  diplomacy: 'Diplomacy',
  ascension: 'Ascension',
}

function update() {
  if (!props.visible) return
  const state = gameState.get()
  favor.value = state.tableFavor

  branches.value = (Object.keys(branchNames) as Array<keyof SkillTreeState>).map(key => {
    const level = getSkillLevel(key)
    const nodes = getBranchNodes(key).map(node => ({
      level: node.level,
      name: node.name,
      description: node.description,
      favorCost: formatNumber(node.favorCost),
      unlocked: level >= node.level,
      canUpgrade: level === node.level - 1 && canUpgradeSkill(key),
    }))
    return { key, name: branchNames[key], level, nodes }
  })
}

function doUpgrade(branch: keyof SkillTreeState) {
  upgradeSkill(branch)
  update()
}

onMounted(() => {
  update()
  eventBus.on('skill:upgraded', update)
  eventBus.on('income:tick', update)
})

onUnmounted(() => {
  eventBus.off('skill:upgraded', update)
  eventBus.off('income:tick', update)
})

watch(() => props.visible, (v) => { if (v) update() })
</script>

<template>
  <div v-if="visible" class="game-panel" @click.self="emit('close')">
    <div class="game-panel__content">
      <h2 class="game-panel__title">Skill Tree</h2>
      <div class="skill-tree__favor">Table Favor: {{ formatNumber(favor) }}</div>

      <div v-for="branch in branches" :key="branch.key" class="skill-branch">
        <div class="section-header">{{ branch.name }} — Lv.{{ branch.level }}/{{ SKILL_MAX_LEVEL }}</div>
        <div v-for="node in branch.nodes" :key="node.level" class="skill-node">
          <div class="skill-node__info">
            <div class="skill-node__name" :class="{ 'skill-node__name--unlocked': node.unlocked }">
              {{ node.unlocked ? '✓' : '○' }} {{ node.name }}
            </div>
            <div class="skill-node__desc">{{ node.description }}</div>
          </div>
          <button
            v-if="!node.unlocked && node.canUpgrade"
            class="skill-node__btn"
            @click="doUpgrade(branch.key)"
          >{{ node.favorCost }} F</button>
          <span v-else-if="!node.unlocked" class="skill-node__cost-locked">{{ node.favorCost }} F</span>
        </div>
      </div>

      <button class="game-panel__close" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
