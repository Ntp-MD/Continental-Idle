import type { AssetDef, Rect } from '../domain/types'
import { isSafeSvgMarkup, isValidColor, normalizeOriginAsset, applySvgColorConvention } from '../domain/types'
import { recalcCollapsed } from '../domain/collision'
import { assetSizeFor, originSnapshot } from '../domain/geometry'
import { parseSvgViewBox, serializeAsset } from '../assets/assetUtils'
import type { BlueprintStore, AssetPatch } from './state'
import { genAssetId } from './storeUtils'
import { MAX_ASSETS, MAX_ASSET_TILES } from '../limits'

const FURNITURE_COLOR_MAP: Record<string, string> = {
	'#f4f8fc': 'var(--text-primary)',
	'#e8f0fa': 'var(--text-primary)',
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
		const cleaned = attrs.replace(styleConvertRe, (_m, prop: string, value: string) => {
			conversions.push({ prop, value })
			return ''
		})

		if (conversions.length === 0) return tag

		const existingStyleMatch = cleaned.match(/\sstyle\s*=\s*["']([^"']*)["']/i)
		let styleParts: string[] = []
		let cleanedAttrs = cleaned
		if (existingStyleMatch) {
			styleParts = existingStyleMatch[1].split(';').map(s => s.trim()).filter(Boolean)
			cleanedAttrs = cleaned.replace(/\sstyle\s*=\s*["'][^"']*["']/i, '')
		}
		for (const c of conversions) {
			styleParts.push(`${c.prop}: ${c.value}`)
		}
		return `<${name}${cleanedAttrs} style="${styleParts.join('; ')}">`
	})

	return result
}

