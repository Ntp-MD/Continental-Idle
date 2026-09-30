import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	NEED_ACT_AT,
	NEED_RISE_SECONDS,
	NPC_NEED_KEYS,
	createNeeds,
	dominantNeed,
	isVisitorRole,
	needTags,
	needUrgency,
	serveNeeds,
	urgesByUrgency,
	type NpcNeeds,
} from '../../src/engine/npc/needs'
import { visitorRoleIds } from '../../src/blueprint-editor/domain/economy/takings'
import { createNpcEnginePolicy } from '../../src/engine/npc/policy'
import { NPC_ENGINE_DEFAULT_OPTIONS, NpcEngine } from '../../src/engine/npc'
import { hotelModel } from './hotelFixture'
import type { AssetDef, FloorData, NpcRole, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'
import type { NpcEngineAgent } from '../../src/engine/npc'

const TILE = 25
const TPS = 10

function fixture(id: string, tags: string[]): AssetDef {
	return {
		id, name: id, w: 2, h: 1, tags,
		// The guest side of the counter, and the staff side it is posted at.
		interactSpots: [{ x: 12.5, y: 37.5 }, { x: 12.5, y: -12.5, post: 'bar-back' }],
		interact: { capacity: 1, durationMin: 1, durationMax: 1 },
	}
}

function satedAt(tick: number): NpcNeeds {
	return { thirst: tick, appetite: tick, rest: tick, cleanliness: tick }
}

test('an urge rises on its own clock and is clamped to the band', () => {
	const needs = satedAt(0)
	assert.equal(needUrgency(needs, 'thirst', 0, TPS), 0, 'just served is zero')
	const half = NEED_RISE_SECONDS.thirst * TPS / 2
	assert.equal(needUrgency(needs, 'thirst', half, TPS), 0.5, 'half the clock is half the urge')
	assert.equal(needUrgency(needs, 'thirst', NEED_RISE_SECONDS.thirst * TPS, TPS), 1, 'a full clock is fully upon them')
	assert.equal(needUrgency(needs, 'thirst', NEED_RISE_SECONDS.thirst * TPS * 9, TPS), 1, 'and it never passes one')
	assert.ok(
		needUrgency(needs, 'thirst', 500, TPS) < needUrgency(needs, 'thirst', 600, TPS),
		'time waiting is never refreshing',
	)
	// The clocks differ on purpose: nobody needs a bed as often as they need a drink.
	assert.ok(NEED_RISE_SECONDS.thirst < NEED_RISE_SECONDS.rest, 'thirst comes round faster than rest')
})

test('a crowd spawned together does not get thirsty together', () => {
	const flat = createNeeds(1000, TPS, () => 0)
	assert.deepEqual(flat, satedAt(1000), 'a random of zero back-dates nothing')
	const spread = NPC_NEED_KEYS.map(key => 1000 - createNeeds(1000, TPS, () => 0.99)[key])
	for (const [index, key] of NPC_NEED_KEYS.entries()) {
		const ticks = spread[index]
		assert.ok(ticks >= 0 && ticks <= NEED_RISE_SECONDS[key] * TPS, `${key} starts somewhere inside its own clock`)
	}
	assert.notDeepEqual(createNeeds(0, TPS, () => 0.2), createNeeds(0, TPS, () => 0.8), 'two heads do not start at the same place')
	// Nobody walks in fresh: a fifth of the way through the roll is a fifth of the way into the clock.
	assert.equal(createNeeds(1000, TPS, () => 0.2).thirst, 1000 - Math.floor(NEED_RISE_SECONDS.thirst * TPS * 0.2), 'the urge a guest arrives carrying is proportional to the roll')
})

test('an agent only acts on an urge past the threshold, and only on one it can serve', () => {
	const needs = satedAt(0)
	const all = NEED_RISE_SECONDS.thirst * TPS
	assert.equal(dominantNeed(needs, 0, TPS, null), null, 'a settled agent wants nothing')
	assert.equal(dominantNeed(needs, Math.floor(all * NEED_ACT_AT) - 1, TPS, null), null, 'below the threshold it is not yet a reason')
	assert.equal(dominantNeed(needs, all, TPS, null), 'thirst', 'past the threshold the worst urge wins')

	// Rest rises slower, so early on it is thirst that steers; once the drink is had, the bed is the
	// worst thing left. The order of the keys decides a tie, so the two are never exactly level here.
	const tired = { ...satedAt(0) }
	assert.equal(dominantNeed(tired, NEED_RISE_SECONDS.thirst * TPS, TPS, null), 'thirst', 'the more urgent need is chosen')
	const drunk = { ...tired, thirst: NEED_RISE_SECONDS.rest * TPS, appetite: NEED_RISE_SECONDS.rest * TPS, cleanliness: NEED_RISE_SECONDS.rest * TPS }
	assert.equal(dominantNeed(drunk, NEED_RISE_SECONDS.rest * TPS, TPS, null), 'rest', 'with the drink had, rest takes the wheel')

	// Rest is the slowest clock, so this is the moment every urge is upon them.
	const maxed = NEED_RISE_SECONDS.rest * TPS
	assert.equal(dominantNeed(needs, maxed, TPS, ['chambers']), 'rest', 'a role that cannot drink still needs a bed')
	assert.equal(dominantNeed(needs, maxed, TPS, ['dining']), 'appetite', 'and a dining-only role goes hungry, not thirsty')
	assert.equal(dominantNeed(needs, maxed, TPS, ['nothing-this-way']), null, 'a role that can serve none of them wants nothing')
	assert.ok(needTags(null).length === 0, 'no urge asks for no tags')
	assert.ok(needTags('thirst').includes('bar'), 'thirst is served by the bar')
	assert.ok(needTags('rest').includes('front-desk'), 'and rest starts at the desk that hands out the room')
})

test('a visit settles the need it served and leaves the rest to rise', () => {
	const needs = { ...satedAt(0) }
	const served = serveNeeds(needs, ['hygiene', 'wellness'], 500)
	assert.deepEqual(served, ['cleanliness'], 'a shower washes - it does not pretend to have been a night of sleep')
	assert.equal(needs.cleanliness, 500, 'the washed need is settled at this tick')
	assert.equal(needs.thirst, 0, 'the drink still waits its turn')
	assert.equal(serveNeeds(needs, ['post:bar-back'], 900).length, 0, 'a staff station settles nothing - it is not a guest’s cup of tea')
	assert.equal(needs.thirst, 0, 'and changes no clock')
})

// ── the policy decides on the urge ────────────────────────────────────────────

const GUEST: NpcRole = {
	id: 'role-guest', label: 'Guest', color: '#88ccff',
	focusChance: 100, focusTags: ['bar', 'living', 'chambers', 'lounge', 'hygiene'], restrictedTags: [], taskIds: [],
}
const BARTENDER: NpcRole = {
	id: 'role-bartender', label: 'Bartender', color: '#ffcc88',
	focusChance: 100, focusTags: ['bar'], restrictedTags: [], taskIds: ['task-bar'],
}
const TASKS = [{ id: 'task-bar', label: 'Bar duty', tags: ['bar'], post: { assetId: 'bar-counter', post: 'bar-back' } }]

function config(roles: readonly NpcRole[]): NpcSimulationConfig {
	return { speed: 0.2, defaultRoleId: roles[0].id, roles, tasks: TASKS, pool: [] } as unknown as NpcSimulationConfig
}

/** One building, two floors: the bar below, the beds above, joined by a lift on the same cell. */
function house() {
	const bar = fixture('bar-counter', ['bar'])
	const sofa = fixture('sofa-1', ['lounge'])
	const bed = fixture('double-bed-1', ['living', 'chambers'])
	const basin = fixture('washbasin', ['hygiene'])
	const lift = { ...fixture('elevator-1', ['portal']), w: 2, h: 2, interact: { capacity: 4, durationMin: 1, durationMax: 1 } }
	// The sofa is deliberately the nearest fixture to where the guest stands, so a choice of the bar
	// across the room can only be explained by the urge - and a choice of the sofa once the drink is
	// had can only be explained by the urge having moved on.
	const floors: FloorData[] = [
		{
			id: 'F1', name: 'Bar', label: '1', defaultWalkable: true,
			objects: [
				{ id: 's1', type: 'sofa-1', x: TILE * 2, y: TILE * 2, w: 2, h: 1, rotation: 0 },
				{ id: 'b1', type: 'bar-counter', x: TILE * 8, y: TILE * 5, w: 2, h: 1, rotation: 0 },
				{ id: 'l1', type: 'elevator-1', x: TILE * 5, y: TILE * 6, w: 2, h: 2, rotation: 0 },
			],
		},
		{
			id: 'F2', name: 'Beds', label: '2', defaultWalkable: true,
			objects: [
				{ id: 'd1', type: 'double-bed-1', x: TILE * 4, y: TILE * 3, w: 2, h: 1, rotation: 0 },
				{ id: 's2', type: 'sofa-1', x: TILE * 8, y: TILE * 2, w: 2, h: 1, rotation: 0 },
				{ id: 'l2', type: 'elevator-1', x: TILE * 5, y: TILE * 6, w: 2, h: 2, rotation: 0 },
			],
		},
		{
			// One fixture, and it is the only thing in the building that serves cleanliness. Density
			// alone would never send anyone here, which is the point of the test below.
			id: 'F3', name: 'Bath', label: '3', defaultWalkable: true,
			objects: [
				{ id: 'w1', type: 'washbasin', x: TILE * 4, y: TILE * 3, w: 2, h: 1, rotation: 0 },
				{ id: 'l3', type: 'elevator-1', x: TILE * 5, y: TILE * 6, w: 2, h: 2, rotation: 0 },
			],
		},
	]
	const model = hotelModel({ canvas: { width: TILE * 12, height: TILE * 8, tileSize: TILE }, floors }, [bar, sofa, bed, basin, lift])
	const cfg = config([GUEST, BARTENDER])
	let tickNow = 0
	const policy = createNpcEnginePolicy({
		getConfig: () => cfg,
		floors: model.built.layout.floors,
		floorMaps: model.built.floorMaps,
		floorDataMap: model.built.floorDataMap,
		ticksPerSecond: TPS,
		getTickNumber: () => tickNow,
		listAgents: () => [],
		getAssetTags: (type: string) => model.assetMap.get(type)?.tags,
		random: () => 0.5,
		interactionTargets: model.built.layout.interactionTargets,
	})
	const agent = (over: Partial<NpcEngineAgent>): NpcEngineAgent => ({
		id: 'a', roleId: GUEST.id, floorId: 'F1', x: 2, y: 2, targetX: 2, targetY: 2, speed: 1,
		status: 'idle', path: [], pathIndex: 0, reservationItemId: null, reservationInteractSpotId: null,
		interactionRemainingTicks: 0, chatPartnerId: null, crossFloorCooldownUntil: 0, needs: satedAt(0),
		...over,
	})
	const open = () => model.built.layout.interactionTargets.filter(t => !t.tags.some(tag => tag.startsWith('post:')))
	const engine = () => new NpcEngine(model.built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: TPS,
		random: () => 0.5,
		...policy,
	})
	return { policy, agent, tick: (value: number) => { tickNow = value }, open, model, engine, setTick: (value: number) => { tickNow = value } }
}

