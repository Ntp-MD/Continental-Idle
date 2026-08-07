import type { EventDefinition, BranchId, EventEffect, RaidData, RaidAttacker } from '@/types'
import { EVENTS, EVENT_COOLDOWN } from '@/data/events'
import { hasTraitEffect } from '@/data/traits'
import { hasCleanerMaxed, getVipFrequencyMultiplier } from './abilities'
import { hasHighTableEnforcer, hasShadowBlade, hasStreetSamurai, getAssassinRaidPower, getAssassinXpMult } from './assassinManager'
import { getTotalReputationMult, getExtraHeatReduction, getTotalBuffDurationMult } from './skillManager'
import { getRoyalAssassinPowerMult, getRoyalBuffDurationMult } from './royalManager'
import { sovereignManager } from './sovereignManager'
import { gameState } from './gameState'
import { getBranchIncomePerSecond } from './incomeEngine'
import { eventBus } from './eventBus'
import { getActiveAIOwners, generateAIEvent, pickAIEvent, getPlayerPower, improveRelations, worsenRelations } from './aiOwnerManager'
import { getTemperamentDef } from '@/data/aiOwners'
import { generateId } from '@/utils/generateId'

function getEventBranch(branchId: BranchId) {
	const state = gameState.get()
	const branch = state.branches[branchId]
	if (!branch) return null
	return { state, branch }
}

function applyEffect(effect: EventEffect, branchId: BranchId): void {
	const ctx = getEventBranch(branchId)
	if (!ctx) return
	const { state, branch } = ctx

	switch (effect.type) {
		case 'incomeMultiplier': {
			const buffDurationMult = getTotalBuffDurationMult() * getRoyalBuffDurationMult()
			const incomeMultValue = effect.scaling === 'incomePercent'
				? 1 + effect.value
				: effect.value
			state.activeBuffs.push({
				id: generateId('buff_'),
				type: 'incomeMultiplier',
				value: incomeMultValue,
				expiresAt: effect.duration ? Date.now() + effect.duration * 1000 * buffDurationMult : null,
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
				id: generateId('buff_'),
				type: 'incomeFreeze',
				value: 0,
				expiresAt: Date.now() + effect.value * 1000,
				branchId,
			})
			break
		}
		case 'loseCurrency':
		case 'markerDebt':
			applyPenalty(effect, branchId)
			break
	}
}

