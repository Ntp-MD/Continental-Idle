import { test } from 'vitest'
import assert from 'node:assert/strict'
import type { NpcEngineEvent } from '../../src/engine/npc'
import {
	createTakingsLedger,
	formatTakings,
	rateForTags,
	TAKING_RATES_CENTS,
	visitorRoleIds,
	type FactionDay,
	type TakingsLedger,
} from '../../src/blueprint-editor/domain/economy/takings'
import { ANONYMOUS_FACTION, type Faction } from '../../src/blueprint-editor/domain/economy/standing-world'

const GUEST = 'role-guest'
const STAFF = 'role-bartender'
const TICKS_PER_SECOND = 10

function ledgerFor(membership: ReadonlySet<string> = new Set([GUEST])) {
	return createTakingsLedger({ ticksPerSecond: TICKS_PER_SECOND, isVisitor: roleId => membership.has(roleId) })
}

function endAt(agentId: string, itemId: string, spotId: string, tick = 5): NpcEngineEvent {
	return { type: 'interaction-end', agentId, floorId: 'f1', itemId, interactSpotId: spotId, tick }
}

/** The app resolves tags off the built engine layout; here the target table stands in for it. */
function resolver(
	tagsByTarget: Record<string, readonly string[]>,
	roleByAgent: Record<string, string>,
	factionByAgent?: Record<string, Faction>,
) {
	return (event: NpcEngineEvent) => {
		const roleId = roleByAgent[event.agentId]
		if (roleId === undefined) return undefined
		const key = event.itemId && event.interactSpotId ? `${event.floorId}:${event.itemId}:${event.interactSpotId}` : ''
		return { roleId, tags: tagsByTarget[key] ?? [], faction: factionByAgent?.[event.agentId] }
	}
}

test('a visitor completing a service at a priced facility pays that facility once', () => {
	const ledger = ledgerFor()
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST }))
	const snapshot = ledger.snapshot()
	assert.equal(snapshot.bankCents, TAKING_RATES_CENTS.bar)
	assert.equal(snapshot.served, 1)
	assert.deepEqual(snapshot.byTag, [{ tag: 'bar', cents: TAKING_RATES_CENTS.bar, count: 1 }])
})

test('staff completing the same interaction earns nothing', () => {
	const ledger = ledgerFor()
	ledger.ingest([endAt('s1', 'object:bar-1', 'spot-1')], 5, resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { s1: STAFF }))
	assert.equal(ledger.snapshot().bankCents, 0)
	assert.equal(ledger.snapshot().served, 0)
	assert.deepEqual(ledger.snapshot().byTag, [])
})

test('a role that holds a duty post is staff, and a role that holds none is a customer', () => {
	const members = visitorRoleIds([
		{ id: 'role-guest', taskIds: [] },
		{ id: 'role-server', taskIds: ['task-cafe'] },
		{ id: 'role-barback', taskIds: [] },
	])
	assert.deepEqual([...members], ['role-guest', 'role-barback'])
	assert.deepEqual([...visitorRoleIds([{ id: 'role-chef', taskIds: ['task-pass'] }])], [])
})

test('a duty post never bills, even when the agent is a visitor', () => {
	const ledger = ledgerFor()
	ledger.ingest(
		[endAt('a1', 'object:bar-1', 'spot-1')],
		5,
		// The post shares a tag the tariff pays for. Without it the fixture bills nothing on its own
		// merits and the test passes whether or not the post rule holds - which is how this guard went
		// blind when the tariff moved.
		resolver({ 'f1:object:bar-1:spot-1': ['bar', 'post:bar-station'] }, { a1: GUEST }),
	)
	assert.equal(ledger.snapshot().bankCents, 0)
	assert.equal(ledger.snapshot().served, 0, 'a duty post was counted as a served client')
})

test('a free facility is consumed but not billed', () => {
	const ledger = ledgerFor()
	ledger.ingest([endAt('a1', 'object:sofa-1', 'spot-1')], 5, resolver({ 'f1:object:sofa-1:spot-1': ['lounge', 'seating'] }, { a1: GUEST }))
	assert.equal(ledger.snapshot().bankCents, 0)
	assert.equal(ledger.snapshot().served, 0)
})

