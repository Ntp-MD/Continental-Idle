export const NPC_ENGINE_TICKS_PER_SECOND = 60

export const NPC_ENGINE_DEFAULT_AGENT_CLEARANCE = 0.5

export const ROOM_TYPE_TAGS: Record<string, string[]> = {
	reception: ['reception', 'guestRooms', 'vip'],
	guestRoom: ['guestRooms'],
	lounge: ['vip', 'guestRooms'],
	bar: ['bar'],
	kitchen: ['kitchen'],
	laundry: ['laundry', 'underground'],
	staffRoom: ['staffRoom', 'security'],
	armory: ['armory', 'security'],
	vault: ['vault', 'security'],
	safeHouse: ['safeHouse', 'security'],
	blackMarket: ['blackMarket', 'underground'],
	controlCenter: ['controlCenter', 'security'],
	datacenter: ['datacenter', 'intelNetwork'],
	loadingBay: ['loadingBay', 'underground'],
}

export function getRoomTags(roomType: string | undefined, roomTags: string[] | undefined): string[] {
	const tags = new Set<string>()
	if (roomType) {
		tags.add(roomType)
		for (const tag of ROOM_TYPE_TAGS[roomType] ?? []) tags.add(tag)
	}
	if (roomTags) for (const tag of roomTags) tags.add(tag)
	return [...tags]
}
