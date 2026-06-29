import type { GameState, BranchId, BranchState, BuildingState } from '@/types'
import { BUILDINGS } from '@/data/buildings'
import { BRANCHES } from '@/data/branches'
import { STAFF_TYPES } from '@/data/staff'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { initAIOwners } from './ai-owner-manager'
import { getBranchIncomePerSecond } from './income-engine'
import { getTotalOfflineEfficiency } from './skill-manager'
import { sovereignManager } from './sovereign-manager'
import { useToast } from '@/composables/useToast'

const CURRENT_VERSION = '1.0'
const SAVE_KEY = 'continental_idle_save'

function createDefaultBranchState(): BranchState {
  const buildings: Record<string, BuildingState> = {}
  BUILDINGS.forEach(b => {
    buildings[b.id] = { level: 0, unlocked: b.unlock === 'start' }
  })

  return {
    currency: 0,
    lifetimeEarnings: 0,
    buildings,
    upgrades: [],
    staff: {},
    assassins: {},
    prestige: 0,
    reputation: 0,
    markerDebts: [],
    heatLevel: 0,
    excommunicadoGraceUntil: 0,
    guestSatisfaction: 50,
    hqHealth: 1000,
    hqMaxHealth: 1000,
    aiOwnerDefeated: false,
    royalBuildings: {},
  }
}

function createDefaultState(hq: BranchId = 'bangkok'): GameState {
  const branches = {} as Record<BranchId, BranchState>
  BRANCHES.forEach(t => {
    branches[t.id] = createDefaultBranchState()
  })

  return {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    totalPlayTime: 0,
    tutorialCompleted: false,
    tutorialStep: 0,
    tableFavor: 0,
    totalPrestige: 0,
    hqBranch: hq,
    activeBranch: hq,
    worldMap: {
      unlockedBranches: [hq],
      conqueredBranches: [],
      royalBranches: [],
    },
    branches,
    skillTree: {
      commerce: 0,
      personnel: 0,
      shadow: 0,
      diplomacy: 0,
      ascension: 0,
    },
    settings: {
      colorBlindMode: 'none',
      highContrast: false,
      reducedMotion: false,
      fontScale: 1.0,
      oneHandMode: false,
    },
    eventLog: [],
    activeBuffs: [],
    permanentIncomeBonus: 0,
    buyMultiplier: 1,
    supplyRoutes: [],
    aiOwners: initAIOwners(),
    checksum: '',
    lastOfflineSeconds: 0,
    lastOfflineEarnings: 0,
    lastOfflineBreakdown: {},
    achievements: [],
    royalMarks: 0,
    royalPrestige: 0,
    royalSkillTree: {
      royalIncome: 0,
      royalLoyalty: 0,
      royalPower: 0,
      royalFavor: 0,
      royalAscension: 0,
    },
    sovereign: false,
    royalDecrees: [],
    lastDecreeAt: 0,
    sandboxLoops: 0,
    goldenCoins: 0,
    visitors: [],
    lastSandboxLoopAt: 0,
  }
}

class GameStateManager {
  private state: GameState
  private _mutationLock = false
  private _pendingSave = false
  private toast = useToast()

  constructor() {
    this.state = createDefaultState()
  }

  get(): GameState {
    return this.state
  }

  withLock<T>(fn: () => T): T | undefined {
    if (this._mutationLock) {
      this._pendingSave = true
      return undefined
    }
    this._mutationLock = true
    try {
      const result = fn()
      if (this._pendingSave) {
        this._pendingSave = false
        this.save()
      }
      return result
    } finally {
      this._mutationLock = false
    }
  }

  getBranch(id?: BranchId): BranchState | undefined {
    return this.state.branches[id || this.state.activeBranch]
  }

  setActiveBranch(id: BranchId): void {
    this.state.activeBranch = id
  }

  setBuyMultiplier(mult: number): void {
    this.state.buyMultiplier = mult
  }

