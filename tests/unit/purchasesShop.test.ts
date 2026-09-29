import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createBlueprintStore, type PersistencePort, type SyncPort } from '../../src/blueprint-editor/store/index'
import { defaultSeed } from '../../src/blueprint-editor/store/seed'
import { cloneDeepRaw } from '../../src/blueprint-editor/store/storeUtils'
import { createTakingsLedger, TAKING_RATES_CENTS, type TakingsLedger } from '../../src/blueprint-editor/domain/economy/takings'
import {
	FIXTURE_COST_DAYS,
	STAFF_HIRE_COST_DAYS,
	affordable,
	fixturePriceCents,
	staffHirePriceCents,
} from '../../src/blueprint-editor/domain/economy/purchases'
import { STAFF_DAY_WAGE_CENTS } from '../../src/blueprint-editor/domain/economy/upkeep'
import { REPUTATION_NEUTRAL } from '../../src/blueprint-editor/domain/economy/reputation'
import { STANDING_REPAIR_COST_CENTS } from '../../src/blueprint-editor/domain/economy/purchases'
import { useShopPurchases } from '../../src/blueprint-editor/composables/useShopPurchases'
import { useToast } from '@/composables/useToast'
import type { AssetDef, NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'

const persistence: PersistencePort = { async load() { return null }, async save() { return true } }
const sync: SyncPort = { emit() {} }
const store = await createBlueprintStore({ persistence, sync, seed: await defaultSeed() })
const state = store.state
const baseLayout = cloneDeepRaw(state.layout)
const baseAssets = cloneDeepRaw(state.assetRegistry)
const toast = useToast()

function reset(): void {
	state.layout = cloneDeepRaw(baseLayout)
	state.assetRegistry = cloneDeepRaw(baseAssets)
	state.currentFloorId = baseLayout.floors[0]?.id ?? ''
	// The seed lobby ships furnished, so an empty floor is a property of this harness, not of the store.
	for (const floor of state.layout.floors) floor.objects = []
	toast.toasts.value = []
}

function fundedLedger(cents: number): TakingsLedger {
	const ledger = createTakingsLedger({ ticksPerSecond: 60, isVisitor: () => true })
	ledger.deposit(cents)
	return ledger
}

/** A standing handle the shop can move, so a repair is proven as a purchase, not as arithmetic. */
function fakeStanding(start = 30): { get(): number; set(score: number): void; current(): number } {
	let score = start
	return { get: () => score, set: (value: number) => { score = value }, current: () => score }
}

function installOrigin(id: string, tags: string[]): AssetDef {
	const asset: AssetDef = { id, name: id, w: 1, h: 1, walkable: false, tags }
	state.assetRegistry.push(asset)
	return asset
}

test('a fixture is priced off what it bills, and free seating cannot be bought at all', () => {
	assert.equal(fixturePriceCents(['contract-board']), TAKING_RATES_CENTS['contract-board'] * FIXTURE_COST_DAYS)
	// The best qualifying tag prices it, the same rule that bills it.
	assert.equal(fixturePriceCents(['lounge', 'contract-closed']), TAKING_RATES_CENTS['contract-closed'] * FIXTURE_COST_DAYS)
	assert.equal(fixturePriceCents(['lounge']), null)
	assert.equal(fixturePriceCents(undefined), null)
	assert.equal(staffHirePriceCents(), STAFF_DAY_WAGE_CENTS * STAFF_HIRE_COST_DAYS)
	assert.equal(affordable(100, 100), true)
	assert.equal(affordable(99, 100), false)
})

test('withdraw moves the bank only, refuses a price it cannot cover, and clamps carried down', () => {
	const ledger = createTakingsLedger({ ticksPerSecond: 60, isVisitor: () => true })
	ledger.deposit(5_000)
	assert.equal(ledger.withdraw(5_001), false, 'a price the bank cannot cover must be refused')
	assert.equal(ledger.withdraw(0), false)
	assert.equal(ledger.withdraw(-10), false)
	let snap = ledger.snapshot()
	assert.equal(snap.bankCents, 5_000, 'a refused purchase must not have spent anything')

	assert.equal(ledger.withdraw(2_000), true)
	snap = ledger.snapshot()
	assert.equal(snap.bankCents, 3_000)
	// Carried is the balance a re-deploy restores from: if it still said 5,000 the money would come back.
	assert.equal(snap.carriedCents, 3_000)
	assert.equal(snap.served, 0, 'a purchase is not a served guest')
	assert.equal(snap.perMinuteCents, 0, 'spending must not raise the income rate')
	assert.equal(snap.todayCents, 0)

	ledger.reset()
	assert.equal(ledger.snapshot().bankCents, 3_000, 'reset restores what is actually there')
})

test('buying a fixture places it through the store gate and charges exactly its price', async () => {
	reset()
	const asset = installOrigin('bar-counter', ['bar'])
	const ledger = fundedLedger(TAKING_RATES_CENTS.bar * FIXTURE_COST_DAYS)
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })
	const before = (state.layout.floors[0]?.objects ?? []).length

	const verdict = await shop.buyFixture(asset)
	assert.ok(verdict.ok, `the purchase was refused: ${JSON.stringify(toast.toasts.value)}`)
	assert.equal(verdict.priceCents, TAKING_RATES_CENTS.bar * FIXTURE_COST_DAYS)
	assert.equal((state.layout.floors[0]?.objects ?? []).length, before + 1, 'nothing landed on the floor')
	assert.equal(ledger.snapshot().bankCents, 0, 'the bank paid the price and nothing else')
})

