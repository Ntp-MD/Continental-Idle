import { test } from 'vitest'
import assert from 'node:assert/strict'
import type { NpcEngineEvent } from '../../src/engine/npc'
import {
	createTakingsLedger,
	formatTakings,
	rateForTags,
	TAKING_RATES_CENTS,
	visitorRoleIds,
} from '../../src/blueprint-editor/domain/economy/takings'

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
function resolver(tagsByTarget: Record<string, readonly string[]>, roleByAgent: Record<string, string>) {
	return (event: NpcEngineEvent) => {
		const roleId = roleByAgent[event.agentId]
		if (roleId === undefined) return undefined
		const key = event.itemId && event.interactSpotId ? `${event.floorId}:${event.itemId}:${event.interactSpotId}` : ''
		return { roleId, tags: tagsByTarget[key] ?? [] }
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
		[endAt('a1', 'object:desk-1', 'spot-1')],
		5,
		resolver({ 'f1:object:desk-1:spot-1': ['front-desk', 'post:reception-station'] }, { a1: GUEST }),
	)
	assert.equal(ledger.snapshot().bankCents, 0)
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

test('reset clears the bank, the rate and the sources', () => {
	const ledger = ledgerFor()
	ledger.ingest([endAt('a1', 'object:bar-1', 'spot-1')], 5, resolver({ 'f1:object:bar-1:spot-1': ['bar'] }, { a1: GUEST }))
	ledger.reset()
	const snapshot = ledger.snapshot()
	assert.equal(snapshot.bankCents, 0)
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
