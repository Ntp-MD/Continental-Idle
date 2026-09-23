import { test } from 'vitest'
import assert from 'node:assert/strict'
import { ARRIVAL_MARK_LIVE_CAP, ARRIVAL_MARK_MAX_AGE_TICKS, latchArrivalEvent, pruneArrivalMarks } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import type { NpcEngineEvent } from '../../src/engine/npc/types'

const PREFIX = 'npc-sim-'

function makeEvent(overrides: Partial<NpcEngineEvent> & { agentId: string }): NpcEngineEvent {
	return {
		type: 'interaction-start',
		floorId: 'F1',
		tick: 0,
		...overrides,
	}
}

function freshState(): { arrived: Set<string>; marks: Map<string, number> } {
	return { arrived: new Set<string>(), marks: new Map<string, number>() }
}

test('arrival latch marks first interaction-start with the event tick', () => {
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}1`, tick: 42 }), PREFIX)
	assert.equal(arrived.has(`${PREFIX}1`), true)
	assert.equal(marks.get(`${PREFIX}1`), 42)
})

test('arrival latch never re-marks a duplicate interaction-start', () => {
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}2`, tick: 10 }), PREFIX)
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}2`, tick: 99 }), PREFIX)
	assert.equal(marks.get(`${PREFIX}2`), 10)
	assert.equal(arrived.size, 1)
})

test('arrival latch skips pre-deploy ids (other prefix)', () => {
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: 'npc-old-7', tick: 5 }), PREFIX)
	assert.equal(arrived.size, 0)
	assert.equal(marks.size, 0)
})

test('arrival latch ignores non-arrival event types incl. floor-transition', () => {
	const { arrived, marks } = freshState()
	const others: NpcEngineEvent['type'][] = [
		'waiting', 'interaction-end', 'chatting-start', 'chatting-end',
		'blocked', 'repath', 'repath-failed', 'floor-transition',
	]
	for (const type of others) {
		latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}3`, type, tick: 7 }), PREFIX)
	}
	assert.equal(arrived.size, 0)
	assert.equal(marks.size, 0)
})

test('arrival latch tracks agents independently', () => {
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}4`, tick: 3 }), PREFIX)
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}5`, tick: 8 }), PREFIX)
	assert.equal(marks.get(`${PREFIX}4`), 3)
	assert.equal(marks.get(`${PREFIX}5`), 8)
	assert.equal(arrived.size, 2)
})

test('pruneArrivalMarks drops expired marks, keeps fresh ones', () => {
	const marks = new Map<string, number>([['a', 0], ['b', 10]])
	pruneArrivalMarks(marks, ARRIVAL_MARK_MAX_AGE_TICKS + 5)
	assert.equal(marks.has('a'), false)
	assert.equal(marks.has('b'), true)
})

test('pruneArrivalMarks keeps a mark exactly at max age', () => {
	const marks = new Map<string, number>([['a', 0]])
	pruneArrivalMarks(marks, ARRIVAL_MARK_MAX_AGE_TICKS)
	assert.equal(marks.has('a'), true)
})

test('pruneArrivalMarks drops oldest marks beyond the live cap', () => {
	const marks = new Map<string, number>()
	for (let i = 0; i < ARRIVAL_MARK_LIVE_CAP + 5; i++) marks.set(`id-${i}`, i)
	pruneArrivalMarks(marks, ARRIVAL_MARK_LIVE_CAP + 5)
	assert.equal(marks.size, ARRIVAL_MARK_LIVE_CAP)
	assert.equal(marks.has('id-0'), false)
	assert.equal(marks.has('id-4'), false)
	assert.equal(marks.has('id-5'), true)
})
