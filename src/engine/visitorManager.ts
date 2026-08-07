import type { VisitorEntry, Rarity, BranchId, AssassinEntry, StaffEntry } from '@/types'
import { STAFF_TYPES, STAFF_MAP } from '@/data/staff'
import { ASSASSIN_TYPES, ASSASSIN_MAP } from '@/data/assassins'
import { CALL_VISITOR_RARITY, ROYAL_MARK_RARITY, RANDOM_SPAWN_RARITY, STAFF_SPAWN_CHANCE, rollRarity, getRarityCostMult } from '@/data/rarity'
import { gameState } from './gameState'
import { eventBus } from './eventBus'
import { eventEngine } from './eventEngine'
import { hireStaff, assignStaff } from './staffManager'
import { hireAssassin } from './assassinManager'
import { getExtraStaffSlots } from './skillManager'
import { rollStats, rollTraits } from './npcStats'

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

function rollVisitorStats(rarity: Rarity, isAssassin: boolean) {
  return isAssassin
    ? rollStats(rarity, { statBudgetBonus: 4, statMinBonus: 1, statMaxBonus: 2 })
    : rollStats(rarity)
}

function rollVisitorTraits(rarity: Rarity, _isAssassin: boolean): string[] {
  return rollTraits(rarity, { maxPositive: 2, allowNegative: true })
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
    stats: rollVisitorStats(rarity, isAssassin),
    traits: rollVisitorTraits(rarity, isAssassin),
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

  const count = MAX_VISITORS
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


    const rarityPremium = cost - def.hireCost
    if (rarityPremium > 0) branch.currency -= rarityPremium
    let hired: AssassinEntry | null = null
    try {
      hired = hireAssassin(visitor.typeId, id)
    } catch (err) {
      if (rarityPremium > 0) branch.currency += rarityPremium
      console.error('hireVisitor: hireAssassin threw', err)
      return false
    }
    if (!hired) {
      if (rarityPremium > 0) branch.currency += rarityPremium
      return false
    }

    hired.rarity = visitor.rarity
    hired.stats = { ...visitor.stats }
    hired.traits = [...visitor.traits]
  } else {
    const def = STAFF_MAP[visitor.typeId]
    if (!def) return false
    const cost = Math.ceil(def.hireCost * getRarityCostMult(visitor.rarity))
    if (branch.currency < cost) return false

    const maxStaff = 5 + getExtraStaffSlots()
    if (Object.keys(branch.staff).length >= maxStaff) return false


    const rarityPremium = cost - def.hireCost
    if (rarityPremium > 0) branch.currency -= rarityPremium
    let hired: StaffEntry | null = null
    try {
      hired = hireStaff(visitor.typeId, id)
    } catch (err) {
      if (rarityPremium > 0) branch.currency += rarityPremium
      console.error('hireVisitor: hireStaff threw', err)
      return false
    }
    if (!hired) {
      if (rarityPremium > 0) branch.currency += rarityPremium
      return false
    }

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
