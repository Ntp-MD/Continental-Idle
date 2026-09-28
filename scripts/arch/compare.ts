/**
 * compare.ts - comparative design.
 *
 * Architects do not find "the correct layout"; they hold A/B/C, price each against the project
 * objective, and choose. This takes N payloads, measures all of them with the identical metric
 * list, and refuses to declare a universal winner: it publishes the diff vector, the Pareto set,
 * and whether the ranking survives a change of weights (DA-02, DA-03, EV-20..EV-30, DM-04).
 */
import { CAPABILITY_MANIFEST, CLOSURE_RIGHTS, evaluate } from './evaluate'
import { buildingKpis, floorKpis, measureFloor } from './metrics'
import { loadWorld, type WorldBundle } from './world'
import type { Kpi } from './types'

export interface OptionMeasurement {
	name: string
	path: string
	bundle: WorldBundle
	kpis: Kpi[]
	findings: { critical: number; major: number; moderate: number; minor: number }
	/** A critical finding means the model does not hold together, so the option is not a candidate.
	 * Majors are real design defects: they stay rankable, because weighing defects is the point. */
	disqualified: boolean
	/** The critical finding ids, named so a disqualification is attributable instead of vibes. */
	blockers: string[]
	/** The diff vector: the components that must differ for two options to be alternatives, not variants. */
	diff: {
		portalCentroid: string
		plateDepthTiles: number
		circulationSharePct: number
		roomCount: number
		meanRoomDepthFromFacade: number
		serviceSharePct: number
		worstFurnishedClearanceTiles: number
	}
}

export const WEIGHT_PROFILES: Record<string, Record<string, number>> = {
	efficiency: { netToGross: 3, circulationShare: -3, structureShare: -1, decisionPoints: 0, worstFreeRun: 1, roomsBeyondDaylight: 0, serviceShare: 0, deadEnds: -1 },
	experience: { netToGross: 0, circulationShare: -1, structureShare: 0, decisionPoints: -2, worstFreeRun: 2, roomsBeyondDaylight: -3, serviceShare: 0, deadEnds: -1 },
	operations: { netToGross: 0, circulationShare: -2, structureShare: 0, decisionPoints: -1, worstFreeRun: 1, roomsBeyondDaylight: -1, serviceShare: 2, deadEnds: -2 },
	safety: { netToGross: 0, circulationShare: -1, structureShare: 0, decisionPoints: -1, worstFreeRun: 2, roomsBeyondDaylight: -1, serviceShare: 0, deadEnds: -3 },
}

/** KPIs used for ranking. Named once so every option is scored on the identical list. */
export const RANKED_KEYS = ['netToGross', 'circulationShare', 'structureShare', 'decisionPoints', 'worstFreeRun', 'roomsBeyondDaylight', 'serviceShare', 'deadEnds']

export function measureOption(name: string, path: string): OptionMeasurement {
	const bundle = loadWorld(path)
	const report = evaluate(bundle)
	const perFloor = bundle.world.floors.map(floor => measureFloor(bundle.world, floor))
	const aggregate = (pick: (m: ReturnType<typeof measureFloor>) => number): number =>
		perFloor.reduce((sum, m) => sum + pick(m), 0)
	const plate = aggregate(m => m.plateTiles) || 1

	const floorKpiList = bundle.world.floors.flatMap(floor => floorKpis(bundle.world, floor))
	const kpis = [...floorKpiList, ...buildingKpis(bundle.world)]

	const portalCells = bundle.world.floors.flatMap(floor => floor.portals.flatMap(portal => portal.cells))
	const portalCentroid = portalCells.length
		? `${(portalCells.reduce((s, c) => s + c.x, 0) / portalCells.length).toFixed(1)},${(portalCells.reduce((s, c) => s + c.y, 0) / portalCells.length).toFixed(1)}`
		: 'none'

	return {
		name,
		path,
		bundle,
		kpis,
		findings: report.counts,
		disqualified: report.counts.critical > 0,
		blockers: [...report.floors.flatMap(floor => floor.findings), ...report.building.findings]
			.filter(finding => finding.severity === 'critical' && finding.verdict === 'fail')
			.map(finding => finding.id),
		diff: {
			portalCentroid,
			plateDepthTiles: bundle.world.canvas.rows,
			circulationSharePct: Number(((aggregate(m => m.circulationTiles) / plate) * 100).toFixed(1)),
			roomCount: aggregate(m => m.typedRoomCount),
			meanRoomDepthFromFacade: perFloor.length ? Number((perFloor.reduce((s, m) => s + m.meanRoomDepthFromFacade, 0) / perFloor.length).toFixed(1)) : 0,
			serviceSharePct: perFloor.length ? Number((perFloor.reduce((s, m) => s + m.serviceShare, 0) / perFloor.length * 100).toFixed(1)) : 0,
			worstFurnishedClearanceTiles: perFloor.length ? Math.min(...perFloor.map(m => m.worstFreeRun)) : 0,
		},
	}
}

