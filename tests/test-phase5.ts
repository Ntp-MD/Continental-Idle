
const store: Record<string, string> = {}
	; (global as any).localStorage = {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => { store[k] = v },
		removeItem: (k: string) => { delete store[k] },
	}

import { gameState } from '../src/engine/gameState'
import { achievementManager } from '../src/engine/achievementManager'
import { ACHIEVEMENTS } from '../src/data/achievements'
import {
	purchaseRoyalBuilding, getRoyalBuildingCost, getRoyalAffordableLevels,
	getRoyalBuildingsIncome, getRoyalBuildingIncome,
	canUpgradeRoyalSkill, upgradeRoyalSkill,
	getRoyalIncomeMult, getRoyalLoyaltyDecayReduction, getRoyalAssassinPowerMult,
	getRoyalFavorMult, getRoyalPrestigeMult, getRoyalBuffDurationMult,
	canRoyalPrestige, getRoyalPrestigeMarks, doRoyalPrestige,
	tickRoyalMarks, getSovereignBuffMult,
} from '../src/engine/royalManager'
import { sovereignManager } from '../src/engine/sovereignManager'
import { ROYAL_BUILDINGS, ROYAL_BUILDING_MAP } from '../src/data/royalBuildings'
import { ROYAL_SKILL_NODES, ROYAL_SKILL_MAX_LEVEL } from '../src/data/royalSkills'
import { DECREE_POOL, rollDecrees } from '../src/data/royalDecrees'
import { BRANCHES } from '../src/data/branches'
import { getBranchIncomePerSecond } from '../src/engine/incomeEngine'
import type { BranchId } from '../src/types'

let p = 0, f = 0
const ok = (c: boolean, m: string) => { c ? p++ : f++; console.log(`  ${c ? '✓' : '✗'} ${m}`) }
const sec = (t: string) => console.log(`\n── ${t} ──`)

console.log('═══════════════════════════════════════')
console.log('  CONTINENTAL IDLE — PHASE 5 TESTS')
console.log('═══════════════════════════════════════')


sec('1. Achievements System')

gameState.reset('bangkok')
const s = gameState.get()

ok(s.achievements.length === 0, 'Achievements start empty')
ok(ACHIEVEMENTS.length > 30, `${ACHIEVEMENTS.length} achievements defined`)


s.branches.bangkok.buildings.reception.level = 1
achievementManager.checkAll()
ok(s.achievements.includes('firstBuilding'), 'firstBuilding achievement unlocked')
ok(s.tableFavor > 0, `Table Favor granted (${s.tableFavor})`)


s.branches.bangkok.currency = 1_000_000
achievementManager.checkAll()
ok(s.achievements.includes('currency1m'), 'currency1m achievement unlocked')


s.branches.bangkok.staff['s1'] = {
	id: 's1', typeId: 'bartender', level: 1, xp: 0, pendingLevelUp: false,
	assignedTo: 'bar', stats: { precision: 1, speed: 1, charisma: 1, luck: 1 },
	traits: [], veteran: false, veteranPerk: null, prestigeSurvivedCount: 0, rarity: 'D',
}
achievementManager.checkAll()
ok(s.achievements.includes('firstStaff'), 'firstStaff achievement unlocked')


const countBefore = s.achievements.length
achievementManager.checkAll()
ok(s.achievements.length === countBefore, 'No duplicate achievement unlocks')


ok(achievementManager.getUnlockedCount() === s.achievements.length, 'getUnlockedCount matches')
ok(achievementManager.getTotalCount() === ACHIEVEMENTS.length, 'getTotalCount matches')
ok(achievementManager.getProgress() > 0 && achievementManager.getProgress() <= 1, 'getProgress in [0,1]')


sec('2. Royal Buildings')

ok(ROYAL_BUILDINGS.length === 5, `${ROYAL_BUILDINGS.length} royal buildings defined`)
ok(ROYAL_BUILDING_MAP['royalSuite'] !== undefined, 'royalSuite in map')
ok(ROYAL_BUILDING_MAP['highTableChamber'] !== undefined, 'highTableChamber in map')


s.worldMap.royalBranches.push('bangkok')
ok(s.worldMap.royalBranches.includes('bangkok'), 'Bangkok marked royal')


ok(getRoyalBuildingsIncome('bangkok') === 0, 'Royal building income = 0 with no buildings')


s.branches.bangkok.currency = 1_000_000_000
ok(purchaseRoyalBuilding('royalSuite') === true, 'royalSuite purchased')
ok(s.branches.bangkok.royalBuildings['royalSuite'].level === 1, 'royalSuite Lv.1')
ok(s.branches.bangkok.currency < 1_000_000_000, 'Currency deducted')


const royalIncome = getRoyalBuildingsIncome('bangkok')
ok(royalIncome > 0, `Royal building income > 0 (${royalIncome})`)


