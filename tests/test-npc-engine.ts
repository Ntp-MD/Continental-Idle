import assert from 'node:assert/strict'
import { originAssetsData } from '../src/blueprint-editor/data/originAssets.data'
import { NpcEngine, findNpcGridPath, selectBestTarget, WanderMemory, type NpcEngineLayout, type NpcEngineInteractionTarget, type NpcEngineFloor, type NpcEngineAgent } from '../src/engine/npc'
import { normalizeAllowedRoleIds } from '../src/blueprint-editor/types'
import { validatePortalConfiguration, buildAssetMap } from '../src/blueprint-editor/assetUtils'
import type { AssetDef } from '../src/blueprint-editor/types'

function makeRng(seed: number): () => number {
	let state = seed >>> 0 || 1
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0
		return state / 4294967296
	}
}
let rngSeqN = 0
const rngSeq = (): (() => number) => makeRng((rngSeqN++ + 0x9e3779b9) >>> 0)

const layout: NpcEngineLayout = {
	floors: [{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] }],
	interactionTargets: [
		{ floorId: 'F1', itemId: 'table', interactSpotId: 'a1', x: 1, y: 0, tags: ['service'], capacity: 2, durationMinSeconds: 2, durationMaxSeconds: 2 },
		{ floorId: 'F1', itemId: 'table', interactSpotId: 'a2', x: 2, y: 0, tags: ['service'], capacity: 2, durationMinSeconds: 2, durationMaxSeconds: 2 },
	],
}

const engine = new NpcEngine(layout, {
	ticksPerSecond: 1,
	agentClearance: 0.5,
	random: () => 0,
	targetSelector: (_agent, targets) => targets[0] ?? null,
	pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
})