/**
 * One option's value for a metric. Keys repeat across storeys by design, so this has to choose how to
 * fold them - and the fold differs by kind. A gate is pass/fail per floor: averaging `reconciles`
 * across three storeys turns one lying floor into 0.67 and reads as mostly fine. Gates take the worst
 * floor; descriptive metrics take the mean.
 */
function valueFor(option: OptionMeasurement, key: string): number {
	const hits = option.kpis.filter(kpi => kpi.key === key)
	if (!hits.length) return 0
	if (hits.some(kpi => kpi.gate)) {
		const values = hits.map(kpi => kpi.value)
		// Lower is better for a 'down' gate, so its worst case is the maximum; otherwise the minimum.
		return hits[0].direction === 'down' ? Math.max(...values) : Math.min(...values)
	}
	return hits.reduce((sum, kpi) => sum + kpi.value, 0) / hits.length
}

/**
 * Score under one weight profile. Normalised per metric across the option set, so a weight means
 * the same thing whatever the unit - normalise before comparing (SR-42).
 *
 * The gate lives here, not in the caller: an option with a critical finding is a broken plan, and
 * a ranking function that would happily put it first is a ranking function that lies.
 */
export function rankOptions(options: readonly OptionMeasurement[], profileName: string): { profile: string; order: { name: string; score: number }[] } {
	const profile = WEIGHT_PROFILES[profileName] ?? WEIGHT_PROFILES.efficiency
	const candidates = options.filter(option => !option.disqualified)
	if (!candidates.length) return { profile: profileName, order: [] }
	const ranges = RANKED_KEYS.map(key => {
		const values = candidates.map(option => valueFor(option, key))
		const min = Math.min(...values)
		const max = Math.max(...values)
		return { key, min, span: max - min }
	})
	const scored = candidates.map(option => {
		let score = 0
		for (const range of ranges) {
			const weight = profile[range.key] ?? 0
			if (!weight || range.span === 0) continue
			const normalised = (valueFor(option, range.key) - range.min) / range.span
			score += weight * normalised
		}
		return { name: option.name, score: Number(score.toFixed(3)) }
	}).sort((a, b) => b.score - a.score)
	return { profile: profileName, order: scored }
}

/** Same gates as the ranking: a broken plan and a redrawn one are never frontier points. */
export function paretoSet(options: readonly OptionMeasurement[]): string[] {
	const points = distinctAlternatives(options.filter(option => !option.disqualified)).map(option => ({
		name: option.name,
		// Objectives, all minimised: circulation cost, daylight failure, tight clearance, findings.
		vector: [
			option.diff.circulationSharePct,
			-option.diff.meanRoomDepthFromFacade,
			-option.diff.worstFurnishedClearanceTiles,
			option.findings.critical * 100 + option.findings.major * 10 + option.findings.moderate,
		],
	}))
	return points.filter(candidate =>
		!points.some(other => other !== candidate
			&& other.vector.every((v, i) => v <= candidate.vector[i])
			&& other.vector.some((v, i) => v < candidate.vector[i]))).map(point => point.name)
}

