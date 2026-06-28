import type { BranchId } from '@/types'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { BRANCHES } from '@/data/branches'
import { getAssassinCombatDamage, getAssassinXpMult } from './assassin-manager'
import { defeatAIOwner } from './ai-owner-manager'

const HQ_HEALTH_BASE = 1000
const HQ_HEALTH_PER_PRESTIGE = 500

export function getHqMaxHealth(branchId: BranchId): number {
  const def = BRANCHES.find(t => t.id === branchId)
  if (!def) return HQ_HEALTH_BASE
  return HQ_HEALTH_BASE + def.unlockPrestige * HQ_HEALTH_PER_PRESTIGE
}

export function canInitiateTakeover(branchId: BranchId): boolean {
  const state = gameState.get()
  if (branchId === state.hqBranch) return false
  if (state.worldMap.conqueredBranches.includes(branchId)) return false
  if (state.worldMap.unlockedBranches.includes(branchId)) return false

  const def = BRANCHES.find(t => t.id === branchId)
  if (!def) return false
  return state.totalPrestige >= def.unlockPrestige
}

export function getTakeoverCost(branchId: BranchId): number {
  const def = BRANCHES.find(t => t.id === branchId)
  if (!def) return Infinity
  return Math.ceil(50_000_000 * Math.pow(1.15, def.unlockPrestige))
}

export function initiateTakeover(branchId: BranchId): boolean {
  const state = gameState.get()
  const activeBranch = state.branches[state.activeBranch]
  if (!activeBranch) return false
  if (!canInitiateTakeover(branchId)) return false

  const targetBranch = state.branches[branchId]
  if (!targetBranch) return false

  // Reject if a takeover is already in progress (HQ health already damaged)
  if (targetBranch.hqHealth < targetBranch.hqMaxHealth && !targetBranch.aiOwnerDefeated) return false

  const cost = getTakeoverCost(branchId)
  if (activeBranch.currency < cost) return false

  activeBranch.currency -= cost
  targetBranch.hqMaxHealth = getHqMaxHealth(branchId)
  targetBranch.hqHealth = targetBranch.hqMaxHealth
  targetBranch.aiOwnerDefeated = false
  eventBus.emit('takeover:started', { branchId })
  return true
}

export function tickTakeoverProgress(): void {
  const state = gameState.get()

  BRANCHES.forEach(def => {
    const targetBranch = state.branches[def.id]
    if (!targetBranch) return
    if (targetBranch.aiOwnerDefeated) return
    if (targetBranch.hqHealth <= 0) return

    let totalDamage = 0

    state.worldMap.unlockedBranches.forEach(sourceBranchId => {
      const sourceBranch = state.branches[sourceBranchId]
      if (!sourceBranch) return

      Object.values(sourceBranch.assassins).forEach(assassin => {
        if (assassin.attackTarget !== def.id) return
        if (assassin.loyalty < 10) return

        const damage = getAssassinCombatDamage(assassin)
        const xpMult = getAssassinXpMult(assassin)

        totalDamage += damage

        assassin.xp += damage * 0.5 * xpMult
        assassin.loyalty = Math.max(0, assassin.loyalty - 0.2)
      })
    })

    if (totalDamage > 0) {
      targetBranch.hqHealth = Math.max(0, targetBranch.hqHealth - totalDamage)

      if (targetBranch.hqHealth <= 0) {
        targetBranch.aiOwnerDefeated = true
        if (!state.worldMap.conqueredBranches.includes(def.id)) {
          state.worldMap.conqueredBranches.push(def.id)
        }
        if (!state.worldMap.unlockedBranches.includes(def.id)) {
          state.worldMap.unlockedBranches.push(def.id)
        }
        targetBranch.excommunicadoGraceUntil = Date.now() + 30 * 60 * 1000

        state.worldMap.unlockedBranches.forEach(sourceBranchId => {
          const sourceBranch = state.branches[sourceBranchId]
          if (!sourceBranch) return
          Object.values(sourceBranch.assassins).forEach(a => {
            if (a.attackTarget === def.id) {
              a.attackTarget = null
              a.loyalty = Math.min(100, a.loyalty + 10)
            }
          })
        })

        eventBus.emit('takeover:complete', { branchId: def.id })
        eventBus.emit('branch:unlock', { branchId: def.id })
        defeatAIOwner(def.id)
      }
    }
  })
}

export function getTakeoverProgress(branchId: BranchId): number {
  const state = gameState.get()
  const branch = state.branches[branchId]
  if (!branch) return 0
  if (branch.hqHealth <= 0) return 100
  if (branch.hqMaxHealth <= 0) return 0
  return (1 - branch.hqHealth / branch.hqMaxHealth) * 100
}

export function getHqHealthPercent(branchId: BranchId): number {
  const state = gameState.get()
  const branch = state.branches[branchId]
  if (!branch || branch.hqMaxHealth <= 0) return 0
  return (branch.hqHealth / branch.hqMaxHealth) * 100
}

export function getAttackersOnTarget(branchId: BranchId): number {
  const state = gameState.get()
  let count = 0
  state.worldMap.unlockedBranches.forEach(sourceId => {
    const branch = state.branches[sourceId]
    if (!branch) return
    count += Object.values(branch.assassins).filter(a => a.attackTarget === branchId).length
  })
  return count
}

export interface AttackRoute {
  from: BranchId
  to: BranchId
  attackerCount: number
}

export function getActiveAttackRoutes(): AttackRoute[] {
  const state = gameState.get()
  const routeMap = new Map<string, AttackRoute>()

  state.worldMap.unlockedBranches.forEach(sourceId => {
    const branch = state.branches[sourceId]
    if (!branch) return
    Object.values(branch.assassins).forEach(assassin => {
      if (!assassin.attackTarget) return
      const key = `${sourceId}->${assassin.attackTarget}`
      const existing = routeMap.get(key)
      if (existing) {
        existing.attackerCount++
      } else {
        routeMap.set(key, { from: sourceId, to: assassin.attackTarget, attackerCount: 1 })
      }
    })
  })

  return Array.from(routeMap.values())
}
