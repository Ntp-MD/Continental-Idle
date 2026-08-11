import type { AssetDef, FloorLayoutData, NpcSimulationConfig, CanvasConfig, FloorData, OriginAssetFile } from '../types'
import { normalizeOriginAssetFile, isNpcConfig } from '../types'
import { EDITOR_CONFIG } from '../editorConfig'
import { migrateNpcConfig } from './migrateNpc'
import originAssetsJson from '../data/originAssets.json'
import blueprintLayoutJson from '../data/blueprintLayout.json'
import npcConfigJson from '../data/npcConfig.json'

export interface BlueprintLayoutFile {
	$schema: string
	version: number
	canvas: CanvasConfig
	floors: FloorData[]
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

export const originAssetFile: OriginAssetFile = normalizeOriginAssetFile(originAssetsJson) ?? {
	$schema: 'origin-assets.v1.json',
	version: 1,
	originAssets: [],
}
export const originAssets: AssetDef[] = originAssetFile.originAssets
export const blueprintLayout: BlueprintLayoutFile = normalizeBlueprintLayout(blueprintLayoutJson)

export const npcConfig: NpcSimulationConfig = isNpcConfig(npcConfigJson)
	? (npcConfigJson as unknown as NpcSimulationConfig)
	: migrateNpcConfig(npcConfigJson)

export function buildSavedLayout(): FloorLayoutData {
	return {
		version: blueprintLayout.version,
		canvas: blueprintLayout.canvas,
		floors: blueprintLayout.floors,
		npcConfig,
	}
}

export function buildRuntimeLayout(): FloorLayoutData {
	return buildSavedLayout()
}


function normalizeBlueprintLayout(raw: unknown): BlueprintLayoutFile {
	const r = raw as Record<string, unknown>
	if (!r || typeof r !== 'object') {
		throw new Error('blueprintLayout.json: invalid structure — expected an object')
	}
	if (typeof r.version !== 'number' || !isFinite(r.version)) {
		throw new Error('blueprintLayout.json: version must be a finite number')
	}
	if (!r.canvas || typeof r.canvas !== 'object') {
		throw new Error('blueprintLayout.json: canvas must be an object')
	}
	if (!Array.isArray(r.floors)) {
		throw new Error('blueprintLayout.json: floors must be an array')
	}
	return {
		$schema: typeof r.$schema === 'string' ? r.$schema : 'blueprint-layout.v1.json',
		version: r.version,
		canvas: r.canvas as CanvasConfig,
		floors: r.floors as FloorData[],
	}
}

export async function fetchLayoutFromDisk(): Promise<BlueprintLayoutFile | null> {
	try {
		const res = await fetch(EDITOR_CONFIG.loadLayoutEndpoint)
		if (!res.ok) return null
		return normalizeBlueprintLayout(await res.json())
	} catch { return null }
}

export async function fetchNpcConfigFromDisk(): Promise<NpcSimulationConfig | null> {
	try {
		const res = await fetch(EDITOR_CONFIG.loadNpcConfigEndpoint)
		if (!res.ok) return null
		const raw = await res.json()
		return isNpcConfig(raw) ? (raw as NpcSimulationConfig) : migrateNpcConfig(raw)
	} catch { return null }
}

export async function fetchOriginAssetsFromDisk(): Promise<AssetDef[] | null> {
	try {
		const res = await fetch(EDITOR_CONFIG.loadOriginAssetsEndpoint)
		if (!res.ok) return null
		const file = normalizeOriginAssetFile(await res.json())
		return file?.originAssets ?? null
	} catch { return null }
}
