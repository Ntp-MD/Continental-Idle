import assert from 'node:assert/strict'
import { ARRIVAL_MARK_LIVE_CAP, ARRIVAL_MARK_MAX_AGE_TICKS, latchArrivalEvent, pruneArrivalMarks } from '../src/composables/useNpcSimulationCore'
import type { NpcEngineEvent } from '../src/engine/npc/types'

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

// First interaction-start for a deploy agent marks arrival with the event tick.
{
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}1`, tick: 42 }), PREFIX)
	assert.equal(arrived.has(`${PREFIX}1`), true)
	assert.equal(marks.get(`${PREFIX}1`), 42)
	console.log('arrival latch marks first interaction-start passed')
}

// Duplicate interaction-start never re-marks (mark-once per agent per deploy).
{
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}2`, tick: 10 }), PREFIX)
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}2`, tick: 99 }), PREFIX)
	assert.equal(marks.get(`${PREFIX}2`), 10)
	assert.equal(arrived.size, 1)
	console.log('arrival latch mark-once passed')
}

// Pre-deploy ids (other prefix) are skipped: no false history.
{
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: 'npc-old-7', tick: 5 }), PREFIX)
	assert.equal(arrived.size, 0)
	assert.equal(marks.size, 0)
	console.log('arrival latch pre-deploy skip passed')
}

// Non-arrival event types never mark, including floor-transition (no double count).
{
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
	console.log('arrival latch non-arrival skip passed')
}

// Agents are tracked independently.
{
	const { arrived, marks } = freshState()
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}4`, tick: 3 }), PREFIX)
	latchArrivalEvent(arrived, marks, makeEvent({ agentId: `${PREFIX}5`, tick: 8 }), PREFIX)
	assert.equal(marks.get(`${PREFIX}4`), 3)
	assert.equal(marks.get(`${PREFIX}5`), 8)
	assert.equal(arrived.size, 2)
	console.log('arrival latch independent agents passed')
}

// Expired marks are dropped, fresh ones kept.
{
	const marks = new Map<string, number>([['a', 0], ['b', 10]])
	pruneArrivalMarks(marks, ARRIVAL_MARK_MAX_AGE_TICKS + 5)
	assert.equal(marks.has('a'), false)
	assert.equal(marks.has('b'), true)
	console.log('arrival mark expiry passed')
}

// A mark exactly at max age is still live (strictly older than max age expires).
{
	const marks = new Map<string, number>([['a', 0]])
	pruneArrivalMarks(marks, ARRIVAL_MARK_MAX_AGE_TICKS)
	assert.equal(marks.has('a'), true)
	console.log('arrival mark age boundary passed')
}

// Cap: oldest marks are dropped first beyond the live cap.
{
	const marks = new Map<string, number>()
	for (let i = 0; i < ARRIVAL_MARK_LIVE_CAP + 5; i++) marks.set(`id-${i}`, i)
	pruneArrivalMarks(marks, ARRIVAL_MARK_LIVE_CAP + 5)
	assert.equal(marks.size, ARRIVAL_MARK_LIVE_CAP)
	assert.equal(marks.has('id-0'), false)
	assert.equal(marks.has('id-4'), false)
	assert.equal(marks.has('id-5'), true)
	console.log('arrival mark cap passed')
}

console.log('arrival latch checks passed')
