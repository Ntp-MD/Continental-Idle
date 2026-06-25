import type { ThemeId } from '../types'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { THEMES } from '../data/themes'

const HQ_HEALTH_BASE = 1000
const HQ_HEALTH_PER_PRESTIGE = 500

export function getHqMaxHealth(themeId: ThemeId): number {
  const def = THEMES.find(t => t.id === themeId)
  if (!def) return HQ_HEALTH_BASE
  return HQ_HEALTH_BASE + def.unlockPrestige * HQ_HEALTH_PER_PRESTIGE
}

export function canInitiateTakeover(themeId: ThemeId): boolean {
  const state = gameState.get()
  if (themeId === state.hqCountry) return false
  if (state.worldMap.conqueredNodes.includes(themeId)) return false
  if (state.worldMap.unlockedNodes.includes(themeId)) return false

  const def = THEMES.find(t => t.id === themeId)
  if (!def) return false
  return state.totalPrestige >= def.unlockPrestige
}

export function getTakeoverCost(themeId: ThemeId): number {
  const def = THEMES.find(t => t.id === themeId)
  if (!def) return Infinity
  return Math.ceil(50_000_000 * Math.pow(1.5, def.unlockPrestige))
}

export function initiateTakeover(themeId: ThemeId): boolean {
  const state = gameState.get()
  const activeTheme = state.themes[state.activeTheme]
  if (!activeTheme) return false
  if (!canInitiateTakeover(themeId)) return false

  const targetTheme = state.themes[themeId]
  if (!targetTheme) return false

  const cost = getTakeoverCost(themeId)
  if (activeTheme.currency < cost) return false

  activeTheme.currency -= cost
  targetTheme.hqMaxHealth = getHqMaxHealth(themeId)
  targetTheme.hqHealth = targetTheme.hqMaxHealth
  targetTheme.aiOwnerDefeated = false
  eventBus.emit('takeover:started', { themeId })
  return true
}

export function tickTakeoverProgress(): void {
  const state = gameState.get()

  THEMES.forEach(def => {
    const targetTheme = state.themes[def.id]
    if (!targetTheme) return
    if (targetTheme.aiOwnerDefeated) return
    if (targetTheme.hqHealth <= 0) return

    let totalDamage = 0
    let attackerCount = 0

    state.worldMap.unlockedNodes.forEach(sourceThemeId => {
      const sourceTheme = state.themes[sourceThemeId]
      if (!sourceTheme) return

      Object.values(sourceTheme.assassins).forEach(assassin => {
        if (assassin.attackTarget !== def.id) return
        if (assassin.loyalty < 10) return

        const baseDamage = 5 + assassin.level * 3
        const statBonus = assassin.stats.precision * 0.5 + assassin.stats.speed * 0.3
        const traitMult = assassin.awakened ? 2 : 1
        const damage = (baseDamage + statBonus) * traitMult

        totalDamage += damage
        attackerCount++

        assassin.xp += damage * 0.5
        assassin.loyalty = Math.max(0, assassin.loyalty - 0.2)
      })
    })

    if (totalDamage > 0) {
      targetTheme.hqHealth = Math.max(0, targetTheme.hqHealth - totalDamage)
      targetTheme.takeoverProgress = (1 - targetTheme.hqHealth / targetTheme.hqMaxHealth) * 100

      if (targetTheme.hqHealth <= 0) {
        targetTheme.aiOwnerDefeated = true
        if (!state.worldMap.conqueredNodes.includes(def.id)) {
          state.worldMap.conqueredNodes.push(def.id)
        }
        if (!state.worldMap.unlockedNodes.includes(def.id)) {
          state.worldMap.unlockedNodes.push(def.id)
        }
        targetTheme.takeoverProgress = 0

        state.worldMap.unlockedNodes.forEach(sourceThemeId => {
          const sourceTheme = state.themes[sourceThemeId]
          if (!sourceTheme) return
          Object.values(sourceTheme.assassins).forEach(a => {
            if (a.attackTarget === def.id) {
              a.attackTarget = null
              a.loyalty = Math.min(100, a.loyalty + 10)
            }
          })
        })

        eventBus.emit('takeover:complete', { themeId: def.id })
        eventBus.emit('theme:unlock', { themeId: def.id })
      }
    }
  })
}

export function getTakeoverProgress(themeId: ThemeId): number {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme) return 0
  if (theme.hqHealth <= 0) return 100
  if (theme.hqMaxHealth <= 0) return 0
  return (1 - theme.hqHealth / theme.hqMaxHealth) * 100
}

export function getHqHealth(themeId: ThemeId): number {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme) return 0
  return theme.hqHealth
}

export function getHqHealthPercent(themeId: ThemeId): number {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme || theme.hqMaxHealth <= 0) return 0
  return (theme.hqHealth / theme.hqMaxHealth) * 100
}

export function getConqueredNodes(): ThemeId[] {
  return gameState.get().worldMap.conqueredNodes
}

export function getAttackersOnTarget(themeId: ThemeId): number {
  const state = gameState.get()
  let count = 0
  state.worldMap.unlockedNodes.forEach(sourceId => {
    const theme = state.themes[sourceId]
    if (!theme) return
    count += Object.values(theme.assassins).filter(a => a.attackTarget === themeId).length
  })
  return count
}
