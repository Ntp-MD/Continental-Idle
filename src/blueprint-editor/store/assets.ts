import type { AssetDef, WalkableGrid, TileState } from '../types'
import { isSafeSvgMarkup, isValidColor, normalizeOriginAsset, applySvgColorConvention } from '../types'
import { aabbOverlap } from '../collision'
import { assetSizeFor, normalizeObject } from '../geometry'
import {
	state, toast, clamp, withStateLock, initAssetFields, assetMap,
} from './state'
import { genAssetId } from './utils'
import { saveAssets, saveBlueprintData } from './persistence'

const FURNITURE_COLOR_MAP: Record<string, string> = {
	'#f4f8fc': 'var(--text-bright)',
	'#e8f0fa': 'var(--text-bright)',
	'#1a3a5c': 'var(--border-dim)',
	'#7c93ab': 'var(--border-dim)',
	'#c7d6e8': 'var(--border-dim)',
}

function convertFurnitureColors(svg: string): string {
	let result = svg
	for (const [hex, varName] of Object.entries(FURNITURE_COLOR_MAP)) {
		const escaped = hex.replace('#', '\\#')
		const attrRe = new RegExp(`(fill|stroke)\\s*=\\s*["']${escaped}["']`, 'gi')
		result = result.replace(attrRe, (_m, attr) => {
			const prop = attr.toLowerCase()
			return `style-convert__${prop}="${varName}"`
		})
	}

	const styleConvertRe = /style-convert__(fill|stroke)="([^"]*)"/gi
	result = result.replace(/<(\w+)([^>]*?)>/gi, (tag, name: string, attrs: string) => {
		const conversions: { prop: string; value: string }[] = []
		let cleaned = attrs.replace(styleConvertRe, (_m, prop: string, value: string) => {
			conversions.push({ prop, value })
			return ''
		})

		if (conversions.length === 0) return tag

		const existingStyleMatch = cleaned.match(/\sstyle\s*=\s*["']([^"']*)["']/i)
		let styleParts: string[] = []
		if (existingStyleMatch) {
			styleParts = existingStyleMatch[1].split(';').map(s => s.trim()).filter(Boolean)
			cleaned = cleaned.replace(/\sstyle\s*=\s*["'][^"']*["']/i, '')
		}
		for (const c of conversions) {
			styleParts.push(`${c.prop}: ${c.value}`)
		}
		return `<${name}${cleaned} style="${styleParts.join('; ')}">`
	})

	return result
}

export async function addSvgAsset(name: string, w: number, h: number, svgString: string): Promise<AssetDef | null> {
	return withStateLock(async () => {
		const safeName = name.trim()
		if (!safeName || safeName.length > 512) { toast.warning('Asset name is invalid'); return null }
		if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || w > 10_000 || h > 10_000) { toast.warning('Asset dimensions are invalid'); return null }
		const safeW = Math.floor(w)
		const safeH = Math.floor(h)
		const trimmed = svgString.trim()
		if (!trimmed) { toast.warning('SVG content cannot be empty'); return null }
		const viewBoxMatch = trimmed.match(/viewBox\s*=\s*["']([^"']+)["']/)
		if (!viewBoxMatch) { toast.warning('SVG must have a viewBox attribute'); return null }
		const parts = viewBoxMatch[1].split(/[\s,]+/).map(Number)
		if (parts.length !== 4 || parts.some(value => !Number.isFinite(value))) { toast.warning('Invalid viewBox format'); return null }
		const vbW = parts[2]
		const vbH = parts[3]
		if (vbW <= 0 || vbH <= 0 || vbW > 1_000_000 || vbH > 1_000_000) { toast.warning('Invalid viewBox dimensions'); return null }
		const innerMatch = trimmed.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
		const rawSvg = innerMatch ? innerMatch[1].trim() : trimmed
		const innerSvg = convertFurnitureColors(rawSvg)
		if (!innerSvg || !isSafeSvgMarkup(innerSvg) || !/<(?:rect|circle|ellipse|line|path|polyline|polygon|g|text|tspan)\b/i.test(innerSvg)) {
			toast.warning('SVG contains no valid drawable elements after sanitization')
			return null
		}
		const themedSvg = applySvgColorConvention(innerSvg)
		const asset: AssetDef = {
			origin: 'svg-import',
			id: genAssetId('custom', safeName, c => state.assetRegistry.some(a => a.id === c)), name: safeName,
			w: safeW, h: safeH,
			defaultFillColor: '#ffffff',
			svg: themedSvg,
			svgViewBox: { w: vbW, h: vbH },
		}
		initAssetFields(asset)
		state.assetRegistry.push(asset)
		await saveAssets()
		return asset
	})
}

