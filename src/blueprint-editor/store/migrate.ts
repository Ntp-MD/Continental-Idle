import type { FloorLayoutData, RoomData, ObjectData, AssetBase, AssetDef, LinkedPart, Rotation, RoomTemplate, RoomTemplateObject, NpcSimulationConfig, NpcRole, NpcTask, NpcDeploymentPool } from '../types'
import { isAssetDef, validateLayoutData, validateLayoutIntegrity, isNpcConfig, normalizeAnchorPoints, normalizeInteractConfig, normalizeTileEdges, normalizeWalkableGrid, normalizeTileStates, normalizeAllowedRoleIds } from '../types'
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

function isRoomType(value: unknown): value is 'room' | 'hallway' | 'wall' | 'elevator' {
	return typeof value === 'string' && ['room', 'hallway', 'wall', 'elevator'].includes(value)
}

function isRoomTemplateObject(value: unknown): value is RoomTemplateObject {
	if (!value || typeof value !== 'object') return false
	const o = value as Record<string, unknown>
	if (typeof o.type !== 'string' || !o.type.trim()) return false
	if (typeof o.dx !== 'number' || !isFinite(o.dx)) return false
	if (typeof o.dy !== 'number' || !isFinite(o.dy)) return false
	if (o.w !== undefined && (typeof o.w !== 'number' || !isFinite(o.w) || o.w <= 0)) return false
	if (o.h !== undefined && (typeof o.h !== 'number' || !isFinite(o.h) || o.h <= 0)) return false
	if ((o.w === undefined) !== (o.h === undefined)) return false
	if (![0, 90, 180, 270].includes(o.rotation as number)) return false
	if (o.padding !== undefined && (typeof o.padding !== 'number' || o.padding <= 0)) return false
	if (o.radius !== undefined && (typeof o.radius !== 'number' || !isFinite(o.radius))) return false
	if (o.fillColor !== undefined && typeof o.fillColor !== 'string') return false
	if (o.label !== undefined && typeof o.label !== 'string') return false
	if (o.instanceLabel !== undefined && typeof o.instanceLabel !== 'string') return false
	if (o.linkGroupId !== undefined && typeof o.linkGroupId !== 'string') return false
	if (o.rx !== undefined) {
		const r = o.rx as Record<string, unknown>
		if (typeof r.tl !== 'number' || typeof r.tr !== 'number' || typeof r.br !== 'number' || typeof r.bl !== 'number') return false
	}
	if (o.customProps !== undefined && (typeof o.customProps !== 'object' || o.customProps === null)) return false
	return true
}

