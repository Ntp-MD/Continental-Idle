import type { BranchId, BranchState } from '@/types'
import { BUILDINGS, BUILDING_MAP, BUILDING_INCOME_GROWTH } from '@/data/buildings'
import { STAFF_MAP } from '@/data/staff'
import { getTraitMultiplier } from '@/data/traits'
import { getChefAllBuildingBonus, getConciergePassiveBonus, getBartenderFreezeImmune } from './abilities'
import { hasEnforcer } from './assassin-manager'
import { getTotalIncomeMult } from './skill-manager'
import { getRoyalBuildingsIncome, getRoyalIncomeMult, getSovereignBuffMult } from './royal-manager'
import { sovereignManager } from './sovereign-manager'
import { gameState } from './game-state'
import { eventBus } from './event-bus'

let _suppressUIEvents = false

export function setSuppressUIEvents(suppress: boolean): void {
  _suppressUIEvents = suppress
}

// Tick-scoped cache: avoids redundant getBranchIncomePerSecond() recalculations
// when UI components read income values after the tick() already computed them.
let _tickCache: Map<BranchId, number> | null = null

export function beginTickCache(): void {
  _tickCache = new Map()
}

export function endTickCache(): void {
  _tickCache = null
}

export function getCachedBranchIncome(branchId: BranchId): number | null {
  return _tickCache?.get(branchId) ?? null
}

export function checkBuildingUnlocked(unlock: string, branchState: BranchState): boolean {
  if (unlock === 'start') return true
  if (unlock.startsWith('building:')) {
    const parts = unlock.split(':')
    const buildingId = parts[1]
    const minLevel = parseInt(parts[2], 10) || 1
    const b = branchState.buildings[buildingId]
    return !!b && b.level >= minLevel
  }
  if (unlock.startsWith('prestige:')) {
    const min = parseInt(unlock.split(':')[1], 10) || 0
    return gameState.get().totalPrestige >= min
  }
  if (unlock.startsWith('upgrade:')) {
    const upgradeId = unlock.split(':')[1]
    return branchState.upgrades.includes(upgradeId)
  }
  return true
}

export function updateBuildingUnlocks(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    BUILDINGS.forEach(def => {
      const b = branch.buildings[def.id]
      if (!b) return
      if (!b.unlocked && checkBuildingUnlocked(def.unlock, branch)) {
        b.unlocked = true
        eventBus.emit('building:unlocked', { branchId, buildingId: def.id })
      }
    })
  })
}

export function getBuildingIncome(branchState: BranchState, buildingId: string): number {
  const def = BUILDING_MAP[buildingId]
  if (!def) return 0

  const bState = branchState.buildings[buildingId]
  if (!bState || bState.level === 0 || !bState.unlocked) return 0

  const baseRate = def.baseRate
  const buildingLevelMult = Math.pow(BUILDING_INCOME_GROWTH, bState.level)

  let staffMult = 1
  let traitIncomeMult = 1
  Object.values(branchState.staff).forEach(staff => {
    if (staff.assignedTo === buildingId) {
      const staffDef = STAFF_MAP[staff.typeId]
      if (staffDef) {
        const isMatch = staffDef.bestMatch.includes(buildingId)
        const effectPerLevel = isMatch ? staffDef.effectPerLevel * 1.25 : staffDef.effectPerLevel
        staffMult *= (1 + staff.level * effectPerLevel)
        traitIncomeMult *= getTraitMultiplier(staff.traits, 'incomeMult')
      }
    }
  })

  return baseRate * buildingLevelMult * staffMult * traitIncomeMult
}

export function getBranchIncomePerSecond(branchId?: BranchId): number {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const cached = getCachedBranchIncome(id)
  if (cached !== null) return cached
  const result = _computeBranchIncomePerSecond(id)
  if (_tickCache) _tickCache.set(id, result)
  return result
}

