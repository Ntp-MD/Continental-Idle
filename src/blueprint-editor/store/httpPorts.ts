import type { BlueprintDataFile, SyncedLayoutPayload } from '../domain/types'
import { normalizeBlueprintDataFile } from '../domain/types'
import { EDITOR_CONFIG } from '../editorConfig'
import { MAX_PAYLOAD_BYTES } from '../limits'
import { editorLog } from './storeUtils'
import type { PersistencePort, SyncPort } from './ports'

const MAX_SAVE_RETRIES = 3

class PayloadTooLargeError extends Error { }

export function createHttpPersistencePort(): PersistencePort {
	return {
		async load(): Promise<BlueprintDataFile | null> {
			try {
				const res = await fetch(EDITOR_CONFIG.blueprintDataEndpoint, { headers: { 'X-Blueprint-Client': '1' } })
				if (!res.ok || !res.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null
				const raw: unknown = await res.json()
				return normalizeBlueprintDataFile(raw) ?? null
			} catch (error) {
				editorLog.error('httpPersistencePort.load', error)
				return null
			}
		},

		async save(data: BlueprintDataFile): Promise<boolean> {
			const body = JSON.stringify(data, null, 2) + '\n'
			if (new TextEncoder().encode(body).length > MAX_PAYLOAD_BYTES) {
				editorLog.error('httpPersistencePort.save', `payload exceeds the ${MAX_PAYLOAD_BYTES} byte cap`)
				throw new PayloadTooLargeError()
			}
			for (let attempt = 1; attempt <= MAX_SAVE_RETRIES; attempt++) {
				try {
					const res = await fetch(EDITOR_CONFIG.blueprintDataEndpoint, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'X-Blueprint-Client': '1', 'X-Blueprint-Save': '1' },
						body,
					})
					if (res.status === 413) throw new PayloadTooLargeError()
					if (!res.ok || !res.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error(`HTTP ${res.status}`)
					const response: unknown = await res.json()
					if (!response || typeof response !== 'object') throw new Error('Persistence verification response was invalid')
					const verified = response as Record<string, unknown>
					if (verified.ok !== true || !normalizeBlueprintDataFile(verified.data)) throw new Error('Persistence verification response was invalid')
					return true
				} catch (error) {
					editorLog.error(`saveBlueprintData attempt ${attempt}`, error)
					if (error instanceof PayloadTooLargeError || attempt === MAX_SAVE_RETRIES) throw error
					await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
				}
			}
			return false
		},
	}
}

export function createWindowSyncPort(): SyncPort {
	return {
		emit(payload: SyncedLayoutPayload): void {
			window.dispatchEvent(new CustomEvent('blueprint:sync', { detail: payload }))
		},
	}
}