  init(hq?: BranchId): void {
    const saved = this.load()
    if (saved) {
      this.state = saved
      // Calculate offline earnings
      this.calculateOfflineProgress()
    } else if (hq) {
      this.state = createDefaultState(hq)
    } else if (this.hasSave()) {
      // Save exists but failed validation — start fresh
      console.error('Save data corrupted — starting fresh game')
      this.deleteSave()
      this.state = createDefaultState('bangkok')
    }
    // Ensure grace period is fresh for BRANCHES with unset (0) grace period
    const graceUntil = Date.now() + 30 * 60 * 1000
    BRANCHES.forEach(t => {
      const branch = this.state.branches[t.id]
      if (branch && branch.excommunicadoGraceUntil === 0) {
        branch.excommunicadoGraceUntil = graceUntil
      }
    })
  }

  reset(hq: BranchId): void {
    this.state = createDefaultState(hq)
    // Set fresh grace periods on reset
    const graceUntil = Date.now() + 30 * 60 * 1000
    BRANCHES.forEach(t => {
      if (this.state.branches[t.id]) {
        this.state.branches[t.id].excommunicadoGraceUntil = graceUntil
      }
    })
  }

  save(): boolean {
    if (this._mutationLock) {
      this._pendingSave = true
      return false
    }
    this.state.timestamp = Date.now()
    sovereignManager.cleanupExpiredDecrees()
    this.state.checksum = this.computeChecksum()
    const json = JSON.stringify(this.state)
    try {
      // Write main save first — if this fails, backup is preserved
      localStorage.setItem(SAVE_KEY, json)
      // Then backup — use the same json to avoid cross-tab race
      localStorage.setItem(SAVE_KEY + '_backup', json)
      return true
    } catch {
      console.error('Failed to save game — storage quota exceeded or unavailable')
      this.toast.error('Failed to save game — storage may be full')
      return false
    }
  }

  load(): GameState | null {
    let raw: string | null
    try {
      raw = localStorage.getItem(SAVE_KEY)
    } catch {
      return null
    }
    if (!raw) return null
    const result = this.tryParseSave(raw)
    if (result) return result

    // Main save failed — try backup
    const backup = localStorage.getItem(SAVE_KEY + '_backup')
    if (backup) {
      console.warn('Main save corrupted — attempting backup recovery')
      const backupResult = this.tryParseSave(backup)
      if (backupResult) {
        console.info('Backup save recovered successfully')
        return backupResult
      }
    }
    return null
  }

  private tryParseSave(raw: string): GameState | null {
    try {
      const parsed = JSON.parse(raw)

      // Validate minimal shape before casting
      if (!parsed || typeof parsed !== 'object') return null
      if (!parsed.branches || typeof parsed.branches !== 'object') return null
      if (!parsed.worldMap || typeof parsed.worldMap !== 'object') return null
      if (typeof parsed.hqBranch !== 'string') return null

      const typed = parsed as GameState

      // Validate critical numeric fields before accepting
      if (typeof typed.totalPrestige !== 'number' || !isFinite(typed.totalPrestige) || typed.totalPrestige < 0) return null
      if (typeof typed.tableFavor !== 'number' || !isFinite(typed.tableFavor) || typed.tableFavor < 0) return null
      for (const branchId of Object.keys(typed.branches) as BranchId[]) {
        const b = typed.branches[branchId]
        if (!b) return null
        if (typeof b.currency !== 'number' || !isFinite(b.currency) || b.currency < 0) return null
        if (typeof b.heatLevel !== 'number' || !isFinite(b.heatLevel) || b.heatLevel < 0) return null
      }

      // Validate checksum before accepting
      const savedChecksum = typed.checksum
      typed.checksum = ''
      const expected = this.computeChecksumFor(typed)
      if (!savedChecksum || savedChecksum !== expected) {
        console.error('Save checksum missing or mismatched — rejecting tampered save')
        return null
      }
      typed.checksum = savedChecksum

      const migrated = this.migrate(typed)
      return migrated
    } catch {
      return null
    }
  }

