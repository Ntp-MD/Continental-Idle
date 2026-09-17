import type { AssetDef, BlueprintTagDefinition, NpcSimulationConfig } from '../domain/types'
import { normalizeNpcConfig, normalizeOriginAssetFile, normalizeTagDefinitions } from '../domain/types'
import { originAssetsData } from '../data/originAssets.data'
import { floorPlanData } from '../data/floorPlan.data'
import { npcSettingsData } from '../data/npcSettings.data'
import { tagManagerData } from '../data/tagManager.data'
import { emptyNpcConfig } from './storeUtils'
import { buildSavedLayout, normalizeBlueprintLayout, type BlueprintLayoutFile } from './dataLoader'
import type { BlueprintStoreSeed } from './createStore'

export const seedTagDefinitions: BlueprintTagDefinition[] = normalizeTagDefinitions(tagManagerData) ?? []

export const seedLayout: BlueprintLayoutFile = normalizeBlueprintLayout(floorPlanData)

export const seedNpcConfig: NpcSimulationConfig = normalizeNpcConfig(npcSettingsData) ?? emptyNpcConfig()

export const seedOriginAssets: AssetDef[] =
	normalizeOriginAssetFile({
		$schema: 'origin-assets.v2.json',
		version: 2,
		originAssets: originAssetsData,
	})?.originAssets ?? []

export function defaultSeed(): BlueprintStoreSeed {
	return {
		layout: structuredClone(buildSavedLayout(seedLayout, seedNpcConfig)),
		assetRegistry: seedOriginAssets,
		tagDefinitions: seedTagDefinitions,
	}
}