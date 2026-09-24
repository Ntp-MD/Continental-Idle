import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	createBlueprintStore,
	type BlueprintStore, type PersistencePort, type SyncPort,
} from '../../src/blueprint-editor/store/index'
import { defaultSeed } from '../../src/blueprint-editor/store/seed'
import { cloneDeepRaw } from '../../src/blueprint-editor/store/storeUtils'
import { resolveBuildingArea, assetSizeFor, roundedRectPath } from '../../src/blueprint-editor/domain/geometry'
import { resolveFloorTileStates } from '../../src/blueprint-editor/domain/types'
import type { AssetDef, BlueprintDataFile, FloorData, FloorWalkable, ObjectData } from '../../src/blueprint-editor/domain/types'

// ── Harness: in-memory ports + state snapshot/restore ──
const persistence: PersistencePort = {
	async load() { return null },
	async save() { return true },
}
const sync: SyncPort = { emit() {} }

const store: BlueprintStore = createBlueprintStore({ persistence, sync, seed: await defaultSeed() })
const state = store.state
const {
	addFloor, deleteFloor, duplicateFloor, paintFloorTiles,
	addObject, deleteSelected, moveSelectedTo, rotateSelected,
	linkObjects, unlinkObject,
	copySelected, pasteObjects, removeTag, clamp, setStreetWidth,
	addSvgAsset, resizeCanvas, flattenToSvgAsset, deleteAsset, deleteAllAssets,
	importWorkspace,
} = store

function snapshot() {
	return {
		layout: cloneDeepRaw(state.layout),
		assetRegistry: cloneDeepRaw(state.assetRegistry),
		tagDefinitions: cloneDeepRaw(state.tagDefinitions),
		currentFloorId: state.currentFloorId,
	}
}
type Snap = ReturnType<typeof snapshot>

function restore(base: Snap): void {
	state.layout = cloneDeepRaw(base.layout)
	state.assetRegistry = cloneDeepRaw(base.assetRegistry)
	state.tagDefinitions = cloneDeepRaw(base.tagDefinitions)
	state.currentFloorId = base.currentFloorId
	state.selectionState = { primary: null, items: [] }
}

function installTestAsset(): AssetDef {
	const asset: AssetDef = { id: 'grill-asset', name: 'Grill', w: 2, h: 2, walkable: false, defaultFillColor: '#ffffff' }
	state.assetRegistry.push(asset)
	return asset
}

function makeObject(id: string, x: number, y: number, extra: Partial<ObjectData> = {}): ObjectData {
	return { id, type: 'grill-asset', x, y, w: 50, h: 50, rotation: 0, ...extra }
}

function resetWalkable(floor: FloorData): void {
	floor.walkable = undefined
}

function walkableOf(floor: FloorData): FloorWalkable | undefined {
	return floor.walkable
}

function selectObjects(ids: string[]): void {
	state.selectionState = {
		primary: { type: 'object', id: ids[0] },
		items: ids.map(id => ({ type: 'object' as const, id })),
	}
}

const baseline = snapshot()

// ── A. Street width: object bounds must follow the drawn building area ──
test('street-width: clamp() respects layout.streetWidthTiles', () => {
	restore(baseline)
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	state.layout.streetWidthTiles = 12
	const area = resolveBuildingArea(state.layout)
	const result = clamp({ x: area.x - 50, y: area.y - 50, w: 25, h: 25 })
	assert.equal(result.x, area.x, 'x clamps to the 12-tile building inset (300), not the fixed 8-tile default (200)')
	assert.equal(result.y, area.y, 'y clamps to the 12-tile building inset (300)')
})

test('street-width: moveSelectedTo() keeps objects inside the drawn building area', () => {
	restore(baseline)
	installTestAsset()
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	state.layout.streetWidthTiles = 12
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('move-me', 500, 500)]
	state.currentFloorId = floor.id
	selectObjects(['move-me'])
	moveSelectedTo(250, 250)
	const moved = floor.objects[0]
	assert.ok(moved.x >= 300, `object x stayed at ${moved.x}; expected >= 300 (street inset)`)
	assert.ok(moved.y >= 300, `object y stayed at ${moved.y}; expected >= 300 (street inset)`)
})

test('caps: resizeCanvas() rejects a grid past the tile cap and keeps the canvas', async () => {
	restore(baseline)
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const before = { ...state.layout.canvas }
	assert.equal(await resizeCanvas(100_000, 100_000, 25), false, 'over-cap resize is rejected')
	assert.deepEqual({ ...state.layout.canvas }, before, 'canvas is unchanged after the rejected resize')
})

