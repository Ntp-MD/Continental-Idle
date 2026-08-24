import type { ObjectData, AssetDef, LinkedPart, Rotation, EntityRef } from '../types'
import { applySvgColorConvention, isValidColor } from '../types'
import { findAssetCached } from '../assetUtils'
import { assetSizeFor, buildingArea, normalizeObject } from '../geometry'
import { aabbOverlap, objectOverlapsAny, recalcCollapsed } from '../collision'
import {
	state, toast, snap, clamp, assetMap,
	currentFloor, withStateLock, initAssetFields,
} from './state'
import { genId } from './utils'
import { selectedObject, selectedObjectIds, select as selectEntity, clearSelection, toggleMultiSelect as toggleMultiSelectEntity } from './selection'
import { getLinkedObjects } from './utils'
import { saveLayout, saveAssets } from './persistence'

export async function beginDrawnObject(name: string, w: number, h: number, x: number, y: number): Promise<{ asset: AssetDef; object: ObjectData } | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return null
		const t = state.layout.canvas.tileSize
		const asset: AssetDef = { origin: 'drawn', id: genId('custom'), name, w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) }
		initAssetFields(asset)
		const rect = clamp({ x: snap(x), y: snap(y), w: asset.w * t, h: asset.h * t })
		if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
			toast.warning('Cannot place object - overlaps existing object')
			return null
		}
		const object: ObjectData = { id: genId('obj'), subId: genId('sub'), type: asset.id, rotation: 0, ...rect }
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
		const aw = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
		const ah = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
		const w = snap(aw)
		const h = snap(ah)
		const rect = clamp({ x: snap(x), y: snap(y), w, h })

		if (asset.linkedParts) {
			const parts = asset.linkedParts
			const partRects = parts.map(p => ({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) }))
			const c = state.layout.canvas
			const b = buildingArea(c.width, c.height, c.tileSize)
			const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
			const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
			const overflowX = Math.max(0, groupMaxX - (b.x + b.w))
			const overflowY = Math.max(0, groupMaxY - (b.y + b.h))
			if (overflowX > 0 || overflowY > 0) {
				for (const pr of partRects) {
					pr.x = Math.max(b.x, pr.x - overflowX)
					pr.y = Math.max(b.y, pr.y - overflowY)
				}
			}
			for (const pr of partRects) {
				if (floor.objects.some(o => aabbOverlap(pr, o))) {
					toast.warning('Cannot place - one or more parts overlap existing objects')
					return null
				}
			}
			const newIds: string[] = []
			for (let i = 0; i < parts.length; i++) {
				const p = parts[i]
				const pr = partRects[i]

				const obj: ObjectData = {
					id: genId('obj'),
					subId: genId('sub'),
					type: p.type,
					rotation: p.rotation ?? 0,
					...pr,
				}
				floor.objects.push(obj)
				normalizeObject(obj, t, assetMap())
				newIds.push(obj.id)
			}
			const linkGroupId = genId('link')
			for (const id of newIds) {
				const obj = floor.objects.find(o => o.id === id)!
				obj.linkGroupId = linkGroupId
			}
			state.selectionState = { primary: { type: 'object', id: newIds[0] }, items: newIds.map(id => ({ type: 'object' as const, id })) }
			await saveLayout()
			return floor.objects.find(o => o.id === newIds[0]) ?? null
		}

		if (objectOverlapsAny(floor.objects, assetMap(), rect)) {
			toast.warning('Cannot place object - overlaps existing object')
			return null
		}
		const obj: ObjectData = {
			id: genId('obj'), subId: genId('sub'), type, rotation: 0,
			x: rect.x, y: rect.y, w: rect.w, h: rect.h,
		}
		normalizeObject(obj, t, assetMap())
		floor.objects.push(obj)
		state.selectionState = { primary: { type: 'object', id: obj.id }, items: [{ type: 'object', id: obj.id }] }
		await saveLayout()
		return obj
	})
}

