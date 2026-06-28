import type { SupplyRouteType } from '@/types'

export interface SupplyRouteTypeDef {
  id: SupplyRouteType
  name: string
  description: string
  baseIncome: number
  baseStability: number
  stabilityDecayPerTick: number
  establishCost: number
  hijackCost: number
  color: string
  icon: string
}

export const SUPPLY_ROUTE_TYPES: SupplyRouteTypeDef[] = [
  {
    id: 'weapons',
    name: 'Weapons Trafficking',
    description: 'High-risk, high-reward illegal arms supply line. Generates strong income but stability decays fast.',
    baseIncome: 500,
    baseStability: 80,
    stabilityDecayPerTick: 0.5,
    establishCost: 50_000,
    hijackCost: 100_000,
    color: '#ff5722',
    icon: '\u2694',
  },
  {
    id: 'contraband',
    name: 'Contraband Smuggling',
    description: 'Balanced smuggling route. Moderate income with reasonable stability.',
    baseIncome: 250,
    baseStability: 90,
    stabilityDecayPerTick: 0.3,
    establishCost: 25_000,
    hijackCost: 50_000,
    color: '#ff9800',
    icon: '\u2693',
  },
  {
    id: 'luxury',
    name: 'Luxury Black Market',
    description: 'Low-risk luxury goods trafficking. Stable income with slow decay.',
    baseIncome: 100,
    baseStability: 100,
    stabilityDecayPerTick: 0.15,
    establishCost: 10_000,
    hijackCost: 25_000,
    color: '#ffd700',
    icon: '\u2728',
  },
]

export const SUPPLY_ROUTE_MAP: Record<SupplyRouteType, SupplyRouteTypeDef> = SUPPLY_ROUTE_TYPES.reduce(
  (map, def) => { map[def.id] = def; return map },
  {} as Record<SupplyRouteType, SupplyRouteTypeDef>
)

export function getRouteTypeDef(type: SupplyRouteType): SupplyRouteTypeDef | undefined {
  return SUPPLY_ROUTE_MAP[type]
}
