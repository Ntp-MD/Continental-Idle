import type { FloorLayoutData, ObjectData, AssetDef } from '../types'
import { validateLayoutData, validateLayoutIntegrity, normalizeAllowedRoleIds, normalizeNpcSpawnZones, normalizeFloorWalkable, normalizeObjectPlacement, normalizeCornerRx, normalizeNpcConfig, parseCanvasConfig } from '../types'
import { findAssetCached, buildAssetMap, validatePortalConfiguration } from '../assetUtils'
import { normalizeObject } from '../geometry'
import { recalcCollapsed } from '../collision'
import { EDITOR_CONFIG } from '../editorConfig'
import { originAssets, buildSavedLayout } from './dataLoader'
import { editorLog, genId, emptyNpcConfig } from './storeUtils'

export { EDITOR_CONFIG }
export const LAYOUT_VERSION = EDITOR_CONFIG.layoutVersion

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
					objects: Array.isArray(fRec.objects) ? fRec.objects.filter(
						(o: unknown): o is Record<string, unknown> => {
							const rec = o as Record<string, unknown>
							return typeof rec?.id === 'string' && typeof rec?.type === 'string'
								&& typeof rec?.x === 'number' && isFinite(rec.x as number)
								&& typeof rec?.y === 'number' && isFinite(rec.y as number)
						}
					).map((o) => {
						const placement = normalizeObjectPlacement(o)!
						const base: ObjectData = {
							...placement,
							w: typeof o.w === 'number' ? o.w : 0,
							h: typeof o.h === 'number' ? o.h : 0,
						}
						if (typeof o.radius === 'number' && o.radius > 0) base.radius = o.radius
						if (typeof o.label === 'string') base.label = o.label
						if (typeof o.padding === 'number' && o.padding > 0) base.padding = o.padding
						if (typeof o.labelPadding === 'number' && o.labelPadding > 0) base.labelPadding = o.labelPadding
						if (typeof o.fillColor === 'string') base.fillColor = o.fillColor
						if (typeof o.collapsed === 'boolean') base.collapsed = o.collapsed
						if (typeof o.isWall === 'boolean') base.isWall = o.isWall


						const rx = normalizeCornerRx(o.rx)
						if (rx) base.rx = rx
						return base
					}) : [],
					defaultWalkable: typeof fRec.defaultWalkable === 'boolean' ? fRec.defaultWalkable : true,
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
		floor.objects = floor.objects.filter(o => o.isWall || findAssetCached(migratedAssetMap, o.type))
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