  exportSave(): string {
    if (!this.save()) return ''
    return localStorage.getItem(SAVE_KEY) || ''
  }

  importSave(json: string): boolean {
    try {
      const parsed = JSON.parse(json)
      if (!parsed.version || !parsed.hqBranch || !parsed.branches) return false
      if (typeof parsed.totalPrestige !== 'number' || !isFinite(parsed.totalPrestige)) return false
      if (typeof parsed.tableFavor !== 'number' || !isFinite(parsed.tableFavor)) return false
      if (!Array.isArray(parsed.worldMap?.unlockedBranches)) return false

      // Validate HQ is a known branch
      if (!BRANCHES.find(t => t.id === parsed.hqBranch)) return false

      // Validate activeBranch is a known branch
      if (!BRANCHES.find(t => t.id === parsed.activeBranch)) return false

      // Validate worldMap arrays contain only known branch IDs
      const validIds = new Set(BRANCHES.map(t => t.id))
      if (parsed.worldMap?.unlockedBranches) {
        parsed.worldMap.unlockedBranches = parsed.worldMap.unlockedBranches.filter((id: string) => validIds.has(id as BranchId))
      }
      if (parsed.worldMap?.conqueredBranches) {
        parsed.worldMap.conqueredBranches = parsed.worldMap.conqueredBranches.filter((id: string) => validIds.has(id as BranchId))
      }
      if (parsed.worldMap?.royalBranches) {
        parsed.worldMap.royalBranches = parsed.worldMap.royalBranches.filter((id: string) => validIds.has(id as BranchId))
      }

      // Validate checksum
      const savedChecksum = parsed.checksum
      parsed.checksum = ''
      const expected = this.computeChecksumFor(parsed)
      if (!savedChecksum || savedChecksum !== expected) return false
      parsed.checksum = savedChecksum

      // Validate currency non-negative for all BRANCHES
      const validStaffIds = new Set(STAFF_TYPES.map(s => s.id))
      const validAssassinIds = new Set(ASSASSIN_TYPES.map(a => a.id))
      const validBuildingIds = new Set(BUILDINGS.map(b => b.id))
      const validColorBlindModes = new Set(['none', 'deuteranopia', 'protanopia', 'tritanopia'])

      for (const branchId of Object.keys(parsed.branches)) {
        const t = parsed.branches[branchId]
        if (!t) return false
        if (typeof t.currency !== 'number' || !isFinite(t.currency) || t.currency < 0) return false
        if (typeof t.lifetimeEarnings !== 'number' || !isFinite(t.lifetimeEarnings) || t.lifetimeEarnings < 0) return false
        if (typeof t.prestige !== 'number' || !isFinite(t.prestige) || t.prestige < 0) return false
        if (typeof t.reputation !== 'number' || !isFinite(t.reputation) || t.reputation < 0) return false
        if (typeof t.heatLevel !== 'number' || !isFinite(t.heatLevel) || t.heatLevel < 0) return false
        if (typeof t.guestSatisfaction !== 'number' || !isFinite(t.guestSatisfaction)) return false

        // Validate buildings
        if (t.buildings && typeof t.buildings === 'object') {
          for (const bId of Object.keys(t.buildings)) {
            if (!validBuildingIds.has(bId)) continue
            const b = t.buildings[bId]
            if (typeof b?.level !== 'number' || !isFinite(b.level) || b.level < 0) return false
          }
        }

        // Validate staff entries
        if (t.staff && typeof t.staff === 'object') {
          for (const sId of Object.keys(t.staff)) {
            const s = t.staff[sId]
            if (!s || typeof s !== 'object') return false
            if (typeof s.typeId !== 'string' || !validStaffIds.has(s.typeId)) return false
            if (typeof s.level !== 'number' || !isFinite(s.level) || s.level < 1) return false
          }
        }

        // Validate assassin entries
        if (t.assassins && typeof t.assassins === 'object') {
          for (const aId of Object.keys(t.assassins)) {
            const a = t.assassins[aId]
            if (!a || typeof a !== 'object') return false
            if (typeof a.typeId !== 'string' || !validAssassinIds.has(a.typeId)) return false
            if (typeof a.level !== 'number' || !isFinite(a.level) || a.level < 1) return false
            if (typeof a.loyalty !== 'number' || !isFinite(a.loyalty) || a.loyalty < 0) return false
          }
        }

        // Validate marker debts
        if (Array.isArray(t.markerDebts)) {
          for (const d of t.markerDebts) {
            if (!d || typeof d.amount !== 'number' || !isFinite(d.amount) || d.amount < 0) return false
          }
        }
      }

      // Validate skillTree
      if (parsed.skillTree && typeof parsed.skillTree === 'object') {
        for (const key of ['commerce', 'personnel', 'shadow', 'diplomacy', 'ascension']) {
          const val = (parsed.skillTree as Record<string, unknown>)[key]
          if (val !== undefined && (typeof val !== 'number' || !isFinite(val) || val < 0)) return false
        }
      }

      // Validate supplyRoutes
      if (Array.isArray(parsed.supplyRoutes)) {
        for (const r of parsed.supplyRoutes) {
          if (!r || typeof r !== 'object') return false
          if (typeof r.type !== 'string' || !['luxury', 'contraband', 'weapons'].includes(r.type)) return false
          if (typeof r.from !== 'string' || !validIds.has(r.from as BranchId)) return false
          if (typeof r.to !== 'string' || !validIds.has(r.to as BranchId)) return false
          if (typeof r.stability !== 'number' || !isFinite(r.stability) || r.stability < 0 || r.stability > 100) return false
          if (typeof r.incomePerTick !== 'number' || !isFinite(r.incomePerTick) || r.incomePerTick < 0) return false
        }
      }

      // Validate aiOwners
      if (parsed.aiOwners && typeof parsed.aiOwners === 'object') {
        const validTemperaments = new Set(['aggressive', 'diplomatic', 'shadow', 'defensive'])
        for (const key of Object.keys(parsed.aiOwners)) {
          if (!validIds.has(key as BranchId)) continue
          const o = parsed.aiOwners[key]
          if (!o || typeof o !== 'object') return false
          if (typeof o.power !== 'number' || !isFinite(o.power) || o.power < 0) return false
          if (typeof o.aggression !== 'number' || !isFinite(o.aggression) || o.aggression < 0) return false
          if (typeof o.defeated !== 'boolean') return false
          if (o.temperament !== undefined && !validTemperaments.has(o.temperament)) return false
        }
      }

      // Validate buyMultiplier
      if (parsed.buyMultiplier !== undefined && (typeof parsed.buyMultiplier !== 'number' || !isFinite(parsed.buyMultiplier) || parsed.buyMultiplier < 0)) {
        parsed.buyMultiplier = 1
      }

      // Validate royal system fields
      if (parsed.royalMarks !== undefined && (typeof parsed.royalMarks !== 'number' || !isFinite(parsed.royalMarks) || parsed.royalMarks < 0)) return false
      if (parsed.royalPrestige !== undefined && (typeof parsed.royalPrestige !== 'number' || !isFinite(parsed.royalPrestige) || parsed.royalPrestige < 0)) return false
      if (parsed.sovereign !== undefined && typeof parsed.sovereign !== 'boolean') return false
      if (parsed.sandboxLoops !== undefined && (typeof parsed.sandboxLoops !== 'number' || !isFinite(parsed.sandboxLoops) || parsed.sandboxLoops < 0)) return false
      if (parsed.goldenCoins !== undefined && (typeof parsed.goldenCoins !== 'number' || !isFinite(parsed.goldenCoins) || parsed.goldenCoins < 0)) return false
      // Validate rarity if present
      const validRaritySet = new Set(['D', 'C', 'B', 'A', 'S'])
      for (const branchId of Object.keys(parsed.branches)) {
        const t = parsed.branches[branchId]
        if (t.staff && typeof t.staff === 'object') {
          for (const sId of Object.keys(t.staff)) {
            const s = t.staff[sId]
            if (s.rarity !== undefined && !validRaritySet.has(s.rarity)) return false
          }
        }
        if (t.assassins && typeof t.assassins === 'object') {
          for (const aId of Object.keys(t.assassins)) {
            const a = t.assassins[aId]
            if (a.rarity !== undefined && !validRaritySet.has(a.rarity)) return false
          }
        }
      }
      if (parsed.lastDecreeAt !== undefined && (typeof parsed.lastDecreeAt !== 'number' || !isFinite(parsed.lastDecreeAt) || parsed.lastDecreeAt < 0)) return false
      if (parsed.royalSkillTree && typeof parsed.royalSkillTree === 'object') {
        for (const key of ['royalIncome', 'royalLoyalty', 'royalPower', 'royalFavor', 'royalAscension']) {
          const val = (parsed.royalSkillTree as Record<string, unknown>)[key]
          if (val !== undefined && (typeof val !== 'number' || !isFinite(val) || val < 0)) return false
        }
      }
      if (parsed.royalDecrees !== undefined) {
        if (!Array.isArray(parsed.royalDecrees)) return false
        for (const d of parsed.royalDecrees) {
          if (!d || typeof d !== 'object') return false
          if (typeof d.type !== 'string' || !['incomeMultiplier', 'permanentIncomeBonus', 'heatReduction', 'debtReduction', 'loyaltyBoost'].includes(d.type)) return false
          if (typeof d.value !== 'number' || !isFinite(d.value)) return false
        }
      }

      // Validate settings
      if (parsed.settings && typeof parsed.settings === 'object') {
        const s = parsed.settings as Record<string, unknown>
        if (s.colorBlindMode !== undefined && !validColorBlindModes.has(s.colorBlindMode as string)) {
          s.colorBlindMode = 'none'
        }
        if (s.fontScale !== undefined && (typeof s.fontScale !== 'number' || !isFinite(s.fontScale) || s.fontScale < 0.5 || s.fontScale > 3)) {
          s.fontScale = 1.0
        }
      }

      const migrated = this.migrate(parsed as GameState)
      const oldState = this.state
      this.state = migrated

      // Apply grace periods for BRANCHES with unset (0) grace period
      const graceUntil = Date.now() + 30 * 60 * 1000
      BRANCHES.forEach(t => {
        const branch = this.state.branches[t.id]
        if (branch && branch.excommunicadoGraceUntil === 0) {
          branch.excommunicadoGraceUntil = graceUntil
        }
      })

      try {
        this.save()
        return true
      } catch {
        // Restore old state if save fails (quota exceeded, private mode)
        this.state = oldState
        return false
      }
    } catch {
      return false
    }
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(SAVE_KEY + '_backup')
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null ||
           localStorage.getItem(SAVE_KEY + '_backup') !== null
  }