test('starting an interaction never pays; only completing one does', () => {
	const ledger = ledgerFor()
	const resolve = resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST })
	ledger.ingest([{ type: 'interaction-start', agentId: 'a1', floorId: 'f1', itemId: 'object:bar-1', interactSpotId: 'spot-1', tick: 5 }], 5, resolve)
	assert.equal(ledger.snapshot().bankCents, 0)
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 15, resolve)
	assert.equal(ledger.snapshot().bankCents, TAKING_RATES_CENTS.bar)
})

test('one interaction bills at the best qualifying rate, never twice', () => {
	// The expensive tag must NOT come first: taken in list order, `bar` would look correct and the
	// rule would go untested. Found by `npm run test:mutation`, which caught exactly that.
	const best = rateForTags(['lounge', 'bar', 'contract-board'])
	assert.ok(best)
	assert.equal(best.tag, 'contract-board')
	assert.equal(best.cents, TAKING_RATES_CENTS['contract-board'])
	assert.equal(rateForTags(['bar', 'contract-board'])?.cents, TAKING_RATES_CENTS['contract-board'])
	assert.equal(rateForTags(['contract-board', 'contract-closed'])?.cents, TAKING_RATES_CENTS['contract-closed'])
	const ledger = ledgerFor()
	ledger.ingest([endAt('a1', 'object:table-1', 'spot-1')], 5, resolver({ 'f1:object:table-1:spot-1': ['lounge', 'bar', 'contract-board'] }, { a1: GUEST }))
	assert.equal(ledger.snapshot().bankCents, TAKING_RATES_CENTS['contract-board'])
})

test('an unresolved agent is ignored instead of throwing', () => {
	const ledger = ledgerFor()
	ledger.ingest([endAt('ghost', 'object:bar-1', 'spot-1')], 5, resolver({}, {}))
	assert.equal(ledger.snapshot().bankCents, 0)
})

test('giving up on a line and losing the line are counted apart, and only for visitors', () => {
	const ledger = ledgerFor()
	const resolve = resolver({}, { a1: GUEST, s1: STAFF })
	const left = (agentId: string, reason: 'impatient' | 'queue-left'): NpcEngineEvent => ({
		type: 'waiting',
		agentId,
		floorId: 'f1',
		reason,
		tick: 20,
	})
	ledger.ingest(
		[left('a1', 'impatient'), left('a1', 'queue-left'), left('s1', 'impatient'), left('ghost', 'impatient')],
		20,
		resolve,
	)
	const snapshot = ledger.snapshot()
	assert.equal(snapshot.walkOuts, 1, 'only the visitor that ran out of patience is a walk-out')
	assert.equal(snapshot.queueAbandons, 1, 'a line whose facility went away is a separate cause')
})

test('the income rate drains with the window while the bank keeps counting', () => {
	const ledger = ledgerFor()
	const resolve = resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolve)
	assert.equal(ledger.snapshot().perMinuteCents, TAKING_RATES_CENTS.bar * 2)

	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 155, resolve)
	const midWindow = ledger.snapshot()
	assert.equal(midWindow.simSeconds, 15)
	assert.equal(midWindow.perMinuteCents, TAKING_RATES_CENTS.bar * 4)
	assert.equal(midWindow.bankCents, TAKING_RATES_CENTS.bar * 2)

	// Second 46 is past the window for both payments (0 and 15), so the rate is empty again.
	ledger.ingest([], 460, resolve)
	const later = ledger.snapshot()
	assert.equal(later.perMinuteCents, 0)
	assert.equal(later.bankCents, TAKING_RATES_CENTS.bar * 2)
})

test('money is whole cents, so a long run cannot drift', () => {
	const ledger = ledgerFor()
	const resolve = resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST })
	const events = Array.from({ length: 300 }, (_, i) => endAt('a1', 'object:bar-1', 'spot-1', i + 1))
	ledger.ingest(events, 300, resolve)
	assert.equal(Number.isInteger(ledger.snapshot().bankCents), true)
	assert.equal(ledger.snapshot().bankCents, 300 * TAKING_RATES_CENTS.bar)
})

test('reset clears the night and the counters, but keeps the money that already arrived', () => {
	const ledger = ledgerFor()
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST }))
	ledger.reset()
	const snapshot = ledger.snapshot()
	// A re-deploy re-measures the lobby; it does not take the bank back to what the session walked in
	// with. This asserted 0 while `pay()` left `carriedCents` alone, so clearing the simulation cost the
	// player a service they had already been paid for - and the next autosave saved the smaller bank.
	assert.equal(snapshot.bankCents, TAKING_RATES_CENTS.bar)
	assert.equal(snapshot.perMinuteCents, 0)
	assert.equal(snapshot.served, 0)
	assert.deepEqual(snapshot.byTag, [])
})

