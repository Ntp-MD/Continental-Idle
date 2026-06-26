// localStorage polyfill for Node.js
const store: Record<string, string> = {}
;(global as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}

import { gameState } from '../src/engine/game-state'
import { purchaseBuilding, getBranchIncomePerSecond, getBuildingCost, getAffordableLevels, tick } from '../src/engine/income-engine'
import { hireStaff, assignStaff, tickStaffXp, confirmLevelUp, getStaffXpToNext } from '../src/engine/staff-manager'
import { eventEngine } from '../src/engine/event-engine'
import { getPrestigeFavor, doPrestige } from '../src/engine/prestige-manager'
import { formatNumber, formatIncome } from '../src/engine/format'
import { BUILDINGS } from '../src/data/buildings'
import type { EventDefinition, StaffEntry } from '../src/types'

let p = 0, f = 0
const ok = (c: boolean, m: string) => { c ? p++ : f++; console.log(`  ${c ? '✓' : '✗'} ${m}`) }
const sec = (t: string) => console.log(`\n── ${t} ──`)

console.log('═══════════════════════════════════════')
console.log('  CONTINENTAL IDLE — GAMEPLAY TEST')
console.log('═══════════════════════════════════════')

// 1. Init
sec('1. Initialization')
gameState.reset('bangkok')
const s = gameState.get()
ok(s.activeBranch === 'bangkok', 'Active theme = Bangkok')
ok(s.branches.bangkok.currency === 0, 'Start currency = 0')
ok(s.worldMap.unlockedBranches.includes('bangkok'), 'Bangkok unlocked')
ok(!s.worldMap.unlockedBranches.includes('rome'), 'Rome locked')
ok(Object.keys(s.branches.bangkok.buildings).length === 12, '12 buildings init')

// 2. Free building
sec('2. Free Building')
ok(BUILDINGS.find(b => b.id === 'reception')!.baseCost === 0, 'Reception baseCost = 0')
ok(purchaseBuilding('reception') === true, 'Reception bought (free)')
ok(s.branches.bangkok.buildings.reception.level === 1, 'Reception Lv.1')
ok(getBranchIncomePerSecond() > 0, `Income > 0 (${formatIncome(getBranchIncomePerSecond())})`)

// 3. Building purchases
sec('3. Building Purchases')
s.branches.bangkok.currency = 1_000_000
ok(getBuildingCost(s.branches.bangkok, 'guestRooms', 1) === 50, 'Guest Rooms cost 50')
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms bought')
ok(s.branches.bangkok.buildings.guestRooms.level === 1, 'Guest Rooms Lv.1')
gameState.setBuyMultiplier(10)
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms x10 bought')
ok(s.branches.bangkok.buildings.guestRooms.level === 11, 'Guest Rooms Lv.11')
gameState.setBuyMultiplier(0)
const before = s.branches.bangkok.buildings.guestRooms.level
ok(getAffordableLevels(s.branches.bangkok, 'guestRooms') > 0, 'Affordable levels > 0')
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms MAX bought')
ok(s.branches.bangkok.buildings.guestRooms.level > before, `Lv increased ${before} → ${s.branches.bangkok.buildings.guestRooms.level}`)
s.branches.bangkok.currency = 0
ok(purchaseBuilding('bar') === false, 'Buy fails: insufficient funds')
gameState.setBuyMultiplier(1)

// 4. Income
sec('4. Income Calculation')
s.branches.bangkok.currency = 10_000_000
BUILDINGS.forEach(b => { if (b.id !== 'reception') s.branches.bangkok.buildings[b.id].level = 5 })
const inc = getBranchIncomePerSecond()
ok(inc > 100, `Income all Lv.5: ${formatIncome(inc)}`)
ok(s.activeBranch === s.hqBranch, 'Active = HQ (1.2x mult)')

// 5. Staff
sec('5. Staff System')
s.branches.bangkok.currency = 10_000_000
const c = hireStaff('concierge')
ok(c !== null, 'Concierge hired')
ok(c!.level === 1, 'Starts Lv.1')
const statSum = c!.stats.precision + c!.stats.speed + c!.stats.charisma + c!.stats.luck
ok(statSum === 20, `Stat budget = 20 (${statSum})`)
ok(assignStaff(c!.id, 'reception') === true, 'Assigned to Reception')
ok(s.branches.bangkok.staff[c!.id].assignedTo === 'reception', 'Assignment confirmed')
ok(getBranchIncomePerSecond() > inc, 'Income increased with staff')
hireStaff('bartender')
hireStaff('chef')
ok(Object.keys(s.branches.bangkok.staff).length === 3, '3 staff total')
s.branches.bangkok.currency = 0
ok(hireStaff('vaultKeeper') === null, 'Hire fails: insufficient funds')

// 6. Staff XP
sec('6. Staff XP & Level Up')
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

// 7. Game loop tick
sec('7. Game Loop Tick')
s.branches.bangkok.currency = 0
tick()
ok(s.branches.bangkok.currency > 0, `Currency after tick: ${formatNumber(s.branches.bangkok.currency)}`)
ok(s.totalPlayTime === 1, 'Play time = 1')