/** The components that must differ for two plans to be alternatives rather than variants (DA-03). */
export const DIFF_COMPONENTS: (keyof OptionMeasurement['diff'])[] = ['portalCentroid', 'plateDepthTiles', 'circulationSharePct', 'roomCount', 'meanRoomDepthFromFacade', 'serviceSharePct', 'worstFurnishedClearanceTiles']

/** Below this many differing components, the second plan is the first one redrawn. */
export const MIN_DIFF_COMPONENTS = 2

/** Two options must differ in >= 2 components or they are variants, not alternatives (DA-03). */
export function diffDistance(a: OptionMeasurement, b: OptionMeasurement): number {
	return DIFF_COMPONENTS.filter(key => String(a.diff[key]) !== String(b.diff[key])).length
}

/** Which components the two plans agree on - the list a designer needs in order to break the tie. */
export function sharedComponents(a: OptionMeasurement, b: OptionMeasurement): string[] {
	return DIFF_COMPONENTS.filter(key => String(a.diff[key]) === String(b.diff[key])).map(String)
}

/**
 * Collapse variants, keeping the first of each distinct idea.
 *
 * Enforced here rather than in the report prose: ranking three copies of the same plan and declaring
 * a winner is the same lie as ranking a broken plan first, and a formatter that merely mentions the
 * rule while the ranking goes ahead anyway has documented the bug instead of preventing it.
 */
export function distinctAlternatives(options: readonly OptionMeasurement[]): OptionMeasurement[] {
	const kept: OptionMeasurement[] = []
	for (const option of options) {
		if (kept.every(other => diffDistance(other, option) >= MIN_DIFF_COMPONENTS)) kept.push(option)
	}
	return kept
}

