import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { SKILL_NODES, SKILL_MAX_LEVEL, getSkillNode } from '@/data/skills'
import type { SkillTreeState } from '@/types'

type Branch = keyof SkillTreeState

export function getSkillLevel(branch: Branch): number {
  return gameState.get().skillTree[branch]
}

export function canUpgradeSkill(branch: Branch): boolean {
  const state = gameState.get()
  const currentLevel = state.skillTree[branch]
  if (currentLevel >= SKILL_MAX_LEVEL) return false

  const node = getSkillNode(branch, currentLevel + 1)
  if (!node) return false

  return state.tableFavor >= node.favorCost
}

export function upgradeSkill(branch: Branch): boolean {
  const state = gameState.get()
  const currentLevel = state.skillTree[branch]
  if (currentLevel >= SKILL_MAX_LEVEL) return false

  const node = getSkillNode(branch, currentLevel + 1)
  if (!node) return false
  if (state.tableFavor < node.favorCost) return false

  state.tableFavor -= node.favorCost
  state.skillTree[branch] = currentLevel + 1
  eventBus.emit('skill:upgraded', { branch, level: currentLevel + 1 })
  eventBus.emit('income:update')
  return true
}

export function getTotalIncomeMult(): number {
  const tree = gameState.get().skillTree
  let mult = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'commerce' && node.effect.incomeMult && tree.commerce >= node.level) {
      mult += node.effect.incomeMult
    }
  }
  return 1 + mult
}

export function getTotalStaffXpMult(): number {
  const tree = gameState.get().skillTree
  let mult = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'personnel' && node.effect.staffXpMult && tree.personnel >= node.level) {
      mult += node.effect.staffXpMult
    }
  }
  return 1 + mult
}

export function getTotalDebtReduction(): number {
  const tree = gameState.get().skillTree
  let reduction = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'shadow' && node.effect.debtReduction && tree.shadow >= node.level) {
      reduction += node.effect.debtReduction
    }
  }
  return Math.min(0.75, reduction)
}

export function getTotalReputationMult(): number {
  const tree = gameState.get().skillTree
  let mult = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'diplomacy' && node.effect.reputationMult && tree.diplomacy >= node.level) {
      mult += node.effect.reputationMult
    }
  }
  return 1 + mult
}

export function getTotalPrestigeFavorMult(): number {
  const tree = gameState.get().skillTree
  let mult = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'ascension' && node.effect.prestigeFavorMult && tree.ascension >= node.level) {
      mult += node.effect.prestigeFavorMult
    }
  }
  return 1 + mult
}

export function getTotalOfflineEfficiency(): number {
  const tree = gameState.get().skillTree
  let bonus = 0
  for (const node of SKILL_NODES) {
    if (node.effect.offlineEfficiency) {
      if ((node.branch === 'commerce' && tree.commerce >= node.level) ||
          (node.branch === 'ascension' && tree.ascension >= node.level)) {
        bonus += node.effect.offlineEfficiency
      }
    }
  }
  return bonus
}

export function getTotalBuffDurationMult(): number {
  const tree = gameState.get().skillTree
  let mult = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'shadow' && node.effect.buffDurationMult && tree.shadow >= node.level) {
      mult += node.effect.buffDurationMult
    }
  }
  return 1 + mult
}

export function getExtraHeatReduction(): number {
  const tree = gameState.get().skillTree
  let reduction = 0
  for (const node of SKILL_NODES) {
    if (node.effect.heatReduction) {
      if ((node.branch === 'shadow' && tree.shadow >= node.level) ||
          (node.branch === 'diplomacy' && tree.diplomacy >= node.level)) {
        reduction += node.effect.heatReduction
      }
    }
  }
  return reduction
}

export function getExtraStaffSlots(): number {
  const tree = gameState.get().skillTree
  let slots = 0
  for (const node of SKILL_NODES) {
    if (node.branch === 'personnel' && node.effect.unlockSlot && tree.personnel >= node.level) {
      slots += node.effect.unlockSlot
    }
  }
  return slots
}
