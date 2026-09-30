import { test, expect } from '@playwright/test'
import { deployWorkspace } from './canvasFixtures'

/**
 * A cold boot to a running house in two clicks, with no file to find and nothing to author. Every other
 * preview spec uploads a workspace because the app used to boot with no floors and no assets at all -
 * which is not a game, it is a blank plate with a price list. This spec is the proof that the starter
 * lobby button is the shortest path from opening the page to a deployed crowd, and that what it hands
 * over is the shipped house, fixtures and all.
 */
test('the shipped lobby is one click from a cold boot', async ({ page }) => {
	await page.goto('/')
	// The cold state: no floors, so nothing to deploy and nothing to earn from.
	await expect(page.getByRole('button', { name: 'Create the first floor' })).toBeVisible()
	await expect(page.locator('[data-obj-id]')).toHaveCount(0)

	await page.getByRole('button', { name: 'Open the starter lobby' }).click()
	await expect(page.getByText('The starter lobby is on the floor')).toBeVisible()
	// The desk the house ships with, and the bar run that makes it able to earn.
	await expect(page.locator('[data-obj-id]')).toHaveCount(4)
	await expect(page.getByRole('button', { name: 'Create the first floor' })).toHaveCount(0)

	await deployWorkspace(page)
	// The board only renders on a running house, so this is the proof the starter lobby is playable -
	// 502 agents on the floor and a staff list the payroll can bill.
	await expect(page.getByText('Pay the bill', { exact: false })).toBeVisible({ timeout: 15_000 })
	await expect(page.getByText('Staff paid')).toBeVisible()
	await expect(page.locator('[data-obj-id]')).toHaveCount(4)

	// The opening squeeze, stated in the unit the player can change. The shipped crew costs more than the
	// night can yet take, and the HUD says so in heads instead of leaving a minus sign to interpret.
	const gap = page.getByText(/The wage bill is \d+ heads? bigger than the night/)
	await expect(gap).toBeVisible()
	const heads = Number(/(\d+) heads?/.exec(await gap.innerText())?.[1] ?? 0)
	const staffPaid = Number(await page.locator('.form__hint', { hasText: 'Staff paid' }).locator('b').innerText())
	expect(heads, `the gap is stated as ${heads} heads`).toBeGreaterThan(0)
	expect(heads).toBeLessThanOrEqual(staffPaid)
})
