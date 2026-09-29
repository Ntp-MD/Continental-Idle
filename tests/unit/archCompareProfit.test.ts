import { test } from 'vitest'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { economyFromReport, economyKpis, measureOption, PROFIT_KEY, rankOptions, RANKED_KEYS, WEIGHT_PROFILES } from '../../scripts/arch/compare'
import { FIXTURES, fixtureToDataFile } from '../../scripts/arch/fixtures'
import { measureTakings } from '../../scripts/arch/takings'
import { TAKINGS_DAY_SECONDS } from '../../src/blueprint-editor/domain/economy/takings'
import { NPC_ENGINE_TICKS_PER_SECOND } from '../../src/engine/npc'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const STORE = path.join(ROOT, 'src/blueprint-editor/data/blueprint-data.json')

function tmpDir(prefix: string): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

/** A clean fixture is the cheapest payload `measureOption` can evaluate without a crowd run. */
function goodPlanPath(dir: string): string {
	const fixture = FIXTURES.find(candidate => candidate.polarity === 'good')
	assert.ok(fixture, 'no good fixture in the arch library')
	const file = path.join(dir, `${fixture!.id}.json`)
	fs.writeFileSync(file, `${JSON.stringify(fixtureToDataFile(fixture!), null, 1)}\n`)
	return file
}

const BUSY_BUT_STAFFED = { incomePerDayCents: 90_000, payrollPerDayCents: 120_000, profitPerDayCents: -30_000, runwayDays: 3 }
const QUIET_AND_CHEAP = { incomePerDayCents: 60_000, payrollPerDayCents: 20_000, profitPerDayCents: 40_000, runwayDays: null }

test('candidates are ranked on profit per day, not on gross takings', () => {
	const dir = tmpDir('arch-compare-profit-')
	try {
		const plan = goodPlanPath(dir)
		// Same geometry on both sides: every spatial metric then has a zero span and cannot decide
		// the order, so the only thing that can move the ranking is the money.
		const options = [measureOption('A', plan, BUSY_BUT_STAFFED), measureOption('B', plan, QUIET_AND_CHEAP)]
		for (const option of options) assert.ok(!option.disqualified, `${option.name} blocked by a critical finding`)

		for (const profile of Object.keys(WEIGHT_PROFILES)) {
			const order = rankOptions(options, profile)
			assert.equal(order.order[0]?.name, 'B', `${profile}: the plan that keeps more must lead`)
			assert.ok(options.some(o => o.kpis.some(k => k.key === PROFIT_KEY)), 'profit is not a metric at all')
		}
		assert.ok(RANKED_KEYS.includes(PROFIT_KEY), `${PROFIT_KEY} is not in the ranked list`)
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
}, 60_000)

test('an option nobody priced is never scored as if it earned nothing', () => {
	const dir = tmpDir('arch-compare-partial-')
	try {
		const plan = goodPlanPath(dir)
		const baseline = [measureOption('A', plan), measureOption('B', plan)]
		for (const profile of Object.keys(WEIGHT_PROFILES)) {
			const unpriced = rankOptions(baseline, profile)
			const halfPriced = rankOptions([measureOption('A', plan, QUIET_AND_CHEAP), measureOption('B', plan)], profile)
			// B has no money because no crowd ran over it, not because it made none: its score must not
			// move, and it must not be able to win on a metric it never reported.
			assert.deepEqual(halfPriced.order, unpriced.order, `${profile}: an absent measurement changed the score`)
		}
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
}, 60_000)

test('the money columns are the numbers `arch takings` printed', () => {
	const dir = tmpDir('arch-compare-report-')
	try {
		const payload = path.join(dir, 'payload.json')
		fs.copyFileSync(STORE, payload)
		const report = measureTakings(payload, { ticks: TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND, agents: 40 })
		// The field the ranking reads is the one payroll was charged against, so gross can never be
		// substituted for net at the mapping edge.
		assert.equal(report.profitPerDayCents + report.payrollCents, Math.round(report.netPerDayCents))
		const economy = economyFromReport(report)
		assert.equal(economy.incomePerDayCents, report.netPerDayCents)
		assert.equal(economy.payrollPerDayCents, report.payrollCents)
		assert.equal(economy.profitPerDayCents, report.profitPerDayCents)
		// A calm run can leave gross and net numerically equal (no services, or standing at 1.00), so
		// the substitution this guards is proven on the same report with its own numbers separated.
		const separated = { ...report, perDayCents: 90_000, netPerDayCents: 45_000, payrollCents: 20_000, profitPerDayCents: 25_000 }
		assert.equal(economyFromReport(separated).incomePerDayCents, 45_000, 'the ranking is fed gross takings')
		const kpis = economyKpis(economy)
		assert.deepEqual(kpis.map(kpi => kpi.key), ['incomePerDay', 'payrollPerDay', 'profitPerDay'])
		assert.equal(kpis.find(kpi => kpi.key === PROFIT_KEY)?.value, report.profitPerDayCents)
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
}, 60_000)
