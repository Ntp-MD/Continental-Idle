import { onUnmounted, watch, type Ref, type ShallowRef } from 'vue'
import type { NpcCanvasBounds, NpcEngineEvent } from '@/engine/npc'
import type { AssetDef, FloorData, NpcSimDot, NpcSimulationConfig } from '../domain/types'
import { useNpcSimulationCore, type NpcSimulationCore } from '@/composables/useNpcSimulationCore'

export interface NpcSimulationSources {
	getConfig?: () => NpcSimulationConfig | undefined
	getFloor?: () => FloorData | undefined
	getCanvas?: () => NpcCanvasBounds
	getFloorById?: (id: string) => FloorData | undefined
	getAllFloors?: () => FloorData[]
	getAssetTags?: (type: string) => string[] | undefined
	getAssetDef?: (type: string) => AssetDef | undefined
	getManagedTags?: () => readonly string[]
}

export function useNpcSimulation(sources: NpcSimulationSources = {}): {
	npcs: Ref<NpcSimDot[]>
	frameDots: Map<string, NpcSimDot>
	doorPassageEvents: ShallowRef<NpcEngineEvent[]>
	deploy: (floorId?: string, spawnFloorId?: string) => void
	start: () => void
	stop: () => void
	pause: () => void
	resume: () => void
	reset: () => void
	refresh: () => void
	isPaused: Ref<boolean>
	simSpeed: Ref<number>
	config: Ref<NpcSimulationConfig>
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

	watch(() => sources.getConfig?.(), raw => core.ingestConfig(raw), { deep: true })

	watch(() => sources.getFloor?.()?.id, floorId => {
		if (!floorId) return
		core.setViewFloorId(floorId)
	})

	watch(() => sources.getFloor?.(), floor => {
		if (floor && floor.id === core.getViewFloorId()) core.refresh()
	}, { deep: true })

	watch(() => sources.getCanvas?.(), () => {
		if (!core.isDeploymentActive()) return
		core.refresh()
	})

	return {
		npcs: core.npcs,
		frameDots: core.frameDots,
		doorPassageEvents: core.doorPassageEvents,
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
			core.clearDeployment()
			core.stopLoop()
		},
		pause: () => { core.isPaused.value = true },
		resume: () => { core.isPaused.value = false },
		reset: core.reset,
		refresh: core.refresh,
		isPaused: core.isPaused,
		simSpeed: core.simSpeed,
		config: core.config,
	}
}
