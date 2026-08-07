import type { AssetDef, WalkableGrid, TileState, TileEdges } from '../types'
import { aabbOverlap } from '../collision'
import {
	state, toast, clamp, withStateLock, initAssetFields, isValidColor,
} from './state'
import { genId } from './utils'
import { saveAssets, saveLayout } from './persistence'

export async function addAsset(name: string, w: number, h: number, pxW?: number, pxH?: number, defaultRx?: { tl: number; tr: number; br: number; bl: number }, defaultBgColor?: string): Promise<AssetDef> {
	return withStateLock(async () => {
		const safeW = Math.max(1, Math.floor(w))
		const safeH = Math.max(1, Math.floor(h))
		const asset: AssetDef = { origin: 'drawn', id: genId('custom'), name, w: safeW, h: safeH }
		if (pxW !== undefined && pxW > 0) asset.pxW = Math.floor(pxW)
		if (pxH !== undefined && pxH > 0) asset.pxH = Math.floor(pxH)
		if (defaultRx && (defaultRx.tl > 0 || defaultRx.tr > 0 || defaultRx.br > 0 || defaultRx.bl > 0)) asset.defaultRx = defaultRx
		if (defaultBgColor && !isValidColor(defaultBgColor)) {
			toast.warning('Background color must be a hex code')
			return asset
		}
		if (defaultBgColor) asset.defaultBgColor = defaultBgColor
		state.assetRegistry.push(asset)
		await saveAssets()
		return asset
	})
}

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

