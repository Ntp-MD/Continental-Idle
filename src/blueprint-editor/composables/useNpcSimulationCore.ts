import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import {
	NpcEngine,
	NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
	NPC_ENGINE_DEFAULT_OPTIONS,
	NPC_ENGINE_TICKS_PER_SECOND,
	buildNpcEngineLayout,
	buildRoleWalkableMap,
	filterNpcSpawnTiles,
	createNpcEnginePolicy,
	interactionTargetKey,
	floorMatchesTargetTags,
	type NpcCanvasBounds,
	type NpcWalkableMap,
	type NpcEngineEvent,
} from '@/engine/npc'
import type { AssetDef, FloorData, NpcRole, NpcSimDot, NpcSimulationConfig } from '@/blueprint-editor/domain/types'
import {
	isNpcConfig,
	clampInt,
	NPC_DEFAULT_SPEED,
	NPC_OPTION_DEFAULTS,
	NPC_FRAME_DEFAULTS,
} from '@/blueprint-editor/domain/types'
import { mergeNpcConfig, cloneDeepRaw } from '@/blueprint-editor/blueprintStore'
import { editorLog } from '@/blueprint-editor/domain/logger'
import {
	createTakingsLedger,
	createTakingsResolver,
	visitorRoleIds,
	TAKINGS_DAY_SECONDS,
	type TakingsLedger,
	type FactionDay,
	type TakingsSnapshot,
	type TakingsResolver,
} from '@/blueprint-editor/domain/economy/takings'
import { payrollCents, staffHeadcount, STAFF_DAY_WAGE_CENTS } from '@/blueprint-editor/domain/economy/upkeep'
import {
	objectiveInputFor,
	settleObjectives,
	ZERO_OBJECTIVE_STREAKS,
	type Objective,
	type ObjectiveSettlement,
	type ObjectiveStreaks,
} from '@/blueprint-editor/domain/economy/objectives'
import type { ObjectiveReward } from '@/blueprint-editor/domain/economy/purchases'
import { strikeFromClose, type StaffStrike } from '@/blueprint-editor/domain/economy/insolvency'
import {
	advanceStanding,
	clampStanding,
	incomeMultiplier,
	readReputation,
	standingReading,
	REPUTATION_NEUTRAL,
	type ReputationReading,
} from '@/blueprint-editor/domain/economy/reputation'
import {
	createArrivalFlow,
	createTrafficState,
	stepTraffic,
	streetEntrances,
	STREET_TILES_DEFAULT,
	type ArrivalFlow,
	type TrafficState,
} from '@/blueprint-editor/domain/economy/arrivals'
import {
	advanceContinuity,
	continuityReading,
	createContinuityState,
	houseMultiplier,
	NEUTRALITY_RECOVERY_FRACTION,
	priceOfCreditCents,
	recordBreach,
	type ContinuityReading,
	type ContinuityState,
} from '@/blueprint-editor/domain/economy/continuity'
import {
	createPressureState,
	dailyFineCents,
	pressureReading,
	settlePressure,
	type PressureReading,
	type PressureState,
} from '@/blueprint-editor/domain/economy/highTable'
import {
	createWorldState,
	latestReleased,
	readWorld,
	releasePerson,
	settleWorldNight,
	type Faction,
	type WorldReading as FactionWorldReading,
	type WorldState,
} from '@/blueprint-editor/domain/economy/standing-world'
import { updateSimDot, pruneStaleDots, pruneAgentKeys, pruneWaitReasons, filterDotsForFloor, type NpcSimLook } from './npcSimProjection'

// Matches the pool-count ceiling the ingress normalizer accepts (domain/schema/npc.ts), so a pool
// saved at 500 does not silently deploy as 100.
const MAX_ROLE_SPAWN_COUNT = 1000
const SYNC_INTERVAL_MS = 250

export interface NpcSimulationCoreHost {
	getConfig(): NpcSimulationConfig | undefined
	getFloors(): readonly FloorData[]
	getCanvas(): NpcCanvasBounds
	getViewFloorId(): string | null
	idPrefix: string
	random?: () => number
	getAssetDef?(type: string): AssetDef | undefined
	getAssetTags?(type: string): string[] | undefined
	getManagedTags?(): readonly string[]
}

function resolveRole(config: NpcSimulationConfig, roleId: string): NpcRole | undefined {
	return config.roles.find(role => role.id === roleId)
		?? config.roles.find(role => role.id === config.defaultRoleId)
		?? config.roles[0]
}

export function latchArrivalEvent(
	arrived: Set<string>,
	marks: Map<string, number>,
	event: NpcEngineEvent,
	idPrefix: string,
): void {
	if (event.type !== 'interaction-start') return
	if (arrived.has(event.agentId)) return
	if (!event.agentId.startsWith(idPrefix)) return
	arrived.add(event.agentId)
	marks.set(event.agentId, event.tick)
}

export const ARRIVAL_MARK_MAX_AGE_TICKS = 5 * NPC_ENGINE_TICKS_PER_SECOND
export const ARRIVAL_MARK_LIVE_CAP = 50

export function pruneArrivalMarks(marks: Map<string, number>, currentTick: number): void {
	for (const [agentId, tick] of marks) {
		if (currentTick - tick > ARRIVAL_MARK_MAX_AGE_TICKS) marks.delete(agentId)
	}
	if (marks.size <= ARRIVAL_MARK_LIVE_CAP) return
	const byAge = [...marks.entries()].sort((a, b) => a[1] - b[1])
	for (const [agentId] of byAge.slice(0, byAge.length - ARRIVAL_MARK_LIVE_CAP)) marks.delete(agentId)
}