export function formatComparison(options: readonly OptionMeasurement[]): string {
	const lines: string[] = ['# Option comparison', '']
	const inputHash = options.map(option => `${option.name}: ${option.bundle.world.canvas.cols}x${option.bundle.world.canvas.rows} tiles, ${option.bundle.world.floors.length} floor(s), ${option.diff.roomCount} typed rooms`)
	lines.push('## Inputs held constant (published so a reader can see they were)', ...inputHash.map(h => `- ${h}`), '')

	// Folded per option through the same function the ranking uses. Summing a metric across storeys is
	// meaningless for shares and booleans: three reconciled floors used to print "3" for a 0/1 gate.
	const metricRows = new Map<string, { label: string; unit: string; values: Map<string, number> }>()
	for (const option of options) {
		for (const kpi of option.kpis) {
			const row = metricRows.get(kpi.key) ?? { label: kpi.label, unit: kpi.unit, values: new Map<string, number>() }
			row.values.set(option.name, Number(valueFor(option, kpi.key).toFixed(2)))
			metricRows.set(kpi.key, row)
		}
	}
	const orderedKeys = [...metricRows.keys()].sort((a, b) => Number(RANKED_KEYS.includes(b)) - Number(RANKED_KEYS.includes(a)) || a.localeCompare(b))
	const widths = [
		Math.max('metric'.length, ...[...metricRows.values()].map(row => row.label.length)),
		...options.map(option => Math.max(option.name.length, 8)),
	]
	const line = (cells: readonly string[]): string => cells.map((cell, i) => String(cell).padEnd(widths[i])).join('  ')
	lines.push('## Same metric list for every option - none dropped because it looked bad')
	lines.push(line(['metric', ...options.map(option => option.name)]))
	lines.push(widths.map(w => '-'.repeat(w)).join('  '))
	for (const key of orderedKeys) {
		const row = metricRows.get(key)!
		const marker = RANKED_KEYS.includes(key) ? '*' : ' '
		lines.push(line([`${marker}${row.label} (${row.unit})`, ...options.map(option => String(row.values.get(option.name) ?? 0))]))
	}
	lines.push('', '* = used in the ranking below', '')
	// Without this the folded numbers are unexplained: a "1" on a 0/1 gate for a three-storey option is
	// only trustworthy once the reader knows it is the worst storey rather than the average of them.
	lines.push(`Per-storey folding: gate metrics show the **worst floor**, every other metric shows the mean across floors.` +
		` Options with one storey are unaffected.`, '')

	lines.push(`## Diff vector (>= ${MIN_DIFF_COMPONENTS} differing components required for a real alternative)`)
	for (let i = 0; i < options.length; i++) {
		for (let j = i + 1; j < options.length; j++) {
			const distance = diffDistance(options[i], options[j])
			lines.push(distance < MIN_DIFF_COMPONENTS
				? `- ${options[i].name} vs ${options[j].name}: ${distance} components differ  <- VARIANTS of one idea, identical on ${sharedComponents(options[i], options[j]).join(', ')}`
				: `- ${options[i].name} vs ${options[j].name}: ${distance} components differ`)
		}
	}
	lines.push('')

	lines.push('## Findings')
	for (const option of options) {
		const counts = `${option.findings.critical} critical / ${option.findings.major} major / ${option.findings.moderate} moderate / ${option.findings.minor} minor`
		lines.push(`- ${option.name}: ${counts}${option.disqualified ? `  <- DISQUALIFIED as a candidate (${option.blockers.join(', ')})` : ''}`)
	}
	lines.push('')

	// Gate before semantics, the order the evaluator itself uses: a critical finding means the
	// model does not hold together, so ranking that option would recommend a plan that is broken.
	const rankable = options.filter(option => !option.disqualified)
	const disqualified = options.filter(option => option.disqualified)
	// Then variants before alternatives: ranking three redrawings of one idea and naming a winner
	// invents a trade-off nobody designed.
	const candidates = distinctAlternatives(rankable)
	const variants = rankable.filter(option => !candidates.includes(option))

	lines.push('## Ranking is weight-dependent - there is no universal winner')
	if (candidates.length < 2) {
		lines.push(`- cannot rank: only ${candidates.length} of ${options.length} options is a distinct, unblocked alternative`)
		for (const option of disqualified) lines.push(`  - ${option.name} is blocked by ${option.blockers.join(', ') || 'a critical finding'}`)
		for (const option of variants) lines.push(`  - ${option.name} repeats another option on every other diff component - a variant, not a second idea`)
		lines.push('- rank nothing: move the geometry on at least two diff-vector components, or clear the blockers with arch revise, then re-run compare')
	} else {
		if (disqualified.length) lines.push(`- excluded, blocked by a critical finding: ${disqualified.map(option => `${option.name} (${option.blockers.join(', ')})`).join(', ')}`)
		if (variants.length) lines.push(`- collapsed as variants of another option: ${variants.map(option => option.name).join(', ')}`)
		for (const profile of Object.keys(WEIGHT_PROFILES)) {
			const ranked = rankOptions(candidates, profile)
			lines.push(`- ${ranked.profile.padEnd(11)} -> ${ranked.order.map(entry => `${entry.name} (${entry.score})`).join(' > ')}`)
		}
		const winners = Object.keys(WEIGHT_PROFILES).map(profile => rankOptions(candidates, profile).order[0]?.name)
		lines.push('')
		lines.push(new Set(winners).size > 1
			? `The winner CHANGES with the weights (${[...new Set(winners)].join(', ')}). Choose the option that fits the stated objective, and say which objective that was.`
			: `The winner is stable across all four weight profiles (${winners[0]}). That is a real result, not a default - report it with the profiles tested.`)
	}
	lines.push('')
	lines.push(`## Pareto set (distinct, unblocked options only; no option beaten on every objective): ${paretoSet(candidates).join(', ') || 'none'}`)
	lines.push('')
	// One list, shared with the evaluation report. A comparison cannot decide any of these either, and
	// two hand-written wordings of the same limits will eventually disagree.
	lines.push('## What this table cannot decide')
	for (const limit of CAPABILITY_MANIFEST.cannotRun) lines.push(`- ${limit}`)
	lines.push('')
	lines.push('## Closure rights')
	for (const right of CLOSURE_RIGHTS) lines.push(`- ${right}`)
	return lines.join('\n')
}
