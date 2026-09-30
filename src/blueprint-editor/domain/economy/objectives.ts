/**
 * What the house is being asked to do today, and whether it did it.
 *
 * An idle game with no reason to come back is a screensaver, and the economy already counts every
 * number a goal could possibly need - takings, walk-outs, payroll, neutrality, the High Table. So an
 * objective is not a new state machine that has to be kept in step with the simulation; it is a
 * question asked of the counters the ledger already keeps, answered on the same closed day the rest
 * of the house settles on.
 *
 * Nothing here decides what a goal is *worth*: that price lives with the shop that takes money, in
 * `purchases.ts` as `objectiveRewardCents`. This module only says what was asked and what was done,
 * so a goal can never be satisfied by a number nobody charged for. What it does own is the *order*:
 * a day has to be read before its streaks are folded, and the fold has to happen before the bonus is
 * priced, or a house pays for yesterday's run and goes unpaid for tonight's. `settleObjectives` is
 * the one place that order exists.
 */

import { objectiveRewardCents, type ObjectiveReward } from './purchases'
import { formatTakings, type TakingsSnapshot } from './takings'
import { settleDay, type DailySettlement } from './upkeep'

/**
 * The house, read the way a goal is checked. One shape, so a new goal is a new line of reading and
 * never a new place a number can come from.
 */
export interface ObjectiveInput {
	/** Days the run has closed, and the counters that reset on the day boundary. */
	readonly daysCompleted: number
	readonly served: number
	readonly walkOuts: number
	/** What the last closed day earned, and the payroll it billed. */
	readonly lastDayCents: number
	readonly settlement: DailySettlement
	/** Neutrality 0-100 and what the High Table currently holds. */
	readonly neutralityScore: number
	readonly pressureOutstandingCents: number
}

export type ObjectiveId =
	| 'full-room'
	| 'no-one-walks'
	| 'pay-the-bill'
	| 'keep-the-peace'
	| 'earn-the-day'

/** How many closed days in a row each goal has been met, keyed by id so no goal can be left out. */
export type ObjectiveStreaks = Readonly<Record<ObjectiveId, number>>

/**
 * Declared balances, one per goal. These are the tuning surface: every number here is a day of the
 * house's own counters, not a score, so moving one changes what a night has to look like rather than
 * how the game counts it.
 */
export const OBJECTIVE_TARGETS = {
	/** Serve this many clients in one day. */
	'full-room': 40,
	/** Walk this few out, in one day. A line that turns people away has not had a good night. */
	'no-one-walks': 2,
	/** Earn this many cents in one day, so a house can be measured by what it took rather than by what it paid. */
	'earn-the-day': 120_000,
	/** Stand at this neutrality or better, and owe the High Table nothing. */
	'keep-the-peace': { neutrality: 90, pressureCents: 0 },
	/** Cover payroll and still bank something. */
	'pay-the-bill': 1,
} as const

export interface Objective {
	readonly id: ObjectiveId
	/** Player vocabulary, never the id. */
	readonly label: string
	/** What the goal asks of the house, in the same units it is checked in. */
	readonly detail: string
	/** Whether the last closed day met it. */
	readonly met: boolean
	/** How far along the last day was, 0-1, so a nearly-made goal reads as nearly made. */
	readonly progress: number
	/** Days closed in a row the goal was met; a streak is what makes a good night worth repeating. */
	readonly streak: number
	/**
	 * The three-valued verdict the whole project already uses: a goal that cannot be judged yet is
	 * `unknown`, not `false`. An idle day reads as unproven rather than failed.
	 */
	readonly verdict: 'met' | 'unmet' | 'unknown'
}

function ratio(of: number, target: number): number {
	if (target <= 0) return of > 0 ? 1 : 0
	return Math.max(0, Math.min(1, of / target))
}

interface Measured {
	readonly met: boolean
	readonly progress: number
	readonly unproven: boolean
}

function measure(input: ObjectiveInput): Record<ObjectiveId, Measured> {
	const closed = input.daysCompleted > 0
	const by: Record<ObjectiveId, Measured> = {
		'full-room': {
			met: closed && input.served >= OBJECTIVE_TARGETS['full-room'],
			progress: ratio(input.served, OBJECTIVE_TARGETS['full-room']),
			unproven: !closed,
		},
		'no-one-walks': {
			met: closed && input.walkOuts <= OBJECTIVE_TARGETS['no-one-walks'],
			// Fewer is better, so the bar is what was allowed against what was actually turned away.
			progress: ratio(OBJECTIVE_TARGETS['no-one-walks'], Math.max(OBJECTIVE_TARGETS['no-one-walks'], input.walkOuts)),
			unproven: !closed,
		},
		'pay-the-bill': {
			met: closed && !input.settlement.insolvent && input.settlement.profitCents >= OBJECTIVE_TARGETS['pay-the-bill'],
			progress: ratio(input.settlement.profitCents, Math.max(1, input.settlement.payrollCents)),
			unproven: !closed,
		},
		'keep-the-peace': {
			met: closed
				&& input.neutralityScore >= OBJECTIVE_TARGETS['keep-the-peace'].neutrality
				&& input.pressureOutstandingCents === OBJECTIVE_TARGETS['keep-the-peace'].pressureCents,
			progress: ratio(input.neutralityScore, OBJECTIVE_TARGETS['keep-the-peace'].neutrality),
			unproven: !closed,
		},
		'earn-the-day': {
			met: closed && input.lastDayCents >= OBJECTIVE_TARGETS['earn-the-day'],
			progress: ratio(input.lastDayCents, OBJECTIVE_TARGETS['earn-the-day']),
			unproven: !closed,
		},
	}
	return by
}

