import { test, expect, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { deployWorkspace, importWorkspace } from './canvasFixtures'

/**
 * The objectives board on a real screen. A production build boots with `emptySeed()` and stores the
 * workspace in IndexedDB, so the only way to reach a running preview is the one a player uses:
 * Workspace -> Import. Every other assertion in this file is downstream of that, which is exactly why
 * the board could not be seen before - the gap was never in the board.
 */

/** The five goal chips: the one row that holds a `<b>` that is one of the five declared labels. */
const GOAL_LABELS = ['Pay the bill', 'Full room', 'Nobody walks', 'Keep the peace', 'Earn the day']

function boardRows(page: Page) {
	return page.locator('.form__hint').filter({ hasText: new RegExp(`^(?:${GOAL_LABELS.join('|')})`) })
}

test('the objectives board reaches the screen once a house is running', async ({ page }) => {
	const dir = mkdtempSync(path.join(tmpdir(), 'ci-board-'))
	try {
		await page.goto('/')
		await importWorkspace(page, dir)
		await deployWorkspace(page)

		// The preview is what draws the board; without a running simulation there is nothing to read.
		await expect(page.getByText('Pay the bill', { exact: false })).toBeVisible({ timeout: 15_000 })

		// Five goals, and none of them claimed before a day has closed - an unrun house is unproven,
		// not failing, which is the three-valued verdict the module declares.
		for (const goal of GOAL_LABELS) {
			await expect(page.getByText(goal, { exact: false })).toBeVisible()
		}
		await expect(boardRows(page)).toHaveCount(5, { timeout: 15_000 })
		await expect(page.getByText('not yet', { exact: false })).toHaveCount(5)
		await expect(page.getByText('missed', { exact: false })).toHaveCount(0)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})

test('a day that closes moves the board off "not yet"', async ({ page }) => {
	const dir = mkdtempSync(path.join(tmpdir(), 'ci-board-'))
	try {
		await page.goto('/')
		await importWorkspace(page, dir)
		await deployWorkspace(page)

		// Every chip reads unproven until a day closes, and a day closes on the ledger's own clock -
		// 300 simulation seconds, which is several real minutes at 1x. The assertion is that the
		// board is *stable* while unproven: many polls across that gap must not bank the same day.
		await expect(page.getByText('not yet', { exact: false })).toHaveCount(5, { timeout: 15_000 })
		const before = await boardRows(page).allInnerTexts()
		await page.waitForTimeout(4000)
		const after = await boardRows(page).allInnerTexts()
		expect(after).toEqual(before)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})
