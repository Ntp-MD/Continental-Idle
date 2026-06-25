import { gameState } from './game-state'
import { STAFF_TYPES } from '../data/staff'
import type { ThemeId } from '../types'

export function hasMaxAbilityStaff(themeId: ThemeId, staffTypeId: string): boolean {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme) return false
  const def = STAFF_TYPES.find(s => s.id === staffTypeId)
  if (!def) return false

  return Object.values(theme.staff).some(s =>
    s.typeId === staffTypeId && s.level >= def.maxLevel
  )
}

export function hasCleanerMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'cleaner')
}

export function hasBartenderMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'bartender')
}

export function hasChefMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'chef')
}

export function hasConciergeMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'concierge')
}

export function hasAdjudicatorMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'adjudicator')
}

export function hasIntelOfficerMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'intelOfficer')
}

export function hasSommelierMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'sommelier')
}

export function hasVaultKeeperMaxed(themeId: ThemeId): boolean {
  return hasMaxAbilityStaff(themeId, 'vaultKeeper')
}

export function getChefAllBuildingBonus(themeId: ThemeId): number {
  return hasChefMaxed(themeId) ? 1.1 : 1.0
}

export function getConciergePassiveBonus(themeId: ThemeId): number {
  return hasConciergeMaxed(themeId) ? 1.05 : 1.0
}

export function getPrestigeReputationKeepRatio(themeId: ThemeId): number {
  return hasAdjudicatorMaxed(themeId) ? 0.8 : 0.5
}

export function shouldRevealEventOutcomes(themeId: ThemeId): boolean {
  return hasIntelOfficerMaxed(themeId)
}

export function getVipFrequencyMultiplier(themeId: ThemeId): number {
  return hasSommelierMaxed(themeId) ? 1.5 : 1.0
}

export function getBartenderFreezeImmune(themeId: ThemeId): boolean {
  return hasBartenderMaxed(themeId)
}
