import type { AssetDef, BlueprintDataFile, BlueprintTagDefinition, FloorLayoutData, NpcSimulationConfig, CanvasConfig, ObjectData, PersistedFloorLayoutData } from '../domain/types'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION, normalizePersistedLayoutData } from '../domain/types'
import { serializeAsset, serializeObject } from '../assets/assetUtils'

export interface BlueprintLayoutFile extends PersistedFloorLayoutData {
	$schema: string
	canvas: CanvasConfig
}

export function buildBlueprintData(
	layout: FloorLayoutData,
	assets: AssetDef[],
	config: NpcSimulationConfig,
	tags: BlueprintTagDefinition[],
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

export function buildSavedLayout(layout: BlueprintLayoutFile, config: NpcSimulationConfig): FloorLayoutData {
	return {
		version: layout.version,
		canvas: layout.canvas,
		floors: layout.floors.map(floor => ({
			...floor,
			objects: floor.objects.map((object): ObjectData => ({ ...object, w: 0, h: 0 })),
		})),
		npcConfig: config,
	}
}

export function normalizeBlueprintLayout(raw: unknown): BlueprintLayoutFile {
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
