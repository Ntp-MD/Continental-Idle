import type { AssetDef, EntityRef, FloorData, ObjectData, TileState } from '../domain/types'
import { applySvgColorConvention, normalizeInteractConfig, normalizeInteractSpots, normalizeNpcQueueConfig, normalizeTags, resolveObjectDef } from '../domain/types'
import { findAssetCached } from '../assets/assetUtils'
import { normalizeObject, roundedRectPath } from '../domain/geometry'
import { aabbOverlap, recalcCollapsed, unionRects } from '../domain/collision'
import type { BlueprintStore } from './state'
import { genId, genAssetId } from './storeUtils'
import { MAX_ASSETS } from '../limits'

function namespaceSvgIds(svg: string, ns: string): string {
	return svg
		.replace(/\bid="([^"]*)"/g, (_m, v: string) => `id="${ns}-${v}"`)
		.replace(/url\(#/g, `url(#${ns}-`)
		.replace(/xlink:href="#/g, `xlink:href="#${ns}-`)
		.replace(/\shref="#/g, ` href="#${ns}-`)
}

export function createFlattenCommands(store: BlueprintStore) {
	const state = store.state
	const toast = store.toast
	const snap = (value: number, tileSize?: number) => store.snap(value, tileSize)
	const assetMap = () => store.assetMap()
	const currentFloor = store.currentFloor
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)
	const initAssetFields = (asset: AssetDef) => store.initAssetFields(asset)
	const saveBlueprintData = () => store.save()
	const selectedObjectIds = () => store.selectedObjectIds()
	const select = (ref: EntityRef | null) => store.select(ref)
	const clearSelection = () => store.clearSelection()
	const dissolveGroupsIfSmall = (floor: FloorData, ids: ReadonlySet<string>) => store.dissolveGroupsIfSmall(floor, ids)

	async function flattenToSvgAsset(name?: string): Promise<string | null> {
		return withStateLock(async () => {
			const floor = currentFloor.value
			if (!floor) return null
			const ids = selectedObjectIds()
			const byId = new Map(floor.objects.map(o => [o.id, o] as const))
			const objs = ids.map(id => byId.get(id)).filter((object): object is ObjectData => !!object)
			if (objs.length < 2) {
				toast.warning('Select at least 2 items to flatten')
				return null
			}
			if (state.assetRegistry.length >= MAX_ASSETS) {
				toast.warning(`Asset limit reached (${MAX_ASSETS})`)
				return null
			}
			if (objs.some(o => o.locked)) {
				toast.warning('Cannot flatten locked objects - unlock first')
				return null
			}

			let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
			for (const obj of objs) {
				minX = Math.min(minX, obj.x)
				minY = Math.min(minY, obj.y)
				maxX = Math.max(maxX, obj.x + obj.w)
				maxY = Math.max(maxY, obj.y + obj.h)
			}
			if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
			minX = snap(Math.round(minX))
			minY = snap(Math.round(minY))
			maxX = snap(Math.round(maxX))
			maxY = snap(Math.round(maxY))
			const totalW = maxX - minX
			const totalH = maxY - minY
			const t = state.layout.canvas.tileSize
			const amap = assetMap()
			const sourceAssets = objs.map(object => findAssetCached(amap, object.type))
			const mergedTags = normalizeTags([...new Set(sourceAssets.flatMap(asset => asset?.tags ?? []))]) ?? []
			const mergedInteractSources = sourceAssets.map(asset => asset?.interact).filter((value): value is NonNullable<typeof value> => !!value)
			const mergedQueueSources = sourceAssets.map(asset => asset?.queue).filter((value): value is NonNullable<typeof value> => !!value)
			if (mergedInteractSources.length > 1) toast.warning('Flatten keeps the first interact config - review Interact settings on the merged asset')
			if (mergedQueueSources.length > 1) toast.warning('Flatten keeps the first queue config - review Queue settings on the merged asset')
			let droppedEdgeSpots = 0
			const mergedInteractSpots = normalizeInteractSpots(objs.flatMap(object => {
				const asset = findAssetCached(amap, object.type)
				const definition = resolveObjectDef(object.rotation, asset, { w: object.w, h: object.h })
				return (definition.interactSpots ?? []).flatMap(spot => {
					if (spot.kind === 'edge') {
						droppedEdgeSpots++
						return []
					}
					return [{ ...spot, x: spot.x + object.x - minX, y: spot.y + object.y - minY }]
				})
			}))
			if (droppedEdgeSpots > 0) toast.warning(`Flatten drops ${droppedEdgeSpots} edge interact spot(s) - edge rebase is unsupported, review Interact settings on the merged asset`)
			const flatName = (name && name.trim()) || `Flattened ${objs.length}`
			const assetId = genAssetId('custom', flatName, c => state.assetRegistry.some(a => a.id === c))
			const svgParts: string[] = []
			let partIndex = 0
			for (const obj of objs) {
				const asset = findAssetCached(amap, obj.type)
				const ox = obj.x - minX
				const oy = obj.y - minY
				const pad = obj.padding ?? 0
				const dw = obj.w - pad * 2
				const dh = obj.h - pad * 2

				if (asset?.svg && asset.svgViewBox) {
					const vb = asset.svgViewBox
					const scaleX = dw / vb.w
					const scaleY = dh / vb.h
					const rot = obj.rotation || 0
					let transform: string
					if (rot === 0) {
						transform = `translate(${ox + pad}, ${oy + pad}) scale(${scaleX}, ${scaleY})`
					} else if (rot === 90) {
						transform = `translate(${ox + pad + dh}, ${oy + pad}) rotate(90) scale(${scaleY}, ${scaleX})`
					} else if (rot === 180) {
						transform = `translate(${ox + pad + dw}, ${oy + pad + dh}) rotate(180) scale(${scaleX}, ${scaleY})`
					} else {
						transform = `translate(${ox + pad}, ${oy + pad + dh}) rotate(270) scale(${scaleY}, ${scaleX})`
					}
					svgParts.push(`<g transform="${transform}">${namespaceSvgIds(asset.svg, `${assetId}-p${partIndex}`)}</g>`)
					partIndex++
				} else {
					const fill = obj.fillColor || asset?.defaultFillColor || 'var(--text-primary)'
					const stroke = obj.strokeColor || asset?.defaultStrokeColor || 'var(--text-secondary)'
					const rx = obj.rx
					const rounded = rx ? roundedRectPath(ox + pad, oy + pad, dw, dh, rx) : null
					let body: string
					if (rounded) {
						body = `<path d="${rounded}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`
					} else {
						body = `<rect x="${ox + pad}" y="${oy + pad}" width="${dw}" height="${dh}" fill="${fill}" stroke="${stroke}" stroke-width="1" rx="${obj.radius ?? 0}"/>`
					}
					const rot = ((obj.rotation % 360) + 360) % 360
					svgParts.push(rot === 0 ? body : `<g transform="rotate(${rot} ${ox + pad + dw / 2} ${oy + pad + dh / 2})">${body}</g>`)
				}
			}

			const vbW = totalW
			const vbH = totalH
			const innerSvg = svgParts.join('\n  ')

			const gridW = Math.max(1, Math.round(totalW / t))
			const gridH = Math.max(1, Math.round(totalH / t))
			const asset: AssetDef = {
				origin: 'flattened',
				id: assetId,
				name: flatName,
				w: gridW,
				h: gridH,
				walkable: true,
				defaultFillColor: '#ffffff',
				walkableGrid: Array.from({ length: gridH }, () => Array.from({ length: gridW }, () => true)),
				tileStates: Array.from({ length: gridH }, () => Array.from({ length: gridW }, () => 'walkable' as TileState)),
				svg: applySvgColorConvention(innerSvg),
				svgViewBox: { w: vbW, h: vbH },
				...(mergedTags.length ? { tags: mergedTags } : {}),
				...(mergedInteractSources[0] ? { interact: normalizeInteractConfig(mergedInteractSources[0]) ?? mergedInteractSources[0] } : {}),
				...(mergedInteractSpots?.length ? { interactSpots: mergedInteractSpots } : {}),
				...(mergedQueueSources[0] ? { queue: normalizeNpcQueueConfig(mergedQueueSources[0]) ?? mergedQueueSources[0] } : {}),
				...(sourceAssets.some(asset => asset?.doorRequired) ? { doorRequired: true } : {}),
			}

			initAssetFields(asset)
			state.assetRegistry.push(asset)

			const newObj: ObjectData = {
				id: genId('obj'),
				type: assetId,
				rotation: 0,
				x: minX,
				y: minY,
				w: totalW,
				h: totalH,
			}
			normalizeObject(newObj, t, assetMap())

			const removeIds = new Set(objs.map(o => o.id))
			if (floor.objects.some(o => !removeIds.has(o.id) && aabbOverlap(newObj, o))) {
				toast.warning('Flattened asset overlaps another object - SVG art skips collision checks, review placement')
			}
			const removedGroupIds = new Set(objs.map(o => o.linkGroupId).filter((id): id is string => !!id))
			floor.objects = floor.objects.filter(o => !removeIds.has(o.id))
			floor.objects.push(newObj)
			dissolveGroupsIfSmall(floor, removedGroupIds)

			recalcCollapsed(floor, assetMap(), unionRects([...objs, newObj]) ?? undefined)
			clearSelection()
			select({ type: 'object', id: newObj.id })
			await saveBlueprintData()

			toast.success(`Merged ${objs.length} objects into "${flatName}"`)
			return assetId
		})
	}

	return { flattenToSvgAsset }
}
