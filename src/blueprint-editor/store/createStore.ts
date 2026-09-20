import { computed, ref } from 'vue'
import type { AssetDef, BlueprintTagDefinition, FloorLayoutData, Rect } from '../domain/types'
import { buildAssetMap } from '../assets/assetUtils'
import { snap as _snap, clamp as _clamp, resolveBuildingArea } from '../domain/geometry'
import { buildBlueprintData } from './dataLoader'
import { migrate } from './migrate'
import { cloneDeepRaw, deepEqualRaw, emptyNpcConfig, layoutHasContent, pruneNpcReferences } from './storeUtils'
import { EDITOR_CONFIG } from '../editorConfig'
import { createEditorState, initAssetFields, type BlueprintStore, type ToastApi } from './state'
import type { PersistencePort, SyncPort } from './ports'
import { PayloadTooLargeError } from './ports'
import { createFloorCommands } from './floors'
import { createObjectCommands } from './objects'
import { createAssetCommands } from './assets'
import { createTagCommands } from './tags'
import { createModeCommands } from './mode'
import { createSelectionCommands } from './selection'
import { createMetadataCommands } from './metadata'
import { createNpcCommands } from './npcDefault'
import { createPersistenceCommands } from './persistence'
import { createFlattenCommands } from './flatten'
import { useToast } from '@/composables/useToast'

export interface BlueprintStoreSeed {
	layout: FloorLayoutData
	assetRegistry: AssetDef[]
	tagDefinitions: BlueprintTagDefinition[]
}

export interface BlueprintStoreDeps {
	persistence: PersistencePort
	sync: SyncPort
	seed: BlueprintStoreSeed
}

export function emptySeed(): BlueprintStoreSeed {
	return {
		layout: {
			version: EDITOR_CONFIG.layoutVersion,
			canvas: { ...EDITOR_CONFIG.defaultCanvas },
			floors: [],
			npcConfig: emptyNpcConfig(),
		},
		assetRegistry: [],
		tagDefinitions: [],
	}
}

interface StoreSnapshot {
	layout: FloorLayoutData
	assetRegistry: AssetDef[]
	tagDefinitions: BlueprintTagDefinition[]
}

