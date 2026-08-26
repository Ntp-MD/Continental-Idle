import type { CadDimension, CadDoor, CadFixture, CadFloorPlan, CadNote, CadRoom, CadWindow } from './types'
import { BLD, CORE, LIFTS, SOUTH_STRIP, XS, bayInner, makeRoom } from './spec'

export interface Draft {
	floorId: string
	level: string
	name: string
	drawingNo: string
	rooms: CadRoom[]
	fixtures: CadFixture[]
	doors: CadDoor[]
	windows: CadWindow[]
	dimensions: CadDimension[]
	notes: CadNote[]
}

export const NORTH_ROOM_Y1 = 7.0
export const NORTH_BATH_Y0 = 7.1
export const HALL_W = 0.95
export const SOUTH_ROOM_Y0 = 14.95
export const SOUTH_BATH_Y1 = 14.85

export function draft(level: string, id: string, name: string, drawingNo: string): Draft {
	return { floorId: id, level, name, drawingNo, rooms: [], fixtures: [], doors: [], windows: [], dimensions: [], notes: [] }
}

export function finish(d: Draft): CadFloorPlan {
	const keys = d.rooms.filter(r => r.roomNumber).length
	const gfa = Math.round(d.rooms.reduce((s, r) => s + r.w * r.h, 0) * 10) / 10
	return {
		id: d.floorId,
		level: d.level,
		name: d.name,
		drawingNo: d.drawingNo,
		rooms: d.rooms,
		fixtures: d.fixtures,
		doors: d.doors,
		windows: d.windows,
		dimensions: d.dimensions,
		notes: d.notes,
		stats: { keys, gfa },
	}
}

export function addRoom(d: Draft, props: Omit<CadRoom, 'id' | 'floorId' | 'area'> & { id?: string }): CadRoom {
	const r = makeRoom(d.floorId, props)
	d.rooms.push(r)
	return r
}

export function fix(d: Draft, kind: CadFixture['kind'], x: number, y: number, w: number, h: number, rotation?: 0 | 90 | 180 | 270): void {
	d.fixtures.push({ kind, x, y, w, h, ...(rotation ? { rotation } : {}) })
}

export function addDoor(d: Draft, props: Omit<CadDoor, never>): void {
	d.doors.push(props)
}

export function windowRun(d: Draft, x: number, y: number, len: number, orient: 'h' | 'v', storefront = false): void {
	d.windows.push({ x, y, len, orient, ...(storefront ? { storefront: true } : {}) })
}

export function corridorRoom(d: Draft, name: string): void {
	addRoom(d, {
		type: 'corridor',
		name,
		x: BLD.extWall,
		y: BLD.corridorY0,
		w: BLD.w - 2 * BLD.extWall,
		h: BLD.corridorY1 - BLD.corridorY0,
		category: 'circulation',
	})
}

