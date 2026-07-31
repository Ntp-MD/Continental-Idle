import { gameState } from './gameState'
import { tick as incomeTick, updateBuildingUnlocks } from './incomeEngine'
import { eventEngine } from './eventEngine'
import { tickStaffXp } from './staffManager'
import { tickDebtCollection, tickDebtInterest } from './debtManager'
import { tickAssassinLoyalty, tickAssassinXp } from './assassinManager'
import { tickTakeoverProgress } from './takeoverManager'
import { tickSupplyRoutes, tickAISupplyRoutes } from './supplyRouteManager'
import { tickAIOwners } from './aiOwnerManager'
import { hasVaultKeeperMaxed } from './abilities'
import { tickRoyalMarks } from './royalManager'
import { getTotalIncomePerSecond } from './incomeEngine'
import { getTotalIncomeMultiplier } from './helpers/incomeMultiplier'
import { tickVisitorSpawn, tickVisitorTimeout } from './visitorManager'
import { tickGuestSatisfaction, tickGuestIncome, tickGuestEvents } from './guestManager'

export function runGameTick(tickCount: number): void {
	incomeTick()
	updateBuildingUnlocks()
	tickStaffXp()
	tickAssassinXp()
	eventEngine.tick()
	tickGuestSatisfaction()
	tickGuestIncome()
	tickGuestEvents()

	if (tickCount % 10 === 0) tickDebtCollection()
	if (tickCount % 60 === 0) tickDebtInterest()
	if (tickCount % 30 === 0) tickAssassinLoyalty()
	if (tickCount % 5 === 0) {
		tickTakeoverProgress()
		tickSupplyRoutes()
		tickAISupplyRoutes()
		tickAIOwners(tickCount)
	}

	if (tickCount % 60 === 0) {
		tickSafeHouseInterest()
		tickRoyalMarks()
		tickGoldenCoins()
	}

	tickVisitorSpawn()
	if (tickCount % 10 === 0) tickVisitorTimeout()

	if (tickCount % 120 === 0) {
		tickHeatDecay()
	}
}

function tickSafeHouseInterest(): void {
	const state = gameState.get()
	state.worldMap.unlockedBranches.forEach(branchId => {
		const branch = state.branches[branchId]
		if (!branch) return
		const safeHouse = branch.buildings['safeHouse']
		if (!safeHouse || safeHouse.level === 0) return
		const baseInterest = safeHouse.level * 100
		const vaultKeeperMult = hasVaultKeeperMaxed(branchId) ? 2 : 1
		const goldStandardMult = branch.upgrades.includes('goldStandard') ? 1.5 : 1
		const interest = baseInterest * vaultKeeperMult * goldStandardMult * getTotalIncomeMultiplier()
		branch.currency += interest
		branch.lifetimeEarnings += interest
	})
}

function tickGoldenCoins(): void {
	const state = gameState.get()
	const totalIncome = getTotalIncomePerSecond()
	state.goldenCoins += totalIncome * 0.01
}

function tickHeatDecay(): void {
	const state = gameState.get()
	state.worldMap.unlockedBranches.forEach(branchId => {
		const branch = state.branches[branchId]
		if (!branch) return
		if (branch.heatLevel > 0) branch.heatLevel = Math.max(0, branch.heatLevel - 1)
		if (branch.guestSatisfaction > 50) {
			branch.guestSatisfaction = Math.max(50, branch.guestSatisfaction - 1)
		}
	})
}
