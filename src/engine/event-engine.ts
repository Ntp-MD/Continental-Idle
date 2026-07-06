import type { EventDefinition, BranchId, EventEffect, RaidData, RaidAttacker } from '@/types'
import { EVENTS, EVENT_COOLDOWN } from '@/data/events'
import { hasTraitEffect } from '@/data/traits'
import { hasCleanerMaxed, getVipFrequencyMultiplier } from './abilities'
import { hasHighTableEnforcer, hasShadowBlade, hasStreetSamurai, getAssassinRaidPower, getAssassinXpMult } from './assassin-manager'
import { getTotalReputationMult, getExtraHeatReduction, getTotalBuffDurationMult } from './skill-manager'
import { getRoyalAssassinPowerMult, getRoyalBuffDurationMult } from './royal-manager'
import { sovereignManager } from './sovereign-manager'
import { gameState } from './game-state'
import { getBranchIncomePerSecond } from './income-engine'
import { eventBus } from './event-bus'
import { getActiveAIOwners, generateAIEvent, pickAIEvent, getPlayerPower, improveRelations, worsenRelations } from './ai-owner-manager'
import { getTemperamentDef } from '@/data/ai-owners'

function generateBuffId(): string {
  return 'buff_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function applyEffect(effect: EventEffect, branchId: BranchId): void {
  const state = gameState.get()
  const branch = state.branches[branchId]
  if (!branch) return

  switch (effect.type) {
    case 'incomeMultiplier': {
      const buffDurMult = getTotalBuffDurationMult() * getRoyalBuffDurationMult()
      const multValue = effect.scaling === 'incomePercent'
        ? 1 + effect.value
        : effect.value
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeMultiplier',
        value: multValue,
        expiresAt: effect.duration ? Date.now() + effect.duration * 1000 * buffDurMult : null,
        branchId,
      })
      break
    }
    case 'permanentIncomeBonus': {
      state.permanentIncomeBonus = Math.min(10, state.permanentIncomeBonus + effect.value)
      break
    }
    case 'reputation': {
      branch.reputation = Math.max(0, Math.min(10000, branch.reputation + effect.value))
      break
    }
    case 'incomeFreeze': {
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeFreeze',
        value: 0,
        expiresAt: Date.now() + effect.value * 1000,
        branchId,
      })
      break
    }
  }
}

function applyPenalty(effect: EventEffect, branchId: BranchId): void {
  const state = gameState.get()
  const branch = state.branches[branchId]
  if (!branch) return

  const hasProtection = Object.values(branch.staff).some(s =>
    s.assignedTo !== null && hasTraitEffect(s.traits, 'negativeEventProtection')
  )
  if (hasProtection) return

  // Cleaner max ability: all negative event penalties negated
  if (hasCleanerMaxed(branchId)) return

  switch (effect.type) {
    case 'loseCurrency': {
      if (effect.scaling === 'currencyPercent') {
        branch.currency = Math.max(0, branch.currency * (1 - effect.value))
      } else if (effect.scaling === 'incomePercent') {
        const loss = getBranchIncomePerSecond(branchId) * effect.value
        branch.currency = Math.max(0, branch.currency - loss)
      } else {
        branch.currency = Math.max(0, branch.currency - effect.value)
      }
      break
    }
    case 'markerDebt': {
      const amount = effect.scaling === 'prestigeScaled'
        ? effect.value * (1 + branch.prestige * 0.1)
        : effect.value
      branch.markerDebts.push({
        id: 'debt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        amount,
        originalAmount: amount,
        createdAt: Date.now(),
        branch: branchId,
      })
      break
    }
    case 'incomeFreeze': {
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeFreeze',
        value: 0,
        expiresAt: Date.now() + effect.value * 1000,
        branchId,
      })
      break
    }
    case 'incomeMultiplier': {
      const buffDurMult = getTotalBuffDurationMult() * getRoyalBuffDurationMult()
      const multValue = effect.scaling === 'incomePercent'
        ? Math.max(0, 1 - effect.value)
        : effect.value
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeMultiplier',
        value: multValue,
        expiresAt: effect.duration ? Date.now() + effect.duration * 1000 * buffDurMult : null,
        branchId,
      })
      break
    }
    case 'reputation': {
      branch.reputation = Math.max(0, Math.min(10000, branch.reputation + effect.value))
      break
    }
  }
}