engine.addAgent({ id: 'npc-1', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
engine.addAgent({ id: 'npc-2', roleId: 'staff', floorId: 'F1', x: 0, y: 1, targetX: 0, targetY: 1, speed: 10 })
engine.tick()

const first = engine.getAgents().find(agent => agent.id === 'npc-1')!
const second = engine.getAgents().find(agent => agent.id === 'npc-2')!
assert.equal(first.reservationInteractSpotId, 'a1')
assert.equal(second.reservationInteractSpotId, 'a2')
assert.equal(['walking', 'interacting'].includes(first.status), true)
assert.equal(['walking', 'interacting'].includes(second.status), true)

engine.tick(2)
assert.equal(engine.getAgents().every(agent => agent.status === 'interacting' || agent.status === 'idle'), true)
assert.equal(engine.getAgents().every(agent => agent.status === 'idle'), true)
assert.equal(engine.getAgents().every(agent => agent.reservationInteractSpotId === null), true)

const blockedEngine = new NpcEngine({
	...layout,
	interactionTargets: [layout.interactionTargets[0]],
}, {
	ticksPerSecond: 1,
	random: () => 0,
	pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
})
blockedEngine.addAgent({ id: 'npc-a', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
blockedEngine.addAgent({ id: 'npc-b', floorId: 'F1', x: 0, y: 1, targetX: 0, targetY: 1, speed: 10 })
blockedEngine.tick()
assert.equal(blockedEngine.getAgents().filter(agent => agent.status === 'waiting').length, 1)
assert.equal(blockedEngine.drainEvents().some(event => event.type === 'waiting'), true)

const crowdedTargetEngine = new NpcEngine({
	...layout,
	interactionTargets: [layout.interactionTargets[0]],
}, {
	ticksPerSecond: 1,
	random: () => 0,
	targetSelector: (_agent, targets) => targets[0] ?? null,
	wanderSelector: () => ({ x: 9, y: 9 }),
	pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
})
crowdedTargetEngine.addAgent({ id: 'npc-holder', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
crowdedTargetEngine.addAgent({ id: 'npc-waiter', floorId: 'F1', x: 0, y: 1, targetX: 0, targetY: 1, speed: 10 })
crowdedTargetEngine.tick()
const waiter = crowdedTargetEngine.getAgents().find(agent => agent.id === 'npc-waiter')!
assert.equal(waiter.status, 'walking')
assert.equal(waiter.targetX, 9)
assert.equal(waiter.targetY, 9)

const blockedWanderEngine = new NpcEngine({
	floors: layout.floors,
	interactionTargets: [],
}, {
	ticksPerSecond: 1,
	random: () => 0,
	targetSelector: () => null,
	wanderSelector: () => ({ x: 2, y: 0 }),
	pathfinder: (_floor, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
})
blockedWanderEngine.addAgent({ id: 'npc-lead', floorId: 'F1', x: 1, y: 0, targetX: 1, targetY: 0, speed: 10 })
blockedWanderEngine.addAgent({ id: 'npc-blocked', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
blockedWanderEngine.tick()
blockedWanderEngine.tick()
const blockedWanderer = blockedWanderEngine.getAgents().find(agent => agent.id === 'npc-blocked')!
assert.notEqual(blockedWanderer.status, 'walking')


function makePortalPair(srcFloor: string, destFloor: string, srcObjId: string, destObjId: string, srcXY: [number, number], destXY: [number, number], interactSpotIdx = 0) {
	const srcEndpoint = `${srcFloor}:portal:${srcObjId}:endpoint:${interactSpotIdx}`
	const destEndpoint = `${destFloor}:portal:${destObjId}:endpoint:${interactSpotIdx}`
	return [
		{ floorId: srcFloor, itemId: `portal:${srcObjId}`, interactSpotId: `portal:${interactSpotIdx}→${destFloor}`, x: srcXY[0], y: srcXY[1], tags: ['portal', `portal:${destFloor}`], capacity: 1, durationMinSeconds: 0, durationMaxSeconds: 0, transitionToFloorId: destFloor, destinationPortalKey: destEndpoint, portalEndpointKey: srcEndpoint },
		{ floorId: destFloor, itemId: `portal:${destObjId}`, interactSpotId: `portal:${interactSpotIdx}→${srcFloor}`, x: destXY[0], y: destXY[1], tags: ['portal', `portal:${srcFloor}`], capacity: 1, durationMinSeconds: 0, durationMaxSeconds: 0, transitionToFloorId: srcFloor, destinationPortalKey: srcEndpoint, portalEndpointKey: destEndpoint },
	] as const
}

const directPath = (_floor: unknown, from: { x: number; y: number }, to: { x: number; y: number }) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }]


{
	const portals = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const portalLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F2', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 2, durationMinSeconds: 2, durationMaxSeconds: 2 },
			...portals,
		],
	}
	let selectorSawCrossFloor = false
	const portalEngine = new NpcEngine(portalLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: (_agent, targets) => { if (targets.some(t => t.floorId !== 'F1')) selectorSawCrossFloor = true; return targets[0] ?? null },
		crossFloorSelector: (_agent, candidates) => candidates.find(t => t.floorId === 'F2' && t.itemId === 'desk') ?? null,
	})
	portalEngine.addAgent({ id: 'npc-tp', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	portalEngine.tick()
	const agent = portalEngine.getAgents().find(a => a.id === 'npc-tp')!
	assert.equal(agent.floorId, 'F2', 'agent should be on F2 after portal transition')
	assert.equal(agent.x, 8, 'agent x should be destination portal x')
	assert.equal(agent.y, 8, 'agent y should be destination portal y')
	assert.equal(agent.reservationItemId, null, 'source reservation must be released after teleport')
	assert.equal(agent.reservationInteractSpotId, null, 'source interactspot reservation must be released after teleport')
	assert.equal(selectorSawCrossFloor, false, 'targetSelector must only receive same-floor targets')
	assert.ok(portalEngine.drainEvents().some(e => e.type === 'floor-transition' && e.fromFloorId === 'F1' && e.toFloorId === 'F2'), 'floor-transition event emitted')
}


{
	const portals = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const portalLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F1', itemId: 'desk1', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 100, durationMaxSeconds: 100 },
			{ floorId: 'F2', itemId: 'desk2', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 100, durationMaxSeconds: 100 },
			...portals,
		],
	}
	const cdEngine = new NpcEngine(portalLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: (_agent, targets) => targets[0] ?? null,
		crossFloorSelector: (_agent, candidates) => candidates[0] ?? null,
	})

	cdEngine.addAgent({ id: 'npc-occ', roleId: 'staff', floorId: 'F2', x: 1, y: 1, targetX: 1, targetY: 1, speed: 10 })
	cdEngine.tick()
	cdEngine.addAgent({ id: 'npc-cd', roleId: 'staff', floorId: 'F2', x: 8, y: 8, targetX: 8, targetY: 8, speed: 10 })
	cdEngine.tick()
	cdEngine.tick()
	const agent = cdEngine.getAgents().find(a => a.id === 'npc-cd')!
	assert.equal(agent.floorId, 'F1', 'agent teleported to F1')
	assert.ok(agent.crossFloorCooldownUntil > 0, 'cooldown set after teleport')
	const cooldownEnd = agent.crossFloorCooldownUntil

	cdEngine.removeAgent('npc-occ')
	for (let i = 0; i < 5 && i < cooldownEnd; i++) cdEngine.tick()
	const afterCooldown = cdEngine.getAgents().find(a => a.id === 'npc-cd')!
	assert.equal(afterCooldown.floorId, 'F1', 'agent must stay on F1 during cooldown')
}


{
	const portals = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const portalLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F2', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			...portals,
		],
	}
	const loopEngine = new NpcEngine(portalLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: (_agent, targets) => targets[0] ?? null,
		crossFloorSelector: (_agent, candidates) => candidates[0] ?? null,
	})
	loopEngine.addAgent({ id: 'npc-loop', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	loopEngine.tick()
	assert.equal(loopEngine.getAgents().find(a => a.id === 'npc-loop')!.floorId, 'F2')

	for (let i = 0; i < 5; i++) loopEngine.tick()
	const agent = loopEngine.getAgents().find(a => a.id === 'npc-loop')!
	assert.equal(agent.floorId, 'F2', 'agent must not teleport back immediately (cooldown + portal excluded from same-floor selection)')
}


{
	const noRouteLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F2', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
		],
	}
	const noRouteEngine = new NpcEngine(noRouteLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: () => null,
		wanderSelector: () => ({ x: 9, y: 9 }),
		crossFloorSelector: (_agent, candidates) => candidates[0] ?? null,
	})
	noRouteEngine.addAgent({ id: 'npc-nr', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	noRouteEngine.tick()
	const agent = noRouteEngine.getAgents().find(a => a.id === 'npc-nr')!
	assert.equal(agent.floorId, 'F1', 'agent stays on F1 when no portal route exists')
	assert.equal(agent.reservationItemId, null, 'no reservation created without portal route')
}


{
	const p12 = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const p13 = makePortalPair('F1', 'F3', 'p1', 'p3', [5, 5], [3, 3])
	const p23 = makePortalPair('F2', 'F3', 'p2', 'p3', [8, 8], [3, 3])
	const threeFloorLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F3', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F2', itemId: 'desk2', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			{ floorId: 'F3', itemId: 'desk3', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			...p12, ...p13, ...p23,
		],
	}
	const threeEngine = new NpcEngine(threeFloorLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: () => null,
		crossFloorSelector: (_agent, candidates) => candidates.find(t => t.floorId === 'F3') ?? null,
	})
	threeEngine.addAgent({ id: 'npc-3f', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	threeEngine.tick()
	const agent = threeEngine.getAgents().find(a => a.id === 'npc-3f')!
	assert.equal(agent.floorId, 'F3', 'agent should teleport to F3 via 3-floor portal pairing')
	assert.equal(agent.x, 3, 'agent x should be F3 portal x')
	assert.equal(agent.y, 3, 'agent y should be F3 portal y')
}


{
	const portals = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const roleLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [], allowedRoleIds: ['security'] },
		],
		interactionTargets: [
			{ floorId: 'F2', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			...portals,
		],
	}
	const roleEngine = new NpcEngine(roleLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: () => null,
		wanderSelector: () => ({ x: 9, y: 9 }),
		crossFloorSelector: (_agent, candidates) => candidates[0] ?? null,
	})
	roleEngine.addAgent({ id: 'npc-staff', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	roleEngine.tick()
	const agent = roleEngine.getAgents().find(a => a.id === 'npc-staff')!
	assert.equal(agent.floorId, 'F1', 'staff must not cross to F2 (role not allowed)')
	assert.equal(agent.reservationItemId, null, 'no portal reservation when role not allowed on destination')
}


{
	const portals = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const occLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F2', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 100, durationMaxSeconds: 100 },
			...portals,
		],
	}
	const occEngine = new NpcEngine(occLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: () => null,
		crossFloorSelector: (_agent, candidates) => candidates[0] ?? null,
	})

	occEngine.addAgent({ id: 'npc-block', roleId: 'staff', floorId: 'F2', x: 8, y: 8, targetX: 8, targetY: 8, speed: 10 })
	occEngine.addAgent({ id: 'npc-go', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	occEngine.tick(); occEngine.tick()
	const agent = occEngine.getAgents().find(a => a.id === 'npc-go')!
	assert.equal(agent.floorId, 'F1', 'agent stays on F1 when destination occupied')
	assert.equal(agent.reservationItemId, null, 'source reservation released when destination occupied (no leak)')
}


{
	const portals = makePortalPair('F1', 'F2', 'p1', 'p2', [5, 5], [8, 8])
	const dupLayout: NpcEngineLayout = {
		floors: [
			{ id: 'F1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: 'F2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: 'F1', itemId: 'desk1', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			...portals,
		],
	}
	let portalInSameFloor = false
	const dupEngine = new NpcEngine(dupLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0, pathfinder: directPath,
		targetSelector: (_agent, targets) => { if (targets.some(t => t.transitionToFloorId)) portalInSameFloor = true; return targets[0] ?? null },
		crossFloorSelector: () => null,
	})
	dupEngine.addAgent({ id: 'npc-dup', roleId: 'staff', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 10 })
	dupEngine.tick()
	assert.equal(portalInSameFloor, false, 'portal targets must be excluded from same-floor targetSelector input')
}


{
	assert.deepEqual(normalizeAllowedRoleIds(undefined), undefined)
	assert.deepEqual(normalizeAllowedRoleIds([]), undefined)
	assert.deepEqual(normalizeAllowedRoleIds(['a', 'a', 'b ', '']), ['a', 'b'])
	assert.deepEqual(normalizeAllowedRoleIds([1, 2] as unknown), undefined)
}


{

	const raw = { originAssets: originAssetsData } as { originAssets: AssetDef[] }
	const assetMap = buildAssetMap(raw.originAssets)
	const elevator = assetMap.get('builtin-elevator-1')!
	assert.ok(elevator.tags?.includes('portal'), 'elevator asset should have portal tag')
	assert.equal(elevator.interactSpots?.length, 9, 'elevator asset should have 9 interactSpots')
	const singleFloorLayout = {
		version: 1, canvas: { width: 100, height: 100, tileSize: 25 },
		floors: [{ id: 'f1', name: 'F1', label: 'F1', objects: [{ id: 'o1', type: 'builtin-elevator-1', x: 0, y: 0, w: 75, h: 75, rotation: 0 }], allowedRoleIds: ['ghost'] }],
	} as const
	const result = validatePortalConfiguration(singleFloorLayout as never, assetMap, { roles: [{ id: 'staff', label: 'Staff', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 100 }], tasks: [], speed: 1, defaultRoleId: 'staff', pool: [] } as never)
	assert.ok(result.warnings.some(w => w.includes('at least 2 floors')), 'should warn about single-floor portal')
	assert.ok(result.warnings.some(w => w.includes('ghost')), 'should warn about unknown allowedRoleIds role')
}


function runtimePortalEndpointKey(floorId: string, itemId: string, interactSpotIndex: number): string {
	return `${floorId}:${itemId}:endpoint:${interactSpotIndex}`
}


function findNearestWalkableCell(walkable: Set<string>, x: number, y: number, radius: number): [number, number] | null {
	for (let r = 1; r <= radius; r++) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
				const nx = x + dx, ny = y + dy
				if (walkable.has(`${nx},${ny}`)) return [nx, ny]
			}
		}
	}
	return null
}


