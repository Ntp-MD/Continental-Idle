import assert from 'node:assert/strict'
import { state, clamp } from '../src/blueprint-editor/store/state'
import {
	addFloor, deleteFloor, duplicateFloor, paintFloorTiles,
	addObject, deleteSelected, moveSelectedTo, rotateSelected,
	linkObjects, unlinkObject,
	copySelected, pasteObjects, removeTag,
} from '../src/blueprint-editor/store/index'
import { buildBlueprintData } from '../src/blueprint-editor/store/dataLoader'
import { cloneDeepRaw } from '../src/blueprint-editor/store/storeUtils'
import { resolveBuildingArea, assetSizeFor, roundedRectPath } from '../src/blueprint-editor/domain/geometry'
import { resolveFloorTileStates } from '../src/blueprint-editor/domain/types'
import type { AssetDef, FloorData, FloorWalkable, ObjectData } from '../src/blueprint-editor/domain/types'

// ── Harness: save stub + state snapshot/restore ──
const originalFetch = globalThis.fetch
globalThis.fetch = (async (_url: string | URL | Request, _init?: RequestInit) => {
	const data = buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig, state.tagDefinitions)
	return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof fetch

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

const failures: string[] = []
let checks = 0

async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
	checks++
	try {
		await fn()
		console.log(`  ok    ${name}`)
	} catch (error) {
		failures.push(name)
		const message = error instanceof Error ? error.message.split('\n')[0] : String(error)
		console.log(`  FAIL  ${name}\n        ${message}`)
	}
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

async function main(): Promise<void> {
	console.log('Grill: editor store / geometry / tile pipeline\n')

	// ── A. Street width: object bounds must follow the drawn building area ──
	await check('street-width: clamp() respects layout.streetWidthTiles', () => {
		restore(baseline)
		state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
		state.layout.streetWidthTiles = 12
		const area = resolveBuildingArea(state.layout)
		const result = clamp({ x: area.x - 50, y: area.y - 50, w: 25, h: 25 })
		assert.equal(result.x, area.x, 'x clamps to the 12-tile building inset (300), not the fixed 8-tile default (200)')
		assert.equal(result.y, area.y, 'y clamps to the 12-tile building inset (300)')
	})

	await check('street-width: moveSelectedTo() keeps objects inside the drawn building area', () => {
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

	// ── B. Store CRUD regressions ──
	await check('addObject rejects an overlapping placement', async () => {
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

	await check('rotateSelected() rotates rx corners and swaps w/h', async () => {
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

	await check('rotateSelected() refuses a rotation that would overlap', async () => {
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

	await check('link then unlink dissolves a group smaller than 2', async () => {
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

	await check('deleteSelected() skips locked objects and keeps them', async () => {
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

	await check('duplicateFloor() remaps ids and link groups', async () => {
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

	await check('deleteFloor() clears streetFloorId and switches the current floor', async () => {
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

	await check('addFloor() picks a label that is not already used', async () => {
		restore(baseline)
		const before = state.layout.floors.length
		const labels = new Set(state.layout.floors.map(f => f.label))
		const floor = await addFloor()
		assert.ok(floor, 'floor is created')
		assert.equal(state.layout.floors.length, before + 1)
		assert.ok(!labels.has(floor.label), `new label "${floor.label}" was already taken`)
	})

	await check('removeTag() cascades into assets, roles, tasks and trigger rates', async () => {
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

	await check('copySelected()/pasteObjects() offsets a single-tile copy and gives it a new id', async () => {
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
	await check('resolveFloorTileStates() falls back to defaultWalkable', () => {
		const grid = resolveFloorTileStates({ defaultWalkable: false }, 2, 3)
		assert.deepEqual(grid, [
			['blocked', 'blocked', 'blocked'],
			['blocked', 'blocked', 'blocked'],
		])
	})

	await check('paintFloorTiles() paints the interior and protects the street ring', async () => {
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
	await check('assetSizeFor() swaps w/h on 90/270 rotations', () => {
		restore(baseline)
		const asset: AssetDef = { id: 'geo', name: 'Geo', w: 2, h: 1 }
		state.assetRegistry.push(asset)
		assert.deepEqual(assetSizeFor('geo', 0, 25, state.assetRegistry), { w: 50, h: 25 })
		assert.deepEqual(assetSizeFor('geo', 90, 25, state.assetRegistry), { w: 25, h: 50 })
		assert.deepEqual(assetSizeFor('geo', 270, 25, state.assetRegistry), { w: 25, h: 50 })
	})

	await check('resolveBuildingArea() never returns a negative size when the ring exceeds the canvas', () => {
		const area = resolveBuildingArea({ canvas: { width: 100, height: 100, tileSize: 25 }, streetWidthTiles: 8 })
		assert.equal(area.w, 0)
		assert.equal(area.h, 0)
	})

	await check('roundedRectPath() clamps radii to half the shorter side', () => {
		const path = roundedRectPath(0, 0, 10, 10, { tl: 100, tr: 0, br: 0, bl: 0 })
		assert.ok(path?.startsWith('M 5 0'), `expected clamped radius 5, got "${path}"`)
		assert.equal(roundedRectPath(0, 0, 10, 10, { tl: 0, tr: 0, br: 0, bl: 0 }), null)
	})

	// ── E. Informational probes (open questions, no pass/fail) ──
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

	try {
		restore(baseline)
		installTestAsset()
		state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
		const floor = state.layout.floors[0]
		const source = makeObject('probe', 400, 400)
		floor.objects = [source]
		state.currentFloorId = floor.id
		selectObjects(['probe'])
		await copySelected()
		await pasteObjects()
		if (floor.objects.length === 2) {
			console.log('  note  multi-tile paste works on this build')
		} else {
			console.log('  note  OPEN: pasting a 50px (2-tile) object is rejected - the 1-tile offset makes the copy overlap its source')
		}
	} catch (error) {
		console.log(`  note  paste probe errored: ${(error as Error).message}`)
	}

	console.log(`\n${checks - failures.length}/${checks} checks passed`)
	if (failures.length > 0) {
		console.log('Failed checks:')
		for (const name of failures) console.log(`  - ${name}`)
		process.exitCode = 1
	}
}

try {
	await main()
} finally {
	globalThis.fetch = originalFetch
}
