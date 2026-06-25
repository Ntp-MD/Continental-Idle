import type { EventDefinition, ThemeId, EventEffect, RaidData, RaidAttacker } from '../types'
import { EVENTS, EVENT_COOLDOWN } from '../data/events'
import { hasTraitEffect } from '../data/traits'
import { hasCleanerMaxed, getVipFrequencyMultiplier } from './abilities'
import { hasHighTableEnforcer, hasShadowBlade, hasStreetSamurai, getAssassinRaidPower, getAssassinXpMult } from './assassin-manager'
import { getTotalReputationMult, getExtraHeatReduction, getTotalBuffDurationMult } from './skill-manager'
import { gameState } from './game-state'
import { eventBus } from './event-bus'

function generateBuffId(): string {
  return 'buff_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function applyEffect(effect: EventEffect, themeId: ThemeId): void {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme) return

  switch (effect.type) {
    case 'incomeMultiplier': {
      const buffDurMult = getTotalBuffDurationMult()
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeMultiplier',
        value: effect.value,
        expiresAt: effect.duration ? Date.now() + effect.duration * 1000 * buffDurMult : null,
        themeId,
      })
      break
    }
    case 'permanentIncomeBonus': {
      state.permanentIncomeBonus += effect.value
      break
    }
    case 'reputation': {
      theme.reputation = Math.max(0, Math.min(10000, theme.reputation + effect.value))
      break
    }
    case 'incomeFreeze': {
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeFreeze',
        value: 0,
        expiresAt: Date.now() + effect.value * 1000,
        themeId,
      })
      break
    }
  }
}

function applyPenalty(effect: EventEffect, themeId: ThemeId): void {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme) return

  const hasProtection = Object.values(theme.staff).some(s =>
    s.assignedTo !== null && hasTraitEffect(s.traits, 'negativeEventProtection')
  )
  if (hasProtection) return

  // Cleaner max ability: all negative event penalties negated
  if (hasCleanerMaxed(themeId)) return

  switch (effect.type) {
    case 'loseCurrency': {
      if (effect.scaling === 'currencyPercent') {
        theme.currency = Math.max(0, theme.currency * (1 - effect.value))
      } else {
        theme.currency = Math.max(0, theme.currency - effect.value)
      }
      break
    }
    case 'markerDebt': {
      const amount = effect.value * (1 + theme.prestige * 0.1)
      theme.markerDebts.push({
        amount,
        createdAt: Date.now(),
        theme: themeId,
      })
      break
    }
    case 'incomeFreeze': {
      state.activeBuffs.push({
        id: generateBuffId(),
        type: 'incomeFreeze',
        value: 0,
        expiresAt: Date.now() + effect.value * 1000,
        themeId,
      })
      break
    }
  }
}

interface ActiveEvent {
  definition: EventDefinition
  triggeredAt: number
  theme: ThemeId
  raidData?: RaidData
}

const RAID_NAMES = ['Phantom', 'Viper', 'Wraith', 'Knell', 'Razor', 'Talon', 'Shade', 'Specter', 'Cipher', 'Echo']
const RAID_COOLDOWN = 120
export const DEFENDER_LOYALTY_THRESHOLD = 30

function generateRaid(themeId: ThemeId): RaidData {
  const state = gameState.get()
  const theme = state.themes[themeId]
  if (!theme) return { attackers: [], attackerPower: 0, defenderPower: 0, winChance: 0, defenderCount: 0 }

  const heat = theme.heatLevel
  const prestige = theme.prestige

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

  const defenders = Object.values(theme.assassins).filter(a =>
    a.assignedTheme === themeId &&
    !a.lentTo &&
    a.attackTarget === null &&
    a.loyalty >= DEFENDER_LOYALTY_THRESHOLD
  )
  // Also count assassins lent TO this theme from other themes
  state.worldMap.unlockedNodes.forEach(sourceId => {
    if (sourceId === themeId) return
    const sourceTheme = state.themes[sourceId]
    if (!sourceTheme) return
    Object.values(sourceTheme.assassins).forEach(a => {
      if (a.lentTo === themeId && a.loyalty >= DEFENDER_LOYALTY_THRESHOLD) {
        defenders.push(a)
      }
    })
  })

  let defenderPower = 0
  defenders.forEach(a => {
    defenderPower += getAssassinRaidPower(a)
  })

  const winChance = defenderPower > 0
    ? Math.max(0.05, Math.min(0.95, defenderPower / (defenderPower + attackerPower)))
    : 0

  return { attackers, attackerPower, defenderPower, winChance, defenderCount: defenders.length }
}

