import { test } from 'vitest'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLobby } from '../../scripts/arch/build-lobby'
import { measureTakings } from '../../scripts/arch/takings'
import { NPC_ENGINE_TICKS_PER_SECOND } from '../../src/engine/npc'
import { TAKINGS_DAY_SECONDS } from '../../src/blueprint-editor/domain/economy/takings'
import { readBlueprintDataFile } from '../../src/blueprint-editor/store/schemaMigration'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const STORE = path.join(ROOT, 'src/blueprint-editor/data/blueprint-data.json')
const PLAN = path.join(ROOT, 'scripts/arch/lobby/plan-g.txt')

// The plan is drawn on a 116 x 76 plate at 0.5 m tiles; the workspace canvas is whatever the
// user last set, so the build always happens on a probe copy at the plan's own size.
const PLAN_COLS = 116
const PLAN_ROWS = 76
const PLAN_TILE = 25

function probeCopy(): string {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'arch-build-')), 'payload.json')
	const raw = JSON.parse(fs.readFileSync(STORE, 'utf8'))
	raw.layout.canvas.width = PLAN_COLS * PLAN_TILE
	raw.layout.canvas.height = PLAN_ROWS * PLAN_TILE
	raw.layout.canvas.tileSize = PLAN_TILE
	fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`)
	return file
}

test('arch build writes a payload the editor can actually load', () => {
	const file = probeCopy()
	try {
		const built = buildLobby(file, PLAN, true)
		assert.ok(built.fixtures > 0, 'the plan placed nothing')
		const loaded = readBlueprintDataFile(JSON.parse(fs.readFileSync(file, 'utf8')))
		const floor = loaded.layout.floors.find(candidate => candidate.id === 'floor-g')
		assert.ok(floor, 'floor-g missing after the build')
		assert.equal(floor.objects.length, built.fixtures)
		assert.ok(floor.walkable?.tileStates, 'no tile grid')
		assert.ok(floor.walkable?.walkableGrid, 'no boolean grid')
		// The two grid fields are derived from each other: writing one and leaving the other
		// is what made the built file unloadable, and ingress is the only place that notices.
		const states = floor.walkable.tileStates!
		const grid = floor.walkable.walkableGrid!
		assert.equal(grid.length, states.length)
		assert.ok(states.every((row, r) => row.every((cell, c) => grid[r][c] === (cell === 'walkable' || cell === 'door'))),
			'walkableGrid disagrees with tileStates')
	} finally {
		fs.rmSync(path.dirname(file), { recursive: true, force: true })
	}
})

test('the lobby plan is still covered by the asset library', () => {
	const file = probeCopy()
	try {
		// buildLobby throws on the first unknown asset id, so a green build is the drift check.
		assert.ok(buildLobby(file, PLAN, false).fixtures > 0)
	} finally {
		fs.rmSync(path.dirname(file), { recursive: true, force: true })
	}
})

test('footfall mode runs the declared arrival count through the street doors', () => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'arch-footfall-')), 'payload.json')
	const plan = path.join(ROOT, 'scripts/arch/lobby/services-probe.txt')
	const ticks = 1500
	try {
		const raw = JSON.parse(fs.readFileSync(STORE, 'utf8'))
		fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`)
		buildLobby(file, plan, true)
		const report = measureTakings(file, { ticks, arrivals: true, arrivalsPerDay: 500 })
		assert.ok(report.flow, 'the flow report is missing')
		assert.equal(report.flow.perDay, 500, 'the injected footfall must reach the flow')
		assert.ok(report.flow.entrances > 0, 'the probe plan must keep a street door, or arrivals cannot enter')
		// Exact arithmetic, not a sample: 500 a day over a 300 s day is one arrival every
		// (daySeconds x ticksPerSecond / arrivalsPerDay) ticks, and no fractional arrival may be
		// dropped on the way.
		assert.equal(report.flow.spawned, Math.floor((ticks * 500) / (TAKINGS_DAY_SECONDS * NPC_ENGINE_TICKS_PER_SECOND)))
		// Visitors from the pool are replaced by arrivals; staff must still be deployed to serve them.
		assert.ok(report.agents > 0, 'staff stopped deploying')
		assert.ok(report.skipped.some(row => row.key.startsWith('replaced-by-arrivals')), 'the standing guest crowd was not replaced')
		// Throughput comparison lives in the tool, not here: `arch takings --arrivals` on plan-g
		// turns over 410 services/day against 40 for a standing crowd (82% vs 8% of the brief).
	} finally {
		fs.rmSync(path.dirname(file), { recursive: true, force: true })
	}
}, 30_000)