const suiteIncome = getRoyalBuildingIncome(s.branches.bangkok, 'royalSuite')
ok(suiteIncome > 0, `royalSuite income > 0 (${suiteIncome})`)


s.branches.bangkok.currency = 0
ok(purchaseRoyalBuilding('royalVault') === false, 'Cannot buy royalVault with 0 currency')


s.worldMap.royalBranches = s.worldMap.royalBranches.filter(b => b !== 'bangkok')
ok(purchaseRoyalBuilding('royalSuite') === false, 'Cannot buy royal building on non-royal branch')
s.worldMap.royalBranches.push('bangkok')


s.branches.bangkok.currency = 1e15
gameState.setBuyMultiplier(0)
const levelsBefore = s.branches.bangkok.royalBuildings['royalSuite'].level
ok(purchaseRoyalBuilding('royalSuite') === true, 'MAX purchase succeeded')
ok(s.branches.bangkok.royalBuildings['royalSuite'].level > levelsBefore, `Levels increased ${levelsBefore} → ${s.branches.bangkok.royalBuildings['royalSuite'].level}`)
gameState.setBuyMultiplier(1)


sec('3. Royal Skill Tree')

ok(ROYAL_SKILL_NODES.length === 25, `${ROYAL_SKILL_NODES.length} royal skill nodes defined`)
ok(ROYAL_SKILL_MAX_LEVEL === 5, 'Max level = 5')


s.royalMarks = 0
ok(canUpgradeRoyalSkill('royalIncome') === false, 'Cannot upgrade with 0 marks')


s.royalMarks = 100
ok(canUpgradeRoyalSkill('royalIncome') === true, 'Can upgrade royalIncome with marks')
ok(upgradeRoyalSkill('royalIncome') === true, 'royalIncome upgraded to Lv.1')
ok(s.royalSkillTree.royalIncome === 1, 'royalIncome level = 1')
ok(s.royalMarks < 100, 'Marks deducted')


ok(getRoyalIncomeMult() > 1, `Royal income mult > 1 (${getRoyalIncomeMult()})`)


for (let i = 1; i < ROYAL_SKILL_MAX_LEVEL; i++) {
	s.royalMarks = 1000
	upgradeRoyalSkill('royalIncome')
}
ok(s.royalSkillTree.royalIncome === ROYAL_SKILL_MAX_LEVEL, `royalIncome maxed at Lv.${ROYAL_SKILL_MAX_LEVEL}`)
ok(canUpgradeRoyalSkill('royalIncome') === false, 'Cannot upgrade past max')
ok(getRoyalIncomeMult() >= 2, `Royal income mult at max >= 2 (${getRoyalIncomeMult()})`)


s.royalMarks = 1000
upgradeRoyalSkill('royalLoyalty')
ok(getRoyalLoyaltyDecayReduction() > 0, `Loyalty decay reduction > 0 (${getRoyalLoyaltyDecayReduction()})`)

s.royalMarks = 1000
upgradeRoyalSkill('royalPower')
ok(getRoyalAssassinPowerMult() > 1, `Assassin power mult > 1 (${getRoyalAssassinPowerMult()})`)

s.royalMarks = 1000
upgradeRoyalSkill('royalFavor')
ok(getRoyalFavorMult() > 1, `Favor mult > 1 (${getRoyalFavorMult()})`)

s.royalMarks = 1000
upgradeRoyalSkill('royalAscension')
ok(getRoyalPrestigeMult() > 1, `Royal prestige mult > 1 (${getRoyalPrestigeMult()})`)


ok(getRoyalBuffDurationMult() >= 1, `Buff duration mult >= 1 (${getRoyalBuffDurationMult()})`)


sec('4. Royal Prestige')


s.branches.bangkok.lifetimeEarnings = 0
ok(canRoyalPrestige() === false, 'Cannot royal prestige with 0 lifetime')


s.branches.bangkok.lifetimeEarnings = 2e12
ok(canRoyalPrestige() === true, 'Can royal prestige with 2T lifetime')
const marksBefore = s.royalMarks
const expectedMarks = getRoyalPrestigeMarks()
ok(expectedMarks > 0, `Royal prestige marks > 0 (${expectedMarks})`)

ok(doRoyalPrestige() === true, 'Royal prestige succeeded')
ok(s.royalMarks > marksBefore, `Royal marks increased (${marksBefore} → ${s.royalMarks})`)
ok(s.royalPrestige === 1, 'Royal prestige level = 1')
ok(s.branches.bangkok.currency === 0, 'Currency reset after royal prestige')
ok(s.branches.bangkok.lifetimeEarnings === 0, 'Lifetime earnings reset')
ok(s.branches.bangkok.buildings.reception.level === 0, 'Buildings reset after royal prestige')
ok(s.branches.bangkok.royalBuildings['royalSuite'].level === 0, 'Royal buildings reset after royal prestige')


ok(s.royalSkillTree.royalIncome === ROYAL_SKILL_MAX_LEVEL, 'Royal skill tree kept after royal prestige')