class EventEngine {
  private lastEventTimes: Map<ThemeId, number> = new Map()
  private lastRaidTimes: Map<ThemeId, number> = new Map()
  private activeEvent: ActiveEvent | null = null
  private tickCount = 0

  getActiveEvent(): ActiveEvent | null {
    return this.activeEvent
  }

  getRaidData(): RaidData | null {
    return this.activeEvent?.raidData ?? null
  }

  initializeCooldowns(): void {
    const state = gameState.get()
    const now = Date.now() / 1000
    state.worldMap.unlockedNodes.forEach(themeId => {
      this.lastEventTimes.set(themeId, now)
      this.lastRaidTimes.set(themeId, now)
    })
  }

  checkForEvent(): void {
    if (this.activeEvent) return

    const state = gameState.get()
    const now = Date.now() / 1000
    const lastTime = this.lastEventTimes.get(state.activeTheme) || 0
    if (now - lastTime < EVENT_COOLDOWN) return

    const theme = state.themes[state.activeTheme]
    if (!theme) return

    // Excommunicado grace period
    if (Date.now() < theme.excommunicadoGraceUntil) return

    // Filter eligible events
    const eligible = EVENTS.filter(e => {
      if (e.themeLock && e.themeLock !== state.activeTheme) return false
      // High Table Enforcer prevents excommunicado events
      if (e.id === 'excommunicado' && hasHighTableEnforcer(state.activeTheme)) return false
      // Raid cooldown check — separate from normal event cooldown
      if (e.id === 'assassinRaid') {
        const lastRaid = this.lastRaidTimes.get(state.activeTheme) || 0
        if (now - lastRaid < RAID_COOLDOWN) return false
      }
      if (e.unlockCondition) {
        const cond = e.unlockCondition as Record<string, unknown>
        if (cond.type === 'buildingLevel') {
          const bId = cond.buildingId as string
          const minLvl = cond.minLevel as number
          const bState = theme.buildings[bId]
          if (!bState || bState.level < minLvl) return false
        }
        if (cond.type === 'prestige') {
          const minPrestige = cond.minPrestige as number
          if (state.totalPrestige < minPrestige) return false
        }
      }
      return true
    })

    if (eligible.length === 0) return

    // Weighted random selection
    const heat = theme.heatLevel
    let totalWeight = 0
    const weighted = eligible.map(e => {
      const w = Math.max(1, e.weight + e.heatModifier * heat)
      totalWeight += w
      return { event: e, weight: w }
    })

    // Random roll (probability per tick is low, Sommelier increases VIP frequency)
    const rollChance = 0.02 * getVipFrequencyMultiplier(state.activeTheme)
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

  private triggerEvent(def: EventDefinition): void {
    const state = gameState.get()
    const raidData = def.id === 'assassinRaid' ? generateRaid(state.activeTheme) : undefined
    this.activeEvent = {
      definition: def,
      triggeredAt: Date.now(),
      theme: state.activeTheme,
      raidData,
    }
    this.lastEventTimes.set(state.activeTheme, Date.now() / 1000)
    if (def.id === 'assassinRaid') {
      this.lastRaidTimes.set(state.activeTheme, Date.now() / 1000)
    }
    eventBus.emit('event:trigger', this.activeEvent)
  }

  resolveEvent(choiceId: string): boolean {
    if (!this.activeEvent) return false

    const state = gameState.get()
    const theme = state.themes[this.activeEvent.theme]
    const choice = this.activeEvent.definition.choices.find(c => c.id === choiceId)

    if (!choice) {
      eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'invalid_choice' })
      return false
    }