interface NpcSimCoreState {
	npcs: ShallowRef<NpcSimDot[]>
	socialEvents: ShallowRef<NpcEngineEvent[]>
	isPaused: Ref<boolean>
	simSpeed: Ref<number>
	config: Ref<NpcSimulationConfig>
	animationId: number | null
	engine: NpcEngine | null
	deploymentActive: boolean
	nextId: number
	spawnFloorOverride: string | null
	tickCostEma: number
	floorMaps: Map<string, NpcWalkableMap>
	floorDataMap: Map<string, FloorData>
	currentCanvas: NpcCanvasBounds | null
	viewFloorId: string | null
	lastSyncAt: number
	frameDots: Map<string, NpcSimDot>
	waitReasons: Map<string, string>
	arrived: Set<string>
	arrivalMarks: Map<string, number>
	seenAgentIds: Set<string>
	dotRoleColors: Map<string, string>
	dotRoleLooks: Map<string, NpcSimLook>
	targetTagsByKey: Map<string, readonly string[]>
	visitorRoleIds: Set<string>
	takings: TakingsLedger
	takingsResolver: TakingsResolver | null
	trafficOn: Ref<boolean>
	trafficFlow: ArrivalFlow | null
	trafficState: TrafficState
	entrances: { floorId: string; x: number; y: number }[]
	/** Staff sent home by a day the bank could not pay, held so a later paid day can bring them back. */
	strippedStaff: { id: string; roleId: string; floorId: string; x: number; y: number; speed: number }[]
	/** The day-book stamp the last strike decision was made on, so one close decides once. */
	strikeDay: number
	strike: StaffStrike
	/** Standing is a state now: it lags the counted evidence and recovers one closed day at a time. */
	standingScore: number
	/** The world layer: neutrality, the House of Peace's pressure, and who the house still welcomes. */
	continuity: ContinuityState
	pressure: PressureState
	world: WorldState
	/** Incidents the last closed day charged, handed over by the ledger on the same boundary. */
	incidentsToday: number
	/** The day-book stamp the world last settled on, so one close settles the world once. */
	worldDay: number
	/**
	 * What the house is being asked to do, and how many closed days in a row it has done it. Folded
	 * on the same close as the world, so a goal can never be met by a day the house did not live.
	 */
	objectiveStreaks: ObjectiveStreaks
	/**
	 * What the last closed day paid for the board, and whether the day cap cut it. Settled with the
	 * streaks on the same close rather than re-derived by whoever reads the panel, so the number on
	 * screen is the number the bank got.
	 */
	objectiveReward: ObjectiveReward
	/**
	 * Which faction each arrival in the house belongs to, keyed by the agent id the traffic step gave
	 * it. Held beside the crowd rather than in the world roster, because the roster forgets after
	 * `WORLD_MEMORY_CAPACITY` faces while the agent is still standing at the bar being served.
	 */
	factionOfAgent: Map<string, Faction>
}

function getAssetTagsSafe(host: NpcSimulationCoreHost): ((type: string) => string[] | undefined) | undefined {
	return host.getAssetTags ? (type: string) => host.getAssetTags!(type) : undefined
}

function getAssetDefSafe(host: NpcSimulationCoreHost): ((type: string) => AssetDef | undefined) | undefined {
	return host.getAssetDef ? (type: string) => host.getAssetDef!(type) : undefined
}

function isRoleAllowedOnFloor(state: NpcSimCoreState, roleId: string, floorId: string): boolean {
	const floor = state.floorDataMap.get(floorId)
	if (!floor?.allowedRoleIds?.length) return true
	return floor.allowedRoleIds.includes(roleId)
}

function dotColorFor(state: NpcSimCoreState, requestedRoleId: string): string {
	let color = state.dotRoleColors.get(requestedRoleId)
	if (color === undefined) {
		color = resolveRole(state.config.value, requestedRoleId)?.color ?? '#8ecae6'
		state.dotRoleColors.set(requestedRoleId, color)
	}
	return color
}

function dotLookFor(state: NpcSimCoreState, requestedRoleId: string): NpcSimLook {
	let look = state.dotRoleLooks.get(requestedRoleId)
	if (look === undefined) {
		const appearance = resolveRole(state.config.value, requestedRoleId)?.appearance
		look = appearance ? { ...appearance } : {}
		state.dotRoleLooks.set(requestedRoleId, look)
	}
	return look
}

function takingsSourceIndex(state: NpcSimCoreState) {
	return {
		roleOf: (agentId: string) => state.engine?.getAgent(agentId)?.roleId,
		// The engine owns the target-key format, so the lookup goes through its helper.
		tagsFor: (floorId: string, itemId: string, interactSpotId: string) =>
			state.targetTagsByKey.get(interactionTargetKey({ floorId, itemId, interactSpotId })),
		// Whose client this is. Only an arrival the world released has an answer; the standing pool
		// does not, and the ledger books that as a neutral client rather than as nobody.
		factionOf: (agentId: string) => state.factionOfAgent.get(agentId),
	}
}

// Built once per simulation: it closes over `state`, whose engine and target index it reads later.
function takingsResolverFor(state: NpcSimCoreState): TakingsResolver {
	state.takingsResolver ??= createTakingsResolver(takingsSourceIndex(state))
	return state.takingsResolver
}

/**
 * The deployed visitor crowd becomes traffic instead of a standing number: the same count that was
 * authored to be present now walks in per day, so presence and footfall stay one fact (L = lambda x W).
 */
function visitorTrafficPerDay(state: NpcSimCoreState): number {
	return state.config.value.pool
		.filter(entry => state.visitorRoleIds.has(entry.roleId))
		.reduce((sum, entry) => sum + entry.count, 0)
}

