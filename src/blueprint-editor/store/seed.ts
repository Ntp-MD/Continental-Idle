import { readBlueprintDataFile, InvalidBlueprintDataError } from './schemaMigration'
import { buildSavedLayout, type BlueprintLayoutFile } from './dataLoader'
import type { BlueprintStoreSeed } from './createStore'

// The 233KB static JSON stays out of the main bundle via dynamic import - it
// is fetched only when seed content is actually needed (boot validation,
// tests). Validated via seedVersionError() during editor boot, NOT at module
// eval - a malformed file must reach the load-error UI, not white-screen.
type SeedFile = NonNullable<ReturnType<typeof readBlueprintDataFile>>
let pending: Promise<SeedFile> | undefined

function file(): Promise<SeedFile> {
	pending ??= import('../data/blueprint-data.json').then((mod) => {
		const parsed = readBlueprintDataFile((mod as { default: unknown }).default)
		if (!parsed) throw new InvalidBlueprintDataError('Static blueprint data failed schema validation')
		return parsed
	})
	return pending
}

export async function seedVersionError(): Promise<Error | undefined> {
	try {
		await file()
		return undefined
	} catch (error) {
		return error instanceof Error ? error : new Error(String(error))
	}
}

export const seedTagDefinitions = async () => (await file()).tags

export const seedLayout = async (): Promise<BlueprintLayoutFile> => ({ $schema: 'blueprint-layout.v1.json', ...(await file()).layout })

export const seedNpcConfig = async () => (await file()).npcConfig

export const seedOriginAssets = async () => (await file()).originAssets

export async function defaultSeed(): Promise<BlueprintStoreSeed> {
	const [layout, npcConfig, assets, tags] = await Promise.all([seedLayout(), seedNpcConfig(), seedOriginAssets(), seedTagDefinitions()])
	return {
		layout: structuredClone(buildSavedLayout(layout, npcConfig)),
		assetRegistry: structuredClone(assets),
		tagDefinitions: structuredClone(tags),
	}
}