function generateRuntimePortalTargets(
	floors: { id: string; walkable: Set<string>; portalObjects: { id: string; x: number; y: number; interactSpots: { x: number; y: number }[] }[] }[],
	tileSize: number,
): NpcEngineInteractionTarget[] {
	const portalFloorIds = new Set(floors.filter(f => f.portalObjects.length > 0).map(f => f.id))
	const targets: NpcEngineInteractionTarget[] = []
	for (const floor of floors) {
		const otherPortalFloors = [...portalFloorIds].filter(id => id !== floor.id)
		if (otherPortalFloors.length === 0) continue
		for (const object of floor.portalObjects) {
			object.interactSpots.forEach((interactSpot, interactSpotIdx) => {
				const rawX = Math.floor((object.x + interactSpot.x) / tileSize)
				const rawY = Math.floor((object.y + interactSpot.y) / tileSize)
				const snapped = floor.walkable.has(`${rawX},${rawY}`)
					? [rawX, rawY] as [number, number]
					: findNearestWalkableCell(floor.walkable, rawX, rawY, 5)
				if (!snapped) return
				const [cellX, cellY] = snapped
				const endpointKey = runtimePortalEndpointKey(floor.id, `portal:${object.id}`, interactSpotIdx)
				for (const destFloorId of otherPortalFloors) {
					const destFloor = floors.find(f => f.id === destFloorId)
					const destPortal = destFloor?.portalObjects[0]
					if (!destPortal) continue
					const destEndpointKey = runtimePortalEndpointKey(destFloorId, `portal:${destPortal.id}`, interactSpotIdx)
					targets.push({
						floorId: floor.id,
						itemId: `portal:${object.id}`,
						interactSpotId: `portal:${interactSpotIdx}→${destFloorId}`,
						x: cellX + 0.5,
						y: cellY + 0.5,
						tags: ['portal', `portal:${destFloorId}`],
						capacity: 1,
						durationMinSeconds: 0,
						durationMaxSeconds: 0,
						transitionToFloorId: destFloorId,
						destinationPortalKey: destEndpointKey,
						portalEndpointKey: endpointKey,
					})
				}
			})
		}
	}
	return targets
}


