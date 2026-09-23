import { onUnmounted, watch, type Ref, type ShallowRef } from 'vue'
import type { NpcCanvasBounds, NpcEngineEvent } from '@/engine/npc'
import type { AssetDef, FloorData, NpcSimDot, NpcSimulationConfig } from '../domain/types'
import { useNpcSimulationCore, type NpcSimulationCore } from './useNpcSimulationCore'

export interface NpcSimulationSources {
	getConfig?: () => NpcSimulationConfig | undefined
	getFloor?: () => FloorData | undefined
	getCanvas?: () => NpcCanvasBounds
	getFloorById?: (id: string) => FloorData | undefined
	getAllFloors?: () => FloorData[]
	getAssetTags?: (type: string) => string[] | undefined
	getAssetDef?: (type: string) => AssetDef | undefined
	getManagedTags?: () => readonly string[]
	/** Commit counter (`store.historyDepth`); bumps once per settled mutation. */
	getCommitVersion?: () => number
}

const tileStateIds = new WeakMap<object, number>()
let nextTileStateId = 1

function tileStatesId(ts: object): number {
	let id = tileStateIds.get(ts)
	if (!id) { id = nextTileStateId++; tileStateIds.set(ts, id) }
	return id
}

export function floorSignature(floor: FloorData | undefined): string {
	if (!floor) return ''
	const parts: (string | number)[] = [floor.id, floor.objects.length, floor.defaultWalkable ? 1 : 0]
	for (const o of floor.objects) {
		// Geometry fields matter: a moved/rotated object must invalidate the
		// engine's walkable map and interaction targets.
		parts.push(o.id, o.type, o.x, o.y, o.w, o.h, o.rotation)
	}
	parts.push(JSON.stringify(floor.allowedRoleIds ?? null), JSON.stringify(floor.spawnZones ?? null))
	const ts = floor.walkable?.tileStates
	if (ts) {
		let blocked = 0
		for (let r = 0; r < ts.length; r++) {
			const row = ts[r]
			for (let c = 0; c < row.length; c++) if (row[c] !== 'walkable') blocked += r * 131 + c + 1
		}
		parts.push(ts.length, ts[0]?.length ?? 0, tileStatesId(ts), blocked)
	} else {
		parts.push(0)
	}
	return parts.join('|')
}

export function useNpcSimulation(sources: NpcSimulationSources = {}): {
	npcs: Ref<NpcSimDot[]>
	frameDots: Map<string, NpcSimDot>
	waitReasons: ReadonlyMap<string, string>
	arrivalMarks: ReadonlyMap<string, number>
	socialEvents: ShallowRef<NpcEngineEvent[]>
	deploy: (floorId?: string, spawnFloorId?: string) => void
	start: () => void
	stop: () => void
	pause: () => void
	resume: () => void
	reset: () => void
	refresh: () => void
	isPaused: Ref<boolean>
	simSpeed: Ref<number>
} {
	const core: NpcSimulationCore = useNpcSimulationCore({
		getConfig: () => sources.getConfig?.(),
		getFloors: () => sources.getAllFloors?.() ?? [],
		getCanvas: () => sources.getCanvas?.() ?? { w: 1600, h: 1000, tileSize: 25 },
		getViewFloorId: () => sources.getFloor?.()?.id ?? null,
		idPrefix: 'npc-sim-',
		getAssetDef: sources.getAssetDef,
		getAssetTags: sources.getAssetTags,
		getManagedTags: sources.getManagedTags,
	})

	core.ingestConfig(sources.getConfig?.())
	onUnmounted(core.stopLoop)

	let lastFloorSig = ''

	watch(() => sources.getFloor?.()?.id, floorId => {
		if (!floorId) return
		// A floor switch is a view change, not a layout change: prime the
		// signature from the newly active floor so the deep watcher below
		// sees no diff and the deployed agents survive across floors.
		lastFloorSig = floorSignature(sources.getFloor?.())
		core.setViewFloorId(floorId)
	})

	// Commit-granular, not `deep: true` on the floor: a deep watcher re-traverses every
	// tile cell (~8k nodes at default canvas) on each flush, so dragging one object cost
	// ~12ms per frame of pure observation - and the signature check below discarded most
	// of those frames anyway. Layout edits only reach the store through committed
	// commands, so the commit counter sees every change that matters.
	watch(() => sources.getCommitVersion?.() ?? 0, () => {
		const floor = sources.getFloor?.()
		if (!floor || floor.id !== core.getViewFloorId()) return
		const sig = floorSignature(floor)
		if (sig === lastFloorSig) return
		lastFloorSig = sig
		core.refresh()
	})

	watch(() => sources.getCanvas?.(), () => {
		if (!core.isDeploymentActive()) return
		core.refresh()
	})

	return {
		npcs: core.npcs,
		frameDots: core.frameDots,
		waitReasons: core.waitReasons,
		arrivalMarks: core.arrivalMarks,
		socialEvents: core.socialEvents,
		deploy(floorId?: string, spawnFloorId?: string) {
			const view = floorId ?? sources.getFloor?.()?.id
			const floors = sources.getAllFloors?.() ?? []
			const canvas = sources.getCanvas?.()
			const target = view && sources.getFloorById ? sources.getFloorById(view) : sources.getFloor?.()
			if (!canvas || !target || !floors.length) return
			core.deploy(floors, canvas, view ?? target.id, spawnFloorId)
		},
		start: core.start,
		stop() {
			core.reset()
		},
		pause: () => { core.isPaused.value = true },
		resume: () => { core.isPaused.value = false },
		reset: core.reset,
		refresh: core.refresh,
		isPaused: core.isPaused,
		simSpeed: core.simSpeed,
	}
}
