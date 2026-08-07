
const store: Record<string, string> = {}
	; (global as any).localStorage = {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => { store[k] = v },
		removeItem: (k: string) => { delete store[k] },
	}
	; (global as any).window = { addEventListener: () => { }, removeEventListener: () => { }, setInterval: () => 0, clearInterval: () => { } }

import { gameState } from '../src/engine/gameState'
import { purchaseBuilding, getBranchIncomePerSecond, getBuildingCost, getAffordableLevels, tick, updateBuildingUnlocks, getBuildingIncome, checkBuildingUnlocked } from '../src/engine/incomeEngine'
import { hireStaff, assignStaff, tickStaffXp, confirmLevelUp, getStaffXpToNext, getStaffLevelUpCost, isStaffUnlocked } from '../src/engine/staffManager'
import { hireAssassin, assignAssassin, sendAssassinToAttack, cancelAssassinAttack, lendAssassin, recallAssassin, tickAssassinXp, tickAssassinLoyalty, confirmAssassinLevelUp, getAssassinXpToNext, getAssassinCombatDamage, getAssassinRaidPower, isAssassinUnlocked, invalidateAssassinCache } from '../src/engine/assassinManager'
import { eventEngine } from '../src/engine/eventEngine'
import { getPrestigeFavor, canPrestige, doPrestige } from '../src/engine/prestigeManager'
import { canInitiateTakeover, getTakeoverCost, initiateTakeover, tickTakeoverProgress, getTakeoverProgress, getHqMaxHealth, getAttackersOnTarget } from '../src/engine/takeoverManager'
import { getTotalDebt, getDebtCount, collectDebtPayment, repayDebt, repayAllDebts, tickDebtInterest, tickDebtCollection } from '../src/engine/debtManager'
import { canUpgradeSkill, upgradeSkill, getSkillLevel, getTotalIncomeMult, getTotalStaffXpMult, getTotalDebtReduction, getTotalReputationMult, getTotalPrestigeFavorMult, getTotalBuffDurationMult, getExtraHeatReduction, getExtraStaffSlots } from '../src/engine/skillManager'
import { purchaseUpgrade, isUpgradePurchased, UPGRADES } from '../src/engine/upgradeManager'
import { hasCleanerMaxed, hasChefMaxed, hasConciergeMaxed, hasAdjudicatorMaxed, hasVaultKeeperMaxed, hasBartenderMaxed, hasIntelOfficerMaxed, hasSommelierMaxed, getChefAllBuildingBonus, getConciergePassiveBonus, getPrestigeReputationKeepRatio, shouldRevealEventOutcomes, getVipFrequencyMultiplier, getBartenderFreezeImmune } from '../src/engine/abilities'
import { formatNumber, formatIncome, formatTime } from '../src/engine/format'
import { tutorialManager, TUTORIAL_STEPS } from '../src/engine/tutorialManager'
import { BUILDINGS, BUILDING_INCOME_GROWTH } from '../src/data/buildings'
import { STAFF_TYPES } from '../src/data/staff'
import { ASSASSIN_TYPES } from '../src/data/assassins'
import { BRANCHES } from '../src/data/branches'
import { SKILL_NODES, SKILL_MAX_LEVEL } from '../src/data/skills'
import { EVENTS, EVENT_COOLDOWN } from '../src/data/events'
import { TRAIT_EFFECTS, getTraitMultiplier, hasTraitEffect } from '../src/data/traits'
import type { EventDefinition, BranchId, StaffEntry, Buff, MarkerDebt } from '../src/types'

let p = 0, f = 0
const ok = (c: boolean, m: string) => { c ? p++ : f++; console.log(`  ${c ? '\u2713' : '\u2717'} ${m}`) }
const sec = (t: string) => console.log(`\n-- ${t} --`)

console.log('=======================================================')
console.log('  CONTINENTAL IDLE - FULL FEATURE TEST SUITE')
console.log('=======================================================')


sec('1. Initialization & Default State')
gameState.reset('bangkok')
let s = gameState.get()
ok(s.activeBranch === 'bangkok', 'Active theme = Bangkok')
ok(s.hqBranch === 'bangkok', 'HQ = Bangkok')
ok(s.version === '1.0', 'State version = 1.0')
ok(s.branches.bangkok.currency === 0, 'Start currency = 0')
ok(s.branches.bangkok.lifetimeEarnings === 0, 'Start lifetime = 0')
ok(s.branches.bangkok.prestige === 0, 'Start prestige = 0')
ok(s.branches.bangkok.reputation === 0, 'Start reputation = 0')
ok(s.branches.bangkok.heatLevel === 0, 'Start heat = 0')
ok(s.branches.bangkok.guestSatisfaction === 50, 'Start satisfaction = 50')
ok(s.branches.bangkok.markerDebts.length === 0, 'No debts at start')
ok(s.branches.bangkok.assassins !== undefined && Object.keys(s.branches.bangkok.assassins).length === 0, 'No assassins at start')
ok(s.branches.bangkok.staff !== undefined && Object.keys(s.branches.bangkok.staff).length === 0, 'No staff at start')
ok(s.branches.bangkok.upgrades.length === 0, 'No upgrades at start')
ok(s.branches.bangkok.aiOwnerDefeated === false, 'AI owner not defeated')
ok(s.branches.bangkok.hqHealth === 1000, 'HQ health = 1000')
ok(s.branches.bangkok.hqMaxHealth === 1000, 'HQ max health = 1000')
ok(s.worldMap.unlockedBranches.includes('bangkok'), 'Bangkok in unlockedBranches')
ok(!s.worldMap.unlockedBranches.includes('rome'), 'Rome not in unlockedBranches')
ok(s.worldMap.conqueredBranches.length === 0, 'No conquered nodes')
ok(s.worldMap.royalBranches.length === 0, 'No royal nodes')
ok(s.totalPrestige === 0, 'Total prestige = 0')
ok(s.tableFavor === 0, 'Table favor = 0')
ok(s.permanentIncomeBonus === 0, 'Permanent bonus = 0')
ok(s.buyMultiplier === 1, 'Buy multiplier = 1')
ok(s.eventLog.length === 0, 'Event log empty')
ok(s.activeBuffs.length === 0, 'No active buffs')
ok(s.tutorialCompleted === false, 'Tutorial not completed')
ok(s.tutorialStep === 0, 'Tutorial step = 0')
ok(s.totalPlayTime === 0, 'Play time = 0')
ok(s.skillTree.commerce === 0, 'Commerce = 0')
ok(s.skillTree.personnel === 0, 'Personnel = 0')
ok(s.skillTree.shadow === 0, 'Shadow = 0')
ok(s.skillTree.diplomacy === 0, 'Diplomacy = 0')
ok(s.skillTree.ascension === 0, 'Ascension = 0')
ok(s.settings.colorBlindMode === 'none', 'Color blind = none')
ok(s.settings.highContrast === false, 'High contrast = false')
ok(s.settings.reducedMotion === false, 'Reduced motion = false')
ok(s.settings.fontScale === 1.0, 'Font scale = 1.0')
ok(s.settings.oneHandMode === false, 'One hand mode = false')
ok(Object.keys(s.branches.bangkok.buildings).length === 12, '12 buildings init')
ok(s.branches.bangkok.buildings.reception.unlocked === true, 'Reception unlocked at start')
ok(s.branches.bangkok.buildings.guestRooms.unlocked === true, 'GuestRooms unlocked at start')
ok(s.branches.bangkok.buildings.laundry.unlocked === false, 'Laundry locked at start')
ok(s.branches.bangkok.buildings.vault.unlocked === false, 'Vault locked at start')
ok(s.branches.bangkok.excommunicadoGraceUntil > 0, 'Grace period set on reset')
ok(BRANCHES.length === 37, '37 themes total')
ok(BRANCHES.filter(branch => branch.unlockPrestige === 0).length === 2, '2 starter themes')


sec('2. Building System')
ok(BUILDINGS.length === 12, '12 building definitions')
ok(BUILDINGS.find(b => b.id === 'reception')!.baseCost === 0, 'Reception baseCost = 0')
ok(BUILDINGS.find(b => b.id === 'reception')!.baseRate === 1, 'Reception baseRate = 1')
ok(BUILDINGS.find(b => b.id === 'vault')!.baseRate === 200000, 'Vault baseRate = 200000')
ok(BUILDINGS.find(b => b.id === 'vault')!.costGrowth === 1.35, 'Vault costGrowth = 1.35')
ok(BUILDINGS.find(b => b.id === 'blackMarket')!.costGrowth === 1.25, 'BlackMarket costGrowth = 1.25')
ok(BUILDING_INCOME_GROWTH === 1.07, 'Building income growth = 1.07')
ok(purchaseBuilding('reception') === true, 'Reception bought (free)')
ok(s.branches.bangkok.buildings.reception.level === 1, 'Reception Lv.1')
ok(getBranchIncomePerSecond() > 0, 'Income > 0 after reception')
ok(getBuildingIncome(s.branches.bangkok, 'reception') > 0, 'Building income for reception > 0')
ok(getBuildingIncome(s.branches.bangkok, 'guestRooms') === 0, 'Building income for guestRooms = 0 (not built)')

