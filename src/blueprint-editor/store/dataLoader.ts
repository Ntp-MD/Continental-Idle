import type { AssetDef, FloorLayoutData, NpcSimulationConfig, CanvasConfig, FloorData, RoomTemplate } from '../types'
import assetCatalogJson from '../data/assetCatalog.json'
import customAssetsJson from '../data/customAssets.json'
import blueprintLayoutJson from '../data/blueprintLayout.json'
import npcConfigJson from '../data/npcConfig.json'

/**
 * ───────────────────────────────────────────────────────────────────────────
 * JSON data loader — Blueprint Editor
 * ───────────────────────────────────────────────────────────────────────────
 * Source of truth for editor data lives in four JSON files under
 * `src/blueprint-editor/data/`:
 *
 *   assetCatalog.json    — original/preset asset definitions (read-only at
 *                          runtime; updated only by an explicit migration)
 *   customAssets.json    — user-added assets + deletedDefaultIds
 *   blueprintLayout.json — canvas, floors, rooms, objects, zones, templates,
 *                          globalTags
 *   npcConfig.json       — NPC roles, tasks, behavior, pool
 *
 * TypeScript modules consume these JSON files via this loader.  Persistence
 * endpoints write back to the same JSON files.  No generated TypeScript data
 * files are involved.
 * ───────────────────────────────────────────────────────────────────────────
 */

export interface AssetCatalogFile {
	$schema: string
	version: number
	assets: AssetDef[]
}

export interface CustomAssetsFile {
	$schema: string
	version: number
	customAssets: AssetDef[]
	deletedDefaultIds: string[]
}

export interface BlueprintLayoutFile {
	$schema: string
	version: number
	canvas: CanvasConfig
	floors: FloorData[]
	roomTemplates: RoomTemplate[]
	globalTags: string[]
}

export interface NpcConfigFile {
	$schema: string
	version: number
	speed: number
	defaultRoleId: string
	roles: NpcSimulationConfig['roles']
	tasks: NpcSimulationConfig['tasks']
	pool: NpcSimulationConfig['pool']
}

export const assetCatalog: AssetDef[] = assetCatalogJson.assets as unknown as AssetDef[]
export const customAssets: AssetDef[] = customAssetsJson.customAssets as unknown as AssetDef[]
export const deletedDefaultIds: string[] = customAssetsJson.deletedDefaultIds
export const blueprintLayout: BlueprintLayoutFile = blueprintLayoutJson as unknown as BlueprintLayoutFile
export const npcConfig: NpcSimulationConfig = (() => {
	const f = npcConfigJson as unknown as NpcConfigFile
	return {
		speed: f.speed,
		defaultRoleId: f.defaultRoleId,
		roles: f.roles,
		tasks: f.tasks,
		pool: f.pool,
	}
})()

/**
 * Reconstruct a `FloorLayoutData`-shaped object (with a transient
 * `customAssets` field) so `migrate()` can consume it unchanged.
 */
export function buildSavedLayout(): FloorLayoutData & { customAssets: AssetDef[] } {
	return {
		version: blueprintLayout.version,
		canvas: blueprintLayout.canvas,
		floors: blueprintLayout.floors,
		roomTemplates: blueprintLayout.roomTemplates,
		npcConfig,
		globalTags: blueprintLayout.globalTags,
		deletedDefaultIds,
		customAssets,
	} as FloorLayoutData & { customAssets: AssetDef[] }
}

/**
 * Build a clean `FloorLayoutData` (without `customAssets`) for runtime
 * consumers such as the HQ overlay.
 */
export function buildRuntimeLayout(): FloorLayoutData {
	return {
		version: blueprintLayout.version,
		canvas: blueprintLayout.canvas,
		floors: blueprintLayout.floors,
		roomTemplates: blueprintLayout.roomTemplates,
		npcConfig,
		globalTags: blueprintLayout.globalTags,
		deletedDefaultIds,
	}
}
