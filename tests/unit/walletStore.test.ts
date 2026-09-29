import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createMemoryStorage } from '../../src/blueprint-editor/store/localPort'
import { createWalletStore } from '../../src/blueprint-editor/store/wallet'
import { WALLET_OFFLINE_CAP_MINUTES } from '../../src/blueprint-editor/domain/economy/wallet'

const MINUTE = 60_000

test('a committed wallet is read back with the absent period credited', async () => {
	const wallet = createWalletStore(createMemoryStorage())
	await wallet.commit(10_000, 600, 0)

	const restored = await wallet.restore(30 * MINUTE)
	assert.equal(restored.record?.bankCents, 10_000)
	assert.equal(restored.earnedCents, 600 * 30)
	assert.equal(restored.capped, false)
})

test('a first run has nothing to credit', async () => {
	const restored = await createWalletStore(createMemoryStorage()).restore(0)
	assert.deepEqual(restored, { record: null, earnedCents: 0, creditedMinutes: 0, capped: false })
})

test('a corrupt record costs the player nothing but the session', async () => {
	for (const junk of ['not json', '{"bankCents":"a lot"}', '[]', 'null']) {
		const wallet = createWalletStore(createMemoryStorage(junk))
		assert.equal((await wallet.restore(5 * MINUTE)).record, null, `${junk} must not be paid out`)
	}
})

test('the saved rate is what keeps earning, and a cap-bound period is flagged', async () => {
	const wallet = createWalletStore(createMemoryStorage())
	await wallet.commit(1_000, 250, 0)
	const away = await wallet.restore((WALLET_OFFLINE_CAP_MINUTES + 60) * MINUTE)
	assert.equal(away.capped, true)
	assert.equal(away.earnedCents, 250 * WALLET_OFFLINE_CAP_MINUTES)
})

test('clear() forgets the balance, so a wiped lobby cannot keep paying out', async () => {
	const storage = createMemoryStorage()
	const wallet = createWalletStore(storage)
	await wallet.commit(9_900, 300, 0)
	await wallet.clear()
	assert.equal((await wallet.restore(MINUTE)).record, null)
})

test('a quiet session cannot erase the rate the lobby already demonstrated', async () => {
	const wallet = createWalletStore(createMemoryStorage())
	await wallet.commit(10_000, 600, 0)
	await wallet.commit(12_000, 0, 10 * MINUTE)
	const away = await wallet.restore(20 * MINUTE)
	assert.equal(away.record?.demonstratedPerMinuteCents, 600)
	assert.equal(away.earnedCents, 6_000, 'the absent period is credited at the demonstrated rate, not the last one')
})

test('a record written before the high-water mark existed still accrues', async () => {
	const wallet = createWalletStore(createMemoryStorage('{"bankCents":0,"perMinuteCents":300,"savedAtMs":0}'))
	assert.equal((await wallet.restore(5 * MINUTE)).earnedCents, 1_500)
})
