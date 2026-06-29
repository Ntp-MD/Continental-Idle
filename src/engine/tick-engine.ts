import { gameState } from './game-state'
import { tick as incomeTick, updateBuildingUnlocks } from './income-engine'
import { eventEngine } from './event-engine'
import { tickStaffXp } from './staff-manager'
import { tickDebtCollection, tickDebtInterest } from './debt-manager'
import { tickAssassinLoyalty, tickAssassinXp } from './assassin-manager'
import { tickTakeoverProgress } from './takeover-manager'
import { tickSupplyRoutes, tickAISupplyRoutes } from './supply-route-manager'
import { tickAIOwners } from './ai-owner-manager'
import { hasVaultKeeperMaxed } from './abilities'
import { getTotalIncomeMult } from './skill-manager'
import { tickRoyalMarks, getRoyalIncomeMult, getSovereignBuffMult } from './royal-manager'
import { sovereignManager } from './sovereign-manager'
import { getBranchIncomePerSecond } from './income-engine'
import { tickVisitorSpawn, tickVisitorTimeout } from './visitor-manager'

export function runGameTick(tickCount: number): void {
  incomeTick()
  updateBuildingUnlocks()
  tickStaffXp()
  tickAssassinXp()
  eventEngine.tick()

  if (tickCount % 10 === 0) tickDebtCollection()
  if (tickCount % 60 === 0) tickDebtInterest()
  if (tickCount % 30 === 0) tickAssassinLoyalty()
  if (tickCount % 5 === 0) {
    tickTakeoverProgress()
    tickSupplyRoutes()
    tickAISupplyRoutes()
    tickAIOwners(tickCount)
  }

  if (tickCount % 60 === 0) {
    tickSafeHouseInterest()
    tickRoyalMarks()
    tickGoldenCoins()
  }

  tickVisitorSpawn()
  if (tickCount % 10 === 0) tickVisitorTimeout()

  if (tickCount % 120 === 0) {
    tickHeatDecay()
  }
}

function tickSafeHouseInterest(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    const safeHouse = branch.buildings['safeHouse']
    if (!safeHouse || safeHouse.level === 0) return
    const baseInterest = safeHouse.level * 100
    const vaultKeeperMult = hasVaultKeeperMaxed(branchId) ? 2 : 1
    const goldStandardMult = branch.upgrades.includes('goldStandard') ? 1.5 : 1
    const interest = baseInterest * vaultKeeperMult * goldStandardMult * getTotalIncomeMult() * getRoyalIncomeMult() * getSovereignBuffMult() * (1 + sovereignManager.getActiveDecreeMult('incomeMultiplier'))
    branch.currency += interest
    branch.lifetimeEarnings += interest
  })
}

function tickGoldenCoins(): void {
  const state = gameState.get()
  let totalIncome = 0
  state.worldMap.unlockedBranches.forEach(branchId => {
    totalIncome += getBranchIncomePerSecond(branchId)
  })
  state.goldenCoins += totalIncome * 0.01
}

function tickHeatDecay(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    if (branch.heatLevel > 0) branch.heatLevel = Math.max(0, branch.heatLevel - 1)
    if (branch.guestSatisfaction > 50) {
      branch.guestSatisfaction = Math.max(50, branch.guestSatisfaction - 1)
    } else if (branch.guestSatisfaction < 50) {
      branch.guestSatisfaction = Math.min(50, branch.guestSatisfaction + 1)
    }
  })
}
