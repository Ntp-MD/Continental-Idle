import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createBlueprintStore, type PersistencePort, type SyncPort } from '../../src/blueprint-editor/store/index'
import { defaultSeed } from '../../src/blueprint-editor/store/seed'
import { serializeWorkspace, parseWorkspace } from '../../src/blueprint-editor/store/workspaceFile'
import { assignSyncKeys, buildSyncedPayload, loadSyncedPayload } from '../../src/blueprint-editor/syncedPayload'
import { useToast } from '@/composables/useToast'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const toast = useToast()

function syncPort(): SyncPort {
	return { emit() {} }
}

/** The port of the store `freshStore()` last built, so a test can make the next save fail. */
let lastPort: PersistencePort & { ok: boolean; saves: number }

async function freshStore() {
	lastPort = {
		ok: true,
		saves: 0,
		async load() { return null },
		async save() { lastPort.saves++; return lastPort.ok },
	}
	const store = await createBlueprintStore({ persistence: lastPort, sync: syncPort(), seed: await defaultSeed() })
	if (!store.currentFloor.value) await store.addFloor()
	// The seed lobby ships furnished; these tests need the plate to themselves.
	for (const floor of store.state.layout.floors) floor.objects = []
	return store
}

// The middle of the plate: the outer band is street, and the placement gate refuses geometry there.
function spot(store: ReturnType<typeof createBlueprintStore>): { x: number; y: number } {
	const canvas = store.state.layout.canvas
	return { x: Math.round(canvas.width / 2), y: Math.round(canvas.height / 2) }
}

function installOrigin(store: ReturnType<typeof createBlueprintStore>, id: string): AssetDef {
	const asset: AssetDef = {
		id,
		name: id,
		w: 2,
		h: 1,
		walkable: false,
		tags: ['bar'],
		interactSpots: [{ x: 25, y: 25 }],
		interact: { capacity: 2, durationMin: 1, durationMax: 2 },
	}
	store.state.assetRegistry.push(asset)
	return asset
}

test('a workspace survives export, file, parse and import with its fields intact', async () => {
	const store = await freshStore()
	installOrigin(store, 'round-trip-bar')
	const placed = await store.addObject('round-trip-bar', spot(store).x, spot(store).y)
	assert.ok(placed, 'the fixture was not placed before the export')
	await store.updateNpcConfig({
		speed: 0.4,
		defaultRoleId: 'guest',
		roles: [
			{ id: 'guest', label: 'Guest', color: '#fff', focusTags: ['bar'], restrictedTags: [], taskIds: [], focusChance: 100 },
			{ id: 'desk', label: 'Desk', color: '#000', focusTags: [], restrictedTags: [], taskIds: ['duty'], focusChance: 0 },
		],
		tasks: [{ id: 'duty', label: 'Duty', tags: ['front-desk'] }],
		pool: [{ roleId: 'guest', count: 4 }, { roleId: 'desk', count: 2 }],
	} as unknown as NpcSimulationConfig)

	const exported = store.exportWorkspace()
	const reread = parseWorkspace(serializeWorkspace(exported))
	assert.equal(await store.importWorkspace(reread), true, 'the import did not save')

	const again = store.exportWorkspace()
	// The file carries placement, never size: w/h come back through the origin asset on load, which the
	// state assertion below checks. Comparing sizes here would compare two absences.
	const printed = (file: typeof exported) => file.layout.floors.map(floor => ({
		id: floor.id,
		objects: floor.objects.map(object => ({ type: object.type, x: object.x, y: object.y, rotation: object.rotation })),
	}))
	assert.deepEqual(printed(again), printed(exported), 'the placement did not survive a round trip')
	// w/h are derived on load and never written to the file: the state must come back sized, or every
	// overlap gate reads false against unsized objects.
	assert.ok(
		store.state.layout.floors.every(floor => floor.objects.every(object => object.w > 0 && object.h > 0)),
		'an imported object came back with no size',
	)
	assert.ok(again.layout.floors.every(floor => floor.objects.every(object => object.x > 0 && object.y > 0)))
	const config = store.state.layout.npcConfig as unknown as NpcSimulationConfig
	assert.deepEqual(config.roles.map(role => role.id), ['guest', 'desk'], 'the deployment did not survive')
	assert.equal(config.pool.find(entry => entry.roleId === 'desk')?.count, 2)
	assert.ok(again.originAssets.some(asset => asset.id === 'round-trip-bar'), 'the origin asset was dropped')
})

