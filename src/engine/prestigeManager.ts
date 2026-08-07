import type { BranchId } from '@/types'
import { BUILDINGS } from '@/data/buildings'
import { BRANCHES } from '@/data/branches'
import { rollVeteranPerk } from '@/data/staff'
import { gameState } from './gameState'
import { getPrestigeReputationKeepRatio } from './abilities'
import { getTotalPrestigeFavorMult } from './skillManager'
import { getRoyalFavorMult, getSovereignBuffMult } from './royalManager'
import { isUpgradePurchased } from './upgradeManager'
import { eventBus } from './eventBus'

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


  state.tableFavor += favor


  branch.prestige += 1
  state.totalPrestige += 1


  state.goldenCoins += 10


  BUILDINGS.forEach(def => {
    const bState = branch.buildings[def.id]
    if (bState) {
      bState.level = 0
    }
  })


  Object.values(branch.staff).forEach(staff => {
    if (staff.level > 1) {
      staff.prestigeSurvivedCount++
      const hasOldGuard = staff.traits.includes('oldGuard')
      if ((hasOldGuard || staff.prestigeSurvivedCount >= 3) && !staff.veteran) {
        staff.veteran = true
        staff.veteranPerk = rollVeteranPerk()
      }
    }
    staff.level = 1
    staff.xp = 0
    staff.pendingLevelUp = false
    staff.assignedTo = null
  })


  branch.currency = 0
  branch.lifetimeEarnings = 0


  const keepRatio = getPrestigeReputationKeepRatio(id)
  branch.reputation = Math.floor(branch.reputation * keepRatio)


  branch.heatLevel = 0


  branch.guestSatisfaction = 50


  branch.excommunicadoGraceUntil = Date.now() + 30 * 60 * 1000


  branch.markerDebts = []


  state.activeBuffs = state.activeBuffs.filter(b => b.branchId !== id)


  const removedRoutes = state.supplyRoutes.filter(r => r.from === id || r.to === id)
  state.supplyRoutes = state.supplyRoutes.filter(r => r.from !== id && r.to !== id)
  removedRoutes.forEach(r => eventBus.emit('supplyroute:collapsed', { routeId: r.id }))


  checkBranchUnlocks()

  eventBus.emit('prestige:reset', { branchId: id, favor })
  return true
}

function checkBranchUnlocks(): void {
  const state = gameState.get()
  const graceUntil = Date.now() + 30 * 60 * 1000
  BRANCHES.forEach(t => {
    if (t.unlockPrestige === 0) return

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

    if (t.unlockPrestige > 0 && state.totalPrestige >= t.unlockPrestige + 10 && !state.worldMap.royalBranches.includes(t.id)) {
      state.worldMap.royalBranches.push(t.id)
      eventBus.emit('branch:royal', { branchId: t.id })
    }
  })
}
