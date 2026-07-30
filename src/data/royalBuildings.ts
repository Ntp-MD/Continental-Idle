export interface RoyalBuildingDef {
  id: string
  name: string
  baseRate: number
  baseCost: number
  costGrowth: number
  maxLevel: number
  description: string
}

export const ROYAL_BUILDINGS: RoyalBuildingDef[] = [
  { id: 'royalSuite', name: 'Royal Suite', baseRate: 500_000, baseCost: 50_000_000, costGrowth: 1.20, maxLevel: 30, description: 'Luxury suites for High Table elites' },
  { id: 'royalVault', name: 'Royal Vault', baseRate: 2_000_000, baseCost: 200_000_000, costGrowth: 1.22, maxLevel: 30, description: 'Secured vault for Continental treasures' },
  { id: 'royalArmory', name: 'Royal Armory', baseRate: 8_000_000, baseCost: 800_000_000, costGrowth: 1.25, maxLevel: 30, description: 'Elite weapons cache for Royal Guard' },
  { id: 'royalCourt', name: 'Royal Court', baseRate: 30_000_000, baseCost: 3_000_000_000, costGrowth: 1.28, maxLevel: 30, description: 'Throne room for Continental sovereignty' },
  { id: 'highTableChamber', name: 'High Table Chamber', baseRate: 100_000_000, baseCost: 10_000_000_000, costGrowth: 1.30, maxLevel: 30, description: 'Seat of power at the High Table' },
]

export const ROYAL_BUILDING_MAP: Record<string, RoyalBuildingDef> = Object.fromEntries(
  ROYAL_BUILDINGS.map(b => [b.id, b])
)

export const ROYAL_BUILDING_INCOME_GROWTH = 1.08