export function coreRooms(d: Draft): void {
	addRoom(d, {
		id: `core-stair-${d.floorId}`,
		type: 'stair',
		name: 'SC-1',
		x: CORE.x0 + BLD.partWall / 2,
		y: CORE.y0,
		w: CORE.stairX1 - (CORE.x0 + BLD.partWall / 2),
		h: CORE.y1 - CORE.y0,
		category: 'circulation',
		draw: 'stair',
	})
	addDoor(d, { x: 17.5, y: 12.2, len: 1.1, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	for (const l of LIFTS) {
		addRoom(d, {
			id: `lift-${l.id}-${d.floorId}`,
			type: 'elevator',
			name: l.id,
			x: l.x,
			y: CORE.y0,
			w: l.w,
			h: 2.25,
			category: 'circulation',
			draw: 'elevator',
		})
	}
	addRoom(d, {
		id: `core-riser-${d.floorId}`,
		type: 'shaft',
		name: 'MEP RISERS',
		x: LIFTS[0].x,
		y: CORE.shaftY0,
		w: LIFTS[3].x + LIFTS[3].w - LIFTS[0].x,
		h: CORE.y1 - CORE.shaftY0,
		category: 'service',
		draw: 'shaft',
	})
}

export function wingStairs(d: Draft): void {
	addRoom(d, {
		id: `stair-a-${d.floorId}`,
		type: 'stair',
		name: 'SC-A',
		x: BLD.extWall,
		y: CORE.y0,
		w: XS[1] - BLD.extWall - BLD.partWall / 2,
		h: CORE.y1 - CORE.y0,
		category: 'circulation',
		draw: 'stair',
	})
	addDoor(d, { x: 1.4, y: 12.2, len: 1.1, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	addRoom(d, {
		id: `stair-b-${d.floorId}`,
		type: 'stair',
		name: 'SC-B',
		x: XS[10] + BLD.partWall / 2,
		y: 5.4,
		w: BLD.w - BLD.extWall - (XS[10] + BLD.partWall / 2),
		h: BLD.northRoomY1 - 5.4,
		category: 'circulation',
		draw: 'stair',
	})
	addDoor(d, { x: 41.2, y: 9.8, len: 1.1, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
}

function fmtOverall(m: number): string {
	return `${Math.round(m * 1000)} OVERALL`
}

export function gridDims(d: Draft): void {
	for (let i = 0; i < XS.length - 1; i++) {
		d.dimensions.push({ x1: XS[i], y1: -1.95, x2: XS[i + 1], y2: -1.95, refY: 0 })
	}
	d.dimensions.push({ x1: 0, y1: -2.65, x2: XS[XS.length - 1], y2: -2.65, refY: -1.95, text: fmtOverall(BLD.w) })
	const ys = [0, 9.8, 12.2, 22]
	for (let i = 0; i < ys.length - 1; i++) {
		d.dimensions.push({ x1: -1.95, y1: ys[i], x2: -1.95, y2: ys[i + 1], refX: 0 })
	}
	d.dimensions.push({ x1: -2.65, y1: 0, x2: -2.65, y2: BLD.d, refX: -1.95, text: fmtOverall(BLD.d) })
}

export function coreDims(d: Draft): void {
	d.dimensions.push({ x1: 30, y1: BLD.corridorY0, x2: 30, y2: BLD.corridorY1, text: '2200 CLR.' })
	d.dimensions.push({ x1: 16.1, y1: 12.7, x2: 19.85, y2: 12.7, text: '3750' })
	d.dimensions.push({ x1: 20.05, y1: 12.7, x2: 27.95, y2: 12.7, text: '4 X 1900 LIFTS' })
	d.dimensions.push({ x1: XS[1] + BLD.partWall / 2, y1: 6.4, x2: XS[2] - BLD.partWall / 2, y2: 6.4, text: '3800 TYP.' })
}

export function moduleWindow(d: Draft, bay: number, band: 'north' | 'south', len = 2.2): void {
	const cx = (XS[bay] + XS[bay + 1]) / 2
	if (band === 'north') windowRun(d, cx - len / 2, BLD.extWall / 2, len, 'h')
	else windowRun(d, cx - len / 2, BLD.d - BLD.extWall / 2, len, 'h')
}

export function cornerSideWindow(d: Draft, side: 'west' | 'east', cy: number, len: number): void {
	windowRun(d, side === 'west' ? BLD.extWall / 2 : BLD.w - BLD.extWall / 2, cy - len / 2, len, 'v')
}

export interface GuestOpts {
	num?: string
	label: string
	variant: 'king' | 'twin' | 'corner-king' | 'accessible'
	bathShower?: boolean
}

export function guestModule(d: Draft, bay: number, band: 'north' | 'south', o: GuestOpts): void {
	const R = bayInner(bay, band)
	const north = band === 'north'
	const roomY0 = north ? BLD.extWall : SOUTH_ROOM_Y0
	const roomY1 = north ? NORTH_ROOM_Y1 : BLD.d - BLD.extWall
	const bathY0 = north ? NORTH_BATH_Y0 : BLD.southRoomY0
	const bathY1 = north ? BLD.northRoomY1 : SOUTH_BATH_Y1
	const bathX = R.x + HALL_W + 0.05
	const bathW = R.w - HALL_W - 0.05

	addRoom(d, {
		type: `guest-${o.variant}`,
		name: o.label,
		x: R.x,
		y: roomY0,
		w: R.w,
		h: roomY1 - roomY0,
		category: 'guest',
		...(o.num ? { roomNumber: o.num } : {}),
		bedCount: o.variant === 'twin' ? 2 : 1,
		...(o.variant === 'accessible' ? { accessible: true } : {}),
	})
	addRoom(d, {
		type: 'entry-hall',
		name: '',
		x: R.x,
		y: bathY0,
		w: HALL_W,
		h: bathY1 - bathY0,
		category: 'guest',
	})
	addRoom(d, {
		type: 'bathroom',
		name: 'BATH',
		x: bathX,
		y: bathY0,
		w: bathW,
		h: bathY1 - bathY0,
		category: 'guest',
		bathroom: true,
	})

	const entryY = north ? BLD.northRoomY1 + BLD.partWall / 2 : BLD.southRoomY0 - BLD.partWall / 2
	addDoor(d, { x: R.x + 0.03, y: entryY, len: 1.0, orient: 'h', hinge: 0, swing: north ? 1 : -1, t: BLD.partWall })
	addDoor(d, { x: bathX - 0.05, y: bathY0 + (north ? 1.15 : 0.85), len: 0.75, orient: 'v', hinge: 0, swing: 1, t: BLD.lightWall })
	addDoor(d, {
		x: R.x + 0.05,
		y: north ? NORTH_ROOM_Y1 + BLD.lightWall / 2 : SOUTH_BATH_Y1 + BLD.lightWall / 2,
		len: 0.85,
		orient: 'h',
		hinge: 0,
		swing: north ? 1 : -1,
		open: true,
		t: BLD.lightWall,
	})

	moduleWindow(d, bay, band)

	if (o.variant === 'twin') {
		fix(d, 'bed-single', R.x + R.w / 2 - 1.12, roomY0 + 0.18, 1.05, 2.0)
		fix(d, 'bed-single', R.x + R.w / 2 + 0.07, roomY0 + 0.18, 1.05, 2.0)
		fix(d, 'nightstand', R.x + R.w / 2 - 0.03, roomY0 + 0.18, 0.42, 0.45)
	} else {
		fix(d, 'bed-king', R.x + R.w / 2 - 0.9, roomY0 + 0.22, 1.8, 2.0)
		fix(d, 'nightstand', R.x + R.w / 2 - 1.36, roomY0 + 0.22, 0.42, 0.45)
		fix(d, 'nightstand', R.x + R.w / 2 + 0.94, roomY0 + 0.22, 0.42, 0.45)
	}
	fix(d, 'tv', R.x + R.w / 2 - 0.8, roomY1 - 0.75, 1.6, 0.45)
	fix(d, 'desk', R.x + 0.08, roomY0 + 2.6, 1.15, 0.62)
	fix(d, 'wardrobe', R.x + 0.06, roomY1 - 1.85, 0.58, 1.6)
	fix(d, 'luggage', R.x + R.w - 0.58, roomY0 + 2.5, 0.52, 1.15)

	if (o.variant === 'accessible') {
		fix(d, 'shower', bathX + 0.1, bathY0 + 0.12, 1.45, 1.0)
	} else if (o.bathShower) {
		fix(d, 'shower', bathX + 0.14, north ? bathY0 + 0.14 : bathY1 - 1.09, 0.92, 0.92)
	} else {
		fix(d, 'tub', bathX + 0.14, north ? bathY0 + 0.14 : bathY1 - 0.89, 1.67, 0.75)
	}
	fix(d, 'toilet', bathX + bathW - 0.64, bathY0 + 0.14, 0.52, 0.78)
	fix(d, 'basin', bathX + 0.16, north ? bathY1 - 0.56 : bathY0 + 0.08, 0.55, 0.46)
}

export function lCornerAnnex(d: Draft, band: 'north' | 'south'): void {
	if (band === 'south') {
		const annex = addRoom(d, {
			type: 'sitting-area',
			name: '',
			x: BLD.extWall + 0.02,
			y: CORE.stripY0,
			w: XS[1] - BLD.extWall - BLD.partWall / 2 - 0.04,
			h: BLD.d - BLD.extWall - CORE.stripY0,
			category: 'guest',
		})
		fix(d, 'sofa', annex.x + 0.3, annex.y + 0.3, 2.0, 0.85)
		fix(d, 'coffee-table', annex.x + 0.9, annex.y + 1.6, 1.1, 0.6)
		fix(d, 'armchair', annex.x + annex.w - 0.95, annex.y + 0.4, 0.75, 0.75)
		addDoor(d, { x: XS[1], y: 19.0, len: 1.1, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.partWall })
		windowRun(d, BLD.extWall / 2, 18.4, 2.6, 'v')
		return
	}
	const ax = XS[10] + BLD.partWall / 2 + 0.02
	const aw = BLD.w - BLD.extWall - (XS[10] + BLD.partWall / 2) - 0.04
	const annex = addRoom(d, {
		type: 'sitting-area',
		name: '',
		x: ax,
		y: BLD.extWall + 0.02,
		w: aw,
		h: 5.4 - BLD.extWall - 0.02,
		category: 'guest',
	})
	fix(d, 'sofa', annex.x + 0.25, annex.y + 0.3, 0.85, 2.0, 90)
	fix(d, 'coffee-table', annex.x + 1.5, annex.y + 1.0, 0.6, 1.1)
	fix(d, 'armchair', annex.x + annex.w - 0.95, annex.y + annex.h - 1.05, 0.75, 0.75)
	addDoor(d, { x: XS[10], y: 4.4, len: 1.1, orient: 'v', hinge: 1, swing: -1, open: true, t: BLD.partWall })
	windowRun(d, BLD.w - BLD.extWall / 2, 2.4, 2.6, 'v')
}

export function housekeepingRoom(d: Draft, bay: number, name: string): void {
	const R = bayInner(bay, 'north')
	const hk = addRoom(d, {
		type: 'housekeeping',
		name,
		x: R.x,
		y: BLD.extWall,
		w: R.w,
		h: NORTH_ROOM_Y1 + BLD.lightWall / 2 - BLD.extWall,
		category: 'service',
		showArea: true,
	})
	addRoom(d, {
		type: 'hk-hall',
		name: '',
		x: R.x,
		y: NORTH_BATH_Y0,
		w: R.w,
		h: BLD.northRoomY1 - NORTH_BATH_Y0,
		category: 'service',
	})
	addDoor(d, { x: R.x + R.w / 2 - 0.55, y: BLD.northRoomY1 + BLD.partWall / 2, len: 1.1, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	addDoor(d, { x: R.x + R.w / 2 - 0.45, y: NORTH_ROOM_Y1 + BLD.lightWall / 2, len: 0.9, orient: 'h', hinge: 0, swing: 1, open: true, t: BLD.lightWall })
	fix(d, 'shelf', hk.x + 0.15, hk.y + 0.15, 1.7, 0.5)
	fix(d, 'shelf', hk.x + 0.15, hk.y + 2.5, 1.7, 0.5)
	fix(d, 'worktable', hk.x + hk.w - 1.5, hk.y + 0.15, 1.35, 0.62)
	fix(d, 'washer', hk.x + hk.w - 1.45, hk.y + hk.h - 1.25, 1.3, 0.65)
	moduleWindow(d, bay, 'north')
}

export function suiteModule(d: Draft, bay: number, num: string, label: string, stripLabel: string): void {
	const R = bayInner(bay, 'south')
	addRoom(d, {
		type: 'suite',
		name: label,
		x: R.x,
		y: SOUTH_ROOM_Y0,
		w: R.w,
		h: BLD.d - BLD.extWall - SOUTH_ROOM_Y0,
		category: 'guest',
		roomNumber: num,
		suite: true,
		bedCount: 1,
		showArea: true,
	})
	addRoom(d, {
		type: 'entry-hall',
		name: '',
		x: R.x,
		y: BLD.southRoomY0,
		w: HALL_W,
		h: SOUTH_BATH_Y1 - BLD.southRoomY0,
		category: 'guest',
	})
	addRoom(d, {
		type: 'bathroom',
		name: 'BATH',
		x: R.x + HALL_W + 0.05,
		y: BLD.southRoomY0,
		w: R.w - HALL_W - 0.05,
		h: SOUTH_BATH_Y1 - BLD.southRoomY0,
		category: 'guest',
		bathroom: true,
	})
	addDoor(d, { x: R.x + 0.03, y: BLD.southRoomY0 - BLD.partWall / 2, len: 1.0, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	addDoor(d, { x: R.x + HALL_W, y: BLD.southRoomY0 + 0.9, len: 0.75, orient: 'v', hinge: 0, swing: 1, t: BLD.lightWall })
	addDoor(d, { x: R.x + 0.05, y: SOUTH_BATH_Y1 + BLD.lightWall / 2, len: 0.85, orient: 'h', hinge: 0, swing: -1, open: true, t: BLD.lightWall })
	moduleWindow(d, bay, 'south')
	fix(d, 'bed-king', R.x + R.w / 2 - 0.9, BLD.d - BLD.extWall - 2.25, 1.8, 2.0)
	fix(d, 'nightstand', R.x + R.w / 2 - 1.36, BLD.d - BLD.extWall - 2.25, 0.42, 0.45)
	fix(d, 'nightstand', R.x + R.w / 2 + 0.94, BLD.d - BLD.extWall - 2.25, 0.42, 0.45)
	fix(d, 'wardrobe', R.x + R.w - 0.66, SOUTH_ROOM_Y0 + 2.3, 0.58, 1.6)
	fix(d, 'tub', R.x + HALL_W + 0.19, SOUTH_BATH_Y1 - 0.89, 1.67, 0.75)
	fix(d, 'toilet', R.x + R.w - 0.69, BLD.southRoomY0 + 0.14, 0.52, 0.78)
	fix(d, 'basin', R.x + HALL_W + 0.21, BLD.southRoomY0 + 0.08, 0.55, 0.46)

	const s = SOUTH_STRIP
	addRoom(d, {
		type: 'suite-strip',
		name: stripLabel,
		x: s.x0,
		y: s.y0,
		w: s.x1 - s.x0,
		h: s.y1 - s.y0,
		category: 'guest',
		suite: true,
		showArea: true,
	})
	addDoor(d, { x: XS[4], y: 19.2, len: 1.2, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.partWall })
	windowRun(d, s.x0 + 0.7, BLD.d - BLD.extWall / 2, 3.0, 'h')
	windowRun(d, s.x0 + 4.5, BLD.d - BLD.extWall / 2, 3.0, 'h')
	windowRun(d, s.x0 + 8.3, BLD.d - BLD.extWall / 2, 3.0, 'h')
	fix(d, 'sofa', s.x0 + 0.6, s.y0 + 0.4, 2.3, 0.9)
	fix(d, 'coffee-table', s.x0 + 1.3, s.y0 + 1.9, 1.2, 0.65)
	fix(d, 'dining-4', s.x0 + 5.2, s.y1 - 2.05, 1.8, 1.8)
	fix(d, 'armchair', s.x1 - 1.15, s.y0 + 0.4, 0.8, 0.8)
	fix(d, 'desk', s.x1 - 1.95, s.y1 - 0.95, 1.4, 0.7)
}

export function doubleBaySuiteNorth(d: Draft, bayA: number, num: string, label: string): void {
	const x0 = bayInner(bayA, 'north').x
	const x1 = bayInner(bayA + 1, 'north').x + bayInner(bayA + 1, 'north').w
	addRoom(d, {
		type: 'signature-suite',
		name: label,
		x: x0,
		y: BLD.extWall,
		w: x1 - x0,
		h: NORTH_ROOM_Y1 - BLD.extWall,
		category: 'guest',
		roomNumber: num,
		suite: true,
		bedCount: 1,
		showArea: true,
	})
	addRoom(d, {
		type: 'entry-hall',
		name: '',
		x: x0,
		y: NORTH_BATH_Y0,
		w: HALL_W,
		h: BLD.northRoomY1 - NORTH_BATH_Y0,
		category: 'guest',
	})
	addRoom(d, {
		type: 'bathroom',
		name: 'BATH',
		x: x0 + HALL_W + 0.05,
		y: NORTH_BATH_Y0,
		w: x1 - x0 - HALL_W - 0.05,
		h: BLD.northRoomY1 - NORTH_BATH_Y0,
		category: 'guest',
		bathroom: true,
	})
	addDoor(d, { x: x0 + 0.03, y: BLD.northRoomY1 + BLD.partWall / 2, len: 1.0, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	addDoor(d, { x: x0 + 0.05, y: NORTH_ROOM_Y1 + BLD.lightWall / 2, len: 0.85, orient: 'h', hinge: 0, swing: 1, open: true, t: BLD.lightWall })
	moduleWindow(d, bayA, 'north')
	moduleWindow(d, bayA + 1, 'north')
	fix(d, 'bed-king', x0 + 1.3, BLD.extWall + 0.25, 1.8, 2.0)
	fix(d, 'nightstand', x0 + 0.84, BLD.extWall + 0.25, 0.42, 0.45)
	fix(d, 'nightstand', x0 + 3.14, BLD.extWall + 0.25, 0.42, 0.45)
	fix(d, 'sofa', x0 + 4.3, BLD.extWall + 0.3, 2.3, 0.9)
	fix(d, 'coffee-table', x0 + 5.0, BLD.extWall + 1.8, 1.2, 0.65)
	fix(d, 'desk', x1 - 1.35, BLD.extWall + 0.25, 1.15, 0.62)
	fix(d, 'tv', x0 + 4.1, NORTH_ROOM_Y1 - 0.75, 1.6, 0.45)
	fix(d, 'tub', x0 + HALL_W + 1.3, NORTH_BATH_Y0 + 0.14, 1.67, 0.75)
	fix(d, 'shower', x1 - 1.2, NORTH_BATH_Y0 + 0.14, 0.92, 0.92)
	fix(d, 'toilet', x1 - 0.72, NORTH_BATH_Y0 + 1.3, 0.52, 0.78)
	fix(d, 'basin', x0 + HALL_W + 1.4, BLD.northRoomY1 - 0.56, 0.55, 0.46)
}

export function soilShafts(d: Draft): void {
	const spots: Array<[number, 'north' | 'south']> = [
		[3, 'north'],
		[8, 'north'],
		[2, 'south'],
		[8, 'south'],
	]
	let n = 0
	for (const [bay, band] of spots) {
		n += 1
		const R = bayInner(bay, band)
		addRoom(d, {
			id: `soil-${n}-${d.floorId}`,
			type: 'shaft',
			name: '',
			x: R.x + R.w - 0.48,
			y: band === 'north' ? BLD.northRoomY1 - 1.25 : SOUTH_BATH_Y1 - 1.25,
			w: 0.43,
			h: 1.0,
			category: 'service',
			draw: 'shaft',
		})
	}
}

export function corridorNotes(d: Draft, left: string, right: string): void {
	d.notes.push({ x: 6, y: 11.35, text: left, size: 6.5, anchor: 'start' })
	d.notes.push({ x: 34, y: 11.35, text: right, size: 6.5, anchor: 'start' })
	d.notes.push({ x: 24, y: 10.4, text: 'LIFT LOBBY', size: 6, anchor: 'middle' })
	d.notes.push({ x: 17.9, y: 19.9, text: 'UP 20R @ 170', size: 6, anchor: 'middle' })
}
