import type { RoyalDecree } from '@/types'

export interface RoyalDecreeTemplate {
  type: RoyalDecree['type']
  name: string
  description: string
  value: number
  duration: number | null
}

export const DECREE_POOL: RoyalDecreeTemplate[] = [
  { type: 'incomeMultiplier', name: 'Golden Age', description: 'All income +50% for 24h', value: 0.5, duration: 24 * 3600 },
  { type: 'incomeMultiplier', name: 'Prosperity Edict', description: 'All income +25% for 48h', value: 0.25, duration: 48 * 3600 },
  { type: 'incomeMultiplier', name: 'Royal Treasury', description: 'All income +100% for 12h', value: 1.0, duration: 12 * 3600 },
  { type: 'permanentIncomeBonus', name: 'Eternal Wealth', description: '+1% permanent income bonus', value: 0.01, duration: null },
  { type: 'permanentIncomeBonus', name: 'Sovereign Dividend', description: '+2% permanent income bonus', value: 0.02, duration: null },
  { type: 'heatReduction', name: 'Shadow Amnesty', description: 'All heat reduced to 0 instantly', value: 0, duration: null },
  { type: 'heatReduction', name: 'Cooling Edict', description: 'No heat gain for 24h', value: -1, duration: 24 * 3600 },
  { type: 'debtReduction', name: 'Debt Forgiveness', description: 'All marker debts cleared', value: 0, duration: null },
  { type: 'debtReduction', name: 'Marker Pardon', description: '50% of all debts forgiven', value: 0.5, duration: null },
  { type: 'loyaltyBoost', name: 'Loyalty Oath', description: 'All assassin loyalty +20', value: 20, duration: null },
  { type: 'loyaltyBoost', name: 'Brotherhood Decree', description: 'No loyalty decay for 24h', value: -1, duration: 24 * 3600 },
]

export function rollDecrees(count: number = 3): RoyalDecreeTemplate[] {
  const pool = [...DECREE_POOL]
  const result: RoyalDecreeTemplate[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}