    if (!theme) {
      eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'invalid_theme' })
      return false
    }

    const eventThemeId = this.activeEvent.theme

    // Validate choice requirements
    let hasAssassinDefender = false
    if (choice.requires) {
      if (choice.requires.assassinAssigned) {
        hasAssassinDefender = Object.values(theme.assassins).some(a =>
          a.assignedTheme === eventThemeId &&
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
        const hasRequired = Object.values(theme.staff).some(s => {
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
    const repMult = choice.reputationChange > 0 && hasShadowBlade(eventThemeId) ? 2 : 1
    const skillRepMult = choice.reputationChange > 0 ? getTotalReputationMult() : 1
    const repChange = Math.round(choice.reputationChange * repMult * skillRepMult)
    theme.reputation = Math.max(0, Math.min(10000, theme.reputation + repChange))

    // Special combat resolution for assassinRaid fight choice
    let raidWon = false
    if (this.activeEvent.definition.id === 'assassinRaid' && choiceId === 'fight' && this.activeEvent.raidData) {
      const raid = this.activeEvent.raidData
      raidWon = Math.random() < raid.winChance
      const defenders = Object.values(theme.assassins).filter(a =>
        a.assignedTheme === eventThemeId &&
        !a.lentTo &&
        a.attackTarget === null &&
        a.loyalty >= DEFENDER_LOYALTY_THRESHOLD
      )
      // Also include assassins lent TO this theme from other themes
      state.worldMap.unlockedNodes.forEach(sourceId => {
        if (sourceId === eventThemeId) return
        const sourceTheme = state.themes[sourceId]
        if (!sourceTheme) return
        Object.values(sourceTheme.assassins).forEach(a => {
          if (a.lentTo === eventThemeId && a.loyalty >= DEFENDER_LOYALTY_THRESHOLD) {
            defenders.push(a)
          }
        })
      })

      if (raidWon) {
        const spoilsCurrency = raid.attackerPower * 1000 * (1 + theme.prestige * 0.1)
        theme.currency += spoilsCurrency
        theme.lifetimeEarnings += spoilsCurrency
        theme.reputation = Math.max(0, Math.min(10000, theme.reputation + 15))
        theme.guestSatisfaction = Math.min(100, theme.guestSatisfaction + 5)
        defenders.forEach(a => { a.xp += 50 * getAssassinXpMult(a) })
        eventBus.emit('raid:result', { won: true, spoilsCurrency, themeId: eventThemeId })
      } else {
        theme.currency = Math.max(0, theme.currency * 0.9)
        theme.reputation = Math.max(0, theme.reputation - 10)
        theme.guestSatisfaction = Math.max(0, theme.guestSatisfaction - 5)
        defenders.forEach(a => { a.loyalty = Math.max(0, a.loyalty - 15) })
        state.activeBuffs.push({
          id: generateBuffId(),
          type: 'incomeFreeze',
          value: 0,
          expiresAt: Date.now() + 30 * 1000,
          themeId: eventThemeId,
        })
        eventBus.emit('raid:result', { won: false, themeId: eventThemeId })
      }
    } else {
      // Apply rewards
      choice.rewards.forEach(r => applyEffect(r, eventThemeId))

      // Apply penalties
      choice.penalties.forEach(p => applyPenalty(p, eventThemeId))
    }

    // Guest satisfaction: resolving events improves it slightly (skip for raid fight — handled above)
    if (!(this.activeEvent.definition.id === 'assassinRaid' && choiceId === 'fight')) {
      theme.guestSatisfaction = Math.min(100, theme.guestSatisfaction + 2)
    }

    // Heat decay on resolve (Street Samurai reduces extra heat, skill tree adds reduction)
    const heatReduction = (hasStreetSamurai(eventThemeId) ? 3 : 1) + getExtraHeatReduction()
    theme.heatLevel = Math.max(0, theme.heatLevel - heatReduction)

    // Log
    state.eventLog.push({
      timestamp: Date.now(),
      theme: this.activeEvent.theme,
      eventId: this.activeEvent.definition.id,
      choiceId,
      outcome: 'resolved',
    })
    if (state.eventLog.length > 200) state.eventLog = state.eventLog.slice(-200)

    eventBus.emit('event:resolved', { event: this.activeEvent, choiceId, raidWon })
    this.activeEvent = null
    return true
  }

  ignoreEvent(): void {
    if (!this.activeEvent) return

    const state = gameState.get()
    const theme = state.themes[this.activeEvent.theme]
    if (!theme) return

    theme.heatLevel = Math.min(10, theme.heatLevel + 1)
    theme.reputation = Math.max(0, theme.reputation - 15)
    theme.guestSatisfaction = Math.max(0, theme.guestSatisfaction - 5)

    state.eventLog.push({
      timestamp: Date.now(),
      theme: this.activeEvent.theme,
      eventId: this.activeEvent.definition.id,
      choiceId: 'ignored',
      outcome: 'ignored',
    })
    if (state.eventLog.length > 200) state.eventLog = state.eventLog.slice(-200)

    eventBus.emit('event:ignored', this.activeEvent)
    this.activeEvent = null
  }

  tick(): void {
    this.tickCount++
    if (this.tickCount % 3 === 0) {
      this.checkForEvent()
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
          const flag = action === 'best' ? 'isBest' : 'isSafe'
          const preferred = choices.find(c => c[flag])
          const choiceId = preferred ? preferred.id : choices[0].id
          this.resolveEvent(choiceId)
        }
      }
    }
  }
}

export const eventEngine = new EventEngine()
