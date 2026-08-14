import { reactive, computed } from 'vue'
import type { BlueprintTagDefinition, FloorLayoutData, AssetDef, FloorData, EditorMode, SelectionState, Rect, NpcSimulationConfig } from '../types'
import { buildAssetMap, parseSvgRoles, buildWalkableGrid } from '../assetUtils'
import { snap as _snap, clamp as _clamp } from '../geometry'
import { originAssets, blueprintTagDefinitions, fetchBlueprintDataFromDisk, buildBlueprintData } from './dataLoader'
import { useToast } from '@/composables/useToast'
import { loadInitial, migrate } from './migrate'

export interface EditorState {
	layout: FloorLayoutData
	currentFloorId: string
	mode: EditorMode
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

export function startAssetDrag(assetId: string) {
	dragState.assetId = assetId
}
export function endAssetDrag() {
	dragState.assetId = null
}
const _hmrData = import.meta.hot?.data
const EDITOR_UI_STATE_KEY = 'blueprint-editor-ui-state'
function loadPersistedUiState(): Partial<EditorState> | null {
	try {
		const raw = sessionStorage.getItem(EDITOR_UI_STATE_KEY)
		if (raw) return JSON.parse(raw) as Partial<EditorState>
	} catch { }
	return null
}
function savePersistedUiState(): void {
	try {
		sessionStorage.setItem(EDITOR_UI_STATE_KEY, JSON.stringify({
			currentFloorId: state.currentFloorId,
			mode: state.mode,
			selectionState: state.selectionState,
			selectedAssetId: state.selectedAssetId,
		}))
	} catch { }
}

const _persistedUi = loadPersistedUiState()
const _restoredUi = _hmrData?._editorState ?? _persistedUi ?? {}

const initial = loadInitial()
const initialBlueprintData = buildBlueprintData(initial.layout, originAssets, initial.layout.npcConfig, blueprintTagDefinitions)

export const state = reactive<EditorState>({
	layout: initial.layout,
	currentFloorId: _restoredUi.currentFloorId ?? '',
	mode: _restoredUi.mode === 'npc-preview' || (_restoredUi.mode as string) === 'erase' ? 'move' : _restoredUi.mode ?? 'object',
	selectionState: _restoredUi.selectionState ?? { primary: null, items: [] },
	selectedAssetId: _restoredUi.selectedAssetId ?? null,
	assetRegistry: originAssets.map(asset => JSON.parse(JSON.stringify(asset)) as AssetDef),
	tagDefinitions: initialBlueprintData.tags.map(tag => ({ ...tag })),
})

for (const asset of state.assetRegistry) initAssetFields(asset)


export async function reloadEditorData(): Promise<void> {
	const combined = await fetchBlueprintDataFromDisk()
	if (!combined) return
	const migrated = migrate(combined.layout)
	state.layout = migrated.layout
	state.layout.npcConfig = JSON.parse(JSON.stringify(combined.npcConfig)) as NpcSimulationConfig
	state.assetRegistry = combined.originAssets.map(asset => JSON.parse(JSON.stringify(asset)) as AssetDef)
	state.tagDefinitions = combined.tags.map(tag => ({ ...tag }))
	for (const asset of state.assetRegistry) initAssetFields(asset)
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
		if (asset.entranceRequired === undefined) {
			asset.entranceRequired = false
		}
	} else {
		if (asset.walkable === undefined) {
			asset.walkable = false
		}
		if (asset.entranceRequired === undefined) {
			asset.entranceRequired = false
		}
	}
}

for (const asset of state.assetRegistry) {
	initAssetFields(asset)
}

if (!state.currentFloorId) state.currentFloorId = state.layout.floors[0]?.id ?? ''

const _assetMap = computed(() => buildAssetMap([...state.assetRegistry]))
export function assetMap(): Map<string, AssetDef> {
	return _assetMap.value
}

export const currentFloor = computed<FloorData | undefined>(() =>
	state.layout.floors.find((f: FloorData) => f.id === state.currentFloorId)
)

export function snap(value: number, tileSize?: number): number {
	return _snap(value, tileSize ?? state.layout.canvas.tileSize)
}

export function clamp(rect: Rect, maxWidth?: number, maxHeight?: number): Rect {
	return _clamp(rect, maxWidth ?? state.layout.canvas.width, maxHeight ?? state.layout.canvas.height)
}

if (import.meta.hot) {
	import.meta.hot.dispose((data: any) => {
		data._editorLayout = JSON.stringify(state.layout)
		data._editorState = {
			currentFloorId: state.currentFloorId,
			mode: state.mode,
			selectionState: state.selectionState,
			selectedAssetId: state.selectedAssetId,
			assetRegistry: state.assetRegistry,
		}
		savePersistedUiState()
	})
	import.meta.hot.accept()
}

window.addEventListener('beforeunload', savePersistedUiState)
