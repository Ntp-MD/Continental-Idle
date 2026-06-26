// === Game State Interfaces ===

export type BranchId =
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
  pendingLevelUp: boolean
  loyalty: number
  assignedBranch: BranchId | null
  lentTo: BranchId | null
  lentUntil: number
  attackTarget: BranchId | null
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
  branch: BranchId
}

export interface BranchState {
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
  hqHealth: number
  hqMaxHealth: number
  aiOwnerDefeated: boolean
}

export interface WorldMapState {
  unlockedBranches: BranchId[]
  conqueredBranches: BranchId[]
  royalBranches: BranchId[]
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
  hqBranch: BranchId
  activeBranch: BranchId
  worldMap: WorldMapState
  branches: Record<BranchId, BranchState>
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
  branch: BranchId
  eventId: string
  choiceId: string
  outcome: string
}

export interface Buff {
  id: string
  type: 'incomeMultiplier' | 'incomeFreeze'
  value: number
  expiresAt: number | null
  branchId: BranchId | null
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
  branchLock: BranchId | null
  maxLevel: number
}

// === Event Definition ===

export interface EventChoice {
  id: string
  label: string
  requires?: { staffType?: string; minLevel?: number; assassinAssigned?: boolean }
  rewards: EventEffect[]
  penalties: EventEffect[]
  reputationChange: number
  heatChange?: number
  isBest?: boolean
  isSafe?: boolean
}

export interface RaidAttacker {
  name: string
  level: number
  precision: number
  speed: number
}

export interface RaidData {
  attackers: RaidAttacker[]
  attackerPower: number
  defenderPower: number
  winChance: number
  defenderCount: number
}

export interface EventEffect {
  type: 'incomeMultiplier' | 'permanentIncomeBonus' | 'reputation' | 'incomeFreeze' | 'loseCurrency' | 'markerDebt'
  value: number
  duration?: number
  scaling: 'static' | 'incomePercent' | 'currencyPercent' | 'prestigeScaled'
}

export type UnlockCondition =
  | { type: 'buildingLevel'; buildingId: string; minLevel: number }
  | { type: 'prestige'; minPrestige: number }
  | null

export interface EventDefinition {
  id: string
  name: string
  description: string
  branchLock: BranchId | null
  weight: number
  heatModifier: number
  unlockCondition: UnlockCondition
  choices: EventChoice[]
  autoResolveTimeout: number
  autoResolveAction: 'ignore' | 'best' | 'safe'
}
