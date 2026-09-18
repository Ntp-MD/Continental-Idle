import { reactive, type ComputedRef } from 'vue'
import type {
	AssetDef,
	BlueprintDataFile,
	BlueprintTagDefinition,
	EditorMode,
	EditorSettings,
	EntityRef,
	FloorData,
	FloorLayoutData,
	NpcSimulationConfig,
	ObjectData,
	Rect,
	SelectionState,
	TileBrush,
} from '../domain/types'
import type { TagCatalog } from '../assets/tagCatalog'
import { parseSvgRoles, buildWalkableGrid } from '../assets/assetUtils'
import type { PersistencePort, SyncPort } from './ports'
import type { useToast } from '@/composables/useToast'

export interface EditorState {
	layout: FloorLayoutData
	currentFloorId: string
	mode: EditorMode
	tileBrush: TileBrush | null
	selectionState: SelectionState
	selectedAssetId: string | null
	assetRegistry: AssetDef[]
	tagDefinitions: BlueprintTagDefinition[]
}

export type ToastApi = ReturnType<typeof useToast>

export interface AssetPatch {
	name?: string
	defaultPadding?: number
	defaultRx?: { tl: number; tr: number; br: number; bl: number }
	defaultFillColor?: string
	defaultStrokeColor?: string
	defaultLabel?: string
	defaultRadius?: number
	defaultLabelPadding?: number
	defaultLocked?: boolean
	doorRequired?: boolean
	tags?: string[]
	interactSpots?: AssetDef['interactSpots']
	interact?: AssetDef['interact']
	queue?: AssetDef['queue']
	walkable?: boolean
	walkableGrid?: AssetDef['walkableGrid']
	tileStates?: AssetDef['tileStates']
}

export interface FloorPatch {
	allowedRoleIds?: FloorData['allowedRoleIds']
	defaultWalkable?: boolean
	name?: string
	label?: string
	walkable?: FloorData['walkable']
	spawnZones?: FloorData['spawnZones']
}

export interface BlueprintStore {
	readonly state: EditorState
	readonly persistence: PersistencePort
	readonly sync: SyncPort
	readonly toast: ToastApi
	readonly currentFloor: ComputedRef<FloorData | undefined>
	readonly isNpcPreview: ComputedRef<boolean>
	readonly tagCatalog: ComputedRef<TagCatalog>
	readonly globalTags: ComputedRef<string[]>
	readonly managedTagSet: ComputedRef<Set<string>>
	readonly selectedAsset: ComputedRef<AssetDef | null>

	assetMap(): Map<string, AssetDef>
	snap(value: number, tileSize?: number): number
	clamp(rect: Rect): Rect
	initAssetFields(asset: AssetDef): void
	runExclusive<T>(fn: () => Promise<T>): Promise<T>
	save(): Promise<boolean>
	reloadEditorData(): Promise<void>

	addFloor(): Promise<FloorData | null>
	clearFloor(id: string): Promise<boolean>
	deleteFloor(id: string): Promise<boolean>
	duplicateFloor(id: string): Promise<boolean>
	renameFloor(id: string, name: string): Promise<boolean>
	reorderFloors(fromIndex: number, toIndex: number): Promise<boolean>
	selectFloor(id: string): void
	updateFloor(id: string, patch: FloorPatch): Promise<boolean>
	paintFloorTiles(floorId: string, brush: TileBrush, rect: { row0: number; col0: number; row1: number; col1: number }): Promise<boolean>

	beginDrawnObject(name: string, w: number, h: number, x: number, y: number): Promise<{ asset: AssetDef; object: ObjectData } | null>
	addObject(type: string, x: number, y: number): Promise<ObjectData | null>
	canPlaceObject(type: string, x: number, y: number): boolean
	deleteSelected(): Promise<void>
	moveSelectedTo(x: number, y: number): void
	commitMove(): Promise<void>
	rotateSelected(): Promise<void>
	linkObjects(ids: string[]): Promise<boolean>
	unlinkObject(id: string): Promise<boolean>
	toggleObjectLock(id: string): Promise<void>
	getLinkedObjects(obj: ObjectData): ObjectData[]
	dissolveGroupsIfSmall(floor: FloorData, groupIds: ReadonlySet<string>): void

	flattenToSvgAsset(name?: string): Promise<string | null>

	addSvgAsset(name: string, w: number, h: number, svgString: string): Promise<AssetDef | null>
	updateAsset(id: string, patch: AssetPatch): Promise<void>
	deleteAsset(id: string): Promise<boolean>
	deleteAllAssets(): Promise<number>
	duplicateAsset(id: string): Promise<AssetDef | null>
	refreshOriginInstances(): Promise<number>

	updateNpcConfig(config: NpcSimulationConfig): Promise<void>

	copySelected(): void
	pasteObjects(): Promise<void>

	syncToGame(): boolean
	exportWorkspace(): BlueprintDataFile
	importWorkspace(file: BlueprintDataFile): Promise<boolean>

	select(ref: EntityRef | null): void
	selectAsset(id: string | null): void
	clearSelection(): void
	selectedObject(): ObjectData | undefined
	selectedObjectIds(): string[]
	toggleMultiSelect(id: string): void

	setMode(mode: EditorMode): void
	setTileBrush(brush: TileBrush | null): void
	resizeCanvas(width: number, height: number, tileSize: number): Promise<boolean>
	setCanvasBgColor(color: string | undefined): Promise<boolean>
	setCanvasLabelColor(color: string | undefined): Promise<boolean>
	setCanvasWallColor(color: string | undefined): Promise<boolean>
	setCanvasGridColor(color: string | undefined): Promise<boolean>
	setStreetFloor(floorId: string | null): Promise<boolean>
	setStreetWidth(tiles: number | null): Promise<boolean>
	setEditorSettings(patch: Partial<EditorSettings>): Promise<boolean>
	resetEditorSettings(): Promise<boolean>

	addTag(tag: string): Promise<void>
	removeTag(tag: string): Promise<boolean>
	ensureTag(tag: string): void
}

export function initAssetFields(asset: AssetDef): void {
	if (asset.svg) {
		if (!asset.svgRoles) asset.svgRoles = parseSvgRoles(asset.svg)
		if (!asset.walkableGrid) {
			const grid = buildWalkableGrid(asset.w, asset.h, asset.svgRoles)
			if (grid) {
				asset.walkableGrid = grid.walkableGrid
				asset.tileStates = grid.tileStates
			}
		}
	}
	if (asset.walkable === undefined) asset.walkable = false
	if (asset.doorRequired === undefined) asset.doorRequired = false
}

export function createEditorState(seed: {
	layout: FloorLayoutData
	assetRegistry: AssetDef[]
	tagDefinitions: BlueprintTagDefinition[]
}): EditorState {
	const assetRegistry = seed.assetRegistry.map(asset => structuredClone(asset))
	for (const asset of assetRegistry) initAssetFields(asset)
	return reactive<EditorState>({
		layout: seed.layout,
		currentFloorId: seed.layout.floors[0]?.id ?? '',
		mode: 'object',
		tileBrush: null,
		selectionState: { primary: null, items: [] },
		selectedAssetId: null,
		assetRegistry,
		tagDefinitions: seed.tagDefinitions.map(tag => ({ ...tag })),
	})
}

export const dragState = reactive<{ assetId: string | null }>({ assetId: null })

export function startAssetDrag(assetId: string) {
	dragState.assetId = assetId
}

export function endAssetDrag() {
	dragState.assetId = null
}