function dayLedger(daySeconds: number) {
	return createTakingsLedger({
		ticksPerSecond: TICKS_PER_SECOND,
		daySeconds,
		isVisitor: roleId => new Set([GUEST]).has(roleId),
	})
}

test('a day closes on the clock and the live rate is projected onto it', () => {
	const ledger = dayLedger(60)
	const resolve = resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolve)
	const open = ledger.snapshot()
	assert.equal(open.daysCompleted, 0)
	assert.equal(open.todayCents, TAKING_RATES_CENTS.bar)
	// 30 s of window held one 380 payment, so a 60 s day projects to double it.
	assert.equal(open.perDayCents, TAKING_RATES_CENTS.bar * 2)
	assert.equal(open.servicesPerDay, 2)

	ledger.ingest([], 610, resolve)
	const closed = ledger.snapshot()
	assert.equal(closed.simSeconds, 61)
	assert.equal(closed.daysCompleted, 1)
	assert.equal(closed.lastDayCents, TAKING_RATES_CENTS.bar)
	assert.equal(closed.todayCents, 0)
})

test('an idle day closes at zero instead of staying open', () => {
	const ledger = dayLedger(60)
	const resolve = resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolve)
	ledger.ingest([], 2000, resolve)
	const snapshot = ledger.snapshot()
	assert.equal(snapshot.daysCompleted, 3)
	assert.equal(snapshot.lastDayCents, 0)
	assert.equal(snapshot.bankCents, TAKING_RATES_CENTS.bar)
	assert.equal(snapshot.perDayCents, 0)
})

test('reset closes the day book too', () => {
	const ledger = dayLedger(60)
	const resolve = resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolve)
	ledger.ingest([], 610, resolve)
	ledger.reset()
	const snapshot = ledger.snapshot()
	assert.equal(snapshot.daysCompleted, 0)
	assert.equal(snapshot.lastDayCents, 0)
	assert.equal(snapshot.todayCents, 0)
	assert.equal(snapshot.perDayCents, 0)
	assert.equal(snapshot.servicesPerDay, 0)
})

test('sources rank by what they earned, not by how often they were used', () => {
	const ledger = ledgerFor()
	const resolve = resolver(
		{ 'f1:object:bar-1:spot-1': ['bar'], 'f1:object:table-1:spot-1': ['contract-board'] },
		{ a1: GUEST },
	)
	ledger.ingest(
		[
			endAt('a1', 'object:bar-1', 'spot-1', 5),
			endAt('a1', 'object:bar-1', 'spot-1', 6),
			endAt('a1', 'object:bar-1', 'spot-1', 7),
			endAt('a1', 'object:table-1', 'spot-1', 8),
		],
		8,
		resolve,
	)
	assert.deepEqual(
		ledger.snapshot().byTag.map(entry => entry.tag),
		['bar', 'contract-board'],
	)
})

test('takings read as money, not as cents', () => {
	assert.equal(formatTakings(0), '0.00')
	assert.equal(formatTakings(380), '3.80')
	assert.equal(formatTakings(123456), '1,234.56')
})

const DAY_TICKS = 300 * TICKS_PER_SECOND

interface ClosedDay {
	readonly day: number
	readonly served: number
	readonly walkOuts: number
	readonly byFaction: Readonly<Partial<Record<Faction, FactionDay>>>
}

/** A ledger that keeps every close, so the night the world is handed can be read as a value. */
function dayBook(): { ledger: TakingsLedger; closes: ClosedDay[] } {
	const closes: ClosedDay[] = []
	const ledger = createTakingsLedger({
		ticksPerSecond: TICKS_PER_SECOND,
		isVisitor: roleId => roleId === GUEST,
		onDayClose: day => {
			closes.push({ day: day.day, served: day.served, walkOuts: day.walkOuts, byFaction: day.byFaction })
		},
	})
	return { ledger, closes }
}

function impatientAt(agentId: string, tick: number): NpcEngineEvent {
	return { type: 'waiting', agentId, floorId: 'f1', tick, reason: 'impatient' }
}

function lineClosedUnder(agentId: string, tick: number): NpcEngineEvent {
	return { type: 'waiting', agentId, floorId: 'f1', tick, reason: 'queue-left' }
}

const BAR_TARGET = { 'f1:object:bar-1:spot-1': ['bar'] as string[] }