function sanitizeSvg(svg: string): string {
	return convertFurnitureColors(
		svg
			.replace(/<!--[\s\S]*?-->/g, '')
			.replace(/<\?[\s\S]*?\?>/g, '')
			.replace(/<!DOCTYPE[\s\S]*?>/gi, '')
			.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
			.replace(/<style[\s\S]*?<\/style>/gi, '')
			.replace(/<script[\s\S]*?<\/script>/gi, '')
			.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
			.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
			.replace(/<object[\s\S]*?<\/object>/gi, '')
			.replace(/<embed[\s\S]*?\/?>/gi, '')
			.replace(/<use[\s\S]*?\/?>/gi, '')
			.replace(/<link[\s\S]*?\/?>/gi, '')
			.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
			.replace(/javascript:/gi, '')
			.replace(/\sstyle\s*=\s*["'][^"']*(?:expression\s*\(|javascript:|url\s*\(\s*["']?(?:javascript|data|blob):)[^"']*["']/gi, '')
	)
}

export async function addSvgAsset(name: string, w: number, h: number, svgString: string): Promise<AssetDef | null> {
	return withStateLock(async () => {
		const safeW = Math.max(1, Math.floor(w))
		const safeH = Math.max(1, Math.floor(h))
		const trimmed = svgString.trim()
		if (!trimmed) { toast.warning('SVG content cannot be empty'); return null }
		const viewBoxMatch = trimmed.match(/viewBox\s*=\s*["']([^"']+)["']/)
		if (!viewBoxMatch) { toast.warning('SVG must have a viewBox attribute'); return null }
		const parts = viewBoxMatch[1].split(/[\s,]+/).map(Number)
		if (parts.length < 4 || parts.some(isNaN)) { toast.warning('Invalid viewBox format'); return null }
		const vbW = parts[2]
		const vbH = parts[3]
		if (vbW <= 0 || vbH <= 0) { toast.warning('Invalid viewBox dimensions'); return null }
		const innerMatch = trimmed.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
		const rawSvg = innerMatch ? innerMatch[1].trim() : trimmed
		const innerSvg = sanitizeSvg(rawSvg)
		if (!innerSvg || !/<(?:rect|circle|ellipse|line|path|polyline|polygon|g|text|image|use|defs|linearGradient|radialGradient|stop|tspan)\b/i.test(innerSvg)) {
			toast.warning('SVG contains no valid drawable elements after sanitization')
			return null
		}
		const asset: AssetDef = {
			origin: 'svg-import',
			id: genId('custom'), name,
			w: safeW, h: safeH,
			svg: innerSvg,
			svgViewBox: { w: vbW, h: vbH },
		}
		initAssetFields(asset)
		state.assetRegistry.push(asset)
		await saveAssets()
		return asset
	})
}

export async function updateAsset(id: string, patch: Partial<Pick<AssetDef, 'name' | 'w' | 'h' | 'pxW' | 'pxH' | 'usePx' | 'defaultPadding' | 'defaultRx' | 'defaultBgColor' | 'defaultLabelColor' | 'defaultLabel' | 'defaultRadius' | 'defaultLabelPadding' | 'defaultCustomProps' | 'defaultInstanceLabel' | 'defaultValidationRule' | 'defaultLocked' | 'entranceRequired' | 'tags' | 'anchorPoints' | 'interact'>> & { walkable?: boolean; walkableGrid?: WalkableGrid; tileStates?: TileState[][]; tileEdges?: TileEdges[][] }): Promise<void> {
	return withStateLock(async () => {
		const asset = state.assetRegistry.find(a => a.id === id)
		if (!asset) {
			toast.warning('Asset not found')
			return
		}
		if (patch.defaultBgColor !== undefined && !isValidColor(patch.defaultBgColor)) {
			toast.warning('Background color must be a hex code')
			return
		}
		if (patch.defaultLabelColor !== undefined && !isValidColor(patch.defaultLabelColor)) {
			toast.warning('Label color must be a hex code')
			return
		}


		const sizePatchKeys: (keyof typeof patch)[] = ['w', 'h', 'pxW', 'pxH', 'usePx']
		const touchesSize = sizePatchKeys.some(k => patch[k] !== undefined)
		if (touchesSize) {
			const inUse = state.layout.floors.some(f => f.objects.some(o => o.type === id))
			if (inUse) {
				toast.warning('Cannot resize — asset is placed on floors. Remove instances first.')
				return
			}
		}
		if (patch.name !== undefined) asset.name = patch.name
		if (patch.w !== undefined) asset.w = Math.max(1, Math.floor(patch.w))
		if (patch.h !== undefined) asset.h = Math.max(1, Math.floor(patch.h))
		if (patch.usePx !== undefined) asset.usePx = patch.usePx
		if (patch.pxW !== undefined) asset.pxW = patch.pxW > 0 ? Math.floor(patch.pxW) : undefined
		if (patch.pxH !== undefined) asset.pxH = patch.pxH > 0 ? Math.floor(patch.pxH) : undefined
		if (patch.defaultPadding !== undefined) asset.defaultPadding = patch.defaultPadding > 0 ? patch.defaultPadding : undefined
		if (patch.defaultRx !== undefined) {
			const r = patch.defaultRx
			asset.defaultRx = (r.tl > 0 || r.tr > 0 || r.br > 0 || r.bl > 0) ? r : undefined
		}
		if (patch.defaultBgColor !== undefined) {
			asset.defaultBgColor = patch.defaultBgColor || undefined
		}
		if (patch.defaultLabelColor !== undefined) {
			asset.defaultLabelColor = patch.defaultLabelColor || undefined
		}
		if (patch.defaultLabel !== undefined) asset.defaultLabel = patch.defaultLabel || undefined
		if (patch.defaultRadius !== undefined) asset.defaultRadius = patch.defaultRadius > 0 ? patch.defaultRadius : undefined
		if (patch.defaultLabelPadding !== undefined) asset.defaultLabelPadding = patch.defaultLabelPadding || undefined
		if (patch.defaultCustomProps !== undefined) asset.defaultCustomProps = patch.defaultCustomProps
		if (patch.defaultInstanceLabel !== undefined) asset.defaultInstanceLabel = patch.defaultInstanceLabel || undefined
		if (patch.defaultValidationRule !== undefined) asset.defaultValidationRule = patch.defaultValidationRule
		if (patch.defaultLocked !== undefined) asset.defaultLocked = patch.defaultLocked
		if (patch.walkable !== undefined) asset.walkable = patch.walkable
		if (patch.entranceRequired !== undefined) asset.entranceRequired = patch.entranceRequired
		if (patch.tags !== undefined) asset.tags = patch.tags.length > 0 ? [...patch.tags] : undefined
		if (patch.walkableGrid !== undefined) asset.walkableGrid = patch.walkableGrid
		if (patch.tileStates !== undefined) asset.tileStates = patch.tileStates
		if (patch.tileEdges !== undefined) asset.tileEdges = patch.tileEdges
		if (patch.anchorPoints !== undefined) asset.anchorPoints = patch.anchorPoints.length > 0 ? patch.anchorPoints.map(p => ({ ...p })) : undefined
		if (patch.interact !== undefined) asset.interact = patch.interact ? { ...patch.interact } : undefined

		const t = state.layout.canvas.tileSize
		const newW = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
		const newH = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
		const collapsedIds: string[] = []

		for (const floor of state.layout.floors) {
			for (const obj of floor.objects) {
				if (obj.type !== id) continue
				obj.w = newW
				obj.h = newH
				const clamped = clamp({ x: obj.x, y: obj.y, w: newW, h: newH })
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
				if (patch.defaultBgColor !== undefined) {
					obj.fillColor = asset.defaultBgColor || undefined
				}
				if (patch.defaultLabel !== undefined) obj.label = asset.defaultLabel
				if (patch.defaultRadius !== undefined) obj.radius = asset.defaultRadius
				if (patch.defaultLabelPadding !== undefined) obj.labelPadding = asset.defaultLabelPadding
				if (patch.defaultCustomProps !== undefined) obj.customProps = asset.defaultCustomProps ? JSON.parse(JSON.stringify(asset.defaultCustomProps)) : undefined
				if (patch.defaultInstanceLabel !== undefined) obj.instanceLabel = asset.defaultInstanceLabel
				if (patch.defaultValidationRule !== undefined) obj.validationRule = asset.defaultValidationRule ? JSON.parse(JSON.stringify(asset.defaultValidationRule)) : undefined
				if (patch.defaultLocked !== undefined) obj.locked = asset.defaultLocked


				const overlaps = floor.objects.some(o => o.id !== obj.id && aabbOverlap(obj, o))
				obj.collapsed = overlaps
				if (overlaps) collapsedIds.push(obj.id)
			}
		}

		if (collapsedIds.length > 0) {
			toast.error(`${collapsedIds.length} object(s) collapsed due to overlap - shown in red`)
		}
		await saveAssets()
		await saveLayout()
	}).catch(e => {
		if (e instanceof Error && e.message === 'Operation in progress') {
			toast.warning('Operation in progress')
			return
		}
		throw e
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
			id: genId('custom'),
			name: `${source.name} copy`,
			origin: 'drawn',
		}

		if (source.svg) copy.svg = source.svg
		if (source.svgViewBox) copy.svgViewBox = { ...source.svgViewBox }
		if (source.walkableGrid) copy.walkableGrid = source.walkableGrid.map(row => [...row])
		if (source.tileStates) copy.tileStates = source.tileStates.map(row => [...row])
		if (source.tileEdges) copy.tileEdges = source.tileEdges.map(row => row.map(e => e ? { ...e } : e))
		if (source.anchorPoints) copy.anchorPoints = source.anchorPoints.map(p => ({ ...p }))
		if (source.interact) copy.interact = { ...source.interact }
		if (source.defaultRx) copy.defaultRx = { ...source.defaultRx }
		if (source.defaultCustomProps) copy.defaultCustomProps = JSON.parse(JSON.stringify(source.defaultCustomProps))
		if (source.defaultValidationRule) copy.defaultValidationRule = JSON.parse(JSON.stringify(source.defaultValidationRule))
		if (source.tags) copy.tags = [...source.tags]
		if (source.linkedParts) copy.linkedParts = source.linkedParts.map(p => ({ ...p }))
		state.assetRegistry.push(copy)
		await saveAssets()
		toast.success(`Duplicated "${source.name}" → "${copy.name}"`)
		return copy
	})
}

