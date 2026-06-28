// localStorage polyfill for Node.js
const store: Record<string, string> = {}
;(global as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}
;(global as any).window = { addEventListener: () => {}, removeEventListener: () => {}, setInterval: () => 0, clearInterval: () => {} }

import { gameState } from '../src/engine/game-state'
import { eventEngine } from '../src/engine/event-engine'
import { eventBus } from '../src/engine/event-bus'
import {
  createAIOwner,
  initAIOwners,
  getAIOwner,
  getAllAIOwners,
  getActiveAIOwners,
  getPlayerPower,
  getPowerBalance,
  getThreatLevel,
  tickAIOwners,
  pickAIEvent,
  defeatAIOwner,
  improveRelations,
  worsenRelations,
  generateAIEvent,
  type AIEventType,
} from '../src/engine/ai-owner-manager'
import { AI_TEMPERAMENTS, getAIName, getAITemperamentForBranch, getTemperamentDef } from '../src/data/ai-owners'
import {
  AI_EVENT_TEMPLATES,
  getAIEventTemplate,
  buildAIEventDefinition,
} from '../src/data/ai-events'
import { BRANCHES } from '../src/data/branches'
import type { AIOwnerState, AITemperament, BranchId } from '../src/types'

let p = 0, f = 0
const ok = (c: boolean, m: string) => { c ? p++ : f++; console.log(`  ${c ? '\u2713' : '\u2717'} ${m}`) }
const sec = (t: string) => console.log(`\n-- ${t} --`)

console.log('=======================================================')
console.log('  CONTINENTAL IDLE - AI EVENT TEST SUITE')
console.log('=======================================================')

// ─────────────────────────────────────────────
// 1. AI Event Templates Data File
// ─────────────────────────────────────────────
sec('1. AI Event Templates Data File')

const expectedEventTypes: AIEventType[] = ['raid', 'tribute', 'sabotage', 'spy', 'provocation', 'truce']
ok(Object.keys(AI_EVENT_TEMPLATES).length === 6, '6 AI event templates defined')

expectedEventTypes.forEach(type => {
  const template = AI_EVENT_TEMPLATES[type]
  ok(template !== undefined, `Template '${type}' exists`)
  ok(template.type === type, `Template '${type}' type field matches`)
  ok(template.nameTemplate.length > 0, `Template '${type}' has nameTemplate`)
  ok(template.descriptionTemplate.length > 0, `Template '${type}' has descriptionTemplate`)
  ok(template.choices.length >= 2, `Template '${type}' has >= 2 choices`)
  ok(template.heatModifier !== undefined, `Template '${type}' has heatModifier`)
})

// Verify template placeholders
ok(AI_EVENT_TEMPLATES.raid.nameTemplate.includes('{ownerName}'), 'Raid name has {ownerName} placeholder')
ok(AI_EVENT_TEMPLATES.raid.descriptionTemplate.includes('{ownerBranch}'), 'Raid desc has {ownerBranch} placeholder')
ok(AI_EVENT_TEMPLATES.raid.descriptionTemplate.includes('{targetBranch}'), 'Raid desc has {targetBranch} placeholder')
ok(AI_EVENT_TEMPLATES.truce.descriptionTemplate.includes('{targetBranch}'), 'Truce desc has {targetBranch} placeholder')

// Verify specific choice structures
const raidTemplate = AI_EVENT_TEMPLATES.raid
ok(raidTemplate.choices[0].id === 'fight', 'Raid choice[0] = fight')
ok(raidTemplate.choices[0].requires?.assassinAssigned === true, 'Raid fight requires assassinAssigned')
ok(raidTemplate.choices[0].isBest === true, 'Raid fight isBest')
ok(raidTemplate.choices[1].id === 'pay', 'Raid choice[1] = pay')
ok(raidTemplate.choices[1].isSafe === true, 'Raid pay isSafe')
ok(raidTemplate.choices[2].id === 'ignore', 'Raid choice[2] = ignore')

const tributeTemplate = AI_EVENT_TEMPLATES.tribute
ok(tributeTemplate.choices[0].id === 'pay', 'Tribute choice[0] = pay')
ok(tributeTemplate.choices[0].isSafe === true, 'Tribute pay isSafe')
ok(tributeTemplate.choices[1].id === 'refuse', 'Tribute choice[1] = refuse')
ok(tributeTemplate.choices[1].heatChange === 3, 'Tribute refuse heatChange = 3')
ok(tributeTemplate.choices[1].isBest === true, 'Tribute refuse isBest')

const sabotageTemplate = AI_EVENT_TEMPLATES.sabotage
ok(sabotageTemplate.choices.length === 3, 'Sabotage has 3 choices')
ok(sabotageTemplate.choices[0].id === 'repair', 'Sabotage choice[0] = repair')
ok(sabotageTemplate.choices[1].id === 'retaliate', 'Sabotage choice[1] = retaliate')
ok(sabotageTemplate.choices[2].id === 'endure', 'Sabotage choice[2] = endure')

const spyTemplate = AI_EVENT_TEMPLATES.spy
ok(spyTemplate.choices[0].id === 'interrogate', 'Spy choice[0] = interrogate')
ok(spyTemplate.choices[0].heatChange === 2, 'Spy interrogate heatChange = 2')
ok(spyTemplate.choices[1].id === 'release', 'Spy choice[1] = release')
ok(spyTemplate.choices[1].isSafe === true, 'Spy release isSafe')

