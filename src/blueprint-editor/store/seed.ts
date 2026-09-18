import blueprintData from '../data/blueprint-data.json'
import { readBlueprintDataFile } from './schemaMigration'
import { buildSavedLayout, type BlueprintLayoutFile } from './dataLoader'
import type { BlueprintStoreSeed } from './createStore'

const file = readBlueprintDataFile(blueprintData)

export const seedTagDefinitions = file.tags

export const seedLayout: BlueprintLayoutFile = { $schema: 'blueprint-layout.v1.json', ...file.layout }

export const seedNpcConfig = file.npcConfig

export const seedOriginAssets = file.originAssets

export function defaultSeed(): BlueprintStoreSeed {
	return {
		layout: structuredClone(buildSavedLayout(seedLayout, seedNpcConfig)),
		assetRegistry: seedOriginAssets,
		tagDefinitions: seedTagDefinitions,
	}
}
