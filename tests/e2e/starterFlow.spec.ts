import { test, expect } from '@playwright/test'

/**
 * The whole game, in the order the player meets it: open the editor, make a floor, press Deploy, watch.
 *
 * Every step before "watch" that is not part of that sentence is the thing this test is here to
 * catch, so it counts the presses: one to create a floor, one to open the deploy dialog, one to
 * deploy. Nothing is authored in the NPC manager, and no footfall switch is touched.
 */
test('a blank house is playable in three presses', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByText('No floors yet')).toBeVisible()

	await page.getByRole('button', { name: 'Create the first floor' }).click()
	await page.waitForTimeout(600)

	await page.getByRole('button', { name: 'Deploy NPCs' }).click()
	const dialog = page.locator('[role=dialog]')
	await expect(dialog).toBeVisible()

	// The house the editor opens with already carries a crowd. Without this the dialog says "Set a
	// count above 0 in NPC Manager to deploy this role", and the first thing the player ever does
	// is author an NPC role - a step that is not in the sentence above.
	await expect(dialog, 'a new house must be deployable with nothing authored').not.toContainText(
		'Set a count above 0',
	)
	await expect(dialog).toContainText('NPCs')

	await dialog.getByRole('button', { name: 'Deploy', exact: true }).click()
	await expect(page.locator('[role=dialog]')).toHaveCount(0)

	// The panel the player is watching: the house is running, and the crowd is on the plate.
	await expect(page.getByText('Running')).toBeVisible({ timeout: 15_000 })
	await expect(page.getByText(/\d+ NPCs?/)).toBeVisible({ timeout: 15_000 })
	const count = await page.getByText(/\d+ NPCs?/).first().innerText()
	const people = Number(count.match(/(\d+)/)?.[1] ?? 0)
	expect(people, `the deployment put nobody on the plate (panel says "${count}")`).toBeGreaterThan(0)
})