test('caps: addSvgAsset() rejects an asset past the tile cap without registering it', async () => {
	restore(baseline)
	const svg = '<svg viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10"/></svg>'
	assert.equal(await addSvgAsset('Too Big', 300, 300, svg), null, 'over-cap asset is rejected')
	assert.equal(state.assetRegistry.some(a => a.name === 'Too Big'), false, 'nothing was registered')
	assert.ok(await addSvgAsset('Fits', 4, 4, svg), 'an asset within the cap still imports')
})

// ── B. Store CRUD regressions ──
test('deleteAsset() cascades placed instances including locked ones', async () => {
	restore(baseline)
	installTestAsset()
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('inst-a', 400, 400), makeObject('inst-b', 500, 500, { locked: true })]
	state.currentFloorId = floor.id
	assert.equal(await deleteAsset('grill-asset'), true)
	assert.equal(floor.objects.length, 0, 'every instance of the deleted asset is removed, locked included')
	assert.equal(state.assetRegistry.some(a => a.id === 'grill-asset'), false, 'asset leaves the palette')
	const assetIds = new Set(state.assetRegistry.map(a => a.id))
	assert.ok(
		state.layout.floors.every(f => f.objects.every(o => assetIds.has(o.type))),
		'no object references a deleted asset',
	)
})

test('deleteAsset() clears task posts that point at it', async () => {
	restore(baseline)
	installTestAsset()
	const npc = state.layout.npcConfig
	assert.ok(npc, 'baseline npc config with tasks is required')
	npc.tasks = [...npc.tasks, { id: 'grill-task', label: 'Grill task', tags: ['grilltag'], post: { assetId: 'grill-asset' } }]
	assert.equal(await deleteAsset('grill-asset'), true)
	assert.equal(npc.tasks.find(t => t.id === 'grill-task')?.post, undefined, 'post pointing at the deleted asset is cleared')
})

test('deleteAllAssets() purges the palette and every instance', async () => {
	restore(baseline)
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const floor = state.layout.floors[0]
	installTestAsset()
	floor.objects = [makeObject('purge-a', 100, 100), makeObject('purge-b', 200, 200)]
	state.currentFloorId = floor.id
	const before = state.assetRegistry.length
	assert.ok(before > 0, 'baseline palette is not empty')
	const deleted = await deleteAllAssets()
	assert.equal(deleted, before, 'returns the number of purged assets')
	assert.equal(state.assetRegistry.length, 0, 'palette is empty')
	assert.ok(
		state.layout.floors.every(f => f.objects.length === 0),
		'every floor is clear of objects',
	)
})
test('addObject rejects an overlapping placement', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	floor.objects = []
	state.currentFloorId = floor.id
	const first = await addObject('grill-asset', 400, 400)
	assert.ok(first, 'first placement succeeds')
	const second = await addObject('grill-asset', 400, 400)
	assert.equal(second, null, 'overlapping placement is rejected')
	assert.equal(floor.objects.length, 1, 'floor keeps exactly one object')
})

test('rotateSelected() rotates rx corners and swaps w/h', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	const o = makeObject('rot', 400, 400, { w: 100, h: 50, rx: { tl: 1, tr: 2, br: 3, bl: 4 } })
	floor.objects = [o]
	state.currentFloorId = floor.id
	selectObjects(['rot'])
	await rotateSelected()
	assert.equal(o.rotation, 90)
	assert.equal(o.w, 50, 'w becomes previous h')
	assert.equal(o.h, 100, 'h becomes previous w')
	assert.deepEqual(o.rx, { tl: 4, tr: 1, br: 2, bl: 3 }, 'rx rotates clockwise')
})

test('rotateSelected() refuses a rotation that would overlap', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	const a = makeObject('ra', 400, 400)
	const b = makeObject('rb', 425, 425)
	floor.objects = [a, b]
	state.currentFloorId = floor.id
	selectObjects(['ra'])
	await rotateSelected()
	assert.equal(a.rotation, 0, 'rotation is unchanged when it would overlap')
})

test('link then unlink dissolves a group smaller than 2', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	const a = makeObject('la', 100, 100)
	const b = makeObject('lb', 200, 200)
	floor.objects = [a, b]
	state.currentFloorId = floor.id
	assert.equal(await linkObjects(['la', 'lb']), true)
	assert.ok(a.linkGroupId && a.linkGroupId === b.linkGroupId, 'both share one link group')
	assert.equal(await unlinkObject('la'), true)
	assert.equal(a.linkGroupId, undefined, 'unlinked object loses its group')
	assert.equal(b.linkGroupId, undefined, 'a group of one is dissolved')
})