function guestRoleIdFor(state: NpcSimCoreState): string {	return state.config.value.pool.find(entry => state.visitorRoleIds.has(entry.roleId))?.roleId ?? state.config.value.defaultRoleId
}

function configAgentSpeed(state: NpcSimCoreState): number {
	return Math.max(0.01, state.config.value.speed || 1 / 30)
}

/** Tiles per tick, from the one speed rule. `speed` is overridable so a jittered spawn stays on it. */
function agentSpeedFor(state: NpcSimCoreState, floorId: string, speed = configAgentSpeed(state)): number {
	return speed * NPC_ENGINE_TICKS_PER_SECOND / Math.max(1, state.floorMaps.get(floorId)?.cellSize ?? 1)
}

/**
 * Walk-ins the world would send today: the authored crowd, weighted by the factions still willing to
 * come. Read live rather than captured at deploy, because a house that loses a faction has to feel it
 * in the footfall the same day, not the next time the plan is re-deployed.
 */
function worldTrafficPerDay(state: NpcSimCoreState): number {
	return readWorld(state.world, visitorTrafficPerDay(state)).expectedWalkIns
}

/**
 * What the house is worth on the night: its standing with the crowd, its neutrality, and the price the
 * High Table is charging for it - multiplied once, in the one function the panel and `arch takings`
 * also call. The bank's closing discount and the percentage the screen explains are read from here, so
 * a house cannot be told it is worth 80% and then billed as though it were worth 100.
 */
function houseWorthOf(state: NpcSimCoreState): number {
	return houseMultiplier({
		standing: incomeMultiplier(state.standingScore),
		continuity: continuityReading(state.continuity),
		pressurePenalty: pressureReading(state.pressure).demandPenalty,
	})
}

function armTraffic(state: NpcSimCoreState): void {
	state.trafficState = createTrafficState()
	if (!state.trafficOn.value) {
		state.trafficFlow = null
		return
	}
	const perDay = visitorTrafficPerDay(state)
	if (perDay <= 0) {
		state.trafficOn.value = false
		return
	}
	state.trafficFlow = createArrivalFlow({
		arrivalsPerDay: () => worldTrafficPerDay(state),
		daySeconds: TAKINGS_DAY_SECONDS,
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
	})
	// Replacing the resident visitors, not stacking arrivals on top of them: a room that holds the
	// crowd twice measures itself twice.
	for (const agent of state.engine?.listAgents() ?? []) {
		if (agent.roleId && state.visitorRoleIds.has(agent.roleId)) state.engine?.removeAgent(agent.id)
	}
}

/** A fresh deployment is a fresh ledger: nobody is off duty and the day book starts again. */
function clearStrike(state: NpcSimCoreState): void {
	state.strippedStaff = []
	state.strikeDay = 0
	state.strike = { onDuty: 0, offDuty: 0, insolvent: false }
}

/**
 * An unpaid day takes staff off the floor, and a later paid day brings them back. The ledger owns
 * the money and `insolvency.ts` owns the crew rule; this only moves agents, once per closed day.
 */
function applyPayrollStrike(state: NpcSimCoreState): void {
	const engine = state.engine
	if (!engine) return
	const close = state.takings.snapshot()
	if (close.daysCompleted === state.strikeDay) return
	state.strikeDay = close.daysCompleted
	const present = engine.listAgents().filter(agent => agent.roleId && !state.visitorRoleIds.has(agent.roleId))
	const strike = strikeFromClose({
		payrollCents: close.lastDayPayrollCents,
		unpaidCents: close.lastDayUnpaidCents,
		staffHeadcount: present.length + state.strippedStaff.length,
		wageCents: STAFF_DAY_WAGE_CENTS,
	})
	state.strike = strike
	const surplus = present.length - strike.onDuty
	if (surplus > 0) {
		// The last-deployed staff are the ones sent home, so the crew that stays is the crew the
		// role's own spawn cells were armed with.
		for (const agent of present.slice(present.length - surplus)) {
			if (!agent.roleId) continue
			state.strippedStaff.push({ id: agent.id, roleId: agent.roleId, floorId: agent.floorId, x: agent.x, y: agent.y, speed: agent.speed })
			engine.removeAgent(agent.id)
		}
		editorLog.warn('NpcPayroll', `${strike.offDuty} of ${strike.onDuty + strike.offDuty} staff unpaid - the day could not be paid, so they are off duty`)
		return
	}
	for (let i = 0; i < -surplus && state.strippedStaff.length > 0; i++) {
		const saved = state.strippedStaff.pop()!
		engine.addAgent({
			id: saved.id,
			roleId: saved.roleId,
			floorId: saved.floorId,
			x: saved.x,
			y: saved.y,
			targetX: saved.x,
			targetY: saved.y,
			speed: saved.speed,
		})
	}
}

/**
 * The world settles on the same boundary the payroll and the standing use, and once per closed day.
 *
 * The order matters and is the whole story: what the night cost (incidents) is charged to neutrality
 * first, the house then recovers a step toward safety, and only what is left of the day buys the
 * High Table off. Settling the House before the night was counted would forgive a scene the player
 * could see, and the two would disagree about the same day.
 */
/**
 * A fresh deployment is a fresh house. The world owes a newly opened Continental nothing, and
 * inheriting yesterday's breaches would punish a player who re-deployed the same plan - so this is
 * shared by `deploy` and `reset` rather than written twice and drifting.
 */
