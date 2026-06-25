import type { ThemeId } from '../types'
import { BUILDINGS } from '../data/buildings'
import { THEMES } from '../data/themes'
import { gameState } from './game-state'
import { getPrestigeReputationKeepRatio } from './abilities'
import { getTotalPrestigeFavorMult } from './skill-manager'
import { eventBus } from './event-bus'

export function getPrestigeFavor(themeId?: ThemeId): number {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return 0

  let scaleConstant = 1e9
  if (state.totalPrestige >= 50) scaleConstant = 1e6
  else if (state.totalPrestige >= 25) scaleConstant = 1e7
  else if (state.totalPrestige >= 10) scaleConstant = 1e8

  return Math.floor(Math.pow(theme.lifetimeEarnings / scaleConstant, 0.5) * getTotalPrestigeFavorMult())
}

export function canPrestige(themeId?: ThemeId): boolean {
  const favor = getPrestigeFavor(themeId)
  return favor > 0
}

export function doPrestige(themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false

  const favor = getPrestigeFavor(id)
  if (favor <= 0) return false

  // Grant favor
  state.tableFavor += favor

  // Increment prestige
  theme.prestige += 1
  state.totalPrestige += 1

  // Reset buildings
  BUILDINGS.forEach(def => {
    const bState = theme.buildings[def.id]
    if (bState) {
      bState.level = 0
    }
  })

  // Reset staff levels but mark survivors as veterans
  Object.values(theme.staff).forEach(staff => {
    if (staff.level > 1) {
      staff.prestigeSurvivedCount++
      const hasOldGuard = staff.traits.includes('oldGuard')
      if ((hasOldGuard || staff.prestigeSurvivedCount >= 3) && !staff.veteran) {
        staff.veteran = true
        staff.veteranPerk = 'Survived ' + staff.prestigeSurvivedCount + ' prestiges'
      }
    }
    staff.level = 1
    staff.xp = 0
    staff.pendingLevelUp = false
    staff.assignedTo = null
  })

  // Reset currency
  theme.currency = 0
  theme.lifetimeEarnings = 0

  // Halve reputation (or keep 80% with maxed Adjudicator)
  const keepRatio = getPrestigeReputationKeepRatio(id)
  theme.reputation = Math.floor(theme.reputation * keepRatio)

  // Reset heat
  theme.heatLevel = 0

  // Reset satisfaction
  theme.guestSatisfaction = 50

  // Grace period
  theme.excommunicadoGraceUntil = Date.now() + 30 * 60 * 1000

  // Clear marker debts
  theme.markerDebts = []

  // Clear active buffs for this theme (income multipliers/freezes should not persist through reset)
  state.activeBuffs = state.activeBuffs.filter(b => b.themeId !== id)

  // Check theme unlocks
  checkThemeUnlocks()

  eventBus.emit('prestige:reset', { themeId: id, favor })
  return true
}

function checkThemeUnlocks(): void {
  const state = gameState.get()
  const graceUntil = Date.now() + 30 * 60 * 1000
  THEMES.forEach(t => {
    if (t.unlockPrestige === 0) return
    // Unlock: totalPrestige reaches threshold
    if (state.totalPrestige >= t.unlockPrestige && !state.worldMap.unlockedNodes.includes(t.id)) {
      if (t.id === state.hqCountry) return
      state.worldMap.unlockedNodes.push(t.id)
      const theme = state.themes[t.id]
      if (theme) {
        theme.excommunicadoGraceUntil = graceUntil
      }
      eventBus.emit('theme:unlock', { themeId: t.id })
    }
    // Royal: totalPrestige is 10+ above unlock threshold (theme must already be unlocked)
    if (t.unlockPrestige > 0 && state.totalPrestige >= t.unlockPrestige + 10 && !state.worldMap.royalNodes.includes(t.id)) {
      state.worldMap.royalNodes.push(t.id)
      eventBus.emit('theme:royal', { themeId: t.id })
    }
  })
}
