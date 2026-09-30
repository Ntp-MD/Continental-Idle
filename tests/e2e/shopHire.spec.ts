import { test, expect } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { deployWorkspace, importWorkspace, type WorkspaceData } from './canvasFixtures'

/**
 * The other half of the outflow, clicked: a head is hired off the bank the fixtures were traded in for,
 * and the payroll readout moves the moment it lands. `shopTrade.spec.ts` proves a fixture both ways;
 * this proves that money reaching the bank is *spendable* on the thing the day book charges for, so the
 * loop closes on a screen instead of only in jsdom.
 *
 * A head costs `STAFF_DAY_WAGE_CENTS x STAFF_HIRE_COST_DAYS` = 300.00 and adds one day's wage (60.00) to
 * every closed day. The bank is filled by trading in fixtures at 12.75 each, which is why the imported
 * house carries twenty-four of them: the test earns its money through the game's own rules.
 */
const FIXTURE_REFUND = '12.75'
const HIRE_PRICE = '300.00'
const FIXTURE_COUNT = 24

/** The money the panel prints is grouped with commas; arithmetic needs it plain. */
function moneyValue(text: string): number {
	return Number(text.replace(/[^0-9.]/g, ''))
}

function moneyText(cents: number): string {
	return (cents / 1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function addBarCounters(data: WorkspaceData): void {
	// The plate is the spec's own: the shipped furniture is cleared so the money below follows from the
	// fixtures this file puts down, whatever the starter lobby is furnished with.
	const objects: Record<string, unknown>[] = []
	for (let i = 0; i < FIXTURE_COUNT; i++) {
		const col = i % 6
		const row = Math.floor(i / 6)
		objects.push({ id: `obj-e2e-bar-${i}`, type: 'bar-counter', x: 220 + col * 120, y: 220 + row * 40, rotation: 0 })
	}
	data.layout.floors[0].objects = objects
}

/** How many heads of this role the button says are deployed - the readout the hire must move. */
function deployedCount(text: string): number {
	return Number(/\((\d+) deployed/.exec(text)?.[1] ?? -1)
}

test('trading fixtures in pays for a head, and the payroll says so', async ({ page }) => {
	const dir = mkdtempSync(path.join(tmpdir(), 'ci-hire-'))
	try {
		await page.goto('/')
		await importWorkspace(page, dir, addBarCounters)
		await deployWorkspace(page)
		await page.getByRole('button', { name: 'Pause NPC simulation' }).click()
		await expect(page.getByRole('status').filter({ hasText: 'Paused' })).toBeVisible()

		const row = page.locator('.form__row').filter({ has: page.getByText('Bar Counter') })
		await expect(row.getByText(`${FIXTURE_COUNT} held`)).toBeVisible()
		const hire = page.getByRole('button', { name: new RegExp(`^Hire .+ for ${HIRE_PRICE}`) }).first()
		await expect(hire).toBeVisible()
		// Nothing earned, nothing to spend: the control refuses before any money is asked of the bank.
		await expect(hire).toBeDisabled()

		const sell = row.getByRole('button', { name: /^Sell one for/ })
		await expect(sell).toHaveText(new RegExp(`Sell one for ${FIXTURE_REFUND}`))
		for (let i = 0; i < FIXTURE_COUNT; i++) {
			// The sale serialises on the shop's own busy guard, so each click waits for the store's write.
			await sell.click()
		}
		// Twenty-four refunds of 12.75 is 306.00, one hire and 6.00 of change.
		await expect(sell).toHaveCount(0)
		// Exactly the fixtures went and nothing else: a sale of one named object took only that one, and
		// the plate the spec laid down is now empty.
		await expect(page.locator('[data-obj-id]')).toHaveCount(0)
		await expect(row.getByText(/The bank holds/)).toHaveCount(0)
		await expect(hire).toBeEnabled()

		const staffPaid = page.locator('.form__hint', { hasText: 'Staff paid' }).locator('b')
		const payrollPerDay = page.locator('.form__hint', { hasText: 'Payroll per day' }).locator('b')
		await expect(staffPaid).toBeVisible()
		const headsBefore = Number(await staffPaid.innerText())
		const payrollBefore = moneyValue(await payrollPerDay.innerText())
		const deployedBefore = deployedCount(await hire.innerText())
		expect(deployedBefore, `the hire button does not say how many are deployed: ${await hire.innerText()}`).toBeGreaterThanOrEqual(0)

		await hire.click()
		await expect(page.getByText(`Hired staff for ${HIRE_PRICE}`).first()).toBeVisible()
		// The head joins the payroll the ledger bills on every closed day, and the same button now counts
		// one more deployed - the wage step is a day's wage, 60.00.
		await expect(staffPaid).toHaveText(String(headsBefore + 1))
		await expect(payrollPerDay).toHaveText(moneyText(payrollBefore + 60))
		// The row also names the duty the head fills, so a hire is bought against a post, not a number.
		await expect(hire).toHaveText(/deployed · /)
		await expect(hire).toHaveText(new RegExp(`\\(${deployedBefore + 1} deployed`))

		// The cost side has a lever too: releasing is free, and the wage comes back off on the spot.
		const release = hire.locator('xpath=ancestor::div[1]').getByRole('button', { name: 'Let one go' })
		await expect(release).toBeVisible()
		await release.click()
		await expect(page.getByText(/Let one .+ go - the wage comes off/).first()).toBeVisible()
		await expect(staffPaid).toHaveText(String(headsBefore))
		await expect(payrollPerDay).toHaveText(moneyText(payrollBefore))
		await expect(hire).toHaveText(new RegExp(`\\(${deployedBefore} deployed`))
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
})