interface ActiveEvent {
  definition: EventDefinition
  triggeredAt: number
  branch: BranchId
  raidData?: RaidData
  aiOwnerBranch?: BranchId | null
}

const RAID_NAMES = ['Phantom', 'Viper', 'Wraith', 'Knell', 'Razor', 'Talon', 'Shade', 'Specter', 'Cipher', 'Echo']
const RAID_COOLDOWN = 120
export const DEFENDER_LOYALTY_THRESHOLD = 30

function generateRaid(branchId: BranchId): RaidData {
  const state = gameState.get()
  const branch = state.branches[branchId]
  if (!branch) return { attackers: [], attackerPower: 0, defenderPower: 0, winChance: 0, defenderCount: 0 }

  const heat = branch.heatLevel
  const prestige = branch.prestige

  const raiderCount = Math.min(3, 1 + Math.floor(heat / 3) + (Math.random() < 0.3 ? 1 : 0))

  const attackers: RaidAttacker[] = []
  let attackerPower = 0

  for (let i = 0; i < raiderCount; i++) {
    const level = Math.max(1, Math.min(10, 1 + Math.floor(prestige * 0.5) + Math.floor(Math.random() * 3)))
    const precision = 3 + Math.floor(Math.random() * (5 + prestige))
    const speed = 3 + Math.floor(Math.random() * (5 + prestige))
    const name = RAID_NAMES[Math.floor(Math.random() * RAID_NAMES.length)] + ' ' + (i + 1)

    const power = level * 5 + precision * 2 + speed * 1
    attackerPower += power
    attackers.push({ name, level, precision, speed })
  }

  const defenders = Object.values(branch.assassins).filter(a =>
    a.assignedBranch === branchId &&
    !a.lentTo &&
    a.attackTarget === null &&
    a.loyalty >= DEFENDER_LOYALTY_THRESHOLD
  )
  // Also count assassins lent TO this branch from other BRANCHES
  state.worldMap.unlockedBranches.forEach(sourceId => {
    if (sourceId === branchId) return
    const sourceBranch = state.branches[sourceId]
    if (!sourceBranch) return
    Object.values(sourceBranch.assassins).forEach(a => {
      if (a.lentTo === branchId && a.loyalty >= DEFENDER_LOYALTY_THRESHOLD) {
        defenders.push(a)
      }
    })
  })

  let defenderPower = 0
  defenders.forEach(a => {
    defenderPower += getAssassinRaidPower(a)
  })
  defenderPower *= getRoyalAssassinPowerMult()

  const winChance = defenderPower > 0
    ? Math.max(0.05, Math.min(0.95, defenderPower / (defenderPower + attackerPower)))
    : 0

  return { attackers, attackerPower, defenderPower, winChance, defenderCount: defenders.length }
}

class EventEngine {
  private lastEventTimes: Map<BranchId, number> = new Map()
  private lastAIEventTimes: Map<BranchId, number> = new Map()
  private lastRaidTimes: Map<BranchId, number> = new Map()
  private activeEvent: ActiveEvent | null = null
  private tickCount = 0

  getActiveEvent(): ActiveEvent | null {
    return this.activeEvent
  }

  hasActiveEvent(): boolean {
    return this.activeEvent !== null
  }

  getRaidData(): RaidData | null {
    return this.activeEvent?.raidData ?? null
  }

  initializeCooldowns(): void {
    const state = gameState.get()
    const now = Date.now() / 1000
    state.worldMap.unlockedBranches.forEach(branchId => {
      this.lastEventTimes.set(branchId, now)
      this.lastAIEventTimes.set(branchId, now)
      this.lastRaidTimes.set(branchId, now)
    })
  }

