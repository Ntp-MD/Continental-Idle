/**
 * evaluate.ts - the failure-report stage.
 *
 * Runs the gate first, then the five independent check groups. The evaluator does not trust the
 * generator: it never reads a claim, only tiles. On a gate failure the semantic verdicts for that
 * floor become `unknown` - phantom geometry is how unsafe plans score well, so a broken model is
 * not allowed to produce either a pass or a confident fail.
 */
import { runBuilding, runCapacity, runCirculation, runEnvironment, runGate, runGeometry, runInterior, runOperations } from './checks'
import { buildingKpis, floorKpis } from './metrics'
import type { WorldBundle } from './world'
import type { EvaluationReport, Finding, Severity, Verdict } from './types'

const SEVERITY_ORDER: Severity[] = ['critical', 'major', 'moderate', 'minor']

/**
 * The capability manifest, published as a property of the suite so a green report is never read
 * as an all-clear (SKILL.md ## Validation, VA-04).
 */
/** Who may close what. Printed by every report, because a green number is not a sign-off. */
export const CLOSURE_RIGHTS = [
	'The agent may close geometry and logic findings itself.',
	'Code-jurisdiction, structural, fire, access and operational-capacity findings stay OPEN for a qualified reviewer regardless of these numbers.',
]

export const CAPABILITY_MANIFEST = {
	canRun: [
		'tile-class reconciliation and model integrity (GATE-*)',
		'geometry: slivers, type minima, proportion, furniture collisions, out-of-bounds (GEO-*)',
		'circulation: measured width, dead ends, sealed rooms, A* detour over the real network (CIR-*)',
		'interior: furnished clearance, coverage, door-reserve overlap, room-type resolution (INT-*)',
		'operations: BOH presence and catchment, service/public exposure (OPS-*)',
		'capacity: standing area against the population the payload declares, and posted-station provision (CAP-01, OPS-04)',
		'environment: sidelit depth, facade access, threshold privacy (ENV-*)',
		'building: portal coverage, stack drift, whole-building reconciliation (BLD-*)',
	],
	cannotRun: [
		'measured illuminance or climate-based daylight simulation - only a depth proxy (EQ-*)',
		'a per-typology daylight depth cap - one declared window head height is applied to every room, so a bedroom can pass a cap written for a glazed lobby',
		'transient smoke filling and tenability over time - no fire model runs here at all',
		'dynamic crowd behaviour beyond octile A* plus portal queues',
		'thermal and energy simulation, measured acoustics',
		'anything needing a section: heights, slab and beam geometry, door leaf swing, risers, slopes',
		'real time - the host floor list has no vertical dimension at all',
		'code compliance - a jurisdiction and edition are inputs this host does not carry, so code checks report UNKNOWN',
		'cost - no rates are supplied; money cells are parameters needing a region and a year, never inventions (CM-*)',
		'a market revenue verdict - the money columns in arch compare rank on the declared tariff table and day wage in src/blueprint-editor/domain/economy, so profit here is a balance-sheet shape, not a price',
		'an occupant-load area factor for a lobby, lounge, bar, gym, spa or pool - the corpus carries none, so capacity is judged against the declared population and never against an invented density (SP-04, HO-26)',
		'desks or seats per key - HO-22 retrieved none; PP-08 station counts are computed only from the arrival rate declared in scripts/arch/spec.json, and the walk-in to walk-out split in that file is an assumption, not a measurement',
		'sightlines and drag lines - C-values cannot be measured on this grid and the 1.1-1.3 drag band is a tuning knob, not a threshold (human-scale.md:474, PP-13)',
		'a circulation-share ceiling - TH-15 is office practice data and EC-17 states the hotel range has no source at all, so the share is published without a pass mark',
	],
} as const

