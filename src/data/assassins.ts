import type { AssassinDefinition } from '../types'

export const ASSASSIN_TYPES: AssassinDefinition[] = [
  { id: 'streetSamurai', name: 'Street Samurai', rank: 'D', hireCost: 50000, ability: 'Reduces heat by 2 when assigned', themeLock: null },
  { id: 'enforcer', name: 'Enforcer', rank: 'C', hireCost: 200000, ability: 'Protects theme from income freeze events', themeLock: null },
  { id: 'shadowBlade', name: 'Shadow Blade', rank: 'B', hireCost: 1_000_000, ability: 'Doubles reputation gain from events', themeLock: null },
  { id: 'royalGuard', name: 'Royal Guard', rank: 'A', hireCost: 10_000_000, ability: 'Halves marker debt accrual rate', themeLock: null },
  { id: 'highTableEnforcer', name: 'High Table Enforcer', rank: 'S', hireCost: 100_000_000, ability: 'Prevents excommunicado events entirely', themeLock: null },
]