export function canPlaceObject(type: string, x: number, y: number): boolean {
	const asset = findAssetCached(assetMap(), type)
	if (!asset) return false
	const t = state.layout.canvas.tileSize
	const aw = asset.usePx ? (asset.pxW ?? asset.w * t) : asset.w * t
	const ah = asset.usePx ? (asset.pxH ?? asset.h * t) : asset.h * t
	const w = snap(aw)
	const h = snap(ah)
	const rect = clamp({ x: snap(x), y: snap(y), w, h })
	if (asset.svg) {
		return !objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect)
	}
	if (asset.linkedParts) {
		const partRects = asset.linkedParts.map(p =>
			({ x: snap(rect.x + p.dx), y: snap(rect.y + p.dy), w: snap(p.w), h: snap(p.h) })
		)
		const c = state.layout.canvas
		const b = buildingArea(c.width, c.height, c.tileSize)
		const groupMaxX = Math.max(...partRects.map(r => r.x + r.w))
		const groupMaxY = Math.max(...partRects.map(r => r.y + r.h))
		const overflowX = Math.max(0, groupMaxX - (b.x + b.w))
		const overflowY = Math.max(0, groupMaxY - (b.y + b.h))
		if (overflowX > 0 || overflowY > 0) {
			for (const pr of partRects) {
				pr.x = Math.max(b.x, pr.x - overflowX)
				pr.y = Math.max(b.y, pr.y - overflowY)
			}
		}
		const currentObjects = currentFloor.value?.objects ?? []
		return partRects.every(pr => !objectOverlapsAny(currentObjects, assetMap(), pr))
	}
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
			const saved = await saveLayout()
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
		const saved = await saveLayout()
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
		if (!anchor || members.length === 0 || members.some(member => member.locked)) return
		moveMembersTo(members, anchor, x, y)
		return
	}

	const primary = state.selectionState.primary
	if (!primary) return
	const obj = selectedObject()
	if (!obj || obj.locked) return
	moveMembersTo(objectMoveMembers(obj), obj, x, y)
	obj.collapsed = floor.objects.some(other => other.id !== obj.id && aabbOverlap(obj, other))
}

export async function commitMove(): Promise<void> {
	const floor = currentFloor.value
	if (!floor) return
	const members = state.selectionState.items.length > 1
		? multiSelectionMembers(floor)
		: selectedObject() ? objectMoveMembers(selectedObject()!) : []
	if (members.length === 0 || members.some(member => member.locked)) return
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
	await saveLayout()
}

export async function rotateSelected(): Promise<void> {
	return withStateLock(async () => {
		if (state.selectionState.primary?.type !== 'object') return
		const o = selectedObject()
		if (!o) return
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
		await saveLayout()
	})
}


export type ObjectInstancePatch = Partial<Pick<ObjectData, 'x' | 'y' | 'fillColor' | 'strokeColor'>>

export async function updateObjectProps(patch: ObjectInstancePatch): Promise<boolean> {
	return withStateLock(async () => {
		const o = selectedObject()
		if (!o) return false
		if (o.locked) {
			toast.warning('Object is locked - unlock to edit properties')
			return false
		}
		const needsSize = patch.x !== undefined || patch.y !== undefined
		const sz = assetSizeFor(o.type, o.rotation, state.layout.canvas.tileSize, assetMap())
		const w = sz?.w ?? o.w
		const h = sz?.h ?? o.h
		const rect = clamp({
			x: patch.x ?? o.x, y: patch.y ?? o.y,
			w, h,
		})
		if (needsSize && objectOverlapsAny(currentFloor.value?.objects ?? [], assetMap(), rect, o.id)) {
			return false
		}
		for (const field of ['fillColor', 'strokeColor'] as const) {
			const value = patch[field]
			if (value === undefined) continue
			const trimmed = value.trim()
			if (trimmed === '') {
				if (o[field] !== undefined) o[field] = undefined
				continue
			}
			if (!isValidColor(trimmed)) {
				toast.warning(`Invalid ${field === 'fillColor' ? 'fill' : 'stroke'} color`)
				return false
			}
			if (o[field] !== trimmed) o[field] = trimmed
		}
		const changed = (patch.x !== undefined && o.x !== rect.x) ||
			(patch.y !== undefined && o.y !== rect.y) ||
			(needsSize && (o.w !== w || o.h !== h)) ||
			patch.fillColor !== undefined || patch.strokeColor !== undefined
		if (!changed) return true
		if (patch.x !== undefined) o.x = rect.x
		if (patch.y !== undefined) o.y = rect.y
		if (needsSize) {
			o.w = w
			o.h = h
		}
		const cf = currentFloor.value
		if (cf) recalcCollapsed(cf, assetMap())
		await saveLayout()
		return true
	}).catch(e => {
		if (e instanceof Error && e.message === 'Operation in progress') {
			toast.warning('Operation in progress')
			return false
		}
		throw e
	})
}