test('a fixture the bank cannot cover is never placed', async () => {
	reset()
	const asset = installOrigin('contract-desk', ['contract-board'])
	const ledger = fundedLedger(TAKING_RATES_CENTS['contract-board'] * FIXTURE_COST_DAYS - 1)
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })

	const verdict = await shop.buyFixture(asset)
	assert.equal(verdict.ok, false)
	assert.equal((state.layout.floors[0]?.objects ?? []).length, 0, 'an unaffordable purchase still wrote to the floor')
	assert.equal(ledger.snapshot().bankCents, TAKING_RATES_CENTS['contract-board'] * FIXTURE_COST_DAYS - 1)
})

test('an asset that bills nothing cannot be bought', async () => {
	reset()
	const asset = installOrigin('garden-bench', ['lounge'])
	const ledger = fundedLedger(1_000_000)
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })

	assert.equal((await shop.buyFixture(asset)).ok, false)
	assert.equal((state.layout.floors[0]?.objects ?? []).length, 0)
	assert.equal(ledger.snapshot().bankCents, 1_000_000)
})

test('when the floor cannot take the object, no money moves', async () => {
	reset()
	const asset = installOrigin('bar-counter', ['bar'])
	const ledger = fundedLedger(100_000)
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })
	// No current floor: the store's own placement gate has nothing to write into, and the purchase
	// must read that as "not sold", not as "paid".
	state.currentFloorId = ''

	assert.equal((await shop.buyFixture(asset)).ok, false)
	assert.equal(ledger.snapshot().bankCents, 100_000)
})

test('hiring a head goes through the deployment write path and charges the hire price', async () => {
	reset()
	const config = {
		...cloneDeepRaw(state.layout.npcConfig ?? {}),
		speed: 0.4,
		defaultRoleId: 'desk',
		roles: [
			{ id: 'desk', label: 'Desk', color: '#fff', focusTags: [], restrictedTags: [], taskIds: ['duty-desk'], focusChance: 0 },
			{ id: 'guest', label: 'Guest', color: '#000', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 0 },
		],
		tasks: [{ id: 'duty-desk', label: 'Duty', tags: ['front-desk'] }],
		pool: [{ roleId: 'desk', count: 1 }],
	} as unknown as NpcSimulationConfig
	await store.updateNpcConfig(config)

	const price = staffHirePriceCents()
	const ledger = fundedLedger(price)
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })
	const hireable = shop.hireableRoles(store.state.layout.npcConfig as unknown as NpcSimulationConfig)
	assert.deepEqual(hireable.map(role => role.roleId), ['desk'], 'a guest is not staff, so it cannot be hired')

	const verdict = await shop.hireStaff('desk', store.state.layout.npcConfig as unknown as NpcSimulationConfig)
	assert.ok(verdict.ok, `the hire was refused: ${JSON.stringify(toast.toasts.value)}`)
	const pool = (store.state.layout.npcConfig as unknown as NpcSimulationConfig).pool
	assert.equal(pool.find(entry => entry.roleId === 'desk')?.count, 2, 'the stored deployment did not gain a head')
	assert.equal(ledger.snapshot().bankCents, 0)
	assert.equal(ledger.snapshot().served, 0)
})

