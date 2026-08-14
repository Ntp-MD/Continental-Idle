import type { AssetDef, BlueprintDataFile, BlueprintTagDefinition, FloorLayoutData, NpcSimulationConfig, CanvasConfig, ObjectData, OriginAssetFile, PersistedFloorLayoutData } from '../types'
import { normalizeOriginAssetFile, normalizeNpcConfig } from '../types'
import { serializeAsset, serializeObject } from '../assetUtils'
import { EDITOR_CONFIG } from '../editorConfig'
import { migrateNpcConfig } from './migrateNpc'
import { originAssetsData } from '../data/originAssets.data'
import { floorPlanData } from '../data/floorPlan.data'
import { npcSettingsData } from '../data/npcSettings.data'
import { tagManagerData } from '../data/tagManager.data'

export interface BlueprintLayoutFile extends PersistedFloorLayoutData {
	$schema: string
	canvas: CanvasConfig
}

export const blueprintTagDefinitions: BlueprintTagDefinition[] = Array.isArray(tagManagerData)
	? tagManagerData.map(tag => ({ id: tag.id, label: tag.label }))
	: []
export const originAssetFile: OriginAssetFile = normalizeOriginAssetFile({
	$schema: 'origin-assets.v1.json',
	version: 1,
	originAssets: originAssetsData,
}) ?? { $schema: 'origin-assets.v1.json', version: 1, originAssets: [] }
export const originAssets: AssetDef[] = originAssetFile.originAssets
export const blueprintLayout: BlueprintLayoutFile = normalizeBlueprintLayout(floorPlanData)
export const npcConfig: NpcSimulationConfig = normalizeNpcConfig(npcSettingsData) ?? migrateNpcConfig(npcSettingsData)

export function buildBlueprintData(
	layout: FloorLayoutData = buildSavedLayout(),
	assets: AssetDef[] = originAssets,
	config: NpcSimulationConfig = npcConfig,
	tags: BlueprintTagDefinition[] = blueprintTagDefinitions,
): BlueprintDataFile {
	return {
		$schema: 'blueprint-data.v1.json',
		version: 1,
		tags: tags.map(tag => ({ ...tag })),
		originAssets: assets.map(serializeAsset) as unknown as AssetDef[],
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
		const raw = await res.json() as Partial<BlueprintDataFile>
		const config = normalizeNpcConfig(raw.npcConfig)
		if (!raw.layout || !Array.isArray(raw.originAssets) || !config || !Array.isArray(raw.tags)) return null
		return { ...buildBlueprintData(), ...raw, npcConfig: config }
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
	if (!r || typeof r !== 'object') throw new Error('blueprintData.json: invalid structure — expected an object')
	if (typeof r.version !== 'number' || !isFinite(r.version)) throw new Error('blueprintData.json: version must be a finite number')
	if (!r.canvas || typeof r.canvas !== 'object') throw new Error('blueprintData.json: canvas must be an object')
	if (!Array.isArray(r.floors)) throw new Error('blueprintData.json: floors must be an array')
	return {
		$schema: typeof r.$schema === 'string' ? r.$schema : 'blueprint-layout.v1.json',
		version: r.version,
		canvas: r.canvas as CanvasConfig,
		floors: r.floors as PersistedFloorLayoutData['floors'],
	}
}