function clearWorld(state: NpcSimCoreState): void {
	state.continuity = createContinuityState()
	state.pressure = createPressureState()
	state.world = createWorldState()
	state.incidentsToday = 0
	state.worldDay = 0
	state.objectiveStreaks = ZERO_OBJECTIVE_STREAKS
	state.objectiveReward = NO_OBJECTIVE_REWARD
	// A re-deployed crowd is nobody's client yet: the ids the last run's traffic handed out are gone
	// with it, and a stale binding would credit a faction for a stranger.
	state.factionOfAgent.clear()
}

const NO_OBJECTIVE_REWARD: ObjectiveReward = { cents: 0, capped: false }

/**
 * The day settled against the counters the house already keeps, in the one order that makes the
 * bonus honest: read the night, fold its streaks, then price what the fold earned. One function, so a
 * goal and a profit verdict can never disagree about whether the day was a good one - the payroll here
 * is the payroll that was charged, not a fresh estimate of it.
 */
function objectiveSettlementFor(state: NpcSimCoreState, close: TakingsSnapshot, closedDay: number): ObjectiveSettlement {
	return settleObjectives(
		objectiveInputFor({
			close,
			closedDay,
			moneyMultiplier: houseWorthOf(state),
			staffHeadcount: staffHeadcount(state.config.value.pool, roleId => state.visitorRoleIds.has(roleId)),
			neutralityScore: continuityReading(state.continuity).score,
			pressureOutstandingCents: state.pressure.outstandingCents,
		}),
		state.objectiveStreaks,
	)
}

function objectiveBoardFor(state: NpcSimCoreState, close: TakingsSnapshot): readonly Objective[] {
	return objectiveSettlementFor(state, close, close.daysCompleted).board
}

function settleWorldDay(
	state: NpcSimCoreState,
	closedDay: number,
	incidents: number,
	close: TakingsSnapshot,
	byFaction: Readonly<Partial<Record<Faction, FactionDay>>>,
): void {
	// The stamp comes from the ledger's own close, not from a snapshot read here: during the close
	// the day book has not rolled yet, so reading it back skipped a whole day. Found by the probe -
	// the day still closed, it simply settled nothing, and no assertion caught it.
	if (closedDay === state.worldDay) return
	state.worldDay = closedDay

	state.incidentsToday = incidents
	state.continuity = recordBreach(state.continuity, incidents)
	state.continuity = advanceContinuity(state.continuity, NEUTRALITY_RECOVERY_FRACTION)
	const underNotice = continuityReading(state.continuity).underPressure
	// The fine is a transfer, not a tally: `outstandingCents` is declared as money the House has
	// already taken, so the day it is charged is the day it leaves the ledger.
	const fine = underNotice ? dailyFineCents(close.bankCents) : 0
	state.pressure = settlePressure(state.pressure, { underNotice, bankCents: close.bankCents })
	if (fine > 0) state.takings.withdraw(fine)
	// A goal is judged on the night that just closed, and folded once here rather than by whatever
	// polls the board: a streak that a 250 ms timer could advance thirty times is not a streak.
	const objectives = objectiveSettlementFor(state, close, closedDay)
	state.objectiveStreaks = objectives.streaks
	state.objectiveReward = objectives.reward
	// A met night pays through `deposit`, the ledger's own verb for money no served interaction
	// produced: it moves the bank and nothing else, so the bonus cannot raise the live rate a streak is
	// partly judged on. It lands after that day's payroll and after the House's fine, so a good night
	// never rescues the wage bill it arrived to reward.
	if (objectives.reward.cents > 0) state.takings.deposit(objectives.reward.cents)
	// Only the groups whose clients actually came through are judged. Crediting every faction on the
	// roster for one faction's bad night made the ladder weather rather than consequence: a rival who
	// was never served cannot be offended by the queue a continental's people stood in. A faction with
	// no client tonight is simply absent from the book, so it moves not at all.
	// One night, settled the one way: the houses whose clients were here are judged, the rest fade a
	// step toward even. The same call `arch takings` makes, so a plan ranked offline is ranked on the
	// street a played house would actually be left with.
	state.world = settleWorldNight(state.world, byFaction)
	if (incidents > 0) {
		editorLog.warn('NpcContinuity', `${incidents} scene(s) in the house - neutrality is down to ${continuityReading(state.continuity).score}`)
	}
}

function syncAgents(state: NpcSimCoreState): void {
	const currentEngine = state.engine
	if (!currentEngine) return
	const agents = currentEngine.listAgents()
	state.seenAgentIds.clear()
	for (const agent of agents) {
		const map = state.floorMaps.get(agent.floorId)
		if (!map) continue
		state.seenAgentIds.add(agent.id)
		state.frameDots.set(
			agent.id,
			updateSimDot(state.frameDots.get(agent.id), agent, map.cellSize, roleId => dotColorFor(state, roleId), roleId => dotLookFor(state, roleId)),
		)
	}
	pruneStaleDots(state.frameDots, state.seenAgentIds)
	// An arrival that has left the building takes its identity with it: the binding is of an agent id
	// to a face, and the id is gone.
	pruneAgentKeys(state.factionOfAgent, state.seenAgentIds)
	pruneWaitReasons(state.waitReasons, state.frameDots)
	const now = performance.now()
	if (now - state.lastSyncAt >= SYNC_INTERVAL_MS && !state.isPaused.value) {
		state.lastSyncAt = now
		state.npcs.value = filterDotsForFloor(state.frameDots.values(), state.viewFloorId)
	}
}

