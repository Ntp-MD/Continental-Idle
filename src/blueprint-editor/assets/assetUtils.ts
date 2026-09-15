import { assetPixelSize, isValidColor } from '../domain/types'
import type { AssetDef, FloorData, ObjectPlacement, SvgRole, SvgRoleInfo, WalkableGrid, TileState } from '../domain/types'

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

export function assetPreviewSvg(asset: AssetDef, tileSize: number): string {
	return asset.svg?.replace(/var\(--border-dim\)/g, '#fff') ?? assetFallbackShapeSvg(asset, tileSize)
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
