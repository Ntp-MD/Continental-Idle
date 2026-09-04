import { reactive, computed, ref } from 'vue'
import type { BlueprintTagDefinition, FloorLayoutData, AssetDef, FloorData, EditorMode, SelectionState, Rect, WallSegment } from '../domain/types'
import { buildAssetMap, parseSvgRoles, buildWalkableGrid } from '../assets/assetUtils'
import { snap as _snap, clamp as _clamp, buildingArea } from '../domain/geometry'
import { originAssets, blueprintTagDefinitions, fetchBlueprintDataFromDisk, buildBlueprintData } from './dataLoader'
import { useToast } from '@/composables/useToast'
import { loadInitial, migrate } from './migrate'
import { editorLog, cloneDeepRaw } from './storeUtils'

interface EditorState {
	layout: FloorLayoutData
	currentFloorId: string
	mode: EditorMode
	wallPaint: boolean
	selectionState: SelectionState
	selectedAssetId: string | null
	assetRegistry: AssetDef[]
	tagDefinitions: BlueprintTagDefinition[]
}

export const toast = useToast()

let stateLock = false
export function isStateLocked(): boolean {
	return stateLock
}
export async function withStateLock<T>(fn: () => Promise<T>): Promise<T> {
	if (stateLock) {
		toast.warning('Operation in progress')
		return Promise.reject(new Error('Operation in progress'))
	}
	stateLock = true
	try {
		return await fn()
	} finally {
		stateLock = false
	}
}

export const dragState = reactive<{ assetId: string | null }>({ assetId: null })

export interface WallSelectionEntry {
	floorId: string
	objectId: string
	segment: WallSegment
}
export const wallSelection = ref<WallSelectionEntry[]>([])
export function clearWallSelection(): void {
	wallSelection.value = []
}

export function startAssetDrag(assetId: string) {
	dragState.assetId = assetId
}
export function endAssetDrag() {
	dragState.assetId = null
}
const initial = loadInitial()
const initialBlueprintData = buildBlueprintData(initial.layout, originAssets, initial.layout.npcConfig, blueprintTagDefinitions)

export const state = reactive<EditorState>({
	layout: initial.layout,
	currentFloorId: '',
	mode: 'object',
	wallPaint: false,
	selectionState: { primary: null, items: [] },
	selectedAssetId: null,
	assetRegistry: originAssets.map(asset => structuredClone(asset)),
	tagDefinitions: initialBlueprintData.tags.map(tag => ({ ...tag })),
})

for (const asset of state.assetRegistry) initAssetFields(asset)


export async function reloadEditorData(): Promise<void> {
	const combined = await fetchBlueprintDataFromDisk()
	if (!combined) return
	const migrated = migrate(combined.layout, combined.originAssets)
	state.layout = migrated.layout
	state.layout.npcConfig = structuredClone(combined.npcConfig)
	state.assetRegistry = combined.originAssets.map(asset => structuredClone(asset))
	state.tagDefinitions = combined.tags.map(tag => ({ ...tag }))
	for (const asset of state.assetRegistry) initAssetFields(asset)
	if (!state.layout.floors.some((f: FloorData) => f.id === state.currentFloorId)) {
		state.currentFloorId = state.layout.floors[0]?.id ?? ''
	}
	initLastSavedSnapshot()
}

export function initAssetFields(asset: AssetDef): void {
	if (asset.svg) {
		if (!asset.svgRoles) {
			asset.svgRoles = parseSvgRoles(asset.svg)
		}
		if (!asset.walkableGrid) {
			const { walkableGrid, tileStates } = buildWalkableGrid(asset.w, asset.h, asset.svgRoles)
			asset.walkableGrid = walkableGrid
			asset.tileStates = tileStates
		}
		if (asset.walkable === undefined) {
			asset.walkable = false
		}
		if (asset.doorRequired === undefined) {
			asset.doorRequired = false
		}
	} else {
		if (asset.walkable === undefined) {
			asset.walkable = false
		}
		if (asset.doorRequired === undefined) {
			asset.doorRequired = false
		}
	}
}

if (!state.layout.floors.some((f: FloorData) => f.id === state.currentFloorId)) {
	state.currentFloorId = state.layout.floors[0]?.id ?? ''
}

interface StateSnapshot {
	layout: FloorLayoutData
	assetRegistry: AssetDef[]
	tagDefinitions: BlueprintTagDefinition[]
}

function captureStateSnapshot(): StateSnapshot {
	return {
		layout: cloneDeepRaw(state.layout),
		assetRegistry: cloneDeepRaw(state.assetRegistry),
		tagDefinitions: cloneDeepRaw(state.tagDefinitions),
	}
}

function restoreStateSnapshot(snapshot: StateSnapshot): void {
	state.layout = snapshot.layout
	state.assetRegistry = snapshot.assetRegistry
	state.tagDefinitions = snapshot.tagDefinitions
	for (const asset of state.assetRegistry) initAssetFields(asset)
	if (!state.layout.floors.some((f: FloorData) => f.id === state.currentFloorId)) {
		state.currentFloorId = state.layout.floors[0]?.id ?? ''
	}
}

let lastSavedSnapshot: StateSnapshot | null = null

export function initLastSavedSnapshot(): void {
	lastSavedSnapshot = captureStateSnapshot()
}

export function updateLastSavedSnapshot(): void {
	lastSavedSnapshot = captureStateSnapshot()
}

export function revertToLastSavedSnapshot(): boolean {
	if (!lastSavedSnapshot) return false
	try {
		restoreStateSnapshot(lastSavedSnapshot)
		return true
	} catch (error) {
		editorLog.error('Failed to revert state after save failure', error)
		return false
	}
}

const _assetMap = computed(() => buildAssetMap(state.assetRegistry))
export function assetMap(): Map<string, AssetDef> {
	return _assetMap.value
}

export const currentFloor = computed<FloorData | undefined>(() =>
	state.layout.floors.find((f: FloorData) => f.id === state.currentFloorId)
)

export function snap(value: number, tileSize?: number): number {
	return _snap(value, tileSize ?? state.layout.canvas.tileSize)
}

export function clamp(rect: Rect): Rect {
	const c = state.layout.canvas
	const b = buildingArea(c.width, c.height, c.tileSize)
	return _clamp(rect, b.x + b.w, b.y + b.h, b.x, b.y)
}
