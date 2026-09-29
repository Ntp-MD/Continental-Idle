import { test } from 'vitest'
import assert from 'node:assert/strict'
import { payrollCents, settleDay, staffHeadcount, STAFF_DAY_WAGE_CENTS } from '../../src/blueprint-editor/domain/economy/upkeep'
import { createTakingsLedger, formatTakings, TAKINGS_DAY_SECONDS } from '../../src/blueprint-editor/domain/economy/takings'

const roles = new Set(['role-guest', 'role-tourist'])
const isVisitor = (roleId: string) => roles.has(roleId)

test('staff are the roles that hold a duty, not the roles that visit', () => {
	assert.equal(
		staffHeadcount([{ roleId: 'role-guest', count: 300 }, { roleId: 'role-housekeeping', count: 12 }, { roleId: 'role-reception', count: 3 }], isVisitor),
		15,
	)
	assert.equal(staffHeadcount([{ roleId: 'role-guest', count: 500 }], isVisitor), 0, 'a crowd of only guests costs no wages')
})

test('payroll is the declared day wage times the people on it', () => {
	assert.equal(settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 4 }).payrollCents, STAFF_DAY_WAGE_CENTS * 4)
	assert.equal(settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 0 }).payrollCents, 0)
})

test('a day that covers its payroll reports no runway, because it needs none', () => {
	const day = settleDay({ bankCents: 1_000, incomePerDayCents: STAFF_DAY_WAGE_CENTS * 10 + 500, staffHeadcount: 10 })
	assert.equal(day.profitCents, 500)
	assert.equal(day.selfFunding, true)
	assert.equal(day.runwayDays, null)
})

test('a loss-making day counts whole days of bank left', () => {
	// 12 staff, nothing earned: burn is 12 wages, bank covers one of those days and a fraction.
	const day = settleDay({ bankCents: STAFF_DAY_WAGE_CENTS * 12 + 100, incomePerDayCents: 0, staffHeadcount: 12 })
	assert.equal(day.profitCents, -STAFF_DAY_WAGE_CENTS * 12)
	assert.equal(day.selfFunding, false)
	assert.equal(day.runwayDays, 1, 'a fraction of a day is not a day of runway')
})

test('a broken deployment entry cannot pay the player', () => {
	assert.equal(staffHeadcount([{ roleId: 'role-security', count: -5 }], isVisitor), 0)
	assert.equal(settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: -4 }).payrollCents, 0)
	assert.equal(settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 2.9 }).payrollCents, STAFF_DAY_WAGE_CENTS * 2)
})

test('an empty bank facing a loss is out of money today, not in a negative number of days', () => {
	const day = settleDay({ bankCents: 0, incomePerDayCents: 0, staffHeadcount: 3 })
	assert.equal(day.runwayDays, 0)
	assert.equal(day.selfFunding, false)
})

test('pricing the crowd is what makes a dense plan look expensive', () => {
	// The same measured income, gross, read against two deployments of the same lobby.
	const income = STAFF_DAY_WAGE_CENTS * 20
	const lean = settleDay({ bankCents: 0, incomePerDayCents: income, staffHeadcount: 8 })
	const padded = settleDay({ bankCents: 0, incomePerDayCents: income, staffHeadcount: 32 })
	assert.equal(lean.selfFunding, true)
	assert.equal(padded.selfFunding, false, 'the surplus was only ever the unpaid half of the crowd')
	assert.equal(padded.profitCents, income - STAFF_DAY_WAGE_CENTS * 32)
})

test('a break-even day is self-funding, not out of money', () => {
	const day = settleDay({ bankCents: STAFF_DAY_WAGE_CENTS * 5, incomePerDayCents: STAFF_DAY_WAGE_CENTS * 5, staffHeadcount: 5 })
	assert.equal(day.profitCents, 0)
	assert.equal(day.selfFunding, true, 'covering payroll exactly is not a loss')
	assert.equal(day.runwayDays, null, 'and it must not divide the bank by zero')
})

test('part of a day of runway is no day of runway', () => {
	const day = settleDay({ bankCents: STAFF_DAY_WAGE_CENTS * 2, incomePerDayCents: 0, staffHeadcount: 3 })
	assert.equal(day.profitCents, -STAFF_DAY_WAGE_CENTS * 3)
	assert.equal(day.runwayDays, 0, 'two of three wages is not a day')
})

test('a loss reads as a loss, not as a double-signed amount', () => {
	assert.equal(formatTakings(-12_050), '-120.50')
	assert.equal(formatTakings(12_050), '120.50')
	assert.equal(formatTakings(0), '0.00')
})

function chargedLedger(chargeHeads: number): ReturnType<typeof createTakingsLedger> {
	return createTakingsLedger({
		ticksPerSecond: 60,
		isVisitor: () => true,
		dailyChargeCents: () => payrollCents(chargeHeads),
	})
}

/** One day of the ledger's own clock, so the day book rolls exactly once. */
const ONE_DAY = [[], TAKINGS_DAY_SECONDS * 60, () => undefined] as const

test('a closed hotel day pays the staff it deployed', () => {
	const book = chargedLedger(2)
	book.deposit(payrollCents(5))
	book.ingest(...ONE_DAY)
	const tally = book.snapshot()
	assert.equal(tally.daysCompleted, 1)
	assert.equal(tally.bankCents, payrollCents(3), 'five wages in, two paid out')
	assert.equal(tally.carriedCents, payrollCents(3), 'the carried balance follows the bank down')
})

test('payroll the bank cannot cover is written off, never turned into debt or minted back', () => {
	const book = chargedLedger(3)
	book.deposit(payrollCents(1))
	book.ingest(...ONE_DAY)
	assert.equal(book.snapshot().bankCents, 0, 'the bank floors at zero')
	book.reset()
	assert.equal(book.snapshot().bankCents, 0, 'a reset must not restore money payroll already took')
})

test('a day that earns exactly its payroll ends level', () => {
	const book = chargedLedger(1)
	book.ingest(...ONE_DAY)
	assert.equal(book.snapshot().daysCompleted, 1, 'an empty bank still closes the day')
	assert.equal(book.snapshot().bankCents, 0)
})

