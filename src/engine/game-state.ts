import type { GameState, ThemeId, ThemeState, BuildingState } from '../types'
import { BUILDINGS } from '../data/buildings'
import { THEMES } from '../data/themes'
import { getTotalOfflineEfficiency } from './skill-manager'

const CURRENT_VERSION = '1.0'
const SAVE_KEY = 'continental_idle_save'

// Deferred import to break circular dependency with income-engine
let _getThemeIncomePerSecond: ((themeId?: ThemeId) => number) | null = null
export function setIncomeFunction(fn: (themeId?: ThemeId) => number): void {
  _getThemeIncomePerSecond = fn
}

function createDefaultThemeState(): ThemeState {
  const buildings: Record<string, BuildingState> = {}
  BUILDINGS.forEach(b => {
    buildings[b.id] = { level: 0, unlocked: true }
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
    conquered: false,
    takeoverProgress: 0,
    hqHealth: 1000,
    hqMaxHealth: 1000,
    aiOwnerDefeated: false,
  }
}

function createDefaultState(hq: ThemeId = 'bangkok'): GameState {
  const themes = {} as Record<ThemeId, ThemeState>
  THEMES.forEach(t => {
    themes[t.id] = createDefaultThemeState()
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
    hqCountry: hq,
    activeTheme: hq,
    worldMap: {
      unlockedNodes: [hq],
      conqueredNodes: [],
      royalNodes: [],
    },
    themes,
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

  getTheme(id?: ThemeId): ThemeState {
    return this.state.themes[id || this.state.activeTheme]
  }

  getActiveThemeId(): ThemeId {
    return this.state.activeTheme
  }

  setActiveTheme(id: ThemeId): void {
    this.state.activeTheme = id
  }

  setBuyMultiplier(mult: number): void {
    this.state.buyMultiplier = mult
  }

  init(hq?: ThemeId): void {
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
    // Ensure grace period is fresh for themes with unset (0) grace period
    const graceUntil = Date.now() + 30 * 60 * 1000
    THEMES.forEach(t => {
      const theme = this.state.themes[t.id]
      if (theme && theme.excommunicadoGraceUntil === 0) {
        theme.excommunicadoGraceUntil = graceUntil
      }
    })
  }

  reset(hq: ThemeId): void {
    this.state = createDefaultState(hq)
    // Set fresh grace periods on reset
    const graceUntil = Date.now() + 30 * 60 * 1000
    THEMES.forEach(t => {
      if (this.state.themes[t.id]) {
        this.state.themes[t.id].excommunicadoGraceUntil = graceUntil
      }
    })
  }

  save(): void {
    this.state.timestamp = Date.now()
    this.state.checksum = this.computeChecksum()
    const json = JSON.stringify(this.state)
    localStorage.setItem(SAVE_KEY, json)
  }

  load(): GameState | null {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
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
      // Don't set this.state here — let init() own that
      return migrated
    } catch {
      return null
    }
  }

  exportSave(): string {
    this.save()
    return localStorage.getItem(SAVE_KEY) || ''
  }

  importSave(json: string): boolean {
    try {
      const parsed = JSON.parse(json)
      if (!parsed.version || !parsed.hqCountry || !parsed.themes) return false
      if (typeof parsed.totalPrestige !== 'number') return false
      if (typeof parsed.tableFavor !== 'number') return false
      if (!Array.isArray(parsed.worldMap?.unlockedNodes)) return false

      // Validate HQ is a known theme
      if (!THEMES.find(t => t.id === parsed.hqCountry)) return false

      // Validate activeTheme is a known theme
      if (!THEMES.find(t => t.id === parsed.activeTheme)) return false

      // Validate checksum
      const savedChecksum = parsed.checksum
      parsed.checksum = ''
      const expected = this.computeChecksumFor(parsed)
      if (!savedChecksum || savedChecksum !== expected) return false
      parsed.checksum = savedChecksum

      // Validate currency non-negative for all themes
      for (const themeId of Object.keys(parsed.themes)) {
        const t = parsed.themes[themeId]
        if (typeof t.currency !== 'number' || t.currency < 0) return false
        if (typeof t.lifetimeEarnings !== 'number' || t.lifetimeEarnings < 0) return false
      }

      const migrated = this.migrate(parsed as GameState)
      this.state = migrated

      // Apply grace periods for themes with unset (0) grace period
      const graceUntil = Date.now() + 30 * 60 * 1000
      THEMES.forEach(t => {
        const theme = this.state.themes[t.id]
        if (theme && theme.excommunicadoGraceUntil === 0) {
          theme.excommunicadoGraceUntil = graceUntil
        }
      })

      this.save()
      return true
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

    // Add any missing theme states (e.g. saves from before 37-theme expansion)
    THEMES.forEach(t => {
      if (!save.themes[t.id]) {
        save.themes[t.id] = createDefaultThemeState()
      } else {
        const theme = save.themes[t.id]
        if (!theme.assassins) theme.assassins = {}
        Object.values(theme.assassins).forEach(a => {
          if (a.attackTarget === undefined) a.attackTarget = null
        })
        if (!theme.markerDebts) theme.markerDebts = []
        if (theme.heatLevel === undefined) theme.heatLevel = 0
        if (theme.excommunicadoGraceUntil === undefined) theme.excommunicadoGraceUntil = 0
        if (theme.guestSatisfaction === undefined) theme.guestSatisfaction = 50
        if (theme.conquered === undefined) theme.conquered = false
        if (theme.takeoverProgress === undefined) theme.takeoverProgress = 0
        if (theme.hqHealth === undefined) theme.hqHealth = 1000
        if (theme.hqMaxHealth === undefined) theme.hqMaxHealth = 1000
        if (theme.aiOwnerDefeated === undefined) theme.aiOwnerDefeated = false
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
    if (!save.worldMap) save.worldMap = { unlockedNodes: [save.hqCountry], conqueredNodes: [], royalNodes: [] }
    if (!save.worldMap.conqueredNodes) save.worldMap.conqueredNodes = []
    if (!save.worldMap.royalNodes) save.worldMap.royalNodes = []
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
    const themeData = Object.fromEntries(
      Object.entries(state.themes).map(([k, v]) => [k, {
        c: v.currency, le: v.lifetimeEarnings, p: v.prestige, r: v.reputation,
        md: v.markerDebts ? v.markerDebts.reduce((s, d) => s + d.amount, 0) : 0,
        b: Object.fromEntries(Object.entries(v.buildings).map(([bk, bv]) => [bk, bv.level])),
        s: Object.values(v.staff).map(s => s.typeId + ':' + s.level).join(','),
        up: v.upgrades.join(','),
        hl: v.heatLevel, gs: v.guestSatisfaction,
      }])
    )
    const dataObj: Record<string, unknown> = {
      tp: state.totalPrestige,
      tf: state.tableFavor,
      hq: state.hqCountry,
      at: state.activeTheme,
      ts: state.timestamp,
      pib: state.permanentIncomeBonus,
      th: themeData,
    }
    if (state.skillTree) dataObj.st = state.skillTree
    if (state.worldMap?.conqueredNodes) dataObj.cn = state.worldMap.conqueredNodes
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

    const incomeFn = _getThemeIncomePerSecond
    if (!incomeFn) return

    let totalEarned = 0
    this.state.worldMap.unlockedNodes.forEach(themeId => {
      const theme = this.state.themes[themeId]
      if (!theme) return

      const onlineIncome = incomeFn(themeId)
      const earned = onlineIncome * cappedSeconds * offlineRate
      theme.currency += earned
      theme.lifetimeEarnings += earned
      totalEarned += earned
    })

    this.state.totalOfflineTime += cappedSeconds
    this.state.lastOfflineEarnings = totalEarned
    this.state.lastOfflineSeconds = cappedSeconds
  }
}

export const gameState = new GameStateManager()
