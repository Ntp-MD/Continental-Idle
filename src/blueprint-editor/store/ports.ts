import type { BlueprintDataFile, SyncedLayoutPayload } from '../domain/types'

export class PayloadTooLargeError extends Error {
	constructor() {
		super('Blueprint data exceeds the maximum save payload size')
		this.name = 'PayloadTooLargeError'
	}
}

export interface PersistencePort {
	load(): Promise<BlueprintDataFile | null>
	save(data: BlueprintDataFile): Promise<boolean>
}

export interface SyncPort {
	emit(payload: SyncedLayoutPayload): void
}