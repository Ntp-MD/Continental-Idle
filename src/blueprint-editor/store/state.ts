import { reactive, type ComputedRef, type Ref } from 'vue'
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
	NpcSpawnZone,
	ObjectData,
	Rect,
	SelectionState,
	TileBrush,
} from '../domain/types'
import { parseSvgRoles, buildWalkableGrid } from '../assets/assetUtils'
import { normalizeTileStates, tileStatesToWalkableGrid } from '../domain/types'
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
	readonly toast: ToastApi
	readonly currentFloor: ComputedRef<FloorData | undefined>
	readonly isNpcPreview: ComputedRef<boolean>
	readonly globalTags: ComputedRef<string[]>
	readonly managedTagSet: ComputedRef<Set<string>>
	readonly selectedAsset: ComputedRef<AssetDef | null>

	assetMap(): Map<string, AssetDef>
	snap(value: number, tileSize?: number): number
	clamp(rect: Rect): Rect
	hasContent(): boolean
	initAssetFields(asset: AssetDef): void
	runExclusive<T>(fn: () => Promise<T>): Promise<T>
	save(): Promise<boolean>
	reloadEditorData(): Promise<void>
	undo(): Promise<boolean>
	canUndo: ComputedRef<boolean>
	/** Counts committed states; bump is the cheap signal that layout may have changed. */
	historyDepth: Ref<number>

	addFloor(): Promise<FloorData | null>
	clearFloor(id: string): Promise<boolean>
	deleteFloor(id: string): Promise<boolean>
	duplicateFloor(id: string): Promise<boolean>
	renameFloor(id: string, name: string): Promise<boolean>
	reorderFloors(fromIndex: number, toIndex: number): Promise<boolean>
	selectFloor(id: string): void
	updateFloor(id: string, patch: FloorPatch): Promise<boolean>
	paintFloorTiles(floorId: string, brush: TileBrush, rect: { row0: number; col0: number; row1: number; col1: number }): Promise<boolean>
	armZoneDraw(draft: { label: string; roleIds: string[] }): void
	takeZoneDraft(): { label: string; roleIds: string[] } | null
	addSpawnZone(floorId: string, rect: Rect, label?: string, roleIds?: string[]): Promise<NpcSpawnZone | null>

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
	reorderAssets(fromIndex: number, toIndex: number): Promise<boolean>
	deleteAsset(id: string): Promise<boolean>
	deleteAllAssets(): Promise<number>
	duplicateAsset(id: string): Promise<AssetDef | null>

	updateNpcConfig(config: NpcSimulationConfig): Promise<void>

	copySelected(): void
	pasteObjects(): Promise<void>

	exportWorkspace(): BlueprintDataFile
	importWorkspace(file: BlueprintDataFile): Promise<boolean>

	select(ref: EntityRef | null): void
	setSelection(items: EntityRef[]): void
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
	setCanvasStreetSidewalkColor(color: string | undefined): Promise<boolean>
	setCanvasStreetRoadColor(color: string | undefined): Promise<boolean>
	setCanvasStreetMarkingColor(color: string | undefined): Promise<boolean>
	setStreetFloor(floorId: string | null): Promise<boolean>
	setStreetWidth(tiles: number | null): Promise<boolean>
	setEditorSettings(patch: Partial<EditorSettings>): Promise<boolean>
	resetEditorSettings(): Promise<boolean>

	addTag(tag: string): Promise<void>
	removeTag(tag: string): Promise<boolean>
	ensureTag(tag: string): void
}

export function initAssetFields(asset: AssetDef): void {
	if (asset.svg && !asset.svgRoles) asset.svgRoles = parseSvgRoles(asset.svg)
	if (!asset.walkableGrid && !asset.tileStates && asset.svg) {
		const grid = buildWalkableGrid(asset.w, asset.h, asset.svgRoles)
		if (grid) {
			asset.walkableGrid = grid.walkableGrid
			asset.tileStates = grid.tileStates
		}
	}
	if (!asset.walkableGrid && asset.tileStates) {
		const states = normalizeTileStates(asset.tileStates)
		if (states) asset.walkableGrid = tileStatesToWalkableGrid(states)
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
