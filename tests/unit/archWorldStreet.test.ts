import { test } from 'vitest'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLobby } from '../../scripts/arch/build-lobby'
import { formatTakingsReport, measureTakings } from '../../scripts/arch/takings'
import { NPC_ENGINE_TICKS_PER_SECOND } from '../../src/engine/npc'
import { TAKINGS_DAY_SECONDS } from '../../src/blueprint-editor/domain/economy/takings'
import { ANONYMOUS_FACTION } from '../../src/blueprint-editor/domain/economy/standing-world'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const STORE = path.join(ROOT, 'src/blueprint-editor/data/blueprint-data.json')
const PLAN = path.join(ROOT, 'scripts/arch/lobby/services-probe.txt')
/** The plate the probe is drawn on, so the build does not resize the authored workspace. */
const COLS = 116
const ROWS = 76
const TILE = 25
const DECLARED_PER_DAY = 150

function probeCopy(): string {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'arch-street-')), 'payload.json')
	const raw = JSON.parse(fs.readFileSync(STORE, 'utf8'))
	raw.layout.canvas.width = COLS * TILE
	raw.layout.canvas.height = ROWS * TILE
	raw.layout.canvas.tileSize = TILE
	// The working seed is a whole building now: eleven floors whose paint is measured on a different
	// canvas than this probe draws, so a copy that keeps them all sends the arrivals looking at ten
	// empty plates and the door reads as nobody's. The probe measures one floor's street, so the copy
	// is that one floor, and its staff stand on it.
	raw.layout.floors = [raw.layout.floors[0]]
	raw.npcConfig.pool = raw.npcConfig.pool.map((entry: { floorIds?: string[] }) => ({ ...entry, floorIds: ['floor-g'] }))
	fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`)
	// The probe plan, built into the copy: the authored floor bills almost nothing, so measuring the
	// store without this proves only that an empty room has no street.
	const built = buildLobby(file, PLAN, true)
	assert.ok(built.fixtures > 0, 'the probe plan placed nothing')
	return file
}

test('the offline run measures a street of somebody\'s clients', () => {
	const file = probeCopy()
	const report = measureTakings(file, {
		ticks: TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND,
		agents: 20,
		arrivals: true,
		arrivalsPerDay: DECLARED_PER_DAY,
	})
	const street = report.street
	assert.ok(street, 'a footfall run reported no street at all')
	assert.ok(street.released > 0, 'nobody was released, so the roster never ran')
	assert.equal(street.standings.length, 4, 'the world does not keep every house it owes')
	// The claim this file exists for: the offline run releases people and the door is driven by the
	// roster. `arch takings` used to know nothing of any of it, so a plan could be ranked on a street
	// no played house would ever have walked. Whether a given night then judges a house depends on
	// services completing inside the horizon, which the CLI measures; what must never vary is that
	// every house the world holds actually sent somebody.
	for (const house of street.standings) {
		assert.ok(house.visits > 0, `${house.id} never sent anyone, so the roster is not driving the door`)
	}
	for (const row of report.clientsByFaction) {
		const house = street.standings.find(entry => entry.id === row.faction)
		assert.ok(house && house.visits > 0, `${row.faction} was billed without ever sending anyone`)
	}
	assert.ok(report.served > 0, 'the probe served nobody, so the faction book says nothing')
	// The sharp half: a named house was served. Binding every arrival to nobody would still leave the
	// roster busy, the street reported and the nights judged - so the count that proves the door works
	// is a client billed to a family the world actually released.
	assert.ok(
		report.clientsByFaction.some(row => row.faction !== ANONYMOUS_FACTION),
		`every arrival was billed as a stranger: ${JSON.stringify(report.clientsByFaction)}`,
	)
	const judged = street.standings.reduce((sum, entry) => sum + entry.served + entry.lost, 0)
	assert.ok(judged > 0, `no night was judged offline: ${JSON.stringify(street.standings)}`)
	// A calm day leaves nobody estranged, so the street is still owed the crowd the brief declared.
	assert.deepEqual(street.estranged, [], `a one-day run offended a house: ${street.estranged.join(', ')}`)
	assert.equal(street.expectedWalkIns, DECLARED_PER_DAY, 'a welcome house is owed something other than its declared crowd')
	assert.ok(street.returningShare >= 0 && street.returningShare <= 1)
	// The number the flow reads is the world's number, not a copy captured at deploy.
	assert.equal(report.flow?.perDay, street.expectedWalkIns, 'the flow is reading its own rate, not the street\'s')
	assert.ok(formatTakingsReport(report).includes('the street:'), 'the report never prints the street it measured')
	assert.ok(/standings \(nights judged\)/.test(formatTakingsReport(report)), 'the standings line is missing')
}, 120_000)

test('a plan measured without footfall has no street, and its guests stay strangers', () => {
	const file = probeCopy()
	const report = measureTakings(file, {
		ticks: 2 * TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND,
		agents: 40,
	})
	// The control for the test above: with no door and no releases there is no world to report, and
	// every service the standing crowd completes belongs to nobody. Without this half, the footfall
	// assertions would only be proving that an empty report has no factions in it.
	assert.equal(report.street, null, 'a standing crowd was reported as if the street had delivered it')
	assert.ok(report.served > 0, 'the control run billed nothing, so it says nothing about attribution')
	assert.deepEqual(
		[...new Set(report.clientsByFaction.map(row => row.faction))],
		[ANONYMOUS_FACTION],
		'a stranger was billed as some house\'s client',
	)
}, 120_000)