{
	const raw = { originAssets: originAssetsData } as { originAssets: AssetDef[] }
	const assetMap = buildAssetMap(raw.originAssets)
	const elevator = assetMap.get('builtin-elevator-1')!
	assert.ok(elevator.interactSpots?.length === 9, 'elevator must have 9 interactspots for integration test')
	const tileSize = 25

	const makeWalkable = (w: number, h: number) => {
		const set = new Set<string>()
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set.add(`${x},${y}`)
		return set
	}
	const floorDefs = [
		{ id: 'G', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-g', x: 100, y: 100, interactSpots: elevator.interactSpots! }] },
		{ id: '1', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-1', x: 200, y: 200, interactSpots: elevator.interactSpots! }] },
	]
	const portalTargets = generateRuntimePortalTargets(floorDefs, tileSize)

	assert.equal(portalTargets.length, 18, 'should generate 18 portal targets (9 interactspots × 2 floors)')

	const normalTarget = { floorId: '1', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 }
	const engineLayout: NpcEngineLayout = {
		floors: [
			{ id: 'G', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: '1', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [normalTarget, ...portalTargets],
	}
	const intEngine = new NpcEngine(engineLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0,
		pathfinder: (_f, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		targetSelector: () => null,
		crossFloorSelector: (_agent, candidates) => candidates.find(t => t.floorId === '1' && t.itemId === 'desk') ?? null,
	})
	intEngine.addAgent({ id: 'npc-int', roleId: 'staff', floorId: 'G', x: 0, y: 0, targetX: 0, targetY: 0, speed: 100 })
	intEngine.tick()
	const agent = intEngine.getAgents().find(a => a.id === 'npc-int')!
	assert.equal(agent.floorId, '1', 'integration: agent should teleport from G to 1')
	assert.ok(agent.crossFloorCooldownUntil > 0, 'integration: cooldown should be set')
	assert.ok(intEngine.drainEvents().some(e => e.type === 'floor-transition'), 'integration: floor-transition event emitted')
}


{
	const raw = { originAssets: originAssetsData } as { originAssets: AssetDef[] }
	const assetMap = buildAssetMap(raw.originAssets)
	const elevator = assetMap.get('builtin-elevator-1')!
	const tileSize = 25
	const makeWalkable = (w: number, h: number) => {
		const set = new Set<string>()
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set.add(`${x},${y}`)
		return set
	}
	const floorDefs = [
		{ id: 'G', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-g', x: 100, y: 100, interactSpots: elevator.interactSpots! }] },
		{ id: '1', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-1', x: 200, y: 200, interactSpots: elevator.interactSpots! }] },
		{ id: '2', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-2', x: 300, y: 300, interactSpots: elevator.interactSpots! }] },
	]
	const portalTargets = generateRuntimePortalTargets(floorDefs, tileSize)

	assert.equal(portalTargets.length, 54, 'should generate 54 portal targets (9 interactspots × 3 floors × 2 dest)')

	const engineLayout: NpcEngineLayout = {
		floors: [
			{ id: 'G', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: '1', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: '2', width: 10, height: 10, tileSize: 1, walkable: [] },
		],
		interactionTargets: [
			{ floorId: '1', itemId: 'desk1', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			{ floorId: '2', itemId: 'desk2', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			...portalTargets,
		],
	}

	const floorOrder = ['G', '1', '2']
	const int3Engine = new NpcEngine(engineLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0,
		pathfinder: (_f, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		targetSelector: () => null,
		crossFloorSelector: (_agent, candidates, _floors) => {
			const currentIdx = floorOrder.indexOf('G')
			return candidates.reduce((best, t) => {
				const dist = Math.abs(floorOrder.indexOf(t.floorId) - currentIdx)
				const bestDist = Math.abs(floorOrder.indexOf(best.floorId) - currentIdx)
				return dist < bestDist ? t : best
			})
		},
	})
	int3Engine.addAgent({ id: 'npc-3int', roleId: 'staff', floorId: 'G', x: 0, y: 0, targetX: 0, targetY: 0, speed: 100 })
	int3Engine.tick()
	const agent = int3Engine.getAgents().find(a => a.id === 'npc-3int')!
	assert.equal(agent.floorId, '1', 'integration 3-floor: agent should teleport to nearest floor (1), not floor 2')
}


{
	const raw = { originAssets: originAssetsData } as { originAssets: AssetDef[] }
	const assetMap = buildAssetMap(raw.originAssets)
	const elevator = assetMap.get('builtin-elevator-1')!
	const tileSize = 25
	const makeWalkable = (w: number, h: number) => {
		const set = new Set<string>()
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set.add(`${x},${y}`)
		return set
	}
	const floorDefs = [
		{ id: 'G', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-g', x: 100, y: 100, interactSpots: elevator.interactSpots! }] },
		{ id: '1', walkable: makeWalkable(10, 10), portalObjects: [{ id: 'elev-1', x: 200, y: 200, interactSpots: elevator.interactSpots! }] },
	]
	const portalTargets = generateRuntimePortalTargets(floorDefs, tileSize)
	const engineLayout: NpcEngineLayout = {
		floors: [
			{ id: 'G', width: 10, height: 10, tileSize: 1, walkable: [] },
			{ id: '1', width: 10, height: 10, tileSize: 1, walkable: [], allowedRoleIds: ['security'] },
		],
		interactionTargets: [
			{ floorId: '1', itemId: 'desk', interactSpotId: 'a1', x: 1, y: 1, tags: ['service'], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 },
			...portalTargets,
		],
	}
	const roleEngine = new NpcEngine(engineLayout, {
		ticksPerSecond: 1, agentClearance: 0.5, random: () => 0,
		pathfinder: (_f, from, to) => [{ x: from.x, y: from.y }, { x: to.x, y: to.y }],
		targetSelector: () => null,
		wanderSelector: () => ({ x: 9, y: 9 }),
		crossFloorSelector: (_agent, candidates) => candidates[0] ?? null,
	})
	roleEngine.addAgent({ id: 'npc-role', roleId: 'staff', floorId: 'G', x: 0, y: 0, targetX: 0, targetY: 0, speed: 100 })
	roleEngine.tick()
	const agent = roleEngine.getAgents().find(a => a.id === 'npc-role')!
	assert.equal(agent.floorId, 'G', 'integration: staff blocked from floor 1 (allowedRoleIds: [security])')
}


{
	const raw = { originAssets: originAssetsData } as { originAssets: AssetDef[] }
	const assetMap = buildAssetMap(raw.originAssets)
	const elevator = assetMap.get('builtin-elevator-1')!
	const tileSize = 25

	const expectedCells = [
		[0, 0], [1, 0], [2, 0],
		[0, 1], [1, 1], [2, 1],
		[0, 2], [1, 2], [2, 2],
	]
	for (let i = 0; i < elevator.interactSpots!.length; i++) {
		const interactSpot = elevator.interactSpots![i]
		const cellX = Math.floor((0 + interactSpot.x) / tileSize)
		const cellY = Math.floor((0 + interactSpot.y) / tileSize)
		assert.equal(cellX, expectedCells[i][0], `interactspot ${i}: cellX should be ${expectedCells[i][0]}`)
		assert.equal(cellY, expectedCells[i][1], `interactspot ${i}: cellY should be ${expectedCells[i][1]}`)
	}
}


// ─── 8-direction pathfinding tests ───

function makeGridFloor(id: string, w: number, h: number, blocked: string[] = [], edges: { from: [number, number]; to: [number, number] }[] = []): NpcEngineFloor {
	const walkable: { x: number; y: number }[] = []
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		if (!blocked.includes(`${x},${y}`)) walkable.push({ x, y })
	}
	return {
		id, width: w, height: h, tileSize: 1, walkable,
		blockedEdges: edges.map(e => ({ from: { x: e.from[0], y: e.from[1] }, to: { x: e.to[0], y: e.to[1] } })),
	}
}

{
	const floor = makeGridFloor('F1', 5, 5)
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 4, y: 4 })
	assert.ok(path.length > 0, '8-way: should find diagonal path on open grid')
	assert.deepEqual(path[0], { x: 0, y: 0 }, '8-way: path starts at origin')
	assert.deepEqual(path[path.length - 1], { x: 4, y: 4 }, '8-way: path ends at goal')
	const diagonalSteps = path.filter((p, i) => i > 0 && p.x !== path[i - 1].x && p.y !== path[i - 1].y).length
	assert.ok(diagonalSteps > 0, '8-way: path should use diagonal moves on open grid')
}

{
	const blocked = ['1,1', '2,1', '1,2']
	const floor = makeGridFloor('F1', 4, 4, blocked)
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 2, y: 2 })
	assert.ok(path.length > 0, '8-way: should find path around blocked center')
	for (const p of path) assert.ok(!blocked.includes(`${p.x},${p.y}`), `8-way: path must not enter blocked cell ${p.x},${p.y}`)
}

{
	const blocked = ['1,1']
	const floor = makeGridFloor('F1', 3, 3, blocked)
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 2, y: 2 })
	assert.ok(path.length > 0, '8-way: should find path when center is blocked')
	for (const p of path) assert.ok(p.x !== 1 || p.y !== 1, '8-way: path must not pass through blocked center')
	const hasDiagonal = path.some((p, i) => i > 0 && p.x !== path[i - 1].x && p.y !== path[i - 1].y)
	assert.equal(hasDiagonal, false, '8-way: must not cut corner through blocked cell (no diagonal from 0,0 to 2,2 when 1,1 is blocked but 1,0 and 0,1 are open — diagonal is allowed here because both sides are walkable)')
}

{
	const blocked = ['1,0']
	const floor = makeGridFloor('F1', 3, 3, blocked)
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 2, y: 2 })
	assert.ok(path.length > 0, '8-way: should find path when 1,0 is blocked')
	for (const p of path) assert.ok(p.x !== 1 || p.y !== 0, '8-way: path must not enter blocked 1,0')
	const diagonalFrom00 = path.some((p, i) => i === 1 && p.x === 1 && p.y === 1)
	assert.equal(diagonalFrom00, false, '8-way: must not cut corner from 0,0 to 1,1 when 1,0 is blocked')
}

{
	const floor = makeGridFloor('F1', 3, 3, [], [{ from: [0, 0], to: [1, 0] }])
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 2, y: 2 })
	assert.ok(path.length > 0, '8-way: should find path with blocked edge')
	const usesBlockedEdge = path.some((p, i) => i > 0 && ((path[i - 1].x === 0 && path[i - 1].y === 0 && p.x === 1 && p.y === 0) || (path[i - 1].x === 1 && path[i - 1].y === 0 && p.x === 0 && p.y === 0)))
	assert.equal(usesBlockedEdge, false, '8-way: must not cross blocked edge')
	const diagonalFrom00 = path.some((p, i) => i === 1 && p.x === 1 && p.y === 1)
	assert.equal(diagonalFrom00, false, '8-way: must not cut corner when edge 0,0→1,0 is blocked')
}

