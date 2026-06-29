// === Game State Interfaces ===

export type Rarity = 'D' | 'C' | 'B' | 'A' | 'S'

export type FloorId = 'G' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11'

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

export type SupplyRouteType = 'weapons' | 'contraband' | 'luxury'

export interface SupplyRoute {
  id: string
  type: SupplyRouteType
  from: BranchId
  to: BranchId
  stability: number
  establishedAt: number
  hijacked: boolean
  incomePerTick: number
  aiOwned: boolean
}

export type AITemperament = 'aggressive' | 'diplomatic' | 'shadow' | 'defensive'

export interface AIOwnerState {
  branchId: BranchId
  name: string
  temperament: AITemperament
  power: number
  maxPower: number
  aggression: number
  lastActionTick: number
  actionCooldown: number
  defeated: boolean
  relations: number
  threatLevel: number
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
  rarity: Rarity
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
  rarity: Rarity
}

export interface CharacterStats {
  precision: number
  speed: number
  charisma: number
  luck: number
}

export interface MarkerDebt {
  id: string
  amount: number
  originalAmount: number
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
  royalBuildings: Record<string, BuildingState>
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

export interface RoyalSkillTreeState {
  royalIncome: number
  royalLoyalty: number
  royalPower: number
  royalFavor: number
  royalAscension: number
}

export interface RoyalDecree {
  id: string
  name: string
  description: string
  type: 'incomeMultiplier' | 'permanentIncomeBonus' | 'heatReduction' | 'debtReduction' | 'loyaltyBoost'
  value: number
  expiresAt: number | null
  chosenAt: number
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
  supplyRoutes: SupplyRoute[]
  aiOwners: Record<BranchId, AIOwnerState>
  checksum: string
  lastOfflineSeconds: number
  lastOfflineEarnings: number
  lastOfflineBreakdown: Record<string, number>
  achievements: string[]
  royalMarks: number
  royalPrestige: number
  royalSkillTree: RoyalSkillTreeState
  sovereign: boolean
  royalDecrees: RoyalDecree[]
  lastDecreeAt: number
  sandboxLoops: number
  goldenCoins: number
  visitors: VisitorEntry[]
  lastSandboxLoopAt: number
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

// === Visitor Entry ===

export interface VisitorEntry {
  id: string
  typeId: string
  isAssassin: boolean
  rarity: Rarity
  level: number
  stats: CharacterStats
  traits: string[]
  arrivedAt: number
  expiresAt: number
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