test('deleteSelected() skips locked objects and keeps them', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	const a = makeObject('da', 100, 100)
	const b = makeObject('db', 300, 300, { locked: true })
	floor.objects = [a, b]
	state.currentFloorId = floor.id
	selectObjects(['da', 'db'])
	await deleteSelected()
	assert.equal(floor.objects.length, 1, 'only the unlocked object is removed')
	assert.equal(floor.objects[0].id, 'db', 'locked object survives')
})

test('duplicateFloor() remaps ids and link groups', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('o1', 100, 100, { linkGroupId: 'g1' }), makeObject('o2', 200, 200, { linkGroupId: 'g1' })]
	state.currentFloorId = floor.id
	const sourceIndex = state.layout.floors.indexOf(floor)
	await duplicateFloor(floor.id)
	const copy = state.layout.floors[sourceIndex + 1]
	assert.ok(copy, 'copy is inserted right after the source')
	assert.notEqual(copy.id, floor.id)
	assert.ok(copy.objects.every(o => !['o1', 'o2'].includes(o.id)), 'object ids are remapped')
	const groups = new Set(copy.objects.map(o => o.linkGroupId))
	assert.equal(groups.size, 1, 'copied pair shares ONE new group')
	assert.ok(!groups.has('g1'), 'group id is remapped')
})

test('deleteFloor() clears streetFloorId and switches the current floor', async () => {
	restore(baseline)
	if (state.layout.floors.length < 2) await addFloor()
	const victim = state.layout.floors[state.layout.floors.length - 1]
	state.layout.streetFloorId = victim.id
	state.currentFloorId = victim.id
	const remainingBefore = state.layout.floors.length
	assert.equal(await deleteFloor(victim.id), true)
	assert.equal(state.layout.floors.length, remainingBefore - 1)
	assert.equal(state.layout.streetFloorId, undefined, 'dangling streetFloorId is cleared')
	assert.notEqual(state.currentFloorId, victim.id, 'current floor falls back to a surviving floor')
})

test('addFloor() picks a label that is not already used', async () => {
	restore(baseline)
	const before = state.layout.floors.length
	const labels = new Set(state.layout.floors.map(f => f.label))
	const floor = await addFloor()
	assert.ok(floor, 'floor is created')
	assert.equal(state.layout.floors.length, before + 1)
	assert.ok(!labels.has(floor.label), `new label "${floor.label}" was already taken`)
})

test('renameFloor()/updateFloor() reject a blank name or label instead of breaking every later save', async () => {
	restore(baseline)
	const floor = state.layout.floors[0]
	const originalName = floor.name
	assert.equal(await store.renameFloor(floor.id, '   '), false, 'a blank rename is refused')
	assert.equal(floor.name, originalName, 'a blank rename leaves the name untouched')
	assert.equal(await store.renameFloor(floor.id, '  Lobby  '), true, 'a rename with padding succeeds')
	assert.equal(floor.name, 'Lobby', 'the stored name is trimmed')
	assert.equal(await store.updateFloor(floor.id, { label: '' }), false, 'a blank label is refused')
	assert.notEqual(floor.label, '', 'a blank label leaves the label untouched')
})

test('removeTag() cascades into assets, roles, tasks and trigger rates', async () => {
	restore(baseline)
	const tag = 'grilltag'
	const npc = state.layout.npcConfig
	assert.ok(npc && npc.roles.length > 0, 'baseline npc config with a role is required')
	state.tagDefinitions.push({ id: tag, label: tag })
	const asset = installTestAsset()
	asset.tags = [tag]
	npc.roles[0].focusTags = [...npc.roles[0].focusTags, tag]
	npc.tasks.push({ id: 'grill-task', label: 'Grill task', tags: [tag] })
	npc.tagTriggerRates = { ...(npc.tagTriggerRates ?? {}), [tag]: 5 }
	assert.equal(await removeTag(tag), true)
	assert.ok(!state.tagDefinitions.some(t => t.id === tag), 'definition removed')
	assert.ok(!(asset.tags ?? []).includes(tag), 'asset reference removed')
	assert.ok(!npc.roles[0].focusTags.includes(tag), 'role reference removed')
	assert.ok(!(npc.tasks.find(t => t.id === 'grill-task')?.tags ?? []).includes(tag), 'task reference removed')
	assert.equal(npc.tagTriggerRates?.[tag], undefined, 'trigger rate removed')
})