  clearOfflineEarnings(): void {
    this.state.lastOfflineSeconds = 0
    this.state.lastOfflineEarnings = 0
    this.state.lastOfflineBreakdown = {}
  }

  private calculateOfflineProgress(): void {
    const now = Date.now()
    const lastSaved = this.state.timestamp
    const elapsedMs = now - lastSaved
    if (elapsedMs < 10_000) {
      this.clearOfflineEarnings()
      return
    }

    // Cap at 24 hours to prevent overflow
    const cappedSeconds = Math.min(Math.floor(elapsedMs / 1000), 86400)
    const efficiency = 0.5 + getTotalOfflineEfficiency()

    // Strip expired buffs before calculating offline income
    // so buffs that expired during offline don't apply to the full duration
    this.state.activeBuffs = this.state.activeBuffs.filter(b => b.expiresAt === null || b.expiresAt > now)

    const breakdown: Record<string, number> = {}
    let totalEarnings = 0

    this.state.worldMap.unlockedBranches.forEach(branchId => {
      const branch = this.state.branches[branchId]
      if (!branch) return

      // Use the actual income calculation which accounts for staff, buffs, skills, etc.
      const baseIncome = getBranchIncomePerSecond(branchId)

      // Active branch gets full rate, inactive get 50% (or 60% with continentalCharter)
      const isActive = branchId === this.state.activeBranch
      const inactiveRate = isActive ? 1.0 : (branch.upgrades.includes('continentalCharter') ? 0.6 : 0.5)
      const branchIncome = baseIncome * inactiveRate

      const earnings = Math.floor(branchIncome * cappedSeconds * efficiency)
      if (earnings > 0) {
        breakdown[branchId] = earnings
        totalEarnings += earnings
        branch.currency += earnings
        branch.lifetimeEarnings += earnings
      }
    })

    this.state.lastOfflineSeconds = cappedSeconds
    this.state.lastOfflineEarnings = totalEarnings
    this.state.lastOfflineBreakdown = breakdown
  }

