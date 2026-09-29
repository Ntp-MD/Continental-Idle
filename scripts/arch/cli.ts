/**
 * cli.ts - the Architecture Agent Harness command surface.
 *
 *   arch world    derive and print the persistent world model (site/floors/rooms/doors/portals/relations)
 *   arch render   draw a floor: ascii for the inner loop, png for the real look, svg for reports
 *   arch metrics  the measured KPI vector with bands and band sources
 *   arch eval     run the independent validators and emit a findings report
 *   arch compare  A/B/C: same programme, same metrics, no hidden winner
 *   arch revise   apply a repair on the blast-radius ladder, then re-render and re-evaluate
 *   arch build    draw floor-g from the tile-exact plan file and write it into the payload
 *   arch loop     render -> eval -> revise, repeated, with a before/after contact sheet
 *
 * The evaluator stages never read what the generator claimed; they recompute from tiles.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findFloor, loadWorld, METRES_PER_TILE, type WorldBundle } from './world'
import { renderAscii, renderContactSheet, renderPng, renderSvg, type RenderOptions } from './render'
import { buildingKpis, floorKpis, formatRegressions, kpiTable, regressions } from './metrics'
import { evaluate, formatReport } from './evaluate'
import { formatComparison, measureOption } from './compare'
import { formatMinimality, formatRevision, metricDiff, probeMinimality, revise, type Patch } from './revise'
import { runSelfTest } from './selftest'
import { buildLobby } from './build-lobby'
import { formatTakingsReport, measureTakings } from './takings'
import type { Cell, Finding } from './types'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
export const DEFAULT_DATA = path.join(ROOT, 'src/blueprint-editor/data/blueprint-data.json')
export const DEFAULT_OUT = path.join(HERE, 'out')

interface Args {
	flags: Map<string, string>
	booleans: Set<string>
	positionals: string[]
}

export function parseArgs(argv: readonly string[]): Args {
	const flags = new Map<string, string>()
	const booleans = new Set<string>()
	const positionals: string[] = []
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i]
		if (!token.startsWith('--')) {
			positionals.push(token)
			continue
		}
		const name = token.slice(2)
		const next = argv[i + 1]
		if (next === undefined || next.startsWith('--')) {
			booleans.add(name)
			continue
		}
		flags.set(name, next)
		i++
	}
	return { flags, booleans, positionals }
}

function inputPath(args: Args): string {
	const explicit = args.flags.get('in')
	if (explicit) return path.resolve(explicit)
	// A positional payload used to be ignored, so `arch eval other.json` reported on the default file
	// and looked exactly like a real result. Name the input, or say nothing.
	if (args.positionals.length > 1) {
		throw new Error(`one payload expected, got ${args.positionals.length} (${args.positionals.join(', ')}); use --in <file> for the input and --out for the result`)
	}
	return path.resolve(args.positionals[0] ?? DEFAULT_DATA)
}

function parseCells(raw: string | undefined): Cell[] {
	if (!raw) return []
	return raw.split(';').map(part => part.trim()).filter(Boolean).map(part => {
		const [x, y] = part.split(',').map(Number)
		return { x, y }
	}).filter(cell => Number.isFinite(cell.x) && Number.isFinite(cell.y))
}

function parseZoom(raw: string | undefined): RenderOptions['zoom'] {
	if (!raw) return undefined
	const [x0, y0, x1, y1] = raw.split(',').map(Number)
	if (![x0, y0, x1, y1].every(Number.isFinite)) throw new Error(`--zoom expects x0,y0,x1,y1, got "${raw}"`)
	return { x0, y0, x1, y1 }
}

function loadFindings(args: Args): Finding[] {
	const file = args.flags.get('findings')
	if (!file) return []
	return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as Finding[]
}

function ensureOut(dir: string): void {
	fs.mkdirSync(dir, { recursive: true })
}

function renderOptions(args: Args): RenderOptions {
	const options: RenderOptions = {
		scale: args.flags.has('scale') ? Number(args.flags.get('scale')) : 8,
		zoom: parseZoom(args.flags.get('zoom')),
		findings: loadFindings(args),
		markCells: parseCells(args.flags.get('cells')),
	}
	if (args.booleans.has('no-rooms')) options.rooms = false
	if (args.booleans.has('no-furniture')) options.furniture = false
	if (args.booleans.has('no-portals')) options.portals = false
	if (args.booleans.has('no-labels')) options.labels = false
	if (args.booleans.has('no-grid')) options.grid = false
	return options
}

function worldSummary(bundle: WorldBundle): string {
	const { world } = bundle
	const lines: string[] = [
		`# World model - ${world.source}`,
		`canvas ${world.canvas.width}x${world.canvas.height} px / tile ${world.canvas.tileSize} px = ${world.canvas.cols}x${world.canvas.rows} tiles`,
		`scale ${world.scaleNote}`,
		`site street=${world.site.streetWidthTiles} tiles streetFloor=${world.site.streetFloorId ?? 'none'} facadeEdges=${world.site.facadeEdges.join('+')} north=${world.site.north} (declared, not derived)`,
		`floors ${world.floors.length}  relations ${world.relations.length}  portals on ${world.vertical.floorsWithPortals} floor(s)`,
		`floors without a portal: ${world.vertical.floorsWithoutPortals.join(', ') || 'none'}`,
		`portal stack drift: ${world.vertical.stackDrift.length ? JSON.stringify(world.vertical.stackDrift) : 'none'}`,
		'',
	]
	for (const floor of world.floors) {
		const typed = floor.rooms.filter(room => !room.isCorridor)
		const byType = new Map<string, number>()
		for (const room of typed) byType.set(room.typeId, (byType.get(room.typeId) ?? 0) + 1)
		lines.push(
			`## ${floor.label} (${floor.id}) index=${floor.index} street=${floor.isStreetFloor}`,
			`   grid ${floor.counts.gridTiles} tiles = ${floor.counts.roomTiles} occupied + ${floor.counts.circulationTiles} circulation + ${floor.counts.structureTiles} structure  reconciles=${floor.counts.reconciles}  unreachable=${floor.counts.unreachableTiles}`,
			`   rooms ${floor.rooms.length} (typed ${typed.length}, hall ${floor.rooms.length - typed.length})  doors ${floor.doors.length}  portals ${floor.portals.length}  furniture ${floor.furniture.length}`,
			`   types: ${[...byType.entries()].map(([id, n]) => `${id}=${n}`).join(' ') || 'none'}`,
			`   extent ${(floor.cols * METRES_PER_TILE).toFixed(1)} x ${(floor.rows * METRES_PER_TILE).toFixed(1)} m`,
		)
	}
	lines.push('', '## relationship graph (first 40 edges)')
	for (const relation of world.relations.slice(0, 40)) {
		lines.push(`   ${relation.kind.padEnd(12)} ${relation.from} <-> ${relation.to}  w=${relation.weight}`)
	}
	if (world.relations.length > 40) lines.push(`   ... ${world.relations.length - 40} more`)
	return lines.join('\n')
}

function cmdWorld(args: Args): number {
	const bundle = loadWorld(inputPath(args))
	if (args.booleans.has('json')) {
		const out = args.flags.get('out')
		const json = JSON.stringify(bundle.world, null, 1)
		if (out) {
			fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
			fs.writeFileSync(path.resolve(out), json)
			console.info(`wrote ${path.resolve(out)} (${(json.length / 1024).toFixed(0)} KB)`)
		} else console.info(json)
		return 0
	}
	console.info(worldSummary(bundle))
	return 0
}

function cmdRender(args: Args): number {
	const bundle = loadWorld(inputPath(args))
	const floor = findFloor(bundle.world, args.flags.get('floor'))
	const options = renderOptions(args)
	const outDir = path.resolve(args.flags.get('out-dir') ?? DEFAULT_OUT)
	const stem = args.flags.get('out') ?? path.join(outDir, `${floor.id}`)
	let wrote = false

	// An explicit format flag wins; a bare --out only implies PNG when it is not naming an SVG,
	// so `--svg --out plan.svg` stops producing a stray plan.svg.png next to it.
	const wantsSvg = args.booleans.has('svg')
	const wantsPng = args.booleans.has('png') || (args.flags.has('out') && !stem.endsWith('.svg') && !wantsSvg)

	if (args.booleans.has('ascii') || (!wantsPng && !wantsSvg)) {
		console.info(renderAscii(floor, bundle.world, options))
	}
	if (wantsPng) {
		ensureOut(path.dirname(stem))
		const { png, width, height } = renderPng(floor, options)
		const file = stem.endsWith('.png') ? stem : `${stem}.png`
		fs.writeFileSync(file, png)
		console.info(`png ${file} (${width}x${height})`)
		wrote = true
	}
	if (wantsSvg) {
		ensureOut(path.dirname(stem))
		const file = stem.endsWith('.svg') ? stem : `${stem}.svg`
		fs.writeFileSync(file, renderSvg(floor, options))
		console.info(`svg ${file}`)
		wrote = true
	}
	if (wrote) console.info('look at the picture before you judge the plan; the numbers are in arch metrics / arch eval')
	return 0
}

function cmdMetrics(args: Args): number {
	const bundle = loadWorld(inputPath(args))
	const wanted = args.flags.get('floor')
	const floors = wanted ? [findFloor(bundle.world, wanted)] : bundle.world.floors
	for (const floor of floors) console.info(`${kpiTable(floorKpis(bundle.world, floor), `${floor.label} (${floor.id})`)}\n`)
	console.info(`${kpiTable(buildingKpis(bundle.world), 'building')}\n`)
	return 0
}

function cmdEval(args: Args): number {
	const bundle = loadWorld(inputPath(args))
	const report = evaluate(bundle)
	const wanted = args.flags.get('floor')
	const scoped = wanted
		? { ...report, floors: report.floors.filter(floor => floor.floorId === wanted || floor.label === wanted) }
		: report
	const title = `Evaluation - ${bundle.world.source}${wanted ? ` (${wanted})` : ''}`
	const markdown = formatReport(scoped, title)

	// Lead with the shortest usable answer. The full report is evidence for a dispute, not the
	// deliverable - reading twenty rows to find one action is cost pushed onto the user.
	const listed = [...scoped.floors.flatMap(floor => floor.findings), ...scoped.building.findings]
	const blocking = listed.filter(finding => finding.severity === 'critical' || finding.severity === 'major')
	if (!blocking.length) console.info(`DONE: nothing blocks - ${listed.length} finding(s) below are advisory`)
	else {
		console.info(`DO THIS (${blocking.length} blocking):`)
		blocking.slice(0, 3).forEach((finding, i) => console.info(`  ${i + 1}. ${finding.id} ${finding.check} -> ${finding.correction.split(' - ')[0]}`))
	}

	const jsonOut = args.flags.get('json')
	if (jsonOut) {
		fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true })
		fs.writeFileSync(path.resolve(jsonOut), `${JSON.stringify(report, null, 1)}\n`)
		console.info(`json ${path.resolve(jsonOut)}`)
	}
	const mdOut = args.flags.get('md')
	if (mdOut) {
		fs.mkdirSync(path.dirname(path.resolve(mdOut)), { recursive: true })
		fs.writeFileSync(path.resolve(mdOut), `${markdown}\n`)
		console.info(`md ${path.resolve(mdOut)}`)
	}

	const findings = [...scoped.floors.flatMap(floor => floor.findings), ...scoped.building.findings]
	if (args.flags.has('png')) {
		const floor = findFloor(bundle.world, wanted)
		const stem = path.resolve(args.flags.get('png')!)
		ensureOut(path.dirname(stem))
		const { png, width, height } = renderPng(floor, { ...renderOptions(args), findings, scale: args.flags.has('scale') ? Number(args.flags.get('scale')) : 8 })
		fs.writeFileSync(stem, png)
		console.info(`png ${stem} (${width}x${height}) - findings drawn on the plan; look at it before you argue with the numbers`)
	}
	if (!jsonOut && !mdOut) console.info(markdown)
	else console.info(`verdict ${report.verdict.toUpperCase()}  ${report.counts.critical}C/${report.counts.major}M/${report.counts.moderate}m/${report.counts.minor}n  blocks-done=${report.blocksDone}`)
	// A Critical or Major finding blocks a "done" claim; the exit code carries that so a caller
	// cannot treat a red report as a green run.
	return report.blocksDone ? 1 : 0
}

function cmdCompare(args: Args): number {
	if (args.positionals.length < 2) {
		console.error('compare needs at least two payloads: arch compare a.json b.json [c.json]')
		return 2
	}
	const options = args.positionals.map((file, i) => measureOption(String.fromCharCode(65 + i), path.resolve(file)))
	const markdown = formatComparison(options)
	const out = args.flags.get('md')
	if (out) {
		fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
		fs.writeFileSync(path.resolve(out), `${markdown}\n`)
		console.info(`md ${path.resolve(out)}`)
	} else console.info(markdown)

	const pngOut = args.flags.get('png')
	if (pngOut) {
		const floorId = args.flags.get('floor')
		const renders = options.map(option => renderPng(findFloor(option.bundle.world, floorId), { scale: args.flags.has('scale') ? Number(args.flags.get('scale')) : 5 }))
		const sheet = renderContactSheet(renders, options.map(option => option.name))
		ensureOut(path.dirname(path.resolve(pngOut)))
		fs.writeFileSync(path.resolve(pngOut), sheet.png)
		console.info(`png ${path.resolve(pngOut)} (${sheet.width}x${sheet.height}) contact sheet - the options side by side`)
	}
	return 0
}

function cmdRevise(args: Args): number {
	const patchPath = args.flags.get('patch')
	if (!patchPath) {
		console.error('revise needs --patch <patch.json>; see scripts/arch/README.md for the patch shape')
		return 2
	}
	const patch = JSON.parse(fs.readFileSync(path.resolve(patchPath), 'utf8')) as Patch
	const source = inputPath(args)
	const out = path.resolve(args.flags.get('out') ?? path.join(DEFAULT_OUT, `${path.basename(source, '.json')}.revised.json`))
	// Findings say what is still broken; the metric delta says what the repair cost elsewhere, in
	// numbers rather than in the tone of a summary. The regression line uses the same reading the loop
	// prints, so one repair cannot look better from `revise` than it does from `loop`.
	const result = revise(source, patch, out)
	const worse = regressions(loadWorld(source).world, loadWorld(out).world)
	let markdown = `${formatRevision(result, patch)}\n\nmetric regressions: ${formatRegressions(worse)}\n\n${metricDiff(source, out)}`
	if (args.booleans.has('challenge')) {
		// Costs one re-measure per trial, so it is asked for rather than assumed.
		const probe = probeMinimality(source, patch, `${out}.challenge.json`)
		markdown += `\n\n${formatMinimality(probe, patch)}`
		console.info(`rung minimality: ${probe.alreadyMinimal ? 'every operation is load-bearing' : `${probe.spare.length} spare operation(s) - a cheaper rung would have cleared the same claims`}`)
	}
	const mdOut = args.flags.get('md')
	if (mdOut) {
		fs.mkdirSync(path.dirname(path.resolve(mdOut)), { recursive: true })
		fs.writeFileSync(path.resolve(mdOut), `${markdown}\n`)
		console.info(`md ${path.resolve(mdOut)}`)
	} else console.info(markdown)
	if (args.flags.has('png')) {
		const before = renderPng(findFloor(loadWorld(source).world, args.flags.get('floor')), { scale: 5 })
		const after = renderPng(findFloor(loadWorld(out).world, args.flags.get('floor')), {
			scale: 5,
			findings: [...result.after.floors.flatMap(f => f.findings), ...result.after.building.findings],
		})
		const sheet = renderContactSheet([before, after], ['BEFORE', 'AFTER'])
		const stem = path.resolve(args.flags.get('png')!)
		ensureOut(path.dirname(stem))
		fs.writeFileSync(stem, sheet.png)
		console.info(`png ${stem} - before/after; a repair you cannot see is a repair you cannot trust`)
	}
	return result.after.blocksDone ? 1 : 0
}

function cmdLoop(args: Args): number {
	const patchDir = path.resolve(args.flags.get('patches') ?? path.join(HERE, 'patches'))
	const maxPasses = args.flags.has('max-passes') ? Number(args.flags.get('max-passes')) : 8
	const outDir = path.resolve(args.flags.get('out-dir') ?? path.join(DEFAULT_OUT, 'loop'))
	const floorId = args.flags.get('floor')
	if (!fs.existsSync(patchDir)) {
		console.error(`no patch directory at ${patchDir}\nwrite pass-1.json, pass-2.json ... there; each is a Patch (see scripts/arch/README.md)`)
		return 2
	}
	const patchFiles = fs.readdirSync(patchDir).filter(name => /^pass-\d+\.json$/.test(name)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
	if (!patchFiles.length) {
		console.error(`no pass-N.json patches in ${patchDir} - the loop is driven by authored repairs, it does not invent geometry`)
		return 2
	}
	ensureOut(outDir)

	let current = inputPath(args)
	const sheets: { render: ReturnType<typeof renderPng>; label: string }[] = []
	const log: string[] = []
	let pass = 0
	for (const file of patchFiles) {
		if (pass >= maxPasses) {
			log.push(`stop: reached --max-passes ${maxPasses}`)
			break
		}
		pass++
		const patch = JSON.parse(fs.readFileSync(path.join(patchDir, file), 'utf8')) as Patch
		const stem = path.basename(file, '.json')
		sheets.push({ render: renderPng(findFloor(loadWorld(current).world, floorId), { scale: 4 }), label: `${stem} BEFORE` })
		const next = path.join(outDir, `${stem}.json`)
		const result = revise(current, patch, next)
		sheets.push({
			render: renderPng(findFloor(loadWorld(next).world, floorId), {
				scale: 4,
				findings: [...result.after.floors.flatMap(f => f.findings), ...result.after.building.findings],
			}),
			label: `${stem} AFTER`,
		})
		// A pass that clears a finding while quietly degrading a measured metric is not progress, and
		// finding ids alone cannot see it happening.
		const worse = regressions(loadWorld(current).world, loadWorld(next).world)
		log.push(
			`pass ${pass} (${file}) rung=${result.rung.effective}${result.rung.understated ? ` (declared ${result.rung.declared}: UNDERSTATED)` : ''} intent="${patch.intent}"`,
			`  before ${result.before.counts.critical}C/${result.before.counts.major}M -> after ${result.after.counts.critical}C/${result.after.counts.major}M`,
			`  cleared: ${result.cleared.join(', ') || 'none'}`,
			`  still open: ${result.stillOpen.join(', ') || 'none'}`,
			`  introduced: ${result.introduced.join(', ') || 'none'}`,
			`  metric regressions: ${formatRegressions(worse)}`,
			...result.log.map(line => `  ${line}`),
		)
		fs.writeFileSync(path.join(outDir, `${stem}.report.md`), `${formatRevision(result, patch)}\n\n${metricDiff(current, next)}\n`)
		current = next
		// A pass that costs a gate metric is not progress, and running another patch on top of it hides
		// which one did the damage. Halt with the evidence intact rather than bury it in a later pass.
		const gateWorse = worse.filter(row => row.gate)
		if (gateWorse.length) {
			log.push(`halt: pass ${pass} regressed ${gateWorse.length} gate metric(s) - ${formatRegressions(gateWorse)}`)
			log.push(`  ${file} is kept and reported; pass ${pass + 1} was not applied. Repair this one before going further.`)
			break
		}
		if (!result.after.blocksDone) {
			log.push(`stop: no critical or major findings remain after pass ${pass}`)
			break
		}
	}

	const finalReport = evaluate(loadWorld(current))
	const sheet = renderContactSheet(sheets.map(entry => entry.render), sheets.map(entry => entry.label))
	const sheetPath = path.join(outDir, 'passes.png')
	fs.writeFileSync(sheetPath, sheet.png)
	fs.writeFileSync(path.join(outDir, 'loop.log'), `${log.join('\n')}\n`)
	fs.writeFileSync(path.join(outDir, 'final.report.md'), `${formatReport(finalReport, `final - ${path.basename(current)}`)}\n`)

	console.info(log.join('\n'))
	console.info(`\ncontact sheet ${sheetPath}`)
	console.info(`final report  ${path.join(outDir, 'final.report.md')}`)
	console.info(`final verdict ${finalReport.verdict.toUpperCase()} ${finalReport.counts.critical}C/${finalReport.counts.major}M/${finalReport.counts.moderate}m/${finalReport.counts.minor}n blocks-done=${finalReport.blocksDone}`)
	console.info('look at passes.png: the loop is design -> see -> criticise -> fix -> see again, and the seeing is not optional')
	return finalReport.blocksDone ? 1 : 0
}

const USAGE = `arch - Architecture Agent Harness

usage:
  npx tsx scripts/arch/cli.ts <command> [--in <payload.json>] [options]

commands:
  world     derive the persistent world model            [--json] [--out world.json]
  render    draw a floor                                 [--floor id] [--ascii] [--png] [--svg]
                                                         [--out path] [--out-dir dir] [--scale n]
                                                         [--zoom x0,y0,x1,y1] [--cells "x,y;x,y"]
                                                         [--findings findings.json] [--no-rooms]
                                                         [--no-furniture] [--no-labels] [--no-grid]
  metrics   measured KPI vector with bands and sources   [--floor id]
  eval      independent validators -> findings report    [--floor id] [--json out.json] [--md out.md]
                                                         [--png out.png]  (exit 1 when a critical or
                                                         major finding blocks "done")
  compare   A/B/C same-metric comparison                 <a.json> <b.json> [c.json ...]
                                                         [--md out.md] [--png sheet.png] [--floor id]
  revise    apply a repair, re-render, re-evaluate       --patch patch.json [--out path]
                                                         [--md out.md] [--png sheet.png] [--floor id]
                                                         [--challenge]  search for a cheaper rung that
                                                        clears the same claims (one re-measure per trial)
  loop      render -> revise -> re-evaluate over         [--patches dir] [--max-passes n]
            authored pass-N.json patches                 [--out-dir dir] [--floor id]
  selftest  run the failure library: bad fixtures must   (see architecture-skill/failure-library.md)
            fire their findings, good fixtures must not
  build     draw floor-g from scripts/arch/lobby/plan-g  [--dry] [--plan path]
            txt (1 char = 1 tile) into the payload
  takings   run the real NPC sim over the payload and     [--ticks n] [--plan path]
            report what the plan earns (services only a    [--agents n] [--arrivals]
            visitor completes - a circulation scoreboard)  [--stay s] [--patience s]
            (exit 1 when nothing is served)

default payload: src/blueprint-editor/data/blueprint-data.json
renders and reports land in scripts/arch/out/ (git-ignored, regenerable)`

function cmdTakings(args: Args): number {
	const payload = inputPath(args)
	let measured = payload
	let note = ''
	const plan = args.flags.get('plan')
	if (plan) {
		// Build into a probe copy: measuring a plan must never overwrite the authored store.
		fs.mkdirSync(DEFAULT_OUT, { recursive: true })
		const probe = path.join(DEFAULT_OUT, 'takings-probe.json')
		const canvasSpec = args.flags.get('canvas')
		if (canvasSpec) {
			const match = /^(\d+)x(\d+)@(\d+)$/.exec(canvasSpec)
			if (!match) throw new Error(`--canvas wants "cols x rows @ tileSize", e.g. 116x76@25 (got "${canvasSpec}")`)
			const raw = JSON.parse(fs.readFileSync(payload, 'utf8'))
			raw.layout.canvas.width = Number(match[1]) * Number(match[3])
			raw.layout.canvas.height = Number(match[2]) * Number(match[3])
			raw.layout.canvas.tileSize = Number(match[3])
			fs.writeFileSync(probe, `${JSON.stringify(raw, null, 2)}\n`)
		} else {
			fs.copyFileSync(payload, probe)
		}
		const built = buildLobby(probe, path.resolve(ROOT, plan), true)
		note = `plan ${path.relative(ROOT, plan)}: ${built.fixtures} fixtures, ${built.doors} door tiles, ~${built.seats} seats\n`
		measured = probe
	}
	const report = measureTakings(measured, {
		ticks: Number(args.flags.get('ticks') ?? 6000),
		agents: args.flags.has('agents') ? Number(args.flags.get('agents')) : undefined,
		arrivals: args.booleans.has('arrivals'),
		staySeconds: args.flags.has('stay') ? Number(args.flags.get('stay')) : undefined,
		patienceSeconds: args.flags.has('patience') ? Number(args.flags.get('patience')) : undefined,
	})
	console.info(`${note}${formatTakingsReport(report)}`)
	return report.served > 0 ? 0 : 1
}

function cmdBuild(args: Args): number {
	const plan = args.flags.get('plan') ?? path.join(HERE, 'lobby', 'plan-g.txt')
	const built = buildLobby(args.positionals[0] ?? DEFAULT_DATA, plan, !args.booleans.has('dry'))
	console.log(built.ascii)
	console.log(`\nplan ${path.relative(ROOT, plan)}`)
	console.log(`walls ${built.wallRuns} runs, doors ${built.doors} tiles, fixtures ${built.fixtures}, seats ~${built.seats}`)
	console.log(built.wrote ? `wrote ${path.relative(ROOT, built.wrote)}` : 'dry run - payload untouched')
	return 0
}

export function main(argv: readonly string[]): number {
	const [command, ...rest] = argv
	const args = parseArgs(rest)
	switch (command) {
		case 'world': return cmdWorld(args)
		case 'render': return cmdRender(args)
		case 'metrics': return cmdMetrics(args)
		case 'eval': return cmdEval(args)
		case 'compare': return cmdCompare(args)
		case 'revise': return cmdRevise(args)
		case 'loop': return cmdLoop(args)
		case 'build': return cmdBuild(args)
		case 'takings': return cmdTakings(args)
		case 'selftest': return runSelfTest()
		case 'help':
		case undefined:
			console.info(USAGE)
			return command === undefined ? 1 : 0
		default:
			console.error(`unknown command "${command}"\n\n${USAGE}`)
			return 2
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.exitCode = main(process.argv.slice(2))
}
