import { shallowRef, onUnmounted } from 'vue'
import type { DoorPanel } from '../assets/assetUtils'
import type { NpcSimDot } from '../domain/types'
import type { NpcEngineEvent } from '@/engine/npc'

export interface DoorAnimState {
	progress: number
	target: 0 | 1
	/** Timestamp of the last close transition; null while the door has never closed. */
	lastClosed: number | null
	/** Timestamp of the last observed room occupancy; drives the auto-close stability hold. */
	lastOccupied: number | null
}

const DOOR_CLOSE_DELAY_MS = 1000
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
	const passageCounts = new Map<string, number>()

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
		let changed = false
		const cycleClosed = new Set<string>()
		const agentById = new Map(npcs.map(npc => [npc.id, npc]))

		function doorOccupied(door: DoorPanel): boolean {
			const prefix = `${door.key}|`
			for (const passageKey of passageCounts.keys()) {
				if (!passageKey.startsWith(prefix)) continue
				const status = agentById.get(passageKey.slice(prefix.length))?.status
				if (status === 'interacting' || status === 'chatting') return true
			}
		for (const npc of npcs) {
			if (npc.status !== 'interacting') continue
			if (Math.hypot(npc.x - door.cx, npc.y - door.cy) >= proximityPx) continue
			return true
		}
		return false
	}

	function doorRoomOccupied(door: DoorPanel, occupants: readonly NpcSimDot[]): boolean {
		if (!door.ownerObjectId) return false
		const ownerRef = `object:${door.ownerObjectId}`
		for (const npc of occupants) {
			if (npc.status !== 'interacting' && npc.status !== 'chatting') continue
			const key = npc.interactSpotKey ?? npc.interactTargetKey
			if (!key) continue
			const remainder = key.startsWith(`${npc.floorId}:`) ? key.slice(npc.floorId.length + 1) : key
			if (remainder === ownerRef || remainder.startsWith(`${ownerRef}:`)) return true
		}
		return false
	}

	function doorInTransit(door: DoorPanel): boolean {
		const prefix = `${door.key}|`
		for (const passageKey of passageCounts.keys()) {
			if (passageKey.startsWith(prefix)) return true
		}
		return false
	}

	function doorApproached(door: DoorPanel, occupants: readonly NpcSimDot[], proximityPx: number): boolean {
		for (const npc of occupants) {
			if (npc.status !== 'walking' && npc.status !== 'idle' && npc.status !== 'waiting') continue
			if (Math.hypot(npc.x - door.cx, npc.y - door.cy) >= proximityPx) continue
			return true
		}
		return false
	}

		const passageEvents = host.getDoorPassageEvents?.()
		if (passageEvents && passageEvents.length) {
			let maxTick = lastConsumedEventTick
			let batchMax = -1
			for (const evt of passageEvents) {
				if (evt.type === 'door-passage' && evt.doorEdge && evt.tick > batchMax) batchMax = evt.tick
			}
			if (batchMax >= 0 && lastConsumedEventTick >= 0 && batchMax < lastConsumedEventTick) {
				lastConsumedEventTick = -1
				passageCounts.clear()
				maxTick = -1
			}
			for (const evt of passageEvents) {
				if (evt.type !== 'door-passage' || evt.tick <= lastConsumedEventTick) continue
				if (!evt.doorEdge) continue
				const panel = matchDoorPanel(doors, evt.doorEdge.from.x, evt.doorEdge.from.y, evt.doorEdge.to.x, evt.doorEdge.to.y, tileSize)
				if (!panel) continue
				let state = states.get(panel.key)
				if (!state) { state = { progress: 0, target: 0, lastClosed: null, lastOccupied: null }; states.set(panel.key, state); changed = true }
				const cycleKey = `${panel.key}|${evt.agentId}`
				const count = (passageCounts.get(cycleKey) ?? 0) + 1
				if (count % 2 === 0) {
					passageCounts.delete(cycleKey)
					cycleClosed.add(panel.key)
				} else {
					passageCounts.set(cycleKey, count)
				}
				maxTick = Math.max(maxTick, evt.tick)
			}
			lastConsumedEventTick = maxTick
		}

		for (const door of doors) {
			if (cycleClosed.has(door.key)) continue
			let state = states.get(door.key)
			if (!state) { state = { progress: 0, target: 0, lastClosed: null, lastOccupied: null }; states.set(door.key, state); changed = true }
			if (door.mode === 'auto-close') {
				if (doorRoomOccupied(door, npcs)) {
					if (state.target !== 0) state.target = 0
					state.lastOccupied = now
					changed = true
					continue
				}
				if (doorInTransit(door)) {
					if (state.target !== 1) { state.target = 1; changed = true }
					continue
				}
				if (state.lastOccupied !== null && now - state.lastOccupied < DOOR_CLOSE_DELAY_MS) {
					if (state.target !== 0) { state.target = 0; changed = true }
					continue
				}
				if (doorApproached(door, npcs, proximityPx)) {
					if (state.target !== 1) { state.target = 1; changed = true }
					continue
				}
				if (state.target !== 0) { state.target = 0; changed = true }
				continue
			}
			if (doorOccupied(door)) {
				if (state.target !== 0) { state.target = 0; changed = true }
				continue
			}
			if (state.lastClosed !== null && now - state.lastClosed < DOOR_CLOSE_DELAY_MS) {
				if (state.target !== 0) { state.target = 0; changed = true }
				continue
			}
			if (state.target !== 1) { state.target = 1; changed = true }
		}

		for (const key of cycleClosed) {
			let state = states.get(key)
			if (!state) { state = { progress: 0, target: 0, lastClosed: null, lastOccupied: null }; states.set(key, state) }
			if (state.target !== 0) state.target = 0
			state.lastClosed = now
			changed = true
		}

		for (const door of doors) {
			const state = states.get(door.key)
			if (!state) continue
			const next = state.progress + (state.target - state.progress) * DOOR_ANIM_SPEED
			if (Math.abs(state.target - next) < 0.01) {
				if (state.progress !== state.target) { state.progress = state.target; changed = true }
			} else if (next !== state.progress) {
				state.progress = next
				changed = true
			}
		}
		if (changed) doorStates.value = states
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
		passageCounts.clear()
	}

	onUnmounted(stop)

	return {
		doorStates,
		start,
		stop,
		reset,
	}
}
