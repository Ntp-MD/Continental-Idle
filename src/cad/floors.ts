import type { CadFloorPlan } from './types'
import { BLD, SOUTH_STRIP, XS } from './spec'
import {
	addDoor,
	addRoom,
	corridorNotes,
	corridorRoom,
	coreDims,
	coreRooms,
	doubleBaySuiteNorth,
	draft,
	finish,
	fix,
	gridDims,
	guestModule,
	housekeepingRoom,
	lCornerAnnex,
	moduleWindow,
	soilShafts,
	suiteModule,
	windowRun,
	wingStairs,
	type Draft,
} from './modules'

function sideWindow(d: Draft, side: 'west' | 'east', cy: number, len = 3.0): void {
	windowRun(d, side === 'west' ? BLD.extWall / 2 : BLD.w - BLD.extWall / 2, cy - len / 2, len, 'v')
}

function guestFloor(level: string): CadFloorPlan {
	const d = draft(level, `F${level}`, `Typical Guest Floor ${level}`, `A-${level}01`)
	corridorRoom(d, 'Guest Corridor')
	coreRooms(d)
	wingStairs(d)

	guestModule(d, 0, 'north', { num: `${level}01`, label: 'Deluxe Corner King', variant: 'corner-king' })
	sideWindow(d, 'west', 3.6)
	const northMix: Array<'king' | 'twin'> = ['twin', 'king', 'king', 'twin', 'king', 'king']
	for (let b = 1; b <= 6; b++) {
		const v = northMix[b - 1]
		guestModule(d, b, 'north', {
			num: `${level}${String(1 + b * 2).padStart(2, '0')}`,
			label: v === 'twin' ? 'Superior Twin' : 'Superior King',
			variant: v,
		})
	}
	housekeepingRoom(d, 7, 'Housekeeping')
	guestModule(d, 8, 'north', { num: `${level}15`, label: 'Superior King', variant: 'king' })
	guestModule(d, 9, 'north', { num: `${level}17`, label: 'Deluxe Corner Twin', variant: 'corner-king' })
	lCornerAnnex(d, 'north')

	guestModule(d, 1, 'south', { num: `${level}02`, label: 'Deluxe Corner King', variant: 'corner-king' })
	lCornerAnnex(d, 'south')
	guestModule(d, 2, 'south', { num: `${level}04`, label: 'Superior Twin', variant: 'twin' })
	suiteModule(d, 3, `${level}06`, 'Deluxe Suite', 'Suite Living Room')
	guestModule(d, 7, 'south', { num: `${level}08`, label: 'Accessible King', variant: 'accessible' })
	guestModule(d, 8, 'south', { num: `${level}10`, label: 'Superior King', variant: 'king' })
	guestModule(d, 9, 'south', { num: `${level}12`, label: 'Superior Twin', variant: 'twin' })
	guestModule(d, 10, 'south', { num: `${level}14`, label: 'Deluxe Corner King', variant: 'corner-king' })

	soilShafts(d)
	gridDims(d)
	coreDims(d)
	corridorNotes(d, 'GUEST CORRIDOR', 'GUEST CORRIDOR')
	return finish(d)
}