test('flattenToSvgAsset() merges into a walkable asset by default', async () => {
	restore(baseline)
	installTestAsset()
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('fa', 300, 300), makeObject('fb', 350, 300)]
	state.currentFloorId = floor.id
	selectObjects(['fa', 'fb'])
	const assetId = await flattenToSvgAsset('Merged')
	assert.ok(assetId, 'flatten returns the new asset id')
	const asset = state.assetRegistry.find(a => a.id === assetId)
	assert.ok(asset, 'the merged asset is registered')
	assert.equal(asset.walkable, true, 'the merged asset defaults to walkable')
	assert.ok(asset.walkableGrid?.every(row => row.every(cell => cell)), 'every merged grid cell is walkable')
	assert.ok(asset.tileStates?.every(row => row.every(cell => cell === 'walkable')), 'merged tile states are walkable')
})

test('copySelected()/pasteObjects() offsets a single-tile copy and gives it a new id', async () => {
	restore(baseline)
	installTestAsset()
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const floor = state.layout.floors[0]
	const source = makeObject('src', 400, 400, { w: 25, h: 25 })
	floor.objects = [source]
	state.currentFloorId = floor.id
	selectObjects(['src'])
	await copySelected()
	await pasteObjects()
	assert.equal(floor.objects.length, 2, 'a copy is pasted')
	const pasted = floor.objects[1]
	assert.notEqual(pasted.id, source.id)
	assert.equal(pasted.x, 425, 'copy is offset by one tile')
	assert.equal(pasted.y, 425)
})

// ── C. Tile pipeline ──
test('resolveFloorTileStates() falls back to defaultWalkable', () => {
	const grid = resolveFloorTileStates({ defaultWalkable: false }, 2, 3)
	assert.deepEqual(grid, [
		['blocked', 'blocked', 'blocked'],
		['blocked', 'blocked', 'blocked'],
	])
})

test('paintFloorTiles() paints the interior and protects the street ring', async () => {
	restore(baseline)
	state.layout.canvas = { width: 800, height: 600, tileSize: 25 }
	state.layout.streetWidthTiles = 8
	const floor = state.layout.floors[0]
	resetWalkable(floor)
	assert.equal(await paintFloorTiles(floor.id, 'blocked', { row0: 12, col0: 12, row1: 12, col1: 12 }), true)
	const walkable = walkableOf(floor)
	const states = walkable?.tileStates
	assert.ok(states, 'tile states written')
	assert.equal(states[12][12], 'blocked', 'interior cell is painted')
	assert.equal(states[0][0], 'walkable', 'street ring stays walkable')
	assert.equal(walkable?.walkableGrid?.[12][12], false, 'walkable grid mirrors tile states')
	assert.equal(walkable?.walkableGrid?.[0][0], true)
})

// ── D. Geometry helpers ──
test('assetSizeFor() swaps w/h on 90/270 rotations', () => {
	restore(baseline)
	const asset: AssetDef = { id: 'geo', name: 'Geo', w: 2, h: 1 }
	state.assetRegistry.push(asset)
	assert.deepEqual(assetSizeFor('geo', 0, 25, state.assetRegistry), { w: 50, h: 25 })
	assert.deepEqual(assetSizeFor('geo', 90, 25, state.assetRegistry), { w: 25, h: 50 })
	assert.deepEqual(assetSizeFor('geo', 270, 25, state.assetRegistry), { w: 25, h: 50 })
})

test('resolveBuildingArea() never returns a negative size when the ring exceeds the canvas', () => {
	const area = resolveBuildingArea({ canvas: { width: 100, height: 100, tileSize: 25 }, streetWidthTiles: 8 })
	assert.equal(area.w, 0)
	assert.equal(area.h, 0)
})

test('roundedRectPath() clamps radii to half the shorter side', () => {
	const path = roundedRectPath(0, 0, 10, 10, { tl: 100, tr: 0, br: 0, bl: 0 })
	assert.ok(path?.startsWith('M 5 0'), `expected clamped radius 5, got "${path}"`)
	assert.equal(roundedRectPath(0, 0, 10, 10, { tl: 0, tr: 0, br: 0, bl: 0 }), null)
})

test('importWorkspace() replaces layout, assets and tags', async () => {
	restore(baseline)
	installTestAsset()
	state.layout.floors[0].name = 'Imported floor'
	state.tagDefinitions = [...state.tagDefinitions, { id: 'imported', label: 'imported' }]
	const exported = store.exportWorkspace()
	restore(baseline)
	assert.notEqual(state.layout.floors[0].name, 'Imported floor', 'state was reset before the import')
	assert.equal(await importWorkspace(exported), true, 'import saves successfully')
	assert.ok(state.assetRegistry.some(a => a.id === 'grill-asset'), 'imported asset is registered')
	assert.equal(state.layout.floors[0].name, 'Imported floor', 'imported layout is applied')
	assert.ok(state.tagDefinitions.some(t => t.id === 'imported'), 'imported tags are applied')
	assert.equal(state.selectedAssetId, null, 'selection is cleared after import')
})

