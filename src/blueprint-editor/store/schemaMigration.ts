import type { BlueprintDataFile } from '../domain/types'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizeBlueprintDataFile } from '../domain/types'

export class UnsupportedBlueprintVersionError extends Error {
	readonly version: number
	constructor(version: number) {
		super(`Blueprint data version ${version} is newer than the supported version ${BLUEPRINT_DATA_VERSION}`)
		this.name = 'UnsupportedBlueprintVersionError'
		this.version = version
	}
}

export class InvalidBlueprintDataError extends Error {
	constructor(reason: string, options?: { cause?: unknown }) {
		super(`Blueprint data is invalid: ${reason}`, options)
		this.name = 'InvalidBlueprintDataError'
	}
}

export interface BlueprintDataMigration {
	readonly fromVersion: number
	migrate(raw: Record<string, unknown>): Record<string, unknown>
}

/**
 * Ordered oldest -> newest. A step with `fromVersion = N` converts a file at
 * version N to version N + 1. Empty today: version 2 is the first frozen
 * contract, so no older blueprint-data file exists in the wild.
 */
const MIGRATIONS: readonly BlueprintDataMigration[] = []

function applyMigrations(raw: Record<string, unknown>, version: number): Record<string, unknown> {
	let candidate = raw
	for (const migration of MIGRATIONS) {
		if (migration.fromVersion >= version) candidate = migration.migrate(candidate)
	}
	return candidate
}

/**
 * Canonical ingress for a persisted BlueprintDataFile. Unlike
 * `normalizeBlueprintDataFile` it distinguishes "too new" from "malformed" so
 * the loader can fail loudly instead of showing an empty editor.
 */
export function readBlueprintDataFile(raw: unknown): BlueprintDataFile {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		throw new InvalidBlueprintDataError('expected an object')
	}
	const record = raw as Record<string, unknown>
	if (typeof record.$schema !== 'string') {
		throw new InvalidBlueprintDataError('missing $schema')
	}
	const version = record.version
	if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
		throw new InvalidBlueprintDataError('missing or invalid version')
	}
	if (version > BLUEPRINT_DATA_VERSION) throw new UnsupportedBlueprintVersionError(version)
	const candidate = version < BLUEPRINT_DATA_VERSION ? applyMigrations(record, version) : record
	const normalized = normalizeBlueprintDataFile(candidate)
	if (!normalized) {
		throw new InvalidBlueprintDataError(`failed validation against ${BLUEPRINT_DATA_SCHEMA}`)
	}
	return normalized
}
