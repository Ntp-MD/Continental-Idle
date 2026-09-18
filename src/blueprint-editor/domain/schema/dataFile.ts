import type { AssetDef, BlueprintTagDefinition } from './assets'
import { normalizeAssetColor, normalizeOriginAssetFile } from './assets'
import type { FloorData, FloorLayoutData } from './layout'
import { normalizeEditorSettings, parseCanvasConfig } from './layout'
import type { NpcSimulationConfig } from './npc'
import { NPC_FRAME_DEFAULTS, NPC_OPTION_DEFAULTS, isNpcConfig, isValidTagTriggerRates, normalizeNpcConfig, normalizeTagTriggerRates } from './npc'
import type { NpcSpawnZone, ObjectPlacement } from './objects'
import { normalizeAllowedRoleIds, normalizeNpcSpawnZones, normalizeObjectPlacement } from './objects'
import { normalizeFloorWalkable } from './walkable'
import { MAX_FLOORS, MAX_NPC_ENTRIES, MAX_OBJECTS_PER_FLOOR } from '../../limits'
import { MAX_DATA_STRING_LENGTH, hasOwn, isFiniteNumber, isRecord, normalizeIdentifier, normalizeTag, normalizeText } from './helpers'

export interface PersistedFloorData extends Omit<FloorData, 'objects'> {
	objects: ObjectPlacement[]
}

export interface PersistedFloorLayoutData extends Omit<FloorLayoutData, 'floors'> {
	floors: PersistedFloorData[]
}

// --- Section 11: Blueprint data file ---

export interface BlueprintDataFile {
	$schema: string
	version: number
	tags: BlueprintTagDefinition[]
	originAssets: AssetDef[]
	layout: PersistedFloorLayoutData
	npcConfig: NpcSimulationConfig
}

export const BLUEPRINT_DATA_SCHEMA = 'blueprint-data.v2.json'
export const BLUEPRINT_DATA_VERSION = 2

export function validateLayoutData(data: unknown): boolean {
	if (!isRecord(data)) return false
	if (data.npcConfig !== undefined && !isNpcConfig(data.npcConfig)) return false
	const persistedInput: Record<string, unknown> = { ...data }
	delete persistedInput.npcConfig
	return normalizePersistedLayoutData(persistedInput) !== undefined
}

export function normalizeTagDefinitions(value: unknown): BlueprintTagDefinition[] | undefined {
	if (!Array.isArray(value) || value.length > 256) return undefined
	const tags: BlueprintTagDefinition[] = []
	const seen = new Set<string>()
	for (const item of value) {
		if (!isRecord(item)) return undefined
		const id = normalizeTag(item.id)
		const label = normalizeText(item.label)
		if (!id || !label || seen.has(id)) return undefined
		seen.add(id)
		tags.push({ id, label })
	}
	return tags
}

function normalizePersistedSpawnZones(value: unknown): NpcSpawnZone[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_OBJECTS_PER_FLOOR) return undefined
	const normalized = normalizeNpcSpawnZones(value)
	if (!normalized || normalized.length !== value.length) return undefined
	for (const item of value) {
		if (!isRecord(item)) return undefined
		if (hasOwn(item, 'label') && typeof item.label !== 'string') return undefined
		if (hasOwn(item, 'roleIds')) {
			if (!Array.isArray(item.roleIds) || item.roleIds.some(roleId => !normalizeIdentifier(roleId))) return undefined
		}
	}
	return normalized
}

