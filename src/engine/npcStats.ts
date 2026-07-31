import type { CharacterStats, Rarity } from '@/types'
import { RARITY_CONFIG } from '@/data/rarity'

export const POSITIVE_TRAIT_POOL = ['workaholic', 'nightOwl', 'silverTongue', 'luckyCharm', 'perfectionist', 'naturalLeader', 'shadowTouched', 'bloodhound', 'oldGuard', 'efficient']
export const NEGATIVE_TRAIT_POOL = ['lazy', 'hotHeaded', 'clumsy', 'superstitious', 'greedy']
export const RARE_TRAIT_POOL = ['legendary', 'untouchable', 'mentor', 'shadowBond', 'goldenTouch']

export interface StatRollOptions {
  statBudgetBonus?: number
  statMinBonus?: number
  statMaxBonus?: number
}

export function rollStats(rarity: Rarity, options: StatRollOptions = {}): CharacterStats {
  const cfg = RARITY_CONFIG[rarity]
  const budget = cfg.statBudget + (options.statBudgetBonus ?? 0)
  const min = cfg.statMin + (options.statMinBonus ?? 0)
  const max = cfg.statMax + (options.statMaxBonus ?? 0)
  const stats: CharacterStats = { precision: min, speed: min, charisma: min, luck: min }
  let remaining = budget - (min * 4)
  const keys: (keyof CharacterStats)[] = ['precision', 'speed', 'charisma', 'luck']
  while (remaining > 0) {
    if (keys.every(k => stats[k] >= max)) break
    const key = keys[Math.floor(Math.random() * keys.length)]
    if (stats[key] < max) {
      stats[key]++
      remaining--
    }
  }
  return stats
}

export interface TraitRollOptions {
  /** Maximum number of positive traits to roll (staff: 2, assassin: 1). */
  maxPositive?: number
  /** Whether a negative trait can be rolled. */
  allowNegative?: boolean
  /** If true, only one trait total is rolled: rare OR a single positive (legacy assassin behavior). */
  singleTrait?: boolean
}

export function rollTraits(rarity: Rarity, options: TraitRollOptions = {}): string[] {
  const { maxPositive = 2, allowNegative = true, singleTrait = false } = options
  const cfg = RARITY_CONFIG[rarity]
  const traits: string[] = []

  if (singleTrait) {
    const roll = Math.random()
    if (roll < cfg.traitRareChance) {
      traits.push(RARE_TRAIT_POOL[Math.floor(Math.random() * RARE_TRAIT_POOL.length)])
    } else if (roll < cfg.traitRareChance + cfg.traitPositiveChance) {
      traits.push(POSITIVE_TRAIT_POOL[Math.floor(Math.random() * POSITIVE_TRAIT_POOL.length)])
    }
    return traits
  }

  if (Math.random() < cfg.traitRareChance) {
    traits.push(RARE_TRAIT_POOL[Math.floor(Math.random() * RARE_TRAIT_POOL.length)])
  } else {
    for (let i = 0; i < maxPositive; i++) {
      if (Math.random() < cfg.traitPositiveChance) {
        const t = POSITIVE_TRAIT_POOL[Math.floor(Math.random() * POSITIVE_TRAIT_POOL.length)]
        if (!traits.includes(t)) traits.push(t)
      }
    }
  }

  if (allowNegative && Math.random() < cfg.traitNegativeChance) {
    traits.push(NEGATIVE_TRAIT_POOL[Math.floor(Math.random() * NEGATIVE_TRAIT_POOL.length)])
  }

  return traits
}
