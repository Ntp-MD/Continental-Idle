export interface RoomTypeSpec {
	id: string
	label: string
	detectTags: readonly string[]
	privacy: 'open' | 'private'
	priority: number
}

export const ROOM_TYPE_SPECS: readonly RoomTypeSpec[] = [
	{ id: 'bedroom', label: 'Guest Bedroom', detectTags: ['living'], privacy: 'private', priority: 10 },
	{ id: 'bathroom', label: 'Bathroom', detectTags: ['hygiene'], privacy: 'private', priority: 20 },
	{ id: 'spa', label: 'Spa', detectTags: ['wellness'], privacy: 'private', priority: 30 },
	{ id: 'pool', label: 'Pool', detectTags: ['pool'], privacy: 'open', priority: 40 },
	{ id: 'kitchen', label: 'Kitchen', detectTags: ['cooking'], privacy: 'open', priority: 40 },
	{ id: 'restaurant', label: 'Restaurant', detectTags: ['dining'], privacy: 'open', priority: 40 },
	{ id: 'bar', label: 'Bar', detectTags: ['bar'], privacy: 'open', priority: 40 },
	{ id: 'gym', label: 'Gym', detectTags: ['fitness'], privacy: 'open', priority: 40 },
	{ id: 'lounge', label: 'Lounge', detectTags: ['lounge'], privacy: 'open', priority: 40 },
	{ id: 'laundry', label: 'Laundry', detectTags: ['laundry'], privacy: 'open', priority: 40 },
	{ id: 'conference', label: 'Conference Room', detectTags: ['meeting'], privacy: 'open', priority: 40 },
	{ id: 'shop', label: 'Shop', detectTags: ['retail'], privacy: 'open', priority: 40 },
	{ id: 'staff-room', label: 'Staff Room', detectTags: ['back-of-house'], privacy: 'open', priority: 40 },
	{ id: 'storage', label: 'Storage', detectTags: ['storage'], privacy: 'open', priority: 40 },
	{ id: 'lobby', label: 'Lobby', detectTags: ['front-desk'], privacy: 'open', priority: 50 },
]

export const HALL_ROOM_TYPE: RoomTypeSpec = { id: 'hall', label: 'Hallway', detectTags: [], privacy: 'open', priority: 999 }

export function resolveRoomType(fixtureTagSets: readonly (readonly string[])[]): RoomTypeSpec {
	let best: RoomTypeSpec | undefined
	for (const tags of fixtureTagSets) {
		for (const spec of ROOM_TYPE_SPECS) {
			if (!spec.detectTags.some(tag => tags.includes(tag))) continue
			if (!best || spec.priority < best.priority) best = spec
		}
	}
	return best ?? HALL_ROOM_TYPE
}

export function isPrivateRoomType(typeId: string): boolean {
	const spec = typeId === HALL_ROOM_TYPE.id ? HALL_ROOM_TYPE : ROOM_TYPE_SPECS.find(candidate => candidate.id === typeId)
	return spec?.privacy === 'private'
}