function spawnAgents(state: NpcSimCoreState, host: NpcSimulationCoreHost, floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
	if (!state.engine) return
	const rand = host.random ?? Math.random
	state.npcs.value = []
	const occupiedSpawnKeys = new Set<string>()
	let spawnCursor = 0
	const skipped = new Map<string, number>()
	const skip = (reason: string, count: number) => { skipped.set(reason, (skipped.get(reason) ?? 0) + count) }
	let fallbackWarned = false
	let spawned = 0

	for (const entry of state.config.value.pool) {
		const count = clampInt(entry.count || 0, 0, MAX_ROLE_SPAWN_COUNT)
		const role = resolveRole(state.config.value, entry.roleId)
		if (!role) { skip('unknown-role', count * floors.length); continue }
		if (entry.roleId && entry.roleId !== role.id && !state.config.value.roles.some(candidate => candidate.id === entry.roleId)) {
			if (!fallbackWarned) {
				editorLog.warn('NpcSpawn', `Pool references undefined role "${entry.roleId}" - spawning as "${role.id}" instead`)
				fallbackWarned = true
			}
			skip('role-fallback', count * floors.length)
		}
		for (const floor of floors) {
			if (state.spawnFloorOverride && floor.id !== state.spawnFloorOverride) { skip('floor-override', count); continue }
			const allowedFloorIds = entry.floorIds ?? []
			if (allowedFloorIds.length > 0 && !allowedFloorIds.includes(floor.id)) { skip('floor-id-filter', count); continue }
			if (!isRoleAllowedOnFloor(state, role.id, floor.id)) { skip('role-floor-restriction', count); continue }
			if (!floorMatchesTargetTags(floor, role.spawnRule?.targetTags ?? [], getAssetTagsSafe(host))) { skip('target-tags', count); continue }
			const map = state.floorMaps.get(floor.id)
			if (!map) { skip('no-floor-map', count); continue }
			const roleMap = buildRoleWalkableMap(map, floor, role, getAssetTagsSafe(host))
			const keys = [...filterNpcSpawnTiles(roleMap, floor, role.id)]
			if (!keys.length) { skip('no-spawn-cells', count); continue }
			const centerX = canvas.w / 2 / map.cellSize
			const centerY = canvas.h / 2 / map.cellSize
			const keyPts = keys.map(k => {
				const sep = k.indexOf(',')
				const x = Number(k.slice(0, sep))
				const y = Number(k.slice(sep + 1))
				return { k, d: Math.hypot(x - centerX, y - centerY) }
			})
			keyPts.sort((a, b) => a.d - b.d)
			for (let i = 0; i < keys.length; i++) keys[i] = keyPts[i].k
			const spawnOffset = Math.floor(rand() * Math.max(1, keys.length))
			for (let i = 0; i < count; i++) {
				let spawnIndex = (spawnCursor + spawnOffset + i) % keys.length
				let attempts = 0
				// Keyed per role: two roles whose zones overlap must not evict each other, which at
				// crowd scale silently deleted whichever role was deployed last.
				while (attempts < keys.length && occupiedSpawnKeys.has(`${floor.id}:${role.id}:${keys[spawnIndex]}`)) {
					spawnIndex = (spawnIndex + 1) % keys.length
					attempts++
				}
				if (attempts >= keys.length) { skip(`occupied-cells:${role.id}`, count - i); break }
				const spawnKey = keys[spawnIndex]
				occupiedSpawnKeys.add(`${floor.id}:${role.id}:${spawnKey}`)
				const [x, y] = spawnKey.split(',').map(Number)
				const id = `${host.idPrefix}${state.nextId++}`
				const speed = configAgentSpeed(state) + (rand() - 0.5) * 0.02
				state.engine.addAgent({ id, roleId: role.id, floorId: floor.id, x, y, targetX: x, targetY: y, speed: agentSpeedFor(state, floor.id, speed) })
				spawned++
			}
			spawnCursor = (spawnCursor + count) % keys.length
		}
	}
	const attempted = spawned + [...skipped.values()].reduce((a, b) => a + b, 0)
	if (attempted > 0 || skipped.size > 0) {
		editorLog.info('NpcSpawn', { attempted, spawned, skipped: Object.fromEntries(skipped) })
	}
}