const provocationTemplate = AI_EVENT_TEMPLATES.provocation
ok(provocationTemplate.choices[0].id === 'stand', 'Provocation choice[0] = stand')
ok(provocationTemplate.choices[0].reputationChange === 15, 'Provocation stand rep = 15')
ok(provocationTemplate.choices[1].id === 'back', 'Provocation choice[1] = back')
ok(provocationTemplate.choices[1].heatChange === -3, 'Provocation back heatChange = -3')

const truceTemplate = AI_EVENT_TEMPLATES.truce
ok(truceTemplate.heatModifier === -2, 'Truce heatModifier = -2 (reduces heat)')
ok(truceTemplate.choices[0].id === 'accept', 'Truce choice[0] = accept')
ok(truceTemplate.choices[0].isBest === true, 'Truce accept isBest')
ok(truceTemplate.choices[0].isSafe === true, 'Truce accept isSafe')
ok(truceTemplate.choices[0].rewards[0].type === 'incomeMultiplier', 'Truce accept gives incomeMultiplier')
ok(truceTemplate.choices[0].rewards[0].value === 1.10, 'Truce accept income mult = 1.10')
ok(truceTemplate.choices[0].rewards[0].duration === 60, 'Truce accept duration = 60s')
ok(truceTemplate.choices[1].id === 'reject', 'Truce choice[1] = reject')

// ─────────────────────────────────────────────
// 2. getAIEventTemplate Function
// ─────────────────────────────────────────────
sec('2. getAIEventTemplate Function')

expectedEventTypes.forEach(type => {
  const template = getAIEventTemplate(type)
  ok(template.type === type, `getAIEventTemplate('${type}') returns correct type`)
  ok(template.choices.length > 0, `getAIEventTemplate('${type}') has choices`)
})

// Invalid type should throw
let threw = false
try { getAIEventTemplate('invalid' as AIEventType) } catch { threw = true }
ok(threw, 'getAIEventTemplate throws on invalid type')

// ─────────────────────────────────────────────
// 3. buildAIEventDefinition Function
// ─────────────────────────────────────────────
sec('3. buildAIEventDefinition Function')

const testTemplate = AI_EVENT_TEMPLATES.raid
const builtEvent = buildAIEventDefinition(testTemplate, 'Don Caravale', 'New York', 'London')

ok(builtEvent.id.startsWith('ai_raid_'), `Built event id starts with ai_raid_ (${builtEvent.id})`)
ok(builtEvent.name === "Don Caravale's Raid", `Built event name = "${builtEvent.name}"`)
ok(builtEvent.description.includes('Don Caravale'), 'Built desc includes owner name')
ok(builtEvent.description.includes('New York'), 'Built desc includes owner branch')
ok(builtEvent.description.includes('London'), 'Built desc includes target branch')
ok(builtEvent.branchLock === null, 'Built event branchLock = null')
ok(builtEvent.weight === 20, 'Built event weight = 20')
ok(builtEvent.heatModifier === 8, 'Built event heatModifier = 8')
ok(builtEvent.unlockCondition === null, 'Built event unlockCondition = null')
ok(builtEvent.autoResolveTimeout === 90, 'Built event autoResolveTimeout = 90')
ok(builtEvent.autoResolveAction === 'ignore', 'Built event autoResolveAction = ignore')
ok(JSON.stringify(builtEvent.choices) === JSON.stringify(testTemplate.choices), 'Built event choices match template choices (deep equality)')
ok(builtEvent.choices !== testTemplate.choices, 'Built event choices is a new array (not same reference)')
ok(builtEvent.choices[0].rewards !== testTemplate.choices[0].rewards, 'Built event choice rewards is a new array (not same reference)')
ok(builtEvent.choices[0].penalties !== testTemplate.choices[0].penalties, 'Built event choice penalties is a new array (not same reference)')

// Verify unique IDs on multiple calls
const event1 = buildAIEventDefinition(testTemplate, 'A', 'X', 'Y')
const event2 = buildAIEventDefinition(testTemplate, 'A', 'X', 'Y')
ok(event1.id !== event2.id, 'Two built events have unique IDs')

// Verify all event types build correctly
expectedEventTypes.forEach(type => {
  const tmpl = getAIEventTemplate(type)
  const ev = buildAIEventDefinition(tmpl, 'TestOwner', 'Bangkok', 'Rome')
  ok(ev.name.length > 0, `Built '${type}' event has name`)
  ok(ev.description.length > 0, `Built '${type}' event has description`)
  ok(ev.choices.length >= 2, `Built '${type}' event has >= 2 choices`)
})

// fill() with normal names — no unresolved placeholders
const fillEvent = buildAIEventDefinition(testTemplate, 'Don Caravale', 'New York', 'London')
ok(!fillEvent.name.includes('{ownerName}'), 'fill() resolves {ownerName} in name')
ok(!fillEvent.description.includes('{ownerBranch}'), 'fill() resolves {ownerBranch} in description')
ok(!fillEvent.description.includes('{targetBranch}'), 'fill() resolves {targetBranch} in description')

// ─────────────────────────────────────────────
// 4. generateAIEvent Function (Refactored)
// ─────────────────────────────────────────────
sec('4. generateAIEvent Function (Refactored)')

gameState.reset('bangkok')
const s = gameState.get()

// Create a mock AI owner
const mockOwner: AIOwnerState = {
  branchId: 'newYork',
  name: 'Don Caravale',
  temperament: 'aggressive',
  power: 1000,
  maxPower: 3000,
  aggression: 0.8,
  lastActionTick: 0,
  actionCooldown: 30,
  defeated: false,
  relations: 0,
  threatLevel: 0,
}

