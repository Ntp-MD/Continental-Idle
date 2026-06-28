import type { GameState } from '@/types'

export type AchievementCategory = 'income' | 'prestige' | 'combat' | 'expansion' | 'staff' | 'events' | 'special'

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon: string
  condition: (state: GameState) => boolean
  reward: {
    type: 'tableFavor' | 'permanentIncomeBonus'
    value: number
  }
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Income
  { id: 'firstBuilding', name: 'First Steps', description: 'Purchase your first building level', category: 'income', icon: '\u{1F3E8}', condition: s => Object.values(s.branches).some(b => Object.values(b.buildings).some(bld => bld.level > 0)), reward: { type: 'tableFavor', value: 5 } },
  { id: 'currency1k', name: 'Pocket Change', description: 'Reach 1,000 currency in any branch', category: 'income', icon: '\u{1F4B0}', condition: s => Object.values(s.branches).some(b => b.currency >= 1000), reward: { type: 'tableFavor', value: 5 } },
  { id: 'currency1m', name: 'High Roller', description: 'Reach 1,000,000 currency in any branch', category: 'income', icon: '\u{1F4B3}', condition: s => Object.values(s.branches).some(b => b.currency >= 1_000_000), reward: { type: 'tableFavor', value: 15 } },
  { id: 'currency1b', name: 'Continental Tycoon', description: 'Reach 1,000,000,000 currency in any branch', category: 'income', icon: '\u{1F4B8}', condition: s => Object.values(s.branches).some(b => b.currency >= 1_000_000_000), reward: { type: 'tableFavor', value: 30 } },
  { id: 'currency1t', name: 'Sovereign Wealth', description: 'Reach 1,000,000,000,000 currency in any branch', category: 'income', icon: '\u{1F451}', condition: s => Object.values(s.branches).some(b => b.currency >= 1_000_000_000_000), reward: { type: 'tableFavor', value: 50 } },
  { id: 'lifetime1b', name: 'Empire Builder', description: 'Accumulate 1B lifetime earnings across all branches', category: 'income', icon: '\u{1F4CA}', condition: s => Object.values(s.branches).reduce((sum, b) => sum + b.lifetimeEarnings, 0) >= 1_000_000_000, reward: { type: 'permanentIncomeBonus', value: 0.02 } },
  { id: 'lifetime1t', name: 'Global Empire', description: 'Accumulate 1T lifetime earnings across all branches', category: 'income', icon: '\u{1F30D}', condition: s => Object.values(s.branches).reduce((sum, b) => sum + b.lifetimeEarnings, 0) >= 1_000_000_000_000, reward: { type: 'permanentIncomeBonus', value: 0.05 } },

  // Prestige
  { id: 'firstPrestige', name: 'Born Again', description: 'Prestige for the first time', category: 'prestige', icon: '\u{2728}', condition: s => s.totalPrestige >= 1, reward: { type: 'tableFavor', value: 10 } },
  { id: 'prestige5', name: 'Cycle of Power', description: 'Reach total prestige 5', category: 'prestige', icon: '\u{1F504}', condition: s => s.totalPrestige >= 5, reward: { type: 'tableFavor', value: 20 } },
  { id: 'prestige10', name: 'Eternal Ascender', description: 'Reach total prestige 10', category: 'prestige', icon: '\u{1F31F}', condition: s => s.totalPrestige >= 10, reward: { type: 'tableFavor', value: 40 } },
  { id: 'prestige25', name: 'The Unbroken Cycle', description: 'Reach total prestige 25', category: 'prestige', icon: '\u{1F525}', condition: s => s.totalPrestige >= 25, reward: { type: 'tableFavor', value: 75 } },
  { id: 'prestige50', name: 'Ascension Master', description: 'Reach total prestige 50', category: 'prestige', icon: '\u{1F451}', condition: s => s.totalPrestige >= 50, reward: { type: 'tableFavor', value: 150 } },

  // Combat
  { id: 'firstAssassin', name: 'Shadow Recruiter', description: 'Hire your first assassin', category: 'combat', icon: '\u{1F5E1}', condition: s => Object.values(s.branches).some(b => Object.keys(b.assassins).length > 0), reward: { type: 'tableFavor', value: 10 } },
  { id: 'firstRaidWin', name: 'Defender', description: 'Win your first assassin raid', category: 'combat', icon: '\u{1F6E1}', condition: s => s.eventLog.some(e => e.eventId === 'assassinRaid' && e.outcome.includes('won')), reward: { type: 'tableFavor', value: 15 } },
  { id: 'firstAwakening', name: 'Awakened', description: 'Have an assassin reach awakening', category: 'combat', icon: '\u{1F4A5}', condition: s => Object.values(s.branches).some(b => Object.values(b.assassins).some(a => a.awakened)), reward: { type: 'tableFavor', value: 25 } },
  { id: 'firstTakeover', name: 'Conqueror', description: 'Complete your first branch takeover', category: 'combat', icon: '\u{1F6A9}', condition: s => s.worldMap.conqueredBranches.length >= 1, reward: { type: 'tableFavor', value: 30 } },
  { id: 'conquer5', name: 'Warlord', description: 'Conquer 5 branches', category: 'combat', icon: '\u{2694}', condition: s => s.worldMap.conqueredBranches.length >= 5, reward: { type: 'tableFavor', value: 50 } },
  { id: 'conquer10', name: 'Empire Crusher', description: 'Conquer 10 branches', category: 'combat', icon: '\u{1F52B}', condition: s => s.worldMap.conqueredBranches.length >= 10, reward: { type: 'tableFavor', value: 75 } },
  { id: 'defeatAllAI', name: 'Sovereign', description: 'Defeat all 37 AI controllers', category: 'combat', icon: '\u{1F451}', condition: s => Object.values(s.aiOwners).every(o => o.defeated), reward: { type: 'tableFavor', value: 200 } },

  // Expansion
  { id: 'firstUnlock', name: 'Expanding Horizons', description: 'Unlock your second branch', category: 'expansion', icon: '\u{1F5FA}', condition: s => s.worldMap.unlockedBranches.length >= 2, reward: { type: 'tableFavor', value: 10 } },
  { id: 'unlock5', name: 'Regional Power', description: 'Unlock 5 branches', category: 'expansion', icon: '\u{1F30E}', condition: s => s.worldMap.unlockedBranches.length >= 5, reward: { type: 'tableFavor', value: 25 } },
  { id: 'unlock10', name: 'Continental Network', description: 'Unlock 10 branches', category: 'expansion', icon: '\u{1F310}', condition: s => s.worldMap.unlockedBranches.length >= 10, reward: { type: 'tableFavor', value: 50 } },
  { id: 'unlock25', name: 'Global Reach', description: 'Unlock 25 branches', category: 'expansion', icon: '\u{1F30D}', condition: s => s.worldMap.unlockedBranches.length >= 25, reward: { type: 'tableFavor', value: 100 } },
  { id: 'unlockAll', name: 'The World Is Yours', description: 'Unlock all 37 branches', category: 'expansion', icon: '\u{1F451}', condition: s => s.worldMap.unlockedBranches.length >= 37, reward: { type: 'tableFavor', value: 200 } },

  // Staff
  { id: 'firstStaff', name: 'First Hire', description: 'Hire your first staff member', category: 'staff', icon: '\u{1F465}', condition: s => Object.values(s.branches).some(b => Object.keys(b.staff).length > 0), reward: { type: 'tableFavor', value: 5 } },
  { id: 'staff10', name: 'Team Builder', description: 'Hire 10 staff members across all branches', category: 'staff', icon: '\u{1F4BC}', condition: s => Object.values(s.branches).reduce((sum, b) => sum + Object.keys(b.staff).length, 0) >= 10, reward: { type: 'tableFavor', value: 15 } },
  { id: 'firstVeteran', name: 'Veteran Keeper', description: 'Have a staff member become a veteran', category: 'staff', icon: '\u{1F396}', condition: s => Object.values(s.branches).some(b => Object.values(b.staff).some(s2 => s2.veteran)), reward: { type: 'tableFavor', value: 20 } },
  { id: 'allUpgrades', name: 'Fully Equipped', description: 'Purchase all 6 upgrades in a single branch', category: 'staff', icon: '\u{1F527}', condition: s => Object.values(s.branches).some(b => b.upgrades.length >= 6), reward: { type: 'tableFavor', value: 30 } },

  // Events
  { id: 'firstEvent', name: 'Initiated', description: 'Resolve your first event', category: 'events', icon: '\u{1F4DD}', condition: s => s.eventLog.length >= 1, reward: { type: 'tableFavor', value: 5 } },
  { id: 'events50', name: 'Seasoned Operator', description: 'Resolve 50 events', category: 'events', icon: '\u{1F4D6}', condition: s => s.eventLog.length >= 50, reward: { type: 'tableFavor', value: 20 } },
  { id: 'events200', name: 'Master of Ceremonies', description: 'Resolve 200 events', category: 'events', icon: '\u{1F4DA}', condition: s => s.eventLog.length >= 200, reward: { type: 'tableFavor', value: 40 } },
  { id: 'firstSupplyRoute', name: 'Underworld Connections', description: 'Establish your first supply route', category: 'events', icon: '\u{1F6A2}', condition: s => s.supplyRoutes.length >= 1, reward: { type: 'tableFavor', value: 15 } },
  { id: 'supplyRoutes10', name: 'Smuggling Empire', description: 'Establish 10 active supply routes', category: 'events', icon: '\u{1F4E6}', condition: s => s.supplyRoutes.length >= 10, reward: { type: 'tableFavor', value: 40 } },

  // Special
  { id: 'playtime1h', name: 'Getting Started', description: 'Play for 1 hour', category: 'special', icon: '\u{23F1}', condition: s => s.totalPlayTime >= 3600, reward: { type: 'tableFavor', value: 10 } },
  { id: 'playtime10h', name: 'Dedicated', description: 'Play for 10 hours', category: 'special', icon: '\u{23F0}', condition: s => s.totalPlayTime >= 36000, reward: { type: 'tableFavor', value: 25 } },
  { id: 'playtime100h', name: 'Continental Lifer', description: 'Play for 100 hours', category: 'special', icon: '\u{1F551}', condition: s => s.totalPlayTime >= 360000, reward: { type: 'tableFavor', value: 100 } },
  { id: 'firstRoyal', name: 'Royal Ascension', description: 'Achieve Royal Continental status on a branch', category: 'special', icon: '\u{1F451}', condition: s => s.worldMap.royalBranches.length >= 1, reward: { type: 'tableFavor', value: 50 } },
  { id: 'allSkills', name: 'Enlightened', description: 'Max all 5 skill tree branches', category: 'special', icon: '\u{1F9E0}', condition: s => s.skillTree.commerce >= 5 && s.skillTree.personnel >= 5 && s.skillTree.shadow >= 5 && s.skillTree.diplomacy >= 5 && s.skillTree.ascension >= 5, reward: { type: 'tableFavor', value: 100 } },
]

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, a])
)

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; name: string; icon: string }[] = [
  { id: 'income', name: 'Income', icon: '\u{1F4B0}' },
  { id: 'prestige', name: 'Prestige', icon: '\u{2728}' },
  { id: 'combat', name: 'Combat', icon: '\u{2694}' },
  { id: 'expansion', name: 'Expansion', icon: '\u{1F5FA}' },
  { id: 'staff', name: 'Staff', icon: '\u{1F465}' },
  { id: 'events', name: 'Events', icon: '\u{1F4DD}' },
  { id: 'special', name: 'Special', icon: '\u{1F3AF}' },
]
