import type { VisitorEntry, Rarity, CharacterStats, BranchId } from '@/types'
import { STAFF_TYPES, STAFF_MAP } from '@/data/staff'
import { ASSASSIN_TYPES, ASSASSIN_MAP } from '@/data/assassins'
import { RARITY_CONFIG, CALL_VISITOR_RARITY, ROYAL_MARK_RARITY, RANDOM_SPAWN_RARITY, STAFF_SPAWN_CHANCE, rollRarity, getRarityCostMult } from '@/data/rarity'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { eventEngine } from './event-engine'
import { hireStaff, assignStaff } from './staff-manager'
import { hireAssassin } from './assassin-manager'

const VISITOR_TIMEOUT_MS = 2 * 60 * 60 * 1000
const RANDOM_SPAWN_CHANCE = 0.02
const CALL_VISITOR_COST = 10
const MAX_VISITORS = 5

function getVis(): VisitorEntry[] {
  return gameState.get().visitors
}

function generateVisitorId(): string {
  return 'visitor_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function rollStats(rarity: Rarity, isAssassin: boolean): CharacterStats {
  const cfg = RARITY_CONFIG[rarity]
  const budget = cfg.statBudget + (isAssassin ? 4 : 0)
  const min = cfg.statMin + (isAssassin ? 1 : 0)
  const max = cfg.statMax + (isAssassin ? 2 : 0)
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

function pickRole(): { typeId: string; isAssassin: boolean } {
  const isAssassin = Math.random() >= STAFF_SPAWN_CHANCE
  if (isAssassin) {
    const def = ASSASSIN_TYPES[Math.floor(Math.random() * ASSASSIN_TYPES.length)]
    return { typeId: def.id, isAssassin: true }
  } else {
    const def = STAFF_TYPES[Math.floor(Math.random() * STAFF_TYPES.length)]
    return { typeId: def.id, isAssassin: false }
  }
}

function createVisitor(rarity: Rarity): VisitorEntry {
  const { typeId, isAssassin } = pickRole()
  const now = Date.now()
  return {
    id: generateVisitorId(),
    typeId,
    isAssassin,
    rarity,
    level: 1,
    stats: rollStats(rarity, isAssassin),
    traits: rollTraits(rarity),
    arrivedAt: now,
    expiresAt: now + VISITOR_TIMEOUT_MS,
  }
}

export function getVisitors(): VisitorEntry[] {
  return getVis()
}

export function getVisitorCount(): number {
  return getVis().length
}

export function canCallVisitor(): boolean {
  const state = gameState.get()
  return state.goldenCoins >= CALL_VISITOR_COST && getVis().length === 0
}

export function callVisitor(): boolean {
  const state = gameState.get()
  if (state.goldenCoins < CALL_VISITOR_COST) return false
  if (getVis().length > 0) return false

  state.goldenCoins -= CALL_VISITOR_COST

  const count = Math.min(MAX_VISITORS, 5)
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(CALL_VISITOR_RARITY)
    getVis().push(createVisitor(rarity))
  }

  eventBus.emit('visitor:arrived', { count })
  return true
}

export function canUseRoyalMarkScroll(): boolean {
  const state = gameState.get()
  return state.sovereign && state.royalMarks >= 1 && getVis().length === 0
}

export function royalMarkScroll(): boolean {
  const state = gameState.get()
  if (!state.sovereign || state.royalMarks < 1) return false
  if (getVis().length > 0) return false

  state.royalMarks -= 1

  const rarity = rollRarity(ROYAL_MARK_RARITY)
  getVis().push(createVisitor(rarity))

  eventBus.emit('visitor:arrived', { count: 1, royalMark: true })
  return true
}

export function hireVisitor(visitorId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.hqBranch
  const branch = state.branches[id]
  if (!branch) return false

  const vis = getVis()
  const idx = vis.findIndex(v => v.id === visitorId)
  if (idx === -1) return false

  const visitor = vis[idx]

  if (visitor.isAssassin) {
    const def = ASSASSIN_MAP[visitor.typeId]
    if (!def) return false
    const cost = Math.ceil(def.hireCost * getRarityCostMult(visitor.rarity))
    if (branch.currency < cost) return false

    const assassinCap = branch.upgrades.includes('armoryExpansion') ? 4 : 3
    if (Object.keys(branch.assassins).length >= assassinCap) return false

    branch.currency -= cost
    const hired = hireAssassin(visitor.typeId, id)
    if (!hired) {
      branch.currency += cost
      return false
    }
    branch.currency += def.hireCost

    hired.rarity = visitor.rarity
    hired.stats = { ...visitor.stats }
    hired.traits = [...visitor.traits]
  } else {
    const def = STAFF_MAP[visitor.typeId]
    if (!def) return false
    const cost = Math.ceil(def.hireCost * getRarityCostMult(visitor.rarity))
    if (branch.currency < cost) return false

    const baseStaffCap = 5
    if (Object.keys(branch.staff).length >= baseStaffCap) return false

    branch.currency -= cost
    const hired = hireStaff(visitor.typeId, id)
    if (!hired) {
      branch.currency += cost
      return false
    }
    branch.currency += def.hireCost

    hired.rarity = visitor.rarity
    hired.stats = { ...visitor.stats }
    hired.traits = [...visitor.traits]

    if (def.bestMatch.length > 0) {
      assignStaff(hired.id, def.bestMatch[0], id)
    }
  }

  vis.splice(idx, 1)
  eventBus.emit('visitor:hired', { visitorId, branch: id })
  return true
}

export function dismissVisitor(visitorId: string): boolean {
  const vis = getVis()
  const idx = vis.findIndex(v => v.id === visitorId)
  if (idx === -1) return false

  vis.splice(idx, 1)
  eventBus.emit('visitor:dismissed', { visitorId })
  return true
}

export function tickVisitorSpawn(): void {
  const vis = getVis()
  if (vis.length > 0) return
  if (eventEngine.hasActiveEvent()) return

  if (Math.random() < RANDOM_SPAWN_CHANCE) {
    const rarity = rollRarity(RANDOM_SPAWN_RARITY)
    vis.push(createVisitor(rarity))
    eventBus.emit('visitor:arrived', { count: 1, random: true })
  }
}

export function tickVisitorTimeout(): void {
  const vis = getVis()
  const now = Date.now()
  for (let i = vis.length - 1; i >= 0; i--) {
    if (now > vis[i].expiresAt) {
      const vid = vis[i].id
      vis.splice(i, 1)
      eventBus.emit('visitor:left', { visitorId: vid })
    }
  }
}

export function getCallVisitorCost(): number {
  return CALL_VISITOR_COST
}