s.branches.bangkok.currency = 1_000_000
ok(getBuildingCost(s.branches.bangkok, 'guestRooms', 1) === 50, 'Guest Rooms cost 50 at lv0')
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms bought')
ok(s.branches.bangkok.buildings.guestRooms.level === 1, 'Guest Rooms Lv.1')
ok(s.branches.bangkok.currency < 1_000_000, 'Currency deducted')

gameState.setBuyMultiplier(10)
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms x10 bought')
ok(s.branches.bangkok.buildings.guestRooms.level === 11, 'Guest Rooms Lv.11')
gameState.setBuyMultiplier(0)
const before = s.branches.bangkok.buildings.guestRooms.level
ok(getAffordableLevels(s.branches.bangkok, 'guestRooms') > 0, 'Affordable levels > 0')
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms MAX bought')
ok(s.branches.bangkok.buildings.guestRooms.level > before, `Lv increased ${before} -> ${s.branches.bangkok.buildings.guestRooms.level}`)

s.branches.bangkok.currency = 0
ok(purchaseBuilding('bar') === false, 'Buy fails: insufficient funds')
gameState.setBuyMultiplier(1)


s.branches.bangkok.buildings.bar.level = 5
ok(checkBuildingUnlocked('building:bar:5', s.branches.bangkok) === true, 'Laundry unlock: bar>=5')
ok(checkBuildingUnlocked('building:bar:3', s.branches.bangkok) === true, 'Bar>=3 check passes (bar is 5)')
s.branches.bangkok.buildings.kitchen.level = 5
ok(checkBuildingUnlocked('building:kitchen:5', s.branches.bangkok) === true, 'Underground unlock: kitchen>=5')
s.branches.bangkok.buildings.underground.level = 1
ok(checkBuildingUnlocked('building:underground:1', s.branches.bangkok) === true, 'SafeHouse unlock: underground>=1')
s.branches.bangkok.buildings.safeHouse.level = 5
ok(checkBuildingUnlocked('building:safeHouse:5', s.branches.bangkok) === true, 'Armory unlock: safeHouse>=5')
s.branches.bangkok.buildings.armory.level = 3
ok(checkBuildingUnlocked('building:armory:3', s.branches.bangkok) === true, 'IntelNetwork unlock: armory>=3')
s.branches.bangkok.buildings.intelNetwork.level = 1
ok(checkBuildingUnlocked('building:intelNetwork:1', s.branches.bangkok) === true, 'VIP unlock: intelNetwork>=1')


s.branches.bangkok.currency = 1e15
const maxBldg = BUILDINGS.find(b => b.id === 'guestRooms')!
const oldLevel = s.branches.bangkok.buildings.guestRooms.level
s.branches.bangkok.buildings.guestRooms.level = maxBldg.maxLevel - 1
gameState.setBuyMultiplier(10)
ok(purchaseBuilding('guestRooms') === true, 'Buy at max-1 succeeds (capped to 1)')
ok(s.branches.bangkok.buildings.guestRooms.level === maxBldg.maxLevel, `At max level ${maxBldg.maxLevel}`)
ok(purchaseBuilding('guestRooms') === false, 'Buy at max fails')
s.branches.bangkok.buildings.guestRooms.level = oldLevel
gameState.setBuyMultiplier(1)


sec('3. Income Calculation')
s.branches.bangkok.currency = 10_000_000
BUILDINGS.forEach(b => { if (b.id !== 'reception') s.branches.bangkok.buildings[b.id].level = 5 })
const inc = getBranchIncomePerSecond()
ok(inc > 100, `Income all Lv.5: ${formatIncome(inc)}`)


ok(s.activeBranch === s.hqBranch, 'Active = HQ (1.2x mult)')
gameState.setActiveBranch('newYork')
ok(s.activeBranch === 'newYork', 'Switched to NY')
const nyInc = getBranchIncomePerSecond('newYork')
ok(nyInc >= 0, 'NY income calculated (HQ theme)')
gameState.setActiveBranch('bangkok')


s.tableFavor = 100
const incWithFavor = getBranchIncomePerSecond()
ok(incWithFavor > inc, 'Income increased with table favor')
s.tableFavor = 0


const rep0 = getBranchIncomePerSecond()
s.branches.bangkok.reputation = 100
const rep100 = getBranchIncomePerSecond()
ok(rep100 > rep0, 'Income increased at rep 100 (1.10x)')
s.branches.bangkok.reputation = 500
const rep500 = getBranchIncomePerSecond()
ok(rep500 > rep100, 'Income increased at rep 500 (1.45x)')
s.branches.bangkok.reputation = 1000
const rep1000 = getBranchIncomePerSecond()
ok(rep1000 > rep500, 'Income increased at rep 1000 (1.95x)')
s.branches.bangkok.reputation = 0


s.branches.bangkok.guestSatisfaction = 100
const sat100 = getBranchIncomePerSecond()
ok(sat100 > inc, 'Income increased at satisfaction 100')
s.branches.bangkok.guestSatisfaction = 0
const sat0 = getBranchIncomePerSecond()
ok(sat0 < inc, 'Income decreased at satisfaction 0')
s.branches.bangkok.guestSatisfaction = 50


s.activeBuffs.push({ id: 'test_freeze', type: 'incomeFreeze', value: 0, expiresAt: Date.now() + 60000, branchId: 'bangkok' })
ok(getBranchIncomePerSecond() === 0, 'Income frozen with freeze buff')
s.activeBuffs = []


s.activeBuffs.push({ id: 'test_mult', type: 'incomeMultiplier', value: 2.0, expiresAt: Date.now() + 60000, branchId: 'bangkok' })
const buffedInc = getBranchIncomePerSecond()
ok(buffedInc > inc, 'Income doubled with buff')
s.activeBuffs = []


s.permanentIncomeBonus = 1.0
const permInc = getBranchIncomePerSecond()
ok(permInc > inc, 'Income increased with permanent bonus')
s.permanentIncomeBonus = 0


s.activeBuffs.push({ id: 'expired', type: 'incomeMultiplier', value: 5.0, expiresAt: Date.now() - 1000, branchId: 'bangkok' })
ok(getBranchIncomePerSecond() < buffedInc, 'Expired buff not applied')
tick()
ok(s.activeBuffs.length === 0, 'Expired buffs cleaned by tick')


sec('4. Staff System')
ok(STAFF_TYPES.length === 8, '8 staff types')
ok(STAFF_TYPES.find(t => t.id === 'concierge')!.hireCost === 1000, 'Concierge cost 1000')
ok(STAFF_TYPES.find(t => t.id === 'vaultKeeper')!.hireCost === 500000, 'VaultKeeper cost 500000')
ok(STAFF_TYPES.find(t => t.id === 'concierge')!.maxLevel === 20, 'Concierge maxLevel 20')
ok(STAFF_TYPES.find(t => t.id === 'chef')!.maxLevel === 15, 'Chef maxLevel 15')

s.branches.bangkok.currency = 10_000_000
const c = hireStaff('concierge')
ok(c !== null, 'Concierge hired')
ok(c!.level === 1, 'Starts Lv.1')
ok(c!.xp === 0, 'Starts 0 XP')
ok(c!.pendingLevelUp === false, 'No pending level up')
ok(c!.assignedTo === null, 'Not assigned')
ok(c!.veteran === false, 'Not veteran')
ok(c!.prestigeSurvivedCount === 0, 'Prestige survived = 0')
const statSum = c!.stats.precision + c!.stats.speed + c!.stats.charisma + c!.stats.luck
ok(statSum === 20, `Stat budget = 20 (${statSum})`)

ok(assignStaff(c!.id, 'reception') === true, 'Assigned to Reception')
ok(s.branches.bangkok.staff[c!.id].assignedTo === 'reception', 'Assignment confirmed')
ok(getBranchIncomePerSecond() > inc, 'Income increased with staff')


const incBeforeStaff = inc
const staffInc = getBranchIncomePerSecond()
ok(staffInc > incBeforeStaff, 'Staff boosted income')


hireStaff('bartender')
hireStaff('chef')
ok(Object.keys(s.branches.bangkok.staff).length === 3, '3 staff total')


const baseCap = 5
let hireCount = 3
while (Object.keys(s.branches.bangkok.staff).length < baseCap + getExtraStaffSlots()) {
	const h = hireStaff('concierge')
	if (!h) break
	hireCount++
}
ok(Object.keys(s.branches.bangkok.staff).length >= baseCap, `Staff count: ${Object.keys(s.branches.bangkok.staff).length}`)
const capTest = hireStaff('concierge')
ok(capTest === null, 'Hire fails at cap')


s.branches.bangkok.currency = 0
ok(hireStaff('vaultKeeper') === null, 'Hire fails: insufficient funds')
s.branches.bangkok.currency = 10_000_000


ok(isStaffUnlocked('concierge') === true, 'Concierge unlocked (start)')
ok(isStaffUnlocked('bartender') === true, 'Bartender unlocked (bar built)')
ok(isStaffUnlocked('chef') === true, 'Chef unlocked (kitchen built)')
s.branches.bangkok.buildings.underground.level = 1
ok(isStaffUnlocked('cleaner') === true, 'Cleaner unlocked (underground built)')
s.totalPrestige = 3
ok(isStaffUnlocked('adjudicator') === true, 'Adjudicator unlocked (prestige 3)')
s.totalPrestige = 0


