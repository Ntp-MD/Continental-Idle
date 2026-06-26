import type { GameState, BranchId, BranchState, BuildingState } from '@/types'
import { BUILDINGS } from '@/data/buildings'
import { BRANCHES } from '@/data/branches'
import { getTotalOfflineEfficiency } from './skill-manager'

const CURRENT_VERSION = '1.0'
const SAVE_KEY = 'continental_idle_save'

// Deferred import to break circular dependency with income-engine
let _getBranchIncomePerSecond: ((branchId?: BranchId) => number) | null = null
export function setIncomeFunction(fn: (branchId?: BranchId) => number): void {
  _getBranchIncomePerSecond = fn
}

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
    totalOfflineTime: 0,
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
    lastOfflineEarnings: 0,
    lastOfflineSeconds: 0,
    checksum: '',
  }
}

class GameStateManager {
  private state: GameState

  constructor() {
    this.state = createDefaultState()
  }

  get(): GameState {
    return this.state
  }

  getBranch(id?: BranchId): BranchState {
    return this.state.branches[id || this.state.activeBranch]
  }

  getActiveBranchId(): BranchId {
    return this.state.activeBranch
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
      this.applyOfflineEarnings()
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
    this.state.timestamp = Date.now()
    this.state.checksum = this.computeChecksum()
    const json = JSON.stringify(this.state)
    try {
      // Backup previous save before overwriting
      const prev = localStorage.getItem(SAVE_KEY)
      if (prev) localStorage.setItem(SAVE_KEY + '_backup', prev)
      localStorage.setItem(SAVE_KEY, json)
      return true
    } catch {
      console.error('Failed to save game — storage quota exceeded or unavailable')
      return false
    }
  }

  load(): GameState | null {
    const raw = localStorage.getItem(SAVE_KEY)
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
      const parsed = JSON.parse(raw) as GameState

      // Validate checksum before accepting
      const savedChecksum = parsed.checksum
      parsed.checksum = ''
      const expected = this.computeChecksumFor(parsed)
      if (!savedChecksum || savedChecksum !== expected) {
        console.error('Save checksum missing or mismatched — rejecting tampered save')
        return null
      }
      parsed.checksum = savedChecksum

      const migrated = this.migrate(parsed)
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
      if (typeof parsed.totalPrestige !== 'number') return false
      if (typeof parsed.tableFavor !== 'number') return false
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
      for (const branchId of Object.keys(parsed.branches)) {
        const t = parsed.branches[branchId]
        if (!t) return false
        if (typeof t.currency !== 'number' || t.currency < 0) return false
        if (typeof t.lifetimeEarnings !== 'number' || t.lifetimeEarnings < 0) return false
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
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
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
        if (branch.heatLevel === undefined) branch.heatLevel = 0
        if (branch.excommunicadoGraceUntil === undefined) branch.excommunicadoGraceUntil = 0
        if (branch.guestSatisfaction === undefined) branch.guestSatisfaction = 50
        if (branch.hqHealth === undefined) branch.hqHealth = 1000
        if (branch.hqMaxHealth === undefined) branch.hqMaxHealth = 1000
        if (branch.aiOwnerDefeated === undefined) branch.aiOwnerDefeated = false
        // Ensure all buildings have the unlocked field (added in v1.0)
        if (branch.buildings) {
          for (const bId of Object.keys(branch.buildings)) {
            if (branch.buildings[bId].unlocked === undefined) {
              branch.buildings[bId].unlocked = true
            }
          }
        }
      }
    })

    // Add new fields if missing from older saves
    if (!save.activeBuffs) save.activeBuffs = []
    if (save.permanentIncomeBonus === undefined) save.permanentIncomeBonus = 0
    if (!save.skillTree) save.skillTree = { commerce: 0, personnel: 0, shadow: 0, diplomacy: 0, ascension: 0 }
    if (!save.settings) save.settings = { colorBlindMode: 'none', highContrast: false, reducedMotion: false, fontScale: 1.0, oneHandMode: false }
    if (save.totalPlayTime === undefined) save.totalPlayTime = 0
    if (save.totalOfflineTime === undefined) save.totalOfflineTime = 0
    if (save.tutorialCompleted === undefined) save.tutorialCompleted = false
    if (save.tutorialStep === undefined) save.tutorialStep = 0
    if (save.buyMultiplier === undefined) save.buyMultiplier = 1
    if (save.lastOfflineEarnings === undefined) save.lastOfflineEarnings = 0
    if (save.lastOfflineSeconds === undefined) save.lastOfflineSeconds = 0
    if (!save.worldMap) save.worldMap = { unlockedBranches: [save.hqBranch], conqueredBranches: [], royalBranches: [] }
    if (!save.worldMap.conqueredBranches) save.worldMap.conqueredBranches = []
    if (!save.worldMap.royalBranches) save.worldMap.royalBranches = []
    if (!save.eventLog) save.eventLog = []

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
        s: Object.values(v.staff).map(s => s.typeId + ':' + s.level).join(','),
        as: Object.values(v.assassins).map(a => a.typeId + ':' + a.level + ':' + Math.round(a.loyalty) + (a.awakened ? ':1' : ':0')).join(','),
        up: v.upgrades.join(','),
        hl: v.heatLevel, gs: v.guestSatisfaction,
        hh: v.hqHealth, hm: v.hqMaxHealth, ad: v.aiOwnerDefeated ? 1 : 0,
        eg: v.excommunicadoGraceUntil,
      }])
    )
    const dataObj: Record<string, unknown> = {
      tp: state.totalPrestige,
      tf: state.tableFavor,
      hq: state.hqBranch,
      at: state.activeBranch,
      ts: state.timestamp,
      pib: state.permanentIncomeBonus,
      th: branchData,
    }
    if (state.skillTree) dataObj.st = state.skillTree
    if (state.worldMap?.unlockedBranches) dataObj.un = state.worldMap.unlockedBranches
    if (state.worldMap?.conqueredBranches) dataObj.cn = state.worldMap.conqueredBranches
    if (state.worldMap?.royalBranches) dataObj.rn = state.worldMap.royalBranches
    if (state.activeBuffs) dataObj.ab = state.activeBuffs.map(b => b.type + ':' + b.value + ':' + (b.expiresAt ?? 'null') + ':' + (b.branchId ?? 'null'))
    const data = JSON.stringify(dataObj)
    // FNV-1a hash — stronger than DJB2, covers all economically relevant fields
    let hash = 0x811c9dc5
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16)
  }

  private applyOfflineEarnings(): void {
    const now = Date.now()
    const lastSave = this.state.timestamp
    const offlineSeconds = Math.floor((now - lastSave) / 1000)

    if (offlineSeconds < 10) return

    const cappedSeconds = Math.min(offlineSeconds, 8 * 3600)
    const offlineRate = 0.5 + getTotalOfflineEfficiency()

    const incomeFn = _getBranchIncomePerSecond
    if (!incomeFn) return

    let totalEarned = 0
    this.state.worldMap.unlockedBranches.forEach(branchId => {
      const branch = this.state.branches[branchId]
      if (!branch) return

      const onlineIncome = incomeFn(branchId)
      const earned = onlineIncome * cappedSeconds * offlineRate
      branch.currency += earned
      branch.lifetimeEarnings += earned
      totalEarned += earned
    })

    this.state.totalOfflineTime += cappedSeconds
    this.state.lastOfflineEarnings = totalEarned
    this.state.lastOfflineSeconds = cappedSeconds
  }
}

export const gameState = new GameStateManager()