test('a closed day hands the world the night counted by faction, not once in total', () => {
	const { ledger, closes } = dayBook()
	const resolve = resolver(BAR_TARGET, { a1: GUEST, a2: GUEST }, { a1: 'rival', a2: 'continental' })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1'), impatientAt('a1', 6), impatientAt('a2', 7)], DAY_TICKS, resolve)
	assert.equal(closes.length, 1)
	// One night, two houses: a rival served and a rival turned away, and a continental who walked out.
	// The old reading charged all three to every faction on the roster.
	assert.deepEqual(closes[0].byFaction, { rival: { served: 1, lost: 1 }, continental: { served: 0, lost: 1 } })
	assert.equal(closes[0].served, 1)
	assert.equal(closes[0].walkOuts, 2)
})

test('a faction with no client tonight is absent from the book, and the book is per night', () => {
	const { ledger, closes } = dayBook()
	const resolve = resolver(BAR_TARGET, { a1: GUEST }, { a1: 'underworld' })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolve)
	// An empty second day: the world must be told nobody came, not shown yesterday's clients again.
	ledger.ingest([], DAY_TICKS * 2, resolve)
	assert.deepEqual(closes[0].byFaction, { underworld: { served: 1, lost: 0 } })
	assert.deepEqual(closes[1].byFaction, {}, 'the faction book was not cleared at the close')
	assert.equal(closes[1].served, 1, 'the totals stay cumulative while the night is not')
})