function applyPenalty(effect: EventEffect, branchId: BranchId): void {
	const ctx = getEventBranch(branchId)
	if (!ctx) return
	const { state, branch } = ctx

	const hasProtection = Object.values(branch.staff).some(s =>
		s.assignedTo !== null && hasTraitEffect(s.traits, 'negativeEventProtection')
	)
	if (hasProtection) return


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
				id: generateId('debt_'),
				amount,
				originalAmount: amount,
				createdAt: Date.now(),
				branch: branchId,
			})
			break
		}
		case 'incomeFreeze': {
			state.activeBuffs.push({
				id: generateId('buff_'),
				type: 'incomeFreeze',
				value: 0,
				expiresAt: Date.now() + effect.value * 1000,
				branchId,
			})
			break
		}
		case 'incomeMultiplier': {
			const buffDurationMult = getTotalBuffDurationMult() * getRoyalBuffDurationMult()
			const incomeMultValue = effect.scaling === 'incomePercent'
				? Math.max(0, 1 - effect.value)
				: effect.value
			state.activeBuffs.push({
				id: generateId('buff_'),
				type: 'incomeMultiplier',
				value: incomeMultValue,
				expiresAt: effect.duration ? Date.now() + effect.duration * 1000 * buffDurationMult : null,
				branchId,
			})
			break
		}
		case 'reputation': {
			branch.reputation = Math.max(0, Math.min(10000, branch.reputation + effect.value))
			break
		}
		case 'permanentIncomeBonus':
			applyEffect(effect, branchId)
			break
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


		if (Date.now() < branch.excommunicadoGraceUntil) return


		const eligible = EVENTS.filter(e => {
			if (e.branchLock && e.branchLock !== state.activeBranch) return false

			if (e.id === 'excommunicado' && hasHighTableEnforcer(state.activeBranch)) return false

			if (e.id === 'assassinRaid') {
				const lastRaid = this.lastRaidTimes.get(state.activeBranch) || 0
				if (now - lastRaid < RAID_COOLDOWN) return false
			}
			if (e.unlockCondition) {
				const condition = e.unlockCondition
				if (condition.type === 'buildingLevel') {
					const buildingState = branch.buildings[condition.buildingId]
					if (!buildingState || buildingState.level < condition.minLevel) return false
				}
				if (condition.type === 'prestige') {
					if (state.totalPrestige < condition.minPrestige) return false
				}
			}
			return true
		})

		if (eligible.length === 0) return


		const heat = branch.heatLevel
		const vipMult = getVipFrequencyMultiplier(state.activeBranch)
		let totalWeight = 0
		const weighted = eligible.map(e => {

			const isVipEvent = e.id === 'vipArrival'
			const w = Math.max(1, (e.weight + e.heatModifier * heat) * (isVipEvent ? vipMult : 1))
			totalWeight += w
			return { event: e, weight: w }
		})


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
				const hasRequiredStaff = Object.values(branch.staff).some(s => {
					if (s.typeId !== choice.requires!.staffType) return false
					if (choice.requires!.minLevel && s.level < choice.requires!.minLevel) return false
					if (s.assignedTo === null) return false
					return true
				})
				if (!hasRequiredStaff) {
					eventBus.emit('event:rejected', { event: this.activeEvent, reason: 'requirements' })
					return false
				}
			}
		}


		const repMult = choice.reputationChange > 0 && hasShadowBlade(eventBranchId) ? 2 : 1
		const skillRepMult = choice.reputationChange > 0 ? getTotalReputationMult() : 1
		const repChange = Math.round(choice.reputationChange * repMult * skillRepMult)
		branch.reputation = Math.max(0, Math.min(10000, branch.reputation + repChange))


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
					id: generateId('buff_'),
					type: 'incomeFreeze',
					value: 0,
					expiresAt: Date.now() + 30 * 1000,
					branchId: eventBranchId,
				})
				eventBus.emit('raid:result', { won: false, branchId: eventBranchId })
			}
		} else {

			choice.rewards.forEach(reward => applyEffect(reward, eventBranchId))


			choice.penalties.forEach(penalty => applyPenalty(penalty, eventBranchId))


			if (this.activeEvent.definition.id === 'markerForgiveness' && choiceId === 'accept') {
				if (branch.markerDebts.length > 0) {
					const cheapest = branch.markerDebts.reduce((lowest, debt) => debt.amount < lowest.amount ? debt : lowest, branch.markerDebts[0])
					branch.markerDebts = branch.markerDebts.filter(debt => debt.id !== cheapest.id)
				}
			}
		}


		if (!(this.activeEvent.definition.id === 'assassinRaid' && choiceId === 'fight')) {
			branch.guestSatisfaction = Math.min(100, branch.guestSatisfaction + 2)
		}


		const heatReduction = (hasStreetSamurai(eventBranchId) ? 3 : 1) + getExtraHeatReduction()
		branch.heatLevel = Math.max(0, branch.heatLevel - heatReduction)


		if (choice.heatChange) {
			const heatImmune = sovereignManager.hasActiveDecree('heatReduction') && sovereignManager.getActiveDecreeMult('heatReduction') === -1
			if (!heatImmune || choice.heatChange < 0) {
				branch.heatLevel = Math.max(0, Math.min(10, branch.heatLevel + choice.heatChange))
			}
		}


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


		const activeOwners = getActiveAIOwners()
		if (activeOwners.length === 0) return


		const eligible = activeOwners.filter(owner =>
			this.tickCount - owner.lastActionTick >= owner.actionCooldown
		)
		if (eligible.length === 0) return


		const owner = eligible[Math.floor(Math.random() * eligible.length)]
		if (!owner) return


		const aggressionMult = owner.aggression * (1 + owner.threatLevel * 0.1)
		const rollChance = 0.03 * aggressionMult
		if (Math.random() > rollChance) return


		const playerPower = getPlayerPower()
		const eventType = pickAIEvent(owner, playerPower)
		if (!eventType) return

		const def = generateAIEvent(owner, eventType, state.activeBranch)
		this.triggerEvent(def, owner.branchId)


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
					const choiceFlag = action === 'best' ? 'isBest' : 'isSafe'
					const preferred = choices.find(c => c[choiceFlag])


					let choiceId: string | null = null
					if (preferred) {
						if (!preferred.requires || this.canMeetRequirements(preferred)) {
							choiceId = preferred.id
						} else {

							const fallbackChoice = choices.find(c => !c.requires)
							choiceId = (fallbackChoice || choices[0]).id
						}
					} else {
						choiceId = choices[0].id
					}

					if (!this.resolveEvent(choiceId)) {

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
