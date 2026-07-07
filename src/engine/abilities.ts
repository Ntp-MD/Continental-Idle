import { gameState } from './game-state'
import { STAFF_MAP } from '@/data/staff'
import type { BranchId } from '@/types'

export function hasMaxAbilityStaff(branchId: BranchId, staffTypeId: string): boolean {
  const state = gameState.get()
  const branch = state.branches[branchId]
  if (!branch) return false
  const def = STAFF_MAP[staffTypeId]
  if (!def) return false

  return Object.values(branch.staff).some(s =>
    s.typeId === staffTypeId && s.level >= def.maxLevel
  )
}

export function hasCleanerMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'cleaner')
}

export function hasBartenderMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'bartender')
}

export function hasChefMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'chef')
}

export function hasConciergeMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'concierge')
}

export function hasAdjudicatorMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'adjudicator')
}

export function hasIntelOfficerMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'intelOfficer')
}

export function hasSommelierMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'sommelier')
}

export function hasVaultKeeperMaxed(branchId: BranchId): boolean {
  return hasMaxAbilityStaff(branchId, 'vaultKeeper')
}

export function getChefAllBuildingBonus(branchId: BranchId): number {
  return hasChefMaxed(branchId) ? 1.1 : 1.0
}

export function getConciergePassiveBonus(branchId: BranchId): number {
  return hasConciergeMaxed(branchId) ? 1.05 : 1.0
}

export function getPrestigeReputationKeepRatio(branchId: BranchId): number {
  return hasAdjudicatorMaxed(branchId) ? 0.8 : 0.5
}

export function shouldRevealEventOutcomes(branchId: BranchId): boolean {
  return hasIntelOfficerMaxed(branchId)
}

export function getVipFrequencyMultiplier(branchId: BranchId): number {
  return hasSommelierMaxed(branchId) ? 1.5 : 1.0
}

export function getBartenderFreezeImmune(branchId: BranchId): boolean {
  return hasBartenderMaxed(branchId)
}
