import type { BranchId, SupplyRoute, SupplyRouteType } from '@/types'
import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { getRouteTypeDef } from '@/data/supply-routes'
import { getTotalIncomeMult } from './skill-manager'
import { getRoyalIncomeMult, getSovereignBuffMult } from './royal-manager'
import { sovereignManager } from './sovereign-manager'

const MAX_ROUTES_PER_BRANCH = 3
const HIJACK_ASSASSIN_LOYALTY_COST = 20
const HIJACK_SUCCESS_BASE_CHANCE = 0.4

export function getSupplyRoutes(): SupplyRoute[] {
  return gameState.get().supplyRoutes
}

export function getRoutesForBranch(branchId: BranchId): SupplyRoute[] {
  return gameState.get().supplyRoutes.filter(r => r.from === branchId || r.to === branchId)
}

export function canEstablishRoute(from: BranchId, to: BranchId, type: SupplyRouteType): boolean {
  const state = gameState.get()
  if (from === to) return false
  if (!state.worldMap.unlockedBranches.includes(from)) return false
  if (!state.worldMap.unlockedBranches.includes(to)) return false

  const def = getRouteTypeDef(type)
  if (!def) return false

  const branch = state.branches[from]
  if (!branch) return false
  if (branch.currency < def.establishCost) return false

  const existingFrom = state.supplyRoutes.filter(r => r.from === from).length
  if (existingFrom >= MAX_ROUTES_PER_BRANCH) return false

  const duplicate = state.supplyRoutes.some(r =>
    r.from === from && r.to === to && r.type === type
  )
  if (duplicate) return false

  return true
}

export function establishRoute(from: BranchId, to: BranchId, type: SupplyRouteType): boolean {
  if (!canEstablishRoute(from, to, type)) return false

  const state = gameState.get()
  const def = getRouteTypeDef(type)!
  const branch = state.branches[from]

  branch.currency -= def.establishCost

  const route: SupplyRoute = {
    id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    from,
    to,
    stability: def.baseStability,
    establishedAt: Date.now(),
    hijacked: false,
    incomePerTick: def.baseIncome,
    aiOwned: false,
  }

  state.supplyRoutes.push(route)
  eventBus.emit('supplyroute:established', { routeId: route.id, from, to, type })
  return true
}

export function canHijackRoute(routeId: string): boolean {
  const state = gameState.get()
  const route = state.supplyRoutes.find(r => r.id === routeId)
  if (!route) return false

  // Cannot hijack player routes that involve the active branch
  if (!route.aiOwned && (route.from === state.activeBranch || route.to === state.activeBranch)) return false

  const def = getRouteTypeDef(route.type)
  if (!def) return false

  const branch = state.branches[state.activeBranch]
  if (!branch) return false
  if (branch.currency < def.hijackCost) return false

  const hasAssassin = Object.values(branch.assassins).some(a =>
    a.assignedBranch === state.activeBranch &&
    !a.attackTarget &&
    a.loyalty >= HIJACK_ASSASSIN_LOYALTY_COST
  )
  if (!hasAssassin) return false

  return true
}

export function hijackRoute(routeId: string): { success: boolean; reason?: string } {
  const state = gameState.get()
  const route = state.supplyRoutes.find(r => r.id === routeId)
  if (!route) return { success: false, reason: 'Route not found' }

  // Cannot hijack player routes that involve the active branch
  if (!route.aiOwned && (route.from === state.activeBranch || route.to === state.activeBranch)) {
    return { success: false, reason: 'Cannot hijack your own route' }
  }
  // Cannot hijack if target route's destination is the active branch (would create self-route)
  if (route.to === state.activeBranch) {
    return { success: false, reason: 'Cannot hijack route to your own branch' }
  }

  const def = getRouteTypeDef(route.type)
  if (!def) return { success: false, reason: 'Unknown route type' }

  const branch = state.branches[state.activeBranch]
  if (!branch) return { success: false, reason: 'No active branch' }
  if (branch.currency < def.hijackCost) return { success: false, reason: 'Insufficient funds' }

  const assassin = Object.values(branch.assassins).find(a =>
    a.assignedBranch === state.activeBranch &&
    !a.attackTarget &&
    a.loyalty >= HIJACK_ASSASSIN_LOYALTY_COST
  )
  if (!assassin) return { success: false, reason: 'No available assassin (need loyalty >= 20)' }

  branch.currency -= def.hijackCost

  const assassinBonus = (assassin.level - 1) * 0.05
  const successChance = Math.min(0.9, HIJACK_SUCCESS_BASE_CHANCE + assassinBonus)
  const success = Math.random() < successChance

  if (success) {
    route.from = state.activeBranch
    route.hijacked = true
    route.aiOwned = false
    route.stability = Math.max(20, route.stability * 0.5)
    route.incomePerTick = def.baseIncome * 0.8
    assassin.loyalty = Math.max(0, assassin.loyalty - HIJACK_ASSASSIN_LOYALTY_COST)
    assassin.xp += 50
    eventBus.emit('supplyroute:hijacked', { routeId, type: route.type })
    return { success: true }
  } else {
    assassin.loyalty = Math.max(0, assassin.loyalty - 10)
    eventBus.emit('supplyroute:hijack-failed', { routeId })
    return { success: false, reason: 'Hijack attempt failed — assassin lost loyalty' }
  }
}

