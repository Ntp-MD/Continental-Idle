import type { ThemeId } from '../types'
import { gameState } from './game-state'
import { getTotalDebtReduction } from './skill-manager'
import { hasRoyalGuard } from './assassin-manager'
import { eventBus } from './event-bus'

const DEBT_COLLECTION_RATE = 0.05
const DEBT_INTEREST_RATE = 0.01

export function getTotalDebt(themeId?: ThemeId): number {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return 0
  return theme.markerDebts.reduce((sum, d) => sum + d.amount, 0)
}

export function getDebtCount(themeId?: ThemeId): number {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return 0
  return theme.markerDebts.length
}

export function collectDebtPayment(themeId?: ThemeId): number {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return 0

  let collected = 0
  const remaining: typeof theme.markerDebts = []

  for (const debt of theme.markerDebts) {
    if (theme.currency <= 0) {
      remaining.push(debt)
      continue
    }

    const payment = Math.min(theme.currency, debt.amount * DEBT_COLLECTION_RATE)
    theme.currency -= payment
    collected += payment

    const newAmount = debt.amount - payment
    if (newAmount > 0.01) {
      remaining.push({ ...debt, amount: newAmount })
    }
  }

  theme.markerDebts = remaining
  return collected
}

export function repayDebt(debtCreatedAt: number, themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false

  const idx = theme.markerDebts.findIndex(d => d.createdAt === debtCreatedAt)
  if (idx === -1) return false
  const debt = theme.markerDebts[idx]
  if (theme.currency < debt.amount) return false

  theme.currency -= debt.amount
  theme.markerDebts.splice(idx, 1)
  theme.reputation = Math.min(10000, theme.reputation + 5)
  eventBus.emit('debt:repaid', { themeId: id, amount: debt.amount })
  return true
}

export function repayAllDebts(themeId?: ThemeId): boolean {
  const state = gameState.get()
  const id = themeId || state.activeTheme
  const theme = state.themes[id]
  if (!theme) return false

  const total = getTotalDebt(id)
  if (total <= 0) return false
  if (theme.currency < total) return false

  theme.currency -= total
  theme.markerDebts = []
  theme.reputation = Math.min(10000, theme.reputation + 10)
  eventBus.emit('debt:repaid', { themeId: id, amount: total })
  return true
}

export function tickDebtInterest(): void {
  const state = gameState.get()
  state.worldMap.unlockedNodes.forEach(themeId => {
    const theme = state.themes[themeId]
    if (!theme) return
    theme.markerDebts.forEach(debt => {
      const royalGuardReduction = hasRoyalGuard(themeId) ? 0.5 : 1
      debt.amount *= (1 + DEBT_INTEREST_RATE * (1 - getTotalDebtReduction()) * royalGuardReduction)
    })
  })
}

export function tickDebtCollection(): void {
  const state = gameState.get()
  collectDebtPayment(state.activeTheme)
}
