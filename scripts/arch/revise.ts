/**
 * revise.ts - the correction stage.
 *
 * A finding is only useful if it can be acted on and re-measured. This applies a patch to the
 * payload, rebuilds the world, and reports the before/after diff so a repair is attributable
 * instead of hopeful. Repairs follow the blast-radius ladder - retag < move a door < resize a
 * boundary < move a wall line < move a core - and the cheapest rung that clears the finding wins
 * (AG-18). Nothing here decides the design; it executes a decision and re-measures it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { evaluate, formatReport } from './evaluate'
import { measureFloor } from './metrics'
import { loadWorld } from './world'
import type { EvaluationReport } from './types'

export type TileOp =
	| { op: 'setTile'; floor: string; x: number; y: number; state: 'walkable' | 'blocked' | 'door' }
	| { op: 'fillRect'; floor: string; x0: number; y0: number; x1: number; y1: number; state: 'walkable' | 'blocked' | 'door' }
	| { op: 'moveObject'; floor: string; id: string; dx: number; dy: number }
	| { op: 'removeObject'; floor: string; id: string }
	| { op: 'addObject'; floor: string; id: string; type: string; x: number; y: number; rotation?: 0 | 90 | 180 | 270 }

export type Rung = 'retag' | 'door' | 'boundary' | 'wall' | 'core'

/** The blast-radius ladder, cheapest first. Declaring a rung cheaper than the ops cost is a lie. */
export const RUNG_ORDER: readonly Rung[] = ['retag', 'door', 'boundary', 'wall', 'core']

/**
 * A tile operation spanning this many cells is redrawing a line, not nudging an edge. Declared as a
 * constant because the point of a threshold is that it is an assertion, not a vibe.
 */
export const WALL_CELL_THRESHOLD = 8

export interface Patch {
	/** What the author intended - recorded, so the log says why the geometry moved. */
	intent: string
	/** The finding ids this patch claims to clear. Re-measured, never trusted. */
	targets: string[]
	/** Blast-radius rung the author claims. Checked against the ops, and it may not understate them. */
	rung: Rung
	ops: TileOp[]
}

function rungIndex(rung: Rung): number {
	return RUNG_ORDER.indexOf(rung)
}

/** Cells a tile operation writes; object operations write no tiles. */
function cellsTouched(op: TileOp): number {
	if (op.op === 'setTile') return 1
	if (op.op === 'fillRect') return (Math.abs(op.x1 - op.x0) + 1) * (Math.abs(op.y1 - op.y0) + 1)
	return 0
}

export interface RungAssessment {
	/** The rung the ops actually took; never cheaper than the one declared. */
	effective: Rung
	declared: Rung
	understated: boolean
	reasons: string[]
}

/**
 * Classify a patch by what its operations do, independently of what its author called them.
 *
 * `portalObjects` holds `floor:id` keys for everything the engine treats as a portal, taken from the
 * world before *and* after the patch so that an added lift counts as the core change it is.
 */
export function classifyRung(ops: readonly TileOp[], portalObjects: ReadonlySet<string>, declared: Rung): RungAssessment {
	const reasons: string[] = []
	let index = 0
	const raise = (level: number, reason: string): void => {
		if (level > index) index = level
		if (!reasons.includes(reason)) reasons.push(reason)
	}
	for (const op of ops) {
		if (op.op === 'moveObject' || op.op === 'removeObject' || op.op === 'addObject') {
			if (portalObjects.has(`${op.floor}:${op.id}`)) raise(4, `${op.op} on ${op.id} - a portal is the core`)
			continue
		}
		const cells = cellsTouched(op)
		if (op.state === 'door') raise(1, 'edits door tiles')
		else raise(2, 'edits wall or floor tiles')
		if (cells >= WALL_CELL_THRESHOLD) raise(3, `writes ${cells} cells in one operation - a wall line, not an edge`)
	}
	const declaredIndex = rungIndex(declared)
	const effectiveIndex = Math.max(index, declaredIndex)
	return {
		effective: RUNG_ORDER[effectiveIndex],
		declared,
		understated: effectiveIndex > declaredIndex,
		reasons,
	}
}

