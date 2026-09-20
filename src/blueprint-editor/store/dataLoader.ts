import type { AssetDef, BlueprintDataFile, BlueprintTagDefinition, FloorLayoutData, NpcSimulationConfig, CanvasConfig, ObjectData, PersistedFloorLayoutData } from '../domain/types'
import { BLUEPRINT_DATA_SCHEMA, BLUEPRINT_DATA_VERSION } from '../domain/types'
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
			// Persisted sizes are untrusted: migrate() re-derives w/h via
			// normalizeObject before the engine, collision, or canvas reads
			// them, and engine guards degrade unresolved sizes instead of NaN.
			objects: floor.objects.map((object): ObjectData => ({ ...object, w: 0, h: 0 })),
		})),
		...(layout.streetWidthTiles !== undefined ? { streetWidthTiles: layout.streetWidthTiles } : {}),
		...(layout.streetFloorId !== undefined ? { streetFloorId: layout.streetFloorId } : {}),
		...(layout.editorSettings !== undefined ? { editorSettings: layout.editorSettings } : {}),
		npcConfig: config,
	}
}
