import type { SvgRole, SvgRoleInfo } from './primitives'
import type { TileState, WalkableGrid } from './walkable'
import { normalizeTileStates, normalizeWalkableGrid } from './walkable'
import type { InteractConfig, InteractSpot, NpcQueueConfig } from './interact'
import { normalizeCornerRx, normalizeInteractConfig, normalizeInteractSpots, normalizeNpcQueueConfig } from './interact'
import { MAX_ASSET_TILES, MAX_ASSETS } from '../../limits'
import {
	MAX_ASSET_DIMENSION, MAX_PIXEL_DIMENSION, MAX_SVG_ATTRIBUTE_LENGTH, MAX_SVG_ROLES,
	SVG_COLOR_VALUE_RE, hasOwn, isFiniteNumber, isRecord, isSafeSvgMarkup, isValidColor,
	normalizeIdentifier, normalizeTags, normalizeText,
} from './helpers'

export type AssetPixelSize = Pick<AssetDef, 'w' | 'h' | 'usePx' | 'pxW' | 'pxH'>

export function assetPixelSize(asset: AssetPixelSize, tileSize: number): { w: number; h: number } {
	const w = asset.usePx ? (asset.pxW ?? asset.w * tileSize) : asset.w * tileSize
	const h = asset.usePx ? (asset.pxH ?? asset.h * tileSize) : asset.h * tileSize
	return { w, h }
}

export interface AssetBase {
	id: string
	name: string
	w: number
	h: number
	walkable?: boolean
	doorRequired?: boolean
	defaultPadding?: number
	defaultRx?: { tl: number; tr: number; br: number; bl: number }
	defaultFillColor?: string
	defaultStrokeColor?: string
	defaultLabel?: string
	defaultRadius?: number
	defaultLabelPadding?: number
	defaultLocked?: boolean
	tags?: string[]
}

export type AssetOrigin = 'drawn' | 'svg-import' | 'flattened'

export interface AssetDef extends AssetBase {
	origin?: AssetOrigin
	pxW?: number
	pxH?: number
	usePx?: boolean
	svg?: string
	svgViewBox?: { w: number; h: number }
	svgRoles?: SvgRoleInfo[]
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}

export interface OriginAssetFile {
	$schema: string
	version: number
	originAssets: AssetDef[]
}

export interface BlueprintTagDefinition {
	id: string
	label: string
}