export interface ObjectiveGoal {
	readonly id: ObjectiveId
	readonly label: string
	readonly detail: string
}

/** The board's five goals, in the order a house meets them. */
export const OBJECTIVE_GOALS: readonly ObjectiveGoal[] = [
	{ id: 'pay-the-bill', label: 'Pay the bill', detail: 'Cover payroll and still bank something' },
	{ id: 'full-room', label: 'Full room', detail: `Serve ${OBJECTIVE_TARGETS['full-room']} clients in a day` },
	{ id: 'no-one-walks', label: 'Nobody walks', detail: `Turn away ${OBJECTIVE_TARGETS['no-one-walks']} or fewer in a day` },
	{ id: 'keep-the-peace', label: 'Keep the peace', detail: `Neutrality ${OBJECTIVE_TARGETS['keep-the-peace'].neutrality}+ and owe the House nothing` },
	{ id: 'earn-the-day', label: 'Earn the day', detail: `Take ${formatTakings(OBJECTIVE_TARGETS['earn-the-day'])} in a day` },
]

/**
 * The board for one closed day: every goal, judged on the counters that day produced. A streak is
 * carried in by the caller, because a day that has not closed yet must not extend one - the honest
 * reading of a game that runs while the tab is shut is that the night never happened.
 */
export function readObjectives(
	input: ObjectiveInput,
	streaks: ObjectiveStreaks = ZERO_OBJECTIVE_STREAKS,
): readonly Objective[] {
	const measured = measure(input)
	return OBJECTIVE_GOALS.map(goal => {
		const result = measured[goal.id]
		return {
			id: goal.id,
			label: goal.label,
			detail: goal.detail,
			met: result.met,
			progress: result.progress,
			// The streak shown is the one already folded, not this day's: `advanceObjectiveStreaks` is
			// the single place a day moves it, so a caller that polls this board cannot bank the same
			// close twice.
			streak: streaks[goal.id],
			verdict: result.unproven ? 'unknown' : result.met ? 'met' : 'unmet',
		}
	})
}

/**
 * Every goal's streak, one entry per id so a new goal cannot be left out of a reset. The played house
 * and `arch takings` both start a run here rather than each carrying its own copy of the id list.
 */
export const ZERO_OBJECTIVE_STREAKS: ObjectiveStreaks = {
	'pay-the-bill': 0,
	'full-room': 0,
	'no-one-walks': 0,
	'keep-the-peace': 0,
	'earn-the-day': 0,
}

/**
 * Streaks folded once per closed day. Kept beside the reading rather than inside it, so a caller
 * that polls the board on a 250 ms timer cannot quietly bank the same day thirty times.
 */
export function advanceObjectiveStreaks(
	streaks: ObjectiveStreaks,
	board: readonly Objective[],
): ObjectiveStreaks {
	const next: Record<ObjectiveId, number> = { ...streaks }
	for (const goal of board) next[goal.id] = goal.met ? streaks[goal.id] + 1 : 0
	return next
}

/**
 * The board's input, built one way. A goal judged on a payroll a surface estimated for itself is a
 * goal the profit verdict can quietly disagree with, so both the played house and `arch takings`
 * hand over their own settled day book and get the same reading from here.
 *
 * `closedDay` is the ledger's own stamp for the day being judged, passed in rather than read back off
 * the snapshot: during a close the day book has not rolled yet, so a surface that read
 * `close.daysCompleted` here judged its first night as though no day had ever closed - the same class
 * of ordering defect loop 46 found in the world.
 */
export function objectiveInputFor(read: {
	readonly close: TakingsSnapshot
	/** Which day is being judged, from the close payload or the live day count. */
	readonly closedDay: number
	/**
	 * What the house is worth tonight - standing, neutrality and the High Table together, the same
	 * number the close charges its discount against. Projecting the day's income through anything
	 * narrower would let a goal and the bank disagree about what a night was worth.
	 */
	readonly moneyMultiplier: number
	readonly staffHeadcount: number
	readonly neutralityScore: number
	readonly pressureOutstandingCents: number
}): ObjectiveInput {
	const close = read.close
	return {
		daysCompleted: read.closedDay,
		served: close.served,
		walkOuts: close.walkOuts,
		lastDayCents: close.lastDayCents,
		settlement: settleDay({
			bankCents: close.bankCents,
			incomePerDayCents: Math.floor(close.perDayCents * read.moneyMultiplier),
			staffHeadcount: read.staffHeadcount,
		}),
		neutralityScore: read.neutralityScore,
		pressureOutstandingCents: read.pressureOutstandingCents,
	}
}

export interface ObjectiveSettlement {
	readonly board: readonly Objective[]
	readonly streaks: ObjectiveStreaks
	readonly reward: ObjectiveReward
}

/**
 * One closed day, settled: read it, fold the streaks, then price what the fold earned. The order is
 * the rule - the bonus is paid on the streak that includes the night being judged, so the board the
 * player sees after a close and the money the house was paid cannot describe two different nights.
 */
export function settleObjectives(
	input: ObjectiveInput,
	streaks: ObjectiveStreaks,
): ObjectiveSettlement {
	const board = readObjectives(input, streaks)
	const folded = advanceObjectiveStreaks(streaks, board)
	return {
		board,
		streaks: folded,
		reward: objectiveRewardCents({
			lastDayCents: input.lastDayCents,
			goals: board.map(goal => ({ met: goal.met, streak: folded[goal.id] })),
		}),
	}
}
