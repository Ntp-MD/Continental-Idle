import type { BlueprintDataFile, SyncedLayoutPayload } from '../domain/types'
import { EDITOR_CONFIG } from '../editorConfig'
import { MAX_PAYLOAD_BYTES } from '../limits'
import { editorLog } from './storeUtils'
import { readBlueprintDataFile } from './schemaMigration'
import { PayloadTooLargeError, type PersistencePort, type SyncPort } from './ports'

const MAX_SAVE_RETRIES = 3

export function createHttpPersistencePort(): PersistencePort {
	return {
		async load(): Promise<BlueprintDataFile | null> {
			let res: Response
			try {
				res = await fetch(EDITOR_CONFIG.blueprintDataEndpoint, { headers: { 'X-Blueprint-Client': '1' } })
			} catch (error) {
				editorLog.error('httpPersistencePort.load', error)
				throw new Error('Could not reach the blueprint data endpoint', { cause: error })
			}
			if (res.status === 404) return null
			if (!res.ok) {
				editorLog.error('httpPersistencePort.load', `HTTP ${res.status}`)
				throw new Error(`Blueprint data endpoint returned HTTP ${res.status}`)
			}
			if (!res.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
				throw new Error('Blueprint data endpoint returned a non-JSON response')
			}
			const raw: unknown = await res.json()
			return readBlueprintDataFile(raw)
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
					if (verified.ok !== true) throw new Error('Persistence verification response was invalid')
					try {
						readBlueprintDataFile(verified.data)
					} catch (error) {
						throw new Error('Persistence verification response was invalid', { cause: error })
					}
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