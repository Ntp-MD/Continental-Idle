// localStorage polyfill for Node.js
const store: Record<string, string> = {}
;(global as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}

import { gameState } from '../src/engine/game-state'
import { purchaseBuilding, getThemeIncomePerSecond, getBuildingCost, getAffordableLevels, tick } from '../src/engine/income-engine'
import { hireStaff, assignStaff, tickStaffXp, confirmLevelUp, getStaffXpToNext } from '../src/engine/staff-manager'
import { eventEngine } from '../src/engine/event-engine'
import { getPrestigeFavor, doPrestige } from '../src/engine/prestige-manager'
import { formatNumber, formatIncome } from '../src/engine/format'
import { BUILDINGS } from '../src/data/buildings'
import type { EventDefinition } from '../src/types'

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
ok(s.activeTheme === 'bangkok', 'Active theme = Bangkok')
ok(s.themes.bangkok.currency === 0, 'Start currency = 0')
ok(s.worldMap.unlockedNodes.includes('bangkok'), 'Bangkok unlocked')
ok(!s.worldMap.unlockedNodes.includes('rome'), 'Rome locked')
ok(Object.keys(s.themes.bangkok.buildings).length === 12, '12 buildings init')

// 2. Free building
sec('2. Free Building')
ok(BUILDINGS.find(b => b.id === 'reception')!.baseCost === 0, 'Reception baseCost = 0')
ok(purchaseBuilding('reception') === true, 'Reception bought (free)')
ok(s.themes.bangkok.buildings.reception.level === 1, 'Reception Lv.1')
ok(getThemeIncomePerSecond() > 0, `Income > 0 (${formatIncome(getThemeIncomePerSecond())})`)

// 3. Building purchases
sec('3. Building Purchases')
s.themes.bangkok.currency = 1_000_000
ok(getBuildingCost(s.themes.bangkok, 'guestRooms', 1) === 50, 'Guest Rooms cost 50')
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms bought')
ok(s.themes.bangkok.buildings.guestRooms.level === 1, 'Guest Rooms Lv.1')
gameState.setBuyMultiplier(10)
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms x10 bought')
ok(s.themes.bangkok.buildings.guestRooms.level === 11, 'Guest Rooms Lv.11')
gameState.setBuyMultiplier(0)
const before = s.themes.bangkok.buildings.guestRooms.level
ok(getAffordableLevels(s.themes.bangkok, 'guestRooms') > 0, 'Affordable levels > 0')
ok(purchaseBuilding('guestRooms') === true, 'Guest Rooms MAX bought')
ok(s.themes.bangkok.buildings.guestRooms.level > before, `Lv increased ${before} → ${s.themes.bangkok.buildings.guestRooms.level}`)
s.themes.bangkok.currency = 0
ok(purchaseBuilding('bar') === false, 'Buy fails: insufficient funds')
gameState.setBuyMultiplier(1)

// 4. Income
sec('4. Income Calculation')
s.themes.bangkok.currency = 10_000_000
BUILDINGS.forEach(b => { if (b.id !== 'reception') s.themes.bangkok.buildings[b.id].level = 5 })
const inc = getThemeIncomePerSecond()
ok(inc > 100, `Income all Lv.5: ${formatIncome(inc)}`)
ok(s.activeTheme === s.hqCountry, 'Active = HQ (1.2x mult)')

// 5. Staff
sec('5. Staff System')
s.themes.bangkok.currency = 10_000_000
const c = hireStaff('concierge')
ok(c !== null, 'Concierge hired')
ok(c!.level === 1, 'Starts Lv.1')
const statSum = c!.stats.precision + c!.stats.speed + c!.stats.charisma + c!.stats.luck
ok(statSum === 20, `Stat budget = 20 (${statSum})`)
ok(assignStaff(c!.id, 'reception') === true, 'Assigned to Reception')
ok(s.themes.bangkok.staff[c!.id].assignedTo === 'reception', 'Assignment confirmed')
ok(getThemeIncomePerSecond() > inc, 'Income increased with staff')
hireStaff('bartender')
hireStaff('chef')
ok(Object.keys(s.themes.bangkok.staff).length === 3, '3 staff total')
s.themes.bangkok.currency = 0
ok(hireStaff('vaultKeeper') === null, 'Hire fails: insufficient funds')