export function createBlueprintStore(deps: BlueprintStoreDeps): BlueprintStore {
	const state = createEditorState(deps.seed)
	const toast: ToastApi = useToast()
	const assetMapComputed = computed(() => buildAssetMap(state.assetRegistry))
	const currentFloor = computed(() => state.layout.floors.find(f => f.id === state.currentFloorId))
	const isNpcPreview = computed(() => state.mode === 'npc-preview')

	function captureSnapshot(): StoreSnapshot {
		return {
			layout: cloneDeepRaw(state.layout),
			assetRegistry: cloneDeepRaw(state.assetRegistry),
			tagDefinitions: cloneDeepRaw(state.tagDefinitions),
		}
	}

	function restoreSnapshot(snapshot: StoreSnapshot): void {
		// Install clones, never the snapshot itself - live state must not alias the save point.
		state.layout = cloneDeepRaw(snapshot.layout)
		state.assetRegistry = cloneDeepRaw(snapshot.assetRegistry)
		state.tagDefinitions = cloneDeepRaw(snapshot.tagDefinitions)
		for (const asset of state.assetRegistry) initAssetFields(asset)
		if (!state.layout.floors.some(f => f.id === state.currentFloorId)) {
			state.currentFloorId = state.layout.floors[0]?.id ?? ''
		}
	}

	let lastSaved = captureSnapshot()

	// Undo history: committed-state stack, live state always equals the top.
	// Cap 5 entries = 4 undo steps (user order: "4 state พอ").
	const HISTORY_LIMIT = 5
	const history: Array<{ layout: FloorLayoutData; assetRegistry: AssetDef[]; tagDefinitions: BlueprintTagDefinition[]; floorId: string }> = []
	const historyDepth = ref(0)

	function pushHistory(): void {
		const snap = {
			layout: cloneDeepRaw(state.layout),
			assetRegistry: cloneDeepRaw(state.assetRegistry),
			tagDefinitions: cloneDeepRaw(state.tagDefinitions),
			floorId: state.currentFloorId,
		}
		const top = history[history.length - 1]
		if (
			top &&
			top.floorId === snap.floorId &&
			deepEqualRaw(top.layout, snap.layout) &&
			deepEqualRaw(top.assetRegistry, snap.assetRegistry) &&
			deepEqualRaw(top.tagDefinitions, snap.tagDefinitions)
		)
			return
		history.push(snap)
		while (history.length > HISTORY_LIMIT) history.shift()
		historyDepth.value = history.length
	}

	function resetHistory(): void {
		history.length = 0
		historyDepth.value = 0
		pushHistory()
	}

	let saveChain: Promise<unknown> = Promise.resolve()

	function save(): Promise<boolean> {
		const run = async (): Promise<boolean> => {
			const pruned = pruneNpcReferences(state.layout, state.assetRegistry)
			const body = buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig ?? emptyNpcConfig(), state.tagDefinitions)
			try {
				const ok = await deps.persistence.save(body)
				if (!ok) throw new Error('Persistence save returned failure')
				lastSaved = captureSnapshot()
				if (pruned.length) {
					const shown = pruned.slice(0, 4).join('; ')
					toast.info(`Wiring cleanup: ${shown}${pruned.length > 4 ? ` (+${pruned.length - 4} more)` : ''}`)
				}
				return true
			} catch (error) {
				restoreSnapshot(lastSaved)
				if (error instanceof PayloadTooLargeError) {
					toast.error('Failed to save blueprint data - it exceeds the maximum save size')
				} else {
					toast.error('Failed to save blueprint data')
				}
				throw error
			}
		}
		const next = saveChain.then(run, run)
		saveChain = next.then(() => undefined, () => undefined)
		return next
	}

	let exclusiveChain: Promise<unknown> = Promise.resolve()

	function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
		const wrapped = async (): Promise<T> => {
			const result = await fn()
			pushHistory()
			return result
		}
		const result = exclusiveChain.then(wrapped, wrapped)
		exclusiveChain = result.then(() => undefined, () => undefined)
		return result
	}

	const canUndo = computed(() => historyDepth.value >= 2)

	async function undo(): Promise<boolean> {
		return runExclusive(async () => {
			if (history.length < 2) return false
			history.pop()
			const snap = history[history.length - 1]
			if (!snap) return false
			historyDepth.value = history.length
			state.layout = cloneDeepRaw(snap.layout)
			state.assetRegistry = cloneDeepRaw(snap.assetRegistry)
			state.tagDefinitions = cloneDeepRaw(snap.tagDefinitions)
			for (const asset of state.assetRegistry) initAssetFields(asset)
			if (!state.layout.floors.some(f => f.id === state.currentFloorId)) {
				state.currentFloorId = state.layout.floors.some(f => f.id === snap.floorId)
					? snap.floorId
					: state.layout.floors[0]?.id ?? ''
			}
			state.selectionState = { primary: null, items: [] }
			try {
				await save()
				return true
			} catch {
				return false
			}
		})
	}

	async function reloadEditorData(): Promise<void> {
		const combined = await deps.persistence.load()
		if (!combined) return
		const migrated = migrate(combined.layout, combined.originAssets, combined.npcConfig)
		state.layout = migrated.layout
		state.layout.npcConfig = structuredClone(combined.npcConfig ?? emptyNpcConfig())
		state.assetRegistry = combined.originAssets.map(asset => structuredClone(asset))
		state.tagDefinitions = combined.tags.map(tag => ({ ...tag }))
		for (const asset of state.assetRegistry) initAssetFields(asset)
		if (!state.layout.floors.some(f => f.id === state.currentFloorId)) {
			state.currentFloorId = state.layout.floors[0]?.id ?? ''
		}
		lastSaved = captureSnapshot()
		resetHistory()
	}

	const store: Record<string, unknown> = {
		state,
		persistence: deps.persistence,
		sync: deps.sync,
		toast,
		currentFloor,
		isNpcPreview,
		assetMap: () => assetMapComputed.value,
		hasContent: () => layoutHasContent(state.layout),
		undo,
		canUndo,
		snap: (value: number, tileSize?: number) => _snap(value, tileSize ?? state.layout.canvas.tileSize),
		clamp: (rect: Rect) => {
			const b = resolveBuildingArea(state.layout)
			return _clamp(rect, b.x + b.w, b.y + b.h, b.x, b.y)
		},
		initAssetFields,
		runExclusive,
		save,
		reloadEditorData,
	}

	const s = store as unknown as BlueprintStore
	Object.assign(
		store,
		createSelectionCommands(s),
		createTagCommands(s),
		createFloorCommands(s),
		createObjectCommands(s),
		createAssetCommands(s),
		createModeCommands(s),
		createMetadataCommands(s),
		createNpcCommands(s),
		createPersistenceCommands(s),
		createFlattenCommands(s),
	)

	// Seed undo history with the initial committed state.
	pushHistory()

	return s
}