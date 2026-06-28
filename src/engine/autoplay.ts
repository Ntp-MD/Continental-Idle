import { gameState } from './game-state'
import { gameLoop } from './game-loop'
import { eventEngine } from './event-engine'
import { eventBus } from './event-bus'
import { tick as incomeTick, updateBuildingUnlocks, purchaseBuilding, getBranchIncomePerSecond, getBuildingCost, getBuildingIncome, setSuppressUIEvents } from './income-engine'
import { tickStaffXp, hireStaff, assignStaff, confirmLevelUp, isStaffUnlocked } from './staff-manager'
import { tickDebtCollection, tickDebtInterest, getTotalDebt, repayAllDebts } from './debt-manager'
import { tickAssassinLoyalty, tickAssassinXp, hireAssassin, isAssassinUnlocked, assignAssassin, sendAssassinToAttack, confirmAssassinLevelUp, getAssassinCombatDamage, hasEnforcer, hasHighTableEnforcer, cancelAssassinAttack } from './assassin-manager'
import { tickTakeoverProgress, initiateTakeover, canInitiateTakeover, getTakeoverCost } from './takeover-manager'
import { tickSupplyRoutes } from './supply-route-manager'
import { tickAIOwners } from './ai-owner-manager'
import { hasVaultKeeperMaxed } from './abilities'
import { getTotalIncomeMult, getExtraStaffSlots } from './skill-manager'
import { purchaseUpgrade, UPGRADES } from './upgrade-manager'
import { doPrestige, getPrestigeFavor } from './prestige-manager'
import { canEstablishRoute, establishRoute, stabilizeRoute, getSupplyRoutes, getStabilizeCost, canHijackRoute, hijackRoute, getHijackableRoutes } from './supply-route-manager'
import { BUILDINGS, BUILDING_INCOME_GROWTH } from '@/data/buildings'
import { STAFF_TYPES } from '@/data/staff'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { BRANCHES, getBranchDef } from '@/data/branches'
import { SKILL_NODES, SKILL_MAX_LEVEL } from '@/data/skills'
import { upgradeSkill } from './skill-manager'
import { purchaseRoyalBuilding, canUpgradeRoyalSkill, upgradeRoyalSkill, canRoyalPrestige, getRoyalPrestigeMarks, doRoyalPrestige, getRoyalAffordableLevels } from './royal-manager'
import { sovereignManager } from './sovereign-manager'
import { ROYAL_BUILDINGS } from '@/data/royal-buildings'
import { formatNumber } from './format'
import { TRAIT_EFFECTS } from '@/data/traits'
import type { BranchId, SkillTreeState, BranchState, AssassinEntry, SupplyRouteType } from '@/types'

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
  private inactiveBranchIdx = 0

  start(): void {
    if (this.running) return
    this.running = true
    this._consecutiveErrors = 0
    this.wasGameLoopRunning = gameLoop.isRunning()
    if (this.wasGameLoopRunning) {
      gameLoop.stop()
    }
    setSuppressUIEvents(true)
    this.logAction('Autoplay started')
    eventBus.emit('autoplay:started')
    this.scheduleInterval()
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
    this.running = false
    setSuppressUIEvents(false)
    if (this.wasGameLoopRunning) {
      gameLoop.start()
    }
    this.logAction('Autoplay stopped')
    eventBus.emit('autoplay:stopped')
    eventBus.emit('income:update')
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
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
    const ticksPerInterval = this.speed >= 100 ? Math.floor(this.speed / 100) : 1
    const intervalMs = this.speed >= 100 ? 10 : Math.floor(1000 / this.speed)
    const runBatch = () => {
      if (!this.running) return
      try {
        for (let i = 0; i < ticksPerInterval; i++) {
          this.tick()
        }
        this.flushLogs()
        eventBus.emit('income:tick', { income: getBranchIncomePerSecond() })
        this._consecutiveErrors = 0
      } catch (err) {
        console.error('Autoplay tick error:', err)
        this.logAction('⚠ Tick error — continuing')
        this._consecutiveErrors++
        if (this._consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
          console.error('Autoplay stopped after ' + this.MAX_CONSECUTIVE_ERRORS + ' consecutive errors')
          this.logAction('⚠ Autoplay stopped — too many consecutive errors')
          this.stop()
          return
        }
      } finally {
        if (this.running) {
          this.intervalId = window.setTimeout(runBatch, intervalMs)
        }
      }
    }
    this.intervalId = window.setTimeout(runBatch, intervalMs)
  }

  private logAction(message: string): void {
    this.log.unshift({ time: Date.now(), message })
    if (this.log.length > this.maxLogSize) {
      this.log = this.log.slice(0, this.maxLogSize)
    }
    this._pendingLogEmit = true
  }

  private _pendingLogEmit = false
  private _lastLogFlush = 0
  private _consecutiveErrors = 0
  private readonly MAX_CONSECUTIVE_ERRORS = 10

  private flushLogs(): void {
    if (!this._pendingLogEmit) return
    const now = Date.now()
    if (now - this._lastLogFlush < 100) return
    this._lastLogFlush = now
    this._pendingLogEmit = false
    eventBus.emit('autoplay:log', this.log[0]?.message || '')
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
    if (this.tickCount % 5 === 0) {
      tickTakeoverProgress()
      tickSupplyRoutes()
      tickAIOwners(this.tickCount)
    }

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
      const goldStandardMult = branch.upgrades.includes('goldStandard') ? 1.5 : 1
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
    const phase = this.assessGamePhase()

    // 1. Free actions — always first, no cost
    this.autoResolveEvent()
    this.confirmStaffLevelUps()
    this.confirmAssassinLevelUps()

    // 2. Defensive check — handle threats before spending
    this.handleDefense(phase)

    // 3. Switch to best branch for current strategy
    this.switchToBestBranchForPhase(phase)

    // 4. Phase-dependent priority spending
    if (phase === 'rush') {
      // Early game: maximize prestige speed
      this.buyBuildings()
      this.hireAndAssignStaff()
      this.reassignStaff()
      this.upgradeSkills()
      this.upgradeRoyalSkills()
      this.purchaseRoyalBuildings()
      this.doRoyalPrestigeIfWorth()
      this.issueDecreeIfAvailable()
      this.doPrestigeIfWorth()
    } else if (phase === 'expand') {
      // Mid game: unlock & conquer branches
      this.initiateTakeovers()
      this.purchaseUpgrades()
      this.hireAndAssignAssassins()
      this.hireAndAssignStaff()
      this.buyBuildings()
      this.reassignStaff()
      this.manageInactiveBranches()
      this.manageSupplyRoutes()
      this.manageDebts()
      this.upgradeSkills()
      this.upgradeRoyalSkills()
      this.purchaseRoyalBuildings()
      this.doRoyalPrestigeIfWorth()
      this.issueDecreeIfAvailable()
      this.doPrestigeIfWorth()
    } else {
      // Late game: conquer everything
      this.initiateTakeovers()
      this.hireAndAssignAssassins()
      this.purchaseUpgrades()
      this.hireAndAssignStaff()
      this.buyBuildings()
      this.reassignStaff()
      this.manageInactiveBranches()
      this.manageSupplyRoutes()
      this.manageDebts()
      this.upgradeSkills()
      this.upgradeRoyalSkills()
      this.purchaseRoyalBuildings()
      this.doRoyalPrestigeIfWorth()
      this.issueDecreeIfAvailable()
      this.doPrestigeIfWorth()
    }
  }

  private assessGamePhase(): 'rush' | 'expand' | 'conquer' {
    const state = gameState.get()
    const conquered = state.worldMap.conqueredBranches.length
    const unlocked = state.worldMap.unlockedBranches.length
    const total = BRANCHES.length
    const takeoverTargets = BRANCHES.filter(t => canInitiateTakeover(t.id)).length

    if (state.totalPrestige < 5 || unlocked <= 2) return 'rush'
    if (conquered < total * 0.5 || takeoverTargets > 0) return 'expand'
    return 'conquer'
  }

  private handleDefense(phase: 'rush' | 'expand' | 'conquer'): void {
    const state = gameState.get()

    for (const branchId of state.worldMap.unlockedBranches) {
      const branch = state.branches[branchId]
      if (!branch) continue

      // 1. Heat management — high heat triggers raids & bad events
      if (branch.heatLevel >= 7) {
        const hasSamurai = Object.values(branch.assassins).some(a => a.typeId === 'streetSamurai' && a.assignedBranch === branchId)
        if (!hasSamurai && phase !== 'rush') {
          this.logAction(`⚠ ${getBranchDef(branchId).name} heat critical (${branch.heatLevel}/10) — needs Street Samurai`)
        }
      }

      // 2. Income freeze check — if frozen, prioritize Enforcer hiring
      const isFrozen = state.activeBuffs.some(b =>
        b.type === 'incomeFreeze' &&
        (b.branchId === null || b.branchId === branchId) &&
        (b.expiresAt === null || b.expiresAt > Date.now())
      )
      if (isFrozen && !hasEnforcer(branchId) && !hasHighTableEnforcer(branchId)) {
        this.logAction(`⚠ ${getBranchDef(branchId).name} income frozen — need Enforcer`)
      }

      // 3. Excommunicado grace — don't prestige during grace
      if (Date.now() < branch.excommunicadoGraceUntil && branchId === state.activeBranch) {
        // Skip prestige for this branch — grace period active
      }

      // 4. Debt urgency — if debt > 50% of currency, flag it
      const debt = getTotalDebt(branchId)
      if (debt > branch.currency * 0.5 && debt > 0) {
        if (branch.currency >= debt) {
          repayAllDebts(branchId)
          this.logAction(`⚠ Emergency debt repayment in ${getBranchDef(branchId).name}`)
        }
      }

      // 5. Low loyalty assassins — recall from attack if loyalty critical
      Object.values(branch.assassins).forEach(a => {
        if (a.loyalty < 10 && a.attackTarget) {
          cancelAssassinAttack(a.id, branchId)
          this.logAction(`⚠ Assassin loyalty critical (${a.loyalty.toFixed(0)}) — pulled back from attack`)
        }
      })
    }
  }

  private switchToBestBranchForPhase(phase: 'rush' | 'expand' | 'conquer'): void {
    const state = gameState.get()
    let bestBranch: BranchId = state.activeBranch
    let bestScore = -Infinity

    state.worldMap.unlockedBranches.forEach(branchId => {
      const branch = state.branches[branchId]
      if (!branch) return
      const income = getBranchIncomePerSecond(branchId)
      const debt = getTotalDebt(branchId)
      const favor = getPrestigeFavor(branchId)
      const isFrozen = state.activeBuffs.some(b =>
        b.type === 'incomeFreeze' &&
        (b.branchId === null || b.branchId === branchId) &&
        (b.expiresAt === null || b.expiresAt > Date.now())
      )
      const effectiveIncome = isFrozen ? 0 : income

      let score: number
      if (phase === 'rush') {
        // Maximize prestige speed: income + favor potential
        score = effectiveIncome * 10 + branch.currency + favor * 5000
      } else if (phase === 'expand') {
        // Balance income + takeover funding capability
        score = effectiveIncome * 10 + branch.currency - debt * 0.5 + favor * 1000
      } else {
        // Late game: maximize income for assassin funding
        score = effectiveIncome * 20 + branch.currency - debt * 0.3
      }

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

  private autoResolveEvent(): void {
    const active = eventEngine.getActiveEvent()
    if (!active) return
    const choices = active.definition.choices

    // Smart event resolution: evaluate each choice by net benefit
    const evaluated = choices.map(c => {
      let score = 0
      if (c.isBest) score += 100
      if (c.isSafe) score += 50
      // Positive reputation is good
      if (c.reputationChange > 0) score += c.reputationChange * 2
      if (c.reputationChange < 0) score -= Math.abs(c.reputationChange)
      // Heat reduction is good (defensive)
      if (c.heatChange && c.heatChange < 0) score += Math.abs(c.heatChange) * 5
      if (c.heatChange && c.heatChange > 0) score -= c.heatChange * 3
      // Penalties are bad
      score -= c.penalties.length * 10
      // Rewards are good
      score += c.rewards.length * 10
      // If choice requires assassin and we don't have one, skip
      if (c.requires?.assassinAssigned) {
        const branch = gameState.get().branches[active.branch]
        const hasDefender = branch && Object.values(branch.assassins).some(a =>
          a.assignedBranch === active.branch &&
          !a.lentTo &&
          a.attackTarget === null &&
          a.loyalty >= 30
        )
        if (!hasDefender) score -= 1000
      }
      return { choice: c, score }
    }).sort((a, b) => b.score - a.score)

    const preferred = evaluated[0]?.choice
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

  private buyBuildings(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branch = state.branches[targetBranch || state.activeBranch]
    if (!branch) return

    const reserve = this.calculateReserve()

    // Build list of purchasable buildings with ROI
    const candidates = BUILDINGS.filter(def => {
      const bState = branch.buildings[def.id]
      return bState && bState.unlocked && bState.level < def.maxLevel
    }).map(def => {
      const bState = branch.buildings[def.id]!
      const cost = getBuildingCost(branch, def.id, 1)
      const currentIncome = def.baseRate * Math.pow(BUILDING_INCOME_GROWTH, bState.level)
      const nextIncome = def.baseRate * Math.pow(BUILDING_INCOME_GROWTH, bState.level + 1)
      const incomeGain = nextIncome - currentIncome
      const roi = cost > 0 ? incomeGain / cost : Infinity
      const unlocksNext = this.checkUnlocksNext(def.id, bState.level)
      return { def, bState, cost, roi, unlocksNext }
    })

    // Sort: buildings that unlock others first, then by ROI
    candidates.sort((a, b) => {
      if (a.unlocksNext && !b.unlocksNext) return -1
      if (!a.unlocksNext && b.unlocksNext) return 1
      return b.roi - a.roi
    })

    // Buy 1 level at a time, respecting reserve
    // Only apply reserve if branch has enough currency to save meaningfully
    const effectiveReserve = branch.currency >= reserve ? reserve : 0
    for (const c of candidates) {
      if (c.cost > branch.currency - effectiveReserve) continue
      const ok = purchaseBuilding(c.def.id, 1)
      if (ok) {
        this.logAction(`Bought ${c.def.name} → lvl ${c.bState.level}`)
      }
    }
  }

  private calculateReserve(): number {
    const state = gameState.get()
    const branch = state.branches[state.activeBranch]
    if (!branch) return 0

    let reserve = 0

    // Reserve for cheapest unpurchased upgrade
    const nextUpgrade = UPGRADES
      .filter(u => !branch.upgrades.includes(u.id))
      .sort((a, b) => a.cost - b.cost)[0]
    if (nextUpgrade) {
      reserve = Math.max(reserve, nextUpgrade.cost * 0.5)
    }

    // Reserve for cheapest available takeover
    for (const def of BRANCHES) {
      if (!canInitiateTakeover(def.id)) continue
      const cost = getTakeoverCost(def.id)
      reserve = Math.max(reserve, cost * 0.3)
      break
    }

    // Reserve for staff hiring
    for (const def of STAFF_TYPES) {
      if (!isStaffUnlocked(def.id)) continue
      if (Object.values(branch.staff).some(s => s.typeId === def.id)) continue
      reserve = Math.max(reserve, def.hireCost)
      break
    }

    return reserve
  }

  private checkUnlocksNext(buildingId: string, currentLevel: number): boolean {
    for (const def of BUILDINGS) {
      if (def.unlock.startsWith('building:')) {
        const parts = def.unlock.split(':')
        const reqBuilding = parts[1]
        const reqLevel = parseInt(parts[2], 10) || 1
        if (reqBuilding === buildingId && currentLevel + 1 === reqLevel) {
          return true
        }
      }
    }
    return false
  }

  private manageInactiveBranches(): void {
    const state = gameState.get()
    const activeId = state.activeBranch
    const inactiveBranches = state.worldMap.unlockedBranches.filter(id => id !== activeId)
    if (inactiveBranches.length === 0) return

    // Rotate — one inactive branch per decision cycle
    const branchId = inactiveBranches[this.inactiveBranchIdx % inactiveBranches.length]
    this.inactiveBranchIdx++

    const branch = state.branches[branchId]
    if (!branch) return

    // Temporarily switch activeBranch so engine functions operate on the target branch
    state.activeBranch = branchId
    try {
      this.confirmStaffLevelUps(branchId)
      this.confirmAssassinLevelUps(branchId)
      this.buyBuildings(branchId)
      this.hireAndAssignStaff(branchId)
      this.reassignStaff(branchId)
      this.purchaseUpgrades(branchId)
    } finally {
      state.activeBranch = activeId
    }
  }

  private manageDebts(): void {
    const state = gameState.get()

    // Check all unlocked branches for debts
    for (const branchId of state.worldMap.unlockedBranches) {
      const branch = state.branches[branchId]
      if (!branch) continue
      const totalDebt = getTotalDebt(branchId)
      if (totalDebt <= 0) continue

      // Repay if we have 2x the debt amount (keep some currency for operations)
      if (branch.currency >= totalDebt * 2) {
        const ok = repayAllDebts(branchId)
        if (ok) {
          this.logAction(`Repaid all debts in ${getBranchDef(branchId).name} (${formatNumber(totalDebt)})`)
        }
      }
    }
  }

  private manageSupplyRoutes(): void {
    const state = gameState.get()
    const unlocked = state.worldMap.unlockedBranches
    if (unlocked.length < 2) return

    const routes = getSupplyRoutes()

    // Stabilize routes below 40%
    for (const route of routes) {
      if (route.stability < 40) {
        const cost = getStabilizeCost(route.id)
        const branch = state.branches[route.from]
        if (branch && branch.currency >= cost) {
          stabilizeRoute(route.id)
          this.logAction(`Stabilized supply route ${getBranchDef(route.from)?.name} → ${getBranchDef(route.to)?.name}`)
        }
      }
    }

    // Try to establish new routes from branches with surplus currency
    const types: SupplyRouteType[] = ['luxury', 'contraband', 'weapons']
    for (const fromId of unlocked) {
      const fromBranch = state.branches[fromId]
      if (!fromBranch) continue
      const existingCount = routes.filter(r => r.from === fromId).length
      if (existingCount >= 3) continue

      // Pick a target branch — prefer the one furthest away for thematic feel
      const targets = unlocked.filter(t => t !== fromId)
      if (targets.length === 0) continue

      for (const type of types) {
        if (canEstablishRoute(fromId, targets[0], type)) {
          establishRoute(fromId, targets[0], type)
          this.logAction(`Established ${type} route: ${getBranchDef(fromId)?.name} → ${getBranchDef(targets[0])?.name}`)
          break
        }
      }
    }

    // Attempt hijack if we have idle assassins and hijackable routes
    const hijackable = getHijackableRoutes()
    for (const route of hijackable) {
      if (canHijackRoute(route.id)) {
        const result = hijackRoute(route.id)
        if (result.success) {
          this.logAction(`Hijacked supply route from ${getBranchDef(route.from)?.name}`)
        }
        break
      }
    }
  }

  private hireAndAssignStaff(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branch = state.branches[targetBranch || state.activeBranch]
    if (!branch) return

    const baseStaffCap = 5
    const maxStaff = baseStaffCap + getExtraStaffSlots()

    if (Object.keys(branch.staff).length < maxStaff) {
      // Evaluate each staff type by strategic value
      const branchIdResolved = targetBranch || state.activeBranch
      const candidates = STAFF_TYPES
        .filter(def => isStaffUnlocked(def.id, branchIdResolved) && branch.currency >= def.hireCost)
        .filter(def => !Object.values(branch.staff).some(s => s.typeId === def.id))
        .map(def => {
          const coverage = def.bestMatch.filter(bId => {
            const bs = branch.buildings[bId]
            return bs && bs.unlocked && bs.level > 0
          }).length
          // Defensive value: cleaner negates negative events, concierge gives passive income
          let defensiveValue = 0
          if (def.id === 'cleaner' && branch.heatLevel >= 5) defensiveValue = 100
          if (def.id === 'bartender' && !hasEnforcer(targetBranch || state.activeBranch)) defensiveValue = 50
          if (def.id === 'adjudicator') defensiveValue = 80 // prestige reputation retention
          const score = coverage * 100 + defensiveValue - def.hireCost * 0.0001
          return { def, score }
        })
        .sort((a, b) => b.score - a.score)

      for (const { def } of candidates) {
        if (Object.keys(branch.staff).length >= maxStaff) break
        const hired = hireStaff(def.id, branchIdResolved)
        if (hired) {
          const traitInfo = this.summarizeTraits(hired.traits)
          this.logAction(`Hired ${def.name}${traitInfo}`)
        }
      }
    }

    // Assign all unassigned staff using trait-aware optimal assignment
    const branchIdForAssign = targetBranch || state.activeBranch
    const unassigned = Object.values(branch.staff).filter(s => s.assignedTo === null)
    for (const staff of unassigned) {
      this.assignStaffOptimally(staff.id, branch, branchIdForAssign)
    }
  }

  private summarizeTraits(traits: string[]): string {
    if (traits.length === 0) return ''
    const good = traits.filter(t => {
      const eff = TRAIT_EFFECTS[t]
      return eff && (eff.incomeMult && eff.incomeMult > 1 || eff.xpMult && eff.xpMult > 1 || eff.negativeEventProtection)
    })
    const bad = traits.filter(t => {
      const eff = TRAIT_EFFECTS[t]
      return eff && (eff.incomeMult && eff.incomeMult < 1 || eff.xpMult && eff.xpMult < 1 || eff.costMult && eff.costMult > 1)
    })
    let s = ''
    if (good.length > 0) s += ` ★${good.join(',')}`
    if (bad.length > 0) s += ` ✗${bad.join(',')}`
    return s
  }

  private assignStaffOptimally(staffId: string, branch: BranchState, branchId: BranchId): void {
    const staff = branch.staff[staffId]
    if (!staff) return
    const def = STAFF_TYPES.find(s => s.id === staff.typeId)
    if (!def) return

    // Find matching buildings that are unlocked and have level > 0
    const matchingBuildings = def.bestMatch
      .map(bId => {
        const bState = branch.buildings[bId]
        if (!bState || !bState.unlocked || bState.level === 0) return null
        const income = getBuildingIncome(branch, bId)
        return { bId, income }
      })
      .filter((x): x is { bId: string, income: number } => x !== null)
      .sort((a, b) => b.income - a.income)

    if (matchingBuildings.length > 0) {
      assignStaff(staffId, matchingBuildings[0].bId, branchId)
      const bldgDef = BUILDINGS.find(b => b.id === matchingBuildings[0].bId)
      this.logAction(`Assigned ${def.name} to ${bldgDef?.name || matchingBuildings[0].bId}`)
      return
    }

    // Fallback: any building with income
    const anyBuildings = BUILDINGS
      .map(b => {
        const bState = branch.buildings[b.id]
        if (!bState || !bState.unlocked || bState.level === 0) return null
        return { bId: b.id, income: getBuildingIncome(branch, b.id) }
      })
      .filter((x): x is { bId: string, income: number } => x !== null)
      .sort((a, b) => b.income - a.income)

    if (anyBuildings.length > 0) {
      assignStaff(staffId, anyBuildings[0].bId, branchId)
      const bldgDef = BUILDINGS.find(b => b.id === anyBuildings[0].bId)
      this.logAction(`Assigned ${def.name} to ${bldgDef?.name || anyBuildings[0].bId}`)
    }
  }

  private reassignStaff(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branch = state.branches[targetBranch || state.activeBranch]
    if (!branch) return

    // Check if any staff could be reassigned to a better building
    const staffList = Object.values(branch.staff)
    for (const staff of staffList) {
      if (!staff.assignedTo) continue
      const def = STAFF_TYPES.find(s => s.id === staff.typeId)
      if (!def) continue

      // Is current assignment a bestMatch?
      const isBestMatch = def.bestMatch.includes(staff.assignedTo)
      if (isBestMatch) continue

      // Is there a betterMatch building available?
      const betterBuilding = def.bestMatch.find(bId => {
        const bState = branch.buildings[bId]
        return bState && bState.unlocked && bState.level > 0
      })

      if (betterBuilding) {
        const branchIdForAssign = targetBranch || state.activeBranch
        assignStaff(staff.id, betterBuilding, branchIdForAssign)
        const bldgDef = BUILDINGS.find(b => b.id === betterBuilding)
        this.logAction(`Reassigned ${def.name} to ${bldgDef?.name || betterBuilding}`)
      }
    }
  }

  private confirmStaffLevelUps(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branch = state.branches[targetBranch || state.activeBranch]
    if (!branch) return

    const branchIdForLevelUp = targetBranch || state.activeBranch
    Object.values(branch.staff).forEach(staff => {
      if (staff.pendingLevelUp) {
        const ok = confirmLevelUp(staff.id, branchIdForLevelUp)
        if (ok) {
          const def = STAFF_TYPES.find(s => s.id === staff.typeId)
          this.logAction(`Staff ${def?.name || staff.typeId} leveled up to ${staff.level}`)
        }
      }
    })
  }

  private hireAndAssignAssassins(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branchId = targetBranch || state.activeBranch
    const branch = state.branches[branchId]
    if (!branch) return
    if (state.totalPrestige < 3) return

    const assassinCap = branch.upgrades.includes('armoryExpansion') ? 4 : 3

    if (Object.keys(branch.assassins).length < assassinCap) {
      // Strategic hiring: assess what threats exist and hire accordingly
      const threats = this.assessThreats(branchId)
      const affordable = ASSASSIN_TYPES
        .filter(def => isAssassinUnlocked(def.id, branchId) && branch.currency >= def.hireCost)
        .filter(def => !Object.values(branch.assassins).some(a => a.typeId === def.id))
        .map(def => {
          let score = 0
          // Enforcer: critical if income freezes are happening
          if (def.id === 'enforcer') score = threats.incomeFreezeRisk ? 1000 : 100
          // High Table Enforcer: best defensive unit, prevents excommunicado
          if (def.id === 'highTableEnforcer') score = threats.excommunicadoRisk ? 900 : 200
          // Royal Guard: debt reduction
          if (def.id === 'royalGuard') score = threats.debtBurden ? 500 : 50
          // Street Samurai: heat reduction
          if (def.id === 'streetSamurai') score = threats.heatLevel >= 5 ? 400 : 80
          // Shadow Blade: reputation boost
          if (def.id === 'shadowBlade') score = 150
          // Penalize expensive hires in rush phase
          score -= def.hireCost * 0.00001
          return { def, score }
        })
        .sort((a, b) => b.score - a.score)

      for (const { def } of affordable) {
        if (Object.keys(branch.assassins).length >= assassinCap) break
        const hired = hireAssassin(def.id, branchId)
        if (hired) {
          const traitInfo = this.summarizeTraits(hired.traits)
          this.logAction(`Hired ${def.name}${traitInfo}`)
        }
      }
    }

    // Assign all unassigned assassins
    Object.values(branch.assassins).forEach(assassin => {
      if (!assassin.assignedBranch) {
        assignAssassin(assassin.id, branchId)
      }
    })
  }

  private assessThreats(branchId: BranchId): {
    heatLevel: number
    incomeFreezeRisk: boolean
    excommunicadoRisk: boolean
    debtBurden: boolean
  } {
    const state = gameState.get()
    const branch = state.branches[branchId]
    if (!branch) return { heatLevel: 0, incomeFreezeRisk: false, excommunicadoRisk: false, debtBurden: false }

    const isFrozen = state.activeBuffs.some(b =>
      b.type === 'incomeFreeze' &&
      (b.branchId === null || b.branchId === branchId) &&
      (b.expiresAt === null || b.expiresAt > Date.now())
    )
    const debt = getTotalDebt(branchId)

    return {
      heatLevel: branch.heatLevel,
      incomeFreezeRisk: isFrozen || branch.heatLevel >= 6,
      excommunicadoRisk: branch.heatLevel >= 8 && !hasHighTableEnforcer(branchId),
      debtBurden: debt > branch.currency * 0.3,
    }
  }

  private confirmAssassinLevelUps(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branch = state.branches[targetBranch || state.activeBranch]
    if (!branch) return

    const branchIdForLevelUp = targetBranch || state.activeBranch
    Object.values(branch.assassins).forEach(assassin => {
      if (assassin.pendingLevelUp) {
        const ok = confirmAssassinLevelUp(assassin.id, branchIdForLevelUp)
        if (ok) {
          const def = ASSASSIN_TYPES.find(a => a.id === assassin.typeId)
          this.logAction(`Assassin ${def?.name || assassin.typeId} leveled up to ${assassin.level}`)
        }
      }
    })
  }

  private initiateTakeovers(): void {
    const state = gameState.get()

    // Strategic target selection: prioritize branches that unlock more continents
    // or have lower prestige requirements (easier to conquer)
    const takeoverTargets = BRANCHES
      .filter(t => canInitiateTakeover(t.id))
      .map(t => ({ def: t, cost: getTakeoverCost(t.id), unlockPrestige: t.unlockPrestige }))
      .sort((a, b) => {
        // Cheaper first = faster expansion
        if (a.cost !== b.cost) return a.cost - b.cost
        return a.unlockPrestige - b.unlockPrestige
      })

    for (const { def, cost } of takeoverTargets) {
      // Find the branch with the most currency that can afford it
      let fundedBy: BranchId | null = null
      let bestCurrency = -1
      for (const branchId of state.worldMap.unlockedBranches) {
        const t = state.branches[branchId]
        if (t && t.currency >= cost && t.currency > bestCurrency) {
          fundedBy = branchId
          bestCurrency = t.currency
        }
      }
      if (!fundedBy) continue

      // Temporarily switch to the funding branch to pay
      const prevActive = state.activeBranch
      state.activeBranch = fundedBy
      let ok = false
      try {
        ok = initiateTakeover(def.id)
      } catch {
        ok = false
      }
      state.activeBranch = prevActive

      if (ok) {
        this.logAction(`Takeover initiated: ${def.name} (funded by ${getBranchDef(fundedBy).name})`)
      }
    }

    // Smart attack assignment: concentrate firepower on closest-to-completion targets
    const activeTargets = BRANCHES.map(t => {
      const targetBranch = state.branches[t.id]
      if (!targetBranch) return null
      if (targetBranch.aiOwnerDefeated) return null
      if (targetBranch.hqHealth <= 0) return null
      if (state.worldMap.unlockedBranches.includes(t.id)) return null
      if (state.worldMap.conqueredBranches.includes(t.id)) return null
      if (targetBranch.hqHealth >= targetBranch.hqMaxHealth) return null
      const hpPercent = targetBranch.hqHealth / targetBranch.hqMaxHealth
      return { def: t, hpPercent, hqHealth: targetBranch.hqHealth }
    }).filter((x): x is { def: typeof BRANCHES[0], hpPercent: number, hqHealth: number } => x !== null)
      .sort((a, b) => a.hpPercent - b.hpPercent)

    if (activeTargets.length === 0) return

    // Collect all available assassins across all branches
    const allAvailable: { assassin: AssassinEntry, sourceBranchId: BranchId, damage: number }[] = []
    state.worldMap.unlockedBranches.forEach(sourceBranchId => {
      const sourceBranch = state.branches[sourceBranchId]
      if (!sourceBranch) return
      Object.values(sourceBranch.assassins)
        .filter(a => !a.attackTarget && a.loyalty >= 20 && a.assignedBranch === sourceBranchId)
        .forEach(assassin => {
          allAvailable.push({ assassin, sourceBranchId, damage: getAssassinCombatDamage(assassin) })
        })
    })

    // Sort assassins by damage (strongest first)
    allAvailable.sort((a, b) => b.damage - a.damage)

    // Focus fire: send all assassins to the target closest to completion
    // Only split if the first target will be finished this tick
    for (const { assassin, sourceBranchId } of allAvailable) {
      // Find the target with lowest HP that this assassin can contribute to
      const target = activeTargets.find(t => {
        const targetBranch = state.branches[t.def.id]
        return targetBranch && targetBranch.hqHealth > 0
      })

      if (target) {
        // Don't send if loyalty is too low — keep for defense
        if (assassin.loyalty < 30 && this.assessThreats(sourceBranchId).heatLevel >= 5) {
          continue
        }
        sendAssassinToAttack(assassin.id, target.def.id, sourceBranchId)
        this.logAction(`Sent assassin from ${getBranchDef(sourceBranchId).name} to attack ${target.def.name} (HP: ${Math.ceil(target.hqHealth)})`)
      }
    }
  }

  private purchaseUpgrades(targetBranch?: BranchId): void {
    const state = gameState.get()
    const branchId = targetBranch || state.activeBranch
    const branch = state.branches[branchId]
    if (!branch) return

    // Priority: unlock upgrades first, then income boosters
    const priority = ['privateWing', 'armoryExpansion', 'continentalCharter', 'trainingGrounds', 'goldStandard', 'diplomaticChannels']

    const prevActive = state.activeBranch
    if (targetBranch && targetBranch !== prevActive) {
      state.activeBranch = targetBranch
    }

    try {
      for (const id of priority) {
        if (branch.upgrades.includes(id)) continue
        const def = UPGRADES.find(u => u.id === id)
        if (!def) continue
        if (branch.currency < def.cost) continue
        const ok = purchaseUpgrade(id)
        if (ok) {
          this.logAction(`Purchased upgrade: ${def.name}`)
        }
      }
    } finally {
      if (targetBranch && targetBranch !== prevActive) {
        state.activeBranch = prevActive
      }
    }
  }

  private upgradeSkills(): void {
    const state = gameState.get()
    // Priority: commerce (income) > ascension (favor) > personnel (staff) > shadow (debt) > diplomacy (rep)
    const priority: (keyof SkillTreeState)[] = ['commerce', 'ascension', 'personnel', 'shadow', 'diplomacy']

    for (const branch of priority) {
      const currentLevel = state.skillTree[branch]
      if (currentLevel >= SKILL_MAX_LEVEL) continue
      const node = SKILL_NODES.find(n => n.branch === branch && n.level === currentLevel + 1)
      if (!node) continue
      if (state.tableFavor < node.favorCost) continue
      const ok = upgradeSkill(branch)
      if (ok) {
        this.logAction(`Upgraded skill: ${branch} → ${currentLevel + 1}`)
      }
    }
  }

  private upgradeRoyalSkills(): void {
    const state = gameState.get()
    if (state.worldMap.royalBranches.length === 0) return
    const priority = ['royalIncome', 'royalAscension', 'royalFavor', 'royalLoyalty', 'royalPower'] as const
    for (const branch of priority) {
      if (!canUpgradeRoyalSkill(branch)) continue
      const ok = upgradeRoyalSkill(branch)
      if (ok) {
        const level = state.royalSkillTree[branch as keyof typeof state.royalSkillTree]
        this.logAction(`Upgraded royal skill: ${branch} → ${level}`)
      }
    }
  }

  private purchaseRoyalBuildings(): void {
    const state = gameState.get()
    const royalBranches = state.worldMap.royalBranches
    if (royalBranches.length === 0) return

    const prevActive = state.activeBranch
    for (const branchId of royalBranches) {
      const branch = state.branches[branchId]
      if (!branch) continue
      state.activeBranch = branchId
      for (const def of ROYAL_BUILDINGS) {
        const bState = branch.royalBuildings?.[def.id]
        const currentLevel = bState?.level || 0
        if (currentLevel >= def.maxLevel) continue
        const affordable = getRoyalAffordableLevels(branch, def.id)
        if (affordable <= 0) continue
        const ok = purchaseRoyalBuilding(def.id, Math.min(affordable, 10))
        if (ok) {
          this.logAction(`Purchased ${def.name} x${Math.min(affordable, 10)} in ${getBranchDef(branchId).name}`)
        }
      }
    }
    state.activeBranch = prevActive
  }

  private doRoyalPrestigeIfWorth(): void {
    if (!canRoyalPrestige()) return
    const marks = getRoyalPrestigeMarks()
    if (marks <= 0) return
    const ok = doRoyalPrestige()
    if (ok) {
      this.logAction(`Royal Prestige! +${marks} Royal Marks`)
    }
  }

  private issueDecreeIfAvailable(): void {
    if (!sovereignManager.isSovereign()) return
    if (!sovereignManager.canIssueDecree()) return
    const choices = sovereignManager.getDecreeChoices()
    if (choices.length === 0) return
    // Prioritize: permanentIncomeBonus (permanent) > incomeMultiplier (highest value) > heatReduction > debtReduction > loyaltyBoost
    const priority: Record<string, number> = { permanentIncomeBonus: 5, incomeMultiplier: 4, heatReduction: 3, debtReduction: 2, loyaltyBoost: 1 }
    const best = [...choices].sort((a, b) => {
      const pa = priority[a.type] ?? 0
      const pb = priority[b.type] ?? 0
      if (pa !== pb) return pb - pa
      return b.value - a.value
    })[0]
    const ok = sovereignManager.issueDecree(best)
    if (ok) {
      this.logAction(`Issued decree: ${best.name}`)
    }
  }

  private doPrestigeIfWorth(): void {
    const state = gameState.get()

    // Find best prestige candidate across ALL BRANCHES
    let bestBranch: BranchId | null = null
    let bestFavor = 0

    for (const branchId of state.worldMap.unlockedBranches) {
      // Skip branches in excommunicado grace
      const branch = state.branches[branchId]
      if (!branch) continue
      if (Date.now() < branch.excommunicadoGraceUntil) continue

      const favor = getPrestigeFavor(branchId)
      if (favor > bestFavor) {
        bestFavor = favor
        bestBranch = branchId
      }
    }

    if (!bestBranch || bestFavor <= 0) return

    const phase = this.assessGamePhase()

    // Rush phase: prestige ASAP to unlock branches
    if (phase === 'rush') {
      let ok = false
      try {
        ok = doPrestige(bestBranch)
      } catch {
        ok = false
      }
      if (ok) {
        this.logAction(`Prestiged ${getBranchDef(bestBranch).name}! +${bestFavor} favor (total: ${state.tableFavor})`)
      }
      return
    }

    // Expand/Conquer: prestige when plateaued or favor is significant
    const minFavor = Math.max(3, Math.floor(state.tableFavor * 0.1))
    if (bestFavor < minFavor) return

    const branch = state.branches[bestBranch]
    if (!branch) return
    const income = getBranchIncomePerSecond(bestBranch)
    const plateaued = BUILDINGS.every(def => {
      const bState = branch.buildings[def.id]
      if (!bState || !bState.unlocked) return true
      if (bState.level >= def.maxLevel) return true
      if (income <= 0) return false
      const cost = getBuildingCost(branch, def.id, 1)
      return cost > income * 600
    })

    // In conquer phase, prestige more aggressively to fund takeovers
    if (phase === 'conquer') {
      if (bestFavor >= minFavor && (plateaued || bestFavor >= minFavor * 1.5)) {
        let ok = false
        try {
          ok = doPrestige(bestBranch)
        } catch {
          ok = false
        }
        if (ok) {
          this.logAction(`Prestiged ${getBranchDef(bestBranch).name}! +${bestFavor} favor (total: ${state.tableFavor})`)
        }
      }
      return
    }

    // Expand phase: standard prestige logic
    if (!plateaued && bestFavor < minFavor * 2) return

    let ok = false
    try {
      ok = doPrestige(bestBranch)
    } catch {
      ok = false
    }
    if (ok) {
      this.logAction(`Prestiged ${getBranchDef(bestBranch).name}! +${bestFavor} favor (total: ${state.tableFavor})`)
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
