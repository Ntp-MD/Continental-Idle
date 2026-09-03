import type { ObjectData, AssetDef, Rotation, EntityRef, TileState, WallSegment } from '../domain/types'
import { CANVAS_WALL_OBJECT_TYPE, applySvgColorConvention, normalizeWallSegment, resolveObjectDef, resolveWallSegmentsForObject, assetPixelSize } from '../domain/types'
import { findAssetCached, wallSegmentToObjectRect } from '../assets/assetUtils'
import { buildingArea, normalizeObject } from '../domain/geometry'
import { aabbOverlap, objectOverlapsAny, recalcCollapsed } from '../domain/collision'
import {
	state, toast, snap, clamp, assetMap, wallSelection,
	currentFloor, withStateLock, initAssetFields,
} from './state'
import { genId, genAssetId } from './storeUtils'
import { selectedObject, selectedObjectIds, select as selectEntity, clearSelection, toggleMultiSelect as toggleMultiSelectEntity } from './selection'
import { saveBlueprintData } from './persistence'

export function getLinkedObjects(obj: ObjectData): ObjectData[] {
	const floor = currentFloor.value
	if (!floor || !obj.linkGroupId) return []
	return floor.objects.filter(o => o.id !== obj.id && o.linkGroupId === obj.linkGroupId)
}

function canvasWallObject(segment: WallSegment, tileSize: number): ObjectData | null {
	const normalized = normalizeWallSegment(segment)
	if (!normalized || tileSize <= 0) return null
	const rect = wallSegmentToObjectRect(normalized, tileSize)
	return {
		id: genId('wall'),
		type: CANVAS_WALL_OBJECT_TYPE,
		x: rect.x,
		y: rect.y,
		w: rect.w,
		h: rect.h,
		rotation: 0,
		isWall: true,
		x1: normalized.x1,
		y1: normalized.y1,
		x2: normalized.x2,
		y2: normalized.y2,
		door: normalized.door,
	}
}

export async function replaceCanvasWallSegments(floorId: string, segments: readonly WallSegment[]): Promise<boolean> {
	const floor = state.layout.floors.find(item => item.id === floorId)
	if (!floor) return false
	const tileSize = state.layout.canvas.tileSize
	const walls = segments.map(segment => canvasWallObject(segment, tileSize)).filter((wall): wall is ObjectData => !!wall)
	floor.objects = [...floor.objects.filter(object => object.type !== CANVAS_WALL_OBJECT_TYPE), ...walls]
	recalcCollapsed(floor, assetMap())
	return saveBlueprintData()
}

export async function beginDrawnObject(name: string, w: number, h: number, x: number, y: number): Promise<{ asset: AssetDef; object: ObjectData } | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return null
		const safeName = name.trim()
		if (!safeName || safeName.length > 512 || !Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(x) || !Number.isFinite(y) || w <= 0 || h <= 0 || w > 10_000 || h > 10_000) {
			toast.warning('Drawn asset input is invalid')
			return null
		}
		const t = state.layout.canvas.tileSize
		const asset: AssetDef = { origin: 'drawn', id: genAssetId('custom', safeName, c => state.assetRegistry.some(a => a.id === c)), name: safeName, w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)), defaultFillColor: '#ffffff' }
		initAssetFields(asset)
		const rect = clamp({ x: snap(x), y: snap(y), w: asset.w * t, h: asset.h * t })
		if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
			toast.warning('Cannot place object - overlaps existing object')
			return null
		}
		const object: ObjectData = { id: genId('obj'), type: asset.id, rotation: 0, ...rect }
		normalizeObject(object, t, new Map([...assetMap(), [asset.id, asset]]))
		state.assetRegistry.push(asset)
		floor.objects.push(object)
		state.selectionState = { primary: { type: 'object', id: object.id }, items: [{ type: 'object', id: object.id }] }
		return { asset, object }
	})
}

