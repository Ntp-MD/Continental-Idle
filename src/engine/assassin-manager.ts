import type { BranchId, AssassinEntry, CharacterStats } from '@/types'
import { ASSASSIN_MAP } from '@/data/assassins'
import { getTraitMultiplier } from '@/data/traits'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { getRoyalLoyaltyDecayReduction, getSovereignBuffMult } from './royal-manager'
import { sovereignManager } from './sovereign-manager'
import { STAFF_TYPES } from '@/data/staff'

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

export function isAssassinUnlocked(assassinTypeId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const def = ASSASSIN_MAP[assassinTypeId]
  if (!def) return false

  if (def.branchLock && def.branchLock !== id) return false
  return state.totalPrestige >= 3
}

export function hireAssassin(assassinTypeId: string, branchId?: BranchId): AssassinEntry | null {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  const def = ASSASSIN_MAP[assassinTypeId]
  if (!def) return null
  if (!branch) return null

  if (!isAssassinUnlocked(assassinTypeId, id)) return null
  if (branch.currency < def.hireCost) return null

  const assassinCap = branch.upgrades.includes('armoryExpansion') ? 4 : 3
  if (Object.keys(branch.assassins).length >= assassinCap) return null

  branch.currency -= def.hireCost

  const entry: AssassinEntry = {
    id: generateId(),
    typeId: assassinTypeId,
    level: 1,
    xp: 0,
    pendingLevelUp: false,
    loyalty: 100,
    assignedBranch: id,
    lentTo: null,
    lentUntil: 0,
    attackTarget: null,
    stats: rollAssassinStats(),
    traits: rollAssassinTraits(),
    synergyCount: 0,
    awakened: false,
  }

  branch.assassins[entry.id] = entry
  invalidateAssassinCache()
  eventBus.emit('assassin:hired', { assassin: entry, branch: id })
  return entry
}

export function assignAssassin(assassinId: string, targetBranch: BranchId | null, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const assassin = branch.assassins[assassinId]
  if (!assassin) return false

  assassin.assignedBranch = targetBranch
  assassin.attackTarget = null
  invalidateAssassinCache()
  eventBus.emit('assassin:assign', { assassinId, targetBranch })
  return true
}

export function sendAssassinToAttack(assassinId: string, targetBranchId: BranchId, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const assassin = branch.assassins[assassinId]
  if (!assassin) return false
  if (assassin.loyalty < 20) return false

  const targetBranch = state.branches[targetBranchId]
  if (!targetBranch) return false
  if (targetBranch.aiOwnerDefeated) return false
  if (targetBranch.hqHealth <= 0) return false
  // Cannot attack BRANCHES that are already unlocked or conquered
  if (state.worldMap.unlockedBranches.includes(targetBranchId)) return false
  if (state.worldMap.conqueredBranches.includes(targetBranchId)) return false

  assassin.attackTarget = targetBranchId
  eventBus.emit('assassin:attack', { assassinId, targetBranchId })
  return true
}

export function cancelAssassinAttack(assassinId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const assassin = branch.assassins[assassinId]
  if (!assassin) return false

  assassin.attackTarget = null
  eventBus.emit('assassin:attack-cancel', { assassinId })
  return true
}

export function lendAssassin(assassinId: string, toBranch: BranchId, durationSeconds: number, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const assassin = branch.assassins[assassinId]
  if (!assassin) return false
  if (assassin.loyalty < 50) return false
  if (toBranch === id) return false

  assassin.lentTo = toBranch
  assassin.lentUntil = Date.now() + durationSeconds * 1000
  assassin.attackTarget = null
  eventBus.emit('assassin:lent', { assassinId, toBranch })
  return true
}

export function recallAssassin(assassinId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const assassin = branch.assassins[assassinId]
  if (!assassin || !assassin.lentTo) return false

  assassin.lentTo = null
  assassin.lentUntil = 0
  assassin.loyalty = Math.max(0, assassin.loyalty - 5)
  eventBus.emit('assassin:recalled', { assassinId })
  return true
}

export function getAssassinXpToNext(level: number): number {
  return Math.ceil(200 * Math.pow(1.4, level))
}

export function confirmAssassinLevelUp(assassinId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  const assassin = branch.assassins[assassinId]
  if (!assassin || !assassin.pendingLevelUp) return false

  const def = ASSASSIN_MAP[assassin.typeId]
  if (!def) return false
  if (assassin.level >= def.maxLevel) return false

  const cost = Math.ceil(def.hireCost * 0.15 * Math.pow(1.4, assassin.level))
  if (branch.currency < cost) return false

  branch.currency -= cost
  assassin.level++
  assassin.xp = 0
  assassin.pendingLevelUp = false
  eventBus.emit('assassin:levelup', { assassinId, level: assassin.level, branchId: id })
  return true
}

export function getAssassinLevelUpCost(assassinTypeId: string, newLevel: number): number {
  const def = ASSASSIN_MAP[assassinTypeId]
  if (!def) return Infinity
  return Math.ceil(def.hireCost * 0.15 * Math.pow(1.4, newLevel - 1))
}

export function getAssassinCombatDamage(assassin: AssassinEntry): number {
  const baseDamage = 5 + assassin.level * 3
  const statBonus = assassin.stats.precision * 0.5 + assassin.stats.speed * 0.3
  const awakenedMult = assassin.awakened ? 2 : 1
  const synergyMult = 1 + assassin.synergyCount * 0.05
  return (baseDamage + statBonus) * awakenedMult * synergyMult
}