test('import repairs a current floor the file does not contain, so the workspace stays authorable', async () => {
	const store = await freshStore()
	installOrigin(store, 'repair-bar')
	const file = store.exportWorkspace()
	store.state.currentFloorId = 'floor-that-does-not-exist'

	assert.equal(await store.importWorkspace(file), true)
	assert.equal(store.state.currentFloorId, file.layout.floors[0].id, 'the stale floor id survived the import')
	assert.ok(store.currentFloor.value, 'no floor is current, so nothing can be placed or painted')
	assert.ok(await store.addObject('repair-bar', spot(store).x, spot(store).y), 'a cold import refused a placement')
})

test('import drops a selection that no longer points at anything', async () => {
	const store = await freshStore()
	const asset = installOrigin(store, 'select-bar')
	const placed = await store.addObject('select-bar', spot(store).x, spot(store).y)
	assert.ok(placed)
	store.state.selectedAssetId = asset.id
	assert.ok(store.state.selectionState.items.length, 'the placement did not select anything to begin with')

	// Import a file with no objects at all: the old ids cannot exist afterwards.
	const empty = store.exportWorkspace()
	for (const floor of empty.layout.floors) floor.objects = []
	await store.importWorkspace(empty)
	assert.deepEqual(store.state.selectionState.items, [], 'a stale selection survived the import')
	assert.equal(store.state.selectedAssetId, null, 'a selected asset survived the import')
})

test('ingress refuses every workspace the import would otherwise have to shorten', async () => {
	const store = await freshStore()
	installOrigin(store, 'ghost-bar')
	assert.ok(await store.addObject('ghost-bar', spot(store).x, spot(store).y))
	const base = store.exportWorkspace()
	// `importWorkspace` counts what the load path dropped and warns about it, but the schema gate runs
	// first and is strict enough that nothing reaches that accounting. Pinned as a set: if a future
	// ingress loosening lets one of these through, this test flips and the silent-shortening becomes
	// visible instead of a warning nobody has ever seen fire.
	const hostile: [string, (file: typeof base) => void][] = [
		['an object whose origin asset is gone', file => { file.originAssets = file.originAssets.filter(asset => asset.id !== 'ghost-bar') }],
		['an object of an unknown type', file => { (file.layout.floors[0].objects[0] as { type: string }).type = 'not-an-asset' }],
		['a placement that is not a number', file => { (file.layout.floors[0].objects[0] as unknown as { x: unknown }).x = 'abc' }],
		['a deployment entry for a role that does not exist', file => { file.npcConfig.pool.push({ roleId: 'role-nobody-deployed', count: 3 } as never) }],
		['a deployment count past the ceiling', file => { file.npcConfig.pool[0].count = 5000 }],
		['a role with no colour', file => { delete (file.npcConfig.roles[0] as unknown as Record<string, unknown>).color }],
		['a role chance out of range', file => { (file.npcConfig.roles[0] as unknown as { focusChance: number }).focusChance = 150 }],
		['a task with an empty label', file => { (file.npcConfig.tasks[0] as unknown as { label: string }).label = '' }],
		['a name longer than the schema allows', file => { (file.npcConfig.roles[0] as unknown as { label: string }).label = 'x'.repeat(4000) }],
	]
	for (const [label, mutate] of hostile) {
		const file = structuredClone(base)
		mutate(file)
		toast.toasts.value = []
		await assert.rejects(() => store.importWorkspace(file), `import accepted ${label}`)
		assert.equal(toast.toasts.value.length, 0, `${label} was imported with a loss warning`)
	}
	// And the workspace is untouched by the refusals.
	assert.equal(store.state.layout.floors[0].objects.length, 1)
})

test('an object whose origin asset is gone is a refused file, not a silent loss', async () => {
	const store = await freshStore()
	installOrigin(store, 'ghost-bar')
	assert.ok(await store.addObject('ghost-bar', spot(store).x, spot(store).y))
	const file = store.exportWorkspace()
	file.originAssets = file.originAssets.filter(asset => asset.id !== 'ghost-bar')
	toast.toasts.value = []

	// Ingress is strict here, which is the safer half of the round trip: a workspace that would lose a
	// placed object on load is rejected outright instead of quietly arriving shorter.
	await assert.rejects(() => store.importWorkspace(file), /invalid/i)
	assert.equal(store.state.layout.floors[0].objects.length, 1, 'the refused import still emptied the floor')
	assert.equal(toast.toasts.value.length, 0)
})