export async function deleteAsset(id: string): Promise<boolean> {
	const inUse = state.layout.floors.some(f => f.objects.some(o => o.type === id))
	if (inUse) {
		toast.warning('Cannot delete — asset is placed on floors. Remove instances first.')
		return false
	}
	const referencedByLinked = state.assetRegistry.some(a =>
		a.linkedParts?.some(p => p.type === id)
	)
	if (referencedByLinked) {
		const linkedNames = state.assetRegistry
			.filter(a => a.linkedParts?.some(p => p.type === id))
			.map(a => a.name)
			.join(', ')
		toast.warning(`Cannot delete — asset is used in linked set: ${linkedNames}. Remove the linked set first.`)
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

export async function rotateAsset(id: string): Promise<void> {
	return withStateLock(async () => {
		const asset = state.assetRegistry.find(a => a.id === id)
		if (!asset || !asset.svg || !asset.svgViewBox) return
		const vb = asset.svgViewBox
		asset.svg = `<g transform="translate(${vb.h}, 0) rotate(90)">${asset.svg}</g>`
		asset.svgViewBox = { w: vb.h, h: vb.w }
		const tmp = asset.w
		asset.w = asset.h
		asset.h = tmp
		if (asset.walkableGrid && asset.walkableGrid.length > 0) {
			const rows = asset.walkableGrid.length
			const cols = asset.walkableGrid[0].length
			const rotated: boolean[][] = []
			for (let r = 0; r < cols; r++) {
				rotated[r] = []
				for (let c = 0; c < rows; c++) {
					rotated[r][c] = asset.walkableGrid[rows - 1 - c][r]
				}
			}
			asset.walkableGrid = rotated
		}
		if (asset.tileStates && asset.tileStates.length > 0) {
			const rows = asset.tileStates.length
			const cols = asset.tileStates[0].length
			const rotated: TileState[][] = []
			for (let r = 0; r < cols; r++) {
				rotated[r] = []
				for (let c = 0; c < rows; c++) {
					rotated[r][c] = asset.tileStates[rows - 1 - c][r]
				}
			}
			asset.tileStates = rotated
		}
		if (asset.tileEdges && asset.tileEdges.length > 0) {
			const rows = asset.tileEdges.length
			const cols = asset.tileEdges[0].length
			const rotated: TileEdges[][] = []
			for (let r = 0; r < cols; r++) {
				rotated[r] = []
				for (let c = 0; c < rows; c++) {
					const e = asset.tileEdges[rows - 1 - c][r]
					rotated[r][c] = e ? { top: e.left, right: e.top, bottom: e.right, left: e.bottom } : e
				}
			}
			asset.tileEdges = rotated
		}

		const t = state.layout.canvas.tileSize
		const newW = asset.w * t
		const newH = asset.h * t
		for (const floor of state.layout.floors) {
			for (const obj of floor.objects) {
				if (obj.type !== id) continue
				obj.w = newW
				obj.h = newH
				const clamped = clamp({ x: obj.x, y: obj.y, w: newW, h: newH })
				obj.x = clamped.x
				obj.y = clamped.y

			}
		}

		await saveAssets()
	})
}