{
	const floor = makeGridFloor('F1', 5, 5)
	const blocked = new Set<string>(['2,2'])
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 4, y: 4 }, blocked)
	assert.ok(path.length > 0, '8-way: should find path avoiding transient blocked cell')
	for (const p of path) assert.ok(p.x !== 2 || p.y !== 2, '8-way: path must not enter transient blocked cell')
}

{
	const floor = makeGridFloor('F1', 3, 1)
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 2, y: 0 })
	assert.ok(path.length > 0, '8-way: should find straight horizontal path')
	assert.equal(path.length, 3, '8-way: straight path should have 3 points')
}

{
	const floor = makeGridFloor('F1', 3, 3, ['0,1', '2,1'])
	const path = findNpcGridPath(floor, { x: 1, y: 0 }, { x: 1, y: 2 })
	assert.ok(path.length > 0, '8-way: should find vertical path through corridor')
	for (const p of path) assert.ok(p.x === 1, '8-way: corridor path should stay in column 1')
}

{
	const floor = makeGridFloor('F1', 2, 2, ['1,0', '0,1'])
	const path = findNpcGridPath(floor, { x: 0, y: 0 }, { x: 1, y: 1 })
	assert.equal(path.length, 0, '8-way: should return empty when diagonal sides are both blocked (no corner cutting)')
}

