import { test, expect } from '@playwright/test'

/**
 * Release-critical smoke against the production build:
 * a fresh browser starts with an empty workspace, creating a floor persists it
 * to IndexedDB, and a reload proves the round-trip. This is the browser-level
 * counterpart to tests/unit/persistenceBoot.test.ts.
 */
test('a fresh workspace boots empty without an error', async ({ page }) => {
	await page.goto('/')

	await expect(page).toHaveTitle('Continental Idle')
	await expect(page.getByRole('alert')).toHaveCount(0)
	await expect(page.getByRole('status').filter({ hasText: 'No floors yet' })).toBeVisible()
	await expect(page.getByRole('button', { name: 'Create the first floor' })).toBeVisible()
})

test('creating a floor persists across a reload (IndexedDB round-trip)', async ({ page }) => {
	await page.goto('/')

	const createFloor = page.getByRole('button', { name: 'Create the first floor' })
	await expect(createFloor).toBeVisible()
	await createFloor.click()

	await expect(page.getByText('Floor created')).toBeVisible()
	await expect(page.getByRole('button', { name: 'Create the first floor' })).toHaveCount(0)

	await page.reload()

	await expect(page.getByRole('status').filter({ hasText: 'No floors yet' })).toHaveCount(0)
	await expect(page.getByRole('button', { name: 'Create the first floor' })).toHaveCount(0)
	await expect(page.getByRole('button', { name: 'Open floor manager' })).toBeVisible()
})

test('the workspace can be exported as a JSON file', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('button', { name: 'Open workspace import and export' })).toBeVisible()

	await page.getByRole('button', { name: 'Open workspace import and export' }).click()
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export workspace' }).click(),
	])

	expect(download.suggestedFilename()).toMatch(/^blueprint-\d{4}-\d{2}-\d{2}\.json$/)
})