export async function updateAsset(id: string, patch: Partial<Pick<AssetDef, 'name' | 'defaultPadding' | 'defaultRx' | 'defaultFillColor' | 'defaultStrokeColor' | 'defaultLabel' | 'defaultRadius' | 'defaultLabelPadding' | 'defaultLocked' | 'doorRequired' | 'tags' | 'interactSpots' | 'interact' | 'queue' | 'wallSegments'>> & { walkable?: boolean; walkableGrid?: WalkableGrid; tileStates?: TileState[][] }): Promise<void> {
	return withStateLock(async () => {
		const asset = state.assetRegistry.find(a => a.id === id)
		if (!asset) {
			toast.warning('Asset not found')
			return
		}
		const sizeKeys = ['w', 'h', 'pxW', 'pxH', 'usePx']
		if (sizeKeys.some(key => key in (patch as Record<string, unknown>))) {
			toast.warning('Origin asset dimensions are immutable after creation')
			return
		}
		if (patch.defaultFillColor !== undefined && patch.defaultFillColor !== '' && !isValidColor(patch.defaultFillColor)) {
			toast.warning('Fill color must be a hex code')
			return
		}
		if (patch.defaultStrokeColor !== undefined && patch.defaultStrokeColor !== '' && !isValidColor(patch.defaultStrokeColor)) {
			toast.warning('Outline color must be a hex code')
			return
		}


		const candidateInput: Record<string, unknown> = { ...asset, ...(patch as Record<string, unknown>) }
		for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
			if (value === undefined || (typeof value === 'string' && value === '') || (Array.isArray(value) && value.length === 0 && ['tags', 'wallSegments', 'interactSpots', 'svgRoles'].includes(key))) delete candidateInput[key]
		}
		const normalizedAsset = normalizeOriginAsset(candidateInput)
		if (!normalizedAsset) {
			toast.warning('Asset update contains invalid data')
			return
		}
		for (const key of Object.keys(asset)) delete (asset as unknown as Record<string, unknown>)[key]
		Object.assign(asset, normalizedAsset)

		const t = state.layout.canvas.tileSize
		const assets = assetMap()
		const collapsedIds: string[] = []

		for (const floor of state.layout.floors) {
			for (const obj of floor.objects) {
				if (obj.type !== id) continue
				const size = assetSizeFor(obj.type, obj.rotation, t, assets)
				if (!size) continue
				obj.w = size.w
				obj.h = size.h
				const clamped = clamp({ x: obj.x, y: obj.y, w: size.w, h: size.h })
				obj.x = clamped.x
				obj.y = clamped.y
				if (asset.defaultPadding && asset.defaultPadding > 0) {
					obj.padding = asset.defaultPadding
				} else if (obj.padding !== undefined && patch.defaultPadding !== undefined) {
					obj.padding = undefined
				}
				if (patch.defaultRx !== undefined) {
					obj.rx = asset.defaultRx ? { ...asset.defaultRx } : undefined
				}
				if (patch.defaultLabel !== undefined) obj.label = asset.defaultLabel
				if (patch.defaultRadius !== undefined) obj.radius = asset.defaultRadius
				if (patch.defaultLabelPadding !== undefined) obj.labelPadding = asset.defaultLabelPadding
				if (patch.defaultLocked !== undefined) obj.locked = asset.defaultLocked


				const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
				obj.collapsed = overlaps
				if (overlaps) collapsedIds.push(obj.id)
			}
		}

		if (collapsedIds.length > 0) {
			toast.error(`${collapsedIds.length} object(s) collapsed due to overlap - shown in red`)
		}
		await saveBlueprintData()
	}).catch(e => {
		if (e instanceof Error && e.message === 'Operation in progress') {
			toast.warning('Operation in progress')
			return
		}
		throw e
	})
}


export async function refreshOriginInstances(): Promise<number> {
	return withStateLock(async () => {
		const tileSize = state.layout.canvas.tileSize
		const assets = assetMap()
		let refreshedCount = 0
		for (const floor of state.layout.floors) {
			for (const object of floor.objects) {
				if (!assets.has(object.type)) continue
				normalizeObject(object, tileSize, assets)
				refreshedCount++
			}
			for (const object of floor.objects) {
				const overlaps = floor.objects.some(other => other.id !== object.id && aabbOverlap(object, other))
				object.collapsed = overlaps
			}
		}
		await saveBlueprintData()
		return refreshedCount
	})
}

export async function duplicateAsset(id: string): Promise<AssetDef | null> {
	return withStateLock(async () => {
		const source = state.assetRegistry.find(a => a.id === id)
		if (!source) {
			toast.warning('Asset not found')
			return null
		}
		const copy: AssetDef = {
			...source,
			id: genAssetId('custom', `${source.name} copy`, c => state.assetRegistry.some(a => a.id === c)),
			name: `${source.name} copy`,
			origin: 'drawn',
		}

		if (source.svg) copy.svg = source.svg
		if (source.svgViewBox) copy.svgViewBox = { ...source.svgViewBox }
		if (source.walkableGrid) copy.walkableGrid = source.walkableGrid.map(row => [...row])
		if (source.tileStates) copy.tileStates = source.tileStates.map(row => [...row])
		if (source.wallSegments) copy.wallSegments = source.wallSegments.map(segment => ({ ...segment }))
		if (source.interactSpots) copy.interactSpots = source.interactSpots.map(p => ({ ...p }))
		if (source.interact) copy.interact = { ...source.interact }
		if (source.defaultRx) copy.defaultRx = { ...source.defaultRx }
		if (source.tags) copy.tags = [...source.tags]
		if (!copy.defaultFillColor) copy.defaultFillColor = '#ffffff'
		state.assetRegistry.push(copy)
		await saveAssets()
		toast.success(`Duplicated "${source.name}" -> "${copy.name}"`)
		return copy
	})
}

export async function deleteAsset(id: string): Promise<boolean> {
	const inUse = state.layout.floors.some(f => f.objects.some(o => o.type === id))
	if (inUse) {
		toast.warning('Cannot delete - asset is placed on floors. Remove instances first.')
		return false
	}
	const idx = state.assetRegistry.findIndex(a => a.id === id)
	if (idx === -1) {
		toast.warning('Asset not found')
		return false
	}
	state.assetRegistry.splice(idx, 1)
	if (state.selectedAssetId === id) state.selectedAssetId = null
	await saveAssets()
	return true
}
