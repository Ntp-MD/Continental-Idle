import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createBlueprintStore, emptySeed, type PersistencePort, type SyncPort } from '../../src/blueprint-editor/store/index'
import { seedWorkspaceFile } from '../../src/blueprint-editor/store/seed'
import { emptyNpcConfig, starterNpcConfig } from '../../src/blueprint-editor/store/storeUtils'
import { useNpcSimulationCore } from '../../src/blueprint-editor/composables/useNpcSimulationCore'
import { frameDeadline, framesUntil } from './frameWaits'
import { resolveStreetTiles } from '../../src/blueprint-editor/domain/types'
import { rateForTags, visitorRoleIds } from '../../src/blueprint-editor/domain/economy/takings'
import { NEED_TAGS, NPC_NEED_KEYS } from '../../src/engine/npc/needs'
import { useToast } from '@/composables/useToast'

/**
 * The house that ships with the game, read as a player meets it: a cold boot with nothing saved, then the
 * starter lobby loaded through the store's one import path. Two things have to survive that, and both are
 * claims a file can silently lose: the crowd must be deployable, and the plate must hold something the
 * tariff pays for. A lobby nobody can earn in is not a starter house, it is an empty room with a price
 * list - which is exactly what `floor-g` was when its only fixture carried a tag that left the tariff.
 */
const toast = useToast()

function coldStore() {
	const port: PersistencePort & { saves: number } = {
		saves: 0,
		async load() { return null },
		async save() { port.saves++; return true },
	}
	const sync: SyncPort = { emit() {} }
	return createBlueprintStore({ persistence: port, sync, seed: emptySeed() })
}

test('the shipped lobby lands whole on a cold boot and can be played', async () => {
	const store = coldStore()
	// The cold state this feature exists to replace: nothing to deploy, nothing on the plate.
	assert.equal(store.state.layout.floors.length, 0, 'a cold boot is not empty, so this proves nothing')

	const toastsBefore = toast.toasts.value.length
	const file = await seedWorkspaceFile()
	assert.equal(await store.importWorkspace(file), true, 'the starter lobby did not load')
	assert.equal(
		toast.toasts.value.slice(toastsBefore).some(entry => entry.message.includes('imported with losses')),
		false,
		`the starter lobby arrived damaged: ${JSON.stringify(toast.toasts.value.slice(toastsBefore))}`,
	)

	const placed = store.state.layout.floors.flatMap(floor => floor.objects)
	assert.ok(placed.length > 0, 'the starter lobby has no fixtures at all')
	const tagsOfType = new Map(store.state.assetRegistry.map(asset => [asset.id, asset.tags ?? []]))
	const billed = placed.filter(object => rateForTags(tagsOfType.get(object.type) ?? []) !== null)
	// Two, not one: a plate that earns from a single service point is one blocked queue away from a house
	// that earns nothing, and the starter lobby is the one plate a player never has to design.
	assert.ok(
		billed.length >= 2,
		`the starter lobby earns from too few fixtures: ${JSON.stringify(placed.map(object => object.type))}`,
	)

	// Deployable in both halves of the loop: visitors to walk in and be served, staff to serve them.
	const config = store.state.layout.npcConfig
	assert.ok(config, 'the starter lobby carries no simulation config')
	assert.ok(visitorRoleIds(config.roles ?? []).size > 0, 'no role holds no post, so nobody arrives to spend')
	const heads = (config.pool ?? []).reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.count)), 0)
	assert.ok(heads > 0, 'the deployment has nobody in it')
	assert.ok(
		(config.pool ?? []).some(entry => !(config.roles ?? []).some(role => role.id === entry.roleId && role.taskIds?.length)),
		'no head of the pool is a visitor, so nothing walks in to be served',
	)
	assert.equal(store.hasContent(), true, 'the store does not consider the starter lobby content')
})