// ── E. Concurrency ───
test('overlapping commands queue instead of rejecting (single-writer)', async () => {
	restore(baseline)
	installTestAsset()
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	state.layout.streetWidthTiles = 8
	const floor = state.layout.floors[0]
	floor.objects = []
	state.currentFloorId = floor.id
	const [first, second] = await Promise.all([
		addObject('grill-asset', 400, 400),
		addObject('grill-asset', 500, 500),
	])
	assert.ok(first, 'first queued placement lands')
	assert.ok(second, 'second queued placement lands - the store queues writes instead of rejecting with "Operation in progress"')
	assert.equal(floor.objects.length, 2, 'both placements are on the floor')
})

test('serialization: the first save payload excludes a concurrently started command', async () => {
	const seen: BlueprintDataFile[] = []
	let releaseFirst: (() => void) | null = null
	let saveCount = 0
	const slowPort: PersistencePort = {
		async load() { return null },
		async save(data) {
			saveCount++
			seen.push(cloneDeepRaw(data))
			if (saveCount === 1) await new Promise<void>(resolve => { releaseFirst = resolve })
			return true
		},
	}
	const local = createBlueprintStore({ persistence: slowPort, sync, seed: await defaultSeed() })
	const initialCount = local.state.layout.floors.length
	const target = local.state.layout.floors[0]
	const addPromise = local.addFloor()
	const renamePromise = local.renameFloor(target.id, 'RENAMED-CONCURRENT')
	await new Promise(resolve => setTimeout(resolve, 0))
	assert.ok(releaseFirst, 'the first save is in flight before the second command runs')
	;(releaseFirst as (() => void) | null)?.()
	assert.ok(await addPromise, 'addFloor resolves')
	await renamePromise
	assert.equal(seen.length, 2, 'both commands reach the port')
	assert.equal(seen[0].layout.floors.length, initialCount + 1, 'the first payload has only the add')
	assert.notEqual(seen[0].layout.floors[0].name, 'RENAMED-CONCURRENT', 'the concurrent rename is invisible to the first save')
	assert.equal(seen[1].layout.floors[0].name, 'RENAMED-CONCURRENT', 'the second payload carries the rename')
})

test('deadlock guard: a burst of mixed mutating commands all settle', async () => {
	const burstPort: PersistencePort = {
		async load() { return null },
		async save() { await new Promise(resolve => setTimeout(resolve, 0)); return true },
	}
	const local = createBlueprintStore({ persistence: burstPort, sync, seed: await defaultSeed() })
	const floorId = local.state.layout.floors[0].id
	const ops: Promise<unknown>[] = []
	for (let i = 0; i < 5; i++) {
		ops.push(local.addFloor())
		ops.push(local.setCanvasBgColor('#112233'))
		ops.push(local.addTag(`bursttag${i}`))
		ops.push(local.paintFloorTiles(floorId, 'blocked', { row0: 1, col0: 1, row1: 1, col1: 1 }))
	}
	const outcome = await Promise.race([
		Promise.all(ops).then(() => 'settled' as const),
		new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 5000)),
	])
	assert.equal(outcome, 'settled', 'every queued command resolves - the exclusive queue never nests into a deadlock')
})

// ── F. Informational probes (open questions, no pass/fail) ──
test('probe: brush over the street ring (informational, never asserts)', async () => {
	try {
		restore(baseline)
		state.layout.canvas = { width: 800, height: 600, tileSize: 25 }
		state.layout.streetWidthTiles = 8
		const floor = state.layout.floors[0]
		resetWalkable(floor)
		await paintFloorTiles(floor.id, 'blocked', { row0: 0, col0: 0, row1: 0, col1: 0 })
		const streetCell = walkableOf(floor)?.tileStates?.[0]?.[0]
		console.log(`  note  brush over the street ring yields "${streetCell}" (force order: street->walkable then brush)`)
	} catch (error) {
		console.log(`  note  street-override probe errored: ${(error as Error).message}`)
	}
})

