import { computed } from 'vue'
import type { AssetDef, BlueprintTagDefinition, FloorLayoutData, Rect } from '../domain/types'
import { buildAssetMap } from '../assets/assetUtils'
import { snap as _snap, clamp as _clamp, resolveBuildingArea } from '../domain/geometry'
import { buildBlueprintData } from './dataLoader'
import { migrate } from './migrate'
import { cloneDeepRaw, emptyNpcConfig } from './storeUtils'
import { EDITOR_CONFIG } from '../editorConfig'
import { createEditorState, initAssetFields, type BlueprintStore, type ToastApi } from './state'
import type { PersistencePort, SyncPort } from './ports'
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

	let saveChain: Promise<unknown> = Promise.resolve()

	function save(): Promise<boolean> {
		const run = async (): Promise<boolean> => {
			const body = buildBlueprintData(state.layout, state.assetRegistry, state.layout.npcConfig ?? emptyNpcConfig(), state.tagDefinitions)
			try {
				const ok = await deps.persistence.save(body)
				if (!ok) throw new Error('Persistence save returned failure')
				lastSaved = captureSnapshot()
				return true
			} catch (error) {
				restoreSnapshot(lastSaved)
				toast.error('Failed to save blueprint data')
				throw error
			}
		}
		const next = saveChain.then(run, run)
		saveChain = next.then(() => undefined, () => undefined)
		return next
	}

	let exclusiveChain: Promise<unknown> = Promise.resolve()

	function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
		const result = exclusiveChain.then(fn, fn)
		exclusiveChain = result.then(() => undefined, () => undefined)
		return result
	}

	async function reloadEditorData(): Promise<void> {
		const combined = await deps.persistence.load()
		if (!combined) return
		const migrated = migrate(combined.layout, combined.originAssets)
		state.layout = migrated.layout
		state.layout.npcConfig = structuredClone(combined.npcConfig ?? emptyNpcConfig())
		state.assetRegistry = combined.originAssets.map(asset => structuredClone(asset))
		state.tagDefinitions = combined.tags.map(tag => ({ ...tag }))
		for (const asset of state.assetRegistry) initAssetFields(asset)
		if (!state.layout.floors.some(f => f.id === state.currentFloorId)) {
			state.currentFloorId = state.layout.floors[0]?.id ?? ''
		}
		lastSaved = captureSnapshot()
	}

	const store: Record<string, unknown> = {
		state,
		persistence: deps.persistence,
		sync: deps.sync,
		toast,
		currentFloor,
		isNpcPreview,
		assetMap: () => assetMapComputed.value,
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

	return s
}