import { gameState } from './gameState'
import { eventBus } from './eventBus'
import { ROYAL_BUILDINGS, ROYAL_BUILDING_MAP, ROYAL_BUILDING_INCOME_GROWTH } from '@/data/royalBuildings'
import { ROYAL_SKILL_MAX_LEVEL, getRoyalSkillNode } from '@/data/royalSkills'
import { computeBuildingCost, computeAffordableLevels } from './helpers/buildingCost'
import type { BranchId, BranchState } from '@/types'


export function getRoyalBuildingIncome(branchState: BranchState, buildingId: string): number {
	const def = ROYAL_BUILDING_MAP[buildingId]
	if (!def) return 0
	const bState = branchState.royalBuildings?.[buildingId]
	if (!bState || bState.level === 0) return 0
	return def.baseRate * Math.pow(ROYAL_BUILDING_INCOME_GROWTH, bState.level)
}

export function getRoyalBuildingsIncome(branchId: BranchId): number {
	const state = gameState.get()
	const branch = state.branches[branchId]
	if (!branch) return 0
	if (!state.worldMap.royalBranches.includes(branchId)) return 0
	let total = 0
	ROYAL_BUILDINGS.forEach(def => {
		total += getRoyalBuildingIncome(branch, def.id)
	})
	return total
}

export function getRoyalBuildingCost(branchState: BranchState, buildingId: string, count: number = 1): number {
	const def = ROYAL_BUILDING_MAP[buildingId]
	if (!def) return Infinity
	const currentLevel = branchState.royalBuildings?.[buildingId]?.level || 0
	return computeBuildingCost(def.baseCost, def.costGrowth, currentLevel, count)
}

export function getRoyalAffordableLevels(branchState: BranchState, buildingId: string): number {
	const def = ROYAL_BUILDING_MAP[buildingId]
	if (!def) return 0
	const currentLevel = branchState.royalBuildings?.[buildingId]?.level || 0
	return computeAffordableLevels(def.baseCost, def.costGrowth, def.maxLevel, currentLevel, branchState.currency)
}

export function purchaseRoyalBuilding(buildingId: string, count?: number): boolean {
	const state = gameState.get()
	const branchId = state.activeBranch
	if (!state.worldMap.royalBranches.includes(branchId)) return false
	const branch = state.branches[branchId]
	if (!branch) return false

	const def = ROYAL_BUILDING_MAP[buildingId]
	if (!def) return false

	if (!branch.royalBuildings) branch.royalBuildings = {}
	const bState = branch.royalBuildings[buildingId]
	if (!bState) {
		branch.royalBuildings[buildingId] = { level: 0, unlocked: true }
	}

	const bs = branch.royalBuildings[buildingId]
	let buyCount = count || state.buyMultiplier
	if (!Number.isFinite(buyCount) || buyCount < 0) buyCount = 1
	if (buyCount === 0) buyCount = getRoyalAffordableLevels(branch, buildingId)
	if (buyCount <= 0) return false

	const maxPurchasable = def.maxLevel - bs.level
	buyCount = Math.min(buyCount, maxPurchasable)
	if (buyCount <= 0) return false

	const cost = getRoyalBuildingCost(branch, buildingId, buyCount)
	if (branch.currency < cost) return false

	branch.currency -= cost
	bs.level += buyCount
	eventBus.emit('income:update')
	return true
}


export function canUpgradeRoyalSkill(branch: string): boolean {
	const state = gameState.get()
	const currentLevel = state.royalSkillTree[branch as keyof typeof state.royalSkillTree] || 0
	if (currentLevel >= ROYAL_SKILL_MAX_LEVEL) return false
	const node = getRoyalSkillNode(branch, currentLevel + 1)
	if (!node) return false
	return state.royalMarks >= node.royalMarkCost
}

export function upgradeRoyalSkill(branch: string): boolean {
	const state = gameState.get()
	const key = branch as keyof typeof state.royalSkillTree
	const currentLevel = state.royalSkillTree[key] || 0
	if (currentLevel >= ROYAL_SKILL_MAX_LEVEL) return false
	const node = getRoyalSkillNode(branch, currentLevel + 1)
	if (!node) return false
	if (state.royalMarks < node.royalMarkCost) return false

	state.royalMarks -= node.royalMarkCost
	state.royalSkillTree[key] = currentLevel + 1
	eventBus.emit('royal:skill-upgraded', { branch, level: currentLevel + 1 })
	return true
}

export function getRoyalIncomeMult(): number {
	const state = gameState.get()
	const level = state.royalSkillTree.royalIncome
	let mult = 1
	for (let i = 1; i <= level; i++) {
		const node = getRoyalSkillNode('royalIncome', i)
		if (node?.effect.incomeMult) mult += node.effect.incomeMult
	}
	return mult
}

