import type { BranchId } from '@/types'
import { BUILDINGS } from '@/data/buildings'
import { BRANCHES } from '@/data/branches'
import { gameState } from './game-state'
import { getPrestigeReputationKeepRatio } from './abilities'
import { getTotalPrestigeFavorMult } from './skill-manager'
import { getRoyalFavorMult, getSovereignBuffMult } from './royal-manager'
import { isUpgradePurchased } from './upgrade-manager'
import { eventBus } from './event-bus'

export function getPrestigeFavor(branchId?: BranchId): number {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return 0

  let scaleConstant = 1e9
  if (state.totalPrestige >= 50) scaleConstant = 1e6
  else if (state.totalPrestige >= 25) scaleConstant = 1e7
  else if (state.totalPrestige >= 10) scaleConstant = 1e8

  return Math.floor(Math.pow(branch.lifetimeEarnings / scaleConstant, 0.5) * getTotalPrestigeFavorMult() * getRoyalFavorMult() * getSovereignBuffMult())
}

export function canPrestige(branchId?: BranchId): boolean {
  const favor = getPrestigeFavor(branchId)
  return favor > 0
}

export function doPrestige(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false

  const favor = getPrestigeFavor(id)
  if (favor <= 0) return false

  // Grant favor
  state.tableFavor += favor

  // Increment prestige
  branch.prestige += 1
  state.totalPrestige += 1

  // Reset buildings
  BUILDINGS.forEach(def => {
    const bState = branch.buildings[def.id]
    if (bState) {
      bState.level = 0
    }
  })

  // Reset staff levels but mark survivors as veterans
  Object.values(branch.staff).forEach(staff => {
    if (staff.level > 1) {
      staff.prestigeSurvivedCount++
      const hasOldGuard = staff.traits.includes('oldGuard')
      if ((hasOldGuard || staff.prestigeSurvivedCount >= 3) && !staff.veteran) {
        staff.veteran = true
        staff.veteranPerk = 'Survived ' + staff.prestigeSurvivedCount + ' prestiges'
      }
    }
    staff.level = 1
    staff.xp = 0
    staff.pendingLevelUp = false
    staff.assignedTo = null
  })

  // Reset currency
  branch.currency = 0
  branch.lifetimeEarnings = 0

  // Halve reputation (or keep 80% with maxed Adjudicator)
  const keepRatio = getPrestigeReputationKeepRatio(id)
  branch.reputation = Math.floor(branch.reputation * keepRatio)

  // Reset heat
  branch.heatLevel = 0

  // Reset satisfaction
  branch.guestSatisfaction = 50

  // Grace period
  branch.excommunicadoGraceUntil = Date.now() + 30 * 60 * 1000

  // Clear marker debts
  branch.markerDebts = []

  // Clear active buffs for this branch (income multipliers/freezes should not persist through reset)
  state.activeBuffs = state.activeBuffs.filter(b => b.branchId !== id)

  // Remove supply routes involving this branch (prestige resets the branch economy)
  const removedRoutes = state.supplyRoutes.filter(r => r.from === id || r.to === id)
  state.supplyRoutes = state.supplyRoutes.filter(r => r.from !== id && r.to !== id)
  removedRoutes.forEach(r => eventBus.emit('supplyroute:collapsed', { routeId: r.id }))

  // Check branch unlocks
  checkbranchUnlocks()

  eventBus.emit('prestige:reset', { branchId: id, favor })
  return true
}

function checkbranchUnlocks(): void {
  const state = gameState.get()
  const graceUntil = Date.now() + 30 * 60 * 1000
  BRANCHES.forEach(t => {
    if (t.unlockPrestige === 0) return
    // Unlock: totalPrestige reaches threshold
    if (state.totalPrestige >= t.unlockPrestige && !state.worldMap.unlockedBranches.includes(t.id)) {
      if (t.id === state.hqBranch) return
      state.worldMap.unlockedBranches.push(t.id)
      const branch = state.branches[t.id]
      if (branch) {
        branch.excommunicadoGraceUntil = graceUntil
        if (isUpgradePurchased('diplomaticChannels') && branch.reputation < 100) {
          branch.reputation = 100
        }
      }
      eventBus.emit('branch:unlock', { branchId: t.id })
    }
    // Royal: totalPrestige is 10+ above unlock threshold (branch must already be unlocked)
    if (t.unlockPrestige > 0 && state.totalPrestige >= t.unlockPrestige + 10 && !state.worldMap.royalBranches.includes(t.id)) {
      state.worldMap.royalBranches.push(t.id)
      eventBus.emit('branch:royal', { branchId: t.id })
    }
  })
}