export function normalizePersistedLayoutData(value: unknown): PersistedFloorLayoutData | undefined {
	if (!isRecord(value) || !isFiniteNumber(value.version) || !Number.isInteger(value.version) || value.version < 0 || value.version > 100) return undefined
	if (hasOwn(value, 'npcConfig') && value.npcConfig !== undefined) return undefined
	const canvas = parseCanvasConfig(value.canvas, true)
	if (!canvas || !Array.isArray(value.floors) || value.floors.length === 0 || value.floors.length > MAX_FLOORS) return undefined

	const floors: PersistedFloorData[] = []
	const floorIds = new Set<string>()
	const objectIds = new Set<string>()
	for (const item of value.floors) {
		if (!isRecord(item)) return undefined
		const id = normalizeIdentifier(item.id)
		const name = normalizeText(item.name)
		const label = normalizeText(item.label)
		if (!id || !name || !label || floorIds.has(id) || !Array.isArray(item.objects) || item.objects.length > MAX_OBJECTS_PER_FLOOR) return undefined
		floorIds.add(id)
		const objects: ObjectPlacement[] = []
		for (const objectValue of item.objects) {
			const placement = normalizeObjectPlacement(objectValue)
			if (!placement || objectIds.has(placement.id)) return undefined
			objectIds.add(placement.id)
			objects.push(placement)
		}
		const floor: PersistedFloorData = { id, name, label, objects }
		if (item.labelColor !== undefined) {
			const labelColor = normalizeAssetColor(item.labelColor)
			if (!labelColor) return undefined
			floor.labelColor = labelColor
		}
		if (item.defaultWalkable !== undefined) {
			if (typeof item.defaultWalkable !== 'boolean') return undefined
			floor.defaultWalkable = item.defaultWalkable
		}
		if (item.walkable !== undefined) {
			const walkable = normalizeFloorWalkable(item.walkable)
			if (!walkable) return undefined
			floor.walkable = walkable
		}
		if (item.spawnZones !== undefined) {
			const spawnZones = normalizePersistedSpawnZones(item.spawnZones)
			if (!spawnZones) return undefined
			floor.spawnZones = spawnZones
		}
		if (item.allowedRoleIds !== undefined) {
			if (!Array.isArray(item.allowedRoleIds) || item.allowedRoleIds.length > MAX_NPC_ENTRIES || item.allowedRoleIds.some(roleId => !normalizeIdentifier(roleId))) return undefined
			const allowedRoleIds = normalizeAllowedRoleIds(item.allowedRoleIds)
			if (allowedRoleIds?.length) floor.allowedRoleIds = allowedRoleIds
		}
		floors.push(floor)
	}

	const layout: PersistedFloorLayoutData = { version: value.version, canvas, floors }
	if (hasOwn(value, 'streetWidthTiles')) {
		if (!isFiniteNumber(value.streetWidthTiles) || !Number.isInteger(value.streetWidthTiles) || value.streetWidthTiles < 5 || value.streetWidthTiles > 20) return undefined
		layout.streetWidthTiles = value.streetWidthTiles
	}
	if (hasOwn(value, 'streetFloorId')) {
		if (typeof value.streetFloorId !== 'string') return undefined
		const streetFloorId = value.streetFloorId.trim()
		if (!streetFloorId || !floorIds.has(streetFloorId)) return undefined
		layout.streetFloorId = streetFloorId
	}
	if (hasOwn(value, 'editorSettings') && value.editorSettings !== undefined) {
		layout.editorSettings = normalizeEditorSettings(value.editorSettings)
	}
	return layout
}

// --- Section 12: Layout integrity & persistence ---

export function normalizeNpcConfigForPersistence(value: unknown): NpcSimulationConfig | undefined {
	if (!isRecord(value) || !Array.isArray(value.roles) || !Array.isArray(value.tasks) || !Array.isArray(value.pool)) return undefined
	if (value.roles.length > MAX_NPC_ENTRIES || value.tasks.length > MAX_NPC_ENTRIES || value.pool.length > MAX_NPC_ENTRIES) return undefined
	if (typeof value.defaultRoleId !== 'string' || value.defaultRoleId.length > MAX_DATA_STRING_LENGTH) return undefined
	if (!isValidTagTriggerRates(value.tagTriggerRates)) return undefined
	if (value.roles.length === 0) {
		if (value.defaultRoleId.trim() || value.tasks.length > 0 || value.pool.length > 0 || !isFiniteNumber(value.speed) || value.speed < 0 || value.speed > 1) return undefined
		const tagTriggerRates = normalizeTagTriggerRates(value.tagTriggerRates)
		return {
			speed: Math.max(0.001, Math.min(1, value.speed)),
			defaultRoleId: '',
			roles: [],
			tasks: [],
			pool: [],
			...NPC_OPTION_DEFAULTS,
			...NPC_FRAME_DEFAULTS,
			...(tagTriggerRates ? { tagTriggerRates } : {}),
		}
	}
	if (!isNpcConfig(value)) return undefined
	const normalized = normalizeNpcConfig(value)
	if (!normalized || normalized.roles.length !== value.roles.length || normalized.tasks.length !== value.tasks.length || normalized.pool.length !== value.pool.length) return undefined
	const roleIds = new Set<string>()
	for (const role of normalized.roles) {
		if (roleIds.has(role.id)) return undefined
		roleIds.add(role.id)
	}
	const taskIds = new Set<string>()
	for (const task of normalized.tasks) {
		if (taskIds.has(task.id)) return undefined
		taskIds.add(task.id)
	}
	if (!roleIds.has(normalized.defaultRoleId)) return undefined
	for (let index = 0; index < value.roles.length; index++) {
		const rawRole = value.roles[index]
		if (!isRecord(rawRole) || !Array.isArray(rawRole.taskIds)) return undefined
		const rawTaskIds = rawRole.taskIds.map(taskId => normalizeIdentifier(taskId))
		if (rawTaskIds.some((taskId): taskId is undefined => !taskId)) return undefined
		const canonicalTaskIds = rawTaskIds.filter((taskId): taskId is string => !!taskId)
		if (new Set(canonicalTaskIds).size !== normalized.roles[index].taskIds.length || canonicalTaskIds.some(taskId => !taskIds.has(taskId))) return undefined
	}
	for (const entry of normalized.pool) {
		if (!roleIds.has(entry.roleId)) return undefined
	}
	return normalized
}