export function getRoyalLoyaltyDecayReduction(): number {
	const state = gameState.get()
	const level = state.royalSkillTree.royalLoyalty
	let reduction = 0
	for (let i = 1; i <= level; i++) {
		const node = getRoyalSkillNode('royalLoyalty', i)
		if (node?.effect.loyaltyDecayReduction) reduction += node.effect.loyaltyDecayReduction
	}
	return Math.min(0.8, reduction)
}

export function getRoyalAssassinPowerMult(): number {
	const state = gameState.get()
	const level = state.royalSkillTree.royalPower
	let mult = 1
	for (let i = 1; i <= level; i++) {
		const node = getRoyalSkillNode('royalPower', i)
		if (node?.effect.assassinPowerMult) mult += node.effect.assassinPowerMult
	}
	return mult
}

export function getRoyalFavorMult(): number {
	const state = gameState.get()
	const level = state.royalSkillTree.royalFavor
	let mult = 1
	for (let i = 1; i <= level; i++) {
		const node = getRoyalSkillNode('royalFavor', i)
		if (node?.effect.favorMult) mult += node.effect.favorMult
	}
	return mult
}

export function getRoyalPrestigeMult(): number {
	const state = gameState.get()
	const level = state.royalSkillTree.royalAscension
	let mult = 1
	for (let i = 1; i <= level; i++) {
		const node = getRoyalSkillNode('royalAscension', i)
		if (node?.effect.royalPrestigeMult) mult += node.effect.royalPrestigeMult
	}
	return mult
}

export function getRoyalBuffDurationMult(): number {
	let mult = 1
	for (const branch of ['royalIncome', 'royalLoyalty', 'royalPower', 'royalFavor', 'royalAscension'] as const) {
		const state = gameState.get()
		const level = state.royalSkillTree[branch]
		for (let i = 1; i <= level; i++) {
			const node = getRoyalSkillNode(branch, i)
			if (node?.effect.buffDurationMult) mult += node.effect.buffDurationMult
		}
	}
	return mult
}


export function canRoyalPrestige(): boolean {
	const state = gameState.get()
	const branchId = state.activeBranch
	if (!state.worldMap.royalBranches.includes(branchId)) return false
	const branch = state.branches[branchId]
	if (!branch) return false
	return branch.lifetimeEarnings >= 1e12
}

export function getRoyalPrestigeMarks(): number {
	const state = gameState.get()
	const branch = state.branches[state.activeBranch]
	if (!branch) return 0
	const scaleConstant = 1e10
	const baseMarks = Math.floor(Math.sqrt(branch.lifetimeEarnings / scaleConstant))
	return Math.floor(baseMarks * getRoyalPrestigeMult())
}

export function doRoyalPrestige(): boolean {
	const state = gameState.get()
	const branchId = state.activeBranch
	if (!canRoyalPrestige()) return false
	const branch = state.branches[branchId]
	if (!branch) return false

	const marks = getRoyalPrestigeMarks()
	state.royalMarks += marks
	state.royalPrestige += 1


	branch.currency = 0
	branch.lifetimeEarnings = 0
	branch.heatLevel = 0
	branch.guestSatisfaction = 50
	branch.markerDebts = []
	BUILDINGS_RESET.forEach(bId => {
		if (branch.buildings[bId]) branch.buildings[bId].level = 0
	})
	if (branch.royalBuildings) {
		Object.keys(branch.royalBuildings).forEach(bId => {
			branch.royalBuildings[bId].level = 0
		})
	}


	state.activeBuffs = state.activeBuffs.filter(b => b.branchId !== branchId)

	eventBus.emit('royal:prestige', { branchId, marks })
	return true
}

const BUILDINGS_RESET = ['reception', 'guestRooms', 'bar', 'kitchen', 'laundry', 'underground', 'safeHouse', 'armory', 'intelNetwork', 'vip', 'blackMarket', 'vault']


export function tickRoyalMarks(): void {
	const state = gameState.get()
	if (state.worldMap.royalBranches.length === 0) return

	let totalMarks = 0
	state.worldMap.royalBranches.forEach(branchId => {
		const royalIncome = getRoyalBuildingsIncome(branchId)

		totalMarks += royalIncome / 1_000_000_000
	})
	state.royalMarks = Math.round((state.royalMarks + totalMarks * 0.1) * 100) / 100
}


export function getSovereignBuffMult(): number {
	const state = gameState.get()
	return state.sovereign ? 2.0 : 1.0
}