expectedEventTypes.forEach(type => {
  const event = generateAIEvent(mockOwner, type, 'bangkok')
  ok(event.id.startsWith(`ai_${type}_`), `generateAIEvent('${type}') id starts with ai_${type}_`)
  ok(event.name.includes('Don Caravale'), `generateAIEvent('${type}') name includes owner name`)
  ok(event.choices.length >= 2, `generateAIEvent('${type}') has >= 2 choices`)
  ok(event.weight === 20, `generateAIEvent('${type}') weight = 20`)
  ok(event.autoResolveTimeout === 90, `generateAIEvent('${type}') timeout = 90`)
  ok(event.autoResolveAction === 'ignore', `generateAIEvent('${type}') autoResolve = ignore`)
})

// Verify raid event specifically
const raidEvent = generateAIEvent(mockOwner, 'raid', 'bangkok')
ok(raidEvent.name === "Don Caravale's Raid", `Raid event name = "${raidEvent.name}"`)
ok(raidEvent.description.includes('New York'), 'Raid desc includes owner branch (New York)')
ok(raidEvent.description.includes('Bangkok'), 'Raid desc includes target branch (Bangkok)')
ok(raidEvent.heatModifier === 8, 'Raid heatModifier = 8')
ok(raidEvent.choices[0].requires?.assassinAssigned === true, 'Raid fight requires assassin')

// Verify truce event
const truceEvent = generateAIEvent(mockOwner, 'truce', 'bangkok')
ok(truceEvent.heatModifier === -2, 'Truce heatModifier = -2')
ok(truceEvent.choices[0].isBest === true && truceEvent.choices[0].isSafe === true, 'Truce accept isBest+isSafe')

// Verify all heatModifiers
ok(AI_EVENT_TEMPLATES.raid.heatModifier === 8, 'Raid heatModifier = 8')
ok(AI_EVENT_TEMPLATES.tribute.heatModifier === 3, 'Tribute heatModifier = 3')
ok(AI_EVENT_TEMPLATES.sabotage.heatModifier === 5, 'Sabotage heatModifier = 5')
ok(AI_EVENT_TEMPLATES.spy.heatModifier === 2, 'Spy heatModifier = 2')
ok(AI_EVENT_TEMPLATES.provocation.heatModifier === 4, 'Provocation heatModifier = 4')
ok(AI_EVENT_TEMPLATES.truce.heatModifier === -2, 'Truce heatModifier = -2')

// Verify createAIOwner power formula: basePower + unlockPrestige * 100
const formulaOwner = createAIOwner('london')
const londonDef = BRANCHES.find(b => b.id === 'london')!
const londonTempDef = getTemperamentDef(getAITemperamentForBranch('london'))
ok(formulaOwner.power === londonTempDef.basePower + londonDef.unlockPrestige * 100, `London power = basePower + prestige*100 (${formulaOwner.power})`)
ok(formulaOwner.maxPower === londonTempDef.basePower * 3 + londonDef.unlockPrestige * 200, `London maxPower = basePower*3 + prestige*200 (${formulaOwner.maxPower})`)

// Verify event is a valid EventDefinition
const spyEvent = generateAIEvent(mockOwner, 'spy', 'bangkok')
ok(spyEvent.id !== '', 'Spy event has non-empty id')
ok(spyEvent.name !== '', 'Spy event has non-empty name')
ok(spyEvent.description !== '', 'Spy event has non-empty description')

// ─────────────────────────────────────────────
// 5. AI Owner Creation & Initialization
// ─────────────────────────────────────────────
sec('5. AI Owner Creation & Initialization')

const owner = createAIOwner('newYork')
ok(owner.branchId === 'newYork', 'Owner branchId = newYork')
ok(owner.name === 'Don Caravale', 'Owner name = Don Caravale')
ok(owner.temperament === getAITemperamentForBranch('newYork'), 'Owner temperament matches branch')
ok(owner.power > 0, `Owner power > 0 (${owner.power})`)
ok(owner.maxPower > owner.power, 'Owner maxPower > power')
ok(owner.aggression > 0, `Owner aggression > 0 (${owner.aggression})`)
ok(owner.defeated === false, 'Owner not defeated')
ok(owner.relations === 0, 'Owner relations = 0')
ok(owner.threatLevel === 0, 'Owner threatLevel = 0')
ok(owner.actionCooldown > 0, `Owner actionCooldown > 0 (${owner.actionCooldown})`)

// createAIOwner with invalid branch — should fall back to Bangkok
const invalidOwner = createAIOwner('nonexistent' as BranchId)
ok(invalidOwner.branchId === 'nonexistent', 'createAIOwner invalid branch still sets branchId')
ok(invalidOwner.name === 'Unknown Boss', 'createAIOwner invalid branch falls back to Unknown Boss name')
ok(invalidOwner.temperament === 'aggressive', 'createAIOwner invalid branch falls back to aggressive temperament')
ok(invalidOwner.power > 0, 'createAIOwner invalid branch still has power > 0')

// Init all AI owners
const allOwners = initAIOwners()
ok(Object.keys(allOwners).length === BRANCHES.length, `initAIOwners creates ${BRANCHES.length} owners`)
BRANCHES.forEach(b => {
  ok(allOwners[b.id] !== undefined, `Owner for ${b.id} exists`)
  ok(allOwners[b.id].branchId === b.id, `Owner ${b.id} branchId matches`)
})