test('pasteObjects() offsets by the selection bounds, so a multi-tile copy never overlaps its source', async () => {
	restore(baseline)
	installTestAsset()
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const floor = state.layout.floors[0]
	const source = makeObject('probe', 400, 400, { w: 50, h: 50 })
	floor.objects = [source]
	state.currentFloorId = floor.id
	selectObjects(['probe'])
	await copySelected()
	await pasteObjects()
	assert.equal(floor.objects.length, 2, 'a 2-tile-wide copy is pasted, not rejected as an overlap')
	const pasted = floor.objects[1]
	assert.equal(pasted.x, 450, 'copy clears the source width, not a fixed one tile')
	assert.equal(pasted.y, 450, 'copy clears the source height')
})

test('undo() restores a deleted asset and its placed instances', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	state.currentFloorId = floor.id
	const placed = await addObject('grill-asset', 400, 400)
	assert.ok(placed, 'object placed before delete')
	assert.equal(await deleteAsset('grill-asset'), true)
	assert.ok(!state.layout.floors[0].objects.some(o => o.id === placed.id), 'instance gone after delete')
	assert.equal(await store.undo(), true, 'undo applies')
	assert.ok(state.assetRegistry.some(a => a.id === 'grill-asset'), 'asset restored')
	assert.ok(state.layout.floors[0].objects.some(o => o.id === placed.id), 'placed instance restored')
})

test('undo() depth caps at 4 steps', async () => {
	restore(baseline)
	const seedFloors = state.layout.floors.length
	for (let i = 0; i < 6; i++) await addFloor()
	assert.equal(state.layout.floors.length, seedFloors + 6, 'six floors added')
	for (let i = 0; i < 4; i++) assert.equal(await store.undo(), true, `undo step ${i + 1} applies`)
	assert.equal(state.layout.floors.length, seedFloors + 2, 'four undos rolled back four floors')
	assert.equal(await store.undo(), false, 'fifth undo refused - history capped at 4')
	assert.equal(state.layout.floors.length, seedFloors + 2, 'floors unchanged after refused undo')
	assert.equal(store.canUndo.value, false, 'canUndo is false at the cap')
})

test('no-op commands do not consume undo history', async () => {
	const local = createBlueprintStore({ persistence, sync, seed: await defaultSeed() })
	assert.equal(await local.setCanvasBgColor('#112233'), true, 'real mutation commits')
	assert.equal(await local.resizeCanvas(100_000, 100_000, 25), false, 'rejected resize mutates nothing')
	assert.equal(await local.undo(), true, 'undo applies')
	assert.notEqual(local.state.layout.canvas.bgColor, '#112233', 'one undo reached past the real mutation - the rejected command was never recorded')
})

test('save() prunes dangling npc references', async () => {
	restore(baseline)
	const npc = state.layout.npcConfig
	assert.ok(npc && npc.roles.length > 0, 'baseline npc config with a role is required')
	const roleId = npc.roles[0].id
	npc.pool = [...npc.pool, { roleId: 'role-ghost', count: 1 }, { roleId, count: 1, floorIds: ['floor-ghost'] }]
	npc.roles[0].taskIds = [...npc.roles[0].taskIds, 'task-ghost']
	assert.equal(await store.save(), true)
	assert.ok(npc.pool.every(e => e.roleId !== 'role-ghost'), 'pool entry for unknown role is dropped')
	assert.ok(npc.pool.every(e => !(e.floorIds ?? []).includes('floor-ghost')), 'dead floor ids are stripped from pool')
	assert.ok(!npc.roles[0].taskIds.includes('task-ghost'), 'dead task ids are stripped from roles')
})

test('save() strips renamed spot posts but keeps the asset binding', async () => {
	restore(baseline)
	const asset = installTestAsset()
	asset.interactSpots = [{ kind: 'stand', x: 1, y: 1, post: 'grill-post' }]
	const npc = state.layout.npcConfig
	assert.ok(npc, 'baseline npc config with tasks is required')
	npc.tasks = [...npc.tasks, { id: 'grill-task', label: 'Grill task', tags: ['grilltag'], post: { assetId: 'grill-asset', post: 'grill-post' } }]
	assert.equal(await store.save(), true)
	assert.deepEqual(npc.tasks.find(t => t.id === 'grill-task')?.post, { assetId: 'grill-asset', post: 'grill-post' }, 'live post name survives')
	asset.interactSpots = [{ kind: 'stand', x: 1, y: 1, post: 'renamed-post' }]
	assert.equal(await store.save(), true)
	assert.deepEqual(npc.tasks.find(t => t.id === 'grill-task')?.post, { assetId: 'grill-asset' }, 'dead post name stripped, asset binding kept')
})