export function getAssassinRaidPower(assassin: AssassinEntry): number {
  const base = assassin.level * 5 + assassin.stats.precision * 2 + assassin.stats.speed * 1
  const synergyMult = 1 + assassin.synergyCount * 0.05
  return (assassin.awakened ? base * 2 : base) * synergyMult
}

export function getAssassinXpMult(assassin: AssassinEntry): number {
  return getTraitMultiplier(assassin.traits, 'xpMult')
}

export function tickAssassinXp(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return

    Object.values(branch.assassins).forEach(assassin => {
      if (!assassin.assignedBranch) return
      if (assassin.lentTo) return
      if (assassin.attackTarget) return

      const def = ASSASSIN_MAP[assassin.typeId]
      if (!def) return
      if (assassin.level >= def.maxLevel) return

      const xpRate = branchId === state.activeBranch ? 1.0 : 0.5
      const traitXpMult = getTraitMultiplier(assassin.traits, 'xpMult')
      const synergyBonus = 1 + assassin.synergyCount * 0.1
      const xpGain = 0.3 * (1 + assassin.level * 0.05) * xpRate * traitXpMult * synergyBonus * getSovereignBuffMult()
      assassin.xp += xpGain

      const threshold = getAssassinXpToNext(assassin.level)
      if (assassin.xp >= threshold && !assassin.pendingLevelUp) {
        assassin.pendingLevelUp = true
      }

      if (assassin.xp > threshold * 2) {
        assassin.xp = threshold * 2
      }
    })
  })
}

export function tickAssassinLoyalty(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    Object.values(branch.assassins).forEach(assassin => {
      if (assassin.lentTo && Date.now() > assassin.lentUntil) {
        assassin.lentTo = null
        assassin.lentUntil = 0
        assassin.loyalty = Math.max(0, assassin.loyalty - 5)
      }
      if (assassin.assignedBranch && assassin.assignedBranch !== branchId) {
        const decayReduction = getRoyalLoyaltyDecayReduction()
        const sovereignNoDecay = sovereignManager.hasActiveDecree('loyaltyBoost') && sovereignManager.getActiveDecreeMult('loyaltyBoost') === -1
        if (!sovereignNoDecay) {
          assassin.loyalty = Math.max(0, assassin.loyalty - 0.1 * (1 - decayReduction))
        }
      } else if (!assassin.lentTo && !assassin.attackTarget && assassin.loyalty < 100) {
        assassin.loyalty = Math.min(100, assassin.loyalty + 0.05)
      }
      // Auto-level: check XP threshold
      const def = ASSASSIN_MAP[assassin.typeId]
      if (def && assassin.level < def.maxLevel && !assassin.pendingLevelUp) {
        const threshold = getAssassinXpToNext(assassin.level)
        // Cap unconfirmed XP at 200%
        if (assassin.xp > threshold * 2) {
          assassin.xp = threshold * 2
        }
        if (assassin.xp >= threshold) {
          assassin.pendingLevelUp = true
        }
      }
      // Awaken at max loyalty after surviving 3+ lends
      if (!assassin.awakened && assassin.loyalty >= 100 && assassin.synergyCount >= 3) {
        assassin.awakened = true
        eventBus.emit('assassin:awakened', { assassinId: assassin.id, branchId })
      }
    })
    // Count synergy: assassin + staff assigned to same building
    const activeStaff = Object.values(branch.staff).filter(s => s.assignedTo !== null)
    const synergyBuildings = new Set(
      activeStaff
        .filter(s => STAFF_TYPES.find(d => d.id === s.typeId)?.bestMatch.some(b => s.assignedTo === b))
        .map(s => s.assignedTo!)
    )
    Object.values(branch.assassins).forEach(assassin => {
      if (assassin.assignedBranch !== branchId) return
      assassin.synergyCount = synergyBuildings.size
    })
  })
}

// Per-tick cache: branchId -> Set of assassin typeIds assigned to that branch
let assassinTypeCache: Map<BranchId, Set<string>> | null = null

function buildAssassinTypeCache(): void {
  const state = gameState.get()
  const cache = new Map<BranchId, Set<string>>()
  state.worldMap.unlockedBranches.forEach(sourceId => {
    const branch = state.branches[sourceId]
    if (!branch) return
    Object.values(branch.assassins).forEach(a => {
      if (a.assignedBranch) {
        let set = cache.get(a.assignedBranch)
        if (!set) { set = new Set(); cache.set(a.assignedBranch, set) }
        set.add(a.typeId)
      }
    })
  })
  assassinTypeCache = cache
}

export function invalidateAssassinCache(): void {
  assassinTypeCache = null
}

export function hasAssassinType(branchId: BranchId, assassinTypeId: string): boolean {
  if (!assassinTypeCache) buildAssassinTypeCache()
  return assassinTypeCache!.get(branchId)?.has(assassinTypeId) ?? false
}

export function hasHighTableEnforcer(branchId: BranchId): boolean {
  return hasAssassinType(branchId, 'highTableEnforcer')
}

export function hasEnforcer(branchId: BranchId): boolean {
  return hasAssassinType(branchId, 'enforcer')
}

export function hasShadowBlade(branchId: BranchId): boolean {
  return hasAssassinType(branchId, 'shadowBlade')
}

export function hasRoyalGuard(branchId: BranchId): boolean {
  return hasAssassinType(branchId, 'royalGuard')
}

export function hasStreetSamurai(branchId: BranchId): boolean {
  return hasAssassinType(branchId, 'streetSamurai')
}