interface MutableDataFile {
	layout?: { floors?: { id: string; walkable?: { tileStates?: string[][] }; objects?: Record<string, unknown>[] }[]; canvas?: { tileSize?: number } }
	originAssets?: { id: string }[]
	[key: string]: unknown
}

export function applyPatch(filePath: string, patch: Patch, outPath: string): string[] {
	const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as MutableDataFile
	const log: string[] = []
	const layout = raw.layout
	if (!layout?.floors) throw new Error(`${filePath}: patch target has no layout.floors`)
	const tileSize = layout.canvas?.tileSize ?? 20

	for (const op of patch.ops) {
		const floor = layout.floors.find(candidate => candidate.id === op.floor)
		if (!floor) {
			log.push(`SKIP ${op.op}: floor "${op.floor}" not found`)
			continue
		}
		if (op.op === 'setTile' || op.op === 'fillRect') {
			const states = floor.walkable?.tileStates
			if (!states) {
				log.push(`SKIP ${op.op}: floor "${op.floor}" has no tileStates`)
				continue
			}
			const x0 = op.op === 'setTile' ? op.x : Math.min(op.x0, op.x1)
			const x1 = op.op === 'setTile' ? op.x : Math.max(op.x0, op.x1)
			const y0 = op.op === 'setTile' ? op.y : Math.min(op.y0, op.y1)
			const y1 = op.op === 'setTile' ? op.y : Math.max(op.y0, op.y1)
			let touched = 0
			for (let y = y0; y <= y1; y++) {
				for (let x = x0; x <= x1; x++) {
					if (!states[y] || states[y][x] === undefined) continue
					if (states[y][x] === op.state) continue
					states[y][x] = op.state
					touched++
				}
			}
			log.push(`${op.op} ${op.floor} [${x0},${y0}..${x1},${y1}] -> ${op.state}: ${touched} tile(s) changed`)
			continue
		}
		floor.objects ??= []
		if (op.op === 'moveObject') {
			const object = floor.objects.find(candidate => (candidate as { id?: string }).id === op.id) as { x?: number; y?: number } | undefined
			if (!object || object.x === undefined || object.y === undefined) {
				log.push(`SKIP moveObject: "${op.id}" not found on ${op.floor}`)
				continue
			}
			object.x += op.dx * tileSize
			object.y += op.dy * tileSize
			log.push(`moveObject ${op.id} by (${op.dx},${op.dy}) tiles -> px (${object.x},${object.y})`)
			continue
		}
		if (op.op === 'removeObject') {
			const before = floor.objects.length
			floor.objects = floor.objects.filter(candidate => (candidate as { id?: string }).id !== op.id)
			log.push(`removeObject ${op.id}: ${before - floor.objects.length} removed`)
			continue
		}
		if (op.op === 'addObject') {
			floor.objects.push({ id: op.id, type: op.type, x: op.x * tileSize, y: op.y * tileSize, rotation: op.rotation ?? 0 })
			log.push(`addObject ${op.id} (${op.type}) at tile (${op.x},${op.y})`)
		}
	}

	fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true })
	fs.writeFileSync(path.resolve(outPath), `${JSON.stringify(raw, null, 1)}\n`)
	log.push(`wrote ${path.resolve(outPath)}`)
	return log
}

export interface RevisionResult {
	log: string[]
	before: EvaluationReport
	after: EvaluationReport
	cleared: string[]
	stillOpen: string[]
	introduced: string[]
	/** The blast radius the operations actually took, which may exceed the one declared. */
	rung: RungAssessment
	path: string
}

/** Apply, rebuild, re-measure. The claim in `patch.targets` is checked, never believed. */
export function revise(filePath: string, patch: Patch, outPath: string): RevisionResult {
	const beforeBundle = loadWorld(filePath)
	const before = evaluate(beforeBundle)
	const log = applyPatch(filePath, patch, outPath)
	const afterBundle = loadWorld(outPath)
	const after = evaluate(afterBundle)

	const portalObjects = new Set([...beforeBundle.world.floors, ...afterBundle.world.floors]
		.flatMap(floor => floor.portals.map(portal => `${floor.id}:${portal.objectId}`)))

	const idsOf = (report: EvaluationReport): Set<string> => new Set([
		...report.floors.flatMap(floor => floor.findings.map(f => f.id)),
		...report.building.findings.map(f => f.id),
	])
	const beforeIds = idsOf(before)
	const afterIds = idsOf(after)

	return {
		log,
		before,
		after,
		cleared: patch.targets.filter(id => beforeIds.has(id) && !afterIds.has(id)),
		stillOpen: patch.targets.filter(id => afterIds.has(id)),
		introduced: [...afterIds].filter(id => !beforeIds.has(id)),
		rung: classifyRung(patch.ops, portalObjects, patch.rung),
		path: path.resolve(outPath),
	}
}