export function stabilizeRoute(routeId: string): boolean {
  const state = gameState.get()
  const route = state.supplyRoutes.find(r => r.id === routeId)
  if (!route) return false

  const def = getRouteTypeDef(route.type)
  if (!def) return false

  const branch = state.branches[route.from]
  if (!branch) return false

  const cost = Math.ceil(def.establishCost * 0.1)
  if (branch.currency < cost) return false

  branch.currency -= cost
  route.stability = Math.min(100, route.stability + 20)
  eventBus.emit('supplyroute:stabilized', { routeId })
  return true
}

export function getStabilizeCost(routeId: string): number {
  const route = gameState.get().supplyRoutes.find(r => r.id === routeId)
  if (!route) return 0
  const def = getRouteTypeDef(route.type)
  if (!def) return 0
  return Math.ceil(def.establishCost * 0.1)
}

export function dismantleRoute(routeId: string): boolean {
  const state = gameState.get()
  const idx = state.supplyRoutes.findIndex(r => r.id === routeId)
  if (idx === -1) return false
  state.supplyRoutes.splice(idx, 1)
  eventBus.emit('supplyroute:dismantled', { routeId })
  return true
}

export function tickSupplyRoutes(): void {
  const state = gameState.get()
  if (state.supplyRoutes.length === 0) return

  const toRemove: string[] = []

  state.supplyRoutes.forEach(route => {
    const def = getRouteTypeDef(route.type)
    if (!def) { toRemove.push(route.id); return }

    // AI-owned routes decay but don't generate player income
    if (route.aiOwned) {
      route.stability -= def.stabilityDecayPerTick * 0.5
      if (route.stability <= 0) toRemove.push(route.id)
      return
    }

    route.stability -= def.stabilityDecayPerTick

    if (route.stability <= 0) {
      toRemove.push(route.id)
      return
    }

    const fromBranch = state.branches[route.from]
    const toBranch = state.branches[route.to]
    if (!fromBranch || !toBranch) {
      toRemove.push(route.id)
      return
    }

    const stabilityMult = route.stability / 100
    const dynamicIncomeMult = getTotalIncomeMult()
    const income = route.incomePerTick * stabilityMult * dynamicIncomeMult * getRoyalIncomeMult() * getSovereignBuffMult() * (1 + sovereignManager.getActiveDecreeMult('incomeMultiplier'))

    fromBranch.currency += income * 0.6
    fromBranch.lifetimeEarnings += income * 0.6
    toBranch.currency += income * 0.4
    toBranch.lifetimeEarnings += income * 0.4
  })

  if (toRemove.length > 0) {
    state.supplyRoutes = state.supplyRoutes.filter(r => !toRemove.includes(r.id))
    toRemove.forEach(id => eventBus.emit('supplyroute:collapsed', { routeId: id }))
  }
}

export function getRouteCountForBranch(branchId: BranchId): number {
  return gameState.get().supplyRoutes.filter(r => r.from === branchId).length
}

export function getMaxRoutesPerBranch(): number {
  return MAX_ROUTES_PER_BRANCH
}

export function getHijackableRoutes(): SupplyRoute[] {
  const state = gameState.get()
  return state.supplyRoutes.filter(r =>
    r.aiOwned ||
    (r.from !== state.activeBranch && r.to !== state.activeBranch)
  )
}

export function getHijackSuccessChance(routeId: string): number {
  const state = gameState.get()
  const route = state.supplyRoutes.find(r => r.id === routeId)
  if (!route) return 0

  if (!route.aiOwned && (route.from === state.activeBranch || route.to === state.activeBranch)) return 0

  const branch = state.branches[state.activeBranch]
  if (!branch) return 0

  const assassin = Object.values(branch.assassins).find(a =>
    a.assignedBranch === state.activeBranch &&
    !a.attackTarget &&
    a.loyalty >= HIJACK_ASSASSIN_LOYALTY_COST
  )
  if (!assassin) return 0

  const assassinBonus = (assassin.level - 1) * 0.05
  return Math.min(0.9, HIJACK_SUCCESS_BASE_CHANCE + assassinBonus)
}

const AI_ROUTE_TYPES: SupplyRouteType[] = ['weapons', 'contraband', 'luxury']

export function tickAISupplyRoutes(): void {
  const state = gameState.get()
  const activeOwners = Object.values(state.aiOwners).filter(o =>
    !o.defeated &&
    !state.worldMap.unlockedBranches.includes(o.branchId) &&
    o.branchId !== state.hqBranch
  )
  if (activeOwners.length < 2) return

  const aiRoutes = state.supplyRoutes.filter(r => r.aiOwned)
  if (aiRoutes.length >= 8) return

  if (Math.random() > 0.02) return

  const fromOwner = activeOwners[Math.floor(Math.random() * activeOwners.length)]
  const toOwner = activeOwners[Math.floor(Math.random() * activeOwners.length)]
  if (!fromOwner || !toOwner || fromOwner.branchId === toOwner.branchId) return

  const type = AI_ROUTE_TYPES[Math.floor(Math.random() * AI_ROUTE_TYPES.length)]
  const def = getRouteTypeDef(type)
  if (!def) return

  const exists = state.supplyRoutes.some(r =>
    r.aiOwned && r.from === fromOwner.branchId && r.to === toOwner.branchId && r.type === type
  )
  if (exists) return

  state.supplyRoutes.push({
    id: `ai_route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    from: fromOwner.branchId,
    to: toOwner.branchId,
    stability: def.baseStability,
    establishedAt: Date.now(),
    hijacked: false,
    incomePerTick: def.baseIncome * 0.6,
    aiOwned: true,
  })
}