test('a failed save is not swallowed by the import', async () => {
	const store = await freshStore()
	installOrigin(store, 'nosave-bar')
	const file = store.exportWorkspace()
	lastPort.ok = false
	// The store's own save throws on failure and `importWorkspace` does not catch it, so the caller
	// hears about a workspace that was never persisted instead of being told it imported cleanly.
	await assert.rejects(() => store.importWorkspace(file), /Persistence save returned failure/)
})

test('parseWorkspace refuses junk instead of half-loading it', () => {
	assert.throws(() => parseWorkspace('not json'), /not valid JSON/)
	assert.throws(() => parseWorkspace('{}'), /invalid/i)
	assert.throws(() => parseWorkspace('[]'), /invalid/i)
})

test('the synced payload carries the fields the engine reads, and refuses a version it cannot map', async () => {
	const store = await freshStore()
	const asset = installOrigin(store, 'synced-bar')
	await store.addObject('synced-bar', spot(store).x, spot(store).y)
	const layout = store.state.layout
	const assetMap = new Map<string, typeof asset>([[asset.id, asset]])

	const payload = buildSyncedPayload(layout, assetMap, layout.npcConfig as unknown as NpcSimulationConfig)
	assert.ok(payload, 'a workspace with one floor and one object built no payload')
	const loaded = loadSyncedPayload(payload)
	assert.equal(loaded.canvas.tileSize, layout.canvas.tileSize)
	assert.equal(loaded.canvas.streetTiles ?? layout.streetWidthTiles, layout.streetWidthTiles ?? 5)
	assert.ok(loaded.floors.length >= 1)
	const object = loaded.floors.flatMap(floor => floor.objects)
	assert.equal(object.length, 1, 'the placement did not survive the sync boundary')
	assert.ok(object[0].w > 0 && object[0].h > 0, 'the loaded object has no size')

	// The version is the only thing that tells the runtime how to read the shape.
	assert.throws(() => loadSyncedPayload({ ...payload, version: payload.version - 1 }), /Unsupported synced payload version/)
})

test('a synced canvas never points at a street floor the payload does not carry', () => {
	const payload = {
		version: 3,
		canvas: { width: 100, height: 100, tileSize: 25, streetWidthTiles: 5, streetFloorId: 'GHOST' },
		floors: { G: { objects: [] } },
	}
	const loaded = loadSyncedPayload(payload as never)
	assert.equal(loaded.canvas.streetFloorId, undefined, 'a dangling street floor id was carried into the runtime')
})

test('a degenerate placement in a payload is dropped without taking the floor with it', () => {
	const payload = {
		version: 3,
		canvas: { width: 100, height: 100, tileSize: 25 },
		floors: { G: { objects: [{ id: 'ok', type: 'a', x: 1, y: 1, w: 1, h: 1, rotation: 0 }, { id: '', type: 'b', x: 5, y: 5, w: 1, h: 1, rotation: 0 }] } },
	}
	const loaded = loadSyncedPayload(payload as never)
	assert.equal(loaded.floors.length, 1)
	assert.deepEqual(loaded.floors[0].objects.map(object => object.id), ['ok'], 'the bad object was not the only one filtered')
})

test('sync keys are a function of floor identity, so a reorder cannot renumber the game world', () => {
	const floors = [{ id: 'b-floor', label: 'F2' }, { id: 'a-floor', label: 'G' }]
	const forward = assignSyncKeys(floors)
	const reversed = assignSyncKeys([...floors].reverse())
	for (const floor of floors) {
		assert.equal(forward.get(floor.id), reversed.get(floor.id), `${floor.id} changed key when the list was reordered`)
	}
	assert.equal(forward.get('a-floor'), 'G', 'label G is the ground floor regardless of its id')
	assert.equal(forward.get('b-floor'), '2')

	// The named floors take their key from the label, so only an unlabelled floor can expose the
	// fallback: it is keyed by its place in the id order, never by where the editor happens to list it.
	const unlabelled = [{ id: 'zz', label: 'Lobby' }, { id: 'aa', label: 'Café' }]
	const forwardKeys = assignSyncKeys(unlabelled)
	const reversedKeys = assignSyncKeys([...unlabelled].reverse())
	for (const floor of unlabelled) {
		assert.equal(forwardKeys.get(floor.id), reversedKeys.get(floor.id), `${floor.id} was keyed by list position`)
	}
	// F0 is the ground floor by another name; a numeric '0' would sort after 'G' and strand spawns.
	assert.equal(assignSyncKeys([{ id: 'f0', label: 'F0' }]).get('f0'), 'G')
})
