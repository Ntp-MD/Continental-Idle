export interface TraitEffect {
  incomeMult?: number
  xpMult?: number
  costMult?: number
  negativeEventProtection?: boolean
}

export const TRAIT_EFFECTS: Record<string, TraitEffect> = {
  workaholic: { xpMult: 1.5 },
  nightOwl: { incomeMult: 1.1 },
  silverTongue: { incomeMult: 1.15 },
  luckyCharm: { incomeMult: 1.08, xpMult: 1.1 },
  perfectionist: { incomeMult: 1.12 },
  naturalLeader: { incomeMult: 1.05, xpMult: 1.2 },
  shadowTouched: { incomeMult: 1.1, negativeEventProtection: true },
  bloodhound: { xpMult: 1.3 },
  oldGuard: {},
  efficient: { costMult: 0.9 },

  lazy: { xpMult: 0.7 },
  hotHeaded: { incomeMult: 0.9 },
  clumsy: { incomeMult: 0.85 },
  superstitious: { incomeMult: 0.95 },
  greedy: { costMult: 1.2 },

  legendary: { incomeMult: 1.5, xpMult: 1.5 },
  untouchable: { incomeMult: 1.3, negativeEventProtection: true },
  mentor: { xpMult: 2.0 },
  shadowBond: { incomeMult: 1.25, negativeEventProtection: true },
  goldenTouch: { incomeMult: 1.4 },
}

export function getTraitMultiplier(traits: string[], key: 'incomeMult' | 'xpMult' | 'costMult'): number {
  let mult = 1
  for (const trait of traits) {
    const effect = TRAIT_EFFECTS[trait]
    if (effect && effect[key] !== undefined) {
      mult *= effect[key] as number
    }
  }
  return mult
}

export function hasTraitEffect(traits: string[], key: keyof TraitEffect): boolean {
  return traits.some(t => {
    const effect = TRAIT_EFFECTS[t]
    return effect && effect[key] === true
  })
}
