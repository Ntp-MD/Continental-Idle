import type { AssetDef, BlueprintDataFile, BlueprintTagDefinition, FloorLayoutData, NpcSimulationConfig, CanvasConfig, ObjectData, OriginAssetFile, PersistedFloorLayoutData } from '../domain/types'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizeBlueprintDataFile, normalizeOriginAssetFile, normalizeNpcConfig, normalizePersistedLayoutData, normalizeTagDefinitions } from '../domain/types'
import { serializeAsset, serializeObject } from '../assets/assetUtils'
import { EDITOR_CONFIG } from '../editorConfig'
import { emptyNpcConfig, editorLog } from './storeUtils'
import { originAssetsData } from '../data/originAssets.data'
import { floorPlanData } from '../data/floorPlan.data'
import { npcSettingsData } from '../data/npcSettings.data'
import { tagManagerData } from '../data/tagManager.data'

export interface BlueprintLayoutFile extends PersistedFloorLayoutData {
	$schema: string
	canvas: CanvasConfig
}

export const blueprintTagDefinitions: BlueprintTagDefinition[] = normalizeTagDefinitions(tagManagerData) ?? []
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
		$schema: BLUEPRINT_DATA_SCHEMA,
		version: BLUEPRINT_DATA_VERSION,
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
		const res = await fetch(EDITOR_CONFIG.blueprintDataEndpoint, { headers: { 'X-Blueprint-Client': '1' } })
		if (!res.ok || !res.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null
		const raw: unknown = await res.json()
		return normalizeBlueprintDataFile(raw) ?? null
	} catch (error) {
		editorLog.error('fetchBlueprintDataFromDisk', error)
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
	const layout = normalizePersistedLayoutData(r)
	if (!layout) throw new Error('floorPlan.data.ts: failed layout validation (version, canvas, or floors invalid)')
	return {
		$schema: typeof r.$schema === 'string' ? r.$schema : 'blueprint-layout.v1.json',
		version: layout.version,
		canvas: layout.canvas,
		floors: layout.floors,
	}
}
