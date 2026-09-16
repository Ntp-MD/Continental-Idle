import type { BlueprintDataFile, SyncedLayoutPayload } from '../domain/types'

export interface PersistencePort {
	load(): Promise<BlueprintDataFile | null>
	save(data: BlueprintDataFile): Promise<boolean>
}

export interface SyncPort {
	emit(payload: SyncedLayoutPayload): void
}