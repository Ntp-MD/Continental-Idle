import type { ThemeId, StaffEntry, CharacterStats } from '../types'
import { STAFF_TYPES } from '../data/staff'
import { getTraitMultiplier } from '../data/traits'
import { getTotalStaffXpMult, getExtraStaffSlots } from './skill-manager'
import { gameState } from './game-state'
import { eventBus } from './event-bus'

function generateId(): string {
  return 'staff_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function rollStats(): CharacterStats {
  const budget = 20
  const min = 2
  const max = 10
  const stats = { precision: min, speed: min, charisma: min, luck: min }
  let remaining = budget - (min * 4)

  const keys: (keyof CharacterStats)[] = ['precision', 'speed', 'charisma', 'luck']
  while (remaining > 0) {
    const allMaxed = keys.every(k => stats[k] >= max)
    if (allMaxed) break
    const key = keys[Math.floor(Math.random() * keys.length)]
    if (stats[key] < max) {
      stats[key]++
      remaining--
    }
  }
  return stats
}

function rollTraits(): string[] {
  const traits: string[] = []
  const positivePool = ['workaholic', 'nightOwl', 'silverTongue', 'luckyCharm', 'perfectionist', 'naturalLeader', 'shadowTouched', 'bloodhound', 'oldGuard', 'efficient']
  const negativePool = ['lazy', 'hotHeaded', 'clumsy', 'superstitious', 'greedy']
  const rarePool = ['legendary', 'untouchable', 'mentor', 'shadowBond', 'goldenTouch']

  // 10% rare chance (replaces one positive)
  if (Math.random() < 0.10) {
    traits.push(rarePool[Math.floor(Math.random() * rarePool.length)])
  } else {
    // Roll up to 2 positive traits (60% each)
    for (let i = 0; i < 2; i++) {
      if (Math.random() < 0.60) {
        const t = positivePool[Math.floor(Math.random() * positivePool.length)]
        if (!traits.includes(t)) traits.push(t)
      }
    }
  }

  // 30% chance for 1 negative
  if (Math.random() < 0.30) {
    traits.push(negativePool[Math.floor(Math.random() * negativePool.length)])
  }

  return traits
}

export function getStaffXpToNext(level: number): number {
  return Math.ceil(100 * Math.pow(1.3, level))
}

export function getStaffLevelUpCost(staffTypeId: string, newLevel: number): number {
  const def = STAFF_TYPES.find(s => s.id === staffTypeId)
  if (!def) return Infinity
  return Math.ceil(def.hireCost * 0.1 * Math.pow(1.3, newLevel))
}

export function isStaffUnlocked(staffTypeId: string, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  const def = STAFF_TYPES.find(s => s.id === staffTypeId)
  if (!def) return false
  if (!theme) return false

  const unlock = def.unlock
  if (unlock === 'start') return true

  // Building-based unlock: check if building exists at level >= 1
  if (theme.buildings[unlock]?.level >= 1) return true

  // Prestige-based unlock: 'prestige:N'
  if (unlock.startsWith('prestige:')) {
    const required = parseInt(unlock.split(':')[1], 10)
    return state.totalPrestige >= required
  }

  // Upgrade-based unlock: 'upgrade:xxx'
  if (unlock.startsWith('upgrade:')) {
    return theme.upgrades.includes(unlock.split(':')[1])
  }

  return false
}

export function hireStaff(staffTypeId: string, themeId?: ThemeId): StaffEntry | null {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  const def = STAFF_TYPES.find(s => s.id === staffTypeId)
  if (!def) return null

  if (!isStaffUnlocked(staffTypeId, id)) return null
  if (theme.currency < def.hireCost) return null

  const baseStaffCap = 5
  const maxStaff = baseStaffCap + getExtraStaffSlots()
  if (Object.keys(theme.staff).length >= maxStaff) return null

  theme.currency -= def.hireCost

  const entry: StaffEntry = {
    id: generateId(),
    typeId: staffTypeId,
    level: 1,
    xp: 0,
    pendingLevelUp: false,
    assignedTo: null,
    stats: rollStats(),
    traits: rollTraits(),
    veteran: false,
    veteranPerk: null,
    prestigeSurvivedCount: 0,
  }

  theme.staff[entry.id] = entry
  eventBus.emit('staff:hired', { staff: entry, theme: id })
  return entry
}

export function assignStaff(staffId: string, buildingId: string | null, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  const staff = theme.staff[staffId]
  if (!staff) return false

  staff.assignedTo = buildingId
  eventBus.emit('staff:assign', { staffId, buildingId })
  eventBus.emit('income:update')
  return true
}

export function confirmLevelUp(staffId: string, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  const staff = theme.staff[staffId]
  if (!staff || !staff.pendingLevelUp) return false

  const def = STAFF_TYPES.find(s => s.id === staff.typeId)
  if (!def) return false
  if (staff.level >= def.maxLevel) return false

  const baseCost = getStaffLevelUpCost(staff.typeId, staff.level + 1)
  const traitCostMult = getTraitMultiplier(staff.traits, 'costMult')
  const cost = Math.ceil(baseCost * traitCostMult)
  if (theme.currency < cost) return false

  theme.currency -= cost
  staff.level++
  staff.xp = 0
  staff.pendingLevelUp = false
  eventBus.emit('staff:levelup', { staffId, level: staff.level })
  eventBus.emit('income:update')
  return true
}

export function tickStaffXp(themeId?: ThemeId): void {
  const state = gameState.get()

  // Tick XP for all unlocked themes, not just active
  const themesToTick = themeId ? [themeId] : state.worldMap.unlockedNodes
  
  themesToTick.forEach(tid => {
    const theme = state.themes[tid]
    if (!theme) return

    Object.values(theme.staff).forEach(staff => {
      if (!staff.assignedTo) return

      const def = STAFF_TYPES.find(s => s.id === staff.typeId)
      if (!def) return
      if (staff.level >= def.maxLevel) return

      // Active theme gets full XP, inactive themes get 50%
      const xpRate = tid === state.activeTheme ? 1.0 : 0.5
      const traitXpMult = getTraitMultiplier(staff.traits, 'xpMult')
      const skillXpMult = getTotalStaffXpMult()
      const xpGain = 0.5 * (1 + staff.level * 0.05) * (1 + staff.stats.speed * 0.01) * xpRate * traitXpMult * skillXpMult
      staff.xp += xpGain

      const threshold = getStaffXpToNext(staff.level)
      if (staff.xp >= threshold && !staff.pendingLevelUp) {
        staff.pendingLevelUp = true
      }

      // Cap unconfirmed XP at 200%
      if (staff.xp > threshold * 2) {
        staff.xp = threshold * 2
      }
    })
  })
}
