import type { FloorData } from '../types'
import { normalizeAllowedRoleIds } from '../types'
import { state } from './state'
import { genId } from './utils'
import { saveLayout } from './persistence'

export async function addFloor(): Promise<FloorData> {
	const existing = new Set(state.layout.floors.map(f => f.label))
	let n = 1
	while (existing.has(`F${n}`)) n++
	const floor: FloorData = { id: genId('floor'), name: `Floor ${n}`, label: `F${n}`, rooms: [], objects: [], defaultWalkable: true }
	state.layout.floors.push(floor)
	await saveLayout()
	return floor
}

export async function deleteFloor(id: string): Promise<void> {
	if (state.layout.floors.length <= 1) return
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return
	state.layout.floors = state.layout.floors.filter(f => f.id !== id)
	if (state.currentFloorId === id) {
		state.currentFloorId = state.layout.floors[0].id
	}
	state.selectionState = { primary: null, items: [] }
	await saveLayout()
}

export async function duplicateFloor(id: string): Promise<void> {
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return
	const copy: FloorData = JSON.parse(JSON.stringify(floor))
	copy.id = genId('floor')
	copy.name = `${floor.name} Copy`
	const roomIdMap = new Map<string, string>()
	copy.rooms.forEach(r => {
		const newId = genId('room')
		roomIdMap.set(r.id, newId)
		r.id = newId
	})
	const idMap = new Map<string, string>()
	const linkGroupMap = new Map<string, string>()
	for (const o of copy.objects) {
		const newId = genId('obj')
		idMap.set(o.id, newId)
		o.id = newId
		o.subId = genId('sub')
		if (o.linkGroupId) {
			let mappedGroupId = linkGroupMap.get(o.linkGroupId)
			if (!mappedGroupId) {
				mappedGroupId = genId('link')
				linkGroupMap.set(o.linkGroupId, mappedGroupId)
			}
			o.linkGroupId = mappedGroupId
		}
		if (o.roomId) {
			const mappedRoomId = roomIdMap.get(o.roomId)
			if (mappedRoomId) o.roomId = mappedRoomId
			else delete o.roomId
		}
	}
	const idx = state.layout.floors.findIndex(f => f.id === id)
	state.layout.floors.splice(idx + 1, 0, copy)
	await saveLayout()
}

export async function renameFloor(id: string, name: string): Promise<void> {
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return
	floor.name = name
	await saveLayout()
}

export async function reorderFloors(fromIndex: number, toIndex: number): Promise<void> {
	if (fromIndex === toIndex) return
	if (fromIndex < 0 || toIndex < 0) return
	if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return
	const floors = state.layout.floors
	const [moved] = floors.splice(fromIndex, 1)
	floors.splice(toIndex, 0, moved)
	await saveLayout()
}

export function selectFloor(id: string) {
	state.currentFloorId = id
	state.selectionState = { primary: null, items: [] }
}


export async function updateFloor(
	id: string,
	patch: Partial<Pick<FloorData, 'allowedRoleIds' | 'defaultWalkable' | 'name' | 'label'>>,
): Promise<void> {
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return
	if (patch.allowedRoleIds !== undefined) {
		const normalized = normalizeAllowedRoleIds(patch.allowedRoleIds)
		if (normalized) floor.allowedRoleIds = normalized
		else delete floor.allowedRoleIds
	}
	if (patch.defaultWalkable !== undefined) floor.defaultWalkable = patch.defaultWalkable
	if (patch.name !== undefined) floor.name = patch.name
	if (patch.label !== undefined) floor.label = patch.label
	await saveLayout()
}