  private migrate(save: GameState): GameState {
    save.version = CURRENT_VERSION

    // Add any missing branch states (e.g. saves from before 37-branch expansion)
    BRANCHES.forEach(t => {
      if (!save.branches[t.id]) {
        save.branches[t.id] = createDefaultBranchState()
      } else {
        const branch = save.branches[t.id]
        if (!branch.assassins) branch.assassins = {}
        Object.values(branch.assassins).forEach(a => {
          if (a.attackTarget === undefined) a.attackTarget = null
          if (a.pendingLevelUp === undefined) a.pendingLevelUp = false
        })
        if (!branch.markerDebts) branch.markerDebts = []
        branch.markerDebts.forEach(d => {
          if (!d.id) d.id = 'debt_' + d.createdAt.toString(36) + Math.random().toString(36).slice(2, 6)
          if (d.originalAmount === undefined) d.originalAmount = d.amount
          if (d.originalAmount < d.amount) d.originalAmount = d.amount
        })
        if (branch.heatLevel === undefined) branch.heatLevel = 0
        if (branch.excommunicadoGraceUntil === undefined) branch.excommunicadoGraceUntil = 0
        if (branch.guestSatisfaction === undefined) branch.guestSatisfaction = 50
        // Clamp values to valid ranges to prevent tampered saves
        branch.heatLevel = Math.max(0, Math.min(10, branch.heatLevel))
        branch.guestSatisfaction = Math.max(0, Math.min(100, branch.guestSatisfaction))
        if (branch.hqHealth === undefined) branch.hqHealth = 1000
        if (branch.hqMaxHealth === undefined) branch.hqMaxHealth = 1000
        if (branch.aiOwnerDefeated === undefined) branch.aiOwnerDefeated = false
        // Ensure all buildings have the unlocked field (added in v1.0)
        if (branch.buildings) {
          const defaults = createDefaultBranchState()
          for (const bId of Object.keys(branch.buildings)) {
            if (branch.buildings[bId].unlocked === undefined) {
              branch.buildings[bId].unlocked = defaults.buildings[bId]?.unlocked ?? false
            }
          }
        } else {
          branch.buildings = createDefaultBranchState().buildings
        }
      }
    })

    // Add new fields if missing from older saves
    if (!save.activeBuffs) save.activeBuffs = []
    if (save.permanentIncomeBonus === undefined) save.permanentIncomeBonus = 0
    if (!save.skillTree) save.skillTree = { commerce: 0, personnel: 0, shadow: 0, diplomacy: 0, ascension: 0 }
    if (!save.settings) save.settings = { colorBlindMode: 'none', highContrast: false, reducedMotion: false, fontScale: 1.0, oneHandMode: false }
    if (save.totalPlayTime === undefined) save.totalPlayTime = 0
    if (save.tutorialCompleted === undefined) save.tutorialCompleted = false
    if (save.tutorialStep === undefined) save.tutorialStep = 0
    if (save.buyMultiplier === undefined) save.buyMultiplier = 1
    if (!save.supplyRoutes) save.supplyRoutes = []
    if (!save.aiOwners) save.aiOwners = initAIOwners()
    if (!save.worldMap) save.worldMap = { unlockedBranches: [save.hqBranch], conqueredBranches: [], royalBranches: [] }
    if (!save.worldMap.conqueredBranches) save.worldMap.conqueredBranches = []
    if (!save.worldMap.royalBranches) save.worldMap.royalBranches = []
    if (!save.eventLog) save.eventLog = []
    if (save.lastOfflineSeconds === undefined) save.lastOfflineSeconds = 0
    if (save.lastOfflineEarnings === undefined) save.lastOfflineEarnings = 0
    if (!save.lastOfflineBreakdown) save.lastOfflineBreakdown = {}
    if (!save.achievements) save.achievements = []
    if (save.royalMarks === undefined) save.royalMarks = 0
    if (save.royalPrestige === undefined) save.royalPrestige = 0
    if (!save.royalSkillTree) save.royalSkillTree = { royalIncome: 0, royalLoyalty: 0, royalPower: 0, royalFavor: 0, royalAscension: 0 }
    if (save.sovereign === undefined) save.sovereign = false
    if (!save.royalDecrees) save.royalDecrees = []
    if (save.lastDecreeAt === undefined) save.lastDecreeAt = 0
    if (save.sandboxLoops === undefined) save.sandboxLoops = 0
    if (save.goldenCoins === undefined) save.goldenCoins = 0
    if (!save.visitors) save.visitors = []
    if (save.lastSandboxLoopAt === undefined) save.lastSandboxLoopAt = 0

    // Migrate supply routes missing aiOwned field
    if (save.supplyRoutes) {
      save.supplyRoutes.forEach(r => {
        if (r.aiOwned === undefined) r.aiOwned = false
      })
    }

    // Migrate rarity and clamp levels for all staff and assassins
    const validRarities = new Set(['D', 'C', 'B', 'A', 'S'])
    Object.values(save.branches).forEach(branch => {
      Object.values(branch.staff).forEach(staff => {
        if (!validRarities.has(staff.rarity)) staff.rarity = 'C'
        if (staff.level > 10) staff.level = 10
      })
      Object.values(branch.assassins).forEach(assassin => {
        if (!validRarities.has(assassin.rarity)) assassin.rarity = 'C'
        if (assassin.level > 10) assassin.level = 10
      })
    })

    // Migrate branches missing royalBuildings
    Object.values(save.branches).forEach(branch => {
      if (!branch.royalBuildings) branch.royalBuildings = {}
    })

    // Cap eventLog to prevent unbounded growth
    if (save.eventLog.length > 200) {
      save.eventLog = save.eventLog.slice(-200)
    }

    return save
  }

