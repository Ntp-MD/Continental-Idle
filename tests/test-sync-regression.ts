import assert from 'node:assert/strict'
import type { SyncedLayoutPayload, SyncedFloor, SyncedRoom, SyncedObject } from '../src/blueprint-editor/types'
import { normalizeAnchorPoints, normalizeInteractConfig } from '../src/blueprint-editor/types'

import { applySyncedLayout, FLOOR_IDS, FLOOR_LAYOUT, FLOOR_OBJECTS, FLOOR_ALLOWED_ROLES, FLOOR_DEFAULT_WALKABLE, SYNCED_CANVAS, SYNCED_NPC_CONFIG, type SyncedLayoutData } from '../src/components/overlays/hqLayout'

function makeRoom(overrides: Partial<SyncedRoom> = {}): SyncedRoom {
	return {
		id: 'room-1',
		x: 10,
		y: 10,
		w: 100,
		h: 100,
		label: 'Test Room',
		roomType: 'reception',
		radius: 5,
		walkable: true,
		...overrides,
	}
}

function makeObject(overrides: Partial<SyncedObject> = {}): SyncedObject {
	return {
		id: 'obj-1',
		type: 'desk',
		x: 50,
		y: 50,
		w: 20,
		h: 20,
		rotation: 0,
		walkable: false,
		entranceRequired: true,
		...overrides,
	}
}

function makeFloor(overrides: Partial<SyncedFloor> = {}): SyncedFloor {
	return {
		defaultWalkable: true,
		rooms: [makeRoom()],
		objects: [makeObject()],
		...overrides,
	}
}

function makePayload(overrides: Partial<SyncedLayoutPayload> = {}): SyncedLayoutPayload {
	return {
		version: 3,
		canvas: { width: 1600, height: 600, tileSize: 1 },
		floors: { G: makeFloor() },
		...overrides,
	}
}

// Test 1: Full DTO round-trip — apply sets all fields
{
	const payload = makePayload({
		floors: {
			G: makeFloor({
				defaultWalkable: false,
				allowedRoleIds: ['staff', 'assassin'],
				rooms: [makeRoom({
					id: 'lobby',
					label: 'Lobby',
					roomType: 'reception',
					radius: 10,
					walkable: false,
					entrances: [{ side: 'bottom', offset: 50, width: 20 }],
					anchorPoints: [{ x: 5, y: 5 }],
					interact: { capacity: 3, durationMin: 2, durationMax: 5 },
					tags: ['vip', 'service'],
				})],
				objects: [makeObject({
					id: 'desk-1',
					type: 'receptionDesk',
					walkable: false,
					entranceRequired: true,
					walkableGrid: [[true, false]],
					tileStates: [['walkable', 'blocked']],
					tileEdges: [[{ right: true }]],
					anchorPoints: [{ x: 0, y: 10 }],
					interact: { capacity: 1, durationMin: 1, durationMax: 3 },
					tags: ['reception'],
					roomId: 'lobby',
					label: 'Front Desk',
					fillColor: '#ff0000',
				})],
			}),
		},
		npcConfig: {
			speed: 1,
			defaultRoleId: 'staff',
			roles: [],
			tasks: [],
			pool: [],
		},
	})

	applySyncedLayout(payload)

	assert.equal(FLOOR_IDS.includes('G'), true, 'G floor should be in FLOOR_IDS')
	assert.equal(FLOOR_DEFAULT_WALKABLE['G'], false, 'defaultWalkable should be false')
	assert.deepEqual(FLOOR_ALLOWED_ROLES['G'], ['staff', 'assassin'], 'allowedRoleIds should be preserved')

	const rooms = FLOOR_LAYOUT['G']
	assert.equal(rooms.length, 1, 'should have 1 room')
	const room = rooms[0]
	assert.equal(room.id, 'lobby')
	assert.equal(room.label, 'Lobby')
	assert.equal(room.roomType, 'reception')
	assert.equal(room.radius, 10)
	assert.equal(room.walkable, false)
	assert.equal(room.entrances?.length, 1)
	assert.deepEqual(room.entrances?.[0], { side: 'bottom', offset: 50, width: 20 })
	assert.equal(room.anchorPoints?.length, 1)
	assert.deepEqual(room.anchorPoints?.[0], { x: 5, y: 5 })
	assert.equal(room.interact?.capacity, 3)
	assert.equal(room.interact?.durationMin, 2)
	assert.equal(room.interact?.durationMax, 5)
	assert.deepEqual(room.tags, ['vip', 'service'])

	const objects = FLOOR_OBJECTS['G']
	assert.equal(objects.length, 1, 'should have 1 object')
	const obj = objects[0]
	assert.equal(obj.id, 'desk-1')
	assert.equal(obj.type, 'receptionDesk')
	assert.equal(obj.walkable, false)
	assert.equal(obj.entranceRequired, true)
	assert.deepEqual(obj.walkableGrid, [[true, false]])
	assert.deepEqual(obj.tileStates, [['walkable', 'blocked']])
	assert.equal(obj.tileEdges?.length, 1)
	assert.equal(obj.tileEdges?.[0]?.[0]?.right, true)
	assert.equal(obj.anchorPoints?.length, 1)
	assert.equal(obj.interact?.capacity, 1)
	assert.equal(obj.label, 'Front Desk')
	assert.equal(obj.fillColor, '#ff0000')
	assert.equal(obj.roomId, 'lobby')
	assert.deepEqual(obj.tags, ['reception'])

	assert.equal(SYNCED_CANVAS.width, 1600)
	assert.equal(SYNCED_CANVAS.height, 600)
	assert.equal(SYNCED_CANVAS.tileSize, 1)

	assert.equal(SYNCED_NPC_CONFIG.value !== null, true)
	assert.equal(SYNCED_NPC_CONFIG.value?.defaultRoleId, 'staff')

	console.log('✓ Test 1: Full DTO round-trip passed')
}