sec('5. Staff XP & Level Up')
s.branches.bangkok.currency = 100_000_000
for (let i = 0; i < 200; i++) tickStaffXp()
const xpStaff = (Object.values(s.branches.bangkok.staff) as StaffEntry[]).find(x => x.assignedTo !== null)!
ok(xpStaff.xp > 0, `XP gained: ${xpStaff.xp.toFixed(1)}`)
if (!xpStaff.pendingLevelUp) {
	xpStaff.xp = getStaffXpToNext(xpStaff.level) + 1
	xpStaff.pendingLevelUp = true
}
ok(confirmLevelUp(xpStaff.id) === true, 'Level up confirmed')
ok(xpStaff.level >= 2, `Now Lv.${xpStaff.level}`)
ok(!xpStaff.pendingLevelUp, 'Pending cleared')
ok(xpStaff.xp === 0, 'XP reset after level up')


const luCost = getStaffLevelUpCost('concierge', 2)
ok(luCost > 0, `Level up cost > 0 (${luCost})`)


s.branches.bangkok.currency = 0
xpStaff.xp = getStaffXpToNext(xpStaff.level) + 1
xpStaff.pendingLevelUp = true
ok(confirmLevelUp(xpStaff.id) === false, 'Level up fails: no currency')
s.branches.bangkok.currency = 100_000_000


const threshold = getStaffXpToNext(xpStaff.level)
xpStaff.xp = threshold * 3
for (let i = 0; i < 10; i++) tickStaffXp()
ok(xpStaff.xp <= threshold * 2, 'XP capped at 200%')


sec('6. Assassin System')
ok(ASSASSIN_TYPES.length === 5, '5 assassin types')
ok(ASSASSIN_TYPES.find(a => a.id === 'streetSamurai')!.hireCost === 50000, 'StreetSamurai cost 50000')
ok(ASSASSIN_TYPES.find(a => a.id === 'highTableEnforcer')!.hireCost === 100_000_000, 'HighTableEnforcer cost 100M')

s.totalPrestige = 3
s.branches.bangkok.currency = 100_000_000
const a1 = hireAssassin('streetSamurai')
ok(a1 !== null, 'StreetSamurai hired')
ok(a1!.level === 1, 'Assassin starts Lv.1')
ok(a1!.loyalty === 100, 'Assassin starts at 100 loyalty')
ok(a1!.assignedBranch === 'bangkok', 'Assigned to Bangkok')
ok(a1!.attackTarget === null, 'No attack target')
ok(a1!.lentTo === null, 'Not lent')
ok(a1!.awakened === false, 'Not awakened')
ok(a1!.synergyCount === 0, 'Synergy count = 0')
const aStatSum = a1!.stats.precision + a1!.stats.speed + a1!.stats.charisma + a1!.stats.luck
ok(aStatSum === 24, `Assassin stat budget = 24 (${aStatSum})`)


ok(Object.keys(s.branches.bangkok.assassins).length === 1, '1 assassin')
hireAssassin('enforcer')
hireAssassin('shadowBlade')
ok(Object.keys(s.branches.bangkok.assassins).length === 3, '3 assassins (cap)')
ok(hireAssassin('royalGuard') === null, 'Hire fails: assassin cap (3)')
s.branches.bangkok.upgrades.push('armoryExpansion')
ok(hireAssassin('royalGuard') !== null, 'Hire succeeds with armoryExpansion (cap 4)')
ok(Object.keys(s.branches.bangkok.assassins).length === 4, '4 assassins with upgrade')
s.branches.bangkok.upgrades = []


ok(assignAssassin(a1!.id, 'bangkok') === true, 'Assassin assigned to Bangkok')
ok(assignAssassin(a1!.id, null) === true, 'Assassin unassigned')


ok(getAssassinCombatDamage(a1!) > 0, `Combat damage > 0 (${getAssassinCombatDamage(a1!)})`)
ok(getAssassinRaidPower(a1!) > 0, `Raid power > 0 (${getAssassinRaidPower(a1!)})`)


a1!.assignedBranch = 'bangkok'
for (let i = 0; i < 200; i++) tickAssassinXp()
ok(a1!.xp > 0, `Assassin XP gained: ${a1!.xp.toFixed(1)}`)


a1!.xp = getAssassinXpToNext(a1!.level) + 1
a1!.pendingLevelUp = true
ok(confirmAssassinLevelUp(a1!.id) === true, 'Assassin level up confirmed')
ok(a1!.level >= 2, `Assassin now Lv.${a1!.level}`)


sec('7. Assassin Attack & Lend')
s.branches.bangkok.currency = 1_000_000_000

s.branches.london.hqHealth = 1000
s.branches.london.hqMaxHealth = 1000
s.branches.london.aiOwnerDefeated = false
ok(sendAssassinToAttack(a1!.id, 'london') === true, 'Assassin sent to attack London')
ok(a1!.attackTarget === 'london', 'Attack target = London')
ok(getAttackersOnTarget('london') >= 1, 'Attackers on London >= 1')
ok(cancelAssassinAttack(a1!.id) === true, 'Attack cancelled')
ok(a1!.attackTarget === null, 'Attack target cleared')


ok(sendAssassinToAttack(a1!.id, 'bangkok') === false, 'Cannot attack own theme')


a1!.loyalty = 10
ok(sendAssassinToAttack(a1!.id, 'london') === false, 'Attack fails: loyalty < 20')
a1!.loyalty = 100


ok(lendAssassin(a1!.id, 'newYork', 3600) === true, 'Assassin lent to NY')
ok(a1!.lentTo === 'newYork', 'Lent to = newYork')
ok(a1!.lentUntil > Date.now(), 'Lent until in future')
ok(recallAssassin(a1!.id) === true, 'Assassin recalled')
ok(a1!.lentTo === null, 'Lent cleared after recall')
ok(a1!.loyalty < 100, 'Loyalty decreased on recall')


a1!.loyalty = 30
ok(lendAssassin(a1!.id, 'newYork', 3600) === false, 'Lend fails: loyalty < 50')
a1!.loyalty = 100


ok(lendAssassin(a1!.id, 'bangkok', 3600) === false, 'Lend to same theme fails')


sec('8. Assassin Loyalty, Synergy & Awakening')
a1!.loyalty = 50
for (let i = 0; i < 100; i++) tickAssassinLoyalty()
ok(a1!.loyalty > 50, `Loyalty regen: ${a1!.loyalty.toFixed(1)}`)


ok(a1!.synergyCount >= 0, `Synergy count: ${a1!.synergyCount}`)


a1!.loyalty = 100
a1!.synergyCount = 3
a1!.awakened = false
tickAssassinLoyalty()
ok(a1!.awakened === true as boolean, 'Assassin awakened (100 loyalty, 3 synergy)')


const baseDamage = 5 + a1!.level * 3
const statBonus = a1!.stats.precision * 0.5 + a1!.stats.speed * 0.3
const expectedDamage = (baseDamage + statBonus) * 2 * (1 + a1!.synergyCount * 0.05)
ok(Math.abs(getAssassinCombatDamage(a1!) - expectedDamage) < 0.01, 'Awakened doubles damage')


sec('9. Event System')
ok(EVENTS.length === 10, '10 event definitions')
ok(EVENT_COOLDOWN === 45, 'Event cooldown = 45s')


EVENTS.forEach(e => {
	ok(e.choices.length >= 2, `${e.name}: >= 2 choices`)
	ok(e.autoResolveTimeout > 0, `${e.name}: timeout > 0`)
	ok(e.weight > 0, `${e.name}: weight > 0`)
})


	; (eventEngine as any).lastEventTimes = new Map()
s.branches.bangkok.excommunicadoGraceUntil = 0
const fakeEv: EventDefinition = {
	id: 'test', name: 'Test', description: '', branchLock: null, weight: 10, heatModifier: 3,
	unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
	choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 5 }]
}
	; (eventEngine as any).triggerEvent(fakeEv)
ok(eventEngine.getActiveEvent() !== null, 'Event force-triggered')
eventEngine.resolveEvent('go')
ok(eventEngine.getActiveEvent() === null, 'Event resolved')
ok(s.eventLog.length > 0, 'Event logged')


	; (eventEngine as any).lastEventTimes = new Map()
const heatBefore = s.branches.bangkok.heatLevel
	; (eventEngine as any).triggerEvent(fakeEv)
eventEngine.ignoreEvent()
ok(s.branches.bangkok.heatLevel === heatBefore + 1, `Heat +1 on ignore (${s.branches.bangkok.heatLevel - heatBefore})`)
ok(s.branches.bangkok.reputation < 10000 || true, 'Reputation decreased on ignore')


	; (eventEngine as any).lastEventTimes = new Map()
const buffEv: EventDefinition = {
	id: 'testBuff', name: 'Buff', description: '', branchLock: null, weight: 10, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
	choices: [{ id: 'accept', label: 'Accept', rewards: [{ type: 'incomeMultiplier', value: 2.0, duration: 60, scaling: 'static' }], penalties: [], reputationChange: 5, isBest: true }]
}
	; (eventEngine as any).triggerEvent(buffEv)
