/**
 * takings.ts - run the real NPC simulation over a payload and read the money back.
 *
 * This is the scoreboard half of the design loop: the ledger only bills a service that a
 * visitor actually completes, so income is a measurement of circulation, not an opinion
 * about it. `arch eval` says whether a plan breaks its rules; this says what it earns.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
	NPC_ENGINE_DEFAULT_OPTIONS,
	NPC_ENGINE_TICKS_PER_SECOND,
	buildNpcEngineLayout,
	buildRoleWalkableMap,
	createNpcEnginePolicy,
	filterNpcSpawnTiles,
	interactionTargetKey,
	type NpcWalkableMap,
} from '../../src/engine/npc'
import {
	createTakingsLedger,
	createTakingsResolver,
	formatTakings,
	rateForTags,
	visitorRoleIds,
	TAKINGS_DAY_SECONDS,
} from '../../src/blueprint-editor/domain/economy/takings'
import { createArrivalFlow, createTrafficState, stepTraffic, streetEntrances, STREET_TILES_DEFAULT } from '../../src/blueprint-editor/domain/economy/arrivals'
import { advanceStanding, readReputation, standingReading, REPUTATION_NEUTRAL } from '../../src/blueprint-editor/domain/economy/reputation'
import {
	advanceContinuity,
	continuityReading,
	createContinuityState,
	houseMultiplier,
	NEUTRALITY_RECOVERY_FRACTION,
	recordBreach,
} from '../../src/blueprint-editor/domain/economy/continuity'
import {
	createPressureState,
	dailyFineCents,
	pressureReading,
	settlePressure,
} from '../../src/blueprint-editor/domain/economy/highTable'
import { settleDay, staffHeadcount } from '../../src/blueprint-editor/domain/economy/upkeep'
import { readBlueprintDataFile } from '../../src/blueprint-editor/store/schemaMigration'
import { readOccupancy } from './world'
import type { AssetDef, FloorData, NpcRole } from '../../src/blueprint-editor/domain/types'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')

export interface TakingsOptions {
	ticks?: number
	seed?: number
	/** Cap the deployed crowd, so a plan can be scored at any population. */
	agents?: number
	/**
	 * Run the declared footfall instead of a standing population: arrivals walk in through the
	 * street doors and leave when their stay is up. Visitor pool entries are replaced by arrivals,
	 * staff still deploy, so the crowd the plan serves is the crowd the brief declares.
	 */
	arrivals?: boolean
	/** Override the stay length in simulation seconds; defaults to a whole day. */
	staySeconds?: number
	/**
	 * Footfall to run. Left unset it is read from scripts/arch/spec.json through the canonical
	 * occupancy reader; a caller that already knows the number (a test, a what-if) passes it here,
	 * because that reader resolves its file by module URL and does not survive a bundled runner.
	 */
	arrivalsPerDay?: number
	/**
	 * How long a guest holds a line before giving up, in simulation seconds. A design lever, not a
	 * hidden constant: without it the reputation band is nearly unreachable at a calm clientele.
	 */
	patienceSeconds?: number
}

export interface TakingsRow {
	readonly key: string
	readonly count: number
}