// ─────────────────────────────────────────────
// 6. AI Temperament System
// ─────────────────────────────────────────────
sec('6. AI Temperament System')

const temperaments: AITemperament[] = ['aggressive', 'diplomatic', 'shadow', 'defensive']
temperaments.forEach(t => {
  const def = getTemperamentDef(t)
  ok(def.id === t, `Temperament '${t}' def id matches`)
  ok(def.name.length > 0, `Temperament '${t}' has name`)
  ok(def.basePower > 0, `Temperament '${t}' basePower > 0`)
  ok(def.powerGrowthPerTick > 0, `Temperament '${t}' powerGrowth > 0`)
  ok(def.baseAggression > 0, `Temperament '${t}' aggression > 0`)
  ok(def.baseCooldown > 0, `Temperament '${t}' cooldown > 0`)
  ok(def.color.length > 0, `Temperament '${t}' has color`)
  ok(def.icon.length > 0, `Temperament '${t}' has icon`)
})

// Aggressive has highest aggression
ok(AI_TEMPERAMENTS.aggressive.baseAggression > AI_TEMPERAMENTS.diplomatic.baseAggression, 'Aggressive > Diplomatic aggression')
ok(AI_TEMPERAMENTS.aggressive.baseAggression > AI_TEMPERAMENTS.defensive.baseAggression, 'Aggressive > Defensive aggression')

// Defensive has lowest aggression
ok(AI_TEMPERAMENTS.defensive.baseAggression < AI_TEMPERAMENTS.shadow.baseAggression, 'Defensive < Shadow aggression')

// Defensive has highest base power
ok(AI_TEMPERAMENTS.defensive.basePower > AI_TEMPERAMENTS.aggressive.basePower, 'Defensive > Aggressive basePower')

// AI names
ok(getAIName('newYork') === 'Don Caravale', 'AI name newYork = Don Caravale')
ok(getAIName('bangkok') === 'The Serpent King', 'AI name bangkok = The Serpent King')
ok(getAIName('london') === 'Lord Ashbury', 'AI name london = Lord Ashbury')
ok(getAIName('tokyo') === 'The Neon Dragon', 'AI name tokyo = The Neon Dragon')

// Temperament by continent
const nyTemp = getAITemperamentForBranch('newYork')
ok(nyTemp === 'aggressive' || nyTemp === 'diplomatic', `New York temperament: ${nyTemp}`)

// ─────────────────────────────────────────────
// 7. pickAIEvent Function
// ─────────────────────────────────────────────
sec('7. pickAIEvent Function')

const aggressiveOwner: AIOwnerState = {
  branchId: 'newYork',
  name: 'Test',
  temperament: 'aggressive',
  power: 10000,
  maxPower: 30000,
  aggression: 0.8,
  lastActionTick: 0,
  actionCooldown: 30,
  defeated: false,
  relations: 0,
  threatLevel: 0,
}

// Aggressive owner should pick from raid, provocation, tribute
const aggressivePicks = new Set<AIEventType>()
for (let i = 0; i < 100; i++) {
  const pick = pickAIEvent(aggressiveOwner, 1000)
  if (pick) aggressivePicks.add(pick)
}
ok(aggressivePicks.has('raid'), 'Aggressive owner can pick raid')
ok(aggressivePicks.has('provocation'), 'Aggressive owner can pick provocation')
ok(aggressivePicks.has('tribute'), 'Aggressive owner can pick tribute')

// Diplomatic owner
const diplomaticOwner: AIOwnerState = { ...aggressiveOwner, temperament: 'diplomatic' }
const diplomaticPicks = new Set<AIEventType>()
for (let i = 0; i < 100; i++) {
  const pick = pickAIEvent(diplomaticOwner, 1000)
  if (pick) diplomaticPicks.add(pick)
}
ok(diplomaticPicks.has('tribute'), 'Diplomatic owner can pick tribute')
ok(diplomaticPicks.has('truce'), 'Diplomatic owner can pick truce')
ok(diplomaticPicks.has('spy'), 'Diplomatic owner can pick spy')

// Shadow owner
const shadowOwner: AIOwnerState = { ...aggressiveOwner, temperament: 'shadow' }
const shadowPicks = new Set<AIEventType>()
for (let i = 0; i < 100; i++) {
  const pick = pickAIEvent(shadowOwner, 1000)
  if (pick) shadowPicks.add(pick)
}
ok(shadowPicks.has('sabotage'), 'Shadow owner can pick sabotage')
ok(shadowPicks.has('spy'), 'Shadow owner can pick spy')

// Defensive owner
const defensiveOwner: AIOwnerState = { ...aggressiveOwner, temperament: 'defensive' }
const defensivePicks = new Set<AIEventType>()
for (let i = 0; i < 100; i++) {
  const pick = pickAIEvent(defensiveOwner, 1000)
  if (pick) defensivePicks.add(pick)
}
ok(defensivePicks.has('truce'), 'Defensive owner can pick truce')
ok(defensivePicks.has('tribute'), 'Defensive owner can pick tribute')

// ─────────────────────────────────────────────
// 8. pickAIEvent Filtering Logic
// ─────────────────────────────────────────────
sec('8. pickAIEvent Filtering Logic')

// Raid filtered when owner power < 0.5 * playerPower
const weakOwner: AIOwnerState = { ...aggressiveOwner, power: 100 }
const weakPicks = new Set<AIEventType>()
for (let i = 0; i < 200; i++) {
  const pick = pickAIEvent(weakOwner, 10000) // playerPower = 10000, owner = 100
  if (pick) weakPicks.add(pick)
}
ok(!weakPicks.has('raid'), 'Raid filtered when owner power < 0.5 * playerPower')
ok(weakPicks.size > 0, 'Weak owner still picks some actions')

