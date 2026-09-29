import { accrueOffline, creditableRate, parseWalletRecord, type WalletRecord } from '../domain/economy/wallet'
import { editorLog } from '../domain/logger'
import type { BlueprintStorage } from './localPort'

/** Second key in the workspace store: earned game state, kept out of the design payload. */
export const WALLET_STORAGE_KEY = 'wallet'

export interface WalletRestore {
	/** What was saved, or null when there is no readable wallet (first run, or a corrupt record). */
	record: WalletRecord | null
	earnedCents: number
	creditedMinutes: number
	capped: boolean
}

export interface WalletStore {
	restore(nowMs?: number): Promise<WalletRestore>
	commit(bankCents: number, perMinuteCents: number, nowMs?: number, standingScore?: number): Promise<void>
	clear(): Promise<void>
}

const NOTHING_SAVED: WalletRestore = { record: null, earnedCents: 0, creditedMinutes: 0, capped: false }

/**
 * The bank beside the blueprint and not inside it: `blueprint-data` is design work a user exports and
 * imports, the bank is what that design earned on this device.
 */
export function createWalletStore(storage: BlueprintStorage): WalletStore {
	/** Storage is external input, so a junk record reads as "nothing saved" rather than throwing. */
	async function readRecord(): Promise<WalletRecord | null> {
		const raw = await storage.read()
		if (raw === null) return null
		let parsed: unknown
		try {
			parsed = JSON.parse(raw)
		} catch (error) {
			editorLog.warn('wallet.restore', 'stored wallet is not valid JSON, starting from zero', error)
			return null
		}
		const record = parseWalletRecord(parsed)
		if (!record) editorLog.warn('wallet.restore', 'stored wallet does not match the wallet shape, starting from zero')
		return record
	}

	return {
		async restore(nowMs = Date.now()) {
			const record = await readRecord()
			if (!record) return NOTHING_SAVED
			return { record, ...accrueOffline({ savedAtMs: record.savedAtMs, nowMs, perMinuteCents: creditableRate(record) }) }
		},

		/**
		 * The demonstrated rate is a high-water mark, so a quiet session cannot erase what the lobby
		 * proved it could do - but it is never read as money, only as the speed of trading.
		 */
		async commit(bankCents, perMinuteCents, nowMs = Date.now(), standingScore?: number) {
			const previous = await readRecord()
			const carriedStanding = standingScore ?? previous?.standingScore
			const record: WalletRecord = {
				bankCents,
				perMinuteCents,
				demonstratedPerMinuteCents: Math.max(previous ? creditableRate(previous) : 0, perMinuteCents),
				// A session that never judged the room leaves the saved standing where it was; only a
				// reading the simulation actually holds can overwrite it.
				...(carriedStanding === undefined ? {} : { standingScore: carriedStanding }),
				savedAtMs: nowMs,
			}
			await storage.write(JSON.stringify(record))
		},

		async clear() {
			await storage.remove()
		},
	}
}