export interface TakingsReport {
	readonly source: string
	readonly floors: number
	readonly agents: number
	readonly skipped: readonly TakingsRow[]
	readonly targets: number
	readonly queues: number
	readonly ticks: number
	readonly simSeconds: number
	readonly msPerTick: number
	/** Starts without matching ends: services begun and never released, the jam signature. */
	readonly started: number
	readonly completed: number
	readonly bankCents: number
	readonly perMinuteCents: number
	readonly served: number
	readonly walkOuts: number
	readonly queueAbandons: number
	/** Standing the run ended on, and the raw record it is recovering toward. */
	readonly reputation: { readonly score: number; readonly multiplier: number; readonly unproven: boolean }
	readonly evidenceScore: number
	/** The world outside: neutrality, what the High Table holds, and the scenes the last day charged. */
	readonly continuity: { readonly score: number; readonly underPressure: boolean; readonly breaches: number }
	readonly pressure: { readonly outstandingCents: number; readonly underAudit: boolean; readonly daysUnderPressure: number }
	readonly incidents: number
	/** What every ladder together says the house is worth, as a multiplier on face value. */
	readonly houseWorth: number
	readonly netCents: number
	/** The authored day length, and what the live rate projects onto it. */
	readonly daySeconds: number
	readonly daysCompleted: number
	readonly lastDayCents: number
	readonly perDayCents: number
	/** The per-day projection after the standing multiplier - the number payroll is charged against. */
	readonly netPerDayCents: number
	/** The crowd the plan deploys is also a cost: payroll, profit and runway are ranked here. */
	readonly staffHeadcount: number
	readonly payrollCents: number
	readonly profitPerDayCents: number
	readonly runwayDays: number | null
	readonly servicesPerDay: number
	/** Footfall the brief declares, read from scripts/arch/spec.json - the yardstick, not a target set here. */
	readonly arrivalsPerDay: number | null
	readonly flow: {
		readonly perDay: number
		readonly spawned: number
		readonly departed: number
		readonly entrances: number
		readonly expectedPresent: number
		readonly staySeconds: number
		readonly present: number
	} | null
	readonly byTag: readonly TakingsRow[]
	/** Completed services nobody charged for: the plan works, the tariff table does not know it. */
	readonly unbilled: readonly TakingsRow[]
	/** Completions by staff roles, which are work rather than revenue. */
	readonly staffServed: readonly TakingsRow[]
	readonly waitReasons: readonly TakingsRow[]
}

function makeRandom(seed: number): () => number {
	let state = seed >>> 0 || 1
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0
		return state / 4294967296
	}
}

function bump(table: Map<string, number>, key: string): void {
	table.set(key, (table.get(key) ?? 0) + 1)
}

function rows(table: Map<string, number>, limit = 12): TakingsRow[] {
	return [...table.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, limit)
		.map(([key, count]) => ({ key, count }))
}