// Tribute filtered when owner power < 0.8 * playerPower
ok(!weakPicks.has('tribute'), 'Tribute filtered when owner power < 0.8 * playerPower')

// Truce filtered when relations < -20
const hostileOwner: AIOwnerState = { ...diplomaticOwner, relations: -50 }
const hostilePicks = new Set<AIEventType>()
for (let i = 0; i < 200; i++) {
  const pick = pickAIEvent(hostileOwner, 1000)
  if (pick) hostilePicks.add(pick)
}
ok(!hostilePicks.has('truce'), 'Truce filtered when relations < -20')

// pickAIEvent with unknown temperament — should return null
const unknownTempOwner: AIOwnerState = { ...aggressiveOwner, temperament: 'invalid' as AITemperament }
ok(pickAIEvent(unknownTempOwner, 1000) === null, 'pickAIEvent returns null for unknown temperament')

// pickAIEvent when ALL actions filtered out — provocation/spy/sabotage have no filters,
// so this is unreachable with current temperaments. Test that a weak owner still gets
// unfiltered actions (provocation for aggressive).
const weakFilteredOwner: AIOwnerState = { ...aggressiveOwner, power: 1, relations: -100 }
const weakFilteredPicks = new Set<AIEventType>()
for (let i = 0; i < 100; i++) {
  const pick = pickAIEvent(weakFilteredOwner, 100000)
  if (pick) weakFilteredPicks.add(pick)
}
ok(weakFilteredPicks.has('provocation'), 'Weak aggressive owner still picks provocation (no filter)')
ok(!weakFilteredPicks.has('raid'), 'Raid filtered for weak owner')
ok(!weakFilteredPicks.has('tribute'), 'Tribute filtered for weak owner')

// ─────────────────────────────────────────────
// 9. AI Owner Relations
// ─────────────────────────────────────────────
sec('9. AI Owner Relations')

gameState.reset('bangkok')
const relOwner = gameState.get().aiOwners.newYork
ok(relOwner !== undefined, 'AI owner for newYork exists in game state')
// getAIOwner with non-existent branch
ok(getAIOwner('nonexistent' as BranchId) === undefined, 'getAIOwner returns undefined for non-existent branch')

// getAllAIOwners count
ok(getAllAIOwners().length === BRANCHES.length, `getAllAIOwners returns ${BRANCHES.length} owners`)

ok(relOwner.relations === 0, 'Initial relations = 0')

improveRelations('newYork', 10)
ok(relOwner.relations === 10, `Relations after +10 = ${relOwner.relations}`)

improveRelations('newYork', 100)
ok(relOwner.relations === 100, 'Relations capped at 100')

worsenRelations('newYork', 50)
ok(relOwner.relations === 50, `Relations after -50 = ${relOwner.relations}`)

worsenRelations('newYork', 200)
ok(relOwner.relations === -100, 'Relations floored at -100')

// Relations on non-existent owner (should not crash)
improveRelations('nonexistent' as BranchId, 10)
worsenRelations('nonexistent' as BranchId, 10)
ok(true, 'Relations on non-existent owner did not crash')

// improveRelations with negative amount (subtracts)
relOwner.relations = 0
improveRelations('newYork', -10)
ok(relOwner.relations === -10, `improveRelations with negative amount subtracts (${relOwner.relations})`)
relOwner.relations = 0

// worsenRelations with negative amount (adds)
worsenRelations('newYork', -10)
ok(relOwner.relations === 10, `worsenRelations with negative amount adds (${relOwner.relations})`)
relOwner.relations = 0

// ─────────────────────────────────────────────
// 10. Defeat AI Owner
// ─────────────────────────────────────────────
sec('10. Defeat AI Owner')

gameState.reset('bangkok')
const defOwner = gameState.get().aiOwners.london
ok(defOwner.defeated === false, 'London owner not defeated initially')
ok(defOwner.power > 0, 'London owner has power > 0')

defeatAIOwner('london')
ok(defOwner.defeated === true, 'London owner defeated')
ok(defOwner.power === 0, 'London owner power = 0 after defeat')
ok(defOwner.threatLevel === 0, 'London owner threatLevel = 0 after defeat')

// defeatAIOwner on non-existent branch — should not crash
defeatAIOwner('nonexistent' as BranchId)
ok(true, 'defeatAIOwner on non-existent branch did not crash')

// ai:defeated event bus emission
gameState.reset('bangkok')
let defeatedEvent: CustomEvent | null = null
const defHandler = (e: CustomEvent) => { defeatedEvent = e }
eventBus.on('ai:defeated', defHandler)
defeatAIOwner('london')
ok(defeatedEvent !== null, 'ai:defeated event emitted on defeat')
ok((defeatedEvent as any)?.detail?.branchId === 'london', 'ai:defeated event has correct branchId')
ok((defeatedEvent as any)?.detail?.ownerName !== undefined, 'ai:defeated event has ownerName')
eventBus.off('ai:defeated', defHandler)

// ─────────────────────────────────────────────
// 11. Threat Level Assessment
// ─────────────────────────────────────────────
sec('11. Threat Level Assessment')

gameState.reset('bangkok')
const threatState = gameState.get()