export async function addObject(type: string, x: number, y: number): Promise<ObjectData | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		const asset = findAssetCached(assetMap(), type)
		if (!floor || !asset) return null
		const t = state.layout.canvas.tileSize
		const { w: aw, h: ah } = assetPixelSize(asset, t)
		const w = snap(aw)
		const h = snap(ah)
		const rect = clamp({ x: snap(x), y: snap(y), w, h })

		if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
			toast.warning('Cannot place object - overlaps existing object')
			return null
		}
		const obj: ObjectData = {
			id: genId('obj'), type, rotation: 0,
			x: rect.x, y: rect.y, w: rect.w, h: rect.h,
		}
		normalizeObject(obj, t, assetMap())
		floor.objects.push(obj)
		state.selectionState = { primary: { type: 'object', id: obj.id }, items: [{ type: 'object', id: obj.id }] }
		await saveBlueprintData()
		return obj
	})
}

export function canPlaceObject(type: string, x: number, y: number): boolean {
	const asset = findAssetCached(assetMap(), type)
	if (!asset) return false
	const t = state.layout.canvas.tileSize
	const { w: aw, h: ah } = assetPixelSize(asset, t)
	const w = snap(aw)
	const h = snap(ah)
	const rect = clamp({ x: snap(x), y: snap(y), w, h })
	return !objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect)
}

export function select(ref: EntityRef | null): void {
	selectEntity(ref)
}

export function toggleMultiSelect(id: string): void {
	toggleMultiSelectEntity(id)
}

export async function deleteSelected(): Promise<void> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return

		const objIds = selectedObjectIds()
		if (objIds.length > 0) {
			const ids = objIds.filter(id => {
				const o = floor.objects.find(o => o.id === id)
				return !o?.locked
			})
			if (ids.length === 0) {
				toast.warning('All selected objects are locked')
				return
			}
			if (ids.length < objIds.length) {
				toast.info(`${objIds.length - ids.length} locked object(s) skipped`)
			}
			const removedGroupIds = new Set(floor.objects.filter(o => ids.includes(o.id)).map(o => o.linkGroupId).filter((id): id is string => !!id))
			floor.objects = floor.objects.filter(o => !ids.includes(o.id))
			for (const o of floor.objects) {
				if (o.linkGroupId && removedGroupIds.has(o.linkGroupId)) {
					const remaining = floor.objects.filter(candidate => candidate.linkGroupId === o.linkGroupId)
					if (remaining.length < 2) delete o.linkGroupId
				}
			}
			clearSelection()
			recalcCollapsed(floor, assetMap())
			const saved = await saveBlueprintData()
			if (saved) toast.success(`${ids.length} object${ids.length === 1 ? '' : 's'} deleted`)
			return
		}

		const primary = state.selectionState.primary
		if (!primary) return
		const o = floor.objects.find(o => o.id === primary.id)
		if (o?.locked) {
			toast.warning('Cannot delete a locked object - unlock first')
			return
		}
		const deletedGroupId = o?.linkGroupId
		floor.objects = floor.objects.filter(o => o.id !== primary.id)
		if (deletedGroupId) {
			const remainingGroup = floor.objects.filter(o => o.linkGroupId === deletedGroupId)
			if (remainingGroup.length <= 1) {
				for (const member of remainingGroup) delete member.linkGroupId
			}
		}
		clearSelection()
		recalcCollapsed(floor, assetMap())
		const saved = await saveBlueprintData()
		if (saved) toast.success('Object deleted')
	})
}

function objectMoveMembers(obj: ObjectData): ObjectData[] {
	const members: ObjectData[] = [obj]
	const seen = new Set([obj.id])
	for (const linkedObj of getLinkedObjects(obj)) {
		if (!seen.has(linkedObj.id)) {
			seen.add(linkedObj.id)
			members.push(linkedObj)
		}
	}
	return members
}

function multiSelectionMembers(floor: { objects: ObjectData[] }): ObjectData[] {
	if (state.selectionState.items.length <= 1) return []
	const members: ObjectData[] = []
	const seen = new Set<string>()
	for (const item of state.selectionState.items) {
		const obj = floor.objects.find(o => o.id === item.id)
		if (!obj) continue
		for (const member of objectMoveMembers(obj)) {
			if (!seen.has(member.id)) {
				seen.add(member.id)
				members.push(member)
			}
		}
	}
	return members
}

