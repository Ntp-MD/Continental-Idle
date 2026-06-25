import type { ThemeId, ThemeState } from '../types'
import { BUILDINGS, BUILDING_INCOME_GROWTH } from '../data/buildings'
import { STAFF_TYPES } from '../data/staff'
import { getTraitMultiplier } from '../data/traits'
import { getChefAllBuildingBonus, getConciergePassiveBonus, getBartenderFreezeImmune } from './abilities'
import { hasEnforcer } from './assassin-manager'
import { getTotalIncomeMult } from './skill-manager'
import { gameState, setIncomeFunction } from './game-state'
import { eventBus } from './event-bus'

export function getBuildingIncome(themeState: ThemeState, buildingId: string): number {
  const def = BUILDINGS.find(b => b.id === buildingId)
  if (!def) return 0

  const bState = themeState.buildings[buildingId]
  if (!bState || bState.level === 0) return 0

  const baseRate = def.baseRate
  const buildingLevelMult = Math.pow(BUILDING_INCOME_GROWTH, bState.level)

  let staffMult = 1
  let traitIncomeMult = 1
  Object.values(themeState.staff).forEach(staff => {
    if (staff.assignedTo === buildingId) {
      const staffDef = STAFF_TYPES.find(s => s.id === staff.typeId)
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

export function getThemeIncomePerSecond(themeId?: ThemeId): number {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const themeState = state.themes[id]
  if (!themeState) return 0

  let total = 0
  BUILDINGS.forEach(def => {
    total += getBuildingIncome(themeState, def.id)
  })

  // Chef max ability: +10% to ALL building income
  total *= getChefAllBuildingBonus(id)

  // Prestige multiplier
  const prestigeMult = 1 + (state.tableFavor * 0.02)

  // HQ multiplier
  const hqMult = id === state.hqCountry ? 1.2 : 1.0

  // Guest satisfaction multiplier
  const satMult = 0.5 + (themeState.guestSatisfaction / 100)

  // Reputation multiplier
  let repMult = 1.0
  if (themeState.reputation >= 1000) repMult = 1.95
  else if (themeState.reputation >= 750) repMult = 1.70
  else if (themeState.reputation >= 500) repMult = 1.45
  else if (themeState.reputation >= 300) repMult = 1.20
  else if (themeState.reputation >= 100) repMult = 1.10

  // Active income multiplier buffs
  let buffMult = 1.0
  state.activeBuffs.forEach(buff => {
    if (buff.type === 'incomeMultiplier' &&
        (buff.themeId === null || buff.themeId === id) &&
        (buff.expiresAt === null || buff.expiresAt > Date.now())) {
      buffMult *= buff.value
    }
  })

  // Permanent income bonus from events
  const permBonus = 1 + state.permanentIncomeBonus

  // Check for income freeze buff (excommunicado)
  const hasFreeze = state.activeBuffs.some(b =>
    b.type === 'incomeFreeze' &&
    (b.themeId === null || b.themeId === id) &&
    (b.expiresAt === null || b.expiresAt > Date.now())
  )
  if (hasFreeze && !hasEnforcer(id)) {
    if (getBartenderFreezeImmune(id)) {
      const barIncome = getBuildingIncome(themeState, 'bar')
      const conciergeBonus = getConciergePassiveBonus(id)
      const skillIncomeMult = getTotalIncomeMult()
      return barIncome * prestigeMult * hqMult * satMult * repMult * buffMult * permBonus * conciergeBonus * skillIncomeMult
    }
    return 0
  }

  // Concierge max ability: +5% passive income
  const conciergeBonus = getConciergePassiveBonus(id)

  // Commerce skill tree income multiplier
  const skillIncomeMult = getTotalIncomeMult()

  return total * prestigeMult * hqMult * satMult * repMult * buffMult * permBonus * conciergeBonus * skillIncomeMult
}

export function getBuildingCost(themeState: ThemeState, buildingId: string, count: number = 1): number {
  const def = BUILDINGS.find(b => b.id === buildingId)
  if (!def) return Infinity

  const bState = themeState.buildings[buildingId]
  if (!bState) return Infinity

  const currentLevel = bState.level
  let totalCost = 0
  for (let i = 0; i < count; i++) {
    totalCost += def.baseCost * Math.pow(def.costGrowth, currentLevel + i)
  }
  return Math.ceil(totalCost)
}

export function getAffordableLevels(themeState: ThemeState, buildingId: string): number {
  const def = BUILDINGS.find(b => b.id === buildingId)
  if (!def) return 0

  const n = themeState.buildings[buildingId]?.level || 0
  const remaining = def.maxLevel - n
  if (remaining <= 0) return 0

  // Free building: can afford all remaining levels
  if (def.baseCost === 0) return remaining

  const g = def.costGrowth
  const currency = themeState.currency
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
  const theme = state.themes[state.activeTheme]
  const def = BUILDINGS.find(b => b.id === buildingId)
  if (!def) return false

  const bState = theme.buildings[buildingId]
  if (!bState || !bState.unlocked) return false

  let buyCount = count || state.buyMultiplier
  if (buyCount === 0) {
    buyCount = getAffordableLevels(theme, buildingId)
  }
  if (buyCount <= 0) return false

  // Cap at max level
  const maxPurchasable = def.maxLevel - bState.level
  buyCount = Math.min(buyCount, maxPurchasable)
  if (buyCount <= 0) return false

  // Free building (reception at level 0) — cap at 1 per purchase
  if (def.baseCost === 0) {
    bState.level += 1
    eventBus.emit('income:update')
    return true
  }

  const cost = getBuildingCost(theme, buildingId, buyCount)
  if (theme.currency < cost) return false

  theme.currency -= cost
  bState.level += buyCount
  eventBus.emit('income:update')
  return true
}

export function tick(): void {
  const state = gameState.get()
  const activeId = state.activeTheme
  const activeTheme = state.themes[activeId]
  if (!activeTheme) return

  // Clean expired buffs
  const now = Date.now()
  state.activeBuffs = state.activeBuffs.filter(b => b.expiresAt === null || b.expiresAt > now)

  // Active theme full income
  const activeIncome = getThemeIncomePerSecond(activeId)
  activeTheme.currency += activeIncome
  activeTheme.lifetimeEarnings += activeIncome

  // Inactive themes 50% income
  state.worldMap.unlockedNodes.forEach(themeId => {
    if (themeId === activeId) return
    const theme = state.themes[themeId]
    if (!theme) return
    const inactiveIncome = getThemeIncomePerSecond(themeId) * 0.5
    theme.currency += inactiveIncome
    theme.lifetimeEarnings += inactiveIncome
  })

  state.totalPlayTime += 1
  eventBus.emit('income:tick', { income: activeIncome })
}

// Register income function with game-state to break circular dependency
setIncomeFunction(getThemeIncomePerSecond)
