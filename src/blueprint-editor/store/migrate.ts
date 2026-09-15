import type { FloorLayoutData, ObjectData, AssetDef } from '../domain/types'
import { validateLayoutData, validateLayoutIntegrity, normalizeAllowedRoleIds, normalizeNpcSpawnZones, normalizeFloorWalkable, normalizeObjectPlacement, normalizeNpcConfig, parseCanvasConfig, resolveDefaultWalkable } from '../domain/types'
import { findAssetCached, buildAssetMap } from '../assets/assetUtils'
import { validatePortalConfiguration } from '../assets/validation'
import { normalizeObject } from '../domain/geometry'
import { recalcCollapsed } from '../domain/collision'
import { EDITOR_CONFIG } from '../editorConfig'
import { originAssets, buildSavedLayout } from './dataLoader'
import { editorLog, genId, emptyNpcConfig } from './storeUtils'

const LAYOUT_VERSION = EDITOR_CONFIG.layoutVersion

function migrateObjects(raw: unknown[], floorLabel: unknown): ObjectData[] {
	const label = typeof floorLabel === 'string' ? floorLabel : '?'
	const out: ObjectData[] = []
	for (const o of raw) {
		const placement = normalizeObjectPlacement(o)
		if (!placement) continue
		const rec = (o ?? {}) as Record<string, unknown>
		const base: ObjectData = { ...placement, w: 0, h: 0 }
		if (typeof rec.label === 'string') base.label = rec.label
		if (typeof rec.collapsed === 'boolean') base.collapsed = rec.collapsed
		out.push(base)
	}
	if (out.length < raw.length) {
		editorLog.warn('Migration', `dropped ${raw.length - out.length} invalid object(s) from floor "${label}"`)
	}
	return out
}

export function migrate(data: unknown, availableAssets: readonly AssetDef[] = originAssets): { layout: FloorLayoutData } {
	if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Cannot migrate invalid layout data')
	const d = data as Record<string, unknown>
	const parsedCanvas = parseCanvasConfig(d.canvas, false)
	const canvas = { ...EDITOR_CONFIG.defaultCanvas, ...(parsedCanvas ?? {}) }

	const migrated: FloorLayoutData = {
		version: LAYOUT_VERSION,
		canvas,
		floors: Array.isArray(d.floors) && d.floors.length > 0
			? d.floors.map((f: unknown) => {
				const fRec = (f ?? {}) as Record<string, unknown>
				return {
					id: typeof fRec.id === 'string' ? fRec.id : genId('floor'),
					name: typeof fRec.name === 'string' ? fRec.name : 'Unnamed',
					label: typeof fRec.label === 'string' ? fRec.label : 'F?',
					labelColor: typeof fRec.labelColor === 'string' ? fRec.labelColor : undefined,
					objects: Array.isArray(fRec.objects) ? migrateObjects(fRec.objects, fRec.label) : [],
					defaultWalkable: resolveDefaultWalkable(fRec),
					walkable: normalizeFloorWalkable(fRec.walkable),
					spawnZones: normalizeNpcSpawnZones(fRec.spawnZones),
					allowedRoleIds: normalizeAllowedRoleIds(fRec.allowedRoleIds),
				}
			})
			: [],
		npcConfig: normalizeNpcConfig(d.npcConfig) ?? emptyNpcConfig(),
	}
	if (typeof d.streetFloorId === 'string' && migrated.floors.some(f => f.id === d.streetFloorId)) {
		migrated.streetFloorId = d.streetFloorId
	}
	if (typeof d.streetWidthTiles === 'number' && Number.isInteger(d.streetWidthTiles) && d.streetWidthTiles >= 5 && d.streetWidthTiles <= 20) {
		migrated.streetWidthTiles = d.streetWidthTiles
	}
	const migratedAssetMap = buildAssetMap(availableAssets)
	for (const floor of migrated.floors) {
		const beforeCount = floor.objects.length
		floor.objects = floor.objects.filter(o => findAssetCached(migratedAssetMap, o.type))
		const removedCount = beforeCount - floor.objects.length
		if (removedCount > 0) {
			editorLog.warn('Migration', `removed ${removedCount} object(s) with unknown asset types from floor "${floor.label}"`)
		}

		for (const obj of floor.objects) {
			normalizeObject(obj, migrated.canvas.tileSize, migratedAssetMap)
		}
		recalcCollapsed(floor, migratedAssetMap)
	}
	const integrityIssues = validateLayoutIntegrity(migrated)
	if (integrityIssues.length > 0) {
		editorLog.warn('Migration', `layout integrity issues: ${integrityIssues.join('; ')}`)
	}
	if (!validateLayoutData(migrated as unknown)) throw new Error('Migrated layout failed schema validation')

	const portalCheck = validatePortalConfiguration(migrated, migratedAssetMap, migrated.npcConfig)
	for (const err of portalCheck.errors) editorLog.error('Portal', err)
	for (const warn of portalCheck.warnings) editorLog.warn('Portal', warn)
	return { layout: migrated }
}

export function loadInitial(): { layout: FloorLayoutData } {
	return { layout: structuredClone(buildSavedLayout()) }
}


