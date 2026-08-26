import type { CadRoom } from './types'

export const SCALE = 28

export const BLD = {
	w: 44,
	d: 22,
	extWall: 0.3,
	partWall: 0.2,
	lightWall: 0.1,
	corridorY0: 9.9,
	corridorY1: 12.1,
	northRoomY1: 9.7,
	southRoomY0: 12.3,
	northBathY0: 7.05,
	northBathY1: 9.7,
	southBathY0: 12.3,
	southBathY1: 14.95,
	floorH: 3.4,
}

export const XS = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44]
export const GRID_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M']
export const YS = [0, 9.8, 12.2, 22]
export const COL = 0.5

export const CORE = {
	x0: 16,
	x1: 28,
	y0: 12.3,
	y1: 16.95,
	stairX1: 19.9,
	liftY0: 12.35,
	liftY1: 14.55,
	shaftY0: 14.65,
	stripY0: 17.05,
}

export const LIFTS = [
	{ id: 'P1', x: 20.15, w: 1.8, service: false },
	{ id: 'P2', x: 22.05, w: 1.8, service: false },
	{ id: 'P3', x: 23.95, w: 1.8, service: false },
	{ id: 'S1', x: 25.85, w: 1.8, service: true },
]

export const WING_SHAFTS = [
	{ x: 7.85, y0: 7.15 },
	{ x: 15.85, y0: 7.15 },
	{ x: 31.95, y0: 7.15 },
	{ x: 39.95, y0: 7.15 },
]

export const SOUTH_STRIP = { x0: 16.05, x1: 27.95, y0: CORE.stripY0, y1: 21.7 }

export function bayInner(i: number, band: 'north' | 'south'): { x: number; y: number; w: number; h: number } {
	const x0 = XS[i]
	const x1 = XS[i + 1]
	const westFace = i === 0 ? x0 + BLD.extWall : x0 + BLD.partWall / 2
	const eastFace = i === 10 ? x1 - BLD.extWall : x1 - BLD.partWall / 2
	if (band === 'north') {
		return { x: westFace, y: BLD.extWall, w: eastFace - westFace, h: BLD.northRoomY1 - BLD.extWall }
	}
	return { x: westFace, y: BLD.southRoomY0, w: eastFace - westFace, h: 21.7 - BLD.southRoomY0 }
}

export function northBath(i: number): { x: number; y: number; w: number; h: number } {
	const b = bayInner(i, 'north')
	return { x: b.x, y: BLD.northBathY0 + BLD.lightWall / 2, w: b.w, h: BLD.northBathY1 - (BLD.northBathY0 + BLD.lightWall / 2) }
}

export function southBath(i: number): { x: number; y: number; w: number; h: number } {
	const b = bayInner(i, 'south')
	return { x: b.x, y: BLD.southBathY0, w: b.w, h: BLD.southBathY1 - BLD.southBathY0 - BLD.lightWall / 2 }
}

export function area(r: Pick<CadRoom, 'w' | 'h'>): number {
	return Math.round(r.w * r.h * 10) / 10
}

let roomSeq = 0
export function makeRoom(
	floorId: string,
	props: Omit<CadRoom, 'id' | 'floorId' | 'area'> & { id?: string },
): CadRoom {
	roomSeq += 1
	const id = props.id ?? `r-${floorId}-${roomSeq}`
	return { ...props, id, floorId, area: area(props) }
}
