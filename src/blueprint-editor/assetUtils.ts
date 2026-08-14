import type { AssetDef, FloorLayoutData, NpcSimulationConfig, ObjectData, ObjectPlacement, SvgRole, SvgRoleInfo, WalkableGrid, TileState } from './types'

export function findAsset(assets: AssetDef[], type: string): AssetDef | undefined {
	return assets.find(a => a.id === type)
}

export function findAssetCached(assetMap: Map<string, AssetDef>, type: string): AssetDef | undefined {
	return assetMap.get(type)
}

export function buildAssetMap(assets: AssetDef[]): Map<string, AssetDef> {
	return new Map<string, AssetDef>(
		assets.map(a => [a.id, a])
	)
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
		const grid: WalkableGrid = tileStates.map(row => row.map(t => t === 'walkable' || t === 'entrance'))
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
	if (obj.subId) out.subId = obj.subId
	if (obj.linkGroupId) out.linkGroupId = obj.linkGroupId

	if (obj.instanceLabel) out.instanceLabel = obj.instanceLabel
	if (obj.locked !== undefined) out.locked = obj.locked
	return out
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
	if (asset.walkable !== undefined) out.walkable = asset.walkable
	if (asset.entranceRequired) out.entranceRequired = asset.entranceRequired
	if (asset.defaultPadding && asset.defaultPadding > 0) out.defaultPadding = asset.defaultPadding
	if (asset.defaultRx && (asset.defaultRx.tl > 0 || asset.defaultRx.tr > 0 || asset.defaultRx.br > 0 || asset.defaultRx.bl > 0)) out.defaultRx = asset.defaultRx
	if (asset.defaultBgColor) out.defaultBgColor = asset.defaultBgColor
	if (asset.defaultLabelColor) out.defaultLabelColor = asset.defaultLabelColor
	if (asset.defaultLabel) out.defaultLabel = asset.defaultLabel
	if (asset.defaultRadius && asset.defaultRadius > 0) out.defaultRadius = asset.defaultRadius
	if (asset.defaultLabelPadding) out.defaultLabelPadding = asset.defaultLabelPadding
	if (asset.defaultInstanceLabel) out.defaultInstanceLabel = asset.defaultInstanceLabel
	if (asset.defaultLocked) out.defaultLocked = asset.defaultLocked
	if (asset.tags?.length) out.tags = asset.tags
	if (asset.pxW !== undefined) out.pxW = asset.pxW
	if (asset.pxH !== undefined) out.pxH = asset.pxH
	if (asset.usePx) out.usePx = asset.usePx
	if (asset.linkedParts?.length) out.linkedParts = asset.linkedParts
	if (asset.svg) out.svg = asset.svg
	if (asset.svgViewBox) out.svgViewBox = asset.svgViewBox
	if (asset.svgRoles?.length) out.svgRoles = asset.svgRoles
	if (asset.walkableGrid) out.walkableGrid = asset.walkableGrid
	if (asset.tileStates) out.tileStates = asset.tileStates
	if (asset.tileEdges) out.tileEdges = asset.tileEdges
	if (asset.interactSpots?.length) out.interactSpots = asset.interactSpots
	if (asset.interact) out.interact = asset.interact
	return out
}


export interface PortalValidationResult {
	errors: string[]
	warnings: string[]
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
