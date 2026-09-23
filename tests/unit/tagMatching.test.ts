import { test } from 'vitest'
import assert from 'node:assert/strict'
import { hasMatchingTag, getObjectTags, floorMatchesTargetTags, getRoleFocusTags, hasPostTag } from '../../src/engine/npc/tagMatching'
import {
	NPC_OPTION_DEFAULTS,
	NPC_FRAME_DEFAULTS,
	type FloorData,
	type NpcRole,
	type NpcSimulationConfig,
	type ObjectData,
} from '../../src/blueprint-editor/domain/types'

function obj(id: string, type: string): ObjectData {
	return { id, type, x: 0, y: 0, w: 1, h: 1, rotation: 0 }
}
function floor(objects: ObjectData[]): FloorData {
	return { id: 'f1', name: 'F', label: 'F1', objects }
}

test('hasMatchingTag', () => {
	assert.equal(hasMatchingTag(['Lobby', 'Bar'], ['bar']), true, 'case-insensitive match')
	assert.equal(hasMatchingTag([' lobby '], ['lobby']), true, 'trimmed match')
	assert.equal(hasMatchingTag(undefined, ['x']), false, 'undefined tags never match')
	assert.equal(hasMatchingTag(['x'], []), false, 'empty target never matches')
})

test('getObjectTags', () => {
	assert.deepEqual(getObjectTags(obj('o1', 'a'), () => ['t']), ['t'], 'object tags via callback')
	assert.deepEqual(getObjectTags(obj('o1', 'a')), [], 'no callback -> empty')
})

test('floorMatchesTargetTags', () => {
	assert.equal(floorMatchesTargetTags(floor([obj('o1', 'a')]), [], () => ['x']), true, 'no target tags -> match all')
	assert.equal(floorMatchesTargetTags(floor([obj('o1', 'a')]), ['x'], () => ['x']), true, 'floor object tag matches')
	assert.equal(floorMatchesTargetTags(floor([obj('o1', 'a')]), ['x'], () => ['y']), false, 'no floor object matches')
})

test('getRoleFocusTags', () => {
	const role: NpcRole = {
		id: 'r1', label: 'R', color: '#fff', focusTags: ['a', 'b'], restrictedTags: [], taskIds: ['t1'], focusChance: 50,
	}
	const config: NpcSimulationConfig = {
		speed: 0.2,
		defaultRoleId: 'r1',
		roles: [role],
		tasks: [{ id: 't1', label: 'T', tags: ['b', 'c'] }],
		pool: [],
		...NPC_OPTION_DEFAULTS,
		...NPC_FRAME_DEFAULTS,
	}
	assert.deepEqual([...getRoleFocusTags(config, role)].sort(), ['a', 'b', 'c'], 'focus tags union task tags, deduped')
	assert.deepEqual([...getRoleFocusTags(config, role, ['a', 'c'])].sort(), ['a', 'c'], 'managed tags filter')
})

test('hasPostTag', () => {
	assert.equal(hasPostTag(['post:desk']), true, 'post tag detected')
	assert.equal(hasPostTag(['x']), false, 'no post tag')
	assert.equal(hasPostTag(undefined), false, 'undefined tags')
})
