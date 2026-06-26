import { gameState } from './game-state'
import { gameLoop } from './game-loop'
import { eventEngine } from './event-engine'
import { eventBus } from './event-bus'
import { tick as incomeTick, updateBuildingUnlocks, purchaseBuilding, getBranchIncomePerSecond, getAffordableLevels } from './income-engine'
import { tickStaffXp, hireStaff, assignStaff, confirmLevelUp, isStaffUnlocked } from './staff-manager'
import { tickDebtCollection, tickDebtInterest } from './debt-manager'
import { tickAssassinLoyalty, tickAssassinXp, hireAssassin, isAssassinUnlocked, assignAssassin, sendAssassinToAttack, confirmAssassinLevelUp } from './assassin-manager'
import { tickTakeoverProgress, initiateTakeover, canInitiateTakeover, getTakeoverCost } from './takeover-manager'
import { hasVaultKeeperMaxed } from './abilities'
import { getTotalIncomeMult, getExtraStaffSlots } from './skill-manager'
import { isUpgradePurchased, purchaseUpgrade, UPGRADES } from './upgrade-manager'
import { doPrestige, canPrestige, getPrestigeFavor } from './prestige-manager'
import { BUILDINGS } from '@/data/buildings'
import { STAFF_TYPES } from '@/data/staff'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { BRANCHES, getBranchDef } from '@/data/branches'
import { SKILL_NODES } from '@/data/skills'
import { upgradeSkill } from './skill-manager'
import { formatNumber } from './format'
import type { BranchId, SkillTreeState } from '@/types'

export type AutoplaySpeed = 1 | 10 | 100 | 1000

interface AutoplayLogEntry {
  time: number
  message: string
}

class AutoplayBot {
  private intervalId: number | null = null
  private tickCount = 0
  private running = false
  private speed: AutoplaySpeed = 100
  private log: AutoplayLogEntry[] = []
  private maxLogSize = 50
  private decisionCounter = 0
  private wasGameLoopRunning = false

  start(): void {
    if (this.running) return
    this.running = true
    this.wasGameLoopRunning = gameLoop.isRunning()
    if (this.wasGameLoopRunning) {
      gameLoop.stop()
    }
    this.logAction('Autoplay started')
    this.scheduleInterval()
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.running = false
    if (this.wasGameLoopRunning) {
      gameLoop.start()
    }
    this.logAction('Autoplay stopped')
    eventBus.emit('autoplay:stopped')
  }

  isRunning(): boolean {
    return this.running
  }

  setSpeed(speed: AutoplaySpeed): void {
    this.speed = speed
    if (this.running) {
      this.scheduleInterval()
    }
    this.logAction(`Speed set to ${speed}x`)
  }

  getSpeed(): AutoplaySpeed {
    return this.speed
  }

  getLog(): AutoplayLogEntry[] {
    return [...this.log]
  }