export async function createLinkedAssetFromSelection(name?: string): Promise<string | null> {
	const floor = currentFloor.value
	if (!floor) return null
	const ids = selectedObjectIds()
	if (ids.length < 2) {
		toast.warning('Select at least 2 objects first (Shift+click)')
		return null
	}

	const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
	if (objs.length < 2) return null
	if (objs.some(o => o.locked)) {
		toast.warning('Cannot link locked objects - unlock first')
		return null
	}

	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
	for (const obj of objs) {
		minX = Math.min(minX, obj.x)
		minY = Math.min(minY, obj.y)
		maxX = Math.max(maxX, obj.x + obj.w)
		maxY = Math.max(maxY, obj.y + obj.h)
	}
	minX = snap(Math.round(minX))
	minY = snap(Math.round(minY))
	maxX = snap(Math.round(maxX))
	maxY = snap(Math.round(maxY))

	const totalW = maxX - minX
	const totalH = maxY - minY
	const t = state.layout.canvas.tileSize

	const linkedParts: LinkedPart[] = objs.map(obj => {
		const part: LinkedPart = {
			type: obj.type,
			dx: snap(Math.round(obj.x - minX)),
			dy: snap(Math.round(obj.y - minY)),
			w: snap(Math.round(obj.w)),
			h: snap(Math.round(obj.h)),
			rotation: obj.rotation,
		}
		if (obj.padding !== undefined) part.padding = obj.padding
		if (obj.rx) part.rx = { ...obj.rx }
		if (obj.fillColor) part.fillColor = obj.fillColor
		if (obj.label) part.label = obj.label
		return part
	})

	const safeName = (name && name.trim()) || `Linked Set ${objs.length}`
	const assetId = genId('linked')
	const assetDef: AssetDef = {
		origin: 'linked',
		id: assetId,
		name: safeName,
		w: Math.round(totalW / t),
		h: Math.round(totalH / t),
		linkedParts,
	}

	state.assetRegistry.push(assetDef)

	await saveAssets()
	toast.success(`Created "${safeName}" linked asset`)
	return assetId
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
	const saved = await saveLayout()
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
	const saved = await saveLayout()
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
	const saved = await saveLayout()
	if (saved) toast.info(o.locked ? 'Object locked' : 'Object unlocked')
}

export async function flattenToSvgAsset(name?: string): Promise<string | null> {
	return withStateLock(async () => {
		const floor = currentFloor.value
		if (!floor) return null
		const ids = selectedObjectIds()
		if (ids.length < 2) {
			toast.warning('Select at least 2 objects to flatten')
			return null
		}
		const objs = ids.map(id => floor.objects.find(o => o.id === id)).filter(Boolean) as ObjectData[]
		if (objs.length < 2) return null
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
		minX = snap(Math.round(minX))
		minY = snap(Math.round(minY))
		maxX = snap(Math.round(maxX))
		maxY = snap(Math.round(maxY))
		const totalW = maxX - minX
		const totalH = maxY - minY
		const t = state.layout.canvas.tileSize

		const amap = assetMap()
		const svgParts: string[] = []
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
				svgParts.push(`<g transform="${transform}">${asset.svg}</g>`)
			} else {
				const fill = obj.fillColor || asset?.defaultBgColor || 'var(--text-bright)'
				const rx = obj.rx
				if (rx) {
					const maxR = Math.min(dw, dh) / 2
					const r = (v: number) => Math.max(0, Math.min(v, maxR))
					const rtl = r(rx.tl), rtr = r(rx.tr), rbr = r(rx.br), rbl = r(rx.bl)
					svgParts.push(`<path d="M ${ox + pad + rtl} ${oy + pad} L ${ox + pad + dw - rtr} ${oy + pad} Q ${ox + pad + dw} ${oy + pad} ${ox + pad + dw} ${oy + pad + rtr} L ${ox + pad + dw} ${oy + pad + dh - rbr} Q ${ox + pad + dw} ${oy + pad + dh} ${ox + pad + dw - rbr} ${oy + pad + dh} L ${ox + pad + rtl} ${oy + pad + dh} Q ${ox + pad} ${oy + pad + dh} ${ox + pad} ${oy + pad + dh - rbl} L ${ox + pad} ${oy + pad + rtl} Q ${ox + pad} ${oy + pad} ${ox + pad + rtl} ${oy + pad} Z" fill="${fill}" stroke="var(--text-primary)" stroke-width="1"/>`)
				} else {
					svgParts.push(`<rect x="${ox + pad}" y="${oy + pad}" width="${dw}" height="${dh}" fill="${fill}" stroke="var(--border-dim)" stroke-width="1" rx="${obj.radius ?? 0}"/>`)
				}
			}
		}

		const safeName = (name && name.trim()) || `Flattened ${objs.length}`
		const assetId = genId('custom')
		const vbW = totalW
		const vbH = totalH
		const innerSvg = svgParts.join('\n  ')

		const asset: AssetDef = {
			origin: 'flattened',
			id: assetId,
			name: safeName,
			w: Math.round(totalW / t),
			h: Math.round(totalH / t),
			svg: applySvgColorConvention(innerSvg),
			svgViewBox: { w: vbW, h: vbH },
		}

		initAssetFields(asset)
		state.assetRegistry.push(asset)

		const newObj: ObjectData = {
			id: genId('obj'),
			subId: genId('sub'),
			type: assetId,
			rotation: 0,
			x: minX,
			y: minY,
			w: totalW,
			h: totalH,
		}


		const removeIds = new Set(objs.map(o => o.id))
		floor.objects = floor.objects.filter(o => !removeIds.has(o.id))
		floor.objects.push(newObj)

		recalcCollapsed(floor, assetMap())
		clearSelection()
		selectEntity({ type: 'object', id: newObj.id })
		await saveAssets()
		await saveLayout()

		toast.success(`Flattened ${objs.length} objects into "${safeName}" — independent asset, no unlink needed`)
		return assetId
	})
}