  private computeChecksum(): string {
    return this.computeChecksumFor(this.state)
  }

  private computeChecksumFor(state: GameState): string {
    const branchData = Object.fromEntries(
      Object.entries(state.branches).map(([k, v]) => [k, {
        c: v.currency, le: v.lifetimeEarnings, p: v.prestige, r: v.reputation,
        md: v.markerDebts ? v.markerDebts.reduce((s, d) => s + d.amount, 0) : 0,
        b: Object.fromEntries(Object.entries(v.buildings).map(([bk, bv]) => [bk, bv.level + ':' + (bv.unlocked ? 1 : 0)])),
        s: Object.values(v.staff).map(s => s.typeId + ':' + s.level + ':' + s.rarity + ':' + s.stats.precision + ':' + s.stats.speed + ':' + s.stats.charisma + ':' + s.stats.luck + ':' + s.traits.join('.') + ':' + (s.veteran ? 1 : 0) + ':' + s.prestigeSurvivedCount).join(','),
        as: Object.values(v.assassins).map(a => a.typeId + ':' + a.level + ':' + Math.round(a.loyalty) + (a.awakened ? ':1' : ':0') + ':' + a.rarity + ':' + a.stats.precision + ':' + a.stats.speed + ':' + a.stats.charisma + ':' + a.stats.luck + ':' + a.traits.join('.') + ':' + a.synergyCount + ':' + (a.assignedBranch || 'null') + ':' + (a.lentTo || 'null') + ':' + (a.attackTarget || 'null')).join(','),
        up: v.upgrades.join(','),
        hl: v.heatLevel, gs: v.guestSatisfaction,
        hh: v.hqHealth, hm: v.hqMaxHealth, ad: v.aiOwnerDefeated ? 1 : 0,
        eg: v.excommunicadoGraceUntil,
        rb: v.royalBuildings ? Object.entries(v.royalBuildings).map(([k, b]) => k + ':' + b.level).join(',') : '',
      }])
    )
    const dataObj: Record<string, unknown> = {
      tp: state.totalPrestige,
      tf: state.tableFavor,
      hq: state.hqBranch,
      at: state.activeBranch,
      ts: state.timestamp,
      pib: state.permanentIncomeBonus,
      bm: state.buyMultiplier,
      th: branchData,
    }
    if (state.skillTree) dataObj.st = state.skillTree
    if (state.settings) dataObj.se = state.settings
    if (state.worldMap?.unlockedBranches) dataObj.un = state.worldMap.unlockedBranches
    if (state.worldMap?.conqueredBranches) dataObj.cn = state.worldMap.conqueredBranches
    if (state.worldMap?.royalBranches) dataObj.rn = state.worldMap.royalBranches
    if (state.activeBuffs) dataObj.ab = state.activeBuffs.map(b => b.type + ':' + b.value + ':' + (b.expiresAt ?? 'null') + ':' + (b.branchId ?? 'null'))
    if (state.supplyRoutes) dataObj.sr = state.supplyRoutes.map(r => r.type + ':' + r.from + ':' + r.to + ':' + Math.round(r.stability) + ':' + (r.hijacked ? 1 : 0) + ':' + Math.round(r.incomePerTick))
    if (state.aiOwners) dataObj.ao = Object.values(state.aiOwners).filter(o => !o.defeated).map(o => o.branchId + ':' + Math.round(o.power) + ':' + Math.round(o.relations) + ':' + Math.round(o.threatLevel)).join(',')
    if (state.achievements) dataObj.ac = state.achievements.join(',')
    if (state.royalMarks !== undefined) dataObj.rm = state.royalMarks
    if (state.royalPrestige !== undefined) dataObj.rp = state.royalPrestige
    if (state.sovereign !== undefined) dataObj.sv = state.sovereign ? 1 : 0
    if (state.sandboxLoops !== undefined) dataObj.sl = state.sandboxLoops
    if (state.goldenCoins !== undefined) dataObj.gc = state.goldenCoins
    if (state.royalSkillTree) dataObj.rst = JSON.stringify(state.royalSkillTree)
    if (state.royalDecrees) dataObj.rd = state.royalDecrees.map(d => d.type + ':' + d.value + ':' + (d.expiresAt ?? 'null')).join(',')
    if (state.lastDecreeAt !== undefined) dataObj.ld = state.lastDecreeAt
    if (state.visitors) dataObj.vi = state.visitors.map(v => v.typeId + ':' + v.rarity + ':' + v.isAssassin + ':' + v.level + ':' + v.stats.precision + ':' + v.stats.speed + ':' + v.stats.charisma + ':' + v.stats.luck + ':' + v.traits.join('.')).join(',')
    if (state.lastSandboxLoopAt !== undefined) dataObj.ls = state.lastSandboxLoopAt
    const data = JSON.stringify(dataObj)
    // FNV-1a hash — stronger than DJB2, covers all economically relevant fields
    let hash = 0x811c9dc5
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16)
  }

}

export const gameState = new GameStateManager()
