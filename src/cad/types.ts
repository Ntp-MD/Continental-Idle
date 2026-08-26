export type RoomCategory = 'guest' | 'public' | 'back' | 'circulation' | 'service'

export type RoomDraw =
	| 'plain'
	| 'stair'
	| 'shaft'
	| 'elevator'
	| 'terrace'
	| 'void'

export interface CadRoom {
	id: string
	floorId: string
	type: string
	name: string
	x: number
	y: number
	w: number
	h: number
	area: number
	category: RoomCategory
	roomNumber?: string
	draw?: RoomDraw
	accessible?: boolean
	suite?: boolean
	bedCount?: number
	bathroom?: boolean
	labelSize?: number
	showArea?: boolean
}

export type FixtureKind =
	| 'bed-king'
	| 'bed-single'
	| 'nightstand'
	| 'desk'
	| 'wardrobe'
	| 'tv'
	| 'luggage'
	| 'armchair'
	| 'sofa'
	| 'coffee-table'
	| 'dining-2'
	| 'dining-4'
	| 'dining-6'
	| 'toilet'
	| 'basin'
	| 'shower'
	| 'tub'
	| 'reception-desk'
	| 'concierge-desk'
	| 'plant'
	| 'bar-counter'
	| 'back-bar'
	| 'service-station'
	| 'prep-line'
	| 'range-line'
	| 'cold-store'
	| 'shelf'
	| 'locker'
	| 'washer'
	| 'worktable'
	| 'boardroom'
	| 'meeting-table'
	| 'lounge-seat'
	| 'piano'
	| 'ahu'
	| 'chiller'
	| 'cooling-tower'
	| 'solar-array'
	| 'dish'
	| 'hatch'

export interface CadFixture {
	kind: FixtureKind
	x: number
	y: number
	w: number
	h: number
	rotation?: 0 | 90 | 180 | 270
}

export interface CadDoor {
	x: number
	y: number
	len: number
	orient: 'h' | 'v'
	hinge: 0 | 1
	swing: 1 | -1
	double?: boolean
	open?: boolean
	t?: number
}

export interface CadWindow {
	x: number
	y: number
	len: number
	orient: 'h' | 'v'
	storefront?: boolean
}

export interface CadDimension {
	x1: number
	y1: number
	x2: number
	y2: number
	text?: string
	refY?: number
	refX?: number
}

export interface CadNote {
	x: number
	y: number
	text: string
	size?: number
	anchor?: 'start' | 'middle' | 'end'
	rotate?: number
	bold?: boolean
}

export interface CadLevelStats {
	keys: number
	gfa: number
}

export interface CadFloorPlan {
	id: string
	level: string
	name: string
	drawingNo: string
	rooms: CadRoom[]
	fixtures: CadFixture[]
	doors: CadDoor[]
	windows: CadWindow[]
	dimensions: CadDimension[]
	notes: CadNote[]
	stats: CadLevelStats
}