export function evaluate(bundle: WorldBundle): EvaluationReport {
	const floors = bundle.world.floors.map(floor => {
		const gate = runGate(bundle, floor)
		const gateFailed = gate.some(finding => finding.severity === 'critical')
		const semantic: Finding[] = [
			...runGeometry(bundle, floor),
			...runCirculation(bundle, floor),
			...runInterior(bundle, floor),
			...runOperations(bundle, floor),
			...runCapacity(bundle, floor),
			...runEnvironment(bundle, floor),
		].map(finding => (gateFailed ? { ...finding, verdict: 'unknown' as Verdict } : finding))

		return {
			floorId: floor.id,
			label: floor.label,
			findings: sortBySeverity([...gate, ...semantic]),
			kpis: floorKpis(bundle.world, floor),
		}
	})

	const buildingFindings = sortBySeverity(runBuilding(bundle))
	const all: Finding[] = [...floors.flatMap(floor => floor.findings), ...buildingFindings]
	const counts: Record<Severity, number> = { critical: 0, major: 0, moderate: 0, minor: 0 }
	for (const item of all) counts[item.severity]++

	const gateVerdict: Verdict = floors.every(floor => !floor.findings.some(f => f.category === 'model-integrity' && f.severity === 'critical'))
		? 'pass'
		: 'fail'

	return {
		source: bundle.world.source,
		evaluatedAt: new Date().toISOString(),
		gate: {
			verdict: gateVerdict,
			findings: all.filter(finding => finding.category === 'model-integrity'),
		},
		floors,
		building: { findings: buildingFindings, kpis: buildingKpis(bundle.world) },
		counts,
		blocksDone: counts.critical > 0 || counts.major > 0,
		verdict: gateVerdict === 'fail' ? 'fail' : counts.critical > 0 ? 'fail' : counts.major > 0 ? 'fail' : 'pass',
	}
}

function sortBySeverity(findings: readonly Finding[]): Finding[] {
	return [...findings].sort((a, b) => {
		const bySeverity = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
		return bySeverity !== 0 ? bySeverity : a.id.localeCompare(b.id)
	})
}

export function formatFinding(finding: Finding, index: number): string {
	const where = [
		finding.floorId ? `floor ${finding.floorId}` : null,
		finding.roomId ? `room ${finding.roomId}` : null,
		finding.cells.length ? `cells ${finding.cells.slice(0, 8).map(cell => `(${cell.x},${cell.y})`).join(' ')}${finding.cells.length > 8 ? ` +${finding.cells.length - 8}` : ''}` : null,
	].filter(Boolean).join('  ')
	return [
		`${index}. [${finding.severity.toUpperCase()}] ${finding.id} ${finding.check} - verdict ${finding.verdict}`,
		`   measured : ${finding.metric} = ${finding.actual}`,
		`   required : ${finding.required}`,
		`   rule     : ${finding.rule}`,
		`   why bad  : ${finding.why}`,
		`   repair   : ${finding.correction}`,
		where ? `   where    : ${where}` : null,
	].filter(Boolean).join('\n')
}

export function formatReport(report: EvaluationReport, title: string): string {
	const lines: string[] = [
		`# ${title}`,
		`source: ${report.source}   evaluated: ${report.evaluatedAt}`,
		`verdict: ${report.verdict.toUpperCase()}   blocks "done": ${report.blocksDone}`,
		`findings: ${report.counts.critical} critical / ${report.counts.major} major / ${report.counts.moderate} moderate / ${report.counts.minor} minor`,
		`model-integrity gate: ${report.gate.verdict.toUpperCase()}${report.gate.verdict === 'fail' ? ' - every semantic verdict below is UNKNOWN, not pass and not a confident fail' : ''}`,
		'',
		'## Findings, in severity order',
	]
	const all = [...report.floors.flatMap(floor => floor.findings), ...report.building.findings]
	if (!all.length) lines.push('none - this is a statement about the checks in CAPABILITY_MANIFEST.canRun only, never an all-clear.')
	all.forEach((finding, i) => lines.push(formatFinding(finding, i + 1), ''))

	lines.push('## Capability manifest - what this suite cannot decide')
	for (const item of CAPABILITY_MANIFEST.cannotRun) lines.push(`- ${item}`)
	lines.push('')
	lines.push('## Closure rights')
	for (const right of CLOSURE_RIGHTS) lines.push(`- ${right}`)
	return lines.join('\n')
}