export function createAssetCommands(store: BlueprintStore) {
	const state = store.state
	const toast = store.toast
	const clamp = (rect: Rect) => store.clamp(rect)
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)
	const initAssetFields = (asset: AssetDef) => store.initAssetFields(asset)
	const assetMap = () => store.assetMap()
	const saveBlueprintData = () => store.save()

	async function addSvgAsset(name: string, w: number, h: number, svgString: string): Promise<AssetDef | null> {
		return withStateLock(async () => {
			const safeName = name.trim()
			if (!safeName || safeName.length > 512) { toast.warning('Asset name is invalid'); return null }
			if (state.assetRegistry.length >= MAX_ASSETS) { toast.warning(`Asset limit reached (${MAX_ASSETS})`); return null }
			if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || w > MAX_ASSET_TILES || h > MAX_ASSET_TILES) { toast.warning(`Asset size must be between 1 and ${MAX_ASSET_TILES} tiles`); return null }
			const safeW = Math.floor(w)
			const safeH = Math.floor(h)
			const trimmed = svgString.trim()
			if (!trimmed) { toast.warning('SVG content cannot be empty'); return null }
			const viewBox = parseSvgViewBox(trimmed)
			if (!viewBox) { toast.warning('SVG must have a valid viewBox attribute'); return null }
			const vbW = viewBox.w
			const vbH = viewBox.h
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
			await saveBlueprintData()
			return asset
		})
	}

	async function updateAsset(id: string, patch: AssetPatch): Promise<void> {
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
				if (value === undefined || (typeof value === 'string' && value === '') || (Array.isArray(value) && value.length === 0 && ['tags', 'interactSpots', 'svgRoles'].includes(key))) delete candidateInput[key]
			}
		const normalizedAsset = normalizeOriginAsset(candidateInput)
		if (!normalizedAsset) {
			toast.warning('Asset update contains invalid data')
			return
		}
		// Pre-edit default: instances whose lock matches it are inheriting and
		// follow the new default; instances holding any other value were
		// explicitly toggled and keep their override.
		const prevLocked = asset.defaultLocked
		for (const key of Object.keys(asset)) delete (asset as unknown as Record<string, unknown>)[key]
		Object.assign(asset, normalizedAsset)

			const t = state.layout.canvas.tileSize
			const assets = assetMap()

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
				// Every origin edit re-resolves every placed instance: origin-owned
				// snapshot fields always follow the origin, even when the patch
				// touched an unrelated field (this also heals stale snapshots).
				// Instance-owned overrides are preserved: explicit locks (see
				// prevLocked above) and fill/stroke colors (never copied).
				Object.assign(obj, originSnapshot(asset))
				if (obj.locked === prevLocked) obj.locked = asset.defaultLocked
				}
				recalcCollapsed(floor, assets)
			}
			const collapsedIds = state.layout.floors.flatMap(floor => floor.objects.filter(o => o.type === id && o.collapsed).map(o => o.id))

			if (collapsedIds.length > 0) {
				toast.error(`${collapsedIds.length} object(s) collapsed due to overlap - shown in red`)
			}
			await saveBlueprintData()
		})
	}


	async function reorderAssets(fromIndex: number, toIndex: number): Promise<boolean> {
		return withStateLock(async () => {
			if (fromIndex === toIndex) return false
			if (fromIndex < 0 || toIndex < 0) return false
			if (fromIndex >= state.assetRegistry.length || toIndex >= state.assetRegistry.length) return false
			const registry = state.assetRegistry
			const [moved] = registry.splice(fromIndex, 1)
			registry.splice(toIndex, 0, moved)
			return saveBlueprintData()
		})
	}

	async function duplicateAsset(id: string): Promise<AssetDef | null> {
		return withStateLock(async () => {
			const source = state.assetRegistry.find(a => a.id === id)
			if (!source) {
				toast.warning('Asset not found')
				return null
			}
			if (state.assetRegistry.length >= MAX_ASSETS) {
				toast.warning(`Asset limit reached (${MAX_ASSETS})`)
				return null
			}
			const copy: AssetDef = {
				...serializeAsset(source),
				id: genAssetId('custom', `${source.name} copy`, c => state.assetRegistry.some(a => a.id === c)),
				name: `${source.name} copy`,
				origin: 'drawn',
			}

			if (!copy.defaultFillColor) copy.defaultFillColor = '#ffffff'
			state.assetRegistry.push(copy)
			await saveBlueprintData()
			toast.success(`Duplicated "${source.name}" -> "${copy.name}"`)
			return copy
		})
	}

	function removeAssetInstances(assetIds: ReadonlySet<string>): void {
		const removedObjectIds = new Set<string>()
		for (const floor of state.layout.floors) {
			const removed = floor.objects.filter(o => assetIds.has(o.type))
			if (removed.length === 0) continue
			for (const o of removed) removedObjectIds.add(o.id)
			floor.objects = floor.objects.filter(o => !assetIds.has(o.type))
			store.dissolveGroupsIfSmall(floor, new Set(removed.map(o => o.linkGroupId).filter((gid): gid is string => !!gid)))
			recalcCollapsed(floor, assetMap())
		}
		if (removedObjectIds.size > 0) {
			const items = state.selectionState.items.filter(item => !removedObjectIds.has(item.id))
			store.setSelection(items)
		}
	}

	async function deleteAsset(id: string): Promise<boolean> {
		return withStateLock(async () => {
			const idx = state.assetRegistry.findIndex(a => a.id === id)
			if (idx === -1) {
				toast.warning('Asset not found')
				return false
			}
			removeAssetInstances(new Set([id]))
			state.assetRegistry.splice(idx, 1)
			if (state.selectedAssetId === id) state.selectedAssetId = null
			await saveBlueprintData()
			return true
		})
	}

	async function deleteAllAssets(): Promise<number> {
		return withStateLock(async () => {
			const ids = state.assetRegistry.map(a => a.id)
			if (ids.length === 0) return 0
			removeAssetInstances(new Set(ids))
			state.assetRegistry = []
			state.selectedAssetId = null
			await saveBlueprintData()
			return ids.length
		})
	}

	return { addSvgAsset, updateAsset, reorderAssets, duplicateAsset, deleteAsset, deleteAllAssets }
}
