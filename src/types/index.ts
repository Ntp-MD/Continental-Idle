// === Game State Interfaces ===

export type ThemeId =
  | 'bangkok' | 'newYork' | 'rome' | 'casablanca' | 'osaka' | 'paris' | 'berlin' | 'dubai'
  | 'washington' | 'losAngeles' | 'mexicoCity' | 'havana' | 'ottawa'
  | 'brasilia' | 'buenosAires' | 'bogota'
  | 'london' | 'madrid' | 'moscow' | 'vienna' | 'athens' | 'istanbul' | 'amsterdam' | 'prague'
  | 'tokyo' | 'beijing' | 'seoul' | 'hongKong' | 'singapore' | 'newDelhi' | 'hanoi'
  | 'cairo' | 'rabat' | 'nairobi' | 'pretoria'
  | 'canberra' | 'sydney'

export interface BuildingState {
  level: number
  unlocked: boolean
}

export interface StaffEntry {
  id: string
  typeId: string
  level: number
  xp: number
  pendingLevelUp: boolean
  assignedTo: string | null
  stats: CharacterStats
  traits: string[]
  veteran: boolean
  veteranPerk: string | null
  prestigeSurvivedCount: number
}

export interface AssassinEntry {
  id: string
  typeId: string
  level: number
  xp: number
  loyalty: number
  assignedTheme: ThemeId | null
  lentTo: ThemeId | null
  lentUntil: number
  attackTarget: ThemeId | null
  stats: CharacterStats
  traits: string[]
  synergyCount: number
  awakened: boolean
}

export interface CharacterStats {
  precision: number
  speed: number
  charisma: number
  luck: number
}

export interface MarkerDebt {
  amount: number
  createdAt: number
  theme: ThemeId
}

export interface ThemeState {
  currency: number
  lifetimeEarnings: number
  buildings: Record<string, BuildingState>
  upgrades: string[]
  staff: Record<string, StaffEntry>
  assassins: Record<string, AssassinEntry>
  prestige: number
  reputation: number
  markerDebts: MarkerDebt[]
  heatLevel: number
  excommunicadoGraceUntil: number
  guestSatisfaction: number
  conquered: boolean
  takeoverProgress: number
  hqHealth: number
  hqMaxHealth: number
  aiOwnerDefeated: boolean
}

export interface WorldMapState {
  unlockedNodes: ThemeId[]
  conqueredNodes: ThemeId[]
  royalNodes: ThemeId[]
}

export interface SkillTreeState {
  commerce: number
  personnel: number
  shadow: number
  diplomacy: number
  ascension: number
}

export interface GameSettings {
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'
  highContrast: boolean
  reducedMotion: boolean
  fontScale: number
  oneHandMode: boolean
}

export interface GameState {
  version: string
  timestamp: number
  totalPlayTime: number
  totalOfflineTime: number
  tutorialCompleted: boolean
  tutorialStep: number
  tableFavor: number
  totalPrestige: number
  hqCountry: ThemeId
  activeTheme: ThemeId
  worldMap: WorldMapState
  themes: Record<ThemeId, ThemeState>
  skillTree: SkillTreeState
  settings: GameSettings
  eventLog: EventLogEntry[]
  activeBuffs: Buff[]
  permanentIncomeBonus: number
  buyMultiplier: number
  lastOfflineEarnings: number
  lastOfflineSeconds: number
  checksum: string
}

export interface EventLogEntry {
  timestamp: number
  theme: ThemeId
  eventId: string
  choiceId: string
  outcome: string
}

export interface Buff {
  id: string
  type: 'incomeMultiplier' | 'incomeFreeze' | 'permanentIncomeBonus'
  value: number
  expiresAt: number | null
  themeId: ThemeId | null
}

// === Building Definition ===

export interface BuildingDefinition {
  id: string
  name: string
  baseRate: number
  baseCost: number
  costGrowth: number
  maxLevel: number
  unlock: string
}

// === Staff Definition ===

export interface StaffDefinition {
  id: string
  name: string
  hireCost: number
  unlock: string
  maxLevel: number
  effectPerLevel: number
  bestMatch: string[]
  maxAbility: string
}

// === Assassin Definition ===

export interface AssassinDefinition {
  id: string
  name: string
  rank: string
  hireCost: number
  ability: string
  themeLock: ThemeId | null
}

// === Event Definition ===

export interface EventChoice {
  id: string
  label: string
  requires?: { staffType?: string; minLevel?: number }
  rewards: EventEffect[]
  penalties: EventEffect[]
  reputationChange: number
  isBest?: boolean
  isSafe?: boolean
}

export interface EventEffect {
  type: string
  value: number
  duration?: number
  scaling: 'static' | 'incomePercent' | 'currencyPercent' | 'prestigeScaled'
}

export interface EventDefinition {
  id: string
  name: string
  description: string
  themeLock: ThemeId | null
  weight: number
  heatModifier: number
  unlockCondition: Record<string, unknown> | null
  choices: EventChoice[]
  autoResolveTimeout: number
  autoResolveAction: 'ignore' | 'best' | 'safe'
}