test('the starter lobby is the same document the app validates at boot', async () => {
	const file = await seedWorkspaceFile()
	const store = coldStore()
	assert.equal(await store.importWorkspace(file), true)
	const reloaded = store.exportWorkspace()
	// One floor, and the plate the player is handed: a loss here means the shipped file and the shipped
	// export disagree about what the starter house contains.
	assert.equal(reloaded.layout.floors.length, store.state.layout.floors.length, 'the export lost a floor')
	assert.equal(
		reloaded.layout.floors.reduce((sum, floor) => sum + floor.objects.length, 0),
		store.state.layout.floors.reduce((sum, floor) => sum + floor.objects.length, 0),
		'exporting the starter lobby dropped a fixture',
	)
	assert.ok(file.originAssets.length > 0, 'the shipped library is empty, so the shop has nothing to sell')
})

/**
 * The path the whole game is: place things, press Deploy, watch. Everything before those two presses
 * - authoring a role, setting a count, opening the street - is a step the player should not have to
 * learn before the thing they came for works.
 */
async function deployableHouse(config: ReturnType<typeof emptyNpcConfig>) {
	const port: PersistencePort = { async load() { return null }, async save() { return true } }
	const store = createBlueprintStore({ persistence: port, sync: { emit() {} } as SyncPort, seed: emptySeed() })
	const floor = await store.addFloor()
	assert.ok(floor, 'the first floor could not be created')

	const canvas = store.state.layout.canvas
	const tileSize = Math.max(1, Math.round(canvas.tileSize))
	const cols = Math.max(1, Math.ceil(canvas.width / tileSize))
	const street = resolveStreetTiles(store.state.layout)
	// A door on the street ring, painted the way the toolbar paints it. Without it nobody can enter,
	// and the warning the panel shows is the honest reading of that.
	await store.paintFloorTiles(floor.id, 'door', {
		row0: street, col0: Math.floor(cols / 2), row1: street, col1: Math.floor(cols / 2),
	})

	const bounds = { w: canvas.width, h: canvas.height, tileSize, streetTiles: street }
	const core = useNpcSimulationCore({
		getConfig: () => config,
		getFloors: () => store.state.layout.floors,
		getCanvas: () => bounds,
		getViewFloorId: () => floor.id,
		idPrefix: 'npc-starter-test-',
		random: () => 0.5,
		getAssetDef: () => undefined,
		getAssetTags: () => undefined,
	})
	core.ingestConfig(config)
	// Twelve guests a day is one every 1,500 ticks, so the first arrival is a quarter of a minute away
	// at 1x. The clock is wound up rather than the crowd enlarged: the rate is the thing being tested.
	core.simSpeed.value = 8
	core.deploy(store.state.layout.floors, bounds, floor.id)
	return core
}

test('a house straight out of the box deploys a crowd with nothing authored', async () => {
	const core = await deployableHouse(starterNpcConfig())
	try {
		// Pressing Deploy is the player saying they want the house to run, and the street opens with
		// it: a house that was working and then silently took no guests is the worse failure.
		assert.equal(core.trafficOn.value, true, 'deploying left the street shut')
		frameDeadline('nobody ever walked in through the door', await framesUntil(() => core.getTrafficSummary().spawned > 0))
	} finally {
		core.stopLoop()
	}
}, 30_000)

test('the crowd a new house carries is what makes its first Deploy do anything', async () => {
	// The same floor, the same door, the same press - only the config differs. This is the claim that
	// the starter guest is load-bearing rather than decorative.
	const blank = await deployableHouse(emptyNpcConfig())
	try {
		assert.equal(blank.trafficOn.value, false, 'a house with no roles still opened its street')
		assert.equal(blank.getTrafficSummary().spawned, 0)
	} finally {
		blank.stopLoop()
	}
}, 30_000)

test('the workspace the editor opens with is already deployable', () => {
	// Read straight off `emptySeed`, not off the helper: this is the config the app boots with, and a
	// role that only exists in a test would leave the first Deploy refused in the real editor.
	const config = emptySeed().layout.npcConfig
	assert.ok(config, 'the opening workspace carries no npc config at all')
	const visitors = visitorRoleIds(config.roles)
	assert.ok(visitors.size > 0, 'the opening workspace has no visitor role, so its first Deploy deploys nobody')
	assert.ok(
		(config.pool ?? []).some(entry => visitors.has(entry.roleId) && entry.count > 0),
		'the visitor role exists but nothing is deployed by it',
	)
	assert.ok(config.defaultRoleId, 'the opening workspace names no default role')
})

