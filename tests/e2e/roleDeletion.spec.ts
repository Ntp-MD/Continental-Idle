import { test, expect, type Page } from '@playwright/test'
import { deployWorkspace } from './canvasFixtures'

/**
 * Deleting a role, end to end, in the browser. The cascade - the deployment count that named the role
 * going with it, and the default moving off a role the player just removed - has been a unit-only rule
 * since loop 44, which is exactly the shape of claim that survives a refactor of the write path while
 * stopping working for a player. This spec drives the manager a player drives, then reloads the page,
 * because a deletion that lives only in the draft is not a deletion.
 */
const manager = (page: Page) => page.locator('#modal-npc-manager')
const roleRows = (page: Page) =>
	manager(page).locator('li').filter({ has: page.locator('button[aria-label="Delete role"]') })
const roleLabels = async (page: Page): Promise<string[]> => roleRows(page).locator('strong').allInnerTexts()

async function openManager(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Open NPC manager' }).click()
	await expect(manager(page)).toBeVisible()
	await expect(roleRows(page).first()).toBeVisible()
}

test('a deleted role leaves the deployment, and stays gone after a reload', async ({ page }) => {
	await page.goto('/')
	await page.getByRole('button', { name: 'Open the starter lobby' }).click()
	await expect(page.getByText('The starter lobby is on the floor')).toBeVisible()
	await openManager(page)

	const before = await roleLabels(page)
	expect(before.length, 'the shipped house ships no roles').toBeGreaterThan(1)
	// The last row is never the default in the authored config, and the default is the one case the
	// manager handles by promoting another role - so deleting a non-default keeps this claim single.
	const doomed = before[before.length - 1]

	await roleRows(page).last().getByRole('button', { name: 'Delete role' }).click()
	await expect(page.getByText(`Delete role "${doomed}"`)).toBeVisible()
	await page.locator('#modal-confirm [data-autofocus]').click()
	await expect(page.getByText(`Role "${doomed}" deleted`)).toBeVisible()

	const after = await roleLabels(page)
	expect(after).toHaveLength(before.length - 1)
	expect(after).not.toContain(doomed)

	// The reload is the claim: the manager edits a draft, and only the store's own write survives this.
	await page.reload()
	await expect(page.getByRole('button', { name: 'Open the starter lobby' })).toHaveCount(0)
	await openManager(page)
	const reloaded = await roleLabels(page)
	expect(reloaded).not.toContain(doomed)
	expect(reloaded).toEqual(after)
	// The modal body has its own button literally named "Close", so the header control is targeted by
	// class rather than by accessible name - the same convention `addFloorViaManager` uses.
	await manager(page).locator('button.modal__close').click()

	// And the house still runs without it: the crowd deploys, so the pruned pool left no dangling head.
	await deployWorkspace(page)
	await expect(page.getByText('Pay the bill', { exact: false })).toBeVisible({ timeout: 15_000 })
})

test('deleting the default role hands the default to another role, and the handover persists', async ({ page }) => {
	await page.goto('/')
	await page.getByRole('button', { name: 'Open the starter lobby' }).click()
	await openManager(page)

	const rows = roleRows(page)
	// The Default *badge* is the claim; the button that sets the default is literally labelled "Default"
	// too, so matching on text alone selects every row except the one wanted.
	const defaultBadge = () => page.locator('span.badge.flag--success', { hasText: 'Default' })
	const doomedRow = rows.filter({ has: defaultBadge() })
	const doomed = (await doomedRow.locator('strong').innerText()).trim()
	const others = (await roleLabels(page)).filter(label => label !== doomed)
	expect(others.length, 'the shipped house ships one role, so the handover cannot be shown').toBeGreaterThan(0)

	await doomedRow.getByRole('button', { name: 'Delete role' }).click()
	// The manager says who inherits, so the claim under test is the same sentence the player reads.
	await expect(page.getByText(`will become the default role`)).toBeVisible()
	await page.locator('#modal-confirm [data-autofocus]').click()
	await expect(page.getByText(`Role "${doomed}" deleted`)).toBeVisible()

	const survivor = await rows.filter({ has: defaultBadge() }).locator('strong').innerText()
	expect(survivor.trim(), 'no row carries the Default badge after the default was deleted').toBe(others[0])

	await page.reload()
	await openManager(page)
	const afterReload = await roleRows(page)
		.filter({ has: defaultBadge() })
		.locator('strong')
		.innerText()
	expect(afterReload.trim()).toBe(others[0])
	expect(await roleLabels(page)).not.toContain(doomed)
})
