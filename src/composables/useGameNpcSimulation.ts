import { onUnmounted, ref, watch, type Ref } from 'vue'
import type { NpcSimDot, NpcSimulationConfig, SyncedLayoutPayload } from '@/blueprint-editor/types'
import { useNpcSimulationCore, type NpcSimulationCore } from './useNpcSimulationCore'

function toObjectData(object: SyncedLayoutPayload['floors'][string]['objects'][number]) {
	return {
		id: object.id,
		type: object.type,
		x: object.x,
		y: object.y,
		w: object.w,
		h: object.h,
		rotation: object.rotation,
		fillColor: object.fillColor,
		label: object.label,
	}
}

function toFloors(payload: SyncedLayoutPayload) {
	return Object.keys(payload.floors)
		.sort((a, b) => {
			if (a === 'G') return -1
			if (b === 'G') return 1
			return Number(a) - Number(b)
		})
		.map(id => ({
			id,
			name: id,
			label: id,
			objects: payload.floors[id].objects.map(toObjectData),
			defaultWalkable: payload.floors[id].defaultWalkable,
			walkable: payload.floors[id].walkable,
			spawnZones: payload.floors[id].spawnZones,
			allowedRoleIds: payload.floors[id].allowedRoleIds,
		}))
}

export function useGameNpcSimulation(
	payloadRef: Ref<SyncedLayoutPayload | null>,
): { npcs: Ref<NpcSimDot[]>; deploy: () => void; start: () => void; stop: () => void; pause: () => void; resume: () => void; reset: () => void; isPaused: Ref<boolean>; simSpeed: Ref<number>; config: Ref<NpcSimulationConfig>; currentFloorId: Ref<string | null>; setFloor: (floorId: string) => void } {
	const currentFloorId = ref<string | null>(null)

	const core: NpcSimulationCore = useNpcSimulationCore({
		getConfig: () => payloadRef.value?.npcConfig as NpcSimulationConfig | undefined,
		getFloors: () => (payloadRef.value ? toFloors(payloadRef.value) : []),
		getCanvas: () => ({
			w: payloadRef.value?.canvas.width ?? 1600,
			h: payloadRef.value?.canvas.height ?? 1000,
			tileSize: payloadRef.value?.canvas.tileSize ?? 25,
			streetTiles: payloadRef.value?.canvas.streetWidthTiles,
		},
		getViewFloorId: () => currentFloorId.value,
		idPrefix: 'npc-game-',
		syncIntervalMs: 16,
	})

	function deploy(): void {
		const payload = payloadRef.value
		if (!payload) return
		const floors = toFloors(payload)
		if (!floors.length) return
		core.deploy(floors, { w: payload.canvas.width, h: payload.canvas.height, tileSize: payload.canvas.tileSize }, floors[0].id)
		currentFloorId.value = floors[0].id
	}

	onUnmounted(core.stopLoop)

	watch(() => payloadRef.value, () => {
		core.ingestConfig(payloadRef.value?.npcConfig as NpcSimulationConfig | undefined)
		if (!core.isDeploymentActive() && payloadRef.value) deploy()
		else if (core.isDeploymentActive()) core.refresh()
	}, { deep: true })

	return {
		npcs: core.npcs,
		deploy,
		start: core.start,
		stop() {
			core.clearDeployment()
			core.stopLoop()
		},
		pause: () => { core.isPaused.value = true },
		resume: () => { core.isPaused.value = false },
		reset: core.reset,
		isPaused: core.isPaused,
		simSpeed: core.simSpeed,
		config: core.config,
		currentFloorId,
		setFloor(floorId: string) {
			currentFloorId.value = floorId
			core.setViewFloorId(floorId)
		},
	}
}