  checkForEvent(): void {
    if (this.activeEvent) return

    const state = gameState.get()
    const now = Date.now() / 1000
    const lastTime = this.lastEventTimes.get(state.activeBranch) || 0
    if (now - lastTime < EVENT_COOLDOWN) return

    const branch = state.branches[state.activeBranch]
    if (!branch) return

    // Excommunicado grace period
    if (Date.now() < branch.excommunicadoGraceUntil) return

    // Filter eligible events
    const eligible = EVENTS.filter(e => {
      if (e.branchLock && e.branchLock !== state.activeBranch) return false
      // High Table Enforcer prevents excommunicado events
      if (e.id === 'excommunicado' && hasHighTableEnforcer(state.activeBranch)) return false
      // Raid cooldown check — separate from normal event cooldown
      if (e.id === 'assassinRaid') {
        const lastRaid = this.lastRaidTimes.get(state.activeBranch) || 0
        if (now - lastRaid < RAID_COOLDOWN) return false
      }
      if (e.unlockCondition) {
        const cond = e.unlockCondition
        if (cond.type === 'buildingLevel') {
          const bState = branch.buildings[cond.buildingId]
          if (!bState || bState.level < cond.minLevel) return false
        }
        if (cond.type === 'prestige') {
          if (state.totalPrestige < cond.minPrestige) return false
        }
      }
      return true
    })

    if (eligible.length === 0) return

    // Weighted random selection
    const heat = branch.heatLevel
    const vipMult = getVipFrequencyMultiplier(state.activeBranch)
    let totalWeight = 0
    const weighted = eligible.map(e => {
      // Sommelier VIP boost only applies to VIP guest arrival events
      const isVipEvent = e.id === 'vipArrival'
      const w = Math.max(1, (e.weight + e.heatModifier * heat) * (isVipEvent ? vipMult : 1))
      totalWeight += w
      return { event: e, weight: w }
    })

    // Random roll (base probability per tick is low)
    const rollChance = 0.02
    if (Math.random() > rollChance) return

    let roll = Math.random() * totalWeight
    for (const { event, weight } of weighted) {
      roll -= weight
      if (roll <= 0) {
        this.triggerEvent(event)
        return
      }
    }
  }

  private triggerEvent(def: EventDefinition, aiOwnerBranch?: BranchId | null): void {
    const state = gameState.get()
    const raidData = def.id === 'assassinRaid' ? generateRaid(state.activeBranch) : undefined
    this.activeEvent = {
      definition: def,
      triggeredAt: Date.now(),
      branch: state.activeBranch,
      raidData,
      aiOwnerBranch: aiOwnerBranch ?? null,
    }
    this.lastEventTimes.set(state.activeBranch, Date.now() / 1000)
    if (aiOwnerBranch) {
      this.lastAIEventTimes.set(state.activeBranch, Date.now() / 1000)
    }
    if (def.id === 'assassinRaid') {
      this.lastRaidTimes.set(state.activeBranch, Date.now() / 1000)
    }
    eventBus.emit('event:trigger', this.activeEvent)
  }