test('a crowd reaches every floor the player built', async () => {
	// The player's sentence is "place things on each floor" - plural. A house that only ever puts
	// people on the floor the camera happens to be looking at would look broken from upstairs.
	const port: PersistencePort = { async load() { return null }, async save() { return true } }
	const store = createBlueprintStore({ persistence: port, sync: { emit() {} } as SyncPort, seed: emptySeed() })
	const first = await store.addFloor()
	const second = await store.addFloor()
	assert.ok(first && second, 'two floors could not be created')
	assert.equal(store.state.layout.floors.length, 2)

	const canvas = store.state.layout.canvas
	const tileSize = Math.max(1, Math.round(canvas.tileSize))
	const cols = Math.max(1, Math.ceil(canvas.width / tileSize))
	const street = resolveStreetTiles(store.state.layout)
	for (const floor of store.state.layout.floors) {
		await store.paintFloorTiles(floor.id, 'door', {
			row0: street, col0: Math.floor(cols / 2), row1: street, col1: Math.floor(cols / 2),
		})
	}

	const bounds = { w: canvas.width, h: canvas.height, tileSize, streetTiles: street }
	const core = useNpcSimulationCore({
		getConfig: () => store.state.layout.npcConfig,
		getFloors: () => store.state.layout.floors,
		getCanvas: () => bounds,
		getViewFloorId: () => first.id,
		idPrefix: 'npc-multifloor-test-',
		random: () => 0.5,
		getAssetDef: () => undefined,
		getAssetTags: () => undefined,
	})
	core.ingestConfig(store.state.layout.npcConfig)
	core.simSpeed.value = 8
	core.deploy(store.state.layout.floors, bounds, first.id)
	try {
		assert.equal(core.trafficOn.value, true, 'the street did not open on a house with doors on both floors')
		frameDeadline(
			'one of the two floors never saw anybody',
			await framesUntil(() => new Set([...core.frameDots.values()].map(dot => dot.floorId)).size >= 2),
		)
	} finally {
		core.stopLoop()
	}
}, 40_000)

test('the shipped house bills the rates an urge can actually lead a guest to', async () => {
	// Loop 71 authored the eleven floors around four reachable rates; loop 72 gave the guests the urges
	// that walk them to a fixture. The two claims are only worth what they cover together: a plate that
	// carries a tariff tag no urge ever points at is money the house can bill only by accident, and a
	// rate that disappears from the plate takes a way of earning with it.
	const file = await seedWorkspaceFile()
	const tagsByType = new Map(file.originAssets.map(asset => [asset.id, asset.tags ?? []]))
	const servable = new Set(NPC_NEED_KEYS.flatMap(key => [...NEED_TAGS[key]]))
	const billed = new Map<string, number>()
	for (const floor of file.layout.floors) {
		for (const object of floor.objects) {
			const tags = tagsByType.get(object.type) ?? []
			const rate = rateForTags(tags)
			if (!rate) continue
			if (!tags.some(tag => servable.has(tag))) continue
			billed.set(rate.tag, (billed.get(rate.tag) ?? 0) + 1)
		}
	}
	assert.deepEqual(
		[...billed.keys()].sort(),
		['bar', 'chamberlain', 'chambers'],
		`the house bills ${[...billed.keys()].sort().join(', ') || 'nothing'} to an urge-driven guest`,
	)
	// One fixture of a kind is one click from being deleted; the house earns from each rate in many
	// places, and the count is what makes "it bills" a property of the building rather than of one bed.
	assert.ok((billed.get('chambers') ?? 0) >= 12, `only ${billed.get('chambers')} chambers carry the bed rate`)
	assert.ok((billed.get('chamberlain') ?? 0) >= 1, 'no desk carries the chamberlain rate')
	assert.ok((billed.get('bar') ?? 0) >= 3, `only ${billed.get('bar')} fixtures carry the bar rate`)
})
