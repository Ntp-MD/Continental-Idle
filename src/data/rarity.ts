export type Rarity = 'D' | 'C' | 'B' | 'A' | 'S'

export interface RarityConfig {
  probability: number
  statBudget: number
  statMin: number
  statMax: number
  traitRareChance: number
  traitPositiveChance: number
  traitNegativeChance: number
  costMultiplier: number
  color: string
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  D: { probability: 0.40, statBudget: 12, statMin: 1, statMax: 5,  traitRareChance: 0.02, traitPositiveChance: 0.30, traitNegativeChance: 0.50, costMultiplier: 0.5,  color: '#9e9e9e' },
  C: { probability: 0.30, statBudget: 16, statMin: 2, statMax: 7,  traitRareChance: 0.05, traitPositiveChance: 0.45, traitNegativeChance: 0.35, costMultiplier: 1.0,  color: '#4caf50' },
  B: { probability: 0.20, statBudget: 20, statMin: 3, statMax: 9,  traitRareChance: 0.10, traitPositiveChance: 0.55, traitNegativeChance: 0.25, costMultiplier: 1.5,  color: '#2196f3' },
  A: { probability: 0.08, statBudget: 26, statMin: 4, statMax: 12, traitRareChance: 0.20, traitPositiveChance: 0.65, traitNegativeChance: 0.15, costMultiplier: 2.5,  color: '#9c27b0' },
  S: { probability: 0.02, statBudget: 32, statMin: 5, statMax: 15, traitRareChance: 0.35, traitPositiveChance: 0.75, traitNegativeChance: 0.05, costMultiplier: 4.0,  color: '#ffd700' },
}

export const CALL_VISITOR_RARITY: Record<Rarity, number> = {
  D: 0.35, C: 0.35, B: 0.20, A: 0.08, S: 0.02,
}

export const ROYAL_MARK_RARITY: Record<Rarity, number> = {
  D: 0, C: 0, B: 0.70, A: 0.25, S: 0.05,
}

export const RANDOM_SPAWN_RARITY: Record<Rarity, number> = {
  D: 0.40, C: 0.30, B: 0.20, A: 0.08, S: 0.02,
}

export const STAFF_SPAWN_CHANCE = 0.70

export const RARITY_ORDER: Rarity[] = ['D', 'C', 'B', 'A', 'S']

export function rollRarity(rates: Record<Rarity, number> = RARITY_CONFIG as unknown as Record<Rarity, number>): Rarity {
  const roll = Math.random()
  let cumulative = 0
  for (const r of RARITY_ORDER) {
    cumulative += rates[r]
    if (roll < cumulative) return r
  }
  return 'D'
}

export function rollRarityFromConfig(): Rarity {
  const roll = Math.random()
  let cumulative = 0
  for (const r of RARITY_ORDER) {
    cumulative += RARITY_CONFIG[r].probability
    if (roll < cumulative) return r
  }
  return 'D'
}

export function getRarityColor(rarity: Rarity): string {
  return RARITY_CONFIG[rarity].color
}

export function getRarityCostMult(rarity: Rarity): number {
  return RARITY_CONFIG[rarity].costMultiplier
}