function thirstTicks(): number {
	return NEED_RISE_SECONDS.thirst * TPS + 1
}

test('an urge beats the nearer fixture, and moves on once it is served', () => {
	const world = house()
	const targets = world.open().filter(target => target.floorId === 'F1')
	assert.ok(targets.some(target => target.tags.includes('bar')), 'the bar is on the floor')
	assert.ok(targets.some(target => target.tags.includes('lounge')), 'and so is a sofa, closer to where the guest stands')

	world.tick(thirstTicks())
	const thirsty = world.policy.targetSelector(world.agent({ needs: satedAt(0) }), targets)
	assert.ok(thirsty && thirsty.tags.includes('bar'), `thirst sends them across the room to the bar, not to the sofa (${thirsty?.tags.join('+')})`)

	// Same room, later: the drink is had and every other clock is settled, so the only urge left is the
	// one the sofa serves - and it is past its own threshold, so nothing but the need points at it.
	const when = NEED_RISE_SECONDS.rest * TPS + 1
	world.tick(when)
	const had_a_drink = { thirst: when, appetite: when, cleanliness: when, rest: 0 }
	const next = world.policy.targetSelector(world.agent({ needs: had_a_drink }), targets)
	assert.ok(next && next.tags.includes('lounge'), `the settled guest takes the sofa, not another pint (${next?.tags.join('+')})`)

	// And the visit itself is what settles it: serving the bar's tags is what changed the answer.
	const needs = satedAt(0)
	serveNeeds(needs, thirsty.tags, when)
	assert.notEqual(dominantNeed(needs, when, TPS, GUEST.focusTags), 'thirst', 'the visit took the urge off the books')
})