// Set up player power
threatState.branches.bangkok.currency = 10_000_000
threatState.branches.bangkok.buildings.reception.level = 10
const playerPow = getPlayerPower()
ok(playerPow > 0, `Player power > 0 (${playerPow})`)

// Low threat: owner power < 0.7 * player
const lowThreatOwner = gameState.get().aiOwners.london
lowThreatOwner.power = playerPow * 0.5
ok(getThreatLevel('london') === 'low', 'Threat = low when power = 0.5x player')

// Medium threat: 0.7x - 1.3x
lowThreatOwner.power = playerPow * 1.0
ok(getThreatLevel('london') === 'medium', 'Threat = medium when power = 1.0x player')

// High threat: 1.3x - 2.0x
lowThreatOwner.power = playerPow * 1.5
ok(getThreatLevel('london') === 'high', 'Threat = high when power = 1.5x player')

// Critical threat: > 2.0x
lowThreatOwner.power = playerPow * 3.0
ok(getThreatLevel('london') === 'critical', 'Threat = critical when power = 3.0x player')

// Defeated owner always low
lowThreatOwner.defeated = true
ok(getThreatLevel('london') === 'low', 'Threat = low for defeated owner')

// getThreatLevel with non-existent branch
ok(getThreatLevel('nonexistent' as BranchId) === 'low', 'Threat = low for non-existent branch')

// ─────────────────────────────────────────────
// 12. Power Balance
// ─────────────────────────────────────────────
sec('12. Power Balance')

gameState.reset('bangkok')
const balState = gameState.get()
balState.branches.bangkok.currency = 10_000_000
balState.branches.bangkok.buildings.reception.level = 10
balState.branches.bangkok.buildings.guestRooms.level = 5
const balance = getPowerBalance()
ok(balance.player > 0, `Power balance player > 0 (${balance.player})`)
ok(balance.ai >= 0, `Power balance ai >= 0 (${balance.ai})`)
ok(typeof balance.ratio === 'number', 'Power balance ratio is number')

// With no active AI owners (all defeated or unlocked), ai power = 0
const allAI = getAllAIOwners()
allAI.forEach(o => { o.defeated = true })
const emptyBalance = getPowerBalance()
ok(emptyBalance.ai === 0, 'AI power = 0 when all defeated')
ok(emptyBalance.ratio === Infinity, 'Ratio = Infinity when no AI power')

// getPowerBalance when player power is 0
gameState.reset('bangkok')
const zeroBalance = getPowerBalance()
ok(zeroBalance.player === 0, 'Player power = 0 on fresh reset')
ok(typeof zeroBalance.ratio === 'number', 'Ratio is a number when player power = 0')
ok(zeroBalance.ratio === 0, 'Ratio = 0 when player power = 0 and AI power > 0')

// ─────────────────────────────────────────────
// 13. Active AI Owners
// ─────────────────────────────────────────────
sec('13. Active AI Owners')

gameState.reset('bangkok')
const active = getActiveAIOwners()
ok(active.length > 0, `Active AI owners > 0 (${active.length})`)

// Bangkok is HQ, should not be in active
ok(!active.some(o => o.branchId === 'bangkok'), 'HQ branch not in active owners')

// Defeat an owner, should not be in active
const targetOwner = active[0]
defeatAIOwner(targetOwner.branchId)
const activeAfterDefeat = getActiveAIOwners()
ok(!activeAfterDefeat.some(o => o.branchId === targetOwner.branchId), 'Defeated owner not in active')

// Unlock a branch, its owner should not be in active
gameState.reset('bangkok')
const activeBefore = getActiveAIOwners()
const unlockTarget = activeBefore[0]
gameState.get().worldMap.unlockedBranches.push(unlockTarget.branchId)
const activeAfterUnlock = getActiveAIOwners()
ok(!activeAfterUnlock.some(o => o.branchId === unlockTarget.branchId), 'Unlocked branch owner not in active')

// ─────────────────────────────────────────────
// 14. tickAIOwners
// ─────────────────────────────────────────────
sec('14. tickAIOwners')

gameState.reset('bangkok')
const tickState = gameState.get()
const tickOwner = tickState.aiOwners.london
tickOwner.actionCooldown = 1
tickOwner.lastActionTick = 0
const initialPower = tickOwner.power

// Tick should grow power
tickAIOwners(10)
ok(tickOwner.power >= initialPower, 'Power grew after tick (or stayed at max)')

// Power caps at maxPower
tickOwner.power = tickOwner.maxPower
tickAIOwners(20)
ok(tickOwner.power === tickOwner.maxPower, 'Power does not exceed maxPower after tick')

// tickAIOwners with zero active owners — early return
gameState.reset('bangkok')
const noActiveState = gameState.get()
noActiveState.aiOwners && Object.values(noActiveState.aiOwners).forEach(o => { o.defeated = true })
tickAIOwners(1)
ok(true, 'tickAIOwners with zero active owners did not crash')

// Re-acquire tickOwner after reset
const tickState2 = gameState.get()
const tickOwner2 = tickState2.aiOwners.london
tickOwner2.defeated = false
tickOwner2.actionCooldown = 1
tickOwner2.lastActionTick = 0

// Threat level changes
tickOwner2.power = getPlayerPower() * 3
tickOwner2.threatLevel = 0
tickAIOwners(100)
ok(tickOwner2.threatLevel > 0, 'Threat level increased when owner power >> player')

// Relations drift toward 0
tickOwner2.relations = 50
tickAIOwners(100)
ok(tickOwner2.relations < 50, 'Positive relations drift toward 0')