function buildEngine(state: NpcSimCoreState, host: NpcSimulationCoreHost, floors: readonly FloorData[], canvas: NpcCanvasBounds): void {
	state.currentCanvas = canvas
	const built = buildNpcEngineLayout(floors, canvas, getAssetDefSafe(host), getAssetTagsSafe(host))
	state.floorMaps = built.floorMaps
	state.floorDataMap = built.floorDataMap
	state.targetTagsByKey = new Map(built.layout.interactionTargets.map(target => [interactionTargetKey(target), target.tags]))
	state.entrances = streetEntrances(floors, canvas.streetTiles ?? STREET_TILES_DEFAULT)

	const policy = createNpcEnginePolicy({
		getConfig: () => state.config.value,
		floors: built.layout.floors,
		floorMaps: state.floorMaps,
		floorDataMap: state.floorDataMap,
		interactionTargets: built.layout.interactionTargets,
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		getTickNumber: () => state.engine?.tickNumber ?? 0,
		listAgents: () => state.engine?.listAgents() ?? [],
		getAssetTags: getAssetTagsSafe(host),
		getManagedTags: host.getManagedTags,
		random: host.random,
	})

	const cfg = host.getConfig()
	state.engine = new NpcEngine(built.layout, {
		ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
		agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE,
		random: host.random,
		crossFloorCooldownSeconds: cfg?.crossFloorCooldownSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.crossFloorCooldownSeconds,
		progressWatchdogTicks: cfg?.progressWatchdogTicks ?? NPC_ENGINE_DEFAULT_OPTIONS.progressWatchdogTicks,
		maxRepathAttempts: cfg?.maxRepathAttempts ?? NPC_ENGINE_DEFAULT_OPTIONS.maxRepathAttempts,
		repathCooldownSeconds: cfg?.repathCooldownSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.repathCooldownSeconds,
		repathCooldownExponent: cfg?.repathCooldownExponent ?? NPC_ENGINE_DEFAULT_OPTIONS.repathCooldownExponent,
		pathBudgetMinPerTick: cfg?.pathBudgetMinPerTick ?? NPC_ENGINE_DEFAULT_OPTIONS.pathBudgetMinPerTick,
		pathBudgetAgentsPerCall: cfg?.pathBudgetAgentsPerCall ?? NPC_ENGINE_DEFAULT_OPTIONS.pathBudgetAgentsPerCall,
		chooseTargetMinPerTick: cfg?.chooseTargetMinPerTick ?? NPC_ENGINE_DEFAULT_OPTIONS.chooseTargetMinPerTick,
		chooseTargetAgentsPerSlot: cfg?.chooseTargetAgentsPerSlot ?? NPC_ENGINE_DEFAULT_OPTIONS.chooseTargetAgentsPerSlot,
		wanderMemorySize: cfg?.wanderMemorySize ?? NPC_ENGINE_DEFAULT_OPTIONS.wanderMemorySize,
		wanderSmallMapThreshold: cfg?.wanderSmallMapThreshold ?? NPC_ENGINE_DEFAULT_OPTIONS.wanderSmallMapThreshold,
		triggerRatePeriodSeconds: cfg?.triggerRatePeriodSeconds ?? NPC_ENGINE_DEFAULT_OPTIONS.triggerRatePeriodSeconds,
		socialRadius: 2,
		socialCooldownSeconds: 20,
		socialChatDurationMinSeconds: 5,
		socialChatDurationMaxSeconds: 14,
		...policy,
	})

	spawnAgents(state, host, floors, canvas)
	syncAgents(state)
	// Deploy and refresh both rebuild the crowd, so traffic re-arms the same way both times:
	// an edit must not quietly restore the standing visitors it had replaced.
	armTraffic(state)
}

function frame(state: NpcSimCoreState, host: NpcSimulationCoreHost): void {
	if (!state.isPaused.value && state.engine) {
		try {
			const cfg = host.getConfig()
			const maxSteps = cfg?.maxSimulationSteps ?? 8
			const budgetMs = cfg?.frameSimBudgetMs ?? 6
			const desired = Math.max(1, Math.min(maxSteps, Math.round(state.simSpeed.value)))
			let steps = desired
			if (state.tickCostEma > 0) {
				steps = Math.max(1, Math.min(desired, Math.floor(budgetMs / state.tickCostEma)))
			}
			const t0 = performance.now()
			state.engine.tick(steps)
			state.tickCostEma = state.tickCostEma === 0 ? (performance.now() - t0) / steps : state.tickCostEma * 0.85 + ((performance.now() - t0) / steps) * 0.15
			syncAgents(state)
			const events = state.engine.drainEvents()
			// `present` is the denominator a scene is measured against, so the ledger gets it with the
			// batch rather than reaching back into the engine for it.
			state.takings.ingest(events, state.engine.tickNumber, takingsResolverFor(state), state.frameDots.size)
			applyPayrollStrike(state)
			if (state.trafficFlow) {
				const before = state.trafficState.spawned
				// One id function for the step and for the binding below: an agent id the ledger sees has
				// to be the same id the world released a face for, or the attribution is a coincidence.
				const arrivalId = (index: number) => `${host.idPrefix}t${index}`
				stepTraffic({
					engine: state.engine,
					flow: state.trafficFlow,
					entrances: state.entrances,
					guestRoleId: guestRoleIdFor(state),
					speedFor: floorId => agentSpeedFor(state, floorId),
					tick: state.engine.tickNumber,
					state: state.trafficState,
					idFor: arrivalId,
				})
				// Every arrival the world released becomes someone the house can remember, and the agent
				// that walked in carries that face: without the binding a served client is credited to
				// every faction in the roster, which is a world reacting to a number rather than to the
				// house.
				for (let i = before; i < state.trafficState.spawned; i++) {
					state.world = releasePerson(state.world, i)
					const person = latestReleased(state.world)
					if (person) state.factionOfAgent.set(arrivalId(i), person.faction)
				}
			}
			pruneArrivalMarks(state.arrivalMarks, state.engine.tickNumber)
			if (events.length > 0) {
				const chatEvents = events.filter(e => e.type === 'chatting-start' || e.type === 'chatting-end')
				if (chatEvents.length > 0 || state.socialEvents.value.length > 0) state.socialEvents.value = chatEvents
				for (const event of events) {
					if (event.type === 'waiting' && event.reason) {
						const dot = state.frameDots.get(event.agentId)
						if (dot && (dot.status === 'waiting' || dot.status === 'queued')) state.waitReasons.set(event.agentId, event.reason)
					}
					latchArrivalEvent(state.arrived, state.arrivalMarks, event, host.idPrefix)
				}
			} else {
				if (state.socialEvents.value.length > 0) state.socialEvents.value = []
			}
		} catch (error) {
			// A single bad tick must never kill the rAF loop - log and keep the
			// simulation alive so the next tick can recover.
			editorLog.error('NpcSim frame', error)
		}
	}
	state.animationId = requestAnimationFrame(() => frame(state, host))
}

function applyConfigSpeedToAgents(state: NpcSimCoreState): void {
	if (!state.engine) return
	for (const agent of state.engine.listAgents()) {
		agent.speed = agentSpeedFor(state, agent.floorId)
	}
}

