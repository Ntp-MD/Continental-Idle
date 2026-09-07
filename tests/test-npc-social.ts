import assert from 'node:assert/strict'
import { NpcEngine, NPC_ENGINE_DEFAULT_OPTIONS, findNpcGridPath, chatPairKey, resolveChatExchange, type NpcEngineAgent, type NpcEngineFloor } from '../src/engine/npc'
import { createNpcEnginePolicy } from '../src/engine/npc/policy'
import type { FloorData } from '../src/blueprint-editor/domain/types'

assert.equal(chatPairKey('b', 'a'), chatPairKey('a', 'b'), 'pair key is order-independent')
const exchange = resolveChatExchange(chatPairKey('npc-1', 'npc-2'))
assert.equal(exchange.length, 2, 'exchange has opener and reply')
assert.ok(exchange[0].length > 0 && exchange[1].length > 0, 'exchange lines are non-empty')
assert.deepEqual(resolveChatExchange(chatPairKey('npc-1', 'npc-2')), exchange, 'same pair always resolves the same exchange')
assert.ok(!exchange[0].startsWith(' ') && !exchange[1].endsWith(' '), 'exchange lines are trimmed')

console.log('NPC social lines checks passed')

function makeFloor(): NpcEngineFloor {
	return {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: Array.from({ length: 144 }, (_, index) => ({ x: index % 12, y: Math.floor(index / 12) })),
	}
}

function makeSocialEngine(extra: Record<string, unknown> = {}): NpcEngine {
	return new NpcEngine({ floors: [makeFloor()], interactionTargets: [] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		socialRadius: 2,
		socialChatDurationMinSeconds: 2,
		socialChatDurationMaxSeconds: 2,
		...extra,
	})
}

function idle(id: string, x: number, y: number): Parameters<NpcEngine['addAgent']>[0] {
	return { id, floorId: 'F1', x, y, targetX: x, targetY: y, speed: 10 }
}

// Pair formation, facing, timed end, cooldown
{
	const engine = makeSocialEngine()
	engine.addAgent(idle('a', 2, 2))
	engine.addAgent(idle('b', 2, 3))
	engine.addAgent(idle('c', 10, 10))
	for (let i = 0; i < 120 && engine.getAgent('a')?.status !== 'chatting'; i++) engine.tick(1)
	const a = engine.getAgent('a')!
	const b = engine.getAgent('b')!
	assert.equal(a.status, 'chatting', 'nearby idle pair starts chatting')
	assert.equal(b.status, 'chatting', 'partner joins the chat')
	assert.equal(a.chatPartnerId, 'b', 'initiator links partner')
	assert.equal(b.chatPartnerId, 'a', 'partner links back')
	assert.deepEqual([a.targetX, a.targetY], [b.x, b.y], 'initiator faces partner')
	assert.equal(engine.getAgent('c')?.status, 'idle', 'far agent never pairs')
	const starts = engine.drainEvents().filter(e => e.type === 'chatting-start')
	assert.equal(starts.length, 2, 'chat-start emitted for both sides')
	assert.ok(starts.every(e => (e.partnerId === 'a' || e.partnerId === 'b') && e.agentId !== e.partnerId), 'chat-start names the partner')
	for (let i = 0; i < 120 && engine.getAgent('a')?.status === 'chatting'; i++) engine.tick(1)
	assert.equal(engine.getAgent('a')?.status, 'idle', 'chat ends after duration')
	assert.equal(engine.getAgent('b')?.status, 'idle', 'partner released after duration')
	assert.equal(engine.getAgent('a')?.chatPartnerId, null, 'initiator link cleared')
	const ends = engine.drainEvents().filter(e => e.type === 'chatting-end')
	assert.equal(ends.length, 2, 'chat-end emitted for both sides')
	engine.tick(120)
	assert.equal(engine.getAgent('a')?.status, 'idle', 'cooldown prevents instant re-chat')
	assert.equal(engine.getAgent('b')?.status, 'idle', 'partner cooldown prevents instant re-chat')
}

console.log('NPC social pairing checks passed')

