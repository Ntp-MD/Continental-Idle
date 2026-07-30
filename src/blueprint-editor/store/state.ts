import { reactive, computed } from 'vue'
import type { LayoutData, AssetDef, FloorData, EditorMode, SelectionState, Rect } from '../types'
import { buildAssetMap, parseSvgRoles, buildWalkableGrid } from '../assetUtils'
import { snap as _snap, clamp as _clamp } from '../geometry'
import { ASSET_REGISTRY } from '../assetRegistry'
import { useToast } from '../composables/useToast'
import { loadInitial, mergeAssetRegistry } from './migrate'

export interface EditorState {
  layout: LayoutData
  currentFloorId: string
  mode: EditorMode
  selectionState: SelectionState
  selectedAssetId: string | null
  assetRegistry: AssetDef[]
  globalTags: string[]
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function isValidColor(c: string | undefined): boolean {
  return !c || (typeof c === 'string' && HEX_COLOR_RE.test(c))
}

export const toast = useToast()

let stateLock = false
export function isStateLocked(): boolean {
  return stateLock
}
export async function withStateLock<T>(fn: () => Promise<T>): Promise<T> {
  if (stateLock) {
    toast.warning('Operation in progress, please wait')
    return Promise.reject(new Error('Operation in progress'))
  }
  stateLock = true
  try {
    return await fn()
  } finally {
    stateLock = false
  }
}

export const dragState = reactive<{ assetId: string | null; roomTemplateId: string | null }>({ assetId: null, roomTemplateId: null })

export function startAssetDrag(assetId: string) {
  dragState.assetId = assetId
}
export function endAssetDrag() {
  dragState.assetId = null
  dragState.roomTemplateId = null
}
export function startRoomTemplateDrag(templateId: string) {
  dragState.roomTemplateId = templateId
}
export function endRoomTemplateDrag() {
  dragState.roomTemplateId = null
}

const _hmrData = import.meta.hot?.data
const EDITOR_UI_STATE_KEY = 'blueprint-editor-ui-state'
function loadPersistedUiState(): Partial<EditorState> | null {
  try {
    const raw = sessionStorage.getItem(EDITOR_UI_STATE_KEY)
    if (raw) return JSON.parse(raw) as Partial<EditorState>
  } catch { /* ignore */ }
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
  } catch { /* ignore */ }
}

const _persistedUi = loadPersistedUiState()
const _restoredUi = _hmrData?._editorState ?? _persistedUi ?? {}

localStorage.removeItem('blueprint-synced-layout')

const initial = loadInitial()

export const state = reactive<EditorState>({
  layout: initial.layout,
  currentFloorId: _restoredUi.currentFloorId ?? '',
  mode: _restoredUi.mode ?? 'object',
  selectionState: _restoredUi.selectionState ?? { primary: null, items: [] },
  selectedAssetId: _restoredUi.selectedAssetId ?? null,
  assetRegistry: _hmrData?._editorState?.assetRegistry ?? initial.legacyAssets,
  globalTags: _hmrData?._editorState?.globalTags ?? initial.layout.globalTags ?? [],
})

if (!state.layout.globalTags) state.layout.globalTags = [...state.globalTags]

if (!state.layout.deletedDefaultIds) state.layout.deletedDefaultIds = []
const deletedDefaultIds = new Set(state.layout.deletedDefaultIds)
state.assetRegistry = mergeAssetRegistry([...ASSET_REGISTRY], state.assetRegistry, deletedDefaultIds)

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
      const hasWall = asset.svgRoles?.some(r => r.role === 'wall') ?? false
      asset.walkable = !hasWall
    }
    if (asset.entranceRequired === undefined) {
      asset.entranceRequired = false
    }
  } else {
    if (asset.walkable === undefined) {
      asset.walkable = !asset.isWall
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
      globalTags: state.globalTags,
    }
    savePersistedUiState()
  })
}

window.addEventListener('beforeunload', savePersistedUiState)
