import { afterEach, test, vi } from 'vitest'
import assert from 'node:assert/strict'
import type { NpcEngineEvent } from '../../src/engine/npc'
import { TAKING_RATES_CENTS } from '../../src/blueprint-editor/domain/economy/takings'
import { WALLET_AUTOSAVE_MS } from '../../src/blueprint-editor/domain/economy/wallet'
import type { WalletStore } from '../../src/blueprint-editor/store/wallet'
import type { NpcSimulationConfig } from '../../src/blueprint-editor/domain/types'
import { useNpcSimulation } from '../../src/blueprint-editor/composables/useNpcSimulation'

/**
 * The away rate is written by the facade, not by the arithmetic next door: `commitWallet` decides what a
 * period with nobody watching is worth, and everything to the left of it - `accrueOffline`,
 * `creditableRate`, the cap - is already tested against a number someone handed it. This file is where
 * the two claims meet: the rate the house can actually bank is the tariff rate *net of what its name is
 * worth tonight*, and a house with a bad name must therefore earn less away than it would face value.
 */
const GUEST = 'role-guest'

interface Committed {
	readonly bankCents: number
	readonly perMinuteCents: number
	readonly standingScore: number | undefined
}

function fakeWallet() {
	const commits: Committed[] = []
	const wallet: WalletStore = {
		async restore() {
			return { record: null, earnedCents: 0, creditedMinutes: 0, capped: false }
		},
		async commit(bankCents, perMinuteCents, _nowMs, standingScore) {
			commits.push({ bankCents, perMinuteCents, standingScore })
		},
		async clear() {},
	}
	return { wallet, commits }
}

function servedSimulation() {
	const { wallet, commits } = fakeWallet()
	const config = {
		speed: 0.4,
		defaultRoleId: GUEST,
		roles: [{ id: GUEST, label: 'Guest', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 100 }],
		tasks: [],
		pool: [{ roleId: GUEST, count: 1 }],
	} as unknown as NpcSimulationConfig
	const simulation = useNpcSimulation({ wallet, getConfig: () => config })
	// One completed service at a priced facility: the rate window is what the away credit is computed from,
	// and nothing but a real service may raise it.
	simulation.takings.ingest(
		[{ type: 'interaction-end', agentId: 'a1', floorId: 'f1', itemId: 'object:bar-1', interactSpotId: 'spot-1', tick: 5 }] as NpcEngineEvent[],
		5,
		() => ({ roleId: GUEST, tags: ['bar'] }),
	)
	return { simulation, commits }
}

afterEach(() => {
	vi.useRealTimers()
})

test('the away rate is the name of the house discounted, not the tariff at face value', () => {
	const { simulation, commits } = servedSimulation()
	const live = simulation.takings.snapshot()
	assert.ok(live.perMinuteCents > 0, 'the service did not raise the rate window, so this proves nothing')
	const worth = simulation.getHouseWorth()
	assert.ok(worth <= 1, `what the house is worth read ${worth}, above face value`)

	simulation.setStanding(40)
	simulation.commitWallet()
	const discounted = simulation.getHouseWorth()
	assert.ok(discounted < 1, `a room at standing 40 is still worth ${discounted} - the discount is not being applied`)

	const committed = commits.at(-1)
	assert.ok(committed, 'commitWallet never reached the wallet')
	const expected = Math.floor(simulation.takings.snapshot().perMinuteCents * discounted)
	assert.equal(committed.perMinuteCents, expected, 'the away rate is not the live rate net of the house')
	assert.ok(
		committed.perMinuteCents < Math.floor(live.perMinuteCents * 1),
		'a worse name away earned at least what it would face value',
	)
	assert.equal(committed.bankCents, simulation.takings.snapshot().bankCents, 'the bank handed to the wallet is not the one the ledger holds')
	assert.equal(committed.standingScore, 40, 'standing was not persisted with the rate')
})

test('the autosave is scheduled on the declared clock and keeps committing through it', () => {
	vi.useFakeTimers()
	const scheduled = vi.spyOn(globalThis, 'setInterval')
	const { simulation, commits } = servedSimulation()
	// The cadence is a declared balance, so the wiring must name it rather than a number at the call site.
	assert.ok(
		scheduled.mock.calls.some(call => call[1] === WALLET_AUTOSAVE_MS),
		`the wallet autosave is not scheduled on WALLET_AUTOSAVE_MS: ${JSON.stringify(scheduled.mock.calls.map(call => call[1]))}`,
	)
	scheduled.mockRestore()

	const before = commits.length
	vi.advanceTimersByTime(WALLET_AUTOSAVE_MS)
	assert.equal(commits.length, before + 1, 'the autosave did not commit on its own clock')
	vi.advanceTimersByTime(WALLET_AUTOSAVE_MS)
	assert.equal(commits.length, before + 2, 'the autosave fired once and then stopped')
	assert.deepEqual(commits.at(-1), commits.at(-2), 'two commits off the same reading reported different money')
	// The tariff is a declared number, so this is about the shape of the write, not its size.
	assert.ok(commits[before].perMinuteCents <= TAKING_RATES_CENTS.bar * 60, 'the away rate outran the facility it came from')
	simulation.stop()
})