function groundFloor(): CadFloorPlan {
	const d = draft('G', 'FG', 'Ground Floor - Public and Back-of-House', 'A-G01')
	corridorRoom(d, 'Main Concourse')
	coreRooms(d)
	wingStairs(d)

	addRoom(d, {
		type: 'lobby',
		name: 'Lobby Lounge',
		x: XS[1] + BLD.partWall / 2,
		y: CORE_Y0,
		w: XS[4] - BLD.partWall / 2 - (XS[1] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - CORE_Y0,
		category: 'public',
		showArea: true,
	})
	addRoom(d, {
		type: 'luggage-store',
		name: 'Luggage Store',
		x: BLD.extWall,
		y: SOUTH_STRIP.y0,
		w: XS[1] - BLD.extWall - BLD.partWall / 2,
		h: BLD.d - BLD.extWall - SOUTH_STRIP.y0,
		category: 'back',
	})
	addDoor(d, { x: XS[1], y: 19.2, len: 1.1, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.partWall })
	fix(d, 'reception-desk', 5.6, 13.0, 4.8, 1.55)
	fix(d, 'concierge-desk', 12.3, 13.0, 1.7, 1.05)
	fix(d, 'sofa', 4.9, 17.4, 2.4, 0.9)
	fix(d, 'coffee-table', 5.7, 18.8, 1.2, 0.65)
	fix(d, 'sofa', 9.3, 17.4, 2.4, 0.9)
	fix(d, 'coffee-table', 10.1, 18.8, 1.2, 0.65)
	fix(d, 'lounge-seat', 13.3, 17.3, 1.7, 0.85)
	fix(d, 'plant', 4.5, 20.9, 0.55, 0.55)
	fix(d, 'plant', 15.2, 20.9, 0.55, 0.55)

	addRoom(d, {
		type: 'private-dining',
		name: 'Private Dining',
		x: SOUTH_STRIP.x0,
		y: SOUTH_STRIP.y0,
		w: SOUTH_STRIP.x1 - SOUTH_STRIP.x0,
		h: SOUTH_STRIP.y1 - SOUTH_STRIP.y0,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: XS[4], y: 19.2, len: 1.2, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.partWall })
	addDoor(d, { x: XS[7], y: 19.2, len: 1.2, orient: 'v', hinge: 0, swing: -1, open: true, t: BLD.partWall })
	fix(d, 'dining-6', 18.0, 18.2, 2.6, 1.9)
	fix(d, 'dining-6', 22.0, 18.2, 2.6, 1.9)
	fix(d, 'dining-4', 25.6, 18.4, 1.8, 1.8)
	fix(d, 'service-station', 26.9, 17.3, 0.75, 1.6)

	addRoom(d, {
		type: 'restaurant',
		name: 'Restaurant',
		x: XS[7] + BLD.partWall / 2,
		y: CORE_Y0,
		w: BLD.w - BLD.extWall - (XS[7] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - CORE_Y0,
		category: 'public',
		showArea: true,
	})
	fix(d, 'dining-2', 29.2, 13.2, 1.4, 1.4)
	fix(d, 'dining-4', 31.8, 13.4, 1.8, 1.8)
	fix(d, 'dining-4', 34.8, 13.4, 1.8, 1.8)
	fix(d, 'dining-2', 37.6, 13.2, 1.4, 1.4)
	fix(d, 'dining-4', 40.4, 13.6, 1.8, 1.8)
	fix(d, 'dining-6', 30.0, 16.6, 2.6, 1.9)
	fix(d, 'dining-4', 34.2, 17.0, 1.8, 1.8)
	fix(d, 'dining-4', 37.2, 17.0, 1.8, 1.8)
	fix(d, 'dining-6', 40.2, 17.0, 2.6, 1.9)
	fix(d, 'dining-2', 29.4, 19.8, 1.4, 1.4)
	fix(d, 'dining-2', 31.8, 19.8, 1.4, 1.4)
	fix(d, 'dining-4', 34.8, 19.8, 1.8, 1.8)
	fix(d, 'service-station', 39.2, 19.6, 0.8, 1.8)
	fix(d, 'plant', 43.0, 21.0, 0.55, 0.55)

	addRoom(d, { type: 'loading', name: 'Loading Dock', x: BLD.extWall, y: BLD.extWall, w: XS[1] - BLD.partWall / 2 - BLD.extWall, h: 4.7, category: 'back', showArea: true })
	addRoom(d, { type: 'goods', name: 'Goods Store', x: BLD.extWall, y: 5.1, w: XS[1] - BLD.partWall / 2 - BLD.extWall, h: BLD.northRoomY1 - 5.1, category: 'back' })
	addDoor(d, { x: 1.2, y: BLD.extWall / 2, len: 2.2, orient: 'h', hinge: 0, swing: 1, open: true, t: BLD.extWall })
	addDoor(d, { x: 1.0, y: 9.8, len: 1.1, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	d.notes.push({ x: 2.3, y: -0.6, text: 'DOCK OPENING 2200', size: 6.5 })

	addRoom(d, { type: 'canteen', name: 'Staff Canteen', x: XS[1] + BLD.partWall / 2, y: BLD.extWall, w: XS[2] - XS[1] - BLD.partWall, h: BLD.northRoomY1 - BLD.extWall, category: 'back', showArea: true })
	fix(d, 'dining-6', 5.0, 2.2, 2.6, 1.9)
	fix(d, 'worktable', 4.6, 6.2, 2.4, 0.62)
	addDoor(d, { x: 5.4, y: 9.8, len: 1.0, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })

	addRoom(d, { type: 'lockers', name: 'Staff Lockers', x: XS[2] + BLD.partWall / 2, y: BLD.extWall, w: XS[3] - XS[2] - BLD.partWall, h: BLD.northRoomY1 - BLD.extWall, category: 'back' })
	fix(d, 'locker', 8.4, 0.6, 3.1, 0.55)
	fix(d, 'locker', 8.4, 5.8, 3.1, 0.55)
	addDoor(d, { x: 9.6, y: 9.8, len: 1.0, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })

	addRoom(d, { type: 'office', name: 'Staff Office', x: XS[3] + BLD.partWall / 2, y: BLD.extWall, w: XS[4] - XS[3] - BLD.partWall, h: BLD.northRoomY1 - BLD.extWall, category: 'back', showArea: true })
	fix(d, 'worktable', 12.4, 1.0, 3.0, 0.72)
	addDoor(d, { x: 13.6, y: 9.8, len: 1.0, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })

	addRoom(d, { type: 'wc-lobby', name: 'WC Lobby', x: XS[4] + BLD.partWall / 2, y: 7.0, w: XS[6] - BLD.partWall / 2 - (XS[4] + BLD.partWall / 2), h: BLD.northRoomY1 - 7.0, category: 'public' })
	addDoor(d, { x: 19.4, y: 9.8, len: 1.4, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	addRoom(d, { type: 'wc-men', name: 'WC Men', x: XS[4] + BLD.partWall / 2, y: BLD.extWall, w: 3.1, h: 6.95 - BLD.extWall, category: 'public', showArea: true })
	fix(d, 'basin', 16.4, 5.7, 0.55, 0.46)
	fix(d, 'basin', 17.2, 5.7, 0.55, 0.46)
	fix(d, 'toilet', 16.4, 0.6, 0.52, 0.78)
	fix(d, 'toilet', 17.4, 0.6, 0.52, 0.78)
	addRoom(d, { type: 'wc-accessible', name: 'WC Acc.', x: 19.35, y: BLD.extWall, w: 1.95, h: 6.95 - BLD.extWall, category: 'public' })
	fix(d, 'toilet', 19.55, 0.6, 0.52, 0.78)
	fix(d, 'basin', 19.55, 5.7, 0.55, 0.46)
	addRoom(d, { type: 'wc-women', name: 'WC Women', x: 21.35, y: BLD.extWall, w: XS[6] - BLD.partWall / 2 - 21.35, h: 6.95 - BLD.extWall, category: 'public', showArea: true })
	fix(d, 'basin', 21.65, 5.7, 0.55, 0.46)
	fix(d, 'basin', 22.45, 5.7, 0.55, 0.46)
	fix(d, 'toilet', 21.65, 0.6, 0.52, 0.78)
	fix(d, 'toilet', 22.75, 0.6, 0.52, 0.78)
	for (const dx of [16.6, 19.7, 22.0]) {
		addDoor(d, { x: dx, y: 7.05, len: 0.9, orient: 'h', hinge: 0, swing: 1, t: BLD.lightWall })
	}

	addRoom(d, { type: 'admin', name: 'Administration', x: XS[6] + BLD.partWall / 2, y: BLD.extWall, w: XS[7] - BLD.partWall / 2 - (XS[6] + BLD.partWall / 2), h: BLD.northRoomY1 - BLD.extWall, category: 'back', showArea: true })
	fix(d, 'worktable', 24.5, 1.2, 3.1, 0.75)
	addDoor(d, { x: 25.6, y: 9.8, len: 1.0, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })

	addRoom(d, { type: 'kitchen', name: 'Main Kitchen', x: CORE_X1 + BLD.partWall / 2, y: BLD.extWall, w: XS[9] - BLD.partWall / 2 - (CORE_X1 + BLD.partWall / 2), h: BLD.northRoomY1 - BLD.extWall, category: 'back', showArea: true })
	addRoom(d, { type: 'cold-store', name: 'Cold Store', x: XS[9] + BLD.partWall / 2, y: BLD.extWall, w: XS[10] - BLD.extWall - (XS[9] + BLD.partWall / 2), h: 2.7, category: 'back' })
	addRoom(d, { type: 'dry-store', name: 'Dry Store', x: XS[9] + BLD.partWall / 2, y: 3.1, w: XS[10] - BLD.extWall - (XS[9] + BLD.partWall / 2), h: BLD.northRoomY1 - 3.1, category: 'back' })
	fix(d, 'prep-line', 28.5, 0.5, 4.8, 0.82)
	fix(d, 'range-line', 28.5, 2.3, 3.6, 0.9)
	fix(d, 'worktable', 28.5, 4.2, 3.0, 0.7)
	fix(d, 'cold-store', 36.5, 0.5, 2.8, 2.2)
	fix(d, 'shelf', 36.5, 3.6, 2.6, 0.5)
	addDoor(d, { x: 30.6, y: 9.8, len: 1.3, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	addDoor(d, { x: 37.6, y: 9.8, len: 1.0, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	d.notes.push({ x: 31.2, y: 10.75, text: 'SERVICE POINT', size: 5.5 })

	windowRun(d, 4.6, BLD.d - BLD.extWall / 2, 4.4, 'h', true)
	windowRun(d, 11.4, BLD.d - BLD.extWall / 2, 4.4, 'h', true)
	addDoor(d, { x: 9.2, y: BLD.d - BLD.extWall / 2, len: 1.8, orient: 'h', hinge: 0, swing: 1, double: true, t: BLD.extWall })
	d.notes.push({ x: 10.1, y: 23.0, text: 'MAIN ENTRANCE - GLAZED CANOPY OVER', size: 7, bold: true })
	windowRun(d, 28.6, BLD.d - BLD.extWall / 2, 5.4, 'h', true)
	windowRun(d, 35.4, BLD.d - BLD.extWall / 2, 5.4, 'h', true)
	windowRun(d, 41.2, BLD.d - BLD.extWall / 2, 2.2, 'h', true)
	windowRun(d, 4.6, BLD.extWall / 2, 2.8, 'h')
	windowRun(d, 12.6, BLD.extWall / 2, 2.8, 'h')
	windowRun(d, 24.6, BLD.extWall / 2, 2.8, 'h')
	windowRun(d, 29.0, BLD.extWall / 2, 3.2, 'h')
	windowRun(d, 33.6, BLD.extWall / 2, 2.0, 'h')

	gridDims(d)
	coreDims(d)
	d.dimensions.push({ x1: XS[1] + BLD.partWall / 2, y1: 20.5, x2: XS[4] - BLD.partWall / 2, y2: 20.5, text: '11600 LOBBY', refY: 21.7 })
	d.dimensions.push({ x1: XS[7] + BLD.partWall / 2, y1: 20.5, x2: BLD.w - BLD.extWall, y2: 20.5, text: '15600 RESTAURANT', refY: 21.7 })
	corridorNotes(d, 'ARRIVALS', 'SERVICE ROUTE TO KITCHEN')
	return finish(d)
}

function floorTen(): CadFloorPlan {
	const d = draft('10', 'F10', 'Premium Guest Floor', 'A-1001')
	corridorRoom(d, 'Guest Corridor')
	coreRooms(d)
	wingStairs(d)

	guestModule(d, 0, 'north', { num: '1001', label: 'Deluxe Corner King', variant: 'corner-king' })
	sideWindow(d, 'west', 3.6)
	doubleBaySuiteNorth(d, 1, '1003', 'Signature Suite')
	guestModule(d, 3, 'north', { num: '1005', label: 'Deluxe King', variant: 'king', bathShower: true })
	guestModule(d, 4, 'north', { num: '1007', label: 'Deluxe King', variant: 'king', bathShower: true })
	guestModule(d, 5, 'north', { num: '1009', label: 'Deluxe Twin', variant: 'twin' })
	guestModule(d, 6, 'north', { num: '1011', label: 'Deluxe King', variant: 'king', bathShower: true })
	housekeepingRoom(d, 7, 'Housekeeping')
	guestModule(d, 8, 'north', { num: '1013', label: 'Deluxe King', variant: 'king', bathShower: true })
	guestModule(d, 9, 'north', { num: '1015', label: 'Deluxe Corner Twin', variant: 'corner-king' })
	lCornerAnnex(d, 'north')

	guestModule(d, 1, 'south', { num: '1002', label: 'Deluxe Corner King', variant: 'corner-king' })
	lCornerAnnex(d, 'south')
	guestModule(d, 2, 'south', { num: '1004', label: 'Deluxe Twin', variant: 'twin' })
	suiteModule(d, 3, '1006', 'Grand Suite', 'Grand Suite Living Room')

	addRoom(d, {
		type: 'club-lounge',
		name: 'Club Lounge',
		x: XS[7] + BLD.partWall / 2,
		y: BLD.southRoomY0,
		w: XS[8] - BLD.partWall - (XS[7] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - BLD.southRoomY0,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: 29.2, y: 12.2, len: 1.2, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	moduleWindow(d, 7, 'south')
	fix(d, 'sofa', 28.45, 13.25, 2.2, 0.85)
	fix(d, 'coffee-table', 29.1, 14.55, 1.1, 0.6)
	fix(d, 'dining-2', 28.5, 16.1, 1.4, 1.4)
	fix(d, 'dining-2', 30.3, 16.1, 1.4, 1.4)
	fix(d, 'lounge-seat', 28.9, 18.0, 1.6, 0.8)
	fix(d, 'bar-counter', 28.6, 19.85, 2.8, 1.0)
	fix(d, 'back-bar', 28.6, 21.05, 2.8, 0.45)

	guestModule(d, 8, 'south', { num: '1008', label: 'Deluxe King', variant: 'king', bathShower: true })
	guestModule(d, 9, 'south', { num: '1010', label: 'Deluxe Twin', variant: 'twin' })
	guestModule(d, 10, 'south', { num: '1012', label: 'Premium Corner Suite', variant: 'corner-king' })

	soilShafts(d)
	gridDims(d)
	coreDims(d)
	corridorNotes(d, 'GUEST CORRIDOR', 'GUEST CORRIDOR')
	d.notes.push({ x: 29.9, y: 16.2, text: 'CLUB LOUNGE', size: 6.5, bold: true })
	return finish(d)
}

function floorEleven(): CadFloorPlan {
	const d = draft('11', 'F11', 'Signature Floor - Suites and Lounge', 'A-1101')
	corridorRoom(d, 'Guest Corridor')
	coreRooms(d)
	wingStairs(d)

	const px0 = BLD.extWall
	const pw = XS[4] - BLD.partWall / 2 - BLD.extWall
	addRoom(d, { type: 'presidential-living', name: 'Presidential Living and Dining', x: px0, y: BLD.extWall, w: 7.65, h: BLD.northRoomY1 - BLD.extWall, category: 'guest', roomNumber: '1101', suite: true, showArea: true })
	addRoom(d, { type: 'presidential-master', name: 'Master Bedroom', x: 8.05, y: BLD.extWall, w: 3.85, h: NORTH_ROOM_Y1_P - BLD.extWall, category: 'guest', suite: true })
	addRoom(d, { type: 'presidential-bath', name: 'Master Bath', x: 8.05, y: 7.1, w: 3.85, h: BLD.northRoomY1 - 7.1, category: 'guest', bathroom: true })
	addRoom(d, { type: 'presidential-second', name: 'Second Bedroom', x: 12.05, y: BLD.extWall, w: pw - 11.75, h: NORTH_ROOM_Y1_P - BLD.extWall, category: 'guest', suite: true })
	addRoom(d, { type: 'presidential-gallery', name: 'Gallery', x: 12.05, y: 7.1, w: pw - 11.75, h: BLD.northRoomY1 - 7.1, category: 'circulation' })
	addDoor(d, { x: 13.2, y: 9.8, len: 1.1, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	addDoor(d, { x: 3.6, y: 9.8, len: 1.2, orient: 'h', hinge: 0, swing: 1, t: BLD.partWall })
	addDoor(d, { x: 8.0, y: 3.4, len: 1.2, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.lightWall })
	addDoor(d, { x: 9.2, y: 7.05, len: 0.95, orient: 'h', hinge: 0, swing: 1, open: true, t: BLD.lightWall })
	addDoor(d, { x: 13.4, y: 7.05, len: 0.95, orient: 'h', hinge: 0, swing: 1, open: true, t: BLD.lightWall })
	addDoor(d, { x: 11.95, y: 7.8, len: 0.8, orient: 'v', hinge: 0, swing: -1, t: BLD.lightWall })
	for (const b of [0, 1, 2, 3]) moduleWindow(d, b, 'north')
	fix(d, 'sofa', 0.8, 1.2, 2.6, 0.95)
	fix(d, 'coffee-table', 1.6, 2.8, 1.4, 0.7)
	fix(d, 'dining-6', 4.4, 2.4, 2.8, 2.0)
	fix(d, 'piano', 0.7, 5.6, 2.4, 1.6)
	fix(d, 'bar-counter', 5.4, 6.4, 2.2, 0.95)
	fix(d, 'bed-king', 9.05, 0.55, 1.85, 2.05)
	fix(d, 'nightstand', 8.35, 0.55, 0.42, 0.45)
	fix(d, 'nightstand', 11.2, 0.55, 0.42, 0.45)
	fix(d, 'tv', 9.2, 6.25, 1.6, 0.42)
	fix(d, 'tub', 8.3, 7.25, 1.75, 0.78)
	fix(d, 'shower', 10.9, 7.25, 0.92, 0.92)
	fix(d, 'toilet', 11.15, 8.6, 0.52, 0.78)
	fix(d, 'basin', 8.3, 9.05, 0.55, 0.46)
	fix(d, 'bed-king', 13.1, 0.55, 1.8, 2.0)

	doubleBaySuiteNorth(d, 4, '1103', 'Signature Suite')
	guestModule(d, 6, 'north', { num: '1105', label: 'Deluxe King', variant: 'king', bathShower: true })
	housekeepingRoom(d, 7, 'Service Pantry')
	addDoor(d, { x: 32, y: 8.6, len: 1.1, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.partWall })

	addRoom(d, {
		type: 'executive-lounge',
		name: 'Executive Lounge',
		x: XS[8] + BLD.partWall / 2,
		y: BLD.extWall,
		w: XS[10] - BLD.extWall - (XS[8] + BLD.partWall / 2),
		h: BLD.northRoomY1 - BLD.extWall,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: 33.6, y: 9.8, len: 1.4, orient: 'h', hinge: 0, swing: 1, double: true, t: BLD.partWall })
	for (const b of [8, 9]) moduleWindow(d, b, 'north')
	fix(d, 'sofa', 32.6, 1.2, 2.3, 0.9)
	fix(d, 'coffee-table', 33.3, 2.6, 1.2, 0.65)
	fix(d, 'lounge-seat', 35.4, 1.2, 1.6, 0.8)
	fix(d, 'bar-counter', 37.6, 1.0, 2.0, 0.95)
	fix(d, 'back-bar', 37.6, 2.2, 2.0, 0.45)
	fix(d, 'dining-2', 33.0, 5.0, 1.4, 1.4)
	fix(d, 'dining-2', 34.9, 5.0, 1.4, 1.4)
	fix(d, 'boardroom', 36.6, 4.6, 2.9, 1.9)

	addRoom(d, {
		type: 'sky-bar',
		name: 'Sky Bar',
		x: XS[1] + BLD.partWall / 2,
		y: BLD.southRoomY0,
		w: XS[3] - BLD.partWall / 2 - (XS[1] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - BLD.southRoomY0,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: 6.2, y: 12.2, len: 1.4, orient: 'h', hinge: 0, swing: -1, double: true, t: BLD.partWall })
	moduleWindow(d, 1, 'south')
	moduleWindow(d, 2, 'south')
	fix(d, 'bar-counter', 4.7, 13.4, 3.4, 1.05)
	fix(d, 'back-bar', 4.7, 12.55, 3.4, 0.5)
	fix(d, 'lounge-seat', 9.0, 13.6, 1.7, 0.85)
	fix(d, 'coffee-table', 9.6, 15.0, 1.1, 0.6)
	fix(d, 'dining-2', 10.2, 16.0, 1.4, 1.4)
	fix(d, 'piano', 9.3, 17.8, 2.4, 1.6)
	fix(d, 'sofa', 4.9, 19.4, 2.3, 0.9)
	fix(d, 'coffee-table', 5.6, 20.6, 1.2, 0.65)

	addRoom(d, {
		type: 'sky-terrace',
		name: 'Sky Terrace',
		x: BLD.extWall,
		y: SOUTH_STRIP.y0,
		w: XS[1] - BLD.extWall - BLD.partWall / 2,
		h: BLD.d - BLD.extWall - SOUTH_STRIP.y0,
		category: 'public',
		draw: 'terrace',
	})
	addDoor(d, { x: XS[1], y: 19.2, len: 1.2, orient: 'v', hinge: 0, swing: 1, open: true, t: BLD.partWall })
	windowRun(d, BLD.extWall / 2, 18.4, 2.6, 'v')

	suiteModule(d, 3, '1107', "Owner's Suite", "Owner's Suite Living Room")

	addRoom(d, {
		type: 'private-dining',
		name: 'Private Dining',
		x: XS[7] + BLD.partWall / 2,
		y: BLD.southRoomY0,
		w: XS[8] - BLD.partWall - (XS[7] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - BLD.southRoomY0,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: 29.2, y: 12.2, len: 1.2, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	moduleWindow(d, 7, 'south')
	fix(d, 'dining-6', 28.8, 15.4, 2.7, 2.0)
	fix(d, 'service-station', 31.0, 13.0, 0.75, 1.5)

	addRoom(d, {
		type: 'meeting-a',
		name: 'Meeting Room A',
		x: XS[8] + BLD.partWall / 2,
		y: BLD.southRoomY0,
		w: XS[9] - BLD.partWall - (XS[8] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - BLD.southRoomY0,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: 33.2, y: 12.2, len: 1.2, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	moduleWindow(d, 8, 'south')
	fix(d, 'meeting-table', 32.5, 15.2, 3.2, 2.2)

	addRoom(d, {
		type: 'meeting-b',
		name: 'Meeting Room B',
		x: XS[9] + BLD.partWall / 2,
		y: BLD.southRoomY0,
		w: XS[10] - BLD.partWall / 2 - (XS[9] + BLD.partWall / 2),
		h: BLD.d - BLD.extWall - BLD.southRoomY0,
		category: 'public',
		showArea: true,
	})
	addDoor(d, { x: 37.2, y: 12.2, len: 1.2, orient: 'h', hinge: 0, swing: -1, t: BLD.partWall })
	moduleWindow(d, 9, 'south')
	fix(d, 'meeting-table', 36.5, 15.2, 3.2, 2.2)

	guestModule(d, 10, 'south', { num: '1109', label: 'Premium Corner Suite', variant: 'corner-king' })

	soilShafts(d)
	gridDims(d)
	coreDims(d)
	corridorNotes(d, 'GUEST CORRIDOR', 'GUEST CORRIDOR')
	return finish(d)
}

function roofFloor(): CadFloorPlan {
	const d = draft('R', 'FR', 'Roof Plant Level', 'A-R01')
	coreRoomsRoof(d)
	addRoom(d, { type: 'bulkhead-a', name: 'SC-A Bulkhead', x: BLD.extWall, y: CORE_Y0, w: XS[1] - BLD.extWall - BLD.partWall / 2, h: CORE_Y1 - CORE_Y0, category: 'back' })
	addRoom(d, { type: 'bulkhead-b', name: 'SC-B Bulkhead', x: XS[10] + BLD.partWall / 2, y: 5.4, w: BLD.w - BLD.extWall - (XS[10] + BLD.partWall / 2), h: BLD.northRoomY1 - 5.4, category: 'back' })
	addRoom(d, { type: 'ahu-deck', name: 'AHU Deck', x: 30.1, y: 3.0, w: 3.9, h: 4.0, category: 'service', showArea: true })
	addRoom(d, { type: 'ct-deck', name: 'Cooling Towers', x: 34.3, y: 3.0, w: 3.6, h: 4.0, category: 'service', showArea: true })
	fix(d, 'ahu', 30.4, 3.3, 1.7, 3.4)
	fix(d, 'ahu', 32.3, 3.3, 1.4, 3.4)
	fix(d, 'cooling-tower', 34.5, 3.3, 1.6, 1.7)
	fix(d, 'cooling-tower', 34.5, 5.2, 1.6, 1.7)
	fix(d, 'solar-array', 2.0, 2.0, 12.0, 4.5)
	fix(d, 'dish', 38.6, 2.0, 1.5, 1.5)
	fix(d, 'dish', 40.6, 2.0, 1.2, 1.2)
	fix(d, 'hatch', 29.0, 12.6, 1.1, 1.1)
	fix(d, 'hatch', 1.0, 12.6, 1.1, 1.1)
	d.notes.push({ x: 22, y: 19.5, text: 'ROOF - MEMBRANE FELL TO DRAINS AT 1:60. PARAPET 1100 HIGH.', size: 7 })
	d.notes.push({ x: 8, y: 8.2, text: 'PV ARRAY 48 PANELS', size: 6.5 })
	gridDims(d)
	return finish(d)
}

function coreRoomsRoof(d: Draft): void {
	addRoom(d, {
		id: `lift-overrun-${d.floorId}`,
		type: 'lift-machine',
		name: 'Lift Motor Room',
		x: 20.05,
		y: CORE_Y0,
		w: 7.9,
		h: 2.25,
		category: 'back',
		showArea: true,
	})
	addRoom(d, {
		id: `riser-mep-${d.floorId}`,
		type: 'shaft',
		name: 'MEP Risers',
		x: 20.05,
		y: 14.65,
		w: 7.9,
		h: CORE_Y1 - 14.65,
		category: 'service',
		draw: 'shaft',
	})
	addRoom(d, {
		id: `stair-bulkhead-1-${d.floorId}`,
		type: 'bulkhead',
		name: 'SC-1 Bulkhead',
		x: 16.1,
		y: CORE_Y0,
		w: 3.75,
		h: CORE_Y1 - CORE_Y0,
		category: 'back',
	})
}

const CORE_Y0 = 12.3
const CORE_Y1 = 16.95
const CORE_X1 = 28
const NORTH_ROOM_Y1_P = 7.0

export function buildFloors(): CadFloorPlan[] {
	return [groundFloor(), ...['2', '3', '4', '5', '6', '7', '8', '9'].map(guestFloor), floorTen(), floorEleven(), roofFloor()]
}