function ingestConfig(state: NpcSimCoreState, raw: NpcSimulationConfig | undefined): boolean {
	if (!raw || !isNpcConfig(raw)) return false
	state.config.value = mergeNpcConfig(cloneDeepRaw(raw))
	state.dotRoleColors.clear()
	state.dotRoleLooks.clear()
	state.visitorRoleIds.clear()
	for (const roleId of visitorRoleIds(state.config.value.roles)) state.visitorRoleIds.add(roleId)
	applyConfigSpeedToAgents(state)
	return true
}

export function useNpcSimulationCore(host: NpcSimulationCoreHost) {
	const visitorRoleIds = new Set<string>()
	const state: NpcSimCoreState = {
		npcs: shallowRef<NpcSimDot[]>([]),
		socialEvents: shallowRef<NpcEngineEvent[]>([]),
		isPaused: ref(false),
		simSpeed: ref(1),
		config: ref<NpcSimulationConfig>({
			speed: NPC_DEFAULT_SPEED,
			defaultRoleId: '',
			roles: [],
			tasks: [],
			pool: [],
			...NPC_OPTION_DEFAULTS,
			...NPC_FRAME_DEFAULTS,
		}),
		animationId: null,
		engine: null,
		deploymentActive: false,
		nextId: 1,
		spawnFloorOverride: null,
		tickCostEma: 0,
		floorMaps: new Map(),
		floorDataMap: new Map(),
		currentCanvas: null,
		viewFloorId: host.getViewFloorId(),
		lastSyncAt: 0,
		frameDots: new Map(),
		waitReasons: new Map(),
		arrived: new Set(),
		arrivalMarks: new Map(),
		seenAgentIds: new Set(),
		dotRoleColors: new Map(),
		dotRoleLooks: new Map(),
		targetTagsByKey: new Map(),
		visitorRoleIds,
		takings: createTakingsLedger({
			ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
			isVisitor: roleId => visitorRoleIds.has(roleId),
			// Every closed hotel day pays the staff that day deployed - the deployment is the bill.
			dailyChargeCents: () => payrollCents(staffHeadcount(state.config.value.pool, roleId => visitorRoleIds.has(roleId))),
			// What the night's takings are worth is what the house's credit is worth: standing,
			// neutrality and the High Table's price, charged at the close beside payroll and the fine.
			// The ledger still bills face value at the counter, so the rate window stays the crowd's own
			// work and the discount never compounds into tomorrow's projection.
			dailyDiscountCents: dayCents => priceOfCreditCents(dayCents, houseWorthOf(state)),
			// One boundary settles everything that a closed day settles. Standing chases the counted
			// record, the world is handed the night it just lived, and both read the ledger's own
			// counters - so a played lobby and an `arch takings` run cannot disagree about a day.
			onDayClose: day => {
				state.standingScore = advanceStanding(state.standingScore, readReputation(day.served, day.walkOuts))
				settleWorldDay(state, day.day, day.incidents, state.takings.snapshot(), day.byFaction)
			},
		}),
		takingsResolver: null,
		trafficOn: ref(false),
		trafficFlow: null,
		trafficState: createTrafficState(),
		entrances: [],
		strippedStaff: [],
		strikeDay: 0,
		strike: { onDuty: 0, offDuty: 0, insolvent: false },
		standingScore: REPUTATION_NEUTRAL,
		continuity: createContinuityState(),
		pressure: createPressureState(),
		world: createWorldState(),
		incidentsToday: 0,
		worldDay: 0,
		objectiveStreaks: ZERO_OBJECTIVE_STREAKS,
		objectiveReward: NO_OBJECTIVE_REWARD,
		factionOfAgent: new Map(),
	}

	function startLoop(): void {
		if (state.animationId === null) state.animationId = requestAnimationFrame(() => frame(state, host))
	}

	function stopLoop(): void {
		if (state.animationId !== null) cancelAnimationFrame(state.animationId)
		state.animationId = null
		state.isPaused.value = false
	}

	return {
		npcs: state.npcs,
		frameDots: state.frameDots,
		waitReasons: state.waitReasons,
		arrivalMarks: state.arrivalMarks,
		socialEvents: state.socialEvents,
		takings: state.takings,
		isPaused: state.isPaused,
		simSpeed: state.simSpeed,
		config: state.config,
		ingestConfig: (raw: NpcSimulationConfig | undefined) => ingestConfig(state, raw),
		deploy(floors: readonly FloorData[], canvas: NpcCanvasBounds, newViewFloorId: string, spawnFloorId?: string): void {
			stopLoop()
			ingestConfig(state, host.getConfig())
			state.spawnFloorOverride = spawnFloorId ?? null
			state.tickCostEma = 0
			state.deploymentActive = true
			state.waitReasons.clear()
			state.arrived.clear()
			state.arrivalMarks.clear()
			state.takings.reset()
			clearStrike(state)
			// The world's day stamp has to move with the ledger's day book. `reset()` puts
			// `daysCompleted` back to 0 while `worldDay` still held the old count, so the next close
			// matched the stamp and the world silently skipped a whole day - found by the probe, not
			// by a failing assertion, because the day still closed and simply settled nothing.
			clearWorld(state)
			state.viewFloorId = newViewFloorId
			buildEngine(state, host, floors, canvas)
			startLoop()
		},
		refresh(): void {
			if (!state.deploymentActive || !state.currentCanvas) return
			ingestConfig(state, host.getConfig())
			const floors = host.getFloors()
			if (floors.length) buildEngine(state, host, floors, state.currentCanvas)
		},
		setViewFloorId(floorId: string): void {
			state.viewFloorId = floorId
			if (state.deploymentActive) syncAgents(state)
		},
		reset(): void {
			stopLoop()
			state.engine = null
			state.floorMaps = new Map()
			state.floorDataMap = new Map()
			state.frameDots.clear()
			state.waitReasons.clear()
			state.arrived.clear()
			state.arrivalMarks.clear()
			state.dotRoleColors.clear()
			state.dotRoleLooks.clear()
			state.targetTagsByKey.clear()
			state.currentCanvas = null
			state.viewFloorId = null
			state.deploymentActive = false
			state.spawnFloorOverride = null
			state.tickCostEma = 0
			state.npcs.value = []
			state.socialEvents.value = []
			state.takings.reset()
			clearStrike(state)
			// A fresh deployment is a fresh house: the world owes a newly opened Continental nothing,
			// and inheriting yesterday's breaches would punish a player who re-deployed the same plan.
			clearWorld(state)
			state.trafficFlow = null
			state.trafficState = createTrafficState()
			state.trafficOn.value = false
			state.entrances = []
		},
		start: startLoop,
		trafficOn: state.trafficOn,
		getTrafficSummary(): { spawned: number; departed: number; inside: number; entrances: number } {
			return {
				spawned: state.trafficState.spawned,
				departed: state.trafficState.departed,
				inside: state.trafficState.live.length,
				entrances: state.entrances.length,
			}
		},
		getStaffHeadcount(): number {
			return staffHeadcount(state.config.value.pool, roleId => state.visitorRoleIds.has(roleId))
		},
		/** Staff-role agents actually in the engine - the crew on shift, not the crew deployed. */
		countStaffOnDuty(): number {
			return (state.engine?.listAgents() ?? []).filter(agent => agent.roleId && !state.visitorRoleIds.has(agent.roleId)).length
		},
		/** Who is on shift after the last closed day's payroll, and what of it went unpaid. */
		getStrike(): { onDuty: number; offDuty: number; insolvent: boolean; unpaidCents: number } {
			return { ...state.strike, unpaidCents: state.takings.snapshot().lastDayUnpaidCents }
		},
		/** What money is multiplied by now: the standing the room holds, judged against its record. */
		getStanding(): ReputationReading {
			const close = state.takings.snapshot()
			return standingReading(state.standingScore, readReputation(close.served, close.walkOuts))
		},
		getStandingScore(): number {
			return state.standingScore
		},
		/**
		 * Everything the world outside knows about this house, in one reading: how safe it is, what
		 * the High Table has outstanding, and who still sends people. One call, so the panel cannot
		 * read a half-settled day across three getters.
		 */
		getWorld(): WorldReading {
			return {
				continuity: continuityReading(state.continuity),
				pressure: pressureReading(state.pressure),
				// The authored crowd, not the count that has walked through the door so far: a reading
				// measured against its own history would report one walk-in on the morning the first
				// guest arrived, and the flow that has to act on it reads the same number.
				world: readWorld(state.world, visitorTrafficPerDay(state)),
				incidentsToday: state.incidentsToday,
				/** What the credit cost the last closed day, in cents off the bank. */
				creditCostCents: state.takings.snapshot().lastDayDiscountCents,
				worth: houseWorthOf(state),
			}
		},
		/**
		 * What the house is worth tonight, as one number. The panel explains the discount with it and
		 * the wallet commits its rate through it, so an absent period is credited at what the house can
		 * actually achieve rather than at a tariff its name no longer commands.
		 */
		getHouseWorth(): number {
			return houseWorthOf(state)
		},
		/** The board, judged on the last closed day and folded once per close. */
		getObjectives(): readonly Objective[] {
			return objectiveBoardFor(state, state.takings.snapshot())
		},
		/**
		 * What the last closed day actually paid for that board. A settled read of state the close
		 * wrote, not a fresh calculation, so the panel shows the money that moved rather than a number
		 * a re-derivation could drift away from it.
		 */
		getObjectiveReward(): ObjectiveReward {
			return state.objectiveReward
		},
		/**
		 * Whose client an agent in the house is - the face the world released it with, or nothing for a
		 * guest that walked in from the standing pool. Published because a binding nobody can read is a
		 * rule no test can check, and the panel has no business naming a stranger's family.
		 */
		factionOf(agentId: string): Faction | undefined {
			return state.factionOfAgent.get(agentId)
		},
		setStanding(score: number): void {
			state.standingScore = clampStanding(score)
		},
		/**
		 * The world as the close wrote it, for the one purchase that mends a faction. Deliberately not a
		 * `setFactionScore`: a faction's standing lives beside its served and lost counts in one
		 * immutable record, and a caller that wrote the number alone would have to rebuild the rest of
		 * it and could get it wrong.
		 */
		getWorldState(): WorldState {
			return state.world
		},
		applyWorld(next: WorldState): void {
			state.world = next
		},
		setTraffic(on: boolean): void {
			if (state.trafficOn.value === on) return
			if (!on) {
				for (const entry of state.trafficState.live) state.engine?.removeAgent(entry.id)
			}
			state.trafficOn.value = on
			armTraffic(state)
			syncAgents(state)
		},
		stopLoop,
		isDeploymentActive(): boolean {
			return state.deploymentActive
		},
		getViewFloorId(): string | null {
			return state.viewFloorId
		},
	}
}

export type NpcSimulationCore = ReturnType<typeof useNpcSimulationCore>

/** One settled read of the world outside the house, so a panel cannot read a half-settled day. */
export type WorldReading = {
	continuity: ContinuityReading
	pressure: PressureReading
	world: FactionWorldReading
	incidentsToday: number
	/** What the last closed day's credit cost the house, in cents off the bank. */
	creditCostCents: number
	/** What the house is worth tonight, the number that cost was taken at. */
	worth: number
}