  private scheduleInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
    }
    const ticksPerInterval = this.speed >= 100 ? Math.floor(this.speed / 100) : 1
    const intervalMs = this.speed >= 100 ? 10 : Math.floor(1000 / this.speed)
    this.intervalId = window.setInterval(() => {
      for (let i = 0; i < ticksPerInterval; i++) {
        this.tick()
      }
    }, intervalMs)
  }

  private logAction(message: string): void {
    this.log.unshift({ time: Date.now(), message })
    if (this.log.length > this.maxLogSize) {
      this.log = this.log.slice(0, this.maxLogSize)
    }
    eventBus.emit('autoplay:log', message)
  }

  private tick(): void {
    this.tickCount++

    incomeTick()
    updateBuildingUnlocks()
    tickStaffXp()
    tickAssassinXp()
    eventEngine.tick()

    if (this.tickCount % 10 === 0) tickDebtCollection()
    if (this.tickCount % 60 === 0) tickDebtInterest()
    if (this.tickCount % 30 === 0) tickAssassinLoyalty()
    if (this.tickCount % 5 === 0) tickTakeoverProgress()

    if (this.tickCount % 60 === 0) {
      this.tickSafeHouseInterest()
    }

    if (this.tickCount % 120 === 0) {
      this.tickHeatDecay()
    }

    this.decisionCounter++
    if (this.decisionCounter >= 5) {
      this.decisionCounter = 0
      this.makeDecisions()
    }

    if (this.tickCount % 300 === 0) {
      gameState.save()
    }
  }

  private tickSafeHouseInterest(): void {
    const state = gameState.get()
    state.worldMap.unlockedBranches.forEach(branchId => {
      const branch = state.branches[branchId]
      if (!branch) return
      const safeHouse = branch.buildings['safeHouse']
      if (!safeHouse || safeHouse.level === 0) return
      const baseInterest = safeHouse.level * 100
      const vaultKeeperMult = hasVaultKeeperMaxed(branchId) ? 2 : 1
      const goldStandardMult = isUpgradePurchased('goldStandard') ? 1.5 : 1
      const interest = baseInterest * vaultKeeperMult * goldStandardMult * getTotalIncomeMult()
      branch.currency += interest
      branch.lifetimeEarnings += interest
    })
  }

  private tickHeatDecay(): void {
    const state = gameState.get()
    state.worldMap.unlockedBranches.forEach(branchId => {
      const branch = state.branches[branchId]
      if (!branch) return
      if (branch.heatLevel > 0) branch.heatLevel = Math.max(0, branch.heatLevel - 1)
      if (branch.guestSatisfaction > 50) {
        branch.guestSatisfaction = Math.max(50, branch.guestSatisfaction - 1)
      } else if (branch.guestSatisfaction < 50) {
        branch.guestSatisfaction = Math.min(50, branch.guestSatisfaction + 1)
      }
    })
  }

  private makeDecisions(): void {
    this.autoResolveEvent()
    this.buyBuildings()
    this.hireAndAssignStaff()
    this.confirmStaffLevelUps()
    this.hireAndAssignAssassins()
    this.confirmAssassinLevelUps()
    this.initiateTakeovers()
    this.purchaseUpgrades()
    this.upgradeSkills()
    this.doPrestigeIfWorth()
    this.switchToBestBranch()
  }

  private autoResolveEvent(): void {
    const active = eventEngine.getActiveEvent()
    if (!active) return
    const choices = active.definition.choices
    const best = choices.find(c => c.isBest)
    const safe = choices.find(c => c.isSafe)
    const preferred = best || safe || choices[0]
    if (preferred) {
      const ok = eventEngine.resolveEvent(preferred.id)
      if (!ok) {
        const noReq = choices.find(c => !c.requires)
        if (noReq) {
          eventEngine.resolveEvent(noReq.id)
        } else {
          eventEngine.ignoreEvent()
        }
      }
      this.logAction(`Event: ${active.definition.name} → ${preferred.id}`)
    }
  }

  private buyBuildings(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return

    const sorted = [...BUILDINGS].sort((a, b) => b.baseCost - a.baseCost)

    for (const def of sorted) {
      const bState = branch.buildings[def.id]
      if (!bState || !bState.unlocked || bState.level >= def.maxLevel) continue

      const affordable = getAffordableLevels(branch, def.id)
      if (affordable <= 0) continue

      const prevBuyMult = state.buyMultiplier
      state.buyMultiplier = 0
      const ok = purchaseBuilding(def.id)
      state.buyMultiplier = prevBuyMult

      if (ok) {
        this.logAction(`Bought ${def.name} (now lvl ${bState.level})`)
      }
    }
  }

  private hireAndAssignStaff(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return

    const baseStaffCap = 5
    const maxStaff = baseStaffCap + getExtraStaffSlots()
    const currentStaffCount = Object.keys(branch.staff).length

    if (currentStaffCount < maxStaff) {
      for (const def of STAFF_TYPES) {
        if (!isStaffUnlocked(def.id)) continue
        if (branch.currency < def.hireCost) continue
        const hired = hireStaff(def.id)
        if (hired) {
          this.logAction(`Hired ${def.name}`)
          break
        }
      }
    }

    const unassigned = Object.values(branch.staff).filter(s => s.assignedTo === null)
    for (const staff of unassigned) {
      const def = STAFF_TYPES.find(s => s.id === staff.typeId)
      if (!def) continue

      const bestBuilding = def.bestMatch.find(bId => {
        const bState = branch.buildings[bId]
        return bState && bState.unlocked && bState.level > 0
      })

      if (bestBuilding) {
        assignStaff(staff.id, bestBuilding)
        this.logAction(`Assigned ${def.name} to ${bestBuilding}`)
      } else {
        const anyBuilding = BUILDINGS.find(b => {
          const bState = branch.buildings[b.id]
          return bState && bState.unlocked && bState.level > 0
        })
        if (anyBuilding) {
          assignStaff(staff.id, anyBuilding.id)
          this.logAction(`Assigned ${def.name} to ${anyBuilding.id}`)
        }
      }
    }
  }

  private confirmStaffLevelUps(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return

    Object.values(branch.staff).forEach(staff => {
      if (staff.pendingLevelUp) {
        const ok = confirmLevelUp(staff.id)
        if (ok) {
          const def = STAFF_TYPES.find(s => s.id === staff.typeId)
          this.logAction(`Staff ${def?.name || staff.typeId} leveled up to ${staff.level}`)
        }
      }
    })
  }

  private hireAndAssignAssassins(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return
    if (state.totalPrestige < 3) return

    const assassinCap = isUpgradePurchased('armoryExpansion') ? 4 : 3
    const currentCount = Object.keys(branch.assassins).length

    if (currentCount < assassinCap) {
      for (const def of ASSASSIN_TYPES) {
        if (!isAssassinUnlocked(def.id)) continue
        if (branch.currency < def.hireCost) continue
        const hired = hireAssassin(def.id)
        if (hired) {
          this.logAction(`Hired ${def.name}`)
          break
        }
      }
    }

    Object.values(branch.assassins).forEach(assassin => {
      if (!assassin.assignedBranch) {
        assignAssassin(assassin.id, state.activeBranch)
      }
    })
  }

  private confirmAssassinLevelUps(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return

    Object.values(branch.assassins).forEach(assassin => {
      if (assassin.pendingLevelUp) {
        const ok = confirmAssassinLevelUp(assassin.id)
        if (ok) {
          const def = ASSASSIN_TYPES.find(a => a.id === assassin.typeId)
          this.logAction(`Assassin ${def?.name || assassin.typeId} leveled up to ${assassin.level}`)
        }
      }
    })
  }

  private initiateTakeovers(): void {
    const state = gameState.get()

    // Try to initiate takeovers using currency from any unlocked branch
    for (const def of BRANCHES) {
      if (!canInitiateTakeover(def.id)) continue
      const cost = getTakeoverCost(def.id)

      // Find a branch that can afford it
      let fundedBy: BranchId | null = null
      for (const branchId of state.worldMap.unlockedBranches) {
        const t = state.branches[branchId]
        if (t && t.currency >= cost) {
          fundedBy = branchId
          break
        }
      }
      if (!fundedBy) continue

      // Temporarily switch to the funding branch to pay
      const prevActive = state.activeBranch
      state.activeBranch = fundedBy
      const ok = initiateTakeover(def.id)
      state.activeBranch = prevActive

      if (ok) {
        this.logAction(`Takeover initiated: ${def.name} (funded by ${getBranchDef(fundedBy).name})`)
      }
    }

    // Send assassins from ALL unlocked BRANCHES to attack takeover targets
    state.worldMap.unlockedBranches.forEach(sourceBranchId => {
      const sourceBranch = state.branches[sourceBranchId]
      if (!sourceBranch) return

      const unassigned = Object.values(sourceBranch.assassins).filter(a =>
        !a.attackTarget && a.loyalty >= 20 && a.assignedBranch === sourceBranchId
      )

      for (const assassin of unassigned) {
        const target = BRANCHES.find(t => {
          const targetBranch = state.branches[t.id]
          if (!targetBranch) return false
          if (targetBranch.aiOwnerDefeated) return false
          if (targetBranch.hqHealth <= 0) return false
          if (state.worldMap.unlockedBranches.includes(t.id)) return false
          if (state.worldMap.conqueredBranches.includes(t.id)) return false
          return targetBranch.hqHealth < targetBranch.hqMaxHealth
        })

        if (target) {
          sendAssassinToAttack(assassin.id, target.id, sourceBranchId)
          this.logAction(`Sent assassin from ${getBranchDef(sourceBranchId).name} to attack ${target.name}`)
        }
      }
    })
  }

  private purchaseUpgrades(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return

    for (const def of UPGRADES) {
      if (branch.upgrades.includes(def.id)) continue
      if (branch.currency < def.cost) continue
      const ok = purchaseUpgrade(def.id)
      if (ok) {
        this.logAction(`Purchased upgrade: ${def.name}`)
      }
    }
  }

  private upgradeSkills(): void {
    const state = gameState.get()
    const branches: (keyof SkillTreeState)[] = ['commerce', 'ascension', 'personnel', 'diplomacy', 'shadow']

    for (const branch of branches) {
      const currentLevel = state.skillTree[branch]
      const node = SKILL_NODES.find(n => n.branch === branch && n.level === currentLevel + 1)
      if (!node) continue
      if (state.tableFavor < node.favorCost) continue

      const ok = upgradeSkill(branch)
      if (ok) {
        this.logAction(`Upgraded skill: ${branch} → ${currentLevel + 1}`)
      }
    }
  }

  private doPrestigeIfWorth(): void {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return
    if (!canPrestige()) return

    const favor = getPrestigeFavor()
    if (favor <= 0) return

    // Prestige as soon as possible — favor >= 1 is enough
    // Early game needs prestiges to unlock BRANCHES for takeover
    const ok = doPrestige()
    if (ok) {
      this.logAction(`Prestiged! +${favor} favor (total: ${state.tableFavor})`)
    }
  }

  private switchToBestBranch(): void {
    const state = gameState.get()
    let bestBranch: BranchId = state.activeBranch
    let bestScore = -1

    state.worldMap.unlockedBranches.forEach(branchId => {
      const branch = state.branches[branchId]
      if (!branch) return
      const income = getBranchIncomePerSecond(branchId)
      const score = income + branch.currency * 0.01
      if (score > bestScore) {
        bestScore = score
        bestBranch = branchId
      }
    })

    if (bestBranch !== state.activeBranch) {
      gameState.setActiveBranch(bestBranch)
      const def = BRANCHES.find(t => t.id === bestBranch)
      this.logAction(`Switched to ${def?.name || bestBranch}`)
    }
  }

  getStatus(): {
    running: boolean
    speed: AutoplaySpeed
    tickCount: number
    totalPrestige: number
    tableFavor: number
    conqueredCount: number
    totalBranches: number
    activeBranch: string
    activeCurrency: string
    activeIncome: string
  } {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    const def = BRANCHES.find(t => t.id === state.activeBranch)
    return {
      running: this.running,
      speed: this.speed,
      tickCount: this.tickCount,
      totalPrestige: state.totalPrestige,
      tableFavor: state.tableFavor,
      conqueredCount: state.worldMap.conqueredBranches.length,
      totalBranches: BRANCHES.length,
      activeBranch: def?.name || state.activeBranch,
      activeCurrency: branch ? formatNumber(branch.currency) : '0',
      activeIncome: formatNumber(getBranchIncomePerSecond()) + '/s',
    }
  }
}

export const autoplayBot = new AutoplayBot()
