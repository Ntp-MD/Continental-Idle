import type { BranchId } from '@/types'
import { getBranchDef } from './branches'
import { getAIName, getAITemperamentForBranch } from './ai-owners'

export interface StoryContext {
  hqName: string
  hqCity: string
  fatherName: string
  fatherTitle: string
  killerName: string
  killerBranch: string
  killerTemperament: string
  playerTitle: string
}

const FATHER_NAMES: Record<string, { name: string; title: string }> = {
  bangkok: { name: 'Somchai "The Serpent" Rattanakosin', title: 'Lord of the Golden Triangle' },
  newYork: { name: 'Vincent "The Architect" Caravale', title: 'Don of the Five Families' },
  rome: { name: 'Lorenzo "Il Papa" Vex', title: 'Cardinal of the Underworld' },
  casablanca: { name: 'Rashid "The Desert Fox" Al-Maghribi', title: 'Sultan of the Sahara Trade' },
  osaka: { name: 'Kenji "Kuroda" Tanaka', title: 'Oyabun of the Kuroda-gumi' },
  paris: { name: 'Jean-Pierre "Le Corbeau" Noir', title: 'Patriarch of the Parisian Syndicate' },
  berlin: { name: 'Klaus "Der Eisenwolf" Brandt', title: 'Chancellor of the Iron Wolves' },
  dubai: { name: 'Sheikh Omar "The Gold" Al-Maktoum', title: 'Emir of the Gulf Network' },
  washington: { name: 'Richard "The Kingmaker" Cross', title: 'Senator of the Shadow Government' },
  losAngeles: { name: 'Arthur "The Director" Sterling', title: 'King of the Hollywood Underworld' },
  mexicoCity: { name: 'Diego "El Patron" Vasquez', title: 'Caudillo of the Cartel Confederation' },
  havana: { name: 'Carlos "Comandante" Reyes', title: 'General of the Caribbean Syndicate' },
  ottawa: { name: 'James "The Mountie" McKenzie', title: 'Warden of the Northern Routes' },
  brasilia: { name: 'Pedro "O Rei Verde" Silva', title: 'Emperor of the Amazon Cartel' },
  buenosAires: { name: 'Mateo "El Tango" Riviera', title: 'Maestro of the Southern Syndicate' },
  bogota: { name: 'Eduardo "El Aguila" Cruz', title: 'Caudillo of the Andean Cartel' },
  london: { name: 'Edmund "Lord Ashbury" Pemberton', title: 'Baron of the London Underworld' },
  madrid: { name: 'Alejandro "El Matador" Vega', title: 'Capo of the Iberian Network' },
  moscow: { name: 'Dmitri "The Iron Bear" Volkov', title: 'Pakhan of the Bratva' },
  vienna: { name: 'Felix "The Composer" Strauss', title: 'Maestro of the Alpine Syndicate' },
  athens: { name: 'Nikos "The Oracle" Papadopoulos', title: 'Oracle of the Mediterranean' },
  istanbul: { name: 'Mehmet "The Spice Lord" Oz', title: 'Vizier of the Bosphorus Trade' },
  amsterdam: { name: 'Willem "The Merchant" Van Der Berg', title: 'Burgher of the Canal Network' },
  prague: { name: 'Viktor "The Alchemist" Novak', title: 'Magister of the Bohemian Court' },
  tokyo: { name: 'Ryuichi "The Neon Dragon" Yamamoto', title: 'Kaicho of the Tokyo Syndicate' },
  beijing: { name: 'Li "The Jade Emperor" Wei', title: 'Emperor of the Northern Coalition' },
  seoul: { name: 'Min-jun "The K-King" Park', title: 'Chairman of the K-Syndicate' },
  hongKong: { name: 'Wai-Ming "The Triad Boss" Chow', title: 'Dragon Head of the Harbor Triad' },
  singapore: { name: 'Wei "The Lion" Tan', title: 'Lord of the Lion City' },
  newDelhi: { name: 'Rajesh "The Rajah" Kapoor', title: 'Maharajah of the Subcontinent Network' },
  hanoi: { name: 'Quang "The Lotus" Nguyen', title: 'Dragon of the Mekong Syndicate' },
  cairo: { name: 'Amun "The Pharaoh" Hassan', title: 'Pharaoh of the Nile Cartel' },
  rabat: { name: 'Hassan "The Saharan" El Fassi', title: 'Caid of the Maghreb Network' },
  nairobi: { name: 'Jomo "The Savannah King" Mwangi', title: 'Lion of the East African Syndicate' },
  pretoria: { name: 'Willem "The Diamond Lord" De Beer', title: 'Baas of the Southern Cartel' },
  canberra: { name: 'Bruce "The Outback Boss" Kelly', title: 'Boss of the Outback Network' },
  sydney: { name: 'Thomas "The Harbor Master" Hayes', title: 'Captain of the Pacific Syndicate' },
}

export function getStoryContext(hqBranch: BranchId): StoryContext {
  const hqDef = getBranchDef(hqBranch)
  const father = FATHER_NAMES[hqBranch] || { name: 'The Former Boss', title: 'Lord of the Underworld' }

  // The killer is the AI owner of the nearest rival branch
  // Pick the first non-HQ, non-starter branch as the killer's base
  const allBranches = Object.keys(FATHER_NAMES) as BranchId[]
  const killerBranchId = allBranches.find(id => id !== hqBranch && id !== 'newYork' && id !== 'bangkok') || 'rome'
  const killerName = getAIName(killerBranchId)
  const killerTemperament = getAITemperamentForBranch(killerBranchId)
  const killerBranchName = getBranchDef(killerBranchId).name

  return {
    hqName: hqDef.name,
    hqCity: hqDef.city,
    fatherName: father.name,
    fatherTitle: father.title,
    killerName,
    killerBranch: killerBranchName,
    killerTemperament,
    playerTitle: `Heir of ${hqDef.name}`,
  }
}

export function getStoryIntro(hqBranch: BranchId): string {
  const ctx = getStoryContext(hqBranch)
  return `${ctx.fatherName}, ${ctx.fatherTitle}, has been assassinated.

The High Table — the supreme council that governs the Continental network across 37 cities — has fallen into chaos. Your father's seat is empty, and the wolves are circling.

${ctx.killerName}, the AI controller of ${ctx.killerBranch}, is the prime suspect. The power struggle for the High Table has begun, and every city has its own AI boss waiting to seize control.

You are the heir of ${ctx.hqName}. Your father's empire is now yours to rebuild — one Continental branch at a time. Conquer rival cities, establish supply routes, and climb the ladder to claim your seat at the High Table.

The underworld awaits its new king.`
}
