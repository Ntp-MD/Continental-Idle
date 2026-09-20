import blueprintData from '../data/blueprint-data.json'
import { readBlueprintDataFile, InvalidBlueprintDataError } from './schemaMigration'
import { buildSavedLayout, type BlueprintLayoutFile } from './dataLoader'
import type { BlueprintStoreSeed } from './createStore'

// Validated via seedVersionError() during editor boot, NOT at module eval -
// a malformed file must reach the load-error UI, not white-screen the app.
let cached: ReturnType<typeof readBlueprintDataFile> | undefined

function file(): NonNullable<ReturnType<typeof readBlueprintDataFile>> {
	cached ??= readBlueprintDataFile(blueprintData)
	if (!cached) throw new InvalidBlueprintDataError('Static blueprint data failed schema validation')
	return cached
}

export function seedVersionError(): Error | undefined {
	try {
		if (!readBlueprintDataFile(blueprintData)) {
			return new InvalidBlueprintDataError('Static blueprint data failed schema validation')
		}
		return undefined
	} catch (error) {
		return error instanceof Error ? error : new Error(String(error))
	}
}

export const seedTagDefinitions = () => file().tags

export const seedLayout = (): BlueprintLayoutFile => ({ $schema: 'blueprint-layout.v1.json', ...file().layout })

export const seedNpcConfig = () => file().npcConfig

export const seedOriginAssets = () => file().originAssets

export function defaultSeed(): BlueprintStoreSeed {
	return {
		layout: structuredClone(buildSavedLayout(seedLayout(), seedNpcConfig())),
		assetRegistry: structuredClone(seedOriginAssets()),
		tagDefinitions: structuredClone(seedTagDefinitions()),
	}
}
