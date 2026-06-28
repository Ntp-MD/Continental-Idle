export interface SkillNode {
  branch: 'commerce' | 'personnel' | 'shadow' | 'diplomacy' | 'ascension'
  level: number
  name: string
  description: string
  favorCost: number
  effect: {
    incomeMult?: number
    staffXpMult?: number
    debtReduction?: number
    heatReduction?: number
    reputationMult?: number
    prestigeFavorMult?: number
    buffDurationMult?: number
    unlockSlot?: number
  }
}

export const SKILL_MAX_LEVEL = 5

export const SKILL_NODES: SkillNode[] = [
  { branch: 'commerce', level: 1, name: 'Trade Routes', description: '+5% income per level', favorCost: 10, effect: { incomeMult: 0.05 } },
  { branch: 'commerce', level: 2, name: 'Market Control', description: '+10% income per level', favorCost: 25, effect: { incomeMult: 0.10 } },
  { branch: 'commerce', level: 3, name: 'Monopoly', description: '+15% income per level', favorCost: 50, effect: { incomeMult: 0.15 } },
  { branch: 'commerce', level: 4, name: 'Global Empire', description: '+20% income per level', favorCost: 100, effect: { incomeMult: 0.20 } },
  { branch: 'commerce', level: 5, name: 'Continental Trust', description: '+25% income per level', favorCost: 200, effect: { incomeMult: 0.25 } },

  { branch: 'personnel', level: 1, name: 'Training Program', description: '+10% staff XP per level', favorCost: 10, effect: { staffXpMult: 0.10 } },
  { branch: 'personnel', level: 2, name: 'Loyalty System', description: '+15% staff XP per level', favorCost: 25, effect: { staffXpMult: 0.15 } },
  { branch: 'personnel', level: 3, name: 'Elite Corps', description: '+20% staff XP per level', favorCost: 50, effect: { staffXpMult: 0.20 } },
  { branch: 'personnel', level: 4, name: 'Veteran Network', description: '+25% staff XP per level', favorCost: 100, effect: { staffXpMult: 0.25 } },
  { branch: 'personnel', level: 5, name: 'Legendary Command', description: '+30% staff XP, +1 staff slot', favorCost: 200, effect: { staffXpMult: 0.30, unlockSlot: 1 } },

  { branch: 'shadow', level: 1, name: 'Whisper Network', description: '-5% debt accrual per level', favorCost: 10, effect: { debtReduction: 0.05 } },
  { branch: 'shadow', level: 2, name: 'Shadow Channels', description: '-10% debt accrual per level', favorCost: 25, effect: { debtReduction: 0.10 } },
  { branch: 'shadow', level: 3, name: 'Smuggling Routes', description: '-15% debt accrual, -1 heat on resolve', favorCost: 50, effect: { debtReduction: 0.15, heatReduction: 1 } },
  { branch: 'shadow', level: 4, name: 'Underground Bank', description: '-20% debt accrual per level', favorCost: 100, effect: { debtReduction: 0.20 } },
  { branch: 'shadow', level: 5, name: 'High Table Insider', description: '-25% debt, +50% buff duration', favorCost: 200, effect: { debtReduction: 0.25, buffDurationMult: 0.50 } },

  { branch: 'diplomacy', level: 1, name: 'Goodwill', description: '+10% reputation gain per level', favorCost: 10, effect: { reputationMult: 0.10 } },
  { branch: 'diplomacy', level: 2, name: 'Ambassador', description: '+15% reputation gain per level', favorCost: 25, effect: { reputationMult: 0.15 } },
  { branch: 'diplomacy', level: 3, name: 'Treaty Bonds', description: '+20% reputation gain per level', favorCost: 50, effect: { reputationMult: 0.20 } },
  { branch: 'diplomacy', level: 4, name: 'Continental Accord', description: '+25% reputation gain per level', favorCost: 100, effect: { reputationMult: 0.25 } },
  { branch: 'diplomacy', level: 5, name: 'Diplomatic Immunity', description: '+30% reputation, -2 heat passive decay', favorCost: 200, effect: { reputationMult: 0.30, heatReduction: 2 } },

  { branch: 'ascension', level: 1, name: 'Favor Bank', description: '+10% prestige favor per level', favorCost: 15, effect: { prestigeFavorMult: 0.10 } },
  { branch: 'ascension', level: 2, name: 'Ascension Rite', description: '+15% prestige favor per level', favorCost: 35, effect: { prestigeFavorMult: 0.15 } },
  { branch: 'ascension', level: 3, name: 'Eternal Cycle', description: '+20% prestige favor per level', favorCost: 75, effect: { prestigeFavorMult: 0.20 } },
  { branch: 'ascension', level: 4, name: 'Transcendence', description: '+25% prestige favor per level', favorCost: 150, effect: { prestigeFavorMult: 0.25 } },
  { branch: 'ascension', level: 5, name: 'Continental Ascension', description: '+30% prestige favor per level', favorCost: 300, effect: { prestigeFavorMult: 0.30 } },
]

export function getSkillNode(branch: string, level: number): SkillNode | undefined {
  return SKILL_NODES.find(n => n.branch === branch && n.level === level)
}

export function getBranchNodes(branch: string): SkillNode[] {
  return SKILL_NODES.filter(n => n.branch === branch).sort((a, b) => a.level - b.level)
}