function isRoomTemplate(value: unknown): value is RoomTemplate {
	if (!value || typeof value !== 'object') return false
	const t = value as Record<string, unknown>
	if (typeof t.id !== 'string' || !t.id.trim()) return false
	if (typeof t.name !== 'string' || !t.name.trim()) return false
	if (t.category !== undefined && (typeof t.category !== 'string' || !t.category.trim())) return false
	if (typeof t.label !== 'string') return false
	if (typeof t.w !== 'number' || !isFinite(t.w) || t.w <= 0) return false
	if (typeof t.h !== 'number' || !isFinite(t.h) || t.h <= 0) return false
	if (t.roomType !== undefined && !isRoomType(t.roomType)) return false
	if (t.radius !== undefined && (typeof t.radius !== 'number' || !isFinite(t.radius))) return false
	if (t.fillColor !== undefined && typeof t.fillColor !== 'string') return false
	if (t.padding !== undefined && (typeof t.padding !== 'number' || t.padding <= 0)) return false
	if (t.tags !== undefined && (!Array.isArray(t.tags) || t.tags.some(tag => typeof tag !== 'string'))) return false
	if (t.rx !== undefined) {
		const r = t.rx as Record<string, unknown>
		if (typeof r.tl !== 'number' || typeof r.tr !== 'number' || typeof r.br !== 'number' || typeof r.bl !== 'number') return false
	}
	if (t.objects !== undefined && (!Array.isArray(t.objects) || !t.objects.every(isRoomTemplateObject))) return false
	return true
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
	const anchors = normalizeAnchorPoints(a.anchorPoints)
	if (anchors) asset.anchorPoints = anchors
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
			if (typeof a.defaultBgColor === 'string' && a.defaultBgColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a.defaultBgColor)) base.defaultBgColor = a.defaultBgColor
			if (typeof a.defaultLabelColor === 'string' && a.defaultLabelColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a.defaultLabelColor)) base.defaultLabelColor = a.defaultLabelColor
			if (typeof a.defaultLabel === 'string') base.defaultLabel = a.defaultLabel
			if (typeof a.defaultRadius === 'number' && a.defaultRadius > 0) base.defaultRadius = a.defaultRadius
			if (typeof a.defaultLabelPadding === 'number') base.defaultLabelPadding = a.defaultLabelPadding
			if (a.defaultCustomProps && typeof a.defaultCustomProps === 'object') base.defaultCustomProps = a.defaultCustomProps as AssetBase['defaultCustomProps']
			if (typeof a.defaultInstanceLabel === 'string') base.defaultInstanceLabel = a.defaultInstanceLabel
			if (a.defaultValidationRule && typeof a.defaultValidationRule === 'object') base.defaultValidationRule = a.defaultValidationRule as AssetBase['defaultValidationRule']
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
			? {
				width: typeof (canvas as Record<string, unknown>).width === 'number' && isFinite((canvas as Record<string, unknown>).width as number) ? (canvas as Record<string, unknown>).width as number : EDITOR_CONFIG.defaultCanvas.width,
				height: typeof (canvas as Record<string, unknown>).height === 'number' && isFinite((canvas as Record<string, unknown>).height as number) ? (canvas as Record<string, unknown>).height as number : EDITOR_CONFIG.defaultCanvas.height,
				tileSize: (canvas as Record<string, unknown>).tileSize as number,
			}
			: { ...EDITOR_CONFIG.defaultCanvas },
		floors: Array.isArray(d.floors) && d.floors.length > 0
			? d.floors.map((f: unknown) => {
				const fRec = (f ?? {}) as Record<string, unknown>
				return {
					id: typeof fRec.id === 'string' ? fRec.id : genId('floor'),
					name: typeof fRec.name === 'string' ? fRec.name : 'Unnamed',
					label: typeof fRec.label === 'string' ? fRec.label : 'F?',
					labelColor: typeof fRec.labelColor === 'string' ? fRec.labelColor : undefined,
					rooms: Array.isArray(fRec.rooms) ? fRec.rooms.filter(
						(r: unknown): r is Record<string, unknown> => {
							const rec = r as Record<string, unknown>
							return typeof rec?.x === 'number' && isFinite(rec.x as number)
								&& typeof rec?.y === 'number' && isFinite(rec.y as number)
								&& typeof rec?.w === 'number' && isFinite(rec.w as number) && rec.w > 0
								&& typeof rec?.h === 'number' && isFinite(rec.h as number) && rec.h > 0
						}
					).map((r) => ({
						id: typeof r.id === 'string' ? r.id : genId('room'),
						x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number,
						label: typeof r.label === 'string' ? r.label : 'Room',
						category: typeof r.category === 'string' ? r.category : undefined,
						roomType: typeof r.roomType === 'string' ? r.roomType as RoomData['roomType'] : 'room',
						walkable: typeof r.walkable === 'boolean' ? r.walkable : true,
						entrances: Array.isArray(r.entrances) ? r.entrances.filter((e): e is { side: 'top' | 'bottom' | 'left' | 'right'; offset: number; width: number } => {
							const entry = e as Record<string, unknown>
							return ['top', 'bottom', 'left', 'right'].includes(entry.side as string)
								&& typeof entry.offset === 'number' && typeof entry.width === 'number' && entry.width > 0
						}) : undefined,
						anchorPoints: normalizeAnchorPoints(r.anchorPoints),
						interact: normalizeInteractConfig(r.interact),
						radius: typeof r.radius === 'number' && r.radius > 0 ? r.radius : undefined,
						fillColor: typeof r.fillColor === 'string' ? r.fillColor : undefined,
						rx: typeof r.rx === 'object' && r.rx !== null ? r.rx : undefined,
						padding: typeof r.padding === 'number' && r.padding > 0 ? r.padding : undefined,
						tags: readTags(r.tags),
						locked: typeof r.locked === 'boolean' ? r.locked : undefined,
					} as RoomData)) : [],
					objects: Array.isArray(fRec.objects) ? fRec.objects.filter(
						(o: unknown): o is Record<string, unknown> => {
							const rec = o as Record<string, unknown>
							return typeof rec?.id === 'string' && typeof rec?.type === 'string'
								&& typeof rec?.x === 'number' && isFinite(rec.x as number)
								&& typeof rec?.y === 'number' && isFinite(rec.y as number)
						}
					).map((o) => {
						const base: ObjectData = {
							id: o.id as string,
							type: o.type as string,
							x: o.x as number, y: o.y as number,
							w: typeof o.w === 'number' ? o.w : 0,
							h: typeof o.h === 'number' ? o.h : 0,
							rotation: typeof o.rotation === 'number' && [0, 90, 180, 270].includes(o.rotation) ? (o.rotation as Rotation) : 0,
						}
						if (typeof o.subId === 'string') base.subId = o.subId
						if (typeof o.radius === 'number' && o.radius > 0) base.radius = o.radius
						if (typeof o.label === 'string') base.label = o.label
						if (typeof o.padding === 'number' && o.padding > 0) base.padding = o.padding
						if (typeof o.labelPadding === 'number' && o.labelPadding > 0) base.labelPadding = o.labelPadding
						if (typeof o.fillColor === 'string') base.fillColor = o.fillColor
						if (typeof o.locked === 'boolean') base.locked = o.locked
						if (typeof o.collapsed === 'boolean') base.collapsed = o.collapsed
						if (typeof o.linkGroupId === 'string' && o.linkGroupId) base.linkGroupId = o.linkGroupId
						if (typeof o.isWall === 'boolean') base.isWall = o.isWall


						const objectTags = readTags(o.customProps && typeof o.customProps === 'object' ? (o.customProps as Record<string, unknown>).tags : undefined)
						if (objectTags) base.customProps = { ...(o.customProps as ObjectData['customProps']), tags: objectTags }
						if (typeof o.roomId === 'string') base.roomId = o.roomId
						if (typeof o.rx === 'object' && o.rx !== null) base.rx = o.rx as ObjectData['rx']
						return base
					}) : [],
					defaultWalkable: typeof fRec.defaultWalkable === 'boolean' ? fRec.defaultWalkable : true,
					allowedRoleIds: normalizeAllowedRoleIds(fRec.allowedRoleIds),
				}
			})
			: [],
		roomTemplates: Array.isArray((d as Record<string, unknown>).roomTemplates)
			? ((d as Record<string, unknown>).roomTemplates as unknown[]).filter(isRoomTemplate)
			: [],
		npcConfig: migrateNpcConfig(d.npcConfig),
	}
	const oldCustomProps = migrated.objectCustomProps ?? {}
	const oldInstanceLabels = migrated.instanceLabels ?? {}
	const oldValidationRules = migrated.validationRules ?? {}
	for (const floor of migrated.floors) {
		for (const obj of floor.objects) {
			if (obj.subId) {
				if (oldCustomProps[obj.subId]) obj.customProps = oldCustomProps[obj.subId]
				if (oldInstanceLabels[obj.subId]) obj.instanceLabel = oldInstanceLabels[obj.subId]
				if (oldValidationRules[obj.subId]) obj.validationRule = oldValidationRules[obj.subId]
			}
			const customTags = readTags(obj.customProps?.tags)
			if (customTags) obj.customProps = { ...obj.customProps, tags: customTags }
		}
	}
	delete migrated.objectCustomProps
	delete migrated.instanceLabels
	delete migrated.validationRules

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

		for (const room of floor.rooms) {
			if (!room.roomType) {
				room.roomType = room.locked ? 'wall' : 'room'
			}
			if (room.walkable === undefined) {
				room.walkable = room.roomType !== 'wall'
			}
		}

		const validIds = new Set(floor.objects.map(o => o.id))
		const roomIds = new Set(floor.rooms.map(room => room.id))
		const adjacency = new Map<string, Set<string>>()
		for (const obj of floor.objects) {
			if (obj.roomId && !roomIds.has(obj.roomId)) delete obj.roomId

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


