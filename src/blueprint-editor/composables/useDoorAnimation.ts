import { shallowRef, onUnmounted } from 'vue'
import type { DoorPanel } from '../assets/assetUtils'
import type { NpcSimDot } from '../domain/types'
import type { NpcEngineEvent } from '@/engine/npc'

export interface DoorAnimState {
	progress: number
	target: 0 | 1
	lastNearby: number
}

const DOOR_CLOSE_DELAY_MS = 1500
const DOOR_ANIM_SPEED = 0.08
const DOOR_PROXIMITY_TILES = 2

export interface DoorAnimationHost {
	getDoors(): DoorPanel[]
	getNpcs(): readonly NpcSimDot[]
	getTileSize(): number
	getDoorPassageEvents?(): readonly NpcEngineEvent[]
}

function matchDoorPanel(panels: readonly DoorPanel[], edgeFromX: number, edgeFromY: number, edgeToX: number, edgeToY: number, tileSize: number): DoorPanel | undefined {
	const midPx = ((edgeFromX + edgeToX) / 2) * tileSize
	const midPy = ((edgeFromY + edgeToY) / 2) * tileSize
	const halfTile = tileSize / 2
	for (const panel of panels) {
		if (panel.horizontal) {
			const minX = panel.cx - panel.length / 2
			const maxX = panel.cx + panel.length / 2
			if (midPx >= minX && midPx <= maxX && Math.abs(midPy - panel.cy) <= halfTile) return panel
		} else {
			const minY = panel.cy - panel.length / 2
			const maxY = panel.cy + panel.length / 2
			if (midPy >= minY && midPy <= maxY && Math.abs(midPx - panel.cx) <= halfTile) return panel
		}
	}
	return undefined
}

export function useDoorAnimation(host: DoorAnimationHost) {
	const doorStates = shallowRef<Map<string, DoorAnimState>>(new Map())
	let rafId: number | null = null
	let lastConsumedEventTick = -1

	function tick(now: number): void {
		const doors = host.getDoors()
		if (!doors.length) {
			rafId = requestAnimationFrame(tick)
			return
		}
		const tileSize = host.getTileSize()
		const proximityPx = DOOR_PROXIMITY_TILES * tileSize
		const npcs = host.getNpcs()
		const states = new Map(doorStates.value)

		const passageEvents = host.getDoorPassageEvents?.()
		if (passageEvents && passageEvents.length) {
			let maxTick = lastConsumedEventTick
			for (const evt of passageEvents) {
				if (evt.type !== 'door-passage' || evt.tick <= lastConsumedEventTick) continue
				if (!evt.doorEdge) continue
				const panel = matchDoorPanel(doors, evt.doorEdge.from.x, evt.doorEdge.from.y, evt.doorEdge.to.x, evt.doorEdge.to.y, tileSize)
				if (!panel) continue
				let state = states.get(panel.key)
				if (!state) { state = { progress: 0, target: 0, lastNearby: 0 }; states.set(panel.key, state) }
				state.target = 1
				state.lastNearby = now
				maxTick = Math.max(maxTick, evt.tick)
			}
			lastConsumedEventTick = maxTick
		}

		for (const door of doors) {
			let state = states.get(door.key)
			if (!state) { state = { progress: 0, target: 0, lastNearby: 0 }; states.set(door.key, state) }
			const nearby = npcs.some(n => {
				const dx = n.x - door.cx
				const dy = n.y - door.cy
				return Math.hypot(dx, dy) < proximityPx
			})
			if (nearby) { state.target = 1; state.lastNearby = now }
			else if (now - state.lastNearby > DOOR_CLOSE_DELAY_MS) state.target = 0
		}

		for (const door of doors) {
			const state = states.get(door.key)
			if (!state) continue
			state.progress += (state.target - state.progress) * DOOR_ANIM_SPEED
			if (Math.abs(state.progress - state.target) < 0.01) state.progress = state.target
		}
		doorStates.value = states
		rafId = requestAnimationFrame(tick)
	}

	function start(): void {
		if (rafId === null) rafId = requestAnimationFrame(tick)
	}

	function stop(): void {
		if (rafId !== null) cancelAnimationFrame(rafId)
		rafId = null
	}

	function reset(): void {
		doorStates.value = new Map()
		lastConsumedEventTick = -1
	}

	onUnmounted(stop)

	return {
		doorStates,
		start,
		stop,
		reset,
	}
}

export type DoorAnimation = ReturnType<typeof useDoorAnimation>