test('when the thing is on another floor, the answer is the lift - and it names the right floor', () => {
	const world = house()
	const onBarsFloor = world.open().filter(target => target.floorId === 'F1')
	// Only the wash is unmet, and the only basin in the building is upstairs.
	const when = NEED_RISE_SECONDS.cleanliness * TPS + 1
	world.tick(when)
	const filthy = { thirst: when, appetite: when, rest: when, cleanliness: 0 }
	const guest = world.agent({ needs: filthy })
	const local = world.policy.targetSelector(guest, onBarsFloor)
	assert.equal(local, null, 'nothing on this floor serves cleanliness, so the local answer is no answer')

	const cross = world.policy.crossFloorSelector(guest, world.open().filter(t => t.floorId !== 'F1'), world.model.built.layout.floors)
	assert.ok(cross, 'the urge reaches for another floor')
	assert.equal(cross.floorId, 'F3', 'the lift goes to the one floor with a basin')
	// ...which is not where the role's focus tags alone would send them: F2 holds more of the things
	// this guest likes (a bed and a sofa) than F3 holds at all.
	const densest = world.model.built.layout.floors.filter(f => f.id !== 'F1').map(f => ({
		id: f.id,
		liked: world.open().filter(t => t.floorId === f.id).length,
	})).sort((a, b) => b.liked - a.liked)[0]
	assert.equal(densest.id, 'F2', 'the denser floor is the beds, not the bath')
	assert.notEqual(cross.floorId, densest.id, 'and the urge overrode it')
})

