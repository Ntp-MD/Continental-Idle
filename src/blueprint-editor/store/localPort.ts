import type { BlueprintDataFile } from '../domain/types'
import { MAX_PAYLOAD_BYTES } from '../limits'
import { editorLog } from './storeUtils'
import { readBlueprintDataFile } from './schemaMigration'
import { PayloadTooLargeError, type PersistencePort } from './ports'

const DB_NAME = 'continental-idle'
const STORE_NAME = 'workspace'
const WORKSPACE_KEY = 'blueprint-data'

export interface BlueprintStorage {
	read(): Promise<string | null>
	write(value: string): Promise<void>
	remove(): Promise<void>
}

export function isIndexedDbAvailable(): boolean {
	return typeof indexedDB !== 'undefined'
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
	})
}

export function createIndexedDbStorage(): BlueprintStorage {
	let dbPromise: Promise<IDBDatabase> | null = null
	const database = () => (dbPromise ??= openDatabase())

	return {
		async read(): Promise<string | null> {
			const db = await database()
			return new Promise((resolve, reject) => {
				const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(WORKSPACE_KEY)
				request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null)
				request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
			})
		},
		async write(value: string): Promise<void> {
			const db = await database()
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite')
				tx.objectStore(STORE_NAME).put(value, WORKSPACE_KEY)
				tx.oncomplete = () => resolve()
				tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
				tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'))
			})
		},
		async remove(): Promise<void> {
			const db = await database()
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite')
				tx.objectStore(STORE_NAME).delete(WORKSPACE_KEY)
				tx.oncomplete = () => resolve()
				tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
				tx.onabort = () => reject(tx.error ?? new Error('IndexedDB delete aborted'))
			})
		},
	}
}

export function createMemoryStorage(initial: string | null = null): BlueprintStorage {
	let value = initial
	return {
		async read() { return value },
		async write(next: string) { value = next },
		async remove() { value = null },
	}
}

export function createLocalPersistencePort(storage: BlueprintStorage): PersistencePort {
	return {
		async load(): Promise<BlueprintDataFile | null> {
			const raw = await storage.read()
			if (raw === null) return null
			let parsed: unknown
			try {
				parsed = JSON.parse(raw)
			} catch (error) {
				throw new Error('Stored blueprint data is not valid JSON', { cause: error })
			}
			return readBlueprintDataFile(parsed)
		},

		async save(data: BlueprintDataFile): Promise<boolean> {
			const body = JSON.stringify(data, null, 2) + '\n'
			if (new TextEncoder().encode(body).length > MAX_PAYLOAD_BYTES) {
				editorLog.error('localPersistencePort.save', `payload exceeds the ${MAX_PAYLOAD_BYTES} byte cap`)
				throw new PayloadTooLargeError()
			}
			await storage.write(body)
			const verification = await storage.read()
			if (verification === null) throw new Error('Local blueprint data write could not be verified')
			readBlueprintDataFile(JSON.parse(verification))
			return true
		},
	}
}