import { describe, it, expect } from 'vitest'
import {
	createBlueprintStore,
	createLocalPersistencePort,
	createMemoryStorage,
	emptySeed,
	type SyncPort,
} from '@/blueprint-editor/blueprintStore'

const sync: SyncPort = { emit() {} }

describe('local-first persistence boot', () => {
	it('saves a workspace and boots a fresh store from it', async () => {
		const storage = createMemoryStorage()
		const first = createBlueprintStore({
			persistence: createLocalPersistencePort(storage),
			sync,
			seed: emptySeed(),
		})
		expect(first.state.layout.floors.length).toBe(0)

		const created = await first.addFloor()
		expect(created).toBeTruthy()
		expect(first.state.layout.floors.length).toBe(1)

		const second = createBlueprintStore({
			persistence: createLocalPersistencePort(storage),
			sync,
			seed: emptySeed(),
		})
		expect(second.state.layout.floors.length).toBe(0)

		await second.reloadEditorData()
		expect(second.state.layout.floors.length).toBe(1)
		expect(second.state.layout.floors[0].id).toBe(created!.id)
	})

	it('boots as a fresh workspace when no data was ever saved', async () => {
		const store = createBlueprintStore({
			persistence: createLocalPersistencePort(createMemoryStorage()),
			sync,
			seed: emptySeed(),
		})
		await store.reloadEditorData()
		expect(store.state.layout.floors.length).toBe(0)
	})
})