import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createBlueprintStore, emptySeed, type PersistencePort, type SyncPort } from '../../src/blueprint-editor/store/index'
import { seedWorkspaceFile } from '../../src/blueprint-editor/store/seed'
import { rateForTags, visitorRoleIds } from '../../src/blueprint-editor/domain/economy/takings'
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
