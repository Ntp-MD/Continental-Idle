import type { FloorData, TileBrush } from '../domain/types'
import { applyTileBrush, normalizeAllowedRoleIds, normalizeFloorWalkable, normalizeNpcSpawnZones, resolveFloorTileStates, resolveStreetTiles, tileStatesToWalkableGrid } from '../domain/types'
import type { BlueprintStore, FloorPatch } from './state'
import { genId, cloneDeepRaw } from './storeUtils'

export function createFloorCommands(store: BlueprintStore) {
	const state = store.state
	const saveBlueprintData = () => store.save()

	async function addFloor(): Promise<FloorData | null> {
		const existing = new Set(state.layout.floors.map(f => f.label))
		let n = 1
		while (existing.has(`F${n}`)) n++
		const floor: FloorData = { id: genId('floor'), name: `Floor ${n}`, label: `F${n}`, objects: [], defaultWalkable: true }
		state.layout.floors.push(floor)
		const saved = await saveBlueprintData()
		return saved ? floor : null
	}

	async function deleteFloor(id: string): Promise<boolean> {
		if (state.layout.floors.length <= 1) return false
		const floor = state.layout.floors.find(f => f.id === id)
		if (!floor) return false
		state.layout.floors = state.layout.floors.filter(f => f.id !== id)
		if (state.currentFloorId === id) {
			state.currentFloorId = state.layout.floors[0].id
		}
		if (state.layout.streetFloorId === id) {
			delete state.layout.streetFloorId
		}
		state.selectionState = { primary: null, items: [] }
		return saveBlueprintData()
	}

	async function clearFloor(id: string): Promise<boolean> {
		const floor = state.layout.floors.find(f => f.id === id)
		if (!floor) return false
		if (floor.objects.length === 0) return true
		floor.objects = []
		state.selectionState = { primary: null, items: [] }
		return saveBlueprintData()
	}

	async function duplicateFloor(id: string): Promise<boolean> {
		const floor = state.layout.floors.find(f => f.id === id)
		if (!floor) return false
		const copy: FloorData = cloneDeepRaw(floor)
		copy.id = genId('floor')
		copy.name = `${floor.name} Copy`
		const linkGroupMap = new Map<string, string>()
		for (const o of copy.objects) {
			o.id = genId('obj')
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
		return saveBlueprintData()
	}

	async function renameFloor(id: string, name: string): Promise<boolean> {
		const floor = state.layout.floors.find(f => f.id === id)
		if (!floor) return false
		floor.name = name
		return saveBlueprintData()
	}

	async function reorderFloors(fromIndex: number, toIndex: number): Promise<boolean> {
		if (fromIndex === toIndex) return false
		if (fromIndex < 0 || toIndex < 0) return false
		if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return false
		const floors = state.layout.floors
		const [moved] = floors.splice(fromIndex, 1)
		floors.splice(toIndex, 0, moved)
		return saveBlueprintData()
	}

	function selectFloor(id: string) {
		state.currentFloorId = id
		state.selectionState = { primary: null, items: [] }
	}

	async function updateFloor(id: string, patch: FloorPatch): Promise<boolean> {
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
		return saveBlueprintData()
	}

	async function paintFloorTiles(
		floorId: string,
		brush: TileBrush,
		rect: { row0: number; col0: number; row1: number; col1: number },
	): Promise<boolean> {
		const floor = state.layout.floors.find(f => f.id === floorId)
		if (!floor) return false
		const tileSize = Math.max(1, Math.round(state.layout.canvas.tileSize))
		const cols = Math.max(1, Math.ceil(state.layout.canvas.width / tileSize))
		const rows = Math.max(1, Math.ceil(state.layout.canvas.height / tileSize))
		const street = resolveStreetTiles(state.layout)
		const states = resolveFloorTileStates(floor, rows, cols)
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				if (row < street || row >= rows - street || col < street || col >= cols - street) states[row][col] = 'walkable'
			}
		}
		applyTileBrush(states, brush, Math.min(rect.row0, rect.row1), Math.min(rect.col0, rect.col1), Math.max(rect.row0, rect.row1), Math.max(rect.col0, rect.col1))
		const walkableGrid = tileStatesToWalkableGrid(states)
		floor.walkable = { walkableGrid, tileStates: states }
		return saveBlueprintData()
	}

	return {
		addFloor, clearFloor, deleteFloor, duplicateFloor, renameFloor,
		reorderFloors, selectFloor, updateFloor, paintFloorTiles,
	}
}

export type FloorCommands = ReturnType<typeof createFloorCommands>