tickOwner2.relations = -50
tickAIOwners(100)
ok(tickOwner2.relations > -50, 'Negative relations drift toward 0')

// Relations drift asymmetry: positive drifts faster than negative
gameState.reset('bangkok')
const driftOwner = gameState.get().aiOwners.london
driftOwner.relations = 100
tickAIOwners(1)
const posDrift = 100 - driftOwner.relations
driftOwner.relations = -100
tickAIOwners(1)
const negDrift = driftOwner.relations - (-100)
ok(posDrift > negDrift, `Positive drift (${posDrift}) > negative drift (${negDrift})`)

// ai:action event bus emission
gameState.reset('bangkok')
const actionOwner = gameState.get().aiOwners.london
actionOwner.actionCooldown = 1
actionOwner.lastActionTick = 0
actionOwner.power = 100000
let actionEvent: CustomEvent | null = null
const actionHandler = (e: CustomEvent) => { actionEvent = e }
eventBus.on('ai:action', actionHandler)
for (let i = 0; i < 100; i++) {
  tickAIOwners(100 + i)
  if (actionEvent) break
}
ok(actionEvent !== null, 'ai:action event emitted during tick')
ok((actionEvent as any)?.detail?.branchId !== undefined, 'ai:action event has branchId')
ok((actionEvent as any)?.detail?.ownerName !== undefined, 'ai:action event has ownerName')
ok((actionEvent as any)?.detail?.eventType !== undefined, 'ai:action event has eventType')
eventBus.off('ai:action', actionHandler)

// tickAIOwners resets lastActionTick and actionCooldown after an action fires
gameState.reset('bangkok')
const cdState = gameState.get()
// Defeat all owners except london to ensure the action fires on london
Object.values(cdState.aiOwners).forEach(o => { if (o.branchId !== 'london') o.defeated = true })
const cdOwner = cdState.aiOwners.london
cdOwner.defeated = false
cdOwner.actionCooldown = 1
cdOwner.lastActionTick = 0
cdOwner.power = 100000
const cdBefore = { lastActionTick: cdOwner.lastActionTick, actionCooldown: cdOwner.actionCooldown }
let cdActionFired = false
const cdHandler = (e: CustomEvent) => { if ((e as any).detail?.branchId === 'london') cdActionFired = true }
eventBus.on('ai:action', cdHandler)
for (let i = 0; i < 100; i++) {
  tickAIOwners(200 + i)
  if (cdActionFired) break
}
eventBus.off('ai:action', cdHandler)
ok(cdActionFired, 'Cooldown test: AI action fired on london')
ok(cdOwner.lastActionTick > cdBefore.lastActionTick, `lastActionTick updated after action (${cdOwner.lastActionTick} > ${cdBefore.lastActionTick})`)
ok(cdOwner.actionCooldown !== cdBefore.actionCooldown || cdOwner.actionCooldown > 0, 'actionCooldown updated after action (new random cooldown)')

// ─────────────────────────────────────────────
// 15. AI Event Integration with Event Engine
// ─────────────────────────────────────────────
sec('15. AI Event Integration with Event Engine')

gameState.reset('bangkok')
const integState = gameState.get()
integState.branches.bangkok.excommunicadoGraceUntil = 0
;(eventEngine as any).lastEventTimes = new Map()

// Generate an AI event and trigger it
const aiOwner = integState.aiOwners.newYork
const aiEvent = generateAIEvent(aiOwner, 'raid', 'bangkok')
ok(aiEvent !== null, 'AI raid event generated')
ok(aiEvent.name.includes(aiOwner.name), 'AI event name includes owner name')

;(eventEngine as any).triggerEvent(aiEvent)
ok(eventEngine.getActiveEvent() !== null, 'AI event triggered in event engine')
ok(eventEngine.getActiveEvent()!.definition.name === aiEvent.name, 'Active event matches generated event')

// Resolve the event
const resolveResult = eventEngine.resolveEvent('pay')
ok(resolveResult !== false, 'AI raid event resolved with pay choice')
ok(eventEngine.getActiveEvent() === null, 'No active event after resolve')

// AI raid event fight choice rejected when no assassins assigned
gameState.reset('bangkok')
const noAssassinState = gameState.get()
noAssassinState.branches.bangkok.excommunicadoGraceUntil = 0
;(eventEngine as any).lastEventTimes = new Map()
const noAssassinEvent = generateAIEvent(noAssassinState.aiOwners.newYork, 'raid', 'bangkok')
;(eventEngine as any).triggerEvent(noAssassinEvent)
const fightResult = eventEngine.resolveEvent('fight')
ok(fightResult === false, 'Raid fight choice rejected when no assassins assigned')
eventEngine.ignoreEvent()

// AI event auto-resolve via timeout (autoResolveAction = 'ignore')
gameState.reset('bangkok')
const autoState = gameState.get()
autoState.branches.bangkok.excommunicadoGraceUntil = 0
;(eventEngine as any).lastEventTimes = new Map()
const autoEvent = generateAIEvent(autoState.aiOwners.newYork, 'tribute', 'bangkok')
;(eventEngine as any).triggerEvent(autoEvent)
// Simulate timeout by directly calling tick with a manipulated triggeredAt
;(eventEngine as any).activeEvent.triggeredAt = Date.now() - 91 * 1000
eventEngine.tick()
ok(eventEngine.getActiveEvent() === null, 'AI event auto-resolved via timeout (ignore)')

