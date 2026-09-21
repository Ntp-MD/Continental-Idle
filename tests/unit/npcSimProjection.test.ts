import { describe, it, expect } from 'vitest'
import {
	blankSimDot,
	updateSimDot,
	pruneStaleDots,
	pruneWaitReasons,
	filterDotsForFloor,
} from '@/blueprint-editor/composables/npcSimProjection'
import type { NpcEngineAgent } from '@/engine/npc'
import type { NpcSimDot } from '@/blueprint-editor/domain/types'

function agent(over: Partial<NpcEngineAgent> = {}): NpcEngineAgent {
	return {
		id: 'a1',
		roleId: 'role-guest',
		floorId: 'G',
		x: 10,
		y: 20,
		targetX: 30,
		targetY: 40,
		speed: 1,
		status: 'walking',
		path: [{ x: 10, y: 20 }, { x: 11, y: 20 }],
		pathIndex: 0,
		reservationItemId: null,
		reservationInteractSpotId: null,
		interactionRemainingTicks: 0,
		chatPartnerId: null,
		crossFloorCooldownUntil: 0,
		...over,
	}
}

const color = (roleId: string) => (roleId === 'role-guest' ? '#guest' : '#other')

describe('blankSimDot', () => {
	it('seeds identity fields and neutral defaults', () => {
		const dot = blankSimDot(agent())
		expect(dot).toMatchObject({ id: 'a1', floorId: 'G', type: 'role-guest', status: 'idle', path: [] })
	})
})

describe('updateSimDot', () => {
	it('creates the dot on first sight and converts cells to pixels', () => {
		const dot = updateSimDot(undefined, agent(), 20, color)
		expect(dot.x).toBe(210)
		expect(dot.y).toBe(410)
		expect(dot.targetX).toBe(610)
		expect(dot.color).toBe('#guest')
		expect(dot.path).toEqual([[210, 410], [230, 410]])
		expect(dot.pathIdx).toBe(0)
	})

	it('reuses the existing dot and refreshes mutable fields', () => {
		const first = updateSimDot(undefined, agent(), 20, color)
		const second = updateSimDot(first, agent({ status: 'idle', pathIndex: 1 }), 20, color)
		expect(second).toBe(first)
		expect(second.status).toBe('idle')
		expect(second.pathIdx).toBe(1)
	})

	it('rebuilds the pixel path when the engine path changes length', () => {
		const first = updateSimDot(undefined, agent(), 20, color)
		const grown = updateSimDot(first, agent({ path: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }], pathIndex: 0 }), 20, color)
		expect(grown.path).toHaveLength(3)
	})

	it('rebuilds the pixel path on rewind and keeps it on advance', () => {
		const base = agent({ path: [{ x: 1, y: 1 }, { x: 2, y: 2 }], pathIndex: 1 })
		const first = updateSimDot(undefined, base, 20, color)
		const initial = first.path
		const advanced = updateSimDot(first, { ...base, pathIndex: 1 }, 20, color)
		expect(advanced.path).toBe(initial)
		const rewound = updateSimDot(first, { ...base, pathIndex: 0 }, 20, color)
		expect(rewound.path).not.toBe(initial)
	})

	it('sets and clears reservation keys', () => {
		const reserved = updateSimDot(
			undefined,
			agent({ reservationItemId: 'item-1', reservationInteractSpotId: '0' }),
			20,
			color,
		)
		expect(reserved.interactTargetKey).toBe('G:item-1')
		expect(reserved.interactSpotKey).toBe('G:item-1:0')
		const cleared = updateSimDot(reserved, agent(), 20, color)
		expect(cleared.interactTargetKey).toBeNull()
		expect(cleared.interactSpotKey).toBeNull()
	})

	it('defaults skin fields to draw-time fallbacks when no look resolver is given', () => {
		const dot = updateSimDot(undefined, agent(), 20, color)
		expect(dot.skinTone).toBe('')
		expect(dot.trousers).toBe('')
		expect(dot.hat).toBe('none')
		expect(dot.hatColor).toBe('')
	})

	it('resolves look per update and drops unset fields back to defaults', () => {
		const look = (roleId: string) =>
			roleId === 'role-guest' ? { skinTone: '#c08a5c', trousers: '#101010', hat: 'cap' as const, hatColor: '#ffffff' } : {}
		const dressed = updateSimDot(undefined, agent(), 20, color, look)
		expect(dressed.skinTone).toBe('#c08a5c')
		expect(dressed.trousers).toBe('#101010')
		expect(dressed.hat).toBe('cap')
		expect(dressed.hatColor).toBe('#ffffff')
		const plain = updateSimDot(dressed, agent({ roleId: 'role-plain' }), 20, color, look)
		expect(plain.skinTone).toBe('')
		expect(plain.trousers).toBe('')
		expect(plain.hat).toBe('none')
		expect(plain.hatColor).toBe('')
	})
})

describe('pruneStaleDots', () => {
	it('drops dots for agents no longer seen and keeps the rest', () => {
		const dots = new Map<string, NpcSimDot>([
			['a', { ...blankSimDot(agent({ id: 'a' })) }],
			['b', { ...blankSimDot(agent({ id: 'b' })) }],
		])
		pruneStaleDots(dots, new Set(['a']))
		expect([...dots.keys()]).toEqual(['a'])
	})

	it('skips work when nothing can be stale', () => {
		const dots = new Map<string, NpcSimDot>([['a', { ...blankSimDot(agent({ id: 'a' })) }]])
		pruneStaleDots(dots, new Set(['a', 'b']))
		expect(dots.size).toBe(1)
	})
})

describe('pruneWaitReasons', () => {
	it('keeps waiting/queued dots and drops the rest', () => {
		const waiting = { ...blankSimDot(agent({ id: 'w' })), status: 'waiting' } as NpcSimDot
		const idle = { ...blankSimDot(agent({ id: 'i' })), status: 'idle' } as NpcSimDot
		const dots = new Map([['w', waiting], ['i', idle]])
		const reasons = new Map([['w', 'no-path'], ['i', 'no-path'], ['gone', 'no-path']])
		pruneWaitReasons(reasons, dots)
		expect([...reasons.keys()]).toEqual(['w'])
	})
})

describe('filterDotsForFloor', () => {
	it('returns only dots on the requested floor', () => {
		const dots = [
			{ ...blankSimDot(agent({ id: 'a' })), floorId: 'G' },
			{ ...blankSimDot(agent({ id: 'b' })), floorId: 'F1' },
		]
		expect(filterDotsForFloor(dots, 'G').map(d => d.id)).toEqual(['a'])
		expect(filterDotsForFloor(dots, null)).toEqual([])
	})
})
