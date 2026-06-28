import type { AITemperament, BranchId } from '@/types'
import { BRANCHES } from './branches'

export interface AITemperamentDef {
  id: AITemperament
  name: string
  description: string
  basePower: number
  powerGrowthPerTick: number
  baseAggression: number
  baseCooldown: number
  color: string
  icon: string
}

export const AI_TEMPERAMENTS: Record<AITemperament, AITemperamentDef> = {
  aggressive: {
    id: 'aggressive',
    name: 'Warlord',
    description: 'Aggressive AI that frequently raids and escalates conflicts.',
    basePower: 500,
    powerGrowthPerTick: 2.0,
    baseAggression: 0.8,
    baseCooldown: 30,
    color: '#ff5722',
    icon: '\u2694',
  },
  diplomatic: {
    id: 'diplomatic',
    name: 'Diplomat',
    description: 'Diplomatic AI that demands tribute and forms temporary truces.',
    basePower: 400,
    powerGrowthPerTick: 1.5,
    baseAggression: 0.4,
    baseCooldown: 45,
    color: '#4a90e2',
    icon: '\u2709',
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow Broker',
    description: 'Shadow AI that sabotages supply routes and sends spies.',
    basePower: 350,
    powerGrowthPerTick: 1.8,
    baseAggression: 0.6,
    baseCooldown: 40,
    color: '#9b59b6',
    icon: '\u269B',
  },
  defensive: {
    id: 'defensive',
    name: 'Guardian',
    description: 'Defensive AI that fortifies its territory and rarely attacks.',
    basePower: 600,
    powerGrowthPerTick: 1.0,
    baseAggression: 0.2,
    baseCooldown: 60,
    color: '#2ecc71',
    icon: '\u26E8',
  },
}

const AI_NAMES: Record<string, string> = {
  bangkok: 'The Serpent King',
  newYork: 'Don Caravale',
  rome: 'Cardinal Vex',
  casablanca: 'The Desert Fox',
  osaka: 'Lord Kuroda',
  paris: 'Madame Noir',
  berlin: 'Der Eisenwolf',
  dubai: 'The Gold Sheikh',
  washington: 'Senator Cross',
  losAngeles: 'The Director',
  mexicoCity: 'El Patron',
  havana: 'Comandante Rey',
  ottawa: 'The Mountie',
  brasilia: 'O Rei Verde',
  buenosAires: 'El Tango',
  bogota: 'The Cartel',
  london: 'Lord Ashbury',
  madrid: 'El Matador',
  moscow: 'The Iron Bear',
  vienna: 'The Composer',
  athens: 'The Oracle',
  istanbul: 'The Spice Lord',
  amsterdam: 'The Merchant',
  prague: 'The Alchemist',
  tokyo: 'The Neon Dragon',
  beijing: 'The Jade Emperor',
  seoul: 'The K-King',
  hongKong: 'The Triad Boss',
  singapore: 'The Lion',
  newDelhi: 'The Rajah',
  hanoi: 'The Lotus Queen',
  cairo: 'The Pharaoh',
  rabat: 'The Saharan',
  nairobi: 'The Savannah King',
  pretoria: 'The Diamond Lord',
  canberra: 'The Outback Boss',
  sydney: 'The Harbor Master',
}

const TEMPERAMENT_BY_CONTINENT: Record<string, AITemperament[]> = {
  'north-america': ['aggressive', 'diplomatic'],
  'south-america': ['aggressive', 'shadow'],
  'europe': ['diplomatic', 'shadow', 'defensive'],
  'asia': ['aggressive', 'shadow', 'defensive'],
  'africa': ['aggressive', 'defensive'],
  'oceania': ['defensive', 'diplomatic'],
}

export function getAIName(branchId: BranchId): string {
  return AI_NAMES[branchId] || 'Unknown Boss'
}

export function getAITemperamentForBranch(branchId: BranchId): AITemperament {
  const def = BRANCHES.find(b => b.id === branchId)
  if (!def) return 'aggressive'
  const options = TEMPERAMENT_BY_CONTINENT[def.continent] || ['aggressive']
  const idx = def.unlockPrestige % options.length
  return options[idx]
}

export function getTemperamentDef(temperament: AITemperament): AITemperamentDef {
  return AI_TEMPERAMENTS[temperament]
}
