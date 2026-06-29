import type { StaffDefinition } from '@/types'

export const STAFF_TYPES: StaffDefinition[] = [
  { id: 'concierge', name: 'Concierge', hireCost: 1000, unlock: 'start', maxLevel: 10, effectPerLevel: 0.10, bestMatch: ['reception', 'guestRooms', 'vip'], maxAbility: 'Auto-collect guest tips (+5% passive income)' },
  { id: 'bartender', name: 'Bartender', hireCost: 3000, unlock: 'bar', maxLevel: 10, effectPerLevel: 0.10, bestMatch: ['bar'], maxAbility: 'Bar income continues during excommunicado' },
  { id: 'chef', name: 'Chef', hireCost: 8000, unlock: 'kitchen', maxLevel: 10, effectPerLevel: 0.15, bestMatch: ['kitchen'], maxAbility: 'Kitchen boosts ALL building income by +10%' },
  { id: 'cleaner', name: 'Cleaner', hireCost: 15000, unlock: 'underground', maxLevel: 10, effectPerLevel: 0.05, bestMatch: ['underground', 'laundry'], maxAbility: 'All negative event penalties negated' },
  { id: 'sommelier', name: 'Sommelier', hireCost: 50000, unlock: 'upgrade:privateWing', maxLevel: 10, effectPerLevel: 0.20, bestMatch: ['vip', 'bar', 'guestRooms'], maxAbility: 'VIP guests arrive 50% more frequently' },
  { id: 'intelOfficer', name: 'Intelligence Officer', hireCost: 100000, unlock: 'intelNetwork', maxLevel: 10, effectPerLevel: 0.03, bestMatch: ['intelNetwork', 'underground'], maxAbility: 'All event outcomes revealed before choosing' },
  { id: 'adjudicator', name: 'Adjudicator', hireCost: 250000, unlock: 'prestige:3', maxLevel: 10, effectPerLevel: 0.05, bestMatch: ['vault'], maxAbility: 'Prestige keeps 80% reputation instead of 50%' },
  { id: 'vaultKeeper', name: 'Vault Keeper', hireCost: 500000, unlock: 'vault', maxLevel: 10, effectPerLevel: 0.05, bestMatch: ['safeHouse', 'blackMarket', 'vault'], maxAbility: 'Safe House interest doubles to 4%/min' },
]

export const STAFF_MAP: Record<string, StaffDefinition> = Object.fromEntries(
  STAFF_TYPES.map(s => [s.id, s])
)
