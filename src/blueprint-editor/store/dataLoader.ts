import type { AssetDef, BlueprintDataFile, BlueprintTagDefinition, FloorLayoutData, NpcSimulationConfig, CanvasConfig, ObjectData, OriginAssetFile, PersistedFloorLayoutData } from '../types'
import { normalizeOriginAssetFile, normalizeNpcConfig, validateLayoutData } from '../types'
import { serializeAsset, serializeObject } from '../assetUtils'
import { EDITOR_CONFIG } from '../editorConfig'
import { emptyNpcConfig } from './storeUtils'
import { originAssetsData } from '../data/originAssets.data'
import { floorPlanData } from '../data/floorPlan.data'
import { npcSettingsData } from '../data/npcSettings.data'
import { tagManagerData } from '../data/tagManager.data'

export interface BlueprintLayoutFile extends PersistedFloorLayoutData {
	$schema: string
	canvas: CanvasConfig
}

export const blueprintTagDefinitions: BlueprintTagDefinition[] = (tagManagerData as unknown[]).flatMap((value) => {
	if (!value || typeof value !== 'object') return []
	const tag = value as Record<string, unknown>
	return typeof tag.id === 'string' && typeof tag.label === 'string' ? [{ id: tag.id, label: tag.label }] : []
})
export const originAssetFile: OriginAssetFile = normalizeOriginAssetFile({
	$schema: 'origin-assets.v2.json',
	version: 2,
	originAssets: originAssetsData,
}) ?? { $schema: 'origin-assets.v2.json', version: 2, originAssets: [] }
export const originAssets: AssetDef[] = originAssetFile.originAssets
export const blueprintLayout: BlueprintLayoutFile = normalizeBlueprintLayout(floorPlanData)
export const npcConfig: NpcSimulationConfig = normalizeNpcConfig(npcSettingsData) ?? emptyNpcConfig()

export function buildBlueprintData(
	layout: FloorLayoutData = buildSavedLayout(),
	assets: AssetDef[] = originAssets,
	config: NpcSimulationConfig = npcConfig,
	tags: BlueprintTagDefinition[] = blueprintTagDefinitions,
): BlueprintDataFile {
	return {
		$schema: 'blueprint-data.v2.json',
		version: 2,
		tags: tags.map(tag => ({ ...tag })),
		originAssets: assets.map(serializeAsset),
		layout: {
			...layout,
			npcConfig: undefined,
			floors: layout.floors.map(floor => ({
				...floor,
				objects: floor.objects.map(serializeObject),
			})),
		},
		npcConfig: config,
	}
}

export async function fetchBlueprintDataFromDisk(): Promise<BlueprintDataFile | null> {
	try {
		const res = await fetch(EDITOR_CONFIG.blueprintDataEndpoint)
		if (!res.ok) return null
		const raw = await res.json() as Record<string, unknown>
		const config = normalizeNpcConfig(raw.npcConfig)
		if (!config) return null
		const layout = validateLayoutData(raw.layout)
		if (!layout) return null
		const assetFile = normalizeOriginAssetFile({
			$schema: 'origin-assets.v2.json',
			version: 2,
			originAssets: raw.originAssets,
		})
		if (!assetFile) return null
		const tags: BlueprintTagDefinition[] = Array.isArray(raw.tags)
			? raw.tags.filter((t): t is BlueprintTagDefinition =>
				t != null && typeof t === 'object' && typeof t.id === 'string' && typeof t.label === 'string')
			: []
		return {
			$schema: typeof raw.$schema === 'string' ? raw.$schema : 'blueprint-data.v2.json',
			version: typeof raw.version === 'number' ? raw.version : 2,
			tags,
			originAssets: assetFile.originAssets,
			layout: layout as PersistedFloorLayoutData,
			npcConfig: config,
		}
	} catch {
		return null
	}
}

export function buildSavedLayout(): FloorLayoutData {
	return {
		version: blueprintLayout.version,
		canvas: blueprintLayout.canvas,
		floors: blueprintLayout.floors.map(floor => ({
			...floor,
			objects: floor.objects.map(object => ({ ...object, w: 0, h: 0 } as ObjectData)),
		})),
		npcConfig,
	}
}

function normalizeBlueprintLayout(raw: unknown): BlueprintLayoutFile {
	const r = raw as Record<string, unknown>
	if (!r || typeof r !== 'object') throw new Error('floorPlan.data.ts: invalid structure - expected an object')
	const layout = validateLayoutData(r)
	if (!layout) throw new Error('floorPlan.data.ts: failed layout validation (version, canvas, or floors invalid)')
	return {
		$schema: typeof r.$schema === 'string' ? r.$schema : 'blueprint-layout.v1.json',
		version: layout.version,
		canvas: layout.canvas,
		floors: layout.floors as PersistedFloorLayoutData['floors'],
	}
}
