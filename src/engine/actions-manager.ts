import { gameState } from './game-state'
import { eventBus } from './event-bus'
import type { BranchId } from '@/types'

const LAY_LOW_COST = 5
const LAY_LOW_HEAT_REDUCTION = 3

const HOST_EVENT_COST = 10
const HOST_EVENT_SATISFACTION_GAIN = 15

const BRIBE_OFFICIAL_COST = 15
const BRIBE_HEAT_REDUCTION = 5

const GOLDEN_COIN_INCOME_BOOST_COST = 20
const GOLDEN_COIN_INCOME_BOOST_DURATION = 300

export function canLayLow(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  if (branch.heatLevel <= 0) return false
  return state.goldenCoins >= LAY_LOW_COST
}

export function layLow(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  if (state.goldenCoins < LAY_LOW_COST) return false
  if (branch.heatLevel <= 0) return false

  state.goldenCoins -= LAY_LOW_COST
  branch.heatLevel = Math.max(0, branch.heatLevel - LAY_LOW_HEAT_REDUCTION)
  eventBus.emit('action:laylow', { branch: id, heatReduction: LAY_LOW_HEAT_REDUCTION })
  return true
}

export function canHostEvent(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  if (branch.guestSatisfaction >= 100) return false
  return state.goldenCoins >= HOST_EVENT_COST
}

export function hostEvent(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  if (state.goldenCoins < HOST_EVENT_COST) return false
  if (branch.guestSatisfaction >= 100) return false

  state.goldenCoins -= HOST_EVENT_COST
  branch.guestSatisfaction = Math.min(100, branch.guestSatisfaction + HOST_EVENT_SATISFACTION_GAIN)
  eventBus.emit('action:hostevent', { branch: id, satisfactionGain: HOST_EVENT_SATISFACTION_GAIN })
  return true
}

export function canBribeOfficial(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  if (branch.heatLevel <= 0) return false
  return state.goldenCoins >= BRIBE_OFFICIAL_COST
}

export function bribeOfficial(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false
  if (state.goldenCoins < BRIBE_OFFICIAL_COST) return false
  if (branch.heatLevel <= 0) return false

  state.goldenCoins -= BRIBE_OFFICIAL_COST
  branch.heatLevel = Math.max(0, branch.heatLevel - BRIBE_HEAT_REDUCTION)
  eventBus.emit('action:bribe', { branch: id, heatReduction: BRIBE_HEAT_REDUCTION })
  return true
}

export function canGoldenCoinIncomeBoost(): boolean {
  return gameState.get().goldenCoins >= GOLDEN_COIN_INCOME_BOOST_COST
}

export function goldenCoinIncomeBoost(): boolean {
  const state = gameState.get()
  if (state.goldenCoins < GOLDEN_COIN_INCOME_BOOST_COST) return false

  state.goldenCoins -= GOLDEN_COIN_INCOME_BOOST_COST
  state.activeBuffs.push({
    id: 'buff_goldencoin_' + Date.now().toString(36),
    type: 'incomeMultiplier',
    value: 1.5,
    expiresAt: Date.now() + GOLDEN_COIN_INCOME_BOOST_DURATION * 1000,
    branchId: null,
  })
  eventBus.emit('action:goldenboost', { duration: GOLDEN_COIN_INCOME_BOOST_DURATION })
  return true
}

export function getLayLowCost(): number { return LAY_LOW_COST }
export function getHostEventCost(): number { return HOST_EVENT_COST }
export function getBribeOfficialCost(): number { return BRIBE_OFFICIAL_COST }
export function getGoldenCoinIncomeBoostCost(): number { return GOLDEN_COIN_INCOME_BOOST_COST }
export function getGoldenCoinIncomeBoostDuration(): number { return GOLDEN_COIN_INCOME_BOOST_DURATION }
