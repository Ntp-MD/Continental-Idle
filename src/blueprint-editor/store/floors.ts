import type { FloorData, NpcSpawnZone, Rect, TileBrush } from '../domain/types'
import { applyTileBrush, normalizeAllowedRoleIds, normalizeFloorWalkable, normalizeNpcSpawnZones, normalizeText, resolveFloorTileStates, resolveStreetTiles, tileStatesToWalkableGrid } from '../domain/types'
import { rectHitsStructure, recalcCollapsed } from '../domain/collision'
import type { BlueprintStore, FloorPatch } from './state'
import { genId, cloneDeepRaw } from './storeUtils'
import { MAX_FLOORS } from '../limits'

export function createFloorCommands(store: BlueprintStore) {
	const state = store.state
	const toast = store.toast
	const withStateLock = <T>(fn: () => Promise<T>) => store.runExclusive(fn)
	const saveBlueprintData = () => store.save()
	const clearSelection = () => store.clearSelection()

	async function addFloor(): Promise<FloorData | null> {
		return withStateLock(async () => {
			if (state.layout.floors.length >= MAX_FLOORS) { toast.warning(`Floor limit reached (${MAX_FLOORS})`); return null }
			const existing = new Set(state.layout.floors.map(f => f.label))
			let n = 1
			while (existing.has(`F${n}`)) n++
			const floor: FloorData = { id: genId('floor'), name: `Floor ${n}`, label: `F${n}`, objects: [], defaultWalkable: true }
			state.layout.floors.push(floor)
			// Same stale-id repair the boot, undo and reload paths already do. Without it the
			// very first floor leaves currentFloorId pointing at nothing, so currentFloor is
			// undefined and every placement silently returns null with no floor to answer.
			if (!state.layout.floors.some(f => f.id === state.currentFloorId)) {
				state.currentFloorId = floor.id
			}
			const saved = await saveBlueprintData()
			return saved ? floor : null
		})
	}

	async function deleteFloor(id: string): Promise<boolean> {
		return withStateLock(async () => {
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
			clearSelection()
			return saveBlueprintData()
		})
	}

	async function clearFloor(id: string): Promise<boolean> {
		return withStateLock(async () => {
			const floor = state.layout.floors.find(f => f.id === id)
			if (!floor) return false
			if (floor.objects.length === 0) return true
			floor.objects = []
			clearSelection()
			return saveBlueprintData()
		})
	}

	async function duplicateFloor(id: string): Promise<boolean> {
		return withStateLock(async () => {
			if (state.layout.floors.length >= MAX_FLOORS) { toast.warning(`Floor limit reached (${MAX_FLOORS})`); return false }
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
		})
	}

	async function renameFloor(id: string, name: string): Promise<boolean> {
		return withStateLock(async () => {
			const floor = state.layout.floors.find(f => f.id === id)
			if (!floor) return false
			const normalizedName = normalizeText(name)
			if (!normalizedName) return false
			floor.name = normalizedName
			return saveBlueprintData()
		})
	}

	async function reorderFloors(fromIndex: number, toIndex: number): Promise<boolean> {
		return withStateLock(async () => {
			if (fromIndex === toIndex) return false
			if (fromIndex < 0 || toIndex < 0) return false
			if (fromIndex >= state.layout.floors.length || toIndex >= state.layout.floors.length) return false
			const floors = state.layout.floors
			const [moved] = floors.splice(fromIndex, 1)
			floors.splice(toIndex, 0, moved)
			return saveBlueprintData()
		})
	}

	function selectFloor(id: string) {
		state.currentFloorId = id
		clearSelection()
	}

	async function updateFloor(id: string, patch: FloorPatch): Promise<boolean> {
		return withStateLock(async () => {
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
			if (patch.name !== undefined) {
				const name = normalizeText(patch.name)
				if (!name) return false
				floor.name = name
			}
			if (patch.label !== undefined) {
				const label = normalizeText(patch.label)
				if (!label) return false
				floor.label = label
			}
			return saveBlueprintData()
		})
	}

	let pendingZoneDraft: { label: string; roleIds: string[] } | null = null

	function armZoneDraw(draft: { label: string; roleIds: string[] }): void {
		pendingZoneDraft = { label: draft.label, roleIds: [...draft.roleIds] }
	}

	function takeZoneDraft(): { label: string; roleIds: string[] } | null {
		const staged = pendingZoneDraft
		pendingZoneDraft = null
		return staged
	}

	async function addSpawnZone(
		floorId: string,
		rect: Rect,
		label?: string,
		roleIds?: string[],
	): Promise<NpcSpawnZone | null> {
		return withStateLock(async () => {
			const floor = state.layout.floors.find(f => f.id === floorId)
			if (!floor) return null
			const { x, y, w, h } = rect
			if (
				![x, y, w, h].every(v => typeof v === 'number' && Number.isFinite(v)) ||
				x < 0 || y < 0 || w <= 0 || h <= 0
			) return null
			const zone: NpcSpawnZone = {
				id: genId('zone'),
				label: label?.trim() || `Zone ${(floor.spawnZones?.length ?? 0) + 1}`,
				x,
				y,
				w,
				h,
				...(roleIds?.length ? { roleIds: [...roleIds] } : {}),
			}
			const normalized = normalizeNpcSpawnZones([...(floor.spawnZones ?? []), zone])
			if (!normalized) return null
			floor.spawnZones = normalized
			const saved = await saveBlueprintData()
			return saved ? zone : null
		})
	}

	async function clearSpawnZones(floorId: string): Promise<boolean> {
		return withStateLock(async () => {
			const floor = state.layout.floors.find(f => f.id === floorId)
			if (!floor) return false
			if (!floor.spawnZones?.length) return true
			delete floor.spawnZones
			return saveBlueprintData()
		})
	}

	async function paintFloorTiles(
		floorId: string,
		brush: TileBrush,
		rect: { row0: number; col0: number; row1: number; col1: number },
	): Promise<boolean> {
		return withStateLock(async () => {
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
			// Painting over a placed object stays allowed - the wall is the authoring act -
			// but the buried object must not become a silent defect, so it keeps the red
			// collapsed state until it is moved out, not just a toast that fades.
			const buried = floor.objects.filter(o => rectHitsStructure(floor, o, tileSize)).length
			// Scope the recompute to the stroke: only objects touching the painted cells can
			// change state, and an unscoped pass is O(objects²) per stroke - up to 10k objects
			// per floor, which freezes the canvas on every brush release.
			const paintMinCol = Math.min(rect.col0, rect.col1)
			const paintMaxCol = Math.max(rect.col0, rect.col1)
			const paintMinRow = Math.min(rect.row0, rect.row1)
			const paintMaxRow = Math.max(rect.row0, rect.row1)
			recalcCollapsed(floor, store.assetMap(), tileSize, {
				x: paintMinCol * tileSize,
				y: paintMinRow * tileSize,
				w: (paintMaxCol - paintMinCol + 1) * tileSize,
				h: (paintMaxRow - paintMinRow + 1) * tileSize,
			})
			if (buried) toast.warning(`${buried} object(s) now sit on wall geometry - move them out`)
			return saveBlueprintData()
		})
	}

	return {
		addFloor, clearFloor, deleteFloor, duplicateFloor, renameFloor,
		reorderFloors, selectFloor, updateFloor, paintFloorTiles,
		armZoneDraw, takeZoneDraft, addSpawnZone, clearSpawnZones,
	}
}
