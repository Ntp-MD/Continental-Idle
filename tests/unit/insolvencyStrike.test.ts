import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
	STAFF_MIN_CREW,
	settleStrike,
	staffOnDuty,
	strikeFromClose,
} from '../../src/blueprint-editor/domain/economy/insolvency'
import { createTakingsLedger, type TakingsResolver } from '../../src/blueprint-editor/domain/economy/takings'
import { settleDay } from '../../src/blueprint-editor/domain/economy/upkeep'

const WAGE = 6_000
const noSource: TakingsResolver = () => undefined

test('a day the bank cannot pay keeps the minimum crew and sends the rest home', () => {
	const strike = settleStrike({ bankCents: 0, staffHeadcount: 32, wageCents: WAGE })
	assert.equal(strike.onDuty, STAFF_MIN_CREW)
	assert.equal(strike.offDuty, 32 - STAFF_MIN_CREW)
	assert.equal(strike.insolvent, true)
})

test('the crew is capped at the deployment, and a full bank keeps every head', () => {
	assert.equal(settleStrike({ bankCents: 32 * WAGE, staffHeadcount: 32, wageCents: WAGE }).offDuty, 0)
	assert.equal(settleStrike({ bankCents: 32 * WAGE - 1, staffHeadcount: 32, wageCents: WAGE }).offDuty, 1)
	// A bank that could pay a hundred heads must not draft more than the deployment holds: without
	// the cap the surplus comes out negative and reads as nobody being off duty.
	const rich = settleStrike({ bankCents: 100 * WAGE, staffHeadcount: 5, wageCents: WAGE })
	assert.equal(rich.onDuty, 5)
	assert.equal(rich.offDuty, 0)
	assert.equal(staffOnDuty(100 * WAGE, 5, WAGE), 5)
	// A deployment no bigger than the minimum crew cannot strike: there is nobody to send home and
	// still open the lobby, so insolvency reads as false rather than as a phantom penalty.
	const tiny = settleStrike({ bankCents: 0, staffHeadcount: STAFF_MIN_CREW, wageCents: WAGE })
	assert.equal(tiny.offDuty, 0)
	assert.equal(tiny.insolvent, false)
	assert.equal(staffOnDuty(0, 0, WAGE), 0)
})

test('a partial bank keeps whole heads, never a fraction of one', () => {
	const strike = settleStrike({ bankCents: 18_000 + WAGE - 1, staffHeadcount: 10, wageCents: WAGE })
	assert.equal(strike.onDuty, 3)
	assert.equal(strike.offDuty, 7)
})

test('the strike is read off the closed day, not off what is left in the bank', () => {
	// The measured designed lobby: 633.00/day of income against 1,920.00/day for 32 staff, so the
	// bank went entirely into wages and 633.00 bought 10 heads.
	const short = strikeFromClose({
		payrollCents: 192_000,
		unpaidCents: 192_000 - 63_300,
		staffHeadcount: 32,
		wageCents: WAGE,
	})
	assert.equal(short.onDuty, 10)
	assert.equal(short.offDuty, 22)
	// A day that paid its bill in full brings everybody back, even though the bank is now thinner
	// than the payroll was: the measure is what wages were funded from, not what is left.
	const solvent = strikeFromClose({ payrollCents: 30_000, unpaidCents: 0, staffHeadcount: 5, wageCents: WAGE })
	assert.equal(solvent.onDuty, 5)
	assert.equal(solvent.offDuty, 0)
	assert.equal(solvent.insolvent, false)
})

test('a closed day records the payroll it could not pay', () => {
	const ledger = createTakingsLedger({
		ticksPerSecond: 1,
		daySeconds: 10,
		isVisitor: () => true,
		dailyChargeCents: () => 10_000,
	})
	ledger.deposit(3_000)
	ledger.ingest([], 10, noSource)
	let close = ledger.snapshot()
	assert.equal(close.daysCompleted, 1)
	assert.equal(close.lastDayPayrollCents, 10_000)
	assert.equal(close.lastDayUnpaidCents, 7_000, 'the part of the wage bill the bank did not cover')
	assert.equal(close.bankCents, 0, 'unpaid wages are written off, never carried as debt')

	// A day that covers the bill must clear the state, or the strike would last forever.
	ledger.deposit(20_000)
	ledger.ingest([], 20, noSource)
	close = ledger.snapshot()
	assert.equal(close.daysCompleted, 2)
	assert.equal(close.lastDayUnpaidCents, 0)
	assert.equal(close.bankCents, 10_000)

	ledger.reset()
	assert.equal(ledger.snapshot().lastDayUnpaidCents, 0, 'a re-deploy does not inherit the shortfall')
})

test('wages nobody was paid are reported as unpaid, not silently as profit', () => {
	const insolvent = settleDay({ bankCents: 3_000, incomePerDayCents: 0, staffHeadcount: 2 })
	assert.equal(insolvent.payrollCents, 12_000)
	assert.equal(insolvent.unpaidWagesCents, 9_000)
	assert.equal(insolvent.insolvent, true)

	const solvent = settleDay({ bankCents: 12_000, incomePerDayCents: 12_000, staffHeadcount: 2 })
	assert.equal(solvent.unpaidWagesCents, 0)
	assert.equal(solvent.insolvent, false)
	assert.equal(solvent.selfFunding, true)
})