export function measureTakings(payloadPath: string, options: TakingsOptions = {}): TakingsReport {
	const ticks = Math.max(1, Math.floor(options.ticks ?? 6000))
	const data = readBlueprintDataFile(JSON.parse(fs.readFileSync(payloadPath, 'utf8')))
	const canvas = data.layout.canvas
	const floors = data.layout.floors as unknown as FloorData[]
	const assetMap = new Map<string, AssetDef>(data.originAssets.map(asset => [asset.id, asset]))
	const getAssetTags = (type: string) => assetMap.get(type)?.tags
	const config = data.npcConfig

	const built = buildNpcEngineLayout(
		floors,
		{ w: canvas.width, h: canvas.height, tileSize: canvas.tileSize },
		type => assetMap.get(type),
		getAssetTags,
	)
	const random = makeRandom(options.seed ?? 0x9e3779b9)
	let engine: NpcEngine
	const policy = createNpcEnginePolicy({
		getConfig: () => config,
		floors: built.layout.floors,
		floorMaps: built.floorMaps,
		floorDataMap: built.floorDataMap,
		interactionTargets: built.layout.interactionTargets,
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		getTickNumber: () => engine.tickNumber,
		listAgents: () => engine.listAgents(),
		getAssetTags,
		getManagedTags: () => data.tags.map(tag => tag.id),
		random,
	})
	engine = new NpcEngine(built.layout, {
		...NPC_ENGINE_DEFAULT_OPTIONS,
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		// The same clearance the editor deploy passes, or the walkable set is not the one
		// the crowd was built against and every repath fails.
		agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
		queuePatienceSeconds: options.patienceSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.queuePatienceSeconds,
		random,
		// The policy owns the pathfinder, exactly as in the editor build - it must stay last.
		...policy,
	})

	const visitors = visitorRoleIds(config.roles)
	// Standing is a state, and the arch tool folds it on the same day boundary the app does, so a plan
	// measured offline and a plan playing live cannot drift apart. The world settles on that same
	// boundary for the same reason - a plan ranked by profit has to be worth what the played house
	// would have been worth, or the tool quietly measures a different game than the one being built.
	let standingScore = REPUTATION_NEUTRAL
	let continuity = createContinuityState()
	let pressure = createPressureState()
	let incidents = 0
	const ledger = createTakingsLedger({
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		isVisitor: roleId => visitors.has(roleId),
		onDayClose: day => {
			standingScore = advanceStanding(standingScore, readReputation(day.served, day.walkOuts))
			incidents = day.incidents
			continuity = advanceContinuity(recordBreach(continuity, day.incidents), NEUTRALITY_RECOVERY_FRACTION)
			const underNotice = continuityReading(continuity).underPressure
			const bankCents = ledger.snapshot().bankCents
			// The fine leaves the bank here exactly as it does in a played house
			// (`useNpcSimulationCore`), or the tool ranks a plan on money the player never keeps.
			const fine = underNotice ? dailyFineCents(bankCents) : 0
			pressure = settlePressure(pressure, { underNotice, bankCents })
			if (fine > 0) ledger.withdraw(fine)
		},
	})
	const tagsByKey = new Map(built.layout.interactionTargets.map(target => [interactionTargetKey(target), target.tags]))
	const resolver = createTakingsResolver({
		roleOf: agentId => engine.getAgent(agentId)?.roleId,
		tagsFor: (floorId, itemId, interactSpotId) => tagsByKey.get(interactionTargetKey({ floorId, itemId, interactSpotId })),
	})

	// The same primitives the editor deploy uses - the role's walkable set filtered to its
	// spawn tiles - without the editor's anti-overlap cursor, which no measurement needs.
	const arrivalSpec = readOccupancy(config, data.layout as never).arrival
	const declaredPerDay = options.arrivalsPerDay ?? arrivalSpec?.walkInsPerDay ?? 0
	const arrivalsPerDay = options.arrivals ? declaredPerDay : 0
	const flow = options.arrivals
		? createArrivalFlow({
			arrivalsPerDay,
			daySeconds: TAKINGS_DAY_SECONDS,
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			staySeconds: options.staySeconds,
		})
		: null
	const entrances = flow ? streetEntrances(floors, data.layout.streetWidthTiles ?? STREET_TILES_DEFAULT) : []
	const guestRoleId = config.pool.find(entry => visitors.has(entry.roleId))?.roleId ?? config.defaultRoleId
	const traffic = createTrafficState()
	const speedFor = (floorId: string) => {
		const cellSize = built.floorMaps.get(floorId)?.cellSize ?? 1
		return (Math.max(0.01, config.speed || 1 / 30) * NPC_ENGINE_TICKS_PER_SECOND) / cellSize
	}
	const skipped = new Map<string, number>()
	let deployed = 0
	const maxAgents = options.agents === undefined ? undefined : Math.max(0, Math.floor(options.agents))
	pool: for (const entry of config.pool) {
		const role = config.roles.find(candidate => candidate.id === entry.roleId) as NpcRole | undefined
		if (!role) {
			bump(skipped, `unknown-role:${entry.roleId}`)
			continue
		}
		if (flow && visitors.has(entry.roleId)) {
			// Arrivals replace the standing visitors; staff remain, or nothing serves the traffic.
			bump(skipped, `replaced-by-arrivals:${entry.roleId}`)
			continue
		}
		for (const floor of floors) {
			const map: NpcWalkableMap | undefined = built.floorMaps.get(floor.id)
			if (!map) continue
			if (entry.floorIds?.length && !entry.floorIds.includes(floor.id)) continue
			const cells = [...filterNpcSpawnTiles(buildRoleWalkableMap(map, floor, role, getAssetTags), floor, role.id)]
			if (!cells.length) {
				bump(skipped, `no-spawn-cells:${floor.id}/${role.id}`)
				continue
			}
			const speed = Math.max(0.01, config.speed || 1 / 30) * NPC_ENGINE_TICKS_PER_SECOND / map.cellSize
			const wanted = maxAgents === undefined ? entry.count : Math.max(0, Math.min(entry.count, maxAgents - deployed))
			if (wanted < entry.count) bump(skipped, `capped:${floor.id}/${role.id}`)
			for (let i = 0; i < wanted; i++) {
				const [x, y] = cells[(deployed + i) % cells.length].split(',').map(Number)
				engine.addAgent({ id: `arch-${deployed + i}`, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed })
			}
			deployed += wanted
			if (maxAgents !== undefined && deployed >= maxAgents) break pool
		}
	}

	const unbilled = new Map<string, number>()
	const staffServed = new Map<string, number>()
	const waitReasons = new Map<string, number>()
	let starts = 0
	let ends = 0
	const clock = performance.now()
	for (let tick = 0; tick < ticks; tick++) {
		engine.tick(1)
		if (flow) {
			stepTraffic({
				engine,
				flow,
				entrances,
				guestRoleId,
				speedFor,
				tick: engine.tickNumber,
				state: traffic,
				idFor: index => `arr-${index}`,
			})
		}
		const events = engine.drainEvents()
		for (const event of events) {
			if (event.type === 'interaction-start') {
				starts++
				continue
			}
			if (event.type === 'waiting' && event.reason) bump(waitReasons, event.reason)
			if (event.type !== 'interaction-end') continue
			ends++
			const source = resolver(event)
			if (!source) continue
			if (!visitors.has(source.roleId)) {
				bump(staffServed, source.roleId)
				continue
			}
			if (rateForTags(source.tags)) continue
			bump(unbilled, source.tags.join('+') || '(no tags)')
		}
		// `present` is the denominator a scene is measured against, and the live sim hands the ledger
		// the crowd it is drawing. Offline the engine's own agent list is that same crowd; without it
		// every run reads as a silent house and no plan can ever be charged a scene.
		ledger.ingest(events, engine.tickNumber, resolver, engine.listAgents().length)
	}
	const msPerTick = (performance.now() - clock) / ticks
	const snapshot = ledger.snapshot()
	const evidence = readReputation(snapshot.served, snapshot.walkOuts)
	const reputation = standingReading(standingScore, evidence)
	const continuityNow = continuityReading(continuity)
	const pressureNow = pressureReading(pressure)
	// One multiplier for all three ladders, the same function the panel reads. A plan that cannot
	// hold its neutrality is worth less, and the tool has to price that the way the game does or it
	// would rank a house the player cannot actually run.
	const worth = houseMultiplier({
		standing: reputation.multiplier,
		continuity: continuityNow,
		pressurePenalty: pressureNow.demandPenalty,
	})
	// Income is net of everything the house is worth tonight, the same way the HUD reads it, so a
	// jammed plan cannot look self-funding at the gross line and insolvent at the bank.
	const netPerDayCents = Math.round(snapshot.perDayCents * worth)
	const day = settleDay({
		bankCents: snapshot.bankCents,
		incomePerDayCents: netPerDayCents,
		staffHeadcount: staffHeadcount(config.pool ?? [], roleId => visitors.has(roleId)),
	})

	return {
		source: path.relative(ROOT, payloadPath),
		floors: floors.length,
		agents: deployed,
		skipped: rows(skipped, 6),
		targets: built.layout.interactionTargets.length,
		queues: built.layout.queues?.length ?? 0,
		ticks,
		simSeconds: snapshot.simSeconds,
		msPerTick,
		started: starts,
		completed: ends,
		daySeconds: TAKINGS_DAY_SECONDS,
		daysCompleted: snapshot.daysCompleted,
		lastDayCents: snapshot.lastDayCents,
		perDayCents: snapshot.perDayCents,
		netPerDayCents,
		staffHeadcount: day.staffHeadcount,
		payrollCents: day.payrollCents,
		profitPerDayCents: day.profitCents,
		runwayDays: day.runwayDays,
		servicesPerDay: snapshot.servicesPerDay,
		arrivalsPerDay: flow ? arrivalsPerDay : (arrivalSpec?.walkInsPerDay ?? null),
		/** The flow run, when it was asked for: what walked in, what left, and what should be inside. */
		flow: flow
			? {
				perDay: arrivalsPerDay,
				spawned: traffic.spawned,
				departed: traffic.departed,
				entrances: entrances.length,
				expectedPresent: flow.expectedPresent,
				staySeconds: flow.staySeconds,
				present: engine.listAgents().length,
			}
			: null,
		bankCents: snapshot.bankCents,
		perMinuteCents: snapshot.perMinuteCents,
		served: snapshot.served,
		walkOuts: snapshot.walkOuts,
		queueAbandons: snapshot.queueAbandons,
		reputation,
		evidenceScore: evidence.score,
		/** What the world outside says about this house, priced the same way the panel prices it. */
		continuity: continuityNow,
		pressure: pressureNow,
		incidents,
		houseWorth: worth,
		netCents: Math.round(snapshot.bankCents * worth),
		byTag: rows(
			snapshot.byTag.reduce((map, entry) => {
				map.set(`${entry.tag} (${entry.count}x)`, entry.cents)
				return map
			}, new Map<string, number>()),
		),
		unbilled: rows(unbilled),
		staffServed: rows(staffServed),
		waitReasons: rows(waitReasons, 8),
	}
}

