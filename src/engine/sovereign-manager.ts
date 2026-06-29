import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { BRANCHES } from '@/data/branches'
import { rollDecrees } from '@/data/royal-decrees'
import type { RoyalDecree } from '@/types'
import type { RoyalDecreeTemplate } from '@/data/royal-decrees'

const DECREE_COOLDOWN = 24 * 3600 * 1000 // 24h in ms
const SANDBOX_LOOP_COOLDOWN = 3600 * 1000 // 1h in ms

class SovereignManager {
  checkVictory(): boolean {
    const state = gameState.get()
    if (state.sovereign) return true

    // All non-HQ branches must be conquered AND royal; HQ is already owned
    const nonHq = BRANCHES.filter(b => b.id !== state.hqBranch)
    const allConquered = nonHq.every(b => state.worldMap.conqueredBranches.includes(b.id))
    const allRoyal = nonHq.every(b => state.worldMap.royalBranches.includes(b.id))
    const allAIDefeated = Object.entries(state.aiOwners).every(([id, o]) => id === state.hqBranch || o.defeated)

    if (allConquered && allRoyal && allAIDefeated) {
      state.sovereign = true
      eventBus.emit('sovereign:achieved', {})
      return true
    }
    return false
  }

  isSovereign(): boolean {
    return gameState.get().sovereign
  }

  canIssueDecree(): boolean {
    const state = gameState.get()
    if (!state.sovereign) return false
    return Date.now() - state.lastDecreeAt >= DECREE_COOLDOWN
  }

  getDecreeChoices(): RoyalDecreeTemplate[] {
    return rollDecrees(3)
  }

  issueDecree(template: RoyalDecreeTemplate): boolean {
    const state = gameState.get()
    if (!this.canIssueDecree()) return false

    const decree: RoyalDecree = {
      id: 'decree_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: template.name,
      description: template.description,
      type: template.type,
      value: template.value,
      expiresAt: template.duration ? Date.now() + template.duration * 1000 : null,
      chosenAt: Date.now(),
    }

    state.royalDecrees.push(decree)
    state.lastDecreeAt = Date.now()

    // Apply immediate effects
    this.applyDecree(decree)

    eventBus.emit('decree:issued', { name: decree.name, description: decree.description })
    return true
  }

  private applyDecree(decree: RoyalDecree): void {
    const state = gameState.get()

    switch (decree.type) {
      case 'permanentIncomeBonus':
        state.permanentIncomeBonus = Math.min(10, state.permanentIncomeBonus + decree.value)
        break
      case 'heatReduction':
        if (decree.value === 0) {
          // Clear all heat
          Object.values(state.branches).forEach(b => { b.heatLevel = 0 })
        }
        // For ongoing heat immunity, the decree is checked in game loop
        break
      case 'debtReduction':
        if (decree.value === 0) {
          // Clear all debts
          Object.values(state.branches).forEach(b => { b.markerDebts = [] })
        } else if (decree.value > 0 && decree.value < 1) {
          // Forgive percentage
          Object.values(state.branches).forEach(b => {
            b.markerDebts.forEach(d => { d.amount *= (1 - decree.value) })
          })
        }
        break
      case 'loyaltyBoost':
        if (decree.value > 0) {
          Object.values(state.branches).forEach(b => {
            Object.values(b.assassins).forEach(a => {
              a.loyalty = Math.min(100, a.loyalty + decree.value)
            })
          })
        }
        break
      // incomeMultiplier and ongoing effects are handled via active decrees check
    }
  }

  getActiveDecrees(): RoyalDecree[] {
    const state = gameState.get()
    const now = Date.now()
    return state.royalDecrees.filter(d => {
      // One-time decrees (null duration, non-incomeMultiplier) are applied immediately and not ongoing
      if (d.expiresAt === null && d.type !== 'incomeMultiplier') return false
      if (d.expiresAt === null) return true // incomeMultiplier with null duration = permanent (shouldn't happen but handle it)
      return d.expiresAt > now
    })
  }

  cleanupExpiredDecrees(): void {
    const state = gameState.get()
    const now = Date.now()
    state.royalDecrees = state.royalDecrees.filter(d => {
      if (d.expiresAt === null) return true
      return d.expiresAt > now
    })
  }

  getActiveDecreeMult(type: RoyalDecree['type']): number {
    const active = this.getActiveDecrees().filter(d => d.type === type)
    if (active.length === 0) return 0
    return active.reduce((sum, d) => sum + d.value, 0)
  }

  hasActiveDecree(type: RoyalDecree['type']): boolean {
    return this.getActiveDecrees().some(d => d.type === type)
  }

  // Sandbox+ mode: after sovereign, can reset for increasing rewards
  canSandboxLoop(): boolean {
    const state = gameState.get()
    if (!state.sovereign) return false
    return Date.now() - state.lastSandboxLoopAt >= SANDBOX_LOOP_COOLDOWN
  }

  doSandboxLoop(): boolean {
    const state = gameState.get()
    if (!state.sovereign) return false
    if (Date.now() - state.lastSandboxLoopAt < SANDBOX_LOOP_COOLDOWN) return false

    state.lastSandboxLoopAt = Date.now()
    state.sandboxLoops += 1
    const loopMult = 1 + 0.10 * state.sandboxLoops

    // Grant royal marks based on loop count
    const marksReward = Math.floor(100 * loopMult)
    state.royalMarks += marksReward

    // Grant table favor
    state.tableFavor += Math.floor(50 * loopMult)

    eventBus.emit('sandbox:loop', { loop: state.sandboxLoops, marks: marksReward })
    return true
  }

  getSandboxLoopMult(): number {
    return 1 + 0.10 * gameState.get().sandboxLoops
  }
}

export const sovereignManager = new SovereignManager()