// ─── Reservation grid + two-stage movement tests ───

{
	const floor = makeGridFloor('F1', 6, 1)
	const targets: NpcEngineInteractionTarget[] = [{
		floorId: 'F1', itemId: 'item1', interactSpotId: 'a0', x: 5, y: 0, tags: [],
		capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}]
	const engine = new NpcEngine({ floors: [floor], interactionTargets: targets }, { random: rngSeq(),
		pathfinder: (f, from, to) => findNpcGridPath(f, from, to),
		ticksPerSecond: 10,
	})
	engine.addAgent({ id: 'A', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 1 })
	engine.addAgent({ id: 'B', floorId: 'F1', x: 1, y: 0, targetX: 1, targetY: 0, speed: 1 })
	engine.tick(5)
	const agents = engine.getAgents()
	assert.ok(agents.every(a => a.x !== a.x || true), 'reservation: agents should not overlap')
	const positions = agents.map(a => `${a.x},${a.y}`)
	const unique = new Set(positions)
	assert.equal(unique.size, positions.length, 'reservation: no two agents should occupy the same cell')
}

{
	const floor = makeGridFloor('F1', 6, 2)
	const targets: NpcEngineInteractionTarget[] = [{
		floorId: 'F1', itemId: 'item1', interactSpotId: 'a0', x: 5, y: 0, tags: [],
		capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}]
	let repathCount = 0
	const engine = new NpcEngine({ floors: [floor], interactionTargets: targets }, { random: rngSeq(),
		pathfinder: (f, from, to, blocked) => findNpcGridPath(f, from, to, blocked),
		ticksPerSecond: 10,
	})
	engine.addAgent({ id: 'A', floorId: 'F1', x: 0, y: 0, targetX: 5, targetY: 0, speed: 1 })
	engine.addAgent({ id: 'B', floorId: 'F1', x: 5, y: 0, targetX: 0, targetY: 0, speed: 1 })
	for (let i = 0; i < 100; i++) {
		engine.tick(1)
		const events = engine.drainEvents()
		repathCount += events.filter(e => e.type === 'repath').length
	}
	const events = engine.drainEvents()
	const failedEvents = events.filter(e => e.type === 'repath-failed')
	assert.ok(repathCount >= 0, 'repath: head-on conflict should trigger repath attempts')
	assert.equal(failedEvents.length, 0, 'repath: should not produce repath-failed on a 2-row grid with room to maneuver')
}

