import type { BranchId } from '@/types'
import { gameState } from './game-state'
import { getTotalDebtReduction } from './skill-manager'
import { hasRoyalGuard } from './assassin-manager'
import { eventBus } from './event-bus'

const DEBT_COLLECTION_RATE = 0.05
const DEBT_INTEREST_RATE = 0.01

export function getTotalDebt(branchId?: BranchId): number {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return 0
  return branch.markerDebts.reduce((sum, d) => sum + d.amount, 0)
}

export function getDebtCount(branchId?: BranchId): number {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return 0
  return branch.markerDebts.length
}

export function collectDebtPayment(branchId?: BranchId): number {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return 0

  let collected = 0
  const remaining: typeof branch.markerDebts = []

  for (const debt of branch.markerDebts) {
    if (branch.currency <= 0) {
      remaining.push(debt)
      continue
    }

    const payment = Math.min(branch.currency, debt.amount * DEBT_COLLECTION_RATE)
    branch.currency -= payment
    collected += payment

    const newAmount = debt.amount - payment
    if (newAmount > 0.01) {
      remaining.push({ ...debt, amount: newAmount })
    }
  }

  branch.markerDebts = remaining
  return collected
}

export function repayDebt(debtId: string, branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false

  const idx = branch.markerDebts.findIndex(d => d.id === debtId)
  if (idx === -1) return false
  const debt = branch.markerDebts[idx]
  if (branch.currency < debt.amount) return false

  branch.currency -= debt.amount
  branch.markerDebts.splice(idx, 1)
  branch.reputation = Math.min(10000, branch.reputation + 5)
  eventBus.emit('debt:repaid', { branchId: id, amount: debt.amount })
  return true
}

export function repayAllDebts(branchId?: BranchId): boolean {
  const state = gameState.get()
  const id = branchId || state.activeBranch
  const branch = state.branches[id]
  if (!branch) return false

  const total = getTotalDebt(id)
  if (total <= 0) return false
  if (branch.currency < total) return false

  branch.currency -= total
  branch.markerDebts = []
  branch.reputation = Math.min(10000, branch.reputation + 10)
  eventBus.emit('debt:repaid', { branchId: id, amount: total })
  return true
}

export function tickDebtInterest(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    branch.markerDebts.forEach(debt => {
      const royalGuardReduction = hasRoyalGuard(branchId) ? 0.5 : 1
      const newAmount = debt.amount * (1 + DEBT_INTEREST_RATE * (1 - getTotalDebtReduction()) * royalGuardReduction)
      const cap = (debt.originalAmount || debt.amount) * 10
      debt.amount = Math.min(newAmount, cap)
    })
  })
}

export function tickDebtCollection(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    collectDebtPayment(branchId)
  })
}
