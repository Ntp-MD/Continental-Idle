import type { ThemeId, AssassinEntry, CharacterStats } from '../types'
import { ASSASSIN_TYPES } from '../data/assassins'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { STAFF_TYPES } from '../data/staff'

function generateId(): string {
  return 'assassin_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function rollAssassinStats(): CharacterStats {
  const budget = 24
  const min = 3
  const max = 12
  const stats = { precision: min, speed: min, charisma: min, luck: min }
  let remaining = budget - (min * 4)
  const keys: (keyof CharacterStats)[] = ['precision', 'speed', 'charisma', 'luck']
  while (remaining > 0) {
    if (keys.every(k => stats[k] >= max)) break
    const key = keys[Math.floor(Math.random() * keys.length)]
    if (stats[key] < max) {
      stats[key]++
      remaining--
    }
  }
  return stats
}

function rollAssassinTraits(): string[] {
  const traits: string[] = []
  const rarePool = ['legendary', 'untouchable', 'mentor', 'shadowBond', 'goldenTouch']
  const positivePool = ['workaholic', 'nightOwl', 'silverTongue', 'luckyCharm', 'perfectionist', 'naturalLeader', 'shadowTouched', 'bloodhound', 'oldGuard', 'efficient']
  const roll = Math.random()
  if (roll < 0.15) {
    traits.push(rarePool[Math.floor(Math.random() * rarePool.length)])
  } else if (roll < 0.65) {
    traits.push(positivePool[Math.floor(Math.random() * positivePool.length)])
  }
  return traits
}

export function isAssassinUnlocked(assassinTypeId: string, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false
  const def = ASSASSIN_TYPES.find(a => a.id === assassinTypeId)
  if (!def) return false

  if (def.themeLock && def.themeLock !== id) return false
  return state.totalPrestige >= 3
}

export function hireAssassin(assassinTypeId: string, themeId?: ThemeId): AssassinEntry | null {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  const def = ASSASSIN_TYPES.find(a => a.id === assassinTypeId)
  if (!def) return null
  if (!theme) return null

  if (!isAssassinUnlocked(assassinTypeId, id)) return null
  if (theme.currency < def.hireCost) return null

  const assassinCap = 3
  if (Object.keys(theme.assassins).length >= assassinCap) return null

  theme.currency -= def.hireCost

  const entry: AssassinEntry = {
    id: generateId(),
    typeId: assassinTypeId,
    level: 1,
    xp: 0,
    loyalty: 100,
    assignedTheme: id,
    lentTo: null,
    lentUntil: 0,
    attackTarget: null,
    stats: rollAssassinStats(),
    traits: rollAssassinTraits(),
    synergyCount: 0,
    awakened: false,
  }

  theme.assassins[entry.id] = entry
  eventBus.emit('assassin:hired', { assassin: entry, theme: id })
  return entry
}

export function assignAssassin(assassinId: string, targetTheme: ThemeId | null, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false
  const assassin = theme.assassins[assassinId]
  if (!assassin) return false

  assassin.assignedTheme = targetTheme
  assassin.attackTarget = null
  eventBus.emit('assassin:assign', { assassinId, targetTheme })
  return true
}

export function sendAssassinToAttack(assassinId: string, targetThemeId: ThemeId, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false
  const assassin = theme.assassins[assassinId]
  if (!assassin) return false
  if (assassin.loyalty < 20) return false

  const targetTheme = state.themes[targetThemeId]
  if (!targetTheme) return false
  if (targetTheme.aiOwnerDefeated) return false
  if (targetTheme.hqHealth <= 0) return false

  assassin.attackTarget = targetThemeId
  eventBus.emit('assassin:attack', { assassinId, targetThemeId })
  return true
}

export function cancelAssassinAttack(assassinId: string, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false
  const assassin = theme.assassins[assassinId]
  if (!assassin) return false

  assassin.attackTarget = null
  eventBus.emit('assassin:attack-cancel', { assassinId })
  return true
}

export function lendAssassin(assassinId: string, toTheme: ThemeId, durationSeconds: number, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false
  const assassin = theme.assassins[assassinId]
  if (!assassin) return false
  if (assassin.loyalty < 50) return false

  assassin.lentTo = toTheme
  assassin.lentUntil = Date.now() + durationSeconds * 1000
  eventBus.emit('assassin:lent', { assassinId, toTheme })
  return true
}

export function tickAssassinLoyalty(): void {
  const state = gameState.get()
  state.worldMap.unlockedNodes.forEach(themeId => {
    const theme = state.themes[themeId]
    if (!theme) return
    Object.values(theme.assassins).forEach(assassin => {
      if (assassin.lentTo && Date.now() > assassin.lentUntil) {
        assassin.lentTo = null
        assassin.lentUntil = 0
        assassin.loyalty = Math.max(0, assassin.loyalty - 5)
      }
      if (assassin.assignedTheme && assassin.assignedTheme !== themeId) {
        assassin.loyalty = Math.max(0, assassin.loyalty - 0.1)
      }
      // Awaken at max loyalty after surviving 3+ lends
      if (!assassin.awakened && assassin.loyalty >= 100 && assassin.synergyCount >= 3) {
        assassin.awakened = true
        eventBus.emit('assassin:awakened', { assassinId: assassin.id, themeId })
      }
    })
    // Count synergy: assassin + staff assigned to same building
    const activeStaff = Object.values(theme.staff).filter(s => s.assignedTo !== null)
    Object.values(theme.assassins).forEach(assassin => {
      if (assassin.assignedTheme !== themeId) return
      const synergyBuildings = new Set(
        activeStaff.filter(s => STAFF_TYPES.find(d => d.id === s.typeId)?.bestMatch.some(b => s.assignedTo === b)).map(s => s.assignedTo!)
      )
      assassin.synergyCount = synergyBuildings.size
    })
  })
}

export function hasAssassinType(themeId: ThemeId, assassinTypeId: string): boolean {
  const state = gameState.get()
  return state.worldMap.unlockedNodes.some(tid => {
    const theme = state.themes[tid]
    if (!theme) return false
    return Object.values(theme.assassins).some(a =>
      a.typeId === assassinTypeId && a.assignedTheme === themeId
    )
  })
}

export function hasHighTableEnforcer(themeId: ThemeId): boolean {
  return hasAssassinType(themeId, 'highTableEnforcer')
}

export function hasEnforcer(themeId: ThemeId): boolean {
  return hasAssassinType(themeId, 'enforcer')
}

export function hasShadowBlade(themeId: ThemeId): boolean {
  return hasAssassinType(themeId, 'shadowBlade')
}

export function hasRoyalGuard(themeId: ThemeId): boolean {
  return hasAssassinType(themeId, 'royalGuard')
}

export function hasStreetSamurai(themeId: ThemeId): boolean {
  return hasAssassinType(themeId, 'streetSamurai')
}
