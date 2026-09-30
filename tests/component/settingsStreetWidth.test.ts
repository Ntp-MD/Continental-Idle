import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import SettingsModal from '@/blueprint-editor/components/modals/SettingsModal.vue'
import {
	createBlueprintStore, STORE_KEY,
	type BlueprintStore, type PersistencePort, type SyncPort,
} from '@/blueprint-editor/store/index'
import { defaultSeed } from '@/blueprint-editor/store/seed'
import { useToast } from '@/composables/useToast'

/**
 * The street width is one setting among many that go through `run()` and report a refusal. It used
 * to be the exception: the dropdown called the store directly, so a width the canvas cannot carry
 * produced an unhandled promise and a dropdown that looked like it worked and did nothing. A silent
 * failure is the only kind a player cannot act on.
 */
const persistence: PersistencePort = {
	async load() { return null },
	async save() { return true },
}
const sync: SyncPort = { emit() {} }

async function settle() {
	for (let i = 0; i < 4; i++) {
		await nextTick()
		await new Promise(resolve => setTimeout(resolve, 0))
	}
	await nextTick()
}

async function mountModal(): Promise<{ wrapper: ReturnType<typeof mount>; store: BlueprintStore }> {
	const store = createBlueprintStore({ persistence, sync, seed: await defaultSeed() })
	const wrapper = mount(SettingsModal, {
		props: { open: true },
		global: {
			plugins: [{ install: (app: { provide: (k: symbol, v: unknown) => void }) => app.provide(STORE_KEY, store) }],
		},
		attachTo: document.body,
	})
	return { wrapper, store }
}

describe('street width reports a refusal instead of failing silently', () => {
	it('a width the canvas cannot carry says so rather than doing nothing', async () => {
		const toast = useToast()
		const { wrapper, store } = await mountModal()
		try {
			// `ModalShell` teleports to body, so the control lives outside the wrapper's tree.
			const select = document.querySelector('#canvas__streetwidth') as HTMLSelectElement | null
			expect(select, 'the street width dropdown is mounted').not.toBeNull()
			if (!select) return

			// Force the refusal the control has to survive: a width this canvas cannot carry. Choosing
			// the widest option the UI offers is not enough - the seeded canvas is large enough to take
			// it, which is exactly why the silent path went unnoticed. The store is stubbed so the
			// refusal is certain and the assertion is about the reporting, not the geometry.
			const setStreetWidth = vi.spyOn(store, 'setStreetWidth').mockResolvedValue(false)

			toast.toasts.value.length = 0
			const options = [...select.querySelectorAll('option')].map(o => o.value)
			const target = options.filter(v => v !== '').sort((a, b) => Number(b) - Number(a))[0]
			expect(target, 'the dropdown offers at least one width').toBeTruthy()
			select.value = target as string
			select.dispatchEvent(new Event('change'))
			await settle()

			expect(setStreetWidth, 'the dropdown reached the store').toHaveBeenCalled()
			const messages = toast.toasts.value.map(t => `${t.type}: ${t.message}`)
			expect(messages.some(m => /street width/i.test(m)),
				`a refused street width was silent (toasts: ${JSON.stringify(messages)})`).toBe(true)
			setStreetWidth.mockRestore()
		} finally {
			wrapper.unmount()
		}
	})

	it('the dropdown goes through the guarded path, not the store directly', async () => {
		const { readFile } = await import('node:fs/promises')
		const source = await readFile('src/blueprint-editor/components/modals/SettingsModal.vue', 'utf8')
		// A bare `@change="store.x(...)"` on an async command is the defect in its own form.
		expect(source).not.toMatch(/@change="store\.setStreetWidth/)
		expect(source).toMatch(/@change="applyStreetWidth/)
		expect(source).toMatch(/if \(!saved\) toast\.error\(/)
	})
})