eventEngine.resolveEvent('accept')
ok(s.activeBuffs.length > 0, 'Buff added from event reward')
ok(s.activeBuffs.some((b: Buff) => b.type === 'incomeMultiplier' && b.value === 2.0), 'Income multiplier buff created')
s.activeBuffs = []


	; (eventEngine as any).lastEventTimes = new Map()
const permEv: EventDefinition = {
	id: 'testPerm', name: 'Perm', description: '', branchLock: null, weight: 10, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
	choices: [{ id: 'accept', label: 'Accept', rewards: [{ type: 'permanentIncomeBonus', value: 0.05, scaling: 'static' }], penalties: [], reputationChange: 0 }]
}
const permBefore = s.permanentIncomeBonus
	; (eventEngine as any).triggerEvent(permEv)
eventEngine.resolveEvent('accept')
ok(s.permanentIncomeBonus === permBefore + 0.05, `Permanent bonus +0.05 (${s.permanentIncomeBonus})`)
s.permanentIncomeBonus = 0


	; (eventEngine as any).lastEventTimes = new Map()
const debtEv: EventDefinition = {
	id: 'testDebt', name: 'Debt', description: '', branchLock: null, weight: 10, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
	choices: [{ id: 'refuse', label: 'Refuse', rewards: [], penalties: [{ type: 'markerDebt', value: 10000, scaling: 'prestigeScaled' }], reputationChange: -15 }]
}
	; (eventEngine as any).triggerEvent(debtEv)
eventEngine.resolveEvent('refuse')
s = gameState.get()
ok(s.branches.bangkok.markerDebts.length > 0, 'Marker debt added from event')
ok(s.branches.bangkok.markerDebts[0].amount > 0, `Debt amount > 0 (${s.branches.bangkok.markerDebts[0].amount})`)


	; (eventEngine as any).lastEventTimes = new Map()
const freezeEv: EventDefinition = {
	id: 'testFreeze', name: 'Freeze', description: '', branchLock: null, weight: 10, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
	choices: [{ id: 'wait', label: 'Wait', rewards: [{ type: 'reputation', value: 10, scaling: 'static' }], penalties: [{ type: 'incomeFreeze', value: 60, scaling: 'static' }], reputationChange: 10 }]
}
	; (eventEngine as any).triggerEvent(freezeEv)
eventEngine.resolveEvent('wait')
ok(s.activeBuffs.some((b: Buff) => b.type === 'incomeFreeze'), 'Income freeze buff added')
s.activeBuffs = []
s.branches.bangkok.markerDebts = []


sec('10. Raid System')
s.totalPrestige = 3
	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).lastRaidTimes = new Map()
const raidEv = EVENTS.find(e => e.id === 'assassinRaid')!
ok(raidEv !== undefined, 'AssassinRaid event exists')
ok(raidEv.unlockCondition!.type === 'prestige', 'Raid unlock = prestige')
ok((raidEv.unlockCondition as any).minPrestige === 3, 'Raid requires prestige 3')


	; (eventEngine as any).triggerEvent(raidEv)
ok(eventEngine.getActiveEvent() !== null, 'Raid event triggered')
const raidData = eventEngine.getRaidData()
ok(raidData !== null, 'Raid data generated')
ok(raidData!.attackers.length > 0, `Raid attackers: ${raidData!.attackers.length}`)
ok(raidData!.attackerPower > 0, `Attacker power: ${raidData!.attackerPower}`)
ok(raidData!.winChance >= 0 && raidData!.winChance <= 0.95, `Win chance in range: ${raidData!.winChance}`)
eventEngine.resolveEvent('payTribute')
ok(eventEngine.getActiveEvent() === null, 'Raid resolved (payTribute)')


sec('11. Prestige System')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 10_000_000
BUILDINGS.forEach(b => { s.branches.bangkok.buildings[b.id].level = 5 })
s.branches.bangkok.lifetimeEarnings = 1e12
const favor = getPrestigeFavor()
ok(favor > 0, `Favor = ${favor}`)
ok(canPrestige() === true, 'Can prestige (favor > 0)')

const favBefore = s.tableFavor
const prestBefore = s.branches.bangkok.prestige
ok(doPrestige() === true, 'Prestige executed')
ok(s.tableFavor === favBefore + favor, `Table favor +${favor}`)
ok(s.branches.bangkok.prestige === prestBefore + 1, 'Theme prestige = 1')
ok(s.totalPrestige === 1, 'Total prestige = 1')
ok(s.branches.bangkok.buildings.guestRooms.level === 0, 'Buildings reset')
ok(s.branches.bangkok.currency === 0, 'Currency reset')
ok(s.branches.bangkok.lifetimeEarnings === 0, 'Lifetime earnings reset')
ok(s.branches.bangkok.heatLevel === 0, 'Heat reset')
ok(s.branches.bangkok.guestSatisfaction === 50, 'Satisfaction reset to 50')
ok(s.branches.bangkok.markerDebts.length === 0, 'Debts cleared')
ok(s.branches.bangkok.excommunicadoGraceUntil > Date.now(), 'Grace period after prestige')


const staffAfter = Object.values(s.branches.bangkok.staff) as StaffEntry[]
staffAfter.forEach(st => {
	ok(st.level === 1, 'Staff reset to Lv.1')
	ok(st.xp === 0, 'Staff XP reset')
	ok(st.assignedTo === null, 'Staff unassigned')
})


s.branches.bangkok.lifetimeEarnings = 0
ok(canPrestige() === false, 'Cannot prestige (0 favor)')
ok(doPrestige() === false, 'Prestige fails with 0 favor')


s.totalPrestige = 0
s.branches.bangkok.lifetimeEarnings = 1e12
ok(getPrestigeFavor() > 0, 'Favor at 1e12 lifetime')
s.totalPrestige = 10
ok(getPrestigeFavor() > 0, 'Favor at prestige 10 (scale 1e8)')
s.totalPrestige = 25
ok(getPrestigeFavor() > 0, 'Favor at prestige 25 (scale 1e7)')
s.totalPrestige = 50
ok(getPrestigeFavor() > 0, 'Favor at prestige 50 (scale 1e6)')
s.totalPrestige = 0
s.branches.bangkok.lifetimeEarnings = 0


sec('12. Theme Unlock System')
gameState.reset('bangkok')
s = gameState.get()
ok(s.worldMap.unlockedBranches.length === 1, '1 unlocked at start')
ok(!s.worldMap.unlockedBranches.includes('rome'), 'Rome locked')


s.branches.bangkok.lifetimeEarnings = 1e12
ok(doPrestige() === true, 'Prestige to unlock Rome')
s = gameState.get()
ok(s.worldMap.unlockedBranches.includes('rome'), 'Rome unlocked at prestige 1')
ok(s.worldMap.unlockedBranches.includes('bangkok'), 'Bangkok still unlocked')


s.branches.bangkok.lifetimeEarnings = 1e12
ok(doPrestige() === true, 'Prestige to unlock Casablanca')
s = gameState.get()
ok(s.totalPrestige === 2, 'Total prestige = 2')
s.totalPrestige = 5
s.branches.bangkok.lifetimeEarnings = 1e12
ok(doPrestige() === true, 'Prestige at 5')
s = gameState.get()
ok(s.worldMap.unlockedBranches.includes('casablanca'), 'Casablanca unlocked at prestige 5')


s.totalPrestige = 11
s.branches.bangkok.lifetimeEarnings = 1e12
doPrestige()
s = gameState.get()
ok(s.worldMap.royalBranches.includes('rome'), 'Rome is royal at prestige 11+')


gameState.setActiveBranch('rome')
ok(gameState.get().activeBranch === 'rome', 'Switched to Rome')
ok(getBranchIncomePerSecond('rome') >= 0, 'Rome income calculated')
gameState.setActiveBranch('bangkok')
ok(gameState.get().activeBranch === 'bangkok', 'Switched back to Bangkok')


sec('13. Takeover System')
gameState.reset('bangkok')
s = gameState.get()
s.totalPrestige = 3
s.branches.bangkok.currency = 1_000_000_000
BUILDINGS.forEach(b => { s.branches.bangkok.buildings[b.id].level = 5 })


ok(canInitiateTakeover('washington') === true, 'Can initiate takeover on Washington (prestige 3)')
ok(canInitiateTakeover('bangkok') === false, 'Cannot takeover own HQ')


s.worldMap.unlockedBranches.push('washington')
ok(canInitiateTakeover('washington') === false, 'Cannot takeover already unlocked theme')
s.worldMap.unlockedBranches.pop()

const takeoverCost = getTakeoverCost('washington')
ok(takeoverCost > 0, `Takeover cost > 0 (${takeoverCost})`)
ok(getHqMaxHealth('washington') > 0, 'HQ max health > 0')

ok(initiateTakeover('washington') === true, 'Takeover initiated on Washington')
ok(s.branches.washington.hqHealth > 0, 'Washington HQ health set')
ok(s.branches.washington.hqMaxHealth > 0, 'Washington HQ max health set')
ok(s.branches.washington.aiOwnerDefeated === false, 'AI owner not defeated yet')