test('a client the house cannot place is a neutral one, and a closed line is the house\'s own fault', () => {
	const { ledger, closes } = dayBook()
	// No faction map at all: a standing crowd the world never released. `creditService` still has an
	// answer for who was served, because a lobby with no answer moves no world at all.
	const anonymous = resolver(BAR_TARGET, { a1: GUEST, a2: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1'), lineClosedUnder('a2', 6)], DAY_TICKS, anonymous)
	assert.equal(ANONYMOUS_FACTION, 'neutral')
	assert.deepEqual(closes[0].byFaction, { [ANONYMOUS_FACTION]: { served: 1, lost: 0 } })
	assert.equal(ledger.snapshot().queueAbandons, 1, 'the abandonment itself is still counted')
	// A line whose facility went away is the house failing, not a faction's client being turned away:
	// it must not sour standing with the family that sent them.
})

test('staff completions are not a client being served', () => {
	const { ledger, closes } = dayBook()
	const resolve = resolver(BAR_TARGET, { s1: STAFF }, { s1: 'rival' })
	ledger.ingest([endAt('s1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolve)
	assert.deepEqual(closes[0].byFaction, {}, 'a bartender drinking the bar clean is not a served client')
})

/** A ledger whose close records the day book alongside what the name cost it. */
function discountingLedger(multiply: number) {
	const ledger = createTakingsLedger({
		ticksPerSecond: TICKS_PER_SECOND,
		isVisitor: roleId => roleId === GUEST,
		dailyDiscountCents: dayCents => Math.max(0, Math.floor(dayCents)) - Math.floor(Math.max(0, Math.floor(dayCents)) * multiply),
	})
	return ledger
}

test('a closed day charges the house for its own credit, off the bank and nowhere else', () => {
	const ledger = discountingLedger(0.5)
	const resolve = resolver(BAR_TARGET, { a1: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolve)
	const snapshot = ledger.snapshot()
	// One night at 50% worth: the counter took the tariff at face value, the close kept half of it.
	assert.equal(snapshot.lastDayCents, TAKING_RATES_CENTS.bar, 'the discount was taken out of the day book')
	assert.equal(snapshot.lastDayDiscountCents, TAKING_RATES_CENTS.bar / 2)
	assert.equal(snapshot.bankCents, TAKING_RATES_CENTS.bar / 2, 'the bank did not feel the discount')
	// The rate window is the crowd's own work: it is emptied by the 300 s the close crossed, and the
	// discount must not be what put anything in it. `byFaction`/`byTag` still say the service happened.
	assert.equal(snapshot.perDayCents, 0, 'a discount rewrote a window the night had already aged out')
	assert.equal(snapshot.perMinuteCents, 0)
	assert.equal(snapshot.served, 1, 'a discount is not a lost sale')
	assert.deepEqual(snapshot.byTag, [{ tag: 'bar', cents: TAKING_RATES_CENTS.bar, count: 1 }], 'the counter booked the discounted tariff')
})

test('a credit cost never overdraws, never mints on a reset, and costs nothing while the credit is good', () => {
	const poor = discountingLedger(0.5)
	poor.ingest([endAt('a1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolver(BAR_TARGET, { a1: GUEST }))
	// Spend the balance away, then close a night that earned nothing: there is nothing to skim, and
	// the day must not be pushed into debt the game does not carry.
	poor.withdraw(poor.snapshot().bankCents)
	poor.ingest([], DAY_TICKS * 2, resolver(BAR_TARGET, { a1: GUEST }))
	let snapshot = poor.snapshot()
	assert.equal(snapshot.bankCents, 0, 'a night with nothing to take still moved the bank')
	assert.equal(snapshot.lastDayDiscountCents, 0)
	// A credit cost never overdraws: the wage bill can empty the bank before the name is charged, and a
	// night that earned something must not push the balance under for a sum the house no longer holds.
	const ruined = createTakingsLedger({
		ticksPerSecond: TICKS_PER_SECOND,
		isVisitor: roleId => roleId === GUEST,
		dailyChargeCents: () => 10_000,
		dailyDiscountCents: dayCents => dayCents,
	})
	ruined.ingest([endAt('a1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolver(BAR_TARGET, { a1: GUEST }))
	snapshot = ruined.snapshot()
	assert.equal(snapshot.bankCents, 0, 'a night with nothing left to take still moved the bank')
	assert.equal(snapshot.lastDayDiscountCents, 0, 'the credit was charged against money that was not there')
	assert.equal(snapshot.lastDayUnpaidCents, 10_000 - TAKING_RATES_CENTS.bar)

	// Carried is what a re-deploy restores the bank from. The skim has to leave both of them alone in
	// the same direction: a discount that only moved the bank would be paid back by the next deploy.
	const rich = discountingLedger(0.5)
	rich.deposit(10_000)
	rich.ingest([endAt('a1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolver(BAR_TARGET, { a1: GUEST }))
	const before = rich.snapshot()
	assert.equal(before.bankCents, 10_000 + TAKING_RATES_CENTS.bar / 2)
	assert.equal(before.carriedCents, before.bankCents, 'a served client was not counted as money that arrived')
	rich.reset()
	assert.equal(rich.snapshot().bankCents, before.bankCents, 'a re-deploy minted back what the credit cost')
	// A house at full worth pays nothing, and a zero night has nothing to pay from.
	const clean = discountingLedger(1)
	clean.ingest([endAt('a1', 'object:bar-1', 'spot-1')], DAY_TICKS, resolver(BAR_TARGET, { a1: GUEST }))
	assert.equal(clean.snapshot().lastDayDiscountCents, 0, 'a welcome house was charged for its name')
	assert.equal(clean.snapshot().bankCents, TAKING_RATES_CENTS.bar)
})

test('re-deploying a crowd does not un-earn the money the crowd made', () => {
	const ledger = ledgerFor()
	const resolve = resolver(BAR_TARGET, { a1: GUEST })
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1', 5)], 6, resolve)
	const earned = ledger.snapshot()
	assert.equal(earned.bankCents, TAKING_RATES_CENTS.bar)
	// Two clicks in the panel - deploy, then clear and deploy again - used to put the bank back to the
	// balance the session arrived with, and the next autosave wrote that smaller number to storage.
	ledger.reset()
	assert.equal(ledger.snapshot().bankCents, earned.bankCents, 'a re-deploy discarded what was already earned')
	assert.equal(ledger.snapshot().served, 0, 'the night is re-measured even when the money is kept')
})

test('the credit price is the same fraction the panel shows, on every closed day', () => {
	const closes: { took: number; cost: number }[] = []
	const ledger = createTakingsLedger({
		ticksPerSecond: TICKS_PER_SECOND,
		isVisitor: roleId => roleId === GUEST,
		// A house worth four fifths of face keeps four fifths of the night, every night.
		dailyDiscountCents: dayCents => dayCents - Math.floor(dayCents * 0.8),
	})
	const resolve = resolver(BAR_TARGET, { a1: GUEST })
	for (let day = 1; day <= 3; day++) {
		ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], day * DAY_TICKS, resolve)
		const snap = ledger.snapshot()
		closes.push({ took: snap.lastDayCents, cost: snap.lastDayDiscountCents })
	}
	assert.equal(closes.length, 3)
	for (const night of closes) {
		assert.equal(night.cost, night.took - Math.floor(night.took * 0.8), 'the keep was not the price the reading said')
		assert.ok(night.cost < night.took, 'the discount took the whole night')
	}
})
