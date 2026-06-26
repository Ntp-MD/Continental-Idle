import type { BranchId } from '@/types'

export type Continent = 'north-america' | 'south-america' | 'europe' | 'asia' | 'africa' | 'oceania'

export interface BranchDefinition {
  id: BranchId
  name: string
  city: string
  currency: string
  accentColor: string
  unlockPrestige: number
  continent: Continent
  lat: number
  lon: number
}

export const BRANCHES: BranchDefinition[] = [
  // ── Starter HQs (unlockPrestige 0) ──
  { id: 'bangkok', name: 'Bangkok', city: 'Bangkok, Thailand', currency: 'Baht Coins', accentColor: '#f4c430', unlockPrestige: 0, continent: 'asia', lat: 13.7563, lon: 100.5018 },
  { id: 'newYork', name: 'New York', city: 'NYC, USA', currency: 'Gold Coins', accentColor: '#cccccc', unlockPrestige: 0, continent: 'north-america', lat: 40.7128, lon: -74.0060 },

  // ── Continental Branches ──
  { id: 'rome', name: 'Rome', city: 'Rome, Italy', currency: 'Lira Tokens', accentColor: '#d4a574', unlockPrestige: 1, continent: 'europe', lat: 41.9028, lon: 12.4964 },
  { id: 'casablanca', name: 'Casablanca', city: 'Casablanca, Morocco', currency: 'Desert Marks', accentColor: '#74d4a5', unlockPrestige: 5, continent: 'africa', lat: 33.5731, lon: -7.5898 },
  { id: 'osaka', name: 'Osaka', city: 'Osaka, Japan', currency: 'Sakura Credits', accentColor: '#d474a5', unlockPrestige: 12, continent: 'asia', lat: 34.6937, lon: 135.5023 },
  { id: 'paris', name: 'Paris', city: 'Paris, France', currency: 'Euro Marks', accentColor: '#a574d4', unlockPrestige: 22, continent: 'europe', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: 'Berlin', city: 'Berlin, Germany', currency: 'Iron Marks', accentColor: '#d47474', unlockPrestige: 35, continent: 'europe', lat: 52.5200, lon: 13.4050 },
  { id: 'dubai', name: 'Dubai', city: 'Dubai, UAE', currency: 'Dinar Coins', accentColor: '#74c2d4', unlockPrestige: 55, continent: 'asia', lat: 25.2048, lon: 55.2708 },

  // ── North America ──
  { id: 'washington', name: 'Washington D.C.', city: 'Washington D.C., USA', currency: 'Eagle Bonds', accentColor: '#4a90e2', unlockPrestige: 3, continent: 'north-america', lat: 38.9072, lon: -77.0369 },
  { id: 'losAngeles', name: 'Los Angeles', city: 'Los Angeles, USA', currency: 'Hollywood Credits', accentColor: '#50c878', unlockPrestige: 8, continent: 'north-america', lat: 34.0522, lon: -118.2437 },
  { id: 'mexicoCity', name: 'Mexico City', city: 'Mexico City, Mexico', currency: 'Peso Marks', accentColor: '#e8a838', unlockPrestige: 18, continent: 'north-america', lat: 19.4326, lon: -99.1332 },
  { id: 'havana', name: 'Havana', city: 'Havana, Cuba', currency: 'Cuban Notes', accentColor: '#c0392b', unlockPrestige: 28, continent: 'north-america', lat: 23.1136, lon: -82.3666 },
  { id: 'ottawa', name: 'Ottawa', city: 'Ottawa, Canada', currency: 'Maple Tokens', accentColor: '#e74c3c', unlockPrestige: 40, continent: 'north-america', lat: 45.4215, lon: -75.6972 },

  // ── South America ──
  { id: 'brasilia', name: 'Brasilia', city: 'Brasilia, Brazil', currency: 'Cruzado Coins', accentColor: '#50c878', unlockPrestige: 10, continent: 'south-america', lat: -15.8267, lon: -47.9218 },
  { id: 'buenosAires', name: 'Buenos Aires', city: 'Buenos Aires, Argentina', currency: 'Tango Marks', accentColor: '#9b59b6', unlockPrestige: 20, continent: 'south-america', lat: -34.6037, lon: -58.3816 },
  { id: 'bogota', name: 'Bogota', city: 'Bogota, Colombia', currency: 'Emerald Credits', accentColor: '#27ae60', unlockPrestige: 32, continent: 'south-america', lat: 4.7110, lon: -74.0721 },

  // ── Europe ──
  { id: 'london', name: 'London', city: 'London, UK', currency: 'Crown Notes', accentColor: '#7eb8e6', unlockPrestige: 2, continent: 'europe', lat: 51.5074, lon: -0.1278 },
  { id: 'madrid', name: 'Madrid', city: 'Madrid, Spain', currency: 'Iberian Marks', accentColor: '#e74c3c', unlockPrestige: 6, continent: 'europe', lat: 40.4168, lon: -3.7038 },
  { id: 'moscow', name: 'Moscow', city: 'Moscow, Russia', currency: 'Iron Rubles', accentColor: '#c0c0c0', unlockPrestige: 15, continent: 'europe', lat: 55.7558, lon: 37.6173 },
  { id: 'vienna', name: 'Vienna', city: 'Vienna, Austria', currency: 'Waltz Credits', accentColor: '#e8c872', unlockPrestige: 16, continent: 'europe', lat: 48.2082, lon: 16.3738 },
  { id: 'athens', name: 'Athens', city: 'Athens, Greece', currency: 'Drachma Tokens', accentColor: '#b8d4e8', unlockPrestige: 25, continent: 'europe', lat: 37.9838, lon: 23.7275 },
  { id: 'istanbul', name: 'Istanbul', city: 'Istanbul, Turkey', currency: 'Bosphorus Marks', accentColor: '#e8a838', unlockPrestige: 28, continent: 'europe', lat: 41.0082, lon: 28.9784 },
  { id: 'amsterdam', name: 'Amsterdam', city: 'Amsterdam, Netherlands', currency: 'Tulip Credits', accentColor: '#f39c12', unlockPrestige: 30, continent: 'europe', lat: 52.3676, lon: 4.9041 },
  { id: 'prague', name: 'Prague', city: 'Prague, Czech Republic', currency: 'Bohemian Coins', accentColor: '#8e44ad', unlockPrestige: 33, continent: 'europe', lat: 50.0755, lon: 14.4378 },

  // ── Asia ──
  { id: 'tokyo', name: 'Tokyo', city: 'Tokyo, Japan', currency: 'Neon Credits', accentColor: '#ff6b9d', unlockPrestige: 14, continent: 'asia', lat: 35.6762, lon: 139.6503 },
  { id: 'beijing', name: 'Beijing', city: 'Beijing, China', currency: 'Jade Marks', accentColor: '#e74c3c', unlockPrestige: 38, continent: 'asia', lat: 39.9042, lon: 116.4074 },
  { id: 'seoul', name: 'Seoul', city: 'Seoul, South Korea', currency: 'K-Wave Tokens', accentColor: '#a564d4', unlockPrestige: 18, continent: 'asia', lat: 37.5665, lon: 126.9780 },
  { id: 'hongKong', name: 'Hong Kong', city: 'Hong Kong, China', currency: 'Harbor Credits', accentColor: '#ff8c42', unlockPrestige: 20, continent: 'asia', lat: 22.3193, lon: 114.1694 },
  { id: 'singapore', name: 'Singapore', city: 'Singapore', currency: 'Lion City Marks', accentColor: '#1abc9c', unlockPrestige: 32, continent: 'asia', lat: 1.3521, lon: 103.8198 },
  { id: 'newDelhi', name: 'New Delhi', city: 'New Delhi, India', currency: 'Rajput Coins', accentColor: '#e67e22', unlockPrestige: 45, continent: 'asia', lat: 28.6139, lon: 77.2090 },
  { id: 'hanoi', name: 'Hanoi', city: 'Hanoi, Vietnam', currency: 'Lotus Credits', accentColor: '#74b9ff', unlockPrestige: 42, continent: 'asia', lat: 21.0285, lon: 105.8542 },

  // ── Africa ──
  { id: 'cairo', name: 'Cairo', city: 'Cairo, Egypt', currency: 'Pharaoh Coins', accentColor: '#d4a574', unlockPrestige: 26, continent: 'africa', lat: 30.0444, lon: 31.2357 },
  { id: 'rabat', name: 'Rabat', city: 'Rabat, Morocco', currency: 'Saharan Marks', accentColor: '#c9b037', unlockPrestige: 34, continent: 'africa', lat: 34.0209, lon: -6.8416 },
  { id: 'nairobi', name: 'Nairobi', city: 'Nairobi, Kenya', currency: 'Savanna Credits', accentColor: '#27ae60', unlockPrestige: 48, continent: 'africa', lat: -1.2921, lon: 36.8219 },
  { id: 'pretoria', name: 'Pretoria', city: 'Pretoria, South Africa', currency: 'Krugerrand Marks', accentColor: '#c0392b', unlockPrestige: 52, continent: 'africa', lat: -25.7479, lon: 28.2293 },

  // ── Oceania ──
  { id: 'canberra', name: 'Canberra', city: 'Canberra, Australia', currency: 'Outback Coins', accentColor: '#2ecc71', unlockPrestige: 50, continent: 'oceania', lat: -35.2809, lon: 149.1300 },
  { id: 'sydney', name: 'Sydney', city: 'Sydney, Australia', currency: 'Harbor Credits', accentColor: '#3498db', unlockPrestige: 60, continent: 'oceania', lat: -33.8688, lon: 151.2093 },
]

export const STARTER_BRANCHES: BranchId[] = ['bangkok', 'newYork']

export const CONTINENT_LABELS: Record<Continent, string> = {
  'north-america': 'North America',
  'south-america': 'South America',
  'europe': 'Europe',
  'asia': 'Asia',
  'africa': 'Africa',
  'oceania': 'Oceania',
}

export const CONTINENT_COLORS: Record<Continent, string> = {
  'north-america': '#4a90e2',
  'south-america': '#50c878',
  'europe': '#9b59b6',
  'asia': '#e8a838',
  'africa': '#c0392b',
  'oceania': '#2ecc71',
}

export function getBranchDef(id: BranchId): BranchDefinition {
  const def = BRANCHES.find(t => t.id === id)
  if (!def) {
    console.warn(`Unknown branch ID: ${id}, falling back to Bangkok`)
    return BRANCHES[0]
  }
  return def
}

export function getBranchesByContinent(continent: Continent): BranchDefinition[] {
  return BRANCHES.filter(t => t.continent === continent)
}