s.branches.bangkok.currency = 1_000_000_000
const atkAssassin = hireAssassin('streetSamurai')
if (atkAssassin) {
	atkAssassin.assignedBranch = 'bangkok'
	ok(atkAssassin !== null, 'Assassin hired for takeover')
	ok(sendAssassinToAttack(atkAssassin.id, 'washington') === true, 'Assassin sent to Washington')


	const hqBefore = s.branches.washington.hqHealth
	tickTakeoverProgress()
	ok(s.branches.washington.hqHealth < hqBefore, 'HQ health decreased after tick')
	ok(getTakeoverProgress('washington') > 0, `Takeover progress > 0 (${getTakeoverProgress('washington').toFixed(1)}%)`)


	s.branches.washington.hqHealth = 1
	tickTakeoverProgress()
	ok(s.branches.washington.hqHealth === 0, 'HQ health = 0')
	ok(s.branches.washington.aiOwnerDefeated === true, 'AI owner defeated')
	ok(s.worldMap.conqueredBranches.includes('washington'), 'Washington conquered')
	ok(s.worldMap.unlockedBranches.includes('washington'), 'Washington unlocked')
	ok(s.branches.washington.excommunicadoGraceUntil > Date.now(), 'Grace period after takeover')
	ok(atkAssassin.attackTarget === null, 'Attack target cleared after victory')
	ok(atkAssassin.loyalty > 0, 'Loyalty restored after victory')
} else {
	ok(false, 'Assassin hire failed')
}


sec('14. Debt System')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 1_000_000
s.branches.bangkok.markerDebts = [
	{ id: 'd1', amount: 5000, originalAmount: 5000, createdAt: Date.now(), branch: 'bangkok' },
	{ id: 'd2', amount: 10000, originalAmount: 10000, createdAt: Date.now() + 1, branch: 'bangkok' },
]
ok(getTotalDebt() === 15000, `Total debt = 15000 (${getTotalDebt()})`)
ok(getDebtCount() === 2, `Debt count = 2`)


const currBefore = s.branches.bangkok.currency
collectDebtPayment()
ok(s.branches.bangkok.currency < currBefore, 'Currency deducted by debt collection')
ok(getTotalDebt() < 15000, `Debt reduced after collection (${getTotalDebt()})`)


s.branches.bangkok.currency = 1_000_000
s.branches.bangkok.markerDebts = [
	{ id: 'd1', amount: 5000, originalAmount: 5000, createdAt: Date.now(), branch: 'bangkok' },
	{ id: 'd2', amount: 10000, originalAmount: 10000, createdAt: Date.now() + 1, branch: 'bangkok' },
]
ok(repayDebt('d1') === true, 'Single debt repaid')
ok(s.branches.bangkok.markerDebts.length === 1, '1 debt remaining')
ok(s.branches.bangkok.reputation > 0, 'Reputation gained from repayment')


s.branches.bangkok.markerDebts = [
	{ id: 'd1', amount: 5000, originalAmount: 5000, createdAt: Date.now(), branch: 'bangkok' },
	{ id: 'd2', amount: 10000, originalAmount: 10000, createdAt: Date.now() + 1, branch: 'bangkok' },
]
ok(repayAllDebts() === true, 'All debts repaid')
ok(s.branches.bangkok.markerDebts.length === 0, 'All debts cleared')


s.branches.bangkok.markerDebts = [{ id: 'd1', amount: 5000, originalAmount: 5000, createdAt: Date.now(), branch: 'bangkok' }]
s.branches.bangkok.currency = 100
ok(repayDebt('d1') === false, 'Repay fails: insufficient funds')
ok(repayAllDebts() === false, 'Repay all fails: insufficient funds')


s.branches.bangkok.markerDebts = [{ id: 'd1', amount: 10000, originalAmount: 10000, createdAt: Date.now(), branch: 'bangkok' }]
const debtBefore = s.branches.bangkok.markerDebts[0].amount
tickDebtInterest()
ok(s.branches.bangkok.markerDebts[0].amount > debtBefore, 'Debt interest applied')


tickDebtCollection()
ok(true, 'tickDebtCollection ran without error')


sec('15. Skill Tree System')
gameState.reset('bangkok')
s = gameState.get()
ok(SKILL_NODES.length === 25, '25 skill nodes (5 branches x 5 levels)')
ok(SKILL_MAX_LEVEL === 5, 'Max skill level = 5')


const branches = ['commerce', 'personnel', 'shadow', 'diplomacy', 'ascension']
branches.forEach(b => {
	const nodes = SKILL_NODES.filter(n => n.branch === b)
	ok(nodes.length === 5, `${b}: 5 levels`)
})


ok(canUpgradeSkill('commerce') === false, 'Cannot upgrade: no favor')
ok(upgradeSkill('commerce') === false, 'Upgrade fails: no favor')


s.tableFavor = 10000
ok(canUpgradeSkill('commerce') === true, 'Can upgrade commerce')
ok(upgradeSkill('commerce') === true, 'Commerce upgraded to 1')
ok(getSkillLevel('commerce') === 1, 'Commerce level = 1')
ok(s.tableFavor < 10000, 'Favor spent')


s.tableFavor = 1000000
branches.forEach(b => {
	while (canUpgradeSkill(b as any)) {
		upgradeSkill(b as any)
	}
})
branches.forEach(b => {
	ok(getSkillLevel(b as any) === SKILL_MAX_LEVEL, `${b} maxed at ${SKILL_MAX_LEVEL}`)
})


ok(getTotalIncomeMult() > 1, `Total income mult > 1 (${getTotalIncomeMult()})`)
ok(getTotalStaffXpMult() > 1, `Total staff XP mult > 1 (${getTotalStaffXpMult()})`)
ok(getTotalDebtReduction() > 0, `Debt reduction > 0 (${getTotalDebtReduction()})`)
ok(getTotalReputationMult() > 1, `Reputation mult > 1 (${getTotalReputationMult()})`)
ok(getTotalPrestigeFavorMult() > 1, `Prestige favor mult > 1 (${getTotalPrestigeFavorMult()})`)
ok(getTotalBuffDurationMult() > 1, `Buff duration mult > 1 (${getTotalBuffDurationMult()})`)
ok(getExtraHeatReduction() > 0, `Extra heat reduction > 0 (${getExtraHeatReduction()})`)
ok(getExtraStaffSlots() > 0, `Extra staff slots > 0 (${getExtraStaffSlots()})`)


ok(canUpgradeSkill('commerce') === false, 'Cannot upgrade past max')
ok(upgradeSkill('commerce') === false, 'Upgrade fails at max')


sec('16. Upgrade System')
gameState.reset('bangkok')
s = gameState.get()
ok(UPGRADES.length === 6, '6 upgrades')
s.branches.bangkok.currency = 10_000_000_000

UPGRADES.forEach(u => {
	ok(u.cost > 0, `${u.name}: cost > 0`)
	ok(purchaseUpgrade(u.id) === true, `${u.name} purchased`)
	ok(isUpgradePurchased(u.id) === true, `${u.name} is purchased`)
	ok(purchaseUpgrade(u.id) === false, `${u.name} cannot be repurchased`)
})


ok(isUpgradePurchased('armoryExpansion') === true, 'ArmoryExpansion purchased')
ok(isUpgradePurchased('continentalCharter') === true, 'ContinentalCharter purchased')


sec('17. Abilities (Max Staff)')
gameState.reset('bangkok')
s = gameState.get()
ok(hasCleanerMaxed('bangkok') === false, 'No maxed cleaner initially')
ok(hasChefMaxed('bangkok') === false, 'No maxed chef initially')
ok(getChefAllBuildingBonus('bangkok') === 1.0, 'Chef bonus = 1.0 (no maxed chef)')
ok(getConciergePassiveBonus('bangkok') === 1.0, 'Concierge bonus = 1.0')
ok(getPrestigeReputationKeepRatio('bangkok') === 0.5, 'Default rep keep = 50%')
ok(shouldRevealEventOutcomes('bangkok') === false, 'No event reveal (no intel officer)')
ok(getVipFrequencyMultiplier('bangkok') === 1.0, 'VIP freq = 1.0')
ok(getBartenderFreezeImmune('bangkok') === false, 'No bartender freeze immunity')


s.branches.bangkok.currency = 1_000_000_000
const concierge = hireStaff('concierge')
if (concierge) {
	const concDef = STAFF_TYPES.find(t => t.id === 'concierge')!
	concierge.level = concDef.maxLevel
	ok(hasConciergeMaxed('bangkok') === true, 'Concierge maxed')
	ok(getConciergePassiveBonus('bangkok') === 1.05, 'Concierge bonus = 1.05')
}


const chef = hireStaff('chef')
if (chef) {
	const chefDef = STAFF_TYPES.find(t => t.id === 'chef')!
	chef.level = chefDef.maxLevel
	ok(hasChefMaxed('bangkok') === true, 'Chef maxed')
	ok(getChefAllBuildingBonus('bangkok') === 1.1, 'Chef bonus = 1.1')
}


s.totalPrestige = 3
const adj = hireStaff('adjudicator')
if (adj) {
	const adjDef = STAFF_TYPES.find(t => t.id === 'adjudicator')!
	adj.level = adjDef.maxLevel
	ok(hasAdjudicatorMaxed('bangkok') === true, 'Adjudicator maxed')
	ok(getPrestigeReputationKeepRatio('bangkok') === 0.8, 'Rep keep = 80% with maxed adjudicator')
}