  resolveEvent(choiceId: string): boolean {
    if (!this.activeEvent) return false

    const state = gameState.get()
    const branch = state.branches[this.activeEvent.branch]
    const choice = this.activeEvent.definition.choices.find(c => c.id === choiceId)

    if (!choice) {
      eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'invalid_choice' })
      return false
    }

    if (!branch) {
      eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'invalid_branch' })
      return false
    }

    const eventBranchId = this.activeEvent.branch

    // Validate choice requirements
    let hasAssassinDefender = false
    if (choice.requires) {
      if (choice.requires.assassinAssigned) {
        hasAssassinDefender = Object.values(branch.assassins).some(a =>
          a.assignedBranch === eventBranchId &&
          !a.lentTo &&
          a.attackTarget === null &&
          a.loyalty >= DEFENDER_LOYALTY_THRESHOLD
        )
        if (!hasAssassinDefender) {
          eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'requirements' })
          return false
        }
      }
      if (choice.requires.staffType) {
        const hasRequired = Object.values(branch.staff).some(s => {
          if (s.typeId !== choice.requires!.staffType) return false
          if (choice.requires!.minLevel && s.level < choice.requires!.minLevel) return false
          if (s.assignedTo === null) return false
          return true
        })
        if (!hasRequired) {
          eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'requirements' })
          return false
        }
      }
    }

    // Apply reputation change (Shadow Blade doubles reputation gain, diplomacy skill adds %)
    // Only amplify positive changes — penalties should not be worsened by bonuses
    const repMult = choice.reputationChange > 0 && hasShadowBlade(eventBranchId) ? 2 : 1
    const skillRepMult = choice.reputationChange > 0 ? getTotalReputationMult() : 1
    const repChange = Math.round(choice.reputationChange * repMult * skillRepMult)
    branch.reputation = Math.max(0, Math.min(10000, branch.reputation + repChange))

    // Special combat resolution for assassinRaid fight choice
    let raidWon = false
    if (this.activeEvent.definition.id === 'assassinRaid' && choiceId === 'fight' && this.activeEvent.raidData) {
      const raid = this.activeEvent.raidData
      raidWon = Math.random() < raid.winChance
      const defenders = Object.values(branch.assassins).filter(a =>
        a.assignedBranch === eventBranchId &&
        !a.lentTo &&
        a.attackTarget === null &&
        a.loyalty >= DEFENDER_LOYALTY_THRESHOLD
      )
      // Also include assassins lent TO this branch from other BRANCHES
      state.worldMap.unlockedBranches.forEach(sourceId => {
        if (sourceId === eventBranchId) return
        const sourceBranch = state.branches[sourceId]
        if (!sourceBranch) return
        Object.values(sourceBranch.assassins).forEach(a => {
          if (a.lentTo === eventBranchId && a.loyalty >= DEFENDER_LOYALTY_THRESHOLD) {
            defenders.push(a)
          }
        })
      })

      if (raidWon) {
        const spoilsCurrency = raid.attackerPower * 1000 * (1 + branch.prestige * 0.1)
        branch.currency += spoilsCurrency
        branch.lifetimeEarnings += spoilsCurrency
        branch.reputation = Math.max(0, Math.min(10000, branch.reputation + 15))
        branch.guestSatisfaction = Math.min(100, branch.guestSatisfaction + 5)
        defenders.forEach(a => { a.xp += 50 * getAssassinXpMult(a) })
        eventBus.emit('raid:result', { won: true, spoilsCurrency, branchId: eventBranchId })
      } else {
        branch.currency = Math.max(0, branch.currency * 0.9)
        branch.reputation = Math.max(0, branch.reputation - 10)
        branch.guestSatisfaction = Math.max(0, branch.guestSatisfaction - 5)
        defenders.forEach(a => { a.loyalty = Math.max(0, a.loyalty - 15) })
        state.activeBuffs.push({
          id: generateBuffId(),
          type: 'incomeFreeze',
          value: 0,
          expiresAt: Date.now() + 30 * 1000,
          branchId: eventBranchId,
        })
        eventBus.emit('raid:result', { won: false, branchId: eventBranchId })
      }
    } else {
      // Apply rewards
      choice.rewards.forEach(r => applyEffect(r, eventBranchId))

      // Apply penalties
      choice.penalties.forEach(p => applyPenalty(p, eventBranchId))

      // Special: markerForgiveness — clear cheapest debt on accept
      if (this.activeEvent.definition.id === 'markerForgiveness' && choiceId === 'accept') {
        if (branch.markerDebts.length > 0) {
          const cheapest = branch.markerDebts.reduce((min, d) => d.amount < min.amount ? d : min, branch.markerDebts[0])
          branch.markerDebts = branch.markerDebts.filter(d => d.id !== cheapest.id)
        }
      }
    }

    // Guest satisfaction: resolving events improves it slightly (skip for raid fight — handled above)
    if (!(this.activeEvent.definition.id === 'assassinRaid' && choiceId === 'fight')) {
      branch.guestSatisfaction = Math.min(100, branch.guestSatisfaction + 2)
    }

    // Heat decay on resolve (Street Samurai reduces extra heat, skill tree adds reduction)
    const heatReduction = (hasStreetSamurai(eventBranchId) ? 3 : 1) + getExtraHeatReduction()
    branch.heatLevel = Math.max(0, branch.heatLevel - heatReduction)

    // Apply custom heat change from choice (e.g. heatWave "Lay low" = -5)
    if (choice.heatChange) {
      const heatImmune = sovereignManager.hasActiveDecree('heatReduction') && sovereignManager.getActiveDecreeMult('heatReduction') === -1
      if (!heatImmune || choice.heatChange < 0) {
        branch.heatLevel = Math.max(0, Math.min(10, branch.heatLevel + choice.heatChange))
      }
    }

    // Update AI relations based on event choice
    if (this.activeEvent.aiOwnerBranch) {
      const ownerBranch = this.activeEvent.aiOwnerBranch
      const eventId = this.activeEvent.definition.id
      if (eventId.startsWith('ai_')) {
        const eventType = eventId.split('_')[1]
        if (eventType === 'truce' && choiceId === 'accept') {
          improveRelations(ownerBranch, 15)
        } else if (eventType === 'tribute' && choiceId === 'pay') {
          improveRelations(ownerBranch, 5)
        } else if (eventType === 'tribute' && choiceId === 'refuse') {
          worsenRelations(ownerBranch, 10)
        } else if (eventType === 'spy' && choiceId === 'release') {
          improveRelations(ownerBranch, 10)
        } else if (eventType === 'spy' && choiceId === 'interrogate') {
          worsenRelations(ownerBranch, 8)
        } else if (eventType === 'raid' && choiceId === 'fight') {
          worsenRelations(ownerBranch, 15)
        } else if (eventType === 'raid' && choiceId === 'pay') {
          improveRelations(ownerBranch, 3)
        } else if (eventType === 'provocation' && choiceId === 'stand') {
          worsenRelations(ownerBranch, 5)
        } else if (eventType === 'provocation' && choiceId === 'back') {
          improveRelations(ownerBranch, 5)
        } else if (eventType === 'sabotage' && choiceId === 'retaliate') {
          worsenRelations(ownerBranch, 12)
        }
      }
    }

    // Log
    state.eventLog.push({
      timestamp: Date.now(),
      branch: this.activeEvent.branch,
      eventId: this.activeEvent.definition.id,
      choiceId,
      outcome: (this.activeEvent.definition.id === 'assassinRaid' && choiceId === 'fight')
        ? (raidWon ? 'raid_won' : 'raid_lost')
        : 'resolved',
    })
    if (state.eventLog.length > 200) state.eventLog = state.eventLog.slice(-200)

    eventBus.emit('event:resolved', { event: this.activeEvent, choiceId, raidWon })
    this.activeEvent = null
    return true
  }

  ignoreEvent(): void {
    if (!this.activeEvent) return

    const activeEvent = this.activeEvent
    try {
      const state = gameState.get()
      const branch = state.branches[activeEvent.branch]
      if (!branch) return

      const heatImmune = sovereignManager.hasActiveDecree('heatReduction') && sovereignManager.getActiveDecreeMult('heatReduction') === -1
      if (!heatImmune) {
        branch.heatLevel = Math.min(10, branch.heatLevel + 1)
      }
      branch.reputation = Math.max(0, branch.reputation - 15)
      branch.guestSatisfaction = Math.max(0, branch.guestSatisfaction - 5)

      // Ignoring AI events worsens relations slightly
      if (activeEvent.aiOwnerBranch) {
        worsenRelations(activeEvent.aiOwnerBranch, 5)
      }

      state.eventLog.push({
        timestamp: Date.now(),
        branch: activeEvent.branch,
        eventId: activeEvent.definition.id,
        choiceId: 'ignored',
        outcome: 'ignored',
      })
      if (state.eventLog.length > 200) state.eventLog = state.eventLog.slice(-200)

      eventBus.emit('event:ignored', activeEvent)
    } finally {
      this.activeEvent = null
    }
  }

  private checkForAIEvent(): void {
    if (this.activeEvent) return

    const state = gameState.get()
    const now = Date.now() / 1000
    const lastAITime = this.lastAIEventTimes.get(state.activeBranch) || 0
    if (now - lastAITime < EVENT_COOLDOWN) return

    const branch = state.branches[state.activeBranch]
    if (!branch) return
    if (Date.now() < branch.excommunicadoGraceUntil) return

    // Find AI owners who want to act on this branch
    const activeOwners = getActiveAIOwners()
    if (activeOwners.length === 0) return

    // Filter by cooldown — only consider owners whose cooldown has elapsed
    const eligible = activeOwners.filter(owner =>
      this.tickCount - owner.lastActionTick >= owner.actionCooldown
    )
    if (eligible.length === 0) return

    // Pick a random eligible AI owner
    const owner = eligible[Math.floor(Math.random() * eligible.length)]
    if (!owner) return

    // Roll for action based on aggression and threat
    const aggressionMult = owner.aggression * (1 + owner.threatLevel * 0.1)
    const rollChance = 0.03 * aggressionMult
    if (Math.random() > rollChance) return

    // Pick event type using the shared logic from ai-owner-manager
    const playerPower = getPlayerPower()
    const eventType = pickAIEvent(owner, playerPower)
    if (!eventType) return

    const def = generateAIEvent(owner, eventType, state.activeBranch)
    this.triggerEvent(def, owner.branchId)

    // Update AI owner cooldown
    owner.lastActionTick = this.tickCount
    const temperamentDef = getTemperamentDef(owner.temperament)
    owner.actionCooldown = temperamentDef.baseCooldown + Math.floor(Math.random() * 20)

    eventBus.emit('ai:action', {
      branchId: owner.branchId,
      ownerName: owner.name,
      temperament: owner.temperament,
      eventType,
      power: owner.power,
    })
  }

  tick(): void {
    this.tickCount++
    if (this.tickCount % 3 === 0) {
      this.checkForEvent()
      this.checkForAIEvent()
    }

    // Auto-resolve timeout
    if (this.activeEvent) {
      const elapsed = (Date.now() - this.activeEvent.triggeredAt) / 1000
      if (elapsed >= this.activeEvent.definition.autoResolveTimeout) {
        const action = this.activeEvent.definition.autoResolveAction
        if (action === 'ignore') {
          this.ignoreEvent()
        } else {
          const choices = this.activeEvent.definition.choices
          if (!choices || choices.length === 0) {
            this.ignoreEvent()
            return
          }
          const flag = action === 'best' ? 'isBest' : 'isSafe'
          const preferred = choices.find(c => c[flag])

          // Validate requirements before auto-resolving — fallback to ignore if preferred choice can't be taken
          let choiceId: string | null = null
          if (preferred) {
            if (!preferred.requires || this.canMeetRequirements(preferred)) {
              choiceId = preferred.id
            } else {
              // Preferred choice can't be taken — find first choice without requirements
              const noReq = choices.find(c => !c.requires)
              choiceId = (noReq || choices[0]).id
            }
          } else {
            choiceId = choices[0].id
          }

          if (!this.resolveEvent(choiceId)) {
            // If resolution still fails, ignore to prevent soft-lock
            this.ignoreEvent()
          }
        }
      }
    }
  }

  private canMeetRequirements(choice: { requires?: { staffType?: string; minLevel?: number; assassinAssigned?: boolean } }): boolean {
    if (!choice.requires) return true
    if (!this.activeEvent) return false
    const state = gameState.get()
    const branch = state.branches[this.activeEvent.branch]
    if (!branch) return false
    const eventBranchId = this.activeEvent.branch

    if (choice.requires.assassinAssigned) {
      return Object.values(branch.assassins).some(a =>
        a.assignedBranch === eventBranchId &&
        !a.lentTo &&
        a.attackTarget === null &&
        a.loyalty >= DEFENDER_LOYALTY_THRESHOLD
      )
    }
    if (choice.requires.staffType) {
      return Object.values(branch.staff).some(s => {
        if (s.typeId !== choice.requires!.staffType) return false
        if (choice.requires!.minLevel && s.level < choice.requires!.minLevel) return false
        return s.assignedTo !== null
      })
    }
    return true
  }
}

export const eventEngine = new EventEngine()
