import type { FloorData } from '../types'
import { normalizeAllowedRoleIds, normalizeFloorWalkable, normalizeNpcSpawnZones } from '../types'
import { state } from './state'
import { genId } from './utils'
import { saveLayout } from './persistence'

export async function addFloor(): Promise<FloorData | null> {
	const existing = new Set(state.layout.floors.map(f => f.label))
	let n = 1
	while (existing.has(`F${n}`)) n++
	const floor: FloorData = { id: genId('floor'), name: `Floor ${n}`, label: `F${n}`, objects: [], defaultWalkable: true }
	state.layout.floors.push(floor)
	const saved = await saveLayout()
	return saved ? floor : null
}

export async function deleteFloor(id: string): Promise<boolean> {
	if (state.layout.floors.length <= 1) return false
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return false
	state.layout.floors = state.layout.floors.filter(f => f.id !== id)
	if (state.currentFloorId === id) {
		state.currentFloorId = state.layout.floors[0].id
	}
	state.selectionState = { primary: null, items: [] }
	return saveLayout()
}

export async function duplicateFloor(id: string): Promise<boolean> {
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return false
	const copy: FloorData = JSON.parse(JSON.stringify(floor))
	copy.id = genId('floor')
	copy.name = `${floor.name} Copy`
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
	}
	const idx = state.layout.floors.findIndex(f => f.id === id)
	state.layout.floors.splice(idx + 1, 0, copy)
	return saveLayout()
}

export async function renameFloor(id: string, name: string): Promise<boolean> {
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return false
	floor.name = name
	return saveLayout()
}

export async function reorderFloors(fromIndex: number, toIndex: number): Promise<boolean> {
	if (fromIndex === toIndex) return false
	if (fromIndex < 0 || toIndex < 0) return false
	if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return false
	const floors = state.layout.floors
	const [moved] = floors.splice(fromIndex, 1)
	floors.splice(toIndex, 0, moved)
	return saveLayout()
}

export function selectFloor(id: string) {
	state.currentFloorId = id
	state.selectionState = { primary: null, items: [] }
}


export async function updateFloor(
	id: string,
	patch: Partial<Pick<FloorData, 'allowedRoleIds' | 'defaultWalkable' | 'name' | 'label' | 'walkable' | 'spawnZones'>>,
): Promise<boolean> {
	const floor = state.layout.floors.find(f => f.id === id)
	if (!floor) return false
	if (patch.allowedRoleIds !== undefined) {
		const normalized = normalizeAllowedRoleIds(patch.allowedRoleIds)
		if (normalized) floor.allowedRoleIds = normalized
		else delete floor.allowedRoleIds
	}
	if (patch.defaultWalkable !== undefined) floor.defaultWalkable = patch.defaultWalkable
	if (patch.walkable !== undefined) {
		const normalized = normalizeFloorWalkable(patch.walkable)
		if (normalized) floor.walkable = normalized
		else delete floor.walkable
	}
	if (patch.spawnZones !== undefined) {
		const normalized = normalizeNpcSpawnZones(patch.spawnZones)
		if (normalized) floor.spawnZones = normalized
		else delete floor.spawnZones
	}
	if (patch.name !== undefined) floor.name = patch.name
	if (patch.label !== undefined) floor.label = patch.label
	return saveLayout()
}
