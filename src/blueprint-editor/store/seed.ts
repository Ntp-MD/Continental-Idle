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
	// A rejected import is cached like a resolved one, which would make the first transient failure
	// permanent: every later call - including the boot check, which decides what the player sees -
	// would replay the same error for the life of the tab. A failed attempt is forgotten instead,
	// so the next caller retries the fetch rather than inheriting a verdict it never re-made.
	pending ??= import('../data/blueprint-data.json')
		.then((mod) => {
			const parsed = readBlueprintDataFile((mod as { default: unknown }).default)
			if (!parsed) throw new InvalidBlueprintDataError('Static blueprint data failed schema validation')
			return parsed
		})
		.catch((error: unknown) => {
			pending = undefined
			throw error
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

/**
 * The house that ships with the game, as a workspace file: the same validated document the seed loader
 * already parsed, handed to the store's one import path. A first run has no floors and no assets, so this
 * is what turns "open the editor and author a lobby before playing" into a single click.
 */
export const seedWorkspaceFile = async () => (await file())

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
