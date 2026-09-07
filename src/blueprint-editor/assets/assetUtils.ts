import { isValidColor } from '../domain/types'
import { assetPixelSize, CANVAS_WALL_OBJECT_TYPE, resolveInteractSpotAnchor, resolveStreetTiles, resolveWallSegmentsForObject, spawnZoneAllowsRole } from '../domain/types'
import type { Rect, WallSegment, DoorMode, CanvasConfig, NpcSpawnZone } from '../domain/types'
import type { AssetDef, FloorData, FloorLayoutData, NpcSimulationConfig, ObjectPlacement, SvgRole, SvgRoleInfo, WalkableGrid, TileState } from '../domain/types'

export function findAsset(assets: readonly AssetDef[], type: string): AssetDef | undefined {
	return assets.find(a => a.id === type)
}

export function findAssetCached(assetMap: Map<string, AssetDef>, type: string): AssetDef | undefined {
	return assetMap.get(type)
}

export function buildAssetMap(assets: readonly AssetDef[]): Map<string, AssetDef> {
	return new Map<string, AssetDef>(
		assets.map(a => [a.id, a])
	)
}

export function svgColorVarStyle(fill: string | undefined, stroke: string | undefined): string {
	const resolvedStroke = stroke || (fill ? `color-mix(in srgb, ${fill} 55%, black)` : undefined)
	let vars = ''
	if (fill) vars += `--obj-fill:${fill};`
	if (resolvedStroke) vars += `--obj-stroke:${resolvedStroke};`
	return vars
}

export function assetSvgVarStyle(asset: AssetDef | undefined): string {
	return asset ? svgColorVarStyle(asset.defaultFillColor, asset.defaultStrokeColor) : ''
}

export { assetPixelSize }

export function assetPreviewViewBox(asset: AssetDef, tileSize: number): string {
	const vb = asset.svgViewBox
	if (!vb || vb.w === 0 || vb.h === 0) {
		const { w, h } = assetPixelSize(asset, tileSize)
		return `0 0 ${w} ${h}`
	}
	return `0 0 ${vb.w} ${vb.h}`
}

export function assetFallbackShapeSvg(asset: AssetDef, tileSize: number): string {
	const { w, h } = assetPixelSize(asset, tileSize)
	const rx = Math.max(asset.defaultRx?.tl ?? 0, asset.defaultRx?.tr ?? 0, asset.defaultRx?.br ?? 0, asset.defaultRx?.bl ?? 0)
	const rawFill = asset.defaultFillColor ?? 'none'
	const fill = !rawFill || rawFill === 'transparent' ? 'none' : rawFill
	const stroke = asset.defaultStrokeColor ?? '#6f7680'
	return `<rect x="1" y="1" width="${Math.max(1, w - 2)}" height="${Math.max(1, h - 2)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`
}

export interface DoorPanel {
	key: string
	cx: number
	cy: number
	length: number
	thickness: number
	horizontal: boolean
	slideDir: -1 | 1
	ownerObjectId?: string
	mode?: DoorMode
}

export function resolveDoorMode(explicitMode: DoorMode | undefined, ownerHasSpots: boolean): DoorMode {
	if (explicitMode !== undefined) return explicitMode
	return ownerHasSpots ? 'auto-close' : 'hold-open'
}

export function withSegmentDoorMode(
	segments: readonly WallSegment[],
	index: number,
	mode: DoorMode | undefined,
): WallSegment[] {
	return segments.map((segment, i) => {
		if (i !== index) return { ...segment }
		if (mode !== undefined) return { ...segment, doorMode: mode }
		const next = { ...segment }
		delete next.doorMode
		return next
	})
}

export function doorPanelsData(
	segments: readonly WallSegment[],
	tileSize: number,
	thickness: number,
): DoorPanel[] {
	const t = Math.max(1, thickness)
	return segments
		.filter(s => s.door)
		.map(s => {
			const x1 = s.x1 * tileSize
			const y1 = s.y1 * tileSize
			const x2 = s.x2 * tileSize
			const y2 = s.y2 * tileSize
			const horizontal = y1 === y2
			const length = Math.max(t * 2, Math.abs(horizontal ? x2 - x1 : y2 - y1))
			return {
				key: `${x1},${y1},${x2},${y2}`,
				cx: (x1 + x2) / 2,
				cy: (y1 + y2) / 2,
				length,
				thickness: t,
				horizontal,
				slideDir: 1 as const,
			}
		})
}

