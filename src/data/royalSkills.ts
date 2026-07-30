export interface RoyalSkillNode {
  branch: 'royalIncome' | 'royalLoyalty' | 'royalPower' | 'royalFavor' | 'royalAscension'
  level: number
  name: string
  description: string
  royalMarkCost: number
  effect: {
    incomeMult?: number
    loyaltyDecayReduction?: number
    assassinPowerMult?: number
    favorMult?: number
    royalPrestigeMult?: number
    buffDurationMult?: number
  }
}

export const ROYAL_SKILL_MAX_LEVEL = 5

export const ROYAL_SKILL_NODES: RoyalSkillNode[] = [
  { branch: 'royalIncome', level: 1, name: 'Royal Trade', description: '+10% income per level', royalMarkCost: 5, effect: { incomeMult: 0.10 } },
  { branch: 'royalIncome', level: 2, name: 'Royal Monopoly', description: '+15% income per level', royalMarkCost: 10, effect: { incomeMult: 0.15 } },
  { branch: 'royalIncome', level: 3, name: 'Royal Treasury', description: '+20% income per level', royalMarkCost: 20, effect: { incomeMult: 0.20 } },
  { branch: 'royalIncome', level: 4, name: 'Royal Wealth', description: '+25% income per level', royalMarkCost: 40, effect: { incomeMult: 0.25 } },
  { branch: 'royalIncome', level: 5, name: 'Continental Fortune', description: '+30% income, +50% buff duration', royalMarkCost: 80, effect: { incomeMult: 0.30, buffDurationMult: 0.50 } },

  { branch: 'royalLoyalty', level: 1, name: 'Royal Bond', description: '-10% loyalty decay per level', royalMarkCost: 5, effect: { loyaltyDecayReduction: 0.10 } },
  { branch: 'royalLoyalty', level: 2, name: 'Royal Oath', description: '-15% loyalty decay per level', royalMarkCost: 10, effect: { loyaltyDecayReduction: 0.15 } },
  { branch: 'royalLoyalty', level: 3, name: 'Royal Fealty', description: '-20% loyalty decay per level', royalMarkCost: 20, effect: { loyaltyDecayReduction: 0.20 } },
  { branch: 'royalLoyalty', level: 4, name: 'Eternal Bond', description: '-25% loyalty decay per level', royalMarkCost: 40, effect: { loyaltyDecayReduction: 0.25 } },
  { branch: 'royalLoyalty', level: 5, name: 'Unbreakable Vow', description: '-30% loyalty decay, +50% buff duration', royalMarkCost: 80, effect: { loyaltyDecayReduction: 0.30, buffDurationMult: 0.50 } },

  { branch: 'royalPower', level: 1, name: 'Royal Guard', description: '+10% assassin power per level', royalMarkCost: 5, effect: { assassinPowerMult: 0.10 } },
  { branch: 'royalPower', level: 2, name: 'Royal Strike', description: '+15% assassin power per level', royalMarkCost: 10, effect: { assassinPowerMult: 0.15 } },
  { branch: 'royalPower', level: 3, name: 'Royal Assault', description: '+20% assassin power per level', royalMarkCost: 20, effect: { assassinPowerMult: 0.20 } },
  { branch: 'royalPower', level: 4, name: 'Royal Conquest', description: '+25% assassin power per level', royalMarkCost: 40, effect: { assassinPowerMult: 0.25 } },
  { branch: 'royalPower', level: 5, name: 'Sovereign Force', description: '+30% assassin power, +50% buff duration', royalMarkCost: 80, effect: { assassinPowerMult: 0.30, buffDurationMult: 0.50 } },

  { branch: 'royalFavor', level: 1, name: 'Royal Favor', description: '+10% prestige favor per level', royalMarkCost: 5, effect: { favorMult: 0.10 } },
  { branch: 'royalFavor', level: 2, name: 'Royal Blessing', description: '+15% prestige favor per level', royalMarkCost: 10, effect: { favorMult: 0.15 } },
  { branch: 'royalFavor', level: 3, name: 'Royal Patronage', description: '+20% prestige favor per level', royalMarkCost: 20, effect: { favorMult: 0.20 } },
  { branch: 'royalFavor', level: 4, name: 'Royal Endowment', description: '+25% prestige favor per level', royalMarkCost: 40, effect: { favorMult: 0.25 } },
  { branch: 'royalFavor', level: 5, name: 'Continental Grace', description: '+30% prestige favor, +50% buff duration', royalMarkCost: 80, effect: { favorMult: 0.30, buffDurationMult: 0.50 } },

  { branch: 'royalAscension', level: 1, name: 'Royal Ascension', description: '+10% royal prestige per level', royalMarkCost: 8, effect: { royalPrestigeMult: 0.10 } },
  { branch: 'royalAscension', level: 2, name: 'Eternal Throne', description: '+15% royal prestige per level', royalMarkCost: 16, effect: { royalPrestigeMult: 0.15 } },
  { branch: 'royalAscension', level: 3, name: 'Divine Right', description: '+20% royal prestige per level', royalMarkCost: 32, effect: { royalPrestigeMult: 0.20 } },
  { branch: 'royalAscension', level: 4, name: 'Sovereign Will', description: '+25% royal prestige per level', royalMarkCost: 64, effect: { royalPrestigeMult: 0.25 } },
  { branch: 'royalAscension', level: 5, name: 'Eternal Sovereign', description: '+30% royal prestige, +50% buff duration', royalMarkCost: 128, effect: { royalPrestigeMult: 0.30, buffDurationMult: 0.50 } },
]

export function getRoyalSkillNode(branch: string, level: number): RoyalSkillNode | undefined {
  return ROYAL_SKILL_NODES.find(n => n.branch === branch && n.level === level)
}

export function getRoyalBranchNodes(branch: string): RoyalSkillNode[] {
  return ROYAL_SKILL_NODES.filter(n => n.branch === branch).sort((a, b) => a.level - b.level)
}
