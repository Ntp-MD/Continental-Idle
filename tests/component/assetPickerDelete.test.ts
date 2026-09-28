import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import AssetPickerModal from '@/blueprint-editor/components/modals/AssetPickerModal.vue'
import ConfirmDialog from '@/blueprint-editor/components/shell/ConfirmDialog.vue'
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

let store: BlueprintStore

// An asset with `walkable: false` and no walkable data is "incomplete", which is what
// the seeded/generated assets are.
function makeAsset(id: string): AssetDef {
	return { id, name: id, w: 2, h: 2, walkable: false, defaultFillColor: '#ffffff' }
}

const Host = defineComponent({
	setup() {
		return () => h('div', [h(ConfirmDialog), h(AssetPickerModal, { open: true })])
	},
})

function settle() {
	return new Promise((resolve) => setTimeout(resolve, 0))
}

function deleteButtons(): HTMLButtonElement[] {
	return Array.from(document.querySelectorAll<HTMLButtonElement>('.picker__delete'))
}

function confirmButton(): HTMLButtonElement | null {
	const dialog = document.querySelector<HTMLElement>('#modal-confirm')
	if (!dialog) return null
	const buttons = Array.from(dialog.querySelectorAll('button'))
	return buttons.find((b) => b.textContent?.trim() === 'Remove') ?? null
}

async function click(el: Element) {
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
	await nextTick()
	await settle()
	await nextTick()
}

async function deleteFirstAsset(): Promise<void> {
	await click(deleteButtons()[0]!)
	const button = confirmButton()
	expect(button, 'confirm dialog offers Remove').toBeTruthy()
	await click(button!)
	await nextTick()
	await settle()
	await nextTick()
}

describe('asset picker delete', () => {
	beforeEach(async () => {
		document.body.innerHTML = ''
		store = createBlueprintStore({ persistence, sync, seed: await defaultSeed() })
		store.state.assetRegistry = [makeAsset('a-1'), makeAsset('a-2'), makeAsset('a-3')]
		mount(Host, {
			attachTo: document.body,
			global: { provide: { [STORE_KEY]: store } },
		})
		await nextTick()
		await settle()
		await nextTick()
	})

	it('keeps every remaining delete button usable after one delete', async () => {
		expect(deleteButtons()).toHaveLength(3)

		await deleteFirstAsset()
		expect(store.state.assetRegistry.map((a) => a.id)).toEqual(['a-2', 'a-3'])

		expect(deleteButtons().map((b) => b.disabled), 'no button stuck disabled').toEqual([false, false])

		await deleteFirstAsset()
		expect(store.state.assetRegistry.map((a) => a.id)).toEqual(['a-3'])
	})
})