function moveMembersTo(members: ObjectData[], anchor: ObjectData, x: number, y: number): boolean {
	if (members.some(member => member.locked)) return false
	const minX = Math.min(...members.map(member => member.x))
	const minY = Math.min(...members.map(member => member.y))
	const maxX = Math.max(...members.map(member => member.x + member.w))
	const maxY = Math.max(...members.map(member => member.y + member.h))
	const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
	const c = state.layout.canvas
	const b = buildingArea(c.width, c.height, c.tileSize)
	const requestedDx = x - anchor.x
	const requestedDy = y - anchor.y
	const minDx = b.x - bounds.minX
	const maxDx = (b.x + b.w) - (bounds.minX + bounds.w)
	const minDy = b.y - bounds.minY
	const maxDy = (b.y + b.h) - (bounds.minY + bounds.h)
	const dx = Math.max(minDx, Math.min(requestedDx, maxDx))
	const dy = Math.max(minDy, Math.min(requestedDy, maxDy))
	for (const member of members) {
		member.x += dx
		member.y += dy
	}
	return dx !== 0 || dy !== 0
}

export function moveSelectedTo(x: number, y: number): void {
	const floor = currentFloor.value
	if (!floor) return

	if (state.selectionState.items.length > 1) {
		const members = multiSelectionMembers(floor)
		const primary = state.selectionState.primary
		const anchor = primary ? floor.objects.find(object => object.id === primary.id) : null
		if (!anchor || members.length === 0 || members.some(member => member.locked || member.isWall)) return
		moveMembersTo(members, anchor, x, y)
		return
	}

	const primary = state.selectionState.primary
	if (!primary) return
	const obj = selectedObject()
	if (!obj || obj.locked || obj.isWall) return
	moveMembersTo(objectMoveMembers(obj), obj, x, y)
	obj.collapsed = floor.objects.some(other => other.id !== obj.id && aabbOverlap(obj, other))
}

export async function commitMove(): Promise<void> {
	const floor = currentFloor.value
	if (!floor) return
	const members = state.selectionState.items.length > 1
		? multiSelectionMembers(floor)
		: selectedObject() ? objectMoveMembers(selectedObject()!) : []
	if (members.length === 0 || members.some(member => member.locked || member.isWall)) return
	const minX = Math.min(...members.map(member => member.x))
	const minY = Math.min(...members.map(member => member.y))
	const maxX = Math.max(...members.map(member => member.x + member.w))
	const maxY = Math.max(...members.map(member => member.y + member.h))
	const bounds = { minX, minY, w: maxX - minX, h: maxY - minY }
	const clamped = clamp({ x: snap(bounds.minX), y: snap(bounds.minY), w: bounds.w, h: bounds.h })
	const dx = clamped.x - bounds.minX
	const dy = clamped.y - bounds.minY
	const oldPositions = members.map(member => ({ id: member.id, x: member.x, y: member.y }))
	for (const member of members) {
		member.x += dx
		member.y += dy
	}
	const ids = members.map(member => member.id)
	if (members.some(member => objectOverlapsAny(floor.objects, assetMap(), member, ids))) {
		for (const old of oldPositions) {
			const member = members.find(candidate => candidate.id === old.id)
			if (member) { member.x = old.x; member.y = old.y }
		}
	}
	recalcCollapsed(floor, assetMap())
	await saveBlueprintData()
}

export async function rotateSelected(): Promise<void> {
	return withStateLock(async () => {
		if (state.selectionState.primary?.type !== 'object') return
		const o = selectedObject()
		if (!o || o.isWall) return
		if (o.locked) {
			toast.warning('Cannot rotate a locked object - unlock first')
			return
		}
		if (o.linkGroupId) {
			toast.warning('Cannot rotate a linked object - unlink first')
			return
		}
		const rect = clamp({ x: o.x, y: o.y, w: o.h, h: o.w })
		if (objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect, o.id)) {
			toast.warning('Cannot rotate - would overlap another object')
			return
		}
		const nw = o.h
		const nh = o.w
		o.w = nw
		o.h = nh
		o.rotation = ((o.rotation + 90) % 360) as Rotation
		o.x = rect.x
		o.y = rect.y
		if (o.rx) {
			const { tl, tr, br, bl } = o.rx
			o.rx = { tl: bl, tr: tl, br: tr, bl: br }
		}

		const cf = currentFloor.value
		if (cf) recalcCollapsed(cf, assetMap())
		const saved = await saveBlueprintData()
		if (saved) {
			const def = resolveObjectDef(o.rotation, findAssetCached(assetMap(), o.type), { w: o.w, h: o.h })
			const hasWalkData = !!def.walkableGrid && def.walkableGrid.some(row => row.some(cell => !cell))
			toast.info(
				hasWalkData
					? 'Rotated 90deg - walkable/blocked tiles rotated with it. Review in Walkable Grid panel if the layout matters.'
					: 'Rotated 90deg',
			)
		}
	})
}