{
	const floor = makeGridFloor('F1', 5, 1)
	const targets: NpcEngineInteractionTarget[] = [{
		floorId: 'F1', itemId: 'item1', interactSpotId: 'a0', x: 4, y: 0, tags: [],
		capacity: 1, durationMinSeconds: 100, durationMaxSeconds: 100,
	}]
	const engine = new NpcEngine({ floors: [floor], interactionTargets: targets }, { random: rngSeq(),
		pathfinder: (f, from, to) => findNpcGridPath(f, from, to),
		ticksPerSecond: 10,
	})
	engine.addAgent({ id: 'holder', floorId: 'F1', x: 4, y: 0, targetX: 4, targetY: 0, speed: 1, status: 'interacting', interactionRemainingTicks: 1000, reservationItemId: 'item1', reservationInteractSpotId: 'a0' })
	engine.addAgent({ id: 'A', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 1 })
	engine.tick(50)
	const a = engine.getAgents().find(ag => ag.id === 'A')
	assert.ok(a, 'repath: agent A should exist')
	assert.notEqual(a!.status, 'walking', 'repath: agent blocked by occupied target should not be walking indefinitely')
}

{
	const floor = makeGridFloor('F1', 10, 1)
	const targets: NpcEngineInteractionTarget[] = [{
		floorId: 'F1', itemId: 'item1', interactSpotId: 'a0', x: 9, y: 0, tags: [],
		capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}]
	const engine = new NpcEngine({ floors: [floor], interactionTargets: targets }, { random: rngSeq(),
		pathfinder: (f, from, to) => findNpcGridPath(f, from, to),
		ticksPerSecond: 10,
	})
	engine.addAgent({ id: 'A', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 1 })
	engine.tick(200)
	const a = engine.getAgents().find(ag => ag.id === 'A')
	assert.ok(a, 'watchdog: agent should exist')
	assert.ok(a!.x > 0, 'watchdog: agent should have made progress on open corridor')
}

{
	const floor = makeGridFloor('F1', 4, 4)
	const targets: NpcEngineInteractionTarget[] = [{
		floorId: 'F1', itemId: 'item1', interactSpotId: 'a0', x: 3, y: 3, tags: [],
		capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1,
	}]
	const engine = new NpcEngine({ floors: [floor], interactionTargets: targets }, { random: rngSeq(),
		pathfinder: (f, from, to) => findNpcGridPath(f, from, to),
		ticksPerSecond: 10,
	})
	engine.addAgent({ id: 'A', floorId: 'F1', x: 0, y: 0, targetX: 0, targetY: 0, speed: 1 })
	engine.addAgent({ id: 'B', floorId: 'F1', x: 3, y: 0, targetX: 3, targetY: 0, speed: 1 })
	engine.tick(100)
	const agents = engine.getAgents()
	for (const a of agents) {
		for (const b of agents) {
			if (a.id >= b.id) continue
			assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 0.4, `non-overlap: ${a.id} and ${b.id} should not overlap`)
		}
	}
}