function money(cents: number): string {
	return formatTakings(cents)
}

export function formatTakingsReport(report: TakingsReport): string {
	const lines = [
		`takings - ${report.source}`,
		`  floors ${report.floors}  agents ${report.agents}  targets ${report.targets}  queues ${report.queues}  ticks ${report.ticks} (${report.simSeconds} sim-s, ${report.msPerTick.toFixed(2)} ms/tick)`,
		`  bank ${money(report.bankCents)}   per minute ${money(report.perMinuteCents)}   served ${report.served}   walk-outs ${report.walkOuts}   abandoned lines ${report.queueAbandons}`,
		`  reputation ${report.reputation.score}/100${report.reputation.unproven ? ' (unproven - nothing served or lost yet)' : ` (recovering toward a ${report.evidenceScore}/100 record)`}` +
			`   x${report.reputation.multiplier.toFixed(2)} standing   net ${money(report.netCents)} of ${money(report.bankCents)} gross`,
		`  neutrality ${report.continuity.score}/100   scenes ${report.incidents}   breaches ${report.continuity.breaches}` +
			`${report.continuity.underPressure ? '   the High Table has taken notice' : ''}` +
			`${report.pressure.outstandingCents > 0 ? `   outstanding ${money(report.pressure.outstandingCents)} over ${report.pressure.daysUnderPressure} day(s)` : ''}` +
			`${report.pressure.underAudit ? '   UNDER AUDIT' : ''}` +
			`   house worth x${report.houseWorth.toFixed(2)}`,
		`  services started ${report.started}, completed ${report.completed}${report.started > report.completed ? ` - ${report.started - report.completed} never released` : ''}`,
		`  per day (est. over ${report.daySeconds} sim-s) ${money(report.perDayCents)}` +
			(report.netPerDayCents !== report.perDayCents ? ` gross, ${money(report.netPerDayCents)} net of standing` : '') +
			`   services/day (est.) ${report.servicesPerDay}` +
			(report.daysCompleted > 0 ? `   days closed ${report.daysCompleted}, last ${money(report.lastDayCents)}` : ''),
		`  payroll ${money(report.payrollCents)}/day for ${report.staffHeadcount} staff   ` +
			`profit ${money(report.profitPerDayCents)}/day` +
			(report.runwayDays === null ? '   self-funding' : `   ${report.runwayDays} day(s) of bank left`) + '\n' +
		`  brief declares ${report.arrivalsPerDay ?? 'no'} arrivals/day - this plan turns over ${report.servicesPerDay} billed services/day est.` +
			(report.arrivalsPerDay ? ` (${Math.round((report.servicesPerDay / report.arrivalsPerDay) * 100)}% of them)` : ''),
	]
	if (report.flow) {
		lines.push(`  footfall ${report.flow.perDay}/day through ${report.flow.entrances} street door(s): ${report.flow.spawned} walked in, ${report.flow.departed} left, ${report.flow.present} inside now - the flow implies ${report.flow.expectedPresent} present for a ${report.flow.staySeconds}-sim-s stay`)
		if (!report.flow.entrances) lines.push('    no street door in this plan, so arrivals cannot enter at all')
	}
	const section = (title: string, list: readonly TakingsRow[]) => {
		lines.push(`  ${title}${list.length ? '' : '  (none)'}`)
		for (const row of list) lines.push(`    ${row.key}  ${row.count}`)
	}
	if (report.byTag.length) section('earned by facility', report.byTag)
	section('completed but unbilled', report.unbilled)
	section('completed by staff (work, not revenue)', report.staffServed)
	section('skipped deployments', report.skipped)
	section('wait reasons', report.waitReasons)
	return `${lines.join('\n')}\n`
}