// Mutual exclusion: a third agent cannot join an active pair
{
	const engine = makeSocialEngine()
	engine.addAgent(idle('a', 5, 5))
	engine.addAgent(idle('b', 5, 6))
	for (let i = 0; i < 120 && engine.getAgent('a')?.status !== 'chatting'; i++) engine.tick(1)
	assert.equal(engine.getAgent('a')?.status, 'chatting', 'pair forms first')
	engine.addAgent(idle('d', 5, 7))
	engine.tick(60)
	assert.notEqual(engine.getAgent('d')?.status, 'chatting', 'third agent cannot join the pair')
	const dStarts = engine.drainEvents().filter(e => e.type === 'chatting-start' && (e.agentId === 'd' || e.partnerId === 'd'))
	assert.equal(dStarts.length, 0, 'no chat events involve the outsider')
}

console.log('NPC social exclusion checks passed')

// Removal dissolves the chat on the surviving side
{
	const engine = makeSocialEngine()
	engine.addAgent(idle('a', 3, 3))
	engine.addAgent(idle('b', 3, 4))
	for (let i = 0; i < 120 && engine.getAgent('a')?.status !== 'chatting'; i++) engine.tick(1)
	assert.equal(engine.getAgent('a')?.status, 'chatting', 'pair chatting before removal')
	engine.drainEvents()
	engine.removeAgent('a')
	assert.equal(engine.getAgent('a'), undefined, 'removed agent gone')
	assert.equal(engine.getAgent('b')?.status, 'idle', 'survivor released to idle')
	assert.equal(engine.getAgent('b')?.chatPartnerId, null, 'survivor link cleared')
	const ends = engine.drainEvents().filter(e => e.type === 'chatting-end')
	assert.equal(ends.length, 1, 'survivor gets exactly one chat-end')
	assert.equal(ends[0].partnerId, 'a', 'chat-end names the removed partner')
}

console.log('NPC social removal checks passed')

// Business before pleasure: reserved walkers neither initiate nor accept
{
	const target = {
		floorId: 'F1', itemId: 'object:desk', interactSpotId: 'object:desk:0',
		x: 9, y: 9, tags: [] as string[], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}
	const engine = new NpcEngine({ floors: [makeFloor()], interactionTargets: [target] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (floor, from, to, blocked) => findNpcGridPath(floor, from, to, blocked),
		targetSelector: (_agent, targets) => targets[0] ?? null,
		wanderSelector: () => null,
		socialRadius: 2,
		socialChatDurationMinSeconds: 2,
		socialChatDurationMaxSeconds: 2,
	})
	engine.addAgent(idle('sitter', 5, 5))
	engine.addAgent({ ...idle('walker', 2, 4), speed: 30 })
	let chatted = false
	let interacted = false
	for (let i = 0; i < 600 && !(chatted || interacted); i++) {
		engine.tick(1)
		for (const e of engine.drainEvents()) {
			if (e.type === 'chatting-start') chatted = true
			if (e.type === 'interaction-start' && e.agentId === 'walker') interacted = true
		}
	}
	assert.equal(chatted, false, 'reserved walker never chats mid-errand')
	assert.ok(interacted, 'walker still completes its business')
}

console.log('NPC social business-first checks passed')

// Wanderers meet on the road: unreserved walkers may stop and chat
{
	const roadEngine = new NpcEngine({ floors: [makeFloor()], interactionTargets: [] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		targetSelector: () => null,
		wanderSelector: (agent) => agent.id === 'a' ? { x: 11, y: 5 } : null,
		socialRadius: 2,
		socialChatDurationMinSeconds: 2,
		socialChatDurationMaxSeconds: 2,
	})
	roadEngine.addAgent({ ...idle('a', 1, 5), speed: 10 })
	roadEngine.addAgent(idle('b', 5, 5))
	for (let i = 0; i < 21; i++) roadEngine.tick(1)
	roadEngine.drainEvents()
	assert.equal(roadEngine.getAgent('a')?.status, 'walking', 'walker en route before meeting')
	assert.notEqual(roadEngine.getAgent('b')?.status, 'chatting', 'no chat before the meeting window')
	for (let i = 0; i < 70 && roadEngine.getAgent('a')?.status !== 'chatting'; i++) roadEngine.tick(1)
	assert.equal(roadEngine.getAgent('a')?.status, 'chatting', 'walker stops to chat')
	assert.equal(roadEngine.getAgent('b')?.status, 'chatting', 'bystander joins the chat')
	assert.equal(roadEngine.getAgent('a')?.chatPartnerId, 'b', 'road pair linked')
}