test('a need never pulls a worker off their post', () => {
	const world = house()
	const targets = world.open().concat(world.model.built.layout.interactionTargets.filter(t => t.tags.some(tag => tag.startsWith('post:'))))
	world.tick(NEED_RISE_SECONDS.rest * TPS + 1)
	const posted = world.policy.targetSelector(world.agent({ roleId: BARTENDER.id, needs: satedAt(0) }), targets)
	assert.ok(posted && posted.tags.some(tag => tag.startsWith('post:')), 'the station wins over the urge')
})

test('the engine’s visitor rule and the ledger’s billing rule are the same rule', () => {
	const roles = [GUEST, BARTENDER, { ...BARTENDER, id: 'role-chef', taskIds: ['task-bar'] }]
	const visitors = visitorRoleIds(roles)
	for (const role of roles) {
		assert.equal(isVisitorRole(role), visitors.has(role.id), `${role.id} is a customer in both layers or a worker in both`)
	}
})

test('a completed visit is what moves the clock - the engine settles the need, not the caller', () => {
	const world = house()
	const engine = world.engine()
	const when = NEED_RISE_SECONDS.thirst * TPS + 1
	world.setTick(when)
	const spawn = world.model.built.layout.floors[0].walkable[0]
	engine.addAgent({
		id: 'guest', roleId: GUEST.id, floorId: 'F1', x: spawn.x, y: spawn.y,
		targetX: spawn.x, targetY: spawn.y, speed: 4,
	})
	// The engine owns the tick clock the policy reads, so drive both together.
	let settled = false
	for (let i = 0; i < 4000 && !settled; i++) {
		world.setTick(i + 1)
		engine.tick(1)
		const events = engine.drainEvents()
		if (events.some(event => event.type === 'interaction-end' && event.itemId === 'object:b1')) settled = true
	}
	assert.ok(settled, 'the guest never reached the bar, so the wiring is untested')
	const guest = engine.getAgent('guest')!
	// The clock is set to the tick the visit ended, so the urge is gone at that moment - which is the
	// whole point: the guest walks away settled rather than hungry for the same pint again.
	const at = engine.tickNumber
	assert.ok(guest.needs.thirst > 0, 'a finished pint must move the thirst clock')
	assert.ok(
		needUrgency(guest.needs, 'thirst', at, TPS) < NEED_ACT_AT,
		`the thirst clock was not set to the visit: ${guest.needs.thirst} at tick ${at}`,
	)
})