export function doorSlideDir(panel: DoorPanel, blockers: readonly Rect[], ownWalls: readonly Rect[] = []): -1 | 1 {
	const halfT = panel.thickness / 2
	const eps = 0.5
	function zoneHits(rects: readonly Rect[], dir: -1 | 1): boolean {
		const zx1 = panel.horizontal ? (dir > 0 ? panel.cx + panel.length / 2 : panel.cx - panel.length * 1.5) : panel.cx - halfT
		const zx2 = panel.horizontal ? (dir > 0 ? panel.cx + panel.length * 1.5 : panel.cx - panel.length / 2) : panel.cx + halfT
		const zy1 = panel.horizontal ? panel.cy - halfT : (dir > 0 ? panel.cy + panel.length / 2 : panel.cy - panel.length * 1.5)
		const zy2 = panel.horizontal ? panel.cy + halfT : (dir > 0 ? panel.cy + panel.length * 1.5 : panel.cy - panel.length / 2)
		return rects.some(b => b.x < zx2 - eps && b.x + b.w > zx1 + eps && b.y < zy2 - eps && b.y + b.h > zy1 + eps)
	}
	const ownPlus = ownWalls.length > 0 && zoneHits(ownWalls, 1)
	const ownMinus = ownWalls.length > 0 && zoneHits(ownWalls, -1)
	if (ownPlus && !ownMinus) return zoneHits(blockers, 1) ? -1 : 1
	if (ownMinus && !ownPlus) return zoneHits(blockers, -1) ? 1 : -1
	if (ownPlus && ownMinus) return zoneHits(blockers, 1) ? -1 : 1
	return !zoneHits(blockers, 1) ? 1 : zoneHits(blockers, -1) ? 1 : -1
}

export function doorPanelsSvg(
	segments: readonly WallSegment[],
	tileSize: number,
	thickness: number,
	color: string,
	progress = 0,
): string {
	const panels = doorPanelsData(segments, tileSize, thickness)
	if (!panels.length) return ''
	const parts: string[] = []
	for (const p of panels) {
		const off = p.length * progress * p.slideDir
		const halfT = p.thickness / 2
		if (p.horizontal) {
			parts.push(`<rect x="${(p.cx - p.length / 2 + off).toFixed(2)}" y="${(p.cy - halfT).toFixed(2)}" width="${p.length.toFixed(2)}" height="${p.thickness}" fill="${color}" rx="1"/>`)
		} else {
			parts.push(`<rect x="${(p.cx - halfT).toFixed(2)}" y="${(p.cy - p.length / 2 + off).toFixed(2)}" width="${p.thickness}" height="${p.length.toFixed(2)}" fill="${color}" rx="1"/>`)
		}
	}
	return `<g class="door-overlay">${parts.join('')}</g>`
}