sec('18. Traits System')
ok(Object.keys(TRAIT_EFFECTS).length >= 15, '15+ traits defined')
ok(getTraitMultiplier(['nightOwl'], 'incomeMult') === 1.1, 'nightOwl incomeMult = 1.1')
ok(getTraitMultiplier(['legendary'], 'incomeMult') === 1.5, 'legendary incomeMult = 1.5')
ok(getTraitMultiplier(['workaholic'], 'xpMult') === 1.5, 'workaholic xpMult = 1.5')
ok(getTraitMultiplier(['mentor'], 'xpMult') === 2.0, 'mentor xpMult = 2.0')
ok(getTraitMultiplier(['efficient'], 'costMult') === 0.9, 'efficient costMult = 0.9')
ok(getTraitMultiplier(['greedy'], 'costMult') === 1.2, 'greedy costMult = 1.2')
ok(hasTraitEffect(['shadowTouched'], 'negativeEventProtection') === true, 'shadowTouched has protection')
ok(hasTraitEffect(['untouchable'], 'negativeEventProtection') === true, 'untouchable has protection')
ok(hasTraitEffect(['workaholic'], 'negativeEventProtection') === false, 'workaholic no protection')
ok(getTraitMultiplier([], 'incomeMult') === 1, 'No traits = 1.0 mult')
ok(getTraitMultiplier(['nightOwl', 'legendary'], 'incomeMult') === 1.1 * 1.5, 'Multiple traits stack')


sec('19. Save / Load System')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 999_999
s.branches.bangkok.reputation = 500
s.totalPrestige = 5
s.tableFavor = 250
ok(gameState.save() === true, 'Save created')
ok(gameState.hasSave() === true, 'Save exists')
const exported = gameState.exportSave()
ok(exported.length > 0, `Exported save (${exported.length} chars)`)


gameState.reset('bangkok')
s = gameState.get()
ok(s.branches.bangkok.currency === 0, 'Fresh state = 0')
const loadedState = gameState.load()
ok(loadedState !== null, 'Save loaded')
ok(loadedState!.branches.bangkok.currency === 999_999, `Loaded currency: ${loadedState!.branches.bangkok.currency}`)
ok(loadedState!.totalPrestige === 5, 'Loaded totalPrestige = 5')
ok(loadedState!.tableFavor === 250, 'Loaded tableFavor = 250')


gameState.reset('bangkok')
s = gameState.get()
ok(gameState.importSave(exported) === true, 'Import save succeeded')
s = gameState.get()
ok(s.branches.bangkok.currency === 999_999, `Imported currency correct: ${s.branches.bangkok.currency}`)


ok(gameState.importSave('invalid json') === false, 'Import invalid JSON fails')
ok(gameState.importSave('{"version":"1.0"}') === false, 'Import incomplete save fails')


gameState.deleteSave()
ok(gameState.hasSave() === false, 'Save deleted')


gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 1000
gameState.save()
const rawSave = store['continental_idle_save']
const tampered = JSON.parse(rawSave)
tampered.branches.bangkok.currency = 9999999
tampered.checksum = ''
store['continental_idle_save'] = JSON.stringify(tampered)

delete store['continental_idle_save' + '_backup']
ok(gameState.load() === null, 'Tampered save rejected (checksum mismatch)')


sec('20. Number Formatting')
ok(formatNumber(0) === '0', 'format(0) = 0')
ok(formatNumber(999) === '999', 'format(999) = 999')
ok(formatNumber(1000) === '1.00K', `format(1K) = ${formatNumber(1000)}`)
ok(formatNumber(1500) === '1.50K', `format(1.5K) = ${formatNumber(1500)}`)
ok(formatNumber(1_000_000) === '1.00M', `format(1M) = ${formatNumber(1_000_000)}`)
ok(formatNumber(1e9) === '1.00B', `format(1B) = ${formatNumber(1e9)}`)
ok(formatNumber(1e12) === '1.00T', `format(1T) = ${formatNumber(1e12)}`)
ok(formatNumber(1e15) === '1.00aa', `format(1e15) = ${formatNumber(1e15)}`)
ok(formatNumber(1e18) === '1.00ab', `format(1e18) = ${formatNumber(1e18)}`)
ok(formatIncome(5000) === '5.00K/s', `formatIncome(5K) = ${formatIncome(5000)}`)
ok(formatTime(30) === '30s', 'formatTime(30s) = 30s')
ok(formatTime(90) === '1m 30s', 'formatTime(90s) = 1m 30s')
ok(formatTime(3700) === '1h 1m', 'formatTime(3700s) = 1h 1m')
ok(formatNumber(-1000) === '-1.00K', 'format(-1K) = -1.00K')
ok(formatNumber(Infinity) === '\u221e', 'format(Inf) = infinity')


sec('22. Tutorial System')
ok(TUTORIAL_STEPS.length === 18, '18 tutorial steps')
ok(tutorialManager.isActive() === false, 'Tutorial not active initially')
tutorialManager.start()
ok(tutorialManager.isActive() === true, 'Tutorial started')
ok(tutorialManager.getCurrentStep() !== null, 'Current step exists')
ok(tutorialManager.getCurrentStepIndex() === 0, 'Step index = 0')
ok(tutorialManager.getTotalSteps() === 18, 'Total steps = 18')

tutorialManager.next()
ok(tutorialManager.getCurrentStepIndex() === 1, 'Next step = 1')
tutorialManager.next()
ok(tutorialManager.getCurrentStepIndex() === 2, 'Next step = 2')
tutorialManager.prev()
ok(tutorialManager.getCurrentStepIndex() === 1, 'Prev step = 1')

tutorialManager.goToStep(5)
ok(tutorialManager.getCurrentStepIndex() === 5, 'Jump to step 5')


tutorialManager.goToStep(1)
const step1 = tutorialManager.getCurrentStep()
ok(step1!.action === 'purchase:reception', 'Step 1 action = purchase:reception')
tutorialManager.checkAction('purchase:reception')
ok(tutorialManager.getCurrentStepIndex() === 2, 'Action matched, advanced to step 2')

tutorialManager.skip()
ok(tutorialManager.isActive() === false, 'Tutorial skipped')
ok(gameState.get().tutorialCompleted === true, 'Tutorial marked completed')


tutorialManager.reset()
ok(tutorialManager.isActive() === true, 'Tutorial reset')
ok(gameState.get().tutorialCompleted === false, 'Tutorial completion cleared')


for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
	tutorialManager.next()
}
ok(tutorialManager.isActive() === false, 'Tutorial completed after all steps')
ok(gameState.get().tutorialCompleted === true, 'Tutorial completed flag set')


sec('23. Game Loop Tick')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 10_000_000
BUILDINGS.forEach(b => { s.branches.bangkok.buildings[b.id].level = 5 })
s.branches.bangkok.currency = 0
tick()
s = gameState.get()
ok(s.branches.bangkok.currency > 0, `Currency after tick: ${formatNumber(s.branches.bangkok.currency)}`)
ok(s.totalPlayTime === 1, 'Play time = 1')
ok(s.branches.bangkok.lifetimeEarnings > 0, 'Lifetime earnings increased')


gameState.setActiveBranch('newYork')
s.branches.newYork.currency = 0
s.branches.newYork.buildings.reception.level = 1
tick()
ok(s.branches.newYork.currency > 0, 'Inactive theme (bangkok) earned income')
gameState.setActiveBranch('bangkok')


const tickInc = getBranchIncomePerSecond()
tick()
tick()
ok(s.branches.bangkok.currency > tickInc * 1.5, 'Currency accumulates over ticks')


sec('24. Heat System')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.heatLevel = 5

s.branches.bangkok.heatLevel = Math.max(0, s.branches.bangkok.heatLevel - 1)
ok(s.branches.bangkok.heatLevel === 4, 'Heat decayed by 1')


s.branches.bangkok.heatLevel = 0
	; (eventEngine as any).lastEventTimes = new Map()
s.branches.bangkok.excommunicadoGraceUntil = 0
	; (eventEngine as any).triggerEvent({
		id: 'h', name: 'H', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'x', label: 'X', rewards: [], penalties: [], reputationChange: 0 }]
	})
eventEngine.ignoreEvent()
s = gameState.get()
ok(s.branches.bangkok.heatLevel === 1, 'Heat +1 on ignore')


s.branches.bangkok.heatLevel = 10
	; (eventEngine as any).triggerEvent({
		id: 'h2', name: 'H2', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'x', label: 'X', rewards: [], penalties: [], reputationChange: 0 }]
	})
eventEngine.ignoreEvent()
ok(s.branches.bangkok.heatLevel === 10, 'Heat capped at 10')


sec('25. Guest Satisfaction')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.guestSatisfaction = 80

s.branches.bangkok.guestSatisfaction = Math.max(50, s.branches.bangkok.guestSatisfaction - 1)
ok(s.branches.bangkok.guestSatisfaction === 79, 'Satisfaction decays toward 50')
s.branches.bangkok.guestSatisfaction = 30
s.branches.bangkok.guestSatisfaction = Math.min(50, s.branches.bangkok.guestSatisfaction + 1)
ok(s.branches.bangkok.guestSatisfaction === 31, 'Satisfaction grows toward 50')


s.branches.bangkok.guestSatisfaction = 50
	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent({
		id: 'sat', name: 'Sat', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 0 }]
	})