interface SelectedWallInput {
	floorId: string
	objectId: string
	segment: WallSegment
}

export async function linkObjects(ids: string[]): Promise<boolean> {
	const floor = currentFloor.value
	if (!floor || ids.length < 2) return false
	const objs = floor.objects.filter(o => ids.includes(o.id))
	if (objs.length < 2) {
		toast.warning('Some selected objects not found on current floor')
		return false
	}
	if (objs.some(o => o.locked)) {
		toast.warning('Cannot link locked objects - unlock first')
		return false
	}
	if (objs.some(o => o.isWall)) {
		toast.warning('Canvas wall objects cannot be linked')
		return false
	}

	const groupIds = new Set<string>(objs.map(obj => obj.id))
	for (const obj of objs) {
		for (const linked of getLinkedObjects(obj)) groupIds.add(linked.id)
	}
	const allGroupIds = Array.from(groupIds)
	const linkGroupId = genId('link')
	for (const id of allGroupIds) {
		const obj = floor.objects.find(o => o.id === id)
		if (obj) {
			obj.linkGroupId = linkGroupId
		}
	}
	const saved = await saveBlueprintData()
	if (!saved) return false
	toast.success(`Linked ${allGroupIds.length} objects`)
	return true
}

export async function unlinkObject(id: string): Promise<boolean> {
	const floor = currentFloor.value
	if (!floor) return false
	const obj = floor.objects.find(o => o.id === id)
	if (!obj || !obj.linkGroupId) return false
	if (obj.locked) {
		toast.warning('Cannot unlink a locked object - unlock first')
		return false
	}

	const groupId = obj.linkGroupId
	for (const member of floor.objects) {
		if (member.linkGroupId === groupId) delete member.linkGroupId
	}
	const saved = await saveBlueprintData()
	if (!saved) return false
	toast.success('Unlinked object')
	return true
}

export async function toggleObjectLock(id: string): Promise<void> {
	const floor = currentFloor.value
	if (!floor) return
	const o = floor.objects.find(o => o.id === id)
	if (!o) return
	o.locked = !o.locked
	const saved = await saveBlueprintData()
	if (saved) toast.info(o.locked ? 'Object locked' : 'Object unlocked')
}

