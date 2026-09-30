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
	lcg32,
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
import { advanceStanding, incomeMultiplier, readReputation, standingReading, REPUTATION_NEUTRAL } from '../../src/blueprint-editor/domain/economy/reputation'
import {
	advanceContinuity,
	continuityReading,
	createContinuityState,
	houseMultiplier,
	priceOfCreditCents,
	NEUTRALITY_RECOVERY_FRACTION,
	recordBreach,
} from '../../src/blueprint-editor/domain/economy/continuity'
import {
	createPressureState,
	dailyFineCents,
	pressureReading,
	settlePressure,
} from '../../src/blueprint-editor/domain/economy/highTable'
import {
	createWorldState,
	latestReleased,
	readWorld,
	releasePerson,
	settleWorldNight,
	type Faction,
	type WorldReading as FactionWorldReading,
} from '../../src/blueprint-editor/domain/economy/standing-world'
import { payrollCents, settleDay, staffHeadcount } from '../../src/blueprint-editor/domain/economy/upkeep'
import { objectiveInputFor, settleObjectives, ZERO_OBJECTIVE_STREAKS, type ObjectiveStreaks } from '../../src/blueprint-editor/domain/economy/objectives'
import type { ObjectiveReward } from '../../src/blueprint-editor/domain/economy/purchases'
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
	/** What the last closed day's board paid on top of its takings, and whether the day cap cut it. */
	readonly objectiveBonusCents: number
	readonly objectiveBonusCapped: boolean
	readonly objectiveStreaks: ObjectiveStreaks
	/** The street the plan ends on: who still sends people, and what the house is owed for it. */
	readonly street: (FactionWorldReading & { readonly declaredPerDay: number; readonly released: number }) | null
	/** Whose clients the plan actually served, from the ledger's own per-faction book. */
	readonly clientsByFaction: readonly { readonly faction: string; readonly served: number; readonly lost: number }[]
	/** What every ladder together says the house is worth, as a multiplier on face value. */
	readonly houseWorth: number
	/** The bank after the close took what it takes in play: wages and the price of the credit. */
	readonly keptCents: number
	/** What the last closed day's credit cost, taken off the bank at the close. */
	readonly creditCostCents: number
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
		{ w: canvas.width, h: canvas.height, tileSize: canvas.tileSize, streetTiles: data.layout.streetWidthTiles, streetFloorId: data.layout.streetFloorId },
		type => assetMap.get(type),
		getAssetTags,
	)
	const random = lcg32(options.seed ?? 0x9e3779b9)
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
	// The world the plan is measured in: released people, the factions they belong to, and the grudge
	// each one holds. Offline it used to be nobody's client but `neutral`'s, so a plan could be ranked
	// on a street that no played house would ever have walked.
	let world = createWorldState()
	const factionOfAgent = new Map<string, Faction>()
	let standingScore = REPUTATION_NEUTRAL
	let continuity = createContinuityState()
	let pressure = createPressureState()
	let incidents = 0
	/** The board is folded and paid offline exactly as a played house folds it - one close, one bonus. */
	let objectiveStreaks: ObjectiveStreaks = ZERO_OBJECTIVE_STREAKS
	let objectiveBonus: ObjectiveReward = { cents: 0, capped: false }
	/**
	 * What the house is worth right now, from the readings the close has already settled. The discount
	 * the ledger takes and the profit this tool ranks on are both priced through this one call, so an
	 * offline run cannot rank a plan on money a played house would never have kept.
	 */
	const currentWorth = () => houseMultiplier({
		standing: incomeMultiplier(standingScore),
		continuity: continuityReading(continuity),
		pressurePenalty: pressureReading(pressure).demandPenalty,
	})
	/** Who the plan actually pleased, counted by the ledger from the same events the app bills. */
	const factionTotals = new Map<string, { served: number; lost: number }>()
	const ledger = createTakingsLedger({
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		isVisitor: roleId => visitors.has(roleId),
		// The bank a plan is measured on is the bank a player would hold: the wage bill and the price
		// of its own credit both leave on the same close they leave in the app. The profit column used
		// to project payroll without ever taking it out, so the reported balance was money nobody kept.
		dailyChargeCents: () => payrollCents(staffHeadcount(config.pool ?? [], roleId => visitors.has(roleId))),
		dailyDiscountCents: dayCents => priceOfCreditCents(dayCents, currentWorth()),
		onDayClose: day => {
			// The day book as the close sees it, read BEFORE the fine moves: the app hands its board the
			// same moment (`useNpcSimulationCore`), and a board judged after the transfer would call a
			// day it could not pay a different verdict from the one the player got.
			const close = ledger.snapshot()
			for (const [faction, counted] of Object.entries(day.byFaction)) {
				const total = factionTotals.get(faction) ?? { served: 0, lost: 0 }
				total.served += counted.served
				total.lost += counted.lost
				factionTotals.set(faction, total)
			}
			standingScore = advanceStanding(standingScore, readReputation(day.served, day.walkOuts))
			incidents = day.incidents
			continuity = advanceContinuity(recordBreach(continuity, day.incidents), NEUTRALITY_RECOVERY_FRACTION)
			const underNotice = continuityReading(continuity).underPressure
			const bankCents = close.bankCents
			// The fine leaves the bank here exactly as it does in a played house
			// (`useNpcSimulationCore`), or the tool ranks a plan on money the player never keeps.
			const fine = underNotice ? dailyFineCents(bankCents) : 0
			pressure = settlePressure(pressure, { underNotice, bankCents })
			if (fine > 0) ledger.withdraw(fine)
			// The board settles and pays on the same boundary, through the same domain calls, so a plan
			// ranked offline is ranked on the money a played house would actually have kept.
			const settled = settleObjectives(
				objectiveInputFor({
					close,
					closedDay: day.day,
					moneyMultiplier: currentWorth(),
					staffHeadcount: staffHeadcount(config.pool ?? [], roleId => visitors.has(roleId)),
					neutralityScore: continuityReading(continuity).score,
					pressureOutstandingCents: pressure.outstandingCents,
				}),
				objectiveStreaks,
			)
			objectiveStreaks = settled.streaks
			objectiveBonus = settled.reward
			if (settled.reward.cents > 0) ledger.deposit(settled.reward.cents)
			// The street is told about the night too, through the same call the played house makes:
			// judged for the houses whose clients were here, faded for the ones it was not reminded of.
			world = settleWorldNight(world, day.byFaction)
		},
	})
	const tagsByKey = new Map(built.layout.interactionTargets.map(target => [interactionTargetKey(target), target.tags]))
	const resolver = createTakingsResolver({
		roleOf: agentId => engine.getAgent(agentId)?.roleId,
		tagsFor: (floorId, itemId, interactSpotId) => tagsByKey.get(interactionTargetKey({ floorId, itemId, interactSpotId })),
		factionOf: agentId => factionOfAgent.get(agentId),
	})

	// The same primitives the editor deploy uses - the role's walkable set filtered to its
	// spawn tiles - without the editor's anti-overlap cursor, which no measurement needs.
	const arrivalSpec = readOccupancy(config, data.layout as never).arrival
	const declaredPerDay = options.arrivalsPerDay ?? arrivalSpec?.walkInsPerDay ?? 0
	/** The number the flow reads live: lose a house and the offline crowd thins by the same rule. */
	const worldTrafficPerDay = () => readWorld(world, declaredPerDay).expectedWalkIns
	const arrivalsPerDay = options.arrivals ? declaredPerDay : 0
	const flow = options.arrivals
		? createArrivalFlow({
			arrivalsPerDay: worldTrafficPerDay,
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
	// One id function for the door and for the binding below, so an agent the ledger can price is
	// always the same agent the world has a face for.
	const arrivalId = (index: number) => `arr-${index}`
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
			const before = traffic.spawned
			stepTraffic({
				engine,
				flow,
				entrances,
				guestRoleId,
				speedFor,
				tick: engine.tickNumber,
				state: traffic,
				idFor: arrivalId,
			})
			// Every arrival the world released is somebody's client, bound to the id the door handed
			// it. Without this the offline run sees a lobby of strangers and cannot tell the plan that
			// keeps the peace from the one that loses a house over it.
			for (let i = before; i < traffic.spawned; i++) {
				world = releasePerson(world, i)
				const person = latestReleased(world)
				if (person) factionOfAgent.set(arrivalId(i), person.faction)
			}
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
		/** The street as the run left it: who still sends people, and what the house is owed now. */
		street: flow
			? {
				declaredPerDay: arrivalsPerDay,
				released: world.arrivals,
				...readWorld(world, declaredPerDay),
			}
			: null,
		/** The flow run, when it was asked for: what walked in, what left, and what should be inside. */
		flow: flow
			? {
				perDay: worldTrafficPerDay(),
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
		/** The board as the last close settled and paid it, so the offline run says what a played house got. */
		objectiveBonusCents: objectiveBonus.cents,
		objectiveBonusCapped: objectiveBonus.capped,
		objectiveStreaks,
		clientsByFaction: [...factionTotals.entries()]
			.map(([faction, counted]) => ({ faction, served: counted.served, lost: counted.lost }))
			.sort((a, b) => b.served + b.lost - (a.served + a.lost) || a.faction.localeCompare(b.faction)),
		houseWorth: worth,
		/** The bank after the close took what it takes in play: wages and the price of the credit. */
		keptCents: snapshot.bankCents,
		creditCostCents: snapshot.lastDayDiscountCents,
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
			`   x${report.reputation.multiplier.toFixed(2)} standing   kept ${money(report.keptCents)} after wages and ${money(report.creditCostCents)} of credit cost on the last closed day`,
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
			`  goals: last closed day paid ${money(report.objectiveBonusCents)} on top of its takings` +
			`${report.objectiveBonusCapped ? ' (capped at its share of the night)' : ''}` +
			`   best streak ${Math.max(0, ...Object.values(report.objectiveStreaks))} day(s)` + '\n' +
			`  clients by faction: ${report.clientsByFaction.length ? report.clientsByFaction.map(row => `${row.faction} ${row.served} served/${row.lost} walked out`).join(', ') : 'nobody the house could place'}` + '\n' +
		`  brief declares ${report.arrivalsPerDay ?? 'no'} arrivals/day - this plan turns over ${report.servicesPerDay} billed services/day est.` +
			(report.arrivalsPerDay ? ` (${Math.round((report.servicesPerDay / report.arrivalsPerDay) * 100)}% of them)` : ''),
	]
	if (report.flow) {
		lines.push(`  footfall ${report.flow.perDay}/day through ${report.flow.entrances} street door(s): ${report.flow.spawned} walked in, ${report.flow.departed} left, ${report.flow.present} inside now - the flow implies ${report.flow.expectedPresent} present for a ${report.flow.staySeconds}-sim-s stay`)
		if (!report.flow.entrances) lines.push('    no street door in this plan, so arrivals cannot enter at all')
	}
	if (report.street) {
		const street = report.street
		lines.push(`  the street: ${street.declaredPerDay}/day declared, ${street.expectedWalkIns}/day owed after the factions' verdict - ${street.released} released, ${street.returningShare ? Math.round(street.returningShare * 100) : 0}% of the roster is a regular` +
			`${street.estranged.length ? `   ESTRANGED: ${street.estranged.join(', ')}` : '   welcome everywhere'}`)
		// `served` and `lost` on a faction are nights judged well or ill, not clients: `creditService`
		// runs once per close. Printed as nights so nobody reads it against the client count above.
		lines.push(`    standings (nights judged): ${street.standings.map(entry => `${entry.id} ${entry.relations}/100 (${entry.served} good, ${entry.lost} bad)`).join('  ')}`)
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