test('addSpawnZone() creates a labeled zone from a rect', async () => {
	restore(baseline)
	const floor = state.layout.floors[0]
	const zone = await store.addSpawnZone(floor.id, { x: 100, y: 100, w: 200, h: 120 }, 'Dragged', ['role-guest'])
	assert.ok(zone, 'valid rect creates a zone')
	assert.equal(zone?.label, 'Dragged')
	assert.deepEqual(zone?.roleIds, ['role-guest'])
	assert.ok(floor.spawnZones?.some(z => z.id === zone?.id), 'zone persisted on the floor')
	assert.equal(await store.addSpawnZone(floor.id, { x: 0, y: 0, w: 0, h: 10 }), null, 'degenerate rect rejected')
	assert.equal(await store.addSpawnZone('floor-ghost', { x: 0, y: 0, w: 10, h: 10 }), null, 'unknown floor rejected')
})

test('reorderFloors() swaps floor order and keeps the current floor', async () => {
	restore(baseline)
	const added = await addFloor()
	assert.ok(added, 'second floor added')
	const firstId = state.layout.floors[0].id
	assert.equal(await store.reorderFloors(0, 1), true)
	assert.equal(state.layout.floors[1].id, firstId, 'floor moved to the new index')
	assert.equal(await store.reorderFloors(0, state.layout.floors.length + 3), false, 'out-of-range reorder rejected')
	assert.equal(await store.reorderFloors(1, 1), false, 'no-op reorder rejected')
})

test('duplicateAsset() copies the palette entry without touching instances', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('dup-a', 100, 100)]
	const copy = await store.duplicateAsset('grill-asset')
	assert.ok(copy, 'duplicate created')
	assert.notEqual(copy!.id, 'grill-asset', 'copy gets a fresh id')
	assert.equal(copy!.w, 2, 'copy keeps dimensions')
	assert.ok(floor.objects.every(o => o.type === 'grill-asset'), 'no instance retargeted to the copy')
	assert.equal(await store.duplicateAsset('asset-ghost'), null, 'unknown asset rejected')
})

test('updateAsset() re-derives drifted object sizes on any edit', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('ref-a', 100, 100, { w: 0, h: 0 })]
	await store.updateAsset('grill-asset', { name: 'Grill v2' })
	const expected = assetSizeFor('grill-asset', 0, state.layout.canvas.tileSize, new Map(state.assetRegistry.map(a => [a.id, a])))
	assert.deepEqual([floor.objects[0].w, floor.objects[0].h], [expected!.w, expected!.h], 'size restored from the live asset')
})

test('updateAsset() keeps explicit per-instance locks when the origin default changes', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	state.currentFloorId = floor.id
	floor.objects = [makeObject('lock-inherit', 100, 100), makeObject('lock-explicit', 300, 300)]
	await store.toggleObjectLock('lock-explicit')
	assert.equal(floor.objects[1].locked, true, 'explicit lock set on the instance')
	await store.updateAsset('grill-asset', { defaultLocked: false })
	assert.equal(floor.objects[0].locked, false, 'inheriting instance follows the new default')
	assert.equal(floor.objects[1].locked, true, 'explicitly locked instance survives the origin edit')
	await store.updateAsset('grill-asset', { defaultLocked: true })
	assert.equal(floor.objects[0].locked, true, 'inheriting instance follows the default back')
	assert.equal(floor.objects[1].locked, true, 'explicit lock still intact')
})

test('updateAsset() preserves per-instance color overrides', async () => {
	restore(baseline)
	installTestAsset()
	const floor = state.layout.floors[0]
	floor.objects = [makeObject('col-a', 100, 100, { fillColor: '#112233', strokeColor: '#445566' })]
	await store.updateAsset('grill-asset', { name: 'Grill v2' })
	assert.equal(floor.objects[0].fillColor, '#112233', 'fill override survives the origin edit')
	assert.equal(floor.objects[0].strokeColor, '#445566', 'stroke override survives the origin edit')
})

test('updateAsset() re-resolves every placed instance on any edit', async () => {
	restore(baseline)
	const asset = installTestAsset()
	asset.defaultLabel = 'Grill Label'
	asset.defaultRadius = 5
	const floor = state.layout.floors[0]
	state.currentFloorId = floor.id
	floor.objects = [makeObject('heal-a', 100, 100, { locked: true, fillColor: '#112233' })]
	const obj = floor.objects[0]
	obj.label = 'Stale'
	obj.radius = 999
	await store.updateAsset('grill-asset', { name: 'Grill v2' })
	assert.equal(asset.name, 'Grill v2', 'unrelated edit applied to the origin')
	assert.equal(obj.label, 'Grill Label', 'drifted label healed despite the unrelated patch')
	assert.equal(obj.radius, 5, 'drifted radius healed despite the unrelated patch')
	assert.equal(obj.locked, true, 'explicit lock preserved')
	assert.equal(obj.fillColor, '#112233', 'fill override preserved')
})

