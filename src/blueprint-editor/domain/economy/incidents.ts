/**
 * What counts as a scene, measured from the counts the ledger already keeps.
 *
 * This exists because the honest signal is not "violence" - the engine does not simulate violence
 * and inventing an event for it would be a rule the simulation never enforced. What the engine does
 * emit is a *blocked* agent: someone who could not pass and had to give ground. On a quiet night
 * that is a crowd. On a bad night the same event, concentrated in one place, is the only trace a
 * simulation of this kind leaves of a room turning.
 *
 * So an incident is a rate, not a count: blocked agents against how many people were in the house.
 * A plan that is merely busy never pays for it, and a plan that cannot keep two people past each
 * other does - which is the design rule, derived rather than asserted.
 *
 * It is a pure function of the ledger's own counters rather than a second reader of the event
 * stream: two readers of one stream is how a count and a day boundary drift apart.
 */

/**
 * Declared balance. Blocked agents per agent-tick, above which the house is read as having lost
 * control of the room. At 0.001, a house of 100 people tolerates about one blocked agent per
 * hundred agent-ticks; past that it is a fight the staff cannot break up.
 */
export const INCIDENT_RATE_THRESHOLD = 0.001

/**
 * Declared balance. The incident tally clears when the day closes, so this caps what one day can
 * charge. A pathological frame cannot bankrupt the house before the player has seen a single frame.
 */
export const INCIDENT_MAX_PER_DAY = 10

/**
 * How many incidents today, from what the day actually saw.
 *
 * Zero while the crowd behaved, and a cap so a single bad frame cannot end the house. The severity
 * scale is what makes a worse night cost more: the count of blocked agents is divided by the
 * threshold, so a room twice as bad pays twice as much rather than one more.
 */
export function settleDayIncidents(input: {
	readonly blockedThisDay: number
	readonly presentAgentTicks: number
	readonly charge?: number
}): number {
	const { blockedThisDay, presentAgentTicks } = input
	// The day settles what is left of the tally, so a second close on the same day charges nothing
	// twice - the same once-per-close rule the payroll strike uses. A quiet second close must
	// therefore *return the charge already made*, not zero: dropping it would erase the night's
	// scenes from the world the moment anything settled them twice.
	const charged = Math.max(0, Math.floor(input.charge ?? 0))
	if (blockedThisDay <= 0 || presentAgentTicks <= 0) return charged
	const rate = blockedThisDay / presentAgentTicks
	if (rate < INCIDENT_RATE_THRESHOLD) return charged
	const severity = rate / INCIDENT_RATE_THRESHOLD
	const incidents = Math.round(severity)
	if (incidents <= 0) return charged
	return Math.min(INCIDENT_MAX_PER_DAY, charged + incidents)
}