test('a guest settles for what the floor has, and only loiters when nothing serves', () => {
	const world = house()
	// Past the threshold for every clock but the one just settled, so the ranking has more than one
	// entry to work through.
	const when = NEED_RISE_SECONDS.rest * TPS + 1
	world.tick(when)
	// Thirst is the loudest and there is no bar upstairs; rest is also upon them and the sofa is right
	// there. Standing in the corridor wanting a drink is not what a person does.
	const sofa = world.agent({ floorId: 'F2', needs: { thirst: 0, appetite: when, cleanliness: when, rest: 0 } })
	const settled = world.policy.targetSelector(sofa, world.open().filter(target => target.floorId === 'F2'))
	// Thirst is the loudest and there is no bar upstairs, so the answer must be the *next* urge served
	// here - a bed or the sofa - not a null while the guest stands in the corridor wanting a drink.
	assert.ok(settled, 'the second urge is taken up rather than nothing being done')
	assert.ok(
		settled.tags.includes('chambers') || settled.tags.includes('lounge'),
		`they settle for a rest-serving fixture, not ${settled.tags.join('+')}`,
	)

	// Nothing on this floor serves either of the two loud urges, so this one waits rather than shopping.
	const picky = world.agent({ floorId: 'F1', needs: { thirst: 0, appetite: when, cleanliness: 0, rest: when } })
	const nothing = world.policy.targetSelector(
		picky,
		world.open().filter(t => t.floorId === 'F1' && !t.tags.includes('bar') && !t.tags.includes('lounge')),
	)
	assert.equal(nothing, null, 'with nothing to settle for, they do not buy something they do not want')

	// And the ranking itself: worst first, ties broken by the declared order, never by a map.
	assert.deepEqual(
		urgesByUrgency({ thirst: 0, appetite: 0, rest: 0, cleanliness: when }, when, TPS, null),
		['thirst', 'appetite', 'rest'],
		'the clocks rank by how bad they are, and the settled one is not on the list',
	)
})

test('a settled guest loiters instead of shopping', () => {
	const world = house()
	const when = NEED_RISE_SECONDS.rest * TPS + 1
	world.tick(when)
	// Every clock was served at this very tick, so no urge is worth acting on yet.
	const calm = world.agent({ needs: satedAt(when) })
	const picked = world.policy.targetSelector(calm, world.open().filter(t => t.floorId === 'F1'))
	assert.equal(picked, null, 'nothing wanted, nothing bought - the guest is left to the wander and the chat')
})

test('a guest is never handed the staff side of a counter, not even as a queue', () => {
	const world = house()
	const when = NEED_RISE_SECONDS.thirst * TPS + 1
	world.tick(when)
	const thirsty = world.agent({ needs: satedAt(0) })
	// A queue that exists only at the bartender's post: the only way to be served there is to stand on
	// the duty side of the counter, which is staff ground. The role's own walkable map already keeps
	// an agent off it; this is the filter in the policy, tested on its own so it cannot hide behind
	// the other one.
	const postOnly = world.model.built.layout.interactionTargets
		.filter(t => t.floorId === 'F1' && t.tags.some(tag => tag.startsWith('post:')))
	assert.ok(postOnly.length > 0, 'the fixture has no staff post to be kept off')
	const queue = {
		key: 'q-post',
		targetKeys: postOnly.map(t => `${t.floorId}:${t.itemId}:${t.interactSpotId}`),
		slots: [{ x: 0, y: 0 }],
		admissionPoints: [{ x: 0, y: 0 }],
		maxMembers: 4,
	}
	assert.equal(world.policy.queueSelector(thirsty, postOnly, [], [queue]), null, 'the duty post is not a queue a guest may join')
	assert.equal(world.policy.targetSelector(thirsty, postOnly), null, 'and not a target either')
})
