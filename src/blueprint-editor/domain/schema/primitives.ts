export type EditorMode = 'object' | 'draw' | 'move' | 'npc-preview' | 'zone'
export type Rotation = 0 | 90 | 180 | 270

export const STREET_TILES = 8

export function resolveStreetTiles(layout: { streetWidthTiles?: number } | null | undefined): number {
	const v = layout?.streetWidthTiles
	return typeof v === 'number' && Number.isInteger(v) && v >= 5 && v <= 20 ? v : STREET_TILES
}

export function resolveDefaultWalkable(floor: { defaultWalkable?: unknown } | null | undefined): boolean {
	const v = floor?.defaultWalkable
	return typeof v === 'boolean' ? v : true
}

// --- Section 2: SVG & wall types ---

export type SvgRole = 'wall' | 'door' | 'fixture'

export interface SvgRoleInfo {
	role: SvgRole
	tag: string
	attrs?: Record<string, string>
}

export interface Rect {
	x: number
	y: number
	w: number
	h: number
}

export interface EntityRef {
	type: 'object'
	id: string
}

export interface SelectionState {
	primary: EntityRef | null
	items: EntityRef[]
}

