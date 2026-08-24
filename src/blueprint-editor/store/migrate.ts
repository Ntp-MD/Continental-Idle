import type { FloorLayoutData, ObjectData, AssetBase, AssetDef, LinkedPart, Rotation } from '../types'
import { isAssetDef, validateLayoutData, validateLayoutIntegrity, normalizeInteractSpots, normalizeInteractConfig, normalizeTileEdges, normalizeWalkableGrid, normalizeTileStates, normalizeAllowedRoleIds, normalizeNpcSpawnZones, normalizeFloorWalkable, normalizeObjectPlacement, isValidColor } from '../types'
import { findAssetCached, buildAssetMap, validatePortalConfiguration } from '../assetUtils'
import { normalizeObject, snap } from '../geometry'
import { recalcCollapsed } from '../collision'
import { EDITOR_CONFIG } from '../editorConfig'
import { originAssets, buildSavedLayout } from './dataLoader'
import { editorLog, genId } from './utils'
import { migrateNpcConfig } from './migrateNpc'

export { migrateNpcConfig }

export { EDITOR_CONFIG }
export const LAYOUT_VERSION = EDITOR_CONFIG.layoutVersion
export const HISTORY_LIMIT = EDITOR_CONFIG.historyLimit

function readTags(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined
	const tags = value.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean)
	return tags.length > 0 ? tags : undefined
}


function applyAssetDefFields(asset: AssetDef, a: Record<string, unknown>): void {
	if (typeof a.walkable === 'boolean') asset.walkable = a.walkable
	if (typeof a.entranceRequired === 'boolean') asset.entranceRequired = a.entranceRequired
	const grid = normalizeWalkableGrid(a.walkableGrid)
	if (grid) asset.walkableGrid = grid
	const states = normalizeTileStates(a.tileStates)
	if (states) asset.tileStates = states
	const edges = normalizeTileEdges(a.tileEdges)
	if (edges) asset.tileEdges = edges
	const interactSpots = normalizeInteractSpots(a.interactSpots)
	if (interactSpots) asset.interactSpots = interactSpots
	const interact = normalizeInteractConfig(a.interact)
	if (interact) asset.interact = interact
}

