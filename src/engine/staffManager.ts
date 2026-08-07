import type { BranchId, StaffEntry } from '@/types'
import { STAFF_MAP } from '@/data/staff'
import { getTraitMultiplier } from '@/data/traits'
import { getTotalStaffXpMult, getExtraStaffSlots } from './skillManager'
import { getSovereignBuffMult } from './royalManager'
import { gameState } from './gameState'
import { eventBus } from './eventBus'
import { rollRarityFromConfig, getRarityCostMult } from '@/data/rarity'
import { getVeteranPerk } from '@/data/staff'
import { rollStats, rollTraits } from './npcStats'
import { generateId } from '@/utils/generateId'
import { getXpToNext, getLevelUpCost } from './helpers/levelFormulas'

export function getStaffXpToNext(level: number): number {
	return getXpToNext(level, 100, 1.3)
}

export function getStaffLevelUpCost(staffTypeId: string, newLevel: number): number {
	const def = STAFF_MAP[staffTypeId]
	if (!def) return Infinity
	return getLevelUpCost(def.hireCost, 0.1, 1.3, newLevel)
}

export function isStaffUnlocked(staffTypeId: string, branchId?: BranchId): boolean {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	const def = STAFF_MAP[staffTypeId]
	if (!def) return false
	if (!branch) return false

	const unlock = def.unlock
	if (unlock === 'start') return true


	if (branch.buildings[unlock]?.level >= 1) return true


	if (unlock.startsWith('prestige:')) {
		const required = parseInt(unlock.split(':')[1], 10)
		return state.totalPrestige >= required
	}


	if (unlock.startsWith('upgrade:')) {
		return branch.upgrades.includes(unlock.split(':')[1])
	}

	return false
}

export function hireStaff(staffTypeId: string, branchId?: BranchId): StaffEntry | null {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	const def = STAFF_MAP[staffTypeId]
	if (!def) return null
	if (!branch) return null

	if (!isStaffUnlocked(staffTypeId, id)) return null
	if (branch.currency < def.hireCost) return null

	const baseStaffCap = 5
	const maxStaff = baseStaffCap + getExtraStaffSlots()
	if (Object.keys(branch.staff).length >= maxStaff) return null

	branch.currency -= def.hireCost

	const rarity = rollRarityFromConfig()
	const entry: StaffEntry = {
		id: generateId('staff_'),
		typeId: staffTypeId,
		level: 1,
		xp: 0,
		pendingLevelUp: false,
		assignedTo: null,
		stats: rollStats(rarity),
		traits: rollTraits(rarity),
		veteran: false,
		veteranPerk: null,
		prestigeSurvivedCount: 0,
		rarity,
	}

	branch.staff[entry.id] = entry
	eventBus.emit('staff:hired', { staff: entry, branch: id })
	return entry
}

export function assignStaff(staffId: string, buildingId: string | null, branchId?: BranchId): boolean {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	if (!branch) return false
	const staff = branch.staff[staffId]
	if (!staff) return false

	staff.assignedTo = buildingId
	eventBus.emit('staff:assign', { staffId, buildingId })
	eventBus.emit('income:update')
	return true
}

export function confirmLevelUp(staffId: string, branchId?: BranchId): boolean {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	if (!branch) return false
	const staff = branch.staff[staffId]
	if (!staff || !staff.pendingLevelUp) return false

	const def = STAFF_MAP[staff.typeId]
	if (!def) return false
	if (staff.level >= def.maxLevel) return false

	const baseCost = getStaffLevelUpCost(staff.typeId, staff.level + 1)
	const traitCostMult = getTraitMultiplier(staff.traits, 'costMult')
	const rarityCostMult = getRarityCostMult(staff.rarity)
	const veteranCostMult = staff.veteran ? getVeteranPerk(staff.veteranPerk).costMult : 1
	const cost = Math.ceil(baseCost * traitCostMult * rarityCostMult * veteranCostMult)
	if (branch.currency < cost) return false

	branch.currency -= cost
	staff.level++
	staff.xp = 0
	staff.pendingLevelUp = false
	eventBus.emit('staff:levelup', { staffId, level: staff.level })
	eventBus.emit('income:update')
	return true
}

export function fireStaff(staffId: string, branchId?: BranchId): boolean {
	const state = gameState.get()
	const id = branchId || state.activeBranch
	const branch = state.branches[id]
	if (!branch) return false
	const staff = branch.staff[staffId]
	if (!staff) return false

	staff.assignedTo = null
	delete branch.staff[staffId]
	eventBus.emit('staff:fired', { staffId, branch: id })
	eventBus.emit('income:update')
	return true
}

export function tickStaffXp(branchId?: BranchId): void {
	const state = gameState.get()


	const branchesToTick = branchId ? [branchId] : state.worldMap.unlockedBranches

	branchesToTick.forEach(targetBranchId => {
		const branch = state.branches[targetBranchId]
		if (!branch) return

		Object.values(branch.staff).forEach(staff => {
			if (!staff.assignedTo) return

			const def = STAFF_MAP[staff.typeId]
			if (!def) return
			if (staff.level >= def.maxLevel) return


			const xpRate = targetBranchId === state.activeBranch ? 1.0 : 0.5
			const traitXpMult = getTraitMultiplier(staff.traits, 'xpMult')
			const skillXpMult = getTotalStaffXpMult()
			const upgradeXpMult = branch.upgrades.includes('trainingGrounds') ? 1.2 : 1.0
			const veteranXpMult = staff.veteran ? getVeteranPerk(staff.veteranPerk).xpMult : 1
			const xpGain = 0.5 * (1 + staff.level * 0.05) * (1 + staff.stats.speed * 0.01) * xpRate * traitXpMult * skillXpMult * upgradeXpMult * getSovereignBuffMult() * veteranXpMult
			staff.xp += xpGain

			const threshold = getStaffXpToNext(staff.level)
			if (staff.xp >= threshold && !staff.pendingLevelUp) {
				staff.pendingLevelUp = true
			}


			if (staff.xp > threshold * 2) {
				staff.xp = threshold * 2
			}
		})
	})
}
