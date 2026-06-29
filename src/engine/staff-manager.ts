import type { BranchId, StaffEntry, CharacterStats, Rarity } from '@/types'
import { STAFF_MAP } from '@/data/staff'
import { getTraitMultiplier } from '@/data/traits'
import { getTotalStaffXpMult, getExtraStaffSlots } from './skill-manager'
import { getSovereignBuffMult } from './royal-manager'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { RARITY_CONFIG, rollRarityFromConfig, getRarityCostMult } from '@/data/rarity'

function generateId(): string {
  return 'staff_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function rollStats(rarity: Rarity): CharacterStats {
  const cfg = RARITY_CONFIG[rarity]
  const budget = cfg.statBudget
  const min = cfg.statMin
  const max = cfg.statMax
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

function rollTraits(rarity: Rarity): string[] {
  const cfg = RARITY_CONFIG[rarity]
  const traits: string[] = []
  const positivePool = ['workaholic', 'nightOwl', 'silverTongue', 'luckyCharm', 'perfectionist', 'naturalLeader', 'shadowTouched', 'bloodhound', 'oldGuard', 'efficient']
  const negativePool = ['lazy', 'hotHeaded', 'clumsy', 'superstitious', 'greedy']
  const rarePool = ['legendary', 'untouchable', 'mentor', 'shadowBond', 'goldenTouch']

  if (Math.random() < cfg.traitRareChance) {
    traits.push(rarePool[Math.floor(Math.random() * rarePool.length)])
  } else {
    for (let i = 0; i < 2; i++) {
      if (Math.random() < cfg.traitPositiveChance) {
        const t = positivePool[Math.floor(Math.random() * positivePool.length)]
        if (!traits.includes(t)) traits.push(t)
      }
    }
  }

  if (Math.random() < cfg.traitNegativeChance) {
    traits.push(negativePool[Math.floor(Math.random() * negativePool.length)])
  }

  return traits
}

export function getStaffXpToNext(level: number): number {
  return Math.ceil(100 * Math.pow(1.3, level))
}

export function getStaffLevelUpCost(staffTypeId: string, newLevel: number): number {
  const def = STAFF_MAP[staffTypeId]
  if (!def) return Infinity
  return Math.ceil(def.hireCost * 0.1 * Math.pow(1.3, newLevel))
}

export function isStaffUnlocked(staffTypeId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  const def = STAFF_MAP[staffTypeId]
  if (!def) return false
  if (!branch) return false

  const unlock = def.unlock
  if (unlock === 'start') return true

  // Building-based unlock: check if building exists at level >= 1
  if (branch.buildings[unlock]?.level >= 1) return true

  // Prestige-based unlock: 'prestige:N'
  if (unlock.startsWith('prestige:')) {
    const required = parseInt(unlock.split(':')[1], 10)
    return state.totalPrestige >= required
  }

  // Upgrade-based unlock: 'upgrade:xxx'
  if (unlock.startsWith('upgrade:')) {
    return branch.upgrades.includes(unlock.split(':')[1])
  }

  return false
}

export function hireStaff(staffTypeId: string, branchId?: BranchId): StaffEntry | null {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  const def = STAFF_MAP[staffTypeId]
  if (!def) return null
  if (!branch) return null

  if (!isStaffUnlocked(staffTypeId, id)) return null
  if (branch.currency < def.hireCost) return null

  const baseStaffCap = 5
  const maxStaff = baseStaffCap + getExtraStaffSlots()
  if (Object.keys(branch.staff).length >= maxStaff) return null

  branch.currency -= def.hireCost

  const rarity = rollRarityFromConfig()
  const entry: StaffEntry = {
    id: generateId(),
    typeId: staffTypeId,
    level: 1,
    xp: 0,
    pendingLevelUp: false,
    assignedTo: null,
    stats: rollStats(rarity),
    traits: rollTraits(rarity),
    veteran: false,
    veteranPerk: null,
    prestigeSurvivedCount: 0,
    rarity,
  }

  branch.staff[entry.id] = entry
  eventBus.emit('staff:hired', { staff: entry, branch: id })
  return entry
}

export function assignStaff(staffId: string, buildingId: string | null, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const staff = branch.staff[staffId]
  if (!staff) return false

  staff.assignedTo = buildingId
  eventBus.emit('staff:assign', { staffId, buildingId })
  eventBus.emit('income:update')
  return true
}

export function confirmLevelUp(staffId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const staff = branch.staff[staffId]
  if (!staff || !staff.pendingLevelUp) return false

  const def = STAFF_MAP[staff.typeId]
  if (!def) return false
  if (staff.level >= def.maxLevel) return false

  const baseCost = getStaffLevelUpCost(staff.typeId, staff.level + 1)
  const traitCostMult = getTraitMultiplier(staff.traits, 'costMult')
  const rarityCostMult = getRarityCostMult(staff.rarity)
  const cost = Math.ceil(baseCost * traitCostMult * rarityCostMult)
  if (branch.currency < cost) return false

  branch.currency -= cost
  staff.level++
  staff.xp = 0
  staff.pendingLevelUp = false
  eventBus.emit('staff:levelup', { staffId, level: staff.level })
  eventBus.emit('income:update')
  return true
}

export function fireStaff(staffId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const staff = branch.staff[staffId]
  if (!staff) return false

  staff.assignedTo = null
  delete branch.staff[staffId]
  eventBus.emit('staff:fired', { staffId, branch: id })
  eventBus.emit('income:update')
  return true
}

export function tickStaffXp(branchId?: BranchId): void {
  const state = gameState.get()

  // Tick XP for all unlocked BRANCHES, not just active
  const branchesToTick = branchId ? [branchId] : state.worldMap.unlockedBranches
  
  branchesToTick.forEach(tid => {
    const branch = state.branches[tid]
    if (!branch) return

    Object.values(branch.staff).forEach(staff => {
      if (!staff.assignedTo) return

      const def = STAFF_MAP[staff.typeId]
      if (!def) return
      if (staff.level >= def.maxLevel) return

      // Active branch gets full XP, inactive BRANCHES get 50%
      const xpRate = tid === state.activeBranch ? 1.0 : 0.5
      const traitXpMult = getTraitMultiplier(staff.traits, 'xpMult')
      const skillXpMult = getTotalStaffXpMult()
      const upgradeXpMult = branch.upgrades.includes('trainingGrounds') ? 1.2 : 1.0
      const xpGain = 0.5 * (1 + staff.level * 0.05) * (1 + staff.stats.speed * 0.01) * xpRate * traitXpMult * skillXpMult * upgradeXpMult * getSovereignBuffMult()
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
