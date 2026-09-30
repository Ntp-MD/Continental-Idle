import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { deployWorkspace, importWorkspace, type WorkspaceData } from './canvasFixtures'

/**
 * The fixture trade on a real screen, reached the way a player reaches it: a deployed house, a panel,
 * a click. This file exists because the jsdom tests call the shop directly and so could not see that the
 * trade needed a *selection* the running preview makes impossible - a palette mousedown leaves preview,
 * and a canvas click is ignored during it. The shop therefore lists its own tradeable fixtures, and this
 * spec proves that list is on the screen and that both directions move money and objects.
 *
 * Prices come off the declared rule, not off the screen: the bar bills 850 a day, a fixture costs three
 * days, each one held adds a day, and a trade-in returns half of a first price.
 */
const FIRST_PRICE = '25.50'
const REFUND = '12.75'
/** The kind under test: `bar-counter` is 4x1 tiles and carries the `bar` rate. */
const FIXTURE_ID = 'bar-counter'
const FIXTURE_NAME = 'Bar Counter'

function addBarCounters(data: WorkspaceData): void {
	// The spec owns its plate: the shipped furniture is cleared so every price and count below follows
	// from what this file puts down, and cannot drift when the starter lobby is re-furnished.
	data.layout.floors[0].objects = [300, 460, 620].map(x => ({
		id: `obj-e2e-bar-${x}`,
		type: FIXTURE_ID,
		x,
		y: 300,
		rotation: 0,
	}))
	// And the same for the rest of the building: a holding is counted by the rate its tags bill at, across
	// every floor (`holdingsOnFloor` in useShopPurchases), so one bar counter on the bar floor would move
	// the price this spec reads. The plate is the spec's own, on every floor.
	for (const floor of data.layout.floors.slice(1)) floor.objects = []
}

function fixtureRow(page: Page): Locator {
	// The row's name cell also carries the holding count, so the asset name is matched as a substring.
	return page.locator('.form__row').filter({ has: page.getByText(FIXTURE_NAME) })
}

const buyButton = (page: Page) => fixtureRow(page).getByRole('button', { name: /^Buy one for/ })
const sellButton = (page: Page) => fixtureRow(page).getByRole('button', { name: /^Sell one for/ })
/** Toasts stack, so the repeated sale notices have to be read one at a time. */
const notice = (page: Page, text: string) => expect(page.getByText(text).first()).toBeVisible()

test('a deployed house trades fixtures: three sold back, one bought again', async ({ page }) => {
	const dir = mkdtempSync(path.join(tmpdir(), 'ci-shop-'))
	try {
		await page.goto('/')
		await importWorkspace(page, dir, addBarCounters)
		await deployWorkspace(page)
		// Pausing keeps the bank at whatever the wallet restored - an empty bank in a fresh context - so
		// the affordability assertions read the shop's rule, not how much the lobby earned while the
		// test was loading.
		await page.getByRole('button', { name: 'Pause NPC simulation' }).click()
		await expect(page.getByRole('status').filter({ hasText: 'Paused' })).toBeVisible()

		const row = fixtureRow(page)
		await expect(row).toBeVisible()
		await expect(row.getByText('3 held')).toBeVisible()
		// Three of the kind already held: the next one is priced for the crowding, at six days of the bar.
		await expect(buyButton(page)).toHaveText(/51\.00/)
		await expect(buyButton(page)).toBeDisabled()
		await expect(row.getByText(/The bank holds/)).toBeVisible()

		// The three fixtures the imported house was carrying.
		await expect(page.locator('[data-obj-id]')).toHaveCount(3)
		const sell = sellButton(page)
		await expect(sell).toHaveText(/Sell one for 12\.75/)
		for (let sale = 0; sale < 3; sale++) {
			await sell.click()
			await notice(page, `Sold ${FIXTURE_NAME} for ${REFUND}`)
			await expect(page.locator('[data-obj-id]')).toHaveCount(2 - sale)
		}
		// Three refunds of 12.75 is 38.25 in the bank - which is the only reason the buy below can be
		// clicked at all, and the whole point of a trade-in: the outflow is also an inflow.
		await expect(row.getByText(/held/)).toHaveCount(0)

		// With none of the kind left on the floor there is nothing to trade in, and the row says so by
		// having no sell button rather than by refusing a click.
		await expect(sellButton(page)).toHaveCount(0)

		await expect(buyButton(page)).toHaveText(new RegExp(`Buy one for ${FIRST_PRICE}`))
		await expect(buyButton(page)).toBeEnabled()
		await buyButton(page).click()
		await notice(page, `Bought ${FIXTURE_NAME} for ${FIRST_PRICE}`)
		// The one fixture the shop placed for the player, on a plate it had emptied.
		await expect(page.locator('[data-obj-id]')).toHaveCount(1)

		// The house paid out 38.25 and took 25.50 back, so 12.75 remains - and the next one is priced for
		// the fixture it now holds, four days of the bar, which 12.75 cannot cover.
		await expect(row.getByText('1 held')).toBeVisible()
		await expect(buyButton(page)).toHaveText(/34\.00/)
		await expect(buyButton(page)).toBeDisabled()
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})