// 6. Staff XP
sec('6. Staff XP & Level Up')
s.themes.bangkok.currency = 100_000_000
for (let i = 0; i < 200; i++) tickStaffXp()
const xpStaff = Object.values(s.themes.bangkok.staff).find(x => x.assignedTo !== null)!
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
s.themes.bangkok.currency = 0
tick()
ok(s.themes.bangkok.currency > 0, `Currency after tick: ${formatNumber(s.themes.bangkok.currency)}`)
ok(s.totalPlayTime === 1, 'Play time = 1')

// 8. Events
sec('8. Event System')
;(eventEngine as any).lastEventTime = 0
s.themes.bangkok.buildings.underground.level = 1
s.themes.bangkok.excommunicadoGraceUntil = 0
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
  const rep = s.themes.bangkok.reputation
  const fake: EventDefinition = {
    id: 'test', name: 'Test', themeLock: null, weight: 10, heatModifier: 3,
    unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
    choices: [{ id: 'go', label: 'Go', rewards: [], penalties: [], reputationChange: 5 }]
  }
  ;(eventEngine as any).triggerEvent(fake)
  ok(eventEngine.getActiveEvent() !== null, 'Event force-triggered')
  eventEngine.resolveEvent('go')
  ok(eventEngine.getActiveEvent() === null, 'Event resolved')
  ok(s.themes.bangkok.reputation === rep + 5, `Rep +5 (got ${s.themes.bangkok.reputation - rep})`)
}
// Test ignore
;(eventEngine as any).lastEventTime = 0
const fake2: EventDefinition = {
  id: 'test2', name: 'Test2', themeLock: null, weight: 15, heatModifier: 10,
  unlockCondition: null, autoResolveTimeout: 60, autoResolveAction: 'ignore',
  choices: [{ id: 'a', label: 'A', rewards: [], penalties: [], reputationChange: 0 }]
}
;(eventEngine as any).triggerEvent(fake2)
const heatBefore = s.themes.bangkok.heatLevel
eventEngine.ignoreEvent()
ok(s.themes.bangkok.heatLevel === heatBefore + 1, `Heat +1 on ignore (${s.themes.bangkok.heatLevel - heatBefore})`)

// 9. Prestige
sec('9. Prestige')
s.themes.bangkok.lifetimeEarnings = 1e10
const favor = getPrestigeFavor()
ok(favor > 0, `Favor = ${favor}`)
const favBefore = s.tableFavor
ok(doPrestige() === true, 'Prestige executed')
ok(s.tableFavor === favBefore + favor, `Favor +${favor} (${s.tableFavor - favBefore})`)
ok(s.themes.bangkok.prestige === 1, 'Theme prestige = 1')
ok(s.themes.bangkok.buildings.guestRooms.level === 0, 'Buildings reset')
ok(s.themes.bangkok.currency === 0, 'Currency reset')
ok(s.totalPrestige === 1, 'Total prestige = 1')

// 10. Theme unlock
sec('10. Theme Unlock')
ok(s.worldMap.unlockedNodes.includes('rome'), 'Rome unlocked at prestige 1')
ok(!s.worldMap.unlockedNodes.includes('casablanca'), 'Casablanca still locked')
s.totalPrestige = 5
s.themes.bangkok.lifetimeEarnings = 1e10
doPrestige()
ok(s.worldMap.unlockedNodes.includes('casablanca'), 'Casablanca unlocked at prestige 5')

// 11. Save/Load
sec('11. Save / Load')
s.themes.bangkok.currency = 999_999
gameState.save()
ok(gameState.hasSave() === true, 'Save created')
const exported = gameState.exportSave()
ok(exported.length > 0, `Exported (${exported.length} chars)`)
gameState.reset('bangkok')
ok(gameState.get().themes.bangkok.currency === 0, 'Fresh state = 0')
const loaded = gameState.load()
ok(loaded !== null, 'Save loaded')
ok(gameState.get().themes.bangkok.currency === 999_999, `Loaded currency: ${gameState.get().themes.bangkok.currency}`)

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
gameState.setActiveTheme('rome')
ok(gameState.getActiveThemeId() === 'rome', 'Switched to Rome')
ok(getThemeIncomePerSecond('rome') >= 0, 'Rome income calculated')
gameState.setActiveTheme('bangkok')
ok(gameState.getActiveThemeId() === 'bangkok', 'Switched back to NY')

// Results
console.log('\n═══════════════════════════════════════')
console.log(`  RESULTS: ${p} passed, ${f} failed`)
console.log('═══════════════════════════════════════')
if (f > 0) process.exit(1)