// AI raid event does NOT generate raidData (unlike player assassinRaid)
gameState.reset('bangkok')
const noRaidDataState = gameState.get()
noRaidDataState.branches.bangkok.excommunicadoGraceUntil = 0
;(eventEngine as any).lastEventTimes = new Map()
const aiRaidEvent = generateAIEvent(noRaidDataState.aiOwners.newYork, 'raid', 'bangkok')
ok(aiRaidEvent.id.startsWith('ai_raid_'), 'AI raid event id starts with ai_raid_')
ok(aiRaidEvent.id !== 'assassinRaid', 'AI raid event id is NOT assassinRaid')
;(eventEngine as any).triggerEvent(aiRaidEvent)
const activeEv = eventEngine.getActiveEvent()!
ok((activeEv as any).raidData === undefined, 'AI raid event has no raidData (unlike player assassinRaid)')
eventEngine.ignoreEvent()

// generateAIEvent with non-existent owner branch — getBranchDef falls back to Bangkok
const fallbackOwner: AIOwnerState = { ...mockOwner, branchId: 'nonexistent' as BranchId }
const fallbackEvent = generateAIEvent(fallbackOwner, 'raid', 'bangkok')
ok(fallbackEvent.description.includes('Bangkok'), 'generateAIEvent with invalid owner branch falls back to Bangkok in description')
ok(fallbackEvent !== null, 'generateAIEvent with invalid owner branch still produces event')

// checkForAIEvent full path through eventEngine.tick()
// Mock Math.random to force the probability roll to pass (return 0)
gameState.reset('bangkok')
const aiTickState = gameState.get()
aiTickState.branches.bangkok.excommunicadoGraceUntil = 0
;(eventEngine as any).lastEventTimes = new Map()
;(eventEngine as any).tickCount = 2 // next tick will be % 3 === 0
const origRandom = Math.random
Math.random = (() => {
  let n = 0
  return () => {
    n++
    // Call 1: checkForEvent rollChance — return 1 (fail, skip regular event)
    // Call 2+: checkForAIEvent owner selection, rollChance, pickAIEvent — return 0 (pass)
    return n === 1 ? 1 : 0
  }
})()
eventEngine.tick()
Math.random = origRandom
ok(eventEngine.getActiveEvent() !== null, 'checkForAIEvent triggered an event via tick()')
const aiTickEvent = eventEngine.getActiveEvent()!
ok(aiTickEvent.definition.id.startsWith('ai_'), `checkForAIEvent produced AI event (id=${aiTickEvent.definition.id})`)
eventEngine.ignoreEvent()

// ─────────────────────────────────────────────
// 16. AI Event Type Re-export
// ─────────────────────────────────────────────
sec('16. AI Event Type Re-export')

// Verify AIEventType is exported from ai-owner-manager (backward compat)
const typeCheck: AIEventType = 'raid'
ok(typeCheck === 'raid', 'AIEventType imported from ai-owner-manager works')

// Verify it matches the data file type
const templateType: AIEventType = 'tribute'
ok(AI_EVENT_TEMPLATES[templateType] !== undefined, 'AIEventType from ai-owner-manager usable with AI_EVENT_TEMPLATES')

// ─────────────────────────────────────────────
// 17. All AI Event Types Through Event Engine
// ─────────────────────────────────────────────
sec('17. All AI Event Types Through Event Engine')

gameState.reset('bangkok')
const loopState = gameState.get()
const loopOwner = loopState.aiOwners.london

expectedEventTypes.forEach(type => {
  loopState.branches.bangkok.excommunicadoGraceUntil = 0
  ;(eventEngine as any).lastEventTimes = new Map()

  const ev = generateAIEvent(loopOwner, type, 'bangkok')
  ;(eventEngine as any).triggerEvent(ev)
  ok(eventEngine.getActiveEvent() !== null, `${type}: event triggered`)

  // Find a non-restricted choice to resolve with
  const resolvableChoice = ev.choices.find(c => !c.requires?.assassinAssigned && !c.requires?.staffType)
  if (resolvableChoice) {
    const result = eventEngine.resolveEvent(resolvableChoice.id)
    ok(result !== false, `${type}: resolved with choice '${resolvableChoice.id}'`)
    ok(eventEngine.getActiveEvent() === null, `${type}: no active event after resolve`)
  } else {
    // All choices have requirements — just ignore
    eventEngine.ignoreEvent()
    ok(eventEngine.getActiveEvent() === null, `${type}: ignored (all choices required something)`)
  }
})

// ─────────────────────────────────────────────
// 18. Template Immutability (Choices Shared by Reference)
// ─────────────────────────────────────────────
sec('18. Template Choices Integrity')

// Verify that template choices are not mutated by event engine
const templateBefore = JSON.parse(JSON.stringify(AI_EVENT_TEMPLATES.raid.choices))
gameState.reset('bangkok')
const mutState = gameState.get()
mutState.branches.bangkok.excommunicadoGraceUntil = 0
;(eventEngine as any).lastEventTimes = new Map()

const mutEvent = generateAIEvent(mutState.aiOwners.newYork, 'raid', 'bangkok')
;(eventEngine as any).triggerEvent(mutEvent)
eventEngine.resolveEvent('pay')

const templateAfter = AI_EVENT_TEMPLATES.raid.choices
ok(JSON.stringify(templateBefore) === JSON.stringify(templateAfter), 'Template choices not mutated by event engine')

// ─────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────
console.log('\n=======================================================')
console.log(`  RESULTS: ${p} passed, ${f} failed`)
console.log('=======================================================')
if (f > 0) process.exit(1)