// 8. Events
sec('8. Event System')
;(eventEngine as any).lastEventTime = 0
s.branches.bangkok.buildings.underground.level = 1
s.branches.bangkok.excommunicadoGraceUntil = 0
let triggered = false
for (let i = 0; i < 200; i++) {
  eventEngine.tick()
  if (eventEngine.getActiveEvent()) { triggered = true; break }
}
if (triggered) {
  const ev = eventEngine.getActiveEvent()!
  ok(true, `Event: ${ev.definition.name}`)
  ok(ev.definition.choices.length >= 2, `${ev.definition.choices.length} choices`)
  eventEngine.resolveEvent(ev.definition.choices[0].id)
  ok(eventEngine.getActiveEvent() === null, 'Event resolved')
  ok(s.eventLog.length > 0, 'Event logged')
} else {
  console.log('  ℹ Random not triggered (2%/tick), testing directly...')
  const rep = s.branches.bangkok.reputation
  const fake: EventDefinition = {
    id: 'test', name: 'Test', description: 'Test event', branchLock: null, weight: 10, heatModifier: 3,
    unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
    choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 5 }]
  }
  ;(eventEngine as any).triggerEvent(fake)
  ok(eventEngine.getActiveEvent() !== null, 'Event force-triggered')
  eventEngine.resolveEvent('go')
  ok(eventEngine.getActiveEvent() === null, 'Event resolved')
  ok(s.branches.bangkok.reputation === rep + 5, `Rep +5 (got ${s.branches.bangkok.reputation - rep})`)
}
// Test ignore
;(eventEngine as any).lastEventTime = 0
const fake2: EventDefinition = {
  id: 'test2', name: 'Test2', description: 'Test event 2', branchLock: null, weight: 15, heatModifier: 10,
  unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
  choices: [{ id: 'a', label: 'A', rewards: [], penalties: [], reputationChange: 0 }]
}
;(eventEngine as any).triggerEvent(fake2)
const heatBefore = s.branches.bangkok.heatLevel
eventEngine.ignoreEvent()
ok(s.branches.bangkok.heatLevel === heatBefore + 1, `Heat +1 on ignore (${s.branches.bangkok.heatLevel - heatBefore})`)

// 9. Prestige
sec('9. Prestige')
s.branches.bangkok.lifetimeEarnings = 1e10
const favor = getPrestigeFavor()
ok(favor > 0, `Favor = ${favor}`)
const favBefore = s.tableFavor
ok(doPrestige() === true, 'Prestige executed')
ok(s.tableFavor === favBefore + favor, `Favor +${favor} (${s.tableFavor - favBefore})`)
ok(s.branches.bangkok.prestige === 1, 'Theme prestige = 1')
ok(s.branches.bangkok.buildings.guestRooms.level === 0, 'Buildings reset')
ok(s.branches.bangkok.currency === 0, 'Currency reset')
ok(s.totalPrestige === 1, 'Total prestige = 1')

// 10. Theme unlock
sec('10. Theme Unlock')
ok(s.worldMap.unlockedBranches.includes('rome'), 'Rome unlocked at prestige 1')
ok(!s.worldMap.unlockedBranches.includes('casablanca'), 'Casablanca still locked')
s.totalPrestige = 5
s.branches.bangkok.lifetimeEarnings = 1e10
doPrestige()
ok(s.worldMap.unlockedBranches.includes('casablanca'), 'Casablanca unlocked at prestige 5')

// 11. Save/Load
sec('11. Save / Load')
s.branches.bangkok.currency = 999_999
gameState.save()
ok(gameState.hasSave() === true, 'Save created')
const exported = gameState.exportSave()
ok(exported.length > 0, `Exported (${exported.length} chars)`)
gameState.reset('bangkok')
ok(gameState.get().branches.bangkok.currency === 0, 'Fresh state = 0')
const loaded = gameState.load()
ok(loaded !== null, 'Save loaded')
ok(loaded!.branches.bangkok.currency === 999_999, `Loaded currency: ${loaded!.branches.bangkok.currency}`)

// 12. Formatting
sec('12. Number Formatting')
ok(formatNumber(0) === '0', 'format(0) = 0')
ok(formatNumber(999) === '999', 'format(999) = 999')
ok(formatNumber(1000) === '1.00K', `format(1K) = ${formatNumber(1000)}`)
ok(formatNumber(1_000_000) === '1.00M', `format(1M) = ${formatNumber(1_000_000)}`)
ok(formatNumber(1e9) === '1.00B', `format(1B) = ${formatNumber(1e9)}`)
ok(formatNumber(1e12) === '1.00T', `format(1T) = ${formatNumber(1e12)}`)
ok(formatIncome(5000) === '5.00K/s', `formatIncome(5K) = ${formatIncome(5000)}`)

// 13. Theme switch
sec('13. Theme Switching')
gameState.setActiveBranch('rome')
ok(gameState.get().activeBranch === 'rome', 'Switched to Rome')
ok(getBranchIncomePerSecond('rome') >= 0, 'Rome income calculated')
gameState.setActiveBranch('bangkok')
ok(gameState.get().activeBranch === 'bangkok', 'Switched back to NY')

// Results
console.log('\n═══════════════════════════════════════')
console.log(`  RESULTS: ${p} passed, ${f} failed`)
console.log('═══════════════════════════════════════')
if (f > 0) process.exit(1)
