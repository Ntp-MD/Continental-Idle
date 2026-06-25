import type { BuildingDefinition } from '../types'

export const BUILDINGS: BuildingDefinition[] = [
  { id: 'reception', name: 'Reception Desk', baseRate: 1, baseCost: 0, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'guestRooms', name: 'Guest Rooms', baseRate: 5, baseCost: 50, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'bar', name: 'Bar/Lounge', baseRate: 15, baseCost: 500, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'kitchen', name: 'Kitchen', baseRate: 40, baseCost: 2000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'laundry', name: 'Laundry Service', baseRate: 100, baseCost: 8000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'underground', name: 'Underground Services', baseRate: 300, baseCost: 25000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'safeHouse', name: 'Safe House', baseRate: 800, baseCost: 75000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'armory', name: 'Armory', baseRate: 2000, baseCost: 200000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'intelNetwork', name: 'Intelligence Network', baseRate: 5000, baseCost: 600000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'vip', name: 'VIP Penthouse', baseRate: 15000, baseCost: 2000000, costGrowth: 1.15, maxLevel: 50, unlock: 'start' },
  { id: 'blackMarket', name: 'Black Market Vault', baseRate: 50000, baseCost: 10000000, costGrowth: 1.25, maxLevel: 50, unlock: 'start' },
  { id: 'vault', name: 'Continental Vault', baseRate: 200000, baseCost: 100000000, costGrowth: 1.35, maxLevel: 50, unlock: 'start' },
]

export const BUILDING_INCOME_GROWTH = 1.07