export function migrate(data: unknown): { layout: FloorLayoutData; legacyAssets: AssetDef[] } {
	if (!data || typeof data !== 'object') return { layout: JSON.parse(JSON.stringify(buildSavedLayout())), legacyAssets: [] }
	const d = data as Record<string, unknown>
	const canvas = d.canvas
	const validCanvas = canvas && typeof canvas === 'object'
		&& typeof (canvas as Record<string, unknown>).tileSize === 'number'
		&& isFinite((canvas as Record<string, unknown>).tileSize as number)
		&& (canvas as Record<string, unknown>).tileSize as number > 0
	const legacyAssets = Array.isArray(d.customAssets)
		? d.customAssets.filter(
			(a: unknown): a is Record<string, unknown> => {
				const rec = a as Record<string, unknown>
				return typeof rec?.id === 'string' && typeof rec?.name === 'string'
					&& typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
					&& typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
			}
		).map((a) => {
			const base: AssetBase = {
				id: a.id as string,
				name: a.name as string,
				category: typeof a.category === 'string' ? a.category : undefined,
				w: a.w as number,
				h: a.h as number,
			}
			const assetTags = readTags(a.tags)
			if (assetTags) base.tags = assetTags
			if (typeof a.defaultPadding === 'number' && a.defaultPadding > 0) base.defaultPadding = a.defaultPadding
			if (typeof a.defaultBgColor === 'string' && a.defaultBgColor && isValidColor(a.defaultBgColor)) base.defaultBgColor = a.defaultBgColor
			if (typeof a.defaultLabelColor === 'string' && a.defaultLabelColor && isValidColor(a.defaultLabelColor)) base.defaultLabelColor = a.defaultLabelColor
			if (typeof a.defaultLabel === 'string') base.defaultLabel = a.defaultLabel
			if (typeof a.defaultRadius === 'number' && a.defaultRadius > 0) base.defaultRadius = a.defaultRadius
			if (typeof a.defaultLabelPadding === 'number') base.defaultLabelPadding = a.defaultLabelPadding
			if (typeof a.defaultInstanceLabel === 'string') base.defaultInstanceLabel = a.defaultInstanceLabel
			if (typeof a.defaultLocked === 'boolean') base.defaultLocked = a.defaultLocked
			if (a.defaultRx && typeof a.defaultRx === 'object') {
				const rx = a.defaultRx as Record<string, unknown>
				if (typeof rx.tl === 'number' && typeof rx.tr === 'number' && typeof rx.br === 'number' && typeof rx.bl === 'number') {
					base.defaultRx = { tl: rx.tl, tr: rx.tr, br: rx.br, bl: rx.bl }
				}
			}
			const hasLinkedParts = Array.isArray(a.linkedParts) && a.linkedParts.length > 0
			const hasSvg = typeof a.svg === 'string' && a.svg && (a.special === true || (a.svgViewBox && typeof (a.svgViewBox as Record<string, unknown>).w === 'number'))
			let asset: AssetDef
			if (hasLinkedParts) {
				const linkedParts: LinkedPart[] = (a.linkedParts as Record<string, unknown>[])
					.filter((p: unknown): p is Record<string, unknown> => {
						const rec = p as Record<string, unknown>
						return typeof rec?.type === 'string' && typeof rec?.dx === 'number' && typeof rec?.dy === 'number'
							&& typeof rec?.w === 'number' && typeof rec?.h === 'number'
					})
					.map((p) => {
						const part: LinkedPart = {
							type: p.type as string,
							dx: p.dx as number,
							dy: p.dy as number,
							w: p.w as number,
							h: p.h as number,
						}
						if (typeof p.rotation === 'number' && [0, 90, 180, 270].includes(p.rotation)) {
							part.rotation = p.rotation as Rotation
						}
						return part
					})
				asset = { origin: 'linked', ...base, linkedParts }
			} else if (hasSvg) {
				const svg = a.svg as string
				let svgViewBox = { w: 50, h: 25 }
				if (a.svgViewBox && typeof a.svgViewBox === 'object') {
					const vb = a.svgViewBox as Record<string, unknown>
					if (typeof vb.w === 'number' && typeof vb.h === 'number' && vb.w > 0 && vb.h > 0) {
						svgViewBox = { w: vb.w, h: vb.h }
					}
				}
				asset = { origin: 'svg-import', ...base, svg, svgViewBox }
			} else {
				const simple: AssetDef = { origin: 'drawn', ...base }
				if (typeof a.usePx === 'boolean') simple.usePx = a.usePx
				if (typeof a.pxW === 'number' && a.pxW > 0) simple.pxW = Math.floor(a.pxW)
				if (typeof a.pxH === 'number' && a.pxH > 0) simple.pxH = Math.floor(a.pxH)
				asset = simple
			}
			applyAssetDefFields(asset, a)
			return asset
		}).filter(isAssetDef)
		: []

	const migrated: FloorLayoutData = {
		version: LAYOUT_VERSION,
		canvas: validCanvas
			? (() => {
				const c = canvas as Record<string, unknown>
				const bgColor = typeof c.bgColor === 'string' && isValidColor(c.bgColor) ? c.bgColor : undefined
				return {
					width: typeof c.width === 'number' && isFinite(c.width as number) ? c.width as number : EDITOR_CONFIG.defaultCanvas.width,
					height: typeof c.height === 'number' && isFinite(c.height as number) ? c.height as number : EDITOR_CONFIG.defaultCanvas.height,
					tileSize: c.tileSize as number,
					...(bgColor ? { bgColor } : {}),
				}
			})()
			: { ...EDITOR_CONFIG.defaultCanvas },
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


						if (typeof o.rx === 'object' && o.rx !== null) base.rx = o.rx as ObjectData['rx']
						return base
					}) : [],
					defaultWalkable: typeof fRec.defaultWalkable === 'boolean' ? fRec.defaultWalkable : true,
					walkable: normalizeFloorWalkable(fRec.walkable ?? fRec.navigation),
					spawnZones: normalizeNpcSpawnZones(fRec.spawnZones),
					allowedRoleIds: normalizeAllowedRoleIds(fRec.allowedRoleIds),
				}
			})
			: [],
		npcConfig: migrateNpcConfig(d.npcConfig),
	}
	if (typeof d.streetFloorId === 'string' && migrated.floors.some(f => f.id === d.streetFloorId)) {
		migrated.streetFloorId = d.streetFloorId
	}
	if (typeof d.streetWidthTiles === 'number' && Number.isInteger(d.streetWidthTiles) && d.streetWidthTiles >= 5 && d.streetWidthTiles <= 20) {
		migrated.streetWidthTiles = d.streetWidthTiles
	}
	const oldInstanceLabels = migrated.instanceLabels ?? {}
	for (const floor of migrated.floors) {
		for (const obj of floor.objects) {
			if (obj.subId) {
				if (oldInstanceLabels[obj.subId]) obj.instanceLabel = oldInstanceLabels[obj.subId]
			}
		}
	}
	delete migrated.instanceLabels

	const migratedAssetMap = buildAssetMap([...originAssets, ...legacyAssets])
	const t = migrated.canvas.tileSize
	for (const asset of legacyAssets) {
		if (asset.linkedParts) {
			for (const p of asset.linkedParts) {
				p.dx = snap(Math.round(p.dx), t)
				p.dy = snap(Math.round(p.dy), t)
				p.w = snap(Math.round(p.w), t)
				p.h = snap(Math.round(p.h), t)
			}
		}
	}
	for (const floor of migrated.floors) {
		const beforeCount = floor.objects.length
		floor.objects = floor.objects.filter(o => findAssetCached(migratedAssetMap, o.type))
		const removedCount = beforeCount - floor.objects.length
		if (removedCount > 0) {
			editorLog.warn('Migration', `removed ${removedCount} object(s) with unknown asset types from floor "${floor.label}"`)
		}

		const validIds = new Set(floor.objects.map(o => o.id))
		const adjacency = new Map<string, Set<string>>()
		for (const obj of floor.objects) {
			const lo = obj as ObjectData & { linkedIds?: string[] }
			const linked = (lo.linkedIds ?? []).filter((id: string) => validIds.has(id) && id !== obj.id)
			adjacency.set(obj.id, new Set(linked))
			if (linked.length === 0) delete lo.linkedIds
			else lo.linkedIds = linked
			normalizeObject(obj, migrated.canvas.tileSize, migratedAssetMap)
		}

		const visited = new Set<string>()
		for (const obj of floor.objects) {
			if (visited.has(obj.id)) continue
			const members: string[] = []
			const queue = [obj.id]
			visited.add(obj.id)
			while (queue.length > 0) {
				const id = queue.shift()!
				members.push(id)
				for (const linkedId of adjacency.get(id) ?? []) {
					if (!visited.has(linkedId)) {
						visited.add(linkedId)
						queue.push(linkedId)
					}
				}
			}
			const existingGroup = members
				.map(id => floor.objects.find(candidate => candidate.id === id)?.linkGroupId)
				.find((id): id is string => !!id)
			if (members.length > 1 || existingGroup) {
				const groupId = existingGroup ?? genId('link')
				for (const id of members) {
					const member = floor.objects.find(candidate => candidate.id === id)
					if (member) {
						member.linkGroupId = groupId
						delete (member as ObjectData & { linkedIds?: string[] }).linkedIds
					}
				}
			}
		}
		recalcCollapsed(floor, migratedAssetMap)
	}
	const integrityIssues = validateLayoutIntegrity(migrated)
	if (integrityIssues.length > 0) {
		editorLog.warn('Migration', `layout integrity issues: ${integrityIssues.join('; ')}`)
	}
	if (!validateLayoutData(migrated as unknown)) {
		editorLog.error('Migration', 'Migrated layout failed schema validation, falling back to default')
		return { layout: JSON.parse(JSON.stringify(buildSavedLayout())), legacyAssets: [] }
	}

	const portalCheck = validatePortalConfiguration(migrated, migratedAssetMap, migrated.npcConfig)
	for (const err of portalCheck.errors) editorLog.error('Portal', err)
	for (const warn of portalCheck.warnings) editorLog.warn('Portal', warn)
	return { layout: migrated, legacyAssets }
}

export function loadInitial(): { layout: FloorLayoutData; legacyAssets: AssetDef[] } {
	const hmrData = import.meta.hot?.data?._editorLayout as string | undefined
	if (hmrData) {
		try { return migrate(JSON.parse(hmrData)) } catch { }
	}
	return migrate(JSON.parse(JSON.stringify(buildSavedLayout())))
}