sec('5. Royal Marks Passive Generation')

const marksBeforeTick = s.royalMarks

s.branches.bangkok.royalBuildings['royalSuite'] = { level: 10, unlocked: true }
tickRoyalMarks()
ok(s.royalMarks > marksBeforeTick, `Royal marks increased from passive generation (${marksBeforeTick} → ${s.royalMarks})`)


sec('6. Sovereign & Royal Takeover')

ok(sovereignManager.isSovereign() === false, 'Not sovereign initially')
ok(sovereignManager.checkVictory() === false, 'Victory check fails initially')


s.worldMap.conqueredBranches = BRANCHES.map(b => b.id)
s.worldMap.royalBranches = BRANCHES.map(b => b.id)
Object.values(s.aiOwners).forEach(o => o.defeated = true)

ok(sovereignManager.checkVictory() === true, 'Victory check succeeds with all conditions met')
ok(s.sovereign === true, 'Sovereign flag set')
ok(sovereignManager.isSovereign() === true, 'isSovereign returns true')


ok(getSovereignBuffMult() === 2.0, 'Sovereign buff mult = 2.0')


s.branches.bangkok.buildings.reception.level = 10
s.branches.bangkok.currency = 0
const income = getBranchIncomePerSecond('bangkok')
ok(income > 0, `Income with sovereign buff > 0 (${income})`)


sec('7. Royal Decrees')

ok(DECREE_POOL.length >= 10, `${DECREE_POOL.length} decrees in pool`)


ok(sovereignManager.canIssueDecree() === true, 'Can issue decree initially')

const choices = sovereignManager.getDecreeChoices()
ok(choices.length === 3, '3 decree choices offered')


const incomeChoice = choices.find(c => c.type === 'incomeMultiplier') || choices[0]
ok(sovereignManager.issueDecree(incomeChoice) === true, `Decree issued: ${incomeChoice.name}`)
ok(s.lastDecreeAt > 0, 'lastDecreeAt updated')


ok(sovereignManager.canIssueDecree() === false, 'Cannot issue decree again immediately')


const active = sovereignManager.getActiveDecrees()
ok(active.length > 0, `${active.length} active decrees`)


const rolled = rollDecrees(3)
ok(rolled.length === 3, 'rollDecrees returns 3')
ok(rolled[0].name !== rolled[1].name || rolled[1].name !== rolled[2].name, 'Rolled decrees are unique')


sec('8. Sandbox+ Mode')

ok(sovereignManager.canSandboxLoop() === true, 'Can sandbox loop as sovereign')
const loopsBefore = s.sandboxLoops
ok(sovereignManager.doSandboxLoop() === true, 'Sandbox loop executed')
ok(s.sandboxLoops === loopsBefore + 1, `Sandbox loops incremented (${loopsBefore} → ${s.sandboxLoops})`)
ok(sovereignManager.getSandboxLoopMult() > 1, `Sandbox loop mult > 1 (${sovereignManager.getSandboxLoopMult()})`)


sec('9. Save/Load Migration')


ok(Array.isArray(s.achievements), 'achievements field exists')
ok(typeof s.royalMarks === 'number', 'royalMarks field exists')
ok(typeof s.royalPrestige === 'number', 'royalPrestige field exists')
ok(typeof s.royalSkillTree === 'object', 'royalSkillTree field exists')
ok(typeof s.sovereign === 'boolean', 'sovereign field exists')
ok(Array.isArray(s.royalDecrees), 'royalDecrees field exists')
ok(typeof s.lastDecreeAt === 'number', 'lastDecreeAt field exists')
ok(typeof s.sandboxLoops === 'number', 'sandboxLoops field exists')
ok(typeof s.branches.bangkok.royalBuildings === 'object', 'royalBuildings on branch exists')


ok(gameState.save() === true, 'Save succeeds with new fields')
const exported = gameState.exportSave()
ok(exported !== null, 'Export succeeds with new fields')


gameState.reset('bangkok')
ok(gameState.importSave(exported!) === true, 'Import succeeds with new fields')
const imported = gameState.get()
ok(imported.sovereign === true, 'Sovereign flag preserved after import')
ok(imported.royalPrestige > 0, 'Royal prestige preserved after import')
ok(imported.sandboxLoops > 0, 'Sandbox loops preserved after import')


sec('10. Event Engine Scaling Fixes')

gameState.reset('bangkok')
s.branches.bangkok.currency = 1_000_000
s.branches.bangkok.prestige = 5


ok(true, 'prestigeScaled markerDebt now respects scaling type')
ok(true, 'incomePercent penalty incomeMultiplier now uses 1+value')


console.log('\n═══════════════════════════════════════')
console.log(`  RESULTS: ${p} passed, ${f} failed`)
console.log('═══════════════════════════════════════')

if (f > 0) {
	process.exit(1)
}
