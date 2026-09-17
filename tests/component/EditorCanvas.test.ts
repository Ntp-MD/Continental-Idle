import { describe, it, expect, beforeEach } from 'vitest'
import { ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import EditorCanvas from '@/blueprint-editor/components/canvas/EditorCanvas.vue'
import {
	createBlueprintStore, defaultSeed, STORE_KEY,
	type BlueprintStore, type PersistencePort, type SyncPort,
} from '@/blueprint-editor/store/index'
import { resolveBuildingArea } from '@/blueprint-editor/domain/geometry'

const BUILDING_RECT = 'rect[stroke-dasharray="4 4"]'

const persistence: PersistencePort = {
	async load() { return null },
	async save() { return true },
}
const sync: SyncPort = { emit() {} }

let store: BlueprintStore

function npcSimulationStub() {
	return {
		start: () => {},
		stop: () => {},
		npcs: ref([]),
		frameDots: new Map(),
		waitReasons: new Map(),
		arrivalMarks: new Map(),
		socialEvents: shallowRef([]),
	}
}

function mountCanvas() {
	return mount(EditorCanvas, {
		global: { provide: { npcSimulation: npcSimulationStub(), [STORE_KEY]: store } },
	})
}

function buildingRect(wrapper: ReturnType<typeof mountCanvas>) {
	const rect = wrapper.find(BUILDING_RECT)
	expect(rect.exists(), 'building area outline rect is rendered').toBe(true)
	return {
		x: Number(rect.attributes('x')),
		y: Number(rect.attributes('y')),
		w: Number(rect.attributes('width')),
		h: Number(rect.attributes('height')),
	}
}

describe('EditorCanvas building area', () => {
	beforeEach(() => {
		store = createBlueprintStore({ persistence, sync, seed: defaultSeed() })
		const floor = store.state.layout.floors[0]
		store.state.currentFloorId = floor.id
		store.state.layout.streetFloorId = floor.id
		store.state.layout.canvas = { width: 1600, height: 1200, tileSize: 25 }
		store.state.layout.streetWidthTiles = 8
	})

	it('draws the building outline at the resolved default street inset', () => {
		const wrapper = mountCanvas()
		const area = resolveBuildingArea(store.state.layout)
		expect(buildingRect(wrapper)).toEqual({ x: area.x, y: area.y, w: area.w, h: area.h })
		wrapper.unmount()
	})

	it('follows a changed streetWidthTiles instead of a fixed inset', () => {
		store.state.layout.streetWidthTiles = 12
		const wrapper = mountCanvas()
		const area = resolveBuildingArea(store.state.layout)
		expect(area.x).toBe(300)
		expect(buildingRect(wrapper)).toEqual({ x: area.x, y: area.y, w: area.w, h: area.h })
		wrapper.unmount()
	})
})