export function wallSegmentsOverlaySvg(asset: AssetDef, tileSize: number, color: string, thickness: number, doorColor: string): string {
	const segments = asset.wallSegments
	if (!segments?.length || asset.w <= 0 || asset.h <= 0) return ''
	const { w: sourceW, h: sourceH } = assetPixelSize(asset, tileSize)
	if (sourceW <= 0 || sourceH <= 0) return ''
	const scaleX = sourceW / asset.w
	const scaleY = sourceH / asset.h
	const sw = Math.max(0.5, thickness)
	const wallParts: string[] = []
	const doorSegs: WallSegment[] = []
	for (const seg of segments) {
		if (seg.door) { doorSegs.push(seg); continue }
		const x1 = seg.x1 * scaleX
		const y1 = seg.y1 * scaleY
		const x2 = seg.x2 * scaleX
		const y2 = seg.y2 * scaleY
		wallParts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`)
	}
	const scaledDoorSegs = doorSegs.map(s => ({
		x1: s.x1 * scaleX,
		y1: s.y1 * scaleY,
		x2: s.x2 * scaleX,
		y2: s.y2 * scaleY,
		door: true as const,
		...(s.doorMode !== undefined ? { doorMode: s.doorMode } : {}),
	}))
	const doorSvg = doorPanelsSvg(scaledDoorSegs, 1, sw, doorColor, 0)
	return `<g class="wall-overlay">${wallParts.join('')}${doorSvg}</g>`
}

export function assetPreviewSvg(asset: AssetDef, tileSize: number, wallColor: string, wallThickness: number, doorColor: string): string {
	const base = asset.svg?.replace(/var\(--border-dim\)/g, '#fff') ?? assetFallbackShapeSvg(asset, tileSize)
	return base + wallSegmentsOverlaySvg(asset, tileSize, wallColor, wallThickness, doorColor)
}

export function wallSegmentToObjectRect(segment: WallSegment, tileSize: number): { x: number; y: number; w: number; h: number } {
	const x = Math.min(segment.x1, segment.x2) * tileSize
	const y = Math.min(segment.y1, segment.y2) * tileSize
	const w = Math.max(1, Math.abs(segment.x2 - segment.x1) * tileSize)
	const h = Math.max(1, Math.abs(segment.y2 - segment.y1) * tileSize)
	return { x, y, w, h }
}

export function parseSvgViewBox(svg: string): { w: number; h: number } | null {
	const m = svg.match(/viewBox\s*=\s*["']([^"']+)["']/)
	if (!m) return null
	const parts = m[1].split(/[\s,]+/).map(Number)
	if (parts.length !== 4 || parts.some(value => !Number.isFinite(value))) return null
	const vbW = parts[2]
	const vbH = parts[3]
	if (vbW <= 0 || vbH <= 0 || vbW > 1_000_000 || vbH > 1_000_000) return null
	return { w: vbW, h: vbH }
}

export const ASSET_ORIGIN_LABELS: Record<string, string> = {
	drawn: 'Drawn',
	'svg-import': 'SVG',
	flattened: 'Flattened',
}

export function assetIsSvg(asset: AssetDef | undefined | null): boolean {
	return !!asset?.svg
}

export function assetSizeLabel(asset: AssetDef): string {
	if (asset.pxW || asset.pxH) return `${asset.pxW ?? asset.w}x${asset.pxH ?? asset.h}px`
	return `${asset.w}x${asset.h}`
}

export function assetOriginLabel(asset: AssetDef): string {
	return ASSET_ORIGIN_LABELS[asset.origin ?? 'drawn'] ?? asset.origin ?? 'Drawn'
}

export function assetSettingsIssuesMap(assets: readonly AssetDef[]): Map<string, string[]> {
	const map = new Map<string, string[]>()
	for (const asset of assets) {
		const issues = assetSettingsIssues(asset)
		if (issues.length > 0) map.set(asset.id, issues)
	}
	return map
}

export function assetIncompleteTitle(issues: Map<string, string[]>, assetId: string): string {
	const list = issues.get(assetId)
	return list?.length ? `Incomplete settings: ${list.join(', ')}` : ''
}

export function placedObjectCounts(floors: readonly FloorData[]): Map<string, number> {
	const counts = new Map<string, number>()
	for (const floor of floors) {
		for (const object of floor.objects) {
			counts.set(object.type, (counts.get(object.type) ?? 0) + 1)
		}
	}
	return counts
}

export function placedCountTitle(count: number): string {
	return `${count} placed object${count === 1 ? '' : 's'}`
}

const VALID_ROLES = new Set<SvgRole>(['wall', 'door', 'fixture'])

export function parseSvgRoles(svg: string): SvgRoleInfo[] {
	if (!svg) return []
	try {
		const parser = new DOMParser()
		const doc = parser.parseFromString(svg, 'image/svg+xml')
		const result: SvgRoleInfo[] = []
		const all = doc.querySelectorAll('*')
		for (const el of Array.from(all)) {
			const role = el.getAttribute('data-role')
			if (!role) continue
			if (!VALID_ROLES.has(role as SvgRole)) continue
			const info: SvgRoleInfo = {
				role: role as SvgRole,
				tag: el.tagName.toLowerCase(),
			}
			const attrs: Record<string, string> = {}
			for (const attr of Array.from(el.attributes)) {
				if (attr.name !== 'data-role') attrs[attr.name] = attr.value
			}
			if (Object.keys(attrs).length > 0) info.attrs = attrs
			result.push(info)
		}
		return result
	} catch {
		return []
	}
}

export function buildWalkableGrid(
	w: number,
	h: number,
	roles?: SvgRoleInfo[],
	tileStates?: TileState[][],
): { walkableGrid: WalkableGrid; tileStates: TileState[][] } {
	const rows = Math.max(1, Math.round(h))
	const cols = Math.max(1, Math.round(w))
	if (tileStates && tileStates.length === rows && tileStates[0]?.length === cols) {
		const grid: WalkableGrid = tileStates.map(row => row.map(t => t === 'walkable' || t === 'door'))
		return { walkableGrid: grid, tileStates }
	}
	const hasWall = roles?.some(r => r.role === 'wall') ?? false
	const hasFixture = roles?.some(r => r.role === 'fixture') ?? false
	const defaultState: TileState = (hasWall || hasFixture) ? 'blocked' : 'walkable'
	const states: TileState[][] = []
	const grid: WalkableGrid = []
	for (let r = 0; r < rows; r++) {
		states[r] = []
		grid[r] = []
		for (let c = 0; c < cols; c++) {
			states[r][c] = defaultState
			grid[r][c] = defaultState === 'walkable'
		}
	}
	return { walkableGrid: grid, tileStates: states }
}


export function serializeObject(obj: ObjectPlacement): ObjectPlacement {
	const out: ObjectPlacement = {
		id: obj.id,
		type: obj.type,
		x: obj.x,
		y: obj.y,
		rotation: obj.rotation,
	}
	if (obj.linkGroupId) out.linkGroupId = obj.linkGroupId

	if (obj.locked !== undefined) out.locked = obj.locked
	if (obj.isWall !== undefined) out.isWall = obj.isWall
	if (obj.door === true && obj.isWall && obj.type === CANVAS_WALL_OBJECT_TYPE) out.door = true
	if (obj.doorMode !== undefined && out.door === true) out.doorMode = obj.doorMode
	for (const key of ['x1', 'y1', 'x2', 'y2'] as const) {
		const value = obj[key]
		if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
	}
	if (obj.fillColor && isValidColor(obj.fillColor)) out.fillColor = obj.fillColor
	if (obj.strokeColor && isValidColor(obj.strokeColor)) out.strokeColor = obj.strokeColor
	return out
}

export const ASSET_DEF_FIELD_COVERAGE: Record<keyof AssetDef, true> = {
	id: true,
	name: true,
	category: true,
	w: true,
	h: true,
	custom: true,
	isWall: true,
	wallSegments: true,
	walkable: true,
	doorRequired: true,
	defaultPadding: true,
	defaultRx: true,
	defaultFillColor: true,
	defaultStrokeColor: true,
	defaultLabel: true,
	defaultRadius: true,
	defaultLabelPadding: true,
	defaultLocked: true,
	tags: true,
	origin: true,
	pxW: true,
	pxH: true,
	usePx: true,
	svg: true,
	svgViewBox: true,
	svgRoles: true,
	walkableGrid: true,
	tileStates: true,
	interactSpots: true,
	interact: true,
	queue: true,
}

export function serializeAsset(asset: AssetDef): AssetDef {
	const out: AssetDef = {
		id: asset.id,
		name: asset.name,
		w: asset.w,
		h: asset.h,
	}
	if (asset.origin) out.origin = asset.origin
	if (asset.category) out.category = asset.category
	if (asset.custom) out.custom = asset.custom
	if (asset.isWall !== undefined) out.isWall = asset.isWall
	if (asset.wallSegments?.length) out.wallSegments = asset.wallSegments.map(segment => ({ ...segment }))
	if (asset.walkable !== undefined) out.walkable = asset.walkable
	if (asset.doorRequired) out.doorRequired = asset.doorRequired
	if (asset.defaultPadding && asset.defaultPadding > 0) out.defaultPadding = asset.defaultPadding
	if (asset.defaultRx && (asset.defaultRx.tl > 0 || asset.defaultRx.tr > 0 || asset.defaultRx.br > 0 || asset.defaultRx.bl > 0)) out.defaultRx = asset.defaultRx
	if (asset.defaultFillColor) out.defaultFillColor = asset.defaultFillColor
	if (asset.defaultStrokeColor) out.defaultStrokeColor = asset.defaultStrokeColor
	if (asset.defaultLabel) out.defaultLabel = asset.defaultLabel
	if (asset.defaultRadius && asset.defaultRadius > 0) out.defaultRadius = asset.defaultRadius
	if (asset.defaultLabelPadding) out.defaultLabelPadding = asset.defaultLabelPadding
	if (asset.defaultLocked) out.defaultLocked = asset.defaultLocked
	if (asset.tags?.length) out.tags = [...asset.tags]
	if (asset.pxW !== undefined) out.pxW = asset.pxW
	if (asset.pxH !== undefined) out.pxH = asset.pxH
	if (asset.usePx) out.usePx = asset.usePx
	if (asset.svg) out.svg = asset.svg
	if (asset.svgViewBox) out.svgViewBox = { ...asset.svgViewBox }
	if (asset.svgRoles?.length) out.svgRoles = [...asset.svgRoles]
	if (asset.walkableGrid) out.walkableGrid = asset.walkableGrid.map(row => [...row])
	if (asset.tileStates) out.tileStates = asset.tileStates.map(row => [...row])
	if (asset.interactSpots?.length) out.interactSpots = asset.interactSpots.map(p => ({ ...p }))
	if (asset.interact) out.interact = { ...asset.interact }
	if (asset.queue) out.queue = { ...asset.queue }
	return out
}


export function assetSettingsIssues(asset: AssetDef): string[] {
	const issues: string[] = []
	if (!asset.walkable) {
		if (!asset.walkableGrid) issues.push('walkable grid')
		if (!asset.tileStates) issues.push('tile states')
	}
	return issues
}

export interface PortalValidationResult {
	errors: string[]
	warnings: string[]
}

export interface SettingsCompletenessResult {
	issues: string[]
}

function collectFloorAssetTags(layout: FloorLayoutData, assetMap: Map<string, AssetDef>): Set<string> {
	const tags = new Set<string>()
	for (const floor of layout.floors) {
		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			if (!asset?.tags) continue
			for (const tag of asset.tags) tags.add(tag.trim().toLowerCase())
		}
	}
	return tags
}

function floorHasSpawnZoneForRole(floor: FloorData, roleId: string): boolean {
	const zones = floor.spawnZones
	if (!zones?.length) return false
	return zones.some(zone => spawnZoneAllowsRole(zone, roleId))
}

function roleCanReachFloor(roleId: string, floor: FloorData, poolFloorIds: string[] | undefined): boolean {
	if (floor.allowedRoleIds?.length && !floor.allowedRoleIds.includes(roleId)) return false
	if (poolFloorIds?.length && !poolFloorIds.includes(floor.id)) return false
	return true
}

export function isGuestRoleId(roleId: string): boolean {
	return roleId.toLowerCase().includes('guest')
}

function zoneOverlapsStreetRing(zone: NpcSpawnZone, canvas: CanvasConfig, streetWidthTiles: number): boolean {
	const tileSize = Math.max(1, canvas.tileSize)
	const cols = Math.max(0, Math.ceil(canvas.width / tileSize))
	const rows = Math.max(0, Math.ceil(canvas.height / tileSize))
	const band = streetWidthTiles
	// Mirror the engine: no street cells exist when the ring covers the whole canvas.
	if (cols <= band * 2 || rows <= band * 2) return false
	for (let ty = 0; ty < rows; ty++) {
		const rowBand = ty < band || ty >= rows - band
		for (let tx = 0; tx < cols; tx++) {
			if (!rowBand && !(tx < band || tx >= cols - band)) continue
			// Engine spawn predicate (filterNpcSpawnTiles): a cell spawns iff its
			// center px lands inside the zone. A zone that contains no street cell
			// center can never spawn a guest, so it does NOT satisfy the convention.
			const px = (tx + 0.5) * tileSize
			const py = (ty + 0.5) * tileSize
			if (px >= zone.x && px < zone.x + zone.w && py >= zone.y && py < zone.y + zone.h) return true
		}
	}
	return false
}

export interface FloorWallSegment {
	segment: WallSegment
	ownerObjectId: string
}

export function collectFloorWallSegments(
	floor: FloorData,
	tileSize: number,
	getAssetDef?: (type: string) => AssetDef | undefined,
): FloorWallSegment[] {
	const segments: FloorWallSegment[] = []
	for (const object of floor.objects) {
		if (object.isWall && object.type === CANVAS_WALL_OBJECT_TYPE) {
			const { x1, y1, x2, y2 } = object
			if (typeof x1 !== 'number' || !Number.isFinite(x1) || typeof y1 !== 'number' || !Number.isFinite(y1) || typeof x2 !== 'number' || !Number.isFinite(x2) || typeof y2 !== 'number' || !Number.isFinite(y2)) continue
			const segment: WallSegment = { x1: x1 * tileSize, y1: y1 * tileSize, x2: x2 * tileSize, y2: y2 * tileSize }
			if (object.door) segment.door = true
			segments.push({ segment, ownerObjectId: object.id })
			continue
		}
		const asset = getAssetDef?.(object.type)
		if (!asset?.wallSegments?.length) continue
		for (const segment of resolveWallSegmentsForObject(asset.wallSegments, asset, object, tileSize)) {
			segments.push({ segment, ownerObjectId: object.id })
		}
	}
	return segments
}

export interface FloorEntrance {
	key: string
	centerX: number
	centerY: number
	ownerObjectId: string
}

export function collectFloorEntrances(
	floor: FloorData,
	canvas: CanvasConfig,
	streetWidthTiles: number,
	assetMap: Map<string, AssetDef>,
): FloorEntrance[] {
	const tileSize = canvas.tileSize
	const band = streetWidthTiles * tileSize
	const isStreetCell = (px: number, py: number): boolean =>
		px < band || py < band || px > canvas.width - band || py > canvas.height - band
	const doorSegments = collectFloorWallSegments(floor, tileSize, (type: string) => assetMap.get(type))
		.filter(entry => entry.segment.door)
	const entrances: FloorEntrance[] = []
	for (const { segment, ownerObjectId } of doorSegments) {
		const horizontal = segment.y1 === segment.y2
		if (!horizontal && segment.x1 !== segment.x2) continue
		const alongStart = Math.min(horizontal ? segment.x1 : segment.y1, horizontal ? segment.x2 : segment.y2) / tileSize
		const alongEnd = Math.max(horizontal ? segment.x1 : segment.y1, horizontal ? segment.x2 : segment.y2) / tileSize
		const firstCell = Math.ceil(alongStart - 1e-6)
		const lastCell = Math.ceil(alongEnd - 1e-6) - 1
		let nearStreet = false
		let nearInterior = false
		let farStreet = false
		let farInterior = false
		for (let cell = firstCell; cell <= lastCell; cell++) {
			const along = cell * tileSize + tileSize / 2
			const nearX = horizontal ? along : segment.x1 - tileSize / 2
			const nearY = horizontal ? segment.y1 - tileSize / 2 : along
			const farX = horizontal ? along : segment.x1 + tileSize / 2
			const farY = horizontal ? segment.y1 + tileSize / 2 : along
			if (isStreetCell(nearX, nearY)) nearStreet = true; else nearInterior = true
			if (isStreetCell(farX, farY)) farStreet = true; else farInterior = true
		}
		if ((nearStreet && farInterior) || (farStreet && nearInterior)) {
			entrances.push({
				key: `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`,
				centerX: (segment.x1 + segment.x2) / 2,
				centerY: (segment.y1 + segment.y2) / 2,
				ownerObjectId,
			})
		}
	}
	return entrances
}

export function validateSettingsCompleteness(
	layout: FloorLayoutData,
	assetMap: Map<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): SettingsCompletenessResult {
	const issues: string[] = []

	if (!npcConfig) {
		issues.push('No NPC configuration defined')
		return { issues }
	}

	if (!npcConfig.roles.length) {
		issues.push('No NPC roles defined')
		return { issues }
	}

	if (!npcConfig.pool.length) {
		issues.push('NPC pool is empty - no NPCs will spawn')
	}

	const floorAssetTags = collectFloorAssetTags(layout, assetMap)
	const roleIds = new Set(npcConfig.roles.map(role => role.id))
	const taskIdsReferenced = new Set<string>()

	for (const role of npcConfig.roles) {
		const focusTags = role.focusTags
		const hasTasks = role.taskIds.length > 0
		for (const taskId of role.taskIds) taskIdsReferenced.add(taskId)

		if (role.focusChance > 0 && focusTags.length === 0 && !hasTasks) {
			issues.push(`Role "${role.label}" has focusChance=${role.focusChance}% but no focus tags or tasks assigned`)
		}

		if (role.restrictedTags.length > 0) {
			const matching = role.restrictedTags.some(tag => floorAssetTags.has(tag.trim().toLowerCase()))
			if (!matching) {
				issues.push(`Role "${role.label}" restricts to tags [${role.restrictedTags.join(', ')}] but no asset on any floor matches`)
			}
		}

		if (role.spawnRule?.targetTags?.length) {
			const matching = role.spawnRule.targetTags.some(tag => floorAssetTags.has(tag.trim().toLowerCase()))
			if (!matching) {
				issues.push(`Role "${role.label}" spawn rule targets tags [${role.spawnRule.targetTags.join(', ')}] but no asset on any floor matches`)
			}
		}

		for (const floor of layout.floors) {
			const allowed = !floor.allowedRoleIds?.length || floor.allowedRoleIds.includes(role.id)
			if (!allowed) continue
			if (!floorHasSpawnZoneForRole(floor, role.id)) {
				issues.push(`Floor "${floor.label}" allows role "${role.label}" but has no spawn zone for it`)
			}
		}
	}

	for (const task of npcConfig.tasks) {
		if (!taskIdsReferenced.has(task.id)) {
			issues.push(`Task "${task.label}" is not assigned to any role`)
		}
		const post = task.post
		if (!post) continue
		const asset = assetMap.get(post.assetId)
		if (!asset) {
			issues.push(`Task "${task.label}" posts to unknown asset "${post.assetId}" - it behaves as a plain tag task`)
			continue
		}
		const spots = asset.interactSpots ?? []
		const matching = post.post ? spots.filter(spot => spot.post === post.post) : spots
		if (!matching.length) {
			issues.push(`Task "${task.label}" posts to "${post.post ?? 'any spot'}" but asset "${asset.name}" has no matching spot`)
			continue
		}
		if ((asset.tags ?? []).includes('portal')) {
			issues.push(`Task "${task.label}" posts to portal asset "${asset.name}" - the post index ignores portals`)
		}
		const anchors = new Map<string, string>()
		for (const spot of matching) {
			const anchor = spot.kind === 'edge'
				? resolveInteractSpotAnchor(spot, asset.svgViewBox?.w ?? 0, asset.svgViewBox?.h ?? 0)
				: { x: spot.x, y: spot.y }
			const key = `${anchor.x},${anchor.y}`
			const prev = anchors.get(key)
			if (prev !== undefined && prev !== (spot.post ?? '')) {
				issues.push(`Asset "${asset.name}" has different posts sharing one cell - "${prev || 'unnamed'}" vs "${spot.post ?? 'unnamed'}"`)
			} else {
				anchors.set(key, spot.post ?? '')
			}
		}
		const placedFloors = layout.floors.filter(floor => floor.objects.some(object => object.type === asset.id))
		if (!placedFloors.length) {
			issues.push(`Task "${task.label}" posts to asset "${asset.name}" which is not placed on any floor`)
			continue
		}
		const assetTags = new Set((asset.tags ?? []).map(tag => tag.trim().toLowerCase()))
		for (const role of npcConfig.roles.filter(candidate => candidate.taskIds.includes(task.id))) {
			const poolEntry = npcConfig.pool.find(entry => entry.roleId === role.id)
			const poolCount = poolEntry?.count ?? 0
			if (poolCount <= 0) {
				issues.push(`Task "${task.label}" posts role "${role.label}" but its pool count is 0 - nobody will man the post`)
			}
			if (role.restrictedTags.some(tag => assetTags.has(tag.trim().toLowerCase()))) {
				issues.push(`Task "${task.label}" posts role "${role.label}" to asset "${asset.name}" whose tags it restricts - the post may be unreachable`)
			}
			const reachable = placedFloors.some(floor => roleCanReachFloor(role.id, floor, poolEntry?.floorIds))
			if (!reachable) {
				issues.push(`Task "${task.label}" posts role "${role.label}" but every floor with "${asset.name}" excludes it`)
			}
		}
	}

	for (const entry of npcConfig.pool) {
		if (!roleIds.has(entry.roleId)) {
			issues.push(`Pool entry references unknown role "${entry.roleId}"`)
			continue
		}
		if (entry.count <= 0) {
			const role = npcConfig.roles.find(r => r.id === entry.roleId)
			issues.push(`Pool entry for role "${role?.label ?? entry.roleId}" has count ${entry.count} - no NPCs will spawn`)
		}
	}

	const streetFloorId = layout.streetFloorId
	if (streetFloorId) {
		const streetFloor = layout.floors.find(floor => floor.id === streetFloorId)
		if (streetFloor) {
			const streetGuestRoleIds = new Set(npcConfig.pool
				.filter(entry => entry.count > 0
					&& isGuestRoleId(entry.roleId)
					&& (!entry.floorIds?.length || entry.floorIds.includes(streetFloorId))
					&& (!streetFloor.allowedRoleIds?.length || streetFloor.allowedRoleIds.includes(entry.roleId)))
				.map(entry => entry.roleId))
			const streetWidth = resolveStreetTiles(layout)
			const served = [...streetGuestRoleIds].some(roleId =>
				(streetFloor.spawnZones ?? []).some(zone =>
					spawnZoneAllowsRole(zone, roleId)
					&& zoneOverlapsStreetRing(zone, layout.canvas, streetWidth)))
			if (streetGuestRoleIds.size > 0) {
				if (!served) {
					issues.push(`Floor "${streetFloor.label}" is the street floor but no spawn zone covers its sidewalk - guest arrivals need a street-side spawn zone`)
				} else if (collectFloorEntrances(streetFloor, layout.canvas, streetWidth, assetMap).length === 0) {
					issues.push(`Floor "${streetFloor.label}" has street-side spawn zones but no door connects the street to the building - guest arrivals need an entrance door on the street floor`)
				}
			}
		}
	}

	for (const floor of layout.floors) {
		const interactableObjects = floor.objects.filter(object => {
			const asset = assetMap.get(object.type)
			if (!asset) return false
			if (asset.walkable || asset.isWall) return false
			return true
		})
		const withInteractSpots = interactableObjects.filter(object => {
			const asset = assetMap.get(object.type)
			return asset?.interactSpots?.length
		})
		if (interactableObjects.length > 0 && withInteractSpots.length === 0) {
			issues.push(`Floor "${floor.label}" has ${interactableObjects.length} object(s) but none have interact spots - NPCs cannot interact here`)
		}

		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			if (!asset) {
				issues.push(`Object "${object.id}" on floor "${floor.label}" references unknown asset type "${object.type}"`)
			}
		}
	}

	return { issues }
}


export function validatePortalConfiguration(
	layout: FloorLayoutData,
	assetMap: Map<string, AssetDef>,
	npcConfig: NpcSimulationConfig | undefined,
): PortalValidationResult {
	const errors: string[] = []
	const warnings: string[] = []

	const roleIds = new Set(npcConfig?.roles?.map(role => role.id) ?? [])


	const portalFloorLabels: string[] = []
	for (const floor of layout.floors) {
		let hasPortal = false
		for (const object of floor.objects) {
			const asset = assetMap.get(object.type)
			const isPortal = asset?.tags?.includes('portal') ?? false
			if (!isPortal) continue
			hasPortal = true
			if (!asset?.interactSpots?.length) {
				warnings.push(`Portal object "${object.id}" on floor "${floor.label}" has no interactSpots on its asset "${object.type}"`)
			}
		}
		if (hasPortal) portalFloorLabels.push(floor.label)
	}

	if (portalFloorLabels.length > 0 && portalFloorLabels.length < 2) {
		warnings.push(`Portals exist on only 1 floor (${portalFloorLabels[0]}); cross-floor travel requires portals on at least 2 floors`)
	}


	for (const floor of layout.floors) {
		if (!floor.allowedRoleIds?.length) continue
		for (const roleId of floor.allowedRoleIds) {
			if (!roleIds.has(roleId)) {
				warnings.push(`Floor "${floor.label}" allowedRoleIds references unknown role "${roleId}"`)
			}
		}
	}

	return { errors, warnings }
}
