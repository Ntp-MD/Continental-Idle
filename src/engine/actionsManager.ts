import { gameState } from './gameState'
import { eventBus } from './eventBus'
import type { BranchId, BranchState } from '@/types'

const LAY_LOW_COST = 5
const LAY_LOW_HEAT_REDUCTION = 3

const HOST_EVENT_COST = 10
const HOST_EVENT_SATISFACTION_GAIN = 15

const BRIBE_OFFICIAL_COST = 15
const BRIBE_HEAT_REDUCTION = 5

const GOLDEN_COIN_INCOME_BOOST_COST = 20
const GOLDEN_COIN_INCOME_BOOST_DURATION = 300

function canAffordAction(
	branchId: BranchId | undefined,
	cost: number,
	extraCheck?: (branch: BranchState) => boolean
): boolean {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	if (!branch) return false
	if (state.goldenCoins < cost) return false
	return extraCheck ? extraCheck(branch) : true
}

function executeBranchAction(
	branchId: BranchId | undefined,
	cost: number,
	extraCheck: (branch: BranchState) => boolean,
	apply: (branch: BranchState, id: BranchId) => void
): boolean {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	if (!branch) return false
	if (state.goldenCoins < cost) return false
	if (!extraCheck(branch)) return false

	state.goldenCoins -= cost
	apply(branch, id)
	return true
}

export function canLayLow(branchId?: BranchId): boolean {
	return canAffordAction(branchId, LAY_LOW_COST, b => b.heatLevel > 0)
}

export function layLow(branchId?: BranchId): boolean {
	return executeBranchAction(
		branchId,
		LAY_LOW_COST,
		b => b.heatLevel > 0,
		(branch, id) => {
			branch.heatLevel = Math.max(0, branch.heatLevel - LAY_LOW_HEAT_REDUCTION)
			eventBus.emit('action:laylow', { branch: id, heatReduction: LAY_LOW_HEAT_REDUCTION })
		}
	)
}

export function canHostEvent(branchId?: BranchId): boolean {
	return canAffordAction(branchId, HOST_EVENT_COST, b => b.guestSatisfaction < 100)
}

export function hostEvent(branchId?: BranchId): boolean {
	return executeBranchAction(
		branchId,
		HOST_EVENT_COST,
		b => b.guestSatisfaction < 100,
		(branch, id) => {
			branch.guestSatisfaction = Math.min(100, branch.guestSatisfaction + HOST_EVENT_SATISFACTION_GAIN)
			eventBus.emit('action:hostevent', { branch: id, satisfactionGain: HOST_EVENT_SATISFACTION_GAIN })
		}
	)
}

export function canBribeOfficial(branchId?: BranchId): boolean {
	return canAffordAction(branchId, BRIBE_OFFICIAL_COST, b => b.heatLevel > 0)
}

export function bribeOfficial(branchId?: BranchId): boolean {
	return executeBranchAction(
		branchId,
		BRIBE_OFFICIAL_COST,
		b => b.heatLevel > 0,
		(branch, id) => {
			branch.heatLevel = Math.max(0, branch.heatLevel - BRIBE_HEAT_REDUCTION)
			eventBus.emit('action:bribe', { branch: id, heatReduction: BRIBE_HEAT_REDUCTION })
		}
	)
}

export function canGoldenCoinIncomeBoost(): boolean {
	return gameState.get().goldenCoins >= GOLDEN_COIN_INCOME_BOOST_COST
}

export function goldenCoinIncomeBoost(): boolean {
	const state = gameState.get()
	if (state.goldenCoins < GOLDEN_COIN_INCOME_BOOST_COST) return false

	state.goldenCoins -= GOLDEN_COIN_INCOME_BOOST_COST
	state.activeBuffs.push({
		id: 'buff_goldencoin_' + Date.now().toString(36),
		type: 'incomeMultiplier',
		value: 1.5,
		expiresAt: Date.now() + GOLDEN_COIN_INCOME_BOOST_DURATION * 1000,
		branchId: null,
	})
	eventBus.emit('action:goldenboost', { duration: GOLDEN_COIN_INCOME_BOOST_DURATION })
	return true
}

export function getLayLowCost(): number { return LAY_LOW_COST }
export function getHostEventCost(): number { return HOST_EVENT_COST }
export function getBribeOfficialCost(): number { return BRIBE_OFFICIAL_COST }
export function getGoldenCoinIncomeBoostCost(): number { return GOLDEN_COIN_INCOME_BOOST_COST }
export function getGoldenCoinIncomeBoostDuration(): number { return GOLDEN_COIN_INCOME_BOOST_DURATION }