export function applySvgColorConvention(svg: string): string {
	return svg.replace(/\b(fill|stroke)(\s*=\s*)(["'])([^"']*)\3/g, (_m, attr: string, sep: string, q: string, value: string) => {
		const v = value.trim()
		if (v.startsWith('var(--obj-fill') || v.startsWith('var(--obj-stroke')) return _m
		if (attr === 'fill') {
			if (v === 'none') return _m
			if (SVG_COLOR_VALUE_RE.test(v)) return `${attr}${sep}${q}var(--obj-fill,${v})${q}`
		} else if (SVG_COLOR_VALUE_RE.test(v)) {
			return `${attr}${sep}${q}var(--obj-stroke,${v})${q}`
		}
		return _m
	})
}

function normalizeSvgRoles(value: unknown): SvgRoleInfo[] | undefined {
	if (!Array.isArray(value) || value.length > MAX_SVG_ROLES) return undefined
	const roles: SvgRoleInfo[] = []
	for (const item of value) {
		if (!isRecord(item) || !['wall', 'door', 'fixture'].includes(item.role as string)) return undefined
		const tag = normalizeText(item.tag, 64)
		if (!tag || !/^[a-z][a-z0-9:_-]*$/i.test(tag)) return undefined
		const roleInfo: SvgRoleInfo = { role: item.role as SvgRole, tag }
		if (hasOwn(item, 'attrs')) {
			if (!isRecord(item.attrs)) return undefined
			const attrs: Record<string, string> = {}
			const entries = Object.entries(item.attrs)
			if (entries.length > 64) return undefined
			for (const [name, attrValue] of entries) {
				if (!/^[a-z_:][a-z0-9:_.-]*$/i.test(name) || typeof attrValue !== 'string' || attrValue.length > MAX_SVG_ATTRIBUTE_LENGTH) return undefined
				attrs[name] = attrValue
			}
			if (entries.length > 0) roleInfo.attrs = attrs
		}
		roles.push(roleInfo)
	}
	return roles
}

export function normalizeAssetColor(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined
	const color = value.trim()
	return color.length <= 32 && isValidColor(color) ? color : undefined
}

export function normalizeOriginAsset(value: unknown): AssetDef | undefined {
	if (!isRecord(value)) return undefined
	const record = value
	const id = normalizeIdentifier(record.id)
	const name = normalizeText(record.name)
	if (!id || !name || !isFiniteNumber(record.w) || record.w <= 0 || record.w > MAX_ASSET_TILES || !isFiniteNumber(record.h) || record.h <= 0 || record.h > MAX_ASSET_TILES) return undefined
	const asset: AssetDef = { id, name, w: record.w, h: record.h }

	if (hasOwn(record, 'walkable')) {
		if (typeof record.walkable !== 'boolean') return undefined
		asset.walkable = record.walkable
	}
	if (hasOwn(record, 'doorRequired')) {
		if (typeof record.doorRequired !== 'boolean') return undefined
		asset.doorRequired = record.doorRequired
	}
	if (hasOwn(record, 'defaultPadding')) {
		if (!isFiniteNumber(record.defaultPadding) || record.defaultPadding < 0 || record.defaultPadding > MAX_ASSET_DIMENSION) return undefined
		if (record.defaultPadding > 0) asset.defaultPadding = record.defaultPadding
	}
	if (hasOwn(record, 'defaultRx')) {
		if (!isRecord(record.defaultRx)) return undefined
		const defaultRx = normalizeCornerRx(record.defaultRx)
		if (defaultRx) asset.defaultRx = defaultRx
	}
	for (const key of ['defaultFillColor', 'defaultStrokeColor'] as const) {
		if (!hasOwn(record, key)) continue
		const color = normalizeAssetColor(record[key])
		if (!color) return undefined
		asset[key] = color
	}
	if (hasOwn(record, 'defaultLabel')) {
		if (typeof record.defaultLabel !== 'string') return undefined
		const label = normalizeText(record.defaultLabel)
		if (label) asset.defaultLabel = label
	}
	for (const key of ['defaultRadius', 'defaultLabelPadding'] as const) {
		if (!hasOwn(record, key)) continue
		if (!isFiniteNumber(record[key]) || record[key] < 0 || record[key] > MAX_ASSET_DIMENSION) return undefined
		if (record[key] > 0) asset[key] = record[key]
	}
	if (hasOwn(record, 'defaultLocked')) {
		if (typeof record.defaultLocked !== 'boolean') return undefined
		asset.defaultLocked = record.defaultLocked
	}
	if (hasOwn(record, 'tags')) {
		const tags = normalizeTags(record.tags)
		if (!tags) return undefined
		if (tags.length > 0) asset.tags = tags
	}
	if (hasOwn(record, 'origin')) {
		if (!['drawn', 'svg-import', 'flattened'].includes(record.origin as string)) return undefined
		asset.origin = record.origin as AssetOrigin
	}
	for (const key of ['pxW', 'pxH'] as const) {
		if (!hasOwn(record, key)) continue
		if (!isFiniteNumber(record[key]) || record[key] <= 0 || record[key] > MAX_PIXEL_DIMENSION) return undefined
		asset[key] = record[key]
	}
	if (hasOwn(record, 'usePx')) {
		if (typeof record.usePx !== 'boolean') return undefined
		asset.usePx = record.usePx
	}
	if (hasOwn(record, 'svg')) {
		if (typeof record.svg !== 'string') return undefined
		const svg = record.svg.trim()
		if (svg) {
			if (!isSafeSvgMarkup(svg)) return undefined
			asset.svg = applySvgColorConvention(svg)
		}
	}
	if (hasOwn(record, 'svgViewBox')) {
		if (!isRecord(record.svgViewBox) || !isFiniteNumber(record.svgViewBox.w) || record.svgViewBox.w <= 0 || record.svgViewBox.w > MAX_PIXEL_DIMENSION || !isFiniteNumber(record.svgViewBox.h) || record.svgViewBox.h <= 0 || record.svgViewBox.h > MAX_PIXEL_DIMENSION) return undefined
		asset.svgViewBox = { w: record.svgViewBox.w, h: record.svgViewBox.h }
	}
	if (hasOwn(record, 'svgRoles')) {
		const svgRoles = normalizeSvgRoles(record.svgRoles)
		if (!svgRoles) return undefined
		if (svgRoles.length > 0) asset.svgRoles = svgRoles
	}
	if (hasOwn(record, 'walkableGrid')) {
		const walkableGrid = normalizeWalkableGrid(record.walkableGrid)
		if (!walkableGrid) return undefined
		asset.walkableGrid = walkableGrid
	}
	if (hasOwn(record, 'tileStates')) {
		const tileStates = normalizeTileStates(record.tileStates)
		if (!tileStates) return undefined
		asset.tileStates = tileStates
	}
	if (hasOwn(record, 'interactSpots')) {
		if (!Array.isArray(record.interactSpots)) return undefined
		const interactSpots = normalizeInteractSpots(record.interactSpots)
		if (record.interactSpots.length > 0 && !interactSpots) return undefined
		if (interactSpots) asset.interactSpots = interactSpots
	}
	if (hasOwn(record, 'interact')) {
		const interact = normalizeInteractConfig(record.interact)
		if (!interact) return undefined
		asset.interact = interact
	}
	if (hasOwn(record, 'queue')) {
		const queue = normalizeNpcQueueConfig(record.queue)
		if (!queue) return undefined
		asset.queue = queue
	}
	if (asset.walkableGrid && asset.tileStates) {
		if (asset.walkableGrid.length !== asset.tileStates.length || asset.walkableGrid.some((row, index) => row.length !== asset.tileStates?.[index]?.length)) return undefined
		if (asset.walkableGrid.some((row, rowIndex) => row.some((cell, columnIndex) => cell !== (asset.tileStates?.[rowIndex]?.[columnIndex] === 'walkable' || asset.tileStates?.[rowIndex]?.[columnIndex] === 'door')))) return undefined
	}
	if (asset.svg && !asset.svgViewBox) return undefined
	return asset
}

export function normalizeOriginAssetFile(value: unknown): OriginAssetFile | undefined {
	if (!isRecord(value) || !Array.isArray(value.originAssets) || value.originAssets.length > MAX_ASSETS) return undefined
	const assets: AssetDef[] = []
	const assetIds = new Set<string>()
	for (const item of value.originAssets) {
		const asset = normalizeOriginAsset(item)
		if (!asset || assetIds.has(asset.id)) return undefined
		assetIds.add(asset.id)
		assets.push(asset)
	}
	return { $schema: typeof value.$schema === 'string' ? value.$schema : 'origin-assets.v2.json', version: typeof value.version === 'number' ? value.version : 2, originAssets: assets }
}