function namespaceSvgIds(svg: string, ns: string): string {
	return svg
		.replace(/\bid="([^"]*)"/g, (_m, v: string) => `id="${ns}-${v}"`)
		.replace(/url\(#/g, `url(#${ns}-`)
		.replace(/xlink:href="#/g, `xlink:href="#${ns}-`)
		.replace(/\shref="#/g, ` href="#${ns}-`)
}

export async function flattenToSvgAsset(name?: string, walls?: readonly SelectedWallInput[]): Promise<string | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return null
		const ids = selectedObjectIds()
		const selectedWalls = walls ?? wallSelection.value.filter(selection => selection.floorId === floor.id)
		const selectedWallIds = new Set(selectedWalls.map(selection => selection.objectId))
		const wallObjs = floor.objects.filter(object => object.type === CANVAS_WALL_OBJECT_TYPE && (ids.includes(object.id) || selectedWallIds.has(object.id)))
		const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter((object): object is ObjectData => !!object && object.type !== CANVAS_WALL_OBJECT_TYPE)
		const selectedSegments = [
			...wallObjs.flatMap(object => [object.x1, object.y1, object.x2, object.y2].every((value): value is number => typeof value === 'number')
				? [{ x1: object.x1! * state.layout.canvas.tileSize, y1: object.y1! * state.layout.canvas.tileSize, x2: object.x2! * state.layout.canvas.tileSize, y2: object.y2! * state.layout.canvas.tileSize, door: object.door === true }]
				: []),
			...selectedWalls.filter(selection => !wallObjs.some(object => object.id === selection.objectId)).map(selection => selection.segment),
		]
		if (objs.length + selectedSegments.length < 2) {
			toast.warning('Select at least 2 items to flatten')
			return null
		}
		if ([...objs, ...wallObjs].some(o => o.locked)) {
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
		for (const seg of selectedSegments) {
			minX = Math.min(minX, seg.x1, seg.x2)
			minY = Math.min(minY, seg.y1, seg.y2)
			maxX = Math.max(maxX, seg.x1, seg.x2)
			maxY = Math.max(maxY, seg.y1, seg.y2)
		}
		if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
		minX = snap(Math.round(minX))
		minY = snap(Math.round(minY))
		maxX = snap(Math.round(maxX))
		maxY = snap(Math.round(maxY))
		const totalW = maxX - minX
		const totalH = maxY - minY
		const t = state.layout.canvas.tileSize
		const sourceAssetWalls = objs.flatMap(object => {
			const asset = findAssetCached(assetMap(), object.type)
			return asset?.wallSegments?.length ? resolveWallSegmentsForObject(asset.wallSegments, asset, object, t) : []
		})
		selectedSegments.push(...sourceAssetWalls)

		const amap = assetMap()
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
				let body: string
				if (rx) {
					const maxR = Math.min(dw, dh) / 2
					const r = (v: number) => Math.max(0, Math.min(v, maxR))
					const rtl = r(rx.tl), rtr = r(rx.tr), rbr = r(rx.br), rbl = r(rx.bl)
					body = `<path d="M ${ox + pad + rtl} ${oy + pad} L ${ox + pad + dw - rtr} ${oy + pad} Q ${ox + pad + dw} ${oy + pad} ${ox + pad + dw} ${oy + pad + rtr} L ${ox + pad + dw} ${oy + pad + dh - rbr} Q ${ox + pad + dw} ${oy + pad + dh} ${ox + pad + dw - rbr} ${oy + pad + dh} L ${ox + pad + rtl} ${oy + pad + dh} Q ${ox + pad} ${oy + pad + dh} ${ox + pad} ${oy + pad + dh - rbl} L ${ox + pad} ${oy + pad + rtl} Q ${ox + pad} ${oy + pad} ${ox + pad + rtl} ${oy + pad} Z" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`
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
			walkable: false,
			defaultFillColor: '#ffffff',
			walkableGrid: Array.from({ length: gridH }, () => Array.from({ length: gridW }, () => false)),
			tileStates: Array.from({ length: gridH }, () => Array.from({ length: gridW }, () => 'blocked' as TileState)),
			svg: applySvgColorConvention(innerSvg),
			svgViewBox: { w: vbW, h: vbH },
		}

		if (selectedSegments.length) {
			asset.wallSegments = selectedSegments.map(segment => ({
				x1: (segment.x1 - minX) / t,
				y1: (segment.y1 - minY) / t,
				x2: (segment.x2 - minX) / t,
				y2: (segment.y2 - minY) / t,
				door: segment.door === true,
			}))
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


		const removeIds = new Set([...objs, ...wallObjs].map(o => o.id))
		floor.objects = floor.objects.filter(o => !removeIds.has(o.id))
		floor.objects.push(newObj)

		recalcCollapsed(floor, assetMap())
		clearSelection()
		wallSelection.value = []
		selectEntity({ type: 'object', id: newObj.id })
		await saveBlueprintData()

		toast.success(selectedSegments.length
			? `Merged ${objs.length} object${objs.length === 1 ? '' : 's'} + ${selectedSegments.length} wall${selectedSegments.length === 1 ? '' : 's'} into "${flatName}"`
			: `Merged ${objs.length} objects into "${flatName}"`)
		return assetId
	})
}