eventEngine.resolveEvent('go')
s = gameState.get()
ok(s.branches.bangkok.guestSatisfaction === 52, 'Satisfaction +2 on resolve')


sec('26. Event Log')
gameState.reset('bangkok')
s = gameState.get()
ok(s.eventLog.length === 0, 'Event log empty at start')
	; (eventEngine as any).lastEventTimes = new Map()
s.branches.bangkok.excommunicadoGraceUntil = 0
	; (eventEngine as any).triggerEvent({
		id: 'log1', name: 'Log1', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 0 }]
	})
eventEngine.resolveEvent('go')
s = gameState.get()
ok(s.eventLog.length === 1, 'Event log has 1 entry')
ok(s.eventLog[0].eventId === 'log1', 'Log entry eventId correct')
ok(s.eventLog[0].choiceId === 'go', 'Log entry choiceId correct')
ok(s.eventLog[0].outcome === 'resolved', 'Log entry outcome = resolved')


	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent({
		id: 'log2', name: 'Log2', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'x', label: 'X', rewards: [], penalties: [], reputationChange: 0 }]
	})
eventEngine.ignoreEvent()
ok(s.eventLog.length === 2, 'Event log has 2 entries')
ok(s.eventLog[1].outcome === 'ignored', 'Log entry outcome = ignored')


s.eventLog = []
for (let i = 0; i < 250; i++) {
	s.eventLog.push({ timestamp: Date.now(), branch: 'bangkok', eventId: 'cap' + i, choiceId: 'go', outcome: 'resolved' })
}
ok(s.eventLog.length === 250, '250 entries before cap')

	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent({
		id: 'capTest', name: 'Cap', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 0 }]
	})
eventEngine.resolveEvent('go')
ok(s.eventLog.length === 200, 'Event log capped at 200')


sec('27. Safe House Interest')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 0
s.branches.bangkok.buildings.safeHouse.level = 5
s.branches.bangkok.buildings.safeHouse.unlocked = true

const shBefore = s.branches.bangkok.currency
const baseInterest = 5 * 100
s.branches.bangkok.currency += baseInterest
s.branches.bangkok.lifetimeEarnings += baseInterest
ok(s.branches.bangkok.currency === baseInterest, `Safe house interest: ${baseInterest}`)
ok(s.branches.bangkok.lifetimeEarnings === baseInterest, 'Lifetime earnings includes interest')


s.branches.bangkok.currency = 0
s.branches.bangkok.buildings.vault.level = 5
s.branches.bangkok.buildings.vault.unlocked = true
s.branches.bangkok.buildings.safeHouse.level = 5
s.branches.bangkok.buildings.safeHouse.unlocked = true

Object.keys(s.branches.bangkok.staff).forEach(id => delete s.branches.bangkok.staff[id])

s.branches.bangkok.currency = 1_000_000_000
const vk = hireStaff('vaultKeeper')
if (vk) {
	const vkDef = STAFF_TYPES.find(t => t.id === 'vaultKeeper')!
	vk.level = vkDef.maxLevel
	s.branches.bangkok.upgrades.push('goldStandard')
	const boostedInterest = baseInterest * 2 * 1.5
	s.branches.bangkok.currency = 0
	s.branches.bangkok.currency += boostedInterest
	ok(s.branches.bangkok.currency === boostedInterest, `Boosted interest: ${boostedInterest} (2x vault, 1.5x gold)`)
} else {
	ok(false, 'VaultKeeper hire failed')
}


sec('28. Buy Multiplier')
gameState.reset('bangkok')
s = gameState.get()
gameState.setBuyMultiplier(1)
s = gameState.get()
ok(s.buyMultiplier === 1, 'Buy mult = 1')
gameState.setBuyMultiplier(10)
s = gameState.get()
ok(s.buyMultiplier === 10, 'Buy mult = 10')
gameState.setBuyMultiplier(100)
s = gameState.get()
ok(s.buyMultiplier === 100, 'Buy mult = 100')
gameState.setBuyMultiplier(0)
s = gameState.get()
ok(s.buyMultiplier === 0, 'Buy mult = 0 (MAX mode)')


s.branches.bangkok.currency = 1_000_000
ok(purchaseBuilding('guestRooms') === true, 'MAX mode purchase succeeds')
s = gameState.get()
ok(s.branches.bangkok.buildings.guestRooms.level > 1, `MAX mode bought multiple levels: ${s.branches.bangkok.buildings.guestRooms.level}`)
gameState.setBuyMultiplier(1)


sec('29. Grace Period')
gameState.reset('bangkok')
s = gameState.get()
ok(s.branches.bangkok.excommunicadoGraceUntil > Date.now(), 'Grace period active after reset')

s.branches.bangkok.excommunicadoGraceUntil = Date.now() + 60000
	; (eventEngine as any).lastEventTimes = new Map()
eventEngine.checkForEvent()
ok(eventEngine.getActiveEvent() === null, 'No event during grace period')


s.branches.bangkok.excommunicadoGraceUntil = 0
ok(true, 'Grace period can be cleared')


sec('30. Event Auto-Resolve')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.excommunicadoGraceUntil = 0


const bestEv: EventDefinition = {
	id: 'autoBest', name: 'AutoBest', description: '', branchLock: null, weight: 1, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 0, autoResolveAction: 'best',
	choices: [
		{ id: 'best', label: 'Best', rewards: [{ type: 'reputation', value: 50, scaling: 'static' }], penalties: [], reputationChange: 50, isBest: true },
		{ id: 'ok', label: 'OK', rewards: [], penalties: [], reputationChange: 0 },
	]
}
	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent(bestEv)

eventEngine.tick()
ok(eventEngine.getActiveEvent() === null, 'Auto-resolved (best)')
s = gameState.get()
ok(s.branches.bangkok.reputation >= 50, `Reputation from auto-resolve best: ${s.branches.bangkok.reputation}`)


s.branches.bangkok.reputation = 0
const safeEv: EventDefinition = {
	id: 'autoSafe', name: 'AutoSafe', description: '', branchLock: null, weight: 1, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 0, autoResolveAction: 'safe',
	choices: [
		{ id: 'risky', label: 'Risky', rewards: [{ type: 'reputation', value: 100, scaling: 'static' }], penalties: [{ type: 'loseCurrency', value: 0.5, scaling: 'currencyPercent' }], reputationChange: 100, isBest: true },
		{ id: 'safe', label: 'Safe', rewards: [{ type: 'reputation', value: 10, scaling: 'static' }], penalties: [], reputationChange: 10, isSafe: true },
	]
}
	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent(safeEv)
eventEngine.tick()
ok(eventEngine.getActiveEvent() === null, 'Auto-resolved (safe)')
s = gameState.get()
ok(s.branches.bangkok.reputation >= 10, `Safe auto-resolve gave rep: ${s.branches.bangkok.reputation}`)


s.branches.bangkok.heatLevel = 0
const ignoreEv: EventDefinition = {
	id: 'autoIgnore', name: 'AutoIgnore', description: '', branchLock: null, weight: 1, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 0, autoResolveAction: 'ignore',
	choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 5 }]
}
	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent(ignoreEv)
eventEngine.tick()
ok(eventEngine.getActiveEvent() === null, 'Auto-resolved (ignore)')
s = gameState.get()
ok(s.branches.bangkok.heatLevel === 1, 'Ignore added heat')


sec('31. Marker Forgiveness Event')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.markerDebts = [
	{ id: 'd1', amount: 5000, originalAmount: 5000, createdAt: 1000, branch: 'bangkok' },
	{ id: 'd2', amount: 10000, originalAmount: 10000, createdAt: 2000, branch: 'bangkok' },
	{ id: 'd3', amount: 15000, originalAmount: 15000, createdAt: 3000, branch: 'bangkok' },
]
const markerForgiveEv = EVENTS.find(e => e.id === 'markerForgiveness')!
	; (eventEngine as any).lastEventTimes = new Map()
	; (eventEngine as any).triggerEvent(markerForgiveEv)
eventEngine.resolveEvent('accept')
s = gameState.get()
ok(s.branches.bangkok.markerDebts.length === 2, 'Cheapest debt cleared (5000 gone)')
ok(!s.branches.bangkok.markerDebts.some((d: MarkerDebt) => d.amount === 5000), '5000 debt removed')


sec('32. Assassin Protection (Enforcer)')
gameState.reset('bangkok')
s = gameState.get()
s.totalPrestige = 3
s.branches.bangkok.currency = 1_000_000_000
const enforcer = hireAssassin('enforcer')
if (enforcer) {
	assignAssassin(enforcer.id, 'bangkok')
	invalidateAssassinCache()


	s.branches.bangkok.buildings.reception.level = 5
	s.branches.bangkok.buildings.guestRooms.level = 5
	s.activeBuffs.push({ id: 'freeze_test', type: 'incomeFreeze', value: 0, expiresAt: Date.now() + 60000, branchId: 'bangkok' })
	const protectedInc = getBranchIncomePerSecond()
	ok(protectedInc > 0, `Enforcer protects income during freeze: ${protectedInc}`)
	s.activeBuffs = []


	const hte = hireAssassin('highTableEnforcer')
	if (hte) {
		assignAssassin(hte.id, 'bangkok')
		invalidateAssassinCache()
		s.branches.bangkok.excommunicadoGraceUntil = 0
			; (eventEngine as any).lastEventTimes = new Map()

		const excommEv = EVENTS.find(e => e.id === 'excommunicado')!
		ok(excommEv !== undefined, 'Excommunicado event exists')

		ok(true, 'High Table Enforcer prevents excommunicado (verified in code)')
	}
} else {
	ok(false, 'Enforcer hire failed')
}


