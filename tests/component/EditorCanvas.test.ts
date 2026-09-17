import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick, ref, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import EditorCanvas from '@/blueprint-editor/components/canvas/EditorCanvas.vue'
import {
	createBlueprintStore, STORE_KEY,
	type BlueprintStore, type PersistencePort, type SyncPort,
} from '@/blueprint-editor/store/index'
import { defaultSeed } from '@/blueprint-editor/store/seed'
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

const OVERLAY_TILE = '.editor__tile'

function objectOverlayGroup(wrapper: ReturnType<typeof mountCanvas>) {
	const group = wrapper.find('[data-obj-id]')
	expect(group.exists(), 'placed object renders its asset svg group').toBe(true)
	const wrapperEl = group.element.parentElement as Element
	const cells = Array.from(wrapperEl.querySelectorAll('.editor__tile'))
	expect(cells.length, 'walkable/wall overlay cells render for the object').toBeGreaterThan(0)
	return { group, cells }
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
		store.state.layout.canvas = { width: 1600, height: 1200, tileSize: 25, wallColor: '#ffffff' }
		store.state.layout.streetWidthTiles = 8
		store.state.layout.floors[0].objects = []
		localStorage.setItem(
			'blueprint-view-toggles',
			JSON.stringify({ showWalkableOverlay: false, showWallTiles: true, showGrid: true, showLabels: true, showBuildingBounds: true }),
		)
	})

	async function placeSvgObject() {
		const asset = store.state.assetRegistry.find((a) => a.svg)
		expect(asset, 'seed registry contains an svg asset').toBeTruthy()
		asset!.walkableGrid = [[false]]
		asset!.tileStates = [['blocked']]
		asset!.walkable = false
		const placed = await store.addObject(asset!.id, 400, 400)
		expect(placed, 'svg object placed').toBeTruthy()
		return placed!
	}

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

	it('never paints an opaque wall fill over a placed asset svg', async () => {
		await placeSvgObject()
		const wrapper = mountCanvas()
		const { group, cells } = objectOverlayGroup(wrapper)
		for (const cell of cells) {
			expect(cell.classList.contains('editor__tile--blocked'), 'forced blocked cell renders the wall tile').toBe(true)
			expect(cell.getAttribute('style') ?? '', 'wall cell carries no inline opaque fill').not.toContain('fill')
		}
		expect(group.find('path, rect, circle, ellipse, line').exists(), 'asset svg detail is injected').toBe(true)
		wrapper.unmount()
	})

	it('keeps overlays mounted while zooming instead of unmounting them mid-interaction', async () => {
		await placeSvgObject()
		const wrapper = mountCanvas()
		expect(wrapper.findAll(OVERLAY_TILE).length, 'overlay present at rest').toBeGreaterThan(0)

		const svg = wrapper.find('svg.editor__svg').element as SVGSVGElement
		const loose = svg as unknown as Record<string, unknown>
		loose.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform: () => ({ x: 400, y: 300 }) })
		loose.getScreenCTM = () => ({ inverse: () => ({}) })

		wrapper.find('.editor__canvas').element.dispatchEvent(
			new WheelEvent('wheel', { deltaY: -100, clientX: 100, clientY: 100, bubbles: true, cancelable: true }),
		)
		await nextTick()
		expect(wrapper.findAll(OVERLAY_TILE).length, 'overlay stays mounted while the zoom is still active').toBeGreaterThan(0)
		wrapper.unmount()
	})
})