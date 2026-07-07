import type { AssassinDefinition } from '@/types'

export const ASSASSIN_TYPES: AssassinDefinition[] = [
  { id: 'streetSamurai', name: 'Street Samurai', rank: 'D', hireCost: 50000, ability: 'Reduces heat by 2 when assigned', branchLock: null, maxLevel: 10 },
  { id: 'enforcer', name: 'Enforcer', rank: 'C', hireCost: 200000, ability: 'Protects branch from income freeze events', branchLock: null, maxLevel: 10 },
  { id: 'shadowBlade', name: 'Shadow Blade', rank: 'B', hireCost: 1_000_000, ability: 'Doubles reputation gain from events', branchLock: null, maxLevel: 10 },
  { id: 'royalGuard', name: 'Royal Guard', rank: 'A', hireCost: 10_000_000, ability: 'Halves marker debt accrual rate', branchLock: null, maxLevel: 10 },
  { id: 'highTableEnforcer', name: 'High Table Enforcer', rank: 'S', hireCost: 100_000_000, ability: 'Prevents excommunicado events entirely', branchLock: null, maxLevel: 10 },
]

export const ASSASSIN_MAP: Record<string, AssassinDefinition> = Object.fromEntries(
  ASSASSIN_TYPES.map(a => [a.id, a])
)