test('a hire the deployment will not accept costs nothing', async () => {
	reset()
	// 1000 is the pool ceiling the normalizer accepts: the +1 makes the entry invalid, so the write
	// path drops it and the stored deployment is not larger. Money must follow that outcome.
	const config = {
		...cloneDeepRaw(state.layout.npcConfig ?? {}),
		speed: 0.4,
		defaultRoleId: 'desk',
		roles: [{ id: 'desk', label: 'Desk', color: '#fff', focusTags: [], restrictedTags: [], taskIds: ['duty-desk'], focusChance: 0 }],
		tasks: [{ id: 'duty-desk', label: 'Duty', tags: ['front-desk'] }],
		pool: [{ roleId: 'desk', count: 1000 }],
	} as unknown as NpcSimulationConfig
	await store.updateNpcConfig(config)

	const ledger = fundedLedger(staffHirePriceCents())
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })
	const verdict = await shop.hireStaff('desk', store.state.layout.npcConfig as unknown as NpcSimulationConfig)
	assert.equal(verdict.ok, false)
	assert.equal(ledger.snapshot().bankCents, staffHirePriceCents(), 'a head the deployment refused was still charged')
})

test('a hire nobody can pay for leaves the deployment untouched', async () => {
	reset()
	const config = {
		...cloneDeepRaw(state.layout.npcConfig ?? {}),
		speed: 0.4,
		defaultRoleId: 'desk',
		roles: [{ id: 'desk', label: 'Desk', color: '#fff', focusTags: [], restrictedTags: [], taskIds: ['duty-desk'], focusChance: 0 }],
		tasks: [{ id: 'duty-desk', label: 'Duty', tags: ['front-desk'] }],
		pool: [{ roleId: 'desk', count: 1 }],
	} as unknown as NpcSimulationConfig
	await store.updateNpcConfig(config)

	const ledger = fundedLedger(staffHirePriceCents() - 1)
	const shop = useShopPurchases({ store, ledger, standing: fakeStanding() })
	const verdict = await shop.hireStaff('desk', store.state.layout.npcConfig as unknown as NpcSimulationConfig)
	assert.equal(verdict.ok, false)
	assert.equal((store.state.layout.npcConfig as unknown as NpcSimulationConfig).pool.find(entry => entry.roleId === 'desk')?.count, 1)
	assert.equal(ledger.snapshot().bankCents, staffHirePriceCents() - 1)
})

test('standing is bought back only while it sits below what money can restore', async () => {
	reset()
	const ledger = fundedLedger(STANDING_REPAIR_COST_CENTS * 3)
	const standing = fakeStanding(30)
	const shop = useShopPurchases({ store, ledger, standing })

	assert.ok((await shop.buyStandingRepair()).ok)
	assert.equal(standing.current(), 40, 'the repair lifted standing by the declared points')
	assert.equal(ledger.snapshot().bankCents, STANDING_REPAIR_COST_CENTS * 2)

	// Above neutral there is nothing to buy: money cannot purchase a reputation the crowd did not give.
	const proud = fakeStanding(REPUTATION_NEUTRAL)
	const refused = useShopPurchases({ store, ledger: fundedLedger(1_000_000), standing: proud })
	assert.equal((await refused.buyStandingRepair()).ok, false)
	assert.equal(proud.current(), REPUTATION_NEUTRAL)
	assert.equal(refused.bankCents.value, 1_000_000, 'a refused repair still spent money')
})
