import type { EventDefinition, ThemeId, EventEffect } from '../types'
import { EVENTS, EVENT_COOLDOWN } from '../data/events'
import { hasTraitEffect } from '../data/traits'
import { hasCleanerMaxed, getVipFrequencyMultiplier } from './abilities'
import { hasHighTableEnforcer, hasShadowBlade, hasStreetSamurai } from './assassin-manager'
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
}

class EventEngine {
  private lastEventTimes: Map<ThemeId, number> = new Map()
  private activeEvent: ActiveEvent | null = null
  private tickCount = 0

  getActiveEvent(): ActiveEvent | null {
    return this.activeEvent
  }

  initializeCooldowns(): void {
    const state = gameState.get()
    const now = Date.now() / 1000
    state.worldMap.unlockedNodes.forEach(themeId => {
      this.lastEventTimes.set(themeId, now)
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
      if (e.unlockCondition) {
        const cond = e.unlockCondition as Record<string, unknown>
        if (cond.type === 'buildingLevel') {
          const bId = cond.buildingId as string
          const minLvl = cond.minLevel as number
          const bState = theme.buildings[bId]
          if (!bState || bState.level < minLvl) return false
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
    this.activeEvent = {
      definition: def,
      triggeredAt: Date.now(),
      theme: state.activeTheme,
    }
    this.lastEventTimes.set(state.activeTheme, Date.now() / 1000)
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
    if (choice.requires) {
      const hasRequired = Object.values(theme.staff).some(s => {
        if (choice.requires!.staffType && s.typeId !== choice.requires!.staffType) return false
        if (choice.requires!.minLevel && s.level < choice.requires!.minLevel) return false
        if (s.assignedTo === null) return false
        return true
      })
      if (!hasRequired) {
        eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'requirements' })
        return false
      }
    }

    // Apply reputation change (Shadow Blade doubles reputation gain, diplomacy skill adds %)
    const repMult = hasShadowBlade(eventThemeId) ? 2 : 1
    const skillRepMult = getTotalReputationMult()
    const repChange = Math.round(choice.reputationChange * repMult * skillRepMult)
    theme.reputation = Math.max(0, Math.min(10000, theme.reputation + repChange))

    // Apply rewards
    choice.rewards.forEach(r => applyEffect(r, eventThemeId))

    // Apply penalties
    choice.penalties.forEach(p => applyPenalty(p, eventThemeId))

    // Guest satisfaction: resolving events improves it slightly
    theme.guestSatisfaction = Math.min(100, theme.guestSatisfaction + 2)

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

    eventBus.emit('event:resolved', { event: this.activeEvent, choiceId })
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
