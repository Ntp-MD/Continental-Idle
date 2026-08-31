import { isValidColor } from './types'
import { assetPixelSize, CANVAS_WALL_OBJECT_TYPE } from './types'
import type { WallSegment } from './types'
import type { AssetDef, FloorData, FloorLayoutData, NpcSimulationConfig, ObjectPlacement, SvgRole, SvgRoleInfo, WalkableGrid, TileState } from './types'

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
			}
		})
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
		const half = p.length / 2
		const off = half * progress
		const halfT = p.thickness / 2
		if (p.horizontal) {
			parts.push(`<rect x="${(p.cx - half - off).toFixed(2)}" y="${(p.cy - halfT).toFixed(2)}" width="${half.toFixed(2)}" height="${p.thickness}" fill="${color}" rx="1"/>`)
			parts.push(`<rect x="${(p.cx + off).toFixed(2)}" y="${(p.cy - halfT).toFixed(2)}" width="${half.toFixed(2)}" height="${p.thickness}" fill="${color}" rx="1"/>`)
		} else {
			parts.push(`<rect x="${(p.cx - halfT).toFixed(2)}" y="${(p.cy - half - off).toFixed(2)}" width="${p.thickness}" height="${half.toFixed(2)}" fill="${color}" rx="1"/>`)
			parts.push(`<rect x="${(p.cx - halfT).toFixed(2)}" y="${(p.cy + off).toFixed(2)}" width="${p.thickness}" height="${half.toFixed(2)}" fill="${color}" rx="1"/>`)
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
	linked: 'Linked',
	flattened: 'Flattened',
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
	if (asset.tags?.length) out.tags = asset.tags
	if (asset.pxW !== undefined) out.pxW = asset.pxW
	if (asset.pxH !== undefined) out.pxH = asset.pxH
	if (asset.usePx) out.usePx = asset.usePx
	if (asset.svg) out.svg = asset.svg
	if (asset.svgViewBox) out.svgViewBox = asset.svgViewBox
	if (asset.svgRoles?.length) out.svgRoles = asset.svgRoles
	if (asset.walkableGrid) out.walkableGrid = asset.walkableGrid
	if (asset.tileStates) out.tileStates = asset.tileStates
	if (asset.interactSpots?.length) out.interactSpots = asset.interactSpots
	if (asset.interact) out.interact = asset.interact
	if (asset.queue) out.queue = asset.queue
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
	return zones.some(zone => !zone.roleIds?.length || zone.roleIds.includes(roleId))
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