// Test 2: Empty arrays clear static fallback data
{
	const payload = makePayload({
		floors: {
			G: makeFloor({ rooms: [], objects: [] }),
		},
	})

	applySyncedLayout(payload)

	assert.equal(FLOOR_LAYOUT['G'].length, 0, 'empty rooms array should clear rooms')
	assert.equal(FLOOR_OBJECTS['G'].length, 0, 'empty objects array should clear objects')

	console.log('✓ Test 2: Empty arrays clear static fallback data passed')
}

// Test 3: defaultWalkable preservation
{
	applySyncedLayout(makePayload({
		floors: { G: makeFloor({ defaultWalkable: false }) },
	}))
	assert.equal(FLOOR_DEFAULT_WALKABLE['G'], false, 'defaultWalkable=false should be preserved')

	applySyncedLayout(makePayload({
		floors: { G: makeFloor({ defaultWalkable: true }) },
	}))
	assert.equal(FLOOR_DEFAULT_WALKABLE['G'], true, 'defaultWalkable=true should be preserved')

	applySyncedLayout(makePayload({
		floors: { G: makeFloor({ defaultWalkable: undefined }) },
	}))
	assert.equal(FLOOR_DEFAULT_WALKABLE['G'], true, 'missing defaultWalkable should default to true')

	console.log('✓ Test 3: defaultWalkable preservation passed')
}

// Test 4: Removed floors are removed from runtime maps
{
	applySyncedLayout(makePayload({
		floors: {
			G: makeFloor(),
			'1': makeFloor(),
		},
	}))
	assert.equal(FLOOR_IDS.includes('1'), true, 'floor 1 should exist')

	applySyncedLayout(makePayload({
		floors: { G: makeFloor() },
	}))
	assert.equal(FLOOR_IDS.includes('1'), false, 'floor 1 should be removed')
	assert.equal(FLOOR_LAYOUT['1'] === undefined, true, 'FLOOR_LAYOUT[1] should be deleted')
	assert.equal(FLOOR_OBJECTS['1'] === undefined, true, 'FLOOR_OBJECTS[1] should be deleted')
	assert.equal(FLOOR_ALLOWED_ROLES['1'] === undefined, true, 'FLOOR_ALLOWED_ROLES[1] should be deleted')
	assert.equal(FLOOR_DEFAULT_WALKABLE['1'] === undefined, true, 'FLOOR_DEFAULT_WALKABLE[1] should be deleted')

	console.log('✓ Test 4: Removed floors are removed from runtime maps passed')
}

// Test 5: NPC config arrives in runtime
{
	applySyncedLayout(makePayload({
		npcConfig: {
			speed: 2,
			defaultRoleId: 'guest',
			roles: [{ id: 'guest', label: 'Guest', color: '#fff', focusTags: [], restrictedTags: [], taskIds: [], focusChance: 100 }],
			tasks: [{ id: 'wander', label: 'Wander', tags: [] }],
			pool: [],
		},
	}))
	assert.equal(SYNCED_NPC_CONFIG.value?.speed, 2)
	assert.equal(SYNCED_NPC_CONFIG.value?.defaultRoleId, 'guest')
	assert.equal(SYNCED_NPC_CONFIG.value?.roles.length, 1)

	console.log('✓ Test 5: NPC config arrives in runtime passed')
}

// Test 6: Room anchors are preserved, not regenerated
{
	const customAnchors = [{ x: 10, y: 20 }, { x: 30, y: 40 }]
	applySyncedLayout(makePayload({
		floors: {
			G: makeFloor({
				rooms: [makeRoom({
					id: 'anchored-room',
					anchorPoints: customAnchors,
				})],
			}),
		},
	}))

	const room = FLOOR_LAYOUT['G'].find(r => r.id === 'anchored-room')
	assert.equal(room?.anchorPoints?.length, 2)
	assert.deepEqual(room?.anchorPoints?.[0], { x: 10, y: 20 })
	assert.deepEqual(room?.anchorPoints?.[1], { x: 30, y: 40 })

	console.log('✓ Test 6: Room anchors are preserved passed')
}

// Test 7: Canvas values are applied
{
	applySyncedLayout(makePayload({
		canvas: { width: 800, height: 400, tileSize: 2 },
	}))
	assert.equal(SYNCED_CANVAS.width, 800)
	assert.equal(SYNCED_CANVAS.height, 400)
	assert.equal(SYNCED_CANVAS.tileSize, 2)

	console.log('✓ Test 7: Canvas values are applied passed')
}

// Test 8: Floor ordering (G first, then numeric)
{
	applySyncedLayout(makePayload({
		floors: {
			'3': makeFloor(),
			'1': makeFloor(),
			G: makeFloor(),
			'2': makeFloor(),
		},
	}))
	assert.equal(FLOOR_IDS[0], 'G', 'G should be first')
	assert.equal(FLOOR_IDS[1], '1')
	assert.equal(FLOOR_IDS[2], '2')
	assert.equal(FLOOR_IDS[3], '3')

	console.log('✓ Test 8: Floor ordering passed')
}

console.log('\nAll sync regression tests passed!')