export interface MinimalityProbe {
	/** The smallest subset of the author's own ops that still clears everything the full patch cleared. */
	minimal: TileOp[]
	/** Ops that contributed nothing to the claim - each one is blast radius that was not needed. */
	spare: TileOp[]
	/** The rung of the minimal subset, which is what R6 actually asks for. */
	rung: RungAssessment
	/** The cleared set of the full patch - the bar every subset is tested against. */
	cleared: string[]
	trials: number
	/** True when the trial cap stopped the search; the answer is then a bound, not a proof. */
	capped: boolean
	alreadyMinimal: boolean
}

/**
 * R6 says take the cheapest rung that clears the finding. `classifyRung` measures the rung a patch
 * took; this asks whether it could have taken a cheaper one, by removing operations from the author's
 * own proposal and re-measuring. It never invents geometry - a design decision stays a decision.
 *
 * Greedy, not exhaustive: each trial drops one operation and re-measures, so a combination that only
 * clears the bar when two ops go together is not found. It reports what it proved.
 */
export function probeMinimality(filePath: string, patch: Patch, outPath: string, maxTrials = 40): MinimalityProbe {
	const full = revise(filePath, patch, outPath)
	const bar = [...new Set(full.cleared)]
	const kept = [...patch.ops]
	const spare: TileOp[] = []
	const trialPath = `${outPath}.probe.json`
	let trials = 0

	let removed = true
	while (removed && trials < maxTrials) {
		removed = false
		for (let i = 0; i < kept.length && trials < maxTrials; i++) {
			const candidate = kept.filter((_, index) => index !== i)
			trials++
			const trial = revise(filePath, { ...patch, ops: candidate, targets: bar }, trialPath)
			if (candidate.length && bar.every(id => trial.cleared.includes(id))) {
				spare.push(kept[i])
				kept.splice(i, 1)
				removed = true
				break
			}
		}
	}

	const minimalPath = `${outPath}.minimal.json`
	const minimal = revise(filePath, { ...patch, ops: kept, targets: bar }, minimalPath)
	// The probe owns its scratch files and leaves none of them behind.
	for (const scratch of [outPath, trialPath, minimalPath]) if (fs.existsSync(scratch)) fs.rmSync(scratch)

	return {
		minimal: kept,
		spare,
		rung: minimal.rung,
		cleared: bar,
		trials,
		capped: trials >= maxTrials && spare.length > 0,
		alreadyMinimal: spare.length === 0,
	}
}

export function formatMinimality(probe: MinimalityProbe, patch: Patch): string {
	const lines = [
		'## Rung minimality - could a cheaper repair have cleared the same claims?',
		`- cleared by the full patch: ${probe.cleared.join(', ') || 'nothing'}`,
		`- operations declared: ${patch.ops.length}, proven necessary: ${probe.minimal.length}, spare: ${probe.spare.length}`,
		`- rung after removing the spare operations: "${probe.rung.effective}"`,
		`- trials: ${probe.trials}${probe.capped ? ' - stopped at the trial cap, so this is a bound, not a proof of minimality' : ''}`,
	]
	if (probe.alreadyMinimal) lines.push('- already minimal: every operation is load-bearing for the claim.')
	else {
		lines.push('- SPARE OPERATIONS - each of these was removable without losing a single cleared finding:')
		for (const op of probe.spare) lines.push(`  - ${JSON.stringify(op)}`)
		lines.push('  Take them out. R6 is the cheapest rung that clears the finding, not the first one that does.')
	}
	return lines.join('\n')
}

