import { onUnmounted, watch, type Ref } from 'vue'
import type { NpcCanvasBounds } from '@/engine/npc'
import type { AssetDef, FloorData, NpcSimDot, NpcSimulationConfig } from '../types'
import { useNpcSimulationCore, type NpcSimulationCore } from '@/composables/useNpcSimulationCore'

export function useNpcSimulation(
	getConfig?: () => NpcSimulationConfig | undefined,
	getFloor?: () => FloorData | undefined,
	getCanvas?: () => NpcCanvasBounds,
	getFloorById?: (id: string) => FloorData | undefined,
	getAllFloors?: () => FloorData[],
	getAssetTags?: (type: string) => string[] | undefined,
	getAssetDef?: (type: string) => AssetDef | undefined,
	getManagedTags?: () => readonly string[],
): { npcs: Ref<NpcSimDot[]>; frameDots: Map<string, NpcSimDot>; deploy: (floorId?: string, spawnFloorId?: string) => void; start: () => void; stop: () => void; pause: () => void; resume: () => void; reset: () => void; refresh: () => void; isPaused: Ref<boolean>; simSpeed: Ref<number>; config: Ref<NpcSimulationConfig> } {
	const core: NpcSimulationCore = useNpcSimulationCore({
		getConfig: () => getConfig?.(),
		getFloors: () => getAllFloors?.() ?? [],
		getCanvas: () => getCanvas?.() ?? { w: 1600, h: 1000, tileSize: 25 },
		getViewFloorId: () => getFloor?.()?.id ?? null,
		idPrefix: 'npc-sim-',
		getAssetDef,
		getAssetTags,
		getManagedTags,
	})

	core.ingestConfig(getConfig?.())
	onUnmounted(core.stopLoop)

	watch(() => getConfig?.(), raw => core.ingestConfig(raw), { deep: true })

	watch(() => getFloor?.()?.id, floorId => {
		if (!floorId) return
		core.setViewFloorId(floorId)
	})

	watch(() => getFloor?.(), floor => {
		if (floor && floor.id === core.getViewFloorId()) core.refresh()
	}, { deep: true })

	watch(() => getCanvas?.(), () => {
		if (!core.isDeploymentActive()) return
		core.refresh()
	})

	return {
		npcs: core.npcs,
		frameDots: core.frameDots,
		deploy(floorId?: string, spawnFloorId?: string) {
			const view = floorId ?? getFloor?.()?.id
			const floors = getAllFloors?.() ?? []
			const canvas = getCanvas?.()
			const target = view && getFloorById ? getFloorById(view) : getFloor?.()
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