console.log('NPC social road-meeting checks passed')

// Social stays off unless opted in
{
	const engine = new NpcEngine({ floors: [makeFloor()], interactionTargets: [] }, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: 60,
		random: () => 0,
		pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
	})
	engine.addAgent(idle('a', 4, 4))
	engine.addAgent(idle('b', 4, 5))
	engine.tick(200)
	assert.equal(engine.getAgent('a')?.status, 'idle', 'default engine never chats')
	assert.equal(engine.drainEvents().some(e => e.type === 'chatting-start'), false, 'no chat events by default')
}

console.log('NPC social opt-in checks passed')

// Policy taste: loners never chat, chatty picks nearest, others sometimes pass
{
	const tiles = new Set<string>()
	for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) tiles.add(`${x},${y}`)
	const floorMap = { tiles, width: 12, height: 12, cellSize: 1 }
	const floorDataF1: FloorData = { id: 'F1', name: 'F1', label: 'F1', objects: [] }
	const engineFloorF1: NpcEngineFloor = {
		id: 'F1', width: 12, height: 12, tileSize: 1,
		walkable: [...tiles].map(cell => {
			const [x, y] = cell.split(',').map(Number)
			return { x, y }
		}),
	}
	const lonerRole = { id: 'loner', label: 'Loner', color: '#fff', focusTags: ['soc-loner'], restrictedTags: [], taskIds: [], focusChance: 100 }
	const chattyRole = { id: 'chatty', label: 'Chatty', color: '#fff', focusTags: ['soc-chatty'], restrictedTags: [], taskIds: [], focusChance: 100 }
	const plainRole = { id: 'plain', label: 'Plain', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 100 }
	const cfgBase = {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		speed: 1, defaultRoleId: 'plain', roles: [lonerRole, chattyRole, plainRole], tasks: [], pool: [],
		frameSimBudgetMs: 6, maxSimulationSteps: 8,
	}
	const mkAgent = (id: string, roleId: string, x: number, y: number): NpcEngineAgent => ({
		id, roleId, floorId: 'F1', x, y, targetX: x, targetY: y, speed: 1, status: 'idle',
		path: [], pathIndex: 0, reservationItemId: null, reservationInteractSpotId: null,
		interactionRemainingTicks: 0, chatPartnerId: null, queueKey: null, queuePendingKey: null,
		queueSlotIndex: null, queueArrivalSequence: null, crossFloorCooldownUntil: 0,
	})
	const policyFor = (random: () => number) => createNpcEnginePolicy({
		getConfig: () => cfgBase,
		floors: [engineFloorF1],
		floorMaps: new Map([['F1', floorMap]]),
		floorDataMap: new Map([['F1', floorDataF1]]),
		ticksPerSecond: 60,
		getTickNumber: () => 0,
		listAgents: () => [],
		random,
	})
	const permissive = policyFor(() => 0)
	const picky = policyFor(() => 0.99)
	const loner = mkAgent('l', 'loner', 5, 5)
	const chatty = mkAgent('c', 'chatty', 5, 5)
	const plain = mkAgent('p', 'plain', 5, 5)
	const near = mkAgent('n', 'plain', 5, 6)
	assert.equal(permissive.socialSelector(loner, [near]), null, 'loner never initiates')
	assert.equal(permissive.socialSelector(plain, [loner]), null, 'nobody is paired with a loner')
	assert.equal(permissive.socialSelector(chatty, [near])?.id, 'n', 'chatty picks the nearest')
	assert.equal(permissive.socialSelector(plain, [near])?.id, 'n', 'plain accepts at low roll')
	assert.equal(picky.socialSelector(plain, [near]), null, 'plain passes at high roll')
}

console.log('NPC social taste checks passed')