export function normalizeBlueprintDataFile(value: unknown): BlueprintDataFile | undefined {
	if (!isRecord(value) || value.$schema !== BLUEPRINT_DATA_SCHEMA || value.version !== BLUEPRINT_DATA_VERSION) return undefined
	const tags = normalizeTagDefinitions(value.tags)
	const layout = normalizePersistedLayoutData(value.layout)
	const npcConfig = normalizeNpcConfigForPersistence(value.npcConfig)
	const assetFile = normalizeOriginAssetFile({ originAssets: value.originAssets })
	if (!tags || !layout || !npcConfig || !assetFile) return undefined
	const assets = assetFile.originAssets
	const assetIds = new Set(assets.map(asset => asset.id))
	const roleIds = new Set(npcConfig.roles.map(role => role.id))
	for (const floor of layout.floors) {
		for (const roleId of floor.allowedRoleIds ?? []) if (!roleIds.has(roleId)) return undefined
		for (const zone of floor.spawnZones ?? []) for (const roleId of zone.roleIds ?? []) if (!roleIds.has(roleId)) return undefined
		for (const object of floor.objects) {
			if (!assetIds.has(object.type)) return undefined
		}
	}
	return { $schema: BLUEPRINT_DATA_SCHEMA, version: BLUEPRINT_DATA_VERSION, tags, originAssets: assets, layout, npcConfig }
}

export function validateLayoutIntegrity(layout: FloorLayoutData): string[] {
	const issues: string[] = []
	const globalIds = new Set<string>()
	const knownRoleIds = new Set<string>()
	if (layout.npcConfig) {
		for (const role of layout.npcConfig.roles) knownRoleIds.add(role.id)
	}
	for (const floor of layout.floors) {
		const objectIds = new Set<string>()
		for (const object of floor.objects) {
			if (globalIds.has(object.id)) issues.push(`Duplicate object id: ${object.id}`)
			globalIds.add(object.id)
			objectIds.add(object.id)
			if (object.linkGroupId && !objectIds.has(object.linkGroupId)) {
				issues.push(`Object ${object.id} references missing link group ${object.linkGroupId}`)
			}
		}
		if (floor.allowedRoleIds) {
			for (const roleId of floor.allowedRoleIds) {
				if (knownRoleIds.size > 0 && !knownRoleIds.has(roleId)) {
					issues.push(`Floor ${floor.id} references unknown role: ${roleId}`)
				}
			}
		}
	}
	if (layout.npcConfig) {
		for (const pool of layout.npcConfig.pool) {
			if (!knownRoleIds.has(pool.roleId)) {
				issues.push(`NPC pool references unknown role: ${pool.roleId}`)
			}
		}
		if (!knownRoleIds.has(layout.npcConfig.defaultRoleId)) {
			issues.push(`NPC defaultRoleId references unknown role: ${layout.npcConfig.defaultRoleId}`)
		}
	}
	return issues
}
