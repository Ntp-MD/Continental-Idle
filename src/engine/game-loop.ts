import { gameState } from './game-state'
import { tick as incomeTick, updateBuildingUnlocks } from './income-engine'
import { eventEngine } from './event-engine'
import { tickStaffXp } from './staff-manager'
import { tickDebtCollection, tickDebtInterest } from './debt-manager'
import { tickAssassinLoyalty, tickAssassinXp } from './assassin-manager'
import { tickTakeoverProgress } from './takeover-manager'
import { tickSupplyRoutes } from './supply-route-manager'
import { tickAIOwners } from './ai-owner-manager'
import { hasVaultKeeperMaxed } from './abilities'
import { getTotalIncomeMult } from './skill-manager'
import { achievementManager } from './achievement-manager'
import { tickRoyalMarks, getRoyalIncomeMult, getSovereignBuffMult } from './royal-manager'
import { sovereignManager } from './sovereign-manager'
import { eventBus } from './event-bus'

const AUTOSAVE_INTERVAL = 30 // seconds

class GameLoop {
  private intervalId: number | null = null
  private tickCount = 0
  private running = false
  private ticking = false

  start(): void {
    if (this.running) return
    this.running = true

    window.addEventListener('beforeunload', this.saveHandler)
    achievementManager.start()

    this.intervalId = window.setInterval(() => {
      if (this.ticking) return
      this.ticking = true
      try {
        this.tick()
      } finally {
        this.ticking = false
      }
    }, 1000)
  }

  private tick(): void {
    this.tickCount++

    // Income tick (1s)
    incomeTick()
    // Check building unlock conditions
    updateBuildingUnlocks()

    // Staff XP tick (1s)
    tickStaffXp()

    // Assassin XP tick (1s)
    tickAssassinXp()

    // Event engine tick (checks every 3s internally)
    eventEngine.tick()

    // Marker debt collection (every 10s) and interest (every 60s)
    if (this.tickCount % 10 === 0) {
      tickDebtCollection()
    }
    if (this.tickCount % 60 === 0) {
      tickDebtInterest()
    }
    // Assassin loyalty tick (every 30s)
    if (this.tickCount % 30 === 0) {
      tickAssassinLoyalty()
    }
    // Takeover progress tick (every 5s)
    if (this.tickCount % 5 === 0) {
      tickTakeoverProgress()
      tickSupplyRoutes()
      tickAIOwners(this.tickCount)
    }

    // Safe House interest (every 60s)
    if (this.tickCount % 60 === 0) {
      const state = gameState.get()
      state.worldMap.unlockedBranches.forEach(branchId => {
        const branch = state.branches[branchId]
        if (!branch) return
        const safeHouse = branch.buildings['safeHouse']
        if (!safeHouse || safeHouse.level === 0) return
        const baseInterest = safeHouse.level * 100
        const vaultKeeperMult = hasVaultKeeperMaxed(branchId) ? 2 : 1
        const goldStandardMult = branch.upgrades.includes('goldStandard') ? 1.5 : 1
        const interest = baseInterest * vaultKeeperMult * goldStandardMult * getTotalIncomeMult() * getRoyalIncomeMult() * getSovereignBuffMult() * (1 + sovereignManager.getActiveDecreeMult('incomeMultiplier'))
        branch.currency += interest
        branch.lifetimeEarnings += interest
      })
      // Royal Marks passive generation
      tickRoyalMarks()
    }

    // Heat passive decay (every 120 ticks = 2 min, ~0.5/min)
    if (this.tickCount % 120 === 0) {
      const state = gameState.get()
      state.worldMap.unlockedBranches.forEach(branchId => {
        const branch = state.branches[branchId]
        if (branch && branch.heatLevel > 0) {
          branch.heatLevel = Math.max(0, branch.heatLevel - 1)
        }
        // Satisfaction decays toward 50 if above, grows toward 50 if below
        if (branch) {
          if (branch.guestSatisfaction > 50) {
            branch.guestSatisfaction = Math.max(50, branch.guestSatisfaction - 1)
          } else if (branch.guestSatisfaction < 50) {
            branch.guestSatisfaction = Math.min(50, branch.guestSatisfaction + 1)
          }
        }
      })
    }

    // Autosave (every 30s)
    if (this.tickCount % AUTOSAVE_INTERVAL === 0) {
      sovereignManager.checkVictory()
      if (gameState.save()) {
        eventBus.emit('save:complete')
      } else {
        eventBus.emit('save:failed')
      }
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    achievementManager.stop()
    window.removeEventListener('beforeunload', this.saveHandler)
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  private saveHandler = (): void => {
    gameState.save()
  }
}

export const gameLoop = new GameLoop()