function _computeBranchIncomePerSecond(id: BranchId): number {
  const state = gameState.get()
  const branchState = state.branches[id]
  if (!branchState) return 0

  let total = 0
  BUILDINGS.forEach(def => {
    total += getBuildingIncome(branchState, def.id)
  })

  // Royal buildings income (only for royal branches)
  total += getRoyalBuildingsIncome(id)

  // Chef max ability: +10% to ALL building income
  total *= getChefAllBuildingBonus(id)

  // Prestige multiplier
  const prestigeMult = 1 + (state.tableFavor * 0.02)

  // HQ multiplier
  const hqMult = id === state.hqBranch ? 1.2 : 1.0

  // Guest satisfaction multiplier
  const satMult = 0.5 + (branchState.guestSatisfaction / 100)

  // Reputation multiplier
  let repMult = 1.0
  if (branchState.reputation >= 1000) repMult = 1.95
  else if (branchState.reputation >= 750) repMult = 1.70
  else if (branchState.reputation >= 500) repMult = 1.45
  else if (branchState.reputation >= 300) repMult = 1.20
  else if (branchState.reputation >= 100) repMult = 1.10

  // Active income multiplier buffs
  let buffMult = 1.0
  state.activeBuffs.forEach(buff => {
    if (buff.type === 'incomeMultiplier' &&
        (buff.branchId === null || buff.branchId === id) &&
        (buff.expiresAt === null || buff.expiresAt > Date.now())) {
      buffMult *= buff.value
    }
  })

  // Permanent income bonus from events
  const permBonus = 1 + state.permanentIncomeBonus

  // Check for income freeze buff (excommunicado)
  const hasFreeze = state.activeBuffs.some(b =>
    b.type === 'incomeFreeze' &&
    (b.branchId === null || b.branchId === id) &&
    (b.expiresAt === null || b.expiresAt > Date.now())
  )
  if (hasFreeze && !hasEnforcer(id)) {
    if (getBartenderFreezeImmune(id)) {
      const barIncome = getBuildingIncome(branchState, 'bar') * getChefAllBuildingBonus(id)
      const conciergeBonus = getConciergePassiveBonus(id)
      const skillIncomeMult = getTotalIncomeMult()
      const royalIncomeMult = getRoyalIncomeMult()
      const sovereignMult = getSovereignBuffMult()
      const decreeIncomeMult = 1 + sovereignManager.getActiveDecreeMult('incomeMultiplier')
      return barIncome * prestigeMult * hqMult * satMult * repMult * buffMult * sovereignMult * decreeIncomeMult * permBonus * conciergeBonus * skillIncomeMult * royalIncomeMult
    }
    return 0
  }

  // Concierge max ability: +5% passive income
  const conciergeBonus = getConciergePassiveBonus(id)

  // Commerce skill tree income multiplier
  const skillIncomeMult = getTotalIncomeMult()

  // Royal skill tree income multiplier
  const royalIncomeMult = getRoyalIncomeMult()

  // Sovereign bonus: all buffs doubled
  const sovereignMult = getSovereignBuffMult()

  // Royal Decree income multiplier (active decrees)
  const decreeIncomeMult = 1 + sovereignManager.getActiveDecreeMult('incomeMultiplier')

  return total * prestigeMult * hqMult * satMult * repMult * buffMult * sovereignMult * decreeIncomeMult * permBonus * conciergeBonus * skillIncomeMult * royalIncomeMult
}

export function getBuildingCost(branchState: BranchState, buildingId: string, count: number = 1): number {
  const def = BUILDING_MAP[buildingId]
  if (!def) return Infinity

  const bState = branchState.buildings[buildingId]
  if (!bState) return Infinity

  const currentLevel = bState.level
  let totalCost = 0
  for (let i = 0; i < count; i++) {
    totalCost += def.baseCost * Math.pow(def.costGrowth, currentLevel + i)
  }
  return Math.ceil(totalCost)
}

export function getAffordableLevels(branchState: BranchState, buildingId: string): number {
  const def = BUILDING_MAP[buildingId]
  if (!def) return 0

  const n = branchState.buildings[buildingId]?.level || 0
  const remaining = def.maxLevel - n
  if (remaining <= 0) return 0

  // Free building: can afford all remaining levels
  if (def.baseCost === 0) return remaining

  const g = def.costGrowth
  const currency = branchState.currency
  const baseCostAtN = def.baseCost * Math.pow(g, n)

  if (currency < baseCostAtN) return 0
  if (g === 1) return Math.min(remaining, Math.floor(currency / baseCostAtN))

  const levels = Math.floor(
    Math.log((currency * (g - 1) / baseCostAtN) + 1) / Math.log(g) + 1e-9
  )
  return Math.max(0, Math.min(levels, remaining))
}

export function purchaseBuilding(buildingId: string, count?: number): boolean {
  const state = gameState.get()
  const branch = state.branches[state.activeBranch]
  const def = BUILDING_MAP[buildingId]
  if (!def) return false
  if (!branch) return false

  const bState = branch.buildings[buildingId]
  if (!bState || !bState.unlocked) return false

  let buyCount = count || state.buyMultiplier
  if (!Number.isFinite(buyCount) || buyCount < 0) {
    buyCount = 1
  }
  if (buyCount === 0) {
    buyCount = getAffordableLevels(branch, buildingId)
  }
  if (buyCount <= 0) return false

  // Cap at max level
  const maxPurchasable = def.maxLevel - bState.level
  buyCount = Math.min(buyCount, maxPurchasable)
  if (buyCount <= 0) return false

  // Free building (reception at level 0)
  if (def.baseCost === 0) {
    bState.level += buyCount
    if (!_suppressUIEvents) eventBus.emit('income:update')
    return true
  }

  const cost = getBuildingCost(branch, buildingId, buyCount)
  if (branch.currency < cost) return false

  branch.currency -= cost
  bState.level += buyCount
  if (!_suppressUIEvents) eventBus.emit('income:update')
  return true
}

export function tick(): void {
  const state = gameState.get()
  const activeId = state.activeBranch
  const activeBranch = state.branches[activeId]
  if (!activeBranch) return

  beginTickCache()

  // Clean expired buffs
  const now = Date.now()
  state.activeBuffs = state.activeBuffs.filter(b => b.expiresAt === null || b.expiresAt > now)

  // Active branch full income
  const activeIncome = getBranchIncomePerSecond(activeId)
  activeBranch.currency += activeIncome
  activeBranch.lifetimeEarnings += activeIncome

  // Inactive BRANCHES 50% income
  state.worldMap.unlockedBranches.forEach(branchId => {
    if (branchId === activeId) return
    const branch = state.branches[branchId]
    if (!branch) return
    const inactiveRate = branch.upgrades.includes('continentalCharter') ? 0.6 : 0.5
    const inactiveIncome = getBranchIncomePerSecond(branchId) * inactiveRate
    branch.currency += inactiveIncome
    branch.lifetimeEarnings += inactiveIncome
  })

  state.totalPlayTime += 1
  if (!_suppressUIEvents) {
    eventBus.emit('income:tick', { income: activeIncome })
  }

  endTickCache()
}