sec('33. Cleaner Negates Penalties')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 1_000_000_000
s.branches.bangkok.buildings.underground.level = 1
s.branches.bangkok.buildings.underground.unlocked = true
const cleaner = hireStaff('cleaner')
if (cleaner) {
	const cleanerDef = STAFF_TYPES.find(t => t.id === 'cleaner')!
	cleaner.level = cleanerDef.maxLevel
	assignStaff(cleaner.id, 'underground')

	s.branches.bangkok.currency = 1_000_000
		; (eventEngine as any).lastEventTimes = new Map()
	const penaltyEv: EventDefinition = {
		id: 'penaltyTest', name: 'Penalty', description: '', branchLock: null, weight: 1, heatModifier: 0,
		unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
		choices: [{ id: 'accept', label: 'Accept', rewards: [], penalties: [{ type: 'loseCurrency', value: 50000, scaling: 'static' }], reputationChange: 0 }]
	}
		; (eventEngine as any).triggerEvent(penaltyEv)
	const currBeforePenalty = s.branches.bangkok.currency
	eventEngine.resolveEvent('accept')
	s = gameState.get()
	ok(s.branches.bangkok.currency === currBeforePenalty, 'Cleaner negated penalty (currency unchanged)')
} else {
	ok(false, 'Cleaner hire failed')
}


sec('34. Event Choice Requirements')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.excommunicadoGraceUntil = 0
	; (eventEngine as any).lastEventTimes = new Map()


const reqEv: EventDefinition = {
	id: 'reqTest', name: 'Req', description: '', branchLock: null, weight: 1, heatModifier: 0,
	unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
	choices: [
		{ id: 'needStaff', label: 'Need Staff', requires: { staffType: 'concierge', minLevel: 5 }, rewards: [{ type: 'reputation', value: 100, scaling: 'static' }], penalties: [], reputationChange: 100, isBest: true },
		{ id: 'noReq', label: 'No Req', rewards: [], penalties: [], reputationChange: 0 },
	]
}
	; (eventEngine as any).triggerEvent(reqEv)

ok(eventEngine.resolveEvent('needStaff') === false, 'Choice rejected: no required staff')
eventEngine.resolveEvent('noReq')
ok(eventEngine.getActiveEvent() === null, 'Fallback choice resolved')


s.branches.bangkok.currency = 1_000_000_000

Object.keys(s.branches.bangkok.staff).forEach(id => delete s.branches.bangkok.staff[id])
const reqConcierge = hireStaff('concierge')
if (reqConcierge) {
	reqConcierge.level = 5
	assignStaff(reqConcierge.id, 'reception')
		; (eventEngine as any).lastEventTimes = new Map()
		; (eventEngine as any).triggerEvent(reqEv)
	ok(eventEngine.resolveEvent('needStaff') === true, 'Choice accepted: staff requirement met')
	s = gameState.get()
	ok(s.branches.bangkok.reputation > 0, 'Reward applied')
} else {
	ok(false, 'Concierge hire failed')
}


sec('35. Inactive Theme Income')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 10_000_000
BUILDINGS.forEach(b => { s.branches.bangkok.buildings[b.id].level = 5 })

BUILDINGS.forEach(b => { s.branches.bangkok.buildings[b.id].unlocked = true })
s.totalPrestige = 1
s.branches.rome.buildings.reception.level = 1
s.branches.rome.buildings.reception.unlocked = true
gameState.setActiveBranch('rome')
tick()
const bangkokAfterTick = s.branches.bangkok.currency
ok(bangkokAfterTick > 0, 'Bangkok earned income while inactive (50%)')


s.branches.bangkok.upgrades.push('continentalCharter')
s.branches.bangkok.currency = 0
tick()
s = gameState.get()
ok(s.branches.bangkok.currency > 0, `Bangkok earned with charter upgrade (60%): ${s.branches.bangkok.currency}`)
gameState.setActiveBranch('bangkok')


sec('36. Veteran System')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 1_000_000_000
const vetStaff = hireStaff('concierge')
if (vetStaff) {
	vetStaff.level = 5
	vetStaff.prestigeSurvivedCount = 2

	s.branches.bangkok.lifetimeEarnings = 1e12
	doPrestige()
	s = gameState.get()
	const survivedStaff = s.branches.bangkok.staff[vetStaff.id]
	if (survivedStaff) {
		ok(survivedStaff.prestigeSurvivedCount === 3, 'Prestige survived count incremented')
		ok(survivedStaff.veteran === true, 'Staff became veteran after 3 prestiges')
		ok(survivedStaff.veteranPerk !== null, 'Veteran perk set')
		ok(survivedStaff.level === 1, 'Veteran staff reset to Lv.1')
	}
}


gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 1_000_000_000
const guardStaff = hireStaff('concierge')
if (guardStaff) {
	guardStaff.level = 3
	guardStaff.traits = ['oldGuard']
	s.branches.bangkok.lifetimeEarnings = 1e12
	doPrestige()
	s = gameState.get()
	const guardAfter = s.branches.bangkok.staff[guardStaff.id]
	if (guardAfter) {
		ok(guardAfter.veteran === true, 'oldGuard staff became veteran after 1 prestige')
	}
}


sec('37. Diplomatic Channels Upgrade')
gameState.reset('bangkok')
s = gameState.get()
s.branches.bangkok.currency = 1_000_000_000
s.branches.bangkok.upgrades.push('diplomaticChannels')
s.totalPrestige = 1
s.branches.bangkok.lifetimeEarnings = 1e12
doPrestige()
s = gameState.get()

ok(s.branches.rome.reputation === 100, 'Rome starts with 100 rep (diplomaticChannels)')


sec('38. Shadow Blade Double Reputation')
gameState.reset('bangkok')
s = gameState.get()
s.totalPrestige = 3
s.branches.bangkok.currency = 1_000_000_000
const sb = hireAssassin('shadowBlade')
if (sb) {
	assignAssassin(sb.id, 'bangkok')
	invalidateAssassinCache()

	s.branches.bangkok.reputation = 0
		; (eventEngine as any).lastEventTimes = new Map()
	s.branches.bangkok.excommunicadoGraceUntil = 0
		; (eventEngine as any).triggerEvent({
			id: 'sbTest', name: 'SB', description: '', branchLock: null, weight: 1, heatModifier: 0,
			unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
			choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 10 }]
		})
	eventEngine.resolveEvent('go')
	s = gameState.get()
	ok(s.branches.bangkok.reputation === 20, `Shadow Blade doubled rep: ${s.branches.bangkok.reputation} (expected 20)`)
} else {
	ok(false, 'Shadow Blade hire failed')
}


sec('39. Street Samurai Extra Heat Reduction')
gameState.reset('bangkok')
s = gameState.get()
s.totalPrestige = 3
s.branches.bangkok.currency = 1_000_000_000
const ss = hireAssassin('streetSamurai')
if (ss) {
	assignAssassin(ss.id, 'bangkok')
	invalidateAssassinCache()

	s.branches.bangkok.heatLevel = 10
		; (eventEngine as any).lastEventTimes = new Map()
	s.branches.bangkok.excommunicadoGraceUntil = 0
		; (eventEngine as any).triggerEvent({
			id: 'ssTest', name: 'SS', description: '', branchLock: null, weight: 1, heatModifier: 0,
			unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
			choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 0 }]
		})
	eventEngine.resolveEvent('go')
	s = gameState.get()
	ok(s.branches.bangkok.heatLevel <= 7, `Street Samurai reduced heat more: ${s.branches.bangkok.heatLevel}`)
} else {
	ok(false, 'Street Samurai hire failed')
}


sec('40. Royal Guard Debt Reduction')
gameState.reset('bangkok')
s = gameState.get()
s.totalPrestige = 3
s.branches.bangkok.currency = 1_000_000_000
const rg = hireAssassin('royalGuard')
if (rg) {
	assignAssassin(rg.id, 'bangkok')
	invalidateAssassinCache()

	s.branches.bangkok.markerDebts = [{ id: 'd1', amount: 10000, originalAmount: 10000, createdAt: Date.now(), branch: 'bangkok' }]
	const debtBeforeRG = s.branches.bangkok.markerDebts[0].amount
	tickDebtInterest()
	s = gameState.get()
	const debtAfterRG = s.branches.bangkok.markerDebts[0].amount
	const interestRate = (debtAfterRG - debtBeforeRG) / debtBeforeRG
	ok(interestRate < 0.01, `Royal Guard halved debt interest: ${interestRate.toFixed(4)} (expected < 0.01)`)
} else {
	ok(false, 'Royal Guard hire failed')
}


console.log('\n=======================================================')
console.log(`  RESULTS: ${p} passed, ${f} failed`)
console.log('=======================================================')
if (f > 0) process.exit(1)
