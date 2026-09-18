import type { Rotation } from './primitives'
import type { InteractConfig, InteractSpot, NpcQueueConfig } from './interact'
import type { TileState, WalkableGrid } from './walkable'
import { MAX_OBJECTS_PER_FLOOR } from '../../limits'
import { MAX_PIXEL_DIMENSION, isFiniteNumber, isRecord, isValidColor, normalizeIdentifier, normalizeText } from './helpers'

export function normalizeObjectPlacement(value: unknown): ObjectPlacement | undefined {
	if (!isRecord(value)) return undefined
	const record = value
	const id = normalizeIdentifier(record.id)
	const type = normalizeIdentifier(record.type)
	if (!id || !type || !isFiniteNumber(record.x) || !isFiniteNumber(record.y) || Math.abs(record.x) > MAX_PIXEL_DIMENSION || Math.abs(record.y) > MAX_PIXEL_DIMENSION) return undefined
	const rawRotation = typeof record.rotation === 'number' ? record.rotation : 0
	const rotation = [0, 90, 180, 270].includes(rawRotation) ? rawRotation as Rotation : 0
	const placement: ObjectPlacement = {
		id,
		type,
		x: record.x,
		y: record.y,
		rotation,
	}
	const linkGroupId = normalizeIdentifier(record.linkGroupId)
	if (linkGroupId) placement.linkGroupId = linkGroupId
	if (typeof record.locked === 'boolean') placement.locked = record.locked
	const fillColor = typeof record.fillColor === 'string' && isValidColor(record.fillColor.trim()) ? record.fillColor.trim() : undefined
	if (fillColor) placement.fillColor = fillColor
	const strokeColor = typeof record.strokeColor === 'string' && isValidColor(record.strokeColor.trim()) ? record.strokeColor.trim() : undefined
	if (strokeColor) placement.strokeColor = strokeColor
	return placement
}

export function normalizeAllowedRoleIds(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined
	const seen = new Set<string>()
	const ids: string[] = []
	for (const entry of value) {
		const trimmed = normalizeIdentifier(entry)
		if (!trimmed) continue
		if (seen.has(trimmed)) continue
		seen.add(trimmed)
		ids.push(trimmed)
	}
	return ids.length > 0 ? ids : undefined
}

export interface ObjectPlacement {
	id: string
	type: string
	x: number
	y: number
	rotation: Rotation
	linkGroupId?: string
	locked?: boolean
	fillColor?: string
	strokeColor?: string
}

export interface ObjectData extends ObjectPlacement {
	w: number
	h: number
	radius?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	labelPadding?: number
	padding?: number
	collapsed?: boolean
	label?: string
}

export interface ResolvedObject extends ObjectPlacement {
	w: number
	h: number
	radius?: number
	rx?: { tl: number; tr: number; br: number; bl: number }
	labelPadding?: number
	padding?: number
	fillColor?: string
	label?: string
	walkable: boolean
	doorRequired: boolean
	walkableGrid?: WalkableGrid
	tileStates?: TileState[][]
	interactSpots?: InteractSpot[]
	interact?: InteractConfig
	queue?: NpcQueueConfig
}

export interface NpcSpawnZone {
	id: string
	label: string
	x: number
	y: number
	w: number
	h: number
	roleIds?: string[]
}

export function spawnZoneAllowsRole(zone: NpcSpawnZone, roleId: string): boolean {
	if (!zone.roleIds?.length) return true
	return zone.roleIds.includes(roleId)
}

export function normalizeNpcSpawnZones(value: unknown): NpcSpawnZone[] | undefined {
	if (value === undefined || value === null) return undefined
	if (!Array.isArray(value) || value.length > MAX_OBJECTS_PER_FLOOR) return undefined
	const zones: NpcSpawnZone[] = []
	const seen = new Set<string>()
	for (const item of value) {
		if (!isRecord(item)) continue
		const record = item
		const id = normalizeIdentifier(record.id)
		if (!id || seen.has(id)) continue
		if (!isFiniteNumber(record.x) || !isFiniteNumber(record.y) || Math.abs(record.x) > MAX_PIXEL_DIMENSION || Math.abs(record.y) > MAX_PIXEL_DIMENSION) continue
		if (!isFiniteNumber(record.w) || record.w <= 0 || record.w > MAX_PIXEL_DIMENSION || !isFiniteNumber(record.h) || record.h <= 0 || record.h > MAX_PIXEL_DIMENSION) continue
		const roleIds = normalizeAllowedRoleIds(record.roleIds)
		seen.add(id)
		zones.push({
			id,
			label: normalizeText(record.label) ?? id,
			x: Math.max(0, record.x),
			y: Math.max(0, record.y),
			w: Math.max(1, record.w),
			h: Math.max(1, record.h),
			...(roleIds?.length ? { roleIds } : {}),
		})
	}
	return zones
}