test('reorderAssets() moves palette entries and rejects out-of-range moves', async () => {
	restore(baseline)
	const base = state.assetRegistry.length
	state.assetRegistry.push(
		{ id: 'ra-1', name: 'One', w: 1, h: 1 },
		{ id: 'ra-2', name: 'Two', w: 1, h: 1 },
		{ id: 'ra-3', name: 'Three', w: 1, h: 1 },
	)
	const ids = () => state.assetRegistry.slice(base).map(a => a.id)
	assert.equal(await store.reorderAssets(base, base + 2), true)
	assert.deepEqual(ids(), ['ra-2', 'ra-3', 'ra-1'], 'first entry moved to the end')
	assert.equal(await store.reorderAssets(base + 2, base), true)
	assert.deepEqual(ids(), ['ra-1', 'ra-2', 'ra-3'], 'last entry moved back to the front')
	assert.equal(await store.reorderAssets(base, base), false, 'no-op move rejected')
	assert.equal(await store.reorderAssets(-1, base), false, 'negative index rejected')
	assert.equal(await store.reorderAssets(base, base + 3), false, 'past-the-end index rejected')
	assert.deepEqual(ids(), ['ra-1', 'ra-2', 'ra-3'], 'rejected moves leave the order untouched')
})

test('deleteFloor() drops pool references to the removed floor', async () => {
	restore(baseline)
	const npc = state.layout.npcConfig
	assert.ok(npc && npc.roles.length > 0, 'baseline npc config with a role is required')
	const added = await addFloor()
	assert.ok(added, 'second floor added')
	npc.pool = [...npc.pool, { roleId: npc.roles[0].id, count: 1, floorIds: [added.id] }]
	assert.equal(await deleteFloor(added.id), true)
	assert.ok(npc.pool.every(e => !(e.floorIds ?? []).includes(added.id)), 'removed floor id is gone from pool')
})

test('setStreetWidth() repaints the street ring walkable', async () => {
	restore(baseline)
	state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
	const floor = state.layout.floors[0]
	resetWalkable(floor)
	await paintFloorTiles(floor.id, 'blocked', { row0: 0, col0: 0, row1: 11, col1: 11 })
	assert.equal(floor.walkable?.tileStates?.[10]?.[10], 'blocked', 'interior cell painted before width change')
	assert.equal(await setStreetWidth(12), true)
	assert.equal(floor.walkable?.tileStates?.[10]?.[10], 'walkable', 'new ring cell forced walkable after width change')
	assert.equal(state.layout.streetWidthTiles, 12)
})

test('removeTag() strips spot posts in the same namespace', async () => {
	restore(baseline)
	const asset = installTestAsset()
	asset.interactSpots = [{ kind: 'stand', x: 1, y: 1, post: 'grill-post' }]
	state.tagDefinitions.push({ id: 'grill-post', label: 'grill-post' })
	assert.equal(await removeTag('grill-post'), true)
	assert.equal(asset.interactSpots?.[0]?.post, undefined, 'orphaned spot post removed, spot kept')
})

test('save() prunes trigger rates for unused tags', async () => {
	restore(baseline)
	const npc = state.layout.npcConfig
	assert.ok(npc && npc.roles.length > 0, 'baseline npc config with a role is required')
	npc.roles[0].focusTags = [...npc.roles[0].focusTags, 'used-tag']
	npc.tagTriggerRates = { 'used-tag': 50, 'ghost-tag': 10 }
	assert.equal(await store.save(), true)
	assert.deepEqual(Object.keys(npc.tagTriggerRates ?? {}), ['used-tag'], 'only referenced rates survive')
})

test('save() strips the dead spawnRule.count field', async () => {
	restore(baseline)
	const npc = state.layout.npcConfig
	assert.ok(npc && npc.roles.length > 0, 'baseline npc config with a role is required')
	npc.roles[0].spawnRule = { targetTags: [], count: 0 }
	assert.equal(await store.save(), true)
	assert.equal(npc.roles[0].spawnRule?.count, undefined, 'engine-ignored count is removed')
	assert.deepEqual(npc.roles[0].spawnRule?.targetTags, [], 'live targetTags survive')
})
