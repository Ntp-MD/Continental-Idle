/**
 * The idle half of the loop: a lobby that earned while you watched keeps trading while you don't.
 * Pure arithmetic over a saved reading - no clock, no storage - so both are testable in isolation.
 */

/** Declared balance: how long the lobby keeps serving with nobody watching. */
export const WALLET_OFFLINE_CAP_MINUTES = 480

/** Wall-clock autosave cadence, so a killed tab costs at most this much of the last session. */
export const WALLET_AUTOSAVE_MS = 60_000

const MS_PER_MINUTE = 60_000

export interface OfflineAccrual {
	earnedCents: number
	creditedMinutes: number
	capped: boolean
}

/**
 * The rate is projected forward, not re-simulated: nobody was there to queue, so an away period can
 * never produce a walk-out. A future save (clock moved back) earns nothing rather than owing money.
 */
export function accrueOffline(input: {
	savedAtMs: number
	nowMs: number
	perMinuteCents: number
	capMinutes?: number
}): OfflineAccrual {
	const capMinutes = input.capMinutes ?? WALLET_OFFLINE_CAP_MINUTES
	const elapsedMinutes = (input.nowMs - input.savedAtMs) / MS_PER_MINUTE
	if (!(elapsedMinutes > 0) || !(input.perMinuteCents > 0)) {
		return { earnedCents: 0, creditedMinutes: 0, capped: false }
	}
	const creditedMinutes = Math.min(elapsedMinutes, capMinutes)
	return {
		// Whole cents, so a long away period cannot drift the way a float balance would.
		earnedCents: Math.floor(input.perMinuteCents * creditedMinutes),
		creditedMinutes,
		capped: elapsedMinutes > capMinutes,
	}
}

/** What the ledger looked like when the session ended - the only thing the wallet needs to persist. */
export interface WalletRecord {
	bankCents: number
	perMinuteCents: number
	/** Best rate the lobby has ever demonstrated; absent on records written before this existed. */
	readonly demonstratedPerMinuteCents?: number
	/**
	 * The standing the room was left with. Absent on older records, which is what the recovery curve
	 * is for: a room with no saved reputation starts neutral, not trusted.
	 */
	readonly standingScore?: number
	savedAtMs: number
}

/**
 * The rate an absent period is credited at: a lobby that demonstrated 155/min keeps trading after a
 * session that served nobody, which is the difference between a rate and a snapshot.
 */
export function creditableRate(record: WalletRecord): number {
	return record.demonstratedPerMinuteCents ?? record.perMinuteCents
}

/** Storage is an untrusted boundary: a tampered record must not mint money or produce NaN. */
export function parseWalletRecord(raw: unknown): WalletRecord | null {
	if (typeof raw !== 'object' || raw === null) return null
	const { bankCents, perMinuteCents, demonstratedPerMinuteCents, standingScore, savedAtMs } = raw as Record<string, unknown>
	// A fractional cent is a rewritten record, not a rounding artefact - the ledger only ever writes integers.
	if (!isWholeNonNegative(bankCents) || !isFiniteNumber(perMinuteCents) || perMinuteCents < 0) return null
	if (demonstratedPerMinuteCents !== undefined && (!isFiniteNumber(demonstratedPerMinuteCents) || demonstratedPerMinuteCents < 0)) return null
	// Standing is a 0-100 score; anything else is a rewritten record, and a saved 500 would pay forever.
	if (standingScore !== undefined && (!isFiniteNumber(standingScore) || !Number.isInteger(standingScore) || standingScore < 0 || standingScore > 100)) return null
	if (typeof savedAtMs !== 'number' || !Number.isFinite(savedAtMs)) return null
	return {
		bankCents,
		perMinuteCents,
		...(demonstratedPerMinuteCents === undefined ? {} : { demonstratedPerMinuteCents }),
		...(standingScore === undefined ? {} : { standingScore }),
		savedAtMs,
	}
}

function isWholeNonNegative(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}