export function formatRevision(result: RevisionResult, patch: Patch): string {
	const countLine = (report: EvaluationReport): string =>
		`${report.counts.critical}C/${report.counts.major}M/${report.counts.moderate}m/${report.counts.minor}n  verdict ${report.verdict.toUpperCase()}`
	return [
		`# Revision - rung "${result.rung.effective}"`,
		`intent: ${patch.intent}`,
		`claimed targets: ${patch.targets.join(', ') || 'none'}`,
		`blast radius: declared "${result.rung.declared}", measured "${result.rung.effective}" from the operations${result.rung.understated ? `  <- UNDERSTATED: ${result.rung.reasons.join('; ')}` : ''}`,
		'',
		'## Operations applied',
		...result.log.map(line => `- ${line}`),
		'',
		'## Measured before / after (recomputed from tiles, not from the claim)',
		`- before: ${countLine(result.before)}`,
		`- after : ${countLine(result.after)}`,
		`- cleared   : ${result.cleared.join(', ') || 'none'}`,
		`- still open: ${result.stillOpen.join(', ') || 'none'}`,
		`- introduced: ${result.introduced.join(', ') || 'none'}${result.introduced.length ? '  <- a cascade; the repair cost something elsewhere' : ''}`,
		'',
		'## Post-revision report',
		formatReport(result.after, `after ${patch.rung}-rung repair`),
	].join('\n')
}

/** One metric between two payloads. Structured so a caller can test numbers, not prose. */
export interface MetricRow {
	floorId: string
	metric: string
	before: number
	after: number
	delta: number
	/** Set when a floor exists on only one side, where there is no number to diff. */
	presenceOnly?: boolean
}

const METRIC_KEYS: (keyof ReturnType<typeof measureFloor>)[] = ['roomTiles', 'circulationTiles', 'structureTiles', 'furnitureTiles', 'netToGross', 'circulationShare', 'corridorWidthSamples', 'corridorMinWidth', 'deadEnds', 'decisionPoints', 'programmeRoomSamples', 'worstFreeRun', 'untaggedRoomCount', 'circulationInferred', 'unreachableTiles', 'roomsBeyondDaylightDepth', 'portals']

/** Metric deltas between two payloads, so a repair is attributable in numbers and not only in findings. */
export function metricRows(beforePath: string, afterPath: string): MetricRow[] {
	const a = loadWorld(beforePath)
	const b = loadWorld(afterPath)
	const rows: MetricRow[] = []
	const floorIds = [...new Set([...a.world.floors.map(floor => floor.id), ...b.world.floors.map(floor => floor.id)])]
	for (const id of floorIds) {
		const fa = a.world.floors.find(floor => floor.id === id)
		const fb = b.world.floors.find(floor => floor.id === id)
		if (!fa || !fb) {
			rows.push({ floorId: id, metric: 'presence', before: fa ? 1 : 0, after: fb ? 1 : 0, delta: 0, presenceOnly: true })
			continue
		}
		const ma = measureFloor(a.world, fa)
		const mb = measureFloor(b.world, fb)
		for (const key of METRIC_KEYS) {
			const before = Number(ma[key])
			const after = Number(mb[key])
			rows.push({ floorId: id, metric: String(key), before, after, delta: Number((after - before).toFixed(4)) })
		}
	}
	return rows
}

function formatMetricValue(value: number): string {
	return String(Number(value.toFixed(3)))
}

export function formatMetricDiff(rows: readonly MetricRow[]): string {
	const lines = ['## Metric diff', '', '| floor | metric | before | after | delta |', '|---|---|---|---|---|']
	for (const row of rows) {
		lines.push(row.presenceOnly
			? `| ${row.floorId} | presence | ${row.before ? 'present' : 'absent'} | ${row.after ? 'present' : 'absent'} | - |`
			: `| ${row.floorId} | ${row.metric} | ${formatMetricValue(row.before)} | ${formatMetricValue(row.after)} | ${row.delta > 0 ? '+' : ''}${row.delta} |`)
	}
	return lines.join('\n')
}

/** Metric diff between two evaluations, so a pass is attributable to one change. */
export function metricDiff(beforePath: string, afterPath: string): string {
	return formatMetricDiff(metricRows(beforePath, afterPath))
}