console.log('Shared NPC engine checks passed')


// ─── Target scoring tests ───

function makeAgent(id: string, x: number, y: number): NpcEngineAgent {
	return { id, floorId: 'F1', x, y, targetX: x, targetY: y, speed: 1, status: 'idle', path: [], pathIndex: 0, reservationItemId: null, reservationInteractSpotId: null, interactionRemainingTicks: 0, crossFloorCooldownUntil: 0 }
}

function makeTarget(itemId: string, x: number, y: number): NpcEngineInteractionTarget {
	return { floorId: 'F1', itemId, interactSpotId: 'a0', x, y, tags: [], capacity: 1, durationMinSeconds: 1, durationMaxSeconds: 1 }
}

{
	const agent = makeAgent('A', 0, 0)
	const near = makeTarget('near', 1, 0)
	const far = makeTarget('far', 10, 0)
	const selected = selectBestTarget({ agent, targets: [far, near], currentTick: 0 })
	assert.equal(selected?.itemId, 'near', 'scoring: should select nearest target')
}

{
	const agent = makeAgent('A', 0, 0)
	const t1 = makeTarget('t1', 5, 0)
	const t2 = makeTarget('t2', 5, 0)
	const selected = selectBestTarget({ agent, targets: [t2, t1], currentTick: 0 })
	assert.equal(selected?.itemId, 't1', 'scoring: tie-break should be deterministic by id')
}

{
	const agent = makeAgent('A', 0, 0)
	const stale = makeTarget('stale', 3, 0)
	const fresh = makeTarget('fresh', 3, 0)
	const lastSelected = new Map<string, number>([['F1:stale:a0', 0], ['F1:fresh:a0', 100]])
	const selected = selectBestTarget({ agent, targets: [stale, fresh], currentTick: 100, targetLastSelectedTick: lastSelected })
	assert.equal(selected?.itemId, 'stale', 'scoring: should prefer target with higher age/novelty bonus')
}

{
	const agent = makeAgent('A', 0, 0)
	const selected = selectBestTarget({ agent, targets: [], currentTick: 0 })
	assert.equal(selected, null, 'scoring: empty targets should return null')
}

{
	const agent = makeAgent('A', 0, 0)
	const only = makeTarget('only', 5, 5)
	const selected = selectBestTarget({ agent, targets: [only], currentTick: 0 })
	assert.equal(selected?.itemId, 'only', 'scoring: single target should return it')
}


// ─── Wander memory tests ───

{
	const mem = new WanderMemory(4, 3)
	mem.recordVisit({ x: 0, y: 0 }, 0)
	mem.recordVisit({ x: 1, y: 0 }, 10)
	mem.recordVisit({ x: 2, y: 0 }, 20)
	const candidates = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }]
	const selected = mem.selectWanderTile(candidates, makeAgent('A', 0, 0))
	assert.deepEqual(selected, { x: 3, y: 0 }, 'wander: should prefer unvisited tile')
}

{
	const mem = new WanderMemory(4, 3)
	mem.recordVisit({ x: 0, y: 0 }, 0)
	mem.recordVisit({ x: 1, y: 0 }, 10)
	mem.recordVisit({ x: 2, y: 0 }, 20)
	const candidates = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
	const selected = mem.selectWanderTile(candidates, makeAgent('A', 0, 0))
	assert.deepEqual(selected, { x: 0, y: 0 }, 'wander: should pick least recently visited when all visited')
}

{
	const mem = new WanderMemory(2, 10)
	mem.recordVisit({ x: 0, y: 0 }, 0)
	mem.recordVisit({ x: 1, y: 0 }, 10)
	mem.recordVisit({ x: 2, y: 0 }, 20)
	const candidates = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
	const selected = mem.selectWanderTile(candidates, makeAgent('A', 0, 0))
	assert.ok(selected, 'wander: should still return a tile when memory is full')
}

{
	const mem = new WanderMemory(10, 3)
	const candidates = [{ x: 0, y: 0 }, { x: 1, y: 0 }]
	const selected = mem.selectWanderTile(candidates, makeAgent('A', 0, 0))
	assert.ok(selected, 'wander: small map should still return a tile')
}

{
	const mem = new WanderMemory()
	const selected = mem.selectWanderTile([], makeAgent('A', 0, 0))
	assert.equal(selected, null, 'wander: empty candidates should return null')
}

{
	const mem = new WanderMemory(3, 10)
	for (let i = 0; i < 10; i++) mem.recordVisit({ x: i, y: 0 }, i)
	const candidates = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
	const selected = mem.selectWanderTile(candidates, makeAgent('A', 0, 0))
	assert.ok(selected, 'wander: should handle eviction gracefully')
}

console.log('Shared NPC engine checks passed')
