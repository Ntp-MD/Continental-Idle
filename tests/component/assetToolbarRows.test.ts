import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import AssetToolbar from '@/blueprint-editor/components/canvas/AssetToolbar.vue'
import {
	createBlueprintStore, STORE_KEY,
	type BlueprintStore, type PersistencePort, type SyncPort,
} from '@/blueprint-editor/store/index'
import { defaultSeed } from '@/blueprint-editor/store/seed'
import type { AssetDef } from '@/blueprint-editor/domain/types'

const persistence: PersistencePort = {
	async load() { return null },
	async save() { return true },
}
const sync: SyncPort = { emit() {} }

function makeAsset(id: string): AssetDef {
	return { id, name: id, w: 2, h: 2, walkable: false, defaultFillColor: '#ffffff' }
}

let store: BlueprintStore
let wrapper: ReturnType<typeof mount>

async function settle() {
	await nextTick()
	await new Promise((resolve) => setTimeout(resolve, 0))
	await nextTick()
}

function rows() {
	return wrapper.findAll('.assets__item')
}

function button(row: number, title: string) {
	return rows()[row]!.find(`button[title="${title}"]`)
}

describe('asset list rows', () => {
	beforeEach(async () => {
		document.body.innerHTML = ''
		store = createBlueprintStore({ persistence, sync, seed: await defaultSeed() })
		store.state.assetRegistry = [makeAsset('a-1'), makeAsset('a-2'), makeAsset('a-3')]
		wrapper = mount(AssetToolbar, { attachTo: document.body, global: { provide: { [STORE_KEY]: store } } })
		await settle()
	})

	it('moves the last-row guard onto the new last row without a remount', async () => {
		expect(button(2, 'Move asset down').attributes('disabled'), 'last row starts locked').toBeDefined()

		await store.deleteAsset('a-3')
		await settle()

		expect(rows()).toHaveLength(2)
		expect(button(1, 'Move asset down').attributes('disabled'), 'new last row is locked').toBeDefined()
		expect(button(1, 'Move asset up').attributes('disabled'), 'middle row still moves up').toBeUndefined()
		expect(button(0, 'Move asset up').attributes('disabled'), 'first row stays locked').toBeDefined()
	})

	it('repaints the size label when an asset is resized', async () => {
		const asset = store.state.assetRegistry[1]!
		asset.w = 4
		asset.h = 4
		await settle()

		expect(rows()[1]!.find('.assets__tiles').text()).toContain('4x4')
	})

	it('repaints the incomplete badge text without a remount', async () => {
		expect(rows()[0]!.find('.badge.flag--warning').exists(), 'incomplete asset shows its marker').toBe(true)

		const asset = store.state.assetRegistry[0]!
		asset.walkable = true
		await settle()

		expect(rows()[0]!.find('.badge.flag--warning').exists(), 'complete asset drops the marker').toBe(false)